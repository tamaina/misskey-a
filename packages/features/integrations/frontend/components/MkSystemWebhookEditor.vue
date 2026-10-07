<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:width="450"
	:height="590"
	:canClose="true"
	:withOkButton="false"
	:okButtonDisabled="false"
	@click="onCancelClicked"
	@close="onCancelClicked"
	@closed="emit('closed')"
>
	<template #header>
		{{ mode === 'create' ? $locale.sfc.createWebhook : $locale.sfc.modifyWebhook }}
	</template>

	<div style="display: flex; flex-direction: column; min-height: 100%;">
		<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px; flex-grow: 1;">
			<MkLoading v-if="loading !== 0"/>
			<div v-else :class="$style.root" class="_gaps_m">
				<MkInput v-model="title">
					<template #label>{{ $locale.sfc.name }}</template>
				</MkInput>
				<MkInput v-model="url">
					<template #label>URL</template>
				</MkInput>
				<MkInput v-model="secret">
					<template #label>{{ $locale.sfc.secret }}</template>
				</MkInput>
				<MkFolder :defaultOpen="true">
					<template #label>{{ $locale.sfc.trigger }}</template>

					<div class="_gaps">
						<div class="_gaps_s">
							<div :class="$style.switchBox">
								<MkSwitch v-model="events.abuseReport" :disabled="disabledEvents.abuseReport">
									<template #label>{{ $locale.sfc.abuseReport }}</template>
								</MkSwitch>
								<MkButton v-show="mode === 'edit'" transparent :class="$style.testButton" :disabled="!(isActive && events.abuseReport)" @click="test('abuseReport')"><i class="ti ti-send"></i></MkButton>
							</div>
							<div :class="$style.switchBox">
								<MkSwitch v-model="events.abuseReportResolved" :disabled="disabledEvents.abuseReportResolved">
									<template #label>{{ $locale.sfc.abuseReportResolved }}</template>
								</MkSwitch>
								<MkButton v-show="mode === 'edit'" transparent :class="$style.testButton" :disabled="!(isActive && events.abuseReportResolved)" @click="test('abuseReportResolved')"><i class="ti ti-send"></i></MkButton>
							</div>
							<div :class="$style.switchBox">
								<MkSwitch v-model="events.userCreated" :disabled="disabledEvents.userCreated">
									<template #label>{{ $locale.sfc.userCreated }}</template>
								</MkSwitch>
								<MkButton v-show="mode === 'edit'" transparent :class="$style.testButton" :disabled="!(isActive && events.userCreated)" @click="test('userCreated')"><i class="ti ti-send"></i></MkButton>
							</div>
							<div :class="$style.switchBox">
								<MkSwitch v-model="events.inactiveModeratorsWarning" :disabled="disabledEvents.inactiveModeratorsWarning">
									<template #label>{{ $locale.sfc.inactiveModeratorsWarning }}</template>
								</MkSwitch>
								<MkButton v-show="mode === 'edit'" transparent :class="$style.testButton" :disabled="!(isActive && events.inactiveModeratorsWarning)" @click="test('inactiveModeratorsWarning')"><i class="ti ti-send"></i></MkButton>
							</div>
							<div :class="$style.switchBox">
								<MkSwitch v-model="events.inactiveModeratorsInvitationOnlyChanged" :disabled="disabledEvents.inactiveModeratorsInvitationOnlyChanged">
									<template #label>{{ $locale.sfc.inactiveModeratorsInvitationOnlyChanged }}</template>
								</MkSwitch>
								<MkButton v-show="mode === 'edit'" transparent :class="$style.testButton" :disabled="!(isActive && events.inactiveModeratorsInvitationOnlyChanged)" @click="test('inactiveModeratorsInvitationOnlyChanged')"><i class="ti ti-send"></i></MkButton>
							</div>
						</div>

						<div v-show="mode === 'edit'" :class="$style.description">
							{{ $locale.sfc.testRemarks }}
						</div>
					</div>
				</MkFolder>

				<MkSwitch v-model="isActive">
					<template #label>{{ $locale.sfc.enable }}</template>
				</MkSwitch>
			</div>
		</div>
		<div :class="$style.footer" class="_buttonsCenter">
			<MkButton primary rounded :disabled="disableSubmitButton" @click="onSubmitClicked">
				<i class="ti ti-check"></i>
				{{ $locale.sfc.ok }}
			</MkButton>
			<MkButton rounded @click="onCancelClicked"><i class="ti ti-x"></i> {{ $locale.sfc.cancel }}</MkButton>
		</div>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, toRefs } from 'vue';
