import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, saveBundle, setWatched, onboard, deleteShow, initializeCatalog, libraryRevision, assertLibraryRevision, addImportSource } from './db';
import { airTime, bucket, confirmedComplete, episodeLabel, episodeSort, queue, regular, released, weeklyRelease, type Episode, type Show, type Source } from './model';
import { fetchBundle, plainText, searchShows, fetchEpisodeOwner, type Candidate } from './tvmaze';
import { isSilo, prepareSource } from './importer';
import { masterSource } from './master';
import { BackupExport } from './BackupExport';
import { BackupRestore } from './BackupRestore';

type View = 'Weekly' | 'Binge' | 'Watched' | 'Add Show' | 'Import';
export function App() {
  const [view, setView] = useState<View>('Binge');
  const [filter, setFilter] = useState('');
  const [detail, setDetail] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [restoring,setRestoring] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [undo, setUndo] = useState<{id: number; watched: boolean} | null>(null);
  const [completion, setCompletion] = useState('');
  const [now, setNow] = useState(new Date());
  const [importTarget, setImportTarget] = useState<{sourceId:string;rowId:string} | null>(null);
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    (async()=>{
      if((await db.settings.get('catalogInitialized'))?.value===true) return;
      const response=await fetch('/master-working.json');
      if (!response.ok) throw new Error('Master working copy could not be loaded. Your existing library is unchanged.');
      const source = await response.json() as Source;
      if (!Array.isArray(source.rows) || source.rows.some(r => isSilo(r.title))) throw new Error('Invalid master working copy; no catalog was imported.');
      await initializeCatalog(source);
    })().catch(e=>setError(e instanceof Error ? e.message : String(e)));
  }, []);
  const data = useLiveQuery(async () => ({ shows: await db.shows.toArray(), seasons: await db.seasons.toArray(), episodes: await db.episodes.toArray(), progress: await db.progress.toArray(), preferences: await db.preferences.toArray(), sources: await db.sources.toArray(), revision:await libraryRevision() }));
  const seenRevision=useRef<string|null>(null);
  function resetAfterRestore(){setDetail(null);setUndo(null);setCompletion('');setImportTarget(null);setFilter('');setError('');setNotice('');setView('Binge');}
  useEffect(()=>{
    if(!data) return;
    if(seenRevision.current!==null && seenRevision.current!==data.revision) resetAfterRestore();
    seenRevision.current=data.revision;
  },[data?.revision]);
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
    const ordered = data.shows.filter(s => bucket(data.episodes.filter(e => e.showId === s.id), data.seasons.filter(x => x.showId === s.id), data.progress, now) === 'Binge').sort(byOrder);
    const index = ordered.findIndex(s => s.id === id), target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    await db.transaction('rw', db.preferences, async () => { for (const [i, s] of ordered.entries()) await db.preferences.update(s.id, {order: i}); });
  }
  function byOrder(a: Show, b: Show) { return (data?.preferences.find(p => p.showId === a.id)?.order ?? 0) - (data?.preferences.find(p => p.showId === b.id)?.order ?? 0) || a.name.localeCompare(b.name); }
  function card(show: Show) {
    if (!data) return null;
    const episodes = data.episodes.filter(e => e.showId === show.id);
    const q = queue(episodes, data.progress, now);
    const completed = data.seasons.filter(s => s.showId === show.id && confirmedComplete(s, episodes, data.progress, now));
    return <article key={show.id} aria-label={show.name}>
      <h3><button onClick={() => setDetail(show.id)}>{show.name}</button></h3>
      <p>{show.service ?? 'Service unknown'} · {show.status ?? 'Status unknown'}</p>
      {q.next ? <label key={q.next.id}><input type="checkbox" aria-label={`Watch ${show.name} ${episodeLabel(q.next)}`} disabled={busy} checked={false} onChange={() => run(() => toggle(q.next!, true))}/>{episodeLabel(q.next)}</label> : <p>{q.upcoming[0] ? `Next confirmed airing: ${airTime(q.upcoming[0].airstamp!)}` : 'No confirmed next release.'}</p>}
      <p>{q.available.length} available unwatched · {q.upcoming.length} upcoming · {q.unknown.length} with unknown availability</p>
      {!!completed.length && <p>Watched seasons: {completed.map(s => s.number).join(', ')}</p>}
      {view === 'Binge' && <div><button disabled={busy} aria-label={`Move ${show.name} up`} onClick={() => run(() => reorder(show.id, -1))}>↑</button><button disabled={busy} aria-label={`Move ${show.name} down`} onClick={() => run(() => reorder(show.id, 1))}>↓</button></div>}
    </article>;
  }
  let content: ReactNode;
  if (!data) content = <p>Loading local library…</p>;
  else if (view === 'Add Show') content = <AddShow run={run} busy={busy} onAdded={id => { setDetail(id); setView('Binge'); }}/ >;
  else if (view === 'Import') content = <ImportPanel sources={data.sources} run={run} busy={busy} initialTarget={importTarget}/>;
  else {
    const visible = data.shows.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()) && (bucket(data.episodes.filter(e => e.showId === s.id), data.seasons.filter(x => x.showId === s.id), data.progress, now) === view || (view === 'Watched' && data.progress.some(p => data.episodes.some(e => e.id === p.episodeId && e.showId === s.id))))).sort(view === 'Watched' ? (a,b) => a.name.localeCompare(b.name) : byOrder);
    if (view === 'Weekly') {
      const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
      content = <>{days.map(day => {
        const shows = visible.filter(s => { const next = weeklyRelease(data.episodes.filter(e => e.showId === s.id), data.progress, now); return next && new Intl.DateTimeFormat('en-US', {timeZone:'America/Chicago', weekday:'long'}).format(new Date(next.airstamp!)) === day; });
        return shows.length ? <section key={day}><h2>{day}</h2>{shows.map(card)}</section> : null;
      })}{!visible.length && <p>No confirmed upcoming releases. Try Binge or add a show.</p>}</>;
    } else content = <>{visible.map(card)}{!visible.length && <p>{view === 'Watched' ? 'No episode history yet. Unmatched source entries appear below.' : 'No matched shows here yet. Add a show or match a source entry below.'}</p>}</>;
    const sourceCards = data.sources.flatMap(source => {
      const groups = new Map<string, typeof source.rows>();
      source.rows.filter(r => r.state !== 'imported' && r.state !== 'excluded' && (r.sourceCategory ?? 'Binge') === view && r.title.toLowerCase().includes(filter.toLowerCase())).forEach(r => groups.set(r.title,[...(groups.get(r.title) ?? []),r]));
      return [...groups].sort(([a],[b])=>a.localeCompare(b)).map(([title,rows])=><article key={`${source.id}-${title}`} aria-label={`Unmatched ${title}`}><h3>{title}</h3><p>{rows.map(r=>r.rawTitle ?? r.title).join(' · ')}</p><p>From master list · {rows[0].sourceWeekday ? `${rows[0].sourceWeekday} (unverified schedule) · ` : ''}{rows[0].sourceStatus ? `${rows[0].sourceStatus} (unverified) · ` : ''}Episode details not linked yet.</p>{rows.some(r=>r.notes) && <p>{rows.map(r=>r.notes).filter(Boolean).join(' · ')}</p>}<button disabled={rows[0].state==='review'} onClick={()=>{setImportTarget({sourceId:source.id,rowId:rows[0].id});setView('Import');}}>Match {title} with TVmaze</button>{rows[0].state==='review' && <p>Truncated title needs manual identification.</p>}</article>);
    });
    if (sourceCards.length) content=<>{content}<section><h2>Imported source entries awaiting a match</h2><p>Source viewing history and season labels are preserved. Release and renewal claims need verification.</p>{sourceCards}</section></>;
  }
  return <main>
    <h1>Watchlist <small>v0.1</small></h1>
    <p>Local library · Release times in America/Chicago</p>
    <div className="top-controls"><nav aria-label="Views">{(['Weekly','Binge','Watched','Add Show','Import'] as View[]).map(v => <button key={v} aria-current={view === v ? 'page' : undefined} onClick={() => {setView(v); setDetail(null); if(v==='Import') setImportTarget(null);}}>{v}</button>)}</nav><div className="backup-controls"><BackupExport disabled={busy||restoring||!data}/><BackupRestore disabled={busy||!data} onBusyChange={setRestoring} onRestored={resetAfterRestore}/></div></div>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {busy && <p role="status">Saving or fetching…</p>}
    {undo && !completion && <button disabled={busy} onClick={() => run(undoLast)}>Undo last episode change</button>}
    {detail !== null && data ? <Detail show={data.shows.find(s => s.id === detail)!} episodes={data.episodes.filter(e => e.showId === detail)} watched={new Set(data.progress.map(p => p.episodeId))} notes={data.preferences.find(p => p.showId === detail)?.notes ?? ''} now={now} busy={busy} run={run} toggle={toggle} onDelete={async () => { const show=data.shows.find(s=>s.id===detail); if (!show || !window.confirm(`Delete ${show.name}? This permanently removes its seasons, episodes, watched history, personal notes, order, and matching import entries from this library. Original files and existing backup files stay unchanged.`)) return; await run(async()=>{await deleteShow(show.id,db,fetchEpisodeOwner);setDetail(null);setImportTarget(null);setUndo(null);setCompletion('');setView('Binge');setNotice(`${show.name} was deleted from your library.`);}); }} onBack={() => setDetail(null)}/> : <><h2>{view}</h2>{['Weekly','Binge','Watched'].includes(view) && <label>Search library <input value={filter} onChange={e => setFilter(e.target.value)}/></label>}{content}</>}
    {completion && <div role="dialog" aria-modal="true" aria-label="Season complete"><p>{completion}</p><p>Your progress is saved. More metadata may be announced later.</p><button className="circle" aria-label="Dismiss completion" onClick={() => setCompletion('')}>×</button>{undo && <button disabled={busy} onClick={() => run(undoLast)}>Undo last episode change</button>}</div>}
    <footer><p>Episode metadata: <a href="https://www.tvmaze.com/" target="_blank" rel="noreferrer">TVmaze</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Cached locally; refresh manually. Availability can vary by region.</p></footer>
  </main>;
}

