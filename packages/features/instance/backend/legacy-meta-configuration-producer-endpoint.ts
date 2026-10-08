/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferOutput } from 'valibot';
import { Endpoint } from '@features/api/backend/transport/endpoint-base.js';
import type { EndpointExecutor } from '@features/api/backend/transport/endpoint-base.js';
import type { IEndpointMeta } from '@features/index/backend/endpoints.js';
import type { projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import type { unionMetaInput, unionMetaOutput } from '../contract/union-endpoint-definitions.js';
import type { NativeMetaLite, NativeMetaDetailed } from './serializers/native-meta.js';

type Input = InferOutput<typeof unionMetaInput>;
type Output = NativeMetaLite | NativeMetaDetailed;

/** Fixed native configuration boundary: public JSON options do not assert executable Sentry types. */
export class LegacyMetaConfigurationProducerEndpoint<Meta extends IEndpointMeta> extends Endpoint<Meta, Input, Output> {
	constructor(
		meta: Meta,
		projection: ReturnType<typeof projectEndpointContract<typeof unionMetaInput, typeof unionMetaOutput>>,
		handler: EndpointExecutor<Meta, Input, Output>,
	) {
		if (Boolean(meta.requireFile) !== (projection.definition.transport === 'multipart/form-data')) {
			throw new Error('Endpoint requireFile metadata does not match its contract transport');
		}
		super(meta, projection.input, handler);
	}
}
