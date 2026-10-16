/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedUserLiteSchema } from '../../../../users/backend/user.schema.js';
import { packedOptionalJsonValueSchema } from '../../../../users/backend/json-value.schema.js';

const requestName = 'reversi/invitations';
export const reversiInvitationsContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	kind: 'read:account',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: [], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), })
	.errors(commonErrors)
	.input(packedOptionalJsonValueSchema)
	.output(v.array(packedUserLiteSchema));
