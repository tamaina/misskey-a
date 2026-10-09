/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Native feature composition exports. Runtime handlers bind ordinary application ports.
export { createNotesCommandOperations } from '@features/notes/backend/commands.js';
export type { NotesCommandOperations, NotesCommandsDependencies } from '@features/notes/backend/commands.js';
export { createChatCommandOperations } from '@features/chat/backend/commands.js';
export type { ChatCommandOperations, ChatCommandsDependencies } from '@features/chat/backend/commands.js';
export { createChannelCommandOperations } from '@features/channels/backend/commands.js';
export type { ChannelCommandOperations, ChannelCommandsDependencies } from '@features/channels/backend/commands.js';

export { createNotesOperations, notesOperationProviders } from '@features/notes/backend/operations.js';
export type { NotesOperations, NotesApiContext, NotesOperationDependencies } from '@features/notes/backend/operations.js';
export { createChatOperations, chatOperationProviders } from '@features/chat/backend/operations.js';
export type { ChatOperations, ChatApiContext, ChatOperationDependencies } from '@features/chat/backend/operations.js';
export { createChannelsOperations, channelOperationProviders } from '@features/channels/backend/operations.js';
export type { ChannelsOperations, ChannelsApiContext, ChannelsOperationDependencies } from '@features/channels/backend/operations.js';
export { createInstanceOperations } from '@features/instance/backend/operations.js';
export type { InstanceOperations, InstanceApiContext, InstanceOperationDependencies } from '@features/instance/backend/operations.js';
export { createAnnouncementsOperations } from '@features/announcements/backend/api.operations.js';
export type { AnnouncementsOperations, AnnouncementsDependencies } from '@features/announcements/backend/api.operations.js';
export { createAvatarDecorationsOperations } from '@features/avatar-decorations/backend/api.operations.js';
export type { AvatarDecorationsOperations, AvatarDecorationsDependencies } from '@features/avatar-decorations/backend/api.operations.js';
export { createCollectionsOperations, CollectionsApplicationService } from '@features/collections/backend/api.operations.js';
export type { CollectionsOperations, CollectionsDependencies } from '@features/collections/backend/api.operations.js';
export { createEmojisOperations } from '@features/emojis/backend/api.operations.js';
export type { EmojisOperations, EmojisDependencies } from '@features/emojis/backend/api.operations.js';
export { createNotificationsOperations, NotificationsApplicationService } from '@features/notifications/backend/application.js';
export type { NotificationsApplicationDependencies, NotificationsCommandDependencies } from '@features/notifications/backend/application.js';
export { createStatisticsOperations } from '@features/statistics/backend/operations.js';
export type { StatisticsOperations, StatisticsContext, StatisticsDependencies } from '@features/statistics/backend/operations.js';
export { createTimelinesOperations } from '@features/timelines/backend/operations.js';
export type { TimelinesOperations, TimelinesContext, TimelinesApplications } from '@features/timelines/backend/operations.js';
export { createNoteSearchOperations } from '@features/note-search/backend/operations.js';
export type { NoteSearchOperations, NoteSearchContext, NoteSearchApplications } from '@features/note-search/backend/operations.js';
export { createFederationOperations } from '@features/federation/backend/operations.js';
export type { FederationOperations, FederationContext, FederationApplications } from '@features/federation/backend/operations.js';
export { createOperationsApiOperations } from '@features/operations/backend/operations.js';
export type { OperationsApiOperations, OperationsApiContext, OperationsApplications } from '@features/operations/backend/operations.js';
export { createIntegrationsOperations } from '@features/integrations/backend/operations.js';
export type { IntegrationsOperations, IntegrationsContext, IntegrationsApplications } from '@features/integrations/backend/operations.js';
export { createModerationOperations, ModerationApplicationService } from '@features/moderation/backend/api.operations.js';
export type { ModerationOperations, ModerationApiDependencies } from '@features/moderation/backend/api.operations.js';
export { createPortabilityOperations } from '@features/portability/backend/operations.js';
export type { PortabilityDependencies } from '@features/portability/backend/operations.js';
export { createPagesOperations } from '@features/pages/backend/operations.js';
export type { PagesOperations, PagesContext, PagesApplications } from '@features/pages/backend/operations.js';
export { createPlayOperations } from '@features/play/backend/operations.js';
export type { PlayOperations, PlayContext, PlayApplications } from '@features/play/backend/operations.js';
export { createGamesOperations } from '@features/games/backend/operations.js';
export type { GamesOperations, GamesContext, GamesApplications } from '@features/games/backend/operations.js';
export { UsersApplicationService } from '@features/users/backend/api.application.js';
export type { UsersOperations, UsersContext } from '@features/users/backend/api.router.js';
export { AuthApplicationService } from '@features/auth/backend/api.application.js';
export type { AuthOperations, AuthContext } from '@features/auth/backend/api.router.js';
export { RelationshipsApplicationService } from '@features/relationships/backend/endpoints/relationships.application.js';
export { PortabilityApplicationService } from '@features/portability/backend/api.application.js';
export type { PortabilityOperations, PortabilityContext } from '@features/portability/backend/api.router.js';
export type { NotificationsOperations, NotificationsContext } from '@features/notifications/backend/operations.js';
