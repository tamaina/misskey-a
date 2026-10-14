/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createBillingPolicyStore } from './policy-store.js';
import { createBillingPolicyRouter } from './policy.implementation.js';
import { createCatalogAdminStore } from './catalog-store.js';
import { createCatalogAdminRouter } from './catalog.implementation.js';
import { createCatalogRpcReader } from './catalog-rpc.js';
import { createWalletRpcFetch } from './wallet-rpc.js';
import { createRefundStore } from './refund-store.js';
import { createRefundRouter } from './refund.implementation.js';
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
		const readReceipt = createServiceReceiptReader(this.moduleRef.get(HttpRequestService, { strict: false }), chains.rpcUrl);
		const catalogRpc = createCatalogRpcReader(chains.rpcUrl, createWalletRpcFetch(this.moduleRef.get(HttpRequestService, { strict: false })));
		return { ...createBillingPolicyRouter<MiLocalUser>(createBillingPolicyStore(db, () => id.gen())), ...createCatalogAdminRouter<MiLocalUser>(createCatalogAdminStore(db, Date.now, () => id.gen()), catalogRpc, chains.rpcUrl), ...createServiceBillingRouter<MiLocalUser>({ store: createServiceBillingStore(db, now => id.gen(now)), rpcUrl: chains.rpcUrl, readReceipt }),
			...createRefundRouter<MiLocalUser>(createRefundStore(db, () => id.gen(), readReceipt)) };
	}
}
