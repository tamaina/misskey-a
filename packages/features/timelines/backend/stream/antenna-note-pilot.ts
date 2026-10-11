/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ContextIdFactory } from '@nestjs/core';
import { Connection } from '@features/api/backend/transport/stream/Connection.js';
import type { ConnectionRequest } from '@features/api/backend/transport/stream/Connection.js';
import type { AuthenticateService } from '@features/auth/backend/transport/AuthenticateService.js';
import type { StreamEventEmitter } from '@features/runtime/backend/services/GlobalEventService.js';
import type { Packed } from '@features/index/backend/packed.schema.js';
import type { ModuleRef } from '@nestjs/core';

/** Internal experiment, not an endpoint or MCP subscription/replay implementation. */
export async function openAntennaNotePilot(
	deps: { authenticateService: Pick<AuthenticateService, 'authenticate'>; moduleRef: Pick<ModuleRef, 'create' | 'registerRequestByContextId'>; subscriber: StreamEventEmitter },
	params: { credential: string; antennaId: string; signal?: AbortSignal },
	onNote: (note: Packed<'Note'>) => void,
) {
	params.signal?.throwIfAborted();
	const [user, token] = await deps.authenticateService.authenticate(params.credential);
	params.signal?.throwIfAborted();
	if (!user || user.isSuspended || user.host !== null || !params.antennaId) throw new Error('Antenna access denied');
	const context = ContextIdFactory.create();
	deps.moduleRef.registerRequestByContextId<ConnectionRequest>({ user, token }, context);
	const connection = await deps.moduleRef.create(Connection, context);
	let open = true;
	const close = () => { open = false; connection.dispose(); params.signal?.removeEventListener('abort', close); };
	try {
		connection.attachAntennaOutput(deps.subscriber, { isOpen: () => open && !params.signal?.aborted, send: onNote });
		params.signal?.addEventListener('abort', close, { once: true });
		await connection.init();
		params.signal?.throwIfAborted();
		// Native channel scope and antenna ownership checks remain authoritative.
		if (!await connection.connectChannel('antenna-pilot', { antennaId: params.antennaId }, 'antenna')) throw new Error('Antenna access denied');
		params.signal?.throwIfAborted();
		return { close };
	} catch (error) { close(); throw error; }
}
