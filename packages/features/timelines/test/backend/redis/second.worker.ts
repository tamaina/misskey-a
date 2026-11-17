/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'vitest';
import { checkWorker } from './home-worker.js';
test('independent worker invalidates warm memory via real Redis pubsub', () => checkWorker('second'), 20000);
