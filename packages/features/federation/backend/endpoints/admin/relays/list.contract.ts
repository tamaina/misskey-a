/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';

export const adminRelaysListInput = objectInput({});
export const adminRelaysListOutput = v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
		"inbox": v.pipe(v.string(), v.metadata({ "format": "url" })),
		"status": v.pipe(v.picklist(["requesting", "accepted", "rejected"]), v.metadata({ "default": "requesting" })),
	}));
export const adminRelaysListErrors = {} as const;

const requestName = 'admin/relays/list';
export const adminRelaysListContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(adminRelaysListInput).output(adminRelaysListOutput);
