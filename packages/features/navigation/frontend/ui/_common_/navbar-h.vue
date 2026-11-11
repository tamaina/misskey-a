<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, acrylic ? $style.acrylic : null]">
	<div :class="$style.body">
		<div>
			<button v-click-anime :class="[$style.item, $style.instance]" class="_button" @click="openInstanceMenu">
				<img :class="$style.instanceIcon" :src="instance.iconUrl ?? '/favicon.ico'" draggable="false"/>
			</button>
			<MkA v-click-anime v-tooltip="globalLocale.env.timeline" :class="$style.item" :activeClass="$style.active" to="/" exact>
				<i :class="$style.itemIcon" class="ti ti-home ti-fw"></i>
			</MkA>
			<template v-for="item in menu">
				<div v-if="item === '-'" :class="$style.divider"></div>
				<component :is="navbarItemDef[item].to ? 'MkA' : 'button'" v-else-if="navbarItemDef[item] && (navbarItemDef[item].show == null || navbarItemDef[item].show.value !== false)" v-click-anime v-tooltip="navbarItemDef[item].title" class="_button" :class="$style.item" :activeClass="$style.active" :to="navbarItemDef[item].to" v-on="navbarItemDef[item].action ? { click: navbarItemDef[item].action } : {}">
					<i :class="[$style.itemIcon, navbarItemDef[item].icon]" class="ti-fw"></i>
					<span v-if="navbarItemDef[item].indicated" :class="$style.indicator" class="_blink"><i class="_indicatorCircle"></i></span>
				</component>
			</template>
			<div :class="$style.divider"></div>
			<MkA v-if="$i && ($i.isAdmin || $i.isModerator)" v-click-anime v-tooltip="$locale.sfc.controlPanel" class="item" :activeClass="$style.active" to="/admin" :behavior="settingsWindowed ? 'window' : null">
				<i :class="$style.itemIcon" class="ti ti-dashboard ti-fw"></i>
			</MkA>
			<button v-click-anime :class="$style.item" class="_button" @click="more">
				<i :class="$style.itemIcon" class="ti ti-dots ti-fw"></i>
				<span v-if="otherNavItemIndicated" :class="$style.indicator" class="_blink"><i class="_indicatorCircle"></i></span>
			</button>
		</div>
		<div :class="$style.right">
			<MkA v-click-anime v-tooltip="globalLocale.env.settings" :class="$style.item" :activeClass="$style.active" to="/settings" :behavior="settingsWindowed ? 'window' : null">
				<i :class="$style.itemIcon" class="ti ti-settings ti-fw"></i>
			</MkA>
			<button v-if="$i" v-click-anime :class="[$style.item, $style.account]" class="_button" @click="openAccountMenu">
				<MkAvatar :user="$i" :class="$style.avatar"/><MkAcct :class="$style.acct" :user="$i"/>
			</button>
			<div :class="$style.post" @click="os.post()">
				<MkButton :class="$style.postButton" gradate rounded>
					<i class="ti ti-pencil ti-fw"></i>
				</MkButton>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import { openInstanceMenu } from '@features/navigation/frontend/ui/_common_/common.js';
import * as os from '@features/ui/frontend/os.js';
import { navbarItemDef } from '@features/navigation/frontend/navbar.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { instance } from '@features/instance/frontend/instance.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { getAccountMenu } from '@features/auth/frontend/accounts.js';
import { $i } from '@features/auth/frontend/i.js';
import { getHTMLElementOrNull } from '@features/ui/frontend/utility/get-dom-node-or-null.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const WINDOW_THRESHOLD = 1400;

const props = defineProps<{
	acrylic?: boolean;
}>();

const settingsWindowed = ref(window.innerWidth > WINDOW_THRESHOLD);
const menu = ref(prefer.s.menu);
// const menuDisplay = store.model('menuDisplay');
const otherNavItemIndicated = computed<boolean>(() => {
	for (const def in navbarItemDef) {
		if (menu.value.includes(def)) continue;
		if (navbarItemDef[def].indicated) return true;
	}
	return false;
});

async function more(ev: PointerEvent) {
	const target = getHTMLElementOrNull(ev.currentTarget ?? ev.target);
	if (!target) return;

	const { dispose } = await os.popupAsyncWithDialog(import('@features/navigation/frontend/components/MkLaunchPad.vue').then(x => x.default), {
		anchorElement: target,
		anchor: { x: 'center', y: 'bottom' },
	}, {
		closed: () => dispose(),
	});
}

