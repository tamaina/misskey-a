/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { RelationshipsInputs } from '../relationships.contract.js';

@Injectable()
export class UsersRelationOperation {
	constructor(
		private userEntityService: UserEntityService,
	) {}

	async execute(ps: RelationshipsInputs['users/relation'], me: MiLocalUser) {
		return Array.isArray(ps.userId)
			? await this.userEntityService.getRelations(me.id, ps.userId).then(it => [...it.values()])
			: await this.userEntityService.getRelation(me.id, ps.userId).then(it => [it]);
	}
}
