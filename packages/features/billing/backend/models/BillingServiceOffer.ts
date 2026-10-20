/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { id } from '@features/persistence/backend/models/util/id.js';
import type { ServiceOffer } from '../api.definition.js';

@Entity('billing_service_offer')
export class MiBillingServiceOffer {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'billing_service_offer_pk' }) public id: string;
	@Column('jsonb') public terms: ServiceOffer;
	@Column('timestamp with time zone') public updatedAt: Date;
	@Column({ ...id(), nullable: true }) public updatedByUserId: string | null;
	@ManyToOne(() => MiUser, { onDelete: 'SET NULL' })
	@JoinColumn({ name: 'updatedByUserId', foreignKeyConstraintName: 'billing_service_offer_actor_fk' }) public updatedByUser: MiUser | null;
}
