<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" preferType="dialog" :zPriority="'middle'" @click="modal?.close()" @closed="emit('closed')">
	<div :class="$style.root">
		<div :class="$style.title"><MkSparkle>{{ $locale.sfc.misskeyUpdated }}</MkSparkle></div>
		<div :class="$style.version">✨{{ version }}🚀</div>
		<div v-if="isBeta" :class="$style.beta">{{ $locale.sfc.thankYouForTestingBeta }}</div>
		<MkButton full @click="whatIsNew">{{ $locale.sfc.whatIsNew }}</MkButton>
		<MkButton :class="$style.gotIt" primary full @click="modal?.close()">{{ $locale.sfc.gotIt }}</MkButton>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { onMounted, useTemplateRef } from 'vue';
import { version } from '@@/js/config.js';
import MkModal from '@features/ui/frontend/components/MkModal.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkSparkle from '@features/ui/frontend/components/MkSparkle.vue';
import { confetti } from '@features/ui/frontend/utility/confetti.js';

const modal = useTemplateRef('modal');

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const isBeta = version.includes('-beta') || version.includes('-alpha') || version.includes('-rc');

function whatIsNew() {
	modal.value?.close();
	if (isBeta) {
		window.open(`https://github.com/misskey-dev/misskey/releases/tag/${version}`, '_blank');
	} else {
		window.open(`https://misskey-hub.net/docs/releases/#_${version.replace(/\./g, '')}`, '_blank');
	}
}

onMounted(() => {
	confetti({
		duration: 1000 * 3,
	});
});
</script>

<style lang="scss" module>
.root {
	margin: auto;
	position: relative;
	padding: 32px;
	min-width: 320px;
	max-width: 480px;
	box-sizing: border-box;
	text-align: center;
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
}

.title {
	font-weight: bold;
}

.version {
	margin: 1em 0;
}

.beta {
	margin: 1em 0;
}

.gotIt {
	margin: 8px 0 0 0;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "misskeyUpdated": "حُدث ميسكي!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "اعرض التغييرات",
  "gotIt": "فهِمت"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "misskeyUpdated": "Misskey s'ha actualitzat ",
  "thankYouForTestingBeta": "Gràcies per ajudar-nos a provar la versió beta!",
  "whatIsNew": "Mostra canvis",
  "gotIt": "D'acord "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "misskeyUpdated": "Misskey byl aktualizován!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Zobrazit změny",
  "gotIt": "Rozumím!"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "misskeyUpdated": "Misskey has been updated!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Show changes",
  "gotIt": "Got it!"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "misskeyUpdated": "Misskey wurde aktualisiert!",
  "thankYouForTestingBeta": "Vielen Dank für Ihre Unterstützung beim Testen der Beta-Version!",
  "whatIsNew": "Änderungen anzeigen",
  "gotIt": "Verstanden!"
}
</locale>

<locale locale="en-US" lang="json">
{
  "misskeyUpdated": "Misskey has been updated!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Show changes",
  "gotIt": "Got it!"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "misskeyUpdated": "¡Misskey ha sido actualizado!",
  "thankYouForTestingBeta": "¡Gracias por tu colaboración en la prueba de la versión beta!",
  "whatIsNew": "Mostrar cambios",
  "gotIt": "¡Lo tengo!"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "misskeyUpdated": "Misskey a été mis à jour !",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Voir les derniers changements",
  "gotIt": "J’ai compris !"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "misskeyUpdated": "Misskey telah dimutakhirkan!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Lihat perubahan pemutakhiran",
  "gotIt": "Mengerti"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "misskeyUpdated": "Misskey è stato aggiornato!",
  "thankYouForTestingBeta": "Grazie per la tua collaborazione nella verifica delle versioni beta!",
  "whatIsNew": "Informazioni sull'aggiornamento",
  "gotIt": "ok!"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "misskeyUpdated": "Misskeyが更新されました！",
  "thankYouForTestingBeta": "ベータ版の検証にご協力いただきありがとうございます！",
  "whatIsNew": "更新情報を見る",
  "gotIt": "わかった"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "misskeyUpdated": "Misskeyが更新されたで！\nモデレーターの人らに感謝せなあかんで",
  "thankYouForTestingBeta": "ベータ版使うてくれておおきに！",
  "whatIsNew": "更新情報を見るで",
  "gotIt": "ほい"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "misskeyUpdated": "Misskey has been updated!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Show changes",
  "gotIt": "Got it!"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "misskeyUpdated": "Misskey has been updated!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Show changes",
  "gotIt": "ಅರ್ಥವಾಯಿತು!"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "misskeyUpdated": "Misskey가 업데이트 되었습니다!",
  "thankYouForTestingBeta": "베타 버전의 검증에 협력해 주셔서 감사합니다!",
  "whatIsNew": "패치 정보 보기",
  "gotIt": "알겠어요"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "misskeyUpdated": "Misskey is bijgewerkt!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Wijzigingen tonen",
  "gotIt": "Begrepen"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "misskeyUpdated": "Misskey har blitt oppdatert!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Show changes",
  "gotIt": "Skjønner"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "misskeyUpdated": "Misskey zostało zaktualizowane!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Pokaż zmiany",
  "gotIt": "Rozumiem!"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "misskeyUpdated": "Misskey foi atualizado!",
  "thankYouForTestingBeta": "Obrigado por nos ajudar a testar a versão beta!",
  "whatIsNew": "Ver atualizações",
  "gotIt": "Entendi"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "misskeyUpdated": "Misskey обновился!",
  "thankYouForTestingBeta": "Спасибо вам за помощь с тестированием бета-версии!",
  "whatIsNew": "Что новенького?",
  "gotIt": "Ясно!"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "misskeyUpdated": "Misskey sa aktualizoval!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Čo je nové?",
  "gotIt": "Rozumiem!"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "misskeyUpdated": "Misskey ได้รับการอัปเดตแล้ว!",
  "thankYouForTestingBeta": "ขอบคุณที่ให้ความร่วมมือในการทดสอบเวอร์ชันเบต้า!",
  "whatIsNew": "แสดงการเปลี่ยนแปลง",
  "gotIt": "เข้าใจแล้ว !"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "misskeyUpdated": "Misskey güncellendi!",
  "thankYouForTestingBeta": "Beta sürümünü test ettiğin için teşekkür ederiz!",
  "whatIsNew": "Değişiklikleri göster",
  "gotIt": "Anladım!"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "misskeyUpdated": "Misskey has been updated!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Show changes",
  "gotIt": "Got it!"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "misskeyUpdated": "Misskey оновлено!",
  "thankYouForTestingBeta": "Дякуємо, що допомагаєте нам тестувати бета-версію!",
  "whatIsNew": "Показати зміни",
  "gotIt": "Зрозуміло!"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "misskeyUpdated": "Misskey vừa được cập nhật!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Hiện những thay đổi",
  "gotIt": "Hiểu rồi!"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "misskeyUpdated": "Misskey 更新完成！",
  "thankYouForTestingBeta": "感谢您协助测试 beta 版！",
  "whatIsNew": "显示更新信息",
  "gotIt": "好"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "misskeyUpdated": "Misskey 更新完成！",
  "thankYouForTestingBeta": "感謝您協助驗證 beta 版！",
  "whatIsNew": "顯示更新資訊",
  "gotIt": "知道了"
}
</locale>
