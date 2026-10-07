/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { notificationTypes, obsoleteNotificationTypes } from './notification-types.js';

// Keep obsolete inputs after the exact backend notification order.
const acceptedNotificationTypes = [...notificationTypes, ...obsoleteNotificationTypes] as const;

export const portableINotificationsInput = jsonObject({
	"limit": v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"markAsRead": v.optional(v.boolean(), true),
	"includeTypes": v.exactOptional(v.array(v.picklist(acceptedNotificationTypes))),
	"excludeTypes": v.exactOptional(v.array(v.picklist(acceptedNotificationTypes))),
});
export const portableINotificationsOutput = v.array(packedReference("Notification"));
export const portableINotificationsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/notifications", tags: ["account", "notifications"] },
	portableINotificationsInput,
	portableINotificationsOutput,
);

export const portableINotificationsGroupedInput = jsonObject({
	"limit": v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"markAsRead": v.optional(v.boolean(), true),
	"includeTypes": v.exactOptional(v.array(v.picklist(acceptedNotificationTypes))),
	"excludeTypes": v.exactOptional(v.array(v.picklist(acceptedNotificationTypes))),
});
export const portableINotificationsGroupedOutput = v.array(packedReference("Notification"));
export const portableINotificationsGroupedDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/notifications-grouped", tags: ["account", "notifications"] },
	portableINotificationsGroupedInput,
	portableINotificationsGroupedOutput,
);

export const portableConstantEndpointDefinitions = {
	"i/notifications": portableINotificationsDefinition,
	"i/notifications-grouped": portableINotificationsGroupedDefinition,
} as const;

export const portableConstantEndpointContracts = {
	"i/notifications": portableINotificationsDefinition.contract,
	"i/notifications-grouped": portableINotificationsGroupedDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof portableConstantEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof portableConstantEndpointContracts>;
export type PortableConstantEndpoints = {
	[K in keyof typeof portableConstantEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
