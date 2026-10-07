<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div v-if="!instance.disableRegistration || !($i && ($i.isAdmin || $i.policies.canInvite))" class="_spacer" style="--MI_SPACER-w: 1200px;">
		<MkResult type="empty"/>
	</div>
	<div v-else class="_spacer" style="--MI_SPACER-w: 800px;">
		<div class="_gaps_m" style="text-align: center;">
			<div v-if="resetCycle && inviteLimit">{{ interpolateLocaleParameters($locale.sfc.inviteLimitResetCycle, { time: resetCycle, limit: inviteLimit }) }}</div>
			<MkButton inline primary rounded :disabled="currentInviteLimit !== null && currentInviteLimit <= 0" @click="create"><i class="ti ti-user-plus"></i> {{ $locale.sfc.createInviteCode }}</MkButton>
			<div v-if="currentInviteLimit !== null">{{ interpolateLocaleParameters($locale.sfc.createLimitRemaining, { limit: currentInviteLimit }) }}</div>

			<MkPagination :paginator="paginator">
				<template #default="{ items }">
					<div class="_gaps_s">
						<MkInviteCode v-for="item in items" :key="item.id" :invite="item" :onDeleted="deleted"/>
					</div>
				</template>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, markRaw, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkInviteCode from '@features/auth/frontend/components/MkInviteCode.vue';
import { definePage } from '@features/navigation/frontend/page.js';
import { instance } from '@features/instance/frontend/instance.js';
import { $i } from '@features/auth/frontend/i.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const currentInviteLimit = ref<null | number>(null);
const inviteLimit = (($i != null && $i.policies.inviteLimit) || (($i == null && instance.policies.inviteLimit))) as number;
const inviteLimitCycle = (($i != null && $i.policies.inviteLimitCycle) || ($i == null && instance.policies.inviteLimitCycle)) as number;

const paginator = markRaw(new Paginator('invite/list', {
	limit: 10,
}));

const resetCycle = computed<null | string>(() => {
	if (!inviteLimitCycle) return null;

	const minutes = inviteLimitCycle;
	if (minutes < 60) return minutes + $locale.value.sfc.minute;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return hours + $locale.value.sfc.hour;
	return Math.floor(hours / 24) + $locale.value.sfc.day;
});

async function create() {
	const ticket = await misskeyApi('invite/create');
	os.alert({
		type: 'success',
		title: $locale.value.sfc.inviteCodeCreated,
		text: ticket.code,
	});

	paginator.prepend(ticket);
	update();
}

function deleted(id: string) {
	paginator.removeItem(id);
	update();
}

async function update() {
	currentInviteLimit.value = (await misskeyApi('invite/limit')).remaining;
}

update();

definePage(() => ({
	title: $locale.value.sfc.invite,
	icon: 'ti ti-user-plus',
}));
</script>

<locale lang="json" locale="ar-SA">
{
	"minute": "د",
	"hour": "سا",
	"day": "ي",
	"inviteCodeCreated": "ولِّدت دعوة",
	"invite": "دعوة",
	"inviteLimitResetCycle": "This limit will reset to {limit} at {time}.",
	"createInviteCode": "ولِّد دعوة",
	"createLimitRemaining": "حد عدد الدعوات: {limit} دعوة"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"minute": "Minut(s)",
	"hour": "Hor(a)(es)",
	"day": "Di(a)(es)",
	"inviteCodeCreated": "Invitació creada",
	"invite": "Convida",
	"inviteLimitResetCycle": "Cada {time} {limit} invitacions.",
	"createInviteCode": "Crear codi d'invitació ",
	"createLimitRemaining": "Et queden {limit} invitacions restants"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"minute": "Minut",
	"hour": "Hodin",
	"day": "Dnů",
	"inviteCodeCreated": "Pozvánka vygenerována",
	"invite": "Pozvat",
	"inviteLimitResetCycle": "Tento limit se obnoví na hodnotu {limit} v {time}.",
	"createInviteCode": "Vygenerovat pozvánku",
	"createLimitRemaining": "Limit pozvánek: {limit} zbývá"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"minute": "Minute(s)",
	"hour": "Hour(s)",
	"day": "Day(s)",
	"inviteCodeCreated": "Invite generated",
	"invite": "Invite",
	"inviteLimitResetCycle": "This limit will reset to {limit} at {time}.",
	"createInviteCode": "Generate invite",
	"createLimitRemaining": "Invite limit: {limit} remaining"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"minute": "Minute(n)",
	"hour": "Stunde(n)",
	"day": "Tag(en)",
	"inviteCodeCreated": "Einladung erstellt",
	"invite": "Einladen",
	"inviteLimitResetCycle": "Am {time} wird dies auf {limit} zurückgesetzt.",
	"createInviteCode": "Einladung erstellen",
	"createLimitRemaining": "Erstellbare Einladungen: Noch {limit}"
}
</locale>

