<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :reversed="tab === 'chat'" :tabs="headerTabs" :actions="headerActions">
	<div v-if="tab === 'chat'" class="_spacer" style="--MI_SPACER-w: 700px;">
		<div class="_gaps">
			<div v-if="initializing">
				<MkLoading/>
			</div>

			<div v-else-if="messages.length === 0">
				<div class="_gaps" style="text-align: center;">
					<div>{{ $locale.sfc.noMessagesYet }}</div>
					<template v-if="user">
						<div v-if="user.chatScope === 'followers'">{{ $locale.sfc.thisUserAllowsChatOnlyFromFollowers }}</div>
						<div v-else-if="user.chatScope === 'following'">{{ $locale.sfc.thisUserAllowsChatOnlyFromFollowing }}</div>
						<div v-else-if="user.chatScope === 'mutual'">{{ $locale.sfc.thisUserAllowsChatOnlyFromMutualFollowing }}</div>
						<div v-else-if="user.chatScope === 'none'">{{ $locale.sfc.thisUserNotAllowedChatAnyone }}</div>
					</template>
					<template v-else-if="room">
						<div>{{ $locale.sfc.inviteUserToChat }}</div>
					</template>
				</div>
			</div>

			<div v-else ref="timelineEl" class="_gaps">
				<div v-if="canFetchMore">
					<MkButton :class="$style.more" :wait="moreFetching" primary rounded @click="fetchMore">{{ $locale.sfc.loadMore }}</MkButton>
				</div>

				<TransitionGroup
					:enterActiveClass="prefer.s.animation ? $style.transition_x_enterActive : ''"
					:leaveActiveClass="prefer.s.animation ? $style.transition_x_leaveActive : ''"
					:enterFromClass="prefer.s.animation ? $style.transition_x_enterFrom : ''"
					:leaveToClass="prefer.s.animation ? $style.transition_x_leaveTo : ''"
					:moveClass="prefer.s.animation ? $style.transition_x_move : ''"
					tag="div" class="_gaps"
				>
					<template v-for="item in timeline.toReversed()" :key="item.id">
						<XMessage v-if="item.type === 'item'" :message="item.data"/>
						<div v-else-if="item.type === 'date'" :class="$style.dateDivider">
							<span><i class="ti ti-chevron-up"></i> {{ item.nextText }}</span>
							<span style="height: 1em; width: 1px; background: var(--MI_THEME-divider);"></span>
							<span>{{ item.prevText }} <i class="ti ti-chevron-down"></i></span>
						</div>
					</template>
				</TransitionGroup>
			</div>

			<div v-if="user && (!user.canChat || user.host !== null)">
				<MkInfo warn>{{ $locale.sfc.chatNotAvailableInOtherAccount }}</MkInfo>
			</div>

			<MkInfo v-if="$i.policies.chatAvailability !== 'available'" warn>{{ $i.policies.chatAvailability === 'readonly' ? $locale.sfc.chatIsReadOnlyForThisAccountOrServer : $locale.sfc.chatNotAvailableForThisAccountOrServer }}</MkInfo>
		</div>
	</div>

	<div v-else-if="tab === 'search'" class="_spacer" style="--MI_SPACER-w: 700px;">
		<XSearch :userId="userId" :roomId="roomId"/>
	</div>

	<div v-else-if="tab === 'members'" class="_spacer" style="--MI_SPACER-w: 700px;">
		<XMembers v-if="room != null" :room="room" @inviteUser="inviteUser"/>
	</div>

	<div v-else-if="tab === 'info'" class="_spacer" style="--MI_SPACER-w: 700px;">
		<XInfo v-if="room != null" :room="room"/>
	</div>

	<template #footer>
		<div v-if="tab === 'chat'" :class="$style.footer">
			<div class="_gaps">
				<Transition name="fade">
					<div v-show="showIndicator" :class="$style.new">
						<button class="_buttonPrimary" :class="$style.newButton" @click="onIndicatorClick">
							<i class="fas ti-fw fa-arrow-circle-down" :class="$style.newIcon"></i>{{ $locale.sfc.newMessage }}
						</button>
					</div>
				</Transition>
				<XForm v-if="initialized" :user="user" :room="room" :class="$style.form"/>
			</div>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef, computed, onMounted, onBeforeUnmount, onDeactivated, onActivated } from 'vue';
import * as Misskey from 'misskey-js';
import { getScrollContainer } from '@@/js/scroll.js';
import XMessage from '@features/chat/frontend/pages/chat/XMessage.vue';
import XForm from '@features/chat/frontend/pages/chat/room.form.vue';
import XSearch from '@features/chat/frontend/pages/chat/room.search.vue';
import XMembers from '@features/chat/frontend/pages/chat/room.members.vue';
import XInfo from '@features/chat/frontend/pages/chat/room.info.vue';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import type { PageHeaderItem } from '@features/navigation/frontend/types/page-header.js';
import * as os from '@features/ui/frontend/os.js';
import { useStream } from '@features/api/frontend/stream.js';
import * as sound from '@features/preferences/frontend/utility/sound.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { useRouter } from '@features/navigation/frontend/router.js';
import { useMutationObserver } from '@features/ui/frontend/composables/use-mutation-observer.js';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { makeDateSeparatedTimelineComputedRef } from '@features/timelines/frontend/utility/timeline-date-separate.js';

const $i = ensureSignin();
const router = useRouter();

const props = defineProps<{
	userId?: string;
	roomId?: string;
}>();

export type NormalizedChatMessage = Omit<Misskey.entities.ChatMessageLite, 'fromUser' | 'reactions'> & {
	fromUser: Misskey.entities.UserLite;
	reactions: (Misskey.entities.ChatMessageLite['reactions'][number] & {
		user: Misskey.entities.UserLite;
	})[];
};

const initializing = ref(false);
const initialized = ref(false);
const moreFetching = ref(false);
const messages = ref<NormalizedChatMessage[]>([]);
const canFetchMore = ref(false);
const user = ref<Misskey.entities.UserDetailed | null>(null);
const room = ref<Misskey.entities.ChatRoom | null>(null);
const connection = ref<Misskey.IChannelConnection<Misskey.Channels['chatUser']> | Misskey.IChannelConnection<Misskey.Channels['chatRoom']> | null>(null);
const showIndicator = ref(false);
const timelineEl = useTemplateRef('timelineEl');
const timeline = makeDateSeparatedTimelineComputedRef(messages);

const SCROLL_HEAD_THRESHOLD = 200;

// column-reverseなので本来はスクロール位置の最下部への追従は不要なはずだが、おそらくブラウザのバグにより、最下部にスクロールした状態でも追従されない場合がある(スクロール位置が少数になることがあるのが関わっていそう)
// そのため補助としてMutationObserverを使って追従を行う
useMutationObserver(timelineEl, {
	subtree: true,
	childList: true,
	attributes: false,
}, () => {
	const scrollContainer = getScrollContainer(timelineEl.value)!;
	// column-reverseなのでscrollTopは負になる
	if (-scrollContainer.scrollTop < SCROLL_HEAD_THRESHOLD) {
		scrollContainer.scrollTo({
			top: 0,
			behavior: 'instant',
		});
	}
});

