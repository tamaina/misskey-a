<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" data-testid="mkw-trends" class="mkw-trends">
	<template #icon><i class="ti ti-hash"></i></template>
	<template #header>{{ $locale.sfc.trends }}</template>

	<div class="wbrkwala">
		<MkLoading v-if="fetching"/>
		<TransitionGroup v-else tag="div" :name="prefer.s.animation ? 'chart' : ''" class="tags">
			<div v-for="stat in stats" :key="stat.tag">
				<div class="tag">
					<MkA class="a" :to="`/tags/${ encodeURIComponent(stat.tag) }`" :title="stat.tag">#{{ stat.tag }}</MkA>
					<p>{{ $l.sfc.nUsersMentioned({ n: stat.usersCount }) }}</p>
				</div>
				<MkMiniChart class="chart" :src="stat.chart"/>
			</div>
		</TransitionGroup>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useInterval } from '@features/ui/frontend/shared/use-interval.js';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import MkMiniChart from '@features/statistics/frontend/components/MkMiniChart.vue';
import { misskeyApiGet } from '@features/api/frontend/utility/misskey-api.js';
import { prefer } from '@features/preferences/frontend/preferences.js';

const name = 'trends';

const widgetPropsDef = {
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

const stats = ref<Misskey.entities.HashtagsTrendResponse>([]);
const fetching = ref(true);

const fetch = () => {
	misskeyApiGet('hashtags/trend').then(res => {
		stats.value = res;
		fetching.value = false;
	});
};

useInterval(fetch, 1000 * 60, {
	immediate: true,
	afterMounted: true,
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.wbrkwala {
	height: (62px + 1px) + (62px + 1px) + (62px + 1px) + (62px + 1px) + 62px;
	overflow: hidden;

	> .tags {
		.chart-move {
			transition: transform 1s ease;
		}

		> div {
			display: flex;
			align-items: center;
			padding: 14px 16px;
			border-bottom: solid 0.5px var(--MI_THEME-divider);

			> .tag {
				flex: 1;
				overflow: hidden;
				font-size: 0.9em;
				color: var(--MI_THEME-fg);

				> .a {
					display: block;
					width: 100%;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					line-height: 18px;
				}

				> p {
					margin: 0;
					font-size: 75%;
					opacity: 0.7;
					line-height: 16px;
				}
			}

			> .chart {
				height: 30px;
			}
		}
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"trends": "المتداوَلة",
	"nUsersMentioned": "{n} مستخدمين أُشير إليهم",
	"showHeader": "Show header"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"trends": "Tendència",
	"nUsersMentioned": "{n} usuaris mencionats",
	"showHeader": "Mostrar la capçalera"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"trends": "Trendy",
	"nUsersMentioned": "{n} uživatelů zmínilo",
	"showHeader": "Show header"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"trends": "Trending",
	"nUsersMentioned": "Mentioned by {n} users",
	"showHeader": "Show header"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"trends": "Trends",
	"nUsersMentioned": "Von {n} Benutzern erwähnt",
	"showHeader": "Kopfzeile anzeigen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"trends": "Trending",
	"nUsersMentioned": "Mentioned by {n} users",
	"showHeader": "Show header"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"trends": "Tendencias",
	"nUsersMentioned": "{n} usuarios mencionados",
	"showHeader": "Mostrar encabezados"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"trends": "Tendances",
	"nUsersMentioned": "{n} utilisateur·rice·s mentionné·e·s",
	"showHeader": "Show header"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"trends": "Tren",
	"nUsersMentioned": "{n} pengguna disebut",
	"showHeader": "Show header"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"trends": "Hashtag popolari",
	"nUsersMentioned": "{n} profili ne parlano",
	"showHeader": "Mostra la testata"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"trends": "トレンド",
	"nUsersMentioned": "{n}人が投稿",
	"showHeader": "ヘッダーを表示"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"trends": "トレンド",
	"nUsersMentioned": "{n}人が投稿",
	"showHeader": "ヘッダー出す"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"trends": "Trending",
	"nUsersMentioned": "Mentioned by {n} users",
	"showHeader": "Show header"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"trends": "Trending",
	"nUsersMentioned": "Mentioned by {n} users",
	"showHeader": "Show header"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"trends": "트렌드",
	"nUsersMentioned": "{n}명이 언급함",
	"showHeader": "해더를 표시"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"trends": "Trending",
	"nUsersMentioned": "Vermeld door {n} gebruikers",
	"showHeader": "Show header"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"trends": "Populært",
	"nUsersMentioned": "Mentioned by {n} users",
	"showHeader": "Show header"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"trends": "Na czasie",
	"nUsersMentioned": "{n} wspomnianych użytkowników",
	"showHeader": "Show header"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"trends": "Destaques",
	"nUsersMentioned": "Postado por {n} pessoas",
	"showHeader": "Exibir cabeçalho"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"trends": "Актуальное",
	"nUsersMentioned": "Упомянуло пользователей: {n}",
	"showHeader": "Show header"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"trends": "Trendy",
	"nUsersMentioned": "{n} používateľov spomenulo",
	"showHeader": "Show header"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"trends": "กำลังมาแรง",
	"nUsersMentioned": "กล่าวถึงโดยผู้ใช้ {n} ราย",
	"showHeader": "แสดงส่วนหัว"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"trends": "Trend olan",
	"nUsersMentioned": "{n} kullanıcı bahsetti",
	"showHeader": "Başlığı göster"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"trends": "Trending",
	"nUsersMentioned": "Mentioned by {n} users",
	"showHeader": "Show header"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"trends": "Тенденції",
	"nUsersMentioned": "Згадали: {n}",
	"showHeader": "Show header"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"trends": "Xu hướng",
	"nUsersMentioned": "Dùng bởi {n} người",
	"showHeader": "Show header"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"trends": "趋势",
	"nUsersMentioned": "{n}人投稿",
	"showHeader": "显示标题"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"trends": "熱門貼文",
	"nUsersMentioned": "被 {n} 個人提及",
	"showHeader": "檢視標頭 "
}
</locale>
