<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 700px;">
	<div>
		<div class="_gaps_m">
			<MkInput v-model="name">
				<template #label>{{ $locale.sfc.name }}</template>
			</MkInput>
			<MkSelect v-model="src" :items="antennaSourcesSelectDef">
				<template #label>{{ $locale.sfc.antennaSource }}</template>
			</MkSelect>
			<MkSelect v-if="src === 'list'" v-model="userListId" :items="userListsSelectDef">
				<template #label>{{ $locale.sfc.userList }}</template>
			</MkSelect>
			<MkTextarea v-else-if="src === 'users' || src === 'users_blacklist'" v-model="users">
				<template #label>{{ $locale.sfc.users }}</template>
				<template #caption>{{ $locale.sfc.antennaUsersDescription }} <button class="_textButton" @click="addUser">{{ $locale.sfc.addUser }}</button></template>
			</MkTextarea>
			<MkSwitch v-model="excludeBots">{{ $locale.sfc.antennaExcludeBots }}</MkSwitch>
			<MkSwitch v-model="withReplies">{{ $locale.sfc.withReplies }}</MkSwitch>
			<MkTextarea v-model="keywords">
				<template #label>{{ $locale.sfc.antennaKeywords }}</template>
				<template #caption>{{ $locale.sfc.antennaKeywordsDescription }}</template>
			</MkTextarea>
			<MkTextarea v-model="excludeKeywords">
				<template #label>{{ $locale.sfc.antennaExcludeKeywords }}</template>
				<template #caption>{{ $locale.sfc.antennaKeywordsDescription }}</template>
			</MkTextarea>
			<MkSwitch v-model="localOnly">{{ $locale.sfc.localOnly }}</MkSwitch>
			<MkSwitch v-model="caseSensitive">{{ $locale.sfc.caseSensitive }}</MkSwitch>
			<MkSwitch v-model="withFile">{{ $locale.sfc.withFileAntenna }}</MkSwitch>
			<MkSwitch v-model="excludeNotesInSensitiveChannel">{{ $locale.sfc.excludeNotesInSensitiveChannel }}</MkSwitch>
		</div>
		<div :class="$style.actions">
			<div class="_buttons">
				<MkButton inline primary @click="saveAntenna()"><i class="ti ti-device-floppy"></i> {{ $locale.sfc.save }}</MkButton>
				<MkButton v-if="initialAntenna.id != null" inline danger @click="deleteAntenna()"><i class="ti ti-trash"></i> {{ $locale.sfc.delete }}</MkButton>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { watch, ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import type { DeepPartial } from '@features/runtime/frontend/utility/merge.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { deepMerge } from '@features/runtime/frontend/utility/merge.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';

type PartialAllowedAntenna = Omit<Misskey.entities.Antenna, 'id' | 'createdAt' | 'updatedAt'> & {
	id?: string;
	createdAt?: string;
	updatedAt?: string;
};

const props = defineProps<{
	antenna?: DeepPartial<PartialAllowedAntenna>;
}>();

const initialAntenna = deepMerge<PartialAllowedAntenna>(props.antenna ?? {}, {
	name: '',
	src: 'all',
	userListId: null,
	users: [],
	keywords: [],
	excludeKeywords: [],
	excludeBots: false,
	withReplies: false,
	caseSensitive: false,
	localOnly: false,
	withFile: false,
	excludeNotesInSensitiveChannel: false,
	isActive: true,
	hasUnreadNote: false,
	notify: false,
});

const emit = defineEmits<{
	(ev: 'created', newAntenna: Misskey.entities.Antenna): void,
	(ev: 'updated', editedAntenna: Misskey.entities.Antenna): void,
	(ev: 'deleted'): void,
}>();

const {
	model: src,
	def: antennaSourcesSelectDef,
} = useMkSelect({
	items: [
		{ value: 'all', label: $locale.value.sfc.antennaSourcesAll },
		//{ value: 'home', label: $locale.value.sfc.antennaSourcesHomeTimeline },
		{ value: 'users', label: $locale.value.sfc.antennaSourcesUsers },
		//{ value: 'list', label: $locale.value.sfc.antennaSourcesUserList },
		{ value: 'users_blacklist', label: $locale.value.sfc.antennaSourcesUserBlacklist },
	],
	initialValue: initialAntenna.src,
});

const {
	model: userListId,
	def: userListsSelectDef,
} = useMkSelect({
	items: computed(() => {
		if (userLists.value == null) return [];
		return userLists.value.map(list => ({
			value: list.id,
			label: list.name,
		}));
	}),
	initialValue: initialAntenna.userListId,
});

const name = ref<string>(initialAntenna.name);
const users = ref<string>(initialAntenna.users.join('\n'));
const keywords = ref<string>(initialAntenna.keywords.map(x => x.join(' ')).join('\n'));
const excludeKeywords = ref<string>(initialAntenna.excludeKeywords.map(x => x.join(' ')).join('\n'));
const caseSensitive = ref<boolean>(initialAntenna.caseSensitive);
const localOnly = ref<boolean>(initialAntenna.localOnly);
const excludeBots = ref<boolean>(initialAntenna.excludeBots);
const withReplies = ref<boolean>(initialAntenna.withReplies);
const withFile = ref<boolean>(initialAntenna.withFile);
const excludeNotesInSensitiveChannel = ref<boolean>(initialAntenna.excludeNotesInSensitiveChannel);
const userLists = ref<Misskey.entities.UserList[] | null>(null);

watch(() => src.value, async () => {
	if (src.value === 'list' && userLists.value === null) {
		userLists.value = await misskeyApi('users/lists/list');
	}
});

async function saveAntenna() {
	const antennaData = {
		name: name.value,
		src: src.value,
		userListId: userListId.value,
		excludeBots: excludeBots.value,
		withReplies: withReplies.value,
		withFile: withFile.value,
		excludeNotesInSensitiveChannel: excludeNotesInSensitiveChannel.value,
		caseSensitive: caseSensitive.value,
		localOnly: localOnly.value,
		users: users.value.trim().split('\n').map(x => x.trim()),
		keywords: keywords.value.trim().split('\n').map(x => x.trim().split(' ')),
		excludeKeywords: excludeKeywords.value.trim().split('\n').map(x => x.trim().split(' ')),
	};

	if (initialAntenna.id == null) {
		const res = await os.apiWithDialog('antennas/create', antennaData);
		emit('created', res);
	} else {
		const res = await os.apiWithDialog('antennas/update', { ...antennaData, antennaId: initialAntenna.id });
		emit('updated', res);
	}
}

async function deleteAntenna() {
	if (initialAntenna.id == null) return;

	const { canceled } = await os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters($locale.value.sfc.removeAreYouSure, { x: initialAntenna.name }),
	});
	if (canceled) return;

	await misskeyApi('antennas/delete', {
		antennaId: initialAntenna.id,
	});

	os.success();
	emit('deleted');
}

