/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { drivePilotContract } from './create.contract.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';

function isRecord(input: unknown): input is Record<string, unknown> {
	return input !== null && typeof input === 'object' && !Array.isArray(input);
}

export function createDriveFileProcedure<Actor extends ApiActor>() {
	const drive = implement(drivePilotContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'drive/files/create', requireCredential: true, kind: 'write:drive', limit: {
			key: 'drive/files/create', duration: 3600000, max: 120,
		}, prohibitMoved: true }))
		.use(requirePrincipal<Actor>())
		.use(async ({ context, next }) => {
			if (!context.upload) throw apiError({
				code: 'FILE_REQUIRED', message: 'File required.', id: '4267801e-70d1-416a-b011-4ee502885d8b',
			});
			return next({ context: { upload: context.upload } });
		})
		.use(async ({ next }, input) => {
			// Representation decoding follows authorization, as in the existing transport.
			if (isRecord(input)) {
				for (const key of ['force', 'isSensitive'] as const) {
					if (key in input && typeof input[key] === 'string') {
						try {
							input[key] = JSON.parse(input[key]);
						} catch {
							throw apiError({ code: 'INVALID_PARAM', message: 'Invalid param.',
																								id: '0b5f1631-7c1a-41a6-b399-cce335f34d85' }, { param: key, reason: 'cannot cast to boolean' });
						}
					}
				}
			}
			return next();
		});
	return drive.files.create.handler(({ input, context }) => {
		if (input.file !== context.upload.file) throw new Error('Upload resource does not match its wire File');
		return context.services.createFile(input, context.principal, context.upload, context);
	});
}
