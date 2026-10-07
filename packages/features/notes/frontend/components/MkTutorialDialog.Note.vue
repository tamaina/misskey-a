<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="phase === 'aboutNote'" class="_gaps">
	<div style="text-align: center; padding: 0 16px;">{{ $locale.sfc.initialTutorialNoteDescription }}</div>
	<MkNote :class="$style.exampleNoteRoot" style="pointer-events: none;" :note="exampleNote" :mock="true"/>
	<div class="_gaps_s">
		<div><i class="ti ti-arrow-back-up"></i> <b>{{ $locale.sfc.reply }}</b> … {{ $locale.sfc.initialTutorialNoteReply }}</div>
		<div><i class="ti ti-repeat"></i> <b>{{ $locale.sfc.renote }}</b> … {{ $locale.sfc.initialTutorialNoteRenote }}</div>
		<div><i class="ti ti-plus"></i> <b>{{ $locale.sfc.reaction }}</b> … {{ $locale.sfc.initialTutorialNoteReaction }}</div>
		<div><i class="ti ti-dots"></i> <b>{{ $locale.sfc.menu }}</b> … {{ $locale.sfc.initialTutorialNoteMenu }}</div>
	</div>
</div>
<div v-else-if="phase === 'howToReact'" class="_gaps">
	<div style="text-align: center; padding: 0 16px;">{{ $locale.sfc.initialTutorialReactionDescription }}</div>
	<div>{{ $locale.sfc.initialTutorialReactionLetsTryReacting }}</div>
	<MkNote :class="$style.exampleNoteRoot" :note="exampleNote" :mock="true" @reaction="addReaction" @removeReaction="removeReaction"/>
	<div v-if="onceReacted"><b style="color: var(--MI_THEME-accent);"><i class="ti ti-check"></i> {{ $locale.sfc.initialTutorialWellDone }}</b> {{ $locale.sfc.initialTutorialReactionReactNotification }}<br>{{ $locale.sfc.initialTutorialReactionReactDone }}</div>
</div>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';
import { ref, reactive } from 'vue';
import { globalEvents } from '@features/runtime/frontend/events.js';
import { $i } from '@features/auth/frontend/i.js';
import MkNote from '@features/notes/frontend/components/MkNote.vue';
import { genId } from '@features/runtime/frontend/utility/id.js';

const props = defineProps<{
	phase: 'aboutNote' | 'howToReact';
}>();

const emit = defineEmits<{
	(ev: 'reacted'): void;
}>();

const exampleNote = reactive<Misskey.entities.Note>({
	id: '0000000000',
	createdAt: '2019-04-14T17:30:49.181Z',
	userId: '0000000001',
	user: {
		id: '0000000001',
		name: '藍',
		username: 'ai',
		host: null,
		avatarDecorations: [],
		avatarUrl: '/client-assets/tutorial/ai.webp',
		avatarBlurhash: 'eiKmhHIByXxZ~qWXs:-pR*NbR*s:xuRjoL-oR*WCt6WWf6WVf6oeWB',
		isBot: false,
		isCat: true,
		emojis: {},
		onlineStatus: 'unknown',
		badgeRoles: [],
	},
	text: 'just setting up my msky',
	cw: null,
	visibility: 'public',
	localOnly: false,
	reactionAcceptance: null,
	renoteCount: 0,
	repliesCount: 1,
	reactionCount: 0,
	reactions: {},
	reactionEmojis: {},
	fileIds: [],
	files: [],
	replyId: null,
	renoteId: null,
});
const onceReacted = ref<boolean>(false);

function addReaction(emoji: string) {
	onceReacted.value = true;
	emit('reacted');
	doNotification(emoji);
}

function doNotification(emoji: string): void {
	if (!$i || !emoji) return;

	const notification: Misskey.entities.Notification = {
		id: genId(),
		createdAt: new Date().toUTCString(),
		type: 'reaction',
		reaction: emoji,
		user: $i,
		userId: $i.id,
		note: exampleNote,
	};

	globalEvents.emit('clientNotification', notification);
}

function removeReaction(emoji: string) {
	delete exampleNote.reactions[emoji];
	exampleNote.myReaction = undefined;
}
</script>

<style lang="scss" module>
.exampleNoteRoot {
	border-radius: var(--MI-radius);
	border: var(--MI_THEME-panelBorder);
	background: var(--MI_THEME-panel);
}

