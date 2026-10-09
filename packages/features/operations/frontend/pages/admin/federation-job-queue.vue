<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<XQueue v-if="tab === 'deliver'" domain="deliver"/>
		<XQueue v-else-if="tab === 'inbox'" domain="inbox"/>
		<br>
		<div class="_buttons">
			<MkButton @click="promoteAllQueues"><i class="ti ti-reload"></i> {{ $locale.sfc.retryAllQueuesNow }}</MkButton>
			<MkButton danger @click="clear"><i class="ti ti-trash"></i> {{ $locale.sfc.clearQueue }}</MkButton>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import XQueue from '@features/operations/frontend/pages/admin/federation-job-queue.chart.vue';
import type { Ref } from 'vue';
import * as os from '@features/ui/frontend/os.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';

export type ApQueueDomain = 'deliver' | 'inbox';

const tab: Ref<ApQueueDomain> = ref('deliver');

function clear() {
	os.confirm({
		type: 'warning',
		title: $locale.value.sfc.clearQueueConfirmTitle,
		text: $locale.value.sfc.clearQueueConfirmText,
	}).then(({ canceled }) => {
		if (canceled) return;

		os.apiWithDialog('admin/queue/clear', { queue: tab.value, state: '*' });
	});
}

function promoteAllQueues() {
	os.confirm({
		type: 'warning',
		title: $locale.value.sfc.retryAllQueuesConfirmTitle,
		text: $locale.value.sfc.retryAllQueuesConfirmText,
	}).then(({ canceled }) => {
		if (canceled) return;

		os.apiWithDialog('admin/queue/promote-jobs', { queue: tab.value });
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'deliver',
	title: 'Deliver',
}, {
	key: 'inbox',
	title: 'Inbox',
}]);

definePage(() => ({
	title: $locale.value.sfc.federationJobs,
	icon: 'ti ti-clock-play',
}));
</script>

<locale locale="ar-SA" lang="json">
{
	"retryAllQueuesNow": "Retry running all queues",
	"clearQueue": "تفريغ قائمة الإنتظار",
	"clearQueueConfirmTitle": "أتريد مسح الطابور؟",
	"clearQueueConfirmText": "Any undelivered notes remaining in the queue will not be federated. Usually this operation is not needed.",
	"retryAllQueuesConfirmTitle": "Really retry all?",
	"retryAllQueuesConfirmText": "This will temporarily increase the server load.",
	"federationJobs": "Federation Jobs"
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"retryAllQueuesNow": "Prova de nou d'executar totes les cues",
	"clearQueue": "Esborra la cua de feina",
	"clearQueueConfirmTitle": "Esteu segur que voleu esborrar la cua?",
	"clearQueueConfirmText": "Les notes no lliurades que quedin a la cua no es federaran. Normalment aquesta operació no és necessària.",
	"retryAllQueuesConfirmTitle": "Tornar a intentar-ho tot?",
	"retryAllQueuesConfirmText": "Això farà que la càrrega del servidor augmenti temporalment.",
	"federationJobs": "Treballs de federació"
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"retryAllQueuesNow": "Obnovit všechny běžící fronty",
	"clearQueue": "Vyčistit frontu",
	"clearQueueConfirmTitle": "Jste si jisti že zrušit všechny úlohy ve frontě?",
	"clearQueueConfirmText": "Jakékoliv nedoručené poznámky ve frontě nebudou sdružovány. Většinou tahle operace není zapotřebí.",
	"retryAllQueuesConfirmTitle": "Opravdu chcete obnovit všechno?",
	"retryAllQueuesConfirmText": "Tohle dočasně zvýší zatěž na server.",
	"federationJobs": "Federation Jobs"
}
</locale>

<locale locale="da-DK" lang="json">
{
	"retryAllQueuesNow": "Retry running all queues",
	"clearQueue": "Clear queue",
	"clearQueueConfirmTitle": "Are you sure that you want to clear the queue?",
	"clearQueueConfirmText": "Any undelivered notes remaining in the queue will not be federated. Usually this operation is not needed.",
	"retryAllQueuesConfirmTitle": "Really retry all?",
	"retryAllQueuesConfirmText": "This will temporarily increase the server load.",
	"federationJobs": "Federation Jobs"
}
</locale>

<locale locale="de-DE" lang="json">
{
	"retryAllQueuesNow": "Sofort Warteschlangen erneut ausführen",
	"clearQueue": "Warteschlange leeren",
	"clearQueueConfirmTitle": "Möchtest du die Warteschlange wirklich leeren?",
	"clearQueueConfirmText": "Hierdurch werden jegliche noch nicht gesendete Notizen nicht föderiert. Normalerweise wird dies nicht benötigt.",
	"retryAllQueuesConfirmTitle": "Wirklich erneut versuchen?",
	"retryAllQueuesConfirmText": "Dies wird zu einer temporären Erhöhung der Serverlast führen.",
	"federationJobs": "Föderation Jobs"
}
</locale>

