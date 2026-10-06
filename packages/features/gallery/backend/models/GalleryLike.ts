/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from '@/models/util/id.js';
import { MiUser } from '../../../users/backend/models/User.js';
import { MiGalleryPost } from './GalleryPost.js';

@Entity('gallery_like')
@Index(['userId', 'postId'], { unique: true })
export class MiGalleryLike {
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
	public postId: MiGalleryPost['id'];

	@ManyToOne(() => MiGalleryPost, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public post: MiGalleryPost | null;
}
