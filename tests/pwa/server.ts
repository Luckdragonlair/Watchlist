import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
export async function productionServer(){
  const directory=resolve('dist'),overrides=new Map<string,string>();
  const types:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};
  const server=createServer(async(request,response)=>{
    if(request.method!=='GET'){response.writeHead(200,{'Content-Type':'text/plain'});response.end('non-GET reached server');return;}
    const path=new URL(request.url??'/', 'http://localhost').pathname;
    if(path.startsWith('/__/')){response.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});response.end('<h1>Authentication helper fixture</h1>');return;}
    if(path==='/dynamic'){response.writeHead(200,{'Content-Type':'text/plain'});response.end('uncached dynamic response');return;}
    const filename=path==='/'?'/index.html':path;
    const target=resolve(directory,`.${decodeURIComponent(filename)}`);
    if(!target.startsWith(directory+sep)){response.writeHead(403);response.end();return;}
    try{const content=overrides.get(filename)??await readFile(target);response.writeHead(200,{'Content-Type':types[extname(filename)]??'application/octet-stream','Cache-Control':'no-store'});response.end(content);}
    catch{response.writeHead(404);response.end('Not found');}
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();if(!address||typeof address==='string')throw new Error('No local test port');
  let stopped=false;
  return {url:`http://127.0.0.1:${address.port}`,overrides,read:(path:string)=>readFile(resolve(directory,path),'utf8'),stop:async()=>{if(!stopped){stopped=true;server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}}};
}
