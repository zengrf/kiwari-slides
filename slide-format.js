/* Small slide-text helpers. Math stays in KaTeX; code stays literal. */
'use strict';
window.SlideFormatting=(()=>{
  let serial=0;
  function stash(prefix) {
    const saved=[];const key=`SLIDE${prefix}${serial++}X`;
    return {
      save(html,block=false){const token=key+saved.length+'TOKEN';saved.push({token,html,block});return block?'\n\n'+token+'\n\n':token;},
      restore(html){for(const item of saved){if(item.block)html=html.replaceAll('<p>'+item.token+'</p>',item.html);html=html.replaceAll(item.token,item.html);}return html;}
    };
  }
  function protectCode(source) {
    const saved=stash('CODE');
    // Fences and inline code must be protected before recognizing $math$ or helpers.
    const text=source.replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[ \t]*(?:\n|$)|(`+)([^\n]*?)\2/gm,(code,fence)=>saved.save(fence?marked.parse(code):marked.parseInline(code),!!fence));
    return {text,restore:saved.restore};
  }
  function argument(source,at) {
    while(/[ \t]/.test(source[at]||'')&&at<source.length)at++;
    if(source[at]!=='{')return null;
    const start=++at;let depth=1;
    for(;at<source.length;at++){
      if(source[at]==='\\'){at++;continue;}
      if(source[at]==='{')depth++;
      if(source[at]==='}'&&!--depth)return {body:source.slice(start,at),end:at+1};
    }
    return null;
  }
  function dimension(value) {
    const match=value.trim().match(/^(-?(?:\d+(?:\.\d*)?|\.\d+))(em|rem|ex|px)$/);
    return match&&Number.isFinite(Number(match[1]))?{number:Number(match[1]),unit:match[2]}:null;
  }
  function prepare(source,render) {
    const saved=stash('FORMAT');let text='',last=0,match;
    const command=/\\(large|Large|LARGE|small|center|left|right|vspace|hspace|hfill|newline)\b|\\\\/g;
    while((match=command.exec(source))){
      const name=match[1];let html,block=false,end=command.lastIndex;
      if(!name||name==='newline')html='<br>';
      else if(name==='hfill')html='<span class="fmt-hfill" aria-hidden="true"></span>';
      else {
        const arg=argument(source,end);if(!arg)continue;
        if(name==='vspace'||name==='hspace'){
          const size=dimension(arg.body);if(!size)continue;
          block=name==='vspace';const value=size.number+size.unit;
          const style=size.number<0?`${block?'margin-top':'margin-left'}:${value}`:`${block?'height':'width'}:${value}`;
          html=`<${block?'div':'span'} class="fmt-${name}" style="${style}" aria-hidden="true"></${block?'div':'span'}>`;
        } else {
          block=['center','left','right'].includes(name);
          html=`<${block?'div':'span'} class="fmt-${name}">${render(arg.body,!block)}</${block?'div':'span'}>`;
        }
        end=arg.end;
      }
      text+=source.slice(last,match.index)+saved.save(html,block);last=end;command.lastIndex=end;
    }
    text+=source.slice(last);return {text,restore:saved.restore};
  }
  function alignRows(node) {
    node.querySelectorAll('p').forEach(p=>{
      if(![...p.children].some(child=>child.classList.contains('fmt-hfill')))return;
      p.classList.add('fmt-row');const children=[...p.childNodes];p.replaceChildren();
      let cell=document.createElement('span');cell.className='fmt-cell';p.append(cell);
      for(const child of children){
        if(child.nodeType===1&&child.classList.contains('fmt-hfill')){p.append(child);cell=document.createElement('span');cell.className='fmt-cell';p.append(cell);}
        else cell.append(child);
      }
    });
  }
  return {protectCode,prepare,alignRows};
})();

window.FORMAT_EXAMPLES=[
  {group:'text',title:'Larger text',hint:'Use braces to limit the size change. Also: \\large{…}, \\LARGE{…}, \\small{…}.',code:String.raw`\Large{The answer is $3264$.}`},
  {group:'text',title:'Extra vertical space',hint:'Put this on its own line. 1em is one text-size unit; px also works. A negative value closes a gap.',code:String.raw`First paragraph.

\vspace{1em}

Next paragraph.`},
  {group:'text',title:'Line break',hint:'Use \\newline or two backslashes. A blank line starts a new paragraph.',code:String.raw`First line.\newline Second line.`},
  {group:'text',title:'Left and right on one line',hint:'Use \\hfill outside math. The gap expands to the width of the text column.',code:String.raw`Tangency class \hfill $6\alpha$`},
  {group:'text',title:'Fixed horizontal space',hint:'Use em, rem, ex, or px for a fixed gap.',code:String.raw`First item\hspace{2em}Second item`},
  {group:'text',title:'Center text or a formula',hint:'Put the helper on its own line. Markdown and math work inside the braces.',code:String.raw`\center{\Large{The answer is $3264$.}}`},
  {group:'text',title:'Right alignment',hint:'Use \\right{…} or \\left{…} outside math. Centering also works with \\center{…}.',code:String.raw`\right{A class of degree $3264$.}`},
  {group:'text',title:'A boxed answer',hint:'Use a Markdown blockquote for a panel; use \\boxed inside math for a box around the formula.',code:String.raw`> $$\Large{\boxed{3264[\mathrm{pt}]}}$$`},
  {group:'math',title:'Inline and displayed math',hint:'Single dollars stay in a sentence; double dollars give a separate display.',code:String.raw`The class is $6\alpha$.

$$\alpha^5=[\mathrm{pt}].$$`},
  {group:'math',title:'Larger math',hint:'Inside math, use a braced size command. Also: \\large, \\LARGE, \\small.',code:String.raw`$$\Large{(6\alpha)^5=7776[\mathrm{pt}]}$$`},
  {group:'math',title:'Align equations and add row space',hint:'& marks the alignment point; \\\\ starts a row; [0.6em] adds space after it.',code:String.raw`$$\begin{aligned}
[S_i]_{CH} &= 6\alpha \\[0.6em]
\alpha^5 &= [\mathrm{pt}].
\end{aligned}$$`},
  {group:'math',title:'Center several math lines',hint:'Use gathered for centered rows without alignment points.',code:String.raw`$$\begin{gathered}
CH^\bullet(\mathbb P^5)=\frac{\mathbb Z[\alpha]}{(\alpha^6)} \\[0.5em]
\alpha^5=[\mathrm{pt}].
\end{gathered}$$`},
  {group:'math',title:'Horizontal space inside math',hint:'Use \\, for a thin space, \\quad or \\qquad for wider gaps. Use \\hspace{1em} for a chosen width.',code:String.raw`$$\alpha\in CH^1\qquad e_{0,0}\in CH^1$$`},
  {group:'math',title:'Projective spaces and bundles',hint:'Full commands and the paper’s short macros are both available.',code:String.raw`$\mathbb P^5,\quad \mathcal E,\quad \mathcal N$

$\PP^5,\quad \E,\quad \N,\quad \Bl_V\PP^5$`}
];

window.setupFormattingHelp=function(){
  FORMAT_EXAMPLES.forEach(example=>{
    const card=document.createElement('article');card.className='format-example';
    const header=document.createElement('div');header.className='format-example-heading';
    const title=document.createElement('h4');title.textContent=example.title;
    const button=document.createElement('button');button.type='button';button.textContent='Copy';button.setAttribute('aria-label','Copy '+example.title.toLowerCase()+' example');
    const hint=document.createElement('p');hint.textContent=example.hint;
    const pre=document.createElement('pre'),code=document.createElement('code');code.textContent=example.code;pre.append(code);
    button.onclick=async()=>{
      try {
        if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(example.code);
        else {const input=document.createElement('textarea');input.value=example.code;input.className='copy-helper';card.append(input);input.select();const copied=document.execCommand('copy');input.remove();if(!copied)throw Error('copy unavailable');}
        button.textContent='Copied';document.querySelector('#format-copy-status').textContent=example.title+' example copied.';setTimeout(()=>button.textContent='Copy',1600);
      } catch {const range=document.createRange();range.selectNodeContents(code);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);document.querySelector('#format-copy-status').textContent='Example selected. Press ⌘C or Ctrl+C to copy.';}
    };
    header.append(title,button);card.append(header,hint,pre);document.querySelector('#format-'+example.group).append(card);
  });
};
