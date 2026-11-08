// Presentation aliases only: provider metadata remains unchanged.
export function genresOf(values:string[]):string[]{
 const names=values.map(value=>value.trim()).filter(Boolean).map(value=>/^(science[ -]?fiction|sci-?fi)$/i.test(value)?'Science-Fiction':value);
 return [...new Set(names)].sort((a,b)=>a.localeCompare(b));
}
export const genreClass=(name:string)=>'genre-'+name.toLowerCase().replace(/[^a-z]/g,'');
export function primaryGenre(values:string[],preferred?:string):string{const genres=genresOf(values);return preferred?.trim()?genresOf([preferred])[0]: ['Science-Fiction','Superhero','Fantasy','Horror','Comedy','Drama'].find(name=>genres.includes(name))??genres[0]??'Unclassified';}
export function displayGenres(values:string[],preferred?:string):string[]{const genres=genresOf(preferred?[...values,preferred]:values),primary=primaryGenre(genres,preferred);return genres.length?[primary,...genres.filter(name=>name!==primary)]:[];}
export function matchesGenres(values:string[],selected:string[]):boolean{const genres=genresOf(values);return !selected.length||selected.some(name=>(genres.length?genres:['Unclassified']).includes(name));}
