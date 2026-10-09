<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow
	ref="windowEl"
	:initialWidth="400"
	:initialHeight="500"
	:canResize="true"
	@close="windowEl?.close()"
	@closed="emit('closed')"
>
	<template v-if="emoji" #header>:{{ emoji.name }}:</template>
	<template v-else #header>New emoji</template>

	<div style="display: flex; flex-direction: column; min-height: 100%;">
		<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px; flex-grow: 1;">
			<div class="_gaps_m">
				<div v-if="imgUrl != null" :class="$style.imgs">
					<div style="background: #000;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img"/>
					</div>
					<div style="background: #222;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img"/>
					</div>
					<div style="background: #ddd;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img"/>
					</div>
					<div style="background: #fff;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img"/>
					</div>
				</div>
				<MkButton rounded style="margin: 0 auto;" @click="changeImage">{{ $locale.sfc.selectFile }}</MkButton>
				<MkInput v-model="name" pattern="[a-z0-9_]" autocapitalize="off">
					<template #label>{{ $locale.sfc.name }}</template>
				</MkInput>
				<MkInput v-model="category" :datalist="customEmojiCategories.filter(x => x != null)">
					<template #label>{{ $locale.sfc.category }}</template>
				</MkInput>
				<MkInput v-model="aliases" autocapitalize="off">
					<template #label>{{ $locale.sfc.tags }}</template>
					<template #caption>
						{{ $locale.sfc.theKeywordWhenSearchingForCustomEmoji }}<br/>
						{{ $locale.sfc.setMultipleBySeparatingWithSpace }}
					</template>
				</MkInput>
				<MkInput v-model="license" :mfmAutocomplete="true">
					<template #label>{{ $locale.sfc.license }}</template>
				</MkInput>
				<MkFolder>
					<template #label>{{ $locale.sfc.rolesThatCanBeUsedThisEmojiAsReaction }}</template>
					<template #suffix>{{ rolesThatCanBeUsedThisEmojiAsReaction.length === 0 ? $locale.sfc.all : rolesThatCanBeUsedThisEmojiAsReaction.length }}</template>

					<div class="_gaps">
						<MkButton rounded @click="addRole"><i class="ti ti-plus"></i> {{ $locale.sfc.add }}</MkButton>

						<div v-for="role in rolesThatCanBeUsedThisEmojiAsReaction" :key="role.id" :class="$style.roleItem">
							<MkRolePreview :class="$style.role" :role="role" :forModeration="true" :detailed="false" style="pointer-events: none;"/>
							<button v-if="role.target === 'manual'" class="_button" :class="$style.roleUnassign" @click="removeRole(role)"><i class="ti ti-x"></i></button>
							<button v-else class="_button" :class="$style.roleUnassign" disabled><i class="ti ti-ban"></i></button>
						</div>

						<MkInfo>{{ $locale.sfc.rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription }}</MkInfo>
						<MkInfo warn>{{ $locale.sfc.rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn }}</MkInfo>
					</div>
				</MkFolder>
				<MkSwitch v-model="isSensitive">{{ $locale.sfc.sensitive }}</MkSwitch>
				<MkSwitch v-model="localOnly">{{ $locale.sfc.localOnly }}</MkSwitch>
				<MkButton v-if="emoji" danger @click="del()"><i class="ti ti-trash"></i> {{ $locale.sfc.delete }}</MkButton>
			</div>
		</div>
		<div :class="$style.footer">
			<MkButton primary rounded style="margin: 0 auto;" @click="done"><i class="ti ti-check"></i> {{ props.emoji ? $locale.sfc.update : $locale.sfc.create }}</MkButton>
		</div>
	</div>
</MkWindow>
</template>

