/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedUserLiteSchema } from '../../../../users/backend/user.schema.js';
import { packedOptionalJsonValueSchema } from '../../../../users/backend/json-value.schema.js';

export const reversiInvitationsInput = packedOptionalJsonValueSchema;
export const reversiInvitationsOutput = v.array(packedUserLiteSchema);

const requestName = 'reversi/invitations';
export const reversiInvitationsContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: [], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), })
	.errors(commonErrors)
	.input(reversiInvitationsInput)
	.output(reversiInvitationsOutput);
