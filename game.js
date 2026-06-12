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
    case 'event': // 모달창 및 UI 패널 오픈 양피지 소리
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

    case 'gold': // 금화 지출 및 징수 짤랑임
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

    case 'war': // 선전포고 웅장한 전쟁 나팔
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

    case 'death': // 중요 군주 사망 장송 종소리
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

/* ---------- 성격 특성 ---------- */
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

/* ---------- 어린시절 특성 ---------- */
const CHILD_TRAITS = {
  curious:   {n:'호기심',     foci:['dip','learn']},
  energetic: {n:'활기참',     foci:['mar','stew']},
  willful:   {n:'고집스러움', foci:['intr','mar']},
  devout:    {n:'경건함',     foci:['learn','dip']},
  precocious:{n:'조숙함',     foci:['stew','learn']},
  rowdy:     {n:'거칠음',     foci:['mar','intr']},
};

/* ---------- 교육 특성 ---------- */
const SKILLS = {dip:'외교', mar:'무예', stew:'내정', intr:'음모', learn:'학문'};
const EDU_NAMES = {
  dip:['서툰 협상가','수습 외교관','노련한 협상가','카리스마적 협상가'],
  mar:['그릇된 전사','강인한 병사','숙련된 전술가','명석한 전략가'],
  stew:['방탕한 낭비가','검약한 관리','재정 설계자','미다스의 손'],
  intr:['아둔한 음모가','의심 많은 모사꾼','계략의 직조자','은밀한 그림자'],
  learn:['미숙한 학생','순진한 호사가','박식한 사색가','명민한 지성인'],
};
const EDU_BONUS = [1,2,3,5];

/* ---------- 3계층 영지 데이터 및 건물 구성 (Phase 4) ---------- */
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
  b_enniscorthy:{n:'에니스코시',county:'c_leinster',troops:200, gold:50, pop:55, cap:200, owner:null},
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

/* 남작령 초기화 루틴 */
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

/* ---------- 캐릭터 구성 소스 ---------- */
let CID = 0;
const chars = {};
function mk(o){
  const c = Object.assign({
    id:'c'+(++CID), name:'?', dyn:'', sex:'m', byear:1030, bmonth:1, bday:1,
    traits:[], childTrait:null, edu:null, eduFocus:null, eduScore:0,
    lifestyle:null, lifeXP:0,
    base:{dip:5,mar:5,stew:5,intr:5,learn:5,prow:5},
    stress:0, copings:0, lastBreakY:0,
    region:null, ruler:false, spouse:null, mother:null, father:null,
    pregnant:0, births:0, dead:false, courtOf:null,
    liege:null, op:{}, 
    council:{chancellor:null,marshal:null,steward:null,spymaster:null,chaplain:null},
    claims:[], lastActivity:0, 
  }, o);
  chars[c.id] = c;
  return c;
}

function age(c){ const m = state.month, y = state.year;
  let a = y - c.byear; if (m < c.bmonth || (m===c.bmonth && state.day < c.bday)) a--; return a; }
function stat(c,k){
  let v = c.base[k]||0;
  for(const t of c.traits){ const m=TRAITS[t]&&TRAITS[t].mod; if(m&&m[k]) v+=m[k]; }
  if(c.edu && c.eduFocus===k) v += EDU_BONUS[c.edu];
  return Math.max(0,v);
}
function fert(c){
  let f = 0.5;
  for(const t of c.traits){ if(TRAITS[t]&&TRAITS[t].fert) f+=TRAITS[t].fert; }
  f -= 0.05*c.births;
  const a = age(c);
  let mul;
  if(c.sex==='f'){ mul = a<=25?1 : a<=30?0.9 : a<=35?0.7 : a<=40?0.5 : a<=45?0.33 : 0; }
  else { mul = a<=35?1 : a<=40?0.9 : a<=50?0.8 : a<=60?0.7 : a<=70?0.6 : 0.5; }
  return Math.max(0, f*mul);
}
function aiW(c,k){ let v=0; for(const t of c.traits){const a=TRAITS[t]&&TRAITS[t].ai; if(a&&a[k]) v+=a[k];} return v; }
function opinion(a,b){
  let v = a.op[b.id]||0;
  for(const t of a.traits){
    if(b.traits.includes(t)) v += 10;
    if(TRAITS[t] && b.traits.includes(TRAITS[t].opp)) v -= 10;
  }
  if(a.spouse===b.id) v += 30;
  if(a.father===b.id||a.mother===b.id||b.father===a.id||b.mother===a.id) v += 25;
  if(b.id===state.player) v += Math.round((state.prestige-120)/15);
  return Math.max(-100, Math.min(100, v));
}
function chOp(a,b,d){ a.op[b.id]=(a.op[b.id]||0)+d; }

/* ---------- 역사적 배치 군주 군세 ---------- */
const murchad = mk({name:'무르하드 막 돈하드', dyn:'우어 브리언', byear:1027, bmonth:3, bday:10,
  traits:['temperate','gregarious','impatient'],
  base:{dip:6,mar:8,stew:6,intr:8,learn:6,prow:8},
  edu:2, eduFocus:'mar', region:'b_limerick', ruler:true});
const wife = mk({name:'두브 에사', dyn:'우어 켈러허', sex:'f', byear:1033, bmonth:6, bday:2,
  traits:['kind','patient','chaste'], base:{dip:7,mar:2,stew:6,intr:4,learn:5,prow:1},
  edu:1, eduFocus:'dip', spouse:murchad.id, courtOf:'b_limerick'});
murchad.spouse = wife.id;
const sonBrian = mk({name:'브리언', dyn:'우어 브리언', byear:1053, bmonth:4, bday:20,
  traits:[], childTrait:'rowdy', eduFocus:'mar', eduScore:7,
  base:{dip:3,mar:5,stew:3,intr:3,learn:2,prow:5},
  father:murchad.id, mother:wife.id, courtOf:'b_limerick'});
const dauMor = mk({name:'모르', dyn:'우어 브리언', sex:'f', byear:1056, bmonth:9, bday:1,
  traits:[], childTrait:'curious', eduFocus:'dip', eduScore:5,
  base:{dip:4,mar:1,stew:3,intr:3,learn:4,prow:1},
  father:murchad.id, mother:wife.id, courtOf:'b_limerick'});
const bishop = mk({name:'주교 켈라흐', dyn:'', byear:1018, bmonth:2, bday:14,
  traits:['diligent','calm','chaste'], base:{dip:6,mar:1,stew:5,intr:3,learn:11,prow:1},
  edu:3, eduFocus:'learn', courtOf:'b_limerick'});
const marshal = mk({name:'돔날 우어 도너번', dyn:'', byear:1031, bmonth:11, bday:7,
  traits:['brave','honest','wrathful'], base:{dip:3,mar:10,stew:4,intr:4,learn:3,prow:11},
  edu:2, eduFocus:'mar', courtOf:'b_limerick'});

const kLein = mk({name:'디어르마트 막 말 너 모', dyn:'우어 헨셀러그', byear:1010, bmonth:5, bday:3,
  traits:['ambitious','brave','deceitful'], base:{dip:8,mar:9,stew:6,intr:7,learn:4,prow:7},
  edu:3, eduFocus:'mar', region:'b_wexford', ruler:true});
const kDub = mk({name:'무르하드 막 디어르마터', dyn:'우어 헨셀러그', byear:1032, bmonth:8, bday:9,
  traits:['brave','greedy','impatient'], base:{dip:5,mar:7,stew:7,intr:5,learn:3,prow:8},
  edu:2, eduFocus:'stew', region:'b_dublin', ruler:true, father:kLein.id, courtOf:'b_wexford'});
const kConn = mk({name:'아드 우어 콘호버르', dyn:'우어 콘호버르', byear:1021, bmonth:1, bday:25,
  traits:['brave','wrathful','ambitious'], base:{dip:4,mar:10,stew:5,intr:5,learn:3,prow:10},
  edu:3, eduFocus:'mar', region:'b_galway', ruler:true});
const kMeath = mk({name:'콘호바르 우어 말 셰클런', dyn:'클란 콜만', byear:1015, bmonth:7, bday:18,
  traits:['content','just','patient'], base:{dip:6,mar:5,stew:7,intr:4,learn:6,prow:4},
  edu:2, eduFocus:'stew', region:'b_trim', ruler:true});
const kBrei = mk({name:'아드 우어 루어르크', dyn:'우어 루어르크', byear:1034, bmonth:3, bday:30,
  traits:['ambitious','cruel','impatient'], base:{dip:3,mar:8,stew:4,intr:7,learn:2,prow:8},
  edu:2, eduFocus:'intr', region:'b_dromahair', ruler:true});
const kUls = mk({name:'돈하드 우어 어하다', dyn:'우어 어하다', byear:1024, bmonth:10, bday:11,
  traits:['calm','greedy','shy'], base:{dip:5,mar:6,stew:8,intr:5,learn:5,prow:5},
  edu:3, eduFocus:'stew', region:'b_downpatrick', ruler:true});

chOp(kLein,murchad,-25); chOp(murchad,kLein,-25);
chOp(kConn,murchad,-15); chOp(murchad,kConn,-15);
chOp(kDub,murchad,-10);
chOp(kMeath,murchad,10); chOp(murchad,kMeath,10);
chOp(kBrei,kConn,-30); chOp(kConn,kBrei,-30);
chOp(kDub,kLein,40); chOp(kLein,kDub,40);

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
    mk({name:names[i]||('보좌관'+i), dyn:king.dyn, byear:1025+i*4, bmonth:i+1, bday:10,
      traits:randTraits(2), base:sk, edu:2, eduFocus:['dip','mar','stew','intr','learn'][i],
      courtOf:king.region});
  });
});

