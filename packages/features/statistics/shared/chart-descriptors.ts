/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** Collection descriptors remain independent of backend and validation libraries. */
export type ChartValueRange = 'big' | 'medium' | 'small';

export type ChartMetricOptions = {
	uniqueIncrement?: boolean;
	intersection?: ReadonlyArray<string>;
	range?: ChartValueRange;
	accumulate?: boolean;
};

export type ChartMetricDescriptor = Record<string, ChartMetricOptions>;

export const activeUsersChartDescriptor = {
	'readWrite': { intersection: ['read', 'write'] },
	'read': { uniqueIncrement: true },
	'write': { uniqueIncrement: true },
	'registeredWithinWeek': { uniqueIncrement: true },
	'registeredWithinMonth': { uniqueIncrement: true },
	'registeredWithinYear': { uniqueIncrement: true },
	'registeredOutsideWeek': { uniqueIncrement: true },
	'registeredOutsideMonth': { uniqueIncrement: true },
	'registeredOutsideYear': { uniqueIncrement: true },
} as const satisfies ChartMetricDescriptor;

export const apRequestChartDescriptor = {
	'deliverFailed': { },
	'deliverSucceeded': { },
	'inboxReceived': { },
} as const satisfies ChartMetricDescriptor;

export const driveChartDescriptor = {
	'local.incCount': {},
	'local.incSize': {}, // in kilobyte
	'local.decCount': {},
	'local.decSize': {}, // in kilobyte
	'remote.incCount': {},
	'remote.incSize': {}, // in kilobyte
	'remote.decCount': {},
	'remote.decSize': {}, // in kilobyte
} as const satisfies ChartMetricDescriptor;

export const federationChartDescriptor = {
	'deliveredInstances': { uniqueIncrement: true, range: 'small' },
	'inboxInstances': { uniqueIncrement: true, range: 'small' },
	'stalled': { uniqueIncrement: true, range: 'small' },
	'sub': { accumulate: true, range: 'small' },
	'pub': { accumulate: true, range: 'small' },
	'pubsub': { accumulate: true, range: 'small' },
	'subActive': { accumulate: true, range: 'small' },
	'pubActive': { accumulate: true, range: 'small' },
} as const satisfies ChartMetricDescriptor;

export const instanceChartDescriptor = {
	'requests.failed': { range: 'small' },
	'requests.succeeded': { range: 'small' },
	'requests.received': { range: 'small' },
	'notes.total': { accumulate: true },
	'notes.inc': {},
	'notes.dec': {},
	'notes.diffs.normal': {},
	'notes.diffs.reply': {},
	'notes.diffs.renote': {},
	'notes.diffs.withFile': {},
	'users.total': { accumulate: true },
	'users.inc': { range: 'small' },
	'users.dec': { range: 'small' },
	'following.total': { accumulate: true },
	'following.inc': { range: 'small' },
	'following.dec': { range: 'small' },
	'followers.total': { accumulate: true },
	'followers.inc': { range: 'small' },
	'followers.dec': { range: 'small' },
	'drive.totalFiles': { accumulate: true },
	'drive.incFiles': {},
	'drive.decFiles': {},
	'drive.incUsage': {}, // in kilobyte
	'drive.decUsage': {}, // in kilobyte
} as const satisfies ChartMetricDescriptor;

export const notesChartDescriptor = {
	'local.total': { accumulate: true },
	'local.inc': {},
	'local.dec': {},
	'local.diffs.normal': {},
	'local.diffs.reply': {},
	'local.diffs.renote': {},
	'local.diffs.withFile': {},
	'remote.total': { accumulate: true },
	'remote.inc': {},
	'remote.dec': {},
	'remote.diffs.normal': {},
	'remote.diffs.reply': {},
	'remote.diffs.renote': {},
	'remote.diffs.withFile': {},
} as const satisfies ChartMetricDescriptor;

export const perUserDriveChartDescriptor = {
	'totalCount': { accumulate: true },
	'totalSize': { accumulate: true }, // in kilobyte
	'incCount': { range: 'small' },
	'incSize': {}, // in kilobyte
	'decCount': { range: 'small' },
	'decSize': {}, // in kilobyte
} as const satisfies ChartMetricDescriptor;

export const perUserFollowingChartDescriptor = {
	'local.followings.total': { accumulate: true },
	'local.followings.inc': { range: 'small' },
	'local.followings.dec': { range: 'small' },
	'local.followers.total': { accumulate: true },
	'local.followers.inc': { range: 'small' },
	'local.followers.dec': { range: 'small' },
	'remote.followings.total': { accumulate: true },
	'remote.followings.inc': { range: 'small' },
	'remote.followings.dec': { range: 'small' },
	'remote.followers.total': { accumulate: true },
	'remote.followers.inc': { range: 'small' },
	'remote.followers.dec': { range: 'small' },
} as const satisfies ChartMetricDescriptor;

export const perUserNotesChartDescriptor = {
	'total': { accumulate: true },
	'inc': { range: 'small' },
	'dec': { range: 'small' },
	'diffs.normal': { range: 'small' },
	'diffs.reply': { range: 'small' },
	'diffs.renote': { range: 'small' },
	'diffs.withFile': { range: 'small' },
} as const satisfies ChartMetricDescriptor;

export const perUserPvChartDescriptor = {
	'upv.user': { uniqueIncrement: true, range: 'small' },
	'pv.user': { range: 'small' },
	'upv.visitor': { uniqueIncrement: true, range: 'small' },
	'pv.visitor': { range: 'small' },
} as const satisfies ChartMetricDescriptor;

export const perUserReactionsChartDescriptor = {
	'local.count': { range: 'small' },
	'remote.count': { range: 'small' },
} as const satisfies ChartMetricDescriptor;

export const usersChartDescriptor = {
	'local.total': { accumulate: true },
	'local.inc': { range: 'small' },
	'local.dec': { range: 'small' },
	'remote.total': { accumulate: true },
	'remote.inc': { range: 'small' },
	'remote.dec': { range: 'small' },
} as const satisfies ChartMetricDescriptor;
