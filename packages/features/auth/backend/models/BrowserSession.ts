/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, PrimaryColumn, Index, Column, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '@features/persistence/backend/models/util/id.js';
import { MiUser } from '@features/users/backend/models/User.js';

/** Browser credentials are separate from OAuth authorization handshakes. */
@Entity('browser_session')
export class MiBrowserSession {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_browser_session' })
	public id: string;

	@Index('IDX_browser_session_userId')
	@Column(id())
	public userId: MiUser['id'];

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_browser_session_userId' })
	public user: MiUser | null;

	@Index('IDX_browser_session_tokenHash', { unique: true })
	@Column('varchar', { length: 64, select: false })
	public tokenHash: string;

	@Column('timestamp with time zone')
	public createdAt: Date;

	@Column('timestamp with time zone')
	public lastUsedAt: Date;

	@Column('timestamp with time zone', { nullable: true })
	public revokedAt: Date | null;

	/** Absolute five-minute elevation expiry; ordinary issuance never grants it. */
	@Column('timestamp with time zone', { nullable: true })
	public sudoUntil: Date | null;

	@Column('varchar', { length: 43, nullable: true, select: false })
	public sudoGrantId: string | null;

	@Column('varchar', { length: 64, nullable: true, select: false })
	public sudoPolicyStamp: string | null;
}
