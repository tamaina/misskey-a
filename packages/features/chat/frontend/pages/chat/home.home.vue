<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkButton v-if="$i.policies.chatAvailability === 'available'" primary gradate rounded :class="$style.start" @click="start"><i class="ti ti-plus"></i> {{ $locale.sfc.startChat }}</MkButton>

	<MkInfo v-else>{{ $i.policies.chatAvailability === 'readonly' ? $locale.sfc.chatIsReadOnlyForThisAccountOrServer : $locale.sfc.chatNotAvailableForThisAccountOrServer }}</MkInfo>

	<MkAd :preferForms="['horizontal', 'horizontal-big']"/>

	<MkInput
		v-model="searchQuery"
		:placeholder="$locale.sfc.searchMessages"
		type="search"
	>
		<template #prefix><i class="ti ti-search"></i></template>
	</MkInput>

	<MkButton v-if="searchQuery.length > 0" primary rounded @click="search">{{ $locale.sfc.search }}</MkButton>

	<MkFoldableSection v-if="searched">
		<template #header>{{ $locale.sfc.searchResult }}</template>

		<div class="_gaps_s">
			<div v-for="message in searchResults" :key="message.id" :class="$style.searchResultItem">
				<XMessage :message="message" :isSearchResult="true"/>
			</div>
		</div>
	</MkFoldableSection>

	<MkFoldableSection>
		<template #header>{{ $locale.sfc.history }}</template>

		<MkChatHistories/>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
import { onActivated, onDeactivated, onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useInterval } from '@features/ui/frontend/shared/use-interval.js';
import XMessage from '@features/chat/frontend/pages/chat/XMessage.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import * as os from '@features/ui/frontend/os.js';
import { updateCurrentAccountPartial } from '@features/auth/frontend/accounts.js';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkFoldableSection from '@features/ui/frontend/components/MkFoldableSection.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkChatHistories from '@features/chat/frontend/components/MkChatHistories.vue';

const $i = ensureSignin();

const router = useRouter();

const searchQuery = ref('');
const searched = ref(false);
const searchResults = ref<Misskey.entities.ChatMessage[]>([]);

function start(ev: PointerEvent) {
	os.popupMenu([{
		text: $locale.value.sfc.individualChat,
		caption: $locale.value.sfc.individualChat_description,
		icon: 'ti ti-user',
		action: () => { startUser(); },
	}, { type: 'divider' }, {
		type: 'parent',
		text: $locale.value.sfc.roomChat,
		caption: $locale.value.sfc.roomChat_description,
		icon: 'ti ti-users-group',
		children: [{
			text: $locale.value.sfc.createRoom,
			icon: 'ti ti-plus',
			action: () => { createRoom(); },
		}],
	}], ev.currentTarget ?? ev.target);
}

async function startUser() {
	// TODO: localOnly は連合に対応したら消す
	os.selectUser({ localOnly: true }).then(user => {
		router.push('/chat/user/:userId', {
			params: {
				userId: user.id,
			},
		});
	});
}

async function createRoom() {
	const { canceled, result } = await os.inputText({
		title: $locale.value.sfc.name,
		minLength: 1,
	});
	if (canceled) return;

	const room = await misskeyApi('chat/rooms/create', {
		name: result,
	});

	router.push('/chat/room/:roomId', {
		params: {
			roomId: room.id,
		},
	});
}

async function search() {
	const res = await misskeyApi('chat/messages/search', {
		query: searchQuery.value,
	});

	searchResults.value = res;
	searched.value = true;
}

onMounted(() => {
	updateCurrentAccountPartial({ hasUnreadChatMessages: false });
});
</script>

<style lang="scss" module>
.start {
	margin: 0 auto;
}

