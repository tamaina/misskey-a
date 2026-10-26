/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as WebSocket from 'ws';
import promiseLimit from 'promise-limit';
import { ContextIdFactory, ModuleRef, REQUEST } from '@nestjs/core';
import { Inject, Injectable, Optional, Scope } from '@nestjs/common';
import { BrowserSessionService } from '@features/auth/backend/services/BrowserSessionService.js';
import { DI } from '@/di-symbols.js';
import { isJsonObject } from '@features/runtime/backend/formatting/json-value.js';
import type { Packed } from '@features/index/backend/packed.schema.js';
import type { JsonObject, JsonValue } from '@features/runtime/backend/formatting/json-value.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { ChannelFollowingService } from '@features/channels/backend/services/ChannelFollowingService.js';
import type { GlobalEvents, StreamEventEmitter } from '@features/runtime/backend/services/GlobalEventService.js';
import { MiFollowing, MiUserProfile } from '@features/persistence/backend/repositories/models.js';
import type { MiMeta } from '@features/persistence/backend/repositories/models.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import { NotificationService } from '@features/notifications/backend/services/NotificationService.js';
import type { MiAccessToken } from '@features/auth/backend/models/AccessToken.js';
import type { MiUser } from '@features/users/backend/models/User.js';
import { MainChannel } from './channels/main.js';
import { HomeTimelineChannel } from '@features/timelines/backend/stream/home-timeline.js';
import { LocalTimelineChannel } from '@features/timelines/backend/stream/local-timeline.js';
import { HybridTimelineChannel } from '@features/timelines/backend/stream/hybrid-timeline.js';
import { GlobalTimelineChannel } from '@features/timelines/backend/stream/global-timeline.js';
import { UserListChannel } from '@features/timelines/backend/stream/user-list.js';
import { HashtagChannel } from '@features/discovery/backend/stream/hashtag.js';
import { RoleTimelineChannel } from '@features/timelines/backend/stream/role-timeline.js';
import { AntennaChannel } from '@features/timelines/backend/stream/antenna.js';
import { ChannelChannel } from '@features/channels/backend/stream/channel.js';
import { ClipChannel } from '@features/collections/backend/stream/clip.js';
import { DriveChannel } from '@features/drive/backend/stream/drive.js';
import { ServerStatsChannel } from '@features/statistics/backend/stream/server-stats.js';
import { QueueStatsChannel } from '@features/operations/backend/stream/queue-stats.js';
import { AdminChannel } from '@features/operations/backend/stream/admin.js';
import { ChatUserChannel } from '@features/chat/backend/stream/chat-user.js';
import { ChatRoomChannel } from '@features/chat/backend/stream/chat-room.js';
import { ReversiChannel } from '@features/games/backend/stream/reversi.js';
import { ReversiGameChannel } from '@features/games/backend/stream/reversi-game.js';
import type { BrowserSessionIdentity } from '../context.js';
import type { ChannelRequest } from './channel.js';
import type { ChannelConstructor } from './channel.js';
import type { Channel } from './channel.js';
import type { EventEmitter } from 'events';
import type { StreamChannel } from '@features/mcp/backend/stream-types.js';

const MAX_CHANNELS_PER_CONNECTION = 32;
const MAX_SUBSCRIBING_NOTES_PER_CONNECTION = 1536;
const MAX_PENDING_BROWSER_SESSION_OUTPUTS = 64;
const MAX_PENDING_BROWSER_SESSION_OUTPUT_BYTES = 1024 * 1024;
const MAX_PENDING_BROWSER_SESSION_INPUTS = 64;
const MAX_PENDING_BROWSER_SESSION_INPUT_BYTES = 1024 * 1024;
const MAX_BUFFERED_AMOUNT_PER_CONNECTION = 1024 * 1024 * 8; // 8MiB

/**
 * Main stream connection
 */

