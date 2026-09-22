// A static computation panel; supply a different adapter for live computation.
const M2Live={presetFor:s=>s.code_result?'recorded':null,controls:(preset,result)=>`<div class="recorded-code-output"><p>Output</p>${paperMath(result,true)}</div>`,refresh:()=>{}};
