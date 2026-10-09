/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Parser from 'rss-parser';
import { Injectable } from '@nestjs/common';
import { HttpRequestService } from '../../../runtime/backend/services/HttpRequestService.js';
import { apiError } from '../../../api/backend/transport/orpc-error.js';
import type { MiUser } from '../../../users/backend/models/User.js';
import * as v from 'valibot';
import { fetchRssInput, fetchRssOutput, fetchRssErrors } from './fetch-rss.contract.js';

const MAX_URL_LENGTH = 8192;
const MAX_RESPONSE_SIZE = 1024 * 1024;
const MAX_CONCURRENT_REQUESTS = 32;

@Injectable()
export class FetchRssApplicationService {
	private readonly inFlightRequests = new Map<string, Promise<v.InferOutput<typeof fetchRssOutput>>>();
	private activeRequestCount = 0;
	constructor(
		private httpRequestService: HttpRequestService,
	) {}

	public async execute(ps: v.InferOutput<typeof fetchRssInput>, _me: MiUser | null): Promise<v.InferOutput<typeof fetchRssOutput>> {
		const result = await (async () => {
			const url = this.normalizeUrl(ps.url);
			const inFlightRequest = this.inFlightRequests.get(url);
			if (inFlightRequest != null) {
				return await inFlightRequest;
			}

			if (this.activeRequestCount >= MAX_CONCURRENT_REQUESTS) {
				throw apiError(fetchRssErrors.fetchRssUnavailable);
			}

			this.activeRequestCount++;
			const request = this.fetchRss(url)
				.catch(() => {
					throw apiError(fetchRssErrors.fetchRssFailed);
				})
				.finally(() => {
					this.inFlightRequests.delete(url);
					this.activeRequestCount--;
				});
			this.inFlightRequests.set(url, request);

			return await request;
		})();
		return v.parse(fetchRssOutput, result);
	}

	private normalizeUrl(input: string): string {
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

	private async fetchRss(url: string): Promise<v.InferOutput<typeof fetchRssOutput>> {
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

		return v.parse(fetchRssOutput, await rssParser.parseString(text));
	}
}