@Injectable({ scope: Scope.TRANSIENT })
export default class Connection {
	public user?: MiUser;
	public token?: MiAccessToken;
	private wsConnection: WebSocket.WebSocket;
	private output: NativeStreamOutput | undefined;
	private outputChannels: ReadonlySet<string> = new Set();
	private listeningBroadcast = false;
	public get isNativeOutput() { return !!this.output; }
	private disposed = false;
	private browserSession: ConnectionRequest['browserSession'];
	private listeningSessionRevocation = false;
	private browserSessionOutputs: { wire: string; bytes: number }[] = [];
	private browserSessionOutputBytes = 0;
	private drainingBrowserSessionOutputs = false;
	private browserSessionInputs: Buffer[] = [];
	private browserSessionInputBytes = 0;
	private drainingBrowserSessionInputs = false;
	private messageQueue = promiseLimit<void>(1);
	public subscriber: StreamEventEmitter;
	private channels: Map<string, Channel> = new Map();
	private subscribingNotes: Map<string, number> = new Map();
	public userProfile: MiUserProfile | null = null;
	public following: Record<string, Pick<MiFollowing, 'withReplies'> | undefined> = {};
	public followingChannels: Set<string> = new Set();
	public mutingChannels: Set<string> = new Set();
	public userIdsWhoMeMuting: Set<string> = new Set();
	public userIdsWhoBlockingMe: Set<string> = new Set();
	public userIdsWhoMeMutingRenotes: Set<string> = new Set();
	public userMutedInstances: Set<string> = new Set();
	private fetchIntervalId: NodeJS.Timeout | null = null;

	constructor(
		private moduleRef: ModuleRef,
		private notificationService: NotificationService,
		private cacheService: CacheService,
		private channelFollowingService: ChannelFollowingService,
		private channelMutingService: ChannelMutingService,
		@Inject(DI.meta)
		private meta: MiMeta,
		@Inject(REQUEST)
		request: ConnectionRequest,
		@Optional() private browserSessionService?: BrowserSessionService,
	) {
		if (request.user) this.user = request.user;
		if (request.token) this.token = request.token;
		this.browserSession = request.browserSession;
	}

	/** No positive validity cache and no credential retained on the connection. */
	public async checkBrowserSession(): Promise<boolean> {
		if (this.disposed) return false;
		if (!this.browserSession) return true;
		try {
			if (this.user?.id === this.browserSession.userId && await this.browserSessionService?.isActive(this.browserSession.id, this.browserSession.userId)) return !this.disposed;
		} catch { /* Database failures deny access too. */ }
		this.closeRevokedSession();
		return false;
	}

	private closeRevokedSession(reason = 'Session no longer active') {
		if (this.disposed) return;
		const output = this.output;
		this.dispose();
		if (this.wsConnection) this.wsConnection.close(1008, reason);
		if (output) {
			try { Promise.resolve(output.failed(new Error(reason))).catch(() => {}); } catch { /* Failure observers cannot reopen access. */ }
		}
	}

	@bindThis
	private onSessionRevoked(event: GlobalEvents['internal']['payload']) {
		if (event.type !== 'browserSessionRevoked' || !this.browserSession) return;
		if (event.body.userId === this.browserSession.userId && (event.body.id === null || event.body.id === this.browserSession.id)) this.closeRevokedSession();
	}

	private listenSessionRevocation() {
		if (!this.browserSession) return;
		this.subscriber.on('internal', this.onSessionRevoked);
		this.listeningSessionRevocation = true;
	}

