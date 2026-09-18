const {buildPlan}=require('./src/transfer.cjs');
const sample=(id,liked,items)=>({id,name:id,library:{liked},errors:{},playlists:[{id:'List'+id,name:'Example playlist',owner:id,uris:items,description:'Synthetic demo'}]});
const plan=buildPlan([sample('DemoSourceA',['spotify:track:ExampleA'],['spotify:track:ExampleA','spotify:track:ExampleB']),sample('DemoSourceB',['spotify:track:ExampleA','spotify:track:ExampleB'],['spotify:track:ExampleB'])]);
console.log(JSON.stringify({mode:'Offline planning demo — no Spotify requests or account changes',uniqueLiked:plan.library.liked.length,playlistCopies:plan.playlists.length,issues:plan.issues},null,2));
