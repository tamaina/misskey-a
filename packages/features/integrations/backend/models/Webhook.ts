/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from '@features/persistence/backend/models/util/id.js';
import { MiAccessToken } from '@features/auth/backend/models/AccessToken.js';
import { MiAntenna } from '@features/timelines/backend/models/Antenna.js';
import { MiUser } from '@features/users/backend/models/User.js';
import { webhookEventTypes } from '../webhook-events.schema.js';
import type { WebhookEventTypes } from '../webhook-events.schema.js';

export { webhookEventTypes } from '../webhook-events.schema.js';
export type { WebhookEventTypes } from '../webhook-events.schema.js';

@Entity('webhook')
export class MiWebhook {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'The owner ID.',
	})
	public userId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column('varchar', {
		length: 128,
		comment: 'The name of the Antenna.',
	})
	public name: string;

	@Index()
	@Column('varchar', {
		length: 128, array: true, default: '{}',
	})
	public on: (typeof webhookEventTypes)[number][];

	@Column('varchar', {
		length: 1024,
	})
	public url: string;

	@Column('varchar', {
		length: 1024,
	})
	public secret: string;

	@Index()
	@Column('boolean', {
		default: true,
	})
	public active: boolean;

	@Column('varchar', { length: 16, default: 'legacy' })
	public mode: 'legacy' | 'mcp';

	@Index('IDX_webhook_mcpTokenId')
	@Column({ ...id(), nullable: true })
	public mcpTokenId: string | null;

	@ManyToOne(() => MiAccessToken, { onDelete: 'CASCADE', nullable: true })
	@JoinColumn({ name: 'mcpTokenId', foreignKeyConstraintName: 'FK_webhook_mcpTokenId' })
	public mcpToken: MiAccessToken | null;

	@Index('IDX_webhook_mcpAntennaId')
	@Column({ ...id(), nullable: true })
	public mcpAntennaId: string | null;

	@ManyToOne(() => MiAntenna, { onDelete: 'CASCADE', nullable: true })
	@JoinColumn({ name: 'mcpAntennaId', foreignKeyConstraintName: 'FK_webhook_mcpAntennaId' })
	public mcpAntenna: MiAntenna | null;

	@Column('timestamp with time zone', { nullable: true })
	public mcpExpiresAt: Date | null;

	/** Changes after lapse or unsubscribe so old queued events cannot revive. */
	@Column('uuid', { nullable: true })
	public mcpGeneration: string | null;

	@Column('varchar', { length: 1024, nullable: true, select: false })
	public mcpPreviousSecret: string | null;

	@Column('timestamp with time zone', { nullable: true })
	public mcpPreviousSecretUntil: Date | null;

	/**
	 * 直近のリクエスト送信日時
	 */
	@Column('timestamp with time zone', {
		nullable: true,
	})
	public latestSentAt: Date | null;

	/**
	 * 直近のリクエスト送信時のHTTPステータスコード
	 */
	@Column('integer', {
		nullable: true,
	})
	public latestStatus: number | null;
}
