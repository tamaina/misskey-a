<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<details class="_panel" :class="$style.panel" @toggle="toggle">
	<summary>{{ $locale.sfc.title }}</summary>
	<form v-if="loaded" class="_gaps_s" :class="$style.form" @input="saved = false" @submit.prevent="save">
		<label><input v-model="enabled" type="checkbox" :disabled="busy"/> {{ $locale.sfc.enable }}</label>
		<template v-if="enabled">
			<label><MkInput v-model="localTime" type="time" required :disabled="busy"><template #label>{{ $locale.sfc.time }}</template></MkInput></label>
			<label><MkInput v-model="zone" required :disabled="busy"><template #label>{{ $locale.sfc.zone }}</template></MkInput></label>
			<p>{{ $locale.sfc.device }} <MkA :class="$style.link" to="/settings/notifications">{{ $locale.sfc.deviceSettings }}</MkA></p>
		</template>
		<div><MkButton type="submit" primary :disabled="busy" :wait="busy">{{ $locale.sfc.save }}</MkButton></div>
	</form>
	<p v-if="saved" role="status">{{ $locale.sfc.saved }}</p>
	<p v-if="failed" role="alert">{{ $locale.sfc.failed }}</p>
	<MkButton v-if="failed && !loaded" @click="load">{{ $locale.sfc.retry }}</MkButton>
</details>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';

const enabled = ref(false);
const localTime = ref('09:00');
const zone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
const loaded = ref(false);
const failed = ref(false);
const busy = ref(false);
const saved = ref(false);

function toggle(event: Event) {
	if ((event.currentTarget as HTMLDetailsElement).open && !loaded.value) void load();
}

async function load() {
	if (busy.value) return;
	busy.value = true;
	failed.value = false;
	try {
		const { schedule } = await misskeyApi('fukushu/reminder/show');
		enabled.value = schedule !== null;
		if (schedule) { localTime.value = schedule.localTime; zone.value = schedule.zone; }
		loaded.value = true;
	} catch { failed.value = true; } finally { busy.value = false; }
}

async function save() {
	if (busy.value || !loaded.value) return;
	busy.value = true;
	saved.value = failed.value = false;
	try {
		await misskeyApi('fukushu/reminder/update', { schedule: enabled.value ? { localTime: localTime.value, zone: zone.value.trim() } : null });
		saved.value = true;
	} catch { failed.value = true; } finally { busy.value = false; }
}
</script>

<style module>
.panel { padding: 16px; }
.panel summary { cursor: pointer; }
.form { margin-top: 12px; }
.form p { margin: 0; }
.link { text-decoration: underline; }
</style>

<locale locale="ja-JP" lang="json">
{
	"title": "復習リマインダー",
	"enable": "復習期限の来たカードがある日に通知する",
	"time": "通知時刻",
	"zone": "タイムゾーン（例 Asia/Tokyo）",
	"device": "この端末で受け取るにはプッシュ通知を有効にしてください。",
	"deviceSettings": "端末の通知設定",
	"save": "リマインダー設定を保存",
	"saved": "設定を保存しました。",
	"failed": "設定を確認できませんでした。通信状態とタイムゾーンを確認してください。",
	"retry": "再読み込み"
}
</locale>
<locale locale="en-US" lang="json">
{
	"title": "Review reminders",
	"enable": "Notify me on days when cards are due",
	"time": "Reminder time",
	"zone": "Time zone (e.g. Europe/London)",
	"device": "Enable push notifications on each device where you want reminders.",
	"deviceSettings": "Device notification settings",
	"save": "Save reminder settings",
	"saved": "Settings saved.",
	"failed": "Could not confirm your settings. Check your connection and time zone.",
	"retry": "Reload"
}
</locale>
