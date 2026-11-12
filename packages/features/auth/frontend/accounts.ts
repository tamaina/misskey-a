/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { clearSharedFiles } from '@@/js/shared-files.js';
import { apiUrl, host } from '@features/boot/frontend/shared/config.js';
import type { MenuItem } from '@features/navigation/frontend/types/menu.js';
import { showSuspendedDialog } from '@features/moderation/frontend/utility/show-suspended-dialog.js';
import FeatureLocaleMessages from '@features/auth/frontend/ts-messages.vue';
import { miLocalStorage } from '@features/preferences/frontend/local-storage.js';
import { waiting, popup, popupMenu, success, alert } from '@features/ui/frontend/os.js';
import { unisonReload, reloadChannel } from '@features/runtime/frontend/utility/unison-reload.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import { store } from '@features/preferences/frontend/store.js';
import { $i } from '@features/auth/frontend/i.js';
import { get } from '@features/runtime/frontend/utility/idb-proxy.js';
import { signout } from '@features/auth/frontend/signout.js';

type AccountWithToken = Misskey.entities.MeDetailed & { token: string };

// The live $i remains available until reload, even after its credential is removed.
const rejectedCredentials = new Map<string, string>();

/** Recover device-only credentials without writing a stale device-state snapshot back. */
async function loadAccountCredentials(keys: string[]) {
	await store.ready;
	if (keys.some(key => !store.s.accountTokens[key] || !store.s.accountInfos[key])) {
		const saved: Partial<Pick<typeof store.s, 'accountTokens' | 'accountInfos'>> | undefined = await get(store.deviceStateKeyName);
		if (saved?.accountTokens) {
			store.r.accountTokens.value = store.s.accountTokens = { ...saved.accountTokens, ...store.s.accountTokens };
		}
		if (saved?.accountInfos) {
			store.r.accountInfos.value = store.s.accountInfos = { ...saved.accountInfos, ...store.s.accountInfos };
		}
	}
	for (const [key, token] of rejectedCredentials) {
		if (store.s.accountTokens[key] !== token) continue;
		const tokens = { ...store.s.accountTokens };
		const accountInfos = { ...store.s.accountInfos };
		delete tokens[key];
		delete accountInfos[key];
		store.r.accountTokens.value = store.s.accountTokens = tokens;
		store.r.accountInfos.value = store.s.accountInfos = accountInfos;
	}
	return { tokens: store.s.accountTokens, accountInfos: store.s.accountInfos };
}

export async function getAccounts(): Promise<{
	host: string;
	id: Misskey.entities.User['id'];
	username: Misskey.entities.User['username'];
	user?: Misskey.entities.MeDetailed | null;
	token: string | null;
}[]> {
	await loadAccountCredentials(prefer.s.accounts.map(([host, user]) => host + '/' + user.id));
	// Keep a different saved token, but repair missing legacy credentials and list entries.
	const account = getCurrentAccountInfo();
	if ($i && account && rejectedCredentials.get(host + '/' + $i.id) !== $i.token) {
		await addAccount(host, account, store.s.accountTokens[host + '/' + $i.id] ?? $i.token);
	}
	const accounts = prefer.s.accounts;
	const tokens = store.s.accountTokens;
	const accountInfos = store.s.accountInfos;
	return accounts.map(([host, user]) => ({
		host,
		id: user.id,
		username: user.username,
		user: accountInfos[host + '/' + user.id],
		token: tokens[host + '/' + user.id] ?? null,
	}));
}

async function addAccount(host: string, user: Misskey.entities.MeDetailed, token: AccountWithToken['token']) {
	const key = host + '/' + user.id;
	if (rejectedCredentials.get(key) === token) return;
	await loadAccountCredentials([key]);
	if (store.s.accountTokens[key] !== token) {
		await store.set('accountTokens', { ...store.s.accountTokens, [key]: token });
	}
	if (JSON.stringify(store.s.accountInfos[key]) !== JSON.stringify(user)) {
		await store.set('accountInfos', { ...store.s.accountInfos, [key]: JSON.parse(JSON.stringify(user)) });
	}
	const listed = prefer.s.accounts.find(x => x[0] === host && x[1].id === user.id);
	if (!listed) {
		prefer.commit('accounts', [...prefer.s.accounts, [host, { id: user.id, username: user.username }]]);
	} else if (listed[1].username !== user.username) {
		prefer.commit('accounts', prefer.s.accounts.map(entry => entry === listed ? [host, { id: user.id, username: user.username }] : entry));
	}
}

