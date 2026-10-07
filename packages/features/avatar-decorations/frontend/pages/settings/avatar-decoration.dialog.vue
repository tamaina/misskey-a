<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	@close="cancel"
	@closed="emit('closed')"
>
	<template #header>{{ $locale.sfc.avatarDecorations }}</template>

	<div>
		<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
			<div style="text-align: center;">
				<div :class="$style.name">{{ decoration.name }}</div>
				<MkAvatar style="width: 64px; height: 64px; margin-bottom: 20px;" :user="$i" :decorations="decorationsForPreview" forceShowDecoration/>
			</div>
			<div class="_gaps_s">
				<MkRange v-model="angle" continuousUpdate :min="-0.5" :max="0.5" :step="0.025" :textConverter="(v) => `${Math.floor(v * 360)}°`">
					<template #label>{{ $locale.sfc.angle }}</template>
				</MkRange>
				<MkRange v-model="offsetX" continuousUpdate :min="-0.25" :max="0.25" :step="0.025" :textConverter="(v) => `${Math.floor(v * 100)}%`">
					<template #label>X {{ $locale.sfc.position }}</template>
				</MkRange>
				<MkRange v-model="offsetY" continuousUpdate :min="-0.25" :max="0.25" :step="0.025" :textConverter="(v) => `${Math.floor(v * 100)}%`">
					<template #label>Y {{ $locale.sfc.position }}</template>
				</MkRange>
				<MkSwitch v-model="flipH">
					<template #label>{{ $locale.sfc.flip }}</template>
				</MkSwitch>
			</div>
		</div>

		<div :class="$style.footer" class="_buttonsCenter">
			<MkButton v-if="usingIndex != null" primary rounded @click="update"><i class="ti ti-check"></i> {{ $locale.sfc.update }}</MkButton>
			<MkButton v-if="usingIndex != null" rounded @click="detach"><i class="ti ti-x"></i> {{ $locale.sfc.detach }}</MkButton>
			<MkButton v-else :disabled="exceeded || locked" primary rounded @click="attach"><i class="ti ti-check"></i> {{ $locale.sfc.attach }}</MkButton>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { useTemplateRef, ref, computed } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkRange from '@features/ui/frontend/components/MkRange.vue';
import { ensureSignin } from '@features/auth/frontend/i.js';

const $i = ensureSignin();

const props = defineProps<{
	usingIndex: number | null;
	decoration: {
		id: string;
		url: string;
		name: string;
		roleIdsThatCanBeUsedThisDecoration: string[];
	};
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'attach', payload: {
		angle: number;
		flipH: boolean;
		offsetX: number;
		offsetY: number;
	}): void;
	(ev: 'update', payload: {
		angle: number;
		flipH: boolean;
		offsetX: number;
		offsetY: number;
	}): void;
	(ev: 'detach'): void;
}>();

const dialog = useTemplateRef('dialog');
const exceeded = computed(() => ($i.policies.avatarDecorationLimit - $i.avatarDecorations.length) <= 0);
const locked = computed(() => props.decoration.roleIdsThatCanBeUsedThisDecoration.length > 0 && !$i.roles.some(r => props.decoration.roleIdsThatCanBeUsedThisDecoration.includes(r.id)));
const angle = ref((props.usingIndex != null ? $i.avatarDecorations[props.usingIndex].angle : null) ?? 0);
const flipH = ref((props.usingIndex != null ? $i.avatarDecorations[props.usingIndex].flipH : null) ?? false);
const offsetX = ref((props.usingIndex != null ? $i.avatarDecorations[props.usingIndex].offsetX : null) ?? 0);
const offsetY = ref((props.usingIndex != null ? $i.avatarDecorations[props.usingIndex].offsetY : null) ?? 0);

const decorationsForPreview = computed(() => {
	const decoration = {
		id: props.decoration.id,
		url: props.decoration.url,
		angle: angle.value,
		flipH: flipH.value,
		offsetX: offsetX.value,
		offsetY: offsetY.value,
		blink: true,
	};
	const decorations = [...$i.avatarDecorations];
	if (props.usingIndex != null) {
		decorations[props.usingIndex] = decoration;
	} else {
		decorations.push(decoration);
	}
	return decorations;
});

function cancel() {
	dialog.value?.close();
}

async function update() {
	emit('update', {
		angle: angle.value,
		flipH: flipH.value,
		offsetX: offsetX.value,
		offsetY: offsetY.value,
	});
	dialog.value?.close();
}

async function attach() {
	emit('attach', {
		angle: angle.value,
		flipH: flipH.value,
		offsetX: offsetX.value,
		offsetY: offsetY.value,
	});
	dialog.value?.close();
}

async function detach() {
	emit('detach');
	dialog.value?.close();
}
</script>

<style lang="scss" module>
.name {
	position: relative;
	z-index: 10;
	font-weight: bold;
	margin-bottom: 28px;
}

.footer {
	position: sticky;
	bottom: 0;
	left: 0;
	padding: 12px;
	border-top: solid 0.5px var(--MI_THEME-divider);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
}
</style>

