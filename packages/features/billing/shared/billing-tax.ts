/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/** cfw-fileup billing-tax.ts: included-tax integer arithmetic, no currency conversion. */
export function calculateIncludedTaxBaseUnits(totalBaseUnits: string, rateText: string): { excludedBaseUnits: string; taxBaseUnits: string } {
	const total = BigInt(totalBaseUnits);
	if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(rateText)) return { excludedBaseUnits: total.toString(), taxBaseUnits: '0' };
	const [integer, fraction = ''] = rateText.split('.');
	const denominator = 10n ** BigInt(fraction.length), numerator = BigInt(integer) * denominator + BigInt(fraction || '0');
	const excluded = total * denominator / (denominator + numerator);
	return { excludedBaseUnits: excluded.toString(), taxBaseUnits: (total - excluded).toString() };
}
