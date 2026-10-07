<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/account-data" :label="$locale.sfc.accountData" :keywords="['import', 'export', 'data', 'archive']" icon="ti ti-package">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/fluent-emoji/1f4e6.png" color="#ff9100">
			<SearchText>{{ $locale.sfc.accountDataBanner }}</SearchText>
		</MkFeatureBanner>

		<div class="_gaps_s">
			<SearchMarker :keywords="['notes']">
				<MkFolder>
					<template #icon><i class="ti ti-pencil"></i></template>
					<template #label><SearchLabel>{{ $locale.sfc.allNotes }}</SearchLabel></template>
					<MkFolder :defaultOpen="true">
						<template #label>{{ $locale.sfc.export }}</template>
						<template #icon><i class="ti ti-download"></i></template>
						<MkButton primary :class="$style.button" inline @click="exportNotes()"><i class="ti ti-download"></i> {{ $locale.sfc.export }}</MkButton>
					</MkFolder>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['favorite', 'notes']">
				<MkFolder>
					<template #icon><i class="ti ti-star"></i></template>
					<template #label><SearchLabel>{{ $locale.sfc.favoritedNotes }}</SearchLabel></template>
					<MkFolder :defaultOpen="true">
						<template #label>{{ $locale.sfc.export }}</template>
						<template #icon><i class="ti ti-download"></i></template>
						<MkButton primary :class="$style.button" inline @click="exportFavorites()"><i class="ti ti-download"></i> {{ $locale.sfc.export }}</MkButton>
					</MkFolder>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['clip', 'notes']">
				<MkFolder>
					<template #icon><i class="ti ti-star"></i></template>
					<template #label><SearchLabel>{{ $locale.sfc.clips }}</SearchLabel></template>
					<MkFolder :defaultOpen="true">
						<template #label>{{ $locale.sfc.export }}</template>
						<template #icon><i class="ti ti-download"></i></template>
						<MkButton primary :class="$style.button" inline @click="exportClips()"><i class="ti ti-download"></i> {{ $locale.sfc.export }}</MkButton>
					</MkFolder>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['following', 'users']">
				<MkFolder>
					<template #icon><i class="ti ti-users"></i></template>
					<template #label><SearchLabel>{{ $locale.sfc.followingList }}</SearchLabel></template>
					<div class="_gaps_s">
						<MkFolder :defaultOpen="true">
							<template #label>{{ $locale.sfc.export }}</template>
							<template #icon><i class="ti ti-download"></i></template>
							<div class="_gaps_s">
								<MkSwitch v-model="excludeMutingUsers">
									{{ $locale.sfc.excludeMutingUsers }}
								</MkSwitch>
								<MkSwitch v-model="excludeInactiveUsers">
									{{ $locale.sfc.excludeInactiveUsers }}
								</MkSwitch>
								<MkButton primary :class="$style.button" inline @click="exportFollowing()"><i class="ti ti-download"></i> {{ $locale.sfc.export }}</MkButton>
							</div>
						</MkFolder>
						<MkFolder v-if="$i && !$i.movedTo && $i.policies.canImportFollowing" :defaultOpen="true">
							<template #label>{{ $locale.sfc.import }}</template>
							<template #icon><i class="ti ti-upload"></i></template>
							<MkSwitch v-model="withReplies">
								{{ $locale.sfc.withReplies }}
							</MkSwitch>
							<MkButton primary :class="$style.button" inline @click="importFollowing($event)"><i class="ti ti-upload"></i> {{ $locale.sfc.import }}</MkButton>
						</MkFolder>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['user', 'lists']">
				<MkFolder>
					<template #icon><i class="ti ti-users"></i></template>
					<template #label><SearchLabel>{{ $locale.sfc.userLists }}</SearchLabel></template>
					<div class="_gaps_s">
						<MkFolder :defaultOpen="true">
							<template #label>{{ $locale.sfc.export }}</template>
							<template #icon><i class="ti ti-download"></i></template>
							<MkButton primary :class="$style.button" inline @click="exportUserLists()"><i class="ti ti-download"></i> {{ $locale.sfc.export }}</MkButton>
						</MkFolder>
						<MkFolder v-if="$i && !$i.movedTo && $i.policies.canImportUserLists" :defaultOpen="true">
							<template #label>{{ $locale.sfc.import }}</template>
							<template #icon><i class="ti ti-upload"></i></template>
							<MkButton primary :class="$style.button" inline @click="importUserLists($event)"><i class="ti ti-upload"></i> {{ $locale.sfc.import }}</MkButton>
						</MkFolder>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['mute', 'users']">
				<MkFolder>
					<template #icon><i class="ti ti-user-off"></i></template>
					<template #label><SearchLabel>{{ $locale.sfc.muteList }}</SearchLabel></template>
					<div class="_gaps_s">
						<MkFolder :defaultOpen="true">
							<template #label>{{ $locale.sfc.export }}</template>
							<template #icon><i class="ti ti-download"></i></template>
							<MkButton primary :class="$style.button" inline @click="exportMuting()"><i class="ti ti-download"></i> {{ $locale.sfc.export }}</MkButton>
						</MkFolder>
						<MkFolder v-if="$i && !$i.movedTo && $i.policies.canImportMuting" :defaultOpen="true">
							<template #label>{{ $locale.sfc.import }}</template>
							<template #icon><i class="ti ti-upload"></i></template>
							<MkButton primary :class="$style.button" inline @click="importMuting($event)"><i class="ti ti-upload"></i> {{ $locale.sfc.import }}</MkButton>
						</MkFolder>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['block', 'users']">
				<MkFolder>
					<template #icon><i class="ti ti-user-off"></i></template>
					<template #label><SearchLabel>{{ $locale.sfc.blockingList }}</SearchLabel></template>
					<div class="_gaps_s">
						<MkFolder :defaultOpen="true">
							<template #label>{{ $locale.sfc.export }}</template>
							<template #icon><i class="ti ti-download"></i></template>
							<MkButton primary :class="$style.button" inline @click="exportBlocking()"><i class="ti ti-download"></i> {{ $locale.sfc.export }}</MkButton>
						</MkFolder>
						<MkFolder v-if="$i && !$i.movedTo && $i.policies.canImportBlocking" :defaultOpen="true">
							<template #label>{{ $locale.sfc.import }}</template>
							<template #icon><i class="ti ti-upload"></i></template>
							<MkButton primary :class="$style.button" inline @click="importBlocking($event)"><i class="ti ti-upload"></i> {{ $locale.sfc.import }}</MkButton>
						</MkFolder>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker :keywords="['antennas']">
				<MkFolder>
					<template #icon><i class="ti ti-antenna"></i></template>
					<template #label><SearchLabel>{{ $locale.sfc.antennas }}</SearchLabel></template>
					<div class="_gaps_s">
						<MkFolder :defaultOpen="true">
							<template #label>{{ $locale.sfc.export }}</template>
							<template #icon><i class="ti ti-download"></i></template>
							<MkButton primary :class="$style.button" inline @click="exportAntennas()"><i class="ti ti-download"></i> {{ $locale.sfc.export }}</MkButton>
						</MkFolder>
						<MkFolder v-if="$i && !$i.movedTo && $i.policies.canImportAntennas" :defaultOpen="true">
							<template #label>{{ $locale.sfc.import }}</template>
							<template #icon><i class="ti ti-upload"></i></template>
							<MkButton primary :class="$style.button" inline @click="importAntennas($event)"><i class="ti ti-upload"></i> {{ $locale.sfc.import }}</MkButton>
						</MkFolder>
					</div>
				</MkFolder>
			</SearchMarker>
		</div>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { selectFile } from '@features/drive/frontend/utility/drive.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { $i } from '@features/auth/frontend/i.js';
