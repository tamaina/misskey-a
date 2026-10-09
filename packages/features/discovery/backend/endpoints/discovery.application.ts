/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { toPackedUser, toPackedUserDetailed } from '../../../users/backend/user.schema.js';
import { HashtagsListOperation } from './hashtags/list.js';
import { HashtagsSearchOperation } from './hashtags/search.js';
import { HashtagsShowOperation } from './hashtags/show.js';
import { HashtagsTrendOperation } from './hashtags/trend.js';
import { HashtagsUsersOperation } from './hashtags/users.js';
import { NotesFeaturedOperation } from './notes/featured.js';
import { NotesSearchByTagOperation } from './notes/search-by-tag.js';
import { UsersFeaturedNotesOperation } from './users/featured-notes.js';
import { UsersGetFrequentlyRepliedUsersOperation } from './users/get-frequently-replied-users.js';
import { UsersRecommendationOperation } from './users/recommendation.js';
import { UsersSearchOperation } from './users/search.js';
import { UsersSearchByUsernameAndHostOperation } from './users/search-by-username-and-host.js';
import type { DiscoveryOperations } from './discovery.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class DiscoveryApplicationService implements DiscoveryOperations<MiLocalUser> {
	constructor(
		private readonly hashtagsList: HashtagsListOperation,
		private readonly hashtagsSearch: HashtagsSearchOperation,
		private readonly hashtagsShow: HashtagsShowOperation,
		private readonly hashtagsTrend: HashtagsTrendOperation,
		private readonly hashtagsUsers: HashtagsUsersOperation,
		private readonly notesFeatured: NotesFeaturedOperation,
		private readonly notesSearchByTag: NotesSearchByTagOperation,
		private readonly usersFeaturedNotes: UsersFeaturedNotesOperation,
		private readonly usersGetFrequentlyRepliedUsers: UsersGetFrequentlyRepliedUsersOperation,
		private readonly usersRecommendation: UsersRecommendationOperation,
		private readonly usersSearch: UsersSearchOperation,
		private readonly usersSearchByUsernameAndHost: UsersSearchByUsernameAndHostOperation,
	) {}
	'hashtags/list': DiscoveryOperations<MiLocalUser>['hashtags/list'] = (input, actor) => this.hashtagsList.execute(input, actor);
	'hashtags/search': DiscoveryOperations<MiLocalUser>['hashtags/search'] = (input, actor) => this.hashtagsSearch.execute(input, actor);
	'hashtags/show': DiscoveryOperations<MiLocalUser>['hashtags/show'] = (input, actor) => this.hashtagsShow.execute(input, actor);
	'hashtags/trend': DiscoveryOperations<MiLocalUser>['hashtags/trend'] = (input, actor) => this.hashtagsTrend.execute(input, actor);
	'hashtags/users': DiscoveryOperations<MiLocalUser>['hashtags/users'] = async (input, actor) => (await this.hashtagsUsers.execute(input, actor)).map(user => toPackedUserDetailed(user));
	'notes/featured': DiscoveryOperations<MiLocalUser>['notes/featured'] = (input, actor) => this.notesFeatured.execute(input, actor);
	'notes/search-by-tag': DiscoveryOperations<MiLocalUser>['notes/search-by-tag'] = (input, actor) => this.notesSearchByTag.execute(input, actor);
	'users/featured-notes': DiscoveryOperations<MiLocalUser>['users/featured-notes'] = (input, actor) => this.usersFeaturedNotes.execute(input, actor);
	'users/get-frequently-replied-users': DiscoveryOperations<MiLocalUser>['users/get-frequently-replied-users'] = async (input, actor) => (await this.usersGetFrequentlyRepliedUsers.execute(input, actor)).map(item => ({ user: toPackedUserDetailed(item.user), weight: item.weight }));
	'users/recommendation': DiscoveryOperations<MiLocalUser>['users/recommendation'] = async (input, actor) => (await this.usersRecommendation.execute(input, actor)).map(user => toPackedUserDetailed(user));
	'users/search': DiscoveryOperations<MiLocalUser>['users/search'] = async (input, actor) => (await this.usersSearch.execute(input, actor)).map(user => toPackedUser(user));
	'users/search-by-username-and-host': DiscoveryOperations<MiLocalUser>['users/search-by-username-and-host'] = async (input, actor) => (await this.usersSearchByUsernameAndHost.execute(input, actor)).map(user => toPackedUser(user));
}
