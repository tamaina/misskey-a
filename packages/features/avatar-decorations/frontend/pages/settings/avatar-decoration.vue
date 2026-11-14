<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/avatar-decoration" :label="$locale.sfc.avatarDecorations" :keywords="['avatar', 'icon', 'decoration']" icon="ti ti-sparkles">
	<div>
		<div v-if="!loading" class="_gaps">
			<MkInfo>{{ $l.sfc.avatarDecorationMax({ max: $i.policies.avatarDecorationLimit }) }} ({{ $l.sfc.remainingN({ n: $i.policies.avatarDecorationLimit - $i.avatarDecorations.length }) }})</MkInfo>

			<MkAvatar :class="$style.avatar" :user="$i" forceShowDecoration/>

			<div v-if="$i.avatarDecorations.length > 0" v-panel :class="$style.current" class="_gaps_s">
				<div>{{ $locale.sfc.inUse }}</div>

				<div :class="$style.decorations">
					<XDecoration
						v-for="(avatarDecoration, i) in $i.avatarDecorations"
						:decoration="avatarDecorations.find(d => d.id === avatarDecoration.id) ?? { id: '', url: '', name: '?', roleIdsThatCanBeUsedThisDecoration: [] }"
						:angle="avatarDecoration.angle"
						:flipH="avatarDecoration.flipH"
						:offsetX="avatarDecoration.offsetX"
						:offsetY="avatarDecoration.offsetY"
						:active="true"
						@click="openAttachedDecoration(i)"
					/>
				</div>

				<MkButton danger @click="detachAllDecorations">{{ $locale.sfc.detachAll }}</MkButton>
			</div>
			<MkFoldableSection v-for="category in Object.keys(groupedDecorations)" :key="category" :expanded="true">
				<template #header>{{ category || $locale.sfc.other }}</template>
				<div :class="$style.decorations">
					<XDecoration
						v-for="avatarDecoration in groupedDecorations[category]"
						:key="avatarDecoration.id"
						:decoration="avatarDecoration"
						@click="openDecoration(avatarDecoration)"
					/>
				</div>
			</MkFoldableSection>
		</div>
		<div v-else>
			<MkLoading/>
		</div>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { ref, defineAsyncComponent, computed } from 'vue';
import * as Misskey from 'misskey-js';
import XDecoration from '@features/avatar-decorations/frontend/pages/settings/avatar-decoration.decoration.vue';
import XDialog from '@features/avatar-decorations/frontend/pages/settings/avatar-decoration.dialog.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkFoldableSection from '@features/ui/frontend/components/MkFoldableSection.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { groupAvatarDecorations } from '@features/avatar-decorations/frontend/utility/group-avatar-decorations.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const $i = ensureSignin();

const loading = ref(true);
const avatarDecorations = ref<Misskey.entities.GetAvatarDecorationsResponse>([]);
const groupedDecorations = computed(() => groupAvatarDecorations(avatarDecorations.value));

misskeyApi('get-avatar-decorations').then(_avatarDecorations => {
	avatarDecorations.value = _avatarDecorations;
	loading.value = false;
});

function openAttachedDecoration(index: number) {
	openDecoration(avatarDecorations.value.find(d => d.id === $i.avatarDecorations[index].id) ?? { id: '', url: '', name: '?', roleIdsThatCanBeUsedThisDecoration: [] }, index);
}

async function openDecoration(avatarDecoration: {
	id: string;
	url: string;
	name: string;
	roleIdsThatCanBeUsedThisDecoration: string[];
}, index?: number) {
	const { dispose } = os.popup(XDialog, {
		decoration: avatarDecoration,
		usingIndex: index ?? null,
	}, {
		'attach': async (payload) => {
			const decoration = {
				id: avatarDecoration.id,
				url: avatarDecoration.url,
				angle: payload.angle,
				flipH: payload.flipH,
				offsetX: payload.offsetX,
				offsetY: payload.offsetY,
			};
			const update = [...$i.avatarDecorations, decoration];
			await os.apiWithDialog('i/update', {
				avatarDecorations: update,
			});
			$i.avatarDecorations = update;
		},
		'update': async (payload) => {
			const decoration = {
				id: avatarDecoration.id,
				url: avatarDecoration.url,
				angle: payload.angle,
				flipH: payload.flipH,
				offsetX: payload.offsetX,
				offsetY: payload.offsetY,
			};
			const update = [...$i.avatarDecorations];
			update[index!] = decoration;
			await os.apiWithDialog('i/update', {
				avatarDecorations: update,
			});
			$i.avatarDecorations = update;
		},
		'detach': async () => {
			const update = [...$i.avatarDecorations];
			update.splice(index!, 1);
			await os.apiWithDialog('i/update', {
				avatarDecorations: update,
			});
			$i.avatarDecorations = update;
		},
		closed: () => dispose(),
	});
}

