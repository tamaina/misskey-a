/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

type ResultObject<Entries extends v.ObjectEntries> =
	Omit<v.LooseObjectSchema<Entries, undefined>, '~types' | '~run' | '~standard'> &
	v.GenericSchema<
		v.InferInput<v.ObjectSchema<Entries, undefined>> & object,
		v.InferOutput<v.ObjectSchema<Entries, undefined>> & object
	>;

/** Preserve extra response fields at runtime while inferring the declared model. */
export function resultObject<const Entries extends v.ObjectEntries>(entries: Entries): ResultObject<Entries> {
	return v.looseObject(entries);
}
