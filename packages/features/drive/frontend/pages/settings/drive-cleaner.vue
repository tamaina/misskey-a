<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkSelect v-model="sortModeSelect" :items="sortModeSelectDef">
		<template #label>{{ $locale.sfc.sort }}</template>
	</MkSelect>
	<div v-if="!fetching">
		<MkPagination v-slot="{items}" :paginator="paginator">
			<div class="_gaps">
				<div
					v-for="file in items" :key="file.id"
					class="_button"
					@click="$event => onClick($event, file)"
					@contextmenu.stop="$event => onContextMenu($event, file)"
				>
					<div :class="$style.file">
						<div v-if="file.isSensitive" class="sensitive-label">{{ $locale.sfc.sensitive }}</div>
						<MkDriveFileThumbnail :class="$style.fileThumbnail" :file="file" fit="contain"/>
						<div :class="$style.fileBody">
							<div style="margin-bottom: 4px;">
								{{ file.name }}
							</div>
							<div>
								<span style="margin-right: 1em;">{{ file.type }}</span>
								<span>{{ bytes(file.size) }}</span>
							</div>
							<div>
								<span>{{ $locale.sfc.registeredDate }}: <MkTime :time="file.createdAt" mode="detail"/></span>
							</div>
							<div v-if="sortModeSelect === 'sizeDesc'">
								<div :class="$style.meter"><div :class="$style.meterValue" :style="genUsageBar(file.size)"></div></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</MkPagination>
	</div>
	<div v-else>
		<MkLoading/>
	</div>
</div>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';
import { computed, markRaw, ref, watch } from 'vue';
import tinycolor from 'tinycolor2';
import type { StyleValue } from 'vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkDriveFileThumbnail from '@features/drive/frontend/components/MkDriveFileThumbnail.vue';
import bytes from '@features/ui/frontend/filters/bytes.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import { useMkSelect } from '@features/ui/frontend/composables/use-mkselect.js';
import { useGlobalEvent } from '@features/runtime/frontend/events.js';
import { getDriveFileMenu } from '@features/drive/frontend/utility/get-drive-file-menu.js';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';

const sortMode = ref<Misskey.entities.DriveFilesRequest['sort']>('+size');
const paginator = markRaw(new Paginator('drive/files', {
	limit: 10,
	computedParams: computed(() => ({ sort: sortMode.value })),
}));

const capacity = ref<number>(0);
const usage = ref<number>(0);
const fetching = ref(true);
const {
	model: sortModeSelect,
	def: sortModeSelectDef,
} = useMkSelect({
	items: [
		{ label: $locale.value.sfc.orderBySizeDesc, value: 'sizeDesc' },
		{ label: $locale.value.sfc.orderByCreatedAtAsc, value: 'createdAtAsc' },
	],
	initialValue: 'sizeDesc',
});

fetchDriveInfo();

watch(sortModeSelect, () => {
	switch (sortModeSelect.value) {
		case 'sizeDesc':
			sortMode.value = '+size';
			fetchDriveInfo();
			break;

		case 'createdAtAsc':
			sortMode.value = '-createdAt';
			fetchDriveInfo();
			break;
	}
});

function fetchDriveInfo(): void {
	fetching.value = true;
	misskeyApi('drive').then(info => {
		capacity.value = info.capacity;
		usage.value = info.usage;
		fetching.value = false;
	});
}

function genUsageBar(fsize: number): StyleValue {
	return {
		width: `${fsize / usage.value * 100}%`,
		background: tinycolor({ h: 180 - (fsize / usage.value * 180), s: 0.7, l: 0.5 }).toHslString(),
	};
}

function onClick(ev: PointerEvent, file: Misskey.entities.DriveFile) {
	os.popupMenu(getDriveFileMenu(file), (ev.currentTarget ?? ev.target ?? undefined) as HTMLElement | undefined);
}

function onContextMenu(ev: PointerEvent, file: Misskey.entities.DriveFile): void {
	os.contextMenu(getDriveFileMenu(file), ev);
}

useGlobalEvent('driveFilesDeleted', (files) => {
	for (const f of files) {
		paginator.removeItem(f.id);
	}
});

definePage(() => ({
	title: $locale.value.sfc.drivecleaner,
	icon: 'ti ti-trash',
}));
</script>

<style lang="scss" module>
.file {
	display: flex;
	width: 100%;
	box-sizing: border-box;
	text-align: left;
	align-items: center;

	&:hover {
		color: var(--MI_THEME-accent);
	}
}

