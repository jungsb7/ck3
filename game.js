'use strict';
/* =====================================================================
   에이레 1066 — CK3 스타일 텍스트 시뮬레이션 MVP
   수치 출처: CK3 위키 (수태력 ×4.75, 교육 공식, 스트레스 단계 등)
===================================================================== */

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
  /* ── 먼스터 (d_munster) ────────────────────────── */
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

  /* ── 레인스터 (d_leinster) ────────────────────── */
  b_wexford:   {n:'웩스퍼드', county:'c_leinster',troops:290, gold: 80, pop:58, cap:290, owner:null},
  b_enniscorthy:{n:'에니스코시',county:'c_leinster',troops:200, gold:50, pop:55, cap:200, owner:null},
  b_ferns:     {n:'퍼언스',   county:'c_leinster',troops:180, gold: 45, pop:55, cap:180, owner:null},
  b_carlow:    {n:'칼로',     county:'c_leinster',troops:200, gold: 55, pop:57, cap:200, owner:null},
  b_gowran:    {n:'고란',     county:'c_ossory',  troops:220, gold: 60, pop:57, cap:220, owner:null},
  b_kilkenny:  {n:'킬케니',   county:'c_ossory',  troops:240, gold: 65, pop:58, cap:240, owner:null},
  b_athy:      {n:'에이시',   county:'c_ossory',  troops:180, gold: 45, pop:55, cap:180, owner:null},
  b_carrick:   {n:'캐릭',     county:'c_ossory',  troops:170, gold: 42, pop:54, cap:170, owner:null},

  /* ── 더블린 (d_dublin) ─────────────────────────── */
  b_dublin:    {n:'더블린',   county:'c_dublin',  troops:380, gold:130, pop:65, cap:380, owner:null},
  b_wicklow:   {n:'위클로',   county:'c_dublin',  troops:200, gold: 55, pop:58, cap:200, owner:null},
  b_kildare:   {n:'킬데어',   county:'c_dublin',  troops:220, gold: 60, pop:58, cap:220, owner:null},

  /* ── 미드 (d_meath) ────────────────────────────── */
  b_trim:      {n:'트림',     county:'c_meath',   troops:260, gold: 70, pop:60, cap:260, owner:null},
  b_drogheda:  {n:'드로이다', county:'c_meath',   troops:220, gold: 65, pop:60, cap:220, owner:null},
  b_kells:     {n:'켈스',     county:'c_meath',   troops:190, gold: 50, pop:57, cap:190, owner:null},
  b_athlone:   {n:'애슬론',   county:'c_athlone', troops:250, gold: 65, pop:58, cap:250, owner:null},
  b_birr:      {n:'버',       county:'c_athlone', troops:190, gold: 48, pop:55, cap:190, owner:null},
  b_uisneach:  {n:'위슈낙',   county:'c_athlone', troops:160, gold: 40, pop:52, cap:160, owner:null},

  /* ── 코노트 (d_connacht) ───────────────────────── */
  b_galway:    {n:'골웨이',   county:'c_connacht',troops:310, gold: 80, pop:62, cap:310, owner:null},
  b_athenry:   {n:'애슨리',   county:'c_connacht',troops:210, gold: 55, pop:58, cap:210, owner:null},
  b_tuam:      {n:'투암',     county:'c_connacht',troops:200, gold: 52, pop:57, cap:200, owner:null},
  b_da_chainoc:{n:'다체이녹', county:'c_connacht',troops:180, gold: 45, pop:55, cap:180, owner:null},
  b_cruachu:   {n:'크루하후', county:'c_mayo',    troops:200, gold: 50, pop:55, cap:200, owner:null},
  b_castlebar: {n:'캐슬바',   county:'c_mayo',    troops:210, gold: 52, pop:56, cap:210, owner:null},
  b_sligo:     {n:'슬라이고', county:'c_mayo',    troops:230, gold: 58, pop:57, cap:230, owner:null},
  b_killala:   {n:'킬랄라',   county:'c_mayo',    troops:175, gold: 42, pop:53, cap:175, owner:null},

  /* ── 브레프네 (d_breifne) ──────────────────────── */
  b_dromahair: {n:'드로마헤르',county:'c_breifne', troops:230, gold: 58, pop:57, cap:230, owner:null},
  b_belcoo:    {n:'벨쿠',     county:'c_breifne', troops:180, gold: 42, pop:53, cap:180, owner:null},
  b_longford:  {n:'롱퍼드',   county:'c_breifne', troops:190, gold: 48, pop:55, cap:190, owner:null},
  b_cavan:     {n:'캐번',     county:'c_breifne', troops:200, gold: 50, pop:56, cap:200, owner:null},
  b_adragh:    {n:'아드라그', county:'c_breifne', troops:160, gold: 38, pop:52, cap:160, owner:null},

  /* ── 얼스터 (d_ulster) ─────────────────────────── */
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

/* ===== 건물 시스템 ===== */
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

/* 남작령 초기 설정 */
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
  const bp=BUILDINGS[btype]; if(!bp) return false;
  const seat=BARONIES[p.region]; if(!seat) return false;
  if(seat.gold<bp.cost){ log(`금이 부족합니다. (필요: ${bp.cost})`,'dip'); return false; }
  seat.gold-=bp.cost;
  b.buildings.push({type:btype, progress:0, done:false});
  log(`${b.n}에 ${bp.n} 건설을 시작했습니다. (${bp.time}개월 소요)`,'good');
  return true;
}

