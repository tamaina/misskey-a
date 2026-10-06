/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export { installShutdownSignalHandlers, isShutdownInProgress } from '@features/boot/backend';
export type { ShutdownTask, ShutdownHandlerOptions } from '@features/boot/backend';
