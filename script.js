/* ===== CONFIGURAÇÃO: cole aqui os dados do seu projeto Supabase (Project Settings > API) ===== */
const SUPABASE_URL="https://iwkgpuccnrtuvnuqkdet.supabase.co",SUPABASE_KEY="sb_publishable_xVMFyJVJWuGOJpHHpGZN9w_pEh1ziqw";
const IBAN="AO06 005100005939333310170",FEE=3000;
const CATS=["Todos","Lápis e canetas","Livros","Réguas e geometria","Desenho","Mochilas e estojos","Outros"];
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const kz=n=>Number(n).toLocaleString("pt-PT")+" Kz";
let user=null,isAdmin=false,prods=[],cart=[],cat="Todos",q="",proof=null,photo=null,mode="in";
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
 $("#adm").hidden=!isAdmin;await load()}

/* ---------- catálogo ---------- */
async function load(){
 const {data,error}=await sb.from("products").select("*").order("created_at",{ascending:false});
 if(error){toast("Não foi possível carregar os produtos");return}
 prods=data.map(r=>({id:r.id,name:r.name,cat:r.category,price:r.price,seller:r.seller_name,wa:r.whatsapp,img:r.image_url,status:r.status,mine:!!user&&r.seller_id==user.id}));
 grid();cartUI()}
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
  <a class="btn o" target="_blank" rel="noopener" href="${wa(p.wa,`Olá ${p.seller}! Tenho interesse em “${p.name}” (${kz(p.price)}) que vi no Kandengues.`)}">WhatsApp</a></div>`:""}</div></article>`).join(""):`<div class="empty">Ainda não há produtos aqui 🌱<br>Seja o primeiro a publicar!</div>`}
$("#grid").onclick=e=>{const b=e.target.closest("[data-add]");if(!b)return;const id=b.dataset.add;
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
 el.onclick=()=>input.click();input.onchange=()=>input.files[0]&&set(input.files[0]);
 ["dragenter","dragover"].forEach(v=>el.addEventListener(v,e=>{e.preventDefault();el.classList.add("hot")}));
 ["dragleave","drop"].forEach(v=>el.addEventListener(v,e=>{e.preventDefault();el.classList.remove("hot")}));
 el.addEventListener("drop",e=>{const f=e.dataTransfer.files[0];f&&f.type.startsWith("image/")&&set(f)})}
function setProof(f){shrink(f,900,d=>{proof=d;$("#pp").innerHTML=`<span class="ok">Comprovativo anexado ✓</span><img src="${d}" alt="">`;$("#fs").disabled=false;toast("Publicação libertada!")})}
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
 const rows=await Promise.all((data||[]).map(async r=>{
  const u=await sb.storage.from("comprovativos").createSignedUrl(r.proof_path,3600),link=u.data?u.data.signedUrl:"#";
  return `<div class="ci"><div class="t"><a href="${esc(link)}" target="_blank" rel="noopener"><img src="${esc(link)}" alt="comprovativo"></a></div><div><b>${esc(r.name)}</b><small>${esc(r.seller_name)} · ${esc(r.whatsapp)} · ${kz(r.price)}</small></div><button class="btn" data-ok="${r.id}" style="padding:6px 12px" title="Aprovar">✓</button><button class="btn o" data-no="${r.id}" style="padding:6px 12px" title="Recusar">✕</button></div>`}));
 $("#al").innerHTML=rows.join("")||"<p style='color:var(--mut)'>Sem pagamentos pendentes.</p>"}
$("#adm").onclick=()=>{$("#ova").classList.add("on");adminList()};
$("#ax").onclick=()=>$("#ova").classList.remove("on");
$("#al").onclick=async e=>{const b=e.target.closest("[data-ok],[data-no]");if(!b)return;
 const r=await sb.from("products").update({status:b.dataset.ok?"aprovado":"recusado"}).eq("id",b.dataset.ok||b.dataset.no);
 if(r.error)return toast("Erro: "+r.error.message);adminList();load()};

chips();grid();cartUI();gate();