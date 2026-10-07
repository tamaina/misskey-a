<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<SearchMarker path="/admin/settings" :label="$locale.sfc.general" :keywords="['general', 'settings']" icon="ti ti-settings">
			<div class="_gaps_m">
				<SearchMarker v-slot="slotProps" :keywords="['information', 'meta']">
					<MkFolder :defaultOpen="true">
						<template #icon><SearchIcon><i class="ti ti-info-circle"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ $locale.sfc.info }}</SearchLabel></template>
						<template v-if="infoForm.modified.value" #footer>
							<MkFormFooter :form="infoForm"/>
						</template>

						<div class="_gaps">
							<SearchMarker :keywords="['name']">
								<MkInput v-model="infoForm.state.name">
									<template #label><SearchLabel>{{ $locale.sfc.instanceName }}</SearchLabel><span v-if="infoForm.modifiedStates.name" class="_modified">{{ $locale.sfc.modified }}</span></template>
								</MkInput>
							</SearchMarker>

							<SearchMarker :keywords="['shortName']">
								<MkInput v-model="infoForm.state.shortName">
									<template #label><SearchLabel>{{ $locale.sfc.shortName }}</SearchLabel> ({{ $locale.sfc.optional }})<span v-if="infoForm.modifiedStates.shortName" class="_modified">{{ $locale.sfc.modified }}</span></template>
									<template #caption><SearchText>{{ $locale.sfc.shortNameDescription }}</SearchText></template>
								</MkInput>
							</SearchMarker>

							<SearchMarker :keywords="['description']">
								<MkTextarea v-model="infoForm.state.description">
									<template #label><SearchLabel>{{ $locale.sfc.instanceDescription }}</SearchLabel><span v-if="infoForm.modifiedStates.description" class="_modified">{{ $locale.sfc.modified }}</span></template>
								</MkTextarea>
							</SearchMarker>

							<FormSplit :minWidth="300">
								<SearchMarker :keywords="['maintainer', 'name']">
									<MkInput v-model="infoForm.state.maintainerName">
										<template #label><SearchLabel>{{ $locale.sfc.maintainerName }}</SearchLabel><span v-if="infoForm.modifiedStates.maintainerName" class="_modified">{{ $locale.sfc.modified }}</span></template>
									</MkInput>
								</SearchMarker>

								<SearchMarker :keywords="['maintainer', 'email', 'contact']">
									<MkInput v-model="infoForm.state.maintainerEmail" type="email">
										<template #label><SearchLabel>{{ $locale.sfc.maintainerEmail }}</SearchLabel><span v-if="infoForm.modifiedStates.maintainerEmail" class="_modified">{{ $locale.sfc.modified }}</span></template>
										<template #prefix><i class="ti ti-mail"></i></template>
									</MkInput>
								</SearchMarker>
							</FormSplit>

							<SearchMarker :keywords="['tos', 'termsOfService']">
								<MkInput v-model="infoForm.state.tosUrl" type="url">
									<template #label><SearchLabel>{{ $locale.sfc.tosUrl }}</SearchLabel><span v-if="infoForm.modifiedStates.tosUrl" class="_modified">{{ $locale.sfc.modified }}</span></template>
									<template #prefix><i class="ti ti-link"></i></template>
								</MkInput>
							</SearchMarker>

							<SearchMarker :keywords="['privacyPolicy']">
								<MkInput v-model="infoForm.state.privacyPolicyUrl" type="url">
									<template #label><SearchLabel>{{ $locale.sfc.privacyPolicyUrl }}</SearchLabel><span v-if="infoForm.modifiedStates.privacyPolicyUrl" class="_modified">{{ $locale.sfc.modified }}</span></template>
									<template #prefix><i class="ti ti-link"></i></template>
								</MkInput>
							</SearchMarker>

							<SearchMarker :keywords="['inquiry', 'contact']">
								<MkInput v-model="infoForm.state.inquiryUrl" type="url">
									<template #label><SearchLabel>{{ $locale.sfc.inquiryUrl }}</SearchLabel><span v-if="infoForm.modifiedStates.inquiryUrl" class="_modified">{{ $locale.sfc.modified }}</span></template>
									<template #caption><SearchText>{{ $locale.sfc.inquiryUrlDescription }}</SearchText></template>
									<template #prefix><i class="ti ti-link"></i></template>
								</MkInput>
							</SearchMarker>

							<SearchMarker :keywords="['repository', 'url']">
								<MkInput v-model="infoForm.state.repositoryUrl" type="url">
									<template #label><SearchLabel>{{ $locale.sfc.repositoryUrl }}</SearchLabel><span v-if="infoForm.modifiedStates.repositoryUrl" class="_modified">{{ $locale.sfc.modified }}</span></template>
									<template #caption><SearchText>{{ $locale.sfc.repositoryUrlDescription }}</SearchText></template>
									<template #prefix><i class="ti ti-link"></i></template>
								</MkInput>
							</SearchMarker>

							<MkInfo v-if="!instance.providesTarball && !infoForm.state.repositoryUrl" warn>
								{{ $locale.sfc.repositoryUrlOrTarballRequired }}
							</MkInfo>

							<SearchMarker :keywords="['impressum', 'legalNotice']">
								<MkInput v-model="infoForm.state.impressumUrl" type="url">
									<template #label><SearchLabel>{{ $locale.sfc.impressumUrl }}</SearchLabel><span v-if="infoForm.modifiedStates.impressumUrl" class="_modified">{{ $locale.sfc.modified }}</span></template>
									<template #caption><SearchText>{{ $locale.sfc.impressumDescription }}</SearchText></template>
									<template #prefix><i class="ti ti-link"></i></template>
								</MkInput>
							</SearchMarker>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker v-slot="slotProps" :keywords="['pinned', 'users']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #icon><SearchIcon><i class="ti ti-user-star"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ $locale.sfc.pinnedUsers }}</SearchLabel></template>
						<template v-if="pinnedUsersForm.modified.value" #footer>
							<MkFormFooter :form="pinnedUsersForm"/>
						</template>

						<MkTextarea v-model="pinnedUsersForm.state.pinnedUsers">
							<template #label>{{ $locale.sfc.pinnedUsers }}<span v-if="pinnedUsersForm.modifiedStates.pinnedUsers" class="_modified">{{ $locale.sfc.modified }}</span></template>
							<template #caption><SearchText>{{ $locale.sfc.pinnedUsersDescription }}</SearchText></template>
						</MkTextarea>
					</MkFolder>
				</SearchMarker>

				<SearchMarker v-slot="slotProps" :keywords="['serviceWorker']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #icon><SearchIcon><i class="ti ti-world-cog"></i></SearchIcon></template>
						<template #label><SearchLabel>ServiceWorker</SearchLabel></template>
						<template v-if="serviceWorkerForm.modified.value" #footer>
							<MkFormFooter :form="serviceWorkerForm"/>
						</template>

						<div class="_gaps">
							<SearchMarker>
								<MkSwitch v-model="serviceWorkerForm.state.enableServiceWorker">
									<template #label><SearchLabel>{{ $locale.sfc.enableServiceworker }}</SearchLabel><span v-if="serviceWorkerForm.modifiedStates.enableServiceWorker" class="_modified">{{ $locale.sfc.modified }}</span></template>
									<template #caption><SearchText>{{ $locale.sfc.serviceworkerInfo }}</SearchText></template>
								</MkSwitch>
							</SearchMarker>

							<template v-if="serviceWorkerForm.state.enableServiceWorker">
								<SearchMarker>
									<MkInput v-model="serviceWorkerForm.state.swPublicKey">
										<template #label><SearchLabel>Public key</SearchLabel><span v-if="serviceWorkerForm.modifiedStates.swPublicKey" class="_modified">{{ $locale.sfc.modified }}</span></template>
										<template #prefix><i class="ti ti-key"></i></template>
									</MkInput>
								</SearchMarker>

								<SearchMarker>
									<MkInput v-model="serviceWorkerForm.state.swPrivateKey">
										<template #label><SearchLabel>Private key</SearchLabel><span v-if="serviceWorkerForm.modifiedStates.swPrivateKey" class="_modified">{{ $locale.sfc.modified }}</span></template>
										<template #prefix><i class="ti ti-key"></i></template>
									</MkInput>
								</SearchMarker>
							</template>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker v-slot="slotProps" :keywords="['ads']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #icon><SearchIcon><i class="ti ti-ad"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ $locale.sfc.adsSettings }}</SearchLabel></template>
						<template v-if="adForm.modified.value" #footer>
							<MkFormFooter :form="adForm"/>
						</template>

						<div class="_gaps">
							<div class="_gaps_s">
								<SearchMarker>
									<MkInput v-model="adForm.state.notesPerOneAd" :min="0" type="number">
										<template #label><SearchLabel>{{ $locale.sfc.notesPerOneAd }}</SearchLabel><span v-if="adForm.modifiedStates.notesPerOneAd" class="_modified">{{ $locale.sfc.modified }}</span></template>
										<template #caption>{{ $locale.sfc.setZeroToDisable }}</template>
									</MkInput>
								</SearchMarker>

								<MkInfo v-if="adForm.state.notesPerOneAd > 0 && adForm.state.notesPerOneAd < 20" :warn="true">
									{{ $locale.sfc.adsTooClose }}
								</MkInfo>
							</div>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker v-slot="slotProps" :keywords="['url', 'preview']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #icon><SearchIcon><i class="ti ti-world-search"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ $locale.sfc.title }}</SearchLabel></template>
						<template v-if="urlPreviewForm.modified.value" #footer>
							<MkFormFooter :form="urlPreviewForm"/>
						</template>

						<div class="_gaps">
							<SearchMarker>
								<MkSwitch v-model="urlPreviewForm.state.urlPreviewEnabled">
									<template #label><SearchLabel>{{ $locale.sfc.enable }}</SearchLabel><span v-if="urlPreviewForm.modifiedStates.urlPreviewEnabled" class="_modified">{{ $locale.sfc.modified }}</span></template>
								</MkSwitch>
							</SearchMarker>

							<template v-if="urlPreviewForm.state.urlPreviewEnabled">
								<SearchMarker :keywords="['allow', 'redirect']">
									<MkSwitch v-model="urlPreviewForm.state.urlPreviewAllowRedirect">
										<template #label><SearchLabel>{{ $locale.sfc.allowRedirect }}</SearchLabel><span v-if="urlPreviewForm.modifiedStates.urlPreviewAllowRedirect" class="_modified">{{ $locale.sfc.modified }}</span></template>
										<template #caption>{{ $locale.sfc.allowRedirectDescription }}</template>
									</MkSwitch>
								</SearchMarker>

								<SearchMarker :keywords="['contentLength']">
									<MkSwitch v-model="urlPreviewForm.state.urlPreviewRequireContentLength">
										<template #label><SearchLabel>{{ $locale.sfc.requireContentLength }}</SearchLabel><span v-if="urlPreviewForm.modifiedStates.urlPreviewRequireContentLength" class="_modified">{{ $locale.sfc.modified }}</span></template>
										<template #caption>{{ $locale.sfc.requireContentLengthDescription }}</template>
									</MkSwitch>
								</SearchMarker>

								<SearchMarker :keywords="['contentLength']">
									<MkInput v-model="urlPreviewForm.state.urlPreviewMaximumContentLength" type="number">
										<template #label><SearchLabel>{{ $locale.sfc.maximumContentLength }}</SearchLabel><span v-if="urlPreviewForm.modifiedStates.urlPreviewMaximumContentLength" class="_modified">{{ $locale.sfc.modified }}</span></template>
										<template #caption>{{ $locale.sfc.maximumContentLengthDescription }}</template>
									</MkInput>
								</SearchMarker>

								<SearchMarker :keywords="['timeout']">
									<MkInput v-model="urlPreviewForm.state.urlPreviewTimeout" type="number">
										<template #label><SearchLabel>{{ $locale.sfc.timeout }}</SearchLabel><span v-if="urlPreviewForm.modifiedStates.urlPreviewTimeout" class="_modified">{{ $locale.sfc.modified }}</span></template>
										<template #caption>{{ $locale.sfc.timeoutDescription }}</template>
									</MkInput>
								</SearchMarker>

								<SearchMarker :keywords="['userAgent']">
									<MkInput v-model="urlPreviewForm.state.urlPreviewUserAgent" type="text">
										<template #label><SearchLabel>{{ $locale.sfc.userAgent }}</SearchLabel><span v-if="urlPreviewForm.modifiedStates.urlPreviewUserAgent" class="_modified">{{ $locale.sfc.modified }}</span></template>
										<template #caption>{{ $locale.sfc.userAgentDescription }}</template>
									</MkInput>
								</SearchMarker>

								<div>
									<SearchMarker :keywords="['proxy']">
										<MkInput v-model="urlPreviewForm.state.urlPreviewSummaryProxyUrl" type="text">
											<template #label><SearchLabel>{{ $locale.sfc.summaryProxy }}</SearchLabel><span v-if="urlPreviewForm.modifiedStates.urlPreviewSummaryProxyUrl" class="_modified">{{ $locale.sfc.modified }}</span></template>
											<template #caption>[{{ $locale.sfc.notUsePleaseLeaveBlank }}] {{ $locale.sfc.summaryProxyDescription }}</template>
										</MkInput>
									</SearchMarker>

									<div :class="$style.subCaption">
										{{ $locale.sfc.summaryProxyDescription2 }}
										<ul style="padding-left: 20px; margin: 4px 0">
											<li>{{ $locale.sfc.timeout }} / key:timeout</li>
											<li>{{ $locale.sfc.maximumContentLength }} / key:contentLengthLimit</li>
											<li>{{ $locale.sfc.requireContentLength }} / key:contentLengthRequired</li>
											<li>{{ $locale.sfc.userAgent }} / key:userAgent</li>
										</ul>
									</div>
								</div>

								<SearchMarker :keywords="['deny', 'list']">
									<MkTextarea v-model="urlPreviewForm.state.urlPreviewSensitiveList" tall>
										<template #label><SearchLabel>{{ $locale.sfc.urlPreviewSensitiveList }}</SearchLabel><span v-if="urlPreviewForm.modifiedStates.urlPreviewSensitiveList" class="_modified">{{ $locale.sfc.modified }}</span></template>
										<template #caption>{{ $locale.sfc.urlPreviewSensitiveListDescription }}</template>
									</MkTextarea>
								</SearchMarker>
							</template>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker v-slot="slotProps" :keywords="['federation']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #icon><SearchIcon><i class="ti ti-planet"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ $locale.sfc.federation }}</SearchLabel></template>
						<template v-if="federationForm.savedState.federation === 'all'" #suffix>{{ $locale.sfc.all }}</template>
						<template v-else-if="federationForm.savedState.federation === 'specified'" #suffix>{{ $locale.sfc.specifyHost }}</template>
						<template v-else-if="federationForm.savedState.federation === 'none'" #suffix>{{ $locale.sfc.none }}</template>
						<template v-if="federationForm.modified.value" #footer>
							<MkFormFooter :form="federationForm"/>
						</template>

						<div class="_gaps">
							<SearchMarker>
								<MkRadios
									v-model="federationForm.state.federation"
									:options="[
										{ value: 'all', label: $locale.sfc.all },
										{ value: 'specified', label: $locale.sfc.specifyHost },
										{ value: 'none', label: $locale.sfc.none },
									]"
								>
									<template #label><SearchLabel>{{ $locale.sfc.behavior }}</SearchLabel><span v-if="federationForm.modifiedStates.federation" class="_modified">{{ $locale.sfc.modified }}</span></template>
								</MkRadios>
							</SearchMarker>

							<SearchMarker :keywords="['hosts']">
								<MkTextarea v-if="federationForm.state.federation === 'specified'" v-model="federationForm.state.federationHosts">
									<template #label><SearchLabel>{{ $locale.sfc.federationAllowedHosts }}</SearchLabel><span v-if="federationForm.modifiedStates.federationHosts" class="_modified">{{ $locale.sfc.modified }}</span></template>
									<template #caption>{{ $locale.sfc.federationAllowedHostsDescription }}</template>
								</MkTextarea>
							</SearchMarker>

							<SearchMarker :keywords="['suspended', 'software']">
								<MkFolder>
									<template #icon><i class="ti ti-list"></i></template>
									<template #label><SearchLabel>{{ $locale.sfc.deliverSuspendedSoftware }}</SearchLabel></template>
									<template #footer>
										<div class="_buttons">
											<MkButton @click="federationForm.state.deliverSuspendedSoftware.push({software: '', versionRange: ''})"><i class="ti ti-plus"></i> {{ $locale.sfc.add }}</MkButton>
										</div>
									</template>

									<div :class="$style.metadataRoot" class="_gaps_s">
										<MkInfo>{{ $locale.sfc.deliverSuspendedSoftwareDescription }}</MkInfo>
										<div v-for="(element, index) in federationForm.state.deliverSuspendedSoftware" :key="index" v-panel :class="$style.fieldDragItem">
											<button class="_button" :class="$style.dragItemRemove" @click="federationForm.state.deliverSuspendedSoftware.splice(index, 1)"><i class="ti ti-x"></i></button>
											<div :class="$style.dragItemForm">
												<FormSplit :minWidth="200">
													<MkInput v-model="element.software" small :placeholder="$locale.sfc.softwareName">
													</MkInput>
													<MkInput v-model="element.versionRange" small :placeholder="$locale.sfc.version">
													</MkInput>
												</FormSplit>
											</div>
										</div>
									</div>
								</MkFolder>
							</SearchMarker>

							<SearchMarker :keywords="['sign', 'get']">
								<MkSwitch v-model="federationForm.state.signToActivityPubGet">
									<template #label><SearchLabel>{{ $locale.sfc.signToActivityPubGet }}</SearchLabel><span v-if="federationForm.modifiedStates.signToActivityPubGet" class="_modified">{{ $locale.sfc.modified }}</span></template>
									<template #caption><SearchText>{{ $locale.sfc.signToActivityPubGet_description }}</SearchText></template>
								</MkSwitch>
							</SearchMarker>

							<SearchMarker :keywords="['proxy', 'remote', 'files']">
								<MkSwitch v-model="federationForm.state.proxyRemoteFiles">
									<template #label><SearchLabel>{{ $locale.sfc.proxyRemoteFiles }}</SearchLabel><span v-if="federationForm.modifiedStates.proxyRemoteFiles" class="_modified">{{ $locale.sfc.modified }}</span></template>
									<template #caption><SearchText>{{ $locale.sfc.proxyRemoteFiles_description }}</SearchText></template>
								</MkSwitch>
							</SearchMarker>

							<SearchMarker :keywords="['allow', 'external', 'redirect']">
								<MkSwitch v-model="federationForm.state.allowExternalApRedirect">
									<template #label><SearchLabel>{{ $locale.sfc.allowExternalApRedirect }}</SearchLabel><span v-if="federationForm.modifiedStates.allowExternalApRedirect" class="_modified">{{ $locale.sfc.modified }}</span></template>
									<template #caption>
										<div><SearchText>{{ $locale.sfc.allowExternalApRedirect_description }}</SearchText></div>
										<div>{{ $locale.sfc.needToRestartServerToApply }}</div>
									</template>
								</MkSwitch>
							</SearchMarker>

							<SearchMarker :keywords="['cache', 'remote', 'files']">
								<MkSwitch v-model="federationForm.state.cacheRemoteFiles">
									<template #label><SearchLabel>{{ $locale.sfc.cacheRemoteFiles }}</SearchLabel><span v-if="federationForm.modifiedStates.cacheRemoteFiles" class="_modified">{{ $locale.sfc.modified }}</span></template>
									<template #caption><SearchText>{{ $locale.sfc.cacheRemoteFilesDescription }}</SearchText>{{ $locale.sfc.youCanCleanRemoteFilesCache }}</template>
								</MkSwitch>
							</SearchMarker>

							<template v-if="federationForm.state.cacheRemoteFiles">
								<SearchMarker :keywords="['cache', 'remote', 'sensitive', 'files']">
									<MkSwitch v-model="federationForm.state.cacheRemoteSensitiveFiles">
										<template #label><SearchLabel>{{ $locale.sfc.cacheRemoteSensitiveFiles }}</SearchLabel><span v-if="federationForm.modifiedStates.cacheRemoteSensitiveFiles" class="_modified">{{ $locale.sfc.modified }}</span></template>
										<template #caption><SearchText>{{ $locale.sfc.cacheRemoteSensitiveFilesDescription }}</SearchText></template>
									</MkSwitch>
								</SearchMarker>
							</template>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker v-slot="slotProps" :keywords="['proxy', 'account']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #icon><SearchIcon><i class="ti ti-ghost"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ $locale.sfc.proxyAccount }}</SearchLabel></template>
						<template v-if="proxyAccountForm.modified.value" #footer>
							<MkFormFooter :form="proxyAccountForm"/>
						</template>

						<div class="_gaps">
							<MkInfo>{{ $locale.sfc.proxyAccountDescription }}</MkInfo>

							<SearchMarker :keywords="['description']">
								<MkTextarea v-model="proxyAccountForm.state.description" :max="500" tall mfmAutocomplete :mfmPreview="true">
									<template #label><SearchLabel>{{ $locale.sfc.description }}</SearchLabel></template>
									<template #caption>{{ $locale.sfc.youCanIncludeHashtags }}</template>
								</MkTextarea>
							</SearchMarker>
						</div>
					</MkFolder>
				</SearchMarker>

				<MkButton primary @click="openSetupWizard">
					Open setup wizard
				</MkButton>
			</div>
		</SearchMarker>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkInput from '@features/ui/frontend/components/MkInput.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import FormSplit from '@features/ui/frontend/components/form/split.vue';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { fetchInstance, instance } from '@features/instance/frontend/instance.js';
import { definePage } from '@features/navigation/frontend/page.js';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import { useForm } from '@features/ui/frontend/composables/use-form.js';
import MkFormFooter from '@features/ui/frontend/components/MkFormFooter.vue';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';

const meta = await misskeyApi('admin/meta');

const proxyAccount = await misskeyApi('users/show', { userId: meta.proxyAccountId });

const infoForm = useForm({
	name: meta.name ?? '',
	shortName: meta.shortName ?? '',
	description: meta.description ?? '',
	maintainerName: meta.maintainerName ?? '',
	maintainerEmail: meta.maintainerEmail ?? '',
	tosUrl: meta.tosUrl ?? '',
	privacyPolicyUrl: meta.privacyPolicyUrl ?? '',
	inquiryUrl: meta.inquiryUrl ?? '',
	repositoryUrl: meta.repositoryUrl ?? '',
	impressumUrl: meta.impressumUrl ?? '',
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		name: state.name,
		shortName: state.shortName === '' ? null : state.shortName,
		description: state.description,
		maintainerName: state.maintainerName,
		maintainerEmail: state.maintainerEmail,
		tosUrl: state.tosUrl,
		privacyPolicyUrl: state.privacyPolicyUrl,
		inquiryUrl: state.inquiryUrl,
		repositoryUrl: state.repositoryUrl,
		impressumUrl: state.impressumUrl,
	});
	fetchInstance(true);
});

const pinnedUsersForm = useForm({
	pinnedUsers: meta.pinnedUsers.join('\n'),
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		pinnedUsers: state.pinnedUsers.split('\n'),
	});
	fetchInstance(true);
});

const serviceWorkerForm = useForm({
	enableServiceWorker: meta.enableServiceWorker,
	swPublicKey: meta.swPublickey ?? '',
	swPrivateKey: meta.swPrivateKey ?? '',
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		enableServiceWorker: state.enableServiceWorker,
		swPublicKey: state.swPublicKey,
		swPrivateKey: state.swPrivateKey,
	});
	fetchInstance(true);
});

const adForm = useForm({
	notesPerOneAd: meta.notesPerOneAd,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		notesPerOneAd: state.notesPerOneAd,
	});
	fetchInstance(true);
});

const urlPreviewForm = useForm({
	urlPreviewEnabled: meta.urlPreviewEnabled,
	urlPreviewAllowRedirect: meta.urlPreviewAllowRedirect,
	urlPreviewTimeout: meta.urlPreviewTimeout,
	urlPreviewMaximumContentLength: meta.urlPreviewMaximumContentLength,
	urlPreviewRequireContentLength: meta.urlPreviewRequireContentLength,
	urlPreviewUserAgent: meta.urlPreviewUserAgent ?? '',
	urlPreviewSummaryProxyUrl: meta.urlPreviewSummaryProxyUrl ?? '',
	urlPreviewSensitiveList: meta.urlPreviewSensitiveList.join('\n'),
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		urlPreviewEnabled: state.urlPreviewEnabled,
		urlPreviewAllowRedirect: state.urlPreviewAllowRedirect,
		urlPreviewTimeout: state.urlPreviewTimeout,
		urlPreviewMaximumContentLength: state.urlPreviewMaximumContentLength,
		urlPreviewRequireContentLength: state.urlPreviewRequireContentLength,
		urlPreviewUserAgent: state.urlPreviewUserAgent,
		urlPreviewSummaryProxyUrl: state.urlPreviewSummaryProxyUrl,
		urlPreviewSensitiveList: state.urlPreviewSensitiveList.split('\n'),
	});
	fetchInstance(true);
});

const federationForm = useForm({
	federation: meta.federation,
	federationHosts: meta.federationHosts.join('\n'),
	deliverSuspendedSoftware: meta.deliverSuspendedSoftware,
	signToActivityPubGet: meta.signToActivityPubGet,
	proxyRemoteFiles: meta.proxyRemoteFiles,
	allowExternalApRedirect: meta.allowExternalApRedirect,
	cacheRemoteFiles: meta.cacheRemoteFiles,
	cacheRemoteSensitiveFiles: meta.cacheRemoteSensitiveFiles,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		federation: state.federation,
		federationHosts: state.federationHosts.split('\n'),
		deliverSuspendedSoftware: state.deliverSuspendedSoftware,
		signToActivityPubGet: state.signToActivityPubGet,
		proxyRemoteFiles: state.proxyRemoteFiles,
		allowExternalApRedirect: state.allowExternalApRedirect,
		cacheRemoteFiles: state.cacheRemoteFiles,
		cacheRemoteSensitiveFiles: state.cacheRemoteSensitiveFiles,
	});
	fetchInstance(true);
});

const proxyAccountForm = useForm({
	description: proxyAccount.description,
}, async (state) => {
	await os.apiWithDialog('admin/update-proxy-account', {
		description: state.description,
	});
	fetchInstance(true);
});

async function openSetupWizard() {
	const { canceled } = await os.confirm({
		type: 'warning',
		title: $locale.value.sfc.restartServerSetupWizardConfirm_title,
		text: $locale.value.sfc.restartServerSetupWizardConfirm_text,
	});
	if (canceled) return;

	const { dispose } = await os.popupAsyncWithDialog(import('@features/boot/frontend/components/MkServerSetupWizardDialog.vue').then(x => x.default), {
	}, {
		closed: () => dispose(),
	});
}

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.general,
	icon: 'ti ti-settings',
}));
</script>

<style lang="scss" module>
.subCaption {
	font-size: 0.85em;
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
}

.metadataRoot {
	container-type: inline-size;
}

