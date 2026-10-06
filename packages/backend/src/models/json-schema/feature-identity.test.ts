/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as legacy_abuse_report_notification_recipient from './abuse-report-notification-recipient.js';
import * as moved_abuse_report_notification_recipient from '../../../../features/moderation/backend/models/json-schema/abuse-report-notification-recipient.js';
import * as legacy_achievement from './achievement.js';
import * as moved_achievement from '../../../../features/users/backend/models/json-schema/achievement.js';
import * as legacy_ad from './ad.js';
import * as moved_ad from '../../../../features/instance/backend/models/json-schema/ad.js';
import * as legacy_announcement from './announcement.js';
import * as moved_announcement from '../../../../features/announcements/backend/models/json-schema/announcement.js';
import * as legacy_antenna from './antenna.js';
import * as moved_antenna from '../../../../features/timelines/backend/models/json-schema/antenna.js';
import * as legacy_app from './app.js';
import * as moved_app from '../../../../features/auth/backend/models/json-schema/app.js';
import * as legacy_blocking from './blocking.js';
import * as moved_blocking from '../../../../features/relationships/backend/models/json-schema/blocking.js';
import * as legacy_channel from './channel.js';
import * as moved_channel from '../../../../features/channels/backend/models/json-schema/channel.js';
import * as legacy_chat_message from './chat-message.js';
import * as moved_chat_message from '../../../../features/chat/backend/models/json-schema/chat-message.js';
import * as legacy_chat_room_invitation from './chat-room-invitation.js';
import * as moved_chat_room_invitation from '../../../../features/chat/backend/models/json-schema/chat-room-invitation.js';
import * as legacy_chat_room_membership from './chat-room-membership.js';
import * as moved_chat_room_membership from '../../../../features/chat/backend/models/json-schema/chat-room-membership.js';
import * as legacy_chat_room from './chat-room.js';
import * as moved_chat_room from '../../../../features/chat/backend/models/json-schema/chat-room.js';
import * as legacy_clip from './clip.js';
import * as moved_clip from '../../../../features/collections/backend/models/json-schema/clip.js';
import * as legacy_drive_file from './drive-file.js';
import * as moved_drive_file from '../../../../features/drive/backend/models/json-schema/drive-file.js';
import * as legacy_drive_folder from './drive-folder.js';
import * as moved_drive_folder from '../../../../features/drive/backend/models/json-schema/drive-folder.js';
import * as legacy_emoji from './emoji.js';
import * as moved_emoji from '../../../../features/emojis/backend/models/json-schema/emoji.js';
import * as legacy_federation_instance from './federation-instance.js';
import * as moved_federation_instance from '../../../../features/federation/backend/models/json-schema/federation-instance.js';
import * as legacy_flash from './flash.js';
import * as moved_flash from '../../../../features/play/backend/models/json-schema/flash.js';
import * as legacy_following from './following.js';
import * as moved_following from '../../../../features/relationships/backend/models/json-schema/following.js';
import * as legacy_gallery_post from './gallery-post.js';
import * as moved_gallery_post from '../../../../features/gallery/backend/models/json-schema/gallery-post.js';
import * as legacy_hashtag from './hashtag.js';
import * as moved_hashtag from '../../../../features/discovery/backend/models/json-schema/hashtag.js';
import * as legacy_invite_code from './invite-code.js';
import * as moved_invite_code from '../../../../features/auth/backend/models/json-schema/invite-code.js';
import * as legacy_meta from './meta.js';
import * as moved_meta from '../../../../features/instance/backend/models/json-schema/meta.js';
import * as legacy_muting from './muting.js';
import * as moved_muting from '../../../../features/relationships/backend/models/json-schema/muting.js';
import * as legacy_note_draft from './note-draft.js';
import * as moved_note_draft from '../../../../features/notes/backend/models/json-schema/note-draft.js';
import * as legacy_note_favorite from './note-favorite.js';
import * as moved_note_favorite from '../../../../features/collections/backend/models/json-schema/note-favorite.js';
import * as legacy_note_reaction from './note-reaction.js';
import * as moved_note_reaction from '../../../../features/notes/backend/models/json-schema/note-reaction.js';
import * as legacy_note from './note.js';
import * as moved_note from '../../../../features/notes/backend/models/json-schema/note.js';
import * as legacy_notification from './notification.js';
import * as moved_notification from '../../../../features/notifications/backend/models/json-schema/notification.js';
import * as legacy_page from './page.js';
import * as moved_page from '../../../../features/pages/backend/models/json-schema/page.js';
import * as legacy_queue from './queue.js';
import * as moved_queue from '../../../../features/operations/backend/models/json-schema/queue.js';
import * as legacy_renote_muting from './renote-muting.js';
import * as moved_renote_muting from '../../../../features/relationships/backend/models/json-schema/renote-muting.js';
import * as legacy_reversi_game from './reversi-game.js';
import * as moved_reversi_game from '../../../../features/games/backend/models/json-schema/reversi-game.js';
import * as legacy_role from './role.js';
import * as moved_role from '../../../../features/roles/backend/models/json-schema/role.js';
import * as legacy_signin from './signin.js';
import * as moved_signin from '../../../../features/auth/backend/models/json-schema/signin.js';
import * as legacy_system_webhook from './system-webhook.js';
import * as moved_system_webhook from '../../../../features/integrations/backend/models/json-schema/system-webhook.js';
import * as legacy_user_list from './user-list.js';
import * as moved_user_list from '../../../../features/relationships/backend/models/json-schema/user-list.js';
import * as legacy_user_webhook from './user-webhook.js';
import * as moved_user_webhook from '../../../../features/integrations/backend/models/json-schema/user-webhook.js';
import * as legacy_user from './user.js';
import * as moved_user from '../../../../features/users/backend/models/json-schema/user.js';

