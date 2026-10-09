/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import RE2 from 're2';
import * as mfm from 'mfm-js';
import { Inject, Injectable } from '@nestjs/common';
import * as htmlParser from 'node-html-parser';
import { extractCustomEmojisFromMfm } from '@features/emojis/backend/utility/extract-custom-emojis-from-mfm.js';
import { extractHashtags } from '@features/discovery/backend/utility/extract-hashtags.js';
import * as Acct from '@features/federation/backend/utility/acct.js';
import { normalizeForSearch } from '@features/discovery/backend/utility/normalize-for-search.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { UserFollowingService } from '@features/relationships/backend/services/UserFollowingService.js';
import { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import { HashtagService } from '@features/discovery/backend/services/HashtagService.js';
import { RolePolicies, RoleService } from '@features/roles/backend/services/RoleService.js';
import { RemoteUserResolveService } from '@features/federation/backend/services/RemoteUserResolveService.js';
import { DriveFileEntityService } from '@features/drive/backend/serializers/DriveFileEntityService.js';
import { HttpRequestService } from '@features/runtime/backend/services/HttpRequestService.js';
import { AvatarDecorationService } from '@features/avatar-decorations/backend/services/AvatarDecorationService.js';
import { ApiLoggerService } from '@features/api/backend/transport/ApiLoggerService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { CacheService } from '../../services/CacheService.js';
import { AccountUpdateService } from '../../services/AccountUpdateService.js';
import { UserEntityService } from '../../serializers/UserEntityService.js';
import { iUpdateErrors } from './update.contract.js';
import type { MiUserProfile } from '../../models/UserProfile.js';
import type { MiLocalUser, MiUser } from '../../models/User.js';
import type { UsersRepository, DriveFilesRepository, MiMeta, UserProfilesRepository, PagesRepository } from '@features/persistence/backend/repositories/models.js';
import type { UsersInputs } from '../../api.contract.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';

/** Exact profile columns written by i/update; JSON columns remain their stored entity types. */
export type UserProfileUpdatePatch = Partial<Pick<MiUserProfile,
	| 'alwaysMarkNsfw'
	| 'autoAcceptFollowed'
	| 'autoSensitive'
	| 'birthday'
	| 'carefulBot'
	| 'description'
	| 'emailNotificationTypes'
	| 'enableWordMute'
	| 'fields'
	| 'followedMessage'
	| 'followersVisibility'
	| 'followingVisibility'
	| 'hardMutedWords'
	| 'injectFeaturedNote'
	| 'lang'
	| 'location'
	| 'mutedInstances'
	| 'mutedWords'
	| 'noCrawle'
	| 'notificationRecieveConfig'
	| 'pinnedPageId'
	| 'preventAiLearning'
	| 'publicReactions'
	| 'receiveAnnouncementEmail'
	| 'verifiedLinks'
>>;

/** Preserve ordinary TypeORM calls without recursively treating stored JSON as ORM expressions. */
export type UserProfileUpdateRepository = Omit<UserProfilesRepository, 'update'> & {
	update(userId: string, patch: UserProfileUpdatePatch): Promise<import('typeorm').UpdateResult>;
};

@Injectable()
export class IUpdateOperation {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private instanceMeta: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfileUpdateRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		private userEntityService: UserEntityService,
		private driveFileEntityService: DriveFileEntityService,
		private globalEventService: GlobalEventService,
		private userFollowingService: UserFollowingService,
		private accountUpdateService: AccountUpdateService,
		private remoteUserResolveService: RemoteUserResolveService,
		private apiLoggerService: ApiLoggerService,
		private hashtagService: HashtagService,
		private roleService: RoleService,
		private cacheService: CacheService,
		private httpRequestService: HttpRequestService,
		private avatarDecorationService: AvatarDecorationService,
		private utilityService: UtilityService,
	) {
	}

	async execute(ps: UsersInputs['i/update'], _user: MiLocalUser, token: ApiToken | null, _ip: string) {
		const user = await this.usersRepository.findOneByOrFail({ id: _user.id });
		if (!isLocalUser(user)) throw new Error('Expected a local user');
		const isSecure = token == null;

		const updates: Partial<MiUser> = {};
		const profileUpdates: UserProfileUpdatePatch = {};

		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });
		let policies: RolePolicies | null = null;

		if (ps.name !== undefined) {
			if (ps.name === null) {
				updates.name = null;
			} else {
				const trimmedName = ps.name.trim();
				updates.name = trimmedName === '' ? null : trimmedName;
			}
		}
		if (ps.description !== undefined) profileUpdates.description = ps.description;
		if (ps.followedMessage !== undefined) profileUpdates.followedMessage = ps.followedMessage;
		if (ps.lang !== undefined) profileUpdates.lang = ps.lang;
		if (ps.location !== undefined) profileUpdates.location = ps.location;
		if (ps.birthday !== undefined) profileUpdates.birthday = ps.birthday;
		if (ps.followingVisibility !== undefined) profileUpdates.followingVisibility = ps.followingVisibility;
		if (ps.followersVisibility !== undefined) profileUpdates.followersVisibility = ps.followersVisibility;
		if (ps.chatScope !== undefined) updates.chatScope = ps.chatScope;

		function checkMuteWordCount(mutedWords: (string[] | string)[], limit: number) {
			const count = (arr: (string[] | string)[]) => {
				let length = 0;
				for (const item of arr) {
					if (typeof item === 'string') {
						length += item.length;
					} else if (Array.isArray(item)) {
						for (const subItem of item) {
							length += subItem.length;
						}
					}
				}
				return length;
			};
			const length = count(mutedWords);
			if (length > limit) {
				throw apiError(iUpdateErrors.tooManyMutedWords);
			}
		}

		function validateMuteWordRegex(mutedWords: (string[] | string)[]) {
			for (const mutedWord of mutedWords) {
				if (typeof mutedWord !== 'string') continue;

				const regexp = mutedWord.match(/^\/(.+)\/(.*)$/);
				if (!regexp) throw apiError(iUpdateErrors.invalidRegexp);

				try {
					new RE2(regexp[1], regexp[2]);
				} catch (_) {
					throw apiError(iUpdateErrors.invalidRegexp);
				}
			}
		}

		if (ps.mutedWords !== undefined) {
			policies ??= await this.roleService.getUserPolicies(user.id);
			checkMuteWordCount(ps.mutedWords, policies.wordMuteLimit);
			validateMuteWordRegex(ps.mutedWords);

			profileUpdates.mutedWords = ps.mutedWords;
			profileUpdates.enableWordMute = ps.mutedWords.length > 0;
		}
		if (ps.hardMutedWords !== undefined) {
			policies ??= await this.roleService.getUserPolicies(user.id);
			checkMuteWordCount(ps.hardMutedWords, policies.wordMuteLimit);
			validateMuteWordRegex(ps.hardMutedWords);
			profileUpdates.hardMutedWords = ps.hardMutedWords;
		}
		if (ps.mutedInstances !== undefined) profileUpdates.mutedInstances = ps.mutedInstances;
		if (ps.notificationRecieveConfig !== undefined) profileUpdates.notificationRecieveConfig = ps.notificationRecieveConfig;
		if (typeof ps.isLocked === 'boolean') updates.isLocked = ps.isLocked;
		if (typeof ps.isExplorable === 'boolean') updates.isExplorable = ps.isExplorable;
		if (typeof ps.hideOnlineStatus === 'boolean') updates.hideOnlineStatus = ps.hideOnlineStatus;
		if (typeof ps.publicReactions === 'boolean') profileUpdates.publicReactions = ps.publicReactions;
		if (typeof ps.isBot === 'boolean') updates.isBot = ps.isBot;
		if (typeof ps.carefulBot === 'boolean') profileUpdates.carefulBot = ps.carefulBot;
		if (typeof ps.autoAcceptFollowed === 'boolean') profileUpdates.autoAcceptFollowed = ps.autoAcceptFollowed;
		if (typeof ps.noCrawle === 'boolean') profileUpdates.noCrawle = ps.noCrawle;
		if (typeof ps.preventAiLearning === 'boolean') profileUpdates.preventAiLearning = ps.preventAiLearning;
		if (typeof ps.requireSigninToViewContents === 'boolean') updates.requireSigninToViewContents = ps.requireSigninToViewContents;
		if ((typeof ps.makeNotesFollowersOnlyBefore === 'number') || (ps.makeNotesFollowersOnlyBefore === null)) updates.makeNotesFollowersOnlyBefore = ps.makeNotesFollowersOnlyBefore;
		if ((typeof ps.makeNotesHiddenBefore === 'number') || (ps.makeNotesHiddenBefore === null)) updates.makeNotesHiddenBefore = ps.makeNotesHiddenBefore;
		if (typeof ps.isCat === 'boolean') updates.isCat = ps.isCat;
		if (typeof ps.injectFeaturedNote === 'boolean') profileUpdates.injectFeaturedNote = ps.injectFeaturedNote;
		if (typeof ps.receiveAnnouncementEmail === 'boolean') profileUpdates.receiveAnnouncementEmail = ps.receiveAnnouncementEmail;
		if (typeof ps.alwaysMarkNsfw === 'boolean') {
			policies ??= await this.roleService.getUserPolicies(user.id);
			if (policies.alwaysMarkNsfw) throw apiError(iUpdateErrors.restrictedByRole);
			profileUpdates.alwaysMarkNsfw = ps.alwaysMarkNsfw;
		}
		if (typeof ps.autoSensitive === 'boolean') profileUpdates.autoSensitive = ps.autoSensitive;
		if (ps.emailNotificationTypes !== undefined) profileUpdates.emailNotificationTypes = ps.emailNotificationTypes;

		if (ps.avatarId) {
			policies ??= await this.roleService.getUserPolicies(user.id);
			if (!policies.canUpdateBioMedia) throw apiError(iUpdateErrors.restrictedByRole);

			const avatar = await this.driveFilesRepository.findOneBy({ id: ps.avatarId });

			if (avatar == null || avatar.userId !== user.id) throw apiError(iUpdateErrors.noSuchAvatar);
			if (!avatar.type.startsWith('image/')) throw apiError(iUpdateErrors.avatarNotAnImage);

			updates.avatarId = avatar.id;
			updates.avatarUrl = this.driveFileEntityService.getPublicUrl(avatar, 'avatar');
			updates.avatarBlurhash = avatar.blurhash;
		} else if (ps.avatarId === null) {
			updates.avatarId = null;
			updates.avatarUrl = null;
			updates.avatarBlurhash = null;
		}

		if (ps.bannerId) {
			policies ??= await this.roleService.getUserPolicies(user.id);
			if (!policies.canUpdateBioMedia) throw apiError(iUpdateErrors.restrictedByRole);

			const banner = await this.driveFilesRepository.findOneBy({ id: ps.bannerId });

			if (banner == null || banner.userId !== user.id) throw apiError(iUpdateErrors.noSuchBanner);
			if (!banner.type.startsWith('image/')) throw apiError(iUpdateErrors.bannerNotAnImage);

			updates.bannerId = banner.id;
			updates.bannerUrl = this.driveFileEntityService.getPublicUrl(banner);
			updates.bannerBlurhash = banner.blurhash;
		} else if (ps.bannerId === null) {
			updates.bannerId = null;
			updates.bannerUrl = null;
			updates.bannerBlurhash = null;
		}

		if (ps.avatarDecorations) {
			policies ??= await this.roleService.getUserPolicies(user.id);
			const decorations = await this.avatarDecorationService.getAll(true);
			const myRoles = await this.roleService.getUserRoles(user.id);
			const allRoles = await this.roleService.getRoles();
			const decorationIds = decorations
				.filter(d => d.roleIdsThatCanBeUsedThisDecoration.filter(roleId => allRoles.some(r => r.id === roleId)).length === 0 || myRoles.some(r => d.roleIdsThatCanBeUsedThisDecoration.includes(r.id)))
				.map(d => d.id);

			if (ps.avatarDecorations.length > policies.avatarDecorationLimit) throw apiError(iUpdateErrors.restrictedByRole);

			updates.avatarDecorations = ps.avatarDecorations.filter(d => decorationIds.includes(d.id)).map(d => ({
				id: d.id,
				angle: d.angle ?? 0,
				flipH: d.flipH ?? false,
				offsetX: d.offsetX ?? 0,
				offsetY: d.offsetY ?? 0,
			}));
		}

		if (ps.pinnedPageId) {
			const page = await this.pagesRepository.findOneBy({ id: ps.pinnedPageId });

			if (page == null || page.userId !== user.id) throw apiError(iUpdateErrors.noSuchPage);

			profileUpdates.pinnedPageId = page.id;
		} else if (ps.pinnedPageId === null) {
			profileUpdates.pinnedPageId = null;
		}

		if (ps.fields) {
			profileUpdates.fields = ps.fields
				.filter(x => typeof x.name === 'string' && x.name.trim() !== '' && typeof x.value === 'string' && x.value.trim() !== '')
				.map(x => {
					return { name: x.name.trim(), value: x.value.trim() };
				});
		}

		if (ps.alsoKnownAs) {
			if (_user.movedToUri) {
				throw apiError({
					message: 'You have moved your account.',
					code: 'YOUR_ACCOUNT_MOVED',
					id: '56f20ec9-fd06-4fa5-841b-edd6d7d4fa31',
					status: 403,
				});
			}

			// Parse user's input into the old account
			const newAlsoKnownAs = new Set<string>();
			for (const line of ps.alsoKnownAs) {
				if (!line) throw apiError(iUpdateErrors.noSuchUser);
				const { username, host } = Acct.parse(line);

				// Retrieve the old account
				const knownAs = await this.remoteUserResolveService.resolveUser(username, host).catch((e) => {
					this.apiLoggerService.logger.warn(`failed to resolve dstination user: ${e}`);
					throw apiError(iUpdateErrors.noSuchUser);
				});
				if (knownAs.id === _user.id) throw apiError(iUpdateErrors.forbiddenToSetYourself);

				const toUrl = this.userEntityService.getUserUri(knownAs);
				if (!toUrl) throw apiError(iUpdateErrors.uriNull);

				newAlsoKnownAs.add(toUrl);
			}

			updates.alsoKnownAs = newAlsoKnownAs.size > 0 ? Array.from(newAlsoKnownAs) : null;
		}

		//#region emojis/tags

		let emojis: string[] = [];
		let tags: string[] = [];

		const newName = updates.name === undefined ? user.name : updates.name;
		const newDescription = profileUpdates.description === undefined ? profile.description : profileUpdates.description;
		const newFields = profileUpdates.fields === undefined ? profile.fields : profileUpdates.fields;
		const newFollowedMessage = profileUpdates.followedMessage === undefined ? profile.followedMessage : profileUpdates.followedMessage;

		if (newName != null) {
			let hasProhibitedWords = false;
			if (!await this.roleService.isModerator(user)) {
				hasProhibitedWords = this.utilityService.isKeyWordIncluded(newName, this.instanceMeta.prohibitedWordsForNameOfUser);
			}
			if (hasProhibitedWords) {
				throw apiError(iUpdateErrors.nameContainsProhibitedWords);
			}

			const tokens = mfm.parseSimple(newName);
			emojis = emojis.concat(extractCustomEmojisFromMfm(tokens));
		}

		if (newDescription != null) {
			const tokens = mfm.parse(newDescription);
			emojis = emojis.concat(extractCustomEmojisFromMfm(tokens));
			tags = extractHashtags(tokens).map(tag => normalizeForSearch(tag)).splice(0, 32);
		}

		for (const field of newFields) {
			const nameTokens = mfm.parseSimple(field.name);
			const valueTokens = mfm.parseSimple(field.value);
			emojis = emojis.concat([
				...extractCustomEmojisFromMfm(nameTokens),
				...extractCustomEmojisFromMfm(valueTokens),
			]);
		}

		if (newFollowedMessage != null) {
			const tokens = mfm.parse(newFollowedMessage);
			emojis = emojis.concat(extractCustomEmojisFromMfm(tokens));
		}

		updates.emojis = emojis;
		updates.tags = tags;

		// ハッシュタグ更新
		this.hashtagService.updateUsertags(user, tags);
		//#endregion

		if (Object.keys(updates).length > 0) {
			await this.usersRepository.update(user.id, updates);
			this.globalEventService.publishInternalEvent('localUserUpdated', { id: user.id });
		}

		await this.userProfilesRepository.update(user.id, {
			...profileUpdates,
			verifiedLinks: [],
		});

		const iObj = await this.userEntityService.packSelf(user.id, {
			includeSecrets: isSecure,
		});

		const updatedProfile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

		this.cacheService.userProfileCache.set(user.id, updatedProfile);

		// Publish meUpdated event
		this.globalEventService.publishMainStream(user.id, 'meUpdated', iObj);

		// 鍵垢を解除したとき、溜まっていたフォローリクエストがあるならすべて承認
		if (user.isLocked && ps.isLocked === false) {
			this.userFollowingService.acceptAllFollowRequests(user);
		}

		// フォロワーにUpdateを配信
		this.accountUpdateService.publishToFollowers(user.id);

		const urls = updatedProfile.fields.filter(x => x.value.startsWith('https://'));
		for (const url of urls) {
			this.verifyLink(url.value, user);
		}

		return iObj;
	}

	private async verifyLink(url: string, user: MiLocalUser) {
		if (!URL.canParse(url)) return;

		try {
			const html = await this.httpRequestService.getHtml(url);

			const doc = htmlParser.parse(html);

			const myLink = `${this.config.url}/@${user.username}`;

			const aEls = Array.from(doc.getElementsByTagName('a'));
			const linkEls = Array.from(doc.getElementsByTagName('link'));

			const includesMyLink = aEls.some(a => a.attributes.href === myLink);
			const includesRelMeLinks = [...aEls, ...linkEls].some(link => link.attributes.rel?.split(/\s+/).includes('me') && link.attributes.href === myLink);

			if (includesMyLink || includesRelMeLinks) {
				await this.userProfilesRepository.createQueryBuilder('profile').update()
					.where('userId = :userId', { userId: user.id })
					.set({
						verifiedLinks: () => 'array_append("verifiedLinks", :url)',
					})
					.setParameter('url', url)
					.execute();
			}
		} catch (_) {
		// なにもしない
		}
	}
}

function isLocalUser(user: MiUser): user is MiLocalUser { return user.host === null && user.uri === null; }
