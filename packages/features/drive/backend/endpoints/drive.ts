/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../management.contract.js';
import { Injectable } from '@nestjs/common';

import { DriveFileEntityService } from '../serializers/DriveFileEntityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';

@Injectable()
export class DriveOperation {
	constructor(
		private driveFileEntityService: DriveFileEntityService,
		private roleService: RoleService,
	) {
	}

	async execute(_ps: DriveManagementInputs['drive'], me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		const usage = await this.driveFileEntityService.calcDriveUsageOf(me.id);

		const policies = await this.roleService.getUserPolicies(me.id);

		return {
			capacity: 1024 * 1024 * policies.driveCapacityMb,
			usage: usage,
		};
	}
}
