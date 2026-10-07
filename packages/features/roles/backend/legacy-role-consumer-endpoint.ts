/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { EndpointExecutor } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { projectEndpointContract, LegacyDeclaredInput } from '@/server/api/contract-endpoint.js';
import type { packedAdminRolesCreateInput, packedAdminRolesCreateOutput } from '../contract/packed-endpoint-definitions.js';
import type { voidAdminRolesUpdateInput, voidAdminRolesUpdateOutput } from '../contract/void-endpoint-definitions.js';
import type { RoleService } from './services/RoleService.js';

/**
 * Unchecked legacy compatibility, NOT domain validation. HTTP and native inputs
 * prove only that condFormula/policies are objects. Existing RoleService methods
 * consume richer model types without validating them; retain that exact boundary
 * only here. Every other field still derives from the native contract.
 */
export type LegacyRoleCreateConsumerInput = Omit<LegacyDeclaredInput<InferSchemaOutput<typeof packedAdminRolesCreateInput>>, 'condFormula' | 'policies'>
	& Required<Pick<Parameters<RoleService['create']>[0], 'condFormula' | 'policies'>>;
export type LegacyRoleUpdateConsumerInput = Omit<LegacyDeclaredInput<InferSchemaOutput<typeof voidAdminRolesUpdateInput>>, 'condFormula' | 'policies'>
	& Pick<Parameters<RoleService['update']>[1], 'condFormula' | 'policies'>;

type CreateOutput = InferSchemaOutput<typeof packedAdminRolesCreateOutput>;
type UpdateOutput = InferSchemaOutput<typeof voidAdminRolesUpdateOutput>;

export class LegacyRoleCreateConsumerEndpoint<Meta extends IEndpointMeta> extends Endpoint<Meta, LegacyRoleCreateConsumerInput, CreateOutput> {
	constructor(meta: Meta,
		projection: ReturnType<typeof projectEndpointContract<typeof packedAdminRolesCreateInput, typeof packedAdminRolesCreateOutput>>,
		handler: EndpointExecutor<Meta, LegacyRoleCreateConsumerInput, CreateOutput>,
	) {
		super(meta, projection.input, handler);
	}
}

export class LegacyRoleUpdateConsumerEndpoint<Meta extends IEndpointMeta> extends Endpoint<Meta, LegacyRoleUpdateConsumerInput, UpdateOutput> {
	constructor(meta: Meta,
		projection: ReturnType<typeof projectEndpointContract<typeof voidAdminRolesUpdateInput, typeof voidAdminRolesUpdateOutput>>,
		handler: EndpointExecutor<Meta, LegacyRoleUpdateConsumerInput, UpdateOutput>,
	) {
		super(meta, projection.input, handler);
	}
}
