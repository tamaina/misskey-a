/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PeerPayments1791950000000 {
	name = 'PeerPayments1791950000000';
	async up(q) {
		await q.query(`ALTER TABLE billing_wallet ADD "isPublicForPayments" boolean NOT NULL DEFAULT false`);
		await q.query(`CREATE TABLE billing_peer_token (id varchar(32) NOT NULL, terms jsonb NOT NULL, CONSTRAINT billing_peer_token_pk PRIMARY KEY (id))`);
		await q.query(`CREATE TABLE billing_peer_intent (id varchar(32) NOT NULL, "senderUserId" varchar(32), "recipientUserId" varchar(32), "requestKey" varchar(128) NOT NULL, terms jsonb NOT NULL, "chainId" bigint NOT NULL, "createdAt" bigint NOT NULL, "expiresAt" bigint NOT NULL, status varchar(16) NOT NULL DEFAULT 'pending', "txHash" varchar(66), "logIndex" bigint, "confirmedAt" bigint, CONSTRAINT billing_peer_intent_confirmation_check CHECK ((status = 'confirmed' AND "txHash" IS NOT NULL AND "logIndex" IS NOT NULL AND "confirmedAt" IS NOT NULL) OR (status IN ('pending','failed','expired') AND "logIndex" IS NULL AND "confirmedAt" IS NULL)), CONSTRAINT billing_peer_intent_pk PRIMARY KEY(id))`);
		await q.query(`CREATE UNIQUE INDEX billing_peer_intent_request_key ON billing_peer_intent ("senderUserId", "requestKey")`);
		await q.query(`CREATE UNIQUE INDEX billing_peer_intent_event_key ON billing_peer_intent ("chainId", "txHash", "logIndex") WHERE status = 'confirmed'`);
		await q.query(`ALTER TABLE billing_peer_intent ADD CONSTRAINT billing_peer_intent_sender_fk FOREIGN KEY ("senderUserId") REFERENCES "user"(id) ON DELETE SET NULL ON UPDATE NO ACTION`);
		await q.query(`ALTER TABLE billing_peer_intent ADD CONSTRAINT billing_peer_intent_recipient_fk FOREIGN KEY ("recipientUserId") REFERENCES "user"(id) ON DELETE SET NULL ON UPDATE NO ACTION`);
	}
	async down(q) {
		await q.query('DROP TABLE billing_peer_intent');
		await q.query('DROP TABLE billing_peer_token');
		await q.query('ALTER TABLE billing_wallet DROP COLUMN "isPublicForPayments"');
	}
}