async function openAccountMenu(ev: PointerEvent) {
	const menuItems = await getAccountMenu({
		withExtraOperation: true,
	});

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}

onMounted(() => {
	window.addEventListener('resize', () => {
		settingsWindowed.value = (window.innerWidth >= WINDOW_THRESHOLD);
	}, { passive: true });
});

</script>

<style lang="scss" module>
.root {
	--height: 60px;

	position: sticky;
	top: 0;
	z-index: 1000;
	width: 100%;
	height: var(--height);
	contain: strict;
	background: var(--MI_THEME-navBg);

	&.acrylic {
		background: color(from var(--MI_THEME-bg) srgb r g b / 0.75);
		-webkit-backdrop-filter: var(--MI-blur, blur(15px));
		backdrop-filter: var(--MI-blur, blur(15px));
	}
}

.body {
	max-width: 1380px;
	margin: 0 auto;
	display: flex;
	overflow: auto;
	overflow-y: clip;
	white-space: nowrap;
}

.item {
	position: relative;
	font-size: 0.9em;
	display: inline-block;
	padding: 0 12px;
	line-height: var(--height);

	&:hover {
		text-decoration: none;
		color: light-dark(hsl(from var(--MI_THEME-navFg) h s calc(l - 17)), hsl(from var(--MI_THEME-navFg) h s calc(l + 17)));
	}

	&.active {
		color: var(--MI_THEME-navActive);
	}
}

.itemIcon {
	margin-right: 0;
	left: 10px;
}

.avatar {
	margin-right: 0;
	width: 32px;
	height: 32px;
	vertical-align: middle;
}

.acct {
	margin-left: 8px;

	@media (max-width: 1200px) {
		display: none;
	}
}

.indicator {
	position: absolute;
	top: 0;
	left: 0;
	color: var(--MI_THEME-navIndicator);
	font-size: 8px;
}

.divider {
	display: inline-block;
	height: 16px;
	margin: 0 10px;
	border-right: solid 0.5px var(--MI_THEME-divider);
}

.instance {
	display: inline-block;
	position: relative;
	width: 56px;
	height: 100%;
	vertical-align: bottom;
	position: sticky;
	top: 0;
	left: 0;
	z-index: 1;
}

.instanceIcon {
	display: inline-block;
	width: 24px;
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	margin: auto;
}

.right {
	display: flex;
	align-items: center;
	margin-left: auto;
	position: sticky;
	top: 0;
	right: 0;
	z-index: 1;
	contain: content;
	background: var(--MI_THEME-navBg);
}
.acrylic .right {
	background: transparent;
}

.post {
	display: inline-block;
	margin-right: 8px;
}

.postButton {
	width: 40px;
	height: 40px;
	padding: 0;
	min-width: 0;
}

.account {
	display: inline-flex;
	align-items: center;
	vertical-align: top;
	margin-right: 8px;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "controlPanel": "لوحة التحكم"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "controlPanel": "Tauler de control"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "controlPanel": "Ovládací panel"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "controlPanel": "Control Panel"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "controlPanel": "Systemsteuerung"
}
</locale>

<locale locale="en-US" lang="json">
{
  "controlPanel": "Control Panel"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "controlPanel": "Panel de control"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "controlPanel": "Panneau de configuration"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "controlPanel": "Panel kendali"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "controlPanel": "Pannello di controllo"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "controlPanel": "コントロールパネル"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "controlPanel": "コントロールパネル"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "controlPanel": "Control Panel"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "controlPanel": "Control Panel"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "controlPanel": "제어판"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "controlPanel": "Controlepaneel"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "controlPanel": "Control Panel"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "controlPanel": "Panel sterowania"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "controlPanel": "Painel de controle"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "controlPanel": "Панель управления"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "controlPanel": "Ovládací panel"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "controlPanel": "แผงควบคุม"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "controlPanel": "Kontrol Paneli"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "controlPanel": "Control Panel"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "controlPanel": "Панель керування"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "controlPanel": "Bảng điều khiển"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "controlPanel": "控制面板"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "controlPanel": "控制臺"
}
</locale>
