<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<MkFolder>
		<template #label><slot name="label"></slot></template>
		<template #suffix>
			<template v-if="isBaseRole">
				<span><slot name="valueText"></slot></span>
			</template>
			<template v-else-if="policyMeta != null">
				<span v-if="policyMeta.useDefault" :class="$style.useDefaultLabel">{{ $locale.sfc.useBaseValue }}</span>
				<span v-else><slot name="valueText"></slot></span>
				<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(policyMeta.priority)"></i></span>
			</template>
		</template>
		<div class="_gaps">
			<MkSwitch v-if="!isBaseRole && policyMeta != null" v-model="useDefaultModel" :disabled="readonly">
				<template #label>{{ $locale.sfc.useBaseValue }}</template>
			</MkSwitch>
			<div>
				<slot :disabled="readonly || (!isBaseRole && policyMeta?.useDefault)"></slot>
			</div>
			<MkRange v-if="!isBaseRole && policyMeta != null" v-model="priorityModel" :min="0" :max="2" :step="1" easing :textConverter="priroityRangeTextConverter" :disabled="readonly">
				<template #label>{{ $locale.sfc.priority }}</template>
			</MkRange>
		</div>
	</MkFolder>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkRange from '@features/ui/frontend/components/MkRange.vue';
import type { PolicyMeta } from '@features/roles/frontend/pages/admin/roles.policy-editor.vue';

const props = defineProps<{
	isBaseRole: boolean;
	policyMeta?: PolicyMeta | null;
	readonly?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'update:policyMeta', v: PolicyMeta): void;
}>();

const useDefaultModel = computed<boolean>({
	get: () => props.policyMeta?.useDefault ?? false,
	set: (value) => {
		const current = props.policyMeta;
		if (current == null) return;
		if (current.useDefault === value) return;
		emit('update:policyMeta', { ...current, useDefault: value });
	},
});

const priorityModel = computed<number>({
	get: () => props.policyMeta?.priority ?? 0,
	set: (value) => {
		const current = props.policyMeta;
		if (current == null) return;
		if (current.priority === value) return;
		emit('update:policyMeta', { ...current, priority: value });
	},
});

function getPriorityIcon(priority: number): string {
	if (priority === 2) return 'ti ti-arrows-up';
	if (priority === 1) return 'ti ti-arrow-narrow-up';
	return 'ti ti-point';
}

function priroityRangeTextConverter(v: number): string {
	if (v === 0) return $locale.value.sfc.low;
	if (v === 1) return $locale.value.sfc.middle;
	if (v === 2) return $locale.value.sfc.high;
	return '';
}
</script>

<style lang="scss" module>
.useDefaultLabel {
	opacity: 0.7;
}

.priorityIndicator {
	margin-left: 8px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"useBaseValue": "Use role template value",
	"priority": "الأولوية",
	"low": "منخفضة",
	"middle": "متوسط",
	"high": "عالية"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"useBaseValue": "Fer servir els valors de la plantilla de rols",
	"priority": "Prioritat",
	"low": "Baixa",
	"middle": "Mitjà",
	"high": "Alta"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"useBaseValue": "Použít hodnotu šablony role",
	"priority": "Priorita",
	"low": "Nízká",
	"middle": "Střední",
	"high": "Vysoká"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"useBaseValue": "Use role template value",
	"priority": "Priority",
	"low": "Low",
	"middle": "Medium",
	"high": "High"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"useBaseValue": "Wert der Rollenvorlage verwenden",
	"priority": "Priorität",
	"low": "Niedrig",
	"middle": "Mittel",
	"high": "Hoch"
}
</locale>

<locale locale="en-US" lang="json">
{
	"useBaseValue": "Use role template value",
	"priority": "Priority",
	"low": "Low",
	"middle": "Medium",
	"high": "High"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"useBaseValue": "Usar los valores del rol base",
	"priority": "Prioridad",
	"low": "Baja",
	"middle": "Mediano",
	"high": "Alta"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"useBaseValue": "Utiliser la valeur du modèle de rôle",
	"priority": "Priorité",
	"low": "Basse",
	"middle": "Moyen",
	"high": "Haute"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"useBaseValue": "Gunakan nilai templat peran",
	"priority": "Prioritas",
	"low": "Rendah",
	"middle": "Sedang",
	"high": "Tinggi"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"useBaseValue": "Eredita dal ruolo base",
	"priority": "Priorità",
	"low": "Bassa",
	"middle": "Medio",
	"high": "Alta"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"useBaseValue": "ベースロールの値を使用",
	"priority": "優先度",
	"low": "低",
	"middle": "中",
	"high": "高"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"useBaseValue": "ベースロールの値使う",
	"priority": "優先度",
	"low": "低い",
	"middle": "中くらい",
	"high": "高い"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"useBaseValue": "Use role template value",
	"priority": "Priority",
	"low": "Low",
	"middle": "Medium",
	"high": "High"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"useBaseValue": "Use role template value",
	"priority": "Priority",
	"low": "Low",
	"middle": "Medium",
	"high": "High"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"useBaseValue": "기본값 사용",
	"priority": "우선순위",
	"low": "낮음",
	"middle": "보통",
	"high": "높음"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"useBaseValue": "Use role template value",
	"priority": "Prioriteit",
	"low": "Lage",
	"middle": "Medium",
	"high": "Hoge"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"useBaseValue": "Use role template value",
	"priority": "Priority",
	"low": "Lav",
	"middle": "Medium",
	"high": "Høy"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"useBaseValue": "Use role template value",
	"priority": "Priorytet",
	"low": "Niski",
	"middle": "Średnie",
	"high": "Wysoki"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"useBaseValue": "Usar o valor do cargo padrão",
	"priority": "Prioridade",
	"low": "Baixa",
	"middle": "Médio",
	"high": "Alta"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"useBaseValue": "Использовать значение из шаблона",
	"priority": "Приоритет",
	"low": "Низкий",
	"middle": "Средне",
	"high": "Высокий"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"useBaseValue": "Use role template value",
	"priority": "Priorita",
	"low": "Málo",
	"middle": "Stredné",
	"high": "Vysoká"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"useBaseValue": "ใช้ตามแม่แบบบทบาท",
	"priority": "ลำดับความสำคัญ",
	"low": "ต่ำ",
	"middle": "ปานกลาง",
	"high": "สูง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"useBaseValue": "Rol şablonu değerini kullan",
	"priority": "Öncelik",
	"low": "Düşük",
	"middle": "Orta",
	"high": "Yüksek"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"useBaseValue": "Use role template value",
	"priority": "Priority",
	"low": "Low",
	"middle": "Medium",
	"high": "High"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"useBaseValue": "Use role template value",
	"priority": "Пріоритет",
	"low": "Низький",
	"middle": "Середній",
	"high": "Високий"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"useBaseValue": "Use role template value",
	"priority": "Ưu tiên",
	"low": "Thấp",
	"middle": "Vừa",
	"high": "Cao"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"useBaseValue": "使用基本角色的值",
	"priority": "优先级",
	"low": "低",
	"middle": "中",
	"high": "高"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"useBaseValue": "使用基本角色的值",
	"priority": "優先級",
	"low": "低",
	"middle": "中",
	"high": "高"
}
</locale>
