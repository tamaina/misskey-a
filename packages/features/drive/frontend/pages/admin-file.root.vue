<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs">
	<div v-if="file" class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<div v-if="tab === 'overview'" class="cxqhhsmd _gaps_m">
			<a class="thumbnail" :href="file.url" target="_blank">
				<MkDriveFileThumbnail class="thumbnail" :file="file" fit="contain"/>
			</a>
			<div>
				<MkKeyValue :copy="file.type" oneline style="margin: 1em 0;">
					<template #key>MIME Type</template>
					<template #value><span class="_monospace">{{ file.type }}</span></template>
				</MkKeyValue>
				<MkKeyValue oneline style="margin: 1em 0;">
					<template #key>Size</template>
					<template #value><span class="_monospace">{{ bytes(file.size) }}</span></template>
				</MkKeyValue>
				<MkKeyValue :copy="file.id" oneline style="margin: 1em 0;">
					<template #key>ID</template>
					<template #value><span class="_monospace">{{ file.id }}</span></template>
				</MkKeyValue>
				<MkKeyValue :copy="file.md5" oneline style="margin: 1em 0;">
					<template #key>MD5</template>
					<template #value><span class="_monospace">{{ file.md5 }}</span></template>
				</MkKeyValue>
				<MkKeyValue oneline style="margin: 1em 0;">
					<template #key>{{ $locale.sfc.createdAt }}</template>
					<template #value><span class="_monospace"><MkTime :time="file.createdAt" mode="detail" style="display: block;"/></span></template>
				</MkKeyValue>
			</div>
			<MkA v-if="file.user" class="user" :to="`/admin/user/${file.user.id}`">
				<MkUserCardMini :user="file.user"/>
			</MkA>

			<div>
				<MkSwitch :modelValue="isSensitive" @update:modelValue="toggleSensitive">{{ $locale.sfc.sensitive }}</MkSwitch>
			</div>

			<div>
				<MkButton danger @click="del"><i class="ti ti-trash"></i> {{ $locale.sfc.delete }}</MkButton>
			</div>
		</div>
		<div v-else-if="tab === 'usage' && info" class="_gaps_m">
			<MkTabs
				v-model:tab="usageTab"
				:tabs="[{
					key: 'note',
					title: 'Note',
				}, {
					key: 'chat',
					title: 'Chat',
				}]"
			/>
			<XNotes v-if="usageTab === 'note'" :fileId="props.file.id"/>
			<XChat v-else-if="usageTab === 'chat'" :fileId="props.file.id"/>
		</div>
		<div v-else-if="tab === 'ip' && info" class="_gaps_m">
			<MkInfo v-if="!iAmAdmin" warn>{{ $locale.sfc.requireAdminForView }}</MkInfo>
			<MkKeyValue v-if="info.requestIp" class="_monospace" :copy="info.requestIp" oneline>
				<template #key>IP</template>
				<template #value>{{ info.requestIp }}</template>
			</MkKeyValue>
			<FormSection v-if="info.requestHeaders">
				<template #label>Headers</template>
				<MkKeyValue v-for="(v, k) in info.requestHeaders" :key="k" class="_monospace">
					<template #key>{{ k }}</template>
					<template #value>{{ v }}</template>
				</MkKeyValue>
			</FormSection>
		</div>
		<div v-else-if="tab === 'raw'" class="_gaps_m">
			<MkObjectView v-if="info" tall :value="info">
			</MkObjectView>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkObjectView from '@features/ui/frontend/components/MkObjectView.vue';
import MkDriveFileThumbnail from '@features/drive/frontend/components/MkDriveFileThumbnail.vue';
import MkKeyValue from '@features/ui/frontend/components/MkKeyValue.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import MkUserCardMini from '@features/users/frontend/components/MkUserCardMini.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import bytes from '@features/ui/frontend/filters/bytes.js';
import * as os from '@features/ui/frontend/os.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { iAmAdmin, iAmModerator } from '@features/auth/frontend/i.js';
import MkTabs from '@features/ui/frontend/components/MkTabs.vue';

