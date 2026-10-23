<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div style="overflow: clip;">
		<div class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 20px;">
			<div class="_gaps_m znqjceqz">
				<div v-panel class="about">
					<div ref="containerEl" class="container" :class="{ playing: easterEggEngine != null }">
						<img src="/client-assets/about-icon.png" alt="" class="icon" draggable="false" @load="iconLoaded" @click="gravity"/>
						<div class="misskey">{{ productName }}</div>
						<div class="version">v{{ version }}</div>
						<span v-for="emoji in easterEggEmojis" :key="emoji.id" class="emoji" :data-physics-x="emoji.left" :data-physics-y="emoji.top" :class="{ _physics_circle_: !emoji.emoji.startsWith(':') }">
							<MkCustomEmoji v-if="emoji.emoji[0] === ':'" class="emoji" :name="emoji.emoji" :normal="true" :noStyle="true" :fallbackToImage="true"/>
							<MkEmoji v-else class="emoji unicode" :emoji="emoji.emoji" :normal="true" :noStyle="true"/>
						</span>
					</div>
					<button v-if="thereIsTreasure" class="_button treasure" @click="getTreasure"><img src="/fluent-emoji/1f3c6.png" class="treasureImg"></button>
				</div>
				<div style="text-align: center;">
					{{ $locale.sfc.aboutMisskeyAbout }}<br><a href="https://misskey-hub.net/docs/about-misskey/" target="_blank" class="_link">{{ $locale.sfc.learnMore }}</a>
				</div>
				<div v-if="$i != null" style="text-align: center;">
					<MkButton primary rounded inline @click="iLoveMisskey">I <Mfm text="$[jelly ❤]"/> #Misskey</MkButton>
				</div>
				<FormSection>
					<div class="_gaps_s">
						<FormLink to="https://github.com/misskey-dev/misskey" external>
							<template #icon><i class="ti ti-code"></i></template>
							{{ $locale.sfc.aboutMisskeySource }} ({{ $locale.sfc.aboutMisskeyOriginal }})
							<template #suffix>GitHub</template>
						</FormLink>
						<FormLink to="https://crowdin.com/project/misskey" external>
							<template #icon><i class="ti ti-language-hiragana"></i></template>
							{{ $locale.sfc.aboutMisskeyTranslation }}
							<template #suffix>Crowdin</template>
						</FormLink>
						<FormLink to="https://www.patreon.com/syuilo" external>
							<template #icon><i class="ti ti-pig-money"></i></template>
							{{ $locale.sfc.aboutMisskeyDonate }}
							<template #suffix>Patreon</template>
						</FormLink>
					</div>
				</FormSection>
				<FormSection v-if="instance.repositoryUrl !== 'https://github.com/misskey-dev/misskey'">
					<div class="_gaps_s">
						<MkInfo>
							{{ interpolateLocaleParameters($locale.sfc.aboutMisskeyThisIsModifiedVersion, { name: instance.name ?? host }) }}
						</MkInfo>
						<FormLink v-if="instance.repositoryUrl" :to="instance.repositoryUrl" external>
							<template #icon><i class="ti ti-code"></i></template>
							{{ $locale.sfc.aboutMisskeySource }}
						</FormLink>
						<FormLink v-if="instance.providesTarball" :to="`/tarball/misskey-${version}.tar.gz`" external>
							<template #icon><i class="ti ti-download"></i></template>
							{{ $locale.sfc.aboutMisskeySource }}
							<template #suffix>Tarball</template>
						</FormLink>
						<MkInfo v-if="!instance.repositoryUrl && !instance.providesTarball" warn>
							{{ $locale.sfc.sourceCodeIsNotYetProvided }}
						</MkInfo>
					</div>
				</FormSection>
				<FormSection>
					<template #label>{{ $locale.sfc.aboutMisskeyProjectMembers }}</template>
					<div :class="$style.contributors">
						<a href="https://github.com/syuilo" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/4439005?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@syuilo</span>
						</a>
						<a href="https://github.com/acid-chicken" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/20679825?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@acid-chicken</span>
						</a>
						<a href="https://github.com/kakkokari-gtyih" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/67428053?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@kakkokari-gtyih</span>
						</a>
						<a href="https://github.com/tai-cha" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/40626578?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@tai-cha</span>
						</a>
						<a href="https://github.com/samunohito" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/46447427?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@samunohito</span>
						</a>
						<a href="https://github.com/anatawa12" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/22656849?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@anatawa12</span>
						</a>
					</div>
				</FormSection>
				<FormSection>
					<template #label>Special thanks</template>
					<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));grid-gap:24px;align-items:center;">
						<div>
							<a style="display: inline-block;" class="masknetwork" title="Mask Network" href="https://mask.io/" target="_blank"><img style="width: 100%;" src="https://assets.misskey-hub.net/sponsors/masknetwork.png" alt="Mask Network"></a>
						</div>
						<div>
							<a style="display: inline-block;" class="xserver" title="XServer" href="https://www.xserver.ne.jp/" target="_blank"><img style="width: 100%;" src="https://assets.misskey-hub.net/sponsors/xserver.png" alt="XServer"></a>
						</div>
						<div>
							<a style="display: inline-block;" class="skeb" title="Skeb" href="https://skeb.jp/" target="_blank"><img style="width: 100%;" src="https://assets.misskey-hub.net/sponsors/skeb.svg" alt="Skeb"></a>
						</div>
						<div>
							<a style="display: inline-block;" class="pepabo" title="GMO Pepabo" href="https://pepabo.com/" target="_blank"><img style="width: 100%;" src="https://assets.misskey-hub.net/sponsors/gmo_pepabo.svg" alt="GMO Pepabo"></a>
						</div>
						<div>
							<a style="display: inline-block;" class="purpledotdigital" title="Purple Dot Digital" href="https://purpledotdigital.com/" target="_blank"><img style="width: 100%;" src="https://assets.misskey-hub.net/sponsors/purple-dot-digital.jpg" alt="Purple Dot Digital"></a>
						</div>
						<div>
							<a style="display: inline-block;" class="sads-llc" title="合同会社サッズ" href="https://sads-llc.co.jp/" target="_blank"><img style="width: 100%;" src="https://assets.misskey-hub.net/sponsors/sads-llc.png" alt="合同会社サッズ"></a>
						</div>
					</div>
				</FormSection>
				<FormSection>
					<template #label><Mfm text="$[jelly ❤]"/> {{ $locale.sfc.aboutMisskeyPatrons }}</template>
					<div :class="$style.patronsWithIcon">
						<div v-for="patron in patronsWithIcon" :class="$style.patronWithIcon">
							<img :src="patron.icon" :class="$style.patronIcon">
							<span :class="$style.patronName">{{ patron.name }}</span>
						</div>
					</div>
					<div style="margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); grid-gap: 12px;">
						<div v-for="patron in patrons" :key="patron">{{ patron }}</div>
					</div>
					<p>{{ $locale.sfc.aboutMisskeyMorePatrons }}</p>
				</FormSection>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, ref, useTemplateRef, computed } from 'vue';
