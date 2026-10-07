/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { RegistrationTicketsRepository } from '@/models/_.js';
import { awaitAll } from '@features/runtime/backend/async/await-all.js';
import type { Packed } from '@features/index/contract/packed.js';
import type { MiUser } from '@features/users/backend/models/User.js';
import type { MiRegistrationTicket } from '../models/RegistrationTicket.js';
import { bindThis } from '@/decorators.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';

export class InviteCodeEntityService {
	constructor(
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private userEntityService: Pick<UserEntityService, 'pack' | 'packMany'>,
		private idService: Pick<IdService, 'parse'>,
	) {
	}

	@bindThis
	public async pack(
		src: MiRegistrationTicket['id'] | MiRegistrationTicket,
		me?: { id: MiUser['id'] } | null | undefined,
		hints?: {
			packedCreatedBy?: Packed<'UserLite'>,
			packedUsedBy?: Packed<'UserLite'>,
		},
	): Promise<Packed<'InviteCode'>> {
		const target = typeof src === 'object' ? src : await this.registrationTicketsRepository.findOneOrFail({
			where: {
				id: src,
			},
			relations: {
				createdBy: true,
				usedBy: true,
			},
		});

		return await awaitAll({
			id: target.id,
			code: target.code,
			expiresAt: target.expiresAt ? target.expiresAt.toISOString() : null,
			createdAt: this.idService.parse(target.id).date.toISOString(),
			createdBy: target.createdBy ? hints?.packedCreatedBy ?? (await this.userEntityService.pack(target.createdBy, me)) : null,
			usedBy: target.usedBy ? hints?.packedUsedBy ?? (await this.userEntityService.pack(target.usedBy, me)) : null,
			usedAt: target.usedAt ? target.usedAt.toISOString() : null,
			used: !!target.usedAt,
		});
	}

	@bindThis
	public async packMany(
		tickets: MiRegistrationTicket[],
		me: { id: MiUser['id'] },
	) {
		const _createdBys = tickets.map(({ createdBy, createdById }) => createdBy ?? createdById).filter(x => x != null);
		const _usedBys = tickets.map(({ usedBy, usedById }) => usedBy ?? usedById).filter(x => x != null);
		const _userMap = await this.userEntityService.packMany([..._createdBys, ..._usedBys], me)
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(
			tickets.map(ticket => {
				const packedCreatedBy = ticket.createdById != null ? _userMap.get(ticket.createdById) : undefined;
				const packedUsedBy = ticket.usedById != null ? _userMap.get(ticket.usedById) : undefined;
				return this.pack(ticket, me, { packedCreatedBy, packedUsedBy });
			}),
		);
	}
}
