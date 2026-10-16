/*
	* SPDX-FileCopyrightText: syuilo and misskey-project
	* SPDX-License-Identifier: AGPL-3.0-only
	*/

import type { MiSignin } from './models/Signin.js';

/** Sign-in histories persist the complete HTTP header JSON record. This narrow
	* application port avoids TypeORM's recursive partial interpretation of JSON. */
export interface SigninHistoryRecord {
	id: string;
	userId: string;
	ip: string;
	headers: Record<string, string | string[]>;
	success: boolean;
}
export interface SigninHistoryRepository {
	insert(entity: SigninHistoryRecord): Promise<unknown>;
	insertOne(entity: SigninHistoryRecord): Promise<MiSignin>;
}
