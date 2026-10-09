<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div class="_gaps">
			<MkFolder>
				<template #label>{{ $locale.sfc.baseRole }}</template>
				<template #footer>
					<MkButton primary rounded @click="updateBaseRole">{{ $locale.sfc.save }}</MkButton>
				</template>
				<div class="_gaps_s">
					<MkInput v-model="baseRoleQ" type="search">
						<template #prefix><i class="ti ti-search"></i></template>
					</MkInput>

					<XPolicyEditor
						v-model:rolePolicies="policies"
						:isBaseRole="true"
						:roleQuery="baseRoleQ"
					/>
				</div>
			</MkFolder>
			<MkButton primary rounded @click="create"><i class="ti ti-plus"></i> {{ $locale.sfc.new }}</MkButton>
			<div class="_gaps_s">
				<MkFoldableSection>
					<template #header>{{ $locale.sfc.manualRoles }}</template>
					<div class="_gaps_s">
						<MkRolePreview v-for="role in roles.filter(x => x.target === 'manual')" :key="role.id" :role="role" :forModeration="true"/>
					</div>
				</MkFoldableSection>
				<MkFoldableSection>
					<template #header>{{ $locale.sfc.conditionalRoles }}</template>
					<div class="_gaps_s">
						<MkRolePreview v-for="role in roles.filter(x => x.target === 'conditional')" :key="role.id" :role="role" :forModeration="true"/>
					</div>
				</MkFoldableSection>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkRolePreview from '@features/roles/frontend/components/MkRolePreview.vue';
import XPolicyEditor from '@features/roles/frontend/pages/admin/roles.policy-editor.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { instance, fetchInstance } from '@features/instance/frontend/instance.js';
import MkFoldableSection from '@features/ui/frontend/components/MkFoldableSection.vue';
import { useRouter } from '@features/navigation/frontend/router.js';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';

const router = useRouter();
const baseRoleQ = ref('');

const roles = await misskeyApi('admin/roles/list');

const policies = reactive(deepClone(instance.policies));

async function updateBaseRole() {
	await os.apiWithDialog('admin/roles/update-default-policies', {
		policies,
	});
	fetchInstance(true);
}

function create() {
	router.push('/admin/roles/new');
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.roles,
	icon: 'ti ti-badges',
}));
</script>

<style lang="scss" module>

</style>

