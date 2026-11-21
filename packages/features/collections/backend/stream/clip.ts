/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, Scope } from '@nestjs/common';
import type { ClipsRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import type { GlobalEvents } from '@features/runtime/backend/services/GlobalEventService.js';
import type { JsonObject } from '@features/runtime/backend/formatting/json-value.js';
import Channel, { type ChannelRequest } from '@features/api/backend/transport/stream/channel.js';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class ClipChannel extends Channel {
	public readonly chName = 'clip';
	public static shouldShare = false;
	public static requireCredential = false as const;
	private clipId: string;

	constructor(
		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		@Inject(REQUEST)
		request: ChannelRequest,
	) {
		super(request);
	}

	@bindThis
	public async init(params: JsonObject): Promise<boolean> {
		if (typeof params.clipId !== 'string') return false;
		this.clipId = params.clipId;

		const clip = await this.clipsRepository.findOneBy({ id: this.clipId });
		if (clip == null) return false;
		if (!clip.isPublic && (this.user == null || clip.userId !== this.user.id)) return false;

		// Subscribe stream
		this.subscriber.on(`clipStream:${this.clipId}`, this.onEvent);

		return true;
	}

	@bindThis
	private onEvent(data: GlobalEvents['clip']['payload']) {
		if (data.type === 'updated' || data.type === 'deleted') {
			this.send(data.type, null);
		}
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off(`clipStream:${this.clipId}`, this.onEvent);
	}
}
