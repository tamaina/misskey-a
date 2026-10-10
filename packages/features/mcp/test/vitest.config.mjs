/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { baseConfig } from '../../../backend/vitest.config.ts';
export default { ...baseConfig, test: { ...baseConfig.test, dir: import.meta.dirname + '/backend', include: ['*.test.ts'], environment: 'node', maxWorkers: 1 } };
