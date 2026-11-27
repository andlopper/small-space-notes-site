(()=>{
"use strict";
let lock=null,busy=false,enabled=true;
const supported=!!navigator.wakeLock?.request;
const status=document.createElement("div");status.className="wake-status";status.setAttribute("role","status");status.style.cssText="text-align:center;font-size:12px;margin:12px 0;color:inherit;opacity:.85";
const label=document.createElement("span"),button=document.createElement("button");button.type="button";button.className="secondary";button.style.cssText="font-size:12px;min-height:36px;padding:7px 10px;margin-left:8px";status.append(label,button);document.querySelector("footer")?.before(status);
function update(){label.textContent=!supported?"Este navegador não permite manter a tela ligada automaticamente.":!enabled?"Tela ligada: desativado":lock&&!lock.released?"Tela ligada: ativa":"Tela ligada: aguardando permissão";button.hidden=!supported;button.textContent=enabled?"Desativar":"Ativar";}
async function acquire(){if(!supported||!enabled||busy||document.visibilityState!=="visible"||(lock&&!lock.released))return;busy=true;try{const next=await navigator.wakeLock.request("screen");if(!enabled||document.visibilityState!=="visible"){await next.release();return;}lock=next;next.addEventListener("release",()=>{if(lock===next)lock=null;update();});}catch{}finally{busy=false;update();}}
button.addEventListener("click",async e=>{e.stopPropagation();enabled=!enabled;if(!enabled){if(lock)try{await lock.release();}catch{}lock=null;}else await acquire();update();});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")acquire();});document.addEventListener("pointerdown",acquire,{passive:true});document.addEventListener("keydown",acquire);window.addEventListener("pageshow",acquire);window.addEventListener("pagehide",()=>{if(lock)lock.release().catch(()=>{});});update();acquire();
})();