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
					<template #label>{{ globalLocale.env.imageUrl }}</template>
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
					<template #label>{{ globalLocale.env.sensitive }}</template>
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
					<template #label>{{ globalLocale.env.memo }}</template>
				</MkTextarea>

				<div class="_buttons">
					<MkButton inline primary style="margin-right: 12px;" @click="save(ad)">
						<i
							class="ti ti-device-floppy"
						></i> {{ globalLocale.env.save }}
					</MkButton>
					<MkButton inline danger @click="remove(ad)">
						<i class="ti ti-trash"></i> {{ globalLocale.env.remove }}
					</MkButton>
				</div>
			</div>

			<MkButton @click="more()">
				<i class="ti ti-reload"></i>{{ globalLocale.env.more }}
			</MkButton>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
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
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

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
		{ label: globalLocale.value.env.all, value: 'all' },
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
		text: interpolateLocaleParameters(globalLocale.value.env.removeAreYouSure, { x: ad.url }),
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
	text: globalLocale.value.env.add,
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
	"ratio": "النسبة",
	"startingperiod": "ابدأ",
	"expiration": "ينتهي استطلاع الرأي في",
	"advancedSettings": "إعدادات متقدمة",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"weekdaySunday": "الأحد",
	"weekdayMonday": "الإثنين",
	"weekdayTuesday": "الثلاثاء",
	"weekdayWednesday": "الأربعاء",
	"weekdayThursday": "الخميس",
	"weekdayFriday": "الجمعة",
	"weekdaySaturday": "السبت",
	"publishing": "Publishing",
	"expired": "منتهية صلاحيته",
	"saved": "حُفظ",
	"ads": "الإعلانات"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"state": "Estat",
	"ratio": "Proporció",
	"startingperiod": "Inici",
	"expiration": "Deadline",
	"advancedSettings": "Configuració avançada",
	"adTimezoneinfo": "El dia de la setmana ve determinat del fus horari del servidor.",
	"weekdaySunday": "Diumenge",
	"weekdayMonday": "Dilluns",
	"weekdayTuesday": "Dimarts",
	"weekdayWednesday": "Dimecres",
	"weekdayThursday": "Dijous",
	"weekdayFriday": "Divendres",
	"weekdaySaturday": "Dissabte",
	"publishing": "S'està publicant",
	"expired": "Caducat",
	"saved": "S'ha desat",
	"ads": "Publicitat "
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"state": "Stav",
	"ratio": "Poměr",
	"startingperiod": "Začátek",
	"expiration": "Ukončit hlasování",
	"advancedSettings": "Pokročilá nastavení",
	"adTimezoneinfo": "Den v týdnu se určuje podle časového pásma serveru.",
	"weekdaySunday": "Neděle",
	"weekdayMonday": "Pondělí",
	"weekdayTuesday": "Úterý",
	"weekdayWednesday": "Středa",
	"weekdayThursday": "Čtvrtek",
	"weekdayFriday": "Pátek",
	"weekdaySaturday": "Sobota",
	"publishing": "Publikuji",
	"expired": "Prošlá",
	"saved": "Uloženo",
	"ads": "Reklamy"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"state": "State",
	"ratio": "Ratio",
	"startingperiod": "Start",
	"expiration": "Deadline",
	"advancedSettings": "Advanced settings",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday",
	"publishing": "Publishing",
	"expired": "Expired",
	"saved": "Saved",
	"ads": "Advertisements"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"state": "Status",
	"ratio": "Verhältnis",
	"startingperiod": "Start",
	"expiration": "Frist",
	"advancedSettings": "Erweiterte Einstellungen",
	"adTimezoneinfo": "Der Wochentag wird durch die Serverzeitzone bestimmt.",
	"weekdaySunday": "Sonntag",
	"weekdayMonday": "Montag",
	"weekdayTuesday": "Dienstag",
	"weekdayWednesday": "Mittwoch",
	"weekdayThursday": "Donnerstag",
	"weekdayFriday": "Freitag",
	"weekdaySaturday": "Samstag",
	"publishing": "Wird veröffentlicht",
	"expired": "Abgelaufen",
	"saved": "Erfolgreich gespeichert",
	"ads": "Werbung"
}
</locale>

