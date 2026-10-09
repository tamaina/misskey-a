/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { AppsRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { unique } from '@features/runtime/backend/data/array.js';
import { secureRndstr } from '../../utility/secure-rndstr.js';
import { AppEntityService } from '../../serializers/AppEntityService.js';
import { DI } from '@/di-symbols.js';

import * as v from 'valibot';
import { uniqueAppCreateInput } from '../../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['app'],

	requireCredential: false,
} as const;

@Injectable()
export class AppCreateOperation {
	constructor(
		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		private appEntityService: AppEntityService,
		private idService: IdService,
	) {}

	async execute(ps: v.InferOutput<typeof uniqueAppCreateInput>, me: MiLocalUser | null) {
		// Generate secret
		const secret = secureRndstr(32);

		// for backward compatibility
		const permission = unique(ps.permission.map(v => v.replace(/^(.+)(\/|-)(read|write)$/, '$3:$1')));

		// Create account
		const app = await this.appsRepository.insertOne({
			id: this.idService.gen(),
			userId: me ? me.id : null,
			name: ps.name,
			description: ps.description,
			permission,
			callbackUrl: ps.callbackUrl,
			secret: secret,
		});

		return await this.appEntityService.pack(app, null, {
			detail: true,
			includeSecret: true,
		});
	}
}
