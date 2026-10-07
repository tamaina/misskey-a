/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedAdminAbuseReportNotificationRecipientListDefinition, packedAdminAbuseReportNotificationRecipientListInput, packedAdminAbuseReportNotificationRecipientListOutput } from '../../../../../contract/packed-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import {
	AbuseReportNotificationRecipientEntityService,
} from '../../../../serializers/AbuseReportNotificationRecipientEntityService.js';
import { AbuseReportNotificationService } from '../../../../services/AbuseReportNotificationService.js';

const contractProjection = projectEndpointContract(packedAdminAbuseReportNotificationRecipientListDefinition);

export const meta = {
	tags: ['admin', 'abuse-report', 'notification-recipient'],

	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'read:admin:abuse-report:notification-recipient',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAdminAbuseReportNotificationRecipientListInput, typeof packedAdminAbuseReportNotificationRecipientListOutput> {
	constructor(
		private abuseReportNotificationService: AbuseReportNotificationService,
		private abuseReportNotificationRecipientEntityService: AbuseReportNotificationRecipientEntityService,
	) {
		super(meta, contractProjection, async (ps) => {
			const recipients = await this.abuseReportNotificationService.fetchRecipients({ method: ps.method });
			return this.abuseReportNotificationRecipientEntityService.packMany(recipients);
		});
	}
}
