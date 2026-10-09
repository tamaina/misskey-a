<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
		<div class="_gaps">
			<div class="inputs" style="display: flex; gap: var(--MI-margin); flex-wrap: wrap;">
				<MkSelect v-model="origin" :items="originDef" style="margin: 0; flex: 1;">
					<template #label>{{ $locale.sfc.instance }}</template>
				</MkSelect>
				<MkInput v-model="searchHost" :debounce="true" type="search" style="margin: 0; flex: 1;" :disabled="paginator.computedParams?.value?.origin === 'local'">
					<template #label>{{ $locale.sfc.host }}</template>
				</MkInput>
			</div>
			<div class="inputs" style="display: flex; gap: var(--MI-margin); flex-wrap: wrap;">
				<MkInput v-model="userId" :debounce="true" type="search" style="margin: 0; flex: 1;">
					<template #label>User ID</template>
				</MkInput>
				<MkInput v-model="type" :debounce="true" type="search" style="margin: 0; flex: 1;">
					<template #label>MIME type</template>
				</MkInput>
			</div>
			<MkFileListForAdmin :paginator="paginator" :viewMode="viewMode"/>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, markRaw, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkFileListForAdmin from '@features/drive/frontend/components/MkFileListForAdmin.vue';
import * as os from '@features/ui/frontend/os.js';
import { lookupFile } from '@features/moderation/frontend/utility/admin-lookup.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const {
	model: origin,
	def: originDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.all, value: 'combined' },
		{ label: $locale.value.sfc.local, value: 'local' },
		{ label: $locale.value.sfc.remote, value: 'remote' },
	],
	initialValue: 'local',
});
const type = ref<string | null>(null);
const searchHost = ref('');
const userId = ref('');
const viewMode = ref<'grid' | 'list'>('grid');
const paginator = markRaw(new Paginator('admin/drive/files', {
	limit: 10,
	computedParams: computed(() => ({
		type: (type.value && type.value !== '') ? type.value : null,
		userId: (userId.value && userId.value !== '') ? userId.value : null,
		origin: origin.value,
		hostname: (searchHost.value && searchHost.value !== '') ? searchHost.value : null,
	})),
}));

function clear() {
	os.confirm({
		type: 'warning',
		text: $locale.value.sfc.clearCachedFilesConfirm,
	}).then(({ canceled }) => {
		if (canceled) return;

		os.apiWithDialog('admin/drive/clean-remote-files', {});
	});
}

const headerActions = computed(() => [{
	text: $locale.value.sfc.lookup,
	icon: 'ti ti-search',
	handler: lookupFile,
}, {
	text: $locale.value.sfc.clearCachedFiles,
	icon: 'ti ti-trash',
	handler: clear,
}]);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.files,
	icon: 'ti ti-cloud',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"all": "الكل",
	"local": "المحلي",
	"remote": "بُعدي",
	"clearCachedFilesConfirm": "أتريد حذف التخزين المؤقت للملفات البعيدة؟",
	"lookup": "البحث",
	"clearCachedFiles": "امسح التخزين المؤقت",
	"files": "الملفات",
	"instance": "مثيل الخادم",
	"host": "المضيف"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"all": "Tot",
	"local": "Local",
	"remote": "Remot",
	"clearCachedFilesConfirm": "Segur que voleu eliminar tots els fitxers de la memòria cau?",
	"lookup": "Cerca",
	"clearCachedFiles": "Esborra la memòria cau",
	"files": "Fitxers",
	"instance": "Instància ",
	"host": "Amfitrió"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"all": "Vše",
	"local": "Lokální",
	"remote": "Vzdálené",
	"clearCachedFilesConfirm": "Jste jistí že chcete smazat všechny vzdálené soubory v mezipaměti?",
	"lookup": "Vyhledat",
	"clearCachedFiles": "Vyprázdnit mezipaměť",
	"files": "Soubor(ů)",
	"instance": "Instance",
	"host": "Hostitel"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"all": "All",
	"local": "Local",
	"remote": "Remote",
	"clearCachedFilesConfirm": "Are you sure that you want to delete all cached remote files?",
	"lookup": "Lookup",
	"clearCachedFiles": "Clear cache",
	"files": "Files",
	"instance": "Instance",
	"host": "Host"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"all": "Alle",
	"local": "Lokal",
	"remote": "Fremd",
	"clearCachedFilesConfirm": "Sollen alle im Cache gespeicherten Dateien von anderen Instanzen wirklich gelöscht werden?",
	"lookup": "Anfragen",
	"clearCachedFiles": "Cache leeren",
	"files": "Dateien",
	"instance": "Instanz",
	"host": "Hostname"
}
</locale>

