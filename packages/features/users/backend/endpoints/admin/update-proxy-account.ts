/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { NativeContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { portableAdminUpdateProxyAccountDefinition, portableAdminUpdateProxyAccountInput, portableAdminUpdateProxyAccountOutput } from '../../../contract/portable-constant-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { UserEntityService } from '../../serializers/UserEntityService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { SystemAccountService } from '../../services/SystemAccountService.js';

import { nativeMeDetailedSchema } from '@features/users/backend/serializers/native-user.js';

export const nativeOutputSchema = nativeMeDetailedSchema;

const contractProjection = projectEndpointContract(portableAdminUpdateProxyAccountDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:account',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export default class extends NativeContractEndpoint<typeof meta, typeof portableAdminUpdateProxyAccountInput, typeof portableAdminUpdateProxyAccountOutput, typeof nativeOutputSchema> { // eslint-disable-line import/no-default-export
	constructor(
		private userEntityService: UserEntityService,
		private moderationLogService: ModerationLogService,
		private systemAccountService: SystemAccountService,
	) {
		super(meta, contractProjection, nativeOutputSchema, async (ps, me) => {
			const proxy = await this.systemAccountService.updateCorrespondingUserProfile('proxy', {
				description: ps.description,
			});

			const updated = await this.userEntityService.packSelf(proxy.id);

			if (ps.description !== undefined) {
				this.moderationLogService.log(me, 'updateProxyAccountDescription', {
					before: null, //TODO
					after: ps.description,
				});
			}

			return updated;
		});
	}
}
