/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from 'node:os';
import { createOperations } from '@features/operations/backend';
import type { OperationsFeature } from '@features/operations/backend';
import { createPortability } from '@features/portability/backend';
import type { PortabilityFeature } from '@features/portability/backend';
import { QueueService } from '@/core/QueueService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { MoreThan, IsNull } from 'typeorm';
import { USER_ONLINE_THRESHOLD } from '@/const.js';
import { createEmojis } from '@features/emojis/backend';
import type { EmojisFeature } from '@features/emojis/backend';
import { EmojiEntityService } from '@/core/entities/EmojiEntityService.js';
import { createInstance } from '@features/instance/backend';
import type { InstanceFeature } from '@features/instance/backend';
import { createAvatarDecorations } from '@features/avatar-decorations/backend';
import type { AvatarDecorationsFeature } from '@features/avatar-decorations/backend';
import { AvatarDecorationService } from '@/core/AvatarDecorationService.js';
import { RoleService } from '@/core/RoleService.js';
import { createStatistics } from '@features/statistics/backend';
import type { StatisticsFeature } from '@features/statistics/backend';
import NotesChart from '@/core/chart/charts/notes.js';
import UsersChart from '@/core/chart/charts/users.js';
import { DI } from '@/di-symbols.js';
import type { MiMeta } from '@/models/Meta.js';
import type { UsersRepository, NoteReactionsRepository, InstancesRepository, EmojisRepository } from '@/models/_.js';
import type { Provider } from '@nestjs/common';

// Transitional composition boundary: Nest resolves a feature, not each handler.
// The feature itself receives narrow dependencies and has no container access.
export interface ApiFeatures {
	operations: OperationsFeature;
	portability: PortabilityFeature;
	instance: InstanceFeature;
	statistics: StatisticsFeature;
	avatarDecorations: AvatarDecorationsFeature;
	emojis: EmojisFeature;
}
export const featureTokens = {
	operations: Symbol('operations API feature'),
	portability: Symbol('portability API feature'),
	instance: Symbol('instance API feature'),
	statistics: Symbol('statistics API feature'),
	avatarDecorations: Symbol('avatar decorations API feature'),
	emojis: Symbol('emojis API feature'),
} satisfies Record<keyof ApiFeatures, symbol>;
export const featureProviders: Provider[] = [{
	provide: featureTokens.operations,
	inject: [QueueService, ModerationLogService],
	useFactory: (queue: QueueService, audit: ModerationLogService) => createOperations({
		queuePause: name => queue.queuePause(name),
		queueResume: name => queue.queueResume(name),
		queueClear: (name, state) => queue.queueClear(name, state),
		queuePromoteJobs: name => queue.queuePromoteJobs(name),
		queueRetryJob: (name, jobId) => queue.queueRetryJob(name, jobId),
		queueRemoveJob: (name, jobId) => queue.queueRemoveJob(name, jobId),
		log: (actor, action) => audit.log(actor, action),
	}),
}, {
	provide: featureTokens.portability,
	inject: [QueueService],
	useFactory: (queue: QueueService) => createPortability({
		createExportAntennasJob: actor => queue.createExportAntennasJob(actor),
		createExportBlockingJob: actor => queue.createExportBlockingJob(actor),
		createExportClipsJob: actor => queue.createExportClipsJob(actor),
		createExportFavoritesJob: actor => queue.createExportFavoritesJob(actor),
		createExportFollowingJob: (actor, excludeMuting, excludeInactive) => queue.createExportFollowingJob(actor, excludeMuting, excludeInactive),
		createExportMuteJob: actor => queue.createExportMuteJob(actor),
		createExportNotesJob: actor => queue.createExportNotesJob(actor),
		createExportUserListsJob: actor => queue.createExportUserListsJob(actor),
	}),
}, {
	provide: featureTokens.instance,
	inject: [DI.meta, DI.usersRepository],
	useFactory: (settings: MiMeta, usersRepository: UsersRepository) => createInstance({
		serverInfo: {
			enabled: () => settings.enableServerMachineStats,
			read: async () => {
				const si = await import('systeminformation');
				const memStats = await si.mem();
				const fsStats = await si.fsSize();
				return {
					machine: os.hostname(),
					cpu: { model: os.cpus()[0].model, cores: os.cpus().length },
					mem: { total: memStats.total },
					fs: { total: fsStats[0].size, used: fsStats[0].used },
				};
			},
		},
		getOnlineUsersCount: {
			thresholdMs: USER_ONLINE_THRESHOLD,
			countSince: cutoff => usersRepository.countBy({ lastActiveDate: MoreThan(cutoff) }),
		},
		readEndpoints: async () => {
			const { default: endpoints } = await import('./endpoints.js');
			return endpoints.map(endpoint => {
				const properties = Object.fromEntries(Object.entries(endpoint.params.properties ?? {}).map(([name, property]) => {
					const projected: { type?: string } = {};
					if (property.type !== undefined) projected.type = property.type;
					return [name, projected];
				}));
				return { name: endpoint.name, properties };
			});
		},
	}),
}, {
	provide: featureTokens.statistics,
	inject: [NotesChart, UsersChart, DI.noteReactionsRepository, DI.instancesRepository],
	useFactory: (notesChart: NotesChart, usersChart: UsersChart, reactions: NoteReactionsRepository, instances: InstancesRepository) => createStatistics({
		readNotes: async () => {
			const chart = await notesChart.getChart('hour', 1, null);
			return { local: chart.local.total[0], remote: chart.remote.total[0] };
		},
		readUsers: async () => {
			const chart = await usersChart.getChart('hour', 1, null);
			return { local: chart.local.total[0], remote: chart.remote.total[0] };
		},
		countReactions: () => reactions.count({ cache: 3600000 }),
		countInstances: () => instances.count({ cache: 3600000 }),
	}),
}, {
	provide: featureTokens.avatarDecorations,
	inject: [AvatarDecorationService, RoleService],
	useFactory: (decorations: AvatarDecorationService, roles: RoleService) => createAvatarDecorations({
		readDecorations: () => decorations.getAll(true),
		readRoles: () => roles.getRoles(),
	}),
}, {
	provide: featureTokens.emojis,
	inject: [DI.emojisRepository, EmojiEntityService],
	useFactory: (repository: EmojisRepository, entities: EmojiEntityService) => createEmojis({
		listLocal: async () => entities.packSimpleMany(await repository.find({
			where: { host: IsNull() },
			order: { category: 'ASC', name: 'ASC' },
		})),
		findLocal: async name => entities.packDetailed(await repository.findOneOrFail({
			where: { name, host: IsNull() },
		})),
	}),
}];
