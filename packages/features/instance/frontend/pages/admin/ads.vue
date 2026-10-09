<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
		<MkSelect v-model="filterType" :items="filterTypeDef" :class="$style.input" @update:modelValue="filterItems">
			<template #label>{{ $locale.sfc.state }}</template>
		</MkSelect>

		<div>
			<div v-for="ad in ads" class="_panel _gaps_m" :class="$style.ad">
				<MkAd v-if="ad.url" :key="ad.id" :specify="ad"/>

				<MkInput v-model="ad.url" type="url">
					<template #label>URL</template>
				</MkInput>

				<MkInput v-model="ad.imageUrl" type="url">
					<template #label>{{ $locale.sfc.imageUrl }}</template>
				</MkInput>

				<MkRadios
					v-model="ad.place"
					:options="[
						{ value: 'square' },
						{ value: 'horizontal' },
						{ value: 'horizontal-big' },
					]"
				>
					<template #label>Form</template>
				</MkRadios>

				<FormSplit>
					<MkInput v-model="ad.ratio" type="number">
						<template #label>{{ $locale.sfc.ratio }}</template>
					</MkInput>
					<MkInput v-model="ad.startsAt" type="datetime-local">
						<template #label>{{ $locale.sfc.startingperiod }}</template>
					</MkInput>
					<MkInput v-model="ad.expiresAt" type="datetime-local">
						<template #label>{{ $locale.sfc.expiration }}</template>
					</MkInput>
				</FormSplit>

				<MkSwitch v-model="ad.isSensitive">
					<template #label>{{ $locale.sfc.sensitive }}</template>
				</MkSwitch>

				<MkFolder>
					<template #label>{{ $locale.sfc.advancedSettings }}</template>
					<span>
						{{ $locale.sfc.adTimezoneinfo }}
						<div v-for="(day, index) in daysOfWeek" :key="index">
							<input
								:id="`ad${ad.id}-${index}`" type="checkbox" :checked="(ad.dayOfWeek & (1 << index)) !== 0"
								@change="toggleDayOfWeek(ad, index)"
							>
							<label :for="`ad${ad.id}-${index}`">{{ day }}</label>
						</div>
					</span>
				</MkFolder>

				<MkTextarea v-model="ad.memo">
					<template #label>{{ $locale.sfc.memo }}</template>
				</MkTextarea>

				<div class="_buttons">
					<MkButton inline primary style="margin-right: 12px;" @click="save(ad)">
						<i
							class="ti ti-device-floppy"
						></i> {{ $locale.sfc.save }}
					</MkButton>
					<MkButton inline danger @click="remove(ad)">
						<i class="ti ti-trash"></i> {{ $locale.sfc.remove }}
					</MkButton>
				</div>
			</div>

			<MkButton @click="more()">
				<i class="ti ti-reload"></i>{{ $locale.sfc.more }}
			</MkButton>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import FormSplit from '@features/ui/frontend/components/form/split.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';

type Ad = Misskey.entities.Ad & {
	place: 'square' | 'horizontal' | 'horizontal-big';
};

const ads = ref<Ad[]>([]);

// ISO形式はTZがUTCになってしまうので、TZ分ずらして時間を初期化
const localTime = new Date();
const localTimeDiff = localTime.getTimezoneOffset() * 60 * 1000;
const daysOfWeek: string[] = [$locale.value.sfc.weekdaySunday, $locale.value.sfc.weekdayMonday, $locale.value.sfc.weekdayTuesday, $locale.value.sfc.weekdayWednesday, $locale.value.sfc.weekdayThursday, $locale.value.sfc.weekdayFriday, $locale.value.sfc.weekdaySaturday];
const {
	model: filterType,
	def: filterTypeDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.all, value: 'all' },
		{ label: $locale.value.sfc.publishing, value: 'publishing' },
		{ label: $locale.value.sfc.expired, value: 'expired' },
	],
	initialValue: 'all',
});
let publishing: boolean | null = null;

misskeyApi('admin/ad/list', { publishing: publishing }).then(adsResponse => {
	if (adsResponse != null) {
		ads.value = adsResponse.map(r => {
			const exdate = new Date(r.expiresAt);
			const stdate = new Date(r.startsAt);
			exdate.setMilliseconds(exdate.getMilliseconds() - localTimeDiff);
			stdate.setMilliseconds(stdate.getMilliseconds() - localTimeDiff);
			return {
				...(r as Ad),
				expiresAt: exdate.toISOString().slice(0, 16),
				startsAt: stdate.toISOString().slice(0, 16),
			};
		});
	}
});