.fieldDragItem {
	display: flex;
	padding: 10px;
	align-items: flex-end;
	border-radius: 6px;

	/* (drag button) 32px + (drag button margin) 8px + (input width) 200px * 2 + (input gap) 12px = 452px */
	@container (max-width: 452px) {
		align-items: center;
	}
}

.dragItemHandle {
	cursor: grab;
	width: 32px;
	height: 32px;
	margin: 0 8px 0 0;
	opacity: 0.5;
	flex-shrink: 0;

	&:active {
		cursor: grabbing;
	}
}

.dragItemRemove {
	@extend .dragItemHandle;

	color: #ff2a2a;
	opacity: 1;
	cursor: pointer;

	&:hover, &:focus {
		opacity: .7;
	}

	&:active {
		cursor: pointer;
	}
}

.dragItemForm {
	flex-grow: 1;
}
</style>

<locale locale="ar-SA" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Restart server setup wizard?",
	"restartServerSetupWizardConfirm_text": "Some current settings will be reset.",
	"general": "الرئيسية",
	"info": "عن",
	"instanceName": "اسم مثيل الخادم",
	"modified": "Modified",
	"shortName": "Short name",
	"optional": "اختياري",
	"shortNameDescription": "A shorthand for the instance's name that can be displayed if the full official name is long.",
	"instanceDescription": "وصف مثيل الخادم",
	"maintainerName": "المدير",
	"maintainerEmail": "عنوان بريد المدير الإلكتروني",
	"tosUrl": "رابط صفحة شروط الخدمة",
	"privacyPolicyUrl": "Privacy Policy URL",
	"inquiryUrl": "Inquiry URL",
	"inquiryUrlDescription": "Specify a URL for the inquiry form to the server maintainer or a web page for the contact information.",
	"repositoryUrl": "Repository URL",
	"repositoryUrlDescription": "If you are using Misskey as is (without any changes to the source code), enter https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "If you have not published a repository, you must provide a tarball instead. See .config/example.yml for more information.",
	"impressumUrl": "Impressum URL",
	"impressumDescription": "In some countries, like germany, the inclusion of operator contact information (an Impressum) is legally required for commercial websites.",
	"pinnedUsers": "المستخدمون المثبتون",
	"pinnedUsersDescription": "قائمة المستخدمين المثبتين في لسان \"استكشف\" ، اجعل كل اسم مستخدم في سطر لوحده.",
	"enableServiceworker": "فعّل إرسال الإشعارات للمتصفح",
	"serviceworkerInfo": "يجب أن يفعل لإرسال الإشعارات.",
	"adsSettings": "Ad settings",
	"notesPerOneAd": "Real-time update ad placement interval (Notes per ad)",
	"setZeroToDisable": "Set this value to 0 to disable real-time update ads",
	"adsTooClose": "The current ad interval may significantly worsen the user experience due to being too low.",
	"title": "URL preview settings",
	"enable": "Enable URL preview",
	"allowRedirect": "Allow URL preview redirection",
	"allowRedirectDescription": "If a URL has a redirection set, you can enable this feature to follow the redirection and display a preview of the redirected content. Disabling this will save server resources, but redirected content will not be displayed.",
	"requireContentLength": "Generate the preview only if you could get Content-Length",
	"requireContentLengthDescription": "If other server doesn't return Content-Length, the preview won't be generated.",
	"maximumContentLength": "Maximum Content-Length (bytes)",
	"maximumContentLengthDescription": "If Content-Length is higher than this value, the preview won't be generated.",
	"timeout": "Time out when getting preview (ms)",
	"timeoutDescription": "If it takes longer than this value to get the preview, the preview won’t be generated.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Sets the User-Agent to be used when retrieving previews. If left blank, the default User-Agent will be used.",
	"summaryProxy": "Proxy endpoints that generate previews",
	"notUsePleaseLeaveBlank": "Leave blank if not used",
	"summaryProxyDescription": "Not Misskey itself, but generate previews using Summaly Proxy.",
	"summaryProxyDescription2": "The following parameters are linked to the proxy as a query string. If the proxy does not support them, the values are ignored.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "الفديرالية",
	"all": "الكل",
	"specifyHost": "Specific host",
	"none": "لا شيء",
	"behavior": "السلوك",
	"federationAllowedHosts": "Federation allowed servers",
	"federationAllowedHostsDescription": "Specify the hostnames of the servers you want to allow federation separated by line breaks.",
	"deliverSuspendedSoftware": "Suspended Software",
	"add": "إضافة",
	"deliverSuspendedSoftwareDescription": "You can specify a range of names and versions of the server's software to stop delivery for vulnerability or other reasons. This version information is provided by the server and is not guaranteed to be reliable. A semver range specification can be used to specify the version, but specifying >= 2024.3.1 will not include custom versions such as 2024.3.1-custom.0, so it is recommended that a prerelease specification be used, such as >= 2024.3.1-0",
	"softwareName": "Software",
	"version": "الإصدار",
	"signToActivityPubGet": "Sign ActivityPub GET requests",
	"signToActivityPubGet_description": "Normally, this should be enabled. Disabling it may improve issues related to federation, but on the other hand it could disable federation towards some other servers.",
	"proxyRemoteFiles": "Proxy remote files",
	"proxyRemoteFiles_description": "When enabled, the server will proxy and serve remote files. This is useful for generating image thumbnails and protecting user privacy.",
	"allowExternalApRedirect": "Allow redirects for queries via ActivityPub",
	"allowExternalApRedirect_description": "If enabled, other servers can query third-party content through this server but this may result in content spoofing.",
	"needToRestartServerToApply": "A Misskey restart is required to reflect the change.",
	"cacheRemoteFiles": "خزن مؤقتا الملفات البعيدة",
	"cacheRemoteFilesDescription": "إذا عُطل هذا الإعداد، ستُحمل الملفات من المثيل البعيد، هذا سيقلل من المساحة المستغلة على القرص لكن سيزيد حجم تدفق البيانات وهذا لأن الصور المصغرة لن تولّد.",
	"youCanCleanRemoteFilesCache": "You can clear the cache by clicking the 🗑️ button in the file management view.",
	"cacheRemoteSensitiveFiles": "Cache sensitive remote files",
	"cacheRemoteSensitiveFilesDescription": "When this setting is disabled, sensitive remote files are loaded directly from the remote instance without caching.",
	"proxyAccount": "حساب وكيل البروكسي",
	"proxyAccountDescription": "يتصرف حساب الوكيل كمتابع بعيد لمستخدمين تحت ظروف معينة. على سبيل المثال ، عندما يضيف مستخدم مستخدمًا بعيدًا إلى قائمة  فإن ملاحظاته لن تُرسل إلى المثيل ما لم يُتابعه مستخدم محلي. وبالتالي فإن حساب الوكيل سوف يتابع هذا المستخدم لكي تُرسل ملاحظاته.",
	"description": "السيرة",
	"youCanIncludeHashtags": "يمكنك أيضًا إضافة وسوم إلى سيرتك التعريفية."
}
</locale>

<locale locale="ca-ES" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Vols tornar a executar l'assistent de configuració inicial del servidor?",
	"restartServerSetupWizardConfirm_text": "Algunes configuracions actuals seran restablertes.",
	"general": "General",
	"info": "Informació",
	"instanceName": "Nom del servidor",
	"modified": "Modificat",
	"shortName": "Nom curt",
	"optional": "Opcional",
	"shortNameDescription": "Una abreviatura del nom de la instància que es poguí mostrar en cas que el nom oficial sigui massa llarg",
	"instanceDescription": "Descripció del servidor",
	"maintainerName": "Nom de l'administrador",
	"maintainerEmail": "Correu electrònic de l'administrador",
	"tosUrl": "URL de les Condicions d'ús",
	"privacyPolicyUrl": "Adreça URL de la política de privacitat",
	"inquiryUrl": "URL de consulta ",
	"inquiryUrlDescription": "Escriu adreça URL per al formulari de consulta per al mantenidor del servidor o una pàgina web amb el contacte d'informació.",
	"repositoryUrl": "URL del repositori",
	"repositoryUrlDescription": "Si estàs fent servir Misskey tal com és (sense cap canvi al codi font), introdueix https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "Si no ofereixes cap repositori, publica un fitxer tarball. Dona una ullada a .config/example.yml per a més informació.",
	"impressumUrl": "Adreça URL impressum",
	"impressumDescription": "A països, com Alemanya, la inclusió de la informació de contacte de l'operador (un Impressum) és requereix de manera legal per llocs comercials.",
	"pinnedUsers": "Usuaris fixats",
	"pinnedUsersDescription": "Llista d'usuaris, separats per salts de línia, que seran fixats a la pestanya \"Explorar\".",
	"enableServiceworker": "Activar les notificacions al navegador",
	"serviceworkerInfo": "És obligatòria l'activació per a obtenir notificacions push",
	"adsSettings": "Configurar la publicitat",
	"notesPerOneAd": "Interval d'emplaçament publicitari en temps real (Notes per anuncis)",
	"setZeroToDisable": "Ajusta aquest valor a 0 per deshabilitar l'actualització de publicitat en temps real",
	"adsTooClose": "L'interval actual pot fer que l'experiència de l'usuari sigui dolenta perquè l'interval és molt baix.",
	"title": "Configuració per a la previsualització de l'URL",
	"enable": "Activa la previsualització de l'URL",
	"allowRedirect": "Permet la redirecció de la visualització prèvia ",
	"allowRedirectDescription": "Estableix si es mostra o no la redirecció a la vista prèvia quan l'adreça URL introduïda té una redirecció. Si es desactiva s'estalvien recursos del servidor, però no es mostrarà el contingut de la redirecció.",
	"requireContentLength": "Generar la previsualització només si es pot obtenir la longitud màxima ",
	"requireContentLengthDescription": "Si l'altre servidor no proporciona la longitud màxima, la previsualització no es generarà.",
	"maximumContentLength": "Longitud màxima del contingut (bytes)",
	"maximumContentLengthDescription": "Si la màxima longitud és més gran que aquest valor, la previsualització no es generarà.",
	"timeout": "Temps màxim per carregar la previsualització de l'URL (ms)",
	"timeoutDescription": "Si l'obtenció de la previsualització triga més que el temps establert, no es generarà la vista prèvia.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Estableix l'User-Agent que és farà servir per a la recuperació de la vista prèvia. Si és deixa en blanc es farà servir l'User-Agent per defecte.",
	"summaryProxy": "Proxy endpoints per generar vistes prèvies",
	"notUsePleaseLeaveBlank": "Si no voleu usar-ho, deixeu-ho en blanc",
	"summaryProxyDescription": "La vista prèvia es genera fent servir Summaly proxy, no la genera el mateix Misskey.",
	"summaryProxyDescription2": "Els següents paràmetres són passats al proxy com cadenes de consulta. Si el proxy no els admet, s'ignoren els valors configurats.",
	"urlPreviewSensitiveList": "Llista d'URLs per restringir la visualització de miniatures",
	"urlPreviewSensitiveListDescription": "Si separeu els termes amb un espai, s'interpretarà com una condició 'AND'; si els separeu amb un salt de línia, s'interpretarà com una condició 'OR'. Si envolupeu els termes amb barres obliqües, s'interpretarà com una expressió regular. Si es troba una coincidència, la miniatura ja no es mostrarà.",
	"federation": "Federació",
	"all": "Tot",
	"specifyHost": "Especifica un servidor",
	"none": "Res",
	"behavior": "Comportament",
	"federationAllowedHosts": "Llista de servidors federats",
	"federationAllowedHostsDescription": "Llista dels servidors amb els quals es federa.",
	"deliverSuspendedSoftware": "Programari que ja no es distribueix",
	"add": "Afegir",
	"deliverSuspendedSoftwareDescription": "Pots especificar un rang de noms i versions del programari del servidor per detenir l'entrega, per exemple, degut a vulnerabilitats. Aquesta informació la proporciona el servidor i la seva fiabilitat no es garantitzada. Es pot fer servir una especificació de rang sencer per especificar una versió, però es recomana especificar una versió anterior, com >= 2024.3.1-0, perquè especificar  >= 2024.3.1 no incloure versions personalitzades com 2024.3.1-custom.0.",
	"softwareName": "Nom del programari",
	"version": "Versió",
	"signToActivityPubGet": "Formar sol·licituds GET",
	"signToActivityPubGet_description": " Això normalment hauria d'estar activat. Desactivar aquesta opció pot millorar els problemes de comunicació amb algunes de les instàncies federades, però també pot fer impossibles les comunicacions amb altres servidors.",
	"proxyRemoteFiles": "Proxy d'arxius remots",
	"proxyRemoteFiles_description": "Quan està habilitat, fa de proxy i serveix arxius remots. Això ajuda a generar les miniatures de les imatges i a protegir la privacitat dels usuaris.",
	"allowExternalApRedirect": "Permetre el reencaminament per consultes fent servir ActivityPub.",
	"allowExternalApRedirect_description": "Si aquesta opció s'activa, altres servidors poden consultar continguts de tercers mitjançant aquest servidor, però això pot donar peu a la suplantació de continguts.",
	"needToRestartServerToApply": "És necessari reiniciar el servidor perquè tinguin efecte els canvis.",
	"cacheRemoteFiles": "Emmagatzemar fitxers remots",
	"cacheRemoteFilesDescription": "Quan aquesta opció està desactivada, els fitxers remots es carreguen directament des del servidor remot. Si desactiveu això, es reduirà l'ús d'emmagatzematge, però augmentarà el trànsit, ja que no es generaran miniatures.",
	"youCanCleanRemoteFilesCache": "Pots netejar la memòria cau fent clic al botó de la paperera🗑️ a l'administrador d'arxius.",
	"cacheRemoteSensitiveFiles": "Posar a la memòria cau arxius remots sensibles",
	"cacheRemoteSensitiveFilesDescription": "Quan aquesta opció és desactiva, els arxius remots sensibles es carregant directament del servidor d'origen sense que es guardin a la memòria cau.",
	"proxyAccount": "Compte de proxy",
	"proxyAccountDescription": "Un compte proxy és un compte que actua com a seguidor remot per als usuaris en determinades condicions. Per exemple, quan un usuari afegeix un usuari remot a la llista, l'activitat de l'usuari remot no es lliurarà al servidor si cap usuari local segueix aquest usuari, de manera que el compte proxy el seguirà.",
	"description": "Biografia ",
	"youCanIncludeHashtags": "Pots posar etiquetes a la teva biografia "
}
</locale>

<locale locale="cs-CZ" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Restart server setup wizard?",
	"restartServerSetupWizardConfirm_text": "Some current settings will be reset.",
	"general": "Obecně",
	"info": "Informace",
	"instanceName": "Název instance",
	"modified": "Modified",
	"shortName": "Short name",
	"optional": "Volitelné",
	"shortNameDescription": "A shorthand for the instance's name that can be displayed if the full official name is long.",
	"instanceDescription": "Popis instance",
	"maintainerName": "Správce",
	"maintainerEmail": "E-mailová adresa správce",
	"tosUrl": "URL pro smluvní podmínky",
	"privacyPolicyUrl": "Privacy Policy URL",
	"inquiryUrl": "Inquiry URL",
	"inquiryUrlDescription": "Specify a URL for the inquiry form to the server maintainer or a web page for the contact information.",
	"repositoryUrl": "Repository URL",
	"repositoryUrlDescription": "If you are using Misskey as is (without any changes to the source code), enter https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "If you have not published a repository, you must provide a tarball instead. See .config/example.yml for more information.",
	"impressumUrl": "Impressum URL",
	"impressumDescription": "In some countries, like germany, the inclusion of operator contact information (an Impressum) is legally required for commercial websites.",
	"pinnedUsers": "Připnutí uživatelé",
	"pinnedUsersDescription": "Seznam uživatelských přezdívek oddělených řádkami bude připnutý v záložce \"Objevit\".",
	"enableServiceworker": "Povolit ServiceWorker",
	"serviceworkerInfo": "Musí být zapnut pro push notifikace.",
	"adsSettings": "Ad settings",
	"notesPerOneAd": "Real-time update ad placement interval (Notes per ad)",
	"setZeroToDisable": "Set this value to 0 to disable real-time update ads",
	"adsTooClose": "The current ad interval may significantly worsen the user experience due to being too low.",
	"title": "URL preview settings",
	"enable": "Enable URL preview",
	"allowRedirect": "Allow URL preview redirection",
	"allowRedirectDescription": "If a URL has a redirection set, you can enable this feature to follow the redirection and display a preview of the redirected content. Disabling this will save server resources, but redirected content will not be displayed.",
	"requireContentLength": "Generate the preview only if you could get Content-Length",
	"requireContentLengthDescription": "If other server doesn't return Content-Length, the preview won't be generated.",
	"maximumContentLength": "Maximum Content-Length (bytes)",
	"maximumContentLengthDescription": "If Content-Length is higher than this value, the preview won't be generated.",
	"timeout": "Time out when getting preview (ms)",
	"timeoutDescription": "If it takes longer than this value to get the preview, the preview won’t be generated.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Sets the User-Agent to be used when retrieving previews. If left blank, the default User-Agent will be used.",
	"summaryProxy": "Proxy endpoints that generate previews",
	"notUsePleaseLeaveBlank": "Leave blank if not used",
	"summaryProxyDescription": "Not Misskey itself, but generate previews using Summaly Proxy.",
	"summaryProxyDescription2": "The following parameters are linked to the proxy as a query string. If the proxy does not support them, the values are ignored.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "Federace",
	"all": "Vše",
	"specifyHost": "Specific host",
	"none": "Žádný",
	"behavior": "Chování",
	"federationAllowedHosts": "Federation allowed servers",
	"federationAllowedHostsDescription": "Specify the hostnames of the servers you want to allow federation separated by line breaks.",
	"deliverSuspendedSoftware": "Suspended Software",
	"add": "Přidat",
	"deliverSuspendedSoftwareDescription": "You can specify a range of names and versions of the server's software to stop delivery for vulnerability or other reasons. This version information is provided by the server and is not guaranteed to be reliable. A semver range specification can be used to specify the version, but specifying >= 2024.3.1 will not include custom versions such as 2024.3.1-custom.0, so it is recommended that a prerelease specification be used, such as >= 2024.3.1-0",
	"softwareName": "Software",
	"version": "Verze",
	"signToActivityPubGet": "Sign ActivityPub GET requests",
	"signToActivityPubGet_description": "Normally, this should be enabled. Disabling it may improve issues related to federation, but on the other hand it could disable federation towards some other servers.",
	"proxyRemoteFiles": "Proxy remote files",
	"proxyRemoteFiles_description": "When enabled, the server will proxy and serve remote files. This is useful for generating image thumbnails and protecting user privacy.",
	"allowExternalApRedirect": "Allow redirects for queries via ActivityPub",
	"allowExternalApRedirect_description": "If enabled, other servers can query third-party content through this server but this may result in content spoofing.",
	"needToRestartServerToApply": "A Misskey restart is required to reflect the change.",
	"cacheRemoteFiles": "Ukládání vzdálených souborů do mezipaměti",
	"cacheRemoteFilesDescription": "Zakázání tohoto nastavení způsobí, že vzdálené soubory budou odkazovány přímo, místo aby byly ukládány do mezipaměti. Tím se ušetří úložiště na serveru, ale zvýší se provoz, protože se negenerují miniatury.",
	"youCanCleanRemoteFilesCache": "You can clear the cache by clicking the 🗑️ button in the file management view.",
	"cacheRemoteSensitiveFiles": "Uložit do mezipaměti vzdálené citlivé soubory",
	"cacheRemoteSensitiveFilesDescription": "Když je tohle nastavení zrušeno, tak jsou vzdálené citlivé soubory načítány přímo ze vzdálených instancí bez uložení do mezipaměti.",
	"proxyAccount": "Proxy účet",
	"proxyAccountDescription": "Proxy účet je účet, který za určitých podmínek sleduje uživatele na dálku vaším jménem. Například když uživatel zařadí vzdáleného uživatele do seznamu, pokud nikdo nesleduje uživatele na seznamu, aktivita nebude doručena instanci, takže místo toho bude uživatele sledovat účet proxy.",
	"description": "O mně",
	"youCanIncludeHashtags": "V popisku o Vás můžete použít i hastagy."
}
</locale>

<locale locale="da-DK" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Restart server setup wizard?",
	"restartServerSetupWizardConfirm_text": "Some current settings will be reset.",
	"general": "General",
	"info": "About",
	"instanceName": "Instance name",
	"modified": "Modified",
	"shortName": "Short name",
	"optional": "Optional",
	"shortNameDescription": "A shorthand for the instance's name that can be displayed if the full official name is long.",
	"instanceDescription": "Instance description",
	"maintainerName": "Maintainer",
	"maintainerEmail": "Maintainer email",
	"tosUrl": "Terms of Service URL",
	"privacyPolicyUrl": "Privacy Policy URL",
	"inquiryUrl": "Inquiry URL",
	"inquiryUrlDescription": "Specify a URL for the inquiry form to the server maintainer or a web page for the contact information.",
	"repositoryUrl": "Repository URL",
	"repositoryUrlDescription": "If you are using Misskey as is (without any changes to the source code), enter https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "If you have not published a repository, you must provide a tarball instead. See .config/example.yml for more information.",
	"impressumUrl": "Impressum URL",
	"impressumDescription": "In some countries, like germany, the inclusion of operator contact information (an Impressum) is legally required for commercial websites.",
	"pinnedUsers": "Pinned users",
	"pinnedUsersDescription": "List usernames separated by line breaks to be pinned in the \"Explore\" tab.",
	"enableServiceworker": "Enable Push-Notifications for your Browser",
	"serviceworkerInfo": "Must be enabled for push notifications.",
	"adsSettings": "Ad settings",
	"notesPerOneAd": "Real-time update ad placement interval (Notes per ad)",
	"setZeroToDisable": "Set this value to 0 to disable real-time update ads",
	"adsTooClose": "The current ad interval may significantly worsen the user experience due to being too low.",
	"title": "URL preview settings",
	"enable": "Enable URL preview",
	"allowRedirect": "Allow URL preview redirection",
	"allowRedirectDescription": "If a URL has a redirection set, you can enable this feature to follow the redirection and display a preview of the redirected content. Disabling this will save server resources, but redirected content will not be displayed.",
	"requireContentLength": "Generate the preview only if you could get Content-Length",
	"requireContentLengthDescription": "If other server doesn't return Content-Length, the preview won't be generated.",
	"maximumContentLength": "Maximum Content-Length (bytes)",
	"maximumContentLengthDescription": "If Content-Length is higher than this value, the preview won't be generated.",
	"timeout": "Time out when getting preview (ms)",
	"timeoutDescription": "If it takes longer than this value to get the preview, the preview won’t be generated.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Sets the User-Agent to be used when retrieving previews. If left blank, the default User-Agent will be used.",
	"summaryProxy": "Proxy endpoints that generate previews",
	"notUsePleaseLeaveBlank": "Leave blank if not used",
	"summaryProxyDescription": "Not Misskey itself, but generate previews using Summaly Proxy.",
	"summaryProxyDescription2": "The following parameters are linked to the proxy as a query string. If the proxy does not support them, the values are ignored.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "Federation",
	"all": "All",
	"specifyHost": "Specific host",
	"none": "None",
	"behavior": "Behavior",
	"federationAllowedHosts": "Federation allowed servers",
	"federationAllowedHostsDescription": "Specify the hostnames of the servers you want to allow federation separated by line breaks.",
	"deliverSuspendedSoftware": "Suspended Software",
	"add": "Add",
	"deliverSuspendedSoftwareDescription": "You can specify a range of names and versions of the server's software to stop delivery for vulnerability or other reasons. This version information is provided by the server and is not guaranteed to be reliable. A semver range specification can be used to specify the version, but specifying >= 2024.3.1 will not include custom versions such as 2024.3.1-custom.0, so it is recommended that a prerelease specification be used, such as >= 2024.3.1-0",
	"softwareName": "Software",
	"version": "Version",
	"signToActivityPubGet": "Sign ActivityPub GET requests",
	"signToActivityPubGet_description": "Normally, this should be enabled. Disabling it may improve issues related to federation, but on the other hand it could disable federation towards some other servers.",
	"proxyRemoteFiles": "Proxy remote files",
	"proxyRemoteFiles_description": "When enabled, the server will proxy and serve remote files. This is useful for generating image thumbnails and protecting user privacy.",
	"allowExternalApRedirect": "Allow redirects for queries via ActivityPub",
	"allowExternalApRedirect_description": "If enabled, other servers can query third-party content through this server but this may result in content spoofing.",
	"needToRestartServerToApply": "A Misskey restart is required to reflect the change.",
	"cacheRemoteFiles": "Cache remote files",
	"cacheRemoteFilesDescription": "When this setting is disabled, remote files are loaded directly from the remote servers. Disabling this will decrease storage usage, but increase traffic, as thumbnails will not be generated.",
	"youCanCleanRemoteFilesCache": "You can clear the cache by clicking the 🗑️ button in the file management view.",
	"cacheRemoteSensitiveFiles": "Cache sensitive remote files",
	"cacheRemoteSensitiveFilesDescription": "When this setting is disabled, sensitive remote files are loaded directly from the remote instance without caching.",
	"proxyAccount": "Proxy account",
	"proxyAccountDescription": "A proxy account is an account that acts as a remote follower for users under certain conditions. For example, when a user adds a remote user to the list, the remote user's activity will not be delivered to the instance if no local user is following that user, so the proxy account will follow instead.",
	"description": "Bio",
	"youCanIncludeHashtags": "You can also include hashtags in your bio."
}
</locale>

