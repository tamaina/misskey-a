/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull } from 'typeorm';
import { apiError, internalError } from '../../api/backend/transport/orpc-error.js';
import { FILE_TYPE_IMAGE } from '../../drive/backend/file-types.js';
import { sqlLikeEscape } from '../../persistence/backend/utility/sql-like-escape.js';
import type { InferContractRouterOutputs, InferSchemaOutput } from '@orpc/contract';
import type { emojisContract } from './api.contract.js';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { EmojisRepository, DriveFilesRepository } from '../../persistence/backend/repositories/models.js';
import type { MiEmoji } from './models/Emoji.js';
import type { MiDriveFile } from '../../drive/backend/models/DriveFile.js';
import type { CustomEmojiService } from './services/CustomEmojiService.js';
import type { EmojiEntityService } from './serializers/EmojiEntityService.js';
import type { DriveService } from '../../drive/backend/services/DriveService.js';
import type { QueryService } from '../../notes/backend/services/QueryService.js';
import type { UtilityService } from '../../federation/backend/services/UtilityService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { QueueService } from '../../runtime/backend/services/QueueService.js';

type Inputs = { [K in keyof typeof emojisContract]: InferSchemaOutput<NonNullable<(typeof emojisContract)[K]['~orpc']['inputSchema']>> };
type Outputs = InferContractRouterOutputs<typeof emojisContract>;

export interface EmojisOperations<Actor extends ApiActor> {
	add(input: Inputs['add'], actor: Actor): Promise<Outputs['add']>;
	addAliasesBulk(input: Inputs['addAliasesBulk'], actor: Actor): Promise<Outputs['addAliasesBulk']>;
	copy(input: Inputs['copy'], actor: Actor): Promise<Outputs['copy']>;
	delete(input: Inputs['delete'], actor: Actor): Promise<Outputs['delete']>;
	deleteBulk(input: Inputs['deleteBulk'], actor: Actor): Promise<Outputs['deleteBulk']>;
	importZip(input: Inputs['importZip'], actor: Actor): Promise<Outputs['importZip']>;
	list(input: Inputs['list'], actor: Actor): Promise<Outputs['list']>;
	listRemote(input: Inputs['listRemote'], actor: Actor): Promise<Outputs['listRemote']>;
	removeAliasesBulk(input: Inputs['removeAliasesBulk'], actor: Actor): Promise<Outputs['removeAliasesBulk']>;
	setAliasesBulk(input: Inputs['setAliasesBulk'], actor: Actor): Promise<Outputs['setAliasesBulk']>;
	setCategoryBulk(input: Inputs['setCategoryBulk'], actor: Actor): Promise<Outputs['setCategoryBulk']>;
	setLicenseBulk(input: Inputs['setLicenseBulk'], actor: Actor): Promise<Outputs['setLicenseBulk']>;
	update(input: Inputs['update'], actor: Actor): Promise<Outputs['update']>;
	emoji(input: Inputs['emoji'], actor: Actor | null): Promise<Outputs['emoji']>;
	emojis(input: Inputs['emojis'], actor: Actor | null): Promise<Outputs['emojis']>;
	exportCustomEmojis(input: Inputs['exportCustomEmojis'], actor: Actor): Promise<Outputs['exportCustomEmojis']>;
	v2List(input: Inputs['v2List'], actor: Actor): Promise<Outputs['v2List']>;
}

export interface EmojisDependencies<Actor extends ApiActor> {
	emojisRepository: Pick<EmojisRepository, 'find' | 'findOneOrFail' | 'findOneBy' | 'createQueryBuilder'>;
	driveFilesRepository: Pick<DriveFilesRepository, 'findOneBy'>;
	customEmojiService: Pick<CustomEmojiService, 'checkDuplicate' | 'fetchEmojis' | 'addAliasesBulk' | 'removeAliasesBulk' | 'setAliasesBulk' | 'setCategoryBulk' | 'setLicenseBulk'> & {
		add(data: Parameters<CustomEmojiService['add']>[0], actor: Actor): Promise<MiEmoji>;
		update(data: Parameters<CustomEmojiService['update']>[0], actor: Actor): ReturnType<CustomEmojiService['update']>;
		delete(id: string, actor: Actor): Promise<void>;
		deleteBulk(ids: string[], actor: Actor): Promise<void>;
	};
	emojiEntityService: Pick<EmojiEntityService, 'packDetailed' | 'packDetailedMany' | 'packSimpleMany' | 'packDetailedAdminMany'>;
	driveService: Pick<DriveService, 'uploadFromUrl'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
	utilityService: Pick<UtilityService, 'toPuny'>;
	idService: Pick<IdService, 'gen'>;
	queueService: Pick<QueueService, 'createImportCustomEmojisJob' | 'createExportCustomEmojisJob'>;
}

