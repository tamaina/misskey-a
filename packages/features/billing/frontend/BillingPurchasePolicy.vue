<!--
SPDX-FileCopyrightText: tamaina
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div class="_gaps_m">
	<MkInfo>{{ $locale.sfc.scope }}</MkInfo>
	<MkInfo v-if="error" warn role="alert">{{ $locale.sfc.failed }}</MkInfo>
	<MkInfo v-if="saved" role="status">{{ $locale.sfc.saved }}</MkInfo>
	<MkButton :disabled="busy" @click="load">{{ $locale.sfc.load }}</MkButton>
	<form class="_gaps_m" @submit.prevent="save">
		<FormSection>
			<template #label>{{ $locale.sfc.countryEligibility }}</template>
			<MkInfo>{{ $locale.sfc.countryScope }}</MkInfo>
			<MkSelect v-model="operatorCountry" :items="operatorCountryItems" :disabled="busy"><template #label>{{ $locale.sfc.operatorCountry }}</template></MkSelect>
			<MkSelect v-model="countryMode" :items="[{ value: 'domestic', label: $locale.sfc.domestic }, { value: 'allow', label: $locale.sfc.explicitCountries }]" :disabled="busy"><template #label>{{ $locale.sfc.countryMode }}</template></MkSelect>
			<MkTextarea v-if="countryMode === 'allow'" v-model="allowedCountries" :disabled="busy"><template #label>{{ $locale.sfc.allowedCountries }}</template><template #caption>{{ allowedCountryLabels }}</template></MkTextarea>
		</FormSection>
		<MkSwitch v-model="policy.isEnabled" :disabled="busy">{{ $locale.sfc.enabled }}</MkSwitch>
		<MkTextarea v-model="cidrs" :disabled="busy"><template #label>{{ $locale.sfc.peers }}</template><template #caption>{{ $locale.sfc.peerCaption }}</template></MkTextarea>
		<FormSection>
			<template #label>{{ $locale.sfc.regions }}</template>
			<MkSelect v-model="policy.regionRules.mode" :items="[{ value: 'allow', label: $locale.sfc.allow }, { value: 'deny', label: $locale.sfc.deny }]" :disabled="busy"><template #label>{{ $locale.sfc.mode }}</template></MkSelect>
			<div v-for="(rule, index) in rules" :key="index" class="_gaps_s">
				<MkInput v-model="rule.country" :disabled="busy"><template #label>{{ $locale.sfc.country }}</template><template #caption>{{ countryLabel(rule.country, internationalization.locale) }}</template></MkInput>
				<MkInput v-model="rule.regionCode" :disabled="busy"><template #label>{{ $locale.sfc.regionCode }}</template></MkInput>
				<MkInput v-model="rule.continent" :disabled="busy"><template #label>{{ $locale.sfc.continent }}</template></MkInput>
				<MkSelect v-model="rule.eu" :items="[{ value: 'any', label: $locale.sfc.any }, { value: 'yes', label: $locale.sfc.yes }, { value: 'no', label: $locale.sfc.no }]" :disabled="busy"><template #label>{{ $locale.sfc.eu }}</template></MkSelect>
				<MkButton :disabled="busy" @click="rules.splice(index, 1)">{{ $locale.sfc.remove }}</MkButton>
			</div>
			<MkButton :disabled="busy" @click="rules.push({ country: '', regionCode: '', continent: '', eu: 'any' })">{{ $locale.sfc.add }}</MkButton>
		</FormSection>
		<FormSection><template #label>{{ $locale.sfc.residenceRegistration }}</template><MkTextarea v-model="residenceRequired" :disabled="busy"><template #label>{{ $locale.sfc.requiredSubdivisions }}</template><template #caption>{{ requiredCountryLabels }}</template></MkTextarea></FormSection>
		<FormSection>
			<template #label>{{ $locale.sfc.tax }}</template>
			<MkInput v-model="policy.taxName" :disabled="busy"><template #label>{{ $locale.sfc.taxName }}</template></MkInput>
			<MkInput v-model="policy.taxRate" :disabled="busy"><template #label>{{ $locale.sfc.taxRate }}</template><template #caption>{{ $locale.sfc.rateCaption }}</template></MkInput>
			<MkInput v-model="policy.seller.name" :disabled="busy"><template #label>{{ $locale.sfc.seller }}</template></MkInput>
			<MkTextarea v-model="policy.seller.address" :disabled="busy"><template #label>{{ $locale.sfc.address }}</template></MkTextarea>
			<MkInput v-model="policy.seller.invoiceRegistrationNumber" :disabled="busy"><template #label>{{ $locale.sfc.registration }}</template></MkInput>
		</FormSection>
		<FormSection>
			<template #label>{{ $locale.sfc.statements }}</template>
			<MkInfo>{{ $locale.sfc.versionCaption }}</MkInfo>
			<MkTextarea v-model="policy.statementText" :disabled="busy"><template #label>{{ $locale.sfc.statement }}</template></MkTextarea>
		</FormSection>
		<MkButton type="submit" primary :disabled="busy">{{ $locale.sfc.save }}</MkButton>
	</form>
