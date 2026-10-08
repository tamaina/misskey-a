/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createProcedureClient, implement } from '@orpc/server';
import type { JsonSchema } from '@valibot/to-json-schema';
import * as v from 'valibot';
import {
	endpointInput,
	endpointResult,
	endpointsResult,
	instanceContract,
	objectParams,
	onlineUsersCountResult,
	pingResult,
} from '../contract/index.js';
import type { InstanceEndpoints } from '../contract/index.js';
import { createServerInfoService } from './server-info.js';
import { createGetOnlineUsersCount } from './get-online-users-count.js';
import type { OnlineUsersCountDependencies } from './get-online-users-count.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';

/** The clock is a narrow dependency and can be replaced without a container. */
export function createPing(now: () => number = Date.now) {
	return createProcedureClient(implement(instanceContract.ping).handler(() => ({ pong: now() })));
}

export interface ServerInfoDependencies {
	enabled(): boolean;
	read(): Promise<InstanceEndpoints['server-info']['res']>;
}

export interface EndpointDescriptor {
	name: string;
	properties: Readonly<Record<string, { type?: string }>>;
}

export type ReadEndpoints = () => Promise<readonly EndpointDescriptor[]>;

/** Check current settings on every request before reading machine information. */
export function createServerInfo(deps: ServerInfoDependencies) {
	const service = createServerInfoService(deps);
	return createProcedureClient(implement(instanceContract['server-info']).handler(() => service()));
}

export function createEndpoints(readEndpoints: ReadEndpoints) {
	return createProcedureClient(implement(instanceContract.endpoints).handler(async () => {
		const endpoints = await readEndpoints();
		return endpoints.map(endpoint => endpoint.name);
	}));
}

export function createEndpoint(readEndpoints: ReadEndpoints) {
	return createProcedureClient(implement(instanceContract.endpoint).handler(async ({ input: params }) => {
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

// Transitional documentation/AJV bridge. The Valibot schema remains authoritative.
// These endpoints use object/string/number schemas, with response fields required.
const input = toLegacyJsonSchema(objectParams);
const output = toLegacyJsonSchema(pingResult);
export const legacyPingSchemas: { input: JsonSchema; output: JsonSchema } = { input, output };
const onlineUsersCountOutput = toLegacyJsonSchema(onlineUsersCountResult);
export const legacyOnlineUsersCountSchemas: { input: JsonSchema; output: JsonSchema } = { input, output: onlineUsersCountOutput };
const endpointsInput = toLegacyJsonSchema(objectParams, {
	overrideSchema: ({ valibotSchema }) => valibotSchema === objectParams
		? { type: 'object', properties: {} }
		: undefined,
});
const endpointsOutput = toLegacyJsonSchema(endpointsResult);
export const legacyEndpointsSchemas: { input: JsonSchema; output: JsonSchema & { example: string[] } } = {
	input: endpointsInput,
	output: {
		...endpointsOutput,
		example: [
			'admin/abuse-user-reports',
			'admin/accounts/create',
			'admin/announcements/create',
			'...',
		],
	},
};
const endpointInputSchema = toLegacyJsonSchema(endpointInput);
const endpointOutputSchema = toLegacyJsonSchema(v.unwrap(endpointResult));
export const legacyEndpointSchemas: { input: JsonSchema; output: JsonSchema & { nullable: true } } = {
	input: endpointInputSchema,
	output: { ...endpointOutputSchema, nullable: true },
};

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
