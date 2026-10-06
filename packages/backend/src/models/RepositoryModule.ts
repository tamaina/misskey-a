/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import type { FactoryProvider } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { createRepositorySet, repositoryNames } from './repository-factory.js';
import type { RepositorySet } from './repository-factory.js';

const repositorySet = Symbol('repositorySet');

const repositorySetProvider: FactoryProvider<RepositorySet> = {
	provide: repositorySet,
	useFactory: createRepositorySet,
	inject: [DI.db],
};

export const repositoryProviders: FactoryProvider[] = repositoryNames.map(name => ({
	provide: DI[name],
	useFactory: (repositories: RepositorySet) => repositories[name],
	inject: [repositorySet],
}));

@Module({
	providers: [repositorySetProvider, ...repositoryProviders],
	exports: repositoryProviders,
})
export class RepositoryModule {}
