/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { expect, test } from 'vitest';
import { AggregateRetentionProcessorService as LegacyAggregateRetentionProcessorService } from './AggregateRetentionProcessorService.js';
import { AggregateRetentionProcessorService } from '../../../../features/statistics/backend/jobs/AggregateRetentionProcessorService.js';
import { BakeBufferedReactionsProcessorService as LegacyBakeBufferedReactionsProcessorService } from './BakeBufferedReactionsProcessorService.js';
import { BakeBufferedReactionsProcessorService } from '../../../../features/notes/backend/jobs/BakeBufferedReactionsProcessorService.js';
import { CheckModeratorsActivityProcessorService as LegacyCheckModeratorsActivityProcessorService } from './CheckModeratorsActivityProcessorService.js';
import { CheckModeratorsActivityProcessorService } from '../../../../features/moderation/backend/jobs/CheckModeratorsActivityProcessorService.js';
import { CleanChartsProcessorService as LegacyCleanChartsProcessorService } from './CleanChartsProcessorService.js';
import { CleanChartsProcessorService } from '../../../../features/statistics/backend/jobs/CleanChartsProcessorService.js';
import { CleanRemoteFilesProcessorService as LegacyCleanRemoteFilesProcessorService } from './CleanRemoteFilesProcessorService.js';
import { CleanRemoteFilesProcessorService } from '../../../../features/drive/backend/jobs/CleanRemoteFilesProcessorService.js';
import { DeleteAccountProcessorService as LegacyDeleteAccountProcessorService } from './DeleteAccountProcessorService.js';
import { DeleteAccountProcessorService } from '../../../../features/users/backend/jobs/DeleteAccountProcessorService.js';
import { DeleteDriveFilesProcessorService as LegacyDeleteDriveFilesProcessorService } from './DeleteDriveFilesProcessorService.js';
import { DeleteDriveFilesProcessorService } from '../../../../features/drive/backend/jobs/DeleteDriveFilesProcessorService.js';
import { DeleteFileProcessorService as LegacyDeleteFileProcessorService } from './DeleteFileProcessorService.js';
import { DeleteFileProcessorService } from '../../../../features/drive/backend/jobs/DeleteFileProcessorService.js';
import { DeliverProcessorService as LegacyDeliverProcessorService } from './DeliverProcessorService.js';
import { DeliverProcessorService } from '../../../../features/federation/backend/jobs/DeliverProcessorService.js';
import { EndedPollNotificationProcessorService as LegacyEndedPollNotificationProcessorService } from './EndedPollNotificationProcessorService.js';
import { EndedPollNotificationProcessorService } from '../../../../features/notes/backend/jobs/EndedPollNotificationProcessorService.js';
import { ExportAntennasProcessorService as LegacyExportAntennasProcessorService } from './ExportAntennasProcessorService.js';
import { ExportAntennasProcessorService } from '../../../../features/timelines/backend/jobs/ExportAntennasProcessorService.js';
import { ExportBlockingProcessorService as LegacyExportBlockingProcessorService } from './ExportBlockingProcessorService.js';
import { ExportBlockingProcessorService } from '../../../../features/relationships/backend/jobs/ExportBlockingProcessorService.js';
import { ExportClipsProcessorService as LegacyExportClipsProcessorService } from './ExportClipsProcessorService.js';
import { ExportClipsProcessorService } from '../../../../features/collections/backend/jobs/ExportClipsProcessorService.js';
import { ExportCustomEmojisProcessorService as LegacyExportCustomEmojisProcessorService } from './ExportCustomEmojisProcessorService.js';
import { ExportCustomEmojisProcessorService } from '../../../../features/emojis/backend/jobs/ExportCustomEmojisProcessorService.js';
import { ExportFavoritesProcessorService as LegacyExportFavoritesProcessorService } from './ExportFavoritesProcessorService.js';
import { ExportFavoritesProcessorService } from '../../../../features/collections/backend/jobs/ExportFavoritesProcessorService.js';
import { ExportFollowingProcessorService as LegacyExportFollowingProcessorService } from './ExportFollowingProcessorService.js';
import { ExportFollowingProcessorService } from '../../../../features/relationships/backend/jobs/ExportFollowingProcessorService.js';
import { ExportMutingProcessorService as LegacyExportMutingProcessorService } from './ExportMutingProcessorService.js';
import { ExportMutingProcessorService } from '../../../../features/relationships/backend/jobs/ExportMutingProcessorService.js';
import { ExportNotesProcessorService as LegacyExportNotesProcessorService } from './ExportNotesProcessorService.js';
import { ExportNotesProcessorService } from '../../../../features/notes/backend/jobs/ExportNotesProcessorService.js';
import { ExportUserListsProcessorService as LegacyExportUserListsProcessorService } from './ExportUserListsProcessorService.js';
import { ExportUserListsProcessorService } from '../../../../features/relationships/backend/jobs/ExportUserListsProcessorService.js';
import { ImportAntennasProcessorService as LegacyImportAntennasProcessorService } from './ImportAntennasProcessorService.js';
import { ImportAntennasProcessorService } from '../../../../features/timelines/backend/jobs/ImportAntennasProcessorService.js';
import { ImportBlockingProcessorService as LegacyImportBlockingProcessorService } from './ImportBlockingProcessorService.js';
import { ImportBlockingProcessorService } from '../../../../features/relationships/backend/jobs/ImportBlockingProcessorService.js';
import { ImportCustomEmojisProcessorService as LegacyImportCustomEmojisProcessorService } from './ImportCustomEmojisProcessorService.js';
import { ImportCustomEmojisProcessorService } from '../../../../features/emojis/backend/jobs/ImportCustomEmojisProcessorService.js';
import { ImportFollowingProcessorService as LegacyImportFollowingProcessorService } from './ImportFollowingProcessorService.js';
import { ImportFollowingProcessorService } from '../../../../features/relationships/backend/jobs/ImportFollowingProcessorService.js';
import { ImportMutingProcessorService as LegacyImportMutingProcessorService } from './ImportMutingProcessorService.js';
import { ImportMutingProcessorService } from '../../../../features/relationships/backend/jobs/ImportMutingProcessorService.js';
import { ImportUserListsProcessorService as LegacyImportUserListsProcessorService } from './ImportUserListsProcessorService.js';
import { ImportUserListsProcessorService } from '../../../../features/relationships/backend/jobs/ImportUserListsProcessorService.js';
import { InboxProcessorService as LegacyInboxProcessorService } from './InboxProcessorService.js';
import { InboxProcessorService } from '../../../../features/federation/backend/jobs/InboxProcessorService.js';
import { PostScheduledNoteProcessorService as LegacyPostScheduledNoteProcessorService } from './PostScheduledNoteProcessorService.js';
import { PostScheduledNoteProcessorService } from '../../../../features/notes/backend/jobs/PostScheduledNoteProcessorService.js';
import { RelationshipProcessorService as LegacyRelationshipProcessorService } from './RelationshipProcessorService.js';
import { RelationshipProcessorService } from '../../../../features/relationships/backend/jobs/RelationshipProcessorService.js';
import { ResyncChartsProcessorService as LegacyResyncChartsProcessorService } from './ResyncChartsProcessorService.js';
import { ResyncChartsProcessorService } from '../../../../features/statistics/backend/jobs/ResyncChartsProcessorService.js';
import { SystemWebhookDeliverProcessorService as LegacySystemWebhookDeliverProcessorService } from './SystemWebhookDeliverProcessorService.js';
import { SystemWebhookDeliverProcessorService } from '../../../../features/integrations/backend/jobs/SystemWebhookDeliverProcessorService.js';
import { TickChartsProcessorService as LegacyTickChartsProcessorService } from './TickChartsProcessorService.js';
import { TickChartsProcessorService } from '../../../../features/statistics/backend/jobs/TickChartsProcessorService.js';
import { UserWebhookDeliverProcessorService as LegacyUserWebhookDeliverProcessorService } from './UserWebhookDeliverProcessorService.js';
import { UserWebhookDeliverProcessorService } from '../../../../features/integrations/backend/jobs/UserWebhookDeliverProcessorService.js';

