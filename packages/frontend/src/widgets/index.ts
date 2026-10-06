/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import type { App } from 'vue';

export default function(app: App) {
	app.component('WidgetProfile', defineAsyncComponent(() => import('./WidgetProfile.vue')));
	app.component('WidgetInstanceInfo', defineAsyncComponent(() => import('@features/instance/frontend/widgets/WidgetInstanceInfo.vue')));
	app.component('WidgetMemo', defineAsyncComponent(() => import('./WidgetMemo.vue')));
	app.component('WidgetNotifications', defineAsyncComponent(() => import('@features/notifications/frontend/widgets/WidgetNotifications.vue')));
	app.component('WidgetTimeline', defineAsyncComponent(() => import('@features/timelines/frontend/widgets/WidgetTimeline.vue')));
	app.component('WidgetCalendar', defineAsyncComponent(() => import('@features/ui/frontend/widgets/WidgetCalendar.vue')));
	app.component('WidgetRss', defineAsyncComponent(() => import('./WidgetRss.vue')));
	app.component('WidgetRssTicker', defineAsyncComponent(() => import('./WidgetRssTicker.vue')));
	app.component('WidgetTrends', defineAsyncComponent(() => import('@features/discovery/frontend/widgets/WidgetTrends.vue')));
	app.component('WidgetClock', defineAsyncComponent(() => import('@features/ui/frontend/widgets/WidgetClock.vue')));
	app.component('WidgetActivity', defineAsyncComponent(() => import('@features/statistics/frontend/widgets/WidgetActivity.vue')));
	app.component('WidgetPhotos', defineAsyncComponent(() => import('@features/media/frontend/widgets/WidgetPhotos.vue')));
	app.component('WidgetDigitalClock', defineAsyncComponent(() => import('@features/ui/frontend/widgets/WidgetDigitalClock.vue')));
	app.component('WidgetUnixClock', defineAsyncComponent(() => import('@features/ui/frontend/widgets/WidgetUnixClock.vue')));
	app.component('WidgetFederation', defineAsyncComponent(() => import('@features/federation/frontend/widgets/WidgetFederation.vue')));
	app.component('WidgetPostForm', defineAsyncComponent(() => import('@features/notes/frontend/widgets/WidgetPostForm.vue')));
	app.component('WidgetSlideshow', defineAsyncComponent(() => import('@features/media/frontend/widgets/WidgetSlideshow.vue')));
	app.component('WidgetServerMetric', defineAsyncComponent(() => import('@features/statistics/frontend/widgets/server-metric/index.vue')));
	app.component('WidgetOnlineUsers', defineAsyncComponent(() => import('@features/statistics/frontend/widgets/WidgetOnlineUsers.vue')));
	app.component('WidgetJobQueue', defineAsyncComponent(() => import('@features/operations/frontend/widgets/WidgetJobQueue.vue')));
	app.component('WidgetInstanceCloud', defineAsyncComponent(() => import('@features/instance/frontend/widgets/WidgetInstanceCloud.vue')));
	app.component('WidgetButton', defineAsyncComponent(() => import('@features/ui/frontend/widgets/WidgetButton.vue')));
	app.component('WidgetAiscript', defineAsyncComponent(() => import('@features/play/frontend/widgets/WidgetAiscript.vue')));
	app.component('WidgetAiscriptApp', defineAsyncComponent(() => import('@features/play/frontend/widgets/WidgetAiscriptApp.vue')));
	app.component('WidgetAichan', defineAsyncComponent(() => import('@features/play/frontend/widgets/WidgetAichan.vue')));
	app.component('WidgetUserList', defineAsyncComponent(() => import('./WidgetUserList.vue')));
	app.component('WidgetClicker', defineAsyncComponent(() => import('@features/games/frontend/widgets/WidgetClicker.vue')));
	app.component('WidgetBirthdayFollowings', defineAsyncComponent(() => import('./WidgetBirthdayFollowings.vue')));
	app.component('WidgetChat', defineAsyncComponent(() => import('@features/chat/frontend/widgets/WidgetChat.vue')));
}

// 連合関連のウィジェット（連合無効時に隠す）
export const federationWidgets = [
	'federation',
	'instanceCloud',
] as const;

export const widgets = [
	'profile',
	'instanceInfo',
	'memo',
	'notifications',
	'timeline',
	'calendar',
	'rss',
	'rssTicker',
	'trends',
	'clock',
	'activity',
	'photos',
	'digitalClock',
	'unixClock',
	'postForm',
	'slideshow',
	'serverMetric',
	'onlineUsers',
	'jobQueue',
	'button',
	'aiscript',
	'aiscriptApp',
	'aichan',
	'userList',
	'clicker',
	'birthdayFollowings',
	'chat',

	...federationWidgets,
] as const;

export type WidgetName = typeof widgets[number];
