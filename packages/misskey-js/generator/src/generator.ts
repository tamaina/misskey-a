import assert from 'assert';
import { externalOperationName } from '../../../features/api/backend/transport/openapi/operation-ids.js';
import { mkdir, readFile, writeFile } from 'fs/promises';
import type { OpenAPIV3_1 } from 'openapi-types';
import { toPascal } from 'ts-case-convert';
import { parse } from '@readme/openapi-parser';
import openapiTS, { astToString } from 'openapi-typescript';
import type { OpenAPI3 } from 'openapi-typescript';
import ts from 'typescript';
import { removeNeverPropertiesFromAST } from './ast-transformer.js';

async function generateBaseTypes(
	openApiDocs: OpenAPIV3_1.Document,
	openApiJsonPath: string,
	typeFileName: string,
) {
	const disabledLints = [
		'@typescript-eslint/naming-convention',
		'@typescript-eslint/no-explicit-any',
	];

	const lines: string[] = [];
	for (const lint of disabledLints) {
		lines.push(`/* eslint ${lint}: 0 */`);
	}
	lines.push('');
	if (Object.hasOwn(openApiDocs.components?.schemas ?? {}, 'JsonValue')) {
		lines.push("import type { PackedJsonValue as ContractJsonValue } from '#native-json-value';");
	}

	// The SDK request/response aliases come from contracts. This file supplies external schema models only.
	const openApi = JSON.parse(await readFile(openApiJsonPath, 'utf8')) as OpenAPI3;
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	for (const [key, item] of Object.entries(openApi.paths!)) {
		assert('post' in item);
		// Retain the public deep-import operations type as generated compatibility output.
		const post = { ...item.post, operationId: externalOperationName(key) };
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		openApi.paths![key] = { post };
	}

	const tsNullNode = ts.factory.createLiteralTypeNode(ts.factory.createNull());
	const tsBlobNode = ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('Blob'));

	const generatedTypesAst = await openapiTS(openApi, {
		exportType: true,
		transform(schemaObject, options) {
			// Recursive unions through components['schemas'][Name] hit TS2502.
			// Reference the single public wire alias instead of generating a second model.
			if (options.path === '#/components/schemas/JsonValue' || isRecursiveJsonValue(schemaObject, options.path)) {
				return ts.factory.createTypeReferenceNode('ContractJsonValue');
			}
			if ('format' in schemaObject && schemaObject.format === 'binary') {
				if (schemaObject.nullable) {
					return ts.factory.createUnionTypeNode([tsBlobNode, tsNullNode]);
				} else {
					return tsBlobNode;
				}
			}
		},
	});

	const filteredAst = removeNeverPropertiesFromAST(generatedTypesAst);

	lines.push(astToString(filteredAst));

	lines.push('');

	await writeFile(typeFileName, lines.join('\n'));
}

async function generateSchemaEntities(
	openApiDocs: OpenAPIV3_1.Document,
	typeFileName: string,
	outputPath: string,
) {
	if (!openApiDocs.components?.schemas) {
		return;
	}

	const schemas = openApiDocs.components.schemas;
	const schemaNames = Object.keys(schemas);
	const typeAliasLines: string[] = [];

	typeAliasLines.push(`import type { components } from '${toImportPath(typeFileName)}';`);
	typeAliasLines.push("import type { PackedModels } from '#packed-models';");
	typeAliasLines.push("type ContractModel<Name extends keyof components['schemas']> = Name extends keyof PackedModels ? PackedModels[Name] : components['schemas'][Name];");
	typeAliasLines.push(
		...schemaNames.map(it => `export type ${it} = ContractModel<'${it}'>;`),
	);
	typeAliasLines.push('');

	await writeFile(outputPath, typeAliasLines.join('\n'));
}

