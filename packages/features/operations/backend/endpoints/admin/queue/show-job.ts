/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QUEUE_TYPES, QueueService } from '../../../../../runtime/backend/services/QueueService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:queue',

	res: {
		optional: false, nullable: false,
		ref: 'QueueJob',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		queue: { type: 'string', enum: QUEUE_TYPES },
		jobId: { type: 'string' },
	},
	required: ['queue', 'jobId'],
} as const;

@Injectable()
export class EndpointImplementation extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private queueService: QueueService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return this.queueService.queueGetJob(ps.queue, ps.jobId);
		});
	}
}
