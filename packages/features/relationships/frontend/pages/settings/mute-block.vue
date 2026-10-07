<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/mute-block" :label="$locale.sfc.muteAndBlock" icon="ti ti-ban" :keywords="['mute', 'block']">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/fluent-emoji/1f6ab.png" color="#ff2600">
			<SearchText>{{ $locale.sfc.muteAndBlockBanner }}</SearchText>
		</MkFeatureBanner>

		<div class="_gaps_s">
			<SearchMarker
				:label="$locale.sfc.wordMute"
				:keywords="['note', 'word', 'soft', 'mute', 'hide']"
			>
				<MkFolder>
					<template #icon><i class="ti ti-message-off"></i></template>
					<template #label>{{ $locale.sfc.wordMute }}</template>

					<div class="_gaps_m">
						<MkInfo>{{ $locale.sfc.wordMuteDescription }}</MkInfo>

						<SearchMarker
							:label="$locale.sfc.showMutedWord"
							:keywords="['show']"
						>
							<MkSwitch v-model="showSoftWordMutedWord">{{ $locale.sfc.showMutedWord }}</MkSwitch>
						</SearchMarker>

						<XWordMute :muted="$i.mutedWords" @save="saveMutedWords"/>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker
				:label="$locale.sfc.hardWordMute"
				:keywords="['note', 'word', 'hard', 'mute', 'hide']"
			>
				<MkFolder>
					<template #icon><i class="ti ti-message-off"></i></template>
					<template #label>{{ $locale.sfc.hardWordMute }}</template>

					<div class="_gaps_m">
						<MkInfo>{{ $locale.sfc.hardWordMuteDescription }}</MkInfo>
						<XWordMute :muted="$i.hardMutedWords" @save="saveHardMutedWords"/>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker
				:label="$locale.sfc.emojiMute"
				:keywords="['emoji', 'mute', 'hide']"
			>
				<MkFolder>
					<template #icon><i class="ti ti-mood-off"></i></template>
					<template #label>{{ $locale.sfc.emojiMute }}</template>

					<XEmojiMute/>
				</mkfolder>
			</SearchMarker>

			<SearchMarker
				:label="$locale.sfc.instanceMute"
				:keywords="['note', 'server', 'instance', 'host', 'federation', 'mute', 'hide']"
			>
				<MkFolder v-if="instance.federation !== 'none'">
					<template #icon><i class="ti ti-planet-off"></i></template>
					<template #label>{{ $locale.sfc.instanceMute }}</template>

					<XInstanceMute/>
				</MkFolder>
			</SearchMarker>

			<SearchMarker
				:keywords="['renote', 'mute', 'hide', 'user']"
			>
				<MkFolder>
					<template #icon><i class="ti ti-repeat-off"></i></template>
					<template #label><SearchLabel>{{ $locale.sfc.mutedUsers }} ({{ $locale.sfc.renote }})</SearchLabel></template>

					<MkPagination :paginator="renoteMutingPaginator" withControl>
						<template #empty><MkResult type="empty" :text="$locale.sfc.noUsers"/></template>

						<template #default="{ items }">
							<div class="_gaps_s">
								<div v-for="item in items" :key="item.mutee.id" :class="[$style.userItem, { [$style.userItemOpend]: expandedRenoteMuteItems.includes(item.id) }]">
									<div :class="$style.userItemMain">
										<MkA :class="$style.userItemMainBody" :to="userPage(item.mutee)">
											<MkUserCardMini :user="item.mutee"/>
										</MkA>
										<button class="_button" :class="$style.userToggle" @click="toggleRenoteMuteItem(item)"><i :class="$style.chevron" class="ti ti-chevron-down"></i></button>
										<button class="_button" :class="$style.remove" @click="unrenoteMute(item.mutee, $event)"><i class="ti ti-x"></i></button>
									</div>
									<div v-if="expandedRenoteMuteItems.includes(item.id)" :class="$style.userItemSub">
										<div>Muted at: <MkTime :time="item.createdAt" mode="detail"/></div>
									</div>
								</div>
							</div>
						</template>
					</MkPagination>
				</MkFolder>
			</SearchMarker>

			<SearchMarker
				:label="$locale.sfc.mutedUsers"
				:keywords="['note', 'mute', 'hide', 'user']"
			>
				<MkFolder>
					<template #icon><i class="ti ti-eye-off"></i></template>
					<template #label>{{ $locale.sfc.mutedUsers }}</template>

					<MkPagination :paginator="mutingPaginator" withControl>
						<template #empty><MkResult type="empty" :text="$locale.sfc.noUsers"/></template>

						<template #default="{ items }">
							<div class="_gaps_s">
								<div v-for="item in items" :key="item.mutee.id" :class="[$style.userItem, { [$style.userItemOpend]: expandedMuteItems.includes(item.id) }]">
									<div :class="$style.userItemMain">
										<MkA :class="$style.userItemMainBody" :to="userPage(item.mutee)">
											<MkUserCardMini :user="item.mutee"/>
										</MkA>
										<button class="_button" :class="$style.userToggle" @click="toggleMuteItem(item)"><i :class="$style.chevron" class="ti ti-chevron-down"></i></button>
										<button class="_button" :class="$style.remove" @click="unmute(item.mutee, $event)"><i class="ti ti-x"></i></button>
									</div>
									<div v-if="expandedMuteItems.includes(item.id)" :class="$style.userItemSub">
										<div>Muted at: <MkTime :time="item.createdAt" mode="detail"/></div>
										<div v-if="item.expiresAt">Period: {{ new Date(item.expiresAt).toLocaleString() }}</div>
										<div v-else>Period: {{ $locale.sfc.indefinitely }}</div>
									</div>
								</div>
							</div>
						</template>
					</MkPagination>
				</MkFolder>
			</SearchMarker>

			<SearchMarker
				:label="$locale.sfc.blockedUsers"
				:keywords="['block', 'user']"
			>
				<MkFolder>
					<template #icon><i class="ti ti-ban"></i></template>
					<template #label>{{ $locale.sfc.blockedUsers }}</template>

					<MkPagination :paginator="blockingPaginator" withControl>
						<template #empty><MkResult type="empty" :text="$locale.sfc.noUsers"/></template>

						<template #default="{ items }">
							<div class="_gaps_s">
								<div v-for="item in items" :key="item.blockee.id" :class="[$style.userItem, { [$style.userItemOpend]: expandedBlockItems.includes(item.id) }]">
									<div :class="$style.userItemMain">
										<MkA :class="$style.userItemMainBody" :to="userPage(item.blockee)">
											<MkUserCardMini :user="item.blockee"/>
										</MkA>
										<button class="_button" :class="$style.userToggle" @click="toggleBlockItem(item)"><i :class="$style.chevron" class="ti ti-chevron-down"></i></button>
										<button class="_button" :class="$style.remove" @click="unblock(item.blockee, $event)"><i class="ti ti-x"></i></button>
									</div>
									<div v-if="expandedBlockItems.includes(item.id)" :class="$style.userItemSub">
										<div>Blocked at: <MkTime :time="item.createdAt" mode="detail"/></div>
									</div>
								</div>
							</div>
						</template>
					</MkPagination>
				</MkFolder>
			</SearchMarker>
		</div>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { ref, computed, watch, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import XEmojiMute from '@features/relationships/frontend/pages/settings/mute-block.emoji-mute.vue';
import XInstanceMute from '@features/relationships/frontend/pages/settings/mute-block.instance-mute.vue';
import XWordMute from '@features/relationships/frontend/pages/settings/mute-block.word-mute.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import { userPage } from '@features/users/frontend/filters/user.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkUserCardMini from '@features/users/frontend/components/MkUserCardMini.vue';
import * as os from '@features/ui/frontend/os.js';
import { instance } from '@features/instance/frontend/instance.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';
import MkFeatureBanner from '@features/web/frontend/components/MkFeatureBanner.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import { suggestReload } from '@features/boot/frontend/utility/reload-suggest.js';

const $i = ensureSignin();

const renoteMutingPaginator = markRaw(new Paginator('renote-mute/list', {
	limit: 10,
}));

const mutingPaginator = markRaw(new Paginator('mute/list', {
	limit: 10,
}));

const blockingPaginator = markRaw(new Paginator('blocking/list', {
	limit: 10,
}));

const expandedRenoteMuteItems = ref<string[]>([]);
const expandedMuteItems = ref<string[]>([]);
const expandedBlockItems = ref<string[]>([]);

const showSoftWordMutedWord = prefer.model('showSoftWordMutedWord');

watch([
	showSoftWordMutedWord,
], () => {
	suggestReload();
});

async function unrenoteMute(user: Misskey.entities.UserDetailed, ev: PointerEvent) {
	os.popupMenu([{
		text: $locale.value.sfc.renoteUnmute,
		icon: 'ti ti-x',
		action: async () => {
			await os.apiWithDialog('renote-mute/delete', { userId: user.id });
			//role.users = role.users.filter(u => u.id !== user.id);
		},
	}], ev.currentTarget ?? ev.target);
}

async function unmute(user: Misskey.entities.UserDetailed, ev: PointerEvent) {
	os.popupMenu([{
		text: $locale.value.sfc.unmute,
		icon: 'ti ti-x',
		action: async () => {
			await os.apiWithDialog('mute/delete', { userId: user.id });
			//role.users = role.users.filter(u => u.id !== user.id);
		},
	}], ev.currentTarget ?? ev.target);
}

async function unblock(user: Misskey.entities.UserDetailed, ev: PointerEvent) {
	os.popupMenu([{
		text: $locale.value.sfc.unblock,
		icon: 'ti ti-x',
		action: async () => {
			await os.apiWithDialog('blocking/delete', { userId: user.id });
			//role.users = role.users.filter(u => u.id !== user.id);
		},
	}], ev.currentTarget ?? ev.target);
}

async function toggleRenoteMuteItem(item: { id: string }) {
	if (expandedRenoteMuteItems.value.includes(item.id)) {
		expandedRenoteMuteItems.value = expandedRenoteMuteItems.value.filter(x => x !== item.id);
	} else {
		expandedRenoteMuteItems.value.push(item.id);
	}
}

async function toggleMuteItem(item: { id: string }) {
	if (expandedMuteItems.value.includes(item.id)) {
		expandedMuteItems.value = expandedMuteItems.value.filter(x => x !== item.id);
	} else {
		expandedMuteItems.value.push(item.id);
	}
}

async function toggleBlockItem(item: { id: string }) {
	if (expandedBlockItems.value.includes(item.id)) {
		expandedBlockItems.value = expandedBlockItems.value.filter(x => x !== item.id);
	} else {
		expandedBlockItems.value.push(item.id);
	}
}

async function saveMutedWords(mutedWords: (string | string[])[]) {
	await os.apiWithDialog('i/update', { mutedWords });
}

async function saveHardMutedWords(hardMutedWords: (string | string[])[]) {
	await os.apiWithDialog('i/update', { hardMutedWords });
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.muteAndBlock,
	icon: 'ti ti-ban',
}));
</script>

