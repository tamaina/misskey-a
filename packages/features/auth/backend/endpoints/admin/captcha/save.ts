/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { captchaErrorCodes, CaptchaService } from '../../../services/CaptchaService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type * as v from 'valibot';
import type { AdminCaptchaSaveContract } from '../../../api.contract.js';

export const meta = {
	tags: ['admin', 'captcha'],

	requireCredential: true,
	requireAdmin: true,

	// 実態はmetaの更新であるため
	kind: 'write:admin:meta',

	errors: {
		invalidProvider: {
			message: 'Invalid provider.',
			code: 'INVALID_PROVIDER',
			id: '14bf7ae1-80cc-4363-acb2-4fd61d086af0',
			status: 400,
		},
		invalidParameters: {
			message: 'Invalid parameters.',
			code: 'INVALID_PARAMETERS',
			id: '26654194-410e-44e2-b42e-460ff6f92476',
			status: 400,
		},
		noResponseProvided: {
			message: 'No response provided.',
			code: 'NO_RESPONSE_PROVIDED',
			id: '40acbba8-0937-41fb-bb3f-474514d40afe',
			status: 400,
		},
		requestFailed: {
			message: 'Request failed.',
			code: 'REQUEST_FAILED',
			id: '0f4fe2f1-2c15-4d6e-b714-efbfcde231cd',
			status: 500,
		},
		verificationFailed: {
			message: 'Verification failed.',
			code: 'VERIFICATION_FAILED',
			id: 'c41c067f-24f3-4150-84b2-b5a3ae8c2214',
			status: 400,
		},
		unknown: {
			message: 'unknown',
			code: 'UNKNOWN',
			id: 'f868d509-e257-42a9-99c1-42614b031a97',
			status: 500,
		},
	},
} as const;

@Injectable()
export class AdminCaptchaSaveOperation {
	constructor(
		private captchaService: CaptchaService,
	) {}

	async execute(ps: v.InferOutput<NonNullable<typeof AdminCaptchaSaveContract['~orpc']['inputSchema']>>) {
		const result = await this.captchaService.save(ps.provider, {
			sitekey: ps.sitekey,
			secret: ps.secret,
			instanceUrl: ps.instanceUrl,
			captchaResult: ps.captchaResult,
		});

		if (!result.success) {
			switch (result.error.code) {
				case captchaErrorCodes.invalidProvider:
					throw apiError({
						...meta.errors.invalidProvider,
						message: result.error.message,
					});
				case captchaErrorCodes.invalidParameters:
					throw apiError({
						...meta.errors.invalidParameters,
						message: result.error.message,
					});
				case captchaErrorCodes.noResponseProvided:
					throw apiError({
						...meta.errors.noResponseProvided,
						message: result.error.message,
					});
				case captchaErrorCodes.requestFailed:
					throw apiError({
						...meta.errors.requestFailed,
						message: result.error.message,
					});
				case captchaErrorCodes.verificationFailed:
					throw apiError({
						...meta.errors.verificationFailed,
						message: result.error.message,
					});
				default:
					throw apiError(meta.errors.unknown);
			}
		}
	}
}
