/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { implement } from '@orpc/server';
import { DI } from '@/di-symbols.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { fukushuContract, materialErrors } from './material.contract.js';
import { FukushuStore, MaterialError } from './store.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';

async function invoke<T>(operation: () => Promise<T>): Promise<T> {
	try { return await operation(); } catch (error) {
		if (error instanceof MaterialError) throw apiError(materialErrors[error.code]);
		throw error;
	}
}

export function createFukushuRouter(store: Pick<FukushuStore, 'create' | 'show'>) {
	const procedure = createApiProcedure<MiLocalUser>();
	const principal = requirePrincipal<MiLocalUser>();
	return implement(fukushuContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().router({
		create: procedure(fukushuContract.create).use(principal).handler(({ input, context }) => invoke(() => store.create(context.principal.id, input.material))),
		show: procedure(fukushuContract.show).use(principal).handler(({ input, context }) => invoke(() => store.show(context.principal.id, input.id))),
	});
}

@Injectable()
export class FukushuApiProvider {
	private router: ReturnType<typeof createFukushuRouter> | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose() {
		this.router ??= createFukushuRouter(new FukushuStore(this.moduleRef.get(DI.db, { strict: false })));
		return this.router;
	}
}