.divider {
	height: 1px;
	background: var(--MI_THEME-divider);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"initialTutorialNoteDescription": "Posts on Misskey are called 'Notes.' Notes are arranged chronologically on the timeline and are updated in real-time.",
	"reply": "رد",
	"initialTutorialNoteReply": "Click on this button to reply to a message. It's also possible to reply to replies, continuing the conversation like a thread.",
	"renote": "أعد النشر",
	"initialTutorialNoteRenote": "You can share that note to your own timeline. You can also quote them with your comments.",
	"reaction": "التفاعلات",
	"initialTutorialNoteReaction": "You can add reactions to the Note. More details will be explained on the next page.",
	"menu": "القائمة",
	"initialTutorialNoteMenu": "You can view Note details, copy links, and perform various other actions.",
	"initialTutorialReactionDescription": "Notes can be reacted to with various emojis. Reactions allow you to express nuances that may not be conveyed with just a 'like.'",
	"initialTutorialReactionLetsTryReacting": "Reactions can be added by clicking the '+' button on the note. Try reacting to this sample note!",
	"initialTutorialWellDone": "Well done!",
	"initialTutorialReactionReactNotification": "You'll receive real-time notifications when someone reacts to your note.",
	"initialTutorialReactionReactDone": "You can undo a reaction by pressing the '-' button."
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"initialTutorialNoteDescription": "Les publicacions a Misskey es diuen 'Notes'. Les Notes s'ordenen cronològicament a la línia de temps i s'actualitzen de forma automàtica.",
	"reply": "Respostes",
	"initialTutorialNoteReply": "Fes clic en aquest botó per contestar a un missatge. També és possible contestar a una contestació, continuant la conversació en forma de fil.",
	"renote": "Impulsar",
	"initialTutorialNoteRenote": "Pots compartir una Nota a la teva pròpia línia de temps. Inclús pots citar-les amb els teus comentaris.",
	"reaction": "Reacció ",
	"initialTutorialNoteReaction": "Pots afegir reaccions a les Notes. Entrarem més en detall a la pròxima pàgina.",
	"menu": "Menú",
	"initialTutorialNoteMenu": "Pots veure els detalls de les Notes, copiar enllaços i fer diferents accions.",
	"initialTutorialReactionDescription": "Es poden reaccionar a les Notes amb diferents emoticones. Les reaccions et permeten expressar matisos que hi són més enllà d'un simple m'agrada.",
	"initialTutorialReactionLetsTryReacting": "Es poden afegir reaccions fent clic al botó '+'. Prova reaccionant a aquesta nota!",
	"initialTutorialWellDone": "Ben fet!",
	"initialTutorialReactionReactNotification": "Rebràs notificacions en temps real quan un usuari reaccioni a les teves notes.",
	"initialTutorialReactionReactDone": "Pots desfer una reacció fent clic al botó '-'."
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"initialTutorialNoteDescription": "Posts on Misskey are called 'Notes.' Notes are arranged chronologically on the timeline and are updated in real-time.",
	"reply": "Odpovědět",
	"initialTutorialNoteReply": "Click on this button to reply to a message. It's also possible to reply to replies, continuing the conversation like a thread.",
	"renote": "Přeposlat",
	"initialTutorialNoteRenote": "You can share that note to your own timeline. You can also quote them with your comments.",
	"reaction": "Reakce",
	"initialTutorialNoteReaction": "You can add reactions to the Note. More details will be explained on the next page.",
	"menu": "Menu",
	"initialTutorialNoteMenu": "You can view Note details, copy links, and perform various other actions.",
	"initialTutorialReactionDescription": "Notes can be reacted to with various emojis. Reactions allow you to express nuances that may not be conveyed with just a 'like.'",
	"initialTutorialReactionLetsTryReacting": "Reactions can be added by clicking the '+' button on the note. Try reacting to this sample note!",
	"initialTutorialWellDone": "Well done!",
	"initialTutorialReactionReactNotification": "You'll receive real-time notifications when someone reacts to your note.",
	"initialTutorialReactionReactDone": "You can undo a reaction by pressing the '-' button."
}
</locale>

<locale lang="json" locale="da-DK">
{
	"initialTutorialNoteDescription": "Posts on Misskey are called 'Notes.' Notes are arranged chronologically on the timeline and are updated in real-time.",
	"reply": "Reply",
	"initialTutorialNoteReply": "Click on this button to reply to a message. It's also possible to reply to replies, continuing the conversation like a thread.",
	"renote": "Renote",
	"initialTutorialNoteRenote": "You can share that note to your own timeline. You can also quote them with your comments.",
	"reaction": "Reactions",
	"initialTutorialNoteReaction": "You can add reactions to the Note. More details will be explained on the next page.",
	"menu": "Menu",
	"initialTutorialNoteMenu": "You can view Note details, copy links, and perform various other actions.",
	"initialTutorialReactionDescription": "Notes can be reacted to with various emojis. Reactions allow you to express nuances that may not be conveyed with just a 'like.'",
	"initialTutorialReactionLetsTryReacting": "Reactions can be added by clicking the '+' button on the note. Try reacting to this sample note!",
	"initialTutorialWellDone": "Well done!",
	"initialTutorialReactionReactNotification": "You'll receive real-time notifications when someone reacts to your note.",
	"initialTutorialReactionReactDone": "You can undo a reaction by pressing the '-' button."
}
</locale>

<locale lang="json" locale="de-DE">
{
	"initialTutorialNoteDescription": "Beiträge auf Misskey heißen \"Notizen\". Notizen werden chronologisch in der Chronik angeordnet und in Echtzeit aktualisiert.",
	"reply": "Antworten",
	"initialTutorialNoteReply": "Klicke auf diesen Button, um auf eine Nachricht zu antworten. Es ist auch möglich, auf Antworten zu antworten und die Unterhaltung wie einen Thread fortzusetzen.",
	"renote": "Renote",
	"initialTutorialNoteRenote": "Du kannst diese Notiz in deiner eigenen Chronik teilen. Du kannst sie auch mit deinen Kommentaren zitieren.",
	"reaction": "Reaktionen",
	"initialTutorialNoteReaction": "Du kannst der Notiz Reaktionen hinzufügen. Weitere Einzelheiten werden auf der nächsten Seite erläutert.",
	"menu": "Menü",
	"initialTutorialNoteMenu": "Du kannst Details zu Notizen anzeigen, Links kopieren und verschiedene andere Aktionen durchführen.",
	"initialTutorialReactionDescription": "Auf Notizen kann mit verschiedenen Emojis reagiert werden. Reaktionen ermöglichen es dir, Nuancen auszudrücken, die mit einem einfachen „Gefällt mir“ vielleicht nicht ausgedrückt werden können.",
	"initialTutorialReactionLetsTryReacting": "Reaktionen können durch Klicken auf die Schaltfläche „+“ in der Notiz hinzugefügt werden. Versuche, auf diese Beispielnotiz zu reagieren!",
	"initialTutorialWellDone": "Gut gemacht!",
	"initialTutorialReactionReactNotification": "Du erhältst Echtzeit-Benachrichtigungen, wenn jemand auf deine Notiz reagiert.",
	"initialTutorialReactionReactDone": "Du kannst eine Reaktion zurücknehmen, indem du auf den '-' Button drückst."
}
</locale>

