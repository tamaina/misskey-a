<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInput v-if="readonly && role.id != null" :modelValue="role.id" :readonly="true">
		<template #label>ID</template>
	</MkInput>

	<MkInput v-model="role.name" :readonly="readonly">
		<template #label>{{ $locale.sfc.roleName }}</template>
	</MkInput>

	<MkTextarea v-model="role.description" :readonly="readonly">
		<template #label>{{ $locale.sfc.roleDescription }}</template>
	</MkTextarea>

	<MkColorInput v-model="role.color">
		<template #label>{{ $locale.sfc.color }}</template>
	</MkColorInput>

	<MkInput v-model="role.iconUrl" type="url">
		<template #label>{{ $locale.sfc.roleIconUrl }}</template>
	</MkInput>

	<MkInput v-model="role.displayOrder" type="number">
		<template #label>{{ $locale.sfc.roleDisplayOrder }}</template>
		<template #caption>{{ $locale.sfc.roleDescriptionOfDisplayOrder }}</template>
	</MkInput>

	<MkSelect v-model="rolePermission" :items="rolePermissionDef" :readonly="readonly">
		<template #label><i class="ti ti-shield-lock"></i> {{ $locale.sfc.rolePermission }}</template>
		<template #caption><div v-html="$locale.sfc.roleDescriptionOfPermission.replaceAll('\n', '<br>')"></div></template>
	</MkSelect>

	<MkSelect v-model="role.target" :items="[{ label: $locale.sfc.roleManual, value: 'manual' }, { label: $locale.sfc.roleConditional, value: 'conditional' }]" :readonly="readonly">
		<template #label><i class="ti ti-users"></i> {{ $locale.sfc.roleAssignTarget }}</template>
		<template #caption><div v-html="$locale.sfc.roleDescriptionOfAssignTarget.replaceAll('\n', '<br>')"></div></template>
	</MkSelect>

	<MkFolder v-if="role.target === 'conditional'" defaultOpen>
		<template #label>{{ $locale.sfc.roleCondition }}</template>
		<div class="_gaps">
			<RolesEditorFormula v-model="role.condFormula"/>
		</div>
	</MkFolder>

	<MkSwitch v-model="role.preserveAssignmentOnMoveAccount" :readonly="readonly">
		<template #label>{{ $locale.sfc.rolePreserveAssignmentOnMoveAccount }}</template>
		<template #caption>{{ $locale.sfc.rolePreserveAssignmentOnMoveAccount_description }}</template>
	</MkSwitch>

	<MkSwitch v-model="role.canEditMembersByModerator" :readonly="readonly">
		<template #label>{{ $locale.sfc.roleCanEditMembersByModerator }}</template>
		<template #caption>{{ $locale.sfc.roleDescriptionOfCanEditMembersByModerator }}</template>
	</MkSwitch>

	<MkSwitch v-model="role.isPublic" :readonly="readonly">
		<template #label>{{ $locale.sfc.roleIsPublic }}</template>
		<template #caption>{{ $locale.sfc.roleDescriptionOfIsPublic }}</template>
	</MkSwitch>

	<MkSwitch v-model="role.asBadge" :readonly="readonly">
		<template #label>{{ $locale.sfc.roleAsBadge }}</template>
		<template #caption>{{ $locale.sfc.roleDescriptionOfAsBadge }}</template>
	</MkSwitch>

	<MkSwitch v-model="role.isExplorable" :readonly="readonly">
		<template #label>{{ $locale.sfc.roleIsExplorable }}</template>
		<template #caption>{{ $locale.sfc.roleDescriptionOfIsExplorable }}</template>
	</MkSwitch>

	<FormSlot>
		<template #label><i class="ti ti-license"></i> {{ $locale.sfc.rolePolicies }}</template>
		<div class="_gaps_s">
			<MkInput v-model="q" type="search">
				<template #prefix><i class="ti ti-search"></i></template>
			</MkInput>

			<XPolicyEditor
				v-model:rolePolicies="rolePolicyValues"
				v-model:policiesMeta="rolePolicyMeta"
				:isBaseRole="false"
				:roleQuery="q"
				:readonly="readonly"
			/>
		</div>
	</FormSlot>
</div>
</template>

<script lang="ts" setup>
import { watch, ref, computed } from 'vue';
import { throttle } from 'throttle-debounce';
import * as Misskey from 'misskey-js';
import RolesEditorFormula from '@features/roles/frontend/pages/admin/RolesEditorFormula.vue';
import type { MkSelectItem, GetMkSelectValueTypesFromDef } from '@features/ui/frontend/components/MkSelect.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkColorInput from '@features/ui/frontend/components/MkColorInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import FormSlot from '@features/ui/frontend/components/form/slot.vue';
import XPolicyEditor from '@features/roles/frontend/pages/admin/roles.policy-editor.vue';
import { instance } from '@features/instance/frontend/instance.js';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';
import type { PolicyMeta } from '@features/roles/frontend/pages/admin/roles.policy-editor.vue';

type RoleLike = Pick<Misskey.entities.Role, 'name' | 'description' | 'isAdministrator' | 'isModerator' | 'color' | 'iconUrl' | 'target' | 'isPublic' | 'isExplorable' | 'asBadge' | 'canEditMembersByModerator' | 'displayOrder' | 'preserveAssignmentOnMoveAccount'> & {
	id?: Misskey.entities.Role['id'] | null;
	condFormula: any;
	policies: any;
};

const emit = defineEmits<{
	(ev: 'update:modelValue', v: RoleLike): void;
}>();

const props = defineProps<{
	modelValue: RoleLike;
	readonly?: boolean;
}>();

const role = ref((() => {
	const base = deepClone(props.modelValue);
	// fill missing policy
	for (const ROLE_POLICY of Misskey.rolePolicies) {
		if (base.policies[ROLE_POLICY] == null) {
			base.policies[ROLE_POLICY] = {
				useDefault: true,
				priority: 0,
				value: instance.policies[ROLE_POLICY],
			};
		}
	}
	return base;
})());
const rolePolicyValues = computed<any>({
	get: () => {
		return Object.fromEntries(
			Object.entries(role.value.policies).map(([k, v]) => [k, (v as { value: unknown }).value]),
		);
	},
	set: (v) => {
		for (const [k, val] of Object.entries(v)) {
			if (role.value.policies[k] != null) {
				role.value.policies[k].value = val;
			}
		}
	},
});
const rolePolicyMeta = computed<any>({
	get: () => {
		return Object.fromEntries(
			Object.entries(role.value.policies).map(([k, v]) => [k, {
				useDefault: (v as PolicyMeta).useDefault,
				priority: (v as PolicyMeta).priority,
			}]),
		);
	},
	set: (v: Record<string, PolicyMeta>) => {
		for (const [k, val] of Object.entries(v)) {
			if (role.value.policies[k] != null) {
				role.value.policies[k].useDefault = val.useDefault;
				role.value.policies[k].priority = val.priority;
			}
		}
	},
});

const rolePermissionDef = [
	{ label: $locale.value.sfc.normalUser, value: 'normal' },
	{ label: $locale.value.sfc.moderator, value: 'moderator' },
	{ label: $locale.value.sfc.administrator, value: 'administrator' },
] as const satisfies MkSelectItem[];

const rolePermission = computed<GetMkSelectValueTypesFromDef<typeof rolePermissionDef>>({
	get: () => role.value.isAdministrator ? 'administrator' : role.value.isModerator ? 'moderator' : 'normal',
	set: (val) => {
		role.value.isAdministrator = (val === 'administrator');
		role.value.isModerator = (val === 'moderator');
	},
});

const q = ref('');

const save = throttle(100, () => {
	const data = {
		name: role.value.name,
		description: role.value.description,
		color: role.value.color === '' ? null : role.value.color,
		iconUrl: role.value.iconUrl === '' ? null : role.value.iconUrl,
		displayOrder: role.value.displayOrder,
		target: role.value.target,
		condFormula: role.value.condFormula,
		isAdministrator: role.value.isAdministrator,
		isModerator: role.value.isModerator,
		isPublic: role.value.isPublic,
		isExplorable: role.value.isExplorable,
		asBadge: role.value.asBadge,
		canEditMembersByModerator: role.value.canEditMembersByModerator,
		preserveAssignmentOnMoveAccount: role.value.preserveAssignmentOnMoveAccount,
		policies: role.value.policies,
	};

	emit('update:modelValue', data);
});

watch(role, save, { deep: true });
</script>

