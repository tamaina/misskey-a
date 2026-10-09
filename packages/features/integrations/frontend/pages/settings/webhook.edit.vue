<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkInput v-model="name">
		<template #label>{{ $locale.sfc.webhookSettingsName }}</template>
	</MkInput>

	<MkInput v-model="url" type="url">
		<template #label>URL</template>
	</MkInput>

	<MkInput v-model="secret">
		<template #prefix><i class="ti ti-lock"></i></template>
		<template #label>{{ $locale.sfc.webhookSettingsSecret }}</template>
	</MkInput>

	<FormSection>
		<template #label>{{ $locale.sfc.webhookSettingsTrigger }}</template>

		<div class="_gaps">
			<div class="_gaps_s">
				<div :class="$style.switchBox">
					<MkSwitch v-model="event_follow">{{ $locale.sfc.webhookSettingsEventsFollow }}</MkSwitch>
					<MkButton transparent :class="$style.testButton" :disabled="!(active && event_follow)" @click="test('follow')"><i class="ti ti-send"></i></MkButton>
				</div>
				<div :class="$style.switchBox">
					<MkSwitch v-model="event_followed">{{ $locale.sfc.webhookSettingsEventsFollowed }}</MkSwitch>
					<MkButton transparent :class="$style.testButton" :disabled="!(active && event_followed)" @click="test('followed')"><i class="ti ti-send"></i></MkButton>
				</div>
				<div :class="$style.switchBox">
					<MkSwitch v-model="event_note">{{ $locale.sfc.webhookSettingsEventsNote }}</MkSwitch>
					<MkButton transparent :class="$style.testButton" :disabled="!(active && event_note)" @click="test('note')"><i class="ti ti-send"></i></MkButton>
				</div>
				<div :class="$style.switchBox">
					<MkSwitch v-model="event_reply">{{ $locale.sfc.webhookSettingsEventsReply }}</MkSwitch>
					<MkButton transparent :class="$style.testButton" :disabled="!(active && event_reply)" @click="test('reply')"><i class="ti ti-send"></i></MkButton>
				</div>
				<div :class="$style.switchBox">
					<MkSwitch v-model="event_renote">{{ $locale.sfc.webhookSettingsEventsRenote }}</MkSwitch>
					<MkButton transparent :class="$style.testButton" :disabled="!(active && event_renote)" @click="test('renote')"><i class="ti ti-send"></i></MkButton>
				</div>
				<div :class="$style.switchBox">
					<MkSwitch v-model="event_reaction" :disabled="true">{{ $locale.sfc.webhookSettingsEventsReaction }}</MkSwitch>
					<MkButton transparent :class="$style.testButton" :disabled="!(active && event_reaction)" @click="test('reaction')"><i class="ti ti-send"></i></MkButton>
				</div>
				<div :class="$style.switchBox">
					<MkSwitch v-model="event_mention">{{ $locale.sfc.webhookSettingsEventsMention }}</MkSwitch>
					<MkButton transparent :class="$style.testButton" :disabled="!(active && event_mention)" @click="test('mention')"><i class="ti ti-send"></i></MkButton>
				</div>
			</div>

			<div :class="$style.description">
				{{ $locale.sfc.webhookSettingsTestRemarks }}
			</div>
		</div>
	</FormSection>

	<MkSwitch v-model="active">{{ $locale.sfc.webhookSettingsActive }}</MkSwitch>

	<div class="_buttons">
		<MkButton primary inline @click="save"><i class="ti ti-check"></i> {{ $locale.sfc.save }}</MkButton>
		<MkButton danger inline @click="del"><i class="ti ti-trash"></i> {{ $locale.sfc.delete }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { useRouter } from '@features/navigation/frontend/router.js';

const router = useRouter();

const props = defineProps<{
	webhookId: string;
}>();

const webhook = await misskeyApi('i/webhooks/show', {
	webhookId: props.webhookId,
});

const name = ref(webhook.name);
const url = ref(webhook.url);
const secret = ref(webhook.secret);
const active = ref(webhook.active);

const event_follow = ref(webhook.on.includes('follow'));
const event_followed = ref(webhook.on.includes('followed'));
const event_note = ref(webhook.on.includes('note'));
const event_reply = ref(webhook.on.includes('reply'));
const event_renote = ref(webhook.on.includes('renote'));
const event_reaction = ref(webhook.on.includes('reaction'));
const event_mention = ref(webhook.on.includes('mention'));

function save() {
	const events: Misskey.entities.UserWebhook['on'] = [];
	if (event_follow.value) events.push('follow');
	if (event_followed.value) events.push('followed');
	if (event_note.value) events.push('note');
	if (event_reply.value) events.push('reply');
	if (event_renote.value) events.push('renote');
	if (event_reaction.value) events.push('reaction');
	if (event_mention.value) events.push('mention');

	os.apiWithDialog('i/webhooks/update', {
		name: name.value,
		url: url.value,
		secret: secret.value,
		webhookId: props.webhookId,
		on: events,
		active: active.value,
	});
}

async function del(): Promise<void> {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters($locale.value.sfc.deleteAreYouSure, { x: webhook.name }),
	});
	if (canceled) return;

	await os.apiWithDialog('i/webhooks/delete', {
		webhookId: props.webhookId,
	});

	router.push('/settings/connect');
}

