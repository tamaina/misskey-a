<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkInput v-model="name">
		<template #label>{{ $locale.sfc.name }}</template>
	</MkInput>

	<MkInput v-model="url" type="url">
		<template #label>URL</template>
	</MkInput>

	<MkInput v-model="secret">
		<template #prefix><i class="ti ti-lock"></i></template>
		<template #label>{{ $locale.sfc.secret }}</template>
	</MkInput>

	<FormSection>
		<template #label>{{ $locale.sfc.trigger }}</template>

		<div class="_gaps_s">
			<MkSwitch v-model="event_follow">{{ $locale.sfc.follow }}</MkSwitch>
			<MkSwitch v-model="event_followed">{{ $locale.sfc.followed }}</MkSwitch>
			<MkSwitch v-model="event_note">{{ $locale.sfc.note }}</MkSwitch>
			<MkSwitch v-model="event_reply">{{ $locale.sfc.reply }}</MkSwitch>
			<MkSwitch v-model="event_renote">{{ $locale.sfc.renote }}</MkSwitch>
			<MkSwitch v-model="event_reaction" :disabled="true">{{ $locale.sfc.reaction }}</MkSwitch>
			<MkSwitch v-model="event_mention">{{ $locale.sfc.mention }}</MkSwitch>
		</div>
	</FormSection>

	<div class="_buttons">
		<MkButton primary inline @click="create"><i class="ti ti-check"></i> {{ $locale.sfc.create }}</MkButton>
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
import * as os from '@/os.js';
import { definePage } from '@/page.js';

const name = ref('');
const url = ref('');
const secret = ref('');

const event_follow = ref(true);
const event_followed = ref(true);
const event_note = ref(true);
const event_reply = ref(true);
const event_renote = ref(true);
const event_reaction = ref(true);
const event_mention = ref(true);

async function create(): Promise<void> {
	const events = [] as Misskey.entities.UserWebhook['on'];
	if (event_follow.value) events.push('follow');
	if (event_followed.value) events.push('followed');
	if (event_note.value) events.push('note');
	if (event_reply.value) events.push('reply');
	if (event_renote.value) events.push('renote');
	if (event_reaction.value) events.push('reaction');
	if (event_mention.value) events.push('mention');

	os.apiWithDialog('i/webhooks/create', {
		name: name.value,
		url: url.value,
		secret: secret.value,
		on: events,
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: 'Create new webhook',
	icon: 'ti ti-webhook',
}));
</script>

<locale locale="ar-SA" lang="json">
{
  "name": "الاسم",
  "secret": "Secret",
  "trigger": "Trigger",
  "follow": "When following a user",
  "followed": "When being followed",
  "note": "When posting a note",
  "reply": "When receiving a reply",
  "renote": "When renoted",
  "reaction": "عند التفاعل",
  "mention": "When being mentioned",
  "create": "أنشئ"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "name": "Nom",
  "secret": "Secret",
  "trigger": "Activador",
  "follow": "Quan se segueix a un usuari",
  "followed": "Quan et segueixen",
  "note": "Quan es publica una nota",
  "reply": "Quan es rep una resposta",
  "renote": "Quan es renoti",
  "reaction": "Quan es rep una reacció ",
  "mention": "Quan et mencionen",
  "create": "Crear"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "name": "Jméno",
  "secret": "Tajné",
  "trigger": "Trigger",
  "follow": "Při sledování uživatele",
  "followed": "Při sledování",
  "note": "Při zveřejňování poznámky",
  "reply": "Při obdržení odpovědi",
  "renote": "Při renotaci poznámky",
  "reaction": "Při obdržení reakce",
  "mention": "Při zmínce",
  "create": "Vytvořit"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "name": "Name",
  "secret": "Secret",
  "trigger": "Trigger",
  "follow": "When following a user",
  "followed": "When being followed",
  "note": "When posting a note",
  "reply": "When receiving a reply",
  "renote": "When renoted",
  "reaction": "When receiving a reaction",
  "mention": "When being mentioned",
  "create": "Create"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "name": "Name",
  "secret": "Secret",
  "trigger": "Auslöser",
  "follow": "Wenn du jemandem folgst",
  "followed": "Wenn dir jemand folgt",
  "note": "Wenn du eine Notiz schickst",
  "reply": "Wenn du eine Antwort erhältst",
  "renote": "Wenn du ein Renote erhältst",
  "reaction": "Wenn du eine Reaktion erhältst",
  "mention": "Wenn du erwähnt wirst",
  "create": "Erstellen"
}
</locale>

