import { expectType, expectError, expectAssignable } from 'tsd';
import { safe, isDefinedError } from '@orpc/client';
import { APIClient } from '../built/api.js';

const client = new APIClient({ origin: 'https://example.test', credential: 'token' });
expectType<Promise<null>>(client.request('notes/delete', { noteId: 'note1' }));
expectError(client.request('notes/delete', { noteId: 1 }));
expectError(client.request('notes/delte', { noteId: 'note1' }));
expectAssignable<Promise<void>>(client.orpc.notes.delete({ noteId: 'note1' }));
expectError(client.orpc.notes.delete({ folderId: 'folder1' }));

const info = await client.request('server-info', {});
expectType<string>(info.cpu.model);
expectError(info.secret);
const nativeInfo = await client.orpc.instance.serverInfo({});
expectType<number>(nativeInfo.cpu.cores);

const file = await client.request('drive/files/create', { file: new Blob(['bytes']) });
expectType<string>(file.createdAt);
expectType<null>(file.user);
expectType<null>(file.folder);
expectError(file.path);
expectError(client.request('drive/files/create', { file: '/tmp/file' }));
expectError(client.request('drive/files/create', { file: new Blob(), force: 'true' }));
expectError(client.orpc.drive.files.create({ folderId: 'folder1' }));


const deleted = await safe(client.orpc.notes.delete({ noteId: 'note1' }));
if (deleted.isDefined && deleted.error.code === 'CREDENTIAL_REQUIRED') {
	expectType<string>(deleted.error.data.id);
	expectType<'client' | 'permission' | 'server'>(deleted.error.data.kind);
	expectError(deleted.error.data.path);
}
if (isDefinedError(deleted.error) && deleted.error.code === 'NO_SUCH_NOTE') {
	expectType<string>(deleted.error.data.id);
}
