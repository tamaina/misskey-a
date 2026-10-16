/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const commandRelationshipErrors = {
	'following/requests/accept': {
		noSuchUser: { message: 'No such user.', code: 'NO_SUCH_USER', id: '66ce1645-d66c-46bb-8b79-96739af885bd' },
		noFollowRequest: { message: 'No follow request.', code: 'NO_FOLLOW_REQUEST', id: 'bcde4f8b-0913-4614-8881-614e522fb041' },
	},
	'following/requests/reject': {
		noSuchUser: { message: 'No such user.', code: 'NO_SUCH_USER', id: 'abc2ffa6-25b2-4380-ba99-321ff3a94555' },
	},
	'mute/delete': {
		noSuchUser: { message: 'No such user.', code: 'NO_SUCH_USER', id: 'b851d00b-8ab1-4a56-8b1b-e24187cb48ef' },
		muteeIsYourself: { message: 'Mutee is yourself.', code: 'MUTEE_IS_YOURSELF', id: 'f428b029-6b39-4d48-a1d2-cc1ae6dd5cf9' },
		notMuting: { message: 'You are not muting that user.', code: 'NOT_MUTING', id: '5467d020-daa9-4553-81e1-135c0c35a96d' },
	},
	'renote-mute/create': {
		noSuchUser: { message: 'No such user.', code: 'NO_SUCH_USER', id: '5e0a5dff-1e94-4202-87ae-4d9c89eb2271' },
		muteeIsYourself: { message: 'Mutee is yourself.', code: 'MUTEE_IS_YOURSELF', id: '37285718-52f7-4aef-b7de-c38b8e8a8420' },
		alreadyMuting: { message: 'You are already muting that user.', code: 'ALREADY_MUTING', id: 'ccfecbe4-1f1c-4fc2-8a3d-c3ffee61cb7b' },
	},
	'renote-mute/delete': {
		noSuchUser: { message: 'No such user.', code: 'NO_SUCH_USER', id: '9b6728cf-638c-4aa1-bedb-e07d8101474d' },
		muteeIsYourself: { message: 'Mutee is yourself.', code: 'MUTEE_IS_YOURSELF', id: '619b1314-0850-4597-a242-e245f3da42af' },
		notMuting: { message: 'You are not muting that user.', code: 'NOT_MUTING', id: '2e4ef874-8bf0-4b4b-b069-4598f6d05817' },
	},
} as const;
const commandListErrors = {
	'users/lists/delete': {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '78436795-db79-42f5-b1e2-55ea2cf19166',
		},
	},
	'users/lists/favorite': {
		noSuchList: {
			message: 'No such user list.',
			code: 'NO_SUCH_USER_LIST',
			id: '7dbaf3cf-7b42-4b8f-b431-b3919e580dbe',
		},
		alreadyFavorited: {
			message: 'The list has already been favorited.',
			code: 'ALREADY_FAVORITED',
			id: '6425bba0-985b-461e-af1b-518070e72081',
		},
	},
	'users/lists/pull': {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '7f44670e-ab16-43b8-b4c1-ccd2ee89cc02',
		},
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '588e7f72-c744-4a61-b180-d354e912bda2',
		},
	},
	'users/lists/push': {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '2214501d-ac96-4049-b717-91e42272a711',
		},
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'a89abd3d-f0bc-4cce-beb1-2f446f4f1e6a',
		},
		alreadyAdded: {
			message: 'That user has already been added to that list.',
			code: 'ALREADY_ADDED',
			id: '1de7c884-1595-49e9-857e-61f12f4d4fc5',
		},
		youHaveBeenBlocked: {
			message: 'You cannot push this user because you have been blocked by this user.',
			code: 'YOU_HAVE_BEEN_BLOCKED',
			id: '990232c5-3f9d-4d83-9f3f-ef27b6332a4b',
		},
		tooManyUsers: {
			message: 'You can not push users any more.',
			code: 'TOO_MANY_USERS',
			id: '2dd9752e-a338-413d-8eec-41814430989b',
		},
	},
	'users/lists/unfavorite': {
		noSuchList: {
			message: 'No such user list.',
			code: 'NO_SUCH_USER_LIST',
			id: 'baedb33e-76b8-4b0c-86a8-9375c0a7b94b',
		},
		notFavorited: {
			message: 'You have not favorited the list.',
			// This misspelled legacy code is part of the public API.
			code: 'ALREADY_FAVORITED',
			id: '835c4b27-463d-4cfa-969b-a9058678d465',
		},
	},
	'users/lists/update-membership': {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '7f44670e-ab16-43b8-b4c1-ccd2ee89cc02',
		},
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '588e7f72-c744-4a61-b180-d354e912bda2',
		},
	},
} as const;
export const relationshipsErrors = {
	'blocking/create': {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '7cc4f851-e2f1-4621-9633-ec9e1d00c01e',
		},

		blockeeIsYourself: {
			message: 'Blockee is yourself.',
			code: 'BLOCKEE_IS_YOURSELF',
			id: '88b19138-f28d-42c0-8499-6a31bbd0fdc6',
		},

		alreadyBlocking: {
			message: 'You are already blocking that user.',
			code: 'ALREADY_BLOCKING',
			id: '787fed64-acb9-464a-82eb-afbd745b9614',
		},
	},
	'blocking/delete': {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '8621d8bf-c358-4303-a066-5ea78610eb3f',
		},

		blockeeIsYourself: {
			message: 'Blockee is yourself.',
			code: 'BLOCKEE_IS_YOURSELF',
			id: '06f6fac6-524b-473c-a354-e97a40ae6eac',
		},

		notBlocking: {
			message: 'You are not blocking that user.',
			code: 'NOT_BLOCKING',
			id: '291b2efa-60c6-45c0-9f6a-045c8f9b02cd',
		},
	},
	'blocking/list': {},
	'following/create': {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'fcd2eef9-a9b2-4c4f-8624-038099e90aa5',
		},

		followeeIsYourself: {
			message: 'Followee is yourself.',
			code: 'FOLLOWEE_IS_YOURSELF',
			id: '26fbe7bb-a331-4857-af17-205b426669a9',
		},

		alreadyFollowing: {
			message: 'You are already following that user.',
			code: 'ALREADY_FOLLOWING',
			id: '35387507-38c7-4cb9-9197-300b93783fa0',
		},

		blocking: {
			message: 'You are blocking that user.',
			code: 'BLOCKING',
			id: '4e2206ec-aa4f-4960-b865-6c23ac38e2d9',
		},

		blocked: {
			message: 'You are blocked by that user.',
			code: 'BLOCKED',
			id: 'c4ab57cc-4e41-45e9-bfd9-584f61e35ce0',
		},
	},
	'following/delete': {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '5b12c78d-2b28-4dca-99d2-f56139b42ff8',
		},

		followeeIsYourself: {
			message: 'Followee is yourself.',
			code: 'FOLLOWEE_IS_YOURSELF',
			id: 'd9e400b9-36b0-4808-b1d8-79e707f1296c',
		},

		notFollowing: {
			message: 'You are not following that user.',
			code: 'NOT_FOLLOWING',
			id: '5dbf82f5-c92b-40b1-87d1-6c8c0741fd09',
		},
	},
	'following/invalidate': {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'b77e6ae6-a3e5-40da-9cc8-c240115479cc',
		},

		followerIsYourself: {
			message: 'Follower is yourself.',
			code: 'FOLLOWER_IS_YOURSELF',
			id: '07dc03b9-03da-422d-885b-438313707662',
		},

		notFollowing: {
			message: 'The other use is not following you.',
			code: 'NOT_FOLLOWING',
			id: '918faac3-074f-41ae-9c43-ed5d2946770d',
		},
	},
	'following/list': {},
	'following/requests/accept': commandRelationshipErrors['following/requests/accept'],
	'following/requests/cancel': {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '4e68c551-fc4c-4e46-bb41-7d4a37bf9dab',
		},

		followRequestNotFound: {
			message: 'Follow request not found.',
			code: 'FOLLOW_REQUEST_NOT_FOUND',
			id: '089b125b-d338-482a-9a09-e2622ac9f8d4',
		},
	},
	'following/requests/list': {},
	'following/requests/reject': commandRelationshipErrors['following/requests/reject'],
	'following/requests/sent': {},
	'following/update': {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '14318698-f67e-492a-99da-5353a5ac52be',
		},

		followeeIsYourself: {
			message: 'Followee is yourself.',
			code: 'FOLLOWEE_IS_YOURSELF',
			id: '4c4cbaf9-962a-463b-8418-a5e365dbf2eb',
		},

		notFollowing: {
			message: 'You are not following that user.',
			code: 'NOT_FOLLOWING',
			id: 'b8dc75cf-1cb5-46c9-b14b-5f1ffbd782c9',
		},
	},
	'following/update-all': {},
	'mute/create': {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '6fef56f3-e765-4957-88e5-c6f65329b8a5',
		},

		muteeIsYourself: {
			message: 'Mutee is yourself.',
			code: 'MUTEE_IS_YOURSELF',
			id: 'a4619cb2-5f23-484b-9301-94c903074e10',
		},

		alreadyMuting: {
			message: 'You are already muting that user.',
			code: 'ALREADY_MUTING',
			id: '7e7359cb-160c-4956-b08f-4d1c653cd007',
		},
	},
	'mute/delete': commandRelationshipErrors['mute/delete'],
	'mute/list': {},
	'renote-mute/create': commandRelationshipErrors['renote-mute/create'],
	'renote-mute/delete': commandRelationshipErrors['renote-mute/delete'],
	'renote-mute/list': {},
	'users/followers': {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '27fa5435-88ab-43de-9360-387de88727cd',
		},

		forbidden: {
			message: 'Forbidden.',
			code: 'FORBIDDEN',
			id: '3c6a84db-d619-26af-ca14-06232a21df8a',
		},
	},
	'users/following': {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '63e4aba4-4156-4e53-be25-c9559e42d71b',
		},

		forbidden: {
			message: 'Forbidden.',
			code: 'FORBIDDEN',
			id: 'f6cdb0df-c19f-ec5c-7dbb-0ba84a1f92ba',
		},

		birthdayInvalid: {
			message: 'Birthday date format is invalid.',
			code: 'BIRTHDAY_DATE_FORMAT_INVALID',
			id: 'a2b007b9-4782-4eba-abd3-93b05ed4130d',
		},
	},
	'users/get-following-users-by-birthday': {},
	'users/lists/create': {
		tooManyUserLists: {
			message: 'You cannot create user list any more.',
			code: 'TOO_MANY_USERLISTS',
			id: '0cf21a28-7715-4f39-a20d-777bfdb8d138',
		},
	},
	'users/lists/create-from-public': {
		tooManyUserLists: {
			message: 'You cannot create user list any more.',
			code: 'TOO_MANY_USERLISTS',
			id: 'e9c105b2-c595-47de-97fb-7f7c2c33e92f',
		},
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '9292f798-6175-4f7d-93f4-b6742279667d',
		},
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '13c457db-a8cb-4d88-b70a-211ceeeabb5f',
		},

		alreadyAdded: {
			message: 'That user has already been added to that list.',
			code: 'ALREADY_ADDED',
			id: 'c3ad6fdb-692b-47ee-a455-7bd12c7af615',
		},

		youHaveBeenBlocked: {
			message: 'You cannot push this user because you have been blocked by this user.',
			code: 'YOU_HAVE_BEEN_BLOCKED',
			id: 'a2497f2a-2389-439c-8626-5298540530f4',
		},

		tooManyUsers: {
			message: 'You can not push users any more.',
			code: 'TOO_MANY_USERS',
			id: '1845ea77-38d1-426e-8e4e-8b83b24f5bd7',
		},
	},
	'users/lists/delete': commandListErrors['users/lists/delete'],
	'users/lists/favorite': commandListErrors['users/lists/favorite'],
	'users/lists/get-memberships': {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '7bc05c21-1d7a-41ae-88f1-66820f4dc686',
		},
	},
	'users/lists/list': {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'a8af4a82-0980-4cc4-a6af-8b0ffd54465e',
		},
		remoteUser: {
			message: 'Not allowed to load the remote user\'s list',
			code: 'REMOTE_USER_NOT_ALLOWED',
			id: '53858f1b-3315-4a01-81b7-db9b48d4b79a',
		},
		invalidParam: {
			message: 'Invalid param.',
			code: 'INVALID_PARAM',
			id: 'ab36de0e-29e9-48cb-9732-d82f1281620d',
		},
	},
	'users/lists/pull': commandListErrors['users/lists/pull'],
	'users/lists/push': commandListErrors['users/lists/push'],
	'users/lists/show': {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '7bc05c21-1d7a-41ae-88f1-66820f4dc686',
		},
	},
	'users/lists/unfavorite': commandListErrors['users/lists/unfavorite'],
	'users/lists/update': {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '796666fe-3dff-4d39-becb-8a5932c1d5b7',
		},
	},
	'users/lists/update-membership': commandListErrors['users/lists/update-membership'],
	'users/relation': {},
} as const;
