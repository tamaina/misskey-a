<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInfo>{{ $locale.sfc.theseSettingsCanEditLater }}</MkInfo>

	<FormSlot>
		<template #label>{{ $locale.sfc.avatar }}</template>
		<div v-adaptive-bg :class="$style.avatarSection" class="_panel">
			<MkAvatar :class="$style.avatar" :user="$i" @click="setAvatar"/>
			<div style="margin-top: 16px;">
				<MkButton primary rounded inline @click="setAvatar">{{ $locale.sfc.changeAvatar }}</MkButton>
			</div>
		</div>
	</FormSlot>

	<MkInput v-model="name" :max="30" manualSave data-testid="user-setup-user-name">
		<template #label>{{ $locale.sfc.name }}</template>
	</MkInput>

	<MkTextarea v-model="description" :max="500" tall manualSave data-testid="user-setup-user-description">
		<template #label>{{ $locale.sfc.description }}</template>
	</MkTextarea>

	<MkInfo>{{ $locale.sfc.youCanEditMoreSettingsInSettingsPageLater }}</MkInfo>
</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import FormSlot from '@features/ui/frontend/components/form/slot.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import * as os from '@features/ui/frontend/os.js';
import { ensureSignin } from '@features/auth/frontend/i.js';

const $i = ensureSignin();

const name = ref($i.name ?? '');
const description = ref($i.description ?? '');

watch(name, () => {
	os.apiWithDialog('i/update', {
		// 空文字列をnullにしたいので??は使うな

		name: name.value || null,
	}, undefined, {
		'0b3f9f6a-2f4d-4b1f-9fb4-49d3a2fd7191': {
			title: $locale.value.sfc.yourNameContainsProhibitedWords,
			text: $locale.value.sfc.yourNameContainsProhibitedWordsDescription,
		},
	});
});

watch(description, () => {
	os.apiWithDialog('i/update', {
		// 空文字列をnullにしたいので??は使うな

		description: description.value || null,
	});
});

async function setAvatar(ev: PointerEvent) {
	const files = await os.chooseFileFromPc({ multiple: false });
	const file = files[0];

	let originalOrCropped = file;

	const { canceled } = await os.confirm({
		type: 'question',
		text: $locale.value.sfc.cropImageAsk,
		okText: $locale.value.sfc.cropYes,
		cancelText: $locale.value.sfc.cropNo,
	});

	if (!canceled) {
		originalOrCropped = await os.cropImageFile(file, {
			aspectRatio: 1,
		});
	}

	const driveFile = (await os.launchUploader([originalOrCropped], { multiple: false }))[0];

	const i = await os.apiWithDialog('i/update', {
		avatarId: driveFile.id,
	});
	$i.avatarId = i.avatarId;
	$i.avatarUrl = i.avatarUrl;
}
</script>

<style lang="scss" module>
.avatarSection {
	text-align: center;
	padding: 20px;
}

.avatar {
	width: 100px;
	height: 100px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"cropImageAsk": "أتريد اقتصاص هذه الصورة",
	"cropYes": "اقتص",
	"cropNo": "استخدمها كما هي",
	"theseSettingsCanEditLater": "يمكنك تغيير هذه الإعدادات لاحقًا.",
	"avatar": "الصورة الرمزية",
	"changeAvatar": "غيّر الصورة الرمزية",
	"name": "الإسم",
	"description": "السيرة",
	"youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"yourNameContainsProhibitedWords": "El nom conté paraules prohibides ",
	"yourNameContainsProhibitedWordsDescription": "Si de veritat vols fer servir aquest nom posat en contacte amb l'administrador.",
	"cropImageAsk": "Vols retallar la imatge?",
	"cropYes": "Retallar",
	"cropNo": "Fer servir tal qual",
	"theseSettingsCanEditLater": "Aquests ajustos es poden canviar més tard.",
	"avatar": "Icona",
	"changeAvatar": "Canviar l'avatar ",
	"name": "Nom",
	"description": "Biografia ",
	"youCanEditMoreSettingsInSettingsPageLater": "A més d'això, es poden fer diferents configuracions a través de la pàgina de configuració. Assegureu-vos de comprovar-ho més tard."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"cropImageAsk": "Chcete oříznout tenhle obrázek?",
	"cropYes": "Uříznout",
	"cropNo": "Použít tak jak je",
	"theseSettingsCanEditLater": "Tato nastavení můžete vždy později změnit.",
	"avatar": "Avatar",
	"changeAvatar": "Změnit avatara",
	"name": "Jméno",
	"description": "O mně",
	"youCanEditMoreSettingsInSettingsPageLater": "Na stránce \"Nastavení\" můžete nakonfigurovat mnoho dalších nastavení. Nezapomeňte ji navštívit později."
}
</locale>