<locale lang="json" locale="en-US">
{
	"initialTutorialNoteDescription": "Posts on Misskey are called 'Notes.' Notes are arranged chronologically on the timeline and are updated in real-time.",
	"reply": "Reply",
	"initialTutorialNoteReply": "Click on this button to reply to a message. It's also possible to reply to replies, continuing the conversation like a thread.",
	"renote": "Renote",
	"initialTutorialNoteRenote": "You can share that note to your own timeline. You can also quote them with your comments.",
	"reaction": "Reactions",
	"initialTutorialNoteReaction": "You can add reactions to the Note. More details will be explained on the next page.",
	"menu": "Menu",
	"initialTutorialNoteMenu": "You can view Note details, copy links, and perform various other actions.",
	"initialTutorialReactionDescription": "Notes can be reacted to with various emojis. Reactions allow you to express nuances that may not be conveyed with just a 'like.'",
	"initialTutorialReactionLetsTryReacting": "Reactions can be added by clicking the '+' button on the note. Try reacting to this sample note!",
	"initialTutorialWellDone": "Well done!",
	"initialTutorialReactionReactNotification": "You'll receive real-time notifications when someone reacts to your note.",
	"initialTutorialReactionReactDone": "You can undo a reaction by pressing the '-' button."
}
</locale>

<locale lang="json" locale="es-ES">
{
	"initialTutorialNoteDescription": "Las publicaciones en Misskey se llaman 'Notas'. Las notas se ordenan de forma cronológica en la línea de tiempo y se actualizan en tiempo real.",
	"reply": "Responder",
	"initialTutorialNoteReply": "Pulsa en este botón para contestar a un mensaje. También es posible contestar a otras contestaciones, continuando así la conversación como un hilo.",
	"renote": "Renotar",
	"initialTutorialNoteRenote": "Puedes compartir esa nota en tu propia línea de tiempo. También puedes añadir una cita con tus comentarios.",
	"reaction": "Reacción",
	"initialTutorialNoteReaction": "Puedes añadir reacciones a la Nota. Se explicarán más detalles en la siguiente página.",
	"menu": "Menú",
	"initialTutorialNoteMenu": "Puedes ver los detalles de la Nota, copiar enlaces, y realizar otras acciones.",
	"initialTutorialReactionDescription": "Se puede reaccionar a las Notas con diferentes emojis. Las reacciones te permiten expresar matices que no se pueden transmitir con un simple 'me gusta'.",
	"initialTutorialReactionLetsTryReacting": "Puedes añadir reacciones pulsando en el botón '+' de la nota. ¡Intenta reaccionar a esta nota de ejemplo!",
	"initialTutorialWellDone": "¡Bien hecho!",
	"initialTutorialReactionReactNotification": "Recibirás notificaciones en tiempo real cuando alguien reaccione a tu nota.",
	"initialTutorialReactionReactDone": "Puedes deshacer una reacción pulsando en el botón '-'."
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"initialTutorialNoteDescription": "Les messages sur Misskey sont appelés des « notes » . Les notes sont classées par ordre chronologique sur le fil et sont mises à jour en temps réel.",
	"reply": "Répondre",
	"initialTutorialNoteReply": "Vous pouvez répondre aux messages. Vous pouvez également répondre aux réponses et poursuivre la conversation comme un fil de discussion.",
	"renote": "Renoter",
	"initialTutorialNoteRenote": "Vous pouvez partager cette note sur votre propre fil. Vous pouvez aussi ajouter du texte en citant.",
	"reaction": "Réactions",
	"initialTutorialNoteReaction": "Vous pouvez ajouter des réactions. Les détails sont expliqués à la page suivante.",
	"menu": "Menu",
	"initialTutorialNoteMenu": "Vous pouvez afficher les détails de la note, copier le lien et effectuer d'autres actions.",
	"initialTutorialReactionDescription": "Vous pouvez ajouter des « réactions » aux notes. Les réactions vous permettent d'exprimer à l'aise des nuances qui ne peuvent pas être exprimées par des mentions j'aime.",
	"initialTutorialReactionLetsTryReacting": "Des réactions peuvent être ajoutées en cliquant sur le bouton « + » de la note. Essayez d'ajouter une réaction à cet exemple de note !",
	"initialTutorialWellDone": "Bien joué !",
	"initialTutorialReactionReactNotification": "Vous recevez des notifications en temps réel lorsque quelqu'un réagit à votre note.",
	"initialTutorialReactionReactDone": "Vous pouvez annuler la réaction en cliquant sur le bouton « - » ."
}
</locale>

