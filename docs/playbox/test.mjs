import {readFileSync} from "node:fs";
function verify(app,catalogSource){
const passed=[],assert=(ok,label)=>{if(!ok)throw Error(label);passed.push(label);};
const window={},store=new Map();new Function("window",catalogSource)(window);
const C=window.PLAYBOX_CATALOG;assert(Object.values(C).flat().length===954,"954 catalog records");
assert(Object.values(C).every(arr=>new Set(arr.map(x=>x.id)).size===arr.length),"unique IDs");
assert(C.logo.length===100&&C.who.length===735&&C.logo.every(x=>x.source&&(x.image?.startsWith("https://")||x.website?.startsWith("https://"))),"logo source metadata");
const homeEl={};let elements={home:homeEl},html="",now=100000,callback;
const root={get innerHTML(){return html},set innerHTML(s){html=s;elements={home:homeEl};for(const m of s.matchAll(/<(?:button|input|select|form|p|div|img)[^>]*\bid="([^"]+)"[^>]*>/g)){const v=m[0].match(/\bvalue="([^"]*)"/);elements[m[1]]={value:v?v[1]:"",textContent:"",hidden:false,complete:false};}}};
const doc={querySelector(s){return s==="#app"?root:elements[s.slice(1)]},getElementById(id){return elements[id]},addEventListener(){},hidden:false};const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};const read=()=>JSON.parse(store.get("playbox.public.session.v1"));const click=id=>{if(!elements[id]?.onclick)throw Error("Missing button "+id);elements[id].onclick();};const set=(id,v)=>{elements[id].value=String(v);};
new Function("window","document","localStorage","navigator","Date","setInterval","clearInterval",app)(window,doc,storage,{}, {now:()=>now},f=>{callback=f;return 1},()=>{callback=null});
function start(game,level,rounds=2){click("g-"+game);set("players","Ana, Bia");set("level",level);set("category","all");set("rounds",rounds);set("seconds",10);elements.setup.onsubmit({preventDefault(){}});}
start("who",3);let s=read(),answer=C.who.find(i=>i.id===s.itemId).name;assert(!html.includes(">"+answer+"</h2>"),"secret absent before reveal");click("show");assert(html.includes(">"+answer+"</h2>"),"deliberate reveal");click("start");now+=3000;callback();assert(elements.timer.textContent==="00:07","deadline countdown");click("pause");assert(read().remaining===7000,"pause preserves time");now+=2000;click("start");click("hide");assert(!html.includes(">"+answer+"</h2>"),"hide removes answer");click("show");click("correct");assert(read().players[0].score===1&&read().round===2,"guess score and next turn");assert(new Set(read().used).size===2,"no repeat");
click("home");click("resume");assert(read().revealed===false,"resume protects secret");click("home");start("clay",1);assert(html.includes("reference"),"easy clay reference");click("start");now+=10000;callback();assert(read().phase==="ended","timer expiry");click("reveal");click("winner0");assert(read().players[0].score===1,"creative winner");click("start");click("end");click("reveal");click("tie");assert(read().phase==="finished","tie and finish");
click("home");start("logo",3);assert(!html.includes("<img")&&!html.includes("Consultar logo original"),"hard logo hidden");click("start");click("end");click("reveal");assert(html.includes("Consultar logo original"),"logo revealed after finish");click("winner1");assert(read().players[1].score===1,"logo vote");
return passed;
}
const passed=verify(readFileSync(new URL("./app.js",import.meta.url),"utf8"),readFileSync(new URL("./catalog.js",import.meta.url),"utf8"));
console.log(passed.map(x=>"PASS "+x).join("\n"));
