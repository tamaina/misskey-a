<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 16px;">
		<div class="_gaps_m">
			<FormSplit>
				<MkKeyValue>
					<template #key>{{ $locale.sfc.domain }}</template>
					<template #value>{{ props.domain === '@' ? $locale.sfc.system : props.domain.toUpperCase() }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ $locale.sfc.scope }}</template>
					<template #value>{{ scope.join('/') }}</template>
				</MkKeyValue>
			</FormSplit>

			<MkButton primary @click="createKey">{{ $locale.sfc.createKey }}</MkButton>

			<FormSection v-if="keys">
				<template #label>{{ $locale.sfc.keys }}</template>
				<div class="_gaps_s">
					<FormLink v-for="key in keys" :to="`/registry/value/${props.domain}/${scope.join('/')}/${key[0]}`" class="_monospace">{{ key[0] }}<template #suffix>{{ key[1].toUpperCase() }}</template></FormLink>
				</div>
			</FormSection>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { watch, computed, ref } from 'vue';
import JSON5 from 'json5';
import * as v from 'valibot';
import { packedJsonValueSchema } from '../../../users/backend/json-value.schema.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import FormLink from '@features/ui/frontend/components/form/link.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import FormSplit from '@features/ui/frontend/components/form/split.vue';

const props = defineProps<{
	path: string;
	domain: string;
}>();

const scope = computed(() => props.path ? props.path.split('/') : []);

const keys = ref<[string, string][]>([]);

function fetchKeys() {
	misskeyApi('i/registry/keys-with-type', {
		scope: scope.value,
		domain: props.domain === '@' ? null : props.domain,
	}).then(res => {
		keys.value = Object.entries(res).sort((a, b) => a[0].localeCompare(b[0]));
	});
}

async function createKey() {
	const { canceled, result } = await os.form($locale.value.sfc.createKey, {
		key: {
			type: 'string',
			label: $locale.value.sfc.key,
		},
		value: {
			type: 'string',
			multiline: true,
			label: $locale.value.sfc.value,
		},
		scope: {
			type: 'string',
			label: $locale.value.sfc.scope,
			default: scope.value.join('/'),
		},
	});

	if (canceled) return;

	os.apiWithDialog('i/registry/set', {
		scope: result.scope.split('/'),
		key: result.key,
		value: v.parse(packedJsonValueSchema, JSON5.parse(result.value)),
	}).then(() => {
		fetchKeys();
	});
}

watch(() => props.path, fetchKeys, { immediate: true });

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.registry,
	icon: 'ti ti-adjustments',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"createKey": "أنشئ مفتاحًا",
	"key": "مفتاح",
	"value": "القيمة",
	"scope": "الحيّز",
	"registry": "السجل",
	"domain": "النّطاق",
	"system": "النظام",
	"keys": "المفاتيح"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"createKey": "Crear una clau",
	"key": "Clau",
	"value": "Valor",
	"scope": "Àmbit ",
	"registry": "Registre ",
	"domain": "Domini",
	"system": "Sistema",
	"keys": "Claus"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"createKey": "Vytvořit klíč",
	"key": "Klíč",
	"value": "Hodnota",
	"scope": "Rozsah",
	"registry": "Registr",
	"domain": "Doména",
	"system": "Systém",
	"keys": "Klíče"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"createKey": "Create key",
	"key": "Key",
	"value": "Value",
	"scope": "Scope",
	"registry": "Registry",
	"domain": "Domain",
	"system": "System",
	"keys": "Keys"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"createKey": "Schlüssel erstellen",
	"key": "Schlüssel",
	"value": "Wert",
	"scope": "Scope",
	"registry": "Registry",
	"domain": "Domain",
	"system": "System",
	"keys": "Schlüssel"
}
</locale>

<locale locale="en-US" lang="json">
{
	"createKey": "Create key",
	"key": "Key",
	"value": "Value",
	"scope": "Scope",
	"registry": "Registry",
	"domain": "Domain",
	"system": "System",
	"keys": "Keys"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"createKey": "Crear una clave",
	"key": "Clave",
	"value": "Valores",
	"scope": "Alcance",
	"registry": "Registro",
	"domain": "Dominio",
	"system": "Sistema",
	"keys": "Clave"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"createKey": "Créer une clé",
	"key": "Clé ",
	"value": "Valeur",
	"scope": "Portée",
	"registry": "Registre",
	"domain": "Domaine",
	"system": "Système",
	"keys": "Clé "
}
</locale>

