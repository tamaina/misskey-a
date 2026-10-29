/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { OpenAPIHandler } from '@orpc/openapi/fastify';
import { ApiRouterProvider } from '@features/index/backend/api.implementation.js';
import { TelemetryService } from '@features/statistics/backend/services/TelemetryService.js';
import { ApiExecutionContextFactory } from './ApiExecutionContextFactory.js';
import { misskeyErrorBody } from './orpc-error.js';
import { nullSuccessToNoContent } from './no-content.js';
import { bodyCredential, registerPilotHttp } from './pilot-http.js';
import type { FastifyInstance } from 'fastify';
@Injectable()
export class OrpcPilotService {
	private handler: ReturnType<OrpcPilotService['createHandler']> | undefined;
	constructor(
		private readonly contextFactory: ApiExecutionContextFactory,
		private readonly telemetry: TelemetryService,
		private readonly moduleRef: ModuleRef,
	) { }
	private createHandler() {
		const router = this.moduleRef.get(ApiRouterProvider, { strict: false }).compose();
		return new OpenAPIHandler(router, { customErrorResponseBodyEncoder: misskeyErrorBody, interceptors: [nullSuccessToNoContent()] });
	}
	register(fastify: FastifyInstance) {
		const handler = this.handler ??= this.createHandler();
		registerPilotHttp(fastify, handler, {
			maxFileSize: this.contextFactory.maxFileSize,
			context: (request, reply, name, upload) => this.contextFactory.create({
				credential: name === 'clear-browser-cache' ? undefined : bodyCredential(request),
				ip: request.ip, headers: request.headers, params: request.body, upload,
				response: { header: (key, value) => { reply.header(key, value); } },
			}, name),
			runSpan: (name, run) => this.telemetry.startSpan(name, run),
		});
	}
}