</div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useInternationalization } from 'virtual:vite-vue-internationalization';
import * as v from 'valibot';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import { billingPolicy } from '../backend/policy.schema.js';
import type { BillingPolicy } from '../backend/policy.schema.js';
import { residenceCountries } from '../shared/residence-codes.schema.js';
import { countryLabel } from './country-label.js';
import type { BillingPolicyClient } from './policy-client.js';
const props = defineProps<{ client: Pick<BillingPolicyClient, 'getBillingPolicy' | 'upsertBillingPolicy'> }>();
const policy = ref<BillingPolicy>({ isEnabled: false, trustedProxyCidrs: [], regionRules: { mode: 'allow', rules: [{}] }, taxName: '', taxRate: '0', seller: { name: '', address: '', invoiceRegistrationNumber: '' }, statementText: '' });
const internationalization = useInternationalization();
const operatorCountry = ref(''), countryMode = ref<'domestic' | 'allow'>('domestic'), allowedCountries = ref('');
const operatorCountryItems = computed(() => [{ value: '', label: '—' }, ...residenceCountries.map(value => ({ value, label: countryLabel(value, internationalization.locale) }))]);
const allowedCountryLabels = computed(() => allowedCountries.value.split(/\r?\n/).filter(value => value.trim()).map(value => countryLabel(value, internationalization.locale)).join(', '));
const residenceRequired = ref('');
const requiredCountryLabels = computed(() => residenceRequired.value.split(/\r?\n/).filter(value => value.trim()).map(value => countryLabel(value, internationalization.locale)).join(', '));
const cidrs = ref(''), revision = ref(0), busy = ref(false), error = ref(false), saved = ref(false);
const rules = ref<Array<{ country: string; regionCode: string; continent: string; eu: 'any' | 'yes' | 'no' }>>([{ country: '', regionCode: '', continent: '', eu: 'any' }]);

function select(input: { revision: number; policy: BillingPolicy }) {
	residenceRequired.value = (input.policy.residenceRequiredSubdivisions ?? []).join('\n');
	operatorCountry.value = input.policy.countryEligibility?.operatorCountry ?? ''; countryMode.value = input.policy.countryEligibility?.mode ?? 'domestic'; allowedCountries.value = (input.policy.countryEligibility?.allowedCountries ?? []).join('\n');
	revision.value = input.revision; policy.value = input.policy; cidrs.value = input.policy.trustedProxyCidrs.join('\n');
	rules.value = input.policy.regionRules.rules.map(rule => ({ country: rule.country ?? '', regionCode: rule.regionCode ?? '', continent: rule.continent ?? '', eu: rule.isEUCountry == null ? 'any' : rule.isEUCountry ? 'yes' : 'no' }));
}

async function run(action: () => Promise<unknown>) {
	if (busy.value) return; busy.value = true; error.value = false; saved.value = false;
	try { await action(); } catch { error.value = true; } finally { busy.value = false; }
}

