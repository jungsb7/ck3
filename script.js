'use strict';
/* =====================================================================
   에이레 1066 — CK3 스타일 텍스트 시뮬레이션 MVP
   수치 출처: CK3 위키 (수태력 ×4.75, 교육 공식, 스트레스 단계 등)
===================================================================== */

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
    case 'event': // 일반 이벤트 및 UI 패널 오픈 양피지 소리
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

    case 'gold': // 국고 소비, 선물, 결단 등 돈 쓰는 소리
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

    case 'war': // 전쟁 선포 뿔나팔 사운드
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

    case 'death': // 군주 사망 장송 종소리
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

/* ---------- 지역 데이터 ---------- */
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

/* ══════════════════════════════════════════════════
   건물 시스템 (Phase 4)
   ══════════════════════════════════════════════════ */
const BUILDING_TYPES = {
  barracks: {
    n:'병영', icon:'⚔', cost:80, buildMonths:6,
    desc:'병력 상한 +150, 병력 회복 +3/월',
    onComplete: (b)=>{ b.cap+=150; b.troops=Math.min(b.cap,b.troops+50); },
    monthly: (b)=>{ b.troops=Math.min(b.cap,b.troops+3); }
  },
  market: {
    n:'시장', icon:'💰', cost:60, buildMonths:5,
    desc:'세금 수입 +8/월',
    monthly: (b,seatB)=>{ if(seatB) seatB.gold=Math.min(3500,seatB.gold+8); }
  },
  chapel: {
    n:'교회당', icon:'✝', cost:50, buildMonths:4,
    desc:'민심 +2/월, 사제 명분 위조 확률 +',
    monthly: (b)=>{ b.pop=Math.min(100,(b.pop||60)+2); }
  },
  walls: {
    n:'성벽', icon:'🏰', cost:100, buildMonths:8,
    desc:'공성 저항 +1턴, 방어 전투력 +10%',
    onComplete: ()=>{}, monthly: ()=>{}
  },
  farm: {
    n:'농장', icon:'🌾', cost:45, buildMonths:4,
    desc:'민심 +1/월, 세금 수입 +4/월',
    monthly: (b,seatB)=>{ b.pop=Math.min(100,(b.pop||60)+1); if(seatB) seatB.gold=Math.min(3500,seatB.gold+4); }
  },
  mill: {
    n:'제분소', icon:'⚙', cost:55, buildMonths:5,
    desc:'병력 회복 +2/월, 세금 수입 +5/월',
    monthly: (b,seatB)=>{ b.troops=Math.min(b.cap,b.troops+2); if(seatB) seatB.gold=Math.min(3500,seatB.gold+5); }
  },
};

/* 남작령에 건물 필드 추가 */
(()=>{
  for(const bid in BARONIES){
    const b=BARONIES[bid];
    if(!b.buildings) b.buildings=[];   
    if(!b.building_queue) b.building_queue=null; 
    if(!b.slots) b.slots=2;           
  }
})();

function buildingPulse(){
  const p=playerChar(); if(!p) return;
  const seatB=BARONIES[p.region];
  for(const bid in BARONIES){
    const b=BARONIES[bid];
    if(b.building_queue){
      b.building_queue.monthsLeft--;
      if(b.building_queue.monthsLeft<=0){
        const type=b.building_queue.type;
        b.buildings.push(type);
        if(BUILDING_TYPES[type].onComplete) BUILDING_TYPES[type].onComplete(b);
        if(b.owner===p.id) log(`<b>${b.n}</b>에 <b>${BUILDING_TYPES[type].n}</b>이(가) 완공되었습니다.`,'good');
        b.building_queue=null;
      }
    }
    if(b.buildings.length>0){
      b.buildings.forEach(type=>{
        if(BUILDING_TYPES[type].monthly) BUILDING_TYPES[type].monthly(b, b.owner===p.id?seatB:null);
      });
    }
  }
}

