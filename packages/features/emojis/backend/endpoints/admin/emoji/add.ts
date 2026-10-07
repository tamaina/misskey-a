/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedAdminEmojiAddDefinition, packedAdminEmojiAddInput, packedAdminEmojiAddOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { DriveFilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { CustomEmojiService } from '../../../services/CustomEmojiService.js';
import { EmojiEntityService } from '../../../serializers/EmojiEntityService.js';
import { FILE_TYPE_IMAGE } from '@features/media/backend/file-types.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedAdminEmojiAddDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requiredRolePolicy: 'canManageCustomEmojis',
	kind: 'write:admin:emoji',

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'fc46b5a4-6b92-4c33-ac66-b806659bb5cf',
		},
		unsupportedFileType: {
			message: 'Unsupported file type.',
			code: 'UNSUPPORTED_FILE_TYPE',
			id: 'f7599d96-8750-af68-1633-9575d625c1a7',
		},
		duplicateName: {
			message: 'Duplicate name.',
			code: 'DUPLICATE_NAME',
			id: 'f7a3462c-4e6e-4069-8421-b9bd4f4c3975',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

// TODO: ロジックをサービスに切り出す

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAdminEmojiAddInput, typeof packedAdminEmojiAddOutput> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,
		private customEmojiService: CustomEmojiService,
		private emojiEntityService: EmojiEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const driveFile = await this.driveFilesRepository.findOneBy({ id: ps.fileId });
			if (driveFile == null) throw new ApiError(meta.errors.noSuchFile);
			const isDuplicate = await this.customEmojiService.checkDuplicate(ps.name);
			if (isDuplicate) throw new ApiError(meta.errors.duplicateName);
			if (!FILE_TYPE_IMAGE.includes(driveFile.type)) throw new ApiError(meta.errors.unsupportedFileType);

			const emoji = await this.customEmojiService.add({
				originalUrl: driveFile.url,
				publicUrl: driveFile.webpublicUrl ?? driveFile.url,
				fileType: driveFile.webpublicType ?? driveFile.type,
				name: ps.name,
				category: ps.category ?? null,
				aliases: ps.aliases ?? [],
				host: null,
				license: ps.license ?? null,
				isSensitive: ps.isSensitive ?? false,
				localOnly: ps.localOnly ?? false,
				roleIdsThatCanBeUsedThisEmojiAsReaction: ps.roleIdsThatCanBeUsedThisEmojiAsReaction ?? [],
			}, me);

			return this.emojiEntityService.packDetailed(emoji);
		});
	}
}