function buildingPulse(){
  for(const bid in BARONIES){
    const b=BARONIES[bid];
    if(!b.buildings?.length) continue;
    for(const slot of b.buildings){
      if(slot.done) continue;
      slot.progress++;
      const bp=BUILDINGS[slot.type]; if(!bp) continue;
      if(slot.progress>=bp.time){
        slot.done=true;
        if(bp.effect.troops_cap) b.cap=(b.cap||b.troops)+bp.effect.troops_cap;
        if(bid===playerChar().region||b.owner===state.player){
          log(`${b.n}의 <b>${bp.n}</b>이(가) 완공됐습니다! ${bp.desc}`,'good');
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

/* ---------- 캐릭터 서브시스템 ---------- */
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

function age(c){ 
  const m = state.month, y = state.year;
  let a = y - c.byear; if (m < c.bmonth || (m===c.bmonth && state.day < c.bday)) a--; return a; 
}

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

/* ---------- 월드 스폰 및 초기화 ---------- */
const murchad = mk({name:'무르하드 막 돈하드', dyn:'우어 브리언', byear:1027, bmonth:3, bday:10, traits:['temperate','gregarious','impatient'], base:{dip:6,mar:8,stew:6,intr:8,learn:6,prow:8}, edu:2, eduFocus:'mar', region:'b_limerick', ruler:true});
const wife = mk({name:'두브 에사', dyn:'우어 켈러허', sex:'f', byear:1033, bmonth:6, bday:2, traits:['kind','patient','chaste'], base:{dip:7,mar:2,stew:6,intr:4,learn:5,prow:1}, edu:1, eduFocus:'dip', spouse:murchad.id, courtOf:'b_limerick'});
murchad.spouse = wife.id;

const sonBrian = mk({name:'브리언', dyn:'우어 브리언', byear:1053, bmonth:4, bday:20, traits:[], childTrait:'rowdy', eduFocus:'mar', eduScore:7, base:{dip:3,mar:5,stew:3,intr:3,learn:2,prow:5}, father:murchad.id, mother:wife.id, courtOf:'b_limerick'});
const dauMor = mk({name:'모르', dyn:'우어 브리언', sex:'f', byear:1056, bmonth:9, bday:1, traits:[], childTrait:'curious', eduFocus:'dip', eduScore:5, base:{dip:4,mar:1,stew:3,intr:3,learn:4,prow:1}, father:murchad.id, mother:wife.id, courtOf:'b_limerick'});
const bishop = mk({name:'주교 켈라흐', dyn:'', byear:1018, bmonth:2, bday:14, traits:['diligent','calm','chaste'], base:{dip:6,mar:1,stew:5,intr:3,learn:11,prow:1}, edu:3, eduFocus:'learn', courtOf:'b_limerick'});
const marshal = mk({name:'돔날 우어 도너번', dyn:'', byear:1031, bmonth:11, bday:7, traits:['brave','honest','wrathful'], base:{dip:3,mar:10,stew:4,intr:4,learn:3,prow:11}, edu:2, eduFocus:'mar', courtOf:'b_limerick'});

const kLein = mk({name:'디어르마트 막 말 너 모', dyn:'우어 헨셀러그', byear:1010, bmonth:5, bday:3, traits:['ambitious','brave','deceitful'], base:{dip:8,mar:9,stew:6,intr:7,learn:4,prow:7}, edu:3, eduFocus:'mar', region:'b_wexford', ruler:true});
const kDub = mk({name:'무르하드 막 디어르마터', dyn:'우어 헨셀러그', byear:1032, bmonth:8, bday:9, traits:['brave','greedy','impatient'], base:{dip:5,mar:7,stew:7,intr:5,learn:3,prow:8}, edu:2, eduFocus:'stew', region:'b_dublin', ruler:true, father:kLein.id, courtOf:'b_wexford'});
const kConn = mk({name:'아드 우어 콘호버르', dyn:'우어 콘호버르', byear:1021, bmonth:1, bday:25, traits:['brave','wrathful','ambitious'], base:{dip:4,mar:10,stew:5,intr:5,learn:3,prow:10}, edu:3, eduFocus:'mar', region:'b_galway', ruler:true});
const kMeath = mk({name:'콘호바르 우어 말 셰클런', dyn:'클란 콜만', byear:1015, bmonth:7, bday:18, traits:['content','just','patient'], base:{dip:6,mar:5,stew:7,intr:4,learn:6,prow:4}, edu:2, eduFocus:'stew', region:'b_trim', ruler:true});
const kBrei = mk({name:'아드 우어 루어르크', dyn:'우어 루어르크', byear:1034, bmonth:3, bday:30, traits:['ambitious','cruel','impatient'], base:{dip:3,mar:8,stew:4,intr:7,learn:2,prow:8}, edu:2, eduFocus:'intr', region:'b_dromahair', ruler:true});
const kUls = mk({name:'돈하드 우어 어하다', dyn:'우어 어하다', byear:1024, bmonth:10, bday:11, traits:['calm','greedy','shy'], base:{dip:5,mar:6,stew:8,intr:5,learn:5,prow:5}, edu:3, eduFocus:'stew', region:'b_downpatrick', ruler:true});

chOp(kLein,murchad,-25); chOp(murchad,kLein,-25);
chOp(kConn,murchad,-15); chOp(murchad,kConn,-15);
chOp(kDub,murchad,-10);
chOp(kMeath,murchad,10); chOp(murchad,kMeath,10);
chOp(kBrei,kConn,-30); chOp(kConn,kBrei,-30);
chOp(kDub,kLein,40); chOp(kLein,kDub,40);

function seizeBaronies(charId,bids){ bids.forEach(bid=>{ if(BARONIES[bid]) BARONIES[bid].owner=charId; }); }
function seizeCounty(charId,cid){ if(COUNTIES[cid]) seizeBaronies(charId,COUNTIES[cid].baronies); }
function seizeDuchy(charId,did){ if(DUCHIES[did]) DUCHIES[did].counties.forEach(cid=>seizeCounty(charId,cid)); }
function rulerOf(bid){ const c=chars[BARONIES[bid]?.owner]; return (c&&!c.dead)?c:null; }
function regionsOf(charId){ const out=[]; for(const bid in BARONIES) if(BARONIES[bid].owner===charId) out.push(bid); return out; }
function countyOf(bid){ return BARONIES[bid]?.county||null; }
function duchyOf(bid){ return COUNTIES[BARONIES[bid]?.county]?.duchy||null; }
function countyHolder(cid){ const cap=COUNTIES[cid]?.capital; return cap?rulerOf(cap):null; }
function countiesOf(charId){ const cs=new Set(); for(const bid of regionsOf(charId)) cs.add(countyOf(bid)); return [...cs].filter(Boolean); }
function duchiesOf(charId){ const ds=new Set(); for(const bid of regionsOf(charId)) ds.add(duchyOf(bid)); return [...ds].filter(Boolean); }
function playerChar(){ return chars[state.player]; }

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

/* ---------- 글로벌 게임 상태 ---------- */
const state = {
  year:1066, month:9, day:15, paused:true, speed:1, timer:null, player:murchad.id,
  schemes:[], wars:[], truces:{}, npcAlliances:[], alliances:[], prestige:120, successionLaw:'partition',
  council:{ chancellor:null, marshal:null, steward:null, spymaster:null, chaplain:null },
  claims:[], popupQ:[], modalOpen:false, over:false, victory:false, introDone:false,
};
const MDAYS=[31,28,31,30,31,30,31,31,30,31,30,31];
const SEASONS=['겨울','겨울','봄','봄','봄','여름','여름','여름','가을','가을','가을','겨울'];

/* ---------- 시스템 이벤트 인터페이스 ---------- */
function log(msg, cls){
  const p=document.createElement('p'); if(cls)p.className=cls;
  p.innerHTML=`<span class="d">${state.year}년 ${state.month}월 ${state.day}일</span>${msg}`;
  const el=document.getElementById('log'); el.appendChild(p); el.scrollTop=el.scrollHeight;
  while(el.children.length>140) el.removeChild(el.firstChild);
}

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

/* ---------- 스트레스 계산식 ---------- */
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
  popup({title:'정신적 한계', sub:`스트레스 ${lvl}단계 — 정신 붕괴`, body:`통치의 무게가 ${c.name}의 어깨를 짓누릅니다. 밤마다 잠을 이루지 못하고, 신하들 앞에서 손이 떨립니다.\n무언가 의지할 것이 필요합니다.`, opts:[
    {t:'대처법을 찾는다', d:'스트레스 -80, 이후 스트레스 해소 +20%', f:()=>{c.stress=Math.max(0,c.stress-80); c.copings++; log('대처법을 찾아 마음을 다스립니다.','fam');}},
    {t:'이를 악물고 버틴다', d:'스트레스 +30 — 위험한 선택', f:()=>{addStress(c,30,'억눌린 고통');}},
  ]});
}
function stressDeath(c){
  if(c.dead) return;
  log(`<b>${c.name}</b>이(가) 한계에 도달했습니다. 심장이 멎었습니다.`,'war');
  if(c.id===state.player){
    popup({title:'무너진 왕', sub:'스트레스 3단계', body:`${c.name}은(는) 통치의 중압을 끝내 이기지 못했습니다.\n어느 새벽, 침소에서 싸늘하게 발견되었습니다.`, opts:[{t:'...', f:()=>kill(c,'스트레스')}]});
  } else kill(c,'스트레스');
}

/* ---------- 데스 플래그 및 계승 ---------- */
function kill(c, cause){
  if(c.dead) return;
  c.dead=true;
  if(c.spouse&&chars[c.spouse]){ chars[c.spouse].spouse=null; addStress(chars[c.spouse],40,'배우자의 죽음'); }
  for(const id in chars){const k=chars[id]; if(!k.dead&&(k.father===c.id||k.mother===c.id)) addStress(k,30,'부모의 죽음');}
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
      const splitMsg=Object.keys(dist).length>1 ? `\n\n분할 상속:\n`+Object.entries(dist).map(([hid,cids])=>`${chars[hid].name}: ${cids.map(cid=>COUNTIES[cid]?.n||cid).join('·')}`).join('\n'):'';
      log(`<b>${mainH.name}</b>이(가) ${seatName}의 칭호를 계승했습니다.`,'fam');
      popup({title:'왕은 죽었다', sub:'계승', body:`${c.name}의 시대가 끝났습니다. (${cause})\n이제 <b>${mainH.name}</b>(${age(mainH)}세)이(가) ${seatName}을(를) 다스립니다.${splitMsg}`, opts:[{t:'왕은 만세하리라'}]});
    } else {
      gameOver(`${c.name}이(가) 후계자 없이 사망했습니다. 우어 브리언 가문의 직계가 끊겼습니다.`);
    }
  } else {
    log(`<b>${c.name}</b> 사망 (${cause}).`,'war');
  }
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
      if(hid===dist[Object.keys(dist)[0]]){
        log(`${seatName}의 왕좌가 <b>${h.name}</b>에게 넘어갔습니다.`,'dip');
      } else {
        log(`${h.name}이(가) ${cids.map(cid=>COUNTIES[cid]?.n||cid).join('·')}을(를) 계승했습니다.`,'dip');
      }
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
    return true;
  });
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

/* ---------- 이벤트 풀 시스템 ---------- */
const WORLD_EVENTS = [
  { id:'norman_shadow', triggerYear:1066, maxYear:1075, chance:0.6, fired:false, run:(p)=>popup({title:'노르만의 그림자', sub:'세계 소식', body:`잉글랜드에서 충격적인 소식이 전해집니다. 노르만 공작 윌리엄이 해럴드 왕을 헤이스팅스에서 꺾고 왕좌를 차지했습니다. 에이레 서쪽에 새로운 강자가 등장했습니다.`, opts:[
    {t:'경계를 강화한다', d:'병력 +100, 스트레스 +8', f:()=>{BARONIES[p.region].troops+=100; addStress(p,8,'강대국의 위협');}},
    {t:'사절을 보낸다', d:'위신 +10, 외교 탐색', f:()=>{state.prestige+=10; log('노르만 왕국에 사절을 파견했습니다.','dip');}},
  ]})},
  { id:'viking_dublin', triggerYear:1068, maxYear:1090, chance:0.5, fired:false, run:(p)=>{
    popup({title:'더블린의 바이킹', sub:'해안 위협', body:`더블린의 노르드 해상 세력이 다시 활동을 시작했습니다. 바다에서 온 배들이 동부 해안을 약탈하고 있습니다.`, opts:[
      {t:'해안 방어를 강화한다', d:'금 -50, 동부 민심 +8', f:()=>{ BARONIES[p.region].gold-=50; ['c_dublin','c_leinster'].forEach(cid=>COUNTIES[cid]?.baronies.forEach(bid=>{if(BARONIES[bid]?.owner===state.player) BARONIES[bid].pop=Math.min(100,(BARONIES[bid].pop||60)+8);})); log('해안 경비를 강화했습니다.','war');}},
      {t:'바이킹과 교역한다', d:'금 +60, 위험', f:()=>{ if(Math.random()<0.7){BARONIES[p.region].gold+=60; log('바이킹과 교역에 성공했습니다.','good');} else{BARONIES[p.region].troops=Math.max(100,BARONIES[p.region].troops-100); log('교역선이 습격당했습니다!','war');}}},
    ]});
  }},
  { id:'papal_legate', triggerYear:1070, maxYear:1090, chance:0.5, fired:false, run:(p)=>popup({title:'교황 특사의 방문', sub:'신앙', body:`로마에서 온 특사가 아일랜드 교회의 개혁을 촉구합니다. 그레고리우스 7세의 개혁 운동이 에이레에도 파급되고 있습니다.`, opts:[
    {t:'개혁을 수용한다', d:'위신 +30, 민심 +10', f:()=>{state.prestige+=30; for(const bid of regionsOf(state.player)) BARONIES[bid].pop=Math.min(100,(BARONIES[bid].pop||60)+Math.round(10/regionsOf(state.player).length)); log('교회 개혁을 수용했습니다. 교황청의 지지를 얻었습니다.','good');}},
    {t:'정중히 거절한다', d:'위신 -10', f:()=>{state.prestige=Math.max(0,state.prestige-10);}},
  ]})},
  { id:'norman_interest', triggerYear:1075, maxYear:1100, chance:0.45, fired:false, run:(p)=>popup({title:'노르만의 야욕', sub:'외교 위기', body:`노르만 귀족들이 아일랜드의 풍요로운 땅에 눈독을 들이고 있다는 정보가 들어왔습니다. 강한 아일랜드 왕국만이 그들을 막을 수 있습니다.`, opts:[
    {t:'왕국 통일을 서두른다', d:'스트레스 +10, 동기 강화', f:()=>{addStress(p,10,'외세의 압박'); log('노르만의 위협이 통일의 동기가 됐습니다.','war');}},
    {t:'오히려 노르만과 동맹한다', d:'위신 +20, 이웃 관계 -15', f:()=>{state.prestige+=20; Object.values(chars).filter(c=>c.ruler&&!c.dead&&c.id!==p.id).forEach(c=>chOp(c,p,-15)); log('노르만 귀족과 비밀 협약을 맺었습니다.','dip');}},
  ]})},
  { id:'scotland_pressure', triggerYear:1072, maxYear:1100, chance:0.4, fired:false, run:(p)=>popup({title:'알바 왕국의 시선', sub:'북방 위협', body:`스코틀랜드 말콤 3세의 기사들이 얼스터 국경을 넘어 정찰하고 있습니다. 북쪽의 왕국이 아일랜드에 관심을 보이기 시작했습니다.`, opts:[
    {t:'국경 요새를 강화한다', d:'금 -60, 얼스터 방어 +', f:()=>{ if(BARONIES[p.region].gold>=60){ BARONIES[p.region].gold-=60; ['c_ailech','c_ulster'].forEach(cid=>COUNTIES[cid]?.baronies.forEach(bid=>{if(BARONIES[bid]) BARONIES[bid].cap=(BARONIES[bid].cap||100)+50;})); log('북부 국경 요새를 강화했습니다.','war'); } else log('금이 부족합니다.','dip');}},
    {t:'무시한다', d:'위신 -5', f:()=>{state.prestige=Math.max(0,state.prestige-5);}},
  ]})},
  { id:'storm_of_north', triggerYear:1080, maxYear:1100, chance:0.3, fired:false, repeatable:true, run:(p)=>popup({title:'북해의 폭풍', sub:'자연 재해', body:`북해에서 몰아친 폭풍이 아일랜드 해안을 강타했습니다. 어선들이 파손되고 해안 마을이 피해를 입었습니다.`, opts:[
    {t:'구호를 보낸다', d:'금 -30, 민심 +12', f:()=>{ if(BARONIES[p.region].gold>=30){BARONIES[p.region].gold-=30; for(const bid of regionsOf(state.player).slice(0,3)) BARONIES[bid].pop=Math.min(100,(BARONIES[bid].pop||60)+4);} log('해안 마을에 구호를 보냈습니다.','good');}},
    {t:'신의 뜻이다', d:'민심 -8', f:()=>{for(const bid of regionsOf(state.player).slice(0,2)) BARONIES[bid].pop=Math.max(0,(BARONIES[bid].pop||60)-8);}},
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

/* ---------- 레이아웃 인터랙션 및 시간 관리 ---------- */
const PANELS={
  log:  {wrap:'logWrap',   render:null},
  court:{wrap:'courtWrap', render:'renderCourt'},
  dec:  {wrap:'decWrap',   render:'renderDec'},
};
const PANEL_TAB_IDS={log:'logTab',court:'courtTab',dec:'decTab'};

function _showAllTabs(){
  Object.values(PANEL_TAB_IDS).forEach(tid=>{
    const t=document.getElementById(tid); if(t) t.style.display='';
  });
}
function _hideOtherTabs(activeId){
  Object.entries(PANEL_TAB_IDS).forEach(([pid,tid])=>{
    const t=document.getElementById(tid); if(!t) return;
    t.style.display = pid===activeId ? '' : 'none';
  });
  Object.keys(PANELS).forEach(k=>{
    const w=document.getElementById(PANELS[k].wrap); if(!w) return;
    w.style.zIndex = k===activeId ? '37' : '35';
  });
}

function togglePanel(id){
  const info=PANELS[id]; if(!info) return;
  const el=document.getElementById(info.wrap);
  const opening=!el.classList.contains('open');
  Object.keys(PANELS).forEach(k=>{
    if(k!==id) document.getElementById(PANELS[k].wrap).classList.remove('open');
  });
  if(opening){
    if(info.render) window[info.render]();
    el.classList.add('open');
    if(id!=='log') pause();
    _hideOtherTabs(id);
  } else {
    el.classList.remove('open');
    if(id!=='log') resume();
    _showAllTabs();
    Object.keys(PANELS).forEach(k=>{
      const w=document.getElementById(PANELS[k].wrap); if(w) w.style.zIndex='';
    });
  }
}
function closePanel(id){
  const info=PANELS[id]; if(!info) return;
  document.getElementById(info.wrap).classList.remove('open');
  if(id!=='log') resume();
  _showAllTabs();
  Object.keys(PANELS).forEach(k=>{
    const w=document.getElementById(PANELS[k].wrap); if(w) w.style.zIndex='';
  });
}

function togglePause(){ state.paused?resume():pause(); }
function pause(){ state.paused=true; clearInterval(state.timer); state.timer=null; updPauseBtn(); }
function resume(){
  if(state.over||state.modalOpen) return;
  state.paused=false;
  const iv = state.speed===1?550 : state.speed===2?260 : 110;
  clearInterval(state.timer);
  state.timer=setInterval(tick,iv);
  updPauseBtn();
}
function setSpeed(s){ state.speed=s; document.querySelectorAll('.spd').forEach(b=>b.classList.toggle('on',+b.dataset.s===s)); if(!state.paused) resume(); }
function updPauseBtn(){
  const b=document.getElementById('pauseBtn');
  b.textContent=state.paused?'▶ 진행':'⏸ 정지';
  b.classList.toggle('paused',state.paused);
}
function tick(){
  if(state.paused||state.over) return;
  state.day++;
  const dim=MDAYS[state.month-1];
  if(state.day>dim){
    state.day=1; state.month++;
    if(state.month>12){ state.month=1; state.year++; }
    monthlyPulse();
  }
  dailyBirthdays();
  renderHeader(); renderChar();
  if(state.popupQ.length) flushPopups();
}

/* ---------- 수명주기 시스템 ---------- */
function dailyBirthdays(){
  for(const id in chars){
    const c=chars[id]; if(c.dead) continue;
    if(c.bmonth===state.month&&c.bday===state.day){ onBirthday(c,age(c)); }
  }
}
function onBirthday(c,a){
  if(a===3&&!c.childTrait){
    c.childTrait=randKey(CHILD_TRAITS);
    if(isPlayerFamily(c)) log(`<b>${c.name}</b>(3세)에게서 <b>${CHILD_TRAITS[c.childTrait].n}</b>의 기질이 보입니다.`,'fam');
  }
  if(a===6&&!c.eduFocus){
    if(isPlayerFamily(c)) askEducation(c);
    else { c.eduFocus=CHILD_TRAITS[c.childTrait||'curious'].foci[0]; }
  }
  if(a>=6&&a<16&&c.eduFocus){ if(eduRoll(c)) c.eduScore+=2; }
  if((a===9||a===11||a===13)&&c.traits.length<3){
    if(isPlayerFamily(c)) askPersonality(c,a);
    else npcGainPersonality(c);
  }
  if(a===16&&c.edu===null){ comeOfAge(c); }
  if(a>=60){ if(Math.random()<((a-58)*0.035)) kill(c,'노환'); }
}
function isPlayerFamily(c){ const p=playerChar(); return c.father===p.id||c.mother===p.id||c.courtOf===p.region; }
function eduRoll(c){
  let S=0,F=0; const g=guardianOf(c);
  if(c.childTrait && CHILD_TRAITS[c.childTrait].foci.includes(c.eduFocus)) S+=20; else S-=20;
  if(g){ S += 0.4*stat(g,c.eduFocus) + 0.2*stat(g,'learn'); } else F+=20;
  return Math.random()<((60+S)/(100+S+F));
}
function guardianOf(c){
  if(c.guardian&&chars[c.guardian]&&!chars[c.guardian].dead) return chars[c.guardian];
  if(c.father&&chars[c.father]&&!chars[c.father].dead) return chars[c.father];
  return null;
}
function comeOfAge(c){
  const sc=c.eduScore;
  c.edu = sc>=18?3 : sc>=13?2 : sc>=8?1 : 0;
  if(isPlayerFamily(c)||c.ruler){ log(`<b>${c.name}</b>이(가) 성인이 되었습니다 — <b>${EDU_NAMES[c.eduFocus||'dip'][c.edu]}</b> (교육 점수 ${sc})`,'fam'); }
  if(!c.eduFocus) c.eduFocus='dip';
  if(isPlayerFamily(c)){
    while(c.traits.length<2) npcGainPersonality(c);
    if(c.traits.length<3) askPersonality(c,16);
  } else { while(c.traits.length<3) npcGainPersonality(c); }
  if(c.id===state.player) askLifestyle(c); else c.lifestyle=randKey(SKILLS);
}

/* ---------- 인터랙티브 이벤트 팝업 ---------- */
function askEducation(c){
  const ct=CHILD_TRAITS[c.childTrait||'curious'];
  const courtAdults=Object.values(chars).filter(k=>!k.dead&&age(k)>=16&&(k.courtOf===playerChar().region||k.id===state.player));
  const opts=Object.entries(SKILLS).map(([k,n])=>({
    t:`${n} 교육`+(ct.foci.includes(k)?' ★ 기질 일치':''),
    d:ct.foci.includes(k)?'어린시절 특성과 일치 — 교육 성공률 상승':'기질과 불일치 — 성공률 하락',
    f:()=>{ c.eduFocus=k; pickGuardian(c,courtAdults); }
  }));
  popup({title:`${c.name}의 교육`, sub:'6세 — 교육 방향 결정', body:`${c.name}이(가) 배움을 시작할 나이가 되었습니다.\n기질: ${ct.n} (적성: ${ct.foci.map(f=>SKILLS[f]).join(', ')})`, opts});
}
function pickGuardian(c,adults){
  const opts=adults.slice(0,5).map(g=>({
    t:`${g.name}`, d:`${SKILLS[c.eduFocus]} ${stat(g,c.eduFocus)} · 학문 ${stat(g,'learn')} · 성격: ${g.traits.map(t=>TRAITS[t].n).join('·')||'—'}`,
    f:()=>{ c.guardian=g.id; chOp(c,g,15); chOp(g,c,5); log(`<b>${g.name}</b>이(가) ${c.name}의 후견인이 되었습니다.`,'fam'); }
  }));
  popup({title:`${c.name}의 후견인`, sub:'후견 — 교육의 질을 결정합니다', body:'후견인의 해당 스킬(×0.4)과 학문(×0.2)이 교육 점수에 영향을 줍니다.\n아이는 후견인의 성격을 닮아갑니다.', opts});
}
function askPersonality(c,a){
  const g=guardianOf(c); const cand=new Set();
  if(g) g.traits.forEach(t=>{ if(canHaveTrait(c,t)) cand.add(t); });
  while(cand.size<3){
    const t=PERSONALITY_KEYS[Math.floor(Math.random()*PERSONALITY_KEYS.length)];
    if(canHaveTrait(c,t)) cand.add(t);
  }
  const opts=[...cand].slice(0,3).map(t=>({
    t:TRAITS[t].n, d:(g&&g.traits.includes(t))?'후견인의 영향':'',
    f:()=>{ c.traits.push(t); log(`<b>${c.name}</b>(${a}세)이(가) <b>${TRAITS[t].n}</b> 성격을 갖게 되었습니다.`,'fam'); }
  }));
  popup({title:`${c.name}의 성장`, sub:`${a}세 — 성격 형성`, body:`${c.name}의 성격이 뚜렷해지고 있습니다. 어떤 면모가 두드러집니까?`, opts});
}
function npcGainPersonality(c){
  const g=guardianOf(c); let t=null;
  if(g&&Math.random()<0.5){ const gs=g.traits.filter(x=>canHaveTrait(c,x)); if(gs.length) t=gs[Math.floor(Math.random()*gs.length)]; }
  if(!t){ let tries=0; do{ t=PERSONALITY_KEYS[Math.floor(Math.random()*PERSONALITY_KEYS.length)]; tries++; }while(!canHaveTrait(c,t)&&tries<20); }
  if(t&&canHaveTrait(c,t)) c.traits.push(t);
}
function canHaveTrait(c,t){ return !c.traits.includes(t)&&!c.traits.includes(TRAITS[t].opp)&&c.traits.length<3; }
function askLifestyle(c){
  const opts=Object.entries(SKILLS).map(([k,n])=>({
    t:`${n}의 길`, d:c.eduFocus===k?`교육 일치 — 경험치 +${(EDU_BONUS[c.edu]||1)*10}%`:'',
    f:()=>{ c.lifestyle=k; log(`<b>${c.name}</b>이(가) <b>${n}</b>의 길을 걷기로 했습니다.`,'fam'); }
  }));
  popup({title:'인생관', sub:'삶의 방향', body:`${c.name}은(는) 앞으로 어떤 통치자가 되려 합니까?`, opts});
}

/* ---------- 매월 작동 주기 및 시스템 펄스 ---------- */
function monthlyPulse(){
  for(const id in chars){
    const c=chars[id]; if(c.dead) continue;
    if(c.lifestyle){ let xp=10; if(c.edu!==null&&c.eduFocus===c.lifestyle) xp*=1+(EDU_BONUS[c.edu]*0.1); c.lifeXP+=Math.round(xp); }
    if(c.pregnant>0){ c.pregnant++; if(c.pregnant>=10) giveBirth(c); }
  }
  buildingPulse(); fertilityPulse(); naturalDeathPulse(); councilPulse(); schemePulse(); warPulse(); aiPulse(); randomEventPulse(); goldPulse();
  for(const role in COUNCIL_ROLES){
    const cid=state.council[role];
    if(cid&&(!chars[cid]||chars[cid].dead)){ state.council[role]=null; log(`${COUNCIL_ROLES[role].n} 자문회 보직이 공석이 됐습니다.`,'dip'); }
  }
  if(state.month===1){ claimExpirePulse(); worldEventPulse(); opinionDecayPulse(); }
  renderMap();
}

/* ---------- 봉신 및 직할령 지배 체계 ---------- */
function directCountiesOf(charId){ return Object.keys(COUNTIES).filter(cid=>BARONIES[COUNTIES[cid].capital]?.owner===charId); }
function vassalsOf(liegeId){ return Object.values(chars).filter(c=>!c.dead&&c.liege===liegeId&&c.ruler); }
function domainLimit(c){ const d=duchiesOf(c.id).length; const ct=directCountiesOf(c.id).length; const base = d>=1?6 : ct>=3?4 : 2; return base + Math.floor(stat(c,'stew')*0.12); }
function grantCountyToVassal(liegeId, vassalId, cid){
  const liege=chars[liegeId], vassal=chars[vassalId]; if(!liege||!vassal||!COUNTIES[cid]) return;
  COUNTIES[cid].baronies.forEach(bid=>{ if(BARONIES[bid]) BARONIES[bid].owner=vassalId; });
  vassal.liege=liegeId; vassal.ruler=true; vassal.courtOf=null;
  if(!vassal.region||countyOf(vassal.region)!==cid) vassal.region=COUNTIES[cid].capital;
  chOp(vassal,liege,25); log(`<b>${vassal.name}</b>이(가) ${COUNTIES[cid].n}의 백작으로 임명됐습니다.`,'good');
}
function vassalRevolt(v, liege){
  v.liege=null; chOp(v,liege,-50); chOp(liege,v,-50); log(`<b>${v.name}</b>이(가) ${liege.name}에게 반기를 들었습니다!`,'war');
  directCountiesOf(v.id).forEach(cid=>v.claims.push({rid:cid, type:'revenge', obtained:state.year}));
  if(v.id===state.player||liege.id===state.player){
    popup({title:'봉신 반란!', sub:'정치 위기', body:`<b>${v.name}</b>이(가) 반란을 선포했습니다!\n봉신의 불만이 한계에 달했습니다.`, opts:[
      {t:'진압 전쟁 선포', f:()=>{ if(liege.id===state.player) addClaim(directCountiesOf(v.id)[0],'revenge'); }},
      {t:'독립을 인정한다', f:()=>{ addStress(liege.id===state.player?liege:playerChar(), 20,'굴욕적 양보'); }}
    ]});
  }
}

function goldPulse(){
  for(const bid in BARONIES){
    const b=BARONIES[bid]; const regen=4+buildingBonus(bid,'troops_regen');
    b.troops=Math.min(b.cap, b.troops+regen);
  }
  const TAX_RATE=0.25; const processed=new Set();
  for(const id in chars){
    const c=chars[id]; if(c.dead||!c.ruler||processed.has(id)) continue;
    processed.add(id); const owned=regionsOf(id); if(!owned.length) continue;
    const seat=owned.includes(c.region)?c.region:owned[0]; const seatB=BARONIES[seat]; if(!seatB) continue;
    const dCnt=directCountiesOf(id).length; const dLimit=domainLimit(c);
    const overPenalty=dCnt>dLimit?Math.max(0.3,1-(dCnt-dLimit)*0.15):1;
    const directIncome=owned.reduce((s,bid)=>{ const b=BARONIES[bid]; return s+(b?Math.round((4+stat(c,'stew')*0.5)*overPenalty):0); },0);
    const goldCap=id===state.player?3500:2500; seatB.gold=Math.min(goldCap, seatB.gold+directIncome);
    if(id===state.player||c.ruler){
      for(const v of vassalsOf(id)){
        const opn=Math.max(0,opinion(v,c)+100)/200; const taxMul=TAX_RATE*opn; const vOwned=regionsOf(v.id);
        const vSeat=vOwned.includes(v.region)?v.region:vOwned[0]; const vSeatB=vSeat?BARONIES[vSeat]:null; if(!vSeatB) continue;
        const taxAmt=Math.round(vSeatB.gold*taxMul*0.08);
        if(taxAmt>0 && vSeatB.gold>taxAmt){ vSeatB.gold-=taxAmt; seatB.gold=Math.min(goldCap, seatB.gold+taxAmt); }
      }
    }
  }
  for(const id in chars){
    const v=chars[id]; if(v.dead||!v.ruler||!v.liege) continue;
    const liege=chars[v.liege]; if(!liege||liege.dead) continue;
    if(opinion(v,liege)<-40 && Math.random()<(0.02*((-opinion(v,liege)-40)/60))){ vassalRevolt(v,liege); }
  }
}

function fertilityPulse(){
  for(const id in chars){
    const c=chars[id]; if(c.dead||c.sex!=='f'||!c.spouse||c.pregnant>0) continue;
    const h=chars[c.spouse]; if(!h||h.dead) continue; if(age(c)<16||age(h)<16) continue;
    if(Math.random()<(((fert(c)+fert(h))/2)*0.0475)){ c.pregnant=1; if(isPlayerFamily(c)||c.id===state.player||h.id===state.player) log(`<b>${c.name}</b>이(가) 회임했습니다.`,'fam'); }
  }
}

function naturalDeathChance(a){
  if(a<16) return 0.001; if(a<40) return 0.0015; if(a<50) return 0.003; if(a<55) return 0.006; if(a<60) return 0.010; if(a<65) return 0.016; if(a<70) return 0.025; if(a<75) return 0.038; if(a<80) return 0.055; return 0.08;
}
function naturalDeathPulse(){
  const p=playerChar();
  for(const id in chars){
    const c=chars[id]; if(c.dead) continue; const a=age(c); let chance=naturalDeathChance(a);
    if(c.stress>=100) chance*=1.5; if(c.stress>=130) chance*=2.0; if(Math.random()>chance) continue;
    if(c.id===state.player){
      popup({title:'노환', sub:'건강', body:`${c.name}이(가) ${a}세의 나이에 조용히 눈을 감았습니다.\n긴 통치의 무게가 몸을 앞서 갔습니다.`, opts:[{t:'...', f:()=>kill(c,'노환')}]});
    } else {
      if(c.spouse===state.player||chars[c.spouse]?.spouse===state.player||c.id===p.spouse){
        log(`<b>${c.name}</b>이(가) ${a}세를 일기로 세상을 떠났습니다.`,'fam'); addStress(p,40,'배우자의 죽음');
        popup({title:'배우자의 죽음', sub:'가문', body:`${c.name}이(가) 조용히 눈을 감았습니다.\n${a}세였습니다. 오랜 동반자를 잃었습니다.`, opts:[{t:'명복을 빈다', f:()=>{ if(p.spouse===c.id) p.spouse=null; }}]});
      } else if(c.father===state.player||c.mother===state.player){ log(`<b>${c.name}</b>이(가) ${a}세로 사망했습니다.`,'fam'); addStress(p,25,'자식의 죽음'); }
      kill(c,'노환');
    }
  }
}

function giveBirth(c){
  c.pregnant=0; c.births++; const h=chars[c.spouse]; const sex=Math.random()<0.51?'m':'f';
  const baby=mk({name:sex==='m'?randName():['이테','고름라트','사브','베브','오를라트'][Math.floor(Math.random()*5)], dyn:h?h.dyn:c.dyn, sex, byear:state.year, bmonth:state.month, bday:Math.min(state.day,28), base:babyStats(c,h), father:h?h.id:null, mother:c.id, courtOf:c.courtOf||((h&&h.region)?h.region:null)});
  if(h&&h.region) baby.courtOf=h.region;
  if(isPlayerFamily(baby)||(h&&h.id===state.player)){
    log(`<b>${c.name}</b>이(가) ${sex==='m'?'아들':'딸'} <b>${baby.name}</b>을(를) 낳았습니다.`,'good');
    if(h&&h.id===state.player) popup({title:'새 생명', sub:'출산', body:`${c.name}이(가) 건강한 ${sex==='m'?'아들':'딸'}을 낳았습니다.\n아이의 이름은 ${baby.name}입니다.`, opts:[{t:'가문에 축복이 있기를', f:()=>addStress(playerChar(),-15,'아이의 탄생')}]});
  } else if(h&&h.ruler){ log(`${COUNTIES[countyOf(h.region)]?.n||BARONIES[h.region]?.n||''}의 궁정에 아이가 태어났습니다.`,'dip'); }
}
function babyStats(m,f){
  const r={}; for(const k of ['dip','mar','stew','intr','learn','prow']){ const mv=m?m.base[k]:5, fv=f?f.base[k]:5; r[k]=Math.max(0,Math.min(10,Math.round((mv+fv)/2 + (Math.random()*4-2)))); } return r;
}

/* ---------- 모략(암살) 엔진 ---------- */
function startScheme(plotter,target){
  if(state.schemes.some(s=>s.plotter===plotter.id&&s.target===target.id)) return false;
  state.schemes.push({plotter:plotter.id,target:target.id,months:0});
  if(plotter.id===state.player){
    if(plotter.traits.includes('just')) addStress(plotter,30,'공정한 자의 음모');
    if(plotter.traits.includes('honest')) addStress(plotter,20,'정직한 자의 음모');
    if(plotter.traits.includes('forgiving')) addStress(plotter,20,'관용적인 자의 음모');
    if(plotter.traits.includes('kind')) addStress(plotter,20,'친절한 자의 음모');
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
      if(s.target===state.player){ popup({title:'독배', sub:'암살', body:'연회의 술잔에 독이 들어 있었습니다.\n시야가 흐려지고, 다리에 힘이 풀립니다...', opts:[{t:'...', f:()=>kill(t,'독살')}]}); } else kill(t,'독살');
      return false;
    }
    if(roll<(succ+discover)){
      log(`<b>${p.name}</b>의 살해 모략이 발각되었습니다! 대상: ${t.name}`,'war'); chOp(t,p,-50);
      for(const rid in REGIONS){const r=rulerOf(rid); if(r&&r.id!==p.id) chOp(r,p,-15);}
      if(s.plotter===state.player) addStress(p,20,'모략 발각의 수치');
      if(s.target===state.player){ popup({title:'발각된 음모', sub:'첩보', body:`첩자가 보고합니다. <b>${p.name}</b>이(가) 당신의 목숨을 노리고 있었습니다.\n모략은 저지되었으나, 칼끝은 여전히 어둠 속에 있습니다.`, opts:[{t:'경계를 강화한다'}, {t:'복수를 다짐한다', d:'관계 -30', f:()=>chOp(playerChar(),p,-30)}]}); }
      return false;
    }
    return s.months<30;
  });
}

/* ---------- 공성전 및 전쟁 관리 ---------- */
function declareWar(atk,def,targetRid){
  if(truceBetween(atk.id,def.id)) return false;
  if(state.wars.some(w=>(w.atk===atk.id&&w.def===def.id)||(w.atk===def.id&&w.def===atk.id))) return false;
  if(isAllied(atk.id,def.id)){ if(atk.id===state.player) log('동맹국에는 선전포고할 수 없습니다. 먼저 동맹을 파기하세요.','dip'); return false; }
  let tRid = targetRid || def.region || regionsOf(def.id)[0]; let tCid = null;
  if(COUNTIES[tRid]){ tCid=tRid; tRid=COUNTIES[tRid].capital; } else if(BARONIES[tRid]){ tCid=BARONIES[tRid].county; }
  if(!tRid||!BARONIES[tRid]){ return false; }
  state.wars.push({atk:atk.id, def:def.id, targetRid:tCid||tRid, score:0, months:0, allies:[]}); chOp(def,atk,-40);
  log(`<b>${atk.name}</b>이(가) <b>${tCid?COUNTIES[tCid]?.n:BARONIES[tRid]?.n||tRid}</b>을(를) 목표로 선전포고했습니다!`,'war');
  if(atk.id===state.player){
    if(atk.traits.includes('calm')) addStress(atk,15,'침착한 자의 개전');
    if(atk.traits.includes('content')) addStress(atk,15,'만족하는 자의 개전');
  }
  if(def.id!==state.player && def.ruler) npcGrantRevenge(def, tRid);
  const defAllies = state.alliances.filter(k=>k.includes(def.id)).map(k=>k.replace(def.id,'').replace('|','')).filter(x=>x&&chars[x]&&!chars[x].dead);
  for(const aid of defAllies){
    if(aid===atk.id) continue;
    if(aid===state.player){
      popup({title:'동맹 방어 의무', sub:'전쟁', body:`<b>${def.name}</b>이(가) ${atk.name}에게 침공당했습니다.\n당신은 동맹으로서 방어에 참전할 의무가 있습니다.`, opts:[
        {t:'참전한다 (동맹 의무)', f:()=>{ state.wars.find(w=>w.atk===atk.id&&w.def===def.id)?.allies.push(state.player); log('동맹국 방어에 참전했습니다.','war'); }},
        {t:'거부한다 (위신 -50)', f:()=>{ state.prestige=Math.max(0,state.prestige-50); breakAlliance(state.player,def.id); log('동맹 의무를 저버렸습니다. 위신이 크게 하락했습니다.','war'); }},
      ]});
    } else {
      if(Math.random()<0.8){ state.wars.find(w=>w.atk===atk.id&&w.def===def.id)?.allies.push(aid); log(`${chars[aid].name}이(가) 동맹 의무로 ${def.name}의 방어에 참전했습니다.`,'war'); }
      else { breakAlliance(aid,def.id); log(`${chars[aid].name}이(가) 동맹 의무를 저버렸습니다.`,'war'); }
    }
  }
  if(def.id===state.player){ grantRevengeClaim(tCid||tRid); popup({title:'전쟁이다!', sub:'침공', body:`${atk.name}의 군대가 국경을 넘었습니다!\n목표: <b>${tCid?COUNTIES[tCid]?.n:BARONIES[tRid]?.n||tRid}</b>\n\n복수 명분이 생겼습니다. 패배 후 반격이 가능합니다.`, opts:[{t:'전군 소집!', f:()=>addStress(playerChar(),10,'전쟁의 무게')}]}); }
  renderMap(); return true;
}
function truceBetween(a,b){ const k=[a,b].sort().join('|'); return state.truces[k]&&state.truces[k]>state.year; }
function setTruce(a,b,years){ const k=[a,b].sort().join('|'); state.truces[k]=state.year+years; }
function allianceKey(a,b){ return [a,b].sort().join('|'); }
function isAllied(a,b){ return state.alliances.includes(allianceKey(a,b))||state.npcAlliances.includes(allianceKey(a,b)); }
function breakAlliance(a,b){
  const k=allianceKey(a,b); state.alliances=state.alliances.filter(x=>x!==k); state.npcAlliances=state.npcAlliances.filter(x=>x!==k);
  setTruce(a,b,5); chOp(chars[a],chars[b],-40); chOp(chars[b],chars[a],-40);
}
function formAlliance(a,b){ const k=allianceKey(a,b); if(!state.alliances.includes(k)&&!state.npcAlliances.includes(k)) state.alliances.push(k); }
function power(c){
  let t=0; for(const bid of regionsOf(c.id)){ const b=BARONIES[bid]; if(b) t+=b.troops; }
  for(const v of vassalsOf(c.id)){ for(const bid of regionsOf(v.id)){ const b=BARONIES[bid]; if(b) t+=b.troops*0.1; } }
  if(!t) t=150; return t*(1+stat(c,'mar')*0.04)*(1+stat(c,'prow')*0.01);
}
function resolveWarChar(wSide){
  const c=chars[wSide]; if(c&&!c.dead) return wSide;
  const heir=Object.values(chars).find(k=>!k.dead&&k.ruler&&k.dyn===c?.dyn&&k.id!==wSide); return heir?heir.id:null;
}
function siegeProgress(w){ const cid=w.targetRid; if(!cid||!COUNTIES[cid]) return 0; const bids=COUNTIES[cid].baronies; if(!w.occupied) w.occupied=[]; return bids.length>0 ? w.occupied.length/bids.length : 0; }

function warPulse(){
  state.wars=state.wars.filter(w=>{
    const newAtk=resolveWarChar(w.atk), newDef=resolveWarChar(w.def); if(!newAtk||!newDef) return false;
    if(newAtk!==w.atk){ log(`${chars[newAtk].name}이(가) 전쟁을 이어받았습니다.`,'war'); w.atk=newAtk; }
    if(newDef!==w.def){ log(`${chars[newDef].name}이(가) 방어를 이어받았습니다.`,'war'); w.def=newDef; }
    const a=chars[w.atk], d=chars[w.def]; const tCid=w.targetRid;
    if(tCid&&COUNTIES[tCid]){
      const capHolder=countyHolder(tCid);
      if(capHolder&&capHolder.id!==w.def&&capHolder.id!==w.atk){
        if(w.atk===state.player||w.def===state.player){
          popup({title:'전쟁 목표 상실', sub:'전황 변화', body:`${capHolder.name}이(가) <b>${COUNTIES[tCid].n}</b>을(를) 먼저 점령했습니다!\n전쟁 목표가 사라졌습니다.`, opts:[
            {t:'새 목표를 찾는다', f:()=>{ const alt=directCountiesOf(w.def===state.player?a.id:d.id).find(c=>c!==tCid); if(alt){ w.targetRid=alt; w.occupied=[]; log(`새 목표: ${COUNTIES[alt].n}`,'war'); } else { setTruce(w.atk,w.def,2); log('목표가 없어 전쟁 종결.','war'); state.wars=state.wars.filter(x=>x!==w); } }},
            {t:'전쟁을 끝낸다', f:()=>{ setTruce(w.atk,w.def,2); state.wars=state.wars.filter(x=>x!==w); }},
          ]});
          return true;
        } else { setTruce(w.atk,w.def,2); return false; }
      }
    }
    w.months++; if(!w.occupied) w.occupied=[];
    const allyPow=(w.allies||[]).reduce((s,id)=>{ const v=chars[id]; return v?s+power(v)*0.6:s; },0);
    const vPow=vassalsOf(w.atk).reduce((s,v)=>s+power(v)*0.4,0);
    const pa=power(a)+allyPow+vPow; const pd=power(d)+vassalsOf(w.def).reduce((s,v)=>s+power(v)*0.4,0);
    const ratio=(pa-pd)/Math.max(pa,pd); const warExhaust=0.97-Math.min(0.03,w.months*0.0005);
    for(const bid of regionsOf(a.id)) BARONIES[bid].troops=Math.max(80,Math.round(BARONIES[bid].troops*warExhaust));
    for(const bid of regionsOf(d.id)) BARONIES[bid].troops=Math.max(80,Math.round(BARONIES[bid].troops*warExhaust));
    (w.allies||[]).forEach(aid=>{ for(const bid of regionsOf(aid)) BARONIES[bid].troops=Math.max(60,Math.round(BARONIES[bid].troops*0.98)); });
    const aSeat=BARONIES[a.region]; if(aSeat) aSeat.gold=Math.max(0,aSeat.gold-Math.round(3+w.months*0.1));
    const dSeat=BARONIES[d.region]; if(dSeat) dSeat.gold=Math.max(0,dSeat.gold-Math.round(3+w.months*0.1));
    if(tCid&&COUNTIES[tCid]){
      const bids=COUNTIES[tCid].baronies; const wallBonus=(COUNTIES[tCid]?.baronies||[]).filter(bid=>BARONIES[bid]?.buildings?.includes('walls')).length*0.1;
      if(ratio>0.1 && Math.random()<(0.25+ratio*0.3-wallBonus)){ const unoccupied=bids.filter(bid=>!w.occupied.includes(bid)); if(unoccupied.length) w.occupied.push(unoccupied[Math.floor(Math.random()*unoccupied.length)]); }
      else if(ratio<-0.1 && Math.random()<0.2){ if(w.occupied.length) w.occupied.splice(Math.floor(Math.random()*w.occupied.length),1); }
    }
    const siegePct=siegeProgress(w); w.score=Math.max(-100,Math.min(100,w.score+(ratio*9 + siegePct*6 + (Math.random()*8-4))));
    if(w.months%3===0&&(w.atk===state.player||w.def===state.player)){ const my=w.atk===state.player?w.score:-w.score; log(`전황: ${my>=0?'+':''}${Math.round(my)}%${tCid?` · 공성 ${Math.round(siegePct*100)}%`:''} — ${my>30?'아군 우세':my<-30?'적군 우세':'교착 상태'}`,'war'); }
    if((w.atk===state.player||w.def===state.player) && Math.random()<0.15 && !state.modalOpen){
      const isAtk=w.atk===state.player; const foe=isAtk?d:a;
      const events=[
        {cond:isAtk&&ratio>0.1, t:'전선 돌파!', body:`${foe.name}의 진지가 흔들립니다. 결정적 추격을 명할 수 있습니다.`, opts:[{t:'추격한다', d:'전황 +15, 소모 +', f:()=>{w.score=Math.min(100,w.score+15); for(const b of regionsOf(a.id)) BARONIES[b].troops=Math.max(80,Math.round(BARONIES[b].troops*0.94));}}, {t:'진지를 굳힌다', d:'현 상태 유지', f:()=>{}}]},
        {cond:!isAtk&&ratio<-0.1, t:'적군 포위!', body:`${foe.name}의 군대가 보급선을 끊었습니다. 돌파를 시도합니까?`, opts:[{t:'돌파한다', d:'50% 성공, 실패시 대손실', f:()=>{if(Math.random()<0.5){w.score=Math.min(100,w.score+20);}else{for(const b of regionsOf(d.id)) BARONIES[b].troops=Math.max(50,Math.round(BARONIES[b].troops*0.75));}}}, {t:'방어를 유지한다', d:'전황 -5', f:()=>{w.score=Math.max(-100,w.score-5);}}]},
        {cond:true, t:'소규모 충돌', body:`국경에서 소규모 전투가 벌어졌습니다. 양측 모두 피해를 입었습니다.`, opts:[{t:'전선을 정비한다', d:'소모 증가', f:()=>{ for(const b of regionsOf(a.id)) BARONIES[b].troops=Math.max(80,Math.round(BARONIES[b].troops*0.96)); }}]},
      ];
      const ev=events.find(e=>e.cond); if(ev) popup({title:ev.t, sub:'전황', body:ev.body, opts:ev.opts});
    }
    const allSieged=tCid&&COUNTIES[tCid]&&w.occupied.length>=COUNTIES[tCid].baronies.length;
    if(w.score>=100||allSieged){ conquerTarget(a,d,tCid||w.targetRid); return false; }
    if(w.score<=-100){ log(`<b>${a.name}</b>의 침공이 격퇴됐습니다.`,'war'); setTruce(a.id,d.id,5); if(w.atk===state.player){ addStress(a,30,'패전의 굴욕'); addClaim(tCid||w.targetRid,'unpressed'); } if(w.def===state.player){ addStress(d,-10,'승전의 기쁨'); if(dSeat) dSeat.gold+=80; } return false; }
    if(w.months>60){ log('오랜 전쟁이 지쳐 끝났습니다.','war'); setTruce(a.id,d.id,3); return false; }
    return true;
  });
}

function conquerTarget(a, d, targetCid){
  let cid = targetCid; if(BARONIES[targetCid]) cid = BARONIES[targetCid].county; if(!cid||!COUNTIES[cid]){ setTruce(a.id,d.id,5); return; }
  log(`<b>${a.name}</b>이(가) <b>${COUNTIES[cid].n}</b>을(를) 정복했습니다!`,'war'); setTruce(a.id,d.id,5);
  const bids = COUNTIES[cid].baronies; const aSeat = BARONIES[a.region];
  bids.forEach(bid=>{ const b=BARONIES[bid]; if(!b) return; if(aSeat) aSeat.gold+=Math.round(b.gold*0.3); b.gold=Math.round(b.gold*0.7); b.owner=a.id; });
  if(countyOf(d.region)==='cid'){ const remaining=regionsOf(d.id).filter(bid=>BARONIES[bid]?.county!==cid); if(remaining.length){ d.region=remaining[0]; } else { d.ruler=false; d.region=null; d.courtOf=a.region; } }
  if(a.id===state.player){
    addStress(a,-15,'정복의 영광'); const remCnt=countiesOf(d.id).length; const canVassal=remCnt>0&&!d.dead;
    popup({title:'정복', sub:COUNTIES[cid].n, body:`<b>${COUNTIES[cid].n}</b>이(가) 당신의 깃발 아래 들어왔습니다!${remCnt>0?`\n${d.name}에게는 아직 ${remCnt}개 백작령이 남아있습니다.`:'\n'+d.name+'은(는) 당신의 궁정에 무릎 꿇었습니다.'}`, opts:[
      ...(canVassal?[{t:`${d.name}을 봉신으로 삼는다`, d:'나머지 영지 유지, 세금 수취', f:()=>{ d.liege=a.id; chOp(d,a,20); log(`${d.name}이(가) 당신의 봉신이 됐습니다.`,'dip'); checkVictoryHint(); }}]:[]),
      {t:'에이레가 지켜보고 있다', f:checkVictoryHint}
    ]});
  }
  if(d.id===state.player&&!d.region){ gameOver(`${COUNTIES[cid].n}이(가) 함락되었습니다. ${a.name}이(가) 당신의 왕좌를 빼앗았습니다.`); }
  renderMap();
}
function playerRegions(){ return regionsOf(state.player); }
function checkVictoryHint(){ const n=playerRegions().length; if(n>=4&&n<7) log(`현재 ${n}개 왕국을 지배 중입니다. [결단] 메뉴를 확인하세요.`,'good'); }

/* ---------- AI 행동 의사결정 나무 ---------- */
function courtMembersOf(ruler){ return Object.values(chars).filter(c=> !c.dead && age(c)>=16 && c.id!==ruler.id && c.courtOf===ruler.region); }
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
  if(charId){
    for(const r in state.council){ if(r!===role && state.council[r]===charId){ log(`${chars[charId].name}은(는) 이미 ${COUNCIL_ROLES[r].n} 보직을 맡고 있습니다.`,'dip'); renderCourt(); return; } }
  }
  const prev = state.council[role]; if(prev && chars[prev]) chOp(chars[prev], playerChar(), -10); state.council[role] = charId || null;
  if(charId && chars[charId]){ chOp(chars[charId], playerChar(), 20); log(`<b>${chars[charId].name}</b>이(가) ${COUNCIL_ROLES[role].n}(으)로 임명되었습니다.`, 'good'); }
  renderCourt();
}

function npcCouncilPulse(){
  for(const id in chars){
    const r = chars[id]; if(r.dead || !r.ruler || id===state.player || !r.region || !REGIONS[r.region]) continue;
    for(const role in COUNCIL_ROLES){ const cid=r.council[role]; if(cid&&(!chars[cid]||chars[cid].dead)) r.council[role]=null; }
    if(r.council.chancellor && Math.random()<0.06){
      const cid = r.council.chancellor; const chan = chars[cid]; const sk = (cid===r.id) ? Math.round(stat(r,'dip')*0.6) : (chan?stat(chan,'dip'):4);
      const adjCids = COUNTY_ADJ[countyOf(r.region)]||[]; const targets = adjCids.filter(cid=>{ const holder=countyHolder(cid); return holder && holder.id!==r.id && !r.claims.find(c=>c.rid===cid); });
      if(targets.length && Math.random() < (0.3+sk*0.04)){ const cid = targets[Math.floor(Math.random()*targets.length)]; r.claims.push({rid:cid, type:'unpressed', obtained:state.year}); if(countyHolder(cid)?.id===state.player) log(`${r.name}의 재상이 <b>${COUNTIES[cid].n}</b>에 대한 명분을 위조했습니다!`,'war'); }
    }
    if(r.council.marshal){ const mk2 = chars[r.council.marshal]; const msk = (!mk2||mk2.dead||r.council.marshal===r.id) ? Math.round(stat(r,'mar')*0.6) : stat(mk2,'mar'); REGIONS[r.region].troops=Math.min(REGIONS[r.region].cap, REGIONS[r.region].troops+Math.round(msk*0.8)); }
    if(r.council.steward){ const st = chars[r.council.steward]; const ssk = (!st||st.dead||r.council.steward===r.id) ? Math.round(stat(r,'stew')*0.6) : stat(st,'stew'); REGIONS[r.region].gold=Math.min(2000, REGIONS[r.region].gold+Math.round(ssk*0.6)); }
    r.claims = r.claims.filter(cl=>{ return !(cl.type==='unpressed' && state.year-cl.obtained>10); });
  }
}

function npcGetClaimTarget(r){ const valid = r.claims.filter(c=>{ if(!c.rid) return false; const capBid = COUNTIES[c.rid]?.capital || c.rid; return BARONIES[capBid]&&BARONIES[capBid].owner!==r.id; }); return valid.length?valid[Math.floor(Math.random()*valid.length)].rid:null; }
function npcUseClaim(r, rid){ r.claims = r.claims.filter(c=>c.rid!==rid); }
function npcGrantRevenge(defender, rid){ if(!defender.claims.find(c=>c.rid===rid)) defender.claims.push({rid, type:'revenge', obtained:state.year}); }

const NPC_ACTIVITIES = [
  { id:'feast', n:'연회', icon:'🍖', cond:(r,reg)=>reg.gold>80, run:(r,reg,adj)=>{ reg.gold -= 60; r.lastActivity = state.year; const guests = adj.filter(t=>t&&t.id!==r.id&&!t.dead); const invited = guests.sort(()=>Math.random()-0.5).slice(0,Math.min(guests.length, 1+Math.floor(Math.random()*2))); invited.forEach(g=>{ chOp(g,r,10); chOp(r,g,7); }); if(invited.some(g=>g.id===state.player) && Math.random()<0.5){ const p=playerChar(); popup({title:`${r.name}의 연회 초대`, sub:`${COUNTIES[countyOf(r.region)]?.n||''} 왕국`, body:`${r.name}이(가) 성대한 연회를 열고 당신을 초대했습니다.`, opts:[{t:'참석한다', d:'관계 +15, 스트레스 -10', f:()=>{ chOp(r,p,15); chOp(p,r,10); addStress(p,-10,'연회의 즐거움'); if(p.traits.includes('shy')) addStress(p,8,'내성적인 자의 고역'); log(`${r.name}의 연회에 참석했습니다.`,'dip'); }}, {t:'정중히 거절한다', d:'관계 -5', f:()=>{ chOp(r,p,-5); log(`${r.name}의 연회를 거절했습니다.`,'dip'); }}]}); } else if(invited.length>0){ log(`${r.name}이(가) ${invited[0].name}을(를) 연회에 초대했습니다.`,'dip'); } } },
  { id:'hunt', n:'사냥', icon:'🦌', cond:(r,reg)=>reg.gold>20, run:(r,reg,adj)=>{ reg.gold -= 15; r.lastActivity = state.year; const partner = adj.find(t=>t&&t.id!==r.id&&!t.dead&&opinion(r,t)>-20); if(!partner) return; chOp(partner,r,8); chOp(r,partner,8); if(partner.id===state.player){ popup({title:`${r.name}의 사냥 초대`, sub:'여흥', body:`${r.name}이(가) 가을 사냥에 동행할 것을 청합니다.\n자연 속에서 동료로서의 유대를 다질 기회입니다.`, opts:[{t:'함께 사냥을 나선다', d:'관계 +10, 스트레스 -8', f:()=>{ chOp(r,playerChar(),10); addStress(playerChar(),-8,'사냥의 즐거움'); }}, {t:'바쁘다고 한다', d:'관계 -5', f:()=>chOp(r,playerChar(),-5)}]}); } } },
  { id:'pilgrimage', n:'순례', icon:'✝', cond:(r)=>r.traits.includes('zealous')||r.traits.includes('pious')||Math.random()<0.3, run:(r,reg,adj)=>{ r.lastActivity = state.year; reg.pop = Math.min(100,(reg.pop||60)+6); adj.filter(t=>t&&t.id!==r.id&&(t.traits.includes('zealous')||t.traits.includes('pious'))).forEach(t=>{ chOp(t,r,6); chOp(r,t,6); }); if(adj.some(t=>t&&t.id===state.player)) log(`${r.name}이(가) 클론맥노이즈 수도원으로 순례를 떠났습니다.`,'dip'); } },
  { id:'diplomacy', n:'외교 방문', icon:'🤝', cond:(r,reg,adj)=>adj.some(t=>t&&t.id!==r.id&&opinion(r,t)>0), run:(r,reg,adj)=>{ r.lastActivity = state.year; const target = adj.find(t=>t&&t.id!==r.id&&!t.dead&&opinion(r,t)>0); if(!target) return; chOp(target,r,10); chOp(r,target,10); if(target.id===state.player){ popup({title:'외교 방문', sub:`${r.name}의 방문`, body:`${r.name}이(가) 직접 당신의 궁정을 찾아왔습니다.\n「먼스터의 명성이 에이레에 울려 퍼집니다, 전하.」`, opts:[{t:'환대한다', d:'관계 +15, 금 -20', f:()=>{ if(REGIONS[playerChar().region].gold>=20) REGIONS[playerChar().region].gold-=20; chOp(r,playerChar(),15); log(`${r.name}을(를) 극진히 맞이했습니다.`,'good'); }}, {t:'형식적으로 맞이한다', d:'관계 +5', f:()=>chOp(r,playerChar(),5)}]}); } else { log(`${r.name}이(가) ${target.name}의 궁정을 방문했습니다.`,'dip'); } } },
];

function npcActivityPulse(){
  for(const id in chars){
    const r = chars[id]; if(r.dead || !r.ruler || id===state.player || !r.region || !REGIONS[r.region]) continue; if(r.lastActivity >= state.year-1) continue; if(Math.random()>0.15) continue;
    const reg = REGIONS[r.region]; const adj = (ADJ[r.region]||[]).map(x=>ownerOf(x)).filter(Boolean); const possible = NPC_ACTIVITIES.filter(a=>a.cond(r,reg,adj)); if(!possible.length) continue;
    possible[Math.floor(Math.random()*possible.length)].run(r, reg, adj);
  }
}

function aiPulse(){
  const p=playerChar(); npcCouncilPulse(); npcActivityPulse(); if(state.month===1){ Object.values(chars).filter(c=>!c.dead&&c.ruler&&c.id!==state.player).forEach(buildNpcCouncil); }
  for(const rid in REGIONS){
    const r=ownerOf(rid); if(!r||r.id===state.player||!r.ruler) continue; if(Math.random()>(0.25 + aiW(r,'bold')*0.04 + aiW(r,'greed')*0.03)) continue;
    const adjTargets=(ADJ[rid]||[]).map(x=>ownerOf(x)).filter(t=>t&&t.id!==r.id&&!t.dead); if(!adjTargets.length) continue;
    const bold=aiW(r,'bold'), greed=aiW(r,'greed'), venge=aiW(r,'venge'), honor=aiW(r,'honor'), soc=aiW(r,'soc');
    const claimRid = npcGetClaimTarget(r);
    if(claimRid){ const defChar = ownerOf(claimRid); if(defChar && defChar.id!==r.id && !isAllied(r.id,defChar.id) && !truceBetween(r.id,defChar.id) && power(r)>power(defChar)*1.05 && opinion(r,defChar)<-5 && !state.wars.some(w=>w.atk===r.id||w.def===r.id) && Math.random()<(0.20+(bold*0.04))){ npcUseClaim(r, claimRid); if(defChar.id===state.player||defChar.id!==state.player) npcGrantRevenge(defChar, claimRid); declareWar(r, defChar, claimRid); if(defChar.id!==p.id) log(`<b>${r.name}</b>이(가) 명분을 내세워 <b>${COUNTIES[claimRid]?.n||claimRid}</b>에 선전포고했습니다.`,'war'); continue; } }
    const schemeTarget=adjTargets.find(t=>opinion(r,t)<-35&&(venge>1||honor<-2)); if(schemeTarget && Math.random()<(0.10+(venge*0.02))){ if(!state.schemes.some(s=>s.plotter===r.id)){ state.schemes.push({plotter:r.id, target:schemeTarget.id, months:0}); if(schemeTarget.id===p.id) log(`${r.name}이(가) 어둠 속에서 당신을 노리고 있다는 첩보가 들어왔습니다.`,'war'); } continue; }
    if((soc>=0||honor>1) && Math.random()<0.08+(soc*0.02)){ const allyTarget=adjTargets.find(t=>opinion(r,t)>15&&!isAllied(r.id,t.id)&&!truceBetween(r.id,t.id)); if(allyTarget){ formAlliance(r.id,allyTarget.id); if(allyTarget.id===p.id) npcDiplomacyToPlayer(r); else log(`<b>${r.name}</b>과(와) <b>${allyTarget.name}</b>이(가) 동맹을 맺었습니다.`,'dip'); continue; } }
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
    const o=ownerOf(rid); if(!o) return; let delta=0;
    if(o.dyn!=='우어 브리언' && REGIONS[rid].pop>30) delta-=1; if(state.wars.some(w=>w.atk===o.id||w.def===o.id)) delta-=2; if(REGIONS[rid].gold<50) delta-=1; if(!state.wars.length) delta+=0.5; if(o.traits.includes('generous')) delta+=1; if(o.traits.includes('arbitrary')) delta-=1;
    REGIONS[rid].pop=Math.max(0,Math.min(100,Math.round((REGIONS[rid].pop||60)+delta)));
    if(REGIONS[rid].pop<=25 && rid===playerChar().region && Math.random()<0.08){ rebellionEvent(rid); }
    if(REGIONS[rid].pop<=20 && rid!==playerChar().region && Math.random()<0.05){ REGIONS[rid].troops=Math.max(100, Math.round(REGIONS[rid].troops*0.8)); log(`${COUNTIES[countyOf(rid)]?.n||BARONIES[rid]?.n||'영지'}에서 민란이 일어났습니다. 병력이 일부 소모됐습니다.`,'war'); }
  }
}
function rebellionEvent(rid){
  const p=playerChar(); popup({title:'반란의 기운', sub:`${COUNTIES[countyOf(rid)]?.n||BARONIES[rid]?.n||'영지'} — 민중의견 위기`, body:`해당 지역의 농민들이 창과 낫을 들었습니다. 세금과 전쟁에 지친 그들의 눈에 분노가 타오르고 있습니다.\n\n민중의견: ${REGIONS[rid].pop}/100`, opts:[
    {t:'무력으로 진압한다', d:'병력 -150, 민중의견 +15 (단기), 스트레스 +15', f:()=>{ REGIONS[rid].troops=Math.max(100,REGIONS[rid].troops-150); REGIONS[rid].pop+=15; addStress(p,15,'피로 진압한 반란'); if(p.traits.includes('kind'))addStress(p,15,'친절한 자의 잔인함'); log(`${REGIONS[rid].n}의 반란을 진압했습니다. 피가 흘렀습니다.`,'war'); }},
    {t:'세금을 줄이고 달랜다', d:'금 -80, 민중의견 +25, 스트레스 -10', f:()=>{ REGIONS[rid].gold-=80; REGIONS[rid].pop+=25; addStress(p,-10,'민심을 얻은 기쁨'); if(p.traits.includes('greedy'))addStress(p,20,'탐욕스러운 자의 양보'); log(`${REGIONS[rid].n}의 민심을 달랬습니다. 금고가 가벼워졌습니다.`,'good'); }},
    {t:'무시한다', d:'민중의견 -10, 반란 확대 위험', f:()=>{ REGIONS[rid].pop-=10; addStress(p,10,'외면한 백성의 목소리'); log(`${REGIONS[rid].n}의 불만이 커지고 있습니다.`,'war'); }},
  ]});
}
function npcDiplomacyToPlayer(r){
  const p=playerChar(); const op=opinion(r,p); const kind=Math.random();
  if(kind<0.4&&op>-20){ popup({title:`${REGIONS[r.region].n}의 사절`, sub:'외교 — 동맹 제안', body:`${r.name}이(가) 사절을 보냈습니다.\n"에이레의 평화를 위해 손을 잡읍시다. 동맹을 제안합니다."`, opts:[{t:'수락한다', d:'상호 관계 +25', f:()=>{chOp(p,r,25);chOp(r,p,25); log(`<b>${r.name}</b>과(와) 동맹을 맺었습니다.`,'dip');}}, {t:'거절한다', d:'관계 -10', f:()=>{chOp(r,p,-10); log(`${r.name}의 동맹 제안을 거절했습니다.`,'dip');}}]}); }
  else if(kind<0.7){ popup({title:`${REGIONS[r.region].n}의 선물`, sub:'외교', body:`${r.name}이(가) 우호의 표시로 은제 술잔과 사냥개를 보냈습니다.`, opts:[{t:'받아들인다', d:'관계 +15', f:()=>{chOp(p,r,15);chOp(r,p,10);}}, {t:'돌려보낸다', d:'관계 -15', f:()=>{chOp(r,p,-15);}}]}); }
  else {
    const myKids=Object.values(chars).filter(k=>!k.dead&&(k.father===p.id||k.mother===p.id)&&!k.spouse&&age(k)>=12); if(!myKids.length){ chOp(r,p,3); return; } const kid=myKids[0];
    popup({title:`혼담`, sub:`외교 — ${REGIONS[r.region].n}`, body:`${r.name}이(가) 가문 간 혼인을 제안합니다.\n대상: 당신의 ${kid.sex==='m'?'아들':'딸'} <b>${kid.name}</b>(${age(kid)}세)\n\n혼인은 두 가문을 묶는 가장 단단한 사슬입니다.`, opts:[
      {t:'혼약을 맺는다', d:'관계 +35, 동맹', f:()=>{ const sp=mk({name:r.dyn+' 가문의 '+(kid.sex==='m'?'규수':'자제'), dyn:r.dyn, sex:kid.sex==='m'?'f':'m', byear:kid.byear, bmonth:1, bday:1, traits:randTraits(2), base:randStats(), edu:1, eduFocus:'dip', courtOf:p.region}); if(age(kid)>=16){ kid.spouse=sp.id; sp.spouse=kid.id; } chOp(p,r,35); chOp(r,p,35); log(`<b>${kid.name}</b>과(와) ${r.dyn} 가문의 혼약이 성사되었습니다.`,'fam'); }},
      {t:'정중히 거절한다', d:'관계 -10', f:()=>chOp(r,p,-10)},
    ]});
  }
}

/* ---------- 난수 인카운터 풀 (중략본 결합) ---------- */
const EVENTS=[
  {cond:c=>true, w:3, run:c=>popup({title:'흉작의 소문', sub:'영지', body:'올해 보리 수확이 시원치 않다는 보고가 올라왔습니다. 농민들이 동요하고 있습니다.', opts:[{t:'곡식 창고를 연다', d:'금 -40, 민심 +10, 스트레스 +10', f:()=>{REGIONS[c.region].gold-=40; REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+10); addStress(c,10,'무거운 책임감'); if(c.traits.includes('greedy'))addStress(c,20,'탐욕스러운 자의 베풂');}}, {t:'버티라고 한다', d:'민심 -15, 스트레스 +5', f:()=>{REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-15); addStress(c,5,'민심 악화를 외면함'); if(c.traits.includes('just'))addStress(c,15,'공정한 자의 냉혹함');}}]})},
  {cond:c=>true, w:2, run:c=>popup({title:'전염병 소식', sub:'영지', body:'인근 마을에서 발병이 시작됐습니다. 아직 성 안까지는 들어오지 않았지만, 농민들이 도망치고 있습니다.', opts:[{t:'의원을 보내고 격리한다', d:'금 -60, 민심 +8, 병력 -50', f:()=>{REGIONS[c.region].gold-=60; REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+8); REGIONS[c.region].troops=Math.max(100,REGIONS[c.region].troops-50); log('전염병을 조기에 막았습니다.','good');}}, {t:'방치한다', d:'민심 -20, 병력 -100', f:()=>{REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-20); REGIONS[c.region].troops=Math.max(100,REGIONS[c.region].troops-100); addStress(c,15,'퍼진 전염병'); log('전염병이 번졌습니다.','war');}}]})},
  {cond:c=>REGIONS[c.region].gold>200, w:2, run:c=>popup({title:'성벽 보수', sub:'영지', body:'성벽 일부가 무너졌습니다. 이번 겨울 전에 손을 봐야 할 것 같습니다.', opts:[{t:'즉시 보수한다', d:'금 -80, 병력 +80, 민심 +5', f:()=>{REGIONS[c.region].gold-=80; REGIONS[c.region].cap=(REGIONS[c.region].cap||1200)+80; REGIONS[c.region].troops=Math.min(REGIONS[c.region].cap, REGIONS[c.region].troops+80); REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+5); log('성벽을 보수했습니다. 방어력이 높아졌습니다.','good');}}, {t:'다음 해로 미룬다', d:'스트레스 +8', f:()=>addStress(c,8,'미뤄진 숙제')}]})},
  {cond:c=>(REGIONS[c.region].pop||60)<50, w:3, run:c=>popup({title:'민심의 균열', sub:'영지', body:'시장의 소문이 심상치 않습니다. 세금이 너무 무겁다, 왕이 백성을 돌보지 않는다는 말들이 오갑니다.\n\n민중의견: '+REGIONS[c.region].pop+'/100', opts:[{t:'공개 재판을 열어 신뢰를 쌓는다', d:'민심 +15, 위신 +10, 스트레스 +10', f:()=>{REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+15); state.prestige+=10; addStress(c,10,'무거운 판결의 책임');}}, {t:'밀정을 풀어 선동자를 찾는다', d:'민심 -5, 음모자 제거', f:()=>{REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-5); log('밀정이 선동자를 적발했습니다.','dip');}}]})},
  {cond:c=>true, w:3, run:c=>popup({title:'사냥 초대', sub:'여흥', body:'시종장이 가을 사냥을 제안합니다. 숲에는 사슴이 많고, 왕에게는 휴식이 필요합니다.', opts:[{t:'사냥을 나간다', d:'스트레스 -20', f:()=>{addStress(c,-20,'사냥의 즐거움'); if(c.traits.includes('brave'))addStress(c,-5,'용맹한 피의 해방');}}, {t:'정무가 우선이다', d:'금 +20, 스트레스 +5', f:()=>{REGIONS[c.region].gold+=20; addStress(c,5,'쉬지 못하는 왕'); if(c.traits.includes('diligent'))addStress(c,-5,'근면한 자의 보람');}}]})},
  {cond:c=>true, w:2, run:c=>popup({title:'음유시인', sub:'궁정', body:'떠돌이 시인이 궁정에 찾아와 당신의 가문을 칭송하는 노래를 지어 바치겠다 합니다.', opts:[{t:'후원한다', d:'금 -25, 위신 +15, 스트레스 -10', f:()=>{REGIONS[c.region].gold-=25; state.prestige+=15; addStress(c,-10,'노래의 위안');}}, {t:'내쫓는다', d:'스트레스 +5', f:()=>{ addStress(c,5,'쫓겨난 시인'); if(c.traits.includes('generous'))addStress(c,10,'관대한 자의 인색함'); }}]})},
  {cond:c=>stressLvl(c)>=1, w:5, run:c=>popup({title:'잠 못 드는 밤', sub:'내면', body:'또 새벽입니다. 촛불이 다 타들어 가도록 잠이 오지 않습니다.\n창밖 어둠 속에서 누군가 지켜보는 것만 같습니다.', opts:[{t:'주교에게 고해한다', d:'스트레스 -20', f:()=>addStress(c,-20,'고해의 위안')}, {t:'술로 잊는다', d:'스트레스 -30, 절제 위반', f:()=>{addStress(c,-30,'취기'); if(c.traits.includes('temperate'))addStress(c,25,'절제하는 자의 폭음');}}, {t:'그냥 버틴다', d:'스트레스 +10', f:()=>addStress(c,10,'혼자 삼킨 고통')}]})},
  {cond:c=>stressLvl(c)===0, w:2, run:c=>popup({title:'맑은 아침', sub:'내면', body:'오랜만에 개운하게 눈을 떴습니다. 샤넌 강 위로 아침 안개가 걷히고 있습니다. 작은 평화입니다.', opts:[{t:'감사히 받아들인다', d:'스트레스 -5', f:()=>addStress(c,-5,'고요한 아침의 선물')}]})},
  {cond:c=>true, w:2, run:c=>{ const others=Object.values(chars).filter(k=>!k.dead&&k.ruler&&k.id!==c.id); if(!others.length) return; const o=others[Math.floor(Math.random()*others.length)]; popup({title:'국경의 분쟁', sub:REGIONS[o.region]?REGIONS[o.region].n:'인근 왕국', body:`${REGIONS[o.region]?REGIONS[o.region].n:'인근'}의 목동들이 국경을 넘어 우리 농민들과 충돌했습니다. 사상자가 나왔습니다.`, opts:[{t:'배상을 요구한다', d:'관계 -15, 위신 +5', f:()=>{chOp(o,c,-15); chOp(c,o,-10); state.prestige+=5; if(c.traits.includes('wrathful'))addStress(c,-5,'분노를 표출한 통쾌함');}}, {t:'조용히 묻는다', d:'스트레스 +10', f:()=>{addStress(c,10,'삼킨 분노'); if(c.traits.includes('wrathful'))addStress(c,15,'분노를 누른 대가');}}]}); }},
];

