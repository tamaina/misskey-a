/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { misskeyId } from '../input.schema.js';

export const antennasRemoveNoteInput = objectInput({
	'antennaId': misskeyId,
	'noteId': misskeyId,
});
export const antennasRemoveNoteOutput = v.void();
export const antennasRemoveNoteErrors = {
	noSuchAntenna: { message: 'No such antenna.', code: 'NO_SUCH_ANTENNA', id: '850926e0-fd3b-49b6-b69a-b28a5dbd82fe' },
} as const;

const requestName = 'antennas/remove-note';
export const antennasRemoveNoteContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['antennas', 'account', 'notes'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_ANTENNA: { status: 400, data: apiErrorData } })
	.input(antennasRemoveNoteInput)
	.output(antennasRemoveNoteOutput);
