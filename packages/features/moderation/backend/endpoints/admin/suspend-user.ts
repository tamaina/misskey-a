/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { moderationCommandMeta, legacyModerationCommandSchemas } from '../../index.js';

export const meta = moderationCommandMeta['admin/suspend-user'];
export const paramDef = legacyModerationCommandSchemas['admin/suspend-user'].input;
