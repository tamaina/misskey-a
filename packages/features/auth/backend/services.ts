/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '@features/index/backend/service-definitions.js';
import { ports } from '@features/index/backend/service-ports.js';
import { AppEntityService } from './serializers/AppEntityService.js';
import { AuthSessionEntityService } from './serializers/AuthSessionEntityService.js';
import { InviteCodeEntityService } from './serializers/InviteCodeEntityService.js';
import { SigninEntityService } from './serializers/SigninEntityService.js';
import { BrowserSessionService } from './services/BrowserSessionService.js';
import { TotpService } from './services/TotpService.js';
import { WebAuthnService } from './services/WebAuthnService.js';
import { FreshReauthenticationStore } from './fresh-reauthentication-store.js';
import { FreshPasskeyReauthentication } from './fresh-passkey-reauthentication.js';

const app = service(AppEntityService, [ports.appsRepository, ports.accessTokensRepository]);
export const authServices = defineServices({
	AppEntityService: app,
	AuthSessionEntityService: service(AuthSessionEntityService, [ports.authSessionsRepository, app]),
	InviteCodeEntityService: service(InviteCodeEntityService, [ports.registrationTicketsRepository, ports.userEntityService, ports.idService]),
	SigninEntityService: service(SigninEntityService, [ports.idService]),
});

const browserSessions = service(BrowserSessionService, [ports.browserSessionsRepository, ports.idService]);
const freshStore = service(FreshReauthenticationStore, [ports.redisClient]);
export const authSecurityServices = defineServices({
	BrowserSessionService: browserSessions,
	FreshReauthenticationStore: freshStore,
	FreshPasskeyReauthentication: service(FreshPasskeyReauthentication, [freshStore, browserSessions, ports.userProfilesRepository, ports.userSecurityKeysRepository, ports.config]),
	UserAuthService: service(TotpService, [ports.redisClient, ports.usersRepository, ports.userProfilesRepository]),
	WebAuthnService: service(WebAuthnService, [ports.config, ports.meta, ports.redisClient, ports.userSecurityKeysRepository]),
});
