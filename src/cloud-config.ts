export interface CloudConfig { apiKey:string; authDomain:string; projectId:string; appId:string; ownerUid:string }
export function readCloudConfig(env:Record<string,unknown>):CloudConfig|null {
  const keys=['API_KEY','AUTH_DOMAIN','PROJECT_ID','APP_ID'] as const;
  const values=keys.map(key=>typeof env[`VITE_FIREBASE_${key}`]==='string' ? String(env[`VITE_FIREBASE_${key}`]).trim() : '');
  if(values.every(value=>!value)) return null;
  if(values.some(value=>!value || value.includes('REPLACE_'))) throw new Error('Firebase setup is incomplete. Complete the hosted configuration before building.');
  const [apiKey,authDomain,projectId,appId]=values;
  const ownerUid=typeof env.VITE_FIREBASE_OWNER_UID==='string'?env.VITE_FIREBASE_OWNER_UID.trim():'';
  if(!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId)) throw new Error('Invalid Firebase project ID.');
  if(authDomain!==`${projectId}.firebaseapp.com`) throw new Error('Use the project firebaseapp.com domain for the initial sign-in setup.');
  if(ownerUid.includes('REPLACE_')) throw new Error('Firebase setup is incomplete.');
  if(ownerUid&&!/^[A-Za-z0-9_-]{1,128}$/.test(ownerUid)) throw new Error('Invalid Firebase owner UID.');
  return {apiKey,authDomain,projectId,appId,ownerUid};
}
