<!--
SPDX-FileCopyrightText: misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<MkFolder>
	<template #icon><i :class="agent.icon"></i></template>
	<template #label>{{ agent.label ?? $locale.sfc.unknownAgent }}</template>
	<template #caption>
		{{ (session?.lastIp ?? ip) || $locale.sfc.unknown }} ·
		<template v-if="session">{{ $locale.sfc.used }} <MkTime :time="session.lastUsedAt"/></template>
		<MkTime v-else :time="createdAt"/>
	</template>
	<template #suffix>{{ session ? (session.current ? $locale.sfc.current : session.revokedAt ? $locale.sfc.revoked : $locale.sfc.active) : (success ? $locale.sfc.success : $locale.sfc.failure) }}</template>
	<div class="_gaps_m">
		<FormSlot>
			<template #label>{{ $locale.sfc.userAgent }}</template>
			<div :class="$style.agent">{{ userAgent ?? $locale.sfc.unknown }}</div>
		</FormSlot>
		<div>{{ $locale.sfc.created }} <MkTime :time="createdAt"/></div>
		<template v-if="session">
			<MkButton v-if="!session.revokedAt" danger :disabled="busy" @click="emit('revoke', session)">{{ session.current ? $locale.sfc.signout : $locale.sfc.revoke }}</MkButton>
			<MkPagination :paginator="history!" withControl :forceDisableInfiniteScroll="true">
				<template #empty></template>
				<template #default="{ items: ips }">
					<FormSection v-if="ips.length">
						<template #label>{{ $locale.sfc.history }}</template>
						<div :class="$style.history">
							<table>
								<thead><tr><th>IP</th><th>{{ $locale.sfc.ipFirstSeen }}</th><th>{{ $locale.sfc.ipLastSeen }}</th></tr></thead>
								<tbody><tr v-for="ip in ips" :key="ip.id"><td><code>{{ ip.ip }}</code></td><td><MkTime :time="ip.createdAt"/></td><td><MkTime :time="ip.lastSeenAt"/></td></tr></tbody>
							</table>
						</div>
					</FormSection>
				</template>
			</MkPagination>
		</template>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import type { Endpoints } from 'misskey-js';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkPagination from '@features/ui/frontend/components/MkPagination.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import FormSlot from '@features/ui/frontend/components/form/slot.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import type { Paginator } from '@features/ui/frontend/utility/paginator.js';
import { parseUserAgent } from '../utility/user-agent.js';

type Session = Endpoints['i/sessions']['res'][number];
defineProps<{ session?: Session | null; userAgent: string | null; agent: ReturnType<typeof parseUserAgent>; ip: string; createdAt: string; success: boolean; busy: boolean; history?: Paginator<'i/session-ips'> }>();
const emit = defineEmits<{ revoke: [session: Session] }>();
</script>

<style lang="scss" module>
.agent { overflow-wrap: anywhere; white-space: normal; }
.history { overflow-x: auto; }
.history table { width: 100%; border-collapse: collapse; text-align: left; }
.history th, .history td { padding: 8px 12px; border-bottom: solid 1px var(--MI_THEME-divider); white-space: nowrap; }
</style>

<locale locale="ja-JP" lang="json">
{
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
	"history": "このセッションのIP履歴",
	"ipFirstSeen": "初回確認:",
	"ipLastSeen": "最終確認:",
	"signout": "このログインからサインアウト",
	"revoke": "このログインを失効"
}
</locale>
