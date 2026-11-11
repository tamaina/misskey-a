<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder>
	<template #label>{{ entity.name || entity.url }}</template>
	<template v-if="entity.name != null && entity.name != ''" #caption>{{ entity.url }}</template>
	<template #icon>
		<i v-if="!entity.isActive" class="ti ti-player-pause"></i>
		<i v-else-if="entity.latestStatus === null" class="ti ti-circle"></i>
		<i
			v-else-if="[200, 201, 204].includes(entity.latestStatus)"
			class="ti ti-check"
			:style="{ color: 'var(--MI_THEME-success)' }"
		></i>
		<i v-else class="ti ti-alert-triangle" :style="{ color: 'var(--MI_THEME-error)' }"></i>
	</template>
	<template #suffix>
		<MkTime v-if="entity.latestSentAt" :time="entity.latestSentAt" style="margin-right: 8px"/>
		<span v-else>-</span>
	</template>
	<template #footer>
		<div class="_buttons">
			<MkButton @click="onEditClick">
				<i class="ti ti-settings"></i> {{ globalLocale.env.edit }}
			</MkButton>
			<MkButton danger @click="onDeleteClick">
				<i class="ti ti-trash"></i> {{ globalLocale.env.delete }}
			</MkButton>
		</div>
	</template>

	<div class="_gaps">
		<MkKeyValue>
			<template #key>latestStatus</template>
			<template #value>{{ entity.latestStatus ?? '-' }}</template>
		</MkKeyValue>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { entities } from 'misskey-js';
import { toRefs } from 'vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const emit = defineEmits<{
	(ev: 'edit', value: entities.SystemWebhook): void;
	(ev: 'delete', value: entities.SystemWebhook): void;
}>();

const props = defineProps<{
	entity: entities.SystemWebhook;
}>();

const { entity } = toRefs(props);

function onEditClick() {
	emit('edit', entity.value);
}

function onDeleteClick() {
	emit('delete', entity.value);
}

</script>

<style module lang="scss">
.icon {
	margin-right: 0.75em;
	flex-shrink: 0;
	text-align: center;
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
}
</style>

<locale locale="ar-SA" lang="json">
{}
</locale>

<locale locale="ca-ES" lang="json">
{}
</locale>

<locale locale="cs-CZ" lang="json">
{}
</locale>

<locale locale="da-DK" lang="json">
{}
</locale>

<locale locale="de-DE" lang="json">
{}
</locale>

<locale locale="en-US" lang="json">
{}
</locale>

<locale locale="es-ES" lang="json">
{}
</locale>

<locale locale="fr-FR" lang="json">
{}
</locale>

<locale locale="id-ID" lang="json">
{}
</locale>

<locale locale="it-IT" lang="json">
{}
</locale>

<locale locale="ja-JP" lang="json">
{}
</locale>

<locale locale="ja-KS" lang="json">
{}
</locale>

<locale locale="kab-KAB" lang="json">
{}
</locale>

<locale locale="kn-IN" lang="json">
{}
</locale>

<locale locale="ko-KR" lang="json">
{}
</locale>

<locale locale="nl-NL" lang="json">
{}
</locale>

<locale locale="no-NO" lang="json">
{}
</locale>

<locale locale="pl-PL" lang="json">
{}
</locale>

<locale locale="pt-PT" lang="json">
{}
</locale>

<locale locale="ru-RU" lang="json">
{}
</locale>

<locale locale="sk-SK" lang="json">
{}
</locale>

<locale locale="th-TH" lang="json">
{}
</locale>

<locale locale="tr-TR" lang="json">
{}
</locale>

<locale locale="ug-CN" lang="json">
{}
</locale>

<locale locale="uk-UA" lang="json">
{}
</locale>

<locale locale="vi-VN" lang="json">
{}
</locale>

<locale locale="zh-CN" lang="json">
{}
</locale>

<locale locale="zh-TW" lang="json">
{}
</locale>
