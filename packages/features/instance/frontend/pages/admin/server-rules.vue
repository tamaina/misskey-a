<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker markerId="serverRules" :keywords="['rules']">
	<MkFolder>
		<template #icon><SearchIcon><i class="ti ti-checkbox"></i></SearchIcon></template>
		<template #label><SearchLabel>{{ $locale.sfc.serverRules }}</SearchLabel></template>

		<div class="_gaps_m">
			<div><SearchText>{{ $locale.sfc.description }}</SearchText></div>

			<MkDraggable
				v-model="serverRules"
				direction="vertical"
				withGaps
				manualDragStart
			>
				<template #default="{ item, index, dragStart }">
					<div :class="$style.item">
						<div :class="$style.itemHeader">
							<div :class="$style.itemNumber">{{ index + 1 }}</div>
							<span :class="$style.itemHandle" :draggable="true" @dragstart.stop="dragStart"><i class="ti ti-menu"></i></span>
							<button class="_button" :class="$style.itemRemove" @click="remove(item.id)"><i class="ti ti-x"></i></button>
						</div>
						<MkInput :modelValue="item.text" @update:modelValue="serverRules[index].text = $event"/>
					</div>
				</template>
			</MkDraggable>
			<div :class="$style.commands">
				<MkButton rounded @click="add"><i class="ti ti-plus"></i> {{ $locale.sfc.add }}</MkButton>
				<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ $locale.sfc.save }}</MkButton>
			</div>
		</div>
	</MkFolder>
</SearchMarker>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as os from '@features/ui/frontend/os.js';
import { fetchInstance, instance } from '@features/instance/frontend/instance.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkDraggable from '@features/ui/frontend/components/MkDraggable.vue';

const serverRules = ref<{ text: string; id: string; }[]>(instance.serverRules.map(text => ({ text, id: Math.random().toString() })));

async function save() {
	await os.apiWithDialog('admin/update-meta', {
		serverRules: serverRules.value.map(r => r.text),
	});
	fetchInstance(true);
}

function add(): void {
	serverRules.value.push({ text: '', id: Math.random().toString() });
}

function remove(id: string): void {
	serverRules.value = serverRules.value.filter(r => r.id !== id);
}
</script>

<style lang="scss" module>
.item {
	display: block;
	color: var(--MI_THEME-navFg);
}

.itemHeader {
	display: flex;
	margin-bottom: 8px;
	align-items: center;
}

.itemHandle {
	display: flex;
	width: 40px;
	height: 40px;
	align-items: center;
	justify-content: center;
	cursor: move;
}

.itemNumber {
	display: flex;
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	font-size: 14px;
	font-weight: bold;
	width: 28px;
	height: 28px;
	align-items: center;
	justify-content: center;
	border-radius: 999px;
	margin-right: 8px;
}

.itemEdit {
	width: 100%;
	max-width: 100%;
	min-width: 100%;
}

.itemRemove {
	width: 40px;
	height: 40px;
	color: var(--MI_THEME-error);
	margin-left: auto;
	border-radius: 6px;

	&:hover {
		background: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.05));
	}
}

.commands {
	display: flex;
	gap: 16px;
}
</style>

<locale locale="ar-SA" lang="json">
{
  "serverRules": "قوانين الخادم",
  "description": "مجموعة من القواعد لعرضها عند التسجيل، من المستحسن كتابة ملخصٍ للشروط الخدمة.",
  "add": "إضافة",
  "save": "حفظ"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "serverRules": "Regles del servidor",
  "description": "Un conjunt de regles que seran mostrades abans de registrar-se. Es recomanable configurar un resum dels termes d'ús.",
  "add": "Afegir",
  "save": "Desa"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "serverRules": "Pravidla serveru",
  "description": "Soubor pravidel, která se zobrazí před registrací. Doporučuje se nastavit shrnutí podmínek služby.",
  "add": "Přidat",
  "save": "Uložit"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "serverRules": "Server rules",
  "description": "A set of rules to be displayed before registration. Setting a summary of the Terms of Service is recommended.",
  "add": "Add",
  "save": "Save"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "serverRules": "Serverregeln",
  "description": "Eine Reihe von Regeln, die vor der Registrierung angezeigt werden. Eine Zusammenfassung der Nutzungsbedingungen anzuzeigen ist empfohlen.",
  "add": "Hinzufügen",
  "save": "Speichern"
}
</locale>