function randomEventPulse(){
  if(state.over) return; const c=playerChar(); if(!c||c.dead||!c.region||!REGIONS[c.region]) return;
  if(Math.random()<0.18){
    const pool=EVENTS.filter(e=>{ try{ return e.cond(c); }catch(err){ return false; } }); let tw=pool.reduce((s,e)=>s+e.w,0), r=Math.random()*tw;
    for(const e of pool){ r-=e.w; if(r<=0){ try{ e.run(c); }catch(err){} break; } }
  }
}

/* ---------- 샌드박스 플레이어 커맨드 조작 ---------- */
function openBuildMenu(bid){
  const b=BARONIES[bid]; if(!b) return; const existing=b.buildings||[]; const seatGold=BARONIES[playerChar().region]?.gold||0;
  const opts=Object.entries(BUILDING_TYPES).filter(([type])=>!existing.includes(type)&&(b.buildings||[]).length+(b.building_queue?1:0)<b.slots).map(([type,bt])=>({
    t:`${bt.icon} ${bt.n}`, d:`금 ${bt.cost} · ${bt.buildMonths}개월 · ${bt.desc}${seatGold<bt.cost?' (금 부족)':''}`, f: seatGold>=bt.cost ? ()=>{ startBuilding(bid,type); renderCourt(); } : ()=>log('금이 부족합니다.')
  }));
  opts.push({t:'취소'});
  showModal({title:`${b.n} 건설`, sub:`슬롯 ${b.slots-(existing.length+(b.building_queue?1:0))}/${b.slots} · 금 ${Math.round(seatGold)}`, body:'건설할 건물을 선택하세요.', opts}); pause();
}

