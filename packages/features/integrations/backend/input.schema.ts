/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

export const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));
