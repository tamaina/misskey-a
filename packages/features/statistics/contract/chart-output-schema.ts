/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { resultObject } from '../../api/contract/result-object.js';
import type { ChartMetricDescriptor } from '../shared/chart-descriptors.js';

type PathHead<Path extends string> = Path extends `${infer Head}.${string}` ? Head : Path;
type PathTail<Path extends string, Head extends string> = Path extends `${Head}.${infer Tail}` ? Tail : never;
const chartSeriesSchema = v.array(v.number());
type ChartOutput<Paths extends string> = {
	[Head in PathHead<Paths>]: [PathTail<Paths, Head>] extends [never]
		? v.InferOutput<typeof chartSeriesSchema>
		: ChartOutput<PathTail<Paths, Head>>;
};
type ChartOutputSchema<Paths extends string> = v.GenericSchema<ChartOutput<Paths>, ChartOutput<Paths>>;
type Branch = Map<string, Branch | null>;

/** Build required numeric series directly from the feature's collection descriptors. */
export function chartOutputSchema<const Descriptor extends ChartMetricDescriptor>(descriptor: Descriptor):
	ChartOutputSchema<Extract<keyof Descriptor, string>> {
	const root: Branch = new Map();
	for (const path of Object.keys(descriptor)) {
		const segments = path.split('.');
		if (segments.some(segment => segment.length === 0)) throw new Error(`Invalid chart metric path: ${path}`);
		let branch = root;
		for (const [index, segment] of segments.entries()) {
			const existing = branch.get(segment);
			if (index === segments.length - 1) {
				if (branch.has(segment)) throw new Error(`Conflicting chart metric path: ${path}`);
				branch.set(segment, null);
			} else {
				if (existing === null) throw new Error(`Conflicting chart metric path: ${path}`);
				const child = existing ?? new Map<string, Branch | null>();
				branch.set(segment, child);
				branch = child;
			}
		}
	}

	const compile = (branch: Branch): ReturnType<typeof resultObject<v.ObjectEntries>> => resultObject(
		Object.fromEntries([...branch].map(([key, child]) => [key, child === null ? chartSeriesSchema : compile(child)])),
	);
	// The assertion connects the dynamic schema tree to its literal descriptor keys, never a payload.
	return compile(root) as ChartOutputSchema<Extract<keyof Descriptor, string>>;
}