function openCounty(cid){
  const holder=countyHolder(cid); if(!holder) return; const war=state.wars.find(w=>w.targetRid===cid);
  if(war&&(war.atk===state.player||war.def===state.player)){ const cnt=COUNTIES[cid], bids=cnt.baronies, occ=war.occupied||[]; const my=war.atk===state.player?war.score:-war.score; const siegeLines=bids.map(bid=>`${BARONIES[bid]?.n||bid}: ${occ.includes(bid)?'⚔ 점령됨':'🛡 방어중'}`).join('\n'); popup({title:`${cnt.n} 공성전`, sub:'전황 상세', body:`전황 점수: ${my>0?'+':''}${Math.round(my)}%\n\n${siegeLines}`, opts:[{t:'닫기'}]}); return; }
  openRegion(COUNTIES[cid]?.capital, cid);
}

function openRegion(rid, cid_hint){
  const p=playerChar(); if(!p) return; const dispName=(cid_hint&&COUNTIES[cid_hint]?.n)||BARONIES[rid]?.n||'영지'; const c=ownerOf(rid); if(!c) return;
  if(c.id===p.id){
    const cid=cid_hint||countyOf(rid); const cnt=COUNTIES[cid]; const totalTroops=cnt?cnt.baronies.reduce((s,b)=>s+(BARONIES[b]?.troops||0),0):(BARONIES[rid]?.troops||0); const totalGold=Math.round(BARONIES[rid]?.gold||0); const bldgs=cnt?cnt.baronies.flatMap(b=>BARONIES[b]?.buildings?.filter(x=>x.done).map(x=>BUILDINGS[x.type]?.n)||[]).join('·')||'없음':'없음';
    showModal({title:dispName, sub:'내 영지', body:'', html:`<div class="kv"><span>백작령</span><span>${cnt?.n||dispName}</span></div><div class="kv"><span>총 병력</span><span>${totalTroops}</span></div><div class="kv"><span>금고</span><span>${totalGold}</span></div><div class="kv"><span>완공 건물</span><span>${bldgs}</span></div><div class="kv"><span>남작령 수</span><span>${cnt?.baronies.length||1}</span></div>`, opts:[{t:'닫기'}]}); return;
  }
  const op=opinion(c,p), myOp=opinion(p,c); const atWar=state.wars.some(w=>(w.atk===p.id&&w.def===c.id)||(w.atk===c.id&&w.def===p.id)); const truce=truceBetween(p.id,c.id); const cid=cid_hint||countyOf(rid); const defTroops=cid&&COUNTIES[cid]?COUNTIES[cid].baronies.reduce((s,b)=>s+(BARONIES[b]?.troops||0),0):(BARONIES[rid]?.troops||0);
  const html=`<div class="kv"><span>지배자</span><span>${c.name} (${age(c)}세)</span></div><div class="kv"><span>가문</span><span>${c.dyn}</span></div><div class="kv"><span>성격</span><span>${c.traits.map(t=>TRAITS[t]?.n||'').filter(Boolean).join(' · ')||'—'}</span></div><div class="kv"><span>능력</span><span>외${stat(c,'dip')} 무${stat(c,'mar')} 내${stat(c,'stew')} 음${stat(c,'intr')} 학${stat(c,'learn')}</span></div><div class="kv"><span>이 백작령 병력</span><span>${defTroops}</span></div><div class="kv"><span>전체 전력</span><span>${Math.round(power(c))}</span></div><div class="kv"><span>나를 보는 시각</span><span class="${op>15?'relGood':op<-15?'relBad':'relMid'}">${op>0?'+':''}${op}</span></div><div class="kv"><span>내가 보는 시각</span><span class="${myOp>15?'relGood':myOp<-15?'relBad':'relMid'}">${myOp>0?'+':''}${myOp}</span></div>${isAllied(p.id,c.id)?'<div class="kv"><span>관계</span><span style="color:#6aaa7a">⚔ 동맹</span></div>':''}${c.liege===p.id?'<div class="kv"><span>관계</span><span style="color:#c9a227">👑 봉신</span></div>':''}`;
  const opts=[];
  if(!atWar){
    opts.push({t:'선물 보내기', d:'금 50 — 관계 +15', f:()=>{ const seatB=BARONIES[p.region]; if(!seatB||seatB.gold<50){log('금이 부족합니다.');return;} seatB.gold-=50; chOp(c,p,15); log(`<b>${c.name}</b>에게 선물을 보냈습니다.`,'dip'); if(p.traits.includes('greedy'))addStress(p,10,'탐욕스러운 자의 선물'); }});
    if(!isAllied(p.id,c.id)){ opts.push({t:'동맹 제안', d:`수락 가능성: ${allianceChance(c,p)}%`, f:()=>{ if(Math.random()*100<allianceChance(c,p)){ formAlliance(p.id,c.id); chOp(c,p,25); chOp(p,c,25); log(`<b>${c.name}</b>이(가) 동맹을 수락했습니다!`,'good'); } else { chOp(c,p,-5); log(`<b>${c.name}</b>이(가) 동맹을 거절했습니다.`,'dip'); } }}); }
    else { opts.push({t:'동맹 파기', d:'관계 -40, 5년 휴전', f:()=>{ breakAlliance(p.id,c.id); log(`${c.name}과(와)의 동맹을 파기했습니다.`,'war'); }}); }
    if(c.liege!==p.id){ opts.push({t:'봉신 요청', d:`수락 가능성: ${vassalChance(c,p)}%`, f:()=>{ if(Math.random()*100<vassalChance(c,p)){ c.liege=p.id; c.ruler=true; chOp(c,p,20); log(`<b>${c.name}</b>이(가) 봉신을 수락했습니다!`,'good'); checkVictoryHint(); } else { chOp(c,p,-20); log(`<b>${c.name}</b>이(가) 봉신 요청을 거절했습니다.`,'dip'); } }}); }
    opts.push({t:'혼인 교섭', d:'가문 간 혼약 — 관계 +30', f:()=>tryMarriage(c)});
    opts.push({t:'살해 모략', d:'은밀한 칼 — 발각 시 관계 악화', f:()=>{ if(startScheme(p,c)) log('어둠 속에서 칼을 갈기 시작합니다...','war'); else log('이미 진행 중인 모략입니다.'); }});
    if(!truce){ if(isAllied(p.id,c.id)){ opts.push({t:'동맹 파기 후 선전포고 가능', d:'먼저 동맹을 파기하세요', f:()=>{}}); } else { const myClaims=claimsForRegion(c); opts.push({t:myClaims.length>0?`선전포고 (명분 ${myClaims.length}개)`:'선전포고 (명분 없음)', d:`전력 ${Math.round(power(p))} vs ${Math.round(power(c))}`, f:()=>{ closePanel('court'); closePanel('dec'); openDeclareWar(c.id); }}); } } else { opts.push({t:'휴전 중', d:'전쟁 불가', f:()=>{}}); }
  } else { opts.push({t:'교전 중', d:'전쟁이 끝나야 외교 가능', f:()=>{}}); }
  opts.push({t:'닫기'}); showModal({title:`${dispName}`, sub:`${c.name}의 영지`, body:'', html, opts}); pause();
}

