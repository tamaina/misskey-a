/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from '@/runtime-dependencies/ms.js';
import { portabilityImportErrors } from '@features/portability/contract';
import { legacyPortabilityImportSchemas } from '@features/portability/backend';

export const meta = {
	secure: true,
	requireCredential: true,
	requiredRolePolicy: 'canImportFollowing',
	prohibitMoved: true,
	limit: { duration: ms('1hour'), max: 1 },
	errors: portabilityImportErrors['i/import-following'],
} as const;

export const paramDef = legacyPortabilityImportSchemas['i/import-following'].input;
