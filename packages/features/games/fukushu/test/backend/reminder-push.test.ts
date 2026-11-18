/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createECDH, randomBytes } from 'node:crypto';
import push from 'web-push';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { PushNotificationService } from '@features/notifications/backend/services/PushNotificationService.js';
import type { Config } from '@/config.js';
import type { MiMeta, MiSwSubscription, SwSubscriptionsRepository } from '@features/persistence/backend/repositories/models.js';

test('encrypts only the reminder envelope for the current owner and reports transient delivery failures', async () => {
	const keys = push.generateVAPIDKeys();
	const receiver = createECDH('prime256v1');
	const sub = mockDeep<MiSwSubscription>({
		userId: 'alice', endpoint: 'https://push.example.invalid/fixture',
		auth: randomBytes(16).toString('base64url'), publickey: receiver.generateKeys().toString('base64url'),
	});
	const repository = mockDeep<SwSubscriptionsRepository>();
	repository.findBy.mockResolvedValue([sub]);
	const service = new PushNotificationService(mockDeep<Config>({ url: 'https://misskey.example.invalid' }),
		mockDeep<MiMeta>({ enableServiceWorker: true, swPublicKey: keys.publicKey, swPrivateKey: keys.privateKey }),
		mockDeep(), repository, mockDeep());
	const body = { occurrence: Date.now(), expiresAt: Date.now() + 3600_000 };
	const transport = vi.spyOn(push, 'sendNotification').mockImplementation(async (subscription, payload, options) => {
		if (typeof payload !== 'string') throw new Error('Expected the serialized reminder envelope');
		expect(subscription.endpoint).toBe(sub.endpoint);
		expect(Object.keys(JSON.parse(payload)).sort()).toEqual(['body', 'dateTime', 'type', 'userId']);
		expect(JSON.parse(payload)).toMatchObject({ type: 'fukushuReminder', userId: 'alice', body });
		expect(options?.TTL).toBeGreaterThan(0);
		const request = push.generateRequestDetails(subscription, payload, { ...options, agent: undefined });
		expect(request.headers['Content-Encoding']).toBe('aes128gcm');
		expect(request.body).toBeInstanceOf(Buffer);
		expect(request.body.includes(Buffer.from('fukushuReminder'))).toBe(false);
		return { statusCode: 201, body: '', headers: {} };
	});
	try {
		await service.pushNotification('alice', 'fukushuReminder', body);
		expect(repository.findBy).toHaveBeenCalledWith({ userId: 'alice' });
		expect(transport).toHaveBeenCalledOnce();
		transport.mockRejectedValueOnce(Object.assign(new Error('temporary'), { statusCode: 503 }));
		await expect(service.pushNotification('alice', 'fukushuReminder', body)).rejects.toThrow('incomplete');
		expect(repository.delete).not.toHaveBeenCalled();
	} finally {
		transport.mockRestore();
		service.dispose();
	}
});
