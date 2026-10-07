<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div style="text-align: center; padding: 0 16px;">{{ $locale.sfc.initialTutorialPostNoteDescription1 }}</div>
	<MkPostForm :class="$style.exampleRoot" :mock="true" :autofocus="false"/>
	<MkFormSection>
		<template #label>{{ $locale.sfc.visibility }}</template>
		<div class="_gaps">
			<div>{{ $locale.sfc.initialTutorialPostNoteVisibilityDescription }}</div>
			<div><i class="ti ti-world"></i> <b>{{ $locale.sfc.visibilityPublic }}</b> … {{ $locale.sfc.initialTutorialPostNoteVisibilityPublic }}</div>
			<div><i class="ti ti-home"></i> <b>{{ $locale.sfc.visibilityHome }}</b> … {{ $locale.sfc.initialTutorialPostNoteVisibilityHome }}</div>
			<div><i class="ti ti-lock"></i> <b>{{ $locale.sfc.visibilityFollowers }}</b> … {{ $locale.sfc.initialTutorialPostNoteVisibilityFollowers }}</div>
			<div class="_gaps_s">
				<div><i class="ti ti-mail"></i> <b>{{ $locale.sfc.visibilitySpecified }}</b> … {{ $locale.sfc.initialTutorialPostNoteVisibilityDirect }}</div>
				<MkInfo :warn="true">
					<b>{{ $locale.sfc.initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1 }}</b> {{ $locale.sfc.initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2 }}
				</MkInfo>
			</div>
			<div><i class="ti ti-rocket-off"></i> <b>{{ $locale.sfc.visibilityDisableFederation }}</b> … {{ $locale.sfc.initialTutorialPostNoteVisibilityLocalOnly }}</div>
		</div>
	</MkFormSection>
	<MkFormSection>
		<template #label>{{ $locale.sfc.initialTutorialPostNoteCwTitle }}</template>
		<div class="_gaps">
			<div>{{ $locale.sfc.initialTutorialPostNoteCwDescription }}</div>
			<MkNote :class="$style.exampleRoot" :note="exampleCWNote" :mock="true"/>
			<div>{{ $locale.sfc.initialTutorialPostNoteCwUseCases }}</div>
		</div>
	</MkFormSection>
</div>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';
import { reactive } from 'vue';
import MkNote from '@features/notes/frontend/components/MkNote.vue';
import MkPostForm from '@features/notes/frontend/components/MkPostForm.vue';
import MkFormSection from '@features/ui/frontend/components/form/section.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';

const exampleCWNote = reactive<Misskey.entities.Note>({
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
	text: $locale.value.sfc.initialTutorialPostNoteCwExampleNoteNote,
	cw: $locale.value.sfc.initialTutorialPostNoteCwExampleNoteCw,
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
</script>

<style lang="scss" module>
.exampleRoot {
	max-width: none!important;
	border-radius: var(--MI-radius);
	border: var(--MI_THEME-panelBorder);
	background: var(--MI_THEME-panel);
}

.divider {
	height: 1px;
	background: var(--MI_THEME-divider);
}

.image {
	max-width: 300px;
	margin: 0 auto;
}

.post {
	position: relative;
	display: block;
	width: 100%;
	height: 40px;
	color: var(--MI_THEME-fgOnAccent);
	font-weight: bold;
	text-align: left;

	&::before {
		content: "";
		display: block;
		width: calc(100% - 38px);
		height: 100%;
		margin: auto;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--MI_THEME-buttonGradateA), var(--MI_THEME-buttonGradateB));
	}

}

.postIcon {
	position: relative;
	margin-left: 30px;
	margin-right: 8px;
	width: 32px;
}

