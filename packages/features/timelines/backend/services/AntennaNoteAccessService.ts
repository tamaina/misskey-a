/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'node:events';
import { Injectable } from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { Connection } from '@features/api/backend/transport/stream/Connection.js';
import type { ConnectionRequest } from '@features/api/backend/transport/stream/Connection.js';
import type { MiUser } from '@features/users/backend/models/User.js';
import type { MiAccessToken } from '@features/auth/backend/models/AccessToken.js';
import type { StreamEventEmitter } from '@features/runtime/backend/services/GlobalEventService.js';

@Injectable()
export class AntennaNoteAccessService {
	constructor(private readonly moduleRef: ModuleRef) { }

	/** Caller supplies a freshly checked persisted grant, never a stored credential. */
	async isDeliverable(user: MiUser, token: MiAccessToken, antennaId: string, noteId: string): Promise<boolean> {
		const context = ContextIdFactory.create();
		this.moduleRef.registerRequestByContextId<ConnectionRequest>({ user, token }, context);
		const connection = await this.moduleRef.create(Connection, context);
		try {
			connection.attachAntennaOutput(new EventEmitter() as StreamEventEmitter, { isOpen: () => true, send: () => {}, failed: () => {} });
			// One fresh snapshot per authorization; no periodic timer or live connection.
			await connection.fetch();
			if (!await connection.connectChannel('antenna-delivery', { antennaId }, 'antenna')) return false;
			const note = await connection.packAntennaNote('antenna-delivery', noteId);
			return !!note && !note.isHidden;
		} finally { connection.dispose(); }
	}
}
