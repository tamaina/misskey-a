<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:width="400"
	:height="490"
	:withOkButton="false"
	:okButtonDisabled="false"
	@close="onCancelClicked"
	@closed="emit('closed')"
>
	<template #header>
		{{ mode === 'create' ? $locale.sfc.abuseReportNotificationRecipientCreateRecipient : $locale.sfc.abuseReportNotificationRecipientModifyRecipient }}
	</template>
	<div v-if="loading === 0" style="display: flex; flex-direction: column; min-height: 100%;">
		<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px; flex-grow: 1;">
			<div :class="$style.root" class="_gaps_m">
				<MkInput v-model="title">
					<template #label>{{ $locale.sfc.title }}</template>
				</MkInput>
				<MkSelect v-model="method" :items="methodDef">
					<template #label>{{ $locale.sfc.abuseReportNotificationRecipientRecipientType }}</template>
					<template #caption>
						{{ methodCaption }}
					</template>
				</MkSelect>
				<div>
					<MkSelect v-if="method === 'email'" v-model="userId" :items="userIdDef">
						<template #label>{{ $locale.sfc.abuseReportNotificationRecipientNotifiedUser }}</template>
					</MkSelect>
					<div v-else-if="method === 'webhook'" :class="$style.systemWebhook">
						<MkSelect v-model="systemWebhookId" :items="systemWebhookIdDef" style="flex: 1">
							<template #label>{{ $locale.sfc.abuseReportNotificationRecipientNotifiedWebhook }}</template>
						</MkSelect>
						<MkButton rounded :class="$style.systemWebhookEditButton" @click="onEditSystemWebhookClicked">
							<span v-if="systemWebhookId === null" class="ti ti-plus" style="line-height: normal"></span>
							<span v-else class="ti ti-settings" style="line-height: normal"></span>
						</MkButton>
					</div>
				</div>

				<MkDivider/>

				<MkSwitch v-model="isActive">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</div>
		</div>

		<div :class="$style.footer" class="_buttonsCenter">
			<MkButton primary rounded :disabled="disableSubmitButton" @click="onSubmitClicked"><i class="ti ti-check"></i> {{ $locale.sfc.ok }}</MkButton>
			<MkButton rounded @click="onCancelClicked"><i class="ti ti-x"></i> {{ $locale.sfc.cancel }}</MkButton>
		</div>
	</div>
	<div v-else>
		<MkLoading/>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, useTemplateRef, toRefs } from 'vue';
import { entities } from 'misskey-js';
import type { MkSystemWebhookResult } from '@features/integrations/frontend/components/MkSystemWebhookEditor.impl.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import { showSystemWebhookEditorDialog } from '@features/integrations/frontend/components/MkSystemWebhookEditor.impl.js';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkDivider from '@features/ui/frontend/components/MkDivider.vue';
import * as os from '@features/ui/frontend/os.js';

const emit = defineEmits<{
	(ev: 'submitted'): void;
	(ev: 'canceled'): void;
	(ev: 'closed'): void;
}>();

const props = defineProps<{
	mode: 'create' | 'edit';
	id?: string;
}>();

const { mode, id } = toRefs(props);

const dialogEl = useTemplateRef('dialogEl');

const loading = ref<number>(0);

const title = ref<string>('');
const {
	model: method,
	def: methodDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.abuseReportNotificationRecipientRecipientTypeMail, value: 'email' },
		{ label: $locale.value.sfc.abuseReportNotificationRecipientRecipientTypeWebhook, value: 'webhook' },
	],
	initialValue: 'email',
});
const {
	model: userId,
	def: userIdDef,
} = useMkSelect({
	items: computed(() => moderators.value.map(u => ({ label: u.name ? `${u.name}(${u.username})` : u.username, value: u.id as string | null }))),
});
const {
	model: systemWebhookId,
	def: systemWebhookIdDef,
} = useMkSelect({
	items: computed(() => systemWebhooks.value.map(w => ({ label: w.name, value: w.id }))),
});
const isActive = ref<boolean>(true);

const moderators = ref<entities.User[]>([]);
const systemWebhooks = ref<(entities.SystemWebhook | { id: null, name: string })[]>([]);

