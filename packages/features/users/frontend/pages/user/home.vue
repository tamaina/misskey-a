<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component :is="prefer.s.enablePullToRefresh ? MkPullToRefresh : 'div'" :refresher="() => reload()">
	<div class="_spacer" :style="{ '--MI_SPACER-w': narrow ? '800px' : '1100px' }">
		<div ref="rootEl" class="ftskorzw" :class="{ wide: !narrow }" style="container-type: inline-size;">
			<div class="main _gaps">
				<!-- TODO -->
				<!-- <div class="punished" v-if="user.isSuspended"><i class="ti ti-alert-triangle" style="margin-right: 8px;"></i> {{ $locale.sfc.userSuspended }}</div> -->
				<!-- <div class="punished" v-if="user.isSilenced"><i class="ti ti-alert-triangle" style="margin-right: 8px;"></i> {{ $locale.sfc.userSilenced }}</div> -->

				<div class="profile _gaps">
					<MkAccountMoved v-if="user.movedTo" :movedTo="user.movedTo"/>
					<MkRemoteCaution v-if="user.host != null" :href="user.url ?? user.uri!"/>
					<MkInfo v-if="user.host == null && user.username.includes('.')">{{ $locale.sfc.isSystemAccount }}</MkInfo>

					<div :key="user.id" class="main _panel">
						<div ref="bannerEl" class="banner-container">
							<div class="banner" :style="style"></div>
							<div class="fade"></div>
							<div class="title">
								<MkUserName class="name" :user="user" :nowrap="true"/>
								<div class="bottom">
									<span class="username"><MkAcct :user="user" :detail="true"/></span>
									<span v-if="user.isLocked"><i class="ti ti-lock"></i></span>
									<span v-if="user.isBot"><i class="ti ti-robot"></i></span>
									<button v-if="$i && !isEditingMemo && !memoDraft" class="_button add-note-button" @click="showMemoTextarea">
										<i class="ti ti-edit"></i> {{ $locale.sfc.addMemo }}
									</button>
								</div>
							</div>
							<span v-if="$i && $i.id != user.id && user.isFollowed" class="followed">{{ $locale.sfc.followsYou }}</span>
							<div class="actions">
								<button class="menu _button" @click="menu"><i class="ti ti-dots"></i></button>
								<MkFollowButton v-if="$i?.id != user.id" v-model:user="user" :inline="true" :transparent="false" :full="true" class="koudoku"/>
							</div>
						</div>
						<MkAvatar class="avatar" :user="user" indicator/>
						<div class="title">
							<MkUserName :user="user" :nowrap="false" class="name"/>
							<div class="bottom">
								<span class="username"><MkAcct :user="user" :detail="true"/></span>
								<span v-if="user.isLocked"><i class="ti ti-lock"></i></span>
								<span v-if="user.isBot"><i class="ti ti-robot"></i></span>
							</div>
						</div>
						<div v-if="user.followedMessage != null" class="followedMessage">
							<MkFukidashi class="fukidashi" :tail="narrow ? 'none' : 'left'" negativeMargin>
								<div class="messageHeader">{{ $locale.sfc.messageToFollower }}</div>
								<div><MkSparkle><Mfm :plain="true" :text="user.followedMessage" :author="user" class="_selectable"/></MkSparkle></div>
							</MkFukidashi>
						</div>
						<div v-if="user.roles.length > 0" class="roles">
							<span v-for="role in user.roles" :key="role.id" v-tooltip="role.description" class="role" :style="{ '--color': role.color ?? '' }">
								<MkA v-adaptive-bg :to="`/roles/${role.id}`">
									<img v-if="role.iconUrl" style="height: 1.3em; vertical-align: -22%;" :src="role.iconUrl"/>
									{{ role.name }}
								</MkA>
							</span>
						</div>
						<div v-if="iAmModerator" class="moderationNote">
							<MkTextarea v-if="editModerationNote || (moderationNote != null && moderationNote !== '')" v-model="moderationNote" manualSave @savingStateChange="(changed) => { isModerationNoteDirty = changed; }">
								<template #label>{{ $locale.sfc.moderationNote }}</template>
								<template #caption>{{ $locale.sfc.moderationNoteDescription }}</template>
							</MkTextarea>
							<div v-else>
								<MkButton small @click="editModerationNote = true">{{ $locale.sfc.addModerationNote }}</MkButton>
							</div>
						</div>
						<div v-if="isEditingMemo || memoDraft" class="memo" :class="{'no-memo': !memoDraft}">
							<div class="heading">{{ $locale.sfc.memo }}</div>
							<textarea
								ref="memoTextareaEl"
								v-model="memoDraft"
								rows="1"
								@focus="isEditingMemo = true"
								@blur="updateMemo"
								@input="adjustMemoTextarea"
							></textarea>
						</div>
						<div class="description">
							<MkOmit>
								<Mfm v-if="user.description" :text="user.description" :isNote="false" :author="user" class="_selectable"/>
								<p v-else class="empty">{{ $locale.sfc.noAccountDescription }}</p>
							</MkOmit>
						</div>
						<div class="fields system">
							<dl v-if="user.location" class="field">
								<dt class="name"><i class="ti ti-map-pin ti-fw"></i> {{ $locale.sfc.location }}</dt>
								<dd class="value">{{ user.location }}</dd>
							</dl>
							<dl v-if="user.birthday" class="field">
								<dt class="name"><i class="ti ti-cake ti-fw"></i> {{ $locale.sfc.birthday }}</dt>
								<dd class="value">{{ user.birthday.replace('-', '/').replace('-', '/') }} ({{ interpolateLocaleParameters($locale.sfc.yearsOld, { age }) }})</dd>
							</dl>
							<dl class="field">
								<dt class="name"><i class="ti ti-calendar ti-fw"></i> {{ $locale.sfc.registeredDate }}</dt>
								<dd class="value">{{ dateString(user.createdAt) }} (<MkTime :time="user.createdAt"/>)</dd>
							</dl>
						</div>
						<div v-if="user.fields.length > 0" class="fields">
							<dl v-for="(field, i) in user.fields" :key="i" class="field">
								<dt class="name">
									<Mfm :text="field.name" :author="user" :plain="true" :colored="false" class="_selectable"/>
								</dt>
								<dd class="value">
									<Mfm :text="field.value" :author="user" :colored="false" class="_selectable"/>
									<i v-if="user.verifiedLinks.includes(field.value)" v-tooltip:dialog="$locale.sfc.verifiedLink" class="ti ti-circle-check" :class="$style.verifiedLink"></i>
								</dd>
							</dl>
						</div>
						<div class="status">
							<MkA :to="userPage(user, 'notes')">
								<b>{{ number(user.notesCount) }}</b>
								<span>{{ $locale.sfc.notes }}</span>
							</MkA>
							<MkA v-if="isFollowingVisibleForMe(user)" :to="userPage(user, 'following')">
								<b>{{ number(user.followingCount) }}</b>
								<span>{{ $locale.sfc.following }}</span>
							</MkA>
							<MkA v-if="isFollowersVisibleForMe(user)" :to="userPage(user, 'followers')">
								<b>{{ number(user.followersCount) }}</b>
								<span>{{ $locale.sfc.followers }}</span>
							</MkA>
						</div>
					</div>
				</div>

				<div class="contents _gaps">
					<div v-if="user.pinnedNotes.length > 0" class="_gaps">
						<MkNote v-for="note in user.pinnedNotes" :key="note.id" class="note _panel" :note="note" :pinned="true"/>
					</div>
					<MkInfo v-else-if="$i && $i.id === user.id">{{ $locale.sfc.userPagePinTip }}</MkInfo>
					<template v-if="narrow">
						<MkLazy>
							<XFiles :key="user.id" :user="user" @showMore="emit('showMoreFiles')"/>
						</MkLazy>
						<MkLazy>
							<XActivity :key="user.id" :user="user"/>
						</MkLazy>
					</template>
					<div v-if="!disableNotes">
						<MkLazy>
							<XTimeline ref="timelineEl" :user="user"/>
						</MkLazy>
					</div>
				</div>
			</div>
			<div v-if="!narrow" class="sub _gaps" style="container-type: inline-size;">
				<XFiles :key="user.id" :user="user" @showMore="emit('showMoreFiles')"/>
				<XActivity :key="user.id" :user="user"/>
			</div>
		</div>
	</div>
