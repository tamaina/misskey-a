<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<main :style="{ maxWidth: mobile ? '360px' : '760px', margin: '24px auto', padding: '16px', background: 'var(--MI_THEME-panel)' }">
	<h1>アンテナ隔離検証</h1>
	<p>実サービスへ送信しない検証画面です。</p>
	<nav class="_buttons">
		<button @click="reset">新規アンテナ</button>
		<button :disabled="!saved" @click="edit">保存したアンテナを再編集</button>
		<button @click="mobile = !mobile">360px 表示切替</button>
	</nav>
	<MkAntennaEditor :key="version" :antenna="initial" @created="state = 'created'" @updated="state = 'updated'"/>
	<output id="state">{{ state }}</output>
	<pre id="request" style="white-space: pre-wrap; overflow-wrap: anywhere;">{{ request }}</pre>
	<MkPopupMenu v-if="menu" :items="menu.items" :anchorElement="menu.anchorElement" :width="menu.width" @closing="menu?.onClosing?.()" @closed="closeMenu"/>
</main>
</template>
<script setup>
import { ref } from 'vue';
import MkAntennaEditor from '@features/timelines/frontend/components/MkAntennaEditor.vue';
import MkPopupMenu from '@features/ui/frontend/components/MkPopupMenu.vue';
import { menu, closeMenu, request, saved } from './antenna-adapters.js';
const initial = ref(saved.value ?? undefined);
const state = ref('ready');
const version = ref(0);
const mobile = ref(false);

function reset() { initial.value = undefined; state.value = 'ready'; version.value++; }

function edit() { initial.value = saved.value; state.value = 'ready'; version.value++; }
</script>
