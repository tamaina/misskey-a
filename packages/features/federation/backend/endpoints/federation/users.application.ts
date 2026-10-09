/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from '../../../../persistence/backend/repositories/models.js';
import { QueryService } from '../../../../notes/backend/services/QueryService.js';
import { UserEntityService } from '../../../../users/backend/serializers/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { federationUsersInput, federationUsersOutput } from './users.contract.js';

@Injectable()
export class FederationUsersApplicationService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
		private queryService: QueryService,
	) {}

	public async execute(ps: v.InferOutput<typeof federationUsersInput>, me: MiUser | null): Promise<v.InferOutput<typeof federationUsersOutput>> {
		const result = await (async () => {
			const query = this.queryService.makePaginationQuery(this.usersRepository.createQueryBuilder('user'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('user.host = :host', { host: ps.host });

			const users = await query
				.limit(ps.limit)
				.getMany();

			return await this.userEntityService.packMany(users, me, { schema: 'UserDetailedNotMe' });
		})();
		return v.parse(federationUsersOutput, result);
	}
}
