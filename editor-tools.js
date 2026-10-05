/* Deck organization, undo/redo, and editable layout controls. No server mutations
   happen until the author chooses Save to server. */
'use strict';
window.DeckHistory=(()=>{
  let entries=[],at=-1,restoring=false,lastKey='',lastTime=0;
  const snapshot=()=>({data:JSON.stringify(deck),id:deck.slides[index]?.id,label:''});
  function buttons(){document.querySelectorAll('[data-history]').forEach(b=>{const undo=b.dataset.history==='undo';b.disabled=undo?at<=0:at>=entries.length-1;b.title=undo?(at>0?'Undo '+entries[at].label:'Nothing to undo'):(at<entries.length-1?'Redo '+entries[at+1].label:'Nothing to redo');});}
  function reset(){entries=[snapshot()];at=0;lastKey='';buttons();}
  function visit(){if(entries[at]?.data===JSON.stringify(deck))entries[at].id=deck.slides[index]?.id;}
  function capture(label){
    if(restoring)return;
    if(at<0){reset();return;}
    const next=snapshot();if(next.data===entries[at].data){buttons();return;}
    const el=document.activeElement;
    const key=!label&&el?.matches('input,textarea,select')?(el.id||el.dataset.panelInput||el.dataset.figureText||'field')+':'+next.id:'';
    const merge=key&&key===lastKey&&Date.now()-lastTime<700&&at===entries.length-1&&at>0;
    next.label=label||'edit slide';entries.splice(at+1);
    if(merge)entries[at]=next;else {entries.push(next);at++;}
    while(entries.length>60||entries.reduce((n,e)=>n+e.data.length,0)>20000000&&entries.length>2){entries.shift();at--;}
    lastKey=key;lastTime=Date.now();buttons();
  }
  function restore(next){
    if(next<0||next>=entries.length)return;
    at=next;lastKey='';restoring=true;
    try{deck=validDeck(JSON.parse(entries[at].data),true);rebuildSelect();go(Math.max(0,deck.slides.findIndex(s=>s.id===entries[at].id)));save();EditorTools.refresh(true);}
    finally{restoring=false;buttons();}
  }
  return {reset,visit,capture,undo:()=>restore(at-1),redo:()=>restore(at+1),buttons};
})();

