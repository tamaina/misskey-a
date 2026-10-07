/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { EmptyInputEndpoints as AuthEndpoints } from '../../auth/contract/empty-input-endpoint-definitions.js';
import type { EmptyInputEndpoints as GameEndpoints } from '../../games/contract/empty-input-endpoint-definitions.js';

export type EmptyInputNativeEndpoints = AuthEndpoints & GameEndpoints;
