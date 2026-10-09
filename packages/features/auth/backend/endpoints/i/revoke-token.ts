/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { MiAccessToken } from '../../models/AccessToken.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import * as v from 'valibot';
import { selectorIRevokeTokenInput } from '../../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';

import type { PackedJsonValue } from '@features/users/backend/json-value.schema.js';

/** Preserve legacy selector precedence and the original repository comparison.
 * An inactive tokenId may contain JSON when the token alternative is valid.
 * This narrow port models the actual runtime call without asserting it is a string.
 */
export interface TokenRevocationRepository {
	findOneBy(where: { id: PackedJsonValue | undefined; userId: string } | { token: string; userId: string }): Promise<MiAccessToken | null>;
	delete(where: { id: string }): Promise<unknown>;
}

export const meta = {
	description: 'Revoke an access token of the authenticated user. Requires credential. When called with an access token (third-party app), only the token currently in use can be revoked.',

	// アクセストークン自身を失効させられるようにするため requireCredential は使わず、
	// 認証・権限チェックを実装内で行う (ApiCallService が requireCredential:true かつ kind なしの
	// エンドポイントへのトークン経由のリクエストを一律 PERMISSION_DENIED にするため)

	errors: {
		credentialRequired: {
			message: 'Credential required.',
			code: 'CREDENTIAL_REQUIRED',
			id: '6f1f0d3a-3d5b-4b1f-9c3e-2a6d1e5b8c47',
			status: 401,
		},
		permissionDenied: {
			message: 'Permission denied.',
			code: 'PERMISSION_DENIED',
			id: 'fc20d118-5705-4462-b6c5-2b5b43092cf3',
			status: 403,
		},
	},
} as const;

@Injectable()
export class IRevokeTokenOperation {
	constructor(
		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: TokenRevocationRepository,
	) {}

	async execute(ps: v.InferOutput<typeof selectorIRevokeTokenInput>, me: MiLocalUser | null, token: ApiToken | null) {
		if (me == null) {
			throw apiError(meta.errors.credentialRequired);
		}

		let target: MiAccessToken | null = null;
		if ('tokenId' in ps) {
			target = await this.accessTokensRepository.findOneBy({ id: ps.tokenId, userId: me.id });
		} else {
			if (ps.token == null || ps.token === '') return;
			target = await this.accessTokensRepository.findOneBy({ token: ps.token, userId: me.id });
		}

		if (target == null) return;

		// サードパーティアプリ (アクセストークン) からのリクエストでは、いま使われているトークン自身のみ失効できる
		if (token != null && token.id !== target.id) {
			throw apiError(meta.errors.permissionDenied);
		}

		await this.accessTokensRepository.delete({ id: target.id });
	}
}