const methodCaption = computed(() => {
	switch (method.value) {
		case 'email': {
			return $locale.value.sfc.abuseReportNotificationRecipientRecipientTypeCaptionsMail;
		}
		case 'webhook': {
			return $locale.value.sfc.abuseReportNotificationRecipientRecipientTypeCaptionsWebhook;
		}
		default: {
			return '';
		}
	}
});

const disableSubmitButton = computed(() => {
	if (!title.value) {
		return true;
	}

	switch (method.value) {
		case 'email': {
			return userId.value === null;
		}
		case 'webhook': {
			return systemWebhookId.value === null;
		}
		default: {
			return true;
		}
	}
});

async function onSubmitClicked() {
	await loadingScope(async () => {
		const _userId = (method.value === 'email') ? userId.value : null;
		const _systemWebhookId = (method.value === 'webhook') ? systemWebhookId.value : null;
		const params = {
			isActive: isActive.value,
			name: title.value,
			method: method.value,
			userId: _userId ?? undefined,
			systemWebhookId: _systemWebhookId ?? undefined,
		};

		try {
			switch (mode.value) {
				case 'create': {
					await misskeyApi('admin/abuse-report/notification-recipient/create', params);
					break;
				}
				case 'edit': {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					await misskeyApi('admin/abuse-report/notification-recipient/update', { id: id.value!, ...params });
					break;
				}
			}

			dialogEl.value?.close();
			emit('submitted');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (ex: any) {
			const msg = ex.message ?? $locale.value.sfc.internalServerErrorDescription;
			await os.alert({ type: 'error', title: $locale.value.sfc.error, text: msg });
			dialogEl.value?.close();
			emit('canceled');
		}
	});
}

function onCancelClicked() {
	dialogEl.value?.close();
	emit('canceled');
}

async function onEditSystemWebhookClicked() {
	let result: MkSystemWebhookResult | null;
	if (systemWebhookId.value === null) {
		result = await showSystemWebhookEditorDialog({
			mode: 'create',
		});
	} else {
		result = await showSystemWebhookEditorDialog({
			mode: 'edit',
			id: systemWebhookId.value,
		});
	}
	if (!result) {
		return;
	}

	await fetchSystemWebhooks();
	systemWebhookId.value = result.id ?? null;
}

async function fetchSystemWebhooks() {
	await loadingScope(async () => {
		systemWebhooks.value = [
			{ id: null, name: $locale.value.sfc.createNew },
			...await misskeyApi('admin/system-webhook/list', { }),
		];
	});
}

async function fetchModerators() {
	await loadingScope(async () => {
		const users = Array.of<entities.User>();
		for (; ;) {
			const res = await misskeyApi('admin/show-users', {
				limit: 100,
				state: 'adminOrModerator',
				origin: 'local',
				offset: users.length,
			});

			if (res.length === 0) {
				break;
			}

			users.push(...res);
		}

		moderators.value = users;
	});
}

async function loadingScope<T>(fn: () => Promise<T>): Promise<T> {
	loading.value++;
	try {
		return await fn();
	} finally {
		loading.value--;
	}
}

onMounted(async () => {
	await loadingScope(async () => {
		await fetchModerators();
		await fetchSystemWebhooks();

		if (mode.value === 'edit') {
			if (!id.value) {
				throw new Error('id is required');
			}

			try {
				const res = await misskeyApi('admin/abuse-report/notification-recipient/show', { id: id.value });

				title.value = res.name;
				method.value = res.method;
				userId.value = res.userId ?? null;
				systemWebhookId.value = res.systemWebhookId ?? null;
				isActive.value = res.isActive;
				// eslint-disable-next-line
			} catch (ex: any) {
				const msg = ex.message ?? $locale.value.sfc.internalServerErrorDescription;
				await os.alert({ type: 'error', title: $locale.value.sfc.error, text: msg });
				dialogEl.value?.close();
				emit('canceled');
			}
		} else {
			userId.value = moderators.value[0]?.id ?? null;
			systemWebhookId.value = systemWebhooks.value[0]?.id ?? null;
		}
	});
});

</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: stretch;
}

.footer {
	position: sticky;
	z-index: 10000;
	bottom: 0;
	left: 0;
	padding: 12px;
	border-top: solid 0.5px var(--MI_THEME-divider);
	background: color(from var(--MI_THEME-bg) srgb r g b / 0.5);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
}