	@bindThis
	public async fetch(fresh = false) {
		if (this.user == null) return;
		const [
			userProfile,
			following,
			followingChannels,
			mutingChannels,
			userIdsWhoMeMuting,
			userIdsWhoBlockingMe,
			userIdsWhoMeMutingRenotes,
		] = await Promise.all([
			this.cacheService.userProfileCache.fetch(this.user.id, fresh),
			this.cacheService.userFollowingsCache.fetch(this.user.id, fresh),
			this.channelFollowingService.userFollowingChannelsCache.fetch(this.user.id, fresh),
			this.channelMutingService.mutingChannelsCache.fetch(this.user.id, fresh),
			this.cacheService.userMutingsCache.fetch(this.user.id, fresh),
			this.cacheService.userBlockedCache.fetch(this.user.id, fresh),
			this.cacheService.renoteMutingsCache.fetch(this.user.id, fresh),
		]);
		this.userProfile = userProfile;
		this.following = following;
		this.followingChannels = followingChannels;
		this.mutingChannels = mutingChannels;
		this.userIdsWhoMeMuting = userIdsWhoMeMuting;
		this.userIdsWhoBlockingMe = userIdsWhoBlockingMe;
		this.userIdsWhoMeMutingRenotes = userIdsWhoMeMutingRenotes;
		this.userMutedInstances = new Set(userProfile.mutedInstances);
	}

	@bindThis
	public async init() {
		if (!await this.checkBrowserSession()) return;
		if (this.user != null) {
			await this.fetch();
			if (this.disposed) return;

			if (!this.fetchIntervalId) {
				this.fetchIntervalId = setInterval(this.fetch, 1000 * 10);
			}
		}
	}

	@bindThis
	public async listen(subscriber: EventEmitter, wsConnection: WebSocket.WebSocket) {
		if (this.output || this.wsConnection || this.disposed) throw new Error('Connection already attached');
		this.subscriber = subscriber;

		this.wsConnection = wsConnection;
		this.listenSessionRevocation();
		this.wsConnection.on('message', data => this.browserSession
			? this.enqueueBrowserSessionInput(data)
			: this.messageQueue(() => this.onWsConnectionMessage(data)));

		this.subscriber.on('broadcast', this.onBroadcastMessage);
		this.listeningBroadcast = true;
		await this.checkBrowserSession();
	}

	/** Internal outbound seam. Channel initialization still owns authorization and filtering. */
	public attachNativeOutput(subscriber: StreamEventEmitter, output: NativeStreamOutput, routes: { channels: readonly NativeOutputChannel[]; broadcast?: boolean }) {
		if (this.disposed || this.wsConnection || this.output) throw new Error('Connection already attached');
		this.subscriber = subscriber;
		this.output = output;
		this.listenSessionRevocation();
		this.outputChannels = new Set(routes.channels);
		if (routes.broadcast) {
			this.subscriber.on('broadcast', this.onBroadcastMessage);
			this.listeningBroadcast = true;
		}
	}

	/** In-process antenna-only pilot. No broadcast, raw note or socket handlers. */
	public attachAntennaOutput(subscriber: StreamEventEmitter, output: AntennaNoteOutput) {
		this.attachNativeOutput(subscriber, {
			isOpen: () => output.isOpen(),
			send: frame => {
				if (frame.type === 'channel' && frame.body.type === 'note') return output.send(frame.body.body as Packed<'Note'>);
			},
			failed: error => output.failed(error),
		}, { channels: ['antenna'] });
	}

	/** Only receives channel output after the channel's authorization and filters. */
	public sendChannelMessage(id: string, type: string, body: JsonValue) {
		if (this.disposed) return;
		if (this.output && !this.outputChannels.has(this.channels.get(id)?.chName ?? '')) return;
		this.sendMessageToWs('channel', { id, type, body });
	}

	private failOutput(output: NativeStreamOutput, error: unknown) {
		if (this.disposed) return;
		this.dispose();
		// Failure observers cannot escape the EventEmitter handler either.
		try { Promise.resolve(output.failed(error)).catch(() => {}); } catch { }
	}

