/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { isDeepStrictEqual } from 'node:util';
import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { In, IsNull } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { ChannelsRepository, ChannelFollowingsRepository, UsersRepository, NotesRepository, FollowingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiChannel } from '../models/Channel.js';
import type { MiNote } from '@features/notes/backend/models/Note.js';
import type { MiRemoteUser } from '@features/users/backend/models/User.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { genRsaKeyPair } from '@features/federation/backend/utility/gen-key-pair.js';
import { ApRendererService } from '@features/federation/backend/services/ApRendererService.js';
import { ApResolverService } from '@features/federation/backend/services/ApResolverService.js';
import type { ApNoteService } from '@features/federation/backend/services/ApNoteService.js';
import type { ApPersonService } from '@features/federation/backend/services/ApPersonService.js';
import type { NoteDeleteService } from '@features/notes/backend/services/NoteDeleteService.js';
import { StatusError } from '@features/runtime/backend/http/status-error.js';
import { getApId, getApIds, getOneApId, isCreate, isDelete, isPost } from '@features/federation/backend/protocol/type.js';
import type { IActivity, IAnnounce, IFollow, IObject } from '@features/federation/backend/protocol/type.js';
import { acquireApObjectLock, acquireDistributedLock } from '@features/runtime/backend/cache/distributed-lock.js';
import type * as Redis from 'ioredis';

const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public';

/** Prototype: local authors publish through a dedicated Group; remote submissions are not accepted. */
@Injectable()
export class ChannelFederationService {
	constructor(
		@Inject(DI.config) private config: Config,
		@Inject(DI.redis) private redis: Redis.Redis,
		@Inject(DI.channelsRepository) private channels: ChannelsRepository,
		@Inject(DI.channelFollowingsRepository) private channelFollowings: ChannelFollowingsRepository,
		@Inject(DI.usersRepository) private users: UsersRepository,
		@Inject(DI.notesRepository) private notes: NotesRepository,
		@Inject(DI.followingsRepository) private followings: FollowingsRepository,
		private idService: IdService,
		private events: GlobalEventService,
		private queue: QueueService,
		private renderer: ApRendererService,
		private resolverService: ApResolverService,
		private moduleRef: ModuleRef,
	) {}

	public actorUri(channel: MiChannel): string {
		return channel.uri ?? `${this.config.url}/channels/${channel.id}`;
	}

	public async ensureKeys(channel: MiChannel): Promise<MiChannel> {
		if (channel.host != null) throw new Error('Cannot sign as a remote Group');
		if (!channel.federationPublicKey) {
			const key = await genRsaKeyPair();
			await this.channels.update({ id: channel.id, federationPublicKey: IsNull() }, {
				federationPublicKey: key.publicKey, federationPrivateKey: key.privateKey,
			});
		}
		return await this.channels.findOneByOrFail({ id: channel.id });
	}

	public async renderActor(channel: MiChannel): Promise<IObject> {
		const keyed = await this.ensureKeys(channel);
		const uri = this.actorUri(keyed);
		return this.renderer.addContext({
			type: 'Group', id: uri, name: keyed.name,
			preferredUsername: `channel-${keyed.id}`,
			inbox: `${uri}/inbox`, outbox: `${uri}/outbox`, followers: `${uri}/followers`, following: `${uri}/following`,
			url: uri, summary: '', _misskey_summary: keyed.description,
			_misskey_channel: true, sensitive: keyed.isSensitive, manuallyApprovesFollowers: false,
			publicKey: { id: `${uri}#main-key`, owner: uri, publicKeyPem: keyed.federationPublicKey },
			endpoints: { sharedInbox: `${this.config.url}/inbox` },
		} as IObject);
	}

	public async localChannel(uri: string): Promise<MiChannel | null> {
		const prefix = `${this.config.url}/channels/`;
		if (!uri.startsWith(prefix) || uri.slice(prefix.length).includes('/')) return null;
		return await this.channels.findOneBy({ id: uri.slice(prefix.length), host: IsNull() });
	}

