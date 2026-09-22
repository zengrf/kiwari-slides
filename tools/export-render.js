(()=>{
 const records={};
 function powerTex(p){let tex=p.tex.replace(/\\textit\{alpha\}/g,'\\alpha').replace(/\\textit\{a(\d)(\d)\}/g,'a_{$1$2}').replace(/\\textit\{e(\d)(\d)\}/g,'e_{$1,$2}');const label=p.power===1?'T':`T^{${p.power}}`;if(tex.length<190)return label+'='+tex;let terms=[],start=0,depth=0;for(let i=0;i<tex.length;i++){if(tex.startsWith('\\left',i))depth++;if(tex.startsWith('\\right',i))depth--;if(i>start&&depth===0&&(tex[i]==='+'||tex[i]==='-')){terms.push(tex.slice(start,i));start=i;}}terms.push(tex.slice(start));return '\\begin{aligned}'+label+'&='+terms[0]+terms.slice(1).map(t=>'\\\\ &{}'+t).join('')+'\\end{aligned}';}
 for(const [name,r] of Object.entries(EXPORT_RECORDINGS)){
  const match=r.output.match(/\[Conic powers\]\n([^\n]+)\n\[\/Conic powers\]/);
  const powers=match?JSON.parse(match[1]).map(p=>({...p,html:paperMath(powerTex(p),true)})):null;
  records[name]={title:name==='conics'?'Powers of the tangency class':name==='twisted-cubic'?'Secants to the twisted cubic':'3264 in the Chow ring',version:r.version,recorded_at:r.recorded_at,source:r.source,transcript:r.output,html:paperMath(r.result_tex,true),powers};
 }
 renderCode=s=>{
  const name=(s.code_file||'').split('/').pop().replace(/\.m2$/,''),r=records[name];
  const buttons=r?(r.powers?[1,2,3,4,5].map(p=>`<button data-record="${name}" data-power="${p}">${paperMath(p===1?'T':`T^{${p}}`)}</button>`).join(''):`<button data-record="${name}">View output</button>`)+`<button data-record="${name}" data-source>Full script</button>`:'';
  return `<section class="code-panel"><div class="code-title">${escapeHTML(s.code_title||'Code')}</div><pre><code>${escapeHTML(s.code)}</code></pre><div class="recorded-actions">${buttons}</div><p class="recorded-caption">${r?'Recorded Macaulay2 output':'Recorded output'}</p><div class="recorded-answer">${r?.html||(s.code_result?paperMath(s.code_result,true):'')}</div></section>`;
 };
 // The static Julia viewer uses the same iframe location; its export has no solver UI.
 if(FIGURES['conics-live'])FIGURES['conics-live'].html=()=>'<iframe class="conics-frame" src="conics/?embed=1" title="Saved Julia solutions: 3264 conics" loading="lazy"></iframe><div class="conics-print"><img src="conics/preview.png" alt="Five conics and a recorded tangent solution"><p>Explore the saved solutions in the online slides.</p></div>';
 const plain=text=>{const node=document.createElement('div');node.innerHTML=markdown(text,true);node.querySelectorAll('.katex-mathml').forEach(e=>e.remove());return node.textContent;};
 const result=deck.slides.map((s,i)=>{const copy={...s};copy.body=(copy.body||'').replace('[Edit and run the full Macaulay2 script](./m2/?preset=conics)','[View the Macaulay2 script and recorded outputs](#record-conics)');return {id:s.id,title:plain(s.title),nav:plain(s.nav_title||s.title),layout:s.layout,class:classes(s),html:renderSlide(copy,i)};});
 return {title:deck.slides[0].title,slides:result,records};
})()
