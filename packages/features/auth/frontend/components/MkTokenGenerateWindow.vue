<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	:withOkButton="true"
	:okButtonDisabled="false"
	:canClose="false"
	@close="dialog?.close()"
	@closed="emit('closed')"
	@ok="ok()"
>
	<template #header>{{ title || globalLocale.env.generateAccessToken }}</template>

	<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
		<div class="_gaps_m">
			<div v-if="information">
				<MkInfo warn>{{ information }}</MkInfo>
			</div>
			<div>
				<MkInput v-model="name">
					<template #label>{{ globalLocale.env.name }}</template>
				</MkInput>
			</div>
			<MkTokenExpiry v-model="expiry"/>
			<div><b>{{ globalLocale.env.permission }}</b></div>
			<MkPermissionSelect v-model="selectedPermissions" :permissions="Misskey.permissions" :administrator="!!iAmAdmin"/>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { useTemplateRef, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import { iAmAdmin } from '@features/auth/frontend/i.js';
import * as os from '@features/ui/frontend/os.js';
import { selectedCredentialExpiry } from '../utility/use-credential-operation.js';
import MkPermissionSelect from './MkPermissionSelect.vue';
import MkTokenExpiry from './MkTokenExpiry.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const props = withDefaults(defineProps<{
	title?: string | null;
	information?: string | null;
	initialName?: string | null;
	initialPermissions?: (typeof Misskey.permissions)[number][] | null;
}>(), {
	title: null,
	information: null,
	initialName: null,
	initialPermissions: null,
});

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'done', result: { name: string | null, permissions: string[], expiresAt?: string }): void;
}>();

const dialog = useTemplateRef('dialog');
const name = ref(props.initialName);
const expiry = ref<string | null>(null);
const selectedPermissions = ref<string[]>(props.initialPermissions ? [...props.initialPermissions] : []);

async function ok(): Promise<void> {
	let expiresAt: string | undefined;
	try { expiresAt = selectedCredentialExpiry(expiry.value); } catch { await os.alert({ type: 'error', text: $locale.value.sfc.invalidExpiry }); return; }
	emit('done', {
		name: name.value,
		permissions: selectedPermissions.value,
		...(expiresAt ? { expiresAt } : {}),
	});
	dialog.value?.close();
}

</script>

<locale lang="json" locale="ar-SA">
{}
</locale>

<locale lang="json" locale="ca-ES">
{}
</locale>

<locale lang="json" locale="cs-CZ">
{}
</locale>

<locale lang="json" locale="da-DK">
{}
</locale>

<locale lang="json" locale="de-DE">
{}
</locale>

<locale lang="json" locale="en-US">
{}
</locale>

<locale lang="json" locale="es-ES">
{}
</locale>

<locale lang="json" locale="fr-FR">
{}
</locale>

<locale lang="json" locale="id-ID">
{}
</locale>

<locale lang="json" locale="it-IT">
{}
</locale>

<locale lang="json" locale="ja-JP">
{
	"invalidExpiry": "有効期限には未来の日時を指定してください。"
}
</locale>

<locale lang="json" locale="ja-KS">
{}
</locale>

<locale lang="json" locale="kab-KAB">
{}
</locale>

<locale lang="json" locale="kn-IN">
{}
</locale>

<locale lang="json" locale="ko-KR">
{}
</locale>

<locale lang="json" locale="nl-NL">
{}
</locale>

<locale lang="json" locale="no-NO">
{}
</locale>

<locale lang="json" locale="pl-PL">
{}
</locale>

<locale lang="json" locale="pt-PT">
{}
</locale>

<locale lang="json" locale="ru-RU">
{}
</locale>

<locale lang="json" locale="sk-SK">
{}
</locale>

<locale lang="json" locale="th-TH">
{}
</locale>

<locale lang="json" locale="tr-TR">
{}
</locale>

<locale lang="json" locale="ug-CN">
{}
</locale>

<locale lang="json" locale="uk-UA">
{}
</locale>

<locale lang="json" locale="vi-VN">
{}
</locale>

<locale lang="json" locale="zh-CN">
{}
</locale>

<locale lang="json" locale="zh-TW">
{}
</locale>