	public async follow(actor: MiRemoteUser, activity: IFollow, undo = false): Promise<string | null> {
		const channel = await this.localChannel(getApId(activity.object));
		if (!channel) return null;
		if (getApId(activity.actor) !== actor.uri) return 'skip: mismatched Group follower';
		if (undo) {
			await this.channelFollowings.delete({ followeeId: channel.id, followerId: actor.id });
			return 'ok: Group unfollowed';
		}
		if (!channel.isFederated || channel.isArchived || actor.isSuspended || actor.isRemoteSuspended) return 'skip: Group disabled';
		await this.ensureKeys(channel);
		await this.channelFollowings.upsert({ id: this.idService.gen(), followeeId: channel.id, followerId: actor.id }, ['followeeId', 'followerId']);
		await this.queue.deliver({ id: channel.id, channelId: channel.id }, this.renderer.addContext({
			type: 'Accept', actor: this.actorUri(channel), object: activity, to: [actor.uri],
		}), actor.inbox, false);
		return 'ok: Group followed';
	}

	public async renderNoteAnnounce(channel: MiChannel, note: MiNote): Promise<IAnnounce> {
		const uri = this.actorUri(channel);
		const create = this.renderer.addContext(this.renderer.renderCreate(await this.renderer.renderNote(note, false), note));
		return this.renderer.addContext({
			type: 'Announce' as const, id: `${uri}/activities/${note.id}`, actor: uri,
			audience: uri, to: [PUBLIC], cc: [`${uri}/followers`], object: create,
		});
	}

	private async deliver(channel: MiChannel, activity: IActivity): Promise<void> {
		const followers = await this.channelFollowings.find({ where: { followeeId: channel.id } });
		if (followers.length === 0) return;
		const users = await this.users.findBy({ id: In(followers.map(f => f.followerId)) });
		const inboxes = new Map<string, boolean>();
		for (const user of users) {
			if (user.host == null || user.isSuspended || user.isRemoteSuspended) continue;
			const inbox = user.sharedInbox ?? user.inbox;
			if (inbox) inboxes.set(inbox, user.sharedInbox != null);
		}
		await this.queue.deliverMany({ id: channel.id, channelId: channel.id }, activity, inboxes);
	}

	public async followerUris(channel: MiChannel): Promise<string[]> {
		const rows = await this.channelFollowings.find({ where: { followeeId: channel.id }, take: 100 });
		if (rows.length === 0) return [];
		return (await this.users.findBy({ id: In(rows.map(row => row.followerId)) })).filter(user => user.host != null && !user.isSuspended && !user.isRemoteSuspended).map(user => user.uri!);
	}

	public async deliverNote(note: MiNote): Promise<void> {
		if (!note.channelId || note.localOnly || note.userHost != null || note.visibility !== 'public') return;
		const channel = await this.channels.findOneByOrFail({ id: note.channelId });
		if (!channel.isFederated || channel.host != null || channel.isArchived) return;
		// Pure Renotes are deferred; do not misrepresent them as a new author Note.
		if (note.renoteId && !note.text && !note.cw && note.fileIds.length === 0 && !note.hasPoll) return;
		await this.ensureKeys(channel);
		await this.deliver(channel, await this.renderNoteAnnounce(channel, note));
	}

	public async deliverDelete(note: MiNote, author: { id: string; host: null }): Promise<void> {
		if (!note.channelId || note.localOnly || note.userHost != null) return;
		const channel = await this.channels.findOneByOrFail({ id: note.channelId });
		if (channel.host != null || !channel.federationPublicKey) return;
		const uri = this.actorUri(channel);
		const inner = this.renderer.addContext(this.renderer.renderDelete(this.renderer.renderTombstone(`${this.config.url}/notes/${note.id}`), author));
		inner.audience = uri;
		await this.deliver(channel, this.renderer.addContext({
			type: 'Announce', id: `${uri}/activities/${note.id}/delete`, actor: uri,
			audience: uri, to: [PUBLIC], cc: [`${uri}/followers`], object: inner,
		}));
	}

