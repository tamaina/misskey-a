/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ContextIdFactory } from '@nestjs/core';
import { Connection } from '@features/api/backend/transport/stream/Connection.js';
import type { ConnectionRequest, NativeStreamFrame } from '@features/api/backend/transport/stream/Connection.js';
import type { AuthenticateService } from '@features/auth/backend/transport/AuthenticateService.js';
import type { StreamEventEmitter } from '@features/runtime/backend/services/GlobalEventService.js';
import type { ModuleRef } from '@nestjs/core';

/** Internal MCP outbound experiment; not registered as an endpoint or durable subscription. */
export async function openNativeStreamPilot(
	deps: { authenticateService: Pick<AuthenticateService, 'authenticate'>; moduleRef: Pick<ModuleRef, 'create' | 'registerRequestByContextId'>; subscriber: StreamEventEmitter },
	params: { credential: string; broadcast?: boolean; signal?: AbortSignal },
	onEvent: (event: NativeStreamFrame) => void | Promise<void>,
) {
	params.signal?.throwIfAborted();
	const [user, token] = await deps.authenticateService.authenticate(params.credential);
	params.signal?.throwIfAborted();
	// MCP requires an opted-in scoped grant; native channel checks remain authoritative.
	if (!user || user.host !== null || user.isSuspended || user.movedToUri || !token?.id || !token.permission.includes('access:mcp')) throw new Error('Stream access denied');
	const context = ContextIdFactory.create();
	deps.moduleRef.registerRequestByContextId<ConnectionRequest>({ user, token }, context);
	const connection = await deps.moduleRef.create(Connection, context);
	let open = true;
	let ready = false;
	let pending = 0;
	let resolveClosed!: (result: NativeStreamPilotClosed) => void;
	const closed = new Promise<NativeStreamPilotClosed>(resolve => { resolveClosed = resolve; });
	const stop = (result: NativeStreamPilotClosed) => {
		if (!open) return;
		open = false;
		connection.dispose();
		params.signal?.removeEventListener('abort', close);
		resolveClosed(result);
	};
	const close = () => { stop({ reason: 'closed' }); };
	try {
		params.signal?.throwIfAborted();
		connection.attachNativeOutput(deps.subscriber, {
			isOpen: () => open && !params.signal?.aborted,
			send: async frame => {
				// Do not emit while native initialization/authorization is still pending.
				if (!ready) return;
				// Bound concurrent sinks; overflow closes the experiment instead of growing a queue.
				if (pending >= 16) throw new Error('Native stream pilot capacity exceeded');
				pending++;
				try { await onEvent(frame); } finally { pending--; }
			},
			failed: error => { stop({ reason: 'sink_failed', error }); },
		}, { channels: ['main'], broadcast: params.broadcast });
		params.signal?.addEventListener('abort', close, { once: true });
		await connection.init();
		params.signal?.throwIfAborted();
		if (!await connection.connectChannel('main-pilot', {}, 'main')) throw new Error('Stream access denied');
		params.signal?.throwIfAborted();
		if (!open) throw new Error('Stream closed during initialization');
		ready = true;
		return { close, closed };
	} catch (error) { close(); throw error; }
}

/** First terminal reason wins. No retries, replay or cancellation of a started sink. */
export type NativeStreamPilotClosed = { reason: 'closed' } | { reason: 'sink_failed'; error: unknown };
