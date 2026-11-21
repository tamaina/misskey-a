/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from './vitest.config.js';

export default mergeConfig(baseConfig, defineConfig({
	test: {
		include: ['../features/notifications/test/backend/notification-shutdown.test.ts'],
		environment: 'node',
		maxWorkers: 1,
		maxConcurrency: 1,
		fileParallelism: false,
	},
}));
