/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { SystemWebhookEntityService } from './serializers/SystemWebhookEntityService.js';

export const integrationServices = defineServices({
	SystemWebhookEntityService: service(SystemWebhookEntityService, [ports.systemWebhooksRepository]),
});
