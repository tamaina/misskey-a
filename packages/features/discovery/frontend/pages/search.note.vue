<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div class="_gaps">
		<MkInput
			v-model="searchQuery"
			large
			autofocus
			type="search"
			@enter.prevent="search"
		>
			<template #prefix><i class="ti ti-search"></i></template>
		</MkInput>
		<MkFoldableSection expanded>
			<template #header>{{ $locale.sfc.options }}</template>

			<div class="_gaps_m">
				<div style="display: flex; gap: 8px;">
					<MkInput v-model="rangeStartAt" type="datetime-local">
						<template #label>{{ $locale.sfc.postFrom }}</template>
					</MkInput>
					<MkInput v-model="rangeEndAt" type="datetime-local">
						<template #label>{{ $locale.sfc.postTo }}</template>
					</MkInput>
				</div>

				<MkRadios
					v-model="searchScope"
					:options="searchScopeDef"
				>
				</MkRadios>

				<div v-if="instance.federation !== 'none' && searchScope === 'server'" :class="$style.subOptionRoot">
					<MkInput
						v-model="hostInput"
						:placeholder="$locale.sfc.serverHostPlaceholder"
						@enter.prevent="search"
					>
						<template #label>{{ $locale.sfc.pleaseEnterServerHost }}</template>
						<template #prefix><i class="ti ti-server"></i></template>
					</MkInput>
				</div>

				<div v-if="searchScope === 'user'" :class="$style.subOptionRoot">
					<div :class="$style.userSelectLabel">{{ $locale.sfc.pleaseSelectUser }}</div>
					<div class="_gaps">
						<div v-if="user == null" :class="$style.userSelectButtons">
							<div v-if="$i != null">
								<MkButton
									transparent
									:class="$style.userSelectButton"
									@click="selectSelf"
								>
									<div :class="$style.userSelectButtonInner">
										<span><i class="ti ti-plus"></i><i class="ti ti-user"></i></span>
										<span>{{ $locale.sfc.selectSelf }}</span>
									</div>
								</MkButton>
							</div>
							<div :style="$i == null ? 'grid-column: span 2;' : undefined">
								<MkButton
									transparent
									:class="$style.userSelectButton"
									@click="selectUser"
								>
									<div :class="$style.userSelectButtonInner">
										<span><i class="ti ti-plus"></i></span>
										<span>{{ $locale.sfc.selectUser }}</span>
									</div>
								</MkButton>
							</div>
						</div>
						<div v-else :class="$style.userSelectedButtons">
							<div style="overflow: hidden;">
								<MkUserCardMini
									:user="user"
									:withChart="false"
								/>
							</div>
							<div>
								<button
									class="_button"
									:class="$style.userSelectedRemoveButton"
									@click="removeUser"
								>
									<i class="ti ti-x"></i>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</MkFoldableSection>
		<div>
			<MkButton
				large
				primary
				gradate
				rounded
				:disabled="searchParams == null"
				style="margin: 0 auto;"
				@click="search"
			>
				{{ $locale.sfc.search }}
			</MkButton>
		</div>
	</div>

	<MkFoldableSection v-if="paginator">
		<template #header>{{ $locale.sfc.searchResult }}</template>
		<MkNotesTimeline :key="`searchNotes:${key}`" :paginator="paginator"/>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
import { computed, markRaw, ref, shallowRef, toRef } from 'vue';
import { host as localHost } from '@@/js/config.js';
import type * as Misskey from 'misskey-js';
import { $i } from '@features/auth/frontend/i.js';
import { instance } from '@features/instance/frontend/instance.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { apLookup } from '@features/discovery/frontend/utility/lookup.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkFoldableSection from '@features/ui/frontend/components/MkFoldableSection.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkNotesTimeline from '@features/timelines/frontend/components/MkNotesTimeline.vue';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';
import MkUserCardMini from '@features/users/frontend/components/MkUserCardMini.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import type { MkRadiosOption } from '@features/ui/frontend/components/MkRadios.vue';

const props = withDefaults(defineProps<{
	query?: string;
	userId?: string;
	username?: string;
	host?: string | null;
}>(), {
	query: '',
	userId: undefined,
	username: undefined,
	host: '',
});

