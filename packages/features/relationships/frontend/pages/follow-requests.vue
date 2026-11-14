<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div :key="tab" class="_spacer" style="--MI_SPACER-w: 800px;">
		<MkPagination :paginator="paginator">
			<template #empty><MkResult type="empty" :text="$locale.sfc.noFollowRequests"/></template>
			<template #default="{items}">
				<div class="mk-follow-requests _gaps">
					<div v-for="req in items" :key="req.id" class="user _panel">
						<MkAvatar class="avatar" :user="displayUser(req)" indicator link preview/>
						<div class="body">
							<div class="name">
								<MkA v-user-preview="displayUser(req).id" class="name" :to="userPage(displayUser(req))"><MkUserName :user="displayUser(req)"/></MkA>
								<p class="acct">@{{ acct(displayUser(req)) }}</p>
							</div>
							<div v-if="tab === 'list'" class="commands">
								<MkButton class="command" rounded primary @click="accept(displayUser(req))"><i class="ti ti-check"></i> {{ globalLocale.env.accept }}</MkButton>
								<MkButton class="command" rounded danger @click="reject(displayUser(req))"><i class="ti ti-x"></i> {{ globalLocale.env.reject }}</MkButton>
							</div>
							<div v-else class="commands">
								<MkButton class="command" rounded danger @click="cancel(displayUser(req))"><i class="ti ti-x"></i> {{ globalLocale.env.cancel }}</MkButton>
							</div>
						</div>
					</div>
				</div>
			</template>
		</MkPagination>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import * as Misskey from 'misskey-js';
import { computed, markRaw, ref, watch } from 'vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { userPage, acct } from '@features/users/frontend/shared/user.js';
import * as os from '@features/ui/frontend/os.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { $i } from '@features/auth/frontend/i.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const tab = ref($i?.isLocked ? 'list' : 'sent');

let paginator: Paginator<'following/requests/list' | 'following/requests/sent'>;

watch(tab, (newTab) => {
	if (newTab === 'list') {
		paginator = markRaw(new Paginator('following/requests/list', { limit: 10 }));
	} else {
		paginator = markRaw(new Paginator('following/requests/sent', { limit: 10 }));
	}
}, { immediate: true });

function accept(user: Misskey.entities.UserLite) {
	os.apiWithDialog('following/requests/accept', { userId: user.id }).then(() => {
		paginator.reload();
	});
}

async function reject(user: Misskey.entities.UserLite) {
	const { canceled } = await os.confirm({
		type: 'question',
		text: interpolateLocaleParameters($locale.value.sfc.rejectFollowRequestConfirm, { name: user.name || user.username }),
	});

	if (canceled) return;

	await os.apiWithDialog('following/requests/reject', { userId: user.id }).then(() => {
		paginator.reload();
	});
}

async function cancel(user: Misskey.entities.UserLite) {
	const { canceled } = await os.confirm({
		type: 'question',
		text: interpolateLocaleParameters($locale.value.sfc.cancelFollowRequestConfirm, { name: user.name || user.username }),
		okText: $locale.value.sfc.yes,
		cancelText: $locale.value.sfc.no,
	});

	if (canceled) return;

	await os.apiWithDialog('following/requests/cancel', { userId: user.id }).then(() => {
		paginator.reload();
	});
}

function displayUser(req: Misskey.entities.FollowingRequestsListResponse[number]) {
	return tab.value === 'list' ? req.follower : req.followee;
}

const headerActions = computed(() => []);

const headerTabs = computed(() => [
	{
		key: 'list',
		title: $locale.value.sfc.recieved,
		icon: 'ti ti-download',
	}, {
		key: 'sent',
		title: $locale.value.sfc.sent,
		icon: 'ti ti-upload',
	},
]);

definePage(() => ({
	title: $locale.value.sfc.followRequests,
	icon: 'ti ti-user-plus',
}));
</script>

