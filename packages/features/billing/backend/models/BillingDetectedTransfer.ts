/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { id } from '@features/persistence/backend/models/util/id.js';
const integer = { type: 'bigint' as const, transformer: { to: (value: number) => value, from: (value: string) => Number(value) } };
@Entity('billing_detected_transfer')
@Index('billing_detected_transfer_event_key', ['chainId', 'txHash', 'logIndex'], { unique: true })
export class MiBillingDetectedTransfer {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'billing_detected_transfer_pk' }) public id: string;
	@Column(integer) public chainId: number;
	@Column('varchar', { length: 66 }) public txHash: string;
	@Column(integer) public logIndex: number;
	@Column('varchar', { length: 42 }) public contractAddress: string;
	@Column('varchar', { length: 42 }) public fromAddress: string;
	@Column('varchar', { length: 42 }) public toAddress: string;
	@Column('varchar', { length: 78 }) public amountBaseUnits: string;
	@Column({ ...id(), nullable: true }) public senderUserId: string | null;
	@ManyToOne(() => MiUser, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'senderUserId', foreignKeyConstraintName: 'billing_detected_transfer_sender_fk' }) public sender: MiUser | null;
	@Column({ ...id(), nullable: true }) public recipientUserId: string | null;
	@ManyToOne(() => MiUser, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'recipientUserId', foreignKeyConstraintName: 'billing_detected_transfer_recipient_fk' }) public recipient: MiUser | null;
	@Column(integer) public observedAt: number;
}
