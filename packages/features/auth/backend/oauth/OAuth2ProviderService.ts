/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import dns from 'node:dns/promises';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as htmlParser from 'node-html-parser';
import httpLinkHeader from 'http-link-header';
import ipaddr from 'ipaddr.js';
import fastifyCors from '@fastify/cors';
import { verifyChallenge } from 'pkce-challenge';
import { permissions as kinds } from 'misskey-js';
import {
	AccessDeniedError,
	InvalidGrantError,
	InvalidRequestError,
	InvalidScopeError,
	OAuthProviderError,
	UnsupportedGrantTypeError,
	UnsupportedResponseTypeError,
} from './errors.js';
import { secureRndstr } from '../utility/secure-rndstr.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import type { AccessTokensRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as Redis from 'ioredis';
import { OAuthStateStore } from './OAuthStateStore.js';
import { fetchOAuthClientMetadata } from './ClientMetadataFetcher.js';
import { LoggerService } from '@features/runtime/backend/services/LoggerService.js';
import { Logger } from '@features/runtime/backend/logging/logger.js';
import { StatusError } from '@features/runtime/backend/http/status-error.js';
import { HtmlTemplateService } from '@features/web/backend/http/HtmlTemplateService.js';
import { OAuthPage } from '@features/auth/backend/templates/oauth.js';
import type { FastifyInstance, FastifyReply } from 'fastify';

// TODO: Consider migrating to @node-oauth/oauth2-server once
// https://github.com/node-oauth/node-oauth2-server/issues/180 is figured out.
// Upstream the various validations and RFC9207 implementation in that case.

// Follows https://indieauth.spec.indieweb.org/#client-identifier
// This is also mostly similar to https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation
// although Google has stricter rule.
function validateClientId(raw: string): URL {
	// "Clients are identified by a [URL]."
	const url = ((): URL => {
		try {
			return new URL(raw);
		} catch {
			throw new InvalidRequestError('client_id must be a valid URL');
		}
	})();

	// "Client identifier URLs MUST have either an https or http scheme"
	// But then again:
	// https://datatracker.ietf.org/doc/html/rfc6749.html#section-3.1.2.1
	// 'The redirection endpoint SHOULD require the use of TLS as described
	// in Section 1.6 when the requested response type is "code" or "token"'
	const allowedProtocols = process.env.NODE_ENV === 'test' ? ['http:', 'https:'] : ['https:'];
	if (!allowedProtocols.includes(url.protocol)) {
		throw new InvalidRequestError('client_id must be a valid HTTPS URL');
	}

	// "MUST contain a path component (new URL() implicitly adds one)"

	// "MUST NOT contain single-dot or double-dot path segments,"
	const segments = url.pathname.split('/');
	if (segments.includes('.') || segments.includes('..')) {
		throw new InvalidRequestError('client_id must not contain dot path segments');
	}

	// ("MAY contain a query string component")

	// "MUST NOT contain a fragment component"
	if (url.hash) {
		throw new InvalidRequestError('client_id must not contain a fragment component');
	}

	// "MUST NOT contain a username or password component"
	if (url.username || url.password) {
		throw new InvalidRequestError('client_id must not contain a username or a password');
	}

	// ("MAY contain a port")

	// "host names MUST be domain names or a loopback interface and MUST NOT be
	// IPv4 or IPv6 addresses except for IPv4 127.0.0.1 or IPv6 [::1]."
	if (!url.hostname.match(/\.\w+$/) && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
		throw new InvalidRequestError('client_id must have a domain name as a host name');
	}

	return url;
}

interface ClientInformation {
	id: string;
	cimd: boolean;
	redirectUris: string[];
	name: string;
	logo: string | null;
}

interface OAuthRequestParameters {
	[key: string]: string | string[] | undefined;
}

interface AuthorizationRequest {
	clientId: string;
	redirectUri: string;
	state?: string;
	scopes: string[];
	codeChallenge: string;
	codeChallengeMethod: string;
	resource?: string;
}

interface AuthorizationRequestSeed {
	clientInfo: ClientInformation;
	clientId: string;
	redirectUri: string;
	state?: string;
	requestedScope: string[];
	resource?: string;
	codeChallenge?: string;
	codeChallengeMethod?: string;
}

interface AuthorizationTransaction {
	client: ClientInformation;
	request: AuthorizationRequest;
}

