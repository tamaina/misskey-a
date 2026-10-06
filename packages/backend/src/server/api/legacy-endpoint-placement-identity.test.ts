/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as legacy0 from './endpoints/admin/abuse-report/notification-recipient/create.js';
import * as canonical0 from '../../../../features/moderation/backend/endpoints/admin/abuse-report/notification-recipient/create.js';
import * as legacy1 from './endpoints/admin/abuse-report/notification-recipient/delete.js';
import * as canonical1 from '../../../../features/moderation/backend/endpoints/admin/abuse-report/notification-recipient/delete.js';
import * as legacy2 from './endpoints/admin/abuse-report/notification-recipient/list.js';
import * as canonical2 from '../../../../features/moderation/backend/endpoints/admin/abuse-report/notification-recipient/list.js';
import * as legacy3 from './endpoints/admin/abuse-report/notification-recipient/show.js';
import * as canonical3 from '../../../../features/moderation/backend/endpoints/admin/abuse-report/notification-recipient/show.js';
import * as legacy4 from './endpoints/admin/abuse-report/notification-recipient/update.js';
import * as canonical4 from '../../../../features/moderation/backend/endpoints/admin/abuse-report/notification-recipient/update.js';
import * as legacy5 from './endpoints/admin/abuse-user-reports.js';
import * as canonical5 from '../../../../features/moderation/backend/endpoints/admin/abuse-user-reports.js';
import * as legacy6 from './endpoints/admin/accounts/create.js';
import * as canonical6 from '../../../../features/auth/backend/endpoints/admin/accounts/create.js';
import * as legacy7 from './endpoints/admin/accounts/delete.js';
import * as canonical7 from '../../../../features/users/backend/endpoints/admin/accounts/delete.js';
import * as legacy8 from './endpoints/admin/accounts/find-by-email.js';
import * as canonical8 from '../../../../features/users/backend/endpoints/admin/accounts/find-by-email.js';
import * as legacy9 from './endpoints/admin/ad/create.js';
import * as canonical9 from '../../../../features/instance/backend/endpoints/admin/ad/create.js';
import * as legacy10 from './endpoints/admin/ad/delete.js';
import * as canonical10 from '../../../../features/instance/backend/endpoints/admin/ad/delete.js';
import * as legacy11 from './endpoints/admin/ad/list.js';
import * as canonical11 from '../../../../features/instance/backend/endpoints/admin/ad/list.js';
import * as legacy12 from './endpoints/admin/ad/update.js';
import * as canonical12 from '../../../../features/instance/backend/endpoints/admin/ad/update.js';
import * as legacy13 from './endpoints/admin/announcements/create.js';
import * as canonical13 from '../../../../features/announcements/backend/endpoints/admin/announcements/create.js';
import * as legacy14 from './endpoints/admin/announcements/list.js';
import * as canonical14 from '../../../../features/announcements/backend/endpoints/admin/announcements/list.js';
import * as legacy15 from './endpoints/admin/avatar-decorations/create.js';
import * as canonical15 from '../../../../features/avatar-decorations/backend/endpoints/admin/avatar-decorations/create.js';
import * as legacy16 from './endpoints/admin/avatar-decorations/list.js';
import * as canonical16 from '../../../../features/avatar-decorations/backend/endpoints/admin/avatar-decorations/list.js';
import * as legacy17 from './endpoints/admin/captcha/current.js';
import * as canonical17 from '../../../../features/auth/backend/endpoints/admin/captcha/current.js';
import * as legacy18 from './endpoints/admin/captcha/save.js';
import * as canonical18 from '../../../../features/auth/backend/endpoints/admin/captcha/save.js';
import * as legacy19 from './endpoints/admin/delete-account.js';
import * as canonical19 from '../../../../features/users/backend/endpoints/admin/delete-account.js';
import * as legacy20 from './endpoints/admin/delete-all-files-of-a-user.js';
import * as canonical20 from '../../../../features/drive/backend/endpoints/admin/delete-all-files-of-a-user.js';
import * as legacy21 from './endpoints/admin/drive/clean-remote-files.js';
import * as canonical21 from '../../../../features/drive/backend/endpoints/admin/drive/clean-remote-files.js';
import * as legacy22 from './endpoints/admin/drive/cleanup.js';
import * as canonical22 from '../../../../features/drive/backend/endpoints/admin/drive/cleanup.js';
import * as legacy23 from './endpoints/admin/drive/files.js';
import * as canonical23 from '../../../../features/drive/backend/endpoints/admin/drive/files.js';
import * as legacy24 from './endpoints/admin/drive/show-file.js';
import * as canonical24 from '../../../../features/drive/backend/endpoints/admin/drive/show-file.js';
import * as legacy25 from './endpoints/admin/emoji/add.js';
import * as canonical25 from '../../../../features/emojis/backend/endpoints/admin/emoji/add.js';
import * as legacy26 from './endpoints/admin/emoji/copy.js';
import * as canonical26 from '../../../../features/emojis/backend/endpoints/admin/emoji/copy.js';
import * as legacy27 from './endpoints/admin/emoji/delete-bulk.js';
import * as canonical27 from '../../../../features/emojis/backend/endpoints/admin/emoji/delete-bulk.js';
import * as legacy28 from './endpoints/admin/emoji/delete.js';
import * as canonical28 from '../../../../features/emojis/backend/endpoints/admin/emoji/delete.js';
import * as legacy29 from './endpoints/admin/emoji/import-zip.js';
import * as canonical29 from '../../../../features/emojis/backend/endpoints/admin/emoji/import-zip.js';
import * as legacy30 from './endpoints/admin/emoji/list-remote.js';
import * as canonical30 from '../../../../features/emojis/backend/endpoints/admin/emoji/list-remote.js';
import * as legacy31 from './endpoints/admin/emoji/list.js';
import * as canonical31 from '../../../../features/emojis/backend/endpoints/admin/emoji/list.js';
import * as legacy32 from './endpoints/admin/emoji/update.js';
import * as canonical32 from '../../../../features/emojis/backend/endpoints/admin/emoji/update.js';
import * as legacy33 from './endpoints/admin/federation/refresh-remote-instance-metadata.js';
import * as canonical33 from '../../../../features/federation/backend/endpoints/admin/federation/refresh-remote-instance-metadata.js';
import * as legacy34 from './endpoints/admin/federation/update-instance.js';
import * as canonical34 from '../../../../features/federation/backend/endpoints/admin/federation/update-instance.js';
import * as legacy35 from './endpoints/admin/forward-abuse-user-report.js';
import * as canonical35 from '../../../../features/moderation/backend/endpoints/admin/forward-abuse-user-report.js';
import * as legacy36 from './endpoints/admin/get-index-stats.js';
import * as canonical36 from '../../../../features/operations/backend/endpoints/admin/get-index-stats.js';
import * as legacy37 from './endpoints/admin/get-table-stats.js';
import * as canonical37 from '../../../../features/operations/backend/endpoints/admin/get-table-stats.js';
import * as legacy38 from './endpoints/admin/get-user-ips.js';
import * as canonical38 from '../../../../features/moderation/backend/endpoints/admin/get-user-ips.js';
import * as legacy39 from './endpoints/admin/invite/create.js';
import * as canonical39 from '../../../../features/auth/backend/endpoints/admin/invite/create.js';
import * as legacy40 from './endpoints/admin/invite/list.js';
import * as canonical40 from '../../../../features/auth/backend/endpoints/admin/invite/list.js';
import * as legacy41 from './endpoints/admin/meta.js';
import * as canonical41 from '../../../../features/instance/backend/endpoints/admin/meta.js';
import * as legacy42 from './endpoints/admin/promo/create.js';
import * as canonical42 from '../../../../features/notes/backend/endpoints/admin/promo/create.js';
import * as legacy43 from './endpoints/admin/queue/deliver-delayed.js';
import * as canonical43 from '../../../../features/operations/backend/endpoints/admin/queue/deliver-delayed.js';
import * as legacy44 from './endpoints/admin/queue/inbox-delayed.js';
import * as canonical44 from '../../../../features/operations/backend/endpoints/admin/queue/inbox-delayed.js';
import * as legacy45 from './endpoints/admin/queue/jobs.js';
import * as canonical45 from '../../../../features/operations/backend/endpoints/admin/queue/jobs.js';
import * as legacy46 from './endpoints/admin/queue/queue-stats.js';
import * as canonical46 from '../../../../features/operations/backend/endpoints/admin/queue/queue-stats.js';
import * as legacy47 from './endpoints/admin/queue/queues.js';
import * as canonical47 from '../../../../features/operations/backend/endpoints/admin/queue/queues.js';
import * as legacy48 from './endpoints/admin/queue/show-job-logs.js';
import * as canonical48 from '../../../../features/operations/backend/endpoints/admin/queue/show-job-logs.js';
import * as legacy49 from './endpoints/admin/queue/show-job.js';
import * as canonical49 from '../../../../features/operations/backend/endpoints/admin/queue/show-job.js';
import * as legacy50 from './endpoints/admin/queue/stats.js';
import * as canonical50 from '../../../../features/operations/backend/endpoints/admin/queue/stats.js';
import * as legacy51 from './endpoints/admin/relays/add.js';
import * as canonical51 from '../../../../features/federation/backend/endpoints/admin/relays/add.js';
import * as legacy52 from './endpoints/admin/relays/list.js';
import * as canonical52 from '../../../../features/federation/backend/endpoints/admin/relays/list.js';
import * as legacy53 from './endpoints/admin/relays/remove.js';
import * as canonical53 from '../../../../features/federation/backend/endpoints/admin/relays/remove.js';
import * as legacy54 from './endpoints/admin/reset-password.js';
import * as canonical54 from '../../../../features/auth/backend/endpoints/admin/reset-password.js';
import * as legacy55 from './endpoints/admin/resolve-abuse-user-report.js';
import * as canonical55 from '../../../../features/moderation/backend/endpoints/admin/resolve-abuse-user-report.js';
import * as legacy56 from './endpoints/admin/roles/assign.js';
import * as canonical56 from '../../../../features/roles/backend/endpoints/admin/roles/assign.js';
import * as legacy57 from './endpoints/admin/roles/create.js';
import * as canonical57 from '../../../../features/roles/backend/endpoints/admin/roles/create.js';
import * as legacy58 from './endpoints/admin/roles/delete.js';
import * as canonical58 from '../../../../features/roles/backend/endpoints/admin/roles/delete.js';
import * as legacy59 from './endpoints/admin/roles/list.js';
import * as canonical59 from '../../../../features/roles/backend/endpoints/admin/roles/list.js';
import * as legacy60 from './endpoints/admin/roles/show.js';
import * as canonical60 from '../../../../features/roles/backend/endpoints/admin/roles/show.js';
import * as legacy61 from './endpoints/admin/roles/unassign.js';
import * as canonical61 from '../../../../features/roles/backend/endpoints/admin/roles/unassign.js';
import * as legacy62 from './endpoints/admin/roles/update-default-policies.js';
import * as canonical62 from '../../../../features/roles/backend/endpoints/admin/roles/update-default-policies.js';
import * as legacy63 from './endpoints/admin/roles/update.js';
import * as canonical63 from '../../../../features/roles/backend/endpoints/admin/roles/update.js';
import * as legacy64 from './endpoints/admin/roles/users.js';
import * as canonical64 from '../../../../features/roles/backend/endpoints/admin/roles/users.js';
import * as legacy65 from './endpoints/admin/server-info.js';
import * as canonical65 from '../../../../features/instance/backend/endpoints/admin/server-info.js';
import * as legacy66 from './endpoints/admin/show-moderation-logs.js';
import * as canonical66 from '../../../../features/moderation/backend/endpoints/admin/show-moderation-logs.js';
import * as legacy67 from './endpoints/admin/show-user.js';
import * as canonical67 from '../../../../features/moderation/backend/endpoints/admin/show-user.js';
import * as legacy68 from './endpoints/admin/suspend-user.js';
import * as canonical68 from '../../../../features/moderation/backend/endpoints/admin/suspend-user.js';
import * as legacy69 from './endpoints/admin/system-webhook/create.js';
import * as canonical69 from '../../../../features/integrations/backend/endpoints/admin/system-webhook/create.js';
import * as legacy70 from './endpoints/admin/system-webhook/delete.js';
import * as canonical70 from '../../../../features/integrations/backend/endpoints/admin/system-webhook/delete.js';
import * as legacy71 from './endpoints/admin/system-webhook/list.js';
import * as canonical71 from '../../../../features/integrations/backend/endpoints/admin/system-webhook/list.js';
import * as legacy72 from './endpoints/admin/system-webhook/show.js';
import * as canonical72 from '../../../../features/integrations/backend/endpoints/admin/system-webhook/show.js';
import * as legacy73 from './endpoints/admin/system-webhook/test.js';
import * as canonical73 from '../../../../features/integrations/backend/endpoints/admin/system-webhook/test.js';
import * as legacy74 from './endpoints/admin/system-webhook/update.js';
import * as canonical74 from '../../../../features/integrations/backend/endpoints/admin/system-webhook/update.js';
import * as legacy75 from './endpoints/admin/unset-mfa.js';
import * as canonical75 from '../../../../features/auth/backend/endpoints/admin/unset-mfa.js';
import * as legacy76 from './endpoints/admin/unset-user-avatar.js';
import * as canonical76 from '../../../../features/moderation/backend/endpoints/admin/unset-user-avatar.js';
import * as legacy77 from './endpoints/admin/unset-user-banner.js';
import * as canonical77 from '../../../../features/moderation/backend/endpoints/admin/unset-user-banner.js';
import * as legacy78 from './endpoints/admin/unsuspend-user.js';
import * as canonical78 from '../../../../features/moderation/backend/endpoints/admin/unsuspend-user.js';
import * as legacy79 from './endpoints/admin/update-abuse-user-report.js';
import * as canonical79 from '../../../../features/moderation/backend/endpoints/admin/update-abuse-user-report.js';
import * as legacy80 from './endpoints/admin/update-meta.js';
import * as canonical80 from '../../../../features/instance/backend/endpoints/admin/update-meta.js';
import * as legacy81 from './endpoints/admin/update-user-note.js';
import * as canonical81 from '../../../../features/moderation/backend/endpoints/admin/update-user-note.js';
import * as legacy82 from './endpoints/announcements.js';
import * as canonical82 from '../../../../features/announcements/backend/endpoints/announcements.js';
import * as legacy83 from './endpoints/announcements/show.js';
import * as canonical83 from '../../../../features/announcements/backend/endpoints/announcements/show.js';
import * as legacy84 from './endpoints/antennas/create.js';
import * as canonical84 from '../../../../features/timelines/backend/endpoints/antennas/create.js';
import * as legacy85 from './endpoints/antennas/delete.js';
import * as canonical85 from '../../../../features/timelines/backend/endpoints/antennas/delete.js';
import * as legacy86 from './endpoints/antennas/list.js';
import * as canonical86 from '../../../../features/timelines/backend/endpoints/antennas/list.js';
import * as legacy87 from './endpoints/antennas/notes.js';
import * as canonical87 from '../../../../features/timelines/backend/endpoints/antennas/notes.js';
import * as legacy88 from './endpoints/antennas/remove-note.js';
import * as canonical88 from '../../../../features/timelines/backend/endpoints/antennas/remove-note.js';
import * as legacy89 from './endpoints/antennas/show.js';
import * as canonical89 from '../../../../features/timelines/backend/endpoints/antennas/show.js';
import * as legacy90 from './endpoints/antennas/update.js';
import * as canonical90 from '../../../../features/timelines/backend/endpoints/antennas/update.js';
import * as legacy91 from './endpoints/ap/get.js';
import * as canonical91 from '../../../../features/federation/backend/endpoints/ap/get.js';
import * as legacy92 from './endpoints/ap/show.js';
import * as canonical92 from '../../../../features/federation/backend/endpoints/ap/show.js';
import * as legacy93 from './endpoints/app/create.js';
import * as canonical93 from '../../../../features/auth/backend/endpoints/app/create.js';
import * as legacy94 from './endpoints/app/show.js';
import * as canonical94 from '../../../../features/auth/backend/endpoints/app/show.js';
import * as legacy95 from './endpoints/auth/accept.js';
import * as canonical95 from '../../../../features/auth/backend/endpoints/auth/accept.js';
import * as legacy96 from './endpoints/auth/session/generate.js';
import * as canonical96 from '../../../../features/auth/backend/endpoints/auth/session/generate.js';
import * as legacy97 from './endpoints/auth/session/show.js';
import * as canonical97 from '../../../../features/auth/backend/endpoints/auth/session/show.js';
import * as legacy98 from './endpoints/auth/session/userkey.js';
import * as canonical98 from '../../../../features/auth/backend/endpoints/auth/session/userkey.js';
import * as legacy99 from './endpoints/blocking/create.js';
import * as canonical99 from '../../../../features/relationships/backend/endpoints/blocking/create.js';
import * as legacy100 from './endpoints/blocking/delete.js';
import * as canonical100 from '../../../../features/relationships/backend/endpoints/blocking/delete.js';
import * as legacy101 from './endpoints/blocking/list.js';
import * as canonical101 from '../../../../features/relationships/backend/endpoints/blocking/list.js';
import * as legacy102 from './endpoints/bubble-game/ranking.js';
import * as canonical102 from '../../../../features/games/backend/endpoints/bubble-game/ranking.js';
import * as legacy103 from './endpoints/bubble-game/register.js';
import * as canonical103 from '../../../../features/games/backend/endpoints/bubble-game/register.js';
import * as legacy104 from './endpoints/channels/create.js';
import * as canonical104 from '../../../../features/channels/backend/endpoints/channels/create.js';
import * as legacy105 from './endpoints/channels/featured.js';
import * as canonical105 from '../../../../features/channels/backend/endpoints/channels/featured.js';
import * as legacy106 from './endpoints/channels/followed.js';
import * as canonical106 from '../../../../features/channels/backend/endpoints/channels/followed.js';
import * as legacy107 from './endpoints/channels/mute/list.js';
import * as canonical107 from '../../../../features/channels/backend/endpoints/channels/mute/list.js';
import * as legacy108 from './endpoints/channels/my-favorites.js';
import * as canonical108 from '../../../../features/channels/backend/endpoints/channels/my-favorites.js';
import * as legacy109 from './endpoints/channels/owned.js';
import * as canonical109 from '../../../../features/channels/backend/endpoints/channels/owned.js';
import * as legacy110 from './endpoints/channels/search.js';
import * as canonical110 from '../../../../features/channels/backend/endpoints/channels/search.js';
import * as legacy111 from './endpoints/channels/show.js';
import * as canonical111 from '../../../../features/channels/backend/endpoints/channels/show.js';
import * as legacy112 from './endpoints/channels/timeline.js';
import * as canonical112 from '../../../../features/channels/backend/endpoints/channels/timeline.js';
import * as legacy113 from './endpoints/channels/update.js';
import * as canonical113 from '../../../../features/channels/backend/endpoints/channels/update.js';
import * as legacy114 from './endpoints/charts/active-users.js';
import * as canonical114 from '../../../../features/statistics/backend/endpoints/charts/active-users.js';
import * as legacy115 from './endpoints/charts/ap-request.js';
import * as canonical115 from '../../../../features/statistics/backend/endpoints/charts/ap-request.js';
import * as legacy116 from './endpoints/charts/drive.js';
import * as canonical116 from '../../../../features/statistics/backend/endpoints/charts/drive.js';
import * as legacy117 from './endpoints/charts/federation.js';
import * as canonical117 from '../../../../features/statistics/backend/endpoints/charts/federation.js';
import * as legacy118 from './endpoints/charts/instance.js';
import * as canonical118 from '../../../../features/statistics/backend/endpoints/charts/instance.js';
import * as legacy119 from './endpoints/charts/notes.js';
import * as canonical119 from '../../../../features/statistics/backend/endpoints/charts/notes.js';
import * as legacy120 from './endpoints/charts/user/drive.js';
import * as canonical120 from '../../../../features/statistics/backend/endpoints/charts/user/drive.js';
import * as legacy121 from './endpoints/charts/user/following.js';
import * as canonical121 from '../../../../features/statistics/backend/endpoints/charts/user/following.js';
import * as legacy122 from './endpoints/charts/user/notes.js';
import * as canonical122 from '../../../../features/statistics/backend/endpoints/charts/user/notes.js';
import * as legacy123 from './endpoints/charts/user/pv.js';
import * as canonical123 from '../../../../features/statistics/backend/endpoints/charts/user/pv.js';
import * as legacy124 from './endpoints/charts/user/reactions.js';
import * as canonical124 from '../../../../features/statistics/backend/endpoints/charts/user/reactions.js';
import * as legacy125 from './endpoints/charts/users.js';
import * as canonical125 from '../../../../features/statistics/backend/endpoints/charts/users.js';
import * as legacy126 from './endpoints/chat/history.js';
import * as canonical126 from '../../../../features/chat/backend/endpoints/chat/history.js';
import * as legacy127 from './endpoints/chat/messages/create-to-room.js';
import * as canonical127 from '../../../../features/chat/backend/endpoints/chat/messages/create-to-room.js';
import * as legacy128 from './endpoints/chat/messages/create-to-user.js';
import * as canonical128 from '../../../../features/chat/backend/endpoints/chat/messages/create-to-user.js';
import * as legacy129 from './endpoints/chat/messages/room-timeline.js';
import * as canonical129 from '../../../../features/chat/backend/endpoints/chat/messages/room-timeline.js';
import * as legacy130 from './endpoints/chat/messages/search.js';
import * as canonical130 from '../../../../features/chat/backend/endpoints/chat/messages/search.js';
import * as legacy131 from './endpoints/chat/messages/show.js';
import * as canonical131 from '../../../../features/chat/backend/endpoints/chat/messages/show.js';
import * as legacy132 from './endpoints/chat/messages/user-timeline.js';
import * as canonical132 from '../../../../features/chat/backend/endpoints/chat/messages/user-timeline.js';
import * as legacy133 from './endpoints/chat/rooms/create.js';
import * as canonical133 from '../../../../features/chat/backend/endpoints/chat/rooms/create.js';
import * as legacy134 from './endpoints/chat/rooms/invitations/create.js';
import * as canonical134 from '../../../../features/chat/backend/endpoints/chat/rooms/invitations/create.js';
import * as legacy135 from './endpoints/chat/rooms/invitations/inbox.js';
import * as canonical135 from '../../../../features/chat/backend/endpoints/chat/rooms/invitations/inbox.js';
import * as legacy136 from './endpoints/chat/rooms/invitations/outbox.js';
import * as canonical136 from '../../../../features/chat/backend/endpoints/chat/rooms/invitations/outbox.js';
import * as legacy137 from './endpoints/chat/rooms/joining.js';
import * as canonical137 from '../../../../features/chat/backend/endpoints/chat/rooms/joining.js';
import * as legacy138 from './endpoints/chat/rooms/members.js';
import * as canonical138 from '../../../../features/chat/backend/endpoints/chat/rooms/members.js';
import * as legacy139 from './endpoints/chat/rooms/owned.js';
import * as canonical139 from '../../../../features/chat/backend/endpoints/chat/rooms/owned.js';
import * as legacy140 from './endpoints/chat/rooms/show.js';
import * as canonical140 from '../../../../features/chat/backend/endpoints/chat/rooms/show.js';
import * as legacy141 from './endpoints/chat/rooms/update.js';
import * as canonical141 from '../../../../features/chat/backend/endpoints/chat/rooms/update.js';
import * as legacy142 from './endpoints/clips/create.js';
import * as canonical142 from '../../../../features/collections/backend/endpoints/clips/create.js';
import * as legacy143 from './endpoints/clips/list.js';
import * as canonical143 from '../../../../features/collections/backend/endpoints/clips/list.js';
import * as legacy144 from './endpoints/clips/my-favorites.js';
import * as canonical144 from '../../../../features/collections/backend/endpoints/clips/my-favorites.js';
import * as legacy145 from './endpoints/clips/notes.js';
import * as canonical145 from '../../../../features/collections/backend/endpoints/clips/notes.js';
import * as legacy146 from './endpoints/clips/show.js';
import * as canonical146 from '../../../../features/collections/backend/endpoints/clips/show.js';
import * as legacy147 from './endpoints/clips/update.js';
import * as canonical147 from '../../../../features/collections/backend/endpoints/clips/update.js';
import * as legacy148 from './endpoints/drive.js';
import * as canonical148 from '../../../../features/drive/backend/endpoints/drive.js';
import * as legacy149 from './endpoints/drive/files.js';
import * as canonical149 from '../../../../features/drive/backend/endpoints/drive/files.js';
import * as legacy150 from './endpoints/drive/files/attached-chat-messages.js';
import * as canonical150 from '../../../../features/drive/backend/endpoints/drive/files/attached-chat-messages.js';
import * as legacy151 from './endpoints/drive/files/attached-notes.js';
import * as canonical151 from '../../../../features/drive/backend/endpoints/drive/files/attached-notes.js';
import * as legacy152 from './endpoints/drive/files/check-existence.js';
import * as canonical152 from '../../../../features/drive/backend/endpoints/drive/files/check-existence.js';
import * as legacy153 from './endpoints/drive/files/create.js';
import * as canonical153 from '../../../../features/drive/backend/endpoints/drive/files/create.js';
import * as legacy154 from './endpoints/drive/files/delete.js';
import * as canonical154 from '../../../../features/drive/backend/endpoints/drive/files/delete.js';
import * as legacy155 from './endpoints/drive/files/find-by-hash.js';
import * as canonical155 from '../../../../features/drive/backend/endpoints/drive/files/find-by-hash.js';
import * as legacy156 from './endpoints/drive/files/find.js';
import * as canonical156 from '../../../../features/drive/backend/endpoints/drive/files/find.js';
import * as legacy157 from './endpoints/drive/files/move-bulk.js';
import * as canonical157 from '../../../../features/drive/backend/endpoints/drive/files/move-bulk.js';
import * as legacy158 from './endpoints/drive/files/show.js';
import * as canonical158 from '../../../../features/drive/backend/endpoints/drive/files/show.js';
import * as legacy159 from './endpoints/drive/files/update.js';
import * as canonical159 from '../../../../features/drive/backend/endpoints/drive/files/update.js';
import * as legacy160 from './endpoints/drive/files/upload-from-url.js';
import * as canonical160 from '../../../../features/drive/backend/endpoints/drive/files/upload-from-url.js';
import * as legacy161 from './endpoints/drive/folders.js';
import * as canonical161 from '../../../../features/drive/backend/endpoints/drive/folders.js';
import * as legacy162 from './endpoints/drive/folders/create.js';
import * as canonical162 from '../../../../features/drive/backend/endpoints/drive/folders/create.js';
import * as legacy163 from './endpoints/drive/folders/delete.js';
import * as canonical163 from '../../../../features/drive/backend/endpoints/drive/folders/delete.js';
import * as legacy164 from './endpoints/drive/folders/find.js';
import * as canonical164 from '../../../../features/drive/backend/endpoints/drive/folders/find.js';
import * as legacy165 from './endpoints/drive/folders/show.js';
import * as canonical165 from '../../../../features/drive/backend/endpoints/drive/folders/show.js';
import * as legacy166 from './endpoints/drive/folders/update.js';
import * as canonical166 from '../../../../features/drive/backend/endpoints/drive/folders/update.js';
import * as legacy167 from './endpoints/drive/stream.js';
import * as canonical167 from '../../../../features/drive/backend/endpoints/drive/stream.js';
import * as legacy168 from './endpoints/email-address/available.js';
import * as canonical168 from '../../../../features/auth/backend/endpoints/email-address/available.js';
import * as legacy169 from './endpoints/export-custom-emojis.js';
import * as canonical169 from '../../../../features/emojis/backend/endpoints/export-custom-emojis.js';
import * as legacy170 from './endpoints/federation/followers.js';
import * as canonical170 from '../../../../features/federation/backend/endpoints/federation/followers.js';
import * as legacy171 from './endpoints/federation/following.js';
import * as canonical171 from '../../../../features/federation/backend/endpoints/federation/following.js';
import * as legacy172 from './endpoints/federation/instances.js';
import * as canonical172 from '../../../../features/federation/backend/endpoints/federation/instances.js';
import * as legacy173 from './endpoints/federation/show-instance.js';
import * as canonical173 from '../../../../features/federation/backend/endpoints/federation/show-instance.js';
import * as legacy174 from './endpoints/federation/stats.js';
import * as canonical174 from '../../../../features/federation/backend/endpoints/federation/stats.js';
import * as legacy175 from './endpoints/federation/update-remote-user.js';
import * as canonical175 from '../../../../features/federation/backend/endpoints/federation/update-remote-user.js';
import * as legacy176 from './endpoints/federation/users.js';
import * as canonical176 from '../../../../features/federation/backend/endpoints/federation/users.js';
import * as legacy177 from './endpoints/fetch-external-resources.js';
import * as canonical177 from '../../../../features/integrations/backend/endpoints/fetch-external-resources.js';
import * as legacy178 from './endpoints/flash/create.js';
import * as canonical178 from '../../../../features/play/backend/endpoints/flash/create.js';
import * as legacy179 from './endpoints/flash/delete.js';
import * as canonical179 from '../../../../features/play/backend/endpoints/flash/delete.js';
import * as legacy180 from './endpoints/flash/featured.js';
import * as canonical180 from '../../../../features/play/backend/endpoints/flash/featured.js';
import * as legacy181 from './endpoints/flash/like.js';
import * as canonical181 from '../../../../features/play/backend/endpoints/flash/like.js';
import * as legacy182 from './endpoints/flash/my-likes.js';
import * as canonical182 from '../../../../features/play/backend/endpoints/flash/my-likes.js';
import * as legacy183 from './endpoints/flash/my.js';
import * as canonical183 from '../../../../features/play/backend/endpoints/flash/my.js';
import * as legacy184 from './endpoints/flash/search.js';
import * as canonical184 from '../../../../features/play/backend/endpoints/flash/search.js';
import * as legacy185 from './endpoints/flash/show.js';
import * as canonical185 from '../../../../features/play/backend/endpoints/flash/show.js';
import * as legacy186 from './endpoints/flash/unlike.js';
import * as canonical186 from '../../../../features/play/backend/endpoints/flash/unlike.js';
import * as legacy187 from './endpoints/flash/update.js';
import * as canonical187 from '../../../../features/play/backend/endpoints/flash/update.js';
import * as legacy188 from './endpoints/following/create.js';
import * as canonical188 from '../../../../features/relationships/backend/endpoints/following/create.js';
import * as legacy189 from './endpoints/following/delete.js';
import * as canonical189 from '../../../../features/relationships/backend/endpoints/following/delete.js';
import * as legacy190 from './endpoints/following/invalidate.js';
import * as canonical190 from '../../../../features/relationships/backend/endpoints/following/invalidate.js';
import * as legacy191 from './endpoints/following/list.js';
import * as canonical191 from '../../../../features/relationships/backend/endpoints/following/list.js';
import * as legacy192 from './endpoints/following/requests/accept.js';
import * as canonical192 from '../../../../features/relationships/backend/endpoints/following/requests/accept.js';
import * as legacy193 from './endpoints/following/requests/cancel.js';
import * as canonical193 from '../../../../features/relationships/backend/endpoints/following/requests/cancel.js';
import * as legacy194 from './endpoints/following/requests/list.js';
import * as canonical194 from '../../../../features/relationships/backend/endpoints/following/requests/list.js';
import * as legacy195 from './endpoints/following/requests/reject.js';
import * as canonical195 from '../../../../features/relationships/backend/endpoints/following/requests/reject.js';
import * as legacy196 from './endpoints/following/requests/sent.js';
import * as canonical196 from '../../../../features/relationships/backend/endpoints/following/requests/sent.js';
import * as legacy197 from './endpoints/following/update-all.js';
import * as canonical197 from '../../../../features/relationships/backend/endpoints/following/update-all.js';
import * as legacy198 from './endpoints/following/update.js';
import * as canonical198 from '../../../../features/relationships/backend/endpoints/following/update.js';
import * as legacy199 from './endpoints/gallery/featured.js';
import * as canonical199 from '../../../../features/gallery/backend/endpoints/gallery/featured.js';
import * as legacy200 from './endpoints/gallery/popular.js';
import * as canonical200 from '../../../../features/gallery/backend/endpoints/gallery/popular.js';
import * as legacy201 from './endpoints/gallery/posts.js';
import * as canonical201 from '../../../../features/gallery/backend/endpoints/gallery/posts.js';
import * as legacy202 from './endpoints/gallery/posts/create.js';
import * as canonical202 from '../../../../features/gallery/backend/endpoints/gallery/posts/create.js';
import * as legacy203 from './endpoints/gallery/posts/delete.js';
import * as canonical203 from '../../../../features/gallery/backend/endpoints/gallery/posts/delete.js';
import * as legacy204 from './endpoints/gallery/posts/like.js';
import * as canonical204 from '../../../../features/gallery/backend/endpoints/gallery/posts/like.js';
import * as legacy205 from './endpoints/gallery/posts/show.js';
import * as canonical205 from '../../../../features/gallery/backend/endpoints/gallery/posts/show.js';
import * as legacy206 from './endpoints/gallery/posts/unlike.js';
import * as canonical206 from '../../../../features/gallery/backend/endpoints/gallery/posts/unlike.js';
import * as legacy207 from './endpoints/gallery/posts/update.js';
import * as canonical207 from '../../../../features/gallery/backend/endpoints/gallery/posts/update.js';
import * as legacy208 from './endpoints/hashtags/list.js';
import * as canonical208 from '../../../../features/discovery/backend/endpoints/hashtags/list.js';
import * as legacy209 from './endpoints/hashtags/search.js';
import * as canonical209 from '../../../../features/discovery/backend/endpoints/hashtags/search.js';
import * as legacy210 from './endpoints/hashtags/show.js';
import * as canonical210 from '../../../../features/discovery/backend/endpoints/hashtags/show.js';
import * as legacy211 from './endpoints/hashtags/trend.js';
import * as canonical211 from '../../../../features/discovery/backend/endpoints/hashtags/trend.js';
import * as legacy212 from './endpoints/hashtags/users.js';
import * as canonical212 from '../../../../features/discovery/backend/endpoints/hashtags/users.js';
import * as legacy213 from './endpoints/i.js';
import * as canonical213 from '../../../../features/users/backend/endpoints/i.js';
import * as legacy214 from './endpoints/i/2fa/done.js';
import * as canonical214 from '../../../../features/auth/backend/endpoints/i/2fa/done.js';
import * as legacy215 from './endpoints/i/2fa/key-done.js';
import * as canonical215 from '../../../../features/auth/backend/endpoints/i/2fa/key-done.js';
import * as legacy216 from './endpoints/i/2fa/password-less.js';
import * as canonical216 from '../../../../features/auth/backend/endpoints/i/2fa/password-less.js';
import * as legacy217 from './endpoints/i/2fa/register-key.js';
import * as canonical217 from '../../../../features/auth/backend/endpoints/i/2fa/register-key.js';
import * as legacy218 from './endpoints/i/2fa/register.js';
import * as canonical218 from '../../../../features/auth/backend/endpoints/i/2fa/register.js';
import * as legacy219 from './endpoints/i/2fa/remove-key.js';
import * as canonical219 from '../../../../features/auth/backend/endpoints/i/2fa/remove-key.js';
import * as legacy220 from './endpoints/i/2fa/unregister.js';
import * as canonical220 from '../../../../features/auth/backend/endpoints/i/2fa/unregister.js';
import * as legacy221 from './endpoints/i/2fa/update-key.js';
import * as canonical221 from '../../../../features/auth/backend/endpoints/i/2fa/update-key.js';
import * as legacy222 from './endpoints/i/apps.js';
import * as canonical222 from '../../../../features/auth/backend/endpoints/i/apps.js';
import * as legacy223 from './endpoints/i/authorized-apps.js';
import * as canonical223 from '../../../../features/auth/backend/endpoints/i/authorized-apps.js';
import * as legacy224 from './endpoints/i/change-password.js';
import * as canonical224 from '../../../../features/auth/backend/endpoints/i/change-password.js';
import * as legacy225 from './endpoints/i/claim-achievement.js';
import * as canonical225 from '../../../../features/users/backend/endpoints/i/claim-achievement.js';
import * as legacy226 from './endpoints/i/delete-account.js';
import * as canonical226 from '../../../../features/users/backend/endpoints/i/delete-account.js';
import * as legacy227 from './endpoints/i/favorites.js';
import * as canonical227 from '../../../../features/collections/backend/endpoints/i/favorites.js';
import * as legacy228 from './endpoints/i/gallery/likes.js';
import * as canonical228 from '../../../../features/gallery/backend/endpoints/i/gallery/likes.js';
import * as legacy229 from './endpoints/i/gallery/posts.js';
import * as canonical229 from '../../../../features/gallery/backend/endpoints/i/gallery/posts.js';
import * as legacy230 from './endpoints/i/import-antennas.js';
import * as canonical230 from '../../../../features/portability/backend/endpoints/i/import-antennas.js';
import * as legacy231 from './endpoints/i/import-blocking.js';
import * as canonical231 from '../../../../features/portability/backend/endpoints/i/import-blocking.js';
import * as legacy232 from './endpoints/i/import-following.js';
import * as canonical232 from '../../../../features/portability/backend/endpoints/i/import-following.js';
import * as legacy233 from './endpoints/i/import-muting.js';
import * as canonical233 from '../../../../features/portability/backend/endpoints/i/import-muting.js';
import * as legacy234 from './endpoints/i/import-user-lists.js';
import * as canonical234 from '../../../../features/portability/backend/endpoints/i/import-user-lists.js';
import * as legacy235 from './endpoints/i/move.js';
import * as canonical235 from '../../../../features/users/backend/endpoints/i/move.js';
import * as legacy236 from './endpoints/i/notifications-grouped.js';
import * as canonical236 from '../../../../features/notifications/backend/endpoints/i/notifications-grouped.js';
import * as legacy237 from './endpoints/i/notifications.js';
import * as canonical237 from '../../../../features/notifications/backend/endpoints/i/notifications.js';
import * as legacy238 from './endpoints/i/page-likes.js';
import * as canonical238 from '../../../../features/pages/backend/endpoints/i/page-likes.js';
import * as legacy239 from './endpoints/i/pages.js';
import * as canonical239 from '../../../../features/pages/backend/endpoints/i/pages.js';
import * as legacy240 from './endpoints/i/pin.js';
import * as canonical240 from '../../../../features/notes/backend/endpoints/i/pin.js';
import * as legacy241 from './endpoints/i/regenerate-token.js';
import * as canonical241 from '../../../../features/auth/backend/endpoints/i/regenerate-token.js';
import * as legacy242 from './endpoints/i/registry/get-all.js';
import * as canonical242 from '../../../../features/preferences/backend/endpoints/i/registry/get-all.js';
import * as legacy243 from './endpoints/i/registry/get-detail.js';
import * as canonical243 from '../../../../features/preferences/backend/endpoints/i/registry/get-detail.js';
import * as legacy244 from './endpoints/i/registry/get.js';
import * as canonical244 from '../../../../features/preferences/backend/endpoints/i/registry/get.js';
import * as legacy245 from './endpoints/i/registry/keys-with-type.js';
import * as canonical245 from '../../../../features/preferences/backend/endpoints/i/registry/keys-with-type.js';
import * as legacy246 from './endpoints/i/registry/keys.js';
import * as canonical246 from '../../../../features/preferences/backend/endpoints/i/registry/keys.js';
import * as legacy247 from './endpoints/i/registry/remove.js';
import * as canonical247 from '../../../../features/preferences/backend/endpoints/i/registry/remove.js';
import * as legacy248 from './endpoints/i/registry/scopes-with-domain.js';
import * as canonical248 from '../../../../features/preferences/backend/endpoints/i/registry/scopes-with-domain.js';
import * as legacy249 from './endpoints/i/registry/set.js';
import * as canonical249 from '../../../../features/preferences/backend/endpoints/i/registry/set.js';
import * as legacy250 from './endpoints/i/revoke-token.js';
import * as canonical250 from '../../../../features/auth/backend/endpoints/i/revoke-token.js';
import * as legacy251 from './endpoints/i/signin-history.js';
import * as canonical251 from '../../../../features/auth/backend/endpoints/i/signin-history.js';
import * as legacy252 from './endpoints/i/unpin.js';
import * as canonical252 from '../../../../features/notes/backend/endpoints/i/unpin.js';
import * as legacy253 from './endpoints/i/update-email.js';
import * as canonical253 from '../../../../features/auth/backend/endpoints/i/update-email.js';
import * as legacy254 from './endpoints/i/update.js';
import * as canonical254 from '../../../../features/users/backend/endpoints/i/update.js';
import * as legacy255 from './endpoints/i/webhooks/create.js';
import * as canonical255 from '../../../../features/integrations/backend/endpoints/i/webhooks/create.js';
import * as legacy256 from './endpoints/i/webhooks/list.js';
import * as canonical256 from '../../../../features/integrations/backend/endpoints/i/webhooks/list.js';
import * as legacy257 from './endpoints/i/webhooks/show.js';
import * as canonical257 from '../../../../features/integrations/backend/endpoints/i/webhooks/show.js';
import * as legacy258 from './endpoints/i/webhooks/test.js';
import * as canonical258 from '../../../../features/integrations/backend/endpoints/i/webhooks/test.js';
import * as legacy259 from './endpoints/invite/create.js';
import * as canonical259 from '../../../../features/auth/backend/endpoints/invite/create.js';
import * as legacy260 from './endpoints/invite/delete.js';
import * as canonical260 from '../../../../features/auth/backend/endpoints/invite/delete.js';
import * as legacy261 from './endpoints/invite/limit.js';
import * as canonical261 from '../../../../features/auth/backend/endpoints/invite/limit.js';
import * as legacy262 from './endpoints/invite/list.js';
import * as canonical262 from '../../../../features/auth/backend/endpoints/invite/list.js';
import * as legacy263 from './endpoints/meta.js';
import * as canonical263 from '../../../../features/instance/backend/endpoints/meta.js';
import * as legacy264 from './endpoints/miauth/gen-token.js';
import * as canonical264 from '../../../../features/auth/backend/endpoints/miauth/gen-token.js';
import * as legacy265 from './endpoints/mute/create.js';
import * as canonical265 from '../../../../features/relationships/backend/endpoints/mute/create.js';
import * as legacy266 from './endpoints/mute/delete.js';
import * as canonical266 from '../../../../features/relationships/backend/endpoints/mute/delete.js';
import * as legacy267 from './endpoints/mute/list.js';
import * as canonical267 from '../../../../features/relationships/backend/endpoints/mute/list.js';
import * as legacy268 from './endpoints/my/apps.js';
import * as canonical268 from '../../../../features/auth/backend/endpoints/my/apps.js';
import * as legacy269 from './endpoints/notes.js';
import * as canonical269 from '../../../../features/notes/backend/endpoints/notes.js';
import * as legacy270 from './endpoints/notes/children.js';
import * as canonical270 from '../../../../features/notes/backend/endpoints/notes/children.js';
import * as legacy271 from './endpoints/notes/clips.js';
import * as canonical271 from '../../../../features/collections/backend/endpoints/notes/clips.js';
import * as legacy272 from './endpoints/notes/conversation.js';
import * as canonical272 from '../../../../features/notes/backend/endpoints/notes/conversation.js';
import * as legacy273 from './endpoints/notes/create.js';
import * as canonical273 from '../../../../features/notes/backend/endpoints/notes/create.js';
import * as legacy274 from './endpoints/notes/delete.js';
import * as canonical274 from '../../../../features/notes/backend/endpoints/notes/delete.js';
import * as legacy275 from './endpoints/notes/drafts/count.js';
import * as canonical275 from '../../../../features/notes/backend/endpoints/notes/drafts/count.js';
import * as legacy276 from './endpoints/notes/drafts/create.js';
import * as canonical276 from '../../../../features/notes/backend/endpoints/notes/drafts/create.js';
import * as legacy277 from './endpoints/notes/drafts/delete.js';
import * as canonical277 from '../../../../features/notes/backend/endpoints/notes/drafts/delete.js';
import * as legacy278 from './endpoints/notes/drafts/list.js';
import * as canonical278 from '../../../../features/notes/backend/endpoints/notes/drafts/list.js';
import * as legacy279 from './endpoints/notes/drafts/update.js';
import * as canonical279 from '../../../../features/notes/backend/endpoints/notes/drafts/update.js';
import * as legacy280 from './endpoints/notes/favorites/create.js';
import * as canonical280 from '../../../../features/collections/backend/endpoints/notes/favorites/create.js';
import * as legacy281 from './endpoints/notes/favorites/delete.js';
import * as canonical281 from '../../../../features/collections/backend/endpoints/notes/favorites/delete.js';
import * as legacy282 from './endpoints/notes/featured.js';
import * as canonical282 from '../../../../features/discovery/backend/endpoints/notes/featured.js';
import * as legacy283 from './endpoints/notes/global-timeline.js';
import * as canonical283 from '../../../../features/timelines/backend/endpoints/notes/global-timeline.js';
import * as legacy284 from './endpoints/notes/hybrid-timeline.js';
import * as canonical284 from '../../../../features/timelines/backend/endpoints/notes/hybrid-timeline.js';
import * as legacy285 from './endpoints/notes/local-timeline.js';
import * as canonical285 from '../../../../features/timelines/backend/endpoints/notes/local-timeline.js';
import * as legacy286 from './endpoints/notes/polls/recommendation.js';
import * as canonical286 from '../../../../features/notes/backend/endpoints/notes/polls/recommendation.js';
import * as legacy287 from './endpoints/notes/polls/vote.js';
import * as canonical287 from '../../../../features/notes/backend/endpoints/notes/polls/vote.js';
import * as legacy288 from './endpoints/notes/reactions.js';
import * as canonical288 from '../../../../features/notes/backend/endpoints/notes/reactions.js';
import * as legacy289 from './endpoints/notes/reactions/create.js';
import * as canonical289 from '../../../../features/notes/backend/endpoints/notes/reactions/create.js';
import * as legacy290 from './endpoints/notes/reactions/delete.js';
import * as canonical290 from '../../../../features/notes/backend/endpoints/notes/reactions/delete.js';
import * as legacy291 from './endpoints/notes/renotes.js';
import * as canonical291 from '../../../../features/notes/backend/endpoints/notes/renotes.js';
import * as legacy292 from './endpoints/notes/replies.js';
import * as canonical292 from '../../../../features/notes/backend/endpoints/notes/replies.js';
import * as legacy293 from './endpoints/notes/search-by-tag.js';
import * as canonical293 from '../../../../features/discovery/backend/endpoints/notes/search-by-tag.js';
import * as legacy294 from './endpoints/notes/search.js';
import * as canonical294 from '../../../../features/discovery/backend/endpoints/notes/search.js';
import * as legacy295 from './endpoints/notes/show-partial-bulk.js';
import * as canonical295 from '../../../../features/notes/backend/endpoints/notes/show-partial-bulk.js';
import * as legacy296 from './endpoints/notes/show.js';
import * as canonical296 from '../../../../features/notes/backend/endpoints/notes/show.js';
import * as legacy297 from './endpoints/notes/state.js';
import * as canonical297 from '../../../../features/notes/backend/endpoints/notes/state.js';
import * as legacy298 from './endpoints/notes/thread-muting/create.js';
import * as canonical298 from '../../../../features/notes/backend/endpoints/notes/thread-muting/create.js';
import * as legacy299 from './endpoints/notes/thread-muting/delete.js';
import * as canonical299 from '../../../../features/notes/backend/endpoints/notes/thread-muting/delete.js';
import * as legacy300 from './endpoints/notes/timeline.js';
import * as canonical300 from '../../../../features/timelines/backend/endpoints/notes/timeline.js';
import * as legacy301 from './endpoints/notes/translate.js';
import * as canonical301 from '../../../../features/notes/backend/endpoints/notes/translate.js';
import * as legacy302 from './endpoints/notes/unrenote.js';
import * as canonical302 from '../../../../features/notes/backend/endpoints/notes/unrenote.js';
import * as legacy303 from './endpoints/notes/user-list-timeline.js';
import * as canonical303 from '../../../../features/timelines/backend/endpoints/notes/user-list-timeline.js';
import * as legacy304 from './endpoints/page-push.js';
import * as canonical304 from '../../../../features/pages/backend/endpoints/page-push.js';
import * as legacy305 from './endpoints/pages/create.js';
import * as canonical305 from '../../../../features/pages/backend/endpoints/pages/create.js';
import * as legacy306 from './endpoints/pages/delete.js';
import * as canonical306 from '../../../../features/pages/backend/endpoints/pages/delete.js';
import * as legacy307 from './endpoints/pages/featured.js';
import * as canonical307 from '../../../../features/pages/backend/endpoints/pages/featured.js';
import * as legacy308 from './endpoints/pages/like.js';
import * as canonical308 from '../../../../features/pages/backend/endpoints/pages/like.js';
import * as legacy309 from './endpoints/pages/show.js';
import * as canonical309 from '../../../../features/pages/backend/endpoints/pages/show.js';
import * as legacy310 from './endpoints/pages/unlike.js';
import * as canonical310 from '../../../../features/pages/backend/endpoints/pages/unlike.js';
import * as legacy311 from './endpoints/pages/update.js';
import * as canonical311 from '../../../../features/pages/backend/endpoints/pages/update.js';
import * as legacy312 from './endpoints/pinned-users.js';
import * as canonical312 from '../../../../features/instance/backend/endpoints/pinned-users.js';
import * as legacy313 from './endpoints/promo/read.js';
import * as canonical313 from '../../../../features/notes/backend/endpoints/promo/read.js';
import * as legacy314 from './endpoints/renote-mute/create.js';
import * as canonical314 from '../../../../features/relationships/backend/endpoints/renote-mute/create.js';
import * as legacy315 from './endpoints/renote-mute/delete.js';
import * as canonical315 from '../../../../features/relationships/backend/endpoints/renote-mute/delete.js';
import * as legacy316 from './endpoints/renote-mute/list.js';
import * as canonical316 from '../../../../features/relationships/backend/endpoints/renote-mute/list.js';
import * as legacy317 from './endpoints/request-reset-password.js';
import * as canonical317 from '../../../../features/auth/backend/endpoints/request-reset-password.js';
import * as legacy318 from './endpoints/reset-db.js';
import * as canonical318 from '../../../../features/operations/backend/endpoints/reset-db.js';
import * as legacy319 from './endpoints/reset-password.js';
import * as canonical319 from '../../../../features/auth/backend/endpoints/reset-password.js';
import * as legacy320 from './endpoints/retention.js';
import * as canonical320 from '../../../../features/statistics/backend/endpoints/retention.js';
import * as legacy321 from './endpoints/reversi/cancel-match.js';
import * as canonical321 from '../../../../features/games/backend/endpoints/reversi/cancel-match.js';
import * as legacy322 from './endpoints/reversi/games.js';
import * as canonical322 from '../../../../features/games/backend/endpoints/reversi/games.js';
import * as legacy323 from './endpoints/reversi/invitations.js';
import * as canonical323 from '../../../../features/games/backend/endpoints/reversi/invitations.js';
import * as legacy324 from './endpoints/reversi/match.js';
import * as canonical324 from '../../../../features/games/backend/endpoints/reversi/match.js';
import * as legacy325 from './endpoints/reversi/show-game.js';
import * as canonical325 from '../../../../features/games/backend/endpoints/reversi/show-game.js';
import * as legacy326 from './endpoints/reversi/surrender.js';
import * as canonical326 from '../../../../features/games/backend/endpoints/reversi/surrender.js';
import * as legacy327 from './endpoints/reversi/verify.js';
import * as canonical327 from '../../../../features/games/backend/endpoints/reversi/verify.js';
import * as legacy328 from './endpoints/roles/list.js';
import * as canonical328 from '../../../../features/roles/backend/endpoints/roles/list.js';
import * as legacy329 from './endpoints/roles/notes.js';
import * as canonical329 from '../../../../features/roles/backend/endpoints/roles/notes.js';
import * as legacy330 from './endpoints/roles/show.js';
import * as canonical330 from '../../../../features/roles/backend/endpoints/roles/show.js';
import * as legacy331 from './endpoints/roles/users.js';
import * as canonical331 from '../../../../features/roles/backend/endpoints/roles/users.js';
import * as legacy332 from './endpoints/sw/register.js';
import * as canonical332 from '../../../../features/notifications/backend/endpoints/sw/register.js';
import * as legacy333 from './endpoints/sw/show-registration.js';
import * as canonical333 from '../../../../features/notifications/backend/endpoints/sw/show-registration.js';
import * as legacy334 from './endpoints/sw/unregister.js';
import * as canonical334 from '../../../../features/notifications/backend/endpoints/sw/unregister.js';
import * as legacy335 from './endpoints/sw/update-registration.js';
import * as canonical335 from '../../../../features/notifications/backend/endpoints/sw/update-registration.js';
import * as legacy336 from './endpoints/test.js';
import * as canonical336 from '../../../../features/api/backend/endpoints/test.js';
import * as legacy337 from './endpoints/username/available.js';
import * as canonical337 from '../../../../features/auth/backend/endpoints/username/available.js';
import * as legacy338 from './endpoints/users.js';
import * as canonical338 from '../../../../features/users/backend/endpoints/users.js';
import * as legacy339 from './endpoints/users/achievements.js';
import * as canonical339 from '../../../../features/users/backend/endpoints/users/achievements.js';
import * as legacy340 from './endpoints/users/clips.js';
import * as canonical340 from '../../../../features/collections/backend/endpoints/users/clips.js';
import * as legacy341 from './endpoints/users/featured-notes.js';
import * as canonical341 from '../../../../features/discovery/backend/endpoints/users/featured-notes.js';
import * as legacy342 from './endpoints/users/flashs.js';
import * as canonical342 from '../../../../features/play/backend/endpoints/users/flashs.js';
import * as legacy343 from './endpoints/users/followers.js';
import * as canonical343 from '../../../../features/relationships/backend/endpoints/users/followers.js';
import * as legacy344 from './endpoints/users/following.js';
import * as canonical344 from '../../../../features/relationships/backend/endpoints/users/following.js';
import * as legacy345 from './endpoints/users/gallery/posts.js';
import * as canonical345 from '../../../../features/gallery/backend/endpoints/users/gallery/posts.js';
import * as legacy346 from './endpoints/users/get-following-users-by-birthday.js';
import * as canonical346 from '../../../../features/relationships/backend/endpoints/users/get-following-users-by-birthday.js';
import * as legacy347 from './endpoints/users/get-frequently-replied-users.js';
import * as canonical347 from '../../../../features/discovery/backend/endpoints/users/get-frequently-replied-users.js';
import * as legacy348 from './endpoints/users/lists/create-from-public.js';
import * as canonical348 from '../../../../features/relationships/backend/endpoints/users/lists/create-from-public.js';
import * as legacy349 from './endpoints/users/lists/create.js';
import * as canonical349 from '../../../../features/relationships/backend/endpoints/users/lists/create.js';
import * as legacy350 from './endpoints/users/lists/get-memberships.js';
import * as canonical350 from '../../../../features/relationships/backend/endpoints/users/lists/get-memberships.js';
import * as legacy351 from './endpoints/users/lists/list.js';
import * as canonical351 from '../../../../features/relationships/backend/endpoints/users/lists/list.js';
import * as legacy352 from './endpoints/users/lists/show.js';
import * as canonical352 from '../../../../features/relationships/backend/endpoints/users/lists/show.js';
import * as legacy353 from './endpoints/users/lists/update.js';
import * as canonical353 from '../../../../features/relationships/backend/endpoints/users/lists/update.js';
import * as legacy354 from './endpoints/users/pages.js';
import * as canonical354 from '../../../../features/pages/backend/endpoints/users/pages.js';
import * as legacy355 from './endpoints/users/reactions.js';
import * as canonical355 from '../../../../features/notes/backend/endpoints/users/reactions.js';
import * as legacy356 from './endpoints/users/recommendation.js';
import * as canonical356 from '../../../../features/discovery/backend/endpoints/users/recommendation.js';
import * as legacy357 from './endpoints/users/relation.js';
import * as canonical357 from '../../../../features/relationships/backend/endpoints/users/relation.js';
import * as legacy358 from './endpoints/users/report-abuse.js';
import * as canonical358 from '../../../../features/moderation/backend/endpoints/users/report-abuse.js';
import * as legacy359 from './endpoints/users/search-by-username-and-host.js';
import * as canonical359 from '../../../../features/discovery/backend/endpoints/users/search-by-username-and-host.js';
import * as legacy360 from './endpoints/users/search.js';
import * as canonical360 from '../../../../features/discovery/backend/endpoints/users/search.js';
import * as legacy361 from './endpoints/users/show.js';
import * as canonical361 from '../../../../features/users/backend/endpoints/users/show.js';
import * as legacy362 from './endpoints/users/update-memo.js';
import * as canonical362 from '../../../../features/users/backend/endpoints/users/update-memo.js';
import * as legacy363 from './endpoints/v2/admin/emoji/list.js';
import * as canonical363 from '../../../../features/emojis/backend/endpoints/v2/admin/emoji/list.js';
import * as legacy364 from './endpoints/verify-email.js';
import * as canonical364 from '../../../../features/auth/backend/endpoints/verify-email.js';

