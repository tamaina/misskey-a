<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="zmdxowus">
	<p v-if="choices.length < 2" class="caution">
		<i class="ti ti-alert-triangle"></i>{{ $locale.sfc.pollNoOnlyOneChoice }}
	</p>
	<ul>
		<li v-for="(choice, i) in choices" :key="i">
			<MkInput class="input" small :modelValue="choice" :placeholder="interpolateLocaleParameters($locale.sfc.pollChoiceN, { n: i + 1 })" @update:modelValue="onInput(i, $event)">
			</MkInput>
			<button class="_button" @click="remove(i)">
				<i class="ti ti-x"></i>
			</button>
		</li>
	</ul>
	<MkButton v-if="choices.length < 10" class="add" @click="add">{{ $locale.sfc.add }}</MkButton>
	<MkButton v-else class="add" disabled>{{ $locale.sfc.pollNoMore }}</MkButton>
	<MkSwitch v-model="multiple">{{ $locale.sfc.pollCanMultipleVote }}</MkSwitch>
	<section>
		<div>
			<MkSelect v-model="expiration" :items="expirationDef" small>
				<template #label>{{ $locale.sfc.pollExpiration }}</template>
			</MkSelect>
			<section v-if="expiration === 'at'">
				<MkInput v-model="atDate" small type="date" class="input">
					<template #label>{{ $locale.sfc.pollDeadlineDate }}</template>
				</MkInput>
				<MkInput v-model="atTime" small type="time" class="input">
					<template #label>{{ $locale.sfc.pollDeadlineTime }}</template>
				</MkInput>
			</section>
			<section v-else-if="expiration === 'after'">
				<MkInput v-model="after" small type="number" :min="1" class="input">
					<template #label>{{ $locale.sfc.pollDuration }}</template>
				</MkInput>
				<MkSelect v-model="unit" :items="unitDef" small></MkSelect>
			</section>
		</div>
	</section>
</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { formatDateTimeString } from '@features/ui/frontend/utility/format-time-string.js';
import { addTime } from '@features/ui/frontend/utility/time.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';

export type PollEditorModelValue = {
	expiresAt: number | null;
	expiredAfter: number | null;
	choices: string[];
	multiple: boolean;
};

const props = defineProps<{
	modelValue: PollEditorModelValue;
}>();
const emit = defineEmits<{
	(ev: 'update:modelValue', v: PollEditorModelValue): void;
}>();

const choices = ref(props.modelValue.choices);
const multiple = ref(props.modelValue.multiple);
const {
	model: expiration,
	def: expirationDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.pollInfinite, value: 'infinite' },
		{ label: $locale.value.sfc.pollAt, value: 'at' },
		{ label: $locale.value.sfc.pollAfter, value: 'after' },
	],
	initialValue: 'infinite',
});
const atDate = ref(formatDateTimeString(addTime(new Date(), 1, 'day'), 'yyyy-MM-dd'));
const atTime = ref('00:00');
const after = ref(0);
const {
	model: unit,
	def: unitDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.timeSecond, value: 'second' },
		{ label: $locale.value.sfc.timeMinute, value: 'minute' },
		{ label: $locale.value.sfc.timeHour, value: 'hour' },
		{ label: $locale.value.sfc.timeDay, value: 'day' },
	],
	initialValue: 'second',
});

if (props.modelValue.expiresAt) {
	expiration.value = 'at';
	const expiresAt = new Date(props.modelValue.expiresAt);
	atDate.value = formatDateTimeString(expiresAt, 'yyyy-MM-dd');
	atTime.value = formatDateTimeString(expiresAt, 'HH:mm');
} else if (typeof props.modelValue.expiredAfter === 'number') {
	expiration.value = 'after';
	after.value = props.modelValue.expiredAfter / 1000;
} else {
	expiration.value = 'infinite';
}

function onInput(i: number, value: string) {
	choices.value[i] = value;
}

function add() {
	choices.value.push('');
	// TODO
	// nextTick(() => {
	//   (this.$refs.choices as any).childNodes[this.choices.length - 1].childNodes[0].focus();
	// });
}

function remove(i: number) {
	choices.value = choices.value.filter((_, _i) => _i !== i);
}

