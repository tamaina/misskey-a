/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Checked by the backend typecheck against actual constructors and
// RepositorySet tokens, including narrow factory inputs and invalid bindings.
import type { MiSystemWebhook, SystemWebhooksRepository } from '@features/persistence/backend/repositories/models.js';
import type { RepositorySet } from '@features/persistence/backend/repositories/factory.js';
import { authSecurityServices, authServices } from '@features/auth/backend/services.js';
import { channelServices } from '@features/channels/backend/services.js';
import { discoveryServices, rankingServices, userSearchServices } from '@features/discovery/backend/services.js';
import { AppEntityService } from '@features/auth/backend/serializers/AppEntityService.js';
import { AuthSessionEntityService } from '@features/auth/backend/serializers/AuthSessionEntityService.js';
import { InviteCodeEntityService } from '@features/auth/backend/serializers/InviteCodeEntityService.js';
import { SigninEntityService } from '@features/auth/backend/serializers/SigninEntityService.js';
import { ChannelEntityService } from '@features/channels/backend/serializers/ChannelEntityService.js';
import { HashtagEntityService } from '@features/discovery/backend/serializers/HashtagEntityService.js';
import { SystemWebhookEntityService } from '@features/integrations/backend/serializers/SystemWebhookEntityService.js';
import { mediaServices } from '@features/media/backend/services.js';
import { markupServices } from '@features/markup/backend/services.js';
import { preferencesServices } from '@features/preferences/backend/services.js';
import { moderationLoggingServices, moderationServices } from '@features/moderation/backend/services.js';
import { SensitiveMediaDetectionService } from '@features/media/backend/services/SensitiveMediaDetectionService.js';
import { AbuseReportNotificationRecipientEntityService } from '@features/moderation/backend/serializers/AbuseReportNotificationRecipientEntityService.js';
import { AbuseUserReportEntityService } from '@features/moderation/backend/serializers/AbuseUserReportEntityService.js';
import { ModerationLogEntityService } from '@features/moderation/backend/serializers/ModerationLogEntityService.js';
import { service } from '@features/index/backend/service-definitions.js';
import { ports } from '@features/index/backend/service-ports.js';
import { UserAuthService } from '@features/auth/backend/services/UserAuthService.js';
import { WebAuthnService } from '@features/auth/backend/services/WebAuthnService.js';
import type { Inputs } from '@features/index/backend/service-definitions.js';

type NarrowAuth = {
	appsRepository: ConstructorParameters<typeof AppEntityService>[0];
	accessTokensRepository: ConstructorParameters<typeof AppEntityService>[1];
	authSessionsRepository: ConstructorParameters<typeof AuthSessionEntityService>[0];
	registrationTicketsRepository: ConstructorParameters<typeof InviteCodeEntityService>[0];
	userEntityService: ConstructorParameters<typeof InviteCodeEntityService>[1];
	idService: ConstructorParameters<typeof InviteCodeEntityService>[2] & ConstructorParameters<typeof SigninEntityService>[0];
};
declare const narrow: NarrowAuth;
declare const channel: Inputs<typeof channelServices>;
authServices.create(narrow);
channelServices.create(channel);
discoveryServices.create();
const app = service(AppEntityService, [ports.appsRepository, ports.accessTokensRepository]);
service(AuthSessionEntityService, [ports.authSessionsRepository, app]);
service(ChannelEntityService, [ports.channelsRepository, ports.channelFollowingsRepository, ports.channelFavoritesRepository, ports.channelMutingRepository, ports.notesRepository, ports.driveFilesRepository, ports.noteEntityService, ports.driveFileEntityService, ports.idService]);
// @ts-expect-error Wrong actual RepositorySet token.
service(AppEntityService, [ports.authSessionsRepository, ports.accessTokensRepository]);
// @ts-expect-error Wrong actual token order.
service(AppEntityService, [ports.accessTokensRepository, ports.appsRepository]);
// @ts-expect-error Missing actual constructor argument.
service(AppEntityService, [ports.appsRepository]);
// @ts-expect-error Missing required plain port in the original factory call shape.
authServices.create({ ...narrow, idService: undefined });
// @ts-expect-error Hashtag is not the narrow App serializer port.
service(AuthSessionEntityService, [ports.authSessionsRepository, service(HashtagEntityService, [])]);
// @ts-expect-error Nine-port constructor cannot be called with only eight refs.
service(ChannelEntityService, [ports.channelsRepository, ports.channelFollowingsRepository, ports.channelFavoritesRepository, ports.channelMutingRepository, ports.notesRepository, ports.driveFilesRepository, ports.noteEntityService, ports.driveFileEntityService]);
// Known structural limit, intentionally accepted: MiChannelMuting adds fields to
// MiChannelFavorite, and its repository is assignable to that constructor port.
// Runtime contract tests verify the actual declaration's exact token ordering.
service(ChannelEntityService, [ports.channelsRepository, ports.channelFollowingsRepository, ports.channelMutingRepository, ports.channelMutingRepository, ports.notesRepository, ports.driveFilesRepository, ports.noteEntityService, ports.driveFileEntityService, ports.idService]);