interface AuthorizationCodeGrant {
	clientId: string;
	cimd: boolean;
	userId: string;
	redirectUri: string;
	codeChallenge: string;
	scopes: string[];
	resource?: string;
}

function parseMicroformats(doc: htmlParser.HTMLElement, baseUrl: string, id: string): { name: string | null; logo: string | null; } {
	let name: string | null = null;
	let logo: string | null = null;

	const hApp = doc.querySelector('.h-app');
	if (hApp == null) return { name, logo };

	const nameEl = hApp.querySelector('.p-name');
	if (nameEl != null) {
		const href = nameEl.attributes.href || nameEl.attributes.src;
		if (href != null && new URL(href, baseUrl).toString() === new URL(id).toString()) {
			name = nameEl.textContent.trim();
		}
	}

	const logoEl = hApp.querySelector('.u-logo');
	if (logoEl != null) {
		const href = logoEl.attributes.href || logoEl.attributes.src;
		if (href != null) {
			logo = new URL(href, baseUrl).toString();
		}
	}

	return { name, logo };
}

async function discoverClientInformation(logger: Logger, httpRequestService: HttpRequestService, id: string, metadataFetcher?: typeof fetchOAuthClientMetadata, requireCimd = false): Promise<ClientInformation> {
	try {
		const res = await (metadataFetcher ? metadataFetcher(id) : httpRequestService.send(id));

		const redirectUris: string[] = [];
		let name = id;
		let logo: string | null = null;
		let cimd = false;

		// https://indieauth.spec.indieweb.org/#redirect-url
		// "The client SHOULD publish one or more <link> tags or Link HTTP headers with a rel attribute
		// of redirect_uri at the client_id URL.
		// Authorization endpoints verifying that a redirect_uri is allowed for use by a client MUST
		// look for an exact match of the given redirect_uri in the request against the list of
		// redirect_uris discovered after resolving any relative URLs."
		const linkHeader = res.headers.get('link');
		if (linkHeader) {
			redirectUris.push(...httpLinkHeader.parse(linkHeader).get('rel', 'redirect_uri').map(link => link.uri));
		}

		const contentType = res.headers.get('content-type');
		const mediaType = contentType ? contentType.split(';')[0].trim().toLowerCase() : null;
		if (mediaType === 'application/json') {
			// Client discovery via JSON document (11 July 2024 spec)
			// https://indieauth.spec.indieweb.org/#client-metadata
			// "Clients SHOULD have a JSON [RFC7159] document at their client_id URL containing
			// client metadata defined in [RFC7591], the minimum properties for an IndieAuth
			// client defined below."

			const document: unknown = await res.json();
			if (document === null || typeof document !== 'object' || Array.isArray(document)) {
				throw new InvalidRequestError('Invalid client metadata document');
			}
			const json = document as {
				client_id: string;
				client_name?: string;
				client_uri: string;
				logo_uri?: string;
				redirect_uris?: string[];
				token_endpoint_auth_methods_supported?: unknown;
				token_endpoint_auth_method?: unknown;
				grant_types?: unknown;
				response_types?: unknown;
			};

			// https://indieauth.spec.indieweb.org/#client-metadata-li-1
			// "The authorization server MUST verify that the client_id in the document matches the
			// client_id of the URL where the document was retrieved."
			// Recognize the client format from its document, independently of the requested resource.
			// Root/HTTP legacy discovery keeps IndieAuth JSON even with optional RFC7591 auth fields.
			const legacyClientUri = typeof json.client_uri === 'string' && json.client_uri.length > 0 && new URL(id).href.startsWith(json.client_uri);
			cimd = !legacyClientUri || (metadataFetcher !== undefined && (json.token_endpoint_auth_methods_supported !== undefined || json.token_endpoint_auth_method !== undefined));
			if (requireCimd && !cimd) throw new InvalidRequestError('Resource authorization requires CIMD client metadata');
			if (cimd && !metadataFetcher) throw new InvalidRequestError('CIMD requires an HTTPS client ID with a non-root path');
			if (json.client_id !== (cimd ? id : new URL(id).href)) {
				throw new InvalidRequestError('client_id in the document does not match the client_id URL');
			}

			if (cimd) {
				if (typeof json.client_name !== 'string' || !json.client_name.trim() || json.client_name.length > 256) {
					throw new InvalidRequestError('Client metadata requires a client_name');
				}
				// The plural capability list takes precedence over the legacy preference.
				const methods = json.token_endpoint_auth_methods_supported !== undefined ? json.token_endpoint_auth_methods_supported : [json.token_endpoint_auth_method ?? 'client_secret_basic'];
				if (!Array.isArray(methods) || !methods.every(method => typeof method === 'string') || !methods.includes('none')) {
					throw new InvalidRequestError('Client does not support public-client authentication');
				}
				if (!Array.isArray(json.redirect_uris) || json.redirect_uris.length === 0 || !json.redirect_uris.every(uri => typeof uri === 'string')) {
					throw new InvalidRequestError('Client redirect_uris must be a nonempty string array');
				}
				for (const uri of json.redirect_uris) {
					let redirect: URL;
					try {
						redirect = new URL(uri);
					} catch {
						throw new InvalidRequestError('Invalid client redirect URI');
					}
					if (redirect.protocol !== 'https:' || redirect.username || redirect.password || redirect.hash) {
						throw new InvalidRequestError('Invalid client redirect URI');
					}
				}
				if ((json.grant_types !== undefined && (!Array.isArray(json.grant_types) || !json.grant_types.every(value => typeof value === 'string') || !json.grant_types.includes('authorization_code'))) ||
					(json.response_types !== undefined && (!Array.isArray(json.response_types) || !json.response_types.every(value => typeof value === 'string') || !json.response_types.includes('code')))) {
					throw new InvalidRequestError('Client does not support authorization code');
				}
				// CIMD redirect values are absolute and compared exactly, not URL-normalized.
				redirectUris.length = 0;
				redirectUris.push(...json.redirect_uris);
			}

			if (typeof json.client_name === 'string') {
				name = json.client_name;
			}

			if (typeof json.logo_uri === 'string') {
				// Since uri can be relative, resolve it against the document URL
				logo = new URL(json.logo_uri, res.url).toString();
			}

			if (!cimd && Array.isArray(json.redirect_uris)) {
				redirectUris.push(...json.redirect_uris.filter((uri): uri is string => typeof uri === 'string'));
			}
		} else {
			if (requireCimd) throw new InvalidRequestError('Resource authorization requires application/json client metadata');
			// Client discovery via HTML microformats (12 February 2022 spec)
			// https://indieauth.spec.indieweb.org/20220212/#client-information-discovery
			// "Authorization servers SHOULD support parsing the [h-app] Microformat from the client_id,
			// and if there is an [h-app] with a url property matching the client_id URL,
			// then it should use the name and icon and display them on the authorization prompt."
			const text = await res.text();
			const doc = htmlParser.parse(`<div>${text}</div>`);

			redirectUris.push(...[...doc.querySelectorAll('link[rel=redirect_uri][href]')].map(el => el.attributes.href));

			if (text) {
				const microformats = parseMicroformats(doc, res.url, id);
				if (typeof microformats.name === 'string') {
					name = microformats.name;
				}
				if (typeof microformats.logo === 'string') {
					logo = microformats.logo;
				}
			}
		}

		return {
			id: cimd ? id : new URL(id).href,
			cimd,
			redirectUris: cimd ? redirectUris : redirectUris.map(uri => new URL(uri, res.url).toString()),
			name: typeof name === 'string' ? name : id,
			logo,
		};
	} catch (err) {
		logger.error('Error while fetching client information');
		if (err instanceof StatusError) {
			throw new InvalidRequestError('Failed to fetch client information');
		}
		if (err instanceof OAuthProviderError) {
			throw err;
		}

		const wrapped = new InvalidRequestError('Failed to parse client information');
		wrapped.status = 500;
		wrapped.statusCode = 500;
		wrapped.error = 'server_error';
		throw wrapped;
	}
}