<locale locale="da-DK" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"cropImageAsk": "Do you want to crop this image?",
	"cropYes": "Crop",
	"cropNo": "Use as-is",
	"theseSettingsCanEditLater": "You can always change these settings later.",
	"avatar": "Avatar",
	"changeAvatar": "Change avatar",
	"name": "Name",
	"description": "Bio",
	"youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="de-DE" lang="json">
{
	"yourNameContainsProhibitedWords": "Dein Name enthält einen verbotenen Begriff",
	"yourNameContainsProhibitedWordsDescription": "Der Name enthält eine verbotene Zeichenfolge. Wende dich an deinen Serveradministrator, wenn du diesen Namen verwenden möchtest.",
	"cropImageAsk": "Möchtest du das Bild zuschneiden?",
	"cropYes": "Zuschneiden",
	"cropNo": "Unbearbeitet verwenden",
	"theseSettingsCanEditLater": "Diese Einstellungen kannst du jederzeit ändern.",
	"avatar": "Profilbild",
	"changeAvatar": "Profilbild ändern",
	"name": "Name",
	"description": "Profilbeschreibung",
	"youCanEditMoreSettingsInSettingsPageLater": "In den Einstellungen findest du noch viele weitere Optionen. Schau dort später mal vorbei."
}
</locale>