<locale locale="de-DE" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Möchten Sie den Assistenten für die Ersteinrichtung des Servers erneut ausführen?",
	"restartServerSetupWizardConfirm_text": "Einige aktuelle Einstellungen werden zurückgesetzt.",
	"general": "Allgemein",
	"info": "Über",
	"instanceName": "Name der Instanz",
	"modified": "Bearbeitet",
	"shortName": "Abkürzung",
	"optional": "Optional",
	"shortNameDescription": "Ein Kürzel für den Namen der Instanz, der angezeigt werden kann, falls der volle Instanzname lang ist.",
	"instanceDescription": "Beschreibung der Instanz",
	"maintainerName": "Betreiber",
	"maintainerEmail": "Betreiber-Email",
	"tosUrl": "URL der Nutzungsbedingungen",
	"privacyPolicyUrl": "Datenschutzerklärungs-URL",
	"inquiryUrl": "Kontakt-URL",
	"inquiryUrlDescription": "Gib eine URL für das Kontaktformular der Serverbetreiber oder eine Webseite an, die Kontaktinformationen enthält.",
	"repositoryUrl": "Repository URL",
	"repositoryUrlDescription": "Solltest du Misskey so wie es ist verwenden (im unveränderten Quellcode), gebe Folgendes an:\nhttps://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "Wenn du kein Repository veröffentlicht hast, musst du stattdessen einen Tarball bereitstellen. Siehe .config/example.yml für weitere Informationen.",
	"impressumUrl": "Impressums-URL",
	"impressumDescription": "In manchen Ländern, wie Deutschland und dessen Umgebung, ist die Angabe von Betreiberinformationen (ein Impressum) bei kommerziellem Betrieb zwingend.",
	"pinnedUsers": "Angeheftete Benutzer",
	"pinnedUsersDescription": "Gib durch Leerzeichen getrennte Benutzer an, die an die \"Erkunden\"-Seite angeheftet werden sollen.",
	"enableServiceworker": "Push-Benachrichtigungen im Browser aktivieren",
	"serviceworkerInfo": "Muss für Push-Benachrichtigungen aktiviert sein.",
	"adsSettings": "Werbeeinstellungen",
	"notesPerOneAd": "Werbeintervall während Echtzeitaktualisierung (Notizen pro Werbung)",
	"setZeroToDisable": "Setze dies auf 0, um Werbung während Echtzeitaktualisierung zu deaktivieren",
	"adsTooClose": "Durch den momentan sehr niedrigen Werbeintervall kann es zu einer starken Verschlechterung der Benutzererfahrung kommen.",
	"title": "Einstellungen der URL-Vorschau",
	"enable": "URL-Vorschau aktivieren",
	"allowRedirect": "Umleitung von URL-Vorschauen erlauben",
	"allowRedirectDescription": "Wenn für eine URL eine Umleitung festgelegt ist, kann diese Funktion aktiviert werden, um der Umleitung zu folgen und eine Vorschau des umgeleiteten Inhalts anzuzeigen. Die Deaktivierung spart Serverressourcen, aber der Inhalt des Weiterleitungsziels wird nicht angezeigt.",
	"requireContentLength": "Vorschau nur generieren, wenn Content-Length verfügbar ist",
	"requireContentLengthDescription": "Wenn der Server keine Content-Length zurückgibt, wird keine Vorschau erzeugt.",
	"maximumContentLength": "Maximale Content-Length (Bytes)",
	"maximumContentLengthDescription": "Wenn die Content-Length diesen Wert überschreitet, wird keine Vorschau erzeugt.",
	"timeout": "Zeitüberschreitung beim Abrufen der Vorschau (ms)",
	"timeoutDescription": "Übersteigt die für die Vorschau benötigte Zeit diesen Wert, wird keine Vorschau generiert.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Legt den User-Agent fest, der beim Abrufen der Vorschau verwendet werden soll. Bleibt er leer, wird der Standard-User-Agent verwendet.",
	"summaryProxy": "Proxy-Endpunkte, die Vorschaubilder erzeugen",
	"notUsePleaseLeaveBlank": "Leer lassen, wenn nicht verwendet",
	"summaryProxyDescription": "Generierung von Vorschaubildern mit Summaly Proxy anstelle von Misskey selbst.",
	"summaryProxyDescription2": "Die folgenden Parameter werden als Abfrage-Strings mit dem Proxy verknüpft. Wenn der Proxy sie nicht unterstützt, werden die Werte ignoriert.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "Föderation",
	"all": "Alle",
	"specifyHost": "Host",
	"none": "Nichts",
	"behavior": "Verhalten",
	"federationAllowedHosts": "Föderierte Instanzen",
	"federationAllowedHostsDescription": "Trage die Hostnamen ein mit den du eine Föderation eingehen möchtest. Trenne mit Zeilenumbruch.",
	"deliverSuspendedSoftware": "Software, die nicht mehr beliefert wird",
	"add": "Hinzufügen",
	"deliverSuspendedSoftwareDescription": "Sie können eine Auswahl von Namen und Versionen verschiedener Serversoftware angeben, um die Zustellung zu stoppen, z. B. aufgrund von Sicherheitslücken. Diese Versionsinformationen werden vom Server bereitgestellt und ihre Zuverlässigkeit ist nicht garantiert. Es wird jedoch empfohlen, eine Vorabversion anzugeben, wie z. B. >= 2024.3.1-0, da die Angabe >= 2024.3.1 keine benutzerdefinierten Versionen wie 2024.3.1-custom.0 einschließt.",
	"softwareName": "Software Name",
	"version": "Version",
	"signToActivityPubGet": "ActivityPub-GET-Anfragen signieren",
	"signToActivityPubGet_description": "Normalerweise sollte diese Option aktiviert sein. Die Deaktivierung kann Probleme im Zusammenhang mit der Föderation beheben, aber andererseits könnte sie die Föderation mit einigen anderen Servern deaktivieren.",
	"proxyRemoteFiles": "Proxy für Dateien fremder Instanzen",
	"proxyRemoteFiles_description": "Wenn diese Einstellung aktiviert ist, werden fremde Dateien über einen Proxyserver übertragen und bereitgestellt. Dies hilft bei der Erstellung von Vorschaubildern und schützt die Privatsphäre der Benutzer.",
	"allowExternalApRedirect": "Weiterleitungen für Anfragen über ActivityPub zulassen",
	"allowExternalApRedirect_description": "Wenn diese Option aktiviert ist, können andere Server Inhalte von Drittanbietern über diesen Server abfragen, was jedoch zu Content-Spoofing führen kann.",
	"needToRestartServerToApply": "Diese Einstellung tritt nach einem Neustart des Servers in Kraft.",
	"cacheRemoteFiles": "Dateien von fremden Instanzen im Cache speichern",
	"cacheRemoteFilesDescription": "Ist diese Einstellung deaktiviert, so werden Dateien fremder Instanzen direkt von dort geladen. Hierdurch wird Speicherplatz auf diesem Server gespart, aber durch fehlende Generierung von Vorschaubildern mehr Bandbreite verwendet.",
	"youCanCleanRemoteFilesCache": "Klicke auf den 🗑️-Knopf der Dateiverwaltungsansicht, um den Cache zu leeren.",
	"cacheRemoteSensitiveFiles": "Sensitive Dateien von fremden Instanzen im Cache speichern",
	"cacheRemoteSensitiveFilesDescription": "Ist diese Einstellung deaktiviert, so werden sensitive Dateien fremder Instanzen direkt von dort ohne Zwischenspeicherung geladen.",
	"proxyAccount": "Proxy-Benutzerkonto",
	"proxyAccountDescription": "Ein Proxy-Konto ist ein Benutzerkonto, das unter bestimmten Bedingungen als Follower für Benutzer fremder Instanzen fungiert. Wenn zum Beispiel ein Benutzer einen Benutzer einer fremden Instanz zu einer Liste hinzufügt, werden die Aktivitäten des entfernten Benutzers nicht an die Instanz übermittelt, wenn kein lokaler Benutzer diesem Benutzer folgt; stattdessen folgt das Proxy-Konto.",
	"description": "Profilbeschreibung",
	"youCanIncludeHashtags": "Du kannst auch Hashtags in deiner Profilbeschreibung verwenden."
}
</locale>

<locale locale="en-US" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Restart server setup wizard?",
	"restartServerSetupWizardConfirm_text": "Some current settings will be reset.",
	"general": "General",
	"info": "About",
	"instanceName": "Instance name",
	"modified": "Modified",
	"shortName": "Short name",
	"optional": "Optional",
	"shortNameDescription": "A shorthand for the instance's name that can be displayed if the full official name is long.",
	"instanceDescription": "Instance description",
	"maintainerName": "Maintainer",
	"maintainerEmail": "Maintainer email",
	"tosUrl": "Terms of Service URL",
	"privacyPolicyUrl": "Privacy Policy URL",
	"inquiryUrl": "Inquiry URL",
	"inquiryUrlDescription": "Specify a URL for the inquiry form to the server maintainer or a web page for the contact information.",
	"repositoryUrl": "Repository URL",
	"repositoryUrlDescription": "If you are using Misskey as is (without any changes to the source code), enter https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "If you have not published a repository, you must provide a tarball instead. See .config/example.yml for more information.",
	"impressumUrl": "Impressum URL",
	"impressumDescription": "In some countries, like germany, the inclusion of operator contact information (an Impressum) is legally required for commercial websites.",
	"pinnedUsers": "Pinned users",
	"pinnedUsersDescription": "List usernames separated by line breaks to be pinned in the \"Explore\" tab.",
	"enableServiceworker": "Enable Push-Notifications for your Browser",
	"serviceworkerInfo": "Must be enabled for push notifications.",
	"adsSettings": "Ad settings",
	"notesPerOneAd": "Real-time update ad placement interval (Notes per ad)",
	"setZeroToDisable": "Set this value to 0 to disable real-time update ads",
	"adsTooClose": "The current ad interval may significantly worsen the user experience due to being too low.",
	"title": "URL preview settings",
	"enable": "Enable URL preview",
	"allowRedirect": "Allow URL preview redirection",
	"allowRedirectDescription": "If a URL has a redirection set, you can enable this feature to follow the redirection and display a preview of the redirected content. Disabling this will save server resources, but redirected content will not be displayed.",
	"requireContentLength": "Generate the preview only if you could get Content-Length",
	"requireContentLengthDescription": "If other server doesn't return Content-Length, the preview won't be generated.",
	"maximumContentLength": "Maximum Content-Length (bytes)",
	"maximumContentLengthDescription": "If Content-Length is higher than this value, the preview won't be generated.",
	"timeout": "Time out when getting preview (ms)",
	"timeoutDescription": "If it takes longer than this value to get the preview, the preview won’t be generated.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Sets the User-Agent to be used when retrieving previews. If left blank, the default User-Agent will be used.",
	"summaryProxy": "Proxy endpoints that generate previews",
	"notUsePleaseLeaveBlank": "Leave blank if not used",
	"summaryProxyDescription": "Not Misskey itself, but generate previews using Summaly Proxy.",
	"summaryProxyDescription2": "The following parameters are linked to the proxy as a query string. If the proxy does not support them, the values are ignored.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "Federation",
	"all": "All",
	"specifyHost": "Specific host",
	"none": "None",
	"behavior": "Behavior",
	"federationAllowedHosts": "Federation allowed servers",
	"federationAllowedHostsDescription": "Specify the hostnames of the servers you want to allow federation separated by line breaks.",
	"deliverSuspendedSoftware": "Suspended Software",
	"add": "Add",
	"deliverSuspendedSoftwareDescription": "You can specify a range of names and versions of the server's software to stop delivery for vulnerability or other reasons. This version information is provided by the server and is not guaranteed to be reliable. A semver range specification can be used to specify the version, but specifying >= 2024.3.1 will not include custom versions such as 2024.3.1-custom.0, so it is recommended that a prerelease specification be used, such as >= 2024.3.1-0",
	"softwareName": "Software",
	"version": "Version",
	"signToActivityPubGet": "Sign ActivityPub GET requests",
	"signToActivityPubGet_description": "Normally, this should be enabled. Disabling it may improve issues related to federation, but on the other hand it could disable federation towards some other servers.",
	"proxyRemoteFiles": "Proxy remote files",
	"proxyRemoteFiles_description": "When enabled, the server will proxy and serve remote files. This is useful for generating image thumbnails and protecting user privacy.",
	"allowExternalApRedirect": "Allow redirects for queries via ActivityPub",
	"allowExternalApRedirect_description": "If enabled, other servers can query third-party content through this server but this may result in content spoofing.",
	"needToRestartServerToApply": "A Misskey restart is required to reflect the change.",
	"cacheRemoteFiles": "Cache remote files",
	"cacheRemoteFilesDescription": "When this setting is disabled, remote files are loaded directly from the remote servers. Disabling this will decrease storage usage, but increase traffic, as thumbnails will not be generated.",
	"youCanCleanRemoteFilesCache": "You can clear the cache by clicking the 🗑️ button in the file management view.",
	"cacheRemoteSensitiveFiles": "Cache sensitive remote files",
	"cacheRemoteSensitiveFilesDescription": "When this setting is disabled, sensitive remote files are loaded directly from the remote instance without caching.",
	"proxyAccount": "Proxy account",
	"proxyAccountDescription": "A proxy account is an account that acts as a remote follower for users under certain conditions. For example, when a user adds a remote user to the list, the remote user's activity will not be delivered to the instance if no local user is following that user, so the proxy account will follow instead.",
	"description": "Bio",
	"youCanIncludeHashtags": "You can also include hashtags in your bio."
}
</locale>

<locale locale="es-ES" lang="json">
{
	"restartServerSetupWizardConfirm_title": "¿Reiniciar el asistente de configuración del servidor?",
	"restartServerSetupWizardConfirm_text": "Algunas configuraciones actuales se restablecerán",
	"general": "General",
	"info": "Información",
	"instanceName": "Nombre de la instancia",
	"modified": "Modificado",
	"shortName": "Nombre corto",
	"optional": "Opcional",
	"shortNameDescription": "Forma corta del nombre de la instancia que puede mostrarse si el nombre completo es demasiado largo.",
	"instanceDescription": "Descripción de la instancia",
	"maintainerName": "Nombre del administrador",
	"maintainerEmail": "Correo del administrador",
	"tosUrl": "URL de los términos de uso",
	"privacyPolicyUrl": "URL de la Política de Privacidad",
	"inquiryUrl": "URL de consulta ",
	"inquiryUrlDescription": "Especifica una URL para el formulario de consulta al responsable del servidor o una página web para la información de contacto.",
	"repositoryUrl": "URL del repositorio",
	"repositoryUrlDescription": "Si estás usando Misskey tal cual (sin cambios en el código fuente), entra en https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "Si no has publicado un repositorio aún, deberás publicar un tarball en su lugar. Mira el archivo .config/example.yml para más información.",
	"impressumUrl": "Impressum URL",
	"impressumDescription": "En algunos países, como Alemania, la inclusión del operador de datos (el Impressum) es requerido legalmente para sitios web comerciales.",
	"pinnedUsers": "Usuarios fijados",
	"pinnedUsersDescription": "Describir los usuarios que quiere fijar en la página \"Descubrir\" separados por una linea nueva",
	"enableServiceworker": "Activar ServiceWorker",
	"serviceworkerInfo": "Se necesita activar para usar las notificaciones push",
	"adsSettings": "Ajustes de anuncios",
	"notesPerOneAd": "Intervalo de actualización de anuncios en tiempo real (Notas por cada anuncio)",
	"setZeroToDisable": "Establece este valor a 0 para deshabilitar la actualización de anuncios en tiempo real",
	"adsTooClose": "El intervalo de anuncios actual puede empeorar la experiencia del usuario por ser demasiado bajo.",
	"title": "Configuración para la previsualización de la URL",
	"enable": "Activar la vista previa de URL",
	"allowRedirect": "Permitir la redirección de la visualización previa",
	"allowRedirectDescription": "Si una URL tiene una redirección establecida, puede activar esta función para seguir la redirección y mostrar una vista previa del contenido redirigido. Si se desactiva, se ahorrarán recursos del servidor, pero no se mostrará el contenido redirigido.",
	"requireContentLength": "Genere la vista previa sólo si puede obtener Content-Length",
	"requireContentLengthDescription": "Si el otro servidor no devuelve Content-Length, no se generará la vista previa.",
	"maximumContentLength": "Content-Length Máximo (bytes)",
	"maximumContentLengthDescription": "Si Content-Length es superior a este valor, no se generará la vista previa.",
	"timeout": "Timeout de la carga de vista previa de las URLs (ms)",
	"timeoutDescription": "Si se tarda más de este valor en obtener la vista previa, ésta no se generará.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Establece el User-Agent que se utilizará al recuperar vistas previas. Si se deja en blanco, se utilizará el User-Agent por defecto.",
	"summaryProxy": "Proxy endpoints para generar vistas previas",
	"notUsePleaseLeaveBlank": "Dejar en blanco si no se usa",
	"summaryProxyDescription": "La vista previa se genera usando Summaly proxy, no la genera el mismo Misskey.",
	"summaryProxyDescription2": "Los siguientes parámetros se vinculan al proxy como cadena de consulta (query string). Si el proxy no los admite, los valores se ignoran.",
	"urlPreviewSensitiveList": "URL para restringir la visualización de miniaturas",
	"urlPreviewSensitiveListDescription": "Si se separan con un espacio, se interpretará como una condición «AND»; si se separan con un salto de línea, se interpretará como una condición «OR». Si se escriben entre barras, se interpretarán como expresiones regulares. Si se encuentra una coincidencia, no se mostrará la miniatura.",
	"federation": "Federación",
	"all": "Todo",
	"specifyHost": "Especificar Host",
	"none": "Ninguna",
	"behavior": "Comportamiento",
	"federationAllowedHosts": "Servidores federados",
	"federationAllowedHostsDescription": "La lista de los dominios de las instancias cuya federación está permitida, separadas por saltos de línea.",
	"deliverSuspendedSoftware": "Software suspendido.",
	"add": "Agregar",
	"deliverSuspendedSoftwareDescription": "Puede especificar un rango de nombres y versiones del software del servidor para detener la entrega, por ejemplo, debido a vulnerabilidades. Esta información sobre la versión la proporciona el servidor y su fiabilidad no está garantizada. Se puede utilizar una especificación de rango  para especificar una versión, pero se recomienda especificar una versión previa, como >= 2024.3.1-0, ya que especificar >= 2024.3.1 no incluirá versiones personalizadas como 2024.3.1-custom.0.",
	"softwareName": "Nombre del software",
	"version": "Versión",
	"signToActivityPubGet": "Firmar  solicitudes  GET de Activitypub.",
	"signToActivityPubGet_description": "Normalmente, debería estar activada. Deshabilitarlo puede mejorar los problemas relacionados con la federación, pero por otro lado podría deshabilitar la federación hacia otros servidores.",
	"proxyRemoteFiles": "Proxy de archivos remotos",
	"proxyRemoteFiles_description": "Cuando se activa, el servidor proxy  sirve archivos remotos. Esto es útil para generar miniaturas de imágenes y proteger la privacidad del usuario.",
	"allowExternalApRedirect": "Permitir redirecciones para consultas vía ActivityPub",
	"allowExternalApRedirect_description": "Si se activa, otros servidores pueden consultar contenidos de terceros a través de este servidor, pero esto puede dar lugar a la suplantación de contenidos.",
	"needToRestartServerToApply": "Se requiere un reinicio para la aplicar los cambios",
	"cacheRemoteFiles": "Mantener los archivos remotos en caché",
	"cacheRemoteFilesDescription": "Si desactivas esta configuración, los archivos remotos se cargarán directamente de los servidores remotos. Desactivar esto reducirá el uso de almacenamiento, pero incrementará el uso de tráfico, ya que no se generarán miniaturas.",
	"youCanCleanRemoteFilesCache": "Puedes vaciar la caché pulsando en el botón 🗑️ en el administrador de archivos.",
	"cacheRemoteSensitiveFiles": "Mantener los archivos remotos sensibles en caché",
	"cacheRemoteSensitiveFilesDescription": "Cuando esta opción está desactivada, los archivos remotos sensibles se cargarán directamente desde los servidores remotos.",
	"proxyAccount": "Cuenta proxy",
	"proxyAccountDescription": "Una cuenta proxy es una cuenta que actúa como un seguidor remoto de un usuario bajo ciertas condiciones. Por ejemplo, cuando un usuario añade un usuario remoto a una lista, si ningún usuario local sigue al usuario agregado a la lista, la instancia no puede obtener su actividad, así que la cuenta proxy sigue al usuario añadido a la lista",
	"description": "Descripción",
	"youCanIncludeHashtags": "También puedes incluir hashtags en tu biografía"
}
</locale>

<locale locale="fr-FR" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Restart server setup wizard?",
	"restartServerSetupWizardConfirm_text": "Some current settings will be reset.",
	"general": "Général",
	"info": "Informations",
	"instanceName": "Nom de l’instance",
	"modified": "Modifié",
	"shortName": "Nom court",
	"optional": "Facultatif",
	"shortNameDescription": "Si le nom officiel de l'instance est long, cette abréviation peut être affichée à la place.",
	"instanceDescription": "Description de l’instance",
	"maintainerName": "L’administrateur·rice",
	"maintainerEmail": "Email de l’administrateur·rice",
	"tosUrl": "URL des conditions d’utilisation",
	"privacyPolicyUrl": "URL de la politique de confidentialité",
	"inquiryUrl": "Inquiry URL",
	"inquiryUrlDescription": "Specify a URL for the inquiry form to the server maintainer or a web page for the contact information.",
	"repositoryUrl": "URL du dépôt",
	"repositoryUrlDescription": "Entrez l'URL du dépôt où se trouve le code source ici. Si vous utilisez Misskey tel quel (sans changer le code source), entrez https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "If you have not published a repository, you must provide a tarball instead. See .config/example.yml for more information.",
	"impressumUrl": "URL de l'impressum",
	"impressumDescription": "Dans certains pays comme l'Allemagne, il est obligatoire d'afficher les informations sur l'opérateur d'un site (un impressum).",
	"pinnedUsers": "Utilisateur·rice épinglé·e",
	"pinnedUsersDescription": "Listez les utilisateur·rice·s que vous souhaitez voir épinglé·e·s sur la page \"Découvrir\", un·e par ligne.",
	"enableServiceworker": "Activer ServiceWorker",
	"serviceworkerInfo": "Devrait être activé pour les notifications push.",
	"adsSettings": "Paramètres des publicités",
	"notesPerOneAd": "Intervalle de diffusion de publicités lors de la mise à jour en temps réel (nombre de notes par publicité)",
	"setZeroToDisable": "Mettre cette valeur à 0 pour désactiver la diffusion de publicités lors de la mise à jour en temps réel",
	"adsTooClose": "L'expérience utilisateur peut être gravement compromise par un intervalle de diffusion de publicités extrêmement court.",
	"title": "URL preview settings",
	"enable": "Enable URL preview",
	"allowRedirect": "Allow URL preview redirection",
	"allowRedirectDescription": "If a URL has a redirection set, you can enable this feature to follow the redirection and display a preview of the redirected content. Disabling this will save server resources, but redirected content will not be displayed.",
	"requireContentLength": "Generate the preview only if you could get Content-Length",
	"requireContentLengthDescription": "If other server doesn't return Content-Length, the preview won't be generated.",
	"maximumContentLength": "Maximum Content-Length (bytes)",
	"maximumContentLengthDescription": "If Content-Length is higher than this value, the preview won't be generated.",
	"timeout": "Time out when getting preview (ms)",
	"timeoutDescription": "If it takes longer than this value to get the preview, the preview won’t be generated.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Sets the User-Agent to be used when retrieving previews. If left blank, the default User-Agent will be used.",
	"summaryProxy": "Proxy endpoints that generate previews",
	"notUsePleaseLeaveBlank": "Laisser vide si non utilisé",
	"summaryProxyDescription": "Not Misskey itself, but generate previews using Summaly Proxy.",
	"summaryProxyDescription2": "The following parameters are linked to the proxy as a query string. If the proxy does not support them, the values are ignored.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "Fédération",
	"all": "Tous",
	"specifyHost": "Spécifier un serveur distant",
	"none": "Rien",
	"behavior": "Comportement",
	"federationAllowedHosts": "Serveurs qui autorisent la fédération",
	"federationAllowedHostsDescription": "Specify the hostnames of the servers you want to allow federation separated by line breaks.",
	"deliverSuspendedSoftware": "Suspended Software",
	"add": "Ajouter",
	"deliverSuspendedSoftwareDescription": "You can specify a range of names and versions of the server's software to stop delivery for vulnerability or other reasons. This version information is provided by the server and is not guaranteed to be reliable. A semver range specification can be used to specify the version, but specifying >= 2024.3.1 will not include custom versions such as 2024.3.1-custom.0, so it is recommended that a prerelease specification be used, such as >= 2024.3.1-0",
	"softwareName": "Nom du logiciel",
	"version": "Version",
	"signToActivityPubGet": "Sign ActivityPub GET requests",
	"signToActivityPubGet_description": "Normally, this should be enabled. Disabling it may improve issues related to federation, but on the other hand it could disable federation towards some other servers.",
	"proxyRemoteFiles": "Proxy remote files",
	"proxyRemoteFiles_description": "When enabled, the server will proxy and serve remote files. This is useful for generating image thumbnails and protecting user privacy.",
	"allowExternalApRedirect": "Allow redirects for queries via ActivityPub",
	"allowExternalApRedirect_description": "If enabled, other servers can query third-party content through this server but this may result in content spoofing.",
	"needToRestartServerToApply": "A Misskey restart is required to reflect the change.",
	"cacheRemoteFiles": "Mise en cache des fichiers distants",
	"cacheRemoteFilesDescription": "Lorsque cette option est désactivée, les fichiers distants sont chargés directement depuis l’instance distante. La désactiver diminuera certes l’utilisation de l’espace de stockage local mais augmentera le trafic réseau puisque les miniatures ne seront plus générées.",
	"youCanCleanRemoteFilesCache": "Vous pouvez supprimer tous les caches en cliquant le bouton 🗑️ dans la gestion des fichiers.",
	"cacheRemoteSensitiveFiles": "Mettre en cache les fichiers distants sensibles",
	"cacheRemoteSensitiveFilesDescription": "Si vous désactivez ce paramètre, les fichiers sensibles distants ne seront pas mis en cache et un lien direct sera utilisé à la place",
	"proxyAccount": "Compte proxy",
	"proxyAccountDescription": "Un compte proxy se comporte, dans certaines conditions, comme un·e abonné·e distant·e pour les utilisateurs d'autres instances. Par exemple, quand un·e utilisateur·rice ajoute un·e utilisateur·rice distant·e à une liste, ses notes ne seront pas visibles sur l'instance si personne ne suit cet·te utilisateur·rice. Le compte proxy va donc suivre cet·te utilisateur·rice pour que ses notes soient acheminées.",
	"description": "À propos de moi",
	"youCanIncludeHashtags": "Vous pouvez également inclure des hashtags."
}
</locale>

