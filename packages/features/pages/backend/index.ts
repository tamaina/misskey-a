/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export { pagesContract } from './endpoints/pages.contract.js';
export { createPagesRouter } from './router.js';
export { createPagesOperations } from './operations.js';
export type { PagesOperations, PagesContext, PagesApplications } from './operations.js';
export { pagesApplicationProviders } from './application-providers.js';
export { IPageLikesApplicationService } from './applications/i/page-likes.js';
export { IPagesApplicationService } from './applications/i/pages.js';
export { PagePushApplicationService } from './applications/page-push.js';
export { PagesCreateApplicationService } from './applications/pages/create.js';
export { PagesDeleteApplicationService } from './applications/pages/delete.js';
export { PagesFeaturedApplicationService } from './applications/pages/featured.js';
export { PagesLikeApplicationService } from './applications/pages/like.js';
export { PagesShowApplicationService } from './applications/pages/show.js';
export { PagesUnlikeApplicationService } from './applications/pages/unlike.js';
export { PagesUpdateApplicationService } from './applications/pages/update.js';
export { UsersPagesApplicationService } from './applications/users/pages.js';
