const {test}=require('node:test'),assert=require('node:assert/strict');
const {buildPlan,transfer,all}=require('../src/transfer.cjs');
const {loadConfig}=require('../src/config.cjs');
const {validateMutation,retryDelay}=require('../src/policy.cjs');
const track=i=>'spotify:track:T'+i;
function fixture(){
  const wanted=Array.from({length:205},(_,i)=>track(i)),plan={library:{liked:[track(1),track(2)],albums:[],episodes:[],shows:[],audiobooks:[],artists:[]},playlists:[{name:'Example',description:'Synthetic fixture',key:'lilt:SourceA:Original',sourceId:'SourceA',id:'Original',uris:wanted}],followed:[],issues:[]};
  const state=new Map([['transfer-permission.json',{mainId:'TargetA',allowTemporaryPublic:true}]]),rows=[],liked=new Set([track(1)]),writes=[];let created=0,interrupt=true;
  const ctx={mainId:'TargetA',accounts:new Map([['main',{id:'TargetA'}]]),write:(f,d)=>state.set(f,structuredClone(d)),read:f=>state.get(f),setStatus:()=>{},api:async(role,ep,method='GET',body)=>{
    assert.equal(role,'main');if(method!=='GET')writes.push({ep,method});
    if(ep==='me/playlists?limit=50')return{items:created?[{id:'Copy',owner:{id:'TargetA'},description:'[lilt:SourceA:Original]'}]:[],next:null};
    if(ep==='me/tracks?limit=50')return{items:[...liked].map(uri=>({track:{uri}})),next:null};
    if(ep.startsWith('me/library?')){for(const uri of new URLSearchParams(ep.split('?')[1]).get('uris').split(','))liked.add(uri);return{};}
    if(ep==='me/playlists'&&method==='POST'){created++;return{id:'Copy'};}
    if(ep==='playlists/Copy')return{id:'Copy',owner:{id:'TargetA'},description:'[lilt:SourceA:Original]',public:true};
    if(ep.startsWith('playlists/Copy/items?'))return{items:rows.map(uri=>({item:{uri}})),next:null};
    if(ep==='playlists/Copy/items'&&method==='POST'){rows.push(...body.uris);if(interrupt){interrupt=false;throw Error('Response lost after commit');}return{};}
    throw Error('Unexpected request '+ep);
  }};return{ctx,plan,rows,liked,writes,state,get created(){return created;}};
}
test('resume after a committed batch whose response was lost preserves exact order',async()=>{
  const f=fixture();await assert.rejects(transfer(f.ctx,f.plan),/Response lost/);assert.equal(f.rows.length,100);
  const result=await transfer(f.ctx,f.plan);assert.equal(result.complete,true);assert.deepEqual(f.rows,f.plan.playlists[0].uris);assert.equal(f.created,1);assert.equal(f.liked.size,2);
  await transfer(f.ctx,f.plan);assert.equal(f.rows.length,205);assert.equal(f.created,1);assert.ok(f.writes.every(w=>['POST','PUT'].includes(w.method)));
});
test('foreign journal prevents any writes',async()=>{const f=fixture();f.state.set('transfer-journal.json',{mainId:'Wrong',playlists:{}});await assert.rejects(transfer(f.ctx,f.plan),/başka MAIN/);assert.equal(f.writes.length,0);});
test('edited target stops rather than replacing or duplicating tracks',async()=>{const f=fixture();f.rows.push(track(999));await assert.rejects(transfer(f.ctx,f.plan),/içeriği değişmiş/);assert.deepEqual(f.rows,[track(999)]);});
test('unavailable source items are reported and public unreadable lists are saved separately',()=>{const p=buildPlan([{id:'SourceA',name:'Demo',library:{liked:[track(1),track(1)]},errors:{episodes_unavailable:2},playlists:[{id:'Shared',owner:'Other',public:true,error:'403'}]}]);assert.deepEqual(p.library.liked,[track(1)]);assert.equal(p.followed.length,1);assert.equal(p.issues.length,2);});
test('pagination detects totals changed during reading',async()=>{await assert.rejects(all(async()=>({items:[1],total:2,next:null}),'source1','x'),/içerik sayısı değişti/);});
test('configuration rejects overlapping source and target identities',()=>{assert.throws(()=>loadConfig({SPOTIFY_CLIENT_ID:'Demo',LILT_MAIN_ID:'Same',LILT_SOURCE_IDS:'Same'}),/different/);assert.equal(loadConfig({SPOTIFY_CLIENT_ID:'Demo',LILT_MAIN_ID:'Target',LILT_SOURCE_IDS:'Source,Second'}).sourceIds.length,2);});
test('policy blocks source writes, wrong target, deletion and unapproved playlist creation',()=>{
  const args={role:'main',accountId:'Target',mainId:'Target',endpoint:'me/playlists',method:'POST',visibilityAccepted:true};
  for(const change of [{role:'source1'},{accountId:'Wrong'},{method:'DELETE'},{visibilityAccepted:false},{endpoint:'me/player'}])assert.throws(()=>validateMutation({...args,...change}));
  validateMutation(args);validateMutation({...args,endpoint:'playlists/Copy/items'});
});
test('quota is never retried and long rate-limit pauses stop',()=>{
  const r=n=>({headers:{get:()=>n}});assert.throws(()=>retryDelay(r('1'),{error:{reason:'QUOTA_EXCEEDED'}}),/quota exceeded/);assert.throws(()=>retryDelay(r('120'),{}),/longer pause/);assert.equal(retryDelay(r('2'),{}),2000);
});
test('quota during a library check stops the whole transfer instead of trying more endpoints',async()=>{
  const f=fixture(),base=f.ctx.api;let calls=0;f.ctx.api=async(role,ep,...args)=>{calls++;if(ep==='me/tracks?limit=50'){const e=Error('quota');e.code='QUOTA_EXCEEDED';throw e;}return base(role,ep,...args);};
  await assert.rejects(transfer(f.ctx,f.plan),/quota/);assert.equal(calls,2);assert.equal(f.writes.length,0);
});