import { host, version, productName } from '@features/boot/frontend/shared/config.js';
import { DEFAULT_EMOJIS } from '@features/emojis/frontend/shared/default-emojis.js';
import FormLink from '@features/ui/frontend/components/form/link.vue';
import FormSection from '@features/ui/frontend/components/form/section.vue';
import MkButton from '@features/ui/frontend/components/MkButton.vue';
import MkInfo from '@features/ui/frontend/components/MkInfo.vue';
import { physics } from '@features/drive/frontend/utility/physics.js';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';
import { instance } from '@features/instance/frontend/instance.js';
import * as os from '@features/ui/frontend/os.js';
import { definePage } from '@features/navigation/frontend/page.js';
import { claimAchievement, claimedAchievements } from '@features/users/frontend/utility/achievements.js';
import { $i } from '@features/auth/frontend/i.js';
import { prefer } from '@features/preferences/frontend/preferences.js';

const patronsWithIcon = [{
	name: 'カイヤン',
	icon: 'https://assets.misskey-hub.net/patrons/a2820716883e408cb87773e377ce7c8d.jpg',
}, {
	name: 'だれかさん',
	icon: 'https://assets.misskey-hub.net/patrons/f7409b5e5a88477a9b9d740c408de125.jpg',
}, {
	name: 'narazaka',
	icon: 'https://assets.misskey-hub.net/patrons/e3affff31ffb4877b1196c7360abc3e5.jpg',
}, {
	name: 'ひとぅ',
	icon: 'https://assets.misskey-hub.net/patrons/8cc0d0a0a6d84c88bca1aedabf6ed5ab.jpg',
}, {
	name: 'ぱーこ',
	icon: 'https://assets.misskey-hub.net/patrons/79c6602ffade489e8df2fcf2c2bc5d9d.jpg',
}, {
	name: 'わっほー☆',
	icon: 'https://assets.misskey-hub.net/patrons/d31d5d13924443a082f3da7966318a0a.jpg',
}, {
	name: 'mollinaca',
	icon: 'https://assets.misskey-hub.net/patrons/ceb36b8f66e549bdadb3b90d5da62314.jpg',
}, {
	name: '坂本龍',
	icon: 'https://assets.misskey-hub.net/patrons/a631cf8b490145cf8dbbe4e7508cfbc2.jpg',
}, {
	name: 'takke',
	icon: 'https://assets.misskey-hub.net/patrons/6c3327e626c046f2914fbcd9f7557935.jpg',
}, {
	name: 'ぺんぎん',
	icon: 'https://assets.misskey-hub.net/patrons/6a652e0534ff4cb1836e7ce4968d76a7.jpg',
}, {
	name: 'かみらえっと',
	icon: 'https://assets.misskey-hub.net/patrons/be1326bda7d940a482f3758ffd9ffaf6.jpg',
}, {
	name: 'へてて',
	icon: 'https://assets.misskey-hub.net/patrons/0431eacd7c6843d09de8ea9984307e86.jpg',
}, {
	name: 'spinlock',
	icon: 'https://assets.misskey-hub.net/patrons/6a1cebc819d540a78bf20e9e3115baa8.jpg',
}, {
	name: 'じゅくま',
	icon: 'https://assets.misskey-hub.net/patrons/3e56bdac69dd42f7a06e0f12cf2fc895.jpg',
}, {
	name: '清遊あみ',
	icon: 'https://assets.misskey-hub.net/patrons/de25195b88e940a388388bea2e7637d8.jpg',
}, {
	name: 'Nagi8410',
	icon: 'https://assets.misskey-hub.net/patrons/31b102ab4fc540ed806b0461575d38be.jpg',
}, {
	name: '山岡士郎',
	icon: 'https://assets.misskey-hub.net/patrons/84b9056341684266bb1eda3e680d094d.jpg',
}, {
	name: 'よもやまたろう',
	icon: 'https://assets.misskey-hub.net/patrons/4273c9cce50d445f8f7d0f16113d6d7f.jpg',
}, {
	name: '花咲ももか',
	icon: 'https://assets.misskey-hub.net/patrons/8c9b2b9128cb4fee99f04bb4f86f2efa.jpg',
}, {
	name: 'カガミ',
	icon: 'https://assets.misskey-hub.net/patrons/226ea3a4617749548580ec2d9a263e24.jpg',
}, {
	name: 'フランギ・シュウ',
	icon: 'https://assets.misskey-hub.net/patrons/3016d37e35f3430b90420176c912d304.jpg',
}, {
	name: '百日紅',
	icon: 'https://assets.misskey-hub.net/patrons/302dce2898dd457ba03c3f7dc037900b.jpg',
}, {
	name: 'taichan',
	icon: 'https://assets.misskey-hub.net/patrons/f981ab0159fb4e2c998e05f7263e1cd9.jpg',
}, {
	name: '猫吉よりお',
	icon: 'https://assets.misskey-hub.net/patrons/a11518b3b34b4536a4bdd7178ba76a7b.jpg',
}, {
	name: '有栖かずみ',
	icon: 'https://assets.misskey-hub.net/patrons/9240e8e0ba294a8884143e99ac7ed6a0.jpg',
}, {
	name: 'イカロ(コアラ)',
	icon: 'https://assets.misskey-hub.net/patrons/50b9bdc03735412c80807dbdf32cecb6.jpg',
}, {
	name: 'ハチノス３号',
	icon: 'https://assets.misskey-hub.net/patrons/030347a6f8ce4e82bc5184b5aad09a18.jpg',
}, {
	name: 'Takeno',
	icon: 'https://assets.misskey-hub.net/patrons/6fba81536aea48fe94a30909c502dfa1.jpg',
}, {
	name: 'くびすじ',
	icon: 'https://assets.misskey-hub.net/patrons/aa5789850b2149aeb5b89ebe2e9083db.jpg',
}, {
	name: '古道京紗＠ぷらいべったー',
	icon: 'https://assets.misskey-hub.net/patrons/18346d0519704963a4beabe6abc170af.jpg',
}, {
	name: '越貝鯛丸',
	icon: 'https://assets.misskey-hub.net/patrons/86c7374de37849b882d8ebbc833dc968.jpg',
}, {
	name: '☔あめ🍬(灬˘╰╯˘灬)',
	icon: 'https://assets.misskey-hub.net/patrons/676eea72d4884d3f89aababbb62533fb.jpg',
}, {
	name: '貯水よび',
	icon: 'https://assets.misskey-hub.net/patrons/2974506d53244bbe94a67707b27099e2.jpg',
}, {
	name: 'はるかさ',
	icon: 'https://assets.misskey-hub.net/patrons/26ce2432739a400aa3aa0de0ef67a107.jpg',
}, {
	name: '天鈴のあ',
	icon: 'https://assets.misskey-hub.net/patrons/995cdbb00bd6421184461a883adfe1d9.jpg',
}, {
	name: 'えとゔぁす',
	icon: 'https://assets.misskey-hub.net/patrons/2578f441b82a44cfaa55ba83a318b26e.jpg',
}, {
	name: 'Soli',
	icon: 'https://assets.misskey-hub.net/patrons/448070c81ebd41eda4ea2328291b2efe.jpg',
}, {
	name: 'ささくれりょう',
	icon: 'https://assets.misskey-hub.net/patrons/cf55022cee6c41da8e70a43587aaad9a.jpg',
}, {
	name: 'Macop',
	icon: 'https://assets.misskey-hub.net/patrons/ee052bf550014d36a643ce3dce595640.jpg',
}, {
	name: 'なっかあ',
	icon: 'https://assets.misskey-hub.net/patrons/c2f5f3e394e74a64912284a2f4ca710e.jpg',
}, {
	name: '如月ユカ',
	icon: 'https://assets.misskey-hub.net/patrons/f24a042076a041b6811a2f124eb620ca.jpg',
}, {
	name: 'Yatoigawa',
	icon: 'https://assets.misskey-hub.net/patrons/505e3568885a4a488431a8f22b4553d0.jpg',
}, {
	name: '秋瀬カヲル',
	icon: 'https://assets.misskey-hub.net/patrons/0f22aeb866484f4fa51db6721e3f9847.jpg',
}, {
	name: '新井　治',
	icon: 'https://assets.misskey-hub.net/patrons/d160876f20394674a17963a0e609600a.jpg',
}, {
	name: 'しきいし',
	icon: 'https://assets.misskey-hub.net/patrons/77dd5387db41427ba9cbdc8849e76402.jpg',
}, {
	name: '井上千二十四',
	icon: 'https://assets.misskey-hub.net/patrons/193afa1f039b4c339866039c3dcd74bf.jpg',
}, {
	name: 'NigN',
	icon: 'https://assets.misskey-hub.net/patrons/1ccaef8e73ec4a50b59ff7cd688ceb84.jpg',
}, {
	name: 'しゃどかの',
	icon: 'https://assets.misskey-hub.net/patrons/5bec3c6b402942619e03f7a2ae76d69e.jpg',
}, {
	name: '大賀愛一郎',
	icon: 'https://assets.misskey-hub.net/patrons/c701a797d1df4125970f25d3052250ac.jpg',
}, {
	name: '西野マチ',
	icon: 'https://assets.misskey-hub.net/patrons/962ff1d2f3d040ed8973b62bbff84391.jpg',
}];