/* ─── 3계층 핵심 헬퍼 ─── */
function seizeBaronies(charId,bids){ bids.forEach(bid=>{ if(BARONIES[bid]) BARONIES[bid].owner=charId; }); }
function seizeCounty(charId,cid){ if(COUNTIES[cid]) seizeBaronies(charId,COUNTIES[cid].baronies); }
function seizeDuchy(charId,did){ if(DUCHIES[did]) DUCHIES[did].counties.forEach(cid=>seizeCounty(charId,cid)); }
function rulerOf(bid){ const c=chars[BARONIES[bid]?.owner]; return (c&&!c.dead)?c:null; }
function regionsOf(charId){ const out=[]; for(const bid in BARONIES) if(BARONIES[bid].owner===charId) out.push(bid); return out; }
function countyOf(bid){ return BARONIES[bid]?.county||null; }
function duchyOf(bid){ return COUNTIES[BARONIES[bid]?.county]?.duchy||null; }
function countyHolder(cid){ const cap=COUNTIES[cid]?.capital; return cap?rulerOf(cap):null; }
function duchyHolder(did){ const cs=DUCHIES[did]?.counties||[]; const cap=cs.length?COUNTIES[cs[0]]?.capital:null; return cap?rulerOf(cap):null; }
function countiesOf(charId){ const cs=new Set(); for(const bid of regionsOf(charId)) cs.add(countyOf(bid)); return [...cs].filter(Boolean); }
function duchiesOf(charId){ const ds=new Set(); for(const bid of regionsOf(charId)) ds.add(duchyOf(bid)); return [...ds].filter(Boolean); }
function seatCounty(c){ return countyOf(c.region)||null; }
function seatDuchy(c){ return duchyOf(c.region)||null; }
function playerChar(){ return chars[state.player]; }

/* ---------- 게임 공통 상태 대전략 ---------- */
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
const MDAYS=[31,28,31,30,31,30,31,31,30,31,30,31];
const SEASONS=['겨울','겨울','봄','봄','봄','여름','여름','여름','가을','가을','가을','겨울'];

function log(msg, cls){
  const p=document.createElement('p'); if(cls)p.className=cls;
  p.innerHTML=`<span class="d">${state.year}년 ${state.month}월 ${state.day}일</span>${msg}`;
  const el=document.getElementById('log'); el.appendChild(p); el.scrollTop=el.scrollHeight;
  while(el.children.length>140) el.removeChild(el.firstChild);
}

/* ---------- 자동 정지 팝업 패널 ---------- */
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

/* ---------- 스트레스 연산 루틴 ---------- */
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

/* ---------- 승계 상속법 엔진 (Phase 5) ---------- */
function kill(c, cause){
  if(c.dead) return;
  c.dead=true;
  if(c.id===state.player || c.ruler) {
    playSynthSFX('death');
  }
  if(c.spouse&&chars[c.spouse]){ chars[c.spouse].spouse=null; addStress(chars[c.spouse],40,'배우자의 죽음'); }
  for(const id in chars){const k=chars[id];
    if(!k.dead&&(k.father===c.id||k.mother===c.id)) addStress(k,30,'부모의 죽음');}
  if(c.ruler) succession(c);
  if(c.id===state.player){
    const dist=distributeSuccession(c);
    if(dist){
      const mainHid=Object.keys(dist)[0];
      const mainH=chars[mainHid];
      for(const [hid,cids] of Object.entries(dist)){
        const h=chars[hid]; if(!h) continue;
        h.ruler=true; h.liege=null; h.courtOf=null;
        cids.forEach(cid=>seizeCounty(hid,cid));
        if(!h.region||!regionsOf(hid).includes(h.region)) h.region=COUNTIES[cids[0]]?.capital||c.region;
      }
      state.player=mainHid;
      const seatName=COUNTIES[countyOf(mainH.region)]?.n||BARONIES[mainH.region]?.n||'?';
      const splitMsg=Object.keys(dist).length>1
        ?`\n\n분할 상속:\n`+Object.entries(dist).map(([hid,cids])=>`${chars[hid].name}: ${cids.map(cid=>COUNTIES[cid]?.n||cid).join('·')}`).join('\n'):'';
      log(`<b>${mainH.name}</b>이(가) ${seatName}의 칭호를 계승했습니다.`,'fam');
      popup({title:'왕은 죽었다', sub:'계승',
        body:`${c.name}의 시대가 끝났습니다. (${cause})\n이제 <b>${mainH.name}</b>(${age(mainH)}세)이(가) ${seatName}을(를) 다스립니다.${splitMsg}`,
        opts:[{t:'왕은 만세하리라'}]});
    } else {
      gameOver(`${c.name}이(가) 후계자 없이 사망했습니다. 우어 브리언 가문의 직계가 끊겼습니다.`);
    }
  } else {
    log(`<b>${c.name}</b> 사망 (${cause}).`,'war');
  }
}

function findHeir(c, malePref=true){
  const kids=Object.values(chars).filter(k=>!k.dead&&(k.father===c.id||k.mother===c.id)&&age(k)>=0);
  kids.sort((a,b)=>a.byear-b.byear||a.bmonth-b.bmonth);
  if(malePref) return kids.find(k=>k.sex==='m')||kids[0]||null;
  return kids[0]||null;
}
function validHeirs(c){
  const kids=Object.values(chars).filter(k=>!k.dead&&(k.father===c.id||k.mother===c.id)&&age(k)>=16);
  kids.sort((a,b)=>a.byear-b.byear);
  return kids;
}
function distributeSuccession(c){
  const ownedCids=directCountiesOf(c.id);
  const seatCid=countyOf(c.region)||ownedCids[0];
  const heirs=validHeirs(c);
  if(!heirs.length) return null;
  const law=c.id===state.player?state.successionLaw:'primogeniture';
  const mainHeir=heirs[0];

  if(law==='primogeniture'||heirs.length===1||ownedCids.length<=1){
    return {[mainHeir.id]:ownedCids};
  }
  if(law==='partition'){
    const dist={[mainHeir.id]:[seatCid].filter(Boolean)};
    const rest=ownedCids.filter(cid=>cid!==seatCid);
    rest.forEach((cid,i)=>{
      const h=heirs[(i+1)%heirs.length];
      if(!dist[h.id]) dist[h.id]=[];
      dist[h.id].push(cid);
    });
    return dist;
  }
  if(law==='elective'){
    const vassals=vassalsOf(c.id);
    let best=mainHeir, bestVotes=0;
    for(const h of heirs){
      const votes=vassals.reduce((s,v)=>s+Math.max(0,opinion(v,h)+50),0);
      if(votes>bestVotes){ bestVotes=votes; best=h; }
    }
    return {[best.id]:ownedCids};
  }
  return {[mainHeir.id]:ownedCids};
}
function succession(c){
  if(c.id===state.player) return;
  const owned=regionsOf(c.id);
  if(!owned.length) return cleanupAfterDeath(c);
  const seat=owned.includes(c.region)?c.region:owned[0];
  const seatName=COUNTIES[countyOf(seat)]?.n||BARONIES[seat]?.n||'?';
  const dist=distributeSuccession(c);
  if(dist){
    for(const [hid,cids] of Object.entries(dist)){
      let h=chars[hid]; if(!h) continue;
      h.ruler=true; h.liege=c.liege; h.courtOf=null;
      cids.forEach(cid=>seizeCounty(hid,cid));
      if(!h.region||!regionsOf(hid).includes(h.region)) h.region=COUNTIES[cids[0]]?.capital||seat;
      if(hid===Object.keys(dist)[0]){
        log(`${seatName}의 왕좌가 <b>${h.name}</b>에게 넘어갔습니다.`,'dip');
      } else {
        log(`${h.name}이(가) ${cids.map(cid=>COUNTIES[cid]?.n||cid).join('·')}을(를) 계승했습니다.`,'dip');
      }
    }
  } else {
    const nu=mk({name:randName(), dyn:c.dyn, byear:state.year-30-Math.floor(Math.random()*15),
      bmonth:1+Math.floor(Math.random()*12), bday:1+Math.floor(Math.random()*28),
      traits:randTraits(3), base:randStats(), edu:1+Math.floor(Math.random()*3),
      eduFocus:randKey(SKILLS), region:seat, ruler:true, liege:c.liege});
    for(const rid of owned) BARONIES[rid].owner=nu.id;
    log(`${seatName}에서 방계 <b>${nu.name}</b>이(가) 왕좌를 차지했습니다.`,'dip');
  }
  cleanupAfterDeath(c);
}
function cleanupAfterDeath(c){
  state.wars=state.wars.filter(w=>{
    if(w.atk===c.id||w.def===c.id){ log(`${COUNTIES[countyOf(c.region)]?.n||'영지'}의 전쟁이 지배자 사망으로 종결되었습니다.`,'war'); return false;}
    return true;});
  state.schemes=state.schemes.filter(s=>s.plotter!==c.id&&s.target!==c.id);
}
const NAMES_M=['타드그','로르칸','피네언','콘','니얼','루어드리','케르발','플란','브란','에오한'];
function randName(){ return NAMES_M[Math.floor(Math.random()*NAMES_M.length)]; }
function randKey(o){ const k=Object.keys(o); return k[Math.floor(Math.random()*k.length)]; }
function randTraits(n){
  const out=[]; let pool=[...PERSONALITY_KEYS];
  while(out.length<n&&pool.length){
    const t=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
    if(!out.includes(TRAITS[t].opp)) out.push(t);
  }
  return out;
}
function randStats(){ const r=()=>3+Math.floor(Math.random()*8); return {dip:r(),mar:r(),stew:r(),intr:r(),learn:r(),prow:r()}; }
function gameOver(msg){
  state.over=true; pause();
  popup({title:'가문의 종언', sub:'게임 오버', body:msg+'\n\n에이레의 연대기는 다른 가문의 이름으로 쓰일 것입니다.', opts:[{t:'다시 시작', f:()=>location.reload()}]});
}

