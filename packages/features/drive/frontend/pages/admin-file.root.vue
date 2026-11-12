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
					<template #key>{{ globalLocale.env.createdAt }}</template>
					<template #value><span class="_monospace"><MkTime :time="file.createdAt" mode="detail" style="display: block;"/></span></template>
				</MkKeyValue>
			</div>
			<MkA v-if="file.user" class="user" :to="`/admin/user/${file.user.id}`">
				<MkUserCardMini :user="file.user"/>
			</MkA>

			<div>
				<MkSwitch :modelValue="isSensitive" @update:modelValue="toggleSensitive">{{ globalLocale.env.sensitive }}</MkSwitch>
			</div>

			<div>
				<MkButton danger @click="del"><i class="ti ti-trash"></i> {{ globalLocale.env.delete }}</MkButton>
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
import { useLocale } from 'virtual:vite-vue-internationalization';
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
import type { Locale } from 'i18n';

const globalLocale = useLocale<Locale>(import.meta.url);

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
		text: interpolateLocaleParameters(globalLocale.value.env.removeAreYouSure, { x: props.file.name }),
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
	title: globalLocale.value.env.overview,
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
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "افتح في لسان جديد",
	"usage": "Used",
	"requireAdminForView": "لاستعراض هذه الصفحة وجب عليك الولوج كمدير."
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"unmarkAsSensitiveConfirm": "Vols deixar de marcar com a sensible aquest contingut?",
	"markAsSensitiveConfirm": "Vols marcar aquest contingut com a sensible?",
	"openInNewTab": "Obre a una pestanya nova",
	"usage": "Ús ",
	"requireAdminForView": "Has de ser administrador per poder veure això."
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Otevřít v nové kartě",
	"usage": "Used",
	"requireAdminForView": "Pro zobrazení se musíte přihlásit administrátorským účtem."
}
</locale>

<locale lang="json" locale="da-DK">
{
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Open in new tab",
	"usage": "Used",
	"requireAdminForView": "You must log in with an administrator account to view this."
}
</locale>

<locale lang="json" locale="de-DE">
{
	"unmarkAsSensitiveConfirm": "Möchtest du die Kennzeichnung dieses Mediums als sensibel aufheben?",
	"markAsSensitiveConfirm": "Möchtest du dieses Medium als sensibel kennzeichnen?",
	"openInNewTab": "In neuem Tab öffnen",
	"usage": "Nutzung",
	"requireAdminForView": "Melde dich mit einem Administratorkonto an, um dies einzusehen."
}
</locale>

<locale lang="json" locale="en-US">
{
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Open in new tab",
	"usage": "Used",
	"requireAdminForView": "You must log in with an administrator account to view this."
}
</locale>

<locale lang="json" locale="es-ES">
{
	"unmarkAsSensitiveConfirm": "¿Desea eliminar la designación de sensible para este adjunto?",
	"markAsSensitiveConfirm": "¿Desea establecer este medio multimedia(Imagen,vídeo...) como sensible?",
	"openInNewTab": "Abrir en una Nueva Pestaña",
	"usage": "Utilizado",
	"requireAdminForView": "Necesitas iniciar sesión como administrador para ver esto."
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Ouvrir dans un nouvel onglet",
	"usage": "Used",
	"requireAdminForView": "Vous devez être connecté avec un compte administrateur pour les visualiser."
}
</locale>

<locale lang="json" locale="id-ID">
{
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Buka di tab baru",
	"usage": "Used",
	"requireAdminForView": "Kamu harus login dengan akun administrator untuk melihat ini."
}
</locale>

