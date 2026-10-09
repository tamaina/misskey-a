/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AuthSessionApplicationService } from './session.application.js';
import { StandaloneAuthService } from './StandaloneAuthService.js';
// Existing SigninApiService, SignupApiService, SigninWithPasskeyApiService and
// SigninService registrations remain ordinary application/service dependencies.
export const sessionProviders = [AuthSessionApplicationService, StandaloneAuthService];