const filterItems = (v: typeof filterType.value) => {
	if (v === 'publishing') {
		publishing = true;
	} else if (v === 'expired') {
		publishing = false;
	} else {
		publishing = null;
	}

	refresh();
};

// 選択された曜日(index)のビットフラグを操作する
function toggleDayOfWeek(ad: Misskey.entities.Ad, index: number) {
	ad.dayOfWeek ^= 1 << index;
}

function add() {
	ads.value.unshift({
		id: '',
		memo: '',
		place: 'square',
		priority: 'middle',
		ratio: 1,
		url: '',
		imageUrl: '',
		expiresAt: new Date().toISOString(),
		startsAt: new Date().toISOString(),
		dayOfWeek: 0,
		isSensitive: false,
	});
}

function remove(ad: Misskey.entities.Ad) {
	os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters($locale.value.sfc.removeAreYouSure, { x: ad.url }),
	}).then(({ canceled }) => {
		if (canceled) return;
		ads.value = ads.value.filter(x => x !== ad);
		if (ad.id === '') return;
		os.apiWithDialog('admin/ad/delete', {
			id: ad.id,
		}).then(() => {
			refresh();
		});
	});
}

function save(ad: Misskey.entities.Ad) {
	if (ad.id === '') {
		misskeyApi('admin/ad/create', {
			...ad,
			expiresAt: new Date(ad.expiresAt).getTime(),
			startsAt: new Date(ad.startsAt).getTime(),
		}).then(() => {
			os.alert({
				type: 'success',
				text: $locale.value.sfc.saved,
			});
			refresh();
		}).catch(err => {
			os.alert({
				type: 'error',
				text: err,
			});
		});
	} else {
		misskeyApi('admin/ad/update', {
			...ad,
			expiresAt: new Date(ad.expiresAt).getTime(),
			startsAt: new Date(ad.startsAt).getTime(),
		}).then(() => {
			os.alert({
				type: 'success',
				text: $locale.value.sfc.saved,
			});
		}).catch(err => {
			os.alert({
				type: 'error',
				text: err,
			});
		});
	}
}

function more() {
	misskeyApi('admin/ad/list', { untilId: ads.value.reduce((acc, ad) => ad.id !== '' ? ad : acc).id, publishing: publishing }).then(adsResponse => {
		if (adsResponse == null) return;
		ads.value = ads.value.concat(adsResponse.map(r => {
			const exdate = new Date(r.expiresAt);
			const stdate = new Date(r.startsAt);
			exdate.setMilliseconds(exdate.getMilliseconds() - localTimeDiff);
			stdate.setMilliseconds(stdate.getMilliseconds() - localTimeDiff);
			return {
				...(r as Ad),
				expiresAt: exdate.toISOString().slice(0, 16),
				startsAt: stdate.toISOString().slice(0, 16),
			};
		}));
	});
}

function refresh() {
	misskeyApi('admin/ad/list', { publishing: publishing }).then(adsResponse => {
		if (adsResponse == null) return;
		ads.value = adsResponse.map(r => {
			const exdate = new Date(r.expiresAt);
			const stdate = new Date(r.startsAt);
			exdate.setMilliseconds(exdate.getMilliseconds() - localTimeDiff);
			stdate.setMilliseconds(stdate.getMilliseconds() - localTimeDiff);
			return {
				...(r as Ad),
				expiresAt: exdate.toISOString().slice(0, 16),
				startsAt: stdate.toISOString().slice(0, 16),
			};
		});
	});
}

refresh();

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: $locale.value.sfc.add,
	handler: add,
}]);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.ads,
	icon: 'ti ti-ad',
}));
</script>

