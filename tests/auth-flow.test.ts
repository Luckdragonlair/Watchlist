import {describe,it,expect} from 'vitest';
import {useSameWindowSignIn,signInErrorMessage} from '../src/auth-flow';
describe('Google sign-in routing',()=>{
  it('uses same-window sign-in on the matching secure hosting origin',()=>expect(useSameWindowSignIn('https://genre-watchlist.firebaseapp.com','genre-watchlist.firebaseapp.com')).toBe(true));
  it.each(['http://localhost:5182','https://genre-watchlist.web.app','http://genre-watchlist.firebaseapp.com','https://genre-watchlist.firebaseapp.com.attacker.invalid'])('does not assume auth-helper storage is same-origin at %s',origin=>expect(useSameWindowSignIn(origin,'genre-watchlist.firebaseapp.com')).toBe(false));
});
describe('sign-in failure feedback',()=>{
  it.each([
    ['auth/popup-blocked','blocked'],['auth/popup-closed-by-user','closed'],
    ['auth/cancelled-popup-request','already open'],['auth/unauthorized-domain','address'],
    ['auth/operation-not-allowed','not enabled'],['auth/network-request-failed','internet'],
    ['auth/web-storage-unsupported','storage'],
  ])('explains %s', (code,text)=>expect(signInErrorMessage({code})).toContain(text));
  it('does not expose arbitrary error text',()=>expect(signInErrorMessage(new Error('private provider response'))).not.toContain('private provider response'));
});
