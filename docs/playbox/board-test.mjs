import {readFileSync} from "node:fs";
function verifyBoard(source){
const checks=[],assert=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
let html="",els={},store=new Map(),random=0.0,timer=null;
const root={get innerHTML(){return html},set innerHTML(v){html=v;els={};for(const m of v.matchAll(/<(?:button|input|select|form|p|div)[^>]*\bid="([^"]+)"[^>]*>/g)){const value=m[0].match(/\bvalue="([^"]*)"/);els[m[1]]={value:value?.[1]||"",disabled:/\bdisabled\b/.test(m[0]),textContent:""};}}};
const doc={getElementById(id){return id==="boardapp"?root:els[id];}},storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
const math=Object.create(Math);math.random=()=>random;new Function("document","localStorage","Math","setTimeout",source)(doc,storage,math,f=>{timer=f;});
const read=()=>JSON.parse(store.get("playbox.board.v2")??null),click=id=>{if(!els[id]?.onclick||els[id].disabled)throw Error("Missing or disabled "+id);els[id].onclick();},submit=()=>els.setup.onsubmit({preventDefault(){}});
function create(mode,size,level){els.name0.value="Ana";els.name1.value="Bia";els.mode.value=mode;els.mode.onchange();els.length.value=String(size);els.level.value=String(level);submit();}
function finishRoll(){const f=timer;timer=null;f();}
function resolveCard(id){if(read().phase==="coin")click("therapy");click(id);}
assert(!els.agree&&html.includes("Ao começar a partida confirmo que temos 18 anos ou mais"),"age note no checkbox");
submit();assert(els.error.textContent.includes("Preencham"),"names required");
els.name0.value="Ana";els.name1.value="Bia";assert(els["color0-red"].disabled,"distinct pawn colors");click("color0-green");assert(els.name0.value==="Ana"&&els.name1.value==="Bia"&&els["color1-green"].disabled,"color selection preserves names");
create("coin",1,1);let s=read();assert(s.length===27&&s.players[0].color==="green","coin normal length and pawn color");
assert(s.tiles.filter(x=>x==="coin").length===9,"exactly one third coin spaces");assert([0,1,2].every(i=>s.tiles.slice(1+i*9,10+i*9).filter(x=>x==="coin").length===3),"one third in each stage");const counts=[0,1,2].map(i=>s.tiles.slice(1+i*9,10+i*9).filter(x=>x==="sex").length);assert(counts[0]<counts[1]&&counts[1]<counts[2],"increasing sex ratio");
assert(!html.includes("opcional")&&!html.includes("Trocar por"),"no repeated optional label or alternatives");assert(html.includes("path-viewport")&&html.includes("house27"),"vertical path");
click("advance");assert(read().target===1&&read().players[0].pos===0,"coin prepares one space");resolveCard("decline");assert(read().players[0].pos===1&&read().turn===1,"decline same progress");
click("advance");resolveCard("done");assert(read().players[1].pos===1&&read().turn===0,"done same progress");
let coinSeen=false;for(let i=0;i<20&&!coinSeen;i++){click("advance");if(read().phase==="coin"){coinSeen=true;assert(els.therapy&&els.sex,"real coin result buttons");click("sex");assert(read().card==="sex"&&read().phase==="card","real coin selects deck");}click("done");}assert(coinSeen,"coin house reached");
click("lower");assert(read().level===0&&read().tiles.filter(x=>x==="coin").length===9,"reduction preserves exact coin count");
click("stop");create("dice",1,1);s=read();assert(s.length===54&&s.tiles.every(x=>["start","therapy","sex"].includes(x)),"dice path twice as long only two types");
random=.99;click("advance");assert(read().phase==="rolling"&&html.includes("cube rolling")&&read().dice===6,"six-sided spinning dice");finishRoll();assert(read().target===6&&read().players[0].pos===0&&read().phase==="card","dice destination after animation");click("decline");assert(read().players[0].pos===6&&read().turn===1,"dice refusal no penalty");click("advance");finishRoll();click("done");assert(read().players[1].pos===6,"dice completion same progress");
let guard=0;while(read().phase!=="finished"&&guard++<50){if(read().phase==="turn")click("advance");else if(read().phase==="rolling")finishRoll();else resolveCard("done");}assert(read().phase==="finished"&&html.includes("O amor vencer &lt;3"),"love finale");click("new");assert(read()===null&&els.setup,"new game clears state");return checks;
}
console.log(verifyBoard(readFileSync(new URL("./board.js",import.meta.url),"utf8")).map(x=>"PASS "+x).join("\n"));
