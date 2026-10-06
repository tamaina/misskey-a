/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { CoreModule } from '@/core/CoreModule.js';
import { GlobalModule } from '@/GlobalModule.js';
import { QueueLoggerService } from './QueueLoggerService.js';
import { QueueProcessorService } from './QueueProcessorService.js';
import { DeliverProcessorService } from '../../../features/federation/backend/jobs/DeliverProcessorService.js';
import { EndedPollNotificationProcessorService } from '../../../features/notes/backend/jobs/EndedPollNotificationProcessorService.js';
import { PostScheduledNoteProcessorService } from '../../../features/notes/backend/jobs/PostScheduledNoteProcessorService.js';
import { InboxProcessorService } from '../../../features/federation/backend/jobs/InboxProcessorService.js';
import { UserWebhookDeliverProcessorService } from '../../../features/integrations/backend/jobs/UserWebhookDeliverProcessorService.js';
import { SystemWebhookDeliverProcessorService } from '../../../features/integrations/backend/jobs/SystemWebhookDeliverProcessorService.js';
import { CheckExpiredMutingsProcessorService } from './processors/CheckExpiredMutingsProcessorService.js';
import { BakeBufferedReactionsProcessorService } from '../../../features/notes/backend/jobs/BakeBufferedReactionsProcessorService.js';
import { CleanChartsProcessorService } from '../../../features/statistics/backend/jobs/CleanChartsProcessorService.js';
import { CleanProcessorService } from './processors/CleanProcessorService.js';
import { CheckModeratorsActivityProcessorService } from '../../../features/moderation/backend/jobs/CheckModeratorsActivityProcessorService.js';
import { CleanRemoteNotesProcessorService } from './processors/CleanRemoteNotesProcessorService.js';
import { CleanRemoteFilesProcessorService } from '../../../features/drive/backend/jobs/CleanRemoteFilesProcessorService.js';
import { DeleteAccountProcessorService } from '../../../features/users/backend/jobs/DeleteAccountProcessorService.js';
import { DeleteDriveFilesProcessorService } from '../../../features/drive/backend/jobs/DeleteDriveFilesProcessorService.js';
import { DeleteFileProcessorService } from '../../../features/drive/backend/jobs/DeleteFileProcessorService.js';
import { ExportBlockingProcessorService } from '../../../features/relationships/backend/jobs/ExportBlockingProcessorService.js';
import { ExportCustomEmojisProcessorService } from '../../../features/emojis/backend/jobs/ExportCustomEmojisProcessorService.js';
import { ExportFollowingProcessorService } from '../../../features/relationships/backend/jobs/ExportFollowingProcessorService.js';
import { ExportMutingProcessorService } from '../../../features/relationships/backend/jobs/ExportMutingProcessorService.js';
import { ExportNotesProcessorService } from '../../../features/notes/backend/jobs/ExportNotesProcessorService.js';
import { ExportClipsProcessorService } from '../../../features/collections/backend/jobs/ExportClipsProcessorService.js';
import { ExportUserListsProcessorService } from '../../../features/relationships/backend/jobs/ExportUserListsProcessorService.js';
import { ExportAntennasProcessorService } from '../../../features/timelines/backend/jobs/ExportAntennasProcessorService.js';
import { ImportBlockingProcessorService } from '../../../features/relationships/backend/jobs/ImportBlockingProcessorService.js';
import { ImportCustomEmojisProcessorService } from '../../../features/emojis/backend/jobs/ImportCustomEmojisProcessorService.js';
import { ImportFollowingProcessorService } from '../../../features/relationships/backend/jobs/ImportFollowingProcessorService.js';
import { ImportMutingProcessorService } from '../../../features/relationships/backend/jobs/ImportMutingProcessorService.js';
import { ImportUserListsProcessorService } from '../../../features/relationships/backend/jobs/ImportUserListsProcessorService.js';
import { ImportAntennasProcessorService } from '../../../features/timelines/backend/jobs/ImportAntennasProcessorService.js';
import { ResyncChartsProcessorService } from '../../../features/statistics/backend/jobs/ResyncChartsProcessorService.js';
import { TickChartsProcessorService } from '../../../features/statistics/backend/jobs/TickChartsProcessorService.js';
import { AggregateRetentionProcessorService } from '../../../features/statistics/backend/jobs/AggregateRetentionProcessorService.js';
import { ExportFavoritesProcessorService } from '../../../features/collections/backend/jobs/ExportFavoritesProcessorService.js';
import { RelationshipProcessorService } from '../../../features/relationships/backend/jobs/RelationshipProcessorService.js';

@Module({
	imports: [
		GlobalModule,
		CoreModule,
	],
	providers: [
		QueueLoggerService,
		TickChartsProcessorService,
		ResyncChartsProcessorService,
		CleanChartsProcessorService,
		CheckExpiredMutingsProcessorService,
		BakeBufferedReactionsProcessorService,
		CleanProcessorService,
		DeleteDriveFilesProcessorService,
		ExportCustomEmojisProcessorService,
		ExportNotesProcessorService,
		ExportClipsProcessorService,
		ExportFavoritesProcessorService,
		ExportFollowingProcessorService,
		ExportMutingProcessorService,
		ExportBlockingProcessorService,
		ExportUserListsProcessorService,
		ExportAntennasProcessorService,
		ImportFollowingProcessorService,
		ImportMutingProcessorService,
		ImportBlockingProcessorService,
		ImportUserListsProcessorService,
		ImportCustomEmojisProcessorService,
		ImportAntennasProcessorService,
		DeleteAccountProcessorService,
		DeleteFileProcessorService,
		CleanRemoteFilesProcessorService,
		RelationshipProcessorService,
		UserWebhookDeliverProcessorService,
		SystemWebhookDeliverProcessorService,
		EndedPollNotificationProcessorService,
		PostScheduledNoteProcessorService,
		DeliverProcessorService,
		InboxProcessorService,
		AggregateRetentionProcessorService,
		CheckExpiredMutingsProcessorService,
		CheckModeratorsActivityProcessorService,
		CleanRemoteNotesProcessorService,
		QueueProcessorService,
	],
	exports: [
		QueueProcessorService,
	],
})
export class QueueProcessorModule {}
