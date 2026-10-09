/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { ReversiService } from '../../services/ReversiService.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { InferSchemaOutput } from '@orpc/contract';
import { type reversiInvitationsContract } from '../../endpoints/reversi/invitations.contract.js';

@Injectable()
export class ReversiInvitationsApplicationService {
	constructor(
		private userEntityService: UserEntityService,
		private reversiService: ReversiService,
	) {}

	async execute(ps: InferSchemaOutput<NonNullable<(typeof reversiInvitationsContract)['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const invitations = await this.reversiService.getInvitations(me);

		return await this.userEntityService.packMany(invitations, me);
	}
}
