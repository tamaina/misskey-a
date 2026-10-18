/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { oidcContract } from './oidc.contract.js';
import type { OidcRuntime, OidcLocalIdentity } from './oidc-runtime.js';
import { toWebAuthnAuthenticationOptions } from './webauthn.schema.js';

const failed = () => apiError({ code: 'OIDC_FAILED', status: 400, message: 'External sign-in failed. Start again.', id: 'fd204086-cbf2-47d9-9475-c910bd68c7b9' });
const cookieName = (ticket: string) => `__Host-mk-oidc-${ticket}`;

function browserSecret(context: ApiContext, ticket: string) {
	const header = context.headers.cookie;
	if (typeof header !== 'string') throw failed();
	const matches = header.split(';').map(part => part.trim()).filter(part => part.startsWith(`${cookieName(ticket)}=`));
	if (matches.length !== 1) throw failed();
	const secret = matches[0].slice(cookieName(ticket).length + 1);
	if (!/^[A-Za-z0-9_-]{43}$/.test(secret)) throw failed();
	return secret;
}

function setCookie(context: ApiContext, ticket: string, secret: string, clear = false) {
	if (!context.response) throw failed();
	context.response.header('Set-Cookie', `${cookieName(ticket)}=${clear ? '' : secret}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : 300}`);
	context.response.header('Cache-Control', 'no-store');
}

function local(context: { principal: MiLocalUser | null; browserSession?: OidcLocalIdentity['browserSession']; token?: OidcLocalIdentity['accessToken'] }): OidcLocalIdentity {
	if (!context.principal || !context.browserSession || context.token != null || context.browserSession.userId !== context.principal.id) throw failed();
	return { userId: context.principal.id, browserSession: context.browserSession, accessToken: context.token };
}

async function safe<T>(run: () => Promise<T>): Promise<T> { try { return await run(); } catch { throw failed(); } }

export function createOidcRouter(runtime?: OidcRuntime, serverUrl?: string) {
	const get = () => { if (!runtime) throw failed(); return runtime; };
	const origin = (context: ApiContext) => {
		if (!serverUrl || context.headers.origin !== new URL(serverUrl).origin) throw failed();
		context.response?.header('Cache-Control', 'no-store');
	};
	const api = createApiProcedure<MiLocalUser>();
	const start = async (context: ApiContext, providerId: string, identity?: OidcLocalIdentity) => {
		origin(context);
		const result = await get().begin(providerId, identity);
		setCookie(context, result.state, result.browserSecret);
		return { url: result.url };
	};
	return {
		'oidc/providers': api(oidcContract['oidc/providers']).handler(() => safe(() => get().listProviders())),
		'oidc/start': api(oidcContract['oidc/start']).handler(({ input, context }) => safe(() => start(context, input.providerId))),
		'oidc/callback': api(oidcContract['oidc/callback']).handler(({ input, context }) => safe(async () => {
			origin(context); const secret = browserSecret(context, input.state);
			const result = await get().callback(input.providerId, input.state, secret, input.code);
			if (result.canceled === true) { setCookie(context, input.state, secret, true); return { canceled: true as const }; }
			// A new opaque cookie replaces the consumed authorization transaction binding.
			setCookie(context, result.ticket, secret);
			const { ticket, ...flow } = result;
			return { ticket, flow: { ...flow, ...('options' in flow && flow.options ? { options: toWebAuthnAuthenticationOptions(flow.options) } : {}) } };
		})),
		'oidc/status': api(oidcContract['oidc/status']).handler(({ input, context }) => safe(async () => {
			origin(context); const flow = await get().status(input.ticket, browserSecret(context, input.ticket));
			return { ...flow, ...('options' in flow && flow.options ? { options: toWebAuthnAuthenticationOptions(flow.options) } : {}) };
		})),
		'oidc/cancel': api(oidcContract['oidc/cancel']).handler(({ input, context }) => safe(async () => { origin(context); const secret = browserSecret(context, input.ticket); await get().cancel(input.ticket, secret); setCookie(context, input.ticket, secret, true); })),
		'oidc/login': api(oidcContract['oidc/login']).handler(({ input, context }) => safe(async () => {
			origin(context); const secret = browserSecret(context, input.ticket);
			return get().login(input.ticket, secret, { ip: context.ip, headers: { ...context.headers, cookie: undefined, authorization: undefined } }, { code: () => {}, header: (name, value) => context.response?.header(name, value) }, input.token, input.credential);
		})),
		'oidc/onboarding': api(oidcContract['oidc/onboarding']).handler(({ input, context }) => safe(async () => { origin(context); await get().register(input.ticket, browserSecret(context, input.ticket), input); })),
		'oidc/onboarding/verify': api(oidcContract['oidc/onboarding/verify']).handler(({ input, context }) => safe(async () => { origin(context); return get().finishRegistration(input.ticket, browserSecret(context, input.ticket), input.code); })),
		'i/oidc/links': api(oidcContract['i/oidc/links']).handler(({ context }) => safe(() => get().links(local(context).userId))),
		'i/oidc/link/start': api(oidcContract['i/oidc/link/start']).handler(({ input, context }) => safe(() => start(context, input.providerId, local(context)))),
		'i/oidc/link/complete': api(oidcContract['i/oidc/link/complete']).handler(({ input, context }) => safe(async () => { origin(context); await get().link(input.ticket, browserSecret(context, input.ticket), local(context), input.agree); })),
		'i/oidc/unlink': api(oidcContract['i/oidc/unlink']).handler(({ input, context }) => safe(async () => { origin(context); await get().unlink(input.id, local(context)); })),
		'admin/oidc/providers': api(oidcContract['admin/oidc/providers']).handler(() => safe(() => get().listProviders(true))),
		'admin/oidc/create': api(oidcContract['admin/oidc/create']).handler(({ input, context }) => safe(async () => { origin(context); return get().createProvider(local(context), input.name); })),
		'admin/oidc/update': api(oidcContract['admin/oidc/update']).handler(({ input, context }) => safe(async () => { origin(context); return get().updateProvider(local(context), input); })),
	};
}
