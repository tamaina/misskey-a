/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import * as v from 'valibot';
import { emailContract } from '@features/email/backend/api.definition.js';

function schema<S extends v.GenericSchema>(value: S | undefined): S {
	if (!value) throw new Error('Missing mail schema');
	return value;
}

test('mail endpoints require owner credentials, block app tokens and apply rate limits', () => {
	for (const contract of Object.values(emailContract)) {
		expect(contract['~orpc'].meta).toMatchObject({ requireCredential: true, secure: true });
		expect(contract['~orpc'].meta.limit.max).toBeGreaterThan(0);
		expect(contract['~orpc'].outputSchema).toBeDefined();
	}
	for (const contract of [emailContract.send, emailContract.configureForwarding, emailContract.confirmForwarding]) {
		expect(contract['~orpc'].meta.prohibitMoved).toBe(true);
	}
});

test('pagination is bounded and owner and storage keys cannot be supplied', () => {
	const list = schema(emailContract.list['~orpc'].inputSchema);
	expect(v.parse(list, { userId: 'other', objectKey: 'secret' })).toEqual({ limit: 20 });
	for (const limit of [0, 101, 1.5, '10']) expect(v.safeParse(list, { limit }).success).toBe(false);
	expect(v.safeParse(list, { untilId: '../object' }).success).toBe(false);
});

test('send constrains recipients, body format, headers and idempotency keys', () => {
	const send = schema(emailContract.send['~orpc'].inputSchema);
	const valid = { to: ['user@example.com'], subject: 'Hello', body: 'text', format: 'text', idempotencyKey: 'retry_123' };
	expect(v.safeParse(send, valid).success).toBe(true);
	for (const input of [
		{ ...valid, to: [] }, { ...valid, to: ['not an address'] }, { ...valid, to: Array(51).fill('user@example.com') },
		{ ...valid, subject: 'Hello\r\nBcc: injected@example.com' }, { ...valid, body: 'x'.repeat(1_000_001) },
		{ ...valid, format: 'html' }, { ...valid, idempotencyKey: '' }, { ...valid, idempotencyKey: '../object' },
	]) expect(v.safeParse(send, input).success).toBe(false);
});

test('attachment IDs are bounded numeric indexes, never caller-selected filenames or keys', () => {
	const input = schema(emailContract.attachment['~orpc'].inputSchema);
	const id = '19f17055-773c-4a79-bbc3-b99facbfe743';
	expect(v.parse(input, { id, attachmentId: 0, objectKey: 'secret' })).toEqual({ id, attachmentId: 0 });
	for (const attachmentId of [-1, 200, 0.5, 'file.png']) expect(v.safeParse(input, { id, attachmentId }).success).toBe(false);
});
