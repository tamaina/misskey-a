/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { expect, test, vi } from 'vitest';
import { ClipUpdatesShutdown, clipUpdateLifecycleProvider } from '../../backend/assembly/ClipUpdateLifecycle.js';
import { CoreModule } from '../../backend/assembly/CoreModule.js';

test('boot owns clip shutdown cleanup through its private lifecycle provider', () => {
	const clips = { clearPendingUpdates: vi.fn() };
	new ClipUpdatesShutdown(clips as never).onApplicationShutdown();
	expect(clips.clearPendingUpdates).toHaveBeenCalledExactlyOnceWith();
	const providers = Reflect.getMetadata('providers', CoreModule) as unknown[];
	expect(providers.filter(entry => entry === clipUpdateLifecycleProvider)).toEqual([clipUpdateLifecycleProvider]);
});
