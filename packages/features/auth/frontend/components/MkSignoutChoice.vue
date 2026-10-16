<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkDialog
	:title="$locale.sfc.logout"
	:text="legacy ? $locale.sfc.legacySession : $locale.sfc.revokeFailed"
	:select="{ items, default: null }"
	@done="onDone"
	@closed="emit('closed')"
/>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkDialog from '@features/ui/frontend/components/MkDialog.vue';
import type { MkDialogReturnType } from '@features/ui/frontend/components/MkDialog.vue';
import type { SignoutChoice } from '@features/auth/frontend/signout-choice.js';

const props = defineProps<{ legacy: boolean }>();
const emit = defineEmits<{
	(ev: 'done', result: SignoutChoice): void;
	(ev: 'closed'): void;
}>();

const items = computed(() => [
	...(!props.legacy ? [{ label: $locale.value.sfc.retry, value: 'retry' }] : []),
	{ label: $locale.value.sfc.localOnly, value: 'local' },
]);

function onDone(result: MkDialogReturnType) {
	if (result.canceled || (result.result !== 'retry' && result.result !== 'local')) {
		emit('done', { canceled: true, result: undefined });
	} else {
		emit('done', { canceled: false, result: result.result });
	}
}
</script>

<locale lang="json" locale="ja-JP">
{
	"logout": "ログアウト",
	"retry": "再試行",
	"legacySession": "このログインはサーバー側で個別に無効化できません。この端末のログイン情報だけを消去できます。サーバー側の認証情報は引き続き有効です。",
	"revokeFailed": "サーバー側のログインを無効化できませんでした。再試行するか、この端末のログイン情報だけを消去できます。端末だけからログアウトしても、サーバー側での無効化は確認できません。",
	"localOnly": "この端末だけからログアウト"
}
</locale>