	/** Only an authenticated outer Group may call this approval path. */
	public async receiveAnnounce(actor: MiRemoteUser, activity: IAnnounce, depth = 0): Promise<string | null> {
		if (depth > 16) return 'skip: Group reply depth exceeded';
		if (typeof activity.object !== 'object' || Array.isArray(activity.object) || (!isCreate(activity.object) && !isDelete(activity.object))) return null;
		if (actor.isSuspended || actor.isRemoteSuspended || getApId(activity.actor) !== actor.uri) return 'skip: Group actor mismatch';
		const resolver = await this.resolverService.createResolver();
		const group = await resolver.resolve(actor.uri);
		if (group.type !== 'Group' || group._misskey_channel !== true || group.id !== actor.uri) return 'skip: unrecognized channel Group';
		const inner = activity.object;
		if (activity.audience !== actor.uri || inner.audience !== actor.uri) return 'skip: Group audience mismatch';
		if (!getApIds(activity.to).includes(PUBLIC)) return 'skip: nonpublic Group announcement';
		const authorUri = getApId(inner.actor);
		// The pilot supports authors on the Group's own server only. Remote submissions are deferred.
		if (new URL(authorUri).origin !== new URL(actor.uri).origin) return 'skip: remote Group submission not supported';
		const channel = await this.remoteChannel(actor, group);
		const noteUri = getApId(inner.object);
		const unlock = await acquireApObjectLock(this.redis, noteUri);
		try {
			if (isDelete(inner)) {
				const note = await this.notes.findOneBy({ uri: noteUri, channelId: channel.id });
				if (!note) return 'skip: unknown Group note';
				const author = await this.users.findOneByOrFail({ id: note.userId }) as MiRemoteUser;
				if (author.uri !== authorUri) return 'skip: Group delete author mismatch';
				try {
					await resolver.resolve(noteUri);
					return 'skip: author has not deleted the note';
				} catch (error) {
					if (!(error instanceof StatusError) || ![404, 410].includes(error.statusCode)) throw error;
				}
				await this.moduleRef.get<NoteDeleteService>('NoteDeleteService', { strict: false }).delete(author, note);
				return 'ok: Group note deleted';
			}
			// Fetch the author's activity by URL, never trust embedded author assertions.
			if (new URL(getApId(inner)).origin !== new URL(authorUri).origin || new URL(noteUri).origin !== new URL(authorUri).origin) return 'skip: author origin mismatch';
			const canonical = await resolver.resolve(getApId(inner));
			if (!isCreate(canonical) || !isDeepStrictEqual(canonical, inner)) return 'skip: forwarded Create differs from author';
			const object = canonical.object;
			if (typeof object !== 'object' || Array.isArray(object) || !isPost(object) || object.audience !== actor.uri || getOneApId(object.attributedTo!) !== authorUri || !getApIds(object.to).includes(PUBLIC)) return 'skip: invalid Group Note';
			if (await this.notes.existsBy({ uri: noteUri })) return 'skip: note exists';
			for (const reference of [object.inReplyTo, object._misskey_quote ?? object.quoteUrl]) {
				if (reference == null) continue;
				const parentUri = getApId(reference);
				if (!(await this.notes.existsBy({ uri: parentUri }))) await this.importReference(actor, parentUri, depth);
			}
			const author = await this.moduleRef.get<ApPersonService>('ApPersonService', { strict: false }).resolvePerson(authorUri, resolver);
			if (author.host == null) return 'skip: local author on remote Group';
			const note = await this.moduleRef.get<ApNoteService>('ApNoteService', { strict: false }).createNote(object, author, resolver, false, channel);
			return note ? 'ok: Group note created' : 'skip: Group note rejected';
		} finally {
			await unlock();
		}
	}

	/** Serialize native pending-request consumption and cancellation before bridging it to a channel. */
	public async withFollowRequestLock<T>(followee: { id: string; host: string | null; uri: string | null }, followerId: string, action: () => Promise<T>): Promise<T> {
		if (followee.host == null || followee.uri == null || !/^\/channels\/[^/]+$/.test(new URL(followee.uri).pathname)) return await action();
		const unlock = await acquireDistributedLock(this.redis, `channel-follow-request:${followee.id}:${followerId}`, 30_000, 50, 100);
		try { return await action(); } finally { await unlock(); }
	}

