/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { ApResolverService } from '../../services/ApResolverService.js';
import type { ApGetInput, ApGetOutput } from './get.contract.js';
import { apGetContract } from './get.contract.js';
import type { MiUser } from '../../../../users/backend/models/User.js';
import type { PackedJsonValue } from '../../../../users/backend/json-value.schema.js';

/** Local AP renderers use optional undefined fields; serialize that wire omission explicitly. */
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

@Injectable()
export class ApGetApplicationService {
	constructor(
		private apResolverService: ApResolverService,
	) {}

	public async execute(ps: ApGetInput, _me: MiUser): Promise<ApGetOutput> {
		const result = await (async () => {
			const resolver = await this.apResolverService.createResolver();
			const object = await resolver.resolve(ps.uri);
			return protocolJsonValue(object, new WeakSet());
		})();
		return v.parse(apGetContract['~orpc'].outputSchema!, result);
	}
}
