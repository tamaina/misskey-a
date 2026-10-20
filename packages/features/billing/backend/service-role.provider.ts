/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { DataSource } from 'typeorm';

/** Paid term and role entitlement are one row/commit; no manual assignment is overwritten. */
export async function activePaidRoleIds(db: Pick<DataSource, 'query'>, userId: string, now: number): Promise<string[]> {
	const rows: { roleId: string }[] = await db.query(`SELECT DISTINCT term.offer->>'roleId' AS "roleId"
		FROM billing_service_order term JOIN role ON role.id = term.offer->>'roleId'
		WHERE NOT EXISTS (SELECT 1 FROM billing_account_state WHERE "userId" = $1) AND term."userId" = $1 AND term.status = 'paid' AND term."startsAt" <= $2 AND term."endsAt" > $2
		AND role.target = 'manual' AND role."isAdministrator" = false AND role."isModerator" = false
		UNION SELECT DISTINCT item->'offer'->>'roleId' AS "roleId" FROM billing_account_state state JOIN "user" account ON account.id = state."userId",
		LATERAL jsonb_array_elements(state.data->'terms') item JOIN role ON role.id = item->'offer'->>'roleId'
		WHERE state."userId" = $1 AND (item->>'startsAt')::bigint <= $2 AND (item->>'expiresAt')::bigint > $2
		AND role.target = 'manual' AND role."isAdministrator" = false AND role."isModerator" = false`, [userId, now]);
	return rows.map(row => row.roleId);
}

@Injectable()
export class ServiceBillingRoleProvider {
	constructor(private readonly moduleRef: ModuleRef) { }
	/** Fresh reads preserve start/expiry boundaries and revocation without cache invalidation races. */
	roleIds(userId: string) { return activePaidRoleIds(this.moduleRef.get<DataSource>(DI.db, { strict: false }), userId, Date.now()); }
}
