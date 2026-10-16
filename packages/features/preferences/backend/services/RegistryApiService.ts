/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { bindThis } from '@features/runtime/backend/decorators.js';
import type { MiRegistryItem, RegistryItemsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiUser } from '@features/users/backend/models/User.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';

import type { RegistryJsonValue } from '../endpoints/i/registry/registry.schema.js';

export class RegistryApiService {
	constructor(
		private registryItemsRepository: RegistryItemsRepository,

		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
	}

	@bindThis
	public async set(userId: MiUser['id'], domain: string | null, scope: string[], key: string, value: RegistryJsonValue) {
		// TODO: 作成できるキーの数を制限する

		const query = this.registryItemsRepository.createQueryBuilder('item');
		if (domain) {
			query.where('item.domain = :domain', { domain: domain });
		} else {
			query.where('item.domain IS NULL');
		}
		query.andWhere('item.userId = :userId', { userId: userId });
		query.andWhere('item.key = :key', { key: key });
		query.andWhere('item.scope = :scope', { scope: scope });

		const existingItem = await query.getOne();

		// Bind JSON separately without TypeORM's infinitely recursive partial entity type.
		// SQL parameters need explicit JSON encoding; retain SQL NULL for null values.
		const jsonValue = value === null ? null : JSON.stringify(value);
		if (existingItem) {
			await this.registryItemsRepository.query(
				'UPDATE "registry_item" SET "updatedAt" = $1, "value" = $2 WHERE "id" = $3',
				[new Date(), jsonValue, existingItem.id],
			);
		} else {
			await this.registryItemsRepository.query(
				'INSERT INTO "registry_item" ("id", "updatedAt", "userId", "domain", "scope", "key", "value") VALUES ($1, $2, $3, $4, $5, $6, $7)',
				[this.idService.gen(), new Date(), userId, domain, scope, key, jsonValue],
			);
		}

		if (domain == null) {
			// TODO: サードパーティアプリが傍受出来てしまうのでどうにかする
			this.globalEventService.publishMainStream(userId, 'registryUpdated', {
				scope: scope,
				key: key,
				value: value,
			});
		}
	}

	@bindThis
	public async getItem(userId: MiUser['id'], domain: string | null, scope: string[], key: string): Promise<MiRegistryItem | null> {
		const query = this.registryItemsRepository.createQueryBuilder('item')
			.where(domain == null ? 'item.domain IS NULL' : 'item.domain = :domain', { domain: domain })
			.andWhere('item.userId = :userId', { userId: userId })
			.andWhere('item.key = :key', { key: key })
			.andWhere('item.scope = :scope', { scope: scope });

		const item = await query.getOne();

		return item;
	}

	@bindThis
	public async getAllItemsOfScope(userId: MiUser['id'], domain: string | null, scope: string[]): Promise<MiRegistryItem[]> {
		const query = this.registryItemsRepository.createQueryBuilder('item');
		query.where(domain == null ? 'item.domain IS NULL' : 'item.domain = :domain', { domain: domain });
		query.andWhere('item.userId = :userId', { userId: userId });
		query.andWhere('item.scope = :scope', { scope: scope });

		const items = await query.getMany();

		return items;
	}

	@bindThis
	public async getAllKeysOfScope(userId: MiUser['id'], domain: string | null, scope: string[]): Promise<string[]> {
		const query = this.registryItemsRepository.createQueryBuilder('item');
		query.select('item.key');
		query.where(domain == null ? 'item.domain IS NULL' : 'item.domain = :domain', { domain: domain });
		query.andWhere('item.userId = :userId', { userId: userId });
		query.andWhere('item.scope = :scope', { scope: scope });

		const items = await query.getMany();

		return items.map(x => x.key);
	}

	@bindThis
	public async getAllScopeAndDomains(userId: MiUser['id']): Promise<{ domain: string | null; scopes: string[][] }[]> {
		const query = this.registryItemsRepository.createQueryBuilder('item')
			.select(['item.scope', 'item.domain'])
			.where('item.userId = :userId', { userId: userId });

		const items = await query.getMany();

		const res: { domain: string | null; scopes: string[][] }[] = [];

		for (const item of items) {
			const target = res.find(x => x.domain === item.domain);
			if (target) {
				if (target.scopes.some(scope => scope.join('.') === item.scope.join('.'))) continue;
				target.scopes.push(item.scope);
			} else {
				res.push({
					domain: item.domain,
					scopes: [item.scope],
				});
			}
		}

		return res;
	}

	@bindThis
	public async remove(userId: MiUser['id'], domain: string | null, scope: string[], key: string) {
		const query = this.registryItemsRepository.createQueryBuilder().delete();
		if (domain) {
			query.where('domain = :domain', { domain: domain });
		} else {
			query.where('domain IS NULL');
		}
		query.andWhere('userId = :userId', { userId: userId });
		query.andWhere('key = :key', { key: key });
		query.andWhere('scope = :scope', { scope: scope });

		await query.execute();
	}
}
