<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" :style="`height: ${widgetProps.height}px;`" :scrollable="true" data-testid="mkw-timeline" class="mkw-timeline">
	<template #icon>
		<i v-if="isBasicTimeline(widgetProps.src)" :class="basicTimelineIconClass(widgetProps.src)"></i>
		<i v-else-if="widgetProps.src === 'list'" class="ti ti-list"></i>
		<i v-else-if="widgetProps.src === 'antenna'" class="ti ti-antenna"></i>
	</template>
	<template #header>
		<button class="_button" @click="choose">
			<span>{{ headerTitle }}</span>
			<i :class="menuOpened ? 'ti ti-chevron-up' : 'ti ti-chevron-down'" style="margin-left: 8px;"></i>
		</button>
	</template>

	<div v-if="isBasicTimeline(widgetProps.src) && !isAvailableBasicTimeline(widgetProps.src)" :class="$style.disabled">
		<p :class="$style.disabledTitle">
			<i class="ti ti-minus"></i>
			{{ $locale.sfc.disabledTimelineTitle }}
		</p>
		<p :class="$style.disabledDescription">{{ $locale.sfc.disabledTimelineDescription }}</p>
	</div>
	<div v-else>
		<MkStreamingNotesTimeline
			:key="widgetProps.src === 'list' ? `list:${widgetProps.list?.id}` : widgetProps.src === 'antenna' ? `antenna:${widgetProps.antenna?.id}` : widgetProps.src"
			:src="widgetProps.src"
			:list="widgetProps.list ? widgetProps.list.id : undefined"
			:antenna="widgetProps.antenna ? widgetProps.antenna.id : undefined"
		/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import MkStreamingNotesTimeline from '@features/timelines/frontend/components/MkStreamingNotesTimeline.vue';
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { availableBasicTimelines, isAvailableBasicTimeline, isBasicTimeline, basicTimelineIconClass, basicTimelineTypes } from '@features/timelines/frontend/timelines.js';

const name = 'timeline';

type TlSrc = typeof basicTimelineTypes[number] | 'list' | 'antenna';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		default: true,
	},
	height: {
		type: 'number',
		default: 300,
	},
	src: {
		type: 'string',
		default: 'home' as TlSrc,
		hidden: true,
	},
	antenna: {
		type: 'object',
		default: null as Misskey.entities.Antenna | null,
		hidden: true,
	},
	list: {
		type: 'object',
		default: null as Misskey.entities.UserList | null,
		hidden: true,
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const menuOpened = ref(false);

const headerTitle = computed<string>(() => {
	if (widgetProps.src === 'list') {
		return widgetProps.list != null ? widgetProps.list.name : '?';
	} else if (widgetProps.src === 'antenna') {
		return widgetProps.antenna != null ? widgetProps.antenna.name : '?';
	} else {
		return copyLocaleDictionary($locale.value.sfc.timelinesLabels)[widgetProps.src] ?? '?';
	}
});

const setSrc = (src: TlSrc) => {
	widgetProps.src = src;
	save();
};

const choose = async (ev: PointerEvent) => {
	menuOpened.value = true;
	const [antennas, lists] = await Promise.all([
		misskeyApi('antennas/list'),
		misskeyApi('users/lists/list'),
	]);
	const antennaItems = antennas.map(antenna => ({
		text: antenna.name,
		icon: 'ti ti-antenna',
		action: () => {
			widgetProps.antenna = antenna;
			setSrc('antenna');
		},
	}));
	const listItems = lists.map(list => ({
		text: list.name,
		icon: 'ti ti-list',
		action: () => {
			widgetProps.list = list;
			setSrc('list');
		},
	}));

	const menuItems: MenuItem[] = [];

	menuItems.push(...availableBasicTimelines().map(tl => ({
		text: copyLocaleDictionary($locale.value.sfc.timelinesLabels)[tl],
		icon: basicTimelineIconClass(tl),
		action: () => { setSrc(tl); },
	})));

	if (antennaItems.length > 0) {
		menuItems.push({ type: 'divider' });
		menuItems.push(...antennaItems);
	}

	if (listItems.length > 0) {
		menuItems.push({ type: 'divider' });
		menuItems.push(...listItems);
	}

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target).then(() => {
		menuOpened.value = false;
	});
};

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.disabled {
	text-align: center;
}

.disabledTitle {
	margin: 16px;
}

.disabledDescription {
	font-size: 90%;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesLabels": {
		"home": "الرئيسي",
		"local": "المحلي",
		"social": "الاجتماعي",
		"global": "الشامل"
	}
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"disabledTimelineTitle": "Línia de tems desactivada",
	"disabledTimelineDescription": "No pots fer servir aquesta línia de temps amb els teus rols actuals.",
	"timelinesLabels": {
		"home": "Inici",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	}
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"disabledTimelineTitle": "Časová osa vypnuta",
	"disabledTimelineDescription": "Tuto časovou osu nemůžete používat v rámci svých současných rolí.",
	"timelinesLabels": {
		"home": "Domů",
		"local": "Místní",
		"social": "Sociální síť",
		"global": "Globální"
	}
}
</locale>

<locale lang="json" locale="da-DK">
{
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	}
}
</locale>

