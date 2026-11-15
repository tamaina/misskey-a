/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createTransport } from 'nodemailer';

export type MailState = 'queued' | 'sending' | 'submitted' | 'failed' | 'unknown';
export type MailEnvelope = { from: string; to: string[] };
export type TextMailInput = { to: string[]; cc?: string[]; bcc?: string[]; subject: string; text: string; displayName?: string };
export type MailLimits = { maxRecipients: number; maxBytes: number };
export type PreparedMail = { raw: Buffer; envelope: MailEnvelope; bcc: string[] };

function header(value: string): string {
	// eslint-disable-next-line no-control-regex
	if (typeof value !== 'string' || /[\x00-\x1f\x7f]/u.test(value)) throw new Error('Invalid mail header');
	return value;
}

/** Deliberately accepts a single ASCII dot-atom mailbox, never display names or lists. */
export function validateMailAddress(value: string): string {
	header(value);
	const match = /^([A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*)@([A-Za-z0-9.-]+)$/u.exec(value);
	if (!match || value.length > 254 || match[1].length > 64) throw new Error('Invalid mail address');
	const domain = match[2].toLowerCase();
	if (domain.length > 253 || !domain.includes('.') || domain.split('.').some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u.test(label))) throw new Error('Invalid mail domain');
	return `${match[1]}@${domain}`;
}

/** Identity and stable message metadata must come from the server, not client input. Persist raw before enqueueing. */
export async function buildTextMail(
	input: TextMailInput,
	identity: { username: string; domain: string },
	stable: { messageId: string; date: Date },
	limits: MailLimits,
	html?: string,
): Promise<PreparedMail> {
	if (!/^[a-zA-Z0-9_]+$/u.test(identity.username)) throw new Error('Invalid local username');
	const from = validateMailAddress(`${identity.username}@${identity.domain}`);
	const subject = header(input.subject);
	const name = header(input.displayName ?? '');
	if (!Number.isSafeInteger(limits.maxRecipients) || limits.maxRecipients < 1 || !Number.isSafeInteger(limits.maxBytes) || limits.maxBytes < 1) throw new Error('Invalid mail limits');
	if (!Array.isArray(input.to) || (input.cc !== undefined && !Array.isArray(input.cc)) || (input.bcc !== undefined && !Array.isArray(input.bcc))) throw new Error('Invalid recipients');
	const to = input.to.map(validateMailAddress);
	const cc = (input.cc ?? []).map(validateMailAddress);
	const bcc = (input.bcc ?? []).map(validateMailAddress);
	if (to.length + cc.length + bcc.length > limits.maxRecipients) throw new Error('Too many recipients');
	const recipients = [...new Set([...to, ...cc, ...bcc])];
	if (!recipients.length) throw new Error('Missing recipients');
	if (typeof input.text !== 'string' || Buffer.byteLength(input.text) + Buffer.byteLength(subject) + Buffer.byteLength(name) > limits.maxBytes) throw new Error('Mail too large');
	if (!/^<[A-Za-z0-9._-]+@[A-Za-z0-9.-]+>$/u.test(header(stable.messageId)) || !Number.isFinite(stable.date.getTime())) throw new Error('Invalid stable mail metadata');
	const envelope = { from, to: recipients };
	const composer = createTransport({ streamTransport: true, buffer: true, newline: 'windows' });
	const result = await composer.sendMail({
		from: { address: from, name }, to, cc, subject, text: input.text, html,
		messageId: stable.messageId, date: stable.date, envelope,
		disableFileAccess: true, disableUrlAccess: true,
		// Bcc lives exclusively in the envelope and the sender's private record.
	});
	if (!Buffer.isBuffer(result.message)) throw new Error('MIME composer did not return a buffer');
	const raw = result.message;
	if (raw.byteLength > limits.maxBytes) throw new Error('Mail too large');
	return { raw, envelope, bcc };
}

export type MailSubmissionResult = {
	state: 'submitted' | 'failed' | 'unknown';
	accepted: string[];
	rejected: string[];
	/** Only recipients known NOT to have received DATA. Never requeue accepted/unknown recipients. */
	retryableRecipients: string[];
	response?: string;
};

type SmtpError = { code?: string; timeoutType?: string; responseCode?: number; response?: string; command?: string; recipient?: string; rejectedErrors?: SmtpError[] };

/** Persist only a bounded server response, not the exception or credentials. Keep it owner-only. */
function responseOf(error: SmtpError): string | undefined {
	return typeof error.response === 'string' ? error.response.slice(0, 2048) : undefined;
}

