/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { Config } from '@/config.js';
import type { packedMetaLiteSchema, packedMetaDetailedOnlySchema } from '../../contract/packed.js';

/** Native configuration declarations also allow callbacks; HTTP keeps the producer unparsed. */
export type NativeMetaLite = Omit<v.InferOutput<typeof packedMetaLiteSchema>, 'sentryForFrontend'> & {
	sentryForFrontend: NonNullable<Config['sentryForFrontend']> | null;
};
export type NativeMetaDetailed = NativeMetaLite & Omit<v.InferOutput<typeof packedMetaDetailedOnlySchema>, 'features'> & {
	features: NonNullable<v.InferOutput<typeof packedMetaDetailedOnlySchema>['features']>;
};
