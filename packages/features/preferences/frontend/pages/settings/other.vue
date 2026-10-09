<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/other" :label="$locale.sfc.other" :keywords="['other']" icon="ti ti-dots">
	<div class="_gaps_m">
		<!--
		<MkSwitch v-model="$i.injectFeaturedNote" @update:model-value="onChangeInjectFeaturedNote">
			<template #label>{{ i18n.ts.showFeaturedNotesInTimeline }}</template>
		</MkSwitch>
		-->

		<!--
		<MkSwitch v-model="reportError">{{ i18n.ts.sendErrorReports }}<template #caption>{{ i18n.ts.sendErrorReportsDescription }}</template></MkSwitch>
		-->

		<div class="_gaps_s">
			<SearchMarker :keywords="['account', 'info']">
				<MkFolder>
					<template #icon><SearchIcon><i class="ti ti-info-circle"></i></SearchIcon></template>
					<template #label><SearchLabel>{{ $locale.sfc.accountInfo }}</SearchLabel></template>

					<div class="_gaps_m">
						<MkKeyValue>
							<template #key>ID</template>
							<template #value><span class="_monospace">{{ $i.id }}</span></template>
						</MkKeyValue>

						<MkKeyValue>
							<template #key>{{ $locale.sfc.registeredDate }}</template>
							<template #value><MkTime :time="$i.createdAt" mode="detail"/></template>
						</MkKeyValue>

						<SearchMarker :keywords="['role', 'policy']">
							<MkFolder>
								<template #icon><i class="ti ti-badges"></i></template>
								<template #label><SearchLabel>{{ $locale.sfc.policies }}</SearchLabel></template>

								<div class="_gaps_s">
									<div v-for="policy in Object.keys($i.policies)" :key="policy">
										{{ policy }} ... {{ $i.policies[policy as keyof typeof $i.policies] }}
									</div>
								</div>
							</MkFolder>
						</SearchMarker>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['roles']">
				<MkFolder>
					<template #icon><SearchIcon><i class="ti ti-badges"></i></SearchIcon></template>
					<template #label><SearchLabel>{{ $locale.sfc.rolesAssignedToMe }}</SearchLabel></template>

					<div class="_gaps_s">
						<MkRolePreview v-for="role in $i.roles" :key="role.id" :role="role" :forModeration="false"/>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['account', 'move', 'migration']">
				<MkFolder>
					<template #icon><SearchIcon><i class="ti ti-plane"></i></SearchIcon></template>
					<template #label><SearchLabel>{{ $locale.sfc.accountMigration }}</SearchLabel></template>

					<XMigration/>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['account', 'close', 'delete']">
				<MkFolder>
					<template #icon><SearchIcon><i class="ti ti-alert-triangle"></i></SearchIcon></template>
					<template #label><SearchLabel>{{ $locale.sfc.closeAccount }}</SearchLabel></template>

					<div class="_gaps_m">
						<FormInfo warn>{{ $locale.sfc.mayTakeTime }}</FormInfo>
						<FormInfo>{{ $locale.sfc.sendEmail }}</FormInfo>
						<MkButton v-if="!$i.isDeleted" danger @click="deleteAccount"><SearchText>{{ $locale.sfc.requestAccountDelete }}</SearchText></MkButton>
						<MkButton v-else disabled>{{ $locale.sfc.inProgress }}</MkButton>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['experimental', 'feature', 'flags']">
				<MkFolder>
					<template #icon><SearchIcon><i class="ti ti-flask"></i></SearchIcon></template>
					<template #label><SearchLabel>{{ $locale.sfc.experimentalFeatures }}</SearchLabel></template>

					<div class="_gaps_m">
						<MkSwitch v-model="skipNoteRender">
							<template #label>Enable note render skipping</template>
						</MkSwitch>
						<MkSwitch v-model="stackingRouterView">
							<template #label>Enable stacking router view</template>
						</MkSwitch>
						<MkSwitch v-model="enableFolderPageView">
							<template #label>Enable folder page view</template>
						</MkSwitch>
						<MkSwitch v-model="enableHapticFeedback">
							<template #label>Enable haptic feedback</template>
						</MkSwitch>
						<MkSwitch v-model="enableWebTranslatorApi">
							<template #label>Enable in-browser translator API</template>
						</MkSwitch>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['developer', 'mode', 'debug']">
				<MkFolder>
					<template #icon><SearchIcon><i class="ti ti-code"></i></SearchIcon></template>
					<template #label><SearchLabel>{{ $locale.sfc.developer }}</SearchLabel></template>

					<div class="_gaps_m">
						<MkSwitch v-model="devMode">
							<template #label>{{ $locale.sfc.devMode }}</template>
						</MkSwitch>
					</div>
				</MkFolder>
			</SearchMarker>
		</div>

		<hr>

		<FormLink to="/registry"><template #icon><i class="ti ti-adjustments"></i></template>{{ $locale.sfc.registry }}</FormLink>

		<hr>

		<MkButton @click="resetAllTips"><i class="ti ti-bulb"></i> {{ $locale.sfc.redisplayAllTips }}</MkButton>
		<MkButton @click="hideAllTips"><i class="ti ti-bulb-off"></i> {{ $locale.sfc.hideAllTips }}</MkButton>

		<hr>

		<template v-if="$i.policies.chatAvailability !== 'unavailable'">
			<MkButton @click="readAllChatMessages">{{ $locale.sfc.readAllChatMessages }}</MkButton>

			<hr>
		</template>

		<MkButton v-if="storagePersistenceSupported && !storagePersisted" @click="enableStoragePersistence">{{ $locale.sfc.settingsPersistence_title }}</MkButton>

		<MkButton @click="forceCloudBackup">{{ $locale.sfc.forceBackup }}</MkButton>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import XMigration from '@features/users/frontend/pages/settings/migration.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import FormLink from '@features/ui/frontend/components/form/link.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import FormInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import FormSlot from '@features/ui/frontend/components/form/slot.vue';
