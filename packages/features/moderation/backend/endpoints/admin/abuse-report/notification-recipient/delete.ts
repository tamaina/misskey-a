/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { moderationCommandMeta, legacyModerationCommandSchemas } from '../../../../index.js';

export const meta = moderationCommandMeta['admin/abuse-report/notification-recipient/delete'];
export const paramDef = legacyModerationCommandSchemas['admin/abuse-report/notification-recipient/delete'].input;
