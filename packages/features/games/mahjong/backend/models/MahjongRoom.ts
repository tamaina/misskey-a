/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { id } from '@features/persistence/backend/models/util/id.js';
import type { RoomState } from '../room.js';

@Entity('mahjong_room')
export class MiMahjongRoom {
	@PrimaryColumn('uuid', { primaryKeyConstraintName: 'PK_mahjong_room' })
	public id: string;

	@Index('IDX_mahjong_room_owner')
	@Column(id())
	public ownerId: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_mahjong_room_owner' })
	public owner: MiUser | null;

	@Column('varchar', { array: true })
	public userIds: string[];

	@Column('timestamp with time zone')
	public createdAt: Date;

	@Column('timestamp with time zone')
	public updatedAt: Date;

	@Column('varchar', { length: 16 })
	public status: RoomState['status'];

	/** Contains private walls and actions. Never serialize this entity into an API response. */
	@Column('jsonb')
	public state: RoomState;
}