function addUser() {
	os.selectUser({ includeSelf: true }).then(user => {
		users.value = users.value.trim();
		users.value += '\n@' + Misskey.acct.toString(user);
		users.value = users.value.trim();
	});
}
</script>

<style lang="scss" module>
.actions {
	margin-top: 16px;
	padding: 24px 0;
	border-top: solid 0.5px var(--MI_THEME-divider);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"name": "الإسم",
	"antennaSource": "مصدر الهوائي",
	"userList": "القوائم",
	"users": "المستخدمون",
	"antennaUsersDescription": "اكتب اسم مستخدم لكل سطر",
	"addUser": "اضافة مستخدم",
	"antennaExcludeBots": "Exclude bot accounts",
	"withReplies": "بالردود",
	"antennaKeywords": "الكلمات المفتاحية للإستقبال",
	"antennaKeywordsDescription": "افصل بينهم بمسافة لاستخدام معامل \"و\" أو بسطر لاستخدام معامل \"أو\"",
	"antennaExcludeKeywords": "الكلمات المفتاحية المستثناة",
	"localOnly": "المحلي فقط",
	"caseSensitive": "حساسية حالة الأحرف",
	"withFileAntenna": "ملاحظات تحوي ملفات فقط",
	"excludeNotesInSensitiveChannel": "Exclude notes from sensitive channels",
	"save": "حفظ",
	"delete": "حذف",
	"antennaSourcesAll": "كل الملاحظات",
	"antennaSourcesHomeTimeline": "ملاحظات المستخدمين المتابَعين",
	"antennaSourcesUsers": "ملاحظات مستخدمين محددين",
	"antennaSourcesUserList": "Notes from a specified list of users",
	"antennaSourcesUserBlacklist": "All notes except for those of one or more specified users",
	"removeAreYouSure": "متأكد من أنك تريد حذف {x}؟"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"name": "Nom",
	"antennaSource": "Font de l'antena",
	"userList": "Llistes",
	"users": "Usuaris",
	"antennaUsersDescription": "Llistar un nom d'usuari per línia",
	"addUser": "Afegir un usuari",
	"antennaExcludeBots": "Exclou els bots",
	"withReplies": "Inclou respostes",
	"antennaKeywords": "Paraules clau a seguir",
	"antennaKeywordsDescription": "Separar amb espais per la condició AND o amb salts de línia per la condició OR.",
	"antennaExcludeKeywords": "Paraules clau a excloure",
	"localOnly": "Només local",
	"caseSensitive": "Sensible a majúscules i minúscules ",
	"withFileAntenna": "Només les publicacions amb fitxers",
	"excludeNotesInSensitiveChannel": "Excloure notes a canals sensibles",
	"save": "Desa",
	"delete": "Elimina",
	"antennaSourcesAll": "Totes les publicacions",
	"antennaSourcesHomeTimeline": "Publicacions dels usuaris seguits",
	"antennaSourcesUsers": "Publicacions d'usuaris específics",
	"antennaSourcesUserList": "Publicacions d'una llista d'usuaris",
	"antennaSourcesUserBlacklist": "Totes les notes excepte les d'un o alguns usuaris especificats",
	"removeAreYouSure": "Segur que vols esborrar «{x}»?"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"name": "Jméno",
	"antennaSource": "Zdroj Antény",
	"userList": "Seznamy",
	"users": "Uživatelé",
	"antennaUsersDescription": "Vypsat jednoho uživatele na řádek",
	"addUser": "Přidat uživatele",
	"antennaExcludeBots": "Exclude bot accounts",
	"withReplies": "Zahrnout odpovědi",
	"antennaKeywords": "Klíčová slova na poslech",
	"antennaKeywordsDescription": "Oddělte mezerami pro AND kondice nebo řádkami pro OR kondice.",
	"antennaExcludeKeywords": "Vyloučená klíčová slova",
	"localOnly": "Jenom lokální",
	"caseSensitive": "Rozlišuje malá a velká písmena",
	"withFileAntenna": "Poznámky jenom se souborama",
	"excludeNotesInSensitiveChannel": "Exclude notes from sensitive channels",
	"save": "Uložit",
	"delete": "Smazat",
	"antennaSourcesAll": "Všechny poznámky",
	"antennaSourcesHomeTimeline": "Poznámky sledovaných uživatelů",
	"antennaSourcesUsers": "Poznámky konkrétních uživatelů",
	"antennaSourcesUserList": "Poznámky z určitého seznamu uživatelů",
	"antennaSourcesUserBlacklist": "All notes except for those of one or more specified users",
	"removeAreYouSure": "Jste si jistí že chcete smazat \"{x}\"?"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"name": "Name",
	"antennaSource": "Antenna source",
	"userList": "Lists",
	"users": "Users",
	"antennaUsersDescription": "List one username per line",
	"addUser": "Add a user",
	"antennaExcludeBots": "Exclude bot accounts",
	"withReplies": "Include replies",
	"antennaKeywords": "Keywords to listen to",
	"antennaKeywordsDescription": "Separate with spaces for an AND condition or with line breaks for an OR condition.",
	"antennaExcludeKeywords": "Keywords to exclude",
	"localOnly": "Local only",
	"caseSensitive": "Case sensitive",
	"withFileAntenna": "Only notes with files",
	"excludeNotesInSensitiveChannel": "Exclude notes from sensitive channels",
	"save": "Save",
	"delete": "Delete",
	"antennaSourcesAll": "All notes",
	"antennaSourcesHomeTimeline": "Notes from followed users",
	"antennaSourcesUsers": "Notes from specific users",
	"antennaSourcesUserList": "Notes from a specified list of users",
	"antennaSourcesUserBlacklist": "All notes except for those of one or more specified users",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"name": "Name",
	"antennaSource": "Antennenquelle",
	"userList": "Liste",
	"users": "Benutzer",
	"antennaUsersDescription": "Benutzernamen getrennt durch Zeilenumbrüche angeben",
	"addUser": "Benutzer hinzufügen",
	"antennaExcludeBots": "Bot-Accounts ausschließen",
	"withReplies": "Antworten beinhalten",
	"antennaKeywords": "Zu beobachtende Schlüsselwörter",
	"antennaKeywordsDescription": "Zum Nutzen einer \"UND\"-Verknüpfung Einträge mit Leerzeichen trennen, zum Nutzen einer \"ODER\"-Verknüpfung Einträge mit einem Zeilenumbruch trennen",
	"antennaExcludeKeywords": "Zu ignorierende Schlüsselwörter",
	"localOnly": "Nur Lokal",
	"caseSensitive": "Groß-/Kleinschreibung unterscheiden",
	"withFileAntenna": "Nur Notizen mit Dateien",
	"excludeNotesInSensitiveChannel": "Schließe Notizen von sensitive Kanäle aus",
	"save": "Speichern",
	"delete": "Löschen",
	"antennaSourcesAll": "Alle Notizen",
	"antennaSourcesHomeTimeline": "Notizen von Benutzern, denen gefolgt wird",
	"antennaSourcesUsers": "Notizen von einem oder mehreren angegebenen Benutzern",
	"antennaSourcesUserList": "Notizen von allen Benutzern einer Liste",
	"antennaSourcesUserBlacklist": "Alle Notizen abgesehen derer angegebener Benutzer",
	"removeAreYouSure": "Möchtest du „{x}“ wirklich entfernen?"
}
</locale>

