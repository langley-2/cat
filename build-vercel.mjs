import './build-standalone.mjs';
import {mkdir,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const output=resolve(import.meta.dirname,'site');
await mkdir(output,{recursive:true});
await copyFile(resolve(import.meta.dirname,'play.html'),resolve(output,'index.html'));
console.log('Created site/index.html for Vercel. All game assets are embedded.');