<locale locale="en-US" lang="json">
{
	"retryAllQueuesNow": "Retry running all queues",
	"clearQueue": "Clear queue",
	"clearQueueConfirmTitle": "Are you sure that you want to clear the queue?",
	"clearQueueConfirmText": "Any undelivered notes remaining in the queue will not be federated. Usually this operation is not needed.",
	"retryAllQueuesConfirmTitle": "Really retry all?",
	"retryAllQueuesConfirmText": "This will temporarily increase the server load.",
	"federationJobs": "Federation Jobs"
}
</locale>

<locale locale="es-ES" lang="json">
{
	"retryAllQueuesNow": "Reintentar inmediatamente todas las colas",
	"clearQueue": "Limpiar cola",
	"clearQueueConfirmTitle": "¿Quieres limpiar la cola?",
	"clearQueueConfirmText": "Las notas aún no entregadas no se federarán. Normalmente no se necesita ejecutar esta operación",
	"retryAllQueuesConfirmTitle": "Desea ¿reintentar inmediatamente todas las colas?",
	"retryAllQueuesConfirmText": "La carga del servidor está incrementándose temporalmente ",
	"federationJobs": "Trabajos de Federación"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"retryAllQueuesNow": "Réessayer tous les fils d'attente immédiatement",
	"clearQueue": "Vider la file d’attente",
	"clearQueueConfirmTitle": "Êtes-vous sûr·e de vouloir vider la file d’attente ?",
	"clearQueueConfirmText": "Les notes non distribuées ne seront pas délivrées. Normalement, vous n'avez pas besoin d'effectuer cette opération.",
	"retryAllQueuesConfirmTitle": "Vraiment réessayer ?",
	"retryAllQueuesConfirmText": "Cela peut augmenter temporairement la charge du serveur.",
	"federationJobs": "Federation Jobs"
}
</locale>

<locale locale="id-ID" lang="json">
{
	"retryAllQueuesNow": "Coba jalankan lagi semua antrian",
	"clearQueue": "Bersihkan antrian",
	"clearQueueConfirmTitle": "Apakah kamu yakin ingin membersihkan antrian?",
	"clearQueueConfirmText": "Seluruh sisa catatan yang tidak tersampaikan di dalam antrian tidak akan difederasi. Biasanya operasi ini TIDAK dibutuhkan.",
	"retryAllQueuesConfirmTitle": "Yakin ingin mencoba lagi semuanya?",
	"retryAllQueuesConfirmText": "Hal ini akan meningkatkan beban sementara ke peladen.",
	"federationJobs": "Federation Jobs"
}
</locale>

