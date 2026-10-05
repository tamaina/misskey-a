/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'node:events';
import { runCli } from '@misskey-a/boot/backend';

process.title = 'Misskey Cli';
Error.stackTraceLimit = Infinity;
EventEmitter.defaultMaxListeners = 128;

try {
	process.exitCode = await runCli(process.argv[2] ?? 'help', {
		ping: {
			description: 'Prints pong',
			run: () => { console.log('pong'); },
		},
		'reset-captcha': {
			description: 'Resets the captcha',
			async run() {
				// Transitional adapter: only this command needs the legacy container.
				await import('reflect-metadata');
				const [{ NestFactory }, { CommandModule }, { NestLogger }, { CommandService }] = await Promise.all([
					import('@nestjs/core'),
					import('@/cli/CommandModule.js'),
					import('@/NestLogger.js'),
					import('@/cli/CommandService.js'),
				]);
				const app = await NestFactory.createApplicationContext(CommandModule, { logger: new NestLogger() });
				try {
					await app.get(CommandService).resetCaptcha();
					console.log('Captcha has been reset.');
				} finally {
					await app.close();
				}
			},
		},
	}, console);
} catch (error) {
	console.error(error);
	process.exitCode = 1;
}
