/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { existsSync, readFileSync, globSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { basename, dirname } from 'node:path/posix';
import { GENERATOR, type State, generate } from 'astring';
import type * as estree from 'estree';
import { format } from 'prettier';

interface SatisfiesExpression extends estree.BaseExpression {
	type: 'SatisfiesExpression';
	expression: estree.Expression;
	reference: estree.Identifier;
}

interface ImportDeclaration extends estree.ImportDeclaration {
	kind?: 'type';
}

const generator = {
	...GENERATOR,
	ImportDeclaration(node: ImportDeclaration, state: State) {
		state.write('import ');
		if (node.kind === 'type') state.write('type ');
		const { specifiers } = node;
		if (specifiers.length > 0) {
			let i = 0;
			for (; i < specifiers.length; i++) {
				if (i > 0) {
					state.write(', ');
				}
				const specifier = specifiers[i]!;
				if (specifier.type === 'ImportDefaultSpecifier') {
					state.write(specifier.local.name, specifier);
				} else if (specifier.type === 'ImportNamespaceSpecifier') {
					state.write(`* as ${specifier.local.name}`, specifier);
				} else {
					break;
				}
			}
			if (i < specifiers.length) {
				state.write('{');
				for (; i < specifiers.length; i++) {
					const specifier = specifiers[i]! as estree.ImportSpecifier;
					const { name } = specifier.imported as estree.Identifier;
					state.write(name, specifier);
					if (name !== specifier.local.name) {
						state.write(` as ${specifier.local.name}`);
					}
					if (i < specifiers.length - 1) {
						state.write(', ');
					}
				}
				state.write('}');
			}
			state.write(' from ');
		}
		this.Literal(node.source, state);

		state.write(';');
	},
	SatisfiesExpression(node: SatisfiesExpression, state: State) {
		switch (node.expression.type) {
			case 'ArrowFunctionExpression': {
				state.write('(');
				this[node.expression.type](node.expression, state);
				state.write(')');
				break;
			}
			default: {
				const generateExpression = this[node.expression.type] as (expression: estree.Expression, state: State) => void;
				generateExpression.call(this, node.expression, state);
				break;
			}
		}
		state.write(' satisfies ', node as unknown as estree.Expression);
		this[node.reference.type](node.reference, state);
	},
};

type SplitCamel<
	T extends string,
	YC extends string = '',
	YN extends readonly string[] = []
> = T extends `${infer XH}${infer XR}`
	? XR extends ''
		? [...YN, Uncapitalize<`${YC}${XH}`>]
		: XH extends Uppercase<XH>
		? SplitCamel<XR, Lowercase<XH>, [...YN, YC]>
		: SplitCamel<XR, `${YC}${XH}`, YN>
	: YN;

type ToKebab<T extends readonly string[]> = T extends readonly [
	infer XO extends string
]
	? XO
	: T extends readonly [
			infer XH extends string,
			...infer XR extends readonly string[]
		]
	? `${XH}${XR extends readonly string[] ? `-${ToKebab<XR>}` : ''}`
	: '';

function h<T extends estree.Node>(
	component: T['type'],
	props: Omit<T, 'type'>
): T {
	const type = component.replace(/(?:^|-)([a-z])/g, (_, c) => c.toUpperCase());
	return Object.assign(props || {}, { type }) as T;
}

function toStoryTitle(component: string): string {
	const withoutExtension = component.slice(0, -'.vue'.length);
	const sourceRelative = withoutExtension.startsWith('src/')
		? withoutExtension.slice('src/'.length)
		: withoutExtension.startsWith('../features/')
			? 'features/' + withoutExtension.slice('../features/'.length)
			: withoutExtension;
	return sourceRelative.replace(/\./g, '/');
}

// eslint-disable-next-line @typescript-eslint/no-namespace -- Classic JSX factory typing requires this namespace.
declare namespace h.JSX {
	type Element = estree.Node;
	type IntrinsicElements = {
		[T in keyof typeof generator as ToKebab<SplitCamel<Uncapitalize<T>>>]: {
			[K in keyof Omit<
				Parameters<(typeof generator)[T]>[0],
				'type'
			>]?: Parameters<(typeof generator)[T]>[0][K];
		};
	};
}

function toStories(component: string): Promise<string> {
	const msw = `${component.slice(0, -'.vue'.length)}.msw`;
	const implStories = `${component.slice(0, -'.vue'.length)}.stories.impl`;
	const metaStories = `${component.slice(0, -'.vue'.length)}.stories.meta`;
	const hasMsw = existsSync(`${msw}.ts`);
	const hasImplStories = existsSync(`${implStories}.ts`);
	const hasMetaStories = existsSync(`${metaStories}.ts`);
	const base = basename(component);
	const dir = dirname(component);
	const pagePath = dir + '/';
	const isPage = pagePath.startsWith('src/pages/')
		|| /^\.\.\/features\/[^/]+\/frontend\/pages\//.test(pagePath);
	const literal =
		<literal
			value={toStoryTitle(component)}
		/> as estree.Literal;
	const identifier =
		<identifier
			name={base
				.slice(0, -'.vue'.length)
				.replace(/[-.]|^(?=\d)/g, '_')
				.replace(/(?<=^[^A-Z_]*$)/, '_')}
		/> as estree.Identifier;
	const parameters =
		<object-expression
			properties={[
				<property
					key={<identifier name='layout' /> as estree.Identifier}
					value={<literal value={isPage ? 'fullscreen' : 'centered'}/> as estree.Literal}
					kind={'init' as const}
				/> as estree.Property,
				...(hasMsw
					? [
							<property
								key={<identifier name='msw' /> as estree.Identifier}
								value={<identifier name='msw' /> as estree.Identifier}
								kind={'init' as const}
								shorthand
							/> as estree.Property,
						]
					: []),
			]}
		/> as estree.ObjectExpression;
	const program =
		<program
			body={[
				<import-declaration
					source={<literal value='@storybook/vue3' /> as estree.Literal}
					specifiers={[
						<import-specifier
							local={<identifier name='Meta' /> as estree.Identifier}
							imported={<identifier name='Meta' /> as estree.Identifier}
						/> as estree.ImportSpecifier,
						...(hasImplStories
							? []
							: [
									<import-specifier
										local={<identifier name='StoryObj' /> as estree.Identifier}
										imported={<identifier name='StoryObj' /> as estree.Identifier}
									/> as estree.ImportSpecifier,
								]),
					]}
					kind={'type'}
				/> as ImportDeclaration,
				...(hasMsw
					? [
							<import-declaration
								source={<literal value={`./${basename(msw)}`} /> as estree.Literal}
								specifiers={[
									<import-namespace-specifier
										local={<identifier name='msw' /> as estree.Identifier}
									/> as estree.ImportNamespaceSpecifier,
								]}
							/> as ImportDeclaration,
						]
					: []),
				...(hasImplStories
					? []
					: [
							<import-declaration
								source={<literal value={`./${base}`} /> as estree.Literal}
								specifiers={[
									<import-default-specifier local={identifier} /> as estree.ImportDefaultSpecifier,
								]}
							/> as ImportDeclaration,
						]),
				...(hasMetaStories
					? [
							<import-declaration
								source={<literal value={`./${basename(metaStories)}`} /> as estree.Literal}
								specifiers={[
									<import-namespace-specifier
										local={<identifier name='storiesMeta' /> as estree.Identifier}
									/> as estree.ImportNamespaceSpecifier,
								]}
							/> as ImportDeclaration,
						]
					: []),
				<variable-declaration
					kind={'const' as const}
					declarations={[
						<variable-declarator
							id={<identifier name='meta' /> as estree.Identifier}
							init={
								<satisfies-expression
									expression={
										<object-expression
											properties={[
												<property
													key={<identifier name='title' /> as estree.Identifier}
													value={literal}
													kind={'init' as const}
												/> as estree.Property,
												<property
													key={<identifier name='component' /> as estree.Identifier}
													value={identifier}
													kind={'init' as const}
												/> as estree.Property,
												...(hasMetaStories
													? [
															<spread-element
																argument={<identifier name='storiesMeta' /> as estree.Identifier}
															/> as estree.SpreadElement,
														]
													: [])
											]}
										/> as estree.ObjectExpression
									}
									reference={<identifier name={`Meta<typeof ${identifier.name}>`} /> as estree.Identifier}
								/> as estree.Expression
							}
						/> as estree.VariableDeclarator,
					]}
				/> as estree.VariableDeclaration,
				...(hasImplStories
					? []
					: [
							<export-named-declaration
								declaration={
									<variable-declaration
										kind={'const' as const}
										declarations={[
											<variable-declarator
												id={<identifier name='Default' /> as estree.Identifier}
												init={
													<satisfies-expression
														expression={
															<object-expression
																properties={[
																	<property
																		key={<identifier name='render' /> as estree.Identifier}
																		value={
																			<function-expression
																				params={[
																					<identifier name='args' /> as estree.Identifier,
																				]}
																				body={
																					<block-statement
																						body={[
																							<return-statement
																								argument={
																									<object-expression
																										properties={[
																											<property
																												key={<identifier name='components' /> as estree.Identifier}
																												value={
																													<object-expression
																														properties={[
																															<property key={identifier} value={identifier} kind={'init' as const} shorthand /> as estree.Property,
																														]}
																													/> as estree.ObjectExpression
																												}
																												kind={'init' as const}
																											/> as estree.Property,
																											<property
																												key={<identifier name='setup' /> as estree.Identifier}
																												value={
																													<function-expression
																														params={[]}
																														body={
																															<block-statement
																																body={[
																																	<return-statement
																																		argument={
																																			<object-expression
																																				properties={[
																																					<property
																																						key={<identifier name='args' /> as estree.Identifier}
																																						value={<identifier name='args' /> as estree.Identifier}
																																						kind={'init' as const}
																																						shorthand
																																					/> as estree.Property,
																																				]}
																																			/> as estree.ObjectExpression
																																		}
																																	/> as estree.ReturnStatement,
																																]}
																															/> as estree.BlockStatement
																														}
																													/> as estree.FunctionExpression
																												}
																												method
																												kind={'init' as const}
																											/> as estree.Property,
																											<property
																												key={<identifier name='computed' /> as estree.Identifier}
																												value={
																													<object-expression
																														properties={[
																															<property
																																key={<identifier name='props' /> as estree.Identifier}
																																value={
																																	<function-expression
																																		params={[]}
																																		body={
																																			<block-statement
																																				body={[
																																					<return-statement
																																						argument={
																																							<object-expression
																																								properties={[
																																									<spread-element
																																										argument={
																																											<member-expression
																																												object={<this-expression /> as estree.ThisExpression}
																																												property={<identifier name='args' /> as estree.Identifier}
																																											/> as estree.MemberExpression
																																										}
																																									/> as estree.SpreadElement,
																																								]}
																																							/> as estree.ObjectExpression
																																						}
																																					/> as estree.ReturnStatement,
																																				]}
																																			/> as estree.BlockStatement
																																		}
																																	/> as estree.FunctionExpression
																																}
																																method
																																kind={'init' as const}
																															/> as estree.Property,
																														]}
																													/> as estree.ObjectExpression
																												}
																												kind={'init' as const}
																											/> as estree.Property,
																											<property
																												key={<identifier name='template' /> as estree.Identifier}
																												value={<literal value={`<${identifier.name} v-bind="props" />`} /> as estree.Literal}
																												kind={'init' as const}
																											/> as estree.Property,
																										]}
																									/> as estree.ObjectExpression
																								}
																							/> as estree.ReturnStatement,
																						]}
																					/> as estree.BlockStatement
																				}
																			/> as estree.FunctionExpression
																		}
																		method
																		kind={'init' as const}
																	/> as estree.Property,
																	<property
																		key={<identifier name='parameters' /> as estree.Identifier}
																		value={parameters}
																		kind={'init' as const}
																	/> as estree.Property,
																]}
															/> as estree.ObjectExpression
														}
														reference={<identifier name={`StoryObj<typeof ${identifier.name}>`} /> as estree.Identifier}
													/> as estree.Expression
												}
											/> as estree.VariableDeclarator,
										]}
									/> as estree.VariableDeclaration
								}
							/> as estree.ExportNamedDeclaration,
						]),
				<export-default-declaration
					declaration={(<identifier name='meta' />) as estree.Identifier}
				/> as estree.ExportDefaultDeclaration,
			]}
		/> as estree.Program;
	return format(
		'/* eslint-disable @typescript-eslint/explicit-function-return-type */\n' +
			'/* eslint-disable import/no-default-export */\n' +
			'/* eslint-disable import/no-duplicates */\n' +
			'/* eslint-disable import/order */\n' +
			generate(program, { generator }) +
			(hasImplStories ? readFileSync(`${implStories}.ts`, 'utf-8') : ''),
		{
			parser: 'babel-ts',
			singleQuote: true,
			useTabs: true,
		}
	);
}

// glob('src/{components,pages,ui,widgets}/**/*.vue')
(async () => {
	const components = [

		globSync('../features/navigation/frontend/components/global/RouterView.vue'),
		globSync('../features/moderation/frontend/components/MkAbuseReportWindow.vue'),
		globSync('../features/users/frontend/components/MkAccountMoved.vue'),
		globSync('../features/users/frontend/components/MkAchievements.vue'),
		globSync('../features/ui/frontend/components/MkAnalogClock.vue'),
		globSync('../features/web/frontend/components/MkAnimBg.vue'),

		globSync('../features/announcements/frontend/components/MkAnnouncementDialog.vue'),
		globSync('../features/timelines/frontend/components/MkAntennaEditor.vue'),
		globSync('../features/timelines/frontend/components/MkAntennaEditorDialog.vue'),
		globSync('../features/play/frontend/components/MkAsUi.vue'),

		globSync('../features/discovery/frontend/components/MkAutocomplete.vue'),
		globSync('../features/users/frontend/components/MkAvatars.vue'),
		globSync('../features/instance/frontend/components/MkDonation.vue'),
		globSync('../features/integrations/frontend/components/MkExtensionInstaller.vue'),
		globSync('../features/media/frontend/components/MkBlurhash.vue'),
		globSync('../features/media/frontend/components/MkCropperDialog.vue'),

		globSync('../features/play/frontend/components/MkFlashPreview.vue'),
		globSync('../features/gallery/frontend/components/MkGalleryPostPreview.vue'),

		globSync('../features/users/frontend/components/MkUserSetupDialog.vue'),


		globSync('../features/federation/frontend/components/MkInstanceCardMini.vue'),
		globSync('../features/auth/frontend/components/MkInviteCode.vue'),
		globSync('../features/discovery/frontend/components/MkTagItem.vue'),
		globSync('../features/roles/frontend/components/MkRoleSelectDialog.vue'),

		globSync('../features/ui/frontend/components/grid/MkGrid.vue'),
		globSync('../features/emojis/frontend/pages/admin/custom-emojis-manager2.vue'),
		globSync('../features/statistics/frontend/pages/admin/overview.ap-requests.vue'),
		globSync('../features/users/frontend/pages/user/home.vue'),
		globSync('../features/discovery/frontend/pages/search.vue'),
		// Keep the curated story set when selected components move into feature packages.
		globSync('../features/ui/frontend/components/MkButton.vue'),
		globSync('../features/auth/frontend/components/MkCaptcha.vue'),
		globSync('../features/channels/frontend/components/MkChannelFollowButton.vue'),
		globSync('../features/channels/frontend/components/MkChannelList.vue'),
		globSync('../features/channels/frontend/components/MkChannelPreview.vue'),
		globSync('../features/statistics/frontend/components/MkChart.vue'),
		globSync('../features/statistics/frontend/components/MkChartLegend.vue'),
		globSync('../features/statistics/frontend/components/MkChartTooltip.vue'),
		globSync('../features/chat/frontend/components/MkChatHistories.vue'),
		globSync('../features/games/frontend/components/MkClickerGame.vue'),
		globSync('../features/collections/frontend/components/MkClipPreview.vue'),
		globSync('../features/markup/frontend/components/MkCode.core.vue'),
		globSync('../features/markup/frontend/components/MkCode.vue'),
		globSync('../features/markup/frontend/components/MkCodeEditor.vue'),
		globSync('../features/markup/frontend/components/MkCodeInline.vue'),
		globSync('../features/ui/frontend/components/MkColorInput.vue'),
		globSync('../features/ui/frontend/components/MkContainer.vue'),
		globSync('../features/ui/frontend/components/MkContextMenu.vue'),
		globSync('../features/emojis/frontend/components/MkCustomEmojiDetailedDialog.vue'),
		globSync('../features/notes/frontend/components/MkCwButton.vue'),
		globSync('../features/ui/frontend/components/MkDialog.vue'),
		globSync('../features/ui/frontend/components/MkDigitalClock.vue'),
		globSync('../features/ui/frontend/components/MkDisableSection.vue'),
		globSync('../features/ui/frontend/components/MkDivider.vue'),
		globSync('../features/ui/frontend/components/MkDraggable.vue'),
		globSync('../features/drive/frontend/components/MkDrive.file.vue'),
		globSync('../features/drive/frontend/components/MkDrive.folder.vue'),
		globSync('../features/drive/frontend/components/MkDrive.navFolder.vue'),
		globSync('../features/drive/frontend/components/MkDrive.vue'),
		globSync('../features/drive/frontend/components/MkDriveFileSelectDialog.vue'),
		globSync('../features/drive/frontend/components/MkDriveFileThumbnail.vue'),
		globSync('../features/drive/frontend/components/MkDriveFolderSelectDialog.vue'),
		globSync('../features/drive/frontend/components/MkDriveWindow.vue'),
		globSync('../features/web/frontend/components/MkEmbedCodeGenDialog.vue'),
		globSync('../features/emojis/frontend/components/MkEmojiPicker.section.vue'),
		globSync('../features/emojis/frontend/components/MkEmojiPicker.vue'),
		globSync('../features/emojis/frontend/components/MkEmojiPickerDialog.vue'),
		globSync('../features/users/frontend/components/MkUserSetupDialog.Follow.vue'),
		globSync('../features/users/frontend/components/MkUserSetupDialog.Privacy.vue'),
		globSync('../features/users/frontend/components/MkUserSetupDialog.Profile.vue'),
		globSync('../features/users/frontend/components/MkUserSetupDialog.User.vue'),
		globSync('../features/navigation/frontend/components/global/MkA.vue'),
		globSync('../features/users/frontend/components/global/MkAcct.vue'),
		globSync('../features/instance/frontend/components/global/MkAd.vue'),
		globSync('../features/users/frontend/components/global/MkAvatar.vue'),
		globSync('../features/ui/frontend/components/global/MkCondensedLine.vue'),
		globSync('../features/emojis/frontend/components/global/MkCustomEmoji.vue'),
		globSync('../features/ui/frontend/components/global/MkEllipsis.vue'),
		globSync('../features/emojis/frontend/components/global/MkEmoji.vue'),
		globSync('../features/ui/frontend/components/global/MkError.vue'),
		globSync('../features/ui/frontend/components/global/MkLazy.vue'),
		globSync('../features/ui/frontend/components/global/MkLoading.vue'),
		globSync('../features/navigation/frontend/components/global/MkPageHeader.tabs.vue'),
		globSync('../features/navigation/frontend/components/global/MkPageHeader.vue'),
		globSync('../features/ui/frontend/components/global/MkResult.vue'),
		globSync('../features/ui/frontend/components/global/MkStickyContainer.vue'),
		globSync('../features/ui/frontend/components/global/MkSuspense.vue'),
		globSync('../features/ui/frontend/components/global/MkSystemIcon.vue'),
		globSync('../features/ui/frontend/components/global/MkTime.vue'),
		globSync('../features/ui/frontend/components/global/MkTip.vue'),
		globSync('../features/markup/frontend/components/global/MkUrl.vue'),
		globSync('../features/users/frontend/components/global/MkUserName.vue'),
	].flat();
	await Promise.all(components.map(async (component) => {
		const stories = component.replace(/\.vue$/, '.stories.ts');
		await writeFile(stories, await toStories(component));
	}));
})();
