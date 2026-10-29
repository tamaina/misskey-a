/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export { createApiRouter } from '@features/index/backend/api.implementation.js';
export { withStagedUpload, writeMultipartFile, UploadRequestError } from './transport/multipart.js';
export { requestRoutes } from '../shared/api-routing.js';
export { registerPilotHttp, bodyCredential } from './transport/pilot-http.js';
export { misskeyErrorBody } from './transport/orpc-error.js';
export { genPilotOpenapiSpec, getPilotEndpointDescriptors } from './transport/openapi/pilot-spec.js';

export { pilotContract } from '@features/index/backend/api.definition.js';
export { createAnnouncementsRouter } from '@features/announcements/backend/api.implementation.js';
export { authentication, apiPolicy, requirePrincipal } from './transport/middleware.js';
export { apiError, normalizeError } from './transport/orpc-error.js';
export { RegistryApiService } from '@features/preferences/backend/services/RegistryApiService.js';
export { nullSuccessToNoContent } from './transport/no-content.js';
export { createInstanceRouter } from '@features/instance/backend/api.implementation.js';
export { createNotesRouter } from '@features/notes/backend/api.implementation.js';
export { createDriveRouter } from '@features/drive/backend/api.implementation.js';
export { createStatisticsRouter } from '@features/statistics/backend/api.implementation.js';
export { createEmojisRouter } from '@features/emojis/backend/api.implementation.js';
export { createNotificationsRouter } from '@features/notifications/backend/api.implementation.js';
export { createTimelinesRouter } from '@features/timelines/backend/api.implementation.js';
export { createNoteSearchRouter } from '@features/note-search/backend/api.implementation.js';
export { createUsersRouter } from '@features/users/backend/api.implementation.js';
export { createRelationshipsRouter } from '@features/relationships/backend/endpoints/relationships.js';
export { createCollectionsRouter } from '@features/collections/backend/api.implementation.js';
