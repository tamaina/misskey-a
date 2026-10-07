/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants.js';
import { expect, test } from 'vitest';
import { QueueProcessorModule } from '../QueueProcessorModule.js';

import { AggregateRetentionProcessorService } from '@features/statistics/backend/jobs/AggregateRetentionProcessorService.js';

import { BakeBufferedReactionsProcessorService } from '@features/notes/backend/jobs/BakeBufferedReactionsProcessorService.js';

import { CheckModeratorsActivityProcessorService } from '@features/moderation/backend/jobs/CheckModeratorsActivityProcessorService.js';

import { CleanChartsProcessorService } from '@features/statistics/backend/jobs/CleanChartsProcessorService.js';

import { CleanRemoteFilesProcessorService } from '@features/drive/backend/jobs/CleanRemoteFilesProcessorService.js';

import { DeleteAccountProcessorService } from '@features/users/backend/jobs/DeleteAccountProcessorService.js';

import { DeleteDriveFilesProcessorService } from '@features/drive/backend/jobs/DeleteDriveFilesProcessorService.js';

import { DeleteFileProcessorService } from '@features/drive/backend/jobs/DeleteFileProcessorService.js';

import { DeliverProcessorService } from '@features/federation/backend/jobs/DeliverProcessorService.js';

import { EndedPollNotificationProcessorService } from '@features/notes/backend/jobs/EndedPollNotificationProcessorService.js';

import { ExportAntennasProcessorService } from '@features/timelines/backend/jobs/ExportAntennasProcessorService.js';

import { ExportBlockingProcessorService } from '@features/relationships/backend/jobs/ExportBlockingProcessorService.js';

import { ExportClipsProcessorService } from '@features/collections/backend/jobs/ExportClipsProcessorService.js';

import { ExportCustomEmojisProcessorService } from '@features/emojis/backend/jobs/ExportCustomEmojisProcessorService.js';

import { ExportFavoritesProcessorService } from '@features/collections/backend/jobs/ExportFavoritesProcessorService.js';

import { ExportFollowingProcessorService } from '@features/relationships/backend/jobs/ExportFollowingProcessorService.js';

import { ExportMutingProcessorService } from '@features/relationships/backend/jobs/ExportMutingProcessorService.js';

import { ExportNotesProcessorService } from '@features/notes/backend/jobs/ExportNotesProcessorService.js';

import { ExportUserListsProcessorService } from '@features/relationships/backend/jobs/ExportUserListsProcessorService.js';

import { ImportAntennasProcessorService } from '@features/timelines/backend/jobs/ImportAntennasProcessorService.js';

import { ImportBlockingProcessorService } from '@features/relationships/backend/jobs/ImportBlockingProcessorService.js';

import { ImportCustomEmojisProcessorService } from '@features/emojis/backend/jobs/ImportCustomEmojisProcessorService.js';

import { ImportFollowingProcessorService } from '@features/relationships/backend/jobs/ImportFollowingProcessorService.js';

import { ImportMutingProcessorService } from '@features/relationships/backend/jobs/ImportMutingProcessorService.js';

import { ImportUserListsProcessorService } from '@features/relationships/backend/jobs/ImportUserListsProcessorService.js';

import { InboxProcessorService } from '@features/federation/backend/jobs/InboxProcessorService.js';

import { PostScheduledNoteProcessorService } from '@features/notes/backend/jobs/PostScheduledNoteProcessorService.js';

import { RelationshipProcessorService } from '@features/relationships/backend/jobs/RelationshipProcessorService.js';

import { ResyncChartsProcessorService } from '@features/statistics/backend/jobs/ResyncChartsProcessorService.js';

import { SystemWebhookDeliverProcessorService } from '@features/integrations/backend/jobs/SystemWebhookDeliverProcessorService.js';

import { TickChartsProcessorService } from '@features/statistics/backend/jobs/TickChartsProcessorService.js';

import { UserWebhookDeliverProcessorService } from '@features/integrations/backend/jobs/UserWebhookDeliverProcessorService.js';

const processorProviders = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, QueueProcessorModule) as unknown[];

const processors = [
	['AggregateRetentionProcessorService', AggregateRetentionProcessorService, 4],
	['BakeBufferedReactionsProcessorService', BakeBufferedReactionsProcessorService, 3],
	['CheckModeratorsActivityProcessorService', CheckModeratorsActivityProcessorService, 7],
	['CleanChartsProcessorService', CleanChartsProcessorService, 13],
	['CleanRemoteFilesProcessorService', CleanRemoteFilesProcessorService, 3],
	['DeleteAccountProcessorService', DeleteAccountProcessorService, 10],
	['DeleteDriveFilesProcessorService', DeleteDriveFilesProcessorService, 4],
	['DeleteFileProcessorService', DeleteFileProcessorService, 2],
	['DeliverProcessorService', DeliverProcessorService, 10],
	['EndedPollNotificationProcessorService', EndedPollNotificationProcessorService, 5],
	['ExportAntennasProcessorService', ExportAntennasProcessorService, 7],
	['ExportBlockingProcessorService', ExportBlockingProcessorService, 6],
	['ExportClipsProcessorService', ExportClipsProcessorService, 9],
	['ExportCustomEmojisProcessorService', ExportCustomEmojisProcessorService, 7],
	['ExportFavoritesProcessorService', ExportFavoritesProcessorService, 8],
	['ExportFollowingProcessorService', ExportFollowingProcessorService, 7],
	['ExportMutingProcessorService', ExportMutingProcessorService, 6],
	['ExportNotesProcessorService', ExportNotesProcessorService, 8],
	['ExportUserListsProcessorService', ExportUserListsProcessorService, 7],
	['ImportAntennasProcessorService', ImportAntennasProcessorService, 4],
	['ImportBlockingProcessorService', ImportBlockingProcessorService, 7],
	['ImportCustomEmojisProcessorService', ImportCustomEmojisProcessorService, 6],
	['ImportFollowingProcessorService', ImportFollowingProcessorService, 7],
	['ImportMutingProcessorService', ImportMutingProcessorService, 7],
	['ImportUserListsProcessorService', ImportUserListsProcessorService, 10],
	['InboxProcessorService', InboxProcessorService, 12],
	['PostScheduledNoteProcessorService', PostScheduledNoteProcessorService, 4],
	['RelationshipProcessorService', RelationshipProcessorService, 4],
	['ResyncChartsProcessorService', ResyncChartsProcessorService, 4],
	['SystemWebhookDeliverProcessorService', SystemWebhookDeliverProcessorService, 4],
	['TickChartsProcessorService', TickChartsProcessorService, 13],
	['UserWebhookDeliverProcessorService', UserWebhookDeliverProcessorService, 4],
] as const;

for (const [name, feature, parameterCount] of processors) {
	test(`${name} is registered once with its canonical constructor metadata`, () => {
		expect(processorProviders.filter(provider => provider === feature)).toHaveLength(1);
		expect(Reflect.getMetadata('design:paramtypes', feature)).toHaveLength(parameterCount);
	});
}
