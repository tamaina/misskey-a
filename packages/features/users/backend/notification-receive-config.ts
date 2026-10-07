/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Schema } from '@/misc/json-schema.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import { notificationReceiveRule } from '../contract/notification-receive-config.js';

// Schema-dialect assertion only; never a request or response payload assertion.
export const notificationRecieveConfig = toLegacyJsonSchema(notificationReceiveRule, { target: 'openapi-3.0', typeMode: 'ignore' }) as { readonly type: 'object'; readonly oneOf: readonly Schema[] };
