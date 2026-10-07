/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { UnionEndpoints as InstanceEndpoints } from '../../instance/contract/union-endpoint-definitions.js';
import type { UnionEndpoints as RelationshipEndpoints } from '../../relationships/contract/union-endpoint-definitions.js';

export type UnionNativeEndpoints = InstanceEndpoints & RelationshipEndpoints;
