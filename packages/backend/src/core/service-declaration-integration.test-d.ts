/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Checked by the backend typecheck against actual constructors and
// RepositorySet tokens, including narrow factory inputs and invalid bindings.
import type { MiSystemWebhook, SystemWebhooksRepository } from '@/models/_.js';
import type { RepositorySet } from '@/models/repository-factory.js';
import { createAuthServices } from '../../../features/auth/backend/services.js';
import { createChannelServices } from '../../../features/channels/backend/services.js';
import { createDiscoveryServices } from '../../../features/discovery/backend/services.js';
import { AppEntityService } from '../../../features/auth/backend/serializers/AppEntityService.js';
import { AuthSessionEntityService } from '../../../features/auth/backend/serializers/AuthSessionEntityService.js';
import { InviteCodeEntityService } from '../../../features/auth/backend/serializers/InviteCodeEntityService.js';
import { SigninEntityService } from '../../../features/auth/backend/serializers/SigninEntityService.js';
import { ChannelEntityService } from '../../../features/channels/backend/serializers/ChannelEntityService.js';
import { HashtagEntityService } from '../../../features/discovery/backend/serializers/HashtagEntityService.js';
import { SystemWebhookEntityService } from '../../../features/integrations/backend/serializers/SystemWebhookEntityService.js';
import { service } from '../../../features/index/backend/service-definitions.js';
import { ports } from '../../../features/index/backend/service-ports.js';
import type { ChannelServicesDependencies } from '../../../features/channels/backend/services.js';

type NarrowAuth = {
	appsRepository: ConstructorParameters<typeof AppEntityService>[0];
	accessTokensRepository: ConstructorParameters<typeof AppEntityService>[1];
	authSessionsRepository: ConstructorParameters<typeof AuthSessionEntityService>[0];
	registrationTicketsRepository: ConstructorParameters<typeof InviteCodeEntityService>[0];
	userEntityService: ConstructorParameters<typeof InviteCodeEntityService>[1];
	idService: ConstructorParameters<typeof InviteCodeEntityService>[2] & ConstructorParameters<typeof SigninEntityService>[0];
};
declare const narrow: NarrowAuth;
declare const channel: ChannelServicesDependencies;
createAuthServices(narrow);
createChannelServices(channel);
createDiscoveryServices();
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
createAuthServices({ ...narrow, idService: undefined });
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
