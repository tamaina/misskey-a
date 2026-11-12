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

// Only unsupported media types and malformed JSON qualify for the cached-user fallback.
// HTTP, stream/size errors and parsed documents without self links remain separate.
export class WebfingerResponseError extends Error {}

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
			headers: { Accept: 'application/jrd+json, application/json' },
			timeout: 5000,
			size: 1024 * 256,
		});
		const contentType = response.headers.get('content-type');
		const mediaType = contentType?.split(';')[0].trim().toLowerCase();
		if (mediaType !== 'application/jrd+json' && mediaType !== 'application/json') {
			throw new WebfingerResponseError(`WebFinger response was not JRD/JSON (Content-Type: ${contentType ?? 'missing'})`);
		}

		// Read outside the parse catch: transport and response-size errors must retain their types.
		const body = await response.text();
		try {
			return JSON.parse(body) as IWebFinger;
		} catch (cause) {
			throw new WebfingerResponseError('Invalid WebFinger JRD/JSON response body', { cause });
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
