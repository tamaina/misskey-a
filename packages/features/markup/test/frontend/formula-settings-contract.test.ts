/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import * as v from 'valibot';
import { updateMetaContract } from '../../../instance/backend/endpoints/admin/update-meta.contract.js';
import { packedMetaClientOptionsSchema } from '../../../instance/backend/endpoints/meta.schema.js';
import { isLatexEnabled } from '../../frontend/shared/formula-safety.js';

test('existing admin-only metadata transport retains the formula option and unrelated client options', () => {
	const contract = updateMetaContract['~orpc'];
	expect(contract.meta).toMatchObject({ requireCredential: true, requireAdmin: true, kind: 'write:admin:meta' });
	if (!contract.inputSchema) throw new Error('Missing metadata input schema');
	for (const latexEnabled of [true, false]) {
		const clientOptions = { latexEnabled, showTimelineForVisitor: false, unrelated: { keep: true } };
		expect(v.parse(contract.inputSchema, { clientOptions })).toEqual({ clientOptions });
		const publicOptions = v.parse(packedMetaClientOptionsSchema, clientOptions);
		expect(publicOptions).toEqual(clientOptions);
		expect(isLatexEnabled(publicOptions)).toBe(latexEnabled);
	}
});