	public async unfollowRemote(followerId: string, actorUri: string): Promise<void> {
		const channel = await this.channels.findOneBy({ uri: actorUri });
		if (!channel) return;
		const unlock = await acquireDistributedLock(this.redis, `channel-follow:${channel.id}:${followerId}`, 30_000, 50, 100);
		try {
			await this.channelFollowings.delete({ followerId, followeeId: channel.id });
			this.events.publishInternalEvent('unfollowChannel', { userId: followerId, channelId: channel.id });
		} finally { await unlock(); }
	}

	public async acceptRemoteFollow(actor: MiRemoteUser, followerId: string): Promise<void> {
		if (!/^\/channels\/[^/]+$/.test(new URL(actor.uri).pathname)) return;
		const resolver = await this.resolverService.createResolver();
		const group = await resolver.resolve(actor.uri);
		if (group.type !== 'Group' || group._misskey_channel !== true || group.id !== actor.uri) return;
		const channel = await this.remoteChannel(actor, group);
		const unlock = await acquireDistributedLock(this.redis, `channel-follow:${channel.id}:${followerId}`, 30_000, 50, 100);
		try {
			if (!(await this.followings.existsBy({ followeeId: actor.id, followerId, followerHost: IsNull() }))) return;
			await this.channelFollowings.upsert({ id: this.idService.gen(), followeeId: channel.id, followerId }, ['followeeId', 'followerId']);
			this.events.publishInternalEvent('followChannel', { channelId: channel.id, userId: followerId });
		} finally { await unlock(); }
	}

	private async importReference(actor: MiRemoteUser, parentUri: string, depth: number): Promise<void> {
		// Each reference uses a fresh resolver; the child importer can still resolve its parent.
		const resolver = await this.resolverService.createResolver();
		let parent: IObject;
		try { parent = await resolver.resolve(parentUri); } catch (error) {
			if (error instanceof StatusError && [404, 410].includes(error.statusCode)) return;
			throw error;
		}
		if (!isPost(parent) || !getApIds(parent.to).includes(PUBLIC)) return;
		if (parent.audience == null) {
			await this.moduleRef.get<ApNoteService>('ApNoteService', { strict: false }).resolveNote(parent, { resolver, sentFrom: new URL(parentUri) });
			return;
		}
		if (typeof parent.audience !== 'string') return;
		const parentUrl = new URL(parentUri);
		const groupUrl = new URL(parent.audience);
		if (groupUrl.origin !== parentUrl.origin || !/^\/channels\/[^/]+$/.test(groupUrl.pathname) || !/^\/notes\/[^/]+$/.test(parentUrl.pathname)) return;
		const groupActor = parent.audience === actor.uri ? actor : await this.moduleRef.get<ApPersonService>('ApPersonService', { strict: false }).resolvePerson(parent.audience, resolver);
		if (groupActor.host == null) return;
		const approval = await resolver.resolve(`${parent.audience}/activities/${parentUrl.pathname.split('/').pop()}`);
		if (approval.type !== 'Announce' || getApId((approval as IAnnounce).actor) !== parent.audience) return;
		const approved = (approval as IAnnounce).object;
		if (!isCreate(approved as IObject) || getApId((approved as IActivity).object) !== parentUri) return;
		await this.receiveAnnounce(groupActor, approval as IAnnounce, depth + 1);
	}

	private async remoteChannel(actor: MiRemoteUser, group: IObject): Promise<MiChannel> {
		let channel = await this.channels.findOneBy({ uri: actor.uri });
		if (!channel) {
			await this.channels.createQueryBuilder().insert().values({
				id: this.idService.gen(), uri: actor.uri, host: actor.host,
				name: (group.name ?? actor.username).slice(0, 128), description: group._misskey_summary?.slice(0, 2048) ?? null,
				isFederated: true, isSensitive: group.sensitive === true, allowRenoteToExternal: true, userId: null,
			}).orIgnore().execute();
			channel = await this.channels.findOneByOrFail({ uri: actor.uri });
		}
		return channel;
	}
}