const processors = [
	['AggregateRetentionProcessorService', LegacyAggregateRetentionProcessorService, AggregateRetentionProcessorService, 4],
	['BakeBufferedReactionsProcessorService', LegacyBakeBufferedReactionsProcessorService, BakeBufferedReactionsProcessorService, 3],
	['CheckModeratorsActivityProcessorService', LegacyCheckModeratorsActivityProcessorService, CheckModeratorsActivityProcessorService, 7],
	['CleanChartsProcessorService', LegacyCleanChartsProcessorService, CleanChartsProcessorService, 13],
	['CleanRemoteFilesProcessorService', LegacyCleanRemoteFilesProcessorService, CleanRemoteFilesProcessorService, 3],
	['DeleteAccountProcessorService', LegacyDeleteAccountProcessorService, DeleteAccountProcessorService, 10],
	['DeleteDriveFilesProcessorService', LegacyDeleteDriveFilesProcessorService, DeleteDriveFilesProcessorService, 4],
	['DeleteFileProcessorService', LegacyDeleteFileProcessorService, DeleteFileProcessorService, 2],
	['DeliverProcessorService', LegacyDeliverProcessorService, DeliverProcessorService, 10],
	['EndedPollNotificationProcessorService', LegacyEndedPollNotificationProcessorService, EndedPollNotificationProcessorService, 5],
	['ExportAntennasProcessorService', LegacyExportAntennasProcessorService, ExportAntennasProcessorService, 7],
	['ExportBlockingProcessorService', LegacyExportBlockingProcessorService, ExportBlockingProcessorService, 6],
	['ExportClipsProcessorService', LegacyExportClipsProcessorService, ExportClipsProcessorService, 9],
	['ExportCustomEmojisProcessorService', LegacyExportCustomEmojisProcessorService, ExportCustomEmojisProcessorService, 7],
	['ExportFavoritesProcessorService', LegacyExportFavoritesProcessorService, ExportFavoritesProcessorService, 8],
	['ExportFollowingProcessorService', LegacyExportFollowingProcessorService, ExportFollowingProcessorService, 7],
	['ExportMutingProcessorService', LegacyExportMutingProcessorService, ExportMutingProcessorService, 6],
	['ExportNotesProcessorService', LegacyExportNotesProcessorService, ExportNotesProcessorService, 8],
	['ExportUserListsProcessorService', LegacyExportUserListsProcessorService, ExportUserListsProcessorService, 7],
	['ImportAntennasProcessorService', LegacyImportAntennasProcessorService, ImportAntennasProcessorService, 4],
	['ImportBlockingProcessorService', LegacyImportBlockingProcessorService, ImportBlockingProcessorService, 7],
	['ImportCustomEmojisProcessorService', LegacyImportCustomEmojisProcessorService, ImportCustomEmojisProcessorService, 6],
	['ImportFollowingProcessorService', LegacyImportFollowingProcessorService, ImportFollowingProcessorService, 7],
	['ImportMutingProcessorService', LegacyImportMutingProcessorService, ImportMutingProcessorService, 7],
	['ImportUserListsProcessorService', LegacyImportUserListsProcessorService, ImportUserListsProcessorService, 10],
	['InboxProcessorService', LegacyInboxProcessorService, InboxProcessorService, 12],
	['PostScheduledNoteProcessorService', LegacyPostScheduledNoteProcessorService, PostScheduledNoteProcessorService, 4],
	['RelationshipProcessorService', LegacyRelationshipProcessorService, RelationshipProcessorService, 4],
	['ResyncChartsProcessorService', LegacyResyncChartsProcessorService, ResyncChartsProcessorService, 4],
	['SystemWebhookDeliverProcessorService', LegacySystemWebhookDeliverProcessorService, SystemWebhookDeliverProcessorService, 4],
	['TickChartsProcessorService', LegacyTickChartsProcessorService, TickChartsProcessorService, 13],
	['UserWebhookDeliverProcessorService', LegacyUserWebhookDeliverProcessorService, UserWebhookDeliverProcessorService, 4],
] as const;

for (const [name, legacy, feature, parameterCount] of processors) {
	test(`${name} keeps the legacy provider identity and constructor metadata`, () => {
		expect(legacy).toBe(feature);
		expect(Reflect.getMetadata('design:paramtypes', feature)).toHaveLength(parameterCount);
	});
}
