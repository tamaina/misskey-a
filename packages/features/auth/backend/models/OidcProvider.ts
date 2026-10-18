/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { id } from '@features/persistence/backend/models/util/id.js';

@Entity('oidc_provider')
export class MiOidcProvider {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_oidc_provider' })
	public id: string;

	@Column('varchar', { length: 100 })
	public name: string;

	@Column('varchar', { length: 43 })
	public version: string;

	@Column('boolean', { default: false })
	public enabled: boolean;

	@Column('varchar', { length: 2048, default: '' })
	public issuer: string;

	@Column('varchar', { length: 2048, default: '' })
	public clientId: string;

	@Column('text', { nullable: true, select: false })
	public clientSecret: string | null;
}
