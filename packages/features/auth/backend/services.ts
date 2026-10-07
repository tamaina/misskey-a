/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AppEntityService } from './serializers/AppEntityService.js';
import { AuthSessionEntityService } from './serializers/AuthSessionEntityService.js';
import { InviteCodeEntityService } from './serializers/InviteCodeEntityService.js';
import { SigninEntityService } from './serializers/SigninEntityService.js';
import type { AccessTokensRepository, AppsRepository, AuthSessionsRepository, RegistrationTicketsRepository } from '@/models/_.js';
import type { UserEntityService } from '../../users/backend/serializers/UserEntityService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';

export interface AuthServicesDependencies {
	appsRepository: AppsRepository;
	accessTokensRepository: AccessTokensRepository;
	authSessionsRepository: AuthSessionsRepository;
	registrationTicketsRepository: RegistrationTicketsRepository;
	userEntityService: Pick<UserEntityService, 'pack' | 'packMany'>;
	idService: Pick<IdService, 'parse'>;
}

/** Compose this feature without starting resources or resolving a container. */
export function createAuthServices(deps: AuthServicesDependencies) {
	const appEntityService = new AppEntityService(deps.appsRepository, deps.accessTokensRepository);
	const authSessionEntityService = new AuthSessionEntityService(deps.authSessionsRepository, appEntityService);
	const inviteCodeEntityService = new InviteCodeEntityService(deps.registrationTicketsRepository, deps.userEntityService, deps.idService);
	const signinEntityService = new SigninEntityService(deps.idService);

	return {
		AppEntityService: appEntityService,
		AuthSessionEntityService: authSessionEntityService,
		InviteCodeEntityService: inviteCodeEntityService,
		SigninEntityService: signinEntityService,
	};
}

export type AuthServices = ReturnType<typeof createAuthServices>;