function normalizeMessage(message: Misskey.entities.ChatMessageLite | Misskey.entities.ChatMessage): NormalizedChatMessage {
	return {
		...message,
		fromUser: message.fromUser ?? (message.fromUserId === $i.id ? $i : user.value!),
		reactions: message.reactions.map(record => ({
			...record,
			user: record.user ?? (message.fromUserId === $i.id ? user.value! : $i),
		})),
	};
}

async function initialize() {
	const LIMIT = 20;

	if (initializing.value) return;

	initializing.value = true;
	initialized.value = false;

	if (props.userId) {
		const [u, m] = await Promise.all([
			misskeyApi('users/show', { userId: props.userId }),
			misskeyApi('chat/messages/user-timeline', { userId: props.userId, limit: LIMIT }),
		]);

		user.value = u;
		messages.value = m.map(x => normalizeMessage(x));

		if (messages.value.length === LIMIT) {
			canFetchMore.value = true;
		}

		connection.value = useStream().useChannel('chatUser', {
			otherId: user.value.id,
		});
		connection.value.on('message', onMessage);
		connection.value.on('deleted', onDeleted);
		connection.value.on('react', onReact);
		connection.value.on('unreact', onUnreact);
	} else if (props.roomId) {
		const [rResult, mResult] = await Promise.allSettled([
			misskeyApi('chat/rooms/show', { roomId: props.roomId }),
			misskeyApi('chat/messages/room-timeline', { roomId: props.roomId, limit: LIMIT }),
		]);

		if (rResult.status === 'rejected') {
			os.alert({
				type: 'error',
				text: $locale.value.sfc.somethingHappened,
			});
			initializing.value = false;
			return;
		}

		const r = rResult.value as Misskey.entities.ChatRoomsShowResponse;

		if (r.invitationExists) {
			const confirm = await os.confirm({
				type: 'question',
				title: r.name,
				text: $locale.value.sfc.youAreNotAMemberOfThisRoomButInvited + '\n' + $locale.value.sfc.doYouAcceptInvitation,
			});
			if (confirm.canceled) {
				initializing.value = false;
				router.push('/chat');
				return;
			} else {
				await os.apiWithDialog('chat/rooms/join', { roomId: r.id });
				initializing.value = false;
				initialize();
				return;
			}
		}

		const m = mResult.status === 'fulfilled' ? mResult.value as Misskey.entities.ChatMessagesRoomTimelineResponse : [];

		room.value = r;
		messages.value = m.map(x => normalizeMessage(x));

		if (messages.value.length === LIMIT) {
			canFetchMore.value = true;
		}

		connection.value = useStream().useChannel('chatRoom', {
			roomId: room.value.id,
		});
		connection.value.on('message', onMessage);
		connection.value.on('deleted', onDeleted);
		connection.value.on('react', onReact);
		connection.value.on('unreact', onUnreact);
	}

	window.document.addEventListener('visibilitychange', onVisibilitychange);

	initialized.value = true;
	initializing.value = false;
}

let isActivated = true;

onActivated(() => {
	isActivated = true;
});

onDeactivated(() => {
	isActivated = false;
});

async function fetchMore() {
	const LIMIT = 30;

	moreFetching.value = true;

	const newMessages = props.userId ? await misskeyApi('chat/messages/user-timeline', {
		userId: user.value!.id,
		limit: LIMIT,
		untilId: messages.value[messages.value.length - 1].id,
	}) : await misskeyApi('chat/messages/room-timeline', {
		roomId: room.value!.id,
		limit: LIMIT,
		untilId: messages.value[messages.value.length - 1].id,
	});

	messages.value.push(...newMessages.map(x => normalizeMessage(x)));

	canFetchMore.value = newMessages.length === LIMIT;
	moreFetching.value = false;
}

function onMessage(message: Misskey.entities.ChatMessageLite) {
	sound.playMisskeySfx('chatMessage');

	messages.value.unshift(normalizeMessage(message));

	// TODO: DOM的にバックグラウンドになっていないかどうかも考慮する
	if (message.fromUserId !== $i.id && !window.document.hidden && isActivated) {
		connection.value?.send('read', {
			id: message.id,
		});
	}

	if (message.fromUserId !== $i.id) {
		//notifyNewMessage();
	}
}

function onDeleted(id: string) {
	const index = messages.value.findIndex(m => m.id === id);
	if (index !== -1) {
		messages.value.splice(index, 1);
	}
}

function onReact(ctx: Parameters<Misskey.Channels['chatUser']['events']['react']>[0] | Parameters<Misskey.Channels['chatRoom']['events']['react']>[0]) {
	const message = messages.value.find(m => m.id === ctx.messageId);
	if (message) {
		if (room.value == null) { // 1on1の時はuserは省略される
			message.reactions.push({
				reaction: ctx.reaction,
				user: message.fromUserId === $i.id ? user.value! : $i,
			});
		} else {
			message.reactions.push({
				reaction: ctx.reaction,
				user: ctx.user!,
			});
		}
	}
}

function onUnreact(ctx: Parameters<Misskey.Channels['chatUser']['events']['unreact']>[0] | Parameters<Misskey.Channels['chatRoom']['events']['unreact']>[0]) {
	const message = messages.value.find(m => m.id === ctx.messageId);
	if (message) {
		const index = message.reactions.findIndex(r => r.reaction === ctx.reaction && r.user.id === ctx.user!.id);
		if (index !== -1) {
			message.reactions.splice(index, 1);
		}
	}
}

function onIndicatorClick() {
	showIndicator.value = false;
}

function notifyNewMessage() {
	showIndicator.value = true;
}

function onVisibilitychange() {
	if (window.document.hidden) return;
	// TODO
}

onMounted(() => {
	initialize();
});

onActivated(() => {
	if (!initialized.value) {
		initialize();
	}
});

onBeforeUnmount(() => {
	connection.value?.dispose();
	window.document.removeEventListener('visibilitychange', onVisibilitychange);
});

async function inviteUser() {
	if (room.value == null) return;

	const invitee = await os.selectUser({ includeSelf: false, localOnly: true });
	os.apiWithDialog('chat/rooms/invitations/create', {
		roomId: room.value.id,
		userId: invitee.id,
	});
}

async function leaveRoom() {
	if (room.value == null) return;

	const { canceled } = await os.confirm({
		type: 'warning',
		text: $locale.value.sfc.areYouSure,
	});
	if (canceled) return;

	misskeyApi('chat/rooms/leave', {
		roomId: room.value.id,
	});
	router.push('/chat');
}

function showMenu(ev: PointerEvent) {
	const menuItems: MenuItem[] = [];

	if (room.value) {
		if (room.value.ownerId === $i.id) {
			menuItems.push({
				text: $locale.value.sfc.inviteUser,
				icon: 'ti ti-user-plus',
				action: () => {
					inviteUser();
				},
			});
		} else {
			menuItems.push({
				text: $locale.value.sfc.leave,
				icon: 'ti ti-x',
				action: () => {
					leaveRoom();
				},
			});
		}
	}

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}

const tab = ref('chat');

