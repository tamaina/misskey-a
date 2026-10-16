<!--
SPDX-FileCopyrightText: tamaina
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div class="_gaps_m">
	<MkInfo>{{ $locale.sfc.scope }}</MkInfo>
	<MkInfo v-if="failed" warn role="alert">{{ $locale.sfc.failed }}</MkInfo>
	<MkInfo v-if="saved" role="status">{{ $locale.sfc.saved }}</MkInfo>
	<MkButton :disabled="busy" @click="load">{{ $locale.sfc.load }}</MkButton>
	<form class="_gaps_m" @submit.prevent="save">
		<MkSelect v-model="country" :items="countryItems" :disabled="busy"><template #label>{{ $locale.sfc.country }}</template></MkSelect>
		<MkSelect v-if="requiresSubdivision" v-model="subdivision" :items="subdivisionItems" :disabled="busy"><template #label>{{ $locale.sfc.subdivision }}</template></MkSelect>
		<MkButton type="submit" primary :disabled="busy || !country || (requiresSubdivision && !subdivision)">{{ $locale.sfc.save }}</MkButton>
	</form>
</div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useInternationalization } from 'virtual:vite-vue-internationalization';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import { residenceCountries, residenceSubdivisions } from '../shared/residence-codes.schema.js';
import { countryLabel } from './country-label.js';
import type { ResidenceClient } from './residence-client.js';
const props = defineProps<{ client: ResidenceClient }>();
const country = ref(''), subdivision = ref(''), required = ref<string[]>([]), revision = ref(0), busy = ref(false), failed = ref(false), saved = ref(false);
const internationalization = useInternationalization();
const countryItems = computed<{ value: string; label: string }[]>(() => residenceCountries.map(value => ({ value, label: countryLabel(value, internationalization.locale) })));
const requiresSubdivision = computed(() => required.value.includes(country.value));
const subdivisionItems = computed(() => (residenceSubdivisions[country.value] ?? []).map(value => ({ value, label: value })));
watch(country, () => { subdivision.value = ''; }, { flush: 'sync' });
onMounted(load);

async function run(action: () => Promise<void>) { if (busy.value) return; busy.value = true; failed.value = false; saved.value = false; try { await action(); } catch { failed.value = true; } finally { busy.value = false; } }

async function load() { await run(async () => { const data = await props.client.getResidence({}); required.value = data.requiredSubdivisions; country.value = data.residence?.country ?? ''; subdivision.value = data.residence?.subdivision ?? ''; revision.value = data.residence?.revision ?? 0; }); }

async function save() { await run(async () => { const data = await props.client.setResidence({ revision: revision.value, residence: { country: country.value as typeof residenceCountries[number], subdivision: requiresSubdivision.value ? subdivision.value : null } }); revision.value = data.revision; saved.value = true; }); }
</script>
<locale lang="json" locale="ja-JP">
{"scope":"居住している国を登録してください。運営者の設定で必要な場合は州・地域も選択します。登録は自己申告であり、税務上の所在地が確認済みであることを示すものではありません。ウォレット登録や新しい支払い・送金の開始前に必要です。","country":"居住国（ISO国コード）","subdivision":"州・地域（ISO行政区分コード）","load":"登録内容を再読み込み","save":"居住地を登録する","saved":"居住地を登録しました。ウォレットや支払いの画面で再読込してください。","failed":"登録できませんでした。国・地域と最新の設定を確認してください。"}
</locale>
