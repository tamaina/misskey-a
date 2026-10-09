<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkSelect v-model="statusbar.type" :items="statusbarTypeDef">
		<template #label>{{ $locale.sfc.type }}</template>
	</MkSelect>

	<MkInput v-model="statusbar.name" manualSave>
		<template #label>{{ $locale.sfc.label }}</template>
	</MkInput>

	<MkSwitch v-model="statusbar.black">
		<template #label>Black</template>
	</MkSwitch>

	<MkRadios
		v-model="statusbar.size"
		:options="[
			{ value: 'verySmall', label: $locale.sfc.small + '+' },
			{ value: 'small', label: $locale.sfc.small },
			{ value: 'medium', label: $locale.sfc.medium },
			{ value: 'large', label: $locale.sfc.large },
			{ value: 'veryLarge', label: $locale.sfc.large + '+' },
		]"
	>
		<template #label>{{ $locale.sfc.size }}</template>
	</MkRadios>

	<template v-if="statusbar.type === 'rss'">
		<MkInput v-model="statusbar.props.url" manualSave type="url">
			<template #label>URL</template>
		</MkInput>
		<MkSwitch v-model="statusbar.props.shuffle">
			<template #label>{{ $locale.sfc.shuffle }}</template>
		</MkSwitch>
		<MkInput v-model="statusbar.props.refreshIntervalSec" manualSave type="number" :min="1">
			<template #label>{{ $locale.sfc.refreshInterval }}</template>
		</MkInput>
		<MkRange v-model="statusbar.props.marqueeDuration" :min="5" :max="150" :step="1">
			<template #label>{{ $locale.sfc.speed }}</template>
			<template #caption>{{ $locale.sfc.fast }} &lt;-&gt; {{ $locale.sfc.slow }}</template>
		</MkRange>
		<MkSwitch v-model="statusbar.props.marqueeReverse">
			<template #label>{{ $locale.sfc.reverse }}</template>
		</MkSwitch>
	</template>
	<template v-else-if="statusbar.type === 'federation'">
		<MkInput v-model="statusbar.props.refreshIntervalSec" manualSave type="number" :min="1">
			<template #label>{{ $locale.sfc.refreshInterval }}</template>
		</MkInput>
		<MkRange v-model="statusbar.props.marqueeDuration" :min="5" :max="150" :step="1">
			<template #label>{{ $locale.sfc.speed }}</template>
			<template #caption>{{ $locale.sfc.fast }} &lt;-&gt; {{ $locale.sfc.slow }}</template>
		</MkRange>
		<MkSwitch v-model="statusbar.props.marqueeReverse">
			<template #label>{{ $locale.sfc.reverse }}</template>
		</MkSwitch>
		<MkSwitch v-model="statusbar.props.colored">
			<template #label>{{ $locale.sfc.colored }}</template>
		</MkSwitch>
	</template>
	<template v-else-if="statusbar.type === 'userList' && userLists != null">
		<MkSelect v-model="statusbar.props.userListId" :items="userListsDef">
			<template #label>{{ $locale.sfc.userList }}</template>
		</MkSelect>
		<MkInput v-model="statusbar.props.refreshIntervalSec" manualSave type="number">
			<template #label>{{ $locale.sfc.refreshInterval }}</template>
		</MkInput>
		<MkRange v-model="statusbar.props.marqueeDuration" :min="5" :max="150" :step="1">
			<template #label>{{ $locale.sfc.speed }}</template>
			<template #caption>{{ $locale.sfc.fast }} &lt;-&gt; {{ $locale.sfc.slow }}</template>
		</MkRange>
		<MkSwitch v-model="statusbar.props.marqueeReverse">
			<template #label>{{ $locale.sfc.reverse }}</template>
		</MkSwitch>
	</template>

	<div class="_buttons">
		<MkButton danger @click="del">{{ $locale.sfc.remove }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { reactive, computed, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkRange from '@features/ui/frontend/components/MkRange.vue';
import { instance } from '@features/instance/frontend/instance.js';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import type { MkSelectItem } from '@features/ui/frontend/components/MkSelect.vue';
import type { StatusbarStore } from '@features/preferences/frontend/state/def.js';

const props = defineProps<{
	_id: string;
	userLists: Misskey.entities.UserList[] | null;
}>();

const statusbar = reactive<StatusbarStore>(deepClone(prefer.s.statusbars.find(x => x.id === props._id)!));

const statusbarTypeDef = computed(() => {
	const items = [
		{ label: 'RSS', value: 'rss' },
	] satisfies MkSelectItem[];
	if (instance.federation !== 'none') {
		items.push({ label: 'Federation', value: 'federation' });
	}
	if (props.userLists != null) {
		items.push({ label: $locale.value.sfc.userList, value: 'userList' });
	}
	return items;
});

const userListsDef = computed(() => {
	return (props.userLists ?? []).map(x => ({ label: x.name, value: x.id })) satisfies MkSelectItem[];
});

watch(() => statusbar.type, () => {
	if (statusbar.type === 'rss') {
		statusbar.name = 'NEWS';
		statusbar.props.url = 'http://feeds.afpbb.com/rss/afpbb/afpbbnews';
		statusbar.props.shuffle = true;
		statusbar.props.refreshIntervalSec = 120;
		statusbar.props.display = 'marquee';
		statusbar.props.marqueeDuration = 100;
		statusbar.props.marqueeReverse = false;
	} else if (statusbar.type === 'federation') {
		statusbar.name = 'FEDERATION';
		statusbar.props.refreshIntervalSec = 120;
		statusbar.props.display = 'marquee';
		statusbar.props.marqueeDuration = 100;
		statusbar.props.marqueeReverse = false;
		statusbar.props.colored = false;
	} else if (statusbar.type === 'userList') {
		statusbar.name = 'LIST TL';
		statusbar.props.refreshIntervalSec = 120;
		statusbar.props.display = 'marquee';
		statusbar.props.marqueeDuration = 100;
		statusbar.props.marqueeReverse = false;
	}
});

watch(statusbar, save);

async function save() {
	const i = prefer.s.statusbars.findIndex(x => x.id === props._id);
	const statusbars = deepClone(prefer.s.statusbars);
	statusbars[i] = deepClone(statusbar);
	prefer.commit('statusbars', statusbars);
}

function del() {
	prefer.commit('statusbars', prefer.s.statusbars.filter(x => x.id !== props._id));
}
</script>

<locale locale="ar-SA" lang="json">
{
	"userList": "القوائم",
	"type": "نوع",
	"label": "التسمية",
	"small": "صغير",
	"medium": "متوسط",
	"large": "كبير",
	"size": "الحجم",
	"shuffle": "خلط",
	"refreshInterval": "مهلة التحديث",
	"speed": "سرعة",
	"fast": "سريع",
	"slow": "بطيء",
	"reverse": "اقلب",
	"colored": "ملوّن",
	"remove": "حذف"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"userList": "Llistes",
	"type": "Tipus",
	"label": "Etiqueta",
	"small": "Petit",
	"medium": "Mitjà",
	"large": "Gran",
	"size": "Mida",
	"shuffle": "Aleatori",
	"refreshInterval": "Interval d'actualització ",
	"speed": "Velocitat",
	"fast": "Ràpid ",
	"slow": "Lent",
	"reverse": "Invertir",
	"colored": "Colorit",
	"remove": "Eliminar"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"userList": "Seznamy",
	"type": "Typ",
	"label": "Popisek",
	"small": "Malé",
	"medium": "Střední",
	"large": "Velké",
	"size": "Velikost",
	"shuffle": "Zamíchat",
	"refreshInterval": "Interval obnovení",
	"speed": "Rychlost",
	"fast": "Rychlá",
	"slow": "Pomalá",
	"reverse": "Otočit",
	"colored": "Barevné",
	"remove": "Smazat"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"userList": "Lists",
	"type": "Type",
	"label": "Label",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"size": "Size",
	"shuffle": "Shuffle",
	"refreshInterval": "Update interval ",
	"speed": "Speed",
	"fast": "Fast",
	"slow": "Slow",
	"reverse": "Reverse",
	"colored": "Colored",
	"remove": "Delete"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"userList": "Liste",
	"type": "Art",
	"label": "Beschriftung",
	"small": "Klein",
	"medium": "Mittel",
	"large": "Groß",
	"size": "Größe",
	"shuffle": "Mischen",
	"refreshInterval": "Aktualisierungsrate",
	"speed": "Geschwindigkeit",
	"fast": "Schnell",
	"slow": "Langsam",
	"reverse": "Umkehren",
	"colored": "Farbig",
	"remove": "Löschen"
}
</locale>

<locale locale="en-US" lang="json">
{
	"userList": "Lists",
	"type": "Type",
	"label": "Label",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"size": "Size",
	"shuffle": "Shuffle",
	"refreshInterval": "Update interval ",
	"speed": "Speed",
	"fast": "Fast",
	"slow": "Slow",
	"reverse": "Reverse",
	"colored": "Colored",
	"remove": "Delete"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"userList": "Lista",
	"type": "Tipo",
	"label": "Etiqueta",
	"small": "Pequeño",
	"medium": "Mediano",
	"large": "Grande",
	"size": "Tamaño",
	"shuffle": "Aleatorio",
	"refreshInterval": "Intervalo de actualización",
	"speed": "Velocidad",
	"fast": "Rápido",
	"slow": "Lento",
	"reverse": "Echar de un capirotazo",
	"colored": "Color",
	"remove": "Borrar"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"userList": "Listes",
	"type": "Type",
	"label": "Étiquette",
	"small": "Petit",
	"medium": "Moyen",
	"large": "Grand",
	"size": "Taille",
	"shuffle": "Lecture aléatoire",
	"refreshInterval": "Intervalle de mise à jour",
	"speed": "Vitesse",
	"fast": "Rapide",
	"slow": "Lente",
	"reverse": "Inverser",
	"colored": "Coloré",
	"remove": "Supprimer"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"userList": "Daftar",
	"type": "Tipe",
	"label": "Label",
	"small": "Kecil",
	"medium": "Sedang",
	"large": "Besar",
	"size": "Ukuran",
	"shuffle": "Acak",
	"refreshInterval": "Jeda pembaharuan",
	"speed": "Kecepatan",
	"fast": "Cepat",
	"slow": "Lambat",
	"reverse": "Balik",
	"colored": "Diwarnai",
	"remove": "Hapus"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"userList": "Liste",
	"type": "Tipo",
	"label": "Etichetta",
	"small": "Piccolo",
	"medium": "Medio",
	"large": "Grande",
	"size": "Dimensioni",
	"shuffle": "Casuale",
	"refreshInterval": "intervallo di aggiornamento",
	"speed": "Velocità",
	"fast": "Veloce",
	"slow": "Lento",
	"reverse": "Inverti",
	"colored": "Colorato",
	"remove": "Elimina"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"userList": "リスト",
	"type": "タイプ",
	"label": "ラベル",
	"small": "小",
	"medium": "中",
	"large": "大",
	"size": "サイズ",
	"shuffle": "シャッフル",
	"refreshInterval": "更新間隔",
	"speed": "速度",
	"fast": "速い",
	"slow": "遅い",
	"reverse": "反転",
	"colored": "色付き",
	"remove": "削除"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"userList": "リスト",
	"type": "タイプ",
	"label": "ラベル",
	"small": "ちいさい",
	"medium": "ふつう",
	"large": "でかい",
	"size": "大きさ",
	"shuffle": "シャッフルするで",
	"refreshInterval": "更新間隔",
	"speed": "速度",
	"fast": "速い",
	"slow": "遅い",
	"reverse": "反転",
	"colored": "色付き",
	"remove": "ほかす"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"userList": "Tibdarin",
	"type": "Type",
	"label": "Label",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"size": "Size",
	"shuffle": "Shuffle",
	"refreshInterval": "Update interval ",
	"speed": "Speed",
	"fast": "Fast",
	"slow": "Slow",
	"reverse": "Reverse",
	"colored": "Colored",
	"remove": "Kkes"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"userList": "Lists",
	"type": "Type",
	"label": "Label",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"size": "Size",
	"shuffle": "Shuffle",
	"refreshInterval": "Update interval ",
	"speed": "Speed",
	"fast": "Fast",
	"slow": "Slow",
	"reverse": "Reverse",
	"colored": "Colored",
	"remove": "ಅಳಿಸು"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"userList": "리스트",
	"type": "종류",
	"label": "라벨",
	"small": "작게",
	"medium": "보통",
	"large": "크게",
	"size": "크기",
	"shuffle": "셔플",
	"refreshInterval": "업데이트 주기",
	"speed": "속도",
	"fast": "빠르게",
	"slow": "느리게",
	"reverse": "플립",
	"colored": "색 입히기",
	"remove": "삭제"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"userList": "Lijsten",
	"type": "Type",
	"label": "Label",
	"small": "Klein",
	"medium": "Medium",
	"large": "Groot",
	"size": "Size",
	"shuffle": "Shuffle",
	"refreshInterval": "Update interval ",
	"speed": "Speed",
	"fast": "Fast",
	"slow": "Slow",
	"reverse": "Reverse",
	"colored": "Colored",
	"remove": "Verwijderen"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"userList": "Lister",
	"type": "Type",
	"label": "Label",
	"small": "Liten",
	"medium": "Medium",
	"large": "Stor",
	"size": "Størrelse",
	"shuffle": "Shuffle",
	"refreshInterval": "Update interval ",
	"speed": "Speed",
	"fast": "Fast",
	"slow": "Slow",
	"reverse": "Reverse",
	"colored": "Colored",
	"remove": "Slett"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"userList": "Listy",
	"type": "Typ",
	"label": "Etykieta",
	"small": "Małe",
	"medium": "Średnie",
	"large": "Duże",
	"size": "Rozmiar",
	"shuffle": "Mieszaj",
	"refreshInterval": "Okres aktualizacji",
	"speed": "Prędkość",
	"fast": "Szybki",
	"slow": "Wolny",
	"reverse": "Odwróć",
	"colored": "Kolorowe",
	"remove": "Usuń"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"userList": "Listas",
	"type": "Tipo",
	"label": "Etiqueta",
	"small": "Pequeno",
	"medium": "Médio",
	"large": "Grande",
	"size": "Tamanho",
	"shuffle": "Aleatório",
	"refreshInterval": "Intervalo de atualização",
	"speed": "Velocidade",
	"fast": "Rápido",
	"slow": "Lento",
	"reverse": "Inversão",
	"colored": "Colorido",
	"remove": "Remover"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"userList": "Списки",
	"type": "Тип",
	"label": "Метка",
	"small": "Мелко",
	"medium": "Средне",
	"large": "Крупно",
	"size": "Размер",
	"shuffle": "Перемешать",
	"refreshInterval": "Интервал перезагрузки",
	"speed": "Скорость",
	"fast": "Быстрая",
	"slow": "Медленная",
	"reverse": "Переворот",
	"colored": "Выделена цветом",
	"remove": "Удалить"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"userList": "Zoznamy",
	"type": "Typ",
	"label": "Popisok",
	"small": "Malé",
	"medium": "Stredné",
	"large": "Veľké",
	"size": "Veľkosť",
	"shuffle": "Zamiešať",
	"refreshInterval": "Interval obnovenia",
	"speed": "Rýchlosť",
	"fast": "Rýchlo",
	"slow": "Pomaly",
	"reverse": "Preklopiť",
	"colored": "Farebné",
	"remove": "Odstrániť"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"userList": "ลิสต์",
	"type": "รูปแบบ",
	"label": "ป้าย",
	"small": "เล็ก",
	"medium": "ปานกลาง",
	"large": "ใหญ่",
	"size": "ขนาด",
	"shuffle": "สลับ",
	"refreshInterval": "ความถี่ในการอัปเดต",
	"speed": "ความเร็ว",
	"fast": "เร็ว",
	"slow": "ช้า",
	"reverse": "พลิก",
	"colored": "สี",
	"remove": "ลบ"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"userList": "Listeler",
	"type": "Tür",
	"label": "Etiket",
	"small": "Küçük",
	"medium": "Orta",
	"large": "Büyük",
	"size": "Boyut",
	"shuffle": "Karıştır",
	"refreshInterval": "Güncelleme aralığı",
	"speed": "Hız",
	"fast": "Hızlı",
	"slow": "Yavaş",
	"reverse": "Tersine",
	"colored": "Renkli",
	"remove": "Sil"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"userList": "Lists",
	"type": "Type",
	"label": "Label",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"size": "Size",
	"shuffle": "Shuffle",
	"refreshInterval": "Update interval ",
	"speed": "Speed",
	"fast": "Fast",
	"slow": "Slow",
	"reverse": "Reverse",
	"colored": "Colored",
	"remove": "ئۆچۈرۈش"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"userList": "Списки",
	"type": "Тип",
	"label": "Назва",
	"small": "Маленький",
	"medium": "Середній",
	"large": "Крупний",
	"size": "Розмір",
	"shuffle": "Перемішати",
	"refreshInterval": "Інтервал оновлення",
	"speed": "Швидкість",
	"fast": "Швидко",
	"slow": "Повільно",
	"reverse": "Перевернути",
	"colored": "Кольоровий",
	"remove": "Видалити"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"userList": "Danh sách",
	"type": "Loại",
	"label": "Nhãn",
	"small": "Nhỏ",
	"medium": "Vừa",
	"large": "Lớn",
	"size": "Kích thước",
	"shuffle": "Xáo trộn",
	"refreshInterval": "Cập nhật nội bộ",
	"speed": "Tốc độ",
	"fast": "Nhanh",
	"slow": "Chậm",
	"reverse": "Lật",
	"colored": "Với màu",
	"remove": "Xóa"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"userList": "列表",
	"type": "类型",
	"label": "标签",
	"small": "小",
	"medium": "中",
	"large": "大",
	"size": "大小",
	"shuffle": "随机",
	"refreshInterval": "刷新间隔",
	"speed": "速度",
	"fast": "快",
	"slow": "慢",
	"reverse": "翻转",
	"colored": "彩色",
	"remove": "删除"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"userList": "使用者清單",
	"type": "類型",
	"label": "標籤",
	"small": "小",
	"medium": "中",
	"large": "大",
	"size": "大小",
	"shuffle": "隨機",
	"refreshInterval": "更新間隔",
	"speed": "速度",
	"fast": "快",
	"slow": "慢",
	"reverse": "翻轉",
	"colored": "彩色",
	"remove": "刪除"
}
</locale>
