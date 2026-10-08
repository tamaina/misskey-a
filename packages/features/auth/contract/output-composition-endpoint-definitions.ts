/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { packedMeDetailedSchema, packedSelfUnreadAnnouncementSchema, packedAchievementSchema, packedAchievementNameSchema, packedUserSecurityKeySchema } from '../../users/contract/packed.js';
import { jsonString } from '../../api/contract/index.js';
import { localUsernameSchema, passwordSchema } from '../../users/contract/user-credentials.js';

export const compositionAdminAccountsCreateInput = jsonObject({
	username: jsonString(localUsernameSchema),
	password: jsonString(passwordSchema),
	setupPassword: v.exactOptional(v.nullable(v.string())),
});
export const compositionAdminAccountsCreateOutput = v.strictObject({
	...packedMeDetailedSchema.entries,
	// Canonical packed validators keep recursive children as named wire references.
	pinnedNotes: v.array(packedReference('Note')),
	pinnedPage: v.nullable(packedReference('Page')),
	roles: v.array(packedReference('RoleLite')),
	policies: packedReference('RolePolicies'),
	unreadAnnouncements: v.array(packedSelfUnreadAnnouncementSchema),
	achievements: v.array(v.strictObject({ ...packedAchievementSchema.entries, name: packedAchievementNameSchema })),
	securityKeysList: v.optional(v.array(packedUserSecurityKeySchema)),
	token: v.string(),
});
export const compositionAdminAccountsCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/accounts/create', tags: ["admin"] },
	compositionAdminAccountsCreateInput,
	compositionAdminAccountsCreateOutput,
);

export const outputCompositionEndpointDefinitions = {
	'admin/accounts/create': compositionAdminAccountsCreateDefinition,
} as const;

export const outputCompositionEndpointContracts = {
	'admin/accounts/create': compositionAdminAccountsCreateDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof outputCompositionEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof outputCompositionEndpointContracts>;
export type OutputCompositionEndpoints = {
	[K in keyof typeof outputCompositionEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
