/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { apiErrorData, commonErrors } from '../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../api/backend/transport/input.schema.js';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';

const id = v.pipe(v.string(), v.uuid());
const date = v.pipe(v.string(), v.metadata({ format: 'date-time' }));
const bytes = v.pipe(v.string(), v.regex(/^\d+$/));
const address = v.pipe(v.string(), v.minLength(3), v.maxLength(254), v.email());
const body = v.pipe(v.string(), v.maxLength(1_000_000));
const format = v.picklist(['text', 'mfm']);
const sendState = v.picklist(['queued', 'sending', 'submitted', 'failed', 'unknown', 'cancelled']);
const paging = { limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 20), untilId: v.exactOptional(id) };
const summaryFields = {
	id, subject: v.string(), from: v.string(), createdAt: date, readAt: v.nullable(date),
	parseState: v.picklist(['pending', 'parsed', 'failed']), localStored: v.boolean(), size: v.number(), localError: v.nullable(v.picklist(['quota', 'disabled'])),
};
const summary = v.strictObject(summaryFields);
const download = v.strictObject({
	filename: v.string(), mimeType: v.string(),
	// 25 MiB binary, including base64 expansion; actual binary is bounded by the service.
	data: v.pipe(v.string(), v.maxLength(4 * Math.ceil(25 * 1024 * 1024 / 3))),
});
const mailErrors = {
	...commonErrors,
	MAIL_DISABLED: { status: 403, data: apiErrorData },
	MAIL_NOT_FOUND: { status: 404, data: apiErrorData },
	MAIL_INVALID_INPUT: { status: 400, data: apiErrorData },
	MAIL_QUOTA_EXCEEDED: { status: 400, data: apiErrorData },
	MAIL_CONFLICT: { status: 409, data: apiErrorData },
	MAIL_RATE_LIMITED: { status: 429, data: apiErrorData },
	MAIL_UNAVAILABLE: { status: 503, data: apiErrorData },
} as const;

function endpoint<const Name extends string>(name: Name, max = 120, prohibitMoved = false) {
	return oc.$meta({
		requestName: `email/${name}` as const, requireCredential: true, secure: true, prohibitMoved,
		limit: { key: `email/${name}`, duration: 60_000, max },
	} satisfies ApiProcedureMetadata)
		.route({ method: 'POST', path: `/email/${name}` as const, tags: ['email'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors(mailErrors);
}

/** Mail is owner-only; third-party access tokens intentionally have no permissions yet. */
export const emailContract = {
	state: endpoint('state').input(objectInput({})).output(v.strictObject({
		available: v.boolean(), enabled: v.boolean(), address: v.nullable(v.string()), usedBytes: bytes, quotaBytes: bytes,
		forwarding: v.strictObject({ address: v.nullable(v.string()), verified: v.boolean(), enabled: v.boolean(), keepLocalCopy: v.boolean(), revision: v.number() }),
	})),
	configure: endpoint('configure', 10).input(objectInput({ enabled: v.boolean() })).output(v.void()),
	list: endpoint('list').input(objectInput(paging)).output(v.array(summary)),
	show: endpoint('show').input(objectInput({ id })).output(v.strictObject({
		...summaryFields, text: v.string(), html: v.nullable(v.string()),
		attachments: v.array(v.strictObject({ id: v.pipe(v.number(), v.integer(), v.minValue(0)), filename: v.string(), mimeType: v.string(), size: v.number(), contentId: v.nullable(v.string()) })),
	})),
	read: endpoint('read').input(objectInput({ id, isRead: v.boolean() })).output(v.void()),
	delete: endpoint('delete').input(objectInput({ id })).output(v.void()),
	raw: endpoint('raw', 10).input(objectInput({ id })).output(download),
	attachment: endpoint('attachment', 30).input(objectInput({ id, attachmentId: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(199)) })).output(download),
	send: endpoint('send', 10, true).input(objectInput({
		to: v.pipe(v.array(address), v.minLength(1), v.maxLength(50)),
		cc: v.exactOptional(v.pipe(v.array(address), v.maxLength(50))), bcc: v.exactOptional(v.pipe(v.array(address), v.maxLength(50))),
		// eslint-disable-next-line no-control-regex
		subject: v.pipe(v.string(), v.maxLength(998), v.regex(/^[^\r\n\x00]*$/)), body, format,
		idempotencyKey: v.pipe(v.string(), v.minLength(1), v.maxLength(128), v.regex(/^[a-zA-Z0-9_-]+$/)),
	})).output(v.strictObject({ id, state: sendState })),
	preview: endpoint('preview', 30).input(objectInput({ body, format })).output(v.strictObject({ html: v.nullable(v.string()), text: v.string() })),
	sent: endpoint('sent').input(objectInput(paging)).output(v.array(v.strictObject({
		id, subject: v.string(), to: v.array(v.string()), cc: v.array(v.string()), bcc: v.array(v.string()), state: sendState, createdAt: date,
		accepted: v.array(v.string()), rejected: v.array(v.string()), retryableRecipients: v.array(v.string()), reason: v.nullable(v.string()),
	}))),
	configureForwarding: endpoint('forwarding/configure', 3, true).input(objectInput({ address: v.nullable(address), keepLocalCopy: v.boolean() })).output(v.void()),
	confirmForwarding: endpoint('forwarding/confirm', 10, true).input(objectInput({ token: v.pipe(v.string(), v.minLength(20), v.maxLength(256)) })).output(v.void()),
};