// The actual repository factory, constructor alias and insert extension all own
// MiSystemWebhook; the old alias incorrectly specialized its extension as MiWebhook.
declare const systemRepository: RepositorySet['systemWebhooksRepository'];
const constructorRepository: SystemWebhooksRepository = systemRepository;
const actualRepository: RepositorySet['systemWebhooksRepository'] = constructorRepository;
const insertedSystemWebhook: Promise<MiSystemWebhook> = actualRepository.insertOne({ name: 'system', isActive: true });
void insertedSystemWebhook;
service(SystemWebhookEntityService, [ports.systemWebhooksRepository]);

// New factories use the real port/constructor graph; existing factories stay narrow.
declare const media: Inputs<typeof mediaServices>;
declare const markup: Inputs<typeof markupServices>;
declare const preferences: Inputs<typeof preferencesServices>;
declare const moderation: Inputs<typeof moderationServices>;
mediaServices.create(media);
markupServices.create(markup);
preferencesServices.create(preferences);
moderationServices.create(moderation);
type ModerationInputKey = 'abuseReportNotificationRecipientRepository' | 'abuseUserReportsRepository' | 'idService' | 'moderationLogsRepository' | 'systemWebhookEntityService' | 'userEntityService';
declare const moderationInputKeys: Record<keyof Inputs<typeof moderationServices>, true>;
declare const originalInputKeys: Record<ModerationInputKey, true>;
const preservedInputKeys: typeof originalInputKeys = moderationInputKeys;
const currentInputKeys: typeof moderationInputKeys = originalInputKeys;
void preservedInputKeys;
void currentInputKeys;
// @ts-expect-error The actual HTTP constructor input cannot accept a logger port.
service(SensitiveMediaDetectionService, [ports.meta, ports.loggerService, ports.loggerService]);
// @ts-expect-error Required real service port cannot be omitted from plain media inputs.
mediaServices.create({ config: media.config, meta: media.meta, loggerService: media.loggerService });

// Preserve complete original input/output value types, including parse-only Id.
type OriginalModerationInputs = {
	abuseReportNotificationRecipientRepository: ConstructorParameters<typeof AbuseReportNotificationRecipientEntityService>[0];
	abuseUserReportsRepository: ConstructorParameters<typeof AbuseUserReportEntityService>[0];
	moderationLogsRepository: ConstructorParameters<typeof ModerationLogEntityService>[0];
	userEntityService: ConstructorParameters<typeof AbuseReportNotificationRecipientEntityService>[1] & ConstructorParameters<typeof AbuseUserReportEntityService>[1] & ConstructorParameters<typeof ModerationLogEntityService>[1];
	systemWebhookEntityService: ConstructorParameters<typeof AbuseReportNotificationRecipientEntityService>[2];
	idService: ConstructorParameters<typeof AbuseUserReportEntityService>[2] & ConstructorParameters<typeof ModerationLogEntityService>[2];
};
declare const originalModerationInputs: OriginalModerationInputs;
const oldInputsStillAccepted: Inputs<typeof moderationServices> = originalModerationInputs;
const currentInputsStillOriginal: OriginalModerationInputs = moderation;
void oldInputsStillAccepted;
void currentInputsStillOriginal;
const actualModerationOutputs = moderationServices.create(originalModerationInputs);
declare const originalModerationOutputs: {
	AbuseReportNotificationRecipientEntityService: AbuseReportNotificationRecipientEntityService;
	AbuseUserReportEntityService: AbuseUserReportEntityService;
	ModerationLogEntityService: ModerationLogEntityService;
};
const oldOutputsStillAccepted: typeof actualModerationOutputs = originalModerationOutputs;
const currentOutputsStillOriginal: typeof originalModerationOutputs = actualModerationOutputs;
void oldOutputsStillAccepted;
void currentOutputsStillOriginal;
declare const logging: Inputs<typeof moderationLoggingServices>;
moderationLoggingServices.create(logging);

