/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferOutput } from 'valibot';
import { Endpoint } from '@features/api/backend/transport/endpoint-base.js';
import type { EndpointExecutor } from '@features/api/backend/transport/endpoint-base.js';
import type { IEndpointMeta } from '@features/index/backend/endpoints.js';
import type { projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import type { WebAuthnService } from './services/WebAuthnService.js';
import type { inlineI2faRegisterKeyInput, inlineI2faRegisterKeyOutput } from '../contract/endpoint-definitions.js';

/**
 * The installed native registration producer can emit explicit undefined fields,
 * which JSON serialization omits. Keep that native declaration separate from the
 * exact-optional wire contract; this fixed boundary does not parse its response.
 */
export type LegacyWebAuthnOptionsProducerEndpointOutput = Awaited<ReturnType<WebAuthnService['initiateRegistration']>>;
type Input = InferOutput<typeof inlineI2faRegisterKeyInput>;

export class LegacyWebAuthnOptionsProducerEndpoint<Meta extends IEndpointMeta> extends Endpoint<Meta, Input, LegacyWebAuthnOptionsProducerEndpointOutput> {
	constructor(
		meta: Meta,
		projection: ReturnType<typeof projectEndpointContract<typeof inlineI2faRegisterKeyInput, typeof inlineI2faRegisterKeyOutput>>,
		handler: EndpointExecutor<Meta, Input, LegacyWebAuthnOptionsProducerEndpointOutput>,
	) {
		if (Boolean(meta.requireFile) !== (projection.definition.transport === 'multipart/form-data')) {
			throw new Error('Endpoint requireFile metadata does not match its contract transport');
		}
		super(meta, projection.input, handler);
	}
}
