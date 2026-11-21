/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as Misskey from 'misskey-js';
import { deepClone } from '@features/runtime/frontend/utility/clone.js';

export type EditableRoleFormula = Exclude<Misskey.entities.Role['condFormula'], Record<string, never>>;

function hasFormula(value: Misskey.entities.Role['condFormula']): value is EditableRoleFormula {
	return typeof value.id === 'string' && typeof value.type === 'string';
}

/** Stored empty formulas begin editing with the same default as newly created roles. */
export function initializeRoleFormula(value: Misskey.entities.Role['condFormula'], createId: () => string): EditableRoleFormula {
	return hasFormula(value) ? deepClone(value) : { id: createId(), type: 'isRemote' };
}