/* ---------- 연간 외부 세계 이벤트 (Phase 5) ---------- */
const WORLD_EVENTS = [
  { id:'norman_shadow', triggerYear:1066, maxYear:1075, chance:0.6, fired:false,
    run:(p)=>popup({title:'노르만의 그림자', sub:'세계 소식',
      body:`잉글랜드에서 충격적인 소식이 전해집니다.\n노르만 공작 윌리엄이 해럴드 왕을 헤이스팅스에서 꺾고 왕좌를 차지했습니다.\n에이레 서쪽에 새로운 강자가 등장했습니다.`,
      opts:[
        {t:'경계를 강화한다', d:'병력 +100, 스트레스 +8', f:()=>{BARONIES[p.region].troops+=100; addStress(p,8,'강대국의 위협');}},
        {t:'사절을 보낸다', d:'위신 +10, 외교 탐색', f:()=>{state.prestige+=10; log('노르만 왕국에 사절을 파견했습니다.','dip');}},
      ]})},
  { id:'viking_dublin', triggerYear:1068, maxYear:1090, chance:0.5, fired:false,
    run:(p)=>{
      popup({title:'더블린의 바이킹', sub:'해안 위협',
        body:`더블린의 노르드 해상 세력이 다시 활동을 시작했습니다.\n바다에서 온 배들이 동부 해안을 약탈하고 있습니다.`,
        opts:[
          {t:'해안 방어를 강화한다', d:'금 -50, 동부 민심 +8', f:()=>{
            BARONIES[p.region].gold-=50; playSynthSFX('gold');
            ['c_dublin','c_leinster'].forEach(cid=>COUNTIES[cid]?.baronies.forEach(bid=>{if(BARONIES[bid]?.owner===state.player) BARONIES[bid].pop=Math.min(100,(BARONIES[bid].pop||60)+8);}));
            log('해안 경비를 강화했습니다.','war');}},
          {t:'바이킹과 교역한다', d:'금 +60, 위험', f:()=>{
            if(Math.random()<0.7){BARONIES[p.region].gold+=60; playSynthSFX('gold'); log('바이킹과 교역에 성공했습니다.','good');}
            else{BARONIES[p.region].troops=Math.max(100,BARONIES[p.region].troops-100); log('교역선이 습격당했습니다!','war');}}},
        ]});}},
  { id:'papal_legate', triggerYear:1070, maxYear:1090, chance:0.5, fired:false,
    run:(p)=>popup({title:'교황 특사의 방문', sub:'신앙',
      body:`로마에서 온 특사가 아일랜드 교회의 개혁을 촉구합니다.\n그레고리우스 7세의 개혁 운동이 에이레에도 파급되고 있습니다.`,
      opts:[
        {t:'개혁을 수용한다', d:'위신 +30, 민심 +10', f:()=>{state.prestige+=30; for(const bid of regionsOf(state.player)) BARONIES[bid].pop=Math.min(100,(BARONIES[bid].pop||60)+Math.round(10/regionsOf(state.player).length)); log('교회 개혁을 수용했습니다. 교황청의 지지를 얻었습니다.','good');}},
        {t:'정중히 거절한다', d:'위신 -10', f:()=>{state.prestige=Math.max(0,state.prestige-10);}},
      ]})},
];

function worldEventPulse(){
  if(state.month!==1) return;
  const p=playerChar(); if(!p||p.dead) return;
  for(const ev of WORLD_EVENTS){
    if(ev.fired&&!ev.repeatable) continue;
    if(state.year<ev.triggerYear||state.year>ev.maxYear) continue;
    if(Math.random()<ev.chance){ ev.fired=true; ev.run(p); break; }
  }
}

/* ---------- 메인 제어 루틴 ---------- */
function togglePause(){ state.paused?resume():pause(); }
const PANELS={ log: {wrap:'logWrap', render:null}, court:{wrap:'courtWrap', render:'renderCourt'}, dec:{wrap:'decWrap', render:'renderDec'} };
const PANEL_TAB_IDS={log:'logTab',court:'courtTab',dec:'decTab'};

function _showAllTabs(){ Object.values(PANEL_TAB_IDS).forEach(tid=>{ const t=document.getElementById(tid); if(t) t.style.display=''; }); }
function _hideOtherTabs(activeId){
  Object.entries(PANEL_TAB_IDS).forEach(([pid,tid])=>{ const t=document.getElementById(tid); if(!t) return; t.style.display = pid===activeId ? '' : 'none'; });
  Object.keys(PANELS).forEach(k=>{ const w=document.getElementById(PANELS[k].wrap); if(!w) return; w.style.zIndex = k===activeId ? '37' : '35'; });
}

function togglePanel(id){
  initAudio();
  const info=PANELS[id]; if(!info) return;
  const el=document.getElementById(info.wrap); const opening=!el.classList.contains('open');
  Object.keys(PANELS).forEach(k=>{ if(k!==id) document.getElementById(PANELS[k].wrap).classList.remove('open'); });
  if(opening){
    playSynthSFX('event');
    if(info.render) window[info.render](); el.classList.add('open'); if(id!=='log') pause(); _hideOtherTabs(id);
  } else {
    el.classList.remove('open'); if(id!=='log') resume(); _showAllTabs();
    Object.keys(PANELS).forEach(k=>{ const w=document.getElementById(PANELS[k].wrap); if(w) w.style.zIndex=''; });
  }
}
function closePanel(id){
  const info=PANELS[id]; if(!info) return; document.getElementById(info.wrap).classList.remove('open'); if(id!=='log') resume(); _showAllTabs();
  Object.keys(PANELS).forEach(k=>{ const w=document.getElementById(PANELS[k].wrap); if(w) w.style.zIndex=''; });
}
function pause(){ state.paused=true; clearInterval(state.timer); state.timer=null; updPauseBtn(); }
function resume(){
  if(state.over||state.modalOpen) return; state.paused=false;
  const iv = state.speed===1?550 : state.speed===2?260 : 110;
  clearInterval(state.timer); state.timer=setInterval(tick,iv); updPauseBtn();
}
function setSpeed(s){ state.speed=s; document.querySelectorAll('.spd').forEach(b=>b.classList.toggle('on',+b.dataset.s===s)); if(!state.paused) resume(); }
function updPauseBtn(){ const b=document.getElementById('pauseBtn'); b.textContent=state.paused?'▶ 진행':'⏸ 정지'; b.classList.toggle('paused',state.paused); }

function tick(){
  if(state.paused||state.over) return;
  state.day++; const dim=MDAYS[state.month-1];
  if(state.day>dim){ state.day=1; state.month++; if(state.month>12){ state.month=1; state.year++; } monthlyPulse(); }
  dailyBirthdays(); renderHeader(); renderChar();
  if(state.popupQ.length) flushPopups();
}

/* ---------- 성장 및 후견 구조 공식 ---------- */
function dailyBirthdays(){ for(const id in chars){ const c=chars[id]; if(c.dead) continue; if(c.bmonth===state.month&&c.bday===state.day){ onBirthday(c,age(c)); } } }
function onBirthday(c,a){
  if(a===3&&!c.childTrait){ c.childTrait=randKey(CHILD_TRAITS); if(isPlayerFamily(c)) log(`<b>${c.name}</b>(3세)에게서 <b>${CHILD_TRAITS[c.childTrait].n}</b>의 기질이 보입니다.`,'fam'); }
  if(a===6&&!c.eduFocus){ if(isPlayerFamily(c)) askEducation(c); else { c.eduFocus=CHILD_TRAITS[c.childTrait||'curious'].foci[0]; } }
  if(a>=6&&a<16&&c.eduFocus){ if(eduRoll(c)) c.eduScore+=2; }
  if((a===9||a===11||a===13)&&c.traits.length<3){ if(isPlayerFamily(c)) askPersonality(c,a); else npcGainPersonality(c); }
  if(a===16&&c.edu===null){ comeOfAge(c); }
  if(a>=60){ if(Math.random()<=(a-58)*0.035) kill(c,'노환'); }
}
function isPlayerFamily(c){ const p=playerChar(); return c.father===p.id||c.mother===p.id||c.courtOf===p.region; }
function eduRoll(c){
  let S=0,F=0; const g=guardianOf(c);
  if(c.childTrait && CHILD_TRAITS[c.childTrait].foci.includes(c.eduFocus)) S+=20; else S-=20;
  if(g){ S += 0.4*stat(g,c.eduFocus) + 0.2*stat(g,'learn'); } else F+=20;
  return Math.random() < (60+S)/(100+S+F);
}
function guardianOf(c){ if(c.guardian&&chars[c.guardian]&&!chars[c.guardian].dead) return chars[c.guardian]; if(c.father&&chars[c.father]&&!chars[c.father].dead) return chars[c.father]; return null; }

function comeOfAge(c){
  const sc=c.eduScore; c.edu = sc>=18?3 : sc>=13?2 : sc>=8?1 : 0;
  if(isPlayerFamily(c)||c.ruler){ log(`<b>${c.name}</b>이(가) 성인이 되었습니다 — <b>${EDU_NAMES[c.eduFocus||'dip'][c.edu]}</b> (교육 점수 ${sc})`,'fam'); }
  if(!c.eduFocus) c.eduFocus='dip';
  if(isPlayerFamily(c)){ while(c.traits.length<2) npcGainPersonality(c); if(c.traits.length<3) askPersonality(c,16); }
  else { while(c.traits.length<3) npcGainPersonality(c); }
  if(c.id===state.player) askLifestyle(c); else c.lifestyle=randKey(SKILLS);
}