import * as os from '@features/ui/frontend/os.js';
import { enableStoragePersistence, getStoragePersistenceStatusRef, storagePersistenceSupported } from '@features/runtime/frontend/utility/storage.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { definePage } from '@features/navigation/frontend/page.js';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';
import MkRolePreview from '@features/roles/frontend/components/MkRolePreview.vue';
import { signout } from '@features/auth/frontend/signout.js';
import { hideAllTips as _hideAllTips, resetAllTips as _resetAllTips } from '@features/web/frontend/tips.js';
import { suggestReload } from '@features/boot/frontend/utility/reload-suggest.js';
import { cloudBackup } from '@features/preferences/frontend/state/utility.js';

const $i = ensureSignin();

const storagePersisted = await getStoragePersistenceStatusRef();

const reportError = prefer.model('reportError');
const skipNoteRender = prefer.model('skipNoteRender');
const devMode = prefer.model('devMode');
const stackingRouterView = prefer.model('experimental.stackingRouterView');
const enableFolderPageView = prefer.model('experimental.enableFolderPageView');
const enableHapticFeedback = prefer.model('experimental.enableHapticFeedback');
const enableWebTranslatorApi = prefer.model('experimental.enableWebTranslatorApi');

watch(skipNoteRender, () => {
	suggestReload();
});

async function deleteAccount() {
	{
		const { canceled } = await os.confirm({
			type: 'warning',
			text: $locale.value.sfc.deleteAccountConfirm,
		});
		if (canceled) return;
	}

	const auth = await os.authenticateDialog();
	if (auth.canceled) return;

	await os.apiWithDialog('i/delete-account', {
		password: auth.result.password,
		token: auth.result.token,
	});

	await os.alert({
		title: $locale.value.sfc.started,
	});

	await signout();
}

function resetAllTips() {
	_resetAllTips();
	os.success();
}

function hideAllTips() {
	_hideAllTips();
	os.success();
}

function readAllChatMessages() {
	os.apiWithDialog('chat/read-all', {});
}