<style lang="scss" scoped>
.mk-follow-requests {
	> .user {
		display: flex;
		padding: 16px;

		> .avatar {
			display: block;
			flex-shrink: 0;
			margin: 0 12px 0 0;
			width: 42px;
			height: 42px;
			border-radius: 8px;
		}

		> .body {
			display: flex;
			width: calc(100% - 54px);
			position: relative;
			flex-wrap: wrap;
			gap: 8px;

			> .name {
				flex: 1 1 50%;

				> .name,
				> .acct {
					display: block;
					white-space: nowrap;
					text-overflow: ellipsis;
					overflow: hidden;
					margin: 0;
				}

				> .name {
					line-height: 24px;
				}

				> .acct {
					line-height: 16px;
					opacity: 0.7;
				}
			}

			> .description {
				width: 55%;
				line-height: 42px;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				opacity: 0.7;
				padding-right: 40px;
				padding-left: 8px;
				box-sizing: border-box;

				@media (max-width: 500px) {
					display: none;
				}
			}

			> .commands {
				display: flex;
				gap: 8px;
			}

			> .actions {
				position: absolute;
				top: 0;
				bottom: 0;
				right: 0;
				margin: auto 0;

				> button {
					padding: 12px;
				}
			}
		}
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"rejectFollowRequestConfirm": "Are you sure that you want to reject the follow request from {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"recieved": "Received request",
	"sent": "Sent request",
	"followRequests": "طلبات الإشتراك",
	"noFollowRequests": "ليس لديك طلبات متابعة معلقة"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"rejectFollowRequestConfirm": "Vols rebutjar la sol·licitud de seguiment de {name}?",
	"cancelFollowRequestConfirm": "Vols cancel·lar la teva sol·licitud de seguiment a {name}?",
	"recieved": "Sol·licituds rebudes",
	"sent": "Sol·licituds enviades",
	"followRequests": "Peticions de seguiment",
	"noFollowRequests": "No tens sol·licituds de seguiment"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"rejectFollowRequestConfirm": "Are you sure that you want to reject the follow request from {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"recieved": "Received request",
	"sent": "Sent request",
	"followRequests": "Žádosti o sledování",
	"noFollowRequests": "Nemáte žádné žádosti o sledování"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"rejectFollowRequestConfirm": "Are you sure that you want to reject the follow request from {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"recieved": "Received request",
	"sent": "Sent request",
	"followRequests": "Follow requests",
	"noFollowRequests": "You don't have any pending follow requests"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"rejectFollowRequestConfirm": "Möchtest du die Follow-Anfrage von {name} ablehnen?",
	"cancelFollowRequestConfirm": "Möchten Sie die Voll-Anfrage an {name} zurückziehen?",
	"recieved": "Anfrage erhalten",
	"sent": "Anfrage gesendet",
	"followRequests": "Follow-Anfragen",
	"noFollowRequests": "Keine ausstehenden Follow-Anfragen vorhanden"
}
</locale>

<locale lang="json" locale="en-US">
{
	"rejectFollowRequestConfirm": "Are you sure that you want to reject the follow request from {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"recieved": "Received request",
	"sent": "Sent request",
	"followRequests": "Follow requests",
	"noFollowRequests": "You don't have any pending follow requests"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"rejectFollowRequestConfirm": "¿Desea rechazar la solicitud de seguimiento de {name}?",
	"cancelFollowRequestConfirm": "¿Desea cancelar su solicitud de seguimiento a {name}?",
	"recieved": "Solicitud de seguimiento recibida",
	"sent": "Solicitud de seguimiento enviada",
	"followRequests": "Solicitudes de seguimiento",
	"noFollowRequests": "No hay solicitudes de seguimiento"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"rejectFollowRequestConfirm": "Refuser la demande de suivi de {name} ?",
	"cancelFollowRequestConfirm": "Est-te vous sur de vouloir annuler la demande de suivi de {name} ?",
	"recieved": "Received request",
	"sent": "Sent request",
	"followRequests": "Demandes d’abonnement",
	"noFollowRequests": "Vous n’avez aucune demande d’abonnement en attente"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"rejectFollowRequestConfirm": "Apa anda yakin ingin menolak permintaan mengikuti dari {name}?",
	"cancelFollowRequestConfirm": "Apa anda yakin ingin membatalkan permintaan mengikuti ke {name}?",
	"recieved": "Received request",
	"sent": "Sent request",
	"followRequests": "Permintaan mengikuti",
	"noFollowRequests": "Kamu tidak memiliki permintaan mengikuti yang menunggu"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"rejectFollowRequestConfirm": "Vuoi rifiutare la richiesta di follow ricevuta da {name}?",
	"cancelFollowRequestConfirm": "Vuoi annullare la tua richiesta di follow inviata a {name}?",
	"recieved": "Richieste in ingresso",
	"sent": "Richieste in uscita",
	"followRequests": "Relazioni",
	"noFollowRequests": "Non ci sono richieste di relazione"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"yes": "はい",
	"no": "いいえ",
	"rejectFollowRequestConfirm": "{name}からのフォロー申請を拒否しますか？",
	"cancelFollowRequestConfirm": "{name}へのフォロー申請をキャンセルしますか？",
	"recieved": "受け取った申請",
	"sent": "送った申請",
	"followRequests": "フォロー申請",
	"noFollowRequests": "フォロー申請はありません"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"rejectFollowRequestConfirm": "{name}からのフォロー申請を拒否しますか？",
	"cancelFollowRequestConfirm": "{name}へのフォロー申請をキャンセルしますか？",
	"recieved": "もらった申請",
	"sent": "送った申請",
	"followRequests": "フォロー申請",
	"noFollowRequests": "フォロー申請はあらへんで"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"rejectFollowRequestConfirm": "Are you sure that you want to reject the follow request from {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"recieved": "Received request",
	"sent": "Sent request",
	"followRequests": "Follow requests",
	"noFollowRequests": "You don't have any pending follow requests"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"rejectFollowRequestConfirm": "Are you sure that you want to reject the follow request from {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"recieved": "Received request",
	"sent": "Sent request",
	"followRequests": "Follow requests",
	"noFollowRequests": "You don't have any pending follow requests"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"rejectFollowRequestConfirm": "{name}(으)로부터의 팔로우 신청을 거부하시겠습니까?",
	"cancelFollowRequestConfirm": "{name}(으)로의 팔로우 신청을 취소하시겠습니까?",
	"recieved": "받은 신청",
	"sent": "보낸 신청",
	"followRequests": "팔로우 요청",
	"noFollowRequests": "처리되지 않은 팔로우 요청이 없습니다"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"rejectFollowRequestConfirm": "Are you sure that you want to reject the follow request from {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"recieved": "Received request",
	"sent": "Sent request",
	"followRequests": "Volgverzoeken",
	"noFollowRequests": "Je hebt geen lopende volgverzoeken"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"rejectFollowRequestConfirm": "Are you sure that you want to reject the follow request from {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"recieved": "Received request",
	"sent": "Sent request",
	"followRequests": "Følgeforespørsel",
	"noFollowRequests": "You don't have any pending follow requests"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"rejectFollowRequestConfirm": "Are you sure that you want to reject the follow request from {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"recieved": "Received request",
	"sent": "Sent request",
	"followRequests": "Prośby o możliwość obserwacji",
	"noFollowRequests": "Nie masz żadnych oczekujących próśb o możliwość obserwacji"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"rejectFollowRequestConfirm": "Are you sure that you want to reject the follow request from {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"recieved": "Aplicação recebida",
	"sent": "Aplicação enviada",
	"followRequests": "Pedidos de seguidor",
	"noFollowRequests": "Não há pedidos de seguidor pendentes"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"rejectFollowRequestConfirm": "Отклонить запрос на подписку от {name}?",
	"cancelFollowRequestConfirm": "Вы уверены, что хотите отменить запрос на подписку пользователю {name}?",
	"recieved": "Received request",
	"sent": "Sent request",
	"followRequests": "Запросы на подписку",
	"noFollowRequests": "Нерассмотренные запросы на подписку отсутствуют"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"rejectFollowRequestConfirm": "Are you sure that you want to reject the follow request from {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"recieved": "Received request",
	"sent": "Sent request",
	"followRequests": "Žiadosti o sledovanie",
	"noFollowRequests": "Nemáte nijaké čakajúce žiadosti o sledovanie"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"rejectFollowRequestConfirm": "ปฏิเสธคำขอติดตามจาก {name} ใช่ไหม?",
	"cancelFollowRequestConfirm": "ยกเลิกคำขอติดตาม {name} ใช่ไหม?",
	"recieved": "คำขอที่ได้รับ",
	"sent": "คำที่ส่งไป",
	"followRequests": "ส่งคำขอติดตาม",
	"noFollowRequests": "คุณไม่มีคำขอติดตามที่รอดำเนินการ"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"rejectFollowRequestConfirm": "{name} adlı kullanıcının takip isteğini reddetmek istiyor musunuz?",
	"cancelFollowRequestConfirm": "{name} adlı kişiye gönderdiğiniz takip isteğini iptal etmek ister misiniz?",
	"recieved": "Talep alındı",
	"sent": "İstek gönderildi",
	"followRequests": "Takip istekleri",
	"noFollowRequests": "Bekleyen takip istekleri yok."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"rejectFollowRequestConfirm": "Are you sure that you want to reject the follow request from {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"recieved": "Received request",
	"sent": "Sent request",
	"followRequests": "Follow requests",
	"noFollowRequests": "You don't have any pending follow requests"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"rejectFollowRequestConfirm": "Ви впевнені, що хочете відхилити запит на підписку від {name}?",
	"cancelFollowRequestConfirm": "Ви впевнені, що хочете скасувати запит на підписку до {name}?",
	"recieved": "Received request",
	"sent": "Sent request",
	"followRequests": "Запити на підписку",
	"noFollowRequests": "Немає запитів на підписку"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"rejectFollowRequestConfirm": "Are you sure that you want to reject the follow request from {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"recieved": "Received request",
	"sent": "Sent request",
	"followRequests": "Yêu cầu theo dõi",
	"noFollowRequests": "Bạn không có yêu cầu theo dõi nào"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"rejectFollowRequestConfirm": "要拒绝{name}的关注申请吗？",
	"cancelFollowRequestConfirm": "要取消申请关注{name}吗？",
	"recieved": "收到的请求",
	"sent": "发送的请求",
	"followRequests": "关注请求",
	"noFollowRequests": "没有关注请求"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"rejectFollowRequestConfirm": "要拒絕來自 {name} 的追隨申請嗎？",
	"cancelFollowRequestConfirm": "要取消向 {name} 送出的追隨申請嗎？",
	"recieved": "收到的請求",
	"sent": "送出的請求",
	"followRequests": "追隨請求",
	"noFollowRequests": "沒有追隨您的請求"
}
</locale>
