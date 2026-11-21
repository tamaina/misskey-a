/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import Parser from 'rss-parser';
import { HttpRequestService } from '../../../runtime/backend/services/HttpRequestService.js';
import { apiError } from '../../../api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
import * as v from 'valibot';
import { fetchRssErrors, fetchRssContract } from './fetch-rss.contract.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

const MAX_URL_LENGTH = 8192;
const MAX_RESPONSE_SIZE = 1024 * 1024;
const MAX_CONCURRENT_REQUESTS = 32;
export interface FetchRssDependencies {
	httpRequestService: Pick<HttpRequestService, 'send'>;
}
export function createFetchRssProcedure(deps: FetchRssDependencies) {
	const inFlightRequests = new Map<string, Promise<v.InferOutput<NonNullable<typeof fetchRssContract['~orpc']['outputSchema']>>>>();
	let activeRequestCount = 0;

	function normalizeUrl(input: string): string {
		if (input.length === 0 || input.length > MAX_URL_LENGTH) {
			throw apiError(fetchRssErrors.invalidUrl);
		}
		let url: URL;
		try {
			url = new URL(input);
		} catch {
			throw apiError(fetchRssErrors.invalidUrl);
		}
		if (
			(url.protocol !== 'http:' && url.protocol !== 'https:') ||
			url.username !== '' ||
			url.password !== ''
		) {
			throw apiError(fetchRssErrors.invalidUrl);
		}
		url.hash = '';
		return url.href;
	}

	async function fetchRss(url: string): Promise<v.InferOutput<NonNullable<typeof fetchRssContract['~orpc']['outputSchema']>>> {
		const res = await deps.httpRequestService.send(url, {
			method: 'GET',
			headers: {
				Accept: 'application/rss+xml, */*',
			},
			timeout: 5000,
			size: MAX_RESPONSE_SIZE,
		});
		const finalUrl = new URL(res.url);
		if (finalUrl.protocol !== 'http:' && finalUrl.protocol !== 'https:') {
			throw new Error('Invalid final URL protocol');
		}
		const text = await res.text();
		const rssParser = new Parser({
			xml2js: {
				async: true,
			},
		});
		return v.parse(requiredSchema(fetchRssContract['~orpc'].outputSchema), await rssParser.parseString(text));
	}

	return createApiProcedure<MiLocalUser>()(fetchRssContract)
		.handler(async ({ input, context }) => {
			const ps = input;
			const result = await (async () => {
				const url = normalizeUrl(ps.url);
				const inFlightRequest = inFlightRequests.get(url);
				if (inFlightRequest != null) {
					return await inFlightRequest;
				}
				if (activeRequestCount >= MAX_CONCURRENT_REQUESTS) {
					throw apiError(fetchRssErrors.fetchRssUnavailable);
				}
				activeRequestCount++;
				const request = fetchRss(url)
					.catch(() => {
						throw apiError(fetchRssErrors.fetchRssFailed);
					})
					.finally(() => {
						inFlightRequests.delete(url);
						activeRequestCount--;
					});
				inFlightRequests.set(url, request);
				return await request;
			})();
			return result;
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
