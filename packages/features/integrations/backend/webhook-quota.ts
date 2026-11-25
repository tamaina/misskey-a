/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { IsNull, LessThanOrEqual } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiWebhook } from './models/Webhook.js';

/**
 * Serialises the owner's webhook quota for the rest of the transaction, reclaims MCP rows that can never deliver
 * again (unsubscribed tombstones, expired) and returns the remaining legacy + live MCP count.
 * Deleting is generation-safe: deliveries must match the stored mcpGeneration and a re-created MCP row always gets a fresh random one.
 */
export async function lockWebhookQuota(manager: EntityManager, userId: string): Promise<number> {
	await manager.getRepository(MiUser).createQueryBuilder('user').where('user.id = :userId', { userId }).setLock('pessimistic_write').getOneOrFail();
	const repository = manager.getRepository(MiWebhook);
	const dead = await repository.find({ select: { id: true }, where: [{ userId, mode: 'mcp', active: false }, { userId, mode: 'mcp', mcpExpiresAt: IsNull() }, { userId, mode: 'mcp', mcpExpiresAt: LessThanOrEqual(new Date()) }] });
	if (dead.length > 0) await repository.delete(dead.map(row => row.id));
	return repository.countBy({ userId });
}
