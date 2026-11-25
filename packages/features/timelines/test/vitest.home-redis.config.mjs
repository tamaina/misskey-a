/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { baseConfig } from '../../../backend/vitest.config.ts';
export default { ...baseConfig, test: { ...baseConfig.test, dir: import.meta.dirname + '/backend/redis', include: ['*.worker.ts'], environment: 'node', pool: 'forks', maxWorkers: 2, fileParallelism: true, maxConcurrency: 1, execArgv: ['--max-old-space-size=384'] } };
