/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferOutput } from 'valibot';
import type { packedRolePoliciesSchema } from '../../../users/backend/user-related.schema.js';

/** Portable endpoint declarations; enforcement remains in server middleware. */
export interface ApiProcedureMetadata {
	requestName: string;
	requireCredential?: boolean;
	requiredRolePolicy?: keyof InferOutput<typeof packedRolePoliciesSchema>;
	kind?: string;
}
