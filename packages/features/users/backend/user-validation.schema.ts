/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

export const localUsernameSchema = v.pipe(v.string(), v.regex(/^\w{1,20}$/u));
export const passwordSchema = v.pipe(v.string(), v.minCodePoints(1));
export const nameSchema = v.pipe(v.string(), v.minCodePoints(1), v.maxCodePoints(50));
export const followedMessageSchema = v.pipe(v.string(), v.minCodePoints(1), v.maxCodePoints(256));
export const descriptionSchema = v.pipe(v.string(), v.minCodePoints(1), v.maxCodePoints(1500));
export const locationSchema = v.pipe(v.string(), v.minCodePoints(1), v.maxCodePoints(50));
export const birthdaySchema = v.pipe(v.string(), v.regex(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/u));
