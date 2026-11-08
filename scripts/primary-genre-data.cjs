function applyGenreChoices(library,review,genresOf){
 if(review.version!==1||!Array.isArray(review.choices)||!review.choices.length)throw Error('A completed primary-genre review is required.');
 const seen=new Set(),selected=new Map();
 for(const row of review.choices){if(!Number.isSafeInteger(row.showId)||seen.has(row.showId))throw Error('Duplicate or invalid show identity.');seen.add(row.showId);const show=library.backup.shows.find(show=>show.id===row.showId),preference=library.backup.preferences.find(p=>p.showId===row.showId);
  if(!show||!preference||show.name!==row.name||!Array.isArray(row.genres)||JSON.stringify(genresOf(show.genres))!==JSON.stringify(genresOf(row.genres))||!genresOf(show.genres).includes(row.primaryGenre))throw Error('A reviewed show or its genres changed: '+row.name+'. No choices applied.');
  selected.set(row.showId,row.primaryGenre);
 }
 const result=structuredClone(library);result.backup.version=4;result.backup.preferences=result.backup.preferences.map(p=>selected.has(p.showId)?{...p,primaryGenre:selected.get(p.showId)}:p);
 return {library:result,count:selected.size};
}
module.exports={applyGenreChoices};
