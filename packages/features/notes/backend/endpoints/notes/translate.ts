/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { URLSearchParams } from 'node:url';
import { implement } from '@orpc/server';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { MiMeta } from '@features/persistence/backend/repositories/models.js';
import * as v from 'valibot';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../request.schema.js';
import { notesTranslateContract, notesTranslatePolicy, notesTranslateErrors } from './translate.contract.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface NotesTranslateDependencies {
	serverSettings: MiMeta;
	noteEntityService: Pick<NoteEntityService, 'isVisibleForMe' | 'pack'>;
	getterService: Pick<GetterService, 'getNote'>;
	httpRequestService: Pick<HttpRequestService, 'send'>;
	roleService: Pick<RoleService, 'getUserPolicies'>;
}
export function createNotesTranslateProcedure(deps: NotesTranslateDependencies) {
	return implement(notesTranslateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(notesTranslatePolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			return v.parse(requiredSchema(notesTranslateContract['~orpc'].outputSchema), await (async () => {
				const policies = await deps.roleService.getUserPolicies(me.id);
				if (!policies.canUseTranslator) {
					throw apiError(notesTranslateErrors.unavailable);
				}

				const note = await deps.getterService.getNote(ps.noteId).catch((err: unknown) => {
					if (readErrorId(err) === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(notesTranslateErrors.noSuchNote);
					throw err;
				});

				if (!(await deps.noteEntityService.isVisibleForMe(note, me.id))) {
					throw apiError(notesTranslateErrors.cannotTranslateInvisibleNote);
				}

				// makeNotesHiddenBefore などで中身が隠されるノート
				const packedNote = await deps.noteEntityService.pack(note, me);
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

				if (deps.serverSettings.deeplAuthKey == null) {
					throw apiError(notesTranslateErrors.unavailable);
				}

				let targetLang = ps.targetLang;
				if (targetLang.includes('-')) targetLang = targetLang.split('-')[0];

				const params = new URLSearchParams();
				params.append('text', text);
				params.append('target_lang', targetLang);

				const endpoint = deps.serverSettings.deeplIsPro ? 'https://api.deepl.com/v2/translate' : 'https://api-free.deepl.com/v2/translate';

				const res = await deps.httpRequestService.send(endpoint, {
					method: 'POST',
					headers: {
						'Authorization': `DeepL-Auth-Key ${deps.serverSettings.deeplAuthKey}`,
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
			})());
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
