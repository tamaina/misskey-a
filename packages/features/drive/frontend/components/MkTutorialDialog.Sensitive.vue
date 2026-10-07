<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div style="text-align: center; padding: 0 16px;">{{ $locale.sfc.description }}</div>
	<div>{{ $locale.sfc.tryThisFile }}</div>
	<MkInfo>{{ $locale.sfc.method }}</MkInfo>
	<MkPostForm
		:class="$style.exampleRoot"
		:mock="true"
		:autofocus="false"
		:initialNote="exampleNote"
		@fileChangeSensitive="doSucceeded"
	></MkPostForm>
	<div v-if="onceSucceeded"><b style="color: var(--MI_THEME-accent);"><i class="ti ti-check"></i> {{ $locale.sfc.wellDone }}</b> {{ $locale.sfc.sensitiveSucceeded }}</div>
	<MkFolder>
		<template #label>{{ $locale.sfc.previewNoteText }}</template>
		<MkNote :mock="true" :note="exampleNote" :class="$style.exampleRoot"></MkNote>
	</MkFolder>
</div>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';
import { ref, reactive } from 'vue';
import MkPostForm from '@features/notes/frontend/components/MkPostForm.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkNote from '@features/notes/frontend/components/MkNote.vue';
import { $i } from '@features/auth/frontend/i.js';

const emit = defineEmits<{
	(ev: 'succeeded'): void;
}>();

const onceSucceeded = ref<boolean>(false);

function doSucceeded(fileId: string, to: boolean) {
	if (fileId === exampleNote.fileIds?.[0] && to) {
		onceSucceeded.value = true;
		emit('succeeded');
	}
}

const exampleNote = reactive<Misskey.entities.Note>({
	id: '0000000000',
	createdAt: '2019-04-14T17:30:49.181Z',
	userId: '0000000001',
	user: $i!,
	text: $locale.value.sfc.note,
	cw: null,
	visibility: 'public',
	localOnly: false,
	reactionAcceptance: null,
	renoteCount: 0,
	repliesCount: 1,
	reactionCount: 0,
	reactions: {},
	reactionEmojis: {},
	fileIds: ['0000000002'],
	files: [{
		id: '0000000002',
		createdAt: '2019-04-14T17:30:49.181Z',
		name: 'natto_failed.webp',
		type: 'image/webp',
		md5: 'c44286cf152d0740be0ce5ad45ea85c3',
		size: 827532,
		isSensitive: false,
		blurhash: 'LXNA3TD*XAIA%1%M%gt7.TofRioz',
		properties: {
			width: 256,
			height: 256,
		},
		url: '/client-assets/tutorial/natto_failed.webp',
		thumbnailUrl: '/client-assets/tutorial/natto_failed.webp',
		comment: null,
		folderId: null,
		folder: null,
		userId: null,
		user: null,
	}],
	replyId: null,
	renoteId: null,
});

</script>

<style lang="scss" module>
.exampleRoot {
	border-radius: var(--MI-radius);
	border: var(--MI_THEME-panelBorder);
	background: var(--MI_THEME-panel);
}

.divider {
	height: 1px;
	background: var(--MI_THEME-divider);
}

.image {
	max-width: 300px;
	margin: 0 auto;
}

.post {
	position: relative;
	display: block;
	width: 100%;
	height: 40px;
	color: var(--MI_THEME-fgOnAccent);
	font-weight: bold;
	text-align: left;

	&::before {
		content: "";
		display: block;
		width: calc(100% - 38px);
		height: 100%;
		margin: auto;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--MI_THEME-buttonGradateA), var(--MI_THEME-buttonGradateB));
	}

}

.postIcon {
	position: relative;
	margin-left: 30px;
	margin-right: 8px;
	width: 32px;
}

