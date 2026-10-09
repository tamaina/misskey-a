<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :preferType="'dialog'" :zPriority="'high'" @click="done(true)" @closed="emit('closed')" @esc="cancel()">
	<div :class="$style.root">
		<div v-if="icon" :class="$style.icon">
			<i :class="icon"></i>
		</div>
		<div
			v-else-if="!input && !select"
			:class="[$style.icon]"
		>
			<MkSystemIcon v-if="type === 'success'" :class="$style.iconInner" style="width: 45px;" type="success"/>
			<MkSystemIcon v-else-if="type === 'error'" :class="$style.iconInner" style="width: 45px;" type="error"/>
			<MkSystemIcon v-else-if="type === 'warning'" :class="$style.iconInner" style="width: 45px;" type="warn"/>
			<MkSystemIcon v-else-if="type === 'info'" :class="$style.iconInner" style="width: 45px;" type="info"/>
			<MkSystemIcon v-else-if="type === 'question'" :class="$style.iconInner" style="width: 45px;" type="question"/>
			<MkLoading v-else-if="type === 'waiting'" :class="$style.iconInner" :em="true"/>
		</div>
		<header v-if="title" :class="$style.title" class="_selectable"><Mfm :text="title"/></header>
		<div v-if="text" :class="$style.text" class="_selectable"><Mfm :text="text"/></div>
		<MkInput v-if="input" v-model="inputValue" autofocus :type="input.type || 'text'" :placeholder="input.placeholder || undefined" :autocomplete="input.autocomplete" @keydown="onInputKeydown">
			<template v-if="input.type === 'password'" #prefix><i class="ti ti-lock"></i></template>
			<template #caption>
				<span v-if="okButtonDisabledReason === 'charactersExceeded'" v-text="interpolateLocaleParameters($locale.sfc.charactersExceeded, { current: (inputValue as string)?.length ?? 0, max: input.maxLength ?? 'NaN' })"></span>
				<span v-else-if="okButtonDisabledReason === 'charactersBelow'" v-text="interpolateLocaleParameters($locale.sfc.charactersBelow, { current: (inputValue as string)?.length ?? 0, min: input.minLength ?? 'NaN' })"></span>
			</template>
		</MkInput>
		<MkSelect v-if="select" v-model="selectedValue" :items="selectDef" autofocus></MkSelect>
		<div v-if="(showOkButton || showCancelButton) && !actions" :class="$style.buttons">
			<MkButton v-if="showOkButton" data-testid="modal-dialog-ok" inline primary rounded :autofocus="!input && !select" :disabled="okButtonDisabledReason != null" @click="ok">{{ okText ?? ((showCancelButton || input || select) ? $locale.sfc.ok : $locale.sfc.gotIt) }}</MkButton>
			<MkButton v-if="showCancelButton || input || select" data-testid="modal-dialog-cancel" inline rounded @click="cancel">{{ cancelText ?? $locale.sfc.cancel }}</MkButton>
		</div>
		<div v-if="actions" :class="$style.buttons">
			<MkButton v-for="action in actions" :key="action.text" inline rounded :primary="action.primary" :danger="action.danger" @click="() => { action.callback(); modal?.close(); }">{{ action.text }}</MkButton>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts">
export type Result = string | number | true | null;
export type MkDialogReturnType<T = Result> = { canceled: true, result: undefined } | { canceled: false, result: T };
</script>

<script lang="ts" setup>
import { ref, useTemplateRef, computed } from 'vue';
import MkModal from '@features/ui/frontend/components/MkModal.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import type { MkSelectItem } from '@features/ui/frontend/components/MkSelect.vue';
import type { OptionValue } from '@features/ui/frontend/types/option-value.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';

type Input = {
	type?: 'text' | 'number' | 'password' | 'email' | 'url' | 'date' | 'time' | 'search' | 'datetime-local';
	placeholder?: string | null;
	autocomplete?: string;
	default: string | number | null;
	minLength?: number;
	maxLength?: number;
};