	private enqueueBrowserSessionInput(data: WebSocket.RawData) {
		if (this.disposed) return;
		if (this.browserSessionInputs.length >= MAX_PENDING_BROWSER_SESSION_INPUTS) {
			this.closeRevokedSession('Session input capacity exceeded');
			return;
		}
		const bytes = Array.isArray(data) ? data.reduce((total, chunk) => total + chunk.byteLength, 0) : data.byteLength;
		if (this.browserSessionInputBytes + bytes > MAX_PENDING_BROWSER_SESSION_INPUT_BYTES) {
			this.closeRevokedSession('Session input capacity exceeded');
			return;
		}
		// Copy only after bounds pass, so mutable caller buffers cannot alter queued commands.
		const frame = Array.isArray(data) ? Buffer.concat(data)
			: Buffer.isBuffer(data) ? Buffer.from(data) : Buffer.from(new Uint8Array(data));
		this.browserSessionInputBytes += bytes;
		this.browserSessionInputs.push(frame);
		if (!this.drainingBrowserSessionInputs) {
			void this.drainBrowserSessionInputs().catch(() => { this.closeRevokedSession('Session input failed'); });
		}
	}

	private async drainBrowserSessionInputs() {
		this.drainingBrowserSessionInputs = true;
		try {
			while (!this.disposed && this.browserSessionInputs.length > 0) {
				// No raw frame is held outside the owned queue across this DB wait.
				if (!await this.checkBrowserSession()) return;
				const frame = this.browserSessionInputs[0];
				if (!frame) return;
				if (this.wsConnection.readyState !== WebSocket.WebSocket.OPEN) { this.dispose(); return; }
				await this.dispatchWsConnectionMessage(frame);
				if (this.disposed) return;
				this.browserSessionInputs.shift();
				this.browserSessionInputBytes -= frame.byteLength;
			}
		} finally { this.drainingBrowserSessionInputs = false; }
	}

	/**
	 * クライアントからメッセージ受信時
	 */
	@bindThis
	private async onWsConnectionMessage(data: WebSocket.RawData) {
		if (this.wsConnection.readyState !== WebSocket.WebSocket.OPEN || !await this.checkBrowserSession()) return;
		await this.dispatchWsConnectionMessage(data);
	}

	private async dispatchWsConnectionMessage(data: WebSocket.RawData) {
		let obj: JsonObject;

		try {
			obj = JSON.parse(data.toString());
		} catch (_) {
			return;
		}

		const { type, body } = obj;

		switch (type) {
			case 'readNotification': this.onReadNotification(body); break;
			case 'subNote': this.onSubscribeNote(body); break;
			case 's': this.onSubscribeNote(body); break; // alias
			case 'sr': this.onSubscribeNote(body); break;
			case 'unsubNote': this.onUnsubscribeNote(body); break;
			case 'un': this.onUnsubscribeNote(body); break; // alias
			case 'connect': await this.onChannelConnectRequested(body); break;
			case 'disconnect': this.onChannelDisconnectRequested(body); break;
			case 'channel': this.onChannelMessageRequested(body); break;
			case 'ch': this.onChannelMessageRequested(body); break; // alias
		}
	}

	@bindThis
	private onBroadcastMessage(data: GlobalEvents['broadcast']['payload']) {
		this.sendMessageToWs(data.type, data.body);
	}

	@bindThis
	private onReadNotification(payload: JsonValue | undefined) {
		this.notificationService.readAllNotification(this.user!.id);
	}

	/**
	 * 投稿購読要求時
	 */
	@bindThis
	private onSubscribeNote(payload: JsonValue | undefined) {
		if (!isJsonObject(payload)) return;
		if (!payload.id || typeof payload.id !== 'string') return;

		const current = this.subscribingNotes.get(payload.id) ?? 0;

		if (current === 0 && this.subscribingNotes.size >= MAX_SUBSCRIBING_NOTES_PER_CONNECTION) {
			// 新規購読 かつ 購読上限に達している場合は、最も古い購読を解除して新規購読を追加する
			const oldestId = this.subscribingNotes.keys().next().value;
			if (oldestId != null) {
				this.subscriber.off(`noteStream:${oldestId}`, this.onNoteStreamMessage);
				this.subscribingNotes.delete(oldestId);
			}
		} else {
			// access 順を更新して LRU を保つ
			this.subscribingNotes.delete(payload.id);
		}

		const updated = current + 1;
		this.subscribingNotes.set(payload.id, updated);

		if (updated === 1) {
			this.subscriber.on(`noteStream:${payload.id}`, this.onNoteStreamMessage);
		}
	}

