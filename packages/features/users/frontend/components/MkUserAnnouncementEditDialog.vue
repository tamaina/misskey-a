<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	@close="dialog?.close()"
	@closed="emit('closed')"
>
	<template v-if="announcement" #header>:{{ announcement.title }}:</template>
	<template v-else #header>New announcement</template>

	<div>
		<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
			<div class="_gaps_m">
				<MkInput v-model="title">
					<template #label>{{ $locale.sfc.title }}</template>
				</MkInput>
				<MkTextarea v-model="text">
					<template #label>{{ $locale.sfc.text }}</template>
				</MkTextarea>
				<MkRadios
					v-model="icon"
					:options="[
						{ value: 'info', icon: 'ti ti-info-circle' },
						{ value: 'warning', icon: 'ti ti-alert-triangle', iconStyle: 'color: var(--MI_THEME-warn);' },
						{ value: 'error', icon: 'ti ti-circle-x', iconStyle: 'color: var(--MI_THEME-error);' },
						{ value: 'success', icon: 'ti ti-check', iconStyle: 'color: var(--MI_THEME-success);' },
					]"
				>
					<template #label>{{ $locale.sfc.icon }}</template>
				</MkRadios>
				<MkRadios
					v-model="display"
					:options="[
						{ value: 'normal', label: $locale.sfc.normal },
						{ value: 'banner', label: $locale.sfc.banner },
						{ value: 'dialog', label: $locale.sfc.dialog },
					]"
				>
					<template #label>{{ $locale.sfc.display }}</template>
				</MkRadios>
				<MkSwitch v-model="needConfirmationToRead">
					{{ $locale.sfc.needConfirmationToRead }}
					<template #caption>{{ $locale.sfc.needConfirmationToReadDescription }}</template>
				</MkSwitch>
				<MkButton v-if="announcement" danger @click="del()"><i class="ti ti-trash"></i> {{ $locale.sfc.delete }}</MkButton>
			</div>
		</div>
		<div :class="$style.footer">
			<MkButton primary rounded style="margin: 0 auto;" @click="done"><i class="ti ti-check"></i> {{ props.announcement ? $locale.sfc.update : $locale.sfc.create }}</MkButton>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkModalWindow from '@features/ui/frontend/components/MkModalWindow.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';

type AdminAnnouncementType = Misskey.entities.AdminAnnouncementsCreateRequest & { id: string; };

const props = defineProps<{
	user: Misskey.entities.User,
	announcement?: Required<AdminAnnouncementType>,
}>();

const emit = defineEmits<{
	(ev: 'done', v: { deleted?: boolean; updated?: AdminAnnouncementType; created?: AdminAnnouncementType; }): void,
	(ev: 'closed'): void
}>();

const dialog = useTemplateRef('dialog');
const title = ref(props.announcement ? props.announcement.title : '');
const text = ref(props.announcement ? props.announcement.text : '');
const icon = ref(props.announcement ? props.announcement.icon : 'info');
const display = ref(props.announcement ? props.announcement.display : 'dialog');
const needConfirmationToRead = ref(props.announcement ? props.announcement.needConfirmationToRead : false);

async function done() {
	const params = {
		title: title.value,
		text: text.value,
		icon: icon.value,
		imageUrl: null,
		display: display.value,
		needConfirmationToRead: needConfirmationToRead.value,
		userId: props.user.id,
	} satisfies Misskey.entities.AdminAnnouncementsCreateRequest;

	if (props.announcement) {
		await os.apiWithDialog('admin/announcements/update', {
			...params,
			id: props.announcement.id,
		});

		emit('done', {
			updated: {
				...params,
				id: props.announcement.id,
			},
		});

		dialog.value?.close();
	} else {
		const created = await os.apiWithDialog('admin/announcements/create', params);

		emit('done', {
			created: created,
		});

		dialog.value?.close();
	}
}

