/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { jsonString } from '../../api/backend/transport/string.schema.js';

export const pageNameSchema = jsonString({
	minLength: 1,
	pattern: /^[^\s:\/?#\[\]@!$&'()*+,;=\\%\x00-\x20]{1,256}$/.source,
});
