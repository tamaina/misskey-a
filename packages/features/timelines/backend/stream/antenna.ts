/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, Scope } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { NoteStreamingHidingService } from '@features/api/backend/transport/stream/NoteStreamingHidingService.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import { isRenotePacked, isQuotePacked } from '@features/notes/backend/utility/is-renote.js';
import type { GlobalEvents } from '@features/runtime/backend/services/GlobalEventService.js';
import type { JsonObject } from '@features/runtime/backend/formatting/json-value.js';
import Channel, { type ChannelRequest } from '@features/api/backend/transport/stream/channel.js';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class AntennaChannel extends Channel {
	public readonly chName = 'antenna';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:account';
	private antennaId: string;

	constructor(
		@Inject(REQUEST)
		request: ChannelRequest,

		@Inject(DI.antennasRepository)
		private antennasReposiotry: AntennasRepository,

		private noteEntityService: NoteEntityService,
		private noteStreamingHidingService: NoteStreamingHidingService,
	) {
		super(request);
		//this.onEvent = this.onEvent.bind(this);
	}

	@bindThis
	public async init(params: JsonObject): Promise<boolean> {
		if (typeof params.antennaId !== 'string') return false;
		if (!this.user) return false;

		this.antennaId = params.antennaId;

		const antennaExists = await this.antennasReposiotry.exists({
			where: {
				id: this.antennaId,
				userId: this.user.id,
			},
		});

		if (!antennaExists) return false;

		// Subscribe stream
		this.subscriber.on(`antennaStream:${this.antennaId}`, this.onEvent);

		return true;
	}

	@bindThis
	private async onEvent(data: GlobalEvents['antenna']['payload']) {
		if (data.type === 'note') {
			const note = await this.packNote(data.body.id);
			if (!note) return;
			this.send('note', note);
		} else {
			this.send(data.type, data.body);
		}
	}

	/** Shared native packing/filtering for reference-only queued antenna events. */
	public async packNote(noteId: string) {
		let note = await this.noteEntityService.pack(noteId, this.user, { detail: true });

		if (!this.isNoteVisibleForMe(note)) return null;
		if (this.isNoteMutedOrBlocked(note)) return null;

		const filtered = await this.noteStreamingHidingService.filter(note, this.user?.id ?? null);
		if (!filtered) return null;
		note = filtered;

		if (this.user) {
			if (isRenotePacked(note) && !isQuotePacked(note)) {
				if (note.renote && Object.keys(note.renote.reactions).length > 0) {
					const myRenoteReaction = await this.noteEntityService.populateMyReaction(note.renote, this.user.id);
					note.renote.myReaction = myRenoteReaction;
				}
			}
		}

		return note;
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off(`antennaStream:${this.antennaId}`, this.onEvent);
	}
}
