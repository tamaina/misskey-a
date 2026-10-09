/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export { createApiRouter } from '../../index/backend/api.router.js';
export { withStagedUpload, writeMultipartFile, UploadRequestError } from './transport/multipart.js';
export { requestRoutes } from '../shared/api-routing.js';
export { registerPilotHttp, bodyCredential } from './transport/pilot-http.js';
export { misskeyErrorBody } from './transport/orpc-error.js';
export { genPilotOpenapiSpec, getPilotEndpointDescriptors } from './transport/openapi/pilot-spec.js';

export { pilotContract } from '../../index/backend/api.contract.js';
export { createAnnouncementsRouter } from '../../announcements/backend/api.router.js';
export { authentication, apiPolicy, requirePrincipal } from './transport/middleware.js';
export { apiError, normalizeError } from './transport/orpc-error.js';
export { RegistryApiService } from '../../preferences/backend/services/RegistryApiService.js';
export { nullSuccessToNoContent } from './transport/no-content.js';
export { createInstanceRouter } from '../../instance/backend/api.router.js';
export { createNotesRouter } from '../../notes/backend/api.router.js';
export { createDriveRouter } from '../../drive/backend/api.router.js';
export { createStatisticsRouter } from '../../statistics/backend/router.js';
export { createEmojisRouter } from '../../emojis/backend/api.router.js';
export { createNotificationsRouter } from '../../notifications/backend/router.js';
export { createTimelinesRouter } from '../../timelines/backend/router.js';
export { createNoteSearchRouter } from '../../note-search/backend/router.js';
export { createUsersRouter } from '../../users/backend/api.router.js';
export { createRelationshipsRouter } from '../../relationships/backend/endpoints/relationships.js';
export { createCollectionsRouter } from '../../collections/backend/api.router.js';
