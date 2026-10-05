/* Optional, per-slide design settings; absent settings preserve the authored design. */
'use strict';
window.SlideLayout=(()=>{
  const numbers={titleSize:[28,100],bodySize:[14,48],headingSize:[18,60],lineHeight:[1,2],paragraphGap:[0,60],columnGap:[0,120],paddingX:[24,140],paddingY:[20,120],contentOffset:[-80,100],columnRatio:[20,80]};
  const enums={preset:['text','columns-2','columns-3'],align:['left','center','right']};
  const imageNumbers={width:[40,1152],height:[40,600],x:[0,100],y:[0,100]};
  const numeric=(v,range)=>typeof v==='number'&&Number.isFinite(v)&&v>=range[0]&&v<=range[1];
  function validate(d){
    if(d==null)return;
    if(typeof d!=='object'||Array.isArray(d))throw Error('Slide design must be an object.');
    for(const [k,v] of Object.entries(d)){
      if(numbers[k]){if(!numeric(v,numbers[k]))throw Error('Invalid slide design: '+k);}
      else if(enums[k]){if(!enums[k].includes(v))throw Error('Invalid slide design: '+k);}
      else if(k==='images'){
        if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid image settings.');
        for(const image of Object.values(v)){
          if(!image||typeof image!=='object'||Array.isArray(image))throw Error('Invalid image settings.');
          for(const [key,value] of Object.entries(image))if(key==='fit'?!['contain','cover'].includes(value):!imageNumbers[key]||!numeric(value,imageNumbers[key]))throw Error('Invalid image setting: '+key);
        }
      }else throw Error('Unknown slide design setting: '+k);
    }
  }
  const custom=s=>!!s.design?.preset;
  function classNames(s){
    const d=s.design||{};
    return Object.keys(d).filter(k=>k!=='images'&&k!=='preset').map(k=>'design-'+k).concat(d.preset?['design-custom','design-'+d.preset]:[]).join(' ');
  }
  function baseClass(s){return custom(s)?(s.class||'').split(/\s+/).filter(c=>c==='lab-slide').join(' '):(s.class||'');}
  function style(s){
    const d=s.design||{},css=[];
    for(const [k,range] of Object.entries(numbers))if(numeric(d[k],range))css.push(`--design-${k}:${d[k]}${k==='lineHeight'?'':k==='columnRatio'?'%':'px'}`);
    if(enums.align.includes(d.align))css.push('--design-align:'+d.align);
    return css.join(';');
  }
  function decorate(html,s){
    if(!s.design?.images)return html;
    const node=document.createElement('div');node.innerHTML=html;
    for(const img of node.querySelectorAll('img')){
      const d=s.design.images[img.getAttribute('src')];if(!d)continue;
      for(const k of ['width','height'])if(numeric(d[k],imageNumbers[k]))img.style.setProperty(k,d[k]+'px','important');
      if(['contain','cover'].includes(d.fit))img.style.setProperty('object-fit',d.fit,'important');
      if(d.x!=null||d.y!=null)img.style.setProperty('object-position',`${d.x??50}% ${d.y??50}%`,'important');
    }
    return node.innerHTML;
  }
  // Match the renderer's panel separator, but leave fenced code intact.
  function blocks(text){
    const result=[];let part=[],fence=null;
    const trimBlankLines=s=>s.replace(/^(?:[ \t]*\n)+|(?:\n[ \t]*)+$/g,'');
    for(const line of String(text||'').split('\n')){
      const m=line.match(/^\s*(`{3,}|~{3,})/);
      if(m){if(!fence)fence=m[1];else if(m[1][0]===fence[0]&&m[1].length>=fence.length)fence=null;}
      if(!fence&&/^\s*---\s*$/.test(line)){result.push(trimBlankLines(part.join('\n')));part=[];}else part.push(line);
    }
    result.push(trimBlankLines(part.join('\n')));return result;
  }
  return {validate,custom,classNames,baseClass,style,decorate,blocks,numbers,imageNumbers};
})();
