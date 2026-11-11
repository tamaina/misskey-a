<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<div :class="$style.banner" :style="{ backgroundImage: instance.bannerUrl ? `url(${ instance.bannerUrl })` : undefined }">
		<div style="overflow: clip;">
			<img :src="instance.iconUrl ?? '/favicon.ico'" alt="" :class="$style.bannerIcon"/>
			<div :class="$style.bannerName">
				<b>{{ instance.name ?? host }}</b>
			</div>
		</div>
	</div>

	<MkKeyValue>
		<template #key>{{ globalLocale.env.description }}</template>
		<template #value><div v-html="instance.description"></div></template>
	</MkKeyValue>

	<FormSection>
		<div class="_gaps_m">
			<MkKeyValue :copy="version">
				<template #key>{{ productName }}</template>
				<template #value>{{ version }}</template>
			</MkKeyValue>
			<div v-html="interpolateLocaleParameters($locale.sfc.poweredByMisskeyDescription, { name: instance.name ?? host })">
			</div>
			<FormLink to="/about-misskey">
				<template #icon><i class="ti ti-info-circle"></i></template>
				{{ interpolateLocaleParameters($locale.sfc.aboutMisskey, { productName }) }}
			</FormLink>
			<FormLink v-if="instance.repositoryUrl || instance.providesTarball" :to="instance.repositoryUrl || `/tarball/misskey-${version}.tar.gz`" external>
				<template #icon><i class="ti ti-code"></i></template>
				{{ $locale.sfc.sourceCode }}
			</FormLink>
			<MkInfo v-else warn>
				{{ $locale.sfc.sourceCodeIsNotYetProvided }}
			</MkInfo>
		</div>
	</FormSection>

	<FormSection>
		<div class="_gaps_m">
			<FormSplit>
				<MkKeyValue :copy="instance.maintainerName">
					<template #key>{{ globalLocale.env.administrator }}</template>
					<template #value>
						<template v-if="instance.maintainerName">{{ instance.maintainerName }}</template>
						<span v-else style="opacity: 0.7;">({{ globalLocale.env.none }})</span>
					</template>
				</MkKeyValue>
				<MkKeyValue :copy="instance.maintainerEmail">
					<template #key>{{ $locale.sfc.contact }}</template>
					<template #value>
						<template v-if="instance.maintainerEmail">{{ instance.maintainerEmail }}</template>
						<span v-else style="opacity: 0.7;">({{ globalLocale.env.none }})</span>
					</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ $locale.sfc.inquiry }}</template>
					<template #value>
						<MkLink v-if="instance.inquiryUrl" :url="instance.inquiryUrl" target="_blank">{{ instance.inquiryUrl }}</MkLink>
						<span v-else style="opacity: 0.7;">({{ globalLocale.env.none }})</span>
					</template>
				</MkKeyValue>
			</FormSplit>
			<div class="_gaps_s">
				<FormLink v-if="instance.impressumUrl" :to="instance.impressumUrl" external>
					<template #icon><i class="ti ti-user-shield"></i></template>
					<template #default>{{ $locale.sfc.impressum }}</template>
				</FormLink>
				<MkFolder v-if="instance.serverRules.length > 0">
					<template #icon><i class="ti ti-checkup-list"></i></template>
					<template #label>{{ $locale.sfc.serverRules }}</template>
					<ol class="_gaps_s" :class="$style.rules">
						<li v-for="item in instance.serverRules" :key="item" :class="$style.rule">
							<div :class="$style.ruleText" v-html="item"></div>
						</li>
					</ol>
				</MkFolder>
				<FormLink v-if="instance.tosUrl" :to="instance.tosUrl" external>
					<template #icon><i class="ti ti-license"></i></template>
					<template #default>{{ globalLocale.env.termsOfService }}</template>
				</FormLink>
				<FormLink v-if="instance.privacyPolicyUrl" :to="instance.privacyPolicyUrl" external>
					<template #icon><i class="ti ti-shield-lock"></i></template>
					<template #default>{{ globalLocale.env.privacyPolicy }}</template>
				</FormLink>
				<FormLink v-if="instance.feedbackUrl" :to="instance.feedbackUrl" external>
					<template #icon><i class="ti ti-message"></i></template>
					<template #default>{{ $locale.sfc.feedback }}</template>
				</FormLink>
			</div>
		</div>
	</FormSection>

	<MkSuspense v-slot="{ result: stats }" :p="initStats">
		<FormSection>
			<template #label>{{ $locale.sfc.statistics }}</template>
			<FormSplit>
				<MkKeyValue>
					<template #key>{{ globalLocale.env.users }}</template>
					<template #value>{{ number(stats.originalUsersCount) }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ globalLocale.env.notes }}</template>
					<template #value>{{ number(stats.originalNotesCount) }}</template>
				</MkKeyValue>
			</FormSplit>
		</FormSection>
	</MkSuspense>

	<FormSection>
		<template #label>Well-known resources</template>
		<div class="_gaps_s">
			<FormLink to="/.well-known/host-meta" external>host-meta</FormLink>
			<FormLink to="/.well-known/host-meta.json" external>host-meta.json</FormLink>
			<FormLink to="/.well-known/nodeinfo" external>nodeinfo</FormLink>
			<FormLink to="/robots.txt" external>robots.txt</FormLink>
			<FormLink to="/manifest.json" external>manifest.json</FormLink>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { useLocale } from 'virtual:vite-vue-internationalization';
