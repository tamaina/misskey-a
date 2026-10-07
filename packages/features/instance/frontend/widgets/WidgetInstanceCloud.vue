<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :naked="widgetProps.transparent" :showHeader="false" class="mkw-instance-cloud">
	<div class="">
		<MkTagCloud v-if="activeInstances" ref="cloud">
			<li v-for="instance in activeInstances" :key="instance.id">
				<a @click.prevent="onInstanceClick(instance)">
					<img style="width: 32px;" :src="getInstanceIcon(instance)">
				</a>
			</li>
		</MkTagCloud>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { shallowRef, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import { useInterval } from '@@/js/use-interval.js';
import { useWidgetPropsManager } from '../../../ui/frontend/widgets/widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from '../../../ui/frontend/widgets/widget.js';
import type { FormWithDefault, GetFormResultType } from '@features/ui/frontend/utility/form.js';
import MkContainer from '@features/ui/frontend/components/MkContainer.vue';
import MkTagCloud from '@features/discovery/frontend/components/MkTagCloud.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { getProxiedImageUrlNullable } from '@features/media/frontend/utility/media-proxy.js';

const name = 'instanceCloud';

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

const cloud = useTemplateRef('cloud');
const activeInstances = shallowRef<Misskey.entities.FederationInstance[] | null>(null);

function onInstanceClick(i: Misskey.entities.FederationInstance) {
	os.pageWindow(`/instance-info/${i.host}`);
}

useInterval(() => {
	misskeyApi('federation/instances', {
		sort: '+latestRequestReceivedAt',
		limit: 25,
	}).then(res => {
		activeInstances.value = res;
		if (cloud.value) cloud.value.update();
	});
}, 1000 * 60 * 3, {
	immediate: true,
	afterMounted: true,
});

function getInstanceIcon(instance: Misskey.entities.FederationInstance): string {
	return getProxiedImageUrlNullable(instance.iconUrl, 'preview') ?? getProxiedImageUrlNullable(instance.faviconUrl, 'preview') ?? '/client-assets/dummy.png';
}

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

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
