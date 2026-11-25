/* ===== CONFIGURAÇÃO: cole aqui os dados do seu projeto Supabase (Project Settings > API) ===== */
const SUPABASE_URL="https://iwkgpuccnrtuvnuqkdet.supabase.co",SUPABASE_KEY="sb_publishable_xVMFyJVJWuGOJpHHpGZN9w_pEh1ziqw";
const IBAN="AO06 0051 0000 5939 3333 1017 0",FEE=3000;
const CATS=["Todos","Lápis e canetas","Livros","Réguas e geometria","Desenho","Mochilas e estojos","Outros"];
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const kz=n=>Number(n).toLocaleString("pt-PT")+" Kz";
let pend=[],user=null,isAdmin=false,prods=[],cart=[],cat="Todos",q="",proof=null,photo=null,mode="in";
try{cart=JSON.parse(localStorage.getItem("kd_cart")||"[]")}catch(e){}
const saveCart=()=>{try{localStorage.setItem("kd_cart",JSON.stringify(cart))}catch(e){}};
function toast(m){const t=$("#ts");t.textContent=m;t.classList.add("on");clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("on"),3200)}
function wa(n,t){n=String(n).replace(/\D/g,"");if(n.length==9)n="244"+n;return"https://wa.me/"+n+"?text="+encodeURIComponent(t)}
function shrink(file,max,cb){const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement("canvas");c.width=i.width*k;c.height=i.height*k;c.getContext("2d").drawImage(i,0,0,c.width,c.height);cb(c.toDataURL("image/jpeg",.8))};i.src=r.result};r.readAsDataURL(file)}

/* ---------- conta ---------- */
const meta=()=>(user&&user.user_metadata)||{};
function gate(){$("#gate").style.display=user?"none":"grid"}
$("#gm").onclick=()=>{mode=mode=="in"?"up":"in";$("#gsu").hidden=mode=="in";$("#gb").textContent=mode=="in"?"Entrar":"Criar conta";$("#gm").textContent=mode=="in"?"Ainda não tem conta? Criar conta":"Já tenho conta? Entrar"};
$("#gb").onclick=async()=>{
 const e=$("#ge").value.trim(),pw=$("#gp").value;
 if(!e||pw.length<6)return toast("Indique o email e uma palavra-passe (mín. 6)");
 $("#gb").disabled=true;let r;
 if(mode=="up"){const n=$("#gn").value.trim(),w=$("#gw").value.replace(/\D/g,"");
  if(!n||w.length<9){$("#gb").disabled=false;return toast("Indique o nome e um WhatsApp válido")}
  r=await sb.auth.signUp({email:e,password:pw,options:{data:{name:n,wa:w}}});
  if(!r.error&&!r.data.session)toast("Conta criada! Confirme o seu email e depois entre.")}
 else r=await sb.auth.signInWithPassword({email:e,password:pw});
 $("#gb").disabled=false;if(r.error)toast(r.error.message)};
$("#out").onclick=()=>sb.auth.signOut();
sb.auth.onAuthStateChange((_e,s)=>setTimeout(()=>setUser(s?s.user:null),0));
async function setUser(u){
 user=u;gate();isAdmin=false;
 if(u){const r=await sb.from("admins").select("user_id").eq("user_id",u.id).maybeSingle();isAdmin=!!r.data}
 $("#adm").hidden=!isAdmin;clearInterval(window._pl);if(isAdmin)window._pl=setInterval(load,60000);await load()}

/* ---------- avisos ao vendedor ---------- */
function notify(m){const n=$("#nt");n.innerHTML=`<span>${m}</span><button class="x" id="ntx" aria-label="Fechar">×</button>`;n.hidden=false}
$("#nt").onclick=e=>{if(e.target.id=="ntx")$("#nt").hidden=true};
function checkNotices(){
 if(!user)return;
 const k="kd_seen_"+user.id;let seen={};
 try{seen=JSON.parse(localStorage.getItem(k)||"{}")}catch(e){}
 const msgs=[];
 prods.filter(p=>p.mine).forEach(p=>{
  if(seen[p.id]=="pendente"&&p.status=="aprovado")msgs.push(`🎉 O seu produto <b>${esc(p.name)}</b> foi aprovado e já está visível a todos.`);
  if(seen[p.id]=="pendente"&&p.status=="recusado")msgs.push(`O pagamento do produto <b>${esc(p.name)}</b> não foi confirmado. Fale connosco para resolver.`);
  seen[p.id]=p.status});
 try{localStorage.setItem(k,JSON.stringify(seen))}catch(e){}
 if(msgs.length)notify(msgs.join("<br>"))}
