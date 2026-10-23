/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
import { toPackedNote } from '@features/notes/backend/note.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import { apShowContract, apShowErrors } from './show.contract.js';
import type { MiNote } from '../../../../notes/backend/models/Note.js';
import type { MiUser } from '../../../../users/backend/models/User.js';
import { isActor, isPost, getApId } from '../../protocol/type.js';
import type { ApResolverService } from '../../services/ApResolverService.js';
import type { ApDbResolverService } from '../../services/ApDbResolverService.js';
import type { ApPersonService } from '../../services/ApPersonService.js';
import type { ApNoteService } from '../../services/ApNoteService.js';
import type { UserEntityService } from '../../../../users/backend/serializers/UserEntityService.js';
import type { NoteEntityService } from '../../../../notes/backend/serializers/NoteEntityService.js';
import type { UtilityService } from '../../services/UtilityService.js';
import { IdentifiableError } from '../../../../runtime/backend/errors/identifiable-error.js';
import { FetchAllowSoftFailMask } from '../../protocol/misc/check-against-url.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import type { ApShowOutput } from './show.contract.js';
export interface ApShowDependencies {
	utilityService: Pick<UtilityService, 'isFederationAllowedUri' | 'extractDbHost' | 'isSelfHost'>;
	userEntityService: Pick<UserEntityService, 'pack'>;
	noteEntityService: Pick<NoteEntityService, 'pack'>;
	apResolverService: Pick<ApResolverService, 'createResolver'>;
	apDbResolverService: Pick<ApDbResolverService, 'getUserFromApId' | 'getNoteFromApId'>;
	apPersonService: Pick<ApPersonService, 'createPerson'>;
	apNoteService: Pick<ApNoteService, 'createNote'>;
}
export function createApShowProcedure<Actor extends ApiActor>(deps: ApShowDependencies) {
	async function fetchAny(uri: string, me: { id: MiUser['id'] } | null | undefined): Promise<ApShowOutput | null> {
		if (!deps.utilityService.isFederationAllowedUri(uri)) {
			throw apiError(apShowErrors.federationNotAllowed);
		}
		let local = await mergePack(me, ...await Promise.all([
			deps.apDbResolverService.getUserFromApId(uri),
			deps.apDbResolverService.getNoteFromApId(uri),
		]));
		if (local != null) return local;
		const host = deps.utilityService.extractDbHost(uri);
		// local object, not found in db? fail
		if (deps.utilityService.isSelfHost(host)) return null;
		// リモートから一旦オブジェクトフェッチ
		const resolver = await deps.apResolverService.createResolver();
		// allow ap/show exclusively to lookup URLs that are cross-origin or non-canonical (like https://alice.example.com/@bob@bob.example.com -> https://bob.example.com/@bob)
		const object = await resolver.resolve(uri, FetchAllowSoftFailMask.CrossOrigin | FetchAllowSoftFailMask.NonCanonicalId).catch((err) => {
			if (err instanceof IdentifiableError) {
				switch (err.id) {
					// resolve
					case 'b94fd5b1-0e3b-4678-9df2-dad4cd515ab2':
						throw apiError(apShowErrors.uriInvalid);
					case '0dc86cf6-7cd6-4e56-b1e6-5903d62d7ea5':
					case 'd592da9f-822f-4d91-83d7-4ceefabcf3d2':
						throw apiError(apShowErrors.requestFailed);
					case '09d79f9e-64f1-4316-9cfa-e75c4d091574':
						throw apiError(apShowErrors.federationNotAllowed);
					case '72180409-793c-4973-868e-5a118eb5519b':
						throw apiError(apShowErrors.responseInvalid);
					// resolveLocal
					case '02b40cd0-fa92-4b0c-acc9-fb2ada952ab8':
						throw apiError(apShowErrors.uriInvalid);
					case 'a9d946e5-d276-47f8-95fb-f04230289bb0':
					case '06ae3170-1796-4d93-a697-2611ea6d83b6':
						throw apiError(apShowErrors.noSuchObject);
					case '7a5d2fc0-94bc-4db6-b8b8-1bf24a2e23d0':
						throw apiError(apShowErrors.responseInvalid);
				}
			}
			throw apiError(apShowErrors.requestFailed);
		});
		if (object.id == null) {
			throw apiError(apShowErrors.responseInvalid);
		}
		// /@user のような正規id以外で取得できるURIが指定されていた場合、ここで初めて正規URIが確定する
		// これはDBに存在する可能性があるため再度DB検索
		if (uri !== object.id) {
			local = await mergePack(me, ...await Promise.all([
				deps.apDbResolverService.getUserFromApId(object.id),
				deps.apDbResolverService.getNoteFromApId(object.id),
			]));
			if (local != null) return local;
		}
		// 同一ユーザーの情報を再度処理するので、使用済みのresolverを再利用してはいけない
		return await mergePack(
			me,
			isActor(object) ? await deps.apPersonService.createPerson(getApId(object)) : null,
			isPost(object) ? await deps.apNoteService.createNote(getApId(object), undefined, undefined, true) : null,
		);
	}

	async function mergePack(me: { id: MiUser['id'] } | null | undefined, user: MiUser | null | undefined, note: MiNote | null | undefined): Promise<ApShowOutput | null> {
		if (user != null) {
			return {
				type: 'User',
				object: toPackedUserDetailed(await deps.userEntityService.pack(user, me, { schema: 'UserDetailedNotMe' })),
			};
		} else if (note != null) {
			try {
				const object = await deps.noteEntityService.pack(note, me, { detail: true });
				return {
					type: 'Note',
					object: toPackedNote(object),
				};
			} catch (_) {
				return null;
			}
		}
		return null;
	}

	return createApiProcedure<Actor>()(apShowContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const result = await (async () => {
				const object = await fetchAny(ps.uri, me);
				if (object) {
					return object;
				} else {
					throw apiError(apShowErrors.noSuchObject);
				}
			})();
			return result;
		});
}
