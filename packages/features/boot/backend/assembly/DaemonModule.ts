/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import { CoreModule } from './CoreModule.js';
import { GlobalModule } from './GlobalModule.js';
import { QueueStatsService } from '@features/runtime/backend/queue/QueueStatsService.js';
import { ServerStatsService } from '@/daemons/ServerStatsService.js';

@Module({
	imports: [
		GlobalModule,
		CoreModule,
	],
	providers: [
		QueueStatsService,
		ServerStatsService,
	],
	exports: [
		QueueStatsService,
		ServerStatsService,
	],
})
export class DaemonModule {}
