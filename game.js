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

/* ---------- 난수 및 기질 추출 유틸리티 유닛 (에러방지를 위해 최상단 이동) ---------- */
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

/* ---------- 지역 3계층 배치 및 건설 지도 구조 ---------- */
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
  b_enniscorthy:{n:'에니스코시',county:'c_leinster',troops:200, gold:50, pop:55, cap:200, owner:null}, /* 타이포 가문자열 보정완료 */
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
  if(seat.gold<bp.cost){ log(`금이 부족합니다. (필요: ${bp.cost})`s,'dip'); return false; }
  seat.gold-=bp.cost;
  b.buildings.push({type:btype, progress:0, done:false});
  playSynthSFX('gold');
  log(`${b.n}에 ${bp.n} 건설을 시작했습니다. (${bp.time || bp.buildMonths}개월 소요)`,'good');
  return true;
}

function buildingPulse(){
  for(const bid in BARONIES){
    const b=BARONIES[bid]; if(!b.buildings?.length) continue;
    for(const slot of b.buildings){
      if(slot.done) continue;
      slot.progress++;
      const bp=BUILDINGS[slot.type] || BUILDING_TYPES[slot.type]; if(!bp) continue;
      const targetTime = bp.time || bp.buildMonths;
      if(slot.progress>=targetTime){
        slot.done=true;
        if(bp.effect?.troops_cap) b.cap=(b.cap||b.troops)+bp.effect.troops_cap;
        if(bp.onComplete) bp.onComplete(b);
        if(bid===playerChar().region||b.owner===state.player){ log(`${b.n}의 <b>${bp.n}</b>이(가) 완공됐습니다!`,'good'); }
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

const COUNTY_ADJ = {
  c_thomond: ['c_ennis','c_ormond','c_ossory','c_connacht','c_athlone'],
  c_ennis:   ['c_thomond','c_desmond','c_connacht'],
  c_ormond:  ['c_thomond','c_ossory','c_leinster','c_athlone'],
  c_desmond: ['c_ennis','c_thomond'],
  c_leinster:['c_ossory','c_ormond','c_meath','c_dublin'],
  c_ossory:  ['c_thomond','c_ormond','c_leinster'],
  c_dublin:  ['c_leinster','c_meath'],
  c_meath:   ['c_dublin','c_leinster','c_athlone','c_oriel'],
  c_athlone: ['c_thomond','c_connacht','c_breifne','c_meath','c_ormond'],
  c_connacht:['c_mayo','c_athlone','c_ennis','c_thomond'],
  c_mayo:    ['c_connacht','c_ailech','c_breifne'],
  c_breifne: ['c_mayo','c_athlone','c_meath','c_oriel'],
  c_ulster:  ['c_oriel','c_ailech'],
  c_oriel:   ['c_ulster','c_ailech','c_meath','c_breifne'],
  c_ailech:  ['c_ulster','c_mayo','c_oriel'],
};

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

/* ---------- 역사 속의 인물 인프라 세팅 ---------- */
const state = {
  year:1066, month:9, day:15,
  paused:true, speed:1, timer:null,
  player:null,
  schemes:[], wars:[], truces:{}, npcAlliances:[], alliances:[],
  prestige:120,
  successionLaw:'partition',
  council:{ chancellor:null, marshal:null, steward:null, spymaster:null, chaplain:null },
  claims:[], popupQ:[], modalOpen:false, over:false, victory:false
};

const murchad = mk({name:'무르하드 막 돈하드', dyn:'우어 브리언', byear:1027, bmonth:3, bday:10,
  traits:['temperate','gregarious','impatient'],
  base:{dip:6,mar:8,stew:6,intr:8,learn:6,prow:8},
  edu:2, eduFocus:'mar', region:'b_limerick', ruler:true});
state.player = murchad.id;

const wife = mk({name:'두브 에사', dyn:'우어 켈러허', sex:'f', byear:1033, bmonth:6, bday:2,
  traits:['kind','patient','chaste'], base:{dip:7,mar:2,stew:6,intr:4,learn:5,prow:1},
  edu:1, eduFocus:'dip', spouse:murchad.id, courtOf:'b_limerick'});
murchad.spouse = wife.id;

const sonBrian = mk({name:'브리언', dyn:'우어 브리언', byear:1053, bmonth:4, bday:20,
  traits:[], childTrait:'rowdy', eduFocus:'mar', eduScore:7,
  base:{dip:3,mar:5,stew:3,intr:3,learn:2,prow:5}, father:murchad.id, mother:wife.id, courtOf:'b_limerick'});
const dauMor = mk({name:'모르', dyn:'우어 브리언', sex:'f', byear:1056, bmonth:9, bday:1,
  traits:[], childTrait:'curious', eduFocus:'dip', eduScore:5,
  base:{dip:4,mar:1,stew:3,intr:3,learn:4,prow:1}, father:murchad.id, mother:wife.id, courtOf:'b_limerick'});
const bishop = mk({name:'주교 켈라흐', dyn:'', byear:1018, bmonth:2, bday:14,
  traits:['diligent','calm','chaste'], base:{dip:6,mar:1,stew:5,intr:3,learn:11,prow:1}, edu:3, eduFocus:'learn', courtOf:'b_limerick'});
const marshal = mk({name:'돔날 우어 도너번', dyn:'', byear:1031, bmonth:11, bday:7,
  traits:['brave','honest','wrathful'], base:{dip:3,mar:10,stew:4,intr:4,learn:3,prow:11}, edu:2, eduFocus:'mar', courtOf:'b_limerick'});

const kLein = mk({name:'디어르마트 막 말 너 모', dyn:'우어 헨셀러그', byear:1010, bmonth:5, bday:3,
  traits:['ambitious','brave','deceitful'], base:{dip:8,mar:9,stew:6,intr:7,learn:4,prow:7}, edu:3, eduFocus:'mar', region:'b_wexford', ruler:true});
const kDub = mk({name:'무르하드 막 디어르마터', dyn:'우어 헨셀러그', byear:1032, bmonth:8, bday:9,
  traits:['brave','greedy','impatient'], base:{dip:5,mar:7,stew:7,intr:5,learn:3,prow:8}, edu:2, eduFocus:'stew', region:'b_dublin', ruler:true, father:kLein.id, courtOf:'b_wexford'});
const kConn = mk({name:'아드 우어 콘호버르', dyn:'우어 콘호버르', byear:1021, bmonth:1, bday:25,
  traits:['brave','wrathful','ambitious'], base:{dip:4,mar:10,stew:5,intr:5,learn:3,prow:10}, edu:3, eduFocus:'mar', region:'b_galway', ruler:true});
const kMeath = mk({name:'콘호바르 우어 말 셰클런', dyn:'클란 콜만', byear:1015, bmonth:7, bday:18,
  traits:['content','just','patient'], base:{dip:6,mar:5,stew:7,intr:4,learn:6,prow:4}, edu:2, eduFocus:'stew', region:'b_trim', ruler:true});
const kBrei = mk({name:'아드 우어 루어르크', dyn:'우어 루어르크', byear:1034, bmonth:3, bday:30,
  traits:['ambitious','cruel','impatient'], base:{dip:3,mar:8,stew:4,intr:7,learn:2,prow:8}, edu:2, eduFocus:'intr', region:'b_dromahair', ruler:true});
const kUls = mk({name:'돈하드 우어 어하다', dyn:'우어 어하다', byear:1024, bmonth:10, bday:11,
  traits:['calm','greedy','shy'], base:{dip:5,mar:6,stew:8,intr:5,learn:5,prow:5}, edu:3, eduFocus:'stew', region:'b_downpatrick', ruler:true});

chOp(kLein,murchad,-25); chOp(murchad,kLein,-25);
chOp(kConn,murchad,-15); chOp(murchad,kConn,-15);
chOp(kMeath,murchad,10); chOp(murchad,kMeath,10);

seizeDuchy(murchad.id, 'd_munster');
seizeDuchy(kLein.id,   'd_leinster');
seizeDuchy(kDub.id,    'd_dublin');
seizeDuchy(kMeath.id,  'd_meath');
seizeDuchy(kConn.id,   'd_connacht');
seizeDuchy(kBrei.id,   'd_breifne');
seizeDuchy(kUls.id,    'd_ulster');

[kLein,kConn,kMeath,kBrei,kUls].forEach(king=>{
  const names=['피르가스','로르칸','케르발','플란','에오한','니얼'];
  const skills=[
    {dip:8,mar:4,stew:5,intr:4,learn:5,prow:3},
    {dip:4,mar:9,stew:4,intr:4,learn:3,prow:9},
    {dip:5,mar:4,stew:8,intr:4,learn:5,prow:3},
    {dip:4,mar:4,stew:4,intr:9,learn:4,prow:5},
    {dip:4,mar:4,stew:5,intr:4,learn:9,prow:2},
  ];
  skills.forEach((sk,i)=>{
    mk({name:names[i]||('보좌관'+i), dyn:king.dyn, byear:1025+i*4, bmonth:i+1, bday:10, traits:randTraits(2), base:sk, edu:2, eduFocus:['dip','mar','stew','intr','learn'][i], courtOf:king.region});
  });
});

function mk(o){
  const c = Object.assign({
    id:'c'+(++CID), name:'?', dyn:'', sex:'m', byear:1030, bmonth:1, bday:1, traits:[], childTrait:null, edu:null, eduFocus:null, eduScore:0, lifestyle:null, lifeXP:0, base:{dip:5,mar:5,stew:5,intr:5,learn:5,prow:5}, stress:0, copings:0, lastBreakY:0, region:null, ruler:false, spouse:null, mother:null, father:null, pregnant:0, births:0, dead:false, courtOf:null, liege:null, op:{}, council:{chancellor:null,marshal:null,steward:null,spymaster:null,chaplain:null}, claims:[], lastActivity:0
  }, o);
  chars[c.id] = c;
  return c;
}

function age(c){ const m = state.month, y = state.year; let a = y - c.byear; if (m < c.bmonth || (m===c.bmonth && state.day < c.bday)) a--; return a; }
function stat(c,k){
  let v = c.base[k]||0; for(const t of c.traits){ const m=TRAITS[t]&&TRAITS[t].mod; if(m&&m[k]) v+=m[k]; }
  if(c.edu && c.eduFocus===k) v += EDU_BONUS[c.edu]; return Math.max(0,v);
}
function fert(c){
  let f = 0.5; for(const t of c.traits){ if(TRAITS[t]&&TRAITS[t].fert) f+=TRAITS[t].fert; } f -= 0.05*c.births; const a = age(c); let mul;
  if(c.sex==='f'){ mul = a<=25?1 : a<=30?0.9 : a<=35?0.7 : a<=40?0.5 : a<=45?0.33 : 0; } else { mul = a<=35?1 : a<=40?0.9 : a<=50?0.8 : a<=60?0.7 : a<=70?0.6 : 0.5; } return Math.max(0, f*mul);
}
function aiW(c,k){ let v=0; for(const t of c.traits){const a=TRAITS[t]&&TRAITS[t].ai; if(a&&a[k]) v+=a[k];} return v; }
function opinion(a,b){
  let v = a.op[b.id]||0; for(const t of a.traits){ if(b.traits.includes(t)) v += 10; if(TRAITS[t] && b.traits.includes(TRAITS[t].opp)) v -= 10; }
  if(a.spouse===b.id) v += 30; if(a.father===b.id||a.mother===b.id||b.father===a.id||b.mother===a.id) v += 25; if(b.id===state.player) v += Math.round((state.prestige-120)/15); return Math.max(-100, Math.min(100, v));
}
function chOp(a,b,d){ a.op[b.id]=(a.op[b.id]||0)+d; }

function seizeBaronies(charId,bids){ bids.forEach(bid=>{ if(BARONIES[bid]) BARONIES[bid].owner=charId; }); }
function seizeCounty(charId,cid){ if(COUNTIES[cid]) seizeBaronies(charId,COUNTIES[cid].baronies); }
function seizeDuchy(charId,did){ if(DUCHIES[did]) DUCHIES[did].counties.forEach(cid=>seizeCounty(charId,cid)); }
function rulerOf(bid){ const c=chars[BARONIES[bid]?.owner]; return (c&&!c.dead)?c:null; }
function regionsOf(charId){ const out=[]; for(const bid in BARONIES) if(BARONIES[bid].owner===charId) out.push(bid); return out; }
function countyOf(bid){ return BARONIES[bid]?.county||null; }
function countyHolder(cid){ const cap=COUNTIES[cid]?.capital; return cap?rulerOf(cap):null; }
function countiesOf(charId){ const cs=new Set(); for(const bid of regionsOf(charId)) cs.add(countyOf(bid)); return [...cs].filter(Boolean); }
function duchiesOf(charId){ const ds=new Set(); for(const bid of regionsOf(charId)) ds.add(duchyOf(bid)); return [...ds].filter(Boolean); }
function playerChar(){ return chars[state.player]; }

const MDAYS=[31,28,31,30,31,30,31,31,30,31,30,31];
const SEASONS=['겨울','겨울','봄','봄','봄','여름','여름','여름','가을','가을','가을','겨울'];

function log(msg, cls){
  const p=document.createElement('p'); if(cls)p.className=cls;
  p.innerHTML=`<span class="d">${state.year}년 ${state.month}월 ${state.day}일</span>${msg}`;
  const el=document.getElementById('log'); el.appendChild(p); el.scrollTop=el.scrollHeight;
  while(el.children.length>140) el.removeChild(el.firstChild);
}

function popup(p){ state.popupQ.push(p); flushPopups(); }
function flushPopups(){
  if(state.modalOpen || !state.popupQ.length) return;
  if(!state.paused) state.autoResume=true; pause();
  const p = state.popupQ.shift(); showModal(p);
}
function showModal(p){
  state.modalOpen=true; playSynthSFX('event');
  const box=document.getElementById('modalBox');
  let h=`<h2>${p.title}</h2><div class="sub">${p.sub||'이벤트'}</div><div class="body">${p.body||''}</div>`;
  if(p.html) h+=p.html; h+=`<div class="opts">`;
  (p.opts||[{t:'확인'}]).forEach((o,i)=>{ h+=`<button onclick="modalPick(${i})">${o.t}${o.d?`<small>${o.d}</small>`:''}</button>`; });
  h+=`</div>`; box.innerHTML=h; box._opts=p.opts||[{}]; document.getElementById('shade').classList.add('show');
}
function modalPick(i){
  const box=document.getElementById('modalBox'); const o=box._opts[i]; closeModal(); if(o&&o.f) o.f(); flushPopups();
  if(!state.modalOpen && !state.popupQ.length && state.autoResume){ state.autoResume=false; resume(); } renderAll();
}
function closeModal(){ state.modalOpen=false; document.getElementById('shade').classList.remove('show'); }

function addStress(c,amt,why){
  if(c.dead) return; let g=amt; for(const t of c.traits){ if(TRAITS[t]&&TRAITS[t].stressGainMul&&amt>0) g*=TRAITS[t].stressGainMul; }
  const before=stressLvl(c); c.stress=Math.max(0,Math.min(150,c.stress+Math.round(g))); const after=stressLvl(c);
  if(c.id===state.player&&amt!==0&&why) log(`스트레스 ${amt>0?'+':''}${Math.round(g)} — ${why}`);
  if(after>before&&after<3) mentalBreak(c,after); if(c.stress>=150) stressDeath(c);
}
function stressLvl(c){ return c.stress>=150?3 : c.stress>=100?2 : c.stress>=50?1 : 0; }
function mentalBreak(c,lvl){
  if(state.year - c.lastBreakY < 5) return; c.lastBreakY=state.year; if(c.id!==state.player){ c.stress=Math.max(0,c.stress-60); return; }
  popup({title:'정신적 한계', sub:`스트레스 ${lvl}단계 — 정신 붕괴`, body:`마음을 추스를 대처법이 요구됩니다.`, opts:[
    {t:'대처법을 찾는다', d:'스트레스 -80', f:()=>{c.stress=Math.max(0,c.stress-80); log('마음을 다스립니다.','fam');}},
    {t:'이를 악물고 버틴다', d:'스트레스 +30', f:()=>{addStress(c,30,'억눌린 고통');}}
  ]});
}
function stressDeath(c){ if(c.dead) return; if(c.id===state.player){ popup({title:'무너진 왕', opts:[{t:'...', f:()=>kill(c,'스트레스')}]}); } else kill(c,'스트레스'); }

function kill(c, cause){
  if(c.dead) return; c.dead=true; playSynthSFX('death');
  if(c.spouse&&chars[c.spouse]){ chars[c.spouse].spouse=null; addStress(chars[c.spouse],40,'배우자의 죽음'); }
  if(c.ruler) succession(c);
  if(c.id===state.player){
    const dist=distributeSuccession(c);
    if(dist){
      const mainHid=Object.keys(dist)[0]; const mainH=chars[mainHid];
      for(const [hid,cids] of Object.entries(dist)){ const h=chars[hid]; if(!h) continue; h.ruler=true; cids.forEach(cid=>seizeCounty(hid,cid)); }
      state.player=mainHid; log(`<b>${mainH.name}</b>이(가) 계승했습니다.`,'fam');
      popup({title:'왕은 죽었다', sub:'계승', body:`${c.name}의 후계자 시대 돌입.`, opts:[{t:'국고 인수'}]});
    } else { gameOver(`후계자가 없습니다.`); }
  }
}

function validHeirs(c){ const kids=Object.values(chars).filter(k=>!k.dead&&(k.father===c.id||k.mother===c.id)&&age(k)>=16); kids.sort((a,b)=>a.byear-b.byear); return kids; }
function distributeSuccession(c){
  const ownedCids=directCountiesOf(c.id); const heirs=validHeirs(c); if(!heirs.length) return null;
  const law=c.id===state.player?state.successionLaw:'primogeniture'; const mainHeir=heirs[0];
  if(law==='primogeniture'||heirs.length===1||ownedCids.length<=1){ return {[mainHeir.id]:ownedCids}; }
  if(law==='partition'){
    const dist={[mainHeir.id]:[ownedCids[0]]};
    ownedCids.slice(1).forEach((cid,i)=>{ const h=heirs[(i+1)%heirs.length]; if(!dist[h.id]) dist[h.id]=[]; dist[h.id].push(cid); }); return dist;
  }
  return {[mainHeir.id]:ownedCids};
}
function succession(c){
  if(c.id===state.player) return; const owned=regionsOf(c.id); if(!owned.length) return;
  const dist=distributeSuccession(c);
  if(dist){
    for(const [hid,cids] of Object.entries(dist)){  const h=chars[hid]; if(!h) continue; h.ruler=true; cids.forEach(cid=>seizeCounty(hid,cid)); }
  }
}
function gameOver(msg){ state.over=true; pause(); popup({title:'가문의 종언', opts:[{t:'재시작', f:()=>location.reload()}]}); }

const WORLD_EVENTS = [
  { id:'norman_shadow', triggerYear:1066, maxYear:1075, chance:0.6, fired:false, run:(p)=>popup({title:'노르만의 그림자', opts:[{t:'경계 강화', f:()=>{BARONIES[p.region].troops+=100;}}]}) }
];
function worldEventPulse(){
  if(state.month !== 1) return; const p=playerChar(); if(!p||p.dead) return;
  for(const ev of WORLD_EVENTS){ if(!ev.fired && state.year>=ev.triggerYear && Math.random()<ev.chance){ ev.fired=true; ev.run(p); break; } }
}

function togglePanel(id){
  initAudio(); const info=PANELS[id]; if(!info) return; const el=document.getElementById(info.wrap); const opening=!el.classList.contains('open');
  Object.keys(PANELS).forEach(k=>{ if(k!==id) document.getElementById(PANELS[k].wrap).classList.remove('open'); });
  if(opening){ playSynthSFX('event'); if(info.render) window[info.render](); el.classList.add('open'); if(id!=='log') pause(); _hideOtherTabs(id); }
  else { el.classList.remove('open'); if(id!=='log') resume(); _showAllTabs(); }
}
function closePanel(id){ const info=PANELS[id]; if(!info) return; document.getElementById(info.wrap).classList.remove('open'); if(id!=='log') resume(); _showAllTabs(); }
function pause(){ state.paused=true; clearInterval(state.timer); state.timer=null; updPauseBtn(); }
function resume(){ if(state.over||state.modalOpen) return; state.paused=false; const iv = state.speed===1?550 : state.speed===2?260 : 110; clearInterval(state.timer); state.timer=setInterval(tick,iv); updPauseBtn(); }
function setSpeed(s){ state.speed=s; document.querySelectorAll('.spd').forEach(b=>b.classList.toggle('on',+b.dataset.s===s)); if(!state.paused) resume(); }
function updPauseBtn(){ const b=document.getElementById('pauseBtn'); b.textContent=state.paused?'▶ 진행':'⏸ 정지'; b.classList.toggle('paused',state.paused); }

/* ---------- 사이클 구동 코어 라인 ---------- */
function tick(){
  if(state.paused||state.over) return; state.day++; const dim=MDAYS[state.month-1];
  if(state.day>dim){ state.day=1; state.month++; if(state.month>12){ state.month=1; state.year++; } monthlyPulse(); }
  dailyBirthdays(); renderHeader(); renderChar(); if(state.popupQ.length) flushPopups();
}

function dailyBirthdays(){ for(const id in chars){ const c=chars[id]; if(!c.dead && c.bmonth===state.month && c.bday===state.day) onBirthday(c,age(c)); } }
function onBirthday(c,a){
  if(a===3&&!c.childTrait) c.childTrait=randKey(CHILD_TRAITS);
  if(a===6&&!c.eduFocus) { if(isPlayerFamily(c)) askEducation(c); else c.eduFocus=CHILD_TRAITS[c.childTrait||'curious'].foci[0]; }
  if(a>=6&&a<16&&c.eduFocus) { if(eduRoll(c)) c.eduScore+=2; }
  if(a===16&&c.edu===null) comeOfAge(c);
  if(a>=60 && Math.random()<(a-58)*0.035) kill(c,'노환');
}
function isPlayerFamily(c){ const p=playerChar(); return c.father===p.id||c.mother===p.id||c.courtOf===p.region; }
function eduRoll(c){ return Math.random()<0.6; }
function guardianOf(c){ return c.father?chars[c.father]:null; }
function comeOfAge(c){ const sc=c.eduScore; c.edu = sc>=18?3 : sc>=13?2 : sc>=8?1 : 0; if(!c.eduFocus) c.eduFocus='dip'; if(c.id===state.player) askLifestyle(c); else c.lifestyle=randKey(SKILLS); }

function askEducation(c){ c.eduFocus='mar'; }
function pickGuardian(c,adults){}
function askPersonality(c,a){}
function npcGainPersonality(c){}
function canHaveTrait(c,t){ return true; }
function askLifestyle(c){ c.lifestyle='mar'; }

function monthlyPulse(){
  for(const id in chars){ const c=chars[id]; if(!c.dead && c.lifestyle) c.lifeXP+=10; }
  buildingPulse(); fertilityPulse(); naturalDeathPulse(); councilPulse(); schemePulse(); warPulse(); aiPulse(); goldPulse();
  if(state.month===1){ worldEventPulse(); } renderMap();
}

function goldPulse(){
  for(const bid in BARONIES){ const b=BARONIES[bid]; b.troops=Math.min(b.cap, b.troops+4+buildingBonus(bid,'troops_regen')); }
  for(const id in chars){
    const c=chars[id]; if(c.dead||!c.ruler) continue; const owned=regionsOf(id); if(!owned.length) continue;
    const seat=owned[0]; const seatB=BARONIES[seat]; if(seatB) seatB.gold=Math.min(state.player===id?3500:2500, seatB.gold+25);
  }
}
function fertilityPulse(){}
function naturalDeathPulse(){}
function giveBirth(c){}

function declareWar(atk,def,targetRid){ state.wars.push({atk:atk.id, def:def.id, targetRid:targetRid, score:0, months:0, allies:[]}); return true; }
function warPulse(){
  state.wars=state.wars.filter(w=>{
    w.months++; const a=chars[w.atk], d=chars[w.def]; if(!a||!d||a.dead||d.dead) return false;
    w.score+=5; if(w.score>=100){ seizeCounty(a.id,w.targetRid); return false; } return true;
  });
}
function aiPulse(){}

function openCounty(cid){ openRegion(COUNTIES[cid].capital, cid); }
function openRegion(rid, cid_hint){
  initAudio(); const p=playerChar(); const c=ownerOf(rid); if(!c) return;
  if(c.id===p.id){ showModal({title:'내 영지 관할구역', opts:[{t:'닫기'}]}); return; }
  let html=`<div class="kv"><span>영주명</span><span>${c.name}</span></div>`;
  const opts=[{t:'선물', f:()=>{ playSynthSFX('gold'); }}, {t:'개전', f:()=>{ declareWar(p,c,cid_hint); }}, {t:'닫기'}];
  showModal({title:'외교 창', html, opts});
}

function renderCourt(){
  const p=playerChar(); let html=`<div style="font-size:.7rem;color:var(--gold-dim)">자문회 직무 현황</div>`;
  document.getElementById('courtContent').innerHTML=html;
}
function renderDec(){
  const p=playerChar(); _decActs=[]; const items=[];
  function addDec(t,f){ _decActs.push(f); items.push(t); }
  addDec('대연회 개최', ()=>{ addStress(p,-20,'연회'); playSynthSFX('gold'); renderDec(); });
  let html=``; items.forEach((t,i)=>{ html+=`<button class="p-action" onclick="_decActs[${i}]()">${t}</button>`; });
  document.getElementById('decContent').innerHTML=html;
}

function renderHeader(){
  document.getElementById('dateTxt').textContent=`${state.year}년 ${state.month}월 ${state.day}일`;
  const reg=BARONIES[playerChar().region]; document.getElementById('goldTxt').textContent=reg?Math.round(reg.gold):0;
  document.getElementById('prestigeTxt').textContent=state.prestige;
  const totalTroops=regionsOf(state.player).reduce((s,rid)=>s+(BARONIES[rid].troops||0),0); document.getElementById('troopTxt').textContent=totalTroops.toLocaleString();
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
function claimsForRegion(def){ return []; }
function truceBetween(a,b){ return false; }
function isAllied(a,b){ return false; }
function setTruce(a,b,y){}
function breakAlliance(a,b){}
function formAlliance(a,b){}

function intro(){ popup({title:'에이레, 1066년', sub:'유산 복원', body:'먼스터의 소왕으로 아일랜드 왕관을 거머쥐십시오.', opts:[{t:'시작', f:()=>{ initAudio(); computeBootstrap(); }}]}); }
function computeBootstrap(){ renderAll(); }

/* ---------- 최초 부팅 로드 라인 ---------- */
setSpeed(1);
intro();
