<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkInfo>{{ $locale.sfc.title }}</MkInfo>
	<MkTextarea v-model="instanceMutes">
		<template #label>{{ $locale.sfc.heading }}</template>
		<template #caption>{{ $locale.sfc.instanceMuteDescription }}<br>{{ $locale.sfc.instanceMuteDescription2 }}</template>
	</MkTextarea>
	<MkButton primary :disabled="!changed" @click="save()"><i class="ti ti-device-floppy"></i> {{ $locale.sfc.save }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';

const $i = ensureSignin();

const instanceMutes = ref($i.mutedInstances.join('\n'));
const changed = ref(false);

async function save() {
	let mutes = instanceMutes.value
		.trim().split('\n')
		.map(el => el.trim())
		.filter(el => el);

	await misskeyApi('i/update', {
		mutedInstances: mutes,
	});

	changed.value = false;

	// Refresh filtered list to signal to the user how they've been saved
	instanceMutes.value = mutes.join('\n');
}

watch(instanceMutes, () => {
	changed.value = true;
});
</script>

<locale locale="ar-SA" lang="json">
{
  "title": "يخفي ملاحظات الخوادم المسرودة.",
  "heading": "قائمة الخوادم المحجوبة",
  "instanceMuteDescription": "هذه سيحجب كل ملاحظات الخوادم المحجوبة ومشاركاتها والردود على تلك الملاحظات حتى وإن كانت من خادم غير محجوب.",
  "instanceMuteDescription2": "مدخلة لكل سطر",
  "save": "حفظ"
}
</locale>

<locale locale="ca-ES" lang="json">
{
  "title": "Ocultar notes de les instàncies en la llista.",
  "heading": "Llista d'instàncies a silenciar",
  "instanceMuteDescription": "Silencia tots els impulsos dels servidors seleccionats, també els usuaris que responen a altres d'un servidor silenciat.",
  "instanceMuteDescription2": "Separar amb salts de línia",
  "save": "Desa"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
  "title": "Skryje poznámky z uvedených případů.",
  "heading": "Seznam instancí, které mají být ztlumeny",
  "instanceMuteDescription": "Tímhle se ztlumí všechny poznámky/poznámky z uvedených instancí, včetně poznámek uživatelů, kteří odpovídají uživateli ze ztlumené instance.",
  "instanceMuteDescription2": "Oddělte novými řádky",
  "save": "Uložit"
}
</locale>

<locale locale="da-DK" lang="json">
{
  "title": "Hides notes from listed instances.",
  "heading": "List of instances to be muted",
  "instanceMuteDescription": "This will mute any notes/renotes from the listed instances, including those of users replying to a user from a muted instance.",
  "instanceMuteDescription2": "Separate with newlines",
  "save": "Save"
}
</locale>

<locale locale="de-DE" lang="json">
{
  "title": "Blendet Notizen von stummgeschalteten Instanzen aus.",
  "heading": "Stummzuschaltende Instanzen",
  "instanceMuteDescription": "Schaltet alle Notizen/Renotes stumm, die von den gelisteten Instanzen stammen, inklusive Antworten von Benutzern an einen Benutzer einer stummgeschalteten Instanz.",
  "instanceMuteDescription2": "Instanzen getrennt durch Zeilenumbrüchen angeben",
  "save": "Speichern"
}
</locale>

<locale locale="en-US" lang="json">
{
  "title": "Hides notes from listed instances.",
  "heading": "List of instances to be muted",
  "instanceMuteDescription": "This will mute any notes/renotes from the listed instances, including those of users replying to a user from a muted instance.",
  "instanceMuteDescription2": "Separate with newlines",
  "save": "Save"
}
</locale>

<locale locale="es-ES" lang="json">
{
  "title": "Oculta las notas de las instancias listadas.",
  "heading": "Instancias a silenciar",
  "instanceMuteDescription": "Silencia todas las notas y reposts de la instancias seleccionadas, incluyendo respuestas a los usuarios de las mismas",
  "instanceMuteDescription2": "Separar por líneas",
  "save": "Guardar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
  "title": "Masque les notes venant des instances listées.",
  "heading": "Instances à mettre en sourdine",
  "instanceMuteDescription": "Met en sourdine toutes les notes et renotes de l'instance configurée, y compris les réponses aux utilisateurs de l'instance muette.",
  "instanceMuteDescription2": "Séparer avec de nouvelles lignes",
  "save": "Enregistrer"
}
</locale>

<locale locale="id-ID" lang="json">
{
  "title": "Sembunyikan note dari instansi terdaftar.",
  "heading": "Daftar instansi yang akan dibisukan",
  "instanceMuteDescription": "Pengaturan ini akan membisukan note/renote apa saja dari instansi yang terdaftar, termasuk pengguna yang membalas pengguna lain dalam instansi yang dibisukan.",
  "instanceMuteDescription2": "Pisah dengan baris baru",
  "save": "Simpan"
}
</locale>

<locale locale="it-IT" lang="json">
{
  "title": "Nasconde le note dell'istanza configurata.",
  "heading": "Istanze da silenziare",
  "instanceMuteDescription": "Disattiva tutte le note, le note di rinvio (condivisione) dell'istanza configurata, comprese le risposte agli utenti dell'istanza.",
  "instanceMuteDescription2": "Impostazione separata da una nuova riga",
  "save": "Salva"
}
</locale>

<locale locale="ja-JP" lang="json">
{
  "title": "設定したサーバーのノートを隠します。",
  "heading": "ミュートするサーバー",
  "instanceMuteDescription": "ミュートしたサーバーのユーザーへの返信を含めて、設定したサーバーの全てのノートとRenoteをミュートします。",
  "instanceMuteDescription2": "改行で区切って設定します",
  "save": "保存"
}
</locale>

<locale locale="ja-KS" lang="json">
{
  "title": "設定したサーバーのノートを隠すで。",
  "heading": "ミュートするサーバー",
  "instanceMuteDescription": "ミュートしたサーバーのユーザーへの返信を含めて、設定したインスタンスの全てのノートとRenoteをミュートにするで。",
  "instanceMuteDescription2": "改行で区切って設定するんやで",
  "save": "とっとく"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
  "title": "Hides notes from listed instances.",
  "heading": "List of instances to be muted",
  "instanceMuteDescription": "This will mute any notes/renotes from the listed instances, including those of users replying to a user from a muted instance.",
  "instanceMuteDescription2": "Separate with newlines",
  "save": "Sekles"
}
</locale>

<locale locale="kn-IN" lang="json">
{
  "title": "Hides notes from listed instances.",
  "heading": "List of instances to be muted",
  "instanceMuteDescription": "This will mute any notes/renotes from the listed instances, including those of users replying to a user from a muted instance.",
  "instanceMuteDescription2": "Separate with newlines",
  "save": "ಉಳಿಸಿ"
}
</locale>

<locale locale="ko-KR" lang="json">
{
  "title": "지정한 서버의 노트를 숨깁니다.",
  "heading": "뮤트할 서버",
  "instanceMuteDescription": "뮤트한 서버에서 오는 답글을 포함한 모든 노트와 Renote를 뮤트합니다.",
  "instanceMuteDescription2": "한 줄에 하나씩 입력해 주세요",
  "save": "저장"
}
</locale>

<locale locale="nl-NL" lang="json">
{
  "title": "Hides notes from listed instances.",
  "heading": "List of instances to be muted",
  "instanceMuteDescription": "This will mute any notes/renotes from the listed instances, including those of users replying to a user from a muted instance.",
  "instanceMuteDescription2": "Separate with newlines",
  "save": "Opslaan"
}
</locale>

<locale locale="no-NO" lang="json">
{
  "title": "Hides notes from listed instances.",
  "heading": "List of instances to be muted",
  "instanceMuteDescription": "This will mute any notes/renotes from the listed instances, including those of users replying to a user from a muted instance.",
  "instanceMuteDescription2": "Separate with newlines",
  "save": "Lagre"
}
</locale>

<locale locale="pl-PL" lang="json">
{
  "title": "Ukrywa wpisy z wymienionych instancji.",
  "heading": "Lista instancji do wyciszenia",
  "instanceMuteDescription": "This will mute any notes/renotes from the listed instances, including those of users replying to a user from a muted instance.",
  "instanceMuteDescription2": "Separate with newlines",
  "save": "Zapisz"
}
</locale>

<locale locale="pt-PT" lang="json">
{
  "title": "Esconder notas das instâncias listadas. ",
  "heading": "Lista de instâncias a serem silenciadas",
  "instanceMuteDescription": "Todas as notas e repostagens do servidor configurado serão silenciados, incluindo respostas aos usuários do servidor mutado.",
  "instanceMuteDescription2": "Separar por linha",
  "save": "Salvar"
}
</locale>

<locale locale="ru-RU" lang="json">
{
  "title": "Скрывает заметки с заданных инстансов.",
  "heading": "Список скрытых инстансов",
  "instanceMuteDescription": "Любые активности, затрагивающие инстансы из данного списка, будут скрыты.",
  "instanceMuteDescription2": "Пишите каждый инстанс на отдельной строке",
  "save": "Сохранить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
  "title": "Skryje poznámky z uvedených serverov.",
  "heading": "Zoznam umlčaných inštancií",
  "instanceMuteDescription": "Toto umlčí všetky poznámky/preposlania zo zoznamu serverov, vrátane tých, na ktoré používatelia odpovedajú z umlčaného servera.",
  "instanceMuteDescription2": "Oddeľte novými riadkami",
  "save": "Uložiť"
}
</locale>

<locale locale="th-TH" lang="json">
{
  "title": "ซ่อนโน้ตจากเซิร์ฟเวอร์ที่มีระบุไว้",
  "heading": "เซิร์ฟเวอร์ที่ถูกปิดเสียง",
  "instanceMuteDescription": "ปิดเสียง “โน้ต/รีโน้ต” ทั้งหมดจากเซิร์ฟเวอร์ที่ระบุไว้ รวมถึงโน้ตของผู้ใช้ที่ตอบกลับผู้ใช้จากเซิร์ฟเวอร์ที่ถูกปิดเสียง",
  "instanceMuteDescription2": "คั่นด้วยการขึ้นบรรทัดใหม่",
  "save": "บันทึก"
}
</locale>

<locale locale="tr-TR" lang="json">
{
  "title": "Listelenen sunuculardan notları gizler.",
  "heading": "Sessize alınacak sunucuların listesi",
  "instanceMuteDescription": "Bu, listelenen sunuculardan gelen tüm notları/yeniden notları sessize alır, sessize alınan bir sunucudan bir kullanıcıya yanıt veren kullanıcıların notları da dahil olmak üzere.",
  "instanceMuteDescription2": "Yeni satırlarla ayırın",
  "save": "Kaydet"
}
</locale>

<locale locale="ug-CN" lang="json">
{
  "title": "Hides notes from listed instances.",
  "heading": "List of instances to be muted",
  "instanceMuteDescription": "This will mute any notes/renotes from the listed instances, including those of users replying to a user from a muted instance.",
  "instanceMuteDescription2": "Separate with newlines",
  "save": "Save"
}
</locale>

<locale locale="uk-UA" lang="json">
{
  "title": "Приховує нотатки з перелічених інстансів.",
  "heading": "Список заглушених інстансів",
  "instanceMuteDescription": "This will mute any notes/renotes from the listed instances, including those of users replying to a user from a muted instance.",
  "instanceMuteDescription2": "Розділяйте новими рядками",
  "save": "Зберегти"
}
</locale>

<locale locale="vi-VN" lang="json">
{
  "title": "Ẩn tút từ những máy chủ đã liệt kê.",
  "heading": "Danh sách những máy chủ bị ẩn",
  "instanceMuteDescription": "Thao tác này sẽ ẩn mọi tút/lượt đăng lại từ các máy chủ được liệt kê, bao gồm cả những tút  dạng trả lời từ máy chủ bị ẩn.",
  "instanceMuteDescription2": "Tách bằng cách xuống dòng",
  "save": "Lưu"
}
</locale>

<locale locale="zh-CN" lang="json">
{
  "title": "以下服务器中的帖子将被隐藏。",
  "heading": "已隐藏的服务器",
  "instanceMuteDescription": "隐藏来自这些服务器的所有帖子和转贴，包括这些服务器上用户的回复。",
  "instanceMuteDescription2": "通过换行符分隔进行设置",
  "save": "保存"
}
</locale>

<locale locale="zh-TW" lang="json">
{
  "title": "將隱藏被設定的伺服器貼文。",
  "heading": "要靜音的伺服器",
  "instanceMuteDescription": "包括對被靜音伺服器上的使用者的回覆，被設定的伺服器上所有貼文及轉發都會被靜音。",
  "instanceMuteDescription2": "設定時以換行進行分隔",
  "save": "儲存"
}
</locale>