function askEducation(c){
  const ct=CHILD_TRAITS[c.childTrait||'curious']; const courtAdults=Object.values(chars).filter(k=>!k.dead&&age(k)>=16&&(k.courtOf===playerChar().region||k.id===state.player));
  const opts=Object.entries(SKILLS).map(([k,n])=>({ t:`${n} 교육`+(ct.foci.includes(k)?' ★ 기질 일치':''), d:ct.foci.includes(k)?'어린시절 특성과 일치 — 교육 성공률 상승':'기질과 불일치 — 성공률 하락', f:()=>{ c.eduFocus=k; pickGuardian(c,courtAdults); } }));
  popup({title:`${c.name}의 교육`, sub:'6세 — 교육 방향 결정', body:`${c.name}이(가) 배움을 시작할 나이가 되었습니다.\n기질: ${ct.n} (적성: ${ct.foci.map(f=>SKILLS[f]).join(', ')})`, opts});
}
function pickGuardian(c,adults){
  const opts=adults.slice(0,5).map(g=>({ t:`${g.name}`, d:`${SKILLS[c.eduFocus]} ${stat(g,c.eduFocus)} · 학문 ${stat(g,'learn')} · 성격: ${g.traits.map(t=>TRAITS[t].n).join('·')||'—'}`, f:()=>{ c.guardian=g.id; chOp(c,g,15); chOp(g,c,5); log(`<b>${g.name}</b>이(가) ${c.name}의 후견인이 되었습니다.`,'fam'); } }));
  popup({title:`${c.name}의 후견인`, sub:'후견 결정', body:'후견인의 해당 스킬(×0.4)과 학문(×0.2)이 교육 점수에 영향을 줍니다.', opts});
}
function askPersonality(c,a){
  const g=guardianOf(c); const cand=new Set(); if(g) g.traits.forEach(t=>{ if(canHaveTrait(c,t)) cand.add(t); });
  while(cand.size<3){ const t=PERSONALITY_KEYS[Math.floor(Math.random()*PERSONALITY_KEYS.length)]; if(canHaveTrait(c,t)) cand.add(t); }
  const opts=[...cand].slice(0,3).map(t=>({ t:TRAITS[t].n, d:(g&&g.traits.includes(t))?'후견인의 영향':'', f:()=>{ c.traits.push(t); log(`<b>${c.name}</b>(${a}세)이(가) <b>${TRAITS[t].n}</b> 성격을 갖게 되었습니다.`,'fam'); } }));
  popup({title:`${c.name}의 성장`, sub:`${a}세 — 성격 형성`, body:`${c.name}의 성격이 뚜렷해지고 있습니다. 어떤 면모가 두드러집니까?`, opts});
}
function npcGainPersonality(c){
  const g=guardianOf(c); let t=null; if(g&&Math.random()<0.5){ const gs=g.traits.filter(x=>canHaveTrait(c,x)); if(gs.length) t=gs[Math.floor(Math.random()*gs.length)]; }
  if(!t){ let tries=0; do{ t=PERSONALITY_KEYS[Math.floor(Math.random()*PERSONALITY_KEYS.length)]; tries++; }while(!canHaveTrait(c,t)&&tries<20); }
  if(t&&canHaveTrait(c,t)) c.traits.push(t);
}
function canHaveTrait(c,t){ return !c.traits.includes(t)&&!c.traits.includes(TRAITS[t].opp)&&c.traits.length<3; }
function askLifestyle(c){
  const opts=Object.entries(SKILLS).map(([k,n])=>({ t:`${n}의 길`, d:c.eduFocus===k?`교육 일치 — 경험치 +${(EDU_BONUS[c.edu]||1)*10}%`:'', f:()=>{ c.lifestyle=k; log(`<b>${c.name}</b>이(가) <b>${n}</b>의 길을 걷기로 했습니다.`,'fam'); } }));
  popup({title:'인생관', sub:'삶의 방향', body:`${c.name}은(는) 앞으로 어떤 통치자가 되려 합니까?`, opts});
}

/* ---------- 경제 재정 패널 연산 (Phase 2) ---------- */
function directCountiesOf(charId){ return Object.keys(COUNTIES).filter(cid=>BARONIES[COUNTIES[cid].capital]?.owner===charId); }
function vassalCountiesOf(charId){ const vcids=[]; for(const id in chars){ const v=chars[id]; if(v.dead||v.liege!==charId||!v.ruler) continue; directCountiesOf(id).forEach(cid=>vcids.push(cid)); } return vcids; }
function vassalsOf(liegeId){ return Object.values(chars).filter(c=>!c.dead&&c.liege===liegeId&&c.ruler); }
function domainLimit(c){ const d=duchiesOf(c.id).length; const ct=directCountiesOf(c.id).length; const base = d>=1?6 : ct>=3?4 : 2; return base + Math.floor(stat(c,'stew')*0.12); }
function overDomainLimit(c){ return directCountiesOf(c.id).length > domainLimit(c); }

function grantCountyToVassal(liegeId, vassalId, cid){
  const liege=chars[liegeId], vassal=chars[vassalId]; if(!liege||!vassal||!COUNTIES[cid]) return;
  COUNTIES[cid].baronies.forEach(bid=>{ if(BARONIES[bid]) BARONIES[bid].owner=vassalId; });
  vassal.liege=liegeId; vassal.ruler=true; vassal.courtOf=null;
  if(!vassal.region||countyOf(vassal.region)!==cid) vassal.region=COUNTIES[cid].capital; chOp(vassal,liege,25);
  playSynthSFX('event');
  log(`<b>${vassal.name}</b>이(가) ${COUNTIES[cid].n}의 백작으로 임명됐습니다.`,'good');
}
function vassalRevolt(v, liege){
  v.liege=null; chOp(v,liege,-50); chOp(liege,v,-50); log(`<b>${v.name}</b>이(가) ${liege.name}에게 반기를 들었습니다!`,'war');
  directCountiesOf(v.id).forEach(cid=>v.claims.push({rid:cid, type:'revenge', obtained:state.year}));
  if(v.id===state.player||liege.id===state.player){
    popup({title:'봉신 반란!', sub:'정치 위기', body:`<b>${v.name}</b>이(가) 반란을 선포했습니다!\n봉신의 불만이 한계에 달했습니다.`,
      opts:[{t:'진압 전쟁 선포', f:()=>{ if(liege.id===state.player) addClaim(directCountiesOf(v.id)[0],'revenge'); }}, {t:'독립을 인정한다', f:()=>{ addStress(liege.id===state.player?liege:playerChar(), 20,'굴욕적 양보'); }}]});
  }
}

function monthlyPulse(){
  for(const id in chars){ const c=chars[id]; if(c.dead) continue; if(c.lifestyle){ let xp=10; if(c.edu!==null&&c.eduFocus===c.lifestyle) xp*=1+(EDU_BONUS[c.edu]*0.1); c.lifeXP+=Math.round(xp); } if(c.pregnant>0){ c.pregnant++; if(c.pregnant>=10) giveBirth(c); } }
  buildingPulse(); fertilityPulse(); naturalDeathPulse(); councilPulse(); schemePulse(); warPulse(); aiPulse(); randomEventPulse(); goldPulse();
  for(const role in COUNCIL_ROLES){ const cid=state.council[role]; if(cid&&(!chars[cid]||chars[cid].dead)){ state.council[role]=null; log(`${COUNCIL_ROLES[role].n} 자문회 보직이 공석이 됐습니다.`,'dip'); } }
  if(state.month===1){ claimExpirePulse(); worldEventPulse(); opinionDecayPulse(); }
  if(document.getElementById('courtWrap').classList.contains('open')) renderCourt();
  if(document.getElementById('decWrap').classList.contains('open')) renderDec();
  renderMap();
}

function goldPulse(){
  for(const bid in BARONIES){ const b=BARONIES[bid]; const regen=4+buildingBonus(bid,'troops_regen'); b.troops=Math.min(b.cap, b.troops+regen); }
  const TAX_RATE=0.25; const processed=new Set();
  for(const id in chars){
    const c=chars[id]; if(c.dead||!c.ruler||processed.has(id)) continue; processed.add(id);
    const owned=regionsOf(id); if(!owned.length) continue; const seat=owned.includes(c.region)?c.region:owned[0]; const seatB=BARONIES[seat]; if(!seatB) continue;
    const dCnt=directCountiesOf(id).length; const dLimit=domainLimit(c); const overPenalty=dCnt>dLimit?Math.max(0.3,1-(dCnt-dLimit)*0.15):1;
    const directIncome=owned.reduce((s,bid)=>{ const b=BARONIES[bid]; return s+(b?Math.round((4+stat(c,'stew')*0.5)*overPenalty):0); },0);
    const goldCap=id===state.player?3500:2500; seatB.gold=Math.min(goldCap, seatB.gold+directIncome);
    if(id===state.player||c.ruler){
      for(const v of vassalsOf(id)){
        const opn=Math.max(0,opinion(v,c)+100)/200; const taxMul=TAX_RATE*opn; const vOwned=regionsOf(v.id); const vSeat=vOwned.includes(v.region)?v.region:vOwned[0]; const vSeatB=vSeat?BARONIES[vSeat]:null; if(!vSeatB) continue;
        const taxAmt=Math.round(vSeatB.gold*taxMul*0.08); if(taxAmt>0 && vSeatB.gold>taxAmt){ vSeatB.gold-=taxAmt; seatB.gold=Math.min(goldCap, seatB.gold+taxAmt); }
      }
    }
  }
  for(const id in chars){ const v=chars[id]; if(v.dead||!v.ruler||!v.liege) continue; const liege=chars[v.liege]; if(!liege||liege.dead) continue; const op=opinion(v,liege); if(op<-40 && Math.random()<0.02*((-op-40)/60)){ vassalRevolt(v,liege); } }
}

