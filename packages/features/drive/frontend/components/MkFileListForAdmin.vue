<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkPagination v-slot="{ items }" :paginator="paginator">
		<div
			:class="{
				[$style.grid]: viewMode === 'grid',
				[$style.list]: viewMode === 'list',
				'_gaps_s': viewMode === 'list',
			}"
		>
			<MkA
				v-for="file in items"
				:key="file.id"
				v-tooltip.mfm="`${file.type}\n${bytes(file.size)}\n${dateString(file.createdAt)}\nby ${file.user ? '@' + Misskey.acct.toString(file.user) : 'system'}`"
				:to="`/admin/file/${file.id}`"
				:class="[$style.file, '_button']"
			>
				<div v-if="file.isSensitive" :class="$style.sensitiveLabel">{{ $locale.sfc.sensitive }}</div>
				<MkDriveFileThumbnail :class="$style.thumbnail" :file="file" fit="contain" :highlightWhenSensitive="true"/>
				<div v-if="viewMode === 'list'" :class="$style.body">
					<div>
						<small style="opacity: 0.7;">{{ file.name }}</small>
					</div>
					<div>
						<MkAcct v-if="file.user" :user="file.user"/>
						<div v-else>{{ $locale.sfc.system }}</div>
					</div>
					<div>
						<span style="margin-right: 1em;">{{ file.type }}</span>
						<span>{{ bytes(file.size) }}</span>
					</div>
					<div>
						<span>{{ $locale.sfc.registeredDate }}: <MkTime :time="file.createdAt" mode="detail"/></span>
					</div>
				</div>
			</MkA>
		</div>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import type { Paginator } from '@features/ui/frontend/utility/paginator.js';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkDriveFileThumbnail from '@features/drive/frontend/components/MkDriveFileThumbnail.vue';
import bytes from '@features/ui/frontend/filters/bytes.js';
import { dateString } from '@features/ui/frontend/filters/date.js';

defineProps<{
	paginator: Paginator<'admin/drive/files'>;
	viewMode: 'grid' | 'list';
}>();
</script>

<style lang="scss" module>
@keyframes sensitive-blink {
	0% { opacity: 1; }
	50% { opacity: 0; }
}

.list {
	> .file {
		display: flex;
		width: 100%;
		height: auto;
		box-sizing: border-box;
		text-align: left;
		align-items: center;
	}

	> .file:hover {
		color: var(--MI_THEME-accent);
	}

	> .file > .thumbnail {
		width: 128px;
		height: 128px;
	}

	> .file > .body {
		margin-left: 0.3em;
		padding: 8px;
		flex: 1;

		@media (max-width: 500px) {
			font-size: 14px;
		}
	}
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
	grid-gap: 12px;

	> .file {
		position: relative;
		aspect-ratio: 1;
	}

	.thumbnail {
		width: 100%;
		height: 100%;
	}
}

.sensitiveLabel {
	position: absolute;
	z-index: 10;
	top: 8px;
	left: 8px;
	padding: 2px 4px;
	background: #ff0000bf;
	color: #fff;
	border-radius: 4px;
	font-size: 85%;
	animation: sensitive-blink 1s infinite;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "sensitive": "محتوى حساس",
  "system": "النظام",
  "registeredDate": "انضم في"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "sensitive": "Sensible",
  "system": "Sistema",
  "registeredDate": "Data de registre"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "sensitive": "NSFW",
  "system": "Systém",
  "registeredDate": "Datum registrace"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "sensitive": "Sensitive",
  "system": "System",
  "registeredDate": "Joined on"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "sensitive": "Sensibel",
  "system": "System",
  "registeredDate": "Registrationsdatum"
}
</locale>

<locale locale="en-US" lang="json">
{
  "sensitive": "Sensitive",
  "system": "System",
  "registeredDate": "Joined on"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "sensitive": "Marcado como sensible (NSFW)",
  "system": "Sistema",
  "registeredDate": "Fecha de registro"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "sensitive": "Contenu sensible",
  "system": "Système",
  "registeredDate": "Inscrit le"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "sensitive": "Konten sensitif",
  "system": "Sistem",
  "registeredDate": "Bergabung pada"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "sensitive": "Esplicito",
  "system": "Sistema",
  "registeredDate": "Data iscrizione"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "sensitive": "センシティブ",
  "system": "システム",
  "registeredDate": "登録日"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "sensitive": "気いつけて見いや",
  "system": "システム",
  "registeredDate": "始めた日"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "sensitive": "Sensitive",
  "system": "System",
  "registeredDate": "Joined on"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "sensitive": "Sensitive",
  "system": "System",
  "registeredDate": "Joined on"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "sensitive": "열람 주의",
  "system": "시스템",
  "registeredDate": "등록일"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "sensitive": "NSFW",
  "system": "Systeem",
  "registeredDate": "Inschrijvingsdatum"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "sensitive": "Sensitive",
  "system": "System",
  "registeredDate": "Joined on"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "sensitive": "NSFW",
  "system": "System",
  "registeredDate": "Zarejestrowano"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "sensitive": "Conteúdo sensível",
  "system": "Sistema",
  "registeredDate": "Data de registro"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "sensitive": "Содержимое не для всех",
  "system": "Система",
  "registeredDate": "Дата регистрации"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "sensitive": "NSFW",
  "system": "Systém",
  "registeredDate": "Dátum registrácie"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "sensitive": "เนื้อหาที่ละเอียดอ่อน",
  "system": "ระบบ",
  "registeredDate": "วันที่ลงทะเบียน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "sensitive": "Hassas",
  "system": "Sistem",
  "registeredDate": "Katılma tarihi"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "sensitive": "Sensitive",
  "system": "System",
  "registeredDate": "Joined on"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "sensitive": "NSFW",
  "system": "Система",
  "registeredDate": "Приєднання"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "sensitive": "Nhạy cảm",
  "system": "Hệ thống",
  "registeredDate": "Tham gia"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "sensitive": "敏感内容",
  "system": "系统",
  "registeredDate": "注册于"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "sensitive": "敏感內容",
  "system": "系統",
  "registeredDate": "註冊日期"
}
</locale>