.postText {
	position: relative;
	line-height: 40px;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"description": "For attachments that are required by server guidelines or that should not be left intact, add a \"sensitive\" flag.",
	"tryThisFile": "Try marking the image attached in this form as sensitive!",
	"method": "To mark an attachment as sensitive, click the file thumbnail, open the menu, and click \"Mark as Sensitive.\"",
	"wellDone": "Well done!",
	"sensitiveSucceeded": "When attaching files, please set sensitivities in accordance with the server guidelines.",
	"previewNoteText": "اعرض معاينة",
	"note": "Oops, messed up opening the natto lid..."
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"description": "Per adjunts que sigui requerit per les normes del servidor o que puguin contenir material sensible, s'ha d'afegir l'opció 'sensible'.",
	"tryThisFile": "Prova de marcar la imatge adjunta en aquest formulari com a sensible!",
	"method": "Per marcar un adjunt com a sensible, fes clic a la miniatura de l'adjunt, obre el menú i fes clic a 'Marcar com a sensible'.",
	"wellDone": "Ben fet!",
	"sensitiveSucceeded": "Quan adjuntis fitxers si us plau marca la sensibilitat seguint les normes del servidor.",
	"previewNoteText": "Mostrar vista prèvia",
	"note": "Oops! L'he fet bona en obrir la tapa de Nocilla..."
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"description": "For attachments that are required by server guidelines or that should not be left intact, add a \"sensitive\" flag.",
	"tryThisFile": "Try marking the image attached in this form as sensitive!",
	"method": "To mark an attachment as sensitive, click the file thumbnail, open the menu, and click \"Mark as Sensitive.\"",
	"wellDone": "Well done!",
	"sensitiveSucceeded": "When attaching files, please set sensitivities in accordance with the server guidelines.",
	"previewNoteText": "Zobrazit náhled",
	"note": "Oops, messed up opening the natto lid..."
}
</locale>

<locale locale="da-DK" lang="json">
{
	"description": "For attachments that are required by server guidelines or that should not be left intact, add a \"sensitive\" flag.",
	"tryThisFile": "Try marking the image attached in this form as sensitive!",
	"method": "To mark an attachment as sensitive, click the file thumbnail, open the menu, and click \"Mark as Sensitive.\"",
	"wellDone": "Well done!",
	"sensitiveSucceeded": "When attaching files, please set sensitivities in accordance with the server guidelines.",
	"previewNoteText": "Show preview",
	"note": "Oops, messed up opening the natto lid..."
}
</locale>

<locale locale="de-DE" lang="json">
{
	"description": "Markiere Anhänge als sensibel, die aufgrund von den Serverregeln nicht sichtbar sein sollen.",
	"tryThisFile": "Versuche, das angehängte Bild als sensibel zu markieren!",
	"method": "Um einen Anhang als sensibel zu kennzeichnen, klicke auf das Vorschaubild der Datei, um das Menü zu öffnen, und klicke auf „Als sensibel markieren“.",
	"wellDone": "Gut gemacht!",
	"sensitiveSucceeded": "Wenn du Dateien anhängst, stelle bitte die Sensibilität entsprechend der Serverrichtlinien ein.",
	"previewNoteText": "Vorschau anzeigen",
	"note": "Ups, ich habe es vergeigt, den Natto-Deckel zu öffnen..."
}
</locale>

<locale locale="en-US" lang="json">
{
	"description": "For attachments that are required by server guidelines or that should not be left intact, add a \"sensitive\" flag.",
	"tryThisFile": "Try marking the image attached in this form as sensitive!",
	"method": "To mark an attachment as sensitive, click the file thumbnail, open the menu, and click \"Mark as Sensitive.\"",
	"wellDone": "Well done!",
	"sensitiveSucceeded": "When attaching files, please set sensitivities in accordance with the server guidelines.",
	"previewNoteText": "Show preview",
	"note": "Oops, messed up opening the natto lid..."
}
</locale>

<locale locale="es-ES" lang="json">
{
	"description": "Cuando las normas del servidor lo requieran, o el contenido lo requiera, marca la opción de \"contenido sensible\" para el adjunto.",
	"tryThisFile": "¡Prueba a marcar la imagen adjunta como contenido sensible!",
	"method": "Para marcar un adjunto como sensible, haz clic en la miniatura, abre el menú, y haz clic en \"Marcar como sensible\".",
	"wellDone": "¡Bien hecho!",
	"sensitiveSucceeded": "Cuando adjuntes archivos, por favor, ten en cuenta las normas del servidor para marcarlos como contenido sensible.",
	"previewNoteText": "Mostrar vista preliminar",
	"note": "Ups, la he liado al abrir la tapa del natto..."
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"description": "Attachez un drapeau « sensible » aux fichiers joints selon les règles du serveur ou si vous ne voulez pas que le fichier soit vu directement.",
	"tryThisFile": "Essayez de marquer l'image jointe à ce formulaire de publication comme sensible !",
	"method": "Pour marquer un fichier joint comme sensible, cliquez sur la vignette du fichier pour ouvrir le menu et cliquez sur « marquer comme sensible » .",
	"wellDone": "Bien joué !",
	"sensitiveSucceeded": "Quand vous joignez des fichiers, veuillez indiquer la sensibilité selon les règles du serveur.",
	"previewNoteText": "Voir l'aperçu",
	"note": "Oups, j'ai échoué à ouvrir le couvercle du natto..."
}
</locale>

