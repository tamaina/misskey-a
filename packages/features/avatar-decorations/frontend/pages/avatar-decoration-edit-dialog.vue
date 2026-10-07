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
	<template v-if="avatarDecoration" #header>{{ avatarDecoration.name }}</template>
	<template v-else #header>New decoration</template>

	<div style="display: flex; flex-direction: column; min-height: 100%;">
		<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px; flex-grow: 1;">
			<div class="_gaps_m">
				<div :class="$style.preview">
					<div :class="[$style.previewItem, $style.light]">
						<MkAvatar style="width: 60px; height: 60px;" :user="$i" :decorations="url != '' ? [{ url }] : []" forceShowDecoration/>
					</div>
					<div :class="[$style.previewItem, $style.dark]">
						<MkAvatar style="width: 60px; height: 60px;" :user="$i" :decorations="url != '' ? [{ url }] : []" forceShowDecoration/>
					</div>
				</div>
				<MkInput v-model="name">
					<template #label>{{ $locale.sfc.name }}</template>
				</MkInput>
				<MkInput v-model="url">
					<template #label>{{ $locale.sfc.imageUrl }}</template>
				</MkInput>
				<MkInput v-model="category" :datalist="props.categories || []">
					<template #label>{{ $locale.sfc.category }}</template>
				</MkInput>
				<MkTextarea v-model="description">
					<template #label>{{ $locale.sfc.description }}</template>
				</MkTextarea>
				<MkFolder>
					<template #label>{{ $locale.sfc.availableRoles }}</template>
					<template #suffix>{{ rolesThatCanBeUsedThisDecoration.length === 0 ? $locale.sfc.all : rolesThatCanBeUsedThisDecoration.length }}</template>

					<div class="_gaps">
						<MkButton rounded @click="addRole"><i class="ti ti-plus"></i> {{ $locale.sfc.add }}</MkButton>

						<div v-for="role in rolesThatCanBeUsedThisDecoration" :key="role.id" :class="$style.roleItem">
							<MkRolePreview :class="$style.role" :role="role" :forModeration="true" :detailed="false" style="pointer-events: none;"/>
							<button v-if="role.target === 'manual'" class="_button" :class="$style.roleUnassign" @click="removeRole(role, $event)"><i class="ti ti-x"></i></button>
							<button v-else class="_button" :class="$style.roleUnassign" disabled><i class="ti ti-ban"></i></button>
						</div>
					</div>
				</MkFolder>
				<MkButton v-if="avatarDecoration" danger @click="del()"><i class="ti ti-trash"></i> {{ $locale.sfc.delete }}</MkButton>
			</div>
		</div>
		<div :class="$style.footer">
			<MkButton primary rounded style="margin: 0 auto;" @click="done"><i class="ti ti-check"></i> {{ props.avatarDecoration ? $locale.sfc.update : $locale.sfc.create }}</MkButton>
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
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkRolePreview from '@features/roles/frontend/components/MkRolePreview.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import { ensureSignin } from '@features/auth/frontend/i.js';

const $i = ensureSignin();

const props = defineProps<{
	avatarDecoration?: Misskey.entities.AdminAvatarDecorationsListResponse[number],
	categories?: string[],
}>();

const emit = defineEmits<{
	(ev: 'done', v: { deleted?: boolean; updated?: any; created?: any }): void,
	(ev: 'closed'): void
}>();

const windowEl = useTemplateRef('windowEl');
const url = ref<string>(props.avatarDecoration ? props.avatarDecoration.url : '');
const name = ref<string>(props.avatarDecoration ? props.avatarDecoration.name : '');
const category = ref<string>(props.avatarDecoration?.category ? props.avatarDecoration.category : '');
const description = ref<string>(props.avatarDecoration ? props.avatarDecoration.description : '');
const roleIdsThatCanBeUsedThisDecoration = ref(props.avatarDecoration ? props.avatarDecoration.roleIdsThatCanBeUsedThisDecoration : []);
const rolesThatCanBeUsedThisDecoration = ref<Misskey.entities.Role[]>([]);

watch(roleIdsThatCanBeUsedThisDecoration, async () => {
	rolesThatCanBeUsedThisDecoration.value = (await Promise.all(roleIdsThatCanBeUsedThisDecoration.value.map((id) => misskeyApi('admin/roles/show', { roleId: id }).catch(() => null)))).filter(x => x != null);
}, { immediate: true });