function get(): PollEditorModelValue {
	const calcAt = () => {
		return new Date(`${atDate.value} ${atTime.value}`).getTime();
	};

	const calcAfter = () => {
		let base = parseInt(after.value.toString());
		switch (unit.value) {
			// @ts-expect-error fallthrough
			case 'day': base *= 24;
			// @ts-expect-error fallthrough
			case 'hour': base *= 60;
			// @ts-expect-error fallthrough
			case 'minute': base *= 60;
			// eslint-disable-next-line no-fallthrough
			case 'second': return base *= 1000;
			default: return null;
		}
	};

	return {
		choices: choices.value,
		multiple: multiple.value,
		expiresAt: expiration.value === 'at' ? calcAt() : null,
		expiredAfter: expiration.value === 'after' ? calcAfter() : null,
	};
}

watch([choices, multiple, expiration, atDate, atTime, after, unit], () => emit('update:modelValue', get()), {
	deep: true,
});
</script>

<style lang="scss" scoped>
.zmdxowus {
	padding: 8px 16px;

	> .caution {
		margin: 0 0 8px 0;
		font-size: 0.8em;
		color: #f00;

		> i {
			margin-right: 4px;
		}
	}

	> ul {
		display: block;
		margin: 0;
		padding: 0;
		list-style: none;

		> li {
			display: flex;
			margin: 8px 0;
			padding: 0;
			width: 100%;

			> .input {
				flex: 1;
			}

			> button {
				width: 32px;
				padding: 4px 0;
			}
		}
	}

	> .add {
		margin: 8px 0;
		z-index: 1;
	}

	> section {
		margin: 16px 0 0 0;

		> div {
			margin: 0 8px;
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			gap: 12px;

			&:last-child {
				flex: 1 0 auto;

				> div {
					flex-grow: 1;
				}

				> section {
					// MAGIC: Prevent div above from growing unless wrapped to its own line
					flex-grow: 9999;
					align-items: end;
					display: flex;
					gap: 4px;

					> .input {
						flex: 1 1 auto;
					}
				}
			}
		}
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"pollNoOnlyOneChoice": "تحتاج إلى خيارَين على الأقل",
	"pollChoiceN": "الخيار {n}",
	"add": "إضافة",
	"pollNoMore": "لا يمكنك إضافة خيارات أخرى",
	"pollCanMultipleVote": "السماح بالإجابات المتعددة",
	"pollExpiration": "ينتهي استطلاع الرأي في",
	"pollDeadlineDate": "تاريخ الانتهاء",
	"pollDeadlineTime": "سا",
	"pollDuration": "المدة",
	"pollInfinite": "أبدًا",
	"pollAt": "تاريخ الإنتهاء",
	"pollAfter": "ينتهي بعد…",
	"timeSecond": "ثا",
	"timeMinute": "د",
	"timeHour": "سا",
	"timeDay": "ي"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"pollNoOnlyOneChoice": "Es necessita escollir dues opcions com a mínim ",
	"pollChoiceN": "Opció {n}",
	"add": "Afegir",
	"pollNoMore": "No pots afegir més opcions",
	"pollCanMultipleVote": "Permetre escollir diferents opcions",
	"pollExpiration": "Finalitza el",
	"pollDeadlineDate": "Data de finalització ",
	"pollDeadlineTime": "Hor(a)(es)",
	"pollDuration": "Duració ",
	"pollInfinite": "Mai",
	"pollAt": "Finalitza en...",
	"pollAfter": "Finalitza després...",
	"timeSecond": "Segon(s)",
	"timeMinute": "Minut(s)",
	"timeHour": "Hor(a)(es)",
	"timeDay": "Di(a)(es)"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"pollNoOnlyOneChoice": "Jsou zapotřebí alespoň dvě možnosti",
	"pollChoiceN": "Volba {n}",
	"add": "Přidat",
	"pollNoMore": "Více už přidat nemůžete",
	"pollCanMultipleVote": "Umožnit výběr více možností",
	"pollExpiration": "Ukončení ankety",
	"pollDeadlineDate": "Datum ukončení",
	"pollDeadlineTime": "Hodin",
	"pollDuration": "Trvání",
	"pollInfinite": "Nikdy",
	"pollAt": "Ukončit v",
	"pollAfter": "Ukončit po",
	"timeSecond": "Sekund",
	"timeMinute": "Minut",
	"timeHour": "Hodin",
	"timeDay": "Dnů"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"pollNoOnlyOneChoice": "At least two choices are needed",
	"pollChoiceN": "Choice {n}",
	"add": "Add",
	"pollNoMore": "You cannot add more choices",
	"pollCanMultipleVote": "Allow selecting multiple choices",
	"pollExpiration": "End poll",
	"pollDeadlineDate": "End date",
	"pollDeadlineTime": "Time",
	"pollDuration": "Duration",
	"pollInfinite": "Never",
	"pollAt": "End at...",
	"pollAfter": "End after...",
	"timeSecond": "Second(s)",
	"timeMinute": "Minute(s)",
	"timeHour": "Hour(s)",
	"timeDay": "Day(s)"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"pollNoOnlyOneChoice": "Es müssen mindestens zwei Antwortmöglichkeiten vorhanden sein",
	"pollChoiceN": "Auswahl {n}",
	"add": "Hinzufügen",
	"pollNoMore": "Du kannst keine weiteren Auswahlmöglichkeiten hinzufügen",
	"pollCanMultipleVote": "Auswahl mehrerer Antworten erlauben",
	"pollExpiration": "Abstimmung beenden",
	"pollDeadlineDate": "Enddatum",
	"pollDeadlineTime": "Zeit",
	"pollDuration": "Dauer",
	"pollInfinite": "Nie",
	"pollAt": "Beenden am …",
	"pollAfter": "Beenden nach …",
	"timeSecond": "Sekunde(n)",
	"timeMinute": "Minute(n)",
	"timeHour": "Stunde(n)",
	"timeDay": "Tag(en)"
}
</locale>

<locale lang="json" locale="en-US">
{
	"pollNoOnlyOneChoice": "At least two choices are needed",
	"pollChoiceN": "Choice {n}",
	"add": "Add",
	"pollNoMore": "You cannot add more choices",
	"pollCanMultipleVote": "Allow selecting multiple choices",
	"pollExpiration": "End poll",
	"pollDeadlineDate": "End date",
	"pollDeadlineTime": "Time",
	"pollDuration": "Duration",
	"pollInfinite": "Never",
	"pollAt": "End at...",
	"pollAfter": "End after...",
	"timeSecond": "Second(s)",
	"timeMinute": "Minute(s)",
	"timeHour": "Hour(s)",
	"timeDay": "Day(s)"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"pollNoOnlyOneChoice": "Se necesitan al menos 2 opciones",
	"pollChoiceN": "Opción {n}",
	"add": "Agregar",
	"pollNoMore": "No se pueden agregar más",
	"pollCanMultipleVote": "Permitir seleccionar varias opciones",
	"pollExpiration": "Termina el",
	"pollDeadlineDate": "Fecha de fin",
	"pollDeadlineTime": "Horas",
	"pollDuration": "Duración",
	"pollInfinite": "Sin límite de tiempo",
	"pollAt": "Elegir fecha y hora",
	"pollAfter": "Elegir lapso de tiempo",
	"timeSecond": "Segundos",
	"timeMinute": "Minutos",
	"timeHour": "Horas",
	"timeDay": "Días"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"pollNoOnlyOneChoice": "Au moins 2 réponses nécéssaires",
	"pollChoiceN": "Choix {n}",
	"add": "Ajouter",
	"pollNoMore": "Vous ne pouvez pas en ajouter davantage",
	"pollCanMultipleVote": "Autoriser le multi-choix",
	"pollExpiration": "Fin du sondage",
	"pollDeadlineDate": "Date de fin",
	"pollDeadlineTime": "Heure de fin",
	"pollDuration": "Durée",
	"pollInfinite": "Illimité",
	"pollAt": "Choisir une date",
	"pollAfter": "Choisir la durée",
	"timeSecond": "s",
	"timeMinute": "min",
	"timeHour": "h",
	"timeDay": "j"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"pollNoOnlyOneChoice": "Dibutuhkan sedikitnya dua pilihan",
	"pollChoiceN": "Pilihan {n}",
	"add": "Tambahkan",
	"pollNoMore": "Kamu tidak dapat menambahkan pilihan lagi",
	"pollCanMultipleVote": "Bolehkan memilih banyak",
	"pollExpiration": "Batas akhir",
	"pollDeadlineDate": "Tanggal batas akhir",
	"pollDeadlineTime": "jam",
	"pollDuration": "Durasi",
	"pollInfinite": "Selamanya",
	"pollAt": "Berakhir pada...",
	"pollAfter": "Berakhir setelah...",
	"timeSecond": "detik",
	"timeMinute": "menit",
	"timeHour": "jam",
	"timeDay": "hari"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"pollNoOnlyOneChoice": "Sono necessarie almeno 2 risposte",
	"pollChoiceN": "Opzione {n}",
	"add": "Aggiungi",
	"pollNoMore": "Hai raggiunto il limite di opzioni.",
	"pollCanMultipleVote": "Possibilità di risposte multiple",
	"pollExpiration": "Scadenza",
	"pollDeadlineDate": "Data di scadenza",
	"pollDeadlineTime": "Ora di scadenza",
	"pollDuration": "Durata",
	"pollInfinite": "Non scade",
	"pollAt": "Seleziona data",
	"pollAfter": "Seleziona durata",
	"timeSecond": "s",
	"timeMinute": "min",
	"timeHour": "ore",
	"timeDay": "giorni"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"pollNoOnlyOneChoice": "選択肢は最低2つ必要です",
	"pollChoiceN": "選択肢{n}",
	"add": "追加",
	"pollNoMore": "これ以上追加できません",
	"pollCanMultipleVote": "複数回答可",
	"pollExpiration": "期限",
	"pollDeadlineDate": "期日",
	"pollDeadlineTime": "時間",
	"pollDuration": "期間",
	"pollInfinite": "無期限",
	"pollAt": "日時指定",
	"pollAfter": "経過指定",
	"timeSecond": "秒",
	"timeMinute": "分",
	"timeHour": "時間",
	"timeDay": "日"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"pollNoOnlyOneChoice": "選択肢は最低2つ必要やで",
	"pollChoiceN": "選択肢{n}",
	"add": "増やす",
	"pollNoMore": "これ以上追加でけへん",
	"pollCanMultipleVote": "複数回答可",
	"pollExpiration": "期限",
	"pollDeadlineDate": "期日",
	"pollDeadlineTime": "時間",
	"pollDuration": "期間",
	"pollInfinite": "無期限",
	"pollAt": "日時指定",
	"pollAfter": "経過指定",
	"timeSecond": "秒",
	"timeMinute": "分",
	"timeHour": "時間",
	"timeDay": "日"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"pollNoOnlyOneChoice": "At least two choices are needed",
	"pollChoiceN": "Choice {n}",
	"add": "Add",
	"pollNoMore": "You cannot add more choices",
	"pollCanMultipleVote": "Allow selecting multiple choices",
	"pollExpiration": "End poll",
	"pollDeadlineDate": "End date",
	"pollDeadlineTime": "Time",
	"pollDuration": "Duration",
	"pollInfinite": "Never",
	"pollAt": "End at...",
	"pollAfter": "End after...",
	"timeSecond": "Second(s)",
	"timeMinute": "Minute(s)",
	"timeHour": "Hour(s)",
	"timeDay": "Day(s)"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"pollNoOnlyOneChoice": "At least two choices are needed",
	"pollChoiceN": "Choice {n}",
	"add": "Add",
	"pollNoMore": "You cannot add more choices",
	"pollCanMultipleVote": "Allow selecting multiple choices",
	"pollExpiration": "End poll",
	"pollDeadlineDate": "End date",
	"pollDeadlineTime": "Time",
	"pollDuration": "Duration",
	"pollInfinite": "Never",
	"pollAt": "End at...",
	"pollAfter": "End after...",
	"timeSecond": "Second(s)",
	"timeMinute": "Minute(s)",
	"timeHour": "Hour(s)",
	"timeDay": "Day(s)"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"pollNoOnlyOneChoice": "투표 항목이 최소 2개 필요합니다",
	"pollChoiceN": "선택지 {n}",
	"add": "추가",
	"pollNoMore": "더 이상 추가할 수 없습니다",
	"pollCanMultipleVote": "복수 응답 허용",
	"pollExpiration": "투표 기한",
	"pollDeadlineDate": "기한",
	"pollDeadlineTime": "시간",
	"pollDuration": "기간",
	"pollInfinite": "무기한",
	"pollAt": "일시 지정",
	"pollAfter": "기간 지정",
	"timeSecond": "초",
	"timeMinute": "분",
	"timeHour": "시간",
	"timeDay": "일"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"pollNoOnlyOneChoice": "At least two choices are needed",
	"pollChoiceN": "Choice {n}",
	"add": "Toevoegen",
	"pollNoMore": "You cannot add more choices",
	"pollCanMultipleVote": "Allow selecting multiple choices",
	"pollExpiration": "End poll",
	"pollDeadlineDate": "End date",
	"pollDeadlineTime": "Time",
	"pollDuration": "Duration",
	"pollInfinite": "Never",
	"pollAt": "End at...",
	"pollAfter": "End after...",
	"timeSecond": "Second(s)",
	"timeMinute": "Minute(s)",
	"timeHour": "Hour(s)",
	"timeDay": "Day(s)"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"pollNoOnlyOneChoice": "Trenger minst to valger.",
	"pollChoiceN": "Valg {n}",
	"add": "Legg til",
	"pollNoMore": "Du kan ikke legge til flere.",
	"pollCanMultipleVote": "Allow selecting multiple choices",
	"pollExpiration": "End poll",
	"pollDeadlineDate": "End date",
	"pollDeadlineTime": "Timer",
	"pollDuration": "Duration",
	"pollInfinite": "Never",
	"pollAt": "End at...",
	"pollAfter": "End after...",
	"timeSecond": "Sekunder",
	"timeMinute": "Minutter",
	"timeHour": "Timer",
	"timeDay": "Dager"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"pollNoOnlyOneChoice": "Wymagane są przynajmniej dwie opcje",
	"pollChoiceN": "Opcja {n}",
	"add": "Dodaj",
	"pollNoMore": "Nie możesz dodać więcej opcji",
	"pollCanMultipleVote": "Pozwól na wiele odpowiedzi",
	"pollExpiration": "Ankieta kończy się",
	"pollDeadlineDate": "Data zakończenia",
	"pollDeadlineTime": "godz.",
	"pollDuration": "Czas trwania",
	"pollInfinite": "Nigdy",
	"pollAt": "Zakończ o…",
	"pollAfter": "Zakończ po…",
	"timeSecond": "sekunda",
	"timeMinute": "minuta",
	"timeHour": "godz.",
	"timeDay": "dzień"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"pollNoOnlyOneChoice": "São necessárias, no mínimo, duas escolhas",
	"pollChoiceN": "Escolha {n}",
	"add": "Adicionar",
	"pollNoMore": "Você não pode adicionar mais escolhas",
	"pollCanMultipleVote": "Permitir múltipla seleção",
	"pollExpiration": "Encerrar enquete",
	"pollDeadlineDate": "Data de término",
	"pollDeadlineTime": "Tempo",
	"pollDuration": "Duração",
	"pollInfinite": "Nunca",
	"pollAt": "Terminar em...",
	"pollAfter": "Terminar após...",
	"timeSecond": "Segundo(s)",
	"timeMinute": "Minuto(s)",
	"timeHour": "Hora(s)",
	"timeDay": "Dia(s)"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"pollNoOnlyOneChoice": "Нужно хотя бы два варианта.",
	"pollChoiceN": "Выбор {n}",
	"add": "Добавить",
	"pollNoMore": "Больше вариантов добавить нельзя",
	"pollCanMultipleVote": "Можно выбрать несколько вариантов",
	"pollExpiration": "Опрос длится",
	"pollDeadlineDate": "Дата окончания",
	"pollDeadlineTime": "Время",
	"pollDuration": "Длительность",
	"pollInfinite": "вечно",
	"pollAt": "до указанной даты",
	"pollAfter": "заданное время",
	"timeSecond": "с",
	"timeMinute": "мин",
	"timeHour": "ч",
	"timeDay": "сут"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"pollNoOnlyOneChoice": "Treba aspoň dve voľby",
	"pollChoiceN": "Voľba {n}",
	"add": "Pridať",
	"pollNoMore": "Nemôžete pridať viac volieb",
	"pollCanMultipleVote": "Povoliť hlasovať za viac volieb.",
	"pollExpiration": "Ukončiť hlasovanie",
	"pollDeadlineDate": "Dátum ukončenia",
	"pollDeadlineTime": "hod",
	"pollDuration": "Trvanie",
	"pollInfinite": "Nikdy",
	"pollAt": "Konkrétny dátum...",
	"pollAfter": "Ukončiť po...",
	"timeSecond": "s",
	"timeMinute": "min",
	"timeHour": "hod",
	"timeDay": "dní"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"pollNoOnlyOneChoice": "จำเป็นต้องมีอย่างน้อยสองตัวเลือก",
	"pollChoiceN": "ตัวเลือกที่ {n}",
	"add": "เพิ่ม",
	"pollNoMore": "เพิ่มตัวเลือกอีกไม่ได้แล้ว",
	"pollCanMultipleVote": "สามารถตอบได้หลายคำตอบ",
	"pollExpiration": "สิ้นสุดโพล",
	"pollDeadlineDate": "วันสิ้นสุด",
	"pollDeadlineTime": "เวลา",
	"pollDuration": "ระยะเวลา",
	"pollInfinite": "ไม่กำหนดระยะเวลา",
	"pollAt": "ระบุวันเวลา",
	"pollAfter": "ระบุระยะเวลา",
	"timeSecond": "วินาที",
	"timeMinute": "นาที",
	"timeHour": "ชั่วโมง",
	"timeDay": "วัน"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"pollNoOnlyOneChoice": "En az iki seçenek gereklidir.",
	"pollChoiceN": "Seçim {n}",
	"add": "Ekle",
	"pollNoMore": "Daha fazla seçenek ekleyemezsin.",
	"pollCanMultipleVote": "Birden fazla seçenek seçilmesine izin ver",
	"pollExpiration": "Anketi sonlandır",
	"pollDeadlineDate": "Bitiş tarihi",
	"pollDeadlineTime": "Zaman",
	"pollDuration": "Süre",
	"pollInfinite": "Asla",
	"pollAt": "Şurada bitir...",
	"pollAfter": "Sonrasında bitir...",
	"timeSecond": "Saniye(ler)",
	"timeMinute": "Dakika(lar)",
	"timeHour": "Saat(ler)",
	"timeDay": "Gün(ler)"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"pollNoOnlyOneChoice": "At least two choices are needed",
	"pollChoiceN": "Choice {n}",
	"add": "Add",
	"pollNoMore": "You cannot add more choices",
	"pollCanMultipleVote": "Allow selecting multiple choices",
	"pollExpiration": "End poll",
	"pollDeadlineDate": "End date",
	"pollDeadlineTime": "Time",
	"pollDuration": "Duration",
	"pollInfinite": "Never",
	"pollAt": "End at...",
	"pollAfter": "End after...",
	"timeSecond": "Second(s)",
	"timeMinute": "Minute(s)",
	"timeHour": "Hour(s)",
	"timeDay": "Day(s)"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"pollNoOnlyOneChoice": "Потрібні принаймні два варіанти.",
	"pollChoiceN": "Варіант {n}",
	"add": "Додати",
	"pollNoMore": "Більше варіантів додати не можна",
	"pollCanMultipleVote": "Можна вибрати кілька варіантів",
	"pollExpiration": "Опитування закінчується",
	"pollDeadlineDate": "Дата закінчення",
	"pollDeadlineTime": "г",
	"pollDuration": "Тривалість",
	"pollInfinite": "Ніколи",
	"pollAt": "На даті...",
	"pollAfter": "Через...",
	"timeSecond": "с",
	"timeMinute": "х",
	"timeHour": "г",
	"timeDay": "д"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"pollNoOnlyOneChoice": "Cần ít nhất hai lựa chọn.",
	"pollChoiceN": "Lựa chọn {n}",
	"add": "Thêm",
	"pollNoMore": "Bạn không thể thêm lựa chọn",
	"pollCanMultipleVote": "Cho phép chọn nhiều lựa chọn",
	"pollExpiration": "Thời hạn",
	"pollDeadlineDate": "Ngày kết thúc",
	"pollDeadlineTime": "giờ",
	"pollDuration": "Thời hạn",
	"pollInfinite": "Vĩnh viễn",
	"pollAt": "Kết thúc vào...",
	"pollAfter": "Kết thúc sau...",
	"timeSecond": "s",
	"timeMinute": "phút",
	"timeHour": "giờ",
	"timeDay": "ngày"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"pollNoOnlyOneChoice": "需要至少两个选项",
	"pollChoiceN": "选项{n}",
	"add": "添加",
	"pollNoMore": "无法再添加更多了",
	"pollCanMultipleVote": "允许多选",
	"pollExpiration": "截止时间",
	"pollDeadlineDate": "截止日期",
	"pollDeadlineTime": "时间",
	"pollDuration": "期限",
	"pollInfinite": "永久",
	"pollAt": "指定日期",
	"pollAfter": "指定时长",
	"timeSecond": "秒",
	"timeMinute": "分钟",
	"timeHour": "小时",
	"timeDay": "天"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"pollNoOnlyOneChoice": "需要至少兩個選項。",
	"pollChoiceN": "選項 {n}",
	"add": "新增",
	"pollNoMore": "沒辦法再添加選項了",
	"pollCanMultipleVote": "允許複選",
	"pollExpiration": "期限",
	"pollDeadlineDate": "截止日期",
	"pollDeadlineTime": "小時",
	"pollDuration": "時長",
	"pollInfinite": "無期限",
	"pollAt": "結束時間",
	"pollAfter": "指定時效",
	"timeSecond": "秒",
	"timeMinute": "分鐘",
	"timeHour": "小時",
	"timeDay": "日"
}
</locale>
