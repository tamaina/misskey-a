/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';

export const antennaEditorFile = 'packages/features/timelines/frontend/components/MkAntennaEditor.vue';
export const antennaEditorBaselineSha256 = '879fdc462f0bc83a23970af8776210d27c8ddc583fd449a0dee76dcf03f819d3';
const sha256 = (source: string) => createHash('sha256').update(source).digest('hex');

/** Keep all pre-existing locale hashes and edit boundaries when enabling the reviewed option. */
export function restoreHomeAntennaBaseline(file: string, source: string): string {
	if (file !== antennaEditorFile || sha256(source) === antennaEditorBaselineSha256) return source;
	if (sha256(source) !== 'b1c2c19c33476356b3692b18da5e9714e9942749497112e6b9e662d447c8c3a6') throw new Error(`Unreviewed antenna editor source: ${file}`);
	const restored = source.replace('{ value: \'home\',', '//{ value: \'home\',');
	if (sha256(restored) !== antennaEditorBaselineSha256) throw new Error(`Antenna editor baseline differs: ${file}`);
	return restored;
}
