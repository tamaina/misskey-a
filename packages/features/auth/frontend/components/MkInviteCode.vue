<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder>
	<template #label>{{ invite.code }}</template>
	<template #suffix>
		<span v-if="invite.used">{{ $locale.sfc.used }}</span>
		<span v-else-if="isExpired" style="color: var(--MI_THEME-error)">{{ $locale.sfc.expired }}</span>
		<span v-else style="color: var(--MI_THEME-success)">{{ $locale.sfc.unused }}</span>
	</template>
	<template #footer>
		<div class="_buttons">
			<MkButton v-if="!invite.used && !isExpired" primary rounded @click="copyInviteCode()"><i class="ti ti-copy"></i> {{ $locale.sfc.copy }}</MkButton>
			<MkButton v-if="!invite.used || moderator" danger rounded @click="deleteCode()"><i class="ti ti-trash"></i> {{ $locale.sfc.delete }}</MkButton>
		</div>
	</template>

	<div :class="$style.root">
		<div :class="$style.items">
			<div>
				<div :class="$style.label">{{ $locale.sfc.invitationCode }}</div>
				<div class="_selectableAtomic">{{ invite.code }}</div>
			</div>
			<div v-if="moderator">
				<div :class="$style.label">{{ $locale.sfc.inviteCodeCreator }}</div>
				<div v-if="invite.createdBy" :class="$style.user">
					<MkAvatar :user="invite.createdBy" :class="$style.avatar" link preview/>
					<MkUserName :user="invite.createdBy" :nowrap="false"/>
					<div v-if="moderator">({{ invite.createdBy.id }})</div>
				</div>
				<div v-else>system</div>
			</div>
			<div v-if="invite.used">
				<div :class="$style.label">{{ $locale.sfc.registeredUserUsingInviteCode }}</div>
				<div v-if="invite.usedBy" :class="$style.user">
					<MkAvatar :user="invite.usedBy" :class="$style.avatar" link preview/>
					<MkUserName :user="invite.usedBy" :nowrap="false"/>
					<div v-if="moderator">({{ invite.usedBy.id }})</div>
				</div>
				<div v-else>{{ $locale.sfc.unknown }} ({{ $locale.sfc.waitingForMailAuth }})</div>
			</div>
			<div v-if="invite.expiresAt && !invite.used">
				<div :class="$style.label">{{ $locale.sfc.expirationDate }}</div>
				<div><MkTime :time="invite.expiresAt" mode="absolute"/></div>
			</div>
			<div v-if="invite.usedAt">
				<div :class="$style.label">{{ $locale.sfc.inviteCodeUsedAt }}</div>
				<div><MkTime :time="invite.usedAt" mode="absolute"/></div>
			</div>
			<div v-if="moderator">
				<div :class="$style.label">{{ $locale.sfc.createdAt }}</div>
				<div><MkTime :time="invite.createdAt" mode="absolute"/></div>
			</div>
		</div>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkFolder from '@/components/MkFolder.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { copyToClipboard } from '@features/ui/frontend/utility/copy-to-clipboard.js';
import * as os from '@/os.js';

const props = defineProps<{
	invite: Misskey.entities.InviteCode;
	moderator?: boolean;
}>();

const emits = defineEmits<{
	(event: 'deleted', value: string): void;
}>();

const isExpired = computed(() => {
	return props.invite.expiresAt && new Date(props.invite.expiresAt) < new Date();
});

function deleteCode() {
	os.apiWithDialog('invite/delete', {
		inviteId: props.invite.id,
	});
	emits('deleted', props.invite.id);
}

function copyInviteCode() {
	copyToClipboard(props.invite.code);
}
</script>

<style lang="scss" module>
.root {
	text-align: left;
}

.items {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	grid-gap: 12px;
}

.label {
	font-size: 0.85em;
	padding: 0 0 8px 0;
	user-select: none;
	opacity: 0.7;
}

.user {
	display: flex;
	align-items: center;
	gap: 8px;
}

.avatar {
	--height: 24px;
	width: var(--height);
	height: var(--height);
}
</style>