<locale locale="id-ID" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Restart server setup wizard?",
	"restartServerSetupWizardConfirm_text": "Some current settings will be reset.",
	"general": "Umum",
	"info": "Informasi",
	"instanceName": "Nama instansi",
	"modified": "Diubah",
	"shortName": "Nama pendek",
	"optional": "Opsional",
	"shortNameDescription": "Inisial untuk nama instansi yang dapat ditampilkan apabila nama lengkap resmi terlalu panjang.",
	"instanceDescription": "Tentang instansi",
	"maintainerName": "Pengelola",
	"maintainerEmail": "Surel pengelola",
	"tosUrl": "URL Syarat dan Ketentuan",
	"privacyPolicyUrl": "Tautan Kebijakan Privasi",
	"inquiryUrl": "Inquiry URL",
	"inquiryUrlDescription": "Cantumkan URL untuk menghubungi pengelola peladen atau laman web berisikan informasi kontak.",
	"repositoryUrl": "URL Repositori",
	"repositoryUrlDescription": "Jika kamu menggunakan Misskey begitu saja (tanpa ada perubahan dalam kode sumber), masukkan https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "Apabila kamu masih mempublikasikan repositori, kamu setidaknya harus menyediakan berkas tarball. Lihat .config/example.yml untuk informasi lebih lanjut.",
	"impressumUrl": "Tautan Impressum",
	"impressumDescription": "Pada beberapa negara seperti Jerman, inklusi dari informasi kontak operator (sebuah Impressum) diperlukan secara legal untuk situs web komersil.",
	"pinnedUsers": "Pengguna yang disematkan",
	"pinnedUsersDescription": "Tuliskan satu nama pengguna dalam satu baris. Pengguna yang dituliskan disini akan disematkan dalam bilah \"Jelajahi\".",
	"enableServiceworker": "Aktifkan ServiceWorker",
	"serviceworkerInfo": "Harus diaktifkan untuk notifikasi dorong.",
	"adsSettings": "Pengaturan iklan",
	"notesPerOneAd": "Interval penempatan pemutakhiran iklan secara real-time (catatan per iklan)",
	"setZeroToDisable": "Atur nilai ini ke 0 untuk menonaktifkan pemutakhiran iklan secara real-time",
	"adsTooClose": "Interval iklan saat ini kemungkinan memperburuk pengalaman pengguna secara signifikan karena diatur pada nilai yang terlalu rendah.",
	"title": "Pengaturan pratinjau URL",
	"enable": "Aktifkan pratinjau URL",
	"allowRedirect": "Allow URL preview redirection",
	"allowRedirectDescription": "If a URL has a redirection set, you can enable this feature to follow the redirection and display a preview of the redirected content. Disabling this will save server resources, but redirected content will not be displayed.",
	"requireContentLength": "Buat pratinjau hanya ketika Content-Length dapat didapatkan",
	"requireContentLengthDescription": "Apabila peladen lain tidak memberika Content-Length, pratinjau tidak akan dibuat.",
	"maximumContentLength": "Content-Length Maksimum (bytes)",
	"maximumContentLengthDescription": "Apabila Content-Length lebih besar dari nilai ini, pratinjau tidak akan dibuat.",
	"timeout": "Waktu timeout pratinjau URL (ms)",
	"timeoutDescription": "Apabila ini memakan waktu lama dari nilai yang ditentukan untuk mendapatkan pratinjau, pratinjau tidak akan dibuat.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Atur User-Agent yang digunakan untuk mengambil pratinjau. Apabila dibiarkan kosong, User-Agent bawaan akan digunakan.",
	"summaryProxy": "Titik akhir proksi yang membuat pratinjau",
	"notUsePleaseLeaveBlank": "Kosongi bila tidak digunakan",
	"summaryProxyDescription": "Bukan untuk Misskey, namun untuk menghasilkan pratinjau menggunakan Summaly Proxy.",
	"summaryProxyDescription2": "Parameter berikut tertautkan dengan proksi sebagai string kueri. Apabila proksi tidak mendukung tersebut, nilai di dalamnya diabaikan.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "Federasi",
	"all": "Semua",
	"specifyHost": "Tentukan host",
	"none": "Tidak ada",
	"behavior": "Perilaku",
	"federationAllowedHosts": "Peladen yang membolehkan federasi",
	"federationAllowedHostsDescription": "Cantumkan nama domain (hostname) peladen yang ingin anda perbolehkan untuk terdesentralisasi, dipisah dengan jeda baris.",
	"deliverSuspendedSoftware": "Suspended Software",
	"add": "Tambahkan",
	"deliverSuspendedSoftwareDescription": "You can specify a range of names and versions of the server's software to stop delivery for vulnerability or other reasons. This version information is provided by the server and is not guaranteed to be reliable. A semver range specification can be used to specify the version, but specifying >= 2024.3.1 will not include custom versions such as 2024.3.1-custom.0, so it is recommended that a prerelease specification be used, such as >= 2024.3.1-0",
	"softwareName": "Nama Perangkat Lunak",
	"version": "Versi",
	"signToActivityPubGet": "Sign ActivityPub GET requests",
	"signToActivityPubGet_description": "Normally, this should be enabled. Disabling it may improve issues related to federation, but on the other hand it could disable federation towards some other servers.",
	"proxyRemoteFiles": "Berkas proksi remote",
	"proxyRemoteFiles_description": "Ketika dinyalakan, peladen akan berperan sebagai proksi menyajikan berkas secara remote. Ini dapat berguna untuk membuat keluku gambar dan melindungi privasi pengguna.",
	"allowExternalApRedirect": "Allow redirects for queries via ActivityPub",
	"allowExternalApRedirect_description": "If enabled, other servers can query third-party content through this server but this may result in content spoofing.",
	"needToRestartServerToApply": "Perlu memulai ulang Misskey untuk memunculkan pengubahan.",
	"cacheRemoteFiles": "Tembolokkan berkas dari instansi luar",
	"cacheRemoteFilesDescription": "Ketika pengaturan ini dinonaktifkan, berkas dari peladen luar akan dimuat secara langsung. Menonaktifkan ini akan mengurangi penggunaan penyimpanan peladen, namun dapat menyebabkan peningkatan lalu lintas bandwidth, karena keluku tidak dihasilkan.",
	"youCanCleanRemoteFilesCache": "Kamu dapat mengosongkan tembolok dengan mengeklik tombol 🗑️ pada layar manajemen berkas.",
	"cacheRemoteSensitiveFiles": "Tembolokkan berkas dari instansi luar",
	"cacheRemoteSensitiveFilesDescription": "Menonaktifkan pengaturan ini menyebabkan berkas sensitif dari instansi luar ditautkan secara langsung, bukan ditembolok.",
	"proxyAccount": "Akun proksi",
	"proxyAccountDescription": "Akun proksi merupakan sebuah akun yang bertindak sebagai pengikut instansi luar untuk pengguna dalam kondisi tertentu. Sebagai contoh, ketika pengguna menambahkan seorang pengguna instansi luar ke dalam daftar, aktivitas dari pengguna instansi luar tidak akan disampaikan ke instansi apabila tidak ada pengguna lokal yang mengikuti pengguna tersebut, dengan begitu akun proksilah yang akan mengikutinya.",
	"description": "Bio",
	"youCanIncludeHashtags": "Kamu juga dapat menambahkan tagar ke dalam bio."
}
</locale>

<locale locale="it-IT" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Vuoi ripetere la procedura guidata di configurazione iniziale del server?",
	"restartServerSetupWizardConfirm_text": "Verranno ripristinate alcune tue impostazioni personalizzate.",
	"general": "Generali",
	"info": "Informazioni",
	"instanceName": "Nome dell'istanza",
	"modified": "Modificato",
	"shortName": "Abbreviazione",
	"optional": "facoltativo",
	"shortNameDescription": "Un'abbreviazione o un nome comune che può essere visualizzato al posto del nome ufficiale lungo del server.",
	"instanceDescription": "Descrizione dell'istanza",
	"maintainerName": "Nome dell'amministratore",
	"maintainerEmail": "Indirizzo e-mail dell'amministratore",
	"tosUrl": "URL delle condizioni d'uso",
	"privacyPolicyUrl": "URL della informativa privacy",
	"inquiryUrl": "URL di contatto",
	"inquiryUrlDescription": "Specificare l'URL al modulo di contatto, oppure le informazioni con i dati di contatto dell'amministrazione.",
	"repositoryUrl": "URL della repository",
	"repositoryUrlDescription": "Se esiste un repository il cui il codice sorgente è disponibile pubblicamente, inserisci il suo URL. Se stai utilizzando Misskey così com'è (senza alcuna modifica al codice sorgente), inserisci https://github.com/misskey-dev/misskey.",
	"repositoryUrlOrTarballRequired": "Se non disponi di un repository pubblico, dovrai fornire un file tarball (tar). Vedere .config/example.yml per i dettagli.",
	"impressumUrl": "URL della dichiarazione di proprietà",
	"impressumDescription": "La dichiarazione di proprietà, è obbligatoria in alcuni paesi come la Germania (Impressum).",
	"pinnedUsers": "Profili in evidenza",
	"pinnedUsersDescription": "Elenca i profili delle persone che vuoi fissare nella pagina \"Esplora\".",
	"enableServiceworker": "Abilita ServiceWorker",
	"serviceworkerInfo": "Deve essere abilitato per le notifiche push. ",
	"adsSettings": "Impostazioni banner",
	"notesPerOneAd": "Quantità di Note tra i banner",
	"setZeroToDisable": "Imposta 0 (zero) per disattivare la distribuzione dei banner durante gli aggiornamenti in tempo reale",
	"adsTooClose": "Attenzione, l'intervallo di pubblicazione dei banner è molto breve, potrebbe infastidire significativamente la fruizione",
	"title": "Impostazioni per l'anteprima delle URL",
	"enable": "Attiva l'anteprima delle URL",
	"allowRedirect": "Segui i reindirizzamenti per visualizzare le anteprime",
	"allowRedirectDescription": "Se la URL inserita contiene un reindirizzamento, decidi di seguire il reindirizzamento fino alla destinazione, visualizzandone l'anteprima. Disabilitando questa opzione si risparmiano risorse del server, ma il contenuto effettivo dal reindirizzamento, non verrà visualizzato.",
	"requireContentLength": "Genenerare l'anteprima solo quando è definito Content-Length",
	"requireContentLengthDescription": "In assenza di questo parametro dal server remoto, l'anteprima verrà ignorata.",
	"maximumContentLength": "Grandezza del contenuto (Content-Length in byte)",
	"maximumContentLengthDescription": "Se la grandezza supera il valore, l'anteprima verrà ignorata.",
	"timeout": "Timeout dell'anteprima in millisecondi",
	"timeoutDescription": "Impegna al massimo il tempo indicato, altrimenti ignora l'anteprima",
	"userAgent": "User-Agent",
	"userAgentDescription": "Definire con quale User-Agent si intende identificarsi durante l'acquisizione di un'anteprima. Se è vuoto, useremo il valore predefinito.",
	"summaryProxy": "Endpoint proxy che genera l'anteprima",
	"notUsePleaseLeaveBlank": "Lasciare vuoto, se non in uso",
	"summaryProxyDescription": "Genera anteprime utilizzando un proxy Summaly anziché Misskey.",
	"summaryProxyDescription2": "I parametri sono collegano al proxy come stringa query. Se il proxy non li supporta, verranno ignorati.",
	"urlPreviewSensitiveList": "URL da impedire alla vista delle anteprime",
	"urlPreviewSensitiveListDescription": "Separando con uno spazio si indica E, separando con una linea si indica O. Circondando con barre / si indica una Espressione Regolare.\nLe URL che coincidono con le indicazioni non verranno visualizzate.",
	"federation": "Federazione",
	"all": "Tutte",
	"specifyHost": "Host specifici",
	"none": "Nessuna",
	"behavior": "Comportamento",
	"federationAllowedHosts": "Server a cui consentire la federazione",
	"federationAllowedHostsDescription": "Indica gli host dei server a cui è consentita la federazione, uno per ogni linea.",
	"deliverSuspendedSoftware": "Software fuori produzione",
	"add": "Aggiungi",
	"deliverSuspendedSoftwareDescription": "A causa di vulnerabilità o altri motivi, puoi interrompere la distribuzione di un software da un server specificandone il nome e la versione. Le informazioni sono fornite dall'altro server e l'autenticità non è garantita. Puoi indicare un intervallo di versione semantica, ma specificando >= 2024.3.1 non verranno incluse le versioni personalizzate come ad esempio 2024.3.1-custom.0, pertanto ti consigliamo di specificare una versione come >= 2024.3.1-0.",
	"softwareName": "Nome del software",
	"version": "Versione",
	"signToActivityPubGet": "Firma delle richieste GET",
	"signToActivityPubGet_description": "Normalmente questa opzione dovrebbe essere abilitata. Se si verificano problemi con la comunicazione federata, disabilitarla potrebbe migliorare la situazione, ma d'altro canto potrebbe rendere impossibile la comunicazione, a seconda del server.",
	"proxyRemoteFiles": "Proxy di file remoti",
	"proxyRemoteFiles_description": "Se abilitato, i file remoti verranno serviti tramite proxy. Utile per generare miniature delle immagini e proteggere la privacy degli utenti.",
	"allowExternalApRedirect": "Consenti reindirizzamenti per le query tramite ActivityPub",
	"allowExternalApRedirect_description": "Se abilitata, consente ad altri server di interrogare contenuti di terze parti tramite il tuo server, con conseguente potenziale falsificazione dei contenuti.",
	"needToRestartServerToApply": "Per attivare le modifiche, occorre riavviare il server.",
	"cacheRemoteFiles": "Memorizza i file remoti nella cache",
	"cacheRemoteFilesDescription": "Disabilitando questa opzione, i file remoti verranno linkati direttamente senza essere memorizzati nella cache. Sarà possibile risparmiare spazio di archiviazione sul server, ma il traffico aumenterà in quanto non verranno generate anteprime.",
	"youCanCleanRemoteFilesCache": "Puoi svuotare tutta la cache cliccando il bottone 🗑️ nella gestione file",
	"cacheRemoteSensitiveFiles": "Copia nella cache locale i file espliciti remoti",
	"cacheRemoteSensitiveFilesDescription": "Disattivando questa opzione, i file espliciti verranno richiesti direttamente all'istanza remota senza essere salvati nel server locale.",
	"proxyAccount": "Profilo proxy",
	"proxyAccountDescription": "Un profilo proxy funziona come follower per i profili remoti, sotto certe condizioni. Ad esempio, quando un profilo locale ne inserisce uno remoto in una lista (senza seguirlo), se nessun altro segue quel profilo remoto, le attività non possono essere distribuite. Dunque, il profilo proxy le seguirà per tutti.",
	"description": "Biografia",
	"youCanIncludeHashtags": "Puoi anche includere hashtag."
}
</locale>

<locale locale="ja-JP" lang="json">
{
	"restartServerSetupWizardConfirm_title": "サーバーの初期設定ウィザードをやり直しますか？",
	"restartServerSetupWizardConfirm_text": "現在の一部の設定はリセットされます。",
	"general": "全般",
	"info": "情報",
	"instanceName": "サーバー名",
	"modified": "変更あり",
	"shortName": "略称",
	"optional": "任意",
	"shortNameDescription": "サーバーの正式名称が長い場合に、代わりに表示することのできる略称や通称。",
	"instanceDescription": "サーバーの紹介",
	"maintainerName": "管理者の名前",
	"maintainerEmail": "管理者のメールアドレス",
	"tosUrl": "利用規約URL",
	"privacyPolicyUrl": "プライバシーポリシーURL",
	"inquiryUrl": "問い合わせ先URL",
	"inquiryUrlDescription": "サーバー運営者へのお問い合わせフォームのURLや、運営者の連絡先等が記載されたWebページのURLを指定します。",
	"repositoryUrl": "リポジトリURL",
	"repositoryUrlDescription": "ソースコードが公開されているリポジトリがある場合、そのURLを記入します。Misskeyを現状のまま（ソースコードにいかなる変更も加えずに）使用している場合は https://github.com/misskey-dev/misskey と記入します。",
	"repositoryUrlOrTarballRequired": "リポジトリを公開していない場合、代わりにtarballを提供する必要があります。詳細は.config/example.ymlを参照してください。",
	"impressumUrl": "運営者情報URL",
	"impressumDescription": "ドイツなどの一部の国と地域では表示が義務付けられています(Impressum)。",
	"pinnedUsers": "ピン留めユーザー",
	"pinnedUsersDescription": "「みつける」ページなどにピン留めしたいユーザーを改行で区切って記述します。",
	"enableServiceworker": "ブラウザへのプッシュ通知を有効にする",
	"serviceworkerInfo": "プッシュ通知を行うには有効にする必要があります。",
	"adsSettings": "広告配信設定",
	"notesPerOneAd": "リアルタイム更新中に広告を配信する間隔（ノートの個数）",
	"setZeroToDisable": "0でリアルタイム更新時の広告配信を無効",
	"adsTooClose": "広告の配信間隔が極めて短いため、ユーザー体験が著しく損われる可能性があります。",
	"title": "URLプレビューの設定",
	"enable": "URLプレビューを有効にする",
	"allowRedirect": "プレビュー先のリダイレクトを許可",
	"allowRedirectDescription": "入力されたURLがリダイレクトされる場合に、そのリダイレクト先をたどってプレビューを表示するかどうかを設定します。無効にするとサーバーリソースの節約になりますが、リダイレクト先の内容は表示されなくなります。",
	"requireContentLength": "Content-Lengthが取得できた場合のみプレビューを生成",
	"requireContentLengthDescription": "相手サーバがContent-Lengthを返さない場合、プレビューは生成されません。",
	"maximumContentLength": "Content-Lengthの最大値(byte)",
	"maximumContentLengthDescription": "Content-Lengthがこの値を超えた場合、プレビューは生成されません。",
	"timeout": "プレビュー取得時のタイムアウト(ms)",
	"timeoutDescription": "プレビュー取得の所要時間がこの値を超えた場合、プレビューは生成されません。",
	"userAgent": "User-Agent",
	"userAgentDescription": "プレビュー取得時に使用されるUser-Agentを設定します。空欄の場合、デフォルトのUser-Agentが使用されます。",
	"summaryProxy": "プレビューを生成するプロキシのエンドポイント",
	"notUsePleaseLeaveBlank": "使用しない場合は空欄にしてください",
	"summaryProxyDescription": "Misskey本体ではなく、サマリープロキシを使用してプレビューを生成します。",
	"summaryProxyDescription2": "プロキシには下記パラメータがクエリ文字列として連携されます。プロキシ側がこれらをサポートしない場合、設定値は無視されます。",
	"urlPreviewSensitiveList": "サムネイルの表示を制限するURL",
	"urlPreviewSensitiveListDescription": "スペースで区切るとAND指定になり、改行で区切るとOR指定になります。スラッシュで囲むと正規表現になります。一致した場合、サムネイルが表示されなくなります。",
	"federation": "連合",
	"all": "全て",
	"specifyHost": "ホスト指定",
	"none": "なし",
	"behavior": "動作",
	"federationAllowedHosts": "連合を許可するサーバー",
	"federationAllowedHostsDescription": "連合を許可するサーバーのホストを改行で区切って設定します。",
	"deliverSuspendedSoftware": "配信停止中のソフトウェア",
	"add": "追加",
	"deliverSuspendedSoftwareDescription": "脆弱性などの理由で、サーバーのソフトウェアの名前及びバージョンの範囲を指定して配信を停止できます。このバージョン情報はサーバーが提供したものであり、信頼性は保証されません。バージョン指定には semver の範囲指定が使用できますが、>= 2024.3.1 と指定すると 2024.3.1-custom.0 のようなカスタムバージョンが含まれないため、>= 2024.3.1-0 のように prerelease の指定を行うことを推奨します。",
	"softwareName": "ソフトウェア名",
	"version": "バージョン",
	"signToActivityPubGet": "GETリクエストに署名する",
	"signToActivityPubGet_description": "通常は有効にしてください。連合の通信に関する問題がある場合に、無効にすると改善することがありますが、逆にサーバーによっては通信が不可になることがあります。",
	"proxyRemoteFiles": "リモートファイルをプロキシする",
	"proxyRemoteFiles_description": "有効にすると、リモートのファイルをプロキシして提供します。画像のサムネイル生成やユーザーのプライバシー保護に役立ちます。",
	"allowExternalApRedirect": "ActivityPub経由の照会にリダイレクトを許可する",
	"allowExternalApRedirect_description": "有効にすると、他のサーバーがこのサーバーを通して第三者のコンテンツを照会することが可能になりますが、コンテンツのなりすましが発生する可能性があります。",
	"needToRestartServerToApply": "反映にはサーバーの再起動が必要です。",
	"cacheRemoteFiles": "リモートのファイルをキャッシュする",
	"cacheRemoteFilesDescription": "この設定を有効にすると、リモートファイルをこのサーバーのストレージにキャッシュするようになります。画像の表示が高速になりますが、サーバーのストレージを多く消費します。リモートユーザーがどれほどキャッシュを保持するかは、ロールによるドライブ容量制限によって決定されます。この制限を超えた場合、古いファイルからキャッシュが削除されリンクになります。この設定が無効の場合、リモートのファイルを最初からリンクとして保持します。",
	"youCanCleanRemoteFilesCache": "ファイル管理の🗑️ボタンで全てのキャッシュを削除できます。",
	"cacheRemoteSensitiveFiles": "リモートのセンシティブなファイルをキャッシュする",
	"cacheRemoteSensitiveFilesDescription": "この設定を無効にすると、リモートのセンシティブなファイルはキャッシュせず直リンクするようになります。",
	"proxyAccount": "プロキシアカウント",
	"proxyAccountDescription": "プロキシアカウントは、特定の条件下でユーザーのリモートフォローを代行するアカウントです。例えば、ユーザーがリモートユーザーをリストに入れたとき、リストに入れられたユーザーを誰もフォローしていないとアクティビティがサーバーに配達されないため、代わりにプロキシアカウントがフォローするようにします。",
	"description": "自己紹介",
	"youCanIncludeHashtags": "ハッシュタグを含めることができます。"
}
</locale>

<locale locale="ja-KS" lang="json">
{
	"restartServerSetupWizardConfirm_title": "サーバーの初期設定ウィザードをやり直すん？",
	"restartServerSetupWizardConfirm_text": "現在の一部の設定はリセットされるで。",
	"general": "全般",
	"info": "情報",
	"instanceName": "サーバー名",
	"modified": "変更あり",
	"shortName": "略称",
	"optional": "任意",
	"shortNameDescription": "サーバーの名前が長ったらしい時に、代わりに出すあだ名。",
	"instanceDescription": "サーバーの紹介",
	"maintainerName": "管理者はんの名前",
	"maintainerEmail": "管理者はんのメールアドレス",
	"tosUrl": "使うための決め事のURL",
	"privacyPolicyUrl": "プライバシーポリシーURL",
	"inquiryUrl": "問い合わせ先URL",
	"inquiryUrlDescription": "サーバー運営者へのお問い合わせフォームのURLや、運営者の連絡先等が記載されたWebページのURLを指定するで。",
	"repositoryUrl": "リポジトリURL",
	"repositoryUrlDescription": "ソースコードが公開されているリポジトリがある場合、そのURLを記入するで。Misskeyをそのまんま（ソースコードにいかなる変更も加えずに）使っとる場合は https://github.com/misskey-dev/misskey と記入するで。",
	"repositoryUrlOrTarballRequired": "リポジトリを公開してへんなら、代わりにtarballを提供する必要があるで。詳細は.config/example.ymlを参照してな。",
	"impressumUrl": "運営者の情報URL",
	"impressumDescription": "ドイツとかの一部んところではな、表示が義務付けられてんねん(Impressum)。",
	"pinnedUsers": "ピン留めしたユーザー",
	"pinnedUsersDescription": "「みつける」ページとかにピン留めしたいユーザーをここに書けばええんやで。ユーザー毎に改行してや。",
	"enableServiceworker": "ブラウザにプッシュ通知が行くようにする",
	"serviceworkerInfo": "プッシュ通知をするんなら有効にせなあかんで。",
	"adsSettings": "広告配信設定",
	"notesPerOneAd": "リアタイ更新中に広告を出す間隔（ノートの個数な）",
	"setZeroToDisable": "0でリアタイ更新時の広告配信を無効にすんで",
	"adsTooClose": "広告を出す間隔がめっちゃ短いから、ユーザー体験がめちゃめちゃ悪くなるかもしれへん。",
	"title": "URLプレビューの設定",
	"enable": "URLプレビューを有効にする",
	"allowRedirect": "プレビュー先のリダイレクトを許可",
	"allowRedirectDescription": "入力されたURLがリダイレクトされるとき、そのリダイレクト先をたどってプレビューを表示するかどうかを設定できるで。無効にするとサーバーリソースを節約できるんやけど、リダイレクト先の内容は表示されへんくなるで。",
	"requireContentLength": "Content-Lengthが取得できた場合のみプレビューを生成",
	"requireContentLengthDescription": "相手サーバがContent-Lengthを返さない場合、プレビューは生成されへんで。",
	"maximumContentLength": "Content-Lengthの最大値(byte)",
	"maximumContentLengthDescription": "Content-Lengthがこの値を超えた場合、プレビューは生成されへんで。",
	"timeout": "プレビュー取得時のタイムアウト(ms)",
	"timeoutDescription": "プレビュー取得の所要時間がこの値を超えた場合、プレビューは生成されへんで。",
	"userAgent": "User-Agent",
	"userAgentDescription": "プレビュー取得時に使用されるUser-Agentを設定するで。空欄の場合、デフォルトのUser-Agentが使用されるで。",
	"summaryProxy": "プレビューを生成するプロキシのエンドポイント",
	"notUsePleaseLeaveBlank": "使用せえへん場合は空欄にしてや",
	"summaryProxyDescription": "Misskey本体やなく、サマリープロキシを使用してプレビューを生成するで。",
	"summaryProxyDescription2": "プロキシには下記パラメータがクエリ文字列として連携されるで。プロキシ側がこれらをサポートせえへんときは、設定値は無視されるで。",
	"urlPreviewSensitiveList": "サムネイルの表示を制限するURL",
	"urlPreviewSensitiveListDescription": "スペースで区切るとAND指定になり、改行で区切るとOR指定になります。スラッシュで囲むと正規表現になります。一致した場合、サムネイルが表示されなくなります。",
	"federation": "連合",
	"all": "みんな",
	"specifyHost": "ホスト指定",
	"none": "なし",
	"behavior": "動作",
	"federationAllowedHosts": "連合を許すサーバー",
	"federationAllowedHostsDescription": "連合してもいいサーバーのホストを行ごとに区切って設定してや。",
	"deliverSuspendedSoftware": "配信停止中のソフトウェア",
	"add": "増やす",
	"deliverSuspendedSoftwareDescription": "脆弱性とかの理由で、サーバーのソフトウェアの名前とバージョンの範囲を決めて配信を止められるで。このバージョン情報はサーバーが提供したものやから、信頼性は保証されへん。バージョン指定には semver の範囲指定が使えるねんけど、>= 2024.3.1と指定すると 2024.3.1-custom.0 みたいなカスタムバージョンが含まれへんから、>= 2024.3.1-0 みたいに prerelease を指定するとええかもしれへんな。",
	"softwareName": "ソフトウェア名",
	"version": "バージョン",
	"signToActivityPubGet": "GETリクエストに署名する",
	"signToActivityPubGet_description": "通常はつけといてな。連合の通信に関わる問題があるんやったら、無効にすると改善するかもしれへんけど、逆にサーバーによっては通信ができんくなることがあるで。",
	"proxyRemoteFiles": "リモートファイルをプロキシする",
	"proxyRemoteFiles_description": "つけると、リモートのファイルをプロキシして提供するで。画像のサムネイル生成とかユーザーのプライバシー保護にええな。",
	"allowExternalApRedirect": "ActivityPub経由の照会にリダイレクトを許可する",
	"allowExternalApRedirect_description": "つけると、他のサーバーがうちのサーバーを通して第三者のコンテンツを照会できるようになるんやけど、コンテンツのなりすましが発生するかもしれへん。",
	"needToRestartServerToApply": "反映にはサーバーを再起動せなあかんのよ。",
	"cacheRemoteFiles": "リモートのファイルをキャッシュする",
	"cacheRemoteFilesDescription": "この設定を入れとったら、リモートのファイルを端から端までこのサーバーのキャッシュん中突っ込むようになるで。画像映し出すんがめっちゃ速うなるけど、サーバーの容量をやたらと食うようになるで。リモートの人がどんだけ長くキャッシュを持っとくかはドライブ容量の制限で決めとくで。制限を超えたら古いのから順々に消してって、かわりにリンクになるで。この設定を切ったら、リモートのファイルは最初っからリンクとして扱うことにするけど、画像のサムネ作るのとかみんなのプライバシー守るために、default.ymlのproxyRemoteFilesをtrueにしといたほうがええよ。",
	"youCanCleanRemoteFilesCache": "ファイル管理にある🗑️ボタンでキャッシュ全部ほかすで。",
	"cacheRemoteSensitiveFiles": "リモートのきわどいファイルをキャッシュする",
	"cacheRemoteSensitiveFilesDescription": "この設定を切ると、リモートのきわどいファイルはキャッシュせず直でリンクするようになるで。",
	"proxyAccount": "プロキシアカウント",
	"proxyAccountDescription": "プロキシアカウントは、代わりにフォローしてくれるアカウントや。例えば、551に豚まんが無いときやったり、ユーザーがリモートユーザーをアカウントに入れたとき、リストに入れられたユーザーが誰からもフォローされてないと寂しいやん。寂しいし、アクティビティも配達されへんから、プロキシアカウントがフォローしてくれるで。ええやつやん…",
	"description": "自己紹介",
	"youCanIncludeHashtags": "ハッシュタグを含めることができるで。"
}
</locale>

