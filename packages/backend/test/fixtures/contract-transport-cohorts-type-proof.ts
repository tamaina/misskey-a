/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Compile-only proof. Never execute this file. Native contracts are the sole payload witnesses.
import type { InferContractRouterOutputs } from '@orpc/contract';
import type { Endpoints } from '../../../misskey-js/src/api.types.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiAccessToken } from '@features/auth/backend/models/AccessToken.js';
import { createContractTransportEndpoint } from '@features/api/backend/transport/contract-transport-endpoint.js';
import { moderationCommandsContract } from '@features/moderation/contract/index.js';
import { announcementCommandsContract } from '@features/announcements/contract/index.js';
import { avatarDecorationCommandsContract, avatarDecorationsContract } from '@features/avatar-decorations/contract/index.js';
import { emojisContract } from '@features/emojis/contract/index.js';
import { operationsContract } from '@features/operations/contract/index.js';
import { chatContract } from '@features/chat/contract/index.js';
import { collectionsContract } from '@features/collections/contract/index.js';
import { instanceContract } from '@features/instance/contract/index.js';
import { relationshipContract } from '@features/relationships/contract/commands.js';
import { portabilityContract } from '@features/portability/contract/index.js';
import { portabilityImportContract } from '@features/portability/contract/imports.js';
import { webhookContract } from '@features/integrations/contract/index.js';
import { notificationsContract } from '@features/notifications/contract/index.js';
import { statisticsContract } from '@features/statistics/contract/index.js';
import { listContract } from '@features/relationships/contract/lists.js';
import { notesCommandsContract } from '@features/notes/contract/index.js';
import type { createEndpoint as factory0 } from '@features/moderation/backend/endpoints/admin/abuse-report/notification-recipient/delete.js';
import type { createEndpoint as factory1 } from '@features/announcements/backend/endpoints/admin/announcements/delete.js';
import type { createEndpoint as factory2 } from '@features/announcements/backend/endpoints/admin/announcements/update.js';
import type { createEndpoint as factory3 } from '@features/avatar-decorations/backend/endpoints/admin/avatar-decorations/delete.js';
import type { createEndpoint as factory4 } from '@features/avatar-decorations/backend/endpoints/admin/avatar-decorations/update.js';
import type { createEndpoint as factory5 } from '@features/emojis/backend/endpoints/admin/emoji/add-aliases-bulk.js';
import type { createEndpoint as factory6 } from '@features/emojis/backend/endpoints/admin/emoji/remove-aliases-bulk.js';
import type { createEndpoint as factory7 } from '@features/emojis/backend/endpoints/admin/emoji/set-aliases-bulk.js';
import type { createEndpoint as factory8 } from '@features/emojis/backend/endpoints/admin/emoji/set-category-bulk.js';
import type { createEndpoint as factory9 } from '@features/emojis/backend/endpoints/admin/emoji/set-license-bulk.js';
import type { createEndpoint as factory10 } from '@features/moderation/backend/endpoints/admin/forward-abuse-user-report.js';
import type { createEndpoint as factory11 } from '@features/operations/backend/endpoints/admin/queue/clear.js';
import type { createEndpoint as factory12 } from '@features/operations/backend/endpoints/admin/queue/pause.js';
import type { createEndpoint as factory13 } from '@features/operations/backend/endpoints/admin/queue/promote-jobs.js';
import type { createEndpoint as factory14 } from '@features/operations/backend/endpoints/admin/queue/remove-job.js';
import type { createEndpoint as factory15 } from '@features/operations/backend/endpoints/admin/queue/resume.js';
import type { createEndpoint as factory16 } from '@features/operations/backend/endpoints/admin/queue/retry-job.js';
import type { createEndpoint as factory17 } from '@features/moderation/backend/endpoints/admin/resolve-abuse-user-report.js';
import type { createEndpoint as factory18 } from '@features/moderation/backend/endpoints/admin/suspend-user.js';
import type { createEndpoint as factory19 } from '@features/moderation/backend/endpoints/admin/unset-user-avatar.js';
import type { createEndpoint as factory20 } from '@features/moderation/backend/endpoints/admin/unset-user-banner.js';
import type { createEndpoint as factory21 } from '@features/moderation/backend/endpoints/admin/unsuspend-user.js';
import type { createEndpoint as factory22 } from '@features/moderation/backend/endpoints/admin/update-abuse-user-report.js';
import type { createEndpoint as factory23 } from '@features/moderation/backend/endpoints/admin/update-user-note.js';
import type { createEndpoint as factory24 } from '@features/chat/backend/endpoints/chat/messages/delete.js';
import type { createEndpoint as factory25 } from '@features/chat/backend/endpoints/chat/messages/react.js';
import type { createEndpoint as factory26 } from '@features/chat/backend/endpoints/chat/messages/unreact.js';
import type { createEndpoint as factory27 } from '@features/chat/backend/endpoints/chat/read-all.js';
import type { createEndpoint as factory28 } from '@features/chat/backend/endpoints/chat/rooms/delete.js';
import type { createEndpoint as factory29 } from '@features/chat/backend/endpoints/chat/rooms/invitations/ignore.js';
import type { createEndpoint as factory30 } from '@features/chat/backend/endpoints/chat/rooms/join.js';
import type { createEndpoint as factory31 } from '@features/chat/backend/endpoints/chat/rooms/leave.js';
import type { createEndpoint as factory32 } from '@features/chat/backend/endpoints/chat/rooms/mute.js';
import type { createEndpoint as factory33 } from '@features/collections/backend/endpoints/clips/add-note.js';
import type { createEndpoint as factory34 } from '@features/collections/backend/endpoints/clips/delete.js';
import type { createEndpoint as factory35 } from '@features/collections/backend/endpoints/clips/remove-note.js';
import type { createEndpoint as factory36 } from '@features/emojis/backend/endpoints/emoji.js';
import type { createEndpoint as factory37 } from '@features/emojis/backend/endpoints/emojis.js';
import type { createEndpoint as factory38 } from '@features/instance/backend/endpoints/endpoint.js';
import type { createEndpoint as factory39 } from '@features/instance/backend/endpoints/endpoints.js';
import type { createEndpoint as factory40 } from '@features/relationships/backend/endpoints/following/requests/accept.js';
import type { createEndpoint as factory41 } from '@features/relationships/backend/endpoints/following/requests/reject.js';
import type { createEndpoint as factory42 } from '@features/avatar-decorations/backend/endpoints/get-avatar-decorations.js';
import type { createEndpoint as factory43 } from '@features/instance/backend/endpoints/get-online-users-count.js';
import type { createEndpoint as factory44 } from '@features/portability/backend/endpoints/i/export-antennas.js';
import type { createEndpoint as factory45 } from '@features/portability/backend/endpoints/i/export-blocking.js';
import type { createEndpoint as factory46 } from '@features/portability/backend/endpoints/i/export-clips.js';
import type { createEndpoint as factory47 } from '@features/portability/backend/endpoints/i/export-favorites.js';
import type { createEndpoint as factory48 } from '@features/portability/backend/endpoints/i/export-following.js';
import type { createEndpoint as factory49 } from '@features/portability/backend/endpoints/i/export-mute.js';
import type { createEndpoint as factory50 } from '@features/portability/backend/endpoints/i/export-notes.js';
import type { createEndpoint as factory51 } from '@features/portability/backend/endpoints/i/export-user-lists.js';
import type { createEndpoint as factory52 } from '@features/portability/backend/endpoints/i/import-antennas.js';
import type { createEndpoint as factory53 } from '@features/portability/backend/endpoints/i/import-blocking.js';
import type { createEndpoint as factory54 } from '@features/portability/backend/endpoints/i/import-following.js';
import type { createEndpoint as factory55 } from '@features/portability/backend/endpoints/i/import-muting.js';
import type { createEndpoint as factory56 } from '@features/portability/backend/endpoints/i/import-user-lists.js';
import type { createEndpoint as factory57 } from '@features/announcements/backend/endpoints/i/read-announcement.js';
import type { createEndpoint as factory58 } from '@features/integrations/backend/endpoints/i/webhooks/delete.js';
import type { createEndpoint as factory59 } from '@features/integrations/backend/endpoints/i/webhooks/update.js';
import type { createEndpoint as factory60 } from '@features/relationships/backend/endpoints/mute/delete.js';
import type { createEndpoint as factory61 } from '@features/notifications/backend/endpoints/notifications/create.js';
import type { createEndpoint as factory62 } from '@features/notifications/backend/endpoints/notifications/flush.js';
import type { createEndpoint as factory63 } from '@features/notifications/backend/endpoints/notifications/mark-all-as-read.js';
import type { createEndpoint as factory64 } from '@features/notifications/backend/endpoints/notifications/test-notification.js';
import type { createEndpoint as factory65 } from '@features/instance/backend/endpoints/ping.js';
import type { createEndpoint as factory66 } from '@features/relationships/backend/endpoints/renote-mute/create.js';
import type { createEndpoint as factory67 } from '@features/relationships/backend/endpoints/renote-mute/delete.js';
import type { createEndpoint as factory68 } from '@features/instance/backend/endpoints/server-info.js';
import type { createEndpoint as factory69 } from '@features/statistics/backend/endpoints/stats.js';
import type { createEndpoint as factory70 } from '@features/relationships/backend/endpoints/users/lists/delete.js';
import type { createEndpoint as factory71 } from '@features/relationships/backend/endpoints/users/lists/favorite.js';
import type { createEndpoint as factory72 } from '@features/relationships/backend/endpoints/users/lists/pull.js';
import type { createEndpoint as factory73 } from '@features/relationships/backend/endpoints/users/lists/push.js';
import type { createEndpoint as factory74 } from '@features/relationships/backend/endpoints/users/lists/unfavorite.js';
import type { createEndpoint as factory75 } from '@features/relationships/backend/endpoints/users/lists/update-membership.js';
import type { createEndpoint as factory76 } from '@features/notes/backend/endpoints/notes/delete.js';
import type { createEndpoint as factory77 } from '@features/notes/backend/endpoints/notes/drafts/delete.js';
import type { createEndpoint as factory78 } from '@features/notes/backend/endpoints/notes/reactions/create.js';
import type { createEndpoint as factory79 } from '@features/notes/backend/endpoints/notes/reactions/delete.js';
import type { createEndpoint as factory80 } from '@features/notes/backend/endpoints/notes/thread-muting/create.js';
import type { createEndpoint as factory81 } from '@features/notes/backend/endpoints/notes/thread-muting/delete.js';
import type { createEndpoint as factory82 } from '@features/notes/backend/endpoints/notes/unrenote.js';
import type { createEndpoint as factory83 } from '@features/notes/backend/endpoints/promo/read.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends (1 & T) ? true : false;