<locale locale="en-US" lang="json">
{
  "name": "Name",
  "secret": "Secret",
  "trigger": "Trigger",
  "follow": "When following a user",
  "followed": "When being followed",
  "note": "When posting a note",
  "reply": "When receiving a reply",
  "renote": "When renoted",
  "reaction": "When receiving a reaction",
  "mention": "When being mentioned",
  "create": "Create"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "name": "Nombre",
  "secret": "Secreto",
  "trigger": "Disparador",
  "follow": "Cuando se sigue a alguien",
  "followed": "Cuando se es seguido",
  "note": "Cuando se publica una nota",
  "reply": "Cuando se recibe una respuesta",
  "renote": "Cuando reciba un \"re-note\"",
  "reaction": "Cuando se recibe una reacción",
  "mention": "Cuando hay una mención",
  "create": "Crear"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "name": "Nom",
  "secret": "Secret",
  "trigger": "Activateur",
  "follow": "When following a user",
  "followed": "When being followed",
  "note": "When posting a note",
  "reply": "When receiving a reply",
  "renote": "When renoted",
  "reaction": "When receiving a reaction",
  "mention": "When being mentioned",
  "create": "Créer"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "name": "Nama",
  "secret": "Secret",
  "trigger": "Trigger",
  "follow": "Ketika mengikuti pengguna",
  "followed": "Ketika diikuti pengguna",
  "note": "Ketika memposting catatan",
  "reply": "Ketika menerima balasan",
  "renote": "Ketika direnote",
  "reaction": "Ketika menerima reaksi",
  "mention": "Ketika sedang disebut",
  "create": "Buat"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "name": "Nome",
  "secret": "Segreto",
  "trigger": "Trigger",
  "follow": "Quando aggiungi Following",
  "followed": "Quando ti segue un profilo",
  "note": "Quando pubblichi una Nota",
  "reply": "Quando rispondono ad una Nota",
  "renote": "Quando la Nota è Rinotata",
  "reaction": "Quando ricevo una reazione",
  "mention": "Quando mi menzionano",
  "create": "Crea"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "name": "名前",
  "secret": "シークレット",
  "trigger": "トリガー",
  "follow": "フォローしたとき",
  "followed": "フォローされたとき",
  "note": "ノートを投稿したとき",
  "reply": "返信されたとき",
  "renote": "Renoteされたとき",
  "reaction": "リアクションがあったとき",
  "mention": "メンションされたとき",
  "create": "作成"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "name": "名前",
  "secret": "シークレット",
  "trigger": "トリガー",
  "follow": "フォローしたとき～！",
  "followed": "フォローもらったとき～！",
  "note": "ノートを投稿したとき～！",
  "reply": "返信があるとき～！",
  "renote": "リノートされるとき～！",
  "reaction": "ツッコまれたとき～！",
  "mention": "メンションがあるとき～！",
  "create": "作成"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "name": "Name",
  "secret": "Secret",
  "trigger": "Trigger",
  "follow": "When following a user",
  "followed": "When being followed",
  "note": "When posting a note",
  "reply": "When receiving a reply",
  "renote": "When renoted",
  "reaction": "When receiving a reaction",
  "mention": "When being mentioned",
  "create": "Create"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "name": "Name",
  "secret": "Secret",
  "trigger": "Trigger",
  "follow": "When following a user",
  "followed": "When being followed",
  "note": "When posting a note",
  "reply": "When receiving a reply",
  "renote": "When renoted",
  "reaction": "When receiving a reaction",
  "mention": "When being mentioned",
  "create": "Create"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "name": "이름",
  "secret": "시크릿",
  "trigger": "트리거",
  "follow": "누군가를 팔로우했을 때",
  "followed": "누군가 나를 팔로우했을 때",
  "note": "노트를 게시할 때",
  "reply": "답글을 받았을 때",
  "renote": "누군가 내 글을 리노트했을 때",
  "reaction": "누군가 내 노트에 리액션했을 때",
  "mention": "누군가 나를 멘션했을 때",
  "create": "생성"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "name": "Naam",
  "secret": "Secret",
  "trigger": "Trigger",
  "follow": "When following a user",
  "followed": "When being followed",
  "note": "When posting a note",
  "reply": "When receiving a reply",
  "renote": "When renoted",
  "reaction": "When receiving a reaction",
  "mention": "When being mentioned",
  "create": "Creëer"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "name": "Navn",
  "secret": "Secret",
  "trigger": "Trigger",
  "follow": "When following a user",
  "followed": "When being followed",
  "note": "When posting a note",
  "reply": "When receiving a reply",
  "renote": "When renoted",
  "reaction": "When receiving a reaction",
  "mention": "When being mentioned",
  "create": "Opprett"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "name": "Nazwa",
  "secret": "Sekret",
  "trigger": "Trigger",
  "follow": "Po zaobserwowaniu użytkownika",
  "followed": "Po zostaniu zaobserwowanym",
  "note": "Po opublikowaniu wpisu",
  "reply": "Po otrzymaniu odpowiedzi",
  "renote": "Po udostępnieniu wpisu",
  "reaction": "Po otrzymaniu reakcji",
  "mention": "Po zostaniu wspomnianym",
  "create": "Utwórz"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "name": "Nome",
  "secret": "Segredo",
  "trigger": "Gatilho",
  "follow": "Quando seguindo um usuário",
  "followed": "Quando sendo seguido",
  "note": "Ao postar uma nota",
  "reply": "Quando receber uma resposta",
  "renote": "Quando repostado",
  "reaction": "Quando receber uma reação",
  "mention": "Quando for mencionado",
  "create": "Criar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "name": "Название",
  "secret": "Секрет",
  "trigger": "Условие срабатывания",
  "follow": "Когда подписались на пользователя",
  "followed": "Когда на вас подписались",
  "note": "Когда создали заметку",
  "reply": "Когда получили ответ на заметку",
  "renote": "Когда вас репостнули",
  "reaction": "Когда получили реакцию",
  "mention": "Когда вас упоминают",
  "create": "Создать"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "name": "Názov",
  "secret": "Secret",
  "trigger": "Trigger",
  "follow": "When following a user",
  "followed": "When being followed",
  "note": "When posting a note",
  "reply": "When receiving a reply",
  "renote": "When renoted",
  "reaction": "When receiving a reaction",
  "mention": "When being mentioned",
  "create": "Vytvoriť"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "name": "ชื่อ",
  "secret": "ความลับ",
  "trigger": "ทริกเกอร์",
  "follow": "เมื่อกำลังติดตามผู้ใช้",
  "followed": "เมื่อกำลังติดตามแล้ว",
  "note": "เมื่อกำลังโพสต์โน้ต",
  "reply": "เมื่อได้รับการตอบกลับ",
  "renote": "รีโน้ตแล้วเมื่อ",
  "reaction": "เมื่อได้รับรีแอคชั่น",
  "mention": "เมื่อกำลังถูกกล่าวถึง",
  "create": "สร้าง"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "name": "Webhook'u değiştir",
  "secret": "Gizli",
  "trigger": "Tetikleyici",
  "follow": "Bir kullanıcıyı takip ederken",
  "followed": "Takip edildiğinde",
  "note": "Not gönderirken",
  "reply": "Yanıt alındığında",
  "renote": "Yeniden not edildiğinde",
  "reaction": "Tepki aldığınızda",
  "mention": "Bahsedildiğinde",
  "create": "Oluştur"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "name": "Name",
  "secret": "Secret",
  "trigger": "Trigger",
  "follow": "When following a user",
  "followed": "When being followed",
  "note": "When posting a note",
  "reply": "When receiving a reply",
  "renote": "When renoted",
  "reaction": "When receiving a reaction",
  "mention": "When being mentioned",
  "create": "Create"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "name": "Ім'я",
  "secret": "Secret",
  "trigger": "Trigger",
  "follow": "When following a user",
  "followed": "When being followed",
  "note": "When posting a note",
  "reply": "When receiving a reply",
  "renote": "When renoted",
  "reaction": "When receiving a reaction",
  "mention": "When being mentioned",
  "create": "Створити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "name": "Tên",
  "secret": "Mã bí mật",
  "trigger": "Trigger",
  "follow": "When following a user",
  "followed": "When being followed",
  "note": "When posting a note",
  "reply": "When receiving a reply",
  "renote": "When renoted",
  "reaction": "Khi nhận được sự kiện",
  "mention": "Khi có người nhắc tới bạn",
  "create": "Tạo"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "name": "名称",
  "secret": "密钥",
  "trigger": "触发",
  "follow": "关注时",
  "followed": "被关注时",
  "note": "发布帖文时",
  "reply": "收到回复时",
  "renote": "被转发时",
  "reaction": "被回应时",
  "mention": "被提及时",
  "create": "创建"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "name": "名字",
  "secret": "密鑰",
  "trigger": "觸發器",
  "follow": "當你追隨時",
  "followed": "當被追隨時",
  "note": "當發佈貼文時",
  "reply": "當收到回覆時",
  "renote": "當被轉發時",
  "reaction": "當獲得反應時",
  "mention": "當被提到時",
  "create": "新增"
}
</locale>
