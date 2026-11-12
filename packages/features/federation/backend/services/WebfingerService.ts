/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Injectable } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';
import { query as urlQuery } from '@features/runtime/backend/formatting/url.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { bindThis } from '@features/runtime/backend/decorators.js';

export type ILink = {
	href: string;
	rel?: string;
	type?: string;
};

export type IWebFinger = {
	links: ILink[];
	subject: string;
};

// Only malformed discovery bodies qualify for the cached-user fallback. HTTP,
// stream/size errors and successfully parsed documents without self links remain separate.
export class WebfingerResponseError extends Error {}

type XrdElement = {
	$ns: { local: string; uri: string };
	$?: Record<string, { value: string; uri: string }>;
	$$?: XrdElement[];
	_?: string;
};

async function parseXrd(body: string): Promise<IWebFinger> {
	// XRD needs no DTD. Reject declarations rather than interpreting custom entities.
	if (/<!DOCTYPE/i.test(body)) throw new Error('DTD is not allowed in WebFinger');
	const document = await parseStringPromise(body, {
		xmlns: true,
		explicitChildren: true,
		preserveChildrenOrder: true,
	}) as Record<string, XrdElement> | null;
	const root = document && Object.values(document)[0];
	if (root?.$ns.local !== 'XRD'
		|| !['', 'http://docs.oasis-open.org/ns/xri/xrd-1.0'].includes(root.$ns.uri)) {
		throw new Error('WebFinger response is not XRD');
	}
	const children = (root.$$ ?? []).filter(child => child.$ns.uri === root.$ns.uri);
	const attribute = (element: XrdElement, name: string): string | undefined => {
		const attr = element.$?.[name];
		return attr?.uri === '' ? attr.value : undefined;
	};
	return {
		subject: children.find(child => child.$ns.local === 'Subject')?._ ?? '',
		links: children.filter(child => child.$ns.local === 'Link').flatMap(link => {
			const href = attribute(link, 'href');
			return href ? [{ href, rel: attribute(link, 'rel'), type: attribute(link, 'type') }] : [];
		}),
	};
}

const urlRegex = /^https?:\/\//;
const mRegex = /^([^@]+)@(.*)/;

@Injectable()
export class WebfingerService {
	constructor(
		private httpRequestService: HttpRequestService,
	) {
	}

	@bindThis
	public async webfinger(query: string): Promise<IWebFinger> {
		const url = this.genUrl(query);

		const response = await this.httpRequestService.send(url, {
			method: 'GET',
			headers: { Accept: 'application/jrd+json, application/json, application/xrd+xml;q=0.9' },
			timeout: 5000,
			size: 1024 * 256,
		});
		// Read outside the parse catch: transport and response-size errors must retain their types.
		const body = (await response.text()).trim();
		const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
		try {
			if (body.startsWith('<') || ['application/xrd+xml', 'application/xml', 'text/xml'].includes(contentType ?? '')) {
				return await parseXrd(body);
			}
			return JSON.parse(body) as IWebFinger;
		} catch (cause) {
			throw new WebfingerResponseError('Invalid WebFinger response body', { cause });
		}
	}

	@bindThis
	private genUrl(query: string): string {
		if (query.match(urlRegex)) {
			const u = new URL(query);
			return `${u.protocol}//${u.hostname}/.well-known/webfinger?` + urlQuery({ resource: query });
		}

		const m = query.match(mRegex);
		if (m) {
			const hostname = m[2];
			const useHttp = process.env.MISSKEY_WEBFINGER_USE_HTTP && process.env.MISSKEY_WEBFINGER_USE_HTTP.toLowerCase() === 'true';
			return `http${useHttp ? '' : 's'}://${hostname}/.well-known/webfinger?${urlQuery({ resource: `acct:${query}` })}`;
		}

		throw new Error(`Invalid query (${query})`);
	}
}
