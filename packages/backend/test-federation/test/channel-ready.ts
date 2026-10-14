/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** Test-only adapter for the server's existing connect/pong acknowledgement. */
export interface AcknowledgedChannelStream {
	on(event: 'connected' | '_disconnected_', listener: (payload: unknown) => void): unknown;
	off(event: 'connected' | '_disconnected_', listener: (payload: unknown) => void): unknown;
	send(type: string, payload: unknown): void;
}

/** The server serializes note subscriptions and channel connects on one socket. */
export async function waitForNoteReady(stream: AcknowledgedChannelStream, noteId: string, timeout: number): Promise<void> {
	stream.send('s', { id: noteId });
	// An acknowledgement for this later command proves the preceding subscription
	// has been registered. Opening the socket alone does not provide that guarantee.
	await waitForChannelReady(stream, crypto.randomUUID(), 'main', {}, timeout);
}

export function waitForChannelReady(stream: AcknowledgedChannelStream, id: string, channel: string, params: unknown, timeout: number): Promise<void> {
	return new Promise((resolve, reject) => {
		let settled = false;
		const finish = (error?: Error) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			stream.off('connected', connected);
			stream.off('_disconnected_', disconnected);
			if (error) reject(error);
			else resolve();
		};
		const connected = (payload: unknown) => {
			if (payload && typeof payload === 'object' && 'id' in payload && payload.id === id) finish();
		};
		const disconnected = () => finish(new Error('Stream disconnected before channel acknowledgement'));
		stream.on('connected', connected);
		stream.on('_disconnected_', disconnected);
		const timer = setTimeout(() => finish(new Error('Channel acknowledgement timed out')), timeout);
		try {
			// SDK useChannel sends its initial connect without pong. The server
			// serializes this same-ID reconnect and acknowledges only after init.
			stream.send('connect', { id, channel, params, pong: true });
		} catch (error) {
			finish(error instanceof Error ? error : new Error('Channel connect failed'));
		}
	});
}
