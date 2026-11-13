/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { jsonString } from '../../../api/backend/transport/string.schema.js';

export const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));
export const antennaName = jsonString({ minLength: 1, maxLength: 100 });
