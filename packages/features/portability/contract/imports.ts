/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import type { ApiErrorDefinition } from '../../api/contract/index.js';
import { misskeyId } from '../../api/contract/index.js';

const fileIdInput = v.object({ fileId: misskeyId });
const followingInput = v.object({ fileId: misskeyId, withReplies: v.optional(v.boolean()) });
const voidOutput = v.void();

export const portabilityImportErrors = {
	'i/import-antennas': {
		noSuchFile: { message: 'No such file.', code: 'NO_SUCH_FILE', id: '3b71d086-c3fa-431c-b01d-ded65a777172' },
		noSuchUser: { message: 'No such user.', code: 'NO_SUCH_USER', id: 'e842c379-8ac7-4cf7-b07a-4d4de7e4671c' },
		emptyFile: { message: 'That file is empty.', code: 'EMPTY_FILE', id: '7f60115d-8d93-4b0f-bd0e-3815dcbb389f' },
		tooManyAntennas: { message: 'You cannot create antenna any more.', code: 'TOO_MANY_ANTENNAS', id: '600917d4-a4cb-4cc5-8ba8-7ac8ea3c7779' },
	},
	'i/import-blocking': {
		noSuchFile: { message: 'No such file.', code: 'NO_SUCH_FILE', id: 'ebb53e5f-6574-9c0c-0b92-7ca6def56d7e' },
		unexpectedFileType: { message: 'We need csv file.', code: 'UNEXPECTED_FILE_TYPE', id: 'b6fab7d6-d945-d67c-dfdb-32da1cd12cfe' },
		tooBigFile: { message: 'That file is too big.', code: 'TOO_BIG_FILE', id: 'b7fbf0b1-aeef-3b21-29ef-fadd4cb72ccf' },
		emptyFile: { message: 'That file is empty.', code: 'EMPTY_FILE', id: '6f3a4dcc-f060-a707-4950-806fbdbe60d6' },
	},
	'i/import-following': {
		noSuchFile: { message: 'No such file.', code: 'NO_SUCH_FILE', id: 'b98644cf-a5ac-4277-a502-0b8054a709a3' },
		unexpectedFileType: { message: 'We need csv file.', code: 'UNEXPECTED_FILE_TYPE', id: '660f3599-bce0-4f95-9dde-311fd841c183' },
		tooBigFile: { message: 'That file is too big.', code: 'TOO_BIG_FILE', id: 'dee9d4ed-ad07-43ed-8b34-b2856398bc60' },
		emptyFile: { message: 'That file is empty.', code: 'EMPTY_FILE', id: '31a1b42c-06f7-42ae-8a38-a661c5c9f691' },
	},
	'i/import-muting': {
		noSuchFile: { message: 'No such file.', code: 'NO_SUCH_FILE', id: 'e674141e-bd2a-ba85-e616-aefb187c9c2a' },
		unexpectedFileType: { message: 'We need csv file.', code: 'UNEXPECTED_FILE_TYPE', id: '568c6e42-c86c-ba09-c004-517f83f9f1a8' },
		tooBigFile: { message: 'That file is too big.', code: 'TOO_BIG_FILE', id: '9b4ada6d-d7f7-0472-0713-4f558bd1ec9c' },
		emptyFile: { message: 'That file is empty.', code: 'EMPTY_FILE', id: 'd2f12af1-e7b4-feac-86a3-519548f2728e' },
	},
	'i/import-user-lists': {
		noSuchFile: { message: 'No such file.', code: 'NO_SUCH_FILE', id: 'ea9cc34f-c415-4bc6-a6fe-28ac40357049' },
		unexpectedFileType: { message: 'We need csv file.', code: 'UNEXPECTED_FILE_TYPE', id: 'a3c9edda-dd9b-4596-be6a-150ef813745c' },
		tooBigFile: { message: 'That file is too big.', code: 'TOO_BIG_FILE', id: 'ae6e7a22-971b-4b52-b2be-fc0b9b121fe9' },
		emptyFile: { message: 'That file is empty.', code: 'EMPTY_FILE', id: '99efe367-ce6e-4d44-93f8-5fae7b040356' },
	},
} as const satisfies Record<string, Record<string, ApiErrorDefinition>>;

export const portabilityImportInputs = {
	'i/import-antennas': fileIdInput,
	'i/import-blocking': fileIdInput,
	'i/import-following': followingInput,
	'i/import-muting': fileIdInput,
	'i/import-user-lists': fileIdInput,
};

export const portabilityImportContract = {
	'i/import-antennas': oc.route({ method: 'POST', path: '/i/import-antennas' })
		.input(portabilityImportInputs['i/import-antennas']).output(voidOutput),
	'i/import-blocking': oc.route({ method: 'POST', path: '/i/import-blocking' })
		.input(portabilityImportInputs['i/import-blocking']).output(voidOutput),
	'i/import-following': oc.route({ method: 'POST', path: '/i/import-following' })
		.input(portabilityImportInputs['i/import-following']).output(voidOutput),
	'i/import-muting': oc.route({ method: 'POST', path: '/i/import-muting' })
		.input(portabilityImportInputs['i/import-muting']).output(voidOutput),
	'i/import-user-lists': oc.route({ method: 'POST', path: '/i/import-user-lists' })
		.input(portabilityImportInputs['i/import-user-lists']).output(voidOutput),
};

type Inputs = InferContractRouterInputs<typeof portabilityImportContract>;
type Outputs = InferContractRouterOutputs<typeof portabilityImportContract>;
export type PortabilityImportEndpoints = {
	[K in keyof typeof portabilityImportContract]: { req: Inputs[K]; res: Outputs[K] };
};