/* atualização em direto: quando algo muda na base de dados, o catálogo e os avisos atualizam sozinhos */
sb.channel("kd-produtos").on("postgres_changes",{event:"*",schema:"public",table:"products"},()=>{if(user)load()}).subscribe();

/* contador de produtos por aprovar (só para o administrador) */
function updateBadge(){
 const n=isAdmin?prods.filter(p=>p.status=="pendente").length:0,b=$("#ac");
 b.textContent=n;b.hidden=!n;
 document.title=(n?"("+n+") ":"")+"Kandengues · Material escolar com segunda vida"}

/* ---------- catálogo ---------- */
async function load(){
 const {data,error}=await sb.from("products").select("*").order("created_at",{ascending:false});
 if(error){toast("Não foi possível carregar os produtos");return}
 prods=data.map(r=>({id:r.id,name:r.name,cat:r.category,price:r.price,seller:r.seller_name,wa:r.whatsapp,img:r.image_url,status:r.status,path:r.proof_path,mine:!!user&&r.seller_id==user.id}));
 checkNotices();updateBadge();grid();cartUI()}
function chips(){$("#chips").innerHTML=CATS.map(c=>`<button class="chip ${c==cat?"on":""}" data-c="${esc(c)}">${esc(c)}</button>`).join("");
 $("#pc").innerHTML=CATS.slice(1).map(c=>`<option>${esc(c)}</option>`).join("")}
$("#chips").onclick=e=>{const b=e.target.closest("[data-c]");if(b){cat=b.dataset.c;chips();grid()}};
$("#q").oninput=e=>{q=e.target.value.toLowerCase();grid()};
const thumb=p=>p.img?`<img src="${esc(p.img)}" alt="" loading="lazy">`:"📦";
function grid(){
 const l=prods.filter(p=>(p.status=="aprovado"||p.mine)&&(cat=="Todos"||p.cat==cat)&&(p.name+p.cat).toLowerCase().includes(q));
 $("#grid").innerHTML=l.length?l.map((p,i)=>`<article class="card" style="--i:${i}">
  <div class="ph">${thumb(p)}</div>
  <div class="cb"><span class="tag">${esc(p.cat)}</span>${p.status!="aprovado"?`<span class="tag w">${p.status=="pendente"?"A aguardar confirmação do pagamento":"Recusado"}</span>`:""}<h3>${esc(p.name)}</h3><small>Vendedor: ${esc(p.seller)}</small><div class="pr">${kz(p.price)}</div>
  ${p.status=="aprovado"?`<div class="act"><button class="btn" data-add="${p.id}">${cart.includes(p.id)?"No carrinho ✓":"+ Carrinho"}</button>
  <a class="btn o" target="_blank" rel="noopener" href="${wa(p.wa,`Olá ${p.seller}! Tenho interesse em “${p.name}” (${kz(p.price)}) que vi no Kandengues.`)}">WhatsApp</a></div>`:""}${p.mine||isAdmin?`<button class="rm" data-del="${p.id}">Remover produto</button>`:""}</div></article>`).join(""):`<div class="empty">Ainda não há produtos aqui 🌱<br>Seja o primeiro a publicar!</div>`}
async function delProduct(id){
 const p=prods.find(x=>x.id==id);if(!p)return;
 const r=await sb.from("products").delete().eq("id",id).select();
 if(r.error||!r.data.length)return toast("Não foi possível remover o produto");
 await sb.storage.from("produtos").remove([p.path]);
 cart=cart.filter(i=>i!=id);saveCart();toast("Produto removido");load()}
$("#grid").onclick=e=>{const d=e.target.closest("[data-del]");
 if(d){if(d.dataset.arm!="1"){d.dataset.arm="1";d.classList.add("arm");d.textContent="Confirmar remoção";
   setTimeout(()=>{d.dataset.arm="";d.classList.remove("arm");d.textContent="Remover produto"},3500);return}
  delProduct(d.dataset.del);return}
 const b=e.target.closest("[data-add]");if(!b)return;const id=b.dataset.add;
 if(!cart.includes(id)){cart.push(id);saveCart();toast("Adicionado ao carrinho")}cartUI();grid()};

