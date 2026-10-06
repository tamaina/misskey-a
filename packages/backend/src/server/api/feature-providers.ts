/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from 'node:os';
import { MoreThan } from 'typeorm';
import { USER_ONLINE_THRESHOLD } from '@/const.js';
import { createInstance } from '@features/instance/backend';
import { DI } from '@/di-symbols.js';
import type { MiMeta } from '@/models/Meta.js';
import type { UsersRepository } from '@/models/_.js';
import type { Provider } from '@nestjs/common';

// Transitional composition boundary: Nest resolves a feature, not each handler.
// The feature itself receives narrow dependencies and has no container access.
export const featureTokens = { instance: Symbol('instance API feature') };
export const featureProviders: Provider[] = [{
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
}];
