/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferOutput } from 'valibot';
import type { MiSignin } from '@features/auth/backend/models/Signin.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EndpointExecutor } from '@/server/api/endpoint-base.js';
import { projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { adminShowUserDefinition, adminShowUserInput, adminShowUserOutput } from '../contract/admin-user-endpoint-definition.js';

const projection = projectEndpointContract(adminShowUserDefinition);
export const legacyAdminShowUserMeta = {
	tags: ['admin'],
	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:show-user',
	res: projection.response,
} as const;
export const legacyAdminShowUserParamDef = projection.input;

/**
 * Explicit backend-only debt: raw MiSignin has no documented createdAt field.
 * Every other field comes from the canonical native response. This boundary
 * neither asserts native output validity nor parses, packs or mutates responses.
 * The route, schemas, metadata and producer exception are fixed here, not generic.
 */
export type LegacyAdminUserProducerOutput = Omit<InferOutput<typeof adminShowUserOutput>, 'signins'> & { signins: MiSignin[] };
type Input = InferOutput<typeof adminShowUserInput>;
type Meta = typeof legacyAdminShowUserMeta;
export class LegacyAdminUserProducerEndpoint extends Endpoint<Meta, Input, LegacyAdminUserProducerOutput> {
	constructor(handler: EndpointExecutor<Meta, Input, LegacyAdminUserProducerOutput>) {
		super(legacyAdminShowUserMeta, projection.input, handler);
	}
}
