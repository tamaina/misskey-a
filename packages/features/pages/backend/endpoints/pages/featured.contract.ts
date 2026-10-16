/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedPageSchema } from '../../../../users/backend/page.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

const requestName = 'pages/featured';
export const pagesFeaturedContract = oc.$meta({
	requestName: requestName,
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['pages'], })
	.errors(commonErrors)
	.input(objectInput({}))
	.output(v.array(packedPageSchema));