function fertilityPulse(){
  for(const id in chars){
    const c=chars[id]; if(c.dead||c.sex!=='f'||!c.spouse||c.pregnant>0) continue; const h=chars[c.spouse]; if(!h||h.dead) continue; if(age(c)<16||age(h)<16) continue;
    const chance=((fert(c)+fert(h))/2)*0.0475; if(Math.random()<chance){ c.pregnant=1; if(isPlayerFamily(c)||c.id===state.player||h.id===state.player) log(`<b>${c.name}</b>이(가) 회임했습니다.`,'fam'); }
  }
}
function naturalDeathChance(a){ if(a<16) return 0.001; if(a<40) return 0.0015; if(a<50) return 0.003; if(a<55) return 0.006; if(a<60) return 0.010; if(a<65) return 0.016; if(a<70) return 0.025; if(a<75) return 0.038; if(a<80) return 0.055; return 0.08; }
function naturalDeathPulse(){
  const p=playerChar();
  for(const id in chars){
    const c=chars[id]; if(c.dead) continue; const a=age(c); let chance=naturalDeathChance(a); if(c.stress>=100) chance*=1.5; if(c.stress>=130) chance*=2.0; if(Math.random()>chance) continue;
    if(c.id===state.player){ popup({title:'노환', sub:'건강 소멸', body:`${c.name}이(가) ${a}세의 나이에 조용히 눈을 감았습니다.`, opts:[{t:'...', f:()=>kill(c,'노환')}]}); }
    else {
      if(c.spouse===state.player||chars[c.spouse]?.spouse===state.player||c.id===p.spouse){ log(`<b>${c.name}</b>이(가) ${a}세를 일기로 세상을 떠났습니다.`,'fam'); addStress(p,40,'배우자의 죽음'); popup({title:'배우자의 죽음', sub:'가문', body:`${c.name}이(가) 조용히 눈을 감았습니다.`, opts:[{t:'명복을 빈다', f:()=>{ if(p.spouse===c.id) p.spouse=null; }}]}); }
      else if(c.father===state.player||c.mother===state.player){ log(`<b>${c.name}</b>이(가) ${a}세로 사망했습니다.`,'fam'); addStress(p,25,'자식의 죽음'); }
      kill(c,'노환');
    }
  }
}
function giveBirth(c){
  c.pregnant=0; c.births++; const h=chars[c.spouse]; const sex=Math.random()<0.51?'m':'f';
  const baby=mk({name:sex==='m'?randName():['이테','고름라트','사브','베브','오를라트'][Math.floor(Math.random()*5)], dyn:h?h.dyn:c.dyn, sex, byear:state.year, bmonth:state.month, bday:Math.min(state.day,28), base:babyStats(c,h), father:h?h.id:null, mother:c.id, courtOf:c.courtOf||((h&&h.region)?h.region:null)});
  if(h&&h.region) baby.courtOf=h.region; const fam=isPlayerFamily(baby)||(h&&h.id===state.player);
  if(fam){
    log(`<b>${c.name}</b>이(가) ${sex==='m'?'아들':'딸'} <b>${baby.name}</b>을(를) 낳았습니다.`,'good');
    if(h&&h.id===state.player) popup({title:'새 생명', sub:'출산', body:`${c.name}이(가) 건강한 ${sex==='m'?'아들':'딸'}을 낳았습니다.`, opts:[{t:'가문에 축복이 있기를', f:()=>addStress(playerChar(),-15,'아이의 탄생')}]});
  } else if(h&&h.ruler){ log(`${COUNTIES[countyOf(h.region)]?.n||BARONIES[h.region]?.n||''}의 궁정에 아이가 태어났습니다.`,'dip'); }
}
function babyStats(m,f){ const r={}; for(const k of ['dip','mar','stew','intr','learn','prow']){ const mv=m?m.base[k]:5, fv=f?f.base[k]:5; r[k]=Math.max(0,Math.min(10,Math.round((mv+fv)/2 + (Math.random()*4-2)))); } return r; }

/* ---------- 살해 모략 추적 매트릭스 ---------- */
function startScheme(plotter,target){
  if(state.schemes.some(s=>s.plotter===plotter.id&&s.target===target.id)) return false;
  state.schemes.push({plotter:plotter.id,target:target.id,months:0});
  if(plotter.id===state.player){
    if(plotter.traits.includes('just')) addStress(plotter,30,'공정한 자의 음모');
    if(plotter.traits.includes('honest')) addStress(plotter,20,'정직한 자의 음모');
    log(`<b>${target.name}</b>에 대한 살해 모략을 시작했습니다.`,'war');
  }
  return true;
}
function schemePulse(){
  state.schemes=state.schemes.filter(s=>{
    const p=chars[s.plotter], t=chars[s.target]; if(!p||!t||p.dead||t.dead) return false; s.months++; if(s.months<3) return true;
    const succ=Math.max(0.04, Math.min(0.45, 0.08+(stat(p,'intr')-stat(t,'intr'))*0.03)); const discover=0.07+stat(t,'intr')*0.008; const roll=Math.random();
    if(roll<succ){
      log(`<b>${t.name}</b>이(가) 의문의 죽음을 맞았습니다. 독이 든 술잔이었습니다.`,'war');
      if(s.target===state.player){ popup({title:'독배', sub:'암살 진입', body:'연회의 술잔에 독이 들어 있었습니다...', opts:[{t:'...', f:()=>kill(t,'독살')}]}); } else kill(t,'독살');
      return false;
    }
    if(roll<succ+discover){ log(`<b>${p.name}</b>의 살해 모략이 발각되었습니다!`,'war'); chOp(t,p,-50); if(s.plotter===state.player) addStress(p,20,'모략 발각의 수치'); return false; }
    return s.months<30;
  });
}

/* ---------- 개전 선포 공성 전투 로직 ---------- */
function declareWar(atk,def,targetRid){
  if(truceBetween(atk.id,def.id)) return false;
  if(state.wars.some(w=>(w.atk===atk.id&&w.def===def.id)||(w.atk===def.id&&w.def===atk.id))) return false;
  if(isAllied(atk.id,def.id)){ if(atk.id===state.player) log('동맹국에는 선전포고할 수 없습니다.','dip'); return false; }
  let tRid = targetRid || def.region || regionsOf(def.id)[0]; let tCid = null;
  if(COUNTIES[tRid]){ tCid=tRid; tRid=COUNTIES[tRid].capital; } else if(BARONIES[tRid]){ tCid=BARONIES[tRid].county; }
  if(!tRid||!BARONIES[tRid]){ return false; }
  
  playSynthSFX('war');
  
  state.wars.push({atk:atk.id, def:def.id, targetRid:tCid||tRid, score:0, months:0, allies:[]}); chOp(def,atk,-40);
  log(`<b>${atk.name}</b>이(가) <b>${tCid?COUNTIES[tCid]?.n:BARONIES[tRid]?.n||tRid}</b>을(를) 목표로 선전포고했습니다!`,'war');
  if(def.id!==state.player && def.ruler) npcGrantRevenge(def, tRid);
  const defAllies = state.alliances.filter(k=>k.includes(def.id)).map(k=>k.replace(def.id,'').replace('|','')).filter(x=>x&&chars[x]&&!chars[x].dead);
  for(const aid of defAllies){
    if(aid===atk.id) continue;
    if(aid===state.player){
      popup({title:'동맹 방어 의무', sub:'전쟁', body:`<b>${def.name}</b>이(가) 침공당했습니다.`, opts:[
        {t:'참전한다', f:()=>{ state.wars.find(w=>w.atk===atk.id&&w.def===def.id)?.allies.push(state.player); log('동맹국 방어에 참전했습니다.','war'); }},
        {t:'거부한다 (위신 -50)', f:()=>{ state.prestige=Math.max(0,state.prestige-50); breakAlliance(state.player,def.id); }}
      ]});
    } else { if(Math.random()<0.8){ state.wars.find(w=>w.atk===atk.id&&w.def===def.id)?.allies.push(aid); } else { breakAlliance(aid,def.id); } }
  }
  if(def.id===state.player){ grantRevengeClaim(tCid||tRid); popup({title:'전쟁이다!', sub:'침공', body:`${atk.name}의 군대가 국경을 넘었습니다!`, opts:[{t:'전군 소집!', f:()=>addStress(playerChar(),10,'전쟁의 무게')}]}); }
  renderMap(); return true;
}
function truceBetween(a,b){ const k=[a,b].sort().join('|'); return state.truces[k]&&state.truces[k]>state.year; }
function setTruce(a,b,years){ const k=[a,b].sort().join('|'); state.truces[k]=state.year+years; }
function allianceKey(a,b){ return [a,b].sort().join('|'); }
function isAllied(a,b){ return state.alliances.includes(allianceKey(a,b))||state.npcAlliances.includes(allianceKey(a,b)); }
function breakAlliance(a,b){ const k=allianceKey(a,b); state.alliances=state.alliances.filter(x=>x!==k); state.npcAlliances=state.npcAlliances.filter(x=>x!==k); setTruce(a,b,5); chOp(chars[a],chars[b],-40); chOp(chars[b],chars[a],-40); }
function formAlliance(a,b){ const k=allianceKey(a,b); if(!state.alliances.includes(k)&&!state.npcAlliances.includes(k)) state.alliances.push(k); }
function power(c){ let t=0; for(const bid of regionsOf(c.id)){ const b=BARONIES[bid]; if(b) t+=b.troops; } for(const v of vassalsOf(c.id)){ for(const bid of regionsOf(v.id)){ const b=BARONIES[bid]; if(b) t+=b.troops*0.1; } } if(!t) t=150; return t*(1+stat(c,'mar')*0.04)*(1+stat(c,'prow')*0.01); }
function resolveWarChar(wSide){ const c=chars[wSide]; if(c&&!c.dead) return wSide; const heir=Object.values(chars).find(k=>!k.dead&&k.ruler&&k.dyn===c?.dyn&&k.id!==wSide); return heir?heir.id:null; }
function siegeProgress(w){ const cid=w.targetRid; if(!cid||!COUNTIES[cid]) return 0; const bids=COUNTIES[cid].baronies; if(!w.occupied) w.occupied=[]; return bids.length>0 ? w.occupied.length/bids.length : 0; }