export function classifySmtpFailure(error: unknown, recipients: string[]): MailSubmissionResult {
	const failure: SmtpError = error !== null && typeof error === 'object' ? error as SmtpError : {};
	const code = failure.responseCode;
	const explicitRejection = typeof code === 'number' && code >= 400 && code < 600;
	// An unclassified socket close may happen after DATA acceptance. Fail closed, not by error.code alone.
	const beforeData = /^(?:EHLO|HELO|STARTTLS|AUTH(?: .*)?|MAIL FROM|RCPT TO)$/u.test(failure.command ?? '') ||
		failure.code === 'EDNS' || ['CONNECT_TIMEOUT', 'GREETING_TIMEOUT', 'UPGRADE_TIMEOUT'].includes(failure.timeoutType ?? '');
	if (!explicitRejection && !beforeData) return { state: 'unknown', accepted: [], rejected: [], retryableRecipients: [], response: responseOf(failure) };
	const temporary = explicitRejection ? code < 500 : true;
	const retryableRecipients = recipients.filter(recipient => {
		// A RCPT refusal applies only to that recipient, not recipients rejected later at DATA.
		const rejection = failure.rejectedErrors?.find(item => item.recipient === recipient);
		return rejection ? rejection.responseCode !== undefined && rejection.responseCode >= 400 && rejection.responseCode < 500 : temporary;
	});
	return { state: 'failed', accepted: [], rejected: [...recipients], retryableRecipients, response: responseOf(failure) };
}

export type UserMailSmtpConfig = {
	host: string;
	port: number;
	/** Implicit TLS (usually 465), or mandatory STARTTLS (usually 587). No insecure fallback. */
	tls: 'implicit' | 'starttls';
	auth?: { user: string; pass: string };
	maxConnections?: number;
};

/** Singleton service-owned relay transport. Caller owns atomic claim, attempt ID and bounded retry scheduling. */
export class UserMailTransport {
	private readonly transport;
	private availableConnections: number;
	private readonly waitingConnections: (() => void)[] = [];

	constructor(config: UserMailSmtpConfig) {
		if (!config.host || !Number.isInteger(config.port) || config.port < 1 || config.port > 65535 || !['implicit', 'starttls'].includes(config.tls)) throw new Error('Invalid SMTP configuration');
		const connections = config.maxConnections ?? 2;
		if (!Number.isInteger(connections) || connections < 1 || connections > 10) throw new Error('Invalid SMTP connection limit');
		this.availableConnections = connections;
		this.transport = createTransport({
			pool: true, host: config.host, port: config.port,
			secure: config.tls === 'implicit', requireTLS: true, ignoreTLS: false,
			tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' }, auth: config.auth,
			maxConnections: connections, maxMessages: 100, maxRequeues: 0,
			connectionTimeout: 15_000, greetingTimeout: 15_000, socketTimeout: 60_000,
			logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true,
		});
	}

	async submit(raw: Buffer, envelope: MailEnvelope, canSubmit?: () => Promise<boolean>): Promise<MailSubmissionResult> {
		// Only durable internal buffers, never user-provided paths, URLs or arbitrary headers.
		if (!Buffer.isBuffer(raw) || !raw.length || !envelope.to.length) throw new Error('Invalid prepared mail');
		if (envelope.from !== '') validateMailAddress(envelope.from); // Null reverse path is required for forwarded DSNs.
		envelope.to.forEach(validateMailAddress);
		const result: MailSubmissionResult = { state: 'failed', accepted: [], rejected: [], retryableRecipients: [] };
		// Nodemailer omits RCPT refusals from a later DATA error. Separate envelope transactions
		// preserve those outcomes without inspecting private connection state or replaying DATA.
		// Keep the identical raw MIME/Message-ID; the shared pool still bounds SMTP connections.
		for (const recipient of new Set(envelope.to)) {
			const submission = await this.submitRecipient(raw, { from: envelope.from, to: [recipient] }, canSubmit);
			result.accepted.push(...submission.accepted);
			result.rejected.push(...submission.rejected);
			if (submission.state === 'unknown') {
				// Do not start later recipients, or automatically retry any part of an ambiguous attempt.
				return { ...result, state: 'unknown', retryableRecipients: [], response: submission.response };
			}
			result.retryableRecipients.push(...submission.retryableRecipients);
			if (result.response === undefined || submission.state === 'failed') result.response = submission.response;
		}
		result.state = result.accepted.length ? 'submitted' : 'failed';
		return result;
	}

	private async submitRecipient(raw: Buffer, envelope: MailEnvelope, canSubmit?: () => Promise<boolean>): Promise<MailSubmissionResult> {
		// Check the durable claim after capacity is available, not before waiting in the pool queue.
		if (this.availableConnections > 0) this.availableConnections--;
		else await new Promise<void>(resolve => this.waitingConnections.push(resolve));
		try {
			let claimValid;
			try { claimValid = !canSubmit || await canSubmit(); } catch { claimValid = false; }
			if (!claimValid) return { state: 'unknown', accepted: [], rejected: [], retryableRecipients: [], response: 'Submission claim is no longer valid' };
			const info = await this.transport.sendMail({ raw, envelope });
			const accepted = info.accepted;
			const rejected = info.rejected;
			const rejectedErrors = info.rejectedErrors ?? [];
			return {
				state: accepted.length ? 'submitted' : 'failed', accepted, rejected,
				retryableRecipients: rejected.filter(recipient => rejectedErrors.some(error => error.recipient === recipient && error.responseCode !== undefined && error.responseCode >= 400 && error.responseCode < 500)),
				response: typeof info.response === 'string' ? info.response.slice(0, 2048) : undefined,
			};
		} catch (error) {
			return classifySmtpFailure(error, envelope.to);
		} finally {
			const next = this.waitingConnections.shift();
			if (next) next();
			else this.availableConnections++;
		}
	}

	close(): void {
		this.transport.close();
	}
}
