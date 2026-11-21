/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type * as Bull from 'bullmq';
import { ImportAntennasProcessorService } from '../../backend/jobs/ImportAntennasProcessorService.js';
import type { AntennasRepository, MiAntenna } from '@features/persistence/backend/repositories/models.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { QueueLoggerService } from '@features/runtime/backend/queue/QueueLoggerService.js';
import type { Logger } from '@features/runtime/backend/logging/logger.js';
import type { DBAntennaImportJobData } from '@features/runtime/backend/queue/types.js';

test('queued antenna JSON is validated per item and later valid entries still import', async () => {
	const antennas = mockDeep<AntennasRepository>();
	const logger = mockDeep<Logger>();
	const logs = mockDeep<QueueLoggerService>();
	logs.logger.createSubLogger.mockReturnValue(logger);
	const ids = mockDeep<IdService>();
	ids.gen.mockReturnValue('new1');
	const events = mockDeep<GlobalEventService>();
	antennas.insertOne.mockResolvedValue(mockDeep<MiAntenna>({ id: 'new1' }));
	const processor = new ImportAntennasProcessorService(antennas, logs, ids, events);
	const valid = { name: '😀'.repeat(100), src: 'all', userListAccts: null, keywords: [['word']], excludeKeywords: [], users: ['alice'], caseSensitive: false, withReplies: true, withFile: false };
	const job: Pick<Bull.Job<DBAntennaImportJobData>, 'data'> = { data: { user: { id: 'owner1' }, antenna: [{ name: 'invalid' }, valid] } };
	await processor.process(job);
	expect(logger.warn).toHaveBeenCalledWith('Validation Failed');
	expect(antennas.insertOne).toHaveBeenCalledTimes(1);
	expect(antennas.insertOne).toHaveBeenCalledWith(expect.objectContaining({ userId: 'owner1', name: valid.name, keywords: [['word']], users: ['alice'] }));
	expect(events.publishInternalEvent).toHaveBeenCalledWith('antennaCreated', expect.objectContaining({ id: 'new1' }));
});
