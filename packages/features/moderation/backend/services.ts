/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { AbuseReportNotificationRecipientEntityService } from './serializers/AbuseReportNotificationRecipientEntityService.js';
import { AbuseUserReportEntityService } from './serializers/AbuseUserReportEntityService.js';
import { ModerationLogEntityService } from './serializers/ModerationLogEntityService.js';
import { ModerationLogService } from './services/ModerationLogService.js';
import type { Inputs, Outputs } from '../../index/backend/service-definitions.js';

export const moderationServices = defineServices({
	AbuseReportNotificationRecipientEntityService: service(AbuseReportNotificationRecipientEntityService, [ports.abuseReportNotificationRecipientRepository, ports.userEntityService, ports.systemWebhookEntityService]),
	AbuseUserReportEntityService: service(AbuseUserReportEntityService, [ports.abuseUserReportsRepository, ports.userEntityService, ports.idService]),
	ModerationLogEntityService: service(ModerationLogEntityService, [ports.moderationLogsRepository, ports.userEntityService, ports.idService]),
});
export const createModerationServices = moderationServices.create;
export type ModerationServicesDependencies = Inputs<typeof moderationServices>;
export type ModerationServices = Outputs<typeof moderationServices>;

export const moderationLoggingServices = defineServices({
	ModerationLogService: service(ModerationLogService, [ports.moderationLogsRepository, ports.idService]),
});
export const createModerationLoggingServices = moderationLoggingServices.create;
export type ModerationLoggingServicesDependencies = Inputs<typeof moderationLoggingServices>;
export type ModerationLoggingServices = Outputs<typeof moderationLoggingServices>;
