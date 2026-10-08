/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Router } from '@features/navigation/frontend/router.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import FeatureLocaleMessages from '@features/discovery/frontend/ts-messages.vue';
import { mainRouter } from '@features/navigation/frontend/router.js';
import { acct } from '@features/users/frontend/filters/user.js';

export async function lookup(router?: Router) {
	const _router = router ?? mainRouter;

	const { canceled, result: temp } = await os.inputText({
		title: FeatureLocaleMessages.$locale.lookup,
	});
	const query = temp ? temp.trim() : '';
	if (canceled || query.length <= 1) return;

	if (query.startsWith('@') && !query.includes(' ')) {
		_router.pushByPath(`/${query}`);
		return;
	}

	if (query.startsWith('#')) {
		_router.push('/tags/:tag', {
			params: {
				tag: query.substring(1),
			}
		});
		return;
	}

	if (query.startsWith('https://')) {
		const res = await apLookup(query);

		if (res.type === 'User') {
			_router.push('/@:acct/:page?', {
				params: {
					acct: acct(res.object),
				},
			});
		} else if (res.type === 'Note') {
			_router.push('/notes/:noteId/:initialTab?', {
				params: {
					noteId: res.object.id,
				},
			});
		}

		return;
	}
}

export async function apLookup(query: string) {
	const promise = misskeyApi('ap/show', {
		uri: query,
	});

	os.promiseDialog(promise, null, (err) => {
		let title = FeatureLocaleMessages.$locale.somethingHappened;
		let text = err.message + '\n' + err.id;

		switch (err.id) {
			case '974b799e-1a29-4889-b706-18d4dd93e266':
				title = FeatureLocaleMessages.$locale._remoteLookupErrors._federationNotAllowed.title;
				text = FeatureLocaleMessages.$locale._remoteLookupErrors._federationNotAllowed.description;
				break;
			case '1a5eab56-e47b-48c2-8d5e-217b897d70db':
				title = FeatureLocaleMessages.$locale._remoteLookupErrors._uriInvalid.title;
				text = FeatureLocaleMessages.$locale._remoteLookupErrors._uriInvalid.description;
				break;
			case '81b539cf-4f57-4b29-bc98-032c33c0792e':
				title = FeatureLocaleMessages.$locale._remoteLookupErrors._requestFailed.title;
				text = FeatureLocaleMessages.$locale._remoteLookupErrors._requestFailed.description;
				break;
			case '70193c39-54f3-4813-82f0-70a680f7495b':
				title = FeatureLocaleMessages.$locale._remoteLookupErrors._responseInvalid.title;
				text = FeatureLocaleMessages.$locale._remoteLookupErrors._responseInvalid.description;
				break;
			case 'dc94d745-1262-4e63-a17d-fecaa57efc82':
				title = FeatureLocaleMessages.$locale._remoteLookupErrors._noSuchObject.title;
				text = FeatureLocaleMessages.$locale._remoteLookupErrors._noSuchObject.description;
				break;
		}

		os.alert({
			type: 'error',
			title,
			text,
		});
	}, FeatureLocaleMessages.$locale.fetchingAsApObject);

	return await promise;
}
