<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" class="mkw-aiscriptApp">
	<template #header>App</template>
	<div :class="$style.root">
		<div v-if="isSyntaxError">Syntax error :(</div>
		<MkAsUi v-else-if="root" :component="root" :components="components" size="small"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { Interpreter, Parser } from '@syuilo/aiscript';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { Ref } from 'vue';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import type { AsUiComponent, AsUiRoot } from '@features/play/frontend/services/aiscript/ui.js';
import * as os from '@features/ui/frontend/os.js';
import { aiScriptReadline, createAiScriptEnv } from '@features/play/frontend/services/aiscript/api.js';
import { $i } from '@features/auth/frontend/i.js';
import MkAsUi from '@features/play/frontend/components/MkAsUi.vue';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import { registerAsUiLib } from '@features/play/frontend/services/aiscript/ui.js';

const name = 'aiscriptApp';

const widgetPropsDef = {
	script: {
		type: 'string',
		label: $locale.value.sfc.script,
		multiline: true,
		manualSave: true,
		default: '',
	},
	showHeader: {
		type: 'boolean',
		label: $locale.value.sfc.showHeader,
		default: true,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const parser = new Parser();

const root = ref<AsUiRoot>();
const components = ref<Ref<AsUiComponent>[]>([]);
const isSyntaxError = ref(false);

async function run() {
	isSyntaxError.value = false;

	const aiscript = new Interpreter({
		...createAiScriptEnv({
			storageKey: 'widget',
			token: $i?.token,
		}),
		...registerAsUiLib(components.value, (_root) => {
			root.value = _root.value;
		}),
	}, {
		in: aiScriptReadline,
		out: (value) => {
			// nop
		},
		err: (err) => {
			os.alert({
				type: 'error',
				title: 'AiScript Error',
				text: String(err),
			});
		},
		log: (type, params) => {
			// nop
		},
	});

	let ast;
	try {
		ast = parser.parse(widgetProps.script);
	} catch (err) {
		isSyntaxError.value = true;
		os.alert({
			type: 'error',
			title: 'Syntax Error',
			text: String(err),
		});
		return;
	}
	try {
		await aiscript.exec(ast);
	} catch (err) {
		os.alert({
			type: 'error',
			title: 'AiScript Internal Error',
			text: String(err),
		});
	}
}

watch(() => widgetProps.script, () => {
	run();
});

onMounted(() => {
	run();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	padding: 16px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"script": "Script",
	"showHeader": "Show header"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"script": "Script",
	"showHeader": "Mostrar la capçalera"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"script": "Skript",
	"showHeader": "Show header"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"script": "Script",
	"showHeader": "Show header"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"script": "Skript",
	"showHeader": "Kopfzeile anzeigen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"script": "Script",
	"showHeader": "Show header"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"script": "Script",
	"showHeader": "Mostrar encabezados"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"script": "Script",
	"showHeader": "Show header"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"script": "Script",
	"showHeader": "Show header"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"script": "Script",
	"showHeader": "Mostra la testata"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"script": "スクリプト",
	"showHeader": "ヘッダーを表示"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"script": "スクリプト",
	"showHeader": "ヘッダー出す"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"script": "Script",
	"showHeader": "Show header"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"script": "Script",
	"showHeader": "Show header"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"script": "스크립트",
	"showHeader": "해더를 표시"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"script": "Script",
	"showHeader": "Show header"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"script": "Script",
	"showHeader": "Show header"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"script": "Skrypt",
	"showHeader": "Show header"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"script": "Script",
	"showHeader": "Exibir cabeçalho"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"script": "Скрипт",
	"showHeader": "Show header"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"script": "Skript",
	"showHeader": "Show header"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"script": "สคริปต์",
	"showHeader": "แสดงส่วนหัว"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"script": "Script",
	"showHeader": "Başlığı göster"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"script": "Script",
	"showHeader": "Show header"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"script": "Скрипт",
	"showHeader": "Show header"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"script": "Kịch bản",
	"showHeader": "Show header"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"script": "脚本",
	"showHeader": "显示标题"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"script": "腳本",
	"showHeader": "檢視標頭 "
}
</locale>
