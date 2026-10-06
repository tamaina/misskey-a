<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="instance" :class="$style.root">
	<div :class="[$style.main, $style.panel]">
		<img :src="instance.iconUrl || '/favicon.ico'" alt="" :class="$style.mainIcon"/>
		<button class="_button _acrylic" :class="$style.mainMenu" @click="showMenu"><i class="ti ti-dots"></i></button>
		<div :class="$style.mainFg">
			<h1 :class="$style.mainTitle">
				<!-- 背景色によってはロゴが見えなくなるのでとりあえず無効に -->
				<!-- <img class="logo" v-if="instance.logoImageUrl" :src="instance.logoImageUrl"><span v-else class="text">{{ instanceName }}</span> -->
				<MkA to="/">{{ instanceName }}</MkA>
			</h1>
			<div :class="$style.mainAbout">
				<!-- eslint-disable-next-line vue/no-v-html -->
				<div v-html="instance.description || $locale.sfc.headlineMisskey"></div>
			</div>
			<div v-if="instance.disableRegistration || instance.federation !== 'all'" :class="$style.mainWarn" class="_gaps_s">
				<MkInfo v-if="instance.disableRegistration" warn>{{ $locale.sfc.invitationRequiredToRegister }}</MkInfo>
				<MkInfo v-if="instance.federation === 'specified'" warn>{{ $locale.sfc.federationSpecified }}</MkInfo>
				<MkInfo v-else-if="instance.federation === 'none'" warn>{{ $locale.sfc.federationDisabled }}</MkInfo>
			</div>
			<div class="_gaps_s" :class="$style.mainActions">
				<MkButton :class="$style.mainAction" full rounded gradate data-testid="signup" style="margin-right: 12px;" @click="signup()">{{ $locale.sfc.joinThisServer }}</MkButton>
				<MkButton :class="$style.mainAction" full rounded type="a" target="_blank" rel="noopener" href="https://misskey-hub.net/servers/">{{ $locale.sfc.exploreOtherServers }}</MkButton>
				<MkButton :class="$style.mainAction" full rounded data-testid="signin" @click="signin()">{{ $locale.sfc.login }}</MkButton>
			</div>
		</div>
	</div>
	<div v-if="stats && instance.clientOptions.showActivitiesForVisitor !== false" :class="$style.stats">
		<div :class="[$style.statsItem, $style.panel]">
			<div :class="$style.statsItemLabel">{{ $locale.sfc.users }}</div>
			<div :class="$style.statsItemCount"><MkNumber :value="stats.originalUsersCount"/></div>
		</div>
		<div :class="[$style.statsItem, $style.panel]">
			<div :class="$style.statsItemLabel">{{ $locale.sfc.notes }}</div>
			<div :class="$style.statsItemCount"><MkNumber :value="stats.originalNotesCount"/></div>
		</div>
	</div>
	<div v-if="instance.policies.ltlAvailable && instance.clientOptions.showTimelineForVisitor !== false" :class="[$style.tl, $style.panel]">
		<div :class="$style.tlHeader">{{ $locale.sfc.letsLookAtTimeline }}</div>
		<div :class="$style.tlBody">
			<MkStreamingNotesTimeline src="local"/>
		</div>
	</div>
	<div v-if="instance.clientOptions.showActivitiesForVisitor !== false" :class="$style.panel">
		<XActiveUsersChart/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { instanceName } from '@@/js/config.js';
import type { MenuItem } from '@/types/menu.js';
import XSigninDialog from '@features/auth/frontend/components/MkSigninDialog.vue';
import XSignupDialog from '@features/auth/frontend/components/MkSignupDialog.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkStreamingNotesTimeline from '@features/timelines/frontend/components/MkStreamingNotesTimeline.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { instance } from '@/instance.js';
import MkNumber from '@features/ui/frontend/components/MkNumber.vue';
import XActiveUsersChart from '@features/statistics/frontend/components/MkVisitorDashboard.ActiveUsersChart.vue';
import { openInstanceMenu } from '@/ui/_common_/common.js';

const stats = ref<Misskey.entities.StatsResponse | null>(null);

