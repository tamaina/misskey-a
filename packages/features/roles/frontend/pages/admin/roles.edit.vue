<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<XEditor v-if="data" v-model="data"/>
	</div>
	<template #footer>
		<div :class="$style.footer">
			<div class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 16px; --MI_SPACER-max: 16px;">
				<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ $locale.sfc.save }}</MkButton>
			</div>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XEditor from '@features/roles/frontend/pages/admin/roles.editor.vue';
import { genId } from '@features/runtime/frontend/utility/id.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { rolesCache } from '@features/runtime/frontend/cache.js';
import { useRouter } from '@features/navigation/frontend/router.js';

const router = useRouter();

const props = defineProps<{
	id?: string;
}>();

type RoleLike = Pick<Misskey.entities.Role, 'name' | 'description' | 'isAdministrator' | 'isModerator' | 'color' | 'iconUrl' | 'target' | 'isPublic' | 'isExplorable' | 'asBadge' | 'canEditMembersByModerator' | 'displayOrder' | 'preserveAssignmentOnMoveAccount'> & {
	condFormula: any;
	policies: any;
};

const role = ref<Misskey.entities.Role | null>(null);
const data = ref<RoleLike | null>(null);

if (props.id) {
	role.value = await misskeyApi('admin/roles/show', {
		roleId: props.id,
	});

	data.value = role.value;
} else {
	data.value = {
		name: 'New Role',
		description: '',
		isAdministrator: false,
		isModerator: false,
		color: null,
		iconUrl: null,
		target: 'manual',
		condFormula: { id: genId(), type: 'isRemote' },
		isPublic: false,
		isExplorable: false,
		asBadge: false,
		canEditMembersByModerator: false,
		displayOrder: 0,
		preserveAssignmentOnMoveAccount: false,
		policies: {},
	};
}

async function save() {
	if (data.value === null) return;
	rolesCache.delete();
	if (role.value) {
		os.apiWithDialog('admin/roles/update', {
			roleId: role.value.id,
			...data.value,
		});
		router.push('/admin/roles/:id', {
			params: {
				id: role.value.id,
			},
		});
	} else {
		const created = await os.apiWithDialog('admin/roles/create', {
			...data.value,
		});
		router.push('/admin/roles/:id', {
			params: {
				id: created.id,
			},
		});
	}
}

const headerTabs = computed(() => []);

definePage(() => ({
	title: role.value ? `${$locale.value.sfc.edit}: ${role.value.name}` : $locale.value.sfc.new,
	icon: 'ti ti-badge',
}));
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
}
</style>

<locale locale="ar-SA" lang="json">
{
	"edit": "حرر الأدوار",
	"new": "دور جديد",
	"save": "حفظ"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"edit": "Editar el rol",
	"new": "Nou rol",
	"save": "Desa"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"edit": "Upravit roli",
	"new": "Nová role",
	"save": "Uložit"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"edit": "Edit role",
	"new": "New role",
	"save": "Save"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"edit": "Rolle bearbeiten",
	"new": "Rolle erstellen",
	"save": "Speichern"
}
</locale>

<locale locale="en-US" lang="json">
{
	"edit": "Edit role",
	"new": "New role",
	"save": "Save"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"edit": "Editar rol",
	"new": "Crear rol",
	"save": "Guardar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"edit": "Modifier le rôle",
	"new": "Nouveau rôle",
	"save": "Enregistrer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"edit": "Sunting peran",
	"new": "Buat peran",
	"save": "Simpan"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"edit": "Modifica ruolo",
	"new": "Nuovo ruolo",
	"save": "Salva"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"edit": "ロールの編集",
	"new": "ロールの作成",
	"save": "保存"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"edit": "ロールの編集",
	"new": "ロールの作成",
	"save": "とっとく"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"edit": "Edit role",
	"new": "New role",
	"save": "Sekles"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"edit": "Edit role",
	"new": "New role",
	"save": "ಉಳಿಸಿ"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"edit": "역할 수정",
	"new": "새 역할 생성",
	"save": "저장"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"edit": "Edit role",
	"new": "New role",
	"save": "Opslaan"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"edit": "Edit role",
	"new": "New role",
	"save": "Lagre"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"edit": "Edit role",
	"new": "New role",
	"save": "Zapisz"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"edit": "Editar cargo",
	"new": "Novo cargo",
	"save": "Salvar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"edit": "Изменить роль",
	"new": "Новая роль",
	"save": "Сохранить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"edit": "Edit role",
	"new": "New role",
	"save": "Uložiť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"edit": "แก้ไขบทบาท",
	"new": "บทบาทใหม่",
	"save": "บันทึก"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"edit": "Rolü düzenle",
	"new": "Yeni rol",
	"save": "Kaydet"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"edit": "Edit role",
	"new": "New role",
	"save": "Save"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"edit": "Змінити роль",
	"new": "Нова роль",
	"save": "Зберегти"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"edit": "Edit role",
	"new": "New role",
	"save": "Lưu"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"edit": "编辑角色",
	"new": "创建角色",
	"save": "保存"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"edit": "編輯角色",
	"new": "建立角色",
	"save": "儲存"
}
</locale>
