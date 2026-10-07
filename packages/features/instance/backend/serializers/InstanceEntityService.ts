/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Packed } from '@features/index/contract/packed.js';
import type { MiInstance } from '@features/federation/backend/models/Instance.js';
import { bindThis } from '@/decorators.js';
import type { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import type { RoleService } from '@features/roles/backend/services/RoleService.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiMeta } from '@/models/_.js';

export class InstanceEntityService {
	constructor(
		private meta: MiMeta,

		private roleService: Pick<RoleService, 'isModerator'>,

		private utilityService: Pick<UtilityService, 'isBlockedHost' | 'isDeliverSuspendedSoftware' | 'isMediaSilencedHost' | 'isSilencedHost'>,
	) {
	}

	@bindThis
	public async pack(
		instance: MiInstance,
		me?: { id: MiUser['id']; } | null | undefined,
	): Promise<Packed<'FederationInstance'>> {
		const iAmModerator = me ? await this.roleService.isModerator(me as MiUser) : false;
		const softwareSuspended = this.utilityService.isDeliverSuspendedSoftware(instance);

		return {
			id: instance.id,
			firstRetrievedAt: instance.firstRetrievedAt.toISOString(),
			host: instance.host,
			usersCount: instance.usersCount,
			notesCount: instance.notesCount,
			followingCount: instance.followingCount,
			followersCount: instance.followersCount,
			isNotResponding: instance.isNotResponding,
			isSuspended: instance.suspensionState !== 'none' || Boolean(softwareSuspended),
			suspensionState: instance.suspensionState === 'none' && softwareSuspended ? 'softwareSuspended' : instance.suspensionState,
			isBlocked: this.utilityService.isBlockedHost(this.meta.blockedHosts, instance.host),
			softwareName: instance.softwareName,
			softwareVersion: instance.softwareVersion,
			openRegistrations: instance.openRegistrations,
			name: instance.name,
			description: instance.description,
			maintainerName: instance.maintainerName,
			maintainerEmail: instance.maintainerEmail,
			isSilenced: this.utilityService.isSilencedHost(this.meta.silencedHosts, instance.host),
			isMediaSilenced: this.utilityService.isMediaSilencedHost(this.meta.mediaSilencedHosts, instance.host),
			iconUrl: instance.iconUrl,
			faviconUrl: instance.faviconUrl,
			themeColor: instance.themeColor,
			infoUpdatedAt: instance.infoUpdatedAt ? instance.infoUpdatedAt.toISOString() : null,
			latestRequestReceivedAt: instance.latestRequestReceivedAt ? instance.latestRequestReceivedAt.toISOString() : null,
			moderationNote: iAmModerator ? instance.moderationNote : null,
		};
	}

	@bindThis
	public packMany(
		instances: MiInstance[],
		me?: { id: MiUser['id']; } | null | undefined,
	) {
		return Promise.all(instances.map(x => this.pack(x, me)));
	}
}
