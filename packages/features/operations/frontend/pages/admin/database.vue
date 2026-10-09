<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<MkSuspense v-slot="{ result: database }" :p="databasePromiseFactory">
			<MkKeyValue v-for="table in database" :key="table[0]" oneline style="margin: 1em 0;">
				<template #key>{{ table[0] }}</template>
				<template #value>{{ bytes(table[1].size) }} ({{ number(table[1].count) }} recs)</template>
			</MkKeyValue>
		</MkSuspense>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import bytes from '@features/ui/frontend/filters/bytes.js';
import number from '@features/ui/frontend/filters/number.js';
import { definePage } from '@features/navigation/frontend/page.js';

const databasePromiseFactory = () => misskeyApi('admin/get-table-stats').then(res => Object.entries(res).sort((a, b) => b[1].size - a[1].size));

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.database,
	icon: 'ti ti-database',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"database": "قاعدة البيانات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"database": "Bases de dades"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"database": "Databáze"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"database": "Database"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"database": "Datenbank"
}
</locale>

<locale locale="en-US" lang="json">
{
	"database": "Database"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"database": "Base de datos"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"database": "Base de données"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"database": "Basis data"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"database": "Base dati"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"database": "データベース"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"database": "データベース"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"database": "Database"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"database": "Database"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"database": "데이터베이스"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"database": "Database"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"database": "Database"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"database": "Baza danych"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"database": "Banco de dados"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"database": "База данных"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"database": "Databáza"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"database": "ฐานข้อมูล"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"database": "Veritabanı"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"database": "Database"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"database": "База даних"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"database": "Cơ sở dữ liệu"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"database": "数据库"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"database": "資料庫"
}
</locale>
