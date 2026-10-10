# Original migration lineage

This fork restores the migration file names, classes, timestamps and SQL from
upstream proposals rather than retaining the renamed misskey-a port history.
See [#30](https://github.com/tamaina/misskey-a/issues/30).

| Proposal | Original migration files | Frozen source revision |
| --- | --- | --- |
| [#17917](https://github.com/misskey-dev/misskey/pull/17917) | `1708980134301-APMultipleKeys.js`, `1709269211718-APMultipleKeysFix1.js` | `877aebcd84742b6b1fbcea039dd80d283dfa07fd` |
| [#16250](https://github.com/misskey-dev/misskey/pull/16250) | `1709242519122-HttpSignImplLv.js` | `a572af46f993db9c706567ed74fcb9ed7b02ee8c` |
| [#16268](https://github.com/misskey-dev/misskey/pull/16268) | `1751848750315-RemoteSuspend.js` | `96d315600817601698a93ab70db6aa011e3390ae` |
| [#16279](https://github.com/misskey-dev/misskey/pull/16279) | `1752410859370-FollowingIsFollowerSuspended.js`, `1752410900000-FollowingIsFollowerSuspendedCopySuspendedState.js` | `1b9a4148624b85faba0aab985809881c9a33a567` |
| [#17998](https://github.com/misskey-dev/misskey/pull/17998) | `1791109435844-FollowApprovalByAccountAge.js` | `7cc2809a17e28132f570ea1c9d24fd2b45eef214` |

The signature capability field retains its original varchar(16) storage while
recognized wire markers remain two characters. The key migration remains two
steps; its original down path intentionally loses secondary keys and Ed25519
columns. The original remote-suspension down path does not recalculate following
flags. These behaviors are preserved rather than silently amended.

This intentionally breaks the recent misskey-a development migration history.
Disposable development instances initialized with the renamed migrations must
be deliberately recreated by their owner. Do not fake migration markers, run
down migrations, or automatically reset a database to bridge that history.
Non-disposable databases require a separate assessment and backups. Original
applied history is recognized without replaying these six existing migrations;
the approval migration still runs if absent. This is not a production rollout
procedure or proof of compatibility with every fork-specific schema change.