<locale lang="json" locale="id-ID">
{
	"initialTutorialNoteDescription": "Postingan di Misskey disebut sebagai 'Catatan'. Catatan ditampilkan secara kronologis pada lini masa dan dimutakhirkan secara real-time.",
	"reply": "Balas",
	"initialTutorialNoteReply": "Klik pada tombol ini untuk membalas ke sebuah pesan. Bisa juga untuk membalas ke sebuah balasan dan melanjutkannya seperti percakapan selayaknya utas.",
	"renote": "Renote",
	"initialTutorialNoteRenote": "Kamu dapat membagikan catatan ke lini masa milikmu. Kamu juga dapat mengutipnya dengan komentarmu.",
	"reaction": "Reaksi",
	"initialTutorialNoteReaction": "Kamu dapat menambahkan reaksi ke Catatan. Detil lebih lanjut akan dijelaskan di halaman berikutnya.",
	"menu": "Menu",
	"initialTutorialNoteMenu": "Kamu dapat melihat detil catatan, menyalin tautan, dan melakukan aksi lainnya.",
	"initialTutorialReactionDescription": "Catatan dapat direaksi dengan berbagai emoji. Reaksi memperbolehkan kamu untuk mengekspresikan nuansa yang tidak dapat disampaikan hanya dengan sebuah \"suka\".",
	"initialTutorialReactionLetsTryReacting": "Reaksi dapat ditambahkan dengan mengklik tombol '+' pada catatan. Coba lakukan mereaksi contoh catatan ini!",
	"initialTutorialWellDone": "Kerja bagus!",
	"initialTutorialReactionReactNotification": "Kamu akan menerima notifikasi real0time ketika seseorang mereaksi catatan kamu.",
	"initialTutorialReactionReactDone": "Kamu dapat mengurungkan reaksi dengan menekan tombol '-'."
}
</locale>

