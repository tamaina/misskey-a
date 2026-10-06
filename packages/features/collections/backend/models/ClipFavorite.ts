/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from '@/models/util/id.js';
import { MiUser } from '../../../users/backend/models/User.js';
import { MiClip } from './Clip.js';

@Entity('clip_favorite')
@Index(['userId', 'clipId'], { unique: true })
export class MiClipFavorite {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column(id())
	public clipId: MiClip['id'];

	@ManyToOne(() => MiClip, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public clip: MiClip | null;
}
