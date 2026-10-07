/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '@features/index/backend/service-definitions.js';
import { bindLegacyService } from '@features/index/backend/feature-service-provider-types.js';
import type { Inputs, Port } from '@features/index/backend/service-definitions.js';

interface Apps { apps(): void }
interface Access { access(): void }
interface Sessions { sessions(): void }
interface Users { pack(): string; packMany(): string[]; unrelated(): void }
interface Ids { parse(): number; gen(): string; unrelated(): void }
declare const apps: Port<'appsRepository', Apps>;
declare const access: Port<'accessTokensRepository', Access>;
declare const sessions: Port<'authSessionsRepository', Sessions>;
declare const users: Port<'userEntityService', Users>;
declare const ids: Port<'idService', Ids>;
class App {
	constructor(_apps: Apps, _access: Access) {}
	pack(): string { return 'app'; }
}
class Session {
	constructor(_sessions: Sessions, _app: Pick<App, 'pack'>) {}
}
class Invite {
	constructor(_users: Pick<Users, 'pack'>, _ids: Pick<Ids, 'parse'>) {}
}
class Gen {
	constructor(_ids: Pick<Ids, 'gen'>) {}
}
class Zero {}
class Nine {
	constructor(_a: Apps, _b: Access, _c: Sessions, _d: Pick<Users, 'pack'>, _e: Pick<Ids, 'parse'>, _f: Apps, _g: Access, _h: Sessions, _i: Pick<Ids, 'gen'>) {}
}
const app = service(App, [apps, access]);
const auth = defineServices({
	App: app,
	Session: service(Session, [sessions, app]),
	Invite: service(Invite, [users, ids]),
	Gen: service(Gen, [ids]),
});
const deps: Inputs<typeof auth> = {
	appsRepository: { apps() {} }, accessTokensRepository: { access() {} },
	authSessionsRepository: { sessions() {} }, userEntityService: { pack: () => 'user' },
	idService: { parse: () => 1, gen: () => 'id' },
};
auth.create(deps);
const zero = defineServices({ Zero: service(Zero, []) });
zero.create();
service(Nine, [apps, access, sessions, users, ids, apps, access, sessions, ids]);
// @ts-expect-error Wrong repository token cannot widen the constructor.
service(App, [sessions, access]);
// @ts-expect-error Reversed incompatible constructor arguments.
service(App, [access, apps]);
// @ts-expect-error Missing tuple member.
service(App, [apps]);
// @ts-expect-error Extra tuple member.
service(App, [apps, access, sessions]);
// @ts-expect-error Raw symbols do not carry a typed port reference.
service(App, [Symbol('apps'), access]);
// @ts-expect-error Missing one of nine arguments.
service(Nine, [apps, access, sessions, users, ids, apps, access, sessions]);
// @ts-expect-error Wrong typed service dependency.
service(Session, [sessions, service(Zero, [])]);
// @ts-expect-error Zero-port create preserves its no-argument call shape.
zero.create({});
const { idService: _missing, ...withoutId } = deps;
// @ts-expect-error Derived plain input requires every named external port.
auth.create(withoutId);
// @ts-expect-error Narrow user input does not require or expose unrelated methods.
deps.userEntityService.unrelated();
// @ts-expect-error Narrow id input does not expose unrelated methods.
deps.idService.unrelated();

class UserImplementation implements Users {
	pack(): string { return 'user'; }
	packMany(): string[] { return []; }
	unrelated(): void {}
}
bindLegacyService(users, UserImplementation);
// @ts-expect-error Incorrect legacy class binding cannot widen its target constructor.
bindLegacyService(users, Zero);

// @ts-expect-error Raw structural definitions cannot bypass service() proof.
defineServices({ App: { kind: 'service', ctor: App, dependencies: [] } });
// @ts-expect-error Spreading a branded definition does not permit changing its proved tuple.
defineServices({ App: { ...app, dependencies: [] } });
// @ts-expect-error Spreading a branded definition does not permit changing its constructor.
defineServices({ Wrong: { ...app, ctor: Nine } });