const props = defineProps<{
	file: Misskey.entities.DriveFile,
	info: Misskey.entities.AdminDriveShowFileResponse,
}>();

const tab = ref('overview');
const isSensitive = ref(props.file.isSensitive);
const usageTab = ref<'note' | 'chat'>('note');
const XNotes = defineAsyncComponent(() => import('@features/drive/frontend/pages/drive.file.notes.vue'));
const XChat = defineAsyncComponent(() => import('@features/drive/frontend/pages/admin-file.chat.vue'));

async function del() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters($locale.value.sfc.removeAreYouSure, { x: props.file.name }),
	});
	if (canceled) return;

	os.apiWithDialog('drive/files/delete', {
		fileId: props.file.id,
	});
}

async function toggleSensitive() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: isSensitive.value ? $locale.value.sfc.unmarkAsSensitiveConfirm : $locale.value.sfc.markAsSensitiveConfirm,
	});

	if (canceled) return;
	isSensitive.value = !isSensitive.value;

	os.apiWithDialog('drive/files/update', {
		fileId: props.file.id,
		isSensitive: !props.file.isSensitive,
	});
}

const headerActions = computed(() => [{
	text: $locale.value.sfc.openInNewTab,
	icon: 'ti ti-external-link',
	handler: () => {
		window.open(props.file.url, '_blank', 'noopener');
	},
}]);

const headerTabs = computed(() => [{
	key: 'overview',
	title: $locale.value.sfc.overview,
	icon: 'ti ti-info-circle',
}, iAmModerator ? {
	key: 'usage',
	title: $locale.value.sfc.usage,
	icon: 'ti ti-plus',
} : null, iAmModerator ? {
	key: 'ip',
	title: 'IP',
	icon: 'ti ti-password',
} : null, {
	key: 'raw',
	title: 'Raw data',
	icon: 'ti ti-code',
}].filter(x => x != null));
</script>

<style lang="scss" scoped>
.cxqhhsmd {
	> .thumbnail {
		display: block;

		> .thumbnail {
			height: 300px;
			max-width: 100%;
		}
	}

	> .user {
		&:hover {
			text-decoration: none;
		}
	}
}
</style>

<locale lang="json" locale="ar-SA">
{
	"removeAreYouSure": "متأكد من أنك تريد حذف {x}؟",
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "افتح في لسان جديد",
	"overview": "ملخص عام",
	"usage": "Used",
	"createdAt": "أُنشئ في",
	"sensitive": "محتوى حساس",
	"delete": "حذف",
	"requireAdminForView": "لاستعراض هذه الصفحة وجب عليك الولوج كمدير."
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"removeAreYouSure": "Segur que vols esborrar «{x}»?",
	"unmarkAsSensitiveConfirm": "Vols deixar de marcar com a sensible aquest contingut?",
	"markAsSensitiveConfirm": "Vols marcar aquest contingut com a sensible?",
	"openInNewTab": "Obre a una pestanya nova",
	"overview": "Visió General",
	"usage": "Ús ",
	"createdAt": "Creat el",
	"sensitive": "Sensible",
	"delete": "Elimina",
	"requireAdminForView": "Has de ser administrador per poder veure això."
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"removeAreYouSure": "Jste si jistí že chcete smazat \"{x}\"?",
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Otevřít v nové kartě",
	"overview": "Shrnutí",
	"usage": "Used",
	"createdAt": "Vytvořeno",
	"sensitive": "NSFW",
	"delete": "Smazat",
	"requireAdminForView": "Pro zobrazení se musíte přihlásit administrátorským účtem."
}
</locale>

<locale lang="json" locale="da-DK">
{
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Open in new tab",
	"overview": "Overview",
	"usage": "Used",
	"createdAt": "Created at",
	"sensitive": "Sensitive",
	"delete": "Delete",
	"requireAdminForView": "You must log in with an administrator account to view this."
}
</locale>

