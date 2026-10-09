/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fetchEmojisHostTypes, fetchEmojisSortKeys } from './api.schema.js';
export { fetchEmojisHostTypes, fetchEmojisSortKeys };
export type FetchEmojisHostTypes = typeof fetchEmojisHostTypes[number];
export type FetchEmojisSortKeys = typeof fetchEmojisSortKeys[number];