function firstValue(value: unknown | unknown[] | undefined): string | undefined {
	if (Array.isArray(value)) throw new InvalidRequestError('Repeated OAuth parameter');
	if (typeof value === 'string' && value.length > 4096) throw new InvalidRequestError('OAuth parameter is too long');
	return typeof value === 'string' ? value : undefined;
}

function normalizeScope(scope: string | string[] | undefined): string[] {
	const raw = Array.isArray(scope) ? scope : scope != null ? [scope] : [];
	return raw.flatMap(value => value.split(/\s+/)).filter(Boolean);
}

function parseUrlEncodedParameters(rawBody: string): OAuthRequestParameters {
	const parsed: OAuthRequestParameters = {};
	for (const [key, value] of new URLSearchParams(rawBody).entries()) {
		const current = parsed[key];
		if (current == null) {
			parsed[key] = value;
		} else if (Array.isArray(current)) {
			current.push(value);
		} else {
			parsed[key] = [current, value];
		}
	}

	return parsed;
}

function toRequestParameters(body: unknown): OAuthRequestParameters {
	if (typeof body === 'string') {
		return parseUrlEncodedParameters(body);
	}

	if (body instanceof URLSearchParams) {
		return parseUrlEncodedParameters(body.toString());
	}

	if (body == null || typeof body !== 'object' || Array.isArray(body)) {
		return {};
	}

	return Object.fromEntries(Object.entries(body).filter(([_, value]) => (
		typeof value === 'string' ||
		(Array.isArray(value) && value.every(v => typeof v === 'string'))
	)));
}

