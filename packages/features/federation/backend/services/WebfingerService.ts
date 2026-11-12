/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Injectable } from '@nestjs/common';
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

const XRD_NS = 'http://docs.oasis-open.org/ns/xri/xrd-1.0';
const NAME = String.raw`[A-Za-z_][\w.-]*`;

function decodeXmlEntities(value: string): string {
	return value.replace(/&(?:lt|gt|quot|apos|amp);/g, entity => ({
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&apos;': "'",
		'&amp;': '&',
	}[entity] ?? entity));
}

function parseAttrs(raw: string): Record<string, string> {
	const attrs: Record<string, string> = {};
	for (const match of raw.matchAll(new RegExp(String.raw`(${NAME}(?::${NAME})?)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?`, 'g'))) {
		attrs[match[1]] = decodeXmlEntities(match[2] ?? match[3] ?? '');
	}
	return attrs;
}

function withNamespaces(name: string, attrs: Record<string, string>, inherited: Record<string, string>) {
	const prefixes = { ...inherited };
	for (const [key, value] of Object.entries(attrs)) {
		if (key === 'xmlns') prefixes[''] = value;
		else if (key.startsWith('xmlns:')) prefixes[key.slice(6)] = value;
	}
	const index = name.indexOf(':');
	const prefix = index === -1 ? '' : name.slice(0, index);
	return {
		local: index === -1 ? name : name.slice(index + 1),
		uri: prefixes[prefix] ?? '',
		prefixes,
	};
}

// Feature sources sit outside packages/backend, so a new npm dependency would
// fail Rolldown resolution. WebFinger XRD is a small document; parse it here.
function parseXrd(body: string): IWebFinger {
	// XRD needs no DTD. Reject declarations rather than interpreting custom entities.
	if (/<!DOCTYPE/i.test(body)) throw new Error('DTD is not allowed in WebFinger');
	const document = body.replace(/\uFEFF/g, '').replace(/^\s*<\?xml[^?]*\?>\s*/i, '').trim();
	const open = document.match(new RegExp(String.raw`^<(${NAME}:XRD|XRD)\b([^>]*)>`));
	if (!open) throw new Error('WebFinger response is not XRD');
	const selfClosing = /\/\s*>$/.test(open[0]);
	const rootAttrs = parseAttrs(open[2].replace(/\/\s*$/, ''));
	const root = withNamespaces(open[1], rootAttrs, { '': '' });
	if (root.local !== 'XRD' || !['', XRD_NS].includes(root.uri)) {
		throw new Error('WebFinger response is not XRD');
	}
	let inner = '';
	if (!selfClosing) {
		const close = document.slice(open[0].length).match(new RegExp(String.raw`([\s\S]*)</${open[1].replace(/[.*+?^\${}()|[\]\\]/g, '\\$&')}\s*>\s*$`));
		if (!close) throw new Error('WebFinger response is not XRD');
		inner = close[1];
	}

	const links: ILink[] = [];
	let subject = '';
	let cursor = 0;
	const element = new RegExp(String.raw`<((?:${NAME}:)?${NAME})\b([^>]*)(?:/>|>([\s\S]*?)</\1\s*>)`, 'g');
	for (const match of inner.matchAll(element)) {
		if (inner.slice(cursor, match.index).trim() !== '') {
			throw new Error('WebFinger response is not XRD');
		}
		cursor = (match.index ?? 0) + match[0].length;
		const attrs = parseAttrs(match[2]);
		const el = withNamespaces(match[1], attrs, root.prefixes);
		if (el.uri !== root.uri) continue;
		if (el.local === 'Subject') subject = decodeXmlEntities((match[3] ?? '').trim());
		if (el.local === 'Link' && attrs.href) {
			links.push({ href: attrs.href, rel: attrs.rel, type: attrs.type });
		}
	}
	if (inner.slice(cursor).trim() !== '') throw new Error('WebFinger response is not XRD');
	return { subject, links };
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