const router = useRouter();

const key = ref(0);
const paginator = shallowRef<Paginator<'notes/search'> | null>(null);

const searchQuery = ref(toRef(props, 'query').value);
const hostInput = ref(toRef(props, 'host').value);
const rangeStartAt = ref<string | null>(null);
const rangeEndAt = ref<string | null>(null);

const user = shallowRef<Misskey.entities.UserDetailed | null>(null);

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const noteSearchableScope = instance.noteSearchableScope ?? 'local';

//#region set user
let fetchedUser: Misskey.entities.UserDetailed | null = null;

if (props.userId) {
	fetchedUser = await misskeyApi('users/show', {
		userId: props.userId,
	}).catch(() => null);
}

if (props.username && fetchedUser == null) {
	fetchedUser = await misskeyApi('users/show', {
		username: props.username,
		...(props.host ? { host: props.host } : {}),
	}).catch(() => null);
}

if (fetchedUser != null) {
	if (!(noteSearchableScope === 'local' && fetchedUser.host != null)) {
		user.value = fetchedUser;
	}
}
//#endregion

const searchScope = ref<'all' | 'local' | 'server' | 'user'>((() => {
	if (user.value != null) return 'user';
	if (noteSearchableScope === 'local') return 'local';
	if (hostInput.value) return 'server';
	return 'all';
})());

const searchScopeDef = computed<MkRadiosOption[]>(() => {
	const options: MkRadiosOption[] = [];

	if (instance.federation !== 'none' && noteSearchableScope === 'global') {
		options.push({ value: 'all', label: $locale.value.sfc.searchScopeAll });
	}

	options.push({ value: 'local', label: instance.federation === 'none' ? $locale.value.sfc.searchScopeAll : $locale.value.sfc.searchScopeLocal });

	if (instance.federation !== 'none' && noteSearchableScope === 'global') {
		options.push({ value: 'server', label: $locale.value.sfc.searchScopeServer });
	}

	options.push({ value: 'user', label: $locale.value.sfc.searchScopeUser });

	return options;
});

type SearchParams = {
	readonly query: string;
	readonly host?: string;
	readonly userId?: string;
	readonly rangeStartAt?: number | null;
	readonly rangeEndAt?: number | null;
};

const fixHostIfLocal = (target: string | null | undefined) => {
	if (!target || target === localHost) return '.';
	return target;
};

const searchRange = () => {
	return {
		rangeStartAt: rangeStartAt.value ? new Date(rangeStartAt.value).getTime() : null,
		rangeEndAt: rangeEndAt.value ? new Date(rangeEndAt.value).getTime() : null,
	};
};

const searchParams = computed<SearchParams | null>(() => {
	const trimmedQuery = searchQuery.value.trim();
	if (!trimmedQuery) return null;

	if (searchScope.value === 'user') {
		if (user.value == null) return null;
		return {
			query: trimmedQuery,
			host: fixHostIfLocal(user.value.host),
			userId: user.value.id,
			...searchRange(),
		};
	}

	if (instance.federation !== 'none' && searchScope.value === 'server') {
		let trimmedHost = hostInput.value?.trim();
		if (!trimmedHost) return null;
		if (trimmedHost.startsWith('https://') || trimmedHost.startsWith('http://')) {
			try {
				trimmedHost = new URL(trimmedHost).host;
			} catch (err) { /* empty */ }
		}
		return {
			query: trimmedQuery,
			host: fixHostIfLocal(trimmedHost),
			...searchRange(),
		};
	}

	if (instance.federation === 'none' || searchScope.value === 'local') {
		return {
			query: trimmedQuery,
			host: '.',
			...searchRange(),
		};
	}

	return {
		query: trimmedQuery,
		...searchRange(),
	};
});

function selectUser() {
	os.selectUser({
		includeSelf: true,
		localOnly: instance.noteSearchableScope === 'local',
	}).then(_user => {
		user.value = _user;
	});
}

function selectSelf() {
	user.value = $i;
}

function removeUser() {
	user.value = null;
}