<locale lang="json" locale="it-IT">
{
	"initialTutorialNoteDescription": "Gli status su Misskey sono chiamati \"Note\". Le Note sono elencate in ordine cronologico nelle timeline e vengono aggiornate in tempo reale.",
	"reply": "Rispondi",
	"initialTutorialNoteReply": "Puoi rispondere alle Note, alle altre risposte e dialogare in conversazioni.",
	"renote": "Rinota",
	"initialTutorialNoteRenote": "Puoi ri-condividere le Note, ritorneranno sulla Timeline. Aggiungendo del testo, scriverai una Citazione.",
	"reaction": "Reazioni",
	"initialTutorialNoteReaction": "Puoi aggiungere una reazione. Nella pagina successiva ti spiego come.",
	"menu": "Menù",
	"initialTutorialNoteMenu": "Per altre attività, ad esempio, vedere i dettagli delle Note o copiare i collegamenti.",
	"initialTutorialReactionDescription": "Reazioni alle Note. Le sensazioni che non si possono descrivere con \"Mi piace\" si esprimono facilmente con le reazioni.",
	"initialTutorialReactionLetsTryReacting": "Puoi aggiungere una Reazione cliccando il bottone \"+\" (più) della relativa Nota. Prova ad aggiungerne una a questa Nota di esempio!",
	"initialTutorialWellDone": "Ottimo lavoro!",
	"initialTutorialReactionReactNotification": "Quando qualcuno reagisce alle tue Note, ricevi una notifica in tempo reale.",
	"initialTutorialReactionReactDone": "Annulla la tua Reazione premendo il bottone \"ー\" (meno)"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"initialTutorialNoteDescription": "Misskeyでの投稿は「ノート」と呼びます。ノートはタイムラインに時系列で並んでいて、リアルタイムで更新されていきます。",
	"reply": "返信",
	"initialTutorialNoteReply": "返信することができます。返信に対しての返信も可能で、スレッドのように会話を続けることもできます。",
	"renote": "リノート",
	"initialTutorialNoteRenote": "そのノートを自分のタイムラインに流して共有することができます。テキストを追加して引用することも可能です。",
	"reaction": "リアクション",
	"initialTutorialNoteReaction": "リアクションをつけることができます。詳しくは次のページで解説します。",
	"menu": "メニュー",
	"initialTutorialNoteMenu": "ノートの詳細を表示したり、リンクをコピーしたりなどの様々な操作が行えます。",
	"initialTutorialReactionDescription": "ノートには「リアクション」をつけることができます。「いいね」では伝わらないニュアンスも、リアクションで簡単・気軽に表現できます。",
	"initialTutorialReactionLetsTryReacting": "リアクションは、ノートの「＋」ボタンをクリックするとつけられます。試しにこのサンプルのノートにリアクションをつけてみてください！",
	"initialTutorialWellDone": "よくできました",
	"initialTutorialReactionReactNotification": "あなたのノートが誰かにリアクションされると、リアルタイムで通知を受け取ります。",
	"initialTutorialReactionReactDone": "「ー」ボタンを押すとリアクションを取り消すことができます。"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"initialTutorialNoteDescription": "Misskeyでの投稿は「ノート」って呼ばれてんで。ノートは順々にタイムラインに載ってて、リアルタイムで新しくなってくで。",
	"reply": "返事",
	"initialTutorialNoteReply": "返信もできるで。返信の返信もできるから、スレッドっぽく会話をそのまま続けれもするで。",
	"renote": "リノート",
	"initialTutorialNoteRenote": "そのノートを自分のタイムラインに流して共有できるで。テキスト入れて引用してもええな。",
	"reaction": "ツッコミ",
	"initialTutorialNoteReaction": "ツッコミをつけることもできるで。細かいことは次のページや。",
	"menu": "メニュー",
	"initialTutorialNoteMenu": "ノートの詳細を出したり、リンクをコピーしたり、いろいろできんねん。",
	"initialTutorialReactionDescription": "ノートには「ツッコミ」できんねん。「いいね」とか何言っとるかわからんし、簡単に表現できるのはええことやん？",
	"initialTutorialReactionLetsTryReacting": "ノートの「＋」ボタンでツッコめるわ。試しに下のノートにツッコんでみ。",
	"initialTutorialWellDone": "やるやん",
	"initialTutorialReactionReactNotification": "あんたのノートが誰かにツッコまれたら、すぐ通知するで。",
	"initialTutorialReactionReactDone": "「ー」ボタンでツッコミやめれるで。"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"initialTutorialNoteDescription": "Posts on Misskey are called 'Notes.' Notes are arranged chronologically on the timeline and are updated in real-time.",
	"reply": "Err",
	"initialTutorialNoteReply": "Click on this button to reply to a message. It's also possible to reply to replies, continuing the conversation like a thread.",
	"renote": "Renote",
	"initialTutorialNoteRenote": "You can share that note to your own timeline. You can also quote them with your comments.",
	"reaction": "Reactions",
	"initialTutorialNoteReaction": "You can add reactions to the Note. More details will be explained on the next page.",
	"menu": "Menu",
	"initialTutorialNoteMenu": "You can view Note details, copy links, and perform various other actions.",
	"initialTutorialReactionDescription": "Notes can be reacted to with various emojis. Reactions allow you to express nuances that may not be conveyed with just a 'like.'",
	"initialTutorialReactionLetsTryReacting": "Reactions can be added by clicking the '+' button on the note. Try reacting to this sample note!",
	"initialTutorialWellDone": "Well done!",
	"initialTutorialReactionReactNotification": "You'll receive real-time notifications when someone reacts to your note.",
	"initialTutorialReactionReactDone": "You can undo a reaction by pressing the '-' button."
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"initialTutorialNoteDescription": "Posts on Misskey are called 'Notes.' Notes are arranged chronologically on the timeline and are updated in real-time.",
	"reply": "ಉತ್ತರಿಸು",
	"initialTutorialNoteReply": "Click on this button to reply to a message. It's also possible to reply to replies, continuing the conversation like a thread.",
	"renote": "Renote",
	"initialTutorialNoteRenote": "You can share that note to your own timeline. You can also quote them with your comments.",
	"reaction": "Reactions",
	"initialTutorialNoteReaction": "You can add reactions to the Note. More details will be explained on the next page.",
	"menu": "Menu",
	"initialTutorialNoteMenu": "You can view Note details, copy links, and perform various other actions.",
	"initialTutorialReactionDescription": "Notes can be reacted to with various emojis. Reactions allow you to express nuances that may not be conveyed with just a 'like.'",
	"initialTutorialReactionLetsTryReacting": "Reactions can be added by clicking the '+' button on the note. Try reacting to this sample note!",
	"initialTutorialWellDone": "Well done!",
	"initialTutorialReactionReactNotification": "You'll receive real-time notifications when someone reacts to your note.",
	"initialTutorialReactionReactDone": "You can undo a reaction by pressing the '-' button."
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"initialTutorialNoteDescription": "미스키에서는 게시물을 '노트'라고 합니다. 노트는 타임라인에 시간순으로 정렬되어 있고, 실시간으로 갱신됩니다.",
	"reply": "답글",
	"initialTutorialNoteReply": "답글을 달 수 있습니다. 답글에 답글을 달 수도 있고 글타래처럼 대화를 이어갈 수도 있습니다.",
	"renote": "리노트",
	"initialTutorialNoteRenote": "그 노트를 자기 타임라인에 가져와서 공유하는 것이 가능합니다. 글을 추가해서 인용하는 것도 가능합니다.",
	"reaction": "리액션",
	"initialTutorialNoteReaction": "리액션을 다는 것이 가능합니다. 다음 페이지에서 자세한 설명을 볼 수 있습니다.",
	"menu": "메뉴",
	"initialTutorialNoteMenu": "노트의 상세 정보를 표시하거나, 링크를 복사하는 등의 다양한 조작을 할 수 있습니다.",
	"initialTutorialReactionDescription": "노트에 '리액션'을 보낼 수 있습니다. '좋아요'만으로는 충분히 전해지지 않는 감정을, 이모지에 실어서 가볍게 보낼 수 있습니다.",
	"initialTutorialReactionLetsTryReacting": "리액션은 노트의 '+' 버튼을 클릭하여 붙일 수 있습니다. 지금 표시되는 샘플 노트에 리액션을 달아 보세요!",
	"initialTutorialWellDone": "잘 하셨습니다",
	"initialTutorialReactionReactNotification": "누군가가 나의 노트에 리액션을 보내면 실시간으로 알림을 받게 됩니다.",
	"initialTutorialReactionReactDone": "'-' 버튼을 눌러서 리액션을 취소할 수 있습니다."
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"initialTutorialNoteDescription": "Posts on Misskey are called 'Notes.' Notes are arranged chronologically on the timeline and are updated in real-time.",
	"reply": "Antwoord",
	"initialTutorialNoteReply": "Click on this button to reply to a message. It's also possible to reply to replies, continuing the conversation like a thread.",
	"renote": "Herdelen",
	"initialTutorialNoteRenote": "You can share that note to your own timeline. You can also quote them with your comments.",
	"reaction": "Reacties",
	"initialTutorialNoteReaction": "You can add reactions to the Note. More details will be explained on the next page.",
	"menu": "Menu",
	"initialTutorialNoteMenu": "You can view Note details, copy links, and perform various other actions.",
	"initialTutorialReactionDescription": "Notes can be reacted to with various emojis. Reactions allow you to express nuances that may not be conveyed with just a 'like.'",
	"initialTutorialReactionLetsTryReacting": "Reactions can be added by clicking the '+' button on the note. Try reacting to this sample note!",
	"initialTutorialWellDone": "Well done!",
	"initialTutorialReactionReactNotification": "You'll receive real-time notifications when someone reacts to your note.",
	"initialTutorialReactionReactDone": "You can undo a reaction by pressing the '-' button."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"initialTutorialNoteDescription": "Posts on Misskey are called 'Notes.' Notes are arranged chronologically on the timeline and are updated in real-time.",
	"reply": "Svar",
	"initialTutorialNoteReply": "Click on this button to reply to a message. It's also possible to reply to replies, continuing the conversation like a thread.",
	"renote": "Renote",
	"initialTutorialNoteRenote": "You can share that note to your own timeline. You can also quote them with your comments.",
	"reaction": "Reaksjon",
	"initialTutorialNoteReaction": "You can add reactions to the Note. More details will be explained on the next page.",
	"menu": "Meny",
	"initialTutorialNoteMenu": "You can view Note details, copy links, and perform various other actions.",
	"initialTutorialReactionDescription": "Notes can be reacted to with various emojis. Reactions allow you to express nuances that may not be conveyed with just a 'like.'",
	"initialTutorialReactionLetsTryReacting": "Reactions can be added by clicking the '+' button on the note. Try reacting to this sample note!",
	"initialTutorialWellDone": "Well done!",
	"initialTutorialReactionReactNotification": "You'll receive real-time notifications when someone reacts to your note.",
	"initialTutorialReactionReactDone": "You can undo a reaction by pressing the '-' button."
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"initialTutorialNoteDescription": "Posts on Misskey are called 'Notes.' Notes are arranged chronologically on the timeline and are updated in real-time.",
	"reply": "Odpowiedz",
	"initialTutorialNoteReply": "Click on this button to reply to a message. It's also possible to reply to replies, continuing the conversation like a thread.",
	"renote": "Udostępnij",
	"initialTutorialNoteRenote": "You can share that note to your own timeline. You can also quote them with your comments.",
	"reaction": "Reakcja",
	"initialTutorialNoteReaction": "You can add reactions to the Note. More details will be explained on the next page.",
	"menu": "Menu",
	"initialTutorialNoteMenu": "You can view Note details, copy links, and perform various other actions.",
	"initialTutorialReactionDescription": "Notes can be reacted to with various emojis. Reactions allow you to express nuances that may not be conveyed with just a 'like.'",
	"initialTutorialReactionLetsTryReacting": "Reactions can be added by clicking the '+' button on the note. Try reacting to this sample note!",
	"initialTutorialWellDone": "Well done!",
	"initialTutorialReactionReactNotification": "You'll receive real-time notifications when someone reacts to your note.",
	"initialTutorialReactionReactDone": "You can undo a reaction by pressing the '-' button."
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"initialTutorialNoteDescription": "Publicações no Misskey chamam-se 'Notas'. Notas são organizadas cronologicamente na linha do tempo e atualizam em tempo real.",
	"reply": "Responder",
	"initialTutorialNoteReply": "Clique nesse botão para responder a uma mensagem. Também é possível responder respostas, continuando a conversa como uma \"thread\".",
	"renote": "Repostar",
	"initialTutorialNoteRenote": "Você pode compartilhar essa nota na sua linha do tempo. Você também pode citá-la com os seus comentários.",
	"reaction": "Reações",
	"initialTutorialNoteReaction": "Você pode adicionar reações à nota. Mais detalhes serão explicados na próxima página.",
	"menu": "Menu\n",
	"initialTutorialNoteMenu": "Você pode ver detalhes da nota, copiar links e realizar outras ações.",
	"initialTutorialReactionDescription": "É possível reagir às notas com diversos emojis. Reações permitem que você expresse sutilezas que não são possíveis apenas com uma curtida.",
	"initialTutorialReactionLetsTryReacting": "Reações podem ser adicionadas clicando no botão \"+\". Tente reagir à nota de exemplo.",
	"initialTutorialWellDone": "Ótimo!",
	"initialTutorialReactionReactNotification": "Você receberá notificações em tempo real quando alguém reagir à sua nota.",
	"initialTutorialReactionReactDone": "Você pode desfazer uma reação ao selecionar o botão \"-\"."
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"initialTutorialNoteDescription": "Посты в Misskey называются 'Заметками.' Заметки отсортированы в хронологическом порядке в ленте и обновляются в режиме реального времени.",
	"reply": "Ответ",
	"initialTutorialNoteReply": "Нажмите на кнопку для того что бы ответить на сообщение. Так же можно ответить на ответ, продолжая дискуссию.",
	"renote": "Репост",
	"initialTutorialNoteRenote": "Вы можете поделиться этой заметкой в своей ленте. Вы так же можете процитировать её в ваших комментариях.",
	"reaction": "Реакции",
	"initialTutorialNoteReaction": "Вы можете ставить реакции на заметки. Подробнее на следующей странице.",
	"menu": "Меню",
	"initialTutorialNoteMenu": "Вы можете посмотреть данные о заметке, копировать ссылки и выполнять прочие действия.",
	"initialTutorialReactionDescription": "На заметки можно ставить разные реакции. Реакции позволяют вам передавать такие нюансы, которые не передать простым \"лайком\"",
	"initialTutorialReactionLetsTryReacting": "Реакцию можно поставить нажав кнопку \"+\" на заметке. Попробуйте поставить реакцию на эту заметку!",
	"initialTutorialWellDone": "Отлично!",
	"initialTutorialReactionReactNotification": "Вы получите уведомление в реальном времени когда кто-то поставит реакцию на вашу заметку.",
	"initialTutorialReactionReactDone": "Вы можете убрать поставленную реакцию нажав на кнопку \"-\"."
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"initialTutorialNoteDescription": "Posts on Misskey are called 'Notes.' Notes are arranged chronologically on the timeline and are updated in real-time.",
	"reply": "Odpovedať",
	"initialTutorialNoteReply": "Click on this button to reply to a message. It's also possible to reply to replies, continuing the conversation like a thread.",
	"renote": "Preposlať",
	"initialTutorialNoteRenote": "You can share that note to your own timeline. You can also quote them with your comments.",
	"reaction": "Reakcie",
	"initialTutorialNoteReaction": "You can add reactions to the Note. More details will be explained on the next page.",
	"menu": "Menu",
	"initialTutorialNoteMenu": "You can view Note details, copy links, and perform various other actions.",
	"initialTutorialReactionDescription": "Notes can be reacted to with various emojis. Reactions allow you to express nuances that may not be conveyed with just a 'like.'",
	"initialTutorialReactionLetsTryReacting": "Reactions can be added by clicking the '+' button on the note. Try reacting to this sample note!",
	"initialTutorialWellDone": "Well done!",
	"initialTutorialReactionReactNotification": "You'll receive real-time notifications when someone reacts to your note.",
	"initialTutorialReactionReactDone": "You can undo a reaction by pressing the '-' button."
}
</locale>