.postText {
	position: relative;
	line-height: 40px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"initialTutorialPostNoteDescription1": "When posting a note on Misskey, various options are available. The posting form looks like this.",
	"visibility": "الظهور",
	"initialTutorialPostNoteVisibilityDescription": "You can limit who can view your note.",
	"visibilityPublic": "علني",
	"initialTutorialPostNoteVisibilityPublic": "Your note will be visible for all users.",
	"visibilityHome": "الرئيسي",
	"initialTutorialPostNoteVisibilityHome": "Public only on the Home timeline. People visiting your profile, via followers, and through renotes can see it.",
	"visibilityFollowers": "المتابِعون",
	"initialTutorialPostNoteVisibilityFollowers": "Visible to followers only. Only followers can see it and no one else, and it cannot be renoted by others.",
	"visibilitySpecified": "مباشرة",
	"initialTutorialPostNoteVisibilityDirect": "Visible only to specified users, and the recipient will be notified. It can be used as an alternative to direct messaging.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Be careful when sending sensitive information!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Administrators of the server can see what you write. Be careful with sensitive information when sending direct notes to users on untrusted servers.",
	"visibilityDisableFederation": "Defederate",
	"initialTutorialPostNoteVisibilityLocalOnly": "Posting with this flag will not federate the note to other servers. Users on other servers will not be able to view these notes directly, regardless of the display settings above.",
	"initialTutorialPostNoteCwTitle": "Content Warning",
	"initialTutorialPostNoteCwDescription": "Instead of the body, the content written in 'comments' field will be displayed. Pressing \"read more\" will reveal the body.",
	"initialTutorialPostNoteCwUseCases": "This is used when following the server guidelines, for necessary notes, or for self-restriction of spoiler or sensitive text.",
	"initialTutorialPostNoteCwExampleNoteNote": "Just had a chocolate-glazed donut 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "This will surely make you hungry!"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"initialTutorialPostNoteDescription1": "Quan públiques una nota a Misskey hi ha diferents opcions disponibles. El formulari de publicació es veu així",
	"visibility": "Visibilitat",
	"initialTutorialPostNoteVisibilityDescription": "Pots limitar qui pot veure les teves notes.",
	"visibilityPublic": "Públic ",
	"initialTutorialPostNoteVisibilityPublic": "La teva nota serà visible per a tots els usuaris.",
	"visibilityHome": "Inici",
	"initialTutorialPostNoteVisibilityHome": "Publicar només a línia de temps d'Inici. La gent que visiti el teu perfil o mitjançant les remotes també la podran veure.",
	"visibilityFollowers": "Seguidors",
	"initialTutorialPostNoteVisibilityFollowers": "Només visible per a seguidors. Només els teus seguidors la podran veure i ningú més. Ningú més podrà fer impulsos.",
	"visibilitySpecified": "Directe",
	"initialTutorialPostNoteVisibilityDirect": "Només visible per a alguns seguidors, el destinatari rebre una notificació. Es pot fer servir com una alternativa als missatges directes.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Tingues cura quan enviïs informació sensible.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Els administradors del servidor poden veure tot el que escrius. Ves compte quan enviïs informació sensible en enviar notes directes a altres usuaris en servidors de poca confiança.",
	"visibilityDisableFederation": "Sense federar",
	"initialTutorialPostNoteVisibilityLocalOnly": "Publicar amb aquesta opció activada farà que la nota no federi amb altres servidors. Els usuaris d'altres servidors no podran veure la nota directament, sense importar les opcions de visualització.",
	"initialTutorialPostNoteCwTitle": "Avís de Contingut (CW)",
	"initialTutorialPostNoteCwDescription": "En comptes del cos de la nota es mostrarà el que s'escrigui al camp de 'comentaris'. Fent clic a 'Llegir més' es mostrarà el cos.",
	"initialTutorialPostNoteCwUseCases": "Això es fa servir per seguir normes del servidor sobre certes notes o per ocultar contingut sensible O revelador.",
	"initialTutorialPostNoteCwExampleNoteNote": "Acabo de menjar-me un donut de xocolata 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "Això et farà venir gana!"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"initialTutorialPostNoteDescription1": "When posting a note on Misskey, various options are available. The posting form looks like this.",
	"visibility": "Viditelnost",
	"initialTutorialPostNoteVisibilityDescription": "You can limit who can view your note.",
	"visibilityPublic": "Veřejný",
	"initialTutorialPostNoteVisibilityPublic": "Your note will be visible for all users.",
	"visibilityHome": "Domů",
	"initialTutorialPostNoteVisibilityHome": "Public only on the Home timeline. People visiting your profile, via followers, and through renotes can see it.",
	"visibilityFollowers": "Sledující",
	"initialTutorialPostNoteVisibilityFollowers": "Visible to followers only. Only followers can see it and no one else, and it cannot be renoted by others.",
	"visibilitySpecified": "Přímý",
	"initialTutorialPostNoteVisibilityDirect": "Visible only to specified users, and the recipient will be notified. It can be used as an alternative to direct messaging.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Be careful when sending sensitive information!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Administrators of the server can see what you write. Be careful with sensitive information when sending direct notes to users on untrusted servers.",
	"visibilityDisableFederation": "Defederace",
	"initialTutorialPostNoteVisibilityLocalOnly": "Posting with this flag will not federate the note to other servers. Users on other servers will not be able to view these notes directly, regardless of the display settings above.",
	"initialTutorialPostNoteCwTitle": "Content Warning",
	"initialTutorialPostNoteCwDescription": "Instead of the body, the content written in 'comments' field will be displayed. Pressing \"read more\" will reveal the body.",
	"initialTutorialPostNoteCwUseCases": "This is used when following the server guidelines, for necessary notes, or for self-restriction of spoiler or sensitive text.",
	"initialTutorialPostNoteCwExampleNoteNote": "Just had a chocolate-glazed donut 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "This will surely make you hungry!"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"initialTutorialPostNoteDescription1": "When posting a note on Misskey, various options are available. The posting form looks like this.",
	"visibility": "Visibility",
	"initialTutorialPostNoteVisibilityDescription": "You can limit who can view your note.",
	"visibilityPublic": "Public",
	"initialTutorialPostNoteVisibilityPublic": "Your note will be visible for all users.",
	"visibilityHome": "Home",
	"initialTutorialPostNoteVisibilityHome": "Public only on the Home timeline. People visiting your profile, via followers, and through renotes can see it.",
	"visibilityFollowers": "Followers",
	"initialTutorialPostNoteVisibilityFollowers": "Visible to followers only. Only followers can see it and no one else, and it cannot be renoted by others.",
	"visibilitySpecified": "Direct",
	"initialTutorialPostNoteVisibilityDirect": "Visible only to specified users, and the recipient will be notified. It can be used as an alternative to direct messaging.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Be careful when sending sensitive information!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Administrators of the server can see what you write. Be careful with sensitive information when sending direct notes to users on untrusted servers.",
	"visibilityDisableFederation": "Defederate",
	"initialTutorialPostNoteVisibilityLocalOnly": "Posting with this flag will not federate the note to other servers. Users on other servers will not be able to view these notes directly, regardless of the display settings above.",
	"initialTutorialPostNoteCwTitle": "Content Warning",
	"initialTutorialPostNoteCwDescription": "Instead of the body, the content written in 'comments' field will be displayed. Pressing \"read more\" will reveal the body.",
	"initialTutorialPostNoteCwUseCases": "This is used when following the server guidelines, for necessary notes, or for self-restriction of spoiler or sensitive text.",
	"initialTutorialPostNoteCwExampleNoteNote": "Just had a chocolate-glazed donut 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "This will surely make you hungry!"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"initialTutorialPostNoteDescription1": "Wenn du eine Notiz auf Misskey veröffentlichst, stehen dir verschiedene Optionen zur Verfügung. Die Oberfläche sieht folgendermaßen aus.",
	"visibility": "Sichtbarkeit",
	"initialTutorialPostNoteVisibilityDescription": "Du kannst einschränken, wer deine Notiz sehen kann.",
	"visibilityPublic": "Öffentlich",
	"initialTutorialPostNoteVisibilityPublic": "Deine Notiz wird für alle Nutzer sichtbar sein.",
	"visibilityHome": "Startseite",
	"initialTutorialPostNoteVisibilityHome": "Nur auf der Startseite sichtbar. Kann von Followern, Profilbesuchern und durch Renotes gesehen werden.",
	"visibilityFollowers": "Follower",
	"initialTutorialPostNoteVisibilityFollowers": "Nur für Follower sichtbar. Nur Follower können es sehen und niemand sonst, und es kann nicht von anderen gerenoted werden.",
	"visibilitySpecified": "Direkt",
	"initialTutorialPostNoteVisibilityDirect": "Die Notiz wird nur für den angegebenen Benutzer veröffentlicht und der Empfänger wird benachrichtigt. Kann anstelle von Direktnachrichten verwendet werden.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Sei vorsichtig, wenn du sensible Informationen verschickst!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Die Administratoren des Servers können den Inhalt der Notiz sehen. Sei vorsichtig mit sensiblen Informationen, wenn du Direktnachrichten an Benutzer auf nicht vertrauenswürdigen Servern sendest.",
	"visibilityDisableFederation": "Deföderieren",
	"initialTutorialPostNoteVisibilityLocalOnly": "Wenn du eine Notiz mit dieser Einstellung veröffentlichst, wird sie nicht an andere Server weitergeleitet. Benutzer auf anderen Servern können diese Notizen nicht direkt sehen, unabhängig von den obigen Anzeigeeinstellungen.",
	"initialTutorialPostNoteCwTitle": "Inhaltswarnung",
	"initialTutorialPostNoteCwDescription": "Anstelle des Textes wird das angezeigt, was du im Abschnitt „Anmerkungen“ angibst. Drücke auf „Inhalt anzeigen“, um den vollständigen Text zu sehen.",
	"initialTutorialPostNoteCwUseCases": "Dient zur Kennzeichnung von Notizen, wie sie in den Serverrichtlinien vorgeschrieben sind, oder zur eigenen Festlegung von Spoiler-Beiträgen oder sensiblem Text.",
	"initialTutorialPostNoteCwExampleNoteNote": "Ich hatte gerade einen Donut mit Schokoladenüberzug 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "Das wird dich bestimmt hungrig machen!"
}
</locale>

