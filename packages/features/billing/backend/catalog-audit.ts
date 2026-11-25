/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { EntityManager } from 'typeorm';
export async function recordCatalogAudit(manager: EntityManager, actorId: string, id: string, action: string, resourceId: string, before: unknown, after: unknown) {
	await manager.query('INSERT INTO moderation_log (id, "userId", type, info) VALUES ($1, $2, $3, $4::jsonb)', [id, actorId, 'billingCatalog', JSON.stringify({ action, resourceId, before, after })]);
}