function applyNoStore(reply: FastifyReply): void {
	reply.header('Cache-Control', 'no-store');
	reply.header('Pragma', 'no-cache');
}

function createUnsupportedResponseTypeError(): OAuthProviderError {
	const error = new UnsupportedResponseTypeError();
	error.status = 501;
	error.statusCode = 501;
	return error;
}

function createForbiddenAccessDenied(description: string): OAuthProviderError {
	const error = new AccessDeniedError(description);
	error.status = 403;
	error.statusCode = 403;
	return error;
}

function normalizeOAuthProviderError(error: unknown): OAuthProviderError {
	if (error instanceof OAuthProviderError) {
		return error;
	}

	const wrapped = new InvalidRequestError('request is invalid');
	return wrapped;
}

function sendOAuthProviderError(reply: FastifyReply, error: OAuthProviderError): void {
	applyNoStore(reply);
	reply.code(error.statusCode ?? error.status ?? 400);
	reply.send({
		error: error.error,
		...(error.expose && error.error_description ? { error_description: error.error_description } : {}),
	});
}

function appendIssuer(payload: Record<string, string>, issuerUrl: string): Record<string, string> {
	return {
		...payload,

		// https://datatracker.ietf.org/doc/html/rfc9207#name-response-parameter-iss
		// "In authorization responses to the client, including error responses,
		// an authorization server supporting this specification MUST indicate its
		// identity by including the iss parameter in the response."
		iss: issuerUrl,
	};
}

function redirectWithQuery(reply: FastifyReply, redirectUriString: string, payload: Record<string, string>): void {
	applyNoStore(reply);

	const redirectUri = new URL(redirectUriString);
	for (const [key, value] of Object.entries(payload)) {
		redirectUri.searchParams.set(key, value);
	}

	reply.code(302).redirect(redirectUri.toString());
}

function registerFormBodyParser(fastify: FastifyInstance): void {
	if (fastify.hasContentTypeParser('application/x-www-form-urlencoded')) {
		return;
	}

	fastify.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (_request, body, done) => {
		try {
			done(null, parseUrlEncodedParameters(typeof body === 'string' ? body : body.toString('utf8')));
		} catch (error) {
			done(error as Error, undefined);
		}
	});
}

