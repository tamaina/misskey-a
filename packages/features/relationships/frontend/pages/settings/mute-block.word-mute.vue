<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<div>
		<MkTextarea v-model="mutedWords">
			<span>{{ $locale.sfc.muteWords }}</span>
			<template #caption>{{ $locale.sfc.muteWordsDescription }}<br>{{ $locale.sfc.muteWordsDescription2 }}</template>
		</MkTextarea>
	</div>
	<MkButton primary inline :disabled="!changed" @click="save()"><i class="ti ti-device-floppy"></i> {{ $locale.sfc.save }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import * as os from '@features/ui/frontend/os.js';

const props = defineProps<{
	muted: (string[] | string)[];
}>();

const emit = defineEmits<{
	(ev: 'save', value: (string[] | string)[]): void;
}>();

const render = (mutedWords: (string | string[])[]) => mutedWords.map(x => {
	if (Array.isArray(x)) {
		return x.join(' ');
	} else {
		return x;
	}
}).join('\n');

const mutedWords = ref(render(props.muted));
const changed = ref(false);

watch(mutedWords, () => {
	changed.value = true;
});

async function save() {
	const parseMutes = (mutes: string) => {
		// split into lines, remove empty lines and unnecessary whitespace
		let lines = mutes.trim().split('\n').map(line => line.trim()).filter(line => line !== '') as (string | string[])[];

		// check each line if it is a RegExp or not
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i] as string;
			const regexp = line.match(/^\/(.+)\/(.*)$/);
			if (regexp) {
				// check that the RegExp is valid
				try {
					new RegExp(regexp[1], regexp[2]);
					// note that regex lines will not be split by spaces!
				} catch (err: any) {
					// invalid syntax: do not save, do not reset changed flag
					os.alert({
						type: 'error',
						title: $locale.value.sfc.regexpError,
						text: $l.value.sfc.regexpErrorDescription({ tab: 'word mute', line: i + 1 }) + '\n' + err.toString(),
					});
					// re-throw error so these invalid settings are not saved
					throw err;
				}
			} else {
				lines[i] = line.split(' ');
			}
		}

		return lines;
	};

	let parsed;
	try {
		parsed = parseMutes(mutedWords.value);
	} catch (err) {
		// already displayed error message in parseMutes
		return;
	}

	emit('save', parsed);

	changed.value = false;
}
</script>

<locale locale="ar-SA" lang="json">
{
	"muteWords": "الكلمات المحظورة",
	"muteWordsDescription": "افصل بينهم بمسافة لاستخدام معامل \"و\" أو بسطر لاستخدام معامل \"أو\".",
	"muteWordsDescription2": "احصر الكلمات المفتاحية بين بين شرطتين مائلتين لاستخدامها كتعابير نمطية",
	"save": "حفظ",
	"regexpError": "خطأ في التعبير النمطي",
	"regexpErrorDescription": "An error occurred in the regular expression on line {line} of your {tab} word mutes:"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"muteWords": "Paraules silenciades",
	"muteWordsDescription": "Separar amb espais per la condició AND o amb salts de línia per la condició OR.",
	"muteWordsDescription2": "Envolta les paraules amb barres per fer servir expressions regulars.",
	"save": "Desa",
	"regexpError": "Error de l'expressió regular ",
	"regexpErrorDescription": "S'ha produït un error a l'expressió regular a la línia {line} de les paraules silenciades {tab}:"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"muteWords": "Ztlumená slova",
	"muteWordsDescription": "Podmínku AND oddělujte mezerami, podmínku OR oddělujte řádkovými zlomy.",
	"muteWordsDescription2": "Chcete-li použít regulární výrazy, obklopte klíčová slova lomítky.",
	"save": "Uložit",
	"regexpError": "Chyba v regulérním výrazu",
	"regexpErrorDescription": "Došlo k chybě v regulérním výrazu v řádku {line} tabulky {tab} ztlumených slov:"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"muteWords": "Muted words",
	"muteWordsDescription": "Separate with spaces for an AND condition or with line breaks for an OR condition.",
	"muteWordsDescription2": "Surround keywords with slashes to use regular expressions.",
	"save": "Save",
	"regexpError": "Regular Expression error",
	"regexpErrorDescription": "An error occurred in the regular expression on line {line} of your {tab} word mutes:"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"muteWords": "Stummgeschaltete Wörter",
	"muteWordsDescription": "Zum Nutzen einer \"UND\"-Verknüpfung Einträge mit Leerzeichen trennen, zum Nutzen einer \"ODER\"-Verknüpfung Einträge mit einem Zeilenumbruch trennen.",
	"muteWordsDescription2": "Umgib Schlüsselworter mit Schrägstrichen, um Reguläre Ausdrücke zu verwenden.",
	"save": "Speichern",
	"regexpError": "Fehler in einem regulären Ausdruck",
	"regexpErrorDescription": "Im regulären Ausdruck deiner in Zeile {line} von {tab}en Wortstummschaltungen ist ein Fehler aufgetreten:"
}
</locale>

