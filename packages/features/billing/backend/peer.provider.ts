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
import { createTransferReceiptReader } from './transfer-confirmation.js';
import { createPeerPaymentStore } from './peer-store.js';
import { createPeerPaymentRouter } from './peer.implementation.js';
import type { DataSource } from 'typeorm';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
@Injectable()
export class PeerPaymentApiProvider {
	constructor(private readonly moduleRef: ModuleRef) { }
	compose() {
		const db = this.moduleRef.get<DataSource>(DI.db, { strict: false }), id = this.moduleRef.get(IdService, { strict: false });
		const chains = createPostgresWalletChainStore(db);
		return createPeerPaymentRouter<MiLocalUser>({ store: createPeerPaymentStore(db, now => id.gen(now)), rpcUrl: chains.rpcUrl,
			readReceipt: createTransferReceiptReader(this.moduleRef.get(HttpRequestService, { strict: false }), chains.rpcUrl) });
	}
}