function allianceChance(c,p){ return Math.max(2,Math.min(95,Math.round(30+opinion(c,p)+aiW(c,'soc')*5+(power(p)>power(c)?10:0)+Math.round((state.prestige-120)/12)))); }
function vassalChance(c,p){ let v=-20+opinion(c,p); const ratio=power(p)/power(c); v+=ratio>2?45:ratio>1.5?25:ratio>1.2?10:-20; v-=aiW(c,'bold')*6; if(c.traits.includes('content'))v+=15; if(c.traits.includes('craven'))v+=15; if(c.traits.includes('ambitious'))v-=20; return Math.max(1,Math.min(85,Math.round(v+Math.round((state.prestige-120)/12)*1.5))); }

function tryMarriage(c){
  const p=playerChar(); const candidates=[]; if(!p.spouse) candidates.push({...p, _label:'본인'});
  Object.values(chars).filter(k=>!k.dead&&(k.father===p.id||k.mother===p.id)&&!k.spouse&&age(k)>=6).forEach(k=>candidates.push(k));
  if(!candidates.length){ log('혼인시킬 미혼 가족이 없습니다.'); return; }
  const opts=candidates.map(kid=>({ t:kid.id===p.id ? `${kid.name} (본인 · ${age(kid)}세)` : `${kid.name} (${kid.sex==='m'?'아들':'딸'} · ${age(kid)}세)`, d:age(kid)<16?'성인이 되면 혼인 — 지금은 혼약':'즉시 혼인', f:()=>doMarriage(kid.id===p.id?p:kid, C) }));
  opts.push({t:'그만둔다'}); showModal({title:'혼인 교섭', sub:`${c.dyn} 가문과의 혼담`, body:'누구의 혼처를 알아보시겠습니까?', opts});
}
function doMarriage(candidate, c){
  const p=playerChar(); if(Math.random()*100<(40+opinion(c,p)+aiW(c,'soc')*4+Math.round((state.prestige-120)/12))){
    const sp=mk({name:c.dyn+' 가문의 '+(candidate.sex==='m'?'규수':'자제'), dyn:c.dyn, sex:candidate.sex==='m'?'f':'m', byear:candidate.byear, bmonth:2, bday:2, traits:randTraits(2), base:randStats(), edu:1, eduFocus:'dip', courtOf:p.region});
    if(age(candidate)>=16){ candidate.spouse=sp.id; sp.spouse=candidate.id; } chOp(c,p,30); chOp(p,c,30); log(`<b>${candidate.name}</b>(본인/가족)과(와) ${c.dyn} 가문의 혼약 성사 — 두 가문이 맺어졌습니다.`,'good');
  } else { chOp(c,p,-5); log(`${c.name}이(가) 혼담을 정중히 물렸습니다.`,'dip'); }
}

