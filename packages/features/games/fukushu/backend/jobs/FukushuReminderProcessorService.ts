/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Inject, Injectable } from '@nestjs/common';
import { PushNotificationService } from '@features/notifications/backend/services/PushNotificationService.js';
import { DI } from '@/di-symbols.js';
import { FukushuReminderStore } from '../reminder-store.js';
import type { DataSource } from 'typeorm';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class FukushuReminderProcessorService {
	constructor(
		@Inject(DI.db) private readonly db: DataSource,
		@Inject(DI.usersRepository) private readonly users: UsersRepository,
		private readonly push: PushNotificationService,
	) {}

	async process(): Promise<void> {
		const store = new FukushuReminderStore(this.db);
		const deadline = Date.now() + 30_000;
		let incomplete = false;
		while (Date.now() < deadline) {
			const claim = await store.claimNext();
			const processed = await store.deliverNext(async (ownerId, body) => {
				const user = await this.users.findOneBy({ id: ownerId });
				if (!user || user.host !== null || user.isSuspended || user.isDeleted) return true;
				try {
					await this.push.pushNotification(ownerId, 'fukushuReminder', body);
					return true;
				} catch {
					incomplete = true;
					return false;
				}
			});
			if (claim === undefined && !processed) break;
		}
		if (incomplete) throw new Error('Fukushu reminder delivery will be retried');
	}
}