<locale locale="en-US" lang="json">
{
	"muteWords": "Muted words",
	"muteWordsDescription": "Separate with spaces for an AND condition or with line breaks for an OR condition.",
	"muteWordsDescription2": "Surround keywords with slashes to use regular expressions.",
	"save": "Save",
	"regexpError": "Regular Expression error",
	"regexpErrorDescription": "An error occurred in the regular expression on line {line} of your {tab} word mutes:"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"muteWords": "Palabras que silenciar",
	"muteWordsDescription": "Separar con espacios indica una declaracion And, separar con lineas nuevas indica una declaracion Or。",
	"muteWordsDescription2": "Encerrar las palabras clave entre numerales para usar expresiones regulares",
	"save": "Guardar",
	"regexpError": "Error de la expresión regular",
	"regexpErrorDescription": "Ocurrió un error en la expresión regular en la linea {line} de las palabras muteadas {tab}"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"muteWords": "Mots à filtrer",
	"muteWordsDescription": "Séparer avec des espaces pour la condition AND. Séparer avec un saut de ligne pour une condition OR.",
	"muteWordsDescription2": "Pour utiliser des expressions régulières (regex), mettez les mots-clés entre barres obliques.",
	"save": "Enregistrer",
	"regexpError": "Erreur d’expression régulière",
	"regexpErrorDescription": "Une erreur s'est produite dans l'expression régulière sur la ligne {line} de votre mot muet {tab} :"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"muteWords": "Kata yang dibisukan",
	"muteWordsDescription": "Pisahkan dengan spasi untuk kondisi AND. Pisahkan dengan baris baru untuk kondisi OR.",
	"muteWordsDescription2": "Kurung kata kunci dengan garis miring untuk menggunakan ekspresi reguler.",
	"save": "Simpan",
	"regexpError": "Kesalahan ekspresi reguler",
	"regexpErrorDescription": "Galat terjadi pada baris {line} ekspresi reguler dari {tab} kata yang dibisukan:"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"muteWords": "Parole da filtrare",
	"muteWordsDescription": "Sparando con uno spazio indichi la condizione E (and). Separando con un a capo, indichi la condizione O (or).",
	"muteWordsDescription2": "Se vuoi indicare delle Espressioni Regolari (regexp), metti la condizione all'interno di due slash (/)",
	"save": "Salva",
	"regexpError": "errore regex",
	"regexpErrorDescription": "Si è verificato un errore nell'espressione regolare alla riga {line} della parola muta {tab}:"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"muteWords": "ミュートするワード",
	"muteWordsDescription": "スペースで区切るとAND指定になり、改行で区切るとOR指定になります。",
	"muteWordsDescription2": "キーワードをスラッシュで囲むと正規表現になります。",
	"save": "保存",
	"regexpError": "正規表現エラー",
	"regexpErrorDescription": "{tab}ワードミュートの{line}行目の正規表現にエラーが発生しました:"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"muteWords": "ミュートするワード",
	"muteWordsDescription": "スペースで区切るとAND指定になって、改行で区切るとOR指定になるで。",
	"muteWordsDescription2": "キーワードをスラッシュで囲むと正規表現になるで。",
	"save": "とっとく",
	"regexpError": "正規表現エラー",
	"regexpErrorDescription": "{tab}ワードミュートの{line}行目の正規表現にエラーが出てきたで:"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"muteWords": "Muted words",
	"muteWordsDescription": "Separate with spaces for an AND condition or with line breaks for an OR condition.",
	"muteWordsDescription2": "Surround keywords with slashes to use regular expressions.",
	"save": "Sekles",
	"regexpError": "Regular Expression error",
	"regexpErrorDescription": "An error occurred in the regular expression on line {line} of your {tab} word mutes:"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"muteWords": "Muted words",
	"muteWordsDescription": "Separate with spaces for an AND condition or with line breaks for an OR condition.",
	"muteWordsDescription2": "Surround keywords with slashes to use regular expressions.",
	"save": "ಉಳಿಸಿ",
	"regexpError": "Regular Expression error",
	"regexpErrorDescription": "An error occurred in the regular expression on line {line} of your {tab} word mutes:"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"muteWords": "뮤트할 단어",
	"muteWordsDescription": "공백으로 구분하는 경우 AND, 줄바꿈으로 구분하는 경우 OR로 지정됩니다.",
	"muteWordsDescription2": "정규 표현식을 사용하려면 키워드를 빗금표(/)로 감싸 주세요.",
	"save": "저장",
	"regexpError": "정규 표현식 오류",
	"regexpErrorDescription": "{tab}단어 뮤트 {line}행의 정규 표현식에 오류가 발생했습니다:"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"muteWords": "Muted words",
	"muteWordsDescription": "Separate with spaces for an AND condition or with line breaks for an OR condition.",
	"muteWordsDescription2": "Surround keywords with slashes to use regular expressions.",
	"save": "Opslaan",
	"regexpError": "Fout in reguliere expressie",
	"regexpErrorDescription": "Er is een fout opgetreden in de reguliere expressie op regel {line} van uw {tab} woord dempen:"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"muteWords": "Muted words",
	"muteWordsDescription": "Separate with spaces for an AND condition or with line breaks for an OR condition.",
	"muteWordsDescription2": "Surround keywords with slashes to use regular expressions.",
	"save": "Lagre",
	"regexpError": "Regular Expression error",
	"regexpErrorDescription": "An error occurred in the regular expression on line {line} of your {tab} word mutes:"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"muteWords": "Słowo do wyciszenia",
	"muteWordsDescription": "Separate with spaces for an AND condition or with line breaks for an OR condition.",
	"muteWordsDescription2": "Otocz słowa kluczowe ukośnikami, aby używać wyrażeń regularnych.",
	"save": "Zapisz",
	"regexpError": "Błąd wyrażenia regularnego",
	"regexpErrorDescription": "Wystąpił błąd w wyrażeniu regularnym w linii {line} twoich {tab} wyciszeń:"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"muteWords": "Palavras silenciadas",
	"muteWordsDescription": "Separe com espaços para uma condicional AND (&&) ou por linha para uma condicional OR (||).",
	"muteWordsDescription2": "Cercar palavras-chave com barras para usar expressões regulares (RegEx).",
	"save": "Salvar",
	"regexpError": "Erro na expressão regular",
	"regexpErrorDescription": "Ocorreu um erro na expressão regular na linha {line} da palavra mutada {tab}:"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"muteWords": "Скрыть слово",
	"muteWordsDescription": "Пишите слова через пробел в одной строке, чтобы фильтровать их появление вместе; а если хотите фильтровать любое из них, пишите в отдельных строках.",
	"muteWordsDescription2": "Здесь можно использовать регулярные выражения — просто заключите их между двумя дробными чертами (/).",
	"save": "Сохранить",
	"regexpError": "Ошибка в регулярном выражении",
	"regexpErrorDescription": "В списке {tab} скрытых слов, в строке {line} обнаружена синтаксическая ошибка:"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"muteWords": "Umlčané slová",
	"muteWordsDescription": "Medzerami oddeľte pre podmienku AND a novými riadkami pre podmienku OR.",
	"muteWordsDescription2": "Regulárne výrazy sa použijú keď použijete okolo lomítka.",
	"save": "Uložiť",
	"regexpError": "Chyba v regulárnom výraze",
	"regexpErrorDescription": "Na riadku {line} sa vyskytla chyba v stíšenom slove {tab}."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"muteWords": "ปิดเสียงคำ",
	"muteWordsDescription": "คั่นด้วยเว้นวรรคสำหรับเงื่อนไข AND, หรือขึ้นบรรทัดใหม่สำหรับเงื่อนไข OR",
	"muteWordsDescription2": "ล้อมรอบคีย์เวิร์ดด้วยเครื่องหมายทับเพื่อใช้นิพจน์ทั่วไป",
	"save": "บันทึก",
	"regexpError": "เกิดข้อผิดพลาดใน regular expression",
	"regexpErrorDescription": "เกิดข้อผิดพลาดใน regular expression บรรทัดที่ {line} ของการปิดเสียงคำ {tab} :"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"muteWords": "Sessiz kelimeler",
	"muteWordsDescription": "AND koşulu için boşluklarla, OR koşulu için satır sonlarıyla ayırın.",
	"muteWordsDescription2": "Surround keywords with slashes to use regular expressions.",
	"save": "Kaydet",
	"regexpError": "Düzenli ifade hatası",
	"regexpErrorDescription": "{tab} kelimesinin {line} satırındaki düzenli ifadede bir hata oluştu:"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"muteWords": "Muted words",
	"muteWordsDescription": "Separate with spaces for an AND condition or with line breaks for an OR condition.",
	"muteWordsDescription2": "Surround keywords with slashes to use regular expressions.",
	"save": "Save",
	"regexpError": "Regular Expression error",
	"regexpErrorDescription": "An error occurred in the regular expression on line {line} of your {tab} word mutes:"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"muteWords": "Заглушені слова",
	"muteWordsDescription": "Розділення ключових слів пробілами для \"І\" або з нової лінійки для \"АБО\"",
	"muteWordsDescription2": "Для використання RegEx, ключові слова потрібно вписати поміж слешів \"/\".",
	"save": "Зберегти",
	"regexpError": "Помилка регулярного виразу",
	"regexpErrorDescription": "Сталася помилка в регулярному виразі в рядку {line} вашого слова {tab} слова що ігноруються:"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"muteWords": "Ẩn từ ngữ",
	"muteWordsDescription": "Separate with spaces for an AND condition or with line breaks for an OR condition.",
	"muteWordsDescription2": "Bao quanh các từ khóa bằng dấu gạch chéo để sử dụng cụm từ thông dụng.",
	"save": "Lưu",
	"regexpError": "Lỗi biểu thức",
	"regexpErrorDescription": "Xảy ra lỗi biểu thức ở dòng {line} của {tab} chữ ẩn:"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"muteWords": "要折叠的词",
	"muteWordsDescription": "AND 条件用空格分隔，OR 条件用换行符分隔。",
	"muteWordsDescription2": "正则表达式用斜线包裹",
	"save": "保存",
	"regexpError": "正则表达式错误",
	"regexpErrorDescription": "{tab} 折叠关键词的第 {line} 行的正则表达式有错误："
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"muteWords": "加入靜音文字",
	"muteWordsDescription": "空格代表「以及」（AND），換行代表「或者」（OR）。",
	"muteWordsDescription2": "用斜線包圍關鍵字代表正規表達式。",
	"save": "儲存",
	"regexpError": "正規表達式錯誤",
	"regexpErrorDescription": "{tab} 靜音文字的第 {line} 行的正規表達式有錯誤："
}
</locale>