async function del() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: interpolateLocaleParameters($locale.value.sfc.removeAreYouSure, { x: title.value }),
	});
	if (canceled) return;

	if (props.announcement) {
		await misskeyApi('admin/announcements/delete', {
			id: props.announcement.id,
		});
	}

	emit('done', {
		deleted: true,
	});
	dialog.value?.close();
}
</script>

<style lang="scss" module>
.footer {
	position: sticky;
	bottom: 0;
	left: 0;
	padding: 12px;
	border-top: solid 0.5px var(--MI_THEME-divider);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
}
</style>

<locale lang="json" locale="ar-SA">
{
	"removeAreYouSure": "متأكد من أنك تريد حذف {x}؟",
	"title": "العنوان",
	"text": "النص",
	"icon": "الصورة الرمزية",
	"normal": "عادي",
	"banner": "الصورة الرأسية",
	"dialog": "Dialog",
	"display": "المظهر",
	"needConfirmationToRead": "Require separate read confirmation",
	"needConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"delete": "حذف",
	"update": "حدِّث",
	"create": "أنشئ"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"removeAreYouSure": "Segur que vols esborrar «{x}»?",
	"title": "Títol",
	"text": "Text",
	"icon": "Icona",
	"normal": "Normal",
	"banner": "Bàner",
	"dialog": "Diàleg ",
	"display": "Veure",
	"needConfirmationToRead": "Es necessita confirmació de lectura de la notificació ",
	"needConfirmationToReadDescription": "Si s'activa es mostrarà un diàleg per confirmar la lectura d'aquesta notificació. A més aquesta notificació serà exclosa de qualsevol funcionalitat com \"Marcar tot com a llegit\".",
	"delete": "Elimina",
	"update": "Actualitzar",
	"create": "Crear"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"removeAreYouSure": "Jste si jistí že chcete smazat \"{x}\"?",
	"title": "Titulek",
	"text": "Text",
	"icon": "Avatar",
	"normal": "Normální",
	"banner": "Baner",
	"dialog": "Dialog",
	"display": "Zobrazit",
	"needConfirmationToRead": "Require separate read confirmation",
	"needConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"delete": "Smazat",
	"update": "Aktualizovat",
	"create": "Vytvořit"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"title": "Title",
	"text": "Text",
	"icon": "Icon",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Dialog",
	"display": "Display",
	"needConfirmationToRead": "Require separate read confirmation",
	"needConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"delete": "Delete",
	"update": "Update",
	"create": "Create"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"removeAreYouSure": "Möchtest du „{x}“ wirklich entfernen?",
	"title": "Titel",
	"text": "Text",
	"icon": "Symbol",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Dialogfeld",
	"display": "Anzeigeart",
	"needConfirmationToRead": "Separate Lesebestätigung erfordern",
	"needConfirmationToReadDescription": "Ist dies aktiviert, so wird beim Markieren dieser Ankündigung als gelesen ein separates Bestätigungsfenster angezeigt. Auch wird sie von der \"Alle als gelesen markieren\"-Funktion ausgenommen.",
	"delete": "Löschen",
	"update": "Aktualisieren",
	"create": "Erstellen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"title": "Title",
	"text": "Text",
	"icon": "Icon",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Dialog",
	"display": "Display",
	"needConfirmationToRead": "Require separate read confirmation",
	"needConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"delete": "Delete",
	"update": "Update",
	"create": "Create"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"removeAreYouSure": "¿Desea borrar \"{x}\"?",
	"title": "Título",
	"text": "Texto",
	"icon": "Avatar",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Diálogo",
	"display": "Apariencia",
	"needConfirmationToRead": "Requerir confirmación de lectura aparte",
	"needConfirmationToReadDescription": "Si se habilita esta opción, se pedirá una confirmación de lectura aparte. Además, este anuncio será excluido de cualquier funcionalidad de \"Marcar todos como leídos\".",
	"delete": "Borrar",
	"update": "Actualizar",
	"create": "Crear"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"removeAreYouSure": "Êtes-vous sûr·e de vouloir supprimer « {x} »\u202f?",
	"title": "Titre",
	"text": "Texte",
	"icon": "Avatar",
	"normal": "Normal",
	"banner": "Bannière",
	"dialog": "Dialogue",
	"display": "Affichage",
	"needConfirmationToRead": "Exiger la confirmation de la lecture",
	"needConfirmationToReadDescription": "Si activé, afficher un dialogue de confirmation quand l'annonce est marquée comme lue. Aussi, elle sera exclue de « marquer tout comme lu » .",
	"delete": "Supprimer",
	"update": "Mettre à jour",
	"create": "Créer"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"removeAreYouSure": "Apakah kamu yakin ingin menghapus \"{x}\"?",
	"title": "Judul",
	"text": "Teks",
	"icon": "Avatar",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Dialog",
	"display": "Tampilkan",
	"needConfirmationToRead": "Membutuhkan konfirmasi terpisah bahwa telah dibaca",
	"needConfirmationToReadDescription": "Permintaan terpisah untuk mengonfirmasi menandai pengumuman ini telah dibaca akan ditampilkan apabila fitur ini dinyalakan. Pengumuman ini juga akan dikecualikan dari fungsi \"Tandai semua telah dibaca\".",
	"delete": "Hapus",
	"update": "Perbarui",
	"create": "Buat"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"removeAreYouSure": "Vuoi davvero eliminare \"{x}\"?",
	"title": "Titolo",
	"text": "Testo",
	"icon": "Ritratto",
	"normal": "Normale",
	"banner": "Intestazione",
	"dialog": "Dialogo",
	"display": "Visualizza",
	"needConfirmationToRead": "Conferma di lettura obbligatoria",
	"needConfirmationToReadDescription": "I profili riceveranno una finestra di dialogo che richiede di accettare obbligatoriamente per procedere. Tale richiesta è esente da  \"conferma tutte\".",
	"delete": "Elimina",
	"update": "Aggiorna",
	"create": "Crea"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"removeAreYouSure": "「{x}」を削除しますか？",
	"title": "タイトル",
	"text": "テキスト",
	"icon": "アイコン",
	"normal": "通常",
	"banner": "バナー",
	"dialog": "ダイアログ",
	"display": "表示",
	"needConfirmationToRead": "既読にするのに確認が必要",
	"needConfirmationToReadDescription": "有効にすると、このお知らせを既読にする際に確認ダイアログが表示されます。また、一括既読操作の対象になりません。",
	"delete": "削除",
	"update": "更新",
	"create": "作成"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"removeAreYouSure": "「{x}」はほかしてええか？",
	"title": "タイトル",
	"text": "テキスト",
	"icon": "アイコン",
	"normal": "ええ感じ",
	"banner": "バナー",
	"dialog": "ダイアログ",
	"display": "表示",
	"needConfirmationToRead": "既読にするんやったら確認してや",
	"needConfirmationToReadDescription": "オンにしたら、このお知らせを既読にする時に確認するで。ついでに、一括既読しても既読扱いにならへんで。",
	"delete": "ほかす",
	"update": "更新",
	"create": "作成"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"title": "Title",
	"text": "Text",
	"icon": "Icon",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Dialog",
	"display": "Display",
	"needConfirmationToRead": "Require separate read confirmation",
	"needConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"delete": "Kkes",
	"update": "Update",
	"create": "Create"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"title": "Title",
	"text": "Text",
	"icon": "Icon",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Dialog",
	"display": "Display",
	"needConfirmationToRead": "Require separate read confirmation",
	"needConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"delete": "ಅಳಿಸು",
	"update": "Update",
	"create": "Create"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"removeAreYouSure": "\"{x}\" 을(를) 삭제하시겠습니까?",
	"title": "제목",
	"text": "텍스트",
	"icon": "아바타",
	"normal": "일반",
	"banner": "배너",
	"dialog": "다이얼로그",
	"display": "보기",
	"needConfirmationToRead": "읽음으로 표시하기 전에 확인하기",
	"needConfirmationToReadDescription": "활성화하면 이 공지사항을 읽음으로 표시하기 전에 확인 알림창을 띄웁니다. '모두 읽음'의 대상에서도 제외됩니다.",
	"delete": "삭제",
	"update": "업데이트",
	"create": "생성"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"removeAreYouSure": "Weet je zeker dat je \"{x}\" wil verwijderen?",
	"title": "Titel",
	"text": "Tekst",
	"icon": "Avatar",
	"normal": "Normaal",
	"banner": "Banner",
	"dialog": "Dialog",
	"display": "Weergave",
	"needConfirmationToRead": "Require separate read confirmation",
	"needConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"delete": "Verwijderen",
	"update": "Update",
	"create": "Creëer"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"removeAreYouSure": "Er du sikker på at du vil fjerne \"{x}\"?",
	"title": "Tittel",
	"text": "Tekst",
	"icon": "Avatar",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Dialog",
	"display": "Display",
	"needConfirmationToRead": "Require separate read confirmation",
	"needConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"delete": "Slett",
	"update": "Update",
	"create": "Opprett"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"removeAreYouSure": "Czy na pewno chcesz usunąć „{x}”?",
	"title": "Tytuł",
	"text": "Tekst",
	"icon": "Awatar",
	"normal": "Normalny",
	"banner": "Baner",
	"dialog": "Dialog",
	"display": "Wyświetlanie",
	"needConfirmationToRead": "Require separate read confirmation",
	"needConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"delete": "Usuń",
	"update": "Update",
	"create": "Utwórz"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"removeAreYouSure": "Deseja excluir \"{x}\"?",
	"title": "Título",
	"text": "Texto",
	"icon": "Avatar",
	"normal": "Normal",
	"banner": "Capa",
	"dialog": "Diálogo",
	"display": "Visualizar",
	"needConfirmationToRead": "Exigir confirmação de leitura",
	"needConfirmationToReadDescription": "Um lembrete adicional será exibido para confirmar a leitura do anúncio. Esse anúncio também será excluído de qualquer forma de \"Marcar tudo como lido\".",
	"delete": "Excluir",
	"update": "Atualizar",
	"create": "Criar"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"removeAreYouSure": "Хотите удалить «{x}»?",
	"title": "Заголовок",
	"text": "Текст",
	"icon": "Аватар",
	"normal": "Стабильно",
	"banner": "Шапка",
	"dialog": "Диалог",
	"display": "Отображение",
	"needConfirmationToRead": "Require separate read confirmation",
	"needConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"delete": "Удалить",
	"update": "Обновить",
	"create": "Создать"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"removeAreYouSure": "Naozaj chcete odstrániť \"{x}\"?",
	"title": "Nadpis",
	"text": "Text",
	"icon": "Avatar",
	"normal": "Normálne",
	"banner": "BAnner",
	"dialog": "Dialog",
	"display": "Zobraziť",
	"needConfirmationToRead": "Require separate read confirmation",
	"needConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"delete": "Odstrániť",
	"update": "Update",
	"create": "Vytvoriť"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"removeAreYouSure": "ต้องการลบ “{x}” ใช่ไหม?",
	"title": "หัวข้อ",
	"text": "ข้อความ",
	"icon": "ไอคอน",
	"normal": "ปกติ",
	"banner": "แบนเนอร์",
	"dialog": "ไดอะล็อก",
	"display": "แสดงผล",
	"needConfirmationToRead": "จำเป็นต้องยืนยันว่าอ่านแล้ว",
	"needConfirmationToReadDescription": "กล่องโต้ตอบการยืนยันจะปรากฏขึ้นเมื่อจะทำเครื่องหมายว่าอ่านแล้ว นอกจากนี้ยังทำให้ประกาศนี้ยังไม่ถูกอ่านเมื่อใช้ฟังก์ชั่น “ทำเครื่องหมายฯ ทั้งหมดว่าอ่านแล้ว”",
	"delete": "ลบ",
	"update": "อัปเดต",
	"create": "สร้าง"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"removeAreYouSure": "“{x}” öğesini kaldırmak istediğinizden emin misin?",
	"title": "Başlık",
	"text": "Metin",
	"icon": "Avatar",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Diyalog",
	"display": "Ekran",
	"needConfirmationToRead": "Ayrı okuma onayı gerektirir",
	"needConfirmationToReadDescription": "Etkinleştirildiğinde, bu duyuruyu okundu olarak işaretlemek için ayrı bir onay mesajı görüntülenir. Bu duyuru, “Tümünü okundu olarak işaretle” işlevinden de hariç tutulur.",
	"delete": "Sil",
	"update": "Güncelle",
	"create": "Oluştur"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"removeAreYouSure": "Are you sure that you want to remove \"{x}\"?",
	"title": "Title",
	"text": "Text",
	"icon": "Icon",
	"normal": "Normal",
	"banner": "Banner",
	"dialog": "Dialog",
	"display": "Display",
	"needConfirmationToRead": "Require separate read confirmation",
	"needConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"delete": "ئۆچۈرۈش",
	"update": "Update",
	"create": "Create"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"removeAreYouSure": "Ви впевнені, що хочете видалити \"{x}\"?",
	"title": "Тема",
	"text": "Текст",
	"icon": "Аватар",
	"normal": "Нормальний",
	"banner": "Банер",
	"dialog": "Діалог",
	"display": "Відображення",
	"needConfirmationToRead": "Вимагати окреме підтвердження заради позначення прочитаним",
	"needConfirmationToReadDescription": "Окремий запит заради позначення цього оголошення прочитаним буде показано якщо ввімкнуто. Це оголошення також буде виключено з будь-якого функціоналу \"Позначити як прочитане\".",
	"delete": "Видалити",
	"update": "Оновити",
	"create": "Створити"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"removeAreYouSure": "Bạn có chắc muốn gỡ \"{x}\"?",
	"title": "Tựa đề",
	"text": "Nội dung",
	"icon": "Ảnh đại diện",
	"normal": "Bình thường",
	"banner": "Ảnh bìa",
	"dialog": "Hộp thoại",
	"display": "Hiển thị",
	"needConfirmationToRead": "Require separate read confirmation",
	"needConfirmationToReadDescription": "A separate prompt to confirm marking this announcement as read will be displayed if enabled. This announcement will also be excluded from any \"Mark all as read\" functionality.",
	"delete": "Xóa",
	"update": "Cập nhật",
	"create": "Tạo"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"removeAreYouSure": "要删掉「{x}」吗？",
	"title": "标题",
	"text": "文本",
	"icon": "头像",
	"normal": "正常",
	"banner": "横幅",
	"dialog": "对话框",
	"display": "显示",
	"needConfirmationToRead": "需要确认才能标记为已读",
	"needConfirmationToReadDescription": "若启用，则会在标记已读时会显示确认对话框。此外，它也会不受批量已读操作的影响。",
	"delete": "删除",
	"update": "更新",
	"create": "创建"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"removeAreYouSure": "確定要刪掉「{x}」嗎？",
	"title": "標題",
	"text": "文字",
	"icon": "圖示",
	"normal": "正常",
	"banner": "橫幅",
	"dialog": "對話方塊",
	"display": "檢視",
	"needConfirmationToRead": "必須確認才能標記為已讀",
	"needConfirmationToReadDescription": "啟用代表此公告將顯示對話方塊以確認是否標記為已讀，同時不會受「標記所有公告為已讀」功能影響。",
	"delete": "刪除",
	"update": "更新",
	"create": "新增"
}
</locale>
