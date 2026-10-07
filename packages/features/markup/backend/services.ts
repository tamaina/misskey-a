/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { MfmService } from './services/MfmService.js';

export const markupServices = defineServices({
	MfmService: service(MfmService, [ports.config]),
});