<locale locale="id-ID" lang="json">
{
	"createKey": "Buat kunci",
	"key": "Kunci",
	"value": "Nilai",
	"scope": "Lingkup",
	"registry": "Registri",
	"domain": "Domain",
	"system": "Sistem",
	"keys": "Kunci"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"createKey": "Crea chiave",
	"key": "Dati",
	"value": "Valore",
	"scope": "Ambito di applicazione.",
	"registry": "Registro",
	"domain": "Dominio",
	"system": "Sistema",
	"keys": "Dati"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"createKey": "キーを作成",
	"key": "キー",
	"value": "値",
	"scope": "スコープ",
	"registry": "レジストリ",
	"domain": "ドメイン",
	"system": "システム",
	"keys": "キー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"createKey": "キーを作る",
	"key": "キー",
	"value": "値",
	"scope": "スコープ",
	"registry": "レジストリ",
	"domain": "ドメイン",
	"system": "システム",
	"keys": "キー"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"createKey": "Create key",
	"key": "Key",
	"value": "Value",
	"scope": "Scope",
	"registry": "Registry",
	"domain": "Domain",
	"system": "System",
	"keys": "Keys"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"createKey": "Create key",
	"key": "Key",
	"value": "Value",
	"scope": "Scope",
	"registry": "Registry",
	"domain": "Domain",
	"system": "System",
	"keys": "Keys"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"createKey": "키 생성",
	"key": "키",
	"value": "값",
	"scope": "범위",
	"registry": "레지스트리",
	"domain": "도메인",
	"system": "시스템",
	"keys": "키"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"createKey": "Create key",
	"key": "Key",
	"value": "Waarde",
	"scope": "Scope",
	"registry": "Registry",
	"domain": "Domain",
	"system": "Systeem",
	"keys": "Keys"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"createKey": "Create key",
	"key": "Nøkkel",
	"value": "Verdi",
	"scope": "Scope",
	"registry": "Registry",
	"domain": "Domain",
	"system": "System",
	"keys": "Nøkler"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"createKey": "Utwórz klucz",
	"key": "Klucz",
	"value": "Wartość",
	"scope": "Zakres",
	"registry": "Rejestr",
	"domain": "Domena",
	"system": "System",
	"keys": "Klucz"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"createKey": "Criar chave",
	"key": "Chave",
	"value": "Valor",
	"scope": "Escopo",
	"registry": "Registo",
	"domain": "Domínio",
	"system": "Sistema",
	"keys": "Chave"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"createKey": "Новый ключ",
	"key": "Ключ",
	"value": "Значения",
	"scope": "Область",
	"registry": "Реестр",
	"domain": "Домен",
	"system": "Система",
	"keys": "Ключ"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"createKey": "Vytvoriť kľúč",
	"key": "Kľúč",
	"value": "Hodnoty",
	"scope": "Oblasť",
	"registry": "Register",
	"domain": "Doména",
	"system": "Systém",
	"keys": "Kľúče"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"createKey": "สร้างคีย์",
	"key": "คีย์",
	"value": "ค่า",
	"scope": "สโคป",
	"registry": "ทะเบียน",
	"domain": "โดเมน",
	"system": "ระบบ",
	"keys": "คีย์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"createKey": "Anahtar oluştur",
	"key": "Anahtar",
	"value": "Değer",
	"scope": "Kapsam",
	"registry": "Kayıt Defteri",
	"domain": "Alan adı",
	"system": "Sistem",
	"keys": "Anahtarlar"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"createKey": "Create key",
	"key": "Key",
	"value": "Value",
	"scope": "Scope",
	"registry": "Registry",
	"domain": "Domain",
	"system": "System",
	"keys": "Keys"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"createKey": "Створити ключ",
	"key": "Ключ",
	"value": "Значення",
	"scope": "Область дії",
	"registry": "Реєстр",
	"domain": "Домен",
	"system": "Система",
	"keys": "Ключі"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"createKey": "Tạo mã",
	"key": "Mã",
	"value": "Giá trị",
	"scope": "Phạm vi",
	"registry": "Registry",
	"domain": "Tên miền",
	"system": "Hệ thống",
	"keys": "Các mã"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"createKey": "创建键",
	"key": "键",
	"value": "值",
	"scope": "范围",
	"registry": "注册表",
	"domain": "域",
	"system": "系统",
	"keys": "键"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"createKey": "新增機碼",
	"key": "機碼",
	"value": "數值",
	"scope": "範圍",
	"registry": "登錄表",
	"domain": "域",
	"system": "系統",
	"keys": "機碼"
}
</locale>