<locale lang="json" locale="en-US">
{
	"minute": "Minute(s)",
	"hour": "Hour(s)",
	"day": "Day(s)",
	"inviteCodeCreated": "Invite generated",
	"invite": "Invite",
	"inviteLimitResetCycle": "This limit will reset to {limit} at {time}.",
	"createInviteCode": "Generate invite",
	"createLimitRemaining": "Invite limit: {limit} remaining"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"minute": "Minutos",
	"hour": "Horas",
	"day": "Días",
	"inviteCodeCreated": "Invitación generada",
	"invite": "Invitar",
	"inviteLimitResetCycle": "El límite ha sido reiniciado a {limit} por {time}.",
	"createInviteCode": "Generar invitación",
	"createLimitRemaining": "Límite de invitaciones: quedan {limit}"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"minute": "min",
	"hour": "h",
	"day": "j",
	"inviteCodeCreated": "Code d'invitation créé",
	"invite": "Inviter",
	"inviteLimitResetCycle": "Vous pouvez créer jusqu'à {limit} codes d'invitation en {time}.",
	"createInviteCode": "Créer un code d'invitation",
	"createLimitRemaining": "Codes d'invitation pouvant être créés\u00a0:\u00a0{limit} restants"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"minute": "menit",
	"hour": "jam",
	"day": "hari",
	"inviteCodeCreated": "Kode undangan dibuat",
	"invite": "Undang",
	"inviteLimitResetCycle": "Kamu dapat membuat hingga {limit} kode undangan dalam {time}.",
	"createInviteCode": "Buat kode undangan",
	"createLimitRemaining": "Kode undangan yang dapat dibuat: tersisa {limit}"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"minute": "min",
	"hour": "ore",
	"day": "giorni",
	"inviteCodeCreated": "Inviti generati",
	"invite": "Invita",
	"inviteLimitResetCycle": "Alle {time}, il limite verrà ripristinato a {limit}",
	"createInviteCode": "Genera codice di invito",
	"createLimitRemaining": "Inviti generabili: {limit} rimanenti"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"minute": "分",
	"hour": "時間",
	"day": "日",
	"inviteCodeCreated": "招待コードを作成しました",
	"invite": "招待",
	"inviteLimitResetCycle": "{time}で最大 {limit} 個の招待コードを作成できます。",
	"createInviteCode": "招待コードを作成",
	"createLimitRemaining": "作成できる招待コード: 残り {limit} 個"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"minute": "分",
	"hour": "時間",
	"day": "日",
	"inviteCodeCreated": "招待コード作ったで",
	"invite": "来てや",
	"inviteLimitResetCycle": "{time}で最大 {limit} 個の招待コードを作れるで。",
	"createInviteCode": "招待コード作る",
	"createLimitRemaining": "作れる招待コードは残り {limit} 個や"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"minute": "Minute(s)",
	"hour": "Hour(s)",
	"day": "Day(s)",
	"inviteCodeCreated": "Invite generated",
	"invite": "Invite",
	"inviteLimitResetCycle": "This limit will reset to {limit} at {time}.",
	"createInviteCode": "Generate invite",
	"createLimitRemaining": "Invite limit: {limit} remaining"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"minute": "Minute(s)",
	"hour": "Hour(s)",
	"day": "Day(s)",
	"inviteCodeCreated": "Invite generated",
	"invite": "Invite",
	"inviteLimitResetCycle": "This limit will reset to {limit} at {time}.",
	"createInviteCode": "Generate invite",
	"createLimitRemaining": "Invite limit: {limit} remaining"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"minute": "분",
	"hour": "시간",
	"day": "일",
	"inviteCodeCreated": "초대 코드 생성됨",
	"invite": "초대",
	"inviteLimitResetCycle": " {time}시간 이내에 최대 {limit}개의 초대 코드를 생성할 수 있습니다.",
	"createInviteCode": "초대 코드 생성",
	"createLimitRemaining": "초대 한도: {limit}회 남음"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"minute": "Minute(s)",
	"hour": "Hour(s)",
	"day": "Day(s)",
	"inviteCodeCreated": "Invite generated",
	"invite": "Uitnodigen",
	"inviteLimitResetCycle": "This limit will reset to {limit} at {time}.",
	"createInviteCode": "Generate invite",
	"createLimitRemaining": "Invite limit: {limit} remaining"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"minute": "Minutter",
	"hour": "Timer",
	"day": "Dager",
	"inviteCodeCreated": "Invite generated",
	"invite": "Inviter",
	"inviteLimitResetCycle": "This limit will reset to {limit} at {time}.",
	"createInviteCode": "Generate invite",
	"createLimitRemaining": "Invite limit: {limit} remaining"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"minute": "minuta",
	"hour": "godz.",
	"day": "dzień",
	"inviteCodeCreated": "Invite generated",
	"invite": "Zaproś",
	"inviteLimitResetCycle": "This limit will reset to {limit} at {time}.",
	"createInviteCode": "Generate invite",
	"createLimitRemaining": "Invite limit: {limit} remaining"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"minute": "Minuto(s)",
	"hour": "Hora(s)",
	"day": "Dia(s)",
	"inviteCodeCreated": "Convite gerado",
	"invite": "Convidar",
	"inviteLimitResetCycle": "Esse limite irá tornar-se {limit} em {time}.",
	"createInviteCode": "Gerar convite",
	"createLimitRemaining": "Limite de convites: {limit}"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"minute": "мин",
	"hour": "ч",
	"day": "сут",
	"inviteCodeCreated": "Создан пригласительный код",
	"invite": "Пригласить",
	"inviteLimitResetCycle": "За определенное {time} Вы можете создать неограниченное количество пригласительных кодов {limit} ",
	"createInviteCode": "Создать код приглашения",
	"createLimitRemaining": "Пригласительные коды, которые могут быть созданы: {limit} "
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"minute": "min",
	"hour": "hod",
	"day": "dní",
	"inviteCodeCreated": "Invite generated",
	"invite": "Pozvať",
	"inviteLimitResetCycle": "This limit will reset to {limit} at {time}.",
	"createInviteCode": "Generate invite",
	"createLimitRemaining": "Invite limit: {limit} remaining"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"minute": "นาที",
	"hour": "ชั่วโมง",
	"day": "วัน",
	"inviteCodeCreated": "สร้างรหัสเชิญแล้ว",
	"invite": "คำเชิญ",
	"inviteLimitResetCycle": "สามารถสร้างรหัสเชิญได้อีกสูงสุด {limit} รหัส ภายใน {time}",
	"createInviteCode": "สร้างรหัสเชิญ",
	"createLimitRemaining": "รหัสเชิญที่สามารถสร้างได้: เหลืออยู่ {limit} รหัส"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"minute": "Dakika(lar)",
	"hour": "Saat(ler)",
	"day": "Gün(ler)",
	"inviteCodeCreated": "Davet oluşturuldu",
	"invite": "Davet et",
	"inviteLimitResetCycle": "Bu limit {time} tarihinde {limit} değerine sıfırlanacaktır.",
	"createInviteCode": "Davet Kodu oluştur",
	"createLimitRemaining": "{limit} Davet limiti kaldı"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"minute": "Minute(s)",
	"hour": "Hour(s)",
	"day": "Day(s)",
	"inviteCodeCreated": "Invite generated",
	"invite": "Invite",
	"inviteLimitResetCycle": "This limit will reset to {limit} at {time}.",
	"createInviteCode": "Generate invite",
	"createLimitRemaining": "Invite limit: {limit} remaining"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"minute": "х",
	"hour": "г",
	"day": "д",
	"inviteCodeCreated": "Запрошення створено",
	"invite": "Запросити",
	"inviteLimitResetCycle": "Цей ліміт буде скинуто до {limit} о {time}.",
	"createInviteCode": "Створити запрошення",
	"createLimitRemaining": "Ліміт запрошень: залишилося {limit}"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"minute": "phút",
	"hour": "giờ",
	"day": "ngày",
	"inviteCodeCreated": "Lời mời đã được tạo",
	"invite": "Mời",
	"inviteLimitResetCycle": "Giới hạn này sẽ được đặt lại về {limit} lúc {time}.",
	"createInviteCode": "Tạo lời mời",
	"createLimitRemaining": "Giới hạn lượt mời: Còn lại {limit}"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"minute": "分钟",
	"hour": "小时",
	"day": "天",
	"inviteCodeCreated": "已生成邀请码",
	"invite": "邀请",
	"inviteLimitResetCycle": "可以在 {time} 内生成最多 {limit} 个邀请码。",
	"createInviteCode": "生成邀请码",
	"createLimitRemaining": "可供生成的邀请码：剩余 {limit} 个"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"minute": "分鐘",
	"hour": "小時",
	"day": "日",
	"inviteCodeCreated": "已建立邀請碼",
	"invite": "邀請",
	"inviteLimitResetCycle": "可以在 {time} 內建立最多 {limit} 個邀請碼。",
	"createInviteCode": "建立邀請碼",
	"createLimitRemaining": "可建立的邀請碼：剩餘 {limit} 個"
}
</locale>
