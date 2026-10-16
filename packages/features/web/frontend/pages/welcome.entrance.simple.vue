<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="meta" :class="$style.root">
	<MkFeaturedPhotos :class="$style.bg"/>
	<div :class="$style.logoWrapper">
		<div :class="$style.poweredBy">Powered by</div>
		<img :src="misskeysvg" :class="$style.misskey" :alt="productName"/><span :class="$style.productEdition" aria-hidden="true">9000</span>
	</div>
	<div :class="$style.contents">
		<MkVisitorDashboard/>
	</div>
</div>
</template>

<script lang="ts" setup>
import MkFeaturedPhotos from '@features/drive/frontend/components/MkFeaturedPhotos.vue';
import misskeysvg from '/client-assets/misskey.svg';
import { productName } from '@features/boot/frontend/shared/config.js';
import MkVisitorDashboard from '@features/statistics/frontend/components/MkVisitorDashboard.vue';
import { instance as meta } from '@features/instance/frontend/instance.js';
</script>

<style lang="scss" module>
.root {
	height: 100cqh;
	overflow: auto;
	overscroll-behavior: contain;
}

.bg {
	position: fixed;
	top: 0;
	right: 0;
	width: 100vw;
	height: 100vh;
	// 固定レイヤがホイール操作を奪い、コンテンツ列以外の上でページをスクロールできなくなるのを防ぐ (issue #17680)
	pointer-events: none;
}

.logoWrapper {
	position: fixed;
	top: 36px;
	left: 36px;
	flex: auto;
	color: #fff;
	user-select: none;
	pointer-events: none;
}

.poweredBy {
	margin-bottom: 2px;
}

.productEdition {
	margin-left: 8px;
	font-size: 24px;
	font-weight: bold;
	vertical-align: middle;
}

.misskey {
	vertical-align: middle;
	width: 120px;

	@media (max-width: 450px) {
		width: 100px;
	}
}

.contents {
	position: relative;
	width: min(430px, calc(100% - 32px));
	margin: auto;
	padding: 100px 0 100px 0;
}
</style>
