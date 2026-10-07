/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { Ajv } from 'ajv';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { Logger } from '@features/runtime/backend/logging/logger.js';
import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import { exportedAntenna } from '../../contract/antenna-export.js';
import type { ExportedAntenna } from '../../contract/antenna-export.js';
import { QueueLoggerService } from '@features/runtime/backend/queue/QueueLoggerService.js';
import { DBAntennaImportJobData } from '@features/runtime/backend/queue/types.js';
import type * as Bull from 'bullmq';

const exportedAntennaSchema = toLegacyJsonSchema(exportedAntenna, {
	target: 'openapi-3.0',
	typeMode: 'ignore',
});

const validate = new Ajv().compile<ExportedAntenna>(exportedAntennaSchema);

@Injectable()
export class ImportAntennasProcessorService {
	private logger: Logger;

	constructor (
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		private queueLoggerService: QueueLoggerService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('import-antennas');
	}

	@bindThis
	public async process(job: Bull.Job<DBAntennaImportJobData>): Promise<void> {
		const now = new Date();
		try {
			for (const antenna of job.data.antenna) {
				if (antenna.keywords.length === 0 || antenna.keywords[0].every(x => x === '')) continue;
				if (!validate(antenna)) {
					this.logger.warn('Validation Failed');
					continue;
				}
				const result = await this.antennasRepository.insertOne({
					id: this.idService.gen(now.getTime()),
					lastUsedAt: now,
					userId: job.data.user.id,
					name: antenna.name,
					src: antenna.src === 'list' && antenna.userListAccts ? 'users' : antenna.src,
					userListId: null,
					keywords: antenna.keywords,
					excludeKeywords: antenna.excludeKeywords,
					users: (antenna.src === 'list' && antenna.userListAccts !== null ? antenna.userListAccts : antenna.users).filter(Boolean),
					caseSensitive: antenna.caseSensitive,
					localOnly: antenna.localOnly,
					excludeBots: antenna.excludeBots,
					withReplies: antenna.withReplies,
					withFile: antenna.withFile,
					excludeNotesInSensitiveChannel: antenna.excludeNotesInSensitiveChannel,
				});
				this.logger.succ('Antenna created: ' + result.id);
				this.globalEventService.publishInternalEvent('antennaCreated', result);
			}
		} catch (err: any) {
			this.logger.error(err);
		}
	}
}
