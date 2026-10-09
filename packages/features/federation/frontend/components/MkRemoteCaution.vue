<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root"><i class="ti ti-alert-triangle" style="margin-right: 8px;"></i>{{ $locale.sfc.remoteUserCaution }}<a v-if="href" :class="$style.link" :href="href" rel="nofollow noopener" target="_blank">{{ $locale.sfc.showOnRemote }}</a></div>
</template>

<script lang="ts" setup>

defineProps<{
	href?: string;
}>();
</script>

<style lang="scss" module>
.root {
	font-size: 0.8em;
	padding: 16px;
	background: var(--MI_THEME-infoWarnBg);
	color: var(--MI_THEME-infoWarnFg);
	border-radius: var(--MI-radius);
	overflow: clip;
}

.link {
	margin-left: 4px;
	color: var(--MI_THEME-accent);
}
</style>

<locale locale="ar-SA" lang="json">
{
  "remoteUserCaution": "هذه المعلومات قد لا تكون مكتملة بما أن المستخدم من مثيل بعيد.",
  "showOnRemote": "رؤيته على مثيل الخادم البُعدي"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "remoteUserCaution": "Ja que aquest usuari resideix a una instància remota, la informació mostrada es podria trobar incompleta.",
  "showOnRemote": "Navega més en el perfil original"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "remoteUserCaution": "Tyto informace nemusí být aktuální jelikož uživatel je ze vzdálené instance.",
  "showOnRemote": "Více na původním profilu"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "remoteUserCaution": "As this user is from a remote instance, the shown information may be incomplete.",
  "showOnRemote": "View on remote instance"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "remoteUserCaution": "Diese Informationen sind möglicherweise unvollständig, da der Benutzer von einer fremden Instanz stammt.",
  "showOnRemote": "Auf Ursprungsinstanz ansehen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "remoteUserCaution": "As this user is from a remote instance, the shown information may be incomplete.",
  "showOnRemote": "View on remote instance"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "remoteUserCaution": "Para el usuario remoto, la información está incompleta",
  "showOnRemote": "Ver en instancia remota"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "remoteUserCaution": "Les informations de ce compte risqueraient d’être incomplètes du fait que l’utilisateur·rice provient d’une instance distante.",
  "showOnRemote": "Voir sur l’instance distante"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "remoteUserCaution": "Informasi ini mungkin tidak mutakhir, karena pengguna ini berasal dari peladen instansi luar.",
  "showOnRemote": "Lihat profil asli"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "remoteUserCaution": "Le informazioni potrebbero essere incomplete poiché questo profilo remoto potrebbe non essere completamente federato.",
  "showOnRemote": "Leggi sull'istanza remota"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "remoteUserCaution": "リモートユーザーのため、情報が不完全です。",
  "showOnRemote": "リモートで表示"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "remoteUserCaution": "リモートユーザーやから、足りひん情報あるかもしれへん。",
  "showOnRemote": "リモートで見る"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "remoteUserCaution": "As this user is from a remote instance, the shown information may be incomplete.",
  "showOnRemote": "View on remote instance"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "remoteUserCaution": "As this user is from a remote instance, the shown information may be incomplete.",
  "showOnRemote": "View on remote instance"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "remoteUserCaution": "리모트 유저이기 때문에, 정보가 정확하지 않을 수 있습니다.",
  "showOnRemote": "리모트에서 보기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "remoteUserCaution": "Aangezien deze gebruiker van een externe server afkomstig is, kan de weergegeven informatie onvolledig zijn.",
  "showOnRemote": "Toon op de externe instantie."
}
</locale>

<locale locale="no-NO" lang="json">
{
  "remoteUserCaution": "As this user is from a remote instance, the shown information may be incomplete.",
  "showOnRemote": "View on remote instance"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "remoteUserCaution": "Te informacje mogą nie być aktualne, ponieważ użytkownik pochodzi ze zdalnej instancji.",
  "showOnRemote": "Zobacz na zdalnej instancji"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "remoteUserCaution": "As informações estão incompletas porque é um utilizador remoto.",
  "showOnRemote": "Exibir remotamente"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "remoteUserCaution": "Это пользователь с другого сайта, поэтому информация может быть неточной.",
  "showOnRemote": "Перейти к оригиналу на сайт"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "remoteUserCaution": "Tieto informácie nemusia byť aktuálne, keďže používateľ je na vzdialenom serveri.",
  "showOnRemote": "Zobraziť na vzdialenom serveri"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "remoteUserCaution": "ข้อมูลอาจไม่สมบูรณ์เนื่องจากผู้ใช้รายนี้มาจากเซิร์ฟเวอร์ระยะไกล",
  "showOnRemote": "ดูบนเซิร์ฟเวอร์ฝั่งระยะไกล"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "remoteUserCaution": "Bu kullanıcı uzak bir sunucudan geldiği için, gösterilen bilgiler eksik olabilir.",
  "showOnRemote": "Uzak sunucuda görüntüle"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "remoteUserCaution": "As this user is from a remote instance, the shown information may be incomplete.",
  "showOnRemote": "View on remote instance"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "remoteUserCaution": "Інформація може бути неповною, оскільки це віддалений користувач.",
  "showOnRemote": "Переглянути в оригіналі"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "remoteUserCaution": "Vì người dùng này ở máy chủ khác, thông tin hiển thị có thể không đầy đủ.",
  "showOnRemote": "Truy cập trang của người này"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "remoteUserCaution": "由于此用户来自其它服务器，显示的信息可能不完整。",
  "showOnRemote": "转到所在服务器显示"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "remoteUserCaution": "由於該使用者來自其他實例，因此其資訊可能不完整。",
  "showOnRemote": "轉到所在實例顯示"
}
</locale>
