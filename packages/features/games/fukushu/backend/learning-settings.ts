/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';
import { defaultLearningSettings, learningSettingsSchema } from '../shared/upstream-records.schema.js';
import { MiFukushuLearningSettings } from './models/FukushuLearningSettings.js';
import { MiFukushuUpstreamRecord } from './models/FukushuUpstreamRecord.js';
import type { EntityManager } from 'typeorm';

export async function initialLearningSettings(manager: EntityManager, ownerId: string) {
	const row = await manager.getRepository(MiFukushuLearningSettings).findOneBy({ ownerId });
	return row?.data ?? defaultLearningSettings;
}

export async function readLearningSettings(manager: EntityManager, ownerId: string) {
	const row = await manager.getRepository(MiFukushuUpstreamRecord).findOne({ where: { ownerId, store: 'settings' }, select: { data: true } });
	return row ? v.parse(learningSettingsSchema, JSON.parse(row.data)) : initialLearningSettings(manager, ownerId);
}
