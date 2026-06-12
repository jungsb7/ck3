'use strict';

/* ---------- 순수 코드형 주파수 합성 오디오 시스템 ---------- */
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSynthSFX(type) {
  initAudio();
  if (!audioCtx) return;
  
  const now = audioCtx.currentTime;
  
  switch(type) {
    case 'event':
      const clickOsc = audioCtx.createOscillator();
      const clickGain = audioCtx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(380, now);
      clickOsc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
      
      clickGain.gain.setValueAtTime(0.15, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      clickOsc.connect(clickGain);
      clickGain.connect(audioCtx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.1);
      break;

    case 'gold':
      [880, 1320].forEach((freq, i) => {
        const coinOsc = audioCtx.createOscillator();
        const coinGain = audioCtx.createGain();
        const timeOffset = i * 0.05;
        
        coinOsc.type = 'sine';
        coinOsc.frequency.setValueAtTime(freq, now + timeOffset);
        
        coinGain.gain.setValueAtTime(0.1, now + timeOffset);
        coinGain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.3);
        
        coinOsc.connect(coinGain);
        coinGain.connect(audioCtx.destination);
        coinOsc.start(now + timeOffset);
        coinOsc.stop(now + timeOffset + 0.3);
      });
      break;

    case 'war':
      [-8, 8].forEach(detune => {
        const hornOsc = audioCtx.createOscillator();
        const hornGain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        
        hornOsc.type = 'sawtooth';
        hornOsc.frequency.setValueAtTime(95, now);
        hornOsc.frequency.linearRampToValueAtTime(80, now + 0.8);
        hornOsc.detune.setValueAtTime(detune, now);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        
        hornGain.gain.setValueAtTime(0.2, now);
        hornGain.gain.linearRampToValueAtTime(0.18, now + 0.1);
        hornGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        
        hornOsc.connect(filter);
        filter.connect(hornGain);
        hornGain.connect(audioCtx.destination);
        
        hornOsc.start(now);
        hornOsc.stop(now + 0.8);
      });
      break;

    case 'death':
      [110, 165, 220, 275].forEach((freq, idx) => {
        const bellOsc = audioCtx.createOscillator();
        const bellGain = audioCtx.createGain();
        const duration = 3.0 / (idx * 0.5 + 1);
        
        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(freq, now);
        
        bellGain.gain.setValueAtTime(idx === 0 ? 0.25 : 0.08, now);
        bellGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        bellOsc.connect(bellGain);
        bellGain.connect(audioCtx.destination);
        
        bellOsc.start(now);
        bellOsc.stop(now + duration);
      });
      break;
  }
}

/* ---------- 성격 및 유틸리티 기초 함수 (위로 끌어올림) ---------- */
const TRAITS = {
  brave:     {n:'용감',   opp:'craven',    mod:{mar:2,prow:3}, ai:{bold:2}},
  craven:    {n:'비겁',   opp:'brave',     mod:{mar:-2,intr:2}, ai:{bold:-2}},
  calm:      {n:'침착',   opp:'wrathful',  mod:{dip:1,intr:1}, ai:{rat:2}, stressLossMul:1.1},
  wrathful:  {n:'분노',   opp:'calm',      mod:{dip:-1,mar:3,intr:-1}, ai:{venge:2,bold:1}},
  chaste:    {n:'순결',   opp:'lustful',   mod:{learn:2}, fert:-0.25},
  lustful:   {n:'호색',   opp:'chaste',    mod:{intr:2}, fert:0.25},
  content:   {n:'만족',   opp:'ambitious', mod:{learn:2,intr:-1}, ai:{greed:-2}, stressLossMul:1.1},
  ambitious: {n:'야심',   opp:'content',   mod:{dip:1,mar:1,stew:1,intr:1,learn:1}, ai:{greed:2,bold:2}, stressGainMul:1.25},
  diligent:  {n:'근면',   opp:'lazy',      mod:{dip:2,stew:3,learn:3}, ai:{energy:2}},
  lazy:      {n:'나태',   opp:'diligent',  mod:{dip:-1,mar:-1,stew:-1,intr:-1,learn:-1}, ai:{energy:-2}, stressLossMul:1.5},
  forgiving: {n:'관용',   opp:'vengeful',  mod:{dip:2,intr:-2,learn:1}, ai:{venge:-3}},
  vengeful:  {n:'복수심', opp:'forgiving', mod:{dip:-2,mar:1,intr:1}, ai:{venge:3}},
  greedy:    {n:'탐욕',   opp:'generous',  mod:{stew:2,dip:-1}, ai:{greed:3}},
  generous:  {n:'관대',   opp:'greedy',    mod:{stew:-1,dip:3}, ai:{greed:-2}},
  honest:    {n:'정직',   opp:'deceitful', mod:{dip:1,intr:-2}, ai:{honor:2}},
  deceitful: {n:'기만',   opp:'honest',    mod:{dip:-1,intr:3}, ai:{honor:-3}},
  just:      {n:'공정',   opp:'arbitrary', mod:{stew:2,learn:1}, ai:{honor:2}},
  arbitrary: {n:'자의적', opp:'just',      mod:{stew:-2,intr:1}, ai:{honor:-1}},
  kind:      {n:'친절',   opp:'cruel',     mod:{dip:2,intr:-1}, ai:{comp:2}},
  cruel:     {n:'잔인',   opp:'kind',      mod:{dip:-1,intr:1,mar:1}, ai:{comp:-3}},
  patient:   {n:'인내',   opp:'impatient', mod:{learn:2,intr:1}, ai:{rat:1}},
  impatient: {n:'조급',   opp:'patient',   mod:{learn:-1}, ai:{energy:1,rat:-1}},
  temperate: {n:'절제',   opp:'gluttonous',mod:{stew:2}, hp:0.25},
  gluttonous:{n:'탐식',   opp:'temperate', mod:{stew:-2}, hp:-0.25},
  gregarious:{n:'사교적', opp:'shy',       mod:{dip:2}, ai:{soc:2}},
  shy:       {n:'내성적', opp:'gregarious',mod:{dip:-2,learn:1}, ai:{soc:-2}},
};
const PERSONALITY_KEYS = Object.keys(TRAITS);

const CHILD_TRAITS = {
  curious:   {n:'호기심',     foci:['dip','learn']},
  energetic: {n:'활기참',     foci:['mar','stew']},
  willful:   {n:'고집스러움', foci:['intr','mar']},
  devout:    {n:'경건함',     foci:['learn','dip']},
  precocious:{n:'조숙함',     foci:['stew','learn']},
  rowdy:     {n:'거칠음',     foci:['mar','intr']},
};

