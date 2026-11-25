/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';
const id = v.pipe(v.string(), v.minLength(1), v.maxLength(32));
const label = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(128));
const address = v.pipe(v.string(), v.regex(/^0x[0-9a-fA-F]{40}$/));
export const pricingAsset = v.strictObject({
	id, pricingAssetKey: label, name: label, symbol: v.pipe(label, v.maxLength(32)),
	currencyCode: v.pipe(v.string(), v.regex(/^[A-Z]{3}$/)), isEnabled: v.boolean(),
});
export type PricingAsset = v.InferOutput<typeof pricingAsset>;
export const assetDeployment = v.strictObject({
	id, assetId: id, chainId: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(Number.MAX_SAFE_INTEGER)),
	tokenSymbol: v.pipe(label, v.maxLength(32)), tokenName: label, contractAddress: address,
	decimals: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(255)), recipientAddress: address, isEnabled: v.boolean(),
});
export type AssetDeployment = v.InferOutput<typeof assetDeployment>;
export const tokenMetadata = v.strictObject({ tokenSymbol: v.nullable(label), tokenName: v.nullable(label), decimals: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(255)) });
