/* Tangent conics in a moving affine frame. No solver or external dependencies. */
(() => {
  const R=90, bound=640;
  const inputs=[[-72,26,14],[-3,34,17],[68,29,20],[144,24,16],[216,38,19]];
  const colors=['var(--wood-light)','var(--gold)','var(--ink)','var(--wood-light)','var(--gold)'];

  // k u² + v² + 2p u = 0: every member passes through (0,0), with
  // gradient (2p,0). Its tangent is always u=0. For p>0 its projective
  // determinant is -p²: these remain smooth conics, even at the parabola k=0.
  // The sign of k distinguishes ellipse, parabola, and hyperbola.
  function state(seconds,i) {
    const raw=Math.cos(2*Math.PI*(seconds/inputs[i][2]+i/5));
    const z=Math.max(0,(Math.abs(raw)-.12)/.88);
    // A short, smooth pause at k=0 makes the parabolic member visible.
    const k=.64*Math.sign(raw)*z*z*(3-2*z);
    return {k,p:inputs[i][1],kind:k>0?'ellipse':k<0?'hyperbola':'parabola'};
  }

  function roots([c,b,a]) {
    if(Math.abs(a)<1e-12) return Math.abs(b)<1e-12?[]:[-c/b];
    const d=b*b-4*a*c;
    if(d<0) return [];
    const q=-.5*(b+(b<0?-1:1)*Math.sqrt(d));
    return q===0?[-b/(2*a)]:[q/a,c/q];
  }
  const value=(a,t)=>a[0]+t*(a[1]+t*a[2]);
  const deriv=(a,t)=>a[1]+2*t*a[2];
  const fmt=x=>Number(x.toFixed(4));
  function sample(chart,t) {
    const [U,V,W]=chart,w=value(W,t),dw=deriv(W,t),u=value(U,t),v=value(V,t);
    return {x:u/w,y:v/w,dx:(deriv(U,t)*w-u*dw)/(w*w),dy:(deriv(V,t)*w-v*dw)/(w*w)};
  }

  // Two rational charts cover the entire projective conic, including both
  // hyperbola branches. Split analytically at infinity and at the clipping box
  // before drawing: never join across a pole. Cubic Hermite segments reproduce
  // endpoint tangents exactly and approximate the curve to <0.06 SVG units.
  function path(k,p) {
    const charts=[[[0,0,-2*p],[0,2*p,0],[1,0,k]],[[-2*p,0,0],[0,2*p,0],[k,0,1]]];
    const out=[];
    function segment(chart,l,r,A,B,depth=0) {
      const h=(r-l)/3;
      const c1={x:A.x+h*A.dx,y:A.y+h*A.dy},c2={x:B.x-h*B.dx,y:B.y-h*B.dy};
      let error=0;
      for(const s of [.25,.5,.75]) {
        const q=sample(chart,l+(r-l)*s),v=1-s;
        const x=v*v*v*A.x+3*v*v*s*c1.x+3*v*s*s*c2.x+s*s*s*B.x;
        const y=v*v*v*A.y+3*v*v*s*c1.y+3*v*s*s*c2.y+s*s*s*B.y;
        error=Math.max(error,Math.hypot(x-q.x,y-q.y));
      }
      if(error>.06 && depth<14) {
        const m=(l+r)/2,M=sample(chart,m);
        segment(chart,l,m,A,M,depth+1);segment(chart,m,r,M,B,depth+1);
      } else out.push(`C${fmt(c1.x)} ${fmt(c1.y)} ${fmt(c2.x)} ${fmt(c2.y)} ${fmt(B.x)} ${fmt(B.y)}`);
    }
    for(const chart of charts) {
      const [U,V,W]=chart;
      const cuts=[-1,0,1,...roots(W)];
      for(const N of [U,V]) for(const edge of [-bound,bound]) cuts.push(...roots(N.map((a,j)=>a-edge*W[j])));
      const breaks=cuts.filter(t=>t>=-1&&t<=1).sort((a,b)=>a-b).filter((t,i,a)=>i===0||t-a[i-1]>1e-10);
      for(let i=1;i<breaks.length;i++) {
        const l=breaks[i-1],r=breaks[i],m=sample(chart,(l+r)/2);
        if(!Number.isFinite(m.x)||!Number.isFinite(m.y)||Math.abs(m.x)>bound||Math.abs(m.y)>bound) continue;
        const A=sample(chart,l),B=sample(chart,r);
        if(![A.x,A.y,B.x,B.y].every(Number.isFinite)) continue;
        out.push(`M${fmt(A.x)} ${fmt(A.y)}`);segment(chart,l,r,A,B);
      }
    }
    return out.join('');
  }

  function html() {
    const curves=inputs.map(([angle],i)=>{
      const {k,p,kind}=state(0,i);
      return `<g transform="rotate(${angle})"><g class="title-contact-orbit"><g class="title-contact-sway" style="--sway-period:${12+i*2}s;--motion-delay:${-i*3}s"><g transform="translate(${R} 0)"><path class="title-moving-conic" data-conic="${i}" data-kind="${kind}" data-k="${k}" data-p="${p}" d="${path(k,p)}" fill="none" stroke="${colors[i]}" stroke-width="1.8" opacity="${i===2?.65:.85}"/><circle class="title-contact-point" cx="0" cy="0" r="3.5" fill="var(--accent)" stroke="var(--panel)" stroke-width="1.2"/></g></g></g></g>`;
    }).join('');
    return `<title-conic-animation><svg class="title-conics" viewBox="0 -165 420 710" role="img" aria-label="Five conics change between ellipses, parabolas, and hyperbolas while remaining tangent at five points traveling around the fixed vermilion conic."><defs><pattern id="paper-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="currentColor" opacity=".06"/></pattern><clipPath id="title-conic-clip"><rect x="8" y="-157" width="404" height="694" rx="8"/></clipPath><radialGradient id="title-conic-fade"><stop offset="68%" stop-color="white"/><stop offset="100%" stop-color="black"/></radialGradient><mask id="title-conic-mask" maskUnits="userSpaceOnUse" x="8" y="-157" width="404" height="694"><rect x="8" y="-157" width="404" height="694" fill="url(#title-conic-fade)"/></mask></defs><rect x="5" y="-160" width="410" height="700" fill="url(#paper-grid)"/><g clip-path="url(#title-conic-clip)" mask="url(#title-conic-mask)"><g transform="translate(210 190)"><g transform="rotate(-12) scale(1.04 .86)"><circle class="title-tangent-conic" cx="0" cy="0" r="${R}" fill="none" stroke="var(--accent)" stroke-width="2.8"/>${curves}</g></g></g></svg></title-conic-animation>`;
  }

  class ConicAnimation extends HTMLElement {
    connectedCallback() {
      // Printed/overview instances keep the static paths emitted by html().
      if(!this.closest('#slide.layout-title')) return;
      this.curves=[...this.querySelectorAll('.title-moving-conic')];
      this.reduced=matchMedia('(prefers-reduced-motion:reduce)');
      this.printing=matchMedia('print');this.elapsed=0;this.last=0;this.frame=0;
      this.sync=()=>{
        cancelAnimationFrame(this.frame);this.frame=0;this.last=0;
        const still=this.reduced.matches||this.printing.matches;
        const paused=still||document.hidden;
        this.toggleAttribute('data-paused',paused);
        if(still) this.draw(0);
        if(!paused) this.frame=requestAnimationFrame(t=>this.tick(t));
      };
      this.reduced.addEventListener('change',this.sync);
      this.printing.addEventListener('change',this.sync);
      document.addEventListener('visibilitychange',this.sync);this.sync();
    }
    draw(seconds) {
      this.curves.forEach((curve,i)=>{
        const {k,p,kind}=state(seconds,i);
        curve.setAttribute('d',path(k,p));curve.dataset.k=k;curve.dataset.kind=kind;
      });
    }
    tick(now) {
      if(!this.isConnected) return;
      if(!this.last) this.last=now;
      if(now-this.last>=1000/30) {
        this.elapsed+=(now-this.last)/1000;this.last=now;this.draw(this.elapsed);
      }
      this.frame=requestAnimationFrame(t=>this.tick(t));
    }
    disconnectedCallback() {
      cancelAnimationFrame(this.frame);
      this.reduced?.removeEventListener('change',this.sync);
      this.printing?.removeEventListener('change',this.sync);
      if(this.sync) document.removeEventListener('visibilitychange',this.sync);
    }
  }
  window.TitleConics={html,state,path};
  customElements.define('title-conic-animation',ConicAnimation);
})();
