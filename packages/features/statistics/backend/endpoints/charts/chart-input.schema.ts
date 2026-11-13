/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

export const chartInputEntries = {
	span: v.picklist(['day', 'hour']),
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(500)), 30),
	offset: v.optional(v.nullable(v.pipe(v.number(), v.integer())), null),
} as const;

export const chartInput = objectInput(chartInputEntries);
export const userChartInput = objectInput({ ...chartInputEntries, userId: v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/)) });

