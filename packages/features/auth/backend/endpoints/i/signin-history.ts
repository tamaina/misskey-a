/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import type { SigninsRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { SigninEntityService } from '../../serializers/SigninEntityService.js';
import { DI } from '@/di-symbols.js';

import * as v from 'valibot';
import { packedISigninHistoryInput } from '../../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	requireCredential: true,
	secure: true,
} as const;

@Injectable()
export class ISigninHistoryOperation {
	constructor(
		@Inject(DI.signinsRepository)
		private signinsRepository: SigninsRepository,

		private signinEntityService: SigninEntityService,
		private queryService: QueryService,
	) {}

	async execute(ps: v.InferOutput<typeof packedISigninHistoryInput>, me: MiLocalUser) {
		const query = this.queryService.makePaginationQuery(this.signinsRepository.createQueryBuilder('signin'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('signin.userId = :meId', { meId: me.id });

		const history = await query.limit(ps.limit).getMany();

		return await Promise.all(history.map(record => this.signinEntityService.pack(record)));
	}
}