function detachAllDecorations() {
	os.confirm({
		type: 'warning',
		text: globalLocale.value.env.areYouSure,
	}).then(async ({ canceled }) => {
		if (canceled) return;
		await os.apiWithDialog('i/update', {
			avatarDecorations: [],
		});
		$i.avatarDecorations = [];
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.avatarDecorations,
	icon: 'ti ti-sparkles',
}));
</script>

<style lang="scss" module>
.avatar {
	display: inline-block;
	width: 72px;
	height: 72px;
	margin: 16px auto;
}

.current {
	padding: 16px;
	border-radius: var(--MI-radius);
}

.decorations {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
	grid-gap: 12px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"avatarDecorations": "Avatar decorations",
	"avatarDecorationMax": "You can add up to {max} decorations.",
	"remainingN": "Remaining: {n}",
	"inUse": "مستخدم",
	"detachAll": "Remove All",
	"other": "منوعات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"avatarDecorations": "Decoracions dels avatars",
	"avatarDecorationMax": "Pot afegir un màxim de {max} decoracions.",
	"remainingN": "Queden: {n}",
	"inUse": "Fet servir",
	"detachAll": "Treure tot",
	"other": "Altres"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"avatarDecorations": "Avatar decorations",
	"avatarDecorationMax": "You can add up to {max} decorations.",
	"remainingN": "Remaining: {n}",
	"inUse": "Používáno",
	"detachAll": "Remove All",
	"other": "Ostatní"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"avatarDecorations": "Avatar decorations",
	"avatarDecorationMax": "You can add up to {max} decorations.",
	"remainingN": "Remaining: {n}",
	"inUse": "Used",
	"detachAll": "Remove All",
	"other": "Other"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"avatarDecorations": "Profilbilddekoration",
	"avatarDecorationMax": "Du kannst bis zu {max} Dekorationen hinzufügen.",
	"remainingN": "Verbleibend: {n}",
	"inUse": "Verwendet",
	"detachAll": "Alles Entfernen",
	"other": "Anderes"
}
</locale>

