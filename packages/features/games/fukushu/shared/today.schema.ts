/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';
import { upstreamStoreSchemas } from './upstream-records.schema.js';

const revision = v.pipe(v.number(), v.integer(), v.minValue(0));
const common = { deckName: v.string(), revision };
export const todayQueueSchema = v.object({
	shuffle: v.boolean(),
	immediate: v.boolean(),
	items: v.array(v.variant('origin', [
		v.object({ origin: v.literal('source'), ...common, flash: v.boolean(), question: upstreamStoreSchemas.questions }),
		v.object({ origin: v.literal('native'), ...common, deckId: v.string(), questionId: v.string(), version: revision }),
	])),
});
export type TodayQueue = v.InferOutput<typeof todayQueueSchema>;