<locale locale="ar-SA" lang="json">
{
  "used": "Used",
  "expired": "منتهية صلاحيته",
  "unused": "غير مستعمَل",
  "copy": "نسخ",
  "delete": "حذف",
  "invitationCode": "رمز الدعوة",
  "inviteCodeCreator": "Invite created by",
  "registeredUserUsingInviteCode": "اِستخدم رمز الدعوة",
  "unknown": "مجهول",
  "waitingForMailAuth": "Email verification pending",
  "expirationDate": "تاريخ انتهاء الصلاحية",
  "inviteCodeUsedAt": "اُستخدم رمز الدعوة في",
  "createdAt": "أُنشئ في"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "used": "Utilitzada",
  "expired": "Caducat",
  "unused": "Sense utilitzar",
  "copy": "Copiar",
  "delete": "Elimina",
  "invitationCode": "Codi d'invitació",
  "inviteCodeCreator": "Invitació creada per",
  "registeredUserUsingInviteCode": "Codi d'invitació fet servir per l'usuari ",
  "unknown": "Desconegut",
  "waitingForMailAuth": "Esperant la verificació per correu electrònic ",
  "expirationDate": "Data de venciment",
  "inviteCodeUsedAt": "Codi d'invitació fet servir el",
  "createdAt": "Creat el"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "used": "Používaná",
  "expired": "Prošlá",
  "unused": "Nepoužívaná",
  "copy": "Kopírovat",
  "delete": "Smazat",
  "invitationCode": "Kód pozvánky",
  "inviteCodeCreator": "Pozvánku vytvořil",
  "registeredUserUsingInviteCode": "Pozvánku používá",
  "unknown": "Neznámý",
  "waitingForMailAuth": "Čeká se na ověření emailu",
  "expirationDate": "Datum expirace",
  "inviteCodeUsedAt": "Kód pozvánky použitý na",
  "createdAt": "Vytvořeno"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "used": "Used",
  "expired": "Expired",
  "unused": "Unused",
  "copy": "Copy",
  "delete": "Delete",
  "invitationCode": "Invitation code",
  "inviteCodeCreator": "Invite created by",
  "registeredUserUsingInviteCode": "Invite used by",
  "unknown": "Unknown",
  "waitingForMailAuth": "Email verification pending",
  "expirationDate": "Expiration date",
  "inviteCodeUsedAt": "Invite code used at",
  "createdAt": "Created at"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "used": "Benutzt",
  "expired": "Abgelaufen",
  "unused": "Unbenutzt",
  "copy": "Kopieren",
  "delete": "Löschen",
  "invitationCode": "Einladungscode",
  "inviteCodeCreator": "Einladung erstellt von",
  "registeredUserUsingInviteCode": "Einladung verwendet von",
  "unknown": "Unbekannt",
  "waitingForMailAuth": "Bestätigungsemail ausstehend",
  "expirationDate": "Ablaufdatum",
  "inviteCodeUsedAt": "Einladung verwendet am",
  "createdAt": "Erstellt am"
}
</locale>

