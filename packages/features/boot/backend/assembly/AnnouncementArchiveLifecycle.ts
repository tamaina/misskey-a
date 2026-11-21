/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { AnnouncementService } from '@features/announcements/backend/services/AnnouncementService.js';

@Injectable()
export class AnnouncementArchiveInitializer implements OnModuleInit {
	constructor(private readonly announcements: AnnouncementService) { }
	async onModuleInit(): Promise<void> {
		await this.announcements.restoreScheduledArchives();
	}
}

/** Archive startup restoration is private to boot, without a public service alias. */
export const announcementArchiveLifecycleProviders = [
	{ provide: Symbol('announcement archive initialization'), useClass: AnnouncementArchiveInitializer },
];
