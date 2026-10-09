<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div style="text-align: center; padding: 0 16px;">{{ $locale.sfc.initialTutorialTimelineDescription1 }}</div>
	<div class="_gaps_s">
		<div v-for="tl in basicTimelineTypes">
			<i :class="basicTimelineIconClass(tl)"></i> <b>{{ copyLocaleDictionary($locale.sfc.timelinesLabels)[tl] }}</b> … {{ copyLocaleDictionary($locale.sfc.initialTutorialTimelineLabels)[tl] }}
		</div>
	</div>
	<div class="_gaps_s">
		<div>{{ $locale.sfc.initialTutorialTimelineDescription2 }}</div>
		<img :class="$style.image" src="/client-assets/tutorial/timeline_tab.png"/>
	</div>
	<div :class="$style.divider"></div>
	<I18n :src="$locale.sfc.initialTutorialTimelineDescription3" tag="div" style="padding: 0 16px;">
		<template #link>
			<a href="https://misskey-hub.net/docs/for-users/features/timeline/" target="_blank" class="_link">{{ $locale.sfc.help }}</a>
		</template>
	</I18n>
</div>
</template>

<script setup lang="ts">
import { copyLocaleDictionary } from '@features/runtime/frontend/copy-locale-dictionary.js';
import { basicTimelineIconClass, basicTimelineTypes } from '@features/timelines/frontend/timelines.js';
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
	"initialTutorialTimelineDescription1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
	"timelinesLabels": {
		"home": "الرئيسي",
		"local": "المحلي",
		"social": "الاجتماعي",
		"global": "الشامل"
	},
	"initialTutorialTimelineLabels": {
		"title": "The Concept of Timelines",
		"description1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
		"home": "You can view notes from accounts you follow.",
		"local": "You can view notes from all users on this server.",
		"social": "Notes from the Home and Local timelines will be displayed.",
		"global": "You can view notes from all connected servers.",
		"description2": "You can switch between timelines at the top of the screen at any time.",
		"description3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}."
	},
	"initialTutorialTimelineDescription2": "You can switch between timelines at the top of the screen at any time.",
	"initialTutorialTimelineDescription3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}.",
	"help": "المساعدة"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"initialTutorialTimelineDescription1": "Misskey mostra diferents línies de temps basades en l'ús (algunes poden no estar disponibles depenent de la política del servidor)",
	"timelinesLabels": {
		"home": "Inici",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"initialTutorialTimelineLabels": {
		"title": "El concepte de les línies de temps",
		"description1": "Misskey mostra diferents línies de temps basades en l'ús (algunes poden no estar disponibles depenent de la política del servidor)",
		"home": "Pots veure notes dels comptes que segueixes",
		"local": "Pots veure les notes dels usuaris del servidor.",
		"social": "Es mostren les notes de les línies de temps d'Inici i Local.",
		"global": "Pots veure les notes de tots els servidors connectats.",
		"description2": "Pots canviar la línia de temps en qualsevol moment fent servir la barra de la pantalla superior.",
		"description3": "A més hi ha línies de temps per llistes i per canals. Si vols saber més {link}."
	},
	"initialTutorialTimelineDescription2": "Pots canviar la línia de temps en qualsevol moment fent servir la barra de la pantalla superior.",
	"initialTutorialTimelineDescription3": "A més hi ha línies de temps per llistes i per canals. Si vols saber més {link}.",
	"help": "Ajuda"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"initialTutorialTimelineDescription1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
	"timelinesLabels": {
		"home": "Domů",
		"local": "Místní",
		"social": "Sociální síť",
		"global": "Globální"
	},
	"initialTutorialTimelineLabels": {
		"title": "The Concept of Timelines",
		"description1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
		"home": "You can view notes from accounts you follow.",
		"local": "You can view notes from all users on this server.",
		"social": "Notes from the Home and Local timelines will be displayed.",
		"global": "You can view notes from all connected servers.",
		"description2": "You can switch between timelines at the top of the screen at any time.",
		"description3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}."
	},
	"initialTutorialTimelineDescription2": "You can switch between timelines at the top of the screen at any time.",
	"initialTutorialTimelineDescription3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}.",
	"help": "Nápověda"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"initialTutorialTimelineDescription1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"initialTutorialTimelineLabels": {
		"title": "The Concept of Timelines",
		"description1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
		"home": "You can view notes from accounts you follow.",
		"local": "You can view notes from all users on this server.",
		"social": "Notes from the Home and Local timelines will be displayed.",
		"global": "You can view notes from all connected servers.",
		"description2": "You can switch between timelines at the top of the screen at any time.",
		"description3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}."
	},
	"initialTutorialTimelineDescription2": "You can switch between timelines at the top of the screen at any time.",
	"initialTutorialTimelineDescription3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}.",
	"help": "Help"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"initialTutorialTimelineDescription1": "Misskey stellt mehrere Chroniken bereit (einige können je nach den Richtlinien des Servers nicht verfügbar sein).",
	"timelinesLabels": {
		"home": "Startseite",
		"local": "Lokal",
		"social": "Sozial",
		"global": "Global"
	},
	"initialTutorialTimelineLabels": {
		"title": "So funktionieren die Chroniken",
		"description1": "Misskey stellt mehrere Chroniken bereit (einige können je nach den Richtlinien des Servers nicht verfügbar sein).",
		"home": "Du kannst Beiträge von den Konten sehen, denen du folgst.",
		"local": "Du kannst Beiträge aller Benutzer auf diesem Server sehen.",
		"social": "Notizen von der Startseite und der lokalen Chronik werden angezeigt.",
		"global": "Du kannst Notizen von allen föderierten Servern sehen.",
		"description2": "Du kannst jederzeit am oberen Rand des Bildschirms zwischen den jeweiligen Chroniken wechseln.",
		"description3": "Darüber hinaus gibt es Listen-Chroniken und Kanal-Chroniken. Weitere Einzelheiten findest du unter {link}."
	},
	"initialTutorialTimelineDescription2": "Du kannst jederzeit am oberen Rand des Bildschirms zwischen den jeweiligen Chroniken wechseln.",
	"initialTutorialTimelineDescription3": "Darüber hinaus gibt es Listen-Chroniken und Kanal-Chroniken. Weitere Einzelheiten findest du unter {link}.",
	"help": "Hilfe"
}
</locale>

