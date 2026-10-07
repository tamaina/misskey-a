/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { Logger } from '@features/runtime/backend/logging/logger.js';
import { LoggerService } from '@features/runtime/backend/services/LoggerService.js';

@Injectable()
export class QueueLoggerService {
	public logger: Logger;

	constructor(
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('queue', 'orange');
	}
}
