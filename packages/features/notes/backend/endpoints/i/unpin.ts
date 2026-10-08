/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { NativeContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedIUnpinDefinition, packedIUnpinInput, packedIUnpinOutput } from '../../../contract/packed-endpoint-definitions.js';
import { nativeMeDetailedSchema } from '@features/users/backend/serializers/native-user.js';
import { Injectable } from '@nestjs/common';

import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { NotePiningService } from '../../services/NotePiningService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedIUnpinDefinition);

export const meta = {
	tags: ['account', 'notes'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '454170ce-9d63-4a43-9da1-ea10afe81e21',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends NativeContractEndpoint<typeof meta, typeof packedIUnpinInput, typeof packedIUnpinOutput, typeof nativeMeDetailedSchema> {
	constructor(
		private userEntityService: UserEntityService,
		private notePiningService: NotePiningService,
	) {
		super(meta, contractProjection, nativeMeDetailedSchema, async (ps, me) => {
			await this.notePiningService.removePinned(me, ps.noteId).catch(err => {
				if (err.id === 'b302d4cf-c050-400a-bbb3-be208681f40c') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

			return await this.userEntityService.packSelf(me.id);
		});
	}
}