// The old auth factory retains full value types and all four original outputs.
declare const existingAuthInputs: Inputs<typeof authServices>;
const oldAuthInputsStillAccepted: Inputs<typeof authServices> = narrow;
const currentAuthInputsStillOriginal: NarrowAuth = existingAuthInputs;
void oldAuthInputsStillAccepted;
void currentAuthInputsStillOriginal;
const currentAuthOutputs = authServices.create(narrow);
declare const originalAuthOutputs: {
	AppEntityService: AppEntityService;
	AuthSessionEntityService: AuthSessionEntityService;
	InviteCodeEntityService: InviteCodeEntityService;
	SigninEntityService: SigninEntityService;
};
const oldAuthOutputsStillAccepted: typeof currentAuthOutputs = originalAuthOutputs;
const currentAuthOutputsStillOriginal: typeof originalAuthOutputs = currentAuthOutputs;
void oldAuthOutputsStillAccepted;
void currentAuthOutputsStillOriginal;
const currentDiscoveryOutputs = discoveryServices.create();
declare const originalDiscoveryOutputs: { HashtagEntityService: HashtagEntityService };
const oldDiscoveryOutputsStillAccepted: typeof currentDiscoveryOutputs = originalDiscoveryOutputs;
const currentDiscoveryOutputsStillOriginal: typeof originalDiscoveryOutputs = currentDiscoveryOutputs;
void oldDiscoveryOutputsStillAccepted;
void currentDiscoveryOutputsStillOriginal;
const originalDiscoveryCall: () => typeof originalDiscoveryOutputs = discoveryServices.create;
const currentDiscoveryCall: typeof discoveryServices.create = originalDiscoveryCall;
void currentDiscoveryCall;
declare const security: Inputs<typeof authSecurityServices>;
declare const userSearch: Inputs<typeof userSearchServices>;
authSecurityServices.create(security);
userSearchServices.create(userSearch);
service(UserAuthService, [ports.redisClient, ports.usersRepository, ports.userProfilesRepository]);
service(WebAuthnService, [ports.config, ports.meta, ports.redisClient, ports.userSecurityKeysRepository]);
// @ts-expect-error Config cannot replace the Redis constructor input.
service(UserAuthService, [ports.config, ports.usersRepository, ports.userProfilesRepository]);
// @ts-expect-error Redis is a required borrowed input, never created by the feature factory.
authSecurityServices.create({ config: security.config, meta: security.meta, usersRepository: security.usersRepository, userProfilesRepository: security.userProfilesRepository, userSecurityKeysRepository: security.userSecurityKeysRepository });

// Ranking keeps the former constructor types and excludes its local Featured edge from inputs.
type RankingArgs = ConstructorParameters<typeof import('@features/discovery/backend/services/HashtagService.js').HashtagService>;
type OriginalRankingInputs = {
	db: RankingArgs[0];
	meta: RankingArgs[1];
	redisClient: RankingArgs[2];
	hashtagsRepository: RankingArgs[3];
	userEntityService: RankingArgs[4];
	idService: RankingArgs[6];
	utilityService: RankingArgs[7];
};
declare const rankingOriginal: OriginalRankingInputs;
declare const rankingInferred: Inputs<typeof rankingServices>;
const rankingForward: Inputs<typeof rankingServices> = rankingOriginal;
const rankingBackward: OriginalRankingInputs = rankingInferred;
const rankingOutput: {
	FeaturedService: import('@features/discovery/backend/services/FeaturedService.js').FeaturedService;
	HashtagService: import('@features/discovery/backend/services/HashtagService.js').HashtagService;
} = rankingServices.create(rankingOriginal);
const rankingOutputReverse: ReturnType<typeof rankingServices.create> = rankingOutput;
void [rankingForward, rankingBackward, rankingOutputReverse];