<locale lang="json" locale="de-DE">
{
	"removeAreYouSure": "Möchtest du „{x}“ wirklich entfernen?",
	"unmarkAsSensitiveConfirm": "Möchtest du die Kennzeichnung dieses Mediums als sensibel aufheben?",
	"markAsSensitiveConfirm": "Möchtest du dieses Medium als sensibel kennzeichnen?",
	"openInNewTab": "In neuem Tab öffnen",
	"overview": "Übersicht",
	"usage": "Nutzung",
	"createdAt": "Erstellt am",
	"sensitive": "Sensibel",
	"delete": "Löschen",
	"requireAdminForView": "Melde dich mit einem Administratorkonto an, um dies einzusehen."
}
</locale>

<locale lang="json" locale="en-US">
{
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Open in new tab",
	"overview": "Overview",
	"usage": "Used",
	"createdAt": "Created at",
	"sensitive": "Sensitive",
	"delete": "Delete",
	"requireAdminForView": "You must log in with an administrator account to view this."
}
</locale>

<locale lang="json" locale="es-ES">
{
	"removeAreYouSure": "¿Desea borrar \"{x}\"?",
	"unmarkAsSensitiveConfirm": "¿Desea eliminar la designación de sensible para este adjunto?",
	"markAsSensitiveConfirm": "¿Desea establecer este medio multimedia(Imagen,vídeo...) como sensible?",
	"openInNewTab": "Abrir en una Nueva Pestaña",
	"overview": "Resumen",
	"usage": "Utilizado",
	"createdAt": "Fecha de creación",
	"sensitive": "Marcado como sensible (NSFW)",
	"delete": "Borrar",
	"requireAdminForView": "Necesitas iniciar sesión como administrador para ver esto."
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"removeAreYouSure": "Êtes-vous sûr·e de vouloir supprimer « {x} »\u202f?",
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Ouvrir dans un nouvel onglet",
	"overview": "Aperçu",
	"usage": "Used",
	"createdAt": "Date de création",
	"sensitive": "Contenu sensible",
	"delete": "Supprimer",
	"requireAdminForView": "Vous devez être connecté avec un compte administrateur pour les visualiser."
}
</locale>

<locale lang="json" locale="id-ID">
{
	"removeAreYouSure": "Apakah kamu yakin ingin menghapus \"{x}\"?",
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Buka di tab baru",
	"overview": "Ikhtisar",
	"usage": "Used",
	"createdAt": "Dibuat pada",
	"sensitive": "Konten sensitif",
	"delete": "Hapus",
	"requireAdminForView": "Kamu harus login dengan akun administrator untuk melihat ini."
}
</locale>

