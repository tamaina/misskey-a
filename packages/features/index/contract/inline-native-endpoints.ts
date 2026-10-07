/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { NativeInlineEndpoints as AnnouncementsInlineEndpoints } from '../../announcements/contract/endpoint-definitions.js';
import type { NativeInlineEndpoints as ApiInlineEndpoints } from '../../api/contract/endpoint-definitions.js';
import type { NativeInlineEndpoints as AuthInlineEndpoints } from '../../auth/contract/endpoint-definitions.js';
import type { NativeInlineEndpoints as DiscoveryInlineEndpoints } from '../../discovery/contract/endpoint-definitions.js';
import type { NativeInlineEndpoints as DriveInlineEndpoints } from '../../drive/contract/endpoint-definitions.js';
import type { NativeInlineEndpoints as EmojisInlineEndpoints } from '../../emojis/contract/endpoint-definitions.js';
import type { NativeInlineEndpoints as FederationInlineEndpoints } from '../../federation/contract/endpoint-definitions.js';
import type { NativeInlineEndpoints as InstanceInlineEndpoints } from '../../instance/contract/endpoint-definitions.js';
import type { NativeInlineEndpoints as IntegrationsInlineEndpoints } from '../../integrations/contract/endpoint-definitions.js';
import type { NativeInlineEndpoints as ModerationInlineEndpoints } from '../../moderation/contract/endpoint-definitions.js';
import type { NativeInlineEndpoints as NotesInlineEndpoints } from '../../notes/contract/endpoint-definitions.js';
import type { NativeInlineEndpoints as NotificationsInlineEndpoints } from '../../notifications/contract/endpoint-definitions.js';
import type { NativeInlineEndpoints as OperationsInlineEndpoints } from '../../operations/contract/endpoint-definitions.js';
import type { NativeInlineEndpoints as PreferencesInlineEndpoints } from '../../preferences/contract/endpoint-definitions.js';
import type { NativeInlineEndpoints as UsersInlineEndpoints } from '../../users/contract/endpoint-definitions.js';

export type InlineNativeEndpoints = AnnouncementsInlineEndpoints
	& ApiInlineEndpoints
	& AuthInlineEndpoints
	& DiscoveryInlineEndpoints
	& DriveInlineEndpoints
	& EmojisInlineEndpoints
	& FederationInlineEndpoints
	& InstanceInlineEndpoints
	& IntegrationsInlineEndpoints
	& ModerationInlineEndpoints
	& NotesInlineEndpoints
	& NotificationsInlineEndpoints
	& OperationsInlineEndpoints
	& PreferencesInlineEndpoints
	& UsersInlineEndpoints;
