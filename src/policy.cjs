function validateMutation({role,accountId,mainId,endpoint,method,body,visibilityAccepted}){
  if(method==='GET')return;
  if(role!=='main'||accountId!==mainId)throw Error('Source account mutations are blocked.');
  if(!['POST','PUT'].includes(method))throw Error('Deletion and unsupported mutations are blocked.');
  if(method==='PUT'&&!endpoint.startsWith('me/library?'))throw Error('Unsupported library mutation.');
  if(method==='POST'&&endpoint!=='me/playlists'&&!/^playlists\/[A-Za-z0-9]+\/items$/.test(endpoint))throw Error('Unsupported playlist mutation.');
  if(method==='POST'&&!visibilityAccepted)throw Error('Playlist visibility consent is required.');
}
function retryDelay(response,data){
  if(data?.error?.reason==='QUOTA_EXCEEDED'){const e=Error('Spotify API quota exceeded. Reset time is unknown; stop and try later.');e.code='QUOTA_EXCEEDED';throw e;}
  const delay=Number(response.headers.get('retry-after')||5);
  if(!Number.isFinite(delay)||delay<0||delay>60)throw Error('Spotify requested a longer pause; resume later.');
  return Math.max(1,delay)*1000;
}
module.exports={validateMutation,retryDelay};
