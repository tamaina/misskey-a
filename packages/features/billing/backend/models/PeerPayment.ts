/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { id } from '@features/persistence/backend/models/util/id.js';
import type { PeerToken } from '../peer.contract.js';
const integer = { type: 'bigint' as const, transformer: { to: (value: number | null) => value, from: (value: string | null) => value === null ? null : Number(value) } };
@Entity('billing_peer_token')
export class MiPeerPaymentToken {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'billing_peer_token_pk' }) public id: string;
	@Column('jsonb') public terms: PeerToken;
}
@Entity('billing_peer_intent')
@Index('billing_peer_intent_request_key', ['senderUserId', 'requestKey'], { unique: true })
@Index('billing_peer_intent_event_key', ['chainId', 'txHash', 'logIndex'], { unique: true, where: '"status" = \'confirmed\'' })
@Check('billing_peer_intent_confirmation_check', '(\"status\" = \'confirmed\' AND \"txHash\" IS NOT NULL AND \"logIndex\" IS NOT NULL AND \"confirmedAt\" IS NOT NULL) OR (\"status\" IN (\'pending\',\'failed\',\'expired\') AND \"logIndex\" IS NULL AND \"confirmedAt\" IS NULL)')
export class MiPeerPaymentIntent {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'billing_peer_intent_pk' }) public id: string;
	@Column({ ...id(), nullable: true }) public senderUserId: string | null;
	@ManyToOne(() => MiUser, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'senderUserId', foreignKeyConstraintName: 'billing_peer_intent_sender_fk' }) public sender: MiUser | null;
	@Column({ ...id(), nullable: true }) public recipientUserId: string | null;
	@ManyToOne(() => MiUser, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'recipientUserId', foreignKeyConstraintName: 'billing_peer_intent_recipient_fk' }) public recipient: MiUser | null;
	@Column('varchar', { length: 128 }) public requestKey: string;
	@Column('jsonb') public terms: { token: PeerToken; senderWalletId: string; recipientWalletId: string; fromAddress: string; toAddress: string; amountBaseUnits: string };
	@Column(integer) public chainId: number;
	@Column(integer) public createdAt: number;
	@Column(integer) public expiresAt: number;
	@Column('varchar', { length: 16, default: 'pending' }) public status: 'pending' | 'confirmed' | 'failed' | 'expired';
	@Column('varchar', { length: 66, nullable: true }) public txHash: string | null;
	@Column({ ...integer, nullable: true }) public logIndex: number | null;
	@Column({ ...integer, nullable: true }) public confirmedAt: number | null;
	/** One browser broadcast attempt; unknown outcomes must recover by hash, never resend. */
	@Column({ ...integer, nullable: true }) public broadcastStartedAt: number | null;
}