const headerTabs = computed(() => room.value ? [{
	key: 'chat',
	title: $locale.value.sfc.messages,
	icon: 'ti ti-messages',
}, {
	key: 'members',
	title: $locale.value.sfc.members,
	icon: 'ti ti-users',
}, {
	key: 'search',
	title: $locale.value.sfc.search,
	icon: 'ti ti-search',
}, {
	key: 'info',
	title: $locale.value.sfc.info,
	icon: 'ti ti-info-circle',
}] : [{
	key: 'chat',
	title: $locale.value.sfc.messages,
	icon: 'ti ti-messages',
}, {
	key: 'search',
	title: $locale.value.sfc.search,
	icon: 'ti ti-search',
}]);

const headerActions = computed<PageHeaderItem[]>(() => [{
	icon: 'ti ti-dots',
	handler: showMenu,
}]);

definePage(computed(() => {
	if (initialized.value) {
		if (user.value) {
			return {
				userName: user.value,
				title: user.value.name ?? user.value.username,
				avatar: user.value,
			};
		} else if (room.value) {
			return {
				title: room.value.name,
				icon: 'ti ti-users',
			};
		} else {
			return {
				title: $locale.value.sfc.directMessage,
			};
		}
	} else {
		return {
			title: $locale.value.sfc.directMessage,
		};
	}
}));
</script>

<style lang="scss" module>
.transition_x_move,
.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.2s cubic-bezier(0,.5,.5,1), transform 0.2s cubic-bezier(0,.5,.5,1) !important;
}
.transition_x_enterFrom,
.transition_x_leaveTo {
	opacity: 0;
	transform: translateY(80px);
}
.transition_x_leaveActive {
	position: absolute;
}

.root {
}

.more {
	margin: 0 auto;
}

.footer {
	width: 100%;
	padding-top: 8px;
}

.new {
	width: 100%;
	padding-bottom: 8px;
	text-align: center;
}

.newButton {
	display: inline-block;
	margin: 0;
	padding: 0 12px;
	line-height: 32px;
	font-size: 12px;
	border-radius: 16px;
}

.newIcon {
	display: inline-block;
	margin-right: 8px;
}

.footer {

}

.form {
	margin: 0 auto;
	width: 100%;
	max-width: 700px;
}

.fade-enter-active, .fade-leave-active {
	transition: opacity 0.1s;
}

.fade-enter-from, .fade-leave-to {
	transition: opacity 0.5s;
	opacity: 0;
}

.dateDivider {
	display: flex;
	font-size: 85%;
	align-items: center;
	justify-content: center;
	gap: 0.5em;
	opacity: 0.75;
	border: solid 0.5px var(--MI_THEME-divider);
	border-radius: 999px;
	width: fit-content;
	padding: 0.5em 1em;
	margin: 0 auto;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"somethingHappened": "حدث خطأ",
	"youAreNotAMemberOfThisRoomButInvited": "You are not a participant in this room, but you have received an invitation. Please accept the invitation to join.",
	"doYouAcceptInvitation": "Do you accept the invitation?",
	"areYouSure": "Are you sure?",
	"inviteUser": "Invite Users",
	"leave": "Leave room",
	"messages": "Messages",
	"members": "الأعضاء",
	"search": "البحث",
	"info": "عن",
	"directMessage": "Chat with user",
	"noMessagesYet": "No messages yet",
	"thisUserAllowsChatOnlyFromFollowers": "This user accepts chats from followers only.",
	"thisUserAllowsChatOnlyFromFollowing": "This user accepts chats only from users they follow.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "This user only accepts chats from users who are mutual followers.",
	"thisUserNotAllowedChatAnyone": "This user is not accepting chats from anyone.",
	"inviteUserToChat": "Invite users to start chatting",
	"loadMore": "عرض المزيد",
	"chatNotAvailableInOtherAccount": "The chat function is disabled for the other user.",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"newMessage": "New message"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"somethingHappened": "S'ha produït un error",
	"youAreNotAMemberOfThisRoomButInvited": "No participes en aquesta sala, però has rebut una invitació. Per participar accepta la invitació.",
	"doYouAcceptInvitation": "Acceptes la invitació?",
	"areYouSure": "Estàs segur?",
	"inviteUser": "Invitar usuaris",
	"leave": "Marxar",
	"messages": "Missatge",
	"members": "Membres",
	"search": "Cercar",
	"info": "Informació",
	"directMessage": "Xateja amb aquest usuari",
	"noMessagesYet": "Encara no tens missatges ",
	"thisUserAllowsChatOnlyFromFollowers": "Aquest usuari només accepta xats d'usuaris que el segueixen.",
	"thisUserAllowsChatOnlyFromFollowing": "Aquest usuari només accepta xats d'usuaris que segueix.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "Aquest usuari només accepta xats d'usuaris que segueixes i et segueixen.",
	"thisUserNotAllowedChatAnyone": "Aquest usuari no accepta xats de ningú.",
	"inviteUserToChat": "Invita usuaris per començar a xatejar",
	"loadMore": "Carregar més",
	"chatNotAvailableInOtherAccount": "La funció de xat es troba desactivada al compte de l'altre usuari.",
	"chatIsReadOnlyForThisAccountOrServer": "El xat és només de lectura en aquest servidor o compte. No es poden escriure nous missatges ni crear o unir-se a sales de xat.",
	"chatNotAvailableForThisAccountOrServer": "El xat no està disponible per aquest servidor o aquest compte.",
	"newMessage": "Missatge nou"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"somethingHappened": "Jejda. Něco se nepovedlo.",
	"youAreNotAMemberOfThisRoomButInvited": "You are not a participant in this room, but you have received an invitation. Please accept the invitation to join.",
	"doYouAcceptInvitation": "Do you accept the invitation?",
	"areYouSure": "Jste si jistí?",
	"inviteUser": "Invite Users",
	"leave": "Leave room",
	"messages": "Messages",
	"members": "Členové",
	"search": "Vyhledávání",
	"info": "Informace",
	"directMessage": "Chat with user",
	"noMessagesYet": "No messages yet",
	"thisUserAllowsChatOnlyFromFollowers": "This user accepts chats from followers only.",
	"thisUserAllowsChatOnlyFromFollowing": "This user accepts chats only from users they follow.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "This user only accepts chats from users who are mutual followers.",
	"thisUserNotAllowedChatAnyone": "This user is not accepting chats from anyone.",
	"inviteUserToChat": "Invite users to start chatting",
	"loadMore": "Zobrazit více",
	"chatNotAvailableInOtherAccount": "The chat function is disabled for the other user.",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"newMessage": "New message"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"somethingHappened": "An error has occurred",
	"youAreNotAMemberOfThisRoomButInvited": "You are not a participant in this room, but you have received an invitation. Please accept the invitation to join.",
	"doYouAcceptInvitation": "Do you accept the invitation?",
	"areYouSure": "Are you sure?",
	"inviteUser": "Invite Users",
	"leave": "Leave room",
	"messages": "Messages",
	"members": "Members",
	"search": "Search",
	"info": "About",
	"directMessage": "Chat with user",
	"noMessagesYet": "No messages yet",
	"thisUserAllowsChatOnlyFromFollowers": "This user accepts chats from followers only.",
	"thisUserAllowsChatOnlyFromFollowing": "This user accepts chats only from users they follow.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "This user only accepts chats from users who are mutual followers.",
	"thisUserNotAllowedChatAnyone": "This user is not accepting chats from anyone.",
	"inviteUserToChat": "Invite users to start chatting",
	"loadMore": "Load more",
	"chatNotAvailableInOtherAccount": "The chat function is disabled for the other user.",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"newMessage": "New message"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"somethingHappened": "Ein Fehler ist aufgetreten",
	"youAreNotAMemberOfThisRoomButInvited": "Du bist kein Teilnehmer in diesem Raum, aber du hast eine Einladung erhalten. Bitte nimm die Einladung an, um beizutreten.",
	"doYouAcceptInvitation": "Nimmst du die Einladung an?",
	"areYouSure": "Bist du sicher?",
	"inviteUser": "Benutzer einladen",
	"leave": "Raum verlassen",
	"messages": "Nachrichten",
	"members": "Mitglieder",
	"search": "Suchen",
	"info": "Über",
	"directMessage": "Mit dem Benutzer chatten",
	"noMessagesYet": "Noch keine Nachrichten",
	"thisUserAllowsChatOnlyFromFollowers": "Dieser Benutzer nimmt nur Chats von Followern an.",
	"thisUserAllowsChatOnlyFromFollowing": "Dieser Benutzer nimmt nur Chats von Benutzern an, denen er folgt.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "Dieser Benutzer akzeptiert nur Chats von Benutzern, die sich gegenseitig folgen.",
	"thisUserNotAllowedChatAnyone": "Dieser Benutzer nimmt keine Chats von anderen Benutzern an.",
	"inviteUserToChat": "Lade Benutzer ein, um mit dem Chatten zu beginnen",
	"loadMore": "Mehr laden",
	"chatNotAvailableInOtherAccount": "Die Chatfunktion wurde vom anderen Benutzer deaktiviert.",
	"chatIsReadOnlyForThisAccountOrServer": "Der Chat ist auf dieser Instanz oder diesem Konto nur zum Lesen freigegeben. Es ist nicht möglich, neue Nachrichten zu schreiben oder Chaträume zu erstellen oder zu betreten.",
	"chatNotAvailableForThisAccountOrServer": "Der Chat ist auf diesem Server oder für dieses Konto nicht aktiviert.",
	"newMessage": "Neue Nachricht"
}
</locale>