import * as Misskey from 'misskey-js';
import type {
	MkSystemWebhookEditorProps,
	MkSystemWebhookResult,
	SystemWebhookEventType,
} from './MkSystemWebhookEditor.impl.js';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import * as os from '@features/ui/frontend/os.js';

type EventType = {
	abuseReport: boolean;
	abuseReportResolved: boolean;
	userCreated: boolean;
	inactiveModeratorsWarning: boolean;
	inactiveModeratorsInvitationOnlyChanged: boolean;
};

const emit = defineEmits<{
	(ev: 'submitted', result: MkSystemWebhookResult): void;
	(ev: 'canceled'): void;
	(ev: 'closed'): void;
}>();

const dialogEl = useTemplateRef('dialogEl');

const props = defineProps<MkSystemWebhookEditorProps>();

const { mode, id, requiredEvents } = toRefs(props);

const loading = ref<number>(0);

const title = ref<string>('');
const url = ref<string>('');
const secret = ref<string>('');
const events = ref<EventType>({
	abuseReport: true,
	abuseReportResolved: true,
	userCreated: true,
	inactiveModeratorsWarning: true,
	inactiveModeratorsInvitationOnlyChanged: true,
});
const isActive = ref<boolean>(true);

const disabledEvents = ref<EventType>({
	abuseReport: false,
	abuseReportResolved: false,
	userCreated: false,
	inactiveModeratorsWarning: false,
	inactiveModeratorsInvitationOnlyChanged: false,
});

const disableSubmitButton = computed(() => {
	if (!title.value) {
		return true;
	}
	if (!url.value) {
		return true;
	}
	if (!secret.value) {
		return true;
	}

	return false;
});