<style lang="scss" module>
.ad {
	padding: 32px;

	&:not(:last-child) {
		margin-bottom: var(--MI-margin);
	}
}
.input {
	margin-bottom: 32px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"state": "الحالة",
	"imageUrl": "رابط الصورة",
	"ratio": "النسبة",
	"startingperiod": "ابدأ",
	"expiration": "ينتهي استطلاع الرأي في",
	"sensitive": "محتوى حساس",
	"advancedSettings": "إعدادات متقدمة",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"memo": "تذكير",
	"save": "حفظ",
	"remove": "حذف",
	"more": "المزيد!",
	"weekdaySunday": "الأحد",
	"weekdayMonday": "الإثنين",
	"weekdayTuesday": "الثلاثاء",
	"weekdayWednesday": "الأربعاء",
	"weekdayThursday": "الخميس",
	"weekdayFriday": "الجمعة",
	"weekdaySaturday": "السبت",
	"all": "الكل",
	"publishing": "Publishing",
	"expired": "منتهية صلاحيته",
	"removeAreYouSure": "متأكد من أنك تريد حذف {x}؟",
	"saved": "حُفظ",
	"add": "إضافة",
	"ads": "الإعلانات"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"state": "Estat",
	"imageUrl": "URL de la imatge",
	"ratio": "Proporció",
	"startingperiod": "Inici",
	"expiration": "Deadline",
	"sensitive": "Sensible",
	"advancedSettings": "Configuració avançada",
	"adTimezoneinfo": "El dia de la setmana ve determinat del fus horari del servidor.",
	"memo": "Recordatori",
	"save": "Desa",
	"remove": "Eliminar",
	"more": "Més",
	"weekdaySunday": "Diumenge",
	"weekdayMonday": "Dilluns",
	"weekdayTuesday": "Dimarts",
	"weekdayWednesday": "Dimecres",
	"weekdayThursday": "Dijous",
	"weekdayFriday": "Divendres",
	"weekdaySaturday": "Dissabte",
	"all": "Tot",
	"publishing": "S'està publicant",
	"expired": "Caducat",
	"removeAreYouSure": "Segur que vols esborrar «{x}»?",
	"saved": "S'ha desat",
	"add": "Afegir",
	"ads": "Publicitat "
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"state": "Stav",
	"imageUrl": "URL obrázku",
	"ratio": "Poměr",
	"startingperiod": "Začátek",
	"expiration": "Ukončit hlasování",
	"sensitive": "NSFW",
	"advancedSettings": "Pokročilá nastavení",
	"adTimezoneinfo": "Den v týdnu se určuje podle časového pásma serveru.",
	"memo": "Memo",
	"save": "Uložit",
	"remove": "Smazat",
	"more": "Více!",
	"weekdaySunday": "Neděle",
	"weekdayMonday": "Pondělí",
	"weekdayTuesday": "Úterý",
	"weekdayWednesday": "Středa",
	"weekdayThursday": "Čtvrtek",
	"weekdayFriday": "Pátek",
	"weekdaySaturday": "Sobota",
	"all": "Vše",
	"publishing": "Publikuji",
	"expired": "Prošlá",
	"removeAreYouSure": "Jste si jistí že chcete smazat \"{x}\"?",
	"saved": "Uloženo",
	"add": "Přidat",
	"ads": "Reklamy"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"state": "State",
	"imageUrl": "Image URL",
	"ratio": "Ratio",
	"startingperiod": "Start",
	"expiration": "Deadline",
	"sensitive": "Sensitive",
	"advancedSettings": "Advanced settings",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"memo": "Memo",
	"save": "Save",
	"remove": "Delete",
	"more": "More!",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday",
	"all": "All",
	"publishing": "Publishing",
	"expired": "Expired",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"saved": "Saved",
	"add": "Add",
	"ads": "Advertisements"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"state": "Status",
	"imageUrl": "Bild-URL",
	"ratio": "Verhältnis",
	"startingperiod": "Start",
	"expiration": "Frist",
	"sensitive": "Sensibel",
	"advancedSettings": "Erweiterte Einstellungen",
	"adTimezoneinfo": "Der Wochentag wird durch die Serverzeitzone bestimmt.",
	"memo": "Merkzettel",
	"save": "Speichern",
	"remove": "Löschen",
	"more": "Mehr!",
	"weekdaySunday": "Sonntag",
	"weekdayMonday": "Montag",
	"weekdayTuesday": "Dienstag",
	"weekdayWednesday": "Mittwoch",
	"weekdayThursday": "Donnerstag",
	"weekdayFriday": "Freitag",
	"weekdaySaturday": "Samstag",
	"all": "Alle",
	"publishing": "Wird veröffentlicht",
	"expired": "Abgelaufen",
	"removeAreYouSure": "Möchtest du „{x}“ wirklich entfernen?",
	"saved": "Erfolgreich gespeichert",
	"add": "Hinzufügen",
	"ads": "Werbung"
}
</locale>

