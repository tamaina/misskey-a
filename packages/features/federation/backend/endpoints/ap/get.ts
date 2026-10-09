/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { apGetContract } from './get.contract.js';
import ms from 'ms';
import * as v from 'valibot';
import type { ApResolverService } from '../../services/ApResolverService.js';
import type { PackedJsonValue } from '../../../../users/backend/json-value.schema.js';

function protocolJsonValue(value: unknown, active: WeakSet<object>): PackedJsonValue {
	if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value !== 'object' || value === null || active.has(value)) throw new TypeError('Invalid ActivityPub JSON value');
	const prototype = Object.getPrototypeOf(value);
	if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) throw new TypeError('Invalid ActivityPub JSON object');
	active.add(value);
	const result = Array.isArray(value)
		? Array.from(value, (item: unknown) => item === undefined ? null : protocolJsonValue(item, active))
		: protocolJsonObject(value, active);
	active.delete(value);
	return result;
}

function protocolJsonObject(value: object, active: WeakSet<object>): { [key: string]: PackedJsonValue } {
	return Object.fromEntries(Object.keys(value).flatMap((key): [string, PackedJsonValue][] => {
		const item: unknown = Object.getOwnPropertyDescriptor(value, key)?.value;
		return item === undefined ? [] : [[key, protocolJsonValue(item, active)]];
	}));
}

export interface ApGetDependencies {
	apResolverService: Pick<ApResolverService, 'createResolver'>;
}
export function createApGetProcedure<Actor extends ApiActor>(deps: ApGetDependencies) {
	return implement(apGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({
			name: apGetContract['~orpc'].meta.requestName, requireCredential: true, requireAdmin: true, kind: 'read:federation', limit: {
				duration: ms('1hour'),
				max: 30,
			}
		}))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				const resolver = await deps.apResolverService.createResolver();
				const object = await resolver.resolve(ps.uri);
				return protocolJsonValue(object, new WeakSet());
			})();
			return v.parse(apGetContract['~orpc'].outputSchema!, result);
		});
}
