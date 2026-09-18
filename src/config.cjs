function loadConfig(env=process.env){
  const clientId=env.SPOTIFY_CLIENT_ID,mainId=env.LILT_MAIN_ID,sourceIds=(env.LILT_SOURCE_IDS||'').split(',').map(s=>s.trim()).filter(Boolean),port=Number(env.LILT_PORT||8889);
  const valid=v=>typeof v==='string'&&/^[A-Za-z0-9]+$/.test(v)&&!v.startsWith('YOUR_');
  if(!valid(clientId)||!valid(mainId)||!sourceIds.length||sourceIds.some(s=>!valid(s)))throw Error('Fill .env with your Spotify client ID and account IDs.');
  if(new Set([mainId,...sourceIds]).size!==sourceIds.length+1)throw Error('Target and source accounts must all be different.');
  if(sourceIds.length>4)throw Error('Use at most four sources per development app.');
  if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Use a port between 1024 and 65535.');
  return{clientId,mainId,sourceIds,port};
}
module.exports={loadConfig};