<locale locale="ar-SA" lang="json">
{
	"baseRole": "Role template",
	"save": "حفظ",
	"new": "دور جديد",
	"manualRoles": "Manual roles",
	"conditionalRoles": "Conditional roles",
	"roles": "الأدوار"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"baseRole": "Plantilla de rols",
	"save": "Desa",
	"new": "Nou rol",
	"manualRoles": "Rols manuals",
	"conditionalRoles": "Rols condicionals",
	"roles": "Rols"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"baseRole": "Šablona role",
	"save": "Uložit",
	"new": "Nová role",
	"manualRoles": "Manual roles",
	"conditionalRoles": "Conditional roles",
	"roles": "Role"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"baseRole": "Role template",
	"save": "Save",
	"new": "New role",
	"manualRoles": "Manual roles",
	"conditionalRoles": "Conditional roles",
	"roles": "Roles"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"baseRole": "Rollenvorlage",
	"save": "Speichern",
	"new": "Rolle erstellen",
	"manualRoles": "Manuelle Rollen",
	"conditionalRoles": "Bedingte Rolle",
	"roles": "Rollen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"baseRole": "Role template",
	"save": "Save",
	"new": "New role",
	"manualRoles": "Manual roles",
	"conditionalRoles": "Conditional roles",
	"roles": "Roles"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"baseRole": "Rol base",
	"save": "Guardar",
	"new": "Crear rol",
	"manualRoles": "Roles manuales",
	"conditionalRoles": "Roles condicionales",
	"roles": "Roles"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"baseRole": "Modèle de rôle",
	"save": "Enregistrer",
	"new": "Nouveau rôle",
	"manualRoles": "Rôles manuels",
	"conditionalRoles": "Rôles conditionnels",
	"roles": "Rôles"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"baseRole": "Templat peran",
	"save": "Simpan",
	"new": "Buat peran",
	"manualRoles": "Peran manual",
	"conditionalRoles": "Peran kondisional",
	"roles": "Peran"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"baseRole": "Ruolo di base",
	"save": "Salva",
	"new": "Nuovo ruolo",
	"manualRoles": "Ruoli assegnati manualmente",
	"conditionalRoles": "Ruoli condizionati",
	"roles": "Ruoli"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"baseRole": "ベースロール",
	"save": "保存",
	"new": "ロールの作成",
	"manualRoles": "マニュアルロール",
	"conditionalRoles": "コンディショナルロール",
	"roles": "ロール"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"baseRole": "ベースロール",
	"save": "とっとく",
	"new": "ロールの作成",
	"manualRoles": "マニュアルロール",
	"conditionalRoles": "コンディショナルロール",
	"roles": "ロール"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"baseRole": "Role template",
	"save": "Sekles",
	"new": "New role",
	"manualRoles": "Manual roles",
	"conditionalRoles": "Conditional roles",
	"roles": "Roles"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"baseRole": "Role template",
	"save": "ಉಳಿಸಿ",
	"new": "New role",
	"manualRoles": "Manual roles",
	"conditionalRoles": "Conditional roles",
	"roles": "Roles"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"baseRole": "기본 역할",
	"save": "저장",
	"new": "새 역할 생성",
	"manualRoles": "수동 역할",
	"conditionalRoles": "조건부 역할",
	"roles": "역할"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"baseRole": "Role template",
	"save": "Opslaan",
	"new": "New role",
	"manualRoles": "Manual roles",
	"conditionalRoles": "Conditional roles",
	"roles": "Roles"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"baseRole": "Role template",
	"save": "Lagre",
	"new": "New role",
	"manualRoles": "Manual roles",
	"conditionalRoles": "Conditional roles",
	"roles": "Roller"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"baseRole": "Role template",
	"save": "Zapisz",
	"new": "New role",
	"manualRoles": "Manual roles",
	"conditionalRoles": "Conditional roles",
	"roles": "Role"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"baseRole": "Cargo padrão",
	"save": "Salvar",
	"new": "Novo cargo",
	"manualRoles": "Cargos manuais",
	"conditionalRoles": "Cargos condicionais",
	"roles": "Cargos"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"baseRole": "Шаблон роли",
	"save": "Сохранить",
	"new": "Новая роль",
	"manualRoles": "Manual roles",
	"conditionalRoles": "Conditional roles",
	"roles": "Роли"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"baseRole": "Role template",
	"save": "Uložiť",
	"new": "New role",
	"manualRoles": "Manual roles",
	"conditionalRoles": "Conditional roles",
	"roles": "Roles"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"baseRole": "แม่แบบบทบาท",
	"save": "บันทึก",
	"new": "บทบาทใหม่",
	"manualRoles": "บทบาทแบบทำมือ",
	"conditionalRoles": "บทบาทแบบมีเงื่อนไข",
	"roles": "บทบาท"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"baseRole": "Rol şablonu",
	"save": "Kaydet",
	"new": "Yeni rol",
	"manualRoles": "Manuel roller",
	"conditionalRoles": "Koşullu roller",
	"roles": "Roller"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"baseRole": "Role template",
	"save": "Save",
	"new": "New role",
	"manualRoles": "Manual roles",
	"conditionalRoles": "Conditional roles",
	"roles": "Roles"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"baseRole": "Role template",
	"save": "Зберегти",
	"new": "Нова роль",
	"manualRoles": "Manual roles",
	"conditionalRoles": "Conditional roles",
	"roles": "Ролі"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"baseRole": "Role template",
	"save": "Lưu",
	"new": "New role",
	"manualRoles": "Manual roles",
	"conditionalRoles": "Conditional roles",
	"roles": "Vai trò"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"baseRole": "基本角色",
	"save": "保存",
	"new": "创建角色",
	"manualRoles": "手动角色",
	"conditionalRoles": "条件角色",
	"roles": "角色"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"baseRole": "基本角色",
	"save": "儲存",
	"new": "建立角色",
	"manualRoles": "手動角色",
	"conditionalRoles": "有條件的角色",
	"roles": "角色"
}
</locale>
