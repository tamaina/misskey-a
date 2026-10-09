/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export { relationshipsContract } from './endpoints/relationships.contract.js';
export { createRelationshipsRouter } from './endpoints/relationships.js';
export { UserListService } from './services/UserListService.js';
export { RelationshipsApiProvider } from './api.provider.js';
export type { RelationshipsDependencies } from './api.dependencies.js';
