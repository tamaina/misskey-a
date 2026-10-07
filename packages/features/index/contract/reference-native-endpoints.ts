/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ReferenceEndpoints as InstanceReferenceEndpoints } from '../../instance/contract/reference-endpoint-definitions.js';
import type { ReferenceEndpoints as OperationsReferenceEndpoints } from '../../operations/contract/reference-endpoint-definitions.js';
import type { ReferenceEndpoints as RolesReferenceEndpoints } from '../../roles/contract/reference-endpoint-definitions.js';
import type { ReferenceEndpoints as GamesReferenceEndpoints } from '../../games/contract/reference-endpoint-definitions.js';
import type { ReferenceEndpoints as UsersReferenceEndpoints } from '../../users/contract/reference-endpoint-definitions.js';

export type ReferenceNativeEndpoints = InstanceReferenceEndpoints
	& OperationsReferenceEndpoints
	& RolesReferenceEndpoints
	& GamesReferenceEndpoints
	& UsersReferenceEndpoints;
