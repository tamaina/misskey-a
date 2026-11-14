/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { UserMailSmtpConfig } from './outgoing.js';

/** User mail is independent of registration/notification SMTP and Drive storage. */
export type UserMailConfig = {
	enabled: boolean;
	domain: string;
	mxHost: string;
	s3: { bucket: string; region: string; endpoint?: string; forcePathStyle?: boolean };
	ingress: { secret: string; token: string; host?: string; port?: number; maxConcurrent?: number; perMinute?: number };
	quotaBytes?: number;
	maxBytes?: number;
	spoolBytes?: number;
	outbound?: UserMailSmtpConfig;
	maxRecipients?: number;
	sendsPerHour?: number;
	forwarding?: { enabled: boolean; trustedIngress: boolean; loopChecked: boolean; forwardingRelay: boolean };
};
export type UserMailSettings = UserMailConfig & { maxBytes: number; quotaBytes: number; spoolBytes: number };

export function resolveUserMailConfig(input?: UserMailConfig): UserMailSettings | null {
	if (!input?.enabled) return null;
	const domain = input.domain?.toLowerCase();
	if (!domain || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain) || !input.mxHost || !input.s3?.bucket || !input.s3.region) throw new Error('Invalid userMail configuration');
	const maxBytes = input.maxBytes ?? 25 * 1024 * 1024;
	const quotaBytes = input.quotaBytes ?? 100 * 1024 * 1024;
	const spoolBytes = input.spoolBytes ?? 1024 * 1024 * 1024;
	if (![maxBytes, quotaBytes, spoolBytes].every(v => Number.isSafeInteger(v) && v > 0) || maxBytes > 25 * 1024 * 1024 || maxBytes > spoolBytes) throw new Error('Invalid userMail limits');
	if (Buffer.byteLength(input.ingress?.secret ?? '') < 32 || Buffer.byteLength(input.ingress?.token ?? '') < 32) throw new Error('userMail ingress requires separate strong token and HMAC secret');
	if (input.ingress.secret === input.ingress.token) throw new Error('userMail ingress token and secret must differ');
	// Intentionally no non-loopback HTTP escape hatch. Remote MTA must use an authenticated encrypted tunnel.
	if (!['127.0.0.1', '::1'].includes(input.ingress.host ?? '127.0.0.1')) throw new Error('userMail ingress must bind loopback');
	for (const [value, maximum] of [[input.ingress.port ?? 8025, 65535], [input.ingress.maxConcurrent ?? 2, 8], [input.ingress.perMinute ?? 60, 600]]) {
		if (!Number.isInteger(value) || value < 1 || value > maximum) throw new Error('Invalid userMail ingress limits');
	}
	for (const value of [input.maxRecipients ?? 20, input.sendsPerHour ?? 20]) {
		if (!Number.isInteger(value) || value < 1 || value > 100) throw new Error('Invalid userMail sending limits');
	}
	if (input.outbound && (!input.outbound.host || !Number.isInteger(input.outbound.port) || input.outbound.port < 1 || input.outbound.port > 65535 || !['implicit', 'starttls'].includes(input.outbound.tls))) {
		throw new Error('Invalid userMail outbound relay configuration');
	}
	if (input.forwarding?.enabled && (!input.outbound || !input.forwarding.trustedIngress || !input.forwarding.loopChecked || !input.forwarding.forwardingRelay)) {
		throw new Error('Enabled forwarding requires outbound relay and all MTA safety contracts');
	}
	if (input.s3.endpoint && new URL(input.s3.endpoint).protocol !== 'https:') throw new Error('userMail S3 endpoint requires HTTPS');
	return { ...input, domain, maxBytes, quotaBytes, spoolBytes };
}