<locale lang="json" locale="en-US">
{
	"initialTutorialTimelineDescription1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"initialTutorialTimelineLabels": {
		"title": "The Concept of Timelines",
		"description1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
		"home": "You can view notes from accounts you follow.",
		"local": "You can view notes from all users on this server.",
		"social": "Notes from the Home and Local timelines will be displayed.",
		"global": "You can view notes from all connected servers.",
		"description2": "You can switch between timelines at the top of the screen at any time.",
		"description3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}."
	},
	"initialTutorialTimelineDescription2": "You can switch between timelines at the top of the screen at any time.",
	"initialTutorialTimelineDescription3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}.",
	"help": "Help"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"initialTutorialTimelineDescription1": "Misskey proporciona múltiples líneas de tiempo basadas en su uso (algunas pueden no estar disponibles dependiendo de las políticas de la instancia).",
	"timelinesLabels": {
		"home": "Inicio",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"initialTutorialTimelineLabels": {
		"title": "El concepto de Línea de tiempo",
		"description1": "Misskey proporciona múltiples líneas de tiempo basadas en su uso (algunas pueden no estar disponibles dependiendo de las políticas de la instancia).",
		"home": "Puedes ver los posts de las cuentas que sigues.",
		"local": "Puedes ver los posts de todos los usuarios de este servidor (también llamado instancia).",
		"social": "Se ven los posts de la línea de tiempo de inicio junto con los de la línea de tiempo local.",
		"global": "Puedes ver notas de todos los servidores (instancias) conectados.",
		"description2": "Puedes cambiar la línea de tiempo en la parte superior de la pantalla cuando quieras.",
		"description3": "Además, hay listas de líneas de tiempo y listas de canales. Para más detalle, por favor visita este enlace: {link}"
	},
	"initialTutorialTimelineDescription2": "Puedes cambiar la línea de tiempo en la parte superior de la pantalla cuando quieras.",
	"initialTutorialTimelineDescription3": "Además, hay listas de líneas de tiempo y listas de canales. Para más detalle, por favor visita este enlace: {link}",
	"help": "Ayuda"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"initialTutorialTimelineDescription1": "Misskey offre plusieurs fils selon l'usage (certains peuvent être désactivés par le serveur).",
	"timelinesLabels": {
		"home": "Principal",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"initialTutorialTimelineLabels": {
		"title": "Fonctionnement des fils",
		"description1": "Misskey offre plusieurs fils selon l'usage (certains peuvent être désactivés par le serveur).",
		"home": "Vous pouvez voir les notes des utilisateurs auxquels vous êtes abonné·e.",
		"local": "Vous pouvez voir les notes de tous les utilisateurs sur cette instance.",
		"social": "Les notes des fils principal et local sont affichées.",
		"global": "Vous pouvez voir les notes de toutes les instances connectées.",
		"description2": "Vous pouvez passer d'un fil à l'autre en haut de l'écran à tout moment.",
		"description3": "De plus, il y a les fils des listes et des canaux. Pour plus de détails, consultez {link}."
	},
	"initialTutorialTimelineDescription2": "Vous pouvez passer d'un fil à l'autre en haut de l'écran à tout moment.",
	"initialTutorialTimelineDescription3": "De plus, il y a les fils des listes et des canaux. Pour plus de détails, consultez {link}.",
	"help": "Aide"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"initialTutorialTimelineDescription1": "Misskey menyediakan berbagai lini masa sesuai dengan penggunaan (beberapa mungkin tidak tersedia karena bergantung dengan kebijakan peladen).",
	"timelinesLabels": {
		"home": "Beranda",
		"local": "Lokal",
		"social": "Sosial",
		"global": "Global"
	},
	"initialTutorialTimelineLabels": {
		"title": "Konsep Lini Masa",
		"description1": "Misskey menyediakan berbagai lini masa sesuai dengan penggunaan (beberapa mungkin tidak tersedia karena bergantung dengan kebijakan peladen).",
		"home": "Kamu dapat melihat catatan dari akun yang kamu ikuti.",
		"local": "Kamu dapat melihat catatan dari semua pengguna yang ada pada peladen ini.",
		"social": "Catatan dari linimasa Beranda dan Lokal akan ditampilkan.",
		"global": "Kamu dapat melihat catatan dari semua peladen yang terhubung.",
		"description2": "Kamu dapat mengganti linimasa di bagian atas layar kamu kapan saja.",
		"description3": "Sebagai tambahan, terdapat juga linimasa daftar dan linimasa kanal. Untuk detil lebih lanjut, silahkan melihat ke tautan berikut: {link}."
	},
	"initialTutorialTimelineDescription2": "Kamu dapat mengganti linimasa di bagian atas layar kamu kapan saja.",
	"initialTutorialTimelineDescription3": "Sebagai tambahan, terdapat juga linimasa daftar dan linimasa kanal. Untuk detil lebih lanjut, silahkan melihat ke tautan berikut: {link}.",
	"help": "Bantuan"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"initialTutorialTimelineDescription1": "Misskey fornisce alcune Timeline (sequenze cronologiche di Note). Una di queste potrebbe essere stata disattivata dagli amministratori.",
	"timelinesLabels": {
		"home": "Home",
		"local": "Locale",
		"social": "Sociale",
		"global": "Federata"
	},
	"initialTutorialTimelineLabels": {
		"title": "Come funziona la Timeline",
		"description1": "Misskey fornisce alcune Timeline (sequenze cronologiche di Note). Una di queste potrebbe essere stata disattivata dagli amministratori.",
		"home": "le Note provenienti dai profili che segui (Following).",
		"local": "tutte le Note pubblicate dai profili di questa istanza.",
		"social": "sia le Note della Timeline Home che quelle della Timeline Locale, insieme!",
		"global": "le Note da pubblicate da tutte le altre istanze federate con la nostra.",
		"description2": "Nella parte superiore dello schermo, puoi scegliere una Timeline o l'altra in qualsiasi momento.",
		"description3": "Ci sono anche sequenze temporali di elenchi, sequenze temporali di canali, ecc. Per ulteriori dettagli, consultare la {link}.\nPuoi vedere anche Timeline delle liste di profili (se ne hai create), canali, ecc... Per i dettagli, c'è la {link}."
	},
	"initialTutorialTimelineDescription2": "Nella parte superiore dello schermo, puoi scegliere una Timeline o l'altra in qualsiasi momento.",
	"initialTutorialTimelineDescription3": "Ci sono anche sequenze temporali di elenchi, sequenze temporali di canali, ecc. Per ulteriori dettagli, consultare la {link}.\nPuoi vedere anche Timeline delle liste di profili (se ne hai create), canali, ecc... Per i dettagli, c'è la {link}.",
	"help": "Guida"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"initialTutorialTimelineDescription1": "Misskeyには、使い方に応じて複数のタイムラインが用意されています（サーバーによってはいずれかが無効になっていることがあります）。",
	"timelinesLabels": {
		"home": "ホーム",
		"local": "ローカル",
		"social": "ソーシャル",
		"global": "グローバル"
	},
	"initialTutorialTimelineLabels": {
		"title": "タイムラインのしくみ",
		"description1": "Misskeyには、使い方に応じて複数のタイムラインが用意されています（サーバーによってはいずれかが無効になっていることがあります）。",
		"home": "あなたがフォローしているアカウントの投稿を見られます。",
		"local": "このサーバーにいるユーザー全員の投稿を見られます。",
		"social": "ホームタイムラインとローカルタイムラインの投稿が両方表示されます。",
		"global": "接続している他のすべてのサーバーからの投稿を見られます。",
		"description2": "それぞれのタイムラインは、画面上部でいつでも切り替えられます。",
		"description3": "その他にも、リストタイムラインやチャンネルタイムラインなどがあります。詳しくは{link}をご覧ください。"
	},
	"initialTutorialTimelineDescription2": "それぞれのタイムラインは、画面上部でいつでも切り替えられます。",
	"initialTutorialTimelineDescription3": "その他にも、リストタイムラインやチャンネルタイムラインなどがあります。詳しくは{link}をご覧ください。",
	"help": "ヘルプ"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"initialTutorialTimelineDescription1": "Misskeyには、いろいろタイムラインがあんで（ただ、サーバーによっては無効化されてるところもあるな）。",
	"timelinesLabels": {
		"home": "ホーム",
		"local": "ローカル",
		"social": "ソーシャル",
		"global": "グローバル"
	},
	"initialTutorialTimelineLabels": {
		"title": "タイムラインのしくみ",
		"description1": "Misskeyには、いろいろタイムラインがあんで（ただ、サーバーによっては無効化されてるところもあるな）。",
		"home": "あんたがフォローしてるアカウントの投稿が見れんねん。",
		"local": "このサーバーの中におる全員の投稿が見れるで。",
		"social": "ホームタイムラインの投稿もローカルタイムラインのも一緒に見れるで。",
		"global": "繋がってる他の全サーバーからの投稿が見れるで。",
		"description2": "それぞれのタイムラインは、いつでも画面上で切り替えられんねん。覚えとき。",
		"description3": "その他にも、リストタイムラインとかチャンネルタイムラインとかがあんねん。詳しいのは{link}を見ときや。"
	},
	"initialTutorialTimelineDescription2": "それぞれのタイムラインは、いつでも画面上で切り替えられんねん。覚えとき。",
	"initialTutorialTimelineDescription3": "その他にも、リストタイムラインとかチャンネルタイムラインとかがあんねん。詳しいのは{link}を見ときや。",
	"help": "ヘルプ"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"initialTutorialTimelineDescription1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"initialTutorialTimelineLabels": {
		"title": "The Concept of Timelines",
		"description1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
		"home": "You can view notes from accounts you follow.",
		"local": "You can view notes from all users on this server.",
		"social": "Notes from the Home and Local timelines will be displayed.",
		"global": "You can view notes from all connected servers.",
		"description2": "You can switch between timelines at the top of the screen at any time.",
		"description3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}."
	},
	"initialTutorialTimelineDescription2": "You can switch between timelines at the top of the screen at any time.",
	"initialTutorialTimelineDescription3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}.",
	"help": "Help"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"initialTutorialTimelineDescription1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"initialTutorialTimelineLabels": {
		"title": "The Concept of Timelines",
		"description1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
		"home": "You can view notes from accounts you follow.",
		"local": "You can view notes from all users on this server.",
		"social": "Notes from the Home and Local timelines will be displayed.",
		"global": "You can view notes from all connected servers.",
		"description2": "You can switch between timelines at the top of the screen at any time.",
		"description3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}."
	},
	"initialTutorialTimelineDescription2": "You can switch between timelines at the top of the screen at any time.",
	"initialTutorialTimelineDescription3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}.",
	"help": "Help"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"initialTutorialTimelineDescription1": "Misskey에는 종류에 따라 여러 가지의 타임라인으로 구성되어 있습니다.(서버에 따라서는 일부 타임라인을 사용할 수 없는 경우가 있습니다)",
	"timelinesLabels": {
		"home": "홈",
		"local": "로컬",
		"social": "소셜",
		"global": "글로벌"
	},
	"initialTutorialTimelineLabels": {
		"title": "타임라인에 대하여",
		"description1": "Misskey에는 종류에 따라 여러 가지의 타임라인으로 구성되어 있습니다.(서버에 따라서는 일부 타임라인을 사용할 수 없는 경우가 있습니다)",
		"home": "내가 팔로우 중인 계정의 노트를 볼 수 있습니다.",
		"local": "이 서버에 있는 모든 유저의 게시물을 볼 수 있습니다.",
		"social": "홈 타임라인과 로컬 타임라인의 게시물을 모두 볼 수 있습니다.",
		"global": "연결되어 있는 모든 서버의 게시물을 볼 수 있습니다.",
		"description2": "각각의 타임라인은 화면 상단에서 언제든지 변경할 수 있습니다.",
		"description3": "이 외에도, '리스트 타임라인'이나 '채널 타임라인' 등이 있습니다. 자세한 사항은 {link}에서 확인하실 수 있습니다."
	},
	"initialTutorialTimelineDescription2": "각각의 타임라인은 화면 상단에서 언제든지 변경할 수 있습니다.",
	"initialTutorialTimelineDescription3": "이 외에도, '리스트 타임라인'이나 '채널 타임라인' 등이 있습니다. 자세한 사항은 {link}에서 확인하실 수 있습니다.",
	"help": "도움말"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"initialTutorialTimelineDescription1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
	"timelinesLabels": {
		"home": "Startpagina",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"initialTutorialTimelineLabels": {
		"title": "The Concept of Timelines",
		"description1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
		"home": "You can view notes from accounts you follow.",
		"local": "You can view notes from all users on this server.",
		"social": "Notes from the Home and Local timelines will be displayed.",
		"global": "You can view notes from all connected servers.",
		"description2": "You can switch between timelines at the top of the screen at any time.",
		"description3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}."
	},
	"initialTutorialTimelineDescription2": "You can switch between timelines at the top of the screen at any time.",
	"initialTutorialTimelineDescription3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}.",
	"help": "Help"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"initialTutorialTimelineDescription1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
	"timelinesLabels": {
		"home": "Hjem",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"initialTutorialTimelineLabels": {
		"title": "The Concept of Timelines",
		"description1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
		"home": "You can view notes from accounts you follow.",
		"local": "You can view notes from all users on this server.",
		"social": "Notes from the Home and Local timelines will be displayed.",
		"global": "You can view notes from all connected servers.",
		"description2": "You can switch between timelines at the top of the screen at any time.",
		"description3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}."
	},
	"initialTutorialTimelineDescription2": "You can switch between timelines at the top of the screen at any time.",
	"initialTutorialTimelineDescription3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}.",
	"help": "Hjelp"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"initialTutorialTimelineDescription1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
	"timelinesLabels": {
		"home": "Strona główna",
		"local": "Lokalne",
		"social": "Społeczność",
		"global": "Globalna"
	},
	"initialTutorialTimelineLabels": {
		"title": "The Concept of Timelines",
		"description1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
		"home": "You can view notes from accounts you follow.",
		"local": "You can view notes from all users on this server.",
		"social": "Notes from the Home and Local timelines will be displayed.",
		"global": "You can view notes from all connected servers.",
		"description2": "You can switch between timelines at the top of the screen at any time.",
		"description3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}."
	},
	"initialTutorialTimelineDescription2": "You can switch between timelines at the top of the screen at any time.",
	"initialTutorialTimelineDescription3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}.",
	"help": "Pomoc"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"initialTutorialTimelineDescription1": "Misskey providencia diversas linhas do tempo baseadas na sua utilidade (algumas podem não estar disponíveis a partir das configurações da instância).",
	"timelinesLabels": {
		"home": "Início",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"initialTutorialTimelineLabels": {
		"title": "O Conceito das Linhas do Tempo",
		"description1": "Misskey providencia diversas linhas do tempo baseadas na sua utilidade (algumas podem não estar disponíveis a partir das configurações da instância).",
		"home": "Você pode ver as notas das contas seguidas. ",
		"local": "Você pode ver notas de todos os usuários dessa instância.",
		"social": "Notas da linha do tempo Início e Local serão exibidas.",
		"global": "Você pode ver notas de todos os servidores conectados.",
		"description2": "Você pode alterar dentre as linhas do tempo no todo da tela a qualquer momento.",
		"description3": "Adicionalmente, há \"listas\" e \"canais\". Para mais informações, acesse {link}."
	},
	"initialTutorialTimelineDescription2": "Você pode alterar dentre as linhas do tempo no todo da tela a qualquer momento.",
	"initialTutorialTimelineDescription3": "Adicionalmente, há \"listas\" e \"canais\". Para mais informações, acesse {link}.",
	"help": "Ajuda"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"initialTutorialTimelineDescription1": "Misskey предоставляет несколько лент в зависимости от того как вы им пользуетесь (некоторые могут быть недоступны в зависимости от правил сервера).",
	"timelinesLabels": {
		"home": "Персональная",
		"local": "Местная",
		"social": "Социальная",
		"global": "Всеобщая"
	},
	"initialTutorialTimelineLabels": {
		"title": "Концепция Лент",
		"description1": "Misskey предоставляет несколько лент в зависимости от того как вы им пользуетесь (некоторые могут быть недоступны в зависимости от правил сервера).",
		"home": "Вы можете смотреть заметки от пользователей на которых вы подписаны.",
		"local": "Вы можете смотреть заметки от всех пользователей на сервере.",
		"social": "Посты из домашней и локальной ленты будут показаны тут.",
		"global": "Вы можете смотреть заметки со всех присоединённых серверов тут.",
		"description2": "Вы можете переключаться между лентами вверху в любое время.",
		"description3": "Так же есть списковые ленты и ленты каналов. Для подробностей, загляните в {link}."
	},
	"initialTutorialTimelineDescription2": "Вы можете переключаться между лентами вверху в любое время.",
	"initialTutorialTimelineDescription3": "Так же есть списковые ленты и ленты каналов. Для подробностей, загляните в {link}.",
	"help": "Помощь"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"initialTutorialTimelineDescription1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
	"timelinesLabels": {
		"home": "Domov",
		"local": "Lokálne",
		"social": "Sociálne",
		"global": "Globálne"
	},
	"initialTutorialTimelineLabels": {
		"title": "The Concept of Timelines",
		"description1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
		"home": "You can view notes from accounts you follow.",
		"local": "You can view notes from all users on this server.",
		"social": "Notes from the Home and Local timelines will be displayed.",
		"global": "You can view notes from all connected servers.",
		"description2": "You can switch between timelines at the top of the screen at any time.",
		"description3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}."
	},
	"initialTutorialTimelineDescription2": "You can switch between timelines at the top of the screen at any time.",
	"initialTutorialTimelineDescription3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}.",
	"help": "Pomoc"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"initialTutorialTimelineDescription1": "Misskey มีหลายไทม์ไลน์ขึ้นอยู่กับวิธีการใช้งานของคุณ (บางไทม์ไลน์อาจไม่สามารถใช้ได้ขึ้นอยู่กับนโยบายของเซิร์ฟเวอร์)",
	"timelinesLabels": {
		"home": "หน้าหลัก",
		"local": "ท้องถิ่น",
		"social": "โซเชียล",
		"global": "ทั่วโลก"
	},
	"initialTutorialTimelineLabels": {
		"title": "แนวคิดเรื่องของไทม์ไลน์",
		"description1": "Misskey มีหลายไทม์ไลน์ขึ้นอยู่กับวิธีการใช้งานของคุณ (บางไทม์ไลน์อาจไม่สามารถใช้ได้ขึ้นอยู่กับนโยบายของเซิร์ฟเวอร์)",
		"home": "คุณสามารถดูโพสต์จากบัญชีที่คุณติดตามได้",
		"local": "คุณสามารถดูโพสต์จากผู้ใช้ทั้งหมดบนเซิร์ฟเวอร์นี้",
		"social": "จะแสดงโพสต์ทั้งจากไทม์ไลน์หลักและไทม์ไลน์ท้องถิ่น",
		"global": "คุณสามารถดูโพสต์จากเซิร์ฟเวอร์ที่เชื่อมต่ออื่นๆ ทั้งหมดได้",
		"description2": "คุณสามารถสลับระหว่างแต่ละไทม์ไลน์ได้ตลอดเวลาได้ที่บริเวณด้านบนของหน้าจอ",
		"description3": "นอกจากนี้ยังมีรายการไทม์ไลน์ ไทม์ไลน์ของช่อง ฯลฯ โปรดดู {link} สำหรับรายละเอียดเพิ่มเติม"
	},
	"initialTutorialTimelineDescription2": "คุณสามารถสลับระหว่างแต่ละไทม์ไลน์ได้ตลอดเวลาได้ที่บริเวณด้านบนของหน้าจอ",
	"initialTutorialTimelineDescription3": "นอกจากนี้ยังมีรายการไทม์ไลน์ ไทม์ไลน์ของช่อง ฯลฯ โปรดดู {link} สำหรับรายละเอียดเพิ่มเติม",
	"help": "ช่วยเหลือ"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"initialTutorialTimelineDescription1": "Misskey, kullanıma göre birden fazla Pano sunar (Bazı Pano'lar sunucunun politikalarına bağlı olarak kullanılamayabilir).",
	"timelinesLabels": {
		"home": "Pano",
		"local": "Yerel",
		"social": "Sosyal",
		"global": "Global"
	},
	"initialTutorialTimelineLabels": {
		"title": "Pano Kavramı",
		"description1": "Misskey, kullanıma göre birden fazla Pano sunar (Bazı Pano'lar sunucunun politikalarına bağlı olarak kullanılamayabilir).",
		"home": "Takip ettiğin hesapların notlarını görüntüleyebilirsin.",
		"local": "Bu sunucudaki tüm kullanıcıların notlarını görüntüleyebilirsin.",
		"social": "Ev ve Yerel Pano'dan notlar görüntülenecek.",
		"global": "Bağlı tüm sunuculardan gelen notları görüntüleyebilirsin.",
		"description2": "Ekranın üst kısmındaki Pano'lar arasında istediğin zaman geçiş yapabilirsin.",
		"description3": "Ayrıca, Liste Pano ve Kanal Pano da bulunmaktadır. Daha fazla ayrıntı için lütfen {link} adresine bakın."
	},
	"initialTutorialTimelineDescription2": "Ekranın üst kısmındaki Pano'lar arasında istediğin zaman geçiş yapabilirsin.",
	"initialTutorialTimelineDescription3": "Ayrıca, Liste Pano ve Kanal Pano da bulunmaktadır. Daha fazla ayrıntı için lütfen {link} adresine bakın.",
	"help": "Yardım"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"initialTutorialTimelineDescription1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
	"timelinesLabels": {
		"home": "Home",
		"local": "Local",
		"social": "Social",
		"global": "Global"
	},
	"initialTutorialTimelineLabels": {
		"title": "The Concept of Timelines",
		"description1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
		"home": "You can view notes from accounts you follow.",
		"local": "You can view notes from all users on this server.",
		"social": "Notes from the Home and Local timelines will be displayed.",
		"global": "You can view notes from all connected servers.",
		"description2": "You can switch between timelines at the top of the screen at any time.",
		"description3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}."
	},
	"initialTutorialTimelineDescription2": "You can switch between timelines at the top of the screen at any time.",
	"initialTutorialTimelineDescription3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}.",
	"help": "Help"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"initialTutorialTimelineDescription1": "Misskey надає декілька стрічок в залежності від того, як ви ними користуєтесь (деякі можуть бути недоступні в залежності від правил серверу).",
	"timelinesLabels": {
		"home": "Домівка",
		"local": "Локальна",
		"social": "Соціальна",
		"global": "Глобальна"
	},
	"initialTutorialTimelineLabels": {
		"title": "Концепт Стрічок",
		"description1": "Misskey надає декілька стрічок в залежності від того, як ви ними користуєтесь (деякі можуть бути недоступні в залежності від правил серверу).",
		"home": "Ви можете переглядати нотатки від облікових записів на які ви підписані. ",
		"local": "Ви можете переглядати нотатки від усіх користувачів цього сервера.",
		"social": "Нотатки з домашньої й локальної стрічки будуть показані тут.",
		"global": "Ви можете переглядати нотатки з усіх під'єднаних серверів.",
		"description2": "Ви можете перемикатися між стрічками зверху вашого екрану у будь-який час.",
		"description3": "Також є спискові стрічки й канальні стрічки. Детальніше написано у {link}."
	},
	"initialTutorialTimelineDescription2": "Ви можете перемикатися між стрічками зверху вашого екрану у будь-який час.",
	"initialTutorialTimelineDescription3": "Також є спискові стрічки й канальні стрічки. Детальніше написано у {link}.",
	"help": "Допомога"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"initialTutorialTimelineDescription1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
	"timelinesLabels": {
		"home": "Trang chính",
		"local": "Máy chủ này",
		"social": "Xã hội",
		"global": "Liên hợp"
	},
	"initialTutorialTimelineLabels": {
		"title": "The Concept of Timelines",
		"description1": "Misskey provides multiple timelines based on usage (some may not be available depending on the server's policies).",
		"home": "Bạn có thể xem ghi chú từ những tài khoản bạn theo dõi.",
		"local": "Bạn có thể xem ghi chú từ tất cả người dùng trên máy chủ này.",
		"social": "Ghi chú từ dòng thời gian Trang chủ và Địa phương sẽ được hiển thị.",
		"global": "Bạn có thể xem ghi chú từ tất cả các máy chủ được kết nối.",
		"description2": "You can switch between timelines at the top of the screen at any time.",
		"description3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}."
	},
	"initialTutorialTimelineDescription2": "You can switch between timelines at the top of the screen at any time.",
	"initialTutorialTimelineDescription3": "Additionally, there are list timelines and channel timelines. For more details, please refer to {link}.",
	"help": "Trợ giúp"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"initialTutorialTimelineDescription1": "Misskey 根据使用方式提供了多个时间线（根据服务器的设定，可能有一些被禁用）。",
	"timelinesLabels": {
		"home": "首页",
		"local": "本地",
		"social": "社交",
		"global": "全局"
	},
	"initialTutorialTimelineLabels": {
		"title": "时间线的运作方式",
		"description1": "Misskey 根据使用方式提供了多个时间线（根据服务器的设定，可能有一些被禁用）。",
		"home": "可以查看您关注的账户的帖子。",
		"local": "可以查看这个服务器上所有用户发表的帖子。",
		"social": "将同时显示首页时间线和本地时间线的内容。",
		"global": "可以查看所有已联合的服务器上的帖子。",
		"description2": "可以随时在屏幕顶部在每个时间线之间切换。",
		"description3": "另外，还有列表时间线和频道时间线。请参阅{link}了解更多详细信息。"
	},
	"initialTutorialTimelineDescription2": "可以随时在屏幕顶部在每个时间线之间切换。",
	"initialTutorialTimelineDescription3": "另外，还有列表时间线和频道时间线。请参阅{link}了解更多详细信息。",
	"help": "帮助"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"initialTutorialTimelineDescription1": "Misskey根據使用方式提供了多個時間軸（伺服器可能會將部份時間軸停用）。",
	"timelinesLabels": {
		"home": "首頁",
		"local": "本地",
		"social": "社交",
		"global": "公開"
	},
	"initialTutorialTimelineLabels": {
		"title": "時間軸如何運作",
		"description1": "Misskey根據使用方式提供了多個時間軸（伺服器可能會將部份時間軸停用）。",
		"home": "您可以查看您追隨的使用者的貼文。",
		"local": "您可以看到此伺服器上所有使用者的貼文。",
		"social": "來自首頁時間軸和本地時間軸的貼文都會顯示。",
		"global": "可以看到其他已連接伺服器的貼文。",
		"description2": "您可以隨時在螢幕上方切換對應的時間軸。",
		"description3": "除此之外還有清單時間軸、頻道時間軸等。請參閱{link}以了解更多詳情。"
	},
	"initialTutorialTimelineDescription2": "您可以隨時在螢幕上方切換對應的時間軸。",
	"initialTutorialTimelineDescription3": "除此之外還有清單時間軸、頻道時間軸等。請參閱{link}以了解更多詳情。",
	"help": "幫助"
}
</locale>
