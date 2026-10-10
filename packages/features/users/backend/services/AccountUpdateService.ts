/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser, MiUser } from '../models/User.js';
import { ApRendererService } from '@features/federation/backend/services/ApRendererService.js';
import { RelayService } from '@features/federation/backend/services/RelayService.js';
import { ApDeliverManagerService } from '@features/federation/backend/services/ApDeliverManagerService.js';
import { UserEntityService } from '../serializers/UserEntityService.js';
import { bindThis } from '@features/runtime/backend/decorators.js';

@Injectable()
export class AccountUpdateService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
		private apRendererService: ApRendererService,
		private apDeliverManagerService: ApDeliverManagerService,
		private relayService: RelayService,
	) {
	}

	private async createUpdatePersonActivity(user: MiLocalUser) {
		return this.apRendererService.addContext(
			this.apRendererService.renderUpdate(await this.apRendererService.renderPerson(user), user),
		);
	}

	@bindThis
	public async publishToFollowers(userId: MiUser['id']) {
		const user = await this.usersRepository.findOneBy({ id: userId });
		if (user == null || user.isDeleted) return;

		if (this.userEntityService.isLocalUser(user)) {
			const content = await this.createUpdatePersonActivity(user);
			this.apDeliverManagerService.deliverToFollowers(user, content);
			this.relayService.deliverToRelays(user, content);
		}
	}

	@bindThis
	public async publishToFollowersAndSharedInboxAndRelays(userId: MiUser['id']) {
		const user = await this.usersRepository.findOneBy({ id: userId });
		if (user == null || user.isDeleted) return;

		if (this.userEntityService.isLocalUser(user)) {
			const content = await this.createUpdatePersonActivity(user);
			const manager = this.apDeliverManagerService.createDeliverManager(user, content);
			manager.addAllKnowingSharedInboxRecipe();
			manager.addFollowersRecipe();
			await Promise.allSettled([
				manager.execute(),
				this.relayService.deliverToRelays(user, content),
			]);
		}
	}
}
