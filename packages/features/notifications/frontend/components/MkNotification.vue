<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.contentVisibilityAuto]: contentVisibilityAuto }]">
	<div :class="$style.head">
		<MkAvatar v-if="['pollEnded', 'note'].includes(notification.type) && 'note' in notification" :class="$style.icon" :user="notification.note.user" link preview/>
		<MkAvatar v-else-if="['roleAssigned', 'achievementEarned', 'exportCompleted', 'login', 'createToken', 'scheduledNotePosted', 'scheduledNotePostFailed'].includes(notification.type)" :class="$style.icon" :user="$i" link preview/>
		<div v-else-if="notification.type === 'reaction:grouped' && notification.note.reactionAcceptance === 'likeOnly'" :class="[$style.icon, $style.icon_reactionGroupHeart]"><i class="ti ti-heart" style="line-height: 1;"></i></div>
		<div v-else-if="notification.type === 'reaction:grouped'" :class="[$style.icon, $style.icon_reactionGroup]"><i class="ti ti-plus" style="line-height: 1;"></i></div>
		<div v-else-if="notification.type === 'renote:grouped'" :class="[$style.icon, $style.icon_renoteGroup]"><i class="ti ti-repeat" style="line-height: 1;"></i></div>
		<MkAvatar v-else-if="'user' in notification" :class="$style.icon" :user="notification.user" link preview/>
		<img v-else-if="'icon' in notification && notification.icon != null" :class="[$style.icon, $style.icon_app]" :src="notification.icon" alt=""/>
		<div
			:class="[$style.subIcon, {
				[$style.t_follow]: notification.type === 'follow',
				[$style.t_followRequestAccepted]: notification.type === 'followRequestAccepted',
				[$style.t_receiveFollowRequest]: notification.type === 'receiveFollowRequest',
				[$style.t_renote]: notification.type === 'renote',
				[$style.t_reply]: notification.type === 'reply',
				[$style.t_mention]: notification.type === 'mention',
				[$style.t_quote]: notification.type === 'quote',
				[$style.t_pollEnded]: notification.type === 'pollEnded',
				[$style.t_scheduledNotePosted]: notification.type === 'scheduledNotePosted',
				[$style.t_scheduledNotePostFailed]: notification.type === 'scheduledNotePostFailed',
				[$style.t_achievementEarned]: notification.type === 'achievementEarned',
				[$style.t_exportCompleted]: notification.type === 'exportCompleted',
				[$style.t_login]: notification.type === 'login',
				[$style.t_createToken]: notification.type === 'createToken',
				[$style.t_chatRoomInvitationReceived]: notification.type === 'chatRoomInvitationReceived',
				[$style.t_roleAssigned]: notification.type === 'roleAssigned' && notification.role.iconUrl == null,
			}]"
		>
			<i v-if="notification.type === 'follow'" class="ti ti-plus"></i>
			<i v-else-if="notification.type === 'receiveFollowRequest'" class="ti ti-clock"></i>
			<i v-else-if="notification.type === 'followRequestAccepted'" class="ti ti-check"></i>
			<i v-else-if="notification.type === 'renote'" class="ti ti-repeat"></i>
			<i v-else-if="notification.type === 'reply'" class="ti ti-arrow-back-up"></i>
			<i v-else-if="notification.type === 'mention'" class="ti ti-at"></i>
			<i v-else-if="notification.type === 'quote'" class="ti ti-quote"></i>
			<i v-else-if="notification.type === 'pollEnded'" class="ti ti-chart-arrows"></i>
			<i v-else-if="notification.type === 'scheduledNotePosted'" class="ti ti-send"></i>
			<i v-else-if="notification.type === 'scheduledNotePostFailed'" class="ti ti-alert-triangle"></i>
			<i v-else-if="notification.type === 'achievementEarned'" class="ti ti-medal"></i>
			<i v-else-if="notification.type === 'exportCompleted'" class="ti ti-archive"></i>
			<i v-else-if="notification.type === 'login'" class="ti ti-login-2"></i>
			<i v-else-if="notification.type === 'createToken'" class="ti ti-key"></i>
			<i v-else-if="notification.type === 'chatRoomInvitationReceived'" class="ti ti-messages"></i>
			<template v-else-if="notification.type === 'roleAssigned'">
				<img v-if="notification.role.iconUrl" style="height: 1.3em; vertical-align: -22%;" :src="notification.role.iconUrl" alt=""/>
				<i v-else class="ti ti-badges"></i>
			</template>
			<MkReactionIcon
				v-else-if="notification.type === 'reaction'"
				:withTooltip="true"
				:reaction="notification.reaction.replace(/^:(\w+):$/, ':$1@.:')"
				:noStyle="true"
				style="width: 100%; height: 100% !important; object-fit: contain;"
			/>
		</div>
	</div>
	<div :class="$style.tail">
		<header :class="$style.header">
			<span v-if="notification.type === 'pollEnded'">{{ $locale.sfc.notificationPollEnded }}</span>
			<span v-else-if="notification.type === 'scheduledNotePosted'">{{ $locale.sfc.notificationScheduledNotePosted }}</span>
			<span v-else-if="notification.type === 'scheduledNotePostFailed'">{{ $locale.sfc.notificationScheduledNotePostFailed }}</span>
			<span v-else-if="notification.type === 'note'">{{ $locale.sfc.notificationNewNote }}: <MkUserName :user="notification.note.user"/></span>
			<span v-else-if="notification.type === 'roleAssigned'">{{ $locale.sfc.notificationRoleAssigned }}</span>
			<span v-else-if="notification.type === 'chatRoomInvitationReceived'">{{ $locale.sfc.notificationChatRoomInvitationReceived }}</span>
			<span v-else-if="notification.type === 'achievementEarned'">{{ $locale.sfc.notificationAchievementEarned }}</span>
			<span v-else-if="notification.type === 'login'">{{ $locale.sfc.notificationLogin }}</span>
			<span v-else-if="notification.type === 'createToken'">{{ $locale.sfc.notificationCreateToken }}</span>
			<span v-else-if="notification.type === 'test'">{{ $locale.sfc.notificationTestNotification }}</span>
			<span v-else-if="notification.type === 'exportCompleted'">{{ interpolateLocaleParameters($locale.sfc.notificationExportOfXCompleted, { x: exportEntityName[notification.exportedEntity] }) }}</span>
			<MkA v-else-if="notification.type === 'follow' || notification.type === 'mention' || notification.type === 'reply' || notification.type === 'renote' || notification.type === 'quote' || notification.type === 'reaction' || notification.type === 'receiveFollowRequest' || notification.type === 'followRequestAccepted'" v-user-preview="notification.user.id" :class="$style.headerName" :to="userPage(notification.user)"><MkUserName :user="notification.user"/></MkA>
			<span v-else-if="notification.type === 'reaction:grouped' && notification.note.reactionAcceptance === 'likeOnly'">{{ interpolateLocaleParameters($locale.sfc.notificationLikedBySomeUsers, { n: getActualReactedUsersCount(notification) }) }}</span>
			<span v-else-if="notification.type === 'reaction:grouped'">{{ interpolateLocaleParameters($locale.sfc.notificationReactedBySomeUsers, { n: getActualReactedUsersCount(notification) }) }}</span>
			<span v-else-if="notification.type === 'renote:grouped'">{{ interpolateLocaleParameters($locale.sfc.notificationRenotedBySomeUsers, { n: notification.users.length }) }}</span>
			<span v-else-if="notification.type === 'app'">{{ notification.header }}</span>
			<MkTime v-if="withTime" :time="notification.createdAt" :class="$style.headerTime"/>
		</header>
		<div>
			<MkA v-if="notification.type === 'reaction' || notification.type === 'reaction:grouped'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
				<i class="ti ti-quote" :class="$style.quote"></i>
				<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="true" :author="notification.note.user"/>
				<i class="ti ti-quote" :class="$style.quote"></i>
			</MkA>
			<MkA v-else-if="notification.type === 'renote' || notification.type === 'renote:grouped'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note.renote)">
				<i class="ti ti-quote" :class="$style.quote"></i>
				<Mfm :text="getNoteSummary(notification.note.renote)" :plain="true" :nowrap="true" :author="notification.note.renote?.user"/>
				<i class="ti ti-quote" :class="$style.quote"></i>
			</MkA>
			<MkA v-else-if="notification.type === 'reply'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
				<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="true" :author="notification.note.user"/>
			</MkA>
			<MkA v-else-if="notification.type === 'mention'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
				<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="true" :author="notification.note.user"/>
			</MkA>
			<MkA v-else-if="notification.type === 'quote'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
				<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="true" :author="notification.note.user"/>
			</MkA>
			<MkA v-else-if="notification.type === 'note'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
				<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="true" :author="notification.note.user"/>
			</MkA>
			<MkA v-else-if="notification.type === 'pollEnded'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
				<i class="ti ti-quote" :class="$style.quote"></i>
				<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="true" :author="notification.note.user"/>
				<i class="ti ti-quote" :class="$style.quote"></i>
			</MkA>
			<MkA v-else-if="notification.type === 'scheduledNotePosted'" :class="$style.text" :to="notePage(notification.note)" :title="getNoteSummary(notification.note)">
				<i class="ti ti-quote" :class="$style.quote"></i>
				<Mfm :text="getNoteSummary(notification.note)" :plain="true" :nowrap="true" :author="notification.note.user"/>
				<i class="ti ti-quote" :class="$style.quote"></i>
			</MkA>
			<div v-else-if="notification.type === 'roleAssigned'" :class="$style.text">
				{{ notification.role.name }}
			</div>
			<div v-else-if="notification.type === 'chatRoomInvitationReceived'" :class="$style.text">
				{{ notification.invitation.room.name }}
			</div>
			<MkA v-else-if="notification.type === 'achievementEarned'" :class="$style.text" to="/my/achievements">
				{{ copyLocaleDictionary($locale.sfc.achievementsTypesLabels)[`_${notification.achievement}`].title }}
			</MkA>
			<MkA v-else-if="notification.type === 'exportCompleted'" :class="$style.text" :to="`/my/drive/file/${notification.fileId}`">
				{{ $locale.sfc.showFile }}
			</MkA>
			<MkA v-else-if="notification.type === 'createToken'" :class="$style.text" to="/settings/apps">
				<Mfm :text="interpolateLocaleParameters($locale.sfc.notificationCreateTokenDescription, { text: $locale.sfc.manageAccessTokens })"/>
			</MkA>
			<template v-else-if="notification.type === 'follow'">
				<span :class="$style.text" style="opacity: 0.6;">{{ $locale.sfc.youGotNewFollower }}</span>
			</template>
			<template v-else-if="notification.type === 'followRequestAccepted'">
				<div :class="$style.text" style="opacity: 0.6;">{{ $locale.sfc.followRequestAccepted }}</div>
				<div v-if="notification.message" :class="$style.text" style="opacity: 0.6; font-style: oblique;">
					<i class="ti ti-quote" :class="$style.quote"></i>
					<Mfm :text="notification.message" :author="notification.user" :plain="true" :nowrap="true"/>
					<i class="ti ti-quote" :class="$style.quote"></i>
				</div>
			</template>
			<template v-else-if="notification.type === 'receiveFollowRequest'">
				<span :class="$style.text" style="opacity: 0.6;">{{ $locale.sfc.receiveFollowRequest }}</span>
				<div v-if="full && !followRequestDone" :class="$style.followRequestCommands">
					<MkButton :class="$style.followRequestCommandButton" rounded primary @click="acceptFollowRequest()"><i class="ti ti-check"></i> {{ $locale.sfc.accept }}</MkButton>
					<MkButton :class="$style.followRequestCommandButton" rounded danger @click="rejectFollowRequest()"><i class="ti ti-x"></i> {{ $locale.sfc.reject }}</MkButton>
				</div>
			</template>
			<span v-else-if="notification.type === 'test'" :class="$style.text">{{ $locale.sfc.notificationNotificationWillBeDisplayedLikeThis }}</span>
			<span v-else-if="notification.type === 'app'" :class="$style.text">
				<Mfm :text="notification.body" :nowrap="false"/>
			</span>

			<div v-if="notification.type === 'reaction:grouped'">
				<div v-for="reaction of notification.reactions" :key="reaction.user.id + reaction.reaction" :class="$style.reactionsItem">
					<MkAvatar :class="$style.reactionsItemAvatar" :user="reaction.user" link preview/>
					<div :class="$style.reactionsItemReaction">
						<MkReactionIcon
							:withTooltip="true"
							:reaction="reaction.reaction.replace(/^:(\w+):$/, ':$1@.:')"
							:noStyle="true"
							style="width: 100%; height: 100% !important; object-fit: contain;"
						/>
					</div>
				</div>
			</div>
			<div v-else-if="notification.type === 'renote:grouped'">
				<div v-for="user of notification.users" :key="user.id" :class="$style.reactionsItem">
					<MkAvatar :class="$style.reactionsItemAvatar" :user="user" link preview/>
				</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkReactionIcon from '@features/notes/frontend/components/MkReactionIcon.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { getNoteSummary } from '@features/notes/frontend/utility/get-note-summary.js';
import { notePage } from '@features/notes/frontend/shared/note.js';
import { userPage } from '@features/users/frontend/shared/user.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { ensureSignin } from '@features/auth/frontend/i.js';

const $i = ensureSignin();

const props = withDefaults(defineProps<{
	notification: Misskey.entities.Notification;
	withTime?: boolean;
	full?: boolean;
	contentVisibilityAuto?: boolean;
}>(), {
	withTime: false,
	full: false,
	contentVisibilityAuto: true,
});

type ExportCompletedNotification = Misskey.entities.Notification & { type: 'exportCompleted' };

const exportEntityName = {
	antenna: $locale.value.sfc.antennas,
	blocking: $locale.value.sfc.blockedUsers,
	clip: $locale.value.sfc.clips,
	customEmoji: $locale.value.sfc.customEmojis,
	favorite: $locale.value.sfc.favorites,
	following: $locale.value.sfc.following,
	muting: $locale.value.sfc.mutedUsers,
	note: $locale.value.sfc.notes,
	userList: $locale.value.sfc.lists,
} as const satisfies Record<ExportCompletedNotification['exportedEntity'], string>;

const followRequestDone = ref(false);

const acceptFollowRequest = () => {
	if (!('user' in props.notification)) return;
	followRequestDone.value = true;
	misskeyApi('following/requests/accept', { userId: props.notification.user.id });
};

const rejectFollowRequest = () => {
	if (!('user' in props.notification)) return;
	followRequestDone.value = true;
	misskeyApi('following/requests/reject', { userId: props.notification.user.id });
};

function getActualReactedUsersCount(notification: Misskey.entities.Notification) {
	if (notification.type !== 'reaction:grouped') return 0;
	return new Set(notification.reactions.map((reaction) => reaction.user.id)).size;
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	box-sizing: border-box;
	padding: 24px 32px;
	font-size: 0.9em;
	overflow-wrap: break-word;
	display: flex;
	contain: content;

	&.contentVisibilityAuto {
		content-visibility: auto;
		contain-intrinsic-size: 0 100px;
	}

	--eventFollow: #36aed2;
	--eventRenote: #36d298;
	--eventReply: #007aff;
	--eventReactionHeart: var(--MI_THEME-love);
	--eventReaction: #e99a0b;
	--eventAchievement: #cb9a11;
	--eventLogin: #007aff;
	--eventOther: #88a6b7;
}

.head {
	position: sticky;
	top: 0;
	flex-shrink: 0;
	width: 42px;
	height: 42px;
	margin-right: 8px;
}

.icon {
	display: block;
	width: 100%;
	height: 100%;
}

.icon_reactionGroup,
.icon_reactionGroupHeart,
.icon_renoteGroup {
	display: grid;
	align-items: center;
	justify-items: center;
	width: 80%;
	height: 80%;
	font-size: 15px;
	border-radius: 100%;
	color: #fff;
}

.icon_reactionGroup {
	background: var(--eventReaction);
}

.icon_reactionGroupHeart {
	background: var(--eventReactionHeart);
}

.icon_renoteGroup {
	background: var(--eventRenote);
}

.icon_app {
	border-radius: 6px;
}

.subIcon {
	position: absolute;
	z-index: 1;
	bottom: -2px;
	right: -2px;
	width: 20px;
	height: 20px;
	line-height: 20px;
	box-sizing: border-box;
	border-radius: 100%;
	background: var(--MI_THEME-panel);
	box-shadow: 0 0 0 3px var(--MI_THEME-panel);
	font-size: 11px;
	text-align: center;
	color: #fff;

	&:empty {
		display: none;
	}
}

.t_follow, .t_followRequestAccepted, .t_receiveFollowRequest {
	background: var(--eventFollow);
	pointer-events: none;
}

.t_renote {
	background: var(--eventRenote);
	pointer-events: none;
}

.t_quote {
	background: var(--eventRenote);
	pointer-events: none;
}

.t_reply {
	background: var(--eventReply);
	pointer-events: none;
}

.t_mention {
	background: var(--eventOther);
	pointer-events: none;
}

.t_pollEnded {
	background: var(--eventOther);
	pointer-events: none;
}

.t_scheduledNotePosted {
	background: var(--eventOther);
	pointer-events: none;
}

.t_scheduledNotePostFailed {
	background: var(--eventOther);
	pointer-events: none;
}

.t_achievementEarned {
	background: var(--eventAchievement);
	pointer-events: none;
}

.t_exportCompleted {
	background: var(--eventOther);
	pointer-events: none;
}

.t_roleAssigned {
	background: var(--eventOther);
	pointer-events: none;
}

.t_login {
	background: var(--eventLogin);
	pointer-events: none;
}

.t_createToken {
	background: var(--eventOther);
	pointer-events: none;
}

.t_chatRoomInvitationReceived {
	background: var(--eventOther);
	pointer-events: none;
}

.tail {
	flex: 1;
	min-width: 0;
}

.header {
	display: flex;
	align-items: baseline;
	white-space: nowrap;
}

.headerName {
	text-overflow: ellipsis;
	white-space: nowrap;
	min-width: 0;
	overflow: hidden;
}

.headerTime {
	margin-left: auto;
	font-size: 0.9em;
}

.text {
	display: flex;
	width: 100%;
	overflow: clip;
}

.quote {
	vertical-align: super;
	font-size: 50%;
	opacity: 0.5;
}

.quote:first-child {
	margin-right: 4px;
	position: relative;

	&::before {
		position: absolute;
		transform: rotate(180deg);
	}
}

.quote:last-child {
	margin-left: 4px;
}

.followRequestCommands {
	display: flex;
	gap: 8px;
	max-width: 300px;
	margin-top: 8px;
}
.followRequestCommandButton {
	flex: 1;
}

.reactionsItem {
	display: inline-block;
	position: relative;
	width: 38px;
	height: 38px;
	margin-top: 8px;
	margin-right: 8px;
}

.reactionsItemAvatar {
	width: 100%;
	height: 100%;
}

.reactionsItemReaction {
	position: absolute;
	z-index: 1;
	bottom: -2px;
	right: -2px;
	width: 20px;
	height: 20px;
	box-sizing: border-box;
	border-radius: 100%;
	background: var(--MI_THEME-panel);
	box-shadow: 0 0 0 3px var(--MI_THEME-panel);
	font-size: 11px;
	text-align: center;
	color: #fff;
}

@container (max-width: 600px) {
	.root {
		padding: 16px;
		font-size: 0.9em;
	}
}

@container (max-width: 500px) {
	.root {
		padding: 12px;
		font-size: 0.85em;
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"notificationPollEnded": "انتهى الاستطلاع",
	"notificationScheduledNotePosted": "Scheduled note has been posted",
	"notificationScheduledNotePostFailed": "Failed to post scheduled note",
	"notificationNewNote": "New note",
	"notificationRoleAssigned": "Role given",
	"notificationChatRoomInvitationReceived": "You have been invited to a chat room",
	"notificationAchievementEarned": "Achievement unlocked",
	"notificationLogin": "Someone logged in",
	"notificationCreateToken": "An access token has been created",
	"notificationTestNotification": "Test notification",
	"notificationExportOfXCompleted": "Export of {x} has been completed",
	"notificationLikedBySomeUsers": "{n} users liked your note",
	"notificationReactedBySomeUsers": "{n} users reacted",
	"notificationRenotedBySomeUsers": "Renote from {n} users",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "just setting up my msky",
			"description": "انشر ملاحظتك الأولى",
			"flavor": "تمتع باستخدام ميسكي!"
		},
		"_notes10": {
			"title": "بعض الملاحظات",
			"description": "انشر 10 ملاحظات"
		},
		"_notes100": {
			"title": "كثير من الملاحظات",
			"description": "انشر 100 ملاحظة"
		},
		"_notes500": {
			"title": "Covered in notes",
			"description": "انشر 500 ملاحظة"
		},
		"_notes1000": {
			"title": "جبل ملاحظات",
			"description": "انشر 1000 ملاحظة"
		},
		"_notes5000": {
			"title": "Overflowing notes",
			"description": "انشر 5000 ملاحظة"
		},
		"_notes10000": {
			"title": "Supernote",
			"description": "انشر 10000 ملاحظة"
		},
		"_notes20000": {
			"title": "أريد...ملاحظات...أكثر",
			"description": "انشر 20000 ملاحظة"
		},
		"_notes30000": {
			"title": "ملاحظات وملاحظات وملاحظات",
			"description": "انشر 30000 ملاحظة"
		},
		"_notes40000": {
			"title": "مصنع ملاحظات",
			"description": "انشر 40000 ملاحظة"
		},
		"_notes50000": {
			"title": "كوكب ملاحظات",
			"description": "انشر 50000 ملاحظة"
		},
		"_notes60000": {
			"title": "نجم ملاحظات",
			"description": "انشر 60000 ملاحظة"
		},
		"_notes70000": {
			"title": "ثقب أسود للملاحظات",
			"description": "انشر 70000 ملاحظة"
		},
		"_notes80000": {
			"title": "مجرة ملاحظات",
			"description": "انشر 80000 ملاحظة"
		},
		"_notes90000": {
			"title": "كوْن ملاحظات",
			"description": "انشر 90000 ملاحظة"
		},
		"_notes100000": {
			"title": "كل ملاحظاتك لنا",
			"description": "انشر 100000 ملاحظة",
			"flavor": "حقًا لديك الكثير من القصص"
		},
		"_login3": {
			"title": "مبتدأ I",
			"description": "Log in for a total of 3 days",
			"flavor": "Starting today, just call me Misskist"
		},
		"_login7": {
			"title": "Beginner II",
			"description": "Log in for a total of 7 days",
			"flavor": "Feel like you've gotten the hang of things yet?"
		},
		"_login15": {
			"title": "Beginner III",
			"description": "Log in for a total of 15 days"
		},
		"_login30": {
			"title": "Misskist I",
			"description": "Log in for a total of 30 days"
		},
		"_login60": {
			"title": "Misskist II",
			"description": "Log in for a total of 60 days"
		},
		"_login100": {
			"title": "Misskist III",
			"description": "Log in for a total of 100 days",
			"flavor": "Violent Misskist"
		},
		"_login200": {
			"title": "Regular I",
			"description": "Log in for a total of 200 days"
		},
		"_login300": {
			"title": "Regular II",
			"description": "Log in for a total of 300 days"
		},
		"_login400": {
			"title": "Regular III",
			"description": "Log in for a total of 400 days"
		},
		"_login500": {
			"title": "Expert I",
			"description": "Log in for a total of 500 days",
			"flavor": "My friends, it has often been said that I like notes"
		},
		"_login600": {
			"title": "Expert II",
			"description": "Log in for a total of 600 days"
		},
		"_login700": {
			"title": "Expert III",
			"description": "Log in for a total of 700 days"
		},
		"_login800": {
			"title": "Master of Notes I",
			"description": "Log in for a total of 800 days"
		},
		"_login900": {
			"title": "Master of Notes II",
			"description": "Log in for a total of 900 days"
		},
		"_login1000": {
			"title": "Master of Notes III",
			"description": "Log in for a total of 1,000 days",
			"flavor": "Thank you for using Misskey!"
		},
		"_noteClipped1": {
			"title": "Must... clip...",
			"description": "Clip your first note"
		},
		"_noteFavorited1": {
			"title": "Stargazer",
			"description": "فضًِل ملاحظتك الأولى"
		},
		"_myNoteFavorited1": {
			"title": "ساعٍ للنجوم",
			"description": "أعجب شخص آخر بإحدى ملاحظاتك"
		},
		"_profileFilled": {
			"title": "مستعد",
			"description": "أعدّ حسابك"
		},
		"_markedAsCat": {
			"title": "أنا قط",
			"description": "Mark your account as a cat",
			"flavor": "I'll give you a name later."
		},
		"_following1": {
			"title": "Following your first user",
			"description": "Follow a user"
		},
		"_following10": {
			"title": "Keep up... keep up...",
			"description": "Follow 10 users"
		},
		"_following50": {
			"title": "Lots of friends",
			"description": "Follow 50 accounts"
		},
		"_following100": {
			"title": "100 Friends",
			"description": "Follow 100 accounts"
		},
		"_following300": {
			"title": "Friend overload",
			"description": "Follow 300 accounts"
		},
		"_followers1": {
			"title": "First follower",
			"description": "Gain 1 follower"
		},
		"_followers10": {
			"title": "Follow me!",
			"description": "Gain 10 followers"
		},
		"_followers50": {
			"title": "Coming in crowds",
			"description": "Gain 50 followers"
		},
		"_followers100": {
			"title": "Popular",
			"description": "Gain 100 followers"
		},
		"_followers300": {
			"title": "Please form a single line",
			"description": "Gain 300 followers"
		},
		"_followers500": {
			"title": "Radio Tower",
			"description": "Gain 500 followers"
		},
		"_followers1000": {
			"title": "Influencer",
			"description": "Gain 1,000 followers"
		},
		"_collectAchievements30": {
			"title": "Achievement Collector",
			"description": "Earn 30 achievements"
		},
		"_viewAchievements3min": {
			"title": "Likes Achievements",
			"description": "Look at your list of achievements for at least 3 minutes"
		},
		"_iLoveMisskey": {
			"title": "I Love Misskey",
			"description": "Post \"I ❤ #Misskey\"",
			"flavor": "Misskey's development team greatly appreciates your support!"
		},
		"_foundTreasure": {
			"title": "Treasure Hunt",
			"description": "You've found the hidden treasure"
		},
		"_client30min": {
			"title": "Short break",
			"description": "Keep Misskey opened for at least 30 minutes"
		},
		"_client60min": {
			"title": "No \"Miss\" in Misskey",
			"description": "Keep Misskey opened for at least 60 minutes"
		},
		"_noteDeletedWithin1min": {
			"title": "Nevermind",
			"description": "Delete a note within a minute of posting it"
		},
		"_postedAtLateNight": {
			"title": "Nocturnal",
			"description": "Post a note late at night",
			"flavor": "It's about time to go to bed."
		},
		"_postedAt0min0sec": {
			"title": "Speaking Clock",
			"description": "Post a note at 00:00",
			"flavor": "Click Click Click Claaang"
		},
		"_selfQuote": {
			"title": "Self-Reference",
			"description": "Quote your own note"
		},
		"_htl20npm": {
			"title": "Flowing Timeline",
			"description": "Have the speed of your home timeline exceed 20 npm (notes per minute)"
		},
		"_viewInstanceChart": {
			"title": "Analyst",
			"description": "View your instance's charts"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "Output \"hello world\" in the Scratchpad"
		},
		"_open3windows": {
			"title": "Multi-Window",
			"description": "Have at least 3 windows open at the same time"
		},
		"_driveFolderCircularReference": {
			"title": "Circular Reference",
			"description": "Attempt to create a recursively nested folder in Drive"
		},
		"_reactWithoutRead": {
			"title": "Did you really read that?",
			"description": "React on a note that's over 100 characters long within 3 seconds of it being posted"
		},
		"_clickedClickHere": {
			"title": "Click here",
			"description": "You've clicked here"
		},
		"_justPlainLucky": {
			"title": "Just Plain Lucky",
			"description": "Has a chance to be obtained with a probability of 0.005% every 10 seconds"
		},
		"_setNameToSyuilo": {
			"title": "God Complex",
			"description": "Set your name to \"syuilo\""
		},
		"_passedSinceAccountCreated1": {
			"title": "One Year Anniversary",
			"description": "One year has passed since your account was created"
		},
		"_passedSinceAccountCreated2": {
			"title": "Two Year Anniversary",
			"description": "Two years have passed since your account was created"
		},
		"_passedSinceAccountCreated3": {
			"title": "Three Year Anniversary",
			"description": "Three years have passed since your account was created"
		},
		"_loggedInOnBirthday": {
			"title": "Happy Birthday",
			"description": "Log in on your birthday"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Happy New Year!",
			"description": "Logged in on the first day of the year",
			"flavor": "To another great year on this instance"
		},
		"_cookieClicked": {
			"title": "A game in which you click cookies",
			"description": "Clicked the cookie",
			"flavor": "Wait, are you on the correct website?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Post the link to Brain Diver",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Test overflow",
			"description": "Trigger the notification test repeatedly within an extremely short time"
		},
		"_tutorialCompleted": {
			"title": "Misskey Elementary Course Diploma",
			"description": "Tutorial completed"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "The biggest object in the bubble game"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Double🤯",
			"description": "Two of the biggest objects in the bubble game at the same time",
			"flavor": "You can fill a lunch box like this 🤯 🤯 a bit."
		}
	},
	"showFile": "Show files",
	"notificationCreateTokenDescription": "If you did not create this, delete it in \"{text}\".",
	"manageAccessTokens": "إدارة رموز الوصول",
	"youGotNewFollower": "يتابعك",
	"followRequestAccepted": "قُبل طلب المتابعة",
	"receiveFollowRequest": "تلقيت طلب متابعة",
	"accept": "السماح",
	"reject": "رفض",
	"notificationNotificationWillBeDisplayedLikeThis": "Notifications look like this",
	"antennas": "الهوائيات",
	"blockedUsers": "الحسابات المحجوبة",
	"clips": "مشابك",
	"customEmojis": "إيموجي مخصص",
	"favorites": "المفضلات",
	"following": "المتابَعون",
	"mutedUsers": "الحسابات المكتومة",
	"notes": "الملاحظات",
	"lists": "القوائم"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"notificationPollEnded": "Ja pots veure els resultats de l'enquesta ",
	"notificationScheduledNotePosted": "Una nota programada ha sigut publicada",
	"notificationScheduledNotePostFailed": "Ha fallat la publicació d'una nota programada",
	"notificationNewNote": "Nota nova",
	"notificationRoleAssigned": "Rol assignat ",
	"notificationChatRoomInvitationReceived": "T'han invitat a una sala de xat",
	"notificationAchievementEarned": "Aconseguiment desblocat",
	"notificationLogin": "Algú ha iniciat sessió ",
	"notificationCreateToken": "Token d'accés generat",
	"notificationTestNotification": "Notificació de prova",
	"notificationExportOfXCompleted": "Completada l'exportació de {x}",
	"notificationLikedBySomeUsers": "A {n} usuaris els hi agrada la teva nota",
	"notificationReactedBySomeUsers": "Han reaccionat {n} usuaris",
	"notificationRenotedBySomeUsers": "L'han impulsat {n} usuaris",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "Aquí, configurant el meu msky",
			"description": "Publica la teva primera Nota",
			"flavor": "Passa-t'ho bé fent servir Miskey!"
		},
		"_notes10": {
			"title": "Algunes notes",
			"description": "Publica 10 notes"
		},
		"_notes100": {
			"title": "Un piló de notes",
			"description": "Publica 100 notes"
		},
		"_notes500": {
			"title": "Cobert de notes",
			"description": "Publica 500 notes"
		},
		"_notes1000": {
			"title": "Un piló de notes",
			"description": "1 000 notes publicades"
		},
		"_notes5000": {
			"title": "Desbordament de notes",
			"description": "5 000 notes publicades"
		},
		"_notes10000": {
			"title": "Supernota",
			"description": "10 000 notes publicades"
		},
		"_notes20000": {
			"title": "Necessito... Més... Notes!",
			"description": "20 000 notes publicades"
		},
		"_notes30000": {
			"title": "Notes notes notes!",
			"description": "30 000 notes publicades"
		},
		"_notes40000": {
			"title": "Fàbrica de notes",
			"description": "40 000 notes publicades"
		},
		"_notes50000": {
			"title": "Planeta de notes",
			"description": "50 000 notes publicades"
		},
		"_notes60000": {
			"title": "Quàsar de notes",
			"description": "60 000 notes publicades"
		},
		"_notes70000": {
			"title": "Forat negre de notes",
			"description": "70 000 notes publicades"
		},
		"_notes80000": {
			"title": "Galàxia de notes",
			"description": "80 000 notes publicades"
		},
		"_notes90000": {
			"title": "Univers de notes",
			"description": "90 000 notes publicades"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "100 000 notes publicades",
			"flavor": "Segur que tens moltes coses a dir?"
		},
		"_login3": {
			"title": "Principiant I",
			"description": "Vas iniciar sessió fa tres dies",
			"flavor": "Des d'avui diguem Misskist"
		},
		"_login7": {
			"title": "Principiant II",
			"description": "Vas iniciar sessió fa set dies",
			"flavor": "Ja saps com va funcionant tot?"
		},
		"_login15": {
			"title": "Principiant III",
			"description": "Vas iniciar sessió fa quinze dies"
		},
		"_login30": {
			"title": "Misskist I",
			"description": "Vas iniciar sessió fa trenta dies"
		},
		"_login60": {
			"title": "Misskist II",
			"description": "Vas iniciar sessió fa seixanta dies"
		},
		"_login100": {
			"title": "Misskist III",
			"description": "Vas iniciar sessió fa cent dies",
			"flavor": "Misskist violent"
		},
		"_login200": {
			"title": "Regular I",
			"description": "Vas iniciar sessió fa dos-cents dies"
		},
		"_login300": {
			"title": "Regular II",
			"description": "Vas iniciar sessió fa tres-cents dies"
		},
		"_login400": {
			"title": "Regular III",
			"description": "Vas iniciar sessió fa quatre-cents dies"
		},
		"_login500": {
			"title": "Expert I",
			"description": "Vas iniciar sessió fa cinc-cents dies",
			"flavor": "Amics, he dit massa vegades que soc un amant de les notes"
		},
		"_login600": {
			"title": "Expert II",
			"description": "Vas iniciar sessió fa sis-cents dies"
		},
		"_login700": {
			"title": "Expert III",
			"description": "Vas iniciar sessió fa set-cents dies"
		},
		"_login800": {
			"title": "Mestre de les Notes I",
			"description": "Vas iniciar sessió fa vuit-cents dies "
		},
		"_login900": {
			"title": "Mestre de les Notes II",
			"description": "Vas iniciar sessió fa nou-cents dies"
		},
		"_login1000": {
			"title": "Mestre de les Notes III",
			"description": "Vas iniciar sessió fa mil dies",
			"flavor": "Gràcies per fer servir MissKey!"
		},
		"_noteClipped1": {
			"title": "He de retallar-te!",
			"description": "Retalla la teva primera nota"
		},
		"_noteFavorited1": {
			"title": "Quan miro les estrelles",
			"description": "La primera vegada que vaig registrar el meu favorit"
		},
		"_myNoteFavorited1": {
			"title": "Vull una estrella",
			"description": "La meva nota va ser registrada com favorita per una de les altres persones"
		},
		"_profileFilled": {
			"title": "Estic a punt",
			"description": "Vaig fer la configuració de perfil"
		},
		"_markedAsCat": {
			"title": "Soc un gat",
			"description": "He establert el meu compte com si fos un Gat",
			"flavor": "Encara no tinc nom"
		},
		"_following1": {
			"title": "És el meu primer seguiment",
			"description": "És la primera vegada que et segueixo"
		},
		"_following10": {
			"title": "Segueix-me... Segueix-me...",
			"description": "Seguir 10 usuaris"
		},
		"_following50": {
			"title": "Molts amics",
			"description": "Seguir 50 comptes"
		},
		"_following100": {
			"title": "100 amics",
			"description": "Segueixes 100 comptes"
		},
		"_following300": {
			"title": "Sobrecàrrega d'amics",
			"description": "Segueixes 300 comptes"
		},
		"_followers1": {
			"title": "Primer seguidor",
			"description": "1 seguidor guanyat"
		},
		"_followers10": {
			"title": "Segueix-me!",
			"description": "10 seguidors guanyats"
		},
		"_followers50": {
			"title": "Venen en manada",
			"description": "50 seguidors guanyats"
		},
		"_followers100": {
			"title": "Popular",
			"description": "100 seguidors guanyats"
		},
		"_followers300": {
			"title": "Si us plau, d'un en un!",
			"description": "300 seguidors guanyats"
		},
		"_followers500": {
			"title": "Torre de ràdio",
			"description": "500 seguidors guanyats"
		},
		"_followers1000": {
			"title": "Influenciador",
			"description": "1 000 seguidors guanyats"
		},
		"_collectAchievements30": {
			"title": "Col·leccionista d'èxits ",
			"description": "Desbloqueja 30 assoliments"
		},
		"_viewAchievements3min": {
			"title": "M'agraden els èxits ",
			"description": "Mira la teva llista d'assoliments durant més de 3 minuts"
		},
		"_iLoveMisskey": {
			"title": "Estimo Misskey",
			"description": "Publica \"I ❤ #Misskey\"",
			"flavor": "L'equip de desenvolupament de Misskey agraeix el vostre suport!"
		},
		"_foundTreasure": {
			"title": "A la Recerca del Tresor",
			"description": "Has trobat el tresor amagat"
		},
		"_client30min": {
			"title": "Parem una estona",
			"description": "Mantingues obert Misskey per 30 minuts"
		},
		"_client60min": {
			"title": "A totes amb Misskey",
			"description": "Mantingues Misskey obert per 60 minuts"
		},
		"_noteDeletedWithin1min": {
			"title": "No et preocupis",
			"description": "Esborra una nota al minut de publicar-la"
		},
		"_postedAtLateNight": {
			"title": "Nocturn",
			"description": "Publica una nota a altes hores de la nit ",
			"flavor": "És hora d'anar a dormir."
		},
		"_postedAt0min0sec": {
			"title": "Rellotge xerraire",
			"description": "Publica una nota a les 0:00",
			"flavor": "Tic tac, tic tac, tic tac, DING!"
		},
		"_selfQuote": {
			"title": "Autoreferència ",
			"description": "Cita una nota teva"
		},
		"_htl20npm": {
			"title": "Línia de temps fluida",
			"description": "La teva línia de temps va a més de 20npm (notes per minut)"
		},
		"_viewInstanceChart": {
			"title": "Analista ",
			"description": "Mira els gràfics de la teva instància "
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hola, món!",
			"description": "Escriu \"hola, món\" al bloc de notes"
		},
		"_open3windows": {
			"title": "Multi finestres",
			"description": "I va obrir més de tres finestres"
		},
		"_driveFolderCircularReference": {
			"title": "Consulteu la secció de bucle",
			"description": "Intenta crear carpetes recursives al Disc"
		},
		"_reactWithoutRead": {
			"title": "De veritat has llegit això?",
			"description": "Reaccions a una nota de més de 100 caràcters publicada fa menys de 3 segons "
		},
		"_clickedClickHere": {
			"title": "Fer clic",
			"description": "Has fet clic aquí "
		},
		"_justPlainLucky": {
			"title": "Ha sigut sort",
			"description": "Oportunitat de guanyar-lo amb una probabilitat d'un 0.005% cada 10 segons"
		},
		"_setNameToSyuilo": {
			"title": "soc millor",
			"description": "Posat \"siuylo\" com a nom"
		},
		"_passedSinceAccountCreated1": {
			"title": "Primer aniversari",
			"description": "Ja ha passat un any d'ençà que vas crear el teu compte"
		},
		"_passedSinceAccountCreated2": {
			"title": "Segon aniversari",
			"description": "Ja han passat dos anys d'ençà que vas crear el teu compte"
		},
		"_passedSinceAccountCreated3": {
			"title": "Tres anys",
			"description": "Ja han passat tres anys d'ençà que vas crear el teu compte"
		},
		"_loggedInOnBirthday": {
			"title": "Felicitats!",
			"description": "T'has identificat el dia del teu aniversari"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Bon any nou!",
			"description": "T'has identificat el primer dia de l'any ",
			"flavor": "A per un altre any memorable a la teva instància   "
		},
		"_cookieClicked": {
			"title": "Un joc en què fas clic a les galetes",
			"description": "Pica galetes",
			"flavor": "Espera, ets al lloc web correcte?"
		},
		"_brainDiver": {
			"title": "Busseja Ments",
			"description": "Publica un enllaç al Busseja Ments",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Sobrecàrrega de proves",
			"description": "Envia moltes notificacions de prova en un període de temps molt curt"
		},
		"_tutorialCompleted": {
			"title": "Diploma del Curs Elemental de Misskey",
			"description": "Has completat el tutorial"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "L'objecte més gran del joc de la bombolla "
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Doble 🤯",
			"description": "Dos dels objectes més grans del joc de la bombolla al mateix temps",
			"flavor": "Pots emplenar una carmanyola com aquesta 🤯🤯 una mica"
		}
	},
	"showFile": "Mostrar fitxer",
	"notificationCreateTokenDescription": "Si no saps què és, esborra el token des de {text}.",
	"manageAccessTokens": "Administrar claus de seguretat d'accés ",
	"youGotNewFollower": "t'ha seguit",
	"followRequestAccepted": "Sol·licitud de seguiment acceptada",
	"receiveFollowRequest": "Has rebut una sol·licitud de seguiment",
	"accept": "Acceptar",
	"reject": "Denega",
	"notificationNotificationWillBeDisplayedLikeThis": "Les notificacions és veure'n així ",
	"antennas": "Antena",
	"blockedUsers": "Usuaris bloquejats",
	"clips": "Retalls",
	"customEmojis": "Emojis personalitzats",
	"favorites": "Favorits",
	"following": "Segueixes ",
	"mutedUsers": "Usuaris silenciats",
	"notes": "Notes",
	"lists": "Llistes"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"notificationPollEnded": "Výsledky ankety jsou k dispozici",
	"notificationScheduledNotePosted": "Scheduled note has been posted",
	"notificationScheduledNotePostFailed": "Failed to post scheduled note",
	"notificationNewNote": "New note",
	"notificationRoleAssigned": "Role given",
	"notificationChatRoomInvitationReceived": "You have been invited to a chat room",
	"notificationAchievementEarned": "Úspěch odemčen",
	"notificationLogin": "Someone logged in",
	"notificationCreateToken": "An access token has been created",
	"notificationTestNotification": "Test notification",
	"notificationExportOfXCompleted": "Export of {x} has been completed",
	"notificationLikedBySomeUsers": "{n} users liked your note",
	"notificationReactedBySomeUsers": "{n} users reacted",
	"notificationRenotedBySomeUsers": "Renote from {n} users",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "Dobrý den Misskey!",
			"description": "Zveřejněte vaší první poznámku",
			"flavor": "Užijte si to s Misskey!"
		},
		"_notes10": {
			"title": "Pár poznámek",
			"description": "Zveřejněte 10 poznámek"
		},
		"_notes100": {
			"title": "Hodně poznámek",
			"description": "Zveřejněte 100 poznámek"
		},
		"_notes500": {
			"title": "Zahlcen poznámkama",
			"description": "Zveřejněte 500 poznámek"
		},
		"_notes1000": {
			"title": "Hora poznámek",
			"description": "Zveřejněte 1000 poznámek"
		},
		"_notes5000": {
			"title": "Přetékající poznámky",
			"description": "Zveřejněte 5000 poznámek"
		},
		"_notes10000": {
			"title": "Super poznámka",
			"description": "Zveřejněte 10 000 poznámek"
		},
		"_notes20000": {
			"title": "Potřebuju... více... poznámek...",
			"description": "Zveřejněte 20 000 poznámek"
		},
		"_notes30000": {
			"title": "Poznámky, poznámky, POZNÁMKY!",
			"description": "Zveřejněte 30 000 poznámek"
		},
		"_notes40000": {
			"title": "Továrna na poznámky",
			"description": "Zveřejněte 40 000 poznámek"
		},
		"_notes50000": {
			"title": "Planeta poznámek",
			"description": "Zveřejněte 50 000 poznámek"
		},
		"_notes60000": {
			"title": "Poznámkový kvasar",
			"description": "Zveřejněte 60 000 poznámek"
		},
		"_notes70000": {
			"title": "Černá díra poznámek",
			"description": "Zveřejněte 70 000 poznámek"
		},
		"_notes80000": {
			"title": "Galaxie poznámek",
			"description": "Zveřejněte 80 000 poznámek"
		},
		"_notes90000": {
			"title": "Vesmír poznámek",
			"description": "Zveřejněte 90 000 poznámek"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "Zveřejněte 100 000 poznámek",
			"flavor": "Máte toho hodně co říct."
		},
		"_login3": {
			"title": "Začátečník I",
			"description": "Přihlaste se celkově za 3 dny",
			"flavor": "Ode dneška mi říkejte Misskista."
		},
		"_login7": {
			"title": "Začátečník II",
			"description": "Přihlaste se celkově za 7 dní",
			"flavor": "Máte pocit, že už jste se v tom vyznali?"
		},
		"_login15": {
			"title": "Začátečník III",
			"description": "Přihlaste se celkově za 15 dní"
		},
		"_login30": {
			"title": "Misskista I",
			"description": "Přihlaste se celkově za 30 dní"
		},
		"_login60": {
			"title": "Misskista II",
			"description": "Přihlaste se celkově za 60 dní"
		},
		"_login100": {
			"title": "Misskista III",
			"description": "Přihlaste se celkově za 100 dní",
			"flavor": "Violent Misskista"
		},
		"_login200": {
			"title": "Stálý zákazník I",
			"description": "Přihlaste se celkově za 200 dní"
		},
		"_login300": {
			"title": "Stálý zákazník II",
			"description": "Přihlaste se celkově za 300 dní"
		},
		"_login400": {
			"title": "Stálý zákazník III",
			"description": "Přihlaste se celkově za 400 dní"
		},
		"_login500": {
			"title": "Expert I",
			"description": "Přihlaste se celkově za 500 dní",
			"flavor": "Moji přátelé, často se říká, že mám rád poznámky."
		},
		"_login600": {
			"title": "Expert II",
			"description": "Přihlaste se celkově za 600 dní"
		},
		"_login700": {
			"title": "Expert III",
			"description": "Přihlaste se celkově za 700 dní"
		},
		"_login800": {
			"title": "Mistr poznámek I",
			"description": "Přihlaste se celkově za 800 dní"
		},
		"_login900": {
			"title": "Mistr poznámek II",
			"description": "Přihlaste se celkově za 900 dní"
		},
		"_login1000": {
			"title": "Mistr poznámek III",
			"description": "Přihlaste se celkově za 1000 dní",
			"flavor": "Děkujeme, že používáte Misskey!"
		},
		"_noteClipped1": {
			"title": "Musím... připnout...",
			"description": "Připněte si první poznámku"
		},
		"_noteFavorited1": {
			"title": "Hvězdář",
			"description": "Oblíbena první poznámka"
		},
		"_myNoteFavorited1": {
			"title": "Hledání hvězd",
			"description": "Někdo si oblíbil jednu z vašich poznámek"
		},
		"_profileFilled": {
			"title": "Dobře připravený",
			"description": "Nastavte si profil"
		},
		"_markedAsCat": {
			"title": "Já jsem kočka",
			"description": "Označte váš účet \"jako kočka\"",
			"flavor": "Jméno ti dám později."
		},
		"_following1": {
			"title": "Sledujte prvního uživatele",
			"description": "Sledujte uživatele"
		},
		"_following10": {
			"title": "Drž se... drž se...",
			"description": "Sledujte 10 uživatelů"
		},
		"_following50": {
			"title": "Hodně přátel",
			"description": "Sledujte 50 uživatelů"
		},
		"_following100": {
			"title": "100 přátel",
			"description": "Sledujte 100 uživatelů"
		},
		"_following300": {
			"title": "Přetížení přátel",
			"description": "Sledujte 300 účtů"
		},
		"_followers1": {
			"title": "První sledující",
			"description": "Získejte 1 sledujícího"
		},
		"_followers10": {
			"title": "Sledujte mě!",
			"description": "Získejte 10 sledujících"
		},
		"_followers50": {
			"title": "Přicházejí davy",
			"description": "Získejte 50 sledujících"
		},
		"_followers100": {
			"title": "Populární",
			"description": "Získejte 100 sledujících"
		},
		"_followers300": {
			"title": "Prosíme srovnejte se do jedné řady!",
			"description": "Získejte 300 sledujících"
		},
		"_followers500": {
			"title": "Rádiová věž",
			"description": "Získejte 500 sledujících"
		},
		"_followers1000": {
			"title": "Influencer",
			"description": "Získejte 1000 sledujících"
		},
		"_collectAchievements30": {
			"title": "Sběratel úspěchů",
			"description": "Získejte 30 úspěchů"
		},
		"_viewAchievements3min": {
			"title": "Máš rád úspěchy",
			"description": "Koukejte na váš seznam úspěchů alespoň po dobu 3 minut"
		},
		"_iLoveMisskey": {
			"title": "Miluju Misskey",
			"description": "Zveřejněte \" I ❤ #Misskey\"",
			"flavor": "Vývojový tým Misskey si velmi váží vaší podpory!"
		},
		"_foundTreasure": {
			"title": "Hon za pokladem",
			"description": "Našli jste schovaný poklad!"
		},
		"_client30min": {
			"title": "Krátká pauza",
			"description": "Mějte otevřený Misskey alespoň po dobu 30 minut"
		},
		"_client60min": {
			"title": "Žádný \"Miss\" v Misskey",
			"description": "Mějte otevřený Misskey alespoň po dobu 60 minut"
		},
		"_noteDeletedWithin1min": {
			"title": "Ups, nevadí",
			"description": "Vymažte poznámku během minuty co ji zveřejníte"
		},
		"_postedAtLateNight": {
			"title": "Noční typ",
			"description": "Zveřejněte poznámku pozdě v noci",
			"flavor": "Je nejvyšší čas jít spát."
		},
		"_postedAt0min0sec": {
			"title": "Mluvící hodiny",
			"description": "Zveřejněte poznámku přesně v 00:00",
			"flavor": "Klik Klik Klik Bum"
		},
		"_selfQuote": {
			"title": "Sebereference",
			"description": "Citujte vlastní poznámku"
		},
		"_htl20npm": {
			"title": "Plynoucí časová osa",
			"description": "Mějte rychlost vaší domovské časové osy vyšší než 20 pzm (poznámek za minutu)."
		},
		"_viewInstanceChart": {
			"title": "Analytik",
			"description": "Zobrazte graf instance"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "Dostaňte výpis \"hello world\" do Scratchpadu"
		},
		"_open3windows": {
			"title": "Splitscreen",
			"description": "Mějte otevřená alespoň 3 okna zároveň"
		},
		"_driveFolderCircularReference": {
			"title": "Okružní reference",
			"description": "Pokuste se o vytvoření rekurzivně vnořené složky v disku"
		},
		"_reactWithoutRead": {
			"title": "Opravdu jste to četl/a?",
			"description": "Reagujte na poznámku, která má více než 100 znaků, do 3 sekund od jejího zveřejnění."
		},
		"_clickedClickHere": {
			"title": "Klikněte sem",
			"description": "Kliknul si tam"
		},
		"_justPlainLucky": {
			"title": "Čisté štěstí",
			"description": "Mějte šanci na získání s pravděpodobností 0,005 % každých 10 sekund."
		},
		"_setNameToSyuilo": {
			"title": "Boží komplex",
			"description": "Nastavte si jméno na \"syuilo\""
		},
		"_passedSinceAccountCreated1": {
			"title": "Roční výročí",
			"description": "Od vytvoření vašeho účtu uplynul jeden rok"
		},
		"_passedSinceAccountCreated2": {
			"title": "Dvouleté výročí",
			"description": "Od vytvoření vašeho účtu uplynuly dva roky"
		},
		"_passedSinceAccountCreated3": {
			"title": "Tříleté výročí",
			"description": "Od vytvoření vašeho účtu uplynuly tři roky"
		},
		"_loggedInOnBirthday": {
			"title": "Všechno nejlepší!",
			"description": "Přihlašte se v den vašich narozenin"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Štastný nový rok!",
			"description": "Přihlašte se v den nového roku",
			"flavor": "Na další skvělý rok v této instanci"
		},
		"_cookieClicked": {
			"title": "Hra, ve které klikáte na sušenky",
			"description": "Klikněte na soubor cookie",
			"flavor": "Počkejte, jste na správné webové stránce?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Zveřejněte odkaz na Brain Diver",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Test overflow",
			"description": "Trigger the notification test repeatedly within an extremely short time"
		},
		"_tutorialCompleted": {
			"title": "Misskey Elementary Course Diploma",
			"description": "Tutorial completed"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "The biggest object in the bubble game"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Double🤯",
			"description": "Two of the biggest objects in the bubble game at the same time",
			"flavor": "You can fill a lunch box like this 🤯 🤯 a bit."
		}
	},
	"showFile": "Procházet soubory",
	"notificationCreateTokenDescription": "If you did not create this, delete it in \"{text}\".",
	"manageAccessTokens": "Spravovat přístupové tokeny",
	"youGotNewFollower": "Máte nového následovníka",
	"followRequestAccepted": "Žádost o sledování přijata",
	"receiveFollowRequest": "Žádost o sledování přijata",
	"accept": "Souhlasím",
	"reject": "Odmítnout",
	"notificationNotificationWillBeDisplayedLikeThis": "Notifications look like this",
	"antennas": "Antény",
	"blockedUsers": "Blokovaní uživatelé",
	"clips": "Oříznout",
	"customEmojis": "Vlastní emoji",
	"favorites": "Oblíbené",
	"following": "Sledovaní",
	"mutedUsers": "Zltumení uživatelé",
	"notes": "Poznámky",
	"lists": "Seznamy"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"notificationPollEnded": "Poll results have become available",
	"notificationScheduledNotePosted": "Scheduled note has been posted",
	"notificationScheduledNotePostFailed": "Failed to post scheduled note",
	"notificationNewNote": "New note",
	"notificationRoleAssigned": "Role given",
	"notificationChatRoomInvitationReceived": "You have been invited to a chat room",
	"notificationAchievementEarned": "Achievement unlocked",
	"notificationLogin": "Someone logged in",
	"notificationCreateToken": "An access token has been created",
	"notificationTestNotification": "Test notification",
	"notificationExportOfXCompleted": "Export of {x} has been completed",
	"notificationLikedBySomeUsers": "{n} users liked your note",
	"notificationReactedBySomeUsers": "{n} users reacted",
	"notificationRenotedBySomeUsers": "Renote from {n} users",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "just setting up my msky",
			"description": "Post your first note",
			"flavor": "Have a good time with Misskey!"
		},
		"_notes10": {
			"title": "Some notes",
			"description": "Post 10 notes"
		},
		"_notes100": {
			"title": "A lot of notes",
			"description": "Post 100 notes"
		},
		"_notes500": {
			"title": "Covered in notes",
			"description": "Post 500 notes"
		},
		"_notes1000": {
			"title": "A mountain of notes",
			"description": "Post 1,000 notes"
		},
		"_notes5000": {
			"title": "Overflowing notes",
			"description": "Post 5,000 notes"
		},
		"_notes10000": {
			"title": "Supernote",
			"description": "Post 10,000 notes"
		},
		"_notes20000": {
			"title": "Need... more... notes...",
			"description": "Post 20,000 notes"
		},
		"_notes30000": {
			"title": "Notes notes notes!",
			"description": "Post 30,000 notes"
		},
		"_notes40000": {
			"title": "Note factory",
			"description": "Post 40,000 notes"
		},
		"_notes50000": {
			"title": "Planet of notes",
			"description": "Post 50,000 notes"
		},
		"_notes60000": {
			"title": "Note quasar",
			"description": "Post 60,000 notes"
		},
		"_notes70000": {
			"title": "Note black hole",
			"description": "Post 70,000 notes"
		},
		"_notes80000": {
			"title": "Note galaxy",
			"description": "Post 80,000 notes"
		},
		"_notes90000": {
			"title": "Note universe",
			"description": "Post 90,000 notes"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "Post 100,000 notes",
			"flavor": "You sure have a lot to say."
		},
		"_login3": {
			"title": "Beginner I",
			"description": "Log in for a total of 3 days",
			"flavor": "Starting today, just call me Misskist"
		},
		"_login7": {
			"title": "Beginner II",
			"description": "Log in for a total of 7 days",
			"flavor": "Feel like you've gotten the hang of things yet?"
		},
		"_login15": {
			"title": "Beginner III",
			"description": "Log in for a total of 15 days"
		},
		"_login30": {
			"title": "Misskist I",
			"description": "Log in for a total of 30 days"
		},
		"_login60": {
			"title": "Misskist II",
			"description": "Log in for a total of 60 days"
		},
		"_login100": {
			"title": "Misskist III",
			"description": "Log in for a total of 100 days",
			"flavor": "Violent Misskist"
		},
		"_login200": {
			"title": "Regular I",
			"description": "Log in for a total of 200 days"
		},
		"_login300": {
			"title": "Regular II",
			"description": "Log in for a total of 300 days"
		},
		"_login400": {
			"title": "Regular III",
			"description": "Log in for a total of 400 days"
		},
		"_login500": {
			"title": "Expert I",
			"description": "Log in for a total of 500 days",
			"flavor": "My friends, it has often been said that I like notes"
		},
		"_login600": {
			"title": "Expert II",
			"description": "Log in for a total of 600 days"
		},
		"_login700": {
			"title": "Expert III",
			"description": "Log in for a total of 700 days"
		},
		"_login800": {
			"title": "Master of Notes I",
			"description": "Log in for a total of 800 days"
		},
		"_login900": {
			"title": "Master of Notes II",
			"description": "Log in for a total of 900 days"
		},
		"_login1000": {
			"title": "Master of Notes III",
			"description": "Log in for a total of 1,000 days",
			"flavor": "Thank you for using Misskey!"
		},
		"_noteClipped1": {
			"title": "Must... clip...",
			"description": "Clip your first note"
		},
		"_noteFavorited1": {
			"title": "Stargazer",
			"description": "Favorite your first note"
		},
		"_myNoteFavorited1": {
			"title": "Seeking Stars",
			"description": "Have somebody else favorite one of your notes"
		},
		"_profileFilled": {
			"title": "Well-prepared",
			"description": "Set up your profile"
		},
		"_markedAsCat": {
			"title": "I Am a Cat",
			"description": "Mark your account as a cat",
			"flavor": "I'll give you a name later."
		},
		"_following1": {
			"title": "Following your first user",
			"description": "Follow a user"
		},
		"_following10": {
			"title": "Keep up... keep up...",
			"description": "Follow 10 users"
		},
		"_following50": {
			"title": "Lots of friends",
			"description": "Follow 50 accounts"
		},
		"_following100": {
			"title": "100 Friends",
			"description": "Follow 100 accounts"
		},
		"_following300": {
			"title": "Friend overload",
			"description": "Follow 300 accounts"
		},
		"_followers1": {
			"title": "First follower",
			"description": "Gain 1 follower"
		},
		"_followers10": {
			"title": "Follow me!",
			"description": "Gain 10 followers"
		},
		"_followers50": {
			"title": "Coming in crowds",
			"description": "Gain 50 followers"
		},
		"_followers100": {
			"title": "Popular",
			"description": "Gain 100 followers"
		},
		"_followers300": {
			"title": "Please form a single line",
			"description": "Gain 300 followers"
		},
		"_followers500": {
			"title": "Radio Tower",
			"description": "Gain 500 followers"
		},
		"_followers1000": {
			"title": "Influencer",
			"description": "Gain 1,000 followers"
		},
		"_collectAchievements30": {
			"title": "Achievement Collector",
			"description": "Earn 30 achievements"
		},
		"_viewAchievements3min": {
			"title": "Likes Achievements",
			"description": "Look at your list of achievements for at least 3 minutes"
		},
		"_iLoveMisskey": {
			"title": "I Love Misskey",
			"description": "Post \"I ❤ #Misskey\"",
			"flavor": "Misskey's development team greatly appreciates your support!"
		},
		"_foundTreasure": {
			"title": "Treasure Hunt",
			"description": "You've found the hidden treasure"
		},
		"_client30min": {
			"title": "Short break",
			"description": "Keep Misskey opened for at least 30 minutes"
		},
		"_client60min": {
			"title": "No \"Miss\" in Misskey",
			"description": "Keep Misskey opened for at least 60 minutes"
		},
		"_noteDeletedWithin1min": {
			"title": "Nevermind",
			"description": "Delete a note within a minute of posting it"
		},
		"_postedAtLateNight": {
			"title": "Nocturnal",
			"description": "Post a note late at night",
			"flavor": "It's about time to go to bed."
		},
		"_postedAt0min0sec": {
			"title": "Speaking Clock",
			"description": "Post a note at 00:00",
			"flavor": "Click Click Click Claaang"
		},
		"_selfQuote": {
			"title": "Self-Reference",
			"description": "Quote your own note"
		},
		"_htl20npm": {
			"title": "Flowing Timeline",
			"description": "Have the speed of your home timeline exceed 20 npm (notes per minute)"
		},
		"_viewInstanceChart": {
			"title": "Analyst",
			"description": "View your instance's charts"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "Output \"hello world\" in the Scratchpad"
		},
		"_open3windows": {
			"title": "Multi-Window",
			"description": "Have at least 3 windows open at the same time"
		},
		"_driveFolderCircularReference": {
			"title": "Circular Reference",
			"description": "Attempt to create a recursively nested folder in Drive"
		},
		"_reactWithoutRead": {
			"title": "Did you really read that?",
			"description": "React on a note that's over 100 characters long within 3 seconds of it being posted"
		},
		"_clickedClickHere": {
			"title": "Click here",
			"description": "You've clicked here"
		},
		"_justPlainLucky": {
			"title": "Just Plain Lucky",
			"description": "Has a chance to be obtained with a probability of 0.005% every 10 seconds"
		},
		"_setNameToSyuilo": {
			"title": "God Complex",
			"description": "Set your name to \"syuilo\""
		},
		"_passedSinceAccountCreated1": {
			"title": "One Year Anniversary",
			"description": "One year has passed since your account was created"
		},
		"_passedSinceAccountCreated2": {
			"title": "Two Year Anniversary",
			"description": "Two years have passed since your account was created"
		},
		"_passedSinceAccountCreated3": {
			"title": "Three Year Anniversary",
			"description": "Three years have passed since your account was created"
		},
		"_loggedInOnBirthday": {
			"title": "Happy Birthday",
			"description": "Log in on your birthday"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Happy New Year!",
			"description": "Logged in on the first day of the year",
			"flavor": "To another great year on this instance"
		},
		"_cookieClicked": {
			"title": "A game in which you click cookies",
			"description": "Clicked the cookie",
			"flavor": "Wait, are you on the correct website?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Post the link to Brain Diver",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Test overflow",
			"description": "Trigger the notification test repeatedly within an extremely short time"
		},
		"_tutorialCompleted": {
			"title": "Misskey Elementary Course Diploma",
			"description": "Tutorial completed"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "The biggest object in the bubble game"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Double🤯",
			"description": "Two of the biggest objects in the bubble game at the same time",
			"flavor": "You can fill a lunch box like this 🤯 🤯 a bit."
		}
	},
	"showFile": "Show files",
	"notificationCreateTokenDescription": "If you did not create this, delete it in \"{text}\".",
	"manageAccessTokens": "Manage access tokens",
	"youGotNewFollower": "followed you",
	"followRequestAccepted": "Follow request accepted",
	"receiveFollowRequest": "Follow request received",
	"accept": "Accept",
	"reject": "Reject",
	"notificationNotificationWillBeDisplayedLikeThis": "Notifications look like this",
	"antennas": "Antennas",
	"blockedUsers": "Blocked users",
	"clips": "Clips",
	"customEmojis": "Custom Emoji",
	"favorites": "Favorites",
	"following": "Following",
	"mutedUsers": "Muted users",
	"notes": "Notes",
	"lists": "Lists"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"notificationPollEnded": "Umfrageergebnisse sind verfügbar",
	"notificationScheduledNotePosted": "Geplante Notiz wurde veröffentlicht",
	"notificationScheduledNotePostFailed": "Veröffentlichen der geplanten Notiz fehlgeschlagen",
	"notificationNewNote": "Neue Notiz",
	"notificationRoleAssigned": "Rolle zugewiesen",
	"notificationChatRoomInvitationReceived": "Du wurdest in einen Chatraum eingeladen",
	"notificationAchievementEarned": "Errungenschaft freigeschaltet",
	"notificationLogin": "Neue Anmeldung erfolgt",
	"notificationCreateToken": "Ein Zugangstoken wurde erstellt",
	"notificationTestNotification": "Testbenachrichtigung",
	"notificationExportOfXCompleted": "Der Export von {x} ist abgeschlossen",
	"notificationLikedBySomeUsers": "{n} Benutzer mochten deine Notiz",
	"notificationReactedBySomeUsers": "{n} Benutzer haben eine Reaktion geschickt",
	"notificationRenotedBySomeUsers": "Renote von {n} Benutzern",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "Hallo Misskey!",
			"description": "Sende deine erste Notiz",
			"flavor": "Hab eine schöne Zeit mit Misskey!"
		},
		"_notes10": {
			"title": "Ein paar Notizen",
			"description": "10 Notizen gesendet"
		},
		"_notes100": {
			"title": "Viele Notizen",
			"description": "100 Notizen gesendet"
		},
		"_notes500": {
			"title": "Überschüttet mit Notizen",
			"description": "500 Notizen gesendet"
		},
		"_notes1000": {
			"title": "Berg an Notizen",
			"description": "1.000 Notizen gesendet"
		},
		"_notes5000": {
			"title": "Überquellende Notizen",
			"description": "5.000 Notizen gesendet"
		},
		"_notes10000": {
			"title": "Supernotiz",
			"description": "10.000 Notizen gesendet"
		},
		"_notes20000": {
			"title": "Brauche... mehr... Notizen...",
			"description": "20.000 Notizen gesendet"
		},
		"_notes30000": {
			"title": "Notizen, Notizen, Notizen",
			"description": "30.000 Notizen gesendet"
		},
		"_notes40000": {
			"title": "Notizfabrik",
			"description": "40.000 Notizen gesendet"
		},
		"_notes50000": {
			"title": "Planet der Notizen",
			"description": "50.000 Notizen gesendet"
		},
		"_notes60000": {
			"title": "Notizquasar",
			"description": "60.000 Notizen gesendet"
		},
		"_notes70000": {
			"title": "Schwarzes Notizloch",
			"description": "70.000 Notizen gesendet"
		},
		"_notes80000": {
			"title": "Notizgalaxie",
			"description": "80.000 Notizen gesendet"
		},
		"_notes90000": {
			"title": "Notizversum",
			"description": "90.000 Notizen gesendet"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "100.000 Notizen gesendet",
			"flavor": "Du hast wirklich viel zu sagen."
		},
		"_login3": {
			"title": "Anfänger Ⅰ",
			"description": "An 3 Tagen eingeloggt",
			"flavor": "Nenn' mich ab heute Misskist"
		},
		"_login7": {
			"title": "Anfänger Ⅱ",
			"description": "An 7 Tagen eingeloggt",
			"flavor": "Na, eingewöht?"
		},
		"_login15": {
			"title": "Anfänger Ⅲ",
			"description": "An 15 Tagen eingeloggt"
		},
		"_login30": {
			"title": "Misskist Ⅰ",
			"description": "An 30 Tagen eingeloggt"
		},
		"_login60": {
			"title": "Misskist Ⅱ",
			"description": "An 60 Tagen eingeloggt"
		},
		"_login100": {
			"title": "Misskist Ⅲ",
			"description": "An 100 Tagen eingeloggt",
			"flavor": "Violent Misskist"
		},
		"_login200": {
			"title": "Stammbesucher Ⅰ",
			"description": "An 200 Tagen eingeloggt"
		},
		"_login300": {
			"title": "Stammbesucher Ⅱ",
			"description": "An 300 Tagen eingeloggt"
		},
		"_login400": {
			"title": "Stammbesucher Ⅲ",
			"description": "An 400 Tagen eingeloggt"
		},
		"_login500": {
			"title": "Veteran Ⅰ",
			"description": "An 500 Tagen eingeloggt",
			"flavor": "Meine Kameraden, ich liebe sie, die Notizen."
		},
		"_login600": {
			"title": "Veteran Ⅱ",
			"description": "An 600 Tagen eingeloggt"
		},
		"_login700": {
			"title": "Veteran Ⅲ",
			"description": "An 700 Tagen eingeloggt"
		},
		"_login800": {
			"title": "Meister der Notizen Ⅰ",
			"description": "An 800 Tagen eingeloggt"
		},
		"_login900": {
			"title": "Meister der Notizen Ⅱ",
			"description": "An 900 Tagen eingeloggt"
		},
		"_login1000": {
			"title": "Meister der Notizen Ⅲ",
			"description": "An 1000 Tagen eingeloggt",
			"flavor": "Danke, dass du Misskey nutzt!"
		},
		"_noteClipped1": {
			"title": "Muss... clippen...",
			"description": "Die erste Notiz geclippt"
		},
		"_noteFavorited1": {
			"title": "Sternengucker",
			"description": "Eine Notiz als Favorit markiert"
		},
		"_myNoteFavorited1": {
			"title": "Sternensucher",
			"description": "Ein anderer Benutzer hat eine deiner Notizen als Favoriten markiert"
		},
		"_profileFilled": {
			"title": "Perfekte Vorbereitung",
			"description": "Fülle dein Profil aus"
		},
		"_markedAsCat": {
			"title": "Ich der Kater",
			"description": "Markiere dein Konto als Katze",
			"flavor": "Einen Namen bekommst du später. "
		},
		"_following1": {
			"title": "Das Folgen beginnt",
			"description": "Du folgst deiner ersten Person"
		},
		"_following10": {
			"title": "Folge ihnen... folge ihnen...",
			"description": "Du folgst über 10 Leuten"
		},
		"_following50": {
			"title": "Viele Freunde",
			"description": "Du folgst über 50 Leuten"
		},
		"_following100": {
			"title": "100 Freunde",
			"description": "Du folgst über 100 Leuten"
		},
		"_following300": {
			"title": "Freundeüberschuss",
			"description": "Du folgst über 300 Leuten"
		},
		"_followers1": {
			"title": "Der erste Follower",
			"description": "Du hast deinen ersten Follower erhalten"
		},
		"_followers10": {
			"title": "Mir nach!",
			"description": "Die Anzahl deiner Follower hat 10 überschritten"
		},
		"_followers50": {
			"title": "Wirrwarr",
			"description": "Die Anzahl deiner Follower hat 50 überschritten"
		},
		"_followers100": {
			"title": "Beliebt",
			"description": "Die Anzahl deiner Follower hat 100 überschritten"
		},
		"_followers300": {
			"title": "Eine geordnete Reihe, bitte!",
			"description": "Die Anzahl deiner Follower hat 300 überschritten"
		},
		"_followers500": {
			"title": "Funkmast",
			"description": "Die Anzahl deiner Follower hat 500 überschritten"
		},
		"_followers1000": {
			"title": "Influencer",
			"description": "Die Anzahl deiner Follower hat 1000 überschritten"
		},
		"_collectAchievements30": {
			"title": "Sammler der Errungenschaften",
			"description": "Schalte 30 Errungenschaften frei"
		},
		"_viewAchievements3min": {
			"title": "Fan von Errungenschaften",
			"description": "Schau dir die Liste deiner Errungenschaften für mindestens 3 Minuten an"
		},
		"_iLoveMisskey": {
			"title": "I Love Misskey",
			"description": "Sende \"I ❤ #Misskey\"",
			"flavor": "Danke, dass du Misskey verwendest! - vom Entwicklerteam"
		},
		"_foundTreasure": {
			"title": "Schatzsuche",
			"description": "Du hast einen verborgenen Schatz gefunden"
		},
		"_client30min": {
			"title": "Kurze Pause",
			"description": "Habe Misskey für mindestens 30 Minuten geöffnet"
		},
		"_client60min": {
			"title": "Munter mit Misskey",
			"description": "Habe Misskey für mindestens 60 Minuten geöffnet"
		},
		"_noteDeletedWithin1min": {
			"title": "Ups",
			"description": "Lösche eine Notiz innerhalb von 1 Minute nachdem sie gesendet wurde"
		},
		"_postedAtLateNight": {
			"title": "Nachtaktiv",
			"description": "Sende mitten in der Nacht eine Notiz",
			"flavor": "Geh bald schlafen."
		},
		"_postedAt0min0sec": {
			"title": "Zeitansage",
			"description": "Sende um 00:00 eine Notiz",
			"flavor": "Klick Klick Klick Dooong"
		},
		"_selfQuote": {
			"title": "Selbstzitat",
			"description": "Zitiere eine eigene Notiz"
		},
		"_htl20npm": {
			"title": "Fließende Chronik",
			"description": "Deine Startseitenchronik erreicht eine Geschwindigkeit von 20 npm (Notizen pro Minute)"
		},
		"_viewInstanceChart": {
			"title": "Analyst",
			"description": "Schau dir die Messwerte der Instanz an"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hallo Welt!",
			"description": "Gib \"hello world\" in der Testumgebung aus"
		},
		"_open3windows": {
			"title": "Splitscreen",
			"description": "Habe zur gleichen Zeit mindestens 3 Fenster offen"
		},
		"_driveFolderCircularReference": {
			"title": "Zyklischer Verweis",
			"description": "Versuche, in Drive einen Zirkelbezug von Ordnern herzustellen"
		},
		"_reactWithoutRead": {
			"title": "Hast du das wirklich gelesen?",
			"description": "Reagiere auf eine Notiz mit mindestens 100 Zeichen innerhalb von 3 Sekunden der Erstellung der Notiz"
		},
		"_clickedClickHere": {
			"title": "Klicke hier",
			"description": "Du hast hier geklickt"
		},
		"_justPlainLucky": {
			"title": "Pures Glück",
			"description": "Kann alle 10 Sekunden mit einer Warscheinlichkeit von 0.005% erhalten werden"
		},
		"_setNameToSyuilo": {
			"title": "Gottkomplex",
			"description": "Setze deinen Namen auf \"syuilo\""
		},
		"_passedSinceAccountCreated1": {
			"title": "Einjahresjubiläum",
			"description": "Seit der Erstellung deines Kontos ist 1 Jahr vergangen"
		},
		"_passedSinceAccountCreated2": {
			"title": "Zweijahresjubiläum",
			"description": "Seit der Erstellung deines Kontos sind 2 Jahre vergangen"
		},
		"_passedSinceAccountCreated3": {
			"title": "Dreijahresjubiläum",
			"description": "Seit der Erstellung deines Kontos sind 3 Jahre vergangen"
		},
		"_loggedInOnBirthday": {
			"title": "Alles Gute Zum Geburtstag",
			"description": "Logge dich an deinem Geburtstag ein"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Frohes Neujahr",
			"description": "Logge dich am Neujahrstag ein",
			"flavor": "Auf ein weiteres tolles Jahr in dieser Instanz"
		},
		"_cookieClicked": {
			"title": "Ein Spiel, in dem du auf einen Keks klickst",
			"description": "Den Keks geklickt",
			"flavor": "Bist du hier richtig?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Sende den Link zu Brain Diver",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Testüberfluss",
			"description": "Betätige den Benachrichtigungstest mehrfach innerhalb einer extrem kurzen Zeitspanne"
		},
		"_tutorialCompleted": {
			"title": "Misskey Grundkurs-Diplom",
			"description": "Tutorial abgeschlossen"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "Das größte Objekt im Bubble Game"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Doppel🤯",
			"description": "Zwei der größten Objekte im Bubble Game zur gleichen Zeit",
			"flavor": "Eine Lunchbox kann man auch mit etwas mehr 🤯 🤯 füllen"
		}
	},
	"showFile": "Datei anzeigen",
	"notificationCreateTokenDescription": "Wenn Sie keine Ahnung haben, löschen Sie das Zugriffstoken über \"{text}\"",
	"manageAccessTokens": "Zugriffstokens verwalten",
	"youGotNewFollower": "ist dir gefolgt",
	"followRequestAccepted": "Follow-Anfrage akzeptiert",
	"receiveFollowRequest": "Follow-Anfrage erhalten",
	"accept": "Akzeptieren",
	"reject": "Ablehnen",
	"notificationNotificationWillBeDisplayedLikeThis": "Benachrichtigungen sehen so aus",
	"antennas": "Antennen",
	"blockedUsers": "Blockierte Benutzer",
	"clips": "Clips",
	"customEmojis": "Benutzerdefinierte Emojis",
	"favorites": "Favoriten",
	"following": "Folgt",
	"mutedUsers": "Stummgeschaltete Benutzer",
	"notes": "Notizen",
	"lists": "Listen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"notificationPollEnded": "Poll results have become available",
	"notificationScheduledNotePosted": "Scheduled note has been posted",
	"notificationScheduledNotePostFailed": "Failed to post scheduled note",
	"notificationNewNote": "New note",
	"notificationRoleAssigned": "Role given",
	"notificationChatRoomInvitationReceived": "You have been invited to a chat room",
	"notificationAchievementEarned": "Achievement unlocked",
	"notificationLogin": "Someone logged in",
	"notificationCreateToken": "An access token has been created",
	"notificationTestNotification": "Test notification",
	"notificationExportOfXCompleted": "Export of {x} has been completed",
	"notificationLikedBySomeUsers": "{n} users liked your note",
	"notificationReactedBySomeUsers": "{n} users reacted",
	"notificationRenotedBySomeUsers": "Renote from {n} users",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "just setting up my msky",
			"description": "Post your first note",
			"flavor": "Have a good time with Misskey!"
		},
		"_notes10": {
			"title": "Some notes",
			"description": "Post 10 notes"
		},
		"_notes100": {
			"title": "A lot of notes",
			"description": "Post 100 notes"
		},
		"_notes500": {
			"title": "Covered in notes",
			"description": "Post 500 notes"
		},
		"_notes1000": {
			"title": "A mountain of notes",
			"description": "Post 1,000 notes"
		},
		"_notes5000": {
			"title": "Overflowing notes",
			"description": "Post 5,000 notes"
		},
		"_notes10000": {
			"title": "Supernote",
			"description": "Post 10,000 notes"
		},
		"_notes20000": {
			"title": "Need... more... notes...",
			"description": "Post 20,000 notes"
		},
		"_notes30000": {
			"title": "Notes notes notes!",
			"description": "Post 30,000 notes"
		},
		"_notes40000": {
			"title": "Note factory",
			"description": "Post 40,000 notes"
		},
		"_notes50000": {
			"title": "Planet of notes",
			"description": "Post 50,000 notes"
		},
		"_notes60000": {
			"title": "Note quasar",
			"description": "Post 60,000 notes"
		},
		"_notes70000": {
			"title": "Note black hole",
			"description": "Post 70,000 notes"
		},
		"_notes80000": {
			"title": "Note galaxy",
			"description": "Post 80,000 notes"
		},
		"_notes90000": {
			"title": "Note universe",
			"description": "Post 90,000 notes"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "Post 100,000 notes",
			"flavor": "You sure have a lot to say."
		},
		"_login3": {
			"title": "Beginner I",
			"description": "Log in for a total of 3 days",
			"flavor": "Starting today, just call me Misskist"
		},
		"_login7": {
			"title": "Beginner II",
			"description": "Log in for a total of 7 days",
			"flavor": "Feel like you've gotten the hang of things yet?"
		},
		"_login15": {
			"title": "Beginner III",
			"description": "Log in for a total of 15 days"
		},
		"_login30": {
			"title": "Misskist I",
			"description": "Log in for a total of 30 days"
		},
		"_login60": {
			"title": "Misskist II",
			"description": "Log in for a total of 60 days"
		},
		"_login100": {
			"title": "Misskist III",
			"description": "Log in for a total of 100 days",
			"flavor": "Violent Misskist"
		},
		"_login200": {
			"title": "Regular I",
			"description": "Log in for a total of 200 days"
		},
		"_login300": {
			"title": "Regular II",
			"description": "Log in for a total of 300 days"
		},
		"_login400": {
			"title": "Regular III",
			"description": "Log in for a total of 400 days"
		},
		"_login500": {
			"title": "Expert I",
			"description": "Log in for a total of 500 days",
			"flavor": "My friends, it has often been said that I like notes"
		},
		"_login600": {
			"title": "Expert II",
			"description": "Log in for a total of 600 days"
		},
		"_login700": {
			"title": "Expert III",
			"description": "Log in for a total of 700 days"
		},
		"_login800": {
			"title": "Master of Notes I",
			"description": "Log in for a total of 800 days"
		},
		"_login900": {
			"title": "Master of Notes II",
			"description": "Log in for a total of 900 days"
		},
		"_login1000": {
			"title": "Master of Notes III",
			"description": "Log in for a total of 1,000 days",
			"flavor": "Thank you for using Misskey!"
		},
		"_noteClipped1": {
			"title": "Must... clip...",
			"description": "Clip your first note"
		},
		"_noteFavorited1": {
			"title": "Stargazer",
			"description": "Favorite your first note"
		},
		"_myNoteFavorited1": {
			"title": "Seeking Stars",
			"description": "Have somebody else favorite one of your notes"
		},
		"_profileFilled": {
			"title": "Well-prepared",
			"description": "Set up your profile"
		},
		"_markedAsCat": {
			"title": "I Am a Cat",
			"description": "Mark your account as a cat",
			"flavor": "I'll give you a name later."
		},
		"_following1": {
			"title": "Following your first user",
			"description": "Follow a user"
		},
		"_following10": {
			"title": "Keep up... keep up...",
			"description": "Follow 10 users"
		},
		"_following50": {
			"title": "Lots of friends",
			"description": "Follow 50 accounts"
		},
		"_following100": {
			"title": "100 Friends",
			"description": "Follow 100 accounts"
		},
		"_following300": {
			"title": "Friend overload",
			"description": "Follow 300 accounts"
		},
		"_followers1": {
			"title": "First follower",
			"description": "Gain 1 follower"
		},
		"_followers10": {
			"title": "Follow me!",
			"description": "Gain 10 followers"
		},
		"_followers50": {
			"title": "Coming in crowds",
			"description": "Gain 50 followers"
		},
		"_followers100": {
			"title": "Popular",
			"description": "Gain 100 followers"
		},
		"_followers300": {
			"title": "Please form a single line",
			"description": "Gain 300 followers"
		},
		"_followers500": {
			"title": "Radio Tower",
			"description": "Gain 500 followers"
		},
		"_followers1000": {
			"title": "Influencer",
			"description": "Gain 1,000 followers"
		},
		"_collectAchievements30": {
			"title": "Achievement Collector",
			"description": "Earn 30 achievements"
		},
		"_viewAchievements3min": {
			"title": "Likes Achievements",
			"description": "Look at your list of achievements for at least 3 minutes"
		},
		"_iLoveMisskey": {
			"title": "I Love Misskey",
			"description": "Post \"I ❤ #Misskey\"",
			"flavor": "Misskey's development team greatly appreciates your support!"
		},
		"_foundTreasure": {
			"title": "Treasure Hunt",
			"description": "You've found the hidden treasure"
		},
		"_client30min": {
			"title": "Short break",
			"description": "Keep Misskey opened for at least 30 minutes"
		},
		"_client60min": {
			"title": "No \"Miss\" in Misskey",
			"description": "Keep Misskey opened for at least 60 minutes"
		},
		"_noteDeletedWithin1min": {
			"title": "Nevermind",
			"description": "Delete a note within a minute of posting it"
		},
		"_postedAtLateNight": {
			"title": "Nocturnal",
			"description": "Post a note late at night",
			"flavor": "It's about time to go to bed."
		},
		"_postedAt0min0sec": {
			"title": "Speaking Clock",
			"description": "Post a note at 00:00",
			"flavor": "Click Click Click Claaang"
		},
		"_selfQuote": {
			"title": "Self-Reference",
			"description": "Quote your own note"
		},
		"_htl20npm": {
			"title": "Flowing Timeline",
			"description": "Have the speed of your home timeline exceed 20 npm (notes per minute)"
		},
		"_viewInstanceChart": {
			"title": "Analyst",
			"description": "View your instance's charts"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "Output \"hello world\" in the Scratchpad"
		},
		"_open3windows": {
			"title": "Multi-Window",
			"description": "Have at least 3 windows open at the same time"
		},
		"_driveFolderCircularReference": {
			"title": "Circular Reference",
			"description": "Attempt to create a recursively nested folder in Drive"
		},
		"_reactWithoutRead": {
			"title": "Did you really read that?",
			"description": "React on a note that's over 100 characters long within 3 seconds of it being posted"
		},
		"_clickedClickHere": {
			"title": "Click here",
			"description": "You've clicked here"
		},
		"_justPlainLucky": {
			"title": "Just Plain Lucky",
			"description": "Has a chance to be obtained with a probability of 0.005% every 10 seconds"
		},
		"_setNameToSyuilo": {
			"title": "God Complex",
			"description": "Set your name to \"syuilo\""
		},
		"_passedSinceAccountCreated1": {
			"title": "One Year Anniversary",
			"description": "One year has passed since your account was created"
		},
		"_passedSinceAccountCreated2": {
			"title": "Two Year Anniversary",
			"description": "Two years have passed since your account was created"
		},
		"_passedSinceAccountCreated3": {
			"title": "Three Year Anniversary",
			"description": "Three years have passed since your account was created"
		},
		"_loggedInOnBirthday": {
			"title": "Happy Birthday",
			"description": "Log in on your birthday"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Happy New Year!",
			"description": "Logged in on the first day of the year",
			"flavor": "To another great year on this instance"
		},
		"_cookieClicked": {
			"title": "A game in which you click cookies",
			"description": "Clicked the cookie",
			"flavor": "Wait, are you on the correct website?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Post the link to Brain Diver",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Test overflow",
			"description": "Trigger the notification test repeatedly within an extremely short time"
		},
		"_tutorialCompleted": {
			"title": "Misskey Elementary Course Diploma",
			"description": "Tutorial completed"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "The biggest object in the bubble game"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Double🤯",
			"description": "Two of the biggest objects in the bubble game at the same time",
			"flavor": "You can fill a lunch box like this 🤯 🤯 a bit."
		}
	},
	"showFile": "Show files",
	"notificationCreateTokenDescription": "If you did not create this, delete it in \"{text}\".",
	"manageAccessTokens": "Manage access tokens",
	"youGotNewFollower": "followed you",
	"followRequestAccepted": "Follow request accepted",
	"receiveFollowRequest": "Follow request received",
	"accept": "Accept",
	"reject": "Reject",
	"notificationNotificationWillBeDisplayedLikeThis": "Notifications look like this",
	"antennas": "Antennas",
	"blockedUsers": "Blocked users",
	"clips": "Clips",
	"customEmojis": "Custom Emoji",
	"favorites": "Favorites",
	"following": "Following",
	"mutedUsers": "Muted users",
	"notes": "Notes",
	"lists": "Lists"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"notificationPollEnded": "Estan disponibles los resultados de la encuesta",
	"notificationScheduledNotePosted": "Una nota programada ha sido publicada",
	"notificationScheduledNotePostFailed": "Ha fallado la publicación de una nota programada",
	"notificationNewNote": "Nueva nota",
	"notificationRoleAssigned": "Rol asignado",
	"notificationChatRoomInvitationReceived": "Invitado a la sala de chat.",
	"notificationAchievementEarned": "Logro desbloqueado",
	"notificationLogin": "Alguien ha iniciado sesión",
	"notificationCreateToken": "Token de acceso creado",
	"notificationTestNotification": "Notificación de prueba",
	"notificationExportOfXCompleted": "La exportación de {x} ha sido completada.",
	"notificationLikedBySomeUsers": "{n} usuarios les gustó tu nota",
	"notificationReactedBySomeUsers": "{n} usuarios han reaccionado",
	"notificationRenotedBySomeUsers": "{n} usuarios han renotado",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "¡Hola Misskey!",
			"description": "Publicaste tu primera nota",
			"flavor": "¡Pasándola bien con Misskey!"
		},
		"_notes10": {
			"title": "Algunas notas",
			"description": "10 notas publicadas"
		},
		"_notes100": {
			"title": "¡Muchas notas!",
			"description": "100 notas publicadas"
		},
		"_notes500": {
			"title": "¡Cubierto de notas!",
			"description": "500 notas publicadas"
		},
		"_notes1000": {
			"title": "¡Una montaña de notas!",
			"description": "1000 notas publicadas"
		},
		"_notes5000": {
			"title": "¡Exceso de notas!",
			"description": "5000 notas publicadas"
		},
		"_notes10000": {
			"title": "¡Súpernota!",
			"description": "10000 notas publicadas"
		},
		"_notes20000": {
			"title": "Necesito... Más... ¡Notas!",
			"description": "20000 notas publicadas"
		},
		"_notes30000": {
			"title": "¡Notas! ¡Notas! ¡Notas!",
			"description": "30000 notas publicadas"
		},
		"_notes40000": {
			"title": "Fábrica de notas",
			"description": "40000 notas publicadas"
		},
		"_notes50000": {
			"title": "¡Un planeta de notas!",
			"description": "50000 notas publicadas"
		},
		"_notes60000": {
			"title": "¡Un cuásar de notas!",
			"description": "60000 notas publicadas"
		},
		"_notes70000": {
			"title": "¡Un hoyo negro de notas!",
			"description": "70000 notas publicadas"
		},
		"_notes80000": {
			"title": "¡Una galaxia de notas!",
			"description": "80000 notas publicadas"
		},
		"_notes90000": {
			"title": "¡Todo un universo de notas!",
			"description": "90000 notas publicadas"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "100000 notas publicadas",
			"flavor": "¿Tienes tanto para publicar?"
		},
		"_login3": {
			"title": "Principiante I",
			"description": "Días desde el inicio de sesión: 3",
			"flavor": "Desde hoy, soy Misskero"
		},
		"_login7": {
			"title": "Principiante II",
			"description": "Días desde el inicio de sesión: 7",
			"flavor": "¿Ya te acostumbraste?"
		},
		"_login15": {
			"title": "Principiante III",
			"description": "Días desde el inicio de sesión: 15"
		},
		"_login30": {
			"title": "Misskero I",
			"description": "Días desde el inicio de sesión: 30"
		},
		"_login60": {
			"title": "Misskero II",
			"description": "Días desde el inicio de sesión: 60"
		},
		"_login100": {
			"title": "Misskero III",
			"description": "Días desde el inicio de sesión: 100",
			"flavor": "Para este usuario, Misskaína"
		},
		"_login200": {
			"title": "Regular I",
			"description": "Días desde el inicio de sesión: 200"
		},
		"_login300": {
			"title": "Regular II",
			"description": "Días desde el inicio de sesión: 300"
		},
		"_login400": {
			"title": "Regular III",
			"description": "Días desde el inicio de sesión: 400"
		},
		"_login500": {
			"title": "Veterano I",
			"description": "Días desde el inicio de sesión: 500",
			"flavor": "Chicos, me encantan las libretas..."
		},
		"_login600": {
			"title": "Veterano II",
			"description": "Días desde el inicio de sesión: 600"
		},
		"_login700": {
			"title": "Veterano III",
			"description": "Días desde el inicio de sesión: 700"
		},
		"_login800": {
			"title": "Maestro I",
			"description": "Días desde el inicio de sesión: 800"
		},
		"_login900": {
			"title": "Maestro II",
			"description": "Días desde el inicio de sesión: 900"
		},
		"_login1000": {
			"title": "Maestro III",
			"description": "Días desde el inicio de sesión: 1000",
			"flavor": "¡Gracias por usar Misskey!"
		},
		"_noteClipped1": {
			"title": "No puedo evitar clipearte...",
			"description": "Hacer un clip por primera vez"
		},
		"_noteFavorited1": {
			"title": "Contemplando las estrellas",
			"description": "Poner una nota como favorito por primera vez"
		},
		"_myNoteFavorited1": {
			"title": "¡Quiero una estrella!",
			"description": "Tu nota ha sido marcada como favorito por primera vez"
		},
		"_profileFilled": {
			"title": "¡Listo!",
			"description": "Perfil completado"
		},
		"_markedAsCat": {
			"title": "Soy un gato",
			"description": "Configurar la cuenta como cuenta de un gato",
			"flavor": "Aún no tengo nombre"
		},
		"_following1": {
			"title": "Primera vez siguiendo a alguien",
			"description": "Seguir a un usuario"
		},
		"_following10": {
			"title": "Ahí la llevas, ahí la llevas...",
			"description": "10 usuarios seguidos"
		},
		"_following50": {
			"title": "¡Un puñado de amigos!",
			"description": "50 cuentas seguidas"
		},
		"_following100": {
			"title": "100 amigos",
			"description": "100 cuentas seguidas"
		},
		"_following300": {
			"title": "¡Sobrecarga de amigos!",
			"description": "300 cuentas seguidas"
		},
		"_followers1": {
			"title": "¡Tu primer seguidor!",
			"description": "1 seguidor ganado"
		},
		"_followers10": {
			"title": "¡Sígueme!",
			"description": "10 seguidores ganados"
		},
		"_followers50": {
			"title": "Viniendo en manada",
			"description": "50 seguidores ganados"
		},
		"_followers100": {
			"title": "Popular",
			"description": "100 cuentas seguidas"
		},
		"_followers300": {
			"title": "Por favor, hagan una fila",
			"description": "300 seguidores ganados"
		},
		"_followers500": {
			"title": "¡Toda una torre de radio!",
			"description": "500 seguidores ganados"
		},
		"_followers1000": {
			"title": "\"Influyente\"",
			"description": "1000 seguidores gandos"
		},
		"_collectAchievements30": {
			"title": "Coleccionista",
			"description": "30 logros ganados"
		},
		"_viewAchievements3min": {
			"title": "¡Te gustan los logros!",
			"description": "Mirando tus logros por 3 minutos"
		},
		"_iLoveMisskey": {
			"title": "¡AMO Misskey!",
			"description": "\"I ❤ #Misskey\" Publicado",
			"flavor": "El equipo de desarrollo de Misskey, en verdad, ¡aprecia tu apoyo!"
		},
		"_foundTreasure": {
			"title": "Búsqueda del tesoro",
			"description": "Encontraste un tesoro"
		},
		"_client30min": {
			"title": "Un descansito",
			"description": "30 minutos dedicados a Misskey"
		},
		"_client60min": {
			"title": "Viendo mucho Misskey.",
			"description": "Dejar abierto Misskey por al menos 60 minutos"
		},
		"_noteDeletedWithin1min": {
			"title": "Ah... Mejor no...",
			"description": "Borrar una nota antes que de pase 1 minuto"
		},
		"_postedAtLateNight": {
			"title": "Nocturno",
			"description": "Una nota publicada por la noche",
			"flavor": "¡Ya casi es hora de dormir!"
		},
		"_postedAt0min0sec": {
			"title": "Reloj parlante",
			"description": "Publicar una nota a las 00:00 de la madrugada",
			"flavor": "Tic, tic, tic ¡TUUUUUN!"
		},
		"_selfQuote": {
			"title": "Autoreferencia",
			"description": "Citar tu propia nota"
		},
		"_htl20npm": {
			"title": "Línea de tiempo fluyendo",
			"description": "La velocidad de tu línea de tiempo excede las 20 npm (notas por minuto)"
		},
		"_viewInstanceChart": {
			"title": "Analista",
			"description": "Gráficas de la instancia mostradas"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "¡Hola mundo!",
			"description": "Escribir \"hello world\" en el compositor"
		},
		"_open3windows": {
			"title": "Multiventana",
			"description": "Tener más de 3 ventanas al mismo tiempo"
		},
		"_driveFolderCircularReference": {
			"title": "Referencia circular",
			"description": "Intento de crear carpetas recursivamente"
		},
		"_reactWithoutRead": {
			"title": "¡Sí lo leíste bien?",
			"description": "Reaccionar a los 3 segundos de publicación de una nota con más de 100 caracteres"
		},
		"_clickedClickHere": {
			"title": "Pícale aquí",
			"description": "Le picó ahí"
		},
		"_justPlainLucky": {
			"title": "Pura suerte",
			"description": "Obtenido con una probabilidad del 0.01% cada 10 segundos"
		},
		"_setNameToSyuilo": {
			"title": "Complejo de superioridad",
			"description": "Configurar el nombre como 'Syuilo'"
		},
		"_passedSinceAccountCreated1": {
			"title": "Primer aniversario",
			"description": "Pasó un año desde la creación de la cuenta"
		},
		"_passedSinceAccountCreated2": {
			"title": "Segundo aniversario",
			"description": "Pasaron dos años desde la creación de la cuenta"
		},
		"_passedSinceAccountCreated3": {
			"title": "Tercer aniversario",
			"description": "Pasaron tres años desde la creación de la cuenta"
		},
		"_loggedInOnBirthday": {
			"title": "¡Feliz cumpleaños!",
			"description": "En linea el día de tu cumpleaños"
		},
		"_loggedInOnNewYearsDay": {
			"title": "¡Feliz Año Nuevo!",
			"description": "En linea en año nuevo",
			"flavor": "¡Gracias por tu apoyo a la instancia durante todo este año!"
		},
		"_cookieClicked": {
			"title": "Un juego para picarle a una galleta",
			"description": "Picaste una galleta",
			"flavor": "¿Está mal este juego?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Publicaste un vínculo a \"Brain Diver\"",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Sobrecarga de pruebas",
			"description": "Envía muchas notificaciones de prueba en un corto espacio de tiempo"
		},
		"_tutorialCompleted": {
			"title": "Diploma del Curso Básico de Misskey",
			"description": "Tutorial completado"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "El objeto más grande en el juego de burbujas"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Doble 🤯",
			"description": "Dos de los objetos más grandes en el juego de burbujas al mismo tiempo",
			"flavor": "Puedes llenar el bento un poco de esta forma 🤯 🤯."
		}
	},
	"showFile": "Examinar archivos",
	"notificationCreateTokenDescription": "Si no tienes ni idea, elimina el token de acceso a través de \"{text}\".",
	"manageAccessTokens": "Administrar tokens de acceso",
	"youGotNewFollower": "ahora te sigue",
	"followRequestAccepted": "La solicitud de seguimiento fue aceptada",
	"receiveFollowRequest": "Recibiste una solicitud de seguimiento",
	"accept": "Aceptar",
	"reject": "Rechazar",
	"notificationNotificationWillBeDisplayedLikeThis": "Las notificaciones tendrán este aspecto",
	"antennas": "Antenas",
	"blockedUsers": "Usuarios bloqueados",
	"clips": "Clip",
	"customEmojis": "Emojis personalizados",
	"favorites": "Favoritos",
	"following": "Siguiendo",
	"mutedUsers": "Usuarios silenciados",
	"notes": "Notas",
	"lists": "Listas"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"notificationPollEnded": "Les résultats du sondage sont disponibles",
	"notificationScheduledNotePosted": "Scheduled note has been posted",
	"notificationScheduledNotePostFailed": "Failed to post scheduled note",
	"notificationNewNote": "New note",
	"notificationRoleAssigned": "Rôle attribué",
	"notificationChatRoomInvitationReceived": "You have been invited to a chat room",
	"notificationAchievementEarned": "Accomplissement déverrouillé",
	"notificationLogin": "Quelqu'un s'est connecté",
	"notificationCreateToken": "An access token has been created",
	"notificationTestNotification": "Tester la notification",
	"notificationExportOfXCompleted": "Export of {x} has been completed",
	"notificationLikedBySomeUsers": "{n} utilisateurs ont aimé votre note",
	"notificationReactedBySomeUsers": "{n} utilisateur·rice·s ont réagi",
	"notificationRenotedBySomeUsers": "{n} utilisateur·rice·s ont renoté",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "Je viens tout juste de configurer mon msky",
			"description": "Publiez votre première note",
			"flavor": "Passez un bon moment avec Misskey !"
		},
		"_notes10": {
			"title": "Quelques notes",
			"description": "Poster 10 notes"
		},
		"_notes100": {
			"title": "Beaucoup de notes",
			"description": "Poster 100 notes"
		},
		"_notes500": {
			"title": "Couvert de notes",
			"description": "Poster 500 notes"
		},
		"_notes1000": {
			"title": "Une montagne de notes",
			"description": "Poster 1000 notes"
		},
		"_notes5000": {
			"title": "Débordement de notes",
			"description": "Poster 5 000 notes"
		},
		"_notes10000": {
			"title": "Super note",
			"description": "Poster 10 000 notes"
		},
		"_notes20000": {
			"title": "Encore... plus... de... notes...",
			"description": "Poster 20 000 notes"
		},
		"_notes30000": {
			"title": "Notes notes notes !",
			"description": "Poster 30 000 notes"
		},
		"_notes40000": {
			"title": "Usine de notes",
			"description": "Poster 40 000 notes"
		},
		"_notes50000": {
			"title": "Planète des notes",
			"description": "Poster 50 000 notes"
		},
		"_notes60000": {
			"title": "Quasar de note",
			"description": "Poster 50 000 notes"
		},
		"_notes70000": {
			"title": "Trou noir de notes",
			"description": "Poster 70 000 notes"
		},
		"_notes80000": {
			"title": "Galaxie de notes",
			"description": "Poster 80 000 notes"
		},
		"_notes90000": {
			"title": "Univers de notes",
			"description": "Poster 90 000 notes"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "Poster 100 000 notes",
			"flavor": "Avez-vous tant de choses à dire ?"
		},
		"_login3": {
			"title": "Débutant I",
			"description": "Se connecter pour un total de 3 jours",
			"flavor": "Dès maintenant, appelez-moi Misskeynaute"
		},
		"_login7": {
			"title": "Débutant II",
			"description": "Se connecter pour un total de 7 jours",
			"flavor": "On s'habitue ?"
		},
		"_login15": {
			"title": "Débutant III",
			"description": "Se connecter pour un total de 15 jours"
		},
		"_login30": {
			"title": "Misskeynaute I",
			"description": "Se connecter pour un total de 30 jours"
		},
		"_login60": {
			"title": "Misskeynaute II",
			"description": "Se connecter pour un total de 60 jours"
		},
		"_login100": {
			"title": "Misskeynaute III",
			"description": "Se connecter pour un total de 100 jours",
			"flavor": "Misskeynaute acharné·e"
		},
		"_login200": {
			"title": "Régulier I",
			"description": "Se connecter pour un total de 200 jours"
		},
		"_login300": {
			"title": "Régulier II",
			"description": "Se connecter pour un total de 300 jours"
		},
		"_login400": {
			"title": "Régulier III",
			"description": "Se connecter pour un total de 400 jours"
		},
		"_login500": {
			"title": "Expert I",
			"description": "Se connecter pour un total de 500 jours",
			"flavor": "Non, mes amis, j'aime les notes"
		},
		"_login600": {
			"title": "Expert II",
			"description": "Se connecter pour un total de 600 jours"
		},
		"_login700": {
			"title": "Expert III",
			"description": "Se connecter pour un total de 700 jours"
		},
		"_login800": {
			"title": "Maître des notes I",
			"description": "Se connecter pour un total de 800 jours"
		},
		"_login900": {
			"title": "Maître des notes II",
			"description": "Se connecter pour un total de 900 jours"
		},
		"_login1000": {
			"title": "Maître des notes III",
			"description": "Se connecter pour un total de 1 000 jours",
			"flavor": "Merci d'utiliser Misskey !"
		},
		"_noteClipped1": {
			"title": "Je... dois... clip...",
			"description": "Ajouter sa première note aux clips"
		},
		"_noteFavorited1": {
			"title": "Stargazer",
			"description": "Favorite your first note"
		},
		"_myNoteFavorited1": {
			"title": "Seeking Stars",
			"description": "Have somebody else favorite one of your notes"
		},
		"_profileFilled": {
			"title": "Bien préparé",
			"description": "Configuration de votre profil"
		},
		"_markedAsCat": {
			"title": "Je suis un chat",
			"description": "Rendre votre compte comme un chat",
			"flavor": "Je n'ai pas encore de nom"
		},
		"_following1": {
			"title": "Vous suivez votre premier·ère utilisateur·rice",
			"description": "Follow a user"
		},
		"_following10": {
			"title": "Keep up... keep up...",
			"description": "S'abonner à plus de 10 utilisateur·rice·s"
		},
		"_following50": {
			"title": "Beaucoup d'amis",
			"description": "S'abonner à plus de 50 utilisateur·rice·s"
		},
		"_following100": {
			"title": "100 Friends",
			"description": "S'abonner à plus de 100 utilisateur·rice·s"
		},
		"_following300": {
			"title": "Friend overload",
			"description": "S'abonner à plus de 300 utilisateur·rice·s"
		},
		"_followers1": {
			"title": "First follower",
			"description": "Gain 1 follower"
		},
		"_followers10": {
			"title": "Abonnez-moi !",
			"description": "Obtenir plus de 10 abonné·e·s"
		},
		"_followers50": {
			"title": "Coming in crowds",
			"description": "Obtenir plus de 50 abonné·e·s"
		},
		"_followers100": {
			"title": "Populaire",
			"description": "Obtenir plus de 100 abonné·e·s"
		},
		"_followers300": {
			"title": "Please form a single line",
			"description": "Obtenir plus de 300 abonné·e·s"
		},
		"_followers500": {
			"title": "Tour radio",
			"description": "Obtenir plus de 500 abonné·e·s"
		},
		"_followers1000": {
			"title": "Influenceur·euse",
			"description": "Obtenir plus de 1000 abonné·e·s"
		},
		"_collectAchievements30": {
			"title": "Achievement Collector",
			"description": "Earn 30 achievements"
		},
		"_viewAchievements3min": {
			"title": "Likes Achievements",
			"description": "Look at your list of achievements for at least 3 minutes"
		},
		"_iLoveMisskey": {
			"title": "J’adore Misskey",
			"description": "Publication « J’❤ #Misskey »",
			"flavor": "L'équipe de développement de Misskey apprécie vraiment votre aide !"
		},
		"_foundTreasure": {
			"title": "Chasse au trésor",
			"description": "Vous avez trouvé le trésor caché"
		},
		"_client30min": {
			"title": "Pause bien méritée",
			"description": "Keep Misskey opened for at least 30 minutes"
		},
		"_client60min": {
			"title": "No \"Miss\" in Misskey",
			"description": "Keep Misskey opened for at least 60 minutes"
		},
		"_noteDeletedWithin1min": {
			"title": "Nevermind",
			"description": "Delete a note within a minute of posting it"
		},
		"_postedAtLateNight": {
			"title": "Nocturnal",
			"description": "Post a note late at night",
			"flavor": "C’est l’heure d’aller au lit."
		},
		"_postedAt0min0sec": {
			"title": "Horloge parlante",
			"description": "Publication d’une note à 00:00",
			"flavor": "Tic tac, tic tac, tic tac, ding !"
		},
		"_selfQuote": {
			"title": "Self-Reference",
			"description": "Quote your own note"
		},
		"_htl20npm": {
			"title": "Flowing Timeline",
			"description": "Have the speed of your home timeline exceed 20 npm (notes per minute)"
		},
		"_viewInstanceChart": {
			"title": "Analyste",
			"description": "View your instance's charts"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "Output \"hello world\" in the Scratchpad"
		},
		"_open3windows": {
			"title": "Multi-fenêtres",
			"description": "Have at least 3 windows open at the same time"
		},
		"_driveFolderCircularReference": {
			"title": "Référence circulaire",
			"description": "Attempt to create a recursively nested folder in Drive"
		},
		"_reactWithoutRead": {
			"title": "Did you really read that?",
			"description": "React on a note that's over 100 characters long within 3 seconds of it being posted"
		},
		"_clickedClickHere": {
			"title": "Click here",
			"description": "You've clicked here"
		},
		"_justPlainLucky": {
			"title": "Just Plain Lucky",
			"description": "Has a chance to be obtained with a probability of 0.005% every 10 seconds"
		},
		"_setNameToSyuilo": {
			"title": "Complexe de dieu",
			"description": "Vous avez spécifié « syuilo » comme nom"
		},
		"_passedSinceAccountCreated1": {
			"title": "Premier anniversaire",
			"description": "Un an est passé depuis la création du compte"
		},
		"_passedSinceAccountCreated2": {
			"title": "Second anniversaire",
			"description": "Deux ans sont passés depuis la création du compte"
		},
		"_passedSinceAccountCreated3": {
			"title": "3ème anniversaire",
			"description": "Trois ans sont passés depuis la création du compte"
		},
		"_loggedInOnBirthday": {
			"title": "Joyeux Anniversaire !",
			"description": "Vous vous êtes connecté à la date de votre anniversaire"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Bonne année\u00a0!",
			"description": "Vous vous êtes connecté le premier jour de l'année",
			"flavor": "Merci pour le soutient continue sur cette instance."
		},
		"_cookieClicked": {
			"title": "Jeu de clic sur des cookies",
			"description": "Cliqué sur un cookie",
			"flavor": "Attendez une minute, vous êtes sur le mauvais site web ?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Poster le lien sur Brain Diver",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Débordement de tests",
			"description": "Détruire le bouton de test de notifications dans un intervalle extrêmement court"
		},
		"_tutorialCompleted": {
			"title": "Diplôme de la course élémentaire de Misskey",
			"description": "Terminer le tutoriel"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "Le plus gros objet du jeu de bulles"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Double🤯",
			"description": "Two of the biggest objects in the bubble game at the same time",
			"flavor": "You can fill a lunch box like this 🤯 🤯 a bit."
		}
	},
	"showFile": "Voir les fichiers",
	"notificationCreateTokenDescription": "If you did not create this, delete it in \"{text}\".",
	"manageAccessTokens": "Gérer les jetons d'accès",
	"youGotNewFollower": "Vous suit",
	"followRequestAccepted": "La demande d’abonnement a été acceptée",
	"receiveFollowRequest": "Demande d’abonnement reçue",
	"accept": "Autoriser",
	"reject": "Refuser",
	"notificationNotificationWillBeDisplayedLikeThis": "Notifications look like this",
	"antennas": "Antennes",
	"blockedUsers": "Utilisateur·rice·s bloqué·e·s",
	"clips": "Clips",
	"customEmojis": "Émojis personnalisés",
	"favorites": "Favoris",
	"following": "Abonnements",
	"mutedUsers": "Utilisateur·rice·s en sourdine",
	"notes": "Notes",
	"lists": "Listes"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"notificationPollEnded": "Hasil Kuesioner telah keluar",
	"notificationScheduledNotePosted": "Note terjadwal sudah diunggah",
	"notificationScheduledNotePostFailed": "Gagal mengunggah note terjadwal",
	"notificationNewNote": "Catatan baru",
	"notificationRoleAssigned": "Peran Diberikan",
	"notificationChatRoomInvitationReceived": "Kamu telah diundang ke dalam ruang chat",
	"notificationAchievementEarned": "Pencapaian didapatkan",
	"notificationLogin": "Seseorang telah masuk",
	"notificationCreateToken": "Token akses berhasil dibuat",
	"notificationTestNotification": "Tes notifikasi",
	"notificationExportOfXCompleted": "Berhasil mengekspor {x}",
	"notificationLikedBySomeUsers": "{n} pengguna menyukai catatan kamu",
	"notificationReactedBySomeUsers": "{n} orang memberikan reaksi",
	"notificationRenotedBySomeUsers": "{n} orang telah merenote",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "Cus, baru gabung Misskey nih!",
			"description": "Catat catatan pertama kamu",
			"flavor": "Selamat bersenang-senang dengan Misskey!"
		},
		"_notes10": {
			"title": "Beberapa catatan",
			"description": "Catat 10 catatan"
		},
		"_notes100": {
			"title": "Banyak catatan",
			"description": "Catat 100 catatan"
		},
		"_notes500": {
			"title": "Tertumpuk catatan",
			"description": "Catat 500 catatan"
		},
		"_notes1000": {
			"title": "Gunung catatan",
			"description": "Catat 1000 catatan"
		},
		"_notes5000": {
			"title": "Luapan catatan",
			"description": "Catat 5000 catatan"
		},
		"_notes10000": {
			"title": "Catatan super",
			"description": "Catat 10 ribu catatan"
		},
		"_notes20000": {
			"title": "Butuh... banyak... catatan...",
			"description": "Catat 20 ribu catatan"
		},
		"_notes30000": {
			"title": "Catat, catat, catat !",
			"description": "Catat 30 ribu catatan"
		},
		"_notes40000": {
			"title": "Pabrik catatan",
			"description": "Catat 40 ribu catatan"
		},
		"_notes50000": {
			"title": "Planet catatan",
			"description": "Catat 50 ribu catatan"
		},
		"_notes60000": {
			"title": "Kuasar catatan",
			"description": "Catat 60 ribu catatan"
		},
		"_notes70000": {
			"title": "Lubang hitam catatan",
			"description": "Catat 70 ribu catatan"
		},
		"_notes80000": {
			"title": "Galaksi catatan",
			"description": "Catat 80 ribu catatan"
		},
		"_notes90000": {
			"title": "Semesta catatan",
			"description": "Catat 90 ribu catatan"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "Catat 100 ribu catatan",
			"flavor": "Banyak bacot ya kamu."
		},
		"_login3": {
			"title": "Pemula I",
			"description": "Login selama 3 hari",
			"flavor": "Mulai hari ini, panggil gue Misskist"
		},
		"_login7": {
			"title": "Pemula II",
			"description": "Login selama 7 hari",
			"flavor": "Sudah mulai terbiasa?"
		},
		"_login15": {
			"title": "Pemula III",
			"description": "Login selama 15 hari"
		},
		"_login30": {
			"title": "Misskist I",
			"description": "Login selama 30 hari"
		},
		"_login60": {
			"title": "Misskist II",
			"description": "Login selama 60 hari"
		},
		"_login100": {
			"title": "Misskist III",
			"description": "Login selama 100 hari",
			"flavor": "Violent Misskist"
		},
		"_login200": {
			"title": "Reguler I",
			"description": "Login selama 200 hari"
		},
		"_login300": {
			"title": "Reguler II",
			"description": "Login selama 300 hari"
		},
		"_login400": {
			"title": "Reguler III",
			"description": "Login selama 400 hari"
		},
		"_login500": {
			"title": "Veteran I",
			"description": "Login selama 500 hari",
			"flavor": "Kawanku, aku suka catatan."
		},
		"_login600": {
			"title": "Veteran II",
			"description": "Login selama 600 hari"
		},
		"_login700": {
			"title": "Veteran III",
			"description": "Login selama 700 hari"
		},
		"_login800": {
			"title": "Sepuh Catatan I",
			"description": "Login selama 800 hari"
		},
		"_login900": {
			"title": "Sepuh Catatan II",
			"description": "Login selama 900 hari"
		},
		"_login1000": {
			"title": "Sepuh Catatan III",
			"description": "Login selama 1000 hari",
			"flavor": "Terima kasih telah menggunakan Misskey!"
		},
		"_noteClipped1": {
			"title": "Harus... Ngeklip...",
			"description": "Klip catatan pertamamu"
		},
		"_noteFavorited1": {
			"title": "Pengamat Bintang",
			"description": "Favoritkan catatan pertamamu"
		},
		"_myNoteFavorited1": {
			"title": "Pencari Bintang",
			"description": "Minta orang lain memfavoritkan salah satu catatanmu"
		},
		"_profileFilled": {
			"title": "Siap Sedia",
			"description": "Atur profil kamu"
		},
		"_markedAsCat": {
			"title": "Aku Seekor Kucing",
			"description": "Tandai akunmu sebagai kucing",
			"flavor": "Aku beri kamu nama nanti"
		},
		"_following1": {
			"title": "Ikuti pengguna lain pertamamu",
			"description": "Ikuti pengguna"
		},
		"_following10": {
			"title": "Terusin... terusin...",
			"description": "Ikuti 10 pengguna lain"
		},
		"_following50": {
			"title": "Banyak teman",
			"description": "Ikuti 50 pengguna lain"
		},
		"_following100": {
			"title": "100 Teman",
			"description": "Ikuti 100 pengguna lain"
		},
		"_following300": {
			"title": "Kelebihan teman",
			"description": "Mengikuti 300 pengguna lain"
		},
		"_followers1": {
			"title": "Pengikut pertama",
			"description": "Dapatkan 1 pengikut"
		},
		"_followers10": {
			"title": "Ikuti aku!",
			"description": "Dapatkan 10 pengikut"
		},
		"_followers50": {
			"title": "Rame-rame",
			"description": "Dapatkan 50 pengikut"
		},
		"_followers100": {
			"title": "Terkenal",
			"description": "Dapatkan 100 pengikut"
		},
		"_followers300": {
			"title": "Mohon antri satu baris",
			"description": "Dapatkan 300 pengikut"
		},
		"_followers500": {
			"title": "Stasiun Informasi",
			"description": "Dapatkan 500 pengikut"
		},
		"_followers1000": {
			"title": "Influencer",
			"description": "Dapatkan 1000 pengikut"
		},
		"_collectAchievements30": {
			"title": "Kolektor pencapaian",
			"description": "Dapatkan 30 pencapaian"
		},
		"_viewAchievements3min": {
			"title": "Suka Pencapaian",
			"description": "Lugat daftar pencapaianmu setidaknya 3 menit"
		},
		"_iLoveMisskey": {
			"title": "I Love Misskey",
			"description": "Catat \"I ❤ #Misskey\"",
			"flavor": "Tim pengembang misskey sangat mengapresiasi dukungan kamu!"
		},
		"_foundTreasure": {
			"title": "Berburu Harta Karun",
			"description": "Kamu telah menemukan harta karun tersembunyi"
		},
		"_client30min": {
			"title": "Istirahat pendek",
			"description": "Habiskan waktu 30 menit di Misskey"
		},
		"_client60min": {
			"title": "Tidak ada \"Miss\" dalam Misskey",
			"description": "Biarkan Misskey tetap terbuka setidaknya selama 60 menit"
		},
		"_noteDeletedWithin1min": {
			"title": "Eh, salah coy!",
			"description": "Hapus catatan kurang dari semenit kamu catat"
		},
		"_postedAtLateNight": {
			"title": "Nokturnal",
			"description": "Catat catatan di tengah malam hari",
			"flavor": "Udah waktunya boboq."
		},
		"_postedAt0min0sec": {
			"title": "Jam ngomong",
			"description": "Catat catatan di jam 00.00",
			"flavor": "Tik Tok Tik Toeeeng"
		},
		"_selfQuote": {
			"title": "Rujukan mandiri",
			"description": "Kutip catatanmu sendiri"
		},
		"_htl20npm": {
			"title": "Lini masa mengalir",
			"description": "Memiliki lini masa beranda dengan kecepatan melebihi 20 cpm (catatan per menit)"
		},
		"_viewInstanceChart": {
			"title": "Analis",
			"description": "Lihat bagan instansimu"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Halo, dunia!",
			"description": "Munculkan \"hello world\" di Scratchpad"
		},
		"_open3windows": {
			"title": "Jendela ganda",
			"description": "Memiliki setidaknya 3 jendela yang terbuka secara bersamaan"
		},
		"_driveFolderCircularReference": {
			"title": "Referensi Siklus",
			"description": "Mencoba membuat folder bersarang rekursif di Drive"
		},
		"_reactWithoutRead": {
			"title": "Beneran udah dibaca?",
			"description": "Mereaksi catatan dengan 100 karakter panjangnya dalam 3 detik setelah dicatat"
		},
		"_clickedClickHere": {
			"title": "Klik di sini",
			"description": "Kamu telah mengeklik disini"
		},
		"_justPlainLucky": {
			"title": "Lagi Beruntung",
			"description": "Mendapatkan kesempatan dengan kemungkinan 0.01% setiap 10 detik"
		},
		"_setNameToSyuilo": {
			"title": "God Complex",
			"description": "Atur namamu jadi \"syuilo\""
		},
		"_passedSinceAccountCreated1": {
			"title": "Perayaan Satu Tahun",
			"description": "Satu tahun telah lewat sejak akunmu dibuat"
		},
		"_passedSinceAccountCreated2": {
			"title": "Perayaan Dua Tahun",
			"description": "Dua tahun telah lewat sejak akunmu dibuat"
		},
		"_passedSinceAccountCreated3": {
			"title": "Perayaan Tiga Tahun",
			"description": "Tiga tahun telah lewat sejak akunmu dibuat"
		},
		"_loggedInOnBirthday": {
			"title": "Selamat Ulang Tahun",
			"description": "Login di hari ulang tahunmu"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Selamat Tahun Baru!",
			"description": "Login di hari pertama tahun baru",
			"flavor": "Untuk tahun baru yang berkah bagi instansi ini"
		},
		"_cookieClicked": {
			"title": "Permainan dimana kamu mengeklik kue",
			"description": "Mengeklik kue",
			"flavor": "Tunggu, apakah kamu sedang berada di website yang benar?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Posting tautan mengenai Brain Diver",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Tes overflow",
			"description": "Picu tes notifikasi secara berulang dalam waktu yang sangat pendek"
		},
		"_tutorialCompleted": {
			"title": "Ijazah Sekolah Dasar Misskey",
			"description": "Tutorial selesai"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "Obyek paling terbesar di permainan gelembung"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Ganda 🤯",
			"description": "Dua dari obyek paling terbesar pada permainan gelembung di waktu yang sama",
			"flavor": "Kamu dapat mengisi kotak makan siang seperti ini 🤯 🤯."
		}
	},
	"showFile": "Tampilkan berkas",
	"notificationCreateTokenDescription": "Jika anda tidak tahu apa-apa, hapus token akses melalui \"{text}\".",
	"manageAccessTokens": "Kelola token akses",
	"youGotNewFollower": "Mengikuti kamu",
	"followRequestAccepted": "Permintaan mengikuti telah disetujui",
	"receiveFollowRequest": "Ingin mengikuti kamu",
	"accept": "Terima",
	"reject": "Tolak",
	"notificationNotificationWillBeDisplayedLikeThis": "Notifikasi akan terlihat seperti ini",
	"antennas": "Antena",
	"blockedUsers": "Pengguna yang diblokir",
	"clips": "Klip",
	"customEmojis": "Emoji kustom",
	"favorites": "Favorit",
	"following": "Ikuti",
	"mutedUsers": "Pengguna yang dibisukan",
	"notes": "Catatan",
	"lists": "Daftar"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"notificationPollEnded": "Risultati del sondaggio.",
	"notificationScheduledNotePosted": "Pubblicazione Nota pianificata",
	"notificationScheduledNotePostFailed": "Impossibile pubblicare la Nota pianificata",
	"notificationNewNote": "Nuove Note",
	"notificationRoleAssigned": "Ruolo assegnato",
	"notificationChatRoomInvitationReceived": "Invito in una stanza di chat",
	"notificationAchievementEarned": "Obiettivo raggiunto",
	"notificationLogin": "Autenticazione avvenuta",
	"notificationCreateToken": "È stato creato un token di accesso",
	"notificationTestNotification": "Provare la notifica",
	"notificationExportOfXCompleted": "Abbiamo completato l'esportazione di {x}",
	"notificationLikedBySomeUsers": "{n} apprezzamenti",
	"notificationReactedBySomeUsers": "{n} reazioni",
	"notificationRenotedBySomeUsers": "{n} Rinota",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "Hai iniziato a usare Misskey",
			"description": "Hai pubblicato la prima Nota",
			"flavor": "Goditi la vita su Misskey!"
		},
		"_notes10": {
			"title": "Alcune Note",
			"description": "Hai inserito 10 Note"
		},
		"_notes100": {
			"title": "Un po' di Note",
			"description": "Hai inserito 100 Note"
		},
		"_notes500": {
			"title": "Un bel po' di Note",
			"description": "Hai inserito 500 Note"
		},
		"_notes1000": {
			"title": "Una montagna di Note",
			"description": "Hai inserito 1.000 Note"
		},
		"_notes5000": {
			"title": "Un sovraccarico di Note!",
			"description": "Hai inserito 5.000 Note"
		},
		"_notes10000": {
			"title": "SuperNote!",
			"description": "Hai inserito 10.000 Note"
		},
		"_notes20000": {
			"title": "Voglio più... Note!",
			"description": "Hai inserito 20.000 Note"
		},
		"_notes30000": {
			"title": "Note, Note, Note!",
			"description": "Hai inserito 30.000 Note"
		},
		"_notes40000": {
			"title": "Una fabbrica di Note",
			"description": "Hai inserito 40.000 Note"
		},
		"_notes50000": {
			"title": "Un pianeta di Note",
			"description": "Hai inserito 50.000 Note"
		},
		"_notes60000": {
			"title": "Un quasar di Note",
			"description": "Hai inserito 60.000 Note"
		},
		"_notes70000": {
			"title": "Un buco nero supermassiccio di Note",
			"description": "Hai inserito 70.000 Note"
		},
		"_notes80000": {
			"title": "Una galassia di Note",
			"description": "Hai inserito 80.000 Note"
		},
		"_notes90000": {
			"title": "Un universo di Note!",
			"description": "Hai inserito 90.000 Note"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "Hai inserito 100.000 Note",
			"flavor": "Hai molto da scrivere?"
		},
		"_login3": {
			"title": "Principiante I",
			"description": "Hai totalizzato 3 accessi!",
			"flavor": "Da oggi, chiamatemi Misskist"
		},
		"_login7": {
			"title": "Principiante II",
			"description": "Hai totalizzato 7 accessi!",
			"flavor": "Ti sembra di avere la situazione sotto controllo?"
		},
		"_login15": {
			"title": "Principiante III",
			"description": "Hai totalizzato 15 accessi!"
		},
		"_login30": {
			"title": "Missalcolista I",
			"description": "Hai totalizzato 30 accessi!"
		},
		"_login60": {
			"title": "Missalcolista II",
			"description": "Hai totalizzato 60 accessi!"
		},
		"_login100": {
			"title": "Missalcolista III",
			"description": "Hai totalizzato 100 accessi!",
			"flavor": "Violent Misskeist"
		},
		"_login200": {
			"title": "Regolare I livello",
			"description": "Hai totalizzato 200 accessi!"
		},
		"_login300": {
			"title": "Regolare II livello",
			"description": "Hai totalizzato 300 accessi!"
		},
		"_login400": {
			"title": "Regolare III livello",
			"description": "Hai totalizzato 400 accessi!"
		},
		"_login500": {
			"title": "Professionista I livello",
			"description": "Hai totalizzato 500 accessi!",
			"flavor": "Amici cari, mi piacciono le Note"
		},
		"_login600": {
			"title": "Professionista II livello",
			"description": "Hai totalizzato 600 accessi!"
		},
		"_login700": {
			"title": "Professionista III livello",
			"description": "Hai totalizzato 700 accessi!"
		},
		"_login800": {
			"title": "Maestro di Note I livello",
			"description": "Hai totalizzato 800 accessi!"
		},
		"_login900": {
			"title": "Maestro di Note II livello",
			"description": "Hai totalizzato 900 accessi!"
		},
		"_login1000": {
			"title": "Maestro di Note III livello",
			"description": "Hai totalizzato 1000 accessi!",
			"flavor": "Grazie per aver usato Misskey!"
		},
		"_noteClipped1": {
			"title": "Devo clippare!",
			"description": "Hai raccolto la tua prima Nota in una Clip"
		},
		"_noteFavorited1": {
			"title": "Guarda le stelle",
			"description": "Aggiungi una Nota ai preferiti per la prima volta"
		},
		"_myNoteFavorited1": {
			"title": "Fornitura stelline",
			"description": "Qualcuno ha preferito una delle tue Note"
		},
		"_profileFilled": {
			"title": "Preparazione perfetta!",
			"description": "Imposta il tuo profilo"
		},
		"_markedAsCat": {
			"title": "Io sono un gatto",
			"description": "Aggiungi le orecchie da gatto al tuo profilo",
			"flavor": "Ti chiamerò..."
		},
		"_following1": {
			"title": "Il mio primo Follow",
			"description": "Hai seguito il tuo primo profilo"
		},
		"_following10": {
			"title": "Segui, segui!",
			"description": "Hai seguito 10 profili"
		},
		"_following50": {
			"title": "Tanti amici",
			"description": "Hai seguito 50 profili"
		},
		"_following100": {
			"title": "Cento amici",
			"description": "Hai seguito 100 profili"
		},
		"_following300": {
			"title": "Sovraccarico di amici",
			"description": "Hai seguito 300 profili"
		},
		"_followers1": {
			"title": "Il primo profilo tuo Follower",
			"description": "Hai ottenuto il tuo primo profilo Follower"
		},
		"_followers10": {
			"title": "Follow me!",
			"description": "Hai ottenuto 10 profili Follower"
		},
		"_followers50": {
			"title": "Un gregge di Follower",
			"description": "Hai ottenuto 50 Follower"
		},
		"_followers100": {
			"title": "Popolare",
			"description": "Hai ottenuto 100 profili Follower"
		},
		"_followers300": {
			"title": "Mettetevi in fila",
			"description": "Hai ottenuto 300 Follower"
		},
		"_followers500": {
			"title": "Trasmettitore",
			"description": "Hai ottenuto 500 Follower"
		},
		"_followers1000": {
			"title": "Influenzer",
			"description": "Hai superato i 1.000 profili Follower"
		},
		"_collectAchievements30": {
			"title": "Collezionista di successi",
			"description": "Hai raggiunto 30 conquiste"
		},
		"_viewAchievements3min": {
			"title": "Mi piacciono i risultati",
			"description": "Ammira la tua collezione di conquiste per almeno 3 minuti"
		},
		"_iLoveMisskey": {
			"title": "I LOVE Misskey",
			"description": "Pubblica «I ♥ #Misskey»",
			"flavor": "Grazie per aver utilizzato Misskey! Dal team di sviluppo"
		},
		"_foundTreasure": {
			"title": "Caccia al tesoro",
			"description": "Hai trovato un tesoro nascosto"
		},
		"_client30min": {
			"title": "Piccola grande pausa",
			"description": "Hai passato più di 30 minuti su Misskey"
		},
		"_client60min": {
			"title": "Misskey negli occhi",
			"description": "Hai letto Misskey almeno per un'ora"
		},
		"_noteDeletedWithin1min": {
			"title": "Ooops!",
			"description": "Hai eliminato una nota entro un minuto dalla sua pubblicazione"
		},
		"_postedAtLateNight": {
			"title": "Biassanot!",
			"description": "Hai pubblicato una nota in tarda notte",
			"flavor": "Andiamo a dormire presto"
		},
		"_postedAt0min0sec": {
			"title": "Mezzanotte",
			"description": "Hai pubblicato una Nota a mezzanotte in punto",
			"flavor": "tic, tac, tic, tac! Gong!"
		},
		"_selfQuote": {
			"title": "Autoreferenziale",
			"description": "Hai citato una delle tue Note"
		},
		"_htl20npm": {
			"title": "Timeline scorrevole",
			"description": "La tua Timeline personale ha superato la velocità di 20 Note orarie (Note al minuto)"
		},
		"_viewInstanceChart": {
			"title": "Analista",
			"description": "Visualizza i grafici dell'istanza"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "Hai scritto «Hello world» nel blocco appunti"
		},
		"_open3windows": {
			"title": "Apri le finestre!",
			"description": "Hai aperto almeno 3 finestre contemporaneamente"
		},
		"_driveFolderCircularReference": {
			"title": "Riferimento circolare",
			"description": "Hai provato a nidificare in modo ricorsivo le cartelle del Drive"
		},
		"_reactWithoutRead": {
			"title": "Hai letto bene?",
			"description": "Hai reagito ad una Nota più lunga di 100 caratteri entro 3 secondi dalla sua pubblicazione"
		},
		"_clickedClickHere": {
			"title": "Clicca qui",
			"description": "Hai cliccato qui"
		},
		"_justPlainLucky": {
			"title": "Proprio fortunato",
			"description": "Ottenuto con una probabilità dello 0,01% ogni 10 secondi"
		},
		"_setNameToSyuilo": {
			"title": "Complesso divino",
			"description": "Hai impostati il tuo nome in «syuilo»"
		},
		"_passedSinceAccountCreated1": {
			"title": "Primo Anniversario",
			"description": "È passato un anno da quando hai creato il profilo"
		},
		"_passedSinceAccountCreated2": {
			"title": "Secondo Anniversario",
			"description": "Sono passati due anni da quando hai creato il profilo"
		},
		"_passedSinceAccountCreated3": {
			"title": "Terzo Anniversario",
			"description": "Sono passati tre anni da quando hai creato il profilo"
		},
		"_loggedInOnBirthday": {
			"title": "Buon compleanno!",
			"description": "Hai effettuato l'accesso il giorno del tuo compleanno"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Buon anno nuovo!",
			"description": "Hai usato effettuato l'accesso il giorno di capodanno",
			"flavor": "Anche quest'anno, grazie per il tuo continuo supporto a questa istanza"
		},
		"_cookieClicked": {
			"title": "Clicca il biscotto",
			"description": "Hai giocato a cliccare il cookie",
			"flavor": "È il sito giusto?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Pubblica un link a Brain Diver",
			"flavor": "Sulle note di Brain Diver"
		},
		"_smashTestNotificationButton": {
			"title": "Prove eccessive",
			"description": "Hai provato le notifiche consecutivamente in un periodo di tempo molto breve"
		},
		"_tutorialCompleted": {
			"title": "Attestato di partecipazione al corso per principianti di Misskey",
			"description": "Ha completato il tutorial"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "Estrai l'oggetto più grande dal Bubble Game"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Doppio 🤯",
			"description": "Due oggetti più grossi contemporaneamente nel Bubble Game",
			"flavor": "Ha le dimensioni di una bento-box 🤯 🤯"
		}
	},
	"showFile": "Visualizza file",
	"notificationCreateTokenDescription": "Se non ne sai nulla, elimina il token di accesso: {text}.",
	"manageAccessTokens": "Gestisci token di accesso",
	"youGotNewFollower": "Hai un nuovo Follower",
	"followRequestAccepted": "Ha accettato la tua richiesta di follow",
	"receiveFollowRequest": "Hai ricevuto una richiesta di follow",
	"accept": "Accetta",
	"reject": "Rifiuta",
	"notificationNotificationWillBeDisplayedLikeThis": "La notifica apparirà così",
	"antennas": "Antenne",
	"blockedUsers": "Profili bloccati",
	"clips": "Clip",
	"customEmojis": "Emoji personalizzate",
	"favorites": "Preferiti",
	"following": "Following",
	"mutedUsers": "Profili silenziati",
	"notes": "Note",
	"lists": "Liste"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"notificationPollEnded": "アンケートの結果が出ました",
	"notificationScheduledNotePosted": "予約ノートが投稿されました",
	"notificationScheduledNotePostFailed": "予約ノートの投稿に失敗しました",
	"notificationNewNote": "新しい投稿",
	"notificationRoleAssigned": "ロールが付与されました",
	"notificationChatRoomInvitationReceived": "ダイレクトメッセージのグループへ招待されました",
	"notificationAchievementEarned": "実績を獲得",
	"notificationLogin": "ログインがありました",
	"notificationCreateToken": "アクセストークンが作成されました",
	"notificationTestNotification": "通知テスト",
	"notificationExportOfXCompleted": "{x}のエクスポートが完了しました",
	"notificationLikedBySomeUsers": "{n}人がいいねしました",
	"notificationReactedBySomeUsers": "{n}人がリアクションしました",
	"notificationRenotedBySomeUsers": "{n}人がリノートしました",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "just setting up my msky",
			"description": "初めてノートを投稿した",
			"flavor": "良いMisskeyライフを！"
		},
		"_notes10": {
			"title": "いくつかのノート",
			"description": "ノートを10回投稿した"
		},
		"_notes100": {
			"title": "たくさんのノート",
			"description": "ノートを100回投稿した"
		},
		"_notes500": {
			"title": "ノートまみれ",
			"description": "ノートを500回投稿した"
		},
		"_notes1000": {
			"title": "ノートの山",
			"description": "ノートを1,000回投稿した"
		},
		"_notes5000": {
			"title": "湧き出るノート",
			"description": "ノートを5,000回投稿した"
		},
		"_notes10000": {
			"title": "スーパーノート",
			"description": "ノートを10,000回投稿した"
		},
		"_notes20000": {
			"title": "ニードモアノート",
			"description": "ノートを20,000回投稿した"
		},
		"_notes30000": {
			"title": "ノートノートノート",
			"description": "ノートを30,000回投稿した"
		},
		"_notes40000": {
			"title": "ノート工場",
			"description": "ノートを40,000回投稿した"
		},
		"_notes50000": {
			"title": "ノートの惑星",
			"description": "ノートを50,000回投稿した"
		},
		"_notes60000": {
			"title": "ノートクエーサー",
			"description": "ノートを60,000回投稿した"
		},
		"_notes70000": {
			"title": "ブラックノートホール",
			"description": "ノートを70,000回投稿した"
		},
		"_notes80000": {
			"title": "ノートギャラクシー",
			"description": "ノートを80,000回投稿した"
		},
		"_notes90000": {
			"title": "ノートバース",
			"description": "ノートを90,000回投稿した"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "ノートを100,000回投稿した",
			"flavor": "そんなに書くことある？"
		},
		"_login3": {
			"title": "ビギナーⅠ",
			"description": "通算ログイン日数が3日",
			"flavor": "今日からね僕は ミスキストってことで"
		},
		"_login7": {
			"title": "ビギナーⅡ",
			"description": "通算ログイン日数が7日",
			"flavor": "慣れてきましたか？"
		},
		"_login15": {
			"title": "ビギナーⅢ",
			"description": "通算ログイン日数が15日"
		},
		"_login30": {
			"title": "ミスキストⅠ",
			"description": "通算ログイン日数が30日"
		},
		"_login60": {
			"title": "ミスキストⅡ",
			"description": "通算ログイン日数が60日"
		},
		"_login100": {
			"title": "ミスキストⅢ",
			"description": "通算ログイン日数が100日",
			"flavor": "そのユーザー、ミスキストにつき"
		},
		"_login200": {
			"title": "常連Ⅰ",
			"description": "通算ログイン日数が200日"
		},
		"_login300": {
			"title": "常連Ⅱ",
			"description": "通算ログイン日数が300日"
		},
		"_login400": {
			"title": "常連Ⅲ",
			"description": "通算ログイン日数が400日"
		},
		"_login500": {
			"title": "ベテランⅠ",
			"description": "通算ログイン日数が500日",
			"flavor": "諸君、私はノートが好きだ"
		},
		"_login600": {
			"title": "ベテランⅡ",
			"description": "通算ログイン日数が600日"
		},
		"_login700": {
			"title": "ベテランⅢ",
			"description": "通算ログイン日数が700日"
		},
		"_login800": {
			"title": "ノートマスターⅠ",
			"description": "通算ログイン日数が800日"
		},
		"_login900": {
			"title": "ノートマスターⅡ",
			"description": "通算ログイン日数が900日"
		},
		"_login1000": {
			"title": "ノートマスターⅢ",
			"description": "通算ログイン日数が1,000日",
			"flavor": "Misskeyを使ってくれてありがとう！"
		},
		"_noteClipped1": {
			"title": "クリップせずにはいられないな",
			"description": "初めてノートをクリップした"
		},
		"_noteFavorited1": {
			"title": "星をみるひと",
			"description": "初めてノートをお気に入りに登録した"
		},
		"_myNoteFavorited1": {
			"title": "星が欲しい",
			"description": "自分のノートが他の人からお気に入りに登録された"
		},
		"_profileFilled": {
			"title": "準備万端",
			"description": "プロフィール設定を行った"
		},
		"_markedAsCat": {
			"title": "吾輩は猫である",
			"description": "アカウントをCatとして設定した",
			"flavor": "名前はまだない。"
		},
		"_following1": {
			"title": "はじめてのフォロー",
			"description": "初めてフォローした"
		},
		"_following10": {
			"title": "ついてく、ついてく",
			"description": "フォローが10人を超した"
		},
		"_following50": {
			"title": "友達たくさん",
			"description": "フォローが50人を超した"
		},
		"_following100": {
			"title": "友達100人",
			"description": "フォローが100人を超した"
		},
		"_following300": {
			"title": "友達過多",
			"description": "フォローが300人を超した"
		},
		"_followers1": {
			"title": "はじめてのフォロワー",
			"description": "初めてフォローされた"
		},
		"_followers10": {
			"title": "フォローミー！",
			"description": "フォロワーが10人を超した"
		},
		"_followers50": {
			"title": "ぞろぞろ",
			"description": "フォロワーが50人を超した"
		},
		"_followers100": {
			"title": "人気者",
			"description": "フォロワーが100人を超した"
		},
		"_followers300": {
			"title": "一列でお並びください",
			"description": "フォロワーが300人を超した"
		},
		"_followers500": {
			"title": "基地局",
			"description": "フォロワーが500人を超した"
		},
		"_followers1000": {
			"title": "インフルエンサー",
			"description": "フォロワーが1,000人を超した"
		},
		"_collectAchievements30": {
			"title": "実績コレクター",
			"description": "実績を30個以上獲得した"
		},
		"_viewAchievements3min": {
			"title": "実績好き",
			"description": "実績一覧を3分以上眺め続けた"
		},
		"_iLoveMisskey": {
			"title": "I Love Misskey",
			"description": "\"I ❤ #Misskey\"を投稿した",
			"flavor": "Misskeyを使ってくださりありがとうございます！ by 開発チーム"
		},
		"_foundTreasure": {
			"title": "宝探し",
			"description": "隠されたお宝を発見した"
		},
		"_client30min": {
			"title": "ひとやすみ",
			"description": "クライアントを起動してから30分以上経過した"
		},
		"_client60min": {
			"title": "Misskeyの見すぎ",
			"description": "クライアントを起動してから60分以上経過した"
		},
		"_noteDeletedWithin1min": {
			"title": "いまのなし",
			"description": "投稿してから1分以内にその投稿を削除した"
		},
		"_postedAtLateNight": {
			"title": "夜行性",
			"description": "深夜にノートを投稿した",
			"flavor": "そろそろ寝よう。"
		},
		"_postedAt0min0sec": {
			"title": "時報",
			"description": "0分0秒にノートを投稿した",
			"flavor": "ポッ ポッ ポッ ピーン"
		},
		"_selfQuote": {
			"title": "自己言及",
			"description": "自分のノートを引用した"
		},
		"_htl20npm": {
			"title": "流れるTL",
			"description": "ホームタイムラインの流速が20npmを越す"
		},
		"_viewInstanceChart": {
			"title": "アナリスト",
			"description": "サーバーのチャートを表示した"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "スクラッチパッドで hello world を出力した"
		},
		"_open3windows": {
			"title": "マルチウィンドウ",
			"description": "ウィンドウを3つ以上開いた状態にした"
		},
		"_driveFolderCircularReference": {
			"title": "循環参照",
			"description": "ドライブのフォルダを再帰的な入れ子にしようとした"
		},
		"_reactWithoutRead": {
			"title": "ちゃんと読んだ？",
			"description": "100文字以上のテキストを含むノートに投稿されてから3秒以内にリアクションした"
		},
		"_clickedClickHere": {
			"title": "ここをクリック",
			"description": "ここをクリックした"
		},
		"_justPlainLucky": {
			"title": "単なるラッキー",
			"description": "10秒ごとに0.005%の確率で獲得"
		},
		"_setNameToSyuilo": {
			"title": "神様コンプレックス",
			"description": "名前を syuilo に設定した"
		},
		"_passedSinceAccountCreated1": {
			"title": "一周年",
			"description": "アカウント作成から1年経過した"
		},
		"_passedSinceAccountCreated2": {
			"title": "二周年",
			"description": "アカウント作成から2年経過した"
		},
		"_passedSinceAccountCreated3": {
			"title": "三周年",
			"description": "アカウント作成から3年経過した"
		},
		"_loggedInOnBirthday": {
			"title": "ハッピーバースデー",
			"description": "誕生日にログインした"
		},
		"_loggedInOnNewYearsDay": {
			"title": "あけましておめでとうございます",
			"description": "元日にログインした",
			"flavor": "今年も弊サーバーをよろしくお願いします"
		},
		"_cookieClicked": {
			"title": "クッキーをクリックするゲーム",
			"description": "クッキーをクリックした",
			"flavor": "ソフト間違ってない？"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Brain Diverへのリンクを投稿した",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "テスト過剰",
			"description": "通知のテストをごく短時間のうちに連続して行った"
		},
		"_tutorialCompleted": {
			"title": "Misskey初心者講座 修了証",
			"description": "チュートリアルを完了した"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "バブルゲームで最も大きいモノを出した"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "ダブル🤯",
			"description": "バブルゲームで最も大きいモノを2つ同時に出した",
			"flavor": "これくらいの\u3000おべんとばこに\u3000🤯\u3000🤯\u3000ちょっとつめて"
		}
	},
	"showFile": "ファイルを表示",
	"notificationCreateTokenDescription": "心当たりがない場合は「{text}」を通じてアクセストークンを削除してください。",
	"manageAccessTokens": "アクセストークンの管理",
	"youGotNewFollower": "フォローされました",
	"followRequestAccepted": "フォローが承認されました",
	"receiveFollowRequest": "フォローリクエストされました",
	"accept": "許可",
	"reject": "拒否",
	"notificationNotificationWillBeDisplayedLikeThis": "通知はこのように表示されます",
	"antennas": "アンテナ",
	"blockedUsers": "ブロックしたユーザー",
	"clips": "クリップ",
	"customEmojis": "カスタム絵文字",
	"favorites": "お気に入り",
	"following": "フォロー",
	"mutedUsers": "ミュートしたユーザー",
	"notes": "ノート",
	"lists": "リスト"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"notificationPollEnded": "アンケートの結果が出たみたいや",
	"notificationScheduledNotePosted": "予約ノートが投稿されたで",
	"notificationScheduledNotePostFailed": "予約ノート投稿できんかったで",
	"notificationNewNote": "さらの投稿",
	"notificationRoleAssigned": "ロールが付与されたで",
	"notificationChatRoomInvitationReceived": "チャットルームへ招待されたで",
	"notificationAchievementEarned": "実績を獲得しとるで",
	"notificationLogin": "ログインしとったで",
	"notificationCreateToken": "アクセストークンが作成されたで",
	"notificationTestNotification": "通知テスト",
	"notificationExportOfXCompleted": "{x}のエクスポートが終わったわ",
	"notificationLikedBySomeUsers": "{n}人がいいねしたで",
	"notificationReactedBySomeUsers": "{n}人がツッコんだで",
	"notificationRenotedBySomeUsers": "{n}人がリノートしたで",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "まいど！",
			"description": "初めてノート投稿したった",
			"flavor": "Misskeyを楽しんでな～"
		},
		"_notes10": {
			"title": "ノートの天保山",
			"description": "ノートを10回投稿した"
		},
		"_notes100": {
			"title": "ノートの真田山",
			"description": "ノートを100回投稿した"
		},
		"_notes500": {
			"title": "ノートの生駒山",
			"description": "ノートを500回投稿した"
		},
		"_notes1000": {
			"title": "ノートの六甲山",
			"description": "ノートを1,000回投稿した"
		},
		"_notes5000": {
			"title": "箕面の滝からノート",
			"description": "ノートを5,000回投稿した"
		},
		"_notes10000": {
			"title": "えげつないノート",
			"description": "ノートを10,000回投稿した"
		},
		"_notes20000": {
			"title": "もっとノートよこせ！",
			"description": "ノートを20,000回投稿した"
		},
		"_notes30000": {
			"title": "ノートノートノート",
			"description": "ノートを30,000回投稿した"
		},
		"_notes40000": {
			"title": "ノート工場",
			"description": "ノートを40,000回投稿した"
		},
		"_notes50000": {
			"title": "ノートの惑星",
			"description": "ノートを50,000回投稿した"
		},
		"_notes60000": {
			"title": "ノートクエーサー",
			"description": "ノートを60,000回投稿した"
		},
		"_notes70000": {
			"title": "ブラックノートホール",
			"description": "ノートを70,000回投稿した"
		},
		"_notes80000": {
			"title": "ノートギャラクシー",
			"description": "ノートを80,000回投稿した"
		},
		"_notes90000": {
			"title": "ノートバース",
			"description": "ノートを90,000回投稿した"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "ノートを100,000回投稿した",
			"flavor": "そんなに書くことあるんか？"
		},
		"_login3": {
			"title": "ビギナーⅠ",
			"description": "通算3日ログインした",
			"flavor": "今日からワシはミスキストやで"
		},
		"_login7": {
			"title": "ビギナーⅡ",
			"description": "通算7日ログインした",
			"flavor": "慣れてきたんとちゃう？"
		},
		"_login15": {
			"title": "ビギナーⅢ",
			"description": "通算15日ログインした"
		},
		"_login30": {
			"title": "ミスキストⅠ",
			"description": "通算30日ログインした"
		},
		"_login60": {
			"title": "ミスキストⅡ",
			"description": "通算60日ログインした"
		},
		"_login100": {
			"title": "ミスキストⅢ",
			"description": "通算100日ログインした",
			"flavor": "そのユーザー、ミスキストにつき"
		},
		"_login200": {
			"title": "常連さんⅠ",
			"description": "通算200日ログインした"
		},
		"_login300": {
			"title": "常連さんⅡ",
			"description": "通算300日ログインした"
		},
		"_login400": {
			"title": "常連さんⅢ",
			"description": "通算400日ログインした"
		},
		"_login500": {
			"title": "ベテランさんⅠ",
			"description": "通算500日ログインした",
			"flavor": "あんたら、うちはノートが好きや"
		},
		"_login600": {
			"title": "ベテランさんⅡ",
			"description": "通算600日ログインした"
		},
		"_login700": {
			"title": "ベテランさんⅢ",
			"description": "通算700日ログインした"
		},
		"_login800": {
			"title": "ノートマイスターⅠ",
			"description": "通算800日ログインした"
		},
		"_login900": {
			"title": "ノートマイスターⅡ",
			"description": "通算900日ログインした"
		},
		"_login1000": {
			"title": "ノートマイスターⅢ",
			"description": "通算1,000日ログインした",
			"flavor": "Misskeyようさん使てもろておおきにな！"
		},
		"_noteClipped1": {
			"title": "アカンどれもクリップしたいわ",
			"description": "初めてノートをクリップした"
		},
		"_noteFavorited1": {
			"title": "星ぃみるひと",
			"description": "初めてノートをお気に入りに登録した"
		},
		"_myNoteFavorited1": {
			"title": "星ぃ欲しい",
			"description": "ワレのノートが他のひとにお気に入り登録されたで"
		},
		"_profileFilled": {
			"title": "準備万端や",
			"description": "プロフィールを設定した"
		},
		"_markedAsCat": {
			"title": "吾輩は猫やねん",
			"description": "アカウントをCatにしたった",
			"flavor": "名前はまだないねん。"
		},
		"_following1": {
			"title": "はじめてのフォロー",
			"description": "初めてフォローした"
		},
		"_following10": {
			"title": "すたこらさっさ",
			"description": "フォローが10人超えた"
		},
		"_following50": {
			"title": "友達ぎょうさん",
			"description": "フォローが50人超えた"
		},
		"_following100": {
			"title": "友達100人",
			"description": "フォローが100人超えた"
		},
		"_following300": {
			"title": "いや友達多すぎやろ",
			"description": "フォローが300人超えた"
		},
		"_followers1": {
			"title": "はじめてのフォロワー",
			"description": "初めてフォローされた"
		},
		"_followers10": {
			"title": "フォローみぃ！",
			"description": "フォロワーが10人超えた"
		},
		"_followers50": {
			"title": "ぞろぞろ",
			"description": "フォロワーが50人超えた"
		},
		"_followers100": {
			"title": "人気もん",
			"description": "フォロワーが100人超えた"
		},
		"_followers300": {
			"title": "ほらそこ一列に並んで！",
			"description": "フォロワーが300人超えた"
		},
		"_followers500": {
			"title": "基地局",
			"description": "フォロワーが500人超えた"
		},
		"_followers1000": {
			"title": "インフルエンサー",
			"description": "フォロワーが1,000人超えた"
		},
		"_collectAchievements30": {
			"title": "実績コレクター",
			"description": "実績を30個以上獲得した"
		},
		"_viewAchievements3min": {
			"title": "実績好き",
			"description": "実績一覧を3分以上眺め続けた"
		},
		"_iLoveMisskey": {
			"title": "Misskey好きやねん",
			"description": "\"I ❤ #Misskey\"を投稿した",
			"flavor": "Misskeyを使ってくれておおきにな～\u3000by 開発チーム"
		},
		"_foundTreasure": {
			"title": "なんでも鑑定団",
			"description": "隠されたお宝を発見した"
		},
		"_client30min": {
			"title": "ねんね",
			"description": "クライアントを起動してから30分以上経過した"
		},
		"_client60min": {
			"title": "Misskeyの見過ぎや！",
			"description": "クライアント付けてから１時間経ってもうたで。"
		},
		"_noteDeletedWithin1min": {
			"title": "＊おおっと＊",
			"description": "投稿してから1分以内にその投稿をほかした"
		},
		"_postedAtLateNight": {
			"title": "夜行性",
			"description": "真夜中にノートを投稿した",
			"flavor": "そろそろ寝よか"
		},
		"_postedAt0min0sec": {
			"title": "時報",
			"description": "0分0秒にノートを投稿した",
			"flavor": "ポッ ポッ ポッ ピーン"
		},
		"_selfQuote": {
			"title": "自己言及",
			"description": "自分のノートを引用した"
		},
		"_htl20npm": {
			"title": "流れるTL",
			"description": "ホームタイムラインの流速が20npmを超す"
		},
		"_viewInstanceChart": {
			"title": "アナリスト",
			"description": "サーバーのチャートを表示した"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "スクラッチパッドで hello world を出力した"
		},
		"_open3windows": {
			"title": "マド開けすぎ",
			"description": "ウィンドウを3つ以上開いた状態にした"
		},
		"_driveFolderCircularReference": {
			"title": "環状線",
			"description": "ドライブのフォルダを再帰的な入れ子にしようとした"
		},
		"_reactWithoutRead": {
			"title": "ちゃんと読んだんか？",
			"description": "100文字以上のノートに投稿3秒以内にツッコんだ"
		},
		"_clickedClickHere": {
			"title": "ここをクリック",
			"description": "ここをクリックした"
		},
		"_justPlainLucky": {
			"title": "単なるラッキー",
			"description": "10秒ごとに0.005％の確率で獲得"
		},
		"_setNameToSyuilo": {
			"title": "神様コンプレックス",
			"description": "名前を syuilo にした"
		},
		"_passedSinceAccountCreated1": {
			"title": "一周年",
			"description": "アカウント作成から1年経過した"
		},
		"_passedSinceAccountCreated2": {
			"title": "二周年",
			"description": "アカウント作成から2年経過した"
		},
		"_passedSinceAccountCreated3": {
			"title": "三周年",
			"description": "アカウント作成から3年経過した"
		},
		"_loggedInOnBirthday": {
			"title": "ハッピーバースデー！",
			"description": "誕生日にログインした"
		},
		"_loggedInOnNewYearsDay": {
			"title": "あけましておめでとうございます！",
			"description": "元旦にログインした",
			"flavor": "今年も弊サーバーをよろしゅう頼みますわ"
		},
		"_cookieClicked": {
			"title": "クッキー叩くやつ",
			"description": "クッキー叩いてもうた",
			"flavor": "兄ちゃんソフト間違っとんで"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Brain Diverへのリンクを投稿したった",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "心配性",
			"description": "通知のテストしすぎやって"
		},
		"_tutorialCompleted": {
			"title": "Misskeyひよっこ講座 修了証",
			"description": "チュートリアル全部やった"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "バブルゲームで最も大きいモノを出した"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "ダブル🤯",
			"description": "バブルゲームで最も大きいモノを2つ同時に出した",
			"flavor": "これくらいの\u3000おべんとばこに\u3000🤯\u3000🤯\u3000ちょっとつめて"
		}
	},
	"showFile": "ファイル出す",
	"notificationCreateTokenDescription": "心当たりないんやったら「{text}」でアクセストークンを削除してやって。",
	"manageAccessTokens": "アクセストークンの管理",
	"youGotNewFollower": "フォローされたで",
	"followRequestAccepted": "フォローが承認されたで",
	"receiveFollowRequest": "フォローリクエストされたで",
	"accept": "ええで",
	"reject": "あかん",
	"notificationNotificationWillBeDisplayedLikeThis": "通知はこのように表示されるで",
	"antennas": "アンテナ",
	"blockedUsers": "ブロックしとるユーザー",
	"clips": "クリップ",
	"customEmojis": "カスタム絵文字",
	"favorites": "お気に入り",
	"following": "フォロー",
	"mutedUsers": "ミュートしとるユーザー",
	"notes": "ノート",
	"lists": "リスト"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"notificationPollEnded": "Poll results have become available",
	"notificationScheduledNotePosted": "Scheduled note has been posted",
	"notificationScheduledNotePostFailed": "Failed to post scheduled note",
	"notificationNewNote": "New note",
	"notificationRoleAssigned": "Role given",
	"notificationChatRoomInvitationReceived": "You have been invited to a chat room",
	"notificationAchievementEarned": "Achievement unlocked",
	"notificationLogin": "Someone logged in",
	"notificationCreateToken": "An access token has been created",
	"notificationTestNotification": "Test notification",
	"notificationExportOfXCompleted": "Export of {x} has been completed",
	"notificationLikedBySomeUsers": "{n} users liked your note",
	"notificationReactedBySomeUsers": "{n} users reacted",
	"notificationRenotedBySomeUsers": "Renote from {n} users",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "just setting up my msky",
			"description": "Post your first note",
			"flavor": "Have a good time with Misskey!"
		},
		"_notes10": {
			"title": "Some notes",
			"description": "Post 10 notes"
		},
		"_notes100": {
			"title": "A lot of notes",
			"description": "Post 100 notes"
		},
		"_notes500": {
			"title": "Covered in notes",
			"description": "Post 500 notes"
		},
		"_notes1000": {
			"title": "A mountain of notes",
			"description": "Post 1,000 notes"
		},
		"_notes5000": {
			"title": "Overflowing notes",
			"description": "Post 5,000 notes"
		},
		"_notes10000": {
			"title": "Supernote",
			"description": "Post 10,000 notes"
		},
		"_notes20000": {
			"title": "Need... more... notes...",
			"description": "Post 20,000 notes"
		},
		"_notes30000": {
			"title": "Notes notes notes!",
			"description": "Post 30,000 notes"
		},
		"_notes40000": {
			"title": "Note factory",
			"description": "Post 40,000 notes"
		},
		"_notes50000": {
			"title": "Planet of notes",
			"description": "Post 50,000 notes"
		},
		"_notes60000": {
			"title": "Note quasar",
			"description": "Post 60,000 notes"
		},
		"_notes70000": {
			"title": "Note black hole",
			"description": "Post 70,000 notes"
		},
		"_notes80000": {
			"title": "Note galaxy",
			"description": "Post 80,000 notes"
		},
		"_notes90000": {
			"title": "Note universe",
			"description": "Post 90,000 notes"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "Post 100,000 notes",
			"flavor": "You sure have a lot to say."
		},
		"_login3": {
			"title": "Beginner I",
			"description": "Log in for a total of 3 days",
			"flavor": "Starting today, just call me Misskist"
		},
		"_login7": {
			"title": "Beginner II",
			"description": "Log in for a total of 7 days",
			"flavor": "Feel like you've gotten the hang of things yet?"
		},
		"_login15": {
			"title": "Beginner III",
			"description": "Log in for a total of 15 days"
		},
		"_login30": {
			"title": "Misskist I",
			"description": "Log in for a total of 30 days"
		},
		"_login60": {
			"title": "Misskist II",
			"description": "Log in for a total of 60 days"
		},
		"_login100": {
			"title": "Misskist III",
			"description": "Log in for a total of 100 days",
			"flavor": "Violent Misskist"
		},
		"_login200": {
			"title": "Regular I",
			"description": "Log in for a total of 200 days"
		},
		"_login300": {
			"title": "Regular II",
			"description": "Log in for a total of 300 days"
		},
		"_login400": {
			"title": "Regular III",
			"description": "Log in for a total of 400 days"
		},
		"_login500": {
			"title": "Expert I",
			"description": "Log in for a total of 500 days",
			"flavor": "My friends, it has often been said that I like notes"
		},
		"_login600": {
			"title": "Expert II",
			"description": "Log in for a total of 600 days"
		},
		"_login700": {
			"title": "Expert III",
			"description": "Log in for a total of 700 days"
		},
		"_login800": {
			"title": "Master of Notes I",
			"description": "Log in for a total of 800 days"
		},
		"_login900": {
			"title": "Master of Notes II",
			"description": "Log in for a total of 900 days"
		},
		"_login1000": {
			"title": "Master of Notes III",
			"description": "Log in for a total of 1,000 days",
			"flavor": "Thank you for using Misskey!"
		},
		"_noteClipped1": {
			"title": "Must... clip...",
			"description": "Clip your first note"
		},
		"_noteFavorited1": {
			"title": "Stargazer",
			"description": "Favorite your first note"
		},
		"_myNoteFavorited1": {
			"title": "Seeking Stars",
			"description": "Have somebody else favorite one of your notes"
		},
		"_profileFilled": {
			"title": "Well-prepared",
			"description": "Set up your profile"
		},
		"_markedAsCat": {
			"title": "I Am a Cat",
			"description": "Mark your account as a cat",
			"flavor": "I'll give you a name later."
		},
		"_following1": {
			"title": "Following your first user",
			"description": "Follow a user"
		},
		"_following10": {
			"title": "Keep up... keep up...",
			"description": "Follow 10 users"
		},
		"_following50": {
			"title": "Lots of friends",
			"description": "Follow 50 accounts"
		},
		"_following100": {
			"title": "100 Friends",
			"description": "Follow 100 accounts"
		},
		"_following300": {
			"title": "Friend overload",
			"description": "Follow 300 accounts"
		},
		"_followers1": {
			"title": "First follower",
			"description": "Gain 1 follower"
		},
		"_followers10": {
			"title": "Follow me!",
			"description": "Gain 10 followers"
		},
		"_followers50": {
			"title": "Coming in crowds",
			"description": "Gain 50 followers"
		},
		"_followers100": {
			"title": "Popular",
			"description": "Gain 100 followers"
		},
		"_followers300": {
			"title": "Please form a single line",
			"description": "Gain 300 followers"
		},
		"_followers500": {
			"title": "Radio Tower",
			"description": "Gain 500 followers"
		},
		"_followers1000": {
			"title": "Influencer",
			"description": "Gain 1,000 followers"
		},
		"_collectAchievements30": {
			"title": "Achievement Collector",
			"description": "Earn 30 achievements"
		},
		"_viewAchievements3min": {
			"title": "Likes Achievements",
			"description": "Look at your list of achievements for at least 3 minutes"
		},
		"_iLoveMisskey": {
			"title": "I Love Misskey",
			"description": "Post \"I ❤ #Misskey\"",
			"flavor": "Misskey's development team greatly appreciates your support!"
		},
		"_foundTreasure": {
			"title": "Treasure Hunt",
			"description": "You've found the hidden treasure"
		},
		"_client30min": {
			"title": "Short break",
			"description": "Keep Misskey opened for at least 30 minutes"
		},
		"_client60min": {
			"title": "No \"Miss\" in Misskey",
			"description": "Keep Misskey opened for at least 60 minutes"
		},
		"_noteDeletedWithin1min": {
			"title": "Nevermind",
			"description": "Delete a note within a minute of posting it"
		},
		"_postedAtLateNight": {
			"title": "Nocturnal",
			"description": "Post a note late at night",
			"flavor": "It's about time to go to bed."
		},
		"_postedAt0min0sec": {
			"title": "Speaking Clock",
			"description": "Post a note at 00:00",
			"flavor": "Click Click Click Claaang"
		},
		"_selfQuote": {
			"title": "Self-Reference",
			"description": "Quote your own note"
		},
		"_htl20npm": {
			"title": "Flowing Timeline",
			"description": "Have the speed of your home timeline exceed 20 npm (notes per minute)"
		},
		"_viewInstanceChart": {
			"title": "Analyst",
			"description": "View your instance's charts"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "Output \"hello world\" in the Scratchpad"
		},
		"_open3windows": {
			"title": "Multi-Window",
			"description": "Have at least 3 windows open at the same time"
		},
		"_driveFolderCircularReference": {
			"title": "Circular Reference",
			"description": "Attempt to create a recursively nested folder in Drive"
		},
		"_reactWithoutRead": {
			"title": "Did you really read that?",
			"description": "React on a note that's over 100 characters long within 3 seconds of it being posted"
		},
		"_clickedClickHere": {
			"title": "Click here",
			"description": "You've clicked here"
		},
		"_justPlainLucky": {
			"title": "Just Plain Lucky",
			"description": "Has a chance to be obtained with a probability of 0.005% every 10 seconds"
		},
		"_setNameToSyuilo": {
			"title": "God Complex",
			"description": "Set your name to \"syuilo\""
		},
		"_passedSinceAccountCreated1": {
			"title": "One Year Anniversary",
			"description": "One year has passed since your account was created"
		},
		"_passedSinceAccountCreated2": {
			"title": "Two Year Anniversary",
			"description": "Two years have passed since your account was created"
		},
		"_passedSinceAccountCreated3": {
			"title": "Three Year Anniversary",
			"description": "Three years have passed since your account was created"
		},
		"_loggedInOnBirthday": {
			"title": "Happy Birthday",
			"description": "Log in on your birthday"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Happy New Year!",
			"description": "Logged in on the first day of the year",
			"flavor": "To another great year on this instance"
		},
		"_cookieClicked": {
			"title": "A game in which you click cookies",
			"description": "Clicked the cookie",
			"flavor": "Wait, are you on the correct website?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Post the link to Brain Diver",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Test overflow",
			"description": "Trigger the notification test repeatedly within an extremely short time"
		},
		"_tutorialCompleted": {
			"title": "Misskey Elementary Course Diploma",
			"description": "Tutorial completed"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "The biggest object in the bubble game"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Double🤯",
			"description": "Two of the biggest objects in the bubble game at the same time",
			"flavor": "You can fill a lunch box like this 🤯 🤯 a bit."
		}
	},
	"showFile": "Show files",
	"notificationCreateTokenDescription": "If you did not create this, delete it in \"{text}\".",
	"manageAccessTokens": "Manage access tokens",
	"youGotNewFollower": "Yeṭṭafaṛ-ik·em-id",
	"followRequestAccepted": "Follow request accepted",
	"receiveFollowRequest": "Follow request received",
	"accept": "Accept",
	"reject": "Reject",
	"notificationNotificationWillBeDisplayedLikeThis": "Notifications look like this",
	"antennas": "Antennas",
	"blockedUsers": "Blocked users",
	"clips": "Clips",
	"customEmojis": "Custom Emoji",
	"favorites": "Favorites",
	"following": "Ig ṭṭafaṛ",
	"mutedUsers": "Muted users",
	"notes": "Notes",
	"lists": "Tibdarin"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"notificationPollEnded": "Poll results have become available",
	"notificationScheduledNotePosted": "Scheduled note has been posted",
	"notificationScheduledNotePostFailed": "Failed to post scheduled note",
	"notificationNewNote": "New note",
	"notificationRoleAssigned": "Role given",
	"notificationChatRoomInvitationReceived": "You have been invited to a chat room",
	"notificationAchievementEarned": "Achievement unlocked",
	"notificationLogin": "Someone logged in",
	"notificationCreateToken": "An access token has been created",
	"notificationTestNotification": "Test notification",
	"notificationExportOfXCompleted": "Export of {x} has been completed",
	"notificationLikedBySomeUsers": "{n} users liked your note",
	"notificationReactedBySomeUsers": "{n} users reacted",
	"notificationRenotedBySomeUsers": "Renote from {n} users",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "just setting up my msky",
			"description": "Post your first note",
			"flavor": "Have a good time with Misskey!"
		},
		"_notes10": {
			"title": "Some notes",
			"description": "Post 10 notes"
		},
		"_notes100": {
			"title": "A lot of notes",
			"description": "Post 100 notes"
		},
		"_notes500": {
			"title": "Covered in notes",
			"description": "Post 500 notes"
		},
		"_notes1000": {
			"title": "A mountain of notes",
			"description": "Post 1,000 notes"
		},
		"_notes5000": {
			"title": "Overflowing notes",
			"description": "Post 5,000 notes"
		},
		"_notes10000": {
			"title": "Supernote",
			"description": "Post 10,000 notes"
		},
		"_notes20000": {
			"title": "Need... more... notes...",
			"description": "Post 20,000 notes"
		},
		"_notes30000": {
			"title": "Notes notes notes!",
			"description": "Post 30,000 notes"
		},
		"_notes40000": {
			"title": "Note factory",
			"description": "Post 40,000 notes"
		},
		"_notes50000": {
			"title": "Planet of notes",
			"description": "Post 50,000 notes"
		},
		"_notes60000": {
			"title": "Note quasar",
			"description": "Post 60,000 notes"
		},
		"_notes70000": {
			"title": "Note black hole",
			"description": "Post 70,000 notes"
		},
		"_notes80000": {
			"title": "Note galaxy",
			"description": "Post 80,000 notes"
		},
		"_notes90000": {
			"title": "Note universe",
			"description": "Post 90,000 notes"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "Post 100,000 notes",
			"flavor": "You sure have a lot to say."
		},
		"_login3": {
			"title": "Beginner I",
			"description": "Log in for a total of 3 days",
			"flavor": "Starting today, just call me Misskist"
		},
		"_login7": {
			"title": "Beginner II",
			"description": "Log in for a total of 7 days",
			"flavor": "Feel like you've gotten the hang of things yet?"
		},
		"_login15": {
			"title": "Beginner III",
			"description": "Log in for a total of 15 days"
		},
		"_login30": {
			"title": "Misskist I",
			"description": "Log in for a total of 30 days"
		},
		"_login60": {
			"title": "Misskist II",
			"description": "Log in for a total of 60 days"
		},
		"_login100": {
			"title": "Misskist III",
			"description": "Log in for a total of 100 days",
			"flavor": "Violent Misskist"
		},
		"_login200": {
			"title": "Regular I",
			"description": "Log in for a total of 200 days"
		},
		"_login300": {
			"title": "Regular II",
			"description": "Log in for a total of 300 days"
		},
		"_login400": {
			"title": "Regular III",
			"description": "Log in for a total of 400 days"
		},
		"_login500": {
			"title": "Expert I",
			"description": "Log in for a total of 500 days",
			"flavor": "My friends, it has often been said that I like notes"
		},
		"_login600": {
			"title": "Expert II",
			"description": "Log in for a total of 600 days"
		},
		"_login700": {
			"title": "Expert III",
			"description": "Log in for a total of 700 days"
		},
		"_login800": {
			"title": "Master of Notes I",
			"description": "Log in for a total of 800 days"
		},
		"_login900": {
			"title": "Master of Notes II",
			"description": "Log in for a total of 900 days"
		},
		"_login1000": {
			"title": "Master of Notes III",
			"description": "Log in for a total of 1,000 days",
			"flavor": "Thank you for using Misskey!"
		},
		"_noteClipped1": {
			"title": "Must... clip...",
			"description": "Clip your first note"
		},
		"_noteFavorited1": {
			"title": "Stargazer",
			"description": "Favorite your first note"
		},
		"_myNoteFavorited1": {
			"title": "Seeking Stars",
			"description": "Have somebody else favorite one of your notes"
		},
		"_profileFilled": {
			"title": "Well-prepared",
			"description": "Set up your profile"
		},
		"_markedAsCat": {
			"title": "I Am a Cat",
			"description": "Mark your account as a cat",
			"flavor": "I'll give you a name later."
		},
		"_following1": {
			"title": "Following your first user",
			"description": "Follow a user"
		},
		"_following10": {
			"title": "Keep up... keep up...",
			"description": "Follow 10 users"
		},
		"_following50": {
			"title": "Lots of friends",
			"description": "Follow 50 accounts"
		},
		"_following100": {
			"title": "100 Friends",
			"description": "Follow 100 accounts"
		},
		"_following300": {
			"title": "Friend overload",
			"description": "Follow 300 accounts"
		},
		"_followers1": {
			"title": "First follower",
			"description": "Gain 1 follower"
		},
		"_followers10": {
			"title": "Follow me!",
			"description": "Gain 10 followers"
		},
		"_followers50": {
			"title": "Coming in crowds",
			"description": "Gain 50 followers"
		},
		"_followers100": {
			"title": "Popular",
			"description": "Gain 100 followers"
		},
		"_followers300": {
			"title": "Please form a single line",
			"description": "Gain 300 followers"
		},
		"_followers500": {
			"title": "Radio Tower",
			"description": "Gain 500 followers"
		},
		"_followers1000": {
			"title": "Influencer",
			"description": "Gain 1,000 followers"
		},
		"_collectAchievements30": {
			"title": "Achievement Collector",
			"description": "Earn 30 achievements"
		},
		"_viewAchievements3min": {
			"title": "Likes Achievements",
			"description": "Look at your list of achievements for at least 3 minutes"
		},
		"_iLoveMisskey": {
			"title": "I Love Misskey",
			"description": "Post \"I ❤ #Misskey\"",
			"flavor": "Misskey's development team greatly appreciates your support!"
		},
		"_foundTreasure": {
			"title": "Treasure Hunt",
			"description": "You've found the hidden treasure"
		},
		"_client30min": {
			"title": "Short break",
			"description": "Keep Misskey opened for at least 30 minutes"
		},
		"_client60min": {
			"title": "No \"Miss\" in Misskey",
			"description": "Keep Misskey opened for at least 60 minutes"
		},
		"_noteDeletedWithin1min": {
			"title": "Nevermind",
			"description": "Delete a note within a minute of posting it"
		},
		"_postedAtLateNight": {
			"title": "Nocturnal",
			"description": "Post a note late at night",
			"flavor": "It's about time to go to bed."
		},
		"_postedAt0min0sec": {
			"title": "Speaking Clock",
			"description": "Post a note at 00:00",
			"flavor": "Click Click Click Claaang"
		},
		"_selfQuote": {
			"title": "Self-Reference",
			"description": "Quote your own note"
		},
		"_htl20npm": {
			"title": "Flowing Timeline",
			"description": "Have the speed of your home timeline exceed 20 npm (notes per minute)"
		},
		"_viewInstanceChart": {
			"title": "Analyst",
			"description": "View your instance's charts"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "Output \"hello world\" in the Scratchpad"
		},
		"_open3windows": {
			"title": "Multi-Window",
			"description": "Have at least 3 windows open at the same time"
		},
		"_driveFolderCircularReference": {
			"title": "Circular Reference",
			"description": "Attempt to create a recursively nested folder in Drive"
		},
		"_reactWithoutRead": {
			"title": "Did you really read that?",
			"description": "React on a note that's over 100 characters long within 3 seconds of it being posted"
		},
		"_clickedClickHere": {
			"title": "Click here",
			"description": "You've clicked here"
		},
		"_justPlainLucky": {
			"title": "Just Plain Lucky",
			"description": "Has a chance to be obtained with a probability of 0.005% every 10 seconds"
		},
		"_setNameToSyuilo": {
			"title": "God Complex",
			"description": "Set your name to \"syuilo\""
		},
		"_passedSinceAccountCreated1": {
			"title": "One Year Anniversary",
			"description": "One year has passed since your account was created"
		},
		"_passedSinceAccountCreated2": {
			"title": "Two Year Anniversary",
			"description": "Two years have passed since your account was created"
		},
		"_passedSinceAccountCreated3": {
			"title": "Three Year Anniversary",
			"description": "Three years have passed since your account was created"
		},
		"_loggedInOnBirthday": {
			"title": "Happy Birthday",
			"description": "Log in on your birthday"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Happy New Year!",
			"description": "Logged in on the first day of the year",
			"flavor": "To another great year on this instance"
		},
		"_cookieClicked": {
			"title": "A game in which you click cookies",
			"description": "Clicked the cookie",
			"flavor": "Wait, are you on the correct website?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Post the link to Brain Diver",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Test overflow",
			"description": "Trigger the notification test repeatedly within an extremely short time"
		},
		"_tutorialCompleted": {
			"title": "Misskey Elementary Course Diploma",
			"description": "Tutorial completed"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "The biggest object in the bubble game"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Double🤯",
			"description": "Two of the biggest objects in the bubble game at the same time",
			"flavor": "You can fill a lunch box like this 🤯 🤯 a bit."
		}
	},
	"showFile": "Show files",
	"notificationCreateTokenDescription": "If you did not create this, delete it in \"{text}\".",
	"manageAccessTokens": "Manage access tokens",
	"youGotNewFollower": "ಹಿಂಬಾಲಿಸಿದರು",
	"followRequestAccepted": "ಹಿಂಬಾಲನೆ ವಿನಂತಿ ಸ್ವೀಕರಿಸಲಾಯಿತು",
	"receiveFollowRequest": "ಹಿಂಬಾಲನೆ ವಿನಂತಿ ಬಂದಿದೆ",
	"accept": "Accept",
	"reject": "Reject",
	"notificationNotificationWillBeDisplayedLikeThis": "Notifications look like this",
	"antennas": "Antennas",
	"blockedUsers": "Blocked users",
	"clips": "Clips",
	"customEmojis": "Custom Emoji",
	"favorites": "ಮೆಚ್ಚಿನವುಗಳು",
	"following": "Following",
	"mutedUsers": "Muted users",
	"notes": "Notes",
	"lists": "Lists"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"notificationPollEnded": "투표 결과가 발표되었습니다",
	"notificationScheduledNotePosted": "예약 노트가 게시됐습니다.",
	"notificationScheduledNotePostFailed": "예약 노트의 게시에 실패했습니다.",
	"notificationNewNote": "새 게시물",
	"notificationRoleAssigned": "역할이 부여 되었습니다.",
	"notificationChatRoomInvitationReceived": "채팅방에 초대되었습니다",
	"notificationAchievementEarned": "도전 과제를 달성했습니다",
	"notificationLogin": "로그인 알림이 있습니다",
	"notificationCreateToken": "액세스 토큰이 생성되었습니다",
	"notificationTestNotification": "알림 테스트",
	"notificationExportOfXCompleted": "{x} 추출에 성공했습니다.",
	"notificationLikedBySomeUsers": "{n}명이 좋아요를 했습니다",
	"notificationReactedBySomeUsers": "{n}명이 리액션했습니다",
	"notificationRenotedBySomeUsers": "{n}명이 리노트했습니다",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "미스키 계정 만들었어요",
			"description": "첫 노트를 게시했다",
			"flavor": "Misskey에 어서 오세요!"
		},
		"_notes10": {
			"title": "몇 가지 노트",
			"description": "10개의 노트를 게시했다"
		},
		"_notes100": {
			"title": "많은 노트",
			"description": "100개의 노트를 게시했다"
		},
		"_notes500": {
			"title": "노트 범벅",
			"description": "500개의 노트를 게시했다"
		},
		"_notes1000": {
			"title": "노트가 산더미",
			"description": "1,000개의 노트를 게시했다"
		},
		"_notes5000": {
			"title": "솟아나는 노트",
			"description": "5,000개의 노트를 게시했다"
		},
		"_notes10000": {
			"title": "슈퍼 노트",
			"description": "10,000개의 노트를 게시했다"
		},
		"_notes20000": {
			"title": "노트가 더 필요해요",
			"description": "20,000개의 노트를 게시했다"
		},
		"_notes30000": {
			"title": "노트노트노트",
			"description": "30,000개의 노트를 게시했다"
		},
		"_notes40000": {
			"title": "노트 공장",
			"description": "40,000개의 노트를 게시했다"
		},
		"_notes50000": {
			"title": "노트 행성",
			"description": "50,000개의 노트를 게시했다"
		},
		"_notes60000": {
			"title": "노트 퀘이사",
			"description": "60,000개의 노트를 게시했다"
		},
		"_notes70000": {
			"title": "노트 블랙홀",
			"description": "70,000개의 노트를 게시했다"
		},
		"_notes80000": {
			"title": "노트 은하",
			"description": "80,000개의 노트를 게시했다"
		},
		"_notes90000": {
			"title": "노트 우주",
			"description": "90,000개의 노트를 게시했다"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "100,000개의 노트를 게시했다",
			"flavor": "이렇게나 쓸 게 있어요?"
		},
		"_login3": {
			"title": "초보자 I",
			"description": "총 로그인한 날이 3일",
			"flavor": "오늘부터 여러분도 미스키스트랍니다"
		},
		"_login7": {
			"title": "초보자 II",
			"description": "총 로그인한 날이 7일",
			"flavor": "슬슬 익숙해지셨나요?"
		},
		"_login15": {
			"title": "초보자 III",
			"description": "총 로그인한 날이 15일"
		},
		"_login30": {
			"title": "미스키스트 I",
			"description": "총 로그인한 날이 30일"
		},
		"_login60": {
			"title": "미스키스트 II",
			"description": "총 로그인한 날이 60일"
		},
		"_login100": {
			"title": "미스키스트 III",
			"description": "총 로그인한 날이 100일",
			"flavor": "그 유저, 미스키스트이다"
		},
		"_login200": {
			"title": "단골 I",
			"description": "총 로그인한 날이 200일"
		},
		"_login300": {
			"title": "단골 II",
			"description": "총 로그인한 날이 300일"
		},
		"_login400": {
			"title": "단골 III",
			"description": "총 로그인한 날이 400일"
		},
		"_login500": {
			"title": "베테랑 I",
			"description": "총 로그인한 날이 500일",
			"flavor": "제군, 나는 노트가 좋다"
		},
		"_login600": {
			"title": "베테랑 II",
			"description": "총 로그인한 날이 600일"
		},
		"_login700": {
			"title": "베테랑 III",
			"description": "총 로그인한 날이 700일"
		},
		"_login800": {
			"title": "노트 마스터 I",
			"description": "총 로그인한 날이 800일"
		},
		"_login900": {
			"title": "노트 마스터 II",
			"description": "총 로그인한 날이 900일"
		},
		"_login1000": {
			"title": "노트 마스터 III",
			"description": "총 로그인한 날이 1,000일",
			"flavor": "Misskey를 사용해 주셔서 감사합니다!"
		},
		"_noteClipped1": {
			"title": "클립할 수밖에 없었어",
			"description": "처음으로 노트를 클립했다"
		},
		"_noteFavorited1": {
			"title": "별을 바라보는 자",
			"description": "처음으로 노트를 즐겨찾기했다"
		},
		"_myNoteFavorited1": {
			"title": "별을 원하는 자",
			"description": "다른 사람이 당신의 노트를 즐겨찾기했다"
		},
		"_profileFilled": {
			"title": "준비 완료",
			"description": "프로필 설정을 완료했다"
		},
		"_markedAsCat": {
			"title": "나는 고양이다냥!",
			"description": "계정을 고양이로 설정했다냥",
			"flavor": "냐냐냐냐냐냐아아아아앙!"
		},
		"_following1": {
			"title": "첫 팔로우",
			"description": "유저를 처음으로 팔로우했다"
		},
		"_following10": {
			"title": "팔로우, 팔로우",
			"description": "10명의 유저를 팔로우했다"
		},
		"_following50": {
			"title": "친구 잔뜩",
			"description": "50명의 유저를 팔로우했다"
		},
		"_following100": {
			"title": "주소록 한 권으론 부족해",
			"description": "100명의 유저를 팔로우했다"
		},
		"_following300": {
			"title": "친구가 넘쳐나",
			"description": "300명의 유저를 팔로우했다"
		},
		"_followers1": {
			"title": "첫 팔로워",
			"description": "유저가 처음으로 팔로잉했다"
		},
		"_followers10": {
			"title": "팔로우 미!",
			"description": "10명의 유저가 팔로우했다"
		},
		"_followers50": {
			"title": "이곳저곳",
			"description": "50명의 유저가 팔로우했다"
		},
		"_followers100": {
			"title": "인기왕",
			"description": "100명의 유저가 팔로우했다"
		},
		"_followers300": {
			"title": "줄 좀 서봐요",
			"description": "100명의 유저가 팔로우했다"
		},
		"_followers500": {
			"title": "기지국",
			"description": "500명의 유저가 팔로우했다"
		},
		"_followers1000": {
			"title": "유명인사",
			"description": "1,000명의 유저가 팔로우했다"
		},
		"_collectAchievements30": {
			"title": "도전 과제 콜렉터",
			"description": "30개의 도전과제를 획득했다"
		},
		"_viewAchievements3min": {
			"title": "저 도전과제 좋아해요",
			"description": "도전 과제 목록을 3분 이상 쳐다봤다"
		},
		"_iLoveMisskey": {
			"title": "I Love Misskey",
			"description": "\"I ❤ #Misskey\"를 게시했다",
			"flavor": "Misskey를 이용해 주셔서 감사합니다! ― 개발 팀"
		},
		"_foundTreasure": {
			"title": "보물찾기",
			"description": "숨겨진 보물을 발견했다"
		},
		"_client30min": {
			"title": "잠시 쉬어요",
			"description": "클라이언트를 시작하고 30분이 경과했다"
		},
		"_client60min": {
			"title": "No \"Miss\" in Misskey",
			"description": "클라이언트를 시작하고 60분이 경과했다"
		},
		"_noteDeletedWithin1min": {
			"title": "있었는데요 없었습니다",
			"description": "노트를 게시한 후 1분 이내에 삭제했다"
		},
		"_postedAtLateNight": {
			"title": "올빼미",
			"description": "한밤중에 노트를 게시했다",
			"flavor": "잠 좀 자세요. 걱정돼요."
		},
		"_postedAt0min0sec": {
			"title": "정각",
			"description": "0분 0초 정각에 노트를 게시했다",
			"flavor": "째깍 째깍 째깍 땡!"
		},
		"_selfQuote": {
			"title": "혼잣말",
			"description": "자기 노트를 인용했다"
		},
		"_htl20npm": {
			"title": "타임라인 폭주 중",
			"description": "1분 사이에 홈 타임라인에 노트가 20개 넘게 생성되었다"
		},
		"_viewInstanceChart": {
			"title": "애널리스트",
			"description": "서버의 차트를 열었다"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "스크래치패드에서 hello world를 출력했다"
		},
		"_open3windows": {
			"title": "멀티 윈도우",
			"description": "3개 이상의 창을 열었다"
		},
		"_driveFolderCircularReference": {
			"title": "순환 참조",
			"description": "드라이브 폴더에 스스로를 넣게 했다"
		},
		"_reactWithoutRead": {
			"title": "읽고 답하긴 하시는 건가요?",
			"description": "100자가 넘는 노트를 게시한 지 3초 안에 리액션했다"
		},
		"_clickedClickHere": {
			"title": "여길 눌러보세요",
			"description": "여기를 눌렀다"
		},
		"_justPlainLucky": {
			"title": "그냥 운이 좋았어",
			"description": "매 10초마다 0.01%의 확률로 달성된다"
		},
		"_setNameToSyuilo": {
			"title": "신 콤플렉스",
			"description": "이름을 syuilo로 설정했다"
		},
		"_passedSinceAccountCreated1": {
			"title": "1주년",
			"description": "계정을 생성하고 1년이 지났다"
		},
		"_passedSinceAccountCreated2": {
			"title": "2주년",
			"description": "계정을 생성하고 2년이 지났다"
		},
		"_passedSinceAccountCreated3": {
			"title": "3주년",
			"description": "계정을 생성하고 3년이 지났다"
		},
		"_loggedInOnBirthday": {
			"title": "생일 축하합니다!",
			"description": "생일에 로그인했다"
		},
		"_loggedInOnNewYearsDay": {
			"title": "새해 복 많이 받으세요",
			"description": "새해 첫 날에 로그인했다",
			"flavor": "올해에도 저희 서버에 관심을 가져 주셔서 감사합니다"
		},
		"_cookieClicked": {
			"title": "쿠키를 클릭하는 게임",
			"description": "쿠키를 클릭했다",
			"flavor": "소프트웨어 착각하지 않으셨나요?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Brain Diver로의 링크를 첨부했다",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "테스트 과잉",
			"description": "매우 짧은 시간 안에 알림 테스트를 여러 번 수행했다"
		},
		"_tutorialCompleted": {
			"title": "Misskey 입문자 과정 수료증",
			"description": "튜토리얼을 완료했다"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "버블 게임에서 가장 큰 물건을 내놓았다"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "더블 🤯",
			"description": "버블게임에서 가장 큰 물건 2개를 동시에 내놓았다",
			"flavor": "이 정도만\u3000도시락통에\u3000🤯\u3000🤯\u3000조금만 더"
		}
	},
	"showFile": "파일 표시하기",
	"notificationCreateTokenDescription": "만약 기억이 나지 않는다면 '{text}'를 통해 액세스 토큰을 삭제해 주세요.",
	"manageAccessTokens": "액세스 토큰 관리",
	"youGotNewFollower": "새로운 팔로워가 있습니다",
	"followRequestAccepted": "팔로우가 수락되었습니다",
	"receiveFollowRequest": "새로운 팔로우 요청이 있습니다",
	"accept": "수락하기",
	"reject": "거절하기",
	"notificationNotificationWillBeDisplayedLikeThis": "알림이 이렇게 표시됩니다",
	"antennas": "안테나",
	"blockedUsers": "차단한 유저",
	"clips": "클립",
	"customEmojis": "커스텀 이모지",
	"favorites": "즐겨찾기",
	"following": "팔로잉",
	"mutedUsers": "뮤트한 유저",
	"notes": "노트",
	"lists": "리스트"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"notificationPollEnded": "Poll results have become available",
	"notificationScheduledNotePosted": "Scheduled note has been posted",
	"notificationScheduledNotePostFailed": "Failed to post scheduled note",
	"notificationNewNote": "New note",
	"notificationRoleAssigned": "Role given",
	"notificationChatRoomInvitationReceived": "You have been invited to a chat room",
	"notificationAchievementEarned": "Achievement unlocked",
	"notificationLogin": "Someone logged in",
	"notificationCreateToken": "An access token has been created",
	"notificationTestNotification": "Test notification",
	"notificationExportOfXCompleted": "Export of {x} has been completed",
	"notificationLikedBySomeUsers": "{n} users liked your note",
	"notificationReactedBySomeUsers": "{n} users reacted",
	"notificationRenotedBySomeUsers": "Renote from {n} users",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "just setting up my msky",
			"description": "Post your first note",
			"flavor": "Have a good time with Misskey!"
		},
		"_notes10": {
			"title": "Some notes",
			"description": "Post 10 notes"
		},
		"_notes100": {
			"title": "A lot of notes",
			"description": "Post 100 notes"
		},
		"_notes500": {
			"title": "Covered in notes",
			"description": "Post 500 notes"
		},
		"_notes1000": {
			"title": "A mountain of notes",
			"description": "Post 1,000 notes"
		},
		"_notes5000": {
			"title": "Overflowing notes",
			"description": "Post 5,000 notes"
		},
		"_notes10000": {
			"title": "Supernote",
			"description": "Post 10,000 notes"
		},
		"_notes20000": {
			"title": "Need... more... notes...",
			"description": "Post 20,000 notes"
		},
		"_notes30000": {
			"title": "Notes notes notes!",
			"description": "Post 30,000 notes"
		},
		"_notes40000": {
			"title": "Note factory",
			"description": "Post 40,000 notes"
		},
		"_notes50000": {
			"title": "Planet of notes",
			"description": "Post 50,000 notes"
		},
		"_notes60000": {
			"title": "Note quasar",
			"description": "Post 60,000 notes"
		},
		"_notes70000": {
			"title": "Note black hole",
			"description": "Post 70,000 notes"
		},
		"_notes80000": {
			"title": "Note galaxy",
			"description": "Post 80,000 notes"
		},
		"_notes90000": {
			"title": "Note universe",
			"description": "Post 90,000 notes"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "Post 100,000 notes",
			"flavor": "You sure have a lot to say."
		},
		"_login3": {
			"title": "Beginner I",
			"description": "Log in for a total of 3 days",
			"flavor": "Starting today, just call me Misskist"
		},
		"_login7": {
			"title": "Beginner II",
			"description": "Log in for a total of 7 days",
			"flavor": "Feel like you've gotten the hang of things yet?"
		},
		"_login15": {
			"title": "Beginner III",
			"description": "Log in for a total of 15 days"
		},
		"_login30": {
			"title": "Misskist I",
			"description": "Log in for a total of 30 days"
		},
		"_login60": {
			"title": "Misskist II",
			"description": "Log in for a total of 60 days"
		},
		"_login100": {
			"title": "Misskist III",
			"description": "Log in for a total of 100 days",
			"flavor": "Violent Misskist"
		},
		"_login200": {
			"title": "Regular I",
			"description": "Log in for a total of 200 days"
		},
		"_login300": {
			"title": "Regular II",
			"description": "Log in for a total of 300 days"
		},
		"_login400": {
			"title": "Regular III",
			"description": "Log in for a total of 400 days"
		},
		"_login500": {
			"title": "Expert I",
			"description": "Log in for a total of 500 days",
			"flavor": "My friends, it has often been said that I like notes"
		},
		"_login600": {
			"title": "Expert II",
			"description": "Log in for a total of 600 days"
		},
		"_login700": {
			"title": "Expert III",
			"description": "Log in for a total of 700 days"
		},
		"_login800": {
			"title": "Master of Notes I",
			"description": "Log in for a total of 800 days"
		},
		"_login900": {
			"title": "Master of Notes II",
			"description": "Log in for a total of 900 days"
		},
		"_login1000": {
			"title": "Master of Notes III",
			"description": "Log in for a total of 1,000 days",
			"flavor": "Thank you for using Misskey!"
		},
		"_noteClipped1": {
			"title": "Must... clip...",
			"description": "Clip your first note"
		},
		"_noteFavorited1": {
			"title": "Stargazer",
			"description": "Favorite your first note"
		},
		"_myNoteFavorited1": {
			"title": "Seeking Stars",
			"description": "Have somebody else favorite one of your notes"
		},
		"_profileFilled": {
			"title": "Well-prepared",
			"description": "Set up your profile"
		},
		"_markedAsCat": {
			"title": "I Am a Cat",
			"description": "Mark your account as a cat",
			"flavor": "I'll give you a name later."
		},
		"_following1": {
			"title": "Following your first user",
			"description": "Follow a user"
		},
		"_following10": {
			"title": "Keep up... keep up...",
			"description": "Follow 10 users"
		},
		"_following50": {
			"title": "Lots of friends",
			"description": "Follow 50 accounts"
		},
		"_following100": {
			"title": "100 Friends",
			"description": "Follow 100 accounts"
		},
		"_following300": {
			"title": "Friend overload",
			"description": "Follow 300 accounts"
		},
		"_followers1": {
			"title": "First follower",
			"description": "Gain 1 follower"
		},
		"_followers10": {
			"title": "Follow me!",
			"description": "Gain 10 followers"
		},
		"_followers50": {
			"title": "Coming in crowds",
			"description": "Gain 50 followers"
		},
		"_followers100": {
			"title": "Popular",
			"description": "Gain 100 followers"
		},
		"_followers300": {
			"title": "Please form a single line",
			"description": "Gain 300 followers"
		},
		"_followers500": {
			"title": "Radio Tower",
			"description": "Gain 500 followers"
		},
		"_followers1000": {
			"title": "Influencer",
			"description": "Gain 1,000 followers"
		},
		"_collectAchievements30": {
			"title": "Achievement Collector",
			"description": "Earn 30 achievements"
		},
		"_viewAchievements3min": {
			"title": "Likes Achievements",
			"description": "Look at your list of achievements for at least 3 minutes"
		},
		"_iLoveMisskey": {
			"title": "I Love Misskey",
			"description": "Post \"I ❤ #Misskey\"",
			"flavor": "Misskey's development team greatly appreciates your support!"
		},
		"_foundTreasure": {
			"title": "Treasure Hunt",
			"description": "You've found the hidden treasure"
		},
		"_client30min": {
			"title": "Short break",
			"description": "Keep Misskey opened for at least 30 minutes"
		},
		"_client60min": {
			"title": "No \"Miss\" in Misskey",
			"description": "Keep Misskey opened for at least 60 minutes"
		},
		"_noteDeletedWithin1min": {
			"title": "Nevermind",
			"description": "Delete a note within a minute of posting it"
		},
		"_postedAtLateNight": {
			"title": "Nocturnal",
			"description": "Post a note late at night",
			"flavor": "It's about time to go to bed."
		},
		"_postedAt0min0sec": {
			"title": "Speaking Clock",
			"description": "Post a note at 00:00",
			"flavor": "Click Click Click Claaang"
		},
		"_selfQuote": {
			"title": "Self-Reference",
			"description": "Quote your own note"
		},
		"_htl20npm": {
			"title": "Flowing Timeline",
			"description": "Have the speed of your home timeline exceed 20 npm (notes per minute)"
		},
		"_viewInstanceChart": {
			"title": "Analyst",
			"description": "View your instance's charts"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "Output \"hello world\" in the Scratchpad"
		},
		"_open3windows": {
			"title": "Multi-Window",
			"description": "Have at least 3 windows open at the same time"
		},
		"_driveFolderCircularReference": {
			"title": "Circular Reference",
			"description": "Attempt to create a recursively nested folder in Drive"
		},
		"_reactWithoutRead": {
			"title": "Did you really read that?",
			"description": "React on a note that's over 100 characters long within 3 seconds of it being posted"
		},
		"_clickedClickHere": {
			"title": "Click here",
			"description": "You've clicked here"
		},
		"_justPlainLucky": {
			"title": "Just Plain Lucky",
			"description": "Has a chance to be obtained with a probability of 0.005% every 10 seconds"
		},
		"_setNameToSyuilo": {
			"title": "God Complex",
			"description": "Set your name to \"syuilo\""
		},
		"_passedSinceAccountCreated1": {
			"title": "One Year Anniversary",
			"description": "One year has passed since your account was created"
		},
		"_passedSinceAccountCreated2": {
			"title": "Two Year Anniversary",
			"description": "Two years have passed since your account was created"
		},
		"_passedSinceAccountCreated3": {
			"title": "Three Year Anniversary",
			"description": "Three years have passed since your account was created"
		},
		"_loggedInOnBirthday": {
			"title": "Happy Birthday",
			"description": "Log in on your birthday"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Happy New Year!",
			"description": "Logged in on the first day of the year",
			"flavor": "To another great year on this instance"
		},
		"_cookieClicked": {
			"title": "A game in which you click cookies",
			"description": "Clicked the cookie",
			"flavor": "Wait, are you on the correct website?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Post the link to Brain Diver",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Test overflow",
			"description": "Trigger the notification test repeatedly within an extremely short time"
		},
		"_tutorialCompleted": {
			"title": "Misskey Elementary Course Diploma",
			"description": "Tutorial completed"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "The biggest object in the bubble game"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Double🤯",
			"description": "Two of the biggest objects in the bubble game at the same time",
			"flavor": "You can fill a lunch box like this 🤯 🤯 a bit."
		}
	},
	"showFile": "Bestanden weergeven",
	"notificationCreateTokenDescription": "If you did not create this, delete it in \"{text}\".",
	"manageAccessTokens": "Toegangstokens beheren",
	"youGotNewFollower": "volgde jou",
	"followRequestAccepted": "Volgverzoek geaccepteerd",
	"receiveFollowRequest": "Volgverzoek ontvangen",
	"accept": "Accepteren",
	"reject": "Weigeren",
	"notificationNotificationWillBeDisplayedLikeThis": "Notifications look like this",
	"antennas": "Antennes",
	"blockedUsers": "Geblokkeerde gebruikers",
	"clips": "Clips",
	"customEmojis": "Eigen emoji",
	"favorites": "Toevoegen aan favorieten",
	"following": "Volgend",
	"mutedUsers": "Gedempte gebruikers",
	"notes": "Notities",
	"lists": "Lijsten"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"notificationPollEnded": "Poll results have become available",
	"notificationScheduledNotePosted": "Scheduled note has been posted",
	"notificationScheduledNotePostFailed": "Failed to post scheduled note",
	"notificationNewNote": "New note",
	"notificationRoleAssigned": "Role given",
	"notificationChatRoomInvitationReceived": "You have been invited to a chat room",
	"notificationAchievementEarned": "Prestasjon låst opp",
	"notificationLogin": "Someone logged in",
	"notificationCreateToken": "An access token has been created",
	"notificationTestNotification": "Test notification",
	"notificationExportOfXCompleted": "Export of {x} has been completed",
	"notificationLikedBySomeUsers": "{n} users liked your note",
	"notificationReactedBySomeUsers": "{n} users reacted",
	"notificationRenotedBySomeUsers": "Renote from {n} users",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "just setting up my msky",
			"description": "Post your first note",
			"flavor": "Have a good time with Misskey!"
		},
		"_notes10": {
			"title": "Noen Notes",
			"description": "Post 10 notes"
		},
		"_notes100": {
			"title": "Mange Notes",
			"description": "Post 100 notes"
		},
		"_notes500": {
			"title": "Dekket i Notes",
			"description": "Post 500 notes"
		},
		"_notes1000": {
			"title": "Et fjell av Notes",
			"description": "Post 1,000 notes"
		},
		"_notes5000": {
			"title": "Overfylte Notes",
			"description": "Post 5,000 notes"
		},
		"_notes10000": {
			"title": "Super Notes",
			"description": "Post 10,000 notes"
		},
		"_notes20000": {
			"title": "Trenger... mer... Notes...",
			"description": "Post 20,000 notes"
		},
		"_notes30000": {
			"title": "Notes Notes Notes!",
			"description": "Post 30,000 notes"
		},
		"_notes40000": {
			"title": "Note fabrikk",
			"description": "Post 40,000 notes"
		},
		"_notes50000": {
			"title": "Planet av Notes",
			"description": "Post 50,000 notes"
		},
		"_notes60000": {
			"title": "Note quasar",
			"description": "Post 60,000 notes"
		},
		"_notes70000": {
			"title": "Note black hole",
			"description": "Post 70,000 notes"
		},
		"_notes80000": {
			"title": "Note galaxy",
			"description": "Post 80,000 notes"
		},
		"_notes90000": {
			"title": "Note universe",
			"description": "Post 90,000 notes"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "Post 100,000 notes",
			"flavor": "Du har jammen mye å si."
		},
		"_login3": {
			"title": "Beginner I",
			"description": "Log in for a total of 3 days",
			"flavor": "Starting today, just call me Misskist"
		},
		"_login7": {
			"title": "Beginner II",
			"description": "Log in for a total of 7 days",
			"flavor": "Feel like you've gotten the hang of things yet?"
		},
		"_login15": {
			"title": "Beginner III",
			"description": "Log in for a total of 15 days"
		},
		"_login30": {
			"title": "Misskist I",
			"description": "Log in for a total of 30 days"
		},
		"_login60": {
			"title": "Misskist II",
			"description": "Log in for a total of 60 days"
		},
		"_login100": {
			"title": "Misskist III",
			"description": "Log in for a total of 100 days",
			"flavor": "Violent Misskist"
		},
		"_login200": {
			"title": "Regular I",
			"description": "Log in for a total of 200 days"
		},
		"_login300": {
			"title": "Regular II",
			"description": "Log in for a total of 300 days"
		},
		"_login400": {
			"title": "Regular III",
			"description": "Log in for a total of 400 days"
		},
		"_login500": {
			"title": "Expert I",
			"description": "Log in for a total of 500 days",
			"flavor": "My friends, it has often been said that I like notes"
		},
		"_login600": {
			"title": "Expert II",
			"description": "Log in for a total of 600 days"
		},
		"_login700": {
			"title": "Expert III",
			"description": "Log in for a total of 700 days"
		},
		"_login800": {
			"title": "Master of Notes I",
			"description": "Log in for a total of 800 days"
		},
		"_login900": {
			"title": "Master of Notes II",
			"description": "Log in for a total of 900 days"
		},
		"_login1000": {
			"title": "Master of Notes III",
			"description": "Log in for a total of 1,000 days",
			"flavor": "Thank you for using Misskey!"
		},
		"_noteClipped1": {
			"title": "Must... clip...",
			"description": "Clip your first note"
		},
		"_noteFavorited1": {
			"title": "Stjernekikker",
			"description": "Favorite your first note"
		},
		"_myNoteFavorited1": {
			"title": "Jeg vil gjerne få en stjerne",
			"description": "Have somebody else favorite one of your notes"
		},
		"_profileFilled": {
			"title": "Well-prepared",
			"description": "Set up your profile"
		},
		"_markedAsCat": {
			"title": "I Am a Cat",
			"description": "Mark your account as a cat",
			"flavor": "I'll give you a name later."
		},
		"_following1": {
			"title": "Following your first user",
			"description": "Follow a user"
		},
		"_following10": {
			"title": "Keep up... keep up...",
			"description": "Follow 10 users"
		},
		"_following50": {
			"title": "Mange venner",
			"description": "Follow 50 accounts"
		},
		"_following100": {
			"title": "100 venner",
			"description": "Follow 100 accounts"
		},
		"_following300": {
			"title": "For mange venner",
			"description": "Follow 300 accounts"
		},
		"_followers1": {
			"title": "First follower",
			"description": "Gain 1 follower"
		},
		"_followers10": {
			"title": "Følg meg!",
			"description": "Gain 10 followers"
		},
		"_followers50": {
			"title": "Coming in crowds",
			"description": "Gain 50 followers"
		},
		"_followers100": {
			"title": "Populær",
			"description": "Gain 100 followers"
		},
		"_followers300": {
			"title": "Please form a single line",
			"description": "Gain 300 followers"
		},
		"_followers500": {
			"title": "Radio Tower",
			"description": "Gain 500 followers"
		},
		"_followers1000": {
			"title": "Influencer",
			"description": "Gain 1,000 followers"
		},
		"_collectAchievements30": {
			"title": "Achievement Collector",
			"description": "Earn 30 achievements"
		},
		"_viewAchievements3min": {
			"title": "Likes Achievements",
			"description": "Look at your list of achievements for at least 3 minutes"
		},
		"_iLoveMisskey": {
			"title": "I Love Misskey",
			"description": "Post \"I ❤ #Misskey\"",
			"flavor": "Misskey's development team greatly appreciates your support!"
		},
		"_foundTreasure": {
			"title": "Treasure Hunt",
			"description": "You've found the hidden treasure"
		},
		"_client30min": {
			"title": "Short break",
			"description": "Keep Misskey opened for at least 30 minutes"
		},
		"_client60min": {
			"title": "No \"Miss\" in Misskey",
			"description": "Keep Misskey opened for at least 60 minutes"
		},
		"_noteDeletedWithin1min": {
			"title": "Nevermind",
			"description": "Delete a note within a minute of posting it"
		},
		"_postedAtLateNight": {
			"title": "Nocturnal",
			"description": "Post a note late at night",
			"flavor": "Det er på tide å gå til sengs."
		},
		"_postedAt0min0sec": {
			"title": "Speaking Clock",
			"description": "Post a note at 00:00",
			"flavor": "Click Click Click Claaang"
		},
		"_selfQuote": {
			"title": "Self-Reference",
			"description": "Quote your own note"
		},
		"_htl20npm": {
			"title": "Flowing Timeline",
			"description": "Have the speed of your home timeline exceed 20 npm (notes per minute)"
		},
		"_viewInstanceChart": {
			"title": "Analyst",
			"description": "View your instance's charts"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "Output \"hello world\" in the Scratchpad"
		},
		"_open3windows": {
			"title": "Multi-Window",
			"description": "Have at least 3 windows open at the same time"
		},
		"_driveFolderCircularReference": {
			"title": "Rundskrivreferanse",
			"description": "Attempt to create a recursively nested folder in Drive"
		},
		"_reactWithoutRead": {
			"title": "Leste du det virkelig?",
			"description": "React on a note that's over 100 characters long within 3 seconds of it being posted"
		},
		"_clickedClickHere": {
			"title": "Klikk her",
			"description": "Du har klikket her"
		},
		"_justPlainLucky": {
			"title": "Rett og slett heldig",
			"description": "Has a chance to be obtained with a probability of 0.005% every 10 seconds"
		},
		"_setNameToSyuilo": {
			"title": "God Complex",
			"description": "Du satte navnet ditt til \"syuilo\""
		},
		"_passedSinceAccountCreated1": {
			"title": "Ett års jubileum",
			"description": "Det har gått ett år siden kontoen din ble opprettet"
		},
		"_passedSinceAccountCreated2": {
			"title": "To års jubileum",
			"description": "Det har gått to år siden kontoen din ble opprettet"
		},
		"_passedSinceAccountCreated3": {
			"title": "Tre års jubileum",
			"description": "Det har gått tre år siden kontoen din ble opprettet"
		},
		"_loggedInOnBirthday": {
			"title": "Gratulerer med dagen",
			"description": "Du logget inn på bursdagen din"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Godt nytt år",
			"description": "Du logget inn på årets første dag",
			"flavor": "To another great year on this instance"
		},
		"_cookieClicked": {
			"title": "A game in which you click cookies",
			"description": "Du klikket på kjeksen",
			"flavor": "Er du på riktig nettsted?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Post the link to Brain Diver",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Test overflow",
			"description": "Trigger the notification test repeatedly within an extremely short time"
		},
		"_tutorialCompleted": {
			"title": "Misskey Elementary Course Diploma",
			"description": "Tutorial completed"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "The biggest object in the bubble game"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Double🤯",
			"description": "Two of the biggest objects in the bubble game at the same time",
			"flavor": "You can fill a lunch box like this 🤯 🤯 a bit."
		}
	},
	"showFile": "Show files",
	"notificationCreateTokenDescription": "If you did not create this, delete it in \"{text}\".",
	"manageAccessTokens": "Manage access tokens",
	"youGotNewFollower": "fulgte deg",
	"followRequestAccepted": "Følgeforespørsel akseptert",
	"receiveFollowRequest": "Follow request received",
	"accept": "Tillatt",
	"reject": "Avslå",
	"notificationNotificationWillBeDisplayedLikeThis": "Notifications look like this",
	"antennas": "Antenner",
	"blockedUsers": "Blokkerte brukere",
	"clips": "Clips",
	"customEmojis": "Custom Emoji",
	"favorites": "Favoritter",
	"following": "Følger",
	"mutedUsers": "Skjulte brukere",
	"notes": "Notes",
	"lists": "Lister"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"notificationPollEnded": "Wyniki ankiety stały się dostępne",
	"notificationScheduledNotePosted": "Scheduled note has been posted",
	"notificationScheduledNotePostFailed": "Failed to post scheduled note",
	"notificationNewNote": "New note",
	"notificationRoleAssigned": "Role given",
	"notificationChatRoomInvitationReceived": "You have been invited to a chat room",
	"notificationAchievementEarned": "Achievement unlocked",
	"notificationLogin": "Someone logged in",
	"notificationCreateToken": "An access token has been created",
	"notificationTestNotification": "Test notification",
	"notificationExportOfXCompleted": "Export of {x} has been completed",
	"notificationLikedBySomeUsers": "{n} users liked your note",
	"notificationReactedBySomeUsers": "{n} users reacted",
	"notificationRenotedBySomeUsers": "Renote from {n} users",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "just setting up my msky",
			"description": "Post your first note",
			"flavor": "Have a good time with Misskey!"
		},
		"_notes10": {
			"title": "Some notes",
			"description": "Post 10 notes"
		},
		"_notes100": {
			"title": "A lot of notes",
			"description": "Post 100 notes"
		},
		"_notes500": {
			"title": "Covered in notes",
			"description": "Post 500 notes"
		},
		"_notes1000": {
			"title": "A mountain of notes",
			"description": "Post 1,000 notes"
		},
		"_notes5000": {
			"title": "Overflowing notes",
			"description": "Post 5,000 notes"
		},
		"_notes10000": {
			"title": "Supernote",
			"description": "Post 10,000 notes"
		},
		"_notes20000": {
			"title": "Need... more... notes...",
			"description": "Post 20,000 notes"
		},
		"_notes30000": {
			"title": "Notes notes notes!",
			"description": "Post 30,000 notes"
		},
		"_notes40000": {
			"title": "Note factory",
			"description": "Post 40,000 notes"
		},
		"_notes50000": {
			"title": "Planet of notes",
			"description": "Post 50,000 notes"
		},
		"_notes60000": {
			"title": "Note quasar",
			"description": "Post 60,000 notes"
		},
		"_notes70000": {
			"title": "Note black hole",
			"description": "Post 70,000 notes"
		},
		"_notes80000": {
			"title": "Note galaxy",
			"description": "Post 80,000 notes"
		},
		"_notes90000": {
			"title": "Note universe",
			"description": "Post 90,000 notes"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "Post 100,000 notes",
			"flavor": "You sure have a lot to say."
		},
		"_login3": {
			"title": "Beginner I",
			"description": "Log in for a total of 3 days",
			"flavor": "Starting today, just call me Misskist"
		},
		"_login7": {
			"title": "Beginner II",
			"description": "Log in for a total of 7 days",
			"flavor": "Feel like you've gotten the hang of things yet?"
		},
		"_login15": {
			"title": "Beginner III",
			"description": "Log in for a total of 15 days"
		},
		"_login30": {
			"title": "Misskist I",
			"description": "Log in for a total of 30 days"
		},
		"_login60": {
			"title": "Misskist II",
			"description": "Log in for a total of 60 days"
		},
		"_login100": {
			"title": "Misskist III",
			"description": "Log in for a total of 100 days",
			"flavor": "Violent Misskist"
		},
		"_login200": {
			"title": "Regular I",
			"description": "Log in for a total of 200 days"
		},
		"_login300": {
			"title": "Regular II",
			"description": "Log in for a total of 300 days"
		},
		"_login400": {
			"title": "Regular III",
			"description": "Log in for a total of 400 days"
		},
		"_login500": {
			"title": "Expert I",
			"description": "Log in for a total of 500 days",
			"flavor": "My friends, it has often been said that I like notes"
		},
		"_login600": {
			"title": "Expert II",
			"description": "Log in for a total of 600 days"
		},
		"_login700": {
			"title": "Expert III",
			"description": "Log in for a total of 700 days"
		},
		"_login800": {
			"title": "Master of Notes I",
			"description": "Log in for a total of 800 days"
		},
		"_login900": {
			"title": "Master of Notes II",
			"description": "Log in for a total of 900 days"
		},
		"_login1000": {
			"title": "Master of Notes III",
			"description": "Log in for a total of 1,000 days",
			"flavor": "Thank you for using Misskey!"
		},
		"_noteClipped1": {
			"title": "Must... clip...",
			"description": "Clip your first note"
		},
		"_noteFavorited1": {
			"title": "Stargazer",
			"description": "Favorite your first note"
		},
		"_myNoteFavorited1": {
			"title": "Seeking Stars",
			"description": "Have somebody else favorite one of your notes"
		},
		"_profileFilled": {
			"title": "Well-prepared",
			"description": "Set up your profile"
		},
		"_markedAsCat": {
			"title": "I Am a Cat",
			"description": "Mark your account as a cat",
			"flavor": "I'll give you a name later."
		},
		"_following1": {
			"title": "Following your first user",
			"description": "Follow a user"
		},
		"_following10": {
			"title": "Keep up... keep up...",
			"description": "Follow 10 users"
		},
		"_following50": {
			"title": "Lots of friends",
			"description": "Follow 50 accounts"
		},
		"_following100": {
			"title": "100 Friends",
			"description": "Follow 100 accounts"
		},
		"_following300": {
			"title": "Friend overload",
			"description": "Follow 300 accounts"
		},
		"_followers1": {
			"title": "First follower",
			"description": "Gain 1 follower"
		},
		"_followers10": {
			"title": "Follow me!",
			"description": "Gain 10 followers"
		},
		"_followers50": {
			"title": "Coming in crowds",
			"description": "Gain 50 followers"
		},
		"_followers100": {
			"title": "Popular",
			"description": "Gain 100 followers"
		},
		"_followers300": {
			"title": "Please form a single line",
			"description": "Gain 300 followers"
		},
		"_followers500": {
			"title": "Radio Tower",
			"description": "Gain 500 followers"
		},
		"_followers1000": {
			"title": "Influencer",
			"description": "Gain 1,000 followers"
		},
		"_collectAchievements30": {
			"title": "Achievement Collector",
			"description": "Earn 30 achievements"
		},
		"_viewAchievements3min": {
			"title": "Likes Achievements",
			"description": "Look at your list of achievements for at least 3 minutes"
		},
		"_iLoveMisskey": {
			"title": "I Love Misskey",
			"description": "Post \"I ❤ #Misskey\"",
			"flavor": "Misskey's development team greatly appreciates your support!"
		},
		"_foundTreasure": {
			"title": "Treasure Hunt",
			"description": "You've found the hidden treasure"
		},
		"_client30min": {
			"title": "Short break",
			"description": "Keep Misskey opened for at least 30 minutes"
		},
		"_client60min": {
			"title": "No \"Miss\" in Misskey",
			"description": "Keep Misskey opened for at least 60 minutes"
		},
		"_noteDeletedWithin1min": {
			"title": "Nevermind",
			"description": "Delete a note within a minute of posting it"
		},
		"_postedAtLateNight": {
			"title": "Nocturnal",
			"description": "Post a note late at night",
			"flavor": "It's about time to go to bed."
		},
		"_postedAt0min0sec": {
			"title": "Speaking Clock",
			"description": "Post a note at 00:00",
			"flavor": "Click Click Click Claaang"
		},
		"_selfQuote": {
			"title": "Self-Reference",
			"description": "Quote your own note"
		},
		"_htl20npm": {
			"title": "Flowing Timeline",
			"description": "Have the speed of your home timeline exceed 20 npm (notes per minute)"
		},
		"_viewInstanceChart": {
			"title": "Analyst",
			"description": "View your instance's charts"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "Output \"hello world\" in the Scratchpad"
		},
		"_open3windows": {
			"title": "Multi-Window",
			"description": "Have at least 3 windows open at the same time"
		},
		"_driveFolderCircularReference": {
			"title": "Circular Reference",
			"description": "Attempt to create a recursively nested folder in Drive"
		},
		"_reactWithoutRead": {
			"title": "Did you really read that?",
			"description": "React on a note that's over 100 characters long within 3 seconds of it being posted"
		},
		"_clickedClickHere": {
			"title": "Click here",
			"description": "You've clicked here"
		},
		"_justPlainLucky": {
			"title": "Just Plain Lucky",
			"description": "Has a chance to be obtained with a probability of 0.005% every 10 seconds"
		},
		"_setNameToSyuilo": {
			"title": "God Complex",
			"description": "Set your name to \"syuilo\""
		},
		"_passedSinceAccountCreated1": {
			"title": "One Year Anniversary",
			"description": "One year has passed since your account was created"
		},
		"_passedSinceAccountCreated2": {
			"title": "Two Year Anniversary",
			"description": "Two years have passed since your account was created"
		},
		"_passedSinceAccountCreated3": {
			"title": "Three Year Anniversary",
			"description": "Three years have passed since your account was created"
		},
		"_loggedInOnBirthday": {
			"title": "Happy Birthday",
			"description": "Log in on your birthday"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Happy New Year!",
			"description": "Logged in on the first day of the year",
			"flavor": "To another great year on this instance"
		},
		"_cookieClicked": {
			"title": "A game in which you click cookies",
			"description": "Clicked the cookie",
			"flavor": "Wait, are you on the correct website?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Post the link to Brain Diver",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Test overflow",
			"description": "Trigger the notification test repeatedly within an extremely short time"
		},
		"_tutorialCompleted": {
			"title": "Misskey Elementary Course Diploma",
			"description": "Tutorial completed"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "The biggest object in the bubble game"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Double🤯",
			"description": "Two of the biggest objects in the bubble game at the same time",
			"flavor": "You can fill a lunch box like this 🤯 🤯 a bit."
		}
	},
	"showFile": "Show files",
	"notificationCreateTokenDescription": "If you did not create this, delete it in \"{text}\".",
	"manageAccessTokens": "Zarządzaj tokenami dostępu",
	"youGotNewFollower": "Zaobserwował(a) Cię",
	"followRequestAccepted": "Zaakceptowano prośbę o możliwość obserwacji",
	"receiveFollowRequest": "Otrzymano prośbę o możliwość obserwacji",
	"accept": "Akceptuj",
	"reject": "Odrzuć",
	"notificationNotificationWillBeDisplayedLikeThis": "Notifications look like this",
	"antennas": "Anteny",
	"blockedUsers": "Zablokowani użytkownicy",
	"clips": "Klipy",
	"customEmojis": "Niestandardowe emoji",
	"favorites": "Ulubione",
	"following": "Obserwowani",
	"mutedUsers": "Wyciszeni użytkownicy",
	"notes": "Wpisy",
	"lists": "Listy"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"notificationPollEnded": "Os resultados da enquete agora estão disponíveis",
	"notificationScheduledNotePosted": "Nota agendada foi publicada",
	"notificationScheduledNotePostFailed": "Não foi possível publicar nota agendada",
	"notificationNewNote": "Nova nota",
	"notificationRoleAssigned": "Cargo dado",
	"notificationChatRoomInvitationReceived": "Você foi convidado para uma conversa",
	"notificationAchievementEarned": "Conquista desbloqueada",
	"notificationLogin": "Alguém entrou na conta",
	"notificationCreateToken": "Uma token de acesso foi criada",
	"notificationTestNotification": "Notificação teste",
	"notificationExportOfXCompleted": "Exportação de {x} foi concluída",
	"notificationLikedBySomeUsers": "{n} usuários gostaram da nota",
	"notificationReactedBySomeUsers": "{n} usuários reagiram",
	"notificationRenotedBySomeUsers": "{n} usuários repostaram a nota",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "Configurando o meu misskey",
			"description": "Poste uma nota pela primeira vez",
			"flavor": "Divirta-se com o Misskey!"
		},
		"_notes10": {
			"title": "Algumas notas",
			"description": "Poste 10 notas"
		},
		"_notes100": {
			"title": "Um monte de notas",
			"description": "Poste 100 notas"
		},
		"_notes500": {
			"title": "Coberto por notas",
			"description": "Poste 500 notas"
		},
		"_notes1000": {
			"title": "Uma montanha de notas",
			"description": "Poste 1 000 notas"
		},
		"_notes5000": {
			"title": "Enxurrada de notas",
			"description": "Poste 5000 notas"
		},
		"_notes10000": {
			"title": "Supernota",
			"description": "Poste 10 000 notas"
		},
		"_notes20000": {
			"title": "Preciso... de mais... notas...",
			"description": "Poste 20 000 notas"
		},
		"_notes30000": {
			"title": "Notas, Notas, NOTAS!",
			"description": "Poste 30 000 notas"
		},
		"_notes40000": {
			"title": "Fábrica de notas",
			"description": "Poste 40 000 notas"
		},
		"_notes50000": {
			"title": "Planeta de notas",
			"description": "Poste 50 000 notas"
		},
		"_notes60000": {
			"title": "Quasar de notas",
			"description": "Poste 60 000 notas"
		},
		"_notes70000": {
			"title": "Buraco negro de notas",
			"description": "Poste 70 000 notas"
		},
		"_notes80000": {
			"title": "Galáxia de notas",
			"description": "Poste 80\u00a0000 notas"
		},
		"_notes90000": {
			"title": "Universo de notas",
			"description": "Poste 90 000 notas"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "Poste 100 000 notas",
			"flavor": "Você realmente tem muita coisa para escrever"
		},
		"_login3": {
			"title": "Iniciante I",
			"description": "Faça login por um total de 3 dias",
			"flavor": "De hoje em diante, me chame apenas de Misskist"
		},
		"_login7": {
			"title": "Iniciante II",
			"description": "Faça login por um total de 7 dias",
			"flavor": "Pegando o jeito da coisa?"
		},
		"_login15": {
			"title": "Iniciante III",
			"description": "Faça login por um total de 15 dias"
		},
		"_login30": {
			"title": "Misskist I",
			"description": "Faça login por um total de 30 dias"
		},
		"_login60": {
			"title": "Misskist II",
			"description": "Faça login por um total de 60 dias"
		},
		"_login100": {
			"title": "Misskist III",
			"description": "Faça login por um total de 100 dias",
			"flavor": "Misskist violento"
		},
		"_login200": {
			"title": "Freguês I",
			"description": "Faça login por um total de 200 dias"
		},
		"_login300": {
			"title": "Freguês II",
			"description": "Faça login por um total de 300 dias"
		},
		"_login400": {
			"title": "Freguês III",
			"description": "Faça login por um total de 400 dias"
		},
		"_login500": {
			"title": "Veterano I",
			"description": "Faça login por um total de 500 dias",
			"flavor": "Cavalheiros, tudo o que peço são notas"
		},
		"_login600": {
			"title": "Veterano II",
			"description": "Faça login por um total de 600 dias"
		},
		"_login700": {
			"title": "Veterano III",
			"description": "Faça login por um total de 700 dias"
		},
		"_login800": {
			"title": "Mestre das Notas I",
			"description": "Faça login por um total de 800 dias"
		},
		"_login900": {
			"title": "Mestre das Notas II",
			"description": "Faça login por um total de 900 dias"
		},
		"_login1000": {
			"title": "Mestre das Notas III",
			"description": "Faça login por um total de 1 000 dias",
			"flavor": "Obrigado por utilizar o Misskey!"
		},
		"_noteClipped1": {
			"title": "Preciso... clipar...",
			"description": "Adicione a um clipe a sua primeira nota"
		},
		"_noteFavorited1": {
			"title": "Astrônomo Amador",
			"description": "Adicione uma nota aos favoritos pela primeira vez"
		},
		"_myNoteFavorited1": {
			"title": "Cabeça nas estrelas",
			"description": "Tenha uma das suas notas adicionada aos favoritos de alguém"
		},
		"_profileFilled": {
			"title": "Tudo Pronto",
			"description": "Configure o seu perfil"
		},
		"_markedAsCat": {
			"title": "Eu Sou Um Gato",
			"description": "Marque a sua conta como um gato",
			"flavor": "Ainda não tenho um nome."
		},
		"_following1": {
			"title": "Primeira vez seguindo alguém",
			"description": "Siga um usuário pela primeira vez"
		},
		"_following10": {
			"title": "Circulando, circulando",
			"description": "Siga 10 usuários"
		},
		"_following50": {
			"title": "Muitos amigos",
			"description": "Siga 50 usuários"
		},
		"_following100": {
			"title": "100 Amigos",
			"description": "Siga 100 usuários"
		},
		"_following300": {
			"title": "Sobrecarga de amigos",
			"description": "Siga 300 usuários"
		},
		"_followers1": {
			"title": "Primeiro seguidor",
			"description": "Ganhe o seu primeiro seguidor"
		},
		"_followers10": {
			"title": "Sigam-me os bons!",
			"description": "Ganhe 10 seguidores"
		},
		"_followers50": {
			"title": "Aos montes",
			"description": "Ganhe 50 seguidores"
		},
		"_followers100": {
			"title": "Popular",
			"description": "Ganhe 100 seguidores"
		},
		"_followers300": {
			"title": "Em fila única, por favor",
			"description": "Ganhe 300 seguidores"
		},
		"_followers500": {
			"title": "Torre de celular",
			"description": "Ganhe 500 seguidores"
		},
		"_followers1000": {
			"title": "Influencer",
			"description": "Ganhe 1 000 seguidores"
		},
		"_collectAchievements30": {
			"title": "Coletor de Conquistas",
			"description": "Ganhe 30 conquistas"
		},
		"_viewAchievements3min": {
			"title": "Curte Conquistas",
			"description": "Olhe para a sua lista de conquistas por pelo menos 3 minutos"
		},
		"_iLoveMisskey": {
			"title": "Eu Amo Misskey",
			"description": "Poste \"I ❤ #Misskey\"",
			"flavor": "A equipe de desenvolvimento do Misskey aprecia profundamente o seu apoio!"
		},
		"_foundTreasure": {
			"title": "Caça ao Tesouro",
			"description": "Você achou o tesouro escondido"
		},
		"_client30min": {
			"title": "Pausinha",
			"description": "Deixe o Misskey aberto por pelo menos 30 minutos"
		},
		"_client60min": {
			"title": "Sem falta",
			"description": "Deixe o Misskey aberto por pelo menos 60 minutos"
		},
		"_noteDeletedWithin1min": {
			"title": "Deixa pra lá",
			"description": "Exclua a postagem dentro de 1 minuto após a ter publicado"
		},
		"_postedAtLateNight": {
			"title": "Noturno",
			"description": "Poste uma nota tarde da noite",
			"flavor": "Tá na hora de ir dormir."
		},
		"_postedAt0min0sec": {
			"title": "Relógio Falante",
			"description": "Poste uma nota à meia-noite em ponto",
			"flavor": "Tic-Tac-Tic-Tac"
		},
		"_selfQuote": {
			"title": "Autorreferência",
			"description": "Cite sua própria nota"
		},
		"_htl20npm": {
			"title": "Linha do Tempo Fluida",
			"description": "Faça a velocidade da linha do tempo exceder 20 npm (notas por minuto)"
		},
		"_viewInstanceChart": {
			"title": "Analista",
			"description": "Veja os infográficos da instância"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Olá, Mundo!",
			"description": "Produza \"hello world\" no Scratchpad"
		},
		"_open3windows": {
			"title": "Múlti-Janelas",
			"description": "Tenha ao mínimo 3 janelas abertas simultaneamente."
		},
		"_driveFolderCircularReference": {
			"title": "Referência circular",
			"description": "Tente criar uma pasta recursiva no Drive."
		},
		"_reactWithoutRead": {
			"title": "Você leu tudo isso?",
			"description": "Reaja a uma nota com mais de 100 caracteres dentro de 3 segundos após a sua publicação."
		},
		"_clickedClickHere": {
			"title": "Clique aqui",
			"description": "Você clicou aqui"
		},
		"_justPlainLucky": {
			"title": "Pura Sorte",
			"description": "Tem uma chance de ser obtido com uma probabilidade de 0.005% a cada 10 segundos."
		},
		"_setNameToSyuilo": {
			"title": "Complexo de Deus",
			"description": "Colocar seu nome como \"syuilo\""
		},
		"_passedSinceAccountCreated1": {
			"title": "Aniversário de Um Ano",
			"description": "Um ano passou-se desde a criação da conta"
		},
		"_passedSinceAccountCreated2": {
			"title": "Aniversário de Dois Anos",
			"description": "Dois anos passaram-se desde a criação da conta"
		},
		"_passedSinceAccountCreated3": {
			"title": "Aniversário de Três Anos",
			"description": "Três anos passaram-se desde a criação da conta"
		},
		"_loggedInOnBirthday": {
			"title": "Feliz Aniversário",
			"description": "Entre no dia do seu aniversário"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Feliz Ano Novo!",
			"description": "Entre no primeiro dia do ano",
			"flavor": "Para outro ótimo ano nessa instância"
		},
		"_cookieClicked": {
			"title": "Um jogo onde você clica em cookies",
			"description": "Clicou o cookie",
			"flavor": "Pera, você tá no website correto?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Poste o link do Brain Diver",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Teste de Transbordamento",
			"description": "Ative o teste de notificações repetidamente dentro de um curto período de tempo"
		},
		"_tutorialCompleted": {
			"title": "Diploma de Ensino Fundamental Misskey",
			"description": "Complete o tutorial"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "O maior objeto no Bubble Game"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "🤯 Duplo",
			"description": "Dois dos maiores objetos do Bubble Game ao mesmo tempo.",
			"flavor": "Dá para encher uma lancheira com esses 🤯🤯."
		}
	},
	"showFile": "Mostrar arquivos",
	"notificationCreateTokenDescription": "Se você não faz ideia, exclua o token de acesso através de \"{text}\".",
	"manageAccessTokens": "Gerenciar tokens de acesso",
	"youGotNewFollower": "Você tem um novo seguidor",
	"followRequestAccepted": "Pedido de seguidor aceito",
	"receiveFollowRequest": "Pedido de seguidor recebido",
	"accept": "Aceitar",
	"reject": "Rejeitar",
	"notificationNotificationWillBeDisplayedLikeThis": "Notificações se parecem com isso",
	"antennas": "Antenas",
	"blockedUsers": "Usuários bloqueados",
	"clips": "Clipe",
	"customEmojis": "Emoji personalizado",
	"favorites": "Favoritos",
	"following": "Seguindo",
	"mutedUsers": "Usuários silenciados",
	"notes": "Posts",
	"lists": "Listas"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"notificationPollEnded": "Подведены окончательные итоги опроса",
	"notificationScheduledNotePosted": "Scheduled note has been posted",
	"notificationScheduledNotePostFailed": "Failed to post scheduled note",
	"notificationNewNote": "New note",
	"notificationRoleAssigned": "Role given",
	"notificationChatRoomInvitationReceived": "Вас пригласили в чат",
	"notificationAchievementEarned": "Получено достижение",
	"notificationLogin": "Someone logged in",
	"notificationCreateToken": "An access token has been created",
	"notificationTestNotification": "Test notification",
	"notificationExportOfXCompleted": "Export of {x} has been completed",
	"notificationLikedBySomeUsers": "{n} users liked your note",
	"notificationReactedBySomeUsers": "{n} users reacted",
	"notificationRenotedBySomeUsers": "Renote from {n} users",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "Первые шаги в Misskey",
			"description": "Опубликована первая заметка",
			"flavor": "Приятных дней с Misskey!"
		},
		"_notes10": {
			"title": "Несколько заметок",
			"description": "Опубликовано 10 заметок"
		},
		"_notes100": {
			"title": "Много заметок",
			"description": "Опубликовано 100 заметок"
		},
		"_notes500": {
			"title": "Всё в заметках",
			"description": "Опубликовано 500 заметок"
		},
		"_notes1000": {
			"title": "Гора заметок",
			"description": "Опубликовано 1000 заметок"
		},
		"_notes5000": {
			"title": "Заметки льются рекой",
			"description": "Опубликовано 5000 заметок"
		},
		"_notes10000": {
			"title": "Превосходство в заметках",
			"description": "Опубликовано 10\u2009000 заметок"
		},
		"_notes20000": {
			"title": "Нужно больше заметок!",
			"description": "Опубликовано 20\u2009000 заметок"
		},
		"_notes30000": {
			"title": "Заметки, заметки, заметки",
			"description": "Опубликовано 30\u2009000 заметок"
		},
		"_notes40000": {
			"title": "Фабрика заметок",
			"description": "Опубликовано 40\u2009000 заметок"
		},
		"_notes50000": {
			"title": "Планета заметок",
			"description": "Опубликовано 50\u2009000 заметок"
		},
		"_notes60000": {
			"title": "Замет-квазар",
			"description": "Опубликовано 60\u2009000 заметок"
		},
		"_notes70000": {
			"title": "Чёрная дыра из заметок",
			"description": "Опубликовано 70\u2009000 заметок"
		},
		"_notes80000": {
			"title": "Галактика заметок",
			"description": "Опубликовано 80\u2009000 заметок"
		},
		"_notes90000": {
			"title": "Вселенная заметок",
			"description": "Опубликовано 90\u2009000 заметок"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "Опубликовано 100\u2009000 заметок",
			"flavor": "Вам правда нужно столько писать?"
		},
		"_login3": {
			"title": "Новичок Ⅰ",
			"description": "3 дня на сайте",
			"flavor": "С сегодняшнего дня зовите меня просто мискиец"
		},
		"_login7": {
			"title": "Новичок Ⅱ",
			"description": "Неделя на сайте",
			"flavor": "Кажется, вы начали свыкаться с этим, нет?"
		},
		"_login15": {
			"title": "Новичок Ⅲ",
			"description": "15 дней на сайте"
		},
		"_login30": {
			"title": "Мискиец Ⅰ",
			"description": "30 дней на сайте"
		},
		"_login60": {
			"title": "Мискиец Ⅱ",
			"description": "60 дней на сайте"
		},
		"_login100": {
			"title": "Мискиец Ⅲ",
			"description": "100 дней на сайте",
			"flavor": "Жестокий мискиец"
		},
		"_login200": {
			"title": "Завсегдатай Ⅰ",
			"description": "200 дней на сайте"
		},
		"_login300": {
			"title": "Завсегдатай Ⅱ",
			"description": "300 дней на сайте"
		},
		"_login400": {
			"title": "Завсегдатай Ⅲ",
			"description": "400 дней на сайте"
		},
		"_login500": {
			"title": "Ветеран Ⅰ",
			"description": "500 дней на сайте",
			"flavor": "Господа, я люблю заметки"
		},
		"_login600": {
			"title": "Ветеран Ⅱ",
			"description": "600 дней на сайте"
		},
		"_login700": {
			"title": "Ветеран Ⅲ",
			"description": "700 дней на сайте"
		},
		"_login800": {
			"title": "Повелитель заметок Ⅰ",
			"description": "800 дней на сайте"
		},
		"_login900": {
			"title": "Повелитель заметок Ⅱ",
			"description": "900 дней на сайте"
		},
		"_login1000": {
			"title": "Повелитель заметок Ⅲ",
			"description": "1000 дней на сайте",
			"flavor": "Спасибо, что пользуетесь Misskey!"
		},
		"_noteClipped1": {
			"title": "Нельзя не сохранить",
			"description": "Первая заметка в подборке"
		},
		"_noteFavorited1": {
			"title": "Смотрящий на звёзды",
			"description": "Первое добавление в избранное"
		},
		"_myNoteFavorited1": {
			"title": "В поиске звёзд",
			"description": "Кому-то понравилась ваша заметка"
		},
		"_profileFilled": {
			"title": "Приготовления закончены",
			"description": "Заполнен профиль"
		},
		"_markedAsCat": {
			"title": "Ваш покорный слуга кот",
			"description": "Включена опция «Аккаунт кота»",
			"flavor": "Позвольте представиться: я — кот, просто кот, у меня еще нет имени."
		},
		"_following1": {
			"title": "Я не один",
			"description": "Сделана первая подписка"
		},
		"_following10": {
			"title": "Не останавливайся… Не останавливайся…",
			"description": "Количество подписок достигло 10"
		},
		"_following50": {
			"title": "Много друзей",
			"description": "Количество подписок достигло 50"
		},
		"_following100": {
			"title": "Сотня друзей",
			"description": "Количество подписок достигло 100"
		},
		"_following300": {
			"title": "Друзья в избытке",
			"description": "Количество подписок достигло 300"
		},
		"_followers1": {
			"title": "Первый подписчик",
			"description": "Появился 1 подписчик"
		},
		"_followers10": {
			"title": "Следуй за мной!",
			"description": "Количество подписчиков достигло 10"
		},
		"_followers50": {
			"title": "Один за другим",
			"description": "Количество подписчиков достигло 50"
		},
		"_followers100": {
			"title": "Всеобщий любимец",
			"description": "Количество подписчиков достигло 100"
		},
		"_followers300": {
			"title": "В очередь!",
			"description": "Количество подписчиков достигло 300"
		},
		"_followers500": {
			"title": "Радиостанция",
			"description": "Количество подписчиков достигло 500"
		},
		"_followers1000": {
			"title": "Авторитет",
			"description": "Количество подписчиков достигло 1000"
		},
		"_collectAchievements30": {
			"title": "Достигатор",
			"description": "Получено 30 достижений"
		},
		"_viewAchievements3min": {
			"title": "Любовь к успехам",
			"description": "Более 3 минут любования достижениями"
		},
		"_iLoveMisskey": {
			"title": "Я люблю Misskey",
			"description": "Написана заметка «I ❤ #Misskey»",
			"flavor": "Спасибо за поддержку Misskey! Ваша команда разработчиков"
		},
		"_foundTreasure": {
			"title": "Охота за сокровищами",
			"description": "Найдено спрятанное сокровище"
		},
		"_client30min": {
			"title": "Перерыв на обед",
			"description": "Прошло 30 минут с момента запуска клиента"
		},
		"_client60min": {
			"title": "Не наглядеться на Misskey",
			"description": "Misskey был открыт 60 минут подряд"
		},
		"_noteDeletedWithin1min": {
			"title": "Ой, нет!",
			"description": "Заметка удалена через минуту после публикации"
		},
		"_postedAtLateNight": {
			"title": "Житель ночи",
			"description": "Заметка опубликована в глухую ночь",
			"flavor": "Вроде бы пора спать"
		},
		"_postedAt0min0sec": {
			"title": "Говорящие часы",
			"description": "Заметка опубликована ровно в 0 минут 0 секунд",
			"flavor": "Дин-дон дин-дон"
		},
		"_selfQuote": {
			"title": "Самовоспроизведение",
			"description": "Процитирована собственная заметка"
		},
		"_htl20npm": {
			"title": "В потоке",
			"description": "Достигнута скорость домашней ленты в 20 з/мин (заметок минуту)"
		},
		"_viewInstanceChart": {
			"title": "Аналитик",
			"description": "Просмотрены статистические диаграммы инстанса"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Привет, мир!",
			"description": "Выведен текст «hello world» в Когтеточке"
		},
		"_open3windows": {
			"title": "Многооконный",
			"description": "Открыто одновременно 3 окна"
		},
		"_driveFolderCircularReference": {
			"title": "Циклическая ссылка",
			"description": "Попытка создать на «диске» рекурсивно вложенную папку"
		},
		"_reactWithoutRead": {
			"title": "Не читай @ отвечай!",
			"description": "На заметку более чем 100 знаков написан ответ в первые же 3 секунды с её появления."
		},
		"_clickedClickHere": {
			"title": "Нажмите здесь",
			"description": "Нажато здесь"
		},
		"_justPlainLucky": {
			"title": "Чистая удача",
			"description": "Может достаться с вероятностью 0,005% каждые 10 секунд."
		},
		"_setNameToSyuilo": {
			"title": "Комплекс бога",
			"description": "Установлено «syuilo» в качестве имени"
		},
		"_passedSinceAccountCreated1": {
			"title": "Первая годовщина",
			"description": "Прошёл 1 год с момента регистрации"
		},
		"_passedSinceAccountCreated2": {
			"title": "Вторая годовщина",
			"description": "Прошло 2 года с момента регистрации"
		},
		"_passedSinceAccountCreated3": {
			"title": "Третья годовщина",
			"description": "Прошло 3 года с момента регистрации"
		},
		"_loggedInOnBirthday": {
			"title": "С днём рождения!",
			"description": "Вход на сайт в свой день рождения"
		},
		"_loggedInOnNewYearsDay": {
			"title": "С Новым годом!",
			"description": "Вход на сайт в первый день года",
			"flavor": "Желаем отличного года на нашем сайте!"
		},
		"_cookieClicked": {
			"title": "Игра, в которой вы щёлкаете по печенькам",
			"description": "Нажато печенье",
			"flavor": "Стоп, вы вообще на том сайте-то?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Опубликована ссылка на песню «Brain Diver»",
			"flavor": "Мисски-Мисски Ла-Ту-Ма"
		},
		"_smashTestNotificationButton": {
			"title": "Избыточное тестирование",
			"description": "Вызовите тестовое уведомление много раз за очень короткий период времени"
		},
		"_tutorialCompleted": {
			"title": "Диплом начального курса Misskey",
			"description": "Закончите туториал"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "Самый большой объект в Bubble game"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Двойной🤯",
			"description": "Два самых больших объекта в Bubble game одновременно!",
			"flavor": "You can fill a lunch box like this 🤯 🤯 a bit."
		}
	},
	"showFile": "Посмотреть файл",
	"notificationCreateTokenDescription": "If you did not create this, delete it in \"{text}\".",
	"manageAccessTokens": "Управление токенами доступа",
	"youGotNewFollower": "Новый подписчик",
	"followRequestAccepted": "Запрос на подписку принят",
	"receiveFollowRequest": "Получен запрос на подписку",
	"accept": "Принять",
	"reject": "Отклонить",
	"notificationNotificationWillBeDisplayedLikeThis": "Notifications look like this",
	"antennas": "Антенны",
	"blockedUsers": "Заблокированные пользователи",
	"clips": "Подборки",
	"customEmojis": "Собственные эмодзи",
	"favorites": "Избранное",
	"following": "Подписки",
	"mutedUsers": "Скрытые пользователи",
	"notes": "Заметки",
	"lists": "Списки"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"notificationPollEnded": "Výsledky hlasovania sú k dispozícii.",
	"notificationScheduledNotePosted": "Scheduled note has been posted",
	"notificationScheduledNotePostFailed": "Failed to post scheduled note",
	"notificationNewNote": "New note",
	"notificationRoleAssigned": "Role given",
	"notificationChatRoomInvitationReceived": "You have been invited to a chat room",
	"notificationAchievementEarned": "Achievement unlocked",
	"notificationLogin": "Someone logged in",
	"notificationCreateToken": "An access token has been created",
	"notificationTestNotification": "Test notification",
	"notificationExportOfXCompleted": "Export of {x} has been completed",
	"notificationLikedBySomeUsers": "{n} users liked your note",
	"notificationReactedBySomeUsers": "{n} users reacted",
	"notificationRenotedBySomeUsers": "Renote from {n} users",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "just setting up my msky",
			"description": "Post your first note",
			"flavor": "Have a good time with Misskey!"
		},
		"_notes10": {
			"title": "Some notes",
			"description": "Post 10 notes"
		},
		"_notes100": {
			"title": "A lot of notes",
			"description": "Post 100 notes"
		},
		"_notes500": {
			"title": "Covered in notes",
			"description": "Post 500 notes"
		},
		"_notes1000": {
			"title": "A mountain of notes",
			"description": "Post 1,000 notes"
		},
		"_notes5000": {
			"title": "Overflowing notes",
			"description": "Post 5,000 notes"
		},
		"_notes10000": {
			"title": "Supernote",
			"description": "Post 10,000 notes"
		},
		"_notes20000": {
			"title": "Need... more... notes...",
			"description": "Post 20,000 notes"
		},
		"_notes30000": {
			"title": "Notes notes notes!",
			"description": "Post 30,000 notes"
		},
		"_notes40000": {
			"title": "Note factory",
			"description": "Post 40,000 notes"
		},
		"_notes50000": {
			"title": "Planet of notes",
			"description": "Post 50,000 notes"
		},
		"_notes60000": {
			"title": "Note quasar",
			"description": "Post 60,000 notes"
		},
		"_notes70000": {
			"title": "Note black hole",
			"description": "Post 70,000 notes"
		},
		"_notes80000": {
			"title": "Note galaxy",
			"description": "Post 80,000 notes"
		},
		"_notes90000": {
			"title": "Note universe",
			"description": "Post 90,000 notes"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "Post 100,000 notes",
			"flavor": "You sure have a lot to say."
		},
		"_login3": {
			"title": "Beginner I",
			"description": "Log in for a total of 3 days",
			"flavor": "Starting today, just call me Misskist"
		},
		"_login7": {
			"title": "Beginner II",
			"description": "Log in for a total of 7 days",
			"flavor": "Feel like you've gotten the hang of things yet?"
		},
		"_login15": {
			"title": "Beginner III",
			"description": "Log in for a total of 15 days"
		},
		"_login30": {
			"title": "Misskist I",
			"description": "Log in for a total of 30 days"
		},
		"_login60": {
			"title": "Misskist II",
			"description": "Log in for a total of 60 days"
		},
		"_login100": {
			"title": "Misskist III",
			"description": "Log in for a total of 100 days",
			"flavor": "Violent Misskist"
		},
		"_login200": {
			"title": "Regular I",
			"description": "Log in for a total of 200 days"
		},
		"_login300": {
			"title": "Regular II",
			"description": "Log in for a total of 300 days"
		},
		"_login400": {
			"title": "Regular III",
			"description": "Log in for a total of 400 days"
		},
		"_login500": {
			"title": "Expert I",
			"description": "Log in for a total of 500 days",
			"flavor": "My friends, it has often been said that I like notes"
		},
		"_login600": {
			"title": "Expert II",
			"description": "Log in for a total of 600 days"
		},
		"_login700": {
			"title": "Expert III",
			"description": "Log in for a total of 700 days"
		},
		"_login800": {
			"title": "Master of Notes I",
			"description": "Log in for a total of 800 days"
		},
		"_login900": {
			"title": "Master of Notes II",
			"description": "Log in for a total of 900 days"
		},
		"_login1000": {
			"title": "Master of Notes III",
			"description": "Log in for a total of 1,000 days",
			"flavor": "Thank you for using Misskey!"
		},
		"_noteClipped1": {
			"title": "Must... clip...",
			"description": "Clip your first note"
		},
		"_noteFavorited1": {
			"title": "Stargazer",
			"description": "Favorite your first note"
		},
		"_myNoteFavorited1": {
			"title": "Seeking Stars",
			"description": "Have somebody else favorite one of your notes"
		},
		"_profileFilled": {
			"title": "Well-prepared",
			"description": "Set up your profile"
		},
		"_markedAsCat": {
			"title": "I Am a Cat",
			"description": "Mark your account as a cat",
			"flavor": "I'll give you a name later."
		},
		"_following1": {
			"title": "Following your first user",
			"description": "Follow a user"
		},
		"_following10": {
			"title": "Keep up... keep up...",
			"description": "Follow 10 users"
		},
		"_following50": {
			"title": "Lots of friends",
			"description": "Follow 50 accounts"
		},
		"_following100": {
			"title": "100 Friends",
			"description": "Follow 100 accounts"
		},
		"_following300": {
			"title": "Friend overload",
			"description": "Follow 300 accounts"
		},
		"_followers1": {
			"title": "First follower",
			"description": "Gain 1 follower"
		},
		"_followers10": {
			"title": "Follow me!",
			"description": "Gain 10 followers"
		},
		"_followers50": {
			"title": "Coming in crowds",
			"description": "Gain 50 followers"
		},
		"_followers100": {
			"title": "Popular",
			"description": "Gain 100 followers"
		},
		"_followers300": {
			"title": "Please form a single line",
			"description": "Gain 300 followers"
		},
		"_followers500": {
			"title": "Radio Tower",
			"description": "Gain 500 followers"
		},
		"_followers1000": {
			"title": "Influencer",
			"description": "Gain 1,000 followers"
		},
		"_collectAchievements30": {
			"title": "Achievement Collector",
			"description": "Earn 30 achievements"
		},
		"_viewAchievements3min": {
			"title": "Likes Achievements",
			"description": "Look at your list of achievements for at least 3 minutes"
		},
		"_iLoveMisskey": {
			"title": "I Love Misskey",
			"description": "Post \"I ❤ #Misskey\"",
			"flavor": "Misskey's development team greatly appreciates your support!"
		},
		"_foundTreasure": {
			"title": "Treasure Hunt",
			"description": "You've found the hidden treasure"
		},
		"_client30min": {
			"title": "Short break",
			"description": "Keep Misskey opened for at least 30 minutes"
		},
		"_client60min": {
			"title": "No \"Miss\" in Misskey",
			"description": "Keep Misskey opened for at least 60 minutes"
		},
		"_noteDeletedWithin1min": {
			"title": "Nevermind",
			"description": "Delete a note within a minute of posting it"
		},
		"_postedAtLateNight": {
			"title": "Nocturnal",
			"description": "Post a note late at night",
			"flavor": "It's about time to go to bed."
		},
		"_postedAt0min0sec": {
			"title": "Speaking Clock",
			"description": "Post a note at 00:00",
			"flavor": "Click Click Click Claaang"
		},
		"_selfQuote": {
			"title": "Self-Reference",
			"description": "Quote your own note"
		},
		"_htl20npm": {
			"title": "Flowing Timeline",
			"description": "Have the speed of your home timeline exceed 20 npm (notes per minute)"
		},
		"_viewInstanceChart": {
			"title": "Analyst",
			"description": "View your instance's charts"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "Output \"hello world\" in the Scratchpad"
		},
		"_open3windows": {
			"title": "Multi-Window",
			"description": "Have at least 3 windows open at the same time"
		},
		"_driveFolderCircularReference": {
			"title": "Circular Reference",
			"description": "Attempt to create a recursively nested folder in Drive"
		},
		"_reactWithoutRead": {
			"title": "Did you really read that?",
			"description": "React on a note that's over 100 characters long within 3 seconds of it being posted"
		},
		"_clickedClickHere": {
			"title": "Click here",
			"description": "You've clicked here"
		},
		"_justPlainLucky": {
			"title": "Just Plain Lucky",
			"description": "Has a chance to be obtained with a probability of 0.005% every 10 seconds"
		},
		"_setNameToSyuilo": {
			"title": "God Complex",
			"description": "Set your name to \"syuilo\""
		},
		"_passedSinceAccountCreated1": {
			"title": "One Year Anniversary",
			"description": "One year has passed since your account was created"
		},
		"_passedSinceAccountCreated2": {
			"title": "Two Year Anniversary",
			"description": "Two years have passed since your account was created"
		},
		"_passedSinceAccountCreated3": {
			"title": "Three Year Anniversary",
			"description": "Three years have passed since your account was created"
		},
		"_loggedInOnBirthday": {
			"title": "Happy Birthday",
			"description": "Log in on your birthday"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Happy New Year!",
			"description": "Logged in on the first day of the year",
			"flavor": "To another great year on this instance"
		},
		"_cookieClicked": {
			"title": "A game in which you click cookies",
			"description": "Clicked the cookie",
			"flavor": "Wait, are you on the correct website?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Post the link to Brain Diver",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Test overflow",
			"description": "Trigger the notification test repeatedly within an extremely short time"
		},
		"_tutorialCompleted": {
			"title": "Misskey Elementary Course Diploma",
			"description": "Tutorial completed"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "The biggest object in the bubble game"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Double🤯",
			"description": "Two of the biggest objects in the bubble game at the same time",
			"flavor": "You can fill a lunch box like this 🤯 🤯 a bit."
		}
	},
	"showFile": "Show files",
	"notificationCreateTokenDescription": "If you did not create this, delete it in \"{text}\".",
	"manageAccessTokens": "Spravovať prístupové tokeny",
	"youGotNewFollower": "Máte nového sledujúceho",
	"followRequestAccepted": "Žiadosť o sledovanie akceptovaná",
	"receiveFollowRequest": "Žiadosť o sledovanie prijatá",
	"accept": "Súhlasím",
	"reject": "Nesúhlasím",
	"notificationNotificationWillBeDisplayedLikeThis": "Notifications look like this",
	"antennas": "Antény",
	"blockedUsers": "Blokovaní používatelia",
	"clips": "Klip",
	"customEmojis": "Vlastné emoji",
	"favorites": "Obľúbené",
	"following": "Sledujete",
	"mutedUsers": "Umlčaní používatelia",
	"notes": "Poznámky",
	"lists": "Zoznamy"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"notificationPollEnded": "ผลโพลออกมาแล้ว",
	"notificationScheduledNotePosted": "โน้ตที่กำหนดเวลาไว้ได้ถูกโพสต์แล้ว",
	"notificationScheduledNotePostFailed": "ล้มเหลวในการโพสต์โน้ตที่กำหนดเวลาไว้",
	"notificationNewNote": "โพสต์ใหม่",
	"notificationRoleAssigned": "ได้รับบทบาท",
	"notificationChatRoomInvitationReceived": "ได้รับคำเชิญเข้าร่วมห้องแชต",
	"notificationAchievementEarned": "รับความสำเร็จ",
	"notificationLogin": "มีการเข้าสู่ระบบ",
	"notificationCreateToken": "สร้างโทเค็นการเข้าถึงแล้ว",
	"notificationTestNotification": "ทดสอบการแจ้งเตือน",
	"notificationExportOfXCompleted": "การดำเนินการส่งออก {x} ได้เสร็จสิ้นลงแล้ว",
	"notificationLikedBySomeUsers": "{n} คนถูกใจ",
	"notificationReactedBySomeUsers": "ถูกรีแอคชั่นโดยผู้ใช้ {n} ราย",
	"notificationRenotedBySomeUsers": "รีโน้ตจากผู้ใช้ {n} ราย",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "just setting up my msky",
			"description": "โพสต์โน้ตเป็นครั้งแรก",
			"flavor": "ขอให้มีช่วงเวลาที่ดีกับ Misskey นะคะ!"
		},
		"_notes10": {
			"title": "โน้ตไม่กี่ชิ้น",
			"description": "โพสต์ 10 โน้ต"
		},
		"_notes100": {
			"title": "โน้ตเยอะอยู่",
			"description": "โพสต์ 100 โน้ต"
		},
		"_notes500": {
			"title": "จมคากองโน้ต",
			"description": "โพสต์ 500 โน้ต"
		},
		"_notes1000": {
			"title": "ภูเขาแห่งโน้ต",
			"description": "โพสต์ 1,000 โน้ต"
		},
		"_notes5000": {
			"title": "โน้ตล้นไปแล้ว",
			"description": "โพสต์ 5,000 โน้ต"
		},
		"_notes10000": {
			"title": "ซุปเปอร์โน้ต",
			"description": "โพสต์ 10,000 โน้ต"
		},
		"_notes20000": {
			"title": "ต้ อ ง ก า ร โ น้ ต เ พิ่ ม อี ก !",
			"description": "โพสต์ 20,000 โน้ต"
		},
		"_notes30000": {
			"title": "โน้ต โน้ต โน้ต!",
			"description": "โพสต์ 30,000 โน้ต"
		},
		"_notes40000": {
			"title": "โรงงานผลิตโน้ต",
			"description": "โพสต์ 40,000 โน้ต"
		},
		"_notes50000": {
			"title": "ดาวเคราะห์แห่งโน้ต",
			"description": "โพสต์ 50,000 โน้ต"
		},
		"_notes60000": {
			"title": "โน้ตควอซาร์",
			"description": "โพสต์ 60,000 โน้ต"
		},
		"_notes70000": {
			"title": "หลุม-โน้ต-ดำ",
			"description": "โพสต์ 70,000 โน้ต"
		},
		"_notes80000": {
			"title": "ดาราจักรโน้ต",
			"description": "โพสต์ 80,000 โน้ต"
		},
		"_notes90000": {
			"title": "จักรวาลโน้ต",
			"description": "โพสต์ 90,000 โน้ต"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "โพสต์ 100,000 โน้ต",
			"flavor": "มีเรื่องจะเขียนมากขนาดนั้นเลยเหรอนั่น?"
		},
		"_login3": {
			"title": "มือใหม่ I",
			"description": "เข้าสู่ระบบเป็นเวลารวม 3 วัน",
			"flavor": "ตั้งแต่วันนี้เป็นต้นไป ฉันคือมิสคิสต์"
		},
		"_login7": {
			"title": "มือใหม่ II",
			"description": "เข้าสู่ระบบเป็นเวลารวม 7 วัน",
			"flavor": "ชินกับมันแล้วหรือยัง?"
		},
		"_login15": {
			"title": "มือใหม่ III",
			"description": "เข้าสู่ระบบเป็นเวลารวม 15 วัน"
		},
		"_login30": {
			"title": "มิสคิสต์ I",
			"description": "เข้าสู่ระบบเป็นเวลารวม 30 วัน"
		},
		"_login60": {
			"title": "มิสคิสต์ II",
			"description": "เข้าสู่ระบบเป็นเวลารวม 60 วัน"
		},
		"_login100": {
			"title": "มิสคิสต์ III",
			"description": "เข้าสู่ระบบเป็นเวลารวม 100 วัน",
			"flavor": "Violent Misskist (ทำไมเหมือนชื่อหนังสักเรื่องจังเลยนะ)"
		},
		"_login200": {
			"title": "ลูกค้าประจำ I",
			"description": "เข้าสู่ระบบเป็นเวลารวม 200 วัน"
		},
		"_login300": {
			"title": "ลูกค้าประจำ II",
			"description": "เข้าสู่ระบบเป็นเวลารวม 300 วัน"
		},
		"_login400": {
			"title": "ลูกค้าประจำ III",
			"description": "เข้าสู่ระบบเป็นเวลารวม 400 วัน"
		},
		"_login500": {
			"title": "ผู้เชี่ยวชาญ I",
			"description": "เข้าสู่ระบบเป็นเวลารวม 500 วัน",
			"flavor": "ทุกท่าน ผมชอบโน้ต (กล่าวโดย เดอะ เ_เ_อร์)"
		},
		"_login600": {
			"title": "ผู้เชี่ยวชาญ II",
			"description": "เข้าสู่ระบบเป็นเวลารวม 600 วัน"
		},
		"_login700": {
			"title": "ผู้เชี่ยวชาญ III",
			"description": "เข้าสู่ระบบเป็นเวลารวม 700 วัน"
		},
		"_login800": {
			"title": "ปรมาจารย์ด้านโน้ต I",
			"description": "เข้าสู่ระบบเป็นเวลารวม 800 วัน"
		},
		"_login900": {
			"title": "ปรมาจารย์ด้านโน้ต II",
			"description": "เข้าสู่ระบบเป็นเวลารวม 900 วัน"
		},
		"_login1000": {
			"title": "ปรมาจารย์ด้านโน้ต III",
			"description": "เข้าสู่ระบบเป็นเวลารวม 1,000 วัน",
			"flavor": "ขอบคุณที่ใช้ Misskey นะ !"
		},
		"_noteClipped1": {
			"title": "อดไม่ได้ที่จะต้องคลิปมันเอาไว้",
			"description": "คลิปโน้ตเป็นครั้งแรก"
		},
		"_noteFavorited1": {
			"title": "สตาร์เกเซอร์",
			"description": "ใส่โน้ตเป็นรายการโปรดเป็นครั้งแรก"
		},
		"_myNoteFavorited1": {
			"title": "แสวงหาดวงดาว",
			"description": "โน้ตตัวเองถูกคนอื่นเพิ่มลงรายการโปรดของเขา"
		},
		"_profileFilled": {
			"title": "เตรียมตัวอย่างดี",
			"description": "ตั้งค่าโปรไฟล์"
		},
		"_markedAsCat": {
			"title": "ฉันเป็นแมว",
			"description": "ตั้งค่าบัญชีเป็นแมวเมี้ยวเมี้ยว",
			"flavor": "แมวน้อยไร้ชื่อ"
		},
		"_following1": {
			"title": "ก้าวแรกสู่...กดติดตาม",
			"description": "กดติดตามชาวบ้านครั้งแรก"
		},
		"_following10": {
			"title": "ทำต่อไป... ทำต่อไป...",
			"description": "ติดตาม 10 บัญชีผู้ใช้"
		},
		"_following50": {
			"title": "มีเพื่อนมากมาย",
			"description": "ติดตาม 50 บัญชี"
		},
		"_following100": {
			"title": "เพื่อน 100 คน",
			"description": "ติดตาม 100 บัญชี"
		},
		"_following300": {
			"title": "มีเพื่อนมากเกินไปละ",
			"description": "ติดตาม 300 บัญชี"
		},
		"_followers1": {
			"title": "ผู้ติดตามคนแรก",
			"description": "ได้รับ 1 ผู้ติดตาม"
		},
		"_followers10": {
			"title": "ติดตามฉัน!",
			"description": "ได้รับ 10 คนผู้ติดตาม"
		},
		"_followers50": {
			"title": "มากันเป็นฝูง",
			"description": "ได้รับ 50 ผู้ติดตาม"
		},
		"_followers100": {
			"title": "บุคคลที่เป็นที่นิยม",
			"description": "ได้รับ 100 ผู้ติดตาม"
		},
		"_followers300": {
			"title": "กรุณาสร้างบรรทัดเดียวนะคะ",
			"description": "ได้รับ 300 คนผู้ติดตาม"
		},
		"_followers500": {
			"title": "เสาสัญญาณ",
			"description": "ได้รับ 500 คนผู้ติดตาม"
		},
		"_followers1000": {
			"title": "ผู้ทรงอิทธิพล",
			"description": "ได้รับ 1,000 ผู้ติดตาม"
		},
		"_collectAchievements30": {
			"title": "นักสะสมความสำเร็จ",
			"description": "ได้รับความสำเร็จ 30 ครั้ง"
		},
		"_viewAchievements3min": {
			"title": "ชอบบรรลุความสําเร็จ",
			"description": "มองดูรายการความสำเร็จเป็นเวลานานกว่า 3 นาที"
		},
		"_iLoveMisskey": {
			"title": "ฉันรัก Misskey",
			"description": "โพสต์ “I ❤ #Misskey”",
			"flavor": "ขอบคุณพระคุณเป็นอย่างสูงที่ท่านใช้ Misskey นะคะ ! by ทีมผู้พัฒนา"
		},
		"_foundTreasure": {
			"title": "ล่าสมบัติ",
			"description": "คุณพบสมบัติที่ซ่อนอยู่"
		},
		"_client30min": {
			"title": "พักผ่อนสักหน่อย",
			"description": "ใช้เวลา 30 นาทีบน Misskey"
		},
		"_client60min": {
			"title": "Misskey ต้องไม่มีสิ่งใด “Miss”",
			"description": "เปิด Misskey ค้างไว้แล้วอย่างน้อย 60 นาที"
		},
		"_noteDeletedWithin1min": {
			"title": "ไม่เป็นไร",
			"description": "ลบโน้ตภายในหนึ่งนาทีหลังจากที่โพสต์"
		},
		"_postedAtLateNight": {
			"title": "ออกหากินยามดึกดื่น",
			"description": "โพสต์โน้ตตอนดึกๆ",
			"flavor": "ได้เวลาเข้านอนแล้วนะ"
		},
		"_postedAt0min0sec": {
			"title": "นาฬิกาเทียบเวลา",
			"description": "โพสต์โน้ตเมื่อเวลา 00:00 น.",
			"flavor": "โป๊ะ โป๊ะ โป๊ะ ปิ้งงงงง"
		},
		"_selfQuote": {
			"title": "อ้างอิงตนเอง",
			"description": "อ้างอิงโน้ตตัวเอง"
		},
		"_htl20npm": {
			"title": "ไทม์ไลน์ไหล",
			"description": "มีการทำความเร็วของไทม์ไลน์หลักเกิน 20 npm (โน้ตต่อนาที)"
		},
		"_viewInstanceChart": {
			"title": "วิเคราะห์",
			"description": "ดูแผนภูมิของเซิร์ฟเวอร์"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "หวัดดีชาวโลก!",
			"description": "เอาพุต \"hello world\" ใน Scratchpad"
		},
		"_open3windows": {
			"title": "มัลติวินโดว์",
			"description": "มีการเปิดหน้าต่างอย่างน้อย 3 หน้าต่างพร้อมกัน"
		},
		"_driveFolderCircularReference": {
			"title": "อ้างอิงวงจร",
			"description": "พยายามสร้างโฟลเดอร์ที่ซ้อนกันแบบวนซ้ำในไดรฟ์"
		},
		"_reactWithoutRead": {
			"title": "คุณอ่านมันจริงๆหรือเปล่า?",
			"description": "มีการโต้ตอบกับโน้ตที่มีความยาวมากกว่า 100 ตัวอักษรภายใน 3 วินาทีหลังจากที่โพสต์"
		},
		"_clickedClickHere": {
			"title": "คลิกที่นี่",
			"description": "คุณได้คลิกที่นี่"
		},
		"_justPlainLucky": {
			"title": "แค่ลัคกี้ธรรมดา",
			"description": "มีโอกาสที่จะได้รับด้วยความน่าจะเป็นไปได้ 0.005% ทุก ๆ 10 วินาที"
		},
		"_setNameToSyuilo": {
			"title": "คอมเพล็กซ์ของพระเจ้า",
			"description": "ตั้งชื่อเป็น “syuilo”"
		},
		"_passedSinceAccountCreated1": {
			"title": "ครบรอบหนึ่งปี",
			"description": "ผ่านไป 1 ปีนับตั้งแต่สร้างบัญชี"
		},
		"_passedSinceAccountCreated2": {
			"title": "ครบรอบสองปี",
			"description": "ผ่านไป 2 ปีนับตั้งแต่สร้างบัญชี"
		},
		"_passedSinceAccountCreated3": {
			"title": "ครบรอบสามปี",
			"description": "ผ่านไป 3 ปีนับตั้งแต่สร้างบัญชี"
		},
		"_loggedInOnBirthday": {
			"title": "สุขสันต์วันเกิด",
			"description": "เข้าสู่ระบบในวันเกิดของคุณ"
		},
		"_loggedInOnNewYearsDay": {
			"title": "สวัสดีปีใหม่!",
			"description": "เข้าสู่ระบบในวันแรกของปี",
			"flavor": "อีกปีที่ยอดเยี่ยมในโอกาสนี้เลย"
		},
		"_cookieClicked": {
			"title": "เกมที่คุณคลิกที่คุกกี้",
			"description": "คลิกคุกกี้",
			"flavor": "ใช่หรอ? แน่ใจว่าซอฟต์แวร์ทำงานถูกต้องนะ?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "โพสต์ลิงก์ไปยัง Brain Diver",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "ทดสอบโอเวอร์โฟลว์",
			"description": "ทดสอบการแจ้งเตือนทริกเกอร์ซ้ำๆ ภายในระยะเวลาอันสั้นๆ"
		},
		"_tutorialCompleted": {
			"title": "ใบรับรองการสำเร็จหลักสูตร Misskey มือใหม่",
			"description": "เสร็จสิ้นการสอนแล้ว"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "สร้างวัตถุที่ใหญ่ที่สุดในเกมบับเบิ้ล"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "ดับเบิ้ล",
			"description": "สร้างวัตถุที่ใหญ่ที่สุดในเกมบับเบิ้ลสองชิ้นในเวลาเดียวกัน",
			"flavor": "ปิ่นโตขนาดนี้ น่าจะเพิ่ม\u3000🤯\u3000🤯\u3000เข้าไปนิดหน่อย"
		}
	},
	"showFile": "แสดงไฟล์",
	"notificationCreateTokenDescription": "หากไม่ทราบสาเหตุของคำเชิญ กรุณาลบโทเค็นการเข้าถึงผ่านทาง “{text}”",
	"manageAccessTokens": "การจัดการโทเค็นการเข้าถึง",
	"youGotNewFollower": "ได้ติดตามคุณ",
	"followRequestAccepted": "การติดตามได้รับการอนุมัติแล้ว",
	"receiveFollowRequest": "มีคำขอติดตามส่งมาหา",
	"accept": "ยอมรับ",
	"reject": "ปฏิเสธ",
	"notificationNotificationWillBeDisplayedLikeThis": "การแจ้งเตือนมีลักษณะแบบนี้",
	"antennas": "เสาอากาศ",
	"blockedUsers": "ผู้ใช้ที่ถูกบล็อก",
	"clips": "คลิป",
	"customEmojis": "เอโมจิที่กำหนดเอง",
	"favorites": "รายการโปรด",
	"following": "กำลังติดตาม",
	"mutedUsers": "ผู้ใช้ที่ถูกปิดเสียง",
	"notes": " โน้ต",
	"lists": "รายชื่อ"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"notificationPollEnded": "Anket sonuçları açıklandı.",
	"notificationScheduledNotePosted": "Rezervasyon defteri yayınlandı.",
	"notificationScheduledNotePostFailed": "Rezervasyon defterine gönderilemedi",
	"notificationNewNote": "Yeni not",
	"notificationRoleAssigned": "Verilen rol",
	"notificationChatRoomInvitationReceived": "Sohbet odasına davet edildin.",
	"notificationAchievementEarned": "Achievement unlocked",
	"notificationLogin": "Biri oturum açtı",
	"notificationCreateToken": "Bir erişim jetonu oluşturuldu.",
	"notificationTestNotification": "Test bildirimi",
	"notificationExportOfXCompleted": "{x} ihracatı tamamlandı.",
	"notificationLikedBySomeUsers": "{n} kullanıcı notunuzu beğendi.",
	"notificationReactedBySomeUsers": "{n} kullanıcı tepki gösterdi",
	"notificationRenotedBySomeUsers": "{n} kullanıcıdan gelen hatırlatma",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "msky'ımı kuruyorum",
			"description": "İlk notunuzu yayınlayın",
			"flavor": "Misskey ile iyi vakit geçirin!"
		},
		"_notes10": {
			"title": "Bazı notlar",
			"description": "10 not gönder"
		},
		"_notes100": {
			"title": "Çok sayıda not",
			"description": "100 notu yayınla"
		},
		"_notes500": {
			"title": "Notlarla kaplı",
			"description": "500 notu yayınla"
		},
		"_notes1000": {
			"title": "Notlardan oluşan bir dağ",
			"description": "1.000 not yayınla"
		},
		"_notes5000": {
			"title": "Taşan notlar",
			"description": "5.000 not yayınla"
		},
		"_notes10000": {
			"title": "Süper not",
			"description": "10.000 not yayınla"
		},
		"_notes20000": {
			"title": "Daha... fazla... not... lazım...",
			"description": "20.000 not yayınla"
		},
		"_notes30000": {
			"title": "Notlar notlar notlar!",
			"description": "30.000 not yayınla"
		},
		"_notes40000": {
			"title": "Not fabrikası",
			"description": "40.000 not yayınla"
		},
		"_notes50000": {
			"title": "Notların gezegeni",
			"description": "50.000 not yayınla"
		},
		"_notes60000": {
			"title": "Not kuasar",
			"description": "60.000 not yayınla"
		},
		"_notes70000": {
			"title": "Not kara deliği",
			"description": "70.000 not yayınla"
		},
		"_notes80000": {
			"title": "Not galaksisi",
			"description": "80.000 not yayınla"
		},
		"_notes90000": {
			"title": "Not evreni",
			"description": "90.000 not yayınla"
		},
		"_notes100000": {
			"title": "TÜM NOTLARINIZ BİZE AİTTİR",
			"description": "100.000 yayınlanmış not",
			"flavor": "Gerçekten söyleyecek çok şeyin var."
		},
		"_login3": {
			"title": "Başlangıç I",
			"description": "Log in for a total of 3 days",
			"flavor": "Toplam 3 gün boyunca oturum açın"
		},
		"_login7": {
			"title": "Başlangıç II",
			"description": "Toplam 7 gün boyunca oturum açın",
			"flavor": "Henüz işlerin nasıl yürüdüğünü anladığını hissediyor musun?"
		},
		"_login15": {
			"title": "Başlangıç III",
			"description": "Toplam 15 gün boyunca oturum açın"
		},
		"_login30": {
			"title": "Misskist I",
			"description": "Toplam 30 gün boyunca oturum açın"
		},
		"_login60": {
			"title": "Misskist II",
			"description": "Toplam 60 gün boyunca oturum açın"
		},
		"_login100": {
			"title": "Misskist III",
			"description": "Toplam 100 gün boyunca oturum açın",
			"flavor": "Şiddetli Misskist"
		},
		"_login200": {
			"title": "Düzenli I",
			"description": "Toplam 200 gün boyunca oturum açın."
		},
		"_login300": {
			"title": "Düzenli II",
			"description": "Toplam 300 gün boyunca oturum açın"
		},
		"_login400": {
			"title": "Düzenli III",
			"description": "Toplam 400 gün boyunca oturum açın"
		},
		"_login500": {
			"title": "Uzman I",
			"description": "Toplam 500 gün boyunca oturum açın",
			"flavor": "Arkadaşlar, sık sık not almayı sevdiğim söylenir."
		},
		"_login600": {
			"title": "Uzman II",
			"description": "Toplam 600 gün boyunca oturum açın"
		},
		"_login700": {
			"title": "Uzman III",
			"description": "Toplam 700 gün boyunca oturum açın"
		},
		"_login800": {
			"title": "Notların Ustası I",
			"description": "Toplam 800 gün boyunca oturum açın"
		},
		"_login900": {
			"title": "Notların Ustası II",
			"description": "Toplam 900 gün boyunca oturum açın"
		},
		"_login1000": {
			"title": "Notların Ustası III",
			"description": "Toplam 1.000 gün boyunca oturum açın.",
			"flavor": "Misskey'i kullandığınız için teşekkür ederiz!"
		},
		"_noteClipped1": {
			"title": "Kesinlikle... kesmeliyim...",
			"description": "İlk notunu ekle"
		},
		"_noteFavorited1": {
			"title": "Yıldız gözlemcisi",
			"description": "İlk notunu favorilerine ekle"
		},
		"_myNoteFavorited1": {
			"title": "Yıldızları Arayış",
			"description": "Başka birinin notlarınızdan birini favorilerine eklemesini sağlayın"
		},
		"_profileFilled": {
			"title": "İyi hazırlanmış",
			"description": "Profilini oluştur"
		},
		"_markedAsCat": {
			"title": "Ben bir kediyim.",
			"description": "Hesabını kedi olarak işaretle",
			"flavor": "Sana daha sonra bir isim vereceğim."
		},
		"_following1": {
			"title": "İlk kullanıcınızı takip edin",
			"description": "Bir kullanıcıyı takip et"
		},
		"_following10": {
			"title": "Devam et... devam et...",
			"description": "10 kullanıcıyı takip et"
		},
		"_following50": {
			"title": "Bir sürü arkadaş",
			"description": "50 hesabı takip et"
		},
		"_following100": {
			"title": "100 Arkadaş",
			"description": "100 hesabı takip et"
		},
		"_following300": {
			"title": "Arkadaş yüklemesi",
			"description": "300 hesabı takip et"
		},
		"_followers1": {
			"title": "İlk takipçi",
			"description": "1 takipçi kazanın"
		},
		"_followers10": {
			"title": "Beni takip edin!",
			"description": "10 takipçi kazanın"
		},
		"_followers50": {
			"title": "Kalabalıklar halinde gelmek",
			"description": "50 takipçi kazanın"
		},
		"_followers100": {
			"title": "Popüler",
			"description": "100 takipçi kazanın"
		},
		"_followers300": {
			"title": "Lütfen tek sıra halinde dizilin.",
			"description": "300 takipçi kazanın"
		},
		"_followers500": {
			"title": "Radyo Kulesi",
			"description": "500 takipçi kazanın"
		},
		"_followers1000": {
			"title": "Etkileyici",
			"description": "1.000 takipçi kazanın"
		},
		"_collectAchievements30": {
			"title": "Başarı Koleksiyoncusu",
			"description": "30 başarı kazan"
		},
		"_viewAchievements3min": {
			"title": "Beğeniler Başarılar",
			"description": "Likes Achievements"
		},
		"_iLoveMisskey": {
			"title": "Misskey'i seviyorum",
			"description": "“I ❤ #Misskey” yazısını paylaş",
			"flavor": "Misskey geliştirme ekibi desteğin için çok teşekkür eder!"
		},
		"_foundTreasure": {
			"title": "Hazine Avı",
			"description": "Gizli hazineyi buldunuz."
		},
		"_client30min": {
			"title": "Kısa mola",
			"description": "Misskey'i en az 30 dakika açık tutun."
		},
		"_client60min": {
			"title": "Misskey'de “Miss” yok",
			"description": "Misskey'i en az 60 dakika açık tutun."
		},
		"_noteDeletedWithin1min": {
			"title": "Nevermind",
			"description": "Boş ver"
		},
		"_postedAtLateNight": {
			"title": "Gececi",
			"description": "Gece geç saatlerde bir not yayınlayın",
			"flavor": "Yatma vakti geldi."
		},
		"_postedAt0min0sec": {
			"title": "Konuşan Saat",
			"description": "00:00'da bir not yayınlayın.",
			"flavor": "Tık tık tık, güm!"
		},
		"_selfQuote": {
			"title": "Öz Referans",
			"description": "Kendi notunuzu alıntı yapın"
		},
		"_htl20npm": {
			"title": "Akış Panosu",
			"description": "Ev zaman çizelgenizin hızı 20 npm'yi (dakika başına not sayısı) aşıyor mu?"
		},
		"_viewInstanceChart": {
			"title": "Analist",
			"description": "Sunucunun grafiklerini görüntüle"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Merhaba, dünya!",
			"description": "Scratchpad'de “hello world” yazdırın."
		},
		"_open3windows": {
			"title": "Çoklu Pencere",
			"description": "Aynı anda en az 3 pencere açık olsun."
		},
		"_driveFolderCircularReference": {
			"title": "Döngüsel Referans",
			"description": "Drive'da yinelemeli olarak iç içe geçmiş bir klasör oluşturmaya çalış."
		},
		"_reactWithoutRead": {
			"title": "Cidden okudun mu?",
			"description": "100 karakterden uzun bir notun yayınlanmasından itibaren 3 saniye içinde yanıt verin."
		},
		"_clickedClickHere": {
			"title": "Buraya tıklayın",
			"description": "Buraya tıkladınız"
		},
		"_justPlainLucky": {
			"title": "Sadece Şanslı",
			"description": "Her 10 saniyede bir %0,005 olasılıkla elde edilme şansı vardır."
		},
		"_setNameToSyuilo": {
			"title": "Tanrı Kompleksi",
			"description": "Adınızı “syuilo” olarak ayarlayın."
		},
		"_passedSinceAccountCreated1": {
			"title": "Birinci Yıl Dönümü",
			"description": "Hesabınızın oluşturulmasından bu yana bir yıl geçti."
		},
		"_passedSinceAccountCreated2": {
			"title": "İki Yıllık Yıldönümü",
			"description": "Hesabınızın oluşturulmasından bu yana iki yıl geçti."
		},
		"_passedSinceAccountCreated3": {
			"title": "Üçüncü Yıl Dönümü",
			"description": "Hesabınızın oluşturulmasından bu yana üç yıl geçti."
		},
		"_loggedInOnBirthday": {
			"title": "Doğum günün kutlu olsun",
			"description": "Doğum gününüzde giriş yapın"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Yeni yılınız kutlu olsun!",
			"description": "Yılın ilk gününde oturum açıldı",
			"flavor": "Bu sunucuda bir başka harika yıla"
		},
		"_cookieClicked": {
			"title": "Çerezleri tıklayarak oynanan bir oyun",
			"description": "Çerezi tıkladı",
			"flavor": "Wait, are you on the correct website?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Brain Diver bağlantısını paylaşın",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Test taşması",
			"description": "Bildirim testini çok kısa bir süre içinde tekrar tekrar tetikle."
		},
		"_tutorialCompleted": {
			"title": "Misskey Temel Kurs Diploması",
			"description": "Eğitim tamamlandı"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "Kabarcık oyunundaki en büyük nesne"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Çift🤯",
			"description": "Aynı anda balon oyunundaki en büyük iki nesne",
			"flavor": "Öğle yemeği kutunu şöyle doldurabilirsin 🤯 🤯 biraz."
		}
	},
	"showFile": "Dosyaları göster",
	"notificationCreateTokenDescription": "Eğer bilmiyorsanız, “{text}” aracılığıyla erişim jetonunu silin.",
	"manageAccessTokens": "Acces Tokens yönet",
	"youGotNewFollower": "seni takip etti",
	"followRequestAccepted": "Takip isteği kabul edildi",
	"receiveFollowRequest": "Takip isteği alındı",
	"accept": "Kabul et",
	"reject": "Reddet",
	"notificationNotificationWillBeDisplayedLikeThis": "Bildirimler şöyle görünür",
	"antennas": "Antenler",
	"blockedUsers": "Engellenen kullanıcılar",
	"clips": "Klipler",
	"customEmojis": "Özel Emoji",
	"favorites": "Favoriler",
	"following": "Takip",
	"mutedUsers": "Sessize alınan kullanıcılar",
	"notes": "Notlar",
	"lists": "Listeler"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"notificationPollEnded": "Poll results have become available",
	"notificationScheduledNotePosted": "Scheduled note has been posted",
	"notificationScheduledNotePostFailed": "Failed to post scheduled note",
	"notificationNewNote": "New note",
	"notificationRoleAssigned": "Role given",
	"notificationChatRoomInvitationReceived": "You have been invited to a chat room",
	"notificationAchievementEarned": "Achievement unlocked",
	"notificationLogin": "Someone logged in",
	"notificationCreateToken": "An access token has been created",
	"notificationTestNotification": "Test notification",
	"notificationExportOfXCompleted": "Export of {x} has been completed",
	"notificationLikedBySomeUsers": "{n} users liked your note",
	"notificationReactedBySomeUsers": "{n} users reacted",
	"notificationRenotedBySomeUsers": "Renote from {n} users",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "just setting up my msky",
			"description": "Post your first note",
			"flavor": "Have a good time with Misskey!"
		},
		"_notes10": {
			"title": "Some notes",
			"description": "Post 10 notes"
		},
		"_notes100": {
			"title": "A lot of notes",
			"description": "Post 100 notes"
		},
		"_notes500": {
			"title": "Covered in notes",
			"description": "Post 500 notes"
		},
		"_notes1000": {
			"title": "A mountain of notes",
			"description": "Post 1,000 notes"
		},
		"_notes5000": {
			"title": "Overflowing notes",
			"description": "Post 5,000 notes"
		},
		"_notes10000": {
			"title": "Supernote",
			"description": "Post 10,000 notes"
		},
		"_notes20000": {
			"title": "Need... more... notes...",
			"description": "Post 20,000 notes"
		},
		"_notes30000": {
			"title": "Notes notes notes!",
			"description": "Post 30,000 notes"
		},
		"_notes40000": {
			"title": "Note factory",
			"description": "Post 40,000 notes"
		},
		"_notes50000": {
			"title": "Planet of notes",
			"description": "Post 50,000 notes"
		},
		"_notes60000": {
			"title": "Note quasar",
			"description": "Post 60,000 notes"
		},
		"_notes70000": {
			"title": "Note black hole",
			"description": "Post 70,000 notes"
		},
		"_notes80000": {
			"title": "Note galaxy",
			"description": "Post 80,000 notes"
		},
		"_notes90000": {
			"title": "Note universe",
			"description": "Post 90,000 notes"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "Post 100,000 notes",
			"flavor": "You sure have a lot to say."
		},
		"_login3": {
			"title": "Beginner I",
			"description": "Log in for a total of 3 days",
			"flavor": "Starting today, just call me Misskist"
		},
		"_login7": {
			"title": "Beginner II",
			"description": "Log in for a total of 7 days",
			"flavor": "Feel like you've gotten the hang of things yet?"
		},
		"_login15": {
			"title": "Beginner III",
			"description": "Log in for a total of 15 days"
		},
		"_login30": {
			"title": "Misskist I",
			"description": "Log in for a total of 30 days"
		},
		"_login60": {
			"title": "Misskist II",
			"description": "Log in for a total of 60 days"
		},
		"_login100": {
			"title": "Misskist III",
			"description": "Log in for a total of 100 days",
			"flavor": "Violent Misskist"
		},
		"_login200": {
			"title": "Regular I",
			"description": "Log in for a total of 200 days"
		},
		"_login300": {
			"title": "Regular II",
			"description": "Log in for a total of 300 days"
		},
		"_login400": {
			"title": "Regular III",
			"description": "Log in for a total of 400 days"
		},
		"_login500": {
			"title": "Expert I",
			"description": "Log in for a total of 500 days",
			"flavor": "My friends, it has often been said that I like notes"
		},
		"_login600": {
			"title": "Expert II",
			"description": "Log in for a total of 600 days"
		},
		"_login700": {
			"title": "Expert III",
			"description": "Log in for a total of 700 days"
		},
		"_login800": {
			"title": "Master of Notes I",
			"description": "Log in for a total of 800 days"
		},
		"_login900": {
			"title": "Master of Notes II",
			"description": "Log in for a total of 900 days"
		},
		"_login1000": {
			"title": "Master of Notes III",
			"description": "Log in for a total of 1,000 days",
			"flavor": "Thank you for using Misskey!"
		},
		"_noteClipped1": {
			"title": "Must... clip...",
			"description": "Clip your first note"
		},
		"_noteFavorited1": {
			"title": "Stargazer",
			"description": "Favorite your first note"
		},
		"_myNoteFavorited1": {
			"title": "Seeking Stars",
			"description": "Have somebody else favorite one of your notes"
		},
		"_profileFilled": {
			"title": "Well-prepared",
			"description": "Set up your profile"
		},
		"_markedAsCat": {
			"title": "I Am a Cat",
			"description": "Mark your account as a cat",
			"flavor": "I'll give you a name later."
		},
		"_following1": {
			"title": "Following your first user",
			"description": "Follow a user"
		},
		"_following10": {
			"title": "Keep up... keep up...",
			"description": "Follow 10 users"
		},
		"_following50": {
			"title": "Lots of friends",
			"description": "Follow 50 accounts"
		},
		"_following100": {
			"title": "100 Friends",
			"description": "Follow 100 accounts"
		},
		"_following300": {
			"title": "Friend overload",
			"description": "Follow 300 accounts"
		},
		"_followers1": {
			"title": "First follower",
			"description": "Gain 1 follower"
		},
		"_followers10": {
			"title": "Follow me!",
			"description": "Gain 10 followers"
		},
		"_followers50": {
			"title": "Coming in crowds",
			"description": "Gain 50 followers"
		},
		"_followers100": {
			"title": "Popular",
			"description": "Gain 100 followers"
		},
		"_followers300": {
			"title": "Please form a single line",
			"description": "Gain 300 followers"
		},
		"_followers500": {
			"title": "Radio Tower",
			"description": "Gain 500 followers"
		},
		"_followers1000": {
			"title": "Influencer",
			"description": "Gain 1,000 followers"
		},
		"_collectAchievements30": {
			"title": "Achievement Collector",
			"description": "Earn 30 achievements"
		},
		"_viewAchievements3min": {
			"title": "Likes Achievements",
			"description": "Look at your list of achievements for at least 3 minutes"
		},
		"_iLoveMisskey": {
			"title": "I Love Misskey",
			"description": "Post \"I ❤ #Misskey\"",
			"flavor": "Misskey's development team greatly appreciates your support!"
		},
		"_foundTreasure": {
			"title": "Treasure Hunt",
			"description": "You've found the hidden treasure"
		},
		"_client30min": {
			"title": "Short break",
			"description": "Keep Misskey opened for at least 30 minutes"
		},
		"_client60min": {
			"title": "No \"Miss\" in Misskey",
			"description": "Keep Misskey opened for at least 60 minutes"
		},
		"_noteDeletedWithin1min": {
			"title": "Nevermind",
			"description": "Delete a note within a minute of posting it"
		},
		"_postedAtLateNight": {
			"title": "Nocturnal",
			"description": "Post a note late at night",
			"flavor": "It's about time to go to bed."
		},
		"_postedAt0min0sec": {
			"title": "Speaking Clock",
			"description": "Post a note at 00:00",
			"flavor": "Click Click Click Claaang"
		},
		"_selfQuote": {
			"title": "Self-Reference",
			"description": "Quote your own note"
		},
		"_htl20npm": {
			"title": "Flowing Timeline",
			"description": "Have the speed of your home timeline exceed 20 npm (notes per minute)"
		},
		"_viewInstanceChart": {
			"title": "Analyst",
			"description": "View your instance's charts"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "Output \"hello world\" in the Scratchpad"
		},
		"_open3windows": {
			"title": "Multi-Window",
			"description": "Have at least 3 windows open at the same time"
		},
		"_driveFolderCircularReference": {
			"title": "Circular Reference",
			"description": "Attempt to create a recursively nested folder in Drive"
		},
		"_reactWithoutRead": {
			"title": "Did you really read that?",
			"description": "React on a note that's over 100 characters long within 3 seconds of it being posted"
		},
		"_clickedClickHere": {
			"title": "Click here",
			"description": "You've clicked here"
		},
		"_justPlainLucky": {
			"title": "Just Plain Lucky",
			"description": "Has a chance to be obtained with a probability of 0.005% every 10 seconds"
		},
		"_setNameToSyuilo": {
			"title": "God Complex",
			"description": "Set your name to \"syuilo\""
		},
		"_passedSinceAccountCreated1": {
			"title": "One Year Anniversary",
			"description": "One year has passed since your account was created"
		},
		"_passedSinceAccountCreated2": {
			"title": "Two Year Anniversary",
			"description": "Two years have passed since your account was created"
		},
		"_passedSinceAccountCreated3": {
			"title": "Three Year Anniversary",
			"description": "Three years have passed since your account was created"
		},
		"_loggedInOnBirthday": {
			"title": "Happy Birthday",
			"description": "Log in on your birthday"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Happy New Year!",
			"description": "Logged in on the first day of the year",
			"flavor": "To another great year on this instance"
		},
		"_cookieClicked": {
			"title": "A game in which you click cookies",
			"description": "Clicked the cookie",
			"flavor": "Wait, are you on the correct website?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Post the link to Brain Diver",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Test overflow",
			"description": "Trigger the notification test repeatedly within an extremely short time"
		},
		"_tutorialCompleted": {
			"title": "Misskey Elementary Course Diploma",
			"description": "Tutorial completed"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "The biggest object in the bubble game"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Double🤯",
			"description": "Two of the biggest objects in the bubble game at the same time",
			"flavor": "You can fill a lunch box like this 🤯 🤯 a bit."
		}
	},
	"showFile": "Show files",
	"notificationCreateTokenDescription": "If you did not create this, delete it in \"{text}\".",
	"manageAccessTokens": "Manage access tokens",
	"youGotNewFollower": "followed you",
	"followRequestAccepted": "Follow request accepted",
	"receiveFollowRequest": "Follow request received",
	"accept": "Accept",
	"reject": "Reject",
	"notificationNotificationWillBeDisplayedLikeThis": "Notifications look like this",
	"antennas": "Antennas",
	"blockedUsers": "Blocked users",
	"clips": "Clips",
	"customEmojis": "Custom Emoji",
	"favorites": "Favorites",
	"following": "Following",
	"mutedUsers": "Muted users",
	"notes": "Notes",
	"lists": "Lists"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"notificationPollEnded": "Poll results have become available",
	"notificationScheduledNotePosted": "Scheduled note has been posted",
	"notificationScheduledNotePostFailed": "Failed to post scheduled note",
	"notificationNewNote": "New note",
	"notificationRoleAssigned": "Role given",
	"notificationChatRoomInvitationReceived": "You have been invited to a chat room",
	"notificationAchievementEarned": "Досягнення відкрито",
	"notificationLogin": "Someone logged in",
	"notificationCreateToken": "An access token has been created",
	"notificationTestNotification": "Test notification",
	"notificationExportOfXCompleted": "Export of {x} has been completed",
	"notificationLikedBySomeUsers": "{n} users liked your note",
	"notificationReactedBySomeUsers": "{n} users reacted",
	"notificationRenotedBySomeUsers": "Renote from {n} users",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "Привіт, Misskey!",
			"description": "Перша нотатка",
			"flavor": "Приємного часу з Misskey!"
		},
		"_notes10": {
			"title": "Декілька нотаток",
			"description": "10 нотаток відправлено"
		},
		"_notes100": {
			"title": "Купа нотаток",
			"description": "100 нотаток відправлено"
		},
		"_notes500": {
			"title": "Все в нотатках",
			"description": "500 нотаток відправлено"
		},
		"_notes1000": {
			"title": "Гора нотаток",
			"description": "1 000 нотаток відправлено"
		},
		"_notes5000": {
			"title": "Переповнюючі нотатки",
			"description": "5 000 нотаток відправлено"
		},
		"_notes10000": {
			"title": "Супернотатка",
			"description": "10 000 нотаток відправлено"
		},
		"_notes20000": {
			"title": "Треба Більше Нотаток",
			"description": "20 000 нотаток відправлено"
		},
		"_notes30000": {
			"title": "Нотатки нотатки нотатки",
			"description": "30 000 нотаток відправлено"
		},
		"_notes40000": {
			"title": "Фабрика нотаток",
			"description": "40 000 нотаток відправлено"
		},
		"_notes50000": {
			"title": "Планета нотаток",
			"description": "50 000 нотаток відправлено"
		},
		"_notes60000": {
			"title": "Нотатковий квазар",
			"description": "60 000 нотаток відправлено"
		},
		"_notes70000": {
			"title": "Чорна нотаткова діра",
			"description": "70 000 нотаток відправлено"
		},
		"_notes80000": {
			"title": "Галактика нотаток",
			"description": "80 000 нотаток відправлено"
		},
		"_notes90000": {
			"title": "Нотатковерс",
			"description": "90 000 нотаток відправлено"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "100 000 нотаток відправлено",
			"flavor": "Так багато потрібно сказати?"
		},
		"_login3": {
			"title": "Новачок I",
			"description": "3 дні користування загально",
			"flavor": "Відсьогодні називайте мене \"Місскіст\""
		},
		"_login7": {
			"title": "Новачок II",
			"description": "7 днів користування загально",
			"flavor": "Ви звикли до цього?"
		},
		"_login15": {
			"title": "Новачок III",
			"description": "15 днів користування загально"
		},
		"_login30": {
			"title": "Міскієць I",
			"description": "30 днів користування загально"
		},
		"_login60": {
			"title": "Міскієць II",
			"description": "60 днів користування загально"
		},
		"_login100": {
			"title": "Міскієць III",
			"description": "100 днів користування загально",
			"flavor": "Цей юзер лютий місскіст"
		},
		"_login200": {
			"title": "Завсідник I",
			"description": "200 днів користування загально"
		},
		"_login300": {
			"title": "Завсідник II",
			"description": "300 днів користування загально"
		},
		"_login400": {
			"title": "Завсідник III",
			"description": "400 днів користування загально"
		},
		"_login500": {
			"title": "Ветеран I",
			"description": "500 днів користування загально",
			"flavor": "Meine Kameraden, ich liebe sie, die Notizen."
		},
		"_login600": {
			"title": "Ветеран II",
			"description": "600 днів користування загально"
		},
		"_login700": {
			"title": "Ветеран III",
			"description": "700 днів користування загально"
		},
		"_login800": {
			"title": "Майстер нотаток I",
			"description": "800 днів користування загально"
		},
		"_login900": {
			"title": "Майстер нотаток II",
			"description": "900 днів користування загально"
		},
		"_login1000": {
			"title": "Майстер нотаток III",
			"description": "1000 днів користування загально",
			"flavor": "Дякуємо, що користуєтеся Misskey!"
		},
		"_noteClipped1": {
			"title": "Не можна не зберегти",
			"description": "Перша нотатка у добірці"
		},
		"_noteFavorited1": {
			"title": "Дивитися на зірки",
			"description": "Favorite your first note"
		},
		"_myNoteFavorited1": {
			"title": "У пошуках зірок",
			"description": "Have somebody else favorite one of your notes"
		},
		"_profileFilled": {
			"title": "Повна готовність",
			"description": "Профіль заповнено"
		},
		"_markedAsCat": {
			"title": "Я кіт",
			"description": "Позначено як акаунт кота",
			"flavor": "Я дам тобі ім'я пізніше"
		},
		"_following1": {
			"title": "Перша підписка",
			"description": "Follow a user"
		},
		"_following10": {
			"title": "Продовжуй, продовжуй",
			"description": "Follow 10 users"
		},
		"_following50": {
			"title": "Багато друзів",
			"description": "Кількість підписок сягнула 50"
		},
		"_following100": {
			"title": "100 друзів",
			"description": "Кількість підписок сягнула 100"
		},
		"_following300": {
			"title": "Надлишок друзів",
			"description": "Кількість підписок сягнула 300"
		},
		"_followers1": {
			"title": "Перший підписник",
			"description": "З'явився перший підписник"
		},
		"_followers10": {
			"title": "Follow me!",
			"description": "Кількість підписників досягла 10"
		},
		"_followers50": {
			"title": "Coming in crowds",
			"description": "Кількість підписників досягла 50"
		},
		"_followers100": {
			"title": "Популярна особа",
			"description": "Кількість підписників досягла 100"
		},
		"_followers300": {
			"title": "Ставайте в чергу",
			"description": "Кількість підписників досягла 300"
		},
		"_followers500": {
			"title": "Радіовежа",
			"description": "Кількість підписників досягла 500"
		},
		"_followers1000": {
			"title": "Інфлюенсер",
			"description": "Кількість підписників досягла 1000"
		},
		"_collectAchievements30": {
			"title": "Збирач досягнень",
			"description": "Отримано 30 досягнень"
		},
		"_viewAchievements3min": {
			"title": "Шанувальник досягнень",
			"description": "Переглядати список досягнень принаймні 3 хвилини"
		},
		"_iLoveMisskey": {
			"title": "I Love Misskey",
			"description": "Відправлено \"I ❤ #Misskey\"",
			"flavor": "Дякуємо вам, що користуєтесь Misskey!  – команда розробників"
		},
		"_foundTreasure": {
			"title": "Пошуки скарбів",
			"description": "Ви знайшли прихований скарб"
		},
		"_client30min": {
			"title": "Коротка перерва",
			"description": "З моменту запуску клієнта минуло 30 хвилин"
		},
		"_client60min": {
			"title": "No \"Miss\" in Misskey",
			"description": "Keep Misskey opened for at least 60 minutes"
		},
		"_noteDeletedWithin1min": {
			"title": "Не зважай",
			"description": "Допис видалено протягом 1 хвилини після публікації"
		},
		"_postedAtLateNight": {
			"title": "Нічне життя",
			"description": "Відправити нотатку посеред ночі",
			"flavor": "Час лягати спати"
		},
		"_postedAt0min0sec": {
			"title": "Сигнал часу",
			"description": "Відправити нотатку о 00:00",
			"flavor": "Click Click Click Claaang"
		},
		"_selfQuote": {
			"title": "Самопосилання",
			"description": "Процитувати власну нотатку"
		},
		"_htl20npm": {
			"title": "Плинна стрічка",
			"description": "Перевищити швидкість домашньої стрічки 20npm (нотаток на хвилину)"
		},
		"_viewInstanceChart": {
			"title": "Аналітик",
			"description": "View your instance's charts"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "Вивести \"hello world\" у Скретчпаді"
		},
		"_open3windows": {
			"title": "Multi-Window",
			"description": "Have at least 3 windows open at the same time"
		},
		"_driveFolderCircularReference": {
			"title": "Circular Reference",
			"description": "Attempt to create a recursively nested folder in Drive"
		},
		"_reactWithoutRead": {
			"title": "Прочитали як слід?",
			"description": "Реакція на нотатку, що містить понад 100 символів, протягом 3 секунд після її публікації"
		},
		"_clickedClickHere": {
			"title": "Натисніть тут",
			"description": "Натиснуто тут"
		},
		"_justPlainLucky": {
			"title": "Просто вдача",
			"description": "Можна отримати з ймовірністю 0,01% кожні 10 секунд"
		},
		"_setNameToSyuilo": {
			"title": "Комплекс бога",
			"description": "Встановлено ім'я \"syuilo\""
		},
		"_passedSinceAccountCreated1": {
			"title": "Перша річниця",
			"description": "Минув рік з моменту створення акаунта"
		},
		"_passedSinceAccountCreated2": {
			"title": "Друга річниця",
			"description": "Минуло 2 роки з моменту створення акаунту"
		},
		"_passedSinceAccountCreated3": {
			"title": "Третя річниця",
			"description": "Минуло 3 роки з моменту створення акаунта"
		},
		"_loggedInOnBirthday": {
			"title": "З Днем народження!",
			"description": "Увійти у свій день народження"
		},
		"_loggedInOnNewYearsDay": {
			"title": "З Новим роком!",
			"description": "Увійшли в перший день року",
			"flavor": "To another great year on this instance"
		},
		"_cookieClicked": {
			"title": "A game in which you click cookies",
			"description": "Clicked the cookie",
			"flavor": "Чекайте, це вірний сайт?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Відправити посилання на \"Brain Diver\"",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Test overflow",
			"description": "Trigger the notification test repeatedly within an extremely short time"
		},
		"_tutorialCompleted": {
			"title": "Misskey Elementary Course Diploma",
			"description": "Tutorial completed"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "The biggest object in the bubble game"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Double🤯",
			"description": "Two of the biggest objects in the bubble game at the same time",
			"flavor": "You can fill a lunch box like this 🤯 🤯 a bit."
		}
	},
	"showFile": "Показати файл",
	"notificationCreateTokenDescription": "If you did not create this, delete it in \"{text}\".",
	"manageAccessTokens": "Керування токенами доступу",
	"youGotNewFollower": "Новий підписник",
	"followRequestAccepted": "Підписка прийнята",
	"receiveFollowRequest": "Отримано запит на підписку",
	"accept": "Прийняти",
	"reject": "Відхилити",
	"notificationNotificationWillBeDisplayedLikeThis": "Notifications look like this",
	"antennas": "Антени",
	"blockedUsers": "Заблоковані користувачі",
	"clips": "Добірки",
	"customEmojis": "Кастомні емоджі",
	"favorites": "Обране",
	"following": "Підписки",
	"mutedUsers": "Заглушені користувачі",
	"notes": "Записи",
	"lists": "Списки"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"notificationPollEnded": "Cuộc bình chọn đã kết thúc",
	"notificationScheduledNotePosted": "Scheduled note has been posted",
	"notificationScheduledNotePostFailed": "Failed to post scheduled note",
	"notificationNewNote": "New note",
	"notificationRoleAssigned": "Role given",
	"notificationChatRoomInvitationReceived": "You have been invited to a chat room",
	"notificationAchievementEarned": "Hoàn thành Achievement",
	"notificationLogin": "Someone logged in",
	"notificationCreateToken": "An access token has been created",
	"notificationTestNotification": "Test notification",
	"notificationExportOfXCompleted": "Export of {x} has been completed",
	"notificationLikedBySomeUsers": "{n} users liked your note",
	"notificationReactedBySomeUsers": "{n} users reacted",
	"notificationRenotedBySomeUsers": "Renote from {n} users",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "just setting up my msky",
			"description": "Lần đầu tiên đăng bài",
			"flavor": "Chúc bạn trên Miskey vui vẻ nha!!"
		},
		"_notes10": {
			"title": "Một số bài viết",
			"description": "Đăng bài 10 lần"
		},
		"_notes100": {
			"title": "Rất nhiều bài biết",
			"description": "Đăng bài 100 lần"
		},
		"_notes500": {
			"title": "Như đầy bài viết",
			"description": "Đăng bài 500 lần"
		},
		"_notes1000": {
			"title": "Ngọn núi bài viết",
			"description": "Đăng bài 1000 lần"
		},
		"_notes5000": {
			"title": "Bài viết chảy như suối",
			"description": "Đăng bài 5000 lần"
		},
		"_notes10000": {
			"title": "Bài Viết siu nhìu",
			"description": "Đăng bài 10000 lần"
		},
		"_notes20000": {
			"title": "Need more note",
			"description": "Đã đăng bài 20,000 lần rồi"
		},
		"_notes30000": {
			"title": "ĐĂNG VỚI BÀI",
			"description": "Đã đăng bài 30,000 lần rồi"
		},
		"_notes40000": {
			"title": "Nhà xưởng dăng bài",
			"description": "Đã đăng bài 40,000 lần rồi"
		},
		"_notes50000": {
			"title": "Hàng tinh đăng bài",
			"description": "Đã đăng bài 50,000 lần rồi"
		},
		"_notes60000": {
			"title": "Note quasar",
			"description": "Post 60,000 notes"
		},
		"_notes70000": {
			"title": "Note black hole",
			"description": "Post 70,000 notes"
		},
		"_notes80000": {
			"title": "Note galaxy",
			"description": "Post 80,000 notes"
		},
		"_notes90000": {
			"title": "Note universe",
			"description": "Post 90,000 notes"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "Đăng 100,000 tút",
			"flavor": "Liệu viết bài gì tầm này vậy? "
		},
		"_login3": {
			"title": "Sơ cấp I",
			"description": "Tổng số ngày đăng nhập đạt 3 ngày",
			"flavor": "Từ nay các bạn cứ xem như mình là một Misskist đó"
		},
		"_login7": {
			"title": "Sơ cấp II",
			"description": "Tổng số ngày đăng nhập đạt 7 ngày",
			"flavor": "Bạn dần quen chưa? "
		},
		"_login15": {
			"title": "Sơ cấp III",
			"description": "Tổng số ngày đăng nhập đạt 7 ngày"
		},
		"_login30": {
			"title": "Misskist cấp I",
			"description": "Tổng số ngày đăng nhập đạt 30 ngày"
		},
		"_login60": {
			"title": "Misskist cấp II",
			"description": "Tổng số ngày đăng nhập đạt 60 ngày"
		},
		"_login100": {
			"title": "Misskist cấp III",
			"description": "Tổng số ngày đăng nhập đạt 100 ngày",
			"flavor": "Người dùng này, chính vì đó là một Misskist"
		},
		"_login200": {
			"title": "Khách hàng thường xuyên cấp I",
			"description": "Tổng số ngày đăng nhập đạt 200 ngày"
		},
		"_login300": {
			"title": "Khách hàng thường xuyên cấp II",
			"description": "Tổng số ngày đăng nhập đạt 300 ngày"
		},
		"_login400": {
			"title": "Khách hàng thường xuyên cấp III",
			"description": "Tổng số ngày đăng nhập đạt 400 ngày"
		},
		"_login500": {
			"title": "Expert I",
			"description": "Log in for a total of 500 days",
			"flavor": "My friends, it has often been said that I like notes"
		},
		"_login600": {
			"title": "Expert II",
			"description": "Log in for a total of 600 days"
		},
		"_login700": {
			"title": "Expert III",
			"description": "Log in for a total of 700 days"
		},
		"_login800": {
			"title": "Master of Notes I",
			"description": "Log in for a total of 800 days"
		},
		"_login900": {
			"title": "Master of Notes II",
			"description": "Log in for a total of 900 days"
		},
		"_login1000": {
			"title": "Master of Notes III",
			"description": "Log in for a total of 1,000 days",
			"flavor": "Cảm ơn bạn đã sử dụng Misskey!"
		},
		"_noteClipped1": {
			"title": "Must... clip...",
			"description": "Clip your first note"
		},
		"_noteFavorited1": {
			"title": "Nhà thiên văn học",
			"description": "Favorite your first note"
		},
		"_myNoteFavorited1": {
			"title": "Đi tìm những ngôi sao",
			"description": "Have somebody else favorite one of your notes"
		},
		"_profileFilled": {
			"title": "Luôn sẵn sàng",
			"description": "Thiết lập tài khoản của bạn"
		},
		"_markedAsCat": {
			"title": "Tôi là một con mèo",
			"description": "Bật chế độ mèo",
			"flavor": "Mà tên chưa có"
		},
		"_following1": {
			"title": "Theo dõi đầu tiên",
			"description": "Lần đầu tiên theo dõi "
		},
		"_following10": {
			"title": "Cứ theo dõi và theo dõi",
			"description": "Vừa theo dõi hơn 10 người"
		},
		"_following50": {
			"title": "Bạn bè nhiều quá",
			"description": "Vừa theo dõi hơn 50 người"
		},
		"_following100": {
			"title": "Trăm bạn bè",
			"description": "Vừa theo dõi vượt lên 100 người"
		},
		"_following300": {
			"title": "Quá nhiều bạn bè",
			"description": "Vừa theo dõi vượt lên 300 người"
		},
		"_followers1": {
			"title": "Ai đầu tiên theo dõi bạn",
			"description": "Lần đầu tiên được theo dõi"
		},
		"_followers10": {
			"title": "FOLLOW ME!!",
			"description": "Người theo dõi bạn vượt lên 10 người"
		},
		"_followers50": {
			"title": "Từng chút một",
			"description": "Đạt được 50 lượt theo dõi"
		},
		"_followers100": {
			"title": "Người nổi tiếng",
			"description": "Đạt được 100 lượt theo dõi"
		},
		"_followers300": {
			"title": "Vui lòng xếp thành hàng nào",
			"description": "Đạt được 300 lượt theo dõi"
		},
		"_followers500": {
			"title": "Trạm phát sóng",
			"description": "Đạt được 500 lượt theo dõi"
		},
		"_followers1000": {
			"title": "Người có tầm ảnh hưởng",
			"description": "Người theo dõi bạn vượt lên 1000 người"
		},
		"_collectAchievements30": {
			"title": "Người sưu tập thành tích",
			"description": "Vừa lấy thành tích hơn 30 cái"
		},
		"_viewAchievements3min": {
			"title": "Yêu Thành tích",
			"description": "Ngắm danh sách thành tích đến tận hơn 3 phút"
		},
		"_iLoveMisskey": {
			"title": "Tôi Yêu Misskey",
			"description": "Đăng lời nói \"I ❤ #Misskey\"",
			"flavor": "Xin chân thành cảm ơn bạn đã sử dụng Misskey!!  by Đội ngũ phát triển"
		},
		"_foundTreasure": {
			"title": "Tìm kiếm kho báu",
			"description": "Tìm thấy được những kho báu cất giấu"
		},
		"_client30min": {
			"title": "Giải lao xỉu",
			"description": "Giữ Misskey mở trong ít nhất 30 phút"
		},
		"_client60min": {
			"title": "No \"Miss\" in Misskey",
			"description": "Giữ Misskey mở trong ít nhất 60 phút"
		},
		"_noteDeletedWithin1min": {
			"title": "Xem như không có gì đâu nha",
			"description": "Delete a note within a minute of posting it"
		},
		"_postedAtLateNight": {
			"title": "Loài ăn đêm",
			"description": "Đăng bài trong đêm khuya ",
			"flavor": "Đến giờ đi ngủ rồi."
		},
		"_postedAt0min0sec": {
			"title": "Tín hiệu báo giờ",
			"description": "Đăng bài vào 0 phút 0 giây",
			"flavor": "Pin pop pop pop"
		},
		"_selfQuote": {
			"title": "Nói đến bản thân",
			"description": "Trích dẫn bài viết của mình"
		},
		"_htl20npm": {
			"title": "Timeline trôi như con sông",
			"description": "Timeline trang chính tốc độ vượt lên 20npm"
		},
		"_viewInstanceChart": {
			"title": "Nhà phân tích",
			"description": "Xem biểu đồ của chủ máy"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Chào thế giới!",
			"description": "Output \"hello world\" in the Scratchpad"
		},
		"_open3windows": {
			"title": "Nhiều cửa sổ",
			"description": "Mở cửa sổ hơn 3 cửa sổ"
		},
		"_driveFolderCircularReference": {
			"title": "Circular Reference",
			"description": "Attempt to create a recursively nested folder in Drive"
		},
		"_reactWithoutRead": {
			"title": "Bài này bạn đọc kỹ chứ? ",
			"description": "Phản hồi trong vọng 3 giây sau bài viết có hơn 100 ký tự mới được đăng lên"
		},
		"_clickedClickHere": {
			"title": "Bấm đây",
			"description": "Bấm chỗ này"
		},
		"_justPlainLucky": {
			"title": "Chỉ là một cuộc máy mắn",
			"description": "Mỗi 10 giây thu nhận được với tỷ lệ  0.005%"
		},
		"_setNameToSyuilo": {
			"title": "Ngưỡng mộ với vị thần",
			"description": "Đạt tên là syuilo"
		},
		"_passedSinceAccountCreated1": {
			"title": "Kỷ niệm một năm",
			"description": "One year has passed since your account was created"
		},
		"_passedSinceAccountCreated2": {
			"title": "Two Year Anniversary",
			"description": "Two years have passed since your account was created"
		},
		"_passedSinceAccountCreated3": {
			"title": "Three Year Anniversary",
			"description": "Three years have passed since your account was created"
		},
		"_loggedInOnBirthday": {
			"title": "Sinh nhật vủi vẻ",
			"description": "Đăng nhập vào ngày sinh"
		},
		"_loggedInOnNewYearsDay": {
			"title": "Chức mừng năm mới",
			"description": "Đăng nhập vào Tết Nguyên đàn dương lịch",
			"flavor": "Chúc bạn năm mới AN KHANG THỊNH VƯỢNG, VẠN SỰ NHƯ Ý!!"
		},
		"_cookieClicked": {
			"title": "A game in which you click cookies",
			"description": "Clicked the cookie",
			"flavor": "Bạn nhầm phầm mềm chứ?"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "Post the link to Brain Diver",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "Test overflow",
			"description": "Trigger the notification test repeatedly within an extremely short time"
		},
		"_tutorialCompleted": {
			"title": "Misskey Elementary Course Diploma",
			"description": "Tutorial completed"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "The biggest object in the bubble game"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "Double🤯",
			"description": "Two of the biggest objects in the bubble game at the same time",
			"flavor": "You can fill a lunch box like this 🤯 🤯 a bit."
		}
	},
	"showFile": "Hiển thị tập tin",
	"notificationCreateTokenDescription": "If you did not create this, delete it in \"{text}\".",
	"manageAccessTokens": "Tạo mã truy cập",
	"youGotNewFollower": "đã theo dõi bạn",
	"followRequestAccepted": "Đã chấp nhận yêu cầu theo dõi",
	"receiveFollowRequest": "Đã yêu cầu theo dõi",
	"accept": "Đồng ý",
	"reject": "Từ chối",
	"notificationNotificationWillBeDisplayedLikeThis": "Notifications look like this",
	"antennas": "Trạm phát sóng",
	"blockedUsers": "Người đã chặn",
	"clips": "Lưu bài viết",
	"customEmojis": "Tùy chỉnh emoji",
	"favorites": "Lượt thích",
	"following": "Đang theo dõi",
	"mutedUsers": "Người đã ẩn",
	"notes": "Bài Viết",
	"lists": "Danh sách"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"notificationPollEnded": "问卷调查结果已生成。",
	"notificationScheduledNotePosted": "定时帖子已发布",
	"notificationScheduledNotePostFailed": "定时帖子发布失败",
	"notificationNewNote": "新的帖子",
	"notificationRoleAssigned": "授予的角色",
	"notificationChatRoomInvitationReceived": "您已被邀请加入群聊",
	"notificationAchievementEarned": "获得成就",
	"notificationLogin": "有新的登录",
	"notificationCreateToken": "访问令牌已创建",
	"notificationTestNotification": "测试通知",
	"notificationExportOfXCompleted": "已完成 {x} 的导出",
	"notificationLikedBySomeUsers": "{n}人赞了你的帖子",
	"notificationReactedBySomeUsers": "{n} 人回应了",
	"notificationRenotedBySomeUsers": "{n} 人转发了",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "初来乍到",
			"description": "第一次发帖",
			"flavor": "祝您在 Misskey 玩的愉快～"
		},
		"_notes10": {
			"title": "一些帖子",
			"description": "发布了 10 篇帖子"
		},
		"_notes100": {
			"title": "很多帖子",
			"description": "发布了 100 篇帖子"
		},
		"_notes500": {
			"title": "满是帖子",
			"description": "发布了 500 篇帖子"
		},
		"_notes1000": {
			"title": "积帖成山",
			"description": "发布了 1,000 篇帖子"
		},
		"_notes5000": {
			"title": "帖如泉涌",
			"description": "发布了 5,000 篇帖子"
		},
		"_notes10000": {
			"title": "超级帖",
			"description": "发布了 10,000 篇帖子"
		},
		"_notes20000": {
			"title": "还想要更多帖子",
			"description": "发布了 20,000 篇帖子"
		},
		"_notes30000": {
			"title": "帖子帖子帖子",
			"description": "发布了 30,000 篇帖子"
		},
		"_notes40000": {
			"title": "帖子工厂",
			"description": "发布了 40,000 篇帖子"
		},
		"_notes50000": {
			"title": "帖子星球",
			"description": "发布了 50,000 篇帖子"
		},
		"_notes60000": {
			"title": "帖子类星体",
			"description": "发布了 60,000 篇帖子"
		},
		"_notes70000": {
			"title": "帖子黑洞",
			"description": "发布了 70,000 篇帖子"
		},
		"_notes80000": {
			"title": "帖子星系",
			"description": "发布了 80,000 篇帖子"
		},
		"_notes90000": {
			"title": "帖子起源",
			"description": "发布了 90,000 篇帖子"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "发布了 100,000 篇帖子",
			"flavor": "真的有那么多可以写的东西吗？"
		},
		"_login3": {
			"title": "初学者 I",
			"description": "累计登录 3 天",
			"flavor": "今天开始我就是 Misskist！"
		},
		"_login7": {
			"title": "初学者 II",
			"description": "累计登录 7 天",
			"flavor": "您开始习惯了吗？"
		},
		"_login15": {
			"title": "初学者 III",
			"description": "累计登录 15 天"
		},
		"_login30": {
			"title": "Misskist Ⅰ",
			"description": "累计登录 30 天"
		},
		"_login60": {
			"title": "Misskist Ⅱ",
			"description": "累计登录 60 天"
		},
		"_login100": {
			"title": "Misskist Ⅲ",
			"description": "累计登入 100 天",
			"flavor": "那个用户，是 Misskist 喔"
		},
		"_login200": {
			"title": "定期联系Ⅰ",
			"description": "累计登录 200 天"
		},
		"_login300": {
			"title": "定期联系Ⅱ",
			"description": "累计登录 300 天"
		},
		"_login400": {
			"title": "定期联系Ⅲ",
			"description": "累计登录 400 天"
		},
		"_login500": {
			"title": "老熟人Ⅰ",
			"description": "累计登录 500 天",
			"flavor": "诸君，我喜欢帖文"
		},
		"_login600": {
			"title": "老熟人Ⅱ",
			"description": "累计登录 600 天"
		},
		"_login700": {
			"title": "老熟人Ⅲ",
			"description": "累计登录 700 天"
		},
		"_login800": {
			"title": "帖子大师 Ⅰ",
			"description": "累计登录 800 天"
		},
		"_login900": {
			"title": "帖子大师 Ⅱ",
			"description": "累计登录 900 天"
		},
		"_login1000": {
			"title": "帖子大师 Ⅲ",
			"description": "累计登录 1000 天",
			"flavor": "感谢您使用 Misskey！"
		},
		"_noteClipped1": {
			"title": "忍不住想加入便签",
			"description": "第一次将帖子加入便签"
		},
		"_noteFavorited1": {
			"title": "观星者",
			"description": "第一次将帖子加入收藏"
		},
		"_myNoteFavorited1": {
			"title": "想要星星",
			"description": "自己的帖子被其他人收藏了"
		},
		"_profileFilled": {
			"title": "整装待发",
			"description": "设置了个人资料"
		},
		"_markedAsCat": {
			"title": "我是猫",
			"description": "将账户设定为一只猫",
			"flavor": "还没有名字"
		},
		"_following1": {
			"title": "首次关注",
			"description": "第一次关注别人"
		},
		"_following10": {
			"title": "关注，跟随",
			"description": "关注超过 10 人"
		},
		"_following50": {
			"title": "我的朋友很多",
			"description": "关注超过 50 人"
		},
		"_following100": {
			"title": "胜友如云",
			"description": "关注超过 100 人"
		},
		"_following300": {
			"title": "朋友成群",
			"description": "关注数超过 300"
		},
		"_followers1": {
			"title": "最初的关注者",
			"description": "第一次被关注"
		},
		"_followers10": {
			"title": "关注我吧！",
			"description": "拥有超过 10 名关注者"
		},
		"_followers50": {
			"title": "三五成群",
			"description": "拥有超过 50 名关注者"
		},
		"_followers100": {
			"title": "胜友如云",
			"description": "拥有超过 100 名关注者"
		},
		"_followers300": {
			"title": "排列成行",
			"description": "拥有超过 300 名关注者"
		},
		"_followers500": {
			"title": "信号塔",
			"description": "拥有超过 500 名关注者"
		},
		"_followers1000": {
			"title": "大影响家",
			"description": "拥有超过 1000 名关注者"
		},
		"_collectAchievements30": {
			"title": "成就收藏家",
			"description": "获得超过 30 个成就"
		},
		"_viewAchievements3min": {
			"title": "成就爱好者",
			"description": "盯着成就看三分钟"
		},
		"_iLoveMisskey": {
			"title": "I Love Misskey",
			"description": "发布 \"I ❤ #Misskey\" 帖子",
			"flavor": "感谢您使用 Misskey ！ by 开发团队"
		},
		"_foundTreasure": {
			"title": "寻宝",
			"description": "发现了隐藏的宝藏"
		},
		"_client30min": {
			"title": "休息一下！",
			"description": "启动客户端超过 30 分钟"
		},
		"_client60min": {
			"title": "Misskey 重度依赖",
			"description": "启动客户端超过 60 分钟"
		},
		"_noteDeletedWithin1min": {
			"title": "欲言又止",
			"description": "发帖后一分钟内就将其删除"
		},
		"_postedAtLateNight": {
			"title": "夜猫子",
			"description": "深夜发布帖子",
			"flavor": "差不多该去睡了喔。"
		},
		"_postedAt0min0sec": {
			"title": "报时",
			"description": "在 0 点发布一篇帖子",
			"flavor": "嘟 · 嘟 · 嘟 · 哔——"
		},
		"_selfQuote": {
			"title": "自我引用",
			"description": "引用了自己的帖子"
		},
		"_htl20npm": {
			"title": "流动的时间线",
			"description": "首页时间线中，帖子加载速度超过每分钟20篇"
		},
		"_viewInstanceChart": {
			"title": "分析师",
			"description": "查看了服务器信息中的图表"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "在 AiScript 控制台中输出 hello world"
		},
		"_open3windows": {
			"title": "多窗口",
			"description": "打开了三个或更多的窗口"
		},
		"_driveFolderCircularReference": {
			"title": "循环引用",
			"description": "试图对网盘中的文件夹进行循环嵌套"
		},
		"_reactWithoutRead": {
			"title": "有好好读过吗？",
			"description": "在含有100字以上的帖子被发出三秒内做出回应"
		},
		"_clickedClickHere": {
			"title": "点这里",
			"description": "点了这里"
		},
		"_justPlainLucky": {
			"title": "超高校级的幸运",
			"description": "每 10 秒有 0.005% 的概率自动获得"
		},
		"_setNameToSyuilo": {
			"title": "上帝情结",
			"description": "将名称设定为 syuilo"
		},
		"_passedSinceAccountCreated1": {
			"title": "一周年",
			"description": "账户创建时间超过 1 年"
		},
		"_passedSinceAccountCreated2": {
			"title": "二周年",
			"description": "账户创建时间超过 2 年"
		},
		"_passedSinceAccountCreated3": {
			"title": "三周年",
			"description": "账户创建时间超过 3 年"
		},
		"_loggedInOnBirthday": {
			"title": "生日快乐",
			"description": "在生日当天登录"
		},
		"_loggedInOnNewYearsDay": {
			"title": "恭贺新禧",
			"description": "在元旦登入",
			"flavor": "今年也请对本服务器多多指教！"
		},
		"_cookieClicked": {
			"title": "饼干点点乐",
			"description": "点击了饼干",
			"flavor": "穿越了？"
		},
		"_brainDiver": {
			"title": "Brain Diver",
			"description": "发布了包含 Brain Diver 链接的帖子",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "过度测试",
			"description": "短时间内连续测试通知"
		},
		"_tutorialCompleted": {
			"title": "Misskey 初学者课程 结业证书",
			"description": "完成了教学"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "你合成出了游戏里最大的Emoji"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "两个🤯",
			"description": "你合成出了2个游戏里最大的Emoji",
			"flavor": "大约能\u3000装满\u3000这些便当盒\u3000🤯\u3000🤯\u3000（比划）"
		}
	},
	"showFile": "显示文件",
	"notificationCreateTokenDescription": "如果不明白其用途，请遵循 “{text}” 的指示删除访问令牌。",
	"manageAccessTokens": "管理访问令牌",
	"youGotNewFollower": "你有新的关注者",
	"followRequestAccepted": "您的关注请求被通过了",
	"receiveFollowRequest": "您收到了关注请求",
	"accept": "允许",
	"reject": "拒绝",
	"notificationNotificationWillBeDisplayedLikeThis": "通知将会这样表示",
	"antennas": "天线",
	"blockedUsers": "已屏蔽的用户",
	"clips": "便签",
	"customEmojis": "自定义表情符号",
	"favorites": "收藏",
	"following": "关注中",
	"mutedUsers": "已隐藏的用户",
	"notes": "帖子",
	"lists": "列表"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"notificationPollEnded": "問卷調查已產生結果",
	"notificationScheduledNotePosted": "已排定發布貼文",
	"notificationScheduledNotePostFailed": "排定發布貼文失敗了",
	"notificationNewNote": "新的貼文",
	"notificationRoleAssigned": "已授予角色",
	"notificationChatRoomInvitationReceived": "您被邀請加入聊天室",
	"notificationAchievementEarned": "獲得成就",
	"notificationLogin": "已登入",
	"notificationCreateToken": "已產生存取權杖",
	"notificationTestNotification": "通知測試",
	"notificationExportOfXCompleted": "{x} 的匯出已完成。",
	"notificationLikedBySomeUsers": "{n} 人按了讚",
	"notificationReactedBySomeUsers": "{n}人做出了反應",
	"notificationRenotedBySomeUsers": "{n}人做了轉發",
	"achievementsTypesLabels": {
		"_notes1": {
			"title": "歡迎！",
			"description": "發出了第一則貼文",
			"flavor": "祝您的 Misskey 生活愉快！"
		},
		"_notes10": {
			"title": "若干貼文",
			"description": "發佈了十篇貼文"
		},
		"_notes100": {
			"title": "許多貼文",
			"description": "發佈了一百篇貼文"
		},
		"_notes500": {
			"title": "滿滿的貼文",
			"description": "發佈了五百篇貼文"
		},
		"_notes1000": {
			"title": "堆積如山的貼文",
			"description": "發佈了一千篇貼文"
		},
		"_notes5000": {
			"title": "滔滔不絕的貼文",
			"description": "發佈了五千篇貼文"
		},
		"_notes10000": {
			"title": "超級貼文",
			"description": "發佈了一萬篇貼文"
		},
		"_notes20000": {
			"title": "需要更多貼文",
			"description": "發佈了兩萬篇貼文"
		},
		"_notes30000": {
			"title": "貼文貼文貼文",
			"description": "發佈了三萬篇貼文"
		},
		"_notes40000": {
			"title": "貼文工廠",
			"description": "發佈了四萬篇貼文"
		},
		"_notes50000": {
			"title": "貼文星球",
			"description": "發佈了五萬篇貼文"
		},
		"_notes60000": {
			"title": "貼文類星體",
			"description": "發佈了六萬篇貼文"
		},
		"_notes70000": {
			"title": "貼文黑洞",
			"description": "發佈了七萬篇貼文"
		},
		"_notes80000": {
			"title": "貼文銀河",
			"description": "發佈了八萬篇貼文"
		},
		"_notes90000": {
			"title": "貼文宇宙",
			"description": "發佈了九萬篇貼文"
		},
		"_notes100000": {
			"title": "ALL YOUR NOTE ARE BELONG TO US",
			"description": "發佈了十萬篇貼文",
			"flavor": "有這麼多東西要寫嗎？"
		},
		"_login3": {
			"title": "初學者Ⅰ",
			"description": "總登入天數為三天",
			"flavor": "從今天開始，我就是 Misskist"
		},
		"_login7": {
			"title": "初學者ⅠⅠ",
			"description": "總登入天數為七天",
			"flavor": "您開始習慣了嗎？"
		},
		"_login15": {
			"title": "初學者ⅠⅠⅠ",
			"description": "總登入天數為十五天"
		},
		"_login30": {
			"title": "Misskist Ⅰ",
			"description": "總登入天數為三十天"
		},
		"_login60": {
			"title": "Misskist ⅠⅠ",
			"description": "總登入天數為六十天"
		},
		"_login100": {
			"title": "Misskist ⅠⅠⅠ",
			"description": "總登入天數為一百天",
			"flavor": "凶暴的 Misskist"
		},
		"_login200": {
			"title": "普通Ⅰ",
			"description": "總登入天數為兩百天"
		},
		"_login300": {
			"title": "普通ⅠⅠ",
			"description": "總登入天數為三百天"
		},
		"_login400": {
			"title": "普通ⅠⅠⅠ",
			"description": "總登入天數為四百天"
		},
		"_login500": {
			"title": "老兵Ⅰ",
			"description": "總登入天數為五百天",
			"flavor": "諸君，我喜歡貼文"
		},
		"_login600": {
			"title": "老兵ⅠⅠ",
			"description": "總登入天數為六百天"
		},
		"_login700": {
			"title": "老兵ⅠⅠⅠ",
			"description": "總登入天數為七百天"
		},
		"_login800": {
			"title": "貼文大師Ⅰ",
			"description": "總登入天數為八百天"
		},
		"_login900": {
			"title": "貼文大師ⅠⅠ",
			"description": "總登入天數為九百天"
		},
		"_login1000": {
			"title": "貼文大師ⅠⅠⅠ",
			"description": "總登入天數為一千天",
			"flavor": "感謝您使用 Misskey！"
		},
		"_noteClipped1": {
			"title": "忍不住要收進摘錄裡",
			"description": "第一次將貼文收進摘錄"
		},
		"_noteFavorited1": {
			"title": "觀星者",
			"description": "第一次將貼文收藏至我的最愛"
		},
		"_myNoteFavorited1": {
			"title": "想要星星",
			"description": "自己的貼文被他人收藏至「我的最愛」了"
		},
		"_profileFilled": {
			"title": "有備而來",
			"description": "設定了個人檔案"
		},
		"_markedAsCat": {
			"title": "我是貓",
			"description": "已將帳戶設定為貓",
			"flavor": "沒有名字。"
		},
		"_following1": {
			"title": "首次追隨",
			"description": "首次追隨了"
		},
		"_following10": {
			"title": "跟著跟著",
			"description": "追隨超過10人了"
		},
		"_following50": {
			"title": "朋友很多",
			"description": "追隨超過50人了"
		},
		"_following100": {
			"title": "一百位朋友",
			"description": "追隨超過100人了"
		},
		"_following300": {
			"title": "朋友太多",
			"description": "追隨超過300人了"
		},
		"_followers1": {
			"title": "第一個追隨者",
			"description": "第一次被追隨"
		},
		"_followers10": {
			"title": "追隨我吧！",
			"description": "追隨者超過10人了"
		},
		"_followers50": {
			"title": "成群結隊",
			"description": "追隨者超過50人了"
		},
		"_followers100": {
			"title": "熱門人物",
			"description": "追隨者超過100人了"
		},
		"_followers300": {
			"title": "請排隊",
			"description": "追隨者超過300人了"
		},
		"_followers500": {
			"title": "基地臺",
			"description": "超過五百名追隨者了"
		},
		"_followers1000": {
			"title": "星光熠熠",
			"description": "超過一千名追隨者了"
		},
		"_collectAchievements30": {
			"title": "成就收藏家",
			"description": "獲得三十個以上的成就"
		},
		"_viewAchievements3min": {
			"title": "成就發燒友",
			"description": "看著成就列表超過三分鐘"
		},
		"_iLoveMisskey": {
			"title": "I Love Misskey",
			"description": "發佈「I ❤ #Misskey」",
			"flavor": "感謝您使用 Misskey！by 開發團隊"
		},
		"_foundTreasure": {
			"title": "尋寶",
			"description": "發現了隱藏的寶藏"
		},
		"_client30min": {
			"title": "休息一下",
			"description": "客戶端啟動已超過30分鐘"
		},
		"_client60min": {
			"title": "Misskey 看太多",
			"description": "客戶端啟動已超過60分鐘"
		},
		"_noteDeletedWithin1min": {
			"title": "欲言又止",
			"description": "發文後一分鐘內刪文"
		},
		"_postedAtLateNight": {
			"title": "夜貓子",
			"description": "在深夜發佈貼文",
			"flavor": "該去睡覺了。"
		},
		"_postedAt0min0sec": {
			"title": "報時",
			"description": "在零分零秒發佈貼文",
			"flavor": "啵．啵．啵．嗶ー"
		},
		"_selfQuote": {
			"title": "自我引用",
			"description": "引用了自己的貼文"
		},
		"_htl20npm": {
			"title": "源源不絕",
			"description": "首頁時間軸在一分鐘內出現超過二十篇貼文"
		},
		"_viewInstanceChart": {
			"title": "分析師",
			"description": "顯示了伺服器的圖表"
		},
		"_outputHelloWorldOnScratchpad": {
			"title": "Hello, world!",
			"description": "在 AiScript 控制臺輸出了「hello world」"
		},
		"_open3windows": {
			"title": "多重視窗",
			"description": "開啟過三個以上的視窗"
		},
		"_driveFolderCircularReference": {
			"title": "循環引用",
			"description": "試圖遞迴套入雲端硬碟資料夾"
		},
		"_reactWithoutRead": {
			"title": "有好好讀過嗎？",
			"description": "對包含100字以上內容的貼文在3秒以內做出反應"
		},
		"_clickedClickHere": {
			"title": "點擊這裡",
			"description": "已點擊這裡了"
		},
		"_justPlainLucky": {
			"title": "只是運氣好",
			"description": "每十秒有二萬分之一（0.005%）的機率獲得"
		},
		"_setNameToSyuilo": {
			"title": "神與您同在",
			"description": "將名稱設定為 syuilo"
		},
		"_passedSinceAccountCreated1": {
			"title": "一週年",
			"description": "帳戶加入時間已超過一年"
		},
		"_passedSinceAccountCreated2": {
			"title": "二週年",
			"description": "帳戶加入時間已超過兩年"
		},
		"_passedSinceAccountCreated3": {
			"title": "三週年",
			"description": "帳戶加入時間已超過三年"
		},
		"_loggedInOnBirthday": {
			"title": "生日快樂",
			"description": "在生日當天登入了"
		},
		"_loggedInOnNewYearsDay": {
			"title": "新年快樂",
			"description": "在元旦當天登入了",
			"flavor": "今年也請您多多指教！"
		},
		"_cookieClicked": {
			"title": "點擊餅乾的遊戲",
			"description": "點擊了餅乾",
			"flavor": "是不是軟體有問題？"
		},
		"_brainDiver": {
			"title": "Brain Driver",
			"description": "發佈一篇含歌曲《Brain Driver》連結的貼文",
			"flavor": "Misskey-Misskey La-Tu-Ma"
		},
		"_smashTestNotificationButton": {
			"title": "過度測試",
			"description": "極短時間內連續測試通知"
		},
		"_tutorialCompleted": {
			"title": "Misskey新手講座 結業證書",
			"description": "已完成教學課程"
		},
		"_bubbleGameExplodingHead": {
			"title": "🤯",
			"description": "氣泡遊戲中最大的物體出現了"
		},
		"_bubbleGameDoubleExplodingHead": {
			"title": "雙重🤯",
			"description": "氣泡遊戲中最大的物體同時出現了兩個",
			"flavor": "這樣大小的便當盒，用\u3000🤯\u3000🤯\u3000稍微裝滿一些吧"
		}
	},
	"showFile": "瀏覽文件",
	"notificationCreateTokenDescription": "如果您不知道，請透過「{text}」刪除存取權杖。",
	"manageAccessTokens": "管理存取權杖",
	"youGotNewFollower": "您有新的追隨者",
	"followRequestAccepted": "追隨請求已被接受",
	"receiveFollowRequest": "您有新的追隨請求",
	"accept": "接受",
	"reject": "拒絕",
	"notificationNotificationWillBeDisplayedLikeThis": "通知會以這樣的方式顯示",
	"antennas": "天線",
	"blockedUsers": "被封鎖的使用者",
	"clips": "摘錄",
	"customEmojis": "自訂表情符號",
	"favorites": "我的最愛",
	"following": "追隨中",
	"mutedUsers": "被靜音的使用者",
	"notes": "貼文",
	"lists": "清單"
}
</locale>
