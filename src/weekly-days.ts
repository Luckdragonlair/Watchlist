const weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const weekday=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',weekday:'long'});
/** Display order only: no release dates or viewing state are changed. */
export function weeklyDays(now:Date):string[]{const start=weekdays.indexOf(weekday.format(now));return [...weekdays.slice(start),...weekdays.slice(0,start)];}
