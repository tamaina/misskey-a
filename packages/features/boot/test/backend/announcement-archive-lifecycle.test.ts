/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { expect, test, vi } from 'vitest';
import { AnnouncementArchiveInitializer, announcementArchiveLifecycleProviders } from '../../backend/assembly/AnnouncementArchiveLifecycle.js';
import { CoreModule } from '../../backend/assembly/CoreModule.js';

test('boot owns archive startup restoration and registers its private provider once', async () => {
	const announcements = { restoreScheduledArchives: vi.fn().mockResolvedValue(undefined) };
	await new AnnouncementArchiveInitializer(announcements as never).onModuleInit();
	expect(announcements.restoreScheduledArchives).toHaveBeenCalledExactlyOnceWith();
	const providers = Reflect.getMetadata('providers', CoreModule) as unknown[];
	for (const provider of announcementArchiveLifecycleProviders) expect(providers.filter(entry => entry === provider)).toEqual([provider]);
});
