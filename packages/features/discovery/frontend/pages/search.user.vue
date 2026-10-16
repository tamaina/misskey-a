<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div class="_gaps">
		<MkInput v-model="searchQuery" :large="true" :autofocus="true" type="search" @enter.prevent="search">
			<template #prefix><i class="ti ti-search"></i></template>
		</MkInput>
		<MkRadios
			v-if="instance.federation !== 'none'"
			v-model="searchOrigin"
			:options="[
				{ value: 'combined', label: globalLocale.env.all },
				{ value: 'local', label: $locale.sfc.local },
				{ value: 'remote', label: $locale.sfc.remote },
			]"
			@update:modelValue="search()"
		>
		</MkRadios>
		<MkButton large primary gradate rounded @click="search">{{ globalLocale.env.search }}</MkButton>
	</div>

	<MkFoldableSection v-if="paginator">
		<template #header>{{ $locale.sfc.searchResult }}</template>
		<MkUserList :key="`searchUsers:${key}`" :paginator="paginator"/>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import type { GlobalLocale } from '@features/runtime/frontend/shared/global-locale.js';
import { markRaw, ref, shallowRef, toRef } from 'vue';
import type { Endpoints } from 'misskey-js';
import MkUserList from '@features/relationships/frontend/components/MkUserList.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { instance } from '@features/instance/frontend/instance.js';
import * as os from '@features/ui/frontend/os.js';
import MkFoldableSection from '@features/ui/frontend/components/MkFoldableSection.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const globalLocale = useLocale<GlobalLocale>(import.meta.url);

const props = withDefaults(defineProps<{
	query?: string,
	origin?: Endpoints['users/search']['req']['origin'],
}>(), {
	query: '',
	origin: 'combined',
});

const router = useRouter();

const key = ref(0);
const paginator = shallowRef<Paginator<'users/search'> | null>(null);

const searchQuery = ref(toRef(props, 'query').value);
const searchOrigin = ref(toRef(props, 'origin').value);