<locale lang="json" locale="it-IT">
{
	"removeAreYouSure": "Vuoi davvero eliminare \"{x}\"?",
	"unmarkAsSensitiveConfirm": "Vuoi davvero indicare come non esplicito il contenuto multimediale?",
	"markAsSensitiveConfirm": "Vuoi davvero indicare questo contenuto multimediale come esplicito?",
	"openInNewTab": "Apri in una nuova scheda",
	"overview": "Anteprima",
	"usage": "In uso",
	"createdAt": "Data di creazione",
	"sensitive": "Esplicito",
	"delete": "Elimina",
	"requireAdminForView": "Per visualizzarli, è necessario aver effettuato l'accesso con un profilo amministratore."
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"removeAreYouSure": "「{x}」を削除しますか？",
	"unmarkAsSensitiveConfirm": "このメディアのセンシティブ指定を解除しますか？",
	"markAsSensitiveConfirm": "このメディアをセンシティブとして設定しますか？",
	"openInNewTab": "新しいタブで開く",
	"overview": "概要",
	"usage": "利用",
	"createdAt": "作成日時",
	"sensitive": "センシティブ",
	"delete": "削除",
	"requireAdminForView": "閲覧するには管理者アカウントでログインしている必要があります。"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"removeAreYouSure": "「{x}」はほかしてええか？",
	"unmarkAsSensitiveConfirm": "このメディアはやっぱきわどくなかったってことでええんか？",
	"markAsSensitiveConfirm": "このメディアをきわどい扱いしときますか？",
	"openInNewTab": "新しいタブで開く",
	"overview": "概要",
	"usage": "利用",
	"createdAt": "作成した日",
	"sensitive": "気いつけて見いや",
	"delete": "ほかす",
	"requireAdminForView": "これ見たいんなら管理者じゃないとアカンわ。"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Open in new tab",
	"overview": "Overview",
	"usage": "Used",
	"createdAt": "Created at",
	"sensitive": "Sensitive",
	"delete": "Kkes",
	"requireAdminForView": "You must log in with an administrator account to view this."
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Open in new tab",
	"overview": "Overview",
	"usage": "Used",
	"createdAt": "Created at",
	"sensitive": "Sensitive",
	"delete": "ಅಳಿಸು",
	"requireAdminForView": "You must log in with an administrator account to view this."
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"removeAreYouSure": "\"{x}\" 을(를) 삭제하시겠습니까?",
	"unmarkAsSensitiveConfirm": "이 미디어의 민감한 미디어 지정을 해제하시겠습니까?",
	"markAsSensitiveConfirm": "이 미디어를 민감한 미디어로 설정하시겠습니까?",
	"openInNewTab": "새 탭에서 열기",
	"overview": "요약",
	"usage": "이용",
	"createdAt": "생성된 날짜",
	"sensitive": "열람 주의",
	"delete": "삭제",
	"requireAdminForView": "열람하려면 관리자 계정으로 로그인해야 합니다."
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"removeAreYouSure": "Weet je zeker dat je \"{x}\" wil verwijderen?",
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "In nieuw tabblad openen",
	"overview": "Overzicht",
	"usage": "Used",
	"createdAt": "Aangemaakt at",
	"sensitive": "NSFW",
	"delete": "Verwijderen",
	"requireAdminForView": "You must log in with an administrator account to view this."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"removeAreYouSure": "Er du sikker på at du vil fjerne \"{x}\"?",
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Åpne i ny fane",
	"overview": "Overview",
	"usage": "Used",
	"createdAt": "Created at",
	"sensitive": "Sensitive",
	"delete": "Slett",
	"requireAdminForView": "You must log in with an administrator account to view this."
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"removeAreYouSure": "Czy na pewno chcesz usunąć „{x}”?",
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Otwórz w nowej karcie",
	"overview": "Przegląd",
	"usage": "Used",
	"createdAt": "Utworzono",
	"sensitive": "NSFW",
	"delete": "Usuń",
	"requireAdminForView": "Aby to zobaczyć, musisz być administratorem"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"removeAreYouSure": "Deseja excluir \"{x}\"?",
	"unmarkAsSensitiveConfirm": "Você deseja remover a definição dessa mídia como sensível?",
	"markAsSensitiveConfirm": "Você deseja definir essa mídia como sensível?",
	"openInNewTab": "Abrir em nova aba",
	"overview": "Visão geral",
	"usage": "Usado",
	"createdAt": "Data de criação",
	"sensitive": "Conteúdo sensível",
	"delete": "Excluir",
	"requireAdminForView": "Para visualizar, é necessário acessar com uma conta de administrador."
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"removeAreYouSure": "Хотите удалить «{x}»?",
	"unmarkAsSensitiveConfirm": "Снять пометку о NSFW контенте?",
	"markAsSensitiveConfirm": "Отметить контент как NSFW?",
	"openInNewTab": "Открыть в новой вкладке",
	"overview": "Обзор",
	"usage": "Used",
	"createdAt": "Создано",
	"sensitive": "Содержимое не для всех",
	"delete": "Удалить",
	"requireAdminForView": "Для просмотра необходимо иметь аккаунт администратора"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"removeAreYouSure": "Naozaj chcete odstrániť \"{x}\"?",
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Otvoriť v novom tabe",
	"overview": "Prehľad",
	"usage": "Used",
	"createdAt": "Vytvorené",
	"sensitive": "NSFW",
	"delete": "Odstrániť",
	"requireAdminForView": "Na zobrazenie sa musíte prihlásiť pod administrátorským účtom."
}
</locale>

