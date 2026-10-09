/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../../api/backend/transport/errors.schema.js';
import { rssFeedSchema } from '../rss.schema.js';

export const fetchRssInput = objectInput({
	"url": v.string(),
});
export const fetchRssOutput = rssFeedSchema;
export const fetchRssErrors = {
		invalidUrl: {
			message: 'Invalid URL.',
			code: 'INVALID_URL',
			id: '89b7ee05-ccfc-4bdd-9b13-61172fd1e06c',
			status: 400,
		},
		fetchRssFailed: {
			message: 'Failed to fetch RSS.',
			code: 'FETCH_RSS_FAILED',
			id: '8db5d3d8-31d7-452f-b0cc-ca3b8925de12',
			kind: 'server',
			status: 422,
		},
		fetchRssUnavailable: {
			message: 'RSS fetching is temporarily unavailable.',
			code: 'FETCH_RSS_UNAVAILABLE',
			id: '91e6ff44-c63f-4725-9ad0-b7a40d7f7655',
			kind: 'server',
			status: 503,
		},
	} as const;

const requestName = 'fetch-rss';
export const fetchRssContract = oc.$meta<{ requestName: typeof requestName; allowGet: true; cacheSec: number }>({ requestName, allowGet: true, cacheSec: 180 })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['meta'] })
	.errors({ ...commonErrors, INVALID_URL: { status: 400, data: apiErrorData }, FETCH_RSS_FAILED: { status: 422, data: apiErrorData }, FETCH_RSS_UNAVAILABLE: { status: 503, data: apiErrorData } })
	.input(fetchRssInput).output(fetchRssOutput);
