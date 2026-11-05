import { useEffect, useRef, useState } from 'react';
import { createBackup } from './backup';

export function BackupExport({disabled}:{disabled:boolean}) {
  const [preparing,setPreparing]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [download,setDownload]=useState<{url:string;filename:string}|null>(null);
  const feedback=useRef<HTMLDivElement>(null);
  useEffect(()=>()=>{if(download) URL.revokeObjectURL(download.url);},[download]);
  useEffect(()=>{if(message||error) feedback.current?.scrollIntoView({block:'nearest'});},[message,error]);
  async function exportBackup() {
    if(preparing) return;
    setPreparing(true);setMessage('Preparing backup…');setError('');
    try {
      const backup=await createBackup();
      const filename=`watchlist-backup-${backup.exportedAt.replace(/[:.]/g,'-')}.json`;
      const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}));
      setDownload({url,filename});
      const link=document.createElement('a');link.href=url;link.download=filename;
      document.body.appendChild(link);
      try {link.click();setMessage('Backup ready. Check your Downloads folder, or use the download link below.');}
      catch {setMessage('Backup ready. Use the download link below to save the file.');}
      finally {link.remove();}
    } catch(e) {
      setMessage('');setError(`Could not create the backup. ${e instanceof Error?e.message:'Please try again.'}`);
    } finally {setPreparing(false);}
  }
  return <section className="backup-export" aria-label="Backup export">
    <button disabled={disabled||preparing} onClick={exportBackup}>{preparing?'Preparing backup…':'Export backup'}</button>
    <div ref={feedback}><p role="status">{message}</p>
    {error&&<p role="alert">{error}</p>}
    {download&&<p><a href={download.url} download={download.filename}>Download backup file again</a><br/><small style={{overflowWrap:'anywhere'}}>{download.filename}</small></p>}</div>
  </section>;
}