<locale locale="ar-SA" lang="json">
{
  "avatarDecorations": "Avatar decorations",
  "angle": "Angle",
  "position": "الموضع",
  "flip": "اقلب",
  "update": "حدِّث",
  "detach": "Remove",
  "attach": "Attach"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "avatarDecorations": "Decoracions dels avatars",
  "angle": "Angle",
  "position": "Posició ",
  "flip": "Girar",
  "update": "Actualitzar",
  "detach": "Eliminar",
  "attach": "Adjuntar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "avatarDecorations": "Avatar decorations",
  "angle": "Angle",
  "position": "Pozice",
  "flip": "Otočit",
  "update": "Aktualizovat",
  "detach": "Remove",
  "attach": "Attach"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "avatarDecorations": "Avatar decorations",
  "angle": "Angle",
  "position": "Position",
  "flip": "Flip",
  "update": "Update",
  "detach": "Remove",
  "attach": "Attach"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "avatarDecorations": "Profilbilddekoration",
  "angle": "Winkel",
  "position": "Position",
  "flip": "Umdrehen",
  "update": "Aktualisieren",
  "detach": "Entfernen",
  "attach": "Anbringen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "avatarDecorations": "Avatar decorations",
  "angle": "Angle",
  "position": "Position",
  "flip": "Flip",
  "update": "Update",
  "detach": "Remove",
  "attach": "Attach"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "avatarDecorations": "Decoraciones de avatar",
  "angle": "Ángulo",
  "position": "Posición",
  "flip": "Echar de un capirotazo",
  "update": "Actualizar",
  "detach": "Quitar",
  "attach": "Acoplar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "avatarDecorations": "Décorations d'avatar",
  "angle": "Angle",
  "position": "Position",
  "flip": "Inverser",
  "update": "Mettre à jour",
  "detach": "Enlever",
  "attach": "Mettre"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "avatarDecorations": "Dekorasi avatar",
  "angle": "Sudut",
  "position": "Posisi",
  "flip": "Balik",
  "update": "Perbarui",
  "detach": "Hapus",
  "attach": "Lampirkan"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "avatarDecorations": "Decorazioni foto profilo",
  "angle": "Angolo",
  "position": "Posizione",
  "flip": "Inverti",
  "update": "Aggiorna",
  "detach": "Rimuovi",
  "attach": "Applica"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "avatarDecorations": "アイコンデコレーション",
  "angle": "角度",
  "position": "位置",
  "flip": "反転",
  "update": "更新",
  "detach": "外す",
  "attach": "付ける"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "avatarDecorations": "アイコンデコレーション",
  "angle": "角度",
  "position": "位置",
  "flip": "反転",
  "update": "更新",
  "detach": "取る",
  "attach": "のっける"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "avatarDecorations": "Avatar decorations",
  "angle": "Angle",
  "position": "Position",
  "flip": "Flip",
  "update": "Update",
  "detach": "Remove",
  "attach": "Attach"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "avatarDecorations": "Avatar decorations",
  "angle": "Angle",
  "position": "Position",
  "flip": "Flip",
  "update": "Update",
  "detach": "Remove",
  "attach": "Attach"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "avatarDecorations": "아바타 장식",
  "angle": "각도",
  "position": "위치",
  "flip": "플립",
  "update": "업데이트",
  "detach": "빼기",
  "attach": "붙이기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "avatarDecorations": "Avatar decorations",
  "angle": "Angle",
  "position": "Position",
  "flip": "Flip",
  "update": "Update",
  "detach": "Remove",
  "attach": "Attach"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "avatarDecorations": "Avatar decorations",
  "angle": "Angle",
  "position": "Position",
  "flip": "Flip",
  "update": "Update",
  "detach": "Remove",
  "attach": "Attach"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "avatarDecorations": "Avatar decorations",
  "angle": "Angle",
  "position": "Position",
  "flip": "Odwróć",
  "update": "Update",
  "detach": "Remove",
  "attach": "Attach"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "avatarDecorations": "Decorações de avatar",
  "angle": "Ângulo",
  "position": "Posição",
  "flip": "Inversão",
  "update": "Atualizar",
  "detach": "Remover",
  "attach": "Anexar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "avatarDecorations": "Украшения для аватара",
  "angle": "Угол",
  "position": "Позиция",
  "flip": "Переворот",
  "update": "Обновить",
  "detach": "Открепить",
  "attach": "Прикрепить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "avatarDecorations": "Avatar decorations",
  "angle": "Angle",
  "position": "Position",
  "flip": "Preklopiť",
  "update": "Update",
  "detach": "Remove",
  "attach": "Attach"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "avatarDecorations": "ของตกแต่งไอคอน",
  "angle": "แองเกิล",
  "position": "ตำแหน่ง",
  "flip": "พลิก",
  "update": "อัปเดต",
  "detach": "นำออก",
  "attach": "แนบ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "avatarDecorations": "Avatar süsleri",
  "angle": "Açı",
  "position": "Pozisyon",
  "flip": "Çevir",
  "update": "Güncelle",
  "detach": "Kaldır",
  "attach": "Ek"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "avatarDecorations": "Avatar decorations",
  "angle": "Angle",
  "position": "Position",
  "flip": "Flip",
  "update": "Update",
  "detach": "Remove",
  "attach": "Attach"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "avatarDecorations": "Прикраси аватара",
  "angle": "Кут",
  "position": "Позиція",
  "flip": "Перевернути",
  "update": "Оновити",
  "detach": "Відкріпити",
  "attach": "Прикріпити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "avatarDecorations": "Trang trí ảnh đại diện",
  "angle": "Góc",
  "position": "Vị trí",
  "flip": "Lật",
  "update": "Cập nhật",
  "detach": "Bỏ",
  "attach": "Mặc"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "avatarDecorations": "头像挂件",
  "angle": "角度",
  "position": "位置",
  "flip": "翻转",
  "update": "更新",
  "detach": "卸下",
  "attach": "佩戴"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "avatarDecorations": "頭像裝飾",
  "angle": "角度",
  "position": "位置",
  "flip": "翻轉",
  "update": "更新",
  "detach": "取下",
  "attach": "裝上"
}
</locale>
