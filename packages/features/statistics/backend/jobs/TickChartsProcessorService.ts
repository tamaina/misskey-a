/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { Logger } from '@features/runtime/backend/logging/logger.js';
import { FederationChart } from '../charts/federation.js';
import { NotesChart } from '../charts/notes.js';
import { UsersChart } from '../charts/users.js';
import { ActiveUsersChart } from '../charts/active-users.js';
import { InstanceChart } from '../charts/instance.js';
import { PerUserNotesChart } from '../charts/per-user-notes.js';
import { PerUserPvChart } from '../charts/per-user-pv.js';
import { DriveChart } from '../charts/drive.js';
import { PerUserReactionsChart } from '../charts/per-user-reactions.js';
import { PerUserFollowingChart } from '../charts/per-user-following.js';
import { PerUserDriveChart } from '../charts/per-user-drive.js';
import { ApRequestChart } from '../charts/ap-request.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import { QueueLoggerService } from '@features/runtime/backend/queue/QueueLoggerService.js';
import type * as Bull from 'bullmq';

@Injectable()
export class TickChartsProcessorService {
	private logger: Logger;

	constructor(
		private federationChart: FederationChart,
		private notesChart: NotesChart,
		private usersChart: UsersChart,
		private activeUsersChart: ActiveUsersChart,
		private instanceChart: InstanceChart,
		private perUserNotesChart: PerUserNotesChart,
		private perUserPvChart: PerUserPvChart,
		private driveChart: DriveChart,
		private perUserReactionsChart: PerUserReactionsChart,
		private perUserFollowingChart: PerUserFollowingChart,
		private perUserDriveChart: PerUserDriveChart,
		private apRequestChart: ApRequestChart,

		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('tick-charts');
	}

	@bindThis
	public async process(): Promise<void> {
		this.logger.info('Tick charts...');

		// DBへの同時接続を避けるためにPromise.allを使わずひとつずつ実行する
		await this.federationChart.tick(false);
		await this.notesChart.tick(false);
		await this.usersChart.tick(false);
		await this.activeUsersChart.tick(false);
		await this.instanceChart.tick(false);
		await this.perUserNotesChart.tick(false);
		await this.perUserPvChart.tick(false);
		await this.driveChart.tick(false);
		await this.perUserReactionsChart.tick(false);
		await this.perUserFollowingChart.tick(false);
		await this.perUserDriveChart.tick(false);
		await this.apRequestChart.tick(false);

		this.logger.succ('All charts successfully ticked.');
	}
}
