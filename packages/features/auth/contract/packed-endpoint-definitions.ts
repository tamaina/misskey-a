/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedAdminInviteCreateInput = v.object({
	"count": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 1),
	"expiresAt": v.exactOptional(v.nullable(v.string())),
});
export const packedAdminInviteCreateOutput = v.array(packedReference("InviteCode"));
export const packedAdminInviteCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/invite/create", tags: ["admin"] },
	packedAdminInviteCreateInput,
	packedAdminInviteCreateOutput,
);

export const packedAdminInviteListInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
	"type": v.optional(v.picklist(["unused", "used", "expired", "all"]), "all"),
	"sort": v.exactOptional(v.picklist(["+createdAt", "-createdAt", "+usedAt", "-usedAt"])),
});
export const packedAdminInviteListOutput = v.array(packedReference("InviteCode"));
export const packedAdminInviteListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/invite/list", tags: ["admin"] },
	packedAdminInviteListInput,
	packedAdminInviteListOutput,
);

export const packedAppShowInput = v.object({
	"appId": misskeyId,
});
export const packedAppShowOutput = packedReference("App");
export const packedAppShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/app/show", tags: ["app"] },
	packedAppShowInput,
	packedAppShowOutput,
);

export const packedAuthSessionShowInput = v.object({
	"token": v.string(),
});
export const packedAuthSessionShowOutput = v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"app": packedReference("App"),
	"token": v.string(),
});
export const packedAuthSessionShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/auth/session/show", tags: ["auth"] },
	packedAuthSessionShowInput,
	packedAuthSessionShowOutput,
);

export const packedAuthSessionUserkeyInput = v.object({
	"appSecret": v.string(),
	"token": v.string(),
});
export const packedAuthSessionUserkeyOutput = v.strictObject({
	"accessToken": v.string(),
	"user": packedReference("UserDetailedNotMe"),
});
export const packedAuthSessionUserkeyDefinition = defineEndpointContract(
	{ method: 'POST', path: "/auth/session/userkey", tags: ["auth"] },
	packedAuthSessionUserkeyInput,
	packedAuthSessionUserkeyOutput,
);

export const packedISigninHistoryInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedISigninHistoryOutput = v.array(packedReference("Signin"));
export const packedISigninHistoryDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/signin-history" },
	packedISigninHistoryInput,
	packedISigninHistoryOutput,
);

export const packedIUpdateEmailInput = v.object({
	"password": v.string(),
	"email": v.exactOptional(v.nullable(v.string())),
	"token": v.exactOptional(v.nullable(v.string())),
});
export const packedIUpdateEmailOutput = packedReference("MeDetailed");
export const packedIUpdateEmailDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/update-email" },
	packedIUpdateEmailInput,
	packedIUpdateEmailOutput,
);

export const packedInviteCreateInput = v.object({});
export const packedInviteCreateOutput = packedReference("InviteCode");
export const packedInviteCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/invite/create", tags: ["meta"] },
	packedInviteCreateInput,
	packedInviteCreateOutput,
);

export const packedInviteListInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 30),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedInviteListOutput = v.array(packedReference("InviteCode"));
export const packedInviteListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/invite/list", tags: ["meta"] },
	packedInviteListInput,
	packedInviteListOutput,
);

export const packedMyAppsInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
});
export const packedMyAppsOutput = v.array(packedReference("App"));
export const packedMyAppsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/my/apps", tags: ["account", "app"] },
	packedMyAppsInput,
	packedMyAppsOutput,
);

export const packedEndpointDefinitions = {
	"admin/invite/create": packedAdminInviteCreateDefinition,
	"admin/invite/list": packedAdminInviteListDefinition,
	"app/show": packedAppShowDefinition,
	"auth/session/show": packedAuthSessionShowDefinition,
	"auth/session/userkey": packedAuthSessionUserkeyDefinition,
	"i/signin-history": packedISigninHistoryDefinition,
	"i/update-email": packedIUpdateEmailDefinition,
	"invite/create": packedInviteCreateDefinition,
	"invite/list": packedInviteListDefinition,
	"my/apps": packedMyAppsDefinition,
} as const;

export const packedEndpointContracts = {
	"admin/invite/create": packedAdminInviteCreateDefinition.contract,
	"admin/invite/list": packedAdminInviteListDefinition.contract,
	"app/show": packedAppShowDefinition.contract,
	"auth/session/show": packedAuthSessionShowDefinition.contract,
	"auth/session/userkey": packedAuthSessionUserkeyDefinition.contract,
	"i/signin-history": packedISigninHistoryDefinition.contract,
	"i/update-email": packedIUpdateEmailDefinition.contract,
	"invite/create": packedInviteCreateDefinition.contract,
	"invite/list": packedInviteListDefinition.contract,
	"my/apps": packedMyAppsDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
