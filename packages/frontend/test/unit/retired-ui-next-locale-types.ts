/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Original formatter shapes retained only for frozen historical regression tests.
import type { ParameterizedString } from 'i18n';
import type { Locale as PreviousLocale } from './retired-ui-locale-types.js';

export type Locale = PreviousLocale & {
	'uploadNFiles': ParameterizedString<'n'>;
	'readAllChatMessages': string;
	'switchDarkModeManuallyWhenSyncEnabledConfirm': ParameterizedString<'x'>;
	'unselectFolder': string;
	'dropHereToUpload': string;
	'showMediaListByGridInWideArea': string;
	'newNote': string;
	'notificationSoundSettings': string;
	'unsetMfa': string;
	'unsetMfaConfirm': string;
	'disableShowingAnimatedImages_caption': string;
	'needToRestartServerToApply': string;
	'custom': string;
	'showRoleBadgesOfRemoteUsers': string;
	'notifyUsers': string;
	'externalServices': string;
	'sourceCodeIsNotYetProvided': string;
	'repositoryUrl': string;
	'repositoryUrlOrTarballRequired': string;
	'feedback': string;
	'feedbackUrl': string;
	'impressum': string;
	'impressumUrl': string;
	'impressumDescription': string;
	'privacyPolicy': string;
	'privacyPolicyUrl': string;
	'tosAndPrivacyPolicy': string;
	'avatarDecorations': string;
	'detach': string;
	'angle': string;
	'showAvatarDecorations': string;
	'releaseToRefresh': string;
	'refreshing': string;
	'pullDownToRefresh': string;
	'useGroupedNotifications': string;
	'emailVerificationFailedError': string;
	'reloadRequiredToApplySettings': string;
	'remainingN': ParameterizedString<'n'>;
	'seasonalScreenEffect': string;
	'decorate': string;
	'addMfmFunction': string;
	'enableQuickAddMfmFunction': string;
	'bubbleGame': string;
	'sfx': string;
	'soundWillBePlayed': string;
	'showReplay': string;
	'replaying': string;
	'endReplay': string;
	'ranking': string;
	'backToTitle': string;
	'hemisphere': string;
	'withSensitive': string;
	'userSaysSomethingSensitive': ParameterizedString<'name'>;
	'enableHorizontalSwipe': string;
	'loading': string;
	'notUsePleaseLeaveBlank': string;
	'useTotp': string;
	'useBackupCode': string;
	'launchApp': string;
	'useNativeUIForVideoAudioPlayer': string;
	'keepOriginalFilename': string;
	'keepOriginalFilenameDescription': string;
	'noDescription': string;
	'alwaysConfirmFollow': string;
	'confirmWhenRevealingSensitiveMedia': string;
	'createdLists': string;
	'fromX': ParameterizedString<'x'>;
	'performance': string;
	'modified': string;
	'discard': string;
	'thereAreNChanges': ParameterizedString<'n'>;
	'passkeyVerificationFailed': string;
	'passkeyVerificationSucceededButPasswordlessLoginDisabled': string;
	'messageToFollower': string;
	'target': string;
	'testCaptchaWarning': string;
	'prohibitedWordsForNameOfUser': string;
	'prohibitedWordsForNameOfUserDescription': string;
	'yourNameContainsProhibitedWords': string;
	'yourNameContainsProhibitedWordsDescription': string;
	'thisContentsAreMarkedAsSigninRequiredByAuthor': string;
	'lockdown': string;
	'pleaseSelectAccount': string;
	'availableRoles': string;
	'acknowledgeNotesAndEnable': string;
	'federationSpecified': string;
	'federationDisabled': string;
	'draftsAndScheduledNotes': string;
	'confirmOnReact': string;
	'reactAreYouSure': ParameterizedString<'emoji'>;
	'markAsSensitiveConfirm': string;
	'unmarkAsSensitiveConfirm': string;
	'preferences': string;
	'accessibility': string;
	'preferencesProfile': string;
	'noName': string;
	'skip': string;
	'restore': string;
	'syncBetweenDevices': string;
	'emojiPalette': string;
	'textCount': string;
	'directMessage': string;
	'right': string;
	'bottom': string;
	'top': string;
	'embed': string;
	'readonly': string;
	'goToDeck': string;
	'federationJobs': string;
	'driveAboutTip': string;
	'scrollToClose': string;
	'advice': string;
	'realtimeMode': string;
	'turnItOn': string;
	'turnItOff': string;
	'emojiMute': string;
	'emojiUnmute': string;
	'muteX': ParameterizedString<'x'>;
	'unmuteX': ParameterizedString<'x'>;
	'abort': string;
	'tip': string;
	'redisplayAllTips': string;
	'hideAllTips': string;
	'defaultCompressionLevel': string;
	'defaultCompressionLevel_description': string;
	'safeModeEnabled': string;
	'pluginsAreDisabledBecauseSafeMode': string;
	'customCssIsDisabledBecauseSafeMode': string;
	'themeIsDefaultBecauseSafeMode': string;
	'thankYouForTestingBeta': string;
	'schedulePost': string;
	'scheduleToPostOnX': ParameterizedString<'x'>;
	'scheduledToPostOnX': ParameterizedString<'x'>;
	'schedule': string;
	'scheduled': string;
	'youAreAdmin': string;
	'frame': string;
	'zeroPadding': string;
	'nothingToConfigure': string;
	'previewingTheme': string;
	'accessToken': string;
	'addToEmojiPalette': string;
	'urlPreviewSensitiveList': string;
	'urlPreviewSensitiveListDescription': string;
	'pixelatedZoom': string;
	'_imageEditing': {
		'_vars': {
			'caption': string;
			'filename_without_ext': string;
			'year': string;
			'month': string;
			'day': string;
			'hour': string;
			'minute': string;
			'second': string;
			'camera_model': string;
			'camera_lens_model': string;
			'camera_mm': string;
			'camera_mm_35': string;
			'camera_f': string;
			'camera_s': string;
			'camera_iso': string;
			'gps_lat': string;
			'gps_long': string;
		};
	};
	'_imageFrameEditor': {
		'title': string;
		'tip': string;
		'footer': string;
		'borderThickness': string;
		'labelThickness': string;
		'labelScale': string;
		'centered': string;
		'captionMain': string;
		'captionSub': string;
		'availableVariables': string;
		'withQrCode': string;
		'backgroundColor': string;
		'textColor': string;
		'quitWithoutSaveConfirm': string;
		'failedToLoadImage': string;
	};
	'_compression': {
		'_quality': {
			'high': string;
			'medium': string;
			'low': string;
		};
		'_size': {
			'large': string;
			'medium': string;
			'small': string;
		};
	};
	'_emojiPalette': {
		'palettes': string;
		'enableSyncBetweenDevicesForPalettes': string;
		'paletteForMain': string;
		'paletteForReaction': string;
	};
	'_settings': {
		'driveBanner': string;
		'pluginBanner': string;
		'notificationsBanner': string;
		'api': string;
		'webhook': string;
		'serviceConnection': string;
		'serviceConnectionBanner': string;
		'accountData': string;
		'accountDataBanner': string;
		'muteAndBlockBanner': string;
		'accessibilityBanner': string;
		'privacyBanner': string;
		'securityBanner': string;
		'preferencesBanner': string;
		'soundsBanner': string;
		'timelineAndNote': string;
		'makeEveryTextElementsSelectable': string;
		'makeEveryTextElementsSelectable_description': string;
		'useStickyIcons': string;
		'enableHighQualityImagePlaceholders': string;
		'uiAnimations': string;
		'showNavbarSubButtons': string;
		'ifOn': string;
		'ifOff': string;
		'enableSyncThemesBetweenDevices': string;
		'enablePullToRefresh': string;
		'enablePullToRefresh_description': string;
		'realtimeMode_description': string;
		'contentsUpdateFrequency': string;
		'contentsUpdateFrequency_description': string;
		'contentsUpdateFrequency_description2': string;
		'showAvailableReactionsFirstInNote': string;
		'showPageTabBarBottom': string;
		'emojiPaletteBanner': string;
		'enableAnimatedImages': string;
		'settingsPersistence_title': string;
		'settingsPersistence_description1': string;
		'settingsPersistence_description2': string;
		'_chat': {
			'showSenderName': string;
			'sendOnEnter': string;
		};
	};
	'_preferencesProfile': {
		'manageProfiles': string;
	};
	'_preferencesBackup': {
		'autoPreferencesBackupIsNotEnabledForThisDevice': string;
		'backupFound': string;
		'forceBackup': string;
	};
	'_followApproval': {
		'groupTitle': string;
		'inactiveDescription': string;
		'title': string;
		'autoAcceptDescription': string;
		'description': string;
		'local': string;
		'localDescription': string;
		'remote': string;
		'remoteDescription': string;
		'useDefault': string;
		'custom': string;
		'period': string;
		'unit': string;
		'invalidPeriod': string;
	};
	'_accountSettings': {
		'requireSigninToViewContents': string;
		'requireSigninToViewContentsDescription1': string;
		'makeNotesFollowersOnlyBeforeDescription': string;
		'makeNotesHiddenBefore': string;
		'makeNotesHiddenBeforeDescription': string;
		'mayNotEffectSomeSituations': string;
		'notesHavePassedSpecifiedPeriod': string;
		'notesOlderThanSpecifiedDateAndTime': string;
	};
	'_abuseUserReport': {
		'forward': string;
		'forwardDescription': string;
		'resolve': string;
		'accept': string;
		'reject': string;
		'resolveTutorial': string;
	};
	'_delivery': {
		'status': string;
		'resume': string;
	};
	'_bubbleGame': {
		'howToPlay': string;
		'hold': string;
		'_score': {
			'score': string;
			'scoreYen': string;
			'highScore': string;
			'maxChain': string;
			'yen': ParameterizedString<'yen'>;
			'estimatedQty': ParameterizedString<'qty'>;
			'scoreSweets': ParameterizedString<'onigiriQtyWithUnit'>;
		};
		'_howToPlay': {
			'section1': string;
			'section2': string;
			'section3': string;
		};
	};
	'_announcement': {
		'forExistingUsers': string;
		'forExistingUsersDescription': string;
		'needConfirmationToRead': string;
		'needConfirmationToReadDescription': string;
		'end': string;
		'tooManyActiveAnnouncementDescription': string;
		'readConfirmTitle': string;
		'readConfirmText': ParameterizedString<'title'>;
		'shouldNotBeUsedToPresentPermanentInfo': string;
		'dialogAnnouncementUxWarn': string;
		'silence': string;
		'silenceDescription': string;
	};
	'_initialAccountSetting': {
		'accountCreated': string;
		'letsStartAccountSetup': string;
		'privacySetting': string;
		'theseSettingsCanEditLater': string;
		'youCanEditMoreSettingsInSettingsPageLater': string;
		'followUsers': string;
		'pushNotificationDescription': ParameterizedString<'name'>;
		'initialAccountSettingCompleted': string;
		'haveFun': ParameterizedString<'name'>;
		'youCanContinueTutorial': ParameterizedString<'name'>;
		'skipAreYouSure': string;
		'laterAreYouSure': string;
	};
	'_serverRules': {
		'description': string;
	};
	'_serverSettings': {
		'iconUrl': string;
		'appIconDescription': ParameterizedString<'host'>;
		'appIconUsageExample': string;
		'appIconStyleRecommendation': string;
		'appIconResolutionMustBe': ParameterizedString<'resolution'>;
		'manifestJsonOverride': string;
		'shortName': string;
		'shortNameDescription': string;
		'fanoutTimelineDescription': string;
		'fanoutTimelineDbFallback': string;
		'fanoutTimelineDbFallbackDescription': string;
		'reactionsBufferingDescription': string;
		'remoteNotesCleaning': string;
		'remoteNotesCleaning_description': string;
		'remoteNotesCleaningMaxProcessingDuration': string;
		'remoteNotesCleaningExpiryDaysForEachNotes': string;
		'inquiryUrl': string;
		'inquiryUrlDescription': string;
		'openRegistration': string;
		'openRegistrationWarning': string;
		'thisSettingWillAutomaticallyOffWhenModeratorsInactive': string;
		'deliverSuspendedSoftware': string;
		'deliverSuspendedSoftwareDescription': string;
		'singleUserMode': string;
		'signToActivityPubGet': string;
		'signToActivityPubGet_description': string;
		'proxyRemoteFiles': string;
		'proxyRemoteFiles_description': string;
		'allowExternalApRedirect': string;
		'allowExternalApRedirect_description': string;
		'userGeneratedContentsVisibilityForVisitor': string;
		'userGeneratedContentsVisibilityForVisitor_description': string;
		'userGeneratedContentsVisibilityForVisitor_description2': string;
		'restartServerSetupWizardConfirm_title': string;
		'restartServerSetupWizardConfirm_text': string;
		'entrancePageStyle': string;
		'showTimelineForVisitor': string;
		'showActivitiesForVisitor': string;
		'_userGeneratedContentsVisibilityForVisitor': {
			'all': string;
			'localOnly': string;
			'none': string;
		};
	};
	'_accountMigration': {
		'moveFrom': string;
		'moveFromSub': string;
		'moveFromLabel': ParameterizedString<'n'>;
		'moveFromDescription': string;
		'moveTo': string;
		'moveToLabel': string;
		'moveCannotBeUndone': string;
		'moveAccountDescription': string;
		'moveAccountHowTo': string;
		'startMigration': string;
		'migrationConfirm': ParameterizedString<'account'>;
		'movedAndCannotBeUndone': string;
		'postMigrationNote': string;
		'movedTo': string;
	};
	'_sensitiveMediaDetection': {
		'description': string;
		'sensitivity': string;
		'sensitivityDescription': string;
		'setSensitiveFlagAutomatically': string;
		'setSensitiveFlagAutomaticallyDescription': string;
		'analyzeVideos': string;
		'analyzeVideosDescription': string;
		'externalServiceInfo': string;
		'apiUrl': string;
		'apiUrlDescription': string;
		'apiKey': string;
		'apiKeyDescription': string;
		'timeout': string;
		'timeoutDescription': string;
		'maxImagesPerRequest': string;
		'maxImagesPerRequestDescription': string;
	};
	'_emailUnavailable': {
		'banned': string;
	};
	'_ad': {
		'timezoneinfo': string;
		'adsSettings': string;
		'notesPerOneAd': string;
		'setZeroToDisable': string;
		'adsTooClose': string;
	};
	'_aboutMisskey': {
		'original': string;
		'thisIsModifiedVersion': ParameterizedString<'name'>;
	};
	'_displayOfSensitiveMedia': {
		'respect': string;
		'ignore': string;
		'force': string;
	};
	'_channel': {
		'nameOnly': string;
		'allowRenoteToExternal': string;
	};
	'_theme': {
		'copyThemeCode': string;
		'instanceTheme': string;
	};
	'_soundSettings': {
		'driveFile': string;
		'driveFileWarn': string;
		'driveFileTypeWarn': string;
		'driveFileTypeWarnDescription': string;
		'driveFileDurationWarn': string;
		'driveFileDurationWarnDescription': string;
		'driveFileError': string;
	};
	'_timeIn': {
		'seconds': ParameterizedString<'n'>;
		'minutes': ParameterizedString<'n'>;
		'hours': ParameterizedString<'n'>;
		'days': ParameterizedString<'n'>;
		'weeks': ParameterizedString<'n'>;
		'months': ParameterizedString<'n'>;
		'years': ParameterizedString<'n'>;
	};
	'_time': {
		'month': string;
	};
	'_2fa': {
		'registerTOTP': string;
		'step2Uri': string;
		'setupCompleted': string;
		'securityKeyNotSupported': string;
		'registerTOTPBeforeKey': string;
		'registerSecurityKey': string;
		'securityKeyName': string;
		'tapSecurityKey': string;
		'removeKey': string;
		'removeKeyConfirm': ParameterizedString<'name'>;
		'whyTOTPOnlyRenew': string;
		'renewTOTP': string;
		'renewTOTPConfirm': string;
		'renewTOTPOk': string;
		'checkBackupCodesBeforeCloseThisWizard': string;
		'backupCodes': string;
		'backupCodesDescription': string;
		'backupCodeUsedWarning': string;
		'backupCodesExhaustedWarning': string;
		'moreDetailedGuideHere': string;
	};
	'_auth': {
		'permission': ParameterizedString<'name'>;
		'accepted': string;
		'scopeUser': string;
		'byClickingYouWillBeRedirectedToThisUrl': string;
	};
	'_antennaSources': {
		'userBlacklist': string;
	};
	'_widgets': {
		'birthdayFollowings': string;
		'chat': string;
	};
	'_widgetOptions': {
		'showHeader': string;
		'transparent': string;
		'_clock': {
			'thickness': string;
			'thicknessThin': string;
			'thicknessMedium': string;
			'thicknessThick': string;
			'graduations': string;
			'graduationDots': string;
			'graduationArabic': string;
			'fadeGraduations': string;
			'sAnimation': string;
			'sAnimationElastic': string;
			'sAnimationEaseOut': string;
			'twentyFour': string;
			'labelTime': string;
			'labelTz': string;
			'labelTimeAndTz': string;
			'timezone': string;
		};
		'_jobQueue': {
			'sound': string;
		};
		'_rss': {
			'url': string;
			'refreshIntervalSec': string;
			'maxEntries': string;
		};
		'_rssTicker': {
			'shuffle': string;
			'duration': string;
			'reverse': string;
		};
	};
	'_visibility': {
		'disableFederation': string;
	};
	'_postForm': {
		'quitInspiteOfThereAreUnuploadedFilesConfirm': string;
		'uploaderTip': string;
		'showHowToUse': string;
		'_howToUse': {
			'content_title': string;
			'content_description': string;
			'toolbar_title': string;
			'toolbar_description': string;
			'account_title': string;
			'account_description': string;
			'visibility_description': string;
			'menu_description': string;
			'submit_title': string;
			'submit_description': string;
		};
	};
	'_profile': {
		'verifiedLinkDescription': string;
		'followedMessage': string;
		'followedMessageDescription': string;
		'followedMessageDescriptionForLockedAccount': string;
	};
	'_exportOrImport': {
		'withReplies': string;
	};
	'_play': {
		'new': string;
		'edit': string;
		'editThisPage': string;
		'visibilityDescription': string;
	};
	'_notification': {
		'scheduledNotePosted': string;
		'scheduledNotePostFailed': string;
		'roleAssigned': string;
		'chatRoomInvitationReceived': string;
		'checkNotificationBehavior': string;
		'sendTestNotification': string;
		'reactedBySomeUsers': ParameterizedString<'n'>;
		'likedBySomeUsers': ParameterizedString<'n'>;
		'renotedBySomeUsers': ParameterizedString<'n'>;
		'flushNotification': string;
		'createToken': string;
		'createTokenDescription': ParameterizedString<'text'>;
	};
	'_deck': {
		'columnGap': string;
		'deckMenuPosition': string;
		'navbarPosition': string;
		'newNoteNotificationSettings': string;
		'introduction': string;
		'introduction2': string;
		'useSimpleUiForNonRootPages': string;
		'usedAsMinWidthWhenFlexible': string;
		'flexible': string;
		'enableSyncBetweenDevicesForProfiles': string;
		'showHowToUse': string;
		'_howToUse': {
			'addColumn_title': string;
			'addColumn_description': string;
			'settings_title': string;
			'settings_description': string;
			'switchProfile_title': string;
			'switchProfile_description': string;
		};
		'_columns': {
			'chat': string;
		};
	};
	'_dialog': {
		'charactersExceeded': ParameterizedString<'current' | 'max'>;
		'charactersBelow': ParameterizedString<'current' | 'min'>;
	};
	'_disabledTimeline': {
		'title': string;
		'description': string;
	};
	'_webhookSettings': {
		'createWebhook': string;
		'modifyWebhook': string;
		'secret': string;
		'trigger': string;
		'_events': {
			'follow': string;
			'followed': string;
			'note': string;
			'reply': string;
			'reaction': string;
		};
		'_systemEvents': {
			'abuseReport': string;
			'abuseReportResolved': string;
			'userCreated': string;
			'inactiveModeratorsWarning': string;
			'inactiveModeratorsInvitationOnlyChanged': string;
		};
		'deleteConfirm': string;
		'testRemarks': string;
	};
	'_abuseReport': {
		'_notificationRecipient': {
			'createRecipient': string;
			'modifyRecipient': string;
			'recipientType': string;
			'_recipientType': {
				'webhook': string;
				'_captions': {
					'mail': string;
					'webhook': string;
				};
			};
			'notifiedUser': string;
			'notifiedWebhook': string;
		};
	};
	'_fileViewer': {
		'title': string;
		'type': string;
		'size': string;
		'uploadedAt': string;
		'attachedNotes': string;
		'usage': string;
		'thisPageCanBeSeenFromTheAuthor': string;
	};
	'_externalResourceInstaller': {
		'title': string;
		'checkVendorBeforeInstall': string;
		'_plugin': {
			'title': string;
		};
		'_theme': {
			'title': string;
		};
		'_meta': {
			'base': string;
		};
		'_vendorInfo': {
			'endpoint': string;
			'hashVerify': string;
		};
		'_errors': {
			'_invalidParams': {
				'title': string;
				'description': string;
			};
			'_resourceTypeNotSupported': {
				'title': string;
				'description': string;
			};
			'_failedToFetch': {
				'title': string;
				'fetchErrorDescription': string;
				'parseErrorDescription': string;
			};
			'_hashUnmatched': {
				'title': string;
				'description': string;
			};
			'_pluginParseFailed': {
				'title': string;
				'description': string;
			};
			'_pluginInstallFailed': {
				'title': string;
				'description': string;
			};
			'_themeParseFailed': {
				'title': string;
				'description': string;
			};
		};
	};
	'_dataSaver': {
		'_media': {
			'title': string;
			'description': string;
		};
		'_avatar': {
			'title': string;
			'description': string;
		};
		'_urlPreviewThumbnail': {
			'title': string;
			'description': string;
		};
		'_disableUrlPreview': {
			'title': string;
			'description': string;
		};
	};
	'_hemisphere': {
		'N': string;
		'S': string;
		'caption': string;
	};
	'_reversi': {
		'gameSettings': string;
		'blackIs': ParameterizedString<'name'>;
		'thisGameIsStartedSoon': string;
		'waitingForOther': string;
		'waitingForMe': string;
		'waitingBoth': string;
		'ready': string;
		'cancelReady': string;
		'opponentTurn': string;
		'myTurn': string;
		'turnOf': ParameterizedString<'name'>;
		'pastTurnOf': ParameterizedString<'name'>;
		'surrender': string;
		'surrendered': string;
		'timeout': string;
		'drawn': string;
		'won': ParameterizedString<'name'>;
		'turnCount': ParameterizedString<'count'>;
		'myGames': string;
		'allGames': string;
		'ended': string;
		'playing': string;
		'isLlotheo': string;
		'loopedMap': string;
		'canPutEverywhere': string;
		'timeLimitForEachTurn': string;
		'freeMatch': string;
		'lookingForPlayer': string;
		'gameCanceled': string;
		'shareToTlTheGameWhenStart': string;
		'iStartedAGame': string;
		'opponentHasSettingsChanged': string;
		'allowIrregularRules': string;
		'disallowIrregularRules': string;
		'showBoardLabels': string;
		'useAvatarAsStone': string;
	};
	'_urlPreviewSetting': {
		'title': string;
		'enable': string;
		'allowRedirect': string;
		'allowRedirectDescription': string;
		'timeout': string;
		'timeoutDescription': string;
		'maximumContentLength': string;
		'maximumContentLengthDescription': string;
		'requireContentLength': string;
		'requireContentLengthDescription': string;
		'userAgent': string;
		'userAgentDescription': string;
		'summaryProxy': string;
		'summaryProxyDescription': string;
		'summaryProxyDescription2': string;
	};
	'_mediaControls': {
		'pip': string;
		'playbackRate': string;
		'loop': string;
	};
	'_contextMenu': {
		'title': string;
	};
	'_roleSelectDialog': {
		'notSelected': string;
	};
	'_customEmojisManager': {
		'_gridCommon': {
			'deleteSelectionRows': string;
			'deleteSelectionRanges': string;
			'searchSettings': string;
			'searchSettingCaption': string;
			'searchLimit': string;
			'sortOrder': string;
			'registrationLogs': string;
			'registrationLogsCaption': string;
			'alertEmojisRegisterFailedDescription': string;
		};
		'_remote': {
			'selectionRowDetail': string;
			'importSelectionRows': string;
			'importSelectionRangesRows': string;
			'importEmojisButton': string;
			'confirmImportEmojisTitle': string;
			'confirmImportEmojisDescription': ParameterizedString<'count'>;
		};
		'_local': {
			'tabTitleList': string;
			'tabTitleRegister': string;
			'_list': {
				'emojisNothing': string;
				'markAsDeleteTargetRows': string;
				'markAsDeleteTargetRanges': string;
				'alertUpdateEmojisNothingDescription': string;
				'alertDeleteEmojisNothingDescription': string;
				'confirmMovePage': string;
				'confirmChangeView': string;
				'confirmUpdateEmojisDescription': ParameterizedString<'count'>;
				'confirmDeleteEmojisDescription': ParameterizedString<'count'>;
				'confirmResetDescription': string;
				'confirmMovePageDesciption': string;
			};
			'_register': {
				'uploadSettingTitle': string;
				'uploadSettingDescription': string;
				'directoryToCategoryLabel': string;
				'directoryToCategoryCaption': string;
				'confirmRegisterEmojisDescription': ParameterizedString<'count'>;
				'confirmClearEmojisDescription': string;
			};
		};
	};
	'_embedCodeGen': {
		'title': string;
		'header': string;
		'maxHeight': string;
		'maxHeightDescription': string;
		'maxHeightWarn': string;
		'previewIsNotActual': string;
		'rounded': string;
		'border': string;
		'applyToPreview': string;
		'generateCode': string;
		'codeGenerated': string;
		'codeGeneratedDescription': string;
	};
	'_followRequest': {
		'recieved': string;
		'sent': string;
	};
	'_captcha': {
		'verify': string;
		'testSiteKeyMessage': string;
		'_error': {
			'_requestFailed': {
				'title': string;
				'text': string;
			};
			'_verificationFailed': {
				'title': string;
				'text': string;
			};
			'_unknown': {
				'title': string;
				'text': string;
			};
		};
	};
	'_search': {
		'searchScopeServer': string;
		'pleaseEnterServerHost': string;
		'pleaseSelectUser': string;
		'postFrom': string;
		'postTo': string;
	};
	'_serverSetupWizard': {
		'installCompleted': string;
		'firstCreateAccount': string;
		'accountCreated': string;
		'serverSetting': string;
		'youCanEasilyConfigureOptimalServerSettingsWithThisWizard': string;
		'settingsYouMakeHereCanBeChangedLater': string;
		'howWillYouUseMisskey': string;
		'_use': {
			'single': string;
			'single_description': string;
			'single_youCanCreateMultipleAccounts': string;
			'group': string;
			'group_description': string;
			'open': string;
			'open_description': string;
		};
		'openServerAdvice': string;
		'openServerAntiSpamAdvice': string;
		'howManyUsersDoYouExpect': string;
		'_scale': {
			'small': string;
			'medium': string;
			'large': string;
		};
		'largeScaleServerAdvice': string;
		'doYouConnectToFediverse': string;
		'doYouConnectToFediverse_description1': string;
		'doYouConnectToFediverse_description2': string;
		'youCanConfigureMoreFederationSettingsLater': string;
		'remoteContentsCleaning': string;
		'remoteContentsCleaning_description': string;
		'adminInfo': string;
		'adminInfo_description': string;
		'adminInfo_mustBeFilled': string;
		'followingSettingsAreRecommended': string;
		'applyTheseSettings': string;
		'skipSettings': string;
		'settingsCompleted': string;
		'settingsCompleted_description': string;
		'settingsCompleted_description2': string;
		'donationRequest': string;
		'_donationRequest': {
			'text1': string;
			'text2': string;
			'text3': string;
		};
	};
	'_clientPerformanceIssueTip': {
		'title': string;
		'makeSureDisabledAdBlocker': string;
		'makeSureDisabledAdBlocker_description': string;
		'makeSureDisabledCustomCss': string;
		'makeSureDisabledCustomCss_description': string;
		'makeSureDisabledAddons': string;
		'makeSureDisabledAddons_description': string;
	};
	'_clip': {
		'tip': string;
	};
	'_userLists': {
		'tip': string;
	};
	'watermark': string;
	'defaultPreset': string;
	'_watermarkEditor': {
		'tip': string;
		'quitWithoutSaveConfirm': string;
		'driveFileTypeWarn': string;
		'driveFileTypeWarnDescription': string;
		'title': string;
		'cover': string;
		'repeat': string;
		'preserveBoundingRect': string;
		'qr': string;
		'margin': string;
		'angle': string;
		'stripe': string;
		'stripeWidth': string;
		'stripeFrequency': string;
		'polkadot': string;
		'checker': string;
		'polkadotMainDotOpacity': string;
		'polkadotMainDotRadius': string;
		'polkadotSubDotOpacity': string;
		'polkadotSubDotRadius': string;
		'polkadotSubDotDivisions': string;
		'leaveBlankToAccountUrl': string;
		'failedToLoadImage': string;
	};
	'drafts': string;
	'_drafts': {
		'cannotCreateDraft': string;
		'delete': string;
		'deleteAreYouSure': string;
		'noDrafts': string;
		'replyTo': ParameterizedString<'user'>;
		'quoteOf': ParameterizedString<'user'>;
		'postTo': ParameterizedString<'channel'>;
		'saveToDraft': string;
		'restore': string;
		'listDrafts': string;
		'listScheduledNotes': string;
		'cancelSchedule': string;
	};
	'qr': string;
	'_qr': {
		'readTabTitle': string;
		'shareTitle': ParameterizedString<'name' | 'acct'>;
		'shareText': string;
		'chooseCamera': string;
		'cannotToggleFlash': string;
		'turnOnFlash': string;
		'turnOffFlash': string;
		'startQr': string;
		'stopQr': string;
		'noQrCodeFound': string;
		'scanFile': string;
		'mfm': string;
	};
};