	/** Declarative outbound note subscription; does not expose the socket command dispatcher. */
	public subscribeNativeNote(noteId: string) {
		if (!this.output || this.disposed) throw new Error('Native output required');
		this.onSubscribeNote({ id: noteId });
	}

	/**
	 * 投稿購読解除要求時
	 */
	@bindThis
	private onUnsubscribeNote(payload: JsonValue | undefined) {
		if (!isJsonObject(payload)) return;
		if (!payload.id || typeof payload.id !== 'string') return;

		const current = this.subscribingNotes.get(payload.id);
		if (current == null) return;
		const updated = current - 1;
		if (updated <= 0) {
			this.subscribingNotes.delete(payload.id);
			this.subscriber.off(`noteStream:${payload.id}`, this.onNoteStreamMessage);
		} else {
			this.subscribingNotes.set(payload.id, updated);
		}
	}

	@bindThis
	private async onNoteStreamMessage(data: GlobalEvents['note']['payload']) {
		// 自分自身ではないかつ
		if (data.body.userId !== this.user?.id) {
			// 公開範囲が指名で自分が含まれてない
			if (data.body.visibility === 'specified' && (this.user == null || !data.body.visibleUserIds.includes(this.user.id))) {
				return;
			}

			// 公開範囲がフォロワーで自分がフォロワーでない
			if (data.body.visibility === 'followers' && !Object.hasOwn(this.following, data.body.userId)) {
				return;
			}
		}

		// TODO: ugcVisibilityForVisitor が local の場合の扱いを NoteEntityService.shouldHideNote と揃える
		if (this.user == null && this.meta.ugcVisibilityForVisitor === 'none') return;

		this.sendMessageToWs('noteUpdated', {
			id: data.body.id,
			type: data.type,
			body: data.body.body,
		});
	}

	/**
	 * チャンネル接続要求時
	 */
	@bindThis
	private async onChannelConnectRequested(payload: JsonValue | undefined) {
		if (!isJsonObject(payload)) return;
		const { channel, id, params, pong } = payload;
		if (typeof id !== 'string') return;
		if (typeof channel !== 'string') return;
		if (typeof pong !== 'boolean' && typeof pong !== 'undefined' && pong !== null) return;
		if (typeof params !== 'undefined' && !isJsonObject(params)) return;
		await this.connectChannel(id, params, channel, pong ?? undefined);
	}

	/**
	 * チャンネル切断要求時
	 */
	@bindThis
	private onChannelDisconnectRequested(payload: JsonValue | undefined) {
		if (!isJsonObject(payload)) return;
		const { id } = payload;
		if (typeof id !== 'string') return;
		this.disconnectChannel(id);
	}

	/**
	 * クライアントにメッセージ送信
	 */
	@bindThis
	public sendMessageToWs(type: string, payload: JsonObject) {
		if (this.disposed) return;
		if (this.browserSession) {
			// The first queued frame remains owned by the array while validation waits.
			if (this.browserSessionOutputs.length >= MAX_PENDING_BROWSER_SESSION_OUTPUTS) {
				this.closeRevokedSession('Session output capacity exceeded');
				return;
			}
			let wire: string;
			try { wire = JSON.stringify({ type, body: payload }); } catch { this.closeRevokedSession(); return; }
			const bytes = Buffer.byteLength(wire);
			if (this.browserSessionOutputBytes + bytes > MAX_PENDING_BROWSER_SESSION_OUTPUT_BYTES) {
				this.closeRevokedSession('Session output capacity exceeded');
				return;
			}
			this.browserSessionOutputBytes += bytes;
			this.browserSessionOutputs.push({ wire, bytes });
			if (!this.drainingBrowserSessionOutputs) {
				void this.drainBrowserSessionOutputs().catch(() => { this.closeRevokedSession(); });
			}
			return;
		}
		this.sendValidatedMessage(type, payload);
	}

