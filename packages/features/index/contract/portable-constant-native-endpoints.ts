/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { PortableConstantEndpoints as AuthPortableConstantEndpoints } from '../../auth/contract/portable-constant-endpoint-definitions.js';
import type { PortableConstantEndpoints as IntegrationsPortableConstantEndpoints } from '../../integrations/contract/portable-constant-endpoint-definitions.js';
import type { PortableConstantEndpoints as UsersPortableConstantEndpoints } from '../../users/contract/portable-constant-endpoint-definitions.js';
import type { PortableConstantEndpoints as NotificationsPortableConstantEndpoints } from '../../notifications/contract/portable-constant-endpoint-definitions.js';
import type { PortableConstantEndpoints as PagesPortableConstantEndpoints } from '../../pages/contract/portable-constant-endpoint-definitions.js';
import type { PortableConstantEndpoints as EmojisPortableConstantEndpoints } from '../../emojis/contract/portable-constant-endpoint-definitions.js';

export type PortableConstantNativeEndpoints = AuthPortableConstantEndpoints
	& IntegrationsPortableConstantEndpoints
	& UsersPortableConstantEndpoints
	& NotificationsPortableConstantEndpoints
	& PagesPortableConstantEndpoints
	& EmojisPortableConstantEndpoints;
