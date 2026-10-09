<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<button
	class="_button"
	:class="[$style.root, { [$style.wait]: wait, [$style.active]: isFollowing || hasPendingFollowRequestFromYou, [$style.full]: full, [$style.large]: large }]"
	:disabled="wait"
	@click="onClick"
>
	<template v-if="!wait">
		<template v-if="hasPendingFollowRequestFromYou && user.isLocked">
			<span v-if="full" :class="$style.text">{{ $locale.sfc.followRequestPending }}</span><i class="ti ti-hourglass-empty"></i>
		</template>
		<template v-else-if="hasPendingFollowRequestFromYou && !user.isLocked">
			<!-- つまりリモートフォローの場合。 -->
			<span v-if="full" :class="$style.text">{{ $locale.sfc.processing }}</span><MkLoading :em="true" :colored="false"/>
		</template>
		<template v-else-if="isFollowing">
			<span v-if="full" :class="$style.text">{{ $locale.sfc.youFollowing }}</span><i class="ti ti-minus"></i>
		</template>
		<template v-else-if="!isFollowing && user.isLocked">
			<span v-if="full" :class="$style.text">{{ $locale.sfc.followRequest }}</span><i class="ti ti-plus"></i>
		</template>
		<template v-else-if="!isFollowing && !user.isLocked">
			<span v-if="full" :class="$style.text">{{ $locale.sfc.follow }}</span><i class="ti ti-plus"></i>
		</template>
	</template>
	<template v-else>
		<span v-if="full" :class="$style.text">{{ $locale.sfc.processing }}</span><MkLoading :em="true" :colored="false"/>
	</template>
</button>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { host } from '@features/boot/frontend/shared/config.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { useStream } from '@features/api/frontend/stream.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { claimAchievement } from '@features/users/frontend/utility/achievements.js';
import { pleaseLogin } from '@features/auth/frontend/utility/please-login.js';
import { $i } from '@features/auth/frontend/i.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { haptic } from '@features/ui/frontend/utility/haptic.js';

const props = withDefaults(defineProps<{
	user: Misskey.entities.UserDetailed,
	full?: boolean,
	large?: boolean,
}>(), {
	full: false,
	large: false,
});

const emit = defineEmits<{
	(_: 'update:user', value: Misskey.entities.UserDetailed): void
}>();

const isFollowing = ref(props.user.isFollowing);
const hasPendingFollowRequestFromYou = ref(props.user.hasPendingFollowRequestFromYou);
const wait = ref(false);
const connection = useStream().useChannel('main');

if (props.user.isFollowing == null && $i) {
	misskeyApi('users/show', {
		userId: props.user.id,
	})
		.then(onFollowChange);
}

function onFollowChange(user: Misskey.entities.UserDetailed) {
	if (user.id === props.user.id) {
		isFollowing.value = user.isFollowing;
		hasPendingFollowRequestFromYou.value = user.hasPendingFollowRequestFromYou;
	}
}

async function onClick() {
	const isLoggedIn = await pleaseLogin({
		openOnRemote: {
			type: 'web',
			path: `/@${props.user.username}@${props.user.host ?? host}`,
		},
	});
	if (!isLoggedIn) return;

	wait.value = true;

	haptic();

	try {
		if (isFollowing.value) {
			const { canceled } = await os.confirm({
				type: 'warning',
				text: interpolateLocaleParameters($locale.value.sfc.unfollowConfirm, { name: props.user.name || props.user.username }),
			});

			if (canceled) {
				wait.value = false;
				return;
			}

			await misskeyApi('following/delete', {
				userId: props.user.id,
			});
		} else if (hasPendingFollowRequestFromYou.value) {
			const { canceled } = await os.confirm({
				type: 'question',
				text: interpolateLocaleParameters($locale.value.sfc.cancelFollowRequestConfirm, { name: props.user.name || props.user.username }),
			});

			if (canceled) {
				wait.value = false;
				return;
			}

			await misskeyApi('following/requests/cancel', {
				userId: props.user.id,
			});
			hasPendingFollowRequestFromYou.value = false;
		} else {
			if (prefer.s.alwaysConfirmFollow) {
				const { canceled } = await os.confirm({
					type: 'question',
					text: interpolateLocaleParameters($locale.value.sfc.followConfirm, { name: props.user.name || props.user.username }),
				});

				if (canceled) {
					wait.value = false;
					return;
				}
			}

			await misskeyApi('following/create', {
				userId: props.user.id,
				withReplies: prefer.s.defaultFollowWithReplies,
			});
			emit('update:user', {
				...props.user,
				withReplies: prefer.s.defaultFollowWithReplies,
			});
			hasPendingFollowRequestFromYou.value = true;

			if ($i == null) {
				wait.value = false;
				return;
			}

			claimAchievement('following1');

			if ($i.followingCount >= 10) {
				claimAchievement('following10');
			}
			if ($i.followingCount >= 50) {
				claimAchievement('following50');
			}
			if ($i.followingCount >= 100) {
				claimAchievement('following100');
			}
			if ($i.followingCount >= 300) {
				claimAchievement('following300');
			}
		}
	} catch (err) {
		console.error(err);
	} finally {
		wait.value = false;
	}
}

