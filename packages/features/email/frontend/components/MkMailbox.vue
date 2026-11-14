<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section :class="$style.root" :aria-busy="busy">
	<h2>{{ t.title }}</h2>
	<p v-if="!$i">{{ t.loginRequired }}</p>
	<template v-else>
		<div :class="$style.toolbar">
			<button v-for="item in tabs" :key="item" type="button" :disabled="busy" :aria-pressed="tab === item" @click="changeTab(item)">{{ t[item] }}</button>
			<button type="button" :disabled="busy" @click="run(refresh)">{{ t.refresh }}</button>
			<button type="button" @click="os.pageWindow('/my/mail')">{{ t.openWindow }}</button>
		</div>
		<p v-if="error" role="alert">{{ error }}</p>
		<p v-if="notice" role="status">{{ notice }}</p>
		<p v-if="state && !state.available">{{ t.unavailable }}</p>
		<template v-if="state?.available">
			<p>{{ state.address }} · {{ t.usage }}: {{ state.usedBytes }} / {{ state.quotaBytes }} B</p>
			<p v-if="!state.enabled">{{ t.disabled }}</p>
			<template v-if="tab === 'inbox'">
				<template v-if="selected">
					<div :class="$style.toolbar">
						<button type="button" @click="selected = null">{{ t.back }}</button>
						<button type="button" :disabled="busy" @click="run(() => setRead(!selected?.readAt))">{{ selected.readAt ? t.markUnread : t.markRead }}</button>
						<button type="button" :disabled="busy" @click="remove">{{ t.delete }}</button>
						<button v-if="selected.localStored" type="button" :disabled="busy" @click="run(() => downloadRaw(selected!.id))">{{ t.raw }}</button>
					</div>
					<h3>{{ selected.subject || t.noSubject }}</h3>
					<p>{{ selected.from }} · {{ selected.createdAt }}</p>
					<p v-if="selected.parseState !== 'parsed'">{{ t[selected.parseState] }}</p>
					<p v-if="!selected.localStored">{{ t.notStored }}</p>
					<p v-if="selected.localError">{{ selected.localError === 'quota' ? t.quotaError : t.disabled }}</p>
					<label v-if="selected.html"><input v-model="showHtml" type="checkbox"> {{ t.showHtml }}</label>
					<p v-if="showHtml && selected.html">{{ t.htmlSafety }}</p>
					<iframe v-if="showHtml && selected.html" :title="t.body" :srcdoc="isolatedMailDocument(selected.html)" sandbox="" referrerpolicy="no-referrer" :class="$style.html"></iframe>
					<pre v-else :class="$style.body">{{ selected.text }}</pre>
					<ul><li v-for="attachment in selected.attachments" :key="attachment.id"><button type="button" :disabled="busy" @click="run(() => downloadAttachment(selected!.id, attachment.id))">{{ attachment.filename }} ({{ attachment.size }} B)</button></li></ul>
				</template>
				<template v-else>
					<p v-if="!messages.length">{{ t.empty }}</p>
					<ul :class="$style.messages"><li v-for="message in messages" :key="message.id"><button type="button" :disabled="busy" :class="{ [$style.unread]: !message.readAt }" @click="run(() => openMessage(message.id))"><span>{{ message.subject || t.noSubject }}</span><small>{{ message.from }} · {{ message.createdAt }}</small></button></li></ul>
					<button v-if="moreInbox" type="button" :disabled="busy" @click="run(() => loadInbox(true))">{{ t.more }}</button>
				</template>
			</template>
			<form v-else-if="tab === 'compose'" :class="$style.form" @submit.prevent="send">
				<label>{{ t.to }}<input v-model="to" :disabled="busy" required placeholder="alice@example.com, bob@example.com"></label>
				<label>{{ t.cc }}<input v-model="cc" :disabled="busy"></label>
				<label>{{ t.bcc }}<input v-model="bcc" :disabled="busy"></label>
				<label>{{ t.subject }}<input v-model="subject" :disabled="busy" maxlength="998"></label>
				<label>{{ t.format }}<select v-model="format" :disabled="busy"><option value="text">{{ t.text }}</option><option value="mfm">MFM</option></select></label>
				<label>{{ t.body }}<textarea v-model="body" :disabled="busy" rows="12" required maxlength="200000"></textarea></label>
				<p>{{ t.composeHelp }}</p>
				<div :class="$style.toolbar"><button type="button" :disabled="busy" @click="run(preview)">{{ t.preview }}</button><button type="submit" :disabled="busy || !state.enabled">{{ t.send }}</button></div>
				<template v-if="previewResult"><p>{{ t.htmlSafety }}</p><iframe v-if="previewResult.html" :title="t.preview" :srcdoc="isolatedMailDocument(previewResult.html, 'preview')" sandbox="" referrerpolicy="no-referrer" :class="$style.html"></iframe><pre v-else :class="$style.body">{{ previewResult.text }}</pre></template>
			</form>
			<template v-else-if="tab === 'sent'">
				<p>{{ t.deliveryWarning }}</p><p v-if="!sent.length">{{ t.empty }}</p>
				<ul :class="$style.messages"><li v-for="message in sent" :key="message.id"><strong>{{ message.subject || t.noSubject }}</strong><p>{{ message.to.join(', ') }} · {{ message.createdAt }}</p><p>{{ t[message.state] }}</p><p v-if="message.accepted.length">{{ t.accepted }}: {{ message.accepted.join(', ') }}</p><p v-if="message.rejected.length">{{ t.rejected }}: {{ message.rejected.join(', ') }}</p><p v-if="message.reason">{{ message.reason }}</p><button type="button" :disabled="busy || message.state === 'sending'" @click="removeSent(message.id)">{{ t.delete }}</button></li></ul>
				<button v-if="moreSent" type="button" :disabled="busy" @click="run(() => loadSent(true))">{{ t.more }}</button>
			</template>
			<div v-else :class="$style.form">
				<label><input :checked="state.enabled" type="checkbox" :disabled="busy" @change="run(() => configure(($event.target as HTMLInputElement).checked))"> {{ t.enabled }}</label>
				<h3>{{ t.forwarding }}</h3>
				<p>{{ state.forwarding.address || t.noForwarding }} · {{ state.forwarding.verified ? t.verified : t.unverified }}</p>
				<p>{{ t.revision }}: {{ state.forwarding.revision }} · {{ state.forwarding.enabled ? t.forwardingEnabled : t.forwardingDisabled }}</p>
				<p>{{ t.forwardingHelp }}</p>
				<form :class="$style.form" @submit.prevent="run(saveForwarding)"><label>{{ t.destination }}<input v-model="forwardAddress" type="email" :disabled="busy"></label><label><input v-model="keepLocalCopy" type="checkbox" :disabled="busy"> {{ t.keepLocalCopy }}</label><button type="submit" :disabled="busy">{{ t.saveForwarding }}</button></form>
				<form :class="$style.form" @submit.prevent="run(confirmForwarding)"><label>{{ t.confirmToken }}<input v-model="confirmToken" :disabled="busy" required autocomplete="off"></label><button type="submit" :disabled="busy">{{ t.confirm }}</button></form>
			</div>
		</template>
	</template>