function warPulse(){
  state.wars=state.wars.filter(w=>{
    const newAtk=resolveWarChar(w.atk), newDef=resolveWarChar(w.def); if(!newAtk||!newDef) return false; if(newAtk!==w.atk) w.atk=newAtk; if(newDef!==w.def) w.def=newDef;
    const a=chars[w.atk], d=chars[w.def]; const tCid=w.targetRid;
    if(tCid&&COUNTIES[tCid]){
      const capHolder=countyHolder(tCid);
      if(capHolder&&capHolder.id!==w.def&&capHolder.id!==w.atk){
        if(w.atk===state.player||w.def===state.player){
          popup({title:'전쟁 목표 상실', sub:'판도 변경', body:`제3자가 영지를 선점했습니다.`, opts:[
            {t:'새 목표 검색', f:()=>{ const alt=directCountiesOf(w.def===state.player?a.id:d.id).find(c=>c!==tCid); if(alt){ w.targetRid=alt; w.occupied=[]; } else { setTruce(w.atk,w.def,2); state.wars=state.wars.filter(x=>x!==w); } }},
            {t:'전쟁 종결', f:()=>{ setTruce(w.atk,w.def,2); state.wars=state.wars.filter(x=>x!==w); }}
          ]}); return true;
        } else { setTruce(w.atk,w.def,2); return false; }
      }
    }
    w.months++; if(!w.occupied) w.occupied=[];
    const allyPow=(w.allies||[]).reduce((s,id)=>{ const v=chars[id]; return v?s+power(v)*0.6:s; },0);
    const pa=power(a)+allyPow+vassalsOf(w.atk).reduce((s,v)=>s+power(v)*0.4,0);
    const pd=power(d)+vassalsOf(w.def).reduce((s,v)=>s+power(v)*0.4,0);
    const ratio=(pa-pd)/Math.max(pa,pd); const warExhaust=0.97-Math.min(0.03,w.months*0.0005);
    for(const bid of regionsOf(a.id)) BARONIES[bid].troops=Math.max(80,Math.round(BARONIES[bid].troops*warExhaust));
    for(const bid of regionsOf(d.id)) BARONIES[bid].troops=Math.max(80,Math.round(BARONIES[bid].troops*warExhaust));
    
    if(tCid&&COUNTIES[tCid]){
      const bids=COUNTIES[tCid].baronies; const wallBonus=bids.filter(bid=>BARONIES[bid]?.buildings?.includes('walls')).length*0.1;
      if(ratio>0.1 && Math.random()<0.25+ratio*0.3-wallBonus){ const un=bids.filter(bid=>!w.occupied.includes(bid)); if(un.length) w.occupied.push(un[Math.floor(Math.random()*un.length)]); }
      else if(ratio<-0.1 && Math.random()<0.2){ if(w.occupied.length) w.occupied.splice(Math.floor(Math.random()*w.occupied.length),1); }
    }
    const siegePct=siegeProgress(w); const delta=ratio*9 + siegePct*6 + (Math.random()*8-4); w.score=Math.max(-100,Math.min(100,w.score+delta));
    if(w.months%3===0&&(w.atk===state.player||w.def===state.player)){ const my=w.atk===state.player?w.score:-w.score; log(`전황: ${my>=0?'+':''}${Math.round(my)}% · 공성 ${Math.round(siegePct*100)}%`,'war'); }
    const allSieged=tCid&&COUNTIES[tCid]&&w.occupied.length>=COUNTIES[tCid].baronies.length;
    if(w.score>=100||allSieged){ conquerTarget(a,d,tCid||w.targetRid); return false; }
    if(w.score<=-100){ setTruce(a.id,d.id,5); if(w.atk===state.player){ addStress(a,30,'패전의 굴욕'); addClaim(tCid||w.targetRid,'unpressed'); } return false; }
    if(w.months>60){ setTruce(a.id,d.id,3); return false; }
    return true;
  });
}

function conquerTarget(a, d, targetCid){
  let cid = targetCid; if(BARONIES[targetCid]) cid = BARONIES[targetCid].county; if(!cid||!COUNTIES[cid]){ setTruce(a.id,d.id,5); return; }
  const cname = COUNTIES[cid].n; log(`<b>${a.name}</b>이(가) <b>${cname}</b>을(를) 정복했습니다!`,'war');
  setTruce(a.id,d.id,5); const bids = COUNTIES[cid].baronies; const aSeat = BARONIES[a.region];
  bids.forEach(bid=>{ const b=BARONIES[bid]; if(!b) return; if(aSeat) aSeat.gold+=Math.round(b.gold*0.3); b.gold=Math.round(b.gold*0.7); b.owner=a.id; });
  if(countyOf(d.region)===cid){ const remaining=regionsOf(d.id).filter(bid=>BARONIES[bid]?.county!==cid); if(remaining.length){ d.region=remaining[0]; } else { d.ruler=false; d.region=null; d.courtOf=a.region; } }
  if(a.id===state.player){
    addStress(a,-15,'정복의 영광'); const remCnt=countiesOf(d.id).length; const canVassal=remCnt>0&&!d.dead;
    popup({title:'정복 달성', sub:cname, body:Html=``, opts:[ ...(canVassal?[{t:`${d.name}을 봉신으로 삼는다`, f:()=>{ d.liege=a.id; chOp(d,a,20); log(`${d.name}이(가) 봉신이 됐습니다.`,'dip'); checkVictoryHint(); }}]:[]), {t:'확인', f:checkVictoryHint} ]});
  }
  if(d.id===state.player&&!d.region){ gameOver(`${cname}이(가) 함락되었습니다. 왕좌를 완전히 상실했습니다.`); }
  renderMap();
}
function conquer(a,d){ conquerTarget(a,d,countyOf(d.region)||regionsOf(d.id)[0]); }
function checkVictoryHint(){ const n=playerRegions().length; if(n>=4&&n<7) log(`현재 ${n}개 지배 중. 결단 패널을 수수 확인하십시오.`,'good'); }

/* ---------- 자문회(Council) 배정 및 시스템 AI ---------- */
function courtMembersOf(ruler){ return Object.values(chars).filter(c=> !c.dead && age(c)>=16 && c.id!==ruler.id && c.courtOf===ruler.region ); }
function councilAssignedIds(ruler){ return Object.values(ruler.council).filter(Boolean); }
function buildNpcCouncil(ruler){
  const members = courtMembersOf(ruler);
  for(const role in COUNCIL_ROLES){
    const cur = ruler.council[role]; if(cur && chars[cur] && !chars[cur].dead) continue; ruler.council[role] = null;
    const assigned = councilAssignedIds(ruler); const sk = COUNCIL_ROLES[role].skill;
    const cand = members.filter(c=>!assigned.includes(c.id)).sort((a,b)=>stat(b,sk)-stat(a,sk));
    if(cand.length) ruler.council[role] = cand[0].id;
  }
}
function appointCouncilor(role, charId){
  if(charId){ for(const r in state.council){ if(r!==role && state.council[r]===charId){ log(`${chars[charId].name}은 이미 다른 임무 중입니다.`,'dip'); renderCourt(); return; } } }
  const prev = state.council[role]; if(prev && chars[prev]) chOp(chars[prev], playerChar(), -10); state.council[role] = charId || null;
  if(charId && chars[charId]){ chOp(chars[charId], playerChar(), 20); log(`<b>${chars[charId].name}</b>이(가) ${COUNCIL_ROLES[role].n}(으)로 임명되었습니다.`, 'good'); }
  renderCourt();
}

function councilPulse(){
  const p = playerChar(); if(!p||!REGIONS[p.region]) return; const reg = REGIONS[p.region];
  for(const role in state.council){
    const cid = state.council[role]; if(!cid) continue; const c = chars[cid]; if(!c || c.dead){ state.council[role]=null; continue; }
    const sk = stat(c, COUNCIL_ROLES[role].skill); const positive = Math.random() < (0.4 + sk*0.03);
    if(role==='chancellor'){
      state.prestige += Math.round(sk * 0.4);
      if(Math.random()<0.08){
        if(positive){
          const rnd=Object.values(chars).find(k=>!k.dead&&k.ruler&&k.id!==p.id);
          if(rnd){ chOp(rnd,p, Math.round(sk*0.8)); popup({title:'재상의 외교', body:`관계도를 보완했습니다.`, opts:[{t:'확인'}]}); }
        } else { state.prestige=Math.max(0,state.prestige-10); popup({title:'외교 마찰', body:`재상이 실언을 고했습니다.`, opts:[{t:'수습'}]}); }
      }
    }
    if(role==='marshal'){ reg.troops = Math.min(reg.cap, reg.troops + Math.round(sk*1.5)); if(Math.random()<0.08 && positive){ popup({title:'상비군 정비', body:`군세가 충원됩니다.`, opts:[{t:'치하', f:()=>{reg.troops+=50;}}]}); } }
    if(role==='steward'){ reg.gold += Math.round(sk * 1.2); if(Math.random()<0.08 && positive){ const b=30+sk*4; popup({title:'조세 수취', body:`추가 세수가 들어왔습니다.`, opts:[{t:'국고 비축', f:()=>{reg.gold+=b; playSynthSFX('gold');}}]}); } }
    if(role==='spymaster'){ state.schemes.forEach(s=>{ if(s.target===p.id) s.defBonus=(s.defBonus||0)+sk*2; }); }
    if(role==='chaplain'){ reg.pop = Math.min(100, (reg.pop||60) + Math.round(sk*0.15)); state.prestige += Math.round(sk * 0.3); }
  }
}