/** Application service for the native emoji surface; transport policy belongs to the router. */
export function createEmojisOperations<Actor extends ApiActor>(deps: EmojisDependencies<Actor>): EmojisOperations<Actor> {
	const fail = (code: string, message: string, id: string) => apiError({ code, message, id });
	const duplicate = () => fail('DUPLICATE_NAME', 'Duplicate name.', 'f7a3462c-4e6e-4069-8421-b9bd4f4c3975');
	return {
		async add(input, actor) {
			const file = await deps.driveFilesRepository.findOneBy({ id: input.fileId });
			if (file === null) throw fail('NO_SUCH_FILE', 'No such file.', 'fc46b5a4-6b92-4c33-ac66-b806659bb5cf');
			if (await deps.customEmojiService.checkDuplicate(input.name)) throw duplicate();
			if (!FILE_TYPE_IMAGE.includes(file.type)) throw fail('UNSUPPORTED_FILE_TYPE', 'Unsupported file type.', 'f7599d96-8750-af68-1633-9575d625c1a7');
			const emoji = await deps.customEmojiService.add({
				originalUrl: file.url, publicUrl: file.webpublicUrl ?? file.url, fileType: file.webpublicType ?? file.type,
				name: input.name, category: input.category ?? null, aliases: input.aliases ?? [], host: null,
				license: input.license ?? null, isSensitive: input.isSensitive ?? false, localOnly: input.localOnly ?? false,
				roleIdsThatCanBeUsedThisEmojiAsReaction: input.roleIdsThatCanBeUsedThisEmojiAsReaction ?? [],
			}, actor);
			return deps.emojiEntityService.packDetailed(emoji);
		},
		async copy(input, actor) {
			const emoji = await deps.emojisRepository.findOneBy({ id: input.emojiId });
			if (emoji === null) throw fail('NO_SUCH_EMOJI', 'No such emoji.', 'e2785b66-dca3-4087-9cac-b93c541cc425');
			let file: MiDriveFile;
			try {
				file = await deps.driveService.uploadFromUrl({ url: emoji.originalUrl, user: null, force: true });
			} catch {
				throw apiError(internalError);
			}
			if (await deps.customEmojiService.checkDuplicate(emoji.name)) throw duplicate();
			const added = await deps.customEmojiService.add({
				originalUrl: file.url, publicUrl: file.webpublicUrl ?? file.url, fileType: file.webpublicType ?? file.type,
				name: emoji.name, category: emoji.category, aliases: emoji.aliases, host: null,
				license: emoji.license, isSensitive: emoji.isSensitive, localOnly: emoji.localOnly,
				roleIdsThatCanBeUsedThisEmojiAsReaction: emoji.roleIdsThatCanBeUsedThisEmojiAsReaction,
			}, actor);
			return deps.emojiEntityService.packDetailed(added);
		},
		async update(input, actor) {
			const file = input.fileId ? await deps.driveFilesRepository.findOneBy({ id: input.fileId }) : undefined;
			if (file === null) throw fail('NO_SUCH_FILE', 'No such file.', '14fb9fd9-0731-4e2f-aeb9-f09e4740333d');
			const selector = 'id' in input ? { id: input.id, name: input.name } : { name: input.name };
			const error = await deps.customEmojiService.update({
				...selector, originalUrl: file?.url, publicUrl: file ? file.webpublicUrl ?? file.url : undefined,
				fileType: file ? file.webpublicType ?? file.type : undefined, category: input.category,
				aliases: input.aliases, license: input.license, isSensitive: input.isSensitive, localOnly: input.localOnly,
				roleIdsThatCanBeUsedThisEmojiAsReaction: input.roleIdsThatCanBeUsedThisEmojiAsReaction,
			}, actor);
			if (error === 'NO_SUCH_EMOJI') throw fail(error, 'No such emoji.', '684dec9d-a8c2-4364-9aa8-456c49cb1dc8');
			if (error === 'SAME_NAME_EMOJI_EXISTS') throw fail(error, 'Emoji that have same name already exists.', '7180fe9d-1ee3-bff9-647d-fe9896d2ffb8');
		},
		async delete(input, actor) {
			// Preserve the service's existing missing-row behavior; the legacy handler does not remap it.
			await deps.customEmojiService.delete(input.id, actor);
		},
		async deleteBulk(input, actor) { await deps.customEmojiService.deleteBulk(input.ids, actor); },
		async addAliasesBulk(input) { await deps.customEmojiService.addAliasesBulk(input.ids, input.aliases); },
		async removeAliasesBulk(input) { await deps.customEmojiService.removeAliasesBulk(input.ids, input.aliases); },
		async setAliasesBulk(input) { await deps.customEmojiService.setAliasesBulk(input.ids, input.aliases); },
		async setCategoryBulk(input) { await deps.customEmojiService.setCategoryBulk(input.ids, input.category ?? null); },
		async setLicenseBulk(input) { await deps.customEmojiService.setLicenseBulk(input.ids, input.license ?? null); },
		async importZip(input, actor) {
			await deps.queueService.createImportCustomEmojisJob(actor, input.fileId);
		},
		async exportCustomEmojis(_input, actor) {
			await deps.queueService.createExportCustomEmojisJob(actor);
		},
		async list(input) {
			const query = deps.queryService.makePaginationQuery(deps.emojisRepository.createQueryBuilder('emoji'), input.sinceId, input.untilId, input.sinceDate, input.untilDate)
				.andWhere('emoji.host IS NULL');
			let rows: MiEmoji[];
			const search = input.query;
			if (search) {
				rows = await query.getMany();
				const names = search.match(/\:([a-z0-9_]*)\:/g);
				rows = names ? rows.filter(row => names.includes(`:${row.name}:`))
					: rows.filter(row => row.name.includes(search) || row.aliases.some(alias => alias.includes(search)) || row.category?.includes(search));
				// The legacy search path deliberately returns limit + 1 rows.
				rows.splice(input.limit + 1);
			} else {
				rows = await query.limit(input.limit).getMany();
			}
			return deps.emojiEntityService.packDetailedMany(rows);
		},
		async listRemote(input) {
			const query = deps.queryService.makePaginationQuery(deps.emojisRepository.createQueryBuilder('emoji'), input.sinceId, input.untilId, input.sinceDate, input.untilDate);
			if (input.host === null) query.andWhere('emoji.host IS NOT NULL');
			else query.andWhere('emoji.host = :host', { host: deps.utilityService.toPuny(input.host) });
			if (input.query) query.andWhere('emoji.name like :query', { query: '%' + sqlLikeEscape(input.query) + '%' });
			return deps.emojiEntityService.packDetailedMany(await query.orderBy('emoji.id', 'DESC').limit(input.limit).getMany());
		},
		async emoji(input) {
			return deps.emojiEntityService.packDetailed(await deps.emojisRepository.findOneOrFail({ where: { name: input.name, host: IsNull() } }));
		},
		async emojis() {
			const packed = await deps.emojiEntityService.packSimpleMany(await deps.emojisRepository.find({ where: { host: IsNull() }, order: { category: 'ASC', name: 'ASC' } }));
			return { emojis: packed.map(emoji => {
				const result = { ...emoji };
				if (result.localOnly === undefined) delete result.localOnly;
				if (result.isSensitive === undefined) delete result.isSensitive;
				if (result.roleIdsThatCanBeUsedThisEmojiAsReaction === undefined) delete result.roleIdsThatCanBeUsedThisEmojiAsReaction;
				return result;
			}) };
		},
		async v2List(input) {
			const q = input.query;
			const result = await deps.customEmojiService.fetchEmojis({
				query: {
					updatedAtFrom: q?.updatedAtFrom, updatedAtTo: q?.updatedAtTo, name: q?.name, host: q?.host,
					uri: q?.uri, publicUrl: q?.publicUrl, type: q?.type, aliases: q?.aliases, category: q?.category,
					license: q?.license, isSensitive: q?.isSensitive, localOnly: q?.localOnly, hostType: q?.hostType, roleIds: q?.roleIds,
				},
				sinceId: input.sinceId ?? (input.sinceDate ? deps.idService.gen(input.sinceDate) : undefined),
				untilId: input.untilId ?? (input.untilDate ? deps.idService.gen(input.untilDate) : undefined),
			}, { limit: input.limit, page: input.page, sortKeys: input.sortKeys });
			return {
				emojis: await deps.emojiEntityService.packDetailedAdminMany(result.emojis),
				count: result.count, allCount: result.allCount, allPages: result.allPages,
			};
		},
	};
}
