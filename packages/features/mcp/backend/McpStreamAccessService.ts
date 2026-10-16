/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EventEmitter } from 'node:events';
import { Inject, Injectable } from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { Connection } from '@features/api/backend/transport/stream/Connection.js';
import { McpEventsService } from './McpEventsService.js';
import { McpEventError } from './events-protocol.js';
import { acceptsSource, projectFrame, requiredEventScope } from './stream-catalog.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ChatService } from '@features/chat/backend/services/ChatService.js';
import { isJsonObject } from '@features/runtime/backend/formatting/json-value.js';
import type { ConnectionRequest, NativeStreamFrame } from '@features/api/backend/transport/stream/Connection.js';
import type { StreamEventEmitter } from '@features/runtime/backend/services/GlobalEventService.js';
import type { MiMeta, NotesRepository, WebhooksRepository, ChatMessagesRepository, ChatRoomsRepository } from '@features/persistence/backend/repositories/models.js';
import type { StreamOccurrence, StreamSubscription } from './stream-types.js';

/** Recreate native read-side channels against current account/grant/resource state. */
@Injectable()
export class McpStreamAccessService {
	constructor(private readonly moduleRef: ModuleRef, private readonly events: McpEventsService,
		@Inject(DI.webhooksRepository) private readonly webhooks: WebhooksRepository,
		@Inject(DI.notesRepository) private readonly notes: NotesRepository,
		@Inject(DI.meta) private readonly meta: MiMeta,
		private readonly noteEntity: NoteEntityService, private readonly roles: RoleService,
		@Inject(DI.chatMessagesRepository) private readonly messages: ChatMessagesRepository,
		@Inject(DI.chatRoomsRepository) private readonly rooms: ChatRoomsRepository,
		private readonly chat: ChatService) { }

	async validate(userId: string, tokenId: string, subscription: StreamSubscription): Promise<void> {
		await this.replay(userId, tokenId, subscription);
	}

	private async replay(userId: string, tokenId: string, subscription: StreamSubscription, source?: StreamOccurrence): Promise<NativeStreamFrame[]> {
		const { actor, grant } = await this.events.checkGrant(userId, tokenId, false, true);
		if (subscription.channel === 'admin' && !await this.roles.isModerator(actor, true)) throw new McpEventError(-32602, 'Stream access denied');
		if (subscription.channel === 'serverStats' && !this.meta.enableServerMachineStats) throw new McpEventError(-32602, 'Stream unavailable');
		if (source) {
			if (!acceptsSource(subscription, source.channel)) return [];
			const scope = requiredEventScope(subscription, source);
			if (scope && !grant.permission.includes(scope)) return [];
		}
		const context = ContextIdFactory.create();
		this.moduleRef.registerRequestByContextId<ConnectionRequest>({ user: actor, token: grant }, context);
		const connection = await this.moduleRef.create(Connection, context);
		const subscriber = new EventEmitter() as StreamEventEmitter;
		const frames: NativeStreamFrame[] = [];
		try {
			connection.attachNativeOutput(subscriber, { isOpen: () => true, send: frame => {
				const projected = projectFrame(subscription, frame); if (projected) frames.push(projected);
			}, failed: () => { throw new Error('Native stream output failed'); } }, { channels: subscription.channel === 'broadcast' || subscription.channel === 'note' ? [] : [subscription.channel], broadcast: subscription.channel === 'broadcast' });
			// Fresh native relationship/profile snapshot; no periodic connection timer.
			await connection.fetch(true);
			if (subscription.channel === 'note') {
				const noteId = subscription.params.noteId;
				if (typeof noteId !== 'string') throw new McpEventError(-32602, 'Note subscription denied');
				if (!source && !await this.currentNote(noteId, userId)) throw new McpEventError(-32602, 'Note subscription denied');
				connection.subscribeNativeNote(noteId);
			} else if (subscription.channel !== 'broadcast' && !await connection.connectChannel('mcp-stream', subscription.params, subscription.channel)) {
				throw new McpEventError(-32602, 'Stream access denied');
			}
			if (source) {
				const message = await this.hydrate(source, userId);
				if (message === undefined) return [];
				// Native listeners return their async work. Await each to distinguish filtering
				// from pending packing; isolate mutable event bodies from other consumers.
				await Promise.all((subscriber as EventEmitter).rawListeners(source.channel).map(listener => listener(structuredClone(message))));
			}
			return frames;
		} finally { connection.dispose(); }
	}