<locale lang="json" locale="en-US">
{
	"state": "State",
	"ratio": "Ratio",
	"startingperiod": "Start",
	"expiration": "Deadline",
	"advancedSettings": "Advanced settings",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday",
	"publishing": "Publishing",
	"expired": "Expired",
	"saved": "Saved",
	"ads": "Advertisements"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"state": "Estado",
	"ratio": "Proporción",
	"startingperiod": "Comienzo",
	"expiration": "Termina el",
	"advancedSettings": "Configuración avanzada",
	"adTimezoneinfo": "El día de la semana está determidado por la zona horaria del servidor.",
	"weekdaySunday": "Domingo",
	"weekdayMonday": "Lunes",
	"weekdayTuesday": "Martes",
	"weekdayWednesday": "Miércoles",
	"weekdayThursday": "Jueves",
	"weekdayFriday": "Viernes",
	"weekdaySaturday": "Sábado",
	"publishing": "Publicando",
	"expired": "Caducada",
	"saved": "Guardado",
	"ads": "Anuncios"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"state": "État",
	"ratio": "Ratio",
	"startingperiod": "Commencer",
	"expiration": "Échéance",
	"advancedSettings": "Paramètres avancés",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"weekdaySunday": "Dimanche",
	"weekdayMonday": "Lundi",
	"weekdayTuesday": "Mardi",
	"weekdayWednesday": "Mercredi",
	"weekdayThursday": "Jeudi",
	"weekdayFriday": "Vendredi",
	"weekdaySaturday": "Samedi",
	"publishing": "Publié",
	"expired": "Expiré",
	"saved": "Enregistré",
	"ads": "Publicité"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"state": "Kondisi",
	"ratio": "Rasio",
	"startingperiod": "Mulai",
	"expiration": "Batas akhir",
	"advancedSettings": "Pengaturan Lanjut",
	"adTimezoneinfo": "Hari dalam satu minggu ditentukan dari zona waktu peladen.",
	"weekdaySunday": "Minggu",
	"weekdayMonday": "Senin",
	"weekdayTuesday": "Selasa",
	"weekdayWednesday": "Rabu",
	"weekdayThursday": "Kamis",
	"weekdayFriday": "Jumat",
	"weekdaySaturday": "Sabtu",
	"publishing": "Sedang menyiarkan langsung",
	"expired": "Kedaluwarsa",
	"saved": "Telah disimpan",
	"ads": "Iklan"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"state": "Stato",
	"ratio": "Rapporto",
	"startingperiod": "Periodo di inizio",
	"expiration": "Scadenza",
	"advancedSettings": "Impostazioni avanzate",
	"adTimezoneinfo": "Il giorno della settimana è determinato in base al fuso orario del server.",
	"weekdaySunday": "Domenica",
	"weekdayMonday": "Lunedì",
	"weekdayTuesday": "Martedì",
	"weekdayWednesday": "Mercoledì",
	"weekdayThursday": "Giovedì",
	"weekdayFriday": "Venerdì",
	"weekdaySaturday": "Sabato",
	"publishing": "Pubblicazione",
	"expired": "Scaduto",
	"saved": "Salvato",
	"ads": "Banner"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"state": "状態",
	"ratio": "比率",
	"startingperiod": "開始期間",
	"expiration": "期限",
	"advancedSettings": "高度な設定",
	"adTimezoneinfo": "曜日はサーバーのタイムゾーンを元に指定されます。",
	"weekdaySunday": "日曜日",
	"weekdayMonday": "月曜日",
	"weekdayTuesday": "火曜日",
	"weekdayWednesday": "水曜日",
	"weekdayThursday": "木曜日",
	"weekdayFriday": "金曜日",
	"weekdaySaturday": "土曜日",
	"publishing": "配信中",
	"expired": "期限切れ",
	"saved": "保存しました",
	"ads": "広告"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"state": "状態",
	"ratio": "比率",
	"startingperiod": "始めた期間",
	"expiration": "期限",
	"advancedSettings": "高度な設定",
	"adTimezoneinfo": "曜日はサーバーのタイムゾーンを元に決めるで。",
	"weekdaySunday": "日曜日",
	"weekdayMonday": "月曜日",
	"weekdayTuesday": "火曜日",
	"weekdayWednesday": "水曜日",
	"weekdayThursday": "木曜日",
	"weekdayFriday": "金曜日",
	"weekdaySaturday": "土曜日",
	"publishing": "配信しとる",
	"expired": "期限切れ",
	"saved": "保存したで！",
	"ads": "広告"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"state": "State",
	"ratio": "Ratio",
	"startingperiod": "Start",
	"expiration": "Deadline",
	"advancedSettings": "Advanced settings",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday",
	"publishing": "Publishing",
	"expired": "Expired",
	"saved": "Saved",
	"ads": "Advertisements"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"state": "State",
	"ratio": "Ratio",
	"startingperiod": "Start",
	"expiration": "Deadline",
	"advancedSettings": "Advanced settings",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday",
	"publishing": "Publishing",
	"expired": "Expired",
	"saved": "Saved",
	"ads": "Advertisements"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"state": "상태",
	"ratio": "비율",
	"startingperiod": "시작 기간",
	"expiration": "기한",
	"advancedSettings": "고급 설정",
	"adTimezoneinfo": "요일은 서버의 표준 시간대에 따라 결정됩니다.",
	"weekdaySunday": "일요일",
	"weekdayMonday": "월요일",
	"weekdayTuesday": "화요일",
	"weekdayWednesday": "수요일",
	"weekdayThursday": "목요일",
	"weekdayFriday": "금요일",
	"weekdaySaturday": "토요일",
	"publishing": "배포 중",
	"expired": "만료됨",
	"saved": "저장했습니다",
	"ads": "광고"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"state": "Status",
	"ratio": "Verhouding",
	"startingperiod": "Start",
	"expiration": "Deadline",
	"advancedSettings": "Geavanceerde instellingen",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday",
	"publishing": "Publiceren",
	"expired": "Expired",
	"saved": "Opgeslagen",
	"ads": "Advertenties"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"state": "State",
	"ratio": "Ratio",
	"startingperiod": "Start",
	"expiration": "Deadline",
	"advancedSettings": "Advanced settings",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"weekdaySunday": "Søndag",
	"weekdayMonday": "Mandag",
	"weekdayTuesday": "Tirsdag",
	"weekdayWednesday": "Onsdag",
	"weekdayThursday": "Torsdag",
	"weekdayFriday": "Fredag",
	"weekdaySaturday": "Lørdag",
	"publishing": "Publishing",
	"expired": "Expired",
	"saved": "Lagret",
	"ads": "Annonser"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"state": "Stan",
	"ratio": "Stosunek",
	"startingperiod": "Początek",
	"expiration": "Ankieta kończy się",
	"advancedSettings": "Zaawansowane ustawienia",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"weekdaySunday": "Niedziela",
	"weekdayMonday": "Poniedziałek",
	"weekdayTuesday": "Wtorek",
	"weekdayWednesday": "Środa",
	"weekdayThursday": "Czwartek",
	"weekdayFriday": "Piątek",
	"weekdaySaturday": "Sobota",
	"publishing": "Publikowanie",
	"expired": "Expired",
	"saved": "Zapisano",
	"ads": "Reklamy"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"state": "Estado",
	"ratio": "Ratio",
	"startingperiod": "Data de início",
	"expiration": "Data limite",
	"advancedSettings": "Configurações avançadas",
	"adTimezoneinfo": "O dia da semana é determinado pelo fuso horário do servidor.",
	"weekdaySunday": "Domingo",
	"weekdayMonday": "Segunda-feira",
	"weekdayTuesday": "Terça-feira",
	"weekdayWednesday": "Quarta-feira",
	"weekdayThursday": "Quinta-feira",
	"weekdayFriday": "Sexta-feira",
	"weekdaySaturday": "Sábado",
	"publishing": "Publicando",
	"expired": "Expirado",
	"saved": "Salvo",
	"ads": "Anúncios"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"state": "Состояние",
	"ratio": "Соотношение",
	"startingperiod": "Начальный период",
	"expiration": "Опрос длится",
	"advancedSettings": "Расширенные настройки ",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"weekdaySunday": "Воскресенье",
	"weekdayMonday": "Понедельник",
	"weekdayTuesday": "Вторник",
	"weekdayWednesday": "Среда",
	"weekdayThursday": "Четверг",
	"weekdayFriday": "Пятница",
	"weekdaySaturday": "Суббота",
	"publishing": "Публикация",
	"expired": "Срок действия приглашения истёк",
	"saved": "Сохранено",
	"ads": "Реклама"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"state": "Status",
	"ratio": "Pomer",
	"startingperiod": "Začiatok",
	"expiration": "Ukončiť hlasovanie",
	"advancedSettings": "Rozšírené nastavenia",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"weekdaySunday": "Nedeľa",
	"weekdayMonday": "Pondelok",
	"weekdayTuesday": "Utorok",
	"weekdayWednesday": "Streda",
	"weekdayThursday": "Štvrtok",
	"weekdayFriday": "Piatok",
	"weekdaySaturday": "Sobota",
	"publishing": "Zverejňovanie",
	"expired": "Expired",
	"saved": "Uložené",
	"ads": "Reklamy"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"state": "สถานะ",
	"ratio": "อัตราส่วน",
	"startingperiod": "เริ่มเมื่อ",
	"expiration": "กำหนดเวลา",
	"advancedSettings": "การตั้งค่าขั้นสูง",
	"adTimezoneinfo": "วันในสัปดาห์นี้จะถูกกำหนดจากโซนเวลาของเซิร์ฟเวอร์",
	"weekdaySunday": "วันอาทิตย์",
	"weekdayMonday": "วันจันทร์",
	"weekdayTuesday": "วันอังคาร",
	"weekdayWednesday": "วันพุธ",
	"weekdayThursday": "วันพฤหัสบดี",
	"weekdayFriday": "วันศุกร์",
	"weekdaySaturday": "วันเสาร์",
	"publishing": "กำลังเผยแพร่",
	"expired": "หมดอายุแล้ว",
	"saved": "บันทึกแล้ว",
	"ads": "โฆษณา"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"state": "Durum",
	"ratio": "Oran",
	"startingperiod": "Başla",
	"expiration": "Son tarih",
	"advancedSettings": "Gelişmiş ayarlar",
	"adTimezoneinfo": "Haftanın günü, sunucunun saat diliminden belirlenir.",
	"weekdaySunday": "Pazar",
	"weekdayMonday": "Pazartesi",
	"weekdayTuesday": "Salı",
	"weekdayWednesday": "Çarşamba",
	"weekdayThursday": "Perşembe",
	"weekdayFriday": "Cuma",
	"weekdaySaturday": "Cumartesi",
	"publishing": "Paylaşım",
	"expired": "Süresi dolmuş",
	"saved": "Kaydedildi",
	"ads": "Reklamlar"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"state": "State",
	"ratio": "Ratio",
	"startingperiod": "Start",
	"expiration": "Deadline",
	"advancedSettings": "Advanced settings",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"weekdaySunday": "Sunday",
	"weekdayMonday": "Monday",
	"weekdayTuesday": "Tuesday",
	"weekdayWednesday": "Wednesday",
	"weekdayThursday": "Thursday",
	"weekdayFriday": "Friday",
	"weekdaySaturday": "Saturday",
	"publishing": "Publishing",
	"expired": "Expired",
	"saved": "Saved",
	"ads": "Advertisements"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"state": "Стан",
	"ratio": "Співвідношення",
	"startingperiod": "Початковий період",
	"expiration": "Опитування закінчується",
	"advancedSettings": "Розширені налаштування",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"weekdaySunday": "Неділя",
	"weekdayMonday": "Понеділок",
	"weekdayTuesday": "Вівторок",
	"weekdayWednesday": "Середа",
	"weekdayThursday": "Четвер",
	"weekdayFriday": "П'ятниця",
	"weekdaySaturday": "Субота",
	"publishing": "Публікація",
	"expired": "Термін дії минув",
	"saved": "Збережено",
	"ads": "Реклама"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"state": "Trạng thái",
	"ratio": "Tỷ lệ",
	"startingperiod": "Thời gian bắt đầu\n",
	"expiration": "Thời hạn",
	"advancedSettings": "Cài đặt nâng cao",
	"adTimezoneinfo": "The day of the week is determined from the server's timezone.",
	"weekdaySunday": "Chủ Nhật",
	"weekdayMonday": "Thứ Hai",
	"weekdayTuesday": "Thứ Ba",
	"weekdayWednesday": "Thứ Tư",
	"weekdayThursday": "Thứ Năm",
	"weekdayFriday": "Thứ Sáu",
	"weekdaySaturday": "Thứ Bảy",
	"publishing": "Đang đăng",
	"expired": "Đã hết hạn",
	"saved": "Đã lưu",
	"ads": "Quảng cáo"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"state": "状态",
	"ratio": "比率",
	"startingperiod": "开始时间",
	"expiration": "截止时间",
	"advancedSettings": "高级设置",
	"adTimezoneinfo": "星期几是根据服务器的时区确定的。",
	"weekdaySunday": "星期日",
	"weekdayMonday": "星期一",
	"weekdayTuesday": "星期二",
	"weekdayWednesday": "星期三",
	"weekdayThursday": "星期四",
	"weekdayFriday": "星期五",
	"weekdaySaturday": "星期六",
	"publishing": "投递中",
	"expired": "已过期",
	"saved": "已保存",
	"ads": "广告"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"state": "狀態",
	"ratio": "%",
	"startingperiod": "開始期間",
	"expiration": "期限",
	"advancedSettings": "進階設定",
	"adTimezoneinfo": "星期幾是由伺服器的時區指定的。",
	"weekdaySunday": "星期天",
	"weekdayMonday": "星期一",
	"weekdayTuesday": "星期二",
	"weekdayWednesday": "星期三",
	"weekdayThursday": "星期四",
	"weekdayFriday": "星期五",
	"weekdaySaturday": "星期六",
	"publishing": "發送中",
	"expired": "過期",
	"saved": "已儲存",
	"ads": "廣告"
}
</locale>
