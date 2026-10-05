'use strict';
const $ = s => document.querySelector(s);
const DRAFT_KEY = 'kiwari:deck:'+location.pathname;
const channel = 'BroadcastChannel' in window ? new BroadcastChannel(DRAFT_KEY) : null;
const isPresenter = new URLSearchParams(location.search).has('presenter');
let deck, original, index=0, timerStart=0, elapsed=0, timerRunning=false, saveTimer;
const mathErrors = [];
let mathRenderSerial=0;
const escapeHTML = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function markdown(s,inline=false) {
  const code=SlideFormatting.protectCode(String(s??''));
  const formulas=[];
  const mathKey=`KIWARIMATH${mathRenderSerial++}X`;
  let protectedText=code.text.replace(/\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g,(all,block,small)=>{
    const key=`${mathKey}${formulas.length}TOKEN`;
    const tex=block??small;
    let html;
    try {html=paperMath(tex,block!==undefined);}
    catch(e) {mathErrors.push({tex,error:e.message});html=`<span class="math-error">${escapeHTML(tex)}</span>`;}
    formulas.push(html); return key;
  });
  const formatting=SlideFormatting.prepare(protectedText,markdown);
  protectedText=formatting.text;
  // Disable raw HTML while retaining Markdown's blockquote syntax.
  protectedText=protectedText.replace(/</g,'&lt;');
  let html=inline?marked.parseInline(protectedText):marked.parse(protectedText);
  html=formatting.restore(html);
  html=html.replace(new RegExp(mathKey+'(\\d+)TOKEN','g'),(_,n)=>formulas[Number(n)]);
  html=code.restore(html);
  const node=document.createElement('div');node.innerHTML=html;
  SlideFormatting.alignRows(node);
  node.querySelectorAll('a').forEach(a=>{if(!/^(https?:|mailto:|#|\.\.?\/)/i.test(a.getAttribute('href')||''))a.removeAttribute('href');a.rel='noopener noreferrer';});
  return node.innerHTML;
}
function validDeck(d,allowEmptyTitles=false) {
  if(!d || !d.meta || !Array.isArray(d.slides) || !d.slides.length)throw Error('YAML needs meta and a nonempty slides list.');
  const seen=new Set();
  for(const s of d.slides){
    if(!s.id||typeof s.id!=='string'||seen.has(s.id))throw Error('Each slide needs a unique text id.');
    seen.add(s.id);
    for(const k of ['title','body','statement','statement_label','code','code_title','code_result','code_file','central_message','transition','notes','kicker','nav_title','source','source_url','visual','layout','class'])if(s[k]!=null&&typeof s[k]!=='string')throw Error(`Slide ${s.id}: ${k} must be text.`);
    if(s.visual_text!=null&&(typeof s.visual_text!=='object'||Array.isArray(s.visual_text)||Object.values(s.visual_text).some(v=>typeof v!=='string')))throw Error(`Slide ${s.id}: diagram text must map labels to text.`);
    if(!s.title&&!(allowEmptyTitles&&typeof s.title==='string'))throw Error(`Slide ${s.id} needs a title.`);
    if(s.minutes!=null&&(!Number.isFinite(Number(s.minutes))||Number(s.minutes)<0))throw Error(`Slide ${s.id}: minutes must be nonnegative.`);
    SlideLayout.validate(s.design);
  }
  return d;
}
function toast(text){$('#toast').textContent=text;$('#toast').style.display='block';setTimeout(()=>$('#toast').style.display='none',3500);}
function slideContent(s){
  const custom=SlideLayout.custom(s);
  if(!custom&&(s.class||'').split(' ').includes('property-highlights'))return `<div class="property-grid">${SlideLayout.blocks(s.body).map(part=>`<section class="property-card">${markdown(part)}</section>`).join('')}</div>`;
  const body=!custom&&(s.class||'').split(' ').includes('square-map-note')?s.body.split(/\n\s*---\s*\n/)[0]:s.body;
  if(!custom&&(s.class||'').split(' ').includes('blowup-data')){
    const [intro,nw,ne,sw,se]=s.body.split(/\n\s*---\s*\n/);
    const horizontal=name=>`<div class="square-arrow horizontal" aria-label="${name}">${FigureText.render('square-arrow-'+name,s)}<svg viewBox="0 0 60 16" aria-hidden="true"><path d="M2 8H55m-7-6 7 6-7 6"/></svg></div>`;
    const vertical=name=>`<div class="square-arrow vertical" aria-label="${name}">${FigureText.render('square-arrow-'+name,s)}<svg viewBox="0 0 16 36" aria-hidden="true"><path d="M8 1V32m-6-7 6 7 6-7"/></svg></div>`;
    const card=(text,corner)=>`<section class="square-corner ${corner}">${markdown(text||'')}${corner==='nw'?'<svg class="square-cartesian" viewBox="0 0 20 20" aria-label="Cartesian"><path d="M2 18H18V2"/></svg>':''}</section>`;
    return `<div class="square-intro">${markdown(intro)}</div><div class="blowup-corners" role="group" aria-label="Blowup square with cohomology rings and class maps">${card(nw,'nw')}${horizontal('j')}${card(ne,'ne')}${vertical('p')}<div></div>${vertical('\\pi')}${card(sw,'sw')}${horizontal('i')}${card(se,'se')}</div>`;
  }
  if(!custom&&(s.class||'').split(' ').includes('presentation-comparison')){
    const [intro,left]=s.body.split(/\n\s*---\s*\n/);
    return `<div class="comparison-intro">${markdown(intro)}</div><div class="presentation-columns"><section>${markdown(left)}</section><section><p class="comparison-heading">${escapeHTML(s.statement_label)}</p>${markdown(s.statement)}</section></div>`;
  }
  const columns=['columns-2','columns-3'].includes(s.design?.preset);
  const html=(columns?`<div class="editor-columns">${SlideLayout.blocks(body).map(part=>`<section class="editor-column">${markdown(part)}</section>`).join('')}</div>`:markdown(body)).replace('<p>PROOFEXCISION</p>',()=>FigureText.render('additive-proof-excision',s)).replace('<p>PROOFTANG</p>',()=>FigureText.render('additive-proof-tang',s));
  if(!s.statement)return html;
  if((s.class||'').split(' ').includes('paired-statements')) {
    const quotes=s.statement.split(/\n\s*---\s*\n/).map(block=>{
      const lines=block.trim().split('\n'),label=lines.shift().replace(/^###\s*/, '');
      return `<section class="paper-statement"><div class="statement-label">${escapeHTML(label)}</div><div class="statement-text">${markdown(lines.join('\n'))}</div></section>`;
    }).join('');
    return html.includes('<p>PAPERSTATEMENT</p>')?html.replace('<p>PAPERSTATEMENT</p>',quotes):html+quotes;
  }
  const parts=s.statement_ref==='3.9'?s.statement.split(/(?=\*\*\((?:i|ii|iii|iv)\)\*\*)/):[];
  const statementHTML=parts.length===5?`<div class="theorem-setup">${markdown(parts[0])}</div><div class="theorem-relations">${parts.slice(1).map(part=>`<div>${markdown(part)}</div>`).join('')}</div>`:markdown(s.statement);
  const quote=`<section class="paper-statement"><div class="statement-label">${escapeHTML(s.statement_label??'Paper statement')}</div><div class="statement-text">${statementHTML}</div></section>`;
  return html.includes('<p>PAPERSTATEMENT</p>')?html.replace('<p>PAPERSTATEMENT</p>',quote):html+quote;
}
function renderCode(s){
  const preset=M2Live.presetFor(s);
  return `<section class="code-panel"><div class="code-title">${escapeHTML(s.code_title??'Macaulay2')}</div><pre><code>${escapeHTML(s.code)}</code></pre>${preset?M2Live.controls(preset,s.code_result):''}</section>`;
}
function renderSlide(s,i){
  const mapNote=(s.class||'').split(' ').includes('square-map-note')?`<div class="square-map-caption">${markdown(s.body.split(/\n\s*---\s*\n/)[1]||'')}</div>`:'';
  const visual=(s.code?renderCode(s):(FigureText.render(s.visual||'',s)))+mapNote;
  const title=markdown(s.title,true);
  const titleLayout=['title','section','problem'].includes(s.layout);
  const header=`<p class="eyebrow">${markdown(s.kicker??'',true)}</p><h1>${title}</h1>`;
  return SlideLayout.decorate(`<div class="top-rail"></div><div class="transom"></div><div class="bottom-rail"></div>${titleLayout?'':header}<div class="slide-grid"><div class="slide-body">${titleLayout?header:''}<div class="slide-content">${slideContent(s)}</div></div>${visual?`<div class="visual ${titleLayout?'title-art':''}">${visual}</div>`:''}</div><footer class="slide-footer"><span class="slide-number">${String(i+1).padStart(2,'0')}</span></footer>`,s);
}
function classes(s){return 'slide layout-'+(['standard','title','split','theorem','result','closing','section','problem'].includes(s.layout)?s.layout:'standard')+' '+SlideLayout.baseClass(s).replace(/[^a-zA-Z0-9 -]/g,'')+' '+SlideLayout.classNames(s);}
function render(){
  const s=deck.slides[index]; const el=$('#slide');el.className=classes(s);el.style.cssText=SlideLayout.style(s);el.innerHTML=renderSlide(s,index);
  $('#slide-counter').textContent=`${index+1} / ${deck.slides.length}`;
  $('#section-label').innerHTML=['section','problem'].includes(s.layout)?'':markdown(s.kicker||'',true);
  updateSectionNav();
  $('#previous').disabled=index===0;$('#next').disabled=index===deck.slides.length-1;
  $('#progress').setAttribute('aria-valuemax',deck.slides.length);$('#progress').setAttribute('aria-valuenow',index+1);
  $('#progress i').style.width=`${(index+1)/deck.slides.length*100}%`;
  $('#edit-select').value=s.id;
  updateSpeaker();if(!$('#editor').hidden)fillEditor();resize();
  window.__deck=deck;window.__mathErrors=mathErrors;
  M2Live.refresh();const m2Preset=M2Live.presetFor(s);document.body.classList.toggle('has-m2',!!m2Preset);$('#m2-button').hidden=true;if(m2Preset)$('#m2-button').onclick=()=>window.open('m2/?preset='+m2Preset,'_blank','noopener');
}
function go(i,broadcast=true){index=Math.max(0,Math.min(deck.slides.length-1,i));history.replaceState(null,'','#'+encodeURIComponent(deck.slides[index].id));render();DeckHistory.visit();if(broadcast)channel?.postMessage({type:'navigate',id:deck.slides[index].id});}
function resize(){
  const stage=$('#stage');const chrome=document.fullscreenElement?0:66;
  const availableW=Math.max(150,stage.clientWidth-(document.fullscreenElement?0:48));
  const availableH=Math.max(100,stage.clientHeight-chrome-34);
  const scale=Math.min(availableW/1280,availableH/720);
  $('#slide-viewport').style.width=1280*scale+'px';$('#slide-viewport').style.height=720*scale+'px';$('#slide').style.transform=`scale(${scale})`;
}
function fillStatementTitles(){
  const s=deck.slides[index];
  const paired=(s.class||'').split(' ').includes('paired-statements');
  const titles=paired?(s.statement||'').split(/\n\s*---\s*\n/).map(block=>block.trim().split('\n')[0].replace(/^###\s*/,'')):[s.statement_label??''];
  const fields=$('#edit-statement-titles');fields.replaceChildren();
  titles.forEach((title,n)=>{
    const label=document.createElement('label');
    label.textContent=paired?`Statement ${n+1} title`:'Statement title';
    const input=document.createElement('input');input.type='text';input.value=title;
    input.id=paired?`edit-statement-label-${n+1}`:'edit-statement-label';
    input.placeholder=paired?'Definition, Theorem, Proposition…':'Paper statement';
    input.addEventListener('input',()=>{
      if(paired){
        // Retain every separator and the statement body exactly as entered.
        const parts=(s.statement||'').split(/(\n\s*---\s*\n)/);
        const block=parts[n*2];
        parts[n*2]=block.trim()?block.replace(/^(\s*)[^\n]*/,(_,space)=>space+'### '+input.value):'### '+input.value;
        s.statement=parts.join('');$('#edit-statement').value=s.statement;
      }else s.statement_label=input.value;
      previewEdit();
    });
    label.append(input);fields.append(label);
  });
}
function previewEdit(){
  const s=deck.slides[index];
  $('#slide').className=classes(s);$('#slide').style.cssText=SlideLayout.style(s);$('#slide').innerHTML=renderSlide(s,index);
  updateSpeaker();save();resize();M2Live.refresh();EditorTools.afterPreview();
}
function fillEditor(){let s=deck.slides[index];for(const k of ['title','kicker','nav_title','layout','minutes','body','statement','code_title','code','code_result','visual','notes'])$('#edit-'+k).value=s[k]??(k==='layout'?'standard':k==='minutes'?1:'');fillStatementTitles();FigureText.fill(s);EditorTools.fill(s);}
function sectionEntries(){return deck.slides.map((s,i)=>({s,i})).filter(({s})=>s.layout==='section');}
function sectionPlainTitle(title){return title.replace(/\$\\overline M_\{0,n\}\$/g,'M̄₀,ₙ').replace(/\$/g,'');}
function rebuildSectionNav(){
  const entries=sectionEntries();
  $('#section-nav').hidden=entries.length===0;
  document.body.classList.toggle('has-sections',entries.length>0);
  $('#section-links').replaceChildren();$('#section-select').replaceChildren();
  const prompt=document.createElement('option');prompt.value='';prompt.textContent='Choose a section';prompt.disabled=true;$('#section-select').append(prompt);
  entries.forEach(({s},n)=>{
    const label=`${n}. ${sectionPlainTitle(s.nav_title||s.title)}`;
    const button=document.createElement('button');button.type='button';button.dataset.slideId=s.id;
    button.title=label;button.setAttribute('aria-label',label);
    button.innerHTML=`<span class="section-index">${n}</span><span>${markdown(s.nav_title||s.title,true)}</span>`;
    button.onclick=()=>go(deck.slides.findIndex(x=>x.id===s.id));$('#section-links').append(button);
    const option=document.createElement('option');option.value=s.id;option.textContent=label;$('#section-select').append(option);
  });
  updateSectionNav();
}
function updateSectionNav(){
  const active=sectionEntries().filter(({i})=>i<=index).pop()?.s.id;
  $('#section-links').querySelectorAll('button').forEach(button=>{
    const current=button.dataset.slideId===active;button.classList.toggle('current',current);
    if(current)button.setAttribute('aria-current','location');else button.removeAttribute('aria-current');
  });
  $('#section-select').value=active||'';
}
function rebuildSelect(){const sel=$('#edit-select');sel.innerHTML='';deck.slides.forEach((s,i)=>{const o=document.createElement('option');o.value=s.id;o.textContent=`${i+1}. ${s.title.replace(/\$/g,'')}`;sel.append(o);});rebuildSectionNav();}
function save(label){DeckHistory.capture(label);DeckStorage.changed();clearTimeout(saveTimer);saveTimer=setTimeout(()=>channel?.postMessage(DeckStorage.message()),250);}
function toggleEditor(force){const visible=force??$('#editor').hidden;$('#editor').hidden=!visible;$('#edit-button').setAttribute('aria-pressed',String(visible));if(visible)fillEditor();resize();}
function updateSpeaker(){const s=deck.slides[index];$('#speaker-title').innerHTML=markdown(s.title,true);$('#speaker-notes').innerHTML=markdown(s.notes||'No speaker notes yet.');const before=deck.slides.slice(0,index).reduce((a,x)=>a+Number(x.minutes||0),0);$('#timing').textContent=['section','problem'].includes(s.layout)?`${s.layout==='section'?'Section title':'Problem'} · planned ${before.toFixed(1)} min`:`${s.minutes||0} min on this slide · planned ${before.toFixed(1)}–${(before+Number(s.minutes||0)).toFixed(1)} min`;$('#up-next').innerHTML=deck.slides[index+1]?markdown(deck.slides[index+1].title,true):'End of deck';}
function overview(){const grid=$('#overview-grid');grid.innerHTML='';deck.slides.forEach((s,i)=>{const b=document.createElement('button');b.className=i===index?'current':'';b.innerHTML=`<small>${String(i+1).padStart(2,'0')} · ${s.layout==='section'?'SECTION':s.layout==='problem'?'PROBLEM':`${s.minutes} MIN`} · ${markdown(s.kicker||'',true)}</small>${markdown(s.title,true)}`;b.onclick=()=>{go(i);$('#overview').close();};grid.append(b);});$('#overview').showModal();}
function exportYAML(){const txt='# Edit Markdown and LaTeX inside the block fields below.\n'+jsyaml.dump(deck,{lineWidth:100,noRefs:true,sortKeys:false});const blob=new Blob([txt],{type:'text/yaml;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(deck.meta.slug||'deck')+'.yaml';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('YAML copy exported.');}
function preparePrint(){$('#print-deck').innerHTML=deck.slides.map((s,i)=>`<article class="${classes(s)}" style="${SlideLayout.style(s)}">${renderSlide(s,i)}</article>`).join('');}
function setTheme(value,broadcast=true){document.documentElement.dataset.time=value;document.querySelectorAll('.conics-frame').forEach(f=>f.contentWindow?.postMessage({type:'conics-theme',value},location.origin==='null'?'*':location.origin));$('#theme-button').textContent=value[0].toUpperCase()+value.slice(1);if(broadcast)channel?.postMessage({type:'theme',value});}
function setup(){
  $('#previous').onclick=()=>go(index-1);$('#next').onclick=()=>go(index+1);
  $('#section-select').onchange=e=>go(deck.slides.findIndex(s=>s.id===e.target.value));
  $('#overview-button').onclick=overview;$('#edit-button').onclick=()=>toggleEditor();$('#close-editor').onclick=()=>toggleEditor(false);
  $('#theme-button').onclick=()=>{const modes=['day','dusk','night'];setTheme(modes[(modes.indexOf(document.documentElement.dataset.time)+1)%3]);};
  $('#fullscreen-button').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.body.requestFullscreen().catch(()=>toast('Fullscreen is unavailable in this browser.'));};
  $('#presenter-button').onclick=()=>{const url=new URL(location.href);url.searchParams.set('presenter','1');const w=window.open(url,'kiwari-presenter','width=1400,height=850');if(!w)toast('Allow a popup to open the presenter window.');};
  $('#print-button').onclick=()=>{preparePrint();document.fonts.ready.then(()=>window.print());};window.addEventListener('beforeprint',preparePrint);
  $('#help-button').onclick=()=>$('#help').showModal();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).close());
  $('#edit-select').onchange=e=>go(deck.slides.findIndex(s=>s.id===e.target.value));
  for(const k of ['title','kicker','nav_title','layout','minutes','body','statement','code_title','code','code_result','visual','notes'])$('#edit-'+k).addEventListener('input',e=>{deck.slides[index][k]=k==='minutes'?Number(e.target.value):e.target.value;if(k==='statement')fillStatementTitles();if(['visual','body','code'].includes(k))FigureText.fill(deck.slides[index]);previewEdit();if(['title','layout','nav_title'].includes(k)){rebuildSelect();$('#edit-select').value=deck.slides[index].id;}});
  $('#export-yaml').onclick=exportYAML;$('#import-yaml').onclick=()=>$('#import-file').click();
  $('#import-file').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;const d=validDeck(jsyaml.load(await f.text()));deck=d;index=0;rebuildSelect();go(0);save();toast('Deck imported.');}catch(err){toast('Import failed: '+err.message);}e.target.value='';};
  DeckStorage.setup();
  EditorTools.setup();
  setupFormattingHelp();
  $('#add-slide').onclick=()=>EditorTools.add();
  $('#duplicate-slide').onclick=()=>EditorTools.duplicate();
  $('#delete-slide').onclick=()=>EditorTools.remove();
  $('#timer-toggle').onclick=()=>{if(timerRunning){elapsed+=Date.now()-timerStart;timerRunning=false;}else{timerStart=Date.now();timerRunning=true;}$('#timer-toggle').textContent=timerRunning?'Pause':'Start';};
  $('#timer-reset').onclick=()=>{elapsed=0;timerStart=Date.now();};setInterval(()=>{const t=Math.floor((elapsed+(timerRunning?Date.now()-timerStart:0))/1000);$('#timer').textContent=`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;},500);
  $('#blank-screen').onclick=()=>$('#blank-screen').hidden=true;
  document.addEventListener('click',e=>{const b=e.target.closest('[data-fgl]');if(!b)return;const tex={chow:'F(x,y)=x+y',k:'F(x,y)=x+y-\\beta xy',omega:'F(x,y)=x+y+\\sum a_{ij}x^iy^j'}[b.dataset.fgl];$('#fgl-output').innerHTML=katex.renderToString(tex,{displayMode:true});document.querySelectorAll('[data-fgl]').forEach(n=>n.classList.toggle('active',n===b));});
  document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||document.querySelector('dialog[open]'))return;const k=e.key.toLowerCase();if(e.target.closest('button,a')&&[' ','enter'].includes(k))return;if(['arrowright','pagedown',' '].includes(k)){e.preventDefault();go(index+1);}else if(['arrowleft','pageup'].includes(k)){e.preventDefault();go(index-1);}else if(k==='home'){e.preventDefault();go(0);}else if(k==='end'){e.preventDefault();go(deck.slides.length-1);}else if(k==='o')overview();else if(k==='e')toggleEditor();else if(k==='p')$('#presenter-button').click();else if(k==='t')$('#theme-button').click();else if(k==='f')$('#fullscreen-button').click();else if(k==='b')$('#blank-screen').hidden=!$('#blank-screen').hidden;else if(k==='?')$('#help').showModal();});
  let touchX=0;$('#stage').addEventListener('touchstart',e=>touchX=e.changedTouches[0].clientX,{passive:true});$('#stage').addEventListener('touchend',e=>{if(e.target.closest('button'))return;const d=e.changedTouches[0].clientX-touchX;if(Math.abs(d)>70)go(index+(d<0?1:-1));},{passive:true});
  window.addEventListener('resize',resize);document.addEventListener('fullscreenchange',resize);new ResizeObserver(resize).observe($('#stage'));
  window.addEventListener('hashchange',()=>{const i=deck.slides.findIndex(s=>s.id===decodeURIComponent(location.hash.slice(1)));if(i>=0)go(i);});
  channel?.addEventListener('message',e=>{const m=e.data;if(m.type==='navigate'){const i=deck.slides.findIndex(s=>s.id===m.id);if(i>=0)go(i,false);}else if(m.type==='deck'){const id=deck.slides[index].id;deck=validDeck(m.deck,true);rebuildSelect();go(Math.max(0,deck.slides.findIndex(s=>s.id===id)),false);DeckStorage.receive(m);DeckHistory.reset();EditorTools.refresh(true);}else if(m.type==='deck-saved'){DeckStorage.receive(m);}else if(m.type==='theme')setTheme(m.value,false);});
}
async function init(){
  try{
    const loaded=await DeckStorage.load();original=loaded.original;deck=loaded.deck;
    document.title=deck.meta.title+' · Michael R. Zeng';
    if(isPresenter){document.body.classList.add('presenter');$('#speaker').hidden=false;}
    for(const [v,f] of Object.entries(FIGURES)){const o=document.createElement('option');o.value=v;o.textContent=f.label;$('#edit-visual').append(o);}
    rebuildSelect();setup();const i=deck.slides.findIndex(s=>s.id===decodeURIComponent(location.hash.slice(1)));go(i<0?0:i,false);
    await document.fonts.ready;resize();window.__ready=true;
  }catch(e){$('#slide').innerHTML=`<p class="loading">Could not open the deck.<br>${escapeHTML(e.message)}<br><small>Serve this folder over HTTP, or regenerate deck-data.js for a local file preview.</small></p>`;console.error(e);}
}
init();
