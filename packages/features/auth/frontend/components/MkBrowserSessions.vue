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
		<MkPagination v-if="active" :key="generation" :paginator="paginator" withControl :forceDisableInfiniteScroll="true">
			<template #default="{ items }">
				<div class="_gaps_s">
					<template v-for="{ item, session, userAgent, agent } in displayRows(items)" :key="item.id">
						<MkFolder v-if="session || userAgent">
							<template #icon><i :class="agent.icon"></i></template>
							<template #label>{{ agent.label ?? $locale.sfc.unknownAgent }}</template>
							<template #caption>
								{{ (session ? session.lastIp : item.ip) || $locale.sfc.unknown }} ·
								<template v-if="session">{{ $locale.sfc.used }} <MkTime :time="session.lastUsedAt"/></template>
								<MkTime v-else :time="item.createdAt"/>
							</template>
							<template #suffix>{{ session ? (session.current ? $locale.sfc.current : session.revokedAt ? $locale.sfc.revoked : $locale.sfc.active) : (item.success ? $locale.sfc.success : $locale.sfc.failure) }}</template>
							<div class="_gaps_m">
								<FormSlot>
									<template #label>{{ $locale.sfc.userAgent }}</template>
									<div :class="$style.agent">{{ userAgent ?? $locale.sfc.unknown }}</div>
								</FormSlot>
								<div>{{ $locale.sfc.created }} <MkTime :time="item.createdAt"/></div>
								<template v-if="session">
									<MkButton v-if="!session.revokedAt" danger :disabled="busy" @click="revoke(session)">{{ session.current ? $locale.sfc.signout : $locale.sfc.revoke }}</MkButton>
									<FormSection>
										<template #label>{{ $locale.sfc.history }}</template>
										<MkPagination :paginator="sessionHistory(session.id)" withControl :forceDisableInfiniteScroll="true">
											<template #default="{ items: ips }">
												<div v-for="ip in ips" :key="ip.id" class="_gaps_s">
													<div><code>{{ ip.ip }}</code></div>
													<div>{{ $locale.sfc.ipFirstSeen }} <MkTime :time="ip.createdAt"/></div>
													<div>{{ $locale.sfc.ipLastSeen }} <MkTime :time="ip.lastSeenAt"/></div>
												</div>
											</template>
										</MkPagination>
									</FormSection>
								</template>
							</div>
						</MkFolder>
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
		<MkButton :disabled="busy" @click="reload">{{ $locale.sfc.reload }}</MkButton>
	</div>
</FormSection>
</template>

<script lang="ts" setup>
import { onActivated, onDeactivated, onUnmounted, markRaw, ref, watch } from 'vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import { Paginator } from '@features/ui/frontend/utility/paginator.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import FormSlot from '@features/ui/frontend/components/form/slot.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import * as os from '@features/ui/frontend/os.js';
import { parseUserAgent } from '../utility/user-agent.js';
import { ensureSignin } from '../i.js';
import { signout } from '../signout.js';

const ownerId = ensureSignin().id; const ownerToken = ensureSignin().token;
const individual = ownerToken.startsWith('bs_');
const createHistory = () => markRaw(new Paginator('i/signin-history', { limit: 5, params: { latestPerSession: true } }));
let paginator = createHistory();
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
const current = () => active.value && ensureSignin().id === ownerId && ensureSignin().token === ownerToken;

function reload() { if (!current()) return; histories.clear(); return paginator.reload(); }

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

const leave = () => { active.value = false; generation.value++; histories.clear(); paginator = createHistory(); };
watch(() => [ensureSignin().id, ensureSignin().token], () => { if (!current()) leave(); }, { flush: 'sync' });
onActivated(() => { if (ensureSignin().id === ownerId && ensureSignin().token === ownerToken) active.value = true; });
onDeactivated(leave); onUnmounted(leave);
</script>

<style lang="scss" module>
.row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 16px; overflow-wrap: anywhere; }
.agent { overflow-wrap: anywhere; white-space: normal; }
</style>

<locale locale="ja-JP" lang="json">
{
	"title": "ログイン履歴",
	"description": "ログインごとに個別のセッションを発行します。覚えのないログインを失効させると、そのログインの通信と重要操作の本人確認も無効になります。",
	"legacy": "このログインは旧形式のため一覧の個別失効には対応していません。ログインし直すと新しい個別セッションになります。",
	"current": "このデバイス",
	"userAgent": "User-Agent",
	"unknownAgent": "不明なブラウザー／端末",
	"success": "成功",
	"failure": "失敗",
	"created": "ログイン日時:",
	"used": "最終利用:",
	"revoked": "失効済み",
	"active": "有効",
	"unknown": "記録なし",
	"history": "このセッションの IP 履歴",
	"ipFirstSeen": "初回確認:",
	"ipLastSeen": "最終確認:",
	"signout": "このログインからサインアウト",
	"revoke": "このログインを失効",
	"confirmCurrent": "このログインからサインアウトしますか。",
	"confirmOther": "選択したログインを失効させますか。他のログインは継続できます。",
	"reload": "更新",
	"failed": "ログイン一覧の操作を完了できませんでした。もう一度お試しください。"
}
</locale>