<locale lang="json" locale="ar-SA">
{
	"roleName": "اسم الدور",
	"roleDescription": "وصف الدور",
	"color": "اللون",
	"roleIconUrl": "Icon URL",
	"roleDisplayOrder": "Position",
	"roleDescriptionOfDisplayOrder": "The higher the number, the higher its UI position.",
	"rolePermission": "أذونات الدور",
	"roleDescriptionOfPermission": "<b>Moderators</b> can perform basic moderation operations.\n<b>Administrators</b> can change all settings of the instance.",
	"roleManual": "Manual",
	"roleConditional": "Conditional",
	"roleAssignTarget": "نوع الإسناد",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> to manually change who is part of this role and who is not.\n<b>Conditional</b> to have users be automatically assigned and removed from this role based on a condition.",
	"roleCondition": "الشرط",
	"rolePreserveAssignmentOnMoveAccount": "Preserve role assignment during migration",
	"rolePreserveAssignmentOnMoveAccount_description": "When turned on, this role will be carried over to the destination account when an account with this role is migrated.",
	"roleCanEditMembersByModerator": "Allow moderators to edit the list of members for this role",
	"roleDescriptionOfCanEditMembersByModerator": "When turned on, moderators as well as administrators will be able to assign and unassign users to this role. When turned off, only administrators will be able to assign users.",
	"roleIsPublic": "Public role",
	"roleDescriptionOfIsPublic": "This role will be displayed in the profiles of assigned users.",
	"roleAsBadge": "Show as badge",
	"roleDescriptionOfAsBadge": "This role's icon will be displayed next to the username of users with this role if turned on.",
	"roleIsExplorable": "Make role explorable",
	"roleDescriptionOfIsExplorable": "This role's timeline and the list of users with this will be made public if enabled.",
	"rolePolicies": "السياسة العامة",
	"normalUser": "مستخدم عادي",
	"moderator": "مشرِف",
	"administrator": "المدير"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"roleName": "Nom del rol",
	"roleDescription": "Descripció del rol",
	"color": "Color",
	"roleIconUrl": "URL de la icona ",
	"roleDisplayOrder": "Posició ",
	"roleDescriptionOfDisplayOrder": "Com més gran és el número, més dalt la seva posició a la interfície.",
	"rolePermission": "Permisos de rol",
	"roleDescriptionOfPermission": "Els <b>Moderadors</b> poden fer operacions bàsiques de moderació.\nEls <b>Administradors</b> poden canviar tots els ajustos del servidor.",
	"roleManual": "Manual",
	"roleConditional": "Condicional",
	"roleAssignTarget": "Assignar ",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> per canviar manualment qui és part d'aquest rol i qui no.\n<b>Condicional</b> per afegir o eliminar de manera automàtica els usuaris d'aquest rol basat en una determinada condició.",
	"roleCondition": "Condició",
	"rolePreserveAssignmentOnMoveAccount": "L'estat de l'assignació també es trasllada amb el compte migrat",
	"rolePreserveAssignmentOnMoveAccount_description": "Si s'activa quan es migra un compte amb aquest rol, el compte migrat també heretarà aquest rol.",
	"roleCanEditMembersByModerator": "Permetre que els moderadors editin la llista d'usuaris en aquest rol",
	"roleDescriptionOfCanEditMembersByModerator": "Quan s'activa, els moderadors, així com els administradors, podran afegir i treure usuaris d'aquest rol. Si es troba desactivat, només els administradors poden assignar usuaris.",
	"roleIsPublic": "Rol públic",
	"roleDescriptionOfIsPublic": "Aquest rol es mostrarà al perfil dels usuaris al que se'ls assigni.",
	"roleAsBadge": "Mostrar com a insígnia ",
	"roleDescriptionOfAsBadge": "La icona d'aquest rol es mostrarà al costat dels noms d'usuaris que tinguin assignats aquest rol.",
	"roleIsExplorable": "Fer el rol explorable",
	"roleDescriptionOfIsExplorable": "La línia de temps d'aquest rol i la llista d'usuaris seran públics si s'activa.",
	"rolePolicies": "Polítiques",
	"normalUser": "Usuari normal",
	"moderator": "Moderador/a",
	"administrator": "Administrador/a"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"roleName": "Název role",
	"roleDescription": "Popis role",
	"color": "Barva",
	"roleIconUrl": "URL ikony",
	"roleDisplayOrder": "Pozice",
	"roleDescriptionOfDisplayOrder": "Čím vyšší číslo, tím vyšší pozice v uživatelském rozhraní.",
	"rolePermission": "Oprávnění role",
	"roleDescriptionOfPermission": "<b>Moderators</b> může provádět základní operace moderování.\n<b>Administrators</b> může měnit všechna nastavení instance.",
	"roleManual": "Dokumentace",
	"roleConditional": "Podmíněné",
	"roleAssignTarget": "Přiřadit",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> ručně změnit, kdo je součástí této role a kdo ne.\n<b>Conditional</b> mít uživatelé automaticky přiřazováni a odebíráni z této role na základě podmínky.",
	"roleCondition": "Podmínky",
	"rolePreserveAssignmentOnMoveAccount": "Preserve role assignment during migration",
	"rolePreserveAssignmentOnMoveAccount_description": "When turned on, this role will be carried over to the destination account when an account with this role is migrated.",
	"roleCanEditMembersByModerator": "Umožnit moderátorům upravovat seznam členů pro tuto roli",
	"roleDescriptionOfCanEditMembersByModerator": "Po zapnutí této role budou moci moderátoři i administrátoři přiřazovat a odebírat uživatele do této role. Pokud je tato funkce vypnutá, budou moci uživatele přiřazovat pouze správci.",
	"roleIsPublic": "Veřejná role",
	"roleDescriptionOfIsPublic": "Tato role se zobrazí v profilech přiřazených uživatelů.",
	"roleAsBadge": "Zobrazovat jako odznak",
	"roleDescriptionOfAsBadge": "Ikona této role se zobrazí vedle uživatelského jména uživatelů s touto rolí, pokud je zapnuta.",
	"roleIsExplorable": "Udělat roli objevitelnou",
	"roleDescriptionOfIsExplorable": "Časová osa této role a seznam uživatelů s touto rolí budou zveřejněny, pokud jsou povoleny.",
	"rolePolicies": "Zásady",
	"normalUser": "Normální uživatel",
	"moderator": "Moderátor",
	"administrator": "Administrátor"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"roleName": "Role name",
	"roleDescription": "Role description",
	"color": "Color",
	"roleIconUrl": "Icon URL",
	"roleDisplayOrder": "Position",
	"roleDescriptionOfDisplayOrder": "The higher the number, the higher its UI position.",
	"rolePermission": "Role permissions",
	"roleDescriptionOfPermission": "<b>Moderators</b> can perform basic moderation operations.\n<b>Administrators</b> can change all settings of the instance.",
	"roleManual": "Manual",
	"roleConditional": "Conditional",
	"roleAssignTarget": "Assignment type",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> to manually change who is part of this role and who is not.\n<b>Conditional</b> to have users be automatically assigned and removed from this role based on a condition.",
	"roleCondition": "Condition",
	"rolePreserveAssignmentOnMoveAccount": "Preserve role assignment during migration",
	"rolePreserveAssignmentOnMoveAccount_description": "When turned on, this role will be carried over to the destination account when an account with this role is migrated.",
	"roleCanEditMembersByModerator": "Allow moderators to edit the list of members for this role",
	"roleDescriptionOfCanEditMembersByModerator": "When turned on, moderators as well as administrators will be able to assign and unassign users to this role. When turned off, only administrators will be able to assign users.",
	"roleIsPublic": "Public role",
	"roleDescriptionOfIsPublic": "This role will be displayed in the profiles of assigned users.",
	"roleAsBadge": "Show as badge",
	"roleDescriptionOfAsBadge": "This role's icon will be displayed next to the username of users with this role if turned on.",
	"roleIsExplorable": "Make role explorable",
	"roleDescriptionOfIsExplorable": "This role's timeline and the list of users with this will be made public if enabled.",
	"rolePolicies": "Policies",
	"normalUser": "Normal user",
	"moderator": "Moderator",
	"administrator": "Administrator"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"roleName": "Rollenname",
	"roleDescription": "Rollenbeschreibung",
	"color": "Farbe",
	"roleIconUrl": "Icon-URL",
	"roleDisplayOrder": "Position",
	"roleDescriptionOfDisplayOrder": "Je höher die Nummer, desto höher die UI-Position.",
	"rolePermission": "Rollenberechtigungen",
	"roleDescriptionOfPermission": "<b>Moderatoren</b> können grundlegende Verwaltungsaufgaben erledigen.\n<b>Administratoren</b> können alle Einstellungen der Instanz verwalten.",
	"roleManual": "Manuell",
	"roleConditional": "Konditional",
	"roleAssignTarget": "Zuweisungsart",
	"roleDescriptionOfAssignTarget": "<b>Manuell</b> bedeutet, dass die Liste der Benutzer einer Rolle manuell verwaltet wird.\n<b>Konditional</b> bedeutet, dass die Liste der Benutzer einer Rolle durch eine Bedingung automatisch verwaltet wird.",
	"roleCondition": "Bedingung",
	"rolePreserveAssignmentOnMoveAccount": "Rolle übertragbar machen",
	"rolePreserveAssignmentOnMoveAccount_description": "Wenn diese Option aktiviert ist, wird diese Rolle bei der Migration mit übertragen.",
	"roleCanEditMembersByModerator": "Moderatoren können Benutzern diese Rolle zuweisen",
	"roleDescriptionOfCanEditMembersByModerator": "Wenn aktiviert, so können Moderatoren und Adminstratoren anderen Benutzern diese Rolle zuweisen bzw. diese Zuweisung aufheben. Wenn deaktiviert, so ist es nur Administratoren möglich, Zuweisungen dieser Rolle zu verwalten.",
	"roleIsPublic": "Öffentliche Rolle",
	"roleDescriptionOfIsPublic": "Diese Rolle wird im Profil zugewiesener Benutzer angezeigt.",
	"roleAsBadge": "Als Abzeichen anzeigen",
	"roleDescriptionOfAsBadge": "Ist dies aktiviert, so wird das Icon dieser Rolle an der Seite der Namen von Benutzern mit dieser Rolle angezeigt.",
	"roleIsExplorable": "Benutzerliste veröffentlichen",
	"roleDescriptionOfIsExplorable": "Ist dies aktiviert, so ist die Chronik dieser Rolle, sowie eine Liste der Benutzer mit dieser Rolle, frei zugänglich.",
	"rolePolicies": "Richtlinien",
	"normalUser": "Standardbenutzer",
	"moderator": "Moderator",
	"administrator": "Administrator"
}
</locale>

