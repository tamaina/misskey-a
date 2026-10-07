/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { QueryFailedError } from 'typeorm';
import type { ClipsRepository, MiNote, MiClip, ClipNotesRepository, NotesRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { isDuplicateKeyValueError } from '@features/persistence/backend/utility/is-duplicate-key-value-error.js';
import type { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export class ClipService {
	public static NoSuchNoteError = class extends Error {};
	public static NoSuchClipError = class extends Error {};
	public static AlreadyAddedError = class extends Error {};
	public static TooManyClipNotesError = class extends Error {};
	public static TooManyClipsError = class extends Error {};

	constructor(
		private clipsRepository: ClipsRepository,

		private clipNotesRepository: ClipNotesRepository,

		private notesRepository: NotesRepository,

		private roleService: Pick<RoleService, 'getUserPolicies'>,
		private idService: Pick<IdService, 'gen'>,
	) {
	}

	@bindThis
	public async create(me: MiLocalUser, name: string, isPublic: boolean, description: string | null): Promise<MiClip> {
		const currentCount = await this.clipsRepository.countBy({
			userId: me.id,
		});
		if (currentCount >= (await this.roleService.getUserPolicies(me.id)).clipLimit) {
			throw new ClipService.TooManyClipsError();
		}

		const clip = await this.clipsRepository.insertOne({
			id: this.idService.gen(),
			userId: me.id,
			name: name,
			isPublic: isPublic,
			description: description,
		});

		return clip;
	}

	@bindThis
	public async update(me: MiLocalUser, clipId: MiClip['id'], name: string | undefined, isPublic: boolean | undefined, description: string | null | undefined): Promise<void> {
		const clip = await this.clipsRepository.findOneBy({
			id: clipId,
			userId: me.id,
		});

		if (clip == null) {
			throw new ClipService.NoSuchClipError();
		}

		await this.clipsRepository.update(clip.id, {
			name: name,
			description: description,
			isPublic: isPublic,
		});
	}

	@bindThis
	public async delete(me: Pick<MiLocalUser, 'id'>, clipId: MiClip['id']): Promise<void> {
		const clip = await this.clipsRepository.findOneBy({
			id: clipId,
			userId: me.id,
		});

		if (clip == null) {
			throw new ClipService.NoSuchClipError();
		}

		await this.clipsRepository.delete(clip.id);
	}

	@bindThis
	public async addNote(me: Pick<MiLocalUser, 'id'>, clipId: MiClip['id'], noteId: MiNote['id']): Promise<void> {
		const clip = await this.clipsRepository.findOneBy({
			id: clipId,
			userId: me.id,
		});

		if (clip == null) {
			throw new ClipService.NoSuchClipError();
		}

		const currentCount = await this.clipNotesRepository.countBy({
			clipId: clip.id,
		});
		if (currentCount >= (await this.roleService.getUserPolicies(me.id)).noteEachClipsLimit) {
			throw new ClipService.TooManyClipNotesError();
		}

		try {
			await this.clipNotesRepository.insert({
				id: this.idService.gen(),
				noteId: noteId,
				clipId: clip.id,
			});
		} catch (e: unknown) {
			if (e instanceof QueryFailedError) {
				if (isDuplicateKeyValueError(e)) {
					throw new ClipService.AlreadyAddedError();
				} else if (e.driverError.detail.includes('is not present in table "note".')) {
					throw new ClipService.NoSuchNoteError();
				}
			}

			throw e;
		}

		this.clipsRepository.update(clip.id, {
			lastClippedAt: new Date(),
		});

		this.notesRepository.increment({ id: noteId }, 'clippedCount', 1);
	}

	@bindThis
	public async removeNote(me: Pick<MiLocalUser, 'id'>, clipId: MiClip['id'], noteId: MiNote['id']): Promise<void> {
		const clip = await this.clipsRepository.findOneBy({
			id: clipId,
			userId: me.id,
		});

		if (clip == null) {
			throw new ClipService.NoSuchClipError();
		}

		const result = await this.clipNotesRepository.delete({
			noteId: noteId,
			clipId: clip.id,
		});

		if (result.affected === 0) {
			throw new ClipService.NoSuchNoteError();
		}

		this.notesRepository.decrement({ id: noteId }, 'clippedCount', 1);
	}
}