<locale locale="en-US" lang="json">
{
	"somethingHappened": "An error has occurred",
	"youAreNotAMemberOfThisRoomButInvited": "You are not a participant in this room, but you have received an invitation. Please accept the invitation to join.",
	"doYouAcceptInvitation": "Do you accept the invitation?",
	"areYouSure": "Are you sure?",
	"inviteUser": "Invite Users",
	"leave": "Leave room",
	"messages": "Messages",
	"members": "Members",
	"search": "Search",
	"info": "About",
	"directMessage": "Chat with user",
	"noMessagesYet": "No messages yet",
	"thisUserAllowsChatOnlyFromFollowers": "This user accepts chats from followers only.",
	"thisUserAllowsChatOnlyFromFollowing": "This user accepts chats only from users they follow.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "This user only accepts chats from users who are mutual followers.",
	"thisUserNotAllowedChatAnyone": "This user is not accepting chats from anyone.",
	"inviteUserToChat": "Invite users to start chatting",
	"loadMore": "Load more",
	"chatNotAvailableInOtherAccount": "The chat function is disabled for the other user.",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"newMessage": "New message"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"somethingHappened": "Ocurrió un error",
	"youAreNotAMemberOfThisRoomButInvited": "No eres participante en esta sala, pero has recibido una invitación. Por favor, acepta la invitación para unirte.",
	"doYouAcceptInvitation": "¿Aceptas la invitación?",
	"areYouSure": "¿Estás conforme?",
	"inviteUser": "Invitar  usuarios",
	"leave": "Dejar sala",
	"messages": "Mensajes",
	"members": "Miembros",
	"search": "Buscar",
	"info": "Información",
	"directMessage": "Chatear",
	"noMessagesYet": "Aún no hay mensajes",
	"thisUserAllowsChatOnlyFromFollowers": "Este usuario sólo acepta chats de seguidores.",
	"thisUserAllowsChatOnlyFromFollowing": "Este usuario sólo acepta chats de los usuarios a los que sigue.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "Este usuario sólo acepta chats de usuarios que son seguidores mutuos.",
	"thisUserNotAllowedChatAnyone": "Este usuario no acepta chats de nadie.",
	"inviteUserToChat": "Invitar usuarios para empezar a chatear",
	"loadMore": "Ver más",
	"chatNotAvailableInOtherAccount": "La función de chat está desactivada para el otro usuario.",
	"chatIsReadOnlyForThisAccountOrServer": "El chat es de sólo lectura en esta instancia o esta cuenta. No puedes escribir nuevos mensajes ni crear/unirte a salas de chat.",
	"chatNotAvailableForThisAccountOrServer": "El chat no está habilitado en este servidor ni para esta cuenta.",
	"newMessage": "Mensajes nuevos"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"somethingHappened": "Une erreur est survenue",
	"youAreNotAMemberOfThisRoomButInvited": "You are not a participant in this room, but you have received an invitation. Please accept the invitation to join.",
	"doYouAcceptInvitation": "Do you accept the invitation?",
	"areYouSure": "Êtes-vous sûr·e ?",
	"inviteUser": "Invite Users",
	"leave": "Leave room",
	"messages": "Messages",
	"members": "Membres",
	"search": "Rechercher",
	"info": "Informations",
	"directMessage": "Chat with user",
	"noMessagesYet": "No messages yet",
	"thisUserAllowsChatOnlyFromFollowers": "This user accepts chats from followers only.",
	"thisUserAllowsChatOnlyFromFollowing": "This user accepts chats only from users they follow.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "This user only accepts chats from users who are mutual followers.",
	"thisUserNotAllowedChatAnyone": "This user is not accepting chats from anyone.",
	"inviteUserToChat": "Invite users to start chatting",
	"loadMore": "Afficher plus …",
	"chatNotAvailableInOtherAccount": "The chat function is disabled for the other user.",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"newMessage": "New message"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"somethingHappened": "Terjadi kesalahan",
	"youAreNotAMemberOfThisRoomButInvited": "You are not a participant in this room, but you have received an invitation. Please accept the invitation to join.",
	"doYouAcceptInvitation": "Do you accept the invitation?",
	"areYouSure": "Apakah kamu yakin?",
	"inviteUser": "Invite Users",
	"leave": "Leave room",
	"messages": "Messages",
	"members": "Anggota",
	"search": "Cari",
	"info": "Informasi",
	"directMessage": "Obrolan pengguna",
	"noMessagesYet": "No messages yet",
	"thisUserAllowsChatOnlyFromFollowers": "This user accepts chats from followers only.",
	"thisUserAllowsChatOnlyFromFollowing": "This user accepts chats only from users they follow.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "This user only accepts chats from users who are mutual followers.",
	"thisUserNotAllowedChatAnyone": "This user is not accepting chats from anyone.",
	"inviteUserToChat": "Invite users to start chatting",
	"loadMore": "Selebihnya",
	"chatNotAvailableInOtherAccount": "The chat function is disabled for the other user.",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"newMessage": "New message"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"somethingHappened": "Si è verificato un problema",
	"youAreNotAMemberOfThisRoomButInvited": "Non partecipi a questa stanza di chat, ma hai ricevuto un invito. Per partecipare, accetta l'invito.",
	"doYouAcceptInvitation": "Intendi accettare l'invito?",
	"areYouSure": "Confermi?",
	"inviteUser": "Invita persona",
	"leave": "Esci",
	"messages": "Messaggi",
	"members": "Membri",
	"search": "Cerca",
	"info": "Informazioni",
	"directMessage": "Chattare insieme",
	"noMessagesYet": "Ancora nessun messaggio",
	"thisUserAllowsChatOnlyFromFollowers": "Questa persona permette di chattare soltanto i propri Follower.",
	"thisUserAllowsChatOnlyFromFollowing": "Questa persona permette di chattare soltanto ai suoi Follow.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "Questa persona permette di chattare solo a relazioni reciproche.",
	"thisUserNotAllowedChatAnyone": "Questa persona non permette di chattare a nessuno.",
	"inviteUserToChat": "Invita a chattare altre persone",
	"loadMore": "Mostra di più",
	"chatNotAvailableInOtherAccount": "La chat non è disponibile nel profilo dell'altra persona.",
	"chatIsReadOnlyForThisAccountOrServer": "Le chat, su questo server o su questo profilo, sono di sola lettura. Impossibile scrivere in chat o creare e partecipare a stanze.",
	"chatNotAvailableForThisAccountOrServer": "Questo server, o questo profilo ha disabilitato la chat.",
	"newMessage": "Nuovo messaggio"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"somethingHappened": "問題が発生しました",
	"youAreNotAMemberOfThisRoomButInvited": "あなたはこのグループの参加者ではありませんが、招待が届いています。参加するには、招待を承認してください。",
	"doYouAcceptInvitation": "招待を承認しますか？",
	"areYouSure": "よろしいですか？",
	"inviteUser": "ユーザーを招待",
	"leave": "グループから退出",
	"messages": "メッセージ",
	"members": "メンバー",
	"search": "検索",
	"info": "情報",
	"directMessage": "ダイレクトメッセージ",
	"noMessagesYet": "まだメッセージはありません",
	"thisUserAllowsChatOnlyFromFollowers": "このユーザーはフォロワーからのみメッセージを受け付けています。",
	"thisUserAllowsChatOnlyFromFollowing": "このユーザーは、このユーザーがフォローしているユーザーからのみメッセージを受け付けています。",
	"thisUserAllowsChatOnlyFromMutualFollowing": "このユーザーは相互フォローのユーザーからのみメッセージを受け付けています。",
	"thisUserNotAllowedChatAnyone": "このユーザーは誰からもメッセージを受け付けていません。",
	"inviteUserToChat": "ユーザーを招待してメッセージを送信しましょう",
	"loadMore": "もっと見る",
	"chatNotAvailableInOtherAccount": "相手のアカウントでダイレクトメッセージが使えない状態になっています。",
	"chatIsReadOnlyForThisAccountOrServer": "このサーバー、またはこのアカウントでダイレクトメッセージは読み取り専用となっています。新たに書き込んだり、グループを作成・参加したりすることはできません。",
	"chatNotAvailableForThisAccountOrServer": "このサーバー、またはこのアカウントでダイレクトメッセージは有効化されていません。",
	"newMessage": "新しいメッセージ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"somethingHappened": "なんかあかんわ",
	"youAreNotAMemberOfThisRoomButInvited": "あんたはこのルームの参加者ちゃうけど、招待が届いとるで。参加するんやったら、招待を承認してな。",
	"doYouAcceptInvitation": "招待を承認してもええんか？",
	"areYouSure": "いいん？",
	"inviteUser": "ユーザーを招待",
	"leave": "グループから抜ける",
	"messages": "メッセージ",
	"members": "メンバーはん",
	"search": "探す",
	"info": "情報",
	"directMessage": "チャットしよか",
	"noMessagesYet": "まだメッセージはあらへんで",
	"thisUserAllowsChatOnlyFromFollowers": "このユーザーはフォロワーからのチャットしか受け付けとらんみたいやわ。",
	"thisUserAllowsChatOnlyFromFollowing": "このユーザーは、このユーザーがフォローしとるユーザーからのチャットしか受け付けとらんみたいやわ。",
	"thisUserAllowsChatOnlyFromMutualFollowing": "このユーザーは相互フォローのユーザーからのチャットしか受け付けとらんみたいやわ。",
	"thisUserNotAllowedChatAnyone": "このユーザーは誰からのチャットも受け付けとらんみたいやわ。",
	"inviteUserToChat": "ユーザーを招待してチャットを始めてみ",
	"loadMore": "まだまだあるで！",
	"chatNotAvailableInOtherAccount": "相手のアカウントでチャット機能が使えんくなっとるみたいやわ。",
	"chatIsReadOnlyForThisAccountOrServer": "このサーバー、もしくはこのアカウントでチャットが読み取り専用になっとるわ。新しく書き込んだり、チャットルームを作ったり参加したりはできへんで。",
	"chatNotAvailableForThisAccountOrServer": "このサーバー、もしくはこのアカウントでチャットが有効にされてへんで。",
	"newMessage": "新しいメッセージ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"somethingHappened": "An error has occurred",
	"youAreNotAMemberOfThisRoomButInvited": "You are not a participant in this room, but you have received an invitation. Please accept the invitation to join.",
	"doYouAcceptInvitation": "Do you accept the invitation?",
	"areYouSure": "Are you sure?",
	"inviteUser": "Invite Users",
	"leave": "Leave room",
	"messages": "Messages",
	"members": "Members",
	"search": "Nadi",
	"info": "About",
	"directMessage": "Chat with user",
	"noMessagesYet": "No messages yet",
	"thisUserAllowsChatOnlyFromFollowers": "This user accepts chats from followers only.",
	"thisUserAllowsChatOnlyFromFollowing": "This user accepts chats only from users they follow.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "This user only accepts chats from users who are mutual followers.",
	"thisUserNotAllowedChatAnyone": "This user is not accepting chats from anyone.",
	"inviteUserToChat": "Invite users to start chatting",
	"loadMore": "Wali ugar",
	"chatNotAvailableInOtherAccount": "The chat function is disabled for the other user.",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"newMessage": "New message"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"somethingHappened": "An error has occurred",
	"youAreNotAMemberOfThisRoomButInvited": "You are not a participant in this room, but you have received an invitation. Please accept the invitation to join.",
	"doYouAcceptInvitation": "Do you accept the invitation?",
	"areYouSure": "Are you sure?",
	"inviteUser": "Invite Users",
	"leave": "Leave room",
	"messages": "Messages",
	"members": "Members",
	"search": "ಹುಡುಕು",
	"info": "About",
	"directMessage": "Chat with user",
	"noMessagesYet": "No messages yet",
	"thisUserAllowsChatOnlyFromFollowers": "This user accepts chats from followers only.",
	"thisUserAllowsChatOnlyFromFollowing": "This user accepts chats only from users they follow.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "This user only accepts chats from users who are mutual followers.",
	"thisUserNotAllowedChatAnyone": "This user is not accepting chats from anyone.",
	"inviteUserToChat": "Invite users to start chatting",
	"loadMore": "ಇನ್ನಷ್ಟು ನೋಡು",
	"chatNotAvailableInOtherAccount": "The chat function is disabled for the other user.",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"newMessage": "New message"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"somethingHappened": "오류가 발생했습니다",
	"youAreNotAMemberOfThisRoomButInvited": "이 방의 참가자가 아니지만 초대를 받았습니다. 참가하려면 초대를 수락하세요.",
	"doYouAcceptInvitation": "초대를 수락하시겠습니까?",
	"areYouSure": "계속 진행하시겠습니까?",
	"inviteUser": "유저를 초대",
	"leave": "룸을 떠나기",
	"messages": "메시지",
	"members": "멤버",
	"search": "검색",
	"info": "정보",
	"directMessage": "채팅하기",
	"noMessagesYet": "아직 메시지가 없습니다",
	"thisUserAllowsChatOnlyFromFollowers": "이 유저는 팔로워만 채팅을 할 수 있습니다.",
	"thisUserAllowsChatOnlyFromFollowing": "이 유저는 이 유저가 팔로우하는 유저만 채팅을 허용합니다.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "이 유저는 상호 팔로우하는 유저만 채팅을 허용합니다.",
	"thisUserNotAllowedChatAnyone": "이 유저는 다른 사람의 채팅을 받지 않습니다.",
	"inviteUserToChat": "유저를 초대하여 채팅을 시작하세요",
	"loadMore": "더 보기",
	"chatNotAvailableInOtherAccount": "상대방 계정에서 채팅 기능을 사용할 수 없는 상태입니다.",
	"chatIsReadOnlyForThisAccountOrServer": "이 서버 또는 이 계정에서 채팅은 읽기 전용입니다. 새로 쓰거나 채팅 룸을 만들거나 참가할 수 없습니다.",
	"chatNotAvailableForThisAccountOrServer": "이 서버 또는 이 계정에서 채팅이 활성화되어 있지 않습니다.",
	"newMessage": "새로운 메시지"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"somethingHappened": "Er is iets misgegaan.",
	"youAreNotAMemberOfThisRoomButInvited": "You are not a participant in this room, but you have received an invitation. Please accept the invitation to join.",
	"doYouAcceptInvitation": "Do you accept the invitation?",
	"areYouSure": "Weet je het zeker?",
	"inviteUser": "Invite Users",
	"leave": "Leave room",
	"messages": "Messages",
	"members": "Leden",
	"search": "Zoeken",
	"info": "Over",
	"directMessage": "Chat with user",
	"noMessagesYet": "No messages yet",
	"thisUserAllowsChatOnlyFromFollowers": "This user accepts chats from followers only.",
	"thisUserAllowsChatOnlyFromFollowing": "This user accepts chats only from users they follow.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "This user only accepts chats from users who are mutual followers.",
	"thisUserNotAllowedChatAnyone": "This user is not accepting chats from anyone.",
	"inviteUserToChat": "Invite users to start chatting",
	"loadMore": "Laad meer",
	"chatNotAvailableInOtherAccount": "The chat function is disabled for the other user.",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"newMessage": "New message"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"somethingHappened": "En feil har oppstått",
	"youAreNotAMemberOfThisRoomButInvited": "You are not a participant in this room, but you have received an invitation. Please accept the invitation to join.",
	"doYouAcceptInvitation": "Do you accept the invitation?",
	"areYouSure": "Are you sure?",
	"inviteUser": "Invite Users",
	"leave": "Leave room",
	"messages": "Messages",
	"members": "Medlemmer",
	"search": "Søk",
	"info": "Infomasjon",
	"directMessage": "Chat with user",
	"noMessagesYet": "No messages yet",
	"thisUserAllowsChatOnlyFromFollowers": "This user accepts chats from followers only.",
	"thisUserAllowsChatOnlyFromFollowing": "This user accepts chats only from users they follow.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "This user only accepts chats from users who are mutual followers.",
	"thisUserNotAllowedChatAnyone": "This user is not accepting chats from anyone.",
	"inviteUserToChat": "Invite users to start chatting",
	"loadMore": "Vis mer",
	"chatNotAvailableInOtherAccount": "The chat function is disabled for the other user.",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"newMessage": "New message"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"somethingHappened": "Coś poszło nie tak",
	"youAreNotAMemberOfThisRoomButInvited": "You are not a participant in this room, but you have received an invitation. Please accept the invitation to join.",
	"doYouAcceptInvitation": "Do you accept the invitation?",
	"areYouSure": "Na pewno?",
	"inviteUser": "Invite Users",
	"leave": "Leave room",
	"messages": "Messages",
	"members": "Członkowie",
	"search": "Szukaj",
	"info": "Informacje",
	"directMessage": "Chat with user",
	"noMessagesYet": "No messages yet",
	"thisUserAllowsChatOnlyFromFollowers": "This user accepts chats from followers only.",
	"thisUserAllowsChatOnlyFromFollowing": "This user accepts chats only from users they follow.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "This user only accepts chats from users who are mutual followers.",
	"thisUserNotAllowedChatAnyone": "This user is not accepting chats from anyone.",
	"inviteUserToChat": "Invite users to start chatting",
	"loadMore": "Załaduj więcej",
	"chatNotAvailableInOtherAccount": "The chat function is disabled for the other user.",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"newMessage": "New message"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"somethingHappened": "Ocorreu um erro",
	"youAreNotAMemberOfThisRoomButInvited": "Você não é um participante da sala, mas recebeu um convite. Por favor, aceite o convite para entrar.",
	"doYouAcceptInvitation": "Aceita o convite?",
	"areYouSure": "Tem certeza?",
	"inviteUser": "Convidar Usuários",
	"leave": "Deixar sala",
	"messages": "Mensagem",
	"members": "Membros",
	"search": "Pesquisar",
	"info": "Informações",
	"directMessage": "Conversar com usuário",
	"noMessagesYet": "Ainda não há mensagens",
	"thisUserAllowsChatOnlyFromFollowers": "Esse usuário aceita conversar apenas com seguidores.",
	"thisUserAllowsChatOnlyFromFollowing": "Esse usuário aceita conversar apenas com quem segue.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "Esse usuário aceita conversar apenas com seguidores mútuos.",
	"thisUserNotAllowedChatAnyone": "Esse usuário não aceita conversar com ninguém.",
	"inviteUserToChat": "Convide usuários para começar a conversar",
	"loadMore": "Carregar mais",
	"chatNotAvailableInOtherAccount": "A função de conversas está desabilitadas para o outro usuário.",
	"chatIsReadOnlyForThisAccountOrServer": "Conversas são apenas para leitura nesse servidor ou para essa conta. Não é possível escrever novas mensagens ou criar/ingressar novas conversas.",
	"chatNotAvailableForThisAccountOrServer": "Conversas não estão habilitadas nesse servidor ou para essa conta.",
	"newMessage": "Nova mensagem"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"somethingHappened": "Что-то пошло не так",
	"youAreNotAMemberOfThisRoomButInvited": "Вы не являетесь участником этого чата, но вас в него пригласили. Пожалуйста, примите приглашение.",
	"doYouAcceptInvitation": "Принять приглашение?",
	"areYouSure": "Вы уверены?",
	"inviteUser": "Пригласить пользователей",
	"leave": "Выйти из комнаты",
	"messages": "Сообщения",
	"members": "Участники",
	"search": "Поиск",
	"info": "Описание",
	"directMessage": "Личные сообщения",
	"noMessagesYet": "Сообщений пока нет",
	"thisUserAllowsChatOnlyFromFollowers": "Пользователь принимает сообщения только от подписчиков.",
	"thisUserAllowsChatOnlyFromFollowing": "Пользователь принимает сообщения только от людей на которых они подписаны.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "Пользователь принимает сообщения только от взаимных подписчиков.",
	"thisUserNotAllowedChatAnyone": "Пользователь не принимает личные сообщения.",
	"inviteUserToChat": "Пригласите пользователей для того что бы начать беседу",
	"loadMore": "Загрузить ещё",
	"chatNotAvailableInOtherAccount": "Функция чата выключена для другого пользователя.",
	"chatIsReadOnlyForThisAccountOrServer": "На этом сервере или для этого пользователя личные сообщения доступны только в режиме чтения. Вы не можете отправлять новые сообщения, создавать группы или присоединяться к ним.",
	"chatNotAvailableForThisAccountOrServer": "Личные сообщения выключены для этого аккаунта или на этом сервере.",
	"newMessage": "Новое сообщение"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"somethingHappened": "Ups. Niečo sa nepodarilo.",
	"youAreNotAMemberOfThisRoomButInvited": "You are not a participant in this room, but you have received an invitation. Please accept the invitation to join.",
	"doYouAcceptInvitation": "Do you accept the invitation?",
	"areYouSure": "Are you sure?",
	"inviteUser": "Invite Users",
	"leave": "Leave room",
	"messages": "Messages",
	"members": "Členovia",
	"search": "Hľadať",
	"info": "Informácie",
	"directMessage": "Chat with user",
	"noMessagesYet": "No messages yet",
	"thisUserAllowsChatOnlyFromFollowers": "This user accepts chats from followers only.",
	"thisUserAllowsChatOnlyFromFollowing": "This user accepts chats only from users they follow.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "This user only accepts chats from users who are mutual followers.",
	"thisUserNotAllowedChatAnyone": "This user is not accepting chats from anyone.",
	"inviteUserToChat": "Invite users to start chatting",
	"loadMore": "Zobraziť viac",
	"chatNotAvailableInOtherAccount": "The chat function is disabled for the other user.",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"newMessage": "New message"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"somethingHappened": "อุ๊ย ! มีอะไรบางอย่างผิดพลาด",
	"youAreNotAMemberOfThisRoomButInvited": "คุณไม่ได้เป็นผู้เข้าร่วมห้องนี้ แต่มีคำเชิญส่งมา หากต้องการเข้าร่วม กรุณายืนยันคำเชิญ",
	"doYouAcceptInvitation": "ต้องการยอมรับคำเชิญหรือไม่?",
	"areYouSure": "แน่ใจแล้วใช่ไหมคะ?",
	"inviteUser": "เชิญผู้ใช้",
	"leave": "ออกจากห้อง",
	"messages": "ข้อความ",
	"members": "สมาชิก",
	"search": "ค้นหา",
	"info": "เกี่ยวกับ",
	"directMessage": "แชตเลย",
	"noMessagesYet": "ยังไม่มีข้อความ",
	"thisUserAllowsChatOnlyFromFollowers": "ผู้ใช้นี้รับแชตเฉพาะจากผู้ติดตามเท่านั้น",
	"thisUserAllowsChatOnlyFromFollowing": "ผู้ใช้นี้รับแชตเฉพาะจากผู้ที่เขาติดตามเท่านั้น",
	"thisUserAllowsChatOnlyFromMutualFollowing": "ผู้ใช้นี้รับแชตเฉพาะจากผู้ที่ติดตามซึ่งกันและกันทั้งสองฝ่ายเท่านั้น",
	"thisUserNotAllowedChatAnyone": "ผู้ใช้นี้ไม่รับแชตจากใครเลย",
	"inviteUserToChat": "เชิญผู้ใช้และเริ่มแชตได้เลย",
	"loadMore": "แสดงเพิ่มเติม",
	"chatNotAvailableInOtherAccount": "บัญชีคู่สนทนาไม่สามารถใช้ฟังก์ชันแชตได้",
	"chatIsReadOnlyForThisAccountOrServer": "แชตบนเซิร์ฟเวอร์นี้ หรือบัญชีนี้ เป็นแบบอ่านอย่างเดียว ไม่สามารถส่งข้อความใหม่ สร้างหรือเข้าร่วมห้องแชตได้",
	"chatNotAvailableForThisAccountOrServer": "แชตไม่ได้เปิดใช้งานบนเซิร์ฟเวอร์นี้ หรือบัญชีนี้",
	"newMessage": "ข้อความใหม่"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"somethingHappened": "Bir hata oluştu",
	"youAreNotAMemberOfThisRoomButInvited": "Bu odanın katılımcısı değilsin, ancak bir davet aldın. Lütfen daveti kabul ederek katıl.",
	"doYouAcceptInvitation": "Daveti kabul ediyor musunuz?",
	"areYouSure": "Emin misin?",
	"inviteUser": "Kullanıcıları Davet Et",
	"leave": "Odadan çık",
	"messages": "Mesaj",
	"members": "Üyeler",
	"search": "Ara",
	"info": "Hakkında",
	"directMessage": "Kullanıcıyla sohbet et",
	"noMessagesYet": "Henüz mesaj yok",
	"thisUserAllowsChatOnlyFromFollowers": "Bu kullanıcı yalnızca takipçilerinden gelen sohbetleri kabul eder.",
	"thisUserAllowsChatOnlyFromFollowing": "Bu kullanıcı, yalnızca takip ettiği kullanıcılardan gelen sohbetleri kabul eder.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "Bu kullanıcı, yalnızca karşılıklı takip eden kullanıcıların sohbetlerini kabul eder.",
	"thisUserNotAllowedChatAnyone": "Bu kullanıcı kimseyle sohbet etmiyor.",
	"inviteUserToChat": "Kullanıcıları sohbete davet edin",
	"loadMore": "Daha fazla yükle",
	"chatNotAvailableInOtherAccount": "Sohbet işlevi diğer kullanıcı için devre dışı bırakılmıştır.",
	"chatIsReadOnlyForThisAccountOrServer": "Bu sunucuda veya bu hesapta sohbet okunur modundadır. Yeni mesaj yazamaz veya sohbet odası oluşturamaz/katılamazsınız.",
	"chatNotAvailableForThisAccountOrServer": "Bu sunucuda veya bu hesapta sohbet özelliği etkin değildir.",
	"newMessage": "Yeni mesaj"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"somethingHappened": "An error has occurred",
	"youAreNotAMemberOfThisRoomButInvited": "You are not a participant in this room, but you have received an invitation. Please accept the invitation to join.",
	"doYouAcceptInvitation": "Do you accept the invitation?",
	"areYouSure": "Are you sure?",
	"inviteUser": "Invite Users",
	"leave": "Leave room",
	"messages": "Messages",
	"members": "Members",
	"search": "ئىزدەش",
	"info": "About",
	"directMessage": "Chat with user",
	"noMessagesYet": "No messages yet",
	"thisUserAllowsChatOnlyFromFollowers": "This user accepts chats from followers only.",
	"thisUserAllowsChatOnlyFromFollowing": "This user accepts chats only from users they follow.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "This user only accepts chats from users who are mutual followers.",
	"thisUserNotAllowedChatAnyone": "This user is not accepting chats from anyone.",
	"inviteUserToChat": "Invite users to start chatting",
	"loadMore": "Load more",
	"chatNotAvailableInOtherAccount": "The chat function is disabled for the other user.",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"newMessage": "New message"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"somethingHappened": "Щось пішло не так",
	"youAreNotAMemberOfThisRoomButInvited": "Ви не учасник цієї групи, але ви маєте запрошення до неї. Будь ласка, прийміть запрошення, щоб доєднатися.",
	"doYouAcceptInvitation": "Чи приймаєте ви запрошення?",
	"areYouSure": "Ви впевнені?",
	"inviteUser": "Запросити користувачів",
	"leave": "Залишити групу",
	"messages": "Повідомлення",
	"members": "Учасники",
	"search": "Пошук",
	"info": "Інформація",
	"directMessage": "Чат із користувачем",
	"noMessagesYet": "Повідомлень поки немає",
	"thisUserAllowsChatOnlyFromFollowers": "Цей користувач приймає особисті повідомлення лише від підписників.",
	"thisUserAllowsChatOnlyFromFollowing": "Цей користувач приймає особисті повідомлення лише від тих користувачів, на яких має підписку.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "Цей користувач приймає особисті повідомлення лише від користувачів, з якими вони взаємні підписники.",
	"thisUserNotAllowedChatAnyone": "Цей користувач не приймає особисті повідомлення від усіх.",
	"inviteUserToChat": "Запросите людей щоб почати переписуватися",
	"loadMore": "Показати більше",
	"chatNotAvailableInOtherAccount": "Функція чату вимкнена для іншого користувача.",
	"chatIsReadOnlyForThisAccountOrServer": "Чат доступний лише для читання для цього сервера або облікового запису. Ви не можете друкувати нові повідомлення або створювати/доєлнуватися до груп.",
	"chatNotAvailableForThisAccountOrServer": "Чат не увімкнено на цьому сервері або для цього облікового запису.",
	"newMessage": "Нове повідомлення"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"somethingHappened": "Xảy ra lỗi",
	"youAreNotAMemberOfThisRoomButInvited": "You are not a participant in this room, but you have received an invitation. Please accept the invitation to join.",
	"doYouAcceptInvitation": "Do you accept the invitation?",
	"areYouSure": "Bạn chắc chứ?",
	"inviteUser": "Invite Users",
	"leave": "Leave room",
	"messages": "Messages",
	"members": "Thành viên",
	"search": "Tìm kiếm",
	"info": "Giới thiệu",
	"directMessage": "Chat with user",
	"noMessagesYet": "No messages yet",
	"thisUserAllowsChatOnlyFromFollowers": "This user accepts chats from followers only.",
	"thisUserAllowsChatOnlyFromFollowing": "This user accepts chats only from users they follow.",
	"thisUserAllowsChatOnlyFromMutualFollowing": "This user only accepts chats from users who are mutual followers.",
	"thisUserNotAllowedChatAnyone": "This user is not accepting chats from anyone.",
	"inviteUserToChat": "Invite users to start chatting",
	"loadMore": "Tải thêm",
	"chatNotAvailableInOtherAccount": "The chat function is disabled for the other user.",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"newMessage": "New message"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"somethingHappened": "出错了",
	"youAreNotAMemberOfThisRoomButInvited": "您尚未加入此群组，但已收到加入邀请。请接受邀请加入。",
	"doYouAcceptInvitation": "要接受邀请吗？",
	"areYouSure": "你确定吗？",
	"inviteUser": "邀请用户",
	"leave": "退出群聊",
	"messages": "消息",
	"members": "成员",
	"search": "搜索",
	"info": "关于",
	"directMessage": "私信",
	"noMessagesYet": "还没有消息",
	"thisUserAllowsChatOnlyFromFollowers": "此用户仅接受关注者发起的聊天。",
	"thisUserAllowsChatOnlyFromFollowing": "此用户仅接受关注的人发起的聊天。",
	"thisUserAllowsChatOnlyFromMutualFollowing": "此用户仅接受互相关注的人发起的聊天。",
	"thisUserNotAllowedChatAnyone": "此用户不接受任何人发起的聊天。",
	"inviteUserToChat": "邀请用户来聊天吧",
	"loadMore": "查看更多",
	"chatNotAvailableInOtherAccount": "对方的账户当前无法使用私信。",
	"chatIsReadOnlyForThisAccountOrServer": "此服务器或者账户内的聊天为只读。无法发布新信息或创建及加入群聊。",
	"chatNotAvailableForThisAccountOrServer": "此服务器或者账户还未开启聊天功能。",
	"newMessage": "新消息"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"somethingHappened": "發生錯誤",
	"youAreNotAMemberOfThisRoomButInvited": "您不是此聊天室的參與者，但已收到邀請。若要加入，請先接受邀請。\n",
	"doYouAcceptInvitation": "您要接受這個邀請嗎？\n",
	"areYouSure": "是否確定？",
	"inviteUser": "邀請使用者",
	"leave": "退出聊天室",
	"messages": "訊息",
	"members": "成員",
	"search": "搜尋",
	"info": "資訊",
	"directMessage": "直接訊息",
	"noMessagesYet": "尚無訊息",
	"thisUserAllowsChatOnlyFromFollowers": "此使用者僅接受來自追隨者的聊天訊息。",
	"thisUserAllowsChatOnlyFromFollowing": "此使用者僅接受自己追隨的使用者傳送聊天訊息。",
	"thisUserAllowsChatOnlyFromMutualFollowing": "此使用者只接受互相追隨的使用者傳送聊天訊息。",
	"thisUserNotAllowedChatAnyone": "此使用者不接受來自任何人的聊天訊息。",
	"inviteUserToChat": "邀請使用者開始聊天",
	"loadMore": "載入更多",
	"chatNotAvailableInOtherAccount": "對方的帳號無法使用聊天功能。",
	"chatIsReadOnlyForThisAccountOrServer": "在此伺服器或此帳戶上的聊天是唯讀的。您無法發布新訊息、建立或加入聊天室。",
	"chatNotAvailableForThisAccountOrServer": "這個伺服器或這個帳號的聊天功能尚未啟用。",
	"newMessage": "新訊息"
}
</locale>