function npcCouncilPulse(){
  for(const id in chars){
    const r = chars[id]; if(r.dead || !r.ruler || id===state.player || !r.region) continue;
    for(const role in COUNCIL_ROLES){ const cid=r.council[role]; if(cid&&(!chars[cid]||chars[cid].dead)) r.council[role]=null; }
    if(r.council.chancellor && Math.random()<0.06){
      const cid = r.council.chancellor; const chan = chars[cid]; const sk = (cid===r.id)?Math.round(stat(r,'dip')*0.6):(chan?stat(chan,'dip'):4);
      const adjCids = COUNTY_ADJ[countyOf(r.region)]||[]; const targets = adjCids.filter(c=>countyHolder(c)&&countyHolder(c).id!==r.id&&!r.claims.find(cl=>cl.rid===c));
      if(targets.length && Math.random() < 0.3+sk*0.04){ const tc = targets[Math.floor(Math.random()*targets.length)]; r.claims.push({rid:tc, type:'unpressed', obtained:state.year}); if(countyHolder(tc)?.id===state.player) log(`${r.name}의 재상이 명분을 조작 위조했습니다.`,'war'); }
    }
    if(r.council.marshal){ const m=chars[r.council.marshal]; const msk=(!m||m.dead||r.council.marshal===r.id)?Math.round(stat(r,'mar')*0.6):stat(m,'mar'); REGIONS[r.region].troops=Math.min(REGIONS[r.region].cap, REGIONS[r.region].troops+Math.round(msk*0.8)); }
    if(r.council.steward){ const s=chars[r.council.steward]; const ssk=(!s||s.dead||r.council.steward===r.id)?Math.round(stat(r,'stew')*0.6):stat(s,'stew'); REGIONS[r.region].gold=Math.min(2000, REGIONS[r.region].gold+Math.round(ssk*0.6)); }
  }
}

/* ---------- 교류 호감도 이벤트 매트릭스 ---------- */
const NPC_ACTIVITIES = [
  { id:'feast', n:'연회', icon:'🍖', cond:(r,reg)=>reg.gold>80, run:(r,reg,adj)=>{ reg.gold -= 60; r.lastActivity = state.year; const guests = adj.filter(t=>t&&t.id!==r.id&&!t.dead); const invited = guests.sort(()=>Math.random()-0.5).slice(0,1); invited.forEach(g=>{ chOp(g,r,10); chOp(r,g,7); }); if(invited.some(g=>g.id===state.player) && Math.random()<0.5){ popup({title:`${r.name}의 연회 초대`, body:`중세 궁정 여흥 서신이 당도했습니다.`, opts:[{t:'참석', f:()=>{ chOp(r,playerChar(),15); addStress(playerChar(),-10,'연회 여흥'); }}, {t:'거절', f:()=>chOp(r,playerChar(),-5)}]}); } } },
  { id:'hunt', n:'사냥', icon:'🦌', cond:(r,reg)=>reg.gold>20, run:(r,reg,adj)=>{ reg.gold -= 15; r.lastActivity = state.year; const partner = adj.find(t=>t&&t.id!==r.id&&!t.dead&&opinion(r,t)>-20); if(partner&&partner.id===state.player){ popup({title:`사냥 동행`, body:`가을 수렵 추적을 권합니다.`, opts:[{t:'동행', f:()=>{ chOp(r,playerChar(),10); addStress(playerChar(),-8,'사냥'); }}, {t:'거절', f:()=>chOp(r,playerChar(),-5)}]}); } } },
  { id:'pilgrimage', n:'순례', icon:'✝', cond:(r)=>Math.random()<0.3, run:(r,reg)=>{ r.lastActivity = state.year; reg.pop = Math.min(100,(reg.pop||60)+6); } },
  { id:'diplomacy', n:'외교 방문', icon:'🤝', cond:(r,reg,adj)=>adj.some(t=>t&&opinion(r,t)>0), run:(r,reg,adj)=>{ r.lastActivity = state.year; const target = adj.find(t=>t&&t.id!==r.id&&opinion(r,t)>0); if(target&&target.id===state.player){ popup({title:'사절 예방', body:`소왕이 직접 도화지를 예방했습니다.`, opts:[{t:'환대', f:()=>{ if(REGIONS[playerChar().region].gold>=20) REGIONS[playerChar().region].gold-=20; playSynthSFX('gold'); chOp(r,playerChar(),15); }}, {t:'문전박대', f:()=>chOp(r,playerChar(),5)}]}); } } }
];

function npcActivityPulse(){
  for(const id in chars){
    const r = chars[id]; if(r.dead || !r.ruler || id===state.player || !r.region) continue; if(r.lastActivity >= state.year-1 || Math.random()>0.15) continue;
    const reg = REGIONS[r.region]; const adj = (ADJ[r.region]||[]).map(x=>ownerOf(x)).filter(Boolean);
    const possible = NPC_ACTIVITIES.filter(a=>a.cond(r,reg,adj)); if(!possible.length) continue; possible[Math.floor(Math.random()*possible.length)].run(r, reg, adj);
  }
}

function aiPulse(){
  npcCouncilPulse(); npcActivityPulse();
  if(state.month===1){ Object.values(chars).filter(c=>!c.dead&&c.ruler&&c.id!==state.player).forEach(buildNpcCouncil); }
  for(const rid in REGIONS){
    const r=ownerOf(rid); if(!r||r.id===state.player||!r.ruler) continue; if(Math.random()>0.25) continue;
    const adjTargets=(ADJ[rid]||[]).map(x=>ownerOf(x)).filter(t=>t&&t.id!==r.id&&!t.dead); if(!adjTargets.length) continue;
    const claimRid = npcGetClaimTarget(r);
    if(claimRid){
      const defChar = ownerOf(claimRid);
      if(defChar && defChar.id!==r.id && !isAllied(r.id,defChar.id) && !truceBetween(r.id,defChar.id) && power(r)>power(defChar)*1.05 && !state.wars.some(w=>w.atk===r.id||w.def===r.id)){
        npcUseClaim(r, claimRid); if(defChar.id===state.player||defChar.id!==state.player) npcGrantRevenge(defChar, claimRid);
        declareWar(r, defChar, claimRid); continue;
      }
    }
  }
  popPulse();
}

function opinionDecayPulse(){
  for(const id in chars){
    const c=chars[id]; if(c.dead) continue;
    for(const tid in c.op){
      const v=c.op[tid]; if(v===0||v===undefined) continue;
      const decay = Math.sign(v) * Math.max(1, Math.abs(Math.round(v*0.08))); c.op[tid] = Math.abs(v-decay) < 1 ? 0 : v - decay;
    }
  }
}

function popPulse(){
  for(const rid in REGIONS){
    const o=ownerOf(rid); if(!o) return; let delta=0; if(o.dyn!=='우어 브리언' && REGIONS[rid].pop>30) delta-=1; if(state.wars.length) delta-=2; if(REGIONS[rid].gold<50) delta-=1; if(!state.wars.length) delta+=0.5;
    REGIONS[rid].pop=Math.max(0,Math.min(100,Math.round((REGIONS[rid].pop||60)+delta)));
    if(REGIONS[rid].pop<=25 && rid===playerChar().region && Math.random()<0.08){ rebellionEvent(rid); }
  }
}
function rebellionEvent(rid){
  const p=playerChar(); popup({title:'민란 폭발', sub:BARONIES[rid].n, body:`농민들이 창과 낫을 들었습니다.`, opts:[
    {t:'무력 진압', f:()=>{ REGIONS[rid].troops=Math.max(100,REGIONS[rid].troops-150); REGIONS[rid].pop+=15; addStress(p,15,'피의 진압'); }},
    {t:'세금 면제', f:()=>{ REGIONS[rid].gold=Math.max(0,REGIONS[rid].gold-80); REGIONS[rid].pop+=25; }}
  ]});
}

function npcGrantRevenge(def, rid){ if(!def.claims.find(c=>c.rid===rid)) def.claims.push({rid, type:'revenge', obtained:state.year}); }
function npcGetClaimTarget(r){ const valid = r.claims.filter(c=>{ const capBid = COUNTIES[c.rid]?.capital || c.rid; return BARONIES[capBid]&&BARONIES[capBid].owner!==r.id; }); if(!valid.length) return null; return valid[Math.floor(Math.random()*valid.length)].rid; }
function npcUseClaim(r, rid){ r.claims = r.claims.filter(c=>c.rid!==rid); }

/* ---------- 영지 노드 외교 처리 인터페이스 ---------- */
function openCounty(cid){
  const holder=countyHolder(cid); if(!holder) return; const war=state.wars.find(w=>w.targetRid===cid);
  if(war&&(war.atk===state.player||war.def===state.player)){
    const cnt=COUNTIES[cid], bids=cnt.baronies, occ=war.occupied||[]; const my=war.atk===state.player?war.score:-war.score;
    const lines=bids.map(bid=>`${BARONIES[bid]?.n||bid}: ${occ.includes(bid)?'⚔ 점령됨':'🛡 방어중'}`).join('\n');
    popup({title:`${cnt.n} 전황`, body:`점수: ${Math.round(my)}%\n\n${lines}`, opts:[{t:'닫기'}]}); return;
  }
  openRegion(COUNTIES[cid]?.capital, cid);
}

