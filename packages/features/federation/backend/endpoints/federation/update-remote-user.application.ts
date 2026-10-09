/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { ApPersonService } from '../../services/ApPersonService.js';
import { GetterService } from '../../../../api/backend/transport/GetterService.js';
import type { MiUser } from '../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { federationUpdateRemoteUserInput, federationUpdateRemoteUserOutput } from './update-remote-user.contract.js';

@Injectable()
export class FederationUpdateRemoteUserApplicationService {
	constructor(
		private getterService: GetterService,
		private apPersonService: ApPersonService,
	) {}

	public async execute(ps: v.InferOutput<typeof federationUpdateRemoteUserInput>, _me: MiUser): Promise<v.InferOutput<typeof federationUpdateRemoteUserOutput>> {
		const result = await (async () => {
			const user = await this.getterService.getRemoteUser(ps.userId);

			await this.apPersonService.updatePerson(user.uri!);
		})();
		return v.parse(federationUpdateRemoteUserOutput, result);
	}
}
