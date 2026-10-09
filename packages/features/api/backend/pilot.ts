/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export { createApiRouter } from '../../index/backend/api.router.js';
export { createServerInfoService } from '../../instance/backend/server-info.js';
export { createDeleteNote } from '../../notes/backend/delete-note.js';
export { createFileService } from '../../drive/backend/create-file.js';
export { withStagedUpload, writeMultipartFile, UploadRequestError } from './transport/multipart.js';
export { requestRoutes } from '../shared/api-routing.js';
export { registerPilotHttp, bodyCredential } from './transport/pilot-http.js';
export { misskeyErrorBody } from './transport/orpc-error.js';
export { genPilotOpenapiSpec, getPilotEndpointDescriptors } from './transport/openapi/pilot-spec.js';

export { pilotContract } from '../../index/backend/api.contract.js';
export { createInstanceOperations } from '../../instance/backend/operations.js';
export { createStatisticsOperations } from '../../statistics/backend/operations.js';
export { createAnnouncementsOperations } from '../../announcements/backend/api.operations.js';
export { createAvatarDecorationsOperations } from '../../avatar-decorations/backend/api.operations.js';
export { createEmojisOperations } from '../../emojis/backend/api.operations.js';
export { createPreferencesOperations } from '../../preferences/backend/operations.js';
export { createNotificationsOperations } from '../../notifications/backend/application.js';
export { authentication, apiPolicy, requirePrincipal } from './transport/middleware.js';
export { apiError, normalizeError } from './transport/orpc-error.js';
export { RegistryApiService } from '../../preferences/backend/services/RegistryApiService.js';