/* ---------- carrinho ---------- */
function cartUI(){
 const items=cart.map(id=>prods.find(p=>p.id==id)).filter(p=>p&&p.status=="aprovado");
 $("#cc").textContent=items.length;
 $("#cl").innerHTML=items.length?items.map(p=>`<div class="ci"><div class="t">${thumb(p)}</div><div><b>${esc(p.name)}</b><small>${esc(p.seller)} · ${kz(p.price)}</small></div><button class="x" data-rm="${p.id}">×</button></div>`).join(""):`<p style="color:var(--mut)">O carrinho está vazio.</p>`;
 const by={};items.forEach(p=>(by[p.wa]=by[p.wa]||[]).push(p));
 $("#cf").innerHTML=Object.keys(by).map(w=>{const l=by[w],t=l.reduce((a,p)=>a+p.price,0);
  const msg=`Olá ${l[0].seller}! Vi no Kandengues e quero comprar:\n`+l.map(p=>`• ${p.name} (${kz(p.price)})`).join("\n")+`\nTotal: ${kz(t)}\nO meu nome: ${meta().name||""}`;
  return `<a class="btn" style="display:block;text-align:center;margin-top:10px" target="_blank" rel="noopener" href="${wa(w,msg)}">Comprar de ${esc(l[0].seller)} · ${kz(t)}</a>`}).join("")}
$("#cl").onclick=e=>{const b=e.target.closest("[data-rm]");if(b){cart=cart.filter(i=>i!=b.dataset.rm);saveCart();cartUI();grid()}};
const dw=$("#dw");$("#cartb").onclick=()=>{cartUI();dw.classList.add("on")};$("#dx").onclick=()=>dw.classList.remove("on");

/* ---------- publicar ---------- */
function drop(el,input,set){
 el.onclick=()=>input.click();input.onchange=()=>{const f=input.files[0];input.value="";f&&set(f)};
 ["dragenter","dragover"].forEach(v=>el.addEventListener(v,e=>{e.preventDefault();el.classList.add("hot")}));
 ["dragleave","drop"].forEach(v=>el.addEventListener(v,e=>{e.preventDefault();el.classList.remove("hot")}));
 el.addEventListener("drop",e=>{const f=e.dataTransfer.files[0];f&&f.type.startsWith("image/")&&set(f)})}
/* verificação do IBAN no comprovativo (leitura de texto na imagem, feita no próprio telemóvel/computador) */
let ocrWorker=null,checking=false;
async function readText(img){
 if(!ocrWorker)ocrWorker=await Tesseract.createWorker("eng");
 const r=await ocrWorker.recognize(img);return r.data.text}
function approx(pat,txt,max){ /* procura o IBAN no texto, aceitando até "max" erros de leitura */
 let prev=new Array(txt.length+1).fill(0);
 for(let i=1;i<=pat.length;i++){const cur=[i];
  for(let j=1;j<=txt.length;j++)cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(pat[i-1]==txt[j-1]?0:1));
  prev=cur}
 return Math.min(...prev)<=max}
function ibanOk(text){
 const want=IBAN.replace(/\D/g,"");
 const t=text.toUpperCase().replace(/O/g,"0").replace(/[IL|]/g,"1").replace(/\D/g,"");
 return want.length>=15&&approx(want,t,3)}
function setProof(f){
 if(checking)return;
 shrink(f,1400,async d=>{
  checking=true;proof=null;$("#fs").disabled=true;
  $("#pp").innerHTML=`<span>A verificar o IBAN no comprovativo… pode demorar alguns segundos</span><img src="${d}" alt="">`;
  try{
   const text=await readText(d);
   if(ibanOk(text)){proof=d;$("#fs").disabled=false;
    $("#pp").innerHTML=`<span class="ok">IBAN reconhecido ✓ Comprovativo aceite</span><img src="${d}" alt="">`;toast("Publicação libertada!")}
   else $("#pp").innerHTML=`<span style="color:#c0392b;font-weight:700">Não reconheci o IBAN no comprovativo.</span><br><small>Use uma imagem nítida e sem cortes, onde o IBAN para o qual pagou esteja visível, e tente outra vez.</small><img src="${d}" alt="">`;
  }catch(e){$("#pp").innerHTML=`<span style="color:#c0392b;font-weight:700">Não foi possível verificar agora.</span><br><small>Verifique a internet e tente outra vez.</small>`}
  checking=false})}
function setPhoto(f){shrink(f,700,d=>{photo=d;$("#pi").innerHTML=`<img src="${d}" alt="">`})}
drop($("#dp"),$("#fp"),setProof);drop($("#di"),$("#fi"),setPhoto);
document.addEventListener("paste",e=>{if(!$("#ovc").classList.contains("on"))return;
 const it=[...(e.clipboardData||{}).items||[]].find(i=>i.type.startsWith("image/"));if(!it)return;
 const f=it.getAsFile();proof?setPhoto(f):setProof(f)});
