<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" v-slot="{ type }" :preferType="deviceKind === 'smartphone' ? 'drawer' : 'dialog'" @click="onBgClick" @closed="emit('closed')" @esc="emit('esc')">
	<div ref="rootEl" :class="[$style.root, type === 'drawer' ? $style.asDrawer : null]" :style="{ width: type === 'drawer' ? '' : `${width}px`, height: type === 'drawer' ? '' : `min(${height}px, 100%)` }">
		<div :class="$style.header">
			<button v-if="withCloseButton" :class="$style.headerButton" class="_button" data-testid="modal-window-close" @click="emit('close')"><i class="ti ti-x"></i></button>
			<span :class="$style.title">
				<slot name="header"></slot>
			</span>
			<div v-if="withOkButton" style="padding: 0 16px; place-content: center;">
				<MkButton primary gradate small rounded :disabled="okButtonDisabled" @click="emit('ok')">{{ $locale.sfc.done }} <i class="ti ti-check"></i></MkButton>
			</div>
		</div>
		<div :class="$style.body">
			<slot></slot>
		</div>
		<div v-if="$slots.footer" :class="$style.footer">
			<slot name="footer"></slot>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, useTemplateRef, ref } from 'vue';
import MkModal from '@features/ui/frontend/components/MkModal.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { deviceKind } from '@features/ui/frontend/utility/device-kind.js';

const props = withDefaults(defineProps<{
	withOkButton?: boolean;
	withCloseButton?: boolean;
	okButtonDisabled?: boolean;
	width?: number;
	height?: number;
}>(), {
	withOkButton: false,
	withCloseButton: true,
	okButtonDisabled: false,
	width: 400,
	height: 500,
});

const emit = defineEmits<{
	(event: 'click'): void;
	(event: 'close'): void;
	(event: 'closed'): void;
	(event: 'ok'): void;
	(event: 'esc'): void;
}>();

const modal = useTemplateRef('modal');

function close() {
	modal.value?.close();
}

function onBgClick() {
	emit('click');
}

defineExpose({
	close,
});
</script>

<style lang="scss" module>
.root {
	margin: auto;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	contain: content;
	border-radius: var(--MI-radius);

	--root-margin: 24px;

	--MI_THEME-headerHeight: 46px;
	--MI_THEME-headerHeightNarrow: 42px;

	@media (max-width: 500px) {
		--root-margin: 16px;
	}

	&.asDrawer {
		height: calc(100dvh - 30px);
		border-radius: 0;

		.body {
			padding-bottom: env(safe-area-inset-bottom, 0px);
		}

		.footer {
			padding-bottom: max(12px, env(safe-area-inset-bottom, 0px));
		}
	}
}

.header {
	display: flex;
	flex-shrink: 0;
	background: var(--MI_THEME-windowHeader);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
}

.headerButton {
	height: var(--MI_THEME-headerHeight);
	width: var(--MI_THEME-headerHeight);

	@media (max-width: 500px) {
		height: var(--MI_THEME-headerHeightNarrow);
		width: var(--MI_THEME-headerHeightNarrow);
	}
}

.title {
	flex: 1;
	line-height: var(--MI_THEME-headerHeight);
	padding-left: 32px;
	font-weight: bold;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	pointer-events: none;

	@media (max-width: 500px) {
		line-height: var(--MI_THEME-headerHeightNarrow);
		padding-left: 16px;
	}
}

.headerButton + .title {
	padding-left: 0;
}

.body {
	flex: 1;
	overflow: auto;
	background: var(--MI_THEME-bg);
	container-type: size;
}

.footer {
	padding: 12px 16px;
	overflow: auto;
	background: var(--MI_THEME-bg);
	border-top: 1px solid var(--MI_THEME-divider);
}
</style>

<locale locale="ar-SA" lang="json">
{
  "done": "تمّ"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "done": "Fet"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "done": "Hotovo"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "done": "Done"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "done": "Fertig"
}
</locale>

<locale locale="en-US" lang="json">
{
  "done": "Done"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "done": "Hecho"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "done": "Terminé"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "done": "Selesai"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "done": "Fine"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "done": "完了"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "done": "でけた"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "done": "Done"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "done": "Done"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "done": "완료"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "done": "Klaar"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "done": "Ferdig"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "done": "Gotowe"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "done": "Concluído"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "done": "Готово"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "done": "Hotovo"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "done": "เสร็จสิ้น"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "done": "Tamam"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "done": "Done"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "done": "Готово"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "done": "Xong"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "done": "完成"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "done": "完成"
}
</locale>
