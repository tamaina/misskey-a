<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" data-testid="mkw-aiscript" class="mkw-aiscript">
	<template #icon><i class="ti ti-terminal-2"></i></template>
	<template #header>{{ $locale.sfc.aiscript }}</template>

	<div class="uylguesu _monospace">
		<textarea v-model="widgetProps.script" placeholder="(1 + 1)"></textarea>
		<button class="_buttonPrimary" @click="run">RUN</button>
		<div class="logs">
			<div v-for="log in logs" :key="log.id" class="log" :class="log.type">{{ log.text }}</div>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Interpreter, Parser, utils } from '@syuilo/aiscript';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import type { Value } from '@syuilo/aiscript/interpreter/value.js';
import * as os from '@features/ui/frontend/os.js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import { aiScriptReadline, createAiScriptEnv } from '@features/play/frontend/services/aiscript/api.js';
import { $i } from '@features/auth/frontend/i.js';
import { genId } from '@features/runtime/frontend/utility/id.js';

const name = 'aiscript';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		label: $locale.value.sfc.showHeader,
		default: true,
	},
	script: {
		type: 'string',
		label: $locale.value.sfc.script,
		multiline: true,
		default: '(1 + 1)',
		hidden: true,
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
let aiscript: Interpreter;

const logs = ref<{
	id: string;
	text: string;
	type: 'print' | 'end' | 'error';
}[]>([]);

function pushLog(type: 'print' | 'end' | 'error', text: string): void {
	logs.value.push({ id: genId(), text, type });
}

function processError(title: string, err: unknown): void {
	const text = String(err);
	pushLog('error', text);
	os.alert({ type: 'error', title, text });
}

const run = async () => {
	logs.value = [];

	const aiscript = new Interpreter(createAiScriptEnv({
		storageKey: 'widget',
		token: $i?.token,
	}), {
		in: aiScriptReadline,
		out: (value) => {
			pushLog('print', value.type === 'str' ? value.value : utils.valToString(value));
		},
		err: (err) => {
			processError('AiScript Error', err);
		},
		log: (type, params) => {
			if (type === 'end') {
				pushLog('end', utils.valToString(params.val as Value, true));
			}
		},
	});

	let ast;
	try {
		ast = parser.parse(widgetProps.script);
	} catch (err: any) {
		processError('Syntax Error', err);
		return;
	}
	try {
		await aiscript.exec(ast);
	} catch (err: any) {
		processError('AiScript Internal Error', err);
	}
};

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.uylguesu {
	text-align: right;

	> textarea {
		display: block;
		width: 100%;
		max-width: 100%;
		min-width: 100%;
		padding: 16px;
		color: var(--MI_THEME-fg);
		background: transparent;
		border: none;
		border-bottom: solid 0.5px var(--MI_THEME-divider);
		border-radius: 0;
		box-sizing: border-box;
		font: inherit;

		&:focus-visible {
			outline: none;
		}
	}

	> button {
		display: inline-block;
		margin: 8px;
		padding: 0 10px;
		height: 28px;
		outline: none;
		border-radius: 4px;

		&:disabled {
			opacity: 0.7;
			cursor: default;
		}
	}

	> .logs {
		border-top: solid 0.5px var(--MI_THEME-divider);
		text-align: left;
		padding: 16px;

		&:empty {
			display: none;
		}

		> .log.print {
		}
		> .log.end {
			opacity: 0.7;
		}
		> .log.error {
			color: var(--MI_THEME-error);
		}
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"aiscript": "AiScript console",
	"showHeader": "Show header",
	"script": "Script"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"aiscript": "Consola AiScript",
	"showHeader": "Mostrar la capçalera",
	"script": "Script"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"aiscript": "AiScript conzole",
	"showHeader": "Show header",
	"script": "Skript"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"aiscript": "AiScript console",
	"showHeader": "Show header",
	"script": "Script"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"aiscript": "AiScript-Konsole",
	"showHeader": "Kopfzeile anzeigen",
	"script": "Skript"
}
</locale>

<locale locale="en-US" lang="json">
{
	"aiscript": "AiScript console",
	"showHeader": "Show header",
	"script": "Script"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"aiscript": "Consola de AiScript",
	"showHeader": "Mostrar encabezados",
	"script": "Script"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"aiscript": "Console AiScript",
	"showHeader": "Show header",
	"script": "Script"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"aiscript": "Konsol AiScript",
	"showHeader": "Show header",
	"script": "Script"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"aiscript": "Console AiScript",
	"showHeader": "Mostra la testata",
	"script": "Script"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"aiscript": "AiScriptコンソール",
	"showHeader": "ヘッダーを表示",
	"script": "スクリプト"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"aiscript": "AiScriptコンソール",
	"showHeader": "ヘッダー出す",
	"script": "スクリプト"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"aiscript": "AiScript console",
	"showHeader": "Show header",
	"script": "Script"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"aiscript": "AiScript console",
	"showHeader": "Show header",
	"script": "Script"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"aiscript": "AiScript 콘솔",
	"showHeader": "해더를 표시",
	"script": "스크립트"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"aiscript": "AiScript console",
	"showHeader": "Show header",
	"script": "Script"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"aiscript": "AiScript console",
	"showHeader": "Show header",
	"script": "Script"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"aiscript": "Konsola AiScript",
	"showHeader": "Show header",
	"script": "Skrypt"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"aiscript": "Console AiScript",
	"showHeader": "Exibir cabeçalho",
	"script": "Script"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"aiscript": "Консоль AiScript",
	"showHeader": "Show header",
	"script": "Скрипт"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"aiscript": "Konzola AiScript",
	"showHeader": "Show header",
	"script": "Skript"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"aiscript": " คอนโซล AiScript",
	"showHeader": "แสดงส่วนหัว",
	"script": "สคริปต์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"aiscript": "AiScript konsolu",
	"showHeader": "Başlığı göster",
	"script": "Script"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"aiscript": "AiScript console",
	"showHeader": "Show header",
	"script": "Script"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"aiscript": "Консоль AiScript",
	"showHeader": "Show header",
	"script": "Скрипт"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"aiscript": "AiScript console",
	"showHeader": "Show header",
	"script": "Kịch bản"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"aiscript": "AiScript 控制台",
	"showHeader": "显示标题",
	"script": "脚本"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"aiscript": "AiScript 控制臺",
	"showHeader": "檢視標頭 ",
	"script": "腳本"
}
</locale>
