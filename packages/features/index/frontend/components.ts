/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Mfm from '@features/markup/frontend/components/global/MkMfm.js';
import MkA from '@features/navigation/frontend/components/global/MkA.vue';
import MkAcct from '@features/users/frontend/components/global/MkAcct.vue';
import MkAvatar from '@features/users/frontend/components/global/MkAvatar.vue';
import MkEmoji from '@features/emojis/frontend/components/global/MkEmoji.vue';
import MkCondensedLine from '@features/ui/frontend/components/global/MkCondensedLine.vue';
import MkCustomEmoji from '@features/emojis/frontend/components/global/MkCustomEmoji.vue';
import MkUserName from '@features/users/frontend/components/global/MkUserName.vue';
import MkEllipsis from '@features/ui/frontend/components/global/MkEllipsis.vue';
import MkTime from '@features/ui/frontend/components/global/MkTime.vue';
import MkUrl from '@features/markup/frontend/components/global/MkUrl.vue';
import I18n from '@features/ui/frontend/components/global/I18n.vue';
import RouterView from '@features/navigation/frontend/components/global/RouterView.vue';
import NestedRouterView from '@features/navigation/frontend/components/global/NestedRouterView.vue';
import StackingRouterView from '@features/navigation/frontend/components/global/StackingRouterView.vue';
import MkLoading from '@features/ui/frontend/components/global/MkLoading.vue';
import MkError from '@features/ui/frontend/components/global/MkError.vue';
import MkSuspense from '@features/ui/frontend/components/global/MkSuspense.vue';
import MkAd from '@features/instance/frontend/components/global/MkAd.vue';
import MkPageHeader from '@features/navigation/frontend/components/global/MkPageHeader.vue';
import MkStickyContainer from '@features/ui/frontend/components/global/MkStickyContainer.vue';
import MkLazy from '@features/ui/frontend/components/global/MkLazy.vue';
import MkResult from '@features/ui/frontend/components/global/MkResult.vue';
import MkSystemIcon from '@features/ui/frontend/components/global/MkSystemIcon.vue';
import MkTip from '@features/ui/frontend/components/global/MkTip.vue';
import PageWithHeader from '@features/navigation/frontend/components/global/PageWithHeader.vue';
import PageWithAnimBg from '@features/navigation/frontend/components/global/PageWithAnimBg.vue';
import SearchMarker from '@features/discovery/frontend/components/global/SearchMarker.vue';
import SearchLabel from '@features/discovery/frontend/components/global/SearchLabel.vue';
import SearchText from '@features/discovery/frontend/components/global/SearchText.vue';
import SearchIcon from '@features/discovery/frontend/components/global/SearchIcon.vue';

import type { App } from 'vue';

export default function(app: App) {
	for (const [key, value] of Object.entries(components)) {
		app.component(key, value);
	}
}

export const components = {
	I18n: I18n,
	RouterView: RouterView,
	NestedRouterView: NestedRouterView,
	StackingRouterView: StackingRouterView,
	Mfm: Mfm,
	MkA: MkA,
	MkAcct: MkAcct,
	MkAvatar: MkAvatar,
	MkEmoji: MkEmoji,
	MkCondensedLine: MkCondensedLine,
	MkCustomEmoji: MkCustomEmoji,
	MkUserName: MkUserName,
	MkEllipsis: MkEllipsis,
	MkTime: MkTime,
	MkUrl: MkUrl,
	MkLoading: MkLoading,
	MkError: MkError,
	MkSuspense: MkSuspense,
	MkAd: MkAd,
	MkPageHeader: MkPageHeader,
	MkStickyContainer: MkStickyContainer,
	MkLazy: MkLazy,
	MkResult: MkResult,
	MkSystemIcon: MkSystemIcon,
	MkTip: MkTip,
	PageWithHeader: PageWithHeader,
	PageWithAnimBg: PageWithAnimBg,
	SearchMarker: SearchMarker,
	SearchLabel: SearchLabel,
	SearchText: SearchText,
	SearchIcon: SearchIcon,
};

declare module 'vue' {
	export interface GlobalComponents {
		I18n: typeof I18n;
		RouterView: typeof RouterView;
		NestedRouterView: typeof NestedRouterView;
		StackingRouterView: typeof StackingRouterView;
		Mfm: typeof Mfm;
		MkA: typeof MkA;
		MkAcct: typeof MkAcct;
		MkAvatar: typeof MkAvatar;
		MkEmoji: typeof MkEmoji;
		MkCondensedLine: typeof MkCondensedLine;
		MkCustomEmoji: typeof MkCustomEmoji;
		MkUserName: typeof MkUserName;
		MkEllipsis: typeof MkEllipsis;
		MkTime: typeof MkTime;
		MkUrl: typeof MkUrl;
		MkLoading: typeof MkLoading;
		MkError: typeof MkError;
		MkSuspense: typeof MkSuspense;
		MkAd: typeof MkAd;
		MkPageHeader: typeof MkPageHeader;
		MkStickyContainer: typeof MkStickyContainer;
		MkLazy: typeof MkLazy;
		MkResult: typeof MkResult;
		MkSystemIcon: typeof MkSystemIcon;
		MkTip: typeof MkTip;
		PageWithHeader: typeof PageWithHeader;
		PageWithAnimBg: typeof PageWithAnimBg;
		SearchMarker: typeof SearchMarker;
		SearchLabel: typeof SearchLabel;
		SearchText: typeof SearchText;
		SearchIcon: typeof SearchIcon;
	}
}