</component>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, computed, onMounted, onUnmounted, onActivated, onDeactivated, nextTick, watch, ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import { getScrollContainer } from '@features/ui/frontend/shared/scroll.js';
import MkNote from '@features/notes/frontend/components/MkNote.vue';
import MkFollowButton from '@features/relationships/frontend/components/MkFollowButton.vue';
import MkAccountMoved from '@features/users/frontend/components/MkAccountMoved.vue';
import MkFukidashi from '@features/ui/frontend/components/MkFukidashi.vue';
import MkRemoteCaution from '@features/federation/frontend/components/MkRemoteCaution.vue';
import MkTextarea from '@features/ui/frontend/components/MkTextarea.vue';
import MkOmit from '@features/ui/frontend/components/MkOmit.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import { getUserMenu } from '@features/users/frontend/utility/get-user-menu.js';
import number from '@features/ui/frontend/filters/number.js';
import { userPage } from '@features/users/frontend/filters/user.js';
import * as os from '@features/ui/frontend/os.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { $i, iAmModerator } from '@features/auth/frontend/i.js';
import { dateString } from '@features/ui/frontend/filters/date.js';
import { confetti } from '@features/ui/frontend/utility/confetti.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { isFollowingVisibleForMe, isFollowersVisibleForMe } from '@features/relationships/frontend/utility/isFfVisibleForMe.js';
import { useRouter } from '@features/navigation/frontend/router.js';
import { getStaticImageUrl } from '@features/media/frontend/utility/media-proxy.js';
import MkSparkle from '@features/ui/frontend/components/MkSparkle.vue';
import { prefer } from '@features/preferences/frontend/preferences.js';
import MkPullToRefresh from '@features/ui/frontend/components/MkPullToRefresh.vue';
import { isBirthday } from '@features/users/frontend/utility/is-birthday.js';
import type XTimeline_TypeReferenceOnly from '@features/timelines/frontend/pages/user/index.timeline.vue';

function calcAge(birthdate: string): number {
	const date = new Date(birthdate);
	const now = new Date();

	let yearDiff = now.getFullYear() - date.getFullYear();
	const monthDiff = now.getMonth() - date.getMonth();
	const pastDate = now.getDate() < date.getDate();

	if (monthDiff < 0 || (monthDiff === 0 && pastDate)) {
		yearDiff--;
	}

	return yearDiff;
}

const XFiles = defineAsyncComponent(() => import('@features/notes/frontend/pages/user/index.files.vue'));
const XActivity = defineAsyncComponent(() => import('@features/statistics/frontend/pages/user/index.activity.vue'));
const XTimeline = defineAsyncComponent(() => import('@features/timelines/frontend/pages/user/index.timeline.vue'));

const props = withDefaults(defineProps<{
	user: Misskey.entities.UserDetailed;
	/** Refetches the user in place. Supplied by the parent page. */
	refreshUser?: () => Promise<void>;
	/** Test only; MkNotesTimeline currently causes problems in vitest */
	disableNotes?: boolean;
}>(), {
	refreshUser: undefined,
	disableNotes: false,
});

const emit = defineEmits<{
	(ev: 'showMoreFiles'): void;
}>();

const router = useRouter();

const user = ref(props.user);
const narrow = ref<null | boolean>(null);
const rootEl = useTemplateRef('rootEl');
const bannerEl = useTemplateRef('bannerEl');
const memoTextareaEl = useTemplateRef('memoTextareaEl');
const timelineEl = useTemplateRef<InstanceType<typeof XTimeline_TypeReferenceOnly>>('timelineEl');
const memoDraft = ref(props.user.memo);
const isEditingMemo = ref(false);
const moderationNote = ref(props.user.moderationNote ?? '');
const editModerationNote = ref(false);
const isModerationNoteDirty = ref(false);

watch(moderationNote, async (newValue) => {
	// 再取得した値を同期しただけの場合は保存しない
	if (newValue === (user.value.moderationNote ?? '')) return;
	await misskeyApi('admin/update-user-note', { userId: user.value.id, text: newValue });
	user.value = { ...user.value, moderationNote: newValue };
});

const style = computed(() => {
	if (props.user.bannerUrl == null) return {};
	if (prefer.s.disableShowingAnimatedImages) {
		return {
			backgroundImage: `url(${ getStaticImageUrl(props.user.bannerUrl) })`,
		};
	} else {
		return {
			backgroundImage: `url(${ props.user.bannerUrl })`,
		};
	};
});

const age = computed(() => {
	return props.user.birthday ? calcAge(props.user.birthday) : NaN;
});

function menu(ev: PointerEvent) {
	const { menu, cleanup } = getUserMenu(user.value, router);
	os.popupMenu(menu, ev.currentTarget ?? ev.target).finally(cleanup);
}

function showMemoTextarea() {
	isEditingMemo.value = true;
	nextTick(() => {
		memoTextareaEl.value?.focus();
	});
}

function adjustMemoTextarea() {
	if (!memoTextareaEl.value) return;
	memoTextareaEl.value.style.height = '0px';
	memoTextareaEl.value.style.height = `${memoTextareaEl.value.scrollHeight}px`;
}

async function updateMemo() {
	await misskeyApi('users/update-memo', {
		memo: memoDraft.value,
		userId: props.user.id,
	});
	isEditingMemo.value = false;
}