async function addRole() {
	const roles = await misskeyApi('admin/roles/list');
	const currentRoleIds = rolesThatCanBeUsedThisDecoration.value.map(x => x.id);

	const { canceled, result: roleId } = await os.select({
		items: roles.filter(r => r.isPublic).filter(r => !currentRoleIds.includes(r.id)).map(r => ({ label: r.name, value: r.id })),
	});
	if (canceled || roleId == null) return;

	rolesThatCanBeUsedThisDecoration.value.push(roles.find(r => r.id === roleId)!);
}

async function removeRole(role: Misskey.entities.Role, ev: PointerEvent) {
	rolesThatCanBeUsedThisDecoration.value = rolesThatCanBeUsedThisDecoration.value.filter(x => x.id !== role.id);
}

async function done() {
	const params = {
		url: url.value,
		name: name.value,
		description: description.value,
		category: category.value,
		roleIdsThatCanBeUsedThisDecoration: rolesThatCanBeUsedThisDecoration.value.map(x => x.id),
	};

	if (props.avatarDecoration) {
		await os.apiWithDialog('admin/avatar-decorations/update', {
			id: props.avatarDecoration.id,
			...params,
		});

		emit('done', {
			updated: {
				id: props.avatarDecoration.id,
				...params,
			},
		});

		windowEl.value?.close();
	} else {
		const created = await os.apiWithDialog('admin/avatar-decorations/create', params);

		emit('done', {
			created: created,
		});

		windowEl.value?.close();
	}
}

async function del() {
	if (props.avatarDecoration == null) return;

	const { canceled } = await os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters($locale.value.sfc.removeAreYouSure, { x: name.value }),
	});
	if (canceled) return;

	misskeyApi('admin/avatar-decorations/delete', {
		id: props.avatarDecoration.id,
	}).then(() => {
		emit('done', {
			deleted: true,
		});
		windowEl.value?.close();
	});
}
</script>

<style lang="scss" module>
.preview {
	display: grid;
	place-items: center;
	grid-template-columns: 1fr 1fr;
	grid-template-rows: 1fr;
	gap: var(--MI-margin);
}