async function search() {
	if (searchParams.value == null) return;

	//#region AP lookup
	if (searchParams.value.query.startsWith('https://') && !searchParams.value.query.includes(' ')) {
		const confirm = await os.confirm({
			type: 'info',
			text: $locale.value.sfc.lookupConfirm,
		});
		if (!confirm.canceled) {
			const res = await apLookup(searchParams.value.query);

			if (res.type === 'User') {
				router.push('/@:acct/:page?', {
					params: {
						acct: `${res.object.username}@${res.object.host}`,
					},
				});
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			} else if (res.type === 'Note') {
				router.push('/notes/:noteId/:initialTab?', {
					params: {
						noteId: res.object.id,
					},
				});
			}

			return;
		}
	}
	//#endregion

	if (searchParams.value.query.length > 1 && !searchParams.value.query.includes(' ')) {
		if (searchParams.value.query.startsWith('@')) {
			const confirm = await os.confirm({
				type: 'info',
				text: $locale.value.sfc.lookupConfirm,
			});
			if (!confirm.canceled) {
				router.pushByPath(`/${searchParams.value.query}`);
				return;
			}
		}

		if (searchParams.value.query.startsWith('#')) {
			const confirm = await os.confirm({
				type: 'info',
				text: $locale.value.sfc.openTagPageConfirm,
			});
			if (!confirm.canceled) {
				router.push('/tags/:tag', {
					params: {
						tag: searchParams.value.query.substring(1),
					},
				});
				return;
			}
		}
	}

	paginator.value = markRaw(new Paginator('notes/search', {
		limit: 10,
		params: {
			...searchParams.value,
		},
	}));

	key.value++;
}
</script>
<style lang="scss" module>
.subOptionRoot {
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
	padding: var(--MI-margin);
}

.userSelectLabel {
	font-size: 0.85em;
	padding: 0 0 8px;
	user-select: none;
}

.userSelectButtons {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 16px;
}

.userSelectButton {
	width: 100%;
	height: 100%;
	padding: 12px;
	border: 2px dashed color(from var(--MI_THEME-fg) srgb r g b / 0.5);
}

.userSelectButtonInner {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: space-between;
	min-height: 38px;
}

.userSelectedButtons {
	display: grid;
	grid-template-columns: 1fr auto;
	align-items: center;
}

.userSelectedRemoveButton {
	width: 32px;
	height: 32px;
	color: #ff2a2a;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"searchScopeAll": "الكل",
	"searchScopeLocal": "المحلي",
	"searchScopeServer": "Specific server",
	"searchScopeUser": "مستخدم محدد",
	"lookupConfirm": "Do you want to look up?",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"options": "خيارات",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Example: misskey.example.com",
	"pleaseEnterServerHost": "Enter the server host",
	"pleaseSelectUser": "Select user",
	"selectSelf": "Select myself",
	"selectUser": "حدّد مستخدمًا",
	"search": "البحث",
	"searchResult": "نتائج البحث"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"searchScopeAll": "Tot",
	"searchScopeLocal": "Local",
	"searchScopeServer": "Instància ",
	"searchScopeUser": "Especificar usuari",
	"lookupConfirm": "Vols fer una cerca?",
	"openTagPageConfirm": "Vols obrir una pàgina d'etiquetes?",
	"options": "Opcions",
	"postFrom": "Publicat el",
	"postTo": "Publicat el",
	"serverHostPlaceholder": "Ex: misskey.example.com",
	"pleaseEnterServerHost": "Introdueix l'adreça de la instància ",
	"pleaseSelectUser": "Selecciona un usuari",
	"selectSelf": "Escollir manualment",
	"selectUser": "Selecciona usuari/a",
	"search": "Cercar",
	"searchResult": "Resultats de la cerca"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"searchScopeAll": "Vše",
	"searchScopeLocal": "Místní",
	"searchScopeServer": "Specific server",
	"searchScopeUser": "Upřesnit uživatele",
	"lookupConfirm": "Do you want to look up?",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"options": "Možnosti",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Example: misskey.example.com",
	"pleaseEnterServerHost": "Enter the server host",
	"pleaseSelectUser": "Select user",
	"selectSelf": "Select myself",
	"selectUser": "Vyberte uživatele",
	"search": "Vyhledávání",
	"searchResult": "Výsledky hledání"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"searchScopeAll": "All",
	"searchScopeLocal": "Local",
	"searchScopeServer": "Specific server",
	"searchScopeUser": "Specific user",
	"lookupConfirm": "Do you want to look up?",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"options": "Options",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Example: misskey.example.com",
	"pleaseEnterServerHost": "Enter the server host",
	"pleaseSelectUser": "Select user",
	"selectSelf": "Select myself",
	"selectUser": "Select a user",
	"search": "Search",
	"searchResult": "Search results"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"searchScopeAll": "Alle",
	"searchScopeLocal": "Lokal",
	"searchScopeServer": "Bestimmter Server",
	"searchScopeUser": "Spezifischer Benutzer",
	"lookupConfirm": "Bist du sicher, dass du das nachschlagen möchtest?",
	"openTagPageConfirm": "Hashtag Seite wirklich öffnen?",
	"options": "Optionen",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Beispiel: misskey.example.com",
	"pleaseEnterServerHost": "Gib den Server-Host ein",
	"pleaseSelectUser": "Benutzer auswählen",
	"selectSelf": "Mich auswählen",
	"selectUser": "Benutzer auswählen",
	"search": "Suchen",
	"searchResult": "Suchergebnisse"
}
</locale>

