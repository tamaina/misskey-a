/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { moderationCommandMeta, legacyModerationCommandSchemas } from '../../index.js';

export const meta = moderationCommandMeta['admin/update-user-note'];
export const paramDef = legacyModerationCommandSchemas['admin/update-user-note'].input;
