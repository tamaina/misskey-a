/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { DI } from '@/di-symbols.js';
import { createPostgresWalletChainStore } from './wallet-chain-store.js';
import { createServiceBillingStore } from './service-store.js';
import { createServiceReceiptReader } from './service-receipt.js';
import { createServiceBillingRouter } from './service.implementation.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DataSource } from 'typeorm';

@Injectable()
export class ServiceBillingApiProvider {
	constructor(private readonly moduleRef: ModuleRef) { }
	compose() {
		const db = this.moduleRef.get<DataSource>(DI.db, { strict: false });
		const id = this.moduleRef.get(IdService, { strict: false });
		const chains = createPostgresWalletChainStore(db);
		return createServiceBillingRouter<MiLocalUser>({ store: createServiceBillingStore(db, now => id.gen(now)), rpcUrl: chains.rpcUrl,
																																																			readReceipt: createServiceReceiptReader(this.moduleRef.get(HttpRequestService, { strict: false }), chains.rpcUrl) });
	}
}
