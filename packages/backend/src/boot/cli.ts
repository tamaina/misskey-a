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
				const { resetCaptcha } = await import('./reset-captcha.js');
				await resetCaptcha();
				console.log('Captcha has been reset.');
			},
		},
	}, console);
} catch (error) {
	console.error(error);
	process.exitCode = 1;
}