import MkFeatureBanner from '@features/web/frontend/components/MkFeatureBanner.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';

const excludeMutingUsers = ref(false);
const excludeInactiveUsers = ref(false);
const withReplies = ref(prefer.s.defaultFollowWithReplies);

const onExportSuccess = () => {
	os.alert({
		type: 'info',
		text: $locale.value.sfc.exportRequested,
	});
};

const onImportSuccess = () => {
	os.alert({
		type: 'info',
		text: $locale.value.sfc.importRequested,
	});
};

const onError = (ev: Error) => {
	os.alert({
		type: 'error',
		text: ev.message,
	});
};

const exportNotes = () => {
	misskeyApi('i/export-notes', {}).then(onExportSuccess).catch(onError);
};

const exportFavorites = () => {
	misskeyApi('i/export-favorites', {}).then(onExportSuccess).catch(onError);
};

const exportClips = () => {
	misskeyApi('i/export-clips', {}).then(onExportSuccess).catch(onError);
};

const exportFollowing = () => {
	misskeyApi('i/export-following', {
		excludeMuting: excludeMutingUsers.value,
		excludeInactive: excludeInactiveUsers.value,
	})
		.then(onExportSuccess).catch(onError);
};

const exportBlocking = () => {
	misskeyApi('i/export-blocking', {}).then(onExportSuccess).catch(onError);
};

const exportUserLists = () => {
	misskeyApi('i/export-user-lists', {}).then(onExportSuccess).catch(onError);
};