const patrons = [
	'まっちゃとーにゅ',
	'mametsuko',
	'noellabo',
	'AureoleArk',
	'Gargron',
	'Nokotaro Takeda',
	'Suji Yan',
	'oi_yekssim',
	'regtan',
	'Hekovic',
	'nenohi',
	'Gitmo Life Services',
	'naga_rus',
	'Efertone',
	'Melilot',
	'motcha',
	'nanami kan',
	'sevvie Rose',
	'Hayato Ishikawa',
	'Puniko',
	'skehmatics',
	'Quinton Macejkovic',
	'YUKIMOCHI',
	'dansup',
	'mewl hayabusa',
	'Emilis',
	'Fristi',
	'makokunsan',
	'chidori ninokura',
	'Peter G.',
	'見当かなみ',
	'natalie',
	'Maronu',
	'Steffen K9',
	'takimura',
	'sikyosyounin',
	'Nesakko',
	'YuzuRyo61',
	'blackskye',
	'sheeta.s',
	'osapon',
	'public_yusuke',
	'CG',
	'吴浥',
	't_w',
	'Jerry',
	'nafuchoco',
	'Takumi Sugita',
	'GLaTAN',
	'mkatze',
	'kabo2468y',
	'mydarkstar',
	'Roujo',
	'DignifiedSilence',
	'uroco @99',
	'totokoro',
	'うし',
	'kiritan',
	'weepjp',
	'Liaizon Wakest',
	'Duponin',
	'Blue',
	'Naoki Hirayama',
	'wara',
	'Wataru Manji (manji0)',
	'みなしま',
	'kanoy',
	'xianon',
	'Denshi',
	'Osushimaru',
	'にょんへら',
	'おのだい',
	'Leni',
	'oss',
	'Weeble',
	'蝉暮せせせ',
	'ThatOneCalculator',
	'pixeldesu',
	'あめ玉',
	'氷月氷華里',
	'Ebise Lutica',
	'巣黒るい@リスケモ男の娘VTuber!',
	'ふぇいぽむ',
	'依古田イコ',
	'戸塚こだま',
	'すー。',
	'秋雨/Slime-hatena.jp',
	'けそ',
	'ずも',
	'binvinyl',
	'渡志郎',
	'ぷーざ',
	'越貝鯛丸',
	'Nick / pprmint.',
	'kino3277',
	'美少女JKぐーちゃん',
	'てば',
	'たっくん',
	'SHO SEKIGUCHI',
	'塩キャベツ',
	'はとぽぷさん',
	'100の人 (エスパー・イーシア)',
	'ケモナーのケシン',
	'こまつぶり',
	'まゆつな空高',
	'asata',
	'ruru',
	'みりめい',
	'東雲 琥珀',
	'ほとラズ',
	'スズカケン',
	'蒼井よみこ',
	'忍猫',
];

