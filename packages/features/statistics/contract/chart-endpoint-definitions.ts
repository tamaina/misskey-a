/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';

const chartInputEntries = {
	span: v.picklist(['day', 'hour']),
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(500)), 30),
	offset: v.optional(v.nullable(v.pipe(v.number(), v.integer())), null),
} as const;

export const chartInput = v.object(chartInputEntries);
export const instanceChartInput = v.object({ ...chartInputEntries, host: v.string() });
export const userChartInput = v.object({ ...chartInputEntries, userId: misskeyId });

export const chartActiveUsersOutput = v.strictObject({
	readWrite: v.array(v.number()),
	read: v.array(v.number()),
	write: v.array(v.number()),
	registeredWithinWeek: v.array(v.number()),
	registeredWithinMonth: v.array(v.number()),
	registeredWithinYear: v.array(v.number()),
	registeredOutsideWeek: v.array(v.number()),
	registeredOutsideMonth: v.array(v.number()),
	registeredOutsideYear: v.array(v.number()),
});
export const chartActiveUsersDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/active-users', tags: ["charts", "users"] },
	chartInput,
	chartActiveUsersOutput,
);

export const chartApRequestOutput = v.strictObject({
	deliverFailed: v.array(v.number()),
	deliverSucceeded: v.array(v.number()),
	inboxReceived: v.array(v.number()),
});
export const chartApRequestDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/ap-request', tags: ["charts"] },
	chartInput,
	chartApRequestOutput,
);

export const chartDriveOutput = v.strictObject({
	local: v.strictObject({
		incCount: v.array(v.number()),
		incSize: v.array(v.number()),
		decCount: v.array(v.number()),
		decSize: v.array(v.number()),
	}),
	remote: v.strictObject({
		incCount: v.array(v.number()),
		incSize: v.array(v.number()),
		decCount: v.array(v.number()),
		decSize: v.array(v.number()),
	}),
});
export const chartDriveDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/drive', tags: ["charts", "drive"] },
	chartInput,
	chartDriveOutput,
);

export const chartFederationOutput = v.strictObject({
	deliveredInstances: v.array(v.number()),
	inboxInstances: v.array(v.number()),
	stalled: v.array(v.number()),
	sub: v.array(v.number()),
	pub: v.array(v.number()),
	pubsub: v.array(v.number()),
	subActive: v.array(v.number()),
	pubActive: v.array(v.number()),
});
export const chartFederationDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/federation', tags: ["charts"] },
	chartInput,
	chartFederationOutput,
);

export const chartInstanceOutput = v.strictObject({
	requests: v.strictObject({
		failed: v.array(v.number()),
		succeeded: v.array(v.number()),
		received: v.array(v.number()),
	}),
	notes: v.strictObject({
		total: v.array(v.number()),
		inc: v.array(v.number()),
		dec: v.array(v.number()),
		diffs: v.strictObject({
			normal: v.array(v.number()),
			reply: v.array(v.number()),
			renote: v.array(v.number()),
			withFile: v.array(v.number()),
		}),
	}),
	users: v.strictObject({
		total: v.array(v.number()),
		inc: v.array(v.number()),
		dec: v.array(v.number()),
	}),
	following: v.strictObject({
		total: v.array(v.number()),
		inc: v.array(v.number()),
		dec: v.array(v.number()),
	}),
	followers: v.strictObject({
		total: v.array(v.number()),
		inc: v.array(v.number()),
		dec: v.array(v.number()),
	}),
	drive: v.strictObject({
		totalFiles: v.array(v.number()),
		incFiles: v.array(v.number()),
		decFiles: v.array(v.number()),
		incUsage: v.array(v.number()),
		decUsage: v.array(v.number()),
	}),
});
export const chartInstanceDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/instance', tags: ["charts"] },
	instanceChartInput,
	chartInstanceOutput,
);

export const chartNotesOutput = v.strictObject({
	local: v.strictObject({
		total: v.array(v.number()),
		inc: v.array(v.number()),
		dec: v.array(v.number()),
		diffs: v.strictObject({
			normal: v.array(v.number()),
			reply: v.array(v.number()),
			renote: v.array(v.number()),
			withFile: v.array(v.number()),
		}),
	}),
	remote: v.strictObject({
		total: v.array(v.number()),
		inc: v.array(v.number()),
		dec: v.array(v.number()),
		diffs: v.strictObject({
			normal: v.array(v.number()),
			reply: v.array(v.number()),
			renote: v.array(v.number()),
			withFile: v.array(v.number()),
		}),
	}),
});
export const chartNotesDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/notes', tags: ["charts", "notes"] },
	chartInput,
	chartNotesOutput,
);

export const chartPerUserDriveOutput = v.strictObject({
	totalCount: v.array(v.number()),
	totalSize: v.array(v.number()),
	incCount: v.array(v.number()),
	incSize: v.array(v.number()),
	decCount: v.array(v.number()),
	decSize: v.array(v.number()),
});
export const chartPerUserDriveDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/user/drive', tags: ["charts", "drive", "users"] },
	userChartInput,
	chartPerUserDriveOutput,
);

export const chartPerUserFollowingOutput = v.strictObject({
	local: v.strictObject({
		followings: v.strictObject({
			total: v.array(v.number()),
			inc: v.array(v.number()),
			dec: v.array(v.number()),
		}),
		followers: v.strictObject({
			total: v.array(v.number()),
			inc: v.array(v.number()),
			dec: v.array(v.number()),
		}),
	}),
	remote: v.strictObject({
		followings: v.strictObject({
			total: v.array(v.number()),
			inc: v.array(v.number()),
			dec: v.array(v.number()),
		}),
		followers: v.strictObject({
			total: v.array(v.number()),
			inc: v.array(v.number()),
			dec: v.array(v.number()),
		}),
	}),
});
export const chartPerUserFollowingDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/user/following', tags: ["charts", "users", "following"] },
	userChartInput,
	chartPerUserFollowingOutput,
);

export const chartPerUserNotesOutput = v.strictObject({
	total: v.array(v.number()),
	inc: v.array(v.number()),
	dec: v.array(v.number()),
	diffs: v.strictObject({
		normal: v.array(v.number()),
		reply: v.array(v.number()),
		renote: v.array(v.number()),
		withFile: v.array(v.number()),
	}),
});
export const chartPerUserNotesDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/user/notes', tags: ["charts", "users", "notes"] },
	userChartInput,
	chartPerUserNotesOutput,
);

export const chartPerUserPvOutput = v.strictObject({
	upv: v.strictObject({
		user: v.array(v.number()),
		visitor: v.array(v.number()),
	}),
	pv: v.strictObject({
		user: v.array(v.number()),
		visitor: v.array(v.number()),
	}),
});
export const chartPerUserPvDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/user/pv', tags: ["charts", "users"] },
	userChartInput,
	chartPerUserPvOutput,
);

export const chartPerUserReactionsOutput = v.strictObject({
	local: v.strictObject({
		count: v.array(v.number()),
	}),
	remote: v.strictObject({
		count: v.array(v.number()),
	}),
});
export const chartPerUserReactionsDefinition = defineEndpointContract(
	{ method: 'POST', path: '/charts/user/reactions', tags: ["charts", "users", "reactions"] },
	userChartInput,
	chartPerUserReactionsOutput,
);

export const chartUsersOutput = v.strictObject({
	local: v.strictObject({
		total: v.array(v.number()),
		inc: v.array(v.number()),
		dec: v.array(v.number()),
	}),
	remote: v.strictObject({
		total: v.array(v.number()),
		inc: v.array(v.number()),
		dec: v.array(v.number()),
	}),
});
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