onMounted(() => {
	connection.on('follow', onFollowChange);
	connection.on('unfollow', onFollowChange);
});

onBeforeUnmount(() => {
	connection.dispose();
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: inline-block;
	font-weight: bold;
	color: var(--MI_THEME-fgOnWhite);
	border: solid 1px var(--MI_THEME-accent);
	padding: 0;
	height: 31px;
	font-size: 16px;
	border-radius: 32px;
	background: #fff;

	&.full {
		padding: 0 8px 0 12px;
		font-size: 14px;
	}

	&.large {
		font-size: 16px;
		height: 38px;
		padding: 0 12px 0 16px;
	}

	&:not(.full) {
		width: 31px;
	}

	&:focus-visible {
		outline-offset: 2px;
	}

	&:hover {
		//background: mix($primary, #fff, 20);
	}

	&:active {
		//background: mix($primary, #fff, 40);
	}

	&.active {
		color: var(--MI_THEME-fgOnAccent);
		background: var(--MI_THEME-accent);

		&:hover {
			background: hsl(from var(--MI_THEME-accent) h s calc(l + 10));
			border-color: hsl(from var(--MI_THEME-accent) h s calc(l + 10));
		}

		&:active {
			background: hsl(from var(--MI_THEME-accent) h s calc(l - 10));
			border-color: hsl(from var(--MI_THEME-accent) h s calc(l - 10));
		}
	}

	&.wait {
		cursor: wait !important;
		opacity: 0.7;
	}
}

.text {
	margin-right: 6px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"unfollowConfirm": "أمتأكد من إلغاء متابعة {name}؟",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"followConfirm": "أتريد متابعة {name}؟",
	"followRequestPending": "طلبات الإشتراك المعلّقة",
	"processing": "المعالجة جارية",
	"youFollowing": "متابَع",
	"followRequest": "طلب اشتراك",
	"follow": "تابِع"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"unfollowConfirm": "Segur que vols deixar de seguir a {name}?",
	"cancelFollowRequestConfirm": "Vols cancel·lar la teva sol·licitud de seguiment a {name}?",
	"followConfirm": "Segur que vols seguir a {name}?",
	"followRequestPending": "Sol·licituds de seguiment pendents",
	"processing": "S'està processant...",
	"youFollowing": "Segueixes ",
	"followRequest": "Enviar sol·licitud de seguiment",
	"follow": "Segueix"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"unfollowConfirm": "Jste si jisti že už nechcete sledovat {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"followConfirm": "Jste si jisti, že chcete sledovat {name}?",
	"followRequestPending": "Čekající žádosti o sledování",
	"processing": "Zpracovávám",
	"youFollowing": "Sleduji",
	"followRequest": "Odeslat žádost o sledování",
	"follow": "Sledovaní"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"unfollowConfirm": "Are you sure you want to unfollow {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"followConfirm": "Are you sure that you want to follow {name}?",
	"followRequestPending": "Follow request pending",
	"processing": "Processing...",
	"youFollowing": "Followed",
	"followRequest": "Send follow request",
	"follow": "Follow"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"unfollowConfirm": "Möchtest du {name} wirklich nicht mehr folgen?",
	"cancelFollowRequestConfirm": "Möchten Sie die Voll-Anfrage an {name} zurückziehen?",
	"followConfirm": "Möchtest du {name} wirklich folgen?",
	"followRequestPending": "Follow-Anfrage ausstehend",
	"processing": "In Bearbeitung …",
	"youFollowing": "Gefolgt",
	"followRequest": "Follow-Anfrage senden",
	"follow": "Folgen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"unfollowConfirm": "Are you sure you want to unfollow {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"followConfirm": "Are you sure that you want to follow {name}?",
	"followRequestPending": "Follow request pending",
	"processing": "Processing...",
	"youFollowing": "Followed",
	"followRequest": "Send follow request",
	"follow": "Follow"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"unfollowConfirm": "¿Desea dejar de seguir a {name}?",
	"cancelFollowRequestConfirm": "¿Desea cancelar su solicitud de seguimiento a {name}?",
	"followConfirm": "¿Quieres seguir a {name}?",
	"followRequestPending": "Solicitudes de seguimiento pendiente",
	"processing": "Procesando...",
	"youFollowing": "Siguiendo",
	"followRequest": "Enviar solicitud de seguimiento",
	"follow": "Seguir"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"unfollowConfirm": "Désirez-vous vous désabonner de {name} ?",
	"cancelFollowRequestConfirm": "Est-te vous sur de vouloir annuler la demande de suivi de {name} ?",
	"followConfirm": "Êtes-vous sûr·e de vouloir suivre {name} ?",
	"followRequestPending": "Demande d'abonnement en attente de confirmation",
	"processing": "Traitement en cours",
	"youFollowing": "Abonné·e",
	"followRequest": "Demande d’abonnement",
	"follow": "S’abonner"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"unfollowConfirm": "Berhenti mengikuti {name}?",
	"cancelFollowRequestConfirm": "Apa anda yakin ingin membatalkan permintaan mengikuti ke {name}?",
	"followConfirm": "Apakah kamu yakin ingin mengikuti {name}?",
	"followRequestPending": "Permintaan mengikuti yang menunggu",
	"processing": "Memproses",
	"youFollowing": "Mengikuti",
	"followRequest": "Permintaan mengikuti",
	"follow": "Ikuti"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"unfollowConfirm": "Vuoi davvero togliere il Following a {name}?",
	"cancelFollowRequestConfirm": "Vuoi annullare la tua richiesta di follow inviata a {name}?",
	"followConfirm": "Confermi il Following a {name}?",
	"followRequestPending": "Richiesta in approvazione",
	"processing": "In elaborazione",
	"youFollowing": "Following",
	"followRequest": "Richiesta di follow",
	"follow": "Segui"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"unfollowConfirm": "{name}のフォローを解除しますか？",
	"cancelFollowRequestConfirm": "{name}へのフォロー申請をキャンセルしますか？",
	"followConfirm": "{name}をフォローしますか？",
	"followRequestPending": "フォロー許可待ち",
	"processing": "処理中",
	"youFollowing": "フォロー中",
	"followRequest": "フォロー申請",
	"follow": "フォロー"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"unfollowConfirm": "{name}のフォローを解除してもええんか？",
	"cancelFollowRequestConfirm": "{name}へのフォロー申請をキャンセルしますか？",
	"followConfirm": "{name}をフォローしてええか？",
	"followRequestPending": "フォロー許してくれるん待っとる",
	"processing": "処理しとる",
	"youFollowing": "フォロー中やで",
	"followRequest": "フォローを頼む",
	"follow": "フォロー"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"unfollowConfirm": "Are you sure you want to unfollow {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"followConfirm": "Are you sure that you want to follow {name}?",
	"followRequestPending": "Follow request pending",
	"processing": "Processing...",
	"youFollowing": "Followed",
	"followRequest": "Send follow request",
	"follow": "Ḍfeṛ"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"unfollowConfirm": "{name}ಅನ್ನು ಹಿಂಬಾಲಿಸದಿರುವುದೇ?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"followConfirm": "Are you sure that you want to follow {name}?",
	"followRequestPending": "Follow request pending",
	"processing": "Processing...",
	"youFollowing": "Followed",
	"followRequest": "Send follow request",
	"follow": "Follow"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"unfollowConfirm": "{name}님을 언팔로우하시겠습니까?",
	"cancelFollowRequestConfirm": "{name}(으)로의 팔로우 신청을 취소하시겠습니까?",
	"followConfirm": "{name}님을 팔로우 하시겠습니까?",
	"followRequestPending": "팔로우 허가 대기중",
	"processing": "처리중",
	"youFollowing": "팔로잉",
	"followRequest": "팔로우 요청",
	"follow": "팔로우"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"unfollowConfirm": "Weet je zeker dat je {name} wilt ontvolgen?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"followConfirm": "Weet je zeker dat je {name} wilt volgen?",
	"followRequestPending": "Wachten op goedkeuring volgverzoek",
	"processing": "Bezig met verwerken",
	"youFollowing": "Followed",
	"followRequest": "Verzoek om te mogen volgen",
	"follow": "Volgen"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"unfollowConfirm": "Er du sikker på at du vil slutte å følge {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"followConfirm": "Er du sikker på at du vil følge {name}?",
	"followRequestPending": "Venter på godkjenning",
	"processing": "Processing...",
	"youFollowing": "Følger",
	"followRequest": "Følgeforespørsel",
	"follow": "Følg"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"unfollowConfirm": "Czy na pewno chcesz przestać obserwować {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"followConfirm": "Czy na pewno chcesz zaobserwować {name}?",
	"followRequestPending": "Oczekująca prośba o możliwość obserwacji",
	"processing": "Przetwarzanie",
	"youFollowing": "Śledzeni",
	"followRequest": "Poproś o możliwość obserwacji",
	"follow": "Obserwuj"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"unfollowConfirm": "Gostaria de deixar de seguir {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"followConfirm": "Tem certeza que quer seguir {name}?",
	"followRequestPending": "Pedido de seguidor pendente",
	"processing": "Em Progresso",
	"youFollowing": "Seguindo",
	"followRequest": "Enviar pedido de seguidor",
	"follow": "Seguir"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"unfollowConfirm": "Отписаться от {name} ?",
	"cancelFollowRequestConfirm": "Вы уверены, что хотите отменить запрос на подписку пользователю {name}?",
	"followConfirm": "Подписаться на {name}?",
	"followRequestPending": "Нерассмотренный запрос на подписку",
	"processing": "Обработка",
	"youFollowing": "Вы подписаны",
	"followRequest": "Запрос на подписку",
	"follow": "Подписка"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"unfollowConfirm": "Naozaj už nechcete sledovať {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"followConfirm": "Naozaj chcete sledovať {name}?",
	"followRequestPending": "Žiadosť o sledovanie čaká",
	"processing": "Pracujem...",
	"youFollowing": "Sledované",
	"followRequest": "Požiadať o sledovanie",
	"follow": "Sledovať"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"unfollowConfirm": "ต้องการเลิกติดตาม {name} ใช่ไหม?",
	"cancelFollowRequestConfirm": "ยกเลิกคำขอติดตาม {name} ใช่ไหม?",
	"followConfirm": "ต้องการติดตาม {name} ใช่ไหม?",
	"followRequestPending": "รออนุมัติคำขอติดตาม",
	"processing": "กำลังประมวลผล...",
	"youFollowing": "ติดตามแล้ว",
	"followRequest": "ส่งคำขอติดตาม",
	"follow": "ติดตาม"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"unfollowConfirm": "{name} kullanıcısını cidden takipden çıkmak istiyor musun?",
	"cancelFollowRequestConfirm": "{name} adlı kişiye gönderdiğiniz takip isteğini iptal etmek ister misiniz?",
	"followConfirm": "{name} kullanıcısını takip etmek istediğinden emin misin?",
	"followRequestPending": "Takip isteği beklemede",
	"processing": "İşleniyor...",
	"youFollowing": "Takip edildi",
	"followRequest": "Takip isteği gönder",
	"follow": "Takip et"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"unfollowConfirm": "Are you sure you want to unfollow {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"followConfirm": "Are you sure that you want to follow {name}?",
	"followRequestPending": "Follow request pending",
	"processing": "Processing...",
	"youFollowing": "Followed",
	"followRequest": "Send follow request",
	"follow": "Follow"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"unfollowConfirm": "Ви впевнені, що хочете відписатися від {name}?",
	"cancelFollowRequestConfirm": "Ви впевнені, що хочете скасувати запит на підписку до {name}?",
	"followConfirm": "Підписатися на {name}?",
	"followRequestPending": "Очікуючі запити на підписку",
	"processing": "Обробка",
	"youFollowing": "Підписки",
	"followRequest": "Запит на підписку",
	"follow": "Підписатись"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"unfollowConfirm": "Bạn ngừng theo dõi {name}?",
	"cancelFollowRequestConfirm": "Are you sure that you want to cancel your follow request to {name}?",
	"followConfirm": "Bạn theo dõi {name}？",
	"followRequestPending": "Yêu cầu theo dõi đang chờ",
	"processing": "Đang xử lý",
	"youFollowing": "Đang theo dõi",
	"followRequest": "Gửi yêu cầu theo dõi",
	"follow": "Theo dõi"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"unfollowConfirm": "要取消对 {name} 的关注吗？",
	"cancelFollowRequestConfirm": "要取消申请关注{name}吗？",
	"followConfirm": "确定要关注 {name} 吗？",
	"followRequestPending": "关注请求待批准",
	"processing": "正在处理",
	"youFollowing": "正在关注",
	"followRequest": "申请关注",
	"follow": "关注"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"unfollowConfirm": "確定要取消追隨{name}嗎？",
	"cancelFollowRequestConfirm": "要取消向 {name} 送出的追隨申請嗎？",
	"followConfirm": "你真的要追隨{name}嗎？",
	"followRequestPending": "追隨許可待批准",
	"processing": "處理中",
	"youFollowing": "追隨中",
	"followRequest": "追隨請求",
	"follow": "追隨"
}
</locale>