async function search() {
	const query = searchQuery.value.toString().trim();

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (query == null || query === '') return;

	//#region AP lookup
	if (query.startsWith('https://') && !query.includes(' ')) {
		const confirm = await os.confirm({
			type: 'info',
			text: $locale.value.sfc.lookupConfirm,
		});
		if (!confirm.canceled) {
			const promise = misskeyApi('ap/show', {
				uri: query,
			});

			os.promiseDialog(promise, null, null, $locale.value.sfc.fetchingAsApObject);

			const res = await promise;

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

	if (query.length > 1 && !query.includes(' ')) {
		if (query.startsWith('@')) {
			const confirm = await os.confirm({
				type: 'info',
				text: $locale.value.sfc.lookupConfirm,
			});
			if (!confirm.canceled) {
				router.pushByPath(`/${query}`);
				return;
			}
		}

		if (query.startsWith('#')) {
			const confirm = await os.confirm({
				type: 'info',
				text: $locale.value.sfc.openTagPageConfirm,
			});
			if (!confirm.canceled) {
				router.push('/user-tags/:tag', {
					params: {
						tag: query.substring(1),
					},
				});
				return;
			}
		}
	}

	paginator.value = markRaw(new Paginator('users/search', {
		limit: 10,
		offsetMode: true,
		params: {
			query: query,
			origin: instance.federation === 'none' ? 'local' : searchOrigin.value,
		},
	}));

	key.value++;
}
</script>

<locale locale="ar-SA" lang="json">
{
	"lookupConfirm": "Do you want to look up?",
	"fetchingAsApObject": "جارٍ جلبه مِن الفديفرس…",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"local": "المحلي",
	"remote": "بُعدي",
	"searchResult": "نتائج البحث"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"lookupConfirm": "Vols fer una cerca?",
	"fetchingAsApObject": "Cercant al Fediverse...",
	"openTagPageConfirm": "Vols obrir una pàgina d'etiquetes?",
	"local": "Local",
	"remote": "Remot",
	"searchResult": "Resultats de la cerca"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"lookupConfirm": "Do you want to look up?",
	"fetchingAsApObject": "Načítám data z Fediversu...",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"local": "Lokální",
	"remote": "Vzdálené",
	"searchResult": "Výsledky hledání"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"lookupConfirm": "Do you want to look up?",
	"fetchingAsApObject": "Fetching from the Fediverse...",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"local": "Local",
	"remote": "Remote",
	"searchResult": "Search results"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"lookupConfirm": "Bist du sicher, dass du das nachschlagen möchtest?",
	"fetchingAsApObject": "Wird aus dem Fediverse angefragt …",
	"openTagPageConfirm": "Hashtag Seite wirklich öffnen?",
	"local": "Lokal",
	"remote": "Fremd",
	"searchResult": "Suchergebnisse"
}
</locale>

<locale locale="en-US" lang="json">
{
	"lookupConfirm": "Do you want to look up?",
	"fetchingAsApObject": "Fetching from the Fediverse...",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"local": "Local",
	"remote": "Remote",
	"searchResult": "Search results"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"lookupConfirm": "¿Quiere informarse?",
	"fetchingAsApObject": "Buscando en el fediverso",
	"openTagPageConfirm": "¿Quieres abrir la página de etiquetas?",
	"local": "Local",
	"remote": "Remoto",
	"searchResult": "Resultados de búsqueda"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"lookupConfirm": "Do you want to look up?",
	"fetchingAsApObject": "Récupération depuis le fédiverse …",
	"openTagPageConfirm": "Ouvrir une page d'hashtags ?",
	"local": "Local",
	"remote": "Distant",
	"searchResult": "Résultats de la recherche"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"lookupConfirm": "Cari?",
	"fetchingAsApObject": "Mengambil data dari Fediverse...",
	"openTagPageConfirm": "Apakah ingin membuka laman tagar?",
	"local": "Lokal",
	"remote": "Remote",
	"searchResult": "Hasil Penelusuran"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"lookupConfirm": "Vuoi davvero richiedere informazioni?",
	"fetchingAsApObject": "Recuperando dal Fediverso...",
	"openTagPageConfirm": "Vuoi davvero aprire la pagina dell'hashtag?",
	"local": "Locale",
	"remote": "Remota",
	"searchResult": "Risultati della Ricerca"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"lookupConfirm": "照会しますか？",
	"fetchingAsApObject": "連合に照会中",
	"openTagPageConfirm": "ハッシュタグのページを開きますか？",
	"local": "ローカル",
	"remote": "リモート",
	"searchResult": "検索結果"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"lookupConfirm": "照会するけどええか？",
	"fetchingAsApObject": "今ちと連合に照会しとるで",
	"openTagPageConfirm": "ハッシュタグのページを開くんか？",
	"local": "ローカル",
	"remote": "リモート",
	"searchResult": "検索結果やで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"lookupConfirm": "Do you want to look up?",
	"fetchingAsApObject": "Fetching from the Fediverse...",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"local": "Local",
	"remote": "Remote",
	"searchResult": "Search results"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"lookupConfirm": "Do you want to look up?",
	"fetchingAsApObject": "ಒಕ್ಕೂಟದಿಂದ ಪಡೆಯಲಾಗುತ್ತಿದೆ...",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"local": "Local",
	"remote": "Remote",
	"searchResult": "Search results"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"lookupConfirm": "조회 할까요?",
	"fetchingAsApObject": "연합에서 찾아보는 중",
	"openTagPageConfirm": "해시태그의 페이지를 열까요?",
	"local": "로컬",
	"remote": "리모트",
	"searchResult": "검색 결과"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"lookupConfirm": "Weet je zeker dat je dit wil opzoeken?",
	"fetchingAsApObject": "Ophalen vanuit de Fediverse",
	"openTagPageConfirm": "Wil je deze hashtagpagina openen?",
	"local": "Lokaal",
	"remote": "Remote",
	"searchResult": "Zoekresultaten"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"lookupConfirm": "Do you want to look up?",
	"fetchingAsApObject": "Henter fra Fediverse...",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"local": "Local",
	"remote": "Remote",
	"searchResult": "Search results"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"lookupConfirm": "Do you want to look up?",
	"fetchingAsApObject": "Pobieranie z Fediwersum…",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"local": "Lokalne",
	"remote": "Zdalny",
	"searchResult": "Wyniki wyszukiwania"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"lookupConfirm": "Deseja buscar?",
	"fetchingAsApObject": "Buscando no Fediverso...",
	"openTagPageConfirm": "Deseja abrir a uma página de hashtag?",
	"local": "Local",
	"remote": "Remoto",
	"searchResult": "Pesquisar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"lookupConfirm": "Хотите узнать?",
	"fetchingAsApObject": "Приём с других сайтов",
	"openTagPageConfirm": "Открыть страницу этого хештега?",
	"local": "С этого сайта",
	"remote": "С других сайтов",
	"searchResult": "Результаты поиска"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"lookupConfirm": "Do you want to look up?",
	"fetchingAsApObject": "Načítam údaje z Fediverzu",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"local": "Lokálne",
	"remote": "Vzdialené",
	"searchResult": "Výsledky hľadania"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"lookupConfirm": "ต้องการเรียกดูข้อมูลใช่ไหม?",
	"fetchingAsApObject": "กำลังดึงข้อมูลจากสหพันธ์...",
	"openTagPageConfirm": "ต้องการเปิดหน้าแฮชแท็กใช่ไหม?",
	"local": "ท้องถิ่น",
	"remote": "ระยะไกล",
	"searchResult": "ผลการค้นหา"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"lookupConfirm": "Yukarı bakmak ister misin?",
	"fetchingAsApObject": "Fediverse'den talep ediliyor...",
	"openTagPageConfirm": "Bir hashtag sayfası açmak ister misin?",
	"local": "Yerel",
	"remote": "Uzak",
	"searchResult": "Arama sonuçları"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"lookupConfirm": "Do you want to look up?",
	"fetchingAsApObject": "Fetching from the Fediverse...",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"local": "Local",
	"remote": "Remote",
	"searchResult": "Search results"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"lookupConfirm": "Хочете дізнатись?",
	"fetchingAsApObject": "Отримуємо з федіверсу...",
	"openTagPageConfirm": "Хочете відкрити сторінку хештега?",
	"local": "Локальні",
	"remote": "Віддалені",
	"searchResult": "Результати пошуку"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"lookupConfirm": "Do you want to look up?",
	"fetchingAsApObject": "Đang nạp dữ liệu từ Fediverse...",
	"openTagPageConfirm": "Do you want to open a hashtag page?",
	"local": "Máy chủ này",
	"remote": "Máy chủ khác",
	"searchResult": "Kết quả tìm kiếm"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"lookupConfirm": "确定查找吗？",
	"fetchingAsApObject": "在联邦中查找中…",
	"openTagPageConfirm": "确定打开话题标签页面？",
	"local": "本地",
	"remote": "远程",
	"searchResult": "搜索结果"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"lookupConfirm": "要查詢嗎？",
	"fetchingAsApObject": "從聯邦宇宙取得中...",
	"openTagPageConfirm": "要開啟標籤的頁面嗎？",
	"local": "本地",
	"remote": "遠端",
	"searchResult": "搜尋結果"
}
</locale>