<locale locale="en-US" lang="json">
{
	"all": "All",
	"local": "Local",
	"remote": "Remote",
	"clearCachedFilesConfirm": "Are you sure that you want to delete all cached remote files?",
	"lookup": "Lookup",
	"clearCachedFiles": "Clear cache",
	"files": "Files",
	"instance": "Instance",
	"host": "Host"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"all": "Todo",
	"local": "Local",
	"remote": "Remoto",
	"clearCachedFilesConfirm": "¿Quieres borrar todos los archivos remotos en caché?",
	"lookup": "Búsqueda",
	"clearCachedFiles": "Limpiar caché",
	"files": "Archivos",
	"instance": "Instancia",
	"host": "Instancia"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"all": "Tous",
	"local": "Local",
	"remote": "Distant",
	"clearCachedFilesConfirm": "Êtes-vous sûr·e de vouloir vider tout le cache de fichiers distants ?",
	"lookup": "Recherche",
	"clearCachedFiles": "Vider le cache",
	"files": "Fichiers",
	"instance": "Instance",
	"host": "Serveur distant"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"all": "Semua",
	"local": "Lokal",
	"remote": "Remote",
	"clearCachedFilesConfirm": "Apakah kamu yakin ingin menghapus seluruh tembolok berkas instansi luar?",
	"lookup": "Cari",
	"clearCachedFiles": "Hapus tembolok",
	"files": "Berkas",
	"instance": "Server",
	"host": "Host"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"all": "Tutte",
	"local": "Locale",
	"remote": "Remota",
	"clearCachedFilesConfirm": "Vuoi davvero svuotare la cache da tutti i file remoti?",
	"lookup": "Ricerca remota",
	"clearCachedFiles": "Svuota cache",
	"files": "Allegati",
	"instance": "Istanza",
	"host": "Host"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"all": "全て",
	"local": "ローカル",
	"remote": "リモート",
	"clearCachedFilesConfirm": "キャッシュされたリモートファイルをすべて削除しますか？",
	"lookup": "照会",
	"clearCachedFiles": "キャッシュをクリア",
	"files": "ファイル",
	"instance": "サーバー",
	"host": "ホスト"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"all": "みんな",
	"local": "ローカル",
	"remote": "リモート",
	"clearCachedFilesConfirm": "キャッシュされとるリモートファイルを全部ほかしてええか？",
	"lookup": "見てきて",
	"clearCachedFiles": "キャッシュをほかす",
	"files": "ファイル",
	"instance": "サーバー",
	"host": "ホスト"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"all": "All",
	"local": "Local",
	"remote": "Remote",
	"clearCachedFilesConfirm": "Are you sure that you want to delete all cached remote files?",
	"lookup": "Lookup",
	"clearCachedFiles": "Clear cache",
	"files": "Ifuyla",
	"instance": "Instance",
	"host": "Host"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"all": "All",
	"local": "Local",
	"remote": "Remote",
	"clearCachedFilesConfirm": "Are you sure that you want to delete all cached remote files?",
	"lookup": "Lookup",
	"clearCachedFiles": "Clear cache",
	"files": "ಕಡತಗಳು",
	"instance": "ನಿದರ್ಶನ",
	"host": "Host"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"all": "전체",
	"local": "로컬",
	"remote": "리모트",
	"clearCachedFilesConfirm": "캐시된 리모트 파일을 모두 삭제하시겠습니까?",
	"lookup": "찾아보기",
	"clearCachedFiles": "캐시 비우기",
	"files": "파일",
	"instance": "서버",
	"host": "호스트"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"all": "Alle",
	"local": "Lokaal",
	"remote": "Remote",
	"clearCachedFilesConfirm": "Weet je zeker dat je alle externe bestanden in de cache wilt verwijderen?",
	"lookup": "Opzoeken",
	"clearCachedFiles": "Cache opschonen",
	"files": "Bestanden",
	"instance": "Server",
	"host": "Server"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"all": "Alle",
	"local": "Local",
	"remote": "Remote",
	"clearCachedFilesConfirm": "Are you sure that you want to delete all cached remote files?",
	"lookup": "Lookup",
	"clearCachedFiles": "Clear cache",
	"files": "Filer",
	"instance": "Server",
	"host": "Vert"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"all": "Wszystkie",
	"local": "Lokalne",
	"remote": "Zdalny",
	"clearCachedFilesConfirm": "Czy na pewno chcesz usunąć wszystkie zdalne pliki z pamięci podręcznej?",
	"lookup": "Zapytania",
	"clearCachedFiles": "Wyczyść pamięć podręczną",
	"files": "Pliki",
	"instance": "Instancja",
	"host": "Host"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"all": "Todos",
	"local": "Local",
	"remote": "Remoto",
	"clearCachedFilesConfirm": "Deseja excluir todos os arquivos remotos em cache?",
	"lookup": "Consultar",
	"clearCachedFiles": "Limpar o cache",
	"files": "Arquivos",
	"instance": "Instância",
	"host": "Host"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"all": "Все",
	"local": "С этого сайта",
	"remote": "С других сайтов",
	"clearCachedFilesConfirm": "Удалить все закэшированные файлы с других сайтов?",
	"lookup": "Запрос",
	"clearCachedFiles": "Очистить кэш",
	"files": "Файлы",
	"instance": "Экземпляр",
	"host": "Хост"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"all": "Všetko",
	"local": "Lokálne",
	"remote": "Vzdialené",
	"clearCachedFilesConfirm": "Naozaj chcete odstrániť všetky nacachované vzdialené súbory?",
	"lookup": "Vyhľadať",
	"clearCachedFiles": "Vyprázdniť cache",
	"files": "Súbor/y",
	"instance": "Inštancia",
	"host": "Host"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"all": "ทั้งหมด",
	"local": "ท้องถิ่น",
	"remote": "ระยะไกล",
	"clearCachedFilesConfirm": "ต้องการลบไฟล์ระยะไกลที่แคชไว้ทั้งหมดใช่ไหม?",
	"lookup": "การค้นหา",
	"clearCachedFiles": "ล้างแคช",
	"files": "ไฟล์",
	"instance": "เซิร์ฟเวอร์",
	"host": "โฮสต์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"all": "Tümü",
	"local": "Yerel",
	"remote": "Uzak",
	"clearCachedFilesConfirm": "Tüm önbelleğe alınmış uzak dosyaları silmek istediğinden emin misin?",
	"lookup": "Sorgu",
	"clearCachedFiles": "Önbelleği temizle",
	"files": "Dosyalar",
	"instance": "Sunucu",
	"host": "Host"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"all": "All",
	"local": "Local",
	"remote": "Remote",
	"clearCachedFilesConfirm": "Are you sure that you want to delete all cached remote files?",
	"lookup": "Lookup",
	"clearCachedFiles": "Clear cache",
	"files": "Files",
	"instance": "Instance",
	"host": "Host"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"all": "Всі",
	"local": "Локальні",
	"remote": "Віддалені",
	"clearCachedFilesConfirm": "Ви впевнені, що хочете видалити всі кешовані файли?",
	"lookup": "Пошук",
	"clearCachedFiles": "Очистити кеш",
	"files": "Файли",
	"instance": "Інстанс",
	"host": "Хост"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"all": "Tất cả",
	"local": "Máy chủ này",
	"remote": "Máy chủ khác",
	"clearCachedFilesConfirm": "Bạn có chắc muốn xóa sạch bộ nhớ đệm?",
	"lookup": "Tra cứu",
	"clearCachedFiles": "Xóa bộ nhớ đệm",
	"files": "Tập tin",
	"instance": "Máy chủ",
	"host": "Host"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"all": "全部",
	"local": "本地",
	"remote": "远程",
	"clearCachedFilesConfirm": "确定要清除所有缓存的远程文件吗？",
	"lookup": "查找用户",
	"clearCachedFiles": "清除缓存",
	"files": "文件",
	"instance": "服务器",
	"host": "主机名"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"all": "全部",
	"local": "本地",
	"remote": "遠端",
	"clearCachedFilesConfirm": "確定要刪除所有快取的遠端資料嗎？",
	"lookup": "查詢",
	"clearCachedFiles": "清除快取資料",
	"files": "檔案",
	"instance": "伺服器",
	"host": "主機"
}
</locale>
