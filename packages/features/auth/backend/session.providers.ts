/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { AuthSessionApiProvider } from './api.implementation.js';
import { StandaloneAuthService } from './StandaloneAuthService.js';
export const sessionProviders = [AuthSessionApiProvider, StandaloneAuthService];