.searchResultItem {
	padding: 12px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 12px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"individualChat": "Private Chat",
	"individualChat_description": "Have a private chat with another person.",
	"roomChat": "Room Chat",
	"roomChat_description": "A chat room which can have multiple people.\nYou can also invite people who don't allow private chats if they accept the invite.",
	"createRoom": "Create Room",
	"name": "الإسم",
	"startChat": "Start chat",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"searchMessages": "Search messages",
	"search": "البحث",
	"searchResult": "نتائج البحث",
	"history": "History"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"individualChat": "Xat individual ",
	"individualChat_description": "Pots mantenir converses individuals amb usuaris concrets.",
	"roomChat": "Sala de xat",
	"roomChat_description": "Pots xatejar amb diverses persones.\nTambé pots xatejar amb usuaris que no poden fer xats privats, si ells accepten.",
	"createRoom": "Crear una sala",
	"name": "Nom",
	"startChat": "Comença a xatejar ",
	"chatIsReadOnlyForThisAccountOrServer": "El xat és només de lectura en aquest servidor o compte. No es poden escriure nous missatges ni crear o unir-se a sales de xat.",
	"chatNotAvailableForThisAccountOrServer": "El xat no està disponible per aquest servidor o aquest compte.",
	"searchMessages": "Buscar missatges ",
	"search": "Cercar",
	"searchResult": "Resultats de la cerca",
	"history": "Historial de converses "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"individualChat": "Private Chat",
	"individualChat_description": "Have a private chat with another person.",
	"roomChat": "Room Chat",
	"roomChat_description": "A chat room which can have multiple people.\nYou can also invite people who don't allow private chats if they accept the invite.",
	"createRoom": "Create Room",
	"name": "Jméno",
	"startChat": "Začít chat",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"searchMessages": "Search messages",
	"search": "Vyhledávání",
	"searchResult": "Výsledky hledání",
	"history": "History"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"individualChat": "Private Chat",
	"individualChat_description": "Have a private chat with another person.",
	"roomChat": "Room Chat",
	"roomChat_description": "A chat room which can have multiple people.\nYou can also invite people who don't allow private chats if they accept the invite.",
	"createRoom": "Create Room",
	"name": "Name",
	"startChat": "Start chat",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"searchMessages": "Search messages",
	"search": "Search",
	"searchResult": "Search results",
	"history": "History"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"individualChat": "Privater Chat",
	"individualChat_description": "Führe einen privaten Chat mit einer anderen Person.",
	"roomChat": "Chatraum",
	"roomChat_description": "Ein Chat-Raum, an dem mehrere Personen teilnehmen können.\nDu kannst auch Personen einladen, die keine privaten Chats zulassen, wenn sie die Einladung annehmen.",
	"createRoom": "Raum erstellen",
	"name": "Name",
	"startChat": "Chat starten",
	"chatIsReadOnlyForThisAccountOrServer": "Der Chat ist auf dieser Instanz oder diesem Konto nur zum Lesen freigegeben. Es ist nicht möglich, neue Nachrichten zu schreiben oder Chaträume zu erstellen oder zu betreten.",
	"chatNotAvailableForThisAccountOrServer": "Der Chat ist auf diesem Server oder für dieses Konto nicht aktiviert.",
	"searchMessages": "Nachrichten suchen",
	"search": "Suchen",
	"searchResult": "Suchergebnisse",
	"history": "Verlauf"
}
</locale>

