# Feature ownership and bulk migration plan

This is the placement plan for the modular-monolith migration, not a claim that
all listed code has already moved. Public routes, authentication, database
schema and wire responses stay compatible. The inventory currently contains
438 registered API modules (415 legacy classes, 23 feature factories after the first batch), 94 core
services, 39 entity serializers, 35 job processors and 19 server-rendered view
files. The frontend has 245 Vue files under `pages`; these are not 245 distinct
routes (the router has 151 direct path bindings to 136 distinct page files).

The [file allocation table](feature-file-allocation.tsv) records 419 service, serializer, job and frontend source files with proposed targets and explicit split/review exceptions. It is a migration queue, not a list of completed moves.

## Layout and dependency rules

- `features/<feature>/contract`: portable oRPC/Valibot definitions and inferred
  public request/response types. `misskey-js` builds these sources; it does not
  independently define migrated request/response fields.
- `backend/services`, `backend/serializers`, `backend/models`, `backend/jobs`,
  `backend/templates`: the feature's behavior, wire packing, persistence models,
  background jobs and server-rendered views.
- `frontend/pages`, `frontend/components`, `frontend/state`: the feature's Vue
  surfaces, local translations and state. Existing migrated flat entries can be
  retained until the next mechanical layout batch; don't churn working paths.
- `shared`: genuinely portable feature logic only. No database, DOM or container
  access. It is not a place for arbitrary cross-feature dependencies.
- The existing `packages/backend`, `packages/frontend`, and `packages/misskey-js`
  remain build/dependency owners and composition/compatibility entry points.
  No feature package manifests, tsconfigs, lint configs or build directories.
- A feature consumes another feature's public contract or narrow injected port.
  `boot` assembles implementations and starts/stops them. Do not import another
  feature's private repository, service implementation or Vue internals.
- Temporary old-path reexports are allowed for mechanical placement migration,
  explicitly marked as compatibility bridges. A move alone is not DI conversion
  or contract-first completion.
- URL prefixes are not ownership boundaries: `admin/emoji` belongs to `emojis`,
  `admin/roles` to `roles`, and `i/notifications` to `notifications`.

## Domain placement

| Feature | Services / jobs it owns | API and frontend surfaces / templates |
| --- | --- | --- |
| `boot` | process roles, CLI tasks, startup/shutdown, subscription registration | boot UI, repair/CLI/flush server pages |
| `runtime` | Id, Logger, RemoteLogger, HTTP/download, storage, generic queue/event adapters; Cache/Utility/Email require the split noted below | no business API; transport capabilities injected by boot |
| `api` | request transport, common validation bridge, serialization/error policy, OpenAPI generation | API documentation template; definitions stay with their domain |
| `web` | common web shell/layout and static-page composition | base/base-embed, splash, error, common view props, info-card |
| `navigation` | frontend route composition and navigation lifecycle | application router, not-found, shell navigation |
| `ui` | domain-independent Vue primitives | button/input/select/dialog/form/layout primitives; no business state |
| `auth` | Signup, UserAuth, WebAuthn, Captcha; auth-session/signin/app serializers | sign-in/up, passwords, MFA, tokens, OAuth/MiAuth and OAuth SSR page |
| `users` | User, AccountUpdate, AccountMove, DeleteAccount, SystemAccount, Achievement; user serializers | profiles/account lifecycle, user pages; `user.tsx` |
| `relationships` | UserFollowing, UserBlocking, UserMuting, UserRenoteMuting, UserList; corresponding serializers/jobs | follow/block/mute/lists and relationship UI |
| `roles` | RoleService and RoleEntityService | role CRUD/policies/assignments, including admin role screens |
| `moderation` | AbuseReport, AbuseReportNotification, ModerationLog, UserSuspend; report serializers/jobs | reports, suspension and audit UI, not all admin routes |
| `instance` | MetaService and MetaEntityService; instance configuration | server metadata/settings, instance overview and advertisements |
| `operations` | administrative queue/storage/database control adapters | admin queue jobs/pause/resume/clear, health/maintenance UI |
| `statistics` | chart management/logger, telemetry, queue/server stats, retention/chart jobs | charts/statistics, dashboard widgets |
| `notes` | NoteCreate/Delete/Draft/Pining, Poll, Reaction, ReactionsBuffering; note serializers/jobs | notes/replies/renotes/reactions/polls, note UI; `note.tsx` |
| `timelines` | FanoutTimeline, FanoutTimelineEndpoint, Antenna; antenna serializer | timeline/antenna queries, timeline UI; consumes note read/event ports |
| `discovery` | Search, UserSearch, Hashtag, Featured; hashtag serializer | search/explore/trends/hashtags/featured views |
| `drive` | DriveService, drive-file/folder serializers, file deletion/cleanup jobs | files/folders/uploads, drive browser and admin drive surfaces |
| `media` | FileInfo, ImageProcessing, VideoProcessing, SensitiveMediaDetection | media transformation/detection ports and domain-independent media presentation |
| `emojis` | CustomEmoji, EmojiEntityService, emoji import/export jobs and frontend state | public/admin emoji API, catalog/picker/manager/editor |
| `avatar-decorations` | AvatarDecorationService | decoration catalog/manager/editor and admin routes |
| `federation` | all ActivityPub services, FederatedInstance, FetchInstanceMetadata, Relay, RemoteUserResolve, Webfinger, UserKeypair; inbox/delivery jobs | AP/WebFinger/remote instances/relays; protocol renderers stay here |
| `chat` | ChatService and ChatEntityService | rooms/messages/read state and chat Vue templates |
| `notifications` | Notification, PushNotification, notification serializer | notifications and web-push subscriptions/settings |
| `channels` | ChannelFollowing, ChannelMuting, ChannelEntityService | channel membership/content surfaces; `channel.tsx` |
| `collections` | ClipService, clip/note-favorite serializers | clips/favorites/bookmarks; `clip.tsx` |
| `pages` | PageService, Page/PageLike serializers | authored pages/editor/likes; `page.tsx` |
| `gallery` | gallery-post/like serializers | gallery CRUD/likes/exploration; `gallery-post.tsx` |
| `play` | FlashService, Flash/FlashLike serializers | Play/AiScript authoring and execution UI; `flash.tsx` |
| `games` | ReversiService and game serializers | Reversi/bubble-game APIs/UI; `reversi-game.tsx` |
| `announcements` | AnnouncementService and serializer | public/admin announcements/read state; `announcement.tsx` |
| `preferences` | RegistryApiService and scoped registry state | `i/registry/*`, client preferences; settings pages are assigned by their domain |
| `integrations` | UserWebhook, SystemWebhook, WebhookTest and delivery jobs | user/system webhooks and integrations UI |
| `portability` | user data import/export orchestration | `i/import-*` / `i/export-*` and import/export settings; domain-specific processors stay with data owners |
| `markup` | MfmService and portable content-format logic | MFM rendering/editing primitives shared through public ports |

