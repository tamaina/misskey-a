<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 20px;">
		<div class="_gaps_m">
			<MkKeyValue :copy="instance.maintainerName">
				<template #key>{{ $locale.sfc.administrator }}</template>
				<template #value>
					<template v-if="instance.maintainerName">{{ instance.maintainerName }}</template>
					<span v-else style="opacity: 0.7;">({{ $locale.sfc.none }})</span>
				</template>
			</MkKeyValue>
			<MkKeyValue :copy="instance.maintainerEmail">
				<template #key>{{ $locale.sfc.contact }}</template>
				<template #value>
					<template v-if="instance.maintainerEmail">{{ instance.maintainerEmail }}</template>
					<span v-else style="opacity: 0.7;">({{ $locale.sfc.none }})</span>
				</template>
			</MkKeyValue>
			<MkKeyValue :copy="instance.inquiryUrl">
				<template #key>{{ $locale.sfc.inquiry }}</template>
				<template #value>
					<MkLink v-if="instance.inquiryUrl" :url="instance.inquiryUrl" target="_blank">{{ instance.inquiryUrl }}</MkLink>
					<span v-else style="opacity: 0.7;">({{ $locale.sfc.none }})</span>
				</template>
			</MkKeyValue>
			<MkFolder @opened="onOpened">
				<template #icon><i class="ti ti-report-search"></i></template>
				<template #label>{{ $locale.sfc.deviceInfo }}</template>
				<template #caption>{{ $locale.sfc.deviceInfoDescription }}</template>
				<MkLoading v-if="userEnv == null" />
				<MkCode v-else lang="json" :code="JSON.stringify(userEnv, null, 2)" style="max-height: 300px; overflow: auto;"/>
			</MkFolder>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { instance } from '@features/instance/frontend/instance.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { getUserEnvironment } from '@features/users/frontend/utility/get-user-environment.js';
import type { UserEnvironment } from '@features/users/frontend/utility/get-user-environment.js';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkLink from '@features/navigation/frontend/components/MkLink.vue';
import MkCode from '@features/markup/frontend/components/MkCode.vue';

const userEnv = ref<UserEnvironment | null>(null);

async function onOpened() {
	if (userEnv.value == null) {
		userEnv.value = await getUserEnvironment();
	}
}