/* ---------- 명분 전쟁 설계 메커니즘 ---------- */
const CB_TYPES = {
  pressed:   { n:'확정 주장',   icon:'⚔',  cost:50,  desc:'전쟁으로 확정된 영토 주장', color:'#c9a227' },
  unpressed: { n:'미확정 주장', icon:'📜', cost:100, desc:'위조되거나 약한 영토 주장',  color:'#8a9a6a' },
  revenge:   { n:'복수 선포',   icon:'🩸', cost:0,   desc:'침략당한 영지 탈환 명분',    color:'#9e3535' },
};
function hasClaim(rid){ return state.claims.find(c=>c.rid===rid); }
function claimsForRegion(def){ const defCids = countiesOf(def.id); return state.claims.filter(c=>defCids.includes(c.rid)); }
function claimName(rid){ return COUNTIES[rid]?.n||BARONIES[rid]?.n||rid; }
function addClaim(rid, type){ if(hasClaim(rid)) return; state.claims.push({rid, type, obtained:state.year}); log(`<b>${claimName(rid)}</b>에 대한 ${CB_TYPES[type].n}을(를) 획득했습니다.`, 'dip'); }
function removeClaim(rid){ state.claims = state.claims.filter(c=>c.rid!==rid); }
function grantRevengeClaim(rid){ if(!hasClaim(rid)) addClaim(rid, 'revenge'); }
function claimExpirePulse(){ state.claims = state.claims.filter(c=>{ if(c.type==='unpressed' && state.year - c.obtained > 10){ log(`${COUNTIES[c.rid]?.n||BARONIES[c.rid]?.n||'영지'}에 대한 미확정 주장이 만료됐습니다.`, 'dip'); return false; } return true; }); }

