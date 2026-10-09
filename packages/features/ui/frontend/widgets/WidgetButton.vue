<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div data-testid="mkw-button" class="mkw-button">
	<MkButton :primary="widgetProps.colored" full @click="run">
		{{ widgetProps.label }}
	</MkButton>
</div>
</template>

<script lang="ts" setup>
import { Interpreter, Parser } from '@syuilo/aiscript';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import * as os from '@features/ui/frontend/os.js';
import { aiScriptReadline, createAiScriptEnv } from '@features/play/frontend/services/aiscript/api.js';
import { $i } from '@features/auth/frontend/i.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';

const name = 'button';

const widgetPropsDef = {
	label: {
		type: 'string',
		label: $locale.value.sfc.label,
		default: 'BUTTON',
	},
	colored: {
		type: 'boolean',
		label: $locale.value.sfc.colored,
		default: true,
	},
	script: {
		type: 'string',
		label: $locale.value.sfc.script,
		multiline: true,
		default: 'Mk:dialog("hello", "world")',
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

async function run() {
	const aiscript = new Interpreter(createAiScriptEnv({
		storageKey: 'widget',
		token: $i?.token,
	}), {
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

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<locale locale="ar-SA" lang="json">
{
	"label": "التسمية",
	"colored": "ملوّن",
	"script": "Script"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"label": "Etiqueta",
	"colored": "Colorit",
	"script": "Script"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"label": "Popisek",
	"colored": "Barevné",
	"script": "Skript"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"label": "Label",
	"colored": "Colored",
	"script": "Script"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"label": "Beschriftung",
	"colored": "Farbig",
	"script": "Skript"
}
</locale>

<locale locale="en-US" lang="json">
{
	"label": "Label",
	"colored": "Colored",
	"script": "Script"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"label": "Etiqueta",
	"colored": "Color",
	"script": "Script"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"label": "Étiquette",
	"colored": "Coloré",
	"script": "Script"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"label": "Label",
	"colored": "Diwarnai",
	"script": "Script"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"label": "Etichetta",
	"colored": "Colorato",
	"script": "Script"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"label": "ラベル",
	"colored": "色付き",
	"script": "スクリプト"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"label": "ラベル",
	"colored": "色付き",
	"script": "スクリプト"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"label": "Label",
	"colored": "Colored",
	"script": "Script"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"label": "Label",
	"colored": "Colored",
	"script": "Script"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"label": "라벨",
	"colored": "색 입히기",
	"script": "스크립트"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"label": "Label",
	"colored": "Colored",
	"script": "Script"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"label": "Label",
	"colored": "Colored",
	"script": "Script"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"label": "Etykieta",
	"colored": "Kolorowe",
	"script": "Skrypt"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"label": "Etiqueta",
	"colored": "Colorido",
	"script": "Script"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"label": "Метка",
	"colored": "Выделена цветом",
	"script": "Скрипт"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"label": "Popisok",
	"colored": "Farebné",
	"script": "Skript"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"label": "ป้าย",
	"colored": "สี",
	"script": "สคริปต์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"label": "Etiket",
	"colored": "Renkli",
	"script": "Script"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"label": "Label",
	"colored": "Colored",
	"script": "Script"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"label": "Назва",
	"colored": "Кольоровий",
	"script": "Скрипт"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"label": "Nhãn",
	"colored": "Với màu",
	"script": "Kịch bản"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"label": "标签",
	"colored": "彩色",
	"script": "脚本"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"label": "標籤",
	"colored": "彩色",
	"script": "腳本"
}
</locale>
