/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { genPilotOpenapiSpec } from '@features/api/backend/transport/openapi/pilot-spec.js';
import { restoreFukushuNotificationBaseline } from './notification-rebase.js';

test('notification inverse preserves input and rejects unrelated schema changes', async () => {
	const spec = await genPilotOpenapiSpec({ version: 'test', apiUrl: '/api' });
	for (const path of ['/i/notifications', '/i/notifications-grouped']) {
		const current = spec.paths?.[path];
		const before = JSON.stringify(current);
		expect(restoreFukushuNotificationBaseline('operation', path, current)).not.toEqual(current);
		expect(JSON.stringify(current)).toBe(before);
		expect(() => restoreFukushuNotificationBaseline('operation', path, { ...current, description: 'unrelated change' })).toThrow('boundary differs');
	}
	const notification = spec.components?.schemas?.Notification;
	expect(restoreFukushuNotificationBaseline('schema', 'Notification', notification)).not.toEqual(notification);
	expect(() => restoreFukushuNotificationBaseline('schema', 'Notification', { ...notification, description: 'unrelated change' })).toThrow('boundary differs');
});

test('notification inverse does not transform unrelated contracts', () => {
	const untouched = { enum: ['fukushu'] };
	expect(restoreFukushuNotificationBaseline('operation', '/fukushu/backup/export', untouched)).toBe(untouched);
	expect(restoreFukushuNotificationBaseline('schema', 'Other', untouched)).toBe(untouched);
});
