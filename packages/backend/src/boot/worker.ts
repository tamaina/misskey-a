/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import cluster from 'node:cluster';
import { Logger } from '@features/runtime/backend/logging/logger.js';
import { envOption } from '@/env.js';
import { loadConfig } from '@/config.js';
import type { Config } from '@/config.js';
import { configureLogging, shutdownLogging } from '@features/runtime/backend/logging/logging-runtime.js';
import { initTelemetry, shutdownTelemetry } from '@/core/telemetry/telemetry-registry.js';
import { initExtraThreadPool, acquireLegacyRole } from './common.js';
import { createProcessRoles, planRoles } from '@features/boot/backend';
import { readyRef } from './ready.js';
import { installShutdownSignalHandlers, isShutdownInProgress } from '@features/boot/backend/signals.js';

const logger = new Logger('core', 'cyan');
const bootLogger = logger.createSubLogger('boot', 'magenta');

/**
 * Init worker process
 */
export async function workerMain() {
	let config: Config;
	try {
		config = loadConfig();
		configureLogging(config.logging);
		logger.info(`Start worker process... pid: ${process.pid}`);
	} catch (e) {
		bootLogger.error(e instanceof Error ? e : new Error(String(e)), null, true);
		process.exit(1);
		return;
	}

	initExtraThreadPool(config);

	try {
		await initTelemetry(config);
	} catch (e) {
		bootLogger.error(e instanceof Error ? e : new Error(String(e)), null, true);
		process.exit(1);
	}
	const roles = createProcessRoles(planRoles({ worker: true, ...envOption }), acquireLegacyRole);
	const shutdown = installShutdownSignalHandlers({
		shutdownTasks: [async () => { readyRef.value = false; await roles.stop(); }, shutdownTelemetry, shutdownLogging],
		onRegistered: message => bootLogger.info(message),
	});

	try {
		await roles.start();
	} catch (error) {
		bootLogger.error(error instanceof Error ? error : new Error(String(error)), null, true);
		await shutdown(1);
		return;
	}
	if (isShutdownInProgress()) return;

	if (cluster.isWorker) {
		// Send a 'ready' message to parent process
		process.send!('ready');
	}
}