</section>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useLocale } from 'virtual:vite-vue-internationalization';
import { $i } from '@features/auth/frontend/i.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import * as os from '@features/ui/frontend/os.js';
import { downloadMailFile } from '../download.js';
import { isolatedMailDocument } from '../html.js';
import type { Locale } from 'i18n';

const props = defineProps<{ verificationCode?: string }>();

const globalLocale = useLocale<Locale>(import.meta.url);
const t = computed(() => globalLocale.value.env._mail);
const tabs = ['inbox', 'compose', 'sent', 'settings'] as const;
const tab = ref<typeof tabs[number]>(props.verificationCode ? 'settings' : 'inbox');
const busy = ref(false);
const error = ref('');
const notice = ref('');
const getState = () => misskeyApi('email/state', {});
const getInbox = (untilId?: string) => misskeyApi('email/list', { limit: 30, ...(untilId ? { untilId } : {}) });
const getSent = (untilId?: string) => misskeyApi('email/sent', { limit: 30, ...(untilId ? { untilId } : {}) });
const getMessage = (id: string) => misskeyApi('email/show', { id });
const state = ref<Awaited<ReturnType<typeof getState>> | null>(null);
const messages = ref<Awaited<ReturnType<typeof getInbox>>>([]);
const sent = ref<Awaited<ReturnType<typeof getSent>>>([]);
const selected = ref<Awaited<ReturnType<typeof getMessage>> | null>(null);
const moreInbox = ref(false);
const moreSent = ref(false);
const showHtml = ref(false);
const to = ref('');
const cc = ref('');
const bcc = ref('');
const subject = ref('');
const body = ref('');
const format = ref<'text' | 'mfm'>('text');
const previewResult = ref<{ html: string | null; text: string } | null>(null);
const forwardAddress = ref('');
const keepLocalCopy = ref(true);
const confirmToken = ref(props.verificationCode ?? '');
let lastSubmission: { fingerprint: string; key: string } | null = null;
watch([body, format], () => { previewResult.value = null; });