function openSell(){$("#iban").textContent=IBAN;$("#sn").value=meta().name||"";$("#sw").value=meta().wa||"";$("#ovc").classList.add("on")}
$("#sell").onclick=$("#sell2").onclick=openSell;
$("#cp").onclick=()=>{try{navigator.clipboard.writeText(IBAN.replace(/\s/g,"")).then(()=>toast("IBAN copiado"),()=>toast("Copie manualmente o IBAN"))}catch(e){toast("Copie manualmente o IBAN")}};
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$("#ovc").classList.remove("on"));
$("#ovc").onclick=e=>{if(e.target.id=="ovc")$("#ovc").classList.remove("on")};
$("#pub").onclick=async()=>{
 const n=$("#pn").value.trim(),s=$("#sn").value.trim(),w=$("#sw").value.replace(/\D/g,""),v=+$("#pv").value;
 if(!proof)return toast("Anexe primeiro o comprovativo");
 if(!n||!s||w.length<9||!v)return toast("Preencha nome, WhatsApp, produto e preço");
 if(!photo)return toast("Adicione a foto do produto");
 $("#pub").disabled=true;
 try{
  const path=user.id+"/"+Date.now()+".jpg";
  const pb=await (await fetch(proof)).blob(),ib=await (await fetch(photo)).blob();
  let r=await sb.storage.from("comprovativos").upload(path,pb,{contentType:"image/jpeg"});if(r.error)throw r.error;
  r=await sb.storage.from("produtos").upload(path,ib,{contentType:"image/jpeg"});if(r.error)throw r.error;
  const url=sb.storage.from("produtos").getPublicUrl(path).data.publicUrl;
  r=await sb.from("products").insert({seller_name:s,whatsapp:w,name:n,category:$("#pc").value,price:v,image_url:url,proof_path:path});if(r.error)throw r.error;
  proof=photo=null;$("#pp").innerHTML=$("#pi").innerHTML="";$("#pn").value=$("#pv").value="";$("#fs").disabled=true;
  $("#ovc").classList.remove("on");await load();toast("Enviado! Fica visível assim que confirmarmos o pagamento.");
 }catch(e){toast("Erro ao publicar: "+(e.message||"tente de novo"))}
 $("#pub").disabled=false};

/* ---------- administração ---------- */
async function adminList(){
 $("#al").innerHTML="<p>A carregar…</p>";
 const {data}=await sb.from("products").select("*").eq("status","pendente").order("created_at");
 pend=data||[];const rows=await Promise.all(pend.map(async r=>{
  const u=await sb.storage.from("comprovativos").createSignedUrl(r.proof_path,3600),link=u.data?u.data.signedUrl:"#";
  return `<div class="ci" data-row="${r.id}"><div class="t"><a href="${esc(link)}" target="_blank" rel="noopener"><img src="${esc(link)}" alt="comprovativo"></a></div><div><b>${esc(r.name)}</b><small>${esc(r.seller_name)} · ${esc(r.whatsapp)} · ${kz(r.price)}</small></div><button class="btn" data-ok="${r.id}" style="padding:6px 12px" title="Aprovar">✓</button><button class="btn o" data-no="${r.id}" style="padding:6px 12px" title="Recusar">✕</button></div>`}));
 $("#al").innerHTML=rows.join("")||"<p style='color:var(--mut)'>Sem pagamentos pendentes.</p>"}
$("#adm").onclick=()=>{$("#ova").classList.add("on");adminList()};
$("#ax").onclick=()=>$("#ova").classList.remove("on");
$("#al").onclick=async e=>{const b=e.target.closest("[data-ok],[data-no]");if(!b)return;
 const ok=!!b.dataset.ok,id=b.dataset.ok||b.dataset.no,p=pend.find(x=>x.id==id);
 if(!p)return;b.disabled=true;
 const r=await sb.from("products").update({status:ok?"aprovado":"recusado"}).eq("id",id);
 if(r.error){b.disabled=false;return toast("Erro: "+r.error.message)}
 const msg=ok?`Olá ${p.seller_name}! O seu produto “${p.name}” foi aprovado e já está visível no Kandengues. Boas vendas!`:`Olá ${p.seller_name}! Não conseguimos confirmar o pagamento do produto “${p.name}” no Kandengues. Pode enviar o comprovativo outra vez?`;
 const row=$("#al").querySelector(`[data-row="${id}"]`);
 if(row)row.innerHTML=`<div><b>${esc(p.name)}</b><small>${ok?"Aprovado ✓":"Recusado"}</small></div><a class="btn" target="_blank" rel="noopener" style="padding:8px 14px;font-size:14px" href="${wa(p.whatsapp,msg)}">Avisar no WhatsApp</a>`;
 load()};

chips();grid();cartUI();gate();