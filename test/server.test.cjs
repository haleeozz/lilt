const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createRequire}=require('node:module');
test('local server enforces keyed access, origin checks and explicit start without Spotify calls',async()=>{
  const sourcePath=path.resolve(__dirname,'../src/server.cjs'),requireFrom=createRequire(sourcePath),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'lilt-test-'));
  let handler,url,requests=0;const server={on:()=>{},listen:(_port,_host,cb)=>cb()};
  const fakeRequire=name=>name==='node:http'?{createServer:cb=>(handler=cb,server)}:name==='./config.cjs'?{loadConfig:()=>({clientId:'ExampleClient',mainId:'ExampleTarget',sourceIds:['ExampleSource'],port:8889})}:requireFrom(name);
  try{
    const source=fs.readFileSync(sourcePath,'utf8').replace("path.resolve(__dirname,'../data')",()=>JSON.stringify(tmp));
    vm.runInNewContext(source,{require:fakeRequire,__dirname:path.dirname(sourcePath),URL,URLSearchParams,AbortSignal,Buffer,setTimeout:()=>{},process:{exitCode:0},console:{log:s=>url=s.slice(6),error:()=>{}},fetch:async()=>{requests++;throw Error('Network forbidden in test');}});
    const local=new URL(url),key=local.searchParams.get('key');assert.match(key,/^[a-f0-9]{48}$/);
    async function request(route,method='GET',headers={}){let result;await handler({url:route,method,headers:{host:local.host,...headers}},{writeHead:(status,headers)=>result={status,headers},end:body=>result.body=body});return result;}
    assert.equal((await request('/')).status,403);
    const page=await request('/?key='+key);assert.equal(page.status,200);assert.match(page.body,/type="checkbox"/);assert.match(page.body,/herkese açık olabilir/);
    assert.equal((await request('/resume?key='+key,'POST',{origin:'https://other.example'})).status,403);
    assert.equal((await request('/resume?key='+key,'POST',{origin:local.origin})).status,409);
    assert.equal((await request('/callback?state=invalid')).status,400);
    assert.equal((await request('/?key='+key,'GET',{host:'other.example'})).status,403);
    const login=await request('/login?key='+key+'&role=source1'),auth=new URL(login.headers.Location);assert.equal(login.status,303);assert.equal(auth.hostname,'accounts.spotify.com');assert.equal(auth.searchParams.get('code_challenge_method'),'S256');assert.equal(auth.searchParams.get('redirect_uri'),local.origin+'/callback');assert.ok(!auth.searchParams.get('scope').includes('modify'));assert.equal(requests,0);
  }finally{for(const name of fs.readdirSync(tmp))fs.unlinkSync(path.join(tmp,name));fs.rmdirSync(tmp);}
});