<locale lang="json" locale="en-US">
{
	"roleName": "Role name",
	"roleDescription": "Role description",
	"color": "Color",
	"roleIconUrl": "Icon URL",
	"roleDisplayOrder": "Position",
	"roleDescriptionOfDisplayOrder": "The higher the number, the higher its UI position.",
	"rolePermission": "Role permissions",
	"roleDescriptionOfPermission": "<b>Moderators</b> can perform basic moderation operations.\n<b>Administrators</b> can change all settings of the instance.",
	"roleManual": "Manual",
	"roleConditional": "Conditional",
	"roleAssignTarget": "Assignment type",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> to manually change who is part of this role and who is not.\n<b>Conditional</b> to have users be automatically assigned and removed from this role based on a condition.",
	"roleCondition": "Condition",
	"rolePreserveAssignmentOnMoveAccount": "Preserve role assignment during migration",
	"rolePreserveAssignmentOnMoveAccount_description": "When turned on, this role will be carried over to the destination account when an account with this role is migrated.",
	"roleCanEditMembersByModerator": "Allow moderators to edit the list of members for this role",
	"roleDescriptionOfCanEditMembersByModerator": "When turned on, moderators as well as administrators will be able to assign and unassign users to this role. When turned off, only administrators will be able to assign users.",
	"roleIsPublic": "Public role",
	"roleDescriptionOfIsPublic": "This role will be displayed in the profiles of assigned users.",
	"roleAsBadge": "Show as badge",
	"roleDescriptionOfAsBadge": "This role's icon will be displayed next to the username of users with this role if turned on.",
	"roleIsExplorable": "Make role explorable",
	"roleDescriptionOfIsExplorable": "This role's timeline and the list of users with this will be made public if enabled.",
	"rolePolicies": "Policies",
	"normalUser": "Normal user",
	"moderator": "Moderator",
	"administrator": "Administrator"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"roleName": "Nombre del rol",
	"roleDescription": "Descripción del rol",
	"color": "Color",
	"roleIconUrl": "URL del ícono",
	"roleDisplayOrder": "Posición",
	"roleDescriptionOfDisplayOrder": "Entre más alto el número, mayor es la posición en la interfaz.",
	"rolePermission": "Permisos del rol",
	"roleDescriptionOfPermission": "<b>Moderador</b> Te permite ejecutar acciones básicas de moderación.\n<b>Administradores</b> puede cambiar todas las configuraciones de la instancia.",
	"roleManual": "manual",
	"roleConditional": "condicional",
	"roleAssignTarget": "Asignar objetivo",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> Para cambiar manualmente lo que se incluye en este rol.\n<b>Condicional</b> configura una condición, y los usuarios que cumplan la condición serán incluídos automáticamente.",
	"roleCondition": "condición",
	"rolePreserveAssignmentOnMoveAccount": "Preservar los roles asignados durante la migración",
	"rolePreserveAssignmentOnMoveAccount_description": "Si está activada, este rol se transferirá a la cuenta de destino cuando se migre una cuenta con este rol.",
	"roleCanEditMembersByModerator": "Permitir a los moderadores editar los miembros",
	"roleDescriptionOfCanEditMembersByModerator": "Si se activa, los moderadores, al igual que los administradores, serán capaces de asignar/quitar usuarios a éste rol. Si se desactiva, sólo los administradores podrán hacerlo.",
	"roleIsPublic": "Publicar rol",
	"roleDescriptionOfIsPublic": "Cualquiera puede ver los usuarios asignados a este rol. También, el perfil del usuario mostrará este rol.",
	"roleAsBadge": "Mostrar como emblema",
	"roleDescriptionOfAsBadge": "Este ícono de rol se mostrará a lado del nombre de usuario cuando este rol se encuentre activo.",
	"roleIsExplorable": "Hacer el rol explorable",
	"roleDescriptionOfIsExplorable": "La línea de tiempo de éste rol y la lista de usuarios serán públicos si se activa..",
	"rolePolicies": "Política",
	"normalUser": "Usuario normal",
	"moderator": "Moderador",
	"administrator": "Administrador"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"roleName": "Nom du rôle",
	"roleDescription": "Description du rôle",
	"color": "Couleur",
	"roleIconUrl": "URL de l’icône",
	"roleDisplayOrder": "Classement",
	"roleDescriptionOfDisplayOrder": "The higher the number, the higher its UI position.",
	"rolePermission": "Autorisations du rôle",
	"roleDescriptionOfPermission": "<b>Moderators</b> can perform basic moderation operations.\n<b>Administrators</b> can change all settings of the instance.",
	"roleManual": "Manuel",
	"roleConditional": "Conditionnel",
	"roleAssignTarget": "Attribuer",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> to manually change who is part of this role and who is not.\n<b>Conditional</b> to have users be automatically assigned and removed from this role based on a condition.",
	"roleCondition": "Condition",
	"rolePreserveAssignmentOnMoveAccount": "Preserve role assignment during migration",
	"rolePreserveAssignmentOnMoveAccount_description": "When turned on, this role will be carried over to the destination account when an account with this role is migrated.",
	"roleCanEditMembersByModerator": "Allow moderators to edit the list of members for this role",
	"roleDescriptionOfCanEditMembersByModerator": "When turned on, moderators as well as administrators will be able to assign and unassign users to this role. When turned off, only administrators will be able to assign users.",
	"roleIsPublic": "Rôle public",
	"roleDescriptionOfIsPublic": "This role will be displayed in the profiles of assigned users.",
	"roleAsBadge": "Show as badge",
	"roleDescriptionOfAsBadge": "This role's icon will be displayed next to the username of users with this role if turned on.",
	"roleIsExplorable": "Make role explorable",
	"roleDescriptionOfIsExplorable": "This role's timeline and the list of users with this will be made public if enabled.",
	"rolePolicies": "Stratégies",
	"normalUser": "Simple utilisateur·rice",
	"moderator": "Modérateur·rice·s",
	"administrator": "Administrateur"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"roleName": "Nama peran",
	"roleDescription": "Deskripsi peran",
	"color": "Warna",
	"roleIconUrl": "URL ikon",
	"roleDisplayOrder": "Urutan",
	"roleDescriptionOfDisplayOrder": "Semakin tinggi angka, semakin tinggi posisi antarmukanya.",
	"rolePermission": "Perijinan peran",
	"roleDescriptionOfPermission": "<b>Moderator</b> dapat melakukan operasi moderasi dasar.\n<b>Administrator</b> dapat mengubah seluruh pengaturan instansi.",
	"roleManual": "Manual",
	"roleConditional": "Kondisional",
	"roleAssignTarget": "Tipe tugas",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> untuk mengganti secara manual siapa yang mendapatkan peran ini dan siapa yang tidak.\n<b>Kondisional</b> untuk pengguna secara otomatis dimasukkan atau dihapus dari peran berdasarkan kondisi yang ditentukan.",
	"roleCondition": "Kondisi",
	"rolePreserveAssignmentOnMoveAccount": "Preserve role assignment during migration",
	"rolePreserveAssignmentOnMoveAccount_description": "When turned on, this role will be carried over to the destination account when an account with this role is migrated.",
	"roleCanEditMembersByModerator": "Perbolehkan moderator untuk menyunting daftar anggota untuk peran ini",
	"roleDescriptionOfCanEditMembersByModerator": "Ketika dinyalakan, moderator beserta administrator dapat menugaskan ataupun mencabut pengguna ke peran ini. Ketika dimatikan, hanya administrator saja yang dapat menugaskan pengguna ke peran ini.",
	"roleIsPublic": "Publikkan Peran",
	"roleDescriptionOfIsPublic": "Siapapun dapat melihat daftar pengguna yang ditugaskan pada peran ini. Tambahan juga peran ini akan ditampilkan ke dalam profil pengguna tentang peran yang ditugaskan.",
	"roleAsBadge": "Tampilkan sebagai lencana",
	"roleDescriptionOfAsBadge": "Ikon peran ini akan ditampilkan bersebelahan dengan username pengguna yang memiliki peran ini jika dinyalakan.",
	"roleIsExplorable": "Buat peran dapat terjelajahi",
	"roleDescriptionOfIsExplorable": "Lini masa peran ini dan daftar pengguna dengan peran ini akan dibuat publik apabila dinyalakan.",
	"rolePolicies": "Kebijakan",
	"normalUser": "Pengguna umum",
	"moderator": "Moderator",
	"administrator": "Admin"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"roleName": "Nome del ruolo",
	"roleDescription": "Descrizione del ruolo",
	"color": "Colore",
	"roleIconUrl": "URL dell'icona",
	"roleDisplayOrder": "Ordine di visualizzazione",
	"roleDescriptionOfDisplayOrder": "I valori più alti vengono visualizzati per primi",
	"rolePermission": "Permessi globali del ruolo",
	"roleDescriptionOfPermission": "<b>Moderatori</b> possono svolgere le attività di moderazione basilari.\n<b>Amministratori</b> possono modificare la configurazione dell'istanza.",
	"roleManual": "Manuale",
	"roleConditional": "Condizionale",
	"roleAssignTarget": "Modalità di assegnazione del ruolo",
	"roleDescriptionOfAssignTarget": "<b>Manuale</b>: per assegnare manualmente questo ruolo ai profili.\n<b>Condizionale</b>: per assegnare o rimuovere automaticamente questo ruolo ai profili, a precise condizioni.",
	"roleCondition": "Condizioni",
	"rolePreserveAssignmentOnMoveAccount": "Mantenere l'assegnazione alla migrazione del profilo",
	"rolePreserveAssignmentOnMoveAccount_description": "Attivando, il ruolo verrà portato sul profilo destinatario, durante la migrazione.",
	"roleCanEditMembersByModerator": "Anche i Moderatori assegnano profili a questo ruolo",
	"roleDescriptionOfCanEditMembersByModerator": "Se disattivo, potranno farlo solamente gli Amministratori.",
	"roleIsPublic": "Ruolo pubblico",
	"roleDescriptionOfIsPublic": "La lista di profili assegnati a questo ruolo è visibile a chiunque. Inoltre, il nome del ruolo verrà mostrato pubblicamente nei relativi profili.",
	"roleAsBadge": "Mostra come badge",
	"roleDescriptionOfAsBadge": "Se indicato, accanto al nome utente viene visualizzata l'icona del ruolo.",
	"roleIsExplorable": "La timeline del ruolo è pubblica",
	"roleDescriptionOfIsExplorable": "Selezionandolo, la timeline del ruolo diventerà accessibile pubblicamente. Tranne se il ruolo non è pubblico.",
	"rolePolicies": "Policy",
	"normalUser": "Profilo standard",
	"moderator": "Moderatore",
	"administrator": "Amministratore"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"roleName": "ロール名",
	"roleDescription": "ロールの説明",
	"color": "色",
	"roleIconUrl": "アイコン画像のURL",
	"roleDisplayOrder": "表示順",
	"roleDescriptionOfDisplayOrder": "数値が大きいほどUI上で先頭に表示されます。",
	"rolePermission": "ロールの権限",
	"roleDescriptionOfPermission": "<b>モデレーター</b>は基本的なモデレーションに関する操作を行えます。\n<b>管理者</b>はサーバーの全ての設定を変更できます。",
	"roleManual": "マニュアル",
	"roleConditional": "コンディショナル",
	"roleAssignTarget": "アサイン",
	"roleDescriptionOfAssignTarget": "<b>マニュアル</b>は誰がこのロールに含まれるかを手動で管理します。\n<b>コンディショナル</b>は条件を設定し、それに合致するユーザーが自動で含まれるようになります。",
	"roleCondition": "条件",
	"rolePreserveAssignmentOnMoveAccount": "アサイン状態を移行先アカウントにも引き継ぐ",
	"rolePreserveAssignmentOnMoveAccount_description": "オンにすると、このロールが付与されたアカウントが移行された際に、移行先アカウントにもこのロールが引き継がれるようになります。",
	"roleCanEditMembersByModerator": "モデレーターのメンバー編集を許可",
	"roleDescriptionOfCanEditMembersByModerator": "オンにすると、管理者に加えてモデレーターもこのロールへユーザーをアサイン/アサイン解除できるようになります。オフにすると管理者のみが行えます。",
	"roleIsPublic": "公開ロール",
	"roleDescriptionOfIsPublic": "ユーザーのプロフィールでこのロールが表示されます。",
	"roleAsBadge": "バッジとして表示",
	"roleDescriptionOfAsBadge": "オンにすると、ユーザー名の横にロールのアイコンが表示されます。",
	"roleIsExplorable": "ユーザーを見つけやすくする",
	"roleDescriptionOfIsExplorable": "オンにすると、「みつける」でメンバー一覧が公開されるほか、ロールのタイムラインが利用可能になります。",
	"rolePolicies": "ポリシー",
	"normalUser": "一般ユーザー",
	"moderator": "モデレーター",
	"administrator": "管理者"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"roleName": "ロール名",
	"roleDescription": "ロールの説明",
	"color": "色",
	"roleIconUrl": "アイコン画像のURL",
	"roleDisplayOrder": "表示順",
	"roleDescriptionOfDisplayOrder": "数がでかいほど、UI上で先に表示されるで。",
	"rolePermission": "ロールの権限",
	"roleDescriptionOfPermission": "<b>モデレーター</b>は基本的なモデレーションに関わる操作を行えるで。\n<b>管理者</b>はサーバーの全ての設定を変更できるで。",
	"roleManual": "マニュアル",
	"roleConditional": "コンディショナル",
	"roleAssignTarget": "アサイン",
	"roleDescriptionOfAssignTarget": "<b>マニュアル</b>は誰がこのロールに含まれてるかを手動で管理するで。\n<b>コンディショナル</b>は条件を設定して、それに合うユーザーが自動で含まれるようになるで。",
	"roleCondition": "条件",
	"rolePreserveAssignmentOnMoveAccount": "アサイン状態を移行先アカウントにも引き継ぐ",
	"rolePreserveAssignmentOnMoveAccount_description": "つけると、このロールがのっかったアカウントが引っ越したときに、引っ越し先アカウントにもこのロールがのっかるようになるで。",
	"roleCanEditMembersByModerator": "モデレーターがメンバーいじるのを許す",
	"roleDescriptionOfCanEditMembersByModerator": "オンにすると、管理者だけやなくてモデレーターもこのロールにユーザーを入れたり抜いたりできるで。オフにすると管理者だけしかやれへんくなるで。",
	"roleIsPublic": "ロールを公開",
	"roleDescriptionOfIsPublic": "プロフィールでこのロールが出されるで。",
	"roleAsBadge": "バッジとして見せる",
	"roleDescriptionOfAsBadge": "オンにすると、ユーザー名の横んとこにロールのアイコンが表示されるで。",
	"roleIsExplorable": "ユーザーを見つけやすくしたる",
	"roleDescriptionOfIsExplorable": "オンにしたらロールの面子一覧が「みつける」で公開されるし、ロールのタイムラインが使えるようになるで。",
	"rolePolicies": "ポリシー",
	"normalUser": "一般ユーザー",
	"moderator": "モデレーター",
	"administrator": "管理者"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"roleName": "Role name",
	"roleDescription": "Role description",
	"color": "Color",
	"roleIconUrl": "Icon URL",
	"roleDisplayOrder": "Position",
	"roleDescriptionOfDisplayOrder": "The higher the number, the higher its UI position.",
	"rolePermission": "Role permissions",
	"roleDescriptionOfPermission": "<b>Moderators</b> can perform basic moderation operations.\n<b>Administrators</b> can change all settings of the instance.",
	"roleManual": "Manual",
	"roleConditional": "Conditional",
	"roleAssignTarget": "Assignment type",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> to manually change who is part of this role and who is not.\n<b>Conditional</b> to have users be automatically assigned and removed from this role based on a condition.",
	"roleCondition": "Condition",
	"rolePreserveAssignmentOnMoveAccount": "Preserve role assignment during migration",
	"rolePreserveAssignmentOnMoveAccount_description": "When turned on, this role will be carried over to the destination account when an account with this role is migrated.",
	"roleCanEditMembersByModerator": "Allow moderators to edit the list of members for this role",
	"roleDescriptionOfCanEditMembersByModerator": "When turned on, moderators as well as administrators will be able to assign and unassign users to this role. When turned off, only administrators will be able to assign users.",
	"roleIsPublic": "Public role",
	"roleDescriptionOfIsPublic": "This role will be displayed in the profiles of assigned users.",
	"roleAsBadge": "Show as badge",
	"roleDescriptionOfAsBadge": "This role's icon will be displayed next to the username of users with this role if turned on.",
	"roleIsExplorable": "Make role explorable",
	"roleDescriptionOfIsExplorable": "This role's timeline and the list of users with this will be made public if enabled.",
	"rolePolicies": "Policies",
	"normalUser": "Normal user",
	"moderator": "Moderator",
	"administrator": "Administrator"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"roleName": "Role name",
	"roleDescription": "Role description",
	"color": "Color",
	"roleIconUrl": "Icon URL",
	"roleDisplayOrder": "Position",
	"roleDescriptionOfDisplayOrder": "The higher the number, the higher its UI position.",
	"rolePermission": "Role permissions",
	"roleDescriptionOfPermission": "<b>Moderators</b> can perform basic moderation operations.\n<b>Administrators</b> can change all settings of the instance.",
	"roleManual": "Manual",
	"roleConditional": "Conditional",
	"roleAssignTarget": "Assignment type",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> to manually change who is part of this role and who is not.\n<b>Conditional</b> to have users be automatically assigned and removed from this role based on a condition.",
	"roleCondition": "Condition",
	"rolePreserveAssignmentOnMoveAccount": "Preserve role assignment during migration",
	"rolePreserveAssignmentOnMoveAccount_description": "When turned on, this role will be carried over to the destination account when an account with this role is migrated.",
	"roleCanEditMembersByModerator": "Allow moderators to edit the list of members for this role",
	"roleDescriptionOfCanEditMembersByModerator": "When turned on, moderators as well as administrators will be able to assign and unassign users to this role. When turned off, only administrators will be able to assign users.",
	"roleIsPublic": "Public role",
	"roleDescriptionOfIsPublic": "This role will be displayed in the profiles of assigned users.",
	"roleAsBadge": "Show as badge",
	"roleDescriptionOfAsBadge": "This role's icon will be displayed next to the username of users with this role if turned on.",
	"roleIsExplorable": "Make role explorable",
	"roleDescriptionOfIsExplorable": "This role's timeline and the list of users with this will be made public if enabled.",
	"rolePolicies": "Policies",
	"normalUser": "Normal user",
	"moderator": "Moderator",
	"administrator": "Administrator"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"roleName": "역할 이름",
	"roleDescription": "역할 설명",
	"color": "색",
	"roleIconUrl": "아이콘 URL",
	"roleDisplayOrder": "표시 순서",
	"roleDescriptionOfDisplayOrder": "값이 클 수록 UI에서 먼저 표시됩니다.",
	"rolePermission": "역할 권한",
	"roleDescriptionOfPermission": "<b>조정자</b>는 기본적인 조정 작업을 진행할 수 있습니다.\n<b>관리자</b>는 서버의 모든 설정을 변경할 수 있습니다.",
	"roleManual": "수동",
	"roleConditional": "조건부",
	"roleAssignTarget": "할당 대상",
	"roleDescriptionOfAssignTarget": "<b>수동</b>을 선택하면 누가 이 역할에 포함되는지를 수동으로 관리할 수 있습니다.\n<b>조건부</b>를 선택하면 조건을 설정해 일치하는 유저를 자동으로 포함되게 할 수 있습니다.",
	"roleCondition": "조건",
	"rolePreserveAssignmentOnMoveAccount": "이전 대상 계정에도 할당 상태 전달",
	"rolePreserveAssignmentOnMoveAccount_description": "켜면 이 역할이 부여된 계정이 이전될 때 마이그레이션 대상 계정에도 이 역할이 승계됩니다.",
	"roleCanEditMembersByModerator": "모더레이터의 역할 수정 허용",
	"roleDescriptionOfCanEditMembersByModerator": "이 옵션을 켜면 모더레이터도 이 역할에 유저를 할당하거나 삭제할 수 있습니다. 꺼져 있으면 관리자만 할당이 가능합니다.",
	"roleIsPublic": "역할 공개",
	"roleDescriptionOfIsPublic": "역할에 할당된 유저를 누구나 볼 수 있습니다. 또한 유저 프로필에 이 역할이 표시됩니다.",
	"roleAsBadge": "뱃지로 표시",
	"roleDescriptionOfAsBadge": "활성화하면 유저명 옆에 역할의 아이콘이 표시됩니다.",
	"roleIsExplorable": "역할 타임라인 공개",
	"roleDescriptionOfIsExplorable": "활성화하면 역할 타임라인을 공개합니다. 비활성화 시 타임라인이 공개되지 않습니다.",
	"rolePolicies": "정책",
	"normalUser": "일반 유저",
	"moderator": "모더레이터",
	"administrator": "관리자"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"roleName": "Role name",
	"roleDescription": "Role description",
	"color": "Color",
	"roleIconUrl": "Icon URL",
	"roleDisplayOrder": "Position",
	"roleDescriptionOfDisplayOrder": "The higher the number, the higher its UI position.",
	"rolePermission": "Role permissions",
	"roleDescriptionOfPermission": "<b>Moderators</b> can perform basic moderation operations.\n<b>Administrators</b> can change all settings of the instance.",
	"roleManual": "Manual",
	"roleConditional": "Conditional",
	"roleAssignTarget": "Assignment type",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> to manually change who is part of this role and who is not.\n<b>Conditional</b> to have users be automatically assigned and removed from this role based on a condition.",
	"roleCondition": "Condition",
	"rolePreserveAssignmentOnMoveAccount": "Preserve role assignment during migration",
	"rolePreserveAssignmentOnMoveAccount_description": "When turned on, this role will be carried over to the destination account when an account with this role is migrated.",
	"roleCanEditMembersByModerator": "Allow moderators to edit the list of members for this role",
	"roleDescriptionOfCanEditMembersByModerator": "When turned on, moderators as well as administrators will be able to assign and unassign users to this role. When turned off, only administrators will be able to assign users.",
	"roleIsPublic": "Public role",
	"roleDescriptionOfIsPublic": "This role will be displayed in the profiles of assigned users.",
	"roleAsBadge": "Show as badge",
	"roleDescriptionOfAsBadge": "This role's icon will be displayed next to the username of users with this role if turned on.",
	"roleIsExplorable": "Make role explorable",
	"roleDescriptionOfIsExplorable": "This role's timeline and the list of users with this will be made public if enabled.",
	"rolePolicies": "Policies",
	"normalUser": "Normal user",
	"moderator": "Moderator",
	"administrator": "Beheerder"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"roleName": "Role name",
	"roleDescription": "Role description",
	"color": "Farge",
	"roleIconUrl": "Icon URL",
	"roleDisplayOrder": "Position",
	"roleDescriptionOfDisplayOrder": "The higher the number, the higher its UI position.",
	"rolePermission": "Role permissions",
	"roleDescriptionOfPermission": "<b>Moderators</b> can perform basic moderation operations.\n<b>Administrators</b> can change all settings of the instance.",
	"roleManual": "Manual",
	"roleConditional": "Conditional",
	"roleAssignTarget": "Assignment type",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> to manually change who is part of this role and who is not.\n<b>Conditional</b> to have users be automatically assigned and removed from this role based on a condition.",
	"roleCondition": "Condition",
	"rolePreserveAssignmentOnMoveAccount": "Preserve role assignment during migration",
	"rolePreserveAssignmentOnMoveAccount_description": "When turned on, this role will be carried over to the destination account when an account with this role is migrated.",
	"roleCanEditMembersByModerator": "Allow moderators to edit the list of members for this role",
	"roleDescriptionOfCanEditMembersByModerator": "When turned on, moderators as well as administrators will be able to assign and unassign users to this role. When turned off, only administrators will be able to assign users.",
	"roleIsPublic": "Public role",
	"roleDescriptionOfIsPublic": "This role will be displayed in the profiles of assigned users.",
	"roleAsBadge": "Show as badge",
	"roleDescriptionOfAsBadge": "This role's icon will be displayed next to the username of users with this role if turned on.",
	"roleIsExplorable": "Make role explorable",
	"roleDescriptionOfIsExplorable": "This role's timeline and the list of users with this will be made public if enabled.",
	"rolePolicies": "Policies",
	"normalUser": "Normal user",
	"moderator": "Moderator",
	"administrator": "Administrator"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"roleName": "Role name",
	"roleDescription": "Role description",
	"color": "Kolor",
	"roleIconUrl": "Icon URL",
	"roleDisplayOrder": "Position",
	"roleDescriptionOfDisplayOrder": "The higher the number, the higher its UI position.",
	"rolePermission": "Role permissions",
	"roleDescriptionOfPermission": "<b>Moderators</b> can perform basic moderation operations.\n<b>Administrators</b> can change all settings of the instance.",
	"roleManual": "Manual",
	"roleConditional": "Conditional",
	"roleAssignTarget": "Przydziel",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> to manually change who is part of this role and who is not.\n<b>Conditional</b> to have users be automatically assigned and removed from this role based on a condition.",
	"roleCondition": "Condition",
	"rolePreserveAssignmentOnMoveAccount": "Preserve role assignment during migration",
	"rolePreserveAssignmentOnMoveAccount_description": "When turned on, this role will be carried over to the destination account when an account with this role is migrated.",
	"roleCanEditMembersByModerator": "Allow moderators to edit the list of members for this role",
	"roleDescriptionOfCanEditMembersByModerator": "When turned on, moderators as well as administrators will be able to assign and unassign users to this role. When turned off, only administrators will be able to assign users.",
	"roleIsPublic": "Public role",
	"roleDescriptionOfIsPublic": "This role will be displayed in the profiles of assigned users.",
	"roleAsBadge": "Show as badge",
	"roleDescriptionOfAsBadge": "This role's icon will be displayed next to the username of users with this role if turned on.",
	"roleIsExplorable": "Make role explorable",
	"roleDescriptionOfIsExplorable": "This role's timeline and the list of users with this will be made public if enabled.",
	"rolePolicies": "Policies",
	"normalUser": "Normalny użytkownik",
	"moderator": "Moderator",
	"administrator": "Admin"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"roleName": "Nome do Cargo",
	"roleDescription": "Descrição do cargo",
	"color": "Cor",
	"roleIconUrl": "URL do ícone",
	"roleDisplayOrder": "Ordenação",
	"roleDescriptionOfDisplayOrder": "Quanto maior o número, maior a posição de destaque na interface do usuário.",
	"rolePermission": "Permissões do cargo",
	"roleDescriptionOfPermission": "<b>Moderador</b> permite que você execute operações básicas relacionadas à moderação.\n<b>Administradores</b> podem alterar todas as configurações do servidor.",
	"roleManual": "Manual",
	"roleConditional": "Condicional",
	"roleAssignTarget": "Atribuir",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> para gerenciar manualmente quem está incluído neste cargo.\n<b>Condicional</b> define uma condição e os usuários que corresponderem a ela serão incluídos automaticamente.",
	"roleCondition": "Condição",
	"rolePreserveAssignmentOnMoveAccount": "Preservar a associação de cargos durante a migração",
	"rolePreserveAssignmentOnMoveAccount_description": "Quando ligado, esse cargo será encaminhado para a conta final quando houver migração de um usuário.",
	"roleCanEditMembersByModerator": "Permitir a edição de membros deste cargo por moderadores",
	"roleDescriptionOfCanEditMembersByModerator": "Quando ativado, os moderadores também poderão atribuir/remover usuários deste papel, além dos administradores. Quando desativado, apenas os administradores poderão fazê-lo.",
	"roleIsPublic": "Cargo público",
	"roleDescriptionOfIsPublic": "Este cargo será exibido no perfil do usuário.",
	"roleAsBadge": "Exibir como insígnia",
	"roleDescriptionOfAsBadge": "Quando ativado, o ícone do cargo será exibido ao lado do nome de usuário",
	"roleIsExplorable": "Fazer o cargo explorável",
	"roleDescriptionOfIsExplorable": "Ao ativar, a lista de membros será pública na seção 'Explorar' e a linha do tempo do cargo ficará disponível.",
	"rolePolicies": "Políticas",
	"normalUser": "Usuários padrão",
	"moderator": "Moderador",
	"administrator": "Administrador"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"roleName": "Название роли",
	"roleDescription": "Описание роли",
	"color": "Цвет",
	"roleIconUrl": "Адрес на иконку роли",
	"roleDisplayOrder": "Position",
	"roleDescriptionOfDisplayOrder": "The higher the number, the higher its UI position.",
	"rolePermission": "Ролевые полномочия",
	"roleDescriptionOfPermission": "<b>Модераторы</b> могут изменять базовые операции для модераторов.\n<b>Администраторы</b> могут изменять полностью настройки инстанса.",
	"roleManual": "Вручную",
	"roleConditional": "По условию",
	"roleAssignTarget": "Метод присвоения",
	"roleDescriptionOfAssignTarget": "<b>Вручную</b> чтобы указать кому выдавать роль, а кому нет.\n<b>По условию<b> чтобы автоматически выдавать и удалять роль при условиях.",
	"roleCondition": "Условия",
	"rolePreserveAssignmentOnMoveAccount": "Preserve role assignment during migration",
	"rolePreserveAssignmentOnMoveAccount_description": "When turned on, this role will be carried over to the destination account when an account with this role is migrated.",
	"roleCanEditMembersByModerator": "Могут назначать модераторы",
	"roleDescriptionOfCanEditMembersByModerator": "Если включено, на эту роль могут назначать пользователей как администраторы, так и модераторы. Если выключено, назначать могут только администраторы.",
	"roleIsPublic": "Общедоступная роль",
	"roleDescriptionOfIsPublic": "Список тех, кому назначена эта роль будет доступен всем. Кроме того эта роль будет отмечена у каждого в профиле.",
	"roleAsBadge": "Показывать как значок",
	"roleDescriptionOfAsBadge": "Описание значка",
	"roleIsExplorable": "Make role explorable",
	"roleDescriptionOfIsExplorable": "This role's timeline and the list of users with this will be made public if enabled.",
	"rolePolicies": "Политики",
	"normalUser": "Обычный пользователь",
	"moderator": "Модератор",
	"administrator": "Администратор"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"roleName": "Role name",
	"roleDescription": "Role description",
	"color": "Farba",
	"roleIconUrl": "Icon URL",
	"roleDisplayOrder": "Position",
	"roleDescriptionOfDisplayOrder": "The higher the number, the higher its UI position.",
	"rolePermission": "Role permissions",
	"roleDescriptionOfPermission": "<b>Moderators</b> can perform basic moderation operations.\n<b>Administrators</b> can change all settings of the instance.",
	"roleManual": "Manual",
	"roleConditional": "Conditional",
	"roleAssignTarget": "Assignment type",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> to manually change who is part of this role and who is not.\n<b>Conditional</b> to have users be automatically assigned and removed from this role based on a condition.",
	"roleCondition": "Condition",
	"rolePreserveAssignmentOnMoveAccount": "Preserve role assignment during migration",
	"rolePreserveAssignmentOnMoveAccount_description": "When turned on, this role will be carried over to the destination account when an account with this role is migrated.",
	"roleCanEditMembersByModerator": "Allow moderators to edit the list of members for this role",
	"roleDescriptionOfCanEditMembersByModerator": "When turned on, moderators as well as administrators will be able to assign and unassign users to this role. When turned off, only administrators will be able to assign users.",
	"roleIsPublic": "Public role",
	"roleDescriptionOfIsPublic": "This role will be displayed in the profiles of assigned users.",
	"roleAsBadge": "Show as badge",
	"roleDescriptionOfAsBadge": "This role's icon will be displayed next to the username of users with this role if turned on.",
	"roleIsExplorable": "Make role explorable",
	"roleDescriptionOfIsExplorable": "This role's timeline and the list of users with this will be made public if enabled.",
	"rolePolicies": "Policies",
	"normalUser": "Normal user",
	"moderator": "Moderátor",
	"administrator": "Administrátor"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"roleName": "ชื่อบทบาท",
	"roleDescription": "คำอธิบายบทบาท",
	"color": "สี",
	"roleIconUrl": "URL ของไอคอน",
	"roleDisplayOrder": "ลำดับการแสดงผล",
	"roleDescriptionOfDisplayOrder": "เลขที่สูงกว่าจะแสดงบน UI ก่อน",
	"rolePermission": "สิทธิ์ตามบทบาท",
	"roleDescriptionOfPermission": "<b>ผู้ควบคุม</b> สามารถดำเนินการดูแลขั้นพื้นฐานได้\n<b>ผู้ดูแลระบบ</b> สามารถเปลี่ยนการตั้งค่าทั้งหมดของเซิร์ฟเวอร์ได้",
	"roleManual": "ปรับเอง",
	"roleConditional": "มีเงื่อนไข",
	"roleAssignTarget": "มอบหมาย",
	"roleDescriptionOfAssignTarget": "แบบ<b>ปรับเอง</b> เพิ่มถอนบทบาทนี้แก่ผู้ใช้ด้วยตัวเอง\nแบบ<b>มีเงื่อนไข</b> เพิ่มถอนบทบาทนี้แก่ผู้ใช้โดยอัตโนมัติหากเข้าเงื่อนไขใดต่อไปนี้",
	"roleCondition": "เงื่อนไข",
	"rolePreserveAssignmentOnMoveAccount": "โอนสถานะการมอบหมายไปยังบัญชีที่ย้ายไป",
	"rolePreserveAssignmentOnMoveAccount_description": "เมื่อเปิดใช้งาน บัญชีที่ได้รับบทบาทนี้เมื่อถูกย้ายไปบัญชีใหม่ บทบาทนี้จะถูกถ่ายทอดไปยังบัญชีปลายทางด้วย",
	"roleCanEditMembersByModerator": "อนุญาตให้ผู้ควบคุมแก้ไขสมาชิก",
	"roleDescriptionOfCanEditMembersByModerator": "เมื่อเปิดใช้ นอกเหนือจากผู้ควบคุมและผู้ดูแลระบบแล้ว จะสามารถเพิ่มถอนบทบาทนี้แก่ผู้ใช้ได้ แต่เมื่อปิดใช้ จะมีเฉพาะผู้ดูแลระบบเท่านั้นที่จะสามารถดำเนินการได้",
	"roleIsPublic": "ทำให้บทบาทเปิดเผยต่อสาธารณะ",
	"roleDescriptionOfIsPublic": "บทบาทจะปรากฏบนโปรไฟล์ของผู้ใช้และเปิดเผยต่อสาธารณะ (ทุกคนสามารถเห็นได้ว่าผู้ใช้รายนี้มีบทบาทนี้)",
	"roleAsBadge": "แสดงเป็นตรา",
	"roleDescriptionOfAsBadge": "หากเปิดใช้งาน จะมีไอคอนของบทบาท แสดงถัดจากชื่อผู้ใช้",
	"roleIsExplorable": "ค้นหาผู้ใช้ได้ง่ายขึ้นโดยดูจากบทบาท",
	"roleDescriptionOfIsExplorable": "เมื่อเปิดใช้งาน ไทมไลน์บทบาทนี้และสมาชิกที่มีบทบาทนี้จะเปิดเผยเป็นสาธารณะ",
	"rolePolicies": "นโยบาย",
	"normalUser": "ผู้ใช้มาตรฐาน",
	"moderator": "ผู้ควบคุม",
	"administrator": "ผู้ดูแลระบบ"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"roleName": "Rol adı",
	"roleDescription": "Rol tanımı",
	"color": "Renk",
	"roleIconUrl": "Simge URL'si",
	"roleDisplayOrder": "Pozisyon",
	"roleDescriptionOfDisplayOrder": "Sayı ne kadar yüksekse, UI pozisyonu da o kadar yüksek olur.",
	"rolePermission": "Rol izinleri",
	"roleDescriptionOfPermission": "<b>Moderators</b> temel moderasyon işlemlerini gerçekleştirebilir.\n<b>Administrators</b> örneğin tüm ayarlarını değiştirebilir.",
	"roleManual": "Kılavuz",
	"roleConditional": "Koşullu",
	"roleAssignTarget": "Görev türü",
	"roleDescriptionOfAssignTarget": "Bu rolün parçası olan ve olmayan kişileri manuel olarak değiştirmek için </b>manuel</b>.\nKullanıcıların bir koşula bağlı olarak bu role otomatik olarak atanmasını ve bu rolden çıkarılmasını sağlamak için\u00a0<b>koşullu.</b>",
	"roleCondition": "Durum",
	"rolePreserveAssignmentOnMoveAccount": "Geçiş sırasında rol atamalarını koruyun",
	"rolePreserveAssignmentOnMoveAccount_description": "Etkinleştirildiğinde, bu rol, bu role sahip bir hesap taşındığında hedef hesaba aktarılacak.",
	"roleCanEditMembersByModerator": "Moderatörlerin bu rol için üye listesini düzenlemesine izin ver",
	"roleDescriptionOfCanEditMembersByModerator": "Etkinleştirildiğinde, moderatörler ve yöneticiler bu role kullanıcıları atayabilir ve atamalarını kaldırabilir. Devre dışı bırakıldığında, yalnızca yöneticiler kullanıcıları atayabilir.",
	"roleIsPublic": "Kamu rolü",
	"roleDescriptionOfIsPublic": "Bu rol, atanan kullanıcıların profillerinde görüntülenecek.",
	"roleAsBadge": "Rozet olarak göster",
	"roleDescriptionOfAsBadge": "This role's icon will be displayed next to the username of users with this role if turned on.",
	"roleIsExplorable": "Rolü keşfedilebilir hale getir",
	"roleDescriptionOfIsExplorable": "Bu rolün panosu ve bu role sahip kullanıcıların listesi, etkinleştirilirse kamuya açık hale getirilecek.",
	"rolePolicies": "Politikalar",
	"normalUser": "Normal kullanıcı",
	"moderator": "Moderatör",
	"administrator": "Yönetici"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"roleName": "Role name",
	"roleDescription": "Role description",
	"color": "Color",
	"roleIconUrl": "Icon URL",
	"roleDisplayOrder": "Position",
	"roleDescriptionOfDisplayOrder": "The higher the number, the higher its UI position.",
	"rolePermission": "Role permissions",
	"roleDescriptionOfPermission": "<b>Moderators</b> can perform basic moderation operations.\n<b>Administrators</b> can change all settings of the instance.",
	"roleManual": "Manual",
	"roleConditional": "Conditional",
	"roleAssignTarget": "Assignment type",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> to manually change who is part of this role and who is not.\n<b>Conditional</b> to have users be automatically assigned and removed from this role based on a condition.",
	"roleCondition": "Condition",
	"rolePreserveAssignmentOnMoveAccount": "Preserve role assignment during migration",
	"rolePreserveAssignmentOnMoveAccount_description": "When turned on, this role will be carried over to the destination account when an account with this role is migrated.",
	"roleCanEditMembersByModerator": "Allow moderators to edit the list of members for this role",
	"roleDescriptionOfCanEditMembersByModerator": "When turned on, moderators as well as administrators will be able to assign and unassign users to this role. When turned off, only administrators will be able to assign users.",
	"roleIsPublic": "Public role",
	"roleDescriptionOfIsPublic": "This role will be displayed in the profiles of assigned users.",
	"roleAsBadge": "Show as badge",
	"roleDescriptionOfAsBadge": "This role's icon will be displayed next to the username of users with this role if turned on.",
	"roleIsExplorable": "Make role explorable",
	"roleDescriptionOfIsExplorable": "This role's timeline and the list of users with this will be made public if enabled.",
	"rolePolicies": "Policies",
	"normalUser": "Normal user",
	"moderator": "Moderator",
	"administrator": "Administrator"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"roleName": "Назва ролі",
	"roleDescription": "Опис ролі",
	"color": "Колір",
	"roleIconUrl": "Icon URL",
	"roleDisplayOrder": "Position",
	"roleDescriptionOfDisplayOrder": "The higher the number, the higher its UI position.",
	"rolePermission": "Права ролі",
	"roleDescriptionOfPermission": "<b>Moderators</b> can perform basic moderation operations.\n<b>Administrators</b> can change all settings of the instance.",
	"roleManual": "Вручну",
	"roleConditional": "Conditional",
	"roleAssignTarget": "Призначити",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> to manually change who is part of this role and who is not.\n<b>Conditional</b> to have users be automatically assigned and removed from this role based on a condition.",
	"roleCondition": "Умови",
	"rolePreserveAssignmentOnMoveAccount": "Preserve role assignment during migration",
	"rolePreserveAssignmentOnMoveAccount_description": "When turned on, this role will be carried over to the destination account when an account with this role is migrated.",
	"roleCanEditMembersByModerator": "Allow moderators to edit the list of members for this role",
	"roleDescriptionOfCanEditMembersByModerator": "When turned on, moderators as well as administrators will be able to assign and unassign users to this role. When turned off, only administrators will be able to assign users.",
	"roleIsPublic": "Public role",
	"roleDescriptionOfIsPublic": "This role will be displayed in the profiles of assigned users.",
	"roleAsBadge": "Show as badge",
	"roleDescriptionOfAsBadge": "This role's icon will be displayed next to the username of users with this role if turned on.",
	"roleIsExplorable": "Make role explorable",
	"roleDescriptionOfIsExplorable": "This role's timeline and the list of users with this will be made public if enabled.",
	"rolePolicies": "Policies",
	"normalUser": "Звичайний користувач",
	"moderator": "Модератор",
	"administrator": "Адмін"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"roleName": "Role name",
	"roleDescription": "Role description",
	"color": "Màu sắc",
	"roleIconUrl": "Icon URL",
	"roleDisplayOrder": "Position",
	"roleDescriptionOfDisplayOrder": "The higher the number, the higher its UI position.",
	"rolePermission": "Role permissions",
	"roleDescriptionOfPermission": "<b>Moderators</b> can perform basic moderation operations.\n<b>Administrators</b> can change all settings of the instance.",
	"roleManual": "Manual",
	"roleConditional": "Conditional",
	"roleAssignTarget": "Phân công",
	"roleDescriptionOfAssignTarget": "<b>Manual</b> to manually change who is part of this role and who is not.\n<b>Conditional</b> to have users be automatically assigned and removed from this role based on a condition.",
	"roleCondition": "Condition",
	"rolePreserveAssignmentOnMoveAccount": "Preserve role assignment during migration",
	"rolePreserveAssignmentOnMoveAccount_description": "When turned on, this role will be carried over to the destination account when an account with this role is migrated.",
	"roleCanEditMembersByModerator": "Allow moderators to edit the list of members for this role",
	"roleDescriptionOfCanEditMembersByModerator": "When turned on, moderators as well as administrators will be able to assign and unassign users to this role. When turned off, only administrators will be able to assign users.",
	"roleIsPublic": "Public role",
	"roleDescriptionOfIsPublic": "This role will be displayed in the profiles of assigned users.",
	"roleAsBadge": "Show as badge",
	"roleDescriptionOfAsBadge": "This role's icon will be displayed next to the username of users with this role if turned on.",
	"roleIsExplorable": "Make role explorable",
	"roleDescriptionOfIsExplorable": "This role's timeline and the list of users with this will be made public if enabled.",
	"rolePolicies": "Policies",
	"normalUser": "Người dùng bình thường",
	"moderator": "Kiểm duyệt viên",
	"administrator": "Quản trị viên"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"roleName": "角色名称",
	"roleDescription": "角色描述",
	"color": "颜色",
	"roleIconUrl": "图标 URL",
	"roleDisplayOrder": "显示顺序",
	"roleDescriptionOfDisplayOrder": "数字越大，显示位置越靠前。",
	"rolePermission": "角色权限",
	"roleDescriptionOfPermission": "<b>监察员</b>可以执行基本的审核操作。\n<b>管理员</b>可以更改实例的所有设置。",
	"roleManual": "手动",
	"roleConditional": "符合条件",
	"roleAssignTarget": "授权对象",
	"roleDescriptionOfAssignTarget": "<b>手动</b>指手动选择谁被包括在这个角色中。\n<b>符合条件</b>指设置条件以自动包括符合条件的用户。",
	"roleCondition": "条件",
	"rolePreserveAssignmentOnMoveAccount": "将分配状态继承到目标账户",
	"rolePreserveAssignmentOnMoveAccount_description": "启用后，当迁移具有该角色的账户时，目标账户也会继承该角色。",
	"roleCanEditMembersByModerator": "允许监察员编辑成员",
	"roleDescriptionOfCanEditMembersByModerator": "如果选中，监察员和管理员都能够为用户分配/取消分配角色。如果未选中，则只有管理员可以执行此操作。",
	"roleIsPublic": "角色公开",
	"roleDescriptionOfIsPublic": "任何人都可以看到分配该角色的用户。而用户的个人资料也将显示该角色。",
	"roleAsBadge": "作为徽章显示",
	"roleDescriptionOfAsBadge": "开启后，用户名旁边将会出现角色图标。",
	"roleIsExplorable": "公开角色时间线",
	"roleDescriptionOfIsExplorable": "开启后将公开角色时间线。如果角色为非公开，则无法公开时间线。",
	"rolePolicies": "策略",
	"normalUser": "普通用户",
	"moderator": "监察员",
	"administrator": "管理员"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"roleName": "角色名稱",
	"roleDescription": "角色描述 ",
	"color": "顏色",
	"roleIconUrl": "圖示的 URL",
	"roleDisplayOrder": "顯示順序",
	"roleDescriptionOfDisplayOrder": "數字越大，顯示在UI上的越上面。",
	"rolePermission": "角色的權限",
	"roleDescriptionOfPermission": "<b>審查員</b>執行與審查相關的基本操作。\n<b>管理員</b>能變更伺服器的全部設定。",
	"roleManual": "手動",
	"roleConditional": "符合條件",
	"roleAssignTarget": "指派目標",
	"roleDescriptionOfAssignTarget": "<b>手動</b>是以手動管理這個角色包含的人員。\n<b>符合條件</b>是設定條件以自動包含符合條件的使用者。",
	"roleCondition": "條件",
	"rolePreserveAssignmentOnMoveAccount": "將指派狀態承接至轉移後的帳戶",
	"rolePreserveAssignmentOnMoveAccount_description": "開啟此選項後，當具備此角色的帳戶被移轉時，該角色也會承接至轉移後的帳戶。",
	"roleCanEditMembersByModerator": "允許編輯審查員的成員",
	"roleDescriptionOfCanEditMembersByModerator": "如果開啟，管理員與審查員都可以為使用者指派/解除指派該角色。如果關閉，則只有管理員可以執行。",
	"roleIsPublic": "角色為公開",
	"roleDescriptionOfIsPublic": "任何人都可以看到被指派了角色的使用者。此外，使用者的個人檔案將顯示這個角色。",
	"roleAsBadge": "顯示為徽章",
	"roleDescriptionOfAsBadge": "開啟的話，角色圖示會顯示在使用者名稱旁邊。",
	"roleIsExplorable": "讓使用者更容易找到您",
	"roleDescriptionOfIsExplorable": "若開啟則公開角色時間軸。若角色不是公開的，則無法公開時間軸。",
	"rolePolicies": "政策",
	"normalUser": "一般使用者",
	"moderator": "審查員",
	"administrator": "管理員"
}
</locale>
