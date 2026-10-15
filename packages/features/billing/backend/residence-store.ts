/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ORPCError } from '@orpc/server';
import * as v from 'valibot';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiBillingPolicy } from './models/BillingPolicy.js';
import { declaredResidence, declaredResidenceInput } from './residence.schema.js';
import type { DataSource, EntityManager } from 'typeorm';
import type { DeclaredResidence } from './residence.schema.js';
export const RESIDENCE_REQUIRED = 'RESIDENCE_REQUIRED';
export function readyResidence(value: unknown, required: readonly string[]): DeclaredResidence | null {
	const result = v.safeParse(declaredResidence, value);
	return result.success && (!required.includes(result.output.country) || result.output.subdivision !== null) ? result.output : null;
}
export async function residenceRequirements(manager: EntityManager) { return (await manager.findOneBy(MiBillingPolicy, { id: 'server' }))?.policy.residenceRequiredSubdivisions ?? []; }
/** Shared new-start guard. Does not infer residence or imply verified tax location. */
export async function requireDeclaredResidence(manager: EntityManager, userId: string): Promise<DeclaredResidence> {
	await manager.query('SELECT pg_advisory_xact_lock(hashtextextended(\'billing-policy\', 0))');
	const row = await manager.getRepository(MiUserProfile).findOne({ where: { userId }, select: { userId: true, billingResidence: true } });
	const residence = readyResidence(row?.billingResidence, await residenceRequirements(manager));
	if (!residence) throw new ORPCError(RESIDENCE_REQUIRED);
	return residence;
}
export function createResidenceStore(db: DataSource, now = Date.now) {
	return {
		async get(userId: string) {
			const row = await db.manager.getRepository(MiUserProfile).findOne({ where: { userId }, select: { userId: true, billingResidence: true } }), requiredSubdivisions = await residenceRequirements(db.manager);
			const stored = v.safeParse(declaredResidence, row?.billingResidence);
			return { residence: stored.success ? stored.output : null, requiredSubdivisions, isReady: readyResidence(row?.billingResidence, requiredSubdivisions) !== null };
		},
		async save(userId: string, input: { revision: number; residence: v.InferOutput<typeof declaredResidenceInput> }) {
			return db.transaction(async manager => {
				await manager.query('SELECT pg_advisory_xact_lock(hashtextextended(\'billing-policy\', 0))');
				const row = await manager.getRepository(MiUserProfile).findOne({ where: { userId }, select: { userId: true, billingResidence: true }, lock: { mode: 'pessimistic_write' } });
				if (!row) throw new ORPCError(RESIDENCE_REQUIRED);
				if ((row.billingResidence?.revision ?? 0) !== input.revision || input.revision >= 2147483647) throw new ORPCError('RESIDENCE_CONFLICT');
				const residence = v.parse(declaredResidence, { ...v.parse(declaredResidenceInput, input.residence), revision: input.revision + 1, declaredAt: now(), kind: 'self_declared' });
				if (!readyResidence(residence, await residenceRequirements(manager))) throw new ORPCError(RESIDENCE_REQUIRED);
				await manager.update(MiUserProfile, { userId }, { billingResidence: residence });
				return residence;
			});
		},
		require: (userId: string) => db.transaction(manager => requireDeclaredResidence(manager, userId)),
	};
}