export type ContractTransportCohortAssertions = [
	// admin/abuse-report/notification-recipient/delete
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory0>['exec']>>, InferContractRouterOutputs<{ route: typeof moderationCommandsContract['admin/abuse-report/notification-recipient/delete'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory0>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory0>['exec']>>, Endpoints['admin/abuse-report/notification-recipient/delete']['res']>>,
	// admin/announcements/delete
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory1>['exec']>>, InferContractRouterOutputs<{ route: typeof announcementCommandsContract['admin/announcements/delete'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory1>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory1>['exec']>>, Endpoints['admin/announcements/delete']['res']>>,
	// admin/announcements/update
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory2>['exec']>>, InferContractRouterOutputs<{ route: typeof announcementCommandsContract['admin/announcements/update'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory2>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory2>['exec']>>, Endpoints['admin/announcements/update']['res']>>,
	// admin/avatar-decorations/delete
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory3>['exec']>>, InferContractRouterOutputs<{ route: typeof avatarDecorationCommandsContract['admin/avatar-decorations/delete'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory3>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory3>['exec']>>, Endpoints['admin/avatar-decorations/delete']['res']>>,
	// admin/avatar-decorations/update
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory4>['exec']>>, InferContractRouterOutputs<{ route: typeof avatarDecorationCommandsContract['admin/avatar-decorations/update'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory4>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory4>['exec']>>, Endpoints['admin/avatar-decorations/update']['res']>>,
	// admin/emoji/add-aliases-bulk
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory5>['exec']>>, InferContractRouterOutputs<{ route: typeof emojisContract['admin/emoji/add-aliases-bulk'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory5>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory5>['exec']>>, Endpoints['admin/emoji/add-aliases-bulk']['res']>>,
	// admin/emoji/remove-aliases-bulk
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory6>['exec']>>, InferContractRouterOutputs<{ route: typeof emojisContract['admin/emoji/remove-aliases-bulk'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory6>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory6>['exec']>>, Endpoints['admin/emoji/remove-aliases-bulk']['res']>>,
	// admin/emoji/set-aliases-bulk
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory7>['exec']>>, InferContractRouterOutputs<{ route: typeof emojisContract['admin/emoji/set-aliases-bulk'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory7>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory7>['exec']>>, Endpoints['admin/emoji/set-aliases-bulk']['res']>>,
	// admin/emoji/set-category-bulk
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory8>['exec']>>, InferContractRouterOutputs<{ route: typeof emojisContract['admin/emoji/set-category-bulk'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory8>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory8>['exec']>>, Endpoints['admin/emoji/set-category-bulk']['res']>>,
	// admin/emoji/set-license-bulk
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory9>['exec']>>, InferContractRouterOutputs<{ route: typeof emojisContract['admin/emoji/set-license-bulk'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory9>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory9>['exec']>>, Endpoints['admin/emoji/set-license-bulk']['res']>>,
	// admin/forward-abuse-user-report
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory10>['exec']>>, InferContractRouterOutputs<{ route: typeof moderationCommandsContract['admin/forward-abuse-user-report'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory10>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory10>['exec']>>, Endpoints['admin/forward-abuse-user-report']['res']>>,
	// admin/queue/clear
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory11>['exec']>>, InferContractRouterOutputs<{ route: typeof operationsContract['admin/queue/clear'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory11>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory11>['exec']>>, Endpoints['admin/queue/clear']['res']>>,
	// admin/queue/pause
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory12>['exec']>>, InferContractRouterOutputs<{ route: typeof operationsContract['admin/queue/pause'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory12>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory12>['exec']>>, Endpoints['admin/queue/pause']['res']>>,
	// admin/queue/promote-jobs
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory13>['exec']>>, InferContractRouterOutputs<{ route: typeof operationsContract['admin/queue/promote-jobs'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory13>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory13>['exec']>>, Endpoints['admin/queue/promote-jobs']['res']>>,
	// admin/queue/remove-job
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory14>['exec']>>, InferContractRouterOutputs<{ route: typeof operationsContract['admin/queue/remove-job'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory14>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory14>['exec']>>, Endpoints['admin/queue/remove-job']['res']>>,
	// admin/queue/resume
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory15>['exec']>>, InferContractRouterOutputs<{ route: typeof operationsContract['admin/queue/resume'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory15>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory15>['exec']>>, Endpoints['admin/queue/resume']['res']>>,
	// admin/queue/retry-job
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory16>['exec']>>, InferContractRouterOutputs<{ route: typeof operationsContract['admin/queue/retry-job'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory16>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory16>['exec']>>, Endpoints['admin/queue/retry-job']['res']>>,
	// admin/resolve-abuse-user-report
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory17>['exec']>>, InferContractRouterOutputs<{ route: typeof moderationCommandsContract['admin/resolve-abuse-user-report'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory17>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory17>['exec']>>, Endpoints['admin/resolve-abuse-user-report']['res']>>,
	// admin/suspend-user
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory18>['exec']>>, InferContractRouterOutputs<{ route: typeof moderationCommandsContract['admin/suspend-user'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory18>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory18>['exec']>>, Endpoints['admin/suspend-user']['res']>>,
	// admin/unset-user-avatar
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory19>['exec']>>, InferContractRouterOutputs<{ route: typeof moderationCommandsContract['admin/unset-user-avatar'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory19>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory19>['exec']>>, Endpoints['admin/unset-user-avatar']['res']>>,
	// admin/unset-user-banner
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory20>['exec']>>, InferContractRouterOutputs<{ route: typeof moderationCommandsContract['admin/unset-user-banner'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory20>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory20>['exec']>>, Endpoints['admin/unset-user-banner']['res']>>,
	// admin/unsuspend-user
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory21>['exec']>>, InferContractRouterOutputs<{ route: typeof moderationCommandsContract['admin/unsuspend-user'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory21>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory21>['exec']>>, Endpoints['admin/unsuspend-user']['res']>>,
	// admin/update-abuse-user-report
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory22>['exec']>>, InferContractRouterOutputs<{ route: typeof moderationCommandsContract['admin/update-abuse-user-report'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory22>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory22>['exec']>>, Endpoints['admin/update-abuse-user-report']['res']>>,
	// admin/update-user-note
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory23>['exec']>>, InferContractRouterOutputs<{ route: typeof moderationCommandsContract['admin/update-user-note'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory23>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory23>['exec']>>, Endpoints['admin/update-user-note']['res']>>,
	// chat/messages/delete
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory24>['exec']>>, InferContractRouterOutputs<{ route: typeof chatContract['chat/messages/delete'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory24>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory24>['exec']>>, Endpoints['chat/messages/delete']['res']>>,
	// chat/messages/react
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory25>['exec']>>, InferContractRouterOutputs<{ route: typeof chatContract['chat/messages/react'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory25>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory25>['exec']>>, Endpoints['chat/messages/react']['res']>>,
	// chat/messages/unreact
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory26>['exec']>>, InferContractRouterOutputs<{ route: typeof chatContract['chat/messages/unreact'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory26>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory26>['exec']>>, Endpoints['chat/messages/unreact']['res']>>,
	// chat/read-all
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory27>['exec']>>, InferContractRouterOutputs<{ route: typeof chatContract['chat/read-all'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory27>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory27>['exec']>>, Endpoints['chat/read-all']['res']>>,
	// chat/rooms/delete
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory28>['exec']>>, InferContractRouterOutputs<{ route: typeof chatContract['chat/rooms/delete'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory28>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory28>['exec']>>, Endpoints['chat/rooms/delete']['res']>>,
	// chat/rooms/invitations/ignore
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory29>['exec']>>, InferContractRouterOutputs<{ route: typeof chatContract['chat/rooms/invitations/ignore'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory29>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory29>['exec']>>, Endpoints['chat/rooms/invitations/ignore']['res']>>,
	// chat/rooms/join
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory30>['exec']>>, InferContractRouterOutputs<{ route: typeof chatContract['chat/rooms/join'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory30>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory30>['exec']>>, Endpoints['chat/rooms/join']['res']>>,
	// chat/rooms/leave
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory31>['exec']>>, InferContractRouterOutputs<{ route: typeof chatContract['chat/rooms/leave'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory31>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory31>['exec']>>, Endpoints['chat/rooms/leave']['res']>>,
	// chat/rooms/mute
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory32>['exec']>>, InferContractRouterOutputs<{ route: typeof chatContract['chat/rooms/mute'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory32>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory32>['exec']>>, Endpoints['chat/rooms/mute']['res']>>,
	// clips/add-note
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory33>['exec']>>, InferContractRouterOutputs<{ route: typeof collectionsContract['clips/add-note'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory33>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory33>['exec']>>, Endpoints['clips/add-note']['res']>>,
	// clips/delete
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory34>['exec']>>, InferContractRouterOutputs<{ route: typeof collectionsContract['clips/delete'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory34>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory34>['exec']>>, Endpoints['clips/delete']['res']>>,
	// clips/remove-note
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory35>['exec']>>, InferContractRouterOutputs<{ route: typeof collectionsContract['clips/remove-note'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory35>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory35>['exec']>>, Endpoints['clips/remove-note']['res']>>,
	// emoji
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory36>['exec']>>, InferContractRouterOutputs<{ route: typeof emojisContract['emoji'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory36>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory36>['exec']>>, Endpoints['emoji']['res']>>,
	// emojis
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory37>['exec']>>, InferContractRouterOutputs<{ route: typeof emojisContract['emojis'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory37>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory37>['exec']>>, Endpoints['emojis']['res']>>,
	// endpoint
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory38>['exec']>>, InferContractRouterOutputs<{ route: typeof instanceContract['endpoint'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory38>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory38>['exec']>>, Endpoints['endpoint']['res']>>,
	// endpoints
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory39>['exec']>>, InferContractRouterOutputs<{ route: typeof instanceContract['endpoints'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory39>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory39>['exec']>>, Endpoints['endpoints']['res']>>,
	// following/requests/accept
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory40>['exec']>>, InferContractRouterOutputs<{ route: typeof relationshipContract['following/requests/accept'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory40>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory40>['exec']>>, Endpoints['following/requests/accept']['res']>>,
	// following/requests/reject
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory41>['exec']>>, InferContractRouterOutputs<{ route: typeof relationshipContract['following/requests/reject'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory41>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory41>['exec']>>, Endpoints['following/requests/reject']['res']>>,
	// get-avatar-decorations
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory42>['exec']>>, InferContractRouterOutputs<{ route: typeof avatarDecorationsContract['get-avatar-decorations'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory42>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory42>['exec']>>, Endpoints['get-avatar-decorations']['res']>>,
	// get-online-users-count
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory43>['exec']>>, InferContractRouterOutputs<{ route: typeof instanceContract['get-online-users-count'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory43>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory43>['exec']>>, Endpoints['get-online-users-count']['res']>>,
	// i/export-antennas
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory44>['exec']>>, InferContractRouterOutputs<{ route: typeof portabilityContract['i/export-antennas'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory44>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory44>['exec']>>, Endpoints['i/export-antennas']['res']>>,
	// i/export-blocking
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory45>['exec']>>, InferContractRouterOutputs<{ route: typeof portabilityContract['i/export-blocking'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory45>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory45>['exec']>>, Endpoints['i/export-blocking']['res']>>,
	// i/export-clips
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory46>['exec']>>, InferContractRouterOutputs<{ route: typeof portabilityContract['i/export-clips'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory46>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory46>['exec']>>, Endpoints['i/export-clips']['res']>>,
	// i/export-favorites
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory47>['exec']>>, InferContractRouterOutputs<{ route: typeof portabilityContract['i/export-favorites'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory47>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory47>['exec']>>, Endpoints['i/export-favorites']['res']>>,
	// i/export-following
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory48>['exec']>>, InferContractRouterOutputs<{ route: typeof portabilityContract['i/export-following'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory48>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory48>['exec']>>, Endpoints['i/export-following']['res']>>,
	// i/export-mute
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory49>['exec']>>, InferContractRouterOutputs<{ route: typeof portabilityContract['i/export-mute'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory49>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory49>['exec']>>, Endpoints['i/export-mute']['res']>>,
	// i/export-notes
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory50>['exec']>>, InferContractRouterOutputs<{ route: typeof portabilityContract['i/export-notes'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory50>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory50>['exec']>>, Endpoints['i/export-notes']['res']>>,
	// i/export-user-lists
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory51>['exec']>>, InferContractRouterOutputs<{ route: typeof portabilityContract['i/export-user-lists'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory51>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory51>['exec']>>, Endpoints['i/export-user-lists']['res']>>,
	// i/import-antennas
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory52>['exec']>>, InferContractRouterOutputs<{ route: typeof portabilityImportContract['i/import-antennas'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory52>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory52>['exec']>>, Endpoints['i/import-antennas']['res']>>,
	// i/import-blocking
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory53>['exec']>>, InferContractRouterOutputs<{ route: typeof portabilityImportContract['i/import-blocking'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory53>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory53>['exec']>>, Endpoints['i/import-blocking']['res']>>,
	// i/import-following
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory54>['exec']>>, InferContractRouterOutputs<{ route: typeof portabilityImportContract['i/import-following'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory54>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory54>['exec']>>, Endpoints['i/import-following']['res']>>,
	// i/import-muting
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory55>['exec']>>, InferContractRouterOutputs<{ route: typeof portabilityImportContract['i/import-muting'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory55>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory55>['exec']>>, Endpoints['i/import-muting']['res']>>,
	// i/import-user-lists
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory56>['exec']>>, InferContractRouterOutputs<{ route: typeof portabilityImportContract['i/import-user-lists'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory56>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory56>['exec']>>, Endpoints['i/import-user-lists']['res']>>,
	// i/read-announcement
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory57>['exec']>>, InferContractRouterOutputs<{ route: typeof announcementCommandsContract['i/read-announcement'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory57>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory57>['exec']>>, Endpoints['i/read-announcement']['res']>>,
	// i/webhooks/delete
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory58>['exec']>>, InferContractRouterOutputs<{ route: typeof webhookContract['i/webhooks/delete'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory58>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory58>['exec']>>, Endpoints['i/webhooks/delete']['res']>>,
	// i/webhooks/update
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory59>['exec']>>, InferContractRouterOutputs<{ route: typeof webhookContract['i/webhooks/update'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory59>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory59>['exec']>>, Endpoints['i/webhooks/update']['res']>>,
	// mute/delete
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory60>['exec']>>, InferContractRouterOutputs<{ route: typeof relationshipContract['mute/delete'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory60>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory60>['exec']>>, Endpoints['mute/delete']['res']>>,
	// notifications/create
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory61>['exec']>>, InferContractRouterOutputs<{ route: typeof notificationsContract['notifications/create'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory61>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory61>['exec']>>, Endpoints['notifications/create']['res']>>,
	// notifications/flush
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory62>['exec']>>, InferContractRouterOutputs<{ route: typeof notificationsContract['notifications/flush'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory62>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory62>['exec']>>, Endpoints['notifications/flush']['res']>>,
	// notifications/mark-all-as-read
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory63>['exec']>>, InferContractRouterOutputs<{ route: typeof notificationsContract['notifications/mark-all-as-read'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory63>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory63>['exec']>>, Endpoints['notifications/mark-all-as-read']['res']>>,
	// notifications/test-notification
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory64>['exec']>>, InferContractRouterOutputs<{ route: typeof notificationsContract['notifications/test-notification'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory64>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory64>['exec']>>, Endpoints['notifications/test-notification']['res']>>,
	// ping
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory65>['exec']>>, InferContractRouterOutputs<{ route: typeof instanceContract['ping'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory65>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory65>['exec']>>, Endpoints['ping']['res']>>,
	// renote-mute/create
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory66>['exec']>>, InferContractRouterOutputs<{ route: typeof relationshipContract['renote-mute/create'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory66>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory66>['exec']>>, Endpoints['renote-mute/create']['res']>>,
	// renote-mute/delete
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory67>['exec']>>, InferContractRouterOutputs<{ route: typeof relationshipContract['renote-mute/delete'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory67>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory67>['exec']>>, Endpoints['renote-mute/delete']['res']>>,
	// server-info
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory68>['exec']>>, InferContractRouterOutputs<{ route: typeof instanceContract['server-info'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory68>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory68>['exec']>>, Endpoints['server-info']['res']>>,
	// stats
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory69>['exec']>>, InferContractRouterOutputs<{ route: typeof statisticsContract['stats'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory69>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory69>['exec']>>, Endpoints['stats']['res']>>,
	// users/lists/delete
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory70>['exec']>>, InferContractRouterOutputs<{ route: typeof listContract['users/lists/delete'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory70>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory70>['exec']>>, Endpoints['users/lists/delete']['res']>>,
	// users/lists/favorite
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory71>['exec']>>, InferContractRouterOutputs<{ route: typeof listContract['users/lists/favorite'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory71>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory71>['exec']>>, Endpoints['users/lists/favorite']['res']>>,
	// users/lists/pull
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory72>['exec']>>, InferContractRouterOutputs<{ route: typeof listContract['users/lists/pull'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory72>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory72>['exec']>>, Endpoints['users/lists/pull']['res']>>,
	// users/lists/push
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory73>['exec']>>, InferContractRouterOutputs<{ route: typeof listContract['users/lists/push'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory73>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory73>['exec']>>, Endpoints['users/lists/push']['res']>>,
	// users/lists/unfavorite
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory74>['exec']>>, InferContractRouterOutputs<{ route: typeof listContract['users/lists/unfavorite'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory74>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory74>['exec']>>, Endpoints['users/lists/unfavorite']['res']>>,
	// users/lists/update-membership
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory75>['exec']>>, InferContractRouterOutputs<{ route: typeof listContract['users/lists/update-membership'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory75>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory75>['exec']>>, Endpoints['users/lists/update-membership']['res']>>,
	// notes/delete
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory76>['exec']>>, InferContractRouterOutputs<{ route: typeof notesCommandsContract['notes/delete'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory76>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory76>['exec']>>, Endpoints['notes/delete']['res']>>,
	// notes/drafts/delete
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory77>['exec']>>, InferContractRouterOutputs<{ route: typeof notesCommandsContract['notes/drafts/delete'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory77>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory77>['exec']>>, Endpoints['notes/drafts/delete']['res']>>,
	// notes/reactions/create
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory78>['exec']>>, InferContractRouterOutputs<{ route: typeof notesCommandsContract['notes/reactions/create'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory78>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory78>['exec']>>, Endpoints['notes/reactions/create']['res']>>,
	// notes/reactions/delete
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory79>['exec']>>, InferContractRouterOutputs<{ route: typeof notesCommandsContract['notes/reactions/delete'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory79>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory79>['exec']>>, Endpoints['notes/reactions/delete']['res']>>,
	// notes/thread-muting/create
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory80>['exec']>>, InferContractRouterOutputs<{ route: typeof notesCommandsContract['notes/thread-muting/create'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory80>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory80>['exec']>>, Endpoints['notes/thread-muting/create']['res']>>,
	// notes/thread-muting/delete
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory81>['exec']>>, InferContractRouterOutputs<{ route: typeof notesCommandsContract['notes/thread-muting/delete'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory81>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory81>['exec']>>, Endpoints['notes/thread-muting/delete']['res']>>,
	// notes/unrenote
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory82>['exec']>>, InferContractRouterOutputs<{ route: typeof notesCommandsContract['notes/unrenote'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory82>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory82>['exec']>>, Endpoints['notes/unrenote']['res']>>,
	// promo/read
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory83>['exec']>>, InferContractRouterOutputs<{ route: typeof notesCommandsContract['promo/read'] }>['route']>>,
	Assert<Equal<IsAny<Awaited<ReturnType<ReturnType<typeof factory83>['exec']>>>, false>>,
	Assert<Equal<Awaited<ReturnType<ReturnType<typeof factory83>['exec']>>, Endpoints['promo/read']['res']>>,
];

const anonymousMeta = { requireCredential: false } as const;
const authenticatedMeta = { requireCredential: true, kind: 'write:notifications' } as const;
const exportMeta = { secure: true, requireCredential: true } as const;

if (false) {
	createContractTransportEndpoint(exportMeta, {}, portabilityContract['i/export-following'], async (params, user) => {
		const muting: boolean = params.excludeMuting;
		const inactive: boolean = params.excludeInactive;
		const actor: MiLocalUser = user;
		const opaque: unknown = params.untrusted;
		void [muting, inactive, actor, opaque];
		// @ts-expect-error AJV/defaulted native output consumes required booleans.
		const absentDefault: undefined = params.excludeMuting; void absentDefault;
		// @ts-expect-error Optional-root native input becomes an object after defaults.
		const absentRoot: undefined = params; void absentRoot;
	});
	createContractTransportEndpoint(authenticatedMeta, {}, notificationsContract['notifications/create'], async (params, user, token) => {
		const text: string = params.body;
		const header: string | null | undefined = params.header;
		const actor: MiLocalUser = user;
		const credential: MiAccessToken | null = token;
		void [text, header, actor, credential];
		// @ts-expect-error Required body stays string and cannot widen to number.
		const wrongBody: number = params.body; void wrongBody;
		// @ts-expect-error Nullable token cannot be silently treated as required.
		const requiredToken: MiAccessToken = token; void requiredToken;
	});
	const requiredEndpoint = createContractTransportEndpoint(authenticatedMeta, {}, notesCommandsContract['notes/delete'], async params => {
		const noteId: string = params.noteId; void noteId;
	});
	// @ts-expect-error Authenticated exec requires the trusted user.
	requiredEndpoint.exec({}, null, null);
	createContractTransportEndpoint(anonymousMeta, {}, instanceContract['ping'], async (_params, user) => {
		const actor: MiLocalUser | null = user; void actor;
		// @ts-expect-error Public transport context retains nullable user.
		const requiredActor: MiLocalUser = user; void requiredActor;
		return { pong: 1 };
	});
	const pingEndpoint = createContractTransportEndpoint(anonymousMeta, {}, instanceContract['ping'], async () => ({ pong: 1 }));
	const pong: Promise<{ pong: number }> = pingEndpoint.exec({}, null, null); void pong;
	// @ts-expect-error Non-void outputs cannot silently become void.
	const voidPong: Promise<void> = pingEndpoint.exec({}, null, null); void voidPong;
	// @ts-expect-error NoInfer prevents a callback from broadening a native response.
	createContractTransportEndpoint(anonymousMeta, {}, instanceContract['ping'], async () => ({ pong: 'invalid' }));
	// @ts-expect-error NoInfer prevents a callback from broadening a native input.
	createContractTransportEndpoint(authenticatedMeta, {}, notesCommandsContract['notes/delete'], async (_params: { noteId: number }) => {});
	// @ts-expect-error A void native command cannot acquire a result from its closure.
	createContractTransportEndpoint(authenticatedMeta, {}, notesCommandsContract['notes/delete'], async () => 1);
	const descriptor = createContractTransportEndpoint(anonymousMeta, {}, instanceContract['endpoint'], async params => {
		const name: string = params.endpoint; void name;
		return null;
	});
	const nullableDescriptor: Promise<{ params: { name: string; type: string }[] } | null> = descriptor.exec({}, null, null); void nullableDescriptor;
	// @ts-expect-error Nullable introspection output retains its null branch.
	const requiredDescriptor: Promise<{ params: { name: string; type: string }[] }> = descriptor.exec({}, null, null); void requiredDescriptor;
}
