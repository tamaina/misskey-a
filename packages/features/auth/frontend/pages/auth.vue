<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 500px;">
		<div v-if="state == 'fetch-session-error'">
			<p>{{ $locale.sfc.somethingHappened }}</p>
		</div>
		<div v-else-if="$i && !session">
			<MkLoading/>
		</div>
		<div v-else-if="$i && session">
			<XForm
				v-if="state == 'waiting'"
				class="form"
				:session="session"
				@denied="state = 'denied'"
				@accepted="accepted"
			/>
			<div v-if="state == 'denied'">
				<h1>{{ $locale.sfc.denied }}</h1>
			</div>
			<div v-if="state == 'accepted' && session">
				<h1>{{ session.app.isAuthorized ? $locale.sfc.alreadyAuthorized : $locale.sfc.accepted }}</h1>
				<p v-if="session.app.callbackUrl">
					{{ $locale.sfc.callback }}
					<MkEllipsis/>
				</p>
				<p v-if="!session.app.callbackUrl">{{ $locale.sfc.pleaseGoBack }}</p>
			</div>
		</div>
		<div v-else>
			<p :class="$style.loginMessage">{{ $locale.sfc.pleaseLogin }}</p>
			<MkSignin @login="onLogin"/>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import XForm from '@features/auth/frontend/pages/auth.form.vue';
import MkSignin from '@features/auth/frontend/components/MkSignin.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { $i } from '@features/auth/frontend/i.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { login } from '@features/auth/frontend/accounts.js';

const props = defineProps<{
	token: string;
}>();

const state = ref<'waiting' | 'accepted' | 'fetch-session-error' | 'denied' | null>(null);
const session = ref<Misskey.entities.AuthSessionShowResponse | null>(null);

function accepted() {
	state.value = 'accepted';
	if (session.value && session.value.app.callbackUrl) {
		const url = new URL(session.value.app.callbackUrl);
		if (['javascript:', 'file:', 'data:', 'mailto:', 'tel:', 'vbscript:'].includes(url.protocol)) throw new Error('invalid url');
		window.location.href = `${session.value.app.callbackUrl}?token=${session.value.token}`;
	}
}

function onLogin(res: Misskey.entities.SigninFlowResponse & { finished: true }) {
	login(res.i);
}

onMounted(async () => {
	if (!$i) return;

	try {
		const result = await misskeyApi('auth/session/show', {
			token: props.token,
		});
		session.value = result;

		// 既に連携していた場合
		if (result.app.isAuthorized) {
			await misskeyApi('auth/accept', {
				token: result.token,
			});
			accepted();
		} else {
			state.value = 'waiting';
		}
	} catch (err) {
		state.value = 'fetch-session-error';
	}
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.shareAccessTitle,
	icon: 'ti ti-apps',
}));
</script>

