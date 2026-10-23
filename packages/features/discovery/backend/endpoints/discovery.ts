/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { discoveryContract } from './discovery.contract.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createHashtagsListProcedure, type HashtagsListDependencies } from './hashtags/list.js';
import { createHashtagsSearchProcedure, type HashtagsSearchDependencies } from './hashtags/search.js';
import { createHashtagsShowProcedure, type HashtagsShowDependencies } from './hashtags/show.js';
import { createHashtagsTrendProcedure, type HashtagsTrendDependencies } from './hashtags/trend.js';
import { createHashtagsUsersProcedure, type HashtagsUsersDependencies } from './hashtags/users.js';
import { createNotesFeaturedProcedure, type NotesFeaturedDependencies } from './notes/featured.js';
import { createNotesSearchByTagProcedure, type NotesSearchByTagDependencies } from './notes/search-by-tag.js';
import { createUsersFeaturedNotesProcedure, type UsersFeaturedNotesDependencies } from './users/featured-notes.js';
import { createUsersGetFrequentlyRepliedUsersProcedure, type UsersGetFrequentlyRepliedUsersDependencies } from './users/get-frequently-replied-users.js';
import { createUsersRecommendationProcedure, type UsersRecommendationDependencies } from './users/recommendation.js';
import { createUsersSearchByUsernameAndHostProcedure, type UsersSearchByUsernameAndHostDependencies } from './users/search-by-username-and-host.js';
import { createUsersSearchProcedure, type UsersSearchDependencies } from './users/search.js';
export type DiscoveryDependencies = HashtagsListDependencies & HashtagsSearchDependencies & HashtagsShowDependencies & HashtagsTrendDependencies & HashtagsUsersDependencies & NotesFeaturedDependencies & NotesSearchByTagDependencies & UsersFeaturedNotesDependencies & UsersGetFrequentlyRepliedUsersDependencies & UsersRecommendationDependencies & UsersSearchByUsernameAndHostDependencies & UsersSearchDependencies;
export function createDiscoveryRouter<Actor extends MiLocalUser>(deps: DiscoveryDependencies) {
	const hashtagsTrend = createHashtagsTrendProcedure<Actor>(deps);
	const notesFeatured = createNotesFeaturedProcedure<Actor>(deps);
	const usersFeaturedNotes = createUsersFeaturedNotesProcedure<Actor>(deps);
	return implement(discoveryContract).$context<ApiContext<Actor>>().router({
		'hashtags/list': createHashtagsListProcedure<Actor>(deps),
		'hashtags/search': createHashtagsSearchProcedure<Actor>(deps),
		'hashtags/show': createHashtagsShowProcedure<Actor>(deps),
		'hashtags/trend': hashtagsTrend.canonical,
		'hashtags/trend:get': hashtagsTrend.get,
		'hashtags/users': createHashtagsUsersProcedure<Actor>(deps),
		'notes/featured': notesFeatured.canonical,
		'notes/featured:get': notesFeatured.get,
		'notes/search-by-tag': createNotesSearchByTagProcedure<Actor>(deps),
		'users/featured-notes': usersFeaturedNotes.canonical,
		'users/featured-notes:get': usersFeaturedNotes.get,
		'users/get-frequently-replied-users': createUsersGetFrequentlyRepliedUsersProcedure<Actor>(deps),
		'users/recommendation': createUsersRecommendationProcedure<Actor>(deps),
		'users/search-by-username-and-host': createUsersSearchByUsernameAndHostProcedure<Actor>(deps),
		'users/search': createUsersSearchProcedure<Actor>(deps),
	});
}
