<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div :class="$style.header">
		<MkSelect v-model="typeModelForMkSelect" :items="typeDef" :class="$style.typeSelect">
		</MkSelect>
		<button v-if="draggable" class="_button" :class="$style.dragHandle" :draggable="true" @dragstart.stop="dragStartCallback">
			<i class="ti ti-menu-2"></i>
		</button>
		<button v-if="draggable" class="_button" :class="$style.remove" @click="removeSelf">
			<i class="ti ti-x"></i>
		</button>
	</div>

	<div v-if="v.type === 'and' || v.type === 'or'" class="_gaps">
		<MkDraggable
			v-model="v.values"
			direction="vertical"
			withGaps
			canNest
			manualDragStart
			group="roleFormula"
		>
			<template #default="{ item, dragStart }">
				<div :class="$style.item">
					<!-- divが無いとエラーになる -->
					<RolesEditorFormula
						:modelValue="item"
						:dragStartCallback="dragStart"
						draggable
						@update:modelValue="updated => childValuesItemUpdated(updated)"
						@remove="removeChildItem(item.id)"
					/>
				</div>
			</template>
		</MkDraggable>
		<MkButton rounded style="margin: 0 auto;" @click="addChildValue"><i class="ti ti-plus"></i> {{ $locale.sfc.add }}</MkButton>
	</div>

	<div v-else-if="v.type === 'not'" :class="$style.item">
		<RolesEditorFormula v-model="v.value"/>
	</div>

	<MkInput v-else-if="v.type === 'createdLessThan' || v.type === 'createdMoreThan'" v-model="v.sec" type="number">
		<template #suffix>sec</template>
	</MkInput>

	<MkInput v-else-if="v.type === 'followersLessThanOrEq' || v.type === 'followersMoreThanOrEq' || v.type === 'followingLessThanOrEq' || v.type === 'followingMoreThanOrEq' || v.type === 'notesLessThanOrEq' || v.type === 'notesMoreThanOrEq'" v-model="v.value" type="number">
	</MkInput>

	<MkSelect v-else-if="v.type === 'roleAssignedTo'" v-model="v.roleId" :items="assignedToDef">
	</MkSelect>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import type { GetMkSelectValueTypesFromDef, MkSelectItem } from '@features/ui/frontend/components/MkSelect.vue';
import { genId } from '@features/runtime/frontend/utility/id.js';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkDraggable from '@features/ui/frontend/components/MkDraggable.vue';
import { initializeRoleFormula } from './role-formula-editor.js';
import type { EditableRoleFormula } from './role-formula-editor.js';
import { rolesCache } from '@features/runtime/frontend/cache.js';

const emit = defineEmits<{
	(ev: 'update:modelValue', value: EditableRoleFormula): void;
	(ev: 'remove'): void;
}>();

const props = defineProps<{
	modelValue: Misskey.entities.Role['condFormula'];
	draggable?: boolean;
	dragStartCallback?: (ev: DragEvent) => void;
}>();

const v = ref<EditableRoleFormula>(initializeRoleFormula(props.modelValue, genId));

const roles = await rolesCache.fetch();

watch(() => props.modelValue, () => {
	if (JSON.stringify(props.modelValue) === JSON.stringify(v.value)) return;
	v.value = initializeRoleFormula(props.modelValue, genId);
}, { deep: true });

watch(v, () => {
	emit('update:modelValue', v.value);
}, { deep: true });

const typeDef = [
	{ label: $locale.value.sfc.isLocal, value: 'isLocal' },
	{ label: $locale.value.sfc.isRemote, value: 'isRemote' },
	{ label: $locale.value.sfc.isSuspended, value: 'isSuspended' },
	{ label: $locale.value.sfc.isLocked, value: 'isLocked' },
	{ label: $locale.value.sfc.isBot, value: 'isBot' },
	{ label: $locale.value.sfc.isCat, value: 'isCat' },
	{ label: $locale.value.sfc.isExplorable, value: 'isExplorable' },
	{ label: $locale.value.sfc.roleAssignedTo, value: 'roleAssignedTo' },
	{ label: $locale.value.sfc.createdLessThan, value: 'createdLessThan' },
	{ label: $locale.value.sfc.createdMoreThan, value: 'createdMoreThan' },
	{ label: $locale.value.sfc.followersLessThanOrEq, value: 'followersLessThanOrEq' },
	{ label: $locale.value.sfc.followersMoreThanOrEq, value: 'followersMoreThanOrEq' },
	{ label: $locale.value.sfc.followingLessThanOrEq, value: 'followingLessThanOrEq' },
	{ label: $locale.value.sfc.followingMoreThanOrEq, value: 'followingMoreThanOrEq' },
	{ label: $locale.value.sfc.notesLessThanOrEq, value: 'notesLessThanOrEq' },
	{ label: $locale.value.sfc.notesMoreThanOrEq, value: 'notesMoreThanOrEq' },
	{ label: $locale.value.sfc.and, value: 'and' },
	{ label: $locale.value.sfc.or, value: 'or' },
	{ label: $locale.value.sfc.not, value: 'not' },
] as const satisfies MkSelectItem[];

