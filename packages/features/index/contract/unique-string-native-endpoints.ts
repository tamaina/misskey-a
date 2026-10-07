/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { UniqueStringEndpoints as AuthUniqueStringEndpoints } from '../../auth/contract/unique-string-endpoint-definitions.js';
import type { UniqueStringEndpoints as DriveUniqueStringEndpoints } from '../../drive/contract/unique-string-endpoint-definitions.js';
import type { UniqueStringEndpoints as GalleryUniqueStringEndpoints } from '../../collections/contract/unique-string-endpoint-definitions.js';

export type UniqueStringNativeEndpoints = AuthUniqueStringEndpoints
	& DriveUniqueStringEndpoints
	& GalleryUniqueStringEndpoints;
