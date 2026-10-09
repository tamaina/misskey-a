/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { CaptchaService } from '../../../services/CaptchaService.js';

export const meta = {
	tags: ['admin', 'captcha'],

	requireCredential: true,
	requireAdmin: true,

	// 実態はmetaの取得であるため
	kind: 'read:admin:meta',
} as const;

@Injectable()
export class AdminCaptchaCurrentOperation {
	constructor(
		private captchaService: CaptchaService,
	) {}

	async execute() {
		return this.captchaService.get();
	}
}
