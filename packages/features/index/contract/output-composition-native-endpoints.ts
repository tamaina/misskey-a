/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { OutputCompositionEndpoints as FederationEndpoints } from '../../federation/contract/output-composition-endpoint-definitions.js';
import type { OutputCompositionEndpoints as AuthEndpoints } from '../../auth/contract/output-composition-endpoint-definitions.js';
import type { OutputCompositionEndpoints as RelationshipEndpoints } from '../../relationships/contract/output-composition-endpoint-definitions.js';

export type OutputCompositionNativeEndpoints = FederationEndpoints & AuthEndpoints & RelationshipEndpoints;