	private async drainBrowserSessionOutputs() {
		this.drainingBrowserSessionOutputs = true;
		try {
			while (!this.disposed && this.browserSessionOutputs.length > 0) {
				if (!await this.checkBrowserSession()) return;
				const frame = this.browserSessionOutputs[0];
				if (!frame) return;
				const decoded = JSON.parse(frame.wire) as { type: string; body: JsonObject };
				await this.sendValidatedMessage(decoded.type, decoded.body);
				if (this.disposed) return;
				this.browserSessionOutputs.shift();
				this.browserSessionOutputBytes -= frame.bytes;
			}
		} finally { this.drainingBrowserSessionOutputs = false; }
	}

	private sendValidatedMessage(type: string, payload: JsonObject): void | Promise<void> {
		if (this.disposed) return;
		if (this.output) {
			const output = this.output;
			try {
				if (output.isOpen()) return Promise.resolve(output.send({ type, body: payload })).catch(error => { this.failOutput(output, error); });
			} catch (error) { this.failOutput(output, error); }
			return;
		}
		if (this.wsConnection.readyState !== WebSocket.WebSocket.OPEN) return;
		const message = JSON.stringify({
			type: type,
			body: payload,
		});

		// 受信が追いつかないクライアントのために送信バッファを溜め続けないよう、閾値を超えたら切断して再接続させる
		if (this.wsConnection.bufferedAmount + Buffer.byteLength(message) > MAX_BUFFERED_AMOUNT_PER_CONNECTION) {
			this.wsConnection.terminate();
			return;
		}

		this.wsConnection.send(message);
		return;
	}

	/**
	 * チャンネルに接続
	 */
	@bindThis
	public async connectChannel(id: string, params: JsonObject | undefined, channel: string, pong = false) {
		if (!await this.checkBrowserSession() || this.output && !this.outputChannels.has(channel)) return false;
		if (this.channels.has(id)) {
			this.disconnectChannel(id);
		}

		if (this.channels.size >= MAX_CHANNELS_PER_CONNECTION) {
			return false;
		}

		const channelConstructor = this.getChannelConstructor(channel);

		if (channelConstructor.requireCredential && this.user == null) {
			return false;
		}

		if (this.token && ((channelConstructor.kind && !this.token.permission.some(p => p === channelConstructor.kind))
			|| (!channelConstructor.kind && channelConstructor.requireCredential))) {
			return false;
		}

		// 共有可能チャンネルに接続しようとしていて、かつそのチャンネルに既に接続していたら無意味なので無視
		if (channelConstructor.shouldShare) {
			for (const c of this.channels.values()) {
				if (c.chName === channel) {
					return false;
				}
			}
		}

		const contextId = ContextIdFactory.create();
		this.moduleRef.registerRequestByContextId<ChannelRequest>({
			id: id,
			connection: this,
		}, contextId);
		const ch: Channel = await this.moduleRef.create<Channel>(channelConstructor, contextId);
		if (!await this.checkBrowserSession() || (this.output ? !this.output.isOpen() : this.wsConnection.readyState !== WebSocket.WebSocket.OPEN)) { ch.dispose?.(); return false; }

		this.channels.set(ch.id, ch);
		const valid = await ch.init(params ?? {});
		if (!await this.checkBrowserSession() || this.output && !this.output.isOpen()) {
			ch.dispose?.(); this.channels.delete(ch.id); return false;
		}
		if (typeof valid === 'boolean' && !valid) {
			// 初期化処理の結果、接続拒否されたので切断
			this.disconnectChannel(id);
			return false;
		}

		if (pong && !this.output) {
			this.sendMessageToWs('connected', {
				id: id,
			});
		}
		return true;
	}