<style lang="scss" module>
.userItemMain {
	display: flex;
}

.userItemSub {
	padding: 6px 12px;
	font-size: 85%;
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
}

.userItemMainBody {
	flex: 1;
	min-width: 0;
	margin-right: 8px;

	&:hover {
		text-decoration: none;
	}
}

.userToggle,
.remove {
	width: 32px;
	height: 32px;
	align-self: center;
}

.chevron {
	display: block;
	transition: transform 0.1s ease-out;
}

.userItem.userItemOpend {
	.chevron {
		transform: rotateX(180deg);
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"renoteUnmute": "ارفع الكتم عن إعادة النشر",
	"unmute": "إلغاء الكتم",
	"unblock": "إلغاء الحجب",
	"muteAndBlock": "المكتومون والمحجوبون",
	"muteAndBlockBanner": "You can configure and manage settings to hide content and restrict actions from specific users.",
	"wordMute": "حظر الكلمات",
	"wordMuteDescription": "Minimize notes that contain the specified word or phrase. Minimized notes can be displayed by clicking on them.",
	"showMutedWord": "Show muted words",
	"hardWordMute": "Hard word mute",
	"hardWordMuteDescription": "Hide notes that contain the specified word or phrase. Unlike word mute, the note will be completely hidden from view.",
	"emojiMute": "Mute emoji",
	"instanceMute": "المثلاء المكتومون",
	"mutedUsers": "الحسابات المكتومة",
	"renote": "أعد النشر",
	"noUsers": "ليس هناك مستخدمون",
	"indefinitely": "أبدًا",
	"blockedUsers": "الحسابات المحجوبة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"renoteUnmute": "Treure el silenci dels impulsos",
	"unmute": "Deixa de silenciar",
	"unblock": "Desbloqueja",
	"muteAndBlock": "Silencia i bloca",
	"muteAndBlockBanner": "Pots configurar i gestionar els continguts que desitges amagar i restringir les accions de determinats usuaris.",
	"wordMute": "Silenciar paraules ",
	"wordMuteDescription": "Minimitza les notes que contenen la paraula o frase especificada. Les notes minimitzades poden visualitzar-se fent clic sobre elles.",
	"showMutedWord": "Mostrar paraules silenciades",
	"hardWordMute": "Silenciar paraules fortes",
	"hardWordMuteDescription": "Oculta les notes que contenen la paraula o frase especificada. A diferència de Silenciar paraula, la nota quedarà completament oculta a la vista.",
	"emojiMute": "Silenciar emojis",
	"instanceMute": "Silenciar servidor",
	"mutedUsers": "Usuaris silenciats",
	"renote": "Impulsar",
	"noUsers": "No hi ha usuaris",
	"indefinitely": "Permanent",
	"blockedUsers": "Usuaris bloquejats"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"renoteUnmute": "Zrušit ztlumení poznámek",
	"unmute": "Odmlčet",
	"unblock": "Odblokovat",
	"muteAndBlock": "Ztlumení a blokování",
	"muteAndBlockBanner": "You can configure and manage settings to hide content and restrict actions from specific users.",
	"wordMute": "Ztlumené slova",
	"wordMuteDescription": "Minimize notes that contain the specified word or phrase. Minimized notes can be displayed by clicking on them.",
	"showMutedWord": "Show muted words",
	"hardWordMute": "Hard word mute",
	"hardWordMuteDescription": "Hide notes that contain the specified word or phrase. Unlike word mute, the note will be completely hidden from view.",
	"emojiMute": "Mute emoji",
	"instanceMute": "Ztlumené instance",
	"mutedUsers": "Zltumení uživatelé",
	"renote": "Přeposlat",
	"noUsers": "Žádní uživatelé",
	"indefinitely": "Navždy",
	"blockedUsers": "Blokovaní uživatelé"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"renoteUnmute": "Unmute Renotes",
	"unmute": "Unmute",
	"unblock": "Unblock",
	"muteAndBlock": "Mutes and Blocks",
	"muteAndBlockBanner": "You can configure and manage settings to hide content and restrict actions from specific users.",
	"wordMute": "Word mute",
	"wordMuteDescription": "Minimize notes that contain the specified word or phrase. Minimized notes can be displayed by clicking on them.",
	"showMutedWord": "Show muted words",
	"hardWordMute": "Hard word mute",
	"hardWordMuteDescription": "Hide notes that contain the specified word or phrase. Unlike word mute, the note will be completely hidden from view.",
	"emojiMute": "Mute emoji",
	"instanceMute": "Instance Mutes",
	"mutedUsers": "Muted users",
	"renote": "Renote",
	"noUsers": "There are no users",
	"indefinitely": "Permanently",
	"blockedUsers": "Blocked users"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"renoteUnmute": "Renote-Stummschaltung aufheben",
	"unmute": "Stummschaltung aufheben",
	"unblock": "Blockierung aufheben",
	"muteAndBlock": "Stummschaltungen und Blockierungen",
	"muteAndBlockBanner": "Du kannst Einstellungen konfigurieren und verwalten, um Inhalte auszublenden und Aktionen für bestimmte Benutzer zu beschränken.",
	"wordMute": "Wortstummschaltung",
	"wordMuteDescription": "Minimiert Notizen, die das angegebene Wort oder den angegebenen Ausdruck enthalten. Minimierte Notizen können angezeigt werden, indem du auf sie klickst.",
	"showMutedWord": "Stummgeschaltete Wörter anzeigen",
	"hardWordMute": "Harte Wortstummschaltung",
	"hardWordMuteDescription": "Blendet Notizen aus, die das angegebene Wort oder die angegebene Phrase enthalten. Im Gegensatz zur Wortstummschaltung wird die Notiz vollständig ausgeblendet.",
	"emojiMute": "Emoji stummschalten",
	"instanceMute": "Instanzstummschaltungen",
	"mutedUsers": "Stummgeschaltete Benutzer",
	"renote": "Renote",
	"noUsers": "Keine Benutzer gefunden",
	"indefinitely": "Dauerhaft",
	"blockedUsers": "Blockierte Benutzer"
}
</locale>

<locale locale="en-US" lang="json">
{
	"renoteUnmute": "Unmute Renotes",
	"unmute": "Unmute",
	"unblock": "Unblock",
	"muteAndBlock": "Mutes and Blocks",
	"muteAndBlockBanner": "You can configure and manage settings to hide content and restrict actions from specific users.",
	"wordMute": "Word mute",
	"wordMuteDescription": "Minimize notes that contain the specified word or phrase. Minimized notes can be displayed by clicking on them.",
	"showMutedWord": "Show muted words",
	"hardWordMute": "Hard word mute",
	"hardWordMuteDescription": "Hide notes that contain the specified word or phrase. Unlike word mute, the note will be completely hidden from view.",
	"emojiMute": "Mute emoji",
	"instanceMute": "Instance Mutes",
	"mutedUsers": "Muted users",
	"renote": "Renote",
	"noUsers": "There are no users",
	"indefinitely": "Permanently",
	"blockedUsers": "Blocked users"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"renoteUnmute": "Desilenciar renota",
	"unmute": "Dejar de silenciar",
	"unblock": "Desbloquear",
	"muteAndBlock": "Silenciar y bloquear",
	"muteAndBlockBanner": "Puedes configurar y gestionar ajustes para ocultar contenidos y restringir acciones a usuarios específicos.",
	"wordMute": "Silenciar palabras",
	"wordMuteDescription": "Minimiza las notas que contienen la palabra o frase especificada. Las notas minimizadas pueden visualizarse haciendo clic sobre ellas.",
	"showMutedWord": "Mostrar palabras silenciadas.",
	"hardWordMute": "Filtro de palabra fuerte",
	"hardWordMuteDescription": "Oculta las notas que contienen la palabra o frase especificada. A diferencia de Silenciar palabra, la nota quedará completamente oculta a la vista.",
	"emojiMute": "Silenciar emoji",
	"instanceMute": "Instancias silenciadas",
	"mutedUsers": "Usuarios silenciados",
	"renote": "Renotar",
	"noUsers": "No hay usuarios",
	"indefinitely": "Sin límite de tiempo",
	"blockedUsers": "Usuarios bloqueados"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"renoteUnmute": "Ne plus masquer les renotes",
	"unmute": "Ne plus masquer",
	"unblock": "Débloquer",
	"muteAndBlock": "Masqué·e·s / Bloqué·e·s",
	"muteAndBlockBanner": "You can configure and manage settings to hide content and restrict actions from specific users.",
	"wordMute": "Filtre de mots",
	"wordMuteDescription": "Minimize notes that contain the specified word or phrase. Minimized notes can be displayed by clicking on them.",
	"showMutedWord": "Show muted words",
	"hardWordMute": "Filtre de mots dur",
	"hardWordMuteDescription": "Hide notes that contain the specified word or phrase. Unlike word mute, the note will be completely hidden from view.",
	"emojiMute": "Mute emoji",
	"instanceMute": "Instance en sourdine",
	"mutedUsers": "Utilisateur·rice·s en sourdine",
	"renote": "Renoter",
	"noUsers": "Il n’y a pas d’utilisateur·rice·s",
	"indefinitely": "Illimité",
	"blockedUsers": "Utilisateur·rice·s bloqué·e·s"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"renoteUnmute": "Batal mematikan renote",
	"unmute": "Hapus bisukan",
	"unblock": "Buka blokir",
	"muteAndBlock": "Bisukan / Blokir",
	"muteAndBlockBanner": "You can configure and manage settings to hide content and restrict actions from specific users.",
	"wordMute": "Bisukan kata",
	"wordMuteDescription": "Minimalkan note yang mengandung kata atau frasa yang dicantumkan. Note yang terminimkan dapat ditampilkan setelah note tersebut diklik.",
	"showMutedWord": "Tampilkan kata yang dibisukan",
	"hardWordMute": "Pembisuan kata keras",
	"hardWordMuteDescription": "Sembunyikan note yang mengandung kata atau frasa yang dicantumkan. Berbeda dengan pembisuan kata, note tersebut akan disembunyikan sepenuhnya dari tampilan.",
	"emojiMute": "Mute emoji",
	"instanceMute": "Bisukan instansi",
	"mutedUsers": "Pengguna yang dibisukan",
	"renote": "Renote",
	"noUsers": "Tidak ada pengguna",
	"indefinitely": "Selamanya",
	"blockedUsers": "Pengguna yang diblokir"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"renoteUnmute": "Non silenziare le Rinota",
	"unmute": "Dai voce",
	"unblock": "Sbloccare",
	"muteAndBlock": "Silenziare e bloccare",
	"muteAndBlockBanner": "Puoi configurare la visibiltà dei contenuti e limitare le attività provenienti da profili specifici.",
	"wordMute": "Parole silenziate",
	"wordMuteDescription": "Comprimi le Note che hanno la parola o la regola specificata. Cliccale per espanderle e leggerne comunque il contenuto.",
	"showMutedWord": "Elenca le parole silenziate",
	"hardWordMute": "Filtro per parole",
	"hardWordMuteDescription": "Ignora le Note con la parola o la regola specificata. A differenza delle \"Parole Silenziate\", queste Note non ti verranno proprio recapitate.",
	"emojiMute": "Silenzia emoji",
	"instanceMute": "Silenziare l'istanza",
	"mutedUsers": "Profili silenziati",
	"renote": "Rinota",
	"noUsers": "Non ci sono profili",
	"indefinitely": "Non scade",
	"blockedUsers": "Profili bloccati"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"renoteUnmute": "リノートのミュートを解除",
	"unmute": "ミュート解除",
	"unblock": "ブロック解除",
	"muteAndBlock": "ミュートとブロック",
	"muteAndBlockBanner": "非表示にするコンテンツの設定や、特定のユーザーからのアクションを制限する設定と管理を行えます。",
	"wordMute": "ワードミュート",
	"wordMuteDescription": "指定した語句を含むノートを最小化します。最小化されたノートをクリックすることで表示することができます。",
	"showMutedWord": "ミュートされたワードを表示",
	"hardWordMute": "ハードワードミュート",
	"hardWordMuteDescription": "指定した語句を含むノートを隠します。ワードミュートとは異なり、ノートは完全に表示されなくなります。",
	"emojiMute": "絵文字ミュート",
	"instanceMute": "サーバーミュート",
	"mutedUsers": "ミュートしたユーザー",
	"renote": "リノート",
	"noUsers": "ユーザーはいません",
	"indefinitely": "無期限",
	"blockedUsers": "ブロックしたユーザー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"renoteUnmute": "リノートもやっぱ見るわ",
	"unmute": "ミュートやめたる",
	"unblock": "ブロックやめたる",
	"muteAndBlock": "ミュートとブロック",
	"muteAndBlockBanner": "見せんでええコンテンツの設定とか、特定のユーザーからのアクションを制限する設定と管理ができるで。",
	"wordMute": "ワードミュート",
	"wordMuteDescription": "指定した語句が入ってるノートをちっさくするで。ちっさくなったノートをクリックしたら中身を見れるで。",
	"showMutedWord": "ミュートされたワードを表示するで",
	"hardWordMute": "ハードワードミュート",
	"hardWordMuteDescription": "指定した語句が入ってるノートを隠すで。ワードミュートとちゃうて、ノートは完全に表示されんようになるで。",
	"emojiMute": "絵文字ミュート",
	"instanceMute": "サーバーミュート",
	"mutedUsers": "ミュートしとるユーザー",
	"renote": "リノート",
	"noUsers": "ユーザーはおらん",
	"indefinitely": "無期限",
	"blockedUsers": "ブロックしとるユーザー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"renoteUnmute": "Unmute Renotes",
	"unmute": "Unmute",
	"unblock": "Unblock",
	"muteAndBlock": "Mutes and Blocks",
	"muteAndBlockBanner": "You can configure and manage settings to hide content and restrict actions from specific users.",
	"wordMute": "Word mute",
	"wordMuteDescription": "Minimize notes that contain the specified word or phrase. Minimized notes can be displayed by clicking on them.",
	"showMutedWord": "Show muted words",
	"hardWordMute": "Hard word mute",
	"hardWordMuteDescription": "Hide notes that contain the specified word or phrase. Unlike word mute, the note will be completely hidden from view.",
	"emojiMute": "Mute emoji",
	"instanceMute": "Instance Mutes",
	"mutedUsers": "Muted users",
	"renote": "Renote",
	"noUsers": "There are no users",
	"indefinitely": "Permanently",
	"blockedUsers": "Blocked users"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"renoteUnmute": "Unmute Renotes",
	"unmute": "Unmute",
	"unblock": "Unblock",
	"muteAndBlock": "Mutes and Blocks",
	"muteAndBlockBanner": "You can configure and manage settings to hide content and restrict actions from specific users.",
	"wordMute": "Word mute",
	"wordMuteDescription": "Minimize notes that contain the specified word or phrase. Minimized notes can be displayed by clicking on them.",
	"showMutedWord": "Show muted words",
	"hardWordMute": "Hard word mute",
	"hardWordMuteDescription": "Hide notes that contain the specified word or phrase. Unlike word mute, the note will be completely hidden from view.",
	"emojiMute": "Mute emoji",
	"instanceMute": "Instance Mutes",
	"mutedUsers": "Muted users",
	"renote": "Renote",
	"noUsers": "There are no users",
	"indefinitely": "Permanently",
	"blockedUsers": "Blocked users"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"renoteUnmute": "리노트 뮤트 해제",
	"unmute": "뮤트 해제",
	"unblock": "차단 해제",
	"muteAndBlock": "뮤트 및 차단",
	"muteAndBlockBanner": "숨길 컨텐츠의 설정과, 특정 유저의 리액션을 제한하는 설정을 관리합니다.",
	"wordMute": "단어 뮤트",
	"wordMuteDescription": "정해진 단어가 포함된 노트를 최소화 한 상태로 표시합니다. 최소화 된 노트는 클릭해서 표시할 수 있습니다.",
	"showMutedWord": "뮤트한 단어를 표시하기",
	"hardWordMute": "하드 단어 뮤트",
	"hardWordMuteDescription": "정한 단어가 들어간 노트를 숨깁니다. 단어 뮤트와 차이점은 노트가 아예 보이지 않습니다.",
	"emojiMute": "이모티콘 뮤트",
	"instanceMute": "서버 뮤트",
	"mutedUsers": "뮤트한 유저",
	"renote": "리노트",
	"noUsers": "아무도 없습니다",
	"indefinitely": "무기한",
	"blockedUsers": "차단한 유저"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"renoteUnmute": "Dempen Renotes opheffen",
	"unmute": "Stop dempen",
	"unblock": "Deblokkeren",
	"muteAndBlock": "Gedempt en geblokkeerd",
	"muteAndBlockBanner": "You can configure and manage settings to hide content and restrict actions from specific users.",
	"wordMute": "Woord dempen",
	"wordMuteDescription": "Minimaliseert notities die het gespecificeerde woord of zin bevatten. Geminimaliseerde notities kunnen worden weergegeven door er op te klikken.",
	"showMutedWord": "Gedempte woorden weergeven",
	"hardWordMute": "Harde woorddemping",
	"hardWordMuteDescription": "Verbert notities die het gespecificeerde woord of zin bevatten. In tegenstelling tot woorddemping wordt de notitie volledig verborgen.",
	"emojiMute": "Mute emoji",
	"instanceMute": "Instantie dempers",
	"mutedUsers": "Gedempte gebruikers",
	"renote": "Herdelen",
	"noUsers": "Er zijn geen gebruikers.",
	"indefinitely": "Permanently",
	"blockedUsers": "Geblokkeerde gebruikers"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"renoteUnmute": "Vis Renotes",
	"unmute": "Vis",
	"unblock": "Opphev blokkering",
	"muteAndBlock": "Skjul og blokker",
	"muteAndBlockBanner": "You can configure and manage settings to hide content and restrict actions from specific users.",
	"wordMute": "Word mute",
	"wordMuteDescription": "Minimize notes that contain the specified word or phrase. Minimized notes can be displayed by clicking on them.",
	"showMutedWord": "Show muted words",
	"hardWordMute": "Hard word mute",
	"hardWordMuteDescription": "Hide notes that contain the specified word or phrase. Unlike word mute, the note will be completely hidden from view.",
	"emojiMute": "Mute emoji",
	"instanceMute": "Instance Mutes",
	"mutedUsers": "Skjulte brukere",
	"renote": "Renote",
	"noUsers": "Det er ingen brukere",
	"indefinitely": "Permanently",
	"blockedUsers": "Blokkerte brukere"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"renoteUnmute": "Wyłącz wyciszenie renote'ów",
	"unmute": "Cofnij wyciszenie",
	"unblock": "Odblokuj",
	"muteAndBlock": "Wycisz / Zablokuj",
	"muteAndBlockBanner": "You can configure and manage settings to hide content and restrict actions from specific users.",
	"wordMute": "Wyciszenie słowa",
	"wordMuteDescription": "Minimize notes that contain the specified word or phrase. Minimized notes can be displayed by clicking on them.",
	"showMutedWord": "Show muted words",
	"hardWordMute": "Wyciszaj przekleństwa",
	"hardWordMuteDescription": "Hide notes that contain the specified word or phrase. Unlike word mute, the note will be completely hidden from view.",
	"emojiMute": "Mute emoji",
	"instanceMute": "Wyciszone instancje",
	"mutedUsers": "Wyciszeni użytkownicy",
	"renote": "Udostępnij",
	"noUsers": "Brak użytkowników",
	"indefinitely": "Nigdy",
	"blockedUsers": "Zablokowani użytkownicy"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"renoteUnmute": "Reativar repostagens",
	"unmute": "Desmutar",
	"unblock": "Desbloquear",
	"muteAndBlock": "Silenciar e bloquear",
	"muteAndBlockBanner": "Você pode configurar meios para esconder conteúdo e restringir ações de certos usuários.",
	"wordMute": "Silenciar palavras",
	"wordMuteDescription": "Minimizar notas que contêm a palavra ou frase especificada. Notas minimizadas são exibidas ao clicá-las.",
	"showMutedWord": "Exibir palavras silenciadas",
	"hardWordMute": "Silenciar palavras (esconder posts)",
	"hardWordMuteDescription": "Esconder notas que contêm a palavra ou frase especificada. Diferente do silenciamento de palavras, a nota será completamente escondida.",
	"emojiMute": "Silenciar emoji",
	"instanceMute": "Instâncias silenciadas",
	"mutedUsers": "Usuários silenciados",
	"renote": "Repostar",
	"noUsers": "Sem usuários",
	"indefinitely": "Indefinitivamente",
	"blockedUsers": "Usuários bloqueados"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"renoteUnmute": "Открыть репосты",
	"unmute": "Отменить скрытие",
	"unblock": "Разблокировать",
	"muteAndBlock": "Скрытие и блокировка",
	"muteAndBlockBanner": "You can configure and manage settings to hide content and restrict actions from specific users.",
	"wordMute": "Скрытие слов",
	"wordMuteDescription": "Сведите к минимуму записи, содержащие указанное утверждение. Нажмите на свернутую запись, чтобы отобразить ее.",
	"showMutedWord": "Отображать слово без уведомления (звука)",
	"hardWordMute": "Строгое скрытие слов",
	"hardWordMuteDescription": "Скрыть заметки, содержащие указанное слово или фразу. В отличие от word mute, заметка будет полностью скрыта от просмотра.",
	"emojiMute": "Скрыть эмодзи",
	"instanceMute": "Глушение инстансов",
	"mutedUsers": "Скрытые пользователи",
	"renote": "Репост",
	"noUsers": "Нет ни одного пользователя",
	"indefinitely": "вечно",
	"blockedUsers": "Заблокированные пользователи"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"renoteUnmute": "Unmute Renotes",
	"unmute": "Zapnúť zvuk",
	"unblock": "Odblokovať",
	"muteAndBlock": "Umlčania a blokácie",
	"muteAndBlockBanner": "You can configure and manage settings to hide content and restrict actions from specific users.",
	"wordMute": "Stíšenie slova",
	"wordMuteDescription": "Minimize notes that contain the specified word or phrase. Minimized notes can be displayed by clicking on them.",
	"showMutedWord": "Show muted words",
	"hardWordMute": "Hard word mute",
	"hardWordMuteDescription": "Hide notes that contain the specified word or phrase. Unlike word mute, the note will be completely hidden from view.",
	"emojiMute": "Mute emoji",
	"instanceMute": "Stíšené servery",
	"mutedUsers": "Umlčaní používatelia",
	"renote": "Preposlať",
	"noUsers": "Žiadni používatelia",
	"indefinitely": "Navždy",
	"blockedUsers": "Blokovaní používatelia"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"renoteUnmute": "เลิกปิดเสียงรีโน้ต",
	"unmute": "ยกเลิกการปิดเสียง",
	"unblock": "เลิกบล็อก",
	"muteAndBlock": "ปิดเสียงและบล็อก",
	"muteAndBlockBanner": "สามารถตั้งค่าการซ่อนเนื้อหา และจำกัดการกระทำจากผู้ใช้เฉพาะรายได้",
	"wordMute": "ปิดเสียงคำ",
	"wordMuteDescription": "ย่อโน้ตที่มีวลีที่ระบุ  สามารถดูโน้ตที่ย่อแล้วได้โดยคลิกที่โน้ตเหล่านั้น",
	"showMutedWord": "แสดงคำที่ถูกปิดเสียง",
	"hardWordMute": "ปิดเสียงคำแบบแข็งโป๊ก",
	"hardWordMuteDescription": "จะซ่อนโน้ตที่มีคำที่ระบุไว้ ซึ่งไม่เหมือนการปิดเสียงคำ ในกรณีนี้โน้ตจะไม่แสดงเลย",
	"emojiMute": "ปิดเสียงเอโมจิ",
	"instanceMute": "ปิดเสียงเซิร์ฟเวอร์",
	"mutedUsers": "ผู้ใช้ที่ถูกปิดเสียง",
	"renote": "รีโน้ต",
	"noUsers": "ไม่พบผู้ใช้งาน",
	"indefinitely": "ตลอดไป",
	"blockedUsers": "ผู้ใช้ที่ถูกบล็อก"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"renoteUnmute": "Renote sessiz modunu kaldır",
	"unmute": "sesi aç",
	"unblock": "engellemeyi kaldır",
	"muteAndBlock": "Sessize Alma ve Engelleme",
	"muteAndBlockBanner": "İçeriği gizlemek ve belirli kullanıcıların eylemlerini kısıtlamak için ayarları yapılandırabilir ve yönetebilirsin.",
	"wordMute": "Kelime sustur",
	"wordMuteDescription": "Belirtilen kelime veya kelime öbeğini içeren notları küçültün. Küçültülmüş notlar, üzerlerine tıklanarak görüntülenebilir.",
	"showMutedWord": "Sessize alınan kelimeleri göster",
	"hardWordMute": "Zorla kelime sustur",
	"hardWordMuteDescription": "Belirtilen kelime veya kelime öbeğini içeren notları gizle. Kelime sessize alma özelliğinden farklı olarak, not tamamen görünmez hale gelir.",
	"emojiMute": "Emoji ses kapat",
	"instanceMute": "Sunucu Sessizleştirme",
	"mutedUsers": "Sessize alınan kullanıcılar",
	"renote": "Renote",
	"noUsers": "Kullanıcı yok",
	"indefinitely": "Kalıcı olarak",
	"blockedUsers": "Engellenen kullanıcılar"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"renoteUnmute": "Unmute Renotes",
	"unmute": "Unmute",
	"unblock": "Unblock",
	"muteAndBlock": "Mutes and Blocks",
	"muteAndBlockBanner": "You can configure and manage settings to hide content and restrict actions from specific users.",
	"wordMute": "Word mute",
	"wordMuteDescription": "Minimize notes that contain the specified word or phrase. Minimized notes can be displayed by clicking on them.",
	"showMutedWord": "Show muted words",
	"hardWordMute": "Hard word mute",
	"hardWordMuteDescription": "Hide notes that contain the specified word or phrase. Unlike word mute, the note will be completely hidden from view.",
	"emojiMute": "Mute emoji",
	"instanceMute": "Instance Mutes",
	"mutedUsers": "Muted users",
	"renote": "Renote",
	"noUsers": "There are no users",
	"indefinitely": "Permanently",
	"blockedUsers": "Blocked users"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"renoteUnmute": "Показувати поширення",
	"unmute": "Показувати",
	"unblock": "Розблокувати",
	"muteAndBlock": "Заглушення і блокування",
	"muteAndBlockBanner": "Ви можете змінювати налаштування та керувати ними, щоб ховати контент та обмежувати дії від певних користувачів.",
	"wordMute": "Блокування слів",
	"wordMuteDescription": "Згортати нотатки, що містять указане слово або фразу. Згорнуті нотатки можна показати, натиснувши на них.",
	"showMutedWord": "Показати приховані слова",
	"hardWordMute": "Повне приховування слів",
	"hardWordMuteDescription": "Приховувати нотатки, що містять указане слово або фразу. На відміну від приховування слів, нотатку буде повністю приховано з перегляду.",
	"emojiMute": "Приховати емодзі",
	"instanceMute": "Приглушення інстансів",
	"mutedUsers": "Заглушені користувачі",
	"renote": "Поширити",
	"noUsers": "Немає користувачів",
	"indefinitely": "Ніколи",
	"blockedUsers": "Заблоковані користувачі"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"renoteUnmute": "Unmute Renotes",
	"unmute": "Bỏ ẩn",
	"unblock": "Bỏ chặn",
	"muteAndBlock": "Ẩn và Chặn",
	"muteAndBlockBanner": "You can configure and manage settings to hide content and restrict actions from specific users.",
	"wordMute": "Ẩn chữ",
	"wordMuteDescription": "Thu nhỏ các bài đăng chứa các từ hoặc cụm từ nhất định. Các bài đăng này có thể được hiển thị khi click vào.",
	"showMutedWord": "Hiển thị từ đã ẩn",
	"hardWordMute": "Ẩn cụm từ hoàn toàn",
	"hardWordMuteDescription": "Ẩn hoàn toàn các bài đăng chứa từ hoặc cụm từ. Khác với mute, bài đăng sẽ bị ẩn hoàn toàn.",
	"emojiMute": "Mute emoji",
	"instanceMute": "Những máy chủ ẩn",
	"mutedUsers": "Người đã ẩn",
	"renote": "Đăng lại",
	"noUsers": "Chưa có ai",
	"indefinitely": "Vĩnh viễn",
	"blockedUsers": "Người đã chặn"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"renoteUnmute": "取消隐藏转帖",
	"unmute": "取消隐藏",
	"unblock": "取消屏蔽",
	"muteAndBlock": "隐藏和屏蔽",
	"muteAndBlockBanner": "可在此设置隐藏内容，或限制指定用户能进行的操作。",
	"wordMute": "折叠关键词",
	"wordMuteDescription": "折叠包含指定关键词的帖子。被折叠的帖子可单击展开。",
	"showMutedWord": "显示折叠关键词",
	"hardWordMute": "屏蔽关键词",
	"hardWordMuteDescription": "屏蔽包含指定关键词的帖子。与折叠关键词不同，帖子将完全不会被显示。",
	"emojiMute": "屏蔽表情符号",
	"instanceMute": "已隐藏的服务器",
	"mutedUsers": "已隐藏的用户",
	"renote": "转发",
	"noUsers": "无用户",
	"indefinitely": "永久",
	"blockedUsers": "已屏蔽的用户"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"renoteUnmute": "解除轉發貼文的靜音",
	"unmute": "解除靜音",
	"unblock": "解除封鎖",
	"muteAndBlock": "靜音和封鎖",
	"muteAndBlockBanner": "您可以設定和管理要隱藏的內容，並限制特定使用者的行動。",
	"wordMute": "被靜音的文字",
	"wordMuteDescription": "將包含指定語句的貼文最小化。 點擊最小化的貼文即可顯示。",
	"showMutedWord": "顯示靜音字",
	"hardWordMute": "硬文字靜音",
	"hardWordMuteDescription": "隱藏含有指定語句的貼文。 與詞彙靜音不同的是，貼文將完全隱藏不見。",
	"emojiMute": "表情符號靜音",
	"instanceMute": "被靜音的實例",
	"mutedUsers": "被靜音的使用者",
	"renote": "轉發",
	"noUsers": "沒有任何使用者",
	"indefinitely": "無期限",
	"blockedUsers": "被封鎖的使用者"
}
</locale>