window.EditorTools=(()=>{
  let selected=new Set(),ready=false,imageSrc='',fitFrame=0,lastSlide='',serial=0;
  const el=id=>document.getElementById(id);
  const clone=x=>JSON.parse(JSON.stringify(x));
  const uid=()=> 'slide-'+(globalThis.crypto?.randomUUID?.()||Date.now()+'-'+(++serial));
  const current=()=>deck.slides[index];
  function plain(text){const node=document.createElement('div');node.innerHTML=markdown(text||'',true);node.querySelectorAll('.katex-mathml').forEach(n=>n.remove());return node.textContent;}
  function commit(label,fn,focus){
    const id=focus||current().id;fn();validDeck(deck,true);rebuildSelect();go(Math.max(0,deck.slides.findIndex(s=>s.id===id)));save(label);refresh(true);
  }
  function ordered(ids=selected){return deck.slides.filter(s=>ids.has(s.id));}
  function move(ids,position){
    const moving=ordered(new Set(ids));if(!moving.length)return;
    const rest=deck.slides.filter(s=>!ids.includes(s.id));
    position=Math.max(0,Math.min(rest.length,position));
    const next=[...rest.slice(0,position),...moving,...rest.slice(position)];
    if(next.every((s,i)=>s.id===deck.slides[i].id))return;
    commit('move slides',()=>{deck.slides=next;});announce(`Moved ${moving.length===1?'slide':moving.length+' slides'} to position ${position+1}.`);
  }
  function dropSlides(ids,anchor,after){
    if(ids.includes(anchor))return;
    const rest=deck.slides.filter(s=>!ids.includes(s.id)),pos=rest.findIndex(s=>s.id===anchor);
    if(pos>=0)move(ids,pos+(after?1:0));
  }
  function step(direction){
    if(!selected.size)return;
    const next=deck.slides.slice();
    if(direction<0){for(let i=1;i<next.length;i++)if(selected.has(next[i].id)&&!selected.has(next[i-1].id))[next[i-1],next[i]]=[next[i],next[i-1]];}
    else {for(let i=next.length-2;i>=0;i--)if(selected.has(next[i].id)&&!selected.has(next[i+1].id))[next[i+1],next[i]]=[next[i],next[i+1]];}
    if(next.every((s,i)=>s.id===deck.slides[i].id))return;
    commit('move slides',()=>{deck.slides=next;});announce('Moved selection '+(direction<0?'up.':'down.'));
  }
  function duplicate(ids=new Set([current().id])){
    const sources=ordered(ids),copies=sources.map(s=>({...clone(s),id:uid()}));if(!copies.length)return;
    const position=Math.max(...sources.map(s=>deck.slides.indexOf(s)))+1;
    selected=new Set(copies.map(s=>s.id));commit('duplicate slides',()=>deck.slides.splice(position,0,...copies),copies[0].id);announce('Duplicated '+copies.length+' slide'+(copies.length===1?'':'s')+'.');
  }
  function remove(ids=new Set([current().id])){
    const count=ordered(ids).length;if(!count)return;
    if(count===deck.slides.length){announce('Keep at least one slide in the deck.');return;}
    const oldIndex=index,active=current().id;
    const remaining=deck.slides.filter(s=>!ids.has(s.id));
    const focus=remaining.some(s=>s.id===active)?active:remaining[Math.min(oldIndex,remaining.length-1)].id;
    selected=new Set([focus]);commit('delete slides',()=>{deck.slides=remaining;},focus);announce('Deleted '+count+' slide'+(count===1?'':'s')+'. Undo restores them.');
  }
  function add(section=false){
    const s={id:uid(),title:section?'New section':'New slide',layout:section?'section':'standard',class:deck.slides.some(s=>(s.class||'').split(' ').includes('lab-slide'))?'lab-slide':'',kicker:'',body:section?'':'Write your next idea here.',minutes:1,notes:''};
    if(section)s.nav_title='New section';
    selected=new Set([s.id]);commit(section?'add section':'add slide',()=>deck.slides.splice(index+1,0,s),s.id);
    if(el('deck-organizer').open)el('deck-organizer').close();toggleEditor(true);el('edit-title').focus();el('edit-title').select();
  }
  function sectionSelection(){
    const active=ordered()[0]||current(),pos=deck.slides.indexOf(active);
    let first=pos;while(first>0&&deck.slides[first].layout!=='section')first--;
    let end=first+1;while(end<deck.slides.length&&deck.slides[end].layout!=='section')end++;
    selected=new Set(deck.slides.slice(first,end).map(s=>s.id));refresh(true);announce('Selected this section, including its title slide.');
  }
  function announce(text){if(ready)el('organizer-status').textContent=text;if(!el('deck-organizer')?.open)toast(text);}
  function selectionUI(){
    const valid=new Set(deck.slides.map(s=>s.id));selected=new Set([...selected].filter(id=>valid.has(id)));
    document.querySelectorAll('.organizer-row').forEach(row=>{const on=selected.has(row.dataset.key);row.classList.toggle('selected',on);row.querySelector('input').checked=on;});
    for(const id of ['organizer-up','organizer-down','organizer-first','organizer-last','organizer-move','organizer-duplicate','organizer-delete'])el(id).disabled=!selected.size;
    el('organizer-delete').disabled=!selected.size||selected.size===deck.slides.length;
    el('organizer-position').max=deck.slides.length-selected.size+1;
    el('organizer-selection').textContent=selected.size+' selected';
  }
  function renderOrganizer(){
    if(!el('deck-organizer')?.open)return;
    const list=el('organizer-list'),scroll=list.scrollTop,query=el('organizer-search').value.toLowerCase().trim();list.replaceChildren();
    let section='';
    deck.slides.forEach((s,i)=>{
      if(s.layout==='section')section=plain(s.nav_title||s.title);
      if(query&&!`${i+1} ${plain(s.title)} ${plain(s.kicker)} ${section}`.toLowerCase().includes(query))return;
      const row=document.createElement('div');row.className='organizer-row';row.dataset.key=s.id;
      const check=document.createElement('input');check.type='checkbox';check.setAttribute('aria-label',`Select slide ${i+1}: ${plain(s.title)}`);check.onchange=()=>{check.checked?selected.add(s.id):selected.delete(s.id);selectionUI();};
      const handle=document.createElement('button');handle.type='button';handle.className='reorder-handle';handle.textContent='⠿';handle.title='Drag to reorder; arrow keys move this selection';handle.setAttribute('aria-label',`Move slide ${i+1}: ${plain(s.title)}`);
      handle.onkeydown=e=>{if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();if(!selected.has(s.id))selected=new Set([s.id]);if(e.key==='Home')move([...selected],0);else if(e.key==='End')move([...selected],deck.slides.length-selected.size);else step(e.key==='ArrowUp'?-1:1);[...el('organizer-list').children].find(r=>r.dataset.key===s.id)?.querySelector('.reorder-handle').focus();};
      const number=document.createElement('span');number.className='organizer-number';number.textContent=String(i+1).padStart(2,'0');
      const thumb=document.createElement('div');thumb.className='organizer-thumb';thumb.setAttribute('aria-hidden','true');thumb.inert=true;
      const canvas=document.createElement('article');canvas.className=classes(s);canvas.style.cssText=SlideLayout.style(s);canvas.innerHTML=renderSlide(s,i);canvas.querySelectorAll('iframe,video,audio,script,title-conic-animation').forEach(n=>n.remove());canvas.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));thumb.append(canvas);
      const text=document.createElement('div');text.className='organizer-text';
      if(s.layout==='section'){const badge=document.createElement('div');badge.className='organizer-section';badge.textContent='Section · '+(s.nav_title||plain(s.title));text.append(badge);}
      const title=document.createElement('button');title.className='organizer-title';title.textContent=plain(s.title)||'Untitled slide';title.onclick=()=>{el('deck-organizer').close();go(deck.slides.findIndex(x=>x.id===s.id));toggleEditor(true);};
      const caption=document.createElement('p');caption.className='organizer-label';caption.textContent=[plain(s.kicker),section].filter(Boolean).join(' · ');text.append(title,caption);row.append(handle,check,number,thumb,text);list.append(row);
    });
    if(!list.children.length){const empty=document.createElement('p');empty.className='organizer-empty';empty.textContent='No matching slides.';list.append(empty);}
    list.scrollTop=scroll;selectionUI();DeckHistory.buttons();
  }
  function open(){selected=new Set([current().id]);el('organizer-search').value='';el('deck-organizer').showModal();renderOrganizer();[...el('organizer-list').children].find(r=>r.dataset.key===current().id)?.scrollIntoView({block:'center'});announce('Drag a handle to move slides. Use the checkboxes to move several together.');}

  // Pointer capture works with both a mouse and a touch screen. Only the handle
  // suppresses touch scrolling, so the rest of the list remains scrollable.
  function dragList(container,selector,begin,drop){
    let drag=null,raf=0;
    function clear(){
      cancelAnimationFrame(raf);raf=0;drag?.ghost?.remove();container.querySelectorAll(selector).forEach(r=>r.classList.remove('reorder-before','reorder-after','reorder-source'));
      if(drag?.handle.hasPointerCapture?.(drag.pointer))drag.handle.releasePointerCapture(drag.pointer);drag=null;
    }
    function target(){
      if(!drag?.started)return;
      container.querySelectorAll(selector).forEach(r=>r.classList.remove('reorder-before','reorder-after'));
      const row=document.elementFromPoint(drag.x,drag.y)?.closest(selector);
      drag.target=null;
      if(row&&container.contains(row)&&!drag.ids.includes(row.dataset.key)){
        const r=row.getBoundingClientRect(),after=drag.y>r.top+r.height/2;row.classList.add(after?'reorder-after':'reorder-before');drag.target={id:row.dataset.key,after};
      }
      drag.ghost.style.left=(drag.x+14)+'px';drag.ghost.style.top=(drag.y+12)+'px';
    }
    function scroll(){
      if(!drag?.started)return;
      const viewport=container===el('panel-list')?el('editor'):container,r=viewport.getBoundingClientRect();
      const speed=drag.y<r.top+50?-Math.min(16,(r.top+50-drag.y)/3):drag.y>r.bottom-50?Math.min(16,(drag.y-r.bottom+50)/3):0;
      if(speed){viewport.scrollTop+=speed;target();}raf=requestAnimationFrame(scroll);
    }
    container.addEventListener('pointerdown',e=>{
      const handle=e.target.closest('.reorder-handle'),row=handle?.closest(selector);if(!row||e.button!==0)return;
      const ids=begin(row.dataset.key);drag={ids,handle,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,started:false,target:null};handle.setPointerCapture(e.pointerId);
    });
    container.addEventListener('pointermove',e=>{
      if(!drag||e.pointerId!==drag.pointer)return;drag.x=e.clientX;drag.y=e.clientY;
      if(!drag.started&&Math.hypot(drag.x-drag.startX,drag.y-drag.startY)>6){
        drag.started=true;drag.ghost=document.createElement('div');drag.ghost.className='reorder-ghost';drag.ghost.textContent=`Moving ${drag.ids.length===1?'item':drag.ids.length+' items'}`;(container.closest('dialog')||document.body).append(drag.ghost);
        container.querySelectorAll(selector).forEach(r=>r.classList.toggle('reorder-source',drag.ids.includes(r.dataset.key)));scroll();
      }
      if(drag.started){e.preventDefault();target();}
    });
    container.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.pointer)return;const ids=drag.ids,place=drag.target;clear();if(place)drop(ids,place.id,place.after);});
    container.addEventListener('pointercancel',clear);
    window.addEventListener('blur',clear);
    document.addEventListener('keydown',e=>{if(drag&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();clear();}},true);
    el('deck-organizer').addEventListener('close',clear);
  }

  function cleanDesign(){const d=current().design;if(!d)return;if(d.images&&!Object.keys(d.images).length)delete d.images;if(!Object.keys(d).length)delete current().design;}
  function setDesign(key,value){
    current().design={...(current().design||{})};if(value==null||value==='')delete current().design[key];else current().design[key]=value;
    cleanDesign();previewEdit();if(key==='preset')fill(current());
  }
  function field(key,label,step=1){const [min,max]=SlideLayout.numbers[key];return `<label>${label}<input data-design="${key}" id="design-${key}" type="number" min="${min}" max="${max}" step="${step}" placeholder="Current design"></label>`;}
  function layoutHTML(){return `<details class="editor-detail" id="design-controls"><summary>Slide layout & spacing</summary>
    <div class="design-fields"><label class="design-wide">Content layout<select id="design-preset" data-design="preset"><option value="">Keep current design</option><option value="text">One column</option><option value="columns-2">Two columns</option><option value="columns-3">Three columns</option></select></label>
    ${field('titleSize','Title size (px)')}${field('bodySize','Body size (px)')}${field('headingSize','Heading size (px)')}${field('lineHeight','Line spacing',.05)}
    ${field('paragraphGap','Paragraph gap (px)')}${field('columnGap','Column gap (px)')}${field('paddingX','Side margins (px)')}${field('paddingY','Top / bottom margins (px)')}${field('contentOffset','Content vertical offset (px)')}${field('columnRatio','First column width (%)')}
    <label class="design-wide">Text alignment<select id="design-align" data-design="align"><option value="">Current design</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label></div>
    <p class="design-help">Leave a value empty to use the original design. Separate columns with a line containing <code>---</code>. A negative vertical offset moves content up.</p>
    <p id="layout-fit" role="status"></p><button id="reset-layout" type="button">Reset layout adjustments</button>
    <label>Advanced CSS classes<input id="edit-class" spellcheck="false"></label></details>
    <details class="editor-detail" id="image-controls"><summary>Image size & crop</summary><label>Image<select id="design-image"></select></label><div class="design-fields">
    <label>Width (px)<input id="image-width" data-image-setting="width" type="number" min="40" max="1152" placeholder="Current design"></label>
    <label>Height (px)<input id="image-height" data-image-setting="height" type="number" min="40" max="600" placeholder="Current design"></label>
    <label class="design-wide">Fit<select id="image-fit" data-image-setting="fit"><option value="">Current design</option><option value="contain">Show whole image</option><option value="cover">Fill and crop</option></select></label>
    <label>Crop position X (%)<input id="image-x" data-image-setting="x" type="number" min="0" max="100" placeholder="50"></label>
    <label>Crop position Y (%)<input id="image-y" data-image-setting="y" type="number" min="0" max="100" placeholder="50"></label>
    </div><p class="design-help">These settings affect only the selected image. Cropping changes its display, not the source file.</p><button id="reset-image" type="button">Reset this image</button></details>
    <details class="editor-detail" id="panel-controls"><summary>Arrange columns & panels</summary><p class="design-help">Drag a handle or use the arrows. Each panel is the text between <code>---</code> separators.</p><div id="panel-list"></div><button id="add-panel" type="button">Add panel</button></details>`;}
  function fillImage(){const d=current().design?.images?.[imageSrc]||{};for(const input of document.querySelectorAll('[data-image-setting]'))input.value=d[input.dataset.imageSetting]??'';}
  function imageChoices(){
    const select=el('design-image'),imgs=[...document.querySelectorAll('#slide img')],seen=new Set();select.replaceChildren();
    for(const img of imgs){const src=img.getAttribute('src');if(seen.has(src))continue;seen.add(src);const o=document.createElement('option');o.value=src;o.textContent=img.alt||src.split('/').pop();select.append(o);}
    el('image-controls').hidden=!seen.size;if(!seen.has(imageSrc))imageSrc=select.options[0]?.value||'';select.value=imageSrc;fillImage();
  }
  function setBlocks(parts,label='reorder panels'){
    commit(label,()=>{current().body=parts.join('\n\n---\n\n');});
  }
  function renderPanels(){
    const parts=SlideLayout.blocks(current().body),list=el('panel-list');list.replaceChildren();
    el('panel-controls').hidden=parts.length===1&&!['columns-2','columns-3'].includes(current().design?.preset);
    parts.forEach((part,n)=>{
      const box=document.createElement('section');box.className='panel-editor';box.dataset.key=String(n);
      const header=document.createElement('div');header.className='panel-editor-head';
      const handle=document.createElement('button');handle.type='button';handle.className='reorder-handle';handle.textContent='⠿';handle.setAttribute('aria-label','Drag panel '+(n+1));
      const title=document.createElement('span');title.textContent='Panel '+(n+1);
      const up=document.createElement('button'),down=document.createElement('button'),remove=document.createElement('button');up.textContent='↑';down.textContent='↓';remove.textContent='×';up.title='Move panel earlier';down.title='Move panel later';remove.title='Delete panel';up.disabled=n===0;down.disabled=n===parts.length-1;remove.disabled=parts.length===1;
      const reorder=delta=>{const p=SlideLayout.blocks(current().body);if(n+delta<0||n+delta>=p.length)return;[p[n],p[n+delta]]=[p[n+delta],p[n]];setBlocks(p);};up.onclick=()=>reorder(-1);down.onclick=()=>reorder(1);handle.onkeydown=e=>{if(['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();reorder(e.key==='ArrowUp'?-1:1);}};
      remove.onclick=()=>{const p=SlideLayout.blocks(current().body);p.splice(n,1);setBlocks(p,'delete panel');};
      const input=document.createElement('textarea');input.rows=4;input.value=part;input.dataset.panelInput=String(n);input.setAttribute('aria-label','Panel '+(n+1)+' Markdown');input.oninput=()=>{const p=SlideLayout.blocks(current().body);p[n]=input.value;current().body=p.join('\n\n---\n\n');el('edit-body').value=current().body;previewEdit();};
      header.append(handle,title,up,down,remove);box.append(header,input);list.append(box);
    });
  }
  function fill(s){
    if(!ready)return;
    for(const input of document.querySelectorAll('[data-design]'))input.value=s.design?.[input.dataset.design]??'';
    const canvas=el('slide'),body=canvas.querySelector('.slide-content'),title=canvas.querySelector('h1'),heading=body.querySelector('h2,h3,h4');
    const text=[...body.querySelectorAll('p,li,td')].find(e=>e.textContent.trim())||body;
    const cs=getComputedStyle(canvas),bs=getComputedStyle(text),gs=getComputedStyle(canvas.querySelector('.property-grid,.editor-columns')||body);
    const defaults={titleSize:parseFloat(getComputedStyle(title).fontSize),bodySize:parseFloat(bs.fontSize),headingSize:heading?parseFloat(getComputedStyle(heading).fontSize):32,lineHeight:parseFloat(bs.lineHeight)/parseFloat(bs.fontSize),paragraphGap:parseFloat(bs.marginBottom),columnGap:parseFloat(gs.columnGap)||0,paddingX:parseFloat(cs.paddingLeft),paddingY:parseFloat(cs.paddingTop),contentOffset:0,columnRatio:50};
    for(const [key,value] of Object.entries(defaults))if(Number.isFinite(value)){const input=el('design-'+key);input.placeholder=String(Math.round(value*100)/100);input.dataset.currentValue=String(value);}
    const grid=document.querySelector('#slide .property-grid');el('design-columnRatio').disabled=s.design?.preset!=='columns-2'&&(!grid||grid.children.length!==2);el('design-columnRatio').title='Applies to a two-column layout.';
    el('edit-class').value=s.class||'';if(lastSlide!==s.id){imageSrc='';lastSlide=s.id;}imageChoices();renderPanels();checkFit();
  }
  function checkFit(){
    cancelAnimationFrame(fitFrame);fitFrame=requestAnimationFrame(()=>{
      if(!ready||el('editor').hidden)return;
      const slide=el('slide'),r=slide.getBoundingClientRect(),scale=r.width/1280;if(!scale)return;
      const items=[...slide.querySelectorAll('.slide-content,.visual,h1,.eyebrow')].filter(e=>e.getBoundingClientRect().height>0);
      const overflow=items.some(e=>{const b=e.getBoundingClientRect();return (b.bottom-r.top)/scale>682||(b.right-r.left)/scale>1255||(b.left-r.left)/scale<18||(b.top-r.top)/scale<12;});
      el('layout-fit').classList.toggle('has-overflow',overflow);el('layout-fit').textContent=overflow?'Content reaches beyond the slide’s safe area. Adjust size, spacing, or image height.':'Content fits within the slide.';
    });
  }
  function afterPreview(){if(!ready)return;checkFit();if(document.activeElement===el('edit-body')){renderPanels();imageChoices();}else if(document.activeElement?.hasAttribute('data-panel-input'))imageChoices();}
  function refresh(force=false){if(!ready)return;if(force||el('deck-organizer').open)renderOrganizer();DeckHistory.buttons();checkFit();}
  function setup(){
    const actions=document.createElement('div');actions.className='editor-top-actions';actions.innerHTML='<button type="button" id="organize-slides">Organize slides</button><button type="button" data-history="undo">Undo</button><button type="button" data-history="redo">Redo</button>';
    el('editor').insertBefore(actions,el('editor').querySelector('.editor-hint'));
    const layout=document.createElement('div');layout.innerHTML=layoutHTML();el('edit-body').parentElement.after(layout);
    const dialog=document.createElement('dialog');dialog.id='deck-organizer';dialog.setAttribute('aria-labelledby','organizer-title');dialog.innerHTML=`<div class="organizer-heading"><h2 id="organizer-title">Organize slides</h2><button data-history="undo">Undo</button><button data-history="redo">Redo</button><button id="organizer-save">Save to server</button><button id="close-organizer" aria-label="Close organizer">×</button></div>
      <div class="organizer-tools"><input id="organizer-search" type="search" placeholder="Find a slide or section" aria-label="Find slides"><button id="organizer-all">Select visible</button><button id="organizer-clear">Clear</button><button id="organizer-section">Select section</button><span id="organizer-selection"></span></div>
      <div class="organizer-tools"><button id="organizer-up" title="Move selection up">↑</button><button id="organizer-down" title="Move selection down">↓</button><button id="organizer-first">First</button><button id="organizer-last">Last</button><label>Position <input id="organizer-position" type="number" min="1" value="1"></label><button id="organizer-move">Move</button><button id="organizer-duplicate">Duplicate</button><button id="organizer-delete">Delete</button><button id="organizer-add">+ Slide</button><button id="organizer-add-section">+ Section</button></div>
      <div id="organizer-list" aria-label="Slides in presentation order"></div><p id="organizer-status" role="status" aria-live="polite"></p>`;document.body.append(dialog);
    ready=true;
    const toolbar=document.createElement('button');toolbar.id='organize-button';toolbar.textContent='Organize';toolbar.title='Reorder slides';el('edit-button').after(toolbar);toolbar.onclick=open;
    el('organize-slides').onclick=open;el('close-organizer').onclick=()=>dialog.close();el('organizer-search').oninput=renderOrganizer;
    el('organizer-save').onclick=async()=>{await DeckStorage.write();announce(el('save-status').textContent);};
    const saveState=()=>{el('organizer-save').disabled=el('save-server').disabled;el('organizer-save').textContent=el('save-server').textContent;};
    new MutationObserver(saveState).observe(el('save-server'),{attributes:true,childList:true,characterData:true,subtree:true});saveState();
    el('organizer-all').onclick=()=>{selected=new Set([...el('organizer-list').querySelectorAll('.organizer-row')].map(r=>r.dataset.key));selectionUI();};el('organizer-clear').onclick=()=>{selected.clear();selectionUI();};el('organizer-section').onclick=sectionSelection;
    el('organizer-up').onclick=()=>step(-1);el('organizer-down').onclick=()=>step(1);el('organizer-first').onclick=()=>move([...selected],0);el('organizer-last').onclick=()=>move([...selected],deck.slides.length-selected.size);
    el('organizer-move').onclick=()=>{const input=el('organizer-position');if(input.checkValidity()&&input.value!=='')move([...selected],Number(input.value)-1);else input.reportValidity();};el('organizer-duplicate').onclick=()=>duplicate(selected);el('organizer-delete').onclick=()=>remove(selected);el('organizer-add').onclick=()=>add();el('organizer-add-section').onclick=()=>add(true);
    document.querySelectorAll('[data-history]').forEach(b=>b.onclick=()=>DeckHistory[b.dataset.history]());
    document.addEventListener('keydown',e=>{
      if(!(e.ctrlKey||e.metaKey)||e.altKey)return;
      if(el('editor').hidden&&!dialog.open)return;
      // Keep native text undo inside fields; toolbar Undo always covers the deck.
      if(e.target.matches('input,textarea,[contenteditable=true]'))return;
      if(e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?DeckHistory.redo():DeckHistory.undo();}
      else if(e.key.toLowerCase()==='y'){e.preventDefault();DeckHistory.redo();}
    });
    document.querySelectorAll('[data-design]').forEach(input=>input.addEventListener('input',()=>{if(input.type==='number'&&!input.checkValidity())return;setDesign(input.dataset.design,input.value===''?null:input.type==='number'?Number(input.value):input.value);}));
    document.querySelectorAll('[data-design][type=number]').forEach(input=>input.addEventListener('keydown',e=>{if(input.value===''&&['ArrowUp','ArrowDown'].includes(e.key)&&input.dataset.currentValue)input.value=String(Math.max(Number(input.min),Math.min(Number(input.max),Number(input.dataset.currentValue))));}));
    el('edit-class').oninput=()=>{current().class=el('edit-class').value;previewEdit();};
    el('reset-layout').onclick=()=>commit('reset layout',()=>{delete current().design;});
    el('design-image').onchange=()=>{imageSrc=el('design-image').value;fillImage();};
    document.querySelectorAll('[data-image-setting]').forEach(input=>input.oninput=()=>{
      if(!imageSrc||input.type==='number'&&!input.checkValidity())return;
      const d=clone(current().design||{});d.images=d.images||{};const settings={...(d.images[imageSrc]||{})},key=input.dataset.imageSetting;
      if(input.value==='')delete settings[key];else settings[key]=input.type==='number'?Number(input.value):input.value;
      if(Object.keys(settings).length)d.images[imageSrc]=settings;else delete d.images[imageSrc];current().design=d;cleanDesign();previewEdit();
    });
    el('reset-image').onclick=()=>commit('reset image layout',()=>{if(current().design?.images)delete current().design.images[imageSrc];cleanDesign();});
    el('add-panel').onclick=()=>setBlocks([...SlideLayout.blocks(current().body),'### New panel\n\nAdd content here.'],'add panel');
    dragList(el('organizer-list'),'.organizer-row',id=>{if(!selected.has(id)){selected=new Set([id]);selectionUI();}return [...selected];},dropSlides);
    dragList(el('panel-list'),'.panel-editor',id=>[id],(ids,anchor,after)=>{const parts=SlideLayout.blocks(current().body),from=Number(ids[0]),to=Number(anchor)+(after?1:0);const [part]=parts.splice(from,1);parts.splice(to-(from<to?1:0),0,part);setBlocks(parts);});
    el('slide').addEventListener('load',checkFit,true);DeckHistory.reset();
  }
  return {setup,fill,refresh,afterPreview,open,add,duplicate,remove,move,checkFit};
})();