if (instance.clientOptions.showActivitiesForVisitor !== false) {
	misskeyApi('stats', {}).then((res) => {
		stats.value = res;
	});
}

function signin() {
	const { dispose } = os.popup(XSigninDialog, {
		autoSet: true,
	}, {
		closed: () => dispose(),
	});
}

function signup() {
	const { dispose } = os.popup(XSignupDialog, {
		autoSet: true,
	}, {
		closed: () => dispose(),
	});
}

function showMenu(ev: PointerEvent) {
	openInstanceMenu(ev);
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 32px 0 0 0;
}

.panel {
	position: relative;
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
	box-shadow: 0 12px 32px rgb(0 0 0 / 25%);
}

.main {
	text-align: center;
}

.mainIcon {
	width: 85px;
	margin-top: -47px;
	vertical-align: bottom;
	filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.5));
}

.mainMenu {
	position: absolute;
	top: 16px;
	right: 16px;
	width: 32px;
	height: 32px;
	border-radius: 8px;
	font-size: 18px;
	z-index: 50;
}

.mainFg {
	position: relative;
	z-index: 1;
}

.mainTitle {
	display: block;
	margin: 0;
	padding: 16px 32px 24px 32px;
	font-size: 1.4em;
}

.mainLogo {
	vertical-align: bottom;
	max-height: 120px;
	max-width: min(100%, 300px);
}

.mainAbout {
	padding: 0 32px;
}

.mainWarn {
	padding: 32px 32px 0 32px;
}

.mainActions {
	padding: 32px;
}

.mainAction {
	line-height: 28px;
}

.stats {
	display: grid;
	grid-template-columns: 1fr 1fr;
	grid-gap: 16px;
}

.statsItem {
	overflow: clip;
	padding: 16px 20px;
}

.statsItemLabel {
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
	font-size: 0.9em;
}

.statsItemCount {
	font-weight: bold;
	font-size: 1.2em;
	color: var(--MI_THEME-accent);
}

.tl {
	overflow: clip;
}

.tlHeader {
	padding: 12px 16px;
	border-bottom: solid 1px var(--MI_THEME-divider);
}

.tlBody {
	height: 350px;
	overflow: auto;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "headlineMisskey": "شبكة مرتبطة بالملاحظات",
  "invitationRequiredToRegister": "هذا المثيل للمدعوين فقط. لتسجيل فيه تحتاج رمزًا صالحًا.",
  "federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
  "federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
  "joinThisServer": "سجل في هذا المثيل",
  "exploreOtherServers": "اعثر على مثيل آخر",
  "login": "لِج",
  "users": "المستخدمون",
  "notes": "الملاحظات",
  "letsLookAtTimeline": "Have a look at the timeline"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "headlineMisskey": "Una xarxa connectada per notes",
  "invitationRequiredToRegister": "Aquesta instància només permet el registre per invitació. Per registrar-te has d'introduir el codi d'invitació.",
  "federationSpecified": "Aquest servidor treballa amb una federació de llistes blanques. No pot interactuar amb altres servidors que no siguin els especificats per l'administrador.",
  "federationDisabled": "La unió es troba deshabilitada en aquest servidor. No es pot interactuar amb usuaris d'altres servidors.",
  "joinThisServer": "Registra't en aquesta instància ",
  "exploreOtherServers": "Cerca una altra instància ",
  "login": "Iniciar sessió",
  "users": "Usuaris",
  "notes": "Notes",
  "letsLookAtTimeline": "Dona una ullada a la línia de temps"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "headlineMisskey": "Síť propojená poznámkami",
  "invitationRequiredToRegister": "Tahle instance je pouze na pozvánku. Musíte zadat validní kód pozvánky.",
  "federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
  "federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
  "joinThisServer": "Zaregistrovat se v této instanci",
  "exploreOtherServers": "Podívat se na ostatní instance",
  "login": "Přihlásit se",
  "users": "Uživatelé",
  "notes": "Poznámky",
  "letsLookAtTimeline": "Podívejte se na časovou osu"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "headlineMisskey": "A network connected by notes",
  "invitationRequiredToRegister": "This instance is invite-only. You must enter a valid invite code sign up.",
  "federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
  "federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
  "joinThisServer": "Sign up at this instance",
  "exploreOtherServers": "Look for another instance",
  "login": "Sign In",
  "users": "Users",
  "notes": "Notes",
  "letsLookAtTimeline": "Have a look at the timeline"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "headlineMisskey": "Ein durch Notizen verbundenes Netzwerk",
  "invitationRequiredToRegister": "Diese Instanz ist einladungsbasiert. Du musst einen validen Einladungscode eingeben, um dich zu registrieren.",
  "federationSpecified": "Dieser Server arbeitet mit Whitelist-Föderation. Er kann nicht mit anderen als den vom Administrator angegebenen Servern interagieren.",
  "federationDisabled": "Föderation ist auf diesem Server deaktiviert. Es ist nicht möglich, mit Benutzern auf anderen Servern zu interagieren.",
  "joinThisServer": "Bei dieser Instanz registrieren",
  "exploreOtherServers": "Eine andere Instanz finden",
  "login": "Anmelden",
  "users": "Benutzer",
  "notes": "Notizen",
  "letsLookAtTimeline": "Die Chronik durchstöbern"
}
</locale>

