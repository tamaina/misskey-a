/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferOutput } from 'valibot';
import { Endpoint } from '@features/api/backend/transport/endpoint-base.js';
import type { EndpointExecutor } from '@features/api/backend/transport/endpoint-base.js';
import type { IEndpointMeta } from '@features/index/backend/endpoints.js';
import type { projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import type Parser from 'rss-parser';
import type { inlineFetchRssInput, inlineFetchRssOutput } from '../contract/endpoint-definitions.js';

/**
 * Explicit third-party native debt: installed rss-parser declarations misdescribe XML
 * strings and raw XML trees. The public contract is separate and finite. This fixed
 * boundary neither validates nor rewrites the installed producer's raw response.
 */
export type LegacyRssParserProducerEndpointOutput = Awaited<ReturnType<Parser['parseString']>>;
type Input = InferOutput<typeof inlineFetchRssInput>;

export class LegacyRssParserProducerEndpoint<Meta extends IEndpointMeta> extends Endpoint<Meta, Input, LegacyRssParserProducerEndpointOutput> {
	constructor(
		meta: Meta,
		projection: ReturnType<typeof projectEndpointContract<typeof inlineFetchRssInput, typeof inlineFetchRssOutput>>,
		handler: EndpointExecutor<Meta, Input, LegacyRssParserProducerEndpointOutput>,
	) {
		if (Boolean(meta.requireFile) !== (projection.definition.transport === 'multipart/form-data')) {
			throw new Error('Endpoint requireFile metadata does not match its contract transport');
		}
		super(meta, projection.input, handler);
	}
}
