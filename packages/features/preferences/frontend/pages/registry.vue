<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 16px;">
		<MkButton primary @click="createKey">{{ $locale.sfc.createKey }}</MkButton>

		<div v-if="scopesWithDomain" class="_gaps_m">
			<FormSection v-for="domain in scopesWithDomain" :key="domain.domain ?? 'system'">
				<template #label>{{ domain.domain ? domain.domain.toUpperCase() : $locale.sfc.system }}</template>
				<div class="_gaps_s">
					<FormLink v-for="scope in domain.scopes" :to="`/registry/keys/${domain.domain ?? '@'}/${scope.join('/')}`" class="_monospace">{{ scope.length === 0 ? '(root)' : scope.join('/') }}</FormLink>
				</div>
			</FormSection>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import JSON5 from 'json5';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import FormLink from '@features/ui/frontend/components/form/link.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';

const scopesWithDomain = ref<Misskey.entities.IRegistryScopesWithDomainResponse | null>(null);

function fetchScopes() {
	misskeyApi('i/registry/scopes-with-domain').then(res => {
		scopesWithDomain.value = res;
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
		},
	});

	if (canceled) return;

	os.apiWithDialog('i/registry/set', {
		scope: result.scope.split('/'),
		key: result.key,
		value: JSON5.parse(result.value),
	}).then(() => {
		fetchScopes();
	});
}

fetchScopes();

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
	"system": "النظام",
	"key": "مفتاح",
	"value": "القيمة",
	"scope": "الحيّز",
	"registry": "السجل"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"createKey": "Crear una clau",
	"system": "Sistema",
	"key": "Clau",
	"value": "Valor",
	"scope": "Àmbit ",
	"registry": "Registre "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"createKey": "Vytvořit klíč",
	"system": "Systém",
	"key": "Klíč",
	"value": "Hodnota",
	"scope": "Rozsah",
	"registry": "Registr"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"createKey": "Create key",
	"system": "System",
	"key": "Key",
	"value": "Value",
	"scope": "Scope",
	"registry": "Registry"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"createKey": "Schlüssel erstellen",
	"system": "System",
	"key": "Schlüssel",
	"value": "Wert",
	"scope": "Scope",
	"registry": "Registry"
}
</locale>

<locale locale="en-US" lang="json">
{
	"createKey": "Create key",
	"system": "System",
	"key": "Key",
	"value": "Value",
	"scope": "Scope",
	"registry": "Registry"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"createKey": "Crear una clave",
	"system": "Sistema",
	"key": "Clave",
	"value": "Valores",
	"scope": "Alcance",
	"registry": "Registro"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"createKey": "Créer une clé",
	"system": "Système",
	"key": "Clé ",
	"value": "Valeur",
	"scope": "Portée",
	"registry": "Registre"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"createKey": "Buat kunci",
	"system": "Sistem",
	"key": "Kunci",
	"value": "Nilai",
	"scope": "Lingkup",
	"registry": "Registri"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"createKey": "Crea chiave",
	"system": "Sistema",
	"key": "Dati",
	"value": "Valore",
	"scope": "Ambito di applicazione.",
	"registry": "Registro"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"createKey": "キーを作成",
	"system": "システム",
	"key": "キー",
	"value": "値",
	"scope": "スコープ",
	"registry": "レジストリ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"createKey": "キーを作る",
	"system": "システム",
	"key": "キー",
	"value": "値",
	"scope": "スコープ",
	"registry": "レジストリ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"createKey": "Create key",
	"system": "System",
	"key": "Key",
	"value": "Value",
	"scope": "Scope",
	"registry": "Registry"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"createKey": "Create key",
	"system": "System",
	"key": "Key",
	"value": "Value",
	"scope": "Scope",
	"registry": "Registry"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"createKey": "키 생성",
	"system": "시스템",
	"key": "키",
	"value": "값",
	"scope": "범위",
	"registry": "레지스트리"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"createKey": "Create key",
	"system": "Systeem",
	"key": "Key",
	"value": "Waarde",
	"scope": "Scope",
	"registry": "Registry"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"createKey": "Create key",
	"system": "System",
	"key": "Nøkkel",
	"value": "Verdi",
	"scope": "Scope",
	"registry": "Registry"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"createKey": "Utwórz klucz",
	"system": "System",
	"key": "Klucz",
	"value": "Wartość",
	"scope": "Zakres",
	"registry": "Rejestr"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"createKey": "Criar chave",
	"system": "Sistema",
	"key": "Chave",
	"value": "Valor",
	"scope": "Escopo",
	"registry": "Registo"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"createKey": "Новый ключ",
	"system": "Система",
	"key": "Ключ",
	"value": "Значения",
	"scope": "Область",
	"registry": "Реестр"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"createKey": "Vytvoriť kľúč",
	"system": "Systém",
	"key": "Kľúč",
	"value": "Hodnoty",
	"scope": "Oblasť",
	"registry": "Register"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"createKey": "สร้างคีย์",
	"system": "ระบบ",
	"key": "คีย์",
	"value": "ค่า",
	"scope": "สโคป",
	"registry": "ทะเบียน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"createKey": "Anahtar oluştur",
	"system": "Sistem",
	"key": "Anahtar",
	"value": "Değer",
	"scope": "Kapsam",
	"registry": "Kayıt Defteri"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"createKey": "Create key",
	"system": "System",
	"key": "Key",
	"value": "Value",
	"scope": "Scope",
	"registry": "Registry"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"createKey": "Створити ключ",
	"system": "Система",
	"key": "Ключ",
	"value": "Значення",
	"scope": "Область дії",
	"registry": "Реєстр"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"createKey": "Tạo mã",
	"system": "Hệ thống",
	"key": "Mã",
	"value": "Giá trị",
	"scope": "Phạm vi",
	"registry": "Registry"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"createKey": "创建键",
	"system": "系统",
	"key": "键",
	"value": "值",
	"scope": "范围",
	"registry": "注册表"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"createKey": "新增機碼",
	"system": "系統",
	"key": "機碼",
	"value": "數值",
	"scope": "範圍",
	"registry": "登錄表"
}
</locale>
