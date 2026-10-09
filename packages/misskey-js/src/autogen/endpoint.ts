import type {
	EmptyRequest,
	EmptyResponse,
	ChatMessagesCreateToUserRequest,
	ChatMessagesCreateToUserResponse,
	ChatMessagesCreateToRoomRequest,
	ChatMessagesCreateToRoomResponse,
	ChatMessagesDeleteRequest,
	ChatMessagesShowRequest,
	ChatMessagesShowResponse,
	ChatMessagesReactRequest,
	ChatMessagesUnreactRequest,
	ChatMessagesUserTimelineRequest,
	ChatMessagesUserTimelineResponse,
	ChatMessagesRoomTimelineRequest,
	ChatMessagesRoomTimelineResponse,
	ChatMessagesSearchRequest,
	ChatMessagesSearchResponse,
	ChatRoomsCreateRequest,
	ChatRoomsCreateResponse,
	ChatRoomsDeleteRequest,
	ChatRoomsJoinRequest,
	ChatRoomsLeaveRequest,
	ChatRoomsMuteRequest,
	ChatRoomsShowRequest,
	ChatRoomsShowResponse,
	ChatRoomsOwnedRequest,
	ChatRoomsOwnedResponse,
	ChatRoomsJoiningRequest,
	ChatRoomsJoiningResponse,
	ChatRoomsUpdateRequest,
	ChatRoomsUpdateResponse,
	ChatRoomsMembersRequest,
	ChatRoomsMembersResponse,
	ChatRoomsInvitationsCreateRequest,
	ChatRoomsInvitationsCreateResponse,
	ChatRoomsInvitationsIgnoreRequest,
	ChatRoomsInvitationsInboxRequest,
	ChatRoomsInvitationsInboxResponse,
	ChatRoomsInvitationsOutboxRequest,
	ChatRoomsInvitationsOutboxResponse,
	ChatHistoryRequest,
	ChatHistoryResponse,
	ChatReadAllRequest,
	ChannelsCreateRequest,
	ChannelsCreateResponse,
	ChannelsFavoriteRequest,
	ChannelsFeaturedRequest,
	ChannelsFeaturedResponse,
	ChannelsFollowRequest,
	ChannelsFollowedRequest,
	ChannelsFollowedResponse,
	ChannelsMyFavoritesRequest,
	ChannelsMyFavoritesResponse,
	ChannelsOwnedRequest,
	ChannelsOwnedResponse,
	ChannelsSearchRequest,
	ChannelsSearchResponse,
	ChannelsShowRequest,
	ChannelsShowResponse,
	ChannelsTimelineRequest,
	ChannelsTimelineResponse,
	ChannelsUnfavoriteRequest,
	ChannelsUnfollowRequest,
	ChannelsUpdateRequest,
	ChannelsUpdateResponse,
	ChannelsMuteCreateRequest,
	ChannelsMuteDeleteRequest,
	ChannelsMuteListRequest,
	ChannelsMuteListResponse,
	IPageLikesRequest,
	IPageLikesResponse,
	IPagesRequest,
	IPagesResponse,
	PagePushRequest,
	PagesCreateRequest,
	PagesCreateResponse,
	PagesDeleteRequest,
	PagesFeaturedRequest,
	PagesFeaturedResponse,
	PagesLikeRequest,
	PagesShowRequest,
	PagesShowResponse,
	PagesUnlikeRequest,
	PagesUpdateRequest,
	UsersPagesRequest,
	UsersPagesResponse,
	FlashCreateRequest,
	FlashCreateResponse,
	FlashDeleteRequest,
	FlashFeaturedRequest,
	FlashFeaturedResponse,
	FlashLikeRequest,
	FlashMyRequest,
	FlashMyResponse,
	FlashMyLikesRequest,
	FlashMyLikesResponse,
	FlashShowRequest,
	FlashShowResponse,
	FlashUnlikeRequest,
	FlashUpdateRequest,
	FlashSearchRequest,
	FlashSearchResponse,
	UsersFlashsRequest,
	UsersFlashsResponse,
	BubbleGameRankingRequest,
	BubbleGameRankingResponse,
	BubbleGameRegisterRequest,
	ReversiCancelMatchRequest,
	ReversiGamesRequest,
	ReversiGamesResponse,
	ReversiInvitationsRequest,
	ReversiInvitationsResponse,
	ReversiMatchRequest,
	ReversiMatchResponse,
	ReversiShowGameRequest,
	ReversiShowGameResponse,
	ReversiSurrenderRequest,
	ReversiVerifyRequest,
	ReversiVerifyResponse,
	AdminFederationDeleteAllFilesRequest,
	AdminFederationRefreshRemoteInstanceMetadataRequest,
	AdminFederationRemoveAllFollowingRequest,
	AdminFederationUpdateInstanceRequest,
	AdminRelaysAddRequest,
	AdminRelaysAddResponse,
	AdminRelaysListRequest,
	AdminRelaysListResponse,
	AdminRelaysRemoveRequest,
	ApGetRequest,
	ApGetResponse,
	ApShowRequest,
	ApShowResponse,
	FederationFollowersRequest,
	FederationFollowersResponse,
	FederationFollowingRequest,
	FederationFollowingResponse,
	FederationInstancesRequest,
	FederationInstancesResponse,
	FederationShowInstanceRequest,
	FederationShowInstanceResponse,
	FederationStatsRequest,
	FederationStatsResponse,
	FederationUpdateRemoteUserRequest,
	FederationUsersRequest,
	FederationUsersResponse,
	AdminGetIndexStatsRequest,
	AdminGetIndexStatsResponse,
	AdminGetTableStatsRequest,
	AdminGetTableStatsResponse,
	AdminQueueClearRequest,
	AdminQueueDeliverDelayedRequest,
	AdminQueueDeliverDelayedResponse,
	AdminQueueInboxDelayedRequest,
	AdminQueueInboxDelayedResponse,
	AdminQueueJobsRequest,
	AdminQueueJobsResponse,
	AdminQueuePauseRequest,
	AdminQueuePromoteJobsRequest,
	AdminQueueQueueStatsRequest,
	AdminQueueQueueStatsResponse,
	AdminQueueQueuesRequest,
	AdminQueueQueuesResponse,
	AdminQueueRemoveJobRequest,
	AdminQueueResumeRequest,
	AdminQueueRetryJobRequest,
	AdminQueueShowJobLogsRequest,
	AdminQueueShowJobLogsResponse,
	AdminQueueShowJobRequest,
	AdminQueueShowJobResponse,
	AdminQueueStatsRequest,
	AdminQueueStatsResponse,
	ResetDbRequest,
	AdminSendEmailRequest,
	AdminSystemWebhookCreateRequest,
	AdminSystemWebhookCreateResponse,
	AdminSystemWebhookDeleteRequest,
	AdminSystemWebhookListRequest,
	AdminSystemWebhookListResponse,
	AdminSystemWebhookShowRequest,
	AdminSystemWebhookShowResponse,
	AdminSystemWebhookTestRequest,
	AdminSystemWebhookUpdateRequest,
	AdminSystemWebhookUpdateResponse,
	FetchExternalResourcesRequest,
	FetchExternalResourcesResponse,
	FetchRssRequest,
	FetchRssResponse,
	IWebhooksCreateRequest,
	IWebhooksCreateResponse,
	IWebhooksDeleteRequest,
	IWebhooksListRequest,
	IWebhooksListResponse,
	IWebhooksShowRequest,
	IWebhooksShowResponse,
	IWebhooksTestRequest,
	IWebhooksUpdateRequest,
	TestRequest,
	TestResponse,
	AdminDeleteAllFilesOfAUserRequest,
	AdminDriveCleanRemoteFilesRequest,
	AdminDriveCleanupRequest,
	AdminDriveFilesRequest,
	AdminDriveFilesResponse,
	AdminDriveShowFileRequest,
	AdminDriveShowFileResponse,
	DriveRequest,
	DriveResponse,
	DriveFilesRequest,
	DriveFilesResponse,
	DriveFilesAttachedNotesRequest,
	DriveFilesAttachedNotesResponse,
	DriveFilesAttachedChatMessagesRequest,
	DriveFilesAttachedChatMessagesResponse,
	DriveFilesCheckExistenceRequest,
	DriveFilesCheckExistenceResponse,
	DriveFilesDeleteRequest,
	DriveFilesFindRequest,
	DriveFilesFindResponse,
	DriveFilesFindByHashRequest,
	DriveFilesFindByHashResponse,
	DriveFilesShowRequest,
	DriveFilesShowResponse,
	DriveFilesUpdateRequest,
	DriveFilesUpdateResponse,
	DriveFilesMoveBulkRequest,
	DriveFilesUploadFromUrlRequest,
	DriveFoldersRequest,
	DriveFoldersResponse,
	DriveFoldersCreateRequest,
	DriveFoldersCreateResponse,
	DriveFoldersDeleteRequest,
	DriveFoldersFindRequest,
	DriveFoldersFindResponse,
	DriveFoldersShowRequest,
	DriveFoldersShowResponse,
	DriveFoldersUpdateRequest,
	DriveFoldersUpdateResponse,
	DriveStreamRequest,
	DriveStreamResponse,
	IExportAntennasRequest,
	IExportBlockingRequest,
	IExportClipsRequest,
	IExportFavoritesRequest,
	IExportFollowingRequest,
	IExportMuteRequest,
	IExportNotesRequest,
	IExportUserListsRequest,
	IImportAntennasRequest,
	IImportBlockingRequest,
	IImportFollowingRequest,
	IImportMutingRequest,
	IImportUserListsRequest,
	AdminAccountsCreateRequest,
	AdminAccountsCreateResponse,
	AdminCaptchaCurrentRequest,
	AdminCaptchaCurrentResponse,
	AdminCaptchaSaveRequest,
	AdminInviteCreateRequest,
	AdminInviteCreateResponse,
	AdminInviteListRequest,
	AdminInviteListResponse,
	AdminResetPasswordRequest,
	AdminResetPasswordResponse,
	AdminUnsetMfaRequest,
	AppCreateRequest,
	AppCreateResponse,
	AppShowRequest,
	AppShowResponse,
	AuthAcceptRequest,
	AuthSessionGenerateRequest,
	AuthSessionGenerateResponse,
	AuthSessionShowRequest,
	AuthSessionShowResponse,
	AuthSessionUserkeyRequest,
	AuthSessionUserkeyResponse,
	EmailAddressAvailableRequest,
	EmailAddressAvailableResponse,
	I2faDoneRequest,
	I2faDoneResponse,
	I2faKeyDoneRequest,
	I2faKeyDoneResponse,
	I2faPasswordLessRequest,
	I2faRegisterRequest,
	I2faRegisterResponse,
	I2faRegisterKeyRequest,
	I2faRegisterKeyResponse,
	I2faRemoveKeyRequest,
	I2faRemoveKeyResponse,
	I2faUnregisterRequest,
	I2faUpdateKeyRequest,
	I2faUpdateKeyResponse,
	IAppsRequest,
	IAppsResponse,
	IAuthorizedAppsRequest,
	IAuthorizedAppsResponse,
	IChangePasswordRequest,
	IRegenerateTokenRequest,
	IRevokeTokenRequest,
	ISigninHistoryRequest,
	ISigninHistoryResponse,
	IUpdateEmailRequest,
	IUpdateEmailResponse,
	InviteCreateRequest,
	InviteCreateResponse,
	InviteDeleteRequest,
	InviteLimitRequest,
	InviteLimitResponse,
	InviteListRequest,
	InviteListResponse,
	MiauthGenTokenRequest,
	MiauthGenTokenResponse,
	MyAppsRequest,
	MyAppsResponse,
	RequestResetPasswordRequest,
	ResetPasswordRequest,
	UsernameAvailableRequest,
	UsernameAvailableResponse,
	VerifyEmailRequest,
	AdminAbuseReportNotificationRecipientCreateRequest,
	AdminAbuseReportNotificationRecipientCreateResponse,
	AdminAbuseReportNotificationRecipientDeleteRequest,
	AdminAbuseReportNotificationRecipientListRequest,
	AdminAbuseReportNotificationRecipientListResponse,
	AdminAbuseReportNotificationRecipientShowRequest,
	AdminAbuseReportNotificationRecipientShowResponse,
	AdminAbuseReportNotificationRecipientUpdateRequest,
	AdminAbuseReportNotificationRecipientUpdateResponse,
	AdminAbuseUserReportsRequest,
	AdminAbuseUserReportsResponse,
	AdminForwardAbuseUserReportRequest,
	AdminGetUserIpsRequest,
	AdminGetUserIpsResponse,
	AdminResolveAbuseUserReportRequest,
	AdminShowModerationLogsRequest,
	AdminShowModerationLogsResponse,
	AdminShowUserRequest,
	AdminShowUserResponse,
	AdminShowUsersRequest,
	AdminShowUsersResponse,
	AdminSuspendUserRequest,
	AdminUnsetUserAvatarRequest,
	AdminUnsetUserBannerRequest,
	AdminUnsuspendUserRequest,
	AdminUpdateAbuseUserReportRequest,
	AdminUpdateUserNoteRequest,
	UsersReportAbuseRequest,
	AdminRolesAssignRequest,
	AdminRolesCreateRequest,
	AdminRolesCreateResponse,
	AdminRolesDeleteRequest,
	AdminRolesListRequest,
	AdminRolesListResponse,
	AdminRolesShowRequest,
	AdminRolesShowResponse,
	AdminRolesUnassignRequest,
	AdminRolesUpdateRequest,
	AdminRolesUpdateDefaultPoliciesRequest,
	AdminRolesUsersRequest,
	AdminRolesUsersResponse,
	RolesListRequest,
	RolesListResponse,
	RolesNotesRequest,
	RolesNotesResponse,
	RolesShowRequest,
	RolesShowResponse,
	RolesUsersRequest,
	RolesUsersResponse,
	ServerInfoRequest,
	ServerInfoResponse,
	AdminAdCreateRequest,
	AdminAdCreateResponse,
	AdminAdDeleteRequest,
	AdminAdListRequest,
	AdminAdListResponse,
	AdminAdUpdateRequest,
	AdminMetaRequest,
	AdminMetaResponse,
	AdminServerInfoRequest,
	AdminServerInfoResponse,
	AdminUpdateMetaRequest,
	EndpointRequest,
	EndpointResponse,
	EndpointsRequest,
	EndpointsResponse,
	GetOnlineUsersCountRequest,
	GetOnlineUsersCountResponse,
	MetaRequest,
	MetaResponse,
	PingRequest,
	PingResponse,
	PinnedUsersRequest,
	PinnedUsersResponse,
	ChartsActiveUsersRequest,
	ChartsActiveUsersResponse,
	ChartsApRequestRequest,
	ChartsApRequestResponse,
	ChartsDriveRequest,
	ChartsDriveResponse,
	ChartsFederationRequest,
	ChartsFederationResponse,
	ChartsInstanceRequest,
	ChartsInstanceResponse,
	ChartsNotesRequest,
	ChartsNotesResponse,
	ChartsUserDriveRequest,
	ChartsUserDriveResponse,
	ChartsUserFollowingRequest,
	ChartsUserFollowingResponse,
	ChartsUserNotesRequest,
	ChartsUserNotesResponse,
	ChartsUserPvRequest,
	ChartsUserPvResponse,
	ChartsUserReactionsRequest,
	ChartsUserReactionsResponse,
	ChartsUsersRequest,
	ChartsUsersResponse,
	RetentionRequest,
	RetentionResponse,
	StatsRequest,
	StatsResponse,
	HashtagsListRequest,
	HashtagsListResponse,
	HashtagsSearchRequest,
	HashtagsSearchResponse,
	HashtagsShowRequest,
	HashtagsShowResponse,
	HashtagsTrendRequest,
	HashtagsTrendResponse,
	HashtagsUsersRequest,
	HashtagsUsersResponse,
	NotesFeaturedRequest,
	NotesFeaturedResponse,
	NotesSearchByTagRequest,
	NotesSearchByTagResponse,
	UsersFeaturedNotesRequest,
	UsersFeaturedNotesResponse,
	UsersGetFrequentlyRepliedUsersRequest,
	UsersGetFrequentlyRepliedUsersResponse,
	UsersRecommendationRequest,
	UsersRecommendationResponse,
	UsersSearchRequest,
	UsersSearchResponse,
	UsersSearchByUsernameAndHostRequest,
	UsersSearchByUsernameAndHostResponse,
	AdminAnnouncementsCreateRequest,
	AdminAnnouncementsCreateResponse,
	AdminAnnouncementsDeleteRequest,
	AdminAnnouncementsListRequest,
	AdminAnnouncementsListResponse,
	AdminAnnouncementsUpdateRequest,
	AnnouncementsRequest,
	AnnouncementsResponse,
	AnnouncementsShowRequest,
	AnnouncementsShowResponse,
	IReadAnnouncementRequest,
	AdminAvatarDecorationsCreateRequest,
	AdminAvatarDecorationsCreateResponse,
	AdminAvatarDecorationsDeleteRequest,
	AdminAvatarDecorationsListRequest,
	AdminAvatarDecorationsListResponse,
	AdminAvatarDecorationsUpdateRequest,
	GetAvatarDecorationsRequest,
	GetAvatarDecorationsResponse,
	IRegistryGetRequest,
	IRegistryGetResponse,
	IRegistryGetAllRequest,
	IRegistryGetAllResponse,
	IRegistryGetDetailRequest,
	IRegistryGetDetailResponse,
	IRegistryKeysRequest,
	IRegistryKeysResponse,
	IRegistryKeysWithTypeRequest,
	IRegistryKeysWithTypeResponse,
	IRegistryRemoveRequest,
	IRegistryScopesWithDomainRequest,
	IRegistryScopesWithDomainResponse,
	IRegistrySetRequest,
	AdminEmojiAddRequest,
	AdminEmojiAddResponse,
	AdminEmojiAddAliasesBulkRequest,
	AdminEmojiCopyRequest,
	AdminEmojiCopyResponse,
	AdminEmojiDeleteRequest,
	AdminEmojiDeleteBulkRequest,
	AdminEmojiImportZipRequest,
	AdminEmojiListRequest,
	AdminEmojiListResponse,
	AdminEmojiListRemoteRequest,
	AdminEmojiListRemoteResponse,
	AdminEmojiRemoveAliasesBulkRequest,
	AdminEmojiSetAliasesBulkRequest,
	AdminEmojiSetCategoryBulkRequest,
	AdminEmojiSetLicenseBulkRequest,
	AdminEmojiUpdateRequest,
	EmojiRequest,
	EmojiResponse,
	EmojisRequest,
	EmojisResponse,
	ExportCustomEmojisRequest,
	V2AdminEmojiListRequest,
	V2AdminEmojiListResponse,
	INotificationsRequest,
	INotificationsResponse,
	INotificationsGroupedRequest,
	INotificationsGroupedResponse,
	NotificationsCreateRequest,
	NotificationsFlushRequest,
	NotificationsMarkAllAsReadRequest,
	NotificationsTestNotificationRequest,
	SwRegisterRequest,
	SwRegisterResponse,
	SwShowRegistrationRequest,
	SwShowRegistrationResponse,
	SwUnregisterRequest,
	SwUpdateRegistrationRequest,
	SwUpdateRegistrationResponse,
	NotesDeleteRequest,
	AdminPromoCreateRequest,
	IPinRequest,
	IPinResponse,
	IUnpinRequest,
	IUnpinResponse,
	NotesRequest,
	NotesResponse,
	NotesChildrenRequest,
	NotesChildrenResponse,
	NotesConversationRequest,
	NotesConversationResponse,
	NotesCreateRequest,
	NotesCreateResponse,
	NotesDraftsListRequest,
	NotesDraftsListResponse,
	NotesDraftsCreateRequest,
	NotesDraftsCreateResponse,
	NotesDraftsDeleteRequest,
	NotesDraftsUpdateRequest,
	NotesDraftsUpdateResponse,
	NotesDraftsCountRequest,
	NotesDraftsCountResponse,
	NotesPollsRecommendationRequest,
	NotesPollsRecommendationResponse,
	NotesPollsVoteRequest,
	NotesReactionsRequest,
	NotesReactionsResponse,
	NotesReactionsCreateRequest,
	NotesReactionsDeleteRequest,
	NotesRenotesRequest,
	NotesRenotesResponse,
	NotesRepliesRequest,
	NotesRepliesResponse,
	NotesShowRequest,
	NotesShowResponse,
	NotesShowPartialBulkRequest,
	NotesShowPartialBulkResponse,
	NotesStateRequest,
	NotesStateResponse,
	NotesThreadMutingCreateRequest,
	NotesThreadMutingDeleteRequest,
	NotesTranslateRequest,
	NotesTranslateResponse,
	NotesUnrenoteRequest,
	PromoReadRequest,
	UsersReactionsRequest,
	UsersReactionsResponse,
	AdminAccountsDeleteRequest,
	AdminAccountsFindByEmailRequest,
	AdminAccountsFindByEmailResponse,
	AdminDeleteAccountRequest,
	AdminUpdateProxyAccountRequest,
	AdminUpdateProxyAccountResponse,
	IRequest,
	IResponse,
	IClaimAchievementRequest,
	IDeleteAccountRequest,
	IMoveRequest,
	IMoveResponse,
	IUpdateRequest,
	IUpdateResponse,
	UsersRequest,
	UsersResponse,
	UsersAchievementsRequest,
	UsersAchievementsResponse,
	UsersShowRequest,
	UsersShowResponse,
	UsersUpdateMemoRequest,
	AntennasCreateRequest,
	AntennasCreateResponse,
	AntennasDeleteRequest,
	AntennasListRequest,
	AntennasListResponse,
	AntennasNotesRequest,
	AntennasNotesResponse,
	AntennasRemoveNoteRequest,
	AntennasShowRequest,
	AntennasShowResponse,
	AntennasUpdateRequest,
	AntennasUpdateResponse,
	NotesGlobalTimelineRequest,
	NotesGlobalTimelineResponse,
	NotesHybridTimelineRequest,
	NotesHybridTimelineResponse,
	NotesLocalTimelineRequest,
	NotesLocalTimelineResponse,
	NotesMentionsRequest,
	NotesMentionsResponse,
	NotesTimelineRequest,
	NotesTimelineResponse,
	NotesUserListTimelineRequest,
	NotesUserListTimelineResponse,
	UsersNotesRequest,
	UsersNotesResponse,
	NotesSearchRequest,
	NotesSearchResponse,
	BlockingCreateRequest,
	BlockingCreateResponse,
	BlockingDeleteRequest,
	BlockingDeleteResponse,
	BlockingListRequest,
	BlockingListResponse,
	FollowingCreateRequest,
	FollowingCreateResponse,
	FollowingDeleteRequest,
	FollowingDeleteResponse,
	FollowingInvalidateRequest,
	FollowingInvalidateResponse,
	FollowingListRequest,
	FollowingListResponse,
	FollowingRequestsAcceptRequest,
	FollowingRequestsCancelRequest,
	FollowingRequestsCancelResponse,
	FollowingRequestsListRequest,
	FollowingRequestsListResponse,
	FollowingRequestsRejectRequest,
	FollowingRequestsSentRequest,
	FollowingRequestsSentResponse,
	FollowingUpdateRequest,
	FollowingUpdateResponse,
	FollowingUpdateAllRequest,
	MuteCreateRequest,
	MuteDeleteRequest,
	MuteListRequest,
	MuteListResponse,
	RenoteMuteCreateRequest,
	RenoteMuteDeleteRequest,
	RenoteMuteListRequest,
	RenoteMuteListResponse,
	UsersFollowersRequest,
	UsersFollowersResponse,
	UsersFollowingRequest,
	UsersFollowingResponse,
	UsersGetFollowingUsersByBirthdayRequest,
	UsersGetFollowingUsersByBirthdayResponse,
	UsersListsCreateRequest,
	UsersListsCreateResponse,
	UsersListsCreateFromPublicRequest,
	UsersListsCreateFromPublicResponse,
	UsersListsDeleteRequest,
	UsersListsFavoriteRequest,
	UsersListsGetMembershipsRequest,
	UsersListsGetMembershipsResponse,
	UsersListsListRequest,
	UsersListsListResponse,
	UsersListsPullRequest,
	UsersListsPushRequest,
	UsersListsShowRequest,
	UsersListsShowResponse,
	UsersListsUnfavoriteRequest,
	UsersListsUpdateRequest,
	UsersListsUpdateResponse,
	UsersListsUpdateMembershipRequest,
	UsersRelationRequest,
	UsersRelationResponse,
	ClipsAddNoteRequest,
	ClipsCreateRequest,
	ClipsCreateResponse,
	ClipsDeleteRequest,
	ClipsFavoriteRequest,
	ClipsListRequest,
	ClipsListResponse,
	ClipsMyFavoritesRequest,
	ClipsMyFavoritesResponse,
	ClipsNotesRequest,
	ClipsNotesResponse,
	ClipsRemoveNoteRequest,
	ClipsShowRequest,
	ClipsShowResponse,
	ClipsUnfavoriteRequest,
	ClipsUpdateRequest,
	ClipsUpdateResponse,
	GalleryFeaturedRequest,
	GalleryFeaturedResponse,
	GalleryPopularRequest,
	GalleryPopularResponse,
	GalleryPostsRequest,
	GalleryPostsResponse,
	GalleryPostsCreateRequest,
	GalleryPostsCreateResponse,
	GalleryPostsDeleteRequest,
	GalleryPostsLikeRequest,
	GalleryPostsShowRequest,
	GalleryPostsShowResponse,
	GalleryPostsUnlikeRequest,
	GalleryPostsUpdateRequest,
	GalleryPostsUpdateResponse,
	IFavoritesRequest,
	IFavoritesResponse,
	IGalleryLikesRequest,
	IGalleryLikesResponse,
	IGalleryPostsRequest,
	IGalleryPostsResponse,
	NotesClipsRequest,
	NotesClipsResponse,
	NotesFavoritesCreateRequest,
	NotesFavoritesDeleteRequest,
	UsersClipsRequest,
	UsersClipsResponse,
	UsersGalleryPostsRequest,
	UsersGalleryPostsResponse,
	DriveFilesCreateRequest,
	DriveFilesCreateResponse,
	SignupRequest,
	SignupResponse,
	SignupPendingRequest,
	SignupPendingResponse,
	SigninFlowRequest,
	SigninFlowResponse,
	SigninWithPasskeyRequest,
	SigninWithPasskeyResponse,
} from './entities.js';

