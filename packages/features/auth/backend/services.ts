/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { AppEntityService } from './serializers/AppEntityService.js';
import { AuthSessionEntityService } from './serializers/AuthSessionEntityService.js';
import { InviteCodeEntityService } from './serializers/InviteCodeEntityService.js';
import { SigninEntityService } from './serializers/SigninEntityService.js';
import { UserAuthService } from './services/UserAuthService.js';
import { WebAuthnService } from './services/WebAuthnService.js';
import type { Inputs, Outputs } from '../../index/backend/service-definitions.js';

const app = service(AppEntityService, [ports.appsRepository, ports.accessTokensRepository]);
export const authServices = defineServices({
	AppEntityService: app,
	AuthSessionEntityService: service(AuthSessionEntityService, [ports.authSessionsRepository, app]),
	InviteCodeEntityService: service(InviteCodeEntityService, [ports.registrationTicketsRepository, ports.userEntityService, ports.idService]),
	SigninEntityService: service(SigninEntityService, [ports.idService]),
});
export const createAuthServices = authServices.create;
export type AuthServicesDependencies = Inputs<typeof authServices>;
export type AuthServices = Outputs<typeof authServices>;

export const authSecurityServices = defineServices({
	UserAuthService: service(UserAuthService, [ports.redisClient, ports.usersRepository, ports.userProfilesRepository]),
	WebAuthnService: service(WebAuthnService, [ports.config, ports.meta, ports.redisClient, ports.userSecurityKeysRepository]),
});
export const createAuthSecurityServices = authSecurityServices.create;
export type AuthSecurityServicesDependencies = Inputs<typeof authSecurityServices>;
export type AuthSecurityServices = Outputs<typeof authSecurityServices>;