type LegacyEndpointExports = { default: unknown; meta: unknown; paramDef: unknown };
type CanonicalEndpointExports = { EndpointImplementation: unknown; meta: unknown; paramDef: unknown };
const identityCases: Array<{ route: string; legacy: LegacyEndpointExports; canonical: CanonicalEndpointExports }> = [
	{ route: 'admin/abuse-report/notification-recipient/create', legacy: legacy0, canonical: canonical0 },
	{ route: 'admin/abuse-report/notification-recipient/delete', legacy: legacy1, canonical: canonical1 },
	{ route: 'admin/abuse-report/notification-recipient/list', legacy: legacy2, canonical: canonical2 },
	{ route: 'admin/abuse-report/notification-recipient/show', legacy: legacy3, canonical: canonical3 },
	{ route: 'admin/abuse-report/notification-recipient/update', legacy: legacy4, canonical: canonical4 },
	{ route: 'admin/abuse-user-reports', legacy: legacy5, canonical: canonical5 },
	{ route: 'admin/accounts/create', legacy: legacy6, canonical: canonical6 },
	{ route: 'admin/accounts/delete', legacy: legacy7, canonical: canonical7 },
	{ route: 'admin/accounts/find-by-email', legacy: legacy8, canonical: canonical8 },
	{ route: 'admin/ad/create', legacy: legacy9, canonical: canonical9 },
	{ route: 'admin/ad/delete', legacy: legacy10, canonical: canonical10 },
	{ route: 'admin/ad/list', legacy: legacy11, canonical: canonical11 },
	{ route: 'admin/ad/update', legacy: legacy12, canonical: canonical12 },
	{ route: 'admin/announcements/create', legacy: legacy13, canonical: canonical13 },
	{ route: 'admin/announcements/list', legacy: legacy14, canonical: canonical14 },
	{ route: 'admin/avatar-decorations/create', legacy: legacy15, canonical: canonical15 },
	{ route: 'admin/avatar-decorations/list', legacy: legacy16, canonical: canonical16 },
	{ route: 'admin/captcha/current', legacy: legacy17, canonical: canonical17 },
	{ route: 'admin/captcha/save', legacy: legacy18, canonical: canonical18 },
	{ route: 'admin/delete-account', legacy: legacy19, canonical: canonical19 },
	{ route: 'admin/delete-all-files-of-a-user', legacy: legacy20, canonical: canonical20 },
	{ route: 'admin/drive/clean-remote-files', legacy: legacy21, canonical: canonical21 },
	{ route: 'admin/drive/cleanup', legacy: legacy22, canonical: canonical22 },
	{ route: 'admin/drive/files', legacy: legacy23, canonical: canonical23 },
	{ route: 'admin/drive/show-file', legacy: legacy24, canonical: canonical24 },
	{ route: 'admin/emoji/add', legacy: legacy25, canonical: canonical25 },
	{ route: 'admin/emoji/copy', legacy: legacy26, canonical: canonical26 },
	{ route: 'admin/emoji/delete-bulk', legacy: legacy27, canonical: canonical27 },
	{ route: 'admin/emoji/delete', legacy: legacy28, canonical: canonical28 },
	{ route: 'admin/emoji/import-zip', legacy: legacy29, canonical: canonical29 },
	{ route: 'admin/emoji/list-remote', legacy: legacy30, canonical: canonical30 },
	{ route: 'admin/emoji/list', legacy: legacy31, canonical: canonical31 },
	{ route: 'admin/emoji/update', legacy: legacy32, canonical: canonical32 },
	{ route: 'admin/federation/refresh-remote-instance-metadata', legacy: legacy33, canonical: canonical33 },
	{ route: 'admin/federation/update-instance', legacy: legacy34, canonical: canonical34 },
	{ route: 'admin/forward-abuse-user-report', legacy: legacy35, canonical: canonical35 },
	{ route: 'admin/get-index-stats', legacy: legacy36, canonical: canonical36 },
	{ route: 'admin/get-table-stats', legacy: legacy37, canonical: canonical37 },
	{ route: 'admin/get-user-ips', legacy: legacy38, canonical: canonical38 },
	{ route: 'admin/invite/create', legacy: legacy39, canonical: canonical39 },
	{ route: 'admin/invite/list', legacy: legacy40, canonical: canonical40 },
	{ route: 'admin/meta', legacy: legacy41, canonical: canonical41 },
	{ route: 'admin/promo/create', legacy: legacy42, canonical: canonical42 },
	{ route: 'admin/queue/deliver-delayed', legacy: legacy43, canonical: canonical43 },
	{ route: 'admin/queue/inbox-delayed', legacy: legacy44, canonical: canonical44 },
	{ route: 'admin/queue/jobs', legacy: legacy45, canonical: canonical45 },
	{ route: 'admin/queue/queue-stats', legacy: legacy46, canonical: canonical46 },
	{ route: 'admin/queue/queues', legacy: legacy47, canonical: canonical47 },
	{ route: 'admin/queue/show-job-logs', legacy: legacy48, canonical: canonical48 },
	{ route: 'admin/queue/show-job', legacy: legacy49, canonical: canonical49 },
	{ route: 'admin/queue/stats', legacy: legacy50, canonical: canonical50 },
	{ route: 'admin/relays/add', legacy: legacy51, canonical: canonical51 },
	{ route: 'admin/relays/list', legacy: legacy52, canonical: canonical52 },
	{ route: 'admin/relays/remove', legacy: legacy53, canonical: canonical53 },
	{ route: 'admin/reset-password', legacy: legacy54, canonical: canonical54 },
	{ route: 'admin/resolve-abuse-user-report', legacy: legacy55, canonical: canonical55 },
	{ route: 'admin/roles/assign', legacy: legacy56, canonical: canonical56 },
	{ route: 'admin/roles/create', legacy: legacy57, canonical: canonical57 },
	{ route: 'admin/roles/delete', legacy: legacy58, canonical: canonical58 },
	{ route: 'admin/roles/list', legacy: legacy59, canonical: canonical59 },
	{ route: 'admin/roles/show', legacy: legacy60, canonical: canonical60 },
	{ route: 'admin/roles/unassign', legacy: legacy61, canonical: canonical61 },
	{ route: 'admin/roles/update-default-policies', legacy: legacy62, canonical: canonical62 },
	{ route: 'admin/roles/update', legacy: legacy63, canonical: canonical63 },
	{ route: 'admin/roles/users', legacy: legacy64, canonical: canonical64 },
	{ route: 'admin/server-info', legacy: legacy65, canonical: canonical65 },
	{ route: 'admin/show-moderation-logs', legacy: legacy66, canonical: canonical66 },
	{ route: 'admin/show-user', legacy: legacy67, canonical: canonical67 },
	{ route: 'admin/suspend-user', legacy: legacy68, canonical: canonical68 },
	{ route: 'admin/system-webhook/create', legacy: legacy69, canonical: canonical69 },
	{ route: 'admin/system-webhook/delete', legacy: legacy70, canonical: canonical70 },
	{ route: 'admin/system-webhook/list', legacy: legacy71, canonical: canonical71 },
	{ route: 'admin/system-webhook/show', legacy: legacy72, canonical: canonical72 },
	{ route: 'admin/system-webhook/test', legacy: legacy73, canonical: canonical73 },
	{ route: 'admin/system-webhook/update', legacy: legacy74, canonical: canonical74 },
	{ route: 'admin/unset-mfa', legacy: legacy75, canonical: canonical75 },
	{ route: 'admin/unset-user-avatar', legacy: legacy76, canonical: canonical76 },
	{ route: 'admin/unset-user-banner', legacy: legacy77, canonical: canonical77 },
	{ route: 'admin/unsuspend-user', legacy: legacy78, canonical: canonical78 },
	{ route: 'admin/update-abuse-user-report', legacy: legacy79, canonical: canonical79 },
	{ route: 'admin/update-meta', legacy: legacy80, canonical: canonical80 },
	{ route: 'admin/update-user-note', legacy: legacy81, canonical: canonical81 },
	{ route: 'announcements', legacy: legacy82, canonical: canonical82 },
	{ route: 'announcements/show', legacy: legacy83, canonical: canonical83 },
	{ route: 'antennas/create', legacy: legacy84, canonical: canonical84 },
	{ route: 'antennas/delete', legacy: legacy85, canonical: canonical85 },
	{ route: 'antennas/list', legacy: legacy86, canonical: canonical86 },
	{ route: 'antennas/notes', legacy: legacy87, canonical: canonical87 },
	{ route: 'antennas/remove-note', legacy: legacy88, canonical: canonical88 },
	{ route: 'antennas/show', legacy: legacy89, canonical: canonical89 },
	{ route: 'antennas/update', legacy: legacy90, canonical: canonical90 },
	{ route: 'ap/get', legacy: legacy91, canonical: canonical91 },
	{ route: 'ap/show', legacy: legacy92, canonical: canonical92 },
	{ route: 'app/create', legacy: legacy93, canonical: canonical93 },
	{ route: 'app/show', legacy: legacy94, canonical: canonical94 },
	{ route: 'auth/accept', legacy: legacy95, canonical: canonical95 },
	{ route: 'auth/session/generate', legacy: legacy96, canonical: canonical96 },
	{ route: 'auth/session/show', legacy: legacy97, canonical: canonical97 },
	{ route: 'auth/session/userkey', legacy: legacy98, canonical: canonical98 },
	{ route: 'blocking/create', legacy: legacy99, canonical: canonical99 },
	{ route: 'blocking/delete', legacy: legacy100, canonical: canonical100 },
	{ route: 'blocking/list', legacy: legacy101, canonical: canonical101 },
	{ route: 'bubble-game/ranking', legacy: legacy102, canonical: canonical102 },
	{ route: 'bubble-game/register', legacy: legacy103, canonical: canonical103 },
	{ route: 'channels/create', legacy: legacy104, canonical: canonical104 },
	{ route: 'channels/featured', legacy: legacy105, canonical: canonical105 },
	{ route: 'channels/followed', legacy: legacy106, canonical: canonical106 },
	{ route: 'channels/mute/list', legacy: legacy107, canonical: canonical107 },
	{ route: 'channels/my-favorites', legacy: legacy108, canonical: canonical108 },
	{ route: 'channels/owned', legacy: legacy109, canonical: canonical109 },
	{ route: 'channels/search', legacy: legacy110, canonical: canonical110 },
	{ route: 'channels/show', legacy: legacy111, canonical: canonical111 },
	{ route: 'channels/timeline', legacy: legacy112, canonical: canonical112 },
	{ route: 'channels/update', legacy: legacy113, canonical: canonical113 },
	{ route: 'charts/active-users', legacy: legacy114, canonical: canonical114 },
	{ route: 'charts/ap-request', legacy: legacy115, canonical: canonical115 },
	{ route: 'charts/drive', legacy: legacy116, canonical: canonical116 },
	{ route: 'charts/federation', legacy: legacy117, canonical: canonical117 },
	{ route: 'charts/instance', legacy: legacy118, canonical: canonical118 },
	{ route: 'charts/notes', legacy: legacy119, canonical: canonical119 },
	{ route: 'charts/user/drive', legacy: legacy120, canonical: canonical120 },
	{ route: 'charts/user/following', legacy: legacy121, canonical: canonical121 },
	{ route: 'charts/user/notes', legacy: legacy122, canonical: canonical122 },
	{ route: 'charts/user/pv', legacy: legacy123, canonical: canonical123 },
	{ route: 'charts/user/reactions', legacy: legacy124, canonical: canonical124 },
	{ route: 'charts/users', legacy: legacy125, canonical: canonical125 },
	{ route: 'chat/history', legacy: legacy126, canonical: canonical126 },
	{ route: 'chat/messages/create-to-room', legacy: legacy127, canonical: canonical127 },
	{ route: 'chat/messages/create-to-user', legacy: legacy128, canonical: canonical128 },
	{ route: 'chat/messages/room-timeline', legacy: legacy129, canonical: canonical129 },
	{ route: 'chat/messages/search', legacy: legacy130, canonical: canonical130 },
	{ route: 'chat/messages/show', legacy: legacy131, canonical: canonical131 },
	{ route: 'chat/messages/user-timeline', legacy: legacy132, canonical: canonical132 },
	{ route: 'chat/rooms/create', legacy: legacy133, canonical: canonical133 },
	{ route: 'chat/rooms/invitations/create', legacy: legacy134, canonical: canonical134 },
	{ route: 'chat/rooms/invitations/inbox', legacy: legacy135, canonical: canonical135 },
	{ route: 'chat/rooms/invitations/outbox', legacy: legacy136, canonical: canonical136 },
	{ route: 'chat/rooms/joining', legacy: legacy137, canonical: canonical137 },
	{ route: 'chat/rooms/members', legacy: legacy138, canonical: canonical138 },
	{ route: 'chat/rooms/owned', legacy: legacy139, canonical: canonical139 },
	{ route: 'chat/rooms/show', legacy: legacy140, canonical: canonical140 },
	{ route: 'chat/rooms/update', legacy: legacy141, canonical: canonical141 },
	{ route: 'clips/create', legacy: legacy142, canonical: canonical142 },
	{ route: 'clips/list', legacy: legacy143, canonical: canonical143 },
	{ route: 'clips/my-favorites', legacy: legacy144, canonical: canonical144 },
	{ route: 'clips/notes', legacy: legacy145, canonical: canonical145 },
	{ route: 'clips/show', legacy: legacy146, canonical: canonical146 },
	{ route: 'clips/update', legacy: legacy147, canonical: canonical147 },
	{ route: 'drive', legacy: legacy148, canonical: canonical148 },
	{ route: 'drive/files', legacy: legacy149, canonical: canonical149 },
	{ route: 'drive/files/attached-chat-messages', legacy: legacy150, canonical: canonical150 },
	{ route: 'drive/files/attached-notes', legacy: legacy151, canonical: canonical151 },
	{ route: 'drive/files/check-existence', legacy: legacy152, canonical: canonical152 },
	{ route: 'drive/files/create', legacy: legacy153, canonical: canonical153 },
	{ route: 'drive/files/delete', legacy: legacy154, canonical: canonical154 },
	{ route: 'drive/files/find-by-hash', legacy: legacy155, canonical: canonical155 },
	{ route: 'drive/files/find', legacy: legacy156, canonical: canonical156 },
	{ route: 'drive/files/move-bulk', legacy: legacy157, canonical: canonical157 },
	{ route: 'drive/files/show', legacy: legacy158, canonical: canonical158 },
	{ route: 'drive/files/update', legacy: legacy159, canonical: canonical159 },
	{ route: 'drive/files/upload-from-url', legacy: legacy160, canonical: canonical160 },
	{ route: 'drive/folders', legacy: legacy161, canonical: canonical161 },
	{ route: 'drive/folders/create', legacy: legacy162, canonical: canonical162 },
	{ route: 'drive/folders/delete', legacy: legacy163, canonical: canonical163 },
	{ route: 'drive/folders/find', legacy: legacy164, canonical: canonical164 },
	{ route: 'drive/folders/show', legacy: legacy165, canonical: canonical165 },
	{ route: 'drive/folders/update', legacy: legacy166, canonical: canonical166 },
	{ route: 'drive/stream', legacy: legacy167, canonical: canonical167 },
	{ route: 'email-address/available', legacy: legacy168, canonical: canonical168 },
	{ route: 'export-custom-emojis', legacy: legacy169, canonical: canonical169 },
	{ route: 'federation/followers', legacy: legacy170, canonical: canonical170 },
	{ route: 'federation/following', legacy: legacy171, canonical: canonical171 },
	{ route: 'federation/instances', legacy: legacy172, canonical: canonical172 },
	{ route: 'federation/show-instance', legacy: legacy173, canonical: canonical173 },
	{ route: 'federation/stats', legacy: legacy174, canonical: canonical174 },
	{ route: 'federation/update-remote-user', legacy: legacy175, canonical: canonical175 },
	{ route: 'federation/users', legacy: legacy176, canonical: canonical176 },
	{ route: 'fetch-external-resources', legacy: legacy177, canonical: canonical177 },
	{ route: 'flash/create', legacy: legacy178, canonical: canonical178 },
	{ route: 'flash/delete', legacy: legacy179, canonical: canonical179 },
	{ route: 'flash/featured', legacy: legacy180, canonical: canonical180 },
	{ route: 'flash/like', legacy: legacy181, canonical: canonical181 },
	{ route: 'flash/my-likes', legacy: legacy182, canonical: canonical182 },
	{ route: 'flash/my', legacy: legacy183, canonical: canonical183 },
	{ route: 'flash/search', legacy: legacy184, canonical: canonical184 },
	{ route: 'flash/show', legacy: legacy185, canonical: canonical185 },
	{ route: 'flash/unlike', legacy: legacy186, canonical: canonical186 },
	{ route: 'flash/update', legacy: legacy187, canonical: canonical187 },
	{ route: 'following/create', legacy: legacy188, canonical: canonical188 },
	{ route: 'following/delete', legacy: legacy189, canonical: canonical189 },
	{ route: 'following/invalidate', legacy: legacy190, canonical: canonical190 },
	{ route: 'following/list', legacy: legacy191, canonical: canonical191 },
	{ route: 'following/requests/accept', legacy: legacy192, canonical: canonical192 },
	{ route: 'following/requests/cancel', legacy: legacy193, canonical: canonical193 },
	{ route: 'following/requests/list', legacy: legacy194, canonical: canonical194 },
	{ route: 'following/requests/reject', legacy: legacy195, canonical: canonical195 },
	{ route: 'following/requests/sent', legacy: legacy196, canonical: canonical196 },
	{ route: 'following/update-all', legacy: legacy197, canonical: canonical197 },
	{ route: 'following/update', legacy: legacy198, canonical: canonical198 },
	{ route: 'gallery/featured', legacy: legacy199, canonical: canonical199 },
	{ route: 'gallery/popular', legacy: legacy200, canonical: canonical200 },
	{ route: 'gallery/posts', legacy: legacy201, canonical: canonical201 },
	{ route: 'gallery/posts/create', legacy: legacy202, canonical: canonical202 },
	{ route: 'gallery/posts/delete', legacy: legacy203, canonical: canonical203 },
	{ route: 'gallery/posts/like', legacy: legacy204, canonical: canonical204 },
	{ route: 'gallery/posts/show', legacy: legacy205, canonical: canonical205 },
	{ route: 'gallery/posts/unlike', legacy: legacy206, canonical: canonical206 },
	{ route: 'gallery/posts/update', legacy: legacy207, canonical: canonical207 },
	{ route: 'hashtags/list', legacy: legacy208, canonical: canonical208 },
	{ route: 'hashtags/search', legacy: legacy209, canonical: canonical209 },
	{ route: 'hashtags/show', legacy: legacy210, canonical: canonical210 },
	{ route: 'hashtags/trend', legacy: legacy211, canonical: canonical211 },
	{ route: 'hashtags/users', legacy: legacy212, canonical: canonical212 },
	{ route: 'i', legacy: legacy213, canonical: canonical213 },
	{ route: 'i/2fa/done', legacy: legacy214, canonical: canonical214 },
	{ route: 'i/2fa/key-done', legacy: legacy215, canonical: canonical215 },
	{ route: 'i/2fa/password-less', legacy: legacy216, canonical: canonical216 },
	{ route: 'i/2fa/register-key', legacy: legacy217, canonical: canonical217 },
	{ route: 'i/2fa/register', legacy: legacy218, canonical: canonical218 },
	{ route: 'i/2fa/remove-key', legacy: legacy219, canonical: canonical219 },
	{ route: 'i/2fa/unregister', legacy: legacy220, canonical: canonical220 },
	{ route: 'i/2fa/update-key', legacy: legacy221, canonical: canonical221 },
	{ route: 'i/apps', legacy: legacy222, canonical: canonical222 },
	{ route: 'i/authorized-apps', legacy: legacy223, canonical: canonical223 },
	{ route: 'i/change-password', legacy: legacy224, canonical: canonical224 },
	{ route: 'i/claim-achievement', legacy: legacy225, canonical: canonical225 },
	{ route: 'i/delete-account', legacy: legacy226, canonical: canonical226 },
	{ route: 'i/favorites', legacy: legacy227, canonical: canonical227 },
	{ route: 'i/gallery/likes', legacy: legacy228, canonical: canonical228 },
	{ route: 'i/gallery/posts', legacy: legacy229, canonical: canonical229 },
	{ route: 'i/import-antennas', legacy: legacy230, canonical: canonical230 },
	{ route: 'i/import-blocking', legacy: legacy231, canonical: canonical231 },
	{ route: 'i/import-following', legacy: legacy232, canonical: canonical232 },
	{ route: 'i/import-muting', legacy: legacy233, canonical: canonical233 },
	{ route: 'i/import-user-lists', legacy: legacy234, canonical: canonical234 },
	{ route: 'i/move', legacy: legacy235, canonical: canonical235 },
	{ route: 'i/notifications-grouped', legacy: legacy236, canonical: canonical236 },
	{ route: 'i/notifications', legacy: legacy237, canonical: canonical237 },
	{ route: 'i/page-likes', legacy: legacy238, canonical: canonical238 },
	{ route: 'i/pages', legacy: legacy239, canonical: canonical239 },
	{ route: 'i/pin', legacy: legacy240, canonical: canonical240 },
	{ route: 'i/regenerate-token', legacy: legacy241, canonical: canonical241 },
	{ route: 'i/registry/get-all', legacy: legacy242, canonical: canonical242 },
	{ route: 'i/registry/get-detail', legacy: legacy243, canonical: canonical243 },
	{ route: 'i/registry/get', legacy: legacy244, canonical: canonical244 },
	{ route: 'i/registry/keys-with-type', legacy: legacy245, canonical: canonical245 },
	{ route: 'i/registry/keys', legacy: legacy246, canonical: canonical246 },
	{ route: 'i/registry/remove', legacy: legacy247, canonical: canonical247 },
	{ route: 'i/registry/scopes-with-domain', legacy: legacy248, canonical: canonical248 },
	{ route: 'i/registry/set', legacy: legacy249, canonical: canonical249 },
	{ route: 'i/revoke-token', legacy: legacy250, canonical: canonical250 },
	{ route: 'i/signin-history', legacy: legacy251, canonical: canonical251 },
	{ route: 'i/unpin', legacy: legacy252, canonical: canonical252 },
	{ route: 'i/update-email', legacy: legacy253, canonical: canonical253 },
	{ route: 'i/update', legacy: legacy254, canonical: canonical254 },
	{ route: 'i/webhooks/create', legacy: legacy255, canonical: canonical255 },
	{ route: 'i/webhooks/list', legacy: legacy256, canonical: canonical256 },
	{ route: 'i/webhooks/show', legacy: legacy257, canonical: canonical257 },
	{ route: 'i/webhooks/test', legacy: legacy258, canonical: canonical258 },
	{ route: 'invite/create', legacy: legacy259, canonical: canonical259 },
	{ route: 'invite/delete', legacy: legacy260, canonical: canonical260 },
	{ route: 'invite/limit', legacy: legacy261, canonical: canonical261 },
	{ route: 'invite/list', legacy: legacy262, canonical: canonical262 },
	{ route: 'meta', legacy: legacy263, canonical: canonical263 },
	{ route: 'miauth/gen-token', legacy: legacy264, canonical: canonical264 },
	{ route: 'mute/create', legacy: legacy265, canonical: canonical265 },
	{ route: 'mute/delete', legacy: legacy266, canonical: canonical266 },
	{ route: 'mute/list', legacy: legacy267, canonical: canonical267 },
	{ route: 'my/apps', legacy: legacy268, canonical: canonical268 },
	{ route: 'notes', legacy: legacy269, canonical: canonical269 },
	{ route: 'notes/children', legacy: legacy270, canonical: canonical270 },
	{ route: 'notes/clips', legacy: legacy271, canonical: canonical271 },
	{ route: 'notes/conversation', legacy: legacy272, canonical: canonical272 },
	{ route: 'notes/create', legacy: legacy273, canonical: canonical273 },
	{ route: 'notes/delete', legacy: legacy274, canonical: canonical274 },
	{ route: 'notes/drafts/count', legacy: legacy275, canonical: canonical275 },
	{ route: 'notes/drafts/create', legacy: legacy276, canonical: canonical276 },
	{ route: 'notes/drafts/delete', legacy: legacy277, canonical: canonical277 },
	{ route: 'notes/drafts/list', legacy: legacy278, canonical: canonical278 },
	{ route: 'notes/drafts/update', legacy: legacy279, canonical: canonical279 },
	{ route: 'notes/favorites/create', legacy: legacy280, canonical: canonical280 },
	{ route: 'notes/favorites/delete', legacy: legacy281, canonical: canonical281 },
	{ route: 'notes/featured', legacy: legacy282, canonical: canonical282 },
	{ route: 'notes/global-timeline', legacy: legacy283, canonical: canonical283 },
	{ route: 'notes/hybrid-timeline', legacy: legacy284, canonical: canonical284 },
	{ route: 'notes/local-timeline', legacy: legacy285, canonical: canonical285 },
	{ route: 'notes/polls/recommendation', legacy: legacy286, canonical: canonical286 },
	{ route: 'notes/polls/vote', legacy: legacy287, canonical: canonical287 },
	{ route: 'notes/reactions', legacy: legacy288, canonical: canonical288 },
	{ route: 'notes/reactions/create', legacy: legacy289, canonical: canonical289 },
	{ route: 'notes/reactions/delete', legacy: legacy290, canonical: canonical290 },
	{ route: 'notes/renotes', legacy: legacy291, canonical: canonical291 },
	{ route: 'notes/replies', legacy: legacy292, canonical: canonical292 },
	{ route: 'notes/search-by-tag', legacy: legacy293, canonical: canonical293 },
	{ route: 'notes/search', legacy: legacy294, canonical: canonical294 },
	{ route: 'notes/show-partial-bulk', legacy: legacy295, canonical: canonical295 },
	{ route: 'notes/show', legacy: legacy296, canonical: canonical296 },
	{ route: 'notes/state', legacy: legacy297, canonical: canonical297 },
	{ route: 'notes/thread-muting/create', legacy: legacy298, canonical: canonical298 },
	{ route: 'notes/thread-muting/delete', legacy: legacy299, canonical: canonical299 },
	{ route: 'notes/timeline', legacy: legacy300, canonical: canonical300 },
	{ route: 'notes/translate', legacy: legacy301, canonical: canonical301 },
	{ route: 'notes/unrenote', legacy: legacy302, canonical: canonical302 },
	{ route: 'notes/user-list-timeline', legacy: legacy303, canonical: canonical303 },
	{ route: 'page-push', legacy: legacy304, canonical: canonical304 },
	{ route: 'pages/create', legacy: legacy305, canonical: canonical305 },
	{ route: 'pages/delete', legacy: legacy306, canonical: canonical306 },
	{ route: 'pages/featured', legacy: legacy307, canonical: canonical307 },
	{ route: 'pages/like', legacy: legacy308, canonical: canonical308 },
	{ route: 'pages/show', legacy: legacy309, canonical: canonical309 },
	{ route: 'pages/unlike', legacy: legacy310, canonical: canonical310 },
	{ route: 'pages/update', legacy: legacy311, canonical: canonical311 },
	{ route: 'pinned-users', legacy: legacy312, canonical: canonical312 },
	{ route: 'promo/read', legacy: legacy313, canonical: canonical313 },
	{ route: 'renote-mute/create', legacy: legacy314, canonical: canonical314 },
	{ route: 'renote-mute/delete', legacy: legacy315, canonical: canonical315 },
	{ route: 'renote-mute/list', legacy: legacy316, canonical: canonical316 },
	{ route: 'request-reset-password', legacy: legacy317, canonical: canonical317 },
	{ route: 'reset-db', legacy: legacy318, canonical: canonical318 },
	{ route: 'reset-password', legacy: legacy319, canonical: canonical319 },
	{ route: 'retention', legacy: legacy320, canonical: canonical320 },
	{ route: 'reversi/cancel-match', legacy: legacy321, canonical: canonical321 },
	{ route: 'reversi/games', legacy: legacy322, canonical: canonical322 },
	{ route: 'reversi/invitations', legacy: legacy323, canonical: canonical323 },
	{ route: 'reversi/match', legacy: legacy324, canonical: canonical324 },
	{ route: 'reversi/show-game', legacy: legacy325, canonical: canonical325 },
	{ route: 'reversi/surrender', legacy: legacy326, canonical: canonical326 },
	{ route: 'reversi/verify', legacy: legacy327, canonical: canonical327 },
	{ route: 'roles/list', legacy: legacy328, canonical: canonical328 },
	{ route: 'roles/notes', legacy: legacy329, canonical: canonical329 },
	{ route: 'roles/show', legacy: legacy330, canonical: canonical330 },
	{ route: 'roles/users', legacy: legacy331, canonical: canonical331 },
	{ route: 'sw/register', legacy: legacy332, canonical: canonical332 },
	{ route: 'sw/show-registration', legacy: legacy333, canonical: canonical333 },
	{ route: 'sw/unregister', legacy: legacy334, canonical: canonical334 },
	{ route: 'sw/update-registration', legacy: legacy335, canonical: canonical335 },
	{ route: 'test', legacy: legacy336, canonical: canonical336 },
	{ route: 'username/available', legacy: legacy337, canonical: canonical337 },
	{ route: 'users', legacy: legacy338, canonical: canonical338 },
	{ route: 'users/achievements', legacy: legacy339, canonical: canonical339 },
	{ route: 'users/clips', legacy: legacy340, canonical: canonical340 },
	{ route: 'users/featured-notes', legacy: legacy341, canonical: canonical341 },
	{ route: 'users/flashs', legacy: legacy342, canonical: canonical342 },
	{ route: 'users/followers', legacy: legacy343, canonical: canonical343 },
	{ route: 'users/following', legacy: legacy344, canonical: canonical344 },
	{ route: 'users/gallery/posts', legacy: legacy345, canonical: canonical345 },
	{ route: 'users/get-following-users-by-birthday', legacy: legacy346, canonical: canonical346 },
	{ route: 'users/get-frequently-replied-users', legacy: legacy347, canonical: canonical347 },
	{ route: 'users/lists/create-from-public', legacy: legacy348, canonical: canonical348 },
	{ route: 'users/lists/create', legacy: legacy349, canonical: canonical349 },
	{ route: 'users/lists/get-memberships', legacy: legacy350, canonical: canonical350 },
	{ route: 'users/lists/list', legacy: legacy351, canonical: canonical351 },
	{ route: 'users/lists/show', legacy: legacy352, canonical: canonical352 },
	{ route: 'users/lists/update', legacy: legacy353, canonical: canonical353 },
	{ route: 'users/pages', legacy: legacy354, canonical: canonical354 },
	{ route: 'users/reactions', legacy: legacy355, canonical: canonical355 },
	{ route: 'users/recommendation', legacy: legacy356, canonical: canonical356 },
	{ route: 'users/relation', legacy: legacy357, canonical: canonical357 },
	{ route: 'users/report-abuse', legacy: legacy358, canonical: canonical358 },
	{ route: 'users/search-by-username-and-host', legacy: legacy359, canonical: canonical359 },
	{ route: 'users/search', legacy: legacy360, canonical: canonical360 },
	{ route: 'users/show', legacy: legacy361, canonical: canonical361 },
	{ route: 'users/update-memo', legacy: legacy362, canonical: canonical362 },
	{ route: 'v2/admin/emoji/list', legacy: legacy363, canonical: canonical363 },
	{ route: 'verify-email', legacy: legacy364, canonical: canonical364 },
];

for (const pair of identityCases) {
	test(`legacy path preserves ${pair.route} export identity`, () => {
		expect(pair.legacy.default).toBe(pair.canonical.EndpointImplementation);
		expect(pair.legacy.meta).toBe(pair.canonical.meta);
		expect(pair.legacy.paramDef).toBe(pair.canonical.paramDef);
	});
}