export type Endpoints = {
	'clear-browser-cache': { req: EmptyRequest; res: EmptyResponse };
	'chat/messages/create-to-user': { req: ChatMessagesCreateToUserRequest; res: ChatMessagesCreateToUserResponse };
	'chat/messages/create-to-room': { req: ChatMessagesCreateToRoomRequest; res: ChatMessagesCreateToRoomResponse };
	'chat/messages/delete': { req: ChatMessagesDeleteRequest; res: EmptyResponse };
	'chat/messages/show': { req: ChatMessagesShowRequest; res: ChatMessagesShowResponse };
	'chat/messages/react': { req: ChatMessagesReactRequest; res: EmptyResponse };
	'chat/messages/unreact': { req: ChatMessagesUnreactRequest; res: EmptyResponse };
	'chat/messages/user-timeline': { req: ChatMessagesUserTimelineRequest; res: ChatMessagesUserTimelineResponse };
	'chat/messages/room-timeline': { req: ChatMessagesRoomTimelineRequest; res: ChatMessagesRoomTimelineResponse };
	'chat/messages/search': { req: ChatMessagesSearchRequest; res: ChatMessagesSearchResponse };
	'chat/rooms/create': { req: ChatRoomsCreateRequest; res: ChatRoomsCreateResponse };
	'chat/rooms/delete': { req: ChatRoomsDeleteRequest; res: EmptyResponse };
	'chat/rooms/join': { req: ChatRoomsJoinRequest; res: EmptyResponse };
	'chat/rooms/leave': { req: ChatRoomsLeaveRequest; res: EmptyResponse };
	'chat/rooms/mute': { req: ChatRoomsMuteRequest; res: EmptyResponse };
	'chat/rooms/show': { req: ChatRoomsShowRequest; res: ChatRoomsShowResponse };
	'chat/rooms/owned': { req: ChatRoomsOwnedRequest; res: ChatRoomsOwnedResponse };
	'chat/rooms/joining': { req: ChatRoomsJoiningRequest; res: ChatRoomsJoiningResponse };
	'chat/rooms/update': { req: ChatRoomsUpdateRequest; res: ChatRoomsUpdateResponse };
	'chat/rooms/members': { req: ChatRoomsMembersRequest; res: ChatRoomsMembersResponse };
	'chat/rooms/invitations/create': { req: ChatRoomsInvitationsCreateRequest; res: ChatRoomsInvitationsCreateResponse };
	'chat/rooms/invitations/ignore': { req: ChatRoomsInvitationsIgnoreRequest; res: EmptyResponse };
	'chat/rooms/invitations/inbox': { req: ChatRoomsInvitationsInboxRequest; res: ChatRoomsInvitationsInboxResponse };
	'chat/rooms/invitations/outbox': { req: ChatRoomsInvitationsOutboxRequest; res: ChatRoomsInvitationsOutboxResponse };
	'chat/history': { req: ChatHistoryRequest; res: ChatHistoryResponse };
	'chat/read-all': { req: ChatReadAllRequest; res: EmptyResponse };
	'channels/create': { req: ChannelsCreateRequest; res: ChannelsCreateResponse };
	'channels/favorite': { req: ChannelsFavoriteRequest; res: EmptyResponse };
	'channels/featured': { req: ChannelsFeaturedRequest; res: ChannelsFeaturedResponse };
	'channels/follow': { req: ChannelsFollowRequest; res: EmptyResponse };
	'channels/followed': { req: ChannelsFollowedRequest; res: ChannelsFollowedResponse };
	'channels/my-favorites': { req: ChannelsMyFavoritesRequest; res: ChannelsMyFavoritesResponse };
	'channels/owned': { req: ChannelsOwnedRequest; res: ChannelsOwnedResponse };
	'channels/search': { req: ChannelsSearchRequest; res: ChannelsSearchResponse };
	'channels/show': { req: ChannelsShowRequest; res: ChannelsShowResponse };
	'channels/timeline': { req: ChannelsTimelineRequest; res: ChannelsTimelineResponse };
	'channels/unfavorite': { req: ChannelsUnfavoriteRequest; res: EmptyResponse };
	'channels/unfollow': { req: ChannelsUnfollowRequest; res: EmptyResponse };
	'channels/update': { req: ChannelsUpdateRequest; res: ChannelsUpdateResponse };
	'channels/mute/create': { req: ChannelsMuteCreateRequest; res: EmptyResponse };
	'channels/mute/delete': { req: ChannelsMuteDeleteRequest; res: EmptyResponse };
	'channels/mute/list': { req: ChannelsMuteListRequest; res: ChannelsMuteListResponse };
	'i/page-likes': { req: IPageLikesRequest; res: IPageLikesResponse };
	'i/pages': { req: IPagesRequest; res: IPagesResponse };
	'page-push': { req: PagePushRequest; res: EmptyResponse };
	'pages/create': { req: PagesCreateRequest; res: PagesCreateResponse };
	'pages/delete': { req: PagesDeleteRequest; res: EmptyResponse };
	'pages/featured': { req: PagesFeaturedRequest; res: PagesFeaturedResponse };
	'pages/like': { req: PagesLikeRequest; res: EmptyResponse };
	'pages/show': { req: PagesShowRequest; res: PagesShowResponse };
	'pages/unlike': { req: PagesUnlikeRequest; res: EmptyResponse };
	'pages/update': { req: PagesUpdateRequest; res: EmptyResponse };
	'users/pages': { req: UsersPagesRequest; res: UsersPagesResponse };
	'flash/create': { req: FlashCreateRequest; res: FlashCreateResponse };
	'flash/delete': { req: FlashDeleteRequest; res: EmptyResponse };
	'flash/featured': { req: FlashFeaturedRequest; res: FlashFeaturedResponse };
	'flash/like': { req: FlashLikeRequest; res: EmptyResponse };
	'flash/my': { req: FlashMyRequest; res: FlashMyResponse };
	'flash/my-likes': { req: FlashMyLikesRequest; res: FlashMyLikesResponse };
	'flash/show': { req: FlashShowRequest; res: FlashShowResponse };
	'flash/unlike': { req: FlashUnlikeRequest; res: EmptyResponse };
	'flash/update': { req: FlashUpdateRequest; res: EmptyResponse };
	'flash/search': { req: FlashSearchRequest; res: FlashSearchResponse };
	'users/flashs': { req: UsersFlashsRequest; res: UsersFlashsResponse };
	'bubble-game/ranking': { req: BubbleGameRankingRequest; res: BubbleGameRankingResponse };
	'bubble-game/register': { req: BubbleGameRegisterRequest; res: EmptyResponse };
	'reversi/cancel-match': { req: ReversiCancelMatchRequest; res: EmptyResponse };
	'reversi/games': { req: ReversiGamesRequest; res: ReversiGamesResponse };
	'reversi/invitations': { req: ReversiInvitationsRequest; res: ReversiInvitationsResponse };
	'reversi/match': { req: ReversiMatchRequest; res: ReversiMatchResponse };
	'reversi/show-game': { req: ReversiShowGameRequest; res: ReversiShowGameResponse };
	'reversi/surrender': { req: ReversiSurrenderRequest; res: EmptyResponse };
	'reversi/verify': { req: ReversiVerifyRequest; res: ReversiVerifyResponse };
	'admin/federation/delete-all-files': { req: AdminFederationDeleteAllFilesRequest; res: EmptyResponse };
	'admin/federation/refresh-remote-instance-metadata': { req: AdminFederationRefreshRemoteInstanceMetadataRequest; res: EmptyResponse };
	'admin/federation/remove-all-following': { req: AdminFederationRemoveAllFollowingRequest; res: EmptyResponse };
	'admin/federation/update-instance': { req: AdminFederationUpdateInstanceRequest; res: EmptyResponse };
	'admin/relays/add': { req: AdminRelaysAddRequest; res: AdminRelaysAddResponse };
	'admin/relays/list': { req: AdminRelaysListRequest; res: AdminRelaysListResponse };
	'admin/relays/remove': { req: AdminRelaysRemoveRequest; res: EmptyResponse };
	'ap/get': { req: ApGetRequest; res: ApGetResponse };
	'ap/show': { req: ApShowRequest; res: ApShowResponse };
	'federation/followers': { req: FederationFollowersRequest; res: FederationFollowersResponse };
	'federation/following': { req: FederationFollowingRequest; res: FederationFollowingResponse };
	'federation/instances': { req: FederationInstancesRequest; res: FederationInstancesResponse };
	'federation/show-instance': { req: FederationShowInstanceRequest; res: FederationShowInstanceResponse };
	'federation/stats': { req: FederationStatsRequest; res: FederationStatsResponse };
	'federation/update-remote-user': { req: FederationUpdateRemoteUserRequest; res: EmptyResponse };
	'federation/users': { req: FederationUsersRequest; res: FederationUsersResponse };
	'admin/get-index-stats': { req: AdminGetIndexStatsRequest; res: AdminGetIndexStatsResponse };
	'admin/get-table-stats': { req: AdminGetTableStatsRequest; res: AdminGetTableStatsResponse };
	'admin/queue/clear': { req: AdminQueueClearRequest; res: EmptyResponse };
	'admin/queue/deliver-delayed': { req: AdminQueueDeliverDelayedRequest; res: AdminQueueDeliverDelayedResponse };
	'admin/queue/inbox-delayed': { req: AdminQueueInboxDelayedRequest; res: AdminQueueInboxDelayedResponse };
	'admin/queue/jobs': { req: AdminQueueJobsRequest; res: AdminQueueJobsResponse };
	'admin/queue/pause': { req: AdminQueuePauseRequest; res: EmptyResponse };
	'admin/queue/promote-jobs': { req: AdminQueuePromoteJobsRequest; res: EmptyResponse };
	'admin/queue/queue-stats': { req: AdminQueueQueueStatsRequest; res: AdminQueueQueueStatsResponse };
	'admin/queue/queues': { req: AdminQueueQueuesRequest; res: AdminQueueQueuesResponse };
	'admin/queue/remove-job': { req: AdminQueueRemoveJobRequest; res: EmptyResponse };
	'admin/queue/resume': { req: AdminQueueResumeRequest; res: EmptyResponse };
	'admin/queue/retry-job': { req: AdminQueueRetryJobRequest; res: EmptyResponse };
	'admin/queue/show-job-logs': { req: AdminQueueShowJobLogsRequest; res: AdminQueueShowJobLogsResponse };
	'admin/queue/show-job': { req: AdminQueueShowJobRequest; res: AdminQueueShowJobResponse };
	'admin/queue/stats': { req: AdminQueueStatsRequest; res: AdminQueueStatsResponse };
	'reset-db': { req: ResetDbRequest; res: EmptyResponse };
	'admin/send-email': { req: AdminSendEmailRequest; res: EmptyResponse };
	'admin/system-webhook/create': { req: AdminSystemWebhookCreateRequest; res: AdminSystemWebhookCreateResponse };
	'admin/system-webhook/delete': { req: AdminSystemWebhookDeleteRequest; res: EmptyResponse };
	'admin/system-webhook/list': { req: AdminSystemWebhookListRequest; res: AdminSystemWebhookListResponse };
	'admin/system-webhook/show': { req: AdminSystemWebhookShowRequest; res: AdminSystemWebhookShowResponse };
	'admin/system-webhook/test': { req: AdminSystemWebhookTestRequest; res: EmptyResponse };
	'admin/system-webhook/update': { req: AdminSystemWebhookUpdateRequest; res: AdminSystemWebhookUpdateResponse };
	'fetch-external-resources': { req: FetchExternalResourcesRequest; res: FetchExternalResourcesResponse };
	'fetch-rss': { req: FetchRssRequest; res: FetchRssResponse };
	'i/webhooks/create': { req: IWebhooksCreateRequest; res: IWebhooksCreateResponse };
	'i/webhooks/delete': { req: IWebhooksDeleteRequest; res: EmptyResponse };
	'i/webhooks/list': { req: IWebhooksListRequest; res: IWebhooksListResponse };
	'i/webhooks/show': { req: IWebhooksShowRequest; res: IWebhooksShowResponse };
	'i/webhooks/test': { req: IWebhooksTestRequest; res: EmptyResponse };
	'i/webhooks/update': { req: IWebhooksUpdateRequest; res: EmptyResponse };
	'test': { req: TestRequest; res: TestResponse };
	'admin/delete-all-files-of-a-user': { req: AdminDeleteAllFilesOfAUserRequest; res: EmptyResponse };
	'admin/drive/clean-remote-files': { req: AdminDriveCleanRemoteFilesRequest; res: EmptyResponse };
	'admin/drive/cleanup': { req: AdminDriveCleanupRequest; res: EmptyResponse };
	'admin/drive/files': { req: AdminDriveFilesRequest; res: AdminDriveFilesResponse };
	'admin/drive/show-file': { req: AdminDriveShowFileRequest; res: AdminDriveShowFileResponse };
	'drive': { req: DriveRequest; res: DriveResponse };
	'drive/files': { req: DriveFilesRequest; res: DriveFilesResponse };
	'drive/files/attached-notes': { req: DriveFilesAttachedNotesRequest; res: DriveFilesAttachedNotesResponse };
	'drive/files/attached-chat-messages': { req: DriveFilesAttachedChatMessagesRequest; res: DriveFilesAttachedChatMessagesResponse };
	'drive/files/check-existence': { req: DriveFilesCheckExistenceRequest; res: DriveFilesCheckExistenceResponse };
	'drive/files/delete': { req: DriveFilesDeleteRequest; res: EmptyResponse };
	'drive/files/find': { req: DriveFilesFindRequest; res: DriveFilesFindResponse };
	'drive/files/find-by-hash': { req: DriveFilesFindByHashRequest; res: DriveFilesFindByHashResponse };
	'drive/files/show': { req: DriveFilesShowRequest; res: DriveFilesShowResponse };
	'drive/files/update': { req: DriveFilesUpdateRequest; res: DriveFilesUpdateResponse };
	'drive/files/move-bulk': { req: DriveFilesMoveBulkRequest; res: EmptyResponse };
	'drive/files/upload-from-url': { req: DriveFilesUploadFromUrlRequest; res: EmptyResponse };
	'drive/folders': { req: DriveFoldersRequest; res: DriveFoldersResponse };
	'drive/folders/create': { req: DriveFoldersCreateRequest; res: DriveFoldersCreateResponse };
	'drive/folders/delete': { req: DriveFoldersDeleteRequest; res: EmptyResponse };
	'drive/folders/find': { req: DriveFoldersFindRequest; res: DriveFoldersFindResponse };
	'drive/folders/show': { req: DriveFoldersShowRequest; res: DriveFoldersShowResponse };
	'drive/folders/update': { req: DriveFoldersUpdateRequest; res: DriveFoldersUpdateResponse };
	'drive/stream': { req: DriveStreamRequest; res: DriveStreamResponse };
	'i/export-antennas': { req: IExportAntennasRequest; res: EmptyResponse };
	'i/export-blocking': { req: IExportBlockingRequest; res: EmptyResponse };
	'i/export-clips': { req: IExportClipsRequest; res: EmptyResponse };
	'i/export-favorites': { req: IExportFavoritesRequest; res: EmptyResponse };
	'i/export-following': { req: IExportFollowingRequest; res: EmptyResponse };
	'i/export-mute': { req: IExportMuteRequest; res: EmptyResponse };
	'i/export-notes': { req: IExportNotesRequest; res: EmptyResponse };
	'i/export-user-lists': { req: IExportUserListsRequest; res: EmptyResponse };
	'i/import-antennas': { req: IImportAntennasRequest; res: EmptyResponse };
	'i/import-blocking': { req: IImportBlockingRequest; res: EmptyResponse };
	'i/import-following': { req: IImportFollowingRequest; res: EmptyResponse };
	'i/import-muting': { req: IImportMutingRequest; res: EmptyResponse };
	'i/import-user-lists': { req: IImportUserListsRequest; res: EmptyResponse };
	'admin/accounts/create': { req: AdminAccountsCreateRequest; res: AdminAccountsCreateResponse };
	'admin/captcha/current': { req: AdminCaptchaCurrentRequest; res: AdminCaptchaCurrentResponse };
	'admin/captcha/save': { req: AdminCaptchaSaveRequest; res: EmptyResponse };
	'admin/invite/create': { req: AdminInviteCreateRequest; res: AdminInviteCreateResponse };
	'admin/invite/list': { req: AdminInviteListRequest; res: AdminInviteListResponse };
	'admin/reset-password': { req: AdminResetPasswordRequest; res: AdminResetPasswordResponse };
	'admin/unset-mfa': { req: AdminUnsetMfaRequest; res: EmptyResponse };
	'app/create': { req: AppCreateRequest; res: AppCreateResponse };
	'app/show': { req: AppShowRequest; res: AppShowResponse };
	'auth/accept': { req: AuthAcceptRequest; res: EmptyResponse };
	'auth/session/generate': { req: AuthSessionGenerateRequest; res: AuthSessionGenerateResponse };
	'auth/session/show': { req: AuthSessionShowRequest; res: AuthSessionShowResponse };
	'auth/session/userkey': { req: AuthSessionUserkeyRequest; res: AuthSessionUserkeyResponse };
	'email-address/available': { req: EmailAddressAvailableRequest; res: EmailAddressAvailableResponse };
	'i/2fa/done': { req: I2faDoneRequest; res: I2faDoneResponse };
	'i/2fa/key-done': { req: I2faKeyDoneRequest; res: I2faKeyDoneResponse };
	'i/2fa/password-less': { req: I2faPasswordLessRequest; res: EmptyResponse };
	'i/2fa/register': { req: I2faRegisterRequest; res: I2faRegisterResponse };
	'i/2fa/register-key': { req: I2faRegisterKeyRequest; res: I2faRegisterKeyResponse };
	'i/2fa/remove-key': { req: I2faRemoveKeyRequest; res: I2faRemoveKeyResponse };
	'i/2fa/unregister': { req: I2faUnregisterRequest; res: EmptyResponse };
	'i/2fa/update-key': { req: I2faUpdateKeyRequest; res: I2faUpdateKeyResponse };
	'i/apps': { req: IAppsRequest; res: IAppsResponse };
	'i/authorized-apps': { req: IAuthorizedAppsRequest; res: IAuthorizedAppsResponse };
	'i/change-password': { req: IChangePasswordRequest; res: EmptyResponse };
	'i/regenerate-token': { req: IRegenerateTokenRequest; res: EmptyResponse };
	'i/revoke-token': { req: IRevokeTokenRequest; res: EmptyResponse };
	'i/signin-history': { req: ISigninHistoryRequest; res: ISigninHistoryResponse };
	'i/update-email': { req: IUpdateEmailRequest; res: IUpdateEmailResponse };
	'invite/create': { req: InviteCreateRequest; res: InviteCreateResponse };
	'invite/delete': { req: InviteDeleteRequest; res: EmptyResponse };
	'invite/limit': { req: InviteLimitRequest; res: InviteLimitResponse };
	'invite/list': { req: InviteListRequest; res: InviteListResponse };
	'miauth/gen-token': { req: MiauthGenTokenRequest; res: MiauthGenTokenResponse };
	'my/apps': { req: MyAppsRequest; res: MyAppsResponse };
	'request-reset-password': { req: RequestResetPasswordRequest; res: EmptyResponse };
	'reset-password': { req: ResetPasswordRequest; res: EmptyResponse };
	'username/available': { req: UsernameAvailableRequest; res: UsernameAvailableResponse };
	'verify-email': { req: VerifyEmailRequest; res: EmptyResponse };
	'admin/abuse-report/notification-recipient/create': { req: AdminAbuseReportNotificationRecipientCreateRequest; res: AdminAbuseReportNotificationRecipientCreateResponse };
	'admin/abuse-report/notification-recipient/delete': { req: AdminAbuseReportNotificationRecipientDeleteRequest; res: EmptyResponse };
	'admin/abuse-report/notification-recipient/list': { req: AdminAbuseReportNotificationRecipientListRequest; res: AdminAbuseReportNotificationRecipientListResponse };
	'admin/abuse-report/notification-recipient/show': { req: AdminAbuseReportNotificationRecipientShowRequest; res: AdminAbuseReportNotificationRecipientShowResponse };
	'admin/abuse-report/notification-recipient/update': { req: AdminAbuseReportNotificationRecipientUpdateRequest; res: AdminAbuseReportNotificationRecipientUpdateResponse };
	'admin/abuse-user-reports': { req: AdminAbuseUserReportsRequest; res: AdminAbuseUserReportsResponse };
	'admin/forward-abuse-user-report': { req: AdminForwardAbuseUserReportRequest; res: EmptyResponse };
	'admin/get-user-ips': { req: AdminGetUserIpsRequest; res: AdminGetUserIpsResponse };
	'admin/resolve-abuse-user-report': { req: AdminResolveAbuseUserReportRequest; res: EmptyResponse };
	'admin/show-moderation-logs': { req: AdminShowModerationLogsRequest; res: AdminShowModerationLogsResponse };
	'admin/show-user': { req: AdminShowUserRequest; res: AdminShowUserResponse };
	'admin/show-users': { req: AdminShowUsersRequest; res: AdminShowUsersResponse };
	'admin/suspend-user': { req: AdminSuspendUserRequest; res: EmptyResponse };
	'admin/unset-user-avatar': { req: AdminUnsetUserAvatarRequest; res: EmptyResponse };
	'admin/unset-user-banner': { req: AdminUnsetUserBannerRequest; res: EmptyResponse };
	'admin/unsuspend-user': { req: AdminUnsuspendUserRequest; res: EmptyResponse };
	'admin/update-abuse-user-report': { req: AdminUpdateAbuseUserReportRequest; res: EmptyResponse };
	'admin/update-user-note': { req: AdminUpdateUserNoteRequest; res: EmptyResponse };
	'users/report-abuse': { req: UsersReportAbuseRequest; res: EmptyResponse };
	'admin/roles/assign': { req: AdminRolesAssignRequest; res: EmptyResponse };
	'admin/roles/create': { req: AdminRolesCreateRequest; res: AdminRolesCreateResponse };
	'admin/roles/delete': { req: AdminRolesDeleteRequest; res: EmptyResponse };
	'admin/roles/list': { req: AdminRolesListRequest; res: AdminRolesListResponse };
	'admin/roles/show': { req: AdminRolesShowRequest; res: AdminRolesShowResponse };
	'admin/roles/unassign': { req: AdminRolesUnassignRequest; res: EmptyResponse };
	'admin/roles/update': { req: AdminRolesUpdateRequest; res: EmptyResponse };
	'admin/roles/update-default-policies': { req: AdminRolesUpdateDefaultPoliciesRequest; res: EmptyResponse };
	'admin/roles/users': { req: AdminRolesUsersRequest; res: AdminRolesUsersResponse };
	'roles/list': { req: RolesListRequest; res: RolesListResponse };
	'roles/notes': { req: RolesNotesRequest; res: RolesNotesResponse };
	'roles/show': { req: RolesShowRequest; res: RolesShowResponse };
	'roles/users': { req: RolesUsersRequest; res: RolesUsersResponse };
	'server-info': { req: ServerInfoRequest; res: ServerInfoResponse };
	'admin/ad/create': { req: AdminAdCreateRequest; res: AdminAdCreateResponse };
	'admin/ad/delete': { req: AdminAdDeleteRequest; res: EmptyResponse };
	'admin/ad/list': { req: AdminAdListRequest; res: AdminAdListResponse };
	'admin/ad/update': { req: AdminAdUpdateRequest; res: EmptyResponse };
	'admin/meta': { req: AdminMetaRequest; res: AdminMetaResponse };
	'admin/server-info': { req: AdminServerInfoRequest; res: AdminServerInfoResponse };
	'admin/update-meta': { req: AdminUpdateMetaRequest; res: EmptyResponse };
	'endpoint': { req: EndpointRequest; res: EndpointResponse };
	'endpoints': { req: EndpointsRequest; res: EndpointsResponse };
	'get-online-users-count': { req: GetOnlineUsersCountRequest; res: GetOnlineUsersCountResponse };
	'meta': { req: MetaRequest; res: MetaResponse };
	'ping': { req: PingRequest; res: PingResponse };
	'pinned-users': { req: PinnedUsersRequest; res: PinnedUsersResponse };
	'charts/active-users': { req: ChartsActiveUsersRequest; res: ChartsActiveUsersResponse };
	'charts/ap-request': { req: ChartsApRequestRequest; res: ChartsApRequestResponse };
	'charts/drive': { req: ChartsDriveRequest; res: ChartsDriveResponse };
	'charts/federation': { req: ChartsFederationRequest; res: ChartsFederationResponse };
	'charts/instance': { req: ChartsInstanceRequest; res: ChartsInstanceResponse };
	'charts/notes': { req: ChartsNotesRequest; res: ChartsNotesResponse };
	'charts/user/drive': { req: ChartsUserDriveRequest; res: ChartsUserDriveResponse };
	'charts/user/following': { req: ChartsUserFollowingRequest; res: ChartsUserFollowingResponse };
	'charts/user/notes': { req: ChartsUserNotesRequest; res: ChartsUserNotesResponse };
	'charts/user/pv': { req: ChartsUserPvRequest; res: ChartsUserPvResponse };
	'charts/user/reactions': { req: ChartsUserReactionsRequest; res: ChartsUserReactionsResponse };
	'charts/users': { req: ChartsUsersRequest; res: ChartsUsersResponse };
	'retention': { req: RetentionRequest; res: RetentionResponse };
	'stats': { req: StatsRequest; res: StatsResponse };
	'hashtags/list': { req: HashtagsListRequest; res: HashtagsListResponse };
	'hashtags/search': { req: HashtagsSearchRequest; res: HashtagsSearchResponse };
	'hashtags/show': { req: HashtagsShowRequest; res: HashtagsShowResponse };
	'hashtags/trend': { req: HashtagsTrendRequest; res: HashtagsTrendResponse };
	'hashtags/users': { req: HashtagsUsersRequest; res: HashtagsUsersResponse };
	'notes/featured': { req: NotesFeaturedRequest; res: NotesFeaturedResponse };
	'notes/search-by-tag': { req: NotesSearchByTagRequest; res: NotesSearchByTagResponse };
	'users/featured-notes': { req: UsersFeaturedNotesRequest; res: UsersFeaturedNotesResponse };
	'users/get-frequently-replied-users': { req: UsersGetFrequentlyRepliedUsersRequest; res: UsersGetFrequentlyRepliedUsersResponse };
	'users/recommendation': { req: UsersRecommendationRequest; res: UsersRecommendationResponse };
	'users/search': { req: UsersSearchRequest; res: UsersSearchResponse };
	'users/search-by-username-and-host': { req: UsersSearchByUsernameAndHostRequest; res: UsersSearchByUsernameAndHostResponse };
	'admin/announcements/create': { req: AdminAnnouncementsCreateRequest; res: AdminAnnouncementsCreateResponse };
	'admin/announcements/delete': { req: AdminAnnouncementsDeleteRequest; res: EmptyResponse };
	'admin/announcements/list': { req: AdminAnnouncementsListRequest; res: AdminAnnouncementsListResponse };
	'admin/announcements/update': { req: AdminAnnouncementsUpdateRequest; res: EmptyResponse };
	'announcements': { req: AnnouncementsRequest; res: AnnouncementsResponse };
	'announcements/show': { req: AnnouncementsShowRequest; res: AnnouncementsShowResponse };
	'i/read-announcement': { req: IReadAnnouncementRequest; res: EmptyResponse };
	'admin/avatar-decorations/create': { req: AdminAvatarDecorationsCreateRequest; res: AdminAvatarDecorationsCreateResponse };
	'admin/avatar-decorations/delete': { req: AdminAvatarDecorationsDeleteRequest; res: EmptyResponse };
	'admin/avatar-decorations/list': { req: AdminAvatarDecorationsListRequest; res: AdminAvatarDecorationsListResponse };
	'admin/avatar-decorations/update': { req: AdminAvatarDecorationsUpdateRequest; res: EmptyResponse };
	'get-avatar-decorations': { req: GetAvatarDecorationsRequest; res: GetAvatarDecorationsResponse };
	'i/registry/get': { req: IRegistryGetRequest; res: IRegistryGetResponse };
	'i/registry/get-all': { req: IRegistryGetAllRequest; res: IRegistryGetAllResponse };
	'i/registry/get-detail': { req: IRegistryGetDetailRequest; res: IRegistryGetDetailResponse };
	'i/registry/keys': { req: IRegistryKeysRequest; res: IRegistryKeysResponse };
	'i/registry/keys-with-type': { req: IRegistryKeysWithTypeRequest; res: IRegistryKeysWithTypeResponse };
	'i/registry/remove': { req: IRegistryRemoveRequest; res: EmptyResponse };
	'i/registry/scopes-with-domain': { req: IRegistryScopesWithDomainRequest; res: IRegistryScopesWithDomainResponse };
	'i/registry/set': { req: IRegistrySetRequest; res: EmptyResponse };
	'admin/emoji/add': { req: AdminEmojiAddRequest; res: AdminEmojiAddResponse };
	'admin/emoji/add-aliases-bulk': { req: AdminEmojiAddAliasesBulkRequest; res: EmptyResponse };
	'admin/emoji/copy': { req: AdminEmojiCopyRequest; res: AdminEmojiCopyResponse };
	'admin/emoji/delete': { req: AdminEmojiDeleteRequest; res: EmptyResponse };
	'admin/emoji/delete-bulk': { req: AdminEmojiDeleteBulkRequest; res: EmptyResponse };
	'admin/emoji/import-zip': { req: AdminEmojiImportZipRequest; res: EmptyResponse };
	'admin/emoji/list': { req: AdminEmojiListRequest; res: AdminEmojiListResponse };
	'admin/emoji/list-remote': { req: AdminEmojiListRemoteRequest; res: AdminEmojiListRemoteResponse };
	'admin/emoji/remove-aliases-bulk': { req: AdminEmojiRemoveAliasesBulkRequest; res: EmptyResponse };
	'admin/emoji/set-aliases-bulk': { req: AdminEmojiSetAliasesBulkRequest; res: EmptyResponse };
	'admin/emoji/set-category-bulk': { req: AdminEmojiSetCategoryBulkRequest; res: EmptyResponse };
	'admin/emoji/set-license-bulk': { req: AdminEmojiSetLicenseBulkRequest; res: EmptyResponse };
	'admin/emoji/update': { req: AdminEmojiUpdateRequest; res: EmptyResponse };
	'emoji': { req: EmojiRequest; res: EmojiResponse };
	'emojis': { req: EmojisRequest; res: EmojisResponse };
	'export-custom-emojis': { req: ExportCustomEmojisRequest; res: EmptyResponse };
	'v2/admin/emoji/list': { req: V2AdminEmojiListRequest; res: V2AdminEmojiListResponse };
	'i/notifications': { req: INotificationsRequest; res: INotificationsResponse };
	'i/notifications-grouped': { req: INotificationsGroupedRequest; res: INotificationsGroupedResponse };
	'notifications/create': { req: NotificationsCreateRequest; res: EmptyResponse };
	'notifications/flush': { req: NotificationsFlushRequest; res: EmptyResponse };
	'notifications/mark-all-as-read': { req: NotificationsMarkAllAsReadRequest; res: EmptyResponse };
	'notifications/test-notification': { req: NotificationsTestNotificationRequest; res: EmptyResponse };
	'sw/register': { req: SwRegisterRequest; res: SwRegisterResponse };
	'sw/show-registration': { req: SwShowRegistrationRequest; res: SwShowRegistrationResponse };
	'sw/unregister': { req: SwUnregisterRequest; res: EmptyResponse };
	'sw/update-registration': { req: SwUpdateRegistrationRequest; res: SwUpdateRegistrationResponse };
	'notes/delete': { req: NotesDeleteRequest; res: EmptyResponse };
	'admin/promo/create': { req: AdminPromoCreateRequest; res: EmptyResponse };
	'i/pin': { req: IPinRequest; res: IPinResponse };
	'i/unpin': { req: IUnpinRequest; res: IUnpinResponse };
	'notes': { req: NotesRequest; res: NotesResponse };
	'notes/children': { req: NotesChildrenRequest; res: NotesChildrenResponse };
	'notes/conversation': { req: NotesConversationRequest; res: NotesConversationResponse };
	'notes/create': { req: NotesCreateRequest; res: NotesCreateResponse };
	'notes/drafts/list': { req: NotesDraftsListRequest; res: NotesDraftsListResponse };
	'notes/drafts/create': { req: NotesDraftsCreateRequest; res: NotesDraftsCreateResponse };
	'notes/drafts/delete': { req: NotesDraftsDeleteRequest; res: EmptyResponse };
	'notes/drafts/update': { req: NotesDraftsUpdateRequest; res: NotesDraftsUpdateResponse };
	'notes/drafts/count': { req: NotesDraftsCountRequest; res: NotesDraftsCountResponse };
	'notes/polls/recommendation': { req: NotesPollsRecommendationRequest; res: NotesPollsRecommendationResponse };
	'notes/polls/vote': { req: NotesPollsVoteRequest; res: EmptyResponse };
	'notes/reactions': { req: NotesReactionsRequest; res: NotesReactionsResponse };
	'notes/reactions/create': { req: NotesReactionsCreateRequest; res: EmptyResponse };
	'notes/reactions/delete': { req: NotesReactionsDeleteRequest; res: EmptyResponse };
	'notes/renotes': { req: NotesRenotesRequest; res: NotesRenotesResponse };
	'notes/replies': { req: NotesRepliesRequest; res: NotesRepliesResponse };
	'notes/show': { req: NotesShowRequest; res: NotesShowResponse };
	'notes/show-partial-bulk': { req: NotesShowPartialBulkRequest; res: NotesShowPartialBulkResponse };
	'notes/state': { req: NotesStateRequest; res: NotesStateResponse };
	'notes/thread-muting/create': { req: NotesThreadMutingCreateRequest; res: EmptyResponse };
	'notes/thread-muting/delete': { req: NotesThreadMutingDeleteRequest; res: EmptyResponse };
	'notes/translate': { req: NotesTranslateRequest; res: NotesTranslateResponse };
	'notes/unrenote': { req: NotesUnrenoteRequest; res: EmptyResponse };
	'promo/read': { req: PromoReadRequest; res: EmptyResponse };
	'users/reactions': { req: UsersReactionsRequest; res: UsersReactionsResponse };
	'admin/accounts/delete': { req: AdminAccountsDeleteRequest; res: EmptyResponse };
	'admin/accounts/find-by-email': { req: AdminAccountsFindByEmailRequest; res: AdminAccountsFindByEmailResponse };
	'admin/delete-account': { req: AdminDeleteAccountRequest; res: EmptyResponse };
	'admin/update-proxy-account': { req: AdminUpdateProxyAccountRequest; res: AdminUpdateProxyAccountResponse };
	'i': { req: IRequest; res: IResponse };
	'i/claim-achievement': { req: IClaimAchievementRequest; res: EmptyResponse };
	'i/delete-account': { req: IDeleteAccountRequest; res: EmptyResponse };
	'i/move': { req: IMoveRequest; res: IMoveResponse };
	'i/update': { req: IUpdateRequest; res: IUpdateResponse };
	'users': { req: UsersRequest; res: UsersResponse };
	'users/achievements': { req: UsersAchievementsRequest; res: UsersAchievementsResponse };
	'users/show': { req: UsersShowRequest; res: UsersShowResponse };
	'users/update-memo': { req: UsersUpdateMemoRequest; res: EmptyResponse };
	'antennas/create': { req: AntennasCreateRequest; res: AntennasCreateResponse };
	'antennas/delete': { req: AntennasDeleteRequest; res: EmptyResponse };
	'antennas/list': { req: AntennasListRequest; res: AntennasListResponse };
	'antennas/notes': { req: AntennasNotesRequest; res: AntennasNotesResponse };
	'antennas/remove-note': { req: AntennasRemoveNoteRequest; res: EmptyResponse };
	'antennas/show': { req: AntennasShowRequest; res: AntennasShowResponse };
	'antennas/update': { req: AntennasUpdateRequest; res: AntennasUpdateResponse };
	'notes/global-timeline': { req: NotesGlobalTimelineRequest; res: NotesGlobalTimelineResponse };
	'notes/hybrid-timeline': { req: NotesHybridTimelineRequest; res: NotesHybridTimelineResponse };
	'notes/local-timeline': { req: NotesLocalTimelineRequest; res: NotesLocalTimelineResponse };
	'notes/mentions': { req: NotesMentionsRequest; res: NotesMentionsResponse };
	'notes/timeline': { req: NotesTimelineRequest; res: NotesTimelineResponse };
	'notes/user-list-timeline': { req: NotesUserListTimelineRequest; res: NotesUserListTimelineResponse };
	'users/notes': { req: UsersNotesRequest; res: UsersNotesResponse };
	'notes/search': { req: NotesSearchRequest; res: NotesSearchResponse };
	'blocking/create': { req: BlockingCreateRequest; res: BlockingCreateResponse };
	'blocking/delete': { req: BlockingDeleteRequest; res: BlockingDeleteResponse };
	'blocking/list': { req: BlockingListRequest; res: BlockingListResponse };
	'following/create': { req: FollowingCreateRequest; res: FollowingCreateResponse };
	'following/delete': { req: FollowingDeleteRequest; res: FollowingDeleteResponse };
	'following/invalidate': { req: FollowingInvalidateRequest; res: FollowingInvalidateResponse };
	'following/list': { req: FollowingListRequest; res: FollowingListResponse };
	'following/requests/accept': { req: FollowingRequestsAcceptRequest; res: EmptyResponse };
	'following/requests/cancel': { req: FollowingRequestsCancelRequest; res: FollowingRequestsCancelResponse };
	'following/requests/list': { req: FollowingRequestsListRequest; res: FollowingRequestsListResponse };
	'following/requests/reject': { req: FollowingRequestsRejectRequest; res: EmptyResponse };
	'following/requests/sent': { req: FollowingRequestsSentRequest; res: FollowingRequestsSentResponse };
	'following/update': { req: FollowingUpdateRequest; res: FollowingUpdateResponse };
	'following/update-all': { req: FollowingUpdateAllRequest; res: EmptyResponse };
	'mute/create': { req: MuteCreateRequest; res: EmptyResponse };
	'mute/delete': { req: MuteDeleteRequest; res: EmptyResponse };
	'mute/list': { req: MuteListRequest; res: MuteListResponse };
	'renote-mute/create': { req: RenoteMuteCreateRequest; res: EmptyResponse };
	'renote-mute/delete': { req: RenoteMuteDeleteRequest; res: EmptyResponse };
	'renote-mute/list': { req: RenoteMuteListRequest; res: RenoteMuteListResponse };
	'users/followers': { req: UsersFollowersRequest; res: UsersFollowersResponse };
	'users/following': { req: UsersFollowingRequest; res: UsersFollowingResponse };
	'users/get-following-users-by-birthday': { req: UsersGetFollowingUsersByBirthdayRequest; res: UsersGetFollowingUsersByBirthdayResponse };
	'users/lists/create': { req: UsersListsCreateRequest; res: UsersListsCreateResponse };
	'users/lists/create-from-public': { req: UsersListsCreateFromPublicRequest; res: UsersListsCreateFromPublicResponse };
	'users/lists/delete': { req: UsersListsDeleteRequest; res: EmptyResponse };
	'users/lists/favorite': { req: UsersListsFavoriteRequest; res: EmptyResponse };
	'users/lists/get-memberships': { req: UsersListsGetMembershipsRequest; res: UsersListsGetMembershipsResponse };
	'users/lists/list': { req: UsersListsListRequest; res: UsersListsListResponse };
	'users/lists/pull': { req: UsersListsPullRequest; res: EmptyResponse };
	'users/lists/push': { req: UsersListsPushRequest; res: EmptyResponse };
	'users/lists/show': { req: UsersListsShowRequest; res: UsersListsShowResponse };
	'users/lists/unfavorite': { req: UsersListsUnfavoriteRequest; res: EmptyResponse };
	'users/lists/update': { req: UsersListsUpdateRequest; res: UsersListsUpdateResponse };
	'users/lists/update-membership': { req: UsersListsUpdateMembershipRequest; res: EmptyResponse };
	'users/relation': { req: UsersRelationRequest; res: UsersRelationResponse };
	'clips/add-note': { req: ClipsAddNoteRequest; res: EmptyResponse };
	'clips/create': { req: ClipsCreateRequest; res: ClipsCreateResponse };
	'clips/delete': { req: ClipsDeleteRequest; res: EmptyResponse };
	'clips/favorite': { req: ClipsFavoriteRequest; res: EmptyResponse };
	'clips/list': { req: ClipsListRequest; res: ClipsListResponse };
	'clips/my-favorites': { req: ClipsMyFavoritesRequest; res: ClipsMyFavoritesResponse };
	'clips/notes': { req: ClipsNotesRequest; res: ClipsNotesResponse };
	'clips/remove-note': { req: ClipsRemoveNoteRequest; res: EmptyResponse };
	'clips/show': { req: ClipsShowRequest; res: ClipsShowResponse };
	'clips/unfavorite': { req: ClipsUnfavoriteRequest; res: EmptyResponse };
	'clips/update': { req: ClipsUpdateRequest; res: ClipsUpdateResponse };
	'gallery/featured': { req: GalleryFeaturedRequest; res: GalleryFeaturedResponse };
	'gallery/popular': { req: GalleryPopularRequest; res: GalleryPopularResponse };
	'gallery/posts': { req: GalleryPostsRequest; res: GalleryPostsResponse };
	'gallery/posts/create': { req: GalleryPostsCreateRequest; res: GalleryPostsCreateResponse };
	'gallery/posts/delete': { req: GalleryPostsDeleteRequest; res: EmptyResponse };
	'gallery/posts/like': { req: GalleryPostsLikeRequest; res: EmptyResponse };
	'gallery/posts/show': { req: GalleryPostsShowRequest; res: GalleryPostsShowResponse };
	'gallery/posts/unlike': { req: GalleryPostsUnlikeRequest; res: EmptyResponse };
	'gallery/posts/update': { req: GalleryPostsUpdateRequest; res: GalleryPostsUpdateResponse };
	'i/favorites': { req: IFavoritesRequest; res: IFavoritesResponse };
	'i/gallery/likes': { req: IGalleryLikesRequest; res: IGalleryLikesResponse };
	'i/gallery/posts': { req: IGalleryPostsRequest; res: IGalleryPostsResponse };
	'notes/clips': { req: NotesClipsRequest; res: NotesClipsResponse };
	'notes/favorites/create': { req: NotesFavoritesCreateRequest; res: EmptyResponse };
	'notes/favorites/delete': { req: NotesFavoritesDeleteRequest; res: EmptyResponse };
	'users/clips': { req: UsersClipsRequest; res: UsersClipsResponse };
	'users/gallery/posts': { req: UsersGalleryPostsRequest; res: UsersGalleryPostsResponse };
	'drive/files/create': { req: DriveFilesCreateRequest; res: DriveFilesCreateResponse };
	'signup': { req: SignupRequest; res: SignupResponse };
	'signup-pending': { req: SignupPendingRequest; res: SignupPendingResponse };
	'signin-flow': { req: SigninFlowRequest; res: SigninFlowResponse };
	'signin-with-passkey': { req: SigninWithPasskeyRequest; res: SigninWithPasskeyResponse };
};

/**
 * NOTE: The content-type for all endpoints not listed here is application/json.
 */
export const endpointReqTypes = {
	'drive/files/create': 'multipart/form-data',
} as const satisfies { [K in keyof Endpoints]?: 'multipart/form-data'; };
