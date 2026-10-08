/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ORPCError } from '@orpc/server';
import * as v from 'valibot';
import { apiErrorData } from './errors.schema.js';

export type ErrorData = v.InferOutput<typeof apiErrorData>;
export interface ErrorDefinition {
	code: string;
	message: string;
	id: string;
	status?: number;
	kind?: ErrorData['kind'];
}

export function apiError(definition: ErrorDefinition, info?: ErrorData['info']) {
	const kind = definition.kind ?? 'client';
	return new ORPCError(definition.code, {
		status: definition.status ?? (kind === 'permission' ? 403 : kind === 'server' ? 500 : 400),
		message: definition.message,
		data: { id: definition.id, kind, ...(info === undefined ? {} : { info }) },
	});
}

export const internalError = {
	code: 'INTERNAL_ERROR',
	message: 'Internal error occurred. Please contact us if the error persists.',
	id: '5d37dbcb-891e-41ca-a3d6-e690c97775ac',
	kind: 'server',
	status: 500,
} as const;

export function normalizeError(error: unknown): ORPCError<string, unknown> {
	if (error instanceof ORPCError) {
		if (error.code === 'BAD_REQUEST') return apiError({ code: 'INVALID_PARAM', message: 'Invalid param.',
			id: '3d81ceae-475f-4600-b2a8-2bc116157532' }, { reason: error.message });
		if (v.safeParse(apiErrorData, error.data).success) return error;
	}
	return apiError(internalError);
}

export function misskeyErrorBody(error: unknown) {
	const normalized = normalizeError(error);
	const data = v.parse(apiErrorData, normalized.data);
	return { error: {
		message: normalized.message, code: normalized.code, id: data.id, kind: data.kind,
		...(data.info === undefined ? {} : { info: data.info }),
	} };
}