<locale locale="en-US" lang="json">
{
  "used": "Used",
  "expired": "Expired",
  "unused": "Unused",
  "copy": "Copy",
  "delete": "Delete",
  "invitationCode": "Invitation code",
  "inviteCodeCreator": "Invite created by",
  "registeredUserUsingInviteCode": "Invite used by",
  "unknown": "Unknown",
  "waitingForMailAuth": "Email verification pending",
  "expirationDate": "Expiration date",
  "inviteCodeUsedAt": "Invite code used at",
  "createdAt": "Created at"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "used": "Usada",
  "expired": "Caducada",
  "unused": "Sin usar",
  "copy": "Copiar",
  "delete": "Borrar",
  "invitationCode": "Código de invitación",
  "inviteCodeCreator": "Invitación creada por",
  "registeredUserUsingInviteCode": "Invitación usada por",
  "unknown": "Desconocido",
  "waitingForMailAuth": "Verificación de correo pendiente",
  "expirationDate": "Fecha de caducidad",
  "inviteCodeUsedAt": "Código de invitación usado el",
  "createdAt": "Fecha de creación"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "used": "Utilisé",
  "expired": "Expiré",
  "unused": "Non-utilisé",
  "copy": "Copier",
  "delete": "Supprimer",
  "invitationCode": "Code d’invitation",
  "inviteCodeCreator": "Créateur·rice de ce code d'invitation",
  "registeredUserUsingInviteCode": "Code d'invitation utilisé par",
  "unknown": "Inconnu",
  "waitingForMailAuth": "En attente de la vérification de l'adresse courriel",
  "expirationDate": "Date d’expiration",
  "inviteCodeUsedAt": "Code d'invitation utilisé à",
  "createdAt": "Date de création"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "used": "Digunakan",
  "expired": "Kedaluwarsa",
  "unused": "Tidak digunakan",
  "copy": "Salin",
  "delete": "Hapus",
  "invitationCode": "Kode undangan",
  "inviteCodeCreator": "Undangan dibuat oleh",
  "registeredUserUsingInviteCode": "Undangan digunakan oleh",
  "unknown": "Tidak diketahui",
  "waitingForMailAuth": "Menunggu verifikasi surel",
  "expirationDate": "Tanggal kedaluwarsa",
  "inviteCodeUsedAt": "Kode undangan digunakan pada",
  "createdAt": "Dibuat pada"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "used": "Utilizzato",
  "expired": "Scaduto",
  "unused": "Inutilizzato",
  "copy": "Copia",
  "delete": "Elimina",
  "invitationCode": "Codice di invito",
  "inviteCodeCreator": "Codice di invito creato da",
  "registeredUserUsingInviteCode": "Codice di invito usato da",
  "unknown": "Sconosciuto",
  "waitingForMailAuth": "In attesa della verifica email",
  "expirationDate": "Scadenza",
  "inviteCodeUsedAt": "Codice di invito usato alle",
  "createdAt": "Data di creazione"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "used": "使用済み",
  "expired": "期限切れ",
  "unused": "未使用",
  "copy": "コピー",
  "delete": "削除",
  "invitationCode": "招待コード",
  "inviteCodeCreator": "招待コードを作成したユーザー",
  "registeredUserUsingInviteCode": "招待コードを使用したユーザー",
  "unknown": "不明",
  "waitingForMailAuth": "メール認証待ち",
  "expirationDate": "有効期限",
  "inviteCodeUsedAt": "招待コードが使用された日時",
  "createdAt": "作成日時"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "used": "もうつこてる",
  "expired": "期限切れ",
  "unused": "つこてへん",
  "copy": "コピー",
  "delete": "ほかす",
  "invitationCode": "招待コード",
  "inviteCodeCreator": "招待コードを作った人",
  "registeredUserUsingInviteCode": "招待コードを使うた人",
  "unknown": "不明",
  "waitingForMailAuth": "メール認証待ち",
  "expirationDate": "有効期限",
  "inviteCodeUsedAt": "招待コードが使われた時",
  "createdAt": "作成した日"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "used": "Used",
  "expired": "Expired",
  "unused": "Unused",
  "copy": "Copy",
  "delete": "Kkes",
  "invitationCode": "Invitation code",
  "inviteCodeCreator": "Invite created by",
  "registeredUserUsingInviteCode": "Invite used by",
  "unknown": "Unknown",
  "waitingForMailAuth": "Email verification pending",
  "expirationDate": "Expiration date",
  "inviteCodeUsedAt": "Invite code used at",
  "createdAt": "Created at"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "used": "Used",
  "expired": "Expired",
  "unused": "Unused",
  "copy": "Copy",
  "delete": "ಅಳಿಸು",
  "invitationCode": "Invitation code",
  "inviteCodeCreator": "Invite created by",
  "registeredUserUsingInviteCode": "Invite used by",
  "unknown": "Unknown",
  "waitingForMailAuth": "Email verification pending",
  "expirationDate": "Expiration date",
  "inviteCodeUsedAt": "Invite code used at",
  "createdAt": "Created at"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "used": "사용됨",
  "expired": "만료됨",
  "unused": "사용되지 않음",
  "copy": "복사",
  "delete": "삭제",
  "invitationCode": "초대 코드",
  "inviteCodeCreator": "초대 코드 생성자",
  "registeredUserUsingInviteCode": "초대 코드 사용 대상",
  "unknown": "알 수 없음",
  "waitingForMailAuth": "이메일 인증 보류 중",
  "expirationDate": "만료 날짜",
  "inviteCodeUsedAt": "다음에 사용된 초대 코드",
  "createdAt": "생성된 날짜"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "used": "Used",
  "expired": "Expired",
  "unused": "Unused",
  "copy": "Kopiëren",
  "delete": "Verwijderen",
  "invitationCode": "Uitnodigingscode",
  "inviteCodeCreator": "Invite created by",
  "registeredUserUsingInviteCode": "Invite used by",
  "unknown": "Onbekend",
  "waitingForMailAuth": "Email verification pending",
  "expirationDate": "Expiration date",
  "inviteCodeUsedAt": "Invite code used at",
  "createdAt": "Aangemaakt at"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "used": "Used",
  "expired": "Expired",
  "unused": "Unused",
  "copy": "Kopier",
  "delete": "Slett",
  "invitationCode": "Invitation code",
  "inviteCodeCreator": "Invite created by",
  "registeredUserUsingInviteCode": "Invite used by",
  "unknown": "Ukjent",
  "waitingForMailAuth": "Email verification pending",
  "expirationDate": "Expiration date",
  "inviteCodeUsedAt": "Invite code used at",
  "createdAt": "Created at"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "used": "Used",
  "expired": "Expired",
  "unused": "Unused",
  "copy": "Kopiuj",
  "delete": "Usuń",
  "invitationCode": "Kod zaproszenia",
  "inviteCodeCreator": "Invite created by",
  "registeredUserUsingInviteCode": "Invite used by",
  "unknown": "Nieznane",
  "waitingForMailAuth": "Email verification pending",
  "expirationDate": "Expiration date",
  "inviteCodeUsedAt": "Invite code used at",
  "createdAt": "Utworzono"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "used": "Usado",
  "expired": "Expirado",
  "unused": "Não foi usado",
  "copy": "Copiar",
  "delete": "Excluir",
  "invitationCode": "Código de convite",
  "inviteCodeCreator": "Convite criado por",
  "registeredUserUsingInviteCode": "Convite usado por",
  "unknown": "Desconhecido",
  "waitingForMailAuth": "Verificação de e-mail pendente ",
  "expirationDate": "Data de expiração",
  "inviteCodeUsedAt": "Código de convite usado em",
  "createdAt": "Data de criação"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "used": "Использован",
  "expired": "Срок действия приглашения истёк",
  "unused": "Неиспользованное",
  "copy": "Копировать",
  "delete": "Удалить",
  "invitationCode": "Код приглашения",
  "inviteCodeCreator": "Создатель приглашения",
  "registeredUserUsingInviteCode": "Пользователи, которые использовали пригласительный код",
  "unknown": "Неизвестно",
  "waitingForMailAuth": "Подтвердите вашу электронную почту",
  "expirationDate": "Дата истечения",
  "inviteCodeUsedAt": "Дата и время, когда был использован пригласительный код",
  "createdAt": "Создано"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "used": "Used",
  "expired": "Expired",
  "unused": "Unused",
  "copy": "Kopírovať",
  "delete": "Odstrániť",
  "invitationCode": "Kód pozvánky",
  "inviteCodeCreator": "Invite created by",
  "registeredUserUsingInviteCode": "Invite used by",
  "unknown": "Neznáme",
  "waitingForMailAuth": "Email verification pending",
  "expirationDate": "Expiration date",
  "inviteCodeUsedAt": "Invite code used at",
  "createdAt": "Vytvorené"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "used": "ถูกใช้แล้ว",
  "expired": "หมดอายุแล้ว",
  "unused": "ยังไม่ได้ใช้",
  "copy": "คัดลอก",
  "delete": "ลบ",
  "invitationCode": "รหัสเชิญ",
  "inviteCodeCreator": "ผู้ใช้ที่สร้างรหัสเชิญ",
  "registeredUserUsingInviteCode": "ผู้ใช้ที่ใช้รหัสเชิญ",
  "unknown": "ไม่ทราบสถานะ",
  "waitingForMailAuth": "กำลังรอการยืนยันอีเมล",
  "expirationDate": "วันที่หมดอายุ",
  "inviteCodeUsedAt": "วันเวลาที่ใช้รหัสเชิญ",
  "createdAt": "สร้างเมื่อ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "used": "Kullanılmış",
  "expired": "Süresi dolmuş",
  "unused": "Kullanılmamış",
  "copy": "Kopyala",
  "delete": "Sil",
  "invitationCode": "Davet kodu",
  "inviteCodeCreator": "Davet oluşturuldu",
  "registeredUserUsingInviteCode": "Kullanılan davet",
  "unknown": "Bilinmiyor",
  "waitingForMailAuth": "E-Posta doğrulama beklemede",
  "expirationDate": "Son kullanma tarihi",
  "inviteCodeUsedAt": "Kullanılan davet kodu",
  "createdAt": "Oluşturuldu"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "used": "Used",
  "expired": "Expired",
  "unused": "Unused",
  "copy": "Copy",
  "delete": "ئۆچۈرۈش",
  "invitationCode": "Invitation code",
  "inviteCodeCreator": "Invite created by",
  "registeredUserUsingInviteCode": "Invite used by",
  "unknown": "Unknown",
  "waitingForMailAuth": "Email verification pending",
  "expirationDate": "Expiration date",
  "inviteCodeUsedAt": "Invite code used at",
  "createdAt": "Created at"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "used": "Використаний",
  "expired": "Термін дії минув",
  "unused": "Не використано",
  "copy": "Скопіювати",
  "delete": "Видалити",
  "invitationCode": "Код запрошення",
  "inviteCodeCreator": "Запрошення створив(-ла)",
  "registeredUserUsingInviteCode": "Запрошення використав(-ла)",
  "unknown": "Невідомо",
  "waitingForMailAuth": "Очікується підтвердження електронної пошти",
  "expirationDate": "Дата закінчення терміну дії",
  "inviteCodeUsedAt": "Код запрошення використано о",
  "createdAt": "Створено"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "used": "Đã được sử dụng",
  "expired": "Đã hết hạn",
  "unused": "Chưa được sử dụng",
  "copy": "Sao chép",
  "delete": "Xóa",
  "invitationCode": "Mã mời",
  "inviteCodeCreator": "Lời mời đã được tạo bởi",
  "registeredUserUsingInviteCode": "Lời mời đã được sử dụng bởi",
  "unknown": "Chưa biết",
  "waitingForMailAuth": "Đang chờ xác nhận email",
  "expirationDate": "Ngày hết hạn",
  "inviteCodeUsedAt": "Mã mời đã được sử dụng lúc",
  "createdAt": "Ngày tạo"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "used": "已使用",
  "expired": "已过期",
  "unused": "未使用",
  "copy": "复制",
  "delete": "删除",
  "invitationCode": "邀请码",
  "inviteCodeCreator": "生成邀请码的用户",
  "registeredUserUsingInviteCode": "使用了邀请码的用户",
  "unknown": "未知",
  "waitingForMailAuth": "等待验证电子邮件",
  "expirationDate": "有效日期",
  "inviteCodeUsedAt": "邀请码被使用的日期和时间",
  "createdAt": "创建日期"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "used": "已使用",
  "expired": "過期",
  "unused": "未使用",
  "copy": "複製",
  "delete": "刪除",
  "invitationCode": "邀請碼",
  "inviteCodeCreator": "建立了邀請碼的使用者",
  "registeredUserUsingInviteCode": "用了邀請碼的使用者",
  "unknown": "未知",
  "waitingForMailAuth": "等待電子郵件認證",
  "expirationDate": "有效日期",
  "inviteCodeUsedAt": "使用邀請碼的日期和時間",
  "createdAt": "建立於"
}
</locale>
