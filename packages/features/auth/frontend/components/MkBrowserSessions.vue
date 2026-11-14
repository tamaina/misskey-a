<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<FormSection>
	<template #label>{{ $locale.sfc.title }}</template>
	<div class="_gaps_m">
		<MkInfo>{{ $locale.sfc.description }}</MkInfo>
		<MkInfo v-if="!individual" warn>{{ $locale.sfc.legacy }}</MkInfo>
		<p v-if="error" role="alert">{{ $locale.sfc.failed }}</p>
		<MkFolder v-for="session in sessions" :key="session.id">
			<template #label>{{ session.current ? $locale.sfc.current : $locale.sfc.other }} · {{ session.lastIp ?? $locale.sfc.unknown }} · {{ session.revokedAt ? $locale.sfc.revoked : $locale.sfc.active }}</template>
			<template #caption>
				<div :class="$style.agent">{{ session.lastUserAgent ?? $locale.sfc.unknown }}</div>
				{{ $locale.sfc.used }} <MkTime :time="session.lastUsedAt"/>
			</template>
			<div class="_gaps_s">
				<div>{{ $locale.sfc.created }} <MkTime :time="session.createdAt"/></div>
				<MkButton v-if="!session.revokedAt" danger :disabled="busy" @click="revoke(session)">{{ session.current ? $locale.sfc.signout : $locale.sfc.revoke }}</MkButton>
				<p>{{ $locale.sfc.history }}</p>
				<MkPagination :paginator="sessionHistory(session.id)" withControl :forceDisableInfiniteScroll="true">
					<template #default="{ items }">
						<div v-for="item in items" :key="item.id" class="_gaps_s">
							<div><MkTime :time="item.createdAt"/> · <code>{{ item.ip }}</code></div>
							<div :class="$style.agent">{{ item.headers['user-agent'] ?? $locale.sfc.unknown }}</div>
						</div>
					</template>
				</MkPagination>
			</div>
		</MkFolder>
		<MkButton v-if="hasMore" :disabled="busy" @click="load">{{ $locale.sfc.more }}</MkButton>
		<MkButton :disabled="busy" @click="reload">{{ $locale.sfc.reload }}</MkButton>
	</div>
</FormSection>
</template>

<script lang="ts" setup>
import { onActivated, onDeactivated, onMounted, onUnmounted, markRaw, ref, watch } from 'vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import * as os from '@features/ui/frontend/os.js';
import { ensureSignin } from '../i.js';
import { signout } from '../signout.js';

const ownerId = ensureSignin().id; const ownerToken = ensureSignin().token;
const individual = ownerToken.startsWith('bs_');
const read = (offset: number) => misskeyApi('i/sessions', { offset, limit: 20 });
type Session = Awaited<ReturnType<typeof read>>[number];
const sessions = ref<Session[]>([]);
const histories = new Map<string, Paginator<'i/signin-history'>>();

function sessionHistory(sessionId: string) {
	let history = histories.get(sessionId);
	if (!history) {
		history = markRaw(new Paginator('i/signin-history', { limit: 10, params: { browserSessionId: sessionId } }));
		histories.set(sessionId, history);
	}
	return history;
}

const busy = ref(false); const error = ref(false); const hasMore = ref(true);
let active = true; let generation = 0; let offset = 0;
const current = () => active && ensureSignin().id === ownerId && ensureSignin().token === ownerToken;

async function load() {
	if (busy.value || !current()) return;
	busy.value = true; error.value = false;
	const turn = generation;
	try {
		const values = await read(offset);
		if (!current() || turn !== generation) return;
		offset += values.length; hasMore.value = values.length === 20;
		const existing = new Set(sessions.value.map(value => value.id));
		sessions.value.push(...values.filter(value => !existing.has(value.id)));
	} catch { if (current() && turn === generation) error.value = true; } finally { busy.value = false; }
}

function reload() { histories.clear(); offset = 0; sessions.value = []; hasMore.value = true; return load(); }

async function revoke(session: Session) {
	if (busy.value || !current() || session.revokedAt) return;
	busy.value = true; error.value = false;
	const turn = generation;
	try {
		const confirmation = await os.confirm({ type: 'warning', text: session.current ? $locale.value.sfc.confirmCurrent : $locale.value.sfc.confirmOther });
		if (!current() || turn !== generation || confirmation.canceled) return;
		if (session.current) { await signout(); return; }
		await misskeyApi('i/sessions/revoke', { sessionId: session.id });
		if (!current() || turn !== generation) return;
		session.revokedAt = new Date().toISOString();
	} catch { if (current() && turn === generation) error.value = true; } finally { busy.value = false; }
}

const leave = () => { active = false; generation++; histories.clear(); sessions.value = []; offset = 0; };
watch(() => [ensureSignin().id, ensureSignin().token], () => { if (!current()) leave(); }, { flush: 'sync' });
onMounted(load);
onActivated(() => { if (!active) { active = true; void reload(); } });
onDeactivated(leave); onUnmounted(leave);
</script>

<style lang="scss" module>
.agent { overflow-wrap: anywhere; white-space: normal; }
</style>

<locale locale="ja-JP" lang="json">
{
	"title": "ログイン中の端末",
	"description": "ログインごとに個別のセッションを発行します。覚えのないログインを失効させると、そのログインの通信と重要操作の本人確認も無効になります。",
	"legacy": "このログインは旧形式のため一覧の個別失効には対応していません。ログインし直すと新しい個別セッションになります。",
	"current": "このログイン",
	"other": "別のログイン",
	"created": "ログイン日時:",
	"used": "最終利用:",
	"revoked": "失効済み",
	"active": "有効",
	"unknown": "記録なし",
	"history": "このセッションのログイン履歴（IP・User-Agent）",
	"signout": "このログインからサインアウト",
	"revoke": "このログインを失効",
	"confirmCurrent": "このログインからサインアウトしますか。",
	"confirmOther": "選択したログインを失効させますか。他のログインは継続できます。",
	"more": "続きを表示",
	"reload": "更新",
	"failed": "ログイン一覧の操作を完了できませんでした。もう一度お試しください。"
}
</locale>
