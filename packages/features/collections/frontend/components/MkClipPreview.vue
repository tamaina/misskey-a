<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkA :to="`/clips/${clip.id}`" :class="$style.link">
	<div :class="$style.root" class="_panel _gaps_s">
		<b>{{ clip.name }}</b>
		<div :class="$style.description">
			<div v-if="clip.description"><Mfm :text="clip.description" :plain="true" :nowrap="true"/></div>
			<div v-if="clip.lastClippedAt">{{ $locale.sfc.updatedAt }}: <MkTime :time="clip.lastClippedAt" mode="detail"/></div>
			<div v-if="clip.notesCount != null">{{ $locale.sfc.notesCount }}: {{ number(clip.notesCount) }} / {{ $i?.policies.noteEachClipsLimit }} ({{ $l.sfc.remainingN({ n: remaining }) }})</div>
		</div>
		<template v-if="!props.noUserInfo">
			<div :class="$style.divider"></div>
			<div>
				<MkAvatar :user="clip.user" :class="$style.userAvatar" indicator link preview/> <MkUserName :user="clip.user" :nowrap="false"/>
			</div>
		</template>
	</div>
</MkA>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { computed } from 'vue';
import { $i } from '@features/auth/frontend/i.js';
import number from '@features/ui/frontend/filters/number.js';

const props = withDefaults(defineProps<{
	clip: Misskey.entities.Clip;
	noUserInfo?: boolean;
}>(), {
	noUserInfo: false,
});

const remaining = computed(() => {
	return ($i?.policies && props.clip.notesCount != null) ? ($i.policies.noteEachClipsLimit - props.clip.notesCount) : $locale.value.sfc.unknown;
});
</script>

<style lang="scss" module>
.link {
	display: block;

	&:focus-visible {
		outline: none;

		.root {
			box-shadow: inset 0 0 0 2px var(--MI_THEME-focus);
		}
	}

	&:hover {
		text-decoration: none;
		color: var(--MI_THEME-accent);
	}
}

.root {
	padding: 16px;
}

.divider {
	height: 1px;
	background: var(--MI_THEME-divider);
}

.description {
	font-size: 90%;
}

.userAvatar {
	width: 32px;
	height: 32px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"updatedAt": "حُدّث في",
	"notesCount": "عدد الملاحظات",
	"remainingN": "Remaining: {n}",
	"unknown": "مجهول"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"updatedAt": "Actualitzat el",
	"notesCount": "Comptador de notes",
	"remainingN": "Queden: {n}",
	"unknown": "Desconegut"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"updatedAt": "Upraveno",
	"notesCount": "Počet poznámek",
	"remainingN": "Remaining: {n}",
	"unknown": "Neznámý"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"updatedAt": "Updated at",
	"notesCount": "Number of notes",
	"remainingN": "Remaining: {n}",
	"unknown": "Unknown"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"updatedAt": "Zuletzt geändert am",
	"notesCount": "Anzahl der Notizen",
	"remainingN": "Verbleibend: {n}",
	"unknown": "Unbekannt"
}
</locale>

<locale locale="en-US" lang="json">
{
	"updatedAt": "Updated at",
	"notesCount": "Number of notes",
	"remainingN": "Remaining: {n}",
	"unknown": "Unknown"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"updatedAt": "Actualizado",
	"notesCount": "Cantidad de notas",
	"remainingN": "Faltan: {n}",
	"unknown": "Desconocido"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"updatedAt": "Mis à jour le",
	"notesCount": "Nombre de notes",
	"remainingN": "Restants : {n}",
	"unknown": "Inconnu"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"updatedAt": "Diperbarui pada",
	"notesCount": "Jumlah catatan",
	"remainingN": "Sisa : {n}",
	"unknown": "Tidak diketahui"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"updatedAt": "Aggiornato il",
	"notesCount": "Conteggio note",
	"remainingN": "Rimangono: {n}",
	"unknown": "Sconosciuto"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"updatedAt": "更新日時",
	"notesCount": "ノートの数",
	"remainingN": "残り: {n}",
	"unknown": "不明"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"updatedAt": "更新日時",
	"notesCount": "ノートの数やで",
	"remainingN": "残り:{n}",
	"unknown": "不明"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"updatedAt": "Updated at",
	"notesCount": "Number of notes",
	"remainingN": "Remaining: {n}",
	"unknown": "Unknown"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"updatedAt": "Updated at",
	"notesCount": "Number of notes",
	"remainingN": "Remaining: {n}",
	"unknown": "Unknown"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"updatedAt": "수정한 날짜",
	"notesCount": "노트 수",
	"remainingN": "나머지: {n}",
	"unknown": "알 수 없음"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"updatedAt": "Laatst gewijzigd at",
	"notesCount": "Aantal notities",
	"remainingN": "Remaining: {n}",
	"unknown": "Onbekend"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"updatedAt": "Updated at",
	"notesCount": "Number of notes",
	"remainingN": "Remaining: {n}",
	"unknown": "Ukjent"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"updatedAt": "Zaktualizowano",
	"notesCount": "Liczba wpisów",
	"remainingN": "Remaining: {n}",
	"unknown": "Nieznane"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"updatedAt": "Última atualização",
	"notesCount": "Número de notas",
	"remainingN": "Restante: {n}",
	"unknown": "Desconhecido"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"updatedAt": "Обновлено",
	"notesCount": "Количество заметок",
	"remainingN": "Остаётся: {n}",
	"unknown": "Неизвестно"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"updatedAt": "Upravené",
	"notesCount": "Počet poznámok",
	"remainingN": "Remaining: {n}",
	"unknown": "Neznáme"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"updatedAt": "อัปเดตล่าสุด",
	"notesCount": "จำนวนของโน้ต",
	"remainingN": "เหลือ : {n}",
	"unknown": "ไม่ทราบสถานะ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"updatedAt": "Güncellendi",
	"notesCount": "Not sayısı",
	"remainingN": "Kalan: {n}",
	"unknown": "Bilinmiyor"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"updatedAt": "Updated at",
	"notesCount": "Number of notes",
	"remainingN": "Remaining: {n}",
	"unknown": "Unknown"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"updatedAt": "Останнє оновлення",
	"notesCount": "Кількість нотаток",
	"remainingN": "Залишилося: {n}",
	"unknown": "Невідомо"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"updatedAt": "Cập nhật lúc",
	"notesCount": "Số lượng tút",
	"remainingN": "Remaining: {n}",
	"unknown": "Chưa biết"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"updatedAt": "更新日期",
	"notesCount": "帖子数量",
	"remainingN": "剩余：{n}",
	"unknown": "未知"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"updatedAt": "最後更新",
	"notesCount": "貼文數量",
	"remainingN": "剩餘：{n}",
	"unknown": "未知"
}
</locale>