<locale lang="json" locale="th-TH">
{
	"removeAreYouSure": "ต้องการลบ “{x}” ใช่ไหม?",
	"unmarkAsSensitiveConfirm": "ต้องการยกเลิกการระบุว่าสื่อนี้มีเนื้อหาละเอียดอ่อนหรือไม่?",
	"markAsSensitiveConfirm": "ต้องการตั้งค่าสื่อนี้ว่าเป็นเนื้อหาละเอียดอ่อนหรือไม่?",
	"openInNewTab": "เปิดในแท็บใหม่",
	"overview": "ภาพรวม",
	"usage": "ใช้แล้ว",
	"createdAt": "สร้างเมื่อ",
	"sensitive": "เนื้อหาที่ละเอียดอ่อน",
	"delete": "ลบ",
	"requireAdminForView": "คุณจำเป็นต้องเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบเพื่อเข้าดูสิ่งนี้"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"removeAreYouSure": "“{x}” öğesini kaldırmak istediğinizden emin misin?",
	"unmarkAsSensitiveConfirm": "Bu medya için hassas işaretini kaldırmak ister misin?",
	"markAsSensitiveConfirm": "Bu medyayı hassas olarak ayarlamak ister misin?",
	"openInNewTab": "Yeni sekmede aç",
	"overview": "Genel Bakış",
	"usage": "Kullanılmış",
	"createdAt": "Oluşturuldu",
	"sensitive": "Hassas",
	"delete": "Sil",
	"requireAdminForView": "Bunu görüntülemek için yönetici hesabıyla oturum açmanız gerekir."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Open in new tab",
	"overview": "Overview",
	"usage": "Used",
	"createdAt": "Created at",
	"sensitive": "Sensitive",
	"delete": "ئۆچۈرۈش",
	"requireAdminForView": "You must log in with an administrator account to view this."
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"removeAreYouSure": "Ви впевнені, що хочете видалити \"{x}\"?",
	"unmarkAsSensitiveConfirm": "Чи бажаєте ви видалити позначку чутливості цього медіа?",
	"markAsSensitiveConfirm": "Чи бажаєте ви позначити цю медіа як чутливу?",
	"openInNewTab": "Відкрити в новій вкладці",
	"overview": "Огляд",
	"usage": "Used",
	"createdAt": "Створено",
	"sensitive": "NSFW",
	"delete": "Видалити",
	"requireAdminForView": "Для перегляду ви повинні увійти в акаунт адміністратора."
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"removeAreYouSure": "Bạn có chắc muốn gỡ \"{x}\"?",
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Mở trong tab mới",
	"overview": "Tổng quan",
	"usage": "Used",
	"createdAt": "Ngày tạo",
	"sensitive": "Nhạy cảm",
	"delete": "Xóa",
	"requireAdminForView": "Bạn phải đăng nhập như là quản trị viên mới xem được."
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"removeAreYouSure": "要删掉「{x}」吗？",
	"unmarkAsSensitiveConfirm": "确定取消标记为敏感内容吗？",
	"markAsSensitiveConfirm": "确定标记此媒体为敏感内容吗？",
	"openInNewTab": "在新标签页中打开",
	"overview": "概览",
	"usage": "使用",
	"createdAt": "创建日期",
	"sensitive": "敏感内容",
	"delete": "删除",
	"requireAdminForView": "需要使用管理员账户登录才能查看。"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"removeAreYouSure": "確定要刪掉「{x}」嗎？",
	"unmarkAsSensitiveConfirm": "要解除這個媒體的敏感設定嗎？",
	"markAsSensitiveConfirm": "要將這個媒體設定為敏感嗎？",
	"openInNewTab": "在新分頁中開啟",
	"overview": "概覽",
	"usage": "使用情況",
	"createdAt": "建立於",
	"sensitive": "敏感內容",
	"delete": "刪除",
	"requireAdminForView": "必須以管理員帳戶登入才可以檢視。"
}
</locale>