<script lang="ts" setup>
import { computed, watch, ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkWindow from '@features/ui/frontend/components/MkWindow.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { customEmojiCategories } from '@features/emojis/frontend/custom-emojis.js';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import { selectFile } from '@features/drive/frontend/utility/drive.js';
import MkRolePreview from '@features/roles/frontend/components/MkRolePreview.vue';

const props = defineProps<{
	emoji?: Misskey.entities.EmojiDetailed,
}>();

const emit = defineEmits<{
	(ev: 'done', v: { deleted?: boolean; updated?: Misskey.entities.EmojiDetailed; created?: Misskey.entities.EmojiDetailed }): void,
	(ev: 'closed'): void
}>();

const windowEl = useTemplateRef('windowEl');
const name = ref<string>(props.emoji ? props.emoji.name : '');
const category = ref<string>(props.emoji?.category ? props.emoji.category : '');
const aliases = ref<string>(props.emoji ? props.emoji.aliases.join(' ') : '');
const license = ref<string>(props.emoji?.license ? props.emoji.license : '');
const isSensitive = ref(props.emoji ? props.emoji.isSensitive : false);
const localOnly = ref(props.emoji ? props.emoji.localOnly : false);
const roleIdsThatCanBeUsedThisEmojiAsReaction = ref(props.emoji ? props.emoji.roleIdsThatCanBeUsedThisEmojiAsReaction : []);
const rolesThatCanBeUsedThisEmojiAsReaction = ref<Misskey.entities.Role[]>([]);
const file = ref<Misskey.entities.DriveFile>();

watch(roleIdsThatCanBeUsedThisEmojiAsReaction, async () => {
	rolesThatCanBeUsedThisEmojiAsReaction.value = (await Promise.all(roleIdsThatCanBeUsedThisEmojiAsReaction.value.map((id) => misskeyApi('admin/roles/show', { roleId: id }).catch(() => null)))).filter(x => x != null);
}, { immediate: true });

const imgUrl = computed(() => file.value ? file.value.url : props.emoji ? props.emoji.url : null);

async function changeImage(ev: PointerEvent) {
	file.value = await selectFile({
		anchorElement: ev.currentTarget ?? ev.target,
		multiple: false,
	});
	const candidate = file.value.name.replace(/\.(.+)$/, '');
	if (candidate.match(/^[a-z0-9_]+$/)) {
		name.value = candidate;
	}
}

async function addRole() {
	const roles = await misskeyApi('admin/roles/list');
	const currentRoleIds = rolesThatCanBeUsedThisEmojiAsReaction.value.map(x => x.id);

	const { canceled, result: roleId } = await os.select({
		items: roles.filter(r => r.isPublic).filter(r => !currentRoleIds.includes(r.id)).map(r => ({ label: r.name, value: r.id })),
	});
	if (canceled || roleId == null) return;

	rolesThatCanBeUsedThisEmojiAsReaction.value.push(roles.find(r => r.id === roleId)!);
}

async function removeRole(role: Misskey.entities.RoleLite) {
	rolesThatCanBeUsedThisEmojiAsReaction.value = rolesThatCanBeUsedThisEmojiAsReaction.value.filter(x => x.id !== role.id);
}

async function done() {
	const params = {
		name: name.value,
		category: category.value === '' ? null : category.value,
		aliases: aliases.value.split(' ').filter(x => x !== ''),
		license: license.value === '' ? null : license.value,
		isSensitive: isSensitive.value,
		localOnly: localOnly.value,
		roleIdsThatCanBeUsedThisEmojiAsReaction: rolesThatCanBeUsedThisEmojiAsReaction.value.map(x => x.id),
		fileId: file.value ? file.value.id : undefined,
	} satisfies Misskey.entities.AdminEmojiUpdateRequest;

	if (props.emoji) {
		const emojiDetailed = {
			id: props.emoji.id,
			aliases: params.aliases,
			name: params.name,
			category: params.category,
			host: props.emoji.host,
			url: file.value ? file.value.url : props.emoji.url,
			license: params.license,
			isSensitive: params.isSensitive,
			localOnly: params.localOnly,
			roleIdsThatCanBeUsedThisEmojiAsReaction: params.roleIdsThatCanBeUsedThisEmojiAsReaction,
		} satisfies Misskey.entities.EmojiDetailed;

		await os.apiWithDialog('admin/emoji/update', {
			id: props.emoji.id,
			...params,
		});

		emit('done', {
			updated: emojiDetailed,
		});

		windowEl.value?.close();
	} else {
		if (params.fileId == null) return;

		const created = await os.apiWithDialog('admin/emoji/add', {
			...params,
			fileId: params.fileId, // TSを黙らすため
		});

		emit('done', {
			created: created,
		});

		windowEl.value?.close();
	}
}

async function del() {
	if (!props.emoji) return;
	const { canceled } = await os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters($locale.value.sfc.removeAreYouSure, { x: name.value }),
	});
	if (canceled) return;

	misskeyApi('admin/emoji/delete', {
		id: props.emoji.id,
	}).then(() => {
		emit('done', {
			deleted: true,
		});
		windowEl.value?.close();
	});
}
</script>