const SKILLS = {dip:'외교', mar:'무예', stew:'내정', intr:'음모', learn:'학문'};
const EDU_NAMES = {
  dip:['서툰 협상가','수습 외교관','노련한 협상가','카리스마적 협상가'],
  mar:['그릇된 전사','강인한 병사','숙련된 전술가','명석한 전략가'],
  stew:['방탕한 낭비가','검약한 관리','재정 설계자','미다스의 손'],
  intr:['아둔한 음모가','의심 많은 모사꾼','계략의 직조자','은밀한 그림자'],
  learn:['미숙한 학생','순진한 호사가','박식한 사색가','명민한 지성인'],
};
const EDU_BONUS = [1,2,3,5];

function randName(){ return ['도나하','셰클런','루어르크','돈하드','터를록'][Math.floor(Math.random()*5)]; }
function randTraits(n){
  const out=[]; let pool=[...PERSONALITY_KEYS];
  while(out.length<n&&pool.length){
    const t=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
    if(!out.includes(TRAITS[t].opp)) out.push(t);
  }
  return out;
}
function randStats(){ const r=()=>3+Math.floor(Math.random()*8); return {dip:r(),mar:r(),stew:r(),intr:r(),learn:r(),prow:r()}; }
function randKey(o){ const k=Object.keys(o); return k[Math.floor(Math.random()*k.length)]; }