async function test(type: Misskey.entities.UserWebhook['on'][number]): Promise<void> {
	await os.apiWithDialog('i/webhooks/test', {
		webhookId: props.webhookId,
		type,
		override: {
			secret: secret.value,
			url: url.value,
		},
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: 'Edit webhook',
	icon: 'ti ti-webhook',
}));
</script>

<style module lang="scss">
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
		line-height: inherit;
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

<locale lang="json" locale="ar-SA">
{
	"webhookSettingsName": "الاسم",
	"webhookSettingsSecret": "Secret",
	"webhookSettingsTrigger": "Trigger",
	"webhookSettingsEventsFollow": "When following a user",
	"webhookSettingsEventsFollowed": "When being followed",
	"webhookSettingsEventsNote": "When posting a note",
	"webhookSettingsEventsReply": "When receiving a reply",
	"webhookSettingsEventsRenote": "When renoted",
	"webhookSettingsEventsReaction": "عند التفاعل",
	"webhookSettingsEventsMention": "When being mentioned",
	"webhookSettingsTestRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"webhookSettingsActive": "مُفعّل",
	"save": "حفظ",
	"delete": "حذف",
	"deleteAreYouSure": "متأكد من أنك تريد حذف {x}؟"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"webhookSettingsName": "Nom",
	"webhookSettingsSecret": "Secret",
	"webhookSettingsTrigger": "Activador",
	"webhookSettingsEventsFollow": "Quan se segueix a un usuari",
	"webhookSettingsEventsFollowed": "Quan et segueixen",
	"webhookSettingsEventsNote": "Quan es publica una nota",
	"webhookSettingsEventsReply": "Quan es rep una resposta",
	"webhookSettingsEventsRenote": "Quan es renoti",
	"webhookSettingsEventsReaction": "Quan es rep una reacció ",
	"webhookSettingsEventsMention": "Quan et mencionen",
	"webhookSettingsTestRemarks": "Si feu clic al botó a la dreta de l'interruptor, podeu enviar un webhook de prova amb dades dummy.",
	"webhookSettingsActive": "Activat",
	"save": "Desa",
	"delete": "Elimina",
	"deleteAreYouSure": "Segur que vols esborrar «{x}»?"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"webhookSettingsName": "Jméno",
	"webhookSettingsSecret": "Tajné",
	"webhookSettingsTrigger": "Trigger",
	"webhookSettingsEventsFollow": "Při sledování uživatele",
	"webhookSettingsEventsFollowed": "Při sledování",
	"webhookSettingsEventsNote": "Při zveřejňování poznámky",
	"webhookSettingsEventsReply": "Při obdržení odpovědi",
	"webhookSettingsEventsRenote": "Při renotaci poznámky",
	"webhookSettingsEventsReaction": "Při obdržení reakce",
	"webhookSettingsEventsMention": "Při zmínce",
	"webhookSettingsTestRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"webhookSettingsActive": "Zapnuto",
	"save": "Uložit",
	"delete": "Smazat",
	"deleteAreYouSure": "Jste si jistí že chcete smazat \"{x}\"?"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"webhookSettingsName": "Name",
	"webhookSettingsSecret": "Secret",
	"webhookSettingsTrigger": "Trigger",
	"webhookSettingsEventsFollow": "When following a user",
	"webhookSettingsEventsFollowed": "When being followed",
	"webhookSettingsEventsNote": "When posting a note",
	"webhookSettingsEventsReply": "When receiving a reply",
	"webhookSettingsEventsRenote": "When renoted",
	"webhookSettingsEventsReaction": "When receiving a reaction",
	"webhookSettingsEventsMention": "When being mentioned",
	"webhookSettingsTestRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"webhookSettingsActive": "Enabled",
	"save": "Save",
	"delete": "Delete",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"webhookSettingsName": "Name",
	"webhookSettingsSecret": "Secret",
	"webhookSettingsTrigger": "Auslöser",
	"webhookSettingsEventsFollow": "Wenn du jemandem folgst",
	"webhookSettingsEventsFollowed": "Wenn dir jemand folgt",
	"webhookSettingsEventsNote": "Wenn du eine Notiz schickst",
	"webhookSettingsEventsReply": "Wenn du eine Antwort erhältst",
	"webhookSettingsEventsRenote": "Wenn du ein Renote erhältst",
	"webhookSettingsEventsReaction": "Wenn du eine Reaktion erhältst",
	"webhookSettingsEventsMention": "Wenn du erwähnt wirst",
	"webhookSettingsTestRemarks": "Klicke auf die Schaltfläche rechts neben dem Schalter, um einen Test-Webhook mit Dummy-Daten zu senden.",
	"webhookSettingsActive": "Aktiviert",
	"save": "Speichern",
	"delete": "Löschen",
	"deleteAreYouSure": "Möchtest du „{x}“ wirklich löschen?"
}
</locale>

