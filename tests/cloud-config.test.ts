import { describe,it,expect } from 'vitest';
import { readCloudConfig } from '../src/cloud-config';
import { WatchlistDB } from '../src/db';
import { configureHostedLibrary,libraryDatabaseName } from '../src/library-scope';
const config={VITE_FIREBASE_API_KEY:'public-web-key',VITE_FIREBASE_AUTH_DOMAIN:'watchlist-test.firebaseapp.com',VITE_FIREBASE_PROJECT_ID:'watchlist-test',VITE_FIREBASE_APP_ID:'1:123:web:test',VITE_FIREBASE_OWNER_UID:'owner_123'};
describe('cloud configuration',()=>{
  it('keeps cloud disabled with no configuration',()=>expect(readCloudConfig({})).toBeNull());
  it('requires a complete configuration rather than a partial live connection',()=>expect(()=>readCloudConfig({VITE_FIREBASE_PROJECT_ID:'watchlist-test'})).toThrow('incomplete'));
  it('rejects placeholders',()=>expect(()=>readCloudConfig({...config,VITE_FIREBASE_OWNER_UID:'REPLACE_OWNER_UID'})).toThrow('incomplete'));
  it('rejects an unrelated auth domain',()=>expect(()=>readCloudConfig({...config,VITE_FIREBASE_AUTH_DOMAIN:'other.firebaseapp.com'})).toThrow('domain'));
  it('accepts public client settings and owner identity',()=>expect(readCloudConfig(config)?.ownerUid).toBe('owner_123'));
  it('allows sign-in setup before the owner UID is known',()=>expect(readCloudConfig({...config,VITE_FIREBASE_OWNER_UID:''})?.ownerUid).toBe(''));
});
describe('local account isolation',()=>{
  it('preserves the existing anonymous library and binds cloud to a different database',()=>{
    expect(libraryDatabaseName()).toBe('watchlist-v01');
    configureHostedLibrary('owner_123');
    expect(libraryDatabaseName()).toBe('watchlist-cloud-v01-owner_123');
    expect(new WatchlistDB().name).toBe('watchlist-cloud-v01-owner_123');
    expect(()=>configureHostedLibrary('other')).toThrow('Reload');
    expect(()=>configureHostedLibrary('')).toThrow('Invalid');
    configureHostedLibrary('owner_123');
  });
});