<locale lang="json" locale="th-TH">
{
	"initialTutorialNoteDescription": "โพสต์ใน Misskey เรียกว่า “โน้ต” ซึ่งจะจัดเรียงตามลำดับเวลาบนไทม์ไลน์และอัปเดตแบบเรียลไทม์",
	"reply": "ตอบกลับ",
	"initialTutorialNoteReply": "คุณสามารถตอบกลับได้ และคุณยังสามารถตอบกลับใส่การตอบกลับเพื่อสนทนาต่อได้เสมือนดั่งเธรด",
	"renote": "รีโน้ต",
	"initialTutorialNoteRenote": "คุณสามารถแชร์โน้ตไปยังไทม์ไลน์ของคุณเอง คุณยังสามารถเพิ่มข้อความและเครื่องหมายคำพูดได้",
	"reaction": "รีแอคชั่น",
	"initialTutorialNoteReaction": "คุณสามารถเพิ่มรีแอคชั่นได้ รายละเอียดจะอธิบายอยู่ในหน้าถัดไป",
	"menu": "เมนู",
	"initialTutorialNoteMenu": "คุณสามารถดูรายละเอียดโน้ต คัดลอกลิงก์ และดำเนินการอื่นๆ ได้",
	"initialTutorialReactionDescription": "โน้ตสามารถ“รีแอคชั่น”ด้วยเอโมจิต่างๆ ซึ่งทำให้สามารถแสดงความแตกต่างเล็กๆ น้อยๆ ที่อาจไม่สามารถสื่อออกมาได้ด้วยการแค่การกด “ถูกใจ”",
	"initialTutorialReactionLetsTryReacting": "คุณสามารถเพิ่มรีแอคชั่นได้ด้วยการคลิกปุ่ม “+” บนโน้ต ลองรีแอคชั่นโน้ตตัวอย่างนี้ดูสิ!",
	"initialTutorialWellDone": "ทำได้ดีมาก!",
	"initialTutorialReactionReactNotification": "คุณจะได้รับการแจ้งเตือนแบบเรียลไทม์เมื่อมีคนตอบรีแอคชั่นโน้ตของคุณ",
	"initialTutorialReactionReactDone": "คุณสามารถยกเลิกรีแอคชั่นได้โดยการกดปุ่ม “-”"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"initialTutorialNoteDescription": "Misskey'deki gönderiler “Notlar” olarak adlandırılır. Notlar panoda kronolojik olarak düzenlenir ve gerçek zamanlı olarak güncellenir.",
	"reply": "Yanıtla",
	"initialTutorialNoteReply": "Bir mesaja yanıt vermek için bu düğmeye tıklayın. Yanıtlara yanıt vermek de mümkündür, böylece konuşma bir konu başlığı gibi devam eder.",
	"renote": "Renote",
	"initialTutorialNoteRenote": "Bu notu kendi panonda paylaşabilirsin. Ayrıca yorumlarınla birlikte alıntı da yapabilirsin.",
	"reaction": "Tepki",
	"initialTutorialNoteReaction": "Not'a tepkiler ekleyebilirsin. Daha fazla ayrıntı bir sonraki sayfada açıklanacak.",
	"menu": "Menü",
	"initialTutorialNoteMenu": "Not ayrıntılarını görüntüleyebilir, bağlantıları kopyalayabilir ve çeşitli diğer işlemleri gerçekleştirebilirsin.",
	"initialTutorialReactionDescription": "Notlara çeşitli emojilerle tepki verilebilir. Tepkiler, sadece bir ‘beğeni’ ile ifade edilemeyen nüansları ifade etmeni sağlar.",
	"initialTutorialReactionLetsTryReacting": "Notun üzerindeki ‘+’ düğmesine tıklayarak tepkiler eklenebilir. Bu örnek nota tepki verin!",
	"initialTutorialWellDone": "Tebrikler!",
	"initialTutorialReactionReactNotification": "Biri notunuza tepki verdiğinde gerçek zamanlı bildirimler alacaksınız.",
	"initialTutorialReactionReactDone": "“-” düğmesine basarak bir tepkiyi geri alabilirsin."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"initialTutorialNoteDescription": "Posts on Misskey are called 'Notes.' Notes are arranged chronologically on the timeline and are updated in real-time.",
	"reply": "Reply",
	"initialTutorialNoteReply": "Click on this button to reply to a message. It's also possible to reply to replies, continuing the conversation like a thread.",
	"renote": "Renote",
	"initialTutorialNoteRenote": "You can share that note to your own timeline. You can also quote them with your comments.",
	"reaction": "Reactions",
	"initialTutorialNoteReaction": "You can add reactions to the Note. More details will be explained on the next page.",
	"menu": "Menu",
	"initialTutorialNoteMenu": "You can view Note details, copy links, and perform various other actions.",
	"initialTutorialReactionDescription": "Notes can be reacted to with various emojis. Reactions allow you to express nuances that may not be conveyed with just a 'like.'",
	"initialTutorialReactionLetsTryReacting": "Reactions can be added by clicking the '+' button on the note. Try reacting to this sample note!",
	"initialTutorialWellDone": "Well done!",
	"initialTutorialReactionReactNotification": "You'll receive real-time notifications when someone reacts to your note.",
	"initialTutorialReactionReactDone": "You can undo a reaction by pressing the '-' button."
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"initialTutorialNoteDescription": "Пости у Misskey називають \"Нотатки\". Нотатки відсортовані хронологічно й  оновлюються у реальному часі.",
	"reply": "Відповісти",
	"initialTutorialNoteReply": "Натисніть на кнопку, щоб відповісти на повідомлення. Відповідати на відповіді також можливо.",
	"renote": "Поширити",
	"initialTutorialNoteRenote": "Ви можете поділитися цією нотаткою у своїй стрічці. Ви також можете цитувати її у ваших коментарях.",
	"reaction": "Реакції",
	"initialTutorialNoteReaction": "Ви можете додавати реакції на нотатки. Детальніше це буде пояснено на наступній сторінці.",
	"menu": "Меню",
	"initialTutorialNoteMenu": "Ви можете переглядати дані о нотатці, копіювати посилання, й виконувати інші дії.",
	"initialTutorialReactionDescription": "На нотатки можна додавати різні реакції. Реакції дозволяють вам передавати такі нюанси, які не передати звичайною \"вподобайкою\".",
	"initialTutorialReactionLetsTryReacting": "Реакції можна додавати натискаючи на кнопку \"+\" на нотатці. Спробуйте додати реакцію на цю прикладкову нотатку!",
	"initialTutorialWellDone": "Ай, молодець! Відмінно!",
	"initialTutorialReactionReactNotification": "Ви отримаєте оголошення у реальному часі, якщо хтось додасть реакцію на вашу нотатку.",
	"initialTutorialReactionReactDone": "Ви можете скасувати реакцію натискаючи на кнопку \"-\"."
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"initialTutorialNoteDescription": "Các bài đăng trên Misskey được gọi là 'Bài Viết'. Ghi chú được sắp xếp theo thứ tự thời gian trên dòng thời gian và được cập nhật theo thời gian thực.",
	"reply": "Trả lời",
	"initialTutorialNoteReply": "Click on this button to reply to a message. It's also possible to reply to replies, continuing the conversation like a thread.",
	"renote": "Đăng lại",
	"initialTutorialNoteRenote": "You can share that note to your own timeline. You can also quote them with your comments.",
	"reaction": "Biểu cảm",
	"initialTutorialNoteReaction": "You can add reactions to the Note. More details will be explained on the next page.",
	"menu": "Menu",
	"initialTutorialNoteMenu": "You can view Note details, copy links, and perform various other actions.",
	"initialTutorialReactionDescription": "Notes can be reacted to with various emojis. Reactions allow you to express nuances that may not be conveyed with just a 'like.'",
	"initialTutorialReactionLetsTryReacting": "Reactions can be added by clicking the '+' button on the note. Try reacting to this sample note!",
	"initialTutorialWellDone": "Làm tốt!",
	"initialTutorialReactionReactNotification": "You'll receive real-time notifications when someone reacts to your note.",
	"initialTutorialReactionReactDone": "You can undo a reaction by pressing the '-' button."
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"initialTutorialNoteDescription": "在 Misskey 上发表的文章称为 “帖子”。帖子在时间线上按照时间顺序排列，并实时更新。",
	"reply": "回复",
	"initialTutorialNoteReply": "用来回复帖子。可以对回复进行回复，从而形成一串对话。",
	"renote": "转发",
	"initialTutorialNoteRenote": "用来将帖子共享到自己的时间线上。也可以加上自己的文字然后引用它。",
	"reaction": "回应",
	"initialTutorialNoteReaction": "用来添加回应。详细信息将在下一页进行说明。",
	"menu": "菜单",
	"initialTutorialNoteMenu": "用来进行例如显示帖子详情、复制链接等各种各样的操作。",
	"initialTutorialReactionDescription": "您可以在帖子中添加 “回应”。 使用回应可以轻松地表达 “点赞” 无法传达的心情。",
	"initialTutorialReactionLetsTryReacting": "点击帖子下方的 “＋” 可以添加回应。试着给这个示例帖子添加一个回应！",
	"initialTutorialWellDone": "做得好",
	"initialTutorialReactionReactNotification": "当您的帖子被某人添加了回应时，将实时收到通知。",
	"initialTutorialReactionReactDone": "点击 “ー” 可以取消回应。"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"initialTutorialNoteDescription": "在Misskey上發布的內容稱為「貼文」。貼文在時間軸上按時間順序排列，並即時更新。",
	"reply": "回覆",
	"initialTutorialNoteReply": "您可以回覆貼文，並像討論串一樣繼續對話。",
	"renote": "轉發",
	"initialTutorialNoteRenote": "您可以將此貼文分享到自己的時間軸。您也可以在引用時添加文字。",
	"reaction": "反應",
	"initialTutorialNoteReaction": "您可以加入反應。詳細資訊將在下一頁進行說明。",
	"menu": "選單",
	"initialTutorialNoteMenu": "可執行各種操作，如查看貼文詳細資訊和複製連結。",
	"initialTutorialReactionDescription": "您可以在貼文中加上「反應」。有些用「最愛/大心」無法傳達的感想，可以用反應輕鬆地表達出來。",
	"initialTutorialReactionLetsTryReacting": "按一下貼文上的「+」按鈕即可加入反應。試著對此範例貼文加上反應！",
	"initialTutorialWellDone": "做得好",
	"initialTutorialReactionReactNotification": "當有人對您的貼文做出反應時會即時接收到通知。",
	"initialTutorialReactionReactDone": "按下「-」按鈕可以取消反應。"
}
</locale>
