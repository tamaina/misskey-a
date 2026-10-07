/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { NativeVoidEndpoints as AuthVoidEndpoints } from '../../auth/contract/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as CollectionsVoidEndpoints } from '../../collections/contract/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as DriveVoidEndpoints } from '../../drive/contract/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as EmojisVoidEndpoints } from '../../emojis/contract/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as FederationVoidEndpoints } from '../../federation/contract/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as GalleryVoidEndpoints } from '../../collections/contract/gallery/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as GamesVoidEndpoints } from '../../games/contract/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as InstanceVoidEndpoints } from '../../instance/contract/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as IntegrationsVoidEndpoints } from '../../integrations/contract/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as ModerationVoidEndpoints } from '../../moderation/contract/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as NotesVoidEndpoints } from '../../notes/contract/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as NotificationsVoidEndpoints } from '../../notifications/contract/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as OperationsVoidEndpoints } from '../../operations/contract/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as PagesVoidEndpoints } from '../../pages/contract/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as PlayVoidEndpoints } from '../../play/contract/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as RelationshipsVoidEndpoints } from '../../relationships/contract/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as RolesVoidEndpoints } from '../../roles/contract/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as TimelinesVoidEndpoints } from '../../timelines/contract/void-endpoint-definitions.js';
import type { NativeVoidEndpoints as UsersVoidEndpoints } from '../../users/contract/void-endpoint-definitions.js';

export type VoidNativeEndpoints = AuthVoidEndpoints
	& CollectionsVoidEndpoints
	& DriveVoidEndpoints
	& EmojisVoidEndpoints
	& FederationVoidEndpoints
	& GalleryVoidEndpoints
	& GamesVoidEndpoints
	& InstanceVoidEndpoints
	& IntegrationsVoidEndpoints
	& ModerationVoidEndpoints
	& NotesVoidEndpoints
	& NotificationsVoidEndpoints
	& OperationsVoidEndpoints
	& PagesVoidEndpoints
	& PlayVoidEndpoints
	& RelationshipsVoidEndpoints
	& RolesVoidEndpoints
	& TimelinesVoidEndpoints
	& UsersVoidEndpoints;
