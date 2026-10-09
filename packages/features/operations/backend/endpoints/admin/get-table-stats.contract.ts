/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';

export const adminGetTableStatsErrors = {} as const;

const requestName = 'admin/get-table-stats';
export const adminGetTableStatsContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({})).output(v.lazy<v.GenericSchema<Record<string, { count: number; size: number }>>>(input => {
		const finiteNumber = v.pipe(v.number(), v.finite());
		const tableStat = v.strictObject({ count: finiteNumber, size: finiteNumber });
		const shape = v.record(v.string(), tableStat);
		if (input === undefined) return shape;
		if (input === null || typeof input !== 'object' || Array.isArray(input)) return v.never();
		const prototype = Object.getPrototypeOf(input);
		if (prototype !== Object.prototype && prototype !== null) return v.never();
		for (const key of Object.keys(input)) {
			if (!v.safeParse(tableStat, Object.getOwnPropertyDescriptor(input, key)?.value).success) return v.never();
		}
		// Catalog names are dynamic business keys; preserve reserved names after record parsing.
		return v.pipe(shape, v.transform(() => Object.fromEntries(Object.keys(input).map((key): [string, { count: number; size: number }] => [key, v.parse(tableStat, Object.getOwnPropertyDescriptor(input, key)?.value)]))));
	}));

export type AdminGetTableStatsInput = v.InferOutput<NonNullable<typeof adminGetTableStatsContract['~orpc']['inputSchema']>>;
export type AdminGetTableStatsOutput = v.InferOutput<NonNullable<typeof adminGetTableStatsContract['~orpc']['outputSchema']>>;