<locale lang="json" locale="en-US">
{
	"state": "State",
	"imageUrl": "Image URL",
	"ratio": "Ratio",
	"startingperiod": "Start",
	"expiration": "Deadline",
	"sensitive": "Sensitive",
	"advancedSettings": "Advanced settings",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"memo": "Memo",
	"save": "Save",
	"remove": "Delete",
	"more": "More!",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday",
	"all": "All",
	"publishing": "Publishing",
	"expired": "Expired",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"saved": "Saved",
	"add": "Add",
	"ads": "Advertisements"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"state": "Estado",
	"imageUrl": "URL de la imagen.",
	"ratio": "Proporción",
	"startingperiod": "Comienzo",
	"expiration": "Termina el",
	"sensitive": "Marcado como sensible (NSFW)",
	"advancedSettings": "Configuración avanzada",
	"adTimezoneinfo": "El día de la semana está determidado por la zona horaria del servidor.",
	"memo": "Notas",
	"save": "Guardar",
	"remove": "Borrar",
	"more": "¡Más!",
	"weekdaySunday": "Domingo",
	"weekdayMonday": "Lunes",
	"weekdayTuesday": "Martes",
	"weekdayWednesday": "Miércoles",
	"weekdayThursday": "Jueves",
	"weekdayFriday": "Viernes",
	"weekdaySaturday": "Sábado",
	"all": "Todo",
	"publishing": "Publicando",
	"expired": "Caducada",
	"removeAreYouSure": "¿Desea borrar \"{x}\"?",
	"saved": "Guardado",
	"add": "Agregar",
	"ads": "Anuncios"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"state": "État",
	"imageUrl": "URL de l’image",
	"ratio": "Ratio",
	"startingperiod": "Commencer",
	"expiration": "Échéance",
	"sensitive": "Contenu sensible",
	"advancedSettings": "Paramètres avancés",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"memo": "Pense-bête",
	"save": "Enregistrer",
	"remove": "Supprimer",
	"more": "Plus !",
	"weekdaySunday": "Dimanche",
	"weekdayMonday": "Lundi",
	"weekdayTuesday": "Mardi",
	"weekdayWednesday": "Mercredi",
	"weekdayThursday": "Jeudi",
	"weekdayFriday": "Vendredi",
	"weekdaySaturday": "Samedi",
	"all": "Tous",
	"publishing": "Publié",
	"expired": "Expiré",
	"removeAreYouSure": "Êtes-vous sûr·e de vouloir supprimer « {x} »\u202f?",
	"saved": "Enregistré",
	"add": "Ajouter",
	"ads": "Publicité"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"state": "Kondisi",
	"imageUrl": "URL Gambar",
	"ratio": "Rasio",
	"startingperiod": "Mulai",
	"expiration": "Batas akhir",
	"sensitive": "Konten sensitif",
	"advancedSettings": "Pengaturan Lanjut",
	"adTimezoneinfo": "Hari dalam satu minggu ditentukan dari zona waktu peladen.",
	"memo": "Memo",
	"save": "Simpan",
	"remove": "Hapus",
	"more": "Lainnya",
	"weekdaySunday": "Minggu",
	"weekdayMonday": "Senin",
	"weekdayTuesday": "Selasa",
	"weekdayWednesday": "Rabu",
	"weekdayThursday": "Kamis",
	"weekdayFriday": "Jumat",
	"weekdaySaturday": "Sabtu",
	"all": "Semua",
	"publishing": "Sedang menyiarkan langsung",
	"expired": "Kedaluwarsa",
	"removeAreYouSure": "Apakah kamu yakin ingin menghapus \"{x}\"?",
	"saved": "Telah disimpan",
	"add": "Tambahkan",
	"ads": "Iklan"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"state": "Stato",
	"imageUrl": "URL dell'immagine",
	"ratio": "Rapporto",
	"startingperiod": "Periodo di inizio",
	"expiration": "Scadenza",
	"sensitive": "Esplicito",
	"advancedSettings": "Impostazioni avanzate",
	"adTimezoneinfo": "Il giorno della settimana è determinato in base al fuso orario del server.",
	"memo": "Promemoria",
	"save": "Salva",
	"remove": "Elimina",
	"more": "Di più!",
	"weekdaySunday": "Domenica",
	"weekdayMonday": "Lunedì",
	"weekdayTuesday": "Martedì",
	"weekdayWednesday": "Mercoledì",
	"weekdayThursday": "Giovedì",
	"weekdayFriday": "Venerdì",
	"weekdaySaturday": "Sabato",
	"all": "Tutte",
	"publishing": "Pubblicazione",
	"expired": "Scaduto",
	"removeAreYouSure": "Vuoi davvero eliminare \"{x}\"?",
	"saved": "Salvato",
	"add": "Aggiungi",
	"ads": "Banner"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"state": "状態",
	"imageUrl": "画像URL",
	"ratio": "比率",
	"startingperiod": "開始期間",
	"expiration": "期限",
	"sensitive": "センシティブ",
	"advancedSettings": "高度な設定",
	"adTimezoneinfo": "曜日はサーバーのタイムゾーンを元に指定されます。",
	"memo": "メモ",
	"save": "保存",
	"remove": "削除",
	"more": "もっと！",
	"weekdaySunday": "日曜日",
	"weekdayMonday": "月曜日",
	"weekdayTuesday": "火曜日",
	"weekdayWednesday": "水曜日",
	"weekdayThursday": "木曜日",
	"weekdayFriday": "金曜日",
	"weekdaySaturday": "土曜日",
	"all": "全て",
	"publishing": "配信中",
	"expired": "期限切れ",
	"removeAreYouSure": "「{x}」を削除しますか？",
	"saved": "保存しました",
	"add": "追加",
	"ads": "広告"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"state": "状態",
	"imageUrl": "画像URL",
	"ratio": "比率",
	"startingperiod": "始めた期間",
	"expiration": "期限",
	"sensitive": "気いつけて見いや",
	"advancedSettings": "高度な設定",
	"adTimezoneinfo": "曜日はサーバーのタイムゾーンを元に決めるで。",
	"memo": "メモ",
	"save": "とっとく",
	"remove": "ほかす",
	"more": "他のん",
	"weekdaySunday": "日曜日",
	"weekdayMonday": "月曜日",
	"weekdayTuesday": "火曜日",
	"weekdayWednesday": "水曜日",
	"weekdayThursday": "木曜日",
	"weekdayFriday": "金曜日",
	"weekdaySaturday": "土曜日",
	"all": "みんな",
	"publishing": "配信しとる",
	"expired": "期限切れ",
	"removeAreYouSure": "「{x}」はほかしてええか？",
	"saved": "保存したで！",
	"add": "増やす",
	"ads": "広告"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"state": "State",
	"imageUrl": "Image URL",
	"ratio": "Ratio",
	"startingperiod": "Start",
	"expiration": "Deadline",
	"sensitive": "Sensitive",
	"advancedSettings": "Advanced settings",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"memo": "Memo",
	"save": "Sekles",
	"remove": "Kkes",
	"more": "More!",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday",
	"all": "All",
	"publishing": "Publishing",
	"expired": "Expired",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"saved": "Saved",
	"add": "Add",
	"ads": "Advertisements"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"state": "State",
	"imageUrl": "Image URL",
	"ratio": "Ratio",
	"startingperiod": "Start",
	"expiration": "Deadline",
	"sensitive": "Sensitive",
	"advancedSettings": "Advanced settings",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"memo": "Memo",
	"save": "ಉಳಿಸಿ",
	"remove": "ಅಳಿಸು",
	"more": "More!",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday",
	"all": "All",
	"publishing": "Publishing",
	"expired": "Expired",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"saved": "Saved",
	"add": "Add",
	"ads": "Advertisements"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"state": "상태",
	"imageUrl": "이미지 URL",
	"ratio": "비율",
	"startingperiod": "시작 기간",
	"expiration": "기한",
	"sensitive": "열람 주의",
	"advancedSettings": "고급 설정",
	"adTimezoneinfo": "요일은 서버의 표준 시간대에 따라 결정됩니다.",
	"memo": "메모",
	"save": "저장",
	"remove": "삭제",
	"more": "더 보기!",
	"weekdaySunday": "일요일",
	"weekdayMonday": "월요일",
	"weekdayTuesday": "화요일",
	"weekdayWednesday": "수요일",
	"weekdayThursday": "목요일",
	"weekdayFriday": "금요일",
	"weekdaySaturday": "토요일",
	"all": "전체",
	"publishing": "배포 중",
	"expired": "만료됨",
	"removeAreYouSure": "\"{x}\" 을(를) 삭제하시겠습니까?",
	"saved": "저장했습니다",
	"add": "추가",
	"ads": "광고"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"state": "Status",
	"imageUrl": "AfbeeldingsURL",
	"ratio": "Verhouding",
	"startingperiod": "Start",
	"expiration": "Deadline",
	"sensitive": "NSFW",
	"advancedSettings": "Geavanceerde instellingen",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"memo": "Memo",
	"save": "Opslaan",
	"remove": "Verwijderen",
	"more": "Meer!",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday",
	"all": "Alle",
	"publishing": "Publiceren",
	"expired": "Expired",
	"removeAreYouSure": "Weet je zeker dat je \"{x}\" wil verwijderen?",
	"saved": "Opgeslagen",
	"add": "Toevoegen",
	"ads": "Advertenties"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"state": "State",
	"imageUrl": "Image URL",
	"ratio": "Ratio",
	"startingperiod": "Start",
	"expiration": "Deadline",
	"sensitive": "Sensitive",
	"advancedSettings": "Advanced settings",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"memo": "Notat",
	"save": "Lagre",
	"remove": "Slett",
	"more": "Mer!",
	"weekdaySunday": "Søndag",
	"weekdayMonday": "Mandag",
	"weekdayTuesday": "Tirsdag",
	"weekdayWednesday": "Onsdag",
	"weekdayThursday": "Torsdag",
	"weekdayFriday": "Fredag",
	"weekdaySaturday": "Lørdag",
	"all": "Alle",
	"publishing": "Publishing",
	"expired": "Expired",
	"removeAreYouSure": "Er du sikker på at du vil fjerne \"{x}\"?",
	"saved": "Lagret",
	"add": "Legg til",
	"ads": "Annonser"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"state": "Stan",
	"imageUrl": "Adres URL obrazka",
	"ratio": "Stosunek",
	"startingperiod": "Początek",
	"expiration": "Ankieta kończy się",
	"sensitive": "NSFW",
	"advancedSettings": "Zaawansowane ustawienia",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"memo": "Notatki",
	"save": "Zapisz",
	"remove": "Usuń",
	"more": "Więcej!",
	"weekdaySunday": "Niedziela",
	"weekdayMonday": "Poniedziałek",
	"weekdayTuesday": "Wtorek",
	"weekdayWednesday": "Środa",
	"weekdayThursday": "Czwartek",
	"weekdayFriday": "Piątek",
	"weekdaySaturday": "Sobota",
	"all": "Wszystkie",
	"publishing": "Publikowanie",
	"expired": "Expired",
	"removeAreYouSure": "Czy na pewno chcesz usunąć „{x}”?",
	"saved": "Zapisano",
	"add": "Dodaj",
	"ads": "Reklamy"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"state": "Estado",
	"imageUrl": "URL da imagem",
	"ratio": "Ratio",
	"startingperiod": "Data de início",
	"expiration": "Data limite",
	"sensitive": "Conteúdo sensível",
	"advancedSettings": "Configurações avançadas",
	"adTimezoneinfo": "O dia da semana é determinado pelo fuso horário do servidor.",
	"memo": "Nota",
	"save": "Salvar",
	"remove": "Remover",
	"more": "Mais!",
	"weekdaySunday": "Domingo",
	"weekdayMonday": "Segunda-feira",
	"weekdayTuesday": "Terça-feira",
	"weekdayWednesday": "Quarta-feira",
	"weekdayThursday": "Quinta-feira",
	"weekdayFriday": "Sexta-feira",
	"weekdaySaturday": "Sábado",
	"all": "Todos",
	"publishing": "Publicando",
	"expired": "Expirado",
	"removeAreYouSure": "Deseja excluir \"{x}\"?",
	"saved": "Salvo",
	"add": "Adicionar",
	"ads": "Anúncios"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"state": "Состояние",
	"imageUrl": "Ссылка на изображение",
	"ratio": "Соотношение",
	"startingperiod": "Начальный период",
	"expiration": "Опрос длится",
	"sensitive": "Содержимое не для всех",
	"advancedSettings": "Расширенные настройки ",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"memo": "Памятка",
	"save": "Сохранить",
	"remove": "Удалить",
	"more": "Ещё!",
	"weekdaySunday": "Воскресенье",
	"weekdayMonday": "Понедельник",
	"weekdayTuesday": "Вторник",
	"weekdayWednesday": "Среда",
	"weekdayThursday": "Четверг",
	"weekdayFriday": "Пятница",
	"weekdaySaturday": "Суббота",
	"all": "Все",
	"publishing": "Публикация",
	"expired": "Срок действия приглашения истёк",
	"removeAreYouSure": "Хотите удалить «{x}»?",
	"saved": "Сохранено",
	"add": "Добавить",
	"ads": "Реклама"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"state": "Status",
	"imageUrl": "URL obrázku",
	"ratio": "Pomer",
	"startingperiod": "Začiatok",
	"expiration": "Ukončiť hlasovanie",
	"sensitive": "NSFW",
	"advancedSettings": "Rozšírené nastavenia",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"memo": "Memo",
	"save": "Uložiť",
	"remove": "Odstrániť",
	"more": "Viac!",
	"weekdaySunday": "Nedeľa",
	"weekdayMonday": "Pondelok",
	"weekdayTuesday": "Utorok",
	"weekdayWednesday": "Streda",
	"weekdayThursday": "Štvrtok",
	"weekdayFriday": "Piatok",
	"weekdaySaturday": "Sobota",
	"all": "Všetko",
	"publishing": "Zverejňovanie",
	"expired": "Expired",
	"removeAreYouSure": "Naozaj chcete odstrániť \"{x}\"?",
	"saved": "Uložené",
	"add": "Pridať",
	"ads": "Reklamy"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"state": "สถานะ",
	"imageUrl": "URL รูปภาพ",
	"ratio": "อัตราส่วน",
	"startingperiod": "เริ่มเมื่อ",
	"expiration": "กำหนดเวลา",
	"sensitive": "เนื้อหาที่ละเอียดอ่อน",
	"advancedSettings": "การตั้งค่าขั้นสูง",
	"adTimezoneinfo": "วันในสัปดาห์นี้จะถูกกำหนดจากโซนเวลาของเซิร์ฟเวอร์",
	"memo": "เมโม",
	"save": "บันทึก",
	"remove": "ลบ",
	"more": "เพิ่มเติม!",
	"weekdaySunday": "วันอาทิตย์",
	"weekdayMonday": "วันจันทร์",
	"weekdayTuesday": "วันอังคาร",
	"weekdayWednesday": "วันพุธ",
	"weekdayThursday": "วันพฤหัสบดี",
	"weekdayFriday": "วันศุกร์",
	"weekdaySaturday": "วันเสาร์",
	"all": "ทั้งหมด",
	"publishing": "กำลังเผยแพร่",
	"expired": "หมดอายุแล้ว",
	"removeAreYouSure": "ต้องการลบ “{x}” ใช่ไหม?",
	"saved": "บันทึกแล้ว",
	"add": "เพิ่ม",
	"ads": "โฆษณา"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"state": "Durum",
	"imageUrl": "Görsel URL",
	"ratio": "Oran",
	"startingperiod": "Başla",
	"expiration": "Son tarih",
	"sensitive": "Hassas",
	"advancedSettings": "Gelişmiş ayarlar",
	"adTimezoneinfo": "Haftanın günü, sunucunun saat diliminden belirlenir.",
	"memo": "Hatırlatıcı",
	"save": "Kaydet",
	"remove": "Sil",
	"more": "Daha fazlası!",
	"weekdaySunday": "Pazar",
	"weekdayMonday": "Pazartesi",
	"weekdayTuesday": "Salı",
	"weekdayWednesday": "Çarşamba",
	"weekdayThursday": "Perşembe",
	"weekdayFriday": "Cuma",
	"weekdaySaturday": "Cumartesi",
	"all": "Tümü",
	"publishing": "Paylaşım",
	"expired": "Süresi dolmuş",
	"removeAreYouSure": "“{x}” öğesini kaldırmak istediğinizden emin misin?",
	"saved": "Kaydedildi",
	"add": "Ekle",
	"ads": "Reklamlar"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"state": "State",
	"imageUrl": "Image URL",
	"ratio": "Ratio",
	"startingperiod": "Start",
	"expiration": "Deadline",
	"sensitive": "Sensitive",
	"advancedSettings": "Advanced settings",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"memo": "Memo",
	"save": "Save",
	"remove": "ئۆچۈرۈش",
	"more": "More!",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday",
	"all": "All",
	"publishing": "Publishing",
	"expired": "Expired",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"saved": "Saved",
	"add": "Add",
	"ads": "Advertisements"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"state": "Стан",
	"imageUrl": "Посилання на зображення",
	"ratio": "Співвідношення",
	"startingperiod": "Початковий період",
	"expiration": "Опитування закінчується",
	"sensitive": "NSFW",
	"advancedSettings": "Розширені налаштування",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"memo": "Примітка",
	"save": "Зберегти",
	"remove": "Видалити",
	"more": "Бiльше!",
	"weekdaySunday": "Неділя",
	"weekdayMonday": "Понеділок",
	"weekdayTuesday": "Вівторок",
	"weekdayWednesday": "Середа",
	"weekdayThursday": "Четвер",
	"weekdayFriday": "П'ятниця",
	"weekdaySaturday": "Субота",
	"all": "Всі",
	"publishing": "Публікація",
	"expired": "Термін дії минув",
	"removeAreYouSure": "Ви впевнені, що хочете видалити \"{x}\"?",
	"saved": "Збережено",
	"add": "Додати",
	"ads": "Реклама"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"state": "Trạng thái",
	"imageUrl": "URL ảnh",
	"ratio": "Tỷ lệ",
	"startingperiod": "Thời gian bắt đầu\n",
	"expiration": "Thời hạn",
	"sensitive": "Nhạy cảm",
	"advancedSettings": "Cài đặt nâng cao",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"memo": "Lưu ý",
	"save": "Lưu",
	"remove": "Xóa",
	"more": "Thêm nữa!",
	"weekdaySunday": "Chủ Nhật",
	"weekdayMonday": "Thứ Hai",
	"weekdayTuesday": "Thứ Ba",
	"weekdayWednesday": "Thứ Tư",
	"weekdayThursday": "Thứ Năm",
	"weekdayFriday": "Thứ Sáu",
	"weekdaySaturday": "Thứ Bảy",
	"all": "Tất cả",
	"publishing": "Đang đăng",
	"expired": "Đã hết hạn",
	"removeAreYouSure": "Bạn có chắc muốn gỡ \"{x}\"?",
	"saved": "Đã lưu",
	"add": "Thêm",
	"ads": "Quảng cáo"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"state": "状态",
	"imageUrl": "图片 URL",
	"ratio": "比率",
	"startingperiod": "开始时间",
	"expiration": "截止时间",
	"sensitive": "敏感内容",
	"advancedSettings": "高级设置",
	"adTimezoneinfo": "星期几是根据服务器的时区确定的。",
	"memo": "备注",
	"save": "保存",
	"remove": "删除",
	"more": "更多！",
	"weekdaySunday": "星期日",
	"weekdayMonday": "星期一",
	"weekdayTuesday": "星期二",
	"weekdayWednesday": "星期三",
	"weekdayThursday": "星期四",
	"weekdayFriday": "星期五",
	"weekdaySaturday": "星期六",
	"all": "全部",
	"publishing": "投递中",
	"expired": "已过期",
	"removeAreYouSure": "要删掉「{x}」吗？",
	"saved": "已保存",
	"add": "添加",
	"ads": "广告"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"state": "狀態",
	"imageUrl": "圖片URL",
	"ratio": "%",
	"startingperiod": "開始期間",
	"expiration": "期限",
	"sensitive": "敏感內容",
	"advancedSettings": "進階設定",
	"adTimezoneinfo": "星期幾是由伺服器的時區指定的。",
	"memo": "備忘錄",
	"save": "儲存",
	"remove": "刪除",
	"more": "更多！",
	"weekdaySunday": "星期天",
	"weekdayMonday": "星期一",
	"weekdayTuesday": "星期二",
	"weekdayWednesday": "星期三",
	"weekdayThursday": "星期四",
	"weekdayFriday": "星期五",
	"weekdaySaturday": "星期六",
	"all": "全部",
	"publishing": "發送中",
	"expired": "過期",
	"removeAreYouSure": "確定要刪掉「{x}」嗎？",
	"saved": "已儲存",
	"add": "新增",
	"ads": "廣告"
}
</locale>
