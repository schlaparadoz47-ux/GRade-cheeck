"use strict";
/* =====================================================
   CardVault v1 – Scan-/Katalog-Modul
   Datenquelle Suche: TCGdex (api.tcgdex.net, deutsch)
   Speicherung: localStorage mit In-Memory-Fallback
   ===================================================== */

const API = "https://api.tcgdex.net/v2/de";
const STORE_KEY = "cardvault_v1";
const GRADE_NAMES = {
  10:"GEM MINT", 9:"MINT", 8:"NM-MINT", 7:"NEAR MINT", 6:"EX-MINT",
  5:"EXCELLENT", 4:"VG-EX", 3:"VERY GOOD", 2:"GOOD", 1:"POOR"
};

/* ---------- Speicher (mit Fallback) ---------- */
let memStore = null; // Fallback, falls localStorage blockiert ist
function storageAvailable(){
  try{
    localStorage.setItem("__cv_test","1");
    localStorage.removeItem("__cv_test");
    return true;
  }catch(e){ return false; }
}
const HAS_LS = storageAvailable();

function loadCollection(){
  if(HAS_LS){
    try{ return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
    catch(e){ return []; }
  }
  return memStore || [];
}
function persist(){
  if(HAS_LS){
    try{ localStorage.setItem(STORE_KEY, JSON.stringify(collection)); return; }
    catch(e){ toast("Speicher voll – Export empfohlen"); }
  }
  memStore = collection;
}

let collection = loadCollection();

/* ---------- Hilfen ---------- */
const $ = id => document.getElementById(id);
const eur = n => (Number(n)||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"});
function esc(s){
  return String(s ?? "").replace(/[&<>\"']/g, c =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
function toast(msg){
  const t = $("toast");
  if(!t) return; // robust
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(()=>t.classList.remove("show"), 2200);
}
function imgURL(base, q){ return base ? `${base}/${q}.webp` : null; }

/* ---------- Ansichten ---------- */
function showView(v){
  const viewColl = $("viewColl");
  const viewAdd = $("viewAdd") || $("viewScan");
  const viewArena = $("viewArena");
  if(viewColl) viewColl.classList.toggle("hidden", v!="coll");
  if(viewAdd) viewAdd.classList.toggle("hidden", v!="add" && v!="scan");
  if(viewArena) viewArena.classList.toggle("hidden", v!="arena");
  const setTab = id => { const el=$(id); if(el) el.setAttribute("aria-selected", id.endsWith(v?"Coll":"Coll") ? String(v===id.replace('tab','').toLowerCase()): String(id.includes(v))); };
  if($('tabColl')) $('tabColl').setAttribute('aria-selected', v==='coll');
  if($('tabAdd')) $('tabAdd').setAttribute('aria-selected', v==='add' || v==='scan');
  if($('tabScan')) $('tabScan').setAttribute('aria-selected', v==='scan');
  if($('tabRoi')) $('tabRoi').setAttribute('aria-selected', v==='roi');
  if($('tabTrade')) $('tabTrade').setAttribute('aria-selected', v==='trade');
  if($('tabArena')) $('tabArena').setAttribute('aria-selected', v==='arena');
  if(v==='add' || v==='scan') setTimeout(()=>{ const s = $("searchInput"); if(s) s.focus(); }, 60);
  if(v==='arena') renderArena();
}

/* ---------- Statistik ---------- */
function renderStats(){
  const totalQty = collection.reduce((s,c)=> s + (c.qty||1), 0);
  const totalVal = collection.reduce((s,c)=> s + (Number(c.value)||0)*(c.qty||1), 0);
  const graded = collection.filter(c=>c.grade);
  const avg = graded.length ? (graded.reduce((s,c)=>s+c.grade,0)/graded.length) : null;
  if($("stCount")) $("stCount").textContent = totalQty;
  if($("stValue")) $("stValue").textContent = eur(totalVal);
  if($("stGrade")) $("stGrade").textContent = avg ? avg.toFixed(1) : "–";
  const buys = collection.filter(c=>c.buy!=null);
  const plEl = $("plRow");
  if(plEl){
    if(buys.length){
      const invested = buys.reduce((s,c)=> s + (Number(c.buy)||0)*(c.qty||1), 0);
      const pl = buys.reduce((s,c)=> s + ((Number(c.value)||0)-(Number(c.buy)||0))*(c.qty||1), 0);
      plEl.innerHTML = `<span>Investiert <b>${eur(invested)}</b></span>`+
        `<span>Bilanz <b class="${pl>=0?'ok':'bad'}">${pl>=0?'+':''}${eur(pl)}</b></span>`;
      plEl.classList.remove("hidden");
    } else {
      plEl.classList.add("hidden");
    }
  }
}

/* ---------- Sammlung rendern ---------- */
function renderCollection(){
  renderStats();
  updateBackupNotice();
  const fi = $("filterInput");
  const q = (fi && fi.value||"").trim().toLowerCase();
  const sortEl = $("sortSelect");
  const sort = sortEl ? sortEl.value : 'new';
  let list = collection.filter(c =>
    !q || (c.name||"").toLowerCase().includes(q) || (c.set||"").toLowerCase().includes(q)
  );
  const sorters = {
    new:     (a,b)=> (b.added||0)-(a.added||0),
    valdesc: (a,b)=> (b.value||0)-(a.value||0),
    valasc:  (a,b)=> (a.value||0)-(b.value||0),
    grade:   (a,b)=> (b.grade||0)-(a.grade||0),
    name:    (a,b)=> (a.name||"").localeCompare(b.name||"","de")
  };
  list.sort(sorters[sort] || sorters.new);

  const grid = $("grid");
  if(!grid) return;
  grid.innerHTML = "";
  if($("emptyColl")) $("emptyColl").classList.toggle("hidden", collection.length>0);

  list.forEach(c=>{
    const img = c.photo || imgURL(c.apiImage,"low");
    const el = document.createElement("button");
    el.className = "slab";
    el.setAttribute("aria-label", `${c.name}, Zustand ${c.grade}`);
    el.innerHTML = `
      <div class="band">
        <div class="nm">${esc(c.name)}<span class="set">${esc(c.set||"")}${c.number? " · "+esc(c.number):""}</span></div>
        <div class="grade">${c.grade}</div>
      </div>
      <div class="imgwrap">${img
        ? `<img loading="lazy" src="${esc(img)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ph',textContent:'kein Bild'}))">`
        : `<div class="ph">kein Bild</div>`}</div>
      <div class="foot"><span class="val">${eur(c.value)}</span><span class="qty">×${c.qty||1}</span></div>`;
    el.onclick = ()=>openDetail(c.id);
    grid.appendChild(el);
  });
}

/* ---------- TCGdex-Suche ---------- */
let searchTimer = null;
function onSearchInput(){
  clearTimeout(searchTimer);
  const inp = $("searchInput");
  const q = inp ? inp.value.trim() : '';
  if(q.length < 2){ if($("results")) $("results").innerHTML=""; if($("searchSpin")) $("searchSpin").classList.add("hidden"); return; }
  searchTimer = setTimeout(()=>runSearch(q), 380);
}

async function runSearch(q){
  if($("searchSpin")) $("searchSpin").classList.remove("hidden");
  if($("apiNotice")) $("apiNotice").classList.add("hidden");
  if($("results")) $("results").innerHTML = "";
  try{
    const res = await fetch(`${API}/cards?name=${encodeURIComponent(q)}`);
    if(!res.ok) throw new Error("HTTP "+res.status);
    const data = await res.json();
    if($("searchSpin")) $("searchSpin").classList.add("hidden");
    if(!Array.isArray(data) || data.length===0){
      if($("results")) $("results").innerHTML = `<div class="spin" style="grid-column:1/-1">Keine Treffer für „${esc(q)}“</div>`;
      return;
    }
    data.slice(0,36).forEach(card=>{
      const thumb = imgURL(card.image,"low");
      const el = document.createElement("button");
      el.className = "rcard";
      el.innerHTML = `
        <div class="imgwrap">${thumb
          ? `<img loading="lazy" src="${esc(thumb)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ph',textContent:'kein Bild'}))">`
          : `<div class="ph">kein Bild</div>`}</div>
        <div class="nm">${esc(card.name)}</div>
        <div class="id">${esc(card.id)}</div>`;
      el.onclick = ()=>pickCard(card.id);
      if($("results")) $("results").appendChild(el);
    });
  }catch(err){
    if($("searchSpin")) $("searchSpin").classList.add("hidden");
    if($("apiNotice")) $("apiNotice").classList.remove("hidden");
  }
}

async function pickCard(cardId){
  toast("Lade Kartendaten …");
  let detail = null;
  try{
    const res = await fetch(`${API}/cards/${encodeURIComponent(cardId)}`);
    if(res.ok) detail = await res.json();
  }catch(e){ /* Detailabruf optional – Basisdaten reichen */ }
  openForm({
    name:    detail?.name || cardId,
    set:     detail?.set?.name || "",
    number:  detail?.localId ? `${detail.localId}${detail?.set?.cardCount?.official ? "/"+detail.set.cardCount.official : ""}` : "",
    rarity:  detail?.rarity || "",
    apiId:   cardId,
    apiImage:detail?.image || null
  });
}

/* ---------- Formular (Erfassen / Bearbeiten) ---------- */
let formDraft = null;   // aktuelle Kartendaten im Formular
let editId = null;      // gesetzt, wenn ein Bestandseintrag bearbeitet wird
let photoData = null;   // DataURL des eigenen Fotos

function buildGradeChips(){
  const wrap = $("gradeChips");
  if(!wrap) return;
  wrap.innerHTML = "";
  for(let g=10; g>=1; g--){
    const b = document.createElement("button");
    b.className = "gchip";
    b.textContent = g;
    b.setAttribute("aria-pressed","false");
    b.onclick = ()=>setGrade(g);
    wrap.appendChild(b);
  }
}
function setGrade(g){
  formDraft.grade = g;
  const chips = $("gradeChips"); if(chips) [...chips.children].forEach(ch=>
    ch.setAttribute("aria-pressed", String(Number(ch.textContent)===g)));
  const gn = $("gradeName"); if(gn) gn.textContent = `${g} · ${GRADE_NAMES[g]}`;
}

function openForm(cardData, existing){
  editId = existing ? existing.id : null;
  formDraft = existing
    ? {...existing}
    : { name:cardData?.name||"", set:cardData?.set||"", number:cardData?.number||"",
        rarity:cardData?.rarity||"", apiId:cardData?.apiId||null, apiImage:cardData?.apiImage||null,
        grade:8 };
  photoData = existing?.photo || null;

  if($("formTitle")) $("formTitle").textContent = editId ? "Eintrag bearbeiten" : "Karte erfassen";
  if($("formSub")) $("formSub").textContent = formDraft.apiId ? `TCGdex · ${formDraft.apiId}` : "Manueller Eintrag";

  const manual = !formDraft.apiId;
  if($("manualFields")) $("manualFields").style.display = manual ? "block" : "none";
  if($("fName")) $("fName").value = formDraft.name || "";
  if($("fSet")) $("fSet").value  = formDraft.set || "";
  if($("fNum")) $("fNum").value  = formDraft.number || "";

  const thumb = photoData || imgURL(formDraft.apiImage,"low");
  if($("formPreview")) $("formPreview").innerHTML = `
    <div class="imgwrap">${thumb
      ? `<img src="${esc(thumb)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ph',textContent:'kein Bild'}))">`
      : `<div class="ph">kein Bild</div>`}</div>
    <div class="meta">
      <b>${esc(formDraft.name || "Neue Karte")}</b>
      <span>${esc(formDraft.set || "")}${formDraft.number? " · "+esc(formDraft.number):""}</span>
      ${formDraft.rarity? `<span>${esc(formDraft.rarity)}</span>`:""}
    </div>`;

  if($("fQty")) $("fQty").value = formDraft.qty || 1;
  if($("fBuy")) $("fBuy").value = formDraft.buy ?? "";
  if($("fVal")) $("fVal").value = formDraft.value ?? "";
  if($("fNote")) $("fNote").value = formDraft.note || "";
  buildGradeChips();
  setGrade(formDraft.grade || 8);

  if($("photoThumb")) { $("photoThumb").classList.toggle("hidden", !photoData); if(photoData) $("photoThumb").src = photoData; }
  if($("photoRemove")) $("photoRemove").classList.toggle("hidden", !photoData);

  if($("formBack")){
    $("formBack").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
}
function closeForm(){ if($("formBack")){ $("formBack").classList.add("hidden"); document.body.style.overflow = ""; } }

/* Foto: aufnehmen + komprimieren (max. 640 px, JPEG) */
function onPhoto(ev){
  const file = ev.target.files && ev.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e=>{
    const img = new Image();
    img.onload = ()=>{
      const MAX = 640;
      const scale = Math.min(1, MAX/Math.max(img.width,img.height));
      const cv = document.createElement("canvas");
      cv.width = Math.round(img.width*scale);
      cv.height = Math.round(img.height*scale);
      cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
      photoData = cv.toDataURL("image/jpeg",0.72);
      if($("photoThumb")) { $("photoThumb").src = photoData; $("photoThumb").classList.remove("hidden"); }
      if($("photoRemove")) $("photoRemove").classList.remove("hidden");
      toast("Foto hinzugefügt");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  ev.target.value = "";
}
function removePhoto(){ photoData = null; if($("photoThumb")) $("photoThumb").classList.add("hidden"); if($("photoRemove")) $("photoRemove").classList.add("hidden"); }

function saveCard(){
  // Manuelle Felder übernehmen
  if(!formDraft.apiId){
    if($("fName")) formDraft.name = $("fName").value.trim();
    if($("fSet")) formDraft.set = $("fSet").value.trim();
    if($("fNum")) formDraft.number = $("fNum").value.trim();
  }
  if(!formDraft.name){ toast("Bitte Kartennamen angeben"); if($("fName")) $("fName").focus(); return; }

  const entry = {
    id:       editId || (Date.now().toString(36)+Math.random().toString(36).slice(2,7)),
    name:     formDraft.name,
    set:      formDraft.set || "",
    number:   formDraft.number || "",
    rarity:   formDraft.rarity || "",
    apiId:    formDraft.apiId || null,
    apiImage: formDraft.apiImage || null,
    grade:    formDraft.grade || 8,
    qty:      Math.max(1, parseInt($("fQty").value,10)||1),
    buy:      $("fBuy").value==="" ? null : Math.max(0, parseFloat($("fBuy").value)||0),
    value:    $("fVal").value==="" ? 0 : Math.max(0, parseFloat($("fVal").value)||0),
    note:     $("fNote").value.trim(),
    photo:    photoData,
    added:    editId ? (collection.find(c=>c.id===editId)?.added || Date.now()) : Date.now()
  };

  if(editId){
    collection = collection.map(c=> c.id===editId ? entry : c);
    toast("Eintrag aktualisiert");
  }else{
    collection.push(entry);
    toast("Im Tresor gespeichert");
  }
  persist();
  closeForm();
  showView("coll");
  renderCollection();
}

/* ---------- Detail-Sheet ---------- */
function openDetail(id){
  const c = collection.find(x=>x.id===id);
  if(!c) return;
  const img = c.photo || imgURL(c.apiImage,"high") || imgURL(c.apiImage,"low");
  const totalVal = (Number(c.value)||0)*(c.qty||1);
  const pl = (c.buy!=null) ? (Number(c.value)||0) - Number(c.buy) : null;

  if($("detailBody")){
    $("detailBody").innerHTML = `
      <h2 id="dTitle">${esc(c.name)}</h2>
      <div class="sub">${esc(c.set||"")}${c.number? " · "+esc(c.number):""}${c.apiId? " · "+esc(c.apiId):""}</div>
      ${img? `<img class="bigimg" src="${esc(img)}" alt="${esc(c.name)}" onerror="this.remove()">`:""}
      <div class="kv"><span class="k">Zustand (Selbsteinschätzung)</span><span class="v gold">${c.grade} · ${GRADE_NAMES[c.grade]||""}</span></div>
      <div class="kv"><span class="k">Menge</span><span class="v">×${c.qty||1}</span></div>
      <div class="kv"><span class="k">Wert pro Karte</span><span class="v gold">${eur(c.value)}</span></div>
      <div class="kv"><span class="k">Gesamtwert</span><span class="v gold">${eur(totalVal)}</span></div>
      ${c.buy!=null? `<div class="kv"><span class="k">Kaufpreis</span><span class="v">${eur(c.buy)}</span></div>`:""}
      ${pl!=null? `<div class="kv"><span class="k">Gewinn / Verlust pro Karte</span><span class="v ${pl>=0?"ok":"bad"}">${pl>=0?"+":""}${eur(pl)}</span></div>`:""}
      ${c.rarity? `<div class="kv"><span class="k">Seltenheit</span><span class="v">${esc(c.rarity)}</span></div>`:""}
      ${c.added? `<div class="kv"><span class="k">Erfasst am</span><span class="v">${new Date(c.added).toLocaleDateString("de-DE")}</span></div>`:""}
      ${c.note? `<div class="kv"><span class="k">Notiz</span><span class="v" style="font-family:var(--sans)">${esc(c.note)}</span></div>`:""}
      <div class="actions">
        <button class="btn danger" onclick="deleteCard('${c.id}')">Löschen</button>
        <button class="btn ghost" onclick="editCard('${c.id}')">Bearbeiten</button>
        <button class="btn" onclick="openListing('${c.id}')">Verkaufen</button>
      </div>`;
  }
  if($("detailBack")){ $("detailBack").classList.remove("hidden"); document.body.style.overflow = "hidden"; }
}
function closeDetail(){ if($("detailBack")){ $("detailBack").classList.add("hidden"); document.body.style.overflow = ""; } }
function editCard(id){ const c = collection.find(x=>x.id===id); if(!c) return; closeDetail(); openForm(null, c); }
function deleteCard(id){ const c = collection.find(x=>x.id===id); if(!c) return; if(!confirm(`„${c.name}" wirklich aus dem Tresor löschen?`)) return; collection = collection.filter(x=>x.id!==id); persist(); closeDetail(); renderCollection(); toast("Gelöscht"); }

/* ---------- Export / Import ---------- */
function exportJSON(){
  if(collection.length===0){ toast("Tresor ist leer"); return; }
  downloadFile(
    [JSON.stringify({app:"CardVault", version:2, exported:new Date().toISOString(), cards:collection}, null, 2)],
    `cardvault-export-${new Date().toISOString().slice(0,10)}.json`, "application/json");
  meta.lastExport = Date.now(); persistMeta();
  updateBackupNotice(); closeExport();
  toast("Backup erstellt");
}
function importJSON(ev){
  const file = ev.target.files && ev.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e=>{
    try{
      const data = JSON.parse(e.target.result);
      const cards = Array.isArray(data) ? data : data.cards;
      if(!Array.isArray(cards)) throw new Error("Format");
      const valid = cards.filter(c=> c && c.name);
      if(valid.length===0) throw new Error("leer");
      if(!confirm(`${valid.length} Karten gefunden. Zum Tresor hinzufügen?`)) return;
      const existing = new Set(collection.map(c=>c.id));
      valid.forEach(c=>{
        if(!c.id || existing.has(c.id)) c.id = Date.now().toString(36)+Math.random().toString(36).slice(2,7);
        if(!c.grade) c.grade = 8;
        collection.push(c);
      });
      persist();
      renderCollection();
      toast(`${valid.length} Karten importiert`);
    }catch(err){
      toast("Import fehlgeschlagen – Datei prüfen");
    }
  };
  reader.readAsText(file);
  ev.target.value = "";
}

/* ---------- Master: Meta, Haptik, Export ---------- */
const META_KEY = "cardvault_meta_v1";
let meta = (function(){
  if(HAS_LS){ try{ return Object.assign({lastExport:0}, JSON.parse(localStorage.getItem(META_KEY))||{}); }catch(e){} }
  return {lastExport:0};
})();
function persistMeta(){ if(HAS_LS){ try{ localStorage.setItem(META_KEY, JSON.stringify(meta)); }catch(e){} } }
function buzz(p){ try{ if(navigator.vibrate) navigator.vibrate(p); }catch(e){} }
function updateBackupNotice(){
  const due = collection.length>=10 && (Date.now()-(meta.lastExport||0)) > 7*24*3600*1000;
  if($("backupNotice")) $("backupNotice").classList.toggle("hidden", !due);
}
function openExport(){ if(collection.length===0){ toast("Tresor ist leer"); return; } if($("exportBack")){ $("exportBack").classList.remove("hidden"); document.body.style.overflow = "hidden"; } }
function closeExport(){ if($("exportBack")){ $("exportBack").classList.add("hidden"); document.body.style.overflow = ""; } }
function downloadFile(content, name, type){
  const blob = new Blob(content, {type});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
}
function csvField(v){ return '"'+String(v??"").replace(/"/g,'""')+'"'; }
function csvNum(n){ return (n==null||n==="") ? "" : String(Number(n)).replace(".", ","); }
function exportCSV(){
  if(collection.length===0){ toast("Tresor ist leer"); return; }
  const head = ["Name","Set","Nummer","Seltenheit","Zustand (1-10)","Menge","Kaufpreis EUR","Wert EUR","Gesamtwert EUR","Notiz"];
  const rows = collection.map(c=>[
    csvField(c.name), csvField(c.set), csvField(c.number), csvField(c.rarity),
    c.grade, c.qty||1, csvNum(c.buy), csvNum(c.value),
    csvNum((Number(c.value)||0)*(c.qty||1)), csvField(c.note)
  ].join(";"));
  const csv = "\uFEFF"+head.join(";")+"\r\n"+rows.join("\r\n");
  downloadFile([csv], `cardvault-${new Date().toISOString().slice(0,10)}.csv`, "text/csv;charset=utf-8");
  meta.lastExport = Date.now(); persistMeta();
  updateBackupNotice(); closeExport();
  toast("CSV-Export erstellt");
}

/* ---------- Listing-Generator (Verkaufen) ---------- */
let listingCard = null;
let listingMode = "long";

function buildListing(c, mode){
  const gradeTxt = `${c.grade}/10 – ${GRADE_NAMES[c.grade]||""}`;
  if(mode==="short"){
    let t = `Zustand ${gradeTxt} (ehrliche Selbsteinschätzung, kein offizielles Grading).`;
    if(c.note) t += ` ${c.note}.`;
    t += " Versand sicher in Hülle & Toploader.";
    return { title:"", body:t };
  }
  const title = ([c.name, c.set, c.number].filter(Boolean).join(" · ") + ` – Zustand ${c.grade}/10`);
  const idLine = [c.set, c.number? "Nr. "+c.number : "", c.rarity].filter(Boolean).join(" · ");
  const lines = [
    c.name,
    idLine || null,
    "",
    `ZUSTAND (Selbsteinschätzung): ${gradeTxt}`,
    c.note? `Details: ${c.note}` : null,
    "Hinweis: Die Zustandsangabe ist meine ehrliche Selbsteinschätzung nach PSA-Skala, kein offizielles Grading. Die Fotos zeigen die tatsächlich angebotene Karte.",
    "",
    `Preis: ${eur(c.value)}${(c.qty||1)>1? ` pro Karte (${c.qty} verfügbar)` : ""}`,
    "Versand: sicher verpackt in Schutzhülle und Toploader.",
    "",
    "Privatverkauf – keine Garantie, Gewährleistung oder Rücknahme."
  ].filter(l=>l!==null);
  return { title, body: lines.join("\n") };
}
function openListing(id){
  const c = collection.find(x=>x.id===id);
  if(!c) return;
  listingCard = c;
  listingMode = "long";
  if($("lSub")) $("lSub").textContent = `${c.name}${c.set? " · "+c.set : ""}`;
  applyListing();
  closeDetail();
  if($("listingBack")){ $("listingBack").classList.remove("hidden"); document.body.style.overflow = "hidden"; }
}
function applyListing(){
  const l = buildListing(listingCard, listingMode);
  if($("lmLong")) $("lmLong").setAttribute("aria-pressed", String(listingMode==="long"));
  if($("lmShort")) $("lmShort").setAttribute("aria-pressed", String(listingMode==="short"));
  if($("lTitleField")) $("lTitleField").style.display = listingMode==="long" ? "block" : "none";
  if($("lTitleInput")) $("lTitleInput").value = l.title;
  if($("lBody")) $("lBody").value = l.body;
  updateCharCount();
}
function setListingMode(m){ listingMode = m; applyListing(); }
function updateCharCount(){ if(!$("lTitleInput")) return; const n = $("lTitleInput").value.length; const el = $("lCharCount"); if(el) { el.textContent = `${n}/80 Zeichen (eBay-Titel-Limit)`; el.classList.toggle("over", n>80); } }
function listingFullText(){
  const t = $("lTitleInput")? $("lTitleInput").value.trim() : '';
  const b = $("lBody")? $("lBody").value : '';
  return (listingMode==="long" && t) ? t+"\n\n"+b : b;
}
async function copyListing(){
  const text = listingFullText();
  try{
    await navigator.clipboard.writeText(text);
    toast("In Zwischenablage kopiert");
  }catch(e){
    const ta = $("lBody");
    if(ta){ ta.focus(); ta.select(); try{ document.execCommand("copy"); toast("Kopiert"); } catch(e2){ toast("Bitte Text manuell markieren"); } }
  }
}
async function shareListing(){ const text = listingFullText(); if(navigator.share){ try{ await navigator.share({ text }); }catch(e){} }else{ copyListing(); } }
function closeListing(){ if($("listingBack")){ $("listingBack").classList.add("hidden"); document.body.style.overflow = ""; } }

/* =====================================================
   ARENA – Deine Sammlung ist dein Deck
   Wert → Stärke · Zustand → Ausdauer · Seltenheit → Spezial
   Eigenständige Spielmechanik (kein TCG-Nachbau)
   ===================================================== */
const ARENA_KEY = "cardvault_arena_v1";
const ARENA_DEFAULTS = {w:0, l:0, streak:0, best:0, diff:"normal"};
const DIFF_MULT  = { leicht:0.94, normal:1, schwer:1.07 };
const DIFF_LABEL = { leicht:"LEICHT", normal:"NORMAL", schwer:"SCHWER" };
let arenaRecord = (function(){
  if(HAS_LS){ try{ return Object.assign({}, ARENA_DEFAULTS, JSON.parse(localStorage.getItem(ARENA_KEY))||{}); }catch(e){} }
  return Object.assign({}, ARENA_DEFAULTS);
})();
function setDiff(d){ if(!DIFF_MULT[d]) return; arenaRecord.diff = d; persistArena(); renderSetup(); }
function persistArena(){ if(HAS_LS){ try{ localStorage.setItem(ARENA_KEY, JSON.stringify(arenaRecord)); }catch(e){} } }

const TIER_FX = {
  0:{name:"–",           desc:"kein Spezialeffekt"},
  1:{name:"KRIT 20%",    desc:"20 % Chance auf doppelten Schaden"},
  2:{name:"GLANZSCHILD", desc:"erleidet 20 % weniger Schaden"},
  3:{name:"KRIT 30%",    desc:"30 % Chance auf doppelten Schaden"},
  4:{name:"LEBENSRAUB",  desc:"heilt 30 % des verursachten Schadens"}
};

/* Seltenheit → Spezial-Stufe (Schlüsselwörter, Fallback über Wert) */
function rarityTier(c){
  const r = (c.rarity||"").toLowerCase();
  if(/secret|gold|rainbow|hyper/.test(r)) return 4;
  if(/ultra|illustration|promo|spezial/.test(r)) return 3;
  if(/holo/.test(r)) return 2;
  if(/selten|rare|ungew/.test(r)) return 1;
  const v = Number(c.value)||0;
  if(v >= 100) return 3;
  if(v >= 25)  return 2;
  if(v >= 5)   return 1;
  return 0;
}

/* Sammlungs-Eintrag → Kämpfer */
function toFighter(c){
  const atk = 10 + Math.round(14 * Math.log10(1 + (Number(c.value)||0)));
  const hp  = 30 + (c.grade||5) * 9;
  return { name:c.name, set:c.set||"", img: c.photo || imgURL(c.apiImage,"low"),
           atk, hp, maxHp:hp, tier:rarityTier(c), ko:false };
}

/* Das Gefahren-Deck: alles, was Sammler fürchten */
const NPC_POOL = [
  {name:"Knickfalte"},{name:"Wasserschaden"},{name:"Sonnenbleiche"},
  {name:"Eselsohr"},{name:"Klebe-Rest"},{name:"Kratzer-Schwarm"},
  {name:"Schimmelfleck"},{name:"Preisaufkleber"},{name:"Grobe Hülle"},{name:"Fälschung"}
];
function makeEnemies(team){
  const n = team.length;
  const avgAtk = team.reduce((s,f)=>s+f.atk,0)/n;
  const avgHp  = team.reduce((s,f)=>s+f.maxHp,0)/n;
  const base = [0, 1.13, 1.08, 1.07][n] || 1.08; /* kalibriert auf ~60 % Siegquote (Normal) */
  const bias = base * (DIFF_MULT[arenaRecord.diff] || 1);
  const pool = [...NPC_POOL].sort(()=>Math.random()-0.5).slice(0,n);
  return pool.map(p=>{
    const atk = Math.max(6, Math.round(avgAtk*(bias-0.2+Math.random()*0.4)));
    const hp  = Math.max(30, Math.round(avgHp*(bias-0.2+Math.random()*0.4)/10)*10);
    const tier = Math.random()<0.25 ? 1 : (Math.random()<0.12 ? 2 : 0);
    return {name:p.name, set:"Gefahren-Deck", img:null, atk, hp, maxHp:hp, tier, ko:false};
  });
}

let deckSel = new Set();
let battle = null;

function renderArena(){
  if(battle && !battle.over) return renderFight();
  if(battle &&  battle.over) return renderEnd();
  renderSetup();
}

/* ----- Deck-Auswahl ----- */
function renderSetup(){
  const root = $("arenaRoot");
  deckSel = new Set([...deckSel].filter(id=>collection.some(c=>c.id===id)));
  if(!root) return;
  if(collection.length===0){
    root.innerHTML = `<div class="empty"><b>Kein Deck ohne Karten</b>
      Erfasse zuerst Karten im Tresor – dann treten sie hier an.
      <button class="btn" onclick="showView('add')">Karte hinzufügen</button></div>`;
    return;
  }
  let html = `
    <div class="arena-head">
      <div class="arena-rule">WERT → STÄRKE · ZUSTAND → AUSDAUER · SELTENHEIT → SPEZIAL</div>
      <div class="arena-rec">Bilanz: <b>${arenaRecord.w}</b> S · <b>${arenaRecord.l}</b> N</div>
    </div>
    <div class="arena-head">
      <span class="streak">Serie: ${arenaRecord.streak} · Rekord: ${arenaRecord.best}</span>
    </div>
    <div class="diffchips">
      <button aria-pressed="${arenaRecord.diff==='leicht'}" onclick="setDiff('leicht')">LEICHT</button>
      <button aria-pressed="${arenaRecord.diff==='normal'}" onclick="setDiff('normal')">NORMAL</button>
      <button aria-pressed="${arenaRecord.diff==='schwer'}" onclick="setDiff('schwer')">SCHWER</button>
    </div>
    <div class="hint">Wähle bis zu 3 Karten für dein Kampf-Deck. Dein Gegner: das Gefahren-Deck – alles, was Sammler fürchten.</div>
    <div class="deckgrid">`;
  collection.forEach(c=>{
    const f = toFighter(c);
    const sel = deckSel.has(c.id);
    html += `
      <button class="dcard ${sel?'sel':''}" onclick="toggleDeck('${c.id}')" aria-pressed="${sel}">
        <div class="band"><div class="nm">${esc(c.name)}</div><div class="grade">${c.grade}</div></div>
        <div class="dstats"><span>STÄRKE <b>${f.atk}</b></span><span>AUSDAUER <b>${f.maxHp}</b></span></div>
        <div class="fx t${f.tier}">${TIER_FX[f.tier].name}</div>
      </button>`;
  });
  html += `</div>
    <button class="btn block" style="margin-top:16px" ${deckSel.size? "":"disabled"} onclick="startBattle()">
      Kampf starten (${deckSel.size}/3)
    </button>`;
  root.innerHTML = html;
}
function toggleDeck(id){ if(deckSel.has(id)) deckSel.delete(id); else{ if(deckSel.size>=3){ toast("Maximal 3 Karten im Deck"); return; } deckSel.add(id); } renderSetup(); }

/* ----- Kampf ----- */
function startBattle(){
  const team = collection.filter(c=>deckSel.has(c.id)).map(toFighter);
  if(team.length===0){ battle=null; toast("Deck ist leer"); renderSetup(); return; }
  battle = {
    p:team, e:makeEnemies(team), pa:0, ea:0,
    shield:true, shieldUp:false, switching:false,
    log:["Das Gefahren-Deck fordert dich heraus!"],
    over:false, won:false, busy:false
  };
  renderFight();
}
function bLog(m){ battle.log.push(m); }
function alive(team){ return team.filter(f=>!f.ko).length; }
function hpClass(f){ const r=f.hp/f.maxHp; return r>0.5? "" : (r>0.25? "mid":"low"); }

function fighterPanel(f, side, hit){
  return `
   <div class="fighter ${side}${hit?' hit':''}">
     <div class="band">
       <div><div class="nm">${esc(f.name)}</div><span class="set">${esc(f.set)}</span></div>
       <div class="fx t${f.tier}" style="margin:0">${TIER_FX[f.tier].name}</div>
     </div>
     <div class="frow">
       ${f.img? `<img class="fimg" src="${esc(f.img)}" alt="" onerror="this.remove()">`:""}
       <div class="fdata">
         <div class="hpnum">${f.hp} / ${f.maxHp}</div>
         <div class="hpbar"><i class="${hpClass(f)}" style="width:${Math.max(0,100*f.hp/f.maxHp)}%"></i></div>
         <div class="statline">STÄRKE ${f.atk}</div>
       </div>
     </div>
   </div>`;
}
function benchHTML(){
  const items = battle.p.map((f,i)=>{
    if(i===battle.pa) return "";
    return `<button class="bchip ${f.ko?'ko':''}" ${f.ko||battle.busy?'disabled':''} onclick="doSwitch(${i})">${esc(f.name)} · ${f.ko?'✕':f.hp+' AUS'}</button>`;
  }).join("");
  return items? `<div class="benchrow">${items}</div>`:"";
}
function renderFight(){
  const b = battle;
  const hitE = b.hitE, hitP = b.hitP;
  b.hitE = b.hitP = false;
  const logHtml = b.log.slice(-6).map(l=>`<div>› ${esc(l)}</div>`).join("");
  if($("arenaRoot")) $("arenaRoot").innerHTML = `
    ${fighterPanel(b.e[b.ea],"enemy",hitE)}
    <div class="blog" id="blog">${logHtml}</div>
    ${fighterPanel(b.p[b.pa],"me",hitP)}
    ${b.switching? benchHTML():""}
    <div class="abtns">
      <button class="btn" ${b.busy?'disabled':''} onclick="doAttack()">Angriff</button>
      <button class="btn ghost" ${b.busy||alive(b.p)<2?'disabled':''} onclick="toggleSwitch()">Wechseln</button>
      <button class="btn ghost" ${b.busy||!b.shield?'disabled':''} onclick="doShield()">Hülle ${b.shield?'(1×)':'✓'}</button>
    </div>
    <button class="btn danger block" style="margin-top:12px" ${b.busy?'disabled':''} onclick="fleeBattle()">Aufgeben</button>`;
  const lg = $("blog"); if(lg) lg.scrollTop = lg.scrollHeight;
}

function calcHit(att, def){
  let d = att.atk * (0.85 + Math.random()*0.3);
  const cc = att.tier===1 ? 0.2 : (att.tier===3 ? 0.3 : 0);
  const crit = Math.random() < cc;
  if(crit) d *= 2;
  if(def.tier===2) d *= 0.8;
  return { d: Math.max(1, Math.round(d)), crit };
}

function playerStrike(){
  const b = battle, me = b.p[b.pa], en = b.e[b.ea];
  const hit = calcHit(me, en);
  en.hp = Math.max(0, en.hp - hit.d);
  b.hitE = true; buzz(12);
  bLog(`${me.name} trifft ${en.name}: −${hit.d}${hit.crit?' KRITISCH!':''}`);
  if(me.tier===4 && hit.d>0){
    const h = Math.round(hit.d*0.3);
    me.hp = Math.min(me.maxHp, me.hp+h);
    bLog(`${me.name} heilt +${h} (Lebensraub)`);
  }
  if(en.hp<=0){
    en.ko = true;
    bLog(`${en.name} ist erledigt!`);
    const next = b.e.findIndex(f=>!f.ko);
    if(next<0){ endBattle(true); return false; }
    b.ea = next;
    bLog(`Das Gefahren-Deck schickt ${b.e[next].name} – Konter folgt!`);
  }
  return true;
}
function doAttack(){ const b = battle; if(!b||b.busy||b.over) return; b.switching = false; b.busy = true; if(!playerStrike()) return; renderFight(); setTimeout(enemyTurn, 700); }
function toggleSwitch(){ battle.switching = !battle.switching; renderFight(); }
function doSwitch(i){
  const b = battle; if(!b||b.busy||b.over||b.p[i].ko||i===b.pa) return;
  b.switching = false; b.busy = true;
  b.pa = i;
  bLog(`${b.p[i].name} springt ein und greift sofort an!`);
  if(!playerStrike()) return;
  renderFight();
  setTimeout(enemyTurn, 700);
}
function doShield(){ const b = battle; if(!b||b.busy||b.over||!b.shield) return; b.switching = false; b.busy = true; b.shield = false; b.shieldUp = true; bLog("Du legst die Schutzhülle an – der nächste Treffer prallt ab."); renderFight(); setTimeout(enemyTurn, 700); }
function enemyTurn(){
  const b = battle; if(!b||b.over) return;
  const en = b.e[b.ea], me = b.p[b.pa];
  if(b.shieldUp){
    b.shieldUp = false;
    const reflect = Math.max(1, Math.round(en.atk*0.5));
    en.hp = Math.max(0, en.hp - reflect);
    b.hitE = true; buzz(12);
    bLog(`${en.name} greift an – prallt an der Hülle ab! Konter: −${reflect}`);
    if(en.hp<=0){ en.ko = true; bLog(`${en.name} ist erledigt!`); const next = b.e.findIndex(f=>!f.ko); if(next<0) return endBattle(true); b.ea = next; bLog(`Das Gefahren-Deck schickt ${b.e[next].name}!`); }
  }else{
    const hit = calcHit(en, me);
    me.hp = Math.max(0, me.hp - hit.d);
    b.hitP = true; buzz(18);
    bLog(`${en.name} greift an: −${hit.d}${hit.crit?' KRITISCH!':''}`);
    if(me.hp<=0){ me.ko = true; bLog(`${me.name} ist kampfunfähig!`); const next = b.p.findIndex(f=>!f.ko); if(next<0) return endBattle(false); b.pa = next; bLog(`${b.p[next].name} springt ein!`); }
  }
  b.busy = false;
  renderFight();
}
function endBattle(won){
  battle.over = true; battle.won = won; battle.busy = false;
  if(won){
    arenaRecord.w++;
    arenaRecord.streak++;
    if(arenaRecord.streak > arenaRecord.best) arenaRecord.best = arenaRecord.streak;
    buzz([30,60,30]);
  }else{
    arenaRecord.l++;
    arenaRecord.streak = 0;
    buzz(80);
  }
  persistArena();
  renderEnd();
}
function renderEnd(){
  const b = battle;
  if($("arenaRoot")) $("arenaRoot").innerHTML = `
    <div class="endpanel ${b.won?'win':'lose'}">
      <div class="endword">${b.won? 'SIEG':'NIEDERLAGE'}</div>
      <p>${b.won? 'Deine Sammlung hat das Gefahren-Deck abgewehrt.':'Das Gefahren-Deck war diesmal stärker – Revanche?'}</p>
      <div class="arena-rec">Bilanz: <b>${arenaRecord.w}</b> Siege · <b>${arenaRecord.l}</b> Niederlagen · ${DIFF_LABEL[arenaRecord.diff]||""}</div>
      <div class="streak" style="margin-top:6px">Serie: ${arenaRecord.streak} · Rekord: ${arenaRecord.best}</div>
      <div class="actions">
        <button class="btn ghost" onclick="battle=null;renderArena()">Deck ändern</button>
        <button class="btn" onclick="startBattle()">Nochmal kämpfen</button>
      </div>
    </div>`;
}
function fleeBattle(){ if(!battle||battle.over) return; if(!confirm("Kampf wirklich aufgeben? Zählt als Niederlage.")) return; endBattle(false); }

/* ---------- PWA: Icon & Manifest zur Laufzeit (Einzeldatei-kompatibel) ---------- */
(function(){
  try{
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>"+
      "<rect width='100' height='100' rx='22' fill='#15171C'/>"+
      "<rect x='15' y='18' width='70' height='16' rx='4' fill='#F4F2EC'/>"+
      "<text x='50' y='80' font-family='monospace' font-size='36' font-weight='bold' fill='#E6B450' text-anchor='middle'>CV</text></svg>";
    const icon = "data:image/svg+xml,"+encodeURIComponent(svg);
    const ic = document.createElement("link"); ic.rel = "icon"; ic.href = icon;
    document.head.appendChild(ic);
    const man = { name:"CardVault", short_name:"CardVault", display:"standalone",
      background_color:"#15171C", theme_color:"#15171C", start_url:'.',
      icons:[{ src:icon, sizes:"any", type:"image/svg+xml", purpose:"any" }] };
    const lm = document.createElement("link"); lm.rel = "manifest";
    lm.href = URL.createObjectURL(new Blob([JSON.stringify(man)], {type:"application/json"}));
    document.head.appendChild(lm);
  }catch(e){ /* optional */ }
}());

/* ---------- Start ---------- */
if(!HAS_LS && $("storageNotice")) $("storageNotice").classList.remove("hidden");
renderCollection();
