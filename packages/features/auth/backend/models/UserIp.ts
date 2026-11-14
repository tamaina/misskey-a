/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '@features/persistence/backend/models/util/id.js';
import type { MiUser } from '@features/users/backend/models/User.js';

import { MiBrowserSession } from './BrowserSession.js';

@Entity('user_ip')
// Expression index is managed by the migration (including the NULL session bucket).
@Index('IDX_user_ip_session_unique', { synchronize: false })
export class MiUserIp {
	@PrimaryGeneratedColumn()
	public id: string;

	@Column('timestamp with time zone', {
	})
	public createdAt: Date;

	@Column('timestamp with time zone')
	public lastSeenAt: Date;

	@Index('IDX_user_ip_browserSessionId')
	@Column({ ...id(), nullable: true })
	public browserSessionId: MiBrowserSession['id'] | null;

	@ManyToOne(() => MiBrowserSession, { onDelete: 'SET NULL', nullable: true })
	@JoinColumn({ name: 'browserSessionId', foreignKeyConstraintName: 'FK_user_ip_browserSessionId' })
	public browserSession: MiBrowserSession | null;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@Column('varchar', {
		length: 128,
	})
	public ip: string;
}
