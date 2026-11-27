import {readFileSync} from "node:fs";
function verifyBoard(source){
const checks=[],assert=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
let html="",els={},store=new Map(),random=0.0;
const root={get innerHTML(){return html},set innerHTML(v){html=v;els={};for(const m of v.matchAll(/<(?:button|input|select|form|p)[^>]*\bid="([^"]+)"[^>]*>/g)){els[m[1]]={value:"",checked:/\bchecked\b/.test(m[0]),textContent:""};}}};
const document={getElementById(id){return id==="boardapp"?root:els[id];}},localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
const math=Object.create(Math);math.random=()=>random;new Function("document","localStorage","Math",source)(document,localStorage,math);
const read=()=>JSON.parse(store.get("playbox.board.v1")??null),click=id=>{if(!els[id]?.onclick)throw Error("Missing "+id);els[id].onclick();},submit=()=>els.setup.onsubmit({preventDefault(){}});
function create(length,level,mix=true){els.name0.value="Ana";els.name1.value="Bia";els.agree.checked=true;els.length.value=String(length);els.level.value=String(level);els.mix.checked=mix;submit();}
assert(!html.includes("Modo cooperativo"),"only competitive");
submit();assert(els.error.textContent.includes("Preencham"),"requires names and agreement");
create(16,0);let s=read();assert(s.tiles.length===17&&s.players.every(x=>x.pos===0),"16 playable moves plus start");assert(s.tiles.every(t=>t!=="sex"),"low intensity no sex spaces");click("roll");s=read();assert(s.players[0].pos===1&&s.dice===1&&s.event.type==="therapy","dice moves before optional card");click("next");assert(read().players[0].pos===1&&read().turn===1,"declining card has no movement penalty");click("roll");click("alt");assert(read().players[1].pos===1,"alternative no movement penalty");click("next");assert(read().turn===0,"alternating turns");
click("stop");random=.99;create(24,2);s=read();assert(s.tiles.length===25&&s.tiles.slice(1,9).every(x=>x!=="sex"),"first stage no sex spaces");assert(s.tiles.includes("sex"),"high later stages sex spaces");click("lower");click("lower");assert(read().level===0,"lower intensity at any time");assert(!html.includes("🔥"),"lower intensity replaces visible sex spaces");click("stop");random=.0;create(40,1,false);assert(read().tiles.length===41,"40 spaces");assert(!read().tiles.some(t=>["duel","sync","romance"].includes(t)),"physical-card preference excludes digital challenges");
click("stop");create(16,0);random=.99;let guard=0;while(read().phase!=="finished"&&guard++<50){if(read().phase==="roll")click("roll");else click("next");}assert(read().phase==="finished"&&read().players[read().winner].pos===16,"race finishes on arrival");click("new");assert(read()===null&&els.setup,"new game clears session");return checks;
}
console.log(verifyBoard(readFileSync(new URL("./board.js",import.meta.url),"utf8")).map(x=>"PASS "+x).join("\n"));
