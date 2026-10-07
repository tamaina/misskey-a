/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { emptyAdminCaptchaCurrentDefinition, emptyAdminCaptchaCurrentInput, emptyAdminCaptchaCurrentOutput } from '../../../../contract/empty-input-endpoint-definitions.js';
import { CaptchaService } from '../../../services/CaptchaService.js';

const contractProjection = projectEndpointContract(emptyAdminCaptchaCurrentDefinition);

export const meta = {
	tags: ['admin', 'captcha'],

	requireCredential: true,
	requireAdmin: true,

	// 実態はmetaの取得であるため
	kind: 'read:admin:meta',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof emptyAdminCaptchaCurrentInput, typeof emptyAdminCaptchaCurrentOutput> {
	constructor(
		private captchaService: CaptchaService,
	) {
		super(meta, contractProjection, async () => {
			return this.captchaService.get();
		});
	}
}