<locale lang="json" locale="de-DE">
{
	"disabledTimelineTitle": "Chronik deaktiviert",
	"disabledTimelineDescription": "Mit deinen jetzigen Rollen ist diese Chronik nicht verfügbar.",
	"timelinesLabels": {
		"home": "Startseite",
		"local": "Lokal",
		"social": "Sozial",
		"global": "Global"
	}
}
</locale>

<locale lang="json" locale="en-US">
{
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	}
}
</locale>

<locale lang="json" locale="es-ES">
{
	"disabledTimelineTitle": "Línea de tiempo deshabilitada",
	"disabledTimelineDescription": "No puedes usar esta línea de tiempo con tus roles actuales.",
	"timelinesLabels": {
		"home": "Inicio",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	}
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesLabels": {
		"home": "Principal",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	}
}
</locale>

<locale lang="json" locale="id-ID">
{
	"disabledTimelineTitle": "Lini masa dinonaktifkan",
	"disabledTimelineDescription": "Saat ini kamu tidak dapat menggunakan lini masa ini karena peran kamu saat ini.",
	"timelinesLabels": {
		"home": "Beranda",
		"local": "Lokal",
		"social": "Sosial",
		"global": "Global"
	}
}
</locale>

<locale lang="json" locale="it-IT">
{
	"disabledTimelineTitle": "Timeline disabilitata",
	"disabledTimelineDescription": "Il ruolo in cui sei non ti permette di leggere questa timeline",
	"timelinesLabels": {
		"home": "Home",
		"local": "Locale",
		"social": "Sociale",
		"global": "Federata"
	}
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"disabledTimelineTitle": "無効化されたタイムライン",
	"disabledTimelineDescription": "現在のロールでは、このタイムラインを使用することはできません。",
	"timelinesLabels": {
		"home": "ホーム",
		"local": "ローカル",
		"social": "ソーシャル",
		"global": "グローバル"
	}
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"disabledTimelineTitle": "使われへんタイムライン",
	"disabledTimelineDescription": "あんたの今のロールやったら、このタイムラインは使われへんで。",
	"timelinesLabels": {
		"home": "ホーム",
		"local": "ローカル",
		"social": "ソーシャル",
		"global": "グローバル"
	}
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	}
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	}
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"disabledTimelineTitle": "비활성화된 타임라인",
	"disabledTimelineDescription": "현재 역할에서는 이 타임라인을 이용할 수 없습니다.",
	"timelinesLabels": {
		"home": "홈",
		"local": "로컬",
		"social": "소셜",
		"global": "글로벌"
	}
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesLabels": {
		"home": "Startpagina",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	}
}
</locale>

<locale lang="json" locale="no-NO">
{
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesLabels": {
		"home": "Hjem",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	}
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesLabels": {
		"home": "Strona główna",
		"local": "Lokalne",
		"social": "Społeczność",
		"global": "Globalna"
	}
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"disabledTimelineTitle": "Linha do tempo desabilitada",
	"disabledTimelineDescription": "Você não pode acessar essa linha do tempo sob o seu cargo atual.",
	"timelinesLabels": {
		"home": "Início",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	}
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"disabledTimelineTitle": "Лента отключена",
	"disabledTimelineDescription": "Ваша текущая роль не позволяет пользоваться этой лентой.",
	"timelinesLabels": {
		"home": "Персональная",
		"local": "Местная",
		"social": "Социальная",
		"global": "Всеобщая"
	}
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesLabels": {
		"home": "Domov",
		"local": "Lokálne",
		"social": "Sociálne",
		"global": "Globálne"
	}
}
</locale>

<locale lang="json" locale="th-TH">
{
	"disabledTimelineTitle": "ปิดใช้งานไทม์ไลน์",
	"disabledTimelineDescription": "คุณไม่สามารถใช้ไทม์ไลน์นี้ภายใต้บทบาทปัจจุบันของคุณได้",
	"timelinesLabels": {
		"home": "หน้าหลัก",
		"local": "ท้องถิ่น",
		"social": "โซเชียล",
		"global": "ทั่วโลก"
	}
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"disabledTimelineTitle": "Pano devre dışı bırakıldı",
	"disabledTimelineDescription": "Mevcut rollerinle bu Pano kullanılamaz.",
	"timelinesLabels": {
		"home": "Pano",
		"local": "Yerel",
		"social": "Sosyal",
		"global": "Global"
	}
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	}
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesLabels": {
		"home": "Домівка",
		"local": "Локальна",
		"social": "Соціальна",
		"global": "Глобальна"
	}
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"disabledTimelineTitle": "Timeline disabled",
	"disabledTimelineDescription": "You cannot use this timeline under your current roles.",
	"timelinesLabels": {
		"home": "Trang chính",
		"local": "Máy chủ này",
		"social": "Xã hội",
		"global": "Liên hợp"
	}
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"disabledTimelineTitle": "时间线已禁用",
	"disabledTimelineDescription": "您不能在当前角色使用时间线。",
	"timelinesLabels": {
		"home": "首页",
		"local": "本地",
		"social": "社交",
		"global": "全局"
	}
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"disabledTimelineTitle": "時間軸已停用",
	"disabledTimelineDescription": "目前角色無法使用這個時間軸。",
	"timelinesLabels": {
		"home": "首頁",
		"local": "本地",
		"social": "社交",
		"global": "公開"
	}
}
</locale>