export async function removeAccount(host: string, id: AccountWithToken['id']) {
	const tokens = JSON.parse(JSON.stringify(store.s.accountTokens));
	delete tokens[host + '/' + id];
	await store.set('accountTokens', tokens);
	const accountInfos = JSON.parse(JSON.stringify(store.s.accountInfos));
	delete accountInfos[host + '/' + id];
	await store.set('accountInfos', accountInfos);

	prefer.commit('accounts', prefer.s.accounts.filter(x => x[0] !== host || x[1].id !== id));
}

const isCredentialRejected = Symbol('isCredentialRejected');

function fetchAccount(token: string, id?: string, forceShowDialog?: boolean): Promise<Misskey.entities.MeDetailed> {
	return new Promise((done, fail) => {
		window.fetch(`${apiUrl}/i`, {
			method: 'POST',
			body: JSON.stringify({
				i: token,
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then(res => new Promise<Misskey.entities.MeDetailed | { error: Record<string, any> }>((done2, fail2) => {
				if (res.status >= 500 && res.status < 600) {
					// サーバーエラー(5xx)の場合をrejectとする
					// （認証エラーなど4xxはresolve）
					return fail2(res);
				}
				res.json().then(body => {
					if (res.status >= 400 && res.status < 500 && (!body || typeof body !== 'object' || !('error' in body))) {
						fail2(res);
					} else {
						done2(body);
					}
				}, fail2);
			}))
			.then(async res => {
				if ('error' in res) {
					let credentialRejected = true;
					if (res.error.id === 'a8c724b3-6e9c-4b46-b1a8-bc3ed6258370') {
						// SUSPENDED
						if (forceShowDialog || $i && (token === $i.token || id === $i.id)) {
							await showSuspendedDialog();
						}
					} else if (res.error.id === 'e5b3b9f0-2b8f-4b9f-9c1f-8c5c1b2e1b1a') {
						// USER_IS_DELETED
						// アカウントが削除されている
						if (forceShowDialog || $i && (token === $i.token || id === $i.id)) {
							await alert({
								type: 'error',
								title: FeatureLocaleMessages.$locale.accountDeleted,
								text: FeatureLocaleMessages.$locale.accountDeletedDescription,
							});
						}
					} else if (res.error.id === 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14') {
						// AUTHENTICATION_FAILED
						// トークンが無効化されていたりアカウントが削除されたりしている
						if (forceShowDialog || $i && (token === $i.token || id === $i.id)) {
							await alert({
								type: 'error',
								title: FeatureLocaleMessages.$locale.tokenRevoked,
								text: FeatureLocaleMessages.$locale.tokenRevokedDescription,
							});
						}
					} else {
						credentialRejected = false;
						await alert({
							type: 'error',
							title: FeatureLocaleMessages.$locale.failedToFetchAccountInformation,
							text: JSON.stringify(res.error),
						});
					}

					fail(credentialRejected ? isCredentialRejected : res.error);
				} else {
					done(res);
				}
			})
			.catch(fail);
	});
}

/** Retain the trusted live account proxy behind the native DTO type. */
function getCurrentAccountInfo(): Misskey.entities.MeDetailed | null {
	if (!$i) return null;
	const accounts: Record<string, Misskey.entities.MeDetailed> = {};
	// Keep the trusted live proxy while avoiding a recursive Vue UnwrapRef
	// comparison with the portable DTO's persisted JSON fields.
	const account: unknown = $i;
	Reflect.set(accounts, $i.id, account);
	return accounts[$i.id];
}

async function persistCurrentAccountInfo() {
	if (!$i) return;
	const accountInfos: Record<string, Misskey.entities.MeDetailed> = {};
	for (const [key, value] of Object.entries(store.s.accountInfos)) Reflect.set(accountInfos, key, value);
	Reflect.set(accountInfos, host + '/' + $i.id, JSON.parse(JSON.stringify(getCurrentAccountInfo())));
	if (JSON.stringify(store.s.accountInfos) !== JSON.stringify(accountInfos)) {
		await store.set('accountInfos', accountInfos);
	}
}

export function updateCurrentAccount(accountData: Misskey.entities.MeDetailed) {
	if (!$i) return;
	const token = $i.token;
	for (const key of Object.keys($i)) {
		Reflect.deleteProperty($i, key);
	}
	for (const [key, value] of Object.entries(accountData)) {
		Reflect.set($i, key, value);
	}
	$i.token = token;
	const persisted = persistCurrentAccountInfo();
	miLocalStorage.setItem('account', JSON.stringify($i));
	return persisted;
}

export function updateCurrentAccountPartial(accountData: Partial<Misskey.entities.MeDetailed>) {
	if (!$i) return;
	for (const [key, value] of Object.entries(accountData)) {
		Reflect.set($i, key, value);
	}

	persistCurrentAccountInfo();

	miLocalStorage.setItem('account', JSON.stringify($i));
}

export async function refreshCurrentAccount() {
	if (!$i) return;
	const me = $i;
	return fetchAccount($i.token, $i.id).then(async account => {
		rejectedCredentials.delete(host + '/' + me.id);
		await loadAccountCredentials([host + '/' + me.id]);
		await updateCurrentAccount(account);
		const currentAccount = getCurrentAccountInfo();
		if (currentAccount) await addAccount(host, currentAccount, me.token);
	}).catch(async reason => {
		if (reason === isCredentialRejected) {
			rejectedCredentials.set(host + '/' + me.id, me.token);
			// Load alternatives before removal so an IDB fallback cannot restore the rejected account.
			await loadAccountCredentials(prefer.s.accounts.map(([host, user]) => host + '/' + user.id));
			await removeAccount(host, me.id);
			if (Object.keys(store.s.accountTokens).length > 0) {
				await login(Object.values(store.s.accountTokens)[0]);
			} else {
				await signout('server-rejected-credential');
			}
		}
	});
}

export async function login(token: AccountWithToken['token'], redirect?: string) {
	const showing = ref(true);
	const { dispose } = popup(defineAsyncComponent(() => import('@features/ui/frontend/components/MkWaitingDialog.vue')), {
		success: false,
		showing: showing,
	}, {
		closed: () => dispose(),
	});

	const me = await fetchAccount(token, undefined, true).catch(reason => {
		showing.value = false;
		throw reason;
	});

	if ($i != null && $i.id !== me.id) {
		await clearSharedFiles().catch(reason => {
			showing.value = false;
			throw reason;
		});
	}

	rejectedCredentials.delete(host + '/' + me.id);
	const currentAccount = getCurrentAccountInfo();
	if ($i && currentAccount && $i.id !== me.id) {
		await addAccount(host, currentAccount, $i.token);
	}

	miLocalStorage.setItem('account', JSON.stringify({
		...me,
		token,
	}));

	await addAccount(host, me, token);

	if (redirect) {
		// 他のタブは再読み込みするだけ
		reloadChannel.postMessage(null);
		// このページはredirectで指定された先に移動
		window.location.href = redirect;
		return;
	}

	unisonReload();
}

export async function switchAccount(host: string, id: string) {
	const { tokens } = await loadAccountCredentials([host + '/' + id]);
	const token = tokens[host + '/' + id];
	if (token) {
		await login(token);
	} else {
		const { dispose } = popup(defineAsyncComponent(() => import('@features/auth/frontend/components/MkSigninDialog.vue')), {}, {
			done: async (res: Misskey.entities.SigninFlowResponse & { finished: true }) => {
				await store.set('accountTokens', { ...store.s.accountTokens, [host + '/' + res.id]: res.i });
				await login(res.i);
			},
			closed: () => {
				dispose();
			},
		});
	}
}

export async function getAccountMenu(opts: {
	includeCurrentAccount?: boolean;
	withExtraOperation: boolean;
	active?: Misskey.entities.User['id'];
	onChoose?: (account: Misskey.entities.MeDetailed) => void;
}) {
	if ($i == null) throw new Error('No current account');
	const me = $i;

	const callback = opts.onChoose;

	function createItem(host: string, id: Misskey.entities.User['id'], username: Misskey.entities.User['username'], account: Misskey.entities.UserLite | null | undefined, token: string | null, onChooseAccount?: () => void): MenuItem {
		if (account) {
			return {
				type: 'user' as const,
				user: account,
				active: opts.active != null ? opts.active === id : false,
				action: async () => {
					if (callback) {
						onChooseAccount?.();
					} else {
						switchAccount(host, id);
					}
				},
			};
		} else if (token != null) {
			return {
				type: 'button' as const,
				text: username,
				active: opts.active != null ? opts.active === id : false,
				action: async () => {
					if (callback) {
						fetchAccount(token, id).then(account => {
							callback(account);
						});
					} else {
						switchAccount(host, id);
					}
				},
			};
		} else { // プロファイルを復元した場合などはアカウントのトークンや詳細情報はstoreにキャッシュされていない
			return {
				type: 'button' as const,
				text: username,
				active: opts.active != null ? opts.active === id : false,
				action: async () => {
					const { dispose } = popup(defineAsyncComponent(() => import('@features/auth/frontend/components/MkSigninDialog.vue')), {
						initialUsername: username,
					}, {
						done: async (res: Misskey.entities.SigninFlowResponse & { finished: true }) => {
							await store.set('accountTokens', { ...store.s.accountTokens, [host + '/' + res.id]: res.i });

							if (callback) {
								fetchAccount(res.i, id).then(account => {
									callback(account);
								});
							} else {
								await switchAccount(host, id);
							}
						},
						closed: () => {
							dispose();
						},
					});
				},
			};
		}
	}

	const menuItems: MenuItem[] = [];

	// TODO: $iのホストも比較したいけど通常null
	const accountItems = (await getAccounts().then(accounts => accounts.filter(x => x.id !== me.id))).map(a => {
		const account = a.user;
		return createItem(a.host, a.id, a.username, account, a.token, account && callback ? () => callback(account) : undefined);
	});
	const currentAccount = callback ? getCurrentAccountInfo() : null;
	const chooseCurrentAccount = currentAccount && callback ? () => callback(currentAccount) : undefined;

	if (opts.withExtraOperation) {
		menuItems.push({
			type: 'link',
			text: FeatureLocaleMessages.$locale.profile,
			to: `/@${$i.username}`,
			avatar: $i,
		}, {
			type: 'divider',
		});

		if (opts.includeCurrentAccount) {
			menuItems.push(createItem(host, $i.id, $i.username, $i, $i.token, chooseCurrentAccount));
		}

		menuItems.push(...accountItems);

		menuItems.push({
			type: 'parent',
			icon: 'ti ti-plus',
			text: FeatureLocaleMessages.$locale.addAccount,
			children: [{
				text: FeatureLocaleMessages.$locale.existingAccount,
				action: () => {
					getAccountWithSigninDialog().then(res => {
						if (res != null) {
							success();
						}
					});
				},
			}, {
				text: FeatureLocaleMessages.$locale.createAccount,
				action: () => {
					getAccountWithSignupDialog().then(res => {
						if (res != null) {
							switchAccount(host, res.id);
						}
					});
				},
			}],
		}, {
			type: 'link',
			icon: 'ti ti-users',
			text: FeatureLocaleMessages.$locale.manageAccounts,
			to: '/settings/accounts',
		});
	} else {
		if (opts.includeCurrentAccount) {
			menuItems.push(createItem(host, $i.id, $i.username, $i, $i.token, chooseCurrentAccount));
		}

		menuItems.push(...accountItems);
	}

	return menuItems;
}

export function getAccountWithSigninDialog(): Promise<{ id: string, token: string } | null> {
	return new Promise((resolve) => {
		const { dispose } = popup(defineAsyncComponent(() => import('@features/auth/frontend/components/MkSigninDialog.vue')), {}, {
			done: async (res: Misskey.entities.SigninFlowResponse & { finished: true }) => {
				const user = await fetchAccount(res.i, res.id, true);
				await addAccount(host, user, res.i);
				resolve({ id: res.id, token: res.i });
			},
			cancelled: () => {
				resolve(null);
			},
			closed: () => {
				dispose();
			},
		});
	});
}

export function getAccountWithSignupDialog(): Promise<{ id: string, token: string } | null> {
	return new Promise((resolve) => {
		const { dispose } = popup(defineAsyncComponent(() => import('@features/auth/frontend/components/MkSignupDialog.vue')), {}, {
			done: async (res: Misskey.entities.SignupResponse) => {
				const user = JSON.parse(JSON.stringify(res));
				delete user.token;
				await addAccount(host, user, res.token);
				resolve({ id: res.id, token: res.token });
			},
			cancelled: () => {
				resolve(null);
			},
			closed: () => {
				dispose();
			},
		});
	});
}
