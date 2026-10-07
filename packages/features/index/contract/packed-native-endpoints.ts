/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { PackedNativeEndpoints as AnnouncementsPackedNativeEndpoints } from '../../announcements/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as AuthPackedNativeEndpoints } from '../../auth/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as ChannelsPackedNativeEndpoints } from '../../channels/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as ChatPackedNativeEndpoints } from '../../chat/contract/packed-endpoint-definitions.js';
import type { PackedNativeEndpoints as CollectionsPackedNativeEndpoints } from '../../collections/contract/packed-endpoint-definitions.js';

export type PackedNativeEndpoints = AnnouncementsPackedNativeEndpoints
	& AuthPackedNativeEndpoints
	& ChannelsPackedNativeEndpoints
	& ChatPackedNativeEndpoints
	& CollectionsPackedNativeEndpoints;