<locale lang="json" locale="en-US">
{
	"name": "Name",
	"antennaSource": "Antenna source",
	"userList": "Lists",
	"users": "Users",
	"antennaUsersDescription": "List one username per line",
	"addUser": "Add a user",
	"antennaExcludeBots": "Exclude bot accounts",
	"withReplies": "Include replies",
	"antennaKeywords": "Keywords to listen to",
	"antennaKeywordsDescription": "Separate with spaces for an AND condition or with line breaks for an OR condition.",
	"antennaExcludeKeywords": "Keywords to exclude",
	"localOnly": "Local only",
	"caseSensitive": "Case sensitive",
	"withFileAntenna": "Only notes with files",
	"excludeNotesInSensitiveChannel": "Exclude notes from sensitive channels",
	"save": "Save",
	"delete": "Delete",
	"antennaSourcesAll": "All notes",
	"antennaSourcesHomeTimeline": "Notes from followed users",
	"antennaSourcesUsers": "Notes from specific users",
	"antennaSourcesUserList": "Notes from a specified list of users",
	"antennaSourcesUserBlacklist": "All notes except for those of one or more specified users",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"name": "Nombre",
	"antennaSource": "Origen de la antena",
	"userList": "Lista",
	"users": "Usuarios",
	"antennaUsersDescription": "Elegir nombres de usuarios separados por una linea nueva",
	"addUser": "Agregar usuario",
	"antennaExcludeBots": "Excluir bots",
	"withReplies": "Incluir respuestas",
	"antennaKeywords": "Palabras clave para recibir",
	"antennaKeywordsDescription": "Separar con espacios es una declaración AND, separar con una linea nueva es una declaración OR",
	"antennaExcludeKeywords": "Palabras clave para excluir",
	"localOnly": "Solo local",
	"caseSensitive": "Distinguir mayúsculas de minúsculas",
	"withFileAntenna": "Sólo notas con archivos adjuntados",
	"excludeNotesInSensitiveChannel": "Excluir notas en canales sensibles",
	"save": "Guardar",
	"delete": "Borrar",
	"antennaSourcesAll": "Todas las notas",
	"antennaSourcesHomeTimeline": "Notas de los usuarios que sigues",
	"antennaSourcesUsers": "Notas de un usuario o varios",
	"antennaSourcesUserList": "Notas de los usuarios de una lista",
	"antennaSourcesUserBlacklist": "Todas las notas excepto aquellas de uno o más usuarios especificados",
	"removeAreYouSure": "¿Desea borrar \"{x}\"?"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"name": "Nom",
	"antennaSource": "Source de l’antenne",
	"userList": "Listes",
	"users": "Utilisateur·rice·s",
	"antennaUsersDescription": "Saisissez un seul nom d’utilisateur·rice par ligne",
	"addUser": "Ajouter un·e utilisateur·rice",
	"antennaExcludeBots": "Exclure les comptes robot",
	"withReplies": "Inclure les réponses",
	"antennaKeywords": "Mots clés à recevoir",
	"antennaKeywordsDescription": "Séparer avec des espaces pour la condition AND. Séparer avec un saut de ligne pour une condition OR.",
	"antennaExcludeKeywords": "Mots clés à exclure",
	"localOnly": "Local seulement",
	"caseSensitive": "Sensible à la casse",
	"withFileAntenna": "Notes ayant des fichiers joints uniquement",
	"excludeNotesInSensitiveChannel": "Exclude notes from sensitive channels",
	"save": "Enregistrer",
	"delete": "Supprimer",
	"antennaSourcesAll": "Toutes les notes",
	"antennaSourcesHomeTimeline": "Notes venant des utilisateur·rice·s auxquel·les je suis abonné",
	"antennaSourcesUsers": "Notes venant de la part d’utilisateur·rice·s précis",
	"antennaSourcesUserList": "Notes venant d’une liste spécifique",
	"antennaSourcesUserBlacklist": "All notes except for those of one or more specified users",
	"removeAreYouSure": "Êtes-vous sûr·e de vouloir supprimer « {x} »\u202f?"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"name": "Nama",
	"antennaSource": "Sumber Antenna",
	"userList": "Daftar",
	"users": "Pengguna",
	"antennaUsersDescription": "Tuliskan satu nama pengguna per baris",
	"addUser": "Tambah pengguna",
	"antennaExcludeBots": "Kecualikan akun bot",
	"withReplies": "Termasuk balasan",
	"antennaKeywords": "Kata kunci yang diterima",
	"antennaKeywordsDescription": "Pisahkan dengan spasi untuk kondisi AND. Pisahkan dengan baris baru untuk kondisi OR.",
	"antennaExcludeKeywords": "Kata kunci yang dikecualikan",
	"localOnly": "Hanya lokal",
	"caseSensitive": "Peka huruf besar dan huruf kecil",
	"withFileAntenna": "Hanya tampilkan catatan dengan berkas yang dilampirkan",
	"excludeNotesInSensitiveChannel": "Kecualikan note dari kanal sensitif",
	"save": "Simpan",
	"delete": "Hapus",
	"antennaSourcesAll": "Semua catatan",
	"antennaSourcesHomeTimeline": "Catatan dari pengguna yang diikuti",
	"antennaSourcesUsers": "Catatan dari pengguna tertentu",
	"antennaSourcesUserList": "Catatan dari daftar tertentu",
	"antennaSourcesUserBlacklist": "Semua catatan kecuali untuk satu pengguna atau lebih yang telah ditentukan",
	"removeAreYouSure": "Apakah kamu yakin ingin menghapus \"{x}\"?"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"name": "Nome",
	"antennaSource": "Fonte dell'antenna",
	"userList": "Liste",
	"users": "Profili",
	"antennaUsersDescription": "Elenca un nome utente per riga",
	"addUser": "Aggiungi profilo",
	"antennaExcludeBots": "Escludere i Bot",
	"withReplies": "Includere le risposte",
	"antennaKeywords": "Parole chiavi da ricevere",
	"antennaKeywordsDescription": "Sparando con uno spazio indichi la condizione E (and). Separando con un a capo, indichi la condizione O (or).",
	"antennaExcludeKeywords": "Parole chiavi da escludere",
	"localOnly": "Soltanto locale",
	"caseSensitive": "Sensibile alla distinzione tra maiuscole e minuscole",
	"withFileAntenna": "Solo note con file in allegato",
	"excludeNotesInSensitiveChannel": "Escludere le Note dai canali espliciti",
	"save": "Salva",
	"delete": "Elimina",
	"antennaSourcesAll": "Tutte le note",
	"antennaSourcesHomeTimeline": "Note dai tuoi Following",
	"antennaSourcesUsers": "Note dagli utenti selezionati",
	"antennaSourcesUserList": "Note dagli utenti della lista selezionata",
	"antennaSourcesUserBlacklist": "Tutte le Note tranne quelle di uno o più profili specificati",
	"removeAreYouSure": "Vuoi davvero eliminare \"{x}\"?"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"name": "名前",
	"antennaSource": "受信ソース",
	"userList": "リスト",
	"users": "ユーザー",
	"antennaUsersDescription": "ユーザー名を改行で区切って指定します",
	"addUser": "ユーザーを追加",
	"antennaExcludeBots": "Botアカウントを除外",
	"withReplies": "返信を含む",
	"antennaKeywords": "受信キーワード",
	"antennaKeywordsDescription": "スペースで区切るとAND指定になり、改行で区切るとOR指定になります",
	"antennaExcludeKeywords": "除外キーワード",
	"localOnly": "ローカルのみ",
	"caseSensitive": "大文字小文字を区別する",
	"withFileAntenna": "ファイルが添付されたノートのみ",
	"excludeNotesInSensitiveChannel": "センシティブなチャンネルのノートを除外",
	"save": "保存",
	"delete": "削除",
	"antennaSourcesAll": "全てのノート",
	"antennaSourcesHomeTimeline": "フォローしているユーザーのノート",
	"antennaSourcesUsers": "指定した一人または複数のユーザーのノート",
	"antennaSourcesUserList": "指定したリストのユーザーのノート",
	"antennaSourcesUserBlacklist": "指定した一人または複数のユーザーを除いた全てのノート",
	"removeAreYouSure": "「{x}」を削除しますか？"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"name": "名前",
	"antennaSource": "受信ソース(このソースは食われへん)",
	"userList": "リスト",
	"users": "ユーザー",
	"antennaUsersDescription": "ユーザー名を改行で区切ったってな",
	"addUser": "ユーザーを追加や",
	"antennaExcludeBots": "Botアカウントを除外",
	"withReplies": "返信を含む",
	"antennaKeywords": "受信キーワード",
	"antennaKeywordsDescription": "スペースで区切ったらAND指定で、改行で区切ったらOR指定や",
	"antennaExcludeKeywords": "除外キーワード",
	"localOnly": "ローカルだけ",
	"caseSensitive": "大文字と小文字は別もんや",
	"withFileAntenna": "なんか添付されたノートだけ",
	"excludeNotesInSensitiveChannel": "センシティブなチャンネルのノートは入れんとくわ",
	"save": "とっとく",
	"delete": "ほかす",
	"antennaSourcesAll": "みんなのノート",
	"antennaSourcesHomeTimeline": "フォローしとるユーザーのノート",
	"antennaSourcesUsers": "選んだ一人か複数のユーザーのノート",
	"antennaSourcesUserList": "選んだリストのユーザーのノート",
	"antennaSourcesUserBlacklist": "選んだ一人か複数のユーザーを除いた全てのノート",
	"removeAreYouSure": "「{x}」はほかしてええか？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"name": "Name",
	"antennaSource": "Antenna source",
	"userList": "Tibdarin",
	"users": "Users",
	"antennaUsersDescription": "List one username per line",
	"addUser": "Add a user",
	"antennaExcludeBots": "Exclude bot accounts",
	"withReplies": "Include replies",
	"antennaKeywords": "Keywords to listen to",
	"antennaKeywordsDescription": "Separate with spaces for an AND condition or with line breaks for an OR condition.",
	"antennaExcludeKeywords": "Keywords to exclude",
	"localOnly": "Local only",
	"caseSensitive": "Case sensitive",
	"withFileAntenna": "Only notes with files",
	"excludeNotesInSensitiveChannel": "Exclude notes from sensitive channels",
	"save": "Sekles",
	"delete": "Kkes",
	"antennaSourcesAll": "All notes",
	"antennaSourcesHomeTimeline": "Notes from followed users",
	"antennaSourcesUsers": "Notes from specific users",
	"antennaSourcesUserList": "Notes from a specified list of users",
	"antennaSourcesUserBlacklist": "All notes except for those of one or more specified users",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"name": "Name",
	"antennaSource": "Antenna source",
	"userList": "Lists",
	"users": "ಬಳಕೆದಾರ",
	"antennaUsersDescription": "List one username per line",
	"addUser": "ಬಳಕೆದಾರರನ್ನು ಸೇರಿಸಿ",
	"antennaExcludeBots": "Exclude bot accounts",
	"withReplies": "Include replies",
	"antennaKeywords": "Keywords to listen to",
	"antennaKeywordsDescription": "Separate with spaces for an AND condition or with line breaks for an OR condition.",
	"antennaExcludeKeywords": "Keywords to exclude",
	"localOnly": "Local only",
	"caseSensitive": "Case sensitive",
	"withFileAntenna": "Only notes with files",
	"excludeNotesInSensitiveChannel": "Exclude notes from sensitive channels",
	"save": "ಉಳಿಸಿ",
	"delete": "ಅಳಿಸು",
	"antennaSourcesAll": "All notes",
	"antennaSourcesHomeTimeline": "Notes from followed users",
	"antennaSourcesUsers": "Notes from specific users",
	"antennaSourcesUserList": "Notes from a specified list of users",
	"antennaSourcesUserBlacklist": "All notes except for those of one or more specified users",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"name": "이름",
	"antennaSource": "받을 소스",
	"userList": "리스트",
	"users": "유저",
	"antennaUsersDescription": "유저명을 한 줄에 한 명씩 적습니다",
	"addUser": "유저 추가",
	"antennaExcludeBots": "봇 계정 제외",
	"withReplies": "답글 포함",
	"antennaKeywords": "받을 키워드",
	"antennaKeywordsDescription": "공백으로 구분하는 경우 AND, 줄바꿈으로 구분하는 경우 OR로 지정됩니다",
	"antennaExcludeKeywords": "제외할 키워드",
	"localOnly": "로컬에만",
	"caseSensitive": "대소문자를 구분",
	"withFileAntenna": "파일이 첨부된 노트만",
	"excludeNotesInSensitiveChannel": "민감한 채널의 노트 제외",
	"save": "저장",
	"delete": "삭제",
	"antennaSourcesAll": "모든 노트",
	"antennaSourcesHomeTimeline": "팔로우중인 유저의 노트",
	"antennaSourcesUsers": "지정한 유저의 노트",
	"antennaSourcesUserList": "지정한 리스트에 속한 유저의 노트",
	"antennaSourcesUserBlacklist": "지정한 유저를 제외한 모든 노트",
	"removeAreYouSure": "\"{x}\" 을(를) 삭제하시겠습니까?"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"name": "Naam",
	"antennaSource": "Bron antenne",
	"userList": "Lijsten",
	"users": "Gebruikers",
	"antennaUsersDescription": "Lijst één gebruikersnaam per regel",
	"addUser": "Toevoegen gebruiker",
	"antennaExcludeBots": "Bot-accounts uitsluiten",
	"withReplies": "Antwoorden toevoegen",
	"antennaKeywords": "Sleutelwoorden",
	"antennaKeywordsDescription": "Scheid met spaties voor een EN-voorwaarde of met regeleinden voor een OF-voorwaarde.",
	"antennaExcludeKeywords": "Blokkeerwoorden",
	"localOnly": "Local only",
	"caseSensitive": "Hoofdlettergevoelig",
	"withFileAntenna": "Alleen notities met bestanden",
	"excludeNotesInSensitiveChannel": "Sluit notities uit van gevoelige kanalen",
	"save": "Opslaan",
	"delete": "Verwijderen",
	"antennaSourcesAll": "All notes",
	"antennaSourcesHomeTimeline": "Notes from followed users",
	"antennaSourcesUsers": "Notes from specific users",
	"antennaSourcesUserList": "Notes from a specified list of users",
	"antennaSourcesUserBlacklist": "All notes except for those of one or more specified users",
	"removeAreYouSure": "Weet je zeker dat je \"{x}\" wil verwijderen?"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"name": "Navn",
	"antennaSource": "Antennekilde",
	"userList": "Lister",
	"users": "Brukere",
	"antennaUsersDescription": "List one username per line",
	"addUser": "Legg til bruker",
	"antennaExcludeBots": "Exclude bot accounts",
	"withReplies": "Include replies",
	"antennaKeywords": "Keywords to listen to",
	"antennaKeywordsDescription": "Separate with spaces for an AND condition or with line breaks for an OR condition.",
	"antennaExcludeKeywords": "Keywords to exclude",
	"localOnly": "Local only",
	"caseSensitive": "Case sensitive",
	"withFileAntenna": "Bare Notes med filer",
	"excludeNotesInSensitiveChannel": "Exclude notes from sensitive channels",
	"save": "Lagre",
	"delete": "Slett",
	"antennaSourcesAll": "All notes",
	"antennaSourcesHomeTimeline": "Notes from followed users",
	"antennaSourcesUsers": "Notes from specific users",
	"antennaSourcesUserList": "Notes from a specified list of users",
	"antennaSourcesUserBlacklist": "All notes except for those of one or more specified users",
	"removeAreYouSure": "Er du sikker på at du vil fjerne \"{x}\"?"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"name": "Nazwa",
	"antennaSource": "Źródło Anteny",
	"userList": "Listy",
	"users": "Użytkownicy",
	"antennaUsersDescription": "Wypisz po jednej nazwie użytkownika w linii",
	"addUser": "Dodaj użytkownika",
	"antennaExcludeBots": "Exclude bot accounts",
	"withReplies": "Uwzględnij odpowiedzi",
	"antennaKeywords": "Słowa kluczowe do obserwacji",
	"antennaKeywordsDescription": "Oddziel spacjami dla warunku AND, albo wymuś koniec linii dla warunku OR",
	"antennaExcludeKeywords": "Wykluczone słowa kluczowe",
	"localOnly": "Lokalne tylko",
	"caseSensitive": "Wielkość liter ma znaczenie",
	"withFileAntenna": "Filtruj tylko wpisy z załączonym plikiem",
	"excludeNotesInSensitiveChannel": "Exclude notes from sensitive channels",
	"save": "Zapisz",
	"delete": "Usuń",
	"antennaSourcesAll": "Wszystkie wpisy",
	"antennaSourcesHomeTimeline": "Wpisy obserwowanych użytkowników",
	"antennaSourcesUsers": "Wpisy określonych użytkowników",
	"antennaSourcesUserList": "Wpisy z określonej listy użytkowników",
	"antennaSourcesUserBlacklist": "All notes except for those of one or more specified users",
	"removeAreYouSure": "Czy na pewno chcesz usunąć „{x}”?"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"name": "Nome",
	"antennaSource": "Origem de entrada",
	"userList": "Listas",
	"users": "Usuários",
	"antennaUsersDescription": "Especificar nomes de utilizador separados por quebras de linha",
	"addUser": "Adicionar usuário",
	"antennaExcludeBots": "Ignorar contas de bot",
	"withReplies": "Incluindo resposta",
	"antennaKeywords": "Palavras-chave recebidas",
	"antennaKeywordsDescription": "Se você separá-lo com um espaço, será uma especificação AND, e se você separá-lo com uma quebra de linha, será uma especificação OR.",
	"antennaExcludeKeywords": "Palavras-chave negativas",
	"localOnly": "Apenas local",
	"caseSensitive": "Maiúsculas e minúsculas",
	"withFileAntenna": "Apenas notas com arquivos anexados",
	"excludeNotesInSensitiveChannel": "Excluir notas de canais sensíveis",
	"save": "Salvar",
	"delete": "Excluir",
	"antennaSourcesAll": "Todas as notas",
	"antennaSourcesHomeTimeline": "Notas de usuários seguidos",
	"antennaSourcesUsers": "Notas de usuários específicos",
	"antennaSourcesUserList": "Notas de uma lista específica de usuários",
	"antennaSourcesUserBlacklist": "Todas as notas, exceto as de um ou mais usuários específicos",
	"removeAreYouSure": "Deseja excluir \"{x}\"?"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"name": "Название",
	"antennaSource": "Источник антенны",
	"userList": "Списки",
	"users": "Пользователи",
	"antennaUsersDescription": "Пишите каждое название аккаута на отдельной строке",
	"addUser": "Добавить пользователя",
	"antennaExcludeBots": "Исключать ботов",
	"withReplies": "Включая ответы",
	"antennaKeywords": "Ключевые слова",
	"antennaKeywordsDescription": "Пишите слова через пробел в одной строке, чтобы ловить их появление вместе; на отдельных строках располагайте слова, или группы слов, чтобы ловить любые из них.",
	"antennaExcludeKeywords": "Чёрный список слов",
	"localOnly": "Локально",
	"caseSensitive": "С учётом регистра",
	"withFileAntenna": "Только заметки с вложениями",
	"excludeNotesInSensitiveChannel": "Исключить заметки из NSFW каналов",
	"save": "Сохранить",
	"delete": "Удалить",
	"antennaSourcesAll": "Все заметки",
	"antennaSourcesHomeTimeline": "Заметки тех на которых вы подписаны",
	"antennaSourcesUsers": "Заметки выбранных пользователей",
	"antennaSourcesUserList": "Заметки пользователей из выбранных списков",
	"antennaSourcesUserBlacklist": "All notes except for those of one or more specified users",
	"removeAreYouSure": "Хотите удалить «{x}»?"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"name": "Názov",
	"antennaSource": "Zdroj antény",
	"userList": "Zoznamy",
	"users": "Používatelia",
	"antennaUsersDescription": "Zoznam používateľov jeden na riadok",
	"addUser": "Pridať používateľa",
	"antennaExcludeBots": "Exclude bot accounts",
	"withReplies": "Vrátane odpovedí",
	"antennaKeywords": "Počúvané kľúčové slová",
	"antennaKeywordsDescription": "Oddeľte medzerami pre podmienku AND alebo novými riadkami pre podmienku OR.",
	"antennaExcludeKeywords": "Vylúčené kľúčové slová",
	"localOnly": "Iba lokálne",
	"caseSensitive": "Rozlišuje malé a veľké písmená",
	"withFileAntenna": "Len poznámky so súbormi",
	"excludeNotesInSensitiveChannel": "Exclude notes from sensitive channels",
	"save": "Uložiť",
	"delete": "Odstrániť",
	"antennaSourcesAll": "Všetky poznámky",
	"antennaSourcesHomeTimeline": "Poznámky od sledovaného používateľa",
	"antennaSourcesUsers": "Poznámky od konkrétneho používateľa",
	"antennaSourcesUserList": "Poznámky od používateľov v zozname",
	"antennaSourcesUserBlacklist": "All notes except for those of one or more specified users",
	"removeAreYouSure": "Naozaj chcete odstrániť \"{x}\"?"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"name": "ชื่อ",
	"antennaSource": "แหล่งเสาอากาศ",
	"userList": "ลิสต์",
	"users": "ผู้ใช้",
	"antennaUsersDescription": "ระบุหนึ่งชื่อผู้ใช้ต่อบรรทัด",
	"addUser": "เพิ่มผู้ใช้",
	"antennaExcludeBots": "ยกเว้นบัญชีบอต",
	"withReplies": "รวมตอบกลับ",
	"antennaKeywords": "คีย์เวิร์ดที่ควรฟัง",
	"antennaKeywordsDescription": "คั่นด้วยเว้นวรรคสำหรับเงื่อนไข AND, หรือขึ้นบรรทัดใหม่สำหรับเงื่อนไข OR",
	"antennaExcludeKeywords": "คีย์เวิร์ดที่จะยกเว้น",
	"localOnly": "เฉพาะท้องถิ่น",
	"caseSensitive": "อักษรพิมพ์ใหญ่-พิมพ์เล็กความหมายต่างกัน",
	"withFileAntenna": "เฉพาะโน้ตที่มีไฟล์",
	"excludeNotesInSensitiveChannel": "ไม่รวมโน้ตจากช่องเนื้อหาละเอียดอ่อน",
	"save": "บันทึก",
	"delete": "ลบ",
	"antennaSourcesAll": "โน้ตทั้งหมด",
	"antennaSourcesHomeTimeline": "โน้ตจากผู้ใช้ที่ติดตาม",
	"antennaSourcesUsers": "โน้ตจากผู้ใช้ที่เฉพาะเจาะจง",
	"antennaSourcesUserList": "โน้ตจากรายชื่อผู้ใช้ที่ระบุ",
	"antennaSourcesUserBlacklist": "โน้ตทั้งหมดยกเว้นโน้ตของผู้ใช้ที่ต้องระบุเจาะจงตั้งแต่หนึ่งรายขึ้นไป",
	"removeAreYouSure": "ต้องการลบ “{x}” ใช่ไหม?"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"name": "İsim",
	"antennaSource": "Anten kaynağı",
	"userList": "Listeler",
	"users": "Kullanıcılar",
	"antennaUsersDescription": "Satır başına bir kullanıcı adı listele",
	"addUser": "Kullanıcı ekle",
	"antennaExcludeBots": "Bot hesaplarını hariç tut",
	"withReplies": "Yanıtları ekle",
	"antennaKeywords": "Dinlenecek anahtar kelimeler",
	"antennaKeywordsDescription": "VE koşulu için boşluklarla, VEYA koşulu için satır sonlarıyla ayırın.",
	"antennaExcludeKeywords": "Hariç tutulacak anahtar kelimeler",
	"localOnly": "Yalnızca yerel",
	"caseSensitive": "Harfe duyarlı",
	"withFileAntenna": "Sadece dosyalı notlar",
	"excludeNotesInSensitiveChannel": "Hassas kanallardan gelen notları hariç tutun",
	"save": "Kaydet",
	"delete": "Sil",
	"antennaSourcesAll": "Tüm notlar",
	"antennaSourcesHomeTimeline": "Takip edilen kullanıcıların notları",
	"antennaSourcesUsers": "Belirli kullanıcılardan gelen notlar",
	"antennaSourcesUserList": "Belirtilen kullanıcı listesinden notlar",
	"antennaSourcesUserBlacklist": "Bir veya daha fazla belirli kullanıcıya ait olanlar hariç tüm notlar",
	"removeAreYouSure": "“{x}” öğesini kaldırmak istediğinizden emin misin?"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"name": "Name",
	"antennaSource": "Antenna source",
	"userList": "Lists",
	"users": "Users",
	"antennaUsersDescription": "List one username per line",
	"addUser": "Add a user",
	"antennaExcludeBots": "Exclude bot accounts",
	"withReplies": "Include replies",
	"antennaKeywords": "Keywords to listen to",
	"antennaKeywordsDescription": "Separate with spaces for an AND condition or with line breaks for an OR condition.",
	"antennaExcludeKeywords": "Keywords to exclude",
	"localOnly": "Local only",
	"caseSensitive": "Case sensitive",
	"withFileAntenna": "Only notes with files",
	"excludeNotesInSensitiveChannel": "Exclude notes from sensitive channels",
	"save": "Save",
	"delete": "ئۆچۈرۈش",
	"antennaSourcesAll": "All notes",
	"antennaSourcesHomeTimeline": "Notes from followed users",
	"antennaSourcesUsers": "Notes from specific users",
	"antennaSourcesUserList": "Notes from a specified list of users",
	"antennaSourcesUserBlacklist": "All notes except for those of one or more specified users",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"name": "Ім'я",
	"antennaSource": "Джерело антени",
	"userList": "Списки",
	"users": "Користувачі",
	"antennaUsersDescription": "Список імя користувачів в стопчик",
	"addUser": "Додати користувача",
	"antennaExcludeBots": "Виключити облікові записи ботів",
	"withReplies": "Включаючи відповіді",
	"antennaKeywords": "Ключові слова антени",
	"antennaKeywordsDescription": "Розділення ключових слів пробілами для \"І\" або з нової лінійки для \"АБО\"",
	"antennaExcludeKeywords": "Винятки",
	"localOnly": "Локально",
	"caseSensitive": "З урахуванням регістру",
	"withFileAntenna": "Тільки нотатки з вкладеними файлами",
	"excludeNotesInSensitiveChannel": "Виключати нотатки з чутливих каналів",
	"save": "Зберегти",
	"delete": "Видалити",
	"antennaSourcesAll": "Всі нотатки",
	"antennaSourcesHomeTimeline": "Нотатки тих, на кого ви підписані",
	"antennaSourcesUsers": "Notes from specific users",
	"antennaSourcesUserList": "Notes from a specified list of users",
	"antennaSourcesUserBlacklist": "All notes except for those of one or more specified users",
	"removeAreYouSure": "Ви впевнені, що хочете видалити \"{x}\"?"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"name": "Tên",
	"antennaSource": "Nguồn trạm phát sóng",
	"userList": "Danh sách",
	"users": "Người dùng",
	"antennaUsersDescription": "Liệt kê mỗi hàng một tên người dùng",
	"addUser": "Thêm người dùng",
	"antennaExcludeBots": "Loại trừ các tài khoản bot",
	"withReplies": "Bao gồm lượt trả lời",
	"antennaKeywords": "Từ khóa để nghe",
	"antennaKeywordsDescription": "Phân cách bằng dấu cách cho điều kiện AND hoặc bằng xuống dòng cho điều kiện OR.",
	"antennaExcludeKeywords": "Từ khóa để lọc ra",
	"localOnly": "Chỉ trên máy chủ",
	"caseSensitive": "Trường hợp nhạy cảm",
	"withFileAntenna": "Chỉ những tút có media",
	"excludeNotesInSensitiveChannel": "Không hiển thị trong kênh nhạy cảm",
	"save": "Lưu",
	"delete": "Xóa",
	"antennaSourcesAll": "Toàn bộ tút",
	"antennaSourcesHomeTimeline": "Tút từ những người đã theo dõi",
	"antennaSourcesUsers": "Tút từ những người cụ thể",
	"antennaSourcesUserList": "Tút từ danh sách người dùng cụ thể",
	"antennaSourcesUserBlacklist": "All notes except for those of one or more specified users",
	"removeAreYouSure": "Bạn có chắc muốn gỡ \"{x}\"?"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"name": "名称",
	"antennaSource": "接收来源",
	"userList": "列表",
	"users": "用户",
	"antennaUsersDescription": "指定用户名，用换行符进行分隔",
	"addUser": "添加用户",
	"antennaExcludeBots": "排除机器人账户",
	"withReplies": "包含回复",
	"antennaKeywords": "包含关键字",
	"antennaKeywordsDescription": "AND 条件用空格分隔，OR 条件用换行符分隔。",
	"antennaExcludeKeywords": "排除关键字",
	"localOnly": "仅限本地",
	"caseSensitive": "区分大小写",
	"withFileAntenna": "仅包含附件的帖子",
	"excludeNotesInSensitiveChannel": "排除敏感频道的帖子",
	"save": "保存",
	"delete": "删除",
	"antennaSourcesAll": "所有帖子",
	"antennaSourcesHomeTimeline": "已关注用户的帖子",
	"antennaSourcesUsers": "来自指定用户的帖子",
	"antennaSourcesUserList": "来自指定列表中的帖子",
	"antennaSourcesUserBlacklist": "过滤指定用户后的所有帖子",
	"removeAreYouSure": "要删掉「{x}」吗？"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"name": "名稱",
	"antennaSource": "接收來源",
	"userList": "使用者清單",
	"users": "使用者",
	"antennaUsersDescription": "填寫使用者名稱，以換行分隔",
	"addUser": "新增使用者",
	"antennaExcludeBots": "排除機器人帳戶",
	"withReplies": "包含回覆",
	"antennaKeywords": "包含關鍵字",
	"antennaKeywordsDescription": "空格代表「以及」（AND），換行代表「或者」（OR）",
	"antennaExcludeKeywords": "排除關鍵字",
	"localOnly": "僅限本地",
	"caseSensitive": "區分大小寫",
	"withFileAntenna": "僅帶有附件的貼文",
	"excludeNotesInSensitiveChannel": "排除敏感頻道的貼文",
	"save": "儲存",
	"delete": "刪除",
	"antennaSourcesAll": "全部貼文",
	"antennaSourcesHomeTimeline": "來自已追隨使用者的貼文",
	"antennaSourcesUsers": "來自特定使用者的貼文",
	"antennaSourcesUserList": "來自特定清單中的貼文",
	"antennaSourcesUserBlacklist": "除指定使用者外的所有貼文",
	"removeAreYouSure": "確定要刪掉「{x}」嗎？"
}
</locale>