<locale locale="en-US" lang="json">
{
	"individualChat": "Private Chat",
	"individualChat_description": "Have a private chat with another person.",
	"roomChat": "Room Chat",
	"roomChat_description": "A chat room which can have multiple people.\nYou can also invite people who don't allow private chats if they accept the invite.",
	"createRoom": "Create Room",
	"name": "Name",
	"startChat": "Start chat",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"searchMessages": "Search messages",
	"search": "Search",
	"searchResult": "Search results",
	"history": "History"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"individualChat": "Chat individual",
	"individualChat_description": "Mantén una conversación privada con otra persona.",
	"roomChat": "Sala de Chat",
	"roomChat_description": "Una sala de chat que puede tener varias personas.\nTambién puedes invitar a personas que no permiten chats privados si aceptan la invitación.",
	"createRoom": "Crear sala",
	"name": "Nombre",
	"startChat": "Nuevo Chat",
	"chatIsReadOnlyForThisAccountOrServer": "El chat es de sólo lectura en esta instancia o esta cuenta. No puedes escribir nuevos mensajes ni crear/unirte a salas de chat.",
	"chatNotAvailableForThisAccountOrServer": "El chat no está habilitado en este servidor ni para esta cuenta.",
	"searchMessages": "Buscar mensajes",
	"search": "Buscar",
	"searchResult": "Resultados de búsqueda",
	"history": "Historial"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"individualChat": "Private Chat",
	"individualChat_description": "Have a private chat with another person.",
	"roomChat": "Room Chat",
	"roomChat_description": "A chat room which can have multiple people.\nYou can also invite people who don't allow private chats if they accept the invite.",
	"createRoom": "Create Room",
	"name": "Nom",
	"startChat": "Start chat",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"searchMessages": "Search messages",
	"search": "Rechercher",
	"searchResult": "Résultats de la recherche",
	"history": "History"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"individualChat": "Private Chat",
	"individualChat_description": "Have a private chat with another person.",
	"roomChat": "Room Chat",
	"roomChat_description": "A chat room which can have multiple people.\nYou can also invite people who don't allow private chats if they accept the invite.",
	"createRoom": "Create Room",
	"name": "Nama",
	"startChat": "Kirim pesan",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"searchMessages": "Search messages",
	"search": "Cari",
	"searchResult": "Hasil Penelusuran",
	"history": "Riwayat obrolan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"individualChat": "Chat individuale",
	"individualChat_description": "Puoi chattare con una persona specifica.",
	"roomChat": "Stanza di chat",
	"roomChat_description": "Puoi chattare con più persone.\nInoltre, anche le persone che non consentono chat personalizzate possono chattare se gli altri accettano.",
	"createRoom": "Crea stanza",
	"name": "Nome",
	"startChat": "Inizia a chattare",
	"chatIsReadOnlyForThisAccountOrServer": "Le chat, su questo server o su questo profilo, sono di sola lettura. Impossibile scrivere in chat o creare e partecipare a stanze.",
	"chatNotAvailableForThisAccountOrServer": "Questo server, o questo profilo ha disabilitato la chat.",
	"searchMessages": "Cerca messaggi",
	"search": "Cerca",
	"searchResult": "Risultati della Ricerca",
	"history": "Cronologia"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"individualChat": "個別",
	"individualChat_description": "特定ユーザーと個別にメッセージのやりとりができます。",
	"roomChat": "グループ",
	"roomChat_description": "複数人でメッセージのやりとりができます。\nまた、個別のメッセージを許可していないユーザーとでも、相手が受け入れればやりとりできます。",
	"createRoom": "グループを作成",
	"name": "名前",
	"startChat": "メッセージを送る",
	"chatIsReadOnlyForThisAccountOrServer": "このサーバー、またはこのアカウントでダイレクトメッセージは読み取り専用となっています。新たに書き込んだり、グループを作成・参加したりすることはできません。",
	"chatNotAvailableForThisAccountOrServer": "このサーバー、またはこのアカウントでダイレクトメッセージは有効化されていません。",
	"searchMessages": "メッセージを検索",
	"search": "検索",
	"searchResult": "検索結果",
	"history": "履歴"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"individualChat": "個別",
	"individualChat_description": "特定のユーザーとサシでチャットできるで。",
	"roomChat": "グループ",
	"roomChat_description": "複数人でチャットできるで。\nあと、個人チャットを許可してへんユーザーとでも、相手がええって言うならチャットできるで。",
	"createRoom": "グループを作成",
	"name": "名前",
	"startChat": "チャットを始めよか",
	"chatIsReadOnlyForThisAccountOrServer": "このサーバー、もしくはこのアカウントでチャットが読み取り専用になっとるわ。新しく書き込んだり、チャットルームを作ったり参加したりはできへんで。",
	"chatNotAvailableForThisAccountOrServer": "このサーバー、もしくはこのアカウントでチャットが有効にされてへんで。",
	"searchMessages": "メッセージを検索",
	"search": "探す",
	"searchResult": "検索結果やで",
	"history": "履歴"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"individualChat": "Private Chat",
	"individualChat_description": "Have a private chat with another person.",
	"roomChat": "Room Chat",
	"roomChat_description": "A chat room which can have multiple people.\nYou can also invite people who don't allow private chats if they accept the invite.",
	"createRoom": "Create Room",
	"name": "Name",
	"startChat": "Start chat",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"searchMessages": "Search messages",
	"search": "Nadi",
	"searchResult": "Search results",
	"history": "History"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"individualChat": "Private Chat",
	"individualChat_description": "Have a private chat with another person.",
	"roomChat": "Room Chat",
	"roomChat_description": "A chat room which can have multiple people.\nYou can also invite people who don't allow private chats if they accept the invite.",
	"createRoom": "Create Room",
	"name": "Name",
	"startChat": "Start chat",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"searchMessages": "Search messages",
	"search": "ಹುಡುಕು",
	"searchResult": "Search results",
	"history": "History"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"individualChat": "개인 대화",
	"individualChat_description": "특정 유저와 일대일 채팅을 할 수 있습니다.",
	"roomChat": "그룹 채팅",
	"roomChat_description": "여러 명이 함께 채팅할 수 있습니다.\n또한, 개인 채팅을 허용하지 않은 유저와도 상대방이 수락하면 채팅을 할 수 있습니다.",
	"createRoom": "방 만들기",
	"name": "이름",
	"startChat": "채팅을 시작하기",
	"chatIsReadOnlyForThisAccountOrServer": "이 서버 또는 이 계정에서 채팅은 읽기 전용입니다. 새로 쓰거나 채팅 룸을 만들거나 참가할 수 없습니다.",
	"chatNotAvailableForThisAccountOrServer": "이 서버 또는 이 계정에서 채팅이 활성화되어 있지 않습니다.",
	"searchMessages": "메시지 검색",
	"search": "검색",
	"searchResult": "검색 결과",
	"history": "이력"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"individualChat": "Private Chat",
	"individualChat_description": "Have a private chat with another person.",
	"roomChat": "Room Chat",
	"roomChat_description": "A chat room which can have multiple people.\nYou can also invite people who don't allow private chats if they accept the invite.",
	"createRoom": "Create Room",
	"name": "Naam",
	"startChat": "Chat starten",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"searchMessages": "Search messages",
	"search": "Zoeken",
	"searchResult": "Zoekresultaten",
	"history": "History"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"individualChat": "Private Chat",
	"individualChat_description": "Have a private chat with another person.",
	"roomChat": "Room Chat",
	"roomChat_description": "A chat room which can have multiple people.\nYou can also invite people who don't allow private chats if they accept the invite.",
	"createRoom": "Create Room",
	"name": "Navn",
	"startChat": "Start chat",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"searchMessages": "Search messages",
	"search": "Søk",
	"searchResult": "Search results",
	"history": "History"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"individualChat": "Private Chat",
	"individualChat_description": "Have a private chat with another person.",
	"roomChat": "Room Chat",
	"roomChat_description": "A chat room which can have multiple people.\nYou can also invite people who don't allow private chats if they accept the invite.",
	"createRoom": "Create Room",
	"name": "Nazwa",
	"startChat": "Start chat",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"searchMessages": "Search messages",
	"search": "Szukaj",
	"searchResult": "Wyniki wyszukiwania",
	"history": "History"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"individualChat": "Conversa Particular",
	"individualChat_description": "Ter uma conversa particular com outra pessoa.",
	"roomChat": "Conversa de Grupo",
	"roomChat_description": "Uma sala de conversas com várias pessoas. Você pode adicionar pessoas que não permitem conversas privadas se elas aceitarem o convite.",
	"createRoom": "Criar Sala",
	"name": "Nome",
	"startChat": "Iniciar conversa",
	"chatIsReadOnlyForThisAccountOrServer": "Conversas são apenas para leitura nesse servidor ou para essa conta. Não é possível escrever novas mensagens ou criar/ingressar novas conversas.",
	"chatNotAvailableForThisAccountOrServer": "Conversas não estão habilitadas nesse servidor ou para essa conta.",
	"searchMessages": "Pesquisar mensagens",
	"search": "Pesquisar",
	"searchResult": "Pesquisar",
	"history": "Histórico"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"individualChat": "Приватный чат",
	"individualChat_description": "Начать приватный чат с пользователем",
	"roomChat": "Комната",
	"roomChat_description": "Чат, в котором может быть несколько человек. Вы так же можете пригласить пользователей, которые выключили приватные чаты.",
	"createRoom": "Создать комнату",
	"name": "Название",
	"startChat": "Начать чат",
	"chatIsReadOnlyForThisAccountOrServer": "На этом сервере или для этого пользователя личные сообщения доступны только в режиме чтения. Вы не можете отправлять новые сообщения, создавать группы или присоединяться к ним.",
	"chatNotAvailableForThisAccountOrServer": "Личные сообщения выключены для этого аккаунта или на этом сервере.",
	"searchMessages": "Поиск сообщений",
	"search": "Поиск",
	"searchResult": "Результаты поиска",
	"history": "История"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"individualChat": "Private Chat",
	"individualChat_description": "Have a private chat with another person.",
	"roomChat": "Room Chat",
	"roomChat_description": "A chat room which can have multiple people.\nYou can also invite people who don't allow private chats if they accept the invite.",
	"createRoom": "Create Room",
	"name": "Názov",
	"startChat": "Start chat",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"searchMessages": "Search messages",
	"search": "Hľadať",
	"searchResult": "Výsledky hľadania",
	"history": "History"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"individualChat": "แชตส่วนตัว",
	"individualChat_description": "สามารถแชตแบบตัวต่อตัวกับผู้ใช้ที่ระบุไว้ได้",
	"roomChat": "ห้องแชต",
	"roomChat_description": "สามารถแชตแบบกลุ่มหลายคนได้\nและสามารถแชตกับผู้ใช้ที่ไม่ได้อนุญาตแชตส่วนตัวได้ หากอีกฝ่ายยอมรับ",
	"createRoom": "สร้างห้อง",
	"name": "ชื่อ",
	"startChat": "เริ่มแชต",
	"chatIsReadOnlyForThisAccountOrServer": "แชตบนเซิร์ฟเวอร์นี้ หรือบัญชีนี้ เป็นแบบอ่านอย่างเดียว ไม่สามารถส่งข้อความใหม่ สร้างหรือเข้าร่วมห้องแชตได้",
	"chatNotAvailableForThisAccountOrServer": "แชตไม่ได้เปิดใช้งานบนเซิร์ฟเวอร์นี้ หรือบัญชีนี้",
	"searchMessages": "ค้นหาข้อความ",
	"search": "ค้นหา",
	"searchResult": "ผลการค้นหา",
	"history": "ประวัติ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"individualChat": "Özel Sohbet",
	"individualChat_description": "Başka bir kişiyle özel sohbet edin.",
	"roomChat": "Sohbet Odası",
	"roomChat_description": "Birden fazla kişinin katılabileceği bir sohbet odası.\nÖzel sohbetlere izin vermeyen kişileri de davet edebilirsin, ancak davetini kabul etmeleri gerekir.",
	"createRoom": "Oda Oluştur",
	"name": "İsim",
	"startChat": "Sohbete başla",
	"chatIsReadOnlyForThisAccountOrServer": "Bu sunucuda veya bu hesapta sohbet okunur modundadır. Yeni mesaj yazamaz veya sohbet odası oluşturamaz/katılamazsınız.",
	"chatNotAvailableForThisAccountOrServer": "Bu sunucuda veya bu hesapta sohbet özelliği etkin değildir.",
	"searchMessages": "Mesajları ara",
	"search": "Ara",
	"searchResult": "Arama sonuçları",
	"history": "Tarih"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"individualChat": "Private Chat",
	"individualChat_description": "Have a private chat with another person.",
	"roomChat": "Room Chat",
	"roomChat_description": "A chat room which can have multiple people.\nYou can also invite people who don't allow private chats if they accept the invite.",
	"createRoom": "Create Room",
	"name": "Name",
	"startChat": "Start chat",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"searchMessages": "Search messages",
	"search": "ئىزدەش",
	"searchResult": "Search results",
	"history": "History"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"individualChat": "Особистий чат",
	"individualChat_description": "Майте особистий чат з іншою людиною.",
	"roomChat": "Група",
	"roomChat_description": "Чат з декількома людьми.\nВи також можете запрошувати людей які мають вимкнені особисті чати, якщо вони приймуть запрошення.",
	"createRoom": "Створити групу",
	"name": "Ім'я",
	"startChat": "Почати чат",
	"chatIsReadOnlyForThisAccountOrServer": "Чат доступний лише для читання для цього сервера або облікового запису. Ви не можете друкувати нові повідомлення або створювати/доєлнуватися до груп.",
	"chatNotAvailableForThisAccountOrServer": "Чат не увімкнено на цьому сервері або для цього облікового запису.",
	"searchMessages": "Шукати повідомлення",
	"search": "Пошук",
	"searchResult": "Результати пошуку",
	"history": "Історія"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"individualChat": "Private Chat",
	"individualChat_description": "Have a private chat with another person.",
	"roomChat": "Room Chat",
	"roomChat_description": "A chat room which can have multiple people.\nYou can also invite people who don't allow private chats if they accept the invite.",
	"createRoom": "Create Room",
	"name": "Tên",
	"startChat": "Bắt đầu trò chuyện",
	"chatIsReadOnlyForThisAccountOrServer": "Chat is read-only on this server or this account. You cannot write new messages or create/join chat rooms.",
	"chatNotAvailableForThisAccountOrServer": "Chat is not enabled on this server or for this account.",
	"searchMessages": "Search messages",
	"search": "Tìm kiếm",
	"searchResult": "Kết quả tìm kiếm",
	"history": "History"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"individualChat": "私聊",
	"individualChat_description": "与特定的用户单独聊天。",
	"roomChat": "群聊",
	"roomChat_description": "支持多人同时聊天。\n即使对方不允许私聊，只要接受邀请也能加入。",
	"createRoom": "创建群聊",
	"name": "名称",
	"startChat": "开始聊天",
	"chatIsReadOnlyForThisAccountOrServer": "此服务器或者账户内的聊天为只读。无法发布新信息或创建及加入群聊。",
	"chatNotAvailableForThisAccountOrServer": "此服务器或者账户还未开启聊天功能。",
	"searchMessages": "搜索消息",
	"search": "搜索",
	"searchResult": "搜索结果",
	"history": "历史"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"individualChat": "ㄧ對一聊天室",
	"individualChat_description": "可以與特定使用者進行一對一的聊天。",
	"roomChat": "多人聊天室",
	"roomChat_description": "可以進行多人聊天。\n此外，即使是未允許個人聊天的使用者，只要對方接受，也可以進行聊天。",
	"createRoom": "建立聊天室",
	"name": "名稱",
	"startChat": "開始聊天",
	"chatIsReadOnlyForThisAccountOrServer": "在此伺服器或此帳戶上的聊天是唯讀的。您無法發布新訊息、建立或加入聊天室。",
	"chatNotAvailableForThisAccountOrServer": "這個伺服器或這個帳號的聊天功能尚未啟用。",
	"searchMessages": "搜尋聊天訊息",
	"search": "搜尋",
	"searchResult": "搜尋結果",
	"history": "歷史紀錄"
}
</locale>
