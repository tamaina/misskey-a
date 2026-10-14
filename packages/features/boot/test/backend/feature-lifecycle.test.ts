/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { expect, test, vi } from 'vitest';
import { AnnouncementArchiveInitializer, ClipUpdatesShutdown, featureLifecycleProviders } from '../../backend/assembly/FeatureLifecycle.js';
import { CoreModule } from '../../backend/assembly/CoreModule.js';

test('boot owns archive startup restoration and clip shutdown cleanup', async () => {
	const announcements = { restoreScheduledArchives: vi.fn().mockResolvedValue(undefined) };
	const clips = { clearPendingUpdates: vi.fn() };
	await new AnnouncementArchiveInitializer(announcements as never).onModuleInit();
	new ClipUpdatesShutdown(clips as never).onApplicationShutdown();
	expect(announcements.restoreScheduledArchives).toHaveBeenCalledExactlyOnceWith();
	expect(clips.clearPendingUpdates).toHaveBeenCalledExactlyOnceWith();
	const providers = Reflect.getMetadata('providers', CoreModule) as unknown[];
	for (const provider of featureLifecycleProviders) expect(providers.filter(entry => entry === provider)).toEqual([provider]);
});
