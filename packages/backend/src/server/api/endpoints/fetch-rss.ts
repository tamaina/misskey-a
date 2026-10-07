/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { inlineFetchRssDefinition, inlineFetchRssInput, inlineFetchRssOutput } from '../../../../../features/integrations/contract/endpoint-definitions.js';
import Parser from 'rss-parser';
import { Injectable } from '@nestjs/common';

import { HttpRequestService } from '../../../../../features/runtime/backend/services/HttpRequestService.js';
import { ApiError } from '../error.js';

const MAX_URL_LENGTH = 8192;
const MAX_RESPONSE_SIZE = 1024 * 1024;
const MAX_CONCURRENT_REQUESTS = 32;

const contractProjection = projectEndpointContract(inlineFetchRssDefinition);

export const meta = {
	tags: ['meta'],

	requireCredential: false,
	allowGet: true,
	cacheSec: 60 * 3,

	limit: {
		duration: 60 * 1000,
		max: 300,
	},

	errors: {
		invalidUrl: {
			message: 'Invalid URL.',
			code: 'INVALID_URL',
			id: '89b7ee05-ccfc-4bdd-9b13-61172fd1e06c',
			httpStatusCode: 400,
		},
		fetchRssFailed: {
			message: 'Failed to fetch RSS.',
			code: 'FETCH_RSS_FAILED',
			id: '8db5d3d8-31d7-452f-b0cc-ca3b8925de12',
			kind: 'server',
			httpStatusCode: 422,
		},
		fetchRssUnavailable: {
			message: 'RSS fetching is temporarily unavailable.',
			code: 'FETCH_RSS_UNAVAILABLE',
			id: '91e6ff44-c63f-4725-9ad0-b7a40d7f7655',
			kind: 'server',
			httpStatusCode: 503,
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export default class extends ContractEndpoint<typeof meta, typeof inlineFetchRssInput, typeof inlineFetchRssOutput> { // eslint-disable-line import/no-default-export
	private readonly inFlightRequests = new Map<string, Promise<Awaited<ReturnType<Parser['parseString']>>>>();
	private activeRequestCount = 0;

	constructor(
		private httpRequestService: HttpRequestService,
	) {
		super(meta, contractProjection, async (ps) => {
			const url = this.normalizeUrl(ps.url);
			const inFlightRequest = this.inFlightRequests.get(url);
			if (inFlightRequest != null) {
				return await inFlightRequest;
			}

			if (this.activeRequestCount >= MAX_CONCURRENT_REQUESTS) {
				throw new ApiError(meta.errors.fetchRssUnavailable);
			}

			this.activeRequestCount++;
			const request = this.fetchRss(url)
				.catch(() => {
					throw new ApiError(meta.errors.fetchRssFailed);
				})
				.finally(() => {
					this.inFlightRequests.delete(url);
					this.activeRequestCount--;
				});
			this.inFlightRequests.set(url, request);

			return await request;
		});
	}

	private normalizeUrl(input: string): string {
		if (input.length === 0 || input.length > MAX_URL_LENGTH) {
			throw new ApiError(meta.errors.invalidUrl);
		}

		let url: URL;
		try {
			url = new URL(input);
		} catch {
			throw new ApiError(meta.errors.invalidUrl);
		}

		if (
			(url.protocol !== 'http:' && url.protocol !== 'https:') ||
			url.username !== '' ||
			url.password !== ''
		) {
			throw new ApiError(meta.errors.invalidUrl);
		}

		url.hash = '';
		return url.href;
	}

	private async fetchRss(url: string): Promise<Awaited<ReturnType<Parser['parseString']>>> {
		const res = await this.httpRequestService.send(url, {
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

		return await rssParser.parseString(text);
	}
}
