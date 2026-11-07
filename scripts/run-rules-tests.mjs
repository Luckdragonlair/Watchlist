import { spawnSync } from 'node:child_process';
import { existsSync,readdirSync } from 'node:fs';
import { resolve,join,delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const portableRoot=resolve(root,'.tools/java21');
const portableJava=existsSync(portableRoot)?readdirSync(portableRoot).map(name=>join(portableRoot,name,'bin')).find(dir=>existsSync(join(dir,'java.exe'))):undefined;
const env={...process.env,PATH:portableJava?`${portableJava}${delimiter}${process.env.PATH??''}`:process.env.PATH,
  FIREBASE_CLI_DISABLE_UPDATE_CHECK:'true',FIREBASE_EMULATORS_PATH:resolve(root,'.tools/firebase-emulators'),
  GCLOUD_PROJECT:'demo-watchlist-rules',GOOGLE_CLOUD_PROJECT:'demo-watchlist-rules'};
if(spawnSync('java',['-version'],{env,stdio:'ignore'}).status!==0){console.error('Local rules tests need Java. Run powershell -File scripts/setup-rules-java.ps1, then retry.');process.exit(1);}
const result=spawnSync(process.execPath,[resolve(root,'node_modules/firebase-tools/lib/bin/firebase.js'),'emulators:exec','--only','firestore','--project','demo-watchlist-rules','--config','firebase.rules-test.json','--non-interactive','node --test --test-concurrency=1 tests/rules/access.test.mjs tests/rules/sync.test.mjs && node node_modules/vitest/vitest.mjs run --config vitest.sync.config.ts'],{cwd:root,env,stdio:'inherit'});
process.exit(result.status??1);