.previewItem {
	width: 100%;
	height: 100%;
	min-height: 160px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--MI-radius);

	&.light {
		background: #eee;
	}

	&.dark {
		background: #222;
	}
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
	"removeAreYouSure": "متأكد من أنك تريد حذف {x}؟",
	"name": "الإسم",
	"imageUrl": "رابط الصورة",
	"category": "الفئات",
	"description": "الوصف",
	"availableRoles": "Available roles",
	"all": "الكل",
	"add": "إضافة",
	"delete": "حذف",
	"update": "حدِّث",
	"create": "أنشئ"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"removeAreYouSure": "Segur que vols esborrar «{x}»?",
	"name": "Nom",
	"imageUrl": "URL de la imatge",
	"category": "Categoria",
	"description": "Descripció",
	"availableRoles": "Roles disponibles ",
	"all": "Tot",
	"add": "Afegir",
	"delete": "Elimina",
	"update": "Actualitzar",
	"create": "Crear"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"removeAreYouSure": "Jste si jistí že chcete smazat \"{x}\"?",
	"name": "Jméno",
	"imageUrl": "URL obrázku",
	"category": "Kategorie",
	"description": "Popis",
	"availableRoles": "Available roles",
	"all": "Vše",
	"add": "Přidat",
	"delete": "Smazat",
	"update": "Aktualizovat",
	"create": "Vytvořit"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"name": "Name",
	"imageUrl": "Image URL",
	"category": "Category",
	"description": "Description",
	"availableRoles": "Available roles",
	"all": "All",
	"add": "Add",
	"delete": "Delete",
	"update": "Update",
	"create": "Create"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"removeAreYouSure": "Möchtest du „{x}“ wirklich entfernen?",
	"name": "Name",
	"imageUrl": "Bild-URL",
	"category": "Kategorie",
	"description": "Beschreibung",
	"availableRoles": "Verfügbare Rollen",
	"all": "Alle",
	"add": "Hinzufügen",
	"delete": "Löschen",
	"update": "Aktualisieren",
	"create": "Erstellen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"name": "Name",
	"imageUrl": "Image URL",
	"category": "Category",
	"description": "Description",
	"availableRoles": "Available roles",
	"all": "All",
	"add": "Add",
	"delete": "Delete",
	"update": "Update",
	"create": "Create"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"removeAreYouSure": "¿Desea borrar \"{x}\"?",
	"name": "Nombre",
	"imageUrl": "URL de la imagen.",
	"category": "Categoría",
	"description": "Descripción",
	"availableRoles": "Roles disponibles ",
	"all": "Todo",
	"add": "Agregar",
	"delete": "Borrar",
	"update": "Actualizar",
	"create": "Crear"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"removeAreYouSure": "Êtes-vous sûr·e de vouloir supprimer « {x} »\u202f?",
	"name": "Nom",
	"imageUrl": "URL de l’image",
	"category": "Catégorie",
	"description": "Description",
	"availableRoles": "Rôles disponibles",
	"all": "Tous",
	"add": "Ajouter",
	"delete": "Supprimer",
	"update": "Mettre à jour",
	"create": "Créer"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"removeAreYouSure": "Apakah kamu yakin ingin menghapus \"{x}\"?",
	"name": "Nama",
	"imageUrl": "URL Gambar",
	"category": "Kategori",
	"description": "Deskripsi",
	"availableRoles": "Peran tersedia",
	"all": "Semua",
	"add": "Tambahkan",
	"delete": "Hapus",
	"update": "Perbarui",
	"create": "Buat"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"removeAreYouSure": "Vuoi davvero eliminare \"{x}\"?",
	"name": "Nome",
	"imageUrl": "URL dell'immagine",
	"category": "Categoria",
	"description": "Descrizione",
	"availableRoles": "Ruoli disponibili",
	"all": "Tutte",
	"add": "Aggiungi",
	"delete": "Elimina",
	"update": "Aggiorna",
	"create": "Crea"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"removeAreYouSure": "「{x}」を削除しますか？",
	"name": "名前",
	"imageUrl": "画像URL",
	"category": "カテゴリ",
	"description": "説明",
	"availableRoles": "利用可能なロール",
	"all": "全て",
	"add": "追加",
	"delete": "削除",
	"update": "更新",
	"create": "作成"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"removeAreYouSure": "「{x}」はほかしてええか？",
	"name": "名前",
	"imageUrl": "画像URL",
	"category": "カテゴリ",
	"description": "説明",
	"availableRoles": "使えるロール",
	"all": "みんな",
	"add": "増やす",
	"delete": "ほかす",
	"update": "更新",
	"create": "作成"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"name": "Name",
	"imageUrl": "Image URL",
	"category": "Category",
	"description": "Description",
	"availableRoles": "Available roles",
	"all": "All",
	"add": "Add",
	"delete": "Kkes",
	"update": "Update",
	"create": "Create"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"name": "Name",
	"imageUrl": "Image URL",
	"category": "Category",
	"description": "Description",
	"availableRoles": "Available roles",
	"all": "All",
	"add": "Add",
	"delete": "ಅಳಿಸು",
	"update": "Update",
	"create": "Create"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"removeAreYouSure": "\"{x}\" 을(를) 삭제하시겠습니까?",
	"name": "이름",
	"imageUrl": "이미지 URL",
	"category": "카테고리",
	"description": "설명",
	"availableRoles": "사용 가능한 역할",
	"all": "전체",
	"add": "추가",
	"delete": "삭제",
	"update": "업데이트",
	"create": "생성"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"removeAreYouSure": "Weet je zeker dat je \"{x}\" wil verwijderen?",
	"name": "Naam",
	"imageUrl": "AfbeeldingsURL",
	"category": "Categorie",
	"description": "Beschrijving",
	"availableRoles": "Available roles",
	"all": "Alle",
	"add": "Toevoegen",
	"delete": "Verwijderen",
	"update": "Update",
	"create": "Creëer"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"removeAreYouSure": "Er du sikker på at du vil fjerne \"{x}\"?",
	"name": "Navn",
	"imageUrl": "Image URL",
	"category": "Kategori",
	"description": "Beskrivelse",
	"availableRoles": "Available roles",
	"all": "Alle",
	"add": "Legg til",
	"delete": "Slett",
	"update": "Update",
	"create": "Opprett"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"removeAreYouSure": "Czy na pewno chcesz usunąć „{x}”?",
	"name": "Nazwa",
	"imageUrl": "Adres URL obrazka",
	"category": "Kategoria",
	"description": "Opis",
	"availableRoles": "Available roles",
	"all": "Wszystkie",
	"add": "Dodaj",
	"delete": "Usuń",
	"update": "Update",
	"create": "Utwórz"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"removeAreYouSure": "Deseja excluir \"{x}\"?",
	"name": "Nome",
	"imageUrl": "URL da imagem",
	"category": "Categoria",
	"description": "Descrição",
	"availableRoles": "Cargos disponíveis",
	"all": "Todos",
	"add": "Adicionar",
	"delete": "Excluir",
	"update": "Atualizar",
	"create": "Criar"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"removeAreYouSure": "Хотите удалить «{x}»?",
	"name": "Название",
	"imageUrl": "Ссылка на изображение",
	"category": "Категория",
	"description": "Описание",
	"availableRoles": "Доступные роли",
	"all": "Все",
	"add": "Добавить",
	"delete": "Удалить",
	"update": "Обновить",
	"create": "Создать"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"removeAreYouSure": "Naozaj chcete odstrániť \"{x}\"?",
	"name": "Názov",
	"imageUrl": "URL obrázku",
	"category": "Kategórie",
	"description": "Popis",
	"availableRoles": "Available roles",
	"all": "Všetko",
	"add": "Pridať",
	"delete": "Odstrániť",
	"update": "Update",
	"create": "Vytvoriť"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"removeAreYouSure": "ต้องการลบ “{x}” ใช่ไหม?",
	"name": "ชื่อ",
	"imageUrl": "URL รูปภาพ",
	"category": "หมวดหมู่",
	"description": "คำอธิบาย",
	"availableRoles": "บทบาทที่ใช้ได้",
	"all": "ทั้งหมด",
	"add": "เพิ่ม",
	"delete": "ลบ",
	"update": "อัปเดต",
	"create": "สร้าง"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"removeAreYouSure": "“{x}” öğesini kaldırmak istediğinizden emin misin?",
	"name": "İsim",
	"imageUrl": "Görsel URL",
	"category": "Kategori",
	"description": "Açıklama",
	"availableRoles": "Mevcut roller",
	"all": "Tümü",
	"add": "Ekle",
	"delete": "Sil",
	"update": "Güncelle",
	"create": "Oluştur"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"name": "Name",
	"imageUrl": "Image URL",
	"category": "Category",
	"description": "Description",
	"availableRoles": "Available roles",
	"all": "All",
	"add": "Add",
	"delete": "ئۆچۈرۈش",
	"update": "Update",
	"create": "Create"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"removeAreYouSure": "Ви впевнені, що хочете видалити \"{x}\"?",
	"name": "Ім'я",
	"imageUrl": "Посилання на зображення",
	"category": "Категорія",
	"description": "Опис",
	"availableRoles": "Доступні ролі",
	"all": "Всі",
	"add": "Додати",
	"delete": "Видалити",
	"update": "Оновити",
	"create": "Створити"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"removeAreYouSure": "Bạn có chắc muốn gỡ \"{x}\"?",
	"name": "Tên",
	"imageUrl": "URL ảnh",
	"category": "Phân loại",
	"description": "Mô tả",
	"availableRoles": "Available roles",
	"all": "Tất cả",
	"add": "Thêm",
	"delete": "Xóa",
	"update": "Cập nhật",
	"create": "Tạo"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"removeAreYouSure": "要删掉「{x}」吗？",
	"name": "名称",
	"imageUrl": "图片 URL",
	"category": "类别",
	"description": "描述",
	"availableRoles": "可用角色",
	"all": "全部",
	"add": "添加",
	"delete": "删除",
	"update": "更新",
	"create": "创建"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"removeAreYouSure": "確定要刪掉「{x}」嗎？",
	"name": "名稱",
	"imageUrl": "圖片URL",
	"category": "類別",
	"description": "描述",
	"availableRoles": "可用角色",
	"all": "全部",
	"add": "新增",
	"delete": "刪除",
	"update": "更新",
	"create": "新增"
}
</locale>