/* ---------- 3계층 영지 데이터 및 건물 구성 ---------- */
const BARONIES = {
  b_limerick:  {n:'리머릭',   county:'c_thomond', troops:340, gold:100, pop:65, cap:340, owner:null},
  b_nenagh:    {n:'네나',     county:'c_thomond', troops:220, gold: 55, pop:60, cap:220, owner:null},
  b_roscrea:   {n:'로스크리아',county:'c_thomond', troops:200, gold: 50, pop:58, cap:200, owner:null},
  b_kilmallock:{n:'킬말록',   county:'c_thomond', troops:180, gold: 45, pop:55, cap:180, owner:null},
  b_ennis:     {n:'에니스',   county:'c_ennis',   troops:260, gold: 70, pop:62, cap:260, owner:null},
  b_kincora:   {n:'킨코라',   county:'c_ennis',   troops:190, gold: 50, pop:58, cap:190, owner:null},
  b_waterford: {n:'워터퍼드', county:'c_ormond',  troops:280, gold: 90, pop:60, cap:280, owner:null},
  b_emly:      {n:'에믈리',   county:'c_ormond',  troops:180, gold: 45, pop:55, cap:180, owner:null},
  b_clonmel:   {n:'클론멜',   county:'c_ormond',  troops:200, gold: 55, pop:57, cap:200, owner:null},
  b_tralee:    {n:'트랄리',   county:'c_desmond', troops:200, gold: 50, pop:55, cap:200, owner:null},
  b_cork:      {n:'코크',     county:'c_desmond', troops:260, gold: 75, pop:62, cap:260, owner:null},
  b_kinsale:   {n:'킨세일',   county:'c_desmond', troops:180, gold: 50, pop:55, cap:180, owner:null},
  b_baltimore: {n:'볼티모어', county:'c_desmond', troops:160, gold: 40, pop:52, cap:160, owner:null},
  b_wexford:   {n:'웩스퍼드', county:'c_leinster',troops:290, gold: 80, pop:58, cap:290, owner:null},
  b_enniscorthy:{nennis코시',county:'c_leinster',troops:200, gold:50, pop:55, cap:200, owner:null},
  b_ferns:     {n:'퍼언스',   county:'c_leinster',troops:180, gold: 45, pop:55, cap:180, owner:null},
  b_carlow:    {n:'칼로',     county:'c_leinster',troops:200, gold: 55, pop:57, cap:200, owner:null},
  b_gowran:    {n:'고란',     county:'c_ossory',  troops:220, gold: 60, pop:57, cap:220, owner:null},
  b_kilkenny:  {n:'킬케니',   county:'c_ossory',  troops:240, gold: 65, pop:58, cap:240, owner:null},
  b_athy:      {n:'에이시',   county:'c_ossory',  troops:180, gold: 45, pop:55, cap:180, owner:null},
  b_carrick:   {n:'캐릭',     county:'c_ossory',  troops:170, gold: 42, pop:54, cap:170, owner:null},
  b_dublin:    {n:'더블린',   county:'c_dublin',  troops:380, gold:130, pop:65, cap:380, owner:null},
  b_wicklow:   {n:'위클로',   county:'c_dublin',  troops:200, gold: 55, pop:58, cap:200, owner:null},
  b_kildare:   {n:'킬데어',   county:'c_dublin',  troops:220, gold: 60, pop:58, cap:220, owner:null},
  b_trim:      {n:'트림',     county:'c_meath',   troops:260, gold: 70, pop:60, cap:260, owner:null},
  b_drogheda:  {n:'드로이다', county:'c_meath',   troops:220, gold: 65, pop:60, cap:220, owner:null},
  b_kells:     {n:'켈스',     county:'c_meath',   troops:190, gold: 50, pop:57, cap:190, owner:null},
  b_athlone:   {n:'애슬론',   county:'c_athlone', troops:250, gold: 65, pop:58, cap:250, owner:null},
  b_birr:      {n:'버',       county:'c_athlone', troops:190, gold: 48, pop:55, cap:190, owner:null},
  b_uisneach:  {n:'위슈낙',   county:'c_athlone', troops:160, gold: 40, pop:52, cap:160, owner:null},
  b_galway:    {n:'골웨이',   county:'c_connacht',troops:310, gold: 80, pop:62, cap:310, owner:null},
  b_athenry:   {n:'애슨리',   county:'c_connacht',troops:210, gold: 55, pop:58, cap:210, owner:null},
  b_tuam:      {n:'투암',     county:'c_connacht',troops:200, gold: 52, pop:57, cap:200, owner:null},
  b_da_chainoc:{n:'다체이녹', county:'c_connacht',troops:180, gold: 45, pop:55, cap:180, owner:null},
  b_cruachu:   {n:'크루하후', county:'c_mayo',    troops:200, gold: 50, pop:55, cap:200, owner:null},
  b_castlebar: {n:'캐슬바',   county:'c_mayo',    troops:210, gold: 52, pop:56, cap:210, owner:null},
  b_sligo:     {n:'슬라이고', county:'c_mayo',    troops:230, gold: 58, pop:57, cap:230, owner:null},
  b_killala:   {n:'킬랄라',   county:'c_mayo',    troops:175, gold: 42, pop:53, cap:175, owner:null},
  b_dromahair: {n:'드로마헤르',county:'c_breifne', troops:230, gold: 58, pop:57, cap:230, owner:null},
  b_belcoo:    {n:'벨쿠',     county:'c_breifne', troops:180, gold: 42, pop:53, cap:180, owner:null},
  b_longford:  {n:'롱퍼드',   county:'c_breifne', troops:190, gold: 48, pop:55, cap:190, owner:null},
  b_cavan:     {n:'캐번',     county:'c_breifne', troops:200, gold: 50, pop:56, cap:200, owner:null},
  b_adragh:    {n:'아드라그', county:'c_breifne', troops:160, gold: 38, pop:52, cap:160, owner:null},
  b_downpatrick:{n:'다운패트릭',county:'c_ulster', troops:280, gold: 72, pop:60, cap:280, owner:null},
  b_slemish:   {n:'슬레미시', county:'c_ulster',  troops:200, gold: 50, pop:57, cap:200, owner:null},
  b_carrickfergus:{n:'캐릭퍼거스',county:'c_ulster',troops:240, gold:65, pop:60, cap:240, owner:null},
  b_bangor:    {n:'뱅거',     county:'c_ulster',  troops:185, gold: 45, pop:55, cap:185, owner:null},
  b_dundalk:   {n:'던돌크',   county:'c_oriel',   troops:240, gold: 62, pop:58, cap:240, owner:null},
  b_armagh:    {n:'아르마',   county:'c_oriel',   troops:260, gold: 70, pop:60, cap:260, owner:null},
  b_ardee:     {n:'아르디',   county:'c_oriel',   troops:190, gold: 48, pop:55, cap:190, owner:null},
  b_clogher:   {n:'클로허',   county:'c_oriel',   troops:180, gold: 44, pop:54, cap:180, owner:null},
  b_dungannon: {n:'덩거논',   county:'c_oriel',   troops:185, gold: 46, pop:54, cap:185, owner:null},
  b_donegal:   {n:'도네갈',   county:'c_ailech',  troops:220, gold: 55, pop:57, cap:220, owner:null},
  b_raphoe:    {n:'래포',     county:'c_ailech',  troops:190, gold: 48, pop:55, cap:190, owner:null},
  b_fahan:     {n:'파한',     county:'c_ailech',  troops:175, gold: 42, pop:53, cap:175, owner:null},
  b_derry:     {n:'더리',     county:'c_ailech',  troops:210, gold: 55, pop:58, cap:210, owner:null},
};

const COUNTIES = {
  c_thomond: {n:'톰몬드',   duchy:'d_munster',  capital:'b_limerick',  baronies:['b_limerick','b_nenagh','b_roscrea','b_kilmallock'], x:118, y:368},
  c_ennis:   {n:'에니스',   duchy:'d_munster',  capital:'b_ennis',     baronies:['b_ennis','b_kincora'],                              x: 82, y:398},
  c_ormond:  {n:'오몬드',   duchy:'d_munster',  capital:'b_waterford', baronies:['b_waterford','b_emly','b_clonmel'],                 x:182, y:380},
  c_desmond: {n:'데스몬드', duchy:'d_munster',  capital:'b_cork',      baronies:['b_tralee','b_cork','b_kinsale','b_baltimore'],      x:125, y:425},
  c_leinster:{n:'레인스터', duchy:'d_leinster', capital:'b_wexford',   baronies:['b_wexford','b_enniscorthy','b_ferns','b_carlow'],   x:282, y:332},
  c_ossory:  {n:'오서리',   duchy:'d_leinster', capital:'b_gowran',    baronies:['b_gowran','b_kilkenny','b_athy','b_carrick'],       x:258, y:368},
  c_dublin:  {n:'더블린',   duchy:'d_dublin',   capital:'b_dublin',    baronies:['b_dublin','b_wicklow','b_kildare'],                 x:318, y:248},
  c_meath:   {n:'미드',     duchy:'d_meath',    capital:'b_trim',      baronies:['b_trim','b_drogheda','b_kells'],                    x:255, y:192},
  c_athlone: {n:'애슬론',   duchy:'d_meath',    capital:'b_athlone',   baronies:['b_athlone','b_birr','b_uisneach'],                  x:198, y:238},
  c_connacht:{n:'코노트',   duchy:'d_connacht', capital:'b_galway',    baronies:['b_galway','b_athenry','b_tuam','b_da_chainoc'],     x:102, y:238},
  c_mayo:    {n:'마요',     duchy:'d_connacht', capital:'b_sligo',     baronies:['b_cruachu','b_castlebar','b_sligo','b_killala'],    x: 68, y:192},
  c_breifne: {n:'브레프네', duchy:'d_breifne',  capital:'b_dromahair', baronies:['b_dromahair','b_belcoo','b_longford','b_cavan','b_adragh'], x:168, y:168},
  c_ulster:  {n:'얼스터',   duchy:'d_ulster',   capital:'b_downpatrick',baronies:['b_downpatrick','b_slemish','b_carrickfergus','b_bangor'], x:262, y:78},
  c_oriel:   {n:'오리얼',   duchy:'d_ulster',   capital:'b_armagh',    baronies:['b_dundalk','b_armagh','b_ardee','b_clogher','b_dungannon'], x:238, y:115},
  c_ailech:  {n:'애일라흐', duchy:'d_ulster',   capital:'b_donegal',   baronies:['b_donegal','b_raphoe','b_fahan','b_derry'],         x:185, y:55},
};

const DUCHIES = {
  d_munster: {n:'먼스터 공작령',  counties:['c_thomond','c_ennis','c_ormond','c_desmond'], color:'#3d6b4a'},
  d_leinster:{n:'레인스터 공작령',counties:['c_leinster','c_ossory'],                       color:'#9c6b3c'},
  d_dublin:  {n:'더블린 공작령',  counties:['c_dublin'],                                    color:'#5a6e85'},
  d_meath:   {n:'미드 공작령',    counties:['c_meath','c_athlone'],                         color:'#6e7a3c'},
  d_connacht:{n:'코노트 공작령',  counties:['c_connacht','c_mayo'],                         color:'#6d5380'},
  d_breifne: {n:'브레프네 공작령',counties:['c_breifne'],                                   color:'#4f5d68'},
  d_ulster:  {n:'얼스터 공작령',  counties:['c_ulster','c_oriel','c_ailech'],               color:'#8a4a3c'},
};

const BUILDINGS = {
  barracks:   { n:'병영',     icon:'⚔', cost:80,  time:6,  cat:'mil', effect:{ troops_cap:+150, troops_regen:+2 }, desc:'병력 상한 +150, 매달 회복 +2' },
  watchtower: { n:'망루',     icon:'🗼', cost:60,  time:4,  cat:'mil', effect:{ troops_cap:+80,  war_score_def:+5 }, desc:'병력 상한 +80, 방어 전황 +5' },
  market:     { n:'시장',     icon:'🪙', cost:70,  time:5,  cat:'eco', effect:{ gold_income:+4 }, desc:'매달 금 +4' },
  mill:       { n:'방앗간',   icon:'⚙', cost:50,  time:4,  cat:'eco', effect:{ gold_income:+2, pop_growth:+1 }, desc:'매달 금 +2, 민심 유지 +1' },
  chapel:     { n:'예배당',   icon:'✝', cost:60,  time:5,  cat:'rel', effect:{ prestige:+1, pop_growth:+2 }, desc:'매달 위신 +1, 민심 +2' },
  fortify:    { n:'성벽 강화', icon:'🏰', cost:100, time:8, cat:'def', effect:{ troops_cap:+200, siege_defense:+15 }, desc:'병력 상한 +200, 공성 방어 +15%' },
  farmstead:  { n:'농장',     icon:'🌾', cost:40,  time:3,  cat:'eco', effect:{ gold_income:+1, pop_growth:+3 }, desc:'매달 금 +1, 민심 +3' },
};
const BUILDING_SLOTS = 2;

const BUILDING_TYPES = {
  barracks: { n:'병영', icon:'⚔', cost:80, buildMonths:6, desc:'병력 상한 +150, 병력 회복 +3/월', onComplete: (b)=>{ b.cap+=150; b.troops=Math.min(b.cap,b.troops+50); }, monthly: (b)=>{ b.troops=Math.min(b.cap,b.troops+3); } },
  market: { n:'시장', icon:'💰', cost:60, buildMonths:5, desc:'세금 수입 +8/월', monthly: (b,seatB)=>{ if(seatB) seatB.gold=Math.min(3500,seatB.gold+8); } },
  chapel: { n:'교회당', icon:'✝', cost:50, buildMonths:4, desc:'민심 +2/월, 사제 명분 위조 확률 +', monthly: (b)=>{ b.pop=Math.min(100,(b.pop||60)+2); } },
  walls: { n:'성벽', icon:'🏰', cost:100, buildMonths:8, desc:'공성 저항 +1턴, 방어 전투력 +10%', onComplete: ()=>{}, monthly: ()=>{} },
  farm: { n:'농장', icon:'🌾', cost:45, buildMonths:4, desc:'민심 +1/월, 세금 수입 +4/월', monthly: (b,seatB)=>{ b.pop=Math.min(100,(b.pop||60)+1); if(seatB) seatB.gold=Math.min(3500,seatB.gold+4); } },
  mill: { n:'제분소', icon:'⚙', cost:55, buildMonths:5, desc:'병력 회복 +2/월, 세금 수입 +5/월', monthly: (b,seatB)=>{ b.troops=Math.min(b.cap,b.troops+2); if(seatB) seatB.gold=Math.min(3500,seatB.gold+5); } },
};

/* 남작령 초기화 */
(()=>{ 
  for(const bid in BARONIES) { 
    if(!BARONIES[bid].buildings) BARONIES[bid].buildings=[]; 
    if(!BARONIES[bid].building_queue) BARONIES[bid].building_queue=null;
    if(!BARONIES[bid].slots) BARONIES[bid].slots=2;
  } 
})();

function startBuilding(bid, btype){
  const b=BARONIES[bid]; const p=playerChar();
  if(!b||b.owner!==p.id) return false;
  if(b.buildings.length>=BUILDING_SLOTS){ log('건물 슬롯이 가득 찼습니다.'); return false; }
  if(b.buildings.some(x=>x.type===btype)){ log('이미 건설된 건물입니다.'); return false; }
  const bp=BUILDINGS[btype] || BUILDING_TYPES[btype]; if(!bp) return false;
  const seat=BARONIES[p.region]; if(!seat) return false;
  const cost = bp.cost;
  if(seat.gold<cost){ log(`금이 부족합니다. (필요: ${cost})`,'dip'); return false; }
  seat.gold-=cost;
  b.buildings.push({type:btype, progress:0, done:false});
  playSynthSFX('gold');
  log(`${b.n}에 ${bp.n} 건설을 시작했습니다. (${bp.time || bp.buildMonths}개월 소요)`,'good');
  return true;
}

function buildingPulse(){
  for(const bid in BARONIES){
    const b=BARONIES[bid];
    if(!b.buildings?.length) continue;
    for(const slot of b.buildings){
      if(slot.done) continue;
      slot.progress++;
      const bp=BUILDINGS[slot.type] || BUILDING_TYPES[slot.type]; if(!bp) continue;
      const targetTime = bp.time || bp.buildMonths;
      if(slot.progress>=targetTime){
        slot.done=true;
        if(bp.effect?.troops_cap) b.cap=(b.cap||b.troops)+bp.effect.troops_cap;
        if(bp.onComplete) bp.onComplete(b);
        if(bid===playerChar().region||b.owner===state.player){
          log(`${b.n}의 <b>${bp.n}</b>이(가) 완공됐습니다! ${bp.desc||''}`,'good');
        }
      }
    }
  }
}

function buildingBonus(bid, key){
  const b=BARONIES[bid]; if(!b?.buildings) return 0;
  return b.buildings.filter(s=>s.done).reduce((sum,s)=>{
    const bp=BUILDINGS[s.type]; return bp?.effect?.[key]?sum+(bp.effect[key]||0):sum;
  },0);
}

const REGIONS = BARONIES;
const ADJ = {};
(()=>{
  for(const bid in BARONIES){
    const cid = BARONIES[bid].county;
    const adjCids = COUNTY_ADJ[cid] || [];
    ADJ[bid] = adjCids.map(ac => COUNTIES[ac].capital).filter(Boolean);
  }
})();

const DUCHY_COLOR = {};
for(const did in DUCHIES){
  for(const cid of DUCHIES[did].counties){
    for(const bid of COUNTIES[cid].baronies) DUCHY_COLOR[bid] = DUCHIES[did].color;
  }
}

/* ---------- 역사 가동 지배자 데이터 ---------- */
const state = {
  year:1066, month:9, day:15,
  paused:true, speed:1, timer:null,
  player:murchad.id,
  schemes:[], wars:[], truces:{}, npcAlliances:[], alliances:[],
  prestige:120,
  successionLaw:'partition', 
  council:{ chancellor:null, marshal:null, steward:null, spymaster:null, chaplain:null },
  claims:[],  
  popupQ:[], modalOpen:false,
  over:false, victory:false,
  introDone:false,
};
const REGIONS_MAP = BARONIES;

function log(msg, cls){
  const p=document.createElement('p'); if(cls)p.className=cls;
  p.innerHTML=`<span class="d">${state.year}년 ${state.month}월 ${state.day}일</span>${msg}`;
  const el=document.getElementById('log'); el.appendChild(p); el.scrollTop=el.scrollHeight;
  while(el.children.length>140) el.removeChild(el.firstChild);
}

/* ---------- 팝업 연산 ---------- */
function popup(p){ state.popupQ.push(p); flushPopups(); }
function flushPopups(){
  if(state.modalOpen || !state.popupQ.length) return;
  if(!state.paused) state.autoResume=true;   
  pause();
  const p = state.popupQ.shift();
  showModal(p);
}
function showModal(p){
  state.modalOpen=true;
  playSynthSFX('event');
  const box=document.getElementById('modalBox');
  let h=`<h2>${p.title}</h2><div class="sub">${p.sub||'이벤트'}</div><div class="body">${p.body||''}</div>`;
  if(p.html) h+=p.html;
  h+=`<div class="opts">`;
  (p.opts||[{t:'확인'}]).forEach((o,i)=>{
    h+=`<button onclick="initAudio(); modalPick(${i})">${o.t}${o.d?`<small>${o.d}</small>`:''}</button>`;
  });
  h+=`</div>`;
  box.innerHTML=h;
  box._opts=p.opts||[{}];
  document.getElementById('shade').classList.add('show');
}
function modalPick(i){
  initAudio();
  const box=document.getElementById('modalBox');
  const o=box._opts[i];
  closeModal();
  if(o&&o.f) o.f();
  flushPopups();
  if(!state.modalOpen && !state.popupQ.length && state.autoResume){
    state.autoResume=false; resume();
  }
  renderAll();
}
function closeModal(){
  state.modalOpen=false;
  document.getElementById('shade').classList.remove('show');
}

/* ---------- 스트레스 수식 ---------- */
function addStress(c,amt,why){
  if(c.dead) return;
  let g=amt;
  for(const t of c.traits){ if(TRAITS[t]&&TRAITS[t].stressGainMul&&amt>0) g*=TRAITS[t].stressGainMul; }
  const before=stressLvl(c);
  c.stress=Math.max(0,Math.min(150,c.stress+Math.round(g)));
  const after=stressLvl(c);
  if(c.id===state.player&&amt!==0&&why) log(`스트레스 ${amt>0?'+':''}${Math.round(g)} — ${why}`);
  if(after>before&&after<3) mentalBreak(c,after);
  if(c.stress>=150) stressDeath(c);
}
function stressLvl(c){ return c.stress>=150?3 : c.stress>=100?2 : c.stress>=50?1 : 0; }
function mentalBreak(c,lvl){
  if(state.year - c.lastBreakY < 5) return;
  c.lastBreakY=state.year;
  if(c.id!==state.player){ c.stress=Math.max(0,c.stress-60); return; }
  popup({title:'정신적 한계', sub:`스트레스 ${lvl}단계 — 정신 붕괴`,
    body:`통치의 무게가 ${c.name}의 어깨를 짓누릅니다. 밤마다 잠을 이루지 못하고, 신하들 앞에서 손이 떨립니다.\n무언가 의지할 것이 필요합니다.`,
    opts:[
      {t:'대처법을 찾는다', d:'스트레스 -80, 이후 스트레스 해소 +20%', f:()=>{c.stress=Math.max(0,c.stress-80); c.copings++; log('대처법을 찾아 마음을 다스립니다.','fam');}},
      {t:'이를 악물고 버틴다', d:'스트레스 +30 — 위험한 선택', f:()=>{addStress(c,30,'억눌린 고통');}},
    ]});
}
function stressDeath(c){
  if(c.dead) return;
  log(`<b>${c.name}</b>이(가) 한계에 도달했습니다. 심장이 멎었습니다.`,'war');
  if(c.id===state.player){
    popup({title:'무너진 왕', sub:'스트레스 3단계',
      body:`${c.name}은(는) 통치의 중압을 끝내 이기지 못했습니다.\n어느 새벽, 침소에서 싸늘하게 발견되었습니다.`,
      opts:[{t:'...', f:()=>kill(c,'스트레스')}]});
  } else kill(c,'스트레스');
}

/* ---------- 상속법 시스템 ---------- */
function kill(c, cause){
  if(c.dead) return;
  c.dead=true;
  if(c.id===state.player || c.ruler) { playSynthSFX('death'); }
  if(c.spouse&&chars[c.spouse]){ chars[c.spouse].spouse=null; addStress(chars[c.spouse],40,'배우자의 죽음'); }
  for(const id in chars){const k=chars[id]; if(!k.dead&&(k.father===c.id||k.mother===c.id)) addStress(k,30,'부모의 죽음');}
  if(c.ruler) succession(c);
  if(c.id===state.player){
    const dist=distributeSuccession(c);
    if(dist){
      const mainHid=Object.keys(dist)[0]; const mainH=chars[mainHid];
      for(const [hid,cids] of Object.entries(dist)){
        const h=chars[hid]; if(!h) continue; h.ruler=true; h.liege=null; h.courtOf=null; cids.forEach(cid=>seizeCounty(hid,cid));
        if(!h.region||!regionsOf(hid).includes(h.region)) h.region=COUNTIES[cids[0]]?.capital||c.region;
      }
      state.player=mainHid;
      const seatName=COUNTIES[countyOf(mainH.region)]?.n||BARONIES[mainH.region]?.n||'?';
      log(`<b>${mainH.name}</b>이(가) ${seatName}의 칭호를 계승했습니다.`,'fam');
      popup({title:'왕은 죽었다', sub:'계승', body:`${c.name}의 시대가 끝났습니다. 사인: ${cause}.`, opts:[{t:'왕은 만세하리라'}]});
    } else { gameOver(`${c.name}이(가) 후계자 없이 사망했습니다.`); }
  } else { log(`<b>${c.name}</b> 사망 (${cause}).`,'war'); }
}

function validHeirs(c){ const kids=Object.values(chars).filter(k=>!k.dead&&(k.father===c.id||k.mother===c.id)&&age(k)>=16); kids.sort((a,b)=>a.byear-b.byear); return kids; }
function distributeSuccession(c){
  const ownedCids=directCountiesOf(c.id); const seatCid=countyOf(c.region)||ownedCids[0]; const heirs=validHeirs(c); if(!heirs.length) return null;
  const law=c.id===state.player?state.successionLaw:'primogeniture'; const mainHeir=heirs[0];
  if(law==='primogeniture'||heirs.length===1||ownedCids.length<=1){ return {[mainHeir.id]:ownedCids}; }
  if(law==='partition'){
    const dist={[mainHeir.id]:[seatCid].filter(Boolean)}; const rest=ownedCids.filter(cid=>cid!==seatCid);
    rest.forEach((cid,i)=>{ const h=heirs[(i+1)%heirs.length]; if(!dist[h.id]) dist[h.id]=[]; dist[h.id].push(cid); }); return dist;
  }
  return {[mainHeir.id]:ownedCids};
}
function succession(c){
  if(c.id===state.player) return; const owned=regionsOf(c.id); if(!owned.length) return cleanupAfterDeath(c); const seat=owned.includes(c.region)?c.region:owned[0]; const dist=distributeSuccession(c);
  if(dist){
    for(const [hid,cids] of Object.entries(dist)){
      let h=chars[hid]; if(!h) continue; h.ruler=true; h.liege=c.liege; h.courtOf=null; cids.forEach(cid=>seizeCounty(hid,cid));
      if(!h.region||!regionsOf(hid).includes(h.region)) h.region=COUNTIES[cids[0]]?.capital||seat;
    }
  }
  cleanupAfterDeath(c);
}

/* ---------- 메인 프론트 루틴 제어 및 타이머 ---------- */
const PANELS={ log: {wrap:'logWrap', render:null}, court:{wrap:'courtWrap', render:'renderCourt'}, dec:{wrap:'decWrap', render:'renderDec'} };
const PANEL_TAB_IDS={log:'logTab',court:'courtTab',dec:'decTab'};

function _showAllTabs(){ Object.values(PANEL_TAB_IDS).forEach(tid=>{ const t=document.getElementById(tid); if(t) t.style.display=''; }); }
function _hideOtherTabs(activeId){
  Object.entries(PANEL_TAB_IDS).forEach(([pid,tid])=>{ const t=document.getElementById(tid); if(!t) return; t.style.display = pid===activeId ? '' : 'none'; });
  Object.keys(PANELS).forEach(k=>{ const w=document.getElementById(PANELS[k].wrap); if(!w) return; w.style.zIndex = k===activeId ? '37' : '35'; });
}

function togglePanel(id){
  initAudio(); const info=PANELS[id]; if(!info) return; const el=document.getElementById(info.wrap); const opening=!el.classList.contains('open');
  Object.keys(PANELS).forEach(k=>{ if(k!==id) document.getElementById(PANELS[k].wrap).classList.remove('open'); });
  if(opening){ playSynthSFX('event'); if(info.render) window[info.render](); el.classList.add('open'); if(id!=='log') pause(); _hideOtherTabs(id); }
  else { el.classList.remove('open'); if(id!=='log') resume(); _showAllTabs(); Object.keys(PANELS).forEach(k=>{ const w=document.getElementById(PANELS[k].wrap); if(w) w.style.zIndex=''; }); }
}
function closePanel(id){ const info=PANELS[id]; if(!info) return; document.getElementById(info.wrap).classList.remove('open'); if(id!=='log') resume(); _showAllTabs(); }
function pause(){ state.paused=true; clearInterval(state.timer); state.timer=null; updPauseBtn(); }
function resume(){ if(state.over||state.modalOpen) return; state.paused=false; const iv = state.speed===1?550 : state.speed===2?260 : 110; clearInterval(state.timer); state.timer=setInterval(tick,iv); updPauseBtn(); }
function setSpeed(s){ state.speed=s; document.querySelectorAll('.spd').forEach(b=>b.classList.toggle('on',+b.dataset.s===s)); if(!state.paused) resume(); }
function updPauseBtn(){ const b=document.getElementById('pauseBtn'); b.textContent=state.paused?'▶ 진행':'⏸ 정지'; b.classList.toggle('paused',state.paused); }

function tick(){
  if(state.paused||state.over) return;
  state.day++; const dim=MDAYS[state.month-1];
  if(state.day>dim){ state.day=1; state.month++; if(state.month>12){ state.month=1; state.year++; } monthlyPulse(); }
  dailyBirthdays(); renderHeader(); renderChar(); if(state.popupQ.length) flushPopups();
}

/* ---------- 인물 성장 서사 알고리즘 ---------- */
function dailyBirthdays(){ for(const id in chars){ const c=chars[id]; if(c.dead) continue; if(c.bmonth===state.month&&c.bday===state.day){ onBirthday(c,age(c)); } } }
function onBirthday(c,a){
  if(a===3&&!c.childTrait){ c.childTrait=randKey(CHILD_TRAITS); if(isPlayerFamily(c)) log(`<b>${c.name}</b>에게서 기질이 보입니다.`,'fam'); }
  if(a===6&&!c.eduFocus){ if(isPlayerFamily(c)) askEducation(c); else { c.eduFocus=CHILD_TRAITS[c.childTrait||'curious'].foci[0]; } }
  if(a>=6&&a<16&&c.eduFocus){ if(eduRoll(c)) c.eduScore+=2; }
  if((a===9||a===11||a===13)&&c.traits.length<3){ if(isPlayerFamily(c)) askPersonality(c,a); else npcGainPersonality(c); }
  if(a===16&&c.edu===null){ comeOfAge(c); }
  if(a>=60){ if(Math.random()<=(a-58)*0.035) kill(c,'노환'); }
}
function isPlayerFamily(c){ const p=playerChar(); return c.father===p.id||c.mother===p.id||c.courtOf===p.region; }
function eduRoll(c){ let S=0,F=0; const g=guardianOf(c); if(c.childTrait && CHILD_TRAITS[c.childTrait].foci.includes(c.eduFocus)) S+=20; else S-=20; if(g){ S += 0.4*stat(g,c.eduFocus) + 0.2*stat(g,'learn'); } else F+=20; return Math.random() < (60+S)/(100+S+F); }
function guardianOf(c){ if(c.guardian&&chars[c.guardian]&&!chars[c.guardian].dead) return chars[c.guardian]; if(c.father&&chars[c.father]&&!chars[c.father].dead) return chars[c.father]; return null; }

function comeOfAge(c){
  const sc=c.eduScore; c.edu = sc>=18?3 : sc>=13?2 : sc>=8?1 : 0;
  if(!c.eduFocus) c.eduFocus='dip'; if(isPlayerFamily(c)){ while(c.traits.length<2) npcGainPersonality(c); if(c.traits.length<3) askPersonality(c,16); } else { while(c.traits.length<3) npcGainPersonality(c); }
  if(c.id===state.player) askLifestyle(c); else c.lifestyle=randKey(SKILLS);
}

function askEducation(c){
  const ct=CHILD_TRAITS[c.childTrait||'curious']; const courtAdults=Object.values(chars).filter(k=>!k.dead&&age(k)>=16&&(k.courtOf===playerChar().region||k.id===state.player));
  const opts=Object.entries(SKILLS).map(([k,n])=>({ t:`${n} 교육`, f:()=>{ c.eduFocus=k; pickGuardian(c,courtAdults); } }));
  popup({title:`${c.name}의 교육`, sub:'6세 방향 결정', body:`교육을 시작합니다. 기질: ${ct.n}`, opts});
}
function pickGuardian(c,adults){ const opts=adults.slice(0,5).map(g=>({ t:`${g.name}`, f:()=>{ c.guardian=g.id; chOp(c,g,15); log(`후견 부임 완료.`,'fam'); } })); popup({title:`후견인 지정`, opts}); }
function askPersonality(c,a){
  const g=guardianOf(c); const cand=new Set(); if(g) g.traits.forEach(t=>{ if(canHaveTrait(c,t)) cand.add(t); });
  while(cand.size<3){ const t=PERSONALITY_KEYS[Math.floor(Math.random()*PERSONALITY_KEYS.length)]; if(canHaveTrait(c,t)) cand.add(t); }
  const opts=[...cand].slice(0,3).map(t=>({ t:TRAITS[t].n, f:()=>{ c.traits.push(t); } })); popup({title:`성격 형성`, opts});
}
function npcGainPersonality(c){ const g=guardianOf(c); let t=null; if(g&&Math.random()<0.5){ const gs=g.traits.filter(x=>canHaveTrait(c,x)); if(gs.length) t=gs[Math.floor(Math.random()*gs.length)]; } if(!t){ let tries=0; do{ t=PERSONALITY_KEYS[Math.floor(Math.random()*PERSONALITY_KEYS.length)]; tries++; }while(!canHaveTrait(c,t)&&tries<20); } if(t&&canHaveTrait(c,t)) c.traits.push(t); }
function canHaveTrait(c,t){ return !c.traits.includes(t)&&!c.traits.includes(TRAITS[t].opp)&&c.traits.length<3; }
function askLifestyle(c){ const opts=Object.entries(SKILLS).map(([k,n])=>({ t:`${n}의 길`, f:()=>{ c.lifestyle=k; } })); popup({title:'인생관 지정', opts}); }

/* ---------- 월간 주기 재정 시스템 ---------- */
function directCountiesOf(charId){ return Object.keys(COUNTIES).filter(cid=>BARONIES[COUNTIES[cid].capital]?.owner===charId); }
function vassalsOf(liegeId){ return Object.values(chars).filter(c=>!c.dead&&c.liege===liegeId&&c.ruler); }
function domainLimit(c){ const d=duchiesOf(c.id).length; return (d>=1?6:4) + Math.floor(stat(c,'stew')*0.12); }

function monthlyPulse(){
  for(const id in chars){ const c=chars[id]; if(c.dead) continue; if(c.lifestyle){ c.lifeXP+=10; } if(c.pregnant>0){ c.pregnant++; if(c.pregnant>=10) giveBirth(c); } }
  buildingPulse(); fertilityPulse(); naturalDeathPulse(); councilPulse(); schemePulse(); warPulse(); aiPulse(); randomEventPulse(); goldPulse();
  if(document.getElementById('courtWrap').classList.contains('open')) renderCourt();
  if(document.getElementById('decWrap').classList.contains('open')) renderDec();
  renderMap();
}

function goldPulse(){
  for(const bid in BARONIES){ const b=BARONIES[bid]; b.troops=Math.min(b.cap, b.troops+4+buildingBonus(bid,'troops_regen')); }
  for(const id in chars){
    const c=chars[id]; if(c.dead||!c.ruler) continue; const owned=regionsOf(id); if(!owned.length) continue;
    const seat=owned.includes(c.region)?c.region:owned[0]; const seatB=BARONIES[seat]; if(!seatB) continue;
    const directIncome=owned.reduce((s,bid)=>{ return s+Math.round(4+stat(c,'stew')*0.5); },0);
    seatB.gold=Math.min(state.player===id?3500:2500, seatB.gold+directIncome);
  }
}

function fertilityPulse(){
  for(const id in chars){
    const c=chars[id]; if(c.dead||c.sex!=='f'||!c.spouse||c.pregnant>0) continue; const h=chars[c.spouse]; if(!h||h.dead) continue;
    if(Math.random()<0.03){ c.pregnant=1; }
  }
}
function naturalDeathChance(a){ if(a<40) return 0.001; if(a<60) return 0.006; return 0.04; }
function naturalDeathPulse(){
  for(const id in chars){
    const c=chars[id]; if(c.dead) continue; if(Math.random()>naturalDeathChance(age(c))) continue;
    if(c.id===state.player){ popup({title:'임종', body:'눈을 감습니다.', opts:[{t:'...', f:()=>kill(c,'노환')}]}); } else { kill(c,'노환'); }
  }
}
function giveBirth(c){
  c.pregnant=0; const h=chars[c.spouse]; const sex=Math.random()<0.5?'m':'f';
  const baby=mk({name:sex==='m'?'아들':'딸', dyn:h?h.dyn:c.dyn, sex, byear:state.year, bmonth:state.month, bday:15, base:randStats(), father:h?h.id:null, mother:c.id, courtOf:c.courtOf});
  if(h&&h.id===state.player) log('새 생명이 탄생했습니다.','good');
}

/* ---------- 상호작용 및 전쟁 펄스 ---------- */
function declareWar(atk,def,targetRid){
  let tRid = targetRid || def.region; if(COUNTIES[tRid]) tRid=COUNTIES[tRid].capital;
  state.wars.push({atk:atk.id, def:def.id, targetRid:tRid, score:0, months:0, allies:[]});
  log(`선전포고가 체결되었습니다.`,'war'); return true;
}

function warPulse(){
  state.wars=state.wars.filter(w=>{
    w.months++; const a=chars[w.atk], d=chars[w.def]; if(!a||!d||a.dead||d.dead) return false;
    const ratio=(power(a)-power(d))/Math.max(power(a),1); w.score+=ratio*8+(Math.random()*6-3);
    if(w.score>=100){ conquerTarget(a,d,w.targetRid); return false; }
    if(w.score<=-100){ return false; } return true;
  });
}
function conquerTarget(a, d, trid){ log(`정복 완수.`,'war'); renderMap(); }

function aiPulse(){
  npcCouncilPulse(); npcActivityPulse();
  for(const rid in REGIONS){
    const r=ownerOf(rid); if(!r||r.id===state.player) continue;
    if(r.claims.length && Math.random()<0.05){
      const cl=r.claims[0].rid; const def=ownerOf(cl); if(def) declareWar(r,def,cl);
    }
  }
  popPulse();
}
function popPulse(){}

/* ---------- 외교창 팝업 매핑 ---------- */
function openCounty(cid){ openRegion(COUNTIES[cid].capital, cid); }
function openRegion(rid, cid_hint){
  initAudio(); const p=playerChar(); const c=ownerOf(rid); if(!c) return;
  if(c.id===p.id){ showModal({title:'내 직할 소유지', opts:[{t:'닫기'}]}); return; }
  let html=`<div class="kv"><span>영주 이름</span><span>${c.name}</span></div>`;
  const opts=[{t:'선물 증정', f:()=>{ chOp(c,p,15); playSynthSFX('gold'); }}, {t:'선전포고', f:()=>{ declareWar(p,c,cid_hint); }} ,{t:'닫기'}];
  showModal({title:'외교 프로토콜', html, opts});
}

/* ---------- 자문회 UI 결단 렌더 백엔드 ---------- */
function renderCourt(){
  const p=playerChar(); let html=`<div style="font-size:.7rem;color:var(--gold-dim)">자문회 관리 보직</div>`;
  for(const role in COUNCIL_ROLES){
    const cid=state.council[role]; const councilor=cid&&chars[cid]?chars[cid]:null;
    html+=`<div class="p-row"><span>${COUNCIL_ROLES[role].n}</span><span>${councilor?councilor.name:'공석'}</span></div>`;
  }
  document.getElementById('courtContent').innerHTML=html;
}
function renderDec(){
  const p=playerChar(); _decActs=[]; const items=[];
  function addDec(t,f){ _decActs.push(f); items.push(t); }
  addDec('대연회 주최', ()=>{ addStress(p,-20,'연회'); playSynthSFX('gold'); renderDec(); });
  let html=``; items.forEach((t,i)=>{ html+=`<button class="p-action" onclick="_decActs[${i}]()">${t}</button>`; });
  document.getElementById('decContent').innerHTML=html;
}

/* ---------- 헤더 디스플레이 매핑 ---------- */
function renderHeader(){
  document.getElementById('dateTxt').textContent=`${state.year}년 ${state.month}월 ${state.day}일`;
  const reg=REGIONS[playerChar().region]; document.getElementById('goldTxt').textContent=reg?Math.round(reg.gold):0;
  document.getElementById('prestigeTxt').textContent=state.prestige;
  const totalTroops=playerRegions().reduce((s,rid)=>s+(REGIONS[rid].troops||0),0); document.getElementById('troopTxt').textContent=totalTroops.toLocaleString();
}
function renderChar(){
  const c=playerChar(); document.getElementById('cNm').textContent=c.name;
  const pct=Math.min(100,c.stress/1.5); document.getElementById('stressFill').style.width=pct+'%'; document.getElementById('stressNum').textContent=`${c.stress} / 150`;
}
function renderMap(){
  const svg=document.getElementById('map'); const p=playerChar(); let h='';
  for(const cid in COUNTY_ADJ){
    COUNTY_ADJ[cid].forEach(nb=>{ const A=COUNTIES[cid],B=COUNTIES[nb]; h+=`<line class="edge" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>`; });
  }
  for(const cid in COUNTIES){
    const C=COUNTIES[cid]; const holder=countyHolder(cid); const mine=holder&&holder.id===p.id; const col=mine?'#3d6b4a':'#555';
    h+=`<g class="node" onclick="openCounty('${cid}')"><circle cx="${C.x}" cy="${C.y}" r="18" fill="${col}" stroke="#c8a24a"/><text x="${C.x}" y="${C.y+3}" style="font-size:9px">${C.n}</text></g>`;
  }
  svg.innerHTML=h;
}
function renderAll(){ renderHeader(); renderChar(); renderMap(); }

function openDecisions(){ togglePanel('dec'); }
function openCourt(){ togglePanel('court'); }
function hasClaim(rid){ return state.claims.find(c=>c.rid===rid); }
function claimsForRegion(def){ const defCids = countiesOf(def.id); return state.claims.filter(c=>defCids.includes(c.rid)); }
function claimName(rid){ return COUNTIES[rid]?.n||BARONIES[rid]?.n||rid; }
function addClaim(rid, type){ if(hasClaim(rid)) return; state.claims.push({rid, type, obtained:state.year}); }
function removeClaim(rid){ state.claims = state.claims.filter(c=>c.rid!==rid); }
function grantRevengeClaim(rid){ if(!hasClaim(rid)) addClaim(rid, 'revenge'); }
function claimExpirePulse(){}
function openDeclareWar(defId){}
function tryMarriage(c){}
function doMarriage(a,b){}

const EVENTS=[];
function randomEventPulse(){ if(Math.random()<0.08){ popup({title:'궁정 소문', body:'영지에 정적의 기운이 맴돕니다.', opts:[{t:'수용'}]}); } }

function intro(){ popup({title:'에이레, 1066년', sub:'연대기 가동', body:'먼스터의 소왕으로서 아일랜드 왕관을 거머쥐십시오.', opts:[{t:'시작', f:()=>{ initAudio(); askLifestyle(playerChar()); }}]}); }

/* ---------- 부트스트랩 기동 초기화 ---------- */
setSpeed(1);
renderAll();
intro();