watch(() => props.user, () => {
	user.value = props.user;
	// 編集中は上書きしない (入力中の内容を消してしまう)
	if (!isModerationNoteDirty.value) moderationNote.value = props.user.moderationNote ?? '';
	if (isEditingMemo.value) return;
	memoDraft.value = props.user.memo;
});

// ここでは失敗は握りつぶす（Pull to Refreshがもどらなくなるので）
async function reload() {
	await Promise.allSettled([
		props.refreshUser?.(),
		timelineEl.value?.reload(),
	]);
}

let bannerParallaxResizeObserver: ResizeObserver | null = null;

function calcBannerParallax() {
	if (!bannerEl.value || !CSS.supports('view-timeline-inset', 'auto 100px')) return;
	const elRect = bannerEl.value.getBoundingClientRect();
	const scrollEl = getScrollContainer(bannerEl.value);
	const scrollPosition = scrollEl?.scrollTop ?? window.scrollY;
	const scrollContainerHeight = scrollEl?.clientHeight ?? window.innerHeight;
	const scrollContainerTop = scrollEl?.getBoundingClientRect().top ?? 0;
	const top = scrollPosition + elRect.top - scrollContainerTop;
	const bottom = scrollContainerHeight - top;
	bannerEl.value.style.setProperty('--bannerParallaxInset', `auto ${bottom}px`);
}

function initCalcBannerParallax() {
	const scrollEl = bannerEl.value ? getScrollContainer(bannerEl.value) : null;
	if (scrollEl != null && CSS.supports('view-timeline-inset', 'auto 100px')) {
		bannerParallaxResizeObserver = new ResizeObserver(() => {
			calcBannerParallax();
		});
		bannerParallaxResizeObserver.observe(scrollEl);
	}
}

function disposeBannerParallaxResizeObserver() {
	if (bannerParallaxResizeObserver) {
		bannerParallaxResizeObserver.disconnect();
		bannerParallaxResizeObserver = null;
	}
}

onMounted(() => {
	narrow.value = rootEl.value!.clientWidth < 1000;

	if (isBirthday(user.value)) {
		confetti({
			duration: 1000 * 4,
		});
	}

	nextTick(() => {
		calcBannerParallax();
		adjustMemoTextarea();
	});

	initCalcBannerParallax();
});

onActivated(() => {
	if (bannerEl.value) {
		calcBannerParallax();
		initCalcBannerParallax();
	}
});

onUnmounted(disposeBannerParallaxResizeObserver);
onDeactivated(disposeBannerParallaxResizeObserver);
</script>

