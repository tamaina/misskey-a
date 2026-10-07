/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EndpointExecutor } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { projectEndpointContract, LegacyDeclaredInput } from '@/server/api/contract-endpoint.js';
import type { inlineI2faKeyDoneInput, inlineI2faKeyDoneOutput } from '../contract/endpoint-definitions.js';
import type { WebAuthnService } from './services/WebAuthnService.js';

/**
 * Unchecked legacy compatibility, NOT WebAuthn domain validation. The HTTP/native
 * object guard does not establish RegistrationResponseJSON. Keep the existing
 * service's challenge consumption and subsequent library verification order.
 */
export type LegacyWebAuthnRegistrationConsumerInput = Omit<LegacyDeclaredInput<InferSchemaOutput<typeof inlineI2faKeyDoneInput>>, 'credential'>
	& { credential: Parameters<WebAuthnService['verifyRegistration']>[1] };
type RegistrationOutput = InferSchemaOutput<typeof inlineI2faKeyDoneOutput>;

export class LegacyWebAuthnRegistrationConsumerEndpoint<Meta extends IEndpointMeta> extends Endpoint<Meta, LegacyWebAuthnRegistrationConsumerInput, RegistrationOutput> {
	constructor(meta: Meta,
		projection: ReturnType<typeof projectEndpointContract<typeof inlineI2faKeyDoneInput, typeof inlineI2faKeyDoneOutput>>,
		handler: EndpointExecutor<Meta, LegacyWebAuthnRegistrationConsumerInput, RegistrationOutput>,
	) {
		super(meta, projection.input, handler);
	}
}
