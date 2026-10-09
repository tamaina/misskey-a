/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { MiNote } from '../../../../notes/backend/models/Note.js';
import type { MiUser } from '../../../../users/backend/models/User.js';
import { isActor, isPost, getApId } from '../../protocol/type.js';
import { ApResolverService } from '../../services/ApResolverService.js';
import { ApDbResolverService } from '../../services/ApDbResolverService.js';
import { ApPersonService } from '../../services/ApPersonService.js';
import { ApNoteService } from '../../services/ApNoteService.js';
import { UserEntityService } from '../../../../users/backend/serializers/UserEntityService.js';
import { NoteEntityService } from '../../../../notes/backend/serializers/NoteEntityService.js';
import { UtilityService } from '../../services/UtilityService.js';
import { bindThis } from '../../../../runtime/backend/decorators.js';
import { IdentifiableError } from '../../../../runtime/backend/errors/identifiable-error.js';
import { FetchAllowSoftFailMask } from '../../protocol/misc/check-against-url.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import * as v from 'valibot';
import type { ApShowInput, ApShowOutput } from './show.contract.js';
import { apShowContract, apShowErrors } from './show.contract.js';

@Injectable()
export class ApShowApplicationService {
	constructor(
		private utilityService: UtilityService,
		private userEntityService: UserEntityService,
		private noteEntityService: NoteEntityService,
		private apResolverService: ApResolverService,
		private apDbResolverService: ApDbResolverService,
		private apPersonService: ApPersonService,
		private apNoteService: ApNoteService,
	) {}

	public async execute(ps: ApShowInput, me: MiUser): Promise<ApShowOutput> {
		const result = await (async () => {
			const object = await this.fetchAny(ps.uri, me);
			if (object) {
				return object;
			} else {
				throw apiError(apShowErrors.noSuchObject);
			}
		})();
		return v.parse(apShowContract['~orpc'].outputSchema!, result);
	}

	/***
	 * URIからUserかNoteを解決する
	 */
	@bindThis
	private async fetchAny(uri: string, me: MiUser | null | undefined): Promise<ApShowOutput | null> {
		if (!this.utilityService.isFederationAllowedUri(uri)) {
			throw apiError(apShowErrors.federationNotAllowed);
		}

		let local = await this.mergePack(me, ...await Promise.all([
			this.apDbResolverService.getUserFromApId(uri),
			this.apDbResolverService.getNoteFromApId(uri),
		]));
		if (local != null) return local;

		const host = this.utilityService.extractDbHost(uri);

		// local object, not found in db? fail
		if (this.utilityService.isSelfHost(host)) return null;

		// リモートから一旦オブジェクトフェッチ
		const resolver = await this.apResolverService.createResolver();
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
			local = await this.mergePack(me, ...await Promise.all([
				this.apDbResolverService.getUserFromApId(object.id),
				this.apDbResolverService.getNoteFromApId(object.id),
			]));
			if (local != null) return local;
		}

		// 同一ユーザーの情報を再度処理するので、使用済みのresolverを再利用してはいけない
		return await this.mergePack(
			me,
			isActor(object) ? await this.apPersonService.createPerson(getApId(object)) : null,
			isPost(object) ? await this.apNoteService.createNote(getApId(object), undefined, undefined, true) : null,
		);
	}

	@bindThis
	private async mergePack(me: MiUser | null | undefined, user: MiUser | null | undefined, note: MiNote | null | undefined): Promise<ApShowOutput | null> {
		if (user != null) {
			return {
				type: 'User',
				object: await this.userEntityService.pack(user, me, { schema: 'UserDetailedNotMe' }),
			};
		} else if (note != null) {
			try {
				const object = await this.noteEntityService.pack(note, me, { detail: true });

				return {
					type: 'Note',
					object,
				};
			} catch (_) {
				return null;
			}
		}

		return null;
	}
}
