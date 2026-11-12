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
		<MkButton :class="$style.gotIt" primary full @click="modal?.close()">{{ globalLocale.env.gotIt }}</MkButton>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { onMounted, useTemplateRef } from 'vue';
import { version } from '@features/boot/frontend/shared/config.js';
import MkModal from '@features/ui/frontend/components/MkModal.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkSparkle from '@features/ui/frontend/components/MkSparkle.vue';
import { confetti } from '@features/ui/frontend/utility/confetti.js';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

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
  "whatIsNew": "اعرض التغييرات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "misskeyUpdated": "Misskey s'ha actualitzat ",
  "thankYouForTestingBeta": "Gràcies per ajudar-nos a provar la versió beta!",
  "whatIsNew": "Mostra canvis"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "misskeyUpdated": "Misskey byl aktualizován!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Zobrazit změny"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "misskeyUpdated": "Misskey has been updated!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Show changes"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "misskeyUpdated": "Misskey wurde aktualisiert!",
  "thankYouForTestingBeta": "Vielen Dank für Ihre Unterstützung beim Testen der Beta-Version!",
  "whatIsNew": "Änderungen anzeigen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "misskeyUpdated": "Misskey has been updated!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Show changes"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "misskeyUpdated": "¡Misskey ha sido actualizado!",
  "thankYouForTestingBeta": "¡Gracias por tu colaboración en la prueba de la versión beta!",
  "whatIsNew": "Mostrar cambios"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "misskeyUpdated": "Misskey a été mis à jour !",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Voir les derniers changements"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "misskeyUpdated": "Misskey telah dimutakhirkan!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Lihat perubahan pemutakhiran"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "misskeyUpdated": "Misskey è stato aggiornato!",
  "thankYouForTestingBeta": "Grazie per la tua collaborazione nella verifica delle versioni beta!",
  "whatIsNew": "Informazioni sull'aggiornamento"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "misskeyUpdated": "Misskeyが更新されました！",
  "thankYouForTestingBeta": "ベータ版の検証にご協力いただきありがとうございます！",
  "whatIsNew": "更新情報を見る"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "misskeyUpdated": "Misskeyが更新されたで！\nモデレーターの人らに感謝せなあかんで",
  "thankYouForTestingBeta": "ベータ版使うてくれておおきに！",
  "whatIsNew": "更新情報を見るで"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "misskeyUpdated": "Misskey has been updated!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Show changes"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "misskeyUpdated": "Misskey has been updated!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Show changes"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "misskeyUpdated": "Misskey가 업데이트 되었습니다!",
  "thankYouForTestingBeta": "베타 버전의 검증에 협력해 주셔서 감사합니다!",
  "whatIsNew": "패치 정보 보기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "misskeyUpdated": "Misskey is bijgewerkt!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Wijzigingen tonen"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "misskeyUpdated": "Misskey har blitt oppdatert!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Show changes"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "misskeyUpdated": "Misskey zostało zaktualizowane!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Pokaż zmiany"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "misskeyUpdated": "Misskey foi atualizado!",
  "thankYouForTestingBeta": "Obrigado por nos ajudar a testar a versão beta!",
  "whatIsNew": "Ver atualizações"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "misskeyUpdated": "Misskey обновился!",
  "thankYouForTestingBeta": "Спасибо вам за помощь с тестированием бета-версии!",
  "whatIsNew": "Что новенького?"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "misskeyUpdated": "Misskey sa aktualizoval!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Čo je nové?"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "misskeyUpdated": "Misskey ได้รับการอัปเดตแล้ว!",
  "thankYouForTestingBeta": "ขอบคุณที่ให้ความร่วมมือในการทดสอบเวอร์ชันเบต้า!",
  "whatIsNew": "แสดงการเปลี่ยนแปลง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "misskeyUpdated": "Misskey güncellendi!",
  "thankYouForTestingBeta": "Beta sürümünü test ettiğin için teşekkür ederiz!",
  "whatIsNew": "Değişiklikleri göster"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "misskeyUpdated": "Misskey has been updated!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Show changes"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "misskeyUpdated": "Misskey оновлено!",
  "thankYouForTestingBeta": "Дякуємо, що допомагаєте нам тестувати бета-версію!",
  "whatIsNew": "Показати зміни"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "misskeyUpdated": "Misskey vừa được cập nhật!",
  "thankYouForTestingBeta": "Thank you for helping us test the beta version!",
  "whatIsNew": "Hiện những thay đổi"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "misskeyUpdated": "Misskey 更新完成！",
  "thankYouForTestingBeta": "感谢您协助测试 beta 版！",
  "whatIsNew": "显示更新信息"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "misskeyUpdated": "Misskey 更新完成！",
  "thankYouForTestingBeta": "感謝您協助驗證 beta 版！",
  "whatIsNew": "顯示更新資訊"
}
</locale>