function openDeclareWar(defId){
  const p = playerChar(); const def = chars[defId]; if(!def || def.dead || !p) return; pause();
  if(truceBetween(p.id, def.id)){ showModal({title:'선전포고 불가', sub:'휴전 중', body:`${def.name}과(와) 현재 휴전 협정이 유지되고 있습니다.`, opts:[{t:'닫기'}]}); return; }
  if(isAllied(p.id, def.id)){ showModal({title:'선전포고 불가', sub:'동맹국', body:`${def.name}은(는) 현재 동맹국입니다. 먼저 동맹을 파기하세요.`, opts:[{t:'동맹 파기', f:()=>{ breakAlliance(p.id,def.id); openDeclareWar(defId); }}, {t:'닫기'}]}); return; }
  const myClaims = claimsForRegion(def);
  if(myClaims.length === 0){ showModal({title:'명분 없음', sub:'선전포고 불가', body:`${def.name}에 대한 명분이 없습니다. 재상에게 위조를 지시하거나 선제 침략을 받아 복수 명분을 수립하십시오.`, opts:[{t:'닫기'}]}); return; }
  let html = `<div class="kv"><span>상대 전력</span><span>${Math.round(power(def))} vs 내 전력 ${Math.round(power(p))}</span></div><div class="kv"><span>위신</span><span>${state.prestige}</span></div><div style="margin:12px 0 6px;font-size:.72rem;letter-spacing:.2em;color:var(--gold-dim)">보유 명분</div>`;
  const opts = [];
  myClaims.forEach(cl=>{
    const cbInfo = CB_TYPES[cl.type]; const canAfford = state.prestige >= cbInfo.cost; const rid = cl.rid;
    opts.push({ t:`${cbInfo.icon} ${cbInfo.n} — ${claimName(rid)}`, d:`위신 ${cbInfo.cost} 소모`, f: canAfford ? ()=>{ state.prestige -= cbInfo.cost; if(cl.type==='unpressed') cl.type='pressed'; declareWar(p, def, rid); removeClaim(rid); } : ()=>{ log('위신이 부족합니다.','dip'); } });
  });
  opts.push({t:'취소'}); showModal({title:`${def.name}에 선전포고`, sub:'전쟁 선포', body:'', html, opts});
}

const COUNCIL_ROLES = {
  chancellor: { n:'재상',     skill:'dip',   icon:'⚖', desc:'외교와 봉신 관리' },
  marshal:    { n:'원수',     skill:'mar',   icon:'⚔', desc:'군사 훈련과 병력 강화' },
  steward:    { n:'재무관',   skill:'stew',  icon:'💰', desc:'세금 징수와 영지 개발' },
  spymaster:  { n:'첩보관',   skill:'intr',  icon:'🗡', desc:'모략 방어와 비밀 탐색' },
  chaplain:   { n:'사제',     skill:'learn', icon:'✝', desc:'민심 안정 · 교회법 명분 조작' },
};

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
          if(rnd){ chOp(rnd,p, Math.round(sk*0.8)); popup({title:'재상의 외교', sub:`${c.name}의 보고`, body:`${c.name}이(가) 인접 왕국과의 관계를 개선했습니다.`, opts:[{t:'잘 했다', f:()=>{chOp(c,p,5);}}]}); }
        } else { state.prestige=Math.max(0,state.prestige-10); popup({title:'재상의 실수', sub:`${c.name}의 보고`, body:`${c.name}이(가) 외교 교섭에서 실언을 저질렀습니다.`, opts:[{t:'질책한다', f:()=>{chOp(c,p,-10); addStress(p,5,'재상의 실책');}}]}); }
      }
    }
    if(role==='marshal'){ reg.troops = Math.min(reg.cap, reg.troops + Math.round(sk*1.5)); if(Math.random()<0.08){ if(positive){ popup({title:'원수의 훈련 보고', sub:`${c.name}의 보고`, body:`${c.name}이(가) 병사들의 훈련 성과를 보고합니다.`, opts:[{t:'격려한다', f:()=>{reg.troops+=50; chOp(c,p,5); log('병력이 강화됐습니다.','war');}}]}); } else { reg.troops = Math.max(100, reg.troops - 80); popup({title:'훈련 중 사고', sub:`${c.name}의 보고`, body:`${c.name}의 강훈련 중 부상자가 나왔습니다.`, opts:[{t:'어쩔 수 없다', f:()=>{addStress(p,5,'병사 손실');}}]}); } } }
    if(role==='steward'){ reg.gold += Math.round(sk * 1.2); if(Math.random()<0.08){ if(positive){ const bonus = 30 + sk*4; popup({title:'재무관의 보고', sub:`${c.name}의 보고`, body:`${c.name}이(가) 효율적인 세금 징수로 추가 수입을 올렸습니다.`, opts:[{t:'수고했다', f:()=>{reg.gold+=bonus; chOp(c,p,5); log(`재무관이 금 ${bonus}을 추가로 확보했습니다.`,'good');}}]}); } else { reg.gold = Math.max(0, reg.gold-40); reg.pop = Math.max(0, (reg.pop||60)-5); popup({title:'세금 마찰', sub:`${c.name}의 보고`, body:`${c.name}의 세금 징수 방식에 백성들이 반발합니다.`, opts:[{t:'...완화한다', f:()=>{reg.gold-=20; reg.pop=Math.min(100,(reg.pop||60)+8); chOp(c,p,-5);}}]}); } } }
    if(role==='spymaster'){ state.schemes.forEach(s=>{ if(s.target===p.id) s.defBonus=(s.defBonus||0)+sk*2; }); if(Math.random()<0.08){ if(positive){ const enemy=Object.values(chars).find(k=>!k.dead&&k.ruler&&k.id!==p.id&&state.schemes.some(s=>s.plotter===k.id&&s.target===p.id)); if(enemy){ state.schemes=state.schemes.filter(s=>!(s.plotter===enemy.id&&s.target===p.id)); popup({title:'첩보관의 성과', sub:`${c.name}의 보고`, body:`${c.name}이(가) ${enemy.name}의 모략을 사전에 분쇄했습니다.`, opts:[{t:'잘 했다', f:()=>{chOp(c,p,10); addStress(p,-5,'위기 모면');}}]}); } else { state.prestige+=8; log(`${c.name}이(가) 유용한 정보를 수집했습니다.`,'dip'); } } else { popup({title:'첩보 유출', sub:`${c.name}의 보고`, body:`첩보 기밀이 유출되었을 가능성이 있습니다.`, opts:[{t:'처리한다', f:()=>{addStress(p,10,'배신의 충격'); chOp(c,p,-15);}}]}); } } }
    if(role==='chaplain'){ reg.pop = Math.min(100, (reg.pop||60) + Math.round(sk*0.15)); state.prestige += Math.round(sk * 0.3); if(Math.random()<0.08){ if(positive){ popup({title:'사제의 설교', sub:`${c.name}의 보고`, body:`${c.name}이(가) 민심을 달래는 신앙 설교를 전개합니다.`, opts:[{t:'좋은 일이다', f:()=>{reg.pop=Math.min(100,(reg.pop||60)+10); state.prestige+=5; addStress(p,-8,'백성의 사랑');}}]}); } else { reg.pop = Math.max(0,(reg.pop||60)-8); popup({title:'사제의 설교 논란', sub:`${c.name}의 보고`, body:`사제의 정치적 언동에 따라 백성들 사이에 파문이 일어났습니다.`, opts:[{t:'경고한다', f:()=>{chOp(c,p,-10); reg.pop=Math.min(100,(reg.pop||60)+3);}}]}); } } }
  }
}

