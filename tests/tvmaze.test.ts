import { afterEach, expect, it, vi } from 'vitest';
import { fetchBundle, searchShows, fetchEpisodeOwner } from '../src/tvmaze';
afterEach(()=>vi.unstubAllGlobals());
it('presents fuzzy candidates without choosing one silently',async()=>{
  const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>[{show:{id:1,name:'Test'}},{show:{id:2,name:'Test'}}]}); vi.stubGlobal('fetch',fetcher);
  expect(await searchShows('Test & more')).toHaveLength(2); expect(fetcher.mock.calls[0][0]).toContain('Test%20%26%20more');
});
it('fetches independent show, season, and episode records without inventing unknown fields',async()=>{
  const payloads=[{id:10,name:'Test',summary:null,status:null,genres:[],url:'https://www.tvmaze.com/shows/10'},[{id:20,number:1,episodeOrder:null,endDate:null}],[{id:1,season:1,number:1,name:'Pilot',summary:null,airstamp:null,airdate:null,type:'regular'}]];
  vi.stubGlobal('fetch',vi.fn().mockImplementation(async()=>({ok:true,json:async()=>payloads.shift()})));
  const b=await fetchBundle(10); expect(b.show.service).toBeNull(); expect(b.episodes[0].airstamp).toBeNull(); expect(b.seasons[0].episodeOrder).toBeNull(); expect(b.episodes[0].showId).toBe(10);
});
it('handles rate limits without pretending an empty import succeeded',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:429})); await expect(fetchBundle(10)).rejects.toThrow('TVmaze is busy');
});
it('recovers a legacy episode owner from the provider link without following arbitrary URLs',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({_links:{show:{href:'https://api.tvmaze.com/shows/10'}}})}));
  expect(await fetchEpisodeOwner(99)).toBe(10);
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({_links:{show:{href:'https://example.com/shows/10'}}})}));
  await expect(fetchEpisodeOwner(99)).rejects.toThrow('did not identify');
});
