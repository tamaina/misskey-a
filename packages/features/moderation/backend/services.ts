/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbuseReportNotificationRecipientEntityService } from './serializers/AbuseReportNotificationRecipientEntityService.js';
import { AbuseUserReportEntityService } from './serializers/AbuseUserReportEntityService.js';
import { ModerationLogEntityService } from './serializers/ModerationLogEntityService.js';
import type { AbuseReportNotificationRecipientRepository, AbuseUserReportsRepository, ModerationLogsRepository } from '@/models/_.js';
import type { UserEntityService } from '../../users/backend/serializers/UserEntityService.js';
import type { SystemWebhookEntityService } from '../../integrations/backend/serializers/SystemWebhookEntityService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';

export interface ModerationServicesDependencies {
	abuseReportNotificationRecipientRepository: AbuseReportNotificationRecipientRepository;
	userEntityService: Pick<UserEntityService, 'pack' | 'packMany'>;
	systemWebhookEntityService: Pick<SystemWebhookEntityService, 'pack' | 'packMany'>;
	abuseUserReportsRepository: AbuseUserReportsRepository;
	idService: Pick<IdService, 'parse'>;
	moderationLogsRepository: ModerationLogsRepository;
}

/** Compose this feature without starting resources or resolving a container. */
export function createModerationServices(deps: ModerationServicesDependencies) {
	const abuseReportNotificationRecipientEntityService = new AbuseReportNotificationRecipientEntityService(deps.abuseReportNotificationRecipientRepository, deps.userEntityService, deps.systemWebhookEntityService);
	const abuseUserReportEntityService = new AbuseUserReportEntityService(deps.abuseUserReportsRepository, deps.userEntityService, deps.idService);
	const moderationLogEntityService = new ModerationLogEntityService(deps.moderationLogsRepository, deps.userEntityService, deps.idService);

	return {
		AbuseReportNotificationRecipientEntityService: abuseReportNotificationRecipientEntityService,
		AbuseUserReportEntityService: abuseUserReportEntityService,
		ModerationLogEntityService: moderationLogEntityService,
	};
}

export type ModerationServices = ReturnType<typeof createModerationServices>;
