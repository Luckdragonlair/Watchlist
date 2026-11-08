/** Filing titles never changes provider identity or source-list text. */
export function filedTitle(title:string):string {
  const match=/^(A|The)\s+(\S.*)$/i.exec(title);
  return match?`${match[2]}, ${match[1].toLowerCase()==='a'?'A':'The'}`:title;
}
export const compareTitles=(a:string,b:string)=>filedTitle(a).localeCompare(filedTitle(b),'en',{sensitivity:'base'});
export function matchesTitle(title:string,query:string):boolean {
  const filed=filedTitle(title),match=/^(.+), (A|The)$/i.exec(filed);
  return [title,filed,match?`${match[2]} ${match[1]}`:title].some(value=>value.toLowerCase().includes(query.toLowerCase()));
}