<locale locale="kab-KAB" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Restart server setup wizard?",
	"restartServerSetupWizardConfirm_text": "Some current settings will be reset.",
	"general": "General",
	"info": "About",
	"instanceName": "Instance name",
	"modified": "Modified",
	"shortName": "Short name",
	"optional": "Optional",
	"shortNameDescription": "A shorthand for the instance's name that can be displayed if the full official name is long.",
	"instanceDescription": "Instance description",
	"maintainerName": "Maintainer",
	"maintainerEmail": "Maintainer email",
	"tosUrl": "Terms of Service URL",
	"privacyPolicyUrl": "Privacy Policy URL",
	"inquiryUrl": "Inquiry URL",
	"inquiryUrlDescription": "Specify a URL for the inquiry form to the server maintainer or a web page for the contact information.",
	"repositoryUrl": "Repository URL",
	"repositoryUrlDescription": "If you are using Misskey as is (without any changes to the source code), enter https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "If you have not published a repository, you must provide a tarball instead. See .config/example.yml for more information.",
	"impressumUrl": "Impressum URL",
	"impressumDescription": "In some countries, like germany, the inclusion of operator contact information (an Impressum) is legally required for commercial websites.",
	"pinnedUsers": "Pinned users",
	"pinnedUsersDescription": "List usernames separated by line breaks to be pinned in the \"Explore\" tab.",
	"enableServiceworker": "Enable Push-Notifications for your Browser",
	"serviceworkerInfo": "Must be enabled for push notifications.",
	"adsSettings": "Ad settings",
	"notesPerOneAd": "Real-time update ad placement interval (Notes per ad)",
	"setZeroToDisable": "Set this value to 0 to disable real-time update ads",
	"adsTooClose": "The current ad interval may significantly worsen the user experience due to being too low.",
	"title": "URL preview settings",
	"enable": "Enable URL preview",
	"allowRedirect": "Allow URL preview redirection",
	"allowRedirectDescription": "If a URL has a redirection set, you can enable this feature to follow the redirection and display a preview of the redirected content. Disabling this will save server resources, but redirected content will not be displayed.",
	"requireContentLength": "Generate the preview only if you could get Content-Length",
	"requireContentLengthDescription": "If other server doesn't return Content-Length, the preview won't be generated.",
	"maximumContentLength": "Maximum Content-Length (bytes)",
	"maximumContentLengthDescription": "If Content-Length is higher than this value, the preview won't be generated.",
	"timeout": "Time out when getting preview (ms)",
	"timeoutDescription": "If it takes longer than this value to get the preview, the preview won’t be generated.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Sets the User-Agent to be used when retrieving previews. If left blank, the default User-Agent will be used.",
	"summaryProxy": "Proxy endpoints that generate previews",
	"notUsePleaseLeaveBlank": "Leave blank if not used",
	"summaryProxyDescription": "Not Misskey itself, but generate previews using Summaly Proxy.",
	"summaryProxyDescription2": "The following parameters are linked to the proxy as a query string. If the proxy does not support them, the values are ignored.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "Federation",
	"all": "All",
	"specifyHost": "Specific host",
	"none": "None",
	"behavior": "Behavior",
	"federationAllowedHosts": "Federation allowed servers",
	"federationAllowedHostsDescription": "Specify the hostnames of the servers you want to allow federation separated by line breaks.",
	"deliverSuspendedSoftware": "Suspended Software",
	"add": "Add",
	"deliverSuspendedSoftwareDescription": "You can specify a range of names and versions of the server's software to stop delivery for vulnerability or other reasons. This version information is provided by the server and is not guaranteed to be reliable. A semver range specification can be used to specify the version, but specifying >= 2024.3.1 will not include custom versions such as 2024.3.1-custom.0, so it is recommended that a prerelease specification be used, such as >= 2024.3.1-0",
	"softwareName": "Software",
	"version": "Version",
	"signToActivityPubGet": "Sign ActivityPub GET requests",
	"signToActivityPubGet_description": "Normally, this should be enabled. Disabling it may improve issues related to federation, but on the other hand it could disable federation towards some other servers.",
	"proxyRemoteFiles": "Proxy remote files",
	"proxyRemoteFiles_description": "When enabled, the server will proxy and serve remote files. This is useful for generating image thumbnails and protecting user privacy.",
	"allowExternalApRedirect": "Allow redirects for queries via ActivityPub",
	"allowExternalApRedirect_description": "If enabled, other servers can query third-party content through this server but this may result in content spoofing.",
	"needToRestartServerToApply": "A Misskey restart is required to reflect the change.",
	"cacheRemoteFiles": "Cache remote files",
	"cacheRemoteFilesDescription": "When this setting is disabled, remote files are loaded directly from the remote servers. Disabling this will decrease storage usage, but increase traffic, as thumbnails will not be generated.",
	"youCanCleanRemoteFilesCache": "You can clear the cache by clicking the 🗑️ button in the file management view.",
	"cacheRemoteSensitiveFiles": "Cache sensitive remote files",
	"cacheRemoteSensitiveFilesDescription": "When this setting is disabled, sensitive remote files are loaded directly from the remote instance without caching.",
	"proxyAccount": "Proxy account",
	"proxyAccountDescription": "A proxy account is an account that acts as a remote follower for users under certain conditions. For example, when a user adds a remote user to the list, the remote user's activity will not be delivered to the instance if no local user is following that user, so the proxy account will follow instead.",
	"description": "Bio",
	"youCanIncludeHashtags": "You can also include hashtags in your bio."
}
</locale>

<locale locale="kn-IN" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Restart server setup wizard?",
	"restartServerSetupWizardConfirm_text": "Some current settings will be reset.",
	"general": "General",
	"info": "About",
	"instanceName": "Instance name",
	"modified": "Modified",
	"shortName": "Short name",
	"optional": "Optional",
	"shortNameDescription": "A shorthand for the instance's name that can be displayed if the full official name is long.",
	"instanceDescription": "Instance description",
	"maintainerName": "Maintainer",
	"maintainerEmail": "Maintainer email",
	"tosUrl": "Terms of Service URL",
	"privacyPolicyUrl": "Privacy Policy URL",
	"inquiryUrl": "Inquiry URL",
	"inquiryUrlDescription": "Specify a URL for the inquiry form to the server maintainer or a web page for the contact information.",
	"repositoryUrl": "Repository URL",
	"repositoryUrlDescription": "If you are using Misskey as is (without any changes to the source code), enter https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "If you have not published a repository, you must provide a tarball instead. See .config/example.yml for more information.",
	"impressumUrl": "Impressum URL",
	"impressumDescription": "In some countries, like germany, the inclusion of operator contact information (an Impressum) is legally required for commercial websites.",
	"pinnedUsers": "Pinned users",
	"pinnedUsersDescription": "List usernames separated by line breaks to be pinned in the \"Explore\" tab.",
	"enableServiceworker": "Enable Push-Notifications for your Browser",
	"serviceworkerInfo": "Must be enabled for push notifications.",
	"adsSettings": "Ad settings",
	"notesPerOneAd": "Real-time update ad placement interval (Notes per ad)",
	"setZeroToDisable": "Set this value to 0 to disable real-time update ads",
	"adsTooClose": "The current ad interval may significantly worsen the user experience due to being too low.",
	"title": "URL preview settings",
	"enable": "Enable URL preview",
	"allowRedirect": "Allow URL preview redirection",
	"allowRedirectDescription": "If a URL has a redirection set, you can enable this feature to follow the redirection and display a preview of the redirected content. Disabling this will save server resources, but redirected content will not be displayed.",
	"requireContentLength": "Generate the preview only if you could get Content-Length",
	"requireContentLengthDescription": "If other server doesn't return Content-Length, the preview won't be generated.",
	"maximumContentLength": "Maximum Content-Length (bytes)",
	"maximumContentLengthDescription": "If Content-Length is higher than this value, the preview won't be generated.",
	"timeout": "Time out when getting preview (ms)",
	"timeoutDescription": "If it takes longer than this value to get the preview, the preview won’t be generated.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Sets the User-Agent to be used when retrieving previews. If left blank, the default User-Agent will be used.",
	"summaryProxy": "Proxy endpoints that generate previews",
	"notUsePleaseLeaveBlank": "Leave blank if not used",
	"summaryProxyDescription": "Not Misskey itself, but generate previews using Summaly Proxy.",
	"summaryProxyDescription2": "The following parameters are linked to the proxy as a query string. If the proxy does not support them, the values are ignored.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "Federation",
	"all": "All",
	"specifyHost": "Specific host",
	"none": "None",
	"behavior": "Behavior",
	"federationAllowedHosts": "Federation allowed servers",
	"federationAllowedHostsDescription": "Specify the hostnames of the servers you want to allow federation separated by line breaks.",
	"deliverSuspendedSoftware": "Suspended Software",
	"add": "Add",
	"deliverSuspendedSoftwareDescription": "You can specify a range of names and versions of the server's software to stop delivery for vulnerability or other reasons. This version information is provided by the server and is not guaranteed to be reliable. A semver range specification can be used to specify the version, but specifying >= 2024.3.1 will not include custom versions such as 2024.3.1-custom.0, so it is recommended that a prerelease specification be used, such as >= 2024.3.1-0",
	"softwareName": "Software",
	"version": "Version",
	"signToActivityPubGet": "Sign ActivityPub GET requests",
	"signToActivityPubGet_description": "Normally, this should be enabled. Disabling it may improve issues related to federation, but on the other hand it could disable federation towards some other servers.",
	"proxyRemoteFiles": "Proxy remote files",
	"proxyRemoteFiles_description": "When enabled, the server will proxy and serve remote files. This is useful for generating image thumbnails and protecting user privacy.",
	"allowExternalApRedirect": "Allow redirects for queries via ActivityPub",
	"allowExternalApRedirect_description": "If enabled, other servers can query third-party content through this server but this may result in content spoofing.",
	"needToRestartServerToApply": "A Misskey restart is required to reflect the change.",
	"cacheRemoteFiles": "Cache remote files",
	"cacheRemoteFilesDescription": "When this setting is disabled, remote files are loaded directly from the remote servers. Disabling this will decrease storage usage, but increase traffic, as thumbnails will not be generated.",
	"youCanCleanRemoteFilesCache": "You can clear the cache by clicking the 🗑️ button in the file management view.",
	"cacheRemoteSensitiveFiles": "Cache sensitive remote files",
	"cacheRemoteSensitiveFilesDescription": "When this setting is disabled, sensitive remote files are loaded directly from the remote instance without caching.",
	"proxyAccount": "Proxy account",
	"proxyAccountDescription": "A proxy account is an account that acts as a remote follower for users under certain conditions. For example, when a user adds a remote user to the list, the remote user's activity will not be delivered to the instance if no local user is following that user, so the proxy account will follow instead.",
	"description": "Bio",
	"youCanIncludeHashtags": "You can also include hashtags in your bio."
}
</locale>

<locale locale="ko-KR" lang="json">
{
	"restartServerSetupWizardConfirm_title": "서버의 초기 설정 위자드를 재시도하시겠습니까?",
	"restartServerSetupWizardConfirm_text": "현재 일부 설정은 리셋됩니다.",
	"general": "일반",
	"info": "정보",
	"instanceName": "서버 이름",
	"modified": "변경 있음",
	"shortName": "약칭",
	"optional": "옵션",
	"shortNameDescription": "서버의 정식 명칭이 긴 경우에, 대신에 표시할 수 있는 약칭이나 통칭.",
	"instanceDescription": "서버 소개",
	"maintainerName": "관리자 이름",
	"maintainerEmail": "관리자 이메일",
	"tosUrl": "이용약관 URL",
	"privacyPolicyUrl": "개인정보 보호 정책 URL",
	"inquiryUrl": "문의처 URL",
	"inquiryUrlDescription": "서버 운영자에게 보내는 문의 양식의 URL이나 운영자의 연락처 등이 적힌 웹 페이지의 URL을 설정합니다.",
	"repositoryUrl": "저장소 URL",
	"repositoryUrlDescription": "소스 코드를 공개한 저장소가 있는 경우, 그 URL을 적습니다. Misskey를 원본 그대로 (소스 코드를 어떤 식으로도 변경하지 않고) 쓰고 있는 경우 https://github.com/misskey-dev/misskey 라고 적습니다.",
	"repositoryUrlOrTarballRequired": "저장소를 공개하지 않은 경우 대신 tarball을 제공할 필요가 있습니다. 세부사항은 .config/example.yml을 참조해 주세요.",
	"impressumUrl": "운영자 정보 URL",
	"impressumDescription": "독일 등의 일부 나라와 지역에서는 꼭 표시해야 합니다(Impressum).",
	"pinnedUsers": "고정한 유저",
	"pinnedUsersDescription": "\"발견하기\" 페이지 등에 고정하고 싶은 유저를 한 줄에 한 명씩 적습니다.",
	"enableServiceworker": "ServiceWorker 사용",
	"serviceworkerInfo": "푸시 알림을 수행하려면 활성화해야 합니다.",
	"adsSettings": "광고 표시 설정",
	"notesPerOneAd": "실시간으로 갱신되는 타임라인에서 광고를 노출시키는 간격 (노트 당)",
	"setZeroToDisable": "0으로 지정하면 실시간 타임라인에서의 광고를 비활성화합니다",
	"adsTooClose": "광고의 표시 간격이 매우 작아, 유저 경험에 부정적인 영향을 미칠 수 있습니다.",
	"title": "URL 미리보기 설정",
	"enable": "URL 미리보기 활성화",
	"allowRedirect": "미리보기 위치의 리디렉션 허가",
	"allowRedirectDescription": "입력된 URL이 리디렉션될 경우, 그 리디렉션 위치를 따라 미리보기를 표시할 것인지 설정합니다. 비활성화하면 서버 리소스를 절약할 수 있습니다만, 리디렉션 위치의 내용은 표시되지 않습니다.",
	"requireContentLength": "Content-Length를 받아온 경우에만 ",
	"requireContentLengthDescription": "상대 서버가 Content-Length를 되돌려주지 않는다면 미리보기를 만들지 않습니다.",
	"maximumContentLength": "Content-Length의 최대치 (byte)",
	"maximumContentLengthDescription": "Content-Length가 이 값을 넘어서면 미리보기를 생성하지 않습니다.",
	"timeout": "미리보기를 불러올 때의 타임아웃 (ms)",
	"timeoutDescription": "미리보기를 로딩하는데 걸리는 시간이 정한 시간보다 오래 걸리는 경우, 미리보기를 생성하지 않습니다.",
	"userAgent": "User-Agent",
	"userAgentDescription": "미리보기를 얻을 때 사용한 User-Agent를 설정합니다. 비어 있다면 기본값의 User-Agent를 사용합니다.",
	"summaryProxy": "미리보기를 만든 프록시의 엔드포인트",
	"notUsePleaseLeaveBlank": "사용하지 않는 경우 비워두세요.",
	"summaryProxyDescription": "Misskey 본체를 사용하지 않고 서머리 프록시로 미리보기를 만듭니다.",
	"summaryProxyDescription2": "프록시는 아래의 파라미터를 쿼리 문자열로 연동합니다. 프록시 측이 이를 지원하지 않으면 설정값을 무시합니다.",
	"urlPreviewSensitiveList": "썸네일 표시 제한 URL",
	"urlPreviewSensitiveListDescription": "공백으로 구분하면 AND 지정으로 되고, 줄내림으로 구분하면 OR 지정으로 됩니다. 슬래시로 감싸면 정규 표현으로 됩니다. 일치한 경우에 썸네일이 표시되지 않게 됩니다.",
	"federation": "연합",
	"all": "전체",
	"specifyHost": "호스트 지정",
	"none": "없음",
	"behavior": "동작",
	"federationAllowedHosts": "연합을 허가하는 서버",
	"federationAllowedHostsDescription": "연합을 허가하는 서버의 호스트를 엔터로 구분해서 설정합니다.",
	"deliverSuspendedSoftware": "전달 정지 중인 소프트웨어",
	"add": "추가",
	"deliverSuspendedSoftwareDescription": "취약성 등의 이유로 서버의 소프트웨어 이름 및 버전 범위를 지정하여 전달을 정지할 수 있어요. 이 버전 정보는 서버가 제공한 것이며 신뢰성은 보장되지 않아요. 버전 지정에는 semver의 범위 지정을 사용할 수 있지만, >= 2024.3.1로 지정하면 2024.3.1-custom.0과 같은 custom.0과 같은 custom 버전이 포함되지 않기 때문에 >= 2024.3.1-0과 같이 prerelease를 지정하는 것이 좋아요.",
	"softwareName": "소프트웨어 이름",
	"version": "버전",
	"signToActivityPubGet": "GET 요청에 사인",
	"signToActivityPubGet_description": "보통의 경우 활성화해 주십시오. 연합의 통신에 관한 문제가 있는 경우, 비활성화하면 개선되는 경우도 있습니다만, 서버에 따라서는 통신이 불가능해지는 경우도 있습니다.",
	"proxyRemoteFiles": "리모트 파일 프록시",
	"proxyRemoteFiles_description": "활성화하면 리모트 파일을 프록시로 제공합니다. 이미지의 섬네일 생성이나 유저의 개인정보 보호에 도움을 줍니다.",
	"allowExternalApRedirect": "ActivityPub 경유 조회에 리디렉션 허가",
	"allowExternalApRedirect_description": "활성화하면 다른 서버가 이 서버를 통해 제3자의 콘텐츠를 조회할 수 있습니다만, 콘텐츠의 사칭 문제가 생길 수 있습니다.",
	"needToRestartServerToApply": "변경 사항은 새로고침이 필요합니다.",
	"cacheRemoteFiles": "리모트 파일을 캐시",
	"cacheRemoteFilesDescription": "이 설정을 활성화하면 리모트 파일을 이 서버의 스토리지에 캐시합니다. 미디어의 표시가 빨라지지만, 서버의 저장 용량을 크게 소모합니다. 리모트 유저의 미디어를 얼마나 보관할 지는 역할의 드라이브 용량 제한에 따라 결정되며, 정해진 용량을 넘길 경우 오래된 파일부터 차례대로 삭제한 뒤 링크로 전환합니다. \n비활성화하면 리모트 파일을 직접 링크하며, 이 경우 이미지 썸네일 생성 및 유저 프라이버시 보호를 위해 default.yml에서 proxyRemoteFiles를 true로 설정하는 것을 권장합니다.",
	"youCanCleanRemoteFilesCache": "파일 관리 화면의 🗑️ 버튼을 눌러 모든 캐시를 삭제할 수 있습니다.",
	"cacheRemoteSensitiveFiles": "리모트의 민감한 파일을 캐시",
	"cacheRemoteSensitiveFilesDescription": "이 설정을 비활성화하면 리모트의 민감한 파일은 캐시하지 않고 리모트에서 직접 가져오도록 합니다.",
	"proxyAccount": "프록시 계정",
	"proxyAccountDescription": "프록시 계정은 특정 조건 하에서 유저의 리모트 팔로우를 대행하는 계정입니다. 예를 들면, 유저가 리모트 유저를 리스트에 넣었을 때, 리스트에 들어간 유저를 아무도 팔로우한 적이 없다면 액티비티가 서버로 배달되지 않기 때문에, 대신 프록시 계정이 해당 유저를 팔로우하도록 합니다.",
	"description": "자기소개",
	"youCanIncludeHashtags": "해시 태그를 포함할 수 있습니다."
}
</locale>

<locale locale="nl-NL" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Restart server setup wizard?",
	"restartServerSetupWizardConfirm_text": "Some current settings will be reset.",
	"general": "Algemeen",
	"info": "Over",
	"instanceName": "Naam van de server",
	"modified": "Modified",
	"shortName": "Short name",
	"optional": "Optioneel",
	"shortNameDescription": "A shorthand for the instance's name that can be displayed if the full official name is long.",
	"instanceDescription": "Beschrijving van de server",
	"maintainerName": "Onderhouder",
	"maintainerEmail": "E-mailadres beheerder",
	"tosUrl": "URL gebruiksvoorwaarden",
	"privacyPolicyUrl": "Privacy Policy URL",
	"inquiryUrl": "Inquiry URL",
	"inquiryUrlDescription": "Specify a URL for the inquiry form to the server maintainer or a web page for the contact information.",
	"repositoryUrl": "Repository URL",
	"repositoryUrlDescription": "If you are using Misskey as is (without any changes to the source code), enter https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "If you have not published a repository, you must provide a tarball instead. See .config/example.yml for more information.",
	"impressumUrl": "Impressum URL",
	"impressumDescription": "In some countries, like germany, the inclusion of operator contact information (an Impressum) is legally required for commercial websites.",
	"pinnedUsers": "Vastgeprikte gebruikers",
	"pinnedUsersDescription": "Een lijst met gebruikersnamen, gescheiden door regeleinden, die moet worden vastgemaakt in het tabblad “Verkennen”",
	"enableServiceworker": "Activeer pushmeldingen in de browser",
	"serviceworkerInfo": "Moet worden geactiveerd voor pushmeldingen.",
	"adsSettings": "Ad settings",
	"notesPerOneAd": "Real-time update ad placement interval (Notes per ad)",
	"setZeroToDisable": "Set this value to 0 to disable real-time update ads",
	"adsTooClose": "The current ad interval may significantly worsen the user experience due to being too low.",
	"title": "URL preview settings",
	"enable": "Enable URL preview",
	"allowRedirect": "Allow URL preview redirection",
	"allowRedirectDescription": "If a URL has a redirection set, you can enable this feature to follow the redirection and display a preview of the redirected content. Disabling this will save server resources, but redirected content will not be displayed.",
	"requireContentLength": "Generate the preview only if you could get Content-Length",
	"requireContentLengthDescription": "If other server doesn't return Content-Length, the preview won't be generated.",
	"maximumContentLength": "Maximum Content-Length (bytes)",
	"maximumContentLengthDescription": "If Content-Length is higher than this value, the preview won't be generated.",
	"timeout": "Time out when getting preview (ms)",
	"timeoutDescription": "If it takes longer than this value to get the preview, the preview won’t be generated.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Sets the User-Agent to be used when retrieving previews. If left blank, the default User-Agent will be used.",
	"summaryProxy": "Proxy endpoints that generate previews",
	"notUsePleaseLeaveBlank": "Leave blank if not used",
	"summaryProxyDescription": "Not Misskey itself, but generate previews using Summaly Proxy.",
	"summaryProxyDescription2": "The following parameters are linked to the proxy as a query string. If the proxy does not support them, the values are ignored.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "Federatie",
	"all": "Alle",
	"specifyHost": "Specificeer host",
	"none": "Niets",
	"behavior": "Gedrag",
	"federationAllowedHosts": "Servers die mogen federeren ",
	"federationAllowedHostsDescription": "Geef de hostnamen van de servers die mogen federeren op, elk op hun eigen regel.",
	"deliverSuspendedSoftware": "Suspended Software",
	"add": "Toevoegen",
	"deliverSuspendedSoftwareDescription": "You can specify a range of names and versions of the server's software to stop delivery for vulnerability or other reasons. This version information is provided by the server and is not guaranteed to be reliable. A semver range specification can be used to specify the version, but specifying >= 2024.3.1 will not include custom versions such as 2024.3.1-custom.0, so it is recommended that a prerelease specification be used, such as >= 2024.3.1-0",
	"softwareName": "Software",
	"version": "Versie",
	"signToActivityPubGet": "Sign ActivityPub GET requests",
	"signToActivityPubGet_description": "Normally, this should be enabled. Disabling it may improve issues related to federation, but on the other hand it could disable federation towards some other servers.",
	"proxyRemoteFiles": "Proxy remote files",
	"proxyRemoteFiles_description": "When enabled, the server will proxy and serve remote files. This is useful for generating image thumbnails and protecting user privacy.",
	"allowExternalApRedirect": "Allow redirects for queries via ActivityPub",
	"allowExternalApRedirect_description": "If enabled, other servers can query third-party content through this server but this may result in content spoofing.",
	"needToRestartServerToApply": "A Misskey restart is required to reflect the change.",
	"cacheRemoteFiles": "Externe bestanden cachen",
	"cacheRemoteFilesDescription": "Als deze instelling uitgeschakeld is worden bestanden altijd direct van remote servers geladen. Hiermee wordt opslagruimte bespaard, maar doordat er geen thumbnails worden gegenereerd, zal netwerkverkeer toenemen.",
	"youCanCleanRemoteFilesCache": "Klik op de 🗑️ knop in de bestandsbeheerweergave om de cache te wissen.",
	"cacheRemoteSensitiveFiles": "Gevoelige bestanden van externe instances in de cache bewaren",
	"cacheRemoteSensitiveFilesDescription": "Als deze instelling is uitgeschakeld, worden gevoelige bestanden op afstand direct vanuit de instantie op afstand geladen zonder caching.",
	"proxyAccount": "Proxy account",
	"proxyAccountDescription": "Een proxy-account is een account dat onder bepaalde voorwaarden fungeert als externe volger voor gebruikers. Als een gebruiker bijvoorbeeld een externe gebruiker aan de lijst toevoegt, wordt de activiteit van de externe gebruiker niet aan de server geleverd als geen lokale gebruiker die gebruiker volgt, dus het proxy-account volgt in plaats daarvan.",
	"description": "Bio",
	"youCanIncludeHashtags": "You can also include hashtags in your bio."
}
</locale>

