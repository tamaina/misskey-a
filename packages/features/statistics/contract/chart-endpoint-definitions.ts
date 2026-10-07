/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { activeUsersChartDescriptor, apRequestChartDescriptor, driveChartDescriptor, federationChartDescriptor, instanceChartDescriptor, notesChartDescriptor, perUserDriveChartDescriptor, perUserFollowingChartDescriptor, perUserNotesChartDescriptor, perUserPvChartDescriptor, perUserReactionsChartDescriptor, usersChartDescriptor } from '../shared/chart-descriptors.js';
import { chartOutputSchema } from './chart-output-schema.js';

const chartInputEntries = {
	span: v.picklist(['day', 'hour']),
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(500)), 30),
	offset: v.optional(v.nullable(v.pipe(v.number(), v.integer())), null),
} as const;

export const chartInput = v.looseObject(chartInputEntries);
export const instanceChartInput = v.looseObject({ ...chartInputEntries, host: v.string() });
export const userChartInput = v.looseObject({ ...chartInputEntries, userId: misskeyId });

export const chartActiveUsersOutput = chartOutputSchema(activeUsersChartDescriptor);
export const chartActiveUsersDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/active-users', tags: ["charts", "users"] },
	chartInput,
	chartActiveUsersOutput,
);

export const chartApRequestOutput = chartOutputSchema(apRequestChartDescriptor);
export const chartApRequestDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/ap-request', tags: ["charts"] },
	chartInput,
	chartApRequestOutput,
);

export const chartDriveOutput = chartOutputSchema(driveChartDescriptor);
export const chartDriveDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/drive', tags: ["charts", "drive"] },
	chartInput,
	chartDriveOutput,
);

export const chartFederationOutput = chartOutputSchema(federationChartDescriptor);
export const chartFederationDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/federation', tags: ["charts"] },
	chartInput,
	chartFederationOutput,
);

export const chartInstanceOutput = chartOutputSchema(instanceChartDescriptor);
export const chartInstanceDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/instance', tags: ["charts"] },
	instanceChartInput,
	chartInstanceOutput,
);

export const chartNotesOutput = chartOutputSchema(notesChartDescriptor);
export const chartNotesDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/notes', tags: ["charts", "notes"] },
	chartInput,
	chartNotesOutput,
);

export const chartPerUserDriveOutput = chartOutputSchema(perUserDriveChartDescriptor);
export const chartPerUserDriveDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/user/drive', tags: ["charts", "drive", "users"] },
	userChartInput,
	chartPerUserDriveOutput,
);

export const chartPerUserFollowingOutput = chartOutputSchema(perUserFollowingChartDescriptor);
export const chartPerUserFollowingDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/user/following', tags: ["charts", "users", "following"] },
	userChartInput,
	chartPerUserFollowingOutput,
);

export const chartPerUserNotesOutput = chartOutputSchema(perUserNotesChartDescriptor);
export const chartPerUserNotesDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/user/notes', tags: ["charts", "users", "notes"] },
	userChartInput,
	chartPerUserNotesOutput,
);

export const chartPerUserPvOutput = chartOutputSchema(perUserPvChartDescriptor);
export const chartPerUserPvDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/user/pv', tags: ["charts", "users"] },
	userChartInput,
	chartPerUserPvOutput,
);

export const chartPerUserReactionsOutput = chartOutputSchema(perUserReactionsChartDescriptor);
export const chartPerUserReactionsDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/user/reactions', tags: ["charts", "users", "reactions"] },
	userChartInput,
	chartPerUserReactionsOutput,
);

export const chartUsersOutput = chartOutputSchema(usersChartDescriptor);
export const chartUsersDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/users', tags: ["charts", "users"] },
	chartInput,
	chartUsersOutput,
);

export const chartEndpointDefinitions = {
	'charts/active-users': chartActiveUsersDefinition,
	'charts/ap-request': chartApRequestDefinition,
	'charts/drive': chartDriveDefinition,
	'charts/federation': chartFederationDefinition,
	'charts/instance': chartInstanceDefinition,
	'charts/notes': chartNotesDefinition,
	'charts/user/drive': chartPerUserDriveDefinition,
	'charts/user/following': chartPerUserFollowingDefinition,
	'charts/user/notes': chartPerUserNotesDefinition,
	'charts/user/pv': chartPerUserPvDefinition,
	'charts/user/reactions': chartPerUserReactionsDefinition,
	'charts/users': chartUsersDefinition,
} as const;

export const chartEndpointContracts = {
	'charts/active-users': chartActiveUsersDefinition.contract,
	'charts/ap-request': chartApRequestDefinition.contract,
	'charts/drive': chartDriveDefinition.contract,
	'charts/federation': chartFederationDefinition.contract,
	'charts/instance': chartInstanceDefinition.contract,
	'charts/notes': chartNotesDefinition.contract,
	'charts/user/drive': chartPerUserDriveDefinition.contract,
	'charts/user/following': chartPerUserFollowingDefinition.contract,
	'charts/user/notes': chartPerUserNotesDefinition.contract,
	'charts/user/pv': chartPerUserPvDefinition.contract,
	'charts/user/reactions': chartPerUserReactionsDefinition.contract,
	'charts/users': chartUsersDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof chartEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof chartEndpointContracts>;
export type ChartsEndpoints = {
	[K in keyof typeof chartEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
