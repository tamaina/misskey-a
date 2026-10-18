/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { AuthApiProvider } from './api.implementation.js';
import { SudoService } from './sudo.js';
export const authProviders = [AuthApiProvider, { provide: 'auth:SudoService', useExisting: SudoService }];
