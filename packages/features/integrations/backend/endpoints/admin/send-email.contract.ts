/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';

export const adminSendEmailInput = objectInput({
	"to": v.string(),
	"subject": v.string(),
	"text": v.string(),
});
export const adminSendEmailOutput = v.void();
export const adminSendEmailErrors = {} as const;

const requestName = 'admin/send-email';
export const adminSendEmailContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(adminSendEmailInput).output(adminSendEmailOutput);
