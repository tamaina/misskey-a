/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { ChannelEntityService } from './serializers/ChannelEntityService.js';

export const channelServices = defineServices({
	ChannelEntityService: service(ChannelEntityService, [ports.channelsRepository, ports.channelFollowingsRepository, ports.channelFavoritesRepository, ports.channelMutingRepository, ports.notesRepository, ports.driveFilesRepository, ports.noteEntityService, ports.driveFileEntityService, ports.idService]),
});
