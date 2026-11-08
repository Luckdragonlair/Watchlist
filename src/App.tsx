import {filedTitle,compareTitles,matchesTitle} from './titles';
import {version} from '../package.json';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, saveBundle, setWatched, onboard, markCaughtUp, deleteShow, initializeCatalog, libraryRevision, assertLibraryRevision, addImportSource } from './db';
import { airTime, bucket, confirmedComplete, episodeLabel, episodeSort, queue, regular, released, weeklyRelease, type Episode, type Show, type Source } from './model';
import { fetchBundle, plainText, searchShows, fetchEpisodeOwner, type Candidate } from './tvmaze';
import { isSilo, prepareSource } from './importer';
import { masterSource } from './master';
import { BackupExport } from './BackupExport';
import { BackupRestore } from './BackupRestore';
import { PwaStatus } from './PwaStatus';
import {MetadataRefresh} from './MetadataRefresh';
import { ShowSetup } from './ShowSetup';
import { loadShowSetup, type SetupSnapshot } from './show-setup';
import {bingePlacement,nextBingeDate,sectionNames,sectionOf,setBingeSection} from './binge';
import type {BingeSection} from './model';

type View = 'Weekly' | 'Binge' | 'Watched' | 'Add Show' | 'Import' | 'Match';
export function App({metadataPaused=false}:{metadataPaused?:boolean}={}) {
  const [view, setView] = useState<View>('Binge');
  const [filter, setFilter] = useState('');
  const [bingeFilter,setBingeFilter]=useState<'Ready'|'Upcoming & TBA'|'Not for me'>('Ready');
  const [detail, setDetail] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [restoring,setRestoring] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [undo, setUndo] = useState<{id: number; watched: boolean} | null>(null);
  const [completion, setCompletion] = useState('');
  const [now, setNow] = useState(new Date());
  const [importTarget, setImportTarget] = useState<{sourceId:string;rowId:string} | null>(null);
  const [matchReturn,setMatchReturn]=useState<View>('Match');
  const [setup,setSetup]=useState<{snapshot:SetupSnapshot;returnTo:View}|null>(null);
  const lastLibrary=useRef<View>('Binge'),listHeading=useRef<HTMLHeadingElement>(null),returning=useRef(false);
  useEffect(()=>{if(['Weekly','Binge','Watched'].includes(view))lastLibrary.current=view;},[view]);
  useEffect(()=>{if(!setup&&returning.current){returning.current=false;listHeading.current?.focus();}},[setup]);
  async function beginSetup(id:number,returnTo:View){setDetail(null);setSetup({snapshot:await loadShowSetup(id),returnTo});}
  function finishSetup(saved:boolean){if(!setup)return;setView(setup.returnTo);setNotice(`${setup.snapshot.name} ${saved?'setup saved':'is in your library; setup skipped'}.`);returning.current=true;setSetup(null);}
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    (async()=>{
      if(import.meta.env.MODE==='hosted') return;
      if((await db.settings.get('catalogInitialized'))?.value===true) return;
      const response=await fetch('/master-working.json');
      if (!response.ok) throw new Error('Master working copy could not be loaded. Your existing library is unchanged.');
      const source = await response.json() as Source;
      if (!Array.isArray(source.rows) || source.rows.some(r => isSilo(r.title))) throw new Error('Invalid master working copy; no catalog was imported.');
      await initializeCatalog(source);
    })().catch(e=>setError(e instanceof Error ? e.message : String(e)));
  }, []);
  const data = useLiveQuery(async () => ({ shows: await db.shows.toArray(), seasons: await db.seasons.toArray(), episodes: await db.episodes.toArray(), progress: await db.progress.toArray(), preferences: await db.preferences.toArray(), sources: await db.sources.toArray(), lifecycles:await db.settings.where('key').startsWith('syncLife:').toArray(),revision:await libraryRevision(),resetRevision:(await db.settings.get('uiResetRevision'))?.value??await libraryRevision() }));
  const seenRevision=useRef<string|null>(null);
  function resetAfterRestore(){setSetup(null);setDetail(null);setUndo(null);setCompletion('');setImportTarget(null);setFilter('');setBingeFilter('Ready');setError('');setNotice('');setView('Binge');}
  useEffect(()=>{
    if(!data) return;
    if(seenRevision.current!==null && seenRevision.current!==String(data.resetRevision)) resetAfterRestore();
    seenRevision.current=String(data.resetRevision);
  },[data?.resetRevision]);
  useEffect(()=>{setUndo(null);setCompletion('');setImportTarget(null);},[data?.revision]);
  async function run(action: () => Promise<void>) {
    if (busy||restoring) return;
    setBusy(true); setError('');
    try { await action(); } catch(e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  }
  async function toggle(e: Episode, watched: boolean) {
    await setWatched(e.id, watched);
    setUndo({id: e.id, watched: !watched});
    if (watched && data) {
      const progress = await db.progress.toArray();
      const season = data.seasons.find(s => s.showId === e.showId && s.number === e.season);
      if (season && confirmedComplete(season, data.episodes.filter(ep => ep.showId === e.showId), progress, now)) {
        const show = data.shows.find(s => s.id === e.showId)!;
        setCompletion(`${show.name}: Season ${e.season} watched. Series status from TVmaze: ${show.status ?? 'Unknown'}.`);
      }
    }
  }
  async function undoLast() { if (undo) {await setWatched(undo.id,undo.watched);setUndo(null);setCompletion('');} }
  async function reorder(id: number, direction: number) {
    if (!data) return;
    const section=sectionOf(data.preferences.find(p=>p.showId===id));
    const ordered = data.shows.filter(s => sectionOf(data.preferences.find(p=>p.showId===s.id))===section&&bucket(data.episodes.filter(e => e.showId === s.id), data.seasons.filter(x => x.showId === s.id), data.progress, now) === 'Binge'&&queue(data.episodes.filter(e=>e.showId===s.id),data.progress,now).available.length>0).sort(byOrder);
    const index = ordered.findIndex(s => s.id === id), target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    await db.transaction('rw', db.preferences,db.settings, async () => {
      await assertLibraryRevision(data.revision);
      for(const s of ordered)if(String((await db.settings.get('syncLife:'+s.id))?.value??'')!==String(data.lifecycles.find(row=>row.key==='syncLife:'+s.id)?.value??''))throw new Error('The show list changed. Reopen it before moving shows.');
      for (const [i, s] of ordered.entries()) await db.preferences.update(s.id, {order: i});
    });
  }
  function byOrder(a: Show, b: Show) { return (data?.preferences.find(p => p.showId === a.id)?.order ?? 0) - (data?.preferences.find(p => p.showId === b.id)?.order ?? 0) || compareTitles(a.name,b.name); }
  async function moveSection(show:Show,section:BingeSection){
    if(!data)return;
    const revision=data.revision,life=String(data.lifecycles.find(row=>row.key==='syncLife:'+show.id)?.value??'');
    await run(async()=>{await setBingeSection(show.id,section,revision,life);setNotice(`${filedTitle(show.name)}: ${sectionNames[section]} saved. `);listHeading.current?.focus();});
  }
  function card(show: Show,index=0,peers:Show[]=[show]) {
    if (!data) return null;
    const episodes = data.episodes.filter(e => e.showId === show.id);
    const q = queue(episodes, data.progress, now);
    const completed = data.seasons.filter(s => s.showId === show.id && confirmedComplete(s, episodes, data.progress, now));
    const genre = show.genres.find(g=>['Science-Fiction','Fantasy','Horror'].includes(g)) ?? show.genres[0] ?? 'Unclassified';
    const total = episodes.filter(regular).length;
    const watched = episodes.filter(e=>regular(e)&&data.progress.some(p=>p.episodeId===e.id)).length;
    const section=sectionOf(data.preferences.find(p=>p.showId===show.id)),date=nextBingeDate(episodes,now);
    return <article key={show.id} aria-label={filedTitle(show.name)} className={`show-card genre-${genre.toLowerCase().replace(/[^a-z]/g,'')}`}>
      <div className="show-art" aria-hidden="true"><span>{filedTitle(show.name).slice(0,1)}</span></div>
      <div className="show-identity"><div className="show-meta"><span className="genre-tag">{genre}</span><span>{show.service ?? 'Service unknown'}</span></div><h3><button className="show-title" onClick={() => setDetail(show.id)}>{filedTitle(show.name)}</button></h3><span className="show-status">{show.status ?? 'Status unknown'}</span></div>
      <div className="show-next">{section==='not-for-me'&&view==='Binge'?<p>Hidden from active watch lists. History is kept.</p>:q.next ? <label key={q.next.id} className="episode-action"><input type="checkbox" aria-label={`Watch ${show.name} ${episodeLabel(q.next)}`} disabled={busy} checked={false} onChange={() => run(() => toggle(q.next!, true))}/><span>Mark <strong>S{q.next.season} E{q.next.number}</strong> watched<span className="episode-name">{q.next.name}</span></span></label> : <p>{date ? date.stamp?`Next confirmed airing: ${airTime(date.stamp)}`:`Next confirmed date: ${date.date} · Time unknown` : 'No confirmed next release.'}</p>}</div>
      <div className="show-progress"><span>{watched} of {total} watched</span><progress aria-label={`${show.name} watched episodes`} value={watched} max={Math.max(1,total)}/><p className="queue-count">{q.available.length} available unwatched · {q.upcoming.length} upcoming · {q.unknown.length} with unknown availability</p>{!!completed.length && <p>Watched seasons: {completed.map(s => s.number).join(', ')}</p>}</div>
      {view === 'Binge' && bingeFilter==='Ready'&&['watching-now','watch-soon'].includes(section)&&<div className="reorder-controls"><button disabled={busy||index===0} aria-label={`Move ${show.name} up`} onClick={() => run(() => reorder(show.id, -1))}>↑</button><button disabled={busy||index===peers.length-1} aria-label={`Move ${show.name} down`} onClick={() => run(() => reorder(show.id, 1))}>↓</button></div>}
      {view==='Binge'&&<details className="show-actions"><summary aria-label={`Manage ${filedTitle(show.name)}`}>Manage</summary><div>{(Object.keys(sectionNames) as BingeSection[]).filter(value=>value!==section).map(value=><button key={value} disabled={busy} onClick={()=>void moveSection(show,value)}>{value==='not-for-me'?'Not for me':`Move to ${sectionNames[value]}`}</button>)}</div></details>}
    </article>;
  }
  let content: ReactNode;
  if (!data) content = <p>Loading local library…</p>;
  else if (view === 'Add Show') content = <AddShow run={run} busy={busy} onAdded={id => beginSetup(id,lastLibrary.current)}/ >;
  else if (view === 'Import'||view==='Match') content = <ImportPanel mode={view==='Match'?'match':'import'} sources={data.sources} run={run} busy={busy} initialTarget={importTarget} onQueue={()=>{setMatchReturn('Match');setView('Match');}} onMatched={id=>beginSetup(id,matchReturn)}/>;
  else {
    const showBucket=(s:Show)=>bucket(data.episodes.filter(e=>e.showId===s.id),data.seasons.filter(x=>x.showId===s.id),data.progress,now);
    const preference=(s:Show)=>sectionOf(data.preferences.find(p=>p.showId===s.id));
    const searched=data.shows.filter(s=>matchesTitle(s.name,filter));
    const visible=searched.filter(s=>(view!=='Weekly'||preference(s)!=='not-for-me')&&(showBucket(s)===view||(view==='Watched'&&data.progress.some(p=>data.episodes.some(e=>e.id===p.episodeId&&e.showId===s.id))))).sort(view==='Watched'?(a,b)=>compareTitles(a.name,b.name):byOrder);
    if(view==='Weekly'){
      const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
      content=<>{days.map(day=>{
        const shows=visible.filter(s=>{const next=weeklyRelease(data.episodes.filter(e=>e.showId===s.id),data.progress,now);return next&&new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',weekday:'long'}).format(new Date(next.airstamp!))===day;});
        return shows.length?<section key={day}><h2>{day}</h2>{shows.map(card)}</section>:null;
      })}{!visible.length&&<p>No confirmed upcoming releases. Try Binge or add a show.</p>}</>;
    }else if(view==='Binge'){
      const placement=(s:Show)=>bingePlacement(data.episodes.filter(e=>e.showId===s.id),data.seasons.filter(season=>season.showId===s.id),data.progress,data.preferences.find(p=>p.showId===s.id),now);
      const ready=searched.filter(s=>['Watching now','Watch soon','Everything else'].includes(placement(s)??''));
      const waiting=searched.filter(s=>['Upcoming','TBA'].includes(placement(s)??''));
      const date=(s:Show)=>nextBingeDate(data.episodes.filter(e=>e.showId===s.id),now);
      const group=(label:string,shows:Show[])=><section key={label} className="binge-section" aria-label={label}><h3 className="binge-heading">{label}<span>{shows.length} shows</span></h3>{shows.map(card)}{!shows.length&&<p>No shows here yet.</p>}</section>;
      content=<><div className="binge-filters" role="group" aria-label="Binge filters">{(['Ready','Upcoming & TBA','Not for me'] as const).map(value=><button key={value} aria-pressed={bingeFilter===value} onClick={()=>setBingeFilter(value)}>{value}</button>)}</div>
        {bingeFilter==='Ready'?(['watching-now','watch-soon','everything-else'] as const).map(section=>group(sectionNames[section],ready.filter(s=>preference(s)===section).sort(section==='everything-else'?(a,b)=>compareTitles(a.name,b.name):byOrder))):bingeFilter==='Upcoming & TBA'?<>{group('Upcoming',waiting.filter(s=>date(s)).sort((a,b)=>date(a)!.date.localeCompare(date(b)!.date)||compareTitles(a.name,b.name)))}{group('TBA',waiting.filter(s=>!date(s)).sort((a,b)=>compareTitles(a.name,b.name)))}</>:group('Not for me',searched.filter(s=>preference(s)==='not-for-me').sort((a,b)=>compareTitles(a.name,b.name)))}</>;
    }else content=<>{visible.map(card)}{!visible.length&&<p>No episode history yet. Unmatched shows are in Match.</p>}</>;
  }
  return <main className="watchlist-app">
    <header className="app-header"><div className="brand"><span className="brand-mark" aria-hidden="true">W</span><h1>Watchlist <small>v{version}</small></h1></div>
    <div className="top-controls"><nav aria-label="Views">{(['Weekly','Binge','Watched','Add Show','Import','Match'] as View[]).map(v => <button key={v} className={(v==='Import'||v==='Match')?'import-nav':undefined} aria-current={view === v ? 'page' : undefined} onClick={() => {setView(v); setDetail(null); if(v==='Import'||v==='Match'){setMatchReturn('Match');setImportTarget(null);}}}><span className="nav-symbol" aria-hidden="true">{({Weekly:'▦',Binge:'▷',Watched:'✓','Add Show':'+',Import:'↓',Match:'⌕'})[v]}</span>{v}</button>)}</nav><div className="backup-controls"><BackupExport disabled={busy||restoring||!data}/><BackupRestore disabled={busy||!data} onBusyChange={setRestoring} onRestored={resetAfterRestore}/></div></div></header>
    <p className="library-context">Your library <span aria-hidden="true">/</span> Release times in America/Chicago</p>
    <button className="mobile-import" onClick={()=>{setMatchReturn('Match');setView('Import');setDetail(null);setImportTarget(null);}}>Import</button>
    <button className="mobile-import" onClick={()=>{setMatchReturn('Match');setView('Match');setDetail(null);}}>Match</button>
    <PwaStatus/>{error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {busy && <p role="status">Saving or fetching…</p>}
    {undo && !completion && <button disabled={busy} onClick={() => run(undoLast)}>Undo last episode change</button>}
    {detail !== null && data ? <Detail section={sectionOf(data.preferences.find(p=>p.showId===detail))} onSection={section=>moveSection(data.shows.find(s=>s.id===detail)!,section)} show={data.shows.find(s => s.id === detail)!} episodes={data.episodes.filter(e => e.showId === detail)} watched={new Set(data.progress.map(p => p.episodeId))} notes={data.preferences.find(p => p.showId === detail)?.notes ?? ''} now={now} busy={busy} run={run} toggle={toggle} onDelete={async () => { const show=data.shows.find(s=>s.id===detail); if (!show || !window.confirm(`Delete ${show.name}? This permanently removes its seasons, episodes, watched history, personal notes, order, and matching import entries from this library. Original files and existing backup files stay unchanged.`)) return; await run(async()=>{await deleteShow(show.id,db,fetchEpisodeOwner);setDetail(null);setImportTarget(null);setUndo(null);setCompletion('');setView('Binge');setNotice(`${show.name} was deleted from your library.`);}); }} onBack={() => setDetail(null)}/> : <><h2 ref={listHeading} tabIndex={-1}>{view}</h2>{['Weekly','Binge','Watched'].includes(view) && <label>Search library <input value={filter} onChange={e => setFilter(e.target.value)}/></label>}{content}</>}
    {completion && <div role="dialog" aria-modal="true" aria-label="Season complete"><p>{completion}</p><p>Your progress is saved. More metadata may be announced later.</p><button className="circle" aria-label="Dismiss completion" onClick={() => setCompletion('')}>×</button>{undo && <button disabled={busy} onClick={() => run(undoLast)}>Undo last episode change</button>}</div>}
    {setup&&<ShowSetup snapshot={setup.snapshot} returnTo={setup.returnTo} busy={busy||restoring} onDone={finishSetup}/>}
    <MetadataRefresh paused={metadataPaused||busy||restoring||!!setup}/><footer><p>Episode metadata: <a href="https://www.tvmaze.com/" target="_blank" rel="noreferrer">TVmaze</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Cached locally; checked automatically while open and online. Availability can vary by region.</p></footer>
  </main>;
}

type Run = (action: () => Promise<void>) => Promise<void>;
function AddShow({run, busy, onAdded, initial = '', onSelect}: {run: Run; busy: boolean; onAdded: (id:number) => void | Promise<void>; initial?: string; onSelect?: (candidate: Candidate) => Promise<void>}) {
  const [query, setQuery] = useState(initial), [results, setResults] = useState<Candidate[]>([]), [searched, setSearched] = useState(false);
  return <section><form onSubmit={e => { e.preventDefault(); run(async () => {setResults([]); setSearched(false); setResults(await searchShows(query)); setSearched(true);}); }}><label>Show title <input required value={query} onChange={e => setQuery(e.target.value)}/></label><button disabled={busy || !query.trim()}>Search TVmaze</button></form>
    {searched && !results.length && <p>No matches. Try another title.</p>}
    {results.map(c => <article key={c.id}><h3>{c.name}</h3><p>{c.premiered ?? 'Premiere unknown'} · {c.language ?? 'Language unknown'} · {c.webChannel?.name ?? c.network?.name ?? 'Service unknown'}</p><p>{plainText(c.summary)}</p><a href={c.url} target="_blank" rel="noreferrer">TVmaze details</a> <button disabled={busy} onClick={() => run(async () => { if (onSelect) await onSelect(c); else {const revision=await libraryRevision();await saveBundle(await fetchBundle(c.id),db,false,revision); await onAdded(c.id);} })}>Import {c.name} (#{c.id})</button></article>)}
  </section>;
}
function Detail({section,onSection,show, episodes, watched, notes, now, busy, run, toggle, onDelete, onBack}: {section:BingeSection;onSection:(section:BingeSection)=>Promise<void>;show:Show; episodes:Episode[]; watched:Set<number>; notes:string; now:Date; busy:boolean; run:Run; toggle:(e:Episode,w:boolean)=>Promise<void>; onDelete:()=>Promise<void>; onBack:()=>void}) {
  const [current, setCurrent] = useState('');
  const [draftNotes, setDraftNotes] = useState(notes);
  const notesBaseline=useRef(notes);
  const [newerNotes,setNewerNotes]=useState(false),[replaceNewerNotes,setReplaceNewerNotes]=useState(false);
  useEffect(()=>{
    if(draftNotes===notesBaseline.current){setDraftNotes(notes);notesBaseline.current=notes;setNewerNotes(false);}
    else setNewerNotes(notes!==notesBaseline.current);
    setReplaceNewerNotes(false);
  },[notes]);
  if (!show) return null;
  const ordered = episodes.filter(regular).sort(episodeSort);
  return <section><button className="circle" aria-label="Back to library" onClick={onBack}>↶</button><h2>{show.name}</h2><p>{plainText(show.summary)}</p><p>{show.genres.join(', ') || 'Genres unknown'} · {show.service ?? 'Service unknown'} · {show.status ?? 'Status unknown'}</p><p>Last refresh: {new Date(show.syncedAt).toLocaleString()}</p><button disabled={busy} onClick={() => run(async () => {const revision=await libraryRevision();await saveBundle(await fetchBundle(show.id),db,true,revision);})}>Refresh metadata</button><button className="danger" disabled={busy} onClick={onDelete}>Delete show</button>
    <label>Personal notes <textarea value={draftNotes} onChange={e => setDraftNotes(e.target.value)}/></label>
    {newerNotes&&<div role="status"><p>Notes changed on another device. Your draft is still here.</p><p>Latest saved notes: {notes||'(empty)'}</p><label><input type="checkbox" checked={replaceNewerNotes} onChange={event=>setReplaceNewerNotes(event.target.checked)}/>Replace the newer saved notes with my draft.</label><button onClick={()=>{setDraftNotes(notes);notesBaseline.current=notes;setNewerNotes(false);setReplaceNewerNotes(false);}}>Discard draft and load latest notes</button></div>}
    <button disabled={busy||(newerNotes&&!replaceNewerNotes)} onClick={() => run(async () => {
      const expected=replaceNewerNotes?notes:notesBaseline.current;
      await db.transaction('rw',db.preferences,async()=>{
        const latest=await db.preferences.get(show.id);
        if(!latest)throw new Error('This show was removed. Copy your draft before leaving this screen.');
        if(latest.notes!==expected)throw new Error('The saved notes changed again. Your draft is kept; review the latest notes before saving.');
        await db.preferences.update(show.id,{notes:draftNotes});
      });
      notesBaseline.current=draftNotes;setNewerNotes(false);setReplaceNewerNotes(false);
    })}>Save notes</button>
    <label>Watch list section <select value={section} disabled={busy} onChange={event=>void onSection(event.target.value as BingeSection)}>{(Object.keys(sectionNames) as BingeSection[]).map(value=><option key={value} value={value}>{sectionNames[value]}</option>)}</select></label>
    <fieldset><legend>Already watching? Choose the current episode</legend><p>{current === 'caught-up' ? 'Marks all released regular episodes watched. Future, special and unknown-release episodes stay unchanged. The show stays tracked; new releases return to your watch queue.' : 'Explicitly mark released episodes before this one watched. The selected episode stays unchanged.'}</p><label>Current episode <select value={current} onChange={e => setCurrent(e.target.value)}><option value="">Choose episode</option><option value="caught-up">Caught up—all aired episodes watched</option>{ordered.map(e => <option key={e.id} value={e.id}>{episodeLabel(e)}</option>)}</select></label><button disabled={busy || !current} onClick={() => run(() => current === 'caught-up' ? markCaughtUp(show.id, now) : onboard(show.id, Number(current), now))}>{current === 'caught-up' ? 'Mark all aired episodes watched' : 'Mark earlier released episodes watched'}</button></fieldset>
    {Array.from(new Set(ordered.map(e => e.season))).map(season => <section key={season}><h3>Season {season}</h3>{ordered.filter(e => e.season === season).map(e => <div className="episode" key={e.id}><label><input type="checkbox" checked={watched.has(e.id)} disabled={busy || (!watched.has(e.id) && !released(e,now))} onChange={event => run(() => toggle(e,event.target.checked))}/>{episodeLabel(e)}</label><small>{e.airstamp ? airTime(e.airstamp) : e.airdate ? `${e.airdate} · Time unknown` : 'Release unknown'}</small><p>{plainText(e.summary)}</p></div>)}</section>)}
  </section>;
}
function ImportPanel({sources,run,busy,initialTarget,onMatched,mode,onQueue}: {sources:Source[];run:Run;busy:boolean;initialTarget:{sourceId:string;rowId:string}|null;onMatched:(id:number)=>Promise<void>;mode:'import'|'match';onQueue:()=>void}) {
  const [selected, setSelected] = useState<{sourceId:string; rowId:string} | null>(initialTarget);
  const [filter,setFilter] = useState('');
  const [confirmSeasonlessWatched,setConfirmSeasonlessWatched] = useState(false);
  useEffect(()=>{if(mode==='import')setSelected(null);},[mode]);
  const selectedSource = sources.find(s => s.id === selected?.sourceId);
  const row = selectedSource?.rows.find(r => r.id === selected?.rowId);
  const seasonlessWatched = !!row && !!selectedSource?.rows.some(r=>r.title===row.title && r.sourceCategory==='Watched' && r.season===undefined && r.state==='pending');
  return <section>{mode==='import'?<><p>{import.meta.env.MODE==='hosted'?'Add a working list from a file or a restored backup. Bulk matching keeps Silo held out.':'The original master has been imported as a separate working catalog, excluding Silo.'} Select a TVmaze candidate to link its episodes. Source schedules and renewal claims remain unverified.</p><p>Additional working lists can be one title per line (.txt), or JSON arrays of titles / &#123;title, notes&#125; rows. Original uploaded text is retained locally.</p>
    <label>Working list file <input type="file" accept=".txt,.json" disabled={busy} onChange={event => {const file = event.target.files?.[0]; if (file) run(async () => {if (file.size > 5_000_000) throw new Error('Please use a file smaller than 5 MB.'); const revision=await libraryRevision(); const raw=await file.text(); const source = /^WEEKLY\s*$/m.test(raw) && /^WATCHED\s*$/m.test(raw) ? {...masterSource(raw,crypto.randomUUID()),raw} : prepareSource(file.name,raw); await addImportSource(source,revision);}); event.target.value='';}}/></label>
    <button onClick={onQueue}>Review unmatched shows</button></>:<p>Only unmatched source entries are shown here. Choose a TVmaze candidate explicitly; matching links the pending installments of that title. Uncertain titles and missing seasons stay available for review.</p>}
    {mode==='match'&&<label>Filter source entries <input value={filter} onChange={e=>setFilter(e.target.value)}/></label>}
    {mode==='import'&&sources.map(source=><p key={source.id}>{source.name}: {source.rows.length} installments retained · {source.rows.filter(r=>r.state==='pending'||r.state==='review').length} unmatched.</p>)}
    {mode==='match'&&!row&&sources.map(source=>{
      const rows=source.rows.filter(r=>(r.state==='pending'||r.state==='review')&&matchesTitle(r.title,filter)).sort((a,b)=>compareTitles(a.rawTitle??a.title,b.rawTitle??b.title));
      return rows.length?<article key={source.id}><h3>{source.name}</h3><p>{rows.length} unmatched installments</p>{rows.map(r=><div key={r.id}><span>{r.rawTitle??r.title} · {r.state}</span> {r.state==='pending'&&<button disabled={busy} onClick={()=>setSelected({sourceId:source.id,rowId:r.id})}>Find match for {r.rawTitle??r.title}</button>}{r.state==='review'&&<small> Needs manual identification; not imported.</small>}</div>)}</article>:null;
    })}
    {mode==='match'&&!row&&!sources.some(source=>source.rows.some(r=>(r.state==='pending'||r.state==='review')&&matchesTitle(r.title,filter)))&&<p>No unmatched entries match this filter. Add a working list in Import if needed.</p>}
    {row && selectedSource && <div><h3>Choose a match for {row.title}</h3><p>Selecting Import links all source installments of this title. Released episodes in source seasons marked Watched will be marked watched; other seasons stay unchanged.</p>{seasonlessWatched && <label><input type="checkbox" checked={confirmSeasonlessWatched} onChange={e=>setConfirmSeasonlessWatched(e.target.checked)}/>This source marks the whole title Watched without a season. Apply that to every released regular episode of the selected show.</label>}<button onClick={() => {setSelected(null);setConfirmSeasonlessWatched(false);}}>Cancel matching</button><AddShow key={`${selectedSource.id}-${row.id}`} initial={row.title} busy={busy} run={run} onAdded={()=>{}} onSelect={async c => {
      if (seasonlessWatched && !confirmSeasonlessWatched) throw new Error('Confirm the scope of this seasonless Watched source entry before importing it.');
      if (isSilo(row.title) || isSilo(c.name)) throw new Error('Silo is held out from bulk import. Use manual Add Show later.');
      const revision=await libraryRevision();
      const bundle = await fetchBundle(c.id);
      if (isSilo(bundle.show.name)) throw new Error('Silo is held out from bulk import.');
      await db.transaction('rw', [db.shows,db.seasons,db.episodes,db.preferences,db.sources,db.progress,db.settings], async () => {
        await assertLibraryRevision(revision);
        const latest = await db.sources.get(selectedSource.id);
        if (!latest || !latest.rows.some(r=>r.id===row.id && r.state==='pending')) throw new Error('This source entry changed or was removed. Please select it again.');
        await saveBundle(bundle);
        const linked=latest.rows.filter(r=>r.title===row.title && r.state==='pending');
        const watchedSeasons=new Set(linked.filter(r=>r.sourceCategory==='Watched' && r.season !== undefined).map(r=>r.season));
        for (const e of bundle.episodes.filter(e=>regular(e)&&released(e,new Date())&&(watchedSeasons.has(e.season)||(seasonlessWatched&&confirmSeasonlessWatched)))) if (!await db.progress.get(e.id)) await setWatched(e.id,true);
        const preference=await db.preferences.get(c.id);
        if (preference) await db.preferences.update(c.id,{notes:[preference.notes,...linked.map(r=>`Source: ${r.rawTitle ?? r.title}; ${r.sourceCategory ?? 'Unclassified'}${r.sourceStatus?`; ${r.sourceStatus} (unverified)`:''}${r.notes?`; ${r.notes}`:''}`)].filter(Boolean).join('\n')});
        await db.sources.put({...latest,rows:latest.rows.map(r=>linked.some(l=>l.id===r.id)?{...r,state:'imported',showId:c.id}:r)});
      });
      setSelected(null);
      setConfirmSeasonlessWatched(false);
      await onMatched(c.id);
    }}/></div>}
  </section>;
}
