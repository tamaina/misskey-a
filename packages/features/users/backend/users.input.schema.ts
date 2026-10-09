/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
export { objectInput } from '../../api/backend/transport/input.schema.js';
export const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));
export const description = v.pipe(v.string(), v.minCodePoints(1), v.maxCodePoints(1500));
export function uniqueStrings<Item extends v.GenericSchema<string, string>>(item: Item) { return v.pipe(v.array(item), v.check(values => new Set(values).size === values.length, 'Expected unique strings')); }
export { notificationSettings } from './notification-settings.schema.js';
