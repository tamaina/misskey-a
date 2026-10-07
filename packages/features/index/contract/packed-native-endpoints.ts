/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { PackedNativeEndpoints as AnnouncementsPackedNativeEndpoints } from '../../announcements/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as AuthPackedNativeEndpoints } from '../../auth/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as ChannelsPackedNativeEndpoints } from '../../channels/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as ChatPackedNativeEndpoints } from '../../chat/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as CollectionsPackedNativeEndpoints } from '../../collections/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as DiscoveryPackedNativeEndpoints } from '../../discovery/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as DrivePackedNativeEndpoints } from '../../drive/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as EmojisPackedNativeEndpoints } from '../../emojis/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as FederationPackedNativeEndpoints } from '../../federation/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as GalleryPackedNativeEndpoints } from '../../gallery/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as GamesPackedNativeEndpoints } from '../../games/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as InstancePackedNativeEndpoints } from '../../instance/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as IntegrationsPackedNativeEndpoints } from '../../integrations/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as ModerationPackedNativeEndpoints } from '../../moderation/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as NotesPackedNativeEndpoints } from '../../notes/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as PagesPackedNativeEndpoints } from '../../pages/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as PlayPackedNativeEndpoints } from '../../play/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as RelationshipsPackedNativeEndpoints } from '../../relationships/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as RolesPackedNativeEndpoints } from '../../roles/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as TimelinesPackedNativeEndpoints } from '../../timelines/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as UsersPackedNativeEndpoints } from '../../users/contract/packed-endpoint-definitions.js';

export type PackedNativeEndpoints = AnnouncementsPackedNativeEndpoints
	& AuthPackedNativeEndpoints
	& ChannelsPackedNativeEndpoints
	& ChatPackedNativeEndpoints
	& CollectionsPackedNativeEndpoints
	& DiscoveryPackedNativeEndpoints
	& DrivePackedNativeEndpoints
	& EmojisPackedNativeEndpoints
	& FederationPackedNativeEndpoints
	& GalleryPackedNativeEndpoints
	& GamesPackedNativeEndpoints
	& InstancePackedNativeEndpoints
	& IntegrationsPackedNativeEndpoints
	& ModerationPackedNativeEndpoints
	& NotesPackedNativeEndpoints
	& PagesPackedNativeEndpoints
	& PlayPackedNativeEndpoints
	& RelationshipsPackedNativeEndpoints
	& RolesPackedNativeEndpoints
	& TimelinesPackedNativeEndpoints
	& UsersPackedNativeEndpoints;
