/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import test from 'node:test';
import { sharpBmp } from '@misskey-dev/sharp-read-bmp';
import sharp from 'sharp';

// A one-pixel 24-bit Windows BMP: the stored BGR pixel must become opaque red.
const bmp = Buffer.alloc(58);
bmp.write('BM');
bmp.writeUInt32LE(bmp.length, 2);
bmp.writeUInt32LE(54, 10);
bmp.writeUInt32LE(40, 14);
bmp.writeInt32LE(1, 18);
bmp.writeInt32LE(1, 22);
bmp.writeUInt16LE(1, 26);
bmp.writeUInt16LE(24, 28);
bmp.writeUInt32LE(4, 34);
bmp[56] = 255;

for (const mime of ['image/bmp', 'image/x-bmp', 'image/x-ms-bmp']) {
	test(`drive decoder preserves BMP pixel channels for ${mime}`, async () => {
		const decoded = await sharpBmp(bmp, mime);
		const { data, info } = await decoded.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
		assert.deepEqual([info.width, info.height, info.channels], [1, 1, 4]);
		assert.deepEqual([...data], [255, 0, 0, 255]);
	});
}

test('drive decoder retains the normal PNG path', async () => {
	const png = await sharp(Buffer.from([0, 255, 0, 255]), { raw: { width: 1, height: 1, channels: 4 } }).png().toBuffer();
	const decoded = await sharpBmp(png, 'image/png');
	assert.deepEqual([...(await decoded.ensureAlpha().raw().toBuffer())], [0, 255, 0, 255]);
});