<locale locale="no-NO" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Restart server setup wizard?",
	"restartServerSetupWizardConfirm_text": "Some current settings will be reset.",
	"general": "Generelt",
	"info": "Infomasjon",
	"instanceName": "Servernavn",
	"modified": "Modified",
	"shortName": "Short name",
	"optional": "Optional",
	"shortNameDescription": "A shorthand for the instance's name that can be displayed if the full official name is long.",
	"instanceDescription": "Serverbeskrivelse",
	"maintainerName": "Maintainer",
	"maintainerEmail": "Maintainer email",
	"tosUrl": "Terms of Service URL",
	"privacyPolicyUrl": "Privacy Policy URL",
	"inquiryUrl": "Inquiry URL",
	"inquiryUrlDescription": "Specify a URL for the inquiry form to the server maintainer or a web page for the contact information.",
	"repositoryUrl": "Repository URL",
	"repositoryUrlDescription": "If you are using Misskey as is (without any changes to the source code), enter https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "If you have not published a repository, you must provide a tarball instead. See .config/example.yml for more information.",
	"impressumUrl": "Impressum URL",
	"impressumDescription": "In some countries, like germany, the inclusion of operator contact information (an Impressum) is legally required for commercial websites.",
	"pinnedUsers": "Festede brukrere",
	"pinnedUsersDescription": "Liste over brukernavn atskilt med linjeskift som skal festes i \"Utforsk\" fanen.",
	"enableServiceworker": "Enable Push-Notifications for your Browser",
	"serviceworkerInfo": "Must be enabled for push notifications.",
	"adsSettings": "Ad settings",
	"notesPerOneAd": "Real-time update ad placement interval (Notes per ad)",
	"setZeroToDisable": "Set this value to 0 to disable real-time update ads",
	"adsTooClose": "The current ad interval may significantly worsen the user experience due to being too low.",
	"title": "URL preview settings",
	"enable": "Enable URL preview",
	"allowRedirect": "Allow URL preview redirection",
	"allowRedirectDescription": "If a URL has a redirection set, you can enable this feature to follow the redirection and display a preview of the redirected content. Disabling this will save server resources, but redirected content will not be displayed.",
	"requireContentLength": "Generate the preview only if you could get Content-Length",
	"requireContentLengthDescription": "If other server doesn't return Content-Length, the preview won't be generated.",
	"maximumContentLength": "Maximum Content-Length (bytes)",
	"maximumContentLengthDescription": "If Content-Length is higher than this value, the preview won't be generated.",
	"timeout": "Time out when getting preview (ms)",
	"timeoutDescription": "If it takes longer than this value to get the preview, the preview won’t be generated.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Sets the User-Agent to be used when retrieving previews. If left blank, the default User-Agent will be used.",
	"summaryProxy": "Proxy endpoints that generate previews",
	"notUsePleaseLeaveBlank": "Leave blank if not used",
	"summaryProxyDescription": "Not Misskey itself, but generate previews using Summaly Proxy.",
	"summaryProxyDescription2": "The following parameters are linked to the proxy as a query string. If the proxy does not support them, the values are ignored.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "Føderasjon",
	"all": "Alle",
	"specifyHost": "Specific host",
	"none": "Ingen",
	"behavior": "Oppførsel",
	"federationAllowedHosts": "Federation allowed servers",
	"federationAllowedHostsDescription": "Specify the hostnames of the servers you want to allow federation separated by line breaks.",
	"deliverSuspendedSoftware": "Suspended Software",
	"add": "Legg til",
	"deliverSuspendedSoftwareDescription": "You can specify a range of names and versions of the server's software to stop delivery for vulnerability or other reasons. This version information is provided by the server and is not guaranteed to be reliable. A semver range specification can be used to specify the version, but specifying >= 2024.3.1 will not include custom versions such as 2024.3.1-custom.0, so it is recommended that a prerelease specification be used, such as >= 2024.3.1-0",
	"softwareName": "Software",
	"version": "Versjon",
	"signToActivityPubGet": "Sign ActivityPub GET requests",
	"signToActivityPubGet_description": "Normally, this should be enabled. Disabling it may improve issues related to federation, but on the other hand it could disable federation towards some other servers.",
	"proxyRemoteFiles": "Proxy remote files",
	"proxyRemoteFiles_description": "When enabled, the server will proxy and serve remote files. This is useful for generating image thumbnails and protecting user privacy.",
	"allowExternalApRedirect": "Allow redirects for queries via ActivityPub",
	"allowExternalApRedirect_description": "If enabled, other servers can query third-party content through this server but this may result in content spoofing.",
	"needToRestartServerToApply": "A Misskey restart is required to reflect the change.",
	"cacheRemoteFiles": "Cache remote files",
	"cacheRemoteFilesDescription": "When this setting is disabled, remote files are loaded directly from the remote servers. Disabling this will decrease storage usage, but increase traffic, as thumbnails will not be generated.",
	"youCanCleanRemoteFilesCache": "You can clear the cache by clicking the 🗑️ button in the file management view.",
	"cacheRemoteSensitiveFiles": "Cache sensitive remote files",
	"cacheRemoteSensitiveFilesDescription": "When this setting is disabled, sensitive remote files are loaded directly from the remote instance without caching.",
	"proxyAccount": "Proxy account",
	"proxyAccountDescription": "A proxy account is an account that acts as a remote follower for users under certain conditions. For example, when a user adds a remote user to the list, the remote user's activity will not be delivered to the instance if no local user is following that user, so the proxy account will follow instead.",
	"description": "Biografi",
	"youCanIncludeHashtags": "You can also include hashtags in your bio."
}
</locale>

<locale locale="pl-PL" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Restart server setup wizard?",
	"restartServerSetupWizardConfirm_text": "Some current settings will be reset.",
	"general": "Ogólne",
	"info": "Informacje",
	"instanceName": "Nazwa instancji",
	"modified": "Modified",
	"shortName": "Short name",
	"optional": "Nieobowiązkowe",
	"shortNameDescription": "A shorthand for the instance's name that can be displayed if the full official name is long.",
	"instanceDescription": "Opis instancji",
	"maintainerName": "Administrator",
	"maintainerEmail": "E-mail administratora",
	"tosUrl": "Adres URL regulaminu",
	"privacyPolicyUrl": "Privacy Policy URL",
	"inquiryUrl": "Inquiry URL",
	"inquiryUrlDescription": "Specify a URL for the inquiry form to the server maintainer or a web page for the contact information.",
	"repositoryUrl": "Repository URL",
	"repositoryUrlDescription": "If you are using Misskey as is (without any changes to the source code), enter https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "If you have not published a repository, you must provide a tarball instead. See .config/example.yml for more information.",
	"impressumUrl": "Impressum URL",
	"impressumDescription": "In some countries, like germany, the inclusion of operator contact information (an Impressum) is legally required for commercial websites.",
	"pinnedUsers": "Przypięty użytkownik",
	"pinnedUsersDescription": "Wypisz po jednej nazwie użytkownika w wierszu. Podani użytkownicy zostaną przypięci pod kartą „Eksploruj”.",
	"enableServiceworker": "Włącz ServiceWorker",
	"serviceworkerInfo": "Musi być włączone dla powiadomień push.",
	"adsSettings": "Ad settings",
	"notesPerOneAd": "Real-time update ad placement interval (Notes per ad)",
	"setZeroToDisable": "Set this value to 0 to disable real-time update ads",
	"adsTooClose": "The current ad interval may significantly worsen the user experience due to being too low.",
	"title": "URL preview settings",
	"enable": "Enable URL preview",
	"allowRedirect": "Allow URL preview redirection",
	"allowRedirectDescription": "If a URL has a redirection set, you can enable this feature to follow the redirection and display a preview of the redirected content. Disabling this will save server resources, but redirected content will not be displayed.",
	"requireContentLength": "Generate the preview only if you could get Content-Length",
	"requireContentLengthDescription": "If other server doesn't return Content-Length, the preview won't be generated.",
	"maximumContentLength": "Maximum Content-Length (bytes)",
	"maximumContentLengthDescription": "If Content-Length is higher than this value, the preview won't be generated.",
	"timeout": "Time out when getting preview (ms)",
	"timeoutDescription": "If it takes longer than this value to get the preview, the preview won’t be generated.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Sets the User-Agent to be used when retrieving previews. If left blank, the default User-Agent will be used.",
	"summaryProxy": "Proxy endpoints that generate previews",
	"notUsePleaseLeaveBlank": "Leave blank if not used",
	"summaryProxyDescription": "Not Misskey itself, but generate previews using Summaly Proxy.",
	"summaryProxyDescription2": "The following parameters are linked to the proxy as a query string. If the proxy does not support them, the values are ignored.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "Federacja",
	"all": "Wszystkie",
	"specifyHost": "Specific host",
	"none": "Brak",
	"behavior": "Zachowanie",
	"federationAllowedHosts": "Federation allowed servers",
	"federationAllowedHostsDescription": "Specify the hostnames of the servers you want to allow federation separated by line breaks.",
	"deliverSuspendedSoftware": "Suspended Software",
	"add": "Dodaj",
	"deliverSuspendedSoftwareDescription": "You can specify a range of names and versions of the server's software to stop delivery for vulnerability or other reasons. This version information is provided by the server and is not guaranteed to be reliable. A semver range specification can be used to specify the version, but specifying >= 2024.3.1 will not include custom versions such as 2024.3.1-custom.0, so it is recommended that a prerelease specification be used, such as >= 2024.3.1-0",
	"softwareName": "Software",
	"version": "Wersja",
	"signToActivityPubGet": "Sign ActivityPub GET requests",
	"signToActivityPubGet_description": "Normally, this should be enabled. Disabling it may improve issues related to federation, but on the other hand it could disable federation towards some other servers.",
	"proxyRemoteFiles": "Proxy remote files",
	"proxyRemoteFiles_description": "When enabled, the server will proxy and serve remote files. This is useful for generating image thumbnails and protecting user privacy.",
	"allowExternalApRedirect": "Allow redirects for queries via ActivityPub",
	"allowExternalApRedirect_description": "If enabled, other servers can query third-party content through this server but this may result in content spoofing.",
	"needToRestartServerToApply": "A Misskey restart is required to reflect the change.",
	"cacheRemoteFiles": "Przechowuj zdalne pliki w pamięci podręcznej",
	"cacheRemoteFilesDescription": "Gdy ta opcja jest wyłączona, zdalne pliki są ładowane bezpośrednio ze zdalnych instancji. Wyłączenie the opcji zmniejszy użycie powierzchni dyskowej, ale zwiększy transfer, ponieważ miniaturki nie będą generowane.",
	"youCanCleanRemoteFilesCache": "Możesz wyczyścić cache poprzez kliknięcie przycisku 🗑️ w widoku menedżera plików.",
	"cacheRemoteSensitiveFiles": "Przechowuj wrażliwe zdalne pliki w pamięci podręcznej",
	"cacheRemoteSensitiveFilesDescription": "Gdy ta opcja jest wyłączona, wrażliwe pliki zdalne są wczytywane bezpośrednio ze zdalnej instancji bez cacheowania.",
	"proxyAccount": "Konto proxy",
	"proxyAccountDescription": "Opis konta pełnomocniczego",
	"description": "Opis",
	"youCanIncludeHashtags": "Możesz umieścić hashtagi w swoim opisie."
}
</locale>

<locale locale="pt-PT" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Reiniciar o assistente de configuração?",
	"restartServerSetupWizardConfirm_text": "Algumas configurações atuais serão reiniciadas.",
	"general": "Geral",
	"info": "Informações",
	"instanceName": "Nome da instância",
	"modified": "Modificado",
	"shortName": "Abreviação",
	"optional": "Opcional",
	"shortNameDescription": "Uma abreviação do nome da instância que pode ser exibido caso o nome oficial completo seja muito longo.",
	"instanceDescription": "Descrição da instância",
	"maintainerName": "Nome do administrador",
	"maintainerEmail": "E-mail do Administrador:",
	"tosUrl": "URL dos Termos de Uso",
	"privacyPolicyUrl": "URL da Política de Privacidade",
	"inquiryUrl": "URL de inquérito",
	"inquiryUrlDescription": "Especifique um URL para um formulário de inquérito para a administração ou uma página web com informações de contato.",
	"repositoryUrl": "URL do repositório",
	"repositoryUrlDescription": "Se você estiver utilizando Misskey como está (sem mudanças no código-fonte), insira https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "Se você não publicou um repositório, você precisa providenciar uma tarball em seu lugar. Veja .config/example.yml para mais informações.",
	"impressumUrl": "URL de 'Impressum'",
	"impressumDescription": "Em alguns países, como a Alemanha, a inclusão de informação de contato do operador de um serviço é legalmente exigida para websites comerciais.",
	"pinnedUsers": "Utilizador fixado",
	"pinnedUsersDescription": "Descreva os utilizadores que você deseja fixar na página \"Localizar\", etc., separados por quebras de linha.",
	"enableServiceworker": "Ative as notificações push para o seu navegador",
	"serviceworkerInfo": "Deve estar habilitado para receber notificações por push.",
	"adsSettings": "Configurações de propaganda",
	"notesPerOneAd": "Intervalo de notas entre o anúncio nas atualizações em tempo real.",
	"setZeroToDisable": "Selecione o valor 0 para desabilitar anúncios nas atualizações em tempo real.",
	"adsTooClose": "O intervalo atual de anúncio pode impactar negativamente a experiência de usuário por ser muito baixo.",
	"title": "Configurações da prévia de URL",
	"enable": "Habilitar prévia de URL",
	"allowRedirect": "Permitir redirecionamentos de URL em prévias.",
	"allowRedirectDescription": "Se um URL tem um redirecionamento, você pode habilitar essa função para segui-lo e exibir a prévia do conteúdo redirecionado. Desabilitar isso irá economizar recursos, mas o conteúdo não será exibido.",
	"requireContentLength": "Gerar previu apenas se houver cabeçalho Content-Length disponível na solicitação",
	"requireContentLengthDescription": "Se o outro servidor não retornar um cabeçalho Content-Length, a prévia não será gerada.",
	"maximumContentLength": "Content-Length máximo (em bytes)",
	"maximumContentLengthDescription": "Se o Content-Length for maior que esse valor, a prévia não será gerada.",
	"timeout": "Tempo máximo para obter a prévia (ms)",
	"timeoutDescription": "Se demorar mais que esse valor para obter uma prévia, ela não será gerada.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Define o User-Agent a ser usado ao gerar prévias. Se for deixado em branco, será usado o User-Agent padrão.",
	"summaryProxy": "Endpoints do Proxy que geram prévias",
	"notUsePleaseLeaveBlank": "Deixe em branco caso inutilizado",
	"summaryProxyDescription": "Fora do Misskey, gerar prévias usando o Sumally Proxy.",
	"summaryProxyDescription2": "Os parâmetros a seguir são vinculados ao proxy como um 'query string'. Se o proxy não os suportar, os valores serão ignorados.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "Federação",
	"all": "Todos",
	"specifyHost": "Especificar um hospedeiro",
	"none": "Nenhum",
	"behavior": "Comportamento",
	"federationAllowedHosts": "Servidores com federação permitida",
	"federationAllowedHostsDescription": "Especifique o endereço dos servidores em que deseja permitir a federação separados por linha.",
	"deliverSuspendedSoftware": "Software Suspenso",
	"add": "Adicionar",
	"deliverSuspendedSoftwareDescription": "Você pode especificar uma faixa de nomes e versões do software de servidores para cancelar o envio de conteúdo por motivos como vulnerabilidades. Essa informação da versão é providenciada pelo servidor e pode não ser confiável. Uma faixa semver pode ser utilizada para especificar a versão, mas colocar '>= 2024.3.1' não incluirá versões personalizadas como '2024.3.1-custom.0'. Logo, é recomendado inserir uma especificação como '>= 2024.3.1-0'",
	"softwareName": "Software",
	"version": "Versão",
	"signToActivityPubGet": "Assinar solicitações GET do ActivityPub",
	"signToActivityPubGet_description": "Normalmente, isso deve ser habilitado. Desabilitar pode melhorar o desempenho na federação, mas também pode cortar a federação com alguns servidores.",
	"proxyRemoteFiles": "Passar arquivos remotos por proxy",
	"proxyRemoteFiles_description": "Se habilitado, o servidor irá servir arquivos remotos através de um proxy. Isso é útil para gerar prévias de imagens e proteger a privacidade do usuário.",
	"allowExternalApRedirect": "Permitir redirecionamento de conteúdo pelo ActivityPub",
	"allowExternalApRedirect_description": "Se habilitado, outros servidores podem solicitar conteúdo de terceiros através desse servidor, o que pode resultar em falsificação de conteúdo (spoofing).",
	"needToRestartServerToApply": "É necessário reiniciar o servidor para aplicar as mudanças.",
	"cacheRemoteFiles": "Cache de arquivos remotos",
	"cacheRemoteFilesDescription": "Ao desativar esta configuração, os arquivos remotos não serão mais armazenados em cache e serão vinculados diretamente. Isso economizará espaço de armazenamento no servidor, mas os thumbnails não serão gerados, o que pode aumentar o tráfego de dados.",
	"youCanCleanRemoteFilesCache": "Pode excluir todos os caches com o botão 🗑️ de gestão de arquivos.",
	"cacheRemoteSensitiveFiles": "Fazer cache de arquivos remotos sensíveis",
	"cacheRemoteSensitiveFilesDescription": "Desativar essa configuração faz com que arquivos remotos sensíveis sejam vinculados diretamente em vez de armazenados em cache.",
	"proxyAccount": "Conta proxy",
	"proxyAccountDescription": "Uma conta de proxy é uma conta que assume o acompanhamento remoto de um usuário sob certas condições específicas. Por exemplo, quando um usuário inclui um usuário remoto em uma lista, mas ninguém na lista está seguindo o usuário remoto, a atividade não é entregue ao servidor. Nesse caso, a conta de proxy entra em ação para seguir o usuário remoto em vez disso.",
	"description": "Bio",
	"youCanIncludeHashtags": "Você pode incluir hashtags em sua bio."
}
</locale>

<locale locale="ru-RU" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Restart server setup wizard?",
	"restartServerSetupWizardConfirm_text": "Some current settings will be reset.",
	"general": "Общее",
	"info": "Описание",
	"instanceName": "Название инстанса",
	"modified": "Изменено",
	"shortName": "Short name",
	"optional": "Необязательно",
	"shortNameDescription": "A shorthand for the instance's name that can be displayed if the full official name is long.",
	"instanceDescription": "Описание инстанса",
	"maintainerName": "Имя администратора",
	"maintainerEmail": "Электронная почта администратора",
	"tosUrl": "Ссылка на пользовательское соглашение",
	"privacyPolicyUrl": "Ссылка на Политику Конфиденциальности",
	"inquiryUrl": "Inquiry URL",
	"inquiryUrlDescription": "Specify a URL for the inquiry form to the server maintainer or a web page for the contact information.",
	"repositoryUrl": "Ссылка на репозиторий",
	"repositoryUrlDescription": "Если вы используете Misskey как есть (без изменений в исходном коде), введите https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "Если репозиторий закрыт, необходимо предоставить ссылку на tarball. Подробности см. в файле \".config/example.yml\"",
	"impressumUrl": "Ссылка на Impressum",
	"impressumDescription": "В некоторых странах, например в Германии, раскрытие информации о владельце (Impressum) необходимо законом для коммерческих сайтов.",
	"pinnedUsers": "Прикреплённый пользователь",
	"pinnedUsersDescription": "Перечислите по одному имени пользователя в строке. Пользователи, перечисленные здесь, будут привязаны к закладке \"Изучение\".",
	"enableServiceworker": "Включить ServiceWorker",
	"serviceworkerInfo": "Нужно включить, чтобы работали push-уведомления.",
	"adsSettings": "Ad settings",
	"notesPerOneAd": "Real-time update ad placement interval (Notes per ad)",
	"setZeroToDisable": "Set this value to 0 to disable real-time update ads",
	"adsTooClose": "The current ad interval may significantly worsen the user experience due to being too low.",
	"title": "URL preview settings",
	"enable": "Enable URL preview",
	"allowRedirect": "Allow URL preview redirection",
	"allowRedirectDescription": "If a URL has a redirection set, you can enable this feature to follow the redirection and display a preview of the redirected content. Disabling this will save server resources, but redirected content will not be displayed.",
	"requireContentLength": "Generate the preview only if you could get Content-Length",
	"requireContentLengthDescription": "If other server doesn't return Content-Length, the preview won't be generated.",
	"maximumContentLength": "Maximum Content-Length (bytes)",
	"maximumContentLengthDescription": "If Content-Length is higher than this value, the preview won't be generated.",
	"timeout": "Time out when getting preview (ms)",
	"timeoutDescription": "If it takes longer than this value to get the preview, the preview won’t be generated.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Sets the User-Agent to be used when retrieving previews. If left blank, the default User-Agent will be used.",
	"summaryProxy": "Proxy endpoints that generate previews",
	"notUsePleaseLeaveBlank": "Если не используется, оставьте пустым",
	"summaryProxyDescription": "Not Misskey itself, but generate previews using Summaly Proxy.",
	"summaryProxyDescription2": "The following parameters are linked to the proxy as a query string. If the proxy does not support them, the values are ignored.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "Федерация",
	"all": "Все",
	"specifyHost": "Указать сайт",
	"none": "Ничего",
	"behavior": "Поведение",
	"federationAllowedHosts": "Серверы, поддерживающие федерацию",
	"federationAllowedHostsDescription": "Укажите имена серверов, для которых вы хотите разрешить объединение, разделив их разделителями строк.",
	"deliverSuspendedSoftware": "Suspended Software",
	"add": "Добавить",
	"deliverSuspendedSoftwareDescription": "You can specify a range of names and versions of the server's software to stop delivery for vulnerability or other reasons. This version information is provided by the server and is not guaranteed to be reliable. A semver range specification can be used to specify the version, but specifying >= 2024.3.1 will not include custom versions such as 2024.3.1-custom.0, so it is recommended that a prerelease specification be used, such as >= 2024.3.1-0",
	"softwareName": "Software Name",
	"version": "Версия",
	"signToActivityPubGet": "Sign ActivityPub GET requests",
	"signToActivityPubGet_description": "Normally, this should be enabled. Disabling it may improve issues related to federation, but on the other hand it could disable federation towards some other servers.",
	"proxyRemoteFiles": "Proxy remote files",
	"proxyRemoteFiles_description": "When enabled, the server will proxy and serve remote files. This is useful for generating image thumbnails and protecting user privacy.",
	"allowExternalApRedirect": "Allow redirects for queries via ActivityPub",
	"allowExternalApRedirect_description": "If enabled, other servers can query third-party content through this server but this may result in content spoofing.",
	"needToRestartServerToApply": "Для вступления изменений в силу необходимо перезапустить сервер.",
	"cacheRemoteFiles": "Кешировать внешние файлы",
	"cacheRemoteFilesDescription": "Когда эта настройка отключена, файлы с других сайтов будут загружаться прямо оттуда. Это сэкономит место на сервере, но увеличит трафик, так как не будут создаваться эскизы.",
	"youCanCleanRemoteFilesCache": "Вы можете очистить кэш, нажав на кнопку 🗑️ в меню управления файлами.",
	"cacheRemoteSensitiveFiles": "Кэшировать внешние файлы «не для всех»",
	"cacheRemoteSensitiveFilesDescription": "Если отключено, файлы «не для всех» загружаются непосредственно с удалённых серверов, не кэшируясь.",
	"proxyAccount": "Учётная запись прокси",
	"proxyAccountDescription": "Учетная запись прокси предназначена служить подписчиком на пользователей с других сайтов. Например: если пользователь добавит кого-то с другого сайта в список, то деятельность того не отобразится, пока никто с этого же сайта не подписан на него. Чтобы это стало возможным, на него подписывается прокси.",
	"description": "О себе",
	"youCanIncludeHashtags": "Можете использовать здесь хештеги."
}
</locale>

<locale locale="sk-SK" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Restart server setup wizard?",
	"restartServerSetupWizardConfirm_text": "Some current settings will be reset.",
	"general": "Všeobecné",
	"info": "Informácie",
	"instanceName": "Názov servera",
	"modified": "Modified",
	"shortName": "Short name",
	"optional": "Voliteľné",
	"shortNameDescription": "A shorthand for the instance's name that can be displayed if the full official name is long.",
	"instanceDescription": "Popis servera",
	"maintainerName": "Správca",
	"maintainerEmail": "E-mailová adresa správcu",
	"tosUrl": "URL zmluvných podmienok",
	"privacyPolicyUrl": "Privacy Policy URL",
	"inquiryUrl": "Inquiry URL",
	"inquiryUrlDescription": "Specify a URL for the inquiry form to the server maintainer or a web page for the contact information.",
	"repositoryUrl": "Repository URL",
	"repositoryUrlDescription": "If you are using Misskey as is (without any changes to the source code), enter https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "If you have not published a repository, you must provide a tarball instead. See .config/example.yml for more information.",
	"impressumUrl": "Impressum URL",
	"impressumDescription": "In some countries, like germany, the inclusion of operator contact information (an Impressum) is legally required for commercial websites.",
	"pinnedUsers": "Pripnutí používatelia",
	"pinnedUsersDescription": "Zoznam mien používateľov oddelených riadkami, ktorý budú pripnutí v záložke \"Objavovať\".",
	"enableServiceworker": "Povoliť Service Worker",
	"serviceworkerInfo": "Musí byť zapnuté pre push notifikácie.",
	"adsSettings": "Ad settings",
	"notesPerOneAd": "Real-time update ad placement interval (Notes per ad)",
	"setZeroToDisable": "Set this value to 0 to disable real-time update ads",
	"adsTooClose": "The current ad interval may significantly worsen the user experience due to being too low.",
	"title": "URL preview settings",
	"enable": "Enable URL preview",
	"allowRedirect": "Allow URL preview redirection",
	"allowRedirectDescription": "If a URL has a redirection set, you can enable this feature to follow the redirection and display a preview of the redirected content. Disabling this will save server resources, but redirected content will not be displayed.",
	"requireContentLength": "Generate the preview only if you could get Content-Length",
	"requireContentLengthDescription": "If other server doesn't return Content-Length, the preview won't be generated.",
	"maximumContentLength": "Maximum Content-Length (bytes)",
	"maximumContentLengthDescription": "If Content-Length is higher than this value, the preview won't be generated.",
	"timeout": "Time out when getting preview (ms)",
	"timeoutDescription": "If it takes longer than this value to get the preview, the preview won’t be generated.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Sets the User-Agent to be used when retrieving previews. If left blank, the default User-Agent will be used.",
	"summaryProxy": "Proxy endpoints that generate previews",
	"notUsePleaseLeaveBlank": "Leave blank if not used",
	"summaryProxyDescription": "Not Misskey itself, but generate previews using Summaly Proxy.",
	"summaryProxyDescription2": "The following parameters are linked to the proxy as a query string. If the proxy does not support them, the values are ignored.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "Federácia",
	"all": "Všetko",
	"specifyHost": "Specific host",
	"none": "Žiadne",
	"behavior": "Správanie",
	"federationAllowedHosts": "Federation allowed servers",
	"federationAllowedHostsDescription": "Specify the hostnames of the servers you want to allow federation separated by line breaks.",
	"deliverSuspendedSoftware": "Suspended Software",
	"add": "Pridať",
	"deliverSuspendedSoftwareDescription": "You can specify a range of names and versions of the server's software to stop delivery for vulnerability or other reasons. This version information is provided by the server and is not guaranteed to be reliable. A semver range specification can be used to specify the version, but specifying >= 2024.3.1 will not include custom versions such as 2024.3.1-custom.0, so it is recommended that a prerelease specification be used, such as >= 2024.3.1-0",
	"softwareName": "Software",
	"version": "Verzia",
	"signToActivityPubGet": "Sign ActivityPub GET requests",
	"signToActivityPubGet_description": "Normally, this should be enabled. Disabling it may improve issues related to federation, but on the other hand it could disable federation towards some other servers.",
	"proxyRemoteFiles": "Proxy remote files",
	"proxyRemoteFiles_description": "When enabled, the server will proxy and serve remote files. This is useful for generating image thumbnails and protecting user privacy.",
	"allowExternalApRedirect": "Allow redirects for queries via ActivityPub",
	"allowExternalApRedirect_description": "If enabled, other servers can query third-party content through this server but this may result in content spoofing.",
	"needToRestartServerToApply": "A Misskey restart is required to reflect the change.",
	"cacheRemoteFiles": "Cachovanie vzdialených súborov",
	"cacheRemoteFilesDescription": "Zakázanie tohoto nastavenia spôsobí, že vzdialené súbory budú odkazované priamo, namiesto ukladania do cache. Ušetrí sa tak miesto na serveri, ale zvýši sa dátový tok, pretože sa negenerujú miniatúry.",
	"youCanCleanRemoteFilesCache": "You can clear the cache by clicking the 🗑️ button in the file management view.",
	"cacheRemoteSensitiveFiles": "Cache sensitive remote files",
	"cacheRemoteSensitiveFilesDescription": "When this setting is disabled, sensitive remote files are loaded directly from the remote instance without caching.",
	"proxyAccount": "Proxy účet",
	"proxyAccountDescription": "Proxy účet je účet, ktorý za určitých podmienok sleduje používateľov na diaľku vaším menom. Napríklad keď používateľ zaradí vzdialeného používateľa do zoznamu, pokiaľ nikto nesleduje používateľa na zozname, aktivita nebude doručená na server, takže namiesto toho bude používateľa sledova proxy účet.",
	"description": "Bio",
	"youCanIncludeHashtags": "Vo svojom bio môžete mať aj hashtagy."
}
</locale>