<locale lang="json" locale="it-IT">
{
	"unmarkAsSensitiveConfirm": "Vuoi davvero indicare come non esplicito il contenuto multimediale?",
	"markAsSensitiveConfirm": "Vuoi davvero indicare questo contenuto multimediale come esplicito?",
	"openInNewTab": "Apri in una nuova scheda",
	"usage": "In uso",
	"requireAdminForView": "Per visualizzarli, è necessario aver effettuato l'accesso con un profilo amministratore."
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"unmarkAsSensitiveConfirm": "このメディアのセンシティブ指定を解除しますか？",
	"markAsSensitiveConfirm": "このメディアをセンシティブとして設定しますか？",
	"openInNewTab": "新しいタブで開く",
	"usage": "利用",
	"requireAdminForView": "閲覧するには管理者アカウントでログインしている必要があります。"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"unmarkAsSensitiveConfirm": "このメディアはやっぱきわどくなかったってことでええんか？",
	"markAsSensitiveConfirm": "このメディアをきわどい扱いしときますか？",
	"openInNewTab": "新しいタブで開く",
	"usage": "利用",
	"requireAdminForView": "これ見たいんなら管理者じゃないとアカンわ。"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Open in new tab",
	"usage": "Used",
	"requireAdminForView": "You must log in with an administrator account to view this."
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Open in new tab",
	"usage": "Used",
	"requireAdminForView": "You must log in with an administrator account to view this."
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"unmarkAsSensitiveConfirm": "이 미디어의 민감한 미디어 지정을 해제하시겠습니까?",
	"markAsSensitiveConfirm": "이 미디어를 민감한 미디어로 설정하시겠습니까?",
	"openInNewTab": "새 탭에서 열기",
	"usage": "이용",
	"requireAdminForView": "열람하려면 관리자 계정으로 로그인해야 합니다."
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "In nieuw tabblad openen",
	"usage": "Used",
	"requireAdminForView": "You must log in with an administrator account to view this."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Åpne i ny fane",
	"usage": "Used",
	"requireAdminForView": "You must log in with an administrator account to view this."
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Otwórz w nowej karcie",
	"usage": "Used",
	"requireAdminForView": "Aby to zobaczyć, musisz być administratorem"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"unmarkAsSensitiveConfirm": "Você deseja remover a definição dessa mídia como sensível?",
	"markAsSensitiveConfirm": "Você deseja definir essa mídia como sensível?",
	"openInNewTab": "Abrir em nova aba",
	"usage": "Usado",
	"requireAdminForView": "Para visualizar, é necessário acessar com uma conta de administrador."
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"unmarkAsSensitiveConfirm": "Снять пометку о NSFW контенте?",
	"markAsSensitiveConfirm": "Отметить контент как NSFW?",
	"openInNewTab": "Открыть в новой вкладке",
	"usage": "Used",
	"requireAdminForView": "Для просмотра необходимо иметь аккаунт администратора"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Otvoriť v novom tabe",
	"usage": "Used",
	"requireAdminForView": "Na zobrazenie sa musíte prihlásiť pod administrátorským účtom."
}
</locale>

<locale lang="json" locale="th-TH">
{
	"unmarkAsSensitiveConfirm": "ต้องการยกเลิกการระบุว่าสื่อนี้มีเนื้อหาละเอียดอ่อนหรือไม่?",
	"markAsSensitiveConfirm": "ต้องการตั้งค่าสื่อนี้ว่าเป็นเนื้อหาละเอียดอ่อนหรือไม่?",
	"openInNewTab": "เปิดในแท็บใหม่",
	"usage": "ใช้แล้ว",
	"requireAdminForView": "คุณจำเป็นต้องเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบเพื่อเข้าดูสิ่งนี้"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"unmarkAsSensitiveConfirm": "Bu medya için hassas işaretini kaldırmak ister misin?",
	"markAsSensitiveConfirm": "Bu medyayı hassas olarak ayarlamak ister misin?",
	"openInNewTab": "Yeni sekmede aç",
	"usage": "Kullanılmış",
	"requireAdminForView": "Bunu görüntülemek için yönetici hesabıyla oturum açmanız gerekir."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Open in new tab",
	"usage": "Used",
	"requireAdminForView": "You must log in with an administrator account to view this."
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"unmarkAsSensitiveConfirm": "Чи бажаєте ви видалити позначку чутливості цього медіа?",
	"markAsSensitiveConfirm": "Чи бажаєте ви позначити цю медіа як чутливу?",
	"openInNewTab": "Відкрити в новій вкладці",
	"usage": "Used",
	"requireAdminForView": "Для перегляду ви повинні увійти в акаунт адміністратора."
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"unmarkAsSensitiveConfirm": "Do you want to remove the sensitive designation for this media?",
	"markAsSensitiveConfirm": "Do you want to set this media as sensitive?",
	"openInNewTab": "Mở trong tab mới",
	"usage": "Used",
	"requireAdminForView": "Bạn phải đăng nhập như là quản trị viên mới xem được."
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"unmarkAsSensitiveConfirm": "确定取消标记为敏感内容吗？",
	"markAsSensitiveConfirm": "确定标记此媒体为敏感内容吗？",
	"openInNewTab": "在新标签页中打开",
	"usage": "使用",
	"requireAdminForView": "需要使用管理员账户登录才能查看。"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"unmarkAsSensitiveConfirm": "要解除這個媒體的敏感設定嗎？",
	"markAsSensitiveConfirm": "要將這個媒體設定為敏感嗎？",
	"openInNewTab": "在新分頁中開啟",
	"usage": "使用情況",
	"requireAdminForView": "必須以管理員帳戶登入才可以檢視。"
}
</locale>
