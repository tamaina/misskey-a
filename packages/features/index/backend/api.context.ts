/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
export type ApiExecutionContext<Actor extends ApiActor> = ApiContext<Actor>;