function openRegion(rid, cid_hint){
  initAudio();
  const p=playerChar(); const dispName=(cid_hint&&COUNTIES[cid_hint]?.n)||BARONIES[rid]?.n||'영지'; const c=ownerOf(rid); if(!c) return;
  if(c.id===p.id){
    const cid=cid_hint||countyOf(rid); const cnt=COUNTIES[cid]; const totalTroops=cnt?cnt.baronies.reduce((s,b)=>s+(BARONIES[b]?.troops||0),0):BARONIES[rid].troops;
    showModal({title:dispName, sub:'내 영지', html:`<div class="kv"><span>총 가용 상비군</span><span>${totalTroops}</span></div>`, opts:[{t:'닫기'}]}); return;
  }
  const op=opinion(c,p); const atWar=state.wars.some(w=>(w.atk===p.id&&w.def===c.id)||(w.atk===c.id&&w.def===p.id)); const truce=truceBetween(p.id,c.id);
  let html=`<div class="kv"><span>영주 이름</span><span>${c.name}</span></div><div class="kv"><span>호감 지수</span><span>${op}</span></div>`;
  const opts=[];
  if(!atWar){
    opts.push({t:'선물 증정', d:'금 50 소모', f:()=>{ const sb=BARONIES[p.region]; if(!sb||sb.gold<50) return; sb.gold-=50; chOp(c,p,15); playSynthSFX('gold'); }});
    opts.push({t:'동맹 제안', f:()=>{ if(!isAllied(p.id,c.id)){ formAlliance(p.id,c.id); chOp(c,p,25); } }});
    opts.push({t:'혼인 조약 기획', f:()=>tryMarriage(c)});
    if(!truce){ const myClaims=claimsForRegion(c); opts.push({t:myClaims.length>0?'선전포고 집행':'명분 부재', f:()=>{ closePanel('court'); closePanel('dec'); openDeclareWar(c.id); }}); }
  }
  opts.push({t:'닫기'}); showModal({title:dispName, html, opts});
}

function tryMarriage(c){
  const p=playerChar(); const candidates=[{id:p.id, name:p.name, sex:p.sex}];
  Object.values(chars).filter(k=>!k.dead&&(k.father===p.id||k.mother===p.id)&&!k.spouse&&age(k)>=6).forEach(k=>candidates.push(k));
  const opts=candidates.map(kid=>({ t:`${kid.name}`, f:()=>doMarriage(kid, c) })); opts.push({t:'취소'});
  showModal({title:'혼담 매칭', opts});
}
function doMarriage(candidate, c){
  const p=playerChar(); const sp=mk({name:c.dyn+' 가문의 혈통', dyn:c.dyn, sex:candidate.sex==='m'?'f':'m', byear:candidate.byear, bmonth:1, bday:1, traits:randTraits(2), base:randStats(), edu:1, eduFocus:'dip', courtOf:p.region});
  candidate.spouse=sp.id; sp.spouse=candidate.id; chOp(c,p,30); log(`가문 연결 완료.`,'good');
}

/* ---------- 동적 패널 바인딩 렌더러 ---------- */
function renderCourt(){
  const p=playerChar(); if(!p) return; const fam=Object.values(chars).filter(c=>!c.dead&&(c.id===p.id||c.spouse===p.id||c.father===p.id||c.mother===p.id||c.courtOf===p.region));
  let html=`<div style="font-size:.7rem;letter-spacing:.2em;color:var(--gold-dim);margin-bottom:8px;border-bottom:1px solid var(--line)">자문회 배정</div>`;
  for(const role in COUNCIL_ROLES){
    const rinfo=COUNCIL_ROLES[role]; const cid=state.council[role]; const councilor=cid&&chars[cid]&&!chars[cid].dead?chars[cid]:null;
    const assignedIds=Object.values(state.council).filter(Boolean); const candidates=fam.filter(c=>c.id!==p.id && c.courtOf===p.region && age(c)>=16 && !assignedIds.includes(c.id));
    html+=`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px dotted #2c2316"><span>${rinfo.icon} ${rinfo.n}</span><div style="flex:1;text-align:right">`;
    if(councilor){ html+=`<span>${councilor.name}</span> <button class="p-action" style="display:inline;width:auto;margin:0;padding:2px 6px;font-size:.7rem" onclick="appointCouncilor('${role}',null)">해임</button>`; }
    else {
      if(candidates.length){ html+=`<select onchange="if(this.value)appointCouncilor('${role}',this.value)"><option value="">임명...</option>`; candidates.forEach(cand=>{ html+=`<option value="${cand.id}">${cand.name}</option>`; }); html+=`</select>`; }
      else html+=`<span>공석</span>`;
    }
    html+=`</div></div>`;
  }
  document.getElementById('courtContent').innerHTML=html;
}

function renderDec(){
  const p=playerChar(); if(!p||!REGIONS[p.region]) return; _decActs=[]; const items=[];
  function addDec(t,d,enabled,fn){ const i=_decActs.length; _decActs.push(fn); items.push({t,d,enabled,i}); }
  const n=playerRegions().length;

  if(n>=4&&!state.kingdomFormed){ addDec('⚜ 아일랜드 왕국 선포',`금 250 소모`, REGIONS[p.region].gold>=250, ()=>{ REGIONS[p.region].gold-=250; state.kingdomFormed=true; state.prestige+=200; playSynthSFX('gold'); closePanel('dec'); popup({title:'왕관 장착', body:'하이킹 미사 거행.', opts:[{t:'확인'}]}); }); }
  addDec('대연회 주최',`금 60 소모`, REGIONS[p.region].gold>=60, ()=>{ REGIONS[p.region].gold-=60; addStress(p,-20,'연회'); playSynthSFX('gold'); renderDec(); });
  addDec('상비 전력 증강',`금 80 소모`, REGIONS[p.region].gold>=80, ()=>{ REGIONS[p.region].gold-=80; REGIONS[p.region].troops+=200; playSynthSFX('gold'); renderDec(); });

  let html=``; items.forEach(it=>{ html+=`<button class="p-action${it.enabled?'':' off'}" onclick="_decActs[${it.i}]()">${it.t}<span class="pd">${it.d}</span></button>`; });
  document.getElementById('decContent').innerHTML=html;
}

/* ---------- 지도 그래픽 및 프론트 노드 데이터 ---------- */
function renderHeader(){
  document.getElementById('dateTxt').textContent=`${state.year}년 ${state.month}월 ${state.day}일`;
  const reg=REGIONS[playerChar().region]; document.getElementById('goldTxt').textContent=reg?Math.round(reg.gold):0;
  document.getElementById('prestigeTxt').textContent=state.prestige;
  const totalTroops=playerRegions().reduce((s,rid)=>s+(REGIONS[rid].troops||0),0); document.getElementById('troopTxt').textContent=totalTroops.toLocaleString();
}
function renderChar(){
  const c=playerChar(); document.getElementById('cNm').textContent=c.name;
  let chips=''; c.traits.forEach(t=>chips+=`<span class="chip">${TRAITS[t].n}</span>`); document.getElementById('cChips').innerHTML=chips;
  const pct=Math.min(100,c.stress/1.5); document.getElementById('stressFill').style.width=pct+'%'; document.getElementById('stressNum').textContent=`${c.stress} / 150`;
}
function renderMap(){
  const svg=document.getElementById('map'); const p=playerChar(); let h=''; const drawn=new Set();
  for(const cid in COUNTY_ADJ){
    COUNTY_ADJ[cid].forEach(nb=>{
      const k=[cid,nb].sort().join('|'); if(drawn.has(k)) return; drawn.add(k); const A=COUNTIES[cid],B=COUNTIES[nb];
      h+=`<line class="edge" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>`;
    });
  }
  for(const cid in COUNTIES){
    const C=COUNTIES[cid]; const holder=countyHolder(cid); const mine=holder&&holder.id===p.id; const col=mine?'#3d6b4a':'#555';
    h+=`<g class="node" onclick="openCounty('${cid}')"><circle class="body" cx="${C.x}" cy="${C.y}" r="18" fill="${col}" stroke="#c8a24a"/><text x="${C.x}" y="${C.y+3}" style="font-size:9px">${C.n}</text></g>`;
  }
  svg.innerHTML=h;
}
function renderAll(){ renderHeader(); renderChar(); renderMap(); }

/* ---------- 서사 도입 초기 시동 ---------- */
function openDecisions(){ togglePanel('dec'); }
function openCourt(){ togglePanel('court'); }
const CB_TYPES_ENT = CB_TYPES; 
function hasClaim(rid){ return state.claims.find(c=>c.rid===rid); }
function claimsForRegion(def){ const defCids = countiesOf(def.id); return state.claims.filter(c=>defCids.includes(c.rid)); }
function claimName(rid){ return COUNTIES[rid]?.n||BARONIES[rid]?.n||rid; }
function addClaim(rid, type){ if(hasClaim(rid)) return; state.claims.push({rid, type, obtained:state.year}); log(`<b>${claimName(rid)}</b> 명분을 조작 확보했습니다.`, 'dip'); }
function removeClaim(rid){ state.claims = state.claims.filter(c=>c.rid!==rid); }
function grantRevengeClaim(rid){ if(!hasClaim(rid)) addClaim(rid, 'revenge'); }
function claimExpirePulse(){ state.claims = state.claims.filter(c=>{ if(c.type==='unpressed' && state.year - c.obtained > 10) return false; return true; }); }

function openDeclareWar(defId){
  const p = playerChar(); const def = chars[defId]; if(!def || def.dead || !p) return;
  const myClaims = claimsForRegion(def);
  const opts = [];
  myClaims.forEach(cl=>{
    opts.push({ t:`${cl.rid} 영토 개전`, f:()=>{ declareWar(p, def, cl.rid); removeClaim(cl.rid); } });
  });
  opts.push({t:'취소'}); showModal({title:'명분 선택', opts});
}
const EVENTS=[];
function randomEventPulse(){
  const c=playerChar(); if(Math.random()<0.12 && !state.modalOpen){
    popup({title:'연대기적 사건', body:'에이레 전역에 소문이 감돕니다.', opts:[{t:'수용', f:()=>addStress(c,5,'정무 과로')}]});
  }
}

function intro(){ popup({title:'에이레, 1066년', sub:'브리언 보루의 자손', body:'당신은 무르하드 막 돈하드 — 먼스터의 소왕.\n일곱 왕국을 규합하여 고등왕의 영광을 복원하십시오.', opts:[{t:'시작', f:()=>{ initAudio(); askLifestyle(playerChar()); }}]}); }

setSpeed(1);
renderAll();
intro();
