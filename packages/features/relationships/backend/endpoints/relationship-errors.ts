/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { RelationshipsDependencies } from '../api.implementation.js';
export function hasErrorId(error: unknown, id: string): boolean {
	return error !== null && typeof error === 'object' && 'id' in error && error.id === id;
}
export async function getRelationshipUser(getter: RelationshipsDependencies['getterService'], userId: string, error: {
	message: string;
	code: string;
	id: string;
}) {
	try {
		return await getter.getUser(userId);
	} catch (failure) {
		if (hasErrorId(failure, '15348ddd-432d-49c2-8a5a-8069753becff')) throw apiError(error);
		throw failure;
	}
}