<style lang="scss" module>
.imgs {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: center;
}

.imgContainer {
	padding: 8px;
	border-radius: 6px;
}

.img {
	display: block;
	height: 64px;
	width: 64px;
	object-fit: contain;
}

.roleItem {
	display: flex;
}

.role {
	flex: 1;
}

.roleUnassign {
	width: 32px;
	height: 32px;
	margin-left: 8px;
	align-self: center;
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
</style>

<locale lang="json" locale="ar-SA">
{
	"selectFile": "اختر ملفًا",
	"name": "الإسم",
	"category": "الفئات",
	"tags": "الوسوم",
	"theKeywordWhenSearchingForCustomEmoji": "This is the keyword when searching for custom emojis.",
	"setMultipleBySeparatingWithSpace": "يمكنك ادخال أكثر من مدخل واحد وذلك بفصلها بمسافات.",
	"license": "الرخصة",
	"rolesThatCanBeUsedThisEmojiAsReaction": "الأدوار التي يُسمح لأصحابها استخدام هذا اإيموجي في اللتفاعل",
	"all": "الكل",
	"add": "إضافة",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "إذا لم تحدد دورًا يمكن للجميع استخدام هذا الإيموجي في التفاعل.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "يجب أن تكون الأدوار علنية.",
	"sensitive": "محتوى حساس",
	"localOnly": "المحلي فقط",
	"delete": "حذف",
	"update": "حدِّث",
	"create": "أنشئ",
	"removeAreYouSure": "متأكد من أنك تريد حذف {x}؟"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"selectFile": "Selecciona un fitxer",
	"name": "Nom",
	"category": "Categoria",
	"tags": "Etiquetes",
	"theKeywordWhenSearchingForCustomEmoji": "Cercar un emoji personalitzat ",
	"setMultipleBySeparatingWithSpace": "Separa múltiples entrades amb un espai",
	"license": "Llicència",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Rols que poden fer servir aquest emoji com a reacció ",
	"all": "Tot",
	"add": "Afegir",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Si cap rol es especificat tothom ho pot fer servir",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "Aquests rols han de ser públics ",
	"sensitive": "Sensible",
	"localOnly": "Només local",
	"delete": "Elimina",
	"update": "Actualitzar",
	"create": "Crear",
	"removeAreYouSure": "Segur que vols esborrar «{x}»?"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"selectFile": "Vybrat soubor",
	"name": "Jméno",
	"category": "Kategorie",
	"tags": "Štítky",
	"theKeywordWhenSearchingForCustomEmoji": "This is the keyword when searching for custom emojis.",
	"setMultipleBySeparatingWithSpace": "Oddělení více položek mezerami.",
	"license": "Licence",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Role, které můžou tuhle emoji použít jako reakci",
	"all": "Vše",
	"add": "Přidat",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Pokud nejsou určena role, tak pak každý může použít tenhle emoji.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "Role musí být veřejné.",
	"sensitive": "NSFW",
	"localOnly": "Jenom lokální",
	"delete": "Smazat",
	"update": "Aktualizovat",
	"create": "Vytvořit",
	"removeAreYouSure": "Jste si jistí že chcete smazat \"{x}\"?"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"selectFile": "Select a file",
	"name": "Name",
	"category": "Category",
	"tags": "Aliases",
	"theKeywordWhenSearchingForCustomEmoji": "This is the keyword when searching for custom emojis.",
	"setMultipleBySeparatingWithSpace": "Separate multiple entries with spaces.",
	"license": "License",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"all": "All",
	"add": "Add",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "These roles must be public.",
	"sensitive": "Sensitive",
	"localOnly": "Local only",
	"delete": "Delete",
	"update": "Update",
	"create": "Create",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"selectFile": "Datei auswählen",
	"name": "Name",
	"category": "Kategorie",
	"tags": "Aliasse",
	"theKeywordWhenSearchingForCustomEmoji": "Das ist das Schlagwort beim Suchen von benutzerdefinierten Emojis.",
	"setMultipleBySeparatingWithSpace": "Trenne Elemente durch ein Leerzeichen um mehrere Einstellungen zu kofigurieren.",
	"license": "Lizenz",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Rollen, die dieses Emoji als Reaktion verwenden können",
	"all": "Alle",
	"add": "Hinzufügen",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Sind keine Rollen angegeben, kann jeder dieses Emoji als Reaktion verwenden.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "Diese Rollen müssen öffentlich sein.",
	"sensitive": "Sensibel",
	"localOnly": "Nur Lokal",
	"delete": "Löschen",
	"update": "Aktualisieren",
	"create": "Erstellen",
	"removeAreYouSure": "Möchtest du „{x}“ wirklich entfernen?"
}
</locale>

<locale lang="json" locale="en-US">
{
	"selectFile": "Select a file",
	"name": "Name",
	"category": "Category",
	"tags": "Aliases",
	"theKeywordWhenSearchingForCustomEmoji": "This is the keyword when searching for custom emojis.",
	"setMultipleBySeparatingWithSpace": "Separate multiple entries with spaces.",
	"license": "License",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"all": "All",
	"add": "Add",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "These roles must be public.",
	"sensitive": "Sensitive",
	"localOnly": "Local only",
	"delete": "Delete",
	"update": "Update",
	"create": "Create",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"selectFile": "Elegir archivo",
	"name": "Nombre",
	"category": "Categoría",
	"tags": "Etiqueta",
	"theKeywordWhenSearchingForCustomEmoji": "Palabra clave para buscar el emoji personalizado.",
	"setMultipleBySeparatingWithSpace": "Puedes añadir mas de uno, separado por espacios.",
	"license": "Licencia",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles que pueden usar este emoji como reacción",
	"all": "Todo",
	"add": "Agregar",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Si no se especifican roles, cualquiera podrá usar éste emoji como reacción.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "Éstos roles deben ser públicos.",
	"sensitive": "Marcado como sensible (NSFW)",
	"localOnly": "Solo local",
	"delete": "Borrar",
	"update": "Actualizar",
	"create": "Crear",
	"removeAreYouSure": "¿Desea borrar \"{x}\"?"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"selectFile": "Choisir le fichier",
	"name": "Nom",
	"category": "Catégorie",
	"tags": "Étiquettes",
	"theKeywordWhenSearchingForCustomEmoji": "Ce mot-clé est utilisé lors de la recherche des émojis personnalisés.",
	"setMultipleBySeparatingWithSpace": "Vous pouvez en définir plusieurs, en les séparant par des espaces.",
	"license": "Licence",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Rôles qui peuvent utiliser cet émoji comme réaction",
	"all": "Tous",
	"add": "Ajouter",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Si aucun rôle n'est spécifié, tout le monde peut utiliser cet émoji comme réaction.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "Il faut un rôle public.",
	"sensitive": "Contenu sensible",
	"localOnly": "Local seulement",
	"delete": "Supprimer",
	"update": "Mettre à jour",
	"create": "Créer",
	"removeAreYouSure": "Êtes-vous sûr·e de vouloir supprimer « {x} »\u202f?"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"selectFile": "Pilih berkas",
	"name": "Nama",
	"category": "Kategori",
	"tags": "Tandai",
	"theKeywordWhenSearchingForCustomEmoji": "Kata kunci ini digunakan untuk mencari emoji kustom yang dicari.",
	"setMultipleBySeparatingWithSpace": "Kamu dapat menyetel banyak dengan memisahkannya menggunakan spasi.",
	"license": "Lisensi",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Peran yang dapat menggunakan emoji ini sebagai reaksi",
	"all": "Semua",
	"add": "Tambahkan",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Jika peran tidak ditentukan, semua pengguna dapat menggunakan emoji ini sebagai reaksi.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "Peran ini harus publik.",
	"sensitive": "Konten sensitif",
	"localOnly": "Hanya lokal",
	"delete": "Hapus",
	"update": "Perbarui",
	"create": "Buat",
	"removeAreYouSure": "Apakah kamu yakin ingin menghapus \"{x}\"?"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"selectFile": "Scelta allegato",
	"name": "Nome",
	"category": "Categoria",
	"tags": "Tag",
	"theKeywordWhenSearchingForCustomEmoji": "Questa sarà la parola chiave durante la ricerca di emoji personalizzate",
	"setMultipleBySeparatingWithSpace": "È possibile creare multiple voci separate da spazi.",
	"license": "Licenza",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Ruoli che possono usare questa emoji come reazione",
	"all": "Tutte",
	"add": "Aggiungi",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Se non viene specificato alcun ruolo, chiunque può reagire con questa emoji.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "Questi ruoli devono essere pubblici",
	"sensitive": "Esplicito",
	"localOnly": "Soltanto locale",
	"delete": "Elimina",
	"update": "Aggiorna",
	"create": "Crea",
	"removeAreYouSure": "Vuoi davvero eliminare \"{x}\"?"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"selectFile": "ファイルを選択",
	"name": "名前",
	"category": "カテゴリ",
	"tags": "タグ",
	"theKeywordWhenSearchingForCustomEmoji": "カスタム絵文字を検索する時のキーワードになります。",
	"setMultipleBySeparatingWithSpace": "スペースで区切って複数設定できます。",
	"license": "ライセンス",
	"rolesThatCanBeUsedThisEmojiAsReaction": "リアクションとして使えるロール",
	"all": "全て",
	"add": "追加",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "ロールの指定が一つもない場合、誰でもリアクションとして使えます。",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "ロールは公開ロールである必要があります。",
	"sensitive": "センシティブ",
	"localOnly": "ローカルのみ",
	"delete": "削除",
	"update": "更新",
	"create": "作成",
	"removeAreYouSure": "「{x}」を削除しますか？"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"selectFile": "ファイル選んでや",
	"name": "名前",
	"category": "カテゴリ",
	"tags": "タグ",
	"theKeywordWhenSearchingForCustomEmoji": "カスタム絵文字を探すときのキーワードになるで。",
	"setMultipleBySeparatingWithSpace": "スペースで区切って何個でも設定できるで。",
	"license": "ライセンス",
	"rolesThatCanBeUsedThisEmojiAsReaction": "ツッコミとして使えるロール",
	"all": "みんな",
	"add": "増やす",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "ロールが一個も指定されてへんかったら、誰でもツッコミとして使えるで。",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "ロールは公開ロールじゃないとアカンで。",
	"sensitive": "気いつけて見いや",
	"localOnly": "ローカルだけ",
	"delete": "ほかす",
	"update": "更新",
	"create": "作成",
	"removeAreYouSure": "「{x}」はほかしてええか？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"selectFile": "Select a file",
	"name": "Name",
	"category": "Category",
	"tags": "Aliases",
	"theKeywordWhenSearchingForCustomEmoji": "This is the keyword when searching for custom emojis.",
	"setMultipleBySeparatingWithSpace": "Separate multiple entries with spaces.",
	"license": "License",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"all": "All",
	"add": "Add",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "These roles must be public.",
	"sensitive": "Sensitive",
	"localOnly": "Local only",
	"delete": "Kkes",
	"update": "Update",
	"create": "Create",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"selectFile": "Select a file",
	"name": "Name",
	"category": "Category",
	"tags": "Aliases",
	"theKeywordWhenSearchingForCustomEmoji": "This is the keyword when searching for custom emojis.",
	"setMultipleBySeparatingWithSpace": "Separate multiple entries with spaces.",
	"license": "License",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"all": "All",
	"add": "Add",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "These roles must be public.",
	"sensitive": "Sensitive",
	"localOnly": "Local only",
	"delete": "ಅಳಿಸು",
	"update": "Update",
	"create": "Create",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"selectFile": "파일 선택",
	"name": "이름",
	"category": "카테고리",
	"tags": "태그",
	"theKeywordWhenSearchingForCustomEmoji": "맞춤 이모티콘을 검색할 때 키워드가 됩니다.",
	"setMultipleBySeparatingWithSpace": "공백으로 구분하여 여러 개 설정할 수 있습니다.",
	"license": "라이선스",
	"rolesThatCanBeUsedThisEmojiAsReaction": "이 이모지를 리액션으로 사용할 수 있는 역할",
	"all": "전체",
	"add": "추가",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "역할을 지정하지 않으면, 누구나 이 이모지를 리액션으로 사용할 수 있습니다.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "역할은 공개로 설정되어 있어야 합니다.",
	"sensitive": "열람 주의",
	"localOnly": "로컬에만",
	"delete": "삭제",
	"update": "업데이트",
	"create": "생성",
	"removeAreYouSure": "\"{x}\" 을(를) 삭제하시겠습니까?"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"selectFile": "Kies een bestand",
	"name": "Naam",
	"category": "Categorie",
	"tags": "Aliassen",
	"theKeywordWhenSearchingForCustomEmoji": "Dit is het keyword dat gebruikt wordt bij het zoeken naar eigen emojis.",
	"setMultipleBySeparatingWithSpace": "Scheid elementen met een spatie om meerdere instellingen te configureren.",
	"license": "License",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"all": "Alle",
	"add": "Toevoegen",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "These roles must be public.",
	"sensitive": "NSFW",
	"localOnly": "Local only",
	"delete": "Verwijderen",
	"update": "Update",
	"create": "Creëer",
	"removeAreYouSure": "Weet je zeker dat je \"{x}\" wil verwijderen?"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"selectFile": "Velg en fil",
	"name": "Navn",
	"category": "Kategori",
	"tags": "Aliases",
	"theKeywordWhenSearchingForCustomEmoji": "This is the keyword when searching for custom emojis.",
	"setMultipleBySeparatingWithSpace": "Separate multiple entries with spaces.",
	"license": "License",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"all": "Alle",
	"add": "Legg til",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "These roles must be public.",
	"sensitive": "Sensitive",
	"localOnly": "Local only",
	"delete": "Slett",
	"update": "Update",
	"create": "Opprett",
	"removeAreYouSure": "Er du sikker på at du vil fjerne \"{x}\"?"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"selectFile": "Wybierz plik",
	"name": "Nazwa",
	"category": "Kategoria",
	"tags": "Tagi",
	"theKeywordWhenSearchingForCustomEmoji": "To jest słowo kluczowe używane podczas wyszukiwania customowych Emoji.",
	"setMultipleBySeparatingWithSpace": "Możesz ustawić wiele, oddzielając je spacjami.",
	"license": "License",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"all": "Wszystkie",
	"add": "Dodaj",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "These roles must be public.",
	"sensitive": "NSFW",
	"localOnly": "Lokalne tylko",
	"delete": "Usuń",
	"update": "Update",
	"create": "Utwórz",
	"removeAreYouSure": "Czy na pewno chcesz usunąć „{x}”?"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"selectFile": "Selecione os arquivos",
	"name": "Nome",
	"category": "Categoria",
	"tags": "Etiquetas",
	"theKeywordWhenSearchingForCustomEmoji": "Essa é a palavra-chave ao pesquisar por emojis personalizados",
	"setMultipleBySeparatingWithSpace": "Você pode configurar vários itens separando-os por espaço.",
	"license": "Licença",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Cargos que podem utilizar este emoji como reação",
	"all": "Todos",
	"add": "Adicionar",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Se nenhum cargo for especificado, qualquer pessoa pode usar este emoji como reação.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "Estes cargos devem ser públicos.",
	"sensitive": "Conteúdo sensível",
	"localOnly": "Apenas local",
	"delete": "Excluir",
	"update": "Atualizar",
	"create": "Criar",
	"removeAreYouSure": "Deseja excluir \"{x}\"?"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"selectFile": "Выберите файл",
	"name": "Название",
	"category": "Категория",
	"tags": "Метки",
	"theKeywordWhenSearchingForCustomEmoji": "Это ключевое слово будет использовано при поиске эмодзи.",
	"setMultipleBySeparatingWithSpace": "Можно написать несколько через пробел",
	"license": "Лицензия",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Роли тех, кому можно использовать эти эмодзи как реакцию",
	"all": "Все",
	"add": "Добавить",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Если здесь ничего не указать, в качестве реакции эту эмодзи сможет использовать каждый.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "Эти роли должны быть общедоступными.",
	"sensitive": "Содержимое не для всех",
	"localOnly": "Локально",
	"delete": "Удалить",
	"update": "Обновить",
	"create": "Создать",
	"removeAreYouSure": "Хотите удалить «{x}»?"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"selectFile": "Vyberte súbor",
	"name": "Názov",
	"category": "Kategórie",
	"tags": "Značky",
	"theKeywordWhenSearchingForCustomEmoji": "This is the keyword when searching for custom emojis.",
	"setMultipleBySeparatingWithSpace": "Viaceré položky oddeľte medzerami.",
	"license": "License",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"all": "Všetko",
	"add": "Pridať",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "These roles must be public.",
	"sensitive": "NSFW",
	"localOnly": "Iba lokálne",
	"delete": "Odstrániť",
	"update": "Update",
	"create": "Vytvoriť",
	"removeAreYouSure": "Naozaj chcete odstrániť \"{x}\"?"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"selectFile": "เลือกไฟล์",
	"name": "ชื่อ",
	"category": "หมวดหมู่",
	"tags": "นามแฝง",
	"theKeywordWhenSearchingForCustomEmoji": "คีย์เวิร์ดสำหรับใช้ค้นหาเอโมจิที่กำหนดเอง",
	"setMultipleBySeparatingWithSpace": "คั่นหลายรายการด้วยช่องว่าง",
	"license": "ใบอนุญาต",
	"rolesThatCanBeUsedThisEmojiAsReaction": "บทบาทที่สามารถใช้เอโมจินี้เป็นรีแอคชั่นได้",
	"all": "ทั้งหมด",
	"add": "เพิ่ม",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "ถ้าหากไม่ได้ระบุบทบาท ใคร ๆ ก็สามารถใช้เอโมจินี้เพื่อรีแอคชั่นได้",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "บทบาทเหล่านี้ต้องเป็นสาธารณะ",
	"sensitive": "เนื้อหาที่ละเอียดอ่อน",
	"localOnly": "เฉพาะท้องถิ่น",
	"delete": "ลบ",
	"update": "อัปเดต",
	"create": "สร้าง",
	"removeAreYouSure": "ต้องการลบ “{x}” ใช่ไหม?"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"selectFile": "Dosya seçin",
	"name": "İsim",
	"category": "Kategori",
	"tags": "Takma adlar",
	"theKeywordWhenSearchingForCustomEmoji": "Bu, kendi emojilerini ararken kullanılan anahtar kelimedir.",
	"setMultipleBySeparatingWithSpace": "Birden fazla girişi boşluklarla ayırın.",
	"license": "Lisans",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Bu emojiyi tepki olarak kullanabileceğin roller",
	"all": "Tümü",
	"add": "Ekle",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Herhangi bir rol belirtilmezse, herkes bu emojiyi tepki olarak kullanabilir.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "Bu roller herkese açık olmalıdır.",
	"sensitive": "Hassas",
	"localOnly": "Yalnızca yerel",
	"delete": "Sil",
	"update": "Güncelle",
	"create": "Oluştur",
	"removeAreYouSure": "“{x}” öğesini kaldırmak istediğinizden emin misin?"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"selectFile": "Select a file",
	"name": "Name",
	"category": "Category",
	"tags": "Aliases",
	"theKeywordWhenSearchingForCustomEmoji": "This is the keyword when searching for custom emojis.",
	"setMultipleBySeparatingWithSpace": "Separate multiple entries with spaces.",
	"license": "License",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"all": "All",
	"add": "Add",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "These roles must be public.",
	"sensitive": "Sensitive",
	"localOnly": "Local only",
	"delete": "ئۆچۈرۈش",
	"update": "Update",
	"create": "Create",
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"selectFile": "Вибрати файл",
	"name": "Ім'я",
	"category": "Категорія",
	"tags": "Теги",
	"theKeywordWhenSearchingForCustomEmoji": "Це ключове слово для пошуку користувацьких емодзі.",
	"setMultipleBySeparatingWithSpace": "Можна вказати кілька значень, відділивши їх пробілом.",
	"license": "Ліцензія",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Ролі, які можуть використовувати цей емодзі як реакцію",
	"all": "Всі",
	"add": "Додати",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "Якщо ролі не вказано, будь-хто може використовувати цей емодзі як реакцію.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "Ці ролі мають бути публічними.",
	"sensitive": "NSFW",
	"localOnly": "Локально",
	"delete": "Видалити",
	"update": "Оновити",
	"create": "Створити",
	"removeAreYouSure": "Ви впевнені, що хочете видалити \"{x}\"?"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"selectFile": "Chọn tập tin",
	"name": "Tên",
	"category": "Phân loại",
	"tags": "Thẻ",
	"theKeywordWhenSearchingForCustomEmoji": "Đây là từ khoá được sử dụng để tìm kiếm emoji",
	"setMultipleBySeparatingWithSpace": "Tách nhiều mục nhập bằng dấu cách.",
	"license": "Giấy phép",
	"rolesThatCanBeUsedThisEmojiAsReaction": "Roles that can use this emoji as reaction",
	"all": "Tất cả",
	"add": "Thêm",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "If no roles are specified, anyone can use this emoji as reaction.",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "These roles must be public.",
	"sensitive": "Nhạy cảm",
	"localOnly": "Chỉ trên máy chủ",
	"delete": "Xóa",
	"update": "Cập nhật",
	"create": "Tạo",
	"removeAreYouSure": "Bạn có chắc muốn gỡ \"{x}\"?"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"selectFile": "选择文件",
	"name": "名称",
	"category": "类别",
	"tags": "标签",
	"theKeywordWhenSearchingForCustomEmoji": "这将是搜索自定义表情符号时的关键词。",
	"setMultipleBySeparatingWithSpace": "您可以使用空格分隔多个项目。",
	"license": "许可信息",
	"rolesThatCanBeUsedThisEmojiAsReaction": "可以使用表情作为回应的角色",
	"all": "全部",
	"add": "添加",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "在没有指定角色的情况下，任何人都可以使用表情作为回应。",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "角色必须是公开的。",
	"sensitive": "敏感内容",
	"localOnly": "仅限本地",
	"delete": "删除",
	"update": "更新",
	"create": "创建",
	"removeAreYouSure": "要删掉「{x}」吗？"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"selectFile": "選擇檔案",
	"name": "名稱",
	"category": "類別",
	"tags": "標籤",
	"theKeywordWhenSearchingForCustomEmoji": "這是搜尋自訂表情符號時的關鍵字",
	"setMultipleBySeparatingWithSpace": "您可以使用空格分隔多個項目。",
	"license": "授權",
	"rolesThatCanBeUsedThisEmojiAsReaction": "可以使用此表情符號為反應的角色",
	"all": "全部",
	"add": "新增",
	"rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription": "如沒有指定角色，任何人都可使用此表情回應。",
	"rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn": "必須為公開角色。",
	"sensitive": "敏感內容",
	"localOnly": "僅限本地",
	"delete": "刪除",
	"update": "更新",
	"create": "新增",
	"removeAreYouSure": "確定要刪掉「{x}」嗎？"
}
</locale>