<locale locale="th-TH" lang="json">
{
	"restartServerSetupWizardConfirm_title": "ต้องการเริ่มวิซาร์ดการตั้งค่าเซิร์ฟเวอร์ใหม่หรือไม่?",
	"restartServerSetupWizardConfirm_text": "การตั้งค่าบางส่วนในปัจจุบันจะถูกรีเซ็ต",
	"general": "ทั่วไป",
	"info": "เกี่ยวกับ",
	"instanceName": "ชื่อเซิร์ฟเวอร์",
	"modified": "แก้ไข",
	"shortName": "ชื่อย่อ",
	"optional": "ไม่บังคับ",
	"shortNameDescription": "ตัวย่อหรือชื่อทั่วไปที่สามารถแสดงแทนชื่ออย่างเป็นทางการแบบยาวของเซิร์ฟเวอร์",
	"instanceDescription": "คำอธิบายแนะนำเซิร์ฟเวอร์",
	"maintainerName": "ชื่อผู้ดูแลระบบ",
	"maintainerEmail": "อีเมลผู้ดูแลระบบ",
	"tosUrl": "URL เงื่อนไขการให้บริการ",
	"privacyPolicyUrl": "URL นโยบายความเป็นส่วนตัว",
	"inquiryUrl": "URL สำหรับการติดต่อสอบถาม",
	"inquiryUrlDescription": "ระบุ URL ของหน้าเว็บที่มีแบบฟอร์มสำหรับติดต่อผู้ดูแลเซิร์ฟเวอร์ หรือข้อมูลการติดต่อของผู้ดูแลเซิร์ฟเวอร์",
	"repositoryUrl": "URL ของ repository",
	"repositoryUrlDescription": "หากมีที่เก็บซอร์สโค้ดที่เปิดเผยต่อสาธารณะ ให้ป้อน URL ที่เก็บซอร์สโค้ดนั้น แต่หากคุณใช้ Misskey ตามต้นฉบับ (ไม่มีการเปลี่ยนแปลงซอร์สโค้ด) ให้ป้อน https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "หากคุณไม่มี repository สาธารณะ คุณจะต้องจัดเตรียม tarball แทน ดู .config/example.yml สำหรับรายละเอียด",
	"impressumUrl": "URL อิมเพรสชั่น",
	"impressumDescription": "การติดป้ายกำกับ (Impressum) มีผลบังคับใช้ในบางประเทศและภูมิภาค เช่น ประเทศเยอรมนี",
	"pinnedUsers": "ผู้ใช้ที่ถูกปักหมุด",
	"pinnedUsersDescription": "ป้อนชื่อผู้ใช้ที่คุณต้องการปักหมุดในหน้า “ค้นพบ” ฯลฯ คั่นด้วยการขึ้นบรรทัดใหม่",
	"enableServiceworker": "เปิดใช้งานการแจ้งเตือนแบบพุชไปยังเบราว์เซอร์",
	"serviceworkerInfo": "ต้องเปิดใช้งานสำหรับการแจ้งเตือนแบบพุช",
	"adsSettings": "ตั้งค่าการโฆษณา",
	"notesPerOneAd": "อัปเดตช่วงเวลาตำแหน่งโฆษณาแบบเรียลไทม์ (จำนวนโน้ตต่อโฆษณา)",
	"setZeroToDisable": "ตั้งค่านี้ให้เป็น 0 เพื่อปิดใช้งานโฆษณาอัปเดตแบบเรียลไทม์",
	"adsTooClose": "เนื่องจากช่วงเวลาการแสดงโฆษณาสั้นมาก ประสบการณ์ผู้ใช้จึงอาจลดลงอย่างมาก",
	"title": "การตั้งค่าการแสดงตัวอย่าง URL",
	"enable": "เปิดใช้งานการแสดงตัวอย่าง URL",
	"allowRedirect": "อนุญาตการเปลี่ยนเส้นทางไปยังปลายทางของการแสดงตัวอย่าง",
	"allowRedirectDescription": "ตั้งค่าว่าจะติดตามลิงก์ที่เปลี่ยนเส้นทาง (redirect) เพื่อแสดงตัวอย่างหรือไม่ เมื่อมีการป้อน URL ที่มีการเปลี่ยนเส้นทาง หากปิดการใช้งาน จะช่วยประหยัดทรัพยากรของเซิร์ฟเวอร์ แต่จะไม่สามารถแสดงเนื้อหาจากปลายทางที่เปลี่ยนเส้นทางได้",
	"requireContentLength": "สร้างการแสดงตัวอย่างเฉพาะในกรณีที่รับ Content-Length ไหว",
	"requireContentLengthDescription": "หากเซิร์ฟเวอร์อื่นไม่ส่งคืน Content-Length จะไม่มีการสร้างการแสดงตัวอย่าง",
	"maximumContentLength": "ค่าสูงสุดของ Content-Length (byte)",
	"maximumContentLengthDescription": "หาก Content-Length เกินค่านี้ จะไม่มีการสร้างการแสดงตัวอย่าง",
	"timeout": "เวลาจำกัดในการโหลดตัวอย่าง URL (ms)",
	"timeoutDescription": "หากเวลาที่ใช้ในการโหลดเกินค่านี้ จะไม่มีการสร้างการแสดงตัวอย่าง",
	"userAgent": "User-Agent",
	"userAgentDescription": "ตั้งค่า User-Agent ที่ใช้ในการรับการแสดงตัวอย่าง หากเว้นว่างไว้ ระบบจะใช้ User-Agent เริ่มต้น",
	"summaryProxy": "endpoint ของพร็อกซีที่สร้างการแสดงตัวอย่าง",
	"notUsePleaseLeaveBlank": "หากไม่ได้ใช้กรุณาเว้นว่างไว้",
	"summaryProxyDescription": "สร้างการแสดงตัวอย่างด้วย summary Proxy แทนที่จะใช้เนื้อหา Misskey",
	"summaryProxyDescription2": "พารามิเตอร์ต่อไปนี้จะถูกใช้เป็นสตริงการสืบค้นเพื่อเชื่อมต่อกับพร็อกซี หากฝั่งพร็อกซีไม่รองรับการตั้งค่าเหล่านี้จะถูกละเว้น",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "สหพันธ์",
	"all": "ทั้งหมด",
	"specifyHost": "ระบุโฮสต์",
	"none": "ไม่มี",
	"behavior": "พฤติกรรม",
	"federationAllowedHosts": "เซิร์ฟเวอร์ที่อนุญาตให้เชื่อมกับสหพันธ์",
	"federationAllowedHostsDescription": "ระบุโฮสต์ของเซิร์ฟเวอร์ที่อนุญาตให้เชื่อมกับสหพันธ์ โดยแยกแต่ละรายการด้วยบรรทัดใหม่",
	"deliverSuspendedSoftware": "ซอฟต์แวร์ที่หยุดการเผยแพร่",
	"add": "เพิ่ม",
	"deliverSuspendedSoftwareDescription": "เนื่องจากเหตุผลด้านช่องโหว่ เป็นต้น สามารถหยุดการแจกจ่ายโดยระบุชื่อซอฟต์แวร์ของเซิร์ฟเวอร์และช่วงของเวอร์ชันได้ ข้อมูลเวอร์ชันนี้เป็นข้อมูลที่เซิร์ฟเวอร์ให้มา จึงไม่สามารถรับประกันความน่าเชื่อถือได้ สามารถใช้การระบุช่วงเวอร์ชันแบบ semver ได้ แต่ถ้าระบุเป็น >= 2024.3.1 จะไม่รวมเวอร์ชันแบบกำหนดเอง เช่น 2024.3.1-custom.0 จึงแนะนำให้ระบุเป็น >= 2024.3.1-0 ซึ่งเป็นการระบุแบบ prerelease",
	"softwareName": "ชื่อซอฟต์แวร์",
	"version": "เวอร์ชั่น",
	"signToActivityPubGet": "ลงนามในคำขอ GET",
	"signToActivityPubGet_description": "โดยปกติควรเปิดใช้งาน แต่หากพบปัญหาเกี่ยวกับการสื่อสารในสหพันธ์ การปิดใช้งานอาจช่วยแก้ไขได้ แต่ในบางกรณี เซิร์ฟเวอร์อาจไม่สามารถสื่อสารได้เลยหากปิดใช้งานนี้",
	"proxyRemoteFiles": "พร็อกซีไฟล์ระยะไกล",
	"proxyRemoteFiles_description": "เมื่อเปิดใช้งาน จะทำหน้าที่เป็นพร็อกซีสำหรับไฟล์จากระยะไกล ช่วยในการสร้างภาพขนาดย่อและปกป้องความเป็นส่วนตัวของผู้ใช้",
	"allowExternalApRedirect": "อนุญาตการเปลี่ยนเส้นทางการสืบค้นผ่าน ActivityPub",
	"allowExternalApRedirect_description": "เมื่อเปิดใช้งาน จะอนุญาตให้เซิร์ฟเวอร์อื่นสืบค้นเนื้อหาของบุคคลที่สามผ่านเซิร์ฟเวอร์นี้ได้ แต่มีความเสี่ยงที่อาจเกิดการปลอมแปลงเนื้อหา",
	"needToRestartServerToApply": "จำเป็นต้องรีสตาร์ทเซิร์ฟเวอร์เพื่อให้การเปลี่ยนแปลงมีผล",
	"cacheRemoteFiles": "แคชไฟล์ระยะไกล",
	"cacheRemoteFilesDescription": "หากเปิดใช้งาน ไฟล์ระยะไกลจะถูกแคชไว้ ทำให้แสดงภาพเร็วขึ้น แต่ก็ใช้พื้นที่เก็บข้อมูลของเซิร์ฟเวอร์มากขึ้นเช่นกัน สำหรับขีดจำกัดที่ผู้ใช้ระยะไกลถูกแคชไว้จะขึ้นอยู่กับความจุไดรฟ์ตามบทบาทของเขา เมื่อเกินแล้วไฟล์เก่าจะถูกลบออกและเก็บเป็นลิงก์แทน หากปิดใช้งาน ไฟล์ระยะไกลจะถูกเก็บเป็นลิงก์ตั้งแต่ต้น เราแนะนำให้ตั้งค่า proxyRemoteFiles ใน default.yml เป็น true เพื่อสร้างธัมบ์เนลและปกป้องความเป็นส่วนตัวของผู้ใช้",
	"youCanCleanRemoteFilesCache": "สามารถลบแคชทั้งหมดได้โดยใช้ปุ่ม 🗑️ ในหน้าการจัดการไฟล์",
	"cacheRemoteSensitiveFiles": "แคชไฟล์ระยะไกลที่มีเนื้อหาละเอียดอ่อน",
	"cacheRemoteSensitiveFilesDescription": "เมื่อปิดการใช้งานการตั้งค่านี้ ไฟล์ระยะไกลที่มีเนื้อหาละเอียดอ่อนจะถูกโหลดโดยตรงจากเซิร์ฟเวอร์ระยะไกลโดยไม่มีการแคช",
	"proxyAccount": "บัญชีพร็อกซี่",
	"proxyAccountDescription": "บัญชีพร็อกซี คือ บัญชีที่ทำหน้าที่ติดตาม(ผู้ใช้)ระยะไกลภายใต้เงื่อนไขบางประการ ตัวอย่างเช่น เมื่อผู้ใช้ท้องถิ่นเพิ่มผู้ใช้ระยะไกลลงรายชื่อ หากไม่มีใครติดตามผู้ใช้ระยะไกลในรายชื่อนั้น กิจกรรมก็จะไม่ถูกส่งมายังเซิร์ฟเวอร์ ดังนั้นจึงมีบัญชีพร็อกซีไว้ติดตามผู้ใช้ระยะไกลเหล่านั้น",
	"description": "แนะนำตัว",
	"youCanIncludeHashtags": "คุณสามารถใส่แฮชแท็กในส่วนแนะนำตัวของคุณได้"
}
</locale>

<locale locale="tr-TR" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Sunucu kurulum sihirbazını yeniden başlatmak ister misin?",
	"restartServerSetupWizardConfirm_text": "Bazı mevcut ayarlar sıfırlanacaktır.",
	"general": "Genel",
	"info": "Hakkında",
	"instanceName": "Sunucu adı",
	"modified": "Değiştirilmiş",
	"shortName": "Kısa ad",
	"optional": "Opsiyonel",
	"shortNameDescription": "Resmi adın uzun olması durumunda görüntülenebilen, örneğin adının kısaltması.",
	"instanceDescription": "Sunucu açıklaması",
	"maintainerName": "Bakım sorumlusu",
	"maintainerEmail": "Bakım sorumlusu E-Posta adresi",
	"tosUrl": "Hizmet Şartları URL'si",
	"privacyPolicyUrl": "Gizlilik Politikası URL'si",
	"inquiryUrl": "Sorgu URL'si",
	"inquiryUrlDescription": "Sorgu formu için sunucu yöneticisine bir URL veya iletişim bilgileri için bir web sayfası belirtin.",
	"repositoryUrl": "Depo URL'si",
	"repositoryUrlDescription": "Misskey'i olduğu gibi kullanıyorsanız (kaynak kodunda herhangi bir değişiklik yapmadan), https://github.com/misskey-dev/misskey adresini girin.",
	"repositoryUrlOrTarballRequired": "Bir depo yayınlamadıysanız, bunun yerine bir tarball sağlamalısınız. Daha fazla bilgi için .config/example.yml dosyasına bakın.",
	"impressumUrl": "Yayıncı Bilgileri URL'si",
	"impressumDescription": "Almanya gibi bazı ülkelerde, ticari web sitelerinde işletmeci iletişim bilgilerinin (Yayıncı) yer alması yasal olarak zorunludur.",
	"pinnedUsers": "Sabitlenmiş kullanıcılar",
	"pinnedUsersDescription": "“Keşfet” sekmesinde sabitlenecek kullanıcı adlarını satır sonlarıyla ayırarak liste.",
	"enableServiceworker": "Tarayıcınız için Push Bildirimlerini Etkinleştir",
	"serviceworkerInfo": "Push bildirimleri için etkinleştirilmeli.",
	"adsSettings": "Reklam ayarları",
	"notesPerOneAd": "Gerçek zamanlı güncelleme reklam yerleşim aralığı (Reklam başına notlar)",
	"setZeroToDisable": "Bu değeri 0 olarak ayarlayarak gerçek zamanlı güncelleme reklamlarını devre dışı bırakın.",
	"adsTooClose": "Mevcut reklam aralığı çok düşük olduğu için kullanıcı deneyimini önemli ölçüde kötüleştirebilir.",
	"title": "URL önizleme ayarları",
	"enable": "URL önizlemesini etkinleştir",
	"allowRedirect": "URL önizleme yönlendirmesine izin ver",
	"allowRedirectDescription": "Bir URL'de yönlendirme ayarlanmışsa, bu özelliği etkinleştirerek yönlendirmeyi takip edebilir ve yönlendirilen içeriğin önizlemesini görüntüleyebilirsin. Bu özelliği devre dışı bırakmak sunucu kaynaklarından tasarruf sağlar, ancak yönlendirilen içerik görüntülenmez.",
	"requireContentLength": "Yalnızca Content-Length değerini alabiliyorsanız önizlemeyi oluşturun.",
	"requireContentLengthDescription": "Diğer sunucu Content-Length değerini döndürmezse, önizleme oluşturulmaz.",
	"maximumContentLength": "Maksimum İçerik Uzunluğu (bayt)",
	"maximumContentLengthDescription": "Content-Length bu değerden yüksekse, önizleme oluşturulmaz.",
	"timeout": "Önizleme alırken zaman aşımı (ms)",
	"timeoutDescription": "Önizlemeyi almak bu değerden daha uzun sürerse, önizleme oluşturulmaz.",
	"userAgent": "Kullanıcı Aracısı",
	"userAgentDescription": "Önizlemeleri alırken kullanılacak Kullanıcı Aracısını ayarlar. Boş bırakılırsa, varsayılan Kullanıcı Aracısı kullanılır.",
	"summaryProxy": "Önizlemeler oluşturan proxy uç noktaları",
	"notUsePleaseLeaveBlank": "Kullanılmıyorsa boş bırakın.",
	"summaryProxyDescription": "Misskey'in kendisi değil, Summaly Proxy kullanarak önizlemeler oluştur.",
	"summaryProxyDescription2": "Aşağıdaki parametreler, sorgu dizesi olarak proxy'ye bağlanır. Proxy bunları desteklemiyorsa, değerler yok sayılır.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "Federasyon",
	"all": "Tümü",
	"specifyHost": "Belirli ana bilgisayar",
	"none": "Hiçbiri",
	"behavior": "Davranış",
	"federationAllowedHosts": "Federasyona izin verilen sunucular",
	"federationAllowedHostsDescription": "Federasyona izin vermek istediğiniz sunucuların ana bilgisayar adlarını satır sonlarıyla ayırın.",
	"deliverSuspendedSoftware": "Askıya Alınan Yazılım",
	"add": "Ekle",
	"deliverSuspendedSoftwareDescription": "Güvenlik açığı veya diğer nedenlerle sunucunun yazılımının belirli bir isim ve sürüm aralığı için teslimatı durdurabilirsiniz. Bu sürüm bilgileri sunucu tarafından sağlanır ve güvenilirliği garanti edilmez. Sürümü belirtmek için semver aralığı belirtilebilir, ancak >= 2024.3.1 belirtildiğinde 2024.3.1-custom.0 gibi özel sürümler dahil edilmez, bu nedenle >= 2024.3.1-0 gibi ön sürüm belirtimi kullanılması önerilir.",
	"softwareName": "Yazılım",
	"version": "Sürüm",
	"signToActivityPubGet": "ActivityPub GET isteklerini imzalayın",
	"signToActivityPubGet_description": "Normalde bu özellik etkinleştirilmiş olmalıdır. Bu özelliği devre dışı bırakmak federasyonla ilgili sorunları iyileştirebilir, ancak diğer yandan bazı diğer sunuculara yönelik federasyonu devre dışı bırakabilir.",
	"proxyRemoteFiles": "Proxy uzak dosyalar",
	"proxyRemoteFiles_description": "Etkinleştirildiğinde, sunucu uzak dosyaları proxy olarak kullanır ve sunar. Bu, resim küçük resimleri oluşturmak ve kullanıcı gizliliğini korumak için kullanışlıdır.",
	"allowExternalApRedirect": "ActivityPub aracılığıyla yapılan sorgular için yönlendirmelere izin ver",
	"allowExternalApRedirect_description": "Etkinleştirildiğinde, diğer sunucular bu sunucu aracılığıyla üçüncü taraf içeriğini sorgulayabilir, ancak bu durum içerik sahteciliğine yol açabilir.",
	"needToRestartServerToApply": "Değişikliğin yansıtılması için Misskey'in yeniden başlatılması gerekir.",
	"cacheRemoteFiles": "Uzak dosyalar ön belleğe alınsın",
	"cacheRemoteFilesDescription": "Bu ayar açık olduğunda diğer sitelerin dosyaları doğrudan uzak sunucudan yüklenece. Bu ayarı kapatmak depolama kullanımını azaltacak ama küçük resimler oluşturulmadığından trafiği arttıracak.",
	"youCanCleanRemoteFilesCache": "Dosya yönetimi görünümünde 🗑️ düğmesine tıklayarak önbelleği temizleyebilirsin.",
	"cacheRemoteSensitiveFiles": "Hassas uzak dosyalar ön belleğe alınsın",
	"cacheRemoteSensitiveFilesDescription": "Bu ayar kapalı olduğunda hassas uzak dosyalar ön belleğe alınmadan doğrudan uzak sunucudan yüklenecek.",
	"proxyAccount": "Proxy hesabı",
	"proxyAccountDescription": "Proxy hesabı, belirli koşullar altında kullanıcılar için uzaktan takipçi görevi gören bir hesap. Örneğin, bir kullanıcı listeye uzaktan bir kullanıcı eklediğinde, o kullanıcıyı takip eden yerel kullanıcı yoksa uzaktan kullanıcının etkinliği örneğe iletilmez, bunun yerine proxy hesabı takip eder.",
	"description": "Biyografi",
	"youCanIncludeHashtags": "Biyografinize hashtag'ler de ekleyebilirsiniz."
}
</locale>

<locale locale="ug-CN" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Restart server setup wizard?",
	"restartServerSetupWizardConfirm_text": "Some current settings will be reset.",
	"general": "General",
	"info": "About",
	"instanceName": "Instance name",
	"modified": "Modified",
	"shortName": "Short name",
	"optional": "Optional",
	"shortNameDescription": "A shorthand for the instance's name that can be displayed if the full official name is long.",
	"instanceDescription": "Instance description",
	"maintainerName": "Maintainer",
	"maintainerEmail": "Maintainer email",
	"tosUrl": "Terms of Service URL",
	"privacyPolicyUrl": "Privacy Policy URL",
	"inquiryUrl": "Inquiry URL",
	"inquiryUrlDescription": "Specify a URL for the inquiry form to the server maintainer or a web page for the contact information.",
	"repositoryUrl": "Repository URL",
	"repositoryUrlDescription": "If you are using Misskey as is (without any changes to the source code), enter https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "If you have not published a repository, you must provide a tarball instead. See .config/example.yml for more information.",
	"impressumUrl": "Impressum URL",
	"impressumDescription": "In some countries, like germany, the inclusion of operator contact information (an Impressum) is legally required for commercial websites.",
	"pinnedUsers": "Pinned users",
	"pinnedUsersDescription": "List usernames separated by line breaks to be pinned in the \"Explore\" tab.",
	"enableServiceworker": "Enable Push-Notifications for your Browser",
	"serviceworkerInfo": "Must be enabled for push notifications.",
	"adsSettings": "Ad settings",
	"notesPerOneAd": "Real-time update ad placement interval (Notes per ad)",
	"setZeroToDisable": "Set this value to 0 to disable real-time update ads",
	"adsTooClose": "The current ad interval may significantly worsen the user experience due to being too low.",
	"title": "URL preview settings",
	"enable": "Enable URL preview",
	"allowRedirect": "Allow URL preview redirection",
	"allowRedirectDescription": "If a URL has a redirection set, you can enable this feature to follow the redirection and display a preview of the redirected content. Disabling this will save server resources, but redirected content will not be displayed.",
	"requireContentLength": "Generate the preview only if you could get Content-Length",
	"requireContentLengthDescription": "If other server doesn't return Content-Length, the preview won't be generated.",
	"maximumContentLength": "Maximum Content-Length (bytes)",
	"maximumContentLengthDescription": "If Content-Length is higher than this value, the preview won't be generated.",
	"timeout": "Time out when getting preview (ms)",
	"timeoutDescription": "If it takes longer than this value to get the preview, the preview won’t be generated.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Sets the User-Agent to be used when retrieving previews. If left blank, the default User-Agent will be used.",
	"summaryProxy": "Proxy endpoints that generate previews",
	"notUsePleaseLeaveBlank": "Leave blank if not used",
	"summaryProxyDescription": "Not Misskey itself, but generate previews using Summaly Proxy.",
	"summaryProxyDescription2": "The following parameters are linked to the proxy as a query string. If the proxy does not support them, the values are ignored.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "Federation",
	"all": "All",
	"specifyHost": "Specific host",
	"none": "None",
	"behavior": "Behavior",
	"federationAllowedHosts": "Federation allowed servers",
	"federationAllowedHostsDescription": "Specify the hostnames of the servers you want to allow federation separated by line breaks.",
	"deliverSuspendedSoftware": "Suspended Software",
	"add": "Add",
	"deliverSuspendedSoftwareDescription": "You can specify a range of names and versions of the server's software to stop delivery for vulnerability or other reasons. This version information is provided by the server and is not guaranteed to be reliable. A semver range specification can be used to specify the version, but specifying >= 2024.3.1 will not include custom versions such as 2024.3.1-custom.0, so it is recommended that a prerelease specification be used, such as >= 2024.3.1-0",
	"softwareName": "Software",
	"version": "Version",
	"signToActivityPubGet": "Sign ActivityPub GET requests",
	"signToActivityPubGet_description": "Normally, this should be enabled. Disabling it may improve issues related to federation, but on the other hand it could disable federation towards some other servers.",
	"proxyRemoteFiles": "Proxy remote files",
	"proxyRemoteFiles_description": "When enabled, the server will proxy and serve remote files. This is useful for generating image thumbnails and protecting user privacy.",
	"allowExternalApRedirect": "Allow redirects for queries via ActivityPub",
	"allowExternalApRedirect_description": "If enabled, other servers can query third-party content through this server but this may result in content spoofing.",
	"needToRestartServerToApply": "A Misskey restart is required to reflect the change.",
	"cacheRemoteFiles": "Cache remote files",
	"cacheRemoteFilesDescription": "When this setting is disabled, remote files are loaded directly from the remote servers. Disabling this will decrease storage usage, but increase traffic, as thumbnails will not be generated.",
	"youCanCleanRemoteFilesCache": "You can clear the cache by clicking the 🗑️ button in the file management view.",
	"cacheRemoteSensitiveFiles": "Cache sensitive remote files",
	"cacheRemoteSensitiveFilesDescription": "When this setting is disabled, sensitive remote files are loaded directly from the remote instance without caching.",
	"proxyAccount": "Proxy account",
	"proxyAccountDescription": "A proxy account is an account that acts as a remote follower for users under certain conditions. For example, when a user adds a remote user to the list, the remote user's activity will not be delivered to the instance if no local user is following that user, so the proxy account will follow instead.",
	"description": "Bio",
	"youCanIncludeHashtags": "You can also include hashtags in your bio."
}
</locale>

