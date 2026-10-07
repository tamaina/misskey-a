<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/preferences" :label="$locale.sfc.preferences" :keywords="['general', 'preferences']" icon="ti ti-adjustments">
	<div class="_gaps_m">
		<MkFeatureBanner icon="/fluent-emoji/2699.png" color="#00ff9d">
			<SearchText>{{ $locale.sfc.settingsPreferencesBanner }}</SearchText>
		</MkFeatureBanner>

		<div class="_gaps_s">
			<SearchMarker v-slot="slotProps" :keywords="['general']">
				<MkFolder :defaultOpen="slotProps.isParentOfTarget">
					<template #label><SearchLabel>{{ $locale.sfc.general }}</SearchLabel></template>
					<template #icon><SearchIcon><i class="ti ti-settings"></i></SearchIcon></template>

					<div class="_gaps_m">
						<SearchMarker :keywords="['language']">
							<MkSelect v-model="lang" :items="langs.map(x => ({ label: x[1], value: x[0] }))">
								<template #label><SearchLabel>{{ $locale.sfc.uiLanguage }}</SearchLabel></template>
								<template #caption>
									<I18n :src="$locale.sfc.i18nInfo" tag="span">
										<template #link>
											<MkLink url="https://crowdin.com/project/misskey">Crowdin</MkLink>
										</template>
									</I18n>
								</template>
							</MkSelect>
						</SearchMarker>

						<SearchMarker :keywords="['device', 'type', 'kind', 'smartphone', 'tablet', 'desktop']">
							<MkRadios
								v-model="overridedDeviceKind"
								:options="[
									{ value: null, label: $locale.sfc.auto },
									{ value: 'smartphone', label: $locale.sfc.smartphone, icon: 'ti ti-device-mobile' },
									{ value: 'tablet', label: $locale.sfc.tablet, icon: 'ti ti-device-tablet' },
									{ value: 'desktop', label: $locale.sfc.desktop, icon: 'ti ti-device-desktop' },
								]"
							>
								<template #label><SearchLabel>{{ $locale.sfc.overridedDeviceKind }}</SearchLabel></template>
							</MkRadios>
						</SearchMarker>

						<SearchMarker :keywords="['realtimemode']">
							<MkSwitch v-model="realtimeMode">
								<template #label><i class="ti ti-bolt"></i> <SearchLabel>{{ $locale.sfc.realtimeMode }}</SearchLabel></template>
								<template #caption><SearchText>{{ $locale.sfc.settingsRealtimeMode_description }}</SearchText></template>
							</MkSwitch>
						</SearchMarker>

						<MkDisableSection :disabled="realtimeMode">
							<SearchMarker :keywords="['polling', 'interval']">
								<MkPreferenceContainer k="pollingInterval">
									<MkRange v-model="pollingInterval" :min="1" :max="3" :step="1" easing :showTicks="true" :textConverter="(v) => v === 1 ? $locale.sfc.low : v === 2 ? $locale.sfc.middle : v === 3 ? $locale.sfc.high : ''">
										<template #label><SearchLabel>{{ $locale.sfc.settingsContentsUpdateFrequency }}</SearchLabel></template>
										<template #caption><SearchText>{{ $locale.sfc.settingsContentsUpdateFrequency_description }}</SearchText><br><SearchText>{{ $locale.sfc.settingsContentsUpdateFrequency_description2 }}</SearchText></template>
										<template #prefix><i class="ti ti-player-play"></i></template>
										<template #suffix><i class="ti ti-player-track-next"></i></template>
									</MkRange>
								</MkPreferenceContainer>
							</SearchMarker>
						</MkDisableSection>

						<div class="_gaps_s">
							<SearchMarker :keywords="['titlebar', 'show']">
								<MkPreferenceContainer k="showTitlebar">
									<MkSwitch v-model="showTitlebar">
										<template #label><SearchLabel>{{ $locale.sfc.showTitlebar }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['avatar', 'icon', 'decoration', 'show']">
								<MkPreferenceContainer k="showAvatarDecorations">
									<MkSwitch v-model="showAvatarDecorations">
										<template #label><SearchLabel>{{ $locale.sfc.showAvatarDecorations }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['follow', 'confirm', 'always']">
								<MkPreferenceContainer k="alwaysConfirmFollow">
									<MkSwitch v-model="alwaysConfirmFollow">
										<template #label><SearchLabel>{{ $locale.sfc.alwaysConfirmFollow }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['highlight', 'sensitive', 'nsfw', 'image', 'photo', 'picture', 'media', 'thumbnail']">
								<MkPreferenceContainer k="highlightSensitiveMedia">
									<MkSwitch v-model="highlightSensitiveMedia">
										<template #label><SearchLabel>{{ $locale.sfc.highlightSensitiveMedia }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['sensitive', 'nsfw', 'media', 'image', 'photo', 'picture', 'attachment', 'confirm']">
								<MkPreferenceContainer k="confirmWhenRevealingSensitiveMedia">
									<MkSwitch v-model="confirmWhenRevealingSensitiveMedia">
										<template #label><SearchLabel>{{ $locale.sfc.confirmWhenRevealingSensitiveMedia }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['mfm', 'enable', 'show', 'advanced']">
								<MkPreferenceContainer k="advancedMfm">
									<MkSwitch v-model="advancedMfm">
										<template #label><SearchLabel>{{ $locale.sfc.enableAdvancedMfm }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['auto', 'load', 'auto', 'more', 'scroll']">
								<MkPreferenceContainer k="enableInfiniteScroll">
									<MkSwitch v-model="enableInfiniteScroll">
										<template #label><SearchLabel>{{ $locale.sfc.enableInfiniteScroll }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>
						</div>

						<SearchMarker :keywords="['emoji', 'style', 'native', 'system', 'fluent', 'twemoji']">
							<MkPreferenceContainer k="emojiStyle">
								<div>
									<MkRadios
										v-model="emojiStyle"
										:options="[
											{ value: 'native', label: $locale.sfc.native },
											{ value: 'fluentEmoji', label: 'Fluent Emoji' },
											{ value: 'twemoji', label: 'Twemoji' },
										]"
									>
										<template #label><SearchLabel>{{ $locale.sfc.emojiStyle }}</SearchLabel></template>
									</MkRadios>
									<div style="margin: 8px 0 0 0; font-size: 1.5em;"><Mfm :key="emojiStyle" text="🍮🍦🍭🍩🍰🍫🍬🥞🍪"/></div>
								</div>
							</MkPreferenceContainer>
						</SearchMarker>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker v-slot="slotProps" :keywords="['timeline', 'note']">
				<MkFolder :defaultOpen="slotProps.isParentOfTarget">
					<template #label><SearchLabel>{{ $locale.sfc.settingsTimelineAndNote }}</SearchLabel></template>
					<template #icon><SearchIcon><i class="ti ti-notes"></i></SearchIcon></template>

					<div class="_gaps_m">
						<div class="_gaps_s">
							<SearchMarker :keywords="['post', 'form', 'timeline']">
								<MkPreferenceContainer k="showFixedPostForm">
									<MkSwitch v-model="showFixedPostForm">
										<template #label><SearchLabel>{{ $locale.sfc.showFixedPostForm }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['post', 'form', 'timeline', 'channel']">
								<MkPreferenceContainer k="showFixedPostFormInChannel">
									<MkSwitch v-model="showFixedPostFormInChannel">
										<template #label><SearchLabel>{{ $locale.sfc.showFixedPostFormInChannel }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['renote']">
								<MkPreferenceContainer k="collapseRenotes">
									<MkSwitch v-model="collapseRenotes">
										<template #label><SearchLabel>{{ $locale.sfc.collapseRenotes }}</SearchLabel></template>
										<template #caption><SearchText>{{ $locale.sfc.collapseRenotesDescription }}</SearchText></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['pinned', 'list']">
								<MkFolder>
									<template #label><SearchLabel>{{ $locale.sfc.pinnedList }}</SearchLabel></template>
									<!-- 複数ピン止め管理できるようにしたいけどめんどいので一旦ひとつのみ -->
									<MkButton v-if="prefer.r.pinnedUserLists.value.length === 0" @click="setPinnedList()">{{ $locale.sfc.add }}</MkButton>
									<MkButton v-else danger @click="removePinnedList()"><i class="ti ti-trash"></i> {{ $locale.sfc.remove }}</MkButton>
								</MkFolder>
							</SearchMarker>
						</div>

						<hr>

						<div class="_gaps_m">
							<div class="_gaps_s">
								<SearchMarker :keywords="['hover', 'show', 'footer', 'action']">
									<MkPreferenceContainer k="showNoteActionsOnlyHover">
										<MkSwitch v-model="showNoteActionsOnlyHover">
											<template #label><SearchLabel>{{ $locale.sfc.showNoteActionsOnlyHover }}</SearchLabel></template>
										</MkSwitch>
									</MkPreferenceContainer>
								</SearchMarker>

								<SearchMarker :keywords="['footer', 'action', 'clip', 'show']">
									<MkPreferenceContainer k="showClipButtonInNoteFooter">
										<MkSwitch v-model="showClipButtonInNoteFooter">
											<template #label><SearchLabel>{{ $locale.sfc.showClipButtonInNoteFooter }}</SearchLabel></template>
										</MkSwitch>
									</MkPreferenceContainer>
								</SearchMarker>

								<SearchMarker :keywords="['reaction', 'count', 'show']">
									<MkPreferenceContainer k="showReactionsCount">
										<MkSwitch v-model="showReactionsCount">
											<template #label><SearchLabel>{{ $locale.sfc.showReactionsCount }}</SearchLabel></template>
										</MkSwitch>
									</MkPreferenceContainer>
								</SearchMarker>

								<SearchMarker :keywords="['reaction', 'confirm']">
									<MkPreferenceContainer k="confirmOnReact">
										<MkSwitch v-model="confirmOnReact">
											<template #label><SearchLabel>{{ $locale.sfc.confirmOnReact }}</SearchLabel></template>
										</MkSwitch>
									</MkPreferenceContainer>
								</SearchMarker>

								<SearchMarker :keywords="['image', 'photo', 'picture', 'media', 'thumbnail', 'quality', 'raw', 'attachment']">
									<MkPreferenceContainer k="loadRawImages">
										<MkSwitch v-model="loadRawImages">
											<template #label><SearchLabel>{{ $locale.sfc.loadRawImages }}</SearchLabel></template>
										</MkSwitch>
									</MkPreferenceContainer>
								</SearchMarker>

								<SearchMarker :keywords="['reaction', 'picker', 'contextmenu', 'open']">
									<MkPreferenceContainer k="useReactionPickerForContextMenu">
										<MkSwitch v-model="useReactionPickerForContextMenu">
											<template #label><SearchLabel>{{ $locale.sfc.useReactionPickerForContextMenu }}</SearchLabel></template>
										</MkSwitch>
									</MkPreferenceContainer>
								</SearchMarker>

								<SearchMarker :keywords="['reaction', 'order']">
									<MkPreferenceContainer k="showAvailableReactionsFirstInNote">
										<MkSwitch v-model="showAvailableReactionsFirstInNote">
											<template #label><SearchLabel>{{ $locale.sfc.settingsShowAvailableReactionsFirstInNote }}</SearchLabel></template>
										</MkSwitch>
									</MkPreferenceContainer>
								</SearchMarker>
							</div>

							<SearchMarker :keywords="['reaction', 'size', 'scale', 'display']">
								<MkPreferenceContainer k="reactionsDisplaySize">
									<MkRadios
										v-model="reactionsDisplaySize"
										:options="[
											{ value: 'small', label: $locale.sfc.small },
											{ value: 'medium', label: $locale.sfc.medium },
											{ value: 'large', label: $locale.sfc.large },
										]"
									>
										<template #label><SearchLabel>{{ $locale.sfc.reactionsDisplaySize }}</SearchLabel></template>
									</MkRadios>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['reaction', 'size', 'scale', 'display', 'width', 'limit']">
								<MkPreferenceContainer k="limitWidthOfReaction">
									<MkSwitch v-model="limitWidthOfReaction">
										<template #label><SearchLabel>{{ $locale.sfc.limitWidthOfReaction }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['attachment', 'image', 'photo', 'picture', 'media', 'thumbnail', 'list', 'size', 'height']">
								<MkPreferenceContainer k="mediaListWithOneImageAppearance">
									<MkRadios
										v-model="mediaListWithOneImageAppearance"
										:options="[
											{ value: 'expand', label: $locale.sfc.default },
											{ value: '16_9', label: interpolateLocaleParameters($locale.sfc.limitTo, { x: '16:9' }) },
											{ value: '1_1', label: interpolateLocaleParameters($locale.sfc.limitTo, { x: '1:1' }) },
											{ value: '2_3', label: interpolateLocaleParameters($locale.sfc.limitTo, { x: '2:3' }) },
										]"
									>
										<template #label><SearchLabel>{{ $locale.sfc.mediaListWithOneImageAppearance }}</SearchLabel></template>
									</MkRadios>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['attachment', 'image', 'photo', 'picture', 'media', 'thumbnail', 'grid', 'wide', 'area']">
								<MkPreferenceContainer k="showMediaListByGridInWideArea">
									<MkSwitch v-model="showMediaListByGridInWideArea">
										<template #label><SearchLabel>{{ $locale.sfc.showMediaListByGridInWideArea }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<template v-if="instance.federation !== 'none'">
								<SearchMarker :keywords="['ticker', 'information', 'label', 'instance', 'server', 'host', 'federation']">
									<MkPreferenceContainer k="instanceTicker">
										<MkSelect
											v-model="instanceTicker"
											:items="[
												{ label: $locale.sfc.instanceTickerNone, value: 'none' },
												{ label: $locale.sfc.instanceTickerRemote, value: 'remote' },
												{ label: $locale.sfc.instanceTickerAlways, value: 'always' },
											]"
										>
											<template #label><SearchLabel>{{ $locale.sfc.instanceTicker }}</SearchLabel></template>
										</MkSelect>
									</MkPreferenceContainer>
								</SearchMarker>
							</template>

							<SearchMarker :keywords="['attachment', 'image', 'photo', 'picture', 'media', 'thumbnail', 'nsfw', 'sensitive', 'display', 'show', 'hide', 'visibility']">
								<MkPreferenceContainer k="nsfw">
									<MkSelect
										v-model="nsfw"
										:items="[
											{ label: $locale.sfc.displayOfSensitiveMediaRespect, value: 'respect' },
											{ label: $locale.sfc.displayOfSensitiveMediaIgnore, value: 'ignore' },
											{ label: $locale.sfc.displayOfSensitiveMediaForce, value: 'force' },
										]"
									>
										<template #label><SearchLabel>{{ $locale.sfc.displayOfSensitiveMedia }}</SearchLabel></template>
									</MkSelect>
								</MkPreferenceContainer>
							</SearchMarker>
						</div>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker v-slot="slotProps" :keywords="['post', 'form']">
				<MkFolder :defaultOpen="slotProps.isParentOfTarget">
					<template #label><SearchLabel>{{ $locale.sfc.postForm }}</SearchLabel></template>
					<template #icon><SearchIcon><i class="ti ti-edit"></i></SearchIcon></template>

					<div class="_gaps_m">
						<div class="_gaps_s">
							<SearchMarker :keywords="['remember', 'keep', 'note', 'cw']">
								<MkPreferenceContainer k="keepCw">
									<MkSwitch v-model="keepCw">
										<template #label><SearchLabel>{{ $locale.sfc.keepCw }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['remember', 'keep', 'note', 'visibility']">
								<MkPreferenceContainer k="rememberNoteVisibility">
									<MkSwitch v-model="rememberNoteVisibility">
										<template #label><SearchLabel>{{ $locale.sfc.rememberNoteVisibility }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['mfm', 'enable', 'show', 'advanced', 'picker', 'form', 'function', 'fn']">
								<MkPreferenceContainer k="enableQuickAddMfmFunction">
									<MkSwitch v-model="enableQuickAddMfmFunction">
										<template #label><SearchLabel>{{ $locale.sfc.enableQuickAddMfmFunction }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>
						</div>

						<SearchMarker :keywords="['default', 'note', 'visibility']">
							<MkDisableSection :disabled="rememberNoteVisibility">
								<MkFolder>
									<template #label><SearchLabel>{{ $locale.sfc.defaultNoteVisibility }}</SearchLabel></template>
									<template v-if="defaultNoteVisibility === 'public'" #suffix>{{ $locale.sfc.visibilityPublic }}</template>
									<template v-else-if="defaultNoteVisibility === 'home'" #suffix>{{ $locale.sfc.visibilityHome }}</template>
									<template v-else-if="defaultNoteVisibility === 'followers'" #suffix>{{ $locale.sfc.visibilityFollowers }}</template>
									<template v-else-if="defaultNoteVisibility === 'specified'" #suffix>{{ $locale.sfc.visibilitySpecified }}</template>

									<div class="_gaps_m">
										<MkPreferenceContainer k="defaultNoteVisibility">
											<MkSelect
												v-model="defaultNoteVisibility"
												:items="[
													{ label: $locale.sfc.visibilityPublic, value: 'public' },
													{ label: $locale.sfc.visibilityHome, value: 'home' },
													{ label: $locale.sfc.visibilityFollowers, value: 'followers' },
													{ label: $locale.sfc.visibilitySpecified, value: 'specified' },
												]"
											>
											</MkSelect>
										</MkPreferenceContainer>

										<MkPreferenceContainer k="defaultNoteLocalOnly">
											<MkSwitch v-model="defaultNoteLocalOnly">{{ $locale.sfc.visibilityDisableFederation }}</MkSwitch>
										</MkPreferenceContainer>
									</div>
								</MkFolder>
							</MkDisableSection>
						</SearchMarker>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker v-slot="slotProps" :keywords="['notification']">
				<MkFolder :defaultOpen="slotProps.isParentOfTarget">
					<template #label><SearchLabel>{{ $locale.sfc.notifications }}</SearchLabel></template>
					<template #icon><SearchIcon><i class="ti ti-bell"></i></SearchIcon></template>

					<div class="_gaps_m">
						<SearchMarker :keywords="['group']">
							<MkPreferenceContainer k="useGroupedNotifications">
								<MkSwitch v-model="useGroupedNotifications">
									<template #label><SearchLabel>{{ $locale.sfc.useGroupedNotifications }}</SearchLabel></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['position']">
							<MkPreferenceContainer k="notificationPosition">
								<MkRadios
									v-model="notificationPosition"
									:options="[
										{ value: 'leftTop', label: $locale.sfc.leftTop, icon: 'ti ti-align-box-left-top' },
										{ value: 'rightTop', label: $locale.sfc.rightTop, icon: 'ti ti-align-box-right-top' },
										{ value: 'leftBottom', label: $locale.sfc.leftBottom, icon: 'ti ti-align-box-left-bottom' },
										{ value: 'rightBottom', label: $locale.sfc.rightBottom, icon: 'ti ti-align-box-right-bottom' },
									]"
								>
									<template #label><SearchLabel>{{ $locale.sfc.position }}</SearchLabel></template>
								</MkRadios>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['stack', 'axis', 'direction']">
							<MkPreferenceContainer k="notificationStackAxis">
								<MkRadios
									v-model="notificationStackAxis"
									:options="[
										{ value: 'vertical', label: $locale.sfc.vertical, icon: 'ti ti-carousel-vertical' },
										{ value: 'horizontal', label: $locale.sfc.horizontal, icon: 'ti ti-carousel-horizontal' },
									]"
								>
									<template #label><SearchLabel>{{ $locale.sfc.stackAxis }}</SearchLabel></template>
								</MkRadios>
							</MkPreferenceContainer>
						</SearchMarker>

						<MkButton @click="testNotification">{{ $locale.sfc.notificationCheckNotificationBehavior }}</MkButton>
					</div>
				</MkFolder>
			</SearchMarker>

			<template v-if="$i.policies.chatAvailability !== 'unavailable'">
				<SearchMarker v-slot="slotProps" :keywords="['chat', 'messaging']">
					<MkFolder :defaultOpen="slotProps.isParentOfTarget">
						<template #label><SearchLabel>{{ $locale.sfc.directMessage }}</SearchLabel></template>
						<template #icon><SearchIcon><i class="ti ti-messages"></i></SearchIcon></template>

						<div class="_gaps_s">
							<SearchMarker :keywords="['show', 'sender', 'name']">
								<MkPreferenceContainer k="chat.showSenderName">
									<MkSwitch v-model="chatShowSenderName">
										<template #label><SearchLabel>{{ $locale.sfc.settingsChatShowSenderName }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['send', 'enter', 'newline']">
								<MkPreferenceContainer k="chat.sendOnEnter">
									<MkSwitch v-model="chatSendOnEnter">
										<template #label><SearchLabel>{{ $locale.sfc.settingsChatSendOnEnter }}</SearchLabel></template>
										<template #caption>
											<div class="_gaps_s">
												<div>
													<b>{{ $locale.sfc.settingsIfOn }}:</b>
													<div>{{ $locale.sfc.chatSend }}: Enter</div>
													<div>{{ $locale.sfc.chatNewline }}: Shift + Enter</div>
												</div>
												<div>
													<b>{{ $locale.sfc.settingsIfOff }}:</b>
													<div>{{ $locale.sfc.chatSend }}: Ctrl + Enter</div>
													<div>{{ $locale.sfc.chatNewline }}: Enter</div>
												</div>
											</div>
										</template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>
						</div>
					</MkFolder>
				</SearchMarker>
			</template>

			<SearchMarker v-slot="slotProps" :keywords="['accessibility']">
				<MkFolder :defaultOpen="slotProps.isParentOfTarget">
					<template #label><SearchLabel>{{ $locale.sfc.accessibility }}</SearchLabel></template>
					<template #icon><SearchIcon><i class="ti ti-accessible"></i></SearchIcon></template>

					<div class="_gaps_m">
						<MkFeatureBanner icon="/fluent-emoji/1f6b9.png" color="#0011ff">
							<SearchText>{{ $locale.sfc.settingsAccessibilityBanner }}</SearchText>
						</MkFeatureBanner>

						<div class="_gaps_s">
							<SearchMarker :keywords="['animation', 'motion', 'reduce']">
								<MkPreferenceContainer k="animation">
									<MkSwitch v-model="reduceAnimation">
										<template #label><SearchLabel>{{ $locale.sfc.reduceUiAnimation }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['disable', 'animation', 'image', 'photo', 'picture', 'media', 'thumbnail', 'gif']">
								<MkPreferenceContainer k="disableShowingAnimatedImages">
									<MkSwitch v-model="disableShowingAnimatedImages">
										<template #label><SearchLabel>{{ $locale.sfc.disableShowingAnimatedImages }}</SearchLabel></template>
										<template #caption>{{ $locale.sfc.disableShowingAnimatedImages_caption }}</template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['mfm', 'enable', 'show', 'animated']">
								<MkPreferenceContainer k="animatedMfm">
									<MkSwitch v-model="animatedMfm">
										<template #label><SearchLabel>{{ $locale.sfc.enableAnimatedMfm }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['tabs', 'tabbar', 'bottom', 'under']">
								<MkPreferenceContainer k="showPageTabBarBottom">
									<MkSwitch v-model="showPageTabBarBottom">
										<template #label><SearchLabel>{{ $locale.sfc.settingsShowPageTabBarBottom }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['swipe', 'horizontal', 'tab']">
								<MkPreferenceContainer k="enableHorizontalSwipe">
									<MkSwitch v-model="enableHorizontalSwipe">
										<template #label><SearchLabel>{{ $locale.sfc.enableHorizontalSwipe }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['swipe', 'pull', 'refresh']">
								<MkPreferenceContainer k="enablePullToRefresh">
									<MkSwitch v-model="enablePullToRefresh">
										<template #label><SearchLabel>{{ $locale.sfc.settingsEnablePullToRefresh }}</SearchLabel></template>
										<template #caption><SearchText>{{ $locale.sfc.settingsEnablePullToRefresh_description }}</SearchText></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['keep', 'screen', 'display', 'on']">
								<MkPreferenceContainer k="keepScreenOn">
									<MkSwitch v-model="keepScreenOn">
										<template #label><SearchLabel>{{ $locale.sfc.keepScreenOn }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['native', 'system', 'video', 'audio', 'player', 'media']">
								<MkPreferenceContainer k="useNativeUiForVideoAudioPlayer">
									<MkSwitch v-model="useNativeUiForVideoAudioPlayer">
										<template #label><SearchLabel>{{ $locale.sfc.useNativeUIForVideoAudioPlayer }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['text', 'selectable']">
								<MkPreferenceContainer k="makeEveryTextElementsSelectable">
									<MkSwitch v-model="makeEveryTextElementsSelectable">
										<template #label><SearchLabel>{{ $locale.sfc.settingsMakeEveryTextElementsSelectable }}</SearchLabel></template>
										<template #caption>{{ $locale.sfc.settingsMakeEveryTextElementsSelectable_description }}</template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>
						</div>

						<SearchMarker :keywords="['menu', 'style', 'popup', 'drawer']">
							<MkPreferenceContainer k="menuStyle">
								<MkSelect
									v-model="menuStyle"
									:items="[
										{ label: $locale.sfc.auto, value: 'auto' },
										{ label: $locale.sfc.popup, value: 'popup' },
										{ label: $locale.sfc.drawer, value: 'drawer' },
									]"
								>
									<template #label><SearchLabel>{{ $locale.sfc.menuStyle }}</SearchLabel></template>
								</MkSelect>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['contextmenu', 'system', 'native']">
							<MkPreferenceContainer k="contextMenu">
								<MkSelect
									v-model="contextMenu"
									:items="[
										{ label: $locale.sfc.contextMenuApp, value: 'app' },
										{ label: $locale.sfc.contextMenuAppWithShift, value: 'appWithShift' },
										{ label: $locale.sfc.contextMenuNative, value: 'native' },
									]"
								>
									<template #label><SearchLabel>{{ $locale.sfc.contextMenuTitle }}</SearchLabel></template>
								</MkSelect>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['font', 'size']">
							<MkRadios
								v-model="fontSize"
								:options="[
									{ value: null, label: 'Aa', labelStyle: 'font-size: 14px;' },
									{ value: '1', label: 'Aa', labelStyle: 'font-size: 15px;' },
									{ value: '2', label: 'Aa', labelStyle: 'font-size: 16px;' },
									{ value: '3', label: 'Aa', labelStyle: 'font-size: 17px;' },
								]"
							>
								<template #label><SearchLabel>{{ $locale.sfc.fontSize }}</SearchLabel></template>
							</MkRadios>
						</SearchMarker>

						<SearchMarker :keywords="['font', 'system', 'native']">
							<MkSwitch v-model="useSystemFont">
								<template #label><SearchLabel>{{ $locale.sfc.useSystemFont }}</SearchLabel></template>
							</MkSwitch>
						</SearchMarker>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker v-slot="slotProps" :keywords="['performance']">
				<MkFolder :defaultOpen="slotProps.isParentOfTarget">
					<template #label><SearchLabel>{{ $locale.sfc.performance }}</SearchLabel></template>
					<template #icon><SearchIcon><i class="ti ti-battery-vertical-eco"></i></SearchIcon></template>

					<div class="_gaps_s">
						<SearchMarker :keywords="['animation', 'motion', 'reduce']">
							<MkPreferenceContainer k="animation">
								<MkSwitch :modelValue="!reduceAnimation" @update:modelValue="v => reduceAnimation = !v">
									<template #label><SearchLabel>{{ $locale.sfc.settingsUiAnimations }}</SearchLabel></template>
									<template #caption><SearchText>{{ $locale.sfc.turnOffToImprovePerformance }}</SearchText></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['animation', 'image', 'photo', 'picture', 'media', 'thumbnail', 'gif']">
							<MkPreferenceContainer k="disableShowingAnimatedImages">
								<MkSwitch :modelValue="!disableShowingAnimatedImages" @update:modelValue="v => disableShowingAnimatedImages = !v">
									<template #label><SearchLabel>{{ $locale.sfc.settingsEnableAnimatedImages }}</SearchLabel></template>
									<template #caption>
										<SearchText>{{ $locale.sfc.turnOffToImprovePerformance }}</SearchText>
										<div>{{ $locale.sfc.disableShowingAnimatedImages_caption }}</div>
									</template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['blur']">
							<MkPreferenceContainer k="useBlurEffect">
								<MkSwitch v-model="useBlurEffect">
									<template #label><SearchLabel>{{ $locale.sfc.useBlurEffect }}</SearchLabel></template>
									<template #caption><SearchText>{{ $locale.sfc.turnOffToImprovePerformance }}</SearchText></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['blur', 'modal']">
							<MkPreferenceContainer k="useBlurEffectForModal">
								<MkSwitch v-model="useBlurEffectForModal">
									<template #label><SearchLabel>{{ $locale.sfc.useBlurEffectForModal }}</SearchLabel></template>
									<template #caption><SearchText>{{ $locale.sfc.turnOffToImprovePerformance }}</SearchText></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['blurhash', 'image', 'photo', 'picture', 'thumbnail', 'placeholder']">
							<MkPreferenceContainer k="enableHighQualityImagePlaceholders">
								<MkSwitch v-model="enableHighQualityImagePlaceholders">
									<template #label><SearchLabel>{{ $locale.sfc.settingsEnableHighQualityImagePlaceholders }}</SearchLabel></template>
									<template #caption><SearchText>{{ $locale.sfc.turnOffToImprovePerformance }}</SearchText></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['sticky']">
							<MkPreferenceContainer k="useStickyIcons">
								<MkSwitch v-model="useStickyIcons">
									<template #label><SearchLabel>{{ $locale.sfc.settingsUseStickyIcons }}</SearchLabel></template>
									<template #caption><SearchText>{{ $locale.sfc.turnOffToImprovePerformance }}</SearchText></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<MkInfo>
							<div class="_gaps_s">
								<div>{{ $locale.sfc.clientPerformanceIssueTipTitle }}:</div>
								<div>
									<div><b>{{ $locale.sfc.clientPerformanceIssueTipMakeSureDisabledAdBlocker }}</b></div>
									<div>{{ $locale.sfc.clientPerformanceIssueTipMakeSureDisabledAdBlocker_description }}</div>
								</div>
								<div>
									<div><b>{{ $locale.sfc.clientPerformanceIssueTipMakeSureDisabledCustomCss }}</b></div>
									<div>{{ $locale.sfc.clientPerformanceIssueTipMakeSureDisabledCustomCss_description }}</div>
								</div>
								<div>
									<div><b>{{ $locale.sfc.clientPerformanceIssueTipMakeSureDisabledAddons }}</b></div>
									<div>{{ $locale.sfc.clientPerformanceIssueTipMakeSureDisabledAddons_description }}</div>
								</div>
							</div>
						</MkInfo>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker v-slot="slotProps" :keywords="['datasaver']">
				<MkFolder :defaultOpen="slotProps.isParentOfTarget">
					<template #label><SearchLabel>{{ $locale.sfc.dataSaver }}</SearchLabel></template>
					<template #icon><SearchIcon><i class="ti ti-antenna-bars-3"></i></SearchIcon></template>

					<div class="_gaps_m">
						<MkInfo>{{ $locale.sfc.reloadRequiredToApplySettings }}</MkInfo>

						<div class="_buttons">
							<MkButton inline @click="enableAllDataSaver">{{ $locale.sfc.enableAll }}</MkButton>
							<MkButton inline @click="disableAllDataSaver">{{ $locale.sfc.disableAll }}</MkButton>
						</div>
						<div class="_gaps_m">
							<MkSwitch v-model="dataSaver.media">
								{{ $locale.sfc.dataSaverMediaTitle }}
								<template #caption>{{ $locale.sfc.dataSaverMediaDescription }}</template>
							</MkSwitch>
							<MkSwitch v-model="dataSaver.avatar">
								{{ $locale.sfc.dataSaverAvatarTitle }}
								<template #caption>{{ $locale.sfc.dataSaverAvatarDescription }}</template>
							</MkSwitch>
							<MkSwitch v-model="dataSaver.disableUrlPreview" :disabled="!instance.enableUrlPreview">
								{{ $locale.sfc.dataSaverDisableUrlPreviewTitle }}
								<template #caption>{{ $locale.sfc.dataSaverDisableUrlPreviewDescription }}</template>
							</MkSwitch>
							<MkSwitch v-model="dataSaver.urlPreviewThumbnail" :disabled="!instance.enableUrlPreview || dataSaver.disableUrlPreview">
								{{ $locale.sfc.dataSaverUrlPreviewThumbnailTitle }}
								<template #caption>{{ $locale.sfc.dataSaverUrlPreviewThumbnailDescription }}</template>
							</MkSwitch>
							<MkSwitch v-model="dataSaver.code">
								{{ $locale.sfc.dataSaverCodeTitle }}
								<template #caption>{{ $locale.sfc.dataSaverCodeDescription }}</template>
							</MkSwitch>
						</div>
					</div>
				</MkFolder>
			</SearchMarker>

			<SearchMarker v-slot="slotProps" :keywords="['other']">
				<MkFolder :defaultOpen="slotProps.isParentOfTarget">
					<template #label><SearchLabel>{{ $locale.sfc.other }}</SearchLabel></template>
					<template #icon><SearchIcon><i class="ti ti-settings-cog"></i></SearchIcon></template>

					<div class="_gaps_m">
						<div class="_gaps_s">
							<SearchMarker :keywords="['avatar', 'icon', 'square']">
								<MkPreferenceContainer k="squareAvatars">
									<MkSwitch v-model="squareAvatars">
										<template #label><SearchLabel>{{ $locale.sfc.squareAvatars }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['effect', 'show']">
								<MkPreferenceContainer k="enableSeasonalScreenEffect">
									<MkSwitch v-model="enableSeasonalScreenEffect">
										<template #label><SearchLabel>{{ $locale.sfc.seasonalScreenEffect }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['image', 'photo', 'picture', 'media', 'thumbnail', 'new', 'tab']">
								<MkPreferenceContainer k="imageNewTab">
									<MkSwitch v-model="imageNewTab">
										<template #label><SearchLabel>{{ $locale.sfc.openImageInNewTab }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>

							<SearchMarker :keywords="['follow', 'replies']">
								<MkPreferenceContainer k="defaultFollowWithReplies">
									<MkSwitch v-model="defaultFollowWithReplies">
										<template #label><SearchLabel>{{ $locale.sfc.withRepliesByDefaultForNewlyFollowed }}</SearchLabel></template>
									</MkSwitch>
								</MkPreferenceContainer>
							</SearchMarker>
						</div>

						<SearchMarker :keywords="['server', 'disconnect', 'reconnect', 'reload', 'streaming']">
							<MkPreferenceContainer k="serverDisconnectedBehavior">
								<MkSelect
									v-model="serverDisconnectedBehavior"
									:items="[
										{ label: $locale.sfc.serverDisconnectedBehaviorReload, value: 'reload' },
										{ label: $locale.sfc.serverDisconnectedBehaviorDialog, value: 'dialog' },
										{ label: $locale.sfc.serverDisconnectedBehaviorQuiet, value: 'quiet' },
									]"
								>
									<template #label><SearchLabel>{{ $locale.sfc.whenServerDisconnected }}</SearchLabel></template>
								</MkSelect>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['cache', 'page']">
							<MkPreferenceContainer k="numberOfPageCache">
								<MkRange v-model="numberOfPageCache" :min="1" :max="10" :step="1" easing>
									<template #label><SearchLabel>{{ $locale.sfc.numberOfPageCache }}</SearchLabel></template>
									<template #caption>{{ $locale.sfc.numberOfPageCacheDescription }}</template>
								</MkRange>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['ad', 'show']">
							<MkPreferenceContainer k="forceShowAds">
								<MkSwitch v-model="forceShowAds">
									<template #label><SearchLabel>{{ $locale.sfc.forceShowAds }}</SearchLabel></template>
								</MkSwitch>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker>
							<MkPreferenceContainer k="hemisphere">
								<MkRadios
									v-model="hemisphere"
									:options="[
										{ value: 'N', label: $locale.sfc.hemisphereN },
										{ value: 'S', label: $locale.sfc.hemisphereS },
									]"
								>
									<template #label><SearchLabel>{{ $locale.sfc.hemisphere }}</SearchLabel></template>
									<template #caption>{{ $locale.sfc.hemisphereCaption }}</template>
								</MkRadios>
							</MkPreferenceContainer>
						</SearchMarker>

						<SearchMarker :keywords="['emoji', 'dictionary', 'additional', 'extra']">
							<MkFolder>
								<template #label><SearchLabel>{{ $locale.sfc.additionalEmojiDictionary }}</SearchLabel></template>
								<div class="_buttons">
									<template v-for="lang in emojiIndexLangs" :key="lang">
										<MkButton v-if="store.r.additionalUnicodeEmojiIndexes.value[lang]" danger @click="removeEmojiIndex(lang)"><i class="ti ti-trash"></i> {{ $locale.sfc.remove }} ({{ getEmojiIndexLangName(lang) }})</MkButton>
										<MkButton v-else @click="downloadEmojiIndex(lang)"><i class="ti ti-download"></i> {{ getEmojiIndexLangName(lang) }}{{ store.r.additionalUnicodeEmojiIndexes.value[lang] ? ` (${ $locale.sfc.installed })` : '' }}</MkButton>
									</template>
								</div>
							</MkFolder>
						</SearchMarker>
					</div>
				</MkFolder>
			</SearchMarker>
		</div>

		<hr>

		<div class="_gaps_s">
			<FormLink to="/settings/navbar"><template #icon><i class="ti ti-list"></i></template>{{ $locale.sfc.navbar }}</FormLink>
			<FormLink to="/settings/statusbar"><template #icon><i class="ti ti-list"></i></template>{{ $locale.sfc.statusbar }}</FormLink>
			<FormLink to="/settings/deck"><template #icon><i class="ti ti-columns"></i></template>{{ $locale.sfc.deck }}</FormLink>
			<FormLink to="/settings/custom-css"><template #icon><i class="ti ti-code"></i></template>{{ $locale.sfc.customCss }}</FormLink>
		</div>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { langs } from '@features/boot/frontend/shared/config.js';
import * as Misskey from 'misskey-js';
import MkSwitch from '@features/ui/frontend/components/MkSwitch.vue';
import MkSelect from '@features/ui/frontend/components/MkSelect.vue';
import MkRadios from '@features/ui/frontend/components/MkRadios.vue';
import MkRange from '@features/ui/frontend/components/MkRange.vue';
import MkFolder from '@features/ui/frontend/components/MkFolder.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkDisableSection from '@features/ui/frontend/components/MkDisableSection.vue';
import FormLink from '@features/ui/frontend/components/form/link.vue';
import MkLink from '@features/navigation/frontend/components/MkLink.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { store } from '@features/preferences/frontend/store.js';
import * as os from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { miLocalStorage } from '@features/preferences/frontend/local-storage.js';
import { prefer } from '@features/preferences/frontend/preferences.js';
import MkPreferenceContainer from '@features/preferences/frontend/components/MkPreferenceContainer.vue';
import MkFeatureBanner from '@features/web/frontend/components/MkFeatureBanner.vue';
import { globalEvents } from '@features/runtime/frontend/events.js';
import { claimAchievement } from '@features/users/frontend/utility/achievements.js';
import { instance } from '@features/instance/frontend/instance.js';
import { ensureSignin } from '@features/auth/frontend/i.js';
import { genId } from '@features/runtime/frontend/utility/id.js';
import { suggestReload } from '@features/boot/frontend/utility/reload-suggest.js';

const $i = ensureSignin();

const lang = ref(miLocalStorage.getItem('lang'));
const dataSaver = ref(prefer.s.dataSaver);
const realtimeMode = store.model('realtimeMode');

const overridedDeviceKind = prefer.model('overridedDeviceKind');
const pollingInterval = prefer.model('pollingInterval');
const showTitlebar = prefer.model('showTitlebar');
const keepCw = prefer.model('keepCw');
const serverDisconnectedBehavior = prefer.model('serverDisconnectedBehavior');
const hemisphere = prefer.model('hemisphere');
const showNoteActionsOnlyHover = prefer.model('showNoteActionsOnlyHover');
const showClipButtonInNoteFooter = prefer.model('showClipButtonInNoteFooter');
const collapseRenotes = prefer.model('collapseRenotes');
const advancedMfm = prefer.model('advancedMfm');
const showReactionsCount = prefer.model('showReactionsCount');
const enableQuickAddMfmFunction = prefer.model('enableQuickAddMfmFunction');
const forceShowAds = prefer.model('forceShowAds');
const loadRawImages = prefer.model('loadRawImages');
const imageNewTab = prefer.model('imageNewTab');
const showFixedPostForm = prefer.model('showFixedPostForm');
const showFixedPostFormInChannel = prefer.model('showFixedPostFormInChannel');
const numberOfPageCache = prefer.model('numberOfPageCache');
const enableInfiniteScroll = prefer.model('enableInfiniteScroll');
const useReactionPickerForContextMenu = prefer.model('useReactionPickerForContextMenu');
const showAvailableReactionsFirstInNote = prefer.model('showAvailableReactionsFirstInNote');
const useGroupedNotifications = prefer.model('useGroupedNotifications');
const alwaysConfirmFollow = prefer.model('alwaysConfirmFollow');
const confirmWhenRevealingSensitiveMedia = prefer.model('confirmWhenRevealingSensitiveMedia');
const confirmOnReact = prefer.model('confirmOnReact');
const defaultNoteVisibility = prefer.model('defaultNoteVisibility');
const defaultNoteLocalOnly = prefer.model('defaultNoteLocalOnly');
const rememberNoteVisibility = prefer.model('rememberNoteVisibility');
const notificationPosition = prefer.model('notificationPosition');
const notificationStackAxis = prefer.model('notificationStackAxis');
const instanceTicker = prefer.model('instanceTicker');
const highlightSensitiveMedia = prefer.model('highlightSensitiveMedia');
const mediaListWithOneImageAppearance = prefer.model('mediaListWithOneImageAppearance');
const showMediaListByGridInWideArea = prefer.model('showMediaListByGridInWideArea');
const reactionsDisplaySize = prefer.model('reactionsDisplaySize');
const limitWidthOfReaction = prefer.model('limitWidthOfReaction');
const squareAvatars = prefer.model('squareAvatars');
const enableSeasonalScreenEffect = prefer.model('enableSeasonalScreenEffect');
const showAvatarDecorations = prefer.model('showAvatarDecorations');
const nsfw = prefer.model('nsfw');
const emojiStyle = prefer.model('emojiStyle');
const useBlurEffectForModal = prefer.model('useBlurEffectForModal');
const useBlurEffect = prefer.model('useBlurEffect');
const defaultFollowWithReplies = prefer.model('defaultFollowWithReplies');
const chatShowSenderName = prefer.model('chat.showSenderName');
const chatSendOnEnter = prefer.model('chat.sendOnEnter');
const useStickyIcons = prefer.model('useStickyIcons');
const enableHighQualityImagePlaceholders = prefer.model('enableHighQualityImagePlaceholders');
const reduceAnimation = prefer.model('animation', v => !v, v => !v);
const animatedMfm = prefer.model('animatedMfm');
const disableShowingAnimatedImages = prefer.model('disableShowingAnimatedImages');
const keepScreenOn = prefer.model('keepScreenOn');
const enableHorizontalSwipe = prefer.model('enableHorizontalSwipe');
const showPageTabBarBottom = prefer.model('showPageTabBarBottom');
const enablePullToRefresh = prefer.model('enablePullToRefresh');
const useNativeUiForVideoAudioPlayer = prefer.model('useNativeUiForVideoAudioPlayer');
const contextMenu = prefer.model('contextMenu');
const menuStyle = prefer.model('menuStyle');
const makeEveryTextElementsSelectable = prefer.model('makeEveryTextElementsSelectable');

const fontSize = ref(miLocalStorage.getItem('fontSize') as '1' | '2' | '3' | null);
const useSystemFont = ref(miLocalStorage.getItem('useSystemFont') != null);

watch(lang, () => {
	miLocalStorage.setItem('lang', lang.value as string);
});

watch(fontSize, () => {
	if (fontSize.value == null) {
		miLocalStorage.removeItem('fontSize');
	} else {
		miLocalStorage.setItem('fontSize', fontSize.value);
	}
});

watch(useSystemFont, () => {
	if (useSystemFont.value) {
		miLocalStorage.setItem('useSystemFont', 't');
	} else {
		miLocalStorage.removeItem('useSystemFont');
	}
});

watch([
	hemisphere,
	lang,
	realtimeMode,
	pollingInterval,
	enableInfiniteScroll,
	showNoteActionsOnlyHover,
	overridedDeviceKind,
	alwaysConfirmFollow,
	confirmWhenRevealingSensitiveMedia,
	mediaListWithOneImageAppearance,
	reactionsDisplaySize,
	limitWidthOfReaction,
	mediaListWithOneImageAppearance,
	limitWidthOfReaction,
	instanceTicker,
	squareAvatars,
	highlightSensitiveMedia,
	enableSeasonalScreenEffect,
	chatShowSenderName,
	useStickyIcons,
	enableHighQualityImagePlaceholders,
	disableShowingAnimatedImages,
	keepScreenOn,
	contextMenu,
	fontSize,
	useSystemFont,
	makeEveryTextElementsSelectable,
	enableHorizontalSwipe,
	showPageTabBarBottom,
	enablePullToRefresh,
	reduceAnimation,
	showAvailableReactionsFirstInNote,
	animatedMfm,
	advancedMfm,
], () => {
	suggestReload();
});

const emojiIndexLangs = ['en-US', 'ja-JP', 'ja-JP_hira'] as const;

function getEmojiIndexLangName(targetLang: typeof emojiIndexLangs[number]) {
	if (langs.find(x => x[0] === targetLang)) {
		return langs.find(x => x[0] === targetLang)![1];
	} else {
		// 絵文字辞書限定の言語定義
		switch (targetLang) {
			case 'ja-JP_hira': return 'ひらがな';
			default: return targetLang;
		}
	}
}

function downloadEmojiIndex(lang: typeof emojiIndexLangs[number]) {
	async function main() {
		const currentIndexes = store.s.additionalUnicodeEmojiIndexes;

		function download() {
			switch (lang) {
				case 'en-US': return import('@misskey-dev/emoji-data/indexes/en-US.json').then(x => x.default);
				case 'ja-JP': return import('@misskey-dev/emoji-data/indexes/ja-JP.json').then(x => x.default);
				case 'ja-JP_hira': return import('@misskey-dev/emoji-data/indexes/ja-JP_hira.json').then(x => x.default);
				default: throw new Error('unrecognized lang: ' + lang);
			}
		}

		currentIndexes[lang] = await download();
		await store.set('additionalUnicodeEmojiIndexes', currentIndexes);
	}

	os.promiseDialog(main());
}

function removeEmojiIndex(lang: string) {
	async function main() {
		const currentIndexes = store.s.additionalUnicodeEmojiIndexes;
		delete currentIndexes[lang];
		await store.set('additionalUnicodeEmojiIndexes', currentIndexes);
	}

	os.promiseDialog(main());
}

async function setPinnedList() {
	const lists = await misskeyApi('users/lists/list');
	const { canceled, result: listId } = await os.select({
		title: $locale.value.sfc.selectList,
		items: lists.map(x => ({
			value: x.id, label: x.name,
		})),
	});
	if (canceled || listId == null) return;

	prefer.commit('pinnedUserLists', [lists.find((x) => x.id === listId)!]);
}

function removePinnedList() {
	prefer.commit('pinnedUserLists', []);
}

function enableAllDataSaver() {
	const g = { ...prefer.s.dataSaver };

	(Object.keys(g) as (keyof typeof g)[]).forEach((key) => { g[key] = true; });

	dataSaver.value = g;
}

function disableAllDataSaver() {
	const g = { ...prefer.s.dataSaver };

	(Object.keys(g) as (keyof typeof g)[]).forEach((key) => { g[key] = false; });

	dataSaver.value = g;
}

watch(dataSaver, (to) => {
	prefer.commit('dataSaver', to);
}, {
	deep: true,
});

let smashCount = 0;
let smashTimer: number | null = null;

function testNotification(): void {
	const notification: Misskey.entities.Notification = {
		id: genId(),
		createdAt: new Date().toUTCString(),
		type: 'test',
	};

	globalEvents.emit('clientNotification', notification);

	// セルフ通知破壊 実績関連
	smashCount++;
	if (smashCount >= 10) {
		claimAchievement('smashTestNotificationButton');
		smashCount = 0;
	}
	if (smashTimer) {
		window.clearTimeout(smashTimer);
	}
	smashTimer = window.setTimeout(() => {
		smashCount = 0;
	}, 300);
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: $locale.value.sfc.general,
	icon: 'ti ti-adjustments',
}));
</script>

<locale lang="json" locale="ar-SA">
{
	"preferences": "Preferences",
	"settingsPreferencesBanner": "You can configure the overall behavior of the client according to your preferences.",
	"general": "الرئيسية",
	"uiLanguage": "لغة واجهة المستخدم",
	"i18nInfo": "يترجم متطوعون ميسكي إلى عدة لغات، يمكنك المساعدة عبر {link}",
	"auto": "تلقائي",
	"smartphone": "هاتف ذكي",
	"tablet": "جهاز لوحي",
	"desktop": "سطح المكتب",
	"overridedDeviceKind": "نوع الجهاز",
	"realtimeMode": "Real-time mode",
	"settingsRealtimeMode_description": "Establishes a connection with the server and updates content in real time. This may increase traffic and memory consumption.",
	"low": "منخفضة",
	"middle": "متوسط",
	"high": "عالية",
	"settingsContentsUpdateFrequency": "Frequency of content retrieval",
	"settingsContentsUpdateFrequency_description": "The higher the value the more the content updates but it lowers the performance and increases the traffic and memory consumption.",
	"settingsContentsUpdateFrequency_description2": "When real-time mode is on, content is updated in real time regardless of this setting.",
	"showTitlebar": "اعرض شريط العنوان",
	"showAvatarDecorations": "Show avatar decorations",
	"alwaysConfirmFollow": "Always confirm when following",
	"highlightSensitiveMedia": "Highlight sensitive media",
	"confirmWhenRevealingSensitiveMedia": "Confirm when revealing sensitive media",
	"enableAdvancedMfm": "Enable advanced MFM",
	"enableInfiniteScroll": "فعّل التمرير المتواصل",
	"native": "Native",
	"emojiStyle": "نمط الوجوه التعبيرية",
	"settingsTimelineAndNote": "Timeline and note",
	"showFixedPostForm": "أظهر نموذج الكتابة في أعلى الصفحة",
	"showFixedPostFormInChannel": "أظهر نموذج الكتابة في أعلى الخط الزمني (قنوات)",
	"collapseRenotes": "Collapse renotes you've already seen",
	"collapseRenotesDescription": "Collapse notes that you've reacted to or renoted before.",
	"pinnedList": "Pinned list",
	"add": "إضافة",
	"remove": "حذف",
	"showNoteActionsOnlyHover": "أظهر الإجراءات عند التمرير فوق الملاحظة",
	"showClipButtonInNoteFooter": "Add \"Clip\" to note action menu",
	"showReactionsCount": "See the number of reactions in notes",
	"confirmOnReact": "Confirm when reacting",
	"loadRawImages": "حمّل الصور الأصلية بدلًا من المصغرات",
	"useReactionPickerForContextMenu": "افتح منتقي التفاعلات عند النقر بالزر الأيمن",
	"settingsShowAvailableReactionsFirstInNote": "Show available reactions at the top.",
	"small": "صغير",
	"medium": "متوسط",
	"large": "كبير",
	"reactionsDisplaySize": "حجم التفاعلات",
	"limitWidthOfReaction": "تصغير حجم التفاعلات",
	"default": "افتراضي",
	"limitTo": "سقفهُ لـ{x}",
	"mediaListWithOneImageAppearance": "Height of media lists with one image only",
	"showMediaListByGridInWideArea": "Display the media list in a grid when the screen width is wide",
	"instanceTickerNone": "لا تظهره بتاتًا",
	"instanceTickerRemote": "أظهر للمستخدمين البِعاد",
	"instanceTickerAlways": "أظهره دائمًا",
	"instanceTicker": "معلومات المثيل الأصلي للملاحظات",
	"displayOfSensitiveMediaRespect": "Hide media marked as sensitive",
	"displayOfSensitiveMediaIgnore": "Display media marked as sensitive",
	"displayOfSensitiveMediaForce": "Hide all media",
	"displayOfSensitiveMedia": "عرض المحتوى الحساس",
	"postForm": "أنشئ ملاحظة",
	"keepCw": "أبقِ على تحذيرات المحتوى",
	"rememberNoteVisibility": "تذكر إعدادت مدى رؤية الملاحظات",
	"enableQuickAddMfmFunction": "Show advanced MFM picker",
	"defaultNoteVisibility": "مدى الرؤية الافتراضي",
	"visibilityPublic": "علني",
	"visibilityHome": "الرئيسي",
	"visibilityFollowers": "المتابِعون",
	"visibilitySpecified": "مباشرة",
	"visibilityDisableFederation": "Defederate",
	"notifications": "الإشعارات",
	"useGroupedNotifications": "Display grouped notifications",
	"leftTop": "أعلى اليسار",
	"rightTop": "أعلى اليمين",
	"leftBottom": "أسفل اليسار",
	"rightBottom": "أسفل اليمين",
	"position": "الموضع",
	"vertical": "عمودي",
	"horizontal": "جانبي",
	"stackAxis": "اتجاه التكديس",
	"notificationCheckNotificationBehavior": "Check notification appearance",
	"directMessage": "Chat with user",
	"settingsChatShowSenderName": "Show sender's name",
	"settingsChatSendOnEnter": "Press Enter to send",
	"settingsIfOn": "When turned on",
	"chatSend": "أرسل",
	"chatNewline": "New line",
	"settingsIfOff": "When turned off",
	"accessibility": "Accessibility",
	"settingsAccessibilityBanner": "You can personalize the client's visuals and behavior, and configure settings to optimize usage.",
	"reduceUiAnimation": "قلص تأثيرات الواجهة",
	"disableShowingAnimatedImages": "لا تشغّل الصور المتحركة",
	"disableShowingAnimatedImages_caption": "If animated images do not play even if this setting is disabled, it may be due to browser or OS accessibility settings, power-saving settings, or similar factors.",
	"enableAnimatedMfm": "Enable animated MFM",
	"settingsShowPageTabBarBottom": "Show page tab bar at the bottom",
	"enableHorizontalSwipe": "Swipe to switch tabs",
	"settingsEnablePullToRefresh": "Pull to Refresh",
	"settingsEnablePullToRefresh_description": "When using a mouse, drag while pressing in the scroll wheel.",
	"keepScreenOn": "Keep screen on",
	"useNativeUIForVideoAudioPlayer": "Use UI of browser when play video and audio\n",
	"settingsMakeEveryTextElementsSelectable": "Make all text elements selectable",
	"settingsMakeEveryTextElementsSelectable_description": "Enabling this may reduce usability in some situations.",
	"popup": "Pop up",
	"drawer": "Drawer",
	"menuStyle": "Menu style",
	"contextMenuApp": "Application",
	"contextMenuAppWithShift": "Application with shift key",
	"contextMenuNative": "Native",
	"contextMenuTitle": "Context menu",
	"fontSize": "حجم الخط",
	"useSystemFont": "استخدم الخط الافتراضية للنظام",
	"performance": "Performance",
	"settingsUiAnimations": "UI Animations",
	"turnOffToImprovePerformance": "تفعيله قد يزيد الأداء.",
	"settingsEnableAnimatedImages": "Enable animated images",
	"useBlurEffect": "استخدم تأثير الطمس في الواجهة",
	"useBlurEffectForModal": "استخدم تأثير الطمس في المشروط",
	"settingsEnableHighQualityImagePlaceholders": "Display placeholders for high quality images",
	"settingsUseStickyIcons": "Make icons follow while scrolling",
	"clientPerformanceIssueTipTitle": "Performance tips",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Disable your adblocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Adblockers can affect performance, please make sure that adblockers are not enabled by your system or browser features/extensions.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Disable custom CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Overriding styles can affect performance. Please make sure that custom CSS or extensions that override styles are not enabled.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Disable extensions",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Some extensions may interfere with client behavior and affect performance. Please disable your browser extensions and see if this improves the situation.",
	"dataSaver": "موفر البيانات",
	"reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
	"enableAll": "تشغيل الكل",
	"disableAll": "تعطيل الكل",
	"dataSaverMediaTitle": "Loading Media",
	"dataSaverMediaDescription": "Prevents images/videos from being loaded automatically. Hidden images/videos will be loaded when tapped.",
	"dataSaverAvatarTitle": "Avatar image",
	"dataSaverAvatarDescription": "Stop avatar image animation. Animated images can be larger in file size than normal images, potentially leading to further reductions in data traffic.",
	"dataSaverDisableUrlPreviewTitle": "Disable URL preview",
	"dataSaverDisableUrlPreviewDescription": "Disables the URL preview function. Unlike thumbnail images, this function reduces the loading of the linked information itself.",
	"dataSaverUrlPreviewThumbnailTitle": "Hide URL preview thumbnails",
	"dataSaverUrlPreviewThumbnailDescription": "URL preview thumbnail images will no longer be loaded.",
	"dataSaverCodeTitle": "Code highlighting",
	"dataSaverCodeDescription": "If code highlighting notations are used in MFM, etc., they will not load until tapped. Syntax highlighting requires downloading the highlight definition files for each programming language. Therefore, disabling the automatic loading of these files is expected to reduce the amount of communication data.",
	"other": "منوعات",
	"squareAvatars": "اعرض شكل الصور الرمزية كمربعات",
	"seasonalScreenEffect": "Seasonal Screen Effect",
	"openImageInNewTab": "إفتح الصورة بصفحة جديدة",
	"withRepliesByDefaultForNewlyFollowed": "Include replies by newly followed users in the timeline by default",
	"serverDisconnectedBehaviorReload": "إعادة تحميل تلقائية",
	"serverDisconnectedBehaviorDialog": "أظهر مربع حوار التحذيرات",
	"serverDisconnectedBehaviorQuiet": "Show unobtrusive warning",
	"whenServerDisconnected": "عند فقدان الاتصال بالخادم",
	"numberOfPageCache": "عدد الصفحات المخزنة مؤقتًا",
	"numberOfPageCacheDescription": "رفع الرقم سيسحن تجربة المستخدم لكن سيرفع استهلاك الذاكرة.",
	"forceShowAds": "أظهر الإعلانات التجارية دائما",
	"hemisphereN": "Northern Hemisphere",
	"hemisphereS": "Southern Hemisphere",
	"hemisphere": "Where you live",
	"hemisphereCaption": "Used in some client settings to determine season.",
	"additionalEmojiDictionary": "قواميس إيموجي إضافية",
	"installed": "مُثبت",
	"navbar": "شريط التنقل",
	"statusbar": "شريط الحالة",
	"deck": "Deck",
	"customCss": "CSS مخصصة",
	"selectList": "اختر قائمة"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"preferences": "Preferències ",
	"settingsPreferencesBanner": "Pots configurar el comportament general del client segons les teves preferències.",
	"general": "General",
	"uiLanguage": "Idioma de l'interfície",
	"i18nInfo": "Misskey està sent traduït a diferents idiomes per voluntaris. Pots ajudar aquí {link}.",
	"auto": "Automàtic ",
	"smartphone": "Mòbil ",
	"tablet": "Tauleta",
	"desktop": "Escriptori",
	"overridedDeviceKind": "Tipus de dispositiu",
	"realtimeMode": "Mode en temps real",
	"settingsRealtimeMode_description": "Estableix una connexió amb el servidor i actualitza el contingut en temps real. Pot consumir més dades i bateria.",
	"low": "Baixa",
	"middle": "Mitjà",
	"high": "Alta",
	"settingsContentsUpdateFrequency": "Freqüència d'adquisició del contingut",
	"settingsContentsUpdateFrequency_description": "Com més alt sigui l'adquisició de contingut en temps real, més baixa el rendiment i més consum de dades i bateria.",
	"settingsContentsUpdateFrequency_description2": "Quan s'activa el mode en temps real, el contingut s'actualitza en temps real, independentment d'aquesta configuració.",
	"showTitlebar": "Mostra la barra del títol ",
	"showAvatarDecorations": "Mostrar les decoracions dels avatars",
	"alwaysConfirmFollow": "Confirma sempre els seguiments",
	"highlightSensitiveMedia": "Ressalta els medis marcats com a sensibles",
	"confirmWhenRevealingSensitiveMedia": "Confirmació quan revelis contingut sensible ",
	"enableAdvancedMfm": "Habilitar l'MFM avançat",
	"enableInfiniteScroll": "Carrega més automàticament\n",
	"native": "Nadiu",
	"emojiStyle": "Estil d'emoji",
	"settingsTimelineAndNote": "Línia de temps i nota",
	"showFixedPostForm": "Mostrar el formulari per escriure a l'inici de la línia de temps",
	"showFixedPostFormInChannel": "Mostrar el formulari d'escriptura al principi de la línia de temps (Canals)",
	"collapseRenotes": "Col·lapsar els impulsos que ja has vist",
	"collapseRenotesDescription": "Col·lapse les notes a les quals ja has reaccionat o que ja has impulsat.",
	"pinnedList": "Llista fixada",
	"add": "Afegir",
	"remove": "Eliminar",
	"showNoteActionsOnlyHover": "Només mostra accions de la nota en passar amb el cursor",
	"showClipButtonInNoteFooter": "Afegir \"Retall\" al menú d'acció de la nota",
	"showReactionsCount": "Mostra el nombre de reaccions a les publicacions",
	"confirmOnReact": "Confirmar en reaccionar",
	"loadRawImages": "Carregar les imatges originals en comptes de miniatures ",
	"useReactionPickerForContextMenu": "Fes clic al botó dret del ratolí per obrir el menú de reaccions",
	"settingsShowAvailableReactionsFirstInNote": "Mostra les reacciones que pots fer servir al damunt",
	"small": "Petit",
	"medium": "Mitjà",
	"large": "Gran",
	"reactionsDisplaySize": "Mida de les reaccions",
	"limitWidthOfReaction": "Limitar l'amplada màxima de la reacció i mostrar-les en una mida reduïda ",
	"default": "Per defecte",
	"limitTo": "Limita a {x}",
	"mediaListWithOneImageAppearance": "Altura de la llista de fitxers amb una única imatge",
	"showMediaListByGridInWideArea": "Mostra la llista de medis en vista quadrícula quan l'amplada de la pantalla ho permeti",
	"instanceTickerNone": "No mostrar mai",
	"instanceTickerRemote": "Mostrar per usuaris remots",
	"instanceTickerAlways": "Mostrar sempre",
	"instanceTicker": "Informació de notes de la instància ",
	"displayOfSensitiveMediaRespect": "Ocultar imatges o vídeos marcats com a sensibles",
	"displayOfSensitiveMediaIgnore": "Mostrar imatges o vídeos marcats com a sensibles",
	"displayOfSensitiveMediaForce": "Ocultar totes les imatges o vídeos ",
	"displayOfSensitiveMedia": "Visualització de contingut sensible",
	"postForm": "Formulari de publicació",
	"keepCw": "Mantenir els avisos de contingut",
	"rememberNoteVisibility": "Recorda la configuració de visibilitat de les notes",
	"enableQuickAddMfmFunction": "Activar accés ràpid per afegir funcions MFM",
	"defaultNoteVisibility": "Visibilitat per defecte",
	"visibilityPublic": "Públic ",
	"visibilityHome": "Inici",
	"visibilityFollowers": "Seguidors",
	"visibilitySpecified": "Directe",
	"visibilityDisableFederation": "Sense federar",
	"notifications": "Notificacions",
	"useGroupedNotifications": "Mostrar les notificacions agrupades ",
	"leftTop": "Dalt a l'esquerra ",
	"rightTop": "Dalt a la dreta ",
	"leftBottom": "A baix a l'esquerra",
	"rightBottom": "A baix a la dreta",
	"position": "Posició ",
	"vertical": "Vertical",
	"horizontal": "Horitzontal ",
	"stackAxis": "Apilar en direcció ",
	"notificationCheckNotificationBehavior": "Comprova el comportament de la notificació ",
	"directMessage": "Xateja amb aquest usuari",
	"settingsChatShowSenderName": "Mostrar el nom del remitent",
	"settingsChatSendOnEnter": "Introdueix per enviar",
	"settingsIfOn": "Quan s'activa",
	"chatSend": "Envia",
	"chatNewline": "Línia nova ",
	"settingsIfOff": "Quan es desactiva",
	"accessibility": "Accessibilitat ",
	"settingsAccessibilityBanner": "Els clients poden personalitzar-se i configurar-se per un ús òptim en funció de la seva visió i comportament.",
	"reduceUiAnimation": "Redueix les animacions de la interfície",
	"disableShowingAnimatedImages": "No reproduir imatges animades",
	"disableShowingAnimatedImages_caption": "Si les imatges animades no es reprodueixen, independentment d'aquesta configuració, és possible que la configuració d'accessibilitat del navegador i el sistema operatiu, els modes d'estalvi d'energia i similars estiguin interferint.",
	"enableAnimatedMfm": "Habilitar l'MFM amb moviment",
	"settingsShowPageTabBarBottom": "Mostrar les pestanyes de les línies de temps a la part inferior",
	"enableHorizontalSwipe": "Lliscar per canviar de pestanya",
	"settingsEnablePullToRefresh": "Lliscar i actualitzar ",
	"settingsEnablePullToRefresh_description": "Amb el ratolí, llisca mentre prems la roda.",
	"keepScreenOn": "Mantenir la pantalla encesa",
	"useNativeUIForVideoAudioPlayer": "Fes servir la UI del navegador quan reprodueixis vídeo i àudio ",
	"settingsMakeEveryTextElementsSelectable": "Fes que tots els elements del text siguin seleccionables",
	"settingsMakeEveryTextElementsSelectable_description": "L'activació pot reduir la usabilitat en determinades ocasions.",
	"popup": "Emergent",
	"drawer": "Calaix",
	"menuStyle": "Estil de menú",
	"contextMenuApp": "Aplicació ",
	"contextMenuAppWithShift": "Aplicació amb la tecla shift",
	"contextMenuNative": "Interfície del navegador",
	"contextMenuTitle": "Menú contextual",
	"fontSize": "Mida del text",
	"useSystemFont": "Fes servir la font per defecte del sistema",
	"performance": "Rendiment",
	"settingsUiAnimations": "Animacions de la interfície",
	"turnOffToImprovePerformance": "Desactivant aquesta opció es pot millorar el rendiment.",
	"settingsEnableAnimatedImages": "Activar imatges animades",
	"useBlurEffect": "Fes servir efectes de desenfocament a la interfície",
	"useBlurEffectForModal": "Utilitzar l'efecte de difuminació a modals",
	"settingsEnableHighQualityImagePlaceholders": "Mostrar marcadors de posició per imatges d'alta qualitat",
	"settingsUseStickyIcons": "Utilitza icones fixes",
	"clientPerformanceIssueTipTitle": "Si creus que el consum de bateria és molt alt",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Desactiva els bloquejadors de publicitat",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Els bloquejadors d'anuncis pot afectar el rendiment, comprova que no estiguin activats per característiques del sistema operatiu o del navegador.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Desactiva CSS personalitzat",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "L'anul·lació dels estils pot afectar el rendiment. Comprova que el CSS personalitzat o les extensions que reescriuen estils no estiguin activats.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Desactiva extensions",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Algunes extensions poden interferir en el comportament del client i afectar el rendiment. Desactiva les extensions del navegador i comprovar-ho.",
	"dataSaver": "Economitzador de dades",
	"reloadRequiredToApplySettings": "És necessari recarregar la pàgina per aplicar els canvis.",
	"enableAll": "Habilita tot",
	"disableAll": "Deshabilita tot",
	"dataSaverMediaTitle": "Carregant multimèdia ",
	"dataSaverMediaDescription": "Desactiva la càrrega automàtica d'imatges i vídeos. Les imatges i els vídeos amagats es carregaran quan es faci clic a sobre.",
	"dataSaverAvatarTitle": "Avatars animats",
	"dataSaverAvatarDescription": "Detenir l'animació dels avatars animats. Les imatges animades solen tenir un pes més gran que les imatges normals, reduint el tràfic disponible.",
	"dataSaverDisableUrlPreviewTitle": "Desactivar la vista prèvia d'URL",
	"dataSaverDisableUrlPreviewDescription": "Desactiva la funció de previsualització d'URL. A diferència de les imatges en miniatura soles, això redueix la càrrega de la mateixa informació vinculada.",
	"dataSaverUrlPreviewThumbnailTitle": "Amagar les miniatures de la vista prèvia d'URL",
	"dataSaverUrlPreviewThumbnailDescription": "Les imatges en miniatura de la vista prèvia d'URL ja no es carreguen",
	"dataSaverCodeTitle": "Ressaltat del codi ",
	"dataSaverCodeDescription": "Quan s'utilitza codi MFM, no es llegeix fins que es copiï. En els punts destacats del codi s'han de llegir els fitxers definits per a cada llengua que resulti alt, però no es poden llegir automàticament, per la qual cosa es poden reduir les quantitats de comunicació.",
	"other": "Altres",
	"squareAvatars": "Mostrar avatars quadrats",
	"seasonalScreenEffect": "Efectes de pantalla segons les estacions",
	"openImageInNewTab": "Obre imatges a una nova pestanya",
	"withRepliesByDefaultForNewlyFollowed": "Inclou les respostes d'usuaris nous que segueixes a la línia de temps per defecte.",
	"serverDisconnectedBehaviorReload": "Recarregar automàticament ",
	"serverDisconnectedBehaviorDialog": "Mostrar finestres de confirmació ",
	"serverDisconnectedBehaviorQuiet": "Mostrar un avís que no molesti",
	"whenServerDisconnected": "Quan es perdi la connexió al servidor",
	"numberOfPageCache": "Nombre de pàgines a la memòria cau",
	"numberOfPageCacheDescription": "Incrementant aquest nombre farà que millori l'experiència de l'usuari, però es farà servir més memòria al dispositiu de l'usuari.",
	"forceShowAds": "Mostrar publicitat sempre ",
	"hemisphereN": "Hemisferi Nord ",
	"hemisphereS": "Hemisferi Sud",
	"hemisphere": "Geolocalització",
	"hemisphereCaption": "El fan servir alguns clients per determinar l'estació de l'any.",
	"additionalEmojiDictionary": "Diccionari d'emojis adicionals",
	"installed": "Instal·lats ",
	"navbar": "Barra de navegació ",
	"statusbar": "Barra d'estat",
	"deck": "Escriptori",
	"customCss": "CSS personalitzat",
	"selectList": "Tria una llista"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"preferences": "Preferences",
	"settingsPreferencesBanner": "You can configure the overall behavior of the client according to your preferences.",
	"general": "Obecně",
	"uiLanguage": "Jazyk uživatelského rozhraní",
	"i18nInfo": "Misskey je překládán do jiných jazyků dobrovolníkama. Můžete pomoci na {link}.",
	"auto": "Auto",
	"smartphone": "Telefon",
	"tablet": "Tablet",
	"desktop": "Plocha",
	"overridedDeviceKind": "Typ zařízení",
	"realtimeMode": "Real-time mode",
	"settingsRealtimeMode_description": "Establishes a connection with the server and updates content in real time. This may increase traffic and memory consumption.",
	"low": "Nízká",
	"middle": "Střední",
	"high": "Vysoká",
	"settingsContentsUpdateFrequency": "Frequency of content retrieval",
	"settingsContentsUpdateFrequency_description": "The higher the value the more the content updates but it lowers the performance and increases the traffic and memory consumption.",
	"settingsContentsUpdateFrequency_description2": "When real-time mode is on, content is updated in real time regardless of this setting.",
	"showTitlebar": "Zobrazit řádek s nadpisem",
	"showAvatarDecorations": "Show avatar decorations",
	"alwaysConfirmFollow": "Always confirm when following",
	"highlightSensitiveMedia": "Highlight sensitive media",
	"confirmWhenRevealingSensitiveMedia": "Confirm when revealing sensitive media",
	"enableAdvancedMfm": "Zapnout pokročilé MFM",
	"enableInfiniteScroll": "Automaticky načítat více",
	"native": "Výchozí",
	"emojiStyle": "Styl emoji",
	"settingsTimelineAndNote": "Timeline and note",
	"showFixedPostForm": "Zobrazit formulář pro nové příspěvky nad časovou osou",
	"showFixedPostFormInChannel": "Zobrazit vkládací formulář na vrcholu časové osy (Kanály)",
	"collapseRenotes": "Sbalit poznámky, které jste již viděli",
	"collapseRenotesDescription": "Collapse notes that you've reacted to or renoted before.",
	"pinnedList": "Pinned list",
	"add": "Přidat",
	"remove": "Smazat",
	"showNoteActionsOnlyHover": "Zobrazit akce poznámky jenom při naběhnutí myši",
	"showClipButtonInNoteFooter": "Přidat \"Připnout\" do akčního menu poznámky",
	"showReactionsCount": "See the number of reactions in notes",
	"confirmOnReact": "Confirm when reacting",
	"loadRawImages": "Načítat originální obrázky místo náhledů",
	"useReactionPickerForContextMenu": "Otevřít výběr reakce na kliknutí pravého tlačítka myši",
	"settingsShowAvailableReactionsFirstInNote": "Show available reactions at the top.",
	"small": "Malé",
	"medium": "Střední",
	"large": "Velké",
	"reactionsDisplaySize": "Reaction display size",
	"limitWidthOfReaction": "Limit the maximum width of reactions and display them in reduced size.",
	"default": "Výchozí",
	"limitTo": "Omezeno na {x}",
	"mediaListWithOneImageAppearance": "Výška seznamu médií s jedním obrázkem",
	"showMediaListByGridInWideArea": "Display the media list in a grid when the screen width is wide",
	"instanceTickerNone": "Nikdy nezobrazovat",
	"instanceTickerRemote": "Zobrazit pro vzdálené uživatelé",
	"instanceTickerAlways": "Vždy zobrazovat",
	"instanceTicker": "Informace instance o poznámkách",
	"displayOfSensitiveMediaRespect": "Skrýt média označená jako citlivá",
	"displayOfSensitiveMediaIgnore": "Zobrazit média označená jako citlivá",
	"displayOfSensitiveMediaForce": "Skrýt všechna média",
	"displayOfSensitiveMedia": "Zobrazit citlivé média",
	"postForm": "Formulář pro odeslání",
	"keepCw": "Zachovat varování o obsahu",
	"rememberNoteVisibility": "Zapamatovat nastavení zobrazení poznámky",
	"enableQuickAddMfmFunction": "Show advanced MFM picker",
	"defaultNoteVisibility": "Výchozí viditelnost",
	"visibilityPublic": "Veřejný",
	"visibilityHome": "Domů",
	"visibilityFollowers": "Sledující",
	"visibilitySpecified": "Přímý",
	"visibilityDisableFederation": "Defederace",
	"notifications": "Oznámení",
	"useGroupedNotifications": "Display grouped notifications",
	"leftTop": "Vlevo nahoře",
	"rightTop": "Vpravo nahoře",
	"leftBottom": "Vlevo dole",
	"rightBottom": "Vpravo dole",
	"position": "Pozice",
	"vertical": "Svisle",
	"horizontal": "Vodorovně",
	"stackAxis": "Směr ukládání",
	"notificationCheckNotificationBehavior": "Check notification appearance",
	"directMessage": "Chat with user",
	"settingsChatShowSenderName": "Show sender's name",
	"settingsChatSendOnEnter": "Press Enter to send",
	"settingsIfOn": "When turned on",
	"chatSend": "Odeslat",
	"chatNewline": "New line",
	"settingsIfOff": "When turned off",
	"accessibility": "Accessibility",
	"settingsAccessibilityBanner": "You can personalize the client's visuals and behavior, and configure settings to optimize usage.",
	"reduceUiAnimation": "Snížit UI animace",
	"disableShowingAnimatedImages": "Nepřehrávat animované obrázky",
	"disableShowingAnimatedImages_caption": "If animated images do not play even if this setting is disabled, it may be due to browser or OS accessibility settings, power-saving settings, or similar factors.",
	"enableAnimatedMfm": "Zapnout animované MFM",
	"settingsShowPageTabBarBottom": "Show page tab bar at the bottom",
	"enableHorizontalSwipe": "Swipe to switch tabs",
	"settingsEnablePullToRefresh": "Pull to Refresh",
	"settingsEnablePullToRefresh_description": "When using a mouse, drag while pressing in the scroll wheel.",
	"keepScreenOn": "Keep screen on",
	"useNativeUIForVideoAudioPlayer": "Use UI of browser when play video and audio\n",
	"settingsMakeEveryTextElementsSelectable": "Make all text elements selectable",
	"settingsMakeEveryTextElementsSelectable_description": "Enabling this may reduce usability in some situations.",
	"popup": "Vyskakovací okno",
	"drawer": "Boční menu",
	"menuStyle": "Styl nabídky",
	"contextMenuApp": "Application",
	"contextMenuAppWithShift": "Application with shift key",
	"contextMenuNative": "Native",
	"contextMenuTitle": "Context menu",
	"fontSize": "Velikost písma",
	"useSystemFont": "Použít výchozí font systému",
	"performance": "Performance",
	"settingsUiAnimations": "UI Animations",
	"turnOffToImprovePerformance": "Vypnutí této funkce může zvýšit výkon.",
	"settingsEnableAnimatedImages": "Enable animated images",
	"useBlurEffect": "Použít efekt rozostření v UI",
	"useBlurEffectForModal": "Použít efekt rozostření na okna",
	"settingsEnableHighQualityImagePlaceholders": "Display placeholders for high quality images",
	"settingsUseStickyIcons": "Make icons follow while scrolling",
	"clientPerformanceIssueTipTitle": "Performance tips",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Disable your adblocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Adblockers can affect performance, please make sure that adblockers are not enabled by your system or browser features/extensions.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Disable custom CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Overriding styles can affect performance. Please make sure that custom CSS or extensions that override styles are not enabled.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Disable extensions",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Some extensions may interfere with client behavior and affect performance. Please disable your browser extensions and see if this improves the situation.",
	"dataSaver": "Spořič dat",
	"reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
	"enableAll": "Povolit vše",
	"disableAll": "Vypnout vše",
	"dataSaverMediaTitle": "Loading Media",
	"dataSaverMediaDescription": "Prevents images/videos from being loaded automatically. Hidden images/videos will be loaded when tapped.",
	"dataSaverAvatarTitle": "Avatar image",
	"dataSaverAvatarDescription": "Stop avatar image animation. Animated images can be larger in file size than normal images, potentially leading to further reductions in data traffic.",
	"dataSaverDisableUrlPreviewTitle": "Disable URL preview",
	"dataSaverDisableUrlPreviewDescription": "Disables the URL preview function. Unlike thumbnail images, this function reduces the loading of the linked information itself.",
	"dataSaverUrlPreviewThumbnailTitle": "Hide URL preview thumbnails",
	"dataSaverUrlPreviewThumbnailDescription": "URL preview thumbnail images will no longer be loaded.",
	"dataSaverCodeTitle": "Code highlighting",
	"dataSaverCodeDescription": "If code highlighting notations are used in MFM, etc., they will not load until tapped. Syntax highlighting requires downloading the highlight definition files for each programming language. Therefore, disabling the automatic loading of these files is expected to reduce the amount of communication data.",
	"other": "Ostatní",
	"squareAvatars": "Zobrazovat čtvercové avatary",
	"seasonalScreenEffect": "Seasonal Screen Effect",
	"openImageInNewTab": "Otevřít obrázek v\u00a0novém panelu",
	"withRepliesByDefaultForNewlyFollowed": "Include replies by newly followed users in the timeline by default",
	"serverDisconnectedBehaviorReload": "Automatické znovunačtení",
	"serverDisconnectedBehaviorDialog": "Zobrazení dialogového okna s varováním",
	"serverDisconnectedBehaviorQuiet": "Zobrazit nerušivé upozornění",
	"whenServerDisconnected": "Když ztratíte spojení se serverem",
	"numberOfPageCache": "Počet stránek uložených v mezipaměti",
	"numberOfPageCacheDescription": "Zvýšením čísla zlepšíte pohodlí pro uživatele ale může to způsobit větší zátěž na server a na paměť.",
	"forceShowAds": "Vždycky zobrazovat reklamy",
	"hemisphereN": "Northern Hemisphere",
	"hemisphereS": "Southern Hemisphere",
	"hemisphere": "Where you live",
	"hemisphereCaption": "Used in some client settings to determine season.",
	"additionalEmojiDictionary": "Další slovníky emoji",
	"installed": "Nainstalováno",
	"navbar": "Navigační panel",
	"statusbar": "Stavový řádek",
	"deck": "Deck",
	"customCss": "Vlastní CSS",
	"selectList": "Vybrat seznam"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"preferences": "Preferences",
	"settingsPreferencesBanner": "You can configure the overall behavior of the client according to your preferences.",
	"general": "General",
	"uiLanguage": "User interface language",
	"i18nInfo": "Misskey is being translated into various languages by volunteers. You can help at {link}.",
	"auto": "Auto",
	"smartphone": "Smartphone",
	"tablet": "Tablet",
	"desktop": "Desktop",
	"overridedDeviceKind": "Device type",
	"realtimeMode": "Real-time mode",
	"settingsRealtimeMode_description": "Establishes a connection with the server and updates content in real time. This may increase traffic and memory consumption.",
	"low": "Low",
	"middle": "Medium",
	"high": "High",
	"settingsContentsUpdateFrequency": "Frequency of content retrieval",
	"settingsContentsUpdateFrequency_description": "The higher the value the more the content updates but it lowers the performance and increases the traffic and memory consumption.",
	"settingsContentsUpdateFrequency_description2": "When real-time mode is on, content is updated in real time regardless of this setting.",
	"showTitlebar": "Show title bar",
	"showAvatarDecorations": "Show avatar decorations",
	"alwaysConfirmFollow": "Always confirm when following",
	"highlightSensitiveMedia": "Highlight sensitive media",
	"confirmWhenRevealingSensitiveMedia": "Confirm when revealing sensitive media",
	"enableAdvancedMfm": "Enable advanced MFM",
	"enableInfiniteScroll": "Automatically load more",
	"native": "Native",
	"emojiStyle": "Emoji style",
	"settingsTimelineAndNote": "Timeline and note",
	"showFixedPostForm": "Display the posting form at the top of the timeline",
	"showFixedPostFormInChannel": "Display the posting form at the top of the timeline (Channels)",
	"collapseRenotes": "Collapse renotes you've already seen",
	"collapseRenotesDescription": "Collapse notes that you've reacted to or renoted before.",
	"pinnedList": "Pinned list",
	"add": "Add",
	"remove": "Delete",
	"showNoteActionsOnlyHover": "Only show note actions on hover",
	"showClipButtonInNoteFooter": "Add \"Clip\" to note action menu",
	"showReactionsCount": "See the number of reactions in notes",
	"confirmOnReact": "Confirm when reacting",
	"loadRawImages": "Load original images instead of showing thumbnails",
	"useReactionPickerForContextMenu": "Open reaction picker on right-click",
	"settingsShowAvailableReactionsFirstInNote": "Show available reactions at the top.",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"reactionsDisplaySize": "Reaction display size",
	"limitWidthOfReaction": "Limit the maximum width of reactions and display them in reduced size.",
	"default": "Default",
	"limitTo": "Limit to {x}",
	"mediaListWithOneImageAppearance": "Height of media lists with one image only",
	"showMediaListByGridInWideArea": "Display the media list in a grid when the screen width is wide",
	"instanceTickerNone": "Never show",
	"instanceTickerRemote": "Show for remote users",
	"instanceTickerAlways": "Always show",
	"instanceTicker": "Instance information of notes",
	"displayOfSensitiveMediaRespect": "Hide media marked as sensitive",
	"displayOfSensitiveMediaIgnore": "Display media marked as sensitive",
	"displayOfSensitiveMediaForce": "Hide all media",
	"displayOfSensitiveMedia": "Display of sensitive media",
	"postForm": "Posting form",
	"keepCw": "Keep content warnings",
	"rememberNoteVisibility": "Remember note visibility settings",
	"enableQuickAddMfmFunction": "Show advanced MFM picker",
	"defaultNoteVisibility": "Default visibility",
	"visibilityPublic": "Public",
	"visibilityHome": "Home",
	"visibilityFollowers": "Followers",
	"visibilitySpecified": "Direct",
	"visibilityDisableFederation": "Defederate",
	"notifications": "Notifications",
	"useGroupedNotifications": "Display grouped notifications",
	"leftTop": "Top left",
	"rightTop": "Top right",
	"leftBottom": "Bottom left",
	"rightBottom": "Bottom right",
	"position": "Position",
	"vertical": "Vertical",
	"horizontal": "Horizontal",
	"stackAxis": "Stacking direction",
	"notificationCheckNotificationBehavior": "Check notification appearance",
	"directMessage": "Chat with user",
	"settingsChatShowSenderName": "Show sender's name",
	"settingsChatSendOnEnter": "Press Enter to send",
	"settingsIfOn": "When turned on",
	"chatSend": "Send",
	"chatNewline": "New line",
	"settingsIfOff": "When turned off",
	"accessibility": "Accessibility",
	"settingsAccessibilityBanner": "You can personalize the client's visuals and behavior, and configure settings to optimize usage.",
	"reduceUiAnimation": "Reduce UI animations",
	"disableShowingAnimatedImages": "Don't play animated images",
	"disableShowingAnimatedImages_caption": "If animated images do not play even if this setting is disabled, it may be due to browser or OS accessibility settings, power-saving settings, or similar factors.",
	"enableAnimatedMfm": "Enable animated MFM",
	"settingsShowPageTabBarBottom": "Show page tab bar at the bottom",
	"enableHorizontalSwipe": "Swipe to switch tabs",
	"settingsEnablePullToRefresh": "Pull to Refresh",
	"settingsEnablePullToRefresh_description": "When using a mouse, drag while pressing in the scroll wheel.",
	"keepScreenOn": "Keep screen on",
	"useNativeUIForVideoAudioPlayer": "Use UI of browser when play video and audio\n",
	"settingsMakeEveryTextElementsSelectable": "Make all text elements selectable",
	"settingsMakeEveryTextElementsSelectable_description": "Enabling this may reduce usability in some situations.",
	"popup": "Pop up",
	"drawer": "Drawer",
	"menuStyle": "Menu style",
	"contextMenuApp": "Application",
	"contextMenuAppWithShift": "Application with shift key",
	"contextMenuNative": "Native",
	"contextMenuTitle": "Context menu",
	"fontSize": "Font size",
	"useSystemFont": "Use the system's default font",
	"performance": "Performance",
	"settingsUiAnimations": "UI Animations",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"settingsEnableAnimatedImages": "Enable animated images",
	"useBlurEffect": "Use blur effects in the UI",
	"useBlurEffectForModal": "Use blur effect for modals",
	"settingsEnableHighQualityImagePlaceholders": "Display placeholders for high quality images",
	"settingsUseStickyIcons": "Make icons follow while scrolling",
	"clientPerformanceIssueTipTitle": "Performance tips",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Disable your adblocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Adblockers can affect performance, please make sure that adblockers are not enabled by your system or browser features/extensions.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Disable custom CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Overriding styles can affect performance. Please make sure that custom CSS or extensions that override styles are not enabled.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Disable extensions",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Some extensions may interfere with client behavior and affect performance. Please disable your browser extensions and see if this improves the situation.",
	"dataSaver": "Data Saver",
	"reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
	"enableAll": "Enable all",
	"disableAll": "Disable all",
	"dataSaverMediaTitle": "Loading Media",
	"dataSaverMediaDescription": "Prevents images/videos from being loaded automatically. Hidden images/videos will be loaded when tapped.",
	"dataSaverAvatarTitle": "Avatar image",
	"dataSaverAvatarDescription": "Stop avatar image animation. Animated images can be larger in file size than normal images, potentially leading to further reductions in data traffic.",
	"dataSaverDisableUrlPreviewTitle": "Disable URL preview",
	"dataSaverDisableUrlPreviewDescription": "Disables the URL preview function. Unlike thumbnail images, this function reduces the loading of the linked information itself.",
	"dataSaverUrlPreviewThumbnailTitle": "Hide URL preview thumbnails",
	"dataSaverUrlPreviewThumbnailDescription": "URL preview thumbnail images will no longer be loaded.",
	"dataSaverCodeTitle": "Code highlighting",
	"dataSaverCodeDescription": "If code highlighting notations are used in MFM, etc., they will not load until tapped. Syntax highlighting requires downloading the highlight definition files for each programming language. Therefore, disabling the automatic loading of these files is expected to reduce the amount of communication data.",
	"other": "Other",
	"squareAvatars": "Display squared avatars",
	"seasonalScreenEffect": "Seasonal Screen Effect",
	"openImageInNewTab": "Open images in new tab",
	"withRepliesByDefaultForNewlyFollowed": "Include replies by newly followed users in the timeline by default",
	"serverDisconnectedBehaviorReload": "Automatically reload",
	"serverDisconnectedBehaviorDialog": "Show warning dialog",
	"serverDisconnectedBehaviorQuiet": "Show unobtrusive warning",
	"whenServerDisconnected": "When losing connection to the server",
	"numberOfPageCache": "Number of cached pages",
	"numberOfPageCacheDescription": "Increasing this number will improve convenience for but cause more load as more memory usage on the user's device.",
	"forceShowAds": "Always show ads",
	"hemisphereN": "Northern Hemisphere",
	"hemisphereS": "Southern Hemisphere",
	"hemisphere": "Where you live",
	"hemisphereCaption": "Used in some client settings to determine season.",
	"additionalEmojiDictionary": "Additional emoji dictionaries",
	"installed": "Installed",
	"navbar": "Navigation bar",
	"statusbar": "Status bar",
	"deck": "Deck",
	"customCss": "Custom CSS",
	"selectList": "Select a list"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"preferences": "Einstellungen",
	"settingsPreferencesBanner": "Sie können das Gesamtverhalten des Clients nach Ihren Wünschen konfigurieren.",
	"general": "Allgemein",
	"uiLanguage": "Sprache der Benutzeroberfläche",
	"i18nInfo": "Misskey wird durch freiwillige Helfer in viele verschiedene Sprachen übersetzt. Auf {link} kannst du mithelfen.",
	"auto": "Automatisch",
	"smartphone": "Smartphone",
	"tablet": "Tablet",
	"desktop": "Desktop",
	"overridedDeviceKind": "Gerätetyp",
	"realtimeMode": "Echtzeit-Modus",
	"settingsRealtimeMode_description": "Stellt eine Verbindung mit dem Server her und aktualisiert die Inhalte in Echtzeit. Kann zu mehr Datenverkehr einem höheren Akkuverbrauch führen.",
	"low": "Niedrig",
	"middle": "Mittel",
	"high": "Hoch",
	"settingsContentsUpdateFrequency": "Häufigkeit des Abrufs von Inhalten",
	"settingsContentsUpdateFrequency_description": "Je höher der Wert, desto häufiger werden die Inhalte aktualisiert, aber die Leistung sinkt und der Datenverkehr und der Akkuverbrauch steigen.",
	"settingsContentsUpdateFrequency_description2": "Wenn der Echtzeitmodus aktiviert ist, werden die Inhalte unabhängig von dieser Einstellung in Echtzeit aktualisiert.",
	"showTitlebar": "Titelleiste anzeigen",
	"showAvatarDecorations": "Profilbilddekoration anzeigen",
	"alwaysConfirmFollow": "Folgen immer bestätigen",
	"highlightSensitiveMedia": "Sensitive Medien markieren",
	"confirmWhenRevealingSensitiveMedia": "Das Anzeigen von sensiblen Medien bestätigen",
	"enableAdvancedMfm": "Erweitertes MFM aktivieren",
	"enableInfiniteScroll": "Automatisch mehr laden",
	"native": "Nativ",
	"emojiStyle": "Emoji-Stil",
	"settingsTimelineAndNote": "Chroniken und Notizen",
	"showFixedPostForm": "Bereich zum Schreiben neuer Notizen am Anfang der Chronik anzeigen",
	"showFixedPostFormInChannel": "Bereich zum Schreiben neuer Notizen am Anfang der Chronik anzeigen (Kanäle)",
	"collapseRenotes": "Bereits gesehene Renotes verkürzt anzeigen",
	"collapseRenotesDescription": "Klappe Notizen ein, auf die du bereits reagiert oder die du renoted hast.",
	"pinnedList": "Angeheftete Liste",
	"add": "Hinzufügen",
	"remove": "Löschen",
	"showNoteActionsOnlyHover": "Notizmenü nur bei Mouseover anzeigen",
	"showClipButtonInNoteFooter": "\"Clip\" zum Notizmenu hinzufügen",
	"showReactionsCount": "Zeige die Anzahl der Reaktionen auf Notizen an",
	"confirmOnReact": "Reagieren bestätigen",
	"loadRawImages": "Anstatt Vorschaubilder immer Originalbilder anzeigen",
	"useReactionPickerForContextMenu": "Reaktionsauswahl durch Rechtsklick öffnen",
	"settingsShowAvailableReactionsFirstInNote": "Zeige die verfügbaren Reaktionen im oberen Bereich an.",
	"small": "Klein",
	"medium": "Mittel",
	"large": "Groß",
	"reactionsDisplaySize": "Reaktionsanzeigegröße",
	"limitWidthOfReaction": "Begrenze die Breite der Reaktion und zeige sie verkleinert an",
	"default": "Standard",
	"limitTo": "Auf {x} begrenzen",
	"mediaListWithOneImageAppearance": "Höhe von Medienlisten mit nur einem Bild",
	"showMediaListByGridInWideArea": "Medienlisten auf breiteren Bildschirmen nebeneinander anzeigen",
	"instanceTickerNone": "Nie anzeigen",
	"instanceTickerRemote": "Für Benutzer fremder Instanzen anzeigen",
	"instanceTickerAlways": "Immer anzeigen",
	"instanceTicker": "Instanz-Informationen von Notizen",
	"displayOfSensitiveMediaRespect": "Sensible Medien verbergen",
	"displayOfSensitiveMediaIgnore": "Sensible Medien anzeigen",
	"displayOfSensitiveMediaForce": "Alle Medien verbergen",
	"displayOfSensitiveMedia": "Darstellung sensibler Medien",
	"postForm": "Notizfenster",
	"keepCw": "Inhaltswarnungen beibehalten",
	"rememberNoteVisibility": "Notizsichtbarkeit merken",
	"enableQuickAddMfmFunction": "Erweiterte MFM-Auswahl anzeigen",
	"defaultNoteVisibility": "Standardsichtbarkeit",
	"visibilityPublic": "Öffentlich",
	"visibilityHome": "Startseite",
	"visibilityFollowers": "Follower",
	"visibilitySpecified": "Direkt",
	"visibilityDisableFederation": "Deföderieren",
	"notifications": "Benachrichtigungen",
	"useGroupedNotifications": "Benachrichtigungen gruppieren",
	"leftTop": "Oben links",
	"rightTop": "Oben rechts",
	"leftBottom": "Unten links",
	"rightBottom": "Unten rechts",
	"position": "Position",
	"vertical": "Vertikal",
	"horizontal": "Horizontal",
	"stackAxis": "Stapelrichtung",
	"notificationCheckNotificationBehavior": "Aussehen von Benachrichtigungen überprüfen",
	"directMessage": "Mit dem Benutzer chatten",
	"settingsChatShowSenderName": "Name des Absenders anzeigen",
	"settingsChatSendOnEnter": "Eingabetaste sendet Nachricht",
	"settingsIfOn": "Wenn eingeschaltet",
	"chatSend": "Senden",
	"chatNewline": "Neue Zeile",
	"settingsIfOff": "Wenn ausgeschaltet",
	"accessibility": "Eingabehilfe",
	"settingsAccessibilityBanner": "Die Clients können personalisiert und für eine optimale Nutzung im Hinblick auf ihre Darstellung und ihr Verhalten eingerichtet werden.",
	"reduceUiAnimation": "Animationen der Benutzeroberfläche reduzieren",
	"disableShowingAnimatedImages": "Animierte Bilder nicht abspielen",
	"disableShowingAnimatedImages_caption": "Unabhängig von dieser Einstellung kann es vorkommen, dass animierte Bilder nicht abgespielt werden, wenn z. B. die Barrierefreiheits- oder Energiespareinstellungen des Browsers oder des Betriebssystems eingreifen.",
	"enableAnimatedMfm": "Animiertes MFM aktivieren",
	"settingsShowPageTabBarBottom": "Tab-Leiste der Seite unten anzeigen",
	"enableHorizontalSwipe": "Wischen, um zwischen Tabs zu wechseln",
	"settingsEnablePullToRefresh": "Ziehen zum Aktualisieren",
	"settingsEnablePullToRefresh_description": "Bei Benutzung einer Maus, mit gedrücktem Mausrad ziehen",
	"keepScreenOn": "Bildschirm angeschaltet lassen",
	"useNativeUIForVideoAudioPlayer": "Browser-Benutzeroberfläche für die Video- und Audiowiedergabe verwenden",
	"settingsMakeEveryTextElementsSelectable": "Alle Textelemente auswählbar machen",
	"settingsMakeEveryTextElementsSelectable_description": "Die Aktivierung kann in manchen Situationen die Benutzerfreundlichkeit beeinträchtigen.",
	"popup": "Pop-up",
	"drawer": "App-Übersicht",
	"menuStyle": "Menü Stil",
	"contextMenuApp": "Anwendung",
	"contextMenuAppWithShift": "Anwendung per Umschalttaste",
	"contextMenuNative": "Natives Browsermenü",
	"contextMenuTitle": "Kontextmenü",
	"fontSize": "Schriftgröße",
	"useSystemFont": "Standardschriftart des Systems verwenden",
	"performance": "Leistung",
	"settingsUiAnimations": "Animationen der Benutzeroberfläche",
	"turnOffToImprovePerformance": "Deaktivierung kann zu höherer Leistung führen.",
	"settingsEnableAnimatedImages": "Animierte Bilder aktivieren",
	"useBlurEffect": "Weichzeichnungseffekt in der Benutzeroberfläche verwenden",
	"useBlurEffectForModal": "Weichzeichnungseffekt für Modals verwenden",
	"settingsEnableHighQualityImagePlaceholders": "Zeige Platzhalter für Bilder in hoher Qualität an",
	"settingsUseStickyIcons": "Icons beim Scrollen folgen lassen",
	"clientPerformanceIssueTipTitle": "Wenn du das Gefühl hast, dass der Akku sich schnell entlädt.",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Deaktiviere deinen Adblocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Adblocker können die Leistung beeinträchtigen; vergewissere dich, ob in deinem Betriebssystem, Browser oder deinen Add-ons Adblocker aktiviert sind.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Benutzerdefiniertes CSS deaktivieren",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Das Überschreiben von Stilen kann die Leistung beeinträchtigen. Stelle daher sicher, dass du kein benutzerdefiniertes CSS oder Erweiterungen aktiviert hast, die Stile überschreiben.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Erweiterungen deaktivieren",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Einige Erweiterungen können das Verhalten des Clients stören und die Leistung beeinträchtigen. Deaktiviere die Browser-Erweiterungen und prüfe, ob sich die Situation dadurch verbessert.",
	"dataSaver": "Datensparmodus",
	"reloadRequiredToApplySettings": "Eine Aktualisierung ist erforderlich, um die Einstellungen zu übernehmen.",
	"enableAll": "Alle aktivieren",
	"disableAll": "Alle deaktivieren",
	"dataSaverMediaTitle": "Laden von Medien verhindern",
	"dataSaverMediaDescription": "Verhindert, dass Bilder/Videos automatisch geladen werden. Ausgeblendete Bilder/Videos werden geladen, wenn du auf sie tippst.",
	"dataSaverAvatarTitle": "Animierte Profilbilder deaktivieren",
	"dataSaverAvatarDescription": "Die Animation von Profilbildern wird angehalten. Da animierte Bilder eine größere Dateigröße haben können als normale Bilder, kann dies den Datenverkehr weiter reduzieren.",
	"dataSaverDisableUrlPreviewTitle": "URL-Vorschau deaktivieren",
	"dataSaverDisableUrlPreviewDescription": "Deaktiviert die URL-Vorschaufunktion. Anders als bei reinen Vorschaubildern wird dadurch das Laden der verlinkten Informationen selbst reduziert.",
	"dataSaverUrlPreviewThumbnailTitle": "URL-Vorschaubilder ausblenden",
	"dataSaverUrlPreviewThumbnailDescription": "URL-Vorschaubilder werden nicht mehr geladen.",
	"dataSaverCodeTitle": "Code-Hervorhebungen ausblenden",
	"dataSaverCodeDescription": "Wenn Code-Hervorhebungen in MFM usw. verwendet werden, werden sie erst geladen, wenn sie angetippt werden. Die Syntaxhervorhebung erfordert das Herunterladen der Definitionsdateien für jede Programmiersprache. Es ist daher zu erwarten, dass die Deaktivierung des automatischen Ladens dieser Dateien die Menge des Datenverkehrs reduziert.",
	"other": "Anderes",
	"squareAvatars": "Profilbilder quadratisch anzeigen",
	"seasonalScreenEffect": "Saisonaler Bildschirmeffekt",
	"openImageInNewTab": "Bilder in neuem Tab öffnen",
	"withRepliesByDefaultForNewlyFollowed": "Standardmäßig Antworten von neu gefolgten Benutzern in der Chronik anzeigen",
	"serverDisconnectedBehaviorReload": "Automatisch aktualisieren",
	"serverDisconnectedBehaviorDialog": "Warnungsfenster zeigen",
	"serverDisconnectedBehaviorQuiet": "Unaufdringlich warnen",
	"whenServerDisconnected": "Bei Verbindungsverlust zum Server",
	"numberOfPageCache": "Seitencachegröße",
	"numberOfPageCacheDescription": "Das Erhöhen dieses Caches führt zu einer angenehmerern Benutzererfahrung, aber erhöht Last und Arbeitsspeicherauslastung auf dem Nutzergerät.",
	"forceShowAds": "Werbung immer anzeigen",
	"hemisphereN": "Nördliche Erdhalbkugel",
	"hemisphereS": "Südliche Erdhalbkugel",
	"hemisphere": "Hemisphäre",
	"hemisphereCaption": "Wird in einigen Client-Einstellungen zur Bestimmung der Jahreszeit verwendet.",
	"additionalEmojiDictionary": "Zusätzliche Emoji-Wörterbücher",
	"installed": "Installiert",
	"navbar": "Navigationsleiste",
	"statusbar": "Statusleiste",
	"deck": "Deck",
	"customCss": "Benutzerdefiniertes CSS",
	"selectList": "Liste auswählen"
}
</locale>

<locale lang="json" locale="en-US">
{
	"preferences": "Preferences",
	"settingsPreferencesBanner": "You can configure the overall behavior of the client according to your preferences.",
	"general": "General",
	"uiLanguage": "User interface language",
	"i18nInfo": "Misskey is being translated into various languages by volunteers. You can help at {link}.",
	"auto": "Auto",
	"smartphone": "Smartphone",
	"tablet": "Tablet",
	"desktop": "Desktop",
	"overridedDeviceKind": "Device type",
	"realtimeMode": "Real-time mode",
	"settingsRealtimeMode_description": "Establishes a connection with the server and updates content in real time. This may increase traffic and memory consumption.",
	"low": "Low",
	"middle": "Medium",
	"high": "High",
	"settingsContentsUpdateFrequency": "Frequency of content retrieval",
	"settingsContentsUpdateFrequency_description": "The higher the value the more the content updates but it lowers the performance and increases the traffic and memory consumption.",
	"settingsContentsUpdateFrequency_description2": "When real-time mode is on, content is updated in real time regardless of this setting.",
	"showTitlebar": "Show title bar",
	"showAvatarDecorations": "Show avatar decorations",
	"alwaysConfirmFollow": "Always confirm when following",
	"highlightSensitiveMedia": "Highlight sensitive media",
	"confirmWhenRevealingSensitiveMedia": "Confirm when revealing sensitive media",
	"enableAdvancedMfm": "Enable advanced MFM",
	"enableInfiniteScroll": "Automatically load more",
	"native": "Native",
	"emojiStyle": "Emoji style",
	"settingsTimelineAndNote": "Timeline and note",
	"showFixedPostForm": "Display the posting form at the top of the timeline",
	"showFixedPostFormInChannel": "Display the posting form at the top of the timeline (Channels)",
	"collapseRenotes": "Collapse renotes you've already seen",
	"collapseRenotesDescription": "Collapse notes that you've reacted to or renoted before.",
	"pinnedList": "Pinned list",
	"add": "Add",
	"remove": "Delete",
	"showNoteActionsOnlyHover": "Only show note actions on hover",
	"showClipButtonInNoteFooter": "Add \"Clip\" to note action menu",
	"showReactionsCount": "See the number of reactions in notes",
	"confirmOnReact": "Confirm when reacting",
	"loadRawImages": "Load original images instead of showing thumbnails",
	"useReactionPickerForContextMenu": "Open reaction picker on right-click",
	"settingsShowAvailableReactionsFirstInNote": "Show available reactions at the top.",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"reactionsDisplaySize": "Reaction display size",
	"limitWidthOfReaction": "Limit the maximum width of reactions and display them in reduced size.",
	"default": "Default",
	"limitTo": "Limit to {x}",
	"mediaListWithOneImageAppearance": "Height of media lists with one image only",
	"showMediaListByGridInWideArea": "Display the media list in a grid when the screen width is wide",
	"instanceTickerNone": "Never show",
	"instanceTickerRemote": "Show for remote users",
	"instanceTickerAlways": "Always show",
	"instanceTicker": "Instance information of notes",
	"displayOfSensitiveMediaRespect": "Hide media marked as sensitive",
	"displayOfSensitiveMediaIgnore": "Display media marked as sensitive",
	"displayOfSensitiveMediaForce": "Hide all media",
	"displayOfSensitiveMedia": "Display of sensitive media",
	"postForm": "Posting form",
	"keepCw": "Keep content warnings",
	"rememberNoteVisibility": "Remember note visibility settings",
	"enableQuickAddMfmFunction": "Show advanced MFM picker",
	"defaultNoteVisibility": "Default visibility",
	"visibilityPublic": "Public",
	"visibilityHome": "Home",
	"visibilityFollowers": "Followers",
	"visibilitySpecified": "Direct",
	"visibilityDisableFederation": "Defederate",
	"notifications": "Notifications",
	"useGroupedNotifications": "Display grouped notifications",
	"leftTop": "Top left",
	"rightTop": "Top right",
	"leftBottom": "Bottom left",
	"rightBottom": "Bottom right",
	"position": "Position",
	"vertical": "Vertical",
	"horizontal": "Horizontal",
	"stackAxis": "Stacking direction",
	"notificationCheckNotificationBehavior": "Check notification appearance",
	"directMessage": "Chat with user",
	"settingsChatShowSenderName": "Show sender's name",
	"settingsChatSendOnEnter": "Press Enter to send",
	"settingsIfOn": "When turned on",
	"chatSend": "Send",
	"chatNewline": "New line",
	"settingsIfOff": "When turned off",
	"accessibility": "Accessibility",
	"settingsAccessibilityBanner": "You can personalize the client's visuals and behavior, and configure settings to optimize usage.",
	"reduceUiAnimation": "Reduce UI animations",
	"disableShowingAnimatedImages": "Don't play animated images",
	"disableShowingAnimatedImages_caption": "If animated images do not play even if this setting is disabled, it may be due to browser or OS accessibility settings, power-saving settings, or similar factors.",
	"enableAnimatedMfm": "Enable animated MFM",
	"settingsShowPageTabBarBottom": "Show page tab bar at the bottom",
	"enableHorizontalSwipe": "Swipe to switch tabs",
	"settingsEnablePullToRefresh": "Pull to Refresh",
	"settingsEnablePullToRefresh_description": "When using a mouse, drag while pressing in the scroll wheel.",
	"keepScreenOn": "Keep screen on",
	"useNativeUIForVideoAudioPlayer": "Use UI of browser when play video and audio\n",
	"settingsMakeEveryTextElementsSelectable": "Make all text elements selectable",
	"settingsMakeEveryTextElementsSelectable_description": "Enabling this may reduce usability in some situations.",
	"popup": "Pop up",
	"drawer": "Drawer",
	"menuStyle": "Menu style",
	"contextMenuApp": "Application",
	"contextMenuAppWithShift": "Application with shift key",
	"contextMenuNative": "Native",
	"contextMenuTitle": "Context menu",
	"fontSize": "Font size",
	"useSystemFont": "Use the system's default font",
	"performance": "Performance",
	"settingsUiAnimations": "UI Animations",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"settingsEnableAnimatedImages": "Enable animated images",
	"useBlurEffect": "Use blur effects in the UI",
	"useBlurEffectForModal": "Use blur effect for modals",
	"settingsEnableHighQualityImagePlaceholders": "Display placeholders for high quality images",
	"settingsUseStickyIcons": "Make icons follow while scrolling",
	"clientPerformanceIssueTipTitle": "Performance tips",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Disable your adblocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Adblockers can affect performance, please make sure that adblockers are not enabled by your system or browser features/extensions.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Disable custom CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Overriding styles can affect performance. Please make sure that custom CSS or extensions that override styles are not enabled.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Disable extensions",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Some extensions may interfere with client behavior and affect performance. Please disable your browser extensions and see if this improves the situation.",
	"dataSaver": "Data Saver",
	"reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
	"enableAll": "Enable all",
	"disableAll": "Disable all",
	"dataSaverMediaTitle": "Loading Media",
	"dataSaverMediaDescription": "Prevents images/videos from being loaded automatically. Hidden images/videos will be loaded when tapped.",
	"dataSaverAvatarTitle": "Avatar image",
	"dataSaverAvatarDescription": "Stop avatar image animation. Animated images can be larger in file size than normal images, potentially leading to further reductions in data traffic.",
	"dataSaverDisableUrlPreviewTitle": "Disable URL preview",
	"dataSaverDisableUrlPreviewDescription": "Disables the URL preview function. Unlike thumbnail images, this function reduces the loading of the linked information itself.",
	"dataSaverUrlPreviewThumbnailTitle": "Hide URL preview thumbnails",
	"dataSaverUrlPreviewThumbnailDescription": "URL preview thumbnail images will no longer be loaded.",
	"dataSaverCodeTitle": "Code highlighting",
	"dataSaverCodeDescription": "If code highlighting notations are used in MFM, etc., they will not load until tapped. Syntax highlighting requires downloading the highlight definition files for each programming language. Therefore, disabling the automatic loading of these files is expected to reduce the amount of communication data.",
	"other": "Other",
	"squareAvatars": "Display squared avatars",
	"seasonalScreenEffect": "Seasonal Screen Effect",
	"openImageInNewTab": "Open images in new tab",
	"withRepliesByDefaultForNewlyFollowed": "Include replies by newly followed users in the timeline by default",
	"serverDisconnectedBehaviorReload": "Automatically reload",
	"serverDisconnectedBehaviorDialog": "Show warning dialog",
	"serverDisconnectedBehaviorQuiet": "Show unobtrusive warning",
	"whenServerDisconnected": "When losing connection to the server",
	"numberOfPageCache": "Number of cached pages",
	"numberOfPageCacheDescription": "Increasing this number will improve convenience for but cause more load as more memory usage on the user's device.",
	"forceShowAds": "Always show ads",
	"hemisphereN": "Northern Hemisphere",
	"hemisphereS": "Southern Hemisphere",
	"hemisphere": "Where you live",
	"hemisphereCaption": "Used in some client settings to determine season.",
	"additionalEmojiDictionary": "Additional emoji dictionaries",
	"installed": "Installed",
	"navbar": "Navigation bar",
	"statusbar": "Status bar",
	"deck": "Deck",
	"customCss": "Custom CSS",
	"selectList": "Select a list"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"preferences": "Preferencias",
	"settingsPreferencesBanner": "Puedes configurar el comportamiento general del cliente según tus preferencias.",
	"general": "General",
	"uiLanguage": "Idioma de visualización de la interfaz",
	"i18nInfo": "Misskey está siendo traducido a varios idiomas gracias a voluntarios. Se puede colaborar traduciendo en {link}",
	"auto": "Automático",
	"smartphone": "Teléfono smartphone",
	"tablet": "Tablet",
	"desktop": "Escritorio",
	"overridedDeviceKind": "Tipo de dispositivo",
	"realtimeMode": "Modo en tiempo real",
	"settingsRealtimeMode_description": "Establece una conexión con el servidor y actualiza el contenido en tiempo real. Esto puede aumentar el tráfico y el consumo de memoria.",
	"low": "Baja",
	"middle": "Mediano",
	"high": "Alta",
	"settingsContentsUpdateFrequency": "Frecuencia de adquisición del contenido.",
	"settingsContentsUpdateFrequency_description": "Cuanto mayor sea el valor, más se actualiza el contenido, pero disminuye el rendimiento y aumenta el tráfico y el consumo de memoria.",
	"settingsContentsUpdateFrequency_description2": "Cuando el modo en tiempo real está activado, el contenido se actualiza en tiempo real independientemente de esta configuración.",
	"showTitlebar": "Mostrar la barra de título",
	"showAvatarDecorations": "Mostrar decoraciones de avatar",
	"alwaysConfirmFollow": "Confirmar siempre cuando se sigue a alguien",
	"highlightSensitiveMedia": "Resaltar medios marcados como sensibles",
	"confirmWhenRevealingSensitiveMedia": "Confirmación cuando se revele contenido sensible",
	"enableAdvancedMfm": "Habilitar MFM avanzado",
	"enableInfiniteScroll": "Activar scroll infinito",
	"native": "Nativo",
	"emojiStyle": "Estilo de emoji",
	"settingsTimelineAndNote": "Líneas del tiempo y notas",
	"showFixedPostForm": "Mostrar formulario de publicación sobre la línea de tiempo.",
	"showFixedPostFormInChannel": "Mostrar el formulario de publicación por encima de la cronología (Canales)",
	"collapseRenotes": "Colapsar renotas que ya hayas visto",
	"collapseRenotesDescription": "Contrae notas a las que  ya has reaccionado o renotado ",
	"pinnedList": "Lista fijada",
	"add": "Agregar",
	"remove": "Borrar",
	"showNoteActionsOnlyHover": "Mostrar acciones de la nota sólo al pasar el cursor",
	"showClipButtonInNoteFooter": "Añadir \"Clip\" al menú de notas",
	"showReactionsCount": "Mostrar el número de reacciones en las notas",
	"confirmOnReact": "Confirmar la reacción",
	"loadRawImages": "Cargar las imágenes originales en lugar de mostrar las miniaturas",
	"useReactionPickerForContextMenu": "Haga clic con el botón derecho para abrir el menu de reacciones",
	"settingsShowAvailableReactionsFirstInNote": "Mostrar las reacciones disponibles en la parte superior.",
	"small": "Pequeño",
	"medium": "Mediano",
	"large": "Grande",
	"reactionsDisplaySize": "Tamaño de las reacciones",
	"limitWidthOfReaction": "Limitar ancho de las reacciones",
	"default": "Predeterminado",
	"limitTo": "{x} hasta un máximo de",
	"mediaListWithOneImageAppearance": "Altura de la lista de medios con una sola imagen.",
	"showMediaListByGridInWideArea": "Cuando el ancho de la pantalla sea grande, muestra la lista de multimedia uno al lado del otro.",
	"instanceTickerNone": "No mostrar",
	"instanceTickerRemote": "Mostrar a usuarios remotos",
	"instanceTickerAlways": "Mostrar siempre",
	"instanceTicker": "Información de notas de la instancia",
	"displayOfSensitiveMediaRespect": "Esconder medios marcados como sensibles",
	"displayOfSensitiveMediaIgnore": "Mostrar medios marcados como sensibles",
	"displayOfSensitiveMediaForce": "Esconder toda la multimedia",
	"displayOfSensitiveMedia": "Mostrar contenido sensible",
	"postForm": "Formulario",
	"keepCw": "Mantener la advertencia de contenido",
	"rememberNoteVisibility": "Recordar visibilidad",
	"enableQuickAddMfmFunction": "Activar acceso rápido para añadir funciones MFM",
	"defaultNoteVisibility": "Visibilidad por defecto",
	"visibilityPublic": "Público",
	"visibilityHome": "Inicio",
	"visibilityFollowers": "Seguidores",
	"visibilitySpecified": "Nota directa",
	"visibilityDisableFederation": "No federado",
	"notifications": "Notificaciones",
	"useGroupedNotifications": "Mostrar notificaciones agrupadas",
	"leftTop": "Arriba a la izquierda",
	"rightTop": "Arriba a la derecha",
	"leftBottom": "Abajo a la izquierda",
	"rightBottom": "Abajo a la derecha",
	"position": "Posición",
	"vertical": "Vertical",
	"horizontal": "Horizontal",
	"stackAxis": "Dirección de apilado",
	"notificationCheckNotificationBehavior": "Comprobar comportamiento de la notificación",
	"directMessage": "Chatear",
	"settingsChatShowSenderName": "Mostrar el nombre del remitente",
	"settingsChatSendOnEnter": "Intro para enviar",
	"settingsIfOn": "Si está activado",
	"chatSend": "Enviar",
	"chatNewline": "Nueva línea",
	"settingsIfOff": "Si está desactivado",
	"accessibility": "Accesibilidad",
	"settingsAccessibilityBanner": "Puedes personalizar el aspecto y el comportamiento del cliente y configurar los ajustes para optimizar su uso.",
	"reduceUiAnimation": "Reducir la animación de la UI",
	"disableShowingAnimatedImages": "No reproducir imágenes animadas",
	"disableShowingAnimatedImages_caption": "Si las imágenes animadas no se reproducen independientemente de esta configuración, es posible que la configuración de accesibilidad del navegador o del sistema operativo, los modos de ahorro de energía o funciones similares estén interfiriendo.",
	"enableAnimatedMfm": "Habilitar MFM con movimiento",
	"settingsShowPageTabBarBottom": "Mostrar la barra de pestañas de la página en la parte inferior.",
	"enableHorizontalSwipe": "Deslice para cambiar de pestaña",
	"settingsEnablePullToRefresh": "Tirar para actualizar",
	"settingsEnablePullToRefresh_description": "Si utilizas un ratón, arrastra mientras pulsas la rueda de desplazamiento.",
	"keepScreenOn": "Mantener pantalla encendida",
	"useNativeUIForVideoAudioPlayer": "Usar la interfaz del navegador cuando se reproduce audio y vídeo",
	"settingsMakeEveryTextElementsSelectable": "Hacer que todos los elementos de texto sean seleccionables",
	"settingsMakeEveryTextElementsSelectable_description": "Activar esta opción puede reducir la usabilidad en algunas situaciones.",
	"popup": "Ventana emergente",
	"drawer": "Cajón de Aplicaciones",
	"menuStyle": "Diseño del menú",
	"contextMenuApp": "Aplicación",
	"contextMenuAppWithShift": "Aplicación con la tecla shift",
	"contextMenuNative": "Interfaz nativa (del navegador web)",
	"contextMenuTitle": "Menú contextual",
	"fontSize": "Tamaño de la letra",
	"useSystemFont": "Utilizar la tipografía por defecto del sistema",
	"performance": "Rendimiento",
	"settingsUiAnimations": "Animaciones de la interfaz de usuario",
	"turnOffToImprovePerformance": "Desactivar esto puede aumentar el rendimiento.",
	"settingsEnableAnimatedImages": "Habilitar imágenes animadas",
	"useBlurEffect": "Utilizar efecto de desenfoque en la interfaz de usuario",
	"useBlurEffectForModal": "Usar efecto borroso en modales",
	"settingsEnableHighQualityImagePlaceholders": "Mostrar marcadores de posición para imágenes de alta calidad",
	"settingsUseStickyIcons": "Hacer que los iconos te sigan cuando desplaces",
	"clientPerformanceIssueTipTitle": "Si crees que el consumo de batería es demasiado alto",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Por favor, desactiva el bloqueador de publicidad.",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Los bloqueadores de anuncios pueden afectar al rendimiento. Asegúrate de que no están activados en tu sistema o en las funciones/extensiones de tu navegador.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Desactiva el CSS personalizado",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Anular estilos puede afectar al rendimiento. Asegúrate de que el CSS personalizado o las extensiones que sobrescriben estilos no están activados.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Desactiva las extensiones ",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Algunas extensiones pueden interferir con el comportamiento del cliente y afectar al rendimiento. Por favor, deshabilita las extensiones de tu navegador y comprueba si esto mejora la situación.",
	"dataSaver": "Ahorro de datos",
	"reloadRequiredToApplySettings": "Es necesario recargar para que se aplique la configuración.",
	"enableAll": "Activar todo",
	"disableAll": "Desactivar todo",
	"dataSaverMediaTitle": "Cargando Multimedia",
	"dataSaverMediaDescription": "Desactiva la carga automática de imágenes y vídeos. Tendrás que tocar en las imágenes y vídeos ocultos para cargarlos.",
	"dataSaverAvatarTitle": "Avatares animados",
	"dataSaverAvatarDescription": "Desactiva la animación de los avatares. Las imágenes animadas pueden llegar a ser de mayor tamaño que las normales, por lo que al desactivarlas puedes reducir el consumo de datos.",
	"dataSaverDisableUrlPreviewTitle": "Desactivar la vista previa de las URL",
	"dataSaverDisableUrlPreviewDescription": "Desactiva la función de previsualización de la URL. A diferencia de solo las imágenes en miniatura, esta función  reduce la carga de la propia información vinculada.",
	"dataSaverUrlPreviewThumbnailTitle": "Ocultar las miniaturas de las vistas previas de URL",
	"dataSaverUrlPreviewThumbnailDescription": "Las imágenes en miniatura de la vista previa de URL no se pueden cargar ",
	"dataSaverCodeTitle": "Resaltar código",
	"dataSaverCodeDescription": "Si se usa resaltado de código en MFM, etc., no se cargará hasta pulsar en ello. El resaltado de sintaxis requiere la descarga de archivos de definición para cada lenguaje de programación. Debido a esto, al deshabilitar la carga automática de estos archivos reducirás el consumo de datos.",
	"other": "Otro",
	"squareAvatars": "Mostrar iconos cuadrados",
	"seasonalScreenEffect": "Efectos de pantalla asociados a estaciones",
	"openImageInNewTab": "Abrir imagen en nueva pestaña",
	"withRepliesByDefaultForNewlyFollowed": "Incluir por defecto respuestas de usuarios recién seguidos en la línea de tiempo",
	"serverDisconnectedBehaviorReload": "Recargar automáticamente",
	"serverDisconnectedBehaviorDialog": "Mostrar diálogo de advertencia",
	"serverDisconnectedBehaviorQuiet": "Advertencia discreta",
	"whenServerDisconnected": "Cuando se pierda la conexión con el servidor",
	"numberOfPageCache": "Cantidad de páginas cacheadas",
	"numberOfPageCacheDescription": "Al aumentar el número mejora la conveniencia pero también puede aumentar la carga y la memoria a usarse",
	"forceShowAds": "Siempre mostrar anuncios",
	"hemisphereN": "Hemisferio norte",
	"hemisphereS": "Hemisferio sur",
	"hemisphere": "Región",
	"hemisphereCaption": "Usado en algunos clientes para determinar la estación del año",
	"additionalEmojiDictionary": "Diccionario adicional de Emoji",
	"installed": "Instalado",
	"navbar": "Barra de navegación",
	"statusbar": "Barra de estado",
	"deck": "Deck",
	"customCss": "CSS personalizado",
	"selectList": "Selecciona una lista"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"preferences": "Preferences",
	"settingsPreferencesBanner": "You can configure the overall behavior of the client according to your preferences.",
	"general": "Général",
	"uiLanguage": "Langue d’affichage de l’interface",
	"i18nInfo": "Misskey est traduit dans différentes langues par des bénévoles. Vous pouvez contribuer à {link}.",
	"auto": "Automatique",
	"smartphone": "Smartphone",
	"tablet": "Tablette",
	"desktop": "Bureau",
	"overridedDeviceKind": "Type d’appareil",
	"realtimeMode": "Real-time mode",
	"settingsRealtimeMode_description": "Establishes a connection with the server and updates content in real time. This may increase traffic and memory consumption.",
	"low": "Basse",
	"middle": "Moyen",
	"high": "Haute",
	"settingsContentsUpdateFrequency": "Frequency of content retrieval",
	"settingsContentsUpdateFrequency_description": "The higher the value the more the content updates but it lowers the performance and increases the traffic and memory consumption.",
	"settingsContentsUpdateFrequency_description2": "When real-time mode is on, content is updated in real time regardless of this setting.",
	"showTitlebar": "Afficher la barre de titre",
	"showAvatarDecorations": "Afficher les décorations d'avatar",
	"alwaysConfirmFollow": "Confirmer lors d'un abonnement",
	"highlightSensitiveMedia": "Mettre en évidence les médias sensibles",
	"confirmWhenRevealingSensitiveMedia": "Confirmer pour révéler du contenu sensible",
	"enableAdvancedMfm": "Activer la MFM avancée",
	"enableInfiniteScroll": "Activer le défilement infini",
	"native": "Natif",
	"emojiStyle": "Style des émojis",
	"settingsTimelineAndNote": "Timeline and note",
	"showFixedPostForm": "Afficher le formulaire de publication en haut du fil d'actualité",
	"showFixedPostFormInChannel": "Afficher le formulaire de publication en haut du fil (canaux)",
	"collapseRenotes": "Réduire les renotes déjà vues",
	"collapseRenotesDescription": "Réduire les notes que vous avez renoté ou déjà réagi.",
	"pinnedList": "Liste épinglée",
	"add": "Ajouter",
	"remove": "Supprimer",
	"showNoteActionsOnlyHover": "Afficher les actions de note uniquement au survol",
	"showClipButtonInNoteFooter": "Ajouter « Clip » au menu d'action de la note",
	"showReactionsCount": "Afficher le nombre de réactions des notes",
	"confirmOnReact": "Confirm when reacting",
	"loadRawImages": "Affichage complet des images jointes au lieu des vignettes",
	"useReactionPickerForContextMenu": "Clic-droit pour ouvrir le panneau de réactions",
	"settingsShowAvailableReactionsFirstInNote": "Show available reactions at the top.",
	"small": "Petit",
	"medium": "Moyen",
	"large": "Grand",
	"reactionsDisplaySize": "Taille de l'affichage des réactions",
	"limitWidthOfReaction": "Limiter la largeur maximale des réactions et les afficher en taille réduite",
	"default": "Par défaut",
	"limitTo": "Limiter à {x}",
	"mediaListWithOneImageAppearance": "Hauteur des listes de médias n'ayant qu'une image ",
	"showMediaListByGridInWideArea": "Display the media list in a grid when the screen width is wide",
	"instanceTickerNone": "Cacher ",
	"instanceTickerRemote": "Montrer pour les utilisateur·ice·s distant·e·s",
	"instanceTickerAlways": "Toujours afficher",
	"instanceTicker": "Nom de l'instance d'origine des notes",
	"displayOfSensitiveMediaRespect": "Cacher les médias marqués comme sensibles",
	"displayOfSensitiveMediaIgnore": "Afficher les médias marqués comme sensibles",
	"displayOfSensitiveMediaForce": "Masquer tous les médias",
	"displayOfSensitiveMedia": "Afficher les médias sensibles",
	"postForm": "Formulaire de publication",
	"keepCw": "Garder le CW",
	"rememberNoteVisibility": "Se souvenir de la visibilité des notes",
	"enableQuickAddMfmFunction": "Afficher le sélecteur de MFM avancé",
	"defaultNoteVisibility": "Visibilité des notes par défaut",
	"visibilityPublic": "Public",
	"visibilityHome": "Principal",
	"visibilityFollowers": "Abonné·e·s",
	"visibilitySpecified": "Direct",
	"visibilityDisableFederation": "Défédérer",
	"notifications": "Notifications",
	"useGroupedNotifications": "Grouper les notifications",
	"leftTop": "En haut à gauche",
	"rightTop": "En haut à droite",
	"leftBottom": "En bas à gauche",
	"rightBottom": "En bas à droite",
	"position": "Position",
	"vertical": "Vertical",
	"horizontal": "Latéral",
	"stackAxis": "Direction d'empilement",
	"notificationCheckNotificationBehavior": "Check notification appearance",
	"directMessage": "Chat with user",
	"settingsChatShowSenderName": "Show sender's name",
	"settingsChatSendOnEnter": "Press Enter to send",
	"settingsIfOn": "When turned on",
	"chatSend": "Envoyer",
	"chatNewline": "New line",
	"settingsIfOff": "When turned off",
	"accessibility": "Accessibility",
	"settingsAccessibilityBanner": "You can personalize the client's visuals and behavior, and configure settings to optimize usage.",
	"reduceUiAnimation": "Réduire les animations dans l’interface",
	"disableShowingAnimatedImages": "Désactiver l'animation des images",
	"disableShowingAnimatedImages_caption": "If animated images do not play even if this setting is disabled, it may be due to browser or OS accessibility settings, power-saving settings, or similar factors.",
	"enableAnimatedMfm": "Activer le MFM animé",
	"settingsShowPageTabBarBottom": "Show page tab bar at the bottom",
	"enableHorizontalSwipe": "Glisser pour changer d'onglet",
	"settingsEnablePullToRefresh": "Pull to Refresh",
	"settingsEnablePullToRefresh_description": "When using a mouse, drag while pressing in the scroll wheel.",
	"keepScreenOn": "Garder l'écran toujours allumé",
	"useNativeUIForVideoAudioPlayer": "Lire les vidéos et audios en utilisant l'UI du navigateur",
	"settingsMakeEveryTextElementsSelectable": "Make all text elements selectable",
	"settingsMakeEveryTextElementsSelectable_description": "Enabling this may reduce usability in some situations.",
	"popup": "Pop-up",
	"drawer": "Sélecteur",
	"menuStyle": "Style du menu",
	"contextMenuApp": "Application",
	"contextMenuAppWithShift": "Application with shift key",
	"contextMenuNative": "Native",
	"contextMenuTitle": "Context menu",
	"fontSize": "Taille de la police",
	"useSystemFont": "Utiliser la police par défaut du système",
	"performance": "Performance",
	"settingsUiAnimations": "UI Animations",
	"turnOffToImprovePerformance": "Désactiver peut améliorer la performance.",
	"settingsEnableAnimatedImages": "Enable animated images",
	"useBlurEffect": "Utiliser des effets de flou dans l'interface",
	"useBlurEffectForModal": "Utiliser un effet de flou pour les modals",
	"settingsEnableHighQualityImagePlaceholders": "Display placeholders for high quality images",
	"settingsUseStickyIcons": "Make icons follow while scrolling",
	"clientPerformanceIssueTipTitle": "Performance tips",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Disable your adblocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Adblockers can affect performance, please make sure that adblockers are not enabled by your system or browser features/extensions.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Disable custom CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Overriding styles can affect performance. Please make sure that custom CSS or extensions that override styles are not enabled.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Disable extensions",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Some extensions may interfere with client behavior and affect performance. Please disable your browser extensions and see if this improves the situation.",
	"dataSaver": "Économiseur de données",
	"reloadRequiredToApplySettings": "Le rafraîchissement est nécessaire pour que les paramètres prennent effet.",
	"enableAll": "Tout activer",
	"disableAll": "Tout désactiver",
	"dataSaverMediaTitle": "Chargement des médias",
	"dataSaverMediaDescription": "Empêche le chargement automatique des images et des vidéos. Appuyez sur les images et les vidéos cachées pour les charger.",
	"dataSaverAvatarTitle": "Animation d'avatars",
	"dataSaverAvatarDescription": "Arrête l'animation d'avatars. Comme les images animées peuvent être plus volumineuses que les images normales, cela permet de réduire davantage le trafic de données.",
	"dataSaverDisableUrlPreviewTitle": "Disable URL preview",
	"dataSaverDisableUrlPreviewDescription": "Disables the URL preview function. Unlike thumbnail images, this function reduces the loading of the linked information itself.",
	"dataSaverUrlPreviewThumbnailTitle": "Cacher les aperçus des liens",
	"dataSaverUrlPreviewThumbnailDescription": "Les miniatures d'aperçu des liens ne seront plus chargés.",
	"dataSaverCodeTitle": "Mise en évidence du code",
	"dataSaverCodeDescription": "Si la notation de mise en évidence du code est utilisée, par exemple dans la MFM, elle ne sera pas chargée tant qu'elle n'aura pas été tapée. La mise en évidence du code nécessite le chargement du fichier de définition de chaque langue à mettre en évidence, mais comme ces fichiers ne sont plus chargés automatiquement, on peut s'attendre à une réduction du trafic de données.",
	"other": "Autre",
	"squareAvatars": "Avatars carrés",
	"seasonalScreenEffect": "Effet d'écran saisonnier",
	"openImageInNewTab": "Ouvrir les images dans un nouvel onglet",
	"withRepliesByDefaultForNewlyFollowed": "Afficher les réponses des nouvelles personnes que vous suivez dans le fil par défaut",
	"serverDisconnectedBehaviorReload": "Rechargement automatique",
	"serverDisconnectedBehaviorDialog": "Ouvrir une boîte de dialogue pour l'avertissement",
	"serverDisconnectedBehaviorQuiet": "Afficher un avertissement discret",
	"whenServerDisconnected": "Lorsque la connexion au serveur est perdue",
	"numberOfPageCache": "Nombre de pages en cache",
	"numberOfPageCacheDescription": "Plus de confort, mais aussi plus de poids et d'utilisation de la mémoire.",
	"forceShowAds": "Toujours afficher les publicités",
	"hemisphereN": "Northern Hemisphere",
	"hemisphereS": "Southern Hemisphere",
	"hemisphere": "Votre région",
	"hemisphereCaption": "Used in some client settings to determine season.",
	"additionalEmojiDictionary": "Dictionnaires d'émojis additionnels",
	"installed": "Installé",
	"navbar": "Barre de navigation",
	"statusbar": "Barre d’état",
	"deck": "Deck",
	"customCss": "CSS personnalisé",
	"selectList": "Sélectionner une liste"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"preferences": "Preferences",
	"settingsPreferencesBanner": "You can configure the overall behavior of the client according to your preferences.",
	"general": "Umum",
	"uiLanguage": "Bahasa antarmuka pengguna",
	"i18nInfo": "Misskey diterjemahkan ke dalam banyak bahasa oleh sukarelawan. Kamu juga dapat ikut membantu menerjemahkannya di {link}.",
	"auto": "Otomatis",
	"smartphone": "Ponsel",
	"tablet": "Tablet",
	"desktop": "Desktop",
	"overridedDeviceKind": "Tipe perangkat",
	"realtimeMode": "Real-time mode",
	"settingsRealtimeMode_description": "Establishes a connection with the server and updates content in real time. This may increase traffic and memory consumption.",
	"low": "Rendah",
	"middle": "Sedang",
	"high": "Tinggi",
	"settingsContentsUpdateFrequency": "Frekuensi pembaruan konten",
	"settingsContentsUpdateFrequency_description": "The higher the value the more the content updates but it lowers the performance and increases the traffic and memory consumption.",
	"settingsContentsUpdateFrequency_description2": "When real-time mode is on, content is updated in real time regardless of this setting.",
	"showTitlebar": "Tampilkan bilah judul",
	"showAvatarDecorations": "Tampilkan dekorasi avatar",
	"alwaysConfirmFollow": "Selalu konfirmasi ketika mengikuti",
	"highlightSensitiveMedia": "Sorot media sensitif",
	"confirmWhenRevealingSensitiveMedia": "Konfirmasi saat membuka media sensitif",
	"enableAdvancedMfm": "Nyalakan MFM tingkat lanjut",
	"enableInfiniteScroll": "Aktifkan gulir tak terbatas",
	"native": "Native",
	"emojiStyle": "Gaya emoji",
	"settingsTimelineAndNote": "Timeline and note",
	"showFixedPostForm": "Tampilkan form posting di atas lini masa",
	"showFixedPostFormInChannel": "Tampilkan form posting di atas lini masa (Kanal)",
	"collapseRenotes": "Tutup renote yang sudah kamu lihat",
	"collapseRenotesDescription": "Tutup note yang sudah kamu beri reaksi atau direnote sebelumnya.",
	"pinnedList": "Daftar yang dipin",
	"add": "Tambahkan",
	"remove": "Hapus",
	"showNoteActionsOnlyHover": "Hanya tampilkan aksi catatan saat ditunjuk",
	"showClipButtonInNoteFooter": "Tambahkan \"Klip\" ke menu aksi catatan",
	"showReactionsCount": "Lihat jumlah reaksi dalam catatan",
	"confirmOnReact": "Konfirmasi saat memberi reaksi",
	"loadRawImages": "Tampilkan lampiran gambar secara penuh daripada thumbnail",
	"useReactionPickerForContextMenu": "Buka pemilih reaksi dengan klik-kanan",
	"settingsShowAvailableReactionsFirstInNote": "Show available reactions at the top.",
	"small": "Kecil",
	"medium": "Sedang",
	"large": "Besar",
	"reactionsDisplaySize": "Ukuran tampilan reaksi",
	"limitWidthOfReaction": "Batasi lebar maksimum reaksi dan tampilkan dalam ukuran terbatasi.",
	"default": "Bawaan",
	"limitTo": "Batasi pada {x}",
	"mediaListWithOneImageAppearance": "Tinggi daftar media dengan satu gambar saja",
	"showMediaListByGridInWideArea": "Tampilkan daftar media berupa kisi-kisi ketika lebar tampilan menjadi luas",
	"instanceTickerNone": "Jangan tampilkan",
	"instanceTickerRemote": "Tampilkan untuk pengguna instansi luar",
	"instanceTickerAlways": "Selalu tampilkan",
	"instanceTicker": "Informasi pengguna pada instansi",
	"displayOfSensitiveMediaRespect": "Sembunyikan media yang ditandai sensitif",
	"displayOfSensitiveMediaIgnore": "Tampilkan media yang ditandai sensitif",
	"displayOfSensitiveMediaForce": "Sembunyikan semua media",
	"displayOfSensitiveMedia": "Tampilkan media NSFW",
	"postForm": "Buat catatan",
	"keepCw": "Biarkan peringatan konten",
	"rememberNoteVisibility": "Ingat pengaturan visibilitas catatan",
	"enableQuickAddMfmFunction": "Tampilkan pemilih MFM tingkat lanjut",
	"defaultNoteVisibility": "Privasi bawaan catatan",
	"visibilityPublic": "Publik",
	"visibilityHome": "Beranda",
	"visibilityFollowers": "Pengikut",
	"visibilitySpecified": "Langsung",
	"visibilityDisableFederation": "Matikan federasi",
	"notifications": "Notifikasi",
	"useGroupedNotifications": "Tampilkan notifikasi secara dikelompokkan",
	"leftTop": "Kiri atas",
	"rightTop": "Kanan atas",
	"leftBottom": "Kiri bawah",
	"rightBottom": "Kanan bawah",
	"position": "Posisi",
	"vertical": "Vertikal",
	"horizontal": "Horisontal",
	"stackAxis": "Arah tumpukan",
	"notificationCheckNotificationBehavior": "Cek tampilan notifikasi",
	"directMessage": "Obrolan pengguna",
	"settingsChatShowSenderName": "Show sender's name",
	"settingsChatSendOnEnter": "Press Enter to send",
	"settingsIfOn": "When turned on",
	"chatSend": "Kirim",
	"chatNewline": "New line",
	"settingsIfOff": "When turned off",
	"accessibility": "Accessibility",
	"settingsAccessibilityBanner": "You can personalize the client's visuals and behavior, and configure settings to optimize usage.",
	"reduceUiAnimation": "Kurangi animasi antarmuka",
	"disableShowingAnimatedImages": "Jangan mainkan gambar bergerak",
	"disableShowingAnimatedImages_caption": "Jika gambar bergerak tidak terputar bahkan setelah pengaturan ini dinonaktifkan, bisa jadi ini karena pengaturan aksesibilitas dari peramban atau Sistem Operasi, pengaturan hemat daya, atau hal-hal terkait lainnya.",
	"enableAnimatedMfm": "Nyalakan animasi MFM",
	"settingsShowPageTabBarBottom": "Show page tab bar at the bottom",
	"enableHorizontalSwipe": "Geser untuk mengganti tab",
	"settingsEnablePullToRefresh": "Pull to Refresh",
	"settingsEnablePullToRefresh_description": "When using a mouse, drag while pressing in the scroll wheel.",
	"keepScreenOn": "Biarkan layar tetap menyala",
	"useNativeUIForVideoAudioPlayer": "Gunakan antarmuka peramban ketika memainkan video dan audio",
	"settingsMakeEveryTextElementsSelectable": "Make all text elements selectable",
	"settingsMakeEveryTextElementsSelectable_description": "Enabling this may reduce usability in some situations.",
	"popup": "Pemunculan",
	"drawer": "Drawer",
	"menuStyle": "Gaya menu",
	"contextMenuApp": "Application",
	"contextMenuAppWithShift": "Application with shift key",
	"contextMenuNative": "Native",
	"contextMenuTitle": "Context menu",
	"fontSize": "Ukuran huruf",
	"useSystemFont": "Gunakan font bawaan sistem operasi",
	"performance": "Kinerja",
	"settingsUiAnimations": "UI Animations",
	"turnOffToImprovePerformance": "Matikan untuk tingkatkan performa.",
	"settingsEnableAnimatedImages": "Enable animated images",
	"useBlurEffect": "Gunakan efek blur pada antarmuka",
	"useBlurEffectForModal": "Gunakan efek buram untuk modal",
	"settingsEnableHighQualityImagePlaceholders": "Display placeholders for high quality images",
	"settingsUseStickyIcons": "Make icons follow while scrolling",
	"clientPerformanceIssueTipTitle": "Performance tips",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Disable your adblocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Adblockers can affect performance, please make sure that adblockers are not enabled by your system or browser features/extensions.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Disable custom CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Overriding styles can affect performance. Please make sure that custom CSS or extensions that override styles are not enabled.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Disable extensions",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Some extensions may interfere with client behavior and affect performance. Please disable your browser extensions and see if this improves the situation.",
	"dataSaver": "Penghemat data",
	"reloadRequiredToApplySettings": "Muat ulang diperlukan untuk menerapkan pengaturan.",
	"enableAll": "Aktifkan semua",
	"disableAll": "Nonaktifkan semua",
	"dataSaverMediaTitle": "Memuat media",
	"dataSaverMediaDescription": "Mencegah gambar/video dimuat secara otomatis. Menyembunyikan gambar/video dan akan dimuat ketika diketuk.",
	"dataSaverAvatarTitle": "Gambar avatar",
	"dataSaverAvatarDescription": "Hentikan animasi gambar avatar. Gambar animasi dapat berukuran lebih besar dari gambar biasa, berpotensi pada pengurangan lalu lintas data lebih jauh.",
	"dataSaverDisableUrlPreviewTitle": "Disable URL preview",
	"dataSaverDisableUrlPreviewDescription": "Disables the URL preview function. Unlike thumbnail images, this function reduces the loading of the linked information itself.",
	"dataSaverUrlPreviewThumbnailTitle": "Hide URL preview thumbnails",
	"dataSaverUrlPreviewThumbnailDescription": "URL preview thumbnail images will no longer be loaded.",
	"dataSaverCodeTitle": "Penyorotan kode",
	"dataSaverCodeDescription": "Jika notasi penyorotan kode digunakan di MFM, dll. Fungsi tersebut tidak akan dimuat apabila tidak diketuk. Penyorotan sintaks membutuhkan pengunduhan berkas definisi penyorotan untuk setiap bahasa pemrograman. Oleh sebab itu, menonaktifkan pemuatan otomatis dari berkas ini dilakukan untuk mengurangi jumlah komunikasi data.",
	"other": "Lainnya",
	"squareAvatars": "Tampilkan avatar sebagai persegi",
	"seasonalScreenEffect": "Efek layar musiman",
	"openImageInNewTab": "Buka gambar di tab baru",
	"withRepliesByDefaultForNewlyFollowed": "Termasuk balasan dari pengguna baru yang diikuti pada lini masa secara bawaan",
	"serverDisconnectedBehaviorReload": "Muat ulang otomatis",
	"serverDisconnectedBehaviorDialog": "Tampilkan dialog peringatan",
	"serverDisconnectedBehaviorQuiet": "Tampilkan peringatan tidak mengganggu",
	"whenServerDisconnected": "Ketika kehilangan koneksi dengan peladen",
	"numberOfPageCache": "Jumlah halaman ditembolokkan",
	"numberOfPageCacheDescription": "Menaikkan jumlah ini akan meningkatkan kenyamanan untuk pengguna, namun dapat menyebabkan lonjakan beban pada peladen dan juga memori yang digunakan.",
	"forceShowAds": "Selalu tampilkan iklan",
	"hemisphereN": "Bumi belahan utara",
	"hemisphereS": "Bumi belahan selatan",
	"hemisphere": "Letak kamu tinggal",
	"hemisphereCaption": "Digunakan dalam beberapa pengaturan klien untuk menentukan musim.",
	"additionalEmojiDictionary": "Kamus emoji tambahan",
	"installed": "Terpasang",
	"navbar": "Bilah navigasi",
	"statusbar": "Bilah status",
	"deck": "Dek",
	"customCss": "Custom CSS",
	"selectList": "Pilih daftar"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"preferences": "Preferenze",
	"settingsPreferencesBanner": "Puoi personalizzare il comportamento del tuo dispositivo.",
	"general": "Generali",
	"uiLanguage": "Lingua di visualizzazione dell'interfaccia",
	"i18nInfo": "Misskey è tradotto in diverse lingue da volontari. Anche tu puoi contribuire su {link}.",
	"auto": "Automatico",
	"smartphone": "Smartphone",
	"tablet": "Tablet",
	"desktop": "Desktop",
	"overridedDeviceKind": "Tipo di dispositivo",
	"realtimeMode": "Modalità in tempo reale",
	"settingsRealtimeMode_description": "Connette al server e aggiorna il contenuto in tempo reale. Potrebbe aumentare l'uso dei dati e il consumo della batteria.",
	"low": "Bassa",
	"middle": "Media",
	"high": "Alta",
	"settingsContentsUpdateFrequency": "Frequenza di ricezione contenuti",
	"settingsContentsUpdateFrequency_description": "Se l'impostazione è alta, verranno aggiornati più frequentemente, consumando più dati e più batteria.",
	"settingsContentsUpdateFrequency_description2": "Quando la modalità è in tempo reale, arriveranno a prescindere.",
	"showTitlebar": "Visualizza la barra del titolo",
	"showAvatarDecorations": "Mostra decorazione della foto profilo",
	"alwaysConfirmFollow": "Richiedi conferma per i Follow",
	"highlightSensitiveMedia": "Evidenzia i media espliciti",
	"confirmWhenRevealingSensitiveMedia": "Richiedi conferma prima di mostrare gli allegati espliciti",
	"enableAdvancedMfm": "Attivare i Misskey Flavoured Markdown (MFM) avanzati",
	"enableInfiniteScroll": "Abilita scorrimento infinito",
	"native": "Nativo",
	"emojiStyle": "Stile emoji",
	"settingsTimelineAndNote": "Note e Timeline",
	"showFixedPostForm": "Visualizzare la finestra di pubblicazione in cima alla timeline",
	"showFixedPostFormInChannel": "Per i canali, mostra il modulo di pubblicazione in cima alla timeline",
	"collapseRenotes": "Comprimi le Rinota già viste",
	"collapseRenotesDescription": "Comprimi le Note con cui hai già interagito.",
	"pinnedList": "Lista in primo piano",
	"add": "Aggiungi",
	"remove": "Elimina",
	"showNoteActionsOnlyHover": "Mostra le azioni delle Note solo al passaggio del mouse",
	"showClipButtonInNoteFooter": "Aggiungi il bottone Clip tra le azioni delle Note",
	"showReactionsCount": "Visualizza la quantità di reazioni su una nota",
	"confirmOnReact": "Confermare le reazioni",
	"loadRawImages": "Visualizza le intere immagini allegate invece delle miniature.",
	"useReactionPickerForContextMenu": "Cliccare sul tasto destro per aprire il pannello di reazioni",
	"settingsShowAvailableReactionsFirstInNote": "Mostra le reazioni disponibili in alto",
	"small": "Piccolo",
	"medium": "Medio",
	"large": "Grande",
	"reactionsDisplaySize": "Grandezza delle reazioni",
	"limitWidthOfReaction": "Limita la larghezza delle reazioni e ridimensionale",
	"default": "Predefinito",
	"limitTo": "Limita a {x}",
	"mediaListWithOneImageAppearance": "Altezza dell'elenco media con una sola immagine ",
	"showMediaListByGridInWideArea": "Quando la larghezza dello schermo è ampia, mostra i media affiancati",
	"instanceTickerNone": "Nascondi",
	"instanceTickerRemote": "Mostra solo per i profili remoti",
	"instanceTickerAlways": "Mostra sempre",
	"instanceTicker": "Informazioni sull'istanza da cui vengono le note",
	"displayOfSensitiveMediaRespect": "Nascondere i media espliciti",
	"displayOfSensitiveMediaIgnore": "Non nascondere i media espliciti",
	"displayOfSensitiveMediaForce": "Nascondi tutti i media",
	"displayOfSensitiveMedia": "Visibilità dei media espliciti",
	"postForm": "Finestra di pubblicazione",
	"keepCw": "Mostra i contenuti espliciti",
	"rememberNoteVisibility": "Ricordare le impostazioni di visibilità delle note",
	"enableQuickAddMfmFunction": "Attiva il selettore di funzioni MFM",
	"defaultNoteVisibility": "Privacy predefinita delle note",
	"visibilityPublic": "Pubblica",
	"visibilityHome": "Home",
	"visibilityFollowers": "Follower",
	"visibilitySpecified": "Nota diretta",
	"visibilityDisableFederation": "Gestisci la federazione",
	"notifications": "Notifiche",
	"useGroupedNotifications": "Mostra le notifiche raggruppate",
	"leftTop": "In alto a sinistra",
	"rightTop": "In alto a destra",
	"leftBottom": "In basso a sinistra",
	"rightBottom": "In basso a destra",
	"position": "Posizione",
	"vertical": "Verticale",
	"horizontal": "Laterale",
	"stackAxis": "Allineamento",
	"notificationCheckNotificationBehavior": "Provare il comportamento della notifica",
	"directMessage": "Chattare insieme",
	"settingsChatShowSenderName": "Mostra il nome del mittente",
	"settingsChatSendOnEnter": "Invio spedisce",
	"settingsIfOn": "Quando attivato",
	"chatSend": "Inviare",
	"chatNewline": "Nuova riga",
	"settingsIfOff": "Quando disattivato",
	"accessibility": "Accessibilità",
	"settingsAccessibilityBanner": "Puoi personalizzare e migliorare la lettura sul tuo dispositivo in modo che sia più chiaro e reattivo.",
	"reduceUiAnimation": "Ridurre le animazioni dell'interfaccia",
	"disableShowingAnimatedImages": "Disabilitare le immagini animate",
	"disableShowingAnimatedImages_caption": "L'attivazione delle animazioni immagini potrebbe interferire sull'accessibilità e sul risparmio energetico nel dispositivo.",
	"enableAnimatedMfm": "Attiva MFM animati",
	"settingsShowPageTabBarBottom": "Visualizza le schede della pagina nella parte inferiore",
	"enableHorizontalSwipe": "Trascinare per invertire le colonne",
	"settingsEnablePullToRefresh": "Scorri e aggiorna",
	"settingsEnablePullToRefresh_description": "Clicca col mouse e gira la rotella.",
	"keepScreenOn": "Mantenere lo schermo acceso",
	"useNativeUIForVideoAudioPlayer": "Riprodurre audio/video usando le funzionalità del browser",
	"settingsMakeEveryTextElementsSelectable": "Imposta ogni elemento come selezionabile",
	"settingsMakeEveryTextElementsSelectable_description": "Potrebbe ridurre l'usabilità in alcune situazioni.",
	"popup": "Popup",
	"drawer": "Drawer",
	"menuStyle": "Stile menu",
	"contextMenuApp": "Applicazione",
	"contextMenuAppWithShift": "Applicazione Shift+Tasto",
	"contextMenuNative": "Interfaccia grafica del browser",
	"contextMenuTitle": "Menu contestuale",
	"fontSize": "Dimensione carattere",
	"useSystemFont": "Usa il carattere predefinito del sistema",
	"performance": "Prestazioni",
	"settingsUiAnimations": "Animazione dell'interfaccia",
	"turnOffToImprovePerformance": "Disattiva, per migliorare le prestazioni",
	"settingsEnableAnimatedImages": "Attivare le immagini animate",
	"useBlurEffect": "Utilizza effetto sfocatura",
	"useBlurEffectForModal": "Utilizza effetto sfocatura per le finestre modali",
	"settingsEnableHighQualityImagePlaceholders": "Mostra un segnaposto per immagini in alta qualità",
	"settingsUseStickyIcons": "Fissa le icone durante lo scorrimento",
	"clientPerformanceIssueTipTitle": "Se ritieni che la batteria si stia scaricando troppo",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Disattiva il tuo AdBlocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Gli AdBlocker possono influire sulle prestazioni. Controlla se nel tuo sistema operativo, nel browser o nei componenti aggiuntivi è abilitato un AdBlocker.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Disabilita CSS personalizzato",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "La riscrittura degli stili CSS può influire sulle prestazioni. Assicurati di non avere CSS personalizzati o estensioni abilitate che sovrascrivano i tuoi stili.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Disabilitare le estensioni",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Alcune estensioni potrebbero interferire con il funzionamento del client e comprometterne le prestazioni. Prova a disattivare le estensioni del browser e vedi se il problema persiste.",
	"dataSaver": "Risparmia dati",
	"reloadRequiredToApplySettings": "Per applicare le impostazioni, occorre ricaricare.",
	"enableAll": "Abilita tutto",
	"disableAll": "Disabilitare tutto",
	"dataSaverMediaTitle": "Caricamento dei media",
	"dataSaverMediaDescription": "Impedire il caricamento automatico di immagini e video. Devi toccare le immagini o i video nascosti per caricarli.",
	"dataSaverAvatarTitle": "Immagine del profilo",
	"dataSaverAvatarDescription": "Impedire l'animazione per l'immagine del profilo. Le immagini animate possono avere dimensioni file maggiori rispetto a quelle normali, puoi ridurre ulteriormente l'utilizzo dei dati.",
	"dataSaverDisableUrlPreviewTitle": "Disabilita l'anteprima URL",
	"dataSaverDisableUrlPreviewDescription": "Disabilita la funzione di anteprima URL. A differenza di una semplice immagine in miniatura, questo riduce il tempo necessario per caricare le informazioni collegate.",
	"dataSaverUrlPreviewThumbnailTitle": "Nascondi le miniature nell'anteprima URL",
	"dataSaverUrlPreviewThumbnailDescription": "Le immagini in miniatura nell'anteprima URL non verranno più caricate.",
	"dataSaverCodeTitle": "Codice evidenziato",
	"dataSaverCodeDescription": "Impedire che il codice sorgente sia automaticamente evidenziato. Evidenziare il codice richiede il caricamento di un file per ogni linguaggio. Puoi evidenziare soltanto il codice che intendi leggere e ridurre il traffico inutilizzato.",
	"other": "Eccetera",
	"squareAvatars": "Foto profilo squadrate",
	"seasonalScreenEffect": "Abilita gli effetti speciali stagionali",
	"openImageInNewTab": "Apri le immagini in un nuovo tab",
	"withRepliesByDefaultForNewlyFollowed": "Quando segui nuovi profili, includi le risposte in TL come impostazione predefinita",
	"serverDisconnectedBehaviorReload": "Ricarica automaticamente",
	"serverDisconnectedBehaviorDialog": "Apri avviso in finestra",
	"serverDisconnectedBehaviorQuiet": "Visualizza avviso in modo discreto",
	"whenServerDisconnected": "Quando la connessione col server è persa",
	"numberOfPageCache": "Quantità di pagine in cache",
	"numberOfPageCacheDescription": "Aumenta l'usabilità, ma aumenta anche il carico e l'utilizzo della memoria.",
	"forceShowAds": "Mostra sempre i banner",
	"hemisphereN": "Emisfero boreale",
	"hemisphereS": "Emisfero australe",
	"hemisphere": "Geolocalizzazione",
	"hemisphereCaption": "Utile per alcune impostazioni del client, per determinare la stagione.",
	"additionalEmojiDictionary": "Dizionario aggiuntivo emoji",
	"installed": "Installazione avvenuta",
	"navbar": "Barra di navigazione",
	"statusbar": "Barra di stato",
	"deck": "Deck",
	"customCss": "CSS personalizzato",
	"selectList": "Seleziona una lista"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"preferences": "環境設定",
	"settingsPreferencesBanner": "好みに応じた、クライアントの全体的な動作の設定が行えます。",
	"general": "全般",
	"uiLanguage": "UIの表示言語",
	"i18nInfo": "Misskeyは有志によって様々な言語に翻訳されています。{link}で翻訳に協力できます。",
	"auto": "自動",
	"smartphone": "スマートフォン",
	"tablet": "タブレット",
	"desktop": "デスクトップ",
	"overridedDeviceKind": "デバイスタイプ",
	"realtimeMode": "リアルタイムモード",
	"settingsRealtimeMode_description": "サーバーと接続を確立し、リアルタイムでコンテンツを更新します。通信量とバッテリーの消費が多くなる場合があります。",
	"low": "低",
	"middle": "中",
	"high": "高",
	"settingsContentsUpdateFrequency": "コンテンツの取得頻度",
	"settingsContentsUpdateFrequency_description": "高いほどリアルタイムにコンテンツが更新されますが、パフォーマンスが低下し、通信量とバッテリーの消費が多くなります。",
	"settingsContentsUpdateFrequency_description2": "リアルタイムモードがオンのときは、この設定に関わらずリアルタイムでコンテンツが更新されます。",
	"showTitlebar": "タイトルバーを表示する",
	"showAvatarDecorations": "アイコンのデコレーションを表示",
	"alwaysConfirmFollow": "フォローの際常に確認する",
	"highlightSensitiveMedia": "メディアがセンシティブであることを分かりやすく表示",
	"confirmWhenRevealingSensitiveMedia": "センシティブなメディアを表示するとき確認する",
	"enableAdvancedMfm": "高度なMFMを有効にする",
	"enableInfiniteScroll": "自動でもっと見る",
	"native": "ネイティブ",
	"emojiStyle": "絵文字のスタイル",
	"settingsTimelineAndNote": "タイムラインとノート",
	"showFixedPostForm": "タイムライン上部に投稿フォームを表示する",
	"showFixedPostFormInChannel": "タイムライン上部に投稿フォームを表示する(チャンネル)",
	"collapseRenotes": "リノートのスマート省略",
	"collapseRenotesDescription": "リアクションやリノートをしたことがあるノートをたたんで表示します。",
	"pinnedList": "ピン留めされたリスト",
	"add": "追加",
	"remove": "削除",
	"showNoteActionsOnlyHover": "ノートのアクションをホバー時のみ表示する",
	"showClipButtonInNoteFooter": "ノートのアクションにクリップを追加",
	"showReactionsCount": "ノートのリアクション数を表示する",
	"confirmOnReact": "リアクションする際に確認する",
	"loadRawImages": "添付画像のサムネイルをオリジナル画質にする",
	"useReactionPickerForContextMenu": "右クリックでリアクションピッカーを開く",
	"settingsShowAvailableReactionsFirstInNote": "利用できるリアクションを先頭に表示",
	"small": "小",
	"medium": "中",
	"large": "大",
	"reactionsDisplaySize": "リアクションの表示サイズ",
	"limitWidthOfReaction": "リアクションの最大横幅を制限し、縮小して表示する",
	"default": "デフォルト",
	"limitTo": "{x}を上限に",
	"mediaListWithOneImageAppearance": "画像が1枚のみのメディアリストの高さ",
	"showMediaListByGridInWideArea": "画面幅が広いときはメディアリストを横並びで表示する",
	"instanceTickerNone": "表示しない",
	"instanceTickerRemote": "リモートユーザーに表示",
	"instanceTickerAlways": "常に表示",
	"instanceTicker": "ノートのサーバー情報",
	"displayOfSensitiveMediaRespect": "センシティブ設定されたメディアを隠す",
	"displayOfSensitiveMediaIgnore": "センシティブ設定されたメディアを隠さない",
	"displayOfSensitiveMediaForce": "常にメディアを隠す",
	"displayOfSensitiveMedia": "センシティブなメディアの表示",
	"postForm": "投稿フォーム",
	"keepCw": "CWを維持する",
	"rememberNoteVisibility": "公開範囲を記憶する",
	"enableQuickAddMfmFunction": "高度なMFMのピッカーを表示する",
	"defaultNoteVisibility": "デフォルトの公開範囲",
	"visibilityPublic": "パブリック",
	"visibilityHome": "ホーム",
	"visibilityFollowers": "フォロワー",
	"visibilitySpecified": "指名",
	"visibilityDisableFederation": "連合なし",
	"notifications": "通知",
	"useGroupedNotifications": "通知をグルーピング",
	"leftTop": "左上",
	"rightTop": "右上",
	"leftBottom": "左下",
	"rightBottom": "右下",
	"position": "位置",
	"vertical": "縦",
	"horizontal": "横",
	"stackAxis": "スタック方向",
	"notificationCheckNotificationBehavior": "通知の表示を確かめる",
	"directMessage": "ダイレクトメッセージ",
	"settingsChatShowSenderName": "送信者の名前を表示",
	"settingsChatSendOnEnter": "Enterで送信",
	"settingsIfOn": "オンのとき",
	"chatSend": "送信",
	"chatNewline": "改行",
	"settingsIfOff": "オフのとき",
	"accessibility": "アクセシビリティ",
	"settingsAccessibilityBanner": "クライアントの視覚や動作に関するパーソナライズを行い、より最適に使用できるように設定できます。",
	"reduceUiAnimation": "UIのアニメーションを減らす",
	"disableShowingAnimatedImages": "アニメーション画像を再生しない",
	"disableShowingAnimatedImages_caption": "この設定に関わらずアニメーション画像が再生されないときは、ブラウザ・OSのアクセシビリティ設定や省電力設定等が干渉している場合があります。",
	"enableAnimatedMfm": "動きのあるMFMを有効にする",
	"settingsShowPageTabBarBottom": "ページのタブバーを下部に表示",
	"enableHorizontalSwipe": "スワイプしてタブを切り替える",
	"settingsEnablePullToRefresh": "ひっぱって更新",
	"settingsEnablePullToRefresh_description": "マウスでは、ホイールを押し込みながらドラッグします。",
	"keepScreenOn": "デバイスの画面を常にオンにする",
	"useNativeUIForVideoAudioPlayer": "動画・音声の再生にブラウザのUIを使用する",
	"settingsMakeEveryTextElementsSelectable": "全てのテキスト要素を選択可能にする",
	"settingsMakeEveryTextElementsSelectable_description": "有効にすると、一部のシチュエーションでのユーザビリティが低下する場合があります。",
	"popup": "ポップアップ",
	"drawer": "ドロワー",
	"menuStyle": "メニューのスタイル",
	"contextMenuApp": "アプリケーション",
	"contextMenuAppWithShift": "Shiftキーでアプリケーション",
	"contextMenuNative": "ブラウザのUI",
	"contextMenuTitle": "コンテキストメニュー",
	"fontSize": "フォントサイズ",
	"useSystemFont": "システムのデフォルトのフォントを使う",
	"performance": "パフォーマンス",
	"settingsUiAnimations": "UIのアニメーション",
	"turnOffToImprovePerformance": "オフにするとパフォーマンスが向上します。",
	"settingsEnableAnimatedImages": "アニメーション画像を有効にする",
	"useBlurEffect": "UIにぼかし効果を使用",
	"useBlurEffectForModal": "モーダルにぼかし効果を使用",
	"settingsEnableHighQualityImagePlaceholders": "高品質な画像のプレースホルダを表示",
	"settingsUseStickyIcons": "アイコンをスクロールに追従させる",
	"clientPerformanceIssueTipTitle": "バッテリー消費が多いと感じたら",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "アドブロッカーを無効にしてください",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "アドブロッカーはパフォーマンスに影響を及ぼすことがあります。OSの機能やブラウザの機能・アドオンなどでアドブロッカーが有効になっていないか確認してください。",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "カスタムCSSを無効にしてください",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "スタイルを上書きするとパフォーマンスに影響を及ぼすことがあります。カスタムCSSや、スタイルを上書きする拡張機能が有効になっていないか確認してください。",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "拡張機能を無効にしてください",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "一部の拡張機能はクライアントの動作に干渉しパフォーマンスに影響を及ぼすことがあります。ブラウザの拡張機能を無効にして改善するか確認してください。",
	"dataSaver": "データセーバー",
	"reloadRequiredToApplySettings": "設定の反映にはリロードが必要です。",
	"enableAll": "全て有効にする",
	"disableAll": "全て無効にする",
	"dataSaverMediaTitle": "メディアの読み込みを無効化",
	"dataSaverMediaDescription": "画像・動画が自動で読み込まれるのを防止します。隠れている画像・動画はタップすると読み込まれます。",
	"dataSaverAvatarTitle": "アイコン画像のアニメーションを無効化",
	"dataSaverAvatarDescription": "アイコン画像のアニメーションが停止します。アニメーション画像は通常の画像よりファイルサイズが大きいことがあるので、データ通信量をさらに削減できます。",
	"dataSaverDisableUrlPreviewTitle": "URLプレビューを無効化",
	"dataSaverDisableUrlPreviewDescription": "URLプレビュー機能を無効化します。サムネイル画像だけと違い、リンク先の情報の読み込み自体を削減できます。",
	"dataSaverUrlPreviewThumbnailTitle": "URLプレビューのサムネイルを非表示",
	"dataSaverUrlPreviewThumbnailDescription": "URLプレビューのサムネイル画像が読み込まれなくなります。",
	"dataSaverCodeTitle": "コードハイライトを非表示",
	"dataSaverCodeDescription": "MFMなどでコードハイライト記法が使われている場合、タップするまで読み込まれなくなります。コードハイライトではハイライトする言語ごとにその定義ファイルを読み込む必要がありますが、それらが自動で読み込まれなくなるため、通信量の削減が見込めます。",
	"other": "その他",
	"squareAvatars": "アイコンを四角形で表示",
	"seasonalScreenEffect": "季節に応じた画面の演出",
	"openImageInNewTab": "画像を新しいタブで開く",
	"withRepliesByDefaultForNewlyFollowed": "フォローする際、デフォルトで返信をTLに含むようにする",
	"serverDisconnectedBehaviorReload": "自動でリロード",
	"serverDisconnectedBehaviorDialog": "ダイアログで警告",
	"serverDisconnectedBehaviorQuiet": "控えめに警告",
	"whenServerDisconnected": "サーバーとの接続が失われたとき",
	"numberOfPageCache": "ページキャッシュ数",
	"numberOfPageCacheDescription": "多くすると利便性が向上しますが、負荷とメモリ使用量が増えます。",
	"forceShowAds": "常に広告を表示する",
	"hemisphereN": "北半球",
	"hemisphereS": "南半球",
	"hemisphere": "お住まいの地域",
	"hemisphereCaption": "一部のクライアント設定で、季節を判定するために使用します。",
	"additionalEmojiDictionary": "絵文字の追加辞書",
	"installed": "インストール済み",
	"navbar": "ナビゲーションバー",
	"statusbar": "ステータスバー",
	"deck": "デッキ",
	"customCss": "カスタムCSS",
	"selectList": "リストを選択"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"preferences": "環境設定",
	"settingsPreferencesBanner": "好みに応じた、クライアントの全体的な動作の設定ができるで。",
	"general": "全般",
	"uiLanguage": "UIの表示言語",
	"i18nInfo": "Misskeyは有志がいろんな言語に訳しとるで。{link}で翻訳に協力したってやー。",
	"auto": "自動",
	"smartphone": "スマホ",
	"tablet": "タブレット",
	"desktop": "デスクトップ",
	"overridedDeviceKind": "デバイスタイプ",
	"realtimeMode": "リアルタイムモード",
	"settingsRealtimeMode_description": "サーバーと接続を確立して、リアルタイムでコンテンツを更新するで。通信量とバッテリーの消費が多くなるかもしれへん。",
	"low": "低い",
	"middle": "ふつう",
	"high": "高い",
	"settingsContentsUpdateFrequency": "コンテンツの取得頻度",
	"settingsContentsUpdateFrequency_description": "高いほどリアルタイムにコンテンツが更新されるんやけど、そのぶんパフォーマンスが落ちるし、通信量とバッテリーの消費も増えるねん。",
	"settingsContentsUpdateFrequency_description2": "リアルタイムモードをつけてるんやったら、この設定がどうであれリアルタイムでコンテンツが更新されるで。",
	"showTitlebar": "タイトルバーを見せる",
	"showAvatarDecorations": "アイコンのデコレーション映す",
	"alwaysConfirmFollow": "フォローの際常に確認する",
	"highlightSensitiveMedia": "きわどいことをめっっちゃわかりやすくする",
	"confirmWhenRevealingSensitiveMedia": "センシティブなメディアを表示するとき確認する",
	"enableAdvancedMfm": "ややこしいMFMもありにする",
	"enableInfiniteScroll": "自動でもっと見る",
	"native": "ネイティブ",
	"emojiStyle": "絵文字のスタイル",
	"settingsTimelineAndNote": "タイムラインとノート",
	"showFixedPostForm": "タイムラインの上の方で投稿できるようにするわ",
	"showFixedPostFormInChannel": "タイムラインの上の方で投稿できるようにするわ(チャンネル)",
	"collapseRenotes": "見たことあるリノートは飛ばして表示するで",
	"collapseRenotesDescription": "リアクションやリノートをしたことがあるノートをたたんで表示するで。",
	"pinnedList": "ピン留めしはったリスト",
	"add": "増やす",
	"remove": "ほかす",
	"showNoteActionsOnlyHover": "ノートの操作部をホバー時のみ表示するで",
	"showClipButtonInNoteFooter": "ノートのアクションにクリップを追加",
	"showReactionsCount": "ノートのリアクション数を表示する",
	"confirmOnReact": "ツッコむときに確認とる",
	"loadRawImages": "添付画像のサムネイルをオリジナル画質にするで",
	"useReactionPickerForContextMenu": "右クリックでツッコミピッカーを開くようにする",
	"settingsShowAvailableReactionsFirstInNote": "利用できるリアクションを先頭に表示",
	"small": "ちいさい",
	"medium": "ふつう",
	"large": "でかい",
	"reactionsDisplaySize": "ツッコミの表示のでかさ",
	"limitWidthOfReaction": "ツッコミの最大横幅を制限して、ちっさく表示するで",
	"default": "デフォルト",
	"limitTo": "{x}をいっぱいに",
	"mediaListWithOneImageAppearance": "画像が1枚のみのメディアリストの高さ",
	"showMediaListByGridInWideArea": "画面幅が広いときはメディアリストを横並びで表示する",
	"instanceTickerNone": "表示せん",
	"instanceTickerRemote": "リモートユーザーに見せる",
	"instanceTickerAlways": "いつでも見せる",
	"instanceTicker": "ノートのサーバー情報",
	"displayOfSensitiveMediaRespect": "きわどいのは見とうない",
	"displayOfSensitiveMediaIgnore": "きわどいのも見たい",
	"displayOfSensitiveMediaForce": "常にメディアを隠すで",
	"displayOfSensitiveMedia": "きわどいやつの表示",
	"postForm": "投稿フォーム",
	"keepCw": "CWを維持するで",
	"rememberNoteVisibility": "公開範囲覚えといて",
	"enableQuickAddMfmFunction": "ややこしいMFMのピッカーを出す",
	"defaultNoteVisibility": "もとからの公開範囲",
	"visibilityPublic": "パブリック",
	"visibilityHome": "ホーム",
	"visibilityFollowers": "フォロワー",
	"visibilitySpecified": "ダイレクト",
	"visibilityDisableFederation": "連合なし",
	"notifications": "通知",
	"useGroupedNotifications": "通知をグループ分けして出すで",
	"leftTop": "左上",
	"rightTop": "右上",
	"leftBottom": "左下",
	"rightBottom": "右下",
	"position": "位置",
	"vertical": "縦",
	"horizontal": "横",
	"stackAxis": "重ねる方向",
	"notificationCheckNotificationBehavior": "通知の表示を確かめるで",
	"directMessage": "チャットしよか",
	"settingsChatShowSenderName": "送信者の名前を表示",
	"settingsChatSendOnEnter": "Enterで送信",
	"settingsIfOn": "オンのとき",
	"chatSend": "送信",
	"chatNewline": "改行",
	"settingsIfOff": "オフのとき",
	"accessibility": "アクセシビリティ",
	"settingsAccessibilityBanner": "クライアントの視覚や動作に関わるパーソナライズをして、よりええ感じに使えるように設定できるで。",
	"reduceUiAnimation": "UIの動きやアニメーションを少なする",
	"disableShowingAnimatedImages": "アニメーション画像を再生せんとくで",
	"disableShowingAnimatedImages_caption": "この設定を変えてもアニメーション画像が再生されへん時は、ブラウザとかOSのアクセシビリティ設定とか省電力設定の方が悪さしてるかもしれへんで。",
	"enableAnimatedMfm": "動きがやかましいMFMも許したる",
	"settingsShowPageTabBarBottom": "ページのタブバーを下部に表示",
	"enableHorizontalSwipe": "スワイプしてタブを切り替える",
	"settingsEnablePullToRefresh": "ひっぱって更新",
	"settingsEnablePullToRefresh_description": "マウスやったら、ホイールを押し込みながらドラッグしてな。",
	"keepScreenOn": "デバイスの画面を常にオンにすんで",
	"useNativeUIForVideoAudioPlayer": "動画・音声の再生にブラウザのUIを使用する",
	"settingsMakeEveryTextElementsSelectable": "全部のテキスト要素を選択できるようにする",
	"settingsMakeEveryTextElementsSelectable_description": "これをつけると、場面によったら使いにくくなるかもしれん。",
	"popup": "ポップアップ",
	"drawer": "ドロワー",
	"menuStyle": "メニューのスタイル",
	"contextMenuApp": "アプリ",
	"contextMenuAppWithShift": "Shiftキーでアプリ",
	"contextMenuNative": "ブラウザのUI",
	"contextMenuTitle": "コンテキストメニュー",
	"fontSize": "字の大きさ",
	"useSystemFont": "システムのデフォルトのフォントを使うで",
	"performance": "パフォーマンス",
	"settingsUiAnimations": "UIのアニメーション",
	"turnOffToImprovePerformance": "オフにしたらえらい軽うなるで。",
	"settingsEnableAnimatedImages": "アニメーション画像を有効にする",
	"useBlurEffect": "UIにぼかし効果を使うで",
	"useBlurEffectForModal": "モーダルにぼかし効果を使用",
	"settingsEnableHighQualityImagePlaceholders": "高品質な画像のプレースホルダを表示",
	"settingsUseStickyIcons": "アイコンがスクロールにひっつくようにする",
	"clientPerformanceIssueTipTitle": "バッテリーようさん食うなぁと思ったら",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "アドブロッカーを切ってみてや",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "アドブロッカーはパフォーマンスに影響があるかもしれへん。OSの機能とかブラウザの機能・アドオンとかでアドブロッカーが有効になってないか確認してや。",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "カスタムCSSを無効にしてみてや",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "スタイルを上書きするとパフォーマンスに影響があるかもしれへん。カスタムCSSとか、スタイルを上書きする拡張機能が有効になってないか確認してや。",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "拡張機能を無効にしてみてや",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "なんかの拡張機能がクライアントの動作にちょっかいをかけてパフォーマンスに影響を与えてるかもしれへん。ブラウザの拡張機能を無効にして良くなるか確認してや。",
	"dataSaver": "データケチケチ",
	"reloadRequiredToApplySettings": "設定を見るんにはリロードが必要やで。",
	"enableAll": "全部使えるようにする",
	"disableAll": "全部使えへんようにする",
	"dataSaverMediaTitle": "メディアの読み込み",
	"dataSaverMediaDescription": "絵・動画が自動で読まれるのをふせぐわ。隠れてる絵・動画はタップするとひょっこりはんしてくれんで。",
	"dataSaverAvatarTitle": "アイコンの絵",
	"dataSaverAvatarDescription": "アイコン画像のアニメが止まるで。普通の画像よりもデータ量がでかいから、もっと通信量を節約できるねん。",
	"dataSaverDisableUrlPreviewTitle": "URLプレビューを無効化",
	"dataSaverDisableUrlPreviewDescription": "URLプレビュー機能を切るで。サムネイル画像だけと違って、リンク先の情報の読み込み自体を削減できるで。",
	"dataSaverUrlPreviewThumbnailTitle": "URLプレビューのサムネイルを非表示",
	"dataSaverUrlPreviewThumbnailDescription": "URLプレビューのサムネイル画像が読み込まれへんくなるで。",
	"dataSaverCodeTitle": "コードハイライトは表示せんでええ",
	"dataSaverCodeDescription": "MFMとかでコードハイライト記法が使われてるとき、タップするまで読み込まれへんくなるで。コードハイライトではハイライトする言語ごとにその決めてるファイルを読む必要はあんねんな。けどな、それは自動で読み込まれなくなるから、通信量を少なくできることができるねん。",
	"other": "その他",
	"squareAvatars": "アイコンを四角形で表示するで",
	"seasonalScreenEffect": "季節にあった画面の動き",
	"openImageInNewTab": "画像を新しいタブで開くで",
	"withRepliesByDefaultForNewlyFollowed": "フォローする時、デフォルトで返信をタイムラインに含むようにしよか",
	"serverDisconnectedBehaviorReload": "自動でリロード",
	"serverDisconnectedBehaviorDialog": "ダイアログで警告",
	"serverDisconnectedBehaviorQuiet": "控えめに警告",
	"whenServerDisconnected": "サーバーとの接続が失くなってしもうたとき",
	"numberOfPageCache": "ページ、どんだけキャッシュすんの？",
	"numberOfPageCacheDescription": "増やすと使いやすくなるけど、負荷とメモリ使用量が増えてくで。一長一短やな。",
	"forceShowAds": "いっつも広告を映す",
	"hemisphereN": "北半球",
	"hemisphereS": "南半球",
	"hemisphere": "住んでる地域",
	"hemisphereCaption": "一部のクライアント設定で、季節を判定するのに使用するで。",
	"additionalEmojiDictionary": "絵文字の追加辞書",
	"installed": "インストールしとる",
	"navbar": "ナビゲーションバー",
	"statusbar": "ステータスバー",
	"deck": "デッキ",
	"customCss": "カスタムCSS",
	"selectList": "リストを選ぶ"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"preferences": "Preferences",
	"settingsPreferencesBanner": "You can configure the overall behavior of the client according to your preferences.",
	"general": "General",
	"uiLanguage": "Tutlayt n wegrudem",
	"i18nInfo": "Misskey is being translated into various languages by volunteers. You can help at {link}.",
	"auto": "Auto",
	"smartphone": "Smartphone",
	"tablet": "Tablet",
	"desktop": "Desktop",
	"overridedDeviceKind": "Device type",
	"realtimeMode": "Real-time mode",
	"settingsRealtimeMode_description": "Establishes a connection with the server and updates content in real time. This may increase traffic and memory consumption.",
	"low": "Low",
	"middle": "Medium",
	"high": "High",
	"settingsContentsUpdateFrequency": "Frequency of content retrieval",
	"settingsContentsUpdateFrequency_description": "The higher the value the more the content updates but it lowers the performance and increases the traffic and memory consumption.",
	"settingsContentsUpdateFrequency_description2": "When real-time mode is on, content is updated in real time regardless of this setting.",
	"showTitlebar": "Show title bar",
	"showAvatarDecorations": "Show avatar decorations",
	"alwaysConfirmFollow": "Always confirm when following",
	"highlightSensitiveMedia": "Highlight sensitive media",
	"confirmWhenRevealingSensitiveMedia": "Confirm when revealing sensitive media",
	"enableAdvancedMfm": "Enable advanced MFM",
	"enableInfiniteScroll": "Automatically load more",
	"native": "Native",
	"emojiStyle": "Emoji style",
	"settingsTimelineAndNote": "Timeline and note",
	"showFixedPostForm": "Display the posting form at the top of the timeline",
	"showFixedPostFormInChannel": "Display the posting form at the top of the timeline (Channels)",
	"collapseRenotes": "Collapse renotes you've already seen",
	"collapseRenotesDescription": "Collapse notes that you've reacted to or renoted before.",
	"pinnedList": "Pinned list",
	"add": "Add",
	"remove": "Kkes",
	"showNoteActionsOnlyHover": "Only show note actions on hover",
	"showClipButtonInNoteFooter": "Add \"Clip\" to note action menu",
	"showReactionsCount": "See the number of reactions in notes",
	"confirmOnReact": "Confirm when reacting",
	"loadRawImages": "Load original images instead of showing thumbnails",
	"useReactionPickerForContextMenu": "Open reaction picker on right-click",
	"settingsShowAvailableReactionsFirstInNote": "Show available reactions at the top.",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"reactionsDisplaySize": "Reaction display size",
	"limitWidthOfReaction": "Limit the maximum width of reactions and display them in reduced size.",
	"default": "Default",
	"limitTo": "Limit to {x}",
	"mediaListWithOneImageAppearance": "Height of media lists with one image only",
	"showMediaListByGridInWideArea": "Display the media list in a grid when the screen width is wide",
	"instanceTickerNone": "Never show",
	"instanceTickerRemote": "Show for remote users",
	"instanceTickerAlways": "Always show",
	"instanceTicker": "Instance information of notes",
	"displayOfSensitiveMediaRespect": "Hide media marked as sensitive",
	"displayOfSensitiveMediaIgnore": "Display media marked as sensitive",
	"displayOfSensitiveMediaForce": "Hide all media",
	"displayOfSensitiveMedia": "Display of sensitive media",
	"postForm": "Posting form",
	"keepCw": "Keep content warnings",
	"rememberNoteVisibility": "Remember note visibility settings",
	"enableQuickAddMfmFunction": "Show advanced MFM picker",
	"defaultNoteVisibility": "Default visibility",
	"visibilityPublic": "Public",
	"visibilityHome": "Home",
	"visibilityFollowers": "Imeḍfaṛen",
	"visibilitySpecified": "Direct",
	"visibilityDisableFederation": "Defederate",
	"notifications": "Ilɣuyen",
	"useGroupedNotifications": "Display grouped notifications",
	"leftTop": "Top left",
	"rightTop": "Top right",
	"leftBottom": "Bottom left",
	"rightBottom": "Bottom right",
	"position": "Position",
	"vertical": "Vertical",
	"horizontal": "Horizontal",
	"stackAxis": "Stacking direction",
	"notificationCheckNotificationBehavior": "Check notification appearance",
	"directMessage": "Chat with user",
	"settingsChatShowSenderName": "Show sender's name",
	"settingsChatSendOnEnter": "Press Enter to send",
	"settingsIfOn": "When turned on",
	"chatSend": "Send",
	"chatNewline": "New line",
	"settingsIfOff": "When turned off",
	"accessibility": "Accessibility",
	"settingsAccessibilityBanner": "You can personalize the client's visuals and behavior, and configure settings to optimize usage.",
	"reduceUiAnimation": "Reduce UI animations",
	"disableShowingAnimatedImages": "Don't play animated images",
	"disableShowingAnimatedImages_caption": "If animated images do not play even if this setting is disabled, it may be due to browser or OS accessibility settings, power-saving settings, or similar factors.",
	"enableAnimatedMfm": "Enable animated MFM",
	"settingsShowPageTabBarBottom": "Show page tab bar at the bottom",
	"enableHorizontalSwipe": "Swipe to switch tabs",
	"settingsEnablePullToRefresh": "Pull to Refresh",
	"settingsEnablePullToRefresh_description": "When using a mouse, drag while pressing in the scroll wheel.",
	"keepScreenOn": "Keep screen on",
	"useNativeUIForVideoAudioPlayer": "Use UI of browser when play video and audio\n",
	"settingsMakeEveryTextElementsSelectable": "Make all text elements selectable",
	"settingsMakeEveryTextElementsSelectable_description": "Enabling this may reduce usability in some situations.",
	"popup": "Pop up",
	"drawer": "Drawer",
	"menuStyle": "Menu style",
	"contextMenuApp": "Application",
	"contextMenuAppWithShift": "Application with shift key",
	"contextMenuNative": "Native",
	"contextMenuTitle": "Context menu",
	"fontSize": "Font size",
	"useSystemFont": "Use the system's default font",
	"performance": "Performance",
	"settingsUiAnimations": "UI Animations",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"settingsEnableAnimatedImages": "Enable animated images",
	"useBlurEffect": "Use blur effects in the UI",
	"useBlurEffectForModal": "Use blur effect for modals",
	"settingsEnableHighQualityImagePlaceholders": "Display placeholders for high quality images",
	"settingsUseStickyIcons": "Make icons follow while scrolling",
	"clientPerformanceIssueTipTitle": "Performance tips",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Disable your adblocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Adblockers can affect performance, please make sure that adblockers are not enabled by your system or browser features/extensions.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Disable custom CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Overriding styles can affect performance. Please make sure that custom CSS or extensions that override styles are not enabled.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Disable extensions",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Some extensions may interfere with client behavior and affect performance. Please disable your browser extensions and see if this improves the situation.",
	"dataSaver": "Data Saver",
	"reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
	"enableAll": "Enable all",
	"disableAll": "Disable all",
	"dataSaverMediaTitle": "Loading Media",
	"dataSaverMediaDescription": "Prevents images/videos from being loaded automatically. Hidden images/videos will be loaded when tapped.",
	"dataSaverAvatarTitle": "Avatar image",
	"dataSaverAvatarDescription": "Stop avatar image animation. Animated images can be larger in file size than normal images, potentially leading to further reductions in data traffic.",
	"dataSaverDisableUrlPreviewTitle": "Disable URL preview",
	"dataSaverDisableUrlPreviewDescription": "Disables the URL preview function. Unlike thumbnail images, this function reduces the loading of the linked information itself.",
	"dataSaverUrlPreviewThumbnailTitle": "Hide URL preview thumbnails",
	"dataSaverUrlPreviewThumbnailDescription": "URL preview thumbnail images will no longer be loaded.",
	"dataSaverCodeTitle": "Code highlighting",
	"dataSaverCodeDescription": "If code highlighting notations are used in MFM, etc., they will not load until tapped. Syntax highlighting requires downloading the highlight definition files for each programming language. Therefore, disabling the automatic loading of these files is expected to reduce the amount of communication data.",
	"other": "Wiyyaḍ",
	"squareAvatars": "Display squared avatars",
	"seasonalScreenEffect": "Seasonal Screen Effect",
	"openImageInNewTab": "Open images in new tab",
	"withRepliesByDefaultForNewlyFollowed": "Include replies by newly followed users in the timeline by default",
	"serverDisconnectedBehaviorReload": "Automatically reload",
	"serverDisconnectedBehaviorDialog": "Show warning dialog",
	"serverDisconnectedBehaviorQuiet": "Show unobtrusive warning",
	"whenServerDisconnected": "When losing connection to the server",
	"numberOfPageCache": "Number of cached pages",
	"numberOfPageCacheDescription": "Increasing this number will improve convenience for but cause more load as more memory usage on the user's device.",
	"forceShowAds": "Always show ads",
	"hemisphereN": "Northern Hemisphere",
	"hemisphereS": "Southern Hemisphere",
	"hemisphere": "Where you live",
	"hemisphereCaption": "Used in some client settings to determine season.",
	"additionalEmojiDictionary": "Additional emoji dictionaries",
	"installed": "Installed",
	"navbar": "Navigation bar",
	"statusbar": "Status bar",
	"deck": "Deck",
	"customCss": "Custom CSS",
	"selectList": "Fren tabdart"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"preferences": "Preferences",
	"settingsPreferencesBanner": "You can configure the overall behavior of the client according to your preferences.",
	"general": "General",
	"uiLanguage": "User interface language",
	"i18nInfo": "Misskey is being translated into various languages by volunteers. You can help at {link}.",
	"auto": "Auto",
	"smartphone": "Smartphone",
	"tablet": "Tablet",
	"desktop": "Desktop",
	"overridedDeviceKind": "Device type",
	"realtimeMode": "Real-time mode",
	"settingsRealtimeMode_description": "Establishes a connection with the server and updates content in real time. This may increase traffic and memory consumption.",
	"low": "Low",
	"middle": "Medium",
	"high": "High",
	"settingsContentsUpdateFrequency": "Frequency of content retrieval",
	"settingsContentsUpdateFrequency_description": "The higher the value the more the content updates but it lowers the performance and increases the traffic and memory consumption.",
	"settingsContentsUpdateFrequency_description2": "When real-time mode is on, content is updated in real time regardless of this setting.",
	"showTitlebar": "Show title bar",
	"showAvatarDecorations": "Show avatar decorations",
	"alwaysConfirmFollow": "Always confirm when following",
	"highlightSensitiveMedia": "Highlight sensitive media",
	"confirmWhenRevealingSensitiveMedia": "Confirm when revealing sensitive media",
	"enableAdvancedMfm": "Enable advanced MFM",
	"enableInfiniteScroll": "Automatically load more",
	"native": "Native",
	"emojiStyle": "Emoji style",
	"settingsTimelineAndNote": "Timeline and note",
	"showFixedPostForm": "Display the posting form at the top of the timeline",
	"showFixedPostFormInChannel": "Display the posting form at the top of the timeline (Channels)",
	"collapseRenotes": "Collapse renotes you've already seen",
	"collapseRenotesDescription": "Collapse notes that you've reacted to or renoted before.",
	"pinnedList": "Pinned list",
	"add": "Add",
	"remove": "ಅಳಿಸು",
	"showNoteActionsOnlyHover": "Only show note actions on hover",
	"showClipButtonInNoteFooter": "Add \"Clip\" to note action menu",
	"showReactionsCount": "See the number of reactions in notes",
	"confirmOnReact": "Confirm when reacting",
	"loadRawImages": "Load original images instead of showing thumbnails",
	"useReactionPickerForContextMenu": "Open reaction picker on right-click",
	"settingsShowAvailableReactionsFirstInNote": "Show available reactions at the top.",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"reactionsDisplaySize": "Reaction display size",
	"limitWidthOfReaction": "Limit the maximum width of reactions and display them in reduced size.",
	"default": "Default",
	"limitTo": "Limit to {x}",
	"mediaListWithOneImageAppearance": "Height of media lists with one image only",
	"showMediaListByGridInWideArea": "Display the media list in a grid when the screen width is wide",
	"instanceTickerNone": "Never show",
	"instanceTickerRemote": "Show for remote users",
	"instanceTickerAlways": "Always show",
	"instanceTicker": "Instance information of notes",
	"displayOfSensitiveMediaRespect": "Hide media marked as sensitive",
	"displayOfSensitiveMediaIgnore": "Display media marked as sensitive",
	"displayOfSensitiveMediaForce": "Hide all media",
	"displayOfSensitiveMedia": "Display of sensitive media",
	"postForm": "Posting form",
	"keepCw": "Keep content warnings",
	"rememberNoteVisibility": "Remember note visibility settings",
	"enableQuickAddMfmFunction": "Show advanced MFM picker",
	"defaultNoteVisibility": "Default visibility",
	"visibilityPublic": "Public",
	"visibilityHome": "Home",
	"visibilityFollowers": "Followers",
	"visibilitySpecified": "ನೇರ ಟಿಪ್ಪಣಿಗಳು",
	"visibilityDisableFederation": "Defederate",
	"notifications": "ಅಧಿಸೂಚನೆಗಳು",
	"useGroupedNotifications": "Display grouped notifications",
	"leftTop": "Top left",
	"rightTop": "Top right",
	"leftBottom": "Bottom left",
	"rightBottom": "Bottom right",
	"position": "Position",
	"vertical": "Vertical",
	"horizontal": "Horizontal",
	"stackAxis": "Stacking direction",
	"notificationCheckNotificationBehavior": "Check notification appearance",
	"directMessage": "Chat with user",
	"settingsChatShowSenderName": "Show sender's name",
	"settingsChatSendOnEnter": "Press Enter to send",
	"settingsIfOn": "When turned on",
	"chatSend": "Send",
	"chatNewline": "New line",
	"settingsIfOff": "When turned off",
	"accessibility": "Accessibility",
	"settingsAccessibilityBanner": "You can personalize the client's visuals and behavior, and configure settings to optimize usage.",
	"reduceUiAnimation": "Reduce UI animations",
	"disableShowingAnimatedImages": "Don't play animated images",
	"disableShowingAnimatedImages_caption": "If animated images do not play even if this setting is disabled, it may be due to browser or OS accessibility settings, power-saving settings, or similar factors.",
	"enableAnimatedMfm": "Enable animated MFM",
	"settingsShowPageTabBarBottom": "Show page tab bar at the bottom",
	"enableHorizontalSwipe": "Swipe to switch tabs",
	"settingsEnablePullToRefresh": "Pull to Refresh",
	"settingsEnablePullToRefresh_description": "When using a mouse, drag while pressing in the scroll wheel.",
	"keepScreenOn": "Keep screen on",
	"useNativeUIForVideoAudioPlayer": "Use UI of browser when play video and audio\n",
	"settingsMakeEveryTextElementsSelectable": "Make all text elements selectable",
	"settingsMakeEveryTextElementsSelectable_description": "Enabling this may reduce usability in some situations.",
	"popup": "Pop up",
	"drawer": "Drawer",
	"menuStyle": "Menu style",
	"contextMenuApp": "Application",
	"contextMenuAppWithShift": "Application with shift key",
	"contextMenuNative": "Native",
	"contextMenuTitle": "Context menu",
	"fontSize": "Font size",
	"useSystemFont": "Use the system's default font",
	"performance": "Performance",
	"settingsUiAnimations": "UI Animations",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"settingsEnableAnimatedImages": "Enable animated images",
	"useBlurEffect": "Use blur effects in the UI",
	"useBlurEffectForModal": "Use blur effect for modals",
	"settingsEnableHighQualityImagePlaceholders": "Display placeholders for high quality images",
	"settingsUseStickyIcons": "Make icons follow while scrolling",
	"clientPerformanceIssueTipTitle": "Performance tips",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Disable your adblocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Adblockers can affect performance, please make sure that adblockers are not enabled by your system or browser features/extensions.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Disable custom CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Overriding styles can affect performance. Please make sure that custom CSS or extensions that override styles are not enabled.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Disable extensions",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Some extensions may interfere with client behavior and affect performance. Please disable your browser extensions and see if this improves the situation.",
	"dataSaver": "Data Saver",
	"reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
	"enableAll": "Enable all",
	"disableAll": "Disable all",
	"dataSaverMediaTitle": "Loading Media",
	"dataSaverMediaDescription": "Prevents images/videos from being loaded automatically. Hidden images/videos will be loaded when tapped.",
	"dataSaverAvatarTitle": "Avatar image",
	"dataSaverAvatarDescription": "Stop avatar image animation. Animated images can be larger in file size than normal images, potentially leading to further reductions in data traffic.",
	"dataSaverDisableUrlPreviewTitle": "Disable URL preview",
	"dataSaverDisableUrlPreviewDescription": "Disables the URL preview function. Unlike thumbnail images, this function reduces the loading of the linked information itself.",
	"dataSaverUrlPreviewThumbnailTitle": "Hide URL preview thumbnails",
	"dataSaverUrlPreviewThumbnailDescription": "URL preview thumbnail images will no longer be loaded.",
	"dataSaverCodeTitle": "Code highlighting",
	"dataSaverCodeDescription": "If code highlighting notations are used in MFM, etc., they will not load until tapped. Syntax highlighting requires downloading the highlight definition files for each programming language. Therefore, disabling the automatic loading of these files is expected to reduce the amount of communication data.",
	"other": "Other",
	"squareAvatars": "Display squared avatars",
	"seasonalScreenEffect": "Seasonal Screen Effect",
	"openImageInNewTab": "Open images in new tab",
	"withRepliesByDefaultForNewlyFollowed": "Include replies by newly followed users in the timeline by default",
	"serverDisconnectedBehaviorReload": "Automatically reload",
	"serverDisconnectedBehaviorDialog": "Show warning dialog",
	"serverDisconnectedBehaviorQuiet": "Show unobtrusive warning",
	"whenServerDisconnected": "When losing connection to the server",
	"numberOfPageCache": "Number of cached pages",
	"numberOfPageCacheDescription": "Increasing this number will improve convenience for but cause more load as more memory usage on the user's device.",
	"forceShowAds": "Always show ads",
	"hemisphereN": "Northern Hemisphere",
	"hemisphereS": "Southern Hemisphere",
	"hemisphere": "Where you live",
	"hemisphereCaption": "Used in some client settings to determine season.",
	"additionalEmojiDictionary": "Additional emoji dictionaries",
	"installed": "Installed",
	"navbar": "Navigation bar",
	"statusbar": "Status bar",
	"deck": "Deck",
	"customCss": "Custom CSS",
	"selectList": "Select a list"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"preferences": "환경설정",
	"settingsPreferencesBanner": "취향에 알맞는 클라이언트의 전체적인 동작을 설정합니다.",
	"general": "일반",
	"uiLanguage": "UI 표시 언어",
	"i18nInfo": "Misskey는 자원봉사자들에 의해 다양한 언어로 번역되고 있습니다. {link}에서 번역에 참가할 수 있습니다.",
	"auto": "자동",
	"smartphone": "스마트폰",
	"tablet": "태블릿",
	"desktop": "데스크탑",
	"overridedDeviceKind": "장치 유형",
	"realtimeMode": "실시간 모드",
	"settingsRealtimeMode_description": "서버에 접속하고 실시간으로 콘텐츠를 업데이트합니다. 데이터 사용량과 배터리의 소비가 증가할 수 있습니다.",
	"low": "낮음",
	"middle": "보통",
	"high": "높음",
	"settingsContentsUpdateFrequency": "콘텐츠의 업데이트 빈도",
	"settingsContentsUpdateFrequency_description": "높을수록 실시간으로 콘텐츠가 업데이트됩니다만, 성능이 저하되고 데이터 사용량과 배터리의 소비가 증가합니다.",
	"settingsContentsUpdateFrequency_description2": "실시간 모드가 켜져 있을 때는 이 설정과 상관없이 실시간으로 콘텐츠가 업데이트됩니다.",
	"showTitlebar": "타이틀 바를 표시하기",
	"showAvatarDecorations": "아바타 장식 표시",
	"alwaysConfirmFollow": "팔로우일 때 항상 확인하기",
	"highlightSensitiveMedia": "미디어가 민감한 내용이라는 것을 알기 쉽게 표시",
	"confirmWhenRevealingSensitiveMedia": "민감한 미디어를 열 때 두 번 확인",
	"enableAdvancedMfm": "고급 MFM을 활성화",
	"enableInfiniteScroll": "자동으로 더 보기",
	"native": "기본",
	"emojiStyle": "이모지 스타일",
	"settingsTimelineAndNote": "타임라인과 노트",
	"showFixedPostForm": "타임라인 상단에 글 입력란을 표시",
	"showFixedPostFormInChannel": "채널 타임라인 상단에 글 입력란을 표시",
	"collapseRenotes": "이미 본 리노트를 간략화하기",
	"collapseRenotesDescription": "리액션이나 리노트를 한 노트를 접어서 표시합니다.",
	"pinnedList": "고정된 리스트",
	"add": "추가",
	"remove": "삭제",
	"showNoteActionsOnlyHover": "마우스가 올라간 때에만 노트 동작 버튼을 표시하기",
	"showClipButtonInNoteFooter": "노트 동작에 클립을 추가",
	"showReactionsCount": "노트의 리액션 수를 표시하기",
	"confirmOnReact": "리액션할 때 확인",
	"loadRawImages": "첨부한 이미지의 썸네일을 원본화질로 표시",
	"useReactionPickerForContextMenu": "우클릭하여 리액션 선택기 열기",
	"settingsShowAvailableReactionsFirstInNote": "이용 가능한 리액션을 선두로 표시",
	"small": "작게",
	"medium": "보통",
	"large": "크게",
	"reactionsDisplaySize": "리액션 표시 크기",
	"limitWidthOfReaction": "리액션의 최대 폭을 제한하고 작게 표시하기",
	"default": "기본값",
	"limitTo": "{x}로 제한",
	"mediaListWithOneImageAppearance": "이미지가 1개 뿐인 미디어 목록의 높이",
	"showMediaListByGridInWideArea": "화면 폭이 넓을 때는 미디어 목록을 가로로 표시하기",
	"instanceTickerNone": "보이지 않음",
	"instanceTickerRemote": "리모트 유저에게만 보이기",
	"instanceTickerAlways": "항상 보이기",
	"instanceTicker": "노트의 서버 정보",
	"displayOfSensitiveMediaRespect": "민감한 콘텐츠로 표시된 미디어 숨기기",
	"displayOfSensitiveMediaIgnore": "민감한 콘텐츠로 표시된 미디어 보이기",
	"displayOfSensitiveMediaForce": "미디어 항상 숨기기",
	"displayOfSensitiveMedia": "민감한 미디어 표시",
	"postForm": "글 입력란",
	"keepCw": "CW 유지하기",
	"rememberNoteVisibility": "공개 범위를 기억하기",
	"enableQuickAddMfmFunction": "상급자용 MFM 선택기 표시하기",
	"defaultNoteVisibility": "기본 공개 범위",
	"visibilityPublic": "공개",
	"visibilityHome": "홈",
	"visibilityFollowers": "팔로워",
	"visibilitySpecified": "다이렉트",
	"visibilityDisableFederation": "연합에 보내지 않기",
	"notifications": "알림",
	"useGroupedNotifications": "알림을 그룹화하고 표시",
	"leftTop": "왼쪽 상단",
	"rightTop": "오른쪽 상단",
	"leftBottom": "왼쪽 하단",
	"rightBottom": "오른쪽 하단",
	"position": "위치",
	"vertical": "세로",
	"horizontal": "가로",
	"stackAxis": "나열 방향",
	"notificationCheckNotificationBehavior": "알림 표시를 체크하기",
	"directMessage": "채팅하기",
	"settingsChatShowSenderName": "발신자 이름 표시",
	"settingsChatSendOnEnter": "엔터로 보내기",
	"settingsIfOn": "켜져 있을 때",
	"chatSend": "전송",
	"chatNewline": "줄바꿈",
	"settingsIfOff": "꺼져 있을 때",
	"accessibility": "접근성",
	"settingsAccessibilityBanner": "좀 더 쾌적하게 사용할 수 있도록 클라이언트의 시각 및 움직임에 관한 개인화 설정을 합니다.",
	"reduceUiAnimation": "UI의 애니메이션을 줄이기",
	"disableShowingAnimatedImages": "움직이는 이미지를 자동으로 재생하지 않음",
	"disableShowingAnimatedImages_caption": "이 설정에 상관없이 애니메이션 이미지가 재생되지 않을 때는 브라우저·OS의 액티비티 설정이나 절전 모드 설정 등이 간섭하고 있는 경우가 있습니다.",
	"enableAnimatedMfm": "움직임이 있는 MFM을 활성화",
	"settingsShowPageTabBarBottom": "페이지의 탭 바를 아래쪽에 표시",
	"enableHorizontalSwipe": "스와이프하여 탭 전환",
	"settingsEnablePullToRefresh": "계속해서 갱신",
	"settingsEnablePullToRefresh_description": "마우스에서 휠을 누르면서 드래그해요.",
	"keepScreenOn": "기기 화면을 항상 켜기",
	"useNativeUIForVideoAudioPlayer": "브라우저 UI에서 미디어 재생",
	"settingsMakeEveryTextElementsSelectable": "모든 텍스트 요소를 선택할 수 있도록 함",
	"settingsMakeEveryTextElementsSelectable_description": "활성화 시, 일부 동작에서 유저의 접근성이 나빠질 수도 있습니다.",
	"popup": "팝업",
	"drawer": "서랍",
	"menuStyle": "메뉴 스타일",
	"contextMenuApp": "애플리케이션",
	"contextMenuAppWithShift": "Shift 키로 애플리케이션",
	"contextMenuNative": "브라우저의 UI",
	"contextMenuTitle": "컨텍스트 메뉴",
	"fontSize": "글자 크기",
	"useSystemFont": "시스템 기본 글꼴을 사용",
	"performance": "퍼포먼스",
	"settingsUiAnimations": "UI 애니메이션",
	"turnOffToImprovePerformance": "이 기능을 끄면 성능이 향상될 수 있습니다.",
	"settingsEnableAnimatedImages": "애니메이션 이미지 활성화",
	"useBlurEffect": "UI에 흐림 효과 사용",
	"useBlurEffectForModal": "모달에 흐림 효과 사용",
	"settingsEnableHighQualityImagePlaceholders": "고화질 이미지의 플레이스홀더를 표시",
	"settingsUseStickyIcons": "아이콘이 스크롤을 따라가도록 하기",
	"clientPerformanceIssueTipTitle": "배터리 소비가 심하다고 생각되시면",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "광고 차단을 비활성화해 주십시오.",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "광고 차단은 성능에 영향을 미칠 수 있습니다. OS의 기능이나 브라우저의 기능, 애드온 등으로 광고 차단이 활성화돼있지 않은지 확인해 주십시오.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "커스텀 CSS를 무효로 해주십시오.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "스타일을 덮어쓰기하면 성능에 영향을 미칠 수 있습니다. 커스텀 CSS나 스타일을 덮어쓰기하는 확장 기능이 유효로 돼있는지 확인해주십시오.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "확장 기능을 비활성화해 주십시오.",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "일부 확장 기능은 클라이언트의 동작에 간섭해 성능에 영향을 미칠 수 있습니다. 브라우저의 확장 기능을 비활성화해 개선할지 확인해주십시오.",
	"dataSaver": "데이터 절약 모드",
	"reloadRequiredToApplySettings": "설정을 적용하려면 새로고침을 해야 합니다.",
	"enableAll": "전체 선택",
	"disableAll": "전체 해제",
	"dataSaverMediaTitle": "미디어 불러오기",
	"dataSaverMediaDescription": "사진이나 동영상을 자동으로 불러오지 않습니다. 숨겨 놓은 사진이나 동영상은 누르면 불러옵니다.",
	"dataSaverAvatarTitle": "아이콘 이미지",
	"dataSaverAvatarDescription": "아이콘 이미지의 애니메이션을 멈춥니다. 애니메이션 이미지는 일반 이미지보다 파일 크기가 클 수 있으므로 데이터 사용량을 더 줄일 수 있습니다.",
	"dataSaverDisableUrlPreviewTitle": "URL 미리보기 비활성화",
	"dataSaverDisableUrlPreviewDescription": "URL 미리보기 기능을 비활성화합니다. 섬네일 이미지와 달리 링크 정보 불러오기 자체를 줄일 수 있습니다.",
	"dataSaverUrlPreviewThumbnailTitle": "URL 미리보기의 섬네일을 비표시",
	"dataSaverUrlPreviewThumbnailDescription": "URL 미리보기의 섬네일 이미지를 불러올 수 없게 됩니다.",
	"dataSaverCodeTitle": "문자열 강조",
	"dataSaverCodeDescription": "MFM 등으로 문자열 강조 기법을 사용할 때 누르기 전에는 불러오지 않습니다. 문자열 강조에서는 강조할 언어마다 그 정의 파일을 불러와야 하지만 이를 자동으로 불러오지 않으므로 데이터 사용량을 줄일 수 있습니다.",
	"other": "기타",
	"squareAvatars": "프로필 아바타를 사각형으로 표시",
	"seasonalScreenEffect": "계절에 따른 효과 보이기",
	"openImageInNewTab": "새 탭에서 이미지 열기",
	"withRepliesByDefaultForNewlyFollowed": "팔로우 할 때 기본적으로 답글을 타임라인에 나오게 하기",
	"serverDisconnectedBehaviorReload": "자동으로 새로고침",
	"serverDisconnectedBehaviorDialog": "경고창 표시",
	"serverDisconnectedBehaviorQuiet": "조용히 경고",
	"whenServerDisconnected": "서버와의 접속이 끊겼을 때",
	"numberOfPageCache": "페이지 캐시 수",
	"numberOfPageCacheDescription": "숫자가 클 수록 편리성이 높아지지만, 시스템 자원과 메모리를 더 많이 사용합니다.",
	"forceShowAds": "광고를 항상 표시",
	"hemisphereN": "북반구",
	"hemisphereS": "남반구",
	"hemisphere": "거주 지역",
	"hemisphereCaption": "일부 클라이언트 설정에서 계절을 판단하려고 사용합니다.",
	"additionalEmojiDictionary": "이모지 추가 사전",
	"installed": "설치됨",
	"navbar": "내비게이션 바",
	"statusbar": "상태바",
	"deck": "덱",
	"customCss": "CSS 사용자화",
	"selectList": "리스트 선택"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"preferences": "Preferences",
	"settingsPreferencesBanner": "You can configure the overall behavior of the client according to your preferences.",
	"general": "Algemeen",
	"uiLanguage": "Taal van gebruikersinterface",
	"i18nInfo": "Misskey wordt in veel verschillende talen vertaald door vrijwilligers. Je kunt helpen op {link}",
	"auto": "Auto",
	"smartphone": "Smartphone",
	"tablet": "Tablet",
	"desktop": "Desktop",
	"overridedDeviceKind": "Device type",
	"realtimeMode": "Real-time mode",
	"settingsRealtimeMode_description": "Establishes a connection with the server and updates content in real time. This may increase traffic and memory consumption.",
	"low": "Lage",
	"middle": "Medium",
	"high": "Hoge",
	"settingsContentsUpdateFrequency": "Frequency of content retrieval",
	"settingsContentsUpdateFrequency_description": "The higher the value the more the content updates but it lowers the performance and increases the traffic and memory consumption.",
	"settingsContentsUpdateFrequency_description2": "When real-time mode is on, content is updated in real time regardless of this setting.",
	"showTitlebar": "Titelbalk weergeven",
	"showAvatarDecorations": "Show avatar decorations",
	"alwaysConfirmFollow": "Always confirm when following",
	"highlightSensitiveMedia": "Markeer gevoelige media",
	"confirmWhenRevealingSensitiveMedia": "Confirm when revealing sensitive media",
	"enableAdvancedMfm": "Uitgebreide MFM activeren",
	"enableInfiniteScroll": "Automatisch meer laden",
	"native": "Inheems",
	"emojiStyle": "Emoji-stijl",
	"settingsTimelineAndNote": "Timeline and note",
	"showFixedPostForm": "Het postingformulier bovenaan de tijdbalk weergeven",
	"showFixedPostFormInChannel": "Het postingformulier bovenaan de tijdbalk weergeven (Kanalen)",
	"collapseRenotes": "Renotes die je al gezien hebt, inklappen",
	"collapseRenotesDescription": "Klapt notities in waar je al op gereageerd hebt of die je al gerenotet hebt.",
	"pinnedList": "Pinned list",
	"add": "Toevoegen",
	"remove": "Verwijderen",
	"showNoteActionsOnlyHover": "Toon notitiemenu alleen bij muisaanwijzer",
	"showClipButtonInNoteFooter": "Add \"Clip\" to note action menu",
	"showReactionsCount": "Zie het aantal reacties op notities",
	"confirmOnReact": "Confirm when reacting",
	"loadRawImages": "Toon altijd originele afbeeldingen in plaats van miniaturen",
	"useReactionPickerForContextMenu": "Open reactieselectie door rechts te klikken",
	"settingsShowAvailableReactionsFirstInNote": "Show available reactions at the top.",
	"small": "Klein",
	"medium": "Medium",
	"large": "Groot",
	"reactionsDisplaySize": "Reaction display size",
	"limitWidthOfReaction": "Limiteert de maximale breedte van reacties en geef ze verkleind weer",
	"default": "Standaard",
	"limitTo": "Beperken tot {x}",
	"mediaListWithOneImageAppearance": "Hoogte van medialijsten met slechts één afbeelding",
	"showMediaListByGridInWideArea": "Display the media list in a grid when the screen width is wide",
	"instanceTickerNone": "Never show",
	"instanceTickerRemote": "Show for remote users",
	"instanceTickerAlways": "Always show",
	"instanceTicker": "Instantie-informatie van notities",
	"displayOfSensitiveMediaRespect": "Hide media marked as sensitive",
	"displayOfSensitiveMediaIgnore": "Display media marked as sensitive",
	"displayOfSensitiveMediaForce": "Hide all media",
	"displayOfSensitiveMedia": "Weergave van gevoelige media",
	"postForm": "Posting form",
	"keepCw": "Inhoudswaarschuwingen behouden",
	"rememberNoteVisibility": "Vergeet niet de notitie zichtbaarheidsinstellingen",
	"enableQuickAddMfmFunction": "Show advanced MFM picker",
	"defaultNoteVisibility": "Standaard zichtbaarheid",
	"visibilityPublic": "Public",
	"visibilityHome": "Startpagina",
	"visibilityFollowers": "Volgers",
	"visibilitySpecified": "Directe notities",
	"visibilityDisableFederation": "Defederate",
	"notifications": "Meldingen",
	"useGroupedNotifications": "Display grouped notifications",
	"leftTop": "Top left",
	"rightTop": "Top right",
	"leftBottom": "Bottom left",
	"rightBottom": "Bottom right",
	"position": "Position",
	"vertical": "Vertical",
	"horizontal": "Horizontal",
	"stackAxis": "Stacking direction",
	"notificationCheckNotificationBehavior": "Check notification appearance",
	"directMessage": "Chat with user",
	"settingsChatShowSenderName": "Show sender's name",
	"settingsChatSendOnEnter": "Press Enter to send",
	"settingsIfOn": "When turned on",
	"chatSend": "Stuur",
	"chatNewline": "New line",
	"settingsIfOff": "When turned off",
	"accessibility": "Accessibility",
	"settingsAccessibilityBanner": "You can personalize the client's visuals and behavior, and configure settings to optimize usage.",
	"reduceUiAnimation": "Verminder beweging in de UI",
	"disableShowingAnimatedImages": "Speel geen geanimeerde afbeeldingen af",
	"disableShowingAnimatedImages_caption": "If animated images do not play even if this setting is disabled, it may be due to browser or OS accessibility settings, power-saving settings, or similar factors.",
	"enableAnimatedMfm": "Geanimeerde MFM activeren",
	"settingsShowPageTabBarBottom": "Show page tab bar at the bottom",
	"enableHorizontalSwipe": "Swipe to switch tabs",
	"settingsEnablePullToRefresh": "Pull to Refresh",
	"settingsEnablePullToRefresh_description": "When using a mouse, drag while pressing in the scroll wheel.",
	"keepScreenOn": "Keep screen on",
	"useNativeUIForVideoAudioPlayer": "Use UI of browser when play video and audio\n",
	"settingsMakeEveryTextElementsSelectable": "Make all text elements selectable",
	"settingsMakeEveryTextElementsSelectable_description": "Enabling this may reduce usability in some situations.",
	"popup": "Pop-up",
	"drawer": "Lade",
	"menuStyle": "Menustijl",
	"contextMenuApp": "Application",
	"contextMenuAppWithShift": "Application with shift key",
	"contextMenuNative": "Native",
	"contextMenuTitle": "Context menu",
	"fontSize": "Lettergrootte",
	"useSystemFont": "Het standaardlettertype van het systeem gebruiken",
	"performance": "Performance",
	"settingsUiAnimations": "UI Animations",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"settingsEnableAnimatedImages": "Enable animated images",
	"useBlurEffect": "Vervagingseffecten in de UI gebruike",
	"useBlurEffectForModal": "Vervagingseffect gebruiken voor modals",
	"settingsEnableHighQualityImagePlaceholders": "Display placeholders for high quality images",
	"settingsUseStickyIcons": "Make icons follow while scrolling",
	"clientPerformanceIssueTipTitle": "Performance tips",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Disable your adblocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Adblockers can affect performance, please make sure that adblockers are not enabled by your system or browser features/extensions.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Disable custom CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Overriding styles can affect performance. Please make sure that custom CSS or extensions that override styles are not enabled.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Disable extensions",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Some extensions may interfere with client behavior and affect performance. Please disable your browser extensions and see if this improves the situation.",
	"dataSaver": "Data Saver",
	"reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
	"enableAll": "Alle activeren",
	"disableAll": "Alle deactiveren",
	"dataSaverMediaTitle": "Loading Media",
	"dataSaverMediaDescription": "Prevents images/videos from being loaded automatically. Hidden images/videos will be loaded when tapped.",
	"dataSaverAvatarTitle": "Avatar image",
	"dataSaverAvatarDescription": "Stop avatar image animation. Animated images can be larger in file size than normal images, potentially leading to further reductions in data traffic.",
	"dataSaverDisableUrlPreviewTitle": "Disable URL preview",
	"dataSaverDisableUrlPreviewDescription": "Disables the URL preview function. Unlike thumbnail images, this function reduces the loading of the linked information itself.",
	"dataSaverUrlPreviewThumbnailTitle": "Hide URL preview thumbnails",
	"dataSaverUrlPreviewThumbnailDescription": "URL preview thumbnail images will no longer be loaded.",
	"dataSaverCodeTitle": "Code highlighting",
	"dataSaverCodeDescription": "If code highlighting notations are used in MFM, etc., they will not load until tapped. Syntax highlighting requires downloading the highlight definition files for each programming language. Therefore, disabling the automatic loading of these files is expected to reduce the amount of communication data.",
	"other": "Ander",
	"squareAvatars": "Toon profielfoto's as vierkant",
	"seasonalScreenEffect": "Seasonal Screen Effect",
	"openImageInNewTab": "Afbeeldingen in nieuw tabblad openen",
	"withRepliesByDefaultForNewlyFollowed": "Toon replies van nieuw gevolgde gebruikers standaard in de tijdlijn",
	"serverDisconnectedBehaviorReload": "Automatically reload",
	"serverDisconnectedBehaviorDialog": "Show warning dialog",
	"serverDisconnectedBehaviorQuiet": "Show unobtrusive warning",
	"whenServerDisconnected": "Wanneer de verbinding met de server wordt onderbroken",
	"numberOfPageCache": "Number of cached pages",
	"numberOfPageCacheDescription": "Increasing this number will improve convenience for but cause more load as more memory usage on the user's device.",
	"forceShowAds": "Always show ads",
	"hemisphereN": "Northern Hemisphere",
	"hemisphereS": "Southern Hemisphere",
	"hemisphere": "Where you live",
	"hemisphereCaption": "Used in some client settings to determine season.",
	"additionalEmojiDictionary": "Additional emoji dictionaries",
	"installed": "Installed",
	"navbar": "Navigation bar",
	"statusbar": "Status bar",
	"deck": "Dek",
	"customCss": "Aangepaste CSS",
	"selectList": "Kies een lijst."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"preferences": "Preferences",
	"settingsPreferencesBanner": "You can configure the overall behavior of the client according to your preferences.",
	"general": "Generelt",
	"uiLanguage": "User interface language",
	"i18nInfo": "Misskey oversettes til flere språk av frivillige. Du kan hjelpe til på {link}.",
	"auto": "Automatisk",
	"smartphone": "Smarttelefon",
	"tablet": "Nettbrett",
	"desktop": "Skrivebord",
	"overridedDeviceKind": "Device type",
	"realtimeMode": "Real-time mode",
	"settingsRealtimeMode_description": "Establishes a connection with the server and updates content in real time. This may increase traffic and memory consumption.",
	"low": "Lav",
	"middle": "Medium",
	"high": "Høy",
	"settingsContentsUpdateFrequency": "Frequency of content retrieval",
	"settingsContentsUpdateFrequency_description": "The higher the value the more the content updates but it lowers the performance and increases the traffic and memory consumption.",
	"settingsContentsUpdateFrequency_description2": "When real-time mode is on, content is updated in real time regardless of this setting.",
	"showTitlebar": "Show title bar",
	"showAvatarDecorations": "Show avatar decorations",
	"alwaysConfirmFollow": "Always confirm when following",
	"highlightSensitiveMedia": "Highlight sensitive media",
	"confirmWhenRevealingSensitiveMedia": "Confirm when revealing sensitive media",
	"enableAdvancedMfm": "Enable advanced MFM",
	"enableInfiniteScroll": "Automatically load more",
	"native": "Native",
	"emojiStyle": "Emoji style",
	"settingsTimelineAndNote": "Timeline and note",
	"showFixedPostForm": "Display the posting form at the top of the timeline",
	"showFixedPostFormInChannel": "Display the posting form at the top of the timeline (Channels)",
	"collapseRenotes": "Collapse renotes you've already seen",
	"collapseRenotesDescription": "Collapse notes that you've reacted to or renoted before.",
	"pinnedList": "Pinned list",
	"add": "Legg til",
	"remove": "Slett",
	"showNoteActionsOnlyHover": "Only show note actions on hover",
	"showClipButtonInNoteFooter": "Add \"Clip\" to note action menu",
	"showReactionsCount": "See the number of reactions in notes",
	"confirmOnReact": "Confirm when reacting",
	"loadRawImages": "Load original images instead of showing thumbnails",
	"useReactionPickerForContextMenu": "Open reaction picker on right-click",
	"settingsShowAvailableReactionsFirstInNote": "Show available reactions at the top.",
	"small": "Liten",
	"medium": "Medium",
	"large": "Stor",
	"reactionsDisplaySize": "Reaction display size",
	"limitWidthOfReaction": "Limit the maximum width of reactions and display them in reduced size.",
	"default": "Standard",
	"limitTo": "Limit to {x}",
	"mediaListWithOneImageAppearance": "Height of media lists with one image only",
	"showMediaListByGridInWideArea": "Display the media list in a grid when the screen width is wide",
	"instanceTickerNone": "Ikke vis",
	"instanceTickerRemote": "Show for remote users",
	"instanceTickerAlways": "Alltid vis",
	"instanceTicker": "Instance information of notes",
	"displayOfSensitiveMediaRespect": "Hide media marked as sensitive",
	"displayOfSensitiveMediaIgnore": "Display media marked as sensitive",
	"displayOfSensitiveMediaForce": "Hide all media",
	"displayOfSensitiveMedia": "Display of sensitive media",
	"postForm": "Posting form",
	"keepCw": "Keep content warnings",
	"rememberNoteVisibility": "Husk innstillingene for synlighet av Notes",
	"enableQuickAddMfmFunction": "Show advanced MFM picker",
	"defaultNoteVisibility": "Standard synlighet",
	"visibilityPublic": "Public",
	"visibilityHome": "Hjem",
	"visibilityFollowers": "Følgere",
	"visibilitySpecified": "Direct",
	"visibilityDisableFederation": "Defederate",
	"notifications": "Varsler",
	"useGroupedNotifications": "Display grouped notifications",
	"leftTop": "Top left",
	"rightTop": "Top right",
	"leftBottom": "Bottom left",
	"rightBottom": "Bottom right",
	"position": "Position",
	"vertical": "Vertical",
	"horizontal": "Horizontal",
	"stackAxis": "Stacking direction",
	"notificationCheckNotificationBehavior": "Check notification appearance",
	"directMessage": "Chat with user",
	"settingsChatShowSenderName": "Show sender's name",
	"settingsChatSendOnEnter": "Press Enter to send",
	"settingsIfOn": "When turned on",
	"chatSend": "Send",
	"chatNewline": "New line",
	"settingsIfOff": "When turned off",
	"accessibility": "Accessibility",
	"settingsAccessibilityBanner": "You can personalize the client's visuals and behavior, and configure settings to optimize usage.",
	"reduceUiAnimation": "Reduce UI animations",
	"disableShowingAnimatedImages": "Don't play animated images",
	"disableShowingAnimatedImages_caption": "If animated images do not play even if this setting is disabled, it may be due to browser or OS accessibility settings, power-saving settings, or similar factors.",
	"enableAnimatedMfm": "Enable animated MFM",
	"settingsShowPageTabBarBottom": "Show page tab bar at the bottom",
	"enableHorizontalSwipe": "Swipe to switch tabs",
	"settingsEnablePullToRefresh": "Pull to Refresh",
	"settingsEnablePullToRefresh_description": "When using a mouse, drag while pressing in the scroll wheel.",
	"keepScreenOn": "Keep screen on",
	"useNativeUIForVideoAudioPlayer": "Use UI of browser when play video and audio\n",
	"settingsMakeEveryTextElementsSelectable": "Make all text elements selectable",
	"settingsMakeEveryTextElementsSelectable_description": "Enabling this may reduce usability in some situations.",
	"popup": "Pop up",
	"drawer": "Drawer",
	"menuStyle": "Menu style",
	"contextMenuApp": "Application",
	"contextMenuAppWithShift": "Application with shift key",
	"contextMenuNative": "Native",
	"contextMenuTitle": "Context menu",
	"fontSize": "Font size",
	"useSystemFont": "Use the system's default font",
	"performance": "Performance",
	"settingsUiAnimations": "UI Animations",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"settingsEnableAnimatedImages": "Enable animated images",
	"useBlurEffect": "Use blur effects in the UI",
	"useBlurEffectForModal": "Use blur effect for modals",
	"settingsEnableHighQualityImagePlaceholders": "Display placeholders for high quality images",
	"settingsUseStickyIcons": "Make icons follow while scrolling",
	"clientPerformanceIssueTipTitle": "Performance tips",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Disable your adblocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Adblockers can affect performance, please make sure that adblockers are not enabled by your system or browser features/extensions.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Disable custom CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Overriding styles can affect performance. Please make sure that custom CSS or extensions that override styles are not enabled.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Disable extensions",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Some extensions may interfere with client behavior and affect performance. Please disable your browser extensions and see if this improves the situation.",
	"dataSaver": "Data Saver",
	"reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
	"enableAll": "Enable all",
	"disableAll": "Disable all",
	"dataSaverMediaTitle": "Loading Media",
	"dataSaverMediaDescription": "Prevents images/videos from being loaded automatically. Hidden images/videos will be loaded when tapped.",
	"dataSaverAvatarTitle": "Avatar image",
	"dataSaverAvatarDescription": "Stop avatar image animation. Animated images can be larger in file size than normal images, potentially leading to further reductions in data traffic.",
	"dataSaverDisableUrlPreviewTitle": "Disable URL preview",
	"dataSaverDisableUrlPreviewDescription": "Disables the URL preview function. Unlike thumbnail images, this function reduces the loading of the linked information itself.",
	"dataSaverUrlPreviewThumbnailTitle": "Hide URL preview thumbnails",
	"dataSaverUrlPreviewThumbnailDescription": "URL preview thumbnail images will no longer be loaded.",
	"dataSaverCodeTitle": "Code highlighting",
	"dataSaverCodeDescription": "If code highlighting notations are used in MFM, etc., they will not load until tapped. Syntax highlighting requires downloading the highlight definition files for each programming language. Therefore, disabling the automatic loading of these files is expected to reduce the amount of communication data.",
	"other": "Andre",
	"squareAvatars": "Display squared avatars",
	"seasonalScreenEffect": "Seasonal Screen Effect",
	"openImageInNewTab": "Åpne bilder i ny fane",
	"withRepliesByDefaultForNewlyFollowed": "Include replies by newly followed users in the timeline by default",
	"serverDisconnectedBehaviorReload": "Automatically reload",
	"serverDisconnectedBehaviorDialog": "Show warning dialog",
	"serverDisconnectedBehaviorQuiet": "Show unobtrusive warning",
	"whenServerDisconnected": "When losing connection to the server",
	"numberOfPageCache": "Number of cached pages",
	"numberOfPageCacheDescription": "Increasing this number will improve convenience for but cause more load as more memory usage on the user's device.",
	"forceShowAds": "Always show ads",
	"hemisphereN": "Northern Hemisphere",
	"hemisphereS": "Southern Hemisphere",
	"hemisphere": "Where you live",
	"hemisphereCaption": "Used in some client settings to determine season.",
	"additionalEmojiDictionary": "Additional emoji dictionaries",
	"installed": "Installed",
	"navbar": "Navigation bar",
	"statusbar": "Status bar",
	"deck": "Deck",
	"customCss": "Custom CSS",
	"selectList": "Velg en liste"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"preferences": "Preferences",
	"settingsPreferencesBanner": "You can configure the overall behavior of the client according to your preferences.",
	"general": "Ogólne",
	"uiLanguage": "Język wyświetlania UI",
	"i18nInfo": "Misskey jest tłumaczone na wiele języków przez wolontariuszy. Możesz pomóc na {link}.",
	"auto": "Automatycznie",
	"smartphone": "Smartfon",
	"tablet": "Tablet",
	"desktop": "Pulpit",
	"overridedDeviceKind": "Typ urządzenia",
	"realtimeMode": "Real-time mode",
	"settingsRealtimeMode_description": "Establishes a connection with the server and updates content in real time. This may increase traffic and memory consumption.",
	"low": "Niski",
	"middle": "Średnie",
	"high": "Wysoki",
	"settingsContentsUpdateFrequency": "Frequency of content retrieval",
	"settingsContentsUpdateFrequency_description": "The higher the value the more the content updates but it lowers the performance and increases the traffic and memory consumption.",
	"settingsContentsUpdateFrequency_description2": "When real-time mode is on, content is updated in real time regardless of this setting.",
	"showTitlebar": "Pokazuj pasek tytułowy",
	"showAvatarDecorations": "Show avatar decorations",
	"alwaysConfirmFollow": "Always confirm when following",
	"highlightSensitiveMedia": "Podkreśl wrażliwą zawartość",
	"confirmWhenRevealingSensitiveMedia": "Confirm when revealing sensitive media",
	"enableAdvancedMfm": "Włącz zaawansowane MFM",
	"enableInfiniteScroll": "Włącz nieskończone przewijanie",
	"native": "Natywny",
	"emojiStyle": "Styl emoji",
	"settingsTimelineAndNote": "Timeline and note",
	"showFixedPostForm": "Wyświetlaj formularz tworzenia wpisu w górnej części osi czasu",
	"showFixedPostFormInChannel": "Wyświetl formularz postowania w górnej części osi czasu (Kanały)",
	"collapseRenotes": "Zwiń wpisy, które już zobaczyłeś",
	"collapseRenotesDescription": "Zwiń wpisy, na które już zareagowałeś lub udostępniłeś",
	"pinnedList": "Pinned list",
	"add": "Dodaj",
	"remove": "Usuń",
	"showNoteActionsOnlyHover": "Pokazuj akcje notatek tylko po najechaniu myszką",
	"showClipButtonInNoteFooter": "Add \"Clip\" to note action menu",
	"showReactionsCount": "Wyświetl liczbę reakcji na notatkę",
	"confirmOnReact": "Confirm when reacting",
	"loadRawImages": "Wyświetlaj zdjęcia w załącznikach w całości zamiast miniatur",
	"useReactionPickerForContextMenu": "Otwórz wybornik reakcji prawym kliknięciem",
	"settingsShowAvailableReactionsFirstInNote": "Show available reactions at the top.",
	"small": "Małe",
	"medium": "Średnie",
	"large": "Duże",
	"reactionsDisplaySize": "Reaction display size",
	"limitWidthOfReaction": "Limit the maximum width of reactions and display them in reduced size.",
	"default": "Domyślne",
	"limitTo": "Limituj do {x}",
	"mediaListWithOneImageAppearance": "Wysokość list multimediów z tylko jednym obrazem",
	"showMediaListByGridInWideArea": "Display the media list in a grid when the screen width is wide",
	"instanceTickerNone": "Nigdy nie pokazuj",
	"instanceTickerRemote": "Pokaż dla zdalnych użytkowników",
	"instanceTickerAlways": "Zawsze pokazuj",
	"instanceTicker": "Informacje o wpisach instancji",
	"displayOfSensitiveMediaRespect": "Hide media marked as sensitive",
	"displayOfSensitiveMediaIgnore": "Display media marked as sensitive",
	"displayOfSensitiveMediaForce": "Hide all media",
	"displayOfSensitiveMedia": "Wyświetlanie wrażliwej zawartości",
	"postForm": "Formularz tworzenia wpisu",
	"keepCw": "Zostaw ostrzeżenia o zawartości",
	"rememberNoteVisibility": "Zapamiętuj ustawienia widoczności wpisu",
	"enableQuickAddMfmFunction": "Show advanced MFM picker",
	"defaultNoteVisibility": "Domyślna widoczność",
	"visibilityPublic": "Publiczny",
	"visibilityHome": "Strona główna",
	"visibilityFollowers": "Obserwujący",
	"visibilitySpecified": "Bezpośredni",
	"visibilityDisableFederation": "Defederate",
	"notifications": "Powiadomienia",
	"useGroupedNotifications": "Display grouped notifications",
	"leftTop": "Top left",
	"rightTop": "Top right",
	"leftBottom": "Bottom left",
	"rightBottom": "Bottom right",
	"position": "Position",
	"vertical": "Vertical",
	"horizontal": "Horizontal",
	"stackAxis": "Stacking direction",
	"notificationCheckNotificationBehavior": "Check notification appearance",
	"directMessage": "Chat with user",
	"settingsChatShowSenderName": "Show sender's name",
	"settingsChatSendOnEnter": "Press Enter to send",
	"settingsIfOn": "When turned on",
	"chatSend": "Wyślij",
	"chatNewline": "New line",
	"settingsIfOff": "When turned off",
	"accessibility": "Accessibility",
	"settingsAccessibilityBanner": "You can personalize the client's visuals and behavior, and configure settings to optimize usage.",
	"reduceUiAnimation": "Ogranicz animacje w UI",
	"disableShowingAnimatedImages": "Nie odtwarzaj animowanych obrazów",
	"disableShowingAnimatedImages_caption": "If animated images do not play even if this setting is disabled, it may be due to browser or OS accessibility settings, power-saving settings, or similar factors.",
	"enableAnimatedMfm": "Włącz animowane MFM",
	"settingsShowPageTabBarBottom": "Show page tab bar at the bottom",
	"enableHorizontalSwipe": "Swipe to switch tabs",
	"settingsEnablePullToRefresh": "Pull to Refresh",
	"settingsEnablePullToRefresh_description": "When using a mouse, drag while pressing in the scroll wheel.",
	"keepScreenOn": "Keep screen on",
	"useNativeUIForVideoAudioPlayer": "Use UI of browser when play video and audio\n",
	"settingsMakeEveryTextElementsSelectable": "Make all text elements selectable",
	"settingsMakeEveryTextElementsSelectable_description": "Enabling this may reduce usability in some situations.",
	"popup": "Wyskakujące okienka",
	"drawer": "Schowek",
	"menuStyle": "Styl Menu",
	"contextMenuApp": "Application",
	"contextMenuAppWithShift": "Application with shift key",
	"contextMenuNative": "Native",
	"contextMenuTitle": "Context menu",
	"fontSize": "Rozmiar czcionki",
	"useSystemFont": "Używaj domyślnej czcionki systemu",
	"performance": "Performance",
	"settingsUiAnimations": "UI Animations",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"settingsEnableAnimatedImages": "Enable animated images",
	"useBlurEffect": "Użyj efektów rozmycia w UI",
	"useBlurEffectForModal": "Używaj efektu rozmycia w modalach",
	"settingsEnableHighQualityImagePlaceholders": "Display placeholders for high quality images",
	"settingsUseStickyIcons": "Make icons follow while scrolling",
	"clientPerformanceIssueTipTitle": "Performance tips",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Disable your adblocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Adblockers can affect performance, please make sure that adblockers are not enabled by your system or browser features/extensions.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Disable custom CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Overriding styles can affect performance. Please make sure that custom CSS or extensions that override styles are not enabled.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Disable extensions",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Some extensions may interfere with client behavior and affect performance. Please disable your browser extensions and see if this improves the situation.",
	"dataSaver": "Data Saver",
	"reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
	"enableAll": "Włącz wszystko",
	"disableAll": "Wyłącz wszystko",
	"dataSaverMediaTitle": "Loading Media",
	"dataSaverMediaDescription": "Prevents images/videos from being loaded automatically. Hidden images/videos will be loaded when tapped.",
	"dataSaverAvatarTitle": "Avatar image",
	"dataSaverAvatarDescription": "Stop avatar image animation. Animated images can be larger in file size than normal images, potentially leading to further reductions in data traffic.",
	"dataSaverDisableUrlPreviewTitle": "Disable URL preview",
	"dataSaverDisableUrlPreviewDescription": "Disables the URL preview function. Unlike thumbnail images, this function reduces the loading of the linked information itself.",
	"dataSaverUrlPreviewThumbnailTitle": "Hide URL preview thumbnails",
	"dataSaverUrlPreviewThumbnailDescription": "URL preview thumbnail images will no longer be loaded.",
	"dataSaverCodeTitle": "Code highlighting",
	"dataSaverCodeDescription": "If code highlighting notations are used in MFM, etc., they will not load until tapped. Syntax highlighting requires downloading the highlight definition files for each programming language. Therefore, disabling the automatic loading of these files is expected to reduce the amount of communication data.",
	"other": "Inne",
	"squareAvatars": "Wyświetlaj kwadratowe awatary",
	"seasonalScreenEffect": "Seasonal Screen Effect",
	"openImageInNewTab": "Otwórz obraz w nowej karcie",
	"withRepliesByDefaultForNewlyFollowed": "Domyślnie uwzględnij odpowiedzi nowo obserwowanych użytkowników w osi czasu",
	"serverDisconnectedBehaviorReload": "Automatycznie odśwież",
	"serverDisconnectedBehaviorDialog": "Pokazuj okno ostrzeżenia",
	"serverDisconnectedBehaviorQuiet": "Pokazuj nieirytujące ostrzeżenia",
	"whenServerDisconnected": "Po utracie połączenia z serwerem",
	"numberOfPageCache": "Ilość stron w cache",
	"numberOfPageCacheDescription": "Zwiększenie tej liczby polepszy wygodę, ale spowoduje większe obciążenie jako użycie pamięci na urządzeniu użytkownika.",
	"forceShowAds": "Always show ads",
	"hemisphereN": "Northern Hemisphere",
	"hemisphereS": "Southern Hemisphere",
	"hemisphere": "Where you live",
	"hemisphereCaption": "Used in some client settings to determine season.",
	"additionalEmojiDictionary": "Additional emoji dictionaries",
	"installed": "Installed",
	"navbar": "Pasek nawigacyjny",
	"statusbar": "Pasek stanu",
	"deck": "Tablica",
	"customCss": "Własny CSS",
	"selectList": "Wybierz listę"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"preferences": "Preferências",
	"settingsPreferencesBanner": "Você pode configurar o comportamento geral do cliente segundo as suas preferências.",
	"general": "Geral",
	"uiLanguage": "Idioma de exibição da interface ",
	"i18nInfo": "Misskey é traduzido para várias línguas por voluntários. Você pode ajudar com as traduções em {link}.",
	"auto": "Automático",
	"smartphone": "Celular",
	"tablet": "Tablet",
	"desktop": "Área de Trabalho",
	"overridedDeviceKind": "Sobrepor dispositivo",
	"realtimeMode": "Modo tempo-real",
	"settingsRealtimeMode_description": "Estabelece uma conexão com o servidor e atualiza o conteúdo em tempo real. Isso pode aumentar o tráfego e uso de memória.",
	"low": "Baixo",
	"middle": "Meio",
	"high": "Alto",
	"settingsContentsUpdateFrequency": "Frequência da obtenção de conteúdo",
	"settingsContentsUpdateFrequency_description": "Quanto maior o valor, mais o conteúdo atualiza. Porém, há uma diminuição do desempenho e aumento do tráfego e consumo de memória.",
	"settingsContentsUpdateFrequency_description2": "Quando o modo tempo-real está ativado, o conteúdo é atualizado em tempo real, ignorando essa opção.",
	"showTitlebar": "Exibir barra de título",
	"showAvatarDecorations": "Exibir decorações de avatar",
	"alwaysConfirmFollow": "Sempre confirmar ao seguir",
	"highlightSensitiveMedia": "Destacar mídia sensível",
	"confirmWhenRevealingSensitiveMedia": "Confirmar ao revelar mídia sensível",
	"enableAdvancedMfm": "Habilitar MFM avançado",
	"enableInfiniteScroll": "Carregar automaticamente",
	"native": "Nativo",
	"emojiStyle": "Estilo de emojis",
	"settingsTimelineAndNote": "Notas e linha do tempo",
	"showFixedPostForm": "Exibir o formulário de postagem na parte superior da linha do tempo",
	"showFixedPostFormInChannel": "Exibir o campo de postagem na parte superior da linha do tempo (canais)",
	"collapseRenotes": "Ocultar repostagens já visualizadas",
	"collapseRenotesDescription": "Colapsar notas em que você reagiu ou repostou.",
	"pinnedList": "Lista fixada",
	"add": "Adicionar",
	"remove": "Remover",
	"showNoteActionsOnlyHover": "Exibir as ações da nota somente ao passar o cursor sobre ela",
	"showClipButtonInNoteFooter": "Adicionar \"Clip\" ao menu de ação de notas",
	"showReactionsCount": "Ver o número de reações nas notas",
	"confirmOnReact": "Confirmar ao reagir",
	"loadRawImages": "Exibir as imagens originais ao invés de miniaturas",
	"useReactionPickerForContextMenu": "Clique com o botão direito do mouse para abrir o seletor de reações.",
	"settingsShowAvailableReactionsFirstInNote": "Exibir reações disponíveis no topo.",
	"small": "Pequeno",
	"medium": "Médio",
	"large": "Grande",
	"reactionsDisplaySize": "Tamanho de exibição das reações",
	"limitWidthOfReaction": "Limita o comprimento máximo de reações e as exibe em tamanho reduzido",
	"default": "Predefinição",
	"limitTo": "Até {x}",
	"mediaListWithOneImageAppearance": "Altura da lista de mídias com apenas uma imagem",
	"showMediaListByGridInWideArea": "Display the media list in a grid when the screen width is wide",
	"instanceTickerNone": "Nunca mostrar",
	"instanceTickerRemote": "Mostrar para usuários remotos",
	"instanceTickerAlways": "Sempre mostrar",
	"instanceTicker": "Informações do servidor das notas",
	"displayOfSensitiveMediaRespect": "Esconder mídia marcada como sensível",
	"displayOfSensitiveMediaIgnore": "Exibir mídia marcada como sensível",
	"displayOfSensitiveMediaForce": "Esconder toda mídia",
	"displayOfSensitiveMedia": "Exibição de mídia sensível",
	"postForm": "Campo de postagem",
	"keepCw": "Manter aviso de conteúdo",
	"rememberNoteVisibility": "Lembrar das configurações de visibilidade de notas",
	"enableQuickAddMfmFunction": "Exibir seleção avançada de MFM",
	"defaultNoteVisibility": "Visibilidade padrão",
	"visibilityPublic": "Público",
	"visibilityHome": "Início",
	"visibilityFollowers": "Seguidores",
	"visibilitySpecified": "Mensagem Direta",
	"visibilityDisableFederation": "Defederar",
	"notifications": "Notificações",
	"useGroupedNotifications": "Agrupar notificações",
	"leftTop": "Superior esquerdo",
	"rightTop": "Superior direito",
	"leftBottom": "Inferior esquerdo",
	"rightBottom": "Inferior direito",
	"position": "Posição",
	"vertical": "Vertical",
	"horizontal": "Exibir painel lateral inteiro",
	"stackAxis": "Eixo de empilhamento",
	"notificationCheckNotificationBehavior": "Verificar aparência da notificação",
	"directMessage": "Conversar com usuário",
	"settingsChatShowSenderName": "Exibir nome de usuário do remetente",
	"settingsChatSendOnEnter": "Pressionar Enter para enviar",
	"settingsIfOn": "Quando ligado",
	"chatSend": "Enviar",
	"chatNewline": "Nova linha",
	"settingsIfOff": "Quando desligado",
	"accessibility": "Acessibilidade",
	"settingsAccessibilityBanner": "Você pode personalizar o visual e comportamento do cliente, além de configurar modos de otimizar o uso.",
	"reduceUiAnimation": "Reduzir a animação da ‘interface’ do utilizador",
	"disableShowingAnimatedImages": "Não reproduzir imagens animadas",
	"disableShowingAnimatedImages_caption": "If animated images do not play even if this setting is disabled, it may be due to browser or OS accessibility settings, power-saving settings, or similar factors.",
	"enableAnimatedMfm": "Habilitar MFM animado",
	"settingsShowPageTabBarBottom": "Mostrar barra de aba da página inferiormente",
	"enableHorizontalSwipe": "Arraste para mudar de aba",
	"settingsEnablePullToRefresh": "Puxe para atualizar",
	"settingsEnablePullToRefresh_description": "Quando estiver utilizando um mouse, arraste enquanto aperta a roda de rolagem.",
	"keepScreenOn": "Manter a tela do dispositivo sempre ligada",
	"useNativeUIForVideoAudioPlayer": "Utilizar UI do navegador ao reproduzir vídeo e áudio",
	"settingsMakeEveryTextElementsSelectable": "Tornar todos os elementos de texto selecionáveis",
	"settingsMakeEveryTextElementsSelectable_description": "Habilitar isso pode reduzir a usabilidade em algumas situações",
	"popup": "Pop-up",
	"drawer": "Gaveta",
	"menuStyle": "Estilo do menu",
	"contextMenuApp": "Aplicativo",
	"contextMenuAppWithShift": "Aplicativo com a tecla shift",
	"contextMenuNative": "Nativo",
	"contextMenuTitle": "Menu de contexto",
	"fontSize": "Tamanho do texto",
	"useSystemFont": "Utilizar a fonte padrão do sistema",
	"performance": "Desempenho",
	"settingsUiAnimations": "Animações de UI",
	"turnOffToImprovePerformance": "Desligar isso pode melhorar o desempenho.",
	"settingsEnableAnimatedImages": "Enable animated images",
	"useBlurEffect": "Usar efeito de desfoque na UI",
	"useBlurEffectForModal": "Usar efeito de desfoque para modal",
	"settingsEnableHighQualityImagePlaceholders": "Exibir prévias para imagens de alta qualidade",
	"settingsUseStickyIcons": "Fazer ícones acompanharem a rolagem da tela",
	"clientPerformanceIssueTipTitle": "Dicas de desempenho",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Desative o seu bloqueador de anúncios",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Bloqueadores de anúncios podem afetar o desempenho. Certifique-se que eles não estão habilitados no seu sistema ou nos recursos/extensões do navegador. ",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Desabilite CSS personalizado",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Substituir o estilo da página pode afetar o desempenho. Certifique-se que o CSS personalizado ou extensões que modifiquem o estilo da página estejam desabilitados.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Desabilite extensões",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Algumas extensões podem afetar comportamentos do cliente e afetar o desempenho. Por favor, desative as extensões do seu navegador e veja se isso melhora a situação.",
	"dataSaver": "Economia de Dados",
	"reloadRequiredToApplySettings": "É necessário reiniciar para aplicar as configurações.",
	"enableAll": "Habilitar tudo",
	"disableAll": "Desabilitar tudo",
	"dataSaverMediaTitle": "Carregando mídia",
	"dataSaverMediaDescription": "Previne que mídia seja carregada automaticamente. Mídias escondidas serão carregadas quando selecionadas.",
	"dataSaverAvatarTitle": "Imagem do avatar",
	"dataSaverAvatarDescription": "Parar animação de avatares. Imagens animadas podem ter um arquivo mais pesado do que imagens normais, potencialmente levando a reduções no tráfego de dados.",
	"dataSaverDisableUrlPreviewTitle": "Desabilitar prévias de URL",
	"dataSaverDisableUrlPreviewDescription": "Desabilita a função de prévias de URL. Diferente das miniaturas, essa função impede o carregamento de toda informação do link.",
	"dataSaverUrlPreviewThumbnailTitle": "Esconder miniaturas em prévias de URL",
	"dataSaverUrlPreviewThumbnailDescription": "Miniaturas em prévias de URL não serão carregadas.",
	"dataSaverCodeTitle": "Destaque de código",
	"dataSaverCodeDescription": "Se as notações de formatação de código forem utilizadas em MFM, elas não irão carregar até serem selecionadas. Destaque de código exige baixar arquivos de alta definição para cada linguagem de programação. Logo, desabilitar o carregamento automático desses arquivos diminui a quantidade de informação comunicada.",
	"other": "Outros",
	"squareAvatars": "Exibir ícones quadrados",
	"seasonalScreenEffect": "Efeito de Tela Sazonal",
	"openImageInNewTab": "Abrir a imagem em uma nova aba",
	"withRepliesByDefaultForNewlyFollowed": "Incluir respostas por usuários recém-seguidos na linha do tempo por padrão",
	"serverDisconnectedBehaviorReload": "Recarregar automaticamente",
	"serverDisconnectedBehaviorDialog": "Exibir diálogo de aviso de conteúdo",
	"serverDisconnectedBehaviorQuiet": "Exibir aviso de conteúdo discreto",
	"whenServerDisconnected": "Quando a conexão com o servidor é perdida",
	"numberOfPageCache": "Número de cache de página",
	"numberOfPageCacheDescription": "Aumentar isso melhora a conveniência, mas também resulta em maior carga e uso de memória.",
	"forceShowAds": "Sempre mostrar propagandas",
	"hemisphereN": "Hemisfério Norte",
	"hemisphereS": "Hemisfério Sul",
	"hemisphere": "Onde você se localiza",
	"hemisphereCaption": "Utilizado em algumas configurações de aplicativo para determinar a estação do ano.",
	"additionalEmojiDictionary": "Dicionários adicionais de emoji",
	"installed": "Instalado",
	"navbar": "Barra de navegação",
	"statusbar": "Barra de status",
	"deck": "Deck",
	"customCss": "CSS Personalizado",
	"selectList": "Selecione uma lista"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"preferences": "Основное",
	"settingsPreferencesBanner": "Вы можете настроить общее поведение клиента по вашим предпочтениям",
	"general": "Общее",
	"uiLanguage": "Язык интерфейса",
	"i18nInfo": "Misskey переводят на разные языки добровольцы со всего света. Ваша помощь тоже пригодится здесь: {link}.",
	"auto": "Автоматически",
	"smartphone": "Смартфон",
	"tablet": "Планшет",
	"desktop": "Компьютер",
	"overridedDeviceKind": "Тип устройства",
	"realtimeMode": "Режим реального времени",
	"settingsRealtimeMode_description": "Establishes a connection with the server and updates content in real time. This may increase traffic and memory consumption.",
	"low": "Низкий",
	"middle": "Средне",
	"high": "Высокий",
	"settingsContentsUpdateFrequency": "Частота получения данных",
	"settingsContentsUpdateFrequency_description": "Чем больше значение тем больше обновляется контент, но производительность снижается и увеличивается трафик и потребление памяти.",
	"settingsContentsUpdateFrequency_description2": "Когда режим реального времени включен, контент обновляется в реальном времени вне зависимости от этой настройки.",
	"showTitlebar": "Показать заголовок",
	"showAvatarDecorations": "Показать украшения для аватара",
	"alwaysConfirmFollow": "Всегда подтверждать подписку",
	"highlightSensitiveMedia": "Выделять содержимое не для всех",
	"confirmWhenRevealingSensitiveMedia": "Спрашивать перед открытием NSFW контента",
	"enableAdvancedMfm": "Включить расширенный MFM",
	"enableInfiniteScroll": "Включить бесконечную прокрутку",
	"native": "Системные",
	"emojiStyle": "Стиль эмодзи",
	"settingsTimelineAndNote": "Лента и заметки",
	"showFixedPostForm": "Показывать поле для ввода новой заметки наверху ленты",
	"showFixedPostFormInChannel": "Показывать поле для ввода новой заметки наверху ленты (каналы)",
	"collapseRenotes": "Сворачивать увиденные репосты",
	"collapseRenotesDescription": "Сворачивать заметки с которыми вы взаимодействовали.",
	"pinnedList": "Закреплённый список",
	"add": "Добавить",
	"remove": "Удалить",
	"showNoteActionsOnlyHover": "Показывать кнопки у заметок только при наведении",
	"showClipButtonInNoteFooter": "Показать кнопку добавления в подборку в меню действий с заметкой",
	"showReactionsCount": "Видеть количество реакций на заметках",
	"confirmOnReact": "Подтверждать добавление реакции",
	"loadRawImages": "Сразу показывать изображения в полном размере",
	"useReactionPickerForContextMenu": "Открывать палитру реакций правой кнопкой",
	"settingsShowAvailableReactionsFirstInNote": "Show available reactions at the top.",
	"small": "Мелко",
	"medium": "Средне",
	"large": "Крупно",
	"reactionsDisplaySize": "Размер реакций",
	"limitWidthOfReaction": "Ограничить максимальную ширину реакций и отображать их в уменьшенном размере.",
	"default": "По умолчанию",
	"limitTo": "Ограничить до {x}",
	"mediaListWithOneImageAppearance": "Вид изображения, если оно единственное в списке",
	"showMediaListByGridInWideArea": "Показывать медиа сеткой когда экран достаточно широкий",
	"instanceTickerNone": "Не показывать",
	"instanceTickerRemote": "Только для других сайтов",
	"instanceTickerAlways": "Показывать всегда",
	"instanceTicker": "Строка с названием инстанса в заметках",
	"displayOfSensitiveMediaRespect": "Скрывать содержимое не для всех",
	"displayOfSensitiveMediaIgnore": "Показывать содержимое не для всех",
	"displayOfSensitiveMediaForce": "Скрывать всё содержимое",
	"displayOfSensitiveMedia": "Отображение содержимого не для всех",
	"postForm": "Форма отправки",
	"keepCw": "Сохраняйте предупреждения о содержимом",
	"rememberNoteVisibility": "Запоминать видимость заметок",
	"enableQuickAddMfmFunction": "Показывать расширенный выбор MFM",
	"defaultNoteVisibility": "Видимость заметок по умолчанию",
	"visibilityPublic": "Общедоступно",
	"visibilityHome": "Домашняя",
	"visibilityFollowers": "Для подписчиков",
	"visibilitySpecified": "Личное",
	"visibilityDisableFederation": "Отключить федерацию",
	"notifications": "Уведомления",
	"useGroupedNotifications": "Отображать уведомления сгруппировано",
	"leftTop": "Слева вверху",
	"rightTop": "Справа сверху",
	"leftBottom": "Слева внизу",
	"rightBottom": "Справа внизу",
	"position": "Позиция",
	"vertical": "Вертикально",
	"horizontal": "Горизонтально",
	"stackAxis": "Положение уведомлений",
	"notificationCheckNotificationBehavior": "Проверить внешний вид уведомления",
	"directMessage": "Личные сообщения",
	"settingsChatShowSenderName": "Показывать имя отправителя",
	"settingsChatSendOnEnter": "Использовать Enter для отправки",
	"settingsIfOn": "Когда включено",
	"chatSend": "Отправить",
	"chatNewline": "Новая строка",
	"settingsIfOff": "Когда выключено",
	"accessibility": "Специальные возможности",
	"settingsAccessibilityBanner": "You can personalize the client's visuals and behavior, and configure settings to optimize usage.",
	"reduceUiAnimation": "Уменьшить анимацию в пользовательском интерфейсе",
	"disableShowingAnimatedImages": "Не проигрывать анимацию",
	"disableShowingAnimatedImages_caption": "Если анимации всё равно не работают, проверьте настройки специальных возможностей и режимы экономии заряда в браузере или системе",
	"enableAnimatedMfm": "Включить анимированную разметку MFM",
	"settingsShowPageTabBarBottom": "Show page tab bar at the bottom",
	"enableHorizontalSwipe": "Смахните в сторону, чтобы сменить вкладки",
	"settingsEnablePullToRefresh": "Потяните для обновления",
	"settingsEnablePullToRefresh_description": "Когда пользуетесь мышкой, потяните держа среднюю кнопку мыши (колёсико)",
	"keepScreenOn": "Держать экран включённым",
	"useNativeUIForVideoAudioPlayer": "Использовать интерфейс браузера при проигрывании видео и звука",
	"settingsMakeEveryTextElementsSelectable": "Разрешить выбирать текст во всех элементах",
	"settingsMakeEveryTextElementsSelectable_description": "Включение этой настройки может снизить удобство использования в некоторых ситуациях.",
	"popup": "Всплывающие окна",
	"drawer": "Панель",
	"menuStyle": "Стиль меню",
	"contextMenuApp": "Application",
	"contextMenuAppWithShift": "Application with shift key",
	"contextMenuNative": "Native",
	"contextMenuTitle": "Context menu",
	"fontSize": "Размер шрифта",
	"useSystemFont": "Использовать шрифт, предлагаемый системой",
	"performance": "Производительность",
	"settingsUiAnimations": "Анимации интерфейса",
	"turnOffToImprovePerformance": "Отключение этого параметра может повысить производительность.",
	"settingsEnableAnimatedImages": "Enable animated images",
	"useBlurEffect": "Размытие в интерфейсе",
	"useBlurEffectForModal": "Размытие за формой ввода заметки",
	"settingsEnableHighQualityImagePlaceholders": "Display placeholders for high quality images",
	"settingsUseStickyIcons": "Make icons follow while scrolling",
	"clientPerformanceIssueTipTitle": "Performance tips",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Disable your adblocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Adblockers can affect performance, please make sure that adblockers are not enabled by your system or browser features/extensions.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Выключить пользовательский CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Пользовательские стили CSS могут повлиять на производительность. Пожалуйста, убедитесь что пользовательский CSS или браузерные расширения изменяющие CSS не включены.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Disable extensions",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Some extensions may interfere with client behavior and affect performance. Please disable your browser extensions and see if this improves the situation.",
	"dataSaver": "Экономия трафика",
	"reloadRequiredToApplySettings": "Для применения настроек необходима обновить страницу.",
	"enableAll": "Включить все",
	"disableAll": "Выключить всё",
	"dataSaverMediaTitle": "Loading Media",
	"dataSaverMediaDescription": "Prevents images/videos from being loaded automatically. Hidden images/videos will be loaded when tapped.",
	"dataSaverAvatarTitle": "Avatar image",
	"dataSaverAvatarDescription": "Stop avatar image animation. Animated images can be larger in file size than normal images, potentially leading to further reductions in data traffic.",
	"dataSaverDisableUrlPreviewTitle": "Disable URL preview",
	"dataSaverDisableUrlPreviewDescription": "Disables the URL preview function. Unlike thumbnail images, this function reduces the loading of the linked information itself.",
	"dataSaverUrlPreviewThumbnailTitle": "Hide URL preview thumbnails",
	"dataSaverUrlPreviewThumbnailDescription": "URL preview thumbnail images will no longer be loaded.",
	"dataSaverCodeTitle": "Подсветка кода",
	"dataSaverCodeDescription": "If code highlighting notations are used in MFM, etc., they will not load until tapped. Syntax highlighting requires downloading the highlight definition files for each programming language. Therefore, disabling the automatic loading of these files is expected to reduce the amount of communication data.",
	"other": "Другие",
	"squareAvatars": "Квадратные аватарки",
	"seasonalScreenEffect": "Эффект времени года на экране",
	"openImageInNewTab": "Открыть изображение в новой вкладке",
	"withRepliesByDefaultForNewlyFollowed": "По умолчанию включайте ответы новых пользователей, на которых вы подписались, во временную шкалу",
	"serverDisconnectedBehaviorReload": "Автоматическая перезагрузка",
	"serverDisconnectedBehaviorDialog": "Предупреждение",
	"serverDisconnectedBehaviorQuiet": "Показать ненавязчивое предупреждение",
	"whenServerDisconnected": "Когда соединение с сервером потеряно",
	"numberOfPageCache": "Количество сохранённых страниц в кэше",
	"numberOfPageCacheDescription": "Описание количества страниц в кэше",
	"forceShowAds": "Всегда отображать рекламу",
	"hemisphereN": "Северное полушарие",
	"hemisphereS": "Южное полушарие",
	"hemisphere": "Место проживания",
	"hemisphereCaption": "Используется для некоторых настроек клиента для определения сезона.",
	"additionalEmojiDictionary": "Дополнительные словари эмодзи",
	"installed": "Установлено",
	"navbar": "Панель навигации",
	"statusbar": "Статусбар",
	"deck": "Пульт",
	"customCss": "Пользовательский CSS",
	"selectList": "Выберите список"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"preferences": "Preferences",
	"settingsPreferencesBanner": "You can configure the overall behavior of the client according to your preferences.",
	"general": "Všeobecné",
	"uiLanguage": "Jazyk používateľského prostredia",
	"i18nInfo": "Misskey je prekladaný do rôznych jazykov dobrovoľníkmi. Pomôcť môžete na {link}.",
	"auto": "Automaticky",
	"smartphone": "Smartfón",
	"tablet": "Tablet",
	"desktop": "Desktop",
	"overridedDeviceKind": "Typ zariadenia",
	"realtimeMode": "Real-time mode",
	"settingsRealtimeMode_description": "Establishes a connection with the server and updates content in real time. This may increase traffic and memory consumption.",
	"low": "Málo",
	"middle": "Stredné",
	"high": "Vysoká",
	"settingsContentsUpdateFrequency": "Frequency of content retrieval",
	"settingsContentsUpdateFrequency_description": "The higher the value the more the content updates but it lowers the performance and increases the traffic and memory consumption.",
	"settingsContentsUpdateFrequency_description2": "When real-time mode is on, content is updated in real time regardless of this setting.",
	"showTitlebar": "Zobraziť riadok s nadpisom",
	"showAvatarDecorations": "Show avatar decorations",
	"alwaysConfirmFollow": "Always confirm when following",
	"highlightSensitiveMedia": "Highlight sensitive media",
	"confirmWhenRevealingSensitiveMedia": "Confirm when revealing sensitive media",
	"enableAdvancedMfm": "Povolenie pokročilého MFM",
	"enableInfiniteScroll": "Zapnúť nekonečné skrolovanie",
	"native": "Natívne",
	"emojiStyle": "Štýl emoji",
	"settingsTimelineAndNote": "Timeline and note",
	"showFixedPostForm": "Zobraziť formulár na nové príspevky nad časovou osou",
	"showFixedPostFormInChannel": "Display the posting form at the top of the timeline (Channels)",
	"collapseRenotes": "Collapse renotes you've already seen",
	"collapseRenotesDescription": "Collapse notes that you've reacted to or renoted before.",
	"pinnedList": "Pinned list",
	"add": "Pridať",
	"remove": "Odstrániť",
	"showNoteActionsOnlyHover": "Ovládacie prvky poznámky sa zobrazujú len po nabehnutí myši",
	"showClipButtonInNoteFooter": "Add \"Clip\" to note action menu",
	"showReactionsCount": "See the number of reactions in notes",
	"confirmOnReact": "Confirm when reacting",
	"loadRawImages": "Načítať originálne obrázky namiesto miniatúr",
	"useReactionPickerForContextMenu": "Otvoriť výber reakcií na pravý klik",
	"settingsShowAvailableReactionsFirstInNote": "Show available reactions at the top.",
	"small": "Malé",
	"medium": "Stredné",
	"large": "Veľké",
	"reactionsDisplaySize": "Reaction display size",
	"limitWidthOfReaction": "Limit the maximum width of reactions and display them in reduced size.",
	"default": "Predvolené",
	"limitTo": "Limit to {x}",
	"mediaListWithOneImageAppearance": "Height of media lists with one image only",
	"showMediaListByGridInWideArea": "Display the media list in a grid when the screen width is wide",
	"instanceTickerNone": "Nikdy nezobrazovať",
	"instanceTickerRemote": "Zobraziť pre vzdialených používateľov",
	"instanceTickerAlways": "Zobraziť vždy",
	"instanceTicker": "Informácie servera o poznámkach",
	"displayOfSensitiveMediaRespect": "Hide media marked as sensitive",
	"displayOfSensitiveMediaIgnore": "Display media marked as sensitive",
	"displayOfSensitiveMediaForce": "Hide all media",
	"displayOfSensitiveMedia": "Display of sensitive media",
	"postForm": "Napísať poznámku",
	"keepCw": "Nechať varovania obsahu",
	"rememberNoteVisibility": "Zapamätať nastavenia viditeľnosti poznámky",
	"enableQuickAddMfmFunction": "Show advanced MFM picker",
	"defaultNoteVisibility": "Predvolená viditeľnosť",
	"visibilityPublic": "Verejné",
	"visibilityHome": "Domov",
	"visibilityFollowers": "Sledujúci",
	"visibilitySpecified": "Priame",
	"visibilityDisableFederation": "Defederate",
	"notifications": "Oznámenia",
	"useGroupedNotifications": "Display grouped notifications",
	"leftTop": "Top left",
	"rightTop": "Top right",
	"leftBottom": "Bottom left",
	"rightBottom": "Bottom right",
	"position": "Position",
	"vertical": "Vertical",
	"horizontal": "Strana",
	"stackAxis": "Stacking direction",
	"notificationCheckNotificationBehavior": "Check notification appearance",
	"directMessage": "Chat with user",
	"settingsChatShowSenderName": "Show sender's name",
	"settingsChatSendOnEnter": "Press Enter to send",
	"settingsIfOn": "When turned on",
	"chatSend": "Poslať",
	"chatNewline": "New line",
	"settingsIfOff": "When turned off",
	"accessibility": "Accessibility",
	"settingsAccessibilityBanner": "You can personalize the client's visuals and behavior, and configure settings to optimize usage.",
	"reduceUiAnimation": "Menej UI animácií",
	"disableShowingAnimatedImages": "Neprehrávať animované obrázky",
	"disableShowingAnimatedImages_caption": "If animated images do not play even if this setting is disabled, it may be due to browser or OS accessibility settings, power-saving settings, or similar factors.",
	"enableAnimatedMfm": "Povoliť animované MFM",
	"settingsShowPageTabBarBottom": "Show page tab bar at the bottom",
	"enableHorizontalSwipe": "Swipe to switch tabs",
	"settingsEnablePullToRefresh": "Pull to Refresh",
	"settingsEnablePullToRefresh_description": "When using a mouse, drag while pressing in the scroll wheel.",
	"keepScreenOn": "Keep screen on",
	"useNativeUIForVideoAudioPlayer": "Use UI of browser when play video and audio\n",
	"settingsMakeEveryTextElementsSelectable": "Make all text elements selectable",
	"settingsMakeEveryTextElementsSelectable_description": "Enabling this may reduce usability in some situations.",
	"popup": "Pop up",
	"drawer": "Drawer",
	"menuStyle": "Menu style",
	"contextMenuApp": "Application",
	"contextMenuAppWithShift": "Application with shift key",
	"contextMenuNative": "Native",
	"contextMenuTitle": "Context menu",
	"fontSize": "Veľkosť písma",
	"useSystemFont": "Použiť predvolené systémové písmo",
	"performance": "Performance",
	"settingsUiAnimations": "UI Animations",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"settingsEnableAnimatedImages": "Enable animated images",
	"useBlurEffect": "Používať efekty rozmazania v UI",
	"useBlurEffectForModal": "Použiť efekt rozmazania na okná",
	"settingsEnableHighQualityImagePlaceholders": "Display placeholders for high quality images",
	"settingsUseStickyIcons": "Make icons follow while scrolling",
	"clientPerformanceIssueTipTitle": "Performance tips",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Disable your adblocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Adblockers can affect performance, please make sure that adblockers are not enabled by your system or browser features/extensions.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Disable custom CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Overriding styles can affect performance. Please make sure that custom CSS or extensions that override styles are not enabled.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Disable extensions",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Some extensions may interfere with client behavior and affect performance. Please disable your browser extensions and see if this improves the situation.",
	"dataSaver": "Data Saver",
	"reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
	"enableAll": "Povoliť všetko",
	"disableAll": "Vypnúť všetko",
	"dataSaverMediaTitle": "Loading Media",
	"dataSaverMediaDescription": "Prevents images/videos from being loaded automatically. Hidden images/videos will be loaded when tapped.",
	"dataSaverAvatarTitle": "Avatar image",
	"dataSaverAvatarDescription": "Stop avatar image animation. Animated images can be larger in file size than normal images, potentially leading to further reductions in data traffic.",
	"dataSaverDisableUrlPreviewTitle": "Disable URL preview",
	"dataSaverDisableUrlPreviewDescription": "Disables the URL preview function. Unlike thumbnail images, this function reduces the loading of the linked information itself.",
	"dataSaverUrlPreviewThumbnailTitle": "Hide URL preview thumbnails",
	"dataSaverUrlPreviewThumbnailDescription": "URL preview thumbnail images will no longer be loaded.",
	"dataSaverCodeTitle": "Code highlighting",
	"dataSaverCodeDescription": "If code highlighting notations are used in MFM, etc., they will not load until tapped. Syntax highlighting requires downloading the highlight definition files for each programming language. Therefore, disabling the automatic loading of these files is expected to reduce the amount of communication data.",
	"other": "Ostatní",
	"squareAvatars": "Zobrazovať štvorcové avatary",
	"seasonalScreenEffect": "Seasonal Screen Effect",
	"openImageInNewTab": "Otvoriť obrázok v novom tabe",
	"withRepliesByDefaultForNewlyFollowed": "Include replies by newly followed users in the timeline by default",
	"serverDisconnectedBehaviorReload": "Automaticky obnoviť",
	"serverDisconnectedBehaviorDialog": "Zobraziť okno s varovaním",
	"serverDisconnectedBehaviorQuiet": "Zobraziť nerušivé varovanie",
	"whenServerDisconnected": "Keď sa stratí spojenie so serverom",
	"numberOfPageCache": "Počet cachí pre stránky",
	"numberOfPageCacheDescription": "Zvýši rýchlosť ale tiež nároky na pamäť.",
	"forceShowAds": "Always show ads",
	"hemisphereN": "Northern Hemisphere",
	"hemisphereS": "Southern Hemisphere",
	"hemisphere": "Where you live",
	"hemisphereCaption": "Used in some client settings to determine season.",
	"additionalEmojiDictionary": "Additional emoji dictionaries",
	"installed": "Installed",
	"navbar": "Navigačný panel",
	"statusbar": "Stavový riadok",
	"deck": "Deck",
	"customCss": "Vlastné CSS",
	"selectList": "Vyberte zoznam"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"preferences": "การตั้งค่าสภาพแวดล้อม",
	"settingsPreferencesBanner": "คุณสามารถกำหนดค่าพฤติกรรมโดยรวมของไคลเอนต์ได้ตามความต้องการของคุณ",
	"general": "ทั่วไป",
	"uiLanguage": "ภาษาอินเทอร์เฟซผู้ใช้งาน",
	"i18nInfo": "Misskey กำลังได้รับการแปลเป็นภาษาต่างๆ โดยอาสาสมัคร คุณสามารถช่วยเหลือได้ที่ {link}",
	"auto": "อัตโนมัติ",
	"smartphone": "สมาร์ทโฟน",
	"tablet": "แท็บเล็ต",
	"desktop": "เดสก์ท็อป",
	"overridedDeviceKind": "ประเภทอุปกรณ์",
	"realtimeMode": "โหมดเรียลไทม์",
	"settingsRealtimeMode_description": "เชื่อมต่อกับเซิร์ฟเวอร์และอัปเดตเนื้อหาแบบเรียลไทม์ อาจทำให้ใช้ปริมาณข้อมูลและแบตเตอรี่มากขึ้นได้",
	"low": "ต่ำ",
	"middle": "ปานกลาง",
	"high": "สูง",
	"settingsContentsUpdateFrequency": "ความถี่ในการดึงข้อมูลเนื้อหา",
	"settingsContentsUpdateFrequency_description": "ยิ่งตั้งค่าสูง เนื้อหาจะอัปเดตแบบเรียลไทม์มากขึ้น แต่ประสิทธิภาพอาจลดลง และการใช้ข้อมูลกับแบตเตอรี่จะเพิ่มมากขึ้น",
	"settingsContentsUpdateFrequency_description2": "เมื่อโหมดเรียลไทม์เปิดอยู่ เนื้อหาจะอัปเดตแบบเรียลไทม์โดยไม่ขึ้นกับการตั้งค่านี้",
	"showTitlebar": "แสดงแถบชื่อ",
	"showAvatarDecorations": "แสดงของตกแต่งไอคอน",
	"alwaysConfirmFollow": "แสดงข้อความยืนยันเมื่อกดติดตาม",
	"highlightSensitiveMedia": "ไฮไลท์สื่อที่มีเนื้อหาละเอียดอ่อน",
	"confirmWhenRevealingSensitiveMedia": "ตรวจสอบก่อนแสดงสื่อที่มีเนื้อหาละเอียดอ่อน",
	"enableAdvancedMfm": "เปิดใช้งาน MFM ขั้นสูง",
	"enableInfiniteScroll": "โหลดเพิ่มเติมโดยอัตโนมัติ",
	"native": "ภาษาแม่",
	"emojiStyle": "สไตล์ของเอโมจิ",
	"settingsTimelineAndNote": "ไทม์ไลน์และโน้ต",
	"showFixedPostForm": "แสดงแบบฟอร์มการโพสต์ที่ด้านบนสุดของไทม์ไลน์",
	"showFixedPostFormInChannel": "แสดงแบบฟอร์มการโพสต์ที่ด้านบนของไทม์ไลน์ (ช่อง)",
	"collapseRenotes": "ยุบรีโน้ตที่คุณเคยเห็นแล้ว",
	"collapseRenotesDescription": "พับย่อโน้ตที่เคยตอบสนองหรือรีโน้ตแล้ว",
	"pinnedList": "รายชื่อที่ปักหมุดไว้",
	"add": "เพิ่ม",
	"remove": "ลบ",
	"showNoteActionsOnlyHover": "แสดงการดำเนินการโน้ตเมื่อโฮเวอร์(วางเมาส์เหนือ)เท่านั้น",
	"showClipButtonInNoteFooter": "เพิ่ม “คลิป” ไปยังเมนูสั่งการของโน้ต",
	"showReactionsCount": "แสดงจำนวนรีแอกชั่นในโน้ต",
	"confirmOnReact": "ยืนยันเมื่อทำการรีแอคชั่น",
	"loadRawImages": "โหลดภาพต้นฉบับแทนการแสดงภาพขนาดย่อ",
	"useReactionPickerForContextMenu": "คลิกขวาเพื่อเปิดตัวจิ้มรีแอคชั่น",
	"settingsShowAvailableReactionsFirstInNote": "แสดงรีแอคชั่นที่ใช้ได้ไว้หน้าสุด",
	"small": "เล็ก",
	"medium": "ปานกลาง",
	"large": "ใหญ่",
	"reactionsDisplaySize": "ขนาดของรีแอคชั่น",
	"limitWidthOfReaction": "จำกัดความกว้างสูงสุดของรีแอคชั่นและแสดงให้เล็กลง",
	"default": "ค่าเริ่มต้น",
	"limitTo": "จำกัดไว้ที่ {x}",
	"mediaListWithOneImageAppearance": "ความสูงของรายการสื่อที่มีเพียงรูปเดียว",
	"showMediaListByGridInWideArea": "เมื่อหน้าจอกว้างยาวขึ้น ให้เรียงรายการสื่อเป็นแนวนอน",
	"instanceTickerNone": "ไม่ต้องแสดง",
	"instanceTickerRemote": "แสดงสำหรับผู้ใช้ระยะไกล",
	"instanceTickerAlways": "แสดงเสมอ",
	"instanceTicker": "ข้อมูลเซิร์ฟเวอร์ของโน้ต",
	"displayOfSensitiveMediaRespect": "ซ่อนสื่อที่มีเนื้อหาละเอียดอ่อน",
	"displayOfSensitiveMediaIgnore": "แสดงสื่อที่มีเนื้อหาละเอียดอ่อน",
	"displayOfSensitiveMediaForce": "ซ่อนสื่อทั้งหมด",
	"displayOfSensitiveMedia": "แสดงสื่อที่มีเนื้อหาละเอียดอ่อน",
	"postForm": "แบบฟอร์มการโพสต์",
	"keepCw": "คงการเตือนเนื้อหาไว้",
	"rememberNoteVisibility": "จำการตั้งค่าการมองเห็นโน้ต",
	"enableQuickAddMfmFunction": "แสดงตัวจิ้มเลือก MFM ขั้นสูง",
	"defaultNoteVisibility": "การมองเห็นที่เป็นค่าเริ่มต้น",
	"visibilityPublic": "สาธารณะ",
	"visibilityHome": "หน้าหลัก",
	"visibilityFollowers": "ผู้ติดตาม",
	"visibilitySpecified": "ไดเร็ค",
	"visibilityDisableFederation": "การปิดใช้งานสหพันธ์",
	"notifications": "เเจ้งเตือน",
	"useGroupedNotifications": "แสดงผลการแจ้งเตือนแบบกลุ่มแล้ว",
	"leftTop": "บนซ้าย",
	"rightTop": "บนขวา",
	"leftBottom": "ล่างซ้าย",
	"rightBottom": "ล่างขวา",
	"position": "ตำแหน่ง",
	"vertical": "แนวตั้ง",
	"horizontal": "แนวนอน",
	"stackAxis": "ทิศทางการซ้อน",
	"notificationCheckNotificationBehavior": "กดเพื่อดูลักษณะการแจ้งเตือน",
	"directMessage": "แชตเลย",
	"settingsChatShowSenderName": "แสดงชื่อผู้ส่ง",
	"settingsChatSendOnEnter": "กด Enter เพื่อส่ง",
	"settingsIfOn": "เมื่อเปิดใช้งาน",
	"chatSend": "ส่ง",
	"chatNewline": "ขึ้นบรรทัดใหม่",
	"settingsIfOff": "เมื่อปิดใช้งาน",
	"accessibility": "การช่วยการเข้าถึง",
	"settingsAccessibilityBanner": "สามารถปรับแต่งรูปลักษณ์และพฤติกรรมของไคลเอนต์เพื่อให้เหมาะกับการใช้งานของตนเองมากขึ้น",
	"reduceUiAnimation": "ลดภาพเคลื่อนไหว UI",
	"disableShowingAnimatedImages": "ไม่ต้องเล่นภาพเคลื่อนไหว",
	"disableShowingAnimatedImages_caption": "หากภาพเคลื่อนไหวไม่เล่นแม่จะปิดตั้งค่านี้ไปแล้ว อาจเป็นกรณีที่การตั้งค่าการช่วยการเข้าถึงหรือการประหยัดพลังงาน ของเบราว์เซอร์/OS เข้าแทรกแซง",
	"enableAnimatedMfm": "เปิดการใช้งาน MFM แบบเคลื่อนไหว",
	"settingsShowPageTabBarBottom": "แสดงแท็บบาร์ของเพจที่ด้านล่าง",
	"enableHorizontalSwipe": "ปัดเพื่อสลับแท็บ",
	"settingsEnablePullToRefresh": "ดึงเพื่ออัปเดต",
	"settingsEnablePullToRefresh_description": "สำหรับเมาส์ ให้กดปุ่มล้อกลางค้างไว้แล้วลาก",
	"keepScreenOn": "เปิดหน้าจออุปกรณ์ค้างไว้",
	"useNativeUIForVideoAudioPlayer": "ใช้ UI ของเบราว์เซอร์เพื่อเล่นวิดีโอ/เสียง",
	"settingsMakeEveryTextElementsSelectable": "อนุญาตให้เลือกข้อความทั้งหมดได้",
	"settingsMakeEveryTextElementsSelectable_description": "หากเปิดใช้งาน อาจทำให้ความสะดวกในการใช้งานลดลงในบางสถานการณ์",
	"popup": "ป๊อปอัพ",
	"drawer": "ตัววาด",
	"menuStyle": "สไตล์เมนู",
	"contextMenuApp": "แอปพลิเคชัน",
	"contextMenuAppWithShift": "แอปฟลิเคชันด้วยปุ่มยกแคร่ (Shift)",
	"contextMenuNative": "UI ของเบราว์เซอร์",
	"contextMenuTitle": "เมนูเนื้อหา",
	"fontSize": "ขนาดตัวอักษร",
	"useSystemFont": "ใช้ฟอนต์เริ่มต้นของระบบ",
	"performance": "ประสิทธิภาพ\u200b",
	"settingsUiAnimations": "ภาพเคลื่อนไหวของ UI",
	"turnOffToImprovePerformance": "การปิดส่วนนี้สามารถเพิ่มประสิทธิภาพได้",
	"settingsEnableAnimatedImages": "เปิดใช้งานภาพเคลื่อนไหว",
	"useBlurEffect": "ใช้เอฟเฟกต์เบลอใน UI",
	"useBlurEffectForModal": "ใช้เอฟเฟกต์เบลอสำหรับโมดอล",
	"settingsEnableHighQualityImagePlaceholders": "แสดงภาพตัวแทนคุณภาพสูง",
	"settingsUseStickyIcons": "ทำให้ไอคอนเคลื่อนตามการเลื่อน",
	"clientPerformanceIssueTipTitle": "หากรู้สึกว่าแบตเตอรี่หมดเร็ว",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "โปรดปิดการใช้งานตัวบล็อกโฆษณา",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "ตัวบล็อกโฆษณาอาจส่งผลต่อประสิทธิภาพ โปรดตรวจสอบว่าไม่ได้เปิดใช้งานผ่านฟังก์ชันของระบบปฏิบัติการ เบราว์เซอร์ หรือส่วนเสริมใดๆ",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "โปรดปิดการใช้งาน CSS แบบกำหนดเอง",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "การเขียนทับสไตล์อาจส่งผลต่อประสิทธิภาพ โปรดตรวจสอบว่าไม่มี CSS แบบกำหนดเองหรือส่วนเสริมที่แก้ไขสไตล์เปิดใช้งานอยู่",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "โปรดปิดการใช้งานส่วนเสริม",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "ส่วนเสริมบางตัวอาจรบกวนการทำงานของไคลเอนต์และทำให้ประสิทธิภาพลดลง กรุณาลองปิดส่วนเสริมในเบราว์เซอร์แล้วตรวจสอบอีกครั้ง",
	"dataSaver": "ประหยัดข้อมูล",
	"reloadRequiredToApplySettings": "จำเป็นต้องมีการโหลดซ้ำเพื่อให้การตั้งค่ามีผล",
	"enableAll": "เปิดใช้งานทั้งหมด",
	"disableAll": "ปิดการใช้งานทั้งหมด",
	"dataSaverMediaTitle": "ปิดใช้งานการโหลดสื่ออัตโนมัติ",
	"dataSaverMediaDescription": "กันไม่ให้ภาพและวิดีโอโหลดโดยอัตโนมัติ แตะรูปภาพ/วิดีโอที่ซ่อนอยู่เพื่อโหลด",
	"dataSaverAvatarTitle": "ปิดใช้งานภาพเคลื่อนไหวของไอคอนประจำตัว",
	"dataSaverAvatarDescription": "ภาพเคลื่อนไหวของไอคอนประจำตัวจะหยุดทำงาน ภาพแบบเคลื่อนไหวมักมีขนาดไฟล์ใหญ่กว่าภาพปกติ จึงช่วยลดปริมาณการใช้ข้อมูลได้มากขึ้น",
	"dataSaverDisableUrlPreviewTitle": "ปิดการใช้งานแสดงตัวอย่าง URL",
	"dataSaverDisableUrlPreviewDescription": "ปิดฟังก์ชันแสดงตัวอย่าง URL แตกต่างจากการซ่อนเพียงภาพขนาดย่อ ฟังก์ชันนี้จะช่วยลดการโหลดข้อมูลจากลิงก์ปลายทางทั้งหมด",
	"dataSaverUrlPreviewThumbnailTitle": "ซ่อนภาพขนาดย่อของการแสดงตัวอย่าง URL",
	"dataSaverUrlPreviewThumbnailDescription": "ภาพขนาดย่อของการตัวอย่าง URL จะไม่ถูกโหลดอีกต่อไป",
	"dataSaverCodeTitle": "ไฮไลต์โค้ด",
	"dataSaverCodeDescription": "หากใช้สัญลักษณ์ไฮไลต์โค้ดใน MFM ฯลฯ สัญลักษณ์เหล่านั้นจะไม่โหลดจนกว่าจะแตะ การไฮไลต์ไวยากรณ์(syntax)จำเป็นต้องดาวน์โหลดไฟล์คำจำกัดความของไฮไลต์สำหรับแต่ละภาษา ดังนั้นการปิดใช้งานการโหลดไฟล์เหล่านี้โดยอัตโนมัติจึงคาดว่าจะช่วยลดปริมาณข้อมูลการสื่อสารได้",
	"other": "อื่น ๆ",
	"squareAvatars": "แสดงไอคอนประจำตัวเป็นสี่เหลี่ยม",
	"seasonalScreenEffect": "เอฟเฟกต์หน้าจอตามฤดูกาล",
	"openImageInNewTab": "เปิดรูปภาพในแท็บใหม่",
	"withRepliesByDefaultForNewlyFollowed": "แสดงการตอบกลับจากผู้ใช้ที่คุณเพิ่งติดตามลงไทม์ไลน์ตามค่าเริ่มต้น",
	"serverDisconnectedBehaviorReload": "โหลดใหม่โดยอัตโนมัติ",
	"serverDisconnectedBehaviorDialog": "แสดงกล่องโต้ตอบคำเตือน",
	"serverDisconnectedBehaviorQuiet": "แสดงคำเตือนที่ไม่เป็นการรบกวน",
	"whenServerDisconnected": "เมื่อสูญเสียการเชื่อมต่อกับเซิร์ฟเวอร์",
	"numberOfPageCache": "จำนวนหน้าเพจที่แคช",
	"numberOfPageCacheDescription": "การเพิ่มจำนวนนี้จะช่วยเพิ่มความสะดวกให้กับผู้ใช้งาน แต่จะทำให้เซิร์ฟเวอร์โหลดมากขึ้นและต้องใช้หน่วยความจำมากขึ้นอีกด้วย",
	"forceShowAds": "แสดงโฆษณาเสมอ",
	"hemisphereN": "ซีกโลกเหนือ",
	"hemisphereS": "ซีกโลกใต้",
	"hemisphere": "พื้นที่ที่อาศัยอยู่",
	"hemisphereCaption": "ใช้เพื่อกำหนดฤดูกาลของไคลเอ็นต์",
	"additionalEmojiDictionary": "พจนานุกรมเอโมจิเพิ่มเติม",
	"installed": "ติดตั้งแล้ว",
	"navbar": "แถบนำทาง",
	"statusbar": "แถบสถานะ",
	"deck": "เด็ค",
	"customCss": "CSS แบบกำหนดเอง",
	"selectList": "เลือกรายชื่อ"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"preferences": "Tercihler",
	"settingsPreferencesBanner": "İstediğin şekilde istemcinin genel davranışını yapılandırabilirsin.",
	"general": "Genel",
	"uiLanguage": "Kullanıcı arayüzü dili",
	"i18nInfo": "Misskey, gönüllüler tarafından çeşitli dillere çevrilmektedir. {link} adresinden yardımcı olabilirsin.",
	"auto": "Otomatik",
	"smartphone": "Akıllı telefon",
	"tablet": "Tablet",
	"desktop": "Masaüstü ",
	"overridedDeviceKind": "Cihaz türü",
	"realtimeMode": "Gerçek zamanlı mod",
	"settingsRealtimeMode_description": "Sunucu ile bağlantı kurar ve içeriği gerçek zamanlı olarak günceller. Bu, trafik ve bellek tüketimini artırabilir.",
	"low": "Düşük",
	"middle": "Orta",
	"high": "Yüksek",
	"settingsContentsUpdateFrequency": "İçerik erişim sıklığı",
	"settingsContentsUpdateFrequency_description": "Değer ne kadar yüksek olursa içerik o kadar sık güncellenir, ancak bu durum performansı düşürür ve trafik ile bellek tüketimini artırır.",
	"settingsContentsUpdateFrequency_description2": "Gerçek zamanlı mod açık olduğunda, bu ayardan bağımsız olarak içerik gerçek zamanlı olarak güncellenir.",
	"showTitlebar": "Başlık çubuğunu göster",
	"showAvatarDecorations": "Avatar süslerini göster",
	"alwaysConfirmFollow": "Takip ederken her zaman onaylayın",
	"highlightSensitiveMedia": "Hassas medyayı vurgulayın",
	"confirmWhenRevealingSensitiveMedia": "Confirm when revealing sensitive media",
	"enableAdvancedMfm": "Gelişmiş MFM'yi etkinleştir",
	"enableInfiniteScroll": "Otomatik olarak daha fazlasını yükle",
	"native": "Yerli",
	"emojiStyle": "Emoji stili",
	"settingsTimelineAndNote": "Pano ve not",
	"showFixedPostForm": "Gönderi formunu pano üstünde görüntüle",
	"showFixedPostFormInChannel": "Gönderi formunu pano üstünde görüntüle (Kanallar)",
	"collapseRenotes": "Daha önce görüntülenen Renote'lari kısaltılmış olarak göster",
	"collapseRenotesDescription": "Zaten yanıtladığın veya renote aldığın notları kapat.",
	"pinnedList": "Sabitlenmiş liste",
	"add": "Ekle",
	"remove": "Sil",
	"showNoteActionsOnlyHover": "Not eylemlerini yalnızca üzerine gelindiğinde göster",
	"showClipButtonInNoteFooter": "Not eylem menüsüne “Klip” ekle",
	"showReactionsCount": "Notlardaki tepki sayısını gör",
	"confirmOnReact": "Tepki verirken onaylayın",
	"loadRawImages": "Küçük resimleri göstermek yerine orijinal resimleri yükle",
	"useReactionPickerForContextMenu": "Sağ tıklama ile tepki seçiciyi aç",
	"settingsShowAvailableReactionsFirstInNote": "Mevcut tepkileri en üstte göster.",
	"small": "Küçük",
	"medium": "Orta",
	"large": "Büyük",
	"reactionsDisplaySize": "Tepki ekran boyutu",
	"limitWidthOfReaction": "Tepkilerin maksimum genişliğini sınırla ve bunları küçültülmüş boyutta görüntüle.",
	"default": "Varsayılan",
	"limitTo": "{x} ile sınırlandır",
	"mediaListWithOneImageAppearance": "Tek bir resim içeren medya listelerinin yüksekliği",
	"showMediaListByGridInWideArea": "Ekran genişliği geniş olduğunda, medya listesi yatay olarak görüntülenecektir.",
	"instanceTickerNone": "Asla gösterme",
	"instanceTickerRemote": "Uzak kullanıcılar için göster",
	"instanceTickerAlways": "Her zaman göster",
	"instanceTicker": "Notların sunucu bilgileri",
	"displayOfSensitiveMediaRespect": "Hassas olarak işaretlenmiş medyayı gizle",
	"displayOfSensitiveMediaIgnore": "Hassas olarak işaretlenmiş medya görüntüleme",
	"displayOfSensitiveMediaForce": "Hide all media",
	"displayOfSensitiveMedia": "Hassas ortamların görüntülenmesi",
	"postForm": "Gönderim formu",
	"keepCw": "İçerik uyarılarını sakla",
	"rememberNoteVisibility": "Not görünürlük ayarlarını hatırla",
	"enableQuickAddMfmFunction": "Gelişmiş MFM seçiciyi göster",
	"defaultNoteVisibility": "Varsayılan görünürlük",
	"visibilityPublic": "Halka açık",
	"visibilityHome": "Pano",
	"visibilityFollowers": "Takipçiler",
	"visibilitySpecified": "Doğrudan",
	"visibilityDisableFederation": "Federasyon olmadan",
	"notifications": "Bildirimler",
	"useGroupedNotifications": "Gruplandırılmış bildirimleri göster",
	"leftTop": "Sol üst",
	"rightTop": "Sağ üst",
	"leftBottom": "Sol alt",
	"rightBottom": "Sağ alt",
	"position": "Pozisyon",
	"vertical": "Dikey",
	"horizontal": "Yatay",
	"stackAxis": "Yığınlama yönü",
	"notificationCheckNotificationBehavior": "Bildirim görünümünü kontrol edin",
	"directMessage": "Kullanıcıyla sohbet et",
	"settingsChatShowSenderName": "Gönderenin adını göster",
	"settingsChatSendOnEnter": "Enter tuşuna basarak gönderin",
	"settingsIfOn": "Açıkken",
	"chatSend": "Gönder",
	"chatNewline": "Yeni satır",
	"settingsIfOff": "Kapalıyken",
	"accessibility": "Erişilebilirlik",
	"settingsAccessibilityBanner": "İstemci, görünüm ve davranışları açısından en iyi şekilde kullanılmak üzere kişiselleştirilebilir ve ayarlanabilir.",
	"reduceUiAnimation": "UI animasyonlarını azaltın.",
	"disableShowingAnimatedImages": "Animasyonlu görüntüleri oynatmayın",
	"disableShowingAnimatedImages_caption": "Bu ayara rağmen animasyonlu görüntüler oynatılmıyorsa, bunun nedeni tarayıcınızın veya işletim sisteminizin erişilebilirlik ayarları veya güç tasarrufu ayarlarından kaynaklanan parazit olabilir.",
	"enableAnimatedMfm": "Animasyonlu MFM'yi etkinleştir",
	"settingsShowPageTabBarBottom": "Sayfa sekme çubuğunu aşağıda göster",
	"enableHorizontalSwipe": "Kaydırarak sekmeler arasında geçiş yapın",
	"settingsEnablePullToRefresh": "Yenilemek için çekin",
	"settingsEnablePullToRefresh_description": "Fareyi kullanırken, kaydırma tekerleğini basılı tutarken sürükle.",
	"keepScreenOn": "Ekranı açık tut",
	"useNativeUIForVideoAudioPlayer": "Video ve ses oynatımı için tarayıcı kullanıcı arayüzünü kullan",
	"settingsMakeEveryTextElementsSelectable": "Tüm metin öğelerini seçilebilir hale getir",
	"settingsMakeEveryTextElementsSelectable_description": "Bunu etkinleştirmek bazı durumlarda kullanılabilirliği azaltabilir.",
	"popup": "Pop-up",
	"drawer": "Çekmece",
	"menuStyle": "Menü stili",
	"contextMenuApp": "Uygulama",
	"contextMenuAppWithShift": "Shift tuşuyla uygulama",
	"contextMenuNative": "Doğal",
	"contextMenuTitle": "Bağlam menüsü",
	"fontSize": "Yazı tipi boyutu",
	"useSystemFont": "Sistemin varsayılan yazı tipini kullanın",
	"performance": "Başarım",
	"settingsUiAnimations": "UI Animasyonları",
	"turnOffToImprovePerformance": "Devre dışı bırakma, daha yüksek performansa yol açabilir.",
	"settingsEnableAnimatedImages": "Hareketli görüntüleri etkinleştirin",
	"useBlurEffect": "UI'da bulanıklık efektleri kullanın",
	"useBlurEffectForModal": "Modaller için bulanıklaştırma efekti kullanın",
	"settingsEnableHighQualityImagePlaceholders": "Yüksek kaliteli görüntüler için yer tutucuları göster",
	"settingsUseStickyIcons": "Kaydırma sırasında simgeleri takip et",
	"clientPerformanceIssueTipTitle": "Performans ipuçları",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Reklam engelleyicini devre dışı bırak",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Reklam engelleyiciler performansı etkileyebilir, lütfen sisteminde veya tarayıcının özelliklerinde/uzantılarında reklam engelleyicilerin etkinleştirilmediğinden emin ol.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Özel CSS'yi devre dışı bırak",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Stil geçersiz kılma, performansı etkileyebilir. Stil geçersiz kılan özel CSS veya uzantıların etkinleştirilmediğinden emin ol.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Uzantıları devre dışı bırak",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Bazı uzantılar istemci davranışını engelleyebilir ve performansı etkileyebilir. Lütfen tarayıcı uzantılarınızı devre dışı bırakın ve durumun düzelip düzelmediğini kontrol edin.",
	"dataSaver": "Veri Tasarrufu",
	"reloadRequiredToApplySettings": "Ayarları uygulamak için yeniden yükleme gereklidir.",
	"enableAll": "Tümünü etkinleştir",
	"disableAll": "Tümünü devre dışı bırak",
	"dataSaverMediaTitle": "Medya yükleniyor",
	"dataSaverMediaDescription": "Görüntülerin/videoların otomatik olarak yüklenmesini engeller. Gizli görüntüler/videolar dokunulduğunda yüklenir.",
	"dataSaverAvatarTitle": "Avatar resmi",
	"dataSaverAvatarDescription": "Avatar görüntüsünün animasyonunu durdurun. Animasyonlu görüntüler normal görüntülere göre dosya boyutu açısından daha büyük olabilir ve bu da veri trafiğinde daha fazla azalmaya yol açabilir.",
	"dataSaverDisableUrlPreviewTitle": "URL önizlemesini devre dışı bırak",
	"dataSaverDisableUrlPreviewDescription": "URL önizleme işlevini devre dışı bırakır. Küçük resimler aksine, bu işlev bağlantılı bilgilerin kendisinin yüklenmesini azaltır.",
	"dataSaverUrlPreviewThumbnailTitle": "URL önizleme küçük resimlerini gizle",
	"dataSaverUrlPreviewThumbnailDescription": "URL önizleme küçük resimleri artık yüklenmeyecek.",
	"dataSaverCodeTitle": "Kod vurgulama",
	"dataSaverCodeDescription": "MFM vb. programlarda kod vurgulama notasyonları kullanılıyorsa, bunlar dokunulana kadar yüklenmez. Sözdizimi vurgulama, her programlama dili için vurgu tanım dosyalarının indirilmesini gerektirir. Bu nedenle, bu dosyaların otomatik olarak yüklenmesinin devre dışı bırakılması, iletişim verisi miktarını azaltması beklenir.",
	"other": "Diğer",
	"squareAvatars": "Kare avatarlar",
	"seasonalScreenEffect": "Mevsimsel Ekran Efekti",
	"openImageInNewTab": "Görüntüleri yeni sekmede aç",
	"withRepliesByDefaultForNewlyFollowed": "Yeni takip edilen kullanıcıların yanıtlarını varsayılan olarak panoya dahil et",
	"serverDisconnectedBehaviorReload": "Otomatik olarak yeniden yükle",
	"serverDisconnectedBehaviorDialog": "Otomatik olarak yeniden yükle",
	"serverDisconnectedBehaviorQuiet": "Göze batmayan uyarı göster",
	"whenServerDisconnected": "Sunucu ile bağlantı kesildiğinde",
	"numberOfPageCache": "Önbelleğe alınmış sayfa sayısı",
	"numberOfPageCacheDescription": "Bu sayıyı artırmak, kullanıcının cihazında daha fazla bellek kullanımı nedeniyle daha fazla yük oluşturmakla birlikte, kullanıcının rahatlığını artıracaktır.",
	"forceShowAds": "Her zaman reklamları göster",
	"hemisphereN": "Kuzey Yarımküre",
	"hemisphereS": "Güney Yarımküre",
	"hemisphere": "Yaşadığınız yer",
	"hemisphereCaption": "Bazı istemci ayarlarında mevsimi belirlemek için kullanılır.",
	"additionalEmojiDictionary": "Ek emoji sözlükleri",
	"installed": "Yüklendi",
	"navbar": "Gezinti çubuğu",
	"statusbar": "Durum çubuğu",
	"deck": "Deck",
	"customCss": "Özel CSS",
	"selectList": "Bir liste seç"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"preferences": "Preferences",
	"settingsPreferencesBanner": "You can configure the overall behavior of the client according to your preferences.",
	"general": "General",
	"uiLanguage": "User interface language",
	"i18nInfo": "Misskey is being translated into various languages by volunteers. You can help at {link}.",
	"auto": "Auto",
	"smartphone": "Smartphone",
	"tablet": "Tablet",
	"desktop": "Desktop",
	"overridedDeviceKind": "Device type",
	"realtimeMode": "Real-time mode",
	"settingsRealtimeMode_description": "Establishes a connection with the server and updates content in real time. This may increase traffic and memory consumption.",
	"low": "Low",
	"middle": "Medium",
	"high": "High",
	"settingsContentsUpdateFrequency": "Frequency of content retrieval",
	"settingsContentsUpdateFrequency_description": "The higher the value the more the content updates but it lowers the performance and increases the traffic and memory consumption.",
	"settingsContentsUpdateFrequency_description2": "When real-time mode is on, content is updated in real time regardless of this setting.",
	"showTitlebar": "Show title bar",
	"showAvatarDecorations": "Show avatar decorations",
	"alwaysConfirmFollow": "Always confirm when following",
	"highlightSensitiveMedia": "Highlight sensitive media",
	"confirmWhenRevealingSensitiveMedia": "Confirm when revealing sensitive media",
	"enableAdvancedMfm": "Enable advanced MFM",
	"enableInfiniteScroll": "Automatically load more",
	"native": "Native",
	"emojiStyle": "Emoji style",
	"settingsTimelineAndNote": "Timeline and note",
	"showFixedPostForm": "Display the posting form at the top of the timeline",
	"showFixedPostFormInChannel": "Display the posting form at the top of the timeline (Channels)",
	"collapseRenotes": "Collapse renotes you've already seen",
	"collapseRenotesDescription": "Collapse notes that you've reacted to or renoted before.",
	"pinnedList": "Pinned list",
	"add": "Add",
	"remove": "ئۆچۈرۈش",
	"showNoteActionsOnlyHover": "Only show note actions on hover",
	"showClipButtonInNoteFooter": "Add \"Clip\" to note action menu",
	"showReactionsCount": "See the number of reactions in notes",
	"confirmOnReact": "Confirm when reacting",
	"loadRawImages": "Load original images instead of showing thumbnails",
	"useReactionPickerForContextMenu": "Open reaction picker on right-click",
	"settingsShowAvailableReactionsFirstInNote": "Show available reactions at the top.",
	"small": "Small",
	"medium": "Medium",
	"large": "Big",
	"reactionsDisplaySize": "Reaction display size",
	"limitWidthOfReaction": "Limit the maximum width of reactions and display them in reduced size.",
	"default": "Default",
	"limitTo": "Limit to {x}",
	"mediaListWithOneImageAppearance": "Height of media lists with one image only",
	"showMediaListByGridInWideArea": "Display the media list in a grid when the screen width is wide",
	"instanceTickerNone": "Never show",
	"instanceTickerRemote": "Show for remote users",
	"instanceTickerAlways": "Always show",
	"instanceTicker": "Instance information of notes",
	"displayOfSensitiveMediaRespect": "Hide media marked as sensitive",
	"displayOfSensitiveMediaIgnore": "Display media marked as sensitive",
	"displayOfSensitiveMediaForce": "Hide all media",
	"displayOfSensitiveMedia": "Display of sensitive media",
	"postForm": "Posting form",
	"keepCw": "Keep content warnings",
	"rememberNoteVisibility": "Remember note visibility settings",
	"enableQuickAddMfmFunction": "Show advanced MFM picker",
	"defaultNoteVisibility": "Default visibility",
	"visibilityPublic": "Public",
	"visibilityHome": "Home",
	"visibilityFollowers": "Followers",
	"visibilitySpecified": "Direct",
	"visibilityDisableFederation": "Defederate",
	"notifications": "Notifications",
	"useGroupedNotifications": "Display grouped notifications",
	"leftTop": "Top left",
	"rightTop": "Top right",
	"leftBottom": "Bottom left",
	"rightBottom": "Bottom right",
	"position": "Position",
	"vertical": "Vertical",
	"horizontal": "Horizontal",
	"stackAxis": "Stacking direction",
	"notificationCheckNotificationBehavior": "Check notification appearance",
	"directMessage": "Chat with user",
	"settingsChatShowSenderName": "Show sender's name",
	"settingsChatSendOnEnter": "Press Enter to send",
	"settingsIfOn": "When turned on",
	"chatSend": "Send",
	"chatNewline": "New line",
	"settingsIfOff": "When turned off",
	"accessibility": "Accessibility",
	"settingsAccessibilityBanner": "You can personalize the client's visuals and behavior, and configure settings to optimize usage.",
	"reduceUiAnimation": "Reduce UI animations",
	"disableShowingAnimatedImages": "Don't play animated images",
	"disableShowingAnimatedImages_caption": "If animated images do not play even if this setting is disabled, it may be due to browser or OS accessibility settings, power-saving settings, or similar factors.",
	"enableAnimatedMfm": "Enable animated MFM",
	"settingsShowPageTabBarBottom": "Show page tab bar at the bottom",
	"enableHorizontalSwipe": "Swipe to switch tabs",
	"settingsEnablePullToRefresh": "Pull to Refresh",
	"settingsEnablePullToRefresh_description": "When using a mouse, drag while pressing in the scroll wheel.",
	"keepScreenOn": "Keep screen on",
	"useNativeUIForVideoAudioPlayer": "Use UI of browser when play video and audio\n",
	"settingsMakeEveryTextElementsSelectable": "Make all text elements selectable",
	"settingsMakeEveryTextElementsSelectable_description": "Enabling this may reduce usability in some situations.",
	"popup": "Pop up",
	"drawer": "Drawer",
	"menuStyle": "Menu style",
	"contextMenuApp": "Application",
	"contextMenuAppWithShift": "Application with shift key",
	"contextMenuNative": "Native",
	"contextMenuTitle": "Context menu",
	"fontSize": "Font size",
	"useSystemFont": "Use the system's default font",
	"performance": "Performance",
	"settingsUiAnimations": "UI Animations",
	"turnOffToImprovePerformance": "Turning this off can increase performance.",
	"settingsEnableAnimatedImages": "Enable animated images",
	"useBlurEffect": "Use blur effects in the UI",
	"useBlurEffectForModal": "Use blur effect for modals",
	"settingsEnableHighQualityImagePlaceholders": "Display placeholders for high quality images",
	"settingsUseStickyIcons": "Make icons follow while scrolling",
	"clientPerformanceIssueTipTitle": "Performance tips",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Disable your adblocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Adblockers can affect performance, please make sure that adblockers are not enabled by your system or browser features/extensions.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Disable custom CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Overriding styles can affect performance. Please make sure that custom CSS or extensions that override styles are not enabled.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Disable extensions",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Some extensions may interfere with client behavior and affect performance. Please disable your browser extensions and see if this improves the situation.",
	"dataSaver": "Data Saver",
	"reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
	"enableAll": "Enable all",
	"disableAll": "Disable all",
	"dataSaverMediaTitle": "Loading Media",
	"dataSaverMediaDescription": "Prevents images/videos from being loaded automatically. Hidden images/videos will be loaded when tapped.",
	"dataSaverAvatarTitle": "Avatar image",
	"dataSaverAvatarDescription": "Stop avatar image animation. Animated images can be larger in file size than normal images, potentially leading to further reductions in data traffic.",
	"dataSaverDisableUrlPreviewTitle": "Disable URL preview",
	"dataSaverDisableUrlPreviewDescription": "Disables the URL preview function. Unlike thumbnail images, this function reduces the loading of the linked information itself.",
	"dataSaverUrlPreviewThumbnailTitle": "Hide URL preview thumbnails",
	"dataSaverUrlPreviewThumbnailDescription": "URL preview thumbnail images will no longer be loaded.",
	"dataSaverCodeTitle": "Code highlighting",
	"dataSaverCodeDescription": "If code highlighting notations are used in MFM, etc., they will not load until tapped. Syntax highlighting requires downloading the highlight definition files for each programming language. Therefore, disabling the automatic loading of these files is expected to reduce the amount of communication data.",
	"other": "Other",
	"squareAvatars": "Display squared avatars",
	"seasonalScreenEffect": "Seasonal Screen Effect",
	"openImageInNewTab": "Open images in new tab",
	"withRepliesByDefaultForNewlyFollowed": "Include replies by newly followed users in the timeline by default",
	"serverDisconnectedBehaviorReload": "Automatically reload",
	"serverDisconnectedBehaviorDialog": "Show warning dialog",
	"serverDisconnectedBehaviorQuiet": "Show unobtrusive warning",
	"whenServerDisconnected": "When losing connection to the server",
	"numberOfPageCache": "Number of cached pages",
	"numberOfPageCacheDescription": "Increasing this number will improve convenience for but cause more load as more memory usage on the user's device.",
	"forceShowAds": "Always show ads",
	"hemisphereN": "Northern Hemisphere",
	"hemisphereS": "Southern Hemisphere",
	"hemisphere": "Where you live",
	"hemisphereCaption": "Used in some client settings to determine season.",
	"additionalEmojiDictionary": "Additional emoji dictionaries",
	"installed": "Installed",
	"navbar": "Navigation bar",
	"statusbar": "Status bar",
	"deck": "Deck",
	"customCss": "Custom CSS",
	"selectList": "Select a list"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"preferences": "Налаштування",
	"settingsPreferencesBanner": "Ви можете змінювати загальну поведінку клієнту згідно з вашими побажаннями.",
	"general": "Загальне",
	"uiLanguage": "Мова інтерфейсу",
	"i18nInfo": "Misskey перекладається на різні мови волонтерами. Ви можете допомогти: {link}",
	"auto": "Автоматично",
	"smartphone": "Смартфон",
	"tablet": "Планшет",
	"desktop": "Десктоп",
	"overridedDeviceKind": "Тип пристрою",
	"realtimeMode": "Режим реального часу",
	"settingsRealtimeMode_description": "Стабілізує з'єднання з сервером й оновлює контент у реальному часі. Це може збільшити використання трафіку та споживання пам'яті.",
	"low": "Низький",
	"middle": "Середній",
	"high": "Високий",
	"settingsContentsUpdateFrequency": "Частота оновлення контенту",
	"settingsContentsUpdateFrequency_description": "Більше значення спричиняє до швидшого оновлення контенту, але зменшує продуктивність й збільшує споживання трафіку як і використання пам'яті. ",
	"settingsContentsUpdateFrequency_description2": "Коли режим реального часу увімкнуто, контент оновляється у реальному часі попри цього налаштування. ",
	"showTitlebar": "Показати титульний рядок",
	"showAvatarDecorations": "Показувати прикраси аватара",
	"alwaysConfirmFollow": "Завжди підтверджувати підписку",
	"highlightSensitiveMedia": "Виділяти чутливі медіа",
	"confirmWhenRevealingSensitiveMedia": "Підтверджуйте під час показу чутливого медіа ",
	"enableAdvancedMfm": "Увімкнути розширений MFM",
	"enableInfiniteScroll": "Увімкнути нескінченну прокрутку",
	"native": "місцевий",
	"emojiStyle": "Стиль емодзі",
	"settingsTimelineAndNote": "Стрічка та нотатки",
	"showFixedPostForm": "Показати форму запису над стрічкою новин.",
	"showFixedPostFormInChannel": "Відображати форму публікації вгорі стрічки (Канали)",
	"collapseRenotes": "Згортати поширення, які ви вже бачили",
	"collapseRenotesDescription": "Згортати нотатки, на які ви вже відреагували або які поширили раніше.",
	"pinnedList": "Закріплений список",
	"add": "Додати",
	"remove": "Видалити",
	"showNoteActionsOnlyHover": "Показувати дії з нотаткою лише при наведенні",
	"showClipButtonInNoteFooter": "Додати «Добірка» до меню дій нотатки",
	"showReactionsCount": "Показувати кількість реакцій у нотатках",
	"confirmOnReact": "Підтвердити додавання реакції",
	"loadRawImages": "Відображати вкладені зображення повністю замість ескізів",
	"useReactionPickerForContextMenu": "Відкривати палітру реакцій правою кнопкою",
	"settingsShowAvailableReactionsFirstInNote": "Показувати доступні реакції зверху.",
	"small": "Маленький",
	"medium": "Середній",
	"large": "Крупний",
	"reactionsDisplaySize": "Розмір відображення реакцій",
	"limitWidthOfReaction": "Обмежити максимальну ширину реакцій і показувати їх у зменшеному розмірі.",
	"default": "За умовчанням",
	"limitTo": "Обмежити до {x}",
	"mediaListWithOneImageAppearance": "Висота списків медіа лише з одним зображенням",
	"showMediaListByGridInWideArea": "Відображати список медіа у вигляді сітки, коли екран достатньо широкий",
	"instanceTickerNone": "Не відображати",
	"instanceTickerRemote": "Відображати для віддалених користувачів",
	"instanceTickerAlways": "Відображати завжди",
	"instanceTicker": "Мітка з назвою інстанса в нотатках",
	"displayOfSensitiveMediaRespect": "Hide media marked as sensitive",
	"displayOfSensitiveMediaIgnore": "Display media marked as sensitive",
	"displayOfSensitiveMediaForce": "Hide all media",
	"displayOfSensitiveMedia": "Показ чутливого медіа",
	"postForm": "Створення нотатки",
	"keepCw": "Зберігати попередження щодо вмісту",
	"rememberNoteVisibility": "Пам’ятати параметри видимісті",
	"enableQuickAddMfmFunction": "Показувати розширений вибір MFM",
	"defaultNoteVisibility": "Видимість за замовчуванням",
	"visibilityPublic": "Публічний",
	"visibilityHome": "Домівка",
	"visibilityFollowers": "Підписники",
	"visibilitySpecified": "Особисто",
	"visibilityDisableFederation": "Defederate",
	"notifications": "Сповіщення",
	"useGroupedNotifications": "Показувати згруповані сповіщення",
	"leftTop": "Ліворуч зверху",
	"rightTop": "Праворуч зверху",
	"leftBottom": "Ліворуч знизу",
	"rightBottom": "Праворуч знизу",
	"position": "Позиція",
	"vertical": "Вертикально",
	"horizontal": "Збоку",
	"stackAxis": "Напрямок накладання",
	"notificationCheckNotificationBehavior": "Check notification appearance",
	"directMessage": "Чат із користувачем",
	"settingsChatShowSenderName": "Показувати ім'я відправника",
	"settingsChatSendOnEnter": "Використовувати Enter для відправлення",
	"settingsIfOn": "Коли ввімкнено",
	"chatSend": "Відправити",
	"chatNewline": "Новий рядок",
	"settingsIfOff": "Коли вимкнено",
	"accessibility": "Доступність",
	"settingsAccessibilityBanner": "Ви можете персоналізувати клієнтський зовнішній вигляд та поведінку, та змінювати налаштування щоб оптимізувати використовування. ",
	"reduceUiAnimation": "Зменшити анімацію інтерфейсу",
	"disableShowingAnimatedImages": "Не програвати анімовані зображення",
	"disableShowingAnimatedImages_caption": "Якщо анімовані зображення не відтворюються навіть коли це налаштування вимкнено, причиною можуть бути налаштування доступності браузера чи ОС, режим енергоощадження",
	"enableAnimatedMfm": "Увімкнути анімований MFM",
	"settingsShowPageTabBarBottom": "Show page tab bar at the bottom",
	"enableHorizontalSwipe": "Проведіть, щоб перемикати вкладки",
	"settingsEnablePullToRefresh": "Потягніть щоб оновити",
	"settingsEnablePullToRefresh_description": "Під час використовування миші, перетягувати коли натиснуто його колесо",
	"keepScreenOn": "Не вимикати екран",
	"useNativeUIForVideoAudioPlayer": "Використовувати інтерфейс браузера під час відтворення відео й аудіо",
	"settingsMakeEveryTextElementsSelectable": "Зробити всі текстові елементи здатними до виділення",
	"settingsMakeEveryTextElementsSelectable_description": "Ввімкнення цього може зменшити зручність використання у деяких випадках.",
	"popup": "Спливаючі вікна",
	"drawer": "Панель",
	"menuStyle": "Стиль меню",
	"contextMenuApp": "Application",
	"contextMenuAppWithShift": "Application with shift key",
	"contextMenuNative": "Native",
	"contextMenuTitle": "Context menu",
	"fontSize": "Розмір шрифту",
	"useSystemFont": "Використовувати стандартний шрифт системи",
	"performance": "Продуктивність",
	"settingsUiAnimations": "Анімації інтерфейсу користувача",
	"turnOffToImprovePerformance": "Вимкнення цієї опції може підвищити продуктивність.",
	"settingsEnableAnimatedImages": "Увімкнути анімовані зображення",
	"useBlurEffect": "Ефекти розмиття в інтерфейсі",
	"useBlurEffectForModal": "Ефект розмиття під модальними діалогами",
	"settingsEnableHighQualityImagePlaceholders": "Показувати заповнювачі для високоякісних зображень ",
	"settingsUseStickyIcons": "Зробити так, щоб іконки слідкували, поки гортаєш",
	"clientPerformanceIssueTipTitle": "Performance tips",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Disable your adblocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Adblockers can affect performance, please make sure that adblockers are not enabled by your system or browser features/extensions.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Disable custom CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Overriding styles can affect performance. Please make sure that custom CSS or extensions that override styles are not enabled.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Disable extensions",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Some extensions may interfere with client behavior and affect performance. Please disable your browser extensions and see if this improves the situation.",
	"dataSaver": "Заощадження трафіку",
	"reloadRequiredToApplySettings": "Щоб застосувати налаштування, потрібно перезавантажити сторінку.",
	"enableAll": "Увімкнути все",
	"disableAll": "Вимкнути все",
	"dataSaverMediaTitle": "Loading Media",
	"dataSaverMediaDescription": "Prevents images/videos from being loaded automatically. Hidden images/videos will be loaded when tapped.",
	"dataSaverAvatarTitle": "Avatar image",
	"dataSaverAvatarDescription": "Stop avatar image animation. Animated images can be larger in file size than normal images, potentially leading to further reductions in data traffic.",
	"dataSaverDisableUrlPreviewTitle": "Disable URL preview",
	"dataSaverDisableUrlPreviewDescription": "Disables the URL preview function. Unlike thumbnail images, this function reduces the loading of the linked information itself.",
	"dataSaverUrlPreviewThumbnailTitle": "Hide URL preview thumbnails",
	"dataSaverUrlPreviewThumbnailDescription": "URL preview thumbnail images will no longer be loaded.",
	"dataSaverCodeTitle": "Code highlighting",
	"dataSaverCodeDescription": "If code highlighting notations are used in MFM, etc., they will not load until tapped. Syntax highlighting requires downloading the highlight definition files for each programming language. Therefore, disabling the automatic loading of these files is expected to reduce the amount of communication data.",
	"other": "Інше",
	"squareAvatars": "Квадратні аватарки",
	"seasonalScreenEffect": "Сезонний ефект екрана",
	"openImageInNewTab": "Відкрити зображення в новій вкладці",
	"withRepliesByDefaultForNewlyFollowed": "Типово включати відповіді нових користувачів, на яких ви підписалися, до стрічки",
	"serverDisconnectedBehaviorReload": "Автоматично перезавантажити",
	"serverDisconnectedBehaviorDialog": "Показати діалогове вікно",
	"serverDisconnectedBehaviorQuiet": "Показати ненав’язливе попередження",
	"whenServerDisconnected": "Коли зв’язок із сервером втрачено",
	"numberOfPageCache": "Кількість кешованих сторінок",
	"numberOfPageCacheDescription": "Збільшення цього значення покращить зручність, але підвищить навантаження через більше використання пам’яті на пристрої користувача.",
	"forceShowAds": "Завжди показувати рекламу",
	"hemisphereN": "Northern Hemisphere",
	"hemisphereS": "Southern Hemisphere",
	"hemisphere": "Місце проживання",
	"hemisphereCaption": "Used in some client settings to determine season.",
	"additionalEmojiDictionary": "Додаткові словники емодзі",
	"installed": "Встановлено",
	"navbar": "Рядок навігації",
	"statusbar": "Рядок стану",
	"deck": "Дек",
	"customCss": "Власний CSS",
	"selectList": "Виберіть список"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"preferences": "Thiết lập môi trường",
	"settingsPreferencesBanner": "Bạn có thể cấu hình hành vi chung của máy khách theo sở thích của mình.",
	"general": "Tổng quan",
	"uiLanguage": "Ngôn ngữ giao diện",
	"i18nInfo": "Misskey đang được các tình nguyện viên dịch sang nhiều thứ tiếng khác nhau. Bạn có thể hỗ trợ tại {link}.",
	"auto": "Tự động",
	"smartphone": "Điện thoại",
	"tablet": "Máy tính bảng",
	"desktop": "Desktop",
	"overridedDeviceKind": "Loại thiết bị",
	"realtimeMode": "Real-time mode",
	"settingsRealtimeMode_description": "Establishes a connection with the server and updates content in real time. This may increase traffic and memory consumption.",
	"low": "Thấp",
	"middle": "Vừa",
	"high": "Cao",
	"settingsContentsUpdateFrequency": "Frequency of content retrieval",
	"settingsContentsUpdateFrequency_description": "The higher the value the more the content updates but it lowers the performance and increases the traffic and memory consumption.",
	"settingsContentsUpdateFrequency_description2": "When real-time mode is on, content is updated in real time regardless of this setting.",
	"showTitlebar": "Hiện thanh tựa đề",
	"showAvatarDecorations": "Hiển thị trang trí ảnh đại diện",
	"alwaysConfirmFollow": "Always confirm when following",
	"highlightSensitiveMedia": "Đánh dấu nội dung nhạy cảm",
	"confirmWhenRevealingSensitiveMedia": "Confirm when revealing sensitive media",
	"enableAdvancedMfm": "Xem bài MFM chất lượng cao.",
	"enableInfiniteScroll": "Tự động tải tút mới",
	"native": "Bản xứ",
	"emojiStyle": "Kiểu cách Emoji",
	"settingsTimelineAndNote": "Timeline and note",
	"showFixedPostForm": "Hiện khung soạn tút ở phía trên bảng tin",
	"showFixedPostFormInChannel": "Hiển thị mẫu bài đăng ở phía trên bản tin",
	"collapseRenotes": "Không hiển thị bài viết đã từng xem",
	"collapseRenotesDescription": "Các bài đăng bị thu gọn mà bạn đã phản hồi hoặc đăng lại trước đây.",
	"pinnedList": "Các mục đã được ghim",
	"add": "Thêm",
	"remove": "Xóa",
	"showNoteActionsOnlyHover": "Chỉ hiển thị các hành động ghi chú khi di chuột",
	"showClipButtonInNoteFooter": "Add \"Clip\" to note action menu",
	"showReactionsCount": "Hiển thị số reaction trong bài đăng",
	"confirmOnReact": "Confirm when reacting",
	"loadRawImages": "Tải ảnh gốc thay vì ảnh thu nhỏ",
	"useReactionPickerForContextMenu": "Nhấn chuột phải để mở bộ chọn biểu cảm",
	"settingsShowAvailableReactionsFirstInNote": "Show available reactions at the top.",
	"small": "Nhỏ",
	"medium": "Vừa",
	"large": "Lớn",
	"reactionsDisplaySize": "Reaction display size",
	"limitWidthOfReaction": "Limit the maximum width of reactions and display them in reduced size.",
	"default": "Mặc định",
	"limitTo": "Giới hạn tỷ lệ {x}",
	"mediaListWithOneImageAppearance": "Chiều cao của danh sách nội dung đã phương tiện mà chỉ có một hình ảnh",
	"showMediaListByGridInWideArea": "Display the media list in a grid when the screen width is wide",
	"instanceTickerNone": "Không hiển thị",
	"instanceTickerRemote": "Hiện cho người dùng từ máy chủ khác",
	"instanceTickerAlways": "Luôn hiện",
	"instanceTicker": "Thông tin máy chủ của tút",
	"displayOfSensitiveMediaRespect": "Hide media marked as sensitive",
	"displayOfSensitiveMediaIgnore": "Display media marked as sensitive",
	"displayOfSensitiveMediaForce": "Hide all media",
	"displayOfSensitiveMedia": "Hiển thị nội dung nhạy cảm (NSFW)",
	"postForm": "Mẫu đăng",
	"keepCw": "Giữ cảnh báo nội dung",
	"rememberNoteVisibility": "Lưu kiểu tút mặc định",
	"enableQuickAddMfmFunction": "Show advanced MFM picker",
	"defaultNoteVisibility": "Kiểu tút mặc định",
	"visibilityPublic": "Công khai",
	"visibilityHome": "Trang chính",
	"visibilityFollowers": "Người theo dõi",
	"visibilitySpecified": "Nhắn riêng",
	"visibilityDisableFederation": "Không liên hợp",
	"notifications": "Thông báo",
	"useGroupedNotifications": "Display grouped notifications",
	"leftTop": "Phía trên bên tráí",
	"rightTop": "Phía trên bên phải",
	"leftBottom": "Phía dưới bên trái",
	"rightBottom": "Phía dưới bên phải",
	"position": "Vị trí",
	"vertical": "Dọc",
	"horizontal": "Thanh bên",
	"stackAxis": "Hướng chồng",
	"notificationCheckNotificationBehavior": "Check notification appearance",
	"directMessage": "Chat with user",
	"settingsChatShowSenderName": "Show sender's name",
	"settingsChatSendOnEnter": "Press Enter to send",
	"settingsIfOn": "When turned on",
	"chatSend": "Gửi",
	"chatNewline": "New line",
	"settingsIfOff": "When turned off",
	"accessibility": "Khả năng tiếp cận",
	"settingsAccessibilityBanner": "You can personalize the client's visuals and behavior, and configure settings to optimize usage.",
	"reduceUiAnimation": "Giảm chuyển động UI",
	"disableShowingAnimatedImages": "Không phát ảnh động",
	"disableShowingAnimatedImages_caption": "If animated images do not play even if this setting is disabled, it may be due to browser or OS accessibility settings, power-saving settings, or similar factors.",
	"enableAnimatedMfm": "Xem bài MFM có chuyển động",
	"settingsShowPageTabBarBottom": "Show page tab bar at the bottom",
	"enableHorizontalSwipe": "Swipe to switch tabs",
	"settingsEnablePullToRefresh": "Pull to Refresh",
	"settingsEnablePullToRefresh_description": "When using a mouse, drag while pressing in the scroll wheel.",
	"keepScreenOn": "Giữ màn hình luôn bật",
	"useNativeUIForVideoAudioPlayer": "Use UI of browser when play video and audio\n",
	"settingsMakeEveryTextElementsSelectable": "Make all text elements selectable",
	"settingsMakeEveryTextElementsSelectable_description": "Enabling this may reduce usability in some situations.",
	"popup": "Cửa sổ bật lên",
	"drawer": "Ngăn ứng dụng",
	"menuStyle": "Kiểu Menu",
	"contextMenuApp": "Application",
	"contextMenuAppWithShift": "Application with shift key",
	"contextMenuNative": "Native",
	"contextMenuTitle": "Context menu",
	"fontSize": "Cỡ chữ",
	"useSystemFont": "Dùng phông chữ mặc định của hệ thống",
	"performance": "Performance",
	"settingsUiAnimations": "UI Animations",
	"turnOffToImprovePerformance": "Tắt mục này có thể cải thiện hiệu năng.",
	"settingsEnableAnimatedImages": "Enable animated images",
	"useBlurEffect": "Dùng hiệu ứng làm mờ trong giao diện",
	"useBlurEffectForModal": "Sử dụng hiệu ứng mờ cho các hộp thoại",
	"settingsEnableHighQualityImagePlaceholders": "Display placeholders for high quality images",
	"settingsUseStickyIcons": "Make icons follow while scrolling",
	"clientPerformanceIssueTipTitle": "Performance tips",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "Disable your adblocker",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "Adblockers can affect performance, please make sure that adblockers are not enabled by your system or browser features/extensions.",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "Disable custom CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "Overriding styles can affect performance. Please make sure that custom CSS or extensions that override styles are not enabled.",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "Disable extensions",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "Some extensions may interfere with client behavior and affect performance. Please disable your browser extensions and see if this improves the situation.",
	"dataSaver": "Tiết kiệm dung lượng",
	"reloadRequiredToApplySettings": "Reloading is required to apply the settings.",
	"enableAll": "Bật toàn bộ",
	"disableAll": "Tắt toàn bộ",
	"dataSaverMediaTitle": "Loading Media",
	"dataSaverMediaDescription": "Prevents images/videos from being loaded automatically. Hidden images/videos will be loaded when tapped.",
	"dataSaverAvatarTitle": "Avatar image",
	"dataSaverAvatarDescription": "Stop avatar image animation. Animated images can be larger in file size than normal images, potentially leading to further reductions in data traffic.",
	"dataSaverDisableUrlPreviewTitle": "Disable URL preview",
	"dataSaverDisableUrlPreviewDescription": "Disables the URL preview function. Unlike thumbnail images, this function reduces the loading of the linked information itself.",
	"dataSaverUrlPreviewThumbnailTitle": "Hide URL preview thumbnails",
	"dataSaverUrlPreviewThumbnailDescription": "URL preview thumbnail images will no longer be loaded.",
	"dataSaverCodeTitle": "Code highlighting",
	"dataSaverCodeDescription": "If code highlighting notations are used in MFM, etc., they will not load until tapped. Syntax highlighting requires downloading the highlight definition files for each programming language. Therefore, disabling the automatic loading of these files is expected to reduce the amount of communication data.",
	"other": "Khác",
	"squareAvatars": "Ảnh đại diện vuông",
	"seasonalScreenEffect": "Seasonal Screen Effect",
	"openImageInNewTab": "Mở ảnh trong tab mới",
	"withRepliesByDefaultForNewlyFollowed": "Mặc định hiển thị trả lời từ những người dùng mới theo dõi trong dòng thời gian",
	"serverDisconnectedBehaviorReload": "Tự động tải lại",
	"serverDisconnectedBehaviorDialog": "Hiện hộp thoại cảnh báo",
	"serverDisconnectedBehaviorQuiet": "Hiển thị cảnh báo không phô trương",
	"whenServerDisconnected": "Khi mất kết nối tới máy chủ",
	"numberOfPageCache": "Số lượng trang bộ nhớ đệm",
	"numberOfPageCacheDescription": "Việc tăng con số này sẽ cải thiện sự thuận tiện cho người dùng nhưng gây ra nhiều áp lực hơn cho máy chủ cũng như sử dụng nhiều bộ nhớ hơn.",
	"forceShowAds": "Luôn hiện quảng cáo",
	"hemisphereN": "Northern Hemisphere",
	"hemisphereS": "Southern Hemisphere",
	"hemisphere": "Where you live",
	"hemisphereCaption": "Used in some client settings to determine season.",
	"additionalEmojiDictionary": "Additional emoji dictionaries",
	"installed": "Đã tải xuống",
	"navbar": "Thanh điều hướng",
	"statusbar": "Thanh trạng thái",
	"deck": "Deck",
	"customCss": "Tùy chỉnh CSS",
	"selectList": "Chọn danh sách"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"preferences": "偏好设置",
	"settingsPreferencesBanner": "可在此设置客户端的整体运作行为。",
	"general": "常规设置",
	"uiLanguage": "显示语言",
	"i18nInfo": "Misskey 已经被志愿者们翻译成了各种语言。如果你也有兴趣，可以通过 {link} 帮助翻译。",
	"auto": "自动",
	"smartphone": "智能手机",
	"tablet": "平板",
	"desktop": "桌面",
	"overridedDeviceKind": "设备类型",
	"realtimeMode": "实时模式",
	"settingsRealtimeMode_description": "与服务器建立连接并实时更新内容。将会增加流量和电池消耗。",
	"low": "低",
	"middle": "中",
	"high": "高",
	"settingsContentsUpdateFrequency": "内容获取频率",
	"settingsContentsUpdateFrequency_description": "设置越高，内容更新越实时，但性能会降低，并且会消耗更多的流量和电池。",
	"settingsContentsUpdateFrequency_description2": "当实时模式开启时，无论此设置如何，内容都会实时更新。",
	"showTitlebar": "显示标题栏",
	"showAvatarDecorations": "显示头像挂件",
	"alwaysConfirmFollow": "在关注时始终确认",
	"highlightSensitiveMedia": "高亮显示敏感媒体",
	"confirmWhenRevealingSensitiveMedia": "显示敏感内容前需要确认",
	"enableAdvancedMfm": "启用扩展 MFM",
	"enableInfiniteScroll": "自动加载更多内容",
	"native": "原生",
	"emojiStyle": "表情符号的样式",
	"settingsTimelineAndNote": "时间线和帖子",
	"showFixedPostForm": "在时间线顶部显示发帖框",
	"showFixedPostFormInChannel": "在时间线顶部显示发帖框（频道）",
	"collapseRenotes": "折叠已经看过的转贴",
	"collapseRenotesDescription": "折叠显示回应或转发过的帖文。",
	"pinnedList": "已置顶的列表",
	"add": "添加",
	"remove": "删除",
	"showNoteActionsOnlyHover": "仅在悬停时显示帖子操作",
	"showClipButtonInNoteFooter": "在帖文下方显示便签按钮",
	"showReactionsCount": "显示帖子的回应数",
	"confirmOnReact": "发送回应前需要确认",
	"loadRawImages": "添加附件图像的缩略图时使用原始图像质量",
	"useReactionPickerForContextMenu": "单击右键打开回应工具栏",
	"settingsShowAvailableReactionsFirstInNote": "在顶部显示可用的回应",
	"small": "小",
	"medium": "中",
	"large": "大",
	"reactionsDisplaySize": "回应显示大小",
	"limitWidthOfReaction": "限制回应的最大宽度，并将其缩小显示",
	"default": "默认",
	"limitTo": "上限为 {x}",
	"mediaListWithOneImageAppearance": "仅一张图片的媒体列表高度",
	"showMediaListByGridInWideArea": "在宽屏上并排显示媒体列表",
	"instanceTickerNone": "不显示",
	"instanceTickerRemote": "仅远程用户",
	"instanceTickerAlways": "始终显示",
	"instanceTicker": "帖子的服务器来源",
	"displayOfSensitiveMediaRespect": "隐藏敏感媒体",
	"displayOfSensitiveMediaIgnore": "显示敏感媒体",
	"displayOfSensitiveMediaForce": "隐藏所有媒体",
	"displayOfSensitiveMedia": "显示敏感媒体",
	"postForm": "发帖窗口",
	"keepCw": "始终开启内容警告",
	"rememberNoteVisibility": "保存上次设置的可见性",
	"enableQuickAddMfmFunction": "显示高级 MFM 选择器",
	"defaultNoteVisibility": "默认可见范围",
	"visibilityPublic": "公开",
	"visibilityHome": "首页",
	"visibilityFollowers": "仅关注者",
	"visibilitySpecified": "指定用户",
	"visibilityDisableFederation": "仅限本地",
	"notifications": "通知",
	"useGroupedNotifications": "分组显示通知",
	"leftTop": "屏幕左上方",
	"rightTop": "屏幕右上方",
	"leftBottom": "屏幕左下方",
	"rightBottom": "屏幕右下方",
	"position": "位置",
	"vertical": "纵向",
	"horizontal": "横向",
	"stackAxis": "堆叠方向",
	"notificationCheckNotificationBehavior": "检查通知显示",
	"directMessage": "私信",
	"settingsChatShowSenderName": "显示发送者的名字",
	"settingsChatSendOnEnter": "回车键发送",
	"settingsIfOn": "启用时",
	"chatSend": "发送",
	"chatNewline": "换行",
	"settingsIfOff": "关闭时",
	"accessibility": "辅助功能",
	"settingsAccessibilityBanner": "可在此设置客户端的显示及动态效果等辅助设置。",
	"reduceUiAnimation": "减少 UI 动效",
	"disableShowingAnimatedImages": "不播放动态图像",
	"disableShowingAnimatedImages_caption": "如果即使禁用了此设置，动态图像仍无法播放，可能是由于浏览器或操作系统的辅助功能设置、省电设置或其他因素所致。",
	"enableAnimatedMfm": "启用 MFM 动画",
	"settingsShowPageTabBarBottom": "在下方显示页面标签栏",
	"enableHorizontalSwipe": "滑动切换标签页",
	"settingsEnablePullToRefresh": "开启下拉刷新",
	"settingsEnablePullToRefresh_description": "使用鼠标时按下滚轮来拖动",
	"keepScreenOn": "保持屏幕常亮",
	"useNativeUIForVideoAudioPlayer": "使用浏览器的 UI 播放动画及音频",
	"settingsMakeEveryTextElementsSelectable": "使所有的文字均可选择",
	"settingsMakeEveryTextElementsSelectable_description": "若开启，在某些情况下可能降低用户体验。",
	"popup": "弹窗",
	"drawer": "抽屉",
	"menuStyle": "菜单样式",
	"contextMenuApp": "使用",
	"contextMenuAppWithShift": "按住 Shift 键使用",
	"contextMenuNative": "浏览器的原生界面",
	"contextMenuTitle": "右键菜单",
	"fontSize": "字体大小",
	"useSystemFont": "使用系统默认字体",
	"performance": "性能",
	"settingsUiAnimations": "UI 动效",
	"turnOffToImprovePerformance": "关闭该选项可以提高性能。",
	"settingsEnableAnimatedImages": "启用动态图像",
	"useBlurEffect": "在 UI 上使用模糊效果",
	"useBlurEffectForModal": "发帖背景使用模糊效果",
	"settingsEnableHighQualityImagePlaceholders": "显示高质量图像的占位符",
	"settingsUseStickyIcons": "用户头像跟随页面滚动",
	"clientPerformanceIssueTipTitle": "如果觉得电池耗电过高",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "请关闭广告拦截器",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "广告拦截器会影响性能。请检查操作系统功能、浏览器功能或附加组件是否启用了广告拦截器。",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "请关闭自定义 CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "覆盖样式可能会影响性能。请确保没有启用任何自定义 CSS 或覆盖样式的扩展。",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "请关闭扩展",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "某些扩展可能会干扰客户端的运行并影响性能。尝试禁用浏览器扩展并查看是否有改善。",
	"dataSaver": "省流量模式",
	"reloadRequiredToApplySettings": "需要重新载入来使设置生效",
	"enableAll": "启用全部",
	"disableAll": "禁用全部",
	"dataSaverMediaTitle": "加载媒体",
	"dataSaverMediaDescription": "防止自动加载图像和视频。 点击隐藏的图像/视频即可加载它们。\n",
	"dataSaverAvatarTitle": "头像",
	"dataSaverAvatarDescription": "不播放动态头像。 动态图像的文件大小远大于一般图像，不播放能够节省更多数据流量。",
	"dataSaverDisableUrlPreviewTitle": "禁用 URL 预览",
	"dataSaverDisableUrlPreviewDescription": "关闭 URL 预览功能。与预览缩略图不同，减少了链接信息的加载。",
	"dataSaverUrlPreviewThumbnailTitle": "隐藏 URL 预览图",
	"dataSaverUrlPreviewThumbnailDescription": "不再加载 URL 预览图。",
	"dataSaverCodeTitle": "代码高亮",
	"dataSaverCodeDescription": "如果使用了代码高亮标记，例如在 MFM 中，则在点击之前不会加载。 代码高亮要求加载每种高亮语言的定义文件，由于这些文件不再自动加载，因此有望减少数据传输量。",
	"other": "其他",
	"squareAvatars": "显示方形头像图标",
	"seasonalScreenEffect": "符合当前季节的画面效果",
	"openImageInNewTab": "在新标签页中打开图片",
	"withRepliesByDefaultForNewlyFollowed": "在时间线中默认包含新关注用户的回复",
	"serverDisconnectedBehaviorReload": "自动重载",
	"serverDisconnectedBehaviorDialog": "对话框警告",
	"serverDisconnectedBehaviorQuiet": "静默警告",
	"whenServerDisconnected": "与服务器连接中断时",
	"numberOfPageCache": "缓存页数",
	"numberOfPageCacheDescription": "设置较高的值会更方便用户，但设备的负载和内存使用量会增加。",
	"forceShowAds": "总是显示广告",
	"hemisphereN": "北半球",
	"hemisphereS": "南半球",
	"hemisphere": "居住地区",
	"hemisphereCaption": "在某些客户端设置中用来确定季节",
	"additionalEmojiDictionary": "表情符号追加字典",
	"installed": "已安装",
	"navbar": "导航栏",
	"statusbar": "状态栏",
	"deck": "Deck",
	"customCss": "自定义 CSS",
	"selectList": "选择列表"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"preferences": "環境設定",
	"settingsPreferencesBanner": "您可以根據喜好設定用戶端的整體行為。",
	"general": "一般",
	"uiLanguage": "介面語言",
	"i18nInfo": "Misskey 已被志願者們翻譯成各種語言版本。您可以前往 {link} 以協助翻譯。",
	"auto": "自動",
	"smartphone": "智慧型手機",
	"tablet": "平板",
	"desktop": "桌面",
	"overridedDeviceKind": "裝置類型",
	"realtimeMode": "即時模式",
	"settingsRealtimeMode_description": "已與伺服器建立連線，將即時更新內容。這可能會增加資料傳輸量與電池消耗。\n",
	"low": "低",
	"middle": "中",
	"high": "高",
	"settingsContentsUpdateFrequency": "內容取得頻率",
	"settingsContentsUpdateFrequency_description": "頻率越高，內容更新越即時，但可能會降低效能，並增加資料傳輸量與電池消耗。\n",
	"settingsContentsUpdateFrequency_description2": "當即時模式開啟時，不論此設定為何，內容都會即時更新。",
	"showTitlebar": "顯示標題列",
	"showAvatarDecorations": "顯示頭像裝飾",
	"alwaysConfirmFollow": "追隨時總是確認",
	"highlightSensitiveMedia": "強調敏感標記",
	"confirmWhenRevealingSensitiveMedia": "要顯示敏感媒體時需確認",
	"enableAdvancedMfm": "啟用進階 MFM",
	"enableInfiniteScroll": "啟用自動滾動頁面模式",
	"native": "原生",
	"emojiStyle": "表情符號的風格",
	"settingsTimelineAndNote": "時間軸及貼文",
	"showFixedPostForm": "於時間軸頁頂顯示「發送貼文」方框",
	"showFixedPostFormInChannel": "於時間軸頁頂顯示「發送貼文」方框（頻道）",
	"collapseRenotes": "省略顯示已看過的轉發貼文",
	"collapseRenotesDescription": "將已做過反應和轉發的貼文折疊顯示。",
	"pinnedList": "已置頂的清單",
	"add": "新增",
	"remove": "刪除",
	"showNoteActionsOnlyHover": "僅於游標懸停時顯示貼文選項",
	"showClipButtonInNoteFooter": "新增摘錄按鈕至貼文",
	"showReactionsCount": "顯示貼文的反應數目",
	"confirmOnReact": "在做出反應前先確認",
	"loadRawImages": "以原始圖檔顯示附件圖檔的縮圖",
	"useReactionPickerForContextMenu": "點擊右鍵開啟反應選擇器",
	"settingsShowAvailableReactionsFirstInNote": "將可用的反應顯示在頂部",
	"small": "小",
	"medium": "中",
	"large": "大",
	"reactionsDisplaySize": "反應的顯示尺寸",
	"limitWidthOfReaction": "限制反應的最大寬度，並縮小顯示尺寸。",
	"default": "預設",
	"limitTo": "上限為 {x}",
	"mediaListWithOneImageAppearance": "只有一張圖片時的檔案列表高度",
	"showMediaListByGridInWideArea": "當畫面寬度較寬時，將媒體清單以橫向排列顯示",
	"instanceTickerNone": "隱藏",
	"instanceTickerRemote": "只顯示遠端使用者",
	"instanceTickerAlways": "一律顯示",
	"instanceTicker": "貼文的伺服器資訊",
	"displayOfSensitiveMediaRespect": "隱藏敏感檔案",
	"displayOfSensitiveMediaIgnore": "顯示敏感檔案",
	"displayOfSensitiveMediaForce": "隱藏所有檔案",
	"displayOfSensitiveMedia": "敏感檔案的顯示",
	"postForm": "發文視窗",
	"keepCw": "保持隱藏內容",
	"rememberNoteVisibility": "記住貼文可見性",
	"enableQuickAddMfmFunction": "顯示進階 MFM 選擇器",
	"defaultNoteVisibility": "預設可見性",
	"visibilityPublic": "公開",
	"visibilityHome": "首頁",
	"visibilityFollowers": "追隨者",
	"visibilitySpecified": "指定使用者",
	"visibilityDisableFederation": "停用聯邦",
	"notifications": "通知",
	"useGroupedNotifications": "分組顯示通知訊息",
	"leftTop": "左上",
	"rightTop": "右上",
	"leftBottom": "左下",
	"rightBottom": "右下",
	"position": "位置",
	"vertical": "直向",
	"horizontal": "橫向",
	"stackAxis": "堆疊方向",
	"notificationCheckNotificationBehavior": "確認通知的顯示行為",
	"directMessage": "直接訊息",
	"settingsChatShowSenderName": "顯示發送者的名稱",
	"settingsChatSendOnEnter": "按下 Enter 發送訊息",
	"settingsIfOn": "開啟時",
	"chatSend": "發送",
	"chatNewline": "換行",
	"settingsIfOff": "關閉時",
	"accessibility": "輔助工具",
	"settingsAccessibilityBanner": "可針對客戶端的視覺和行為進行個人化設定，以達到更佳的使用效果。",
	"reduceUiAnimation": "減少介面的動態視覺",
	"disableShowingAnimatedImages": "不播放動態圖檔",
	"disableShowingAnimatedImages_caption": "無論這個設定如何，如果動畫圖片無法播放，可能是因為瀏覽器或作業系統的無障礙設定、省電設定等產生了干擾。",
	"enableAnimatedMfm": "啟用 MFM 動畫",
	"settingsShowPageTabBarBottom": "在底部顯示頁面的標籤列",
	"enableHorizontalSwipe": "滑動切換時間軸",
	"settingsEnablePullToRefresh": "下拉更新",
	"settingsEnablePullToRefresh_description": "使用滑鼠，按下並拖曳滾輪。",
	"keepScreenOn": "保持裝置螢幕開啟",
	"useNativeUIForVideoAudioPlayer": "使用瀏覽器的 UI 播放影片與音訊",
	"settingsMakeEveryTextElementsSelectable": "允許選取所有文字",
	"settingsMakeEveryTextElementsSelectable_description": "啟用此功能後，可能會在某些情境下降低可用性。",
	"popup": "彈出式視窗",
	"drawer": "側邊欄",
	"menuStyle": "選單風格",
	"contextMenuApp": "應用程式",
	"contextMenuAppWithShift": "Shift 鍵應用程式",
	"contextMenuNative": "瀏覽器的使用者介面",
	"contextMenuTitle": "內容功能表",
	"fontSize": "字體大小",
	"useSystemFont": "使用系統預設的字型",
	"performance": "性能",
	"settingsUiAnimations": "使用者介面的動畫效果\n",
	"turnOffToImprovePerformance": "關閉時會提高性能。",
	"settingsEnableAnimatedImages": "啟用動畫圖片",
	"useBlurEffect": "在 UI 上使用模糊效果",
	"useBlurEffectForModal": "在對話框使用模糊效果",
	"settingsEnableHighQualityImagePlaceholders": "顯示高品質的圖片預覽圖",
	"settingsUseStickyIcons": "使大頭貼跟隨捲動",
	"clientPerformanceIssueTipTitle": "如果覺得電池消耗過快的話",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker": "請將廣告阻擋器停用",
	"clientPerformanceIssueTipMakeSureDisabledAdBlocker_description": "廣告阻擋器可能會影響效能。請確認作業系統功能、瀏覽器設定或擴充功能中是否啟用了廣告阻擋器。\n",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss": "請停用自訂 CSS",
	"clientPerformanceIssueTipMakeSureDisabledCustomCss_description": "覆蓋樣式可能會影響效能。請確認是否啟用了自訂 CSS 或其他會覆蓋樣式的擴充功能。\n",
	"clientPerformanceIssueTipMakeSureDisabledAddons": "請停用擴充功能",
	"clientPerformanceIssueTipMakeSureDisabledAddons_description": "部分擴充功能可能會干擾用戶端的運作並影響效能。請嘗試停用瀏覽器的擴充功能，以確認是否能改善情況",
	"dataSaver": "數據節省模式",
	"reloadRequiredToApplySettings": "需要重新載入頁面設定才能生效。",
	"enableAll": "啟用全部",
	"disableAll": "停用全部",
	"dataSaverMediaTitle": "載入媒體檔案",
	"dataSaverMediaDescription": "防止自動載入圖片和影片。點擊隱藏的圖片/影片即可載入。",
	"dataSaverAvatarTitle": "大頭貼",
	"dataSaverAvatarDescription": "停止顯示大頭貼的動畫。由於動畫圖片的檔案大小可能比普通圖片大，這可以進一步減少資料流量。",
	"dataSaverDisableUrlPreviewTitle": "停用網址預覽",
	"dataSaverDisableUrlPreviewDescription": "停用網址預覽功能。與單獨使用縮圖不同，這樣可以減少載入連結資訊本身。",
	"dataSaverUrlPreviewThumbnailTitle": "不顯示網址預覽縮圖",
	"dataSaverUrlPreviewThumbnailDescription": "將不再自動載入網址預覽縮圖。",
	"dataSaverCodeTitle": "程式碼突出顯示",
	"dataSaverCodeDescription": "如果使用了程式碼突顯語法（如 MFM），則在點擊之前不會被載入。由於需要為對應的程式語言下載突顯定義檔案，因此關閉自動載入有助於減少資料流量。",
	"other": "其他",
	"squareAvatars": "大頭貼以方形顯示",
	"seasonalScreenEffect": "隨季節變換畫面的呈現",
	"openImageInNewTab": "於新分頁中開啟圖片",
	"withRepliesByDefaultForNewlyFollowed": "在追隨其他人後，預設在時間軸納入回覆的貼文",
	"serverDisconnectedBehaviorReload": "自動重載",
	"serverDisconnectedBehaviorDialog": "彈出式警告",
	"serverDisconnectedBehaviorQuiet": "非侵入式警告",
	"whenServerDisconnected": "與伺服器的連接中斷時",
	"numberOfPageCache": "快取頁面數",
	"numberOfPageCacheDescription": "增加數量會提高便利性，但也會增加負荷與記憶體使用量。",
	"forceShowAds": "總是顯示廣告",
	"hemisphereN": "北半球",
	"hemisphereS": "南半球",
	"hemisphere": "您居住的地區",
	"hemisphereCaption": "某些客戶端的設定會用此來判斷季節。",
	"additionalEmojiDictionary": "表情符號的附加辭典",
	"installed": "已安裝",
	"navbar": "導覽列",
	"statusbar": "狀態列",
	"deck": "多欄模式",
	"customCss": "自定義 CSS",
	"selectList": "選擇清單"
}
</locale>
