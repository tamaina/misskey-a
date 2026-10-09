/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';
import type { OpenAPI } from '@orpc/contract';

export const notesStateInput = objectInput({
	'noteId': misskeyId,
});
export const notesStateOutput = v.strictObject({
	'isFavorited': v.boolean(),
	'isMutedThread': v.boolean(),
});
export const notesStateErrors = {} as const;
export const notesStatePolicy = { name: 'notes/state', requireCredential: true, kind: 'read:account' } as const;
const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const notesStateContract = oc.$meta<{ requestName: 'notes/state' }>({ requestName: 'notes/state' })
	.route({ method: 'POST', path: '/notes/state', operationId: 'post___notes___state', tags: ['notes'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(notesStateInput).output(notesStateOutput);