function startBuilding(bid, type){
  const b=BARONIES[bid]; const p=playerChar(); if(!b||!p) return;
  const seatB=BARONIES[p.region]; if(!seatB) return;
  const bt=BUILDING_TYPES[type]; if(!bt) return;
  if(seatB.gold<bt.cost){ log('금이 부족합니다.'); return; }
  seatB.gold-=bt.cost;
  playSynthSFX('gold'); // 조세 및 자금 소비 효과음 트리거
  b.building_queue={type:type, monthsLeft:bt.buildMonths};
  log(`<b>${b.n}</b>에 <b>${bt.n}</b> 건설을 위임했습니다. (${bt.buildMonths}개월 소요)`,'good');
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

/* ---------- 캐릭터 데이터 핸들러 ---------- */
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
    liege:null, 
    op:{}, 
    council:{chancellor:null,marshal:null,steward:null,spymaster:null,chaplain:null},
    claims:[], 
    lastActivity:0, 
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

/* ---------- 초기 세팅 역사 군주 ---------- */
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

function seizeBaronies(charId,bids){ bids.forEach(bid=>{ if(BARONIES[bid]) BARONIES[bid].owner=charId; }); }
function seizeCounty(charId,cid){ if(COUNTIES[cid]) seizeBaronies(charId,COUNTIES[cid].baronies); }
function seizeDuchy(charId,did){ if(DUCHIES[did]) DUCHIES[did].counties.forEach(cid=>seizeCounty(charId,cid)); }
function rulerOf(bid){ const c=chars[BARONIES[bid]?.owner]; return (c&&!c.dead)?c:null; }
function regionsOf(cid){ const out=[]; for(const bid in BARONIES) if(BARONIES[bid].owner===cid) out.push(bid); return out; }
function countyOf(bid){ return BARONIES[bid]?.county||null; }
function duchyOf(bid){ return COUNTIES[BARONIES[bid]?.county]?.duchy||null; }
function countyHolder(cid){ const cap=COUNTIES[cid]?.capital; return cap?rulerOf(cap):null; }
function duchyHolder(did){ const cs=DUCHIES[did]?.counties||[]; const cap=cs.length?COUNTIES[cs[0]]?.capital:null; return cap?rulerOf(cap):null; }
function countiesOf(charId){ const cs=new Set(); for(const bid of regionsOf(charId)) cs.add(countyOf(bid)); return [...cs].filter(Boolean); }
function duchiesOf(charId){ const ds=new Set(); for(const bid of regionsOf(charId)) ds.add(duchyOf(bid)); return [...ds].filter(Boolean); }
function seatCounty(c){ return countyOf(c.region)||null; }
function seatDuchy(c){ return duchyOf(c.region)||null; }
function ownerOf(rid){ return rulerOf(rid); }
function playerChar(){ return chars[state.player]; }

/* ---------- 상태 도메인 ---------- */
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

/* ---------- 유틸 로그 ---------- */
function log(msg, cls){
  const p=document.createElement('p'); if(cls)p.className=cls;
  p.innerHTML=`<span class="d">${state.year}년 ${state.month}월 ${state.day}일</span>${msg}`;
  const el=document.getElementById('log'); el.appendChild(p); el.scrollTop=el.scrollHeight;
  while(el.children.length>140) el.removeChild(el.firstChild);
}

/* ---------- 팝업 시스템 (자동 일시정지) ---------- */
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
    h+=`<button onclick="modalPick(${i})">${o.t}${o.d?`<small>${o.d}</small>`:''}</button>`;
  });
  h+=`</div>`;
  box.innerHTML=h;
  box._opts=p.opts||[{}];
  document.getElementById('shade').classList.add('show');
}
function modalPick(i){
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

/* ---------- 스트레스 ---------- */
function addStress(c,amt,why){
  if(c.dead) return;
  let g=amt;
  for(const t of c.traits){ if(TRAITS[t]&&TRAITS[t].stressGainMul&&amt>0) g*=TRAITS[t].stressGainMul; }
  const before=stressLvl(c);
  c.stress=Math.max(0,Math.min(150,c.stress+Math.round(g)));
  const after=stressLvl(c);
  if(c.id===state.player&&amt!==0&&why) log(`스트레스 ${amt>0?'+':''}${Math.round(g)} — ${why}`);
  if(after>before&&after<3) mentalBreak(c,after);
  if(c.stress(=150)) stressDeath(c);
}
function stressLvl(c){ return c.stress>=150?3 : c.stress>=100?2 : c.stress>=50?1 : 0; }
function mentalBreak(c,lvl){
  if(state.year - c.lastBreakY < 5) return;
  c.lastBreakY=state.year;
  if(c.id!==state.player){ c.stress=Math.max(0,c.stress-40); return; }
  popup({title:'정신적 한계', sub:`스트레스 ${lvl}단계 — 정신 붕괴`,
    body:`통치의 무게가 ${c.name}의 어깨를 짓누릅니다. 밤마다 잠을 이루지 못하고, 신하들 앞에서 손이 떨립니다.\n무언가 의지할 것이 필요합니다.`,
    opts:[
      {t:'대처법을 찾는다', d:'스트레스 -40, 이후 스트레스 해소 +20%', f:()=>{c.stress=Math.max(0,c.stress-40); c.copings++; log('대처법을 찾아 마음을 다스립니다.','fam');}},
      {t:'이를 악물고 버틴다', d:'스트레스 +15 — 위험한 선택', f:()=>{addStress(c,15,'억눌린 고통');}},
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

/* ---------- 사망 / 상속 공정 ---------- */
function kill(c, cause){
  if(c.dead) return;
  c.dead=true;
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
      
      playSynthSFX('death'); // 플레이어 군주 사망 종소리
      
      log(`<b>${mainH.name}</b>이(가) ${seatName}의 칭호를 계승했습니다.`,'fam');
      popup({title:'왕은 죽었다', sub:'계승',
        body:`${c.name}의 시대가 끝났습니다. (${cause})\n이제 <b>${mainH.name}</b>(계승자)이(가) 통치를 승계합니다.${splitMsg}`,
        opts:[{t:'왕은 만세하리라'}]});
    } else {
      gameOver(`${c.name}이(가) 후계자 없이 사망했습니다. 우어 브리언 가문의 직계가 끊겼습니다.`);
    }
  } else {
    log(`<b>${c.name}</b> 사망 (${cause}).`,'war');
  }
}

/* ══════════════════════════════════════════════════
   상속 구조 연산 (Phase 5)
   ══════════════════════════════════════════════════ */
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
  const ownedCids=directCountiesOf(c.id); if(!ownedCids.length) return null;
  const seatCid=countyOf(c.region)||ownedCids[0];
  const heirs=validHeirs(c); if(!heirs.length) return null;
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
      if(!dist[h.id]) dist[h.id]=[]; dist[h.id].push(cid);
    });
    return dist;
  }
  if(law==='elective'){
    const vassals=vassalsOf(c.id); let best=mainHeir, bestVotes=0;
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
  const owned=regionsOf(c.id); if(!owned.length) return cleanupAfterDeath(c);
  const seat=owned.includes(c.region)?c.region:owned[0];
  const seatName=COUNTIES[countyOf(seat)]?.n||BARONIES[seat]?.n||'?';
  const dist=distributeSuccession(c);
  if(dist){
    for(const [hid,cids] of Object.entries(dist)){
      let h=chars[hid]; if(!h) continue;
      h.ruler=true; h.liege=c.liege; h.courtOf=null;
      cids.forEach(cid=>seizeCounty(hid,cid));
      if(!h.region||!regionsOf(hid).includes(h.region)) h.region=COUNTIES[cids[0]]?.capital||seat;
      if(hid===Object.keys(dist)[0]){ log(`${seatName}의 왕좌가 <b>${h.name}</b>에게 넘어갔습니다.`,'dip'); }
    }
  } else {
    const nu=mk({name:randName(), dyn:c.dyn, byear:state.year-30-Math.floor(Math.random()*15), bmonth:1+Math.floor(Math.random()*12), bday:1+Math.floor(Math.random()*28), traits:randTraits(3), base:randStats(), edu:1+Math.floor(Math.random()*3), eduFocus:randKey(SKILLS), region:seat, ruler:true, liege:c.liege});
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

/* ══════════════════════════════════════════════════
   외부 월드 서사 타임라인 Pulse (Phase 5)
   ══════════════════════════════════════════════════ */
const WORLD_EVENTS = [
  { id:'norman_shadow', triggerYear:1066, maxYear:1075, chance:0.6, fired:false,
    run:(p)=>popup({title:'노르만의 그림자', sub:'세계 정세', body:`노르만 공작 윌리엄이 해럴드 왕을 헤이스팅스에서 격파하고 잉글랜드 국왕에 등극했습니다.`, opts:[
      {t:'경계를 강화한다', d:'병력 +100, 스트레스 +8', f:()=>{BARONIES[p.region].troops+=100; addStress(p,8,'외세의 위협');}},
      {t:'사절을 보낸다', d:'위신 +10', f:()=>{state.prestige+=10; log('노르만 왕국에 우호 사절을 조율했습니다.','dip');}}
    ]})},
  { id:'viking_dublin', triggerYear:1068, maxYear:1090, chance:0.5, fired:false,
    run:(p)=>popup({title:'더블린 바이킹 복구', sub:'연안 약탈', body:`더블린 노르드 잔존 선단들이 연안 약탈을 재개했습니다.`, opts:[
      {t:'해안 경비 투입', d:'금 -50', f:()=>{ BARONIES[p.region].gold-=50; playSynthSFX('gold'); log('해안 순찰대를 투입했습니다.','war'); }},
      {t:'방치하고 타협', d:'금 +60, 위험동조', f:()=>{ if(Math.random()<0.7){ BARONIES[p.region].gold+=60; playSynthSFX('gold'); } else BARONIES[p.region].troops=Math.max(50, BARONIES[p.region].troops-80); }}
    ]})},
  { id:'papal_legate', triggerYear:1070, maxYear:1090, chance:0.5, fired:false,
    run:(p)=>popup({title:'로마 교황 특사 방명', sub:'신앙 개혁', body:`특사가 그레고리우스 개혁 칙령 교지를 들고 도착했습니다.`, opts:[
      {t:'수용 선포', d:'위신 +30, 민심 상흥', f:()=>{ state.prestige+=30; }},
      {t:'거절', f:()=>{ state.prestige=Math.max(0,state.prestige-10); }}
    ]})},
];

function worldEventPulse(){
  if(state.month !== 1) return;
  const p=playerChar(); if(!p||p.dead) return;
  for(const ev of WORLD_EVENTS){
    if(ev.fired && !ev.repeatable) continue;
    if(state.year < ev.triggerYear || state.year > ev.maxYear) continue;
    if(Math.random() < ev.chance){ ev.fired=true; ev.run(p); break; }
  }
}

/* ─── 사이드 패널 양방향 제어 스위치 ─── */
const PANELS={
  log:  {wrap:'logWrap',   render:null},
  court:{wrap:'courtWrap', render:'renderCourt'},
  dec:  {wrap:'decWrap',   render:'renderDec'},
};
const PANEL_TAB_IDS={log:'logTab',court:'courtTab',dec:'decTab'};

function _showAllTabs(){ Object.values(PANEL_TAB_IDS).forEach(tid=>{ const t=document.getElementById(tid); if(t) t.style.display=''; }); }
function _hideOtherTabs(activeId){
  Object.entries(PANEL_TAB_IDS).forEach(([pid,tid])=>{ const t=document.getElementById(tid); if(t) t.style.display = pid===activeId ? '' : 'none'; });
  Object.keys(PANELS).forEach(k=>{ const w=document.getElementById(PANELS[k].wrap); if(w) w.style.zIndex = k===activeId ? '37' : '35'; });
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
function closePanel(id){ const info=PANELS[id]; if(!info) return; document.getElementById(info.wrap).classList.remove('open'); if(id!=='log') resume(); _showAllTabs(); Object.keys(PANELS).forEach(k=>{ const w=document.getElementById(PANELS[k].wrap); if(w) w.style.zIndex=''; }); }
function toggleLog(){ togglePanel('log'); }

function setSpeed(s){ state.speed=s; document.querySelectorAll('.spd').forEach(b=>b.classList.toggle('on',+b.dataset.s===s)); if(!state.paused) resume(); }
function updPauseBtn(){ const b=document.getElementById('pauseBtn'); b.textContent=state.paused?'▶ 진행':'⏸ 정지'; b.classList.toggle('paused',state.paused); }
function tick(){
  if(state.paused||state.over) return; state.day++; const dim=MDAYS[state.month-1];
  if(state.day>dim){ state.day=1; state.month++; if(state.month>12){ state.month=1; state.year++; } monthlyPulse(); }
  dailyBirthdays(); renderHeader(); renderChar(); if(state.popupQ.length) flushPopups();
}

/* ---------- 생일 이벤트 및 코치 공식 ---------- */
function dailyBirthdays(){ for(const id in chars){ const c=chars[id]; if(!c.dead && c.bmonth===state.month && c.bday===state.day){ onBirthday(c,age(c)); } } }
function onBirthday(c,a){
  if(a===3&&!c.childTrait){ c.childTrait=randKey(CHILD_TRAITS); if(isPlayerFamily(c)) log(`<b>${c.name}</b> 기질 발현: <b>${CHILD_TRAITS[c.childTrait].n}</b>`,'fam'); }
  if(a===6&&!c.eduFocus){ if(isPlayerFamily(c)) askEducation(c); else c.eduFocus=CHILD_TRAITS[c.childTrait||'curious'].foci[0]; }
  if(a>=6&&a<16&&c.eduFocus){ if(eduRoll(c)) c.eduScore+=2; }
  if((a===9||a===11||a===13)&&c.traits.length<3){ if(isPlayerFamily(c)) askPersonality(c,a); else npcGainPersonality(c); }
  if(a===16&&c.edu===null) comeOfAge(c);
  if(a>=60 && Math.random() < (a-58)*0.035) kill(c,'노환');
}

function eduRoll(c){ let S=0,F=0; const g=guardianOf(c); if(c.childTrait && CHILD_TRAITS[c.childTrait].foci.includes(c.eduFocus)) S+=20; else S-=20; if(g){ S += 0.4*stat(g,c.eduFocus) + 0.2*stat(g,'learn'); } else F+=20; return Math.random() < (60+S)/(100+S+F); }
function guardianOf(c){ return (c.guardian&&chars[c.guardian]&&!chars[c.guardian].dead)?chars[c.guardian]:((c.father&&chars[c.father]&&!chars[c.father].dead)?chars[c.father]:null); }
function comeOfAge(c){ const sc=c.eduScore; c.edu = sc>=18?3 : sc>=13?2 : sc>=8?1 : 0; if(isPlayerFamily(c)||c.ruler){ log(`<b>${c.name}</b> 성인 진입: <b>${EDU_NAMES[c.eduFocus||'dip'][c.edu]}</b>`,'fam'); } if(!c.eduFocus) c.eduFocus='dip'; if(isPlayerFamily(c)){ while(c.traits.length<2) npcGainPersonality(c); if(c.traits.length<3) askPersonality(c,16); } else { while(c.traits.length<3) npcGainPersonality(c); } if(c.id===state.player) askLifestyle(c); else c.lifestyle=randKey(SKILLS); }

function askEducation(c){
  const ct=CHILD_TRAITS[c.childTrait||'curious']; const courtAdults=Object.values(chars).filter(k=>!k.dead&&age(k)>=16&&(k.courtOf===playerChar().region||k.id===state.player));
  const opts=Object.entries(SKILLS).map(([k,n])=>({ t:`${n} 교육`, f:()=>{ c.eduFocus=k; pickGuardian(c,courtAdults); } }));
  popup({title:`교육 위임`, body:`초기 기질: ${ct.n}`, opts});
}
function pickGuardian(c,adults){
  const opts=adults.slice(0,5).map(g=>({ t:`${g.name}`, f:()=>{ c.guardian=g.id; log(`후견인 임명완료`,'fam'); } }));
  popup({title:`후견 위임`, opts});
}
function askPersonality(c,a){
  const g=guardianOf(c); const cand=new Set(); if(g) g.traits.forEach(t=>{ if(canHaveTrait(c,t)) cand.add(t); }); while(cand.size<3){ const t=PERSONALITY_KEYS[Math.floor(Math.random()*PERSONALITY_KEYS.length)]; if(canHaveTrait(c,t)) cand.add(t); }
  const opts=[...cand].slice(0,3).map(t=>({ t:TRAITS[t].n, f:()=>{ c.traits.push(t); } }));
  popup({title:`가문원 성격 형성`, opts});
}
function npcGainPersonality(c){ const g=guardianOf(c); let t=null; if(g&&Math.random()<0.5){ const gs=g.traits.filter(x=>canHaveTrait(c,x)); if(gs.length) t=gs[Math.floor(Math.random()*gs.length)]; } if(!t){ let tries=0; do{ t=PERSONALITY_KEYS[Math.floor(Math.random()*PERSONALITY_KEYS.length)]; tries++; }while(!canHaveTrait(c,t)&&tries<20); } if(t&&canHaveTrait(c,t)) c.traits.push(t); }
function canHaveTrait(c,t){ return !c.traits.includes(t)&&!c.traits.includes(TRAITS[t].opp)&&c.traits.length<3; }
function askLifestyle(c){ const opts=Object.entries(SKILLS).map(([k,n])=>({ t:`${n}의 길`, f:()=>{ c.lifestyle=k; } })); popup({title:'인생관 선택', opts}); }

function monthlyPulse(){
  for(const id in chars){ const c=chars[id]; if(c.dead) continue; if(c.lifestyle){ let xp=10; if(c.edu!==null&&c.eduFocus===c.lifestyle) xp*=1+(EDU_BONUS[c.edu]*0.1); c.lifeXP+=Math.round(xp); } if(c.pregnant>0){ c.pregnant++; if(c.pregnant>=10) giveBirth(c); } }
  buildingPulse(); fertilityPulse(); naturalDeathPulse(); councilPulse(); schemePulse(); warPulse(); aiPulse(); randomEventPulse(); goldPulse();
  for(const role in COUNCIL_ROLES){ const cid=state.council[role]; if(cid&&(!chars[cid]||chars[cid].dead)){ state.council[role]=null; } }
  if(state.month===1){ claimExpirePulse(); worldEventPulse(); opinionDecayPulse(); }
  if(document.getElementById('courtWrap').classList.contains('open')) renderCourt();
  if(document.getElementById('decWrap').classList.contains('open')) renderDec();
  renderMap();
}

function openBuildMenu(bid){
  initAudio();
  const b=BARONIES[bid]; if(!b) return; const existing=b.buildings||[]; const seatGold=BARONIES[playerChar().region]?.gold||0;
  const opts=Object.entries(BUILDING_TYPES).filter(([type])=>!existing.includes(type)&&(b.buildings||[]).length+(b.building_queue?1:0)<b.slots).map(([type,bt])=>({ t:`${bt.icon} ${bt.n}`, d:`금 ${bt.cost} · ${bt.desc}`, f: seatGold>=bt.cost ? ()=>{ startBuilding(bid,type); renderCourt(); } : ()=>{} }));
  opts.push({t:'취소'}); showModal({title:`건물 위임 구축`, opts});
}

function openCounty(cid){ initAudio(); const holder=countyHolder(cid); if(!holder) return; const war=state.wars.find(w=>w.targetRid===cid); if(war&&(war.atk===state.player||war.def===state.player)){ const cnt=COUNTIES[cid], bids=cnt.baronies, occ=war.occupied||[]; const my=war.atk===state.player?war.score:-war.score; const siegeLines=bids.map(bid=>`${BARONIES[bid]?.n||bid}: ${occ.includes(bid)?'⚔ 점령':'🛡 저항'}`).join('\n'); popup({title:`공성전 분석`, body:`전황 스코어: ${my}%\n\n${siegeLines}`, opts:[{t:'닫기'}]}); return; } openRegion(COUNTIES[cid]?.capital, cid); }
function openRegion(rid, cid_hint){
  initAudio();
  const p=playerChar(); if(!p) return; const dispName=(cid_hint&&COUNTIES[cid_hint]?.n)||BARONIES[rid]?.n||'영지'; const c=ownerOf(rid); if(!c) return;
  if(c.id===p.id){ const cid=cid_hint||countyOf(rid); const cnt=COUNTIES[cid]; const totalTroops=cnt?cnt.baronies.reduce((s,b)=>s+(BARONIES[b]?.troops||0),0):BARONIES[rid].troops; showModal({title:dispName, body:`총 동원력: ${totalTroops} · 금고 수지: ${Math.round(BARONIES[rid].gold)}`, opts:[{t:'닫기'}]}); return; }
  const op=opinion(c,p); const atWar=state.wars.some(w=>(w.atk===p.id&&w.def===c.id)||(w.atk===c.id&&w.def===p.id)); const truce=truceBetween(p.id,c.id);
  let html=`<div class="kv"><span>영주명</span><span>${c.name}</span></div><div class="kv"><span>호감 지수</span><span>${op}</span></div>`;
  const opts=[];
  if(!atWar){
    opts.push({t:'선물 증정', d:'금 50 소모', f:()=>{ const seatB=BARONIES[p.region]; if(!seatB||seatB.gold<50) return; seatB.gold-=50; chOp(c,p,15); playSynthSFX('gold'); }});
    opts.push({t:'동맹 조약 제안', f:()=>{ if(Math.random()*100<allianceChance(c,p)){ formAlliance(p.id,c.id); chOp(c,p,25); } }});
    opts.push({t:'혼인 연대 추진', f:()=>tryMarriage(c)});
    if(!truce && !isAllied(p.id,c.id)){ opts.push({t:'선전포고 집행', f:()=>{ closePanel('court'); closePanel('dec'); openDeclareWar(c.id); }}); }
  }
  opts.push({t:'닫기'}); showModal({title:dispName, html, opts});
}

function openCourt(){ togglePanel('court'); }
function renderCourt(){
  const p=playerChar(); if(!p) return; const fam=Object.values(chars).filter(c=>!c.dead&&(c.id===p.id||c.spouse===p.id||c.father===p.id||c.mother===p.id||c.courtOf===p.region));
  let html=`<div style="font-size:.7rem;color:var(--gold-dim);margin-bottom:6px">자문 보직 관리</div>`;
  for(const role in COUNCIL_ROLES){
    const rinfo=COUNCIL_ROLES[role]; const cid=state.council[role]; const councilor=cid&&chars[cid]&&!chars[cid].dead?chars[cid]:null;
    const assignedIds=Object.values(state.council).filter(Boolean); const candidates=fam.filter(c=>c.id!===p.id&&c.courtOf===p.region&&age(c)>=16&&!assignedIds.includes(c.id));
    html+=`<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:.8rem"><span>${rinfo.icon} ${rinfo.n}</span>`;
    if(councilor){ html+=`<span>${councilor.name} <button onclick="appointCouncilor('${role}',null)">해임</button></span>`; }
    else if(candidates.length){ html+=`<select onchange="if(this.value)appointCouncilor('${role}',this.value)"><option value="">배정...</option>`; candidates.forEach(c=>{ html+=`<option value="${c.id}">${c.name}</option>`; }); html+=`</select>`; }
    else html+=`<span>공석</span>`; html+=`</div>`;
  }
  html+=`<div style="font-size:.7rem;color:var(--gold-dim);margin-top:12px">내 영지 인프라 영토 구축</div>`;
  regionsOf(p.id).forEach(bid=>{ const b=BARONIES[bid]; const bldTxt=(b.buildings||[]).map(t=>BUILDING_TYPES[t]?.icon).join(' '); html+=`<div style="font-size:.76rem;display:flex;justify-content:space-between;padding:3px 0"><span>${b.n} [${bldTxt||'공터'}]</span>${!b.building_queue?`<button onclick="openBuildMenu('${bid}')">건설</button>`:''}</div>`; });
  document.getElementById('courtContent').innerHTML=html;
}

function openDecisions(){ togglePanel('dec'); }
function renderDec(){
  const p=playerChar(); if(!p) return; const n=playerRegions().length; _decActs=[]; const items=[];
  function addDec(t,d,enabled,fn){ const i=_decActs.length; _decActs.push(fn); items.push({t,d,enabled,i}); }
  if(n>=4&&!state.kingdomFormed){ addDec('⚜ 아일랜드 국왕관 선포',`금 250 필요`, BARONIES[p.region]?.gold>=250, ()=>{ BARONIES[p.region].gold-=250; state.kingdomFormed=true; playSynthSFX('gold'); closePanel('dec'); popup({title:'국왕 대관식', body:'에이레 연대기의 서막이 열립니다.', opts:[{t:'국왕 만세'}]}); }); }
  addDec('성 연회 연찬 주최',`금 60 필요`, BARONIES[p.region]?.gold>=60, ()=>{ BARONIES[p.region].gold-=60; addStress(p,-20,'연회'); playSynthSFX('gold'); renderDec(); });
  addDec('민단 군사 소집 분개',`금 80 필요`, BARONIES[p.region]?.gold>=80, ()=>{ BARONIES[p.region].gold-=80; BARONIES[p.region].troops+=200; playSynthSFX('gold'); renderDec(); });
  if(state.successionLaw==='partition'){ addDec('장자계승권 개혁 선포',`위신 500 필요`, state.prestige>=500, ()=>{ state.prestige-=500; state.successionLaw='primogeniture'; renderDec(); }); }
  let html=``; items.forEach(it=>{ html+=`<button class="p-action${it.enabled?'':' off'}" onclick="_decActs[${it.i}]()">${it.t}<span class="pd">${it.d}</span></button>`; });
  document.getElementById('decContent').innerHTML=html;
}

function openCourt(){ togglePanel('court'); }
function openDecisions(){ togglePanel('dec'); }

function renderHeader(){ document.getElementById('dateTxt').textContent=`${state.year}년 ${state.month}월 ${state.day}일`; const reg=REGIONS[playerChar().region]; document.getElementById('goldTxt').textContent=reg?Math.round(reg.gold):0; document.getElementById('prestigeTxt').textContent=state.prestige; const totalTroops=playerRegions().reduce((s,rid)=>s+(REGIONS[rid].troops||0),0); document.getElementById('troopTxt').textContent=totalTroops.toLocaleString(); }
function renderChar(){ const c=playerChar(); document.getElementById('portrait').textContent=c.name[0]; document.getElementById('cNm').textContent=c.name; const pct=Math.min(100,c.stress/1.5); document.getElementById('stressFill').style.width=pct+'%'; document.getElementById('stressNum').textContent=`${c.stress} / 150`; document.getElementById('stats').innerHTML=Object.entries(SKILLS).map(([k,n])=>`<span>${n} <b>${stat(c,k)}</b></span>`).join(' '); }
function renderMap(){
  const svg=document.getElementById('map'); const p=playerChar(); let h=''; const drawn=new Set();
  for(const cid in COUNTY_ADJ){ COUNTY_ADJ[cid].forEach(nb=>{ const k=[cid,nb].sort().join('|'); if(drawn.has(k)) return; drawn.add(k); const A=COUNTIES[cid],B=COUNTIES[nb]; h+=`<line class="edge" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>`; }); }
  for(const cid in COUNTIES){ const C=COUNTIES[cid]; const holder=countyHolder(cid); const mine=holder&&holder.id===p.id; const isVassalOf=holder&&holder.liege===p.id; const col=mine?'#3d6b4a':isVassalOf?'#4a7a55':(DUCHIES[C.duchy]?.color||'#555'); const rad=mine?22:18; const underSiege=state.wars.some(w=>w.targetRid===cid&&w.occupied?.length>0); h+=`<g class="node" onclick="openCounty('${cid}')"><circle class="body" cx="${C.x}" cy="${C.y}" r="${rad}" fill="${col}" stroke="${underSiege?'#c83030':'#6a5836'}"/><text x="${C.x}" y="${C.y+3}" style="font-size:9px">${C.n}</text></g>`; }
  svg.innerHTML=h;
}
function renderAll(){ renderHeader(); renderChar(); renderMap(); }

function intro(){ popup({title:'에이레, 1066년', body:`통일을 향한 먼스터의 서사가 시동됩니다.`, opts:[{t:'연대기 개막', f:()=>{ initAudio(); askLifestyle(playerChar()); }}]}); }
setSpeed(1); renderAll(); intro();
