/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { renderStandaloneMfm } from '@features/markup/backend/standalone-mfm.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { buildTextMail, UserMailTransport } from '../mail/outgoing.js';
import { validateForwardDestination } from '../mail/forwarding.js';
import { readMailAttachmentIsolated } from '../mail/isolated-parser.mjs';
import { UserMailRuntime } from './UserMailRuntime.js';
import type { DataSource, EntityManager } from 'typeorm';
import type { OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import type { EmailInputs, EmailOutputs, EmailServicePort } from '../api.implementation.js';
import type { MiMailSubmission } from '../models/MailSubmission.js';
import type { MiMailDelivery } from '../models/Mail.js';

export class MailboxError extends Error {
	constructor(public readonly code: 'DISABLED' | 'NOT_FOUND' | 'INVALID_INPUT' | 'QUOTA_EXCEEDED' | 'CONFLICT' | 'RATE_LIMITED' | 'UNAVAILABLE') { super(code); }
}
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const iso = (value: Date | string) => new Date(value).toISOString();

@Injectable()
export class UserMailboxService implements EmailServicePort, OnModuleInit, OnApplicationShutdown {
	private transport?: UserMailTransport;
	constructor(@Inject(DI.config) private readonly config: Config, @Inject(DI.db) private readonly db: DataSource, private readonly runtime: UserMailRuntime) {}

	onModuleInit() {
		this.runtime.setSubmissionProcessor(id => this.processSubmission(id));
		this.runtime.setSubmissionDispatcher(() => this.dispatchSubmissions());
	}
	onApplicationShutdown() { this.transport?.close(); }

	private async context() {
		if (!this.runtime.settings) throw new MailboxError('DISABLED');
		try { return await this.runtime.getContext(); } catch { throw new MailboxError('UNAVAILABLE'); }
	}
	private async owner(userId: string, enabled = false) {
		const [user] = await this.db.query(`SELECT u."id",u."username",m."enabled" FROM "user" u LEFT JOIN "mail_account" m ON m."userId"=u."id"
			WHERE u."id"=$1 AND u."host" IS NULL AND NOT u."isDeleted" AND NOT u."isSuspended"`, [userId]);
		if (!user || (enabled && !user.enabled)) throw new MailboxError('DISABLED');
		return user as { id: string; username: string; enabled: boolean | null };
	}
	async state(userId: string): Promise<EmailOutputs['state']> {
		const settings = this.runtime.settings;
		const empty = { address: null, verified: false, enabled: false, keepLocalCopy: true, revision: 0 };
		if (!settings) return { available: false, enabled: false, address: null, usedBytes: '0', quotaBytes: '0', forwarding: empty };
		const user = await this.owner(userId);
		const [account] = await this.db.query('SELECT "usedBytes" FROM "mail_account" WHERE "userId"=$1', [userId]);
		const [forwarding] = await this.db.query('SELECT "address","verifiedAt","enabled","keepLocalCopy","revision" FROM "mail_forwarding" WHERE "userId"=$1', [userId]);
		return { available: true, enabled: !!user.enabled, address: `${user.username}@${settings.domain}`, usedBytes: account?.usedBytes ?? '0', quotaBytes: String(settings.quotaBytes),
											forwarding: forwarding ? { address: forwarding.address, verified: !!forwarding.verifiedAt, enabled: forwarding.enabled, keepLocalCopy: forwarding.keepLocalCopy, revision: forwarding.revision } : empty };
	}
	async configure(userId: string, input: EmailInputs['configure']) {
		const { store } = await this.context();
		await this.owner(userId);
		await store.setEnabled(userId, input.enabled);
		if (!input.enabled) await this.db.query('UPDATE "mail_submission" SET "state"=\'cancelled\' WHERE "userId"=$1 AND "state"=\'queued\'', [userId]);
	}
	private summary(row: MiMailDelivery): EmailOutputs['list'][number] {
		const parsed = row.parsed ?? {};
		return { id: row.id, subject: typeof parsed.subject === 'string' ? parsed.subject : '', from: typeof parsed.from === 'string' ? parsed.from : '',
											createdAt: iso(row.createdAt), readAt: row.readAt ? iso(row.readAt) : null, parseState: row.parseState, size: row.size, localStored: row.localStored, localError: row.localError };
	}
	private async delivery(userId: string, id: string): Promise<MiMailDelivery> {
		await this.context(); await this.owner(userId);
		const [row] = await this.db.query('SELECT * FROM "mail_delivery" WHERE "id"=$1 AND "userId"=$2 AND "deletedAt" IS NULL', [id, userId]);
		if (!row) throw new MailboxError('NOT_FOUND');
		return row;
	}
	async list(userId: string, input: EmailInputs['list']): Promise<EmailOutputs['list']> {
		await this.context(); await this.owner(userId);
		const rows: MiMailDelivery[] = await this.db.query(`SELECT * FROM "mail_delivery" WHERE "userId"=$1 AND "deletedAt" IS NULL
			AND ($2::uuid IS NULL OR ("createdAt","id") < (SELECT "createdAt","id" FROM "mail_delivery" WHERE "id"=$2 AND "userId"=$1))
			ORDER BY "createdAt" DESC,"id" DESC LIMIT $3`, [userId, input.untilId ?? null, input.limit ?? 20]);
		return rows.map(row => this.summary(row));
	}
	async show(userId: string, id: string): Promise<EmailOutputs['show']> {
		const row = await this.delivery(userId, id); const parsed = row.parsed ?? {};
		const attachments = Array.isArray(parsed.attachments) ? parsed.attachments as { filename: string; mimeType: string; size: number; contentId?: string | null }[] : [];
		return { ...this.summary(row), text: typeof parsed.text === 'string' ? parsed.text : '', html: typeof parsed.html === 'string' ? parsed.html : null,
											attachments: attachments.map((item, index) => ({ id: index, filename: item.filename, mimeType: item.mimeType, size: item.size, contentId: item.contentId ?? null })) };
	}
	async read(userId: string, id: string, isRead: boolean) {
		await this.delivery(userId, id);
		await this.db.query('UPDATE "mail_delivery" SET "readAt"=$3 WHERE "id"=$1 AND "userId"=$2 AND "deletedAt" IS NULL', [id, userId, isRead ? new Date() : null]);
	}
	async delete(userId: string, id: string) {
		const { store } = await this.context(); await this.owner(userId);
		const [inbox] = await this.db.query('SELECT "id" FROM "mail_delivery" WHERE "id"=$1 AND "userId"=$2', [id, userId]);
		if (inbox) { await store.remove(userId, id); return; }
		await this.db.transaction(async manager => {
			const [row]: MiMailSubmission[] = await manager.query('SELECT * FROM "mail_submission" WHERE "id"=$1 AND "userId"=$2 FOR UPDATE', [id, userId]);
			if (!row) throw new MailboxError('NOT_FOUND');
			if (row.deletedAt) return;
			if (row.state === 'sending') throw new MailboxError('CONFLICT');
			if (row.charged) await manager.query('UPDATE "mail_account" SET "usedBytes"="usedBytes"-$2 WHERE "userId"=$1', [userId, row.size]);
			await manager.query('UPDATE "mail_submission" SET "deletedAt"=now(),"rawId"=NULL,"charged"=false,"state"=CASE WHEN "state"=\'queued\' THEN \'cancelled\' ELSE "state" END WHERE "id"=$1', [id]);
		});
	}
	async raw(userId: string, id: string): Promise<EmailOutputs['raw']> {
		await this.delivery(userId, id); const { store } = await this.context();
		const raw = await store.readRaw(userId, id);
		return { filename: `${id}.eml`, mimeType: 'message/rfc822', data: Buffer.from(raw).toString('base64') };
	}
	async attachment(userId: string, id: string, attachmentId: number): Promise<EmailOutputs['attachment']> {
		await this.delivery(userId, id); const { store } = await this.context();
		let attachment;
		try { attachment = await readMailAttachmentIsolated(await store.readRaw(userId, id), attachmentId); } catch { throw new MailboxError('NOT_FOUND'); }
		return { filename: attachment.filename, mimeType: attachment.mimeType, data: Buffer.from(attachment.content).toString('base64') };
	}
	async preview(userId: string, input: EmailInputs['preview']): Promise<EmailOutputs['preview']> {
		await this.context(); await this.owner(userId, true);
		if (input.format === 'text') return { html: null, text: input.body };
		if (input.body.length > 100_000) throw new MailboxError('INVALID_INPUT');
		const html = await renderStandaloneMfm(input.body, { instanceUrl: this.config.url, locale: 'ja-JP', timeZone: 'UTC' });
		return { html: html.html, text: input.body };
	}
	async send(userId: string, input: EmailInputs['send']): Promise<EmailOutputs['send']> {
		const { settings, store } = await this.context(); const user = await this.owner(userId, true);
		if (!settings.outbound) throw new MailboxError('UNAVAILABLE');
		const hash = digest(JSON.stringify(input));
		const [previous] = await this.db.query('SELECT "id","state","contentHash" FROM "mail_submission" WHERE "userId"=$1 AND "idempotencyKey"=$2', [userId, `send:${input.idempotencyKey}`]);
		if (previous) { if (previous.contentHash !== hash) throw new MailboxError('CONFLICT'); return { id: previous.id, state: previous.state }; }
		const preview = await this.preview(userId, input); const id = randomUUID(); const date = new Date();
		let prepared;
		try { prepared = await buildTextMail({ to: input.to, cc: input.cc, bcc: input.bcc, subject: input.subject, text: preview.text }, { username: user.username, domain: settings.domain }, { messageId: `<${id}@${settings.domain}>`, date }, { maxRecipients: settings.maxRecipients ?? 20, maxBytes: settings.maxBytes }, preview.html ?? undefined); } catch { throw new MailboxError('INVALID_INPUT'); }
		const raw = await store.stage(prepared.raw);
		return this.db.transaction(async manager => {
			await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`mail-send:${userId}:${input.idempotencyKey}`]);
			const [existing] = await manager.query('SELECT "id","state","contentHash" FROM "mail_submission" WHERE "userId"=$1 AND "idempotencyKey"=$2', [userId, `send:${input.idempotencyKey}`]);
			if (existing) { if (existing.contentHash !== hash) throw new MailboxError('CONFLICT'); return { id: existing.id, state: existing.state }; }
			const [ready] = await manager.query('SELECT "id" FROM "mail_raw" WHERE "id"=$1 AND "state"=\'ready\' FOR UPDATE', [raw.id]);
			if (!ready) throw new MailboxError('UNAVAILABLE');
			await manager.query('SELECT pg_advisory_xact_lock(hashtextextended(\'mail:send-rate\',0))');
			const [instanceCount] = await manager.query('SELECT count(*)::int AS count FROM "mail_submission" WHERE "kind"=\'send\' AND "createdAt">now()-interval \'1 hour\'');
			if (instanceCount.count >= 500) throw new MailboxError('RATE_LIMITED');
			const [account] = await manager.query('SELECT m."usedBytes" FROM "mail_account" m JOIN "user" u ON u."id"=m."userId" WHERE m."userId"=$1 AND m."enabled" AND u."username"=$2 AND u."host" IS NULL AND u."movedToUri" IS NULL AND NOT u."isDeleted" AND NOT u."isSuspended" FOR UPDATE OF m,u', [userId, user.username]);
			if (!account) throw new MailboxError('DISABLED');
			const [count] = await manager.query('SELECT count(*)::int AS count FROM "mail_submission" WHERE "userId"=$1 AND "kind"=\'send\' AND "createdAt">now()-interval \'1 hour\'', [userId]);
			if (count.count >= (settings.sendsPerHour ?? 20)) throw new MailboxError('RATE_LIMITED');
			if (BigInt(account.usedBytes) + BigInt(raw.size) > BigInt(settings.quotaBytes)) throw new MailboxError('QUOTA_EXCEEDED');
			await this.insertSubmission(manager, { id, userId, key: `send:${input.idempotencyKey}`, hash, rawId: raw.id, kind: 'send', from: prepared.envelope.from, to: prepared.envelope.to, metadata: { subject: input.subject, to: input.to, cc: input.cc ?? [], bcc: input.bcc ?? [] }, size: raw.size, charged: true });
			await manager.query('UPDATE "mail_account" SET "usedBytes"="usedBytes"+$2 WHERE "userId"=$1', [userId, raw.size]);
			return { id, state: 'queued' as const };
		});
	}
	private async insertSubmission(manager: EntityManager, s: { id: string; userId: string; key: string; hash: string; rawId: string; kind: string; from: string; to: string[]; metadata: object; size: number; charged: boolean; revision?: number }) {
		await manager.query('INSERT INTO "mail_submission" ("id","userId","idempotencyKey","contentHash","rawId","kind","forwardingRevision","envelopeFrom","recipients","metadata","state","createdAt","expiresAt","nextAttemptAt","size","charged") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,\'queued\',now(),now()+interval \'1 day\',now(),$11,$12)', [s.id, s.userId, s.key, s.hash, s.rawId, s.kind, s.revision ?? null, s.from, JSON.stringify(s.to), JSON.stringify(s.metadata), s.size, s.charged]);
	}
	async sent(userId: string, input: EmailInputs['sent']): Promise<EmailOutputs['sent']> {
		await this.context(); await this.owner(userId);
		const rows: MiMailSubmission[] = await this.db.query(`SELECT * FROM "mail_submission" WHERE "userId"=$1 AND "deletedAt" IS NULL AND ("kind"='send' OR "kind"='forward')
			AND ($2::uuid IS NULL OR ("createdAt","id") < (SELECT "createdAt","id" FROM "mail_submission" WHERE "id"=$2 AND "userId"=$1)) ORDER BY "createdAt" DESC,"id" DESC LIMIT $3`, [userId, input.untilId ?? null, input.limit ?? 20]);
		return rows.map(row => ({ id: row.id, subject: row.metadata.subject, to: row.metadata.to, cc: row.metadata.cc, bcc: row.metadata.bcc, state: row.state, createdAt: iso(row.createdAt), accepted: row.result.accepted ?? [], rejected: row.result.rejected ?? [], retryableRecipients: row.result.retryableRecipients ?? [], reason: row.result.reason ?? null }));
	}
	async configureForwarding(userId: string, input: EmailInputs['configureForwarding']) {
		const { settings, store } = await this.context(); const user = await this.owner(userId, true);
		if (input.address && (!settings.outbound || !settings.forwarding?.enabled || !settings.forwarding.trustedIngress || !settings.forwarding.loopChecked || !settings.forwarding.forwardingRelay)) throw new MailboxError('UNAVAILABLE');
		let address: string | null = null;
		try { if (input.address) address = validateForwardDestination(input.address, [settings.domain]); } catch { throw new MailboxError('INVALID_INPUT'); }
		const token = randomBytes(32).toString('base64url'); const id = randomUUID();
		let staged: { id: string; size: number } | null = null;
		if (address) {
			const link = new URL('/my/mail', this.config.url); link.searchParams.set('verify', token);
			const prepared = await buildTextMail({ to: [address], subject: 'Confirm mail forwarding', text: `Confirm forwarding for ${user.username}@${settings.domain}. This link expires in one hour. Sign in to the matching account, then open: ${link.href}\nOr enter this confirmation code in the mail settings: ${token}\nIf you did not request this, ignore it.` }, { username: user.username, domain: settings.domain }, { messageId: `<${id}@${settings.domain}>`, date: new Date() }, { maxRecipients: 1, maxBytes: settings.maxBytes });
			staged = await store.stage(prepared.raw);
		}
		await this.db.transaction(async manager => {
			await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`mail-forwarding:${userId}`]);
			// Match acceptance lock order: raw -> user -> forwarding -> submission.
			if (address && staged) {
				const [ready] = await manager.query('SELECT "id" FROM "mail_raw" WHERE "id"=$1 AND "state"=\'ready\' FOR UPDATE', [staged.id]);
				if (!ready) throw new MailboxError('UNAVAILABLE');
				const [identity] = await manager.query('SELECT "id" FROM "user" WHERE "id"=$1 AND "username"=$2 AND "host" IS NULL AND "movedToUri" IS NULL AND NOT "isDeleted" AND NOT "isSuspended" FOR SHARE', [userId, user.username]);
				if (!identity) throw new MailboxError('DISABLED');
			}
			const [previous] = await manager.query('SELECT * FROM "mail_forwarding" WHERE "userId"=$1 FOR UPDATE', [userId]);
			if (address && previous && Date.now() - new Date(previous.updatedAt).getTime() < 60_000) throw new MailboxError('RATE_LIMITED');
			const revision = (previous?.revision ?? 0) + 1;
			await manager.query(`INSERT INTO "mail_forwarding" ("userId","address","enabled","keepLocalCopy","revision","verifiedAt","tokenHash","expiresAt","updatedAt")
				VALUES ($1,$2,false,$3,$4,NULL,$5,CASE WHEN $2::varchar IS NULL THEN NULL ELSE now()+interval '1 hour' END,now())
				ON CONFLICT ("userId") DO UPDATE SET "address"=EXCLUDED."address","enabled"=false,"keepLocalCopy"=EXCLUDED."keepLocalCopy","revision"=EXCLUDED."revision","verifiedAt"=NULL,"tokenHash"=EXCLUDED."tokenHash","expiresAt"=EXCLUDED."expiresAt","updatedAt"=now()`, [userId, address, input.keepLocalCopy, revision, address ? digest(token) : null]);
			await manager.query('UPDATE "mail_submission" SET "state"=\'cancelled\' WHERE "userId"=$1 AND "kind" IN (\'forward\',\'confirmation\') AND "state"=\'queued\'', [userId]);
			if (address && staged) await this.insertSubmission(manager, { id, userId, key: `confirmation:${revision}`, hash: digest(address), rawId: staged.id, kind: 'confirmation', from: `${user.username}@${settings.domain}`, to: [address], metadata: { subject: 'Confirm mail forwarding', to: [address], cc: [], bcc: [] }, size: staged.size, charged: false, revision });
		});
	}
	async confirmForwarding(userId: string, input: EmailInputs['confirmForwarding']) {
		const { settings } = await this.context(); await this.owner(userId, true);
		if (!settings.forwarding?.enabled || !settings.forwarding.trustedIngress || !settings.forwarding.loopChecked || !settings.forwarding.forwardingRelay || !settings.outbound) throw new MailboxError('UNAVAILABLE');
		const rows = await this.db.query(`UPDATE "mail_forwarding" SET "enabled"=true,"verifiedAt"=now(),"tokenHash"=NULL,"expiresAt"=NULL
			WHERE "userId"=$1 AND "tokenHash"=$2 AND "expiresAt">now() AND "address" IS NOT NULL RETURNING "userId"`, [userId, digest(input.token)]);
		if (!rows.length) throw new MailboxError('INVALID_INPUT');
	}

	/** Queue is a wake-up only. PostgreSQL atomically claims and owns every attempt. */
	async processSubmission(id: string): Promise<void> {
		const { settings, storage } = await this.context();
		if (!settings.outbound) return;
		const [snapshot]: MiMailSubmission[] = await this.db.query('SELECT * FROM "mail_submission" WHERE "id"=$1', [id]);
		if (!snapshot) return;
		const attemptId = randomUUID();
		const row = await this.db.transaction(async manager => {
			// Same order as configureForwarding: forwarding row, then submission.
			const [forwarding] = snapshot.kind !== 'send' ? await manager.query('SELECT * FROM "mail_forwarding" WHERE "userId"=$1 FOR SHARE', [snapshot.userId]) : [];
			const [current]: MiMailSubmission[] = await manager.query('SELECT * FROM "mail_submission" WHERE "id"=$1 FOR UPDATE', [id]);
			if (!current || current.state !== 'queued' || current.deletedAt || new Date(current.nextAttemptAt).getTime() > Date.now()) return null;
			const [owner] = await manager.query('SELECT u."id",u."username",u."movedToUri" FROM "user" u JOIN "mail_account" m ON m."userId"=u."id" WHERE u."id"=$1 AND m."enabled" AND u."host" IS NULL AND NOT u."isDeleted" AND NOT u."isSuspended"', [current.userId]);
			const contractValid = settings.forwarding?.enabled && settings.forwarding.trustedIngress && settings.forwarding.loopChecked && settings.forwarding.forwardingRelay;
			const forwardingValid = current.kind === 'send' || (contractValid && forwarding && forwarding.revision === current.forwardingRevision && current.recipients.length === 1 && current.recipients[0] === forwarding.address && (current.kind === 'confirmation' || (forwarding.enabled && forwarding.verifiedAt)));
			if (!owner || (current.kind !== 'forward' && (owner.movedToUri || current.envelopeFrom !== `${owner.username}@${settings.domain}`)) || !forwardingValid || !current.rawId) { await manager.query('UPDATE "mail_submission" SET "state"=\'cancelled\' WHERE "id"=$1', [id]); return null; }
			if (new Date(current.expiresAt).getTime() <= Date.now()) {
				await manager.query('UPDATE "mail_submission" SET "state"=$2,"result"="result" || \'{"reason":"Retry deadline exceeded","retryableRecipients":[]}\'::jsonb WHERE "id"=$1', [id, current.result.accepted?.length ? 'submitted' : 'failed']);
				return null;
			}
			await manager.query('UPDATE "mail_submission" SET "state"=\'sending\',"attemptId"=$2,"leaseUntil"=now()+interval \'5 minutes\',"attempts"="attempts"+1 WHERE "id"=$1', [id, attemptId]);
			return current;
		});
		if (!row) return;
		let result;
		// Storage failure occurs before SMTP, so safe to retry only the pending recipients.
		let raw: Uint8Array;
		try {
			const [object] = await this.db.query('SELECT "objectKey" FROM "mail_raw" WHERE "id"=$1 AND "state"=\'ready\'', [row.rawId]);
			if (!object) throw new Error('RAW_UNAVAILABLE');
			raw = await storage.get(object.objectKey);
		} catch { result = { state: 'failed' as const, accepted: [], rejected: row.recipients, retryableRecipients: row.recipients, response: 'Temporary storage failure' }; }
		if (!result) {
			this.transport ??= new UserMailTransport(settings.outbound);
			try { result = await this.transport.submit(Buffer.from(raw!), { from: row.envelopeFrom, to: row.recipients }); } catch { result = { state: 'unknown' as const, accepted: [], rejected: [], retryableRecipients: [], response: 'Submission outcome unknown' }; }
		}
		const accepted = [...new Set([...(row.result.accepted ?? []), ...result.accepted])];
		const retry = result.state !== 'unknown' && row.attempts < 7 && new Date(row.expiresAt).getTime() > Date.now() ? result.retryableRecipients : [];
		const rejected = [...new Set([...(row.result.rejected ?? []), ...result.rejected])].filter(recipient => !accepted.includes(recipient));
		const state = result.state === 'unknown' ? 'unknown' : retry.length ? 'queued' : accepted.length ? 'submitted' : 'failed';
		await this.db.query(`UPDATE "mail_submission" SET "state"=$3,"recipients"=$4,"result"=$5,"leaseUntil"=NULL,"nextAttemptAt"=now()+($6 * interval '1 second')
			WHERE "id"=$1 AND "attemptId"=$2 AND "state"='sending'`, [id, attemptId, state, JSON.stringify(retry), JSON.stringify({ accepted, rejected, retryableRecipients: retry, reason: result.response ?? null }), Math.min(3600, 30 * 2 ** row.attempts)]);
	}

	async dispatchSubmissions(): Promise<void> {
		// A worker may have died after the relay accepted DATA. Never auto-resend it.
		await this.db.query('UPDATE "mail_submission" SET "state"=\'unknown\',"leaseUntil"=NULL,"result"="result" || \'{"reason":"Worker stopped during submission; reconcile with relay before retrying"}\'::jsonb WHERE "state"=\'sending\' AND "leaseUntil"<now()');
		await this.db.query('UPDATE "mail_submission" SET "state"=CASE WHEN jsonb_array_length(COALESCE("result"->\'accepted\',\'[]\'::jsonb))>0 THEN \'submitted\' ELSE \'failed\' END,"result"="result" || \'{"reason":"Retry deadline exceeded","retryableRecipients":[]}\'::jsonb WHERE "state"=\'queued\' AND "expiresAt"<now()');
		// User sent copies remain charged until explicitly deleted; transient forwarding
		// and confirmation spool has finite retention, including uncertain outcomes.
		await this.db.query('UPDATE "mail_submission" SET "rawId"=NULL WHERE "kind"<>\'send\' AND "rawId" IS NOT NULL AND ("state" IN (\'submitted\',\'failed\',\'cancelled\') OR ("state"=\'unknown\' AND "createdAt"<now()-interval \'7 days\'))');
		const rows = await this.db.query('SELECT "id" FROM "mail_submission" WHERE "state"=\'queued\' AND "deletedAt" IS NULL AND "nextAttemptAt"<=now() ORDER BY "nextAttemptAt" LIMIT 100');
		for (const row of rows) await this.runtime.enqueueSubmission(row.id);
	}
}
