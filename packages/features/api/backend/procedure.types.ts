/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { featureProcedure } from './procedure.js';

// Type-only regression fixtures; this branch never executes.
if (false) {
	const contract = oc.input(v.object({ id: v.string() })).output(v.number());
	const bind = featureProcedure<{ actor: { id: string } }>();
	const procedure = bind(contract, ({ input, context }) => input.id.length + context.actor.id.length);
	void procedure({ id: 'x' }, { context: { actor: { id: 'y' } } });
	// @ts-expect-error Input comes from the contract.
	void procedure({ id: 123 }, { context: { actor: { id: 'y' } } });
	// @ts-expect-error Context is required and checked.
	void procedure({ id: 'x' }, { context: {} });
	// @ts-expect-error Handler output must match the contract.
	bind(contract, () => 'wrong');
}
