/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import { URLSearchParams } from 'node:url';
import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { MiMeta } from '@features/persistence/backend/repositories/models.js';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../request.schema.js';
import { notesTranslateContract, notesTranslatePolicy, notesTranslateErrors } from './translate.contract.js';
import type { NotesApiContext } from '../../operations.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';

export function createNotesTranslateProcedure<Actor extends ApiActor>() {
	return implement(notesTranslateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(notesTranslatePolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.notes.notesTranslate(input, context.principal));
}

@Injectable()
export class NotesTranslateOperation {
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		private noteEntityService: NoteEntityService,
		private getterService: GetterService,
		private httpRequestService: HttpRequestService,
		private roleService: RoleService,
	) {}
	async execute(ps: InferSchemaOutput<NonNullable<typeof notesTranslateContract['~orpc']['inputSchema']>>, me: MiLocalUser): Promise<InferSchemaOutput<NonNullable<typeof notesTranslateContract['~orpc']['outputSchema']>>> {
		return v.parse(requiredSchema(notesTranslateContract['~orpc'].outputSchema), await this.run(ps, me));
	}

	private async run(ps: InferSchemaOutput<NonNullable<typeof notesTranslateContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const policies = await this.roleService.getUserPolicies(me.id);
		if (!policies.canUseTranslator) {
			throw apiError(notesTranslateErrors.unavailable);
		}

		const note = await this.getterService.getNote(ps.noteId).catch((err: unknown) => {
			if (readErrorId(err) === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(notesTranslateErrors.noSuchNote);
			throw err;
		});

		if (!(await this.noteEntityService.isVisibleForMe(note, me.id))) {
			throw apiError(notesTranslateErrors.cannotTranslateInvisibleNote);
		}

		// makeNotesHiddenBefore などで中身が隠されるノート
		const packedNote = await this.noteEntityService.pack(note, me);
		if (packedNote.isHidden) {
			throw apiError(notesTranslateErrors.cannotTranslateInvisibleNote);
		}

		let text = note.text ?? '';
		if (note.cw != null) {
			text = `${note.cw}\n-----\n${text}`;
		}

		if (text.trim() === '') {
			return;
		}

		if (this.serverSettings.deeplAuthKey == null) {
			throw apiError(notesTranslateErrors.unavailable);
		}

		let targetLang = ps.targetLang;
		if (targetLang.includes('-')) targetLang = targetLang.split('-')[0];

		const params = new URLSearchParams();
		params.append('text', text);
		params.append('target_lang', targetLang);

		const endpoint = this.serverSettings.deeplIsPro ? 'https://api.deepl.com/v2/translate' : 'https://api-free.deepl.com/v2/translate';

		const res = await this.httpRequestService.send(endpoint, {
			method: 'POST',
			headers: {
				'Authorization': `DeepL-Auth-Key ${this.serverSettings.deeplAuthKey}`,
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json, */*',
			},
			body: params.toString(),
		});

		const json = v.parse(v.object({ translations: v.pipe(v.array(v.object({ detected_source_language: v.string(), text: v.string() })), v.minLength(1)) }), await res.json());

		return {
			sourceLang: json.translations[0].detected_source_language,
			text: json.translations[0].text,
		};
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