	public async packAntennaNote(id: string, noteId: string) {
		const channel = this.channels.get(id);
		if (this.disposed || !(channel instanceof AntennaChannel)) return null;
		const note = await channel.packNote(noteId);
		return await this.checkBrowserSession() ? note : null;
	}

	@bindThis
	public getChannelConstructor(name: string): ChannelConstructor<boolean> {
		switch (name) {
			case 'main': return MainChannel;
			case 'homeTimeline': return HomeTimelineChannel;
			case 'localTimeline': return LocalTimelineChannel;
			case 'hybridTimeline': return HybridTimelineChannel;
			case 'globalTimeline': return GlobalTimelineChannel;
			case 'userList': return UserListChannel;
			case 'hashtag': return HashtagChannel;
			case 'roleTimeline': return RoleTimelineChannel;
			case 'antenna': return AntennaChannel;
			case 'channel': return ChannelChannel;
			case 'clip': return ClipChannel;
			case 'drive': return DriveChannel;
			case 'serverStats': return ServerStatsChannel;
			case 'queueStats': return QueueStatsChannel;
			case 'admin': return AdminChannel;
			case 'chatUser': return ChatUserChannel;
			case 'chatRoom': return ChatRoomChannel;
			case 'reversi': return ReversiChannel;
			case 'reversiGame': return ReversiGameChannel;

			default:
				throw new Error(`no such channel: ${name}`);
		}
	}

	/**
	 * チャンネルから切断
	 * @param id チャンネルコネクションID
	 */
	@bindThis
	public disconnectChannel(id: string) {
		const channel = this.channels.get(id);

		if (channel) {
			if (channel.dispose) channel.dispose();
			this.channels.delete(id);
		}
	}

	/**
	 * チャンネルへメッセージ送信要求時
	 * @param data メッセージ
	 */
	@bindThis
	private onChannelMessageRequested(data: JsonValue | undefined) {
		if (!isJsonObject(data)) return;
		if (typeof data.id !== 'string') return;
		if (typeof data.type !== 'string') return;
		if (typeof data.body === 'undefined') return;

		const channel = this.channels.get(data.id);
		if (channel != null && channel.onMessage != null) {
			channel.onMessage(data.type, data.body);
		}
	}

	/**
	 * ストリームが切れたとき
	 */
	@bindThis
	public dispose() {
		this.disposed = true;
		this.browserSessionOutputs.length = 0;
		this.browserSessionOutputBytes = 0;
		this.browserSessionInputs.length = 0;
		this.browserSessionInputBytes = 0;
		if (this.listeningSessionRevocation) this.subscriber.off('internal', this.onSessionRevoked);
		this.listeningSessionRevocation = false;
		if (this.listeningBroadcast) this.subscriber.off('broadcast', this.onBroadcastMessage);
		this.listeningBroadcast = false;
		if (this.fetchIntervalId) clearInterval(this.fetchIntervalId);
		this.fetchIntervalId = null;

		for (const c of this.channels.values()) {
			if (c.dispose) c.dispose();
		}
		this.channels.clear();

		for (const id of this.subscribingNotes.keys()) {
			this.subscriber.off(`noteStream:${id}`, this.onNoteStreamMessage);
		}
		this.subscribingNotes.clear();
	}
}

export interface ConnectionRequest {
	browserSession?: BrowserSessionIdentity,
	user: MiUser | null | undefined,
	token: MiAccessToken | null | undefined,
}

export { Connection };

/** Deliberately limited pilot routes; no client command dispatcher or note subscriptions. */
export type NativeOutputChannel = StreamChannel;
export interface NativeStreamFrame { type: string; body: JsonObject }
export interface NativeStreamOutput {
	isOpen(): boolean;
	send(frame: NativeStreamFrame): void | Promise<void>;
	failed(error: unknown): void | Promise<void>;
}

/** Filtered antenna notes only; no transport or persistence semantics implied. */
export interface AntennaNoteOutput {
	isOpen(): boolean;
	send(note: Packed<'Note'>): void | Promise<void>;
	failed(error: unknown): void | Promise<void>;
}
