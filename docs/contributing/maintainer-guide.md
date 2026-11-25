# Maintainer guide

Issue のトリアージ、レビュー、デプロイ、リリースを行うメンテナー向け。

[Contribution guide](../../CONTRIBUTING.md)

## Issue assignment

To the Committers: you should not assign someone on the Issue before the Final Decision.

## How issues are triaged

The Committers may:
* close an issue that is not reproducible on latest stable release,
* merge an issue into another issue,
* split an issue into multiple issues,
* or re-open that has been closed for some reason which is not applicable anymore.

@syuilo reserves the Final Decision rights including whether the project will implement feature and how to implement, these rights are not always exercised.

## Reviewers guide
Be willing to comment on the good points and not just the things you want fixed 💯

読んでおくといいやつ
- https://blog.lacolaco.net/posts/1e2cf439b3c2/
- https://konifar-zatsu.hatenadiary.jp/entry/2024/11/05/192421

### Review perspective
- Scope
	- Are the goals of the PR clear?
	- Is the granularity of the PR appropriate?
- Security
	- Does merging this PR create a vulnerability?
- Performance
	- Will merging this PR cause unexpected performance degradation?
	- Is there a more efficient way?
- Testing
	- Does the test ensure the expected behavior?
	- Are there any omissions or gaps?
	- Does it check for anomalies?

## Security Advisory

報告者向けの案内は [SECURITY.md](../../SECURITY.md) を参照。

### For misskey-dev member
修正PRがdevelopに追従されていないとマージできないので、マージできなかったら

> Could you merge or rebase onto upstream develop branch?

などと伝える。

## Deploy
The `/deploy` command by issue comment can be used to deploy the contents of a PR to the preview environment.
```
/deploy sha=<commit hash>
```
An actual domain will be assigned so you can test the federation.

## Merge

## Release
### Release Instructions
Use the existing [Release Manager [Dispatch] workflow](../../.github/workflows/release-with-dispatch.yml) for releases. Follow its configured inputs and repository settings; release branch creation, prereleases and release merging are handled by that workflow.

Before a version bump, synchronize `CHANGELOG.md` with all user-facing changes since the previous release and merge missing entries first. This synchronization is part of a release request.