const exportMuting = () => {
	misskeyApi('i/export-mute', {}).then(onExportSuccess).catch(onError);
};

const exportAntennas = () => {
	misskeyApi('i/export-antennas', {}).then(onExportSuccess).catch(onError);
};

const importFollowing = async (ev: PointerEvent) => {
	const file = await selectFile({
		anchorElement: ev.currentTarget ?? ev.target,
		multiple: false,
	});
	misskeyApi('i/import-following', {
		fileId: file.id,
		withReplies: withReplies.value,
	}).then(onImportSuccess).catch(onError);
};

const importUserLists = async (ev: PointerEvent) => {
	const file = await selectFile({
		anchorElement: ev.currentTarget ?? ev.target,
		multiple: false,
	});
	misskeyApi('i/import-user-lists', { fileId: file.id }).then(onImportSuccess).catch(onError);
};

const importMuting = async (ev: PointerEvent) => {
	const file = await selectFile({
		anchorElement: ev.currentTarget ?? ev.target,
		multiple: false,
	});
	misskeyApi('i/import-muting', { fileId: file.id }).then(onImportSuccess).catch(onError);
};

const importBlocking = async (ev: PointerEvent) => {
	const file = await selectFile({
		anchorElement: ev.currentTarget ?? ev.target,
		multiple: false,
	});
	misskeyApi('i/import-blocking', { fileId: file.id }).then(onImportSuccess).catch(onError);
};

const importAntennas = async (ev: PointerEvent) => {
	const file = await selectFile({
		anchorElement: ev.currentTarget ?? ev.target,
		multiple: false,
	});
	misskeyApi('i/import-antennas', { fileId: file.id }).then(onImportSuccess).catch(onError);
};

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.accountData,
	icon: 'ti ti-package',
}));
</script>

