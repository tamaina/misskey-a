/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { moderationCommandMeta, legacyModerationCommandSchemas } from '../../index.js';

export const meta = moderationCommandMeta['admin/resolve-abuse-user-report'];
export const paramDef = legacyModerationCommandSchemas['admin/resolve-abuse-user-report'].input;