@Injectable()
export class OAuth2ProviderService implements OnApplicationShutdown {
	#state: OAuthStateStore;
	#logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,
		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		private idService: IdService,
		private httpRequestService: HttpRequestService,
		private cacheService: CacheService,
		private htmlTemplateService: HtmlTemplateService,
		loggerService: LoggerService,
		@Inject(DI.redis) redis: Redis.Redis,
	) {
		this.#state = new OAuthStateStore(redis);
		this.#logger = loggerService.getLogger('oauth');
	}

	/** Production metadata uses a direct, bounded public-network fetcher. */
	public async fetchClientMetadata(id: string) {
		return await fetchOAuthClientMetadata(id);
	}

	async #resolveAuthorizationRequest(params: OAuthRequestParameters): Promise<AuthorizationRequestSeed> {
		const clientId = firstValue(params.client_id);
		const redirectUriValue = firstValue(params.redirect_uri);
		const responseType = firstValue(params.response_type);
		const state = firstValue(params.state);
		const codeChallenge = firstValue(params.code_challenge);
		const codeChallengeMethod = firstValue(params.code_challenge_method);
		const requestedScope = normalizeScope(params.scope);
		const resource = firstValue(params.resource);
		this.#validateResource(resource, requestedScope);

		this.#logger.info('Validating authorization parameters');

		if (responseType !== 'code') {
			throw createUnsupportedResponseTypeError();
		}

		if (!clientId) {
			throw new InvalidRequestError('client_id must be provided');
		}

		const clientUrl = validateClientId(clientId);
		const strictRetrieval = resource !== undefined || (clientUrl.protocol === 'https:' && clientUrl.pathname !== '/');

		// https://indieauth.spec.indieweb.org/#client-information-discovery
		// "the server may want to resolve the domain name first and avoid fetching the document
		// if the IP address is within the loopback range defined by [RFC5735]
		// or any other implementation-specific internal IP address."
		if (!strictRetrieval && (process.env.NODE_ENV !== 'test' || process.env.MISSKEY_TEST_CHECK_IP_RANGE === '1')) {
			const lookup = await dns.lookup(clientUrl.hostname);
			if (ipaddr.parse(lookup.address).range() !== 'unicast') {
				throw new InvalidRequestError('client_id resolves to disallowed IP range.');
			}
		}

		// Find client information from the remote.
		const clientInfo = await discoverClientInformation(this.#logger, this.httpRequestService, strictRetrieval ? clientId : clientUrl.href, strictRetrieval ? this.fetchClientMetadata.bind(this) : undefined, resource !== undefined);

		// Require the redirect URI to be included in an explicit list, per
		// https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics#section-4.1.3
		if (!redirectUriValue || !clientInfo.redirectUris.includes(redirectUriValue)) {
			throw new InvalidRequestError('Invalid redirect_uri');
		}

		return {
			clientInfo,
			clientId: clientInfo.id,
			redirectUri: redirectUriValue,
			state,
			requestedScope,
			resource,
			codeChallenge,
			codeChallengeMethod,
		};
	}

	#finalizeAuthorizationRequest(seed: AuthorizationRequestSeed): AuthorizationRequest {
		const scopes = [...new Set(seed.requestedScope)].filter(scope => (<readonly string[]>kinds).includes(scope));
		if (!seed.requestedScope.length || !scopes.length) {
			throw new InvalidScopeError('`scope` parameter has no known scope', seed.requestedScope.join(' '));
		}

		// Require PKCE parameters.
		// Recommended by https://indieauth.spec.indieweb.org/#authorization-request, but also prevents downgrade attack:
		// https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics#name-pkce-downgrade-attack
		if (typeof seed.codeChallenge !== 'string') {
			throw new InvalidRequestError('`code_challenge` parameter is required');
		}
		if (!/^[A-Za-z0-9_-]{43}$/.test(seed.codeChallenge)) {
			throw new InvalidRequestError('Invalid S256 code_challenge');
		}
		if (seed.codeChallengeMethod !== 'S256') {
			throw new InvalidRequestError('`code_challenge_method` parameter must be set as S256');
		}

		return {
			clientId: seed.clientId,
			redirectUri: seed.redirectUri,
			state: seed.state,
			scopes,
			codeChallenge: seed.codeChallenge,
			codeChallengeMethod: seed.codeChallengeMethod,
			resource: seed.resource,
		};
	}

	async #findUserByLoginToken(loginToken: string): Promise<MiLocalUser> {
		const user = await this.cacheService.localUserByNativeTokenCache.fetch(loginToken,
			() => this.usersRepository.findOneBy({ token: loginToken }) as Promise<MiLocalUser | null>);
		if (!user) {
			throw new InvalidRequestError('No such user');
		}

		return user;
	}

	#validateResource(resource: string | undefined, scopes: string[]): void {
		const canonical = new URL('/mcp', this.config.url).href;
		if ((resource !== undefined && resource !== canonical) || (scopes.includes('access:mcp') && resource !== canonical)) {
			throw new InvalidRequestError('Invalid or missing resource');
		}
	}

	// https://datatracker.ietf.org/doc/html/rfc8414.html
	// https://indieauth.spec.indieweb.org/#indieauth-server-metadata
	public generateRFC8414() {
		return {
			issuer: this.config.url,
			authorization_endpoint: new URL('/oauth/authorize', this.config.url),
			token_endpoint: new URL('/oauth/token', this.config.url),
			scopes_supported: kinds,
			response_types_supported: ['code'],
			grant_types_supported: ['authorization_code'],
			token_endpoint_auth_methods_supported: ['none'],
			client_id_metadata_document_supported: true,
			service_documentation: 'https://misskey-hub.net',
			code_challenge_methods_supported: ['S256'],
			authorization_response_iss_parameter_supported: true,
		};
	}

	@bindThis
	public async createServer(fastify: FastifyInstance): Promise<void> {
		registerFormBodyParser(fastify);

		fastify.addHook('onRequest', (request, reply, done) => {
			// クリックジャッキング防止のためiFrameの中に入れられないようにする
			reply.header('X-Frame-Options', 'DENY');
			reply.header('Content-Security-Policy', "frame-ancestors 'none'");
			done();
		});

		fastify.get('/authorize', { config: { sensitiveAccessLogBody: true } }, async (request, reply) => {
			let validatedRedirectUri: string | undefined;
			let state: string | undefined;

			try {
				const seed = await this.#resolveAuthorizationRequest(request.query as OAuthRequestParameters);
				const { clientInfo } = seed;
				validatedRedirectUri = seed.redirectUri;
				state = seed.state;
				const authorizationRequest = this.#finalizeAuthorizationRequest(seed);

				const transactionId = secureRndstr(128);
				await this.#state.putTransaction(transactionId, {
					client: clientInfo,
					request: authorizationRequest,
				});

				this.#logger.info('Rendering authorization page');

				applyNoStore(reply);
				return await HtmlTemplateService.replyHtml(reply, OAuthPage({
					...await this.htmlTemplateService.getCommonData(),
					transactionId,
					clientName: clientInfo.name,
					clientLogo: clientInfo.logo ?? undefined,
					scope: authorizationRequest.scopes,
				}));
			} catch (error) {
				const OAuthProviderError = normalizeOAuthProviderError(error);
				if (validatedRedirectUri && OAuthProviderError.allow_redirect && OAuthProviderError.error !== 'unsupported_response_type') {
					redirectWithQuery(reply, validatedRedirectUri, appendIssuer({
						error: OAuthProviderError.error,
						...(state ? { state } : {}),
					}, this.config.url));
					return;
				}

				sendOAuthProviderError(reply, OAuthProviderError);
			}
		});

		fastify.post('/decision', { config: { sensitiveAccessLogBody: true } }, async (request, reply) => {
			try {
				const body = toRequestParameters(request.body);
				const transactionId = firstValue(body.transaction_id);
				if (!transactionId) {
					throw new InvalidRequestError('Missing transaction ID');
				}

				const transaction = await this.#state.takeTransaction<AuthorizationTransaction>(transactionId);
				if (!transaction) {
					throw createForbiddenAccessDenied('Invalid or expired transaction ID');
				}

				const cancel = !!firstValue(body.cancel);
				this.#logger.info(`Received the decision. Cancel: ${cancel}`);
				if (cancel) {
					redirectWithQuery(reply, transaction.request.redirectUri, appendIssuer({
						error: 'access_denied',
						...(transaction.request.state ? { state: transaction.request.state } : {}),
					}, this.config.url));
					return;
				}

				const loginToken = firstValue(body.login_token);
				if (!loginToken) {
					throw new InvalidRequestError('No user');
				}

				this.#logger.info('Checking user consent');
				const user = await this.#findUserByLoginToken(loginToken);

				this.#logger.info('Issuing authorization code after consent');

				const code = secureRndstr(128);
				await this.#state.putCode(code, {
					clientId: transaction.client.id,
					cimd: transaction.client.cimd,
					userId: user.id,
					redirectUri: transaction.request.redirectUri,
					codeChallenge: transaction.request.codeChallenge,
					scopes: transaction.request.scopes,
					resource: transaction.request.resource,
				});

				redirectWithQuery(reply, transaction.request.redirectUri, appendIssuer({
					code,
					...(transaction.request.state ? { state: transaction.request.state } : {}),
				}, this.config.url));
			} catch (error) {
				sendOAuthProviderError(reply, normalizeOAuthProviderError(error));
			}
		});

		fastify.all('/*', { config: { sensitiveAccessLogBody: true } }, async (_request, reply) => {
			reply.code(404);
			reply.send({
				error: {
					message: 'Unknown OAuth endpoint.',
					code: 'UNKNOWN_OAUTH_ENDPOINT',
					id: 'aa49e620-26cb-4e28-aad6-8cbcb58db147',
					kind: 'client',
				},
			});
		});
	}

	@bindThis
	public async createTokenServer(fastify: FastifyInstance): Promise<void> {
		registerFormBodyParser(fastify);
		fastify.register(fastifyCors);

		fastify.post('', { config: { sensitiveAccessLogBody: true } }, async (request, reply) => {
			applyNoStore(reply);

			try {
				const body = toRequestParameters(request.body);
				const grantType = firstValue(body.grant_type);
				if (!grantType) {
					throw new InvalidRequestError('grant_type is required');
				}
				if (grantType !== 'authorization_code') {
					throw new UnsupportedGrantTypeError();
				}

				const code = firstValue(body.code);
				const clientId = firstValue(body.client_id);
				const redirectUriValue = firstValue(body.redirect_uri);
				const codeVerifier = firstValue(body.code_verifier);
				const resource = firstValue(body.resource);
				const clientSecret = firstValue(body.client_secret);
				if ((clientSecret !== undefined && clientSecret !== '') || body.client_assertion !== undefined || body.client_assertion_type !== undefined || request.headers.authorization !== undefined) {
					throw new InvalidRequestError('Only public-client authentication is supported');
				}

				this.#logger.info('Checking the received authorization code for the exchange');
				if (!code) {
					throw new InvalidGrantError('grant request is invalid');
				}

				const claim = await this.#state.claimCode<AuthorizationCodeGrant>(code);
				if (!claim.claimed || !claim.grant) {
					if (claim.replayTokenId) await this.accessTokensRepository.delete({ id: claim.replayTokenId });
					throw new InvalidGrantError('grant request is invalid');
				}
				const granted = claim.grant;
				if (granted.cimd && body.client_secret !== undefined) throw new InvalidRequestError('Only public-client authentication is supported');
				if (resource !== granted.resource) throw new InvalidGrantError('grant request is invalid');
				this.#validateResource(resource, granted.scopes);

				// https://datatracker.ietf.org/doc/html/rfc6749.html#section-4.1.3
				if (clientId !== granted.clientId || redirectUriValue !== granted.redirectUri) {
					throw new InvalidGrantError('grant request is invalid');
				}

				// https://datatracker.ietf.org/doc/html/rfc7636.html#section-4.6
				if (!codeVerifier || !/^[A-Za-z0-9._~-]{43,128}$/.test(codeVerifier)) {
					throw new InvalidGrantError('grant request is invalid');
				}

				const challengeResult = await verifyChallenge(codeVerifier, granted.codeChallenge);
				if (!challengeResult) {
					throw new InvalidGrantError('grant request is invalid');
				}

				const accessToken = secureRndstr(128);
				const now = new Date();

				const tokenId = this.idService.gen(now.getTime());

				// Retain the row identifier before insertion so a worker crash does not hide it from replay cleanup.
				if (!await this.#state.publishToken(code, tokenId)) throw new InvalidGrantError('grant request is invalid');

				// NOTE: we don't have a setup for automatic token expiration
				await this.accessTokensRepository.insert({
					id: tokenId,
					lastUsedAt: now,
					userId: granted.userId,
					token: accessToken,
					hash: accessToken,
					name: granted.clientId,
					permission: granted.scopes,
				});

				try {
					if (!await this.#state.publishToken(code, tokenId)) throw new InvalidGrantError('grant request is invalid');
				} catch (error) {
					await this.accessTokensRepository.delete({ id: tokenId });
					throw error;
				}
				this.#logger.info('Generated OAuth access token');

				reply.send({
					access_token: accessToken,
					token_type: 'Bearer',
					scope: granted.scopes.join(' '),
				});
			} catch (error) {
				sendOAuthProviderError(reply, normalizeOAuthProviderError(error));
			}
		});

		fastify.all('/*', { config: { sensitiveAccessLogBody: true } }, async (_request, reply) => {
			applyNoStore(reply);
			reply.code(404).send({ error: 'invalid_request', error_description: 'Unknown OAuth endpoint' });
		});
	}

	@bindThis
	public dispose(): void {
		// State expires in shared Redis; this service does not own the Redis connection.
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
