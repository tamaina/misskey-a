/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createProcedureClient, implement } from '@orpc/server';
import { pingContract } from './endpoints/ping.contract.js';
import { endpointsContract } from './endpoints/endpoints.contract.js';
import { endpointContract } from './endpoints/endpoint.contract.js';
import { serverInfoContract } from './endpoints/server-info.contract.js';
import { createServerInfoService } from './server-info.js';
import { createGetOnlineUsersCount } from './get-online-users-count.js';
import type { OnlineUsersCountDependencies } from './get-online-users-count.js';
import type * as v from 'valibot';

/** The clock is a narrow dependency and can be replaced without a container. */
export function createPing(now: () => number = Date.now) {
	return createProcedureClient(implement(pingContract).handler(() => ({ pong: now() })));
}

export interface ServerInfoDependencies {
	enabled(): boolean;
	read(): Promise<v.InferOutput<NonNullable<typeof serverInfoContract['~orpc']['outputSchema']>>>;
}

export interface EndpointDescriptor {
	name: string;
	properties: Readonly<Record<string, { type?: string }>>;
}

export type ReadEndpoints = () => Promise<readonly EndpointDescriptor[]>;

/** Check current settings on every request before reading machine information. */
export function createServerInfo(deps: ServerInfoDependencies) {
	const service = createServerInfoService(deps);
	return createProcedureClient(implement(serverInfoContract).handler(() => service()));
}

export function createEndpoints(readEndpoints: ReadEndpoints) {
	return createProcedureClient(implement(endpointsContract).handler(async () => {
		const endpoints = await readEndpoints();
		return endpoints.map(endpoint => endpoint.name);
	}));
}

export function createEndpoint(readEndpoints: ReadEndpoints) {
	return createProcedureClient(implement(endpointContract).handler(async ({ input: params }) => {
		const endpoints = await readEndpoints();
		const endpoint = endpoints.find(candidate => candidate.name === params.endpoint);
		if (endpoint == null) return null;
		return {
			params: Object.entries(endpoint.properties).map(([name, property]) => ({
				name,
				type: property.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : 'string',
			})),
		};
	}));
}

export { createResetCaptcha } from './reset-captcha.js';
export type { CaptchaReset } from './reset-captcha.js';
export { createGetOnlineUsersCount } from './get-online-users-count.js';
export type { OnlineUsersCountDependencies } from './get-online-users-count.js';

/** One feature instance per role, with explicit dependencies and no container access. */
export function createInstance(deps: {
	getOnlineUsersCount: OnlineUsersCountDependencies;
	readEndpoints: ReadEndpoints;
	now?: () => number;
}) {
	return {
		ping: createPing(deps.now),
		'get-online-users-count': createGetOnlineUsersCount(deps.getOnlineUsersCount, deps.now),
		endpoints: createEndpoints(deps.readEndpoints),
		endpoint: createEndpoint(deps.readEndpoints),
	};
}
export type InstanceFeature = ReturnType<typeof createInstance>;

export { createInstanceOperations } from './operations.js';
export type { InstanceOperations, InstanceApiContext, InstanceOperationDependencies } from './operations.js';