type Run = (action: () => Promise<void>) => Promise<void>;
function AddShow({run, busy, onAdded, initial = '', onSelect}: {run: Run; busy: boolean; onAdded: (id:number) => void; initial?: string; onSelect?: (candidate: Candidate) => Promise<void>}) {
  const [query, setQuery] = useState(initial), [results, setResults] = useState<Candidate[]>([]), [searched, setSearched] = useState(false);
  return <section><form onSubmit={e => { e.preventDefault(); run(async () => {setResults([]); setSearched(false); setResults(await searchShows(query)); setSearched(true);}); }}><label>Show title <input required value={query} onChange={e => setQuery(e.target.value)}/></label><button disabled={busy || !query.trim()}>Search TVmaze</button></form>
    {searched && !results.length && <p>No matches. Try another title.</p>}
    {results.map(c => <article key={c.id}><h3>{c.name}</h3><p>{c.premiered ?? 'Premiere unknown'} · {c.language ?? 'Language unknown'} · {c.webChannel?.name ?? c.network?.name ?? 'Service unknown'}</p><p>{plainText(c.summary)}</p><a href={c.url} target="_blank" rel="noreferrer">TVmaze details</a> <button disabled={busy} onClick={() => run(async () => { if (onSelect) await onSelect(c); else {const revision=await libraryRevision();await saveBundle(await fetchBundle(c.id),db,false,revision); onAdded(c.id);} })}>Import {c.name} (#{c.id})</button></article>)}
  </section>;
}
function Detail({show, episodes, watched, notes, now, busy, run, toggle, onDelete, onBack}: {show:Show; episodes:Episode[]; watched:Set<number>; notes:string; now:Date; busy:boolean; run:Run; toggle:(e:Episode,w:boolean)=>Promise<void>; onDelete:()=>Promise<void>; onBack:()=>void}) {
  const [current, setCurrent] = useState('');
  const [draftNotes, setDraftNotes] = useState(notes);
  if (!show) return null;
  const ordered = episodes.filter(regular).sort(episodeSort);
  return <section><button className="circle" aria-label="Back to library" onClick={onBack}>↶</button><h2>{show.name}</h2><p>{plainText(show.summary)}</p><p>{show.genres.join(', ') || 'Genres unknown'} · {show.service ?? 'Service unknown'} · {show.status ?? 'Status unknown'}</p><p>Last refresh: {new Date(show.syncedAt).toLocaleString()}</p><button disabled={busy} onClick={() => run(async () => {const revision=await libraryRevision();await saveBundle(await fetchBundle(show.id),db,true,revision);})}>Refresh metadata</button><button className="danger" disabled={busy} onClick={onDelete}>Delete show</button>
    <label>Personal notes <textarea value={draftNotes} onChange={e => setDraftNotes(e.target.value)}/></label><button disabled={busy} onClick={() => run(async () => {await db.preferences.update(show.id, {notes: draftNotes});})}>Save notes</button>
    <fieldset><legend>Already watching? Choose the current episode</legend><p>Explicitly mark released episodes before this one watched. The selected episode stays unchanged.</p><label>Current episode <select value={current} onChange={e => setCurrent(e.target.value)}><option value="">Choose episode</option>{ordered.map(e => <option key={e.id} value={e.id}>{episodeLabel(e)}</option>)}</select></label><button disabled={busy || !current} onClick={() => run(() => onboard(show.id, Number(current), now))}>Mark earlier released episodes watched</button></fieldset>
    {Array.from(new Set(ordered.map(e => e.season))).map(season => <section key={season}><h3>Season {season}</h3>{ordered.filter(e => e.season === season).map(e => <div className="episode" key={e.id}><label><input type="checkbox" checked={watched.has(e.id)} disabled={busy || (!watched.has(e.id) && !released(e,now))} onChange={event => run(() => toggle(e,event.target.checked))}/>{episodeLabel(e)}</label><small>{e.airstamp ? airTime(e.airstamp) : e.airdate ? `${e.airdate} · Time unknown` : 'Release unknown'}</small><p>{plainText(e.summary)}</p></div>)}</section>)}
  </section>;
}
function ImportPanel({sources,run,busy,initialTarget}: {sources:Source[];run:Run;busy:boolean;initialTarget:{sourceId:string;rowId:string}|null}) {
  const [selected, setSelected] = useState<{sourceId:string; rowId:string} | null>(initialTarget);
  const [filter,setFilter] = useState('');
  const [confirmSeasonlessWatched,setConfirmSeasonlessWatched] = useState(false);
  const selectedSource = sources.find(s => s.id === selected?.sourceId);
  const row = selectedSource?.rows.find(r => r.id === selected?.rowId);
  const seasonlessWatched = !!row && !!selectedSource?.rows.some(r=>r.title===row.title && r.sourceCategory==='Watched' && r.season===undefined && r.state==='pending');
  return <section><p>The original master has been imported as a separate working catalog, excluding Silo. Select a TVmaze candidate to link its episodes. Source schedules and renewal claims remain unverified.</p><p>Additional working lists can be one title per line (.txt), or JSON arrays of titles / &#123;title, notes&#125; rows. Original uploaded text is retained locally.</p>
    <label>Working list file <input type="file" accept=".txt,.json" disabled={busy} onChange={event => {const file = event.target.files?.[0]; if (file) run(async () => {if (file.size > 5_000_000) throw new Error('Please use a file smaller than 5 MB.'); const revision=await libraryRevision(); const raw=await file.text(); const source = /^WEEKLY\s*$/m.test(raw) && /^WATCHED\s*$/m.test(raw) ? {...masterSource(raw,crypto.randomUUID()),raw} : prepareSource(file.name,raw); await addImportSource(source,revision);}); event.target.value='';}}/></label>
    <label>Filter source entries <input value={filter} onChange={e=>setFilter(e.target.value)}/></label>
    {!row && sources.map(source => <article key={source.id}><h3>{source.name}</h3><p>{source.rows.length} installments retained</p>{source.rows.filter(r=>r.title.toLowerCase().includes(filter.toLowerCase())).map(r => <div key={r.id}><span>{r.rawTitle ?? r.title} · {r.state}</span> {r.state === 'pending' && <button disabled={busy} onClick={() => setSelected({sourceId:source.id,rowId:r.id})}>Find match for {r.rawTitle ?? r.title}</button>}{r.state === 'review' && <small> Needs manual identification; not imported.</small>}</div>)}</article>)}
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
    }}/></div>}
  </section>;
}