<locale lang="json" locale="en-US">
{
	"webhookSettingsName": "Name",
	"webhookSettingsSecret": "Secret",
	"webhookSettingsTrigger": "Trigger",
	"webhookSettingsEventsFollow": "When following a user",
	"webhookSettingsEventsFollowed": "When being followed",
	"webhookSettingsEventsNote": "When posting a note",
	"webhookSettingsEventsReply": "When receiving a reply",
	"webhookSettingsEventsRenote": "When renoted",
	"webhookSettingsEventsReaction": "When receiving a reaction",
	"webhookSettingsEventsMention": "When being mentioned",
	"webhookSettingsTestRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"webhookSettingsActive": "Enabled",
	"save": "Save",
	"delete": "Delete",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"webhookSettingsName": "Nombre",
	"webhookSettingsSecret": "Secreto",
	"webhookSettingsTrigger": "Disparador",
	"webhookSettingsEventsFollow": "Cuando se sigue a alguien",
	"webhookSettingsEventsFollowed": "Cuando se es seguido",
	"webhookSettingsEventsNote": "Cuando se publica una nota",
	"webhookSettingsEventsReply": "Cuando se recibe una respuesta",
	"webhookSettingsEventsRenote": "Cuando reciba un \"re-note\"",
	"webhookSettingsEventsReaction": "Cuando se recibe una reacción",
	"webhookSettingsEventsMention": "Cuando hay una mención",
	"webhookSettingsTestRemarks": "Haz clic en el botón de la derecha del switch para mandar una prueba Webhook con datos ficticios",
	"webhookSettingsActive": "Activado",
	"save": "Guardar",
	"delete": "Borrar",
	"deleteAreYouSure": "¿Desea borrar \"{x}\"?"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"webhookSettingsName": "Nom",
	"webhookSettingsSecret": "Secret",
	"webhookSettingsTrigger": "Activateur",
	"webhookSettingsEventsFollow": "When following a user",
	"webhookSettingsEventsFollowed": "When being followed",
	"webhookSettingsEventsNote": "When posting a note",
	"webhookSettingsEventsReply": "When receiving a reply",
	"webhookSettingsEventsRenote": "When renoted",
	"webhookSettingsEventsReaction": "When receiving a reaction",
	"webhookSettingsEventsMention": "When being mentioned",
	"webhookSettingsTestRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"webhookSettingsActive": "Activé",
	"save": "Enregistrer",
	"delete": "Supprimer",
	"deleteAreYouSure": "Êtes-vous sûr·e de vouloir supprimer « {x} » ?"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"webhookSettingsName": "Nama",
	"webhookSettingsSecret": "Secret",
	"webhookSettingsTrigger": "Trigger",
	"webhookSettingsEventsFollow": "Ketika mengikuti pengguna",
	"webhookSettingsEventsFollowed": "Ketika diikuti pengguna",
	"webhookSettingsEventsNote": "Ketika memposting catatan",
	"webhookSettingsEventsReply": "Ketika menerima balasan",
	"webhookSettingsEventsRenote": "Ketika direnote",
	"webhookSettingsEventsReaction": "Ketika menerima reaksi",
	"webhookSettingsEventsMention": "Ketika sedang disebut",
	"webhookSettingsTestRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"webhookSettingsActive": "Aktif",
	"save": "Simpan",
	"delete": "Hapus",
	"deleteAreYouSure": "Apakah kamu yakin ingin menghapus \"{x}\"?"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"webhookSettingsName": "Nome",
	"webhookSettingsSecret": "Segreto",
	"webhookSettingsTrigger": "Trigger",
	"webhookSettingsEventsFollow": "Quando aggiungi Following",
	"webhookSettingsEventsFollowed": "Quando ti segue un profilo",
	"webhookSettingsEventsNote": "Quando pubblichi una Nota",
	"webhookSettingsEventsReply": "Quando rispondono ad una Nota",
	"webhookSettingsEventsRenote": "Quando la Nota è Rinotata",
	"webhookSettingsEventsReaction": "Quando ricevo una reazione",
	"webhookSettingsEventsMention": "Quando mi menzionano",
	"webhookSettingsTestRemarks": "Clicca il bottone a destra dell'interruttore, per provare l'invio di un webhook con dati fittizi.",
	"webhookSettingsActive": "Attivo",
	"save": "Salva",
	"delete": "Elimina",
	"deleteAreYouSure": "Vuoi davvero eliminare \"{x}\"?"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"webhookSettingsName": "名前",
	"webhookSettingsSecret": "シークレット",
	"webhookSettingsTrigger": "トリガー",
	"webhookSettingsEventsFollow": "フォローしたとき",
	"webhookSettingsEventsFollowed": "フォローされたとき",
	"webhookSettingsEventsNote": "ノートを投稿したとき",
	"webhookSettingsEventsReply": "返信されたとき",
	"webhookSettingsEventsRenote": "Renoteされたとき",
	"webhookSettingsEventsReaction": "リアクションがあったとき",
	"webhookSettingsEventsMention": "メンションされたとき",
	"webhookSettingsTestRemarks": "スイッチの右にあるボタンをクリックするとダミーのデータを使用したテスト用Webhookを送信できます。",
	"webhookSettingsActive": "有効",
	"save": "保存",
	"delete": "削除",
	"deleteAreYouSure": "「{x}」を削除しますか？"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"webhookSettingsName": "名前",
	"webhookSettingsSecret": "シークレット",
	"webhookSettingsTrigger": "トリガー",
	"webhookSettingsEventsFollow": "フォローしたとき～！",
	"webhookSettingsEventsFollowed": "フォローもらったとき～！",
	"webhookSettingsEventsNote": "ノートを投稿したとき～！",
	"webhookSettingsEventsReply": "返信があるとき～！",
	"webhookSettingsEventsRenote": "リノートされるとき～！",
	"webhookSettingsEventsReaction": "ツッコまれたとき～！",
	"webhookSettingsEventsMention": "メンションがあるとき～！",
	"webhookSettingsTestRemarks": "スイッチ右のボタンを押すとダミーデータを使ったテスト用Webhookを送れるで。",
	"webhookSettingsActive": "有効",
	"save": "とっとく",
	"delete": "ほかす",
	"deleteAreYouSure": "「{x}」はほかしてええか？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"webhookSettingsName": "Name",
	"webhookSettingsSecret": "Secret",
	"webhookSettingsTrigger": "Trigger",
	"webhookSettingsEventsFollow": "When following a user",
	"webhookSettingsEventsFollowed": "When being followed",
	"webhookSettingsEventsNote": "When posting a note",
	"webhookSettingsEventsReply": "When receiving a reply",
	"webhookSettingsEventsRenote": "When renoted",
	"webhookSettingsEventsReaction": "When receiving a reaction",
	"webhookSettingsEventsMention": "When being mentioned",
	"webhookSettingsTestRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"webhookSettingsActive": "Enabled",
	"save": "Sekles",
	"delete": "Kkes",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"webhookSettingsName": "Name",
	"webhookSettingsSecret": "Secret",
	"webhookSettingsTrigger": "Trigger",
	"webhookSettingsEventsFollow": "When following a user",
	"webhookSettingsEventsFollowed": "When being followed",
	"webhookSettingsEventsNote": "When posting a note",
	"webhookSettingsEventsReply": "When receiving a reply",
	"webhookSettingsEventsRenote": "When renoted",
	"webhookSettingsEventsReaction": "When receiving a reaction",
	"webhookSettingsEventsMention": "When being mentioned",
	"webhookSettingsTestRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"webhookSettingsActive": "Enabled",
	"save": "ಉಳಿಸಿ",
	"delete": "ಅಳಿಸು",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"webhookSettingsName": "이름",
	"webhookSettingsSecret": "시크릿",
	"webhookSettingsTrigger": "트리거",
	"webhookSettingsEventsFollow": "누군가를 팔로우했을 때",
	"webhookSettingsEventsFollowed": "누군가 나를 팔로우했을 때",
	"webhookSettingsEventsNote": "노트를 게시할 때",
	"webhookSettingsEventsReply": "답글을 받았을 때",
	"webhookSettingsEventsRenote": "누군가 내 글을 리노트했을 때",
	"webhookSettingsEventsReaction": "누군가 내 노트에 리액션했을 때",
	"webhookSettingsEventsMention": "누군가 나를 멘션했을 때",
	"webhookSettingsTestRemarks": "스위치 오른쪽에 있는 버튼을 클릭하여 더미 데이터를 사용한 테스트용 웹 훅을 보낼 수 있습니다.",
	"webhookSettingsActive": "활성화",
	"save": "저장",
	"delete": "삭제",
	"deleteAreYouSure": "\"{x}\" 을(를) 삭제하시겠습니까?"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"webhookSettingsName": "Naam",
	"webhookSettingsSecret": "Secret",
	"webhookSettingsTrigger": "Trigger",
	"webhookSettingsEventsFollow": "When following a user",
	"webhookSettingsEventsFollowed": "When being followed",
	"webhookSettingsEventsNote": "When posting a note",
	"webhookSettingsEventsReply": "When receiving a reply",
	"webhookSettingsEventsRenote": "When renoted",
	"webhookSettingsEventsReaction": "When receiving a reaction",
	"webhookSettingsEventsMention": "When being mentioned",
	"webhookSettingsTestRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"webhookSettingsActive": "Ingeschakeld",
	"save": "Opslaan",
	"delete": "Verwijderen",
	"deleteAreYouSure": "Weet je zeker dat je \"{x}\" wil verwijderen?"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"webhookSettingsName": "Navn",
	"webhookSettingsSecret": "Secret",
	"webhookSettingsTrigger": "Trigger",
	"webhookSettingsEventsFollow": "When following a user",
	"webhookSettingsEventsFollowed": "When being followed",
	"webhookSettingsEventsNote": "When posting a note",
	"webhookSettingsEventsReply": "When receiving a reply",
	"webhookSettingsEventsRenote": "When renoted",
	"webhookSettingsEventsReaction": "When receiving a reaction",
	"webhookSettingsEventsMention": "When being mentioned",
	"webhookSettingsTestRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"webhookSettingsActive": "Enabled",
	"save": "Lagre",
	"delete": "Slett",
	"deleteAreYouSure": "Er du sikker på at du vil slette \"{x}\"?"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"webhookSettingsName": "Nazwa",
	"webhookSettingsSecret": "Sekret",
	"webhookSettingsTrigger": "Trigger",
	"webhookSettingsEventsFollow": "Po zaobserwowaniu użytkownika",
	"webhookSettingsEventsFollowed": "Po zostaniu zaobserwowanym",
	"webhookSettingsEventsNote": "Po opublikowaniu wpisu",
	"webhookSettingsEventsReply": "Po otrzymaniu odpowiedzi",
	"webhookSettingsEventsRenote": "Po udostępnieniu wpisu",
	"webhookSettingsEventsReaction": "Po otrzymaniu reakcji",
	"webhookSettingsEventsMention": "Po zostaniu wspomnianym",
	"webhookSettingsTestRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"webhookSettingsActive": "Właczono",
	"save": "Zapisz",
	"delete": "Usuń",
	"deleteAreYouSure": "Czy na pewno chcesz usunąć „{x}”?"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"webhookSettingsName": "Nome",
	"webhookSettingsSecret": "Segredo",
	"webhookSettingsTrigger": "Gatilho",
	"webhookSettingsEventsFollow": "Quando seguindo um usuário",
	"webhookSettingsEventsFollowed": "Quando sendo seguido",
	"webhookSettingsEventsNote": "Ao postar uma nota",
	"webhookSettingsEventsReply": "Quando receber uma resposta",
	"webhookSettingsEventsRenote": "Quando repostado",
	"webhookSettingsEventsReaction": "Quando receber uma reação",
	"webhookSettingsEventsMention": "Quando for mencionado",
	"webhookSettingsTestRemarks": "Clique no botão à direita do interruptor para enviar um Webhook de teste com dados fictícios.",
	"webhookSettingsActive": "Ativado",
	"save": "Salvar",
	"delete": "Excluir",
	"deleteAreYouSure": "Deseja excluir \"{x}\"?"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"webhookSettingsName": "Название",
	"webhookSettingsSecret": "Секрет",
	"webhookSettingsTrigger": "Условие срабатывания",
	"webhookSettingsEventsFollow": "Когда подписались на пользователя",
	"webhookSettingsEventsFollowed": "Когда на вас подписались",
	"webhookSettingsEventsNote": "Когда создали заметку",
	"webhookSettingsEventsReply": "Когда получили ответ на заметку",
	"webhookSettingsEventsRenote": "Когда вас репостнули",
	"webhookSettingsEventsReaction": "Когда получили реакцию",
	"webhookSettingsEventsMention": "Когда вас упоминают",
	"webhookSettingsTestRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"webhookSettingsActive": "Вкл.",
	"save": "Сохранить",
	"delete": "Удалить",
	"deleteAreYouSure": "Хотите удалить «{x}»?"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"webhookSettingsName": "Názov",
	"webhookSettingsSecret": "Secret",
	"webhookSettingsTrigger": "Trigger",
	"webhookSettingsEventsFollow": "When following a user",
	"webhookSettingsEventsFollowed": "When being followed",
	"webhookSettingsEventsNote": "When posting a note",
	"webhookSettingsEventsReply": "When receiving a reply",
	"webhookSettingsEventsRenote": "When renoted",
	"webhookSettingsEventsReaction": "When receiving a reaction",
	"webhookSettingsEventsMention": "When being mentioned",
	"webhookSettingsTestRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"webhookSettingsActive": "Zapnuté",
	"save": "Uložiť",
	"delete": "Odstrániť",
	"deleteAreYouSure": "Naozaj chcete odstrániť \"{x}\"?"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"webhookSettingsName": "ชื่อ",
	"webhookSettingsSecret": "ความลับ",
	"webhookSettingsTrigger": "ทริกเกอร์",
	"webhookSettingsEventsFollow": "เมื่อกำลังติดตามผู้ใช้",
	"webhookSettingsEventsFollowed": "เมื่อกำลังติดตามแล้ว",
	"webhookSettingsEventsNote": "เมื่อกำลังโพสต์โน้ต",
	"webhookSettingsEventsReply": "เมื่อได้รับการตอบกลับ",
	"webhookSettingsEventsRenote": "รีโน้ตแล้วเมื่อ",
	"webhookSettingsEventsReaction": "เมื่อได้รับรีแอคชั่น",
	"webhookSettingsEventsMention": "เมื่อกำลังถูกกล่าวถึง",
	"webhookSettingsTestRemarks": "คลิกปุ่มทางด้านขวาของสวิตช์เพื่อส่ง Webhook ทดสอบที่มีข้อมูลจำลอง",
	"webhookSettingsActive": "เปิดใช้งาน",
	"save": "บันทึก",
	"delete": "ลบ",
	"deleteAreYouSure": "ต้องการลบ “{x}” ใช่ไหม?"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"webhookSettingsName": "Webhook'u değiştir",
	"webhookSettingsSecret": "Gizli",
	"webhookSettingsTrigger": "Tetikleyici",
	"webhookSettingsEventsFollow": "Bir kullanıcıyı takip ederken",
	"webhookSettingsEventsFollowed": "Takip edildiğinde",
	"webhookSettingsEventsNote": "Not gönderirken",
	"webhookSettingsEventsReply": "Yanıt alındığında",
	"webhookSettingsEventsRenote": "Yeniden not edildiğinde",
	"webhookSettingsEventsReaction": "Tepki aldığınızda",
	"webhookSettingsEventsMention": "Bahsedildiğinde",
	"webhookSettingsTestRemarks": "Anahtarın sağındaki düğmeyi tıklayarak sahte verilerle bir test Webhook gönderin.",
	"webhookSettingsActive": "Etkin",
	"save": "Kaydet",
	"delete": "Sil",
	"deleteAreYouSure": "“{x}” öğesini silmek istediğinizden emin misin?"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"webhookSettingsName": "Name",
	"webhookSettingsSecret": "Secret",
	"webhookSettingsTrigger": "Trigger",
	"webhookSettingsEventsFollow": "When following a user",
	"webhookSettingsEventsFollowed": "When being followed",
	"webhookSettingsEventsNote": "When posting a note",
	"webhookSettingsEventsReply": "When receiving a reply",
	"webhookSettingsEventsRenote": "When renoted",
	"webhookSettingsEventsReaction": "When receiving a reaction",
	"webhookSettingsEventsMention": "When being mentioned",
	"webhookSettingsTestRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"webhookSettingsActive": "Enabled",
	"save": "Save",
	"delete": "ئۆچۈرۈش",
	"deleteAreYouSure": "Are you sure that you want to delete \"{x}\"?"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"webhookSettingsName": "Ім'я",
	"webhookSettingsSecret": "Secret",
	"webhookSettingsTrigger": "Trigger",
	"webhookSettingsEventsFollow": "When following a user",
	"webhookSettingsEventsFollowed": "When being followed",
	"webhookSettingsEventsNote": "When posting a note",
	"webhookSettingsEventsReply": "When receiving a reply",
	"webhookSettingsEventsRenote": "When renoted",
	"webhookSettingsEventsReaction": "When receiving a reaction",
	"webhookSettingsEventsMention": "When being mentioned",
	"webhookSettingsTestRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"webhookSettingsActive": "Увімкнено",
	"save": "Зберегти",
	"delete": "Видалити",
	"deleteAreYouSure": "Ви впевнені, що хочете видалити \"{x}\"?"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"webhookSettingsName": "Tên",
	"webhookSettingsSecret": "Mã bí mật",
	"webhookSettingsTrigger": "Trigger",
	"webhookSettingsEventsFollow": "When following a user",
	"webhookSettingsEventsFollowed": "When being followed",
	"webhookSettingsEventsNote": "When posting a note",
	"webhookSettingsEventsReply": "When receiving a reply",
	"webhookSettingsEventsRenote": "When renoted",
	"webhookSettingsEventsReaction": "Khi nhận được sự kiện",
	"webhookSettingsEventsMention": "Khi có người nhắc tới bạn",
	"webhookSettingsTestRemarks": "Click the button to the right of the switch to send a test Webhook with dummy data.",
	"webhookSettingsActive": "Đã bật",
	"save": "Lưu",
	"delete": "Xóa",
	"deleteAreYouSure": "Bạn có chắc muốn xóa \"{x}\"?"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"webhookSettingsName": "名称",
	"webhookSettingsSecret": "密钥",
	"webhookSettingsTrigger": "触发",
	"webhookSettingsEventsFollow": "关注时",
	"webhookSettingsEventsFollowed": "被关注时",
	"webhookSettingsEventsNote": "发布帖文时",
	"webhookSettingsEventsReply": "收到回复时",
	"webhookSettingsEventsRenote": "被转发时",
	"webhookSettingsEventsReaction": "被回应时",
	"webhookSettingsEventsMention": "被提及时",
	"webhookSettingsTestRemarks": "点击开关右侧的按钮，可以发送使用假数据的测试 Webhook。",
	"webhookSettingsActive": "已启用",
	"save": "保存",
	"delete": "删除",
	"deleteAreYouSure": "要删掉「{x}」吗？"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"webhookSettingsName": "名字",
	"webhookSettingsSecret": "密鑰",
	"webhookSettingsTrigger": "觸發器",
	"webhookSettingsEventsFollow": "當你追隨時",
	"webhookSettingsEventsFollowed": "當被追隨時",
	"webhookSettingsEventsNote": "當發佈貼文時",
	"webhookSettingsEventsReply": "當收到回覆時",
	"webhookSettingsEventsRenote": "當被轉發時",
	"webhookSettingsEventsReaction": "當獲得反應時",
	"webhookSettingsEventsMention": "當被提到時",
	"webhookSettingsTestRemarks": "按下切換開關右側的按鈕，就會將假資料發送至 Webhook。",
	"webhookSettingsActive": "已啟用",
	"save": "儲存",
	"delete": "刪除",
	"deleteAreYouSure": "確定要刪掉「{x}」嗎？"
}
</locale>