<locale locale="uk-UA" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Restart server setup wizard?",
	"restartServerSetupWizardConfirm_text": "Some current settings will be reset.",
	"general": "Загальне",
	"info": "Інформація",
	"instanceName": "Назва інстансу",
	"modified": "Змінено",
	"shortName": "Коротке ім'я",
	"optional": "Необов'язково",
	"shortNameDescription": "Скорочення для ім'я інстанції, яке може бути показано, якщо повне ім'я задовге.",
	"instanceDescription": "Описання інстансу",
	"maintainerName": "Ім'я адміністратора",
	"maintainerEmail": "Email адміністратора",
	"tosUrl": "URL умов використання",
	"privacyPolicyUrl": "URL політики конфіденційності",
	"inquiryUrl": "Inquiry URL",
	"inquiryUrlDescription": "Specify a URL for the inquiry form to the server maintainer or a web page for the contact information.",
	"repositoryUrl": "URL репозиторію",
	"repositoryUrlDescription": "Якщо ви використовуєте Misskey без змін у вихідному коді, введіть https://github.com/misskey-dev/misskey",
	"repositoryUrlOrTarballRequired": "Якщо ви не опублікували репозиторій, натомість потрібно надати tarball-архів. Докладніше див. у .config/example.yml.",
	"impressumUrl": "Посилання власника",
	"impressumDescription": "У деяких країнах, наприклад у Німеччині, для комерційних сайтів юридично обов’язково вказувати контактну інформацію оператора сайту — вихідні дані.",
	"pinnedUsers": "Закріплені користувачі",
	"pinnedUsersDescription": "Впишіть в список користувачів, яких хочете закріпити на сторінці \"Знайти\", ім'я в стовпчик.",
	"enableServiceworker": "Увімкнути ServiceWorker",
	"serviceworkerInfo": "Повинен бути ввімкнений для push-сповіщень.",
	"adsSettings": "Ad settings",
	"notesPerOneAd": "Real-time update ad placement interval (Notes per ad)",
	"setZeroToDisable": "Set this value to 0 to disable real-time update ads",
	"adsTooClose": "The current ad interval may significantly worsen the user experience due to being too low.",
	"title": "URL preview settings",
	"enable": "Enable URL preview",
	"allowRedirect": "Allow URL preview redirection",
	"allowRedirectDescription": "If a URL has a redirection set, you can enable this feature to follow the redirection and display a preview of the redirected content. Disabling this will save server resources, but redirected content will not be displayed.",
	"requireContentLength": "Generate the preview only if you could get Content-Length",
	"requireContentLengthDescription": "If other server doesn't return Content-Length, the preview won't be generated.",
	"maximumContentLength": "Maximum Content-Length (bytes)",
	"maximumContentLengthDescription": "If Content-Length is higher than this value, the preview won't be generated.",
	"timeout": "Time out when getting preview (ms)",
	"timeoutDescription": "If it takes longer than this value to get the preview, the preview won’t be generated.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Sets the User-Agent to be used when retrieving previews. If left blank, the default User-Agent will be used.",
	"summaryProxy": "Proxy endpoints that generate previews",
	"notUsePleaseLeaveBlank": "Залиште порожнім, якщо не використовується",
	"summaryProxyDescription": "Not Misskey itself, but generate previews using Summaly Proxy.",
	"summaryProxyDescription2": "The following parameters are linked to the proxy as a query string. If the proxy does not support them, the values are ignored.",
	"urlPreviewSensitiveList": "Посилання для обмеження показу мініатюр",
	"urlPreviewSensitiveListDescription": "Використовуйте пробіл щоб зазначити умову AND, та перенесення на наступний ряд щоб зазначити умову OR. Закрийте текст використовуючи символ \"/\" для використання регулярних виразів. Якщо збіг знайдено, мініатюру буде сховано.",
	"federation": "Федіверс",
	"all": "Всі",
	"specifyHost": "Вказати хост",
	"none": "Відсутній",
	"behavior": "Поведінка",
	"federationAllowedHosts": "Сервери, що підтримують федерацію",
	"federationAllowedHostsDescription": "Вкажіть імена хостів серверів, з якими потрібно дозволити федерацію, кожне з нового рядка.",
	"deliverSuspendedSoftware": "Suspended Software",
	"add": "Додати",
	"deliverSuspendedSoftwareDescription": "You can specify a range of names and versions of the server's software to stop delivery for vulnerability or other reasons. This version information is provided by the server and is not guaranteed to be reliable. A semver range specification can be used to specify the version, but specifying >= 2024.3.1 will not include custom versions such as 2024.3.1-custom.0, so it is recommended that a prerelease specification be used, such as >= 2024.3.1-0",
	"softwareName": "Програмне забезпечення",
	"version": "Версія",
	"signToActivityPubGet": "Sign ActivityPub GET requests",
	"signToActivityPubGet_description": "Normally, this should be enabled. Disabling it may improve issues related to federation, but on the other hand it could disable federation towards some other servers.",
	"proxyRemoteFiles": "Proxy remote files",
	"proxyRemoteFiles_description": "When enabled, the server will proxy and serve remote files. This is useful for generating image thumbnails and protecting user privacy.",
	"allowExternalApRedirect": "Allow redirects for queries via ActivityPub",
	"allowExternalApRedirect_description": "If enabled, other servers can query third-party content through this server but this may result in content spoofing.",
	"needToRestartServerToApply": "Щоб застосувати зміну, потрібно перезапустити Misskey.",
	"cacheRemoteFiles": "Кешувати дані з інших інстансів",
	"cacheRemoteFilesDescription": "Якщо кешування вимкнено, віддалені файли завантажуються безпосередньо з віддаленого інстансу. Це зменшує використання сховища, але збільшує трафік, оскільки не генеруются ескізи.",
	"youCanCleanRemoteFilesCache": "Ви можете очистити кеш, натиснувши кнопку 🗑️ у вікні керування файлами.",
	"cacheRemoteSensitiveFiles": "Кешувати чутливі віддалені файли",
	"cacheRemoteSensitiveFilesDescription": "Ви можете очистити кеш, натиснувши кнопку 🗑️ у вікні керування файлами.",
	"proxyAccount": "Проксі-акаунт",
	"proxyAccountDescription": "Обліковий запис проксі – це обліковий запис, який діє як віддалений підписник для користувачів за певних умов. Наприклад, коли користувач додає віддаленого користувача до списку, активність віддаленого користувача не буде доставлена на сервер, якщо жоден локальний користувач не стежить за цим користувачем, то замість нього буде використовуватися обліковий запис проксі-сервера.",
	"description": "Про себе",
	"youCanIncludeHashtags": "Ви також можете включити хештеги у свій опис."
}
</locale>

<locale locale="vi-VN" lang="json">
{
	"restartServerSetupWizardConfirm_title": "Restart server setup wizard?",
	"restartServerSetupWizardConfirm_text": "Some current settings will be reset.",
	"general": "Tổng quan",
	"info": "Giới thiệu",
	"instanceName": "Tên máy chủ",
	"modified": "Modified",
	"shortName": "Short name",
	"optional": "Không bắt buộc",
	"shortNameDescription": "A shorthand for the instance's name that can be displayed if the full official name is long.",
	"instanceDescription": "Mô tả máy chủ",
	"maintainerName": "Đội ngũ vận hành",
	"maintainerEmail": "Email đội ngũ",
	"tosUrl": "URL Điều khoản dịch vụ",
	"privacyPolicyUrl": "URL Chính sách bảo mật",
	"inquiryUrl": "Inquiry URL",
	"inquiryUrlDescription": "Specify a URL for the inquiry form to the server maintainer or a web page for the contact information.",
	"repositoryUrl": "Repository URL",
	"repositoryUrlDescription": "Nếu bạn có kho lưu trữ mã nguồn có thể truy cập công khai, hãy nhập URL. Nếu bạn đang sử dụng Misskey theo mặc định (không thực hiện bất kỳ thay đổi nào đối với mã nguồn), hãy nhập https://github.com/misskey-dev/misskey.",
	"repositoryUrlOrTarballRequired": "If you have not published a repository, you must provide a tarball instead. See .config/example.yml for more information.",
	"impressumUrl": "URL thông tin nhà điều hành",
	"impressumDescription": "In some countries, like germany, the inclusion of operator contact information (an Impressum) is legally required for commercial websites.",
	"pinnedUsers": "Những người thú vị",
	"pinnedUsersDescription": "Liệt kê mỗi hàng một tên người dùng xuống dòng để ghim trên tab \"Khám phá\".",
	"enableServiceworker": "Bật ServiceWorker",
	"serviceworkerInfo": "Phải được bật cho thông báo đẩy.",
	"adsSettings": "Ad settings",
	"notesPerOneAd": "Real-time update ad placement interval (Notes per ad)",
	"setZeroToDisable": "Set this value to 0 to disable real-time update ads",
	"adsTooClose": "The current ad interval may significantly worsen the user experience due to being too low.",
	"title": "URL preview settings",
	"enable": "Enable URL preview",
	"allowRedirect": "Allow URL preview redirection",
	"allowRedirectDescription": "If a URL has a redirection set, you can enable this feature to follow the redirection and display a preview of the redirected content. Disabling this will save server resources, but redirected content will not be displayed.",
	"requireContentLength": "Generate the preview only if you could get Content-Length",
	"requireContentLengthDescription": "If other server doesn't return Content-Length, the preview won't be generated.",
	"maximumContentLength": "Maximum Content-Length (bytes)",
	"maximumContentLengthDescription": "If Content-Length is higher than this value, the preview won't be generated.",
	"timeout": "Time out when getting preview (ms)",
	"timeoutDescription": "If it takes longer than this value to get the preview, the preview won’t be generated.",
	"userAgent": "User-Agent",
	"userAgentDescription": "Sets the User-Agent to be used when retrieving previews. If left blank, the default User-Agent will be used.",
	"summaryProxy": "Proxy endpoints that generate previews",
	"notUsePleaseLeaveBlank": "Leave blank if not used",
	"summaryProxyDescription": "Not Misskey itself, but generate previews using Summaly Proxy.",
	"summaryProxyDescription2": "The following parameters are linked to the proxy as a query string. If the proxy does not support them, the values are ignored.",
	"urlPreviewSensitiveList": "URL to restrict thumbnail display",
	"urlPreviewSensitiveListDescription": "Use spaces to specify AND conditions, and line breaks to specify OR conditions. Enclose text in slashes to use regular expressions. If a match is found, the thumbnail will be hidden.",
	"federation": "Liên hợp",
	"all": "Tất cả",
	"specifyHost": "Specific host",
	"none": "Không",
	"behavior": "Thao tác",
	"federationAllowedHosts": "Các máy chủ được phép liên kết",
	"federationAllowedHostsDescription": "Điền tên các máy chủ mà bạn muốn cho phép liên kết, cách nhau bởi dấu xuống dòng",
	"deliverSuspendedSoftware": "Suspended Software",
	"add": "Thêm",
	"deliverSuspendedSoftwareDescription": "You can specify a range of names and versions of the server's software to stop delivery for vulnerability or other reasons. This version information is provided by the server and is not guaranteed to be reliable. A semver range specification can be used to specify the version, but specifying >= 2024.3.1 will not include custom versions such as 2024.3.1-custom.0, so it is recommended that a prerelease specification be used, such as >= 2024.3.1-0",
	"softwareName": "Tên phần mềm",
	"version": "Phiên bản",
	"signToActivityPubGet": "Sign ActivityPub GET requests",
	"signToActivityPubGet_description": "Normally, this should be enabled. Disabling it may improve issues related to federation, but on the other hand it could disable federation towards some other servers.",
	"proxyRemoteFiles": "Proxy remote files",
	"proxyRemoteFiles_description": "When enabled, the server will proxy and serve remote files. This is useful for generating image thumbnails and protecting user privacy.",
	"allowExternalApRedirect": "Allow redirects for queries via ActivityPub",
	"allowExternalApRedirect_description": "If enabled, other servers can query third-party content through this server but this may result in content spoofing.",
	"needToRestartServerToApply": "A Misskey restart is required to reflect the change.",
	"cacheRemoteFiles": "Tập tin cache từ xa",
	"cacheRemoteFilesDescription": "Khi tùy chọn này bị tắt, các tập tin từ xa sẽ được tải trực tiếp từ máy chủ khác. Điều này sẽ giúp giảm dung lượng lưu trữ nhưng lại tăng lưu lượng truy cập, vì hình thu nhỏ sẽ không được tạo.",
	"youCanCleanRemoteFilesCache": "Bạn có thể xoá bộ nhớ đệm bằng cách nhấn vào nút🗑️ở trong phần quản lý tệp.",
	"cacheRemoteSensitiveFiles": "Lưu các tập tin nhạy cảm vào bộ nhớ tạm từ xa",
	"cacheRemoteSensitiveFilesDescription": "Khi bạn tắt tính năng này, các tệp nhạy cảm sẽ được tải trực tiếp từ máy chủ và không được lưu vào bộ nhớ tạm",
	"proxyAccount": "Tài khoản proxy",
	"proxyAccountDescription": "Tài khoản proxy là tài khoản hoạt động như một người theo dõi từ xa cho người dùng trong những điều kiện nhất định. Ví dụ: khi người dùng thêm người dùng từ xa vào danh sách, hoạt động của người dùng từ xa sẽ không được chuyển đến phiên bản nếu không có người dùng cục bộ nào theo dõi người dùng đó, vì vậy tài khoản proxy sẽ theo dõi.",
	"description": "Tiểu sử",
	"youCanIncludeHashtags": "Bạn có thể dùng hashtag trong tiểu sử."
}
</locale>

<locale locale="zh-CN" lang="json">
{
	"restartServerSetupWizardConfirm_title": "要重新开始服务器初始设定向导吗？",
	"restartServerSetupWizardConfirm_text": "当前的部分设置将被重置。",
	"general": "常规设置",
	"info": "关于",
	"instanceName": "服务器名称",
	"modified": "有变更",
	"shortName": "简称",
	"optional": "可选",
	"shortNameDescription": "如果服务器的正式名称很长，可以用简称或者別名来替代。",
	"instanceDescription": "服务器简介",
	"maintainerName": "管理员名称",
	"maintainerEmail": "管理员电子邮箱",
	"tosUrl": "服务条款地址",
	"privacyPolicyUrl": "隐私政策地址",
	"inquiryUrl": "联络地址",
	"inquiryUrlDescription": "用来指定诸如向服务运营商咨询的论坛地址，或记载了运营商联系方式之类的网页地址。",
	"repositoryUrl": "仓库地址",
	"repositoryUrlDescription": "若源代码所在的仓库是公开的，请填入对应的 URL。若并未追加或者修改 Misskey 的代码，请填入 https://github.com/misskey-dev/misskey。",
	"repositoryUrlOrTarballRequired": "若仓库并未公开，则需要提供 tarball 作为替代。详情请看 .config/example.yml。",
	"impressumUrl": "运营商信息地址",
	"impressumDescription": "德国等国家和地区有义务展示此类信息（Impressum）。",
	"pinnedUsers": "置顶用户",
	"pinnedUsersDescription": "在 “发现” 页面中使用换行标记要置顶的用户。",
	"enableServiceworker": "启用 ServiceWorker",
	"serviceworkerInfo": "您需要启用推送通知",
	"adsSettings": "广告设置",
	"notesPerOneAd": "实时更新时插入广告的间隔（每条帖文）",
	"setZeroToDisable": "设为 0 将不在实时更新时间线中投放广告",
	"adsTooClose": "广告投放时间间隔过短将可能显著损害用户体验。",
	"title": "设置 URL 预览",
	"enable": "启用 URL 预览",
	"allowRedirect": "允许预览目标的重定向",
	"allowRedirectDescription": "如果输入的 URL 被重定向，可设置是否跟随重定向目标并显示预览。禁用此选项将节省服务器资源，但重定向目标的内容将不会显示。",
	"requireContentLength": "仅在能取得 Content-Length 时生成预览",
	"requireContentLengthDescription": "如果目标服务器不返回 Content-Length，则不生成预览。",
	"maximumContentLength": "Content-Length 的最大值（byte）",
	"maximumContentLengthDescription": "如果 Content-Length 超过这个值，则不生成预览。",
	"timeout": "超时阈值（ms）",
	"timeoutDescription": "如果获取预览所用时间超过这个值，则不生成预览。",
	"userAgent": "User-Agent",
	"userAgentDescription": "设定获取预览时使用的 User-Agent。留空时将使用默认的 User-Agent。",
	"summaryProxy": "用来生成预览的代理的 endpoint。",
	"notUsePleaseLeaveBlank": "如不使用请留空",
	"summaryProxyDescription": "不使用 Misskey 本体，而是通过 Summaly Proxy 生成预览。",
	"summaryProxyDescription2": "下面的参数将作为查询字符串发送至代理。代理侧如果不支持此设置，则忽略设定值。",
	"urlPreviewSensitiveList": "限制显示缩略图的 URL",
	"urlPreviewSensitiveListDescription": "AND 条件用空格分隔，OR 条件用换行符分隔，正则表达式用斜线包裹。成功匹配则不再显示缩略图。",
	"federation": "联邦",
	"all": "全部",
	"specifyHost": "指定主机名",
	"none": "无",
	"behavior": "行为",
	"federationAllowedHosts": "允许联邦交互的服务器",
	"federationAllowedHostsDescription": "设定允许联邦通信的服务器，以换行分隔。",
	"deliverSuspendedSoftware": "停止投递的软件",
	"add": "添加",
	"deliverSuspendedSoftwareDescription": "可因安全漏洞之类的原因，停止向指定的服务器及服务器版本送信。版本信息由服务器提供，不保证可靠性。可使用 semver 范围来指定版本，但指定 >= 2024.3.1 将不包括如 2024.3.1-custom.0 等自定义版本，因此建议像 >= 2024.3.1-0 这样指定 prerelease 版本。",
	"softwareName": "软件名",
	"version": "版本",
	"signToActivityPubGet": "对 GET 请求签名",
	"signToActivityPubGet_description": "通常情况下请保持启用。若遇到联邦通信方面的问题，将其关闭可能会有所改善，但另一方面有可能会造成无法通信。",
	"proxyRemoteFiles": "代理远程文件",
	"proxyRemoteFiles_description": "如果启用，远程服务器的文件将由代理提供。可有效保护图像预览缩略图的生成与用户隐私。",
	"allowExternalApRedirect": "允许通过 ActivityPub 重定向查询",
	"allowExternalApRedirect_description": "启用时，将允许其它服务器通过此服务器查询第三方内容，但有可能导致内容欺骗。",
	"needToRestartServerToApply": "需要重启服务才能应用更改。",
	"cacheRemoteFiles": "缓存远程文件",
	"cacheRemoteFilesDescription": "启用此设定时，将在此服务器上缓存远程文件。虽然可以加快图片显示的速度，但是相对的会消耗大量的服务器存储空间。用户角色内的网盘容量决定了这个远程用户能在服务器上保留多少缓存。当超出了这个限制时，旧的文件将从缓存中被删除，成为链接。当禁用此设定时，则是从一开始就将远程文件保留为链接。此时推荐将  的 proxyRemoteFiles 设置为 true 以优化缩略图生成及保护用户隐私。",
	"youCanCleanRemoteFilesCache": "可以使用文件管理的🗑️按钮来删除所有的缓存。",
	"cacheRemoteSensitiveFiles": "缓存远程敏感媒体文件",
	"cacheRemoteSensitiveFilesDescription": "如果禁用这项设定，远程服务器的敏感媒体将不会被缓存，而是直接链接。",
	"proxyAccount": "代理账户",
	"proxyAccountDescription": "代理账户是在某些情况下替代用户进行远程关注用的账户。 例如说，当用户将一位远程用户放入一个列表中时，如果本地服务器上没有任何人关注这位远程用户，则这位远程用户的账户活动将不会被送到本地服务器上。作为替代，此时将使用代理账户进行关注。",
	"description": "个人简介",
	"youCanIncludeHashtags": "可以在个人简介中包含 #标签。"
}
</locale>

<locale locale="zh-TW" lang="json">
{
	"restartServerSetupWizardConfirm_title": "要重新執行伺服器的初始設定精靈嗎？",
	"restartServerSetupWizardConfirm_text": "當前的部分設定將會被重設。",
	"general": "一般",
	"info": "資訊",
	"instanceName": "伺服器名稱",
	"modified": "已變更",
	"shortName": "簡稱",
	"optional": "可選",
	"shortNameDescription": "如果伺服器的正式名稱很長，可用簡稱或通稱代替。",
	"instanceDescription": "伺服器介紹",
	"maintainerName": "管理員名稱",
	"maintainerEmail": "管理員信箱",
	"tosUrl": "服務條款 URL",
	"privacyPolicyUrl": "隱私政策 URL",
	"inquiryUrl": "聯絡表單網址",
	"inquiryUrlDescription": "指定伺服器運營者的聯絡表單網址，或包含運營者聯絡資訊網頁的網址。",
	"repositoryUrl": "儲存庫 URL",
	"repositoryUrlDescription": "如果存在可公開取得原始碼的儲存庫，請輸入其 URL。 如果您按原樣使用 Misskey（不對原始碼進行任何更改），請輸入 https://github.com/misskey-dev/misskey。",
	"repositoryUrlOrTarballRequired": "如果儲存庫不是公開的，則必須提供 tarball。 詳細資訊請參閱 .config/example.yml。",
	"impressumUrl": "營運者資訊 URL",
	"impressumDescription": "在德國與部份地區必須要明確顯示營運者資訊。",
	"pinnedUsers": "置頂使用者",
	"pinnedUsersDescription": "在「探索」頁面中使用換行標記想要置頂的使用者。",
	"enableServiceworker": "啟用瀏覽器的推播通知",
	"serviceworkerInfo": "如要使用推播通知，需要啟用此選項並設定金鑰。",
	"adsSettings": "廣告投放設定",
	"notesPerOneAd": "即時更新中投放廣告的間隔（貼文數）",
	"setZeroToDisable": "設為 0 則在即時更新時不投放廣告",
	"adsTooClose": "由於廣告投放的間隔極短，可能會嚴重影響使用者體驗。",
	"title": "URL 預覽設定",
	"enable": "啟用 URL 預覽",
	"allowRedirect": "允許預覽目標的重新導向",
	"allowRedirectDescription": "設定當輸入的 URL 發生重新導向時，是否追蹤該重新導向並顯示預覽。若停用此功能，雖可節省伺服器資源，但將無法顯示重新導向後的內容。\n",
	"requireContentLength": "僅在能夠取得 Content-Length 時，才產生預覽。",
	"requireContentLengthDescription": "若對方的伺服器未回傳 Content -Length，則不會產生預覽。",
	"maximumContentLength": "Content-Length 的最大値 (byte)",
	"maximumContentLengthDescription": "若 Content-Length 超過這個值，則不會產生預覽。",
	"timeout": "取得預覽的逾時時間 (ms)",
	"timeoutDescription": "若取得預覽所需的時間超過這個值，則不會產生預覽。",
	"userAgent": "User-Agent",
	"userAgentDescription": "設定獲取預覽時使用的 User-Agent 。如果留空，將使用預設的 User-Agent 。",
	"summaryProxy": "產生預覽的代理端點",
	"notUsePleaseLeaveBlank": "如果不使用的話請留白",
	"summaryProxyDescription": "使用摘要代理程式而不是 Misskey 本身產生預覽。",
	"summaryProxyDescription2": "以下參數會作為查詢字串連結到代理。如果代理端不支援，這些設定將被忽略。",
	"urlPreviewSensitiveList": "限制縮圖顯示的 URL",
	"urlPreviewSensitiveListDescription": "以空格指定為 AND，以換行指定為 OR。若以斜線（/）包圍則視為正規表達式。符合條件時，將不再顯示縮圖。",
	"federation": "站台聯邦",
	"all": "全部",
	"specifyHost": "指定主機",
	"none": "無",
	"behavior": "行為",
	"federationAllowedHosts": "允許聯邦通訊的伺服器",
	"federationAllowedHostsDescription": "設定允許聯邦通訊的伺服器主機，以換行符號分隔。",
	"deliverSuspendedSoftware": "已停止發佈的軟體",
	"add": "新增",
	"deliverSuspendedSoftwareDescription": "由於脆弱性等原因，可以指定伺服器軟體的名稱與版本範圍來停止其發佈。這些版本資訊是由伺服器所提供，其可靠性無法保證。版本的指定可以使用 semver（語意化版本控制） 的範圍語法，但如果指定為 >= 2024.3.1，則像 2024.3.1-custom.0 這樣的自訂版本將不會被包含在內，因此建議使用 >= 2024.3.1-0 的方式來同時包含預發佈版本。",
	"softwareName": "軟體名稱",
	"version": "版本",
	"signToActivityPubGet": "簽署 GET 請求",
	"signToActivityPubGet_description": "通常應該啟用此功能。停用可能會改善聯邦通訊的問題，但反過來也可能會使某些伺服器無法通訊。",
	"proxyRemoteFiles": "代理提供遠端檔案",
	"proxyRemoteFiles_description": "啟用時，它會代理並提供遠端檔案。 這有助於產生影像縮圖和保護使用者隱私。",
	"allowExternalApRedirect": "允許透過 ActivityPub 查詢時進行重新導向",
	"allowExternalApRedirect_description": "啟用後，其他伺服器可以透過此伺服器查詢第三方的內容，但也可能導致內容遭到冒充的風險。",
	"needToRestartServerToApply": "必須重新啟動伺服器才會使變更生效。",
	"cacheRemoteFiles": "快取遠端檔案",
	"cacheRemoteFilesDescription": "啟用這個設定後，遠端檔案會被快取到這台伺服器的儲存空間中。這樣能加快圖片的顯示速度，但會多占用伺服器的儲存容量。遠端使用者能保留多少快取，取決於其角色所設定的硬碟容量上限。若超過這個上限，系統會從最舊的檔案開始刪除快取並改成連結。若停用這個設定，遠端檔案一開始就只會以連結的形式保留。",
	"youCanCleanRemoteFilesCache": "按檔案管理的🗑️按鈕，可將快取全部刪除。",
	"cacheRemoteSensitiveFiles": "快取遠端的敏感檔案",
	"cacheRemoteSensitiveFilesDescription": "若停用這個設定，則不會快取遠端的敏感檔案，而是直接連結。",
	"proxyAccount": "代理帳戶",
	"proxyAccountDescription": "代理帳戶是在特定條件下充當遠端追隨者的帳戶。例如，當使用者新增遠端使用者至其列表時，若沒有本地使用者追隨該遠端使用者，則其活動將不會傳送至伺服器，此時便會由代理帳戶代為追隨以解決問題。",
	"description": "關於我",
	"youCanIncludeHashtags": "你也可以在「關於我」中加上 #tag"
}
</locale>