.fileThumbnail {
	width: 100px;
	height: 100px;
}

.fileBody {
	margin-left: 0.3em;
	padding: 8px;
	flex: 1;
}

.meter {
	margin-top: 8px;
	height: 12px;
	background: rgba(0, 0, 0, 0.1);
	overflow: clip;
	border-radius: 999px;
}

.meterValue {
	height: 100%;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"sort": "ترتيب حسب",
	"sensitive": "محتوى حساس",
	"registeredDate": "انضم في",
	"orderBySizeDesc": "Descending Filesizes",
	"orderByCreatedAtAsc": "Ascending Dates",
	"drivecleaner": "Drive Cleaner"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"sort": "Ordena",
	"sensitive": "Sensible",
	"registeredDate": "Data de registre",
	"orderBySizeDesc": "Mida del fitxer descendent",
	"orderByCreatedAtAsc": "Data ascendent",
	"drivecleaner": "Netejador de Disc"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"sort": "Seřadit",
	"sensitive": "NSFW",
	"registeredDate": "Datum registrace",
	"orderBySizeDesc": "Sestupná velikost souborů",
	"orderByCreatedAtAsc": "Vzestupné datumy",
	"drivecleaner": "Čistič disku"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"sort": "Sorting order",
	"sensitive": "Sensitive",
	"registeredDate": "Joined on",
	"orderBySizeDesc": "Descending Filesizes",
	"orderByCreatedAtAsc": "Ascending Dates",
	"drivecleaner": "Drive Cleaner"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"sort": "Sortieren",
	"sensitive": "Sensibel",
	"registeredDate": "Registrationsdatum",
	"orderBySizeDesc": "Absteigende Dateigrößen",
	"orderByCreatedAtAsc": "Aufsteigendes Erstelldatum",
	"drivecleaner": "Drive-Reiniger"
}
</locale>