<locale locale="it-IT" lang="json">
{
	"retryAllQueuesNow": "Ritenta di consumare tutte le code",
	"clearQueue": "Svuota coda",
	"clearQueueConfirmTitle": "Vuoi davvero svuotare la coda?",
	"clearQueueConfirmText": "Le note ancora non distribuite non verranno rilasciate. Solitamente, non è necessario eseguire questa operazione.",
	"retryAllQueuesConfirmTitle": "Vuoi ritentare adesso?",
	"retryAllQueuesConfirmText": "Potrebbe sovraccaricare il server temporaneamente.",
	"federationJobs": "Coda di federazione"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"retryAllQueuesNow": "すべてのキューを今すぐ再試行",
	"clearQueue": "キューをクリア",
	"clearQueueConfirmTitle": "キューをクリアしますか？",
	"clearQueueConfirmText": "未配達の投稿は配送されなくなります。通常この操作を行う必要はありません。",
	"retryAllQueuesConfirmTitle": "今すぐ再試行しますか？",
	"retryAllQueuesConfirmText": "一時的にサーバーの負荷が増大することがあります。",
	"federationJobs": "連合ジョブ"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"retryAllQueuesNow": "キューを全部もっかいやり直す",
	"clearQueue": "キューをほかす",
	"clearQueueConfirmTitle": "キューをほかしとこか？",
	"clearQueueConfirmText": "未配達の投稿は配送されんなるで。ふつうこの操作を行う必要は無いんやけどな。",
	"retryAllQueuesConfirmTitle": "もっかいやってみるか？",
	"retryAllQueuesConfirmText": "一時的にサーバー重なるかもしれへんで。",
	"federationJobs": "連合ジョブ"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"retryAllQueuesNow": "Retry running all queues",
	"clearQueue": "Clear queue",
	"clearQueueConfirmTitle": "Are you sure that you want to clear the queue?",
	"clearQueueConfirmText": "Any undelivered notes remaining in the queue will not be federated. Usually this operation is not needed.",
	"retryAllQueuesConfirmTitle": "Really retry all?",
	"retryAllQueuesConfirmText": "This will temporarily increase the server load.",
	"federationJobs": "Federation Jobs"
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"retryAllQueuesNow": "Retry running all queues",
	"clearQueue": "Clear queue",
	"clearQueueConfirmTitle": "Are you sure that you want to clear the queue?",
	"clearQueueConfirmText": "Any undelivered notes remaining in the queue will not be federated. Usually this operation is not needed.",
	"retryAllQueuesConfirmTitle": "Really retry all?",
	"retryAllQueuesConfirmText": "This will temporarily increase the server load.",
	"federationJobs": "Federation Jobs"
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"retryAllQueuesNow": "모든 큐를 다시 시도",
	"clearQueue": "대기열 비우기",
	"clearQueueConfirmTitle": "대기열을 비우시겠습니까?",
	"clearQueueConfirmText": "대기열에 남아 있는 노트는 더 이상 연합되지 않습니다. 보통의 경우 이 작업은 필요하지 않습니다.",
	"retryAllQueuesConfirmTitle": "지금 다시 시도하시겠습니까?",
	"retryAllQueuesConfirmText": "일시적으로 서버의 부하가 증가할 수 있습니다.",
	"federationJobs": "연합 작업"
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"retryAllQueuesNow": "Retry running all queues",
	"clearQueue": "Wachtrij wissen",
	"clearQueueConfirmTitle": "Weet je zeker dat je de wachtrji leeg wil maken?",
	"clearQueueConfirmText": "Niet-bezorgde biljetten die nog in de wachtrij staan, worden niet gefedereerd. Meestal is deze operatie niet nodig.",
	"retryAllQueuesConfirmTitle": "Really retry all?",
	"retryAllQueuesConfirmText": "This will temporarily increase the server load.",
	"federationJobs": "Federation Jobs"
}
</locale>

<locale locale="no-NO" lang="json">
{
	"retryAllQueuesNow": "Retry running all queues",
	"clearQueue": "Tøm kø",
	"clearQueueConfirmTitle": "Er du sikker på at du vil tømme køen?",
	"clearQueueConfirmText": "Any undelivered notes remaining in the queue will not be federated. Usually this operation is not needed.",
	"retryAllQueuesConfirmTitle": "Vil du prøve igjen akkurat nå?",
	"retryAllQueuesConfirmText": "This will temporarily increase the server load.",
	"federationJobs": "Federation Jobs"
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"retryAllQueuesNow": "Retry running all queues",
	"clearQueue": "Wyczyść kolejkę",
	"clearQueueConfirmTitle": "Czy na pewno chcesz wyczyścić kolejkę?",
	"clearQueueConfirmText": "Wszystkie niewysłane wpisy z kolejki nie zostaną wysłane. Zwykle to nie jest konieczne.",
	"retryAllQueuesConfirmTitle": "Really retry all?",
	"retryAllQueuesConfirmText": "This will temporarily increase the server load.",
	"federationJobs": "Federation Jobs"
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"retryAllQueuesNow": "Tentar novamente todas as pendências",
	"clearQueue": "Limpar a fila",
	"clearQueueConfirmTitle": "Deseja limpar a fila?",
	"clearQueueConfirmText": "As postagens não entregues deixarão de ser enviadas. Geralmente, não é necessário realizar essa operação.",
	"retryAllQueuesConfirmTitle": "Gostaria de tentar novamente agora?",
	"retryAllQueuesConfirmText": "Isso irá temporariamente aumentar a carga do servidor.",
	"federationJobs": "Tarefas de Federação"
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"retryAllQueuesNow": "Повторить все очереди сейчас",
	"clearQueue": "Очистить очередь",
	"clearQueueConfirmTitle": "Очистить очередь?",
	"clearQueueConfirmText": "Всё, что осталось в очереди, не будет доставлено. Обычно эта операция НЕ нужна.",
	"retryAllQueuesConfirmTitle": "Хотите попробовать ещё раз?",
	"retryAllQueuesConfirmText": "Нагрузка на сервер может увеличиться",
	"federationJobs": "Процессы федерации"
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"retryAllQueuesNow": "Retry running all queues",
	"clearQueue": "Vyčistiť frontu",
	"clearQueueConfirmTitle": "Naozaj chcete zrušiť všetky úlohy vo fronte?",
	"clearQueueConfirmText": "Všetky nedoručené poznámky čakajúce vo fronte nebudú federované. Zvyčajne táto operácia nie je potrebná.",
	"retryAllQueuesConfirmTitle": "Really retry all?",
	"retryAllQueuesConfirmText": "This will temporarily increase the server load.",
	"federationJobs": "Federation Jobs"
}
</locale>