<locale locale="id-ID" lang="json">
{
	"description": "Fungsi ini digunakan untuk lampiran yang dibutuhkan oleh panduan peladen atau sesuatu yang seharusnya tidak boleh dibiarkan begitu saja dengan cara menambahkan penanda \"sensitif\".",
	"tryThisFile": "Coba tandai gambar yang dilampirkan pada form ini sebagai sensitif!",
	"method": "Untuk menandai lampiran sebagai sensitif, klik gambar pada berkas, buka menu, lalu klik \"Tandai sebagai sensitif\".",
	"wellDone": "Kerja bagus!",
	"sensitiveSucceeded": "Ketika melampirkan berkas, mohon atur sensitifitas sesuai dengan panduan peladen.",
	"previewNoteText": "Tampilkan pratinjau",
	"note": "Ups, kesalahan banget buka penutup wadah natto..."
}
</locale>

<locale locale="it-IT" lang="json">
{
	"description": "Si fa quando è richiesto dal regolamento del server o quando non devono essere visibili immediatamente.",
	"tryThisFile": "Prova a rendere esplicite le immagini allegate a questo modulo!",
	"method": "Tocca il file, si aprirà il menu, scegli la voce \"Segna come esplicito\"",
	"wellDone": "Ottimo lavoro!",
	"sensitiveSucceeded": "Quando alleghi file, assicurati di indicare se è materiale esplicito in modo appropriato, decidi in base al regolamento dell'istanza.",
	"previewNoteText": "Anteprima del testo",
	"note": "AAA! Ho rotto il coperchio del natto... (fagioli di soia fermentati)"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"description": "サーバーのガイドラインにより必要とされる際や、そのまま見れる状態にしておくべきではない添付ファイルには、「センシティブ」設定を付けます。",
	"tryThisFile": "試しに、このフォームに添付された画像をセンシティブにしてみてください！",
	"method": "添付ファイルをセンシティブにする際は、そのファイルをクリックしてメニューを開き、「センシティブとして設定」をクリックします。",
	"wellDone": "よくできました",
	"sensitiveSucceeded": "ファイルを添付する際は、サーバーのガイドラインに従ってセンシティブを適切に設定してください。",
	"previewNoteText": "本文をプレビュー",
	"note": "納豆のフタ開けるのミスったわね…"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"description": "サーバーのガイドラインに書いてあったり、そのままおっぴろげとくのはあんま良うないファイルには「センシティブ」っちゅう設定をつけるんや。",
	"tryThisFile": "試しに、これにのっけてある画像をセンシティブにしてみいや！",
	"method": "のっけたファイルをセンシティブにするときは、そのファイルを押してメニュー開けて、「ちょっとこれはアカン」を押すんよ。",
	"wellDone": "やるやん",
	"sensitiveSucceeded": "ファイルをのっけるときは、サーバーの言うこと聞いてちゃんと設定するんやで。",
	"previewNoteText": "本文を下見するで",
	"note": "納豆のフタ開けるときにやらかしてもうた…"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"description": "For attachments that are required by server guidelines or that should not be left intact, add a \"sensitive\" flag.",
	"tryThisFile": "Try marking the image attached in this form as sensitive!",
	"method": "To mark an attachment as sensitive, click the file thumbnail, open the menu, and click \"Mark as Sensitive.\"",
	"wellDone": "Well done!",
	"sensitiveSucceeded": "When attaching files, please set sensitivities in accordance with the server guidelines.",
	"previewNoteText": "Show preview",
	"note": "Oops, messed up opening the natto lid..."
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"description": "For attachments that are required by server guidelines or that should not be left intact, add a \"sensitive\" flag.",
	"tryThisFile": "Try marking the image attached in this form as sensitive!",
	"method": "To mark an attachment as sensitive, click the file thumbnail, open the menu, and click \"Mark as Sensitive.\"",
	"wellDone": "Well done!",
	"sensitiveSucceeded": "When attaching files, please set sensitivities in accordance with the server guidelines.",
	"previewNoteText": "Show preview",
	"note": "Oops, messed up opening the natto lid..."
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"description": "서버의 가이드라인에 따라 필요한 이미지, 또는 그대로 노출되기에 부적절한 미디어는 '열람 주의'를 설정해 주세요.",
	"tryThisFile": "이 입력란에 첨부된 이미지를 열람 주의로 설정해 보세요!",
	"method": "첨부 파일을 열람 주의로 설정하려면, 해당 파일을 클릭하여 메뉴를 열고, '열람주의로 설정'을 클릭합니다.",
	"wellDone": "잘 하셨습니다",
	"sensitiveSucceeded": "파일을 첨부할 때에는 서버의 가이드라인에 따라 적절히 열람주의를 설정해 주시기 바랍니다.",
	"previewNoteText": "본문 미리보기",
	"note": "낫또 뚜껑 뜯다가 실수했다…"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"description": "For attachments that are required by server guidelines or that should not be left intact, add a \"sensitive\" flag.",
	"tryThisFile": "Try marking the image attached in this form as sensitive!",
	"method": "To mark an attachment as sensitive, click the file thumbnail, open the menu, and click \"Mark as Sensitive.\"",
	"wellDone": "Well done!",
	"sensitiveSucceeded": "When attaching files, please set sensitivities in accordance with the server guidelines.",
	"previewNoteText": "Show voorproefje",
	"note": "Oops, messed up opening the natto lid..."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"description": "For attachments that are required by server guidelines or that should not be left intact, add a \"sensitive\" flag.",
	"tryThisFile": "Try marking the image attached in this form as sensitive!",
	"method": "To mark an attachment as sensitive, click the file thumbnail, open the menu, and click \"Mark as Sensitive.\"",
	"wellDone": "Well done!",
	"sensitiveSucceeded": "When attaching files, please set sensitivities in accordance with the server guidelines.",
	"previewNoteText": "Show preview",
	"note": "Oops, messed up opening the natto lid..."
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"description": "For attachments that are required by server guidelines or that should not be left intact, add a \"sensitive\" flag.",
	"tryThisFile": "Try marking the image attached in this form as sensitive!",
	"method": "To mark an attachment as sensitive, click the file thumbnail, open the menu, and click \"Mark as Sensitive.\"",
	"wellDone": "Well done!",
	"sensitiveSucceeded": "When attaching files, please set sensitivities in accordance with the server guidelines.",
	"previewNoteText": "Pokaż podgląd",
	"note": "Oops, messed up opening the natto lid..."
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"description": "Para anexos cujo conteúdo é considerado sensível pelas diretrizes do servidor ou quando pretende-se esconder o seu conteúdo, adicione o sinal \"sensível\".",
	"tryThisFile": "Tente marcar a imagem anexada como sensível!",
	"method": "Para marcar um anexo como sensível, clique na sua miniatura, abra o menu e clique \"Marcar como sensível\".",
	"wellDone": "Ótimo!",
	"sensitiveSucceeded": "Ao anexar arquivos, por favor atribua uma sensibilidade coerente com as diretrizes da instância.",
	"previewNoteText": "Visualizar Nota",
	"note": "Opa, me atrapalhei abrindo a tampa do natô..."
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"description": "For attachments that are required by server guidelines or that should not be left intact, add a \"sensitive\" flag.",
	"tryThisFile": "Try marking the image attached in this form as sensitive!",
	"method": "To mark an attachment as sensitive, click the file thumbnail, open the menu, and click \"Mark as Sensitive.\"",
	"wellDone": "Отлично!",
	"sensitiveSucceeded": "When attaching files, please set sensitivities in accordance with the server guidelines.",
	"previewNoteText": "Предварительный просмотр",
	"note": "Oops, messed up opening the natto lid..."
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"description": "For attachments that are required by server guidelines or that should not be left intact, add a \"sensitive\" flag.",
	"tryThisFile": "Try marking the image attached in this form as sensitive!",
	"method": "To mark an attachment as sensitive, click the file thumbnail, open the menu, and click \"Mark as Sensitive.\"",
	"wellDone": "Well done!",
	"sensitiveSucceeded": "When attaching files, please set sensitivities in accordance with the server guidelines.",
	"previewNoteText": "Zobraziť náhľad",
	"note": "Oops, messed up opening the natto lid..."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"description": "ทำเครื่องหมายไฟล์แนบว่า “มีเนื้อหาละเอียดอ่อน” เมื่อจำเป็นตามแนวทางของเซิร์ฟเวอร์ หรือเมื่อไฟล์แนบไม่ควรปรากฏให้เห็น",
	"tryThisFile": "ลองทำให้รูปภาพที่แนบมากับแบบฟอร์มนี้มีเนื้อหาละเอียดอ่อน!",
	"method": "หากต้องการทำให้ไฟล์แนบมีเนื้อหาละเอียดอ่อน ให้คลิกไฟล์เพื่อเปิดเมนูแล้วคลิก “ทำเครื่องหมายว่ามีเนื้อหาละเอียดอ่อน”",
	"wellDone": "ทำได้ดีมาก!",
	"sensitiveSucceeded": "เมื่อแนบไฟล์ โปรดตั้งค่าเครื่องหมายว่ามีเนื้อหาละเอียดอ่อนตามแนวทางของเซิร์ฟเวอร์",
	"previewNoteText": "แสดงตัวอย่าง",
	"note": "อุ้ย นัตโตะ ฝาเปิดเละเทะ..."
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"description": "Sunucu kuralları gereği gerekli olan veya bozulmaması gereken ekler için “hassas” bayrağı ekle.",
	"tryThisFile": "Bu forma ekli resmi hassas olarak işaretlemeyi dene!",
	"method": "Bir eki hassas olarak işaretlemek için, dosya küçük resmini tıklayın, menüyü açın ve “Hassas Olarak İşaretle” seçeneğini tıklayın.",
	"wellDone": "Tebrikler!",
	"sensitiveSucceeded": "Dosya eklerken, lütfen sunucu kurallarına uygun olarak hassasiyet ayarlarını yapın.",
	"previewNoteText": "Önizlemeyi göster",
	"note": "Oops, natto kapağını açarken berbat ettim..."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"description": "For attachments that are required by server guidelines or that should not be left intact, add a \"sensitive\" flag.",
	"tryThisFile": "Try marking the image attached in this form as sensitive!",
	"method": "To mark an attachment as sensitive, click the file thumbnail, open the menu, and click \"Mark as Sensitive.\"",
	"wellDone": "Well done!",
	"sensitiveSucceeded": "When attaching files, please set sensitivities in accordance with the server guidelines.",
	"previewNoteText": "Show preview",
	"note": "Oops, messed up opening the natto lid..."
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"description": "Позначайте як чутливі додатки якщо цього вимагають правила серверу, або якщо ви вважаєте, що це потрібно.",
	"tryThisFile": "Спробуйте позначити додане зображення як чутливе!",
	"method": "Щоб позначити додаток як чутливий, натисніть на мініатюру файлу, відкрийте меню, й натисніть \"Позначити як чутливе\".",
	"wellDone": "Ай, молодець! Відмінно!",
	"sensitiveSucceeded": "Коли додаєте файли, будь ласка, позначайте їх як чутливі у разі вимозі цього правилами серверу.",
	"previewNoteText": "Показати передогляд",
	"note": "Упс, щось я зробив не так..."
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"description": "For attachments that are required by server guidelines or that should not be left intact, add a \"sensitive\" flag.",
	"tryThisFile": "Try marking the image attached in this form as sensitive!",
	"method": "To mark an attachment as sensitive, click the file thumbnail, open the menu, and click \"Mark as Sensitive.\"",
	"wellDone": "Làm tốt!",
	"sensitiveSucceeded": "When attaching files, please set sensitivities in accordance with the server guidelines.",
	"previewNoteText": "Hiện xem trước",
	"note": "Oops, messed up opening the natto lid..."
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"description": "对于服务器守则所要求的，或不适合直接展示的附件，请添加 “敏感” 标记。",
	"tryThisFile": "试试看！将添加到该窗口的图像标记为敏感内容。",
	"method": "要标注附件为敏感内容，请单击该文件以打开菜单，然后单击 “标记为敏感内容”。",
	"wellDone": "做得好",
	"sensitiveSucceeded": "添加附件时，请遵循服务器的条款、适当设定敏感内容。",
	"previewNoteText": "预览正文",
	"note": "拆纳豆包装时失手了…"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"description": "如果伺服器的服務條款有規範，又或者不適合直接展示的附件，請記得加上「敏感」標記。",
	"tryThisFile": "試試看！把附加在發文表單的圖像檔案標記為敏感內容。",
	"method": "若要使上傳附件標記為敏感內容，請按一下該檔案以開啟選單，然後點擊「標記為敏感內容」。",
	"wellDone": "做得好",
	"sensitiveSucceeded": "上傳附件時，請務必根據伺服器的服務條款適當設定敏感內容。",
	"previewNoteText": "預覽文本",
	"note": "打開納豆的包裝失敗了…"
}
</locale>
