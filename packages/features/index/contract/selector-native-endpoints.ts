/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { SelectorEndpoints as DriveEndpoints } from '../../drive/contract/selector-endpoint-definitions.js';
import type { SelectorEndpoints as AuthEndpoints } from '../../auth/contract/selector-endpoint-definitions.js';
import type { SelectorEndpoints as PageEndpoints } from '../../pages/contract/selector-endpoint-definitions.js';

export type SelectorNativeEndpoints = DriveEndpoints & AuthEndpoints & PageEndpoints;