const thereIsTreasure = ref($i && !claimedAchievements.includes('foundTreasure'));

let easterEggReady = false;
const easterEggEmojis = ref<{
	id: string,
	top: number,
	left: number,
	emoji: string
}[]>([]);
const easterEggEngine = ref<{ stop: () => void } | null>(null);
const containerEl = useTemplateRef('containerEl');

function iconLoaded() {
	if (containerEl.value == null) return;
	const emojis = prefer.s.emojiPalettes[0]?.emojis ?? [];

	if (emojis.length < DEFAULT_EMOJIS.length) {
		emojis.push(...DEFAULT_EMOJIS.slice(0, DEFAULT_EMOJIS.length - emojis.length));
	}

	const containerWidth = containerEl.value.offsetWidth;
	for (let i = 0; i < 32; i++) {
		easterEggEmojis.value.push({
			id: i.toString(),
			top: -(128 + (Math.random() * 256)),
			left: (Math.random() * containerWidth),
			emoji: emojis[Math.floor(Math.random() * emojis.length)],
		});
	}

	nextTick(() => {
		easterEggReady = true;
	});
}

function gravity() {
	if (containerEl.value == null) return;
	if (!easterEggReady) return;
	easterEggReady = false;
	easterEggEngine.value = physics(containerEl.value);
}

function iLoveMisskey() {
	os.post({
		initialText: 'I $[jelly ❤] #Misskey',
		instant: true,
	});
}

function getTreasure() {
	thereIsTreasure.value = false;
	claimAchievement('foundTreasure');
}

onBeforeUnmount(() => {
	if (easterEggEngine.value) {
		easterEggEngine.value.stop();
	}
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: interpolateLocaleParameters($locale.value.sfc.aboutMisskey, { productName }),
	icon: null,
}));
</script>

<style lang="scss" scoped>
.znqjceqz {
	> .about {
		position: relative;
		border-radius: var(--MI-radius);

		> .treasure {
			position: absolute;
			top: 60px;
			left: 0;
			right: 0;
			margin: 0 auto;
			width: min-content;

			> .treasureImg {
				width: 25px;
				vertical-align: bottom;
			}
		}

		> .container {
			position: relative;
			text-align: center;
			padding: 16px;

			&.playing {
				&, * {
					user-select: none;
				}

				* {
					will-change: transform;
				}

				> .emoji {
					visibility: visible;
				}
			}

			> .icon {
				display: block;
				width: 80px;
				margin: 0 auto;
				border-radius: 16px;
				position: relative;
				z-index: 1;
			}

			> .misskey {
				margin: 0.75em auto 0 auto;
				width: max-content;
				position: relative;
				z-index: 1;
			}

			> .version {
				margin: 0 auto;
				width: max-content;
				opacity: 0.5;
				position: relative;
				z-index: 1;
			}

			> .emoji {
				position: absolute;
				z-index: 1;
				top: 0;
				left: 0;
				visibility: hidden;

				> .emoji {
					pointer-events: none;
					font-size: 24px;
					width: 24px;

					&.unicode {
						height: 24px;
					}
				}
			}
		}
	}
}
</style>

<style lang="scss" module>
.contributors {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	grid-gap: 12px;
}

