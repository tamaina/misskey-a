/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';

import type { AppsRepository, AuthSessionsRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import * as v from 'valibot';
import { inlineAuthSessionGenerateInput } from '../../../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['auth'],

	requireCredential: false,

	errors: {
		noSuchApp: {
			message: 'No such app.',
			code: 'NO_SUCH_APP',
			id: '92f93e63-428e-4f2f-a5a4-39e1407fe998',
		},
	},
} as const;

@Injectable()
export class AuthSessionGenerateOperation {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		@Inject(DI.authSessionsRepository)
		private authSessionsRepository: AuthSessionsRepository,

		private idService: IdService,
	) {}

	async execute(ps: v.InferOutput<typeof inlineAuthSessionGenerateInput>, me: MiLocalUser | null) {
		// Lookup app
		const app = await this.appsRepository.findOneBy({
			secret: ps.appSecret,
		});

		if (app == null) {
			throw apiError(meta.errors.noSuchApp);
		}

		// Generate token
		const token = randomUUID();

		// Create session token document
		const doc = await this.authSessionsRepository.insertOne({
			id: this.idService.gen(),
			appId: app.id,
			token: token,
		});

		return {
			token: doc.token,
			url: `${this.config.authUrl}/${doc.token}`,
		};
	}
}