definePage(() => ({
	title: $locale.value.sfc.inquiry,
	icon: 'ti ti-help-circle',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"administrator": "المدير",
	"none": "لا شيء",
	"contact": "التواصل",
	"inquiry": "Contact",
	"deviceInfo": "Device information",
	"deviceInfoDescription": "When making technical inquiries, including the following information may help resolve the issue."
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"administrator": "Administrador/a",
	"none": "Res",
	"contact": "Contacte",
	"inquiry": "Contacte",
	"deviceInfo": "Informació del dispositiu",
	"deviceInfoDescription": "En fer consultes tècniques influir la següent informació pot ajudar a resoldre'l més ràpidament."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"administrator": "Administrátor",
	"none": "Žádný",
	"contact": "Kontakt",
	"inquiry": "Contact",
	"deviceInfo": "Device information",
	"deviceInfoDescription": "When making technical inquiries, including the following information may help resolve the issue."
}
</locale>

<locale locale="da-DK" lang="json">
{
	"administrator": "Administrator",
	"none": "None",
	"contact": "Contact",
	"inquiry": "Contact",
	"deviceInfo": "Device information",
	"deviceInfoDescription": "When making technical inquiries, including the following information may help resolve the issue."
}
</locale>

<locale locale="de-DE" lang="json">
{
	"administrator": "Administrator",
	"none": "Nichts",
	"contact": "Kontakt",
	"inquiry": "Kontakt",
	"deviceInfo": "Geräteinformation",
	"deviceInfoDescription": "Bei technischen Anfragen kann es hilfreich sein, die folgenden Informationen anzugeben, da dies zur Lösung des Problems beitragen kann."
}
</locale>

<locale locale="en-US" lang="json">
{
	"administrator": "Administrator",
	"none": "None",
	"contact": "Contact",
	"inquiry": "Contact",
	"deviceInfo": "Device information",
	"deviceInfoDescription": "When making technical inquiries, including the following information may help resolve the issue."
}
</locale>

<locale locale="es-ES" lang="json">
{
	"administrator": "Administrador",
	"none": "Ninguna",
	"contact": "Contacto",
	"inquiry": "Contacto",
	"deviceInfo": "Información del dispositivo",
	"deviceInfoDescription": "Al realizar consultas técnicas, incluir la siguiente información puede ayudar a resolver el problema."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"administrator": "Administrateur",
	"none": "Rien",
	"contact": "Contact",
	"inquiry": "Contact",
	"deviceInfo": "Device information",
	"deviceInfoDescription": "When making technical inquiries, including the following information may help resolve the issue."
}
</locale>

<locale locale="id-ID" lang="json">
{
	"administrator": "Admin",
	"none": "Tidak ada",
	"contact": "Kontak",
	"inquiry": "Hubungi kami",
	"deviceInfo": "Device information",
	"deviceInfoDescription": "When making technical inquiries, including the following information may help resolve the issue."
}
</locale>

<locale locale="it-IT" lang="json">
{
	"administrator": "Amministratore",
	"none": "Nessuna",
	"contact": "Contatti",
	"inquiry": "Contattaci",
	"deviceInfo": "Informazioni sul dispositivo",
	"deviceInfoDescription": "Se ci contatti per ricevere supporto tecnico, ti preghiamo di includere le seguenti informazioni per aiutarci a risolvere il tuo problema."
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"administrator": "管理者",
	"none": "なし",
	"contact": "連絡先",
	"inquiry": "お問い合わせ",
	"deviceInfo": "デバイス情報",
	"deviceInfoDescription": "技術的なお問い合わせの際に、以下の情報を併記すると問題の解決に役立つことがあります。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"administrator": "管理者",
	"none": "なし",
	"contact": "連絡先",
	"inquiry": "問い合わせ",
	"deviceInfo": "デバイス情報",
	"deviceInfoDescription": "なんか技術的なことで分からんこと聞くときは、下の情報も一緒に書いてもらえると、こっちも分かりやすいし、はよ直ると思います。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"administrator": "Administrator",
	"none": "None",
	"contact": "Contact",
	"inquiry": "Contact",
	"deviceInfo": "Device information",
	"deviceInfoDescription": "When making technical inquiries, including the following information may help resolve the issue."
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"administrator": "Administrator",
	"none": "None",
	"contact": "Contact",
	"inquiry": "Contact",
	"deviceInfo": "Device information",
	"deviceInfoDescription": "When making technical inquiries, including the following information may help resolve the issue."
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"administrator": "관리자",
	"none": "없음",
	"contact": "연락처",
	"inquiry": "문의하기",
	"deviceInfo": "장치 정보",
	"deviceInfoDescription": "기술적 문의의 경우 아래의 정보를 병기하면 문제의 해결에 도움이 됩니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"administrator": "Beheerder",
	"none": "Niets",
	"contact": "Contact",
	"inquiry": "Contact",
	"deviceInfo": "Device information",
	"deviceInfoDescription": "When making technical inquiries, including the following information may help resolve the issue."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"administrator": "Administrator",
	"none": "Ingen",
	"contact": "Kontakt",
	"inquiry": "Contact",
	"deviceInfo": "Device information",
	"deviceInfoDescription": "When making technical inquiries, including the following information may help resolve the issue."
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"administrator": "Admin",
	"none": "Brak",
	"contact": "Kontakt",
	"inquiry": "Contact",
	"deviceInfo": "Device information",
	"deviceInfoDescription": "When making technical inquiries, including the following information may help resolve the issue."
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"administrator": "Administrador",
	"none": "Nenhum",
	"contact": "Contato",
	"inquiry": "Contato",
	"deviceInfo": "Device information",
	"deviceInfoDescription": "When making technical inquiries, including the following information may help resolve the issue."
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"administrator": "Администратор",
	"none": "Ничего",
	"contact": "Почта для связи",
	"inquiry": "Связаться",
	"deviceInfo": "Об устройстве",
	"deviceInfoDescription": "Эта информация может быть полезна при обращении в поддержку"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"administrator": "Administrátor",
	"none": "Žiadne",
	"contact": "Kontakt",
	"inquiry": "Contact",
	"deviceInfo": "Device information",
	"deviceInfoDescription": "When making technical inquiries, including the following information may help resolve the issue."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"administrator": "ผู้ดูแลระบบ",
	"none": "ไม่มี",
	"contact": "ติดต่อ",
	"inquiry": "ติดต่อเรา",
	"deviceInfo": "รายละเอียดอุปกรณ์",
	"deviceInfoDescription": "เมื่อต้องการรับความช่วยเหลือทางเทคนิค กรุณาระบุข้อมูลต่อไปนี้ซึ่งอาจช่วยแก้ไขปัญหาได้"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"administrator": "Yönetici",
	"none": "Hiçbiri",
	"contact": "İletişim",
	"inquiry": "İletişim",
	"deviceInfo": "Cihaz Bilgileri",
	"deviceInfoDescription": "Teknik bir sorunuz olduğunda, aşağıdaki bilgileri eklemeniz sorunun çözülmesine yardımcı olabilir."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"administrator": "Administrator",
	"none": "None",
	"contact": "Contact",
	"inquiry": "Contact",
	"deviceInfo": "Device information",
	"deviceInfoDescription": "When making technical inquiries, including the following information may help resolve the issue."
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"administrator": "Адмін",
	"none": "Відсутній",
	"contact": "Контакт",
	"inquiry": "Зв'язок",
	"deviceInfo": "Відомості про пристрій",
	"deviceInfoDescription": "Під час технічного звернення додавання наведеної нижче інформації може допомогти розв’язати проблему."
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"administrator": "Quản trị viên",
	"none": "Không",
	"contact": "Liên hệ",
	"inquiry": "Contact",
	"deviceInfo": "Device information",
	"deviceInfoDescription": "When making technical inquiries, including the following information may help resolve the issue."
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"administrator": "管理员",
	"none": "无",
	"contact": "联系方式",
	"inquiry": "联系我们",
	"deviceInfo": "设备信息",
	"deviceInfoDescription": "咨询技术问题时，将以下信息一并发送有助于解决问题。"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"administrator": "管理員",
	"none": "無",
	"contact": "聯絡人",
	"inquiry": "聯絡我們",
	"deviceInfo": "硬體資訊",
	"deviceInfoDescription": "在提出技術性諮詢時，若能同時提供以下資訊，將有助於解決問題。"
}
</locale>