<locale lang="json" locale="en-US">
{
	"initialTutorialPostNoteDescription1": "When posting a note on Misskey, various options are available. The posting form looks like this.",
	"visibility": "Visibility",
	"initialTutorialPostNoteVisibilityDescription": "You can limit who can view your note.",
	"visibilityPublic": "Public",
	"initialTutorialPostNoteVisibilityPublic": "Your note will be visible for all users.",
	"visibilityHome": "Home",
	"initialTutorialPostNoteVisibilityHome": "Public only on the Home timeline. People visiting your profile, via followers, and through renotes can see it.",
	"visibilityFollowers": "Followers",
	"initialTutorialPostNoteVisibilityFollowers": "Visible to followers only. Only followers can see it and no one else, and it cannot be renoted by others.",
	"visibilitySpecified": "Direct",
	"initialTutorialPostNoteVisibilityDirect": "Visible only to specified users, and the recipient will be notified. It can be used as an alternative to direct messaging.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Be careful when sending sensitive information!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Administrators of the server can see what you write. Be careful with sensitive information when sending direct notes to users on untrusted servers.",
	"visibilityDisableFederation": "Defederate",
	"initialTutorialPostNoteVisibilityLocalOnly": "Posting with this flag will not federate the note to other servers. Users on other servers will not be able to view these notes directly, regardless of the display settings above.",
	"initialTutorialPostNoteCwTitle": "Content Warning",
	"initialTutorialPostNoteCwDescription": "Instead of the body, the content written in 'comments' field will be displayed. Pressing \"read more\" will reveal the body.",
	"initialTutorialPostNoteCwUseCases": "This is used when following the server guidelines, for necessary notes, or for self-restriction of spoiler or sensitive text.",
	"initialTutorialPostNoteCwExampleNoteNote": "Just had a chocolate-glazed donut 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "This will surely make you hungry!"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"initialTutorialPostNoteDescription1": "Cuando publicas una nota en Misskey, hay varias opciones disponibles. El formulario tiene este aspecto.",
	"visibility": "Visibilidad",
	"initialTutorialPostNoteVisibilityDescription": "Puedes limitar quién puede ver tu nota.",
	"visibilityPublic": "Público",
	"initialTutorialPostNoteVisibilityPublic": "Tu nota será visible para todos los usuarios.",
	"visibilityHome": "Inicio",
	"initialTutorialPostNoteVisibilityHome": "Publicar solo en la línea de tiempo de Inicio. La nota se verá en tu perfil, la verán tus seguidores y también cuando sea renotada.",
	"visibilityFollowers": "Seguidores",
	"initialTutorialPostNoteVisibilityFollowers": "Visible solo para seguidores. Solo tus seguidores podrán ver la nota, y no podrá ser renotada por otras personas.",
	"visibilitySpecified": "Nota directa",
	"initialTutorialPostNoteVisibilityDirect": "Visible sólo para usuarios específicos, y el destinatario será notificado. Puede usarse como alternativa a la mensajería directa.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "¡Ten cuidado cuando vayas a enviar información sensible!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Los administradores del servidor, también llamado instancia, pueden leer lo que escribes. Ten cuidado cuando envíes información sensible en notas directas en servidores o instancias no confiables.",
	"visibilityDisableFederation": "No federado",
	"initialTutorialPostNoteVisibilityLocalOnly": "Publicando con esta opción seleccionada, la nota no se federará hacia otros servidores. Los usuarios de otros servidores no podrán ver estas notas directamente, sin importar los ajustes seleccionados más arriba.",
	"initialTutorialPostNoteCwTitle": "Alerta de contenido (CW)",
	"initialTutorialPostNoteCwDescription": "En lugar de mostrarse el contenido de la nota, se mostrará lo que escribas en el campo \"comentarios\". Pulsando en \"Ver más\" desplegará el contenido de la nota.",
	"initialTutorialPostNoteCwUseCases": "Esto se usa cuando las normas del servidor lo requieren, o para ocultar spoilers o contenido sensible.",
	"initialTutorialPostNoteCwExampleNoteNote": "Acabo de comerme un donut de chocolate glaseado 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "¡Esto te hará tener hambre!"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"initialTutorialPostNoteDescription1": "Lorsque vous publiez des notes sur Misskey, diverses options sont disponibles. Voici le formulaire de publication.",
	"visibility": "Visibilité",
	"initialTutorialPostNoteVisibilityDescription": "Vous pouvez choisir qui peut voir vos notes.",
	"visibilityPublic": "Public",
	"initialTutorialPostNoteVisibilityPublic": "Visible à tous les utilisateurs.",
	"visibilityHome": "Principal",
	"initialTutorialPostNoteVisibilityHome": "Uniquement visible sur le fil principal. Les utilisateurs pourront la voir en visitant ton profil, en s'abonnant à vous et par les renotes.",
	"visibilityFollowers": "Abonné·e·s",
	"initialTutorialPostNoteVisibilityFollowers": "Uniquement visible à vos abonnés. Elle ne pourra être renotée que par vous-même.",
	"visibilitySpecified": "Direct",
	"initialTutorialPostNoteVisibilityDirect": "Uniquement visible aux utilisateurs de votre choix. Les récipients seront notifiés. Cette option peut être utilisée comme alternative aux messages directs.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Faites attention quand vous envoyez vos informations sensibles !",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Les administrateurs de l'instance destinataire peuvent voir toutes les notes publiées. Soyez prudent·e avec vos informations sensibles quand vous envoyez des notes directes aux utilisateurs dont vous ne vous fiez pas aux instances.",
	"visibilityDisableFederation": "Défédérer",
	"initialTutorialPostNoteVisibilityLocalOnly": "Désactiver la fédération de la note aux autres instances. Les utilisateurs des autres instances ne pourront pas voir directement la note quelle que soit l'étendue de la publication mentionnée ci-dessus.",
	"initialTutorialPostNoteCwTitle": "Masquer le contenu (CW)",
	"initialTutorialPostNoteCwDescription": "Au lieu du corps du texte, le contenu du champ « commentaires » s'affichera. Appuyez sur « afficher le contenu » pour voir le corps du texte.",
	"initialTutorialPostNoteCwUseCases": "Utilisé pour désigner certaines notes selon les règles du serveur ou pour cacher des spoilers ou des textes sensibles.",
	"initialTutorialPostNoteCwExampleNoteNote": "J'ai mangé un beignet enrobé de chocolat 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "Attention : cela vous donnera faim !"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"initialTutorialPostNoteDescription1": "Ketika memposting catatan ke Misskey, terdapat beberapa opsi yang tersedia. Form posting terlihat seperti ini.",
	"visibility": "Visibilitas",
	"initialTutorialPostNoteVisibilityDescription": "Kamu dapat membatasi siapa yang dapat melihat catatan kamu.",
	"visibilityPublic": "Publik",
	"initialTutorialPostNoteVisibilityPublic": "Perlihatkan catatan ke semua pengguna.",
	"visibilityHome": "Beranda",
	"initialTutorialPostNoteVisibilityHome": "Hanya publik ke lini masa Beranda. Pengguna yang mengunjungi profilmu melalui pengikut dan renote dapat melihatnya.",
	"visibilityFollowers": "Pengikut",
	"initialTutorialPostNoteVisibilityFollowers": "Perlihatkan ke pengikut saja. Hanya pengikut yang dapat melihat postinganmu dan tidak dapat direnote oleh siapapun.",
	"visibilitySpecified": "Langsung",
	"initialTutorialPostNoteVisibilityDirect": "Hanya perlihatkan ke pengguna spesifik dan penerima akan diberi tahu. Dapat juga digunakan sebagai alternatif dari pesan langsung.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Hati-hati ketika mengirim informasi yang sensitif!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Admin dari peladen dapat melihat apa yang kamu tulis. Hati-hati dengan informasi sensitif ketika mengirimkan catatan langsung kepada pengguna pada peladen yang tidak dipercaya.",
	"visibilityDisableFederation": "Matikan federasi",
	"initialTutorialPostNoteVisibilityLocalOnly": "Memposting dengan opsi ini tidak akan memfederasi catatan ke peladen lain. Pengguna pada peladen lain tidak akan dapat melihat catatan ini secara langsung, meskipun dengan pengaturan visibilitas yang sudah diatur di atas.",
	"initialTutorialPostNoteCwTitle": "Peringatan Konten (CW)",
	"initialTutorialPostNoteCwDescription": "Alih-alih isinya, konten yang ditulis dalam kolom 'komentar' akan ditampilkan. Menekan 'Selebihnya' akan menampilkan isi konten.",
	"initialTutorialPostNoteCwUseCases": "Fungsi ini digunakan ketika mengikutik panduan peladen untuk catatan yang dibutuhkan atau untuk membatasi diri dari teks sensitif atau spoiler.",
	"initialTutorialPostNoteCwExampleNoteNote": "Baru aja makan donat berlapis coklat 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "Peringatan: Bikin Lapar!"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"initialTutorialPostNoteDescription1": "Quando scrivi una Nota su Misskey, hai a disposizione varie opzioni. Il modulo di invio è simile a questo.",
	"visibility": "Visibilità",
	"initialTutorialPostNoteVisibilityDescription": "Puoi limitare chi può vedere la tua Nota.",
	"visibilityPublic": "Pubblica",
	"initialTutorialPostNoteVisibilityPublic": "Visibile a tutti.",
	"visibilityHome": "Home",
	"initialTutorialPostNoteVisibilityHome": "Pubblicato solo sulla Timeline Home (personale). Visibile anche da profili remoti follower, visitatori del tuo profilo e tramite i Rinota dei follower.",
	"visibilityFollowers": "Follower",
	"initialTutorialPostNoteVisibilityFollowers": "Visibile solo ai profili tuoi follower (locali o remoti). Nessun altro oltre a te può \"Rinotare\".",
	"visibilitySpecified": "Nota diretta",
	"initialTutorialPostNoteVisibilityDirect": "Visibile solo ai profili specificati, i quali riceveranno una notifica. Puoi usarlo come se fossero messaggi diretti.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Attenzione, quando si inviano informazioni confidenziali.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Poiché le Note non sono crittografate, l'amministratore del server di destinazione potrebbe leggere cosa è stato scritto, quindi se spedisci una Nota diretta a un profilo che risiede su un server non attendibile, evita di scrivere informazioni riservate.",
	"visibilityDisableFederation": "Gestisci la federazione",
	"initialTutorialPostNoteVisibilityLocalOnly": "Indipendentemente dalla visualizzazione sopra indicata, i profili su altri server non saranno in grado di visualizzare la Nota, se questa impostazione è attivata. Non non verrà comunicata ad altri server.",
	"initialTutorialPostNoteCwTitle": "Nascondere il contenuto esplicito",
	"initialTutorialPostNoteCwDescription": "Verrà visualizzato il testo scritto nel campo \"Annotazione preventiva\" al posto del testo principale della Nota. Premere il bottone \"Continua la lettura\" se si intende davvero leggere il testo.",
	"initialTutorialPostNoteCwUseCases": "Utilizzalo per chiarire il contenuto della Nota, prima che sia letta. Come richiesto dal regolamento del server o per autoregolamentare spoiler e testi troppo espliciti.",
	"initialTutorialPostNoteCwExampleNoteNote": "Ho appena mangiato una ciambella ricoperta di cioccolato 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "Attenzione: contiene zuccheri"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"initialTutorialPostNoteDescription1": "Misskeyにノートを投稿する際には、様々なオプションの設定が可能です。投稿フォームはこのようになっています。",
	"visibility": "公開範囲",
	"initialTutorialPostNoteVisibilityDescription": "ノートを表示できる相手を制限できます。",
	"visibilityPublic": "パブリック",
	"initialTutorialPostNoteVisibilityPublic": "すべてのユーザーに公開。",
	"visibilityHome": "ホーム",
	"initialTutorialPostNoteVisibilityHome": "ホームタイムラインのみに公開。フォロワー・プロフィールを見に来た人・リノートから、他のユーザーも見ることができます。",
	"visibilityFollowers": "フォロワー",
	"initialTutorialPostNoteVisibilityFollowers": "フォロワーにのみ公開。本人以外がリノートすることはできず、またフォロワー以外は閲覧できません。",
	"visibilitySpecified": "指名",
	"initialTutorialPostNoteVisibilityDirect": "指定したユーザーにのみ公開され、また相手に通知が入ります。",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "機密情報は送信する際は注意してください。",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "送信先のサーバーの管理者は投稿内容を見ることが可能なので、信頼できないサーバーのユーザーが含まれる限定公開のノートを作成する際は、機密情報の扱いに注意が必要です。",
	"visibilityDisableFederation": "連合なし",
	"initialTutorialPostNoteVisibilityLocalOnly": "他のサーバーに投稿を連合しません。上記の公開範囲に関わらず、他のサーバーのユーザーは、この設定がついたノートを直接閲覧することができなくなります。",
	"initialTutorialPostNoteCwTitle": "内容を隠す（CW）",
	"initialTutorialPostNoteCwDescription": "本文のかわりに「注釈」に書いた内容が表示されます。「もっと見る」を押すと本文が表示されます。",
	"initialTutorialPostNoteCwUseCases": "サーバーのガイドラインにより必要とされるノートに指定したり、ネタバレ投稿やセンシティブな文章を自主規制したりするときに使います。",
	"initialTutorialPostNoteCwExampleNoteNote": "チョコのかかったドーナツを食べました🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "飯テロ注意"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"initialTutorialPostNoteDescription1": "Misskeyにノートを投稿するとき、いろんなオプションが付けれるで。投稿画面はこんな感じや。",
	"visibility": "公開範囲",
	"initialTutorialPostNoteVisibilityDescription": "ノートを見れる相手を制限できるわ。",
	"visibilityPublic": "パブリック",
	"initialTutorialPostNoteVisibilityPublic": "みんなに見せるで。",
	"visibilityHome": "ホーム",
	"initialTutorialPostNoteVisibilityHome": "ホームタイムラインにだけ見せるで。フォロワーとか、プロフィールを見に来た人、リノートからも見れるから、実質は全員見れるけどな。あんまし広がりにくいってことや。",
	"visibilityFollowers": "フォロワー",
	"initialTutorialPostNoteVisibilityFollowers": "フォロワーにだけ見せるで。自分以外はリノートできへんし、フォロワー以外は絶対に見れへん。",
	"visibilitySpecified": "ダイレクト",
	"initialTutorialPostNoteVisibilityDirect": "指定した人にだけ公開されて、ついでに通知も送るで。ダイレクトメールの代わりとして使ってな。",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "機密情報を送るときは十分注意せえよ。",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "送信先のサーバーの管理者は投稿内容が見れるから、信用できへんサーバーのひとにダイレクト投稿するときには、めっちゃ用心しとくんやで。",
	"visibilityDisableFederation": "連合なし",
	"initialTutorialPostNoteVisibilityLocalOnly": "他のサーバーに投稿せえへんくなるで。他の公開範囲とか一切無視して、他のサーバーの人らはこの設定がされたノートは絶対に見れへん。",
	"initialTutorialPostNoteCwTitle": "内容隠し（CW）",
	"initialTutorialPostNoteCwDescription": "本文のかわりに「注釈」に書いた内容だけ見せるで。「続き見して！」を押すと本文も見れんねん。",
	"initialTutorialPostNoteCwUseCases": "サーバーのガイドラインに決められとるノートに使うたり、ネタバレとかきわどい内容を自分で隠したりするとき用やな。",
	"initialTutorialPostNoteCwExampleNoteNote": "チョコドーナツめっちゃ美味かったわ🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "飯テロ注意"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"initialTutorialPostNoteDescription1": "When posting a note on Misskey, various options are available. The posting form looks like this.",
	"visibility": "Visibility",
	"initialTutorialPostNoteVisibilityDescription": "You can limit who can view your note.",
	"visibilityPublic": "Public",
	"initialTutorialPostNoteVisibilityPublic": "Your note will be visible for all users.",
	"visibilityHome": "Home",
	"initialTutorialPostNoteVisibilityHome": "Public only on the Home timeline. People visiting your profile, via followers, and through renotes can see it.",
	"visibilityFollowers": "Imeḍfaṛen",
	"initialTutorialPostNoteVisibilityFollowers": "Visible to followers only. Only followers can see it and no one else, and it cannot be renoted by others.",
	"visibilitySpecified": "Direct",
	"initialTutorialPostNoteVisibilityDirect": "Visible only to specified users, and the recipient will be notified. It can be used as an alternative to direct messaging.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Be careful when sending sensitive information!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Administrators of the server can see what you write. Be careful with sensitive information when sending direct notes to users on untrusted servers.",
	"visibilityDisableFederation": "Defederate",
	"initialTutorialPostNoteVisibilityLocalOnly": "Posting with this flag will not federate the note to other servers. Users on other servers will not be able to view these notes directly, regardless of the display settings above.",
	"initialTutorialPostNoteCwTitle": "Content Warning",
	"initialTutorialPostNoteCwDescription": "Instead of the body, the content written in 'comments' field will be displayed. Pressing \"read more\" will reveal the body.",
	"initialTutorialPostNoteCwUseCases": "This is used when following the server guidelines, for necessary notes, or for self-restriction of spoiler or sensitive text.",
	"initialTutorialPostNoteCwExampleNoteNote": "Just had a chocolate-glazed donut 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "This will surely make you hungry!"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"initialTutorialPostNoteDescription1": "When posting a note on Misskey, various options are available. The posting form looks like this.",
	"visibility": "Visibility",
	"initialTutorialPostNoteVisibilityDescription": "You can limit who can view your note.",
	"visibilityPublic": "Public",
	"initialTutorialPostNoteVisibilityPublic": "Your note will be visible for all users.",
	"visibilityHome": "Home",
	"initialTutorialPostNoteVisibilityHome": "Public only on the Home timeline. People visiting your profile, via followers, and through renotes can see it.",
	"visibilityFollowers": "Followers",
	"initialTutorialPostNoteVisibilityFollowers": "Visible to followers only. Only followers can see it and no one else, and it cannot be renoted by others.",
	"visibilitySpecified": "ನೇರ ಟಿಪ್ಪಣಿಗಳು",
	"initialTutorialPostNoteVisibilityDirect": "Visible only to specified users, and the recipient will be notified. It can be used as an alternative to direct messaging.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Be careful when sending sensitive information!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Administrators of the server can see what you write. Be careful with sensitive information when sending direct notes to users on untrusted servers.",
	"visibilityDisableFederation": "Defederate",
	"initialTutorialPostNoteVisibilityLocalOnly": "Posting with this flag will not federate the note to other servers. Users on other servers will not be able to view these notes directly, regardless of the display settings above.",
	"initialTutorialPostNoteCwTitle": "Content Warning",
	"initialTutorialPostNoteCwDescription": "Instead of the body, the content written in 'comments' field will be displayed. Pressing \"read more\" will reveal the body.",
	"initialTutorialPostNoteCwUseCases": "This is used when following the server guidelines, for necessary notes, or for self-restriction of spoiler or sensitive text.",
	"initialTutorialPostNoteCwExampleNoteNote": "Just had a chocolate-glazed donut 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "This will surely make you hungry!"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"initialTutorialPostNoteDescription1": "Misskey에 노트를 게시할 때에는 다양한 옵션 설정이 가능합니다. 노트를 게시할 때 쓰이는 '글 입력란'은 이렇게 생겼습니다.",
	"visibility": "공개 범위",
	"initialTutorialPostNoteVisibilityDescription": "노트를 볼 수 있는 사람을 제한할 수 있습니다.",
	"visibilityPublic": "공개",
	"initialTutorialPostNoteVisibilityPublic": "모든 유저에게 공개합니다.",
	"visibilityHome": "홈",
	"initialTutorialPostNoteVisibilityHome": "홈 타임라인에만 공개합니다. 팔로워, 프로필 화면, 리노트를 통해서 다른 유저가 볼 수 있습니다.",
	"visibilityFollowers": "팔로워",
	"initialTutorialPostNoteVisibilityFollowers": "팔로워에게만 공개. 자기 자신을 제외하고는 리노트가 불가능하며, 팔로워 외에는 열람할 수 없습니다.",
	"visibilitySpecified": "다이렉트",
	"initialTutorialPostNoteVisibilityDirect": "지정한 유저에게만 공개되며, 상대방에게 알림이 갑니다. 다이렉트 메시지(DM) 대용으로써 사용하실 수 있습니다.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "민감한 정보를 보낼 때에는 주의하십시오.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "서버 관리자는 기술적으로 게시물 내용을 열람할 수 있습니다. 신뢰할 수 없는 서버의 유저에게 다이렉트 메시지를 보내는 경우, 민감한 정보가 포함되어 있는 지 확인하십시오.",
	"visibilityDisableFederation": "연합에 보내지 않기",
	"initialTutorialPostNoteVisibilityLocalOnly": "다른 서버에 게시물을 보내지 않습니다. 앞서 설정한 공개 범위와 상관 없이, 다른 서버의 유저는 이 게시물을 직접 열람할 수 없게 됩니다.",
	"initialTutorialPostNoteCwTitle": "내용 가리기 (CW)",
	"initialTutorialPostNoteCwDescription": "본문 대신에 '내용에 대한 주석'에 입력한 텍스트가 먼저 표시됩니다. '더 보기' 버튼을 누르면 본문이 표시됩니다.",
	"initialTutorialPostNoteCwUseCases": "서버의 가이드라인에 따라 특정 주제를 다룰 때에 사용하거나, 스포일러 및 민감한 화제를 다룰 때에 자율적으로 사용하기도 합니다.",
	"initialTutorialPostNoteCwExampleNoteNote": "방금 초코도넛을 먹었어요 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "배고픈 사람 주의"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"initialTutorialPostNoteDescription1": "When posting a note on Misskey, various options are available. The posting form looks like this.",
	"visibility": "Zichtbaarheid",
	"initialTutorialPostNoteVisibilityDescription": "You can limit who can view your note.",
	"visibilityPublic": "Public",
	"initialTutorialPostNoteVisibilityPublic": "Your note will be visible for all users.",
	"visibilityHome": "Startpagina",
	"initialTutorialPostNoteVisibilityHome": "Public only on the Home timeline. People visiting your profile, via followers, and through renotes can see it.",
	"visibilityFollowers": "Volgers",
	"initialTutorialPostNoteVisibilityFollowers": "Visible to followers only. Only followers can see it and no one else, and it cannot be renoted by others.",
	"visibilitySpecified": "Directe notities",
	"initialTutorialPostNoteVisibilityDirect": "Visible only to specified users, and the recipient will be notified. It can be used as an alternative to direct messaging.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Be careful when sending sensitive information!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Administrators of the server can see what you write. Be careful with sensitive information when sending direct notes to users on untrusted servers.",
	"visibilityDisableFederation": "Defederate",
	"initialTutorialPostNoteVisibilityLocalOnly": "Posting with this flag will not federate the note to other servers. Users on other servers will not be able to view these notes directly, regardless of the display settings above.",
	"initialTutorialPostNoteCwTitle": "Content Warning",
	"initialTutorialPostNoteCwDescription": "Instead of the body, the content written in 'comments' field will be displayed. Pressing \"read more\" will reveal the body.",
	"initialTutorialPostNoteCwUseCases": "This is used when following the server guidelines, for necessary notes, or for self-restriction of spoiler or sensitive text.",
	"initialTutorialPostNoteCwExampleNoteNote": "Just had a chocolate-glazed donut 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "This will surely make you hungry!"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"initialTutorialPostNoteDescription1": "When posting a note on Misskey, various options are available. The posting form looks like this.",
	"visibility": "Visibility",
	"initialTutorialPostNoteVisibilityDescription": "You can limit who can view your note.",
	"visibilityPublic": "Public",
	"initialTutorialPostNoteVisibilityPublic": "Your note will be visible for all users.",
	"visibilityHome": "Hjem",
	"initialTutorialPostNoteVisibilityHome": "Public only on the Home timeline. People visiting your profile, via followers, and through renotes can see it.",
	"visibilityFollowers": "Følgere",
	"initialTutorialPostNoteVisibilityFollowers": "Visible to followers only. Only followers can see it and no one else, and it cannot be renoted by others.",
	"visibilitySpecified": "Direct",
	"initialTutorialPostNoteVisibilityDirect": "Visible only to specified users, and the recipient will be notified. It can be used as an alternative to direct messaging.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Be careful when sending sensitive information!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Administrators of the server can see what you write. Be careful with sensitive information when sending direct notes to users on untrusted servers.",
	"visibilityDisableFederation": "Defederate",
	"initialTutorialPostNoteVisibilityLocalOnly": "Posting with this flag will not federate the note to other servers. Users on other servers will not be able to view these notes directly, regardless of the display settings above.",
	"initialTutorialPostNoteCwTitle": "Content Warning",
	"initialTutorialPostNoteCwDescription": "Instead of the body, the content written in 'comments' field will be displayed. Pressing \"read more\" will reveal the body.",
	"initialTutorialPostNoteCwUseCases": "This is used when following the server guidelines, for necessary notes, or for self-restriction of spoiler or sensitive text.",
	"initialTutorialPostNoteCwExampleNoteNote": "Just had a chocolate-glazed donut 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "This will surely make you hungry!"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"initialTutorialPostNoteDescription1": "When posting a note on Misskey, various options are available. The posting form looks like this.",
	"visibility": "Widoczność",
	"initialTutorialPostNoteVisibilityDescription": "You can limit who can view your note.",
	"visibilityPublic": "Publiczny",
	"initialTutorialPostNoteVisibilityPublic": "Your note will be visible for all users.",
	"visibilityHome": "Strona główna",
	"initialTutorialPostNoteVisibilityHome": "Public only on the Home timeline. People visiting your profile, via followers, and through renotes can see it.",
	"visibilityFollowers": "Obserwujący",
	"initialTutorialPostNoteVisibilityFollowers": "Visible to followers only. Only followers can see it and no one else, and it cannot be renoted by others.",
	"visibilitySpecified": "Bezpośredni",
	"initialTutorialPostNoteVisibilityDirect": "Visible only to specified users, and the recipient will be notified. It can be used as an alternative to direct messaging.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Be careful when sending sensitive information!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Administrators of the server can see what you write. Be careful with sensitive information when sending direct notes to users on untrusted servers.",
	"visibilityDisableFederation": "Defederate",
	"initialTutorialPostNoteVisibilityLocalOnly": "Posting with this flag will not federate the note to other servers. Users on other servers will not be able to view these notes directly, regardless of the display settings above.",
	"initialTutorialPostNoteCwTitle": "Content Warning",
	"initialTutorialPostNoteCwDescription": "Instead of the body, the content written in 'comments' field will be displayed. Pressing \"read more\" will reveal the body.",
	"initialTutorialPostNoteCwUseCases": "This is used when following the server guidelines, for necessary notes, or for self-restriction of spoiler or sensitive text.",
	"initialTutorialPostNoteCwExampleNoteNote": "Just had a chocolate-glazed donut 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "This will surely make you hungry!"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"initialTutorialPostNoteDescription1": "Ao postar uma nota no Misskey, diversas opções estão disponíveis. A ficha de publicação parece com isto: ",
	"visibility": "Visibilidade",
	"initialTutorialPostNoteVisibilityDescription": "Você pode limitar quem vê a sua nota.",
	"visibilityPublic": "Público",
	"initialTutorialPostNoteVisibilityPublic": "Sua nota será visível a todos os usuários.",
	"visibilityHome": "Início",
	"initialTutorialPostNoteVisibilityHome": "Publicar apenas na linha do tempo Início. Pessoas visitando seu perfil, seja seguindo ou por um repost poderão vê-los.",
	"visibilityFollowers": "Seguidores",
	"initialTutorialPostNoteVisibilityFollowers": "Visível apenas para seguidores. Apenas seguidores podem vê-la e mais ninguém, e ela não pode ser repostada pelos demais.",
	"visibilitySpecified": "Mensagem Direta",
	"initialTutorialPostNoteVisibilityDirect": "Visível apenas para usuários específicos, e o destinatário será notificado. Pode ser usado como uma alternativa às mensagens diretas.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Tenha cuidado ao enviar informações sensíveis!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Administradores do servidor podem ver o que foi escrito. Cuidado, também, ao enviar notas diretas a usuários de servidores não confiáveis.",
	"visibilityDisableFederation": "Defederar",
	"initialTutorialPostNoteVisibilityLocalOnly": "Publicar com essa opção não federará a nota com outros servidores. Usuários desses servidores não poderão ver essas notas diretamente, independente das opções de visibilidade acima. ",
	"initialTutorialPostNoteCwTitle": "Aviso de Conteúdo",
	"initialTutorialPostNoteCwDescription": "Ao invés do corpo do texto, o conteúdo escrito na caixa \"anotação\" será exibido. Apertar \"Carregar mais\" irá revelar o corpo.",
	"initialTutorialPostNoteCwUseCases": "Isso pode ser usado caso seja exigido, pelas diretrizes do servidor, o cuidado com algum tópico ou ao publicar conteúdo sensível ou spoilers.",
	"initialTutorialPostNoteCwExampleNoteNote": "Acabei de comer um donut coberto de chocolate! 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "Isso irá te esfomear!"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"initialTutorialPostNoteDescription1": "Когда вы публикуете заметку на Misskey, вы можете изменить некоторые настройки. Окно написания заметки выглядит вот так.",
	"visibility": "Видимость",
	"initialTutorialPostNoteVisibilityDescription": "Вы можете ограничить кто может увидеть вашу заметку.",
	"visibilityPublic": "Общедоступно",
	"initialTutorialPostNoteVisibilityPublic": "Твоя заметка будет видна всем.",
	"visibilityHome": "Домашняя",
	"initialTutorialPostNoteVisibilityHome": "Видно только в домашней ленте. Пользователи посещающие ваш профиль, через подписки, и через репосты, могут видеть их.",
	"visibilityFollowers": "Для подписчиков",
	"initialTutorialPostNoteVisibilityFollowers": "Видно только подписчикам. Только подписчики могут видеть эту заметку и никто больше, и его нельзя репостить.",
	"visibilitySpecified": "Личное",
	"initialTutorialPostNoteVisibilityDirect": "Видно только выбранным пользователям, и получатели получат уведомление. Может быть использовано как альтернатива личным сообщениям.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Будьте осторожны с отправкой конфиденциальной информации!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Администратор целевого сервера может видеть что вы отправляете. Будьте осторожны с конфиденциальной информацией, когда отправляете личные заметки пользователям с ненадёжных серверов.",
	"visibilityDisableFederation": "Отключить федерацию",
	"initialTutorialPostNoteVisibilityLocalOnly": "Заметки с этим флагом не будут передаваться присоединённым серверам. Пользователи на других серверах не смогут увидеть её вне зависимости от настроек выше.",
	"initialTutorialPostNoteCwTitle": "Спойлер",
	"initialTutorialPostNoteCwDescription": "Instead of the body, the content written in 'comments' field will be displayed. Pressing \"read more\" will reveal the body.",
	"initialTutorialPostNoteCwUseCases": "This is used when following the server guidelines, for necessary notes, or for self-restriction of spoiler or sensitive text.",
	"initialTutorialPostNoteCwExampleNoteNote": "Just had a chocolate-glazed donut 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "This will surely make you hungry!"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"initialTutorialPostNoteDescription1": "When posting a note on Misskey, various options are available. The posting form looks like this.",
	"visibility": "Viditeľnosť",
	"initialTutorialPostNoteVisibilityDescription": "You can limit who can view your note.",
	"visibilityPublic": "Verejné",
	"initialTutorialPostNoteVisibilityPublic": "Your note will be visible for all users.",
	"visibilityHome": "Domov",
	"initialTutorialPostNoteVisibilityHome": "Public only on the Home timeline. People visiting your profile, via followers, and through renotes can see it.",
	"visibilityFollowers": "Sledujúci",
	"initialTutorialPostNoteVisibilityFollowers": "Visible to followers only. Only followers can see it and no one else, and it cannot be renoted by others.",
	"visibilitySpecified": "Priame",
	"initialTutorialPostNoteVisibilityDirect": "Visible only to specified users, and the recipient will be notified. It can be used as an alternative to direct messaging.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Be careful when sending sensitive information!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Administrators of the server can see what you write. Be careful with sensitive information when sending direct notes to users on untrusted servers.",
	"visibilityDisableFederation": "Defederate",
	"initialTutorialPostNoteVisibilityLocalOnly": "Posting with this flag will not federate the note to other servers. Users on other servers will not be able to view these notes directly, regardless of the display settings above.",
	"initialTutorialPostNoteCwTitle": "Content Warning",
	"initialTutorialPostNoteCwDescription": "Instead of the body, the content written in 'comments' field will be displayed. Pressing \"read more\" will reveal the body.",
	"initialTutorialPostNoteCwUseCases": "This is used when following the server guidelines, for necessary notes, or for self-restriction of spoiler or sensitive text.",
	"initialTutorialPostNoteCwExampleNoteNote": "Just had a chocolate-glazed donut 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "This will surely make you hungry!"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"initialTutorialPostNoteDescription1": "เมื่อโพสต์โน้ตบน Misskey คุณสามารถตั้งค่าตัวเลือกต่างๆ ได้ แบบฟอร์มการส่งมีลักษณะดังนี้",
	"visibility": "การมองเห็น",
	"initialTutorialPostNoteVisibilityDescription": "คุณสามารถจำกัดผู้ที่สามารถดูโน้ตของคุณได้นะ",
	"visibilityPublic": "สาธารณะ",
	"initialTutorialPostNoteVisibilityPublic": "โน้ตของคุณนั้นจะปรากฏแก่ผู้ใช้งานทุกคน",
	"visibilityHome": "หน้าหลัก",
	"initialTutorialPostNoteVisibilityHome": "เผยแพร่บนไทม์ไลน์หลักเท่านั้น แต่ผู้ติดตาม ผู้ที่เข้ามาดูโปรไฟล์ และผู้ที่เห็นจากรีโน้ตยังสามารถดูโพสต์นี้ได้",
	"visibilityFollowers": "ผู้ติดตาม",
	"initialTutorialPostNoteVisibilityFollowers": "มองเห็นได้เฉพาะผู้ติดตามเท่านั้น ไม่มีใครอื่นนอกจากตัวคุณเองที่สามารถรีโน้ตได้ และมีเพียงผู้ติดตามของคุณเท่านั้นที่สามารถดูได้",
	"visibilitySpecified": "ไดเร็ค",
	"initialTutorialPostNoteVisibilityDirect": "เปิดให้เห็นเฉพาะผู้ใช้ที่ระบุเท่านั้น และพวกเขาจะได้รับแจ้งเตือนด้วย คุณสามารถใช้มันแทนข้อความโดยตรง (dm)",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "โปรดใช้ความระมัดระวังในการส่งข้อมูลที่ละเอียดอ่อน",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "ผู้ดูแลระบบเซิร์ฟเวอร์ปลายทางสามารถดูเนื้อหาที่โพสต์ได้ ดังนั้นหากคุณส่งโพสต์โดยตรงไปยังผู้ใช้บนเซิร์ฟเวอร์ที่ไม่น่าเชื่อถือ คุณจะต้องใช้ความระมัดระวังในการจัดการข้อมูลที่เป็นความลับ",
	"visibilityDisableFederation": "การปิดใช้งานสหพันธ์",
	"initialTutorialPostNoteVisibilityLocalOnly": "การโพสต์ด้วย flag นี้จะไม่รวมโน้ตไปยังเซิร์ฟเวอร์อื่น ผู้ใช้บนเซิร์ฟเวอร์อื่นจะไม่สามารถดูโน้ตเหล่านี้ได้โดยตรง โดยไม่คำนึงถึงการตั้งค่าการแสดงผลข้างต้น",
	"initialTutorialPostNoteCwTitle": "คำเตือนเกี่ยวกับเนื้อหา",
	"initialTutorialPostNoteCwDescription": "เนื้อหาที่เขียนใน “ข้อความเกริ่น” จะแสดงแทนเนื้อหาหลัก ต้องกด “ดูเพิ่มเติม” เพื่อให้เนื้อหาหลักแสดง",
	"initialTutorialPostNoteCwUseCases": "ใช้สิ่งนี้เพื่อระบุโน้ตที่ต้องตามแนวทางปฏิบัติของเซิร์ฟเวอร์ หรือเพื่อควบคุมการสปอยล์และข้อความที่ละเอียดอ่อนด้วยตนเอง",
	"initialTutorialPostNoteCwExampleNoteNote": "เพิ่งไปกินโดนัทเคลือบช็อคโกแลตมา 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": " ห้ามดู ระวังหิว"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"initialTutorialPostNoteDescription1": "Misskey'de not yayınlarken çeşitli seçenekler mevcuttur. Yayınlama formu şu şekildedir.",
	"visibility": "Görünürlük",
	"initialTutorialPostNoteVisibilityDescription": "Notunu kimlerin görüntüleyebileceğini sınırlayabilirsin.",
	"visibilityPublic": "Halka açık",
	"initialTutorialPostNoteVisibilityPublic": "Notunuz tüm kullanıcılar tarafından görülebilir olacaktır.",
	"visibilityHome": "Pano",
	"initialTutorialPostNoteVisibilityHome": "Yalnızca Ana zaman akışında herkese açık. Profilinizi ziyaret edenler, takipçilerin ve yeniden notlar aracılığıyla bunu görebilirler.",
	"visibilityFollowers": "Takipçiler",
	"initialTutorialPostNoteVisibilityFollowers": "Sadece takipçiler tarafından görülebilir. Sadece takipçiler görebilir, başkaları göremez ve başkaları tarafından yeniden not edilemez.",
	"visibilitySpecified": "Doğrudan",
	"initialTutorialPostNoteVisibilityDirect": "Yalnızca belirli kullanıcılar tarafından görülebilir ve alıcıya bildirim gönderilir. Doğrudan mesajlaşma yerine alternatif olarak kullanılabilir.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Hassas bilgileri gönderirken dikkatli olun!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Sunucu yöneticileri yazdıklarınızı görebilir. Güvenilir olmayan sunuculardaki kullanıcılara doğrudan not gönderirken hassas bilgilere dikkat edin.",
	"visibilityDisableFederation": "Federasyon olmadan",
	"initialTutorialPostNoteVisibilityLocalOnly": "Bu bayrakla yayınlamak, notu diğer sunuculara aktarmaz. Diğer sunuculardaki kullanıcılar, yukarıdaki görüntüleme ayarlarından bağımsız olarak bu notları doğrudan görüntüleyemezler.",
	"initialTutorialPostNoteCwTitle": "İçerik Uyarısı",
	"initialTutorialPostNoteCwDescription": "Gövde yerine, “Yorumlar” alanına yazılan içerik görüntülenecek. “Devamını oku” düğmesine basıldığında gövde görüntülenecek.",
	"initialTutorialPostNoteCwUseCases": "Bu, sunucu kurallarına uyulurken, gerekli notlar için veya spoiler veya hassas metinlerin kendi kendine kısıtlanması için kullanılır.",
	"initialTutorialPostNoteCwExampleNoteNote": "Az önce çikolata kaplı bir donut yedim 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "Bu kesinlikle sizi acıktıracak!"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"initialTutorialPostNoteDescription1": "When posting a note on Misskey, various options are available. The posting form looks like this.",
	"visibility": "Visibility",
	"initialTutorialPostNoteVisibilityDescription": "You can limit who can view your note.",
	"visibilityPublic": "Public",
	"initialTutorialPostNoteVisibilityPublic": "Your note will be visible for all users.",
	"visibilityHome": "Home",
	"initialTutorialPostNoteVisibilityHome": "Public only on the Home timeline. People visiting your profile, via followers, and through renotes can see it.",
	"visibilityFollowers": "Followers",
	"initialTutorialPostNoteVisibilityFollowers": "Visible to followers only. Only followers can see it and no one else, and it cannot be renoted by others.",
	"visibilitySpecified": "Direct",
	"initialTutorialPostNoteVisibilityDirect": "Visible only to specified users, and the recipient will be notified. It can be used as an alternative to direct messaging.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Be careful when sending sensitive information!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Administrators of the server can see what you write. Be careful with sensitive information when sending direct notes to users on untrusted servers.",
	"visibilityDisableFederation": "Defederate",
	"initialTutorialPostNoteVisibilityLocalOnly": "Posting with this flag will not federate the note to other servers. Users on other servers will not be able to view these notes directly, regardless of the display settings above.",
	"initialTutorialPostNoteCwTitle": "Content Warning",
	"initialTutorialPostNoteCwDescription": "Instead of the body, the content written in 'comments' field will be displayed. Pressing \"read more\" will reveal the body.",
	"initialTutorialPostNoteCwUseCases": "This is used when following the server guidelines, for necessary notes, or for self-restriction of spoiler or sensitive text.",
	"initialTutorialPostNoteCwExampleNoteNote": "Just had a chocolate-glazed donut 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "This will surely make you hungry!"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"initialTutorialPostNoteDescription1": "Коли ви публікуєте нотатку у Missket, доступно декілька її налаштувань. Публікація буде виглядати ось так.",
	"visibility": "Видимість",
	"initialTutorialPostNoteVisibilityDescription": "Ви можете обмежити хто може побачити вашу нотатку.",
	"visibilityPublic": "Публічний",
	"initialTutorialPostNoteVisibilityPublic": "Цю нотатку буде видно для кожного користувача.",
	"visibilityHome": "Домівка",
	"initialTutorialPostNoteVisibilityHome": "Показується лише у домашній стрічці. Люди відвідуючи ваш профіль, через підписки, або через реноти можуть побачити їх. ",
	"visibilityFollowers": "Підписники",
	"initialTutorialPostNoteVisibilityFollowers": "Цю нотатку зможуть побачити лише ваші підписники, й ренотнути цю нотатку неможливо.",
	"visibilitySpecified": "Особисто",
	"initialTutorialPostNoteVisibilityDirect": "Цю нотатку зможуть побачити лише обрані користувачі, та їм буде оголошено про це. Може використовуватися як альтернатива особливим повідомленням.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Будьте обережними з відсиланням конфіденційної інформації!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Адміністратор сервера може бачити що ви пишете. Будьте обережними с чутливою інформацією коли відправляєте особисті нотатки користувачам на ненадійні сервери.",
	"visibilityDisableFederation": "Defederate",
	"initialTutorialPostNoteVisibilityLocalOnly": "Публікування з цією позначкою не буде передаватися приєднаним серверам. Користувачі на інших серверах не зможуть переглядати ці нотатки напряму, всупереч налаштуванню зверху.",
	"initialTutorialPostNoteCwTitle": "Попередження щодо змісту",
	"initialTutorialPostNoteCwDescription": "Замість тіла буде показано зміст секції \"коментарі\". Натискання \"прочитати більше\" покаже тіло.",
	"initialTutorialPostNoteCwUseCases": "Це використовується у разі вимоги правил серверу, для обов'язкових нотаток, або заради самообмеження чутливого контенту.",
	"initialTutorialPostNoteCwExampleNoteNote": "Їх тут і насправді нема. Я ж попереджав!",
	"initialTutorialPostNoteCwExampleNoteCw": "Увага: тут нема котиків!"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"initialTutorialPostNoteDescription1": "When posting a note on Misskey, various options are available. The posting form looks like this.",
	"visibility": "Hiển thị",
	"initialTutorialPostNoteVisibilityDescription": "You can limit who can view your note.",
	"visibilityPublic": "Công khai",
	"initialTutorialPostNoteVisibilityPublic": "Your note will be visible for all users.",
	"visibilityHome": "Trang chính",
	"initialTutorialPostNoteVisibilityHome": "Chỉ công khai trên dòng thời gian Trang chủ. Những người truy cập trang cá nhân của bạn, thông qua người theo dõi và thông qua ghi chú lại có thể thấy thông tin đó.",
	"visibilityFollowers": "Người theo dõi",
	"initialTutorialPostNoteVisibilityFollowers": "Visible to followers only. Only followers can see it and no one else, and it cannot be renoted by others.",
	"visibilitySpecified": "Nhắn riêng",
	"initialTutorialPostNoteVisibilityDirect": "Visible only to specified users, and the recipient will be notified. It can be used as an alternative to direct messaging.",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "Be careful when sending sensitive information!",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "Administrators of the server can see what you write. Be careful with sensitive information when sending direct notes to users on untrusted servers.",
	"visibilityDisableFederation": "Không liên hợp",
	"initialTutorialPostNoteVisibilityLocalOnly": "Posting with this flag will not federate the note to other servers. Users on other servers will not be able to view these notes directly, regardless of the display settings above.",
	"initialTutorialPostNoteCwTitle": "Content Warning",
	"initialTutorialPostNoteCwDescription": "Instead of the body, the content written in 'comments' field will be displayed. Pressing \"read more\" will reveal the body.",
	"initialTutorialPostNoteCwUseCases": "This is used when following the server guidelines, for necessary notes, or for self-restriction of spoiler or sensitive text.",
	"initialTutorialPostNoteCwExampleNoteNote": "Just had a chocolate-glazed donut 🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "This will surely make you hungry!"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"initialTutorialPostNoteDescription1": "在 Misskey 发布帖子时，您可以设置各种选项。发帖窗口看起来是这样的。\n",
	"visibility": "可见性",
	"initialTutorialPostNoteVisibilityDescription": "您可以限制谁可以看到您的帖子。",
	"visibilityPublic": "公开",
	"initialTutorialPostNoteVisibilityPublic": "向所有用户公开。\n",
	"visibilityHome": "首页",
	"initialTutorialPostNoteVisibilityHome": "仅发布至首页时间线。 仅您的关注者，以及从个人资料页、通过转帖，其他用户才能够看到。",
	"visibilityFollowers": "仅关注者",
	"initialTutorialPostNoteVisibilityFollowers": "仅关注者可见。 除了您自己，其他人无法转贴。",
	"visibilitySpecified": "指定用户",
	"initialTutorialPostNoteVisibilityDirect": "仅对指定用户公开，且收件人将收到通知。",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "发送敏感信息时请注意。\n",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "目标服务器的管理员可以看到发布的内容，因此如果您向不受信任的服务器上的用户发送私信，则在处理敏感信息时需要小心。",
	"visibilityDisableFederation": "仅限本地",
	"initialTutorialPostNoteVisibilityLocalOnly": "不将帖子通过联邦推送到其它服务器。 无论上述公开范围如何，其它服务器的用户将无法看到附加了此设定的帖子。\n",
	"initialTutorialPostNoteCwTitle": "隐藏内容（CW）",
	"initialTutorialPostNoteCwDescription": "显示 “注释” 中的内容，而非正文。点击 “查看更多” 以显示正文。",
	"initialTutorialPostNoteCwUseCases": "用于服务器条款所规定的帖子，或对剧透内容和敏感内容进行自主规制。",
	"initialTutorialPostNoteCwExampleNoteNote": "茨了带巧克力的甜甜圈🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "深夜报复社会"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"initialTutorialPostNoteDescription1": "在Misskey上發布貼文時，可以設定各種選項。發布表單如下所示。",
	"visibility": "可見性",
	"initialTutorialPostNoteVisibilityDescription": "可以限制誰可以看到您的貼文。",
	"visibilityPublic": "公開",
	"initialTutorialPostNoteVisibilityPublic": "所有人都可以看見。",
	"visibilityHome": "首頁",
	"initialTutorialPostNoteVisibilityHome": "僅在首頁時間軸上發布。其他使用者只在下列情況可看見該貼文：追隨者、觀看使用者的個人資料頁面，以及貼文被轉發時。",
	"visibilityFollowers": "追隨者",
	"initialTutorialPostNoteVisibilityFollowers": "僅追隨者可見。只有發文者本人可轉發，未追隨發文者的使用者無法看見。",
	"visibilitySpecified": "指定使用者",
	"initialTutorialPostNoteVisibilityDirect": "僅指定的使用者可見，對方也會收到通知。可代替直接訊息使用。",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect1": "發送機密訊息時請務必注意。",
	"initialTutorialPostNoteVisibilityDoNotSendConfidencialOnDirect2": "目標伺服器的管理員可以看到發布的內容，因此如果您向不受信任的伺服器上的使用者發送直接訊息，必須小心處理機密訊息。",
	"visibilityDisableFederation": "停用聯邦",
	"initialTutorialPostNoteVisibilityLocalOnly": "不將貼文發布到聯邦上的其他伺服器。不論上述發布範圍，使用此設定後，其他伺服器上的使用者將無法直接查看此貼文。",
	"initialTutorialPostNoteCwTitle": "隱藏內容（CW）",
	"initialTutorialPostNoteCwDescription": "將顯示「註釋」中寫入的內容而不是本文。按一下「顯示內容」以顯示本文。",
	"initialTutorialPostNoteCwUseCases": "伺服器的服務條款可能會規範特定的貼文需要使用隱藏內容，除此之外也會用在隱藏劇情洩漏與敏感內容的貼文。",
	"initialTutorialPostNoteCwExampleNoteNote": "我吃了一個巧克力甜甜圈🍩😋",
	"initialTutorialPostNoteCwExampleNoteCw": "注意消夜文"
}
</locale>
