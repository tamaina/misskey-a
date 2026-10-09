/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import type { AppsRepository } from '@features/persistence/backend/repositories/models.js';
import { AppEntityService } from '../../serializers/AppEntityService.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import * as v from 'valibot';
import { packedAppShowInput } from '../../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';

export const meta = {
	tags: ['app'],

	errors: {
		noSuchApp: {
			message: 'No such app.',
			code: 'NO_SUCH_APP',
			id: 'dce83913-2dc6-4093-8a7b-71dbb11718a3',
		},
	},
} as const;

@Injectable()
export class AppShowOperation {
	constructor(
		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		private appEntityService: AppEntityService,
	) {}

	async execute(ps: v.InferOutput<typeof packedAppShowInput>, user: MiLocalUser | null, token: ApiToken | null) {
		const isSecure = user != null && token == null;

		// Lookup app
		const ap = await this.appsRepository.findOneBy({ id: ps.appId });

		if (ap == null) {
			throw apiError(meta.errors.noSuchApp);
		}

		return await this.appEntityService.pack(ap, user, {
			detail: true,
			includeSecret: isSecure && (ap.userId === user!.id),
		});
	}
}
