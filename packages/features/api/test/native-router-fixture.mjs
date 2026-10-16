/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import { createApiRouter, createInstanceRouter, createNotesRouter, createDriveRouter,
	createStatisticsRouter, createEmojisRouter, createNotificationsRouter, createTimelinesRouter,
	createNoteSearchRouter, createUsersRouter, createRelationshipsRouter, createCollectionsRouter,
} from '../../../backend/built/features/api/pilot.js';

/** Test-only composition uses actual business handlers; unexercised feature routers are empty. */
export function composeNativeTestRouter(dependencies) {
	return createApiRouter({
		roles: {}, moderation: {}, auth: {}, portability: {}, driveManagement: {}, integrations: {},
		operations: {}, federation: {}, games: {}, play: {}, pages: {}, channels: {}, chat: {},
		discovery: {}, announcements: {}, avatarDecorations: {}, preferences: {},
		instance: createInstanceRouter(dependencies.instance),
		notes: createNotesRouter(dependencies.notes),
		drive: createDriveRouter(dependencies.drive),
		statistics: createStatisticsRouter(dependencies.statistics),
		emojis: createEmojisRouter(dependencies.emojis),
		notifications: createNotificationsRouter(dependencies.notifications),
		timelines: createTimelinesRouter(dependencies.timelines),
		noteSearch: createNoteSearchRouter(dependencies.noteSearch),
		users: createUsersRouter(dependencies.users),
		relationships: createRelationshipsRouter(dependencies.relationships),
		collections: createCollectionsRouter(dependencies.collections),
	});
}

function queryBuilder(name, events, rows = [], count = 3) {
	const query = {};
	for (const method of ['where', 'andWhere', 'orWhere', 'select', 'addSelect', 'innerJoinAndSelect',
		'leftJoinAndSelect', 'leftJoin', 'innerJoin', 'orderBy', 'limit', 'offset', 'setParameters']) {
		query[method] = (...args) => { events.push([name, method, ...args]); return query; };
	}
	query.getMany = async () => rows;
	query.getCount = async () => count;
	return query;
}

/** Domain ports are injected at construction and retain their live object identity. */
export function nativeTestDependencies({ actor, serverInfo, packedFile, chartOutput, events, uploadAtPath }) {
	const queries = { makePaginationQuery: query => query,
		generateBlockedHostQueryForNote: () => {}, generateSuspendedUserQueryForNote: () => {},
		generateUgcVisibilityQueryForVisitor: () => {}, generateMutedUserQueryForNotes: () => {},
		generateBlockedUserQueryForNotes: () => {}, generateVisibilityQuery: () => {}, generateBaseNoteFilteringQuery: () => {}, generateMutedUserRenotesQueryForNotes: () => {},
	};
	const roles = { getUserPolicies: async () => ({ gtlAvailable: true, canSearchNotes: true, canUseTranslator: true }) };
	const notes = { packMany: async (_rows, principal) => { events.push(['packedNotes', principal]); return []; },
		pack: async () => ({ isHidden: false }), isVisibleForMe: async () => true };
	const getter = { getNote: async id => ({ id, userId: actor.id, text: null, cw: null }) };
	const unusedChart = { getChart: async () => { throw Error('Unconfigured chart domain port'); } };
	const notifications = {
		generateId: () => 'subscription1', getSwPublicKey: () => null, isValidEndpoint: () => true,
		findSubscription: async query => query.endpoint === 'found' ? { id: 'subscription1', userId: actor.id,
			endpoint: 'found', auth: 'auth', publickey: 'key', sendReadMessage: false } : null,
		findSubscriptions: async () => [], insertSubscription: async () => {}, updateSubscription: async () => {},
		deleteSubscriptions: async () => {}, refreshSubscriptionCache: () => {},
		getNotifications: async () => [], packMany: async () => [], packGroupedMany: async () => [],
		createAppNotification: () => {}, createTestNotification: () => {},
		flushAllNotifications: async id => { events.push(['flush', id]); }, readAllNotification: async () => {},
	};
	return {
		instance: { now: () => 123, readEndpoints: async () => [{ name: 'ping', properties: {} }],
			getOnlineUsersCount: { thresholdMs: 300000, countSince: async () => 7 },
			serverInfo: { enabled: () => true, read: async () => serverInfo },
		},
		notes: { getNote: getter.getNote, isModerator: async () => false, findAuthor: async id => ({ id }),
			delete: async (_author, note) => { events.push(['delete', note.id]); },
			getterService: getter, noteEntityService: notes, roleService: roles, serverSettings: {},
			noteDraftsRepository: { createQueryBuilder: () => queryBuilder('draftsQuery', events) },
		},
		drive: { validateFileName: () => true, enableIpLogging: () => false,
			addFile: async options => {
				const resource = uploadAtPath(options.path);
				assert.ok(resource, 'the business handler uses a trusted staged resource');
				events.push(['upload', { file: resource.file, name: options.name, comment: options.comment,
					folderId: options.folderId, force: options.force, isSensitive: options.sensitive },
				resource.path, await resource.file.text()]);
				return options;
			},
			pack: async () => packedFile, logError: () => {},
		},
		statistics: { charts: { activeUsers: unusedChart, apRequest: unusedChart, drive: unusedChart,
			federation: unusedChart, instance: unusedChart, userDrive: unusedChart, userFollowing: unusedChart,
			userNotes: unusedChart, userPv: unusedChart, userReactions: unusedChart, users: unusedChart,
			notes: { getChart: async (span, limit, offset) => {
				events.push(['chart', { span, limit, offset: offset?.getTime() ?? null }]); return chartOutput;
			} },
		}, readNotes: async () => ({ local: 0, remote: 0 }), readUsers: async () => ({ local: 0, remote: 0 }),
			countReactions: async () => 0, countInstances: async () => 0, readRetention: async () => [],
		},
		emojis: { emojisRepository: { find: async () => [] }, emojiEntityService: { packSimpleMany: async () => [] } },
		notifications,
		timelines: { notesRepository: { createQueryBuilder: () => queryBuilder('timelineQuery', events) },
			noteEntityService: notes, queryService: queries, roleService: roles, activeUsersChart: { read: () => {} },
		},
		noteSearch: { roleService: roles, noteEntityService: notes, idService: { gen: () => 'generated1' },
			searchService: { searchNote: async (query, principal, filters, pagination) => {
				events.push(['search', query, principal, filters, pagination]); return [];
			} },
		},
		users: { 'users/achievements': { userProfilesRepository: { findOneByOrFail: async query => {
			events.push(['profile', query]); return { achievements: [] };
		} } } },
		relationships: { followingsRepository: { update: async (...args) => { events.push(['following', ...args]); } } },
		collections: { galleryPostsRepository: { createQueryBuilder: () => queryBuilder('galleryQuery', events) },
			queryService: queries, galleryPostEntityService: { packMany: async (_rows, principal) => {
				events.push(['packedGallery', principal]); return [];
			} },
		},
	};
}
