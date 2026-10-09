/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { implement } from '@orpc/server';
import { Injectable } from '@nestjs/common';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import * as v from 'valibot';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { notesShowPartialBulkContract, notesShowPartialBulkPolicy } from './show-partial-bulk.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { NotesApiContext } from '../../operations.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';

export function createNotesShowPartialBulkProcedure<Actor extends ApiActor>() {
	return implement(notesShowPartialBulkContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(notesShowPartialBulkPolicy))
		.handler(({ input, context }) => context.operations.notes.notesShowPartialBulk(input, context.principal));
}

@Injectable()
export class NotesShowPartialBulkOperation {
	constructor(
		private noteEntityService: NoteEntityService,
	) {}
	async execute(ps: InferSchemaOutput<NonNullable<typeof notesShowPartialBulkContract['~orpc']['inputSchema']>>, me: MiLocalUser | null): Promise<InferSchemaOutput<NonNullable<typeof notesShowPartialBulkContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(notesShowPartialBulkContract['~orpc'].outputSchema), await this.run(ps, me));
	}

	private async run(ps: InferSchemaOutput<NonNullable<typeof notesShowPartialBulkContract['~orpc']['inputSchema']>>, me: MiLocalUser | null) {
		return await this.noteEntityService.fetchDiffs(ps.noteIds, me?.id ?? null);
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
