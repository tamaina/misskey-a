/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { os, ORPCError } from '@orpc/server';
import { STATUS_CODES } from 'node:http';
import { FastifyReplyError } from '@features/runtime/backend/http/fastify-reply-error.js';
import type { AuthSessionContext } from './session.effects.js';
export function sessionErrors() {
	return os.$context<AuthSessionContext>().middleware(async ({ next }) => {
		try { return await next(); } catch (error) {
			const statusCode = error instanceof FastifyReplyError ? error.statusCode : 500;
			const message = error instanceof Error ? error.message : String(error);
			throw new ORPCError(statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'SESSION_HTTP_ERROR', {
				status: statusCode, message,
				data: { statusCode, error: STATUS_CODES[statusCode] ?? 'Error', message },
			});
		}
	});
}