## Exact server-template allocation

The compatibility paths below remain under `packages/backend/src/server/web/views/`;
the implementations are now in the assigned feature directories.

- `web/backend/templates`: `_.ts`, `base.tsx`, `base-embed.tsx`, `_splash.tsx`,
  `error.tsx`, `info-card.tsx`.
- `boot/backend/templates`: `bios.tsx`, `cli.tsx`, `flush.tsx`.
- `auth/backend/templates`: `oauth.tsx`.
- `users/backend/templates`: `user.tsx`.
- `notes/backend/templates`: `note.tsx`.
- `collections/backend/templates`: `clip.tsx`.
- `channels/backend/templates`: `channel.tsx`.
- `announcements/backend/templates`: `announcement.tsx`.
- `pages/backend/templates`: `page.tsx`.
- `gallery/backend/templates`: `gallery-post.tsx`.
- `play/backend/templates`: `flash.tsx`.
- `games/backend/templates`: `reversi-game.tsx`.

Email has no standalone template files in the current tree. Its common wrapper
is inline in EmailService; auth/report message bodies belong to their calling
features when extracted. Do not invent a missing email-template directory.

## Cross-cutting exceptions and ports

The import inventory finds a 34-service strongly connected component and a
three-service QueueService/webhook cycle. Moving files does not remove these.

- `MetaService`: instance owns settings; consumers receive a narrow, live policy
  reader rather than importing the whole mutable settings service.
- `RoleService`: roles owns capability evaluation; API/domain consumers receive
  capability readers, with trusted request context kept outside request input.
- `CacheService`: temporarily runtime-hosted; domain caches must be split to
  users/roles/relationships rather than becoming a global feature service locator.
- `QueryService`: split reusable SQL mechanics from domain visibility/filtering;
  note/user access rules cannot be moved into a generic utility by filename.
- `UtilityService`: classify methods before moving; not a blanket shared bucket.
- `EmailService`: runtime delivery adapter plus feature-owned message bodies.
- `QueueService`: runtime transport and boot registration. Processor ownership
  follows the data/protocol domain. Operations owns administrative control APIs.
- `GlobalEventService`: runtime delivery mechanism; event types and publishing
  intent belong to domains. Boot wires subscribers. Notes must not construct
  federation/notification/timeline services directly in the target design.
- `UserKeypairService`: federation owns AP key material; account workflows use
  an injected key-management port, avoiding a users↔federation implementation cycle.
- Account move/deletion and portability are orchestrations through domain ports,
  not permission to access every other feature's private tables.

## Batch process

1. Freeze an ownership list for each batch. Assign disjoint files to Luna workers;
   dot owns shared integration, schema exceptions and dependency directions.
2. Move source and rewrite imports mechanically, preserving body/metadata hashes
   where possible. Keep short old-path bridges when required for incremental boot.
3. Convert repeated endpoint families together to feature contracts/factories;
   preserve auth, error IDs, defaults, await/fire-and-forget behavior and API shape.
4. Run type checks, targeted behavior tests and a full OpenAPI comparison once per
   batch; run full backend/frontend/SDK gates and real browser/DB smoke per merged
   checkpoint, not one full cycle for each endpoint.
5. Record placement-only, contract, DI and locale completion separately. Dynamic
   schema expressions, inaccurate legacy response descriptions, cycles and file-
   relative asset access are explicit exceptions, not hidden `any` conversions.

First parallel batches: common/domain SSR template placement; administrative
queue command contracts; user-data export orchestration contracts. The registry
family is held out of the automatic recipe because `get` returns arbitrary stored
JSON despite its legacy object-only response description. That needs an explicit
compatibility decision before output validation is introduced.

The first checkpoint relocates all 19 SSR implementations and converts six queue
commands plus eight user-export endpoints. The old SSR paths remain temporary
reexports. Feature TSX is included in backend type checking, lint and watch builds.

The next placement checkpoint moves all 39 entity serializers to their domain's
`backend/serializers`. Old paths directly reexport the same constructor and types;
this does not claim the existing Nest services have been converted to ports.
Backend source, test and test-server configurations share a backend-owned path map.
Vitest uses the same dependency paths and legacy-decorator/JSX settings for feature
sources. Constructor metadata and old/new class identity are checked explicitly.
