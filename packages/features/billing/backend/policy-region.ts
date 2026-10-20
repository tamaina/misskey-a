/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { BlockList, isIP } from 'node:net';
import type { BillingPolicy, RegionSnapshot } from './policy.schema.js';
// EU membership derived from verified country, never from a caller-supplied custom header.
// https://european-union.europa.eu/principles-countries-history/eu-countries_en
const euCountries = new Set(['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']);
export function validateTrustedProxyCidrs(cidrs: string[]): BlockList {
	const block = new BlockList();
	for (const cidr of cidrs) {
		const [address, mask, extra] = cidr.split('/'), version = isIP(address);
		if (!version || extra != null || (mask != null && !/^\d+$/.test(mask))) throw new Error('Invalid trusted proxy CIDR');
		const prefix = mask == null ? version === 4 ? 32 : 128 : Number(mask);
		if (prefix < 1 || prefix > (version === 4 ? 32 : 128)) throw new Error('Invalid trusted proxy CIDR');
		block.addSubnet(address, prefix, version === 4 ? 'ipv4' : 'ipv6');
	}
	return block;
}
export function trustedRegionSnapshot(peerIp: string | undefined, headers: Record<string, string | string[] | undefined>, cidrs: string[]): RegionSnapshot | null {
	if (!peerIp) return null;
	const peer = peerIp.startsWith('::ffff:') ? peerIp.slice(7) : peerIp, version = isIP(peer);
	if (!version || !validateTrustedProxyCidrs(cidrs).check(peer, version === 4 ? 'ipv4' : 'ipv6')) return null;

	function value(key: string): string | null { const found = headers[key]; return typeof found === 'string' && found.length > 0 && found.length <= 128 ? found : null; }

	const country = value('cf-ipcountry')?.toUpperCase() ?? null;
	if (!country || !/^[A-Z]{2}$/.test(country) || country === 'XX') return null;
	return { country, isEUCountry: euCountries.has(country), city: value('cf-ipcity'), continent: value('cf-ipcontinent')?.toUpperCase() ?? null, latitude: value('cf-iplatitude'), longitude: value('cf-iplongitude'), postalCode: value('cf-postal-code'), metroCode: value('cf-metro-code'), region: value('cf-region'), regionCode: value('cf-region-code'), timezone: value('cf-timezone') };
}
/** Source allow/deny rule matching; unknown dimensions required by any rule fail closed. */
export function isBillingRegionAllowed(rules: BillingPolicy['regionRules'], snapshot: RegionSnapshot): boolean {
	if (!snapshot.country) return false;
	const matches = rules.rules.map(rule => {
		let unknown = false;
		for (const key of ['country', 'regionCode', 'continent', 'isEUCountry'] as const) {
			if (rule[key] == null) continue;
			if (snapshot[key] == null) unknown = true;
			else if (rule[key] !== snapshot[key]) return false;
		}
		return unknown ? null : true;
	});
	return rules.mode === 'allow' ? matches.includes(true) : !matches.includes(true) && !matches.includes(null);
}