async function generateEndpoints(
	openApiDocs: OpenAPIV3_1.Document,
	typeFileName: string,
	entitiesOutputPath: string,
	endpointOutputPath: string,
) {
	const endpoints: Endpoint[] = [];
	const endpointReqMediaTypes: EndpointReqMediaType[] = [];
	const endpointReqMediaTypesSet = new Set<string>();

	// misskey-jsはPOST固定で送っているので、こちらも決め打ちする。別メソッドに対応することがあればこちらも直す必要あり
	const paths = openApiDocs.paths ?? {};
	const postPathItems = Object.keys(paths)
		.map(it => ({
			_path_: it.replace(/^\//, ''),
			...paths[it]?.post,
		}))
		.filter(filterUndefined);

	for (const operation of postPathItems) {
		const path = operation._path_;
		const endpoint = new Endpoint(path);
		endpoints.push(endpoint);

		if (isRequestBodyObject(operation.requestBody)) {
			const reqContent = operation.requestBody.content;
			const supportMediaTypes = Object.keys(reqContent);
			if (supportMediaTypes.length > 0) {
				// いまのところ複数のメディアタイプをとるエンドポイントは無いので決め打ちする
				const req = new EndpointTypeAlias(
					path,
					supportMediaTypes[0],
					EndpointAliasType.REQUEST,
				);
				endpoint.request = req;

				const reqType = new EndpointReqMediaType(path, req);
				if (reqType.getMediaType() !== 'application/json') {
					endpointReqMediaTypesSet.add(reqType.getMediaType());
					endpointReqMediaTypes.push(reqType);
				}
			}
		}

		if (operation.responses && isResponseObject(operation.responses['200']) && operation.responses['200'].content) {
			const resContent = operation.responses['200'].content;
			const supportMediaTypes = Object.keys(resContent);
			if (supportMediaTypes.length > 0) {
				// いまのところ複数のメディアタイプを返すエンドポイントは無いので決め打ちする
				endpoint.response = new EndpointTypeAlias(
					path,
					supportMediaTypes[0],
					EndpointAliasType.RESPONSE,
				);
			}
		}
	}

	const entitiesOutputLine: string[] = [];

	entitiesOutputLine.push('/* eslint @typescript-eslint/naming-convention: 0 */');

	entitiesOutputLine.push("import type { ContractEndpoints } from '../contract.types.js';");
	entitiesOutputLine.push("type ContractRequest<Route extends keyof ContractEndpoints> = ContractEndpoints[Route]['req'];");
	entitiesOutputLine.push("type ContractResponse<Route extends keyof ContractEndpoints> = ContractEndpoints[Route]['res'];");
	entitiesOutputLine.push('');

	entitiesOutputLine.push(new EmptyTypeAlias(EndpointAliasType.REQUEST).toLine());
	entitiesOutputLine.push(new EmptyTypeAlias(EndpointAliasType.RESPONSE).toLine());
	entitiesOutputLine.push('');

	const entities = endpoints
		.flatMap(it => [it.request, it.response].filter(i => i))
		.filter(filterUndefined);
	entitiesOutputLine.push(...entities.map(it => it.toLine()));
	entitiesOutputLine.push('');

	await writeFile(entitiesOutputPath, entitiesOutputLine.join('\n'));

	const endpointOutputLine: string[] = [];

	endpointOutputLine.push('import type {');
	endpointOutputLine.push(
		...[emptyRequest, emptyResponse, ...entities].map(it => '\t' + it.generateName() + ','),
	);
	endpointOutputLine.push(`} from '${toImportPath(entitiesOutputPath)}';`);
	endpointOutputLine.push('');

	endpointOutputLine.push('export type Endpoints = {');
	endpointOutputLine.push(
		...endpoints.map(it => '\t' + it.toLine()),
	);
	endpointOutputLine.push('};');
	endpointOutputLine.push('');

	function generateEndpointReqMediaTypesType() {
		return `{ [K in keyof Endpoints]?: ${[...endpointReqMediaTypesSet].map((t) => `'${t}'`).join(' | ')}; }`;
	}

	endpointOutputLine.push(`/**
 * NOTE: The content-type for all endpoints not listed here is application/json.
 */`);
	endpointOutputLine.push('export const endpointReqTypes = {');

	endpointOutputLine.push(
		...endpointReqMediaTypes.map(it => '\t' + it.toLine()),
	);

	endpointOutputLine.push(`} as const satisfies ${generateEndpointReqMediaTypesType()};`);
	endpointOutputLine.push('');

	await writeFile(endpointOutputPath, endpointOutputLine.join('\n'));
}

async function generateApiClientJSDoc(
	openApiDocs: OpenAPIV3_1.Document,
	apiClientFileName: string,
	endpointsFileName: string,
	warningsOutputPath: string,
) {
	const endpoints: {
		path: string;
		description: string;
	}[] = [];

	// misskey-jsはPOST固定で送っているので、こちらも決め打ちする。別メソッドに対応することがあればこちらも直す必要あり
	const paths = openApiDocs.paths ?? {};
	const postPathItems = Object.keys(paths)
		.map(it => ({
			_path_: it.replace(/^\//, ''),
			...paths[it]?.post,
		}))
		.filter(filterUndefined);

	for (const operation of postPathItems) {
		if (operation.description) {
			endpoints.push({
				path: operation._path_,
				description: operation.description,
			});
		}
	}

	const endpointOutputLine: string[] = [];

	endpointOutputLine.push(`import type { SwitchCaseResponseType } from '${toImportPath(apiClientFileName)}';`);
	endpointOutputLine.push(`import type { Endpoints } from '${toImportPath(endpointsFileName)}';`);
	endpointOutputLine.push('');

	endpointOutputLine.push(`declare module '${toImportPath(apiClientFileName)}' {`);
	endpointOutputLine.push('  export interface APIClient {');
	for (let i = 0; i < endpoints.length; i++) {
		const endpoint = endpoints[i];

		endpointOutputLine.push(
			'    /**',
			endpoint.description.split('\n').map(line => `     * ${line}`.trimEnd()).join('\n'),
			'     */',
			`    request<E extends '${endpoint.path}', P extends Endpoints[E][\'req\']>(`,
			'      endpoint: E,',
			'      params: P,',
			'      credential?: string | null,',
			'    ): Promise<SwitchCaseResponseType<E, P>>;',
		);

		if (i < endpoints.length - 1) {
			endpointOutputLine.push('\n');
		}
	}
	endpointOutputLine.push('  }');
	endpointOutputLine.push('}');
	endpointOutputLine.push('');

	await writeFile(warningsOutputPath, endpointOutputLine.join('\n'));
}

function isRequestBodyObject(value: unknown): value is OpenAPIV3_1.RequestBodyObject {
	if (!value) {
		return false;
	}

	const { content } = value as Record<keyof OpenAPIV3_1.RequestBodyObject, unknown>;
	return content !== undefined;
}

function isResponseObject(value: unknown): value is OpenAPIV3_1.ResponseObject {
	if (!value) {
		return false;
	}

	const { description } = value as Record<keyof OpenAPIV3_1.ResponseObject, unknown>;
	return description !== undefined;
}

function filterUndefined<T>(item: T): item is Exclude<T, undefined> {
	return item !== undefined;
}

function toImportPath(fileName: string, fromPath = '/built/autogen', toPath = ''): string {
	return fileName.replace(fromPath, toPath).replace('.ts', '.js');
}

enum EndpointAliasType {
	REQUEST = 'Request',
	RESPONSE = 'Response'
}

interface IEndpointTypeAlias {
	readonly type: EndpointAliasType

	generateName(): string

	toLine(): string
}

class EndpointTypeAlias implements IEndpointTypeAlias {
	public readonly path: string;
	public readonly mediaType: string;
	public readonly type: EndpointAliasType;

	constructor(
		path: string,
		mediaType: string,
		type: EndpointAliasType,
	) {
		this.path = path;
		this.mediaType = mediaType;
		this.type = type;
	}

	generateName(): string {
		const nameBase = this.path.replace(/\//g, '-');
		return toPascal(nameBase + this.type);
	}

	toLine(): string {
		const name = this.generateName();
		return (this.type === EndpointAliasType.REQUEST)
			? `export type ${name} = ContractRequest<'${this.path.replace(/^\//, '')}'>;`
			: `export type ${name} = ContractResponse<'${this.path.replace(/^\//, '')}'>;`;
	}
}

class EmptyTypeAlias implements IEndpointTypeAlias {
	readonly type: EndpointAliasType;

	constructor(type: EndpointAliasType) {
		this.type = type;
	}

	generateName(): string {
		return 'Empty' + this.type;
	}

	toLine(): string {
		const name = this.generateName();
		return `export type ${name} = Record<string, unknown> | undefined;`;
	}
}

const emptyRequest = new EmptyTypeAlias(EndpointAliasType.REQUEST);
const emptyResponse = new EmptyTypeAlias(EndpointAliasType.RESPONSE);

class Endpoint {
	public readonly path: string;
	public request?: IEndpointTypeAlias;
	public response?: IEndpointTypeAlias;

	constructor(path: string) {
		this.path = path;
	}

	toLine(): string {
		const reqName = this.request?.generateName() ?? emptyRequest.generateName();
		const resName = this.response?.generateName() ?? emptyResponse.generateName();

		return `'${this.path}': { req: ${reqName}; res: ${resName} };`;
	}
}

class EndpointReqMediaType {
	public readonly path: string;
	public readonly mediaType: string;

	constructor(path: string, request: EndpointTypeAlias, mediaType?: undefined);
	constructor(path: string, request: undefined, mediaType: string);
	constructor(path: string, request: EndpointTypeAlias | undefined, mediaType?: string) {
		this.path = path;
		this.mediaType = mediaType ?? request?.mediaType ?? 'application/json';
	}

	getMediaType(): string {
		return this.mediaType;
	}

	toLine(): string {
		return `'${this.path}': '${this.mediaType}',`;
	}
}

async function main() {
	const generatePath = './built/autogen';
	await mkdir(generatePath, { recursive: true });

	const openApiJsonPath = './api.json';
	const openApiDocs = await parse(openApiJsonPath) as OpenAPIV3_1.Document;

	const typeFileName = './built/autogen/types.ts';
	await generateBaseTypes(openApiDocs, openApiJsonPath, typeFileName);

	const modelFileName = `${generatePath}/models.ts`;
	await generateSchemaEntities(openApiDocs, typeFileName, modelFileName);

	const entitiesFileName = `${generatePath}/entities.ts`;
	const endpointFileName = `${generatePath}/endpoint.ts`;
	await generateEndpoints(openApiDocs, typeFileName, entitiesFileName, endpointFileName);

	const apiClientWarningFileName = `${generatePath}/apiClientJSDoc.ts`;
	await generateApiClientJSDoc(openApiDocs, '../api.ts', '../api.types.ts', apiClientWarningFileName);
}

main();

/** Recursive JSON aliases stay owned by the portable wire schema, including generated names. */
function isRecursiveJsonValue(schema: OpenAPIV3_1.SchemaObject, reference: string): boolean {
	const variants = schema.anyOf;
	if (!variants || variants.length !== 6) return false;
	const primitiveTypes = new Set(['null', 'boolean', 'number', 'string']);
	let array = false;
	let object = false;
	for (const variant of variants) {
		if ('$ref' in variant) return false;
		if (typeof variant.type === 'string' && primitiveTypes.delete(variant.type)) continue;
		if (variant.type === 'array' && variant.items && !Array.isArray(variant.items) && '$ref' in variant.items && variant.items.$ref === reference) { array = true; continue; }
		if (variant.type === 'object' && variant.additionalProperties && typeof variant.additionalProperties === 'object'
			&& '$ref' in variant.additionalProperties && variant.additionalProperties.$ref === reference) { object = true; continue; }
		return false;
	}
	return primitiveTypes.size === 0 && array && object;
}