<locale locale="en-US" lang="json">
{
	"searchScopeAll": "All",
	"searchScopeLocal": "Local",
	"searchScopeServer": "Specific server",
	"searchScopeUser": "Specific user",
	"lookupConfirm": "Do you want to look up?",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"options": "Options",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Example: misskey.example.com",
	"pleaseEnterServerHost": "Enter the server host",
	"pleaseSelectUser": "Select user",
	"selectSelf": "Select myself",
	"selectUser": "Select a user",
	"search": "Search",
	"searchResult": "Search results"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"searchScopeAll": "Todo",
	"searchScopeLocal": "Local",
	"searchScopeServer": "Especifica el servidor (Instancia)",
	"searchScopeUser": "Especificar usuario",
	"lookupConfirm": "¿Quiere informarse?",
	"openTagPageConfirm": "¿Quieres abrir la página de etiquetas?",
	"options": "Opciones",
	"postFrom": "Publicado desde",
	"postTo": "Publicado el",
	"serverHostPlaceholder": "Ejemplo: misskey.example.com",
	"pleaseEnterServerHost": "Introduce la dirección del servidor/Instancia",
	"pleaseSelectUser": "Selecciona un usuario, por favor",
	"selectSelf": "Elígete a ti mismo",
	"selectUser": "Elegir usuario",
	"search": "Buscar",
	"searchResult": "Resultados de búsqueda"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"searchScopeAll": "Tous",
	"searchScopeLocal": "Local",
	"searchScopeServer": "Specific server",
	"searchScopeUser": "Spécifier l'utilisateur·rice",
	"lookupConfirm": "Do you want to look up?",
	"openTagPageConfirm": "Ouvrir une page d'hashtags ?",
	"options": "Options",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Example: misskey.example.com",
	"pleaseEnterServerHost": "Enter the server host",
	"pleaseSelectUser": "Select user",
	"selectSelf": "Sélectionner manuellement",
	"selectUser": "Sélectionner un·e utilisateur·rice",
	"search": "Rechercher",
	"searchResult": "Résultats de la recherche"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"searchScopeAll": "Semua",
	"searchScopeLocal": "Lokal",
	"searchScopeServer": "Specific server",
	"searchScopeUser": "Pengguna spesifik",
	"lookupConfirm": "Cari?",
	"openTagPageConfirm": "Apakah ingin membuka laman tagar?",
	"options": "Opsi peran",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Example: misskey.example.com",
	"pleaseEnterServerHost": "Enter the server host",
	"pleaseSelectUser": "Select user",
	"selectSelf": "Pilih diri sendiri",
	"selectUser": "Pilih pengguna",
	"search": "Cari",
	"searchResult": "Hasil Penelusuran"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"searchScopeAll": "Tutte",
	"searchScopeLocal": "Locale",
	"searchScopeServer": "Server specifico",
	"searchScopeUser": "Profilo specifico",
	"lookupConfirm": "Vuoi davvero richiedere informazioni?",
	"openTagPageConfirm": "Vuoi davvero aprire la pagina dell'hashtag?",
	"options": "Opzioni del ruolo",
	"postFrom": "Pubblicazione dal",
	"postTo": "Pubblicazione al",
	"serverHostPlaceholder": "Es: misskey.example.com",
	"pleaseEnterServerHost": "Inserire il nome host",
	"pleaseSelectUser": "Per favore, seleziona un profilo",
	"selectSelf": "Segli me",
	"selectUser": "Seleziona profilo",
	"search": "Cerca",
	"searchResult": "Risultati della Ricerca"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"searchScopeAll": "全て",
	"searchScopeLocal": "ローカル",
	"searchScopeServer": "サーバー指定",
	"searchScopeUser": "ユーザー指定",
	"lookupConfirm": "照会しますか？",
	"openTagPageConfirm": "ハッシュタグのページを開きますか？",
	"options": "オプション",
	"postFrom": "投稿日時from",
	"postTo": "投稿日時to",
	"serverHostPlaceholder": "例: misskey.example.com",
	"pleaseEnterServerHost": "サーバーのホストを入力してください",
	"pleaseSelectUser": "ユーザーを選択してください",
	"selectSelf": "自分を選択",
	"selectUser": "ユーザーを選択",
	"search": "検索",
	"searchResult": "検索結果"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"searchScopeAll": "みんな",
	"searchScopeLocal": "ローカル",
	"searchScopeServer": "サーバー指定",
	"searchScopeUser": "ユーザー指定",
	"lookupConfirm": "照会するけどええか？",
	"openTagPageConfirm": "ハッシュタグのページを開くんか？",
	"options": "オプション",
	"postFrom": "投稿日時from",
	"postTo": "投稿日時to",
	"serverHostPlaceholder": "例: misskey.example.com",
	"pleaseEnterServerHost": "サーバーのホストはどないするん？",
	"pleaseSelectUser": "ユーザーを選んでや",
	"selectSelf": "自分を選択",
	"selectUser": "ユーザーを選ぶ",
	"search": "探す",
	"searchResult": "検索結果やで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"searchScopeAll": "All",
	"searchScopeLocal": "Local",
	"searchScopeServer": "Specific server",
	"searchScopeUser": "Specific user",
	"lookupConfirm": "Do you want to look up?",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"options": "Options",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Example: misskey.example.com",
	"pleaseEnterServerHost": "Enter the server host",
	"pleaseSelectUser": "Select user",
	"selectSelf": "Select myself",
	"selectUser": "Select a user",
	"search": "Nadi",
	"searchResult": "Search results"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"searchScopeAll": "All",
	"searchScopeLocal": "Local",
	"searchScopeServer": "Specific server",
	"searchScopeUser": "Specific user",
	"lookupConfirm": "Do you want to look up?",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"options": "Options",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Example: misskey.example.com",
	"pleaseEnterServerHost": "Enter the server host",
	"pleaseSelectUser": "Select user",
	"selectSelf": "Select myself",
	"selectUser": "Select a user",
	"search": "ಹುಡುಕು",
	"searchResult": "Search results"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"searchScopeAll": "전체",
	"searchScopeLocal": "로컬",
	"searchScopeServer": "서버 지정",
	"searchScopeUser": "유저 지정",
	"lookupConfirm": "조회 할까요?",
	"openTagPageConfirm": "해시태그의 페이지를 열까요?",
	"options": "옵션",
	"postFrom": "게시 날짜 from",
	"postTo": "게시 날짜 to",
	"serverHostPlaceholder": "예: misskey.example.com",
	"pleaseEnterServerHost": "서버의 호스트를 입력해 주세요.",
	"pleaseSelectUser": "유저를 선택해주세요",
	"selectSelf": "본인을 선택",
	"selectUser": "유저 선택",
	"search": "검색",
	"searchResult": "검색 결과"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"searchScopeAll": "Alle",
	"searchScopeLocal": "Local",
	"searchScopeServer": "Specific server",
	"searchScopeUser": "Specific user",
	"lookupConfirm": "Weet je zeker dat je dit wil opzoeken?",
	"openTagPageConfirm": "Wil je deze hashtagpagina openen?",
	"options": "Options",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Example: misskey.example.com",
	"pleaseEnterServerHost": "Enter the server host",
	"pleaseSelectUser": "Select user",
	"selectSelf": "Mezelf kiezen",
	"selectUser": "Kies een gebruiker",
	"search": "Zoeken",
	"searchResult": "Zoekresultaten"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"searchScopeAll": "Alle",
	"searchScopeLocal": "Local",
	"searchScopeServer": "Specific server",
	"searchScopeUser": "Specific user",
	"lookupConfirm": "Do you want to look up?",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"options": "Alternativ",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Example: misskey.example.com",
	"pleaseEnterServerHost": "Enter the server host",
	"pleaseSelectUser": "Select user",
	"selectSelf": "Select myself",
	"selectUser": "Velg en bruker",
	"search": "Søk",
	"searchResult": "Search results"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"searchScopeAll": "Wszystkie",
	"searchScopeLocal": "Lokalne",
	"searchScopeServer": "Specific server",
	"searchScopeUser": "Specific user",
	"lookupConfirm": "Do you want to look up?",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"options": "Options",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Example: misskey.example.com",
	"pleaseEnterServerHost": "Enter the server host",
	"pleaseSelectUser": "Select user",
	"selectSelf": "Select myself",
	"selectUser": "Wybierz użytkownika",
	"search": "Szukaj",
	"searchResult": "Wyniki wyszukiwania"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"searchScopeAll": "Todos",
	"searchScopeLocal": "Local",
	"searchScopeServer": "Servidor específico",
	"searchScopeUser": "Usuário específico",
	"lookupConfirm": "Deseja buscar?",
	"openTagPageConfirm": "Deseja abrir a uma página de hashtag?",
	"options": "Opções",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Exemplo: misskey.example.com",
	"pleaseEnterServerHost": "Insira o endereço do servidor",
	"pleaseSelectUser": "Selecione um usuário",
	"selectSelf": "Selecionar a mim",
	"selectUser": "Selecionar usuário",
	"search": "Pesquisar",
	"searchResult": "Pesquisar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"searchScopeAll": "Все",
	"searchScopeLocal": "Местная",
	"searchScopeServer": "Specific server",
	"searchScopeUser": "Указанный пользователь",
	"lookupConfirm": "Хотите узнать?",
	"openTagPageConfirm": "Открыть страницу этого хештега?",
	"options": "Настройки ролей",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Example: misskey.example.com",
	"pleaseEnterServerHost": "Enter the server host",
	"pleaseSelectUser": "Select user",
	"selectSelf": "Выбрать себя",
	"selectUser": "Выберите пользователя",
	"search": "Поиск",
	"searchResult": "Результаты поиска"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"searchScopeAll": "Všetko",
	"searchScopeLocal": "Lokálne",
	"searchScopeServer": "Specific server",
	"searchScopeUser": "Specific user",
	"lookupConfirm": "Do you want to look up?",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"options": "Options",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Example: misskey.example.com",
	"pleaseEnterServerHost": "Enter the server host",
	"pleaseSelectUser": "Select user",
	"selectSelf": "Select myself",
	"selectUser": "Vyberte používateľa",
	"search": "Hľadať",
	"searchResult": "Výsledky hľadania"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"searchScopeAll": "ทั้งหมด",
	"searchScopeLocal": "ท้องถิ่น",
	"searchScopeServer": "ระบุเซิร์ฟเวอร์",
	"searchScopeUser": "ผู้ใช้เฉพาะ",
	"lookupConfirm": "ต้องการเรียกดูข้อมูลใช่ไหม?",
	"openTagPageConfirm": "ต้องการเปิดหน้าแฮชแท็กใช่ไหม?",
	"options": "ตัวเลือก",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "ตัวอย่าง: misskey.example.com",
	"pleaseEnterServerHost": "กรุณากรอกโฮสต์ของเซิร์ฟเวอร์",
	"pleaseSelectUser": "กรุณาเลือกผู้ใช้",
	"selectSelf": "เลือกตัวเอง",
	"selectUser": "เลือกผู้ใช้งาน",
	"search": "ค้นหา",
	"searchResult": "ผลการค้นหา"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"searchScopeAll": "Tümü",
	"searchScopeLocal": "Yerel",
	"searchScopeServer": "Spesifik sunucu",
	"searchScopeUser": "Spesifik kullanıcı",
	"lookupConfirm": "Yukarı bakmak ister misin?",
	"openTagPageConfirm": "Bir hashtag sayfası açmak ister misin?",
	"options": "Seçenekler",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Örnek: misskey.example.com",
	"pleaseEnterServerHost": "Sunucu ana bilgisayarını girin",
	"pleaseSelectUser": "Kullanıcı seç",
	"selectSelf": "Kendimi seç",
	"selectUser": "Kullanıcı seç",
	"search": "Ara",
	"searchResult": "Arama sonuçları"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"searchScopeAll": "All",
	"searchScopeLocal": "Local",
	"searchScopeServer": "Specific server",
	"searchScopeUser": "Specific user",
	"lookupConfirm": "Do you want to look up?",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"options": "Options",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Example: misskey.example.com",
	"pleaseEnterServerHost": "Enter the server host",
	"pleaseSelectUser": "Select user",
	"selectSelf": "Select myself",
	"selectUser": "Select a user",
	"search": "ئىزدەش",
	"searchResult": "Search results"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"searchScopeAll": "Всі",
	"searchScopeLocal": "Локальна",
	"searchScopeServer": "Specific server",
	"searchScopeUser": "Вказаний користувач",
	"lookupConfirm": "Хочете дізнатись?",
	"openTagPageConfirm": "Хочете відкрити сторінку хештега?",
	"options": "Опції",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Example: misskey.example.com",
	"pleaseEnterServerHost": "Enter the server host",
	"pleaseSelectUser": "Select user",
	"selectSelf": "Вибрати себе",
	"selectUser": "Виберіть користувача",
	"search": "Пошук",
	"searchResult": "Результати пошуку"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"searchScopeAll": "Tất cả",
	"searchScopeLocal": "Máy chủ này",
	"searchScopeServer": "Specific server",
	"searchScopeUser": "Người dùng chỉ định",
	"lookupConfirm": "Do you want to look up?",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"options": "Tùy chọn",
	"postFrom": "Date posted from",
	"postTo": "Date posted to",
	"serverHostPlaceholder": "Example: misskey.example.com",
	"pleaseEnterServerHost": "Enter the server host",
	"pleaseSelectUser": "Select user",
	"selectSelf": "Chọn chính bạn",
	"selectUser": "Chọn người dùng",
	"search": "Tìm kiếm",
	"searchResult": "Kết quả tìm kiếm"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"searchScopeAll": "全部",
	"searchScopeLocal": "本地",
	"searchScopeServer": "指定服务器",
	"searchScopeUser": "指定用户",
	"lookupConfirm": "确定查找吗？",
	"openTagPageConfirm": "确定打开话题标签页面？",
	"options": "选项",
	"postFrom": "起始日期",
	"postTo": "终止日期",
	"serverHostPlaceholder": "如：misskey.example.com",
	"pleaseEnterServerHost": "请填写服务器的主机名称",
	"pleaseSelectUser": "请选择用户",
	"selectSelf": "选择自己",
	"selectUser": "选择用户",
	"search": "搜索",
	"searchResult": "搜索结果"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"searchScopeAll": "全部",
	"searchScopeLocal": "本地",
	"searchScopeServer": "指定伺服器",
	"searchScopeUser": "指定使用者",
	"lookupConfirm": "要查詢嗎？",
	"openTagPageConfirm": "要開啟標籤的頁面嗎？",
	"options": "選項",
	"postFrom": "發布時間 from",
	"postTo": "發布時間 to",
	"serverHostPlaceholder": "例：misskey.example.com",
	"pleaseEnterServerHost": "請輸入伺服器的主機名稱",
	"pleaseSelectUser": "請選擇使用者",
	"selectSelf": "選擇自己",
	"selectUser": "選取使用者",
	"search": "搜尋",
	"searchResult": "搜尋結果"
}
</locale>
