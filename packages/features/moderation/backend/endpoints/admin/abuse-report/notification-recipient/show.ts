/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedAdminAbuseReportNotificationRecipientShowDefinition, packedAdminAbuseReportNotificationRecipientShowInput, packedAdminAbuseReportNotificationRecipientShowOutput } from '../../../../../contract/packed-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import {
	AbuseReportNotificationRecipientEntityService,
} from '../../../../serializers/AbuseReportNotificationRecipientEntityService.js';
import { AbuseReportNotificationService } from '../../../../services/AbuseReportNotificationService.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(packedAdminAbuseReportNotificationRecipientShowDefinition);

export const meta = {
	tags: ['admin', 'abuse-report', 'notification-recipient'],

	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'read:admin:abuse-report:notification-recipient',

	res: contractProjection.response,

	errors: {
		noSuchRecipient: {
			message: 'No such recipient.',
			code: 'NO_SUCH_RECIPIENT',
			id: '013de6a8-f757-04cb-4d73-cc2a7e3368e4',
			kind: 'server',
			httpStatusCode: 404,
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAdminAbuseReportNotificationRecipientShowInput, typeof packedAdminAbuseReportNotificationRecipientShowOutput> {
	constructor(
		private abuseReportNotificationService: AbuseReportNotificationService,
		private abuseReportNotificationRecipientEntityService: AbuseReportNotificationRecipientEntityService,
	) {
		super(meta, contractProjection, async (ps) => {
			const recipients = await this.abuseReportNotificationService.fetchRecipients({ ids: [ps.id] });
			if (recipients.length === 0) {
				throw new ApiError(meta.errors.noSuchRecipient);
			}

			return this.abuseReportNotificationRecipientEntityService.pack(recipients[0]);
		});
	}
}