type KeyOfUnion<T> = T extends T ? keyof T : never;

type DistributiveOmit<T, K extends KeyOfUnion<T>> = T extends T
	? Omit<T, K>
	: never;

const typeModelForMkSelect = computed<GetMkSelectValueTypesFromDef<typeof typeDef>>({
	get: () => v.value.type,
	set: (t) => {
		let newValue: DistributiveOmit<EditableRoleFormula, 'id'>;
		switch (t) {
			case 'and': newValue = { type: 'and', values: [] }; break;
			case 'or': newValue = { type: 'or', values: [] }; break;
			case 'not': newValue = { type: 'not', value: { id: genId(), type: 'isRemote' } }; break;
			case 'roleAssignedTo': newValue = { type: 'roleAssignedTo', roleId: '' }; break;
			case 'createdLessThan': newValue = { type: 'createdLessThan', sec: 86400 }; break;
			case 'createdMoreThan': newValue = { type: 'createdMoreThan', sec: 86400 }; break;
			case 'followersLessThanOrEq': newValue = { type: 'followersLessThanOrEq', value: 10 }; break;
			case 'followersMoreThanOrEq': newValue = { type: 'followersMoreThanOrEq', value: 10 }; break;
			case 'followingLessThanOrEq': newValue = { type: 'followingLessThanOrEq', value: 10 }; break;
			case 'followingMoreThanOrEq': newValue = { type: 'followingMoreThanOrEq', value: 10 }; break;
			case 'notesLessThanOrEq': newValue = { type: 'notesLessThanOrEq', value: 10 }; break;
			case 'notesMoreThanOrEq': newValue = { type: 'notesMoreThanOrEq', value: 10 }; break;
			default: newValue = { type: t }; break;
		}
		v.value = { id: v.value.id, ...newValue };
	},
});

const assignedToDef = computed(() => roles.filter(r => r.target === 'manual').map(r => ({ label: r.name, value: r.id })) satisfies MkSelectItem[]);

function addChildValue() {
	if (v.value.type !== 'and' && v.value.type !== 'or') return;
	v.value.values.push({ id: genId(), type: 'isRemote' });
}

function childValuesItemUpdated(item: EditableRoleFormula) {
	if (v.value.type !== 'and' && v.value.type !== 'or') return;
	const i = v.value.values.findIndex(_item => _item.id === item.id);
	v.value.values[i] = item;
}

function removeChildItem(itemId: string) {
	if (v.value.type !== 'and' && v.value.type !== 'or') return;
	v.value.values = v.value.values.filter(_item => _item.id !== itemId);
}

function removeSelf() {
	emit('remove');
}
</script>

<style lang="scss" module>
.header {
	display: flex;
}

.typeSelect {
	flex: 1;
}

.dragHandle {
	cursor: move;
	margin-left: 10px;
}

.remove {
	margin-left: 10px;
}

.item {
	border: solid 2px var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
	padding: 12px;

	&:hover {
		border-color: var(--MI_THEME-accent);
	}
}
</style>

