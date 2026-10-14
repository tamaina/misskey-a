/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { AnnouncementService } from '@features/announcements/backend/services/AnnouncementService.js';
import { ClipService } from '@features/collections/backend/services/ClipService.js';

@Injectable()
export class AnnouncementArchiveInitializer implements OnModuleInit {
	constructor(private readonly announcements: AnnouncementService) { }
	async onModuleInit(): Promise<void> {
		await this.announcements.restoreScheduledArchives();
	}
}

@Injectable()
export class ClipUpdatesShutdown implements OnApplicationShutdown {
	constructor(private readonly clips: ClipService) { }
	onApplicationShutdown(): void {
		this.clips.clearPendingUpdates();
	}
}

/** Boot-only hooks are private to composition, with no public service aliases. */
export const featureLifecycleProviders = [
	{ provide: Symbol('announcement archive initialization'), useClass: AnnouncementArchiveInitializer },
	{ provide: Symbol('clip updates shutdown'), useClass: ClipUpdatesShutdown },
];