<locale locale="en-US" lang="json">
{
	"sort": "Sorting order",
	"sensitive": "Sensitive",
	"registeredDate": "Joined on",
	"orderBySizeDesc": "Descending Filesizes",
	"orderByCreatedAtAsc": "Ascending Dates",
	"drivecleaner": "Drive Cleaner"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"sort": "Ordenar",
	"sensitive": "Marcado como sensible (NSFW)",
	"registeredDate": "Fecha de registro",
	"orderBySizeDesc": "Tamaño descendiente",
	"orderByCreatedAtAsc": "Fecha ascendente",
	"drivecleaner": "Limpiador del Drive"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"sort": "Trier",
	"sensitive": "Contenu sensible",
	"registeredDate": "Inscrit le",
	"orderBySizeDesc": "Taille descendante",
	"orderByCreatedAtAsc": "Date d'ajout ascendante",
	"drivecleaner": "Nettoyeur du Disque"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"sort": "Urutkan",
	"sensitive": "Konten sensitif",
	"registeredDate": "Bergabung pada",
	"orderBySizeDesc": "Ukuran berkas (Turun)",
	"orderByCreatedAtAsc": "Tanggal (Naik)",
	"drivecleaner": "Pembersih Drive"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"sort": "Ordina per",
	"sensitive": "Esplicito",
	"registeredDate": "Data iscrizione",
	"orderBySizeDesc": "Dal file più grosso al più piccolo",
	"orderByCreatedAtAsc": "Dal file più vecchio al più recente",
	"drivecleaner": "Pulizia del Drive"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"sort": "ソート",
	"sensitive": "センシティブ",
	"registeredDate": "登録日",
	"orderBySizeDesc": "サイズが大きい順",
	"orderByCreatedAtAsc": "追加日が古い順",
	"drivecleaner": "ドライブクリーナー"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"sort": "並び替え",
	"sensitive": "気いつけて見いや",
	"registeredDate": "始めた日",
	"orderBySizeDesc": "サイズのでかい順",
	"orderByCreatedAtAsc": "追加日の古い順",
	"drivecleaner": "ドライブキレイキレイ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"sort": "Sorting order",
	"sensitive": "Sensitive",
	"registeredDate": "Joined on",
	"orderBySizeDesc": "Descending Filesizes",
	"orderByCreatedAtAsc": "Ascending Dates",
	"drivecleaner": "Drive Cleaner"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"sort": "Sorting order",
	"sensitive": "Sensitive",
	"registeredDate": "Joined on",
	"orderBySizeDesc": "Descending Filesizes",
	"orderByCreatedAtAsc": "Ascending Dates",
	"drivecleaner": "Drive Cleaner"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"sort": "정렬",
	"sensitive": "열람 주의",
	"registeredDate": "등록일",
	"orderBySizeDesc": "크기가 큰 순",
	"orderByCreatedAtAsc": "등록일이 오래된 순",
	"drivecleaner": "드라이브 정리"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"sort": "Sorteren",
	"sensitive": "NSFW",
	"registeredDate": "Inschrijvingsdatum",
	"orderBySizeDesc": "Descending Filesizes",
	"orderByCreatedAtAsc": "Ascending Dates",
	"drivecleaner": "Drive Cleaner"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"sort": "Sorting order",
	"sensitive": "Sensitive",
	"registeredDate": "Joined on",
	"orderBySizeDesc": "Descending Filesizes",
	"orderByCreatedAtAsc": "Ascending Dates",
	"drivecleaner": "Drive Cleaner"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"sort": "Sortuj",
	"sensitive": "NSFW",
	"registeredDate": "Zarejestrowano",
	"orderBySizeDesc": "Descending Filesizes",
	"orderByCreatedAtAsc": "Ascending Dates",
	"drivecleaner": "Drive Cleaner"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"sort": "Ordenação",
	"sensitive": "Conteúdo sensível",
	"registeredDate": "Data de registro",
	"orderBySizeDesc": "Tamanho descendente",
	"orderByCreatedAtAsc": "Data ascendente",
	"drivecleaner": "Limpeza do drive"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"sort": "Сортировать",
	"sensitive": "Содержимое не для всех",
	"registeredDate": "Дата регистрации",
	"orderBySizeDesc": "Размеры файлов по убыванию",
	"orderByCreatedAtAsc": "По увеличению даты",
	"drivecleaner": "Очиститель дисков"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"sort": "Zoradiť",
	"sensitive": "NSFW",
	"registeredDate": "Dátum registrácie",
	"orderBySizeDesc": "Descending Filesizes",
	"orderByCreatedAtAsc": "Ascending Dates",
	"drivecleaner": "Drive Cleaner"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"sort": "เรียงลำดับ",
	"sensitive": "เนื้อหาที่ละเอียดอ่อน",
	"registeredDate": "วันที่ลงทะเบียน",
	"orderBySizeDesc": "ขนาดไฟล์จากมากไปหาน้อย",
	"orderByCreatedAtAsc": "วันที่จากน้อยไปหามาก",
	"drivecleaner": "ทำความสะอาดไดรฟ์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"sort": "Sıralama düzeni",
	"sensitive": "Hassas",
	"registeredDate": "Katılma tarihi",
	"orderBySizeDesc": "Azalan Dosya Boyutları",
	"orderByCreatedAtAsc": "Yükselen Tarihler",
	"drivecleaner": "Drive Temizleyici"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"sort": "Sorting order",
	"sensitive": "Sensitive",
	"registeredDate": "Joined on",
	"orderBySizeDesc": "Descending Filesizes",
	"orderByCreatedAtAsc": "Ascending Dates",
	"drivecleaner": "Drive Cleaner"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"sort": "Сортування",
	"sensitive": "NSFW",
	"registeredDate": "Приєднання",
	"orderBySizeDesc": "Descending Filesizes",
	"orderByCreatedAtAsc": "Ascending Dates",
	"drivecleaner": "Очищувач Диска\n"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"sort": "Sắp xếp",
	"sensitive": "Nhạy cảm",
	"registeredDate": "Tham gia",
	"orderBySizeDesc": "Descending Filesizes",
	"orderByCreatedAtAsc": "Ascending Dates",
	"drivecleaner": "Trình dọn đĩa"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"sort": "排序",
	"sensitive": "敏感内容",
	"registeredDate": "注册于",
	"orderBySizeDesc": "按大小降序排列",
	"orderByCreatedAtAsc": "按添加日期降序排列",
	"drivecleaner": "网盘整理"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"sort": "排序",
	"sensitive": "敏感內容",
	"registeredDate": "註冊日期",
	"orderBySizeDesc": "按大小降序排列",
	"orderByCreatedAtAsc": "按新增日期降序排列",
	"drivecleaner": "雲端硬碟清掃器"
}
</locale>