.contributor {
	display: flex;
	align-items: center;
	padding: 12px;
	background: var(--MI_THEME-buttonBg);
	border-radius: 6px;

	&:hover {
		text-decoration: none;
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.active {
		color: var(--MI_THEME-accent);
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.contributorAvatar {
	width: 30px;
	border-radius: 100%;
}

.contributorUsername {
	margin-left: 12px;
}

.patronsWithIcon {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	grid-gap: 12px;
}

.patronWithIcon {
	display: flex;
	align-items: center;
	padding: 12px;
	background: var(--MI_THEME-buttonBg);
	border-radius: 6px;
}

.patronIcon {
	width: 24px;
	border-radius: 100%;
}

.patronName {
	margin-left: 12px;
}
</style>

<locale lang="json" locale="ar-SA">
{
	"aboutMisskeyAbout": "ميسكي هو برمجية مفتوحة المصدر يطورها syuilo منذ 2014.",
	"learnMore": "راجع المزيد",
	"aboutMisskeySource": "الشفرة المصدرية",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "ترجم ميسكي",
	"aboutMisskeyDonate": "تبرع لميسكي",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"aboutMisskeyProjectMembers": "Project members",
	"aboutMisskeyPatrons": "الداعمون",
	"aboutMisskeyMorePatrons": "نحن نقدر الدعم الذي قدمه العديد من الأشخاص الذين لم نذكرهم. شكرًا لكم 🥰",
	"aboutMisskey": "عن {productName}"
}
</locale>

<locale lang="json" locale="ca-ES">
{
	"aboutMisskeyAbout": "Misskey és un programa de codi obert desenvolupat des del 2014 per syuilo",
	"learnMore": "Saber-ne més ",
	"aboutMisskeySource": "Codi font",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Tradueix Misskey",
	"aboutMisskeyDonate": "Fes un donatiu a Misskey",
	"aboutMisskeyThisIsModifiedVersion": "En {name} fa servir una versió modificada de Misskey.",
	"sourceCodeIsNotYetProvided": "El codi font encara no es troba disponible. Contacta amb l'administrador per solucionar aquest problema.",
	"aboutMisskeyProjectMembers": "Membres del projecte",
	"aboutMisskeyPatrons": "Patrocinadors",
	"aboutMisskeyMorePatrons": "També agraïm el suport d'altres col·laboradors que no surten en aquesta llista. Gràcies! 🥰",
	"aboutMisskey": "Quant a {productName}"
}
</locale>

<locale lang="json" locale="cs-CZ">
{
	"aboutMisskeyAbout": "Misskey je open-source software vyvíjený syuilo od roku 2014.",
	"learnMore": "Zjistit více",
	"aboutMisskeySource": "Zdrojový kód",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Přeložit Misskey",
	"aboutMisskeyDonate": "Přispějte na Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"aboutMisskeyProjectMembers": "Project members",
	"aboutMisskeyPatrons": "Patroni",
	"aboutMisskeyMorePatrons": "Vážíme si také podpory mnoha dalších pomocníků, kteří zde nejsou uvedeni. Děkujeme! 🥰",
	"aboutMisskey": "O {productName}"
}
</locale>

<locale lang="json" locale="da-DK">
{
	"aboutMisskeyAbout": "Misskey is open-source software being developed by syuilo since 2014.",
	"learnMore": "Learn more",
	"aboutMisskeySource": "Source code",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Translate Misskey",
	"aboutMisskeyDonate": "Donate to Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"aboutMisskeyProjectMembers": "Project members",
	"aboutMisskeyPatrons": "Patrons",
	"aboutMisskeyMorePatrons": "We also appreciate the support of many other helpers not listed here. Thank you! 🥰",
	"aboutMisskey": "About {productName}"
}
</locale>

<locale lang="json" locale="de-DE">
{
	"aboutMisskeyAbout": "Misskey ist Open-Source-Software, welche von syuilo seit 2014 entwickelt wird.",
	"learnMore": "Mehr erfahren",
	"aboutMisskeySource": "Quellcode",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Misskey übersetzen",
	"aboutMisskeyDonate": "An Misskey spenden",
	"aboutMisskeyThisIsModifiedVersion": "{name} verwendet eine modifizierte Version des ursprünglichen Misskey.",
	"sourceCodeIsNotYetProvided": "Der Quellcode ist noch nicht verfügbar. Kontaktiere den Administrator, um das Problem zu lösen.",
	"aboutMisskeyProjectMembers": "Projektmitglieder",
	"aboutMisskeyPatrons": "UnterstützerInnen",
	"aboutMisskeyMorePatrons": "Wir schätzen ebenso die Unterstützung vieler anderer hier nicht gelisteter Personen sehr. Danke! 🥰",
	"aboutMisskey": "Über {productName}"
}
</locale>

<locale lang="json" locale="en-US">
{
	"aboutMisskeyAbout": "Misskey is open-source software being developed by syuilo since 2014.",
	"learnMore": "Learn more",
	"aboutMisskeySource": "Source code",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Translate Misskey",
	"aboutMisskeyDonate": "Donate to Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"aboutMisskeyProjectMembers": "Project members",
	"aboutMisskeyPatrons": "Patrons",
	"aboutMisskeyMorePatrons": "We also appreciate the support of many other helpers not listed here. Thank you! 🥰",
	"aboutMisskey": "About {productName}"
}
</locale>

<locale lang="json" locale="es-ES">
{
	"aboutMisskeyAbout": "Misskey es un software de código abierto, desarrollado por syuilo desde 2014",
	"learnMore": "Ver más",
	"aboutMisskeySource": "Código fuente",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Traducir Misskey",
	"aboutMisskeyDonate": "Donar a Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} usa una versión modificada de Misskey.",
	"sourceCodeIsNotYetProvided": "El código fuente aún no está disponible. Contacta con el administrador para solucionarlo.",
	"aboutMisskeyProjectMembers": "Miembros del proyecto",
	"aboutMisskeyPatrons": "Patrocinadores",
	"aboutMisskeyMorePatrons": "Muchas más personas nos apoyan. Muchas gracias🥰",
	"aboutMisskey": "Sobre {productName}"
}
</locale>

<locale lang="json" locale="fr-FR">
{
	"aboutMisskeyAbout": "Misskey est un logiciel libre et ouvert, développé par syuilo depuis 2014.",
	"learnMore": "Plus d'informations",
	"aboutMisskeySource": "Code source",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Traduire Misskey",
	"aboutMisskeyDonate": "Soutenir Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"sourceCodeIsNotYetProvided": "Le code source n'est pas encore disponible. Veuillez signaler ce problème aux administrateurs.",
	"aboutMisskeyProjectMembers": "Membres du projet",
	"aboutMisskeyPatrons": "Contributeurs",
	"aboutMisskeyMorePatrons": "Nous apprécions vraiment le soutien de nombreuses autres personnes non mentionnées ici. Merci à toutes et à tous ! 🥰",
	"aboutMisskey": "À propos de {productName}"
}
</locale>

<locale lang="json" locale="id-ID">
{
	"aboutMisskeyAbout": "Misskey adalah perangkat lunak sumber terbuka yang sedang dikembangkan oleh syuilo sejak 2014.",
	"learnMore": "Pelajari lebih lanjut",
	"aboutMisskeySource": "Sumber kode",
	"aboutMisskeyOriginal": "Asli",
	"aboutMisskeyTranslation": "Terjemahkan Misskey",
	"aboutMisskeyDonate": "Donasi ke Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} menggunakan versi modifikasi dari Misskey yang asli.",
	"sourceCodeIsNotYetProvided": "Sumber kode belum tersedia. Hubungi admin untuk memperbaiki masalah ini.",
	"aboutMisskeyProjectMembers": "Anggota proyek",
	"aboutMisskeyPatrons": "Pendukung",
	"aboutMisskeyMorePatrons": "Kami sangat mengapresiasi dukungan dari banyak penolong lain yang tidak tercantum disini. Terima kasih! 🥰",
	"aboutMisskey": "Tentang {productName}"
}
</locale>

<locale lang="json" locale="it-IT">
{
	"aboutMisskeyAbout": "Misskey è software libero, open source, sviluppato da Syuilo fin dal lontano 2014.",
	"learnMore": "Per saperne di più",
	"aboutMisskeySource": "Codice sorgente",
	"aboutMisskeyOriginal": "Originale",
	"aboutMisskeyTranslation": "Tradurre Misskey",
	"aboutMisskeyDonate": "Sostieni Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} sta usando una versione modificata diversa da Misskey originale.",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"aboutMisskeyProjectMembers": "Partecipanti al progetto",
	"aboutMisskeyPatrons": "Sostenitori",
	"aboutMisskeyMorePatrons": "Apprezziamo sinceramente il supporto di tante altre persone. Grazie mille! 🥰",
	"aboutMisskey": "A proposito di {productName}"
}
</locale>

<locale lang="json" locale="ja-JP">
{
	"aboutMisskeyAbout": "Misskeyはsyuiloによって2014年から開発されている、オープンソースのソフトウェアです。",
	"learnMore": "詳しく",
	"aboutMisskeySource": "ソースコード",
	"aboutMisskeyOriginal": "オリジナル",
	"aboutMisskeyTranslation": "Misskeyを翻訳",
	"aboutMisskeyDonate": "Misskeyに寄付",
	"aboutMisskeyThisIsModifiedVersion": "{name}はオリジナルのMisskeyを改変したバージョンを使用しています。",
	"sourceCodeIsNotYetProvided": "ソースコードはまだ提供されていません。この問題の修正について管理者に問い合わせてください。",
	"aboutMisskeyProjectMembers": "プロジェクトメンバー",
	"aboutMisskeyPatrons": "支援者",
	"aboutMisskeyMorePatrons": "他にも多くの方が支援してくれています。ありがとうございます🥰",
	"aboutMisskey": "{productName}について"
}
</locale>

<locale lang="json" locale="ja-KS">
{
	"aboutMisskeyAbout": "Misskeyはsyuiloが2014年からずっと作ってはる、オープンソースなソフトウェアや。",
	"learnMore": "詳しく",
	"aboutMisskeySource": "ソースコード",
	"aboutMisskeyOriginal": "オリジナル",
	"aboutMisskeyTranslation": "Misskeyを翻訳",
	"aboutMisskeyDonate": "Misskeyに寄付",
	"aboutMisskeyThisIsModifiedVersion": "{name}はオリジナルのMisskeyをいじったバージョンをつこうてるで。",
	"sourceCodeIsNotYetProvided": "ソースコードはまだ提供されてへんで。問題の修正について管理者に問い合わせてみ。",
	"aboutMisskeyProjectMembers": "プロジェクトメンバー",
	"aboutMisskeyPatrons": "支援者",
	"aboutMisskeyMorePatrons": "他にもぎょうさんの人からサポートしてもろてんねん。ほんまおおきに🥰",
	"aboutMisskey": "{productName}ってなんや？"
}
</locale>

<locale lang="json" locale="kab-KAB">
{
	"aboutMisskeyAbout": "Misskey is open-source software being developed by syuilo since 2014.",
	"learnMore": "Learn more",
	"aboutMisskeySource": "Source code",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Translate Misskey",
	"aboutMisskeyDonate": "Donate to Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"aboutMisskeyProjectMembers": "Project members",
	"aboutMisskeyPatrons": "Patrons",
	"aboutMisskeyMorePatrons": "We also appreciate the support of many other helpers not listed here. Thank you! 🥰",
	"aboutMisskey": "About {productName}"
}
</locale>

<locale lang="json" locale="kn-IN">
{
	"aboutMisskeyAbout": "Misskey is open-source software being developed by syuilo since 2014.",
	"learnMore": "Learn more",
	"aboutMisskeySource": "Source code",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Translate Misskey",
	"aboutMisskeyDonate": "Donate to Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"aboutMisskeyProjectMembers": "Project members",
	"aboutMisskeyPatrons": "Patrons",
	"aboutMisskeyMorePatrons": "We also appreciate the support of many other helpers not listed here. Thank you! 🥰",
	"aboutMisskey": "About {productName}"
}
</locale>

<locale lang="json" locale="ko-KR">
{
	"aboutMisskeyAbout": "Misskey는 syuilo가 2014년부터 개발한 오픈소스 소프트웨어입니다.",
	"learnMore": "자세히",
	"aboutMisskeySource": "소스 코드",
	"aboutMisskeyOriginal": "원본",
	"aboutMisskeyTranslation": "Misskey를 번역하기",
	"aboutMisskeyDonate": "Misskey에 기부하기",
	"aboutMisskeyThisIsModifiedVersion": "{name}에서는 원본 미스키를 수정한 버전을 사용하고 있습니다.",
	"sourceCodeIsNotYetProvided": "소스 코드를 아직 제공하지 않습니다. 이 문제를 해결하려면 관리자에게 문의해 주세요.",
	"aboutMisskeyProjectMembers": "프로젝트 구성원",
	"aboutMisskeyPatrons": "후원자",
	"aboutMisskeyMorePatrons": "이 외에도 다른 많은 분들이 도움을 주시고 계십니다. 감사합니다🥰",
	"aboutMisskey": "{productName}에 대하여"
}
</locale>

<locale lang="json" locale="nl-NL">
{
	"aboutMisskeyAbout": "Misskey is open-source software being developed by syuilo since 2014.",
	"learnMore": "Meer leren",
	"aboutMisskeySource": "Source code",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Translate Misskey",
	"aboutMisskeyDonate": "Donate to Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"aboutMisskeyProjectMembers": "Project members",
	"aboutMisskeyPatrons": "Patrons",
	"aboutMisskeyMorePatrons": "We also appreciate the support of many other helpers not listed here. Thank you! 🥰",
	"aboutMisskey": "Over {productName}"
}
</locale>

<locale lang="json" locale="no-NO">
{
	"aboutMisskeyAbout": "Misskey er programvare med åpen kildekode som har blitt utviklet av syuilo siden 2014.",
	"learnMore": "Les mer",
	"aboutMisskeySource": "Source code",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Oversett Misskey",
	"aboutMisskeyDonate": "Donate to Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"aboutMisskeyProjectMembers": "Project members",
	"aboutMisskeyPatrons": "Patrons",
	"aboutMisskeyMorePatrons": "We also appreciate the support of many other helpers not listed here. Thank you! 🥰",
	"aboutMisskey": "Om {productName}"
}
</locale>

<locale lang="json" locale="pl-PL">
{
	"aboutMisskeyAbout": "Misskey jest oprogramowanie open source rozwijanym przez syuilo od 2014.",
	"learnMore": "Dowiedz się więcej",
	"aboutMisskeySource": "Kod źródłowy",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Tłumacz Misskey",
	"aboutMisskeyDonate": "Przekaż darowiznę na Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"aboutMisskeyProjectMembers": "Project members",
	"aboutMisskeyPatrons": "Wspierający",
	"aboutMisskeyMorePatrons": "Naprawdę doceniam wsparcie ze strony wielu niewymienionych tu osób. Dziękuję! 🥰",
	"aboutMisskey": "O {productName}"
}
</locale>

<locale lang="json" locale="pt-PT">
{
	"aboutMisskeyAbout": "Misskey é um software de código aberto desenvolvido por syulio desde 2014.",
	"learnMore": "Saiba mais",
	"aboutMisskeySource": "Código-fonte",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Traduza o Misskey",
	"aboutMisskeyDonate": "Doe para o Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} utiliza uma versão modificada do Misskey original.",
	"sourceCodeIsNotYetProvided": "Código-fonte está indisponível. Contate o administrador para resolver esse problema.",
	"aboutMisskeyProjectMembers": "Membros do projeto",
	"aboutMisskeyPatrons": "Apoiadores",
	"aboutMisskeyMorePatrons": "Nós apreciamos o apoio de vários outros apoiadores não listados aqui. Obrigado! 🥰",
	"aboutMisskey": "Sobre {productName}"
}
</locale>

<locale lang="json" locale="ru-RU">
{
	"aboutMisskeyAbout": "Misskey — программа с открытым исходным кодом, которую разрабатывает syuilo с 2014 года.",
	"learnMore": "Подробнее",
	"aboutMisskeySource": "Исходный код",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Перевод Misskey",
	"aboutMisskeyDonate": "Пожертвование на Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"sourceCodeIsNotYetProvided": "Исходный код пока не доступен. Свяжитесь с администратором, чтобы исправить эту проблему.",
	"aboutMisskeyProjectMembers": "Участники проекта",
	"aboutMisskeyPatrons": "Материальная поддержка",
	"aboutMisskeyMorePatrons": "Большое спасибо и многим другим, кто принял участие в этом проекте! 🥰",
	"aboutMisskey": "О {productName}"
}
</locale>

<locale lang="json" locale="sk-SK">
{
	"aboutMisskeyAbout": "Misskey je open-source softvér, ktorý vyvíja syuilo od 2014.",
	"learnMore": "Zistiť viac",
	"aboutMisskeySource": "Zdrojový kód",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Preložiť Misskey",
	"aboutMisskeyDonate": "Podporiť Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"aboutMisskeyProjectMembers": "Project members",
	"aboutMisskeyPatrons": "Prispievatelia",
	"aboutMisskeyMorePatrons": "Takisto oceňujeme podporu mnoých ďalších, ktorí tu nie sú uvedení. Ďakujeme! 🥰",
	"aboutMisskey": "O {productName}"
}
</locale>

<locale lang="json" locale="th-TH">
{
	"aboutMisskeyAbout": "Misskey เป็นซอฟต์แวร์โอเพ่นซอร์สที่ถูกพัฒนาโดย Syuilo ตั้งแต่ปี 2014",
	"learnMore": "แสดงให้ดูหน่อย",
	"aboutMisskeySource": "ซอร์สโค้ด",
	"aboutMisskeyOriginal": "ต้นฉบับ",
	"aboutMisskeyTranslation": "แปลภาษา Misskey",
	"aboutMisskeyDonate": "บริจาคให้กับ Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} ใช้ Misskey เวอร์ชันดัดแปลง",
	"sourceCodeIsNotYetProvided": "ซอร์สโค้ดยังไม่พร้อมใช้งาน โปรดติดต่อผู้ดูแลระบบเพื่อแก้ไขปัญหานี้",
	"aboutMisskeyProjectMembers": "สมาชิกในโครงการ",
	"aboutMisskeyPatrons": "ผู้อุปถัมภ์",
	"aboutMisskeyMorePatrons": "และอีกหลายท่านที่ไม่ได้เอ่ยนาม ขอบคุณที่ร่วมช่วยเหลือตลอดมานะคะ 🥰",
	"aboutMisskey": "เกี่ยวกับ {productName}"
}
</locale>

<locale lang="json" locale="tr-TR">
{
	"aboutMisskeyAbout": "Misskey, 2014 yılından beri syuilo tarafından geliştirilen açık kaynaklı bir yazılımdır.",
	"learnMore": "Daha fazla bilgi edinin",
	"aboutMisskeySource": "Kaynak kodu",
	"aboutMisskeyOriginal": "Orijinal",
	"aboutMisskeyTranslation": "Misskey'i çevir",
	"aboutMisskeyDonate": "Misskey'e bağış yapın",
	"aboutMisskeyThisIsModifiedVersion": "{name} orijinal Misskey'in değiştirilmiş bir sürümünü kullanır.",
	"sourceCodeIsNotYetProvided": "Kaynak kodu henüz mevcut değildir. Bu sorunu gidermek için yöneticiyle iletişime geçin.",
	"aboutMisskeyProjectMembers": "Proje üyeleri",
	"aboutMisskeyPatrons": "Müşteriler",
	"aboutMisskeyMorePatrons": "Burada adı geçmeyen diğer birçok yardımseverin desteğine de teşekkür ederiz. Teşekkürler! 🥰",
	"aboutMisskey": "{productName} Hakkında"
}
</locale>

<locale lang="json" locale="ug-CN">
{
	"aboutMisskeyAbout": "Misskey is open-source software being developed by syuilo since 2014.",
	"learnMore": "Learn more",
	"aboutMisskeySource": "Source code",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Translate Misskey",
	"aboutMisskeyDonate": "Donate to Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"sourceCodeIsNotYetProvided": "Source code is not yet available. Contact the administrator to fix this problem.",
	"aboutMisskeyProjectMembers": "Project members",
	"aboutMisskeyPatrons": "Patrons",
	"aboutMisskeyMorePatrons": "We also appreciate the support of many other helpers not listed here. Thank you! 🥰",
	"aboutMisskey": "About {productName}"
}
</locale>

<locale lang="json" locale="uk-UA">
{
	"aboutMisskeyAbout": "Misskey - це програмне забезпечення з відкритим кодом, яке розробляє syuilo з 2014 року.",
	"learnMore": "Докладніше",
	"aboutMisskeySource": "Вихідний код",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Перекладати Misskey",
	"aboutMisskeyDonate": "Пожертвувати Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"sourceCodeIsNotYetProvided": "Вихідний код ще недоступний. Зверніться до адміністратора, щоб виправити цю проблему.",
	"aboutMisskeyProjectMembers": "Project members",
	"aboutMisskeyPatrons": "Підтримали",
	"aboutMisskeyMorePatrons": "Ми дуже цінуємо підтримку багатьох інших помічників, не перелічених тут. Дякуємо! 🥰",
	"aboutMisskey": "Про {productName}"
}
</locale>

<locale lang="json" locale="vi-VN">
{
	"aboutMisskeyAbout": "Misskey là phần mềm mã nguồn mở được phát triển bởi syuilo từ năm 2014.",
	"learnMore": "Tìm hiểu thêm",
	"aboutMisskeySource": "Mã nguồn",
	"aboutMisskeyOriginal": "Original",
	"aboutMisskeyTranslation": "Dịch Misskey",
	"aboutMisskeyDonate": "Ủng hộ Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} uses a modified version of the original Misskey.",
	"sourceCodeIsNotYetProvided": "Mã nguồn hiện chưa có sẵn, vui lòng liên hệ với quản trị viên để khắc phục sự cố này.",
	"aboutMisskeyProjectMembers": "Project members",
	"aboutMisskeyPatrons": "Người ủng hộ",
	"aboutMisskeyMorePatrons": "Chúng tôi cũng trân trọng sự hỗ trợ của nhiều người đóng góp khác không được liệt kê ở đây. Cảm ơn! 🥰",
	"aboutMisskey": "Về {productName}"
}
</locale>

<locale lang="json" locale="zh-CN">
{
	"aboutMisskeyAbout": "Misskey 是由 syuilo 于 2014 年开发的开源软件。",
	"learnMore": "更多信息",
	"aboutMisskeySource": "源代码",
	"aboutMisskeyOriginal": "原版",
	"aboutMisskeyTranslation": "翻译 Misskey",
	"aboutMisskeyDonate": "赞助 Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name}正在使用修改后的 Misskey。",
	"sourceCodeIsNotYetProvided": "还未提供源代码。要解决此问题请联系管理员。",
	"aboutMisskeyProjectMembers": "项目成员",
	"aboutMisskeyPatrons": "支持者",
	"aboutMisskeyMorePatrons": "还有很多其它的人也在支持我们，非常感谢🥰",
	"aboutMisskey": "关于 {productName}"
}
</locale>

<locale lang="json" locale="zh-TW">
{
	"aboutMisskeyAbout": "Misskey 是由 syuilo 自 2014 年起開發的開放原始碼軟體。",
	"learnMore": "更多資訊",
	"aboutMisskeySource": "原始碼",
	"aboutMisskeyOriginal": "原始",
	"aboutMisskeyTranslation": "翻譯 Misskey",
	"aboutMisskeyDonate": "贊助 Misskey",
	"aboutMisskeyThisIsModifiedVersion": "{name} 使用原始 Misskey 的修改版本。",
	"sourceCodeIsNotYetProvided": "尚未提供原始碼，請洽詢管理員解決這個問題。",
	"aboutMisskeyProjectMembers": "專案成員",
	"aboutMisskeyPatrons": "贊助者",
	"aboutMisskeyMorePatrons": "還有許許多多幫助我們的其他人，非常感謝你們。 🥰",
	"aboutMisskey": "關於 {productName}"
}
</locale>
