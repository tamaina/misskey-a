<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<FormSection>
	<template #label>{{ $locale.sfc.title }}</template>
	<div class="_gaps_m">
		<MkInfo>{{ $locale.sfc.description }}</MkInfo>
		<MkTab
			v-model="tab"
			:tabs="[
				{ key: 'history', label: $locale.sfc.signinHistory },
				{ key: 'unlinked', label: $locale.sfc.unlinkedSessions },
			]"
		/>
		<p v-if="error" role="alert">{{ $locale.sfc.failed }}</p>
		<MkPagination v-if="active && tab === 'history'" :key="generation" :paginator="paginator" withControl :forceDisableInfiniteScroll="true">
			<template #default="{ items }">
				<div class="_gaps_s">
					<template v-for="{ item, session, userAgent, agent } in displayRows(items)" :key="item.id">
						<MkLoginHistoryFolder v-if="session || userAgent" :session="session" :userAgent="userAgent" :agent="agent" :ip="item.ip" :createdAt="item.createdAt" :success="item.success" :busy="busy" :history="session ? sessionHistory(session.id) : undefined" @revoke="revoke"/>
						<div v-else v-panel :class="$style.row">
							<i :class="item.success ? 'ti ti-check' : 'ti ti-circle-x'"></i>
							<span>{{ item.success ? $locale.sfc.success : $locale.sfc.failure }}</span>
							<code class="_monospace">{{ item.ip || $locale.sfc.unknown }}</code>
							<MkTime :time="item.createdAt"/>
						</div>
					</template>
				</div>
			</template>
		</MkPagination>
		<MkPagination v-if="active && tab === 'unlinked'" :key="`unlinked-${generation}`" :paginator="unlinked" withControl :forceDisableInfiniteScroll="true">
			<template #empty></template>
			<template #default="{ items }">
				<div class="_gaps_s">
					<MkLoginHistoryFolder v-for="session in items" :key="session.id" :session="session" :userAgent="session.lastUserAgent" :agent="parseUserAgent(session.lastUserAgent)" :ip="session.lastIp ?? ''" :createdAt="session.createdAt" :success="true" :busy="busy" :history="sessionHistory(session.id)" @revoke="revoke"/>
				</div>
			</template>
		</MkPagination>
	</div>
</FormSection>
</template>

<script lang="ts" setup>
import { onActivated, onDeactivated, onUnmounted, markRaw, ref, watch } from 'vue';
import MkLoginHistoryFolder from './MkLoginHistoryFolder.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkTab from '@features/ui/frontend/components/MkTab.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import * as os from '@features/ui/frontend/os.js';
import { parseUserAgent } from '../utility/user-agent.js';
import { ensureSignin } from '../i.js';
import { isSameLiveCredential } from '../utility/live-account.js';
import { signout } from '../signout.js';

const ownerId = ensureSignin().id; const ownerToken = ensureSignin().token;
const tab = ref<'history' | 'unlinked'>('history');
const createHistory = () => markRaw(new Paginator('i/signin-history', { limit: 5, params: { latestPerSession: true } }));
let paginator = createHistory();
const createUnlinked = () => markRaw(new Paginator('i/sessions', { limit: 5, offsetMode: true, params: { unlinkedOnly: true } }));
let unlinked = createUnlinked();
type Signin = typeof paginator.items.value[number];
type Session = NonNullable<Signin['browserSession']>;

function displayRows(items: Signin[]) {
	return items.map(item => {
		const session = item.browserSession;
		const recordedAgent = item.headers['user-agent'];
		const userAgent = session?.lastUserAgent ?? (typeof recordedAgent === 'string' && recordedAgent.trim() ? recordedAgent : null);
		return { item, session, userAgent, agent: parseUserAgent(userAgent) };
	});
}

const histories = new Map<string, Paginator<'i/session-ips'>>();

function sessionHistory(sessionId: string) {
	let history = histories.get(sessionId);
	if (!history) {
		history = markRaw(new Paginator('i/session-ips', { limit: 10, offsetMode: true, params: { sessionId } }));
		histories.set(sessionId, history);
	}
	return history;
}

const busy = ref(false); const error = ref(false);
const active = ref(true); const generation = ref(0);
const current = () => active.value && isSameLiveCredential(ownerId, ownerToken, ensureSignin().id, ensureSignin().token);

async function revoke(session: Session) {
	if (busy.value || !current() || session.revokedAt) return;
	busy.value = true; error.value = false;
	const turn = generation.value;
	try {
		const confirmation = await os.confirm({ type: 'warning', text: session.current ? $locale.value.sfc.confirmCurrent : $locale.value.sfc.confirmOther });
		if (!current() || turn !== generation.value || confirmation.canceled) return;
		if (session.current) { await signout(); return; }
		await misskeyApi('i/sessions/revoke', { sessionId: session.id });
		if (!current() || turn !== generation.value) return;
		session.revokedAt = new Date().toISOString();
	} catch { if (current() && turn === generation.value) error.value = true; } finally { busy.value = false; }
}

const leave = () => { active.value = false; generation.value++; histories.clear(); paginator = createHistory(); unlinked = createUnlinked(); };
watch(() => [ensureSignin().id, ensureSignin().token], () => { if (!current()) leave(); }, { flush: 'sync' });
onActivated(() => { if (isSameLiveCredential(ownerId, ownerToken, ensureSignin().id, ensureSignin().token)) active.value = true; });
onDeactivated(leave); onUnmounted(leave);
</script>

<style lang="scss" module>
.row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 16px; overflow-wrap: anywhere; }
</style>

<locale locale="en-US" lang="json">
{
	"signinHistory": "Sign-in history",
	"unlinkedSessions": "Sessions without a sign-in record"
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"title": "ログイン履歴",
	"signinHistory": "ログイン履歴",
	"unlinkedSessions": "ログイン記録のないセッション",
	"description": "ログインごとに個別のセッションを発行します。覚えのないログインを失効させると、そのログインの通信と重要操作の本人確認も無効になります。",
	"legacy": "このログインは旧形式のため一覧の個別失効には対応していません。ログインし直すと新しい個別セッションになります。",
	"success": "成功",
	"failure": "失敗",
	"unknown": "記録なし",
	"failed": "ログイン一覧の操作を完了できませんでした。もう一度お試しください。",
	"confirmCurrent": "このログインからサインアウトしますか。",
	"confirmOther": "選択したログインを失効させますか。他のログインは継続できます。"
}
</locale>
