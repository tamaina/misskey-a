<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :naked="widgetProps.transparent" :showHeader="false" data-testid="mkw-aichan" class="mkw-aichan">
	<iframe ref="live2d" :class="$style.root" src="https://misskey-dev.github.io/mascot-web/?scale=1.5&y=1.1&eyeY=100" @click="touched"></iframe>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, useTemplateRef } from 'vue';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentProps, WidgetComponentEmits, WidgetComponentExpose } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';

const name = 'aichan';

const widgetPropsDef = {
	transparent: {
		type: 'boolean',
		label: $locale.value.sfc.transparent,
		default: false,
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

const live2d = useTemplateRef('live2d');

const touched = () => {
	//if (this.live2d) this.live2d.changeExpression('gurugurume');
};

const onMousemove = (ev: MouseEvent) => {
	if (!live2d.value || !live2d.value.contentWindow) return;

	const iframeRect = live2d.value.getBoundingClientRect();
	live2d.value.contentWindow.postMessage({
		type: 'moveCursor',
		body: {
			x: ev.clientX - iframeRect.left,
			y: ev.clientY - iframeRect.top,
		},
	}, '*');
};

onMounted(() => {
	window.addEventListener('mousemove', onMousemove, { passive: true });
});

onUnmounted(() => {
	window.removeEventListener('mousemove', onMousemove);
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	width: 100%;
	height: 350px;
	border: none;
	pointer-events: none;
	color-scheme: light;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"transparent": "Make background transparent"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"transparent": "Fons transparent"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"transparent": "Make background transparent"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"transparent": "Make background transparent"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"transparent": "Hintergrund transparent machen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"transparent": "Make background transparent"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"transparent": "Hacer fondo transparente"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"transparent": "Make background transparent"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"transparent": "Make background transparent"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"transparent": "Sfondo trasparente"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"transparent": "背景を透明にする"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"transparent": "背景を透明にする"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"transparent": "Make background transparent"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"transparent": "Make background transparent"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"transparent": "배경을 투명하게 설정"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"transparent": "Make background transparent"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"transparent": "Make background transparent"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"transparent": "Make background transparent"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"transparent": "Make background transparent"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"transparent": "Make background transparent"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"transparent": "Make background transparent"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"transparent": "ทำพื้นหลังโปรงใส"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"transparent": "Arka planı şeffaf yapın"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"transparent": "Make background transparent"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"transparent": "Make background transparent"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"transparent": "Make background transparent"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"transparent": "使背景透明"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"transparent": "使背景透明"
}
</locale>
