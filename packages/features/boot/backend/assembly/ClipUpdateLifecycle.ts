/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { ClipService } from '@features/collections/backend/services/ClipService.js';

@Injectable()
export class ClipUpdatesShutdown implements OnApplicationShutdown {
	constructor(private readonly clips: ClipService) { }
	onApplicationShutdown(): void {
		this.clips.clearPendingUpdates();
	}
}

/** Clip timer cleanup belongs to boot composition rather than the pure service. */
export const clipUpdateLifecycleProvider = {
	provide: Symbol('clip updates shutdown'),
	useClass: ClipUpdatesShutdown,
};