<locale locale="en-US" lang="json">
{
  "headlineMisskey": "A network connected by notes",
  "invitationRequiredToRegister": "This instance is invite-only. You must enter a valid invite code sign up.",
  "federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
  "federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
  "joinThisServer": "Sign up at this instance",
  "exploreOtherServers": "Look for another instance",
  "login": "Sign In",
  "users": "Users",
  "notes": "Notes",
  "letsLookAtTimeline": "Have a look at the timeline"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "headlineMisskey": "Red conectada por notas",
  "invitationRequiredToRegister": "Esta instancia está configurada sólo por invitación, tienes que ingresar un código de invitación válido.",
  "federationSpecified": "Este servidor opera en una federación de listas blancas. No puede interactuar con otros servidores que no sean los especificados por el administrador.",
  "federationDisabled": "La federación está desactivada en este servidor. No puede interactuar con usuarios de otros servidores",
  "joinThisServer": "Registrarse en esta instancia",
  "exploreOtherServers": "Buscar otra instancia",
  "login": "Iniciar sesión",
  "users": "Usuarios",
  "notes": "Notas",
  "letsLookAtTimeline": "Mira la línea de tiempo"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "headlineMisskey": "Réseau relié par des notes",
  "invitationRequiredToRegister": "Actuellement, cette instance est uniquement sur invitation. Seuls ceux qui ont un code d'invitation peuvent s'inscrire.",
  "federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
  "federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
  "joinThisServer": "S'inscrire à cette instance",
  "exploreOtherServers": "Trouver une autre instance",
  "login": "Se connecter",
  "users": "Utilisateur·rice·s",
  "notes": "Notes",
  "letsLookAtTimeline": "Jetez un coup d'œil au fil"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "headlineMisskey": "Jaringan terhubung melalui catatan",
  "invitationRequiredToRegister": "Instansi ini dalam mode undangan-saja. Kamu harus memasukkan kode undangan yang valid untuk mendaftar.",
  "federationSpecified": "Peladen ini dioperasikan dalam federasi daftar putih. Interaksi dengan peladen selain yang telah dikelola oleh admin tidak diperbolehkan.",
  "federationDisabled": "Federasi dimatikan di peladen ini. Anda tidak dapat berinteraksi dengan pengguna di peladen lain.",
  "joinThisServer": "Gabung peladen ini",
  "exploreOtherServers": "Cari peladen lain",
  "login": "Masuk",
  "users": "Pengguna",
  "notes": "Catatan",
  "letsLookAtTimeline": "LIhat lini masa"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "headlineMisskey": "Rete collegata tramite Note",
  "invitationRequiredToRegister": "L'accesso a questa istanza è solo ad invito. Può registrarsi solo chi ha un codice fornito dall'amministrazione.",
  "federationSpecified": "Questo server è federato solo con istanze specifiche del Fediverso. Puoi interagire solo con quelle scelte dall'amministrazione.",
  "federationDisabled": "Questo server ha la federazione disabilitata. Non puoi interagire con profili provenienti da altri server.",
  "joinThisServer": "Registrati su questa istanza",
  "exploreOtherServers": "Trova altre istanze",
  "login": "Accedi",
  "users": "Profili",
  "notes": "Note",
  "letsLookAtTimeline": "Sbircia la timeline"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "headlineMisskey": "ノートでつながるネットワーク",
  "invitationRequiredToRegister": "現在このサーバーは招待制です。招待コードをお持ちの方のみ登録できます。",
  "federationSpecified": "このサーバーはホワイトリスト連合で運用されています。管理者が指定したサーバー以外とやり取りすることはできません。",
  "federationDisabled": "このサーバーは連合が無効化されています。他のサーバーのユーザーとやり取りすることはできません。",
  "joinThisServer": "このサーバーに登録する",
  "exploreOtherServers": "他のサーバーを探す",
  "login": "ログイン",
  "users": "ユーザー",
  "notes": "ノート",
  "letsLookAtTimeline": "タイムラインを見てみる"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "headlineMisskey": "ノートでつながるネットワーク",
  "invitationRequiredToRegister": "今このサーバー招待制になってもうてんねん。招待コードを持っとるんやったら登録できるで。",
  "federationSpecified": "このサーバーはホワイトリスト連合で運用されてるで。管理者が指定したサーバー以外とはやり取りできひんで。",
  "federationDisabled": "このサーバーは連合が無効化されてるで。他のサーバーのユーザーとやり取りすることはできひんで。",
  "joinThisServer": "このサーバーに登録するわ",
  "exploreOtherServers": "他のサーバー見てみる",
  "login": "ログイン",
  "users": "ユーザー",
  "notes": "ノート",
  "letsLookAtTimeline": "タイムライン見てみーや"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "headlineMisskey": "A network connected by notes",
  "invitationRequiredToRegister": "This instance is invite-only. You must enter a valid invite code sign up.",
  "federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
  "federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
  "joinThisServer": "Sign up at this instance",
  "exploreOtherServers": "Look for another instance",
  "login": "Sign In",
  "users": "Users",
  "notes": "Notes",
  "letsLookAtTimeline": "Have a look at the timeline"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "headlineMisskey": "A network connected by notes",
  "invitationRequiredToRegister": "This instance is invite-only. You must enter a valid invite code sign up.",
  "federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
  "federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
  "joinThisServer": "Sign up at this instance",
  "exploreOtherServers": "Look for another instance",
  "login": "ಪ್ರವೇಶ",
  "users": "ಬಳಕೆದಾರ",
  "notes": "Notes",
  "letsLookAtTimeline": "Have a look at the timeline"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "headlineMisskey": "노트로 연결되는 네트워크",
  "invitationRequiredToRegister": "현재 이 서버는 비공개입니다. 회원가입을 하시려면 초대 코드가 필요합니다.",
  "federationSpecified": "이 서버는 화이트 리스트 제도로 운영 중 입니다. 정해진 리모트 서버가 아닌 경우 연합되지 않습니다.",
  "federationDisabled": "이 서버는 연합을 하지 않고 있습니다. 리모트 서버 유저와 통신을 할 수 없습니다.",
  "joinThisServer": "이 서버에 가입",
  "exploreOtherServers": "다른 서버 찾기",
  "login": "로그인",
  "users": "유저",
  "notes": "노트",
  "letsLookAtTimeline": "타임라인 구경하기"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "headlineMisskey": "Netwerk verbonden door notities",
  "invitationRequiredToRegister": "This instance is invite-only. You must enter a valid invite code sign up.",
  "federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
  "federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
  "joinThisServer": "Sign up at this instance",
  "exploreOtherServers": "Look for another instance",
  "login": "Inloggen",
  "users": "Gebruikers",
  "notes": "Notities",
  "letsLookAtTimeline": "Have a look at the timeline"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "headlineMisskey": "Et nettverk forbundet med Notes",
  "invitationRequiredToRegister": "This instance is invite-only. You must enter a valid invite code sign up.",
  "federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
  "federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
  "joinThisServer": "Sign up at this instance",
  "exploreOtherServers": "Utforsk andre severe",
  "login": "Logg inn",
  "users": "Brukere",
  "notes": "Notes",
  "letsLookAtTimeline": "La oss se på tidslinje"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "headlineMisskey": "Sieć połączona wpisami",
  "invitationRequiredToRegister": "Ten serwer wymaga zaproszenia. Tylko osoby z zaproszeniem mogą się zarejestrować",
  "federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
  "federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
  "joinThisServer": "Dołącz do chaty",
  "exploreOtherServers": "Szukaj innej instancji",
  "login": "Zaloguj się",
  "users": "Użytkownicy",
  "notes": "Wpisy",
  "letsLookAtTimeline": "Have a look at the timeline"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "headlineMisskey": "Uma rede ligada por notas",
  "invitationRequiredToRegister": "Essa instância é apenas para convidados. Você precisa inserir um código válido para se cadastrar.",
  "federationSpecified": "Esse servidor opera com uma lista branca de federação. Interagir com servidores diferentes daqueles designados pela administração não é permitido.",
  "federationDisabled": "Federação está desabilitada nesse servidor. Você não pode interagir com usuários de outros servidores.",
  "joinThisServer": "Cadastrar-se na instância",
  "exploreOtherServers": "Buscar outra instância",
  "login": "Iniciar sessão",
  "users": "Usuários",
  "notes": "Posts",
  "letsLookAtTimeline": "Dar uma olhada na linha do tempo"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "headlineMisskey": "Сеть, сплетённая из заметок",
  "invitationRequiredToRegister": "Этот сервер в настоящее время только по приглашению. Зарегистрироваться могут только те, у кого есть код приглашения.",
  "federationSpecified": "Сервер работает через белый список федерации. Связь с другими серверами ограничена",
  "federationDisabled": "Федерация отключена для этого сервера. Вы не можете взаимодействовать с пользователями на других серверах.",
  "joinThisServer": "Присоединяйтесь к этому серверу",
  "exploreOtherServers": "Искать другие сервера",
  "login": "Войти",
  "users": "Пользователи",
  "notes": "Заметки",
  "letsLookAtTimeline": "Давайте посмотрим на ленту"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "headlineMisskey": "Sieť prepojená poznámkami",
  "invitationRequiredToRegister": "This instance is invite-only. You must enter a valid invite code sign up.",
  "federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
  "federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
  "joinThisServer": "Sign up at this instance",
  "exploreOtherServers": "Look for another instance",
  "login": "Prihlásiť sa",
  "users": "Používatelia",
  "notes": "Poznámky",
  "letsLookAtTimeline": "Have a look at the timeline"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "headlineMisskey": "เชื่อมต่อเครือข่ายโดยโน้ต",
  "invitationRequiredToRegister": "เซิร์ฟเวอร์นี้เป็นแบบรับเชิญ เฉพาะผู้มีรหัสเชิญเท่านั้นถึงสามารถลงทะเบียนได้",
  "federationSpecified": "เซิร์ฟเวอร์นี้ดำเนินงานในระบบกลุ่มไวท์ลิสต์ ไม่สามารถติดต่อกับเซิร์ฟเวอร์อื่นที่ไม่ได้รับอนุญาตจากผู้ดูแลระบบได้",
  "federationDisabled": "เซิร์ฟเวอร์นี้ปิดใช้งานสหพันธ์ ไม่สามารถติดต่อหรือแลกเปลี่ยนข้อมูลกับผู้ใช้จากเซิร์ฟเวอร์อื่นได้",
  "joinThisServer": "ลงทะเบียนในเซิร์ฟเวอร์นี้",
  "exploreOtherServers": "มองหาเซิร์ฟเวอร์อื่น",
  "login": "เข้าสู่ระบบ",
  "users": "ผู้ใช้",
  "notes": " โน้ต",
  "letsLookAtTimeline": "มาดูไทม์ไลน์กัน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "headlineMisskey": "Notlarla birbirine bağlı bir ağ",
  "invitationRequiredToRegister": "Bu etkinlik davetle katılımlıdır. Geçerli bir davet kodu girerek kaydolmanız gerekir.",
  "federationSpecified": "Bu sunucu, beyaz liste federasyonunda çalıştırılmaktadır. Yönetici tarafından belirlenen sunucular dışında diğer sunucularla etkileşim kurmak yasaktır.",
  "federationDisabled": "Bu sunucuda federasyon devre dışıdır. Diğer sunuculardaki kullanıcılarla etkileşim kuramazsınız.",
  "joinThisServer": "Kaydol",
  "exploreOtherServers": "Diğer sunucuları keşfet",
  "login": "Oturum Aç",
  "users": "Kullanıcılar",
  "notes": "Notlar",
  "letsLookAtTimeline": "Pano'ya bir göz atın"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "headlineMisskey": "خاتىرە ئارقىلىق ئۇلانغان تور",
  "invitationRequiredToRegister": "This instance is invite-only. You must enter a valid invite code sign up.",
  "federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
  "federationDisabled": "Federation is disabled on this server. You cannot interact with users on other servers.",
  "joinThisServer": "Sign up at this instance",
  "exploreOtherServers": "Look for another instance",
  "login": "كىرىش",
  "users": "Users",
  "notes": "Notes",
  "letsLookAtTimeline": "Have a look at the timeline"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "headlineMisskey": "Мережа, з’єднана нотатками",
  "invitationRequiredToRegister": "Цей інстанс доступний лише за запрошенням. Щоб зареєструватися, потрібно ввести дійсний код запрошення.",
  "federationSpecified": "Сервер працює через білий лист федерації. Зв'язок з іншими серверами обмежена.",
  "federationDisabled": "Федерація вимкнута для цього сервера. Ви не можете взаємодіяти з користувачами на інших серверах.",
  "joinThisServer": "Зареєструватися на цьому сервері",
  "exploreOtherServers": "Знайти інший сервер",
  "login": "Увійти",
  "users": "Користувачі",
  "notes": "Записи",
  "letsLookAtTimeline": "Перегляд історії"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "headlineMisskey": "Mạng xã hội liên hợp",
  "invitationRequiredToRegister": "Phiên bản này chỉ dành cho người được mời. Bạn phải nhập mã mời hợp lệ để đăng ký.",
  "federationSpecified": "This server is operated in a whitelist federation. Interacting with servers other than those designated by the administrator is not allowed.",
  "federationDisabled": "Liên kết bị vô hiệu hóa trên máy chủ này. Bạn không thể tương tác với người dùng trên các máy chủ khác.",
  "joinThisServer": "Đăng ký trên chủ máy này",
  "exploreOtherServers": "Tìm chủ máy khác",
  "login": "Đăng nhập",
  "users": "Người dùng",
  "notes": "Bài Viết",
  "letsLookAtTimeline": "Thử xem Timeline"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "headlineMisskey": "通过帖子连接在一起的网络",
  "invitationRequiredToRegister": "此服务器目前只允许拥有邀请码的人注册。",
  "federationSpecified": "此服务器已开启联邦白名单模式。只能与管理员指定的服务器通信。",
  "federationDisabled": "此服务器已禁用联邦功能。无法与其它服务器上的用户通信。",
  "joinThisServer": "在本服务器上注册",
  "exploreOtherServers": "探索其他服务器",
  "login": "登录",
  "users": "用户",
  "notes": "帖子",
  "letsLookAtTimeline": "看看时间线"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "headlineMisskey": "貼文連繫網路",
  "invitationRequiredToRegister": "目前這個伺服器為邀請制，必須擁有邀請碼才能註冊。",
  "federationSpecified": "此伺服器以白名單聯邦的方式運作。除了管理員指定的伺服器外，它無法與其他伺服器互動。",
  "federationDisabled": "此伺服器未開啟站台聯邦。無法與其他伺服器上的使用者互動。",
  "joinThisServer": "在此伺服器上註冊",
  "exploreOtherServers": "探索其他伺服器",
  "login": "登入",
  "users": "使用者",
  "notes": "貼文",
  "letsLookAtTimeline": "看看時間軸"
}
</locale>