<locale locale="ar-SA" lang="json">
{
	"isLocal": "مستخدم محلي",
	"isRemote": "مستخدم بعيد",
	"isSuspended": "Suspended user",
	"isLocked": "Private accounts",
	"isBot": "Bot Users",
	"isCat": "Cat Users",
	"isExplorable": "Effective user of \"make an account discoverable\"",
	"roleAssignedTo": "Assigned to manual roles",
	"createdLessThan": "Less than X has passed since account creation",
	"createdMoreThan": "More than X has passed since account creation",
	"followersLessThanOrEq": "Has X or fewer followers",
	"followersMoreThanOrEq": "Has X or more followers",
	"followingLessThanOrEq": "Follows X or fewer accounts",
	"followingMoreThanOrEq": "Follows X or more accounts",
	"notesLessThanOrEq": "Post count is less than/equal to",
	"notesMoreThanOrEq": "Post count is greater than/equal to",
	"and": "AND-Condition",
	"or": "OR-Condition",
	"not": "NOT-Condition",
	"add": "إضافة"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"isLocal": "Usuari local",
	"isRemote": "Usuari remot",
	"isSuspended": "Usuari suspès",
	"isLocked": "Comptes privats",
	"isBot": "Usuaris bots",
	"isCat": "Usuaris gats",
	"isExplorable": "Fes que el compte aparegui a les cerques",
	"roleAssignedTo": "Assignat a rols manuals",
	"createdLessThan": "Han passat menys de X a passat des de la creació del compte",
	"createdMoreThan": "Han passat més de X des de la creació del compte",
	"followersLessThanOrEq": "Té menys de X seguidors",
	"followersMoreThanOrEq": "Té X o més seguidors",
	"followingLessThanOrEq": "Segueix X o menys comptes",
	"followingMoreThanOrEq": "Segueix a X o més comptes",
	"notesLessThanOrEq": "Les publicacions són menys o igual a ",
	"notesMoreThanOrEq": "Les publicacions són més o igual a ",
	"and": "AND condicional ",
	"or": "OR condicional",
	"not": "NOT condicional",
	"add": "Afegir"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"isLocal": "Místní uživatel",
	"isRemote": "Vzdálený uživatel",
	"isSuspended": "Suspended user",
	"isLocked": "Private accounts",
	"isBot": "Bot Users",
	"isCat": "Cat Users",
	"isExplorable": "Effective user of \"make an account discoverable\"",
	"roleAssignedTo": "Assigned to manual roles",
	"createdLessThan": "Od vytvoření účtu uplynulo méně než X",
	"createdMoreThan": "Od vytvoření účtu uplynulo více než X",
	"followersLessThanOrEq": "Má X nebo méně sledujících",
	"followersMoreThanOrEq": "Má X nebo více sledujících",
	"followingLessThanOrEq": "Sleduje X nebo méně účtů",
	"followingMoreThanOrEq": "Sleduje X nebo více účtů",
	"notesLessThanOrEq": "Počet příspěvků je menší než/rovná se",
	"notesMoreThanOrEq": "Počet příspěvků je větší než/rovná se",
	"and": "AND kondice",
	"or": "OR kondice",
	"not": "NOT kondice",
	"add": "Přidat"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"isLocal": "Local user",
	"isRemote": "Remote user",
	"isSuspended": "Suspended user",
	"isLocked": "Private accounts",
	"isBot": "Bot Users",
	"isCat": "Cat Users",
	"isExplorable": "Effective user of \"make an account discoverable\"",
	"roleAssignedTo": "Assigned to manual roles",
	"createdLessThan": "Less than X has passed since account creation",
	"createdMoreThan": "More than X has passed since account creation",
	"followersLessThanOrEq": "Has X or fewer followers",
	"followersMoreThanOrEq": "Has X or more followers",
	"followingLessThanOrEq": "Follows X or fewer accounts",
	"followingMoreThanOrEq": "Follows X or more accounts",
	"notesLessThanOrEq": "Post count is less than/equal to",
	"notesMoreThanOrEq": "Post count is greater than/equal to",
	"and": "AND-Condition",
	"or": "OR-Condition",
	"not": "NOT-Condition",
	"add": "Add"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"isLocal": "Lokaler Benutzer",
	"isRemote": "Benutzer fremder Instanz",
	"isSuspended": "Gesperrter Benutzer",
	"isLocked": "Private Konten",
	"isBot": "Bot-Benutzer",
	"isCat": "Katzen-Benutzer",
	"isExplorable": "Benutzer, die ihr Konto im \"Erkunden\"-Bereich sichtbar machen",
	"roleAssignedTo": "Manuellen Rollen zugewiesen",
	"createdLessThan": "Kontoerstellung liegt weniger als X zurück",
	"createdMoreThan": "Kontoerstellung liegt mehr als X zurück",
	"followersLessThanOrEq": "Hat X oder weniger Follower",
	"followersMoreThanOrEq": "Hat X oder mehr Follower",
	"followingLessThanOrEq": "Folgt X oder weniger Benutzern",
	"followingMoreThanOrEq": "Folgt X oder mehr Benutzern",
	"notesLessThanOrEq": "Beitragszahl ist kleiner-gleich",
	"notesMoreThanOrEq": "Beitragszahl ist größer-gleich",
	"and": "UND-Bedingung",
	"or": "ODER-Bedingung",
	"not": "NICHT-Bedingung",
	"add": "Hinzufügen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"isLocal": "Local user",
	"isRemote": "Remote user",
	"isSuspended": "Suspended user",
	"isLocked": "Private accounts",
	"isBot": "Bot Users",
	"isCat": "Cat Users",
	"isExplorable": "Effective user of \"make an account discoverable\"",
	"roleAssignedTo": "Assigned to manual roles",
	"createdLessThan": "Less than X has passed since account creation",
	"createdMoreThan": "More than X has passed since account creation",
	"followersLessThanOrEq": "Has X or fewer followers",
	"followersMoreThanOrEq": "Has X or more followers",
	"followingLessThanOrEq": "Follows X or fewer accounts",
	"followingMoreThanOrEq": "Follows X or more accounts",
	"notesLessThanOrEq": "Post count is less than/equal to",
	"notesMoreThanOrEq": "Post count is greater than/equal to",
	"and": "AND-Condition",
	"or": "OR-Condition",
	"not": "NOT-Condition",
	"add": "Add"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"isLocal": "Usuario local",
	"isRemote": "Usuario remoto",
	"isSuspended": "Usuario suspendido",
	"isLocked": "Cuentas privadas",
	"isBot": "Usuarios Bot",
	"isCat": "Usuarios Gato",
	"isExplorable": "Hacer que la cuenta sea visible en las búsquedas",
	"roleAssignedTo": "Asignado a roles manuales",
	"createdLessThan": "Menos de X han pasado desde la creación de la cuenta",
	"createdMoreThan": "Más de X han pasado desde la creación de la cuenta",
	"followersLessThanOrEq": "Tiene X o menos seguidores",
	"followersMoreThanOrEq": "Tiene X o más seguidores",
	"followingLessThanOrEq": "Sigue X o menos cuentas",
	"followingMoreThanOrEq": "Sigue X o más cuentas",
	"notesLessThanOrEq": "El número de notas es inferior o igual a",
	"notesMoreThanOrEq": "El número de notas es superior o igual a",
	"and": "Condicional AND",
	"or": "Condicional OR",
	"not": "Condicional NOT",
	"add": "Agregar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"isLocal": "Local user",
	"isRemote": "Remote user",
	"isSuspended": "Suspended user",
	"isLocked": "Private accounts",
	"isBot": "Bot Users",
	"isCat": "Cat Users",
	"isExplorable": "Effective user of \"make an account discoverable\"",
	"roleAssignedTo": "Assigned to manual roles",
	"createdLessThan": "Less than X has passed since account creation",
	"createdMoreThan": "More than X has passed since account creation",
	"followersLessThanOrEq": "Has X or fewer followers",
	"followersMoreThanOrEq": "Has X or more followers",
	"followingLessThanOrEq": "Follows X or fewer accounts",
	"followingMoreThanOrEq": "Follows X or more accounts",
	"notesLessThanOrEq": "Post count is less than/equal to",
	"notesMoreThanOrEq": "Post count is greater than/equal to",
	"and": "AND-Condition",
	"or": "OR-Condition",
	"not": "NOT-Condition",
	"add": "Ajouter"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"isLocal": "Pengguna lokal",
	"isRemote": "Pengguna remote",
	"isSuspended": "Pengguna yang ditangguhkan",
	"isLocked": "Akun privat",
	"isBot": "Pengguna Bot",
	"isCat": "Pengguna Kucing",
	"isExplorable": "Pengguna efektif yang akunnya dapat dicari",
	"roleAssignedTo": "Ditugaskan ke peran manual",
	"createdLessThan": "Telah berlalu kurang dari X sejak pembuatan akun",
	"createdMoreThan": "Telah berlalu lebih dari X sejak pembuatan akun",
	"followersLessThanOrEq": "Memiliki pengikut X atau kurang dari tersebut",
	"followersMoreThanOrEq": "Memiliki pengikut X atau lebih dari tersebut",
	"followingLessThanOrEq": "Mengikuti X pengguna atau kurang dari itu",
	"followingMoreThanOrEq": "Mengikuti X pengguna atau lebih dari itu",
	"notesLessThanOrEq": "Jumlah postingan kurang dari sama dengan",
	"notesMoreThanOrEq": "Jumlah postingan lebih dari sama dengan",
	"and": "Kondisi-AND",
	"or": "Kondisi-OR",
	"not": "Kondisi-NOT",
	"add": "Tambahkan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"isLocal": "Profilo locale",
	"isRemote": "Profilo remoto",
	"isSuspended": "È sospeso",
	"isLocked": "È in stato privato",
	"isBot": "È un bot",
	"isCat": "È un gattino",
	"isExplorable": "Autorizza la pubblicazione nei cataloghi",
	"roleAssignedTo": "Assegnato a ruoli manualmente",
	"createdLessThan": "Profilo creato da meno di N",
	"createdMoreThan": "Profilo creato da più di N",
	"followersLessThanOrEq": "Profilo con N follower o meno",
	"followersMoreThanOrEq": "Profilo con N follower o più",
	"followingLessThanOrEq": "Segue N profili o meno",
	"followingMoreThanOrEq": "Segue N profili o più",
	"notesLessThanOrEq": "Conteggio Note inferiore o uguale a",
	"notesMoreThanOrEq": "Conteggio Note maggiore o uguale a",
	"and": "E",
	"or": "O",
	"not": "NON",
	"add": "Aggiungi"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"isLocal": "ローカルユーザー",
	"isRemote": "リモートユーザー",
	"isSuspended": "サスペンド済みユーザー",
	"isLocked": "鍵アカウントユーザー",
	"isBot": "botユーザー",
	"isCat": "猫ユーザー",
	"isExplorable": "「アカウントを見つけやすくする」が有効なユーザー",
	"roleAssignedTo": "マニュアルロールにアサイン済み",
	"createdLessThan": "アカウント作成から～以内",
	"createdMoreThan": "アカウント作成から～経過",
	"followersLessThanOrEq": "フォロワー数が～以下",
	"followersMoreThanOrEq": "フォロワー数が～以上",
	"followingLessThanOrEq": "フォロー数が～以下",
	"followingMoreThanOrEq": "フォロー数が～以上",
	"notesLessThanOrEq": "投稿数が～以下",
	"notesMoreThanOrEq": "投稿数が～以上",
	"and": "～かつ～",
	"or": "～または～",
	"not": "～ではない",
	"add": "追加"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"isLocal": "ローカルユーザー",
	"isRemote": "リモートユーザー",
	"isSuspended": "サスペンド済みユーザー",
	"isLocked": "鍵アカウントユーザー",
	"isBot": "botユーザー",
	"isCat": "猫ユーザー",
	"isExplorable": "「アカウントを見つけやすくする」が有効なユーザー",
	"roleAssignedTo": "マニュアルロールにアサイン済み",
	"createdLessThan": "アカウント作ってから～以内",
	"createdMoreThan": "アカウント作ってから～経過",
	"followersLessThanOrEq": "フォロワー数が～以下",
	"followersMoreThanOrEq": "フォロワー数が～以上",
	"followingLessThanOrEq": "フォロー数が～以下",
	"followingMoreThanOrEq": "フォロー数が～以上",
	"notesLessThanOrEq": "投稿数が～以下しかない",
	"notesMoreThanOrEq": "投稿を～以上しとる",
	"and": "～かつ～",
	"or": "～または～",
	"not": "～じゃない",
	"add": "増やす"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"isLocal": "Local user",
	"isRemote": "Remote user",
	"isSuspended": "Suspended user",
	"isLocked": "Private accounts",
	"isBot": "Bot Users",
	"isCat": "Cat Users",
	"isExplorable": "Effective user of \"make an account discoverable\"",
	"roleAssignedTo": "Assigned to manual roles",
	"createdLessThan": "Less than X has passed since account creation",
	"createdMoreThan": "More than X has passed since account creation",
	"followersLessThanOrEq": "Has X or fewer followers",
	"followersMoreThanOrEq": "Has X or more followers",
	"followingLessThanOrEq": "Follows X or fewer accounts",
	"followingMoreThanOrEq": "Follows X or more accounts",
	"notesLessThanOrEq": "Post count is less than/equal to",
	"notesMoreThanOrEq": "Post count is greater than/equal to",
	"and": "AND-Condition",
	"or": "OR-Condition",
	"not": "NOT-Condition",
	"add": "Add"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"isLocal": "Local user",
	"isRemote": "Remote user",
	"isSuspended": "Suspended user",
	"isLocked": "Private accounts",
	"isBot": "Bot Users",
	"isCat": "Cat Users",
	"isExplorable": "Effective user of \"make an account discoverable\"",
	"roleAssignedTo": "Assigned to manual roles",
	"createdLessThan": "Less than X has passed since account creation",
	"createdMoreThan": "More than X has passed since account creation",
	"followersLessThanOrEq": "Has X or fewer followers",
	"followersMoreThanOrEq": "Has X or more followers",
	"followingLessThanOrEq": "Follows X or fewer accounts",
	"followingMoreThanOrEq": "Follows X or more accounts",
	"notesLessThanOrEq": "Post count is less than/equal to",
	"notesMoreThanOrEq": "Post count is greater than/equal to",
	"and": "AND-Condition",
	"or": "OR-Condition",
	"not": "NOT-Condition",
	"add": "Add"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"isLocal": "로컬 유저",
	"isRemote": "리모트 유저",
	"isSuspended": "정지된 유저",
	"isLocked": "잠금 계정 유저",
	"isBot": "봇 유저",
	"isCat": "고양이 유저",
	"isExplorable": "‘계정을 쉽게 발견하도록 하기’를 활성화한 유저",
	"roleAssignedTo": "수동 역할에 이미 할당됨",
	"createdLessThan": "가입한 지 다음 일수 이내인 유저",
	"createdMoreThan": "가입한 지 다음 일수 이상인 유저",
	"followersLessThanOrEq": "팔로워 수가 다음 이하인 유저",
	"followersMoreThanOrEq": "팔로워 수가 다음보다 많은 유저",
	"followingLessThanOrEq": "팔로잉 수가 다음 이하인 유저",
	"followingMoreThanOrEq": "팔로잉 수가 다음보다 많은 유저",
	"notesLessThanOrEq": "노트 수가 다음 이하인 유저",
	"notesMoreThanOrEq": "노트 수가 다음보다 많은 유저",
	"and": "다음을 모두 만족",
	"or": "다음을 하나라도 만족",
	"not": "다음을 만족하지 않음",
	"add": "추가"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"isLocal": "Local user",
	"isRemote": "Remote user",
	"isSuspended": "Suspended user",
	"isLocked": "Private accounts",
	"isBot": "Bot Users",
	"isCat": "Cat Users",
	"isExplorable": "Effective user of \"make an account discoverable\"",
	"roleAssignedTo": "Assigned to manual roles",
	"createdLessThan": "Less than X has passed since account creation",
	"createdMoreThan": "More than X has passed since account creation",
	"followersLessThanOrEq": "Has X or fewer followers",
	"followersMoreThanOrEq": "Has X or more followers",
	"followingLessThanOrEq": "Follows X or fewer accounts",
	"followingMoreThanOrEq": "Follows X or more accounts",
	"notesLessThanOrEq": "Post count is less than/equal to",
	"notesMoreThanOrEq": "Post count is greater than/equal to",
	"and": "AND-Condition",
	"or": "OR-Condition",
	"not": "NOT-Condition",
	"add": "Toevoegen"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"isLocal": "Local user",
	"isRemote": "Remote user",
	"isSuspended": "Suspended user",
	"isLocked": "Private accounts",
	"isBot": "Bot Users",
	"isCat": "Cat Users",
	"isExplorable": "Effective user of \"make an account discoverable\"",
	"roleAssignedTo": "Assigned to manual roles",
	"createdLessThan": "Less than X has passed since account creation",
	"createdMoreThan": "More than X has passed since account creation",
	"followersLessThanOrEq": "Has X or fewer followers",
	"followersMoreThanOrEq": "Has X or more followers",
	"followingLessThanOrEq": "Follows X or fewer accounts",
	"followingMoreThanOrEq": "Follows X or more accounts",
	"notesLessThanOrEq": "Post count is less than/equal to",
	"notesMoreThanOrEq": "Post count is greater than/equal to",
	"and": "AND-Condition",
	"or": "OR-Condition",
	"not": "NOT-Condition",
	"add": "Legg til"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"isLocal": "Local user",
	"isRemote": "Remote user",
	"isSuspended": "Suspended user",
	"isLocked": "Private accounts",
	"isBot": "Bot Users",
	"isCat": "Cat Users",
	"isExplorable": "Effective user of \"make an account discoverable\"",
	"roleAssignedTo": "Assigned to manual roles",
	"createdLessThan": "Less than X has passed since account creation",
	"createdMoreThan": "More than X has passed since account creation",
	"followersLessThanOrEq": "Has X or fewer followers",
	"followersMoreThanOrEq": "Has X or more followers",
	"followingLessThanOrEq": "Follows X or fewer accounts",
	"followingMoreThanOrEq": "Follows X or more accounts",
	"notesLessThanOrEq": "Post count is less than/equal to",
	"notesMoreThanOrEq": "Post count is greater than/equal to",
	"and": "AND-Condition",
	"or": "OR-Condition",
	"not": "NOT-Condition",
	"add": "Dodaj"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"isLocal": "Usuário local",
	"isRemote": "Usuário remoto",
	"isSuspended": "Usuário suspenso",
	"isLocked": "Contas privadas",
	"isBot": "Usuários Bot",
	"isCat": "Usuários Gatinho",
	"isExplorable": "Encontrável em \"Explorar\"",
	"roleAssignedTo": "Atribuído a cargos manuais",
	"createdLessThan": "Menos de X passados desde a criação da conta",
	"createdMoreThan": "Mais de X passados desde a criação da conta",
	"followersLessThanOrEq": "Possui X ou menos seguidores",
	"followersMoreThanOrEq": "Possui X ou mais seguidores",
	"followingLessThanOrEq": "Segue X ou menos contas",
	"followingMoreThanOrEq": "Segue X ou mais contas",
	"notesLessThanOrEq": "A quantidade de postagens é menor ou igual a",
	"notesMoreThanOrEq": "A quantidade de postagens é maior ou igual a",
	"and": "~ E ~ (Condicional)",
	"or": "~ OU ~ (Condicional)",
	"not": "Não ~ (Condicional)",
	"add": "Adicionar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"isLocal": "Местный",
	"isRemote": "Неместный",
	"isSuspended": "Suspended user",
	"isLocked": "Private accounts",
	"isBot": "Bot Users",
	"isCat": "Cat Users",
	"isExplorable": "Effective user of \"make an account discoverable\"",
	"roleAssignedTo": "Assigned to manual roles",
	"createdLessThan": "Аккаунт младше, чем...",
	"createdMoreThan": "Аккаунт старше, чем...",
	"followersLessThanOrEq": "Количество подписчиков не превышает…",
	"followersMoreThanOrEq": "Количество подписчиков не меньше чем…",
	"followingLessThanOrEq": "Количество подписок не превышает…",
	"followingMoreThanOrEq": "Количество подписок не меньше чем…",
	"notesLessThanOrEq": "Post count is less than/equal to",
	"notesMoreThanOrEq": "Post count is greater than/equal to",
	"and": "Выполнено несколько условий:..",
	"or": "Выполнено любое из условий:..",
	"not": "Кроме тех, у кого…",
	"add": "Добавить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"isLocal": "Local user",
	"isRemote": "Remote user",
	"isSuspended": "Suspended user",
	"isLocked": "Private accounts",
	"isBot": "Bot Users",
	"isCat": "Cat Users",
	"isExplorable": "Effective user of \"make an account discoverable\"",
	"roleAssignedTo": "Assigned to manual roles",
	"createdLessThan": "Less than X has passed since account creation",
	"createdMoreThan": "More than X has passed since account creation",
	"followersLessThanOrEq": "Has X or fewer followers",
	"followersMoreThanOrEq": "Has X or more followers",
	"followingLessThanOrEq": "Follows X or fewer accounts",
	"followingMoreThanOrEq": "Follows X or more accounts",
	"notesLessThanOrEq": "Post count is less than/equal to",
	"notesMoreThanOrEq": "Post count is greater than/equal to",
	"and": "AND-Condition",
	"or": "OR-Condition",
	"not": "NOT-Condition",
	"add": "Pridať"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"isLocal": "ผู้ใช้ท้องถิ่น",
	"isRemote": "ผู้ใช้ระยะไกล",
	"isSuspended": "ผู้ใช้ที่ถูกระงับ",
	"isLocked": "ผู้ใช้บัญชีไม่เปิดเผยสาธารณะ",
	"isBot": "ผู้ใช้ที่เป็นบอต",
	"isCat": "ผู้ใช้ที่เป็นแมว",
	"isExplorable": "ผู้ใช้ที่เปิดใช้งาน “ทำให้บัญชีของฉันค้นหาได้ง่ายขึ้น”",
	"roleAssignedTo": "มอบหมายให้มีบทบาทแบบทำมือ",
	"createdLessThan": "สร้างน้อยกว่า",
	"createdMoreThan": "สร้างมากกว่า",
	"followersLessThanOrEq": "จำนวนผู้ติดตามน้อยกว่าหรือเท่ากับ\n",
	"followersMoreThanOrEq": "จำนวนผู้ติดตามมากกว่าหรือเท่ากับ\n",
	"followingLessThanOrEq": "จำนวนบัญชีต่อไปนี้คือ น้อยกว่าหรือเท่ากับ",
	"followingMoreThanOrEq": "จำนวนบัญชีต่อไปนี้คือ มากกว่าหรือเท่ากับ",
	"notesLessThanOrEq": "จำนวนโพสต์น้อยกว่าเท่ากับ",
	"notesMoreThanOrEq": "จำนวนโพสต์มากกว่าเท่ากับ",
	"and": "และ",
	"or": "หรือ",
	"not": "ไม่",
	"add": "เพิ่ม"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"isLocal": "Yerel kullanıcı",
	"isRemote": "Uzak kullanıcı",
	"isSuspended": "Askıya alınmış kullanıcı",
	"isLocked": "Özel hesaplar",
	"isBot": "Bot Kullanıcıları",
	"isCat": "Kedi Kullanıcıları",
	"isExplorable": "“Hesabı bulunabilir hale getir” özelliğini etkili bir şekilde kullanan kullanıcı",
	"roleAssignedTo": "Manuel rollere atanmış",
	"createdLessThan": "Hesap oluşturulduktan sonra X'ten az zaman geçti.",
	"createdMoreThan": "Hesap oluşturulmasından bu yana X'ten fazla zaman geçti.",
	"followersLessThanOrEq": "X veya daha az takipçisi var",
	"followersMoreThanOrEq": "X veya daha fazla takipçisi var",
	"followingLessThanOrEq": "X veya daha az sayıda hesabı takip ediyor",
	"followingMoreThanOrEq": "X veya daha fazla hesabı takip ediyor",
	"notesLessThanOrEq": "Gönderi sayısı şundan az/eşit",
	"notesMoreThanOrEq": "Gönderi sayısı şundan büyük/eşit",
	"and": "Koşul-AND",
	"or": "Koşul-QR",
	"not": "Koşul-NOT",
	"add": "Ekle"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"isLocal": "Local user",
	"isRemote": "Remote user",
	"isSuspended": "Suspended user",
	"isLocked": "Private accounts",
	"isBot": "Bot Users",
	"isCat": "Cat Users",
	"isExplorable": "Effective user of \"make an account discoverable\"",
	"roleAssignedTo": "Assigned to manual roles",
	"createdLessThan": "Less than X has passed since account creation",
	"createdMoreThan": "More than X has passed since account creation",
	"followersLessThanOrEq": "Has X or fewer followers",
	"followersMoreThanOrEq": "Has X or more followers",
	"followingLessThanOrEq": "Follows X or fewer accounts",
	"followingMoreThanOrEq": "Follows X or more accounts",
	"notesLessThanOrEq": "Post count is less than/equal to",
	"notesMoreThanOrEq": "Post count is greater than/equal to",
	"and": "AND-Condition",
	"or": "OR-Condition",
	"not": "NOT-Condition",
	"add": "Add"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"isLocal": "Local user",
	"isRemote": "Remote user",
	"isSuspended": "Suspended user",
	"isLocked": "Private accounts",
	"isBot": "Bot Users",
	"isCat": "Cat Users",
	"isExplorable": "Effective user of \"make an account discoverable\"",
	"roleAssignedTo": "Assigned to manual roles",
	"createdLessThan": "Less than X has passed since account creation",
	"createdMoreThan": "More than X has passed since account creation",
	"followersLessThanOrEq": "Has X or fewer followers",
	"followersMoreThanOrEq": "Has X or more followers",
	"followingLessThanOrEq": "Follows X or fewer accounts",
	"followingMoreThanOrEq": "Follows X or more accounts",
	"notesLessThanOrEq": "Post count is less than/equal to",
	"notesMoreThanOrEq": "Post count is greater than/equal to",
	"and": "AND-Condition",
	"or": "OR-Condition",
	"not": "NOT-Condition",
	"add": "Додати"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"isLocal": "Local user",
	"isRemote": "Remote user",
	"isSuspended": "Suspended user",
	"isLocked": "Private accounts",
	"isBot": "Bot Users",
	"isCat": "Cat Users",
	"isExplorable": "Effective user of \"make an account discoverable\"",
	"roleAssignedTo": "Assigned to manual roles",
	"createdLessThan": "Less than X has passed since account creation",
	"createdMoreThan": "Trôi qua ～ sau khi lập tài khoản",
	"followersLessThanOrEq": "Người theo dõi ít hơn ～",
	"followersMoreThanOrEq": "Người theo dõi có ～ trở lên",
	"followingLessThanOrEq": "Theo dõi ít hơn ～",
	"followingMoreThanOrEq": "Theo dõi có ～ trở lên",
	"notesLessThanOrEq": "Post count is less than/equal to",
	"notesMoreThanOrEq": "Post count is greater than/equal to",
	"and": "～ mà ～",
	"or": "～ hay là ～",
	"not": "Không phải ～",
	"add": "Thêm"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"isLocal": "是本地用户",
	"isRemote": "是远程用户",
	"isSuspended": "停用的用户",
	"isLocked": "锁推用户",
	"isBot": "机器人用户",
	"isCat": "猫猫用户",
	"isExplorable": "启用 “使账号可见” 的用户",
	"roleAssignedTo": "已分配给手动角色",
	"createdLessThan": "账户创建时间少于",
	"createdMoreThan": "账户创建时间超过",
	"followersLessThanOrEq": "关注者不多于",
	"followersMoreThanOrEq": "关注者不少于",
	"followingLessThanOrEq": "关注人数不多于",
	"followingMoreThanOrEq": "关注人数不少于",
	"notesLessThanOrEq": "帖子数在～以下",
	"notesMoreThanOrEq": "帖子数在～以上",
	"and": "符合以下全部条件",
	"or": "符合以下任一条件",
	"not": "不符合以下任何条件",
	"add": "添加"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"isLocal": "本地使用者",
	"isRemote": "遠端使用者",
	"isSuspended": "被停權的使用者",
	"isLocked": "上鎖的使用者",
	"isBot": "機器人使用者",
	"isCat": "貓使用者",
	"isExplorable": "開啟了「使您的帳戶更容易被找到」功能的使用者",
	"roleAssignedTo": "手動指派角色完成",
	"createdLessThan": "帳戶加入時間不超過",
	"createdMoreThan": "帳戶加入時間已超過",
	"followersLessThanOrEq": "追隨者人數在～以下",
	"followersMoreThanOrEq": "追隨者人數在～以上",
	"followingLessThanOrEq": "追隨人數在～以下",
	"followingMoreThanOrEq": "追隨人數在～以上",
	"notesLessThanOrEq": "貼文數在～以下",
	"notesMoreThanOrEq": "貼文數在～以上",
	"and": "～及～",
	"or": "～或～",
	"not": "～否",
	"add": "新增"
}
</locale>