<style module>
.button {
	margin-right: 16px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"exportRequested": "قد تستغرق عملية التصدير بعض الوقت. بمجرد الانتهاء سيضاف الملف الناتج إلى قرص التخزين.",
	"importRequested": "يستغرق الاستيراد بعض الوقت",
	"accountData": "Account data",
	"accountDataBanner": "Export and import to manage account data.",
	"allNotes": "كل الملاحظات",
	"export": "تصدير",
	"favoritedNotes": " الملاحظات المفضلة",
	"clips": "مِشبك",
	"followingList": "المتابَعون",
	"excludeMutingUsers": "استثن الحسابات المكتومة",
	"excludeInactiveUsers": "استثن المستخدمين الخاملين",
	"import": "استيراد",
	"withReplies": "Include replies from imported users in the timeline",
	"userLists": "القوائم",
	"muteList": "المستخدمون المكتومون",
	"blockingList": "المستخدمون المحجوبون",
	"antennas": "الهوائيات"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"exportRequested": "Has sol·licitat una exportació de dades. Això pot trigar una estona. S'afegirà a la teva unitat de disc un cop estigui completada.",
	"importRequested": "Has sol·licitat una importació de dades. Això pot trigar una estona.",
	"accountData": "Dades del compte",
	"accountDataBanner": "Exportació/Importació i gestió d'arxius amb dades del compte.",
	"allNotes": "Totes les publicacions",
	"export": "Exporta",
	"favoritedNotes": "Notes preferides",
	"clips": "Retalls",
	"followingList": "Seguint ",
	"excludeMutingUsers": "Exclou usuaris silenciats",
	"excludeInactiveUsers": "Exclou usuaris inactius",
	"import": "Importar",
	"withReplies": "Inclou a la línia de temps les respostes d'usuaris importats",
	"userLists": "Llistes",
	"muteList": "Silencia",
	"blockingList": "Bloqueja",
	"antennas": "Antena"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"exportRequested": "Požádali jste o export. To může chvíli trvat. Přidáme ho na váš Disk až bude dokončen.",
	"importRequested": "Požádali jste o export. To může chvilku trvat.",
	"accountData": "Account data",
	"accountDataBanner": "Export and import to manage account data.",
	"allNotes": "Všechny poznámky",
	"export": "Exportovat",
	"favoritedNotes": "Oblíbené poznámky",
	"clips": "Oříznout",
	"followingList": "Sledovaní",
	"excludeMutingUsers": "Vyloučit ztlumené uživatele",
	"excludeInactiveUsers": "Vyloučit neaktivní uživatele",
	"import": "Importovat",
	"withReplies": "Include replies from imported users in the timeline",
	"userLists": "Seznamy",
	"muteList": "Ztlumit",
	"blockingList": "Zablokovat",
	"antennas": "Antény"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"exportRequested": "You've requested an export. This may take a while. It will be added to your Drive once completed.",
	"importRequested": "You've requested an import. This may take a while.",
	"accountData": "Account data",
	"accountDataBanner": "Export and import to manage account data.",
	"allNotes": "All notes",
	"export": "Export",
	"favoritedNotes": "Favorite notes",
	"clips": "Clip",
	"followingList": "Followed users",
	"excludeMutingUsers": "Exclude muted users",
	"excludeInactiveUsers": "Exclude inactive users",
	"import": "Import",
	"withReplies": "Include replies from imported users in the timeline",
	"userLists": "User lists",
	"muteList": "Muted users",
	"blockingList": "Blocked users",
	"antennas": "Antennas"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"exportRequested": "Du hast einen Export angefragt. Dies kann etwas Zeit in Anspruch nehmen. Sobald der Export abgeschlossen ist, wird er deiner Drive hinzugefügt.",
	"importRequested": "Du hast einen Import angefragt. Dies kann etwas Zeit in Anspruch nehmen.",
	"accountData": "Kontodaten",
	"accountDataBanner": "Export/Import und Verwaltung von Kontodatenarchiven.",
	"allNotes": "Alle Notizen",
	"export": "Export",
	"favoritedNotes": "Als Favorit markierte Notizen",
	"clips": "Clip erstellen",
	"followingList": "Gefolgte Benutzer",
	"excludeMutingUsers": "Stummgeschaltete Benutzer aussortieren",
	"excludeInactiveUsers": "Inaktive Benutzer aussortieren",
	"import": "Import",
	"withReplies": "Antworten von importierten Benutzern in der Chronik beinhalten",
	"userLists": "Listen",
	"muteList": "Stummschaltungen",
	"blockingList": "Blockierungen",
	"antennas": "Antennen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"exportRequested": "You've requested an export. This may take a while. It will be added to your Drive once completed.",
	"importRequested": "You've requested an import. This may take a while.",
	"accountData": "Account data",
	"accountDataBanner": "Export and import to manage account data.",
	"allNotes": "All notes",
	"export": "Export",
	"favoritedNotes": "Favorite notes",
	"clips": "Clip",
	"followingList": "Followed users",
	"excludeMutingUsers": "Exclude muted users",
	"excludeInactiveUsers": "Exclude inactive users",
	"import": "Import",
	"withReplies": "Include replies from imported users in the timeline",
	"userLists": "User lists",
	"muteList": "Muted users",
	"blockingList": "Blocked users",
	"antennas": "Antennas"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"exportRequested": "Has solicitado la exportación. Puede llevar un tiempo. Cuando termine la exportación, se añadirá al drive",
	"importRequested": "Has solicitado la importación. Puede llevar un tiempo.",
	"accountData": "Datos de la cuenta",
	"accountDataBanner": "Exportación e importación para gestionar los datos de la cuenta.",
	"allNotes": "Todas las notas",
	"export": "Exportar",
	"favoritedNotes": "Notas favoritas",
	"clips": "Clip",
	"followingList": "Siguiendo",
	"excludeMutingUsers": "Excluir usuarios silenciados",
	"excludeInactiveUsers": "Excluir usuarios inactivos",
	"import": "Importar",
	"withReplies": "Si el archivo no incluye información sobre si las respuestas deben incluirse en la línea de tiempo, las respuestas realizadas por el importador deben incluirse en la línea de tiempo.",
	"userLists": "Listas",
	"muteList": "Silenciados",
	"blockingList": "Bloqueados",
	"antennas": "Antenas"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"exportRequested": "Vous avez demandé une exportation. L’opération pourrait prendre un peu de temps. Une fois terminée, le fichier sera ajouté au Drive.",
	"importRequested": "Vous avez initié un import. Cela pourrait prendre un peu de temps.",
	"accountData": "Account data",
	"accountDataBanner": "Export and import to manage account data.",
	"allNotes": "Toutes les notes",
	"export": "Exporter",
	"favoritedNotes": "Favorite notes",
	"clips": "Clip",
	"followingList": "Abonnements",
	"excludeMutingUsers": "Exclure les utilisateur·rice·s mis en sourdine",
	"excludeInactiveUsers": "Exclure les utilisateur·rice·s inactifs",
	"import": "Importer",
	"withReplies": "Inclure les réponses des utilisateur·rice·s importé·e·s dans le fil",
	"userLists": "Listes",
	"muteList": "Comptes masqués",
	"blockingList": "Comptes bloqués",
	"antennas": "Antennes"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"exportRequested": "Kamu telah meminta ekspor. Ini akan memakan waktu sesaat. Setelah ekspor selesai, berkas yang dihasilkan akan ditambahkan ke Drive",
	"importRequested": "Kamu telah meminta impor. Ini akan memakan waktu sesaat.",
	"accountData": "Account data",
	"accountDataBanner": "Export and import to manage account data.",
	"allNotes": "Semua catatan",
	"export": "Ekspor",
	"favoritedNotes": "Catatan favorit",
	"clips": "Klip",
	"followingList": "Ikuti",
	"excludeMutingUsers": "Kecualikan pengguna yang dibisukan",
	"excludeInactiveUsers": "Kecualikan pengguna tidak aktif",
	"import": "Impor",
	"withReplies": "Termasuk balasan dari pengguna yang diimpor ke dalam lini masa",
	"userLists": "Daftar",
	"muteList": "Bisukan",
	"blockingList": "Blokir",
	"antennas": "Antena"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"exportRequested": "Hai richiesto un'esportazione, e potrebbe volerci tempo. Quando sarà compiuta, il file verrà aggiunto direttamente al Drive.",
	"importRequested": "Hai richiesto un'importazione. Potrebbe richiedere un po' di tempo.",
	"accountData": "Dati del profilo",
	"accountDataBanner": "Puoi gestire i dati del tuo profilo, esportando e importando.",
	"allNotes": "Tutte le note",
	"export": "Esporta",
	"favoritedNotes": "Note preferite",
	"clips": "Clip",
	"followingList": "Following",
	"excludeMutingUsers": "Escludere gli utenti silenziati",
	"excludeInactiveUsers": "Escludere i profili inutilizzati",
	"import": "Importa",
	"withReplies": "Includere le risposte da profili importati nella Timeline",
	"userLists": "Liste",
	"muteList": "Elenco profili silenziati",
	"blockingList": "Elenco profili bloccati",
	"antennas": "Antenne"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"exportRequested": "エクスポートをリクエストしました。これには時間がかかる場合があります。エクスポートが終わると、「ドライブ」に追加されます。",
	"importRequested": "インポートをリクエストしました。これには時間がかかる場合があります。",
	"accountData": "アカウントのデータ",
	"accountDataBanner": "アカウントデータのアーカイブをエクスポート/インポートして管理できます。",
	"allNotes": "全てのノート",
	"export": "エクスポート",
	"favoritedNotes": "お気に入りにしたノート",
	"clips": "クリップ",
	"followingList": "フォロー",
	"excludeMutingUsers": "ミュートしているユーザーを除外",
	"excludeInactiveUsers": "使われていないアカウントを除外",
	"import": "インポート",
	"withReplies": "返信をTLに含むかの情報がファイルにない場合に、インポートした人による返信をTLに含むようにする",
	"userLists": "リスト",
	"muteList": "ミュート",
	"blockingList": "ブロック",
	"antennas": "アンテナ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"exportRequested": "エクスポートしてな、って言うたけど、これ多分めっちゃ時間かかるで。エクスポート終わったら「ドライブ」に突っ込んどくで。",
	"importRequested": "インポートしてな、ってリクエストしたけど、これ多分めっちゃ時間かかるで。",
	"accountData": "アカウントのデータ",
	"accountDataBanner": "アカウントデータのアーカイブをエクスポート/インポートして管理できるで。",
	"allNotes": "全てのノート",
	"export": "エクスポート",
	"favoritedNotes": "お気に入りにしたノート",
	"clips": "クリップ",
	"followingList": "フォロー",
	"excludeMutingUsers": "ミュートしてるユーザーは入れんとくわ",
	"excludeInactiveUsers": "使われてなさそうなアカウントは入れんとくわ",
	"import": "インポート",
	"withReplies": "インポートした人による返信をTLに含むようにすんで。",
	"userLists": "リスト",
	"muteList": "ミュート",
	"blockingList": "ブロック",
	"antennas": "アンテナ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"exportRequested": "You've requested an export. This may take a while. It will be added to your Drive once completed.",
	"importRequested": "You've requested an import. This may take a while.",
	"accountData": "Account data",
	"accountDataBanner": "Export and import to manage account data.",
	"allNotes": "All notes",
	"export": "Sifeḍ",
	"favoritedNotes": "Favorite notes",
	"clips": "Clip",
	"followingList": "Ig ṭṭafaṛ",
	"excludeMutingUsers": "Exclude muted users",
	"excludeInactiveUsers": "Exclude inactive users",
	"import": "Kter",
	"withReplies": "Include replies from imported users in the timeline",
	"userLists": "Tibdarin",
	"muteList": "Sgugem",
	"blockingList": "Seḥbes",
	"antennas": "Antennas"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"exportRequested": "You've requested an export. This may take a while. It will be added to your Drive once completed.",
	"importRequested": "You've requested an import. This may take a while.",
	"accountData": "Account data",
	"accountDataBanner": "Export and import to manage account data.",
	"allNotes": "All notes",
	"export": "ರಫ್ತು",
	"favoritedNotes": "Favorite notes",
	"clips": "Clip",
	"followingList": "Followed users",
	"excludeMutingUsers": "Exclude muted users",
	"excludeInactiveUsers": "Exclude inactive users",
	"import": "ಆಮದು",
	"withReplies": "Include replies from imported users in the timeline",
	"userLists": "User lists",
	"muteList": "Muted users",
	"blockingList": "Blocked users",
	"antennas": "Antennas"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"exportRequested": "내보내기를 요청하였습니다. 이 작업은 시간이 걸릴 수 있습니다. 내보내기가 완료되면 \"드라이브\"에 추가됩니다.",
	"importRequested": "가져오기를 요청하였습니다. 이 작업에는 시간이 걸릴 수 있습니다.",
	"accountData": "계정 데이터",
	"accountDataBanner": "계정 데이터의 아카이브를 추출하기/가져오기 하여 관리할 수 있습니다.",
	"allNotes": "모든 노트",
	"export": "내보내기",
	"favoritedNotes": "즐겨찾기한 노트",
	"clips": "클립",
	"followingList": "팔로잉",
	"excludeMutingUsers": "뮤트한 유저 제외하기",
	"excludeInactiveUsers": "휴면 중인 계정 제외하기",
	"import": "가져오기",
	"withReplies": "가져오기한 유저에 의한 답글을 타임라인에 포함",
	"userLists": "리스트",
	"muteList": "뮤트",
	"blockingList": "차단",
	"antennas": "안테나"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"exportRequested": "Je hebt een export aangevraagd. Dit kan een tijdje duren. Het wordt toegevoegd aan je Drive zodra het is voltooid.",
	"importRequested": "Je hebt een import aangevraagd. Dit kan even duren.",
	"accountData": "Account data",
	"accountDataBanner": "Export and import to manage account data.",
	"allNotes": "All notes",
	"export": "Export",
	"favoritedNotes": "Favorite notes",
	"clips": "Clip aanmaken",
	"followingList": "Volgend",
	"excludeMutingUsers": "Negeer gedempte gebruikers",
	"excludeInactiveUsers": "Negeer inactieve gebruikers",
	"import": "Import",
	"withReplies": "Include replies from imported users in the timeline",
	"userLists": "Lijsten",
	"muteList": "Dempen",
	"blockingList": "Blokkeren",
	"antennas": "Antennes"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"exportRequested": "You've requested an export. This may take a while. It will be added to your Drive once completed.",
	"importRequested": "Du har bedt om import. Dette kan ta en stund.",
	"accountData": "Account data",
	"accountDataBanner": "Export and import to manage account data.",
	"allNotes": "All notes",
	"export": "Eksporter",
	"favoritedNotes": "Favorite notes",
	"clips": "Clip",
	"followingList": "Følg",
	"excludeMutingUsers": "Exclude muted users",
	"excludeInactiveUsers": "Exclude inactive users",
	"import": "Importer",
	"withReplies": "Include replies from imported users in the timeline",
	"userLists": "Lister",
	"muteList": "Skjul",
	"blockingList": "Blokker",
	"antennas": "Antenner"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"exportRequested": "Zażądałeś eksportu. Może to zająć trochę czasu. Po zakończeniu eksportu zostanie on dodany do Twoich \"dysków\".",
	"importRequested": "Zażądano importu. Może to zająć\u00a0chwilę.",
	"accountData": "Account data",
	"accountDataBanner": "Export and import to manage account data.",
	"allNotes": "Wszystkie wpisy",
	"export": "Eksportuj",
	"favoritedNotes": "Ulubione wpisy",
	"clips": "Klip",
	"followingList": "Obserwowani",
	"excludeMutingUsers": "Wyklucz wyciszonych użytkowników",
	"excludeInactiveUsers": "Wyklucz nieaktywnych użytkowników",
	"import": "Importuj",
	"withReplies": "Include replies from imported users in the timeline",
	"userLists": "Listy",
	"muteList": "Wycisz",
	"blockingList": "Zablokuj",
	"antennas": "Anteny"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"exportRequested": "A sua solicitação de exportação foi enviada. Isso pode levar algum tempo. Assim que a exportação estiver concluída, ela será adicionada ao seu drive.",
	"importRequested": "A sua solicitação de importação foi enviada. Isso pode levar algum tempo.",
	"accountData": "Dados da conta",
	"accountDataBanner": "Exportar e importar dados da conta.",
	"allNotes": "Todas as notas",
	"export": "Exportar",
	"favoritedNotes": "Notas nos favoritos",
	"clips": "Clipe",
	"followingList": "Seguindo",
	"excludeMutingUsers": "Excluir usuários silenciados",
	"excludeInactiveUsers": "Excluir usuários inativos",
	"import": "Importar",
	"withReplies": "Incluir respostas de usuários importados na linha do tempo",
	"userLists": "Listas",
	"muteList": "Silenciar",
	"blockingList": "Bloquear",
	"antennas": "Antenas"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"exportRequested": "Вы запросили экспорт. Это может занять некоторое время. Результат будет добавлен на «Диск».",
	"importRequested": "Вы запросили импорт. Это может занять некоторое время.",
	"accountData": "Данные аккаунта",
	"accountDataBanner": "Экспортируйте и импортируйте данные для управления своими данными.",
	"allNotes": "Все заметки\n",
	"export": "Экспорт",
	"favoritedNotes": "Избранное",
	"clips": "Подборка",
	"followingList": "Подписки",
	"excludeMutingUsers": "За исключением скрытых пользователей",
	"excludeInactiveUsers": "Без неактивных учётных записей",
	"import": "Импорт",
	"withReplies": "Include replies from imported users in the timeline",
	"userLists": "Списки",
	"muteList": "Скрытые",
	"blockingList": "Заблокированные",
	"antennas": "Антенны"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"exportRequested": "Vyžiadali ste export. Môže to chvíľu trvať. Po skončení pribudne na vašom disku.",
	"importRequested": "Požiadali ste o export. Môže to chvíľu trvať.",
	"accountData": "Account data",
	"accountDataBanner": "Export and import to manage account data.",
	"allNotes": "Všetky poznámky",
	"export": "Exportovať",
	"favoritedNotes": "Favorite notes",
	"clips": "Klip",
	"followingList": "Sledujete",
	"excludeMutingUsers": "Vylúčiť stíšených používateľov",
	"excludeInactiveUsers": "Vylúčiť neaktívnych používateľov",
	"import": "Importovať",
	"withReplies": "Include replies from imported users in the timeline",
	"userLists": "Zoznamy",
	"muteList": "Vypnúť zvuk",
	"blockingList": "Zablokovať",
	"antennas": "Antény"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"exportRequested": "คุณได้ร้องขอการส่งออก อาจใช้เวลาสักครู่ และจะถูกเพิ่มในไดรฟ์ของคุณเมื่อเสร็จสิ้นแล้ว",
	"importRequested": "คุณได้ร้องขอการนำเข้า การดำเนินการนี้อาจใช้เวลาสักครู่",
	"accountData": "ข้อมูลบัญชี",
	"accountDataBanner": "สามารถจัดการข้อมูลบัญชีได้โดยส่งออกหรือนำเข้าไฟล์เก็บถาวร",
	"allNotes": "โน้ตทั้งหมด",
	"export": "ส่งออก",
	"favoritedNotes": "โน้ตที่ถูกใจไว้",
	"clips": "คลิป",
	"followingList": "กำลังติดตาม",
	"excludeMutingUsers": "ยกเว้นผู้ใช้ที่ปิดเสียง",
	"excludeInactiveUsers": "ยกเว้นผู้ใช้ที่ไม่ได้ใช้งาน",
	"import": "นำเข้า",
	"withReplies": "รวมการตอบกลับจากผู้ใช้ที่ถูกนำเข้า ลงไทม์ไลน์",
	"userLists": "รายชื่อ",
	"muteList": "ปิดเสียง",
	"blockingList": "บล็อก",
	"antennas": "เสาอากาศ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"exportRequested": "Dışa aktarma işlemi talep ettin. Bu işlem biraz zaman alabilir. İşlem tamamlandığında Drive'ına eklenecek.",
	"importRequested": "İçe aktarma talebinde bulundun. Bu işlem biraz zaman alabilir.",
	"accountData": "Hesap verileri",
	"accountDataBanner": "Hesap verilerini yönetmek için dışa ve içe aktarma.",
	"allNotes": "Tüm notlar",
	"export": "Dışa aktar",
	"favoritedNotes": "Favori notlar",
	"clips": "Klip",
	"followingList": "Takip edilen kullanıcılar",
	"excludeMutingUsers": "Sessize alınan kullanıcıları hariç tut",
	"excludeInactiveUsers": "Etkin olmayan kullanıcıları hariç tut",
	"import": "İçeri aktar",
	"withReplies": "İçe aktarılan kullanıcıların yanıtlarını panoya dahil edin",
	"userLists": "Kullanıcı listeleri",
	"muteList": "Sessize alınan kullanıcılar",
	"blockingList": "Engellenen kullanıcılar",
	"antennas": "Antenler"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"exportRequested": "You've requested an export. This may take a while. It will be added to your Drive once completed.",
	"importRequested": "You've requested an import. This may take a while.",
	"accountData": "Account data",
	"accountDataBanner": "Export and import to manage account data.",
	"allNotes": "All notes",
	"export": "Export",
	"favoritedNotes": "Favorite notes",
	"clips": "Clip",
	"followingList": "Followed users",
	"excludeMutingUsers": "Exclude muted users",
	"excludeInactiveUsers": "Exclude inactive users",
	"import": "Import",
	"withReplies": "Include replies from imported users in the timeline",
	"userLists": "User lists",
	"muteList": "Muted users",
	"blockingList": "Blocked users",
	"antennas": "Antennas"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"exportRequested": "Експортування розпочато. Це може зайняти деякий час. Після завершення експорту отриманий файл буде додано на диск.",
	"importRequested": "Імпортування розпочато. Це може зайняти деякий час.",
	"accountData": "Інформація про обліковий запис",
	"accountDataBanner": "Експортуйте та імпортуйте щоб керувати інформацією облікового запису.",
	"allNotes": "Всі нотатки",
	"export": "Експорт",
	"favoritedNotes": "Favorite notes",
	"clips": "Добірка",
	"followingList": "Підписки",
	"excludeMutingUsers": "Виключити ігнорованих користувачів",
	"excludeInactiveUsers": "Виключити неактивних користувачів",
	"import": "Імпорт",
	"withReplies": "Include replies from imported users in the timeline",
	"userLists": "Списки",
	"muteList": "Ігнорувати",
	"blockingList": "Заблокувати",
	"antennas": "Антени"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"exportRequested": "Đang chuẩn bị xuất tập tin. Quá trình này có thể mất ít phút. Nó sẽ được tự động thêm vào Drive sau khi hoàn thành.",
	"importRequested": "Bạn vừa yêu cầu nhập dữ liệu. Quá trình này có thể mất ít phút.",
	"accountData": "Account data",
	"accountDataBanner": "Export and import to manage account data.",
	"allNotes": "Toàn bộ tút",
	"export": "Xuất dữ liệu",
	"favoritedNotes": "Bài viết đã thích",
	"clips": "Lưu bài viết",
	"followingList": "Đang theo dõi",
	"excludeMutingUsers": "Loại trừ những người dùng bị ẩn",
	"excludeInactiveUsers": "Loại trừ những người dùng không hoạt động",
	"import": "Nhập dữ liệu",
	"withReplies": "Include replies from imported users in the timeline",
	"userLists": "Danh sách",
	"muteList": "Ẩn",
	"blockingList": "Chặn",
	"antennas": "Trạm phát sóng"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"exportRequested": "已请求导出，这可能需要一段时间，导出的文件将保存至网盘中。",
	"importRequested": "导入请求已提交，这可能需要花一点时间。",
	"accountData": "账户数据",
	"accountDataBanner": "可在此导入或导出帐户数据的存档。",
	"allNotes": "所有帖子",
	"export": "导出",
	"favoritedNotes": "收藏的帖子",
	"clips": "便签",
	"followingList": "关注中",
	"excludeMutingUsers": "排除已隐藏用户",
	"excludeInactiveUsers": "排除不活跃用户",
	"import": "导入",
	"withReplies": "在时间线中包含导入用户的回复",
	"userLists": "列表",
	"muteList": "隐藏",
	"blockingList": "屏蔽列表",
	"antennas": "天线"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"exportRequested": "已請求匯出。這可能會花一點時間。匯出的檔案將會被放到雲端硬碟裡。",
	"importRequested": "已請求匯入。這可能會花一點時間。",
	"accountData": "帳戶資料",
	"accountDataBanner": "您可以管理帳戶資料的匯出 / 匯入。",
	"allNotes": "所有貼文",
	"export": "匯出",
	"favoritedNotes": "「我的最愛」貼文",
	"clips": "摘錄",
	"followingList": "追隨中",
	"excludeMutingUsers": "排除被靜音的使用者",
	"excludeInactiveUsers": "排除不活躍帳戶",
	"import": "匯入",
	"withReplies": "將被匯入的追隨中清單的貼文回覆包含在時間軸",
	"userLists": "清單",
	"muteList": "靜音",
	"blockingList": "封鎖",
	"antennas": "天線"
}
</locale>