<locale locale="en-US" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"cropImageAsk": "Do you want to crop this image?",
	"cropYes": "Crop",
	"cropNo": "Use as-is",
	"theseSettingsCanEditLater": "You can always change these settings later.",
	"avatar": "Avatar",
	"changeAvatar": "Change avatar",
	"name": "Name",
	"description": "Bio",
	"youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="es-ES" lang="json">
{
	"yourNameContainsProhibitedWords": "Tu nombre contiene palabras prohibidas",
	"yourNameContainsProhibitedWordsDescription": "Si deseas usar este nombre, por favor contacta con tu administrador/a de tu servidor",
	"cropImageAsk": "¿Desea recortar la imagen?",
	"cropYes": "Recortar",
	"cropNo": "Usar como está",
	"theseSettingsCanEditLater": "Puedes cambiar estos ajustes más tarde.",
	"avatar": "Avatar",
	"changeAvatar": "Cambiar avatar",
	"name": "Nombre",
	"description": "Descripción",
	"youCanEditMoreSettingsInSettingsPageLater": "Desde la pestaña de \"Configuración\" puedes modificar más ajustes. Asegúrate de visitarla después."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"cropImageAsk": "Voulez-vous recadrer cette image ?",
	"cropYes": "Rogner",
	"cropNo": "Utiliser en l'état",
	"theseSettingsCanEditLater": "You can always change these settings later.",
	"avatar": "Avatar",
	"changeAvatar": "Changer l'avatar",
	"name": "Nom",
	"description": "À propos de moi",
	"youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="id-ID" lang="json">
{
	"yourNameContainsProhibitedWords": "Nama yang ingin dipakai memuat kata terlarang",
	"yourNameContainsProhibitedWordsDescription": "Jika anda ingin menggunakan nama ini, mohon hubungi admin peladen.",
	"cropImageAsk": "Ingin memotong gambar?",
	"cropYes": "Potong",
	"cropNo": "Gunakan apa adanya",
	"theseSettingsCanEditLater": "Kamu selalu bisa mengganti pengaturan ini lain kali.",
	"avatar": "Avatar",
	"changeAvatar": "Ubah avatar",
	"name": "Nama",
	"description": "Bio",
	"youCanEditMoreSettingsInSettingsPageLater": "Ada banyak pengaturan yang dapat kamu atur dari halaman \"Pengaturan\". Pastikan untuk mengunjungi halaman tersebut nanti."
}
</locale>

<locale locale="it-IT" lang="json">
{
	"yourNameContainsProhibitedWords": "Il nome che hai scelto contiene una o più parole vietate",
	"yourNameContainsProhibitedWordsDescription": "Se desideri comunque utilizzare questo nome, contatta l''amministrazione.",
	"cropImageAsk": "Vuoi ritagliare l'immagine?",
	"cropYes": "Ritaglia",
	"cropNo": "Non ritagliare",
	"theseSettingsCanEditLater": "In seguito, potrai cambiare la tua scelta.",
	"avatar": "Foto del profilo",
	"changeAvatar": "Modifica immagine profilo",
	"name": "Nome",
	"description": "Biografia",
	"youCanEditMoreSettingsInSettingsPageLater": "Nella pagina \"Impostazioni\", è possibile personalizzare di più il tuo profilo. Dacci un'occhiata dopo!"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"yourNameContainsProhibitedWords": "変更しようとした名前に禁止された文字列が含まれています",
	"yourNameContainsProhibitedWordsDescription": "名前に禁止されている文字列が含まれています。この名前を使用したい場合は、サーバー管理者にお問い合わせください。",
	"cropImageAsk": "画像をクロップしますか？",
	"cropYes": "クロップする",
	"cropNo": "そのまま使う",
	"theseSettingsCanEditLater": "これらの設定は後から変更できます。",
	"avatar": "アイコン",
	"changeAvatar": "アイコン画像を変更",
	"name": "名前",
	"description": "自己紹介",
	"youCanEditMoreSettingsInSettingsPageLater": "この他にも様々な設定を「設定」ページから行えます。ぜひ後で確認してみてください。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"yourNameContainsProhibitedWords": "その名前は禁止した文字列が含まれとるで",
	"yourNameContainsProhibitedWordsDescription": "その名前は禁止した文字列が含まれとるわ。どうしてもって言うなら、サーバー管理者に言うしかないで。",
	"cropImageAsk": "画像を切り取ってもええか？",
	"cropYes": "切り抜いたる",
	"cropNo": "切り抜かへん",
	"theseSettingsCanEditLater": "この設定はあとから変えれるで。",
	"avatar": "アイコン",
	"changeAvatar": "アバター画像を変更するで",
	"name": "名前",
	"description": "自己紹介",
	"youCanEditMoreSettingsInSettingsPageLater": "これ以外にもいろんな設定を「設定」ページからできるで。後で確認してみてな。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"cropImageAsk": "Do you want to crop this image?",
	"cropYes": "Crop",
	"cropNo": "Use as-is",
	"theseSettingsCanEditLater": "You can always change these settings later.",
	"avatar": "Avatar",
	"changeAvatar": "Change avatar",
	"name": "Name",
	"description": "Bio",
	"youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"cropImageAsk": "Do you want to crop this image?",
	"cropYes": "Crop",
	"cropNo": "Use as-is",
	"theseSettingsCanEditLater": "You can always change these settings later.",
	"avatar": "Avatar",
	"changeAvatar": "Change avatar",
	"name": "Name",
	"description": "Bio",
	"youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"yourNameContainsProhibitedWords": "바꾸려는 이름에 금지된 키워드가 포함되어 있습니다.",
	"yourNameContainsProhibitedWordsDescription": "이름에 금지된 키워드가 있습니다. 이름을 사용해야 하는 경우, 서버 관리자에 문의하세요.",
	"cropImageAsk": "이미지를 자르시겠습니까?",
	"cropYes": "잘라내기",
	"cropNo": "그대로 사용",
	"theseSettingsCanEditLater": "이 설정들은 나중에도 변경할 수 있습니다.",
	"avatar": "아바타",
	"changeAvatar": "아바타 이미지 변경",
	"name": "이름",
	"description": "자기소개",
	"youCanEditMoreSettingsInSettingsPageLater": "이 외에도 '설정' 페이지에서 다양한 설정을 나의 입맛에 맞게 조절할 수 있습니다. 꼭 확인해 보세요!"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"cropImageAsk": "Bijsnijdengevraagd",
	"cropYes": "Crop",
	"cropNo": "Use as-is",
	"theseSettingsCanEditLater": "You can always change these settings later.",
	"avatar": "Avatar",
	"changeAvatar": "Change avatar",
	"name": "Naam",
	"description": "Bio",
	"youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"cropImageAsk": "Do you want to crop this image?",
	"cropYes": "Crop",
	"cropNo": "Use as-is",
	"theseSettingsCanEditLater": "Du kan endre disse innstillingene senere.",
	"avatar": "Avatar",
	"changeAvatar": "Change avatar",
	"name": "Navn",
	"description": "Biografi",
	"youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"cropImageAsk": "Czy chcesz przyciąć obrazek?",
	"cropYes": "Tak, przytnij",
	"cropNo": "Nie chce przycinać",
	"theseSettingsCanEditLater": "You can always change these settings later.",
	"avatar": "Awatar",
	"changeAvatar": "Zmień awatar",
	"name": "Nazwa",
	"description": "Opis",
	"youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"yourNameContainsProhibitedWords": "O seu nome possui palavras proibidas",
	"yourNameContainsProhibitedWordsDescription": "Se você deseja utilizar esse nome, entre em contato com o administrador do servidor.",
	"cropImageAsk": "Deseja recortar esta imagem?",
	"cropYes": "Recortar",
	"cropNo": "Manter deste jeito",
	"theseSettingsCanEditLater": "Você pode alterar estas configurações mais tarde.",
	"avatar": "Avatar",
	"changeAvatar": "Mudar avatar",
	"name": "Nome",
	"description": "Bio",
	"youCanEditMoreSettingsInSettingsPageLater": "Há mais configurações na página \"Configurações\". Não se esqueça de visitá-la mais tarde."
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"yourNameContainsProhibitedWords": "Имя, которое вы пытаетесь изменить, содержит запрещенную строку символов",
	"yourNameContainsProhibitedWordsDescription": "Имя содержит запрещённую строку символов. Если вы хотите использовать это имя, обратитесь к администратору сервера",
	"cropImageAsk": "Обрезать изображение?",
	"cropYes": "Обрезать",
	"cropNo": "Не обрезать",
	"theseSettingsCanEditLater": "Вы всегда сможете поменять эти настройки позже.",
	"avatar": "Аватар",
	"changeAvatar": "Поменять аватар",
	"name": "Имя",
	"description": "О себе",
	"youCanEditMoreSettingsInSettingsPageLater": "Есть ещё много настроек на странице \"Настройки\". Не забудьте заглянуть туда позже."
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"cropImageAsk": "Chcete orezať obrázok?",
	"cropYes": "Crop",
	"cropNo": "Use as-is",
	"theseSettingsCanEditLater": "You can always change these settings later.",
	"avatar": "Avatar",
	"changeAvatar": "Zmeniť avatara",
	"name": "Názov",
	"description": "Bio",
	"youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"yourNameContainsProhibitedWords": "ชื่อของคุณนั้นมีคำที่ต้องห้าม",
	"yourNameContainsProhibitedWordsDescription": "ถ้าหากคุณต้องการใช้ชื่อนี้ กรุณาติดต่อผู้ดูแลระบบของเซิร์ฟเวอร์นะค่ะ",
	"cropImageAsk": "คุณต้องการครอบตัดรูปภาพนี้อย่างงั้นหรือ?",
	"cropYes": "ครอบตัด",
	"cropNo": "ใช้ตามที่เป็นอยู่",
	"theseSettingsCanEditLater": "คุณสามารถเปลี่ยนการตั้งค่าเหล่านี้ได้ในภายหลังได้ตลอดเวลานะ",
	"avatar": "ไอคอน",
	"changeAvatar": "เปลี่ยนไอคอนประจำตัว",
	"name": "ชื่อ",
	"description": "แนะนำตัว",
	"youCanEditMoreSettingsInSettingsPageLater": "สามารถตั้งค่าเพิ่มเติมได้ที่หน้า “การตั้งค่า” อย่าลืมไปเยี่ยมชมภายหลังด้วย"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"yourNameContainsProhibitedWords": "Adınız yasaklanmış kelimeler içeriyor",
	"yourNameContainsProhibitedWordsDescription": "Bu adı kullanmak istiyorsan, lütfen sunucu yöneticinizle iletişime geç.",
	"cropImageAsk": "Bu görüntüyü kırpmak ister misin?",
	"cropYes": "Kırp",
	"cropNo": "Olduğu gibi kullanın",
	"theseSettingsCanEditLater": "Bu ayarları daha sonra istediğin zaman değiştirebilirsin.",
	"avatar": "Avatar",
	"changeAvatar": "Avatar değiştir",
	"name": "Ad",
	"description": "Biyografi",
	"youCanEditMoreSettingsInSettingsPageLater": "“Ayarlar” sayfasından yapılandırabileceğin daha birçok ayar bulunmaktadır. Daha sonra mutlaka ziyaret et."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"yourNameContainsProhibitedWords": "Your name contains prohibited words",
	"yourNameContainsProhibitedWordsDescription": "If you wish to use this name, please contact your server administrator.",
	"cropImageAsk": "Do you want to crop this image?",
	"cropYes": "Crop",
	"cropNo": "Use as-is",
	"theseSettingsCanEditLater": "You can always change these settings later.",
	"avatar": "Avatar",
	"changeAvatar": "Change avatar",
	"name": "Name",
	"description": "Bio",
	"youCanEditMoreSettingsInSettingsPageLater": "There are many more settings you can configure from the \"Settings\" page. Be sure to visit it later."
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"yourNameContainsProhibitedWords": "Ваше ім'я має заборонені слова",
	"yourNameContainsProhibitedWordsDescription": "Якщо ви бажаєте використовувати це ім'я, зв'яжіться з адміністратором вашого сервера.",
	"cropImageAsk": "Бажаєте кадрувати це зображення?",
	"cropYes": "Crop",
	"cropNo": "Використати як є",
	"theseSettingsCanEditLater": "Ви завжди можете змінити ці налаштування пізніше.",
	"avatar": "Аватар",
	"changeAvatar": "Змінити аватар",
	"name": "Ім'я",
	"description": "Про себе",
	"youCanEditMoreSettingsInSettingsPageLater": "Є ще багато налаштувань які ви можете змінити у розділу \"Налаштування\". Обов'язково завітайте туди."
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"yourNameContainsProhibitedWords": "Tên bạn đang cố gắng đổi có chứa chuỗi ký tự bị cấm.",
	"yourNameContainsProhibitedWordsDescription": "Tên có chứa chuỗi ký tự bị cấm. Nếu bạn muốn sử dụng tên này, hãy liên hệ với quản trị viên máy chủ của bạn.",
	"cropImageAsk": "Bạn có muốn cắt ảnh này?",
	"cropYes": "Cắt",
	"cropNo": "Để nguyên",
	"theseSettingsCanEditLater": "Bạn vẫn có thể thay đổi những cài đặt này.",
	"avatar": "Ảnh đại diện",
	"changeAvatar": "Đổi ảnh đại diện",
	"name": "Tên",
	"description": "Tiểu sử",
	"youCanEditMoreSettingsInSettingsPageLater": "Còn rất nhiều những cài đặt khác bạn có thể thay đổi ở trang \"Cài đặt\". Hãy nhớ ghé thăm trong lần sau nhé."
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"yourNameContainsProhibitedWords": "目标用户名包含违禁词",
	"yourNameContainsProhibitedWordsDescription": "用户名内含有违禁词。若想使用此用户名，请联系服务器管理员。",
	"cropImageAsk": "是否要裁剪图像？",
	"cropYes": "去裁剪",
	"cropNo": "就这样吧！",
	"theseSettingsCanEditLater": "也可以在稍后修改这里的设置。",
	"avatar": "头像",
	"changeAvatar": "更换头像",
	"name": "昵称",
	"description": "个人简介",
	"youCanEditMoreSettingsInSettingsPageLater": "还可以在 “设置” 页面进行各种其它设置，稍后来确认一下吧。"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"yourNameContainsProhibitedWords": "您嘗試更改的名稱包含禁止的字串",
	"yourNameContainsProhibitedWordsDescription": "名稱中包含禁止使用的字串。 如果您想使用此名稱，請聯絡您的伺服器管理員。",
	"cropImageAsk": "要剪裁圖片嗎？",
	"cropYes": "裁剪",
	"cropNo": "使用原圖",
	"theseSettingsCanEditLater": "這裡的設定可以在之後變更。",
	"avatar": "大頭貼",
	"changeAvatar": "更換大頭貼",
	"name": "名字",
	"description": "關於我",
	"youCanEditMoreSettingsInSettingsPageLater": "除此之外，還可以在「設定」頁面進行各種設定。之後請確認看看。"
}
</locale>
