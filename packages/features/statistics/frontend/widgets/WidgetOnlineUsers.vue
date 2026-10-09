<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div data-testid="mkw-onlineUsers" :class="[$style.root, { _panel: !widgetProps.transparent, [$style.pad]: !widgetProps.transparent }]">
	<span :class="$style.text">
		<I18n v-if="onlineUsersCount" :src="$locale.sfc.onlineUsersCount" textTag="span">
			<template #n><b style="color: #41b781;">{{ number(onlineUsersCount) }}</b></template>
		</I18n>
	</span>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import { misskeyApiGet } from '@features/api/frontend/utility/misskey-api.js';
import { useInterval } from '@features/ui/frontend/shared/use-interval.js';
import number from '@features/ui/frontend/filters/number.js';

const name = 'onlineUsers';

const widgetPropsDef = {
	transparent: {
		type: 'boolean',
		label: $locale.value.sfc.widgetOptionsTransparent,
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

const onlineUsersCount = ref(0);

const tick = () => {
	misskeyApiGet('get-online-users-count').then(res => {
		onlineUsersCount.value = res.count;
	});
};

useInterval(tick, 1000 * 15, {
	immediate: true,
	afterMounted: true,
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	text-align: center;

	&.pad {
		padding: 16px 0;
	}
}

.text {
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"onlineUsersCount": "{n} مستخدم متصل",
	"widgetOptionsTransparent": "Make background transparent"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"onlineUsersCount": "{n} Usuaris es troben en línia ",
	"widgetOptionsTransparent": "Fons transparent"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"onlineUsersCount": "{n} uživatelů je online",
	"widgetOptionsTransparent": "Make background transparent"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"onlineUsersCount": "{n} users are online",
	"widgetOptionsTransparent": "Make background transparent"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"onlineUsersCount": "{n} Benutzer sind online",
	"widgetOptionsTransparent": "Hintergrund transparent machen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"onlineUsersCount": "{n} users are online",
	"widgetOptionsTransparent": "Make background transparent"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"onlineUsersCount": "{n} usuarios en línea",
	"widgetOptionsTransparent": "Hacer fondo transparente"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"onlineUsersCount": "{n} utilisateur(s) en ligne",
	"widgetOptionsTransparent": "Make background transparent"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"onlineUsersCount": "{n} orang sedang daring",
	"widgetOptionsTransparent": "Make background transparent"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"onlineUsersCount": "{n} persone attive adesso",
	"widgetOptionsTransparent": "Sfondo trasparente"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"onlineUsersCount": "{n}人がオンライン",
	"widgetOptionsTransparent": "背景を透明にする"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"onlineUsersCount": "{n}人が起きとるで",
	"widgetOptionsTransparent": "背景を透明にする"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"onlineUsersCount": "{n} users are online",
	"widgetOptionsTransparent": "Make background transparent"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"onlineUsersCount": "{n} users are online",
	"widgetOptionsTransparent": "Make background transparent"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"onlineUsersCount": "{n}명이 접속 중",
	"widgetOptionsTransparent": "배경을 투명하게 설정"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"onlineUsersCount": "{n} Gebruikers zijn online",
	"widgetOptionsTransparent": "Make background transparent"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"onlineUsersCount": "{n} users are online",
	"widgetOptionsTransparent": "Make background transparent"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"onlineUsersCount": "{n} osób jest online",
	"widgetOptionsTransparent": "Make background transparent"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"onlineUsersCount": "{n} Pessoas Online",
	"widgetOptionsTransparent": "Make background transparent"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"onlineUsersCount": "Пользователей сейчас в сети: {n}",
	"widgetOptionsTransparent": "Make background transparent"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"onlineUsersCount": "{n} používateľov je online",
	"widgetOptionsTransparent": "Make background transparent"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"onlineUsersCount": "{n} รายกำลังออนไลน์",
	"widgetOptionsTransparent": "ทำพื้นหลังโปรงใส"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"onlineUsersCount": "{n} kullanıcı çevrim içi",
	"widgetOptionsTransparent": "Arka planı şeffaf yapın"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"onlineUsersCount": "{n} users are online",
	"widgetOptionsTransparent": "Make background transparent"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"onlineUsersCount": "{n} користувачів онлайн",
	"widgetOptionsTransparent": "Make background transparent"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"onlineUsersCount": "{n} người đang online",
	"widgetOptionsTransparent": "Make background transparent"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"onlineUsersCount": "{n} 人在线",
	"widgetOptionsTransparent": "使背景透明"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"onlineUsersCount": "{n} 人上線",
	"widgetOptionsTransparent": "使背景透明"
}
</locale>
