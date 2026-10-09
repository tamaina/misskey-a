/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { readBirthdayDate } from '../birthday.schema.js';
import type { FollowingsRepository, UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { RelationshipsInputs, RelationshipsOutputs } from '../relationships.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class UsersGetFollowingUsersByBirthdayOperation {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
	) {}

	async execute(ps: RelationshipsInputs['users/get-following-users-by-birthday'], me: MiLocalUser) {
		const query = this.followingsRepository
			.createQueryBuilder('following')
			.andWhere('following.followerId = :userId', { userId: me.id })
			.innerJoin(this.userProfilesRepository.metadata.targetName, 'followeeProfile', 'followeeProfile.userId = following.followeeId');
		if ('begin' in ps.birthday && 'end' in ps.birthday) {
			const range = { begin: readBirthdayDate(ps.birthday.begin), end: readBirthdayDate(ps.birthday.end) };

			// 誕生日は mmdd の形式の最大4桁の数字（例: 8月30日 → 830）でインデックスが効くようになっているので、その形式に変換
			const begin = range.begin.month * 100 + range.begin.day;
			const end = range.end.month * 100 + range.end.day;

			if (begin <= end) {
				query.andWhere('get_birthday_date(followeeProfile.birthday) BETWEEN :begin AND :end', { begin, end });
			} else {
				// 12/31 から 1/1 の範囲を取得するために OR で対応
				query.andWhere(new Brackets(qb => {
					qb.where('get_birthday_date(followeeProfile.birthday) BETWEEN :begin AND 1231', { begin });
					qb.orWhere('get_birthday_date(followeeProfile.birthday) BETWEEN 101 AND :end', { end });
				}));
			}
		} else {
			const { month, day } = readBirthdayDate(ps.birthday);
			// なぜか get_birthday_date() = :birthday だとインデックスが効かないので、BETWEEN で対応
			query.andWhere('get_birthday_date(followeeProfile.birthday) BETWEEN :birthday AND :birthday', { birthday: month * 100 + day });
		}

		query.select('following.followeeId', 'user_id');
		query.addSelect('get_birthday_date(followeeProfile.birthday)', 'birthday_date');
		query.orderBy('birthday_date', 'ASC');

		const birthdayUsers = await query
			.offset(ps.offset).limit(ps.limit)
			.getRawMany<{ birthday_date: number; user_id: string }>();

		const users = new Map<string, RelationshipsOutputs['users/get-following-users-by-birthday'][number]['user']>((
			await this.userEntityService.packMany(
				birthdayUsers.map(u => u.user_id),
				me,
				{ schema: 'UserLite' },
			)
		).map(u => [u.id, u]));

		return birthdayUsers
			.map(item => {
				const birthday = new Date();
				birthday.setHours(0, 0, 0, 0);
				// item.birthday_date は mmdd の形式の最大4桁の数字（例: 8月30日 → 830）で出力されるので、日付に戻してDateオブジェクトに設定
				birthday.setMonth(Math.floor(item.birthday_date / 100) - 1, item.birthday_date % 100);

				if (birthday.getTime() < new Date().setHours(0, 0, 0, 0)) {
					birthday.setFullYear(new Date().getFullYear() + 1);
				}

				const birthdayStr = `${birthday.getFullYear()}-${(birthday.getMonth() + 1).toString().padStart(2, '0')}-${(birthday.getDate()).toString().padStart(2, '0')}`;
				return {
					id: item.user_id,
					birthday: birthdayStr,
					user: users.get(item.user_id),
				};
			})
			.filter((item): item is RelationshipsOutputs['users/get-following-users-by-birthday'][number] => item.user != null);
	}
}
