/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidPagesDeleteDefinition, voidPagesDeleteInput, voidPagesDeleteOutput } from '../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { MiDriveFile, PagesRepository, UsersRepository } from '@/models/_.js';

import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ApiError } from '@/server/api/error.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { PageService } from '../../services/PageService.js';

const contractProjection = projectEndpointContract(voidPagesDeleteDefinition);

export const meta = {
	tags: ['pages'],

	requireCredential: true,

	kind: 'write:pages',

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: 'eb0c6e1d-d519-4764-9486-52a7e1c6392a',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '8b741b3e-2c22-44b3-a15f-29949aa1601e',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidPagesDeleteInput, typeof voidPagesDeleteOutput> {
	constructor(
		private pageService: PageService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			try {
				await this.pageService.delete(me, ps.pageId);
			} catch (err) {
				if (err instanceof IdentifiableError) {
					if (err.id === '66aefd3c-fdb2-4a71-85ae-cc18bea85d3f') throw new ApiError(meta.errors.noSuchPage);
					if (err.id === 'd0017699-8256-46f1-aed4-bc03bed73616') throw new ApiError(meta.errors.accessDenied);
				}
				throw err;
			}
		});
	}
}
