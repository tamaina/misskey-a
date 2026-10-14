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

/** CFW refund allocation uses saved purchase tax, with floor rounding per line. */
export function calculateRefundTaxBaseUnits(refundBaseUnits: string, originalGrossBaseUnits: string, originalTaxBaseUnits: string) {
	const gross = BigInt(refundBaseUnits), cash = BigInt(originalGrossBaseUnits), savedTax = BigInt(originalTaxBaseUnits);
	if (gross < 0n || cash < 0n || savedTax < 0n || gross > cash || savedTax > cash) throw new TypeError('Invalid saved tax provenance');
	const tax = cash > 0n ? savedTax * gross / cash : 0n;
	return { excludedBaseUnits: (gross - tax).toString(), taxBaseUnits: tax.toString() };
}