.systemWebhook {
	display: flex;
	flex-direction: row;
	justify-content: stretch;
	align-items: flex-end;
	gap: 8px;
}

.systemWebhookEditButton {
	min-width: 0;
	min-height: 0;
	width: 34px;
	height: 34px;
	flex-shrink: 0;
	box-sizing: border-box;
	margin: 1px 0;
	padding: 6px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"abuseReportNotificationRecipientCreateRecipient": "Add recipient for reports",
	"abuseReportNotificationRecipientModifyRecipient": "Edit a recipient for reports",
	"title": "العنوان",
	"abuseReportNotificationRecipientRecipientType": "Notification type",
	"abuseReportNotificationRecipientNotifiedUser": "Users to notify",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook to use",
	"enable": "تشغيل",
	"ok": " حسناً",
	"cancel": " إلغاء",
	"abuseReportNotificationRecipientRecipientTypeMail": "البريد الإلكتروني ",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Send the email to moderators' email addresses when you receive reports.",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Send a notification to System Webhook when you receive or resolve reports.",
	"internalServerErrorDescription": "واجه الخادم خطأ غي متوقع.",
	"error": "خطأ",
	"createNew": "أنشِئ جديد"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"abuseReportNotificationRecipientCreateRecipient": "Afegeix un destinatari a l'informe de moderació ",
	"abuseReportNotificationRecipientModifyRecipient": "Editar un destinatari en l'informe de moderació ",
	"title": "Títol",
	"abuseReportNotificationRecipientRecipientType": "Tipus de notificació ",
	"abuseReportNotificationRecipientNotifiedUser": "Usuaris que s'han de notificar ",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook que s'ha de fer servir",
	"enable": "Habilita",
	"ok": "OK",
	"cancel": "Cancel·lar",
	"abuseReportNotificationRecipientRecipientTypeMail": "Correu electrònic",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Enviar un correu electrònic a tots els moderadors quan es rep un informe de moderació ",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Enviar una notificació al SystemWebhook quan es rebi o es resolgui un informe de moderació ",
	"internalServerErrorDescription": "El servidor ha fallat de manera inexplicable.",
	"error": "Error",
	"createNew": "Crear"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"abuseReportNotificationRecipientCreateRecipient": "Add recipient for reports",
	"abuseReportNotificationRecipientModifyRecipient": "Edit a recipient for reports",
	"title": "Titulek",
	"abuseReportNotificationRecipientRecipientType": "Notification type",
	"abuseReportNotificationRecipientNotifiedUser": "Users to notify",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook to use",
	"enable": "Povolit",
	"ok": "Potvrdit",
	"cancel": "Zrušit",
	"abuseReportNotificationRecipientRecipientTypeMail": "Email",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Send the email to moderators' email addresses when you receive reports.",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Send a notification to System Webhook when you receive or resolve reports.",
	"internalServerErrorDescription": "Server narazil na neočekávanou chybu.",
	"error": "Chyba",
	"createNew": "Vytvořit nový"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"abuseReportNotificationRecipientCreateRecipient": "Add recipient for reports",
	"abuseReportNotificationRecipientModifyRecipient": "Edit a recipient for reports",
	"title": "Title",
	"abuseReportNotificationRecipientRecipientType": "Notification type",
	"abuseReportNotificationRecipientNotifiedUser": "Users to notify",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook to use",
	"enable": "Enable",
	"ok": "OK",
	"cancel": "Cancel",
	"abuseReportNotificationRecipientRecipientTypeMail": "Email",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Send the email to moderators' email addresses when you receive reports.",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Send a notification to System Webhook when you receive or resolve reports.",
	"internalServerErrorDescription": "The server has run into an unexpected error.",
	"error": "Error",
	"createNew": "Create new"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"abuseReportNotificationRecipientCreateRecipient": "Meldungsempfänger hinzufügen",
	"abuseReportNotificationRecipientModifyRecipient": "Bearbeite einen Empfänger für Meldungen",
	"title": "Titel",
	"abuseReportNotificationRecipientRecipientType": "Art der Benachrichtigung",
	"abuseReportNotificationRecipientNotifiedUser": "Zu benachrichtigender Benutzer",
	"abuseReportNotificationRecipientNotifiedWebhook": "Zu verwendender Webhook",
	"enable": "Aktivieren",
	"ok": "OK",
	"cancel": "Abbrechen",
	"abuseReportNotificationRecipientRecipientTypeMail": "Email",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Die Benachrichtigung wird bei Eingang einer Meldung an die E-Mail-Adressen der Moderatoren gesendet",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Sendet eine Benachrichtigung an den System Webhook, wenn eine Meldung eingegangen ist oder gelöst wurde",
	"internalServerErrorDescription": "Im Server ist ein unerwarteter Fehler aufgetreten.",
	"error": "Fehler",
	"createNew": "Neu erstellen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"abuseReportNotificationRecipientCreateRecipient": "Add recipient for reports",
	"abuseReportNotificationRecipientModifyRecipient": "Edit a recipient for reports",
	"title": "Title",
	"abuseReportNotificationRecipientRecipientType": "Notification type",
	"abuseReportNotificationRecipientNotifiedUser": "Users to notify",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook to use",
	"enable": "Enable",
	"ok": "OK",
	"cancel": "Cancel",
	"abuseReportNotificationRecipientRecipientTypeMail": "Email",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Send the email to moderators' email addresses when you receive reports.",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Send a notification to System Webhook when you receive or resolve reports.",
	"internalServerErrorDescription": "The server has run into an unexpected error.",
	"error": "Error",
	"createNew": "Create new"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"abuseReportNotificationRecipientCreateRecipient": "Añadir destinatario a los informes",
	"abuseReportNotificationRecipientModifyRecipient": "Editar un destinatario en el informe de moderación\n",
	"title": "Título",
	"abuseReportNotificationRecipientRecipientType": "Tipo de notificación",
	"abuseReportNotificationRecipientNotifiedUser": "Usuarios a notificar",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook a utilizar",
	"enable": "Activar",
	"ok": "OK",
	"cancel": "Cancelar",
	"abuseReportNotificationRecipientRecipientTypeMail": "Correo",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Enviar un correo electrónico a todos los moderadores cuando reciban un informe de moderación",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Enviar una notificación al SystemWebhook cuando se reciba o se resuelva un informe de moderación",
	"internalServerErrorDescription": "El servidor tuvo un error inesperado.",
	"error": "Error",
	"createNew": "Crear Nuevo"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"abuseReportNotificationRecipientCreateRecipient": "Add recipient for reports",
	"abuseReportNotificationRecipientModifyRecipient": "Edit a recipient for reports",
	"title": "Titre",
	"abuseReportNotificationRecipientRecipientType": "Notification type",
	"abuseReportNotificationRecipientNotifiedUser": "Users to notify",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook to use",
	"enable": "Activer",
	"ok": "OK",
	"cancel": "Annuler",
	"abuseReportNotificationRecipientRecipientTypeMail": "E-mail ",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Send the email to moderators' email addresses when you receive reports.",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Send a notification to System Webhook when you receive or resolve reports.",
	"internalServerErrorDescription": "Une erreur inattendue s'est produite sur le serveur.",
	"error": "Erreur",
	"createNew": "Créer"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"abuseReportNotificationRecipientCreateRecipient": "Tambah penerima laporan",
	"abuseReportNotificationRecipientModifyRecipient": "Edit a recipient for reports",
	"title": "Judul",
	"abuseReportNotificationRecipientRecipientType": "Notification type",
	"abuseReportNotificationRecipientNotifiedUser": "Users to notify",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook to use",
	"enable": "Aktifkan",
	"ok": "Oke",
	"cancel": "Batalkan",
	"abuseReportNotificationRecipientRecipientTypeMail": "Surel",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Send the email to moderators' email addresses when you receive reports.",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Send a notification to System Webhook when you receive or resolve reports.",
	"internalServerErrorDescription": "Peladen sedang mengalami galat tak terduga",
	"error": "Galat",
	"createNew": "Buat baru"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"abuseReportNotificationRecipientCreateRecipient": "Aggiungi destinatario della segnalazione",
	"abuseReportNotificationRecipientModifyRecipient": "Modifica destinatario della segnalazione",
	"title": "Titolo",
	"abuseReportNotificationRecipientRecipientType": "Tipo di notifica",
	"abuseReportNotificationRecipientNotifiedUser": "Profili da notificare",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook da usare",
	"enable": "Abilita",
	"ok": "OK",
	"cancel": "Annulla",
	"abuseReportNotificationRecipientRecipientTypeMail": "Email",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Quando ricevi un abuso, notifica l'amministrazione via email",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Spedire una notifica al SystemWebhook specificato (sia quando si riceve una segnalazione, che quando viene risolta)",
	"internalServerErrorDescription": "Si è verificato un errore imprevisto all'interno del server",
	"error": "Errore",
	"createNew": "Crea"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"abuseReportNotificationRecipientCreateRecipient": "通報の通知先を追加",
	"abuseReportNotificationRecipientModifyRecipient": "通報の通知先を編集",
	"title": "タイトル",
	"abuseReportNotificationRecipientRecipientType": "通知先の種類",
	"abuseReportNotificationRecipientNotifiedUser": "通知先ユーザー",
	"abuseReportNotificationRecipientNotifiedWebhook": "使用するWebhook",
	"enable": "有効にする",
	"ok": "OK",
	"cancel": "キャンセル",
	"abuseReportNotificationRecipientRecipientTypeMail": "メール",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "モデレーター権限を持つユーザーのメールアドレスに通知を送ります(通報を受けた時のみ)",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "指定したSystemWebhookに通知を送ります(通報を受けた時と通報を解決した時にそれぞれ発信)",
	"internalServerErrorDescription": "サーバー内部で予期しないエラーが発生しました。",
	"error": "エラー",
	"createNew": "新規作成"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"abuseReportNotificationRecipientCreateRecipient": "通報の通知先を追加",
	"abuseReportNotificationRecipientModifyRecipient": "通報の通知先を編集",
	"title": "タイトル",
	"abuseReportNotificationRecipientRecipientType": "通知先の種類",
	"abuseReportNotificationRecipientNotifiedUser": "通知先ユーザー",
	"abuseReportNotificationRecipientNotifiedWebhook": "使用するWebhook",
	"enable": "有効にするで",
	"ok": "ええで",
	"cancel": "やめる",
	"abuseReportNotificationRecipientRecipientTypeMail": "メール",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "モデレーター権限を持つユーザーのメアドに通知を送るで(通報を受けた時のみ)",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "指定したSystemWebhookに通知を送るで(通報を受けた時と通報を解決した時にそれぞれ発信)",
	"internalServerErrorDescription": "サーバーでなんか変なこと起こっとるわ。",
	"error": "おかしなったで",
	"createNew": "新しく作るで"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"abuseReportNotificationRecipientCreateRecipient": "Add recipient for reports",
	"abuseReportNotificationRecipientModifyRecipient": "Edit a recipient for reports",
	"title": "Title",
	"abuseReportNotificationRecipientRecipientType": "Notification type",
	"abuseReportNotificationRecipientNotifiedUser": "Users to notify",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook to use",
	"enable": "Enable",
	"ok": "IH",
	"cancel": "Cancel",
	"abuseReportNotificationRecipientRecipientTypeMail": "Imayl",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Send the email to moderators' email addresses when you receive reports.",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Send a notification to System Webhook when you receive or resolve reports.",
	"internalServerErrorDescription": "The server has run into an unexpected error.",
	"error": "Error",
	"createNew": "Create new"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"abuseReportNotificationRecipientCreateRecipient": "Add recipient for reports",
	"abuseReportNotificationRecipientModifyRecipient": "Edit a recipient for reports",
	"title": "Title",
	"abuseReportNotificationRecipientRecipientType": "Notification type",
	"abuseReportNotificationRecipientNotifiedUser": "Users to notify",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook to use",
	"enable": "Enable",
	"ok": "ಸರಿ",
	"cancel": "ರದ್ದು",
	"abuseReportNotificationRecipientRecipientTypeMail": "Email",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Send the email to moderators' email addresses when you receive reports.",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Send a notification to System Webhook when you receive or resolve reports.",
	"internalServerErrorDescription": "The server has run into an unexpected error.",
	"error": "Error",
	"createNew": "Create new"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"abuseReportNotificationRecipientCreateRecipient": "신고 수신자 추가",
	"abuseReportNotificationRecipientModifyRecipient": "신고 수신자 편집",
	"title": "제목",
	"abuseReportNotificationRecipientRecipientType": "알림 종류",
	"abuseReportNotificationRecipientNotifiedUser": "알릴 유저",
	"abuseReportNotificationRecipientNotifiedWebhook": "사용할 Webhook",
	"enable": "사용",
	"ok": "확인",
	"cancel": "취소",
	"abuseReportNotificationRecipientRecipientTypeMail": "이메일",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "모더레이터 권한을 가진 유저의 이메일 주소에 알림을 보냅니다 (신고를 받은 때에만)",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "지정한 SystemWebhook에 알림을 보냅니다 (신고를 받은 때와 해결했을 때에 송신)",
	"internalServerErrorDescription": "내부 서버에서 예기치 않은 오류가 발생했습니다.",
	"error": "오류",
	"createNew": "새로 만들기"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"abuseReportNotificationRecipientCreateRecipient": "Add recipient for reports",
	"abuseReportNotificationRecipientModifyRecipient": "Edit a recipient for reports",
	"title": "Titel",
	"abuseReportNotificationRecipientRecipientType": "Notification type",
	"abuseReportNotificationRecipientNotifiedUser": "Users to notify",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook to use",
	"enable": "Inschakelen",
	"ok": "Ok",
	"cancel": "Annuleren",
	"abuseReportNotificationRecipientRecipientTypeMail": "Email",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Send the email to moderators' email addresses when you receive reports.",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Send a notification to System Webhook when you receive or resolve reports.",
	"internalServerErrorDescription": "The server has run into an unexpected error.",
	"error": "Fout",
	"createNew": "Nieuwe aanmaken"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"abuseReportNotificationRecipientCreateRecipient": "Add recipient for reports",
	"abuseReportNotificationRecipientModifyRecipient": "Edit a recipient for reports",
	"title": "Tittel",
	"abuseReportNotificationRecipientRecipientType": "Notification type",
	"abuseReportNotificationRecipientNotifiedUser": "Users to notify",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook to use",
	"enable": "Enable",
	"ok": "OK",
	"cancel": "Avbryt",
	"abuseReportNotificationRecipientRecipientTypeMail": "E-post",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Send the email to moderators' email addresses when you receive reports.",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Send a notification to System Webhook when you receive or resolve reports.",
	"internalServerErrorDescription": "The server has run into an unexpected error.",
	"error": "Feil",
	"createNew": "Create new"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"abuseReportNotificationRecipientCreateRecipient": "Add recipient for reports",
	"abuseReportNotificationRecipientModifyRecipient": "Edit a recipient for reports",
	"title": "Tytuł",
	"abuseReportNotificationRecipientRecipientType": "Notification type",
	"abuseReportNotificationRecipientNotifiedUser": "Users to notify",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook to use",
	"enable": "Włącz",
	"ok": "OK",
	"cancel": "Anuluj",
	"abuseReportNotificationRecipientRecipientTypeMail": "Adres e-mail",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Send the email to moderators' email addresses when you receive reports.",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Send a notification to System Webhook when you receive or resolve reports.",
	"internalServerErrorDescription": "Niespodziewany błąd po stronie serwera",
	"error": "Błąd",
	"createNew": "Utwórz nowy"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"abuseReportNotificationRecipientCreateRecipient": "Adicionar destinatário para relatórios de abuso",
	"abuseReportNotificationRecipientModifyRecipient": "Editar destinatários para relatórios de abuso",
	"title": "Título",
	"abuseReportNotificationRecipientRecipientType": "TIpo de notificação",
	"abuseReportNotificationRecipientNotifiedUser": "Usuários para notificar",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook usado",
	"enable": "Habilitar",
	"ok": "OK",
	"cancel": "Cancelar",
	"abuseReportNotificationRecipientRecipientTypeMail": "E-mail",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Enviar o email aos endereços dos moderadores ao receber relatório de abuso.",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Enviar uma notificação ao SystemWebhook quando você receber um resolver um relatório de abuso.",
	"internalServerErrorDescription": "Houve um erro inesperado no servidor.",
	"error": "Erro",
	"createNew": "Criar novo"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"abuseReportNotificationRecipientCreateRecipient": "Add recipient for reports",
	"abuseReportNotificationRecipientModifyRecipient": "Edit a recipient for reports",
	"title": "Заголовок",
	"abuseReportNotificationRecipientRecipientType": "Notification type",
	"abuseReportNotificationRecipientNotifiedUser": "Users to notify",
	"abuseReportNotificationRecipientNotifiedWebhook": "Используемый Вебхук",
	"enable": "Включить",
	"ok": "Подтвердить",
	"cancel": "Отмена",
	"abuseReportNotificationRecipientRecipientTypeMail": "Электронная почта",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Вебхук",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Уведомлять модераторов по почте (только при поступлении жалоб)",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Отправить уведомление Системному Вебхуку при получении или разрешении жалоб.",
	"internalServerErrorDescription": "Внутри сервера произошла непредвиденная ошибка.",
	"error": "Ошибка",
	"createNew": "Новый документ"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"abuseReportNotificationRecipientCreateRecipient": "Add recipient for reports",
	"abuseReportNotificationRecipientModifyRecipient": "Edit a recipient for reports",
	"title": "Nadpis",
	"abuseReportNotificationRecipientRecipientType": "Notification type",
	"abuseReportNotificationRecipientNotifiedUser": "Users to notify",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook to use",
	"enable": "Povoliť",
	"ok": "OK",
	"cancel": "Zrušiť",
	"abuseReportNotificationRecipientRecipientTypeMail": "Email",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Send the email to moderators' email addresses when you receive reports.",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Send a notification to System Webhook when you receive or resolve reports.",
	"internalServerErrorDescription": "The server has run into an unexpected error.",
	"error": "Chyba",
	"createNew": "Vytvoriť nový"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"abuseReportNotificationRecipientCreateRecipient": "เพิ่มปลายทางการแจ้งเตือนการรายงาน",
	"abuseReportNotificationRecipientModifyRecipient": "แก้ไขปลายทางการแจ้งเตือนการรายงาน",
	"title": "หัวข้อ",
	"abuseReportNotificationRecipientRecipientType": "ประเภทของปลายทางการแจ้งเตือน\n",
	"abuseReportNotificationRecipientNotifiedUser": "ผู้ใช้ที่ได้รับการแจ้งเตือน",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook ที่ใช้",
	"enable": "เปิดใช้งาน",
	"ok": "ตกลง",
	"cancel": "ยกเลิก",
	"abuseReportNotificationRecipientRecipientTypeMail": "อีเมล",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "ส่งการแจ้งเตือนไปยังที่อยู่อีเมลของผู้ควบคุม (เฉพาะเมื่อได้รับการรายงาน)",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "ส่งการแจ้งเตือนไปยัง SystemWebhook ที่กำหนด (จะส่งเมื่อได้รับการรายงานและเมื่อการรายงานได้รับการแก้ไข)",
	"internalServerErrorDescription": "เกิดข้อผิดพลาดที่ไม่คาดคิดภายในเซิร์ฟเวอร์",
	"error": "ผิดพลาด!",
	"createNew": "สร้างใหม่"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"abuseReportNotificationRecipientCreateRecipient": "Raporlar için alıcı ekle",
	"abuseReportNotificationRecipientModifyRecipient": "Raporlar için alıcıyı düzenle",
	"title": "Başlık",
	"abuseReportNotificationRecipientRecipientType": "Bildirim türü",
	"abuseReportNotificationRecipientNotifiedUser": "Bildirilecek kullanıcılar",
	"abuseReportNotificationRecipientNotifiedWebhook": "Kullanılacak webhook",
	"enable": "Etkin",
	"ok": "Tamam",
	"cancel": "Vazgeç",
	"abuseReportNotificationRecipientRecipientTypeMail": "E-Posta",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Raporları aldığınızda, E-Postayı moderatörlerin e-posta adreslerine gönderin.",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Raporları aldığınızda veya çözdüğünüzde Sistem Webhook'una bir bildirim gönderin.",
	"internalServerErrorDescription": "Sunucu beklenmedik bir hatayla karşılaştı.",
	"error": "Hata",
	"createNew": "Yeni oluştur"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"abuseReportNotificationRecipientCreateRecipient": "Add recipient for reports",
	"abuseReportNotificationRecipientModifyRecipient": "Edit a recipient for reports",
	"title": "Title",
	"abuseReportNotificationRecipientRecipientType": "Notification type",
	"abuseReportNotificationRecipientNotifiedUser": "Users to notify",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook to use",
	"enable": "Enable",
	"ok": "ماقۇل",
	"cancel": "Cancel",
	"abuseReportNotificationRecipientRecipientTypeMail": "Email",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Send the email to moderators' email addresses when you receive reports.",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Send a notification to System Webhook when you receive or resolve reports.",
	"internalServerErrorDescription": "The server has run into an unexpected error.",
	"error": "Error",
	"createNew": "Create new"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"abuseReportNotificationRecipientCreateRecipient": "Add recipient for reports",
	"abuseReportNotificationRecipientModifyRecipient": "Edit a recipient for reports",
	"title": "Тема",
	"abuseReportNotificationRecipientRecipientType": "Notification type",
	"abuseReportNotificationRecipientNotifiedUser": "Users to notify",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook to use",
	"enable": "Увімкнути",
	"ok": "OK",
	"cancel": "Скасувати",
	"abuseReportNotificationRecipientRecipientTypeMail": "E-mail",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Send the email to moderators' email addresses when you receive reports.",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Send a notification to System Webhook when you receive or resolve reports.",
	"internalServerErrorDescription": "На сервері сталася неочікувана помилка.",
	"error": "Помилка",
	"createNew": "Створити новий"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"abuseReportNotificationRecipientCreateRecipient": "Add recipient for reports",
	"abuseReportNotificationRecipientModifyRecipient": "Edit a recipient for reports",
	"title": "Tựa đề",
	"abuseReportNotificationRecipientRecipientType": "Notification type",
	"abuseReportNotificationRecipientNotifiedUser": "Users to notify",
	"abuseReportNotificationRecipientNotifiedWebhook": "Webhook to use",
	"enable": "Bật",
	"ok": "Đồng ý",
	"cancel": "Hủy",
	"abuseReportNotificationRecipientRecipientTypeMail": "Email",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "Send the email to moderators' email addresses when you receive reports.",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "Send a notification to System Webhook when you receive or resolve reports.",
	"internalServerErrorDescription": "Trong chủ máy lỗi bất ngờ xảy ra",
	"error": "Lỗi",
	"createNew": "Tạo mới"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"abuseReportNotificationRecipientCreateRecipient": "新建举报通知",
	"abuseReportNotificationRecipientModifyRecipient": "编辑举报通知",
	"title": "标题",
	"abuseReportNotificationRecipientRecipientType": "通知类型",
	"abuseReportNotificationRecipientNotifiedUser": "通知的用户",
	"abuseReportNotificationRecipientNotifiedWebhook": "使用的 webhook",
	"enable": "启用",
	"ok": "OK",
	"cancel": "取消",
	"abuseReportNotificationRecipientRecipientTypeMail": "邮箱",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "当收到新举报时，向持有监察员权限的用户发送通知邮件",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "当收到新举报及举报被处理时，使用指定的 SystemWebhook 发送通知",
	"internalServerErrorDescription": "内部服务器发生了预期外的错误",
	"error": "错误",
	"createNew": "新建"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"abuseReportNotificationRecipientCreateRecipient": "新增接收檢舉的通知對象",
	"abuseReportNotificationRecipientModifyRecipient": "編輯接收檢舉的通知對象",
	"title": "標題",
	"abuseReportNotificationRecipientRecipientType": "通知對象的種類",
	"abuseReportNotificationRecipientNotifiedUser": "通知的使用者",
	"abuseReportNotificationRecipientNotifiedWebhook": "使用的 Webhook",
	"enable": "啟用",
	"ok": "OK",
	"cancel": "取消",
	"abuseReportNotificationRecipientRecipientTypeMail": "電子郵件",
	"abuseReportNotificationRecipientRecipientTypeWebhook": "Webhook",
	"abuseReportNotificationRecipientRecipientTypeCaptionsMail": "寄送到擁有監察員權限的使用者電子郵件地址（僅在收到檢舉時）",
	"abuseReportNotificationRecipientRecipientTypeCaptionsWebhook": "向指定的 SystemWebhook 發送通知（在收到檢舉和解決檢舉時發送）",
	"internalServerErrorDescription": "內部伺服器出現意外錯誤。",
	"error": "錯誤",
	"createNew": "新建"
}
</locale>