<locale locale="th-TH" lang="json">
{
	"retryAllQueuesNow": "ลองใหม่ทุกคิวทันที",
	"clearQueue": "ล้างคิว",
	"clearQueueConfirmTitle": "ต้องการล้างคิวใช่ไหม?",
	"clearQueueConfirmText": "โพสต์ที่ยังค้างในคิวจะไม่ถูกจัดส่งอีกต่อไป โดยปกติแล้วการดำเนินการนี้ไม่จำเป็น",
	"retryAllQueuesConfirmTitle": "ลองใหม่ทันทีเลยไหม?",
	"retryAllQueuesConfirmText": "สิ่งนี้จะเพิ่มการโหลดเซิร์ฟเวอร์ชั่วคราวนะ",
	"federationJobs": "งานสหพันธ์"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"retryAllQueuesNow": "Tüm kuyrukları yeniden çalıştırmayı deneyin",
	"clearQueue": "Kuyruğu temizle",
	"clearQueueConfirmTitle": "Kuyruğu silmek istediğinden emin misin?",
	"clearQueueConfirmText": "Kuyrukta kalan teslim edilmemiş notlar birleştirilmeyecek. Genellikle bu işlem gerekli değildir.",
	"retryAllQueuesConfirmTitle": "Cidden hepsini tekrar denemek istiyor musunuz?",
	"retryAllQueuesConfirmText": "Bu, sunucu yükünü geçici olarak artıracaktır.",
	"federationJobs": "Federasyon İşleri"
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"retryAllQueuesNow": "Retry running all queues",
	"clearQueue": "Clear queue",
	"clearQueueConfirmTitle": "Are you sure that you want to clear the queue?",
	"clearQueueConfirmText": "Any undelivered notes remaining in the queue will not be federated. Usually this operation is not needed.",
	"retryAllQueuesConfirmTitle": "Really retry all?",
	"retryAllQueuesConfirmText": "This will temporarily increase the server load.",
	"federationJobs": "Federation Jobs"
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"retryAllQueuesNow": "Повторно запустити всі черги",
	"clearQueue": "Очистити чергу",
	"clearQueueConfirmTitle": "Ви впевнені, що хочете очистити чергу?",
	"clearQueueConfirmText": "Будь-які невідправлені нотатки, що залишилися в черзі, не будуть передані. Зазвичай ця операція НЕ потрібна.",
	"retryAllQueuesConfirmTitle": "Справді повторити все?",
	"retryAllQueuesConfirmText": "Це тимчасово збільшить навантаження на сервер.",
	"federationJobs": "Завдання федерації"
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"retryAllQueuesNow": "Thử lại cho tất cả hàng chờ",
	"clearQueue": "Xóa hàng đợi",
	"clearQueueConfirmTitle": "Bạn có chắc muốn xóa hàng đợi?",
	"clearQueueConfirmText": "Mọi tút chưa được gửi còn lại trong hàng đợi sẽ không được liên hợp. Thông thường thao tác này không cần thiết.",
	"retryAllQueuesConfirmTitle": "Bạn có muốn thử lại?",
	"retryAllQueuesConfirmText": "Điều này sẽ tạm thời làm tăng mức độ tải của máy chủ.",
	"federationJobs": "Federation Jobs"
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"retryAllQueuesNow": "立刻重试所有队列",
	"clearQueue": "清除队列",
	"clearQueueConfirmTitle": "确定要清除队列吗？",
	"clearQueueConfirmText": "未送达的帖子将不会被投递。 通常无需执行此操作。",
	"retryAllQueuesConfirmTitle": "要再尝试一次吗？",
	"retryAllQueuesConfirmText": "可能会使服务器负荷在一定时间内增加",
	"federationJobs": "联邦作业"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"retryAllQueuesNow": "立刻重試所有佇列",
	"clearQueue": "清除佇列",
	"clearQueueConfirmTitle": "確定要清除佇列嗎？",
	"clearQueueConfirmText": "未成功發佈的貼文將不會再嘗試發佈。通常不需要進行這項操作。",
	"retryAllQueuesConfirmTitle": "要現在重試嗎？",
	"retryAllQueuesConfirmText": "伺服器的負荷可能會暫時增加。",
	"federationJobs": "聯邦通訊作業"
}
</locale>