async function onSubmitClicked() {
	await loadingScope(async () => {
		const params = {
			isActive: isActive.value,
			name: title.value,
			url: url.value,
			secret: secret.value,
			on: Object.keys(events.value).filter(ev => events.value[ev as keyof EventType]) as SystemWebhookEventType[],
		};

		try {
			switch (mode.value) {
				case 'create': {
					const result = await misskeyApi('admin/system-webhook/create', params);
					dialogEl.value?.close();
					emit('submitted', result);
					break;
				}
				case 'edit': {
					// eslint-disable-next-line
					const result = await misskeyApi('admin/system-webhook/update', { id: id.value!, ...params });
					dialogEl.value?.close();
					emit('submitted', result);
					break;
				}
			}
			// eslint-disable-next-line
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

async function loadingScope<T>(fn: () => Promise<T>): Promise<T> {
	loading.value++;
	try {
		return await fn();
	} finally {
		loading.value--;
	}
}

async function test(type: Misskey.entities.SystemWebhook['on'][number]): Promise<void> {
	if (!id.value) {
		return Promise.resolve();
	}

	await os.apiWithDialog('admin/system-webhook/test', {
		webhookId: id.value,
		type,
		override: {
			secret: secret.value,
			url: url.value,
		},
	});
}

onMounted(async () => {
	await loadingScope(async () => {
		switch (mode.value) {
			case 'edit': {
				if (!id.value) {
					throw new Error('id is required');
				}

				try {
					const res = await misskeyApi('admin/system-webhook/show', { id: id.value });

					title.value = res.name;
					url.value = res.url;
					secret.value = res.secret;
					isActive.value = res.isActive;
					for (const ev of Object.keys(events.value)) {
						events.value[ev as SystemWebhookEventType] = res.on.includes(ev as SystemWebhookEventType);
					}
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				} catch (ex: any) {
					const msg = ex.message ?? $locale.value.sfc.internalServerErrorDescription;
					await os.alert({ type: 'error', title: $locale.value.sfc.error, text: msg });
					dialogEl.value?.close();
					emit('canceled');
				}
				break;
			}
		}

		for (const ev of requiredEvents.value ?? []) {
			disabledEvents.value[ev] = true;
		}
	});
});
</script>

<style module lang="scss">
.root {
	display: flex;
	flex-direction: column;
	justify-content: center;
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

.switchBox {
	display: flex;
	align-items: center;
	justify-content: start;

	.testButton {
		$buttonSize: 28px;
		padding: 0;
		width: $buttonSize;
		min-width: $buttonSize;
		max-width: $buttonSize;
		height: $buttonSize;
		margin-left: auto;
		line-height: normal;
		font-size: 90%;
		border-radius: 9999px;
	}
}

.description {
	font-size: 0.85em;
	padding: 8px 0 0 0;
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
}
</style>

<locale locale="ar-SA" lang="json">
{
	"internalServerErrorDescription": "واجه الخادم خطأ غي متوقع.",
	"error": "خطأ",
	"createWebhook": "Create Webhook",
	"modifyWebhook": "Modify Webhook",
	"name": "الاسم",
	"secret": "Secret",
	"trigger": "Trigger",
	"abuseReport": "When received a new report",
	"abuseReportResolved": "When resolved report",
	"userCreated": "When user is created",
	"inactiveModeratorsWarning": "When moderators have been inactive for a while",
	"inactiveModeratorsInvitationOnlyChanged": "When a moderator has been inactive for a while, and the server is changed to invitation-only",
	"testRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"enable": "تشغيل",
	"ok": " حسناً",
	"cancel": " إلغاء"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"internalServerErrorDescription": "El servidor ha fallat de manera inexplicable.",
	"error": "Error",
	"createWebhook": "Crear un Webhook",
	"modifyWebhook": "Modificar un Webhook",
	"name": "Nom",
	"secret": "Secret",
	"trigger": "Activador",
	"abuseReport": "Quan reps un nou informe de moderació ",
	"abuseReportResolved": "Quan resols un informe de moderació ",
	"userCreated": "Quan es crea un usuari",
	"inactiveModeratorsWarning": "Quan el compte d'un moderador no té activitat durant un temps",
	"inactiveModeratorsInvitationOnlyChanged": "Quan el compte d'un moderador no té activitat durant un temps, i el servidor es canvia a registre per invitacions",
	"testRemarks": "Si feu clic al botó a la dreta de l'interruptor, podeu enviar un webhook de prova amb dades dummy.",
	"enable": "Habilita",
	"ok": "OK",
	"cancel": "Cancel·lar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"internalServerErrorDescription": "Server narazil na neočekávanou chybu.",
	"error": "Chyba",
	"createWebhook": "Vytvořit Webhook",
	"modifyWebhook": "Modify Webhook",
	"name": "Jméno",
	"secret": "Tajné",
	"trigger": "Trigger",
	"abuseReport": "When received a new report",
	"abuseReportResolved": "When resolved report",
	"userCreated": "When user is created",
	"inactiveModeratorsWarning": "When moderators have been inactive for a while",
	"inactiveModeratorsInvitationOnlyChanged": "When a moderator has been inactive for a while, and the server is changed to invitation-only",
	"testRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"enable": "Povolit",
	"ok": "Potvrdit",
	"cancel": "Zrušit"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"internalServerErrorDescription": "The server has run into an unexpected error.",
	"error": "Error",
	"createWebhook": "Create Webhook",
	"modifyWebhook": "Modify Webhook",
	"name": "Name",
	"secret": "Secret",
	"trigger": "Trigger",
	"abuseReport": "When received a new report",
	"abuseReportResolved": "When resolved report",
	"userCreated": "When user is created",
	"inactiveModeratorsWarning": "When moderators have been inactive for a while",
	"inactiveModeratorsInvitationOnlyChanged": "When a moderator has been inactive for a while, and the server is changed to invitation-only",
	"testRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"enable": "Enable",
	"ok": "OK",
	"cancel": "Cancel"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"internalServerErrorDescription": "Im Server ist ein unerwarteter Fehler aufgetreten.",
	"error": "Fehler",
	"createWebhook": "Webhook erstellen",
	"modifyWebhook": "Webhook bearbeiten",
	"name": "Name",
	"secret": "Secret",
	"trigger": "Auslöser",
	"abuseReport": "Wenn eine neue Meldung eingeht",
	"abuseReportResolved": "Wenn eine Meldung gelöst wird",
	"userCreated": "Beim Anlegen eines Benutzers",
	"inactiveModeratorsWarning": "Wenn Moderatoren für eine gewisse Zeit inaktiv sind",
	"inactiveModeratorsInvitationOnlyChanged": "Wenn ein Moderator über einen gewissen Zeitraum inaktiv war und der Server auf Einladungsbasis umgestellt wird",
	"testRemarks": "Klicke auf die Schaltfläche rechts neben dem Schalter, um einen Test-Webhook mit Dummy-Daten zu senden.",
	"enable": "Aktivieren",
	"ok": "OK",
	"cancel": "Abbrechen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"internalServerErrorDescription": "The server has run into an unexpected error.",
	"error": "Error",
	"createWebhook": "Create Webhook",
	"modifyWebhook": "Modify Webhook",
	"name": "Name",
	"secret": "Secret",
	"trigger": "Trigger",
	"abuseReport": "When received a new report",
	"abuseReportResolved": "When resolved report",
	"userCreated": "When user is created",
	"inactiveModeratorsWarning": "When moderators have been inactive for a while",
	"inactiveModeratorsInvitationOnlyChanged": "When a moderator has been inactive for a while, and the server is changed to invitation-only",
	"testRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"enable": "Enable",
	"ok": "OK",
	"cancel": "Cancel"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"internalServerErrorDescription": "El servidor tuvo un error inesperado.",
	"error": "Error",
	"createWebhook": "Crear Webhook",
	"modifyWebhook": "Editar webhook",
	"name": "Nombre",
	"secret": "Secreto",
	"trigger": "Disparador",
	"abuseReport": "Cuando se recibe un nuevo informe de moderación",
	"abuseReportResolved": "Cuando se resuelve un informe de moderación",
	"userCreated": "Cuando se crea el usuario.",
	"inactiveModeratorsWarning": "Cuando un moderador ha estado inactivo por un tiempo",
	"inactiveModeratorsInvitationOnlyChanged": "Cuando un moderador ha estado inactivo durante un tiempo, y el servidor se cambia a sólo por invitación",
	"testRemarks": "Haz clic en el botón de la derecha del switch para mandar una prueba Webhook con datos ficticios",
	"enable": "Activar",
	"ok": "OK",
	"cancel": "Cancelar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"internalServerErrorDescription": "Une erreur inattendue s'est produite sur le serveur.",
	"error": "Erreur",
	"createWebhook": "Create Webhook",
	"modifyWebhook": "Modify Webhook",
	"name": "Nom",
	"secret": "Secret",
	"trigger": "Activateur",
	"abuseReport": "When received a new report",
	"abuseReportResolved": "When resolved report",
	"userCreated": "When user is created",
	"inactiveModeratorsWarning": "When moderators have been inactive for a while",
	"inactiveModeratorsInvitationOnlyChanged": "When a moderator has been inactive for a while, and the server is changed to invitation-only",
	"testRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"enable": "Activer",
	"ok": "OK",
	"cancel": "Annuler"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"internalServerErrorDescription": "Peladen sedang mengalami galat tak terduga",
	"error": "Galat",
	"createWebhook": "Buat Webhook",
	"modifyWebhook": "Sunting Webhook",
	"name": "Nama",
	"secret": "Secret",
	"trigger": "Trigger",
	"abuseReport": "When received a new report",
	"abuseReportResolved": "When resolved report",
	"userCreated": "When user is created",
	"inactiveModeratorsWarning": "When moderators have been inactive for a while",
	"inactiveModeratorsInvitationOnlyChanged": "When a moderator has been inactive for a while, and the server is changed to invitation-only",
	"testRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"enable": "Aktifkan",
	"ok": "Oke",
	"cancel": "Batalkan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"internalServerErrorDescription": "Si è verificato un errore imprevisto all'interno del server",
	"error": "Errore",
	"createWebhook": "Creazione Webhook",
	"modifyWebhook": "Modifica Webhook",
	"name": "Nome",
	"secret": "Segreto",
	"trigger": "Trigger",
	"abuseReport": "Quando arriva una segnalazione",
	"abuseReportResolved": "Quando una segnalazione è risolta",
	"userCreated": "Quando viene creato un profilo",
	"inactiveModeratorsWarning": "Quando un profilo moderatore rimane inattivo per un determinato periodo",
	"inactiveModeratorsInvitationOnlyChanged": "Quando la moderazione è rimasta inattiva per un determinato periodo e il sistema è cambiato in modalità \"solo inviti\"",
	"testRemarks": "Clicca il bottone a destra dell'interruttore, per provare l'invio di un webhook con dati fittizi.",
	"enable": "Abilita",
	"ok": "OK",
	"cancel": "Annulla"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"internalServerErrorDescription": "サーバー内部で予期しないエラーが発生しました。",
	"error": "エラー",
	"createWebhook": "Webhookを作成",
	"modifyWebhook": "Webhookを編集",
	"name": "名前",
	"secret": "シークレット",
	"trigger": "トリガー",
	"abuseReport": "ユーザーから通報があったとき",
	"abuseReportResolved": "ユーザーからの通報を処理したとき",
	"userCreated": "ユーザーが作成されたとき",
	"inactiveModeratorsWarning": "モデレーターが一定期間非アクティブになったとき",
	"inactiveModeratorsInvitationOnlyChanged": "モデレーターが一定期間非アクティブだったため、システムにより招待制へと変更されたとき",
	"testRemarks": "スイッチの右にあるボタンをクリックするとダミーのデータを使用したテスト用Webhookを送信できます。",
	"enable": "有効にする",
	"ok": "OK",
	"cancel": "キャンセル"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"internalServerErrorDescription": "サーバーでなんか変なこと起こっとるわ。",
	"error": "おかしなったで",
	"createWebhook": "Webhookをつくる",
	"modifyWebhook": "Webhookを編集",
	"name": "名前",
	"secret": "シークレット",
	"trigger": "トリガー",
	"abuseReport": "ユーザーから通報があったとき",
	"abuseReportResolved": "ユーザーからの通報を処理したとき",
	"userCreated": "ユーザーが作成されたとき",
	"inactiveModeratorsWarning": "モデレーターがしばらくおらんかったとき",
	"inactiveModeratorsInvitationOnlyChanged": "モデレーターがしばらくおらんかったから、システムが招待制に変えたとき",
	"testRemarks": "スイッチ右のボタンを押すとダミーデータを使ったテスト用Webhookを送れるで。",
	"enable": "有効にするで",
	"ok": "ええで",
	"cancel": "やめる"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"internalServerErrorDescription": "The server has run into an unexpected error.",
	"error": "Error",
	"createWebhook": "Create Webhook",
	"modifyWebhook": "Modify Webhook",
	"name": "Name",
	"secret": "Secret",
	"trigger": "Trigger",
	"abuseReport": "When received a new report",
	"abuseReportResolved": "When resolved report",
	"userCreated": "When user is created",
	"inactiveModeratorsWarning": "When moderators have been inactive for a while",
	"inactiveModeratorsInvitationOnlyChanged": "When a moderator has been inactive for a while, and the server is changed to invitation-only",
	"testRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"enable": "Enable",
	"ok": "IH",
	"cancel": "Cancel"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"internalServerErrorDescription": "The server has run into an unexpected error.",
	"error": "Error",
	"createWebhook": "Create Webhook",
	"modifyWebhook": "Modify Webhook",
	"name": "Name",
	"secret": "Secret",
	"trigger": "Trigger",
	"abuseReport": "When received a new report",
	"abuseReportResolved": "When resolved report",
	"userCreated": "When user is created",
	"inactiveModeratorsWarning": "When moderators have been inactive for a while",
	"inactiveModeratorsInvitationOnlyChanged": "When a moderator has been inactive for a while, and the server is changed to invitation-only",
	"testRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"enable": "Enable",
	"ok": "ಸರಿ",
	"cancel": "ರದ್ದು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"internalServerErrorDescription": "내부 서버에서 예기치 않은 오류가 발생했습니다.",
	"error": "오류",
	"createWebhook": "Webhook 생성",
	"modifyWebhook": "Webhook 수정",
	"name": "이름",
	"secret": "시크릿",
	"trigger": "트리거",
	"abuseReport": "유저로부터 신고를 받았을 때",
	"abuseReportResolved": "받은 신고를 처리했을 때",
	"userCreated": "유저가 생성되었을 때",
	"inactiveModeratorsWarning": "모더레이터가 일정 기간동안 활동하지 않은 경우",
	"inactiveModeratorsInvitationOnlyChanged": "모더레이터가 일정 기간 활동하지 않아 시스템에 의해 초대제로 바뀐 경우",
	"testRemarks": "스위치 오른쪽에 있는 버튼을 클릭하여 더미 데이터를 사용한 테스트용 웹 훅을 보낼 수 있습니다.",
	"enable": "사용",
	"ok": "확인",
	"cancel": "취소"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"internalServerErrorDescription": "The server has run into an unexpected error.",
	"error": "Fout",
	"createWebhook": "Create Webhook",
	"modifyWebhook": "Modify Webhook",
	"name": "Naam",
	"secret": "Secret",
	"trigger": "Trigger",
	"abuseReport": "When received a new report",
	"abuseReportResolved": "When resolved report",
	"userCreated": "When user is created",
	"inactiveModeratorsWarning": "When moderators have been inactive for a while",
	"inactiveModeratorsInvitationOnlyChanged": "When a moderator has been inactive for a while, and the server is changed to invitation-only",
	"testRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"enable": "Inschakelen",
	"ok": "Ok",
	"cancel": "Annuleren"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"internalServerErrorDescription": "The server has run into an unexpected error.",
	"error": "Feil",
	"createWebhook": "Create Webhook",
	"modifyWebhook": "Modify Webhook",
	"name": "Navn",
	"secret": "Secret",
	"trigger": "Trigger",
	"abuseReport": "When received a new report",
	"abuseReportResolved": "When resolved report",
	"userCreated": "When user is created",
	"inactiveModeratorsWarning": "When moderators have been inactive for a while",
	"inactiveModeratorsInvitationOnlyChanged": "When a moderator has been inactive for a while, and the server is changed to invitation-only",
	"testRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"enable": "Enable",
	"ok": "OK",
	"cancel": "Avbryt"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"internalServerErrorDescription": "Niespodziewany błąd po stronie serwera",
	"error": "Błąd",
	"createWebhook": "Stwórz Webhook",
	"modifyWebhook": "Modify Webhook",
	"name": "Nazwa",
	"secret": "Sekret",
	"trigger": "Trigger",
	"abuseReport": "When received a new report",
	"abuseReportResolved": "When resolved report",
	"userCreated": "When user is created",
	"inactiveModeratorsWarning": "When moderators have been inactive for a while",
	"inactiveModeratorsInvitationOnlyChanged": "When a moderator has been inactive for a while, and the server is changed to invitation-only",
	"testRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"enable": "Włącz",
	"ok": "OK",
	"cancel": "Anuluj"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"internalServerErrorDescription": "Houve um erro inesperado no servidor.",
	"error": "Erro",
	"createWebhook": "Criar Webhook",
	"modifyWebhook": "Modificar Webhook",
	"name": "Nome",
	"secret": "Segredo",
	"trigger": "Gatilho",
	"abuseReport": "Quando receber um relatório de abuso",
	"abuseReportResolved": "Quando relatórios de abuso forem resolvidos ",
	"userCreated": "Quando um usuário é criado",
	"inactiveModeratorsWarning": "Quando moderadores estiverem inativos por um tempo",
	"inactiveModeratorsInvitationOnlyChanged": "Quando um moderador está inativo por um tempo e os cadastros passam a exigir convites",
	"testRemarks": "Clique no botão à direita do interruptor para enviar um Webhook de teste com dados fictícios.",
	"enable": "Habilitar",
	"ok": "OK",
	"cancel": "Cancelar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"internalServerErrorDescription": "Внутри сервера произошла непредвиденная ошибка.",
	"error": "Ошибка",
	"createWebhook": "Создать вебхук",
	"modifyWebhook": "Изменить Вебхук",
	"name": "Название",
	"secret": "Секрет",
	"trigger": "Условие срабатывания",
	"abuseReport": "Когда приходит жалоба",
	"abuseReportResolved": "Когда разрешается жалоба",
	"userCreated": "Когда создан пользователь",
	"inactiveModeratorsWarning": "When moderators have been inactive for a while",
	"inactiveModeratorsInvitationOnlyChanged": "When a moderator has been inactive for a while, and the server is changed to invitation-only",
	"testRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"enable": "Включить",
	"ok": "Подтвердить",
	"cancel": "Отмена"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"internalServerErrorDescription": "The server has run into an unexpected error.",
	"error": "Chyba",
	"createWebhook": "Create Webhook",
	"modifyWebhook": "Modify Webhook",
	"name": "Názov",
	"secret": "Secret",
	"trigger": "Trigger",
	"abuseReport": "When received a new report",
	"abuseReportResolved": "When resolved report",
	"userCreated": "When user is created",
	"inactiveModeratorsWarning": "When moderators have been inactive for a while",
	"inactiveModeratorsInvitationOnlyChanged": "When a moderator has been inactive for a while, and the server is changed to invitation-only",
	"testRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"enable": "Povoliť",
	"ok": "OK",
	"cancel": "Zrušiť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"internalServerErrorDescription": "เกิดข้อผิดพลาดที่ไม่คาดคิดภายในเซิร์ฟเวอร์",
	"error": "ผิดพลาด!",
	"createWebhook": "สร้าง Webhook",
	"modifyWebhook": "แก้ไข Webhook",
	"name": "ชื่อ",
	"secret": "ความลับ",
	"trigger": "ทริกเกอร์",
	"abuseReport": "เมื่อมีการรายงานจากผู้ใช้",
	"abuseReportResolved": "เมื่อมีการจัดการกับการรายงานจากผู้ใช้",
	"userCreated": "เมื่อผู้ใช้ถูกสร้างขึ้น",
	"inactiveModeratorsWarning": "เมื่อผู้ควบคุมไม่มีความเคลื่อนไหวในช่วงระยะเวลาหนึ่ง",
	"inactiveModeratorsInvitationOnlyChanged": "เมื่อผู้ควบคุมไม่มีความเคลื่อนไหวในช่วงระยะเวลาหนึ่ง ระบบจะเปลี่ยนเป็นแบบใช้คำเชิญโดยอัตโนมัติ",
	"testRemarks": "คลิกปุ่มทางด้านขวาของสวิตช์เพื่อส่ง Webhook ทดสอบที่มีข้อมูลจำลอง",
	"enable": "เปิดใช้งาน",
	"ok": "ตกลง",
	"cancel": "ยกเลิก"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"internalServerErrorDescription": "Sunucu beklenmedik bir hatayla karşılaştı.",
	"error": "Hata",
	"createWebhook": "Webhook oluştur",
	"modifyWebhook": "Webhook'u değiştir",
	"name": "Webhook'u değiştir",
	"secret": "Gizli",
	"trigger": "Tetikleyici",
	"abuseReport": "Yeni bir rapor alındığında",
	"abuseReportResolved": "Çözüldüğünde rapor",
	"userCreated": "Kullanıcı oluşturulduğunda",
	"inactiveModeratorsWarning": "Moderatörler bir süredir aktif olmadıklarında",
	"inactiveModeratorsInvitationOnlyChanged": "Bir moderatör bir süre aktif olmadığında ve sunucu davetle erişilebilir hale getirildiğinde",
	"testRemarks": "Anahtarın sağındaki düğmeyi tıklayarak sahte verilerle bir test Webhook gönderin.",
	"enable": "Etkin",
	"ok": "Tamam",
	"cancel": "Vazgeç"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"internalServerErrorDescription": "The server has run into an unexpected error.",
	"error": "Error",
	"createWebhook": "Create Webhook",
	"modifyWebhook": "Modify Webhook",
	"name": "Name",
	"secret": "Secret",
	"trigger": "Trigger",
	"abuseReport": "When received a new report",
	"abuseReportResolved": "When resolved report",
	"userCreated": "When user is created",
	"inactiveModeratorsWarning": "When moderators have been inactive for a while",
	"inactiveModeratorsInvitationOnlyChanged": "When a moderator has been inactive for a while, and the server is changed to invitation-only",
	"testRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"enable": "Enable",
	"ok": "ماقۇل",
	"cancel": "Cancel"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"internalServerErrorDescription": "На сервері сталася неочікувана помилка.",
	"error": "Помилка",
	"createWebhook": "Create Webhook",
	"modifyWebhook": "Modify Webhook",
	"name": "Ім'я",
	"secret": "Secret",
	"trigger": "Trigger",
	"abuseReport": "When received a new report",
	"abuseReportResolved": "When resolved report",
	"userCreated": "When user is created",
	"inactiveModeratorsWarning": "When moderators have been inactive for a while",
	"inactiveModeratorsInvitationOnlyChanged": "When a moderator has been inactive for a while, and the server is changed to invitation-only",
	"testRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"enable": "Увімкнути",
	"ok": "OK",
	"cancel": "Скасувати"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"internalServerErrorDescription": "Trong chủ máy lỗi bất ngờ xảy ra",
	"error": "Lỗi",
	"createWebhook": "Tạo Webhook",
	"modifyWebhook": "Modify Webhook",
	"name": "Tên",
	"secret": "Mã bí mật",
	"trigger": "Trigger",
	"abuseReport": "When received a new report",
	"abuseReportResolved": "When resolved report",
	"userCreated": "When user is created",
	"inactiveModeratorsWarning": "When moderators have been inactive for a while",
	"inactiveModeratorsInvitationOnlyChanged": "When a moderator has been inactive for a while, and the server is changed to invitation-only",
	"testRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"enable": "Bật",
	"ok": "Đồng ý",
	"cancel": "Hủy"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"internalServerErrorDescription": "内部服务器发生了预期外的错误",
	"error": "错误",
	"createWebhook": "创建 Webhook",
	"modifyWebhook": "编辑 webhook",
	"name": "名称",
	"secret": "密钥",
	"trigger": "触发",
	"abuseReport": "当收到举报时",
	"abuseReportResolved": "当举报被处理时",
	"userCreated": "当用户被创建时",
	"inactiveModeratorsWarning": "当管理员在一段时间内不活跃时",
	"inactiveModeratorsInvitationOnlyChanged": "当因为管理员在一段时间内不活跃，导致服务器变为邀请制时",
	"testRemarks": "点击开关右侧的按钮，可以发送使用假数据的测试 Webhook。",
	"enable": "启用",
	"ok": "OK",
	"cancel": "取消"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"internalServerErrorDescription": "內部伺服器出現意外錯誤。",
	"error": "錯誤",
	"createWebhook": "建立 Webhook",
	"modifyWebhook": "編輯 Webhook",
	"name": "名字",
	"secret": "密鑰",
	"trigger": "觸發器",
	"abuseReport": "當使用者檢舉時",
	"abuseReportResolved": "當處理了使用者的檢舉時",
	"userCreated": "使用者被新增時",
	"inactiveModeratorsWarning": "當審查員在一段時間內沒有活動時",
	"inactiveModeratorsInvitationOnlyChanged": "當審查員在一段時間內不活動時，系統會將模式變更為邀請制",
	"testRemarks": "按下切換開關右側的按鈕，就會將假資料發送至 Webhook。",
	"enable": "啟用",
	"ok": "OK",
	"cancel": "取消"
}
</locale>
