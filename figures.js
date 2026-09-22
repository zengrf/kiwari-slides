/* Original mathematical diagrams. All colors follow the Kiwari tokens. */
window.FIGURES = {
  '': {label:'None',html:()=>''},

  conics: {label:'Moving tangent ellipses, parabolas, and hyperbolas',html:()=>TitleConics.html()},
  fgl: {label:'Formal group law selector',html:()=>`<div class="diagram-caption">Examples of formal group laws</div><div class="fgl-picker"><button data-fgl="chow" class="active">Chow</button><button data-fgl="k">K-theory</button><button data-fgl="omega">Cobordism</button></div><div id="fgl-output">${katex.renderToString('F(x,y)=x+y',{displayMode:true})}</div><svg viewBox="0 0 400 180" role="img" aria-label="Cobordism specializes to Chow theory and K theory"><path d="M200 36L85 140M200 36L315 140" fill="none" stroke="var(--gold)" stroke-width="2"/><g text-anchor="middle" font-size="29"><text x="200" y="33">Ω</text><text x="80" y="168">CH</text><text x="320" y="168">K</text></g></svg>`},
  cubic: {label:'Twisted cubic and secants',html:()=>{let pts=[];const point=t=>[205+110*t+28*t*t*t,175+85*t*t-55*t*t*t];for(let t=-1.15;t<=1.16;t+=.015)pts.push(point(t).join(','));let lines=[[-1,.8],[-.8,.4],[-.5,1],[-1.1,-.1]].map(([a,b])=>{a=point(a);b=point(b);return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="var(--gold)" stroke-width="1.5"/><circle cx="${a[0]}" cy="${a[1]}" r="4" fill="var(--accent)"/><circle cx="${b[0]}" cy="${b[1]}" r="4" fill="var(--accent)"/>`}).join('');return `<svg viewBox="0 0 420 380" role="img" aria-label="A projected twisted cubic with several secant lines"><path d="M40 330H375M205 350V40" stroke="var(--line)" fill="none"/>${lines}<polyline points="${pts.join(' ')}" fill="none" stroke="var(--accent)" stroke-width="3"/><text x="323" y="155" font-size="29" font-style="italic">C</text></svg><div class="diagram-caption">Secants are parametrized by Sym² P¹ ≅ P².</div>`}},
  twelve: {label:'Rank twelve',html:()=>`<div class="diagram-caption">Six ambient classes</div><div class="number-tiles">${['1','α','α²','α³','α⁴','α⁵'].map(x=>`<span>${x}</span>`).join('')}</div><div class="diagram-caption">Two shifted copies of three center classes</div><div class="number-tiles">${['1','η','η²','1','η','η²'].map(x=>`<span class="exceptional">${x}</span>`).join('')}</div><div style="text-align:center;font-size:76px;font-family:var(--display-font);color:var(--accent)">6 + 3 + 3</div>`},
  boundary: {label:'Stable two-component curve',html:()=>`<svg viewBox="0 0 450 350" role="img" aria-label="Two rational components joined at a node, with markings 1 and 2 on the left and 3, 4, 5 on the right"><g fill="none" stroke-width="2.4"><ellipse cx="139" cy="170" rx="85" ry="108" stroke="var(--accent)"/><ellipse cx="309" cy="170" rx="85" ry="108" stroke="var(--wood-light)"/></g><circle cx="224" cy="170" r="5" fill="var(--gold)"/><g fill="var(--accent)"><circle cx="76" cy="96" r="5"/><circle cx="76" cy="244" r="5"/></g><g fill="var(--wood-light)"><circle cx="350" cy="75" r="5"/><circle cx="394" cy="170" r="5"/><circle cx="350" cy="265" r="5"/></g><g font-size="28"><text x="48" y="90">1</text><text x="48" y="266">2</text><text x="363" y="66">3</text><text x="409" y="181">4</text><text x="363" y="289">5</text></g><g font-size="23" font-style="italic" text-anchor="middle"><text x="139" y="175">P¹</text><text x="309" y="175">P¹</text><text x="225" y="322">D¹² = D³⁴⁵</text></g></svg>`},
  crossratio: {label:'Three boundary points of M0,4',html:()=>`<svg viewBox="0 0 420 320" role="img" aria-label="The three boundary points 0, 1, and infinity on a projective line"><ellipse cx="210" cy="159" rx="163" ry="110" fill="none" stroke="var(--wood-light)" stroke-width="2"/><g fill="var(--accent)"><circle cx="78" cy="95" r="6"/><circle cx="210" cy="269" r="6"/><circle cx="342" cy="95" r="6"/></g><g text-anchor="middle" font-size="26"><text x="58" y="67">12 | 34</text><text x="210" y="309">13 | 24</text><text x="360" y="67">14 | 23</text><text x="210" y="164" font-size="38">P¹</text></g></svg><div class="diagram-caption">Pull back three linearly equivalent points.</div>`},
  proof: {label:'Proof architecture',html:()=>`<div class="flow"><div>Geometry gives generators</div><div class="flow-arrow">↓</div><div>Divisors give relations</div><div class="flow-arrow">↓</div><div>Compare with Keel’s Chow ring</div><div class="flow-arrow">↓</div><div>Freeness + equal rank</div></div>`},
  roadmap: {label:'Talk structure',html:()=>`<div class="flow"><div>Ⅰ · Formal group laws</div><div class="flow-arrow">↓</div><div>Ⅱ · Blowup rings</div><div class="flow-arrow">↓</div><div>Ⅲ · Enumerative geometry</div><div class="flow-arrow">↓</div><div>Ⅳ · Stable pointed curves</div></div>`}
};

// Mathematical labels use the same KaTeX renderer as slide equations.
// SVG supplies geometry only, so projective spaces and bundles keep their fonts.
function diagramLabel(tex,x,y,kind='object') {
  return `<span class="math-label ${kind}" style="left:${x}%;top:${y}%">${paperMath(tex)}</span>`;
}
// The pullback object is northwest; put the lower-right corner just inside it.
function cartesianMarker() {
  return '<path class="cartesian-marker" d="M106 112h18v-18" fill="none" stroke="var(--gold)" stroke-width="1.8"/>';
}
function cartesianDiagram(objects,aria) {
  const [nw,ne,sw,se]=objects;
  return `<div class="geometry-diagram" role="img" aria-label="${aria}"><svg viewBox="0 0 420 325" aria-hidden="true"><defs><marker id="square-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="var(--accent)"/></marker></defs><g fill="none" stroke="var(--accent)" stroke-width="1.8" marker-end="url(#square-arrow)"><path d="M100 68H255"/><path d="M72 100V225"/><path d="M340 100V225"/><path d="M103 253H307"/></g>${cartesianMarker()}</svg>${diagramLabel(nw,17,21)}${diagramLabel(ne,81,21,'object blowup-object')}${diagramLabel(sw,17,78)}${diagramLabel(se,81,78)}${diagramLabel('j',49,12,'morphism')}${diagramLabel('p',7,49,'morphism')}${diagramLabel(String.raw`\pi`,91,49,'morphism')}${diagramLabel('i',49,68,'morphism')}</div>`;
}
FIGURES.square={label:'General blowup square',html:()=>cartesianDiagram(['E',String.raw`\Bl_ZX`,'Z','X'],'Cartesian square of the exceptional divisor and the center of a blowup')};
FIGURES['conic-square']={label:'Veronese blowup square',html:()=>cartesianDiagram(['E',String.raw`\Bl_V\mathbb P^5`,'V',String.raw`\mathbb P^5`],'Cartesian square of the Veronese blowup of projective five-space')};
FIGURES['fiber-square']={label:'Projective-bundle fiber square',html:()=>`<div class="geometry-diagram" role="img" aria-label="Transverse pullback of the projective bundle E over a point v of V"><svg viewBox="0 0 420 325" aria-hidden="true"><g stroke="var(--accent)" stroke-width="1.8" fill="none"><path d="M112 68H300m-7-5 7 5-7 5M73 105V221m-5-7 5 7 5-7M340 105V221m-5-7 5 7 5-7M112 253H302m-7-5 7 5-7 5"/></g>${cartesianMarker()}</svg>${diagramLabel(String.raw`\mathbb P^2`,18,21)}${diagramLabel('E',81,21)}${diagramLabel('v',18,78)}${diagramLabel('V',81,78)}${diagramLabel('p',91,49,'morphism')}</div>`};
FIGURES['double-line']={label:'A double line meets a smooth conic',html:()=>`<div class="geometry-diagram" role="img" aria-label="A line meets a smooth conic at two points; its square gives two double roots"><svg viewBox="0 0 420 325" aria-hidden="true"><ellipse cx="210" cy="164" rx="142" ry="105" fill="none" stroke="var(--wood-light)" stroke-width="2.2"/><path d="M34 160H386" stroke="var(--accent)" stroke-width="4"/><path d="M34 164H386" stroke="var(--accent)" stroke-width="1.2" opacity=".5"/><g fill="var(--gold)"><circle cx="68" cy="160" r="6"/><circle cx="352" cy="160" r="6"/></g></svg>${diagramLabel('C_i',50,13,'morphism')}${diagramLabel(String.raw`\ell^2`,92,41,'morphism')}${diagramLabel('2p',16,62,'morphism')}${diagramLabel('2q',84,62,'morphism')}</div>`};
const doubleLineGeometry=FIGURES['double-line'].html;
FIGURES['double-line'].html=()=>doubleLineGeometry().replace(paperMath('2p'),paperMath('2p_1')).replace(paperMath('2q'),paperMath('2p_2'));
const boundaryGeometry=FIGURES.boundary.html;
FIGURES.boundary.html=()=>`<div class="geometry-diagram" role="img" aria-label="Two rational components meeting at a node, with markings one and two on the left and three, four and five on the right"><svg viewBox="0 0 420 325" aria-hidden="true"><g fill="none" stroke-width="2.4"><ellipse cx="130" cy="151" rx="78" ry="100" stroke="var(--accent)"/><ellipse cx="286" cy="151" rx="78" ry="100" stroke="var(--wood-light)"/></g><circle cx="208" cy="151" r="5" fill="var(--gold)"/><g fill="var(--accent)"><circle cx="69" cy="89" r="5"/><circle cx="69" cy="213" r="5"/></g><g fill="var(--wood-light)"><circle cx="331" cy="69" r="5"/><circle cx="364" cy="151" r="5"/><circle cx="331" cy="232" r="5"/></g></svg>${diagramLabel(String.raw`\mathbb P^1`,31,46)}${diagramLabel(String.raw`\mathbb P^1`,68,46)}${diagramLabel('1',10,22,'morphism')}${diagramLabel('2',10,71,'morphism')}${diagramLabel('3',85,15,'morphism')}${diagramLabel('4',93,46,'morphism')}${diagramLabel('5',85,77,'morphism')}${diagramLabel('D^{12}=D^{345}',50,91,'morphism')}</div>`;
FIGURES.crossratio.html=()=>`<div class="geometry-diagram" role="img" aria-label="Three linearly equivalent boundary points on projective one-space"><svg viewBox="0 0 420 325" aria-hidden="true"><ellipse cx="210" cy="150" rx="157" ry="103" fill="none" stroke="var(--wood-light)" stroke-width="2"/><g fill="var(--accent)"><circle cx="81" cy="92" r="6"/><circle cx="210" cy="253" r="6"/><circle cx="339" cy="92" r="6"/></g></svg>${diagramLabel(String.raw`\mathbb P^1`,50,45)}${diagramLabel(String.raw`ij\mid k\ell`,15,15,'morphism')}${diagramLabel(String.raw`ik\mid j\ell`,50,90,'morphism')}${diagramLabel(String.raw`i\ell\mid jk`,84,15,'morphism')}</div>`;
FIGURES.twelve.html=()=>`<div class="diagram-caption">${paperMath(String.raw`A^\bullet(\mathbb P^5)`)}</div><div class="number-tiles">${['1',String.raw`\alpha`,String.raw`\alpha^2`,String.raw`\alpha^3`,String.raw`\alpha^4`,String.raw`\alpha^5`].map(x=>`<span>${paperMath(x)}</span>`).join('')}</div><div class="diagram-caption">Two shifted copies of ${paperMath(String.raw`A^\bullet(\mathbb P^2)`)}</div><div class="number-tiles">${['1',String.raw`\eta`,String.raw`\eta^2`,'1',String.raw`\eta`,String.raw`\eta^2`].map(x=>`<span class="exceptional">${paperMath(x)}</span>`).join('')}</div><div style="text-align:center;font-size:64px;color:var(--accent)">6 + 3 + 3</div>`;
const oldCubic=FIGURES.cubic.html;
FIGURES.cubic.html=()=>oldCubic().replace('Secants are parametrized by Sym² P¹ ≅ P².',`The twisted cubic ${paperMath(String.raw`C=\nu_3(\mathbb P^1)`)}`);


FIGURES['tangency-intersection']={
  label:'Five tangency sextics · Veronese surface and isolated points',
  html:()=>`<div class="tangency-figure">
    <div class="tangency-figure-heading">${paperMath(String.raw`S_1\cap\cdots\cap S_5\subset\mathbb P^5`)}</div>
    <div class="geometry-diagram tangency-support" role="img" aria-label="Schematic reduced support of the common zero locus of five general tangency sextics in projective five-space: the two-dimensional Veronese surface of double lines and isolated solution points away from it. Only a few isolated points are drawn.">
      <svg viewBox="0 0 420 360" aria-hidden="true">
        <rect x="12" y="10" width="396" height="338" rx="16" fill="none" stroke="var(--wood-light)" stroke-width="1.3" opacity=".55"/>
        <path d="M53 197 C75 148 139 116 207 144 C230 154 248 173 257 200 C236 238 176 280 99 262 C72 255 58 230 53 197Z" fill="var(--gold)" fill-opacity=".13" stroke="var(--gold)" stroke-width="2.1"/>
        <g fill="none" stroke="var(--gold)" stroke-width="1.2" opacity=".75">
          <path d="M66 173 C108 211 170 234 239 224"/>
          <path d="M87 152 C137 193 197 216 257 200"/>
          <path d="M55 217 C99 250 153 264 207 247"/>
          <path d="M84 255 C77 214 93 169 122 138"/>
          <path d="M122 266 C112 216 135 169 161 136"/>
          <path d="M164 263 C148 217 171 172 197 141"/>
          <path d="M205 248 C185 214 203 182 230 160"/>
        </g>
        <g fill="var(--accent)" stroke="var(--ground)" stroke-width="1.6">
          <circle cx="76" cy="81" r="5.4"/><circle cx="178" cy="62" r="5.4"/>
          <circle cx="273" cy="89" r="5.4"/><circle cx="340" cy="62" r="5.4"/>
          <circle cx="365" cy="207" r="5.4"/><circle cx="310" cy="278" r="5.4"/>
          <circle cx="369" cy="305" r="5.4"/>
        </g>
        <path d="M296 129 L278 97 M296 164 L358 201" fill="none" stroke="var(--accent)" stroke-width="1.2" opacity=".65"/>
        <path d="M145 297 L148 271" fill="none" stroke="var(--gold)" stroke-width="1.3"/>
      </svg>
      <div class="isolated-points-label">Isolated<br>solution points</div>
      <div class="veronese-label">${paperMath(String.raw`V\cong\mathbb P^2`)}<span class="veronese-caption">Double lines · dimension 2</span></div>
    </div>
    <div class="diagram-caption">Schematic support; only a few points are drawn.</div>
  </div>`
};


// Actual intersections of x²+y²=1 and y=2x²+b illustrate a simple collision.
// The two panels depict local behavior, not a globally general pencil.
FIGURES['tangency-pencil']={
  label:'Tangency in a pencil · collision of two intersection points',
  html:()=>{
    const panel=(cy,b,tangent)=>{
      const cx=210,r=73;
      const point=(x,y)=>[cx+r*x,cy-r*y];
      const curve=Array.from({length:121},(_,i)=>{const x=-1.02+2.04*i/120;return point(x,2*x*x+b).join(',');}).join(' ');
      const roots=tangent?[.75]:[(3.4+Math.sqrt(8.2))/8,(3.4-Math.sqrt(8.2))/8];
      const points=roots.flatMap(z=>[-1,1].map(sign=>point(sign*Math.sqrt(z),2*z+b)));
      let dots=points.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5.3" fill="var(--gold)" stroke="var(--bay)" stroke-width="1.5"/>`).join('');
      if(tangent){const [x,y]=point(0,-1);dots+=`<circle cx="${x}" cy="${y}" r="8.7" fill="var(--bay)" stroke="var(--gold)" stroke-width="2"/><circle cx="${x}" cy="${y}" r="4.8" fill="var(--gold)"/>`;}
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--wood-light)" stroke-width="2.3"/><polyline points="${curve}" fill="none" stroke="var(--accent)" stroke-width="2.3"/>${dots}`;
    };
    return `<div class="geometry-diagram pencil-collision" role="img" aria-label="Two plane-conic intersections: four distinct intersection points in the first panel; two merge into one ordinary tangency in the second, with two other simple points. This illustrates a simple ramification point of the degree-four map from the fixed conic to the pencil.">
      <svg viewBox="0 0 420 440" aria-hidden="true">${panel(117,-1.1,false)}${panel(327,-1,true)}
        <path d="M365 160 Q405 207 365 260m-1-11 1 11 10-4" fill="none" stroke="var(--gold)" stroke-width="1.6"/>
        <path d="M227 400H293" fill="none" stroke="var(--gold)" stroke-width="1.1"/>
      </svg>
      <div class="collision-caption top">Four distinct intersection points</div>
      <div class="collision-caption bottom">Two points meet: tangency</div>
      ${diagramLabel('2',74,90.6,'morphism')}
      <div class="collision-key"><span>${paperMath('C_i')}</span><span>A conic in the pencil</span></div>
    </div>`;
  }
};


FIGURES['cubic-square']={label:'Twisted cubic blowup square',html:()=>cartesianDiagram(['E',String.raw`\Bl_C\mathbb P^3`,'C',String.raw`\mathbb P^3`],'Cartesian square for the blowup of projective three-space along the twisted cubic')};
FIGURES['conic-contact']={label:'Ordinary tangency of two smooth conics',html:()=>{
  const points=Array.from({length:121},(_,i)=>{const x=-1.04+2.08*i/120;return [210+105*x,170-105*(2*x*x-1)].join(',');}).join(' ');
  return `<div class="geometry-diagram contact-diagram" role="img" aria-label="A circle and a parabola have an ordinary tangency of multiplicity two at their bottom point and two transverse intersections of multiplicity one at the upper left and right. Their intersection multiplicities are two, one, and one.">
    <svg viewBox="0 0 420 350" aria-hidden="true">
      <circle cx="210" cy="170" r="105" fill="none" stroke="var(--wood-light)" stroke-width="2.4"/>
      <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2.4"/>
      <path d="M90 275H330" stroke="var(--gold)" stroke-width="1.5" stroke-dasharray="5 5"/>
      <circle cx="119.0673" cy="117.5" r="5.5" fill="var(--gold)"/>
      <circle cx="300.9327" cy="117.5" r="5.5" fill="var(--gold)"/>
      <circle cx="210" cy="275" r="8.5" fill="var(--bay)" stroke="var(--gold)" stroke-width="2"/>
      <circle cx="210" cy="275" r="4.8" fill="var(--gold)"/>
    </svg>
    ${diagramLabel('p_1',19,31,'morphism')}${diagramLabel('p_2',81,31,'morphism')}
    ${diagramLabel('p',50,87,'morphism')}${diagramLabel('C_i',50,12,'morphism')}
    ${diagramLabel('Q',85,17,'morphism')}
    <div class="diagram-note">A common tangent at ${paperMath('p')}</div>
  </div>`;
}};

FIGURES['elementary-blowup']={label:'Blowup of the zero section of affine space',html:()=>cartesianDiagram([String.raw`\mathbb P_X^{n-1}`,String.raw`\Bl_{0_X}\mathbb A_X^n`,'X',String.raw`\mathbb A_X^n`],'Elementary blowup square: the zero section X in affine n-space over X, with exceptional divisor projective (n minus one)-space over X').replace(diagramLabel('i',49,68,'morphism'),diagramLabel('0_X',49,68,'morphism'))};


FIGURES['additive-proof-excision']={label:'Blowup square for the additive formula',html:()=>{
  const square=`<div class="proof-geometry" role="img" aria-label="Cartesian blowup square: E to Bl_Z X above Z to X"><svg viewBox="0 0 520 180" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="var(--accent)" stroke-width="1.7"><path d="M125 40H295m-7-5 7 5-7 5M80 67V116m-5-7 5 7 5-7M390 67V116m-5-7 5 7 5-7M125 143H345m-7-5 7 5-7 5"/></g><path d="M103 70h17V53" fill="none" stroke="var(--gold)" stroke-width="1.7"/></svg>${diagramLabel('E',15.4,22.2)}${diagramLabel(String.raw`\Bl_ZX`,75,22.2)}${diagramLabel('Z',15.4,79.4)}${diagramLabel('X',75,79.4)}${diagramLabel('j',40,11,'morphism')}${diagramLabel('p',8,50,'morphism')}${diagramLabel(String.raw`\pi`,83,50,'morphism')}${diagramLabel('i',45,91,'morphism')}</div>`;
  return `<div class="proof-intro"><div><p>Under Theorem 3.3, let ${paperMath('r=\\operatorname{codim}_X Z')}.</p><p><strong>Smooth blowup excision</strong> applies to this square.</p></div>${square}</div>`;
}};
FIGURES['additive-proof-tang']={label:'Longke Tang’s Gysin map',html:()=>{
  const gysin=`<div class="proof-geometry" role="img" aria-label="Commutative triangle: E plus to Bl_Z X plus by j, then to the Thom spectrum of O_E minus one by Tang’s Gysin map; the direct map is the zero section"><svg viewBox="0 0 520 180" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="var(--accent)" stroke-width="1.7"><path d="M125 40H295m-7-5 7 5-7 5M390 69L345 114m1-9-1 9 9-1M83 67L225 122m-5-7 5 7-9 2"/></g></svg>${diagramLabel('E_+',15.4,22.2)}${diagramLabel(String.raw`(\Bl_ZX)_+`,75,22.2)}${diagramLabel(String.raw`\operatorname{Th}_E(\mathcal O_E(-1))`,60,82)}${diagramLabel('j',40,11,'morphism')}${diagramLabel(String.raw`\operatorname{gys}_j`,85,52,'morphism')}${diagramLabel('s_0',27,64,'morphism')}</div>`;
  return `<div class="proof-intro"><div><p><strong>Longke Tang’s Gysin map</strong> exists in ${paperMath('\\mathsf{MS}_S')}.</p><p>For the exceptional divisor, ${paperMath('\\mathcal N_{E/\\Bl_ZX}\\cong\\mathcal O_E(-1)')}.</p></div>${gysin}</div>`;
}};


FIGURES['cubic-square-small']={label:'Twisted cubic blowup square · small',html:()=>`<div class="cubic-square-mini" role="img" aria-label="Cartesian blowup square: E maps by j to Bl_C P3, E maps by p to C, Bl_C P3 maps by pi to P3, and C maps by i to P3"><svg viewBox="0 0 300 140" aria-hidden="true"><g fill="none" stroke="var(--accent)" stroke-width="1.4"><path d="M75 28H182m-6-4 6 4-6 4M45 48V91m-4-6 4 6 4-6M240 48V91m-4-6 4 6 4-6M75 112H218m-6-4 6 4-6 4"/></g><path d="M62 52h10V42" fill="none" stroke="var(--gold)" stroke-width="1.4"/></svg>${diagramLabel('E',15,20)}${diagramLabel(String.raw`\Bl_C\mathbb P^3`,80,20)}${diagramLabel('C',15,80)}${diagramLabel(String.raw`\mathbb P^3`,80,80)}${diagramLabel('j',43,9,'morphism')}${diagramLabel('p',8,50,'morphism')}${diagramLabel(String.raw`\pi`,88,50,'morphism')}${diagramLabel('i',48,94,'morphism')}</div>`};

FIGURES['conics-square-small']={label:'Veronese blowup square · small',html:()=>`<div class="cubic-square-mini" role="img" aria-label="Cartesian blowup square: E maps by j to Bl_V P5, E maps by p to V, Bl_V P5 maps by pi to P5, and V maps by i to P5"><svg viewBox="0 0 300 140" aria-hidden="true"><g fill="none" stroke="var(--accent)" stroke-width="1.4"><path d="M75 28H182m-6-4 6 4-6 4M45 48V91m-4-6 4 6 4-6M240 48V91m-4-6 4 6 4-6M75 112H218m-6-4 6 4-6 4"/></g><path d="M62 52h10V42" fill="none" stroke="var(--gold)" stroke-width="1.4"/></svg>${diagramLabel('E',15,20)}${diagramLabel(String.raw`\Bl_V\mathbb P^5`,80,20)}${diagramLabel('V',15,80)}${diagramLabel(String.raw`\mathbb P^5`,80,80)}${diagramLabel('j',43,9,'morphism')}${diagramLabel('p',8,50,'morphism')}${diagramLabel(String.raw`\pi`,88,50,'morphism')}${diagramLabel('i',48,94,'morphism')}</div>`};
