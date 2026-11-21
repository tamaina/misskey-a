/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import { initializeRoleFormula } from '../../frontend/pages/admin/role-formula-editor.js';
import type { EditableRoleFormula } from '../../frontend/pages/admin/role-formula-editor.js';

test('stored empty formulas get the existing new-role editing default without changing stored data', () => {
	const stored = {};
	const createId = vi.fn(() => 'editing123');
	expect(initializeRoleFormula(stored, createId)).toEqual({ id: 'editing123', type: 'isRemote' });
	expect(createId).toHaveBeenCalledOnce();
	expect(stored).toEqual({});
});

test('complete recursive formulas keep their ids and values and edit independently of stored data', () => {
	const stored: EditableRoleFormula = {
		id: 'root123', type: 'and', values: [
			{ id: 'not123', type: 'not', value: { id: 'age123', type: 'createdMoreThan', sec: 60 } },
		],
	};
	const createId = vi.fn(() => 'unused');
	const editable = initializeRoleFormula(stored, createId);
	expect(editable).toEqual(stored);
	expect(createId).not.toHaveBeenCalled();
	if (editable.type !== 'and') throw new Error('Expected the original conjunction');
	editable.values.push({ id: 'local123', type: 'isLocal' });
	expect(stored.values).toHaveLength(1);
});
