import {readFileSync} from 'node:fs';
export function sourcePage(bootstrap=''){
 let html=readFileSync('src/Index.html','utf8');
 html=html.replace(/<\?!=\s*include_?\('([^']+)'\);?\s*\?>/g,(_,name)=>readFileSync(`src/${name}.html`,'utf8'));
 return html.replace('<head>',`<head><script>${bootstrap}</script>`);
}
