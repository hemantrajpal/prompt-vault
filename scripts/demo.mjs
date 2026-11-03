import http from 'node:http';
import {readFileSync} from 'node:fs';
import {sourcePage} from '../tests/owner-edition/fixtures/render-page.mjs';
import {initialized,success,category} from '../tests/owner-edition/helpers/fake-sheets.mjs';
import {publicNames} from '../tests/owner-edition/helpers/load-gas.mjs';
const {g}=initialized(),cat=category(g,'Website delivery');
const pack=JSON.parse(readFileSync('content/packs/website.json','utf8'));
for(const [i,w] of pack.workflows.entries())success(g.savePromptV2({operationId:'demo-'+i,expectedRevision:0,record:{...w,categoryId:cat.id}}));
const allowed=new Set(publicNames());
const port=Number(process.env.PORT||4322);
http.createServer(async(req,res)=>{
 if(req.method==='GET'&&req.url==='/'){
  let html=sourcePage(`window.vaultTransport=async(method,payload)=>{const r=await fetch('/rpc',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({method,payload})});return r.json();};`);
  html=html.replace('<body>','<body><div class="demo-notice">Demo · synthetic data · changes stay in local server memory · no Google or AI calls</div><style>.demo-notice{position:fixed;top:0;left:0;width:100%;z-index:50;background:#f5a623;color:#121212;padding:10px 16px;font:13px/1.5 sans-serif}#shell{margin-top:40px;height:calc(100dvh - 40px)}</style>');
  res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);return;
 }
 if(req.method==='POST'&&req.url==='/rpc'){
  if(req.headers.origin&&req.headers.origin!==`http://127.0.0.1:${port}`&&req.headers.origin!==`http://localhost:${port}`){res.writeHead(403);res.end();return;}
  try{let body='';for await(const part of req){body+=part;if(Buffer.byteLength(body)>6*1024*1024)throw Error('Large request');}const {method,payload}=JSON.parse(body);if(!allowed.has(method))throw Error('Unknown method');const result=g[method](payload);res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(result));}catch(_){res.writeHead(400,{'content-type':'application/json'});res.end(JSON.stringify({ok:false,error:{code:'VALIDATION',message:'Invalid demo request.'}}));}return;
 }
 res.writeHead(404);res.end('Not found');
}).listen(port,'127.0.0.1',()=>console.log(`Canonical-source local demo: http://127.0.0.1:${port}/ (memory only)`));