<style lang="scss" scoped>
.ftskorzw {

	> .main {

		> .punished {
			font-size: 0.8em;
			padding: 16px;
		}

		> .profile {

			> .main {
				position: relative;
				overflow: clip;

				> .banner-container {
					position: relative;
					--bannerHeight: 250px;
					height: var(--bannerHeight);
					overflow: clip;

					> .banner {
						width: 100%;
						height: 100%;
						background-size: cover;
						background-color: #4c5e6d;
						background-repeat: repeat-y;
						background-position-x: center;
						background-position-y: 50%;
						will-change: background-position-y;
					}

					> .fade {
						position: absolute;
						bottom: 0;
						left: 0;
						width: 100%;
						height: 78px;
						background: linear-gradient(transparent, rgba(#000, 0.7));
					}

					> .followed {
						position: absolute;
						top: 12px;
						left: 12px;
						padding: 4px 8px;
						color: #fff;
						background: rgba(0, 0, 0, 0.7);
						font-size: 0.7em;
						border-radius: 6px;
					}

					> .actions {
						position: absolute;
						top: 12px;
						right: 12px;
						-webkit-backdrop-filter: var(--MI-blur, blur(8px));
						backdrop-filter: var(--MI-blur, blur(8px));
						background: rgba(0, 0, 0, 0.2);
						padding: 8px;
						border-radius: 24px;

						> .menu {
							vertical-align: bottom;
							height: 31px;
							width: 31px;
							color: #fff;
							text-shadow: 0 0 8px #000;
							font-size: 16px;
						}

						> .koudoku {
							margin-left: 4px;
							vertical-align: bottom;
						}
					}

					> .title {
						position: absolute;
						bottom: 0;
						left: 0;
						width: 100%;
						padding: 0 0 8px 154px;
						box-sizing: border-box;
						color: #fff;

						> .name {
							display: block;
							margin: -10px;
							padding: 10px;
							line-height: 32px;
							font-weight: bold;
							font-size: 1.8em;
							filter: drop-shadow(0 0 4px #000);
						}

						> .bottom {
							> * {
								display: inline-block;
								margin-right: 16px;
								line-height: 20px;
								opacity: 0.8;

								&.username {
									font-weight: bold;
								}
							}

							> .add-note-button {
								background: rgba(0, 0, 0, 0.2);
								color: #fff;
								-webkit-backdrop-filter: var(--MI-blur, blur(8px));
								backdrop-filter: var(--MI-blur, blur(8px));
								border-radius: 24px;
								padding: 4px 8px;
								font-size: 80%;
							}
						}
					}
				}

				> .title {
					display: none;
					text-align: center;
					padding: 50px 8px 16px 8px;
					font-weight: bold;
					border-bottom: solid 0.5px var(--MI_THEME-divider);

					> .bottom {
						> * {
							display: inline-block;
							margin-right: 8px;
							opacity: 0.8;
						}
					}
				}

				> .avatar {
					display: block;
					position: absolute;
					top: 170px;
					left: 16px;
					z-index: 2;
					width: 120px;
					height: 120px;
					box-shadow: 1px 1px 3px rgba(#000, 0.2);
				}

				> .followedMessage {
					padding: 24px 24px 0 154px;

					> .fukidashi {
						display: block;
						--fukidashi-bg: color-mix(in srgb, var(--MI_THEME-accent), var(--MI_THEME-panel) 85%);
						--fukidashi-radius: 16px;
						font-size: 0.9em;

						.messageHeader {
							opacity: 0.7;
							font-size: 0.85em;
						}
					}
				}

				> .roles {
					padding: 24px 24px 0 154px;
					font-size: 0.95em;
					display: flex;
					flex-wrap: wrap;
					gap: 8px;

					> .role {
						border: solid 1px var(--color, var(--MI_THEME-divider));
						border-radius: 999px;
						margin-right: 4px;
						padding: 3px 8px;
					}
				}

				> .moderationNote {
					margin: 12px 24px 0 154px;
				}

				> .memo {
					margin: 12px 24px 0 154px;
					background: transparent;
					color: var(--MI_THEME-fg);
					border: 1px solid var(--MI_THEME-divider);
					border-radius: 8px;
					padding: 8px;
					line-height: 0;

					> .heading {
						text-align: left;
						color: color(from var(--MI_THEME-fg) srgb r g b / 0.5);
						line-height: 1.5;
						font-size: 85%;
					}

					textarea {
						margin: 0;
						padding: 0;
						resize: none;
						border: none;
						outline: none;
						width: 100%;
						height: auto;
						min-height: 0;
						line-height: 1.5;
						color: var(--MI_THEME-fg);
						overflow: hidden;
						background: transparent;
						font-family: inherit;
					}
				}

				> .description {
					padding: 24px 24px 24px 154px;
					font-size: 0.95em;

					> .empty {
						margin: 0;
						opacity: 0.5;
					}
				}

				> .fields {
					padding: 24px;
					font-size: 0.9em;
					border-top: solid 0.5px var(--MI_THEME-divider);

					> .field {
						display: flex;
						padding: 0;
						margin: 0;
						align-items: center;

						&:not(:last-child) {
							margin-bottom: 8px;
						}

						> .name {
							width: 30%;
							overflow: hidden;
							white-space: nowrap;
							text-overflow: ellipsis;
							font-weight: bold;
							text-align: center;
						}

						> .value {
							width: 70%;
							overflow: hidden;
							white-space: nowrap;
							text-overflow: ellipsis;
							margin: 0;
						}
					}

					&.system > .field > .name {
					}
				}

				> .status {
					display: flex;
					padding: 24px;
					border-top: solid 0.5px var(--MI_THEME-divider);

					> a {
						flex: 1;
						text-align: center;

						&.active {
							color: var(--MI_THEME-accent);
						}

						&:hover {
							text-decoration: none;
						}

						> b {
							display: block;
							line-height: 16px;
						}

						> span {
							font-size: 70%;
						}
					}
				}
			}
		}

		> .contents {
			> .content {
				margin-bottom: var(--MI-margin);
			}
		}
	}

	&.wide {
		display: flex;
		width: 100%;

		> .main {
			width: 100%;
			min-width: 0;
		}

		> .sub {
			max-width: 350px;
			min-width: 350px;
			margin-left: var(--MI-margin);
		}
	}
}

@container (max-width: 500px) {
	.ftskorzw {
		> .main {
			> .profile > .main {
				> .banner-container {
					--bannerHeight: 140px;
					height: var(--bannerHeight);

					> .fade {
						display: none;
					}

					> .title {
						display: none;
					}
				}

				> .title {
					display: block;
				}

				> .avatar {
					top: 90px;
					left: 0;
					right: 0;
					width: 92px;
					height: 92px;
					margin: auto;
				}

				> .followedMessage {
					padding: 16px 16px 0 16px;
				}

				> .roles {
					padding: 16px 16px 0 16px;
					justify-content: center;
				}

				> .moderationNote {
					margin: 16px 16px 0 16px;
				}

				> .memo {
					margin: 16px 16px 0 16px;
				}

				> .description {
					padding: 16px;
					text-align: center;
				}

				> .fields {
					padding: 16px;
				}

				> .status {
					padding: 16px;
				}
			}

			> .contents {
				> .nav {
					font-size: 80%;
				}
			}
		}
	}
}

@supports (view-timeline-name: --name) {
	.ftskorzw {
		> .main {
			> .profile > .main {
				> .banner-container {
					view-timeline-name: --bannerParallax;
					view-timeline-inset: var(--bannerParallaxInset, auto);
					view-timeline-axis: block;

					> .banner {
						animation: bannerParallaxKeyframes linear both;
						animation-timeline: --bannerParallax;
						animation-range: cover;
					}
				}
			}
		}
	}
}

@keyframes bannerParallaxKeyframes {
	from {
		background-position-y: 50%;
	}
	to {
		background-position-y: calc(50% + var(--bannerHeight, 250px) / 3);
	}
}
</style>

<style lang="scss" module>
.tl {
	background: var(--MI_THEME-bg);
	border-radius: var(--MI-radius);
	overflow: clip;
}

.verifiedLink {
	margin-left: 4px;
	color: var(--MI_THEME-success);
}
</style>

<locale lang="json" locale="ar-SA">
{
	"userSuspended": "عُلق هذا المستخدم.",
	"userSilenced": "كُتم هذا المستخدم.",
	"isSystemAccount": "حساب أنشأه النظام ويُدار من قِبله.",
	"addMemo": "Add memo",
	"followsYou": "يتابعك",
	"messageToFollower": "Message to followers",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"addModerationNote": "Add moderation note",
	"memo": "تذكير",
	"noAccountDescription": "لم يكتب هذا المستخدم سيرته بعد.",
	"location": "الموقع الجغرافي",
	"birthday": "تاريخ الميلاد",
	"yearsOld": "{age} سنة",
	"registeredDate": "انضم في",
	"verifiedLink": "Link ownership has been verified",
	"notes": "الملاحظات",
	"following": "المتابَعون",
	"followers": "المتابِعون",
	"userPagePinTip": "لعرض ملاحظة هنا اختر \"ثبتها على الصفحة الشخصية\" من قائمة تلك الملاحظة."
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"userSuspended": "Aquest usuari ha sigut suspès",
	"userSilenced": "Aquest usuari està sent silenciat",
	"isSystemAccount": "Un compte creat i operat automàticament pel sistema.",
	"addMemo": "Afegir recordatori",
	"followsYou": "Et segueix",
	"messageToFollower": "Missatge als meus seguidors",
	"moderationNote": "Nota de moderació ",
	"moderationNoteDescription": "Pots escriure notes que es compartiran entre els moderadors.",
	"addModerationNote": "Afegeix una nota de moderació ",
	"memo": "Recordatori",
	"noAccountDescription": "Aquest usuari encara no ha escrit la seva biografia.",
	"location": "Ubicació",
	"birthday": "Aniversari",
	"yearsOld": "{age} anys",
	"registeredDate": "Data de registre",
	"verifiedLink": "La propietat de l'enllaç ha sigut verificada",
	"notes": "Notes",
	"following": "Segueixes ",
	"followers": "Seguidors",
	"userPagePinTip": "Podeu seleccionar \"Fixar al perfil\" del menú de notes individuals per mostrar les notes aquí."
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"userSuspended": "Tomuto uživateli byl pozastaven účet.",
	"userSilenced": "Tenhle uživatel je umlčen.",
	"isSystemAccount": "Účet automaticky vytvořený a ovládaný serverem.",
	"addMemo": "Přidat memo",
	"followsYou": "Sledují vás",
	"messageToFollower": "Message to followers",
	"moderationNote": "Poznámka moderátora",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"addModerationNote": "Add moderation note",
	"memo": "Memo",
	"noAccountDescription": "Tento uživatel zatím nenapsal svou biografii.",
	"location": "Lokace",
	"birthday": "Datum narození",
	"yearsOld": "{age} let",
	"registeredDate": "Datum registrace",
	"verifiedLink": "Link ownership has been verified",
	"notes": "Poznámky",
	"following": "Sledovaní",
	"followers": "Sledující",
	"userPagePinTip": "Zde můžete zobrazovat poznámky vybráním \"Připnout na profil\" z menu jednotlivých poznámek."
}
</locale>

<locale lang="json" locale="da-DK">
{
	"userSuspended": "This user has been suspended.",
	"userSilenced": "This user is being silenced.",
	"isSystemAccount": "An account created and automatically operated by the system.",
	"addMemo": "Add memo",
	"followsYou": "Follows you",
	"messageToFollower": "Message to followers",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"addModerationNote": "Add moderation note",
	"memo": "Memo",
	"noAccountDescription": "This user has not written their bio yet.",
	"location": "Location",
	"birthday": "Birthday",
	"yearsOld": "{age} years old",
	"registeredDate": "Joined on",
	"verifiedLink": "Link ownership has been verified",
	"notes": "Notes",
	"following": "Following",
	"followers": "Followers",
	"userPagePinTip": "You can display notes here by selecting \"Pin to profile\" from the menu of individual notes."
}
</locale>

<locale lang="json" locale="de-DE">
{
	"userSuspended": "Dieser Benutzer wurde gesperrt.",
	"userSilenced": "Dieser Benutzer wurde instanzweit stummgeschaltet.",
	"isSystemAccount": "Ein Benutzerkonto, das durch das System erstellt und automatisch verwaltet wird.",
	"addMemo": "Bemerkung hinzufügen",
	"followsYou": "Folgt dir",
	"messageToFollower": "Nachricht an die Follower",
	"moderationNote": "Moderationsnotiz",
	"moderationNoteDescription": "Trage hier Notizen ein. Diese sind nur für die Moderatoren sichtbar.",
	"addModerationNote": "Moderationsnotiz hinzufügen",
	"memo": "Merkzettel",
	"noAccountDescription": "Dieser Nutzer hat seine Profilbeschreibung noch nicht ausgefüllt",
	"location": "Ort",
	"birthday": "Geburtstag",
	"yearsOld": "{age} Jahre alt",
	"registeredDate": "Registrationsdatum",
	"verifiedLink": "Link-Besitz wurde verifiziert",
	"notes": "Notizen",
	"following": "Folgt",
	"followers": "Gefolgt von",
	"userPagePinTip": "Um Notizen hier erscheinen zu lassen, drücke \"An dein Profil anheften\" im Menü individueller Notizen."
}
</locale>

<locale lang="json" locale="en-US">
{
	"userSuspended": "This user has been suspended.",
	"userSilenced": "This user is being silenced.",
	"isSystemAccount": "An account created and automatically operated by the system.",
	"addMemo": "Add memo",
	"followsYou": "Follows you",
	"messageToFollower": "Message to followers",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"addModerationNote": "Add moderation note",
	"memo": "Memo",
	"noAccountDescription": "This user has not written their bio yet.",
	"location": "Location",
	"birthday": "Birthday",
	"yearsOld": "{age} years old",
	"registeredDate": "Joined on",
	"verifiedLink": "Link ownership has been verified",
	"notes": "Notes",
	"following": "Following",
	"followers": "Followers",
	"userPagePinTip": "You can display notes here by selecting \"Pin to profile\" from the menu of individual notes."
}
</locale>

<locale lang="json" locale="es-ES">
{
	"userSuspended": "Este usuario ha sido suspendido.",
	"userSilenced": "Este usuario ha sido silenciado.",
	"isSystemAccount": "Cuenta creada y operada automáticamente por el sistema",
	"addMemo": "Añadir nota",
	"followsYou": "Te sigue",
	"messageToFollower": "Mensaje a seguidores",
	"moderationNote": "Nota de moderación",
	"moderationNoteDescription": "Puedes rellenar notas que solo se comparten entre moderadores.",
	"addModerationNote": "Añadir nota de moderación",
	"memo": "Notas",
	"noAccountDescription": "Este usuario no ha escrito su biografía aún",
	"location": "Ubicación",
	"birthday": "Cumpleaños",
	"yearsOld": "{age} años",
	"registeredDate": "Fecha de registro",
	"verifiedLink": "Propiedad del enlace verificada",
	"notes": "Notas",
	"following": "Siguiendo",
	"followers": "Seguidores",
	"userPagePinTip": "Puede mantener sus notas visibles aquí seleccionando 'Fijar al perfil' en el menú de notas individuales"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"userSuspended": "Cet·te utilisateur·rice a été suspendu·e.",
	"userSilenced": "Cette utilisateur·trice a été mis·e en sourdine.",
	"isSystemAccount": "Ces comptes sont automatiquement créés et gérés par le système.",
	"addMemo": "Ajouter un mémo",
	"followsYou": "Vous suit",
	"messageToFollower": "Message aux abonné·es",
	"moderationNote": "Note de modération",
	"moderationNoteDescription": "Vous pouvez remplir des notes qui seront partagés seulement entre modérateurs.",
	"addModerationNote": "Ajouter une note de modération",
	"memo": "Pense-bête",
	"noAccountDescription": "L’utilisateur·rice n’a pas encore renseigné de biographie de présentation sur son profil.",
	"location": "Localisation",
	"birthday": "Date de naissance",
	"yearsOld": "{age} ans",
	"registeredDate": "Inscrit le",
	"verifiedLink": "Votre propriété de ce lien a été vérifiée",
	"notes": "Notes",
	"following": "Abonnements",
	"followers": "Abonné·e·s",
	"userPagePinTip": "Vous pouvez afficher des notes ici en sélectionnant l'option « Épingler au profil » dans le menu de chaque note."
}
</locale>

<locale lang="json" locale="id-ID">
{
	"userSuspended": "Pengguna ini telah ditangguhkan",
	"userSilenced": "Pengguna ini telah disenyapkan.",
	"isSystemAccount": "Akun yang dibuat dan otomatis dioperasikan oleh sistem.",
	"addMemo": "Tambahkan memo",
	"followsYou": "Mengikuti kamu",
	"messageToFollower": "Pesan kepada pengikut",
	"moderationNote": "Catatan moderasi",
	"moderationNoteDescription": "Anda dapat mengisi note yang hanya akan dibagikan diantara moderator.",
	"addModerationNote": "Tambahkan catatan moderasi",
	"memo": "Memo",
	"noAccountDescription": "Belum ada bio",
	"location": "Lokasi",
	"birthday": "Tanggal lahir",
	"yearsOld": "{age} tahun",
	"registeredDate": "Bergabung pada",
	"verifiedLink": "Tautan kepemilikan telah diverifikasi",
	"notes": "Catatan",
	"following": "Ikuti",
	"followers": "Pengikut",
	"userPagePinTip": "Kamu dapat membuat catatan untuk ditampilkan disini dengan memilih \"Sematkan ke profil\" dari menu pada catatan individu."
}
</locale>

<locale lang="json" locale="it-IT">
{
	"userSuspended": "L'utente è in sospensione",
	"userSilenced": "Profilo silenziato",
	"isSystemAccount": "Si tratta di un profilo creato e gestito automaticamente dal sistema.",
	"addMemo": "Aggiungi Memo",
	"followsYou": "Follower",
	"messageToFollower": "Messaggio ai follower",
	"moderationNote": "Promemoria di moderazione",
	"moderationNoteDescription": "Puoi scrivere promemoria condivisi solo tra moderatori.",
	"addModerationNote": "Aggiungi promemoria di moderazione",
	"memo": "Promemoria",
	"noAccountDescription": "La persona non ha ancora scritto alcuna autobiografia.",
	"location": "Posizione",
	"birthday": "Compleanno",
	"yearsOld": "{age} anni",
	"registeredDate": "Data iscrizione",
	"verifiedLink": "Abbiamo confermato la validità di questo collegamento",
	"notes": "Note",
	"following": "Following",
	"followers": "Follower",
	"userPagePinTip": "Qui puoi appuntare note, premendo \"Fissa sul profilo\" nel menù delle singole note."
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"userSuspended": "このユーザーは凍結されています。",
	"userSilenced": "このユーザーはサイレンスされています。",
	"isSystemAccount": "システムにより自動で作成・管理されているアカウントです。",
	"addMemo": "メモを追加",
	"followsYou": "フォローされています",
	"messageToFollower": "フォロワーへのメッセージ",
	"moderationNote": "モデレーションノート",
	"moderationNoteDescription": "モデレーター間でだけ共有されるメモを記入することができます。",
	"addModerationNote": "モデレーションノートを追加する",
	"memo": "メモ",
	"noAccountDescription": "自己紹介はありません",
	"location": "場所",
	"birthday": "誕生日",
	"yearsOld": "{age}歳",
	"registeredDate": "登録日",
	"verifiedLink": "このリンク先の所有者であることが確認されました",
	"notes": "ノート",
	"following": "フォロー",
	"followers": "フォロワー",
	"userPagePinTip": "個々のノートのメニューから「ピン留め」を選択することで、ここにノートを表示しておくことができます。"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"userSuspended": "このユーザーは...凍結されとる。",
	"userSilenced": "このユーザーは...サイレンスされとる。",
	"isSystemAccount": "システムが自動で作成・管理しとるアカウントやで。",
	"addMemo": "メモを足す",
	"followsYou": "フォローされとるで",
	"messageToFollower": "フォロワーへのメッセージ",
	"moderationNote": "モデレーションノート",
	"moderationNoteDescription": "モデレーターの中だけで共有するメモを入れれるで。",
	"addModerationNote": "モデレーションノートを追加するで",
	"memo": "メモ",
	"noAccountDescription": "自己紹介食ってもた",
	"location": "場所",
	"birthday": "生まれた日",
	"yearsOld": "{age}歳",
	"registeredDate": "始めた日",
	"verifiedLink": "このリンク先の所有者ってわかったわ。",
	"notes": "ノート",
	"following": "フォロー",
	"followers": "フォロワー",
	"userPagePinTip": "ノートのメニューから「ピン留め」を選んどいたら、ここにノートを置いとけるで。"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"userSuspended": "This user has been suspended.",
	"userSilenced": "This user is being silenced.",
	"isSystemAccount": "An account created and automatically operated by the system.",
	"addMemo": "Add memo",
	"followsYou": "Yeṭṭafaṛ-ik·em-id",
	"messageToFollower": "Message to followers",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"addModerationNote": "Add moderation note",
	"memo": "Memo",
	"noAccountDescription": "This user has not written their bio yet.",
	"location": "Location",
	"birthday": "Birthday",
	"yearsOld": "{age} years old",
	"registeredDate": "Joined on",
	"verifiedLink": "Link ownership has been verified",
	"notes": "Notes",
	"following": "Ig ṭṭafaṛ",
	"followers": "Imeḍfaṛen",
	"userPagePinTip": "You can display notes here by selecting \"Pin to profile\" from the menu of individual notes."
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"userSuspended": "This user has been suspended.",
	"userSilenced": "This user is being silenced.",
	"isSystemAccount": "An account created and automatically operated by the system.",
	"addMemo": "Add memo",
	"followsYou": "Follows you",
	"messageToFollower": "Message to followers",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"addModerationNote": "Add moderation note",
	"memo": "Memo",
	"noAccountDescription": "ಇವರು ಸ್ವಯಂ ಪರಿಚಯ ರಚಿಸಿಲ್ಲ",
	"location": "Location",
	"birthday": "Birthday",
	"yearsOld": "{age} years old",
	"registeredDate": "Joined on",
	"verifiedLink": "Link ownership has been verified",
	"notes": "Notes",
	"following": "Following",
	"followers": "Followers",
	"userPagePinTip": "You can display notes here by selecting \"Pin to profile\" from the menu of individual notes."
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"userSuspended": "이 유저는 정지되었습니다.",
	"userSilenced": "이 계정은 사일런스된 상태입니다.",
	"isSystemAccount": "시스템에 의해 자동으로 생성되어 관리되는 계정입니다.",
	"addMemo": "메모 추가",
	"followsYou": "나를 팔로우 합니다",
	"messageToFollower": "팔로워에게 보낼 메시지",
	"moderationNote": "조정 기록",
	"moderationNoteDescription": "모더레이터 역할을 가진 유저만 보이는 메모를 적을 수 있습니다.",
	"addModerationNote": "조정 기록 추가하기",
	"memo": "메모",
	"noAccountDescription": "자기소개가 없습니다",
	"location": "장소",
	"birthday": "생일",
	"yearsOld": "{age}세",
	"registeredDate": "등록일",
	"verifiedLink": "이 링크의 소유자임이 확인되었습니다.",
	"notes": "노트",
	"following": "팔로잉",
	"followers": "팔로워",
	"userPagePinTip": "각 노트의 메뉴에서 「프로필에 고정」을 선택하는 것으로, 여기에 노트를 표시해 둘 수 있어요."
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"userSuspended": "Deze gebruiker is geschorst.",
	"userSilenced": "Deze gebruiker is instantiebreed gedempt.",
	"isSystemAccount": "An account created and automatically operated by the system.",
	"addMemo": "Add memo",
	"followsYou": "Volgt jou",
	"messageToFollower": "Message to followers",
	"moderationNote": "Moderatienotitie",
	"moderationNoteDescription": "Voer hier notities in. Deze zijn alleen zichtbaar voor de moderators.",
	"addModerationNote": "Moderatienotitie toevoegen",
	"memo": "Memo",
	"noAccountDescription": "Deze gebruiker heeft nog geen bio geschreven",
	"location": "Locatie",
	"birthday": "Geboortedatum",
	"yearsOld": "{age} jaar",
	"registeredDate": "Inschrijvingsdatum",
	"verifiedLink": "Link ownership has been verified",
	"notes": "Notities",
	"following": "Volgend",
	"followers": "Volgers",
	"userPagePinTip": "Je kunt hier notities tonen door “Vastmaken aan profiel” te selecteren in het menu van de individuele notities."
}
</locale>

<locale lang="json" locale="no-NO">
{
	"userSuspended": "Denne brukeren har blitt suspendert.",
	"userSilenced": "This user is being silenced.",
	"isSystemAccount": "An account created and automatically operated by the system.",
	"addMemo": "Add memo",
	"followsYou": "Følger deg",
	"messageToFollower": "Message to followers",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"addModerationNote": "Add moderation note",
	"memo": "Notat",
	"noAccountDescription": "Denne brukeren har ikke skrevet sin biografi ennå.",
	"location": "Location",
	"birthday": "Bursdag",
	"yearsOld": "{age} år gammel",
	"registeredDate": "Joined on",
	"verifiedLink": "Link ownership has been verified",
	"notes": "Notes",
	"following": "Følger",
	"followers": "Følgere",
	"userPagePinTip": "You can display notes here by selecting \"Pin to profile\" from the menu of individual notes."
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"userSuspended": "To konto zostało zawieszone.",
	"userSilenced": "Ten użytkownik został wyciszony.",
	"isSystemAccount": "To jest konto stworzone i zarządzane przez system",
	"addMemo": "Add memo",
	"followsYou": "Obserwuje Cię",
	"messageToFollower": "Message to followers",
	"moderationNote": "Notka moderacyjna",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"addModerationNote": "Dodaj notkę moderacyjną",
	"memo": "Notatki",
	"noAccountDescription": "Ten użytkownik nie napisał jeszcze swojej biografii.",
	"location": "Lokalizacja",
	"birthday": "Data urodzenia",
	"yearsOld": "{age} lat",
	"registeredDate": "Zarejestrowano",
	"verifiedLink": "Link ownership has been verified",
	"notes": "Wpisy",
	"following": "Obserwowani",
	"followers": "Obserwujący",
	"userPagePinTip": "Możesz wyświetlać wpisy w tym miejscu po wybraniu \"Przypnij do profilu\" z menu pojedyńczego wpisu"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"userSuspended": "Este usuário foi suspenso.",
	"userSilenced": "Este usuário está silenciado.",
	"isSystemAccount": "É uma conta criada e gerenciada automaticamente pelo sistema.",
	"addMemo": "Adicionar memorando",
	"followsYou": "Te seguem",
	"messageToFollower": "Mensagem aos seguidores",
	"moderationNote": "Nota de moderação",
	"moderationNoteDescription": "Você pode preencher notas que serão compartilhadas apenas com moderadores.",
	"addModerationNote": "Adicionar nota de moderação",
	"memo": "Nota",
	"noAccountDescription": "Este usuário não tem uma descrição.",
	"location": "Localização",
	"birthday": "Aniversário",
	"yearsOld": "{age} anos",
	"registeredDate": "Data de registro",
	"verifiedLink": "A autoria do link foi verificada",
	"notes": "Posts",
	"following": "Seguindo",
	"followers": "Seguidores",
	"userPagePinTip": "Notas podem ser mostradas aqui ao clicar em \"Fixar no Perfil\" no menu de notas individuais."
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"userSuspended": "Эта учётная запись заморожена",
	"userSilenced": "Этот пользователь был заглушен",
	"isSystemAccount": "Данная учётная запись создана автоматически и управляется системой",
	"addMemo": "Добавить памятку",
	"followsYou": "Читает вас",
	"messageToFollower": "Сообщение подписчикам",
	"moderationNote": "Примечания модератора",
	"moderationNoteDescription": "Вы можете заполнять заметки, которые будут доступны только модераторам.",
	"addModerationNote": "Оставить заметку",
	"memo": "Памятка",
	"noAccountDescription": "Пользователь ничего не написал про себя",
	"location": "Местоположение",
	"birthday": "День рождения",
	"yearsOld": "Возраст: {age}",
	"registeredDate": "Дата регистрации",
	"verifiedLink": "Эта ссылка принадлежит пользователю",
	"notes": "Заметки",
	"following": "Подписки",
	"followers": "Подписчики",
	"userPagePinTip": "Можно добавить сюда заметки, выбрав нужную, и включив в её меню пункт «Закрепить в профиле»."
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"userSuspended": "Tento používateľ je zmrazený.",
	"userSilenced": "Tento používateľ je umlčaný.",
	"isSystemAccount": "Tieto účty automaticky vytvoril a spravuje systém.",
	"addMemo": "Add memo",
	"followsYou": "Sledujú vás",
	"messageToFollower": "Message to followers",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"addModerationNote": "Add moderation note",
	"memo": "Memo",
	"noAccountDescription": "Tento používateľ zatiaľ nenapísal o sebe.",
	"location": "Lokalita",
	"birthday": "Dátum narodenia",
	"yearsOld": "{age} rokov",
	"registeredDate": "Dátum registrácie",
	"verifiedLink": "Link ownership has been verified",
	"notes": "Poznámky",
	"following": "Sledujete",
	"followers": "Sledujúci",
	"userPagePinTip": "Tu môžete zobraziť poznámky zvolením \"Pripnúť na profil\" z menu jednotlivých poznámok."
}
</locale>

<locale lang="json" locale="th-TH">
{
	"userSuspended": "ผู้ใช้รายนี้ถูกระงับการใช้งาน",
	"userSilenced": "ผู้ใช้รายนี้ถูกปิดปากอยู่",
	"isSystemAccount": "บัญชีที่ถูกสร้างมานั้น และถูกดำเนินการโดยอัตโนมัติด้วยระบบ",
	"addMemo": "เพิ่มเมโม",
	"followsYou": "ติดตามคุณ",
	"messageToFollower": "ข้อความถึงผู้ติดตาม",
	"moderationNote": "โน้ตการกลั่นกรอง",
	"moderationNoteDescription": "สามารถจดเมโมที่จะแบ่งปันเฉพาะระหว่างผู้ควบคุมได้",
	"addModerationNote": "เพิ่มโน้ตการกลั่นกรอง",
	"memo": "เมโม",
	"noAccountDescription": "ผู้ใช้รายนี้ยังไม่ได้เขียนคำแนะนำตัว",
	"location": "ตำแหน่งที่ตั้ง",
	"birthday": "วันเกิด",
	"yearsOld": "{age} ปี",
	"registeredDate": "วันที่ลงทะเบียน",
	"verifiedLink": "ความเป็นเจ้าของลิงก์ได้รับการยืนยันแล้ว",
	"notes": " โน้ต",
	"following": "กำลังติดตาม",
	"followers": "ผู้ติดตาม",
	"userPagePinTip": "ปักหมุดโน้ตให้แสดงที่นี่ได้โดยเลือกเมนู “ปักหมุด” ของโน้ตนั้นๆ"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"userSuspended": "Bu kullanıcı askıya alınmıştır.",
	"userSilenced": "Bu kullanıcı susturuluyor.",
	"isSystemAccount": "Sistem tarafından oluşturulan ve otomatik olarak işletilen bir hesap.",
	"addMemo": "Kısa not ekle",
	"followsYou": "Sizi takip ediyor",
	"messageToFollower": "Takipçilere mesaj",
	"moderationNote": "Moderasyon notu",
	"moderationNoteDescription": "Moderatörler arasında paylaşılacak notları girebilirsin.",
	"addModerationNote": "Moderasyon notu ekle",
	"memo": "Hatırlatıcı",
	"noAccountDescription": "Bu kullanıcı henüz biyografisini yazmamış.",
	"location": "Konum",
	"birthday": "Doğum günü",
	"yearsOld": "{age} yaşında",
	"registeredDate": "Katılma tarihi",
	"verifiedLink": "Bağlantı sahipliği doğrulanmıştır.",
	"notes": "Notlar",
	"following": "Takip",
	"followers": "Takipçi",
	"userPagePinTip": "Bireysel notların menüsünden “Profiline sabitle” seçeneğini seçerek notları burada görüntüleyebilirsin."
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"userSuspended": "This user has been suspended.",
	"userSilenced": "This user is being silenced.",
	"isSystemAccount": "An account created and automatically operated by the system.",
	"addMemo": "Add memo",
	"followsYou": "Follows you",
	"messageToFollower": "Message to followers",
	"moderationNote": "Moderation note",
	"moderationNoteDescription": "You can fill in notes that will be shared only among moderators.",
	"addModerationNote": "Add moderation note",
	"memo": "Memo",
	"noAccountDescription": "This user has not written their bio yet.",
	"location": "Location",
	"birthday": "Birthday",
	"yearsOld": "{age} years old",
	"registeredDate": "Joined on",
	"verifiedLink": "Link ownership has been verified",
	"notes": "Notes",
	"following": "Following",
	"followers": "Followers",
	"userPagePinTip": "You can display notes here by selecting \"Pin to profile\" from the menu of individual notes."
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"userSuspended": "Обліковий запис заблокований.",
	"userSilenced": "Обліковий запис приглушений.",
	"isSystemAccount": "Акаунт, створений і автоматично керований системою.",
	"addMemo": "Додати пам'ятку",
	"followsYou": "Підписаний(-а) на вас",
	"messageToFollower": "Повідомлення підписникам",
	"moderationNote": "Модераторська нотатка",
	"moderationNoteDescription": "Ви можете додати нотатки, які будуть доступні лише модераторам.\n",
	"addModerationNote": "Додати модераторську нотатку",
	"memo": "Примітка",
	"noAccountDescription": "Цей користувач ще нічого не написав про себе",
	"location": "Локація",
	"birthday": "День народження",
	"yearsOld": "{age} років",
	"registeredDate": "Приєднання",
	"verifiedLink": "Право власності на посилання підтверджено",
	"notes": "Записи",
	"following": "Підписки",
	"followers": "Підписники",
	"userPagePinTip": "Ви можете зберегти відображені тут нотатки, вибравши \"Закріпити\" в меню окремих нотаток."
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"userSuspended": "Người này đã bị vô hiệu hóa.",
	"userSilenced": "Người này đã bị ẩn",
	"isSystemAccount": "Đã tạo một tài khoản và tự động vận hành bởi hệ thống.",
	"addMemo": "Add memo",
	"followsYou": "Theo dõi bạn",
	"messageToFollower": "Tin nhắn cho người theo dõi",
	"moderationNote": "Ghi chú kiểm duyệt",
	"moderationNoteDescription": "Bạn có thể điền vào những ghi chú chỉ được chia sẻ giữa những người kiểm duyệt.",
	"addModerationNote": "Thêm ghi chú kiểm duyệt",
	"memo": "Lưu ý",
	"noAccountDescription": "Người này chưa viết mô tả.",
	"location": "Đến từ",
	"birthday": "Sinh nhật",
	"yearsOld": "{age} tuổi",
	"registeredDate": "Tham gia",
	"verifiedLink": "Chúng tôi đã xác nhận bạn là chủ sở hữu của đường dẫn này",
	"notes": "Bài Viết",
	"following": "Đang theo dõi",
	"followers": "Người theo dõi",
	"userPagePinTip": "Bạn có thể hiển thị các tút ở đây bằng cách chọn \"Ghim vào hồ sơ\" từ menu của mỗi tút."
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"userSuspended": "该用户已被冻结。",
	"userSilenced": "该用户已被禁言。",
	"isSystemAccount": "该账号由系统自动创建和管理。",
	"addMemo": "添加备注",
	"followsYou": "正在关注你",
	"messageToFollower": "给关注者的消息",
	"moderationNote": "管理笔记",
	"moderationNoteDescription": "可以用来记录仅在管理员之间共享的笔记。",
	"addModerationNote": "添加管理笔记",
	"memo": "备注",
	"noAccountDescription": "此用户尚无自我介绍",
	"location": "位置",
	"birthday": "生日",
	"yearsOld": "{age}岁",
	"registeredDate": "注册于",
	"verifiedLink": "已验证的链接",
	"notes": "帖子",
	"following": "关注中",
	"followers": "关注者",
	"userPagePinTip": "在帖子的菜单中选择“置顶”，即可显示该条帖子。"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"userSuspended": "該使用者已被停用。",
	"userSilenced": "該使用者已被禁言。",
	"isSystemAccount": "由系統自動建立與管理的帳戶。",
	"addMemo": "新增備註",
	"followsYou": "追隨你的人",
	"messageToFollower": "給追隨者的訊息",
	"moderationNote": "管理筆記",
	"moderationNoteDescription": "您可以編寫僅在審查員之間共用的註解。",
	"addModerationNote": "新增管理筆記",
	"memo": "備忘錄",
	"noAccountDescription": "此使用者尚未自我介紹",
	"location": "位置",
	"birthday": "生日",
	"yearsOld": "{age} 歲",
	"registeredDate": "註冊日期",
	"verifiedLink": "已驗證連結",
	"notes": "貼文",
	"following": "追隨中",
	"followers": "追隨者",
	"userPagePinTip": "在貼文的選單中選擇「置頂」，即可置頂該貼文至您的個人檔案頁面。"
}
</locale>
