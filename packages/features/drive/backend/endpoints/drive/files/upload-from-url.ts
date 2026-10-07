/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidDriveFilesUploadFromUrlDefinition, voidDriveFilesUploadFromUrlInput, voidDriveFilesUploadFromUrlOutput } from '../../../../contract/void-endpoint-definitions.js';
import ms from '@/runtime-dependencies/ms.js';
import { Injectable } from '@nestjs/common';

import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DriveFileEntityService } from '../../../serializers/DriveFileEntityService.js';
import { DriveService } from '../../../services/DriveService.js';

const contractProjection = projectEndpointContract(voidDriveFilesUploadFromUrlDefinition);

export const meta = {
	tags: ['drive'],

	limit: {
		duration: ms('1hour'),
		max: 60,
	},

	description: 'Request the server to download a new drive file from the specified URL.',

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:drive',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidDriveFilesUploadFromUrlInput, typeof voidDriveFilesUploadFromUrlOutput> {
	constructor(
		private driveFileEntityService: DriveFileEntityService,
		private driveService: DriveService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, contractProjection, async (ps, user, _1, _2, _3, ip, headers) => {
			this.driveService.uploadFromUrl({ url: ps.url, user, folderId: ps.folderId, sensitive: ps.isSensitive, force: ps.force, comment: ps.comment, requestIp: ip, requestHeaders: headers }).then(file => {
				this.driveFileEntityService.pack(file, { self: true }).then(packedFile => {
					this.globalEventService.publishMainStream(user.id, 'urlUploadFinished', {
						marker: ps.marker,
						file: packedFile,
					});
				});
			});
		});
	}
}