const cases = [
	['abuse-report-notification-recipient', legacy_abuse_report_notification_recipient, moved_abuse_report_notification_recipient],
	['achievement', legacy_achievement, moved_achievement],
	['ad', legacy_ad, moved_ad],
	['announcement', legacy_announcement, moved_announcement],
	['antenna', legacy_antenna, moved_antenna],
	['app', legacy_app, moved_app],
	['blocking', legacy_blocking, moved_blocking],
	['channel', legacy_channel, moved_channel],
	['chat-message', legacy_chat_message, moved_chat_message],
	['chat-room-invitation', legacy_chat_room_invitation, moved_chat_room_invitation],
	['chat-room-membership', legacy_chat_room_membership, moved_chat_room_membership],
	['chat-room', legacy_chat_room, moved_chat_room],
	['clip', legacy_clip, moved_clip],
	['drive-file', legacy_drive_file, moved_drive_file],
	['drive-folder', legacy_drive_folder, moved_drive_folder],
	['emoji', legacy_emoji, moved_emoji],
	['federation-instance', legacy_federation_instance, moved_federation_instance],
	['flash', legacy_flash, moved_flash],
	['following', legacy_following, moved_following],
	['gallery-post', legacy_gallery_post, moved_gallery_post],
	['hashtag', legacy_hashtag, moved_hashtag],
	['invite-code', legacy_invite_code, moved_invite_code],
	['meta', legacy_meta, moved_meta],
	['muting', legacy_muting, moved_muting],
	['note-draft', legacy_note_draft, moved_note_draft],
	['note-favorite', legacy_note_favorite, moved_note_favorite],
	['note-reaction', legacy_note_reaction, moved_note_reaction],
	['note', legacy_note, moved_note],
	['notification', legacy_notification, moved_notification],
	['page', legacy_page, moved_page],
	['queue', legacy_queue, moved_queue],
	['renote-muting', legacy_renote_muting, moved_renote_muting],
	['reversi-game', legacy_reversi_game, moved_reversi_game],
	['role', legacy_role, moved_role],
	['signin', legacy_signin, moved_signin],
	['system-webhook', legacy_system_webhook, moved_system_webhook],
	['user-list', legacy_user_list, moved_user_list],
	['user-webhook', legacy_user_webhook, moved_user_webhook],
	['user', legacy_user, moved_user],
] as const;

for (const [schemaName, legacy, moved] of cases) {
	test(`${schemaName} legacy schema exports keep their identity`, () => {
		const legacyNames = Object.keys(legacy).sort();
		const movedNames = Object.keys(moved).sort();
		expect(movedNames).toEqual(legacyNames);
		for (const name of legacyNames) {
			expect(Reflect.get(moved, name)).toBe(Reflect.get(legacy, name));
		}
	});
}
