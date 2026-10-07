<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div v-if="state === 'done'" class="_buttonsCenter">
			<MkButton @click="close">{{ $locale.sfc.close }}</MkButton>
			<MkButton @click="goToMisskey">{{ $locale.sfc.goToMisskey }}</MkButton>
		</div>
		<div v-else class="_fullInfo">
			<MkLoading/>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { mainRouter } from '@features/navigation/frontend/router.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';

const state = ref<'fetching' | 'done'>('fetching');

function _fetch_() {
	const params = new URL(window.location.href).searchParams;

	// acctのほうはdeprecated
	let uri = params.get('uri') ?? params.get('acct');
	if (uri == null) {
		state.value = 'done';
		return;
	}

	let promise: Promise<unknown>;

	if (uri.startsWith('https://')) {
		promise = misskeyApi('ap/show', {
			uri,
		}).then(res => {
			if (res.type === 'User') {
				mainRouter.replace('/@:acct/:page?', {
					params: {
						acct: res.object.host != null ? `${res.object.username}@${res.object.host}` : res.object.username,
					},
				});
			} else if (res.type === 'Note') {
				mainRouter.replace('/notes/:noteId/:initialTab?', {
					params: {
						noteId: res.object.id,
					},
				});
			} else {
				os.alert({
					type: 'error',
					text: 'Not a user',
				});
			}
		});
	} else {
		if (uri.startsWith('acct:')) {
			uri = uri.slice(5);
		}
		promise = misskeyApi('users/show', Misskey.acct.parse(uri)).then(user => {
			mainRouter.replace('/@:acct/:page?', {
				params: {
					acct: user.host != null ? `${user.username}@${user.host}` : user.username,
				},
			});
		});
	}

	os.promiseDialog(promise, null, null, $locale.value.sfc.fetchingAsApObject);
}

function close(): void {
	window.close();

	// 閉じなければ100ms後タイムラインに
	window.setTimeout(() => {
		window.location.href = '/';
	}, 100);
}

function goToMisskey(): void {
	window.location.href = '/';
}

_fetch_();

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage({
	title: $locale.value.sfc.lookup,
	icon: 'ti ti-world-search',
});
</script>

<locale locale="ar-SA" lang="json">
{
	"close": "اغلق",
	"goToMisskey": "لميسكي",
	"fetchingAsApObject": "جارٍ جلبه مِن الفديفرس…",
	"lookup": "البحث"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"close": "Tanca",
	"goToMisskey": "Ves a Misskey",
	"fetchingAsApObject": "Cercant al Fediverse...",
	"lookup": "Cerca"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"close": "Zavřít",
	"goToMisskey": "Jít na Misskey",
	"fetchingAsApObject": "Načítám data z Fediversu...",
	"lookup": "Vyhledat"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"close": "Close",
	"goToMisskey": "To Misskey",
	"fetchingAsApObject": "Fetching from the Fediverse...",
	"lookup": "Lookup"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"close": "Schließen",
	"goToMisskey": "Zu Misskey",
	"fetchingAsApObject": "Wird aus dem Fediverse angefragt …",
	"lookup": "Anfragen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"close": "Close",
	"goToMisskey": "To Misskey",
	"fetchingAsApObject": "Fetching from the Fediverse...",
	"lookup": "Lookup"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"close": "Cerrar",
	"goToMisskey": "ir a Misskey",
	"fetchingAsApObject": "Buscando en el fediverso",
	"lookup": "Búsqueda"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"close": "Fermer",
	"goToMisskey": "Retour vers Misskey",
	"fetchingAsApObject": "Récupération depuis le fédiverse …",
	"lookup": "Recherche"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"close": "Tutup",
	"goToMisskey": "Ke Misskey",
	"fetchingAsApObject": "Mengambil data dari Fediverse...",
	"lookup": "Cari"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"close": "Chiudi",
	"goToMisskey": "Vai a Misskey",
	"fetchingAsApObject": "Recuperando dal Fediverso...",
	"lookup": "Ricerca remota"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"close": "閉じる",
	"goToMisskey": "Misskeyへ",
	"fetchingAsApObject": "連合に照会中",
	"lookup": "照会"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"close": "さいなら",
	"goToMisskey": "Misskeyへ",
	"fetchingAsApObject": "今ちと連合に照会しとるで",
	"lookup": "見てきて"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"close": "Close",
	"goToMisskey": "To Misskey",
	"fetchingAsApObject": "Fetching from the Fediverse...",
	"lookup": "Lookup"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"close": "Close",
	"goToMisskey": "To Misskey",
	"fetchingAsApObject": "ಒಕ್ಕೂಟದಿಂದ ಪಡೆಯಲಾಗುತ್ತಿದೆ...",
	"lookup": "Lookup"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"close": "닫기",
	"goToMisskey": "Misskey로",
	"fetchingAsApObject": "연합에서 찾아보는 중",
	"lookup": "찾아보기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"close": "Sluiten",
	"goToMisskey": "To Misskey",
	"fetchingAsApObject": "Ophalen vanuit de Fediverse",
	"lookup": "Opzoeken"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"close": "Lukk",
	"goToMisskey": "To Misskey",
	"fetchingAsApObject": "Henter fra Fediverse...",
	"lookup": "Lookup"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"close": "Zamknij",
	"goToMisskey": "To Misskey",
	"fetchingAsApObject": "Pobieranie z Fediwersum…",
	"lookup": "Zapytania"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"close": "Fechar",
	"goToMisskey": "Ao Misskey",
	"fetchingAsApObject": "Buscando no Fediverso...",
	"lookup": "Consultar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"close": "Закрыть",
	"goToMisskey": "К Misskey",
	"fetchingAsApObject": "Приём с других сайтов",
	"lookup": "Запрос"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"close": "Zavrieť",
	"goToMisskey": "To Misskey",
	"fetchingAsApObject": "Načítam údaje z Fediverzu",
	"lookup": "Vyhľadať"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"close": "ปิด",
	"goToMisskey": "ถึง Misskey",
	"fetchingAsApObject": "กำลังดึงข้อมูลจากสหพันธ์...",
	"lookup": "การค้นหา"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"close": "Kapat",
	"goToMisskey": "Misskey'e",
	"fetchingAsApObject": "Fediverse'den talep ediliyor...",
	"lookup": "Sorgu"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"close": "Close",
	"goToMisskey": "To Misskey",
	"fetchingAsApObject": "Fetching from the Fediverse...",
	"lookup": "Lookup"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"close": "Закрити",
	"goToMisskey": "До Misskey",
	"fetchingAsApObject": "Отримуємо з федіверсу...",
	"lookup": "Пошук"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"close": "Đóng",
	"goToMisskey": "Tới Misskey",
	"fetchingAsApObject": "Đang nạp dữ liệu từ Fediverse...",
	"lookup": "Tra cứu"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"close": "关闭",
	"goToMisskey": "去往 Misskey",
	"fetchingAsApObject": "在联邦中查找中…",
	"lookup": "查找用户"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"close": "關閉",
	"goToMisskey": "往 Misskey",
	"fetchingAsApObject": "從聯邦宇宙取得中...",
	"lookup": "查詢"
}
</locale>