<style lang="scss" module>
.loginMessage {
	text-align: center;
	margin: 8px 0 24px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"somethingHappened": "حدث خطأ",
	"denied": "رُفض الوصول",
	"alreadyAuthorized": "This application already has access permission.",
	"accepted": "Access granted",
	"callback": "العودة للتطبيق",
	"pleaseGoBack": "رجاءً عد للتطبيق",
	"pleaseLogin": "Please log in to authorize applications.",
	"shareAccessTitle": "Granting application permissions"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"somethingHappened": "S'ha produït un error",
	"denied": "Accés denegat",
	"alreadyAuthorized": "Aquesta aplicació ja té accés.",
	"accepted": "Accés garantit",
	"callback": "Tornant a l'aplicació",
	"pleaseGoBack": "Si us plau, torna a l'aplicació",
	"pleaseLogin": "Si us plau, identificat per autoritzar l'aplicació.",
	"shareAccessTitle": "Concedeix permisos a l'aplicació"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"somethingHappened": "Jejda. Něco se nepovedlo.",
	"denied": "Přístup odepřen",
	"alreadyAuthorized": "This application already has access permission.",
	"accepted": "Access granted",
	"callback": "Návrat k aplikaci",
	"pleaseGoBack": "Vraťte se prosím zpět do aplikace",
	"pleaseLogin": "Pro autorizaci aplikací se prosím přihlaste.",
	"shareAccessTitle": "Udělovat oprávnění k aplikacím"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"somethingHappened": "An error has occurred",
	"denied": "Access denied",
	"alreadyAuthorized": "This application already has access permission.",
	"accepted": "Access granted",
	"callback": "Returning to the application",
	"pleaseGoBack": "Please go back to the application",
	"pleaseLogin": "Please log in to authorize applications.",
	"shareAccessTitle": "Granting application permissions"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"somethingHappened": "Ein Fehler ist aufgetreten",
	"denied": "Zugriff verweigert",
	"alreadyAuthorized": "Dieser Anwendung wurde bereits Zugriff gewährt.",
	"accepted": "Zugriff gewährt",
	"callback": "Es wird zur Anwendung zurückgekehrt",
	"pleaseGoBack": "Bitte kehre zur Anwendung zurück",
	"pleaseLogin": "Bitte logge dich ein, um Apps zu authorisieren.",
	"shareAccessTitle": "Verteilung von App-Berechtigungen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"somethingHappened": "An error has occurred",
	"denied": "Access denied",
	"alreadyAuthorized": "This application already has access permission.",
	"accepted": "Access granted",
	"callback": "Returning to the application",
	"pleaseGoBack": "Please go back to the application",
	"pleaseLogin": "Please log in to authorize applications.",
	"shareAccessTitle": "Granting application permissions"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"somethingHappened": "Ocurrió un error",
	"denied": "Acceso denegado",
	"alreadyAuthorized": "Esta aplicación ya ha obtenido acceso.",
	"accepted": "Acceso concedido.",
	"callback": "Volviendo a la aplicación",
	"pleaseGoBack": "Por favor, vuelve a la aplicación",
	"pleaseLogin": "Se requiere un inicio de sesión para darle permisos a la aplicación",
	"shareAccessTitle": "Permisos de la aplicación"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"somethingHappened": "Une erreur est survenue",
	"denied": "Accès refusé",
	"alreadyAuthorized": "This application already has access permission.",
	"accepted": "Access granted",
	"callback": "Retour vers l’application",
	"pleaseGoBack": "Veuillez retourner à l’application",
	"pleaseLogin": "Please log in to authorize applications.",
	"shareAccessTitle": "Granting application permissions"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"somethingHappened": "Terjadi kesalahan",
	"denied": "Akses ditolak",
	"alreadyAuthorized": "Aplikasi ini sudah memiliki ijin akses.",
	"accepted": "Access granted",
	"callback": "Mengembalikan kamu ke aplikasi",
	"pleaseGoBack": "Mohon kembali ke aplikasi kamu",
	"pleaseLogin": "Mohon masuk untuk otorisasi aplikasi.",
	"shareAccessTitle": "Mendapatkan ijin akses aplikasi"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"somethingHappened": "Si è verificato un problema",
	"denied": "Accesso negato",
	"alreadyAuthorized": "Questa applicazione è già autorizzata ad accedere.",
	"accepted": "Accesso concesso",
	"callback": "Ritornando sulla app",
	"pleaseGoBack": "Si prega di ritornare sulla app",
	"pleaseLogin": "Per favore accedi al tuo account per cambiare i permessi dell'applicazione",
	"shareAccessTitle": "Permessi dell'applicazione"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"somethingHappened": "問題が発生しました",
	"denied": "アクセスを拒否しました",
	"alreadyAuthorized": "このアプリケーションは既にアクセスが許可されています。",
	"accepted": "アクセスを許可しました",
	"callback": "アプリケーションに戻っています",
	"pleaseGoBack": "アプリケーションに戻ってやっていってください",
	"pleaseLogin": "アプリケーションにアクセス許可を与えるには、ログインが必要です。",
	"shareAccessTitle": "アプリへのアクセス許可"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"somethingHappened": "なんかあかんわ",
	"denied": "アクセスを拒否ったで",
	"alreadyAuthorized": "このアプリはもうアクセスを許可してるみたいやで。",
	"accepted": "アクセスを許可したで",
	"callback": "アプリケーションに戻っとるで",
	"pleaseGoBack": "アプリケーションに戻ってええよ",
	"pleaseLogin": "アプリにアクセスさせるんやったら、ログインしてや。",
	"shareAccessTitle": "アプリへのアクセス許してやったらどうや"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"somethingHappened": "An error has occurred",
	"denied": "Access denied",
	"alreadyAuthorized": "This application already has access permission.",
	"accepted": "Access granted",
	"callback": "Returning to the application",
	"pleaseGoBack": "Please go back to the application",
	"pleaseLogin": "Please log in to authorize applications.",
	"shareAccessTitle": "Granting application permissions"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"somethingHappened": "An error has occurred",
	"denied": "Access denied",
	"alreadyAuthorized": "This application already has access permission.",
	"accepted": "Access granted",
	"callback": "Returning to the application",
	"pleaseGoBack": "Please go back to the application",
	"pleaseLogin": "Please log in to authorize applications.",
	"shareAccessTitle": "Granting application permissions"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"somethingHappened": "오류가 발생했습니다",
	"denied": "접근이 거부되었습니다",
	"alreadyAuthorized": "이 애플리케이션은 이미 접근이 허가돼있습니다.",
	"accepted": "접근 권한이 부여되었습니다.",
	"callback": "앱으로 돌아갑니다",
	"pleaseGoBack": "앱으로 돌아가서 시도해 주세요",
	"pleaseLogin": "어플리케이션의 접근을 허가하려면 로그인하십시오.",
	"shareAccessTitle": "어플리케이션의 접근 허가"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"somethingHappened": "Er is iets misgegaan.",
	"denied": "Access denied",
	"alreadyAuthorized": "This application already has access permission.",
	"accepted": "Access granted",
	"callback": "Returning to the application",
	"pleaseGoBack": "Please go back to the application",
	"pleaseLogin": "Please log in to authorize applications.",
	"shareAccessTitle": "Granting application permissions"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"somethingHappened": "En feil har oppstått",
	"denied": "Access denied",
	"alreadyAuthorized": "This application already has access permission.",
	"accepted": "Access granted",
	"callback": "Returning to the application",
	"pleaseGoBack": "Please go back to the application",
	"pleaseLogin": "Please log in to authorize applications.",
	"shareAccessTitle": "Granting application permissions"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"somethingHappened": "Coś poszło nie tak",
	"denied": "Odmowa dostępu",
	"alreadyAuthorized": "This application already has access permission.",
	"accepted": "Access granted",
	"callback": "Powracanie do aplikacji",
	"pleaseGoBack": "Proszę, wróć do aplikacji",
	"pleaseLogin": "Zaloguj się, aby autoryzować aplikacje.",
	"shareAccessTitle": "Przyznawanie uprawnień aplikacji"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"somethingHappened": "Ocorreu um erro",
	"denied": "Acesso negado",
	"alreadyAuthorized": "This application already has access permission.",
	"accepted": "Acesso permitido",
	"callback": "Retornando ao aplicativo",
	"pleaseGoBack": "Por favor, volte ao aplicativo",
	"pleaseLogin": "Por favor, entre para autorizar aplicativos.",
	"shareAccessTitle": "Conceder permissões do aplicativo"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"somethingHappened": "Что-то пошло не так",
	"denied": "Доступ закрыт",
	"alreadyAuthorized": "This application already has access permission.",
	"accepted": "Access granted",
	"callback": "Возврат в приложение",
	"pleaseGoBack": "Вернитесь, пожалуйста, в приложение",
	"pleaseLogin": "Вы должны войти в систему, чтобы дать разрешение приложению.",
	"shareAccessTitle": "Разрешения для приложений"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"somethingHappened": "Ups. Niečo sa nepodarilo.",
	"denied": "Prístup zamietnutý",
	"alreadyAuthorized": "This application already has access permission.",
	"accepted": "Access granted",
	"callback": "Vraciam sa späť na aplikáciu",
	"pleaseGoBack": "Prosím prejdite späť na aplikáciu",
	"pleaseLogin": "Please log in to authorize applications.",
	"shareAccessTitle": "Granting application permissions"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"somethingHappened": "อุ๊ย ! มีอะไรบางอย่างผิดพลาด",
	"denied": "ปฏิเสธการเข้าใช้",
	"alreadyAuthorized": "แอปพลิเคชันนี้ได้รับอนุญาตให้เข้าถึงแล้ว",
	"accepted": "การเข้าถึงได้รับอนุญาต",
	"callback": "กำลังกลับไปที่แอปพลิเคชัน",
	"pleaseGoBack": "กรุณากลับไปที่แอปพลิเคชัน",
	"pleaseLogin": "กรุณาเข้าสู่ระบบเพื่ออนุมัติแอปพลิเคชัน",
	"shareAccessTitle": "การให้สิทธิ์แอปพลิเคชัน"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"somethingHappened": "Bir hata oluştu",
	"denied": "Erişim reddedildi",
	"alreadyAuthorized": "Bu uygulamaya zaten erişim izinleri verilmiş durumda.",
	"accepted": "Erişim izni verildi",
	"callback": "Uygulamaya geri dönmek",
	"pleaseGoBack": "Lütfen uygulamaya geri dönün.",
	"pleaseLogin": "Uygulamaları yetkilendirmek için lütfen giriş yapın.",
	"shareAccessTitle": "Uygulama izinlerinin verilmesi"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"somethingHappened": "An error has occurred",
	"denied": "Access denied",
	"alreadyAuthorized": "This application already has access permission.",
	"accepted": "Access granted",
	"callback": "Returning to the application",
	"pleaseGoBack": "Please go back to the application",
	"pleaseLogin": "Please log in to authorize applications.",
	"shareAccessTitle": "Granting application permissions"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"somethingHappened": "Щось пішло не так",
	"denied": "У доступі відмовлено",
	"alreadyAuthorized": "This application already has access permission.",
	"accepted": "Access granted",
	"callback": "Returning to the application",
	"pleaseGoBack": "Please go back to the application",
	"pleaseLogin": "Please log in to authorize applications.",
	"shareAccessTitle": "Granting application permissions"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"somethingHappened": "Xảy ra lỗi",
	"denied": "Truy cập bị từ chối",
	"alreadyAuthorized": "This application already has access permission.",
	"accepted": "Access granted",
	"callback": "Quay lại ứng dụng",
	"pleaseGoBack": "Vui lòng quay lại ứng dụng",
	"pleaseLogin": "Bạn phải đăng nhập để cho ứng dụng phép truy cập",
	"shareAccessTitle": "Cho phép truy cập app"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"somethingHappened": "出错了",
	"denied": "拒绝访问",
	"alreadyAuthorized": "此应用已有访问许可。",
	"accepted": "已允许访问",
	"callback": "回到应用程序",
	"pleaseGoBack": "请返回到应用程序",
	"pleaseLogin": "在对应用进行授权许可之前，请先登录",
	"shareAccessTitle": "应用程序授权许可"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"somethingHappened": "發生錯誤",
	"denied": "拒絕訪問",
	"alreadyAuthorized": "此應用程式已被授予存取權限。",
	"accepted": "已授予存取權限",
	"callback": "回到應用程式",
	"pleaseGoBack": "請返回至應用程式",
	"pleaseLogin": "必須登入以提供應用程式的存取權限。",
	"shareAccessTitle": "應用程式的存取權限"
}
</locale>
