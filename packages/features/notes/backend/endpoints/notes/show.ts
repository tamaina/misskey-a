/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { MiMeta } from '@features/instance/backend/models/Meta.js';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../request.schema.js';
import { notesShowContract, notesShowPolicy, notesShowErrors } from './show.contract.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { NotesApiContext } from '../../operations.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';

export function createNotesShowProcedure<Actor extends ApiActor>() {
	return implement(notesShowContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(notesShowPolicy))
		.handler(({ input, context }) => context.operations.notes.notesShow(input, context.principal));
}

@Injectable()
export class NotesShowOperation {
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		private noteEntityService: NoteEntityService,
		private getterService: GetterService,
	) {}
	async execute(ps: InferSchemaOutput<NonNullable<typeof notesShowContract['~orpc']['inputSchema']>>, me: MiLocalUser | null): Promise<InferSchemaOutput<NonNullable<typeof notesShowContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(notesShowContract['~orpc'].outputSchema), await this.run(ps, me));
	}

	private async run(ps: InferSchemaOutput<NonNullable<typeof notesShowContract['~orpc']['inputSchema']>>, me: MiLocalUser | null) {
		const note = await this.getterService.getNoteWithRelations(ps.noteId).catch((err: unknown) => {
			if (readErrorId(err) === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(notesShowErrors.noSuchNote);
			throw err;
		});

		if (note.user!.requireSigninToViewContents && me == null) {
			throw apiError(notesShowErrors.contentRestrictedByUser);
		}

		if (this.serverSettings.ugcVisibilityForVisitor === 'none' && me == null) {
			throw apiError(notesShowErrors.contentRestrictedByServer);
		}

		if (this.serverSettings.ugcVisibilityForVisitor === 'local' && note.userHost != null && me == null) {
			throw apiError(notesShowErrors.contentRestrictedByServer);
		}

		return await this.noteEntityService.pack(note, me, {
			detail: true,
		});
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
