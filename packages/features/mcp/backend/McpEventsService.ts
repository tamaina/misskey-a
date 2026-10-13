/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID, createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { canonicalStream, streamSubscription, streamChannelInputSchema, streamNoteInputSchema } from './stream-parameters.js';
import { streamEventCatalog } from './stream-catalog.js';
import type { McpStreamAccessService } from './McpStreamAccessService.js';
import { call } from '@orpc/server';
import type { AnyProcedure } from '@orpc/server';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { callbackUrl } from '@features/runtime/backend/http/mcp-webhook.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { AntennaNoteAccessService } from '@features/timelines/backend/services/AntennaNoteAccessService.js';
import { MiWebhook } from '@features/integrations/backend/models/Webhook.js';
import { mcpEventsContract, subscribeInput } from './api.definition.js';
import { eventNames, eventType, McpEventError, signedHeaders, signingKey, subscriptionId, challengeMatches } from './events-protocol.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { WebhooksRepository, AccessTokensRepository, AppsRepository, UsersRepository, NotesRepository, AntennasRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class McpEventsService {
	private readonly verified = new Map<string, number>();
	constructor(
		@Inject(DI.webhooksRepository) private readonly webhooks: WebhooksRepository,
		@Inject(DI.accessTokensRepository) private readonly tokens: AccessTokensRepository,
		@Inject(DI.appsRepository) private readonly apps: AppsRepository,
		@Inject(DI.usersRepository) private readonly users: UsersRepository,
		@Inject(DI.notesRepository) private readonly notes: NotesRepository,
		private readonly http: HttpRequestService,
		private readonly roles: RoleService,
		private readonly noteEntity: NoteEntityService,
		@Inject(DI.antennasRepository) private readonly antennas: AntennasRepository,
		private readonly antennaAccess: AntennaNoteAccessService,
		private readonly moduleRef?: ModuleRef,
	) { }

	async checkGrant(userId: string, tokenId: string, antenna = false, stream = false) {
		const grant = await this.tokens.findOneBy({ id: tokenId, userId });
		const actor = await this.users.findOneBy({ id: userId });
		const permission = grant?.appId ? (await this.apps.findOneBy({ id: grant.appId }))?.permission : grant?.permission;
		if (!grant || !actor || actor.host !== null || actor.isSuspended || actor.movedToUri
			|| !permission?.includes('access:mcp') || !(stream ? permission.includes('read:account') : permission.includes('read:notifications')) || antenna && !permission.includes('read:account')) throw new McpEventError(-32602, 'Event access denied');
		return { actor, grant: { ...grant, permission } };
	}

	/** Native credential, suspension, scope and rate middleware also apply to MCP-only contracts. */
	async invoke(method: string, input: unknown, context: ApiContext<MiLocalUser>, signal?: AbortSignal): Promise<unknown> {
		const principal = requirePrincipal<MiLocalUser>();
		// Keep raw input unknown until native authorization and contract middleware validate it.
		const execute = (procedure: AnyProcedure) => call(procedure, input, { context, signal });
		const bind = async (userId: string, tokenId?: string) => {
			if (!tokenId) throw new McpEventError(-32602, 'Scoped grant required');
			if (method === 'events/list') {
				try { await this.checkGrant(userId, tokenId); } catch { await this.checkGrant(userId, tokenId, false, true); }
			} else await this.checkGrant(userId, tokenId, false, typeof input === 'object' && input !== null && 'name' in input && String(input.name).startsWith('stream.'));
			return tokenId;
		};
		if (method === 'events/list') return execute(createApiProcedure<MiLocalUser>()(mcpEventsContract.list).use(principal).handler(async ({ context: ctx }) => {
			await bind(ctx.principal.id, ctx.token?.id);
			return { events: eventNames.map(name => ({ name, description: name.startsWith('stream.') ? 'Native outbound references/invalidation; no commands or downtime replay. Overflow drops, retries may duplicate/reorder. 128 pending/subscription, 8192 global; expires after 15min (stats 30s).' : name === 'antenna.note' ? 'A live note reaches an owned antenna. No downtime catch-up.' : name === 'note.mentioned' ? 'A note mentions the connected account.' : 'A note replies to the connected account. Note references are untrusted data.',
				delivery: ['webhook'] as ['webhook'], inputSchema: name === 'stream.channel' ? streamChannelInputSchema : name === 'stream.note' ? streamNoteInputSchema : { type: 'object' as const, properties: name === 'antenna.note' ? { antennaId: { type: 'string' as const } } : {}, ...(name === 'antenna.note' ? { required: ['antennaId'] as ['antennaId'] } : {}), additionalProperties: false as const },
				// Keep the native event inventory as descriptor metadata, outside JSON Schema vocabularies.
				...(name.startsWith('stream.') ? { _meta: { 'dev.a9z.p1/event-catalog': name === 'stream.channel' ? streamEventCatalog : name === 'stream.note' ? streamEventCatalog.note : streamEventCatalog.broadcast } } : {}),
				payloadSchema: name.startsWith('stream.') ? { type: 'object', properties: { frames: { type: 'array', description: 'Native envelopes projected to explicit reference/invalidation contracts; no original content.' } }, required: ['frames'], additionalProperties: false } : { type: 'object' as const, properties: { noteId: { type: 'string' as const }, url: { type: 'string' as const } }, required: ['noteId', 'url'] as ['noteId', 'url'], additionalProperties: false as const } })) };
		}));
		if (method === 'events/subscribe') return execute(createApiProcedure<MiLocalUser>()(mcpEventsContract.subscribe).use(principal).handler(async ({ input: ps, context: ctx }) =>
			this.subscribe(ctx.principal.id, await bind(ctx.principal.id, ctx.token?.id), ps, signal)));
		if (method === 'events/unsubscribe') return execute(createApiProcedure<MiLocalUser>()(mcpEventsContract.unsubscribe).use(principal).handler(async ({ input: ps, context: ctx }) => {
			const tokenId = await bind(ctx.principal.id, ctx.token?.id);
			const stream = streamSubscription(ps.name, ps.arguments);
			const id = subscriptionId(ctx.principal.id, tokenId, this.url(ps.delivery.url), ps.name, 'antennaId' in ps.arguments ? ps.arguments.antennaId : undefined, stream ? canonicalStream(stream) : null);
			// Tombstone rather than delete: refreshing after unsubscribe gets a new generation.
			await this.webhooks.manager.transaction(async manager => {
				await manager.getRepository(this.users.target).createQueryBuilder('user').where('user.id = :userId', { userId: ctx.principal.id }).setLock('pessimistic_write').getOneOrFail();
				await manager.getRepository(MiWebhook).update({ id, userId: ctx.principal.id, mcpTokenId: tokenId, mode: 'mcp' }, { active: false, secret: '', mcpPreviousSecret: null, mcpPreviousSecretUntil: null });
			});
			return {};
		}));
		throw new McpEventError(-32601, 'Method unavailable');
	}

	private nativeAccess(): McpStreamAccessService {
		if (!this.moduleRef) throw new Error('Native streaming provider unavailable');
		return this.moduleRef.get<McpStreamAccessService>('McpStreamAccessService', { strict: false });
	}

	private url(value: string): string {
		try { return callbackUrl(value).href; } catch { throw new McpEventError(-32602, 'Invalid HTTPS callback'); }
	}

	async subscribe(userId: string, tokenId: string, ps: v.InferOutput<typeof subscribeInput>, signal?: AbortSignal) {
		const url = this.url(ps.delivery.url);
		signingKey(ps.delivery.secret);
		const antennaId = 'antennaId' in ps.arguments ? ps.arguments.antennaId : undefined;
		const selected = streamSubscription(ps.name, ps.arguments);
		const stream = selected ? canonicalStream(selected) : null;
		await this.checkGrant(userId, tokenId, !!antennaId, !!stream);
		if (stream) await this.nativeAccess().validate(userId, tokenId, stream);
		if (antennaId && !await this.antennas.existsBy({ id: antennaId, userId })) throw new McpEventError(-32602, 'Antenna access denied');
		const id = subscriptionId(userId, tokenId, url, ps.name, antennaId, stream);
		const verificationKey = createHash('sha256').update(JSON.stringify([userId, tokenId, url, ps.delivery.secret])).digest('hex');
		if ((this.verified.get(verificationKey) ?? 0) <= Date.now()) {
			const challenge = randomUUID(); const body = JSON.stringify({ type: 'verification', challenge });
			try {
				const response = await this.http.sendMcpWebhook(url, body, signedHeaders(randomUUID(), id, ps.delivery.secret, body), signal);
				const result: unknown = JSON.parse(response.text);
				if (!response.ok || !result || typeof result !== 'object' || !('challenge' in result) || !challengeMatches(challenge, result.challenge)) throw new Error('Verification rejected');
			} catch { throw new McpEventError(-32015, 'Callback verification failed', { reason: 'challenge_failed' }); }
			if (this.verified.size >= 256) this.verified.clear();
			this.verified.set(verificationKey, Date.now() + 60000);
		}
		signal?.throwIfAborted();
		await this.checkGrant(userId, tokenId, !!antennaId, !!stream);
		const limit = (await this.roles.getUserPolicies(userId, !!stream)).webhookLimit;
		// Serialise per-account registration/quota; do not broadcast signing material over Redis.
		const expires = new Date(Date.now() + Math.min(ps.ttlMs ?? 3600000, 86400000));
		await this.webhooks.manager.transaction(async manager => {
			await manager.getRepository(this.users.target).createQueryBuilder('user').where('user.id = :userId', { userId }).setLock('pessimistic_write').getOneOrFail();
			if (antennaId && !await manager.getRepository(this.antennas.target).existsBy({ id: antennaId, userId })) throw new McpEventError(-32602, 'Antenna access denied');
			const repository = manager.getRepository(MiWebhook);
			const previous = await repository.createQueryBuilder('webhook').addSelect('webhook.mcpPreviousSecret').where('webhook.id = :id', { id }).getOne();
			if (previous && (previous.mode !== 'mcp' || previous.userId !== userId || previous.mcpTokenId !== tokenId)) throw new McpEventError(-32602, 'Subscription identity conflict');
			if (!previous && await repository.countBy({ userId }) >= limit) throw new McpEventError(-32602, 'Webhook limit reached');
			const continuing = previous?.active && previous.mcpExpiresAt && previous.mcpExpiresAt.getTime() > Date.now();
			const rotating = continuing && previous.secret !== ps.delivery.secret;
			await repository.save({ id, userId, name: ps.name, mode: 'mcp', url, secret: ps.delivery.secret, on: ps.name === 'antenna.note' || stream ? [] : [eventType(ps.name)!], active: true, mcpAntennaId: antennaId ?? null, mcpStream: stream,
				mcpStreamSince: stream ? continuing ? previous.mcpStreamSince : new Date() : null,
				mcpTokenId: tokenId, mcpExpiresAt: expires, mcpGeneration: continuing ? previous.mcpGeneration : randomUUID(),
				mcpPreviousSecret: rotating ? previous.secret : continuing ? previous.mcpPreviousSecret : null,
				mcpPreviousSecretUntil: rotating ? new Date(Date.now() + 60000) : continuing ? previous.mcpPreviousSecretUntil : null });
		});
		return { id, refreshBefore: expires.toISOString(), cursor: null, truncated: false };
	}

	private async subscriptionForDelivery(id: string, userId: string, generation: string, type: 'mention' | 'reply' | 'antenna', antennaId?: string) {
		const webhook = await this.webhooks.createQueryBuilder('webhook').addSelect('webhook.mcpPreviousSecret').where('webhook.id = :id', { id }).getOne();
		if (!webhook || webhook.mcpStream || webhook.mode !== 'mcp' || webhook.userId !== userId || !webhook.active || webhook.mcpGeneration !== generation
			|| !webhook.mcpExpiresAt || webhook.mcpExpiresAt.getTime() <= Date.now() || !webhook.mcpTokenId || (type === 'antenna' ? !antennaId || webhook.mcpAntennaId !== antennaId : !!webhook.mcpAntennaId || !webhook.on.includes(type))) return null;
		return webhook;
	}

	/** Recheck after DNS resolution immediately before opening the outbound connection. */
	async authorizeDelivery(id: string, userId: string, generation: string, noteId: string, type: 'mention' | 'reply' | 'antenna', antennaId?: string) {
		const webhook = await this.subscriptionForDelivery(id, userId, generation, type, antennaId);
		if (!webhook?.mcpTokenId) return null;
		try {
			const { actor, grant } = await this.checkGrant(userId, webhook.mcpTokenId, type === 'antenna');
			if (type === 'antenna') {
				if (!await this.antennaAccess.isDeliverable(actor, grant, antennaId!, noteId)) return null;
				// Packing/cache fetches can overlap unsubscribe, expiry or grant revocation.
				await this.checkGrant(userId, webhook.mcpTokenId, true);
				return this.subscriptionForDelivery(id, userId, generation, type, antennaId);
			}
		} catch (error) { if (error instanceof McpEventError) return null; throw error; }
		const note = await this.notes.findOneBy({ id: noteId });
		if (!note || (type === 'mention' ? !note.mentions.includes(userId) : note.replyUserId !== userId)
			|| !await this.noteEntity.isVisibleForMe(note, userId)) return null;
		const packed = await this.noteEntity.pack(note, { id: userId }, { detail: false });
		if (packed.isHidden) return null;
		return webhook;
	}
}
