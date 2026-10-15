import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=import.meta.dirname;
let html=await readFile(resolve(root,'dist/index.html'),'utf8');
const css=await readFile(resolve(root,'dist/style.css'),'utf8');
const icon=await readFile(resolve(root,'dist/assets/paw.svg'),'utf8');
const files=['game.js','animation.js','audio.js','app.js'];
const scripts=await Promise.all(files.map(file=>readFile(resolve(root,'dist',file),'utf8')));
const code=scripts.map(s=>s.replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'')).join('\n');
html=html.replace('<link rel="stylesheet" href="./style.css">',`<style>${css}</style>`)
  .replace('href="./assets/paw.svg"',`href="data:image/svg+xml,${encodeURIComponent(icon)}"`)
  .replace('<script type="module" src="./app.js"></script>',`<script>\n(()=>{'use strict';\n${code}\n})();\n</script>`);
await writeFile(resolve(root,'play.html'),html);
console.log('Created play.html — a complete offline game; open directly in a browser.');
