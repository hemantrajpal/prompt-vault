import {test} from 'node:test';import assert from 'node:assert/strict';import {publicNames} from './helpers/load-gas.mjs';
test('no raw storage, template, provider or destructive setup helpers are public',()=>{
 const raw=['include','getSpreadsheet','sheetToObjects','debugScriptProps','setupPromptVault','callClaude','sanitizeFileName','getExtension'];
 assert.deepEqual(publicNames().filter(n=>raw.includes(n)),[]);
});
