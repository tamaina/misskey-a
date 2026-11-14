/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { call } from '@orpc/server';
import { createEmailRouter } from '@features/email/backend/api.implementation.js';
import type { EmailServicePort } from '@features/email/backend/api.implementation.js';
import type { ApiActor, ApiContext, ApiServices } from '@features/api/backend/transport/context.js';

const actor: ApiActor = { id: 'alice', isSuspended: false, movedToUri: null };
const id = '19f17055-773c-4a79-bbc3-b99facbfe743';

function fixture() {
	const mailbox = mockDeep<EmailServicePort>();
	const services = mockDeep<ApiServices<ApiActor>>();
	services.authenticate.mockResolvedValue([actor, null]);
	services.limitActor.mockReturnValue(actor.id);
	services.rateLimitFactor.mockResolvedValue(1);
	services.limit.mockResolvedValue(null);
	const context: ApiContext<ApiActor> = { services, credential: 'owner-session', ip: '127.0.0.1', headers: {} };
	return { mailbox, services, context, router: createEmailRouter<ApiActor>({ mailbox }) };
}

test('mail router never calls the service for anonymous or third-party-token requests', async () => {
	const h = fixture();
	h.services.authenticate.mockResolvedValue([null, null]);
	await expect(call(h.router.state, {}, { context: h.context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	h.services.authenticate.mockResolvedValue([actor, { permission: ['read:account', 'write:account'] }]);
	await expect(call(h.router.state, {}, { context: h.context })).rejects.toBeDefined();
	expect(h.mailbox.state).not.toHaveBeenCalled();
});

test('mail reads and deletes pass only authenticated owner ID and validated message ID', async () => {
	const h = fixture();
	await call(h.router.delete, { id, userId: 'victim' } as { id: string }, { context: h.context });
	expect(h.mailbox.delete).toHaveBeenCalledWith('alice', id);
	await call(h.router.read, { id, isRead: true }, { context: h.context });
	expect(h.mailbox.read).toHaveBeenCalledWith('alice', id, true);
});

test('mail service failures become fixed public messages without credentials or storage keys', async () => {
	const h = fixture();
	h.mailbox.show.mockRejectedValue(Object.assign(new Error('smtp://user:secret@example.com/private-key'), { code: 'NOT_FOUND' }));
	await expect(call(h.router.show, { id }, { context: h.context })).rejects.toMatchObject({ code: 'MAIL_NOT_FOUND', message: 'Mail not found.' });
	h.mailbox.show.mockRejectedValue(new Error('smtp://user:secret@example.com/private-key'));
	await expect(call(h.router.show, { id }, { context: h.context })).rejects.toMatchObject({ code: 'INTERNAL_ERROR', message: 'Internal error occurred. Please contact us if the error persists.' });
});

test('moved accounts cannot send and rate limits run before the mail service', async () => {
	const h = fixture();
	const input = { to: ['bob@example.com'], subject: '', body: 'test', format: 'text' as const, idempotencyKey: 'one' };
	h.services.authenticate.mockResolvedValue([{ ...actor, movedToUri: 'https://elsewhere.test/alice' }, null]);
	await expect(call(h.router.send, input, { context: h.context })).rejects.toMatchObject({ code: 'YOUR_ACCOUNT_MOVED' });
	h.services.authenticate.mockResolvedValue([actor, null]);
	h.services.limit.mockResolvedValue({ info: {} });
	await expect(call(h.router.send, input, { context: h.context })).rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED' });
	expect(h.mailbox.send).not.toHaveBeenCalled();
});
