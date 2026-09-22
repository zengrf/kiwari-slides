/* The password-protected host stores the editable deck on the seminar Mac. */
const DeckStorage=(()=>{
  let revision=null,available=false,busy=false,savedJSON='',storageOK=true;
  const endpoint='/api/slides/deck';
  const snapshot=()=>JSON.stringify(deck);
  const dirty=()=>snapshot()!==savedJSON;
  function status(text,error=false){
    $('#save-status').textContent=text;
    $('#save-status').classList.toggle('save-error',error);
    $('#save-server').disabled=busy||!available;
    $('#save-server').textContent=busy?'Saving…':'Save to server';
  }
  async function request(options={}){
    const response=await fetch(endpoint,{credentials:'same-origin',cache:'no-store',...options});
    if(response.status===401)throw Object.assign(new Error('Sign in again to save. Your browser draft is kept.'),{status:401});
    const result=await response.json().catch(()=>({error:'The save service is unavailable. Your browser draft is kept.'}));
    if(!response.ok)throw Object.assign(new Error(result.error||'Could not save the deck.'),{status:response.status});
    return result;
  }
  function remember(){
    try{
      if(dirty())localStorage.setItem(DRAFT_KEY,JSON.stringify({format:2,deck,baseRevision:revision}));
      else localStorage.removeItem(DRAFT_KEY);
      storageOK=true;
    }catch(e){storageOK=false;}
  }
  function changed(){
    remember();
    $('#save-sign-in').hidden=true;
    status(dirty()?(available?'Unsaved changes · Save to server to publish.':'Changes stay in this browser · export YAML to keep a copy.'):'All changes saved.',false);
    if(!storageOK)status('Browser storage is unavailable. Save to server or export YAML to keep your edits.',true);
  }
  async function load(){
    let original,working;
    if(location.protocol!=='file:'){
      try{
        const result=await request();
        original=validDeck(result.deck);revision=result.revision;available=true;
      }catch(e){/* Static and file previews still support local editing. */}
    }
    if(!original){
      let source=window.DECK_SOURCE;
      if(location.protocol!=='file:'){
        const response=await fetch('deck.yaml',{cache:'no-store'});
        if(!response.ok)throw Error('Could not load deck.yaml');source=await response.text();
      }
      original=validDeck(jsyaml.load(source));
    }
    savedJSON=JSON.stringify(original);working=JSON.parse(savedJSON);
    try{
      const raw=localStorage.getItem(DRAFT_KEY);
      if(raw){
        const stored=JSON.parse(raw);
        const draft=validDeck(stored.format===2?stored.deck:stored);
        if(JSON.stringify(draft)!==savedJSON){
          working=draft;
          revision=stored.format===2?stored.baseRevision:null;
          toast('Loaded your unsaved browser edits.');
        }else localStorage.removeItem(DRAFT_KEY);
      }
    }catch(e){/* Keep the original deck if a browser draft cannot be read. */}
    return {original,deck:working};
  }
  async function write(){
    if(busy||!available)return;
    let copy;
    try{copy=JSON.parse(snapshot());validDeck(copy);}catch(e){status(e.message,true);return;}
    remember();busy=true;$('#save-sign-in').hidden=true;status('Saving to this Mac…');
    try{
      const result=await request({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision,deck:copy})});
      revision=result.revision;original=copy;savedJSON=JSON.stringify(copy);
      remember();busy=false;
      status(dirty()?'Saved. Newer edits are still unsaved.':'Saved to this Mac · available on your other devices.');
      channel?.postMessage({type:'deck-saved',deck:copy,revision});
    }catch(e){
      busy=false;status(e.message||'Could not save. Your browser draft is kept.',true);
      $('#save-sign-in').hidden=e.status!==401;
    }
  }
  async function reload(){
    if(busy)return;
    if(dirty()&&!confirm('Discard this browser’s unsaved edits and load the latest server version?'))return;
    try{
      const result=available?await request():null;
      if(result){original=validDeck(result.deck);revision=result.revision;}
      const id=deck.slides[index].id;
      deck=JSON.parse(JSON.stringify(original));savedJSON=JSON.stringify(original);
      clearTimeout(saveTimer);remember();rebuildSelect();go(Math.max(0,deck.slides.findIndex(s=>s.id===id)));
      $('#save-sign-in').hidden=true;status('Latest saved version loaded.');
      channel?.postMessage(message());
    }catch(e){status(e.message,true);$('#save-sign-in').hidden=e.status!==401;}
  }
  function message(){return {type:'deck',deck,original,revision};}
  function receive(m){
    if(m.type==='deck'&&m.original){original=validDeck(m.original);savedJSON=JSON.stringify(original);revision=m.revision;changed();}
    if(m.type==='deck-saved'){
      original=validDeck(m.deck);savedJSON=JSON.stringify(original);revision=m.revision;changed();
    }
  }
  function setup(){
    $('#save-server').onclick=write;
    $('#reset-draft').onclick=reload;
    $('#save-sign-in').href='/__access/login?next='+encodeURIComponent(location.pathname+location.search+location.hash);
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();write();}});
    if(available&&dirty()&&revision===null)status('An older browser draft is open. Export it to keep a copy, or load the server version before saving.',true);
    else if(available)status(dirty()?'Unsaved browser edits · Save to server to publish.':'All changes saved.');
    else status('Server saving is available on the password-protected host. You can still export YAML here.');
    $('#editor-save-hint').textContent='Changes preview immediately. Save to server makes them available on your other devices. The PDF button prints your current edits.';
  }
  return {load,setup,changed,write,reload,message,receive};
})();
