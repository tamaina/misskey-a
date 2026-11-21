/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import rebase from './billing-catalog-source-rebase.json';
const hash = (source: string) => createHash('sha256').update(source).digest('hex');
/** Restore the pinned billing UI addition before the unchanged historical locale proofs. */
export function restoreBillingCatalogBaseline(file: string, source: string): string {
	if (file !== rebase.file || hash(source) === rebase.baselineSha256) return source;
	if (hash(source) !== rebase.currentSha256) throw new Error('Source differs from billing catalog addition');
	for (const edit of [...rebase.edits].reverse()) {
		if (source.slice(edit.start, edit.end) !== edit.current) throw new Error('Billing catalog rebase boundary differs');
		source = source.slice(0, edit.start) + edit.baseline + source.slice(edit.end);
	}
	if (hash(source) !== rebase.baselineSha256) throw new Error('Billing catalog baseline was not restored');
	return source;
}
