<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<button
	class="_button"
	:class="[$style.root, { [$style.wait]: wait, [$style.active]: isFollowing, [$style.full]: full }]"
	:disabled="wait"
	@click="onClick"
>
	<template v-if="!wait">
		<template v-if="isFollowing">
			<span v-if="full" :class="$style.text">{{ $locale.sfc.unfollow }}</span><i class="ti ti-minus"></i>
		</template>
		<template v-else>
			<span v-if="full" :class="$style.text">{{ $locale.sfc.follow }}</span><i class="ti ti-plus"></i>
		</template>
	</template>
	<template v-else>
		<span v-if="full" :class="$style.text">{{ $locale.sfc.processing }}</span><MkLoading :em="true"/>
	</template>
</button>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';

const props = withDefaults(defineProps<{
	channel: Misskey.entities.Channel;
	full?: boolean;
}>(), {
	full: false,
});

const isFollowing = ref(props.channel.isFollowing);
const wait = ref(false);

async function onClick() {
	wait.value = true;

	try {
		if (isFollowing.value) {
			await misskeyApi('channels/unfollow', {
				channelId: props.channel.id,
			});
			isFollowing.value = false;
		} else {
			await misskeyApi('channels/follow', {
				channelId: props.channel.id,
			});
			isFollowing.value = true;
		}
	} catch (err) {
		console.error(err);
	} finally {
		wait.value = false;
	}
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: inline-block;
	font-weight: bold;
	color: var(--MI_THEME-accent);
	background: transparent;
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

<locale locale="ar-SA" lang="json">
{
  "unfollow": "إلغاء الاشتراك",
  "follow": "تابِع",
  "processing": "المعالجة جارية"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "unfollow": "Deixar de seguir",
  "follow": "Segueix",
  "processing": "S'està processant..."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "unfollow": "Přestat sledovat",
  "follow": "Sledovaní",
  "processing": "Zpracovávám"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "unfollow": "Unfollow",
  "follow": "Follow",
  "processing": "Processing..."
}
</locale>

<locale locale="de-DE" lang="json">
{
  "unfollow": "Entfolgen",
  "follow": "Folgen",
  "processing": "In Bearbeitung …"
}
</locale>

<locale locale="en-US" lang="json">
{
  "unfollow": "Unfollow",
  "follow": "Follow",
  "processing": "Processing..."
}
</locale>

<locale locale="es-ES" lang="json">
{
  "unfollow": "Dejar de seguir",
  "follow": "Seguir",
  "processing": "Procesando..."
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "unfollow": "Se désabonner",
  "follow": "S’abonner",
  "processing": "Traitement en cours"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "unfollow": "Berhenti mengikuti",
  "follow": "Ikuti",
  "processing": "Memproses"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "unfollow": "Togli Following",
  "follow": "Segui",
  "processing": "In elaborazione"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "unfollow": "フォロー解除",
  "follow": "フォロー",
  "processing": "処理中"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "unfollow": "フォローやめる",
  "follow": "フォロー",
  "processing": "処理しとる"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "unfollow": "Unfollow",
  "follow": "Ḍfeṛ",
  "processing": "Processing..."
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "unfollow": "Unfollow",
  "follow": "Follow",
  "processing": "Processing..."
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "unfollow": "팔로우 해제",
  "follow": "팔로우",
  "processing": "처리중"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "unfollow": "Ontvolgen",
  "follow": "Volgen",
  "processing": "Bezig met verwerken"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "unfollow": "Avfølg",
  "follow": "Følg",
  "processing": "Processing..."
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "unfollow": "Przestań obserwować",
  "follow": "Obserwuj",
  "processing": "Przetwarzanie"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "unfollow": "Deixar de seguir",
  "follow": "Seguir",
  "processing": "Em Progresso"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "unfollow": "Отписаться",
  "follow": "Подписка",
  "processing": "Обработка"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "unfollow": "Nesledovať",
  "follow": "Sledovať",
  "processing": "Pracujem..."
}
</locale>

<locale locale="th-TH" lang="json">
{
  "unfollow": "เลิกติดตาม",
  "follow": "ติดตาม",
  "processing": "กำลังประมวลผล..."
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "unfollow": "Takibi bırak",
  "follow": "Takip et",
  "processing": "İşleniyor..."
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "unfollow": "Unfollow",
  "follow": "Follow",
  "processing": "Processing..."
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "unfollow": "Відписатись",
  "follow": "Підписатись",
  "processing": "Обробка"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "unfollow": "Ngưng theo dõi",
  "follow": "Theo dõi",
  "processing": "Đang xử lý"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "unfollow": "取消关注",
  "follow": "关注",
  "processing": "正在处理"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "unfollow": "取消追隨",
  "follow": "追隨",
  "processing": "處理中"
}
</locale>
