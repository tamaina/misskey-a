/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class PeerBroadcastStart1792101000000 {
	name = 'PeerBroadcastStart1792101000000';
	async up(qr) { await qr.query('ALTER TABLE billing_peer_intent ADD "broadcastStartedAt" bigint'); }
	async down(qr) {
		if ((await qr.query('SELECT 1 FROM billing_peer_intent WHERE "broadcastStartedAt" IS NOT NULL LIMIT 1')).length) throw new Error('Retain broadcast attempt evidence before rollback');
		await qr.query('ALTER TABLE billing_peer_intent DROP COLUMN "broadcastStartedAt"');
	}
}