type Select = {
	items: MkSelectItem[];
	default: OptionValue | null;
};

const props = withDefaults(defineProps<{
	type?: 'success' | 'error' | 'warning' | 'info' | 'question' | 'waiting';
	title?: string;
	text?: string;
	input?: Input;
	select?: Select;
	icon?: string;
	actions?: {
		text: string;
		primary?: boolean,
		danger?: boolean,
		callback: (...args: unknown[]) => void;
	}[];
	showOkButton?: boolean;
	showCancelButton?: boolean;
	cancelableByBgClick?: boolean;
	okText?: string;
	cancelText?: string;
}>(), {
	type: 'info',
	showOkButton: true,
	showCancelButton: false,
	cancelableByBgClick: true,
});

const emit = defineEmits<{
	(ev: 'done', v: MkDialogReturnType): void;
	(ev: 'closed'): void;
}>();

const modal = useTemplateRef('modal');

const inputValue = ref<string | number | null>(props.input?.default ?? null);

const okButtonDisabledReason = computed<null | 'charactersExceeded' | 'charactersBelow'>(() => {
	if (props.input) {
		if (props.input.minLength) {
			if (inputValue.value == null || (inputValue.value as string).length < props.input.minLength) {
				return 'charactersBelow';
			}
		}
		if (props.input.maxLength) {
			if (inputValue.value && (inputValue.value as string).length > props.input.maxLength) {
				return 'charactersExceeded';
			}
		}
	}

	return null;
});

const {
	def: selectDef,
	model: selectedValue,
} = useMkSelect({
	items: computed(() => props.select?.items ?? []),
	initialValue: props.select?.default ?? null,
});

// overload function を使いたいので lint エラーを無視する
function done(canceled: true): void;
function done(canceled: false, result: Result): void; // eslint-disable-line no-redeclare

function done(canceled: boolean, result?: Result): void { // eslint-disable-line no-redeclare
	emit('done', { canceled, result } as MkDialogReturnType);
	modal.value?.close();
}

async function ok() {
	if (!props.showOkButton) return;

	const result =
		props.input ? inputValue.value :
		props.select ? selectedValue.value :
		true;
	done(false, result);
}

function cancel() {
	done(true);
}

/*
function onBgClick() {
	if (props.cancelableByBgClick) cancel();
}
*/
function onInputKeydown(evt: KeyboardEvent) {
	if (evt.key === 'Enter' && okButtonDisabledReason.value === null) {
		evt.preventDefault();
		evt.stopPropagation();
		ok();
	}
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	margin: auto;
	padding: 32px;
	min-width: 320px;
	max-width: 480px;
	box-sizing: border-box;
	text-align: center;
	background: var(--MI_THEME-panel);
	border-radius: 16px;
}

.icon {
	font-size: 24px;

	& + .title {
		margin-top: 8px;
	}
}

.iconInner {
	display: block;
	margin: 0 auto;
}

.title {
	margin: 0 0 8px 0;
	font-weight: bold;
	font-size: 1.1em;

	& + .text {
		margin-top: 8px;
	}
}

.text {
	margin: 16px 0 0 0;
}

