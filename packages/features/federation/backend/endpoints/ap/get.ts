/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import { apGetContract } from './get.contract.js';
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
	return createApiProcedure<Actor>()(apGetContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				const resolver = await deps.apResolverService.createResolver();
				const object = await resolver.resolve(ps.uri);
				const packed = protocolJsonValue(object, new WeakSet());
				if (packed === null || typeof packed !== 'object' || Array.isArray(packed)) throw new TypeError('Expected ActivityPub JSON object');
				return packed;
			})();
			return result;
		});
}
