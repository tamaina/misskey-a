/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';
const label = v.pipe(v.string(), v.maxLength(128));
const text = v.pipe(v.string(), v.maxLength(4096));
const country = v.pipe(v.string(), v.regex(/^[A-Z]{2}$/));
const units = v.pipe(v.string(), v.regex(/^(0|[1-9]\d*)$/), v.maxLength(78));
const regionRule = v.pipe(v.strictObject({ country: v.exactOptional(country), regionCode: v.exactOptional(v.pipe(v.string(), v.minLength(1), v.maxLength(20))), continent: v.exactOptional(v.pipe(v.string(), v.regex(/^[A-Z]{2}$/))), isEUCountry: v.exactOptional(v.boolean()) }), v.check(rule => rule.country != null || rule.regionCode != null || rule.continent != null || rule.isEUCountry != null, 'At least one region condition is required'));
const timestamp = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(Number.MAX_SAFE_INTEGER));
export const regionSnapshot = v.strictObject({ country: v.nullable(country), isEUCountry: v.nullable(v.boolean()), city: v.nullable(label), continent: v.nullable(label), latitude: v.nullable(label), longitude: v.nullable(label), postalCode: v.nullable(label), metroCode: v.nullable(label), region: v.nullable(label), regionCode: v.nullable(label), timezone: v.nullable(label) });
export type RegionSnapshot = v.InferOutput<typeof regionSnapshot>;
const taxRate = v.pipe(v.string(), v.regex(/^(0|[1-9]\d*)(\.\d+)?$/), v.maxLength(64));
export const receiptSeller = v.strictObject({ name: label, address: text, invoiceRegistrationNumber: label });
export const billingPolicy = v.pipe(v.strictObject({
	isEnabled: v.boolean(), trustedProxyCidrs: v.pipe(v.array(v.pipe(v.string(), v.maxLength(100))), v.maxLength(64)),
	regionRules: v.strictObject({ mode: v.picklist(['allow', 'deny']), rules: v.pipe(v.array(regionRule), v.minLength(1), v.maxLength(100)) }),
	taxName: label, taxRate,
	seller: receiptSeller,
	statementText: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(4096)),
}), v.check(policy => !policy.isEnabled || (policy.trustedProxyCidrs.length > 0 && policy.seller.name.trim().length > 0 && policy.taxName.trim().length > 0 && policy.statementText.length > 0), 'Configure trusted region, seller, tax and residency before enabling'));
export type BillingPolicy = v.InferOutput<typeof billingPolicy>;
export const policySettings = v.strictObject({ revision: timestamp, policy: billingPolicy });
export const residencyStatement = v.strictObject({ id: v.pipe(v.string(), v.minLength(1), v.maxLength(32)), country, statement: text });
export const residencyConsent = v.strictObject({ statementId: residencyStatement.entries.id, agreed: v.literal(true) });
export type ResidencyConsent = v.InferOutput<typeof residencyConsent>;
export const receiptSnapshot = v.strictObject({ version: v.literal(1), consentedAt: timestamp, region: regionSnapshot, statement: residencyStatement, seller: receiptSeller,
																																																tax: v.strictObject({ name: label, rate: taxRate, currencyCode: v.pipe(v.string(), v.regex(/^[A-Z]{3}$/)), includedBaseUnits: units, excludedBaseUnits: units, taxBaseUnits: units }) });
export type ReceiptSnapshot = v.InferOutput<typeof receiptSnapshot>;
