/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { FastifyInstance } from 'fastify';
import { AuthSessionApiProvider } from './session.provider.js';
import { registerAuthSessionHttp } from './session.http.js';

@Injectable()
export class StandaloneAuthService {
	constructor(private readonly provider: AuthSessionApiProvider) { }
	register(fastify: FastifyInstance) { registerAuthSessionHttp(fastify, this.provider.compose()); }
}
