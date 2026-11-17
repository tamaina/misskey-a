/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'vitest';
import { checkWorker } from './home-worker.js';
test('publishing worker follows, unfollows and follows again', () => checkWorker('first'), 20000);
