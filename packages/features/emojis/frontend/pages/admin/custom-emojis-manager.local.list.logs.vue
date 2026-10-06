<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow
	ref="uiWindow"
	:initialWidth="400"
	:initialHeight="500"
	:canResize="true"
	@closed="emit('closed')"
>
	<template #header>
		<i class="ti ti-notes" style="margin-right: 0.5em;"></i> {{ $locale.sfc.registrationLogs }}
	</template>
	<div class="_spacer">
		<XRegisterLogs :logs="logs"/>
	</div>
</MkWindow>
</template>

<script setup lang="ts">
import MkWindow from '@features/ui/frontend/components/MkWindow.vue';
import XRegisterLogs from '@features/emojis/frontend/pages/admin/custom-emojis-manager.logs.vue';

import type { RequestLogItem } from '@features/emojis/frontend/pages/admin/custom-emojis-manager.impl.js';

defineProps<{
	logs: RequestLogItem[];
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

</script>

<locale locale="ar-SA" lang="json">
{
  "registrationLogs": "Registration log"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "registrationLogs": "Registres d'inscripcions "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "registrationLogs": "Registration log"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "registrationLogs": "Registration log"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "registrationLogs": "Registrierungsprotokoll"
}
</locale>

<locale locale="en-US" lang="json">
{
  "registrationLogs": "Registration log"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "registrationLogs": "Log de registros "
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "registrationLogs": "Registration log"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "registrationLogs": "Registration log"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "registrationLogs": "Storico della registrazione"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "registrationLogs": "登録ログ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "registrationLogs": "登録ログ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "registrationLogs": "Registration log"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "registrationLogs": "Registration log"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "registrationLogs": "등록 로그"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "registrationLogs": "Registration log"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "registrationLogs": "Registration log"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "registrationLogs": "Registration log"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "registrationLogs": "Histórico de registros"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "registrationLogs": "Журнал регистрации"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "registrationLogs": "Registration log"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "registrationLogs": "ปูมการลงทะเบียน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "registrationLogs": "Kayıt günlüğü"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "registrationLogs": "Registration log"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "registrationLogs": "Registration log"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "registrationLogs": "Registration log"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "registrationLogs": "注册日志"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "registrationLogs": "登錄日誌"
}
</locale>