	private async currentNote(id: string, userId: string) {
		const note = await this.notes.findOneBy({ id });
		if (!note || !await this.noteEntity.isVisibleForMe(note, userId)) return null;
		const packed = await this.noteEntity.pack(note, { id: userId }, { detail: true });
		return packed.isHidden ? null : packed;
	}

	private async hydrate(source: StreamOccurrence, userId: string) {
		const message = structuredClone(source.message);
		if (!isJsonObject(message)) return undefined;
		if (source.channel.startsWith('mainStream:') && message.type === 'newChatMessage') {
			if (!isJsonObject(message.body) || typeof message.body.messageId !== 'string') return undefined;
			const current = await this.messages.findOneBy({ id: message.body.messageId });
			if (!current) return undefined;
			if (current.toRoomId) {
				const room = await this.rooms.findOneBy({ id: current.toRoomId });
				if (!room || !await this.chat.hasPermissionToViewRoomTimeline(userId, room, true)) return undefined;
			} else if (current.fromUserId !== userId && current.toUserId !== userId) return undefined;
			message.body = { messageId: current.id, userId: current.fromUserId, toRoomId: current.toRoomId, toUserId: current.toUserId };
		}
		if (source.channel === 'notesStream') {
			if (typeof message.id !== 'string') return undefined;
			return await this.currentNote(message.id, userId) ?? undefined;
		}
		if (source.channel.startsWith('noteStream:')) {
			if (!isJsonObject(message.body) || typeof message.body.id !== 'string') return undefined;
			const current = await this.currentNote(message.body.id, userId);
			if (current) Object.assign(message.body, { userId: current.userId, visibility: current.visibility, visibleUserIds: current.visibleUserIds ?? [] });
			else if (message.type !== 'deleted' || await this.notes.existsBy({ id: message.body.id })) return undefined;
			// Deleted notes retain only their visibility envelope; native note stream uses
			// the freshly fetched relationship snapshot. No deleted content is retained.
			return message;
		}
		if (message.type === 'note' && !source.channel.startsWith('antennaStream:') || source.channel.startsWith('mainStream:') && ['mention', 'reply', 'renote'].includes(String(message.type))) {
			if (!isJsonObject(message.body) || typeof message.body.id !== 'string') return undefined;
			const current = await this.currentNote(message.body.id, userId); if (!current) return undefined;
			message.body = current;
		}
		if (source.channel.startsWith('mainStream:') && isJsonObject(message.body) && isJsonObject(message.body.note) && typeof message.body.note.id === 'string') {
			const current = await this.currentNote(message.body.note.id, userId); if (!current) return undefined;
			message.body.note = current;
		}
		return message;
	}

	async authorize(webhookId: string, userId: string, generation: string, source: StreamOccurrence) {
		const row = async () => this.webhooks.createQueryBuilder('webhook').addSelect('webhook.mcpPreviousSecret').where('webhook.id = :id', { id: webhookId }).getOne();
		const active = (webhook: Awaited<ReturnType<typeof row>>) => webhook?.mode === 'mcp' && webhook.active && webhook.userId === userId && webhook.mcpGeneration === generation && !!webhook.mcpStream && !!webhook.mcpTokenId && !!webhook.mcpExpiresAt && webhook.mcpExpiresAt.getTime() > Date.now();
		const webhook = await row(); if (!active(webhook) || !webhook?.mcpStream || !webhook.mcpTokenId) return null;
		if (!webhook.mcpStreamSince || source.createdAt < webhook.mcpStreamSince.getTime()) return null;
		const maxAge = webhook.mcpStream.channel === 'serverStats' || webhook.mcpStream.channel === 'queueStats' ? 30000 : 900000;
		if (!Number.isFinite(source.createdAt) || source.createdAt > Date.now() + 5000 || source.createdAt < Date.now() - maxAge) return null;
		try {
			const frames = (await this.replay(userId, webhook.mcpTokenId, webhook.mcpStream, source)).map(frame => frame.type === 'channel' ? { ...frame, body: { ...frame.body, id: webhook.id } } : frame);
			if (!frames.length) return null;
			await this.events.checkGrant(userId, webhook.mcpTokenId, false, true);
			const current = await row(); if (!active(current) || JSON.stringify(current?.mcpStream) !== JSON.stringify(webhook.mcpStream)) return null;
			return { webhook: current!, frames };
		} catch (error) { if (error instanceof McpEventError) return null; throw error; }
	}
}
