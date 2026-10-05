/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export interface Command {
	description: string;
	run(): void | Promise<void>;
}

export interface ConsoleOutput {
	log(message: string): void;
	error(message: string): void;
}

/** Resolve a command before constructing any command-specific resources. */
export async function runCli(
	name: string,
	commands: Readonly<Record<string, Command>>,
	output: ConsoleOutput,
): Promise<number> {
	if (name === 'help') {
		output.log('Available commands:');
		output.log('  help - Displays this help message');
		for (const [key, command] of Object.entries(commands)) {
			output.log(`  ${key} - ${command.description}`);
		}
		return 0;
	}
	if (!Object.hasOwn(commands, name)) {
		output.error(`Unrecognized command: ${name}`);
		output.error('Use "help" to see available commands.');
		return 1;
	}
	await commands[name].run();
	return 0;
}
