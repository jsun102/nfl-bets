
export const FRIEND_RULE={id:'friend-edge-v1',trust:.2,edge:.05,markets:['player_pass_yds','player_pass_tds','player_rush_yds','player_reception_yds','player_receptions']};
const valid=x=>Number.isFinite(x)&&x>=0&&x<=1;
export function friendOffer(r,raw=r.prob?.raw){
 if(r.kind!=='prop'||r.reason||!FRIEND_RULE.markets.includes(r.market)||!['draftkings','fanduel'].includes(r.book)||!['Over','Under'].includes(r.side)||!Number.isFinite(r.line)||!Number.isFinite(r.price)||Math.abs(r.price)<100||!valid(raw)||!valid(r.prob?.market))return null;
 const decimal=r.price>0?1+r.price/100:1+100/-r.price,p=.2*raw+.8*r.prob.market,edge=p-1/decimal,ev=p*decimal-1;
 const fairOdds=p<=0||p>=1?null:p>=.5?-100*p/(1-p):100*(1-p)/p;
 return {...r,firstFive:undefined,selectionMode:FRIEND_RULE.id,deployedProb:r.prob,prob:{...r.prob,raw,final:p,edge,ev,fairOdds},comparison:{trust:.2,edge,ev,decimal,conditionalOnNoPush:true}};
}
export function friendBest(rows){
 const best=new Map();
 for(const r of rows){if(!r?.comparison)continue;const key=JSON.stringify([r.comparisonGame||r.start?.slice(0,10),r.home,r.away,r.projection?.playerId||r.player,r.market]);const old=best.get(key);
 if(!old||r.prob.ev>old.prob.ev||(r.prob.ev===old.prob.ev&&String(r.id).localeCompare(String(old.id))<0))best.set(key,r);
 }return [...best.values()].sort((a,b)=>b.prob.ev-a.prob.ev);
}
export function friendBuckets(rows){
 const rules=[['Every pick, no filter',()=>true],['Any positive edge',e=>e>0],['Edge 0 to 2 pts',e=>e>0&&e<.02],['Edge 2 to 5 pts',e=>e>=.02&&e<.05],['Edge 5 pts or more',e=>e>=.05]];
 return rules.map(([label,accept])=>{const a=rows.filter(r=>accept(r.prob.edge)),done=a.filter(r=>r.result?.status==='settled'),decisive=done.filter(r=>r.result.outcome!=='push'),units=done.reduce((n,r)=>n+r.result.units,0),avg=k=>decisive.length?decisive.reduce((n,r)=>n+k(r),0)/decisive.length:null;return {label,bets:decisive.length,settled:done.length,wins:decisive.filter(r=>r.result.outcome==='win').length,losses:decisive.filter(r=>r.result.outcome==='loss').length,pushes:done.length-decisive.length,pending:a.filter(r=>r.result?.status==='pending').length,unresolved:a.filter(r=>r.result?.status==='unresolved').length,winRate:avg(r=>r.result.outcome==='win'?1:0),expectedWin:avg(r=>r.prob.final),units,roi:decisive.length?units/decisive.length:null};});
}

