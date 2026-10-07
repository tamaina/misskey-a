/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as _Ajv from 'ajv';
import { misskeyIdPattern } from '@features/api/contract';
import type { Schema } from '../utility/json-schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiAccessToken } from '@features/auth/backend/models/AccessToken.js';
import { ApiError } from './error.js';
import type { IEndpointMeta } from '@features/index/backend/endpoints.js';

const Ajv = _Ajv.default;

const ajv = new Ajv({
	useDefaults: true,
});

ajv.addFormat('misskey:id', misskeyIdPattern);

type File = {
	name: string | null;
	path: string;
};

// The transport callback is independent of either legacy or portable schema inference.
export type EndpointExecutor<T extends IEndpointMeta, Input, Output> =
	(params: Input, user: T['requireCredential'] extends true ? MiLocalUser : MiLocalUser | null, token: MiAccessToken | null, file?: File, cleanup?: () => any, ip?: string | null, headers?: Record<string, string> | null) =>
		Promise<Output>;

export class Endpoint<
	T extends IEndpointMeta,
	Input,
	Output,
> {
	public exec: (params: unknown, user: T['requireCredential'] extends true ? MiLocalUser : MiLocalUser | null, token: MiAccessToken | null, file?: File, ip?: string | null, headers?: Record<string, string> | null) => Promise<Output>;

	constructor(meta: T, paramDef: Schema, cb: EndpointExecutor<T, Input, Output>) {
		const validate = ajv.compile<Input>(paramDef);

		this.exec = (params: unknown, user: T['requireCredential'] extends true ? MiLocalUser : MiLocalUser | null, token: MiAccessToken | null, file?: File, ip?: string | null, headers?: Record<string, string> | null) => {
			let cleanup: undefined | (() => void) = undefined;

			if (meta.requireFile) {
				cleanup = () => {
					if (file) fs.unlink(file.path, () => {});
				};

				if (file == null) return Promise.reject(new ApiError({
					message: 'File required.',
					code: 'FILE_REQUIRED',
					id: '4267801e-70d1-416a-b011-4ee502885d8b',
				}));
			}

			const valid = validate(params);
			if (!valid) {
				if (file) cleanup!();

				const errors = validate.errors!;
				const err = new ApiError({
					message: 'Invalid param.',
					code: 'INVALID_PARAM',
					id: '3d81ceae-475f-4600-b2a8-2bc116157532',
				}, {
					param: errors[0].schemaPath,
					reason: errors[0].message,
				});
				return Promise.reject(err);
			}

			return cb(params, user, token, file, cleanup, ip, headers);
		};
	}
}