<locale locale="en-US" lang="json">
{
  "serverRules": "Server rules",
  "description": "A set of rules to be displayed before registration. Setting a summary of the Terms of Service is recommended.",
  "add": "Add",
  "save": "Save"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "serverRules": "Reglas del servidor",
  "description": "Un conjunto de reglas que serán mostradas antes del registro. Configurar un sumario de términos de servicio es recomendado.",
  "add": "Agregar",
  "save": "Guardar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "serverRules": "Règles du serveur",
  "description": "A set of rules to be displayed before registration. Setting a summary of the Terms of Service is recommended.",
  "add": "Ajouter",
  "save": "Enregistrer"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "serverRules": "Aturan peladen",
  "description": "Daftar peraturan akan ditampilkan sebelum pendaftaran. Mengatur ringkasan dari Syarat dan Ketentuan sangat direkomendasikan.",
  "add": "Tambahkan",
  "save": "Simpan"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "serverRules": "Regolamento",
  "description": "In Europa è necessario mostrare l'informativa sul trattamento dei dati personali, prima della registrazione al servizio.",
  "add": "Aggiungi",
  "save": "Salva"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "serverRules": "サーバールール",
  "description": "新規登録前に表示する、サーバーの簡潔なルールを設定します。内容は利用規約の要約とすることを推奨します。",
  "add": "追加",
  "save": "保存"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "serverRules": "サーバールール",
  "description": "新規登録前に見せる、サーバーのカンタンなルールを決めるで。内容は使うための決め事の要約がええと思うわ。",
  "add": "増やす",
  "save": "とっとく"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "serverRules": "Server rules",
  "description": "A set of rules to be displayed before registration. Setting a summary of the Terms of Service is recommended.",
  "add": "Add",
  "save": "Sekles"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "serverRules": "Server rules",
  "description": "A set of rules to be displayed before registration. Setting a summary of the Terms of Service is recommended.",
  "add": "Add",
  "save": "ಉಳಿಸಿ"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "serverRules": "서버 규칙",
  "description": "회원 가입 이전에 간단하게 표시할 서버 규칙입니다. 이용 약관의 요약으로 구성하는 것을 추천합니다.",
  "add": "추가",
  "save": "저장"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "serverRules": "Server rules",
  "description": "A set of rules to be displayed before registration. Setting a summary of the Terms of Service is recommended.",
  "add": "Toevoegen",
  "save": "Opslaan"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "serverRules": "Server rules",
  "description": "A set of rules to be displayed before registration. Setting a summary of the Terms of Service is recommended.",
  "add": "Legg til",
  "save": "Lagre"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "serverRules": "Server rules",
  "description": "A set of rules to be displayed before registration. Setting a summary of the Terms of Service is recommended.",
  "add": "Dodaj",
  "save": "Zapisz"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "serverRules": "Regras do servidor",
  "description": "Um grupo de regras a ser exibido antes de um cadastro. É recomendado que se faça um resumo dos Termos de Serviço.",
  "add": "Adicionar",
  "save": "Salvar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "serverRules": "Правила сервера",
  "description": "A set of rules to be displayed before registration. Setting a summary of the Terms of Service is recommended.",
  "add": "Добавить",
  "save": "Сохранить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "serverRules": "Server rules",
  "description": "A set of rules to be displayed before registration. Setting a summary of the Terms of Service is recommended.",
  "add": "Pridať",
  "save": "Uložiť"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "serverRules": "กฎของเซิร์ฟเวอร์",
  "description": "ชุดของกฎที่จะแสดงก่อนการลงทะเบียนเราขอแนะนำให้ตั้งค่าสรุปข้อกำหนดในการให้บริการ",
  "add": "เพิ่ม",
  "save": "บันทึก"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "serverRules": "Sunucu kuralları",
  "description": "Kayıt öncesinde gösterilecek bir dizi kural. Hizmet Şartlarının özetini belirlemen önerilir.",
  "add": "Ekle",
  "save": "Kaydet"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "serverRules": "Server rules",
  "description": "A set of rules to be displayed before registration. Setting a summary of the Terms of Service is recommended.",
  "add": "Add",
  "save": "Save"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "serverRules": "Правила сервера",
  "description": "Набір правил які будуть показані перед реєстрацією. Налаштування короткого огляду Умов Сервісу рекомендовано.",
  "add": "Додати",
  "save": "Зберегти"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "serverRules": "Luật của máy chủ",
  "description": "A set of rules to be displayed before registration. Setting a summary of the Terms of Service is recommended.",
  "add": "Thêm",
  "save": "Lưu"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "serverRules": "服务器规则",
  "description": "在新用户注册前显示服务器的简单规则。推荐显示服务条款的主要内容。",
  "add": "添加",
  "save": "保存"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "serverRules": "伺服器規則",
  "description": "設定在註冊頁面顯示的伺服器簡要規則。建議是服務條款的摘要。",
  "add": "新增",
  "save": "儲存"
}
</locale>