/* ---------- 렌더러 커스텀 바인딩 파트 ---------- */
function renderCourt(){
  const p=playerChar(); if(!p) return; const fam=Object.values(chars).filter(c=>!c.dead&&(c.id===p.id||c.spouse===p.id||c.father===p.id||c.mother===p.id||c.courtOf===p.region)); const reg=REGIONS[p.region]; const rn=reg?reg.n:'—';
  const roleBonus={ chancellor: cid=>`위신 +${Math.round(stat(chars[cid],'dip')*0.4)}/월`, marshal: cid=>`병력 +${Math.round(stat(chars[cid],'mar')*1.5)}/월`, steward: cid=>`금 +${Math.round(stat(chars[cid],'stew')*1.2)}/월`, spymaster: cid=>`방어 +${stat(chars[cid],'intr')*2}`, chaplain: cid=>`민심 보정` };
  let html=`<div style="font-size:.7rem;letter-spacing:.2em;color:var(--gold-dim);margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--line)">자문회 임명</div>`;
  for(const role in COUNCIL_ROLES){
    const rinfo=COUNCIL_ROLES[role]; const cid=state.council[role]; const councilor=cid&&chars[cid]&&!chars[cid].dead?chars[cid]:null; if(!councilor&&cid) state.council[role]=null;
    const assignedIds=Object.values(state.council).filter(Boolean); const candidates=fam.filter(c=>c.id!==p.id && c.courtOf===p.region && age(c)>=16 && !assignedIds.includes(c.id));
    html+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px dotted #2c2316"><span style="font-size:1.1rem;width:22px;text-align:center">${rinfo.icon}</span><div style="flex:1"><div style="font-size:.82rem;color:var(--parch)">${rinfo.n}</div><div style="font-size:.72rem;color:var(--parch-dim)">${rinfo.desc}</div></div><div style="text-align:right">`;
    if(councilor){ html+=`<div style="font-size:.8rem;color:var(--gold)">${councilor.name}</div><div style="font-size:.7rem;color:var(--parch-dim)">${rinfo.icon} ${stat(councilor,rinfo.skill)}</div><div style="font-size:.68rem;color:#7a9a6a;margin:1px 0">${roleBonus[role](councilor.id)}</div><button class="p-action" style="margin:3px 0 0;padding:3px 8px;font-size:.7rem" onclick="appointCouncilor('${role}',null)">해임</button>`; }
    else { html+=`<div style="font-size:.75rem;color:var(--parch-dim);margin-bottom:3px">공석</div>`; if(candidates.length){ html+=`<select style="background:#191309;color:var(--parch);border:1px solid var(--line);font-size:.72rem;padding:2px 4px;max-width:120px" onchange="if(this.value)appointCouncilor('${role}',this.value)"><option value="">임명...</option>`; candidates.sort((a,b)=>stat(b,rinfo.skill)-stat(a,rinfo.skill)).forEach(c=>{ html+=`<option value="${c.id}">${c.name} (${stat(c,rinfo.skill)})</option>`; }); html+=`</select>`; } else { html+=`<div style="font-size:.7rem;color:#5a4a3a">인물 없음</div>`; } }
    html+=`</div></div>`;
  }
  const myVassals=vassalsOf(p.id);
  if(myVassals.length>0){ html+=`<div style="font-size:.7rem;letter-spacing:.2em;color:var(--gold-dim);margin:8px 0;border-bottom:1px solid var(--line)">봉신 목록</div>`; myVassals.forEach(v=>{ html+=`<div class="p-row"><span class="k">${v.name}</span><span>호감도 ${opinion(v,p)}</span></div>`; }); }
  
  html+=`<div style="font-size:.7rem;letter-spacing:.2em;color:var(--gold-dim);margin:14px 0 6px;padding-bottom:4px;border-bottom:1px solid var(--line)">건물 관리</div>`;
  regionsOf(p.id).forEach(bid=>{
    const b=BARONIES[bid]; if(!b) return; const bldTxt=(b.buildings||[]).map(t=>BUILDING_TYPES[t]?.icon+BUILDING_TYPES[t]?.n).join(' ');
    html+=`<div style="font-size:.78rem;padding:5px 0;border-bottom:1px dotted #2c2316"><span style="color:var(--gold)">${b.n}</span> <span style="font-size:.72rem;color:var(--parch-dim)">슬롯 ${b.slots - b.buildings.length}/${b.slots}</span><br><span>${bldTxt||'건물 없음'}</span>${b.buildings.length < b.slots ?`<button class="p-action" style="margin:3px 0 0;padding:2px 8px;font-size:.7rem" onclick="openBuildMenu('${bid}')">건설</button>`:''}</div>`;
  });

  html+=`<div style="font-size:.7rem;letter-spacing:.2em;color:var(--gold-dim);margin:12px 0 8px;padding-bottom:6px;border-bottom:1px solid var(--line)">${rn} 궁정의 일원</div><table style="width:100%">`;
  fam.forEach(c=>{
    const rel=c.id===p.id?'본인':c.spouse===p.id?'배우자':(c.father===p.id||c.mother===p.id)?'자녀':'궁정인';
    html+=`<tr style="border-bottom:1px dotted #2c2316"><td style="padding:6px 4px"><b>${c.name}</b> <span style="font-size:.74rem">${age(c)}세</span><br><small>${rel}</small></td><td style="font-size:.76rem">${c.traits.map(t=>TRAITS[t]?.n).join(' · ')||(c.childTrait?CHILD_TRAITS[c.childTrait].n:'—')}</td><td style="text-align:right;font-size:.74rem">외${stat(c,'dip')} 무${stat(c,'mar')}<br>내${stat(c,'stew')} 음${stat(c,'intr')}</td></tr>`;
  });
  html+='</table>'; document.getElementById('courtContent').innerHTML=html;
}
function openCourt(){ togglePanel('court'); }

let _decActs=[];
function renderDec(){
  const p=playerChar(); if(!p) return; const n=playerRegions().length; _decActs=[]; const items=[];
  function addDec(t,d,enabled,fn){ const i=_decActs.length; _decActs.push(fn); items.push({t,d,enabled,i}); }
  if(n>=4&&!state.kingdomFormed){ addDec('⚜ 아일랜드 왕국 선포',`금 250 필요 · 위신 +200`, BARONIES[p.region]?.gold>=250, ()=>{ BARONIES[p.region].gold-=250; state.kingdomFormed=true; state.prestige+=200; log('<b>아일랜드 왕국</b> 선포!','good'); closePanel('dec'); popup({title:'아일랜드 왕국', sub:'대관식', body:'캐셸의 바위 위에서 왕관을 수여받습니다.', opts:[{t:'만세!'}]}); }); }
  if(playerDuchies().length>=7){ addDec('☀ 하이킹에 등극한다','에이레 전토 통일 완료', true, ()=>{ closePanel('dec'); victory(); }); }
  addDec('연회를 개최한다',`금 60 · 호감도 +8 · 스트레스 -20`, BARONIES[p.region]?.gold>=60, ()=>{ BARONIES[p.region].gold-=60; addStress(p,-20,'연회'); Object.values(chars).forEach(r=>{if(r.ruler&&r.id!==p.id)chOp(r,p,8);}); log('성대한 연회를 열었습니다.','good'); renderDec(); });
  addDec('클론맥노이즈 순례',`금 30 · 스트레스 -25`, BARONIES[p.region]?.gold>=30, ()=>{ BARONIES[p.region].gold-=30; addStress(p,-25,'순례'); state.prestige+=10; log('수도원에서 기도를 올렸습니다.','fam'); renderDec(); });
  addDec('징집병 소집',`금 80 · 병력 +200`, BARONIES[p.region]?.gold>=80, ()=>{ BARONIES[p.region].gold-=80; BARONIES[p.region].troops+=200; log('징집병 200명이 충원됐습니다.','war'); renderDec(); });

  let html=state.claims.length > 0 ? '<div style="font-size:.7rem;color:var(--gold-dim)">보유 명분</div>'+state.claims.map(cl=>`<div class="p-row"><span>${claimName(cl.rid)}</span><span>${CB_TYPES[cl.type].n}</span></div>`).join(''):'<div style="font-size:.76rem;color:var(--parch-dim)">보유 명분 없음</div>';
  html+=`<p style="font-size:.74rem;color:var(--parch-dim);margin:6px 0 12px">영지 통치 점유율: ${n}/7</p>`;
  items.forEach(it=>{ html+=`<button class="p-action${it.enabled?'':' off'}" onclick="_decActs[${it.i}]()">${it.t}<span class="pd">${it.d}</span></button>`; });
  document.getElementById('decContent').innerHTML=html;
}
function openDecisions(){ togglePanel('dec'); }
function victory(){ state.victory=true; state.over=true; pause(); popup({title:'에이레의 하이킹', sub:'승리', body:`타라 언덕에서 전 국토의 군주들이 지켜보는 가운데, 에이레 전토가 당신의 깃발 아래 통일되었습니다.`, opts:[{t:'다시 시작', f:()=>location.reload()}]}); }

/* ---------- 렌더러 파이프라인 ---------- */
function renderHeader(){
  document.getElementById('dateTxt').textContent=`${state.year}년 ${state.month}월 ${state.day}일`;
  document.getElementById('seasonTxt').textContent=`${SEASONS[state.month-1]} · ${COUNTIES[countyOf(playerChar().region)]?.n||BARONIES[playerChar().region]?.n||'—'}`;
  const reg=REGIONS[playerChar().region]; document.getElementById('goldTxt').textContent=reg?Math.round(reg.gold):0;
  document.getElementById('prestigeTxt').textContent=state.prestige||120;
  document.getElementById('troopTxt').textContent=playerRegions().reduce((s,rid)=>s+(REGIONS[rid].troops||0),0).toLocaleString();
}
function renderChar(){
  const c=playerChar(); document.getElementById('portrait').textContent=c.name[0]; document.getElementById('cNm').textContent=c.name;
  document.getElementById('cTtl').textContent=`${state.kingdomFormed?'아일랜드 왕':'먼스터 소왕'} · ${age(c)}세 · ${c.dyn} 가문`;
  let chips=''; c.traits.forEach(t=>chips+=`<span class="chip">${TRAITS[t].n}</span>`);
  if(c.edu!==null) chips+=`<span class="chip edu">${EDU_NAMES[c.eduFocus][c.edu]}</span>`;
  if(c.lifestyle) chips+=`<span class="chip life">${SKILLS[c.lifestyle]} · ${c.lifeXP}xp</span>`;
  document.getElementById('cChips').innerHTML=chips;
  document.getElementById('stats').innerHTML=Object.entries(SKILLS).map(([k,n])=>`<span>${n} <b>${stat(c,k)}</b></span>`).join('')+`<span>용맹 <b>${stat(c,'prow')}</b></span>`;
  document.getElementById('stressFill').style.width=Math.min(100,c.stress/1.5)+'%'; document.getElementById('stressNum').textContent=`${c.stress} / 150`;
  const lv=stressLvl(c); document.getElementById('stressLvl').textContent=['0단계 — 평온함','1단계 — 불안','2단계 — 위험','3단계 — 죽음'][lv];
}
function renderMap(){
  const svg=document.getElementById('map'); const p=playerChar(); let h=''; const drawn=new Set();
  for(const cid in COUNTY_ADJ){
    COUNTY_ADJ[cid].forEach(nb=>{
      const k=[cid,nb].sort().join('|'); if(drawn.has(k)) return; drawn.add(k);
      const A=COUNTIES[cid],B=COUNTIES[nb]; if(!A||!B) return;
      const inWar=state.wars.some(w=>{ const aH=countyHolder(cid),bH=countyHolder(nb); return aH&&bH&&((chars[w.atk]?.id===aH.id&&chars[w.def]?.id===bH.id)||(chars[w.atk]?.id===bH.id&&chars[w.def]?.id===aH.id)); });
      h+=`<line class="edge${inWar?' warEdge':''}" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>`;
    });
  }
  for(const cid in COUNTIES){
    const C=COUNTIES[cid]; const holder=countyHolder(cid); const mine=holder&&holder.id===p.id; const isVassalOf=holder&&holder.liege===p.id;
    const col=mine?'#3d6b4a':isVassalOf?'#4a7a55':(DUCHIES[C.duchy]?.color||'#555'); const stroke=mine?'#c8a24a':isVassalOf?'#6aaa7a':'#6a5836';
    const totalT=C.baronies.reduce((s,b)=>s+(BARONIES[b]?.troops||0),0); const avgPop=Math.round(C.baronies.reduce((s,b)=>s+(BARONIES[b]?.pop||60),0)/C.baronies.length); const rad=mine?22:18;
    const underSiege=state.wars.some(w=>w.targetRid===cid&&w.occupied?.length>0);
    h+=`<g class="node" onclick="openCounty('${cid}')"><circle class="body" cx="${C.x}" cy="${C.y}" r="${rad}" fill="${col}" stroke="${underSiege?'#c83030':stroke}"/>${underSiege?`<circle cx="${C.x}" cy="${C.y}" r="${rad+5}" fill="none" stroke="#c83030" stroke-width="1.5" stroke-dasharray="3 3"/>`:''}${mine?`<circle cx="${C.x}" cy="${C.y}" r="${rad+6}" fill="none" stroke="#c8a24a" stroke-width="1" stroke-dasharray="2 4"/>`:''}<text x="${C.x}" y="${C.y+3}" style="font-size:9px">${C.n}</text><text class="owner" x="${C.x}" y="${C.y+15}" style="font-size:.58rem;fill:#8a7858">${holder?holder.name.split(' ')[0]:'—'}</text><text class="owner" x="${C.x}" y="${C.y+36}" style="font-size:7.5px;fill:#7a6848">⚔${totalT} 민${avgPop}</text></g>`;
  }
  svg.innerHTML=h;
}
function ownerOf(rid){ return rulerOf(rid); }
function renderAll(){ renderHeader(); renderChar(); renderMap(); }

/* ---------- 라이프사이클 엔트리 포인트 ---------- */
function intro(){
  popup({title:'에이레, 1066년', sub:'먼스터의 소왕', body:`잉글랜드에서는 세 명의 왕이 하나의 왕관을 두고 칼을 뽑았습니다.\n그러나 바다 건너 이 섬은, 그들의 전쟁과 무관하게 자신의 운명을 기다리고 있습니다.\n\n당신은 <b>무르하드 막 돈하드</b> — 먼스터의 소왕.\n할아버지 브리언 보루는 한때 에이레 전토의 하이킹이었습니다.\n\n일곱 왕국을 하나로. 그것이 당신의 길입니다.`, opts:[{t:'연대기를 시작한다', f:()=>{ askLifestyle(playerChar()); }}]});
}

// 초기화 구동
setSpeed(1);
renderAll();
log('1066년 가을 — 무르하드 막 돈하드의 연대기가 시작됩니다.','good');
log('지도의 왕국을 클릭하면 외교를 할 수 있습니다.','dip');
intro();