async function run(action: () => Promise<void>) {
	if (busy.value) return;
	busy.value = true;
	error.value = '';
	try { await action(); } catch (err) {
		error.value = `${t.value.error}${typeof err === 'object' && err && 'code' in err ? ` (${String(err.code)})` : ''}`;
	} finally { busy.value = false; }
}

async function loadState() {
	state.value = await getState();
	forwardAddress.value = state.value.forwarding.address ?? '';
	keepLocalCopy.value = state.value.forwarding.keepLocalCopy;
}

async function loadInbox(append = false) {
	const result = await getInbox(append ? messages.value.at(-1)?.id : undefined);
	messages.value = append ? [...messages.value, ...result] : result;
	moreInbox.value = result.length === 30;
}

async function loadSent(append = false) {
	const result = await getSent(append ? sent.value.at(-1)?.id : undefined);
	sent.value = append ? [...sent.value, ...result] : result;
	moreSent.value = result.length === 30;
}

async function refresh() {
	await loadState();
	if (!state.value?.available) return;
	if (tab.value === 'inbox') {
		await loadInbox();
		if (selected.value) selected.value = await getMessage(selected.value.id);
	}
	if (tab.value === 'sent') await loadSent();
}

function changeTab(value: typeof tabs[number]) {
	tab.value = value;
	selected.value = null;
	void run(refresh);
}

async function openMessage(id: string) {
	selected.value = await getMessage(id);
	showHtml.value = false;
	if (!selected.value.readAt) await setRead(true);
}

async function setRead(isRead: boolean) {
	if (!selected.value) return;
	await misskeyApi('email/read', { id: selected.value.id, isRead });
	selected.value = await getMessage(selected.value.id);
	await loadInbox();
}

async function remove() {
	if (busy.value || !selected.value) return;
	const id = selected.value.id;
	const { canceled } = await os.confirm({ type: 'warning', text: t.value.deleteConfirm });
	if (canceled) return;
	await run(async () => {
		await misskeyApi('email/delete', { id });
		selected.value = null;
		await loadInbox();
		await loadState();
	});
}

async function removeSent(id: string) {
	if (busy.value) return;
	const { canceled } = await os.confirm({ type: 'warning', text: t.value.deleteSentConfirm });
	if (canceled) return;
	await run(async () => {
		await misskeyApi('email/delete', { id });
		await loadSent();
		await loadState();
	});
}

