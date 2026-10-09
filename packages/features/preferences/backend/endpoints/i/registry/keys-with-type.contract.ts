/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { registryScope, registryDomain } from './registry.schema.js';

const registryType = v.picklist(['null', 'array', 'number', 'string', 'boolean', 'object']);

const requestName = 'i/registry/keys-with-type';
export const registryKeysWithTypeContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___i___registry___keys-with-type', tags: ['account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors(commonErrors)
	.input(objectInput({ scope: registryScope, domain: registryDomain })).output(v.lazy(input => {
		if (input !== null && typeof input === 'object') {
			if (Array.isArray(input)) return v.never();
			const prototype = Object.getPrototypeOf(input);
			if (prototype !== Object.prototype && prototype !== null) return v.never();
		}
		const shape = v.record(v.string(), registryType);
		if (input === undefined) return shape;
		if (input === null || typeof input !== 'object') return v.never();
		const entries = Object.keys(input).map((key): [string, unknown] => [key, Object.getOwnPropertyDescriptor(input, key)?.value]);
		if (entries.some(([, value]) => !v.safeParse(registryType, value).success)) return v.never();
		return v.pipe(shape, v.transform(() => Object.fromEntries(entries.map(([key, value]): [string, v.InferOutput<typeof registryType>] => [key, v.parse(registryType, value)]))));
	}));
