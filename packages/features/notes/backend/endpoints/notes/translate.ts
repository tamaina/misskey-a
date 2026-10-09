/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { URLSearchParams } from 'node:url';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { MiMeta } from '@features/persistence/backend/repositories/models.js';
import * as v from 'valibot';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { apiError } from "@features/api/backend/transport/orpc-error.js";
import { readErrorId } from '../../request.schema.js';
import { notesTranslateContract, notesTranslateErrors } from './translate.contract.js';
import type { MiLocalUser } from "@features/users/backend/models/User.js";

export interface NotesTranslateDependencies {
	serverSettings: MiMeta;
	noteEntityService: Pick<NoteEntityService, 'isVisibleForMe' | 'pack'>;
	getterService: Pick<GetterService, 'getNote'>;
	httpRequestService: Pick<HttpRequestService, 'send'>;
	roleService: Pick<RoleService, 'getUserPolicies'>;
}
export function createNotesTranslateProcedure(deps: NotesTranslateDependencies) {
	return createApiProcedure<MiLocalUser>()(notesTranslateContract).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;

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
			})();
			return result === undefined ? undefined : { sourceLang: result.sourceLang, text: result.text };
		});
}
