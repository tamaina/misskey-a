/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { id } from '@features/persistence/backend/models/util/id.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiBrowserSession } from './BrowserSession.js';
/** Committed consent receipt; contains no bearer credential or native token. */
@Entity('oauth_approval')
export class MiOAuthApproval {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_oauth_approval' }) public id: string;
	@Column(id()) public userId: string;
	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_oauth_approval_user' }) public user: MiUser;
	@Column(id()) public sessionId: string;
	@ManyToOne(() => MiBrowserSession, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_oauth_approval_session' }) public session: MiBrowserSession;
	@Column('varchar', { length: 43 }) public sudoGrantId: string;
	@Column('varchar', { length: 64 }) public policyStamp: string;
	@Column('varchar', { length: 64 }) public grantStamp: string;
	@Index('IDX_oauth_approval_deadline')
	@Column('timestamp with time zone') public deadline: Date;
}
