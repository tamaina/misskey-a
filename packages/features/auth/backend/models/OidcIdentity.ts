/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { id } from '@features/persistence/backend/models/util/id.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiOidcProvider } from './OidcProvider.js';

@Index('UQ_oidc_identity_issuer_subject', ['issuer', 'subject'], { unique: true })
@Index('UQ_oidc_identity_user_provider', ['userId', 'providerId'], { unique: true })
@Entity('oidc_identity')
export class MiOidcIdentity {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_oidc_identity' })
	public id: string;

	@Column(id())
	public userId: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_oidc_identity_user' })
	public user: MiUser;

	@Column(id())
	public providerId: string;

	@ManyToOne(() => MiOidcProvider, { onDelete: 'RESTRICT' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_oidc_identity_provider' })
	public provider: MiOidcProvider;

	@Column('varchar', { length: 2048 })
	public issuer: string;

	@Column('varchar', { length: 255 })
	public subject: string;

	@Column('timestamp with time zone')
	public createdAt: Date;
}
