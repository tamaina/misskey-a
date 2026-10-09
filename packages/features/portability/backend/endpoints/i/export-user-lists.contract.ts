/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

export const iExportUserListsInput = v.optional(objectInput({}), {});
export const iExportUserListsErrors = {} as const;
export const iExportUserListsContract = oc.$meta<{ requestName: 'i/export-user-lists' }>({ requestName: 'i/export-user-lists' })
	.route({ method: 'POST', path: '/i/export-user-lists', operationId: 'post___i___export-user-lists', successStatus: 204, spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(iExportUserListsInput).output(v.void());
