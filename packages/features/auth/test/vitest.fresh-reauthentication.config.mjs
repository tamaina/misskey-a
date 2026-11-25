/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { baseConfig } from '../../../backend/vitest.config.ts';
export default { ...baseConfig, test: { ...baseConfig.test, include: ['../features/auth/test/backend/fresh-reauthentication-store.test.ts', '../features/auth/test/backend/fresh-passkey-reauthentication.test.ts'], environment: 'node', maxWorkers: 1, maxConcurrency: 1 } };
