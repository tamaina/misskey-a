/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Buffer } from 'node:buffer';
import { describe, expect, test } from 'vitest';
import { sharpBmp } from '@misskey-dev/sharp-read-bmp';
import sharp from 'sharp';

/** A one-pixel 24-bit Windows BMP whose stored BGR pixel is pure red. */
function createRedBmp() {
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
	return bmp;
}

describe('drive image decoders', () => {
	test.each(['image/bmp', 'image/x-bmp', 'image/x-ms-bmp'])('preserves BMP pixel channels for %s', async mime => {
		const decoded = await sharpBmp(createRedBmp(), mime);
		const { data, info } = await decoded.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
		expect([info.width, info.height, info.channels]).toEqual([1, 1, 4]);
		expect([...data]).toEqual([255, 0, 0, 255]);
	});

	test('retains the normal PNG path', async () => {
		const png = await sharp(Buffer.from([0, 255, 0, 255]), { raw: { width: 1, height: 1, channels: 4 } }).png().toBuffer();
		const decoded = await sharpBmp(png, 'image/png');
		expect([...(await decoded.ensureAlpha().raw().toBuffer())]).toEqual([0, 255, 0, 255]);
	});
});
