/* Diagram copy uses the same per-slide draft, save, import and print path as body text. */
(() => {
  const SVG='http://www.w3.org/2000/svg';
  const blocks=new Set(['DIV','P','SECTION','ARTICLE','FIGURE','UL','OL','LI','TABLE','SVG','IFRAME','IMG','TITLE-CONIC-ANIMATION']);
  function mathNode(el){return el.nodeType===1&&(el.classList.contains('katex')||el.classList.contains('katex-display'));}
  function source(node){
    if(node.nodeType===3)return node.textContent;
    if(node.nodeType!==1)return '';
    if(mathNode(node)){
      const tex=node.querySelector('annotation[encoding="application/x-tex"]')?.textContent||'';
      const dollar=node.classList.contains('katex-display')?'$$':'$';
      return dollar+tex+dollar;
    }
    const text=[...node.childNodes].map(source).join('');
    if(node.tagName==='BR')return '  \n';
    if(['STRONG','B'].includes(node.tagName))return '**'+text+'**';
    if(['EM','I'].includes(node.tagName))return '*'+text+'*';
    if(node.tagName==='CODE')return '`'+text+'`';
    if(node.tagName==='A')return '['+text+']('+node.getAttribute('href')+')';
    return text;
  }
  function inlineTree(el){
    return [...el.children].every(child=>mathNode(child)||(!blocks.has(child.tagName.toUpperCase())&&child.namespaceURI!==SVG&&inlineTree(child)));
  }
  function units(root){
    const out=[];
    function visit(node,path){
      if(node.nodeType===3){if(node.textContent.trim())out.push({node,path,text:node.textContent,plain:true});return;}
      if(node.nodeType!==1)return;
      if(['script','style','title','desc','defs','iframe'].includes(node.localName))return;
      if(node.namespaceURI===SVG){
        if(node.localName==='text'){out.push({node,path,text:node.textContent,plain:true});return;}
      }else if(mathNode(node)||(inlineTree(node)&&([...node.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())||node.children.length===0||(node.children.length===1&&mathNode(node.firstElementChild))||node.matches('p,button,.diagram-label')))){
        const text=source(node);
        if(text.trim())out.push({node,path,text,plain:false,math:mathNode(node)});
        return;
      }
      [...node.childNodes].forEach((child,i)=>visit(child,path+'.'+i));
    }
    [...root.childNodes].forEach((node,i)=>visit(node,String(i)));
    return out;
  }
  function template(id){
    if(id.startsWith('square-arrow-')){
      const name=id.slice('square-arrow-'.length);
      return '<span>'+paperMath(name)+'</span>';
    }
    return FIGURES[id]?.html()||'';
  }
  function parts(s){
    const ids=[];
    if(!s.code&&s.visual&&FIGURES[s.visual])ids.push(s.visual);
    if((s.body||'').includes('PROOFEXCISION'))ids.push('additive-proof-excision');
    if((s.body||'').includes('PROOFTANG'))ids.push('additive-proof-tang');
    if((s.class||'').split(' ').includes('blowup-data'))ids.push(...['j','p','\\pi','i'].map(x=>'square-arrow-'+x));
    return [...new Set(ids)];
  }
  function inspect(id){const root=document.createElement('div');root.innerHTML=template(id);return {root,items:units(root)};}
  function fields(s){return parts(s).flatMap(id=>inspect(id).items.map(unit=>({key:id+'/'+unit.path,figure:id,title:FIGURES[id]?.label||'Blowup square arrow',text:unit.text,plain:unit.plain})));}
  function render(id,s){
    // Preserve the original DOM exactly unless this slide has an override.
    if(!Object.keys(s.visual_text||{}).some(key=>key.startsWith(id+'/')))return template(id);
    const {root,items}=inspect(id);
    for(const unit of items){
      const key=id+'/'+unit.path;
      if(!Object.hasOwn(s.visual_text,key))continue;
      if(unit.plain)unit.node.textContent=s.visual_text[key];
      else if(unit.math){const replacement=document.createElement('span');replacement.innerHTML=markdown(s.visual_text[key],true);unit.node.replaceWith(...replacement.childNodes);}
      else unit.node.innerHTML=markdown(s.visual_text[key],true);
    }
    return root.innerHTML;
  }
  function fill(s){
    const panel=document.querySelector('#edit-figure-text'),holder=document.querySelector('#edit-figure-fields');
    const entries=fields(s);panel.hidden=!entries.length;holder.replaceChildren();
    let previous='';
    for(const [i,entry] of entries.entries()){
      if(entry.figure!==previous){const title=document.createElement('p');title.className='editor-hint';title.textContent=entry.title;holder.append(title);previous=entry.figure;}
      const label=document.createElement('label');label.textContent=`Text ${i+1}${entry.plain?' · plain text':' · Markdown + LaTeX'}`;
      const input=document.createElement('textarea');input.rows=Math.min(5,Math.max(2,Math.ceil(entry.text.length/55)));input.spellcheck=false;
      input.dataset.figureText=entry.key;input.value=Object.hasOwn(s.visual_text||{},entry.key)?s.visual_text[entry.key]:entry.text;
      input.addEventListener('input',()=>{
        s.visual_text={...(s.visual_text||{}),[entry.key]:input.value};
        if(input.value===entry.text)delete s.visual_text[entry.key];
        if(!Object.keys(s.visual_text).length)delete s.visual_text;
        previewEdit();
      });
      label.append(input);holder.append(label);
    }
  }
  window.FigureText={render,fields,fill,parts};
})();
