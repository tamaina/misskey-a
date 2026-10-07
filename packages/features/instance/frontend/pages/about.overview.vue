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
		<template #key>{{ $locale.sfc.description }}</template>
		<template #value><div v-html="instance.description"></div></template>
	</MkKeyValue>

	<FormSection>
		<div class="_gaps_m">
			<MkKeyValue :copy="version">
				<template #key>Misskey</template>
				<template #value>{{ version }}</template>
			</MkKeyValue>
			<div v-html="interpolateLocaleParameters($locale.sfc.poweredByMisskeyDescription, { name: instance.name ?? host })">
			</div>
			<FormLink to="/about-misskey">
				<template #icon><i class="ti ti-info-circle"></i></template>
				{{ $locale.sfc.aboutMisskey }}
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
				<MkKeyValue>
					<template #key>{{ $locale.sfc.inquiry }}</template>
					<template #value>
						<MkLink v-if="instance.inquiryUrl" :url="instance.inquiryUrl" target="_blank">{{ instance.inquiryUrl }}</MkLink>
						<span v-else style="opacity: 0.7;">({{ $locale.sfc.none }})</span>
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
					<template #default>{{ $locale.sfc.termsOfService }}</template>
				</FormLink>
				<FormLink v-if="instance.privacyPolicyUrl" :to="instance.privacyPolicyUrl" external>
					<template #icon><i class="ti ti-shield-lock"></i></template>
					<template #default>{{ $locale.sfc.privacyPolicy }}</template>
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
					<template #key>{{ $locale.sfc.users }}</template>
					<template #value>{{ number(stats.originalUsersCount) }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ $locale.sfc.notes }}</template>
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
import { host, version } from '@features/boot/frontend/shared/config.js';
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
	"description": "الوصف",
	"poweredByMisskeyDescription": "{name} هو إحدى الخِدمات التي تستخدم المنصة مفتوحة المصدر <b>ميسكي</b> (يشار إليه كمثيل ميسكي)",
	"aboutMisskey": "عن Misskey",
	"sourceCode": "الشفرة المصدرية",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"administrator": "المدير",
	"none": "لا شيء",
	"contact": "التواصل",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "قوانين الخادم",
	"termsOfService": "شروط الخدمة",
	"privacyPolicy": "Privacy Policy",
	"feedback": "Feedback",
	"statistics": "الإحصائيات",
	"users": "المستخدمون",
	"notes": "الملاحظات"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"description": "Descripció",
	"poweredByMisskeyDescription": "{name} És un dels serveis (anomenats instàncies de Misskey) que utilitzen la plataforma de codi obert <b>Misskey</b>.",
	"aboutMisskey": "Quant a Misskey",
	"sourceCode": "Codi font",
	"sourceCodeIsNotYetProvided": "El codi font encara no es troba disponible. Contacta amb l'administrador per solucionar aquest problema.",
	"administrator": "Administrador/a",
	"none": "Res",
	"contact": "Contacte",
	"inquiry": "Contacte",
	"impressum": "Impressum",
	"serverRules": "Regles del servidor",
	"termsOfService": "Condicions d'ús",
	"privacyPolicy": "Política de privacitat",
	"feedback": "Opinió",
	"statistics": "Estadístiques",
	"users": "Usuaris",
	"notes": "Notes"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"description": "Popis",
	"poweredByMisskeyDescription": "{name} je jeden ze serverů využívající open source platformu <b>Misskey<b> (nazývaná \"Misskey instance\").",
	"aboutMisskey": "O Misskey",
	"sourceCode": "Zdrojový kód",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"administrator": "Administrátor",
	"none": "Žádný",
	"contact": "Kontakt",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Pravidla serveru",
	"termsOfService": "Podmínky užívání",
	"privacyPolicy": "Privacy Policy",
	"feedback": "Feedback",
	"statistics": "Statistiky",
	"users": "Uživatelé",
	"notes": "Poznámky"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"description": "Description",
	"poweredByMisskeyDescription": "{name} is one of the services powered by the open source platform <b>Misskey</b> (referred to as a \"Misskey instance\").",
	"aboutMisskey": "About Misskey",
	"sourceCode": "Source code",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"administrator": "Administrator",
	"none": "None",
	"contact": "Contact",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"termsOfService": "Terms of Service",
	"privacyPolicy": "Privacy Policy",
	"feedback": "Feedback",
	"statistics": "Statistics",
	"users": "Users",
	"notes": "Notes"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"description": "Beschreibung",
	"poweredByMisskeyDescription": "{name} ist einer der durch die Open-Source-Plattform <b>Misskey</b> betriebenen Dienste.",
	"aboutMisskey": "Über Misskey",
	"sourceCode": "Quellcode",
	"sourceCodeIsNotYetProvided": "Der Quellcode ist noch nicht verfügbar. Kontaktiere den Administrator, um das Problem zu lösen.",
	"administrator": "Administrator",
	"none": "Nichts",
	"contact": "Kontakt",
	"inquiry": "Kontakt",
	"impressum": "Impressum",
	"serverRules": "Serverregeln",
	"termsOfService": "Nutzungsbedingungen",
	"privacyPolicy": "Datenschutzerklärung",
	"feedback": "Feedback",
	"statistics": "Statistiken",
	"users": "Benutzer",
	"notes": "Notizen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"description": "Description",
	"poweredByMisskeyDescription": "{name} is one of the services powered by the open source platform <b>Misskey</b> (referred to as a \"Misskey instance\").",
	"aboutMisskey": "About Misskey",
	"sourceCode": "Source code",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"administrator": "Administrator",
	"none": "None",
	"contact": "Contact",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"termsOfService": "Terms of Service",
	"privacyPolicy": "Privacy Policy",
	"feedback": "Feedback",
	"statistics": "Statistics",
	"users": "Users",
	"notes": "Notes"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"description": "Descripción",
	"poweredByMisskeyDescription": "{name} es uno de los servicios (también llamado instancia) que usa la plataforma de código abierto <b>Misskey</b>",
	"aboutMisskey": "Sobre Misskey",
	"sourceCode": "Código fuente",
	"sourceCodeIsNotYetProvided": "El código fuente aún no está disponible. Contacta con el administrador para solucionarlo.",
	"administrator": "Administrador",
	"none": "Ninguna",
	"contact": "Contacto",
	"inquiry": "Contacto",
	"impressum": "Impressum",
	"serverRules": "Reglas del servidor",
	"termsOfService": "Términos y condiciones",
	"privacyPolicy": "Política de Privacidad",
	"feedback": "Enviar sugerencias (Feedback)",
	"statistics": "Estadísticas",
	"users": "Usuarios",
	"notes": "Notas"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"description": "Description",
	"poweredByMisskeyDescription": "{name} est l'un des services propulsés par la plateforme ouverte <b>Misskey</b> (appelée \"instance Misskey\").",
	"aboutMisskey": "À propos de Misskey",
	"sourceCode": "Code source",
	"sourceCodeIsNotYetProvided": "Le code source n'est pas encore disponible. Veuillez signaler ce problème aux administrateurs.",
	"administrator": "Administrateur",
	"none": "Rien",
	"contact": "Contact",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Règles du serveur",
	"termsOfService": "Conditions d'utilisation",
	"privacyPolicy": "Politique de confidentialité",
	"feedback": "Commentaires",
	"statistics": "Statistiques",
	"users": "Utilisateur·rice·s",
	"notes": "Notes"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"description": "Deskripsi",
	"poweredByMisskeyDescription": "{name} adalah sebuah layanan (instance) yang menggunakan platform sumber terbuka <b>Misskey</b>.",
	"aboutMisskey": "Tentang Misskey",
	"sourceCode": "Sumber kode",
	"sourceCodeIsNotYetProvided": "Sumber kode belum tersedia. Hubungi admin untuk memperbaiki masalah ini.",
	"administrator": "Admin",
	"none": "Tidak ada",
	"contact": "Kontak",
	"inquiry": "Hubungi kami",
	"impressum": "Impressum",
	"serverRules": "Aturan peladen",
	"termsOfService": "Syarat dan ketentuan",
	"privacyPolicy": "Kebijakan Privasi",
	"feedback": "Umpan balik",
	"statistics": "Statistik",
	"users": "Pengguna",
	"notes": "Catatan"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"description": "Descrizione",
	"poweredByMisskeyDescription": "{name} è uno dei servizi (chiamati istanze) che utilizzano la piattaforma open source <b>Misskey</b>.",
	"aboutMisskey": "A proposito di Misskey",
	"sourceCode": "Codice sorgente",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"administrator": "Amministratore",
	"none": "Nessuna",
	"contact": "Contatti",
	"inquiry": "Contattaci",
	"impressum": "Dichiarazione di proprietà",
	"serverRules": "Regolamento",
	"termsOfService": "Condizioni d'uso del servizio",
	"privacyPolicy": "Informativa ai sensi del Reg. UE 2016/679 (GDPR)",
	"feedback": "Feedback",
	"statistics": "Statistiche",
	"users": "Profili",
	"notes": "Note"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"description": "説明",
	"poweredByMisskeyDescription": "{name}は、オープンソースのプラットフォーム<b>Misskey</b>のサーバーのひとつです。",
	"aboutMisskey": "Misskeyについて",
	"sourceCode": "ソースコード",
	"sourceCodeIsNotYetProvided": "ソースコードはまだ提供されていません。この問題の修正について管理者に問い合わせてください。",
	"administrator": "管理者",
	"none": "なし",
	"contact": "連絡先",
	"inquiry": "お問い合わせ",
	"impressum": "運営者情報",
	"serverRules": "サーバールール",
	"termsOfService": "利用規約",
	"privacyPolicy": "プライバシーポリシー",
	"feedback": "フィードバック",
	"statistics": "統計",
	"users": "ユーザー",
	"notes": "ノート"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"description": "説明",
	"poweredByMisskeyDescription": "{name}は、オープンソースのプラットフォーム<b>Misskey</b>のサーバーのひとつなんやで。",
	"aboutMisskey": "Misskeyってなんや？",
	"sourceCode": "ソースコード",
	"sourceCodeIsNotYetProvided": "ソースコードはまだ提供されてへんで。問題の修正について管理者に問い合わせてみ。",
	"administrator": "管理者",
	"none": "なし",
	"contact": "連絡先",
	"inquiry": "問い合わせ",
	"impressum": "運営者の情報",
	"serverRules": "サーバールール",
	"termsOfService": "使うための決め事",
	"privacyPolicy": "プライバシーポリシー",
	"feedback": "フィードバック",
	"statistics": "統計",
	"users": "ユーザー",
	"notes": "ノート"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"description": "Description",
	"poweredByMisskeyDescription": "{name} is one of the services powered by the open source platform <b>Misskey</b> (referred to as a \"Misskey instance\").",
	"aboutMisskey": "About Misskey",
	"sourceCode": "Source code",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"administrator": "Administrator",
	"none": "None",
	"contact": "Contact",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"termsOfService": "Terms of Service",
	"privacyPolicy": "Privacy Policy",
	"feedback": "Feedback",
	"statistics": "Statistics",
	"users": "Users",
	"notes": "Notes"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"description": "Description",
	"poweredByMisskeyDescription": "{name} is one of the services powered by the open source platform <b>Misskey</b> (referred to as a \"Misskey instance\").",
	"aboutMisskey": "About Misskey",
	"sourceCode": "Source code",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"administrator": "Administrator",
	"none": "None",
	"contact": "Contact",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"termsOfService": "Terms of Service",
	"privacyPolicy": "Privacy Policy",
	"feedback": "Feedback",
	"statistics": "Statistics",
	"users": "ಬಳಕೆದಾರ",
	"notes": "Notes"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"description": "설명",
	"poweredByMisskeyDescription": "{name} 서버는 오픈소스 플랫폼 <b>Misskey</b>의 서버 가운데 하나입니다.",
	"aboutMisskey": "Misskey에 대하여",
	"sourceCode": "소스 코드",
	"sourceCodeIsNotYetProvided": "소스 코드를 아직 제공하지 않습니다. 이 문제를 해결하려면 관리자에게 문의해 주세요.",
	"administrator": "관리자",
	"none": "없음",
	"contact": "연락처",
	"inquiry": "문의하기",
	"impressum": "운영자 정보",
	"serverRules": "서버 규칙",
	"termsOfService": "이용 약관",
	"privacyPolicy": "개인정보 보호 정책",
	"feedback": "피드백",
	"statistics": "통계",
	"users": "유저",
	"notes": "노트"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"description": "Beschrijving",
	"poweredByMisskeyDescription": "{name} is één van de services die door het open source platform <b>Misskey</b> wordt geleverd (het wordt ook wel een \"Misskey server genmoemd\").",
	"aboutMisskey": "Over Misskey",
	"sourceCode": "Source code",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"administrator": "Beheerder",
	"none": "Niets",
	"contact": "Contact",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"termsOfService": "Gebruiksvoorwaarden",
	"privacyPolicy": "Privacy Policy",
	"feedback": "Feedback",
	"statistics": "Statistieken",
	"users": "Gebruikers",
	"notes": "Notities"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"description": "Beskrivelse",
	"poweredByMisskeyDescription": "{name} is one of the services powered by the open source platform <b>Misskey</b> (referred to as a \"Misskey instance\").",
	"aboutMisskey": "Om Misskey",
	"sourceCode": "Source code",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"administrator": "Administrator",
	"none": "Ingen",
	"contact": "Kontakt",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"termsOfService": "Vilkår for bruk",
	"privacyPolicy": "Privacy Policy",
	"feedback": "Feedback",
	"statistics": "Statistikk",
	"users": "Brukere",
	"notes": "Notes"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"description": "Opis",
	"poweredByMisskeyDescription": "{name} jest jedną z usług działającą na otwartoźródłowej platformie <b>Misskey</b> (określana jako \"instancja Misskey\").",
	"aboutMisskey": "O Misskey",
	"sourceCode": "Kod źródłowy",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"administrator": "Admin",
	"none": "Brak",
	"contact": "Kontakt",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"termsOfService": "Warunki usługi",
	"privacyPolicy": "Privacy Policy",
	"feedback": "Feedback",
	"statistics": "Statystyki",
	"users": "Użytkownicy",
	"notes": "Wpisy"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"description": "Descrição",
	"poweredByMisskeyDescription": "{name} é uma instância da plataforma de código aberto <b>Misskey</b>.",
	"aboutMisskey": "Sobre Misskey",
	"sourceCode": "Código-fonte",
	"sourceCodeIsNotYetProvided": "Código-fonte está indisponível. Contate o administrador para resolver esse problema.",
	"administrator": "Administrador",
	"none": "Nenhum",
	"contact": "Contato",
	"inquiry": "Contato",
	"impressum": "Impressum",
	"serverRules": "Regras do servidor",
	"termsOfService": "Termos de Uso",
	"privacyPolicy": "Política de Privacidade",
	"feedback": "Feedback",
	"statistics": "Estatísticas",
	"users": "Usuários",
	"notes": "Posts"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"description": "Описание",
	"poweredByMisskeyDescription": "{name} – один из инстансов (также называемый экземпляром Misskey), использующий платформу с открытым исходным кодом <b>Misskey</b>.",
	"aboutMisskey": "О Misskey",
	"sourceCode": "Исходный код",
	"sourceCodeIsNotYetProvided": "Исходный код пока не доступен. Свяжитесь с администратором, чтобы исправить эту проблему.",
	"administrator": "Администратор",
	"none": "Ничего",
	"contact": "Почта для связи",
	"inquiry": "Связаться",
	"impressum": "О владельце",
	"serverRules": "Правила сервера",
	"termsOfService": "Условия использования",
	"privacyPolicy": "Политика Конфиденциальности",
	"feedback": "Обратная связь",
	"statistics": "Статистика",
	"users": "Пользователи",
	"notes": "Заметки"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"description": "Popis",
	"poweredByMisskeyDescription": "{name} je jedným zo serverov využívajúcich open source platformu <b>Misskey</b> (nazývaných Misskey inštancia).",
	"aboutMisskey": "O Misskey",
	"sourceCode": "Zdrojový kód",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"administrator": "Administrátor",
	"none": "Žiadne",
	"contact": "Kontakt",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"termsOfService": "Terms of Service",
	"privacyPolicy": "Privacy Policy",
	"feedback": "Feedback",
	"statistics": "Štatistiky",
	"users": "Používatelia",
	"notes": "Poznámky"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"description": "คำอธิบาย",
	"poweredByMisskeyDescription": "{name} เป็นหนึ่งในเซิร์ฟเวอร์ของแพลตฟอร์มโอเพ่นซอร์ส <b>Misskey</b>",
	"aboutMisskey": "เกี่ยวกับ Misskey",
	"sourceCode": "ซอร์สโค้ด",
	"sourceCodeIsNotYetProvided": "ซอร์สโค้ดยังไม่พร้อมใช้งาน โปรดติดต่อผู้ดูแลระบบเพื่อแก้ไขปัญหานี้",
	"administrator": "ผู้ดูแลระบบ",
	"none": "ไม่มี",
	"contact": "ติดต่อ",
	"inquiry": "ติดต่อเรา",
	"impressum": "อิมเพรสชั่น",
	"serverRules": "กฎของเซิร์ฟเวอร์",
	"termsOfService": "เงื่อนไขการให้บริการ",
	"privacyPolicy": "นโยบายความเป็นส่วนตัว",
	"feedback": "ฟีดแบ็ก",
	"statistics": "สถิติการใช้งาน",
	"users": "ผู้ใช้",
	"notes": " โน้ต"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"description": "Açıklama",
	"poweredByMisskeyDescription": "{name}, açık kaynak platformu <b>Misskey</b> (kısaca “Misskey örneği” olarak anılır) tarafından desteklenen hizmetlerden biridir.",
	"aboutMisskey": "Misskey Hakkında",
	"sourceCode": "Kaynak kodu",
	"sourceCodeIsNotYetProvided": "Kaynak kodu henüz mevcut değildir. Bu sorunu gidermek için yöneticiyle iletişime geçin.",
	"administrator": "Yönetici",
	"none": "Hiçbiri",
	"contact": "İletişim",
	"inquiry": "İletişim",
	"impressum": "Yayıncı Bilgileri",
	"serverRules": "Sunucu kuralları",
	"termsOfService": "Hizmet Şartları",
	"privacyPolicy": "Gizlilik Politikası",
	"feedback": "Feedback",
	"statistics": "İstatistikler",
	"users": "Kullanıcılar",
	"notes": "Notlar"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"description": "Description",
	"poweredByMisskeyDescription": "{name} is one of the services powered by the open source platform <b>Misskey</b> (referred to as a \"Misskey instance\").",
	"aboutMisskey": "About Misskey",
	"sourceCode": "Source code",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"administrator": "Administrator",
	"none": "None",
	"contact": "Contact",
	"inquiry": "Contact",
	"impressum": "Impressum",
	"serverRules": "Server rules",
	"termsOfService": "Terms of Service",
	"privacyPolicy": "Privacy Policy",
	"feedback": "Feedback",
	"statistics": "Statistics",
	"users": "Users",
	"notes": "Notes"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"description": "Опис",
	"poweredByMisskeyDescription": "{name} є одним із сервісів (які називаються інстансами Misskey), що використовують платформу з відкритим вихідним кодом <b>Misskey</b>.",
	"aboutMisskey": "Про Misskey",
	"sourceCode": "Вихідний код",
	"sourceCodeIsNotYetProvided": "Вихідний код ще недоступний. Зверніться до адміністратора, щоб виправити цю проблему.",
	"administrator": "Адмін",
	"none": "Відсутній",
	"contact": "Контакт",
	"inquiry": "Зв'язок",
	"impressum": "Про власника",
	"serverRules": "Правила сервера",
	"termsOfService": "Умови використання",
	"privacyPolicy": "Політика конфіденційності",
	"feedback": "Відгук",
	"statistics": "Статистика",
	"users": "Користувачі",
	"notes": "Записи"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"description": "Mô tả",
	"poweredByMisskeyDescription": "{name} là một trong những chủ máy của <b>Misskey</b> là nền tảng mã nguồn mở",
	"aboutMisskey": "Về Misskey",
	"sourceCode": "Mã nguồn",
	"sourceCodeIsNotYetProvided": "Mã nguồn hiện chưa có sẵn, vui lòng liên hệ với quản trị viên để khắc phục sự cố này.",
	"administrator": "Quản trị viên",
	"none": "Không",
	"contact": "Liên hệ",
	"inquiry": "Contact",
	"impressum": "Thông tin nhà điều hành",
	"serverRules": "Luật của máy chủ",
	"termsOfService": "Điều khoản và Điều kiện",
	"privacyPolicy": "Chính sách bảo mật",
	"feedback": "Phản hồi",
	"statistics": "Thống kê",
	"users": "Người dùng",
	"notes": "Bài Viết"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"description": "描述",
	"poweredByMisskeyDescription": "{name} 是开源平台 <b>Misskey</b> 的服务器之一。",
	"aboutMisskey": "关于 Misskey",
	"sourceCode": "源代码",
	"sourceCodeIsNotYetProvided": "还未提供源代码。要解决此问题请联系管理员。",
	"administrator": "管理员",
	"none": "无",
	"contact": "联系方式",
	"inquiry": "联系我们",
	"impressum": "运营商信息",
	"serverRules": "服务器规则",
	"termsOfService": "服务条款",
	"privacyPolicy": "隐私政策",
	"feedback": "反馈",
	"statistics": "统计",
	"users": "用户",
	"notes": "帖子"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"description": "描述",
	"poweredByMisskeyDescription": "{name}是開放原始碼平臺 <b>Misskey</b> 的伺服器之一。",
	"aboutMisskey": "關於 Misskey",
	"sourceCode": "原始碼",
	"sourceCodeIsNotYetProvided": "尚未提供原始碼，請洽詢管理員解決這個問題。",
	"administrator": "管理員",
	"none": "無",
	"contact": "聯絡人",
	"inquiry": "聯絡我們",
	"impressum": "營運者資訊",
	"serverRules": "伺服器規則",
	"termsOfService": "服務條款",
	"privacyPolicy": "隱私政策",
	"feedback": "意見回饋",
	"statistics": "統計",
	"users": "使用者",
	"notes": "貼文"
}
</locale>