<locale locale="en-US" lang="json">
{
	"avatarDecorations": "Avatar decorations",
	"avatarDecorationMax": "You can add up to {max} decorations.",
	"remainingN": "Remaining: {n}",
	"inUse": "Used",
	"detachAll": "Remove All",
	"other": "Other"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"avatarDecorations": "Decoraciones de avatar",
	"avatarDecorationMax": "Puedes añadir un máximo de {max} decoraciones de avatar.",
	"remainingN": "Faltan: {n}",
	"inUse": "Usado",
	"detachAll": "Quitar todo",
	"other": "Otro"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"avatarDecorations": "Décorations d'avatar",
	"avatarDecorationMax": "Vous pouvez mettre au plus {max} décorations d'avatar.",
	"remainingN": "Restants : {n}",
	"inUse": "utilisé",
	"detachAll": "Tout enlever",
	"other": "Autre"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"avatarDecorations": "Dekorasi avatar",
	"avatarDecorationMax": "Dapat ditambahkan hingga {max} dekorasi.",
	"remainingN": "Sisa : {n}",
	"inUse": "Digunakan",
	"detachAll": "Lepas Semua",
	"other": "Lainnya"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"avatarDecorations": "Decorazioni foto profilo",
	"avatarDecorationMax": "Puoi aggiungere fino a {max} decorazioni.",
	"remainingN": "Rimangono: {n}",
	"inUse": "Usata da",
	"detachAll": "Togli tutto",
	"other": "Eccetera"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"avatarDecorations": "アイコンデコレーション",
	"avatarDecorationMax": "最大{max}つまでデコレーションを付けられます。",
	"remainingN": "残り: {n}",
	"inUse": "使用中",
	"detachAll": "全て外す",
	"other": "その他"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"avatarDecorations": "アイコンデコレーション",
	"avatarDecorationMax": "最大{max}つまでデコつけれんで",
	"remainingN": "残り:{n}",
	"inUse": "使用中",
	"detachAll": "全部とる",
	"other": "その他"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"avatarDecorations": "Avatar decorations",
	"avatarDecorationMax": "You can add up to {max} decorations.",
	"remainingN": "Remaining: {n}",
	"inUse": "Used",
	"detachAll": "Remove All",
	"other": "Wiyyaḍ"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"avatarDecorations": "Avatar decorations",
	"avatarDecorationMax": "You can add up to {max} decorations.",
	"remainingN": "Remaining: {n}",
	"inUse": "Used",
	"detachAll": "Remove All",
	"other": "Other"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"avatarDecorations": "아바타 장식",
	"avatarDecorationMax": "최대 {max}개까지 장식을 할 수 있습니다.",
	"remainingN": "나머지: {n}",
	"inUse": "사용중",
	"detachAll": "모두 빼기",
	"other": "기타"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"avatarDecorations": "Avatar decorations",
	"avatarDecorationMax": "You can add up to {max} decorations.",
	"remainingN": "Remaining: {n}",
	"inUse": "Gebruikt",
	"detachAll": "Remove All",
	"other": "Ander"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"avatarDecorations": "Avatar decorations",
	"avatarDecorationMax": "You can add up to {max} decorations.",
	"remainingN": "Remaining: {n}",
	"inUse": "Used",
	"detachAll": "Remove All",
	"other": "Andre"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"avatarDecorations": "Avatar decorations",
	"avatarDecorationMax": "You can add up to {max} decorations.",
	"remainingN": "Remaining: {n}",
	"inUse": "Użyto",
	"detachAll": "Remove All",
	"other": "Inne"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"avatarDecorations": "Decorações de avatar",
	"avatarDecorationMax": "Você pode adicionar até {max} decorações.",
	"remainingN": "Restante: {n}",
	"inUse": "Em uso",
	"detachAll": "Remover Tudo",
	"other": "Outros"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"avatarDecorations": "Украшения для аватара",
	"avatarDecorationMax": "Вы можете добавить до {max} украшений.",
	"remainingN": "Остаётся: {n}",
	"inUse": "Занято",
	"detachAll": "Убрать всё",
	"other": "Другие"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"avatarDecorations": "Avatar decorations",
	"avatarDecorationMax": "You can add up to {max} decorations.",
	"remainingN": "Remaining: {n}",
	"inUse": "Použité",
	"detachAll": "Remove All",
	"other": "Ostatní"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"avatarDecorations": "ของตกแต่งไอคอน",
	"avatarDecorationMax": "คุณสามารถเพิ่มการตกแต่งได้สูงสุด {max}",
	"remainingN": "เหลือ : {n}",
	"inUse": "ใช้แล้ว",
	"detachAll": "เอาออกทั้งหมด",
	"other": "อื่น ๆ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"avatarDecorations": "Avatar süsleri",
	"avatarDecorationMax": "En fazla {max} süs ekleyebilirsin.",
	"remainingN": "Kalan: {n}",
	"inUse": "Kullanılıyor",
	"detachAll": "Tümünü Kaldır",
	"other": "Diğer"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"avatarDecorations": "Avatar decorations",
	"avatarDecorationMax": "You can add up to {max} decorations.",
	"remainingN": "Remaining: {n}",
	"inUse": "Used",
	"detachAll": "Remove All",
	"other": "Other"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"avatarDecorations": "Прикраси аватара",
	"avatarDecorationMax": "You can add up to {max} decorations.",
	"remainingN": "Залишилося: {n}",
	"inUse": "Зайнято",
	"detachAll": "Видалити все",
	"other": "Інше"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"avatarDecorations": "Trang trí ảnh đại diện",
	"avatarDecorationMax": "You can add up to {max} decorations.",
	"remainingN": "Remaining: {n}",
	"inUse": "Đã dùng",
	"detachAll": "Bỏ tất cả",
	"other": "Khác"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"avatarDecorations": "头像挂件",
	"avatarDecorationMax": "最多可添加 {max} 个挂件",
	"remainingN": "剩余：{n}",
	"inUse": "已使用",
	"detachAll": "全部卸下",
	"other": "其他"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"avatarDecorations": "頭像裝飾",
	"avatarDecorationMax": "最多可以設置 {max} 個裝飾。",
	"remainingN": "剩餘：{n}",
	"inUse": "已使用",
	"detachAll": "全部移除",
	"other": "其他"
}
</locale>