import { host, version, productName } from '@features/boot/frontend/shared/config.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { instance } from '@features/instance/frontend/instance.js';
import number from '@features/ui/frontend/filters/number.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import FormLink from '@features/ui/frontend/components/form/link.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import FormSplit from '@features/ui/frontend/components/form/split.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import MkLink from '@features/navigation/frontend/components/MkLink.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

const initStats = () => misskeyApi('stats', {});
</script>

<style lang="scss" module>
.banner {
	text-align: center;
	border-radius: 10px;
	overflow: clip;
	background-color: var(--MI_THEME-panel);
	background-size: cover;
	background-position: center center;
}

.bannerIcon {
	display: block;
	margin: 16px auto 0 auto;
	height: 64px;
	border-radius: 8px;
}

.bannerName {
	display: block;
	padding: 16px;
	color: #fff;
	text-shadow: 0 0 8px #000;
	background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.rules {
	counter-reset: item;
	list-style: none;
	padding: 0;
	margin: 0;
}

.rule {
	display: flex;
	gap: 8px;
	word-break: break-word;

	&::before {
		flex-shrink: 0;
		display: flex;
		position: sticky;
		top: calc(var(--MI-stickyTop, 0px) + 8px);
		counter-increment: item;
		content: counter(item);
		width: 32px;
		height: 32px;
		line-height: 32px;
		background-color: var(--MI_THEME-accentedBg);
		color: var(--MI_THEME-accent);
		font-size: 13px;
		font-weight: bold;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
	}
}

.ruleText {
	padding-top: 6px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"poweredByMisskeyDescription": "{name} هو إحدى الخِدمات التي تستخدم المنصة مفتوحة المصدر <b>ميسكي</b> (يشار إليه كمثيل ميسكي)",
	"aboutMisskey": "عن {productName}",
	"sourceCode": "الشفرة المصدرية",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"contact": "التواصل",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "قوانين الخادم",
	"feedback": "Feedback",
	"statistics": "الإحصائيات"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"poweredByMisskeyDescription": "{name} És un dels serveis (anomenats instàncies de Misskey) que utilitzen la plataforma de codi obert <b>Misskey</b>.",
	"aboutMisskey": "Quant a {productName}",
	"sourceCode": "Codi font",
	"sourceCodeIsNotYetProvided": "El codi font encara no es troba disponible. Contacta amb l'administrador per solucionar aquest problema.",
	"contact": "Contacte",
	"inquiry": "Contacte",
	"impressum": "Impressum",
	"serverRules": "Regles del servidor",
	"feedback": "Opinió",
	"statistics": "Estadístiques"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"poweredByMisskeyDescription": "{name} je jeden ze serverů využívající open source platformu <b>Misskey<b> (nazývaná \"Misskey instance\").",
	"aboutMisskey": "O {productName}",
	"sourceCode": "Zdrojový kód",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"contact": "Kontakt",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Pravidla serveru",
	"feedback": "Feedback",
	"statistics": "Statistiky"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"poweredByMisskeyDescription": "{name} is one of the services powered by the open source platform <b>Misskey</b> (referred to as a \"Misskey instance\").",
	"aboutMisskey": "About {productName}",
	"sourceCode": "Source code",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"contact": "Contact",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"feedback": "Feedback",
	"statistics": "Statistics"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"poweredByMisskeyDescription": "{name} ist einer der durch die Open-Source-Plattform <b>Misskey</b> betriebenen Dienste.",
	"aboutMisskey": "Über {productName}",
	"sourceCode": "Quellcode",
	"sourceCodeIsNotYetProvided": "Der Quellcode ist noch nicht verfügbar. Kontaktiere den Administrator, um das Problem zu lösen.",
	"contact": "Kontakt",
	"inquiry": "Kontakt",
	"impressum": "Impressum",
	"serverRules": "Serverregeln",
	"feedback": "Feedback",
	"statistics": "Statistiken"
}
</locale>

<locale lang="json" locale="en-US">
{
	"poweredByMisskeyDescription": "{name} is one of the services powered by the open source platform <b>Misskey</b> (referred to as a \"Misskey instance\").",
	"aboutMisskey": "About {productName}",
	"sourceCode": "Source code",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"contact": "Contact",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"feedback": "Feedback",
	"statistics": "Statistics"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"poweredByMisskeyDescription": "{name} es uno de los servicios (también llamado instancia) que usa la plataforma de código abierto <b>Misskey</b>",
	"aboutMisskey": "Sobre {productName}",
	"sourceCode": "Código fuente",
	"sourceCodeIsNotYetProvided": "El código fuente aún no está disponible. Contacta con el administrador para solucionarlo.",
	"contact": "Contacto",
	"inquiry": "Contacto",
	"impressum": "Impressum",
	"serverRules": "Reglas del servidor",
	"feedback": "Enviar sugerencias (Feedback)",
	"statistics": "Estadísticas"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"poweredByMisskeyDescription": "{name} est l'un des services propulsés par la plateforme ouverte <b>Misskey</b> (appelée \"instance Misskey\").",
	"aboutMisskey": "À propos de {productName}",
	"sourceCode": "Code source",
	"sourceCodeIsNotYetProvided": "Le code source n'est pas encore disponible. Veuillez signaler ce problème aux administrateurs.",
	"contact": "Contact",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Règles du serveur",
	"feedback": "Commentaires",
	"statistics": "Statistiques"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"poweredByMisskeyDescription": "{name} adalah sebuah layanan (instance) yang menggunakan platform sumber terbuka <b>Misskey</b>.",
	"aboutMisskey": "Tentang {productName}",
	"sourceCode": "Sumber kode",
	"sourceCodeIsNotYetProvided": "Sumber kode belum tersedia. Hubungi admin untuk memperbaiki masalah ini.",
	"contact": "Kontak",
	"inquiry": "Hubungi kami",
	"impressum": "Impressum",
	"serverRules": "Aturan peladen",
	"feedback": "Umpan balik",
	"statistics": "Statistik"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"poweredByMisskeyDescription": "{name} è uno dei servizi (chiamati istanze) che utilizzano la piattaforma open source <b>Misskey</b>.",
	"aboutMisskey": "A proposito di {productName}",
	"sourceCode": "Codice sorgente",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"contact": "Contatti",
	"inquiry": "Contattaci",
	"impressum": "Dichiarazione di proprietà",
	"serverRules": "Regolamento",
	"feedback": "Feedback",
	"statistics": "Statistiche"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"poweredByMisskeyDescription": "{name}は、オープンソースのプラットフォーム<b>Misskey</b>のサーバーのひとつです。",
	"aboutMisskey": "{productName}について",
	"sourceCode": "ソースコード",
	"sourceCodeIsNotYetProvided": "ソースコードはまだ提供されていません。この問題の修正について管理者に問い合わせてください。",
	"contact": "連絡先",
	"inquiry": "お問い合わせ",
	"impressum": "運営者情報",
	"serverRules": "サーバールール",
	"feedback": "フィードバック",
	"statistics": "統計"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"poweredByMisskeyDescription": "{name}は、オープンソースのプラットフォーム<b>Misskey</b>のサーバーのひとつなんやで。",
	"aboutMisskey": "{productName}ってなんや？",
	"sourceCode": "ソースコード",
	"sourceCodeIsNotYetProvided": "ソースコードはまだ提供されてへんで。問題の修正について管理者に問い合わせてみ。",
	"contact": "連絡先",
	"inquiry": "問い合わせ",
	"impressum": "運営者の情報",
	"serverRules": "サーバールール",
	"feedback": "フィードバック",
	"statistics": "統計"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"poweredByMisskeyDescription": "{name} is one of the services powered by the open source platform <b>Misskey</b> (referred to as a \"Misskey instance\").",
	"aboutMisskey": "About {productName}",
	"sourceCode": "Source code",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"contact": "Contact",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"feedback": "Feedback",
	"statistics": "Statistics"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"poweredByMisskeyDescription": "{name} is one of the services powered by the open source platform <b>Misskey</b> (referred to as a \"Misskey instance\").",
	"aboutMisskey": "About {productName}",
	"sourceCode": "Source code",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"contact": "Contact",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"feedback": "Feedback",
	"statistics": "Statistics"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"poweredByMisskeyDescription": "{name} 서버는 오픈소스 플랫폼 <b>Misskey</b>의 서버 가운데 하나입니다.",
	"aboutMisskey": "{productName}에 대하여",
	"sourceCode": "소스 코드",
	"sourceCodeIsNotYetProvided": "소스 코드를 아직 제공하지 않습니다. 이 문제를 해결하려면 관리자에게 문의해 주세요.",
	"contact": "연락처",
	"inquiry": "문의하기",
	"impressum": "운영자 정보",
	"serverRules": "서버 규칙",
	"feedback": "피드백",
	"statistics": "통계"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"poweredByMisskeyDescription": "{name} is één van de services die door het open source platform <b>Misskey</b> wordt geleverd (het wordt ook wel een \"Misskey server genmoemd\").",
	"aboutMisskey": "Over {productName}",
	"sourceCode": "Source code",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"contact": "Contact",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"feedback": "Feedback",
	"statistics": "Statistieken"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"poweredByMisskeyDescription": "{name} is one of the services powered by the open source platform <b>Misskey</b> (referred to as a \"Misskey instance\").",
	"aboutMisskey": "Om {productName}",
	"sourceCode": "Source code",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"contact": "Kontakt",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"feedback": "Feedback",
	"statistics": "Statistikk"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"poweredByMisskeyDescription": "{name} jest jedną z usług działającą na otwartoźródłowej platformie <b>Misskey</b> (określana jako \"instancja Misskey\").",
	"aboutMisskey": "O {productName}",
	"sourceCode": "Kod źródłowy",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"contact": "Kontakt",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"feedback": "Feedback",
	"statistics": "Statystyki"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"poweredByMisskeyDescription": "{name} é uma instância da plataforma de código aberto <b>Misskey</b>.",
	"aboutMisskey": "Sobre {productName}",
	"sourceCode": "Código-fonte",
	"sourceCodeIsNotYetProvided": "Código-fonte está indisponível. Contate o administrador para resolver esse problema.",
	"contact": "Contato",
	"inquiry": "Contato",
	"impressum": "Impressum",
	"serverRules": "Regras do servidor",
	"feedback": "Feedback",
	"statistics": "Estatísticas"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"poweredByMisskeyDescription": "{name} – один из инстансов (также называемый экземпляром Misskey), использующий платформу с открытым исходным кодом <b>Misskey</b>.",
	"aboutMisskey": "О {productName}",
	"sourceCode": "Исходный код",
	"sourceCodeIsNotYetProvided": "Исходный код пока не доступен. Свяжитесь с администратором, чтобы исправить эту проблему.",
	"contact": "Почта для связи",
	"inquiry": "Связаться",
	"impressum": "О владельце",
	"serverRules": "Правила сервера",
	"feedback": "Обратная связь",
	"statistics": "Статистика"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"poweredByMisskeyDescription": "{name} je jedným zo serverov využívajúcich open source platformu <b>Misskey</b> (nazývaných Misskey inštancia).",
	"aboutMisskey": "O {productName}",
	"sourceCode": "Zdrojový kód",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"contact": "Kontakt",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"feedback": "Feedback",
	"statistics": "Štatistiky"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"poweredByMisskeyDescription": "{name} เป็นหนึ่งในเซิร์ฟเวอร์ของแพลตฟอร์มโอเพ่นซอร์ส <b>Misskey</b>",
	"aboutMisskey": "เกี่ยวกับ {productName}",
	"sourceCode": "ซอร์สโค้ด",
	"sourceCodeIsNotYetProvided": "ซอร์สโค้ดยังไม่พร้อมใช้งาน โปรดติดต่อผู้ดูแลระบบเพื่อแก้ไขปัญหานี้",
	"contact": "ติดต่อ",
	"inquiry": "ติดต่อเรา",
	"impressum": "อิมเพรสชั่น",
	"serverRules": "กฎของเซิร์ฟเวอร์",
	"feedback": "ฟีดแบ็ก",
	"statistics": "สถิติการใช้งาน"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"poweredByMisskeyDescription": "{name}, açık kaynak platformu <b>Misskey</b> (kısaca “Misskey örneği” olarak anılır) tarafından desteklenen hizmetlerden biridir.",
	"aboutMisskey": "{productName} Hakkında",
	"sourceCode": "Kaynak kodu",
	"sourceCodeIsNotYetProvided": "Kaynak kodu henüz mevcut değildir. Bu sorunu gidermek için yöneticiyle iletişime geçin.",
	"contact": "İletişim",
	"inquiry": "İletişim",
	"impressum": "Yayıncı Bilgileri",
	"serverRules": "Sunucu kuralları",
	"feedback": "Feedback",
	"statistics": "İstatistikler"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"poweredByMisskeyDescription": "{name} is one of the services powered by the open source platform <b>Misskey</b> (referred to as a \"Misskey instance\").",
	"aboutMisskey": "About {productName}",
	"sourceCode": "Source code",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"contact": "Contact",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"feedback": "Feedback",
	"statistics": "Statistics"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"poweredByMisskeyDescription": "{name} є одним із сервісів (які називаються інстансами Misskey), що використовують платформу з відкритим вихідним кодом <b>Misskey</b>.",
	"aboutMisskey": "Про {productName}",
	"sourceCode": "Вихідний код",
	"sourceCodeIsNotYetProvided": "Вихідний код ще недоступний. Зверніться до адміністратора, щоб виправити цю проблему.",
	"contact": "Контакт",
	"inquiry": "Зв'язок",
	"impressum": "Про власника",
	"serverRules": "Правила сервера",
	"feedback": "Відгук",
	"statistics": "Статистика"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"poweredByMisskeyDescription": "{name} là một trong những chủ máy của <b>Misskey</b> là nền tảng mã nguồn mở",
	"aboutMisskey": "Về {productName}",
	"sourceCode": "Mã nguồn",
	"sourceCodeIsNotYetProvided": "Mã nguồn hiện chưa có sẵn, vui lòng liên hệ với quản trị viên để khắc phục sự cố này.",
	"contact": "Liên hệ",
	"inquiry": "Contact",
	"impressum": "Thông tin nhà điều hành",
	"serverRules": "Luật của máy chủ",
	"feedback": "Phản hồi",
	"statistics": "Thống kê"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"poweredByMisskeyDescription": "{name} 是开源平台 <b>Misskey</b> 的服务器之一。",
	"aboutMisskey": "关于 {productName}",
	"sourceCode": "源代码",
	"sourceCodeIsNotYetProvided": "还未提供源代码。要解决此问题请联系管理员。",
	"contact": "联系方式",
	"inquiry": "联系我们",
	"impressum": "运营商信息",
	"serverRules": "服务器规则",
	"feedback": "反馈",
	"statistics": "统计"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"poweredByMisskeyDescription": "{name}是開放原始碼平臺 <b>Misskey</b> 的伺服器之一。",
	"aboutMisskey": "關於 {productName}",
	"sourceCode": "原始碼",
	"sourceCodeIsNotYetProvided": "尚未提供原始碼，請洽詢管理員解決這個問題。",
	"contact": "聯絡人",
	"inquiry": "聯絡我們",
	"impressum": "營運者資訊",
	"serverRules": "伺服器規則",
	"feedback": "意見回饋",
	"statistics": "統計"
}
</locale>