.buttons {
	margin-top: 16px;
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: center;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"charactersExceeded": "You've exceeded the maximum character limit! Currently at {current} of {max}.",
	"charactersBelow": "You're below the minimum character limit! Currently at {current} of {min}.",
	"ok": " حسناً",
	"gotIt": "فهِمت",
	"cancel": " إلغاء"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"charactersExceeded": "Has arribat al màxim de caràcters! Actualment és {current} de {max}",
	"charactersBelow": "Ets per sota del mínim de caràcters! Actualment és {current} de {min}",
	"ok": "OK",
	"gotIt": "D'acord ",
	"cancel": "Cancel·lar"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"charactersExceeded": "Překročili jste maximální počet znaků! V současné době je na hodnotě {current} z {max}.",
	"charactersBelow": "Nedosahujete minimálního limitu znaků! V současné době je na {current} z {min}.",
	"ok": "Potvrdit",
	"gotIt": "Rozumím!",
	"cancel": "Zrušit"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"charactersExceeded": "You've exceeded the maximum character limit! Currently at {current} of {max}.",
	"charactersBelow": "You're below the minimum character limit! Currently at {current} of {min}.",
	"ok": "OK",
	"gotIt": "Got it!",
	"cancel": "Cancel"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"charactersExceeded": "Maximallänge überschritten! Momentan {current} von {max}",
	"charactersBelow": "Minimallänge unterschritten! Momentan {current} von {min}",
	"ok": "OK",
	"gotIt": "Verstanden!",
	"cancel": "Abbrechen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"charactersExceeded": "You've exceeded the maximum character limit! Currently at {current} of {max}.",
	"charactersBelow": "You're below the minimum character limit! Currently at {current} of {min}.",
	"ok": "OK",
	"gotIt": "Got it!",
	"cancel": "Cancel"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"charactersExceeded": "¡Has excedido el límite de caracteres! Actualmente {current} de {max}.",
	"charactersBelow": "¡Estás por debajo del límite de caracteres! Actualmente {current} de {min}.",
	"ok": "OK",
	"gotIt": "¡Lo tengo!",
	"cancel": "Cancelar"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"charactersExceeded": "You've exceeded the maximum character limit! Currently at {current} of {max}.",
	"charactersBelow": "You're below the minimum character limit! Currently at {current} of {min}.",
	"ok": "OK",
	"gotIt": "J’ai compris !",
	"cancel": "Annuler"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"charactersExceeded": "Kamu telah melebihi batas karakter maksimum! Saat ini pada {current} dari {max}.",
	"charactersBelow": "Kamu berada di bawah batas minimum karakter! Saat ini pada {current} dari {min}.",
	"ok": "Oke",
	"gotIt": "Mengerti",
	"cancel": "Batalkan"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"charactersExceeded": "Hai superato il limite di {max} caratteri! ({current})",
	"charactersBelow": "Sei al di sotto del minimo di {min} caratteri!  ({current})",
	"ok": "OK",
	"gotIt": "ok!",
	"cancel": "Annulla"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"charactersExceeded": "最大文字数を超えています！ 現在 {current} / 制限 {max}",
	"charactersBelow": "最小文字数を下回っています！ 現在 {current} / 制限 {min}",
	"ok": "OK",
	"gotIt": "わかった",
	"cancel": "キャンセル"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"charactersExceeded": "最大の文字数を上回っとるで！今は {current} / 最大でも {max}",
	"charactersBelow": "最小の文字数を下回っとるで！今は {current} / 最低でも {min}",
	"ok": "ええで",
	"gotIt": "ほい",
	"cancel": "やめる"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"charactersExceeded": "You've exceeded the maximum character limit! Currently at {current} of {max}.",
	"charactersBelow": "You're below the minimum character limit! Currently at {current} of {min}.",
	"ok": "IH",
	"gotIt": "Got it!",
	"cancel": "Cancel"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"charactersExceeded": "You've exceeded the maximum character limit! Currently at {current} of {max}.",
	"charactersBelow": "You're below the minimum character limit! Currently at {current} of {min}.",
	"ok": "ಸರಿ",
	"gotIt": "ಅರ್ಥವಾಯಿತು!",
	"cancel": "ರದ್ದು"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"charactersExceeded": "최대 글자수를 초과하였습니다! 현재 {current} / 최대 {max}",
	"charactersBelow": "최소 글자수 미만입니다! 현재 {current} / 최소 {min}",
	"ok": "확인",
	"gotIt": "알겠어요",
	"cancel": "취소"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"charactersExceeded": "You've exceeded the maximum character limit! Currently at {current} of {max}.",
	"charactersBelow": "You're below the minimum character limit! Currently at {current} of {min}.",
	"ok": "Ok",
	"gotIt": "Begrepen",
	"cancel": "Annuleren"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"charactersExceeded": "You've exceeded the maximum character limit! Currently at {current} of {max}.",
	"charactersBelow": "You're below the minimum character limit! Currently at {current} of {min}.",
	"ok": "OK",
	"gotIt": "Skjønner",
	"cancel": "Avbryt"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"charactersExceeded": "You've exceeded the maximum character limit! Currently at {current} of {max}.",
	"charactersBelow": "You're below the minimum character limit! Currently at {current} of {min}.",
	"ok": "OK",
	"gotIt": "Rozumiem!",
	"cancel": "Anuluj"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"charactersExceeded": "Você excedeu o limite de caracteres! Atualmente em {current} de {max}.",
	"charactersBelow": "Você está abaixo do limite mínimo de caracteres! Atualmente em {current} of {min}.",
	"ok": "OK",
	"gotIt": "Entendi",
	"cancel": "Cancelar"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"charactersExceeded": "Превышено максимальное количество символов! У вас {current} / из   {max}",
	"charactersBelow": "Это ниже минимального количества символов! У вас {current} / из {min}",
	"ok": "Подтвердить",
	"gotIt": "Ясно!",
	"cancel": "Отмена"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"charactersExceeded": "You've exceeded the maximum character limit! Currently at {current} of {max}.",
	"charactersBelow": "You're below the minimum character limit! Currently at {current} of {min}.",
	"ok": "OK",
	"gotIt": "Rozumiem!",
	"cancel": "Zrušiť"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"charactersExceeded": "คุณกำลังมีตัวอักขระเกินขีดจำกัดสูงสุดแล้วนะ! ปัจจุบันอยู่ที่ {current} จาก {max}",
	"charactersBelow": "คุณกำลังใช้อักขระต่ำกว่าขีดจำกัดขั้นต่ำเลยนะ! ปัจจุบันอยู่ที่ {current} จาก {min}",
	"ok": "ตกลง",
	"gotIt": "เข้าใจแล้ว !",
	"cancel": "ยกเลิก"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"charactersExceeded": "Maksimum karakter sınırını aştınız! Şu anda {current} karakterde {max} karakterlik sınırın {current} karakterinde bulunuyorsunuz.",
	"charactersBelow": "You're below the minimum character limit! Currently at {current} of {min}.",
	"ok": "Tamam",
	"gotIt": "Anladım!",
	"cancel": "Vazgeç"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"charactersExceeded": "You've exceeded the maximum character limit! Currently at {current} of {max}.",
	"charactersBelow": "You're below the minimum character limit! Currently at {current} of {min}.",
	"ok": "ماقۇل",
	"gotIt": "Got it!",
	"cancel": "Cancel"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"charactersExceeded": "You've exceeded the maximum character limit! Currently at {current} of {max}.",
	"charactersBelow": "You're below the minimum character limit! Currently at {current} of {min}.",
	"ok": "OK",
	"gotIt": "Зрозуміло!",
	"cancel": "Скасувати"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"charactersExceeded": "Bạn nhắn quá giới hạn ký tự!! Hiện nay {current} / giới hạn {max}",
	"charactersBelow": "Bạn nhắn quá ít tối thiểu ký tự!! Hiện nay {current} / Tối thiểu {min}",
	"ok": "Đồng ý",
	"gotIt": "Hiểu rồi!",
	"cancel": "Hủy"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"charactersExceeded": "已经超过了最大字符数! 当前字符数 {current} / 限制字符数 {max}",
	"charactersBelow": "低于最小字符数！当前字符数 {current} / 限制字符数 {min}",
	"ok": "OK",
	"gotIt": "好",
	"cancel": "取消"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"charactersExceeded": "您的貼文太長了！現時字數 {current}／限制字數 {max}",
	"charactersBelow": "您的貼文太短了！現時字數 {current}／限制字數 {min}",
	"ok": "OK",
	"gotIt": "知道了",
	"cancel": "取消"
}
</locale>