function load() { return run(async () => { const result = await props.client.getBillingPolicy({}); if (result) select(result); }); }

function save() {
	return run(async () => {
		const required = residenceRequired.value.split(/\r?\n/).map(value => value.trim().toUpperCase()).filter(Boolean);
		const { countryEligibility: previousCountryEligibility, ...otherPolicy } = policy.value;
		void previousCountryEligibility;
		const input = v.parse(billingPolicy, { ...otherPolicy, ...(operatorCountry.value ? { countryEligibility: { operatorCountry: operatorCountry.value, mode: countryMode.value, allowedCountries: countryMode.value === 'domestic' ? [] : allowedCountries.value.split(/\r?\n/).map(value => value.trim().toUpperCase()).filter(Boolean) } } : {}), ...(required.length || policy.value.residenceRequiredSubdivisions !== undefined ? { residenceRequiredSubdivisions: required } : {}), trustedProxyCidrs: cidrs.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean),
																																									regionRules: { mode: policy.value.regionRules.mode, rules: rules.value.map(rule => ({ ...(rule.country.trim() ? { country: rule.country.trim().toUpperCase() } : {}), ...(rule.regionCode.trim() ? { regionCode: rule.regionCode.trim() } : {}), ...(rule.continent.trim() ? { continent: rule.continent.trim().toUpperCase() } : {}), ...(rule.eu !== 'any' ? { isEUCountry: rule.eu === 'yes' } : {}) })) } });
		select(await props.client.upsertBillingPolicy({ revision: revision.value, policy: input })); saved.value = true;
	});
}
</script>
<locale lang="json" locale="ja-JP">
{"residenceRegistration":"居住地の事前登録","requiredSubdivisions":"居住地登録で州・地域も必須にする国（1行にISO国コードを1つ）","scope":"購入地域と居住地声明、税込価格の税率、領収書の販売者を設定します。設定後の注文に購入時点の情報を保存します。","enabled":"新規購入で地域・税・居住地声明の手続きを有効にする","peers":"信頼する上流proxyのIP/CIDR（1行ずつ）","peerCaption":"実際の接続元を指定します。上流は利用者の地域ヘッダーを除去し、確認済み地域情報で上書きしてください。転送されたIPだけでは信頼しません。EU加盟国は確認済み国コードから判定します。","regions":"購入地域","mode":"地域ルール","allow":"一致する地域を許可","deny":"一致する地域を拒否","country":"国コード（大文字2文字）","regionCode":"地域コード（空欄は指定なし）","continent":"大陸コード（空欄は指定なし）","eu":"EU加盟国","any":"指定なし","yes":"はい","no":"いいえ","tax":"税・販売者","taxName":"税の名称","taxRate":"税込価格に含む税率","rateCaption":"割合で入力します（例: 10%は0.1）。通貨は価格資産から取得します。","seller":"販売者名","address":"販売者住所","registration":"請求書登録番号","statements":"居住地声明","statement":"購入者が同意する声明","versionCaption":"共通文面を国ごとに版として記録します。文面を変更すると新しい版になり、既存注文の声明と領収書情報は変更しません。","load":"設定を読み込む","save":"保存","saved":"購入条件を保存しました。","failed":"設定を完了できませんでした。設定を読み直して再確認してください。","add":"追加","remove":"削除","countryEligibility":"登録居住国による利用条件","countryScope":"新しい購入と送金開始に適用します。未設定では開始できません。通常は運営国の居住者のみ許可し、明示した許可国に切り替えることもできます。送金は両者の居住国を確認し、海外受取の個人設定でこの範囲を広げることはできません。税・接続地域の条件とは別であり、法令遵守を保証する設定ではありません。","operatorCountry":"運営国","domestic":"運営国の居住者のみ","explicitCountries":"指定した国の居住者のみ","countryMode":"許可する居住国","allowedCountries":"許可国（1行にISO国コードを1つ）"}
</locale>