async function forceCloudBackup() {
	await cloudBackup();
	os.success();
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.other,
	icon: 'ti ti-dots',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"deleteAccountConfirm": "سيحذف حسابك نهائيًا، أتريد المتابعة؟",
	"started": "بدأت عملية الحذف.",
	"other": "منوعات",
	"accountInfo": "معلومات الحساب",
	"registeredDate": "انضم في",
	"policies": "السياسة العامة",
	"rolesAssignedToMe": "الأدوار المسندة إلي",
	"accountMigration": "ترحيل الحساب",
	"closeAccount": "اختر حسبًا",
	"mayTakeTime": "نظرًا لأن حذف الحساب يحتاج موارد كثيرة فقد يستغرق وقتًا طويلاً ليكتمل وذلك بناءً على كمية المحتوى الموجود في الحساب وعدد الملفات المرفوعة.",
	"sendEmail": "عند إنتهاء الحذف سترسل رسالة إلى البريد الإلكتروني المرتبط بهذا الحساب.",
	"requestAccountDelete": "أرسل طلبًا لحذف الحساب",
	"inProgress": "عملية الحذف جارية",
	"experimentalFeatures": "ميّزات اختبارية",
	"developer": "المطور",
	"devMode": "وضع المُطوّر",
	"registry": "السجل",
	"redisplayAllTips": "Show all “Tips & Tricks” again",
	"hideAllTips": "Hide all \"Tips & Tricks\"",
	"readAllChatMessages": "Mark all messages as read",
	"settingsPersistence_title": "Persistence of Settings",
	"forceBackup": "Force a backup of settings"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"deleteAccountConfirm": "Això eliminarà el teu compte irreversiblement. Procedir?",
	"started": "Ha començat l'esborrat del compte.",
	"other": "Altres",
	"accountInfo": "Informació del compte",
	"registeredDate": "Data de registre",
	"policies": "Polítiques",
	"rolesAssignedToMe": "Rols assignats ",
	"accountMigration": "Migració del compte",
	"closeAccount": "Tancar el compte",
	"mayTakeTime": "Com l'eliminació d'un compte consumeix bastants recursos, pot trigar un temps perquè es completi l'esborrat, depenent si tens molt contingut i la quantitat de fitxer que hagis pujat.",
	"sendEmail": "Una vegada hagi finalitzat l'esborrat del compte rebràs un correu electrònic a l'adreça que tinguis registrada en aquest compte.",
	"requestAccountDelete": "Demanar l'eliminació del compte",
	"inProgress": "L'esborrat es troba en procés ",
	"experimentalFeatures": "Característiques experimentals",
	"developer": "Programador",
	"devMode": "Mode desenvolupador",
	"registry": "Registre ",
	"redisplayAllTips": "Torna ha mostrat tots els trucs i consells",
	"hideAllTips": "Amagar tots els trucs i consells",
	"readAllChatMessages": "Marcar tots els missatges com a llegits",
	"settingsPersistence_title": "Persistència de la configuració ",
	"forceBackup": "Còpia de seguretat forçada de la configuració "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"deleteAccountConfirm": "Tohle nenávratně smaže váš účet, chcete pokračovat?",
	"started": "Bylo zahájeno mazání.",
	"other": "Ostatní",
	"accountInfo": "Informace o účtu",
	"registeredDate": "Datum registrace",
	"policies": "Zásady",
	"rolesAssignedToMe": "Přiřazené role ke mně",
	"accountMigration": "Migrace účtu",
	"closeAccount": "Uzavřít účet",
	"mayTakeTime": "Vzhledem k tomu, že odstranění účtu je proces náročný na zdroje, může jeho dokončení trvat určitou dobu v závislosti na tom, kolik obsahu jste vytvořili a kolik souborů jste nahráli.",
	"sendEmail": "Po dokončení odstranění účtu bude na emailovou adresu registrovanou k tomuto účtu zaslán email.",
	"requestAccountDelete": "Žádost o smazání účtu",
	"inProgress": "V současné době probíhá mazání",
	"experimentalFeatures": "Experimentální funkce",
	"developer": "Vývojář",
	"devMode": "Vývojářský režim",
	"registry": "Registr",
	"redisplayAllTips": "Show all “Tips & Tricks” again",
	"hideAllTips": "Hide all \"Tips & Tricks\"",
	"readAllChatMessages": "Označit všechny zprávy za přečtené",
	"settingsPersistence_title": "Persistence of Settings",
	"forceBackup": "Force a backup of settings"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"deleteAccountConfirm": "This will irreversibly delete your account. Proceed?",
	"started": "Deletion has been started.",
	"other": "Other",
	"accountInfo": "Account Info",
	"registeredDate": "Joined on",
	"policies": "Policies",
	"rolesAssignedToMe": "Roles assigned to me",
	"accountMigration": "Account Migration",
	"closeAccount": "Close account",
	"mayTakeTime": "As account deletion is a resource-heavy process, it may take some time to complete depending on how much content you have created and how many files you have uploaded.",
	"sendEmail": "Once account deletion has been completed, an email will be sent to the email address registered to this account.",
	"requestAccountDelete": "Request account deletion",
	"inProgress": "Deletion is currently in progress",
	"experimentalFeatures": "Experimental features",
	"developer": "Developer",
	"devMode": "Developer mode",
	"registry": "Registry",
	"redisplayAllTips": "Show all “Tips & Tricks” again",
	"hideAllTips": "Hide all \"Tips & Tricks\"",
	"readAllChatMessages": "Mark all messages as read",
	"settingsPersistence_title": "Persistence of Settings",
	"forceBackup": "Force a backup of settings"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"deleteAccountConfirm": "Dein Benutzerkonto wird unwiderruflich gelöscht. Trotzdem fortfahren?",
	"started": "Die Löschung wurde eingeleitet.",
	"other": "Anderes",
	"accountInfo": "Benutzerkonto-Informationen",
	"registeredDate": "Registrationsdatum",
	"policies": "Richtlinien",
	"rolesAssignedToMe": "Mir zugewiesene Rollen",
	"accountMigration": "Kontomigration",
	"closeAccount": "Benutzerkonto schließen",
	"mayTakeTime": "Da die Löschung eines Benutzerkontos ein aufwendiger Prozess ist, kann dessen Dauer davon abhängen, wie viel Inhalt von diesem erstellt wurde oder wie viele Dateien von diesem hochgeladen wurden.",
	"sendEmail": "Sobald die Löschung abgeschlossen ist, wird an die mit ihm verknüpfte Email-Adresse eine Benachrichtigung versendet.",
	"requestAccountDelete": "Löschung deines Benutzerkontos anfordern",
	"inProgress": "Löschung in Bearbeitung",
	"experimentalFeatures": "Experimentelle Funktionalitäten",
	"developer": "Entwickler",
	"devMode": "Entwicklermodus",
	"registry": "Registry",
	"redisplayAllTips": "Alle „Tipps und Tricks“ wieder anzeigen",
	"hideAllTips": "Alle „Tipps und Tricks“ ausblenden",
	"readAllChatMessages": "Alle Nachrichten als gelesen markieren",
	"settingsPersistence_title": "Persistenz der Einstellungen",
	"forceBackup": "Erzwungenes Backup der Einstellungen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"deleteAccountConfirm": "This will irreversibly delete your account. Proceed?",
	"started": "Deletion has been started.",
	"other": "Other",
	"accountInfo": "Account Info",
	"registeredDate": "Joined on",
	"policies": "Policies",
	"rolesAssignedToMe": "Roles assigned to me",
	"accountMigration": "Account Migration",
	"closeAccount": "Close account",
	"mayTakeTime": "As account deletion is a resource-heavy process, it may take some time to complete depending on how much content you have created and how many files you have uploaded.",
	"sendEmail": "Once account deletion has been completed, an email will be sent to the email address registered to this account.",
	"requestAccountDelete": "Request account deletion",
	"inProgress": "Deletion is currently in progress",
	"experimentalFeatures": "Experimental features",
	"developer": "Developer",
	"devMode": "Developer mode",
	"registry": "Registry",
	"redisplayAllTips": "Show all “Tips & Tricks” again",
	"hideAllTips": "Hide all \"Tips & Tricks\"",
	"readAllChatMessages": "Mark all messages as read",
	"settingsPersistence_title": "Persistence of Settings",
	"forceBackup": "Force a backup of settings"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"deleteAccountConfirm": "La cuenta será borrada. ¿Está seguro?",
	"started": "El proceso de eliminación ha comenzado.",
	"other": "Otro",
	"accountInfo": "Información de la Cuenta",
	"registeredDate": "Fecha de registro",
	"policies": "Política",
	"rolesAssignedToMe": "Roles asignados a mí",
	"accountMigration": "Migración de cuenta",
	"closeAccount": "Cerrar cuenta",
	"mayTakeTime": "La eliminación de la cuenta es un proceso que precisa de carga. Puede pasar un tiempo hasta que se complete si es mucho el contenido creado y los archivos subidos.",
	"sendEmail": "Cuando se termine de borrar la cuenta, se enviará un correo a la dirección usada para el registro.",
	"requestAccountDelete": "Solicitar la eliminación de la cuenta.",
	"inProgress": "La eliminación está en proceso.",
	"experimentalFeatures": "Características experimentales",
	"developer": "Desarrolladores",
	"devMode": "Modo de desarrollador",
	"registry": "Registro",
	"redisplayAllTips": "Volver a mostrar todos \"Trucos y consejos\"",
	"hideAllTips": "Ocultar todos los \"Trucos y consejos\"",
	"readAllChatMessages": "Marcar todos los mensajes como leídos",
	"settingsPersistence_title": "Persistencia de la configuración",
	"forceBackup": "Forzar una copia de seguridad de la configuración"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"deleteAccountConfirm": "Votre compte sera supprimé. Êtes vous certain ?",
	"started": "La procédure de suppression a commencé.",
	"other": "Autre",
	"accountInfo": " Informations du compte ",
	"registeredDate": "Inscrit le",
	"policies": "Stratégies",
	"rolesAssignedToMe": "Rôles attribués à moi",
	"accountMigration": "Migration de compte",
	"closeAccount": "Fermer le compte",
	"mayTakeTime": "La suppression de compte nécessitant beaucoup de ressources, l'exécution du processus peut prendre du temps, en fonction de la quantité de contenus que vous avez créés et du nombre de fichiers que vous avez téléversés.",
	"sendEmail": "Une fois la suppression de votre compte effectuée, un courriel sera envoyé à l'adresse que vous aviez enregistrée.",
	"requestAccountDelete": "Demander la suppression de votre compte",
	"inProgress": "Suppression en cours",
	"experimentalFeatures": "Fonctionnalités expérimentales",
	"developer": "Développeur",
	"devMode": "Mode développement",
	"registry": "Registre",
	"redisplayAllTips": "Show all “Tips & Tricks” again",
	"hideAllTips": "Hide all \"Tips & Tricks\"",
	"readAllChatMessages": "Mark all messages as read",
	"settingsPersistence_title": "Persistence of Settings",
	"forceBackup": "Force a backup of settings"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"deleteAccountConfirm": "Akun akan dihapus. Apakah kamu yakin?",
	"started": "Penghapusan telah dimulai",
	"other": "Lainnya",
	"accountInfo": "Informasi akun",
	"registeredDate": "Bergabung pada",
	"policies": "Kebijakan",
	"rolesAssignedToMe": "Peran yang ditugaskan ke saya",
	"accountMigration": "Pemindahan akun",
	"closeAccount": "Tutup akun",
	"mayTakeTime": "Karena penghapusan akun merupakan proses yang berat dan intensif, kemungkinan dapat membutuhkan waktu untuk menyelesaikan tergantung daripada berapa banyak konten yang kamu buat dan berapa banyak berkas yang telah kamu unggah.",
	"sendEmail": "Setelah penghapusan akun selesai, pemberitahuan akan dikirimkan ke alamat surel yang terdaftarkan pada akun ini.",
	"requestAccountDelete": "Minta penghapusan akun",
	"inProgress": "Penghapusan sedang dalam proses",
	"experimentalFeatures": "Fitur eksperimental",
	"developer": "Pengembang",
	"devMode": "Mode pengembang",
	"registry": "Registri",
	"redisplayAllTips": "Show all “Tips & Tricks” again",
	"hideAllTips": "Hide all \"Tips & Tricks\"",
	"readAllChatMessages": "Tandai semua pesan menjadi terbaca",
	"settingsPersistence_title": "Persistence of Settings",
	"forceBackup": "Force a backup of settings"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"deleteAccountConfirm": "Così verrà eliminato il profilo. Vuoi procedere?",
	"started": "Inizio della procedura di eliminazione",
	"other": "Eccetera",
	"accountInfo": "Informazioni profilo",
	"registeredDate": "Data iscrizione",
	"policies": "Policy",
	"rolesAssignedToMe": "I miei ruoli",
	"accountMigration": "Migrazione del profilo",
	"closeAccount": "Eliminazione del profilo",
	"mayTakeTime": "L'eliminazione di un profilo è un processo impegnativo, può richiedere del tempo se il numero di contenuti e di file è elevato.",
	"sendEmail": "Quando il profilo sarà completamente eliminato, verrà spedita una e-mail all'indirizzo a cui era registrato.",
	"requestAccountDelete": "Richiesta di eliminazione del profilo",
	"inProgress": "Eliminazione del profilo in corso",
	"experimentalFeatures": "Funzioni sperimentali",
	"developer": "Sviluppatore",
	"devMode": "Modalità sviluppo",
	"registry": "Registro",
	"redisplayAllTips": "Mostra tutti i suggerimenti",
	"hideAllTips": "Nascondi tutti i suggerimenti",
	"readAllChatMessages": "Segna tutti i messaggi come già letti",
	"settingsPersistence_title": "Configurazione persistente",
	"forceBackup": "Backup forzato delle impostazioni"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"deleteAccountConfirm": "アカウントが削除されます。よろしいですか？",
	"started": "削除処理が開始されました。",
	"other": "その他",
	"accountInfo": "アカウント情報",
	"registeredDate": "登録日",
	"policies": "ポリシー",
	"rolesAssignedToMe": "自分に割り当てられたロール",
	"accountMigration": "アカウントの移行",
	"closeAccount": "アカウントを閉鎖する",
	"mayTakeTime": "アカウントの削除は負荷のかかる処理であるため、作成したコンテンツの数やアップロードしたファイルの数が多いと完了までに時間がかかることがあります。",
	"sendEmail": "アカウントの削除が完了する際は、登録してあったメールアドレス宛に通知を送信します。",
	"requestAccountDelete": "アカウント削除をリクエスト",
	"inProgress": "削除が進行中",
	"experimentalFeatures": "実験的機能",
	"developer": "開発者",
	"devMode": "開発者モード",
	"registry": "レジストリ",
	"redisplayAllTips": "全ての「ヒントとコツ」を再表示",
	"hideAllTips": "全ての「ヒントとコツ」を非表示",
	"readAllChatMessages": "すべてのメッセージを既読にする",
	"settingsPersistence_title": "設定の永続化",
	"forceBackup": "設定の強制バックアップ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"deleteAccountConfirm": "アカウントを消すで？ええんか？",
	"started": "削除処理が始まったで。",
	"other": "その他",
	"accountInfo": "アカウント情報",
	"registeredDate": "始めた日",
	"policies": "ポリシー",
	"rolesAssignedToMe": "自分に割り当てられたロール",
	"accountMigration": "アカウントのお引っ越し",
	"closeAccount": "アカウントを閉鎖する",
	"mayTakeTime": "アカウント消すんはサーバーに負荷かかるんやって。やから、作ったコンテンツとか上げたファイルの数が多いと消し終わるまでに時間がかかるかもしれんわ。",
	"sendEmail": "アカウントの消し終わるときは、登録してたメアドに通知するで。",
	"requestAccountDelete": "アカウント削除頼む",
	"inProgress": "今消しよるで",
	"experimentalFeatures": "おためし機能やで",
	"developer": "開発者やで",
	"devMode": "開発者モード",
	"registry": "レジストリ",
	"redisplayAllTips": "全部の「ヒントとコツ」をもっかい見して",
	"hideAllTips": "「ヒントとコツ」は全部表示せんでええ",
	"readAllChatMessages": "メッセージを全部読んだことにしとく",
	"settingsPersistence_title": "設定の永続化",
	"forceBackup": "設定の強制バックアップ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"deleteAccountConfirm": "This will irreversibly delete your account. Proceed?",
	"started": "Deletion has been started.",
	"other": "Wiyyaḍ",
	"accountInfo": "Talɣut n umiḍan",
	"registeredDate": "Joined on",
	"policies": "Policies",
	"rolesAssignedToMe": "Roles assigned to me",
	"accountMigration": "Account Migration",
	"closeAccount": "Close account",
	"mayTakeTime": "As account deletion is a resource-heavy process, it may take some time to complete depending on how much content you have created and how many files you have uploaded.",
	"sendEmail": "Once account deletion has been completed, an email will be sent to the email address registered to this account.",
	"requestAccountDelete": "Request account deletion",
	"inProgress": "Deletion is currently in progress",
	"experimentalFeatures": "Experimental features",
	"developer": "Developer",
	"devMode": "Developer mode",
	"registry": "Registry",
	"redisplayAllTips": "Show all “Tips & Tricks” again",
	"hideAllTips": "Hide all \"Tips & Tricks\"",
	"readAllChatMessages": "Mark all messages as read",
	"settingsPersistence_title": "Persistence of Settings",
	"forceBackup": "Force a backup of settings"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"deleteAccountConfirm": "This will irreversibly delete your account. Proceed?",
	"started": "Deletion has been started.",
	"other": "Other",
	"accountInfo": "Account Info",
	"registeredDate": "Joined on",
	"policies": "Policies",
	"rolesAssignedToMe": "Roles assigned to me",
	"accountMigration": "Account Migration",
	"closeAccount": "Close account",
	"mayTakeTime": "As account deletion is a resource-heavy process, it may take some time to complete depending on how much content you have created and how many files you have uploaded.",
	"sendEmail": "Once account deletion has been completed, an email will be sent to the email address registered to this account.",
	"requestAccountDelete": "Request account deletion",
	"inProgress": "Deletion is currently in progress",
	"experimentalFeatures": "Experimental features",
	"developer": "Developer",
	"devMode": "Developer mode",
	"registry": "Registry",
	"redisplayAllTips": "Show all “Tips & Tricks” again",
	"hideAllTips": "Hide all \"Tips & Tricks\"",
	"readAllChatMessages": "Mark all messages as read",
	"settingsPersistence_title": "Persistence of Settings",
	"forceBackup": "Force a backup of settings"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"deleteAccountConfirm": "계정이 삭제되고 되돌릴 수 없게 됩니다. 계속하시겠습니까? ",
	"started": "삭제 작업이 시작되었습니다.",
	"other": "기타",
	"accountInfo": "계정 정보",
	"registeredDate": "등록일",
	"policies": "정책",
	"rolesAssignedToMe": "나에게 할당된 역할",
	"accountMigration": "계정 이동",
	"closeAccount": "계정 폐쇄",
	"mayTakeTime": "계정 삭제는 서버에 부하를 가하기 때문에, 작성한 콘텐츠나 업로드한 파일의 수가 많으면 완료까지 시간이 걸릴 수 있습니다.",
	"sendEmail": "계정 삭제가 완료되면 등록된 이메일 주소로 알림을 보냅니다.",
	"requestAccountDelete": "계정 삭제 요청",
	"inProgress": "삭제 진행 중",
	"experimentalFeatures": "실험실",
	"developer": "개발자",
	"devMode": "개발자 모드",
	"registry": "레지스트리",
	"redisplayAllTips": "모든 '팁과 유용한 정보'를 재표시",
	"hideAllTips": "모든 '팁과 유용한 정보'를 비표시",
	"readAllChatMessages": "모든 메시지를 읽은 상태로 표시",
	"settingsPersistence_title": "설정 영구화",
	"forceBackup": "설정 강제 백업"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"deleteAccountConfirm": "Je gebruikersaccount wordt onherroepelijk verwijderd. Wil je nog steeds doorgaan?",
	"started": "Deletion has been started.",
	"other": "Ander",
	"accountInfo": "Informatie over gebruikersaccount",
	"registeredDate": "Inschrijvingsdatum",
	"policies": "Policies",
	"rolesAssignedToMe": "Roles assigned to me",
	"accountMigration": "Account Migration",
	"closeAccount": "Gebruikersaccount sluiten",
	"mayTakeTime": "As account deletion is a resource-heavy process, it may take some time to complete depending on how much content you have created and how many files you have uploaded.",
	"sendEmail": "Once account deletion has been completed, an email will be sent to the email address registered to this account.",
	"requestAccountDelete": "Request account deletion",
	"inProgress": "Deletion is currently in progress",
	"experimentalFeatures": "Experimentele functionaliteiten",
	"developer": "Ontwikkelaar",
	"devMode": "Ontwikkelaar modus",
	"registry": "Registry",
	"redisplayAllTips": "Show all “Tips & Tricks” again",
	"hideAllTips": "Hide all \"Tips & Tricks\"",
	"readAllChatMessages": "Mark all messages as read",
	"settingsPersistence_title": "Persistence of Settings",
	"forceBackup": "Force a backup of settings"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"deleteAccountConfirm": "This will irreversibly delete your account. Proceed?",
	"started": "Deletion has been started.",
	"other": "Andre",
	"accountInfo": "Account Info",
	"registeredDate": "Joined on",
	"policies": "Policies",
	"rolesAssignedToMe": "Roles assigned to me",
	"accountMigration": "Account Migration",
	"closeAccount": "Avslutt konto",
	"mayTakeTime": "As account deletion is a resource-heavy process, it may take some time to complete depending on how much content you have created and how many files you have uploaded.",
	"sendEmail": "Once account deletion has been completed, an email will be sent to the email address registered to this account.",
	"requestAccountDelete": "Request account deletion",
	"inProgress": "Deletion is currently in progress",
	"experimentalFeatures": "Experimental features",
	"developer": "Utvikler",
	"devMode": "Developer mode",
	"registry": "Registry",
	"redisplayAllTips": "Show all “Tips & Tricks” again",
	"hideAllTips": "Hide all \"Tips & Tricks\"",
	"readAllChatMessages": "Mark all messages as read",
	"settingsPersistence_title": "Persistence of Settings",
	"forceBackup": "Force a backup of settings"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"deleteAccountConfirm": "Spowoduje to nieodwracalne usunięcie Twojego konta. Kontynuować?",
	"started": "Usuwanie się rozpoczęło.",
	"other": "Inne",
	"accountInfo": "Informacje o koncie",
	"registeredDate": "Zarejestrowano",
	"policies": "Policies",
	"rolesAssignedToMe": "Roles assigned to me",
	"accountMigration": "Account Migration",
	"closeAccount": "Zamknij konto",
	"mayTakeTime": "Ponieważ usuwanie konta jest procesem wymagającym dużej ilości zasobów, jego ukończenie może zająć trochę czasu, w zależności od ilości utworzonej zawartości i liczby przesłanych plików.",
	"sendEmail": "Po zakończeniu usuwania konta na adres e-mail zarejestrowany na tym koncie zostanie wysłana wiadomość e-mail.",
	"requestAccountDelete": "Poproś o usunięcie konta",
	"inProgress": "Usuwanie jest obecnie w toku",
	"experimentalFeatures": "Eksperymentalne funkcje",
	"developer": "Programista",
	"devMode": "Tryb programisty",
	"registry": "Rejestr",
	"redisplayAllTips": "Show all “Tips & Tricks” again",
	"hideAllTips": "Hide all \"Tips & Tricks\"",
	"readAllChatMessages": "Mark all messages as read",
	"settingsPersistence_title": "Persistence of Settings",
	"forceBackup": "Force a backup of settings"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"deleteAccountConfirm": "Deseja realmente excluir a conta?",
	"started": "O processo de exclusão foi iniciado.",
	"other": "Outros",
	"accountInfo": "Informações da conta",
	"registeredDate": "Data de registro",
	"policies": "Políticas",
	"rolesAssignedToMe": "Cargos atribuídos a mim",
	"accountMigration": "Migração da Conta",
	"closeAccount": "Encerrar conta",
	"mayTakeTime": "A exclusão de uma conta é um processo que requer muito recurso, portanto, se você tiver muito conteúdo criados ou arquivos enviados, pode levar algum tempo até ser concluída.",
	"sendEmail": "Quando a exclusão da conta estiver concluída, enviaremos uma notificação para o endereço de e-mail registrado.",
	"requestAccountDelete": "Solicitar exclusão de conta",
	"inProgress": "A exclusão está em andamento",
	"experimentalFeatures": "Funcionalidades Experimentais",
	"developer": "Programador",
	"devMode": "Modo de Desenvolvedor",
	"registry": "Registo",
	"redisplayAllTips": "Mostrar todas as \"Dicas e Truques\" novamente",
	"hideAllTips": "Ocultas todas as \"Dicas e Truques\"",
	"readAllChatMessages": "Mark all messages as read",
	"settingsPersistence_title": "Persistence of Settings",
	"forceBackup": "Force a backup of settings"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"deleteAccountConfirm": "Учётная запись будет безвозвратно удалена. Подтверждаете?",
	"started": "Процесс удаления начался.",
	"other": "Другие",
	"accountInfo": "Сведения об учётной записи",
	"registeredDate": "Дата регистрации",
	"policies": "Политики",
	"rolesAssignedToMe": "Мои роли",
	"accountMigration": "Перенос учётной записи",
	"closeAccount": "Закрыть учётную запись",
	"mayTakeTime": "Удаление учётной записи — ресурсозатратный процесс. Он может занять много времени, если вы много писали и загружали файлов.",
	"sendEmail": "Когда ваша учетная запись будет удалена, мы сообщим на указанную вами электронную почту.",
	"requestAccountDelete": "Запросить удаление вашей учетной записи",
	"inProgress": "Удаление в процессе",
	"experimentalFeatures": "Экспериментальные функции",
	"developer": "Разработчик",
	"devMode": "Режим разработчика",
	"registry": "Реестр",
	"redisplayAllTips": "Показывать все \"Советы и рекомендации\" снова",
	"hideAllTips": "Скрыть все \"Советы и рекомендации\"",
	"readAllChatMessages": "Отметить прочитанным",
	"settingsPersistence_title": "Persistence of Settings",
	"forceBackup": "Force a backup of settings"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"deleteAccountConfirm": "Toto nezvrátiteľne vymaže váš účet. Pokračovať?",
	"started": "Odstraňovanie začalo.",
	"other": "Ostatní",
	"accountInfo": "Informácie o účte",
	"registeredDate": "Dátum registrácie",
	"policies": "Policies",
	"rolesAssignedToMe": "Roles assigned to me",
	"accountMigration": "Account Migration",
	"closeAccount": "Zavrieť účet",
	"mayTakeTime": "Keďže odstránenie účtu je náročný proces, môže to nejaký čas trvať. Záleží koľko obsahu ste vytvorili a koľko súborov ste nahrali.",
	"sendEmail": "Po odstránení účtu vám pošleme email na emailovú adresu zadanú pri registrácii tohoto účtu.",
	"requestAccountDelete": "Požiadať o zmazanie účtu",
	"inProgress": "Odstraňovanie prebieha",
	"experimentalFeatures": "Experimentálne funkcie",
	"developer": "Vývojár",
	"devMode": "Developer mode",
	"registry": "Register",
	"redisplayAllTips": "Show all “Tips & Tricks” again",
	"hideAllTips": "Hide all \"Tips & Tricks\"",
	"readAllChatMessages": "Mark all messages as read",
	"settingsPersistence_title": "Persistence of Settings",
	"forceBackup": "Force a backup of settings"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"deleteAccountConfirm": "บัญชีจะถูกลบ ดำเนินการต่อใช่ไหม?",
	"started": "การลบได้เริ่มต้นขึ้น",
	"other": "อื่น ๆ",
	"accountInfo": "ข้อมูลบัญชี",
	"registeredDate": "วันที่ลงทะเบียน",
	"policies": "นโยบาย",
	"rolesAssignedToMe": "บทบาทที่ได้รับมอบหมายให้ฉัน",
	"accountMigration": "โยกย้ายบัญชี",
	"closeAccount": "ปิด บัญชี",
	"mayTakeTime": "เนื่องจากการลบบัญชีนี้จะเป็นกระบวนการที่ต้องใช้ทรัพยากรมาก จึงอาจจะต้องใช้เวลาสักครู่ถึงจะเสร็จสมบูรณ์ ทั้งนี้ขึ้นอยู่กับจำนวนเนื้อหาที่คุณสร้างและจำนวนไฟล์ที่คุณอัปโหลดนะ",
	"sendEmail": "เมื่อการลบบัญชีเสร็จสิ้น การแจ้งเตือนจะถูกส่งไปยังที่อยู่อีเมลที่ลงทะเบียนไว้",
	"requestAccountDelete": "ร้องขอให้ลบบัญชี",
	"inProgress": "ปัจจุบันกำลังดำเนินการลบอยู่",
	"experimentalFeatures": "ฟังก์ชั่นทดสอบ",
	"developer": "สำหรับนักพัฒนา",
	"devMode": "โหมดนักพัฒนา",
	"registry": "ทะเบียน",
	"redisplayAllTips": "แสดงคำแนะนำและเคล็ดลับทั้งหมดอีกครั้ง",
	"hideAllTips": "ซ่อนคำแนะนำและเคล็ดลับทั้งหมด",
	"readAllChatMessages": "ทำเครื่องหมายใส่ข้อความทั้งหมดว่าอ่านแล้ว",
	"settingsPersistence_title": "คงสภาพการตั้งค่า",
	"forceBackup": "บังคับสำรองการตั้งค่า"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"deleteAccountConfirm": "Bu, hesabını geri dönüşü olmayan bir şekilde silecek. Devam etmek istiyor musun?",
	"started": "Silme işlemi başlatıldı.",
	"other": "Diğer",
	"accountInfo": "Hesap bilgileri",
	"registeredDate": "Katılma tarihi",
	"policies": "Politikalar",
	"rolesAssignedToMe": "Bana atanan roller",
	"accountMigration": "Hesap Taşıma",
	"closeAccount": "Hesabı kapat",
	"mayTakeTime": "Hesap silme işlemi kaynak yoğun bir işlem olduğundan, oluşturduğun içerik miktarına ve yüklediğin dosya sayısına bağlı olarak tamamlanması biraz zaman alabilir.",
	"sendEmail": "Hesap silme işlemi tamamlandıktan sonra, bu hesaba kayıtlı E-Posta adresine bir e-posta gönderilecek.",
	"requestAccountDelete": "Hesap silme talebi",
	"inProgress": "Silme işlemi şu anda devam ediyor.",
	"experimentalFeatures": "Deneysel özellikler",
	"developer": "Geliştirici",
	"devMode": "Geliştirici modu",
	"registry": "Kayıt Defteri",
	"redisplayAllTips": "Tüm “İpucu & Püf Nokta” tekrar göster",
	"hideAllTips": "Tüm “İpucu & Püf Nokta” gizle",
	"readAllChatMessages": "Tüm mesajları okundu olarak işaretle",
	"settingsPersistence_title": "Ayarların kalıcılığı",
	"forceBackup": "Ayarların zorunlu yedeklenmesi"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"deleteAccountConfirm": "This will irreversibly delete your account. Proceed?",
	"started": "Deletion has been started.",
	"other": "Other",
	"accountInfo": "Account Info",
	"registeredDate": "Joined on",
	"policies": "Policies",
	"rolesAssignedToMe": "Roles assigned to me",
	"accountMigration": "Account Migration",
	"closeAccount": "Close account",
	"mayTakeTime": "As account deletion is a resource-heavy process, it may take some time to complete depending on how much content you have created and how many files you have uploaded.",
	"sendEmail": "Once account deletion has been completed, an email will be sent to the email address registered to this account.",
	"requestAccountDelete": "Request account deletion",
	"inProgress": "Deletion is currently in progress",
	"experimentalFeatures": "Experimental features",
	"developer": "Developer",
	"devMode": "Developer mode",
	"registry": "Registry",
	"redisplayAllTips": "Show all “Tips & Tricks” again",
	"hideAllTips": "Hide all \"Tips & Tricks\"",
	"readAllChatMessages": "Mark all messages as read",
	"settingsPersistence_title": "Persistence of Settings",
	"forceBackup": "Force a backup of settings"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"deleteAccountConfirm": "Це незворотно видалить ваш акаунт. Продовжити?",
	"started": "Видалення розпочато.",
	"other": "Інше",
	"accountInfo": "Інформація про акаунт",
	"registeredDate": "Приєднання",
	"policies": "Policies",
	"rolesAssignedToMe": "Ролі, призначені мені",
	"accountMigration": "Міграція акаунту",
	"closeAccount": "Закрити обліковий запис",
	"mayTakeTime": "As account deletion is a resource-heavy process, it may take some time to complete depending on how much content you have created and how many files you have uploaded.",
	"sendEmail": "Once account deletion has been completed, an email will be sent to the email address registered to this account.",
	"requestAccountDelete": "Запит на видалення акаунту",
	"inProgress": "Наразі триває видалення",
	"experimentalFeatures": "Експериментальні функції",
	"developer": "Розробник",
	"devMode": "Режим розробника",
	"registry": "Реєстр",
	"redisplayAllTips": "Знову показувати всі «Поради й підказки»",
	"hideAllTips": "Приховати всі «Поради й підказки»",
	"readAllChatMessages": "Позначити всі повідомлення як прочитані",
	"settingsPersistence_title": "Збереження налаштувань",
	"forceBackup": "Примусово створити резервну копію налаштувань"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"deleteAccountConfirm": "Điều này sẽ khiến tài khoản bị xóa vĩnh viễn. Vẫn tiếp tục?",
	"started": "Đang bắt đầu xóa tài khoản.",
	"other": "Khác",
	"accountInfo": "Thông tin tài khoản",
	"registeredDate": "Tham gia",
	"policies": "Policies",
	"rolesAssignedToMe": "Vai trò được giao cho tôi",
	"accountMigration": "Chuyển tài khoản",
	"closeAccount": "Đóng tài khoản",
	"mayTakeTime": "Vì xóa tài khoản là một quá trình tốn nhiều tài nguyên nên có thể mất một khoảng thời gian để hoàn thành, tùy thuộc vào lượng nội dung bạn đã tạo và số lượng tập tin bạn đã tải lên.",
	"sendEmail": "Sau khi hoàn tất việc xóa tài khoản, một email sẽ được gửi đến địa chỉ email đã đăng ký tài khoản này.",
	"requestAccountDelete": "Yêu cầu xóa tài khoản",
	"inProgress": "Đang xóa dần tài khoản.",
	"experimentalFeatures": "Tính năng thử nghiệm",
	"developer": "Nhà phát triển",
	"devMode": "Chế độ dành cho nhà phát triển",
	"registry": "Registry",
	"redisplayAllTips": "Show all “Tips & Tricks” again",
	"hideAllTips": "Hide all \"Tips & Tricks\"",
	"readAllChatMessages": "Mark all messages as read",
	"settingsPersistence_title": "Persistence of Settings",
	"forceBackup": "Force a backup of settings"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"deleteAccountConfirm": "将要删除账户。是否确认？",
	"started": "账户删除过程已开始。",
	"other": "其他",
	"accountInfo": "账户信息",
	"registeredDate": "注册于",
	"policies": "策略",
	"rolesAssignedToMe": "我的角色",
	"accountMigration": "账户迁移",
	"closeAccount": "永久注销账户",
	"mayTakeTime": "删除账号是一个性能损耗较大的处理，如果账号持有的内容数量和上传的文件数量较多的话，完成需要花费一段时间。",
	"sendEmail": "账户删除完成后，将向注册的电子邮件地址发送通知。",
	"requestAccountDelete": "请求删除账户",
	"inProgress": "正在删除",
	"experimentalFeatures": "实验性功能",
	"developer": "开发者",
	"devMode": "开发者模式",
	"registry": "注册表",
	"redisplayAllTips": "重新显示所有 “提示和技巧”",
	"hideAllTips": "隐藏所有的 “提示与技巧”",
	"readAllChatMessages": "将所有消息标记为已读",
	"settingsPersistence_title": "设置持久化",
	"forceBackup": "强制备份设置"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"deleteAccountConfirm": "將要刪除帳戶。是否確定？",
	"started": "已開始刪除作業。",
	"other": "其他",
	"accountInfo": "帳戶資訊",
	"registeredDate": "註冊日期",
	"policies": "政策",
	"rolesAssignedToMe": "指派給自己的角色",
	"accountMigration": "遷移帳戶",
	"closeAccount": "刪除帳戶",
	"mayTakeTime": "刪除帳戶的處理負荷較大，如果帳戶發佈的內容以及上傳的檔案數量較多，則需要一段時間才能完成。",
	"sendEmail": "帳戶刪除完成後，將向其電子郵件地址發送通知。",
	"requestAccountDelete": "請求刪除帳戶",
	"inProgress": "正在刪除",
	"experimentalFeatures": "實驗中的功能",
	"developer": "開發者",
	"devMode": "開發者模式",
	"registry": "登錄表",
	"redisplayAllTips": "重新顯示所有「提示與技巧」",
	"hideAllTips": "隱藏所有「提示與技巧」",
	"readAllChatMessages": "將所有訊息標記為已讀",
	"settingsPersistence_title": "設定的持久化",
	"forceBackup": "強制備份設定"
}
</locale>