async function downloadRaw(id: string) { downloadMailFile(await misskeyApi('email/raw', { id })); }

async function downloadAttachment(id: string, attachmentId: number) { downloadMailFile(await misskeyApi('email/attachment', { id, attachmentId })); }

async function preview() { previewResult.value = await misskeyApi('email/preview', { body: body.value, format: format.value }); }

async function send() {
	if (busy.value || !state.value?.enabled) return;
	const splitRecipients = (value: string) => value.split(/[,;\n]/).map(x => x.trim()).filter(Boolean);
	const recipients = splitRecipients(to.value);
	const ccRecipients = splitRecipients(cc.value);
	const bccRecipients = splitRecipients(bcc.value);
	const payload = { to: recipients, cc: ccRecipients, bcc: bccRecipients, subject: subject.value, body: body.value, format: format.value };
	const { canceled } = await os.confirm({ type: 'warning', text: `${t.value.sendConfirm}\n${[...recipients, ...ccRecipients, ...bccRecipients].join(', ')}\n${subject.value}` });
	if (canceled) return;
	await run(async () => {
		const fingerprint = JSON.stringify(payload);
		if (lastSubmission?.fingerprint !== fingerprint) lastSubmission = { fingerprint, key: crypto.randomUUID() };
		// Retain the key and draft after an uncertain response. Same-content retries must not duplicate mail.
		notice.value = t.value.uncertainRetry;
		const result = await misskeyApi('email/send', { ...payload, idempotencyKey: lastSubmission.key });
		notice.value = `${t.value[result.state]} ${t.value.deliveryWarning}`;
		if (result.state !== 'unknown' && result.state !== 'failed') {
			to.value = '';
			cc.value = '';
			bcc.value = '';
			subject.value = '';
			body.value = '';
			lastSubmission = null;
		}
		tab.value = 'sent';
		await loadSent();
	});
}

async function configure(enabled: boolean) { await misskeyApi('email/configure', { enabled }); await loadState(); }

async function saveForwarding() {
	await misskeyApi('email/forwarding/configure', { address: forwardAddress.value.trim() || null, keepLocalCopy: keepLocalCopy.value });
	notice.value = forwardAddress.value.trim() ? t.value.verificationSent : t.value.forwardingDisabled;
	await loadState();
}

async function confirmForwarding() {
	await misskeyApi('email/forwarding/confirm', { token: confirmToken.value.trim() });
	confirmToken.value = '';
	await loadState();
	notice.value = t.value.verified;
}

onMounted(() => { if ($i) void run(refresh); });
</script>

<style lang="scss" module>
.root { padding: 16px; min-width: 0; overflow-wrap: anywhere; }
.toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-block: 12px; }
.root button, .root input, .root select, .root textarea { font: inherit; color: inherit; background: var(--MI_THEME-panel); border: 1px solid var(--MI_THEME-divider); border-radius: 6px; padding: 8px; box-sizing: border-box; }
.root button { cursor: pointer; }
.root button:disabled { opacity: .5; cursor: default; }
.root button[aria-pressed="true"] { border-color: var(--MI_THEME-accent); }
.form { display: grid; gap: 16px; }
.form label { display: grid; gap: 6px; }
.form input:not([type="checkbox"]), .form textarea, .form select { width: 100%; min-width: 0; }
.form input[type="checkbox"] { width: auto; justify-self: start; }
.messages { list-style: none; padding: 0; }
.messages li { border-bottom: 1px solid var(--MI_THEME-divider); padding-block: 8px; }
.messages button { display: grid; gap: 6px; width: 100%; text-align: start; }
.messages small { font-weight: normal; overflow-wrap: anywhere; }
.unread { font-weight: bold; }
.body { white-space: pre-wrap; overflow-wrap: anywhere; font-family: inherit; }
.html { width: 100%; height: 420px; border: 1px solid var(--MI_THEME-divider); background: white; color-scheme: light; }
</style>
