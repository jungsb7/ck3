'use strict';
/* =====================================================================
   에이레 1066 — CK3 스타일 텍스트 시뮬레이션 MVP
   수치 출처: CK3 위키 (수태력 ×4.75, 교육 공식, 스트레스 단계 등)
===================================================================== */

/* ─── 오디오 엔진 (Web Audio API, 외부 파일 불필요) ─── */
let _audioCtx = null;
function initAudio(){
  if(_audioCtx) return;
  try{ _audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
  catch(e){ _audioCtx = null; }
}
function playSynthSFX(type){
  if(!_audioCtx){ initAudio(); if(!_audioCtx) return; }
  if(_audioCtx.state==='suspended'){ _audioCtx.resume().then(()=>_doSynth(type)); return; }
  _doSynth(type);
}
function _doSynth(type){
  const ctx=_audioCtx, t=ctx.currentTime;
  if(type==='event'){
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.connect(g);g.connect(ctx.destination);
    o.type='triangle';
    o.frequency.setValueAtTime(880,t);
    o.frequency.exponentialRampToValueAtTime(440,t+0.08);
    g.gain.setValueAtTime(0.18,t);
    g.gain.exponentialRampToValueAtTime(0.001,t+0.18);
    o.start(t);o.stop(t+0.2);
  } else if(type==='gold'){
    [1318,1568,2093].forEach((freq,i)=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      const s=t+i*0.045; o.type='sine';
      o.frequency.setValueAtTime(freq,s);
      g.gain.setValueAtTime(0,s);
      g.gain.linearRampToValueAtTime(0.22,s+0.01);
      g.gain.exponentialRampToValueAtTime(0.001,s+0.22);
      o.start(s);o.stop(s+0.25);
    });
  } else if(type==='war'){
    [1,2,3].forEach((h,i)=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.type=i===0?'sawtooth':'square';
      o.frequency.setValueAtTime(110*h,t);
      o.frequency.linearRampToValueAtTime(110*h*1.05,t+0.25);
      o.frequency.linearRampToValueAtTime(110*h,t+0.7);
      const v=i===0?0.28:0.09/h;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+0.05);
      g.gain.setValueAtTime(v,t+0.55);g.gain.exponentialRampToValueAtTime(0.001,t+0.85);
      o.start(t);o.stop(t+0.9);
    });
  } else if(type==='death'){
    [[130,0,0.32],[110,0.85,0.25],[98,1.65,0.18]].forEach(([freq,delay,vol])=>{
      [1,2.76].forEach(mult=>{
        const o=ctx.createOscillator(),g=ctx.createGain();
        o.connect(g);g.connect(ctx.destination);
        o.type='sine';o.frequency.setValueAtTime(freq*mult,t+delay);
        g.gain.setValueAtTime(0,t+delay);
        g.gain.linearRampToValueAtTime(vol/mult,t+delay+0.01);
        g.gain.exponentialRampToValueAtTime(0.001,t+delay+2.8);
        o.start(t+delay);o.stop(t+delay+3.0);
      });
    });
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
  /* 전투 부상 특성 (CK3 Health Traits — 전투 이벤트로만 부여) */
  wounded:   {n:'부상',   mod:{mar:-1,prow:-3}, ai:{bold:-1}},
  maimed:    {n:'중상',   mod:{mar:-2,prow:-5,dip:-1}, ai:{bold:-2}},
};
const PERSONALITY_KEYS = Object.keys(TRAITS).filter(k=>!['wounded','maimed'].includes(k));

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
const EDU_BONUS = [1,2,3,5]; // 등급별 스탯 보너스 (위키 기준)

/* ---------- 지역 ---------- */
/* ═══════════════════════════════════════════════════════════
   3계층 봉건 구조 데이터 (CK3 위키 기반)
   남작령(Barony) → 백작령(County) → 공작령(Duchy)
   ═══════════════════════════════════════════════════════════ */

/* 남작령: 소유·전투·경제의 기본 단위. owner = charId */
const BARONIES = {
  /* ── 먼스터 (d_munster) ────────────────────────── */
  /* c_thomond */
  b_limerick:  {n:'리머릭',   county:'c_thomond', troops:340, gold:100, pop:65, cap:340, owner:null},
  b_nenagh:    {n:'네나',     county:'c_thomond', troops:220, gold: 55, pop:60, cap:220, owner:null},
  b_roscrea:   {n:'로스크리아',county:'c_thomond', troops:200, gold: 50, pop:58, cap:200, owner:null},
  b_kilmallock:{n:'킬말록',   county:'c_thomond', troops:180, gold: 45, pop:55, cap:180, owner:null},
  /* c_ennis */
  b_ennis:     {n:'에니스',   county:'c_ennis',   troops:260, gold: 70, pop:62, cap:260, owner:null},
  b_kincora:   {n:'킨코라',   county:'c_ennis',   troops:190, gold: 50, pop:58, cap:190, owner:null},
  /* c_ormond */
  b_waterford: {n:'워터퍼드', county:'c_ormond',  troops:280, gold: 90, pop:60, cap:280, owner:null},
  b_emly:      {n:'에믈리',   county:'c_ormond',  troops:180, gold: 45, pop:55, cap:180, owner:null},
  b_clonmel:   {n:'클론멜',   county:'c_ormond',  troops:200, gold: 55, pop:57, cap:200, owner:null},
  /* c_desmond */
  b_tralee:    {n:'트랄리',   county:'c_desmond', troops:200, gold: 50, pop:55, cap:200, owner:null},
  b_cork:      {n:'코크',     county:'c_desmond', troops:260, gold: 75, pop:62, cap:260, owner:null},
  b_kinsale:   {n:'킨세일',   county:'c_desmond', troops:180, gold: 50, pop:55, cap:180, owner:null},
  b_baltimore: {n:'볼티모어', county:'c_desmond', troops:160, gold: 40, pop:52, cap:160, owner:null},

  /* ── 레인스터 (d_leinster) ────────────────────── */
  /* c_leinster */
  b_wexford:   {n:'웩스퍼드', county:'c_leinster',troops:290, gold: 80, pop:58, cap:290, owner:null},
  b_enniscorthy:{n:'에니스코시',county:'c_leinster',troops:200, gold:50, pop:55, cap:200, owner:null},
  b_ferns:     {n:'퍼언스',   county:'c_leinster',troops:180, gold: 45, pop:55, cap:180, owner:null},
  b_carlow:    {n:'칼로',     county:'c_leinster',troops:200, gold: 55, pop:57, cap:200, owner:null},
  /* c_ossory */
  b_gowran:    {n:'고란',     county:'c_ossory',  troops:220, gold: 60, pop:57, cap:220, owner:null},
  b_kilkenny:  {n:'킬케니',   county:'c_ossory',  troops:240, gold: 65, pop:58, cap:240, owner:null},
  b_athy:      {n:'에이시',   county:'c_ossory',  troops:180, gold: 45, pop:55, cap:180, owner:null},
  b_carrick:   {n:'캐릭',     county:'c_ossory',  troops:170, gold: 42, pop:54, cap:170, owner:null},

  /* ── 더블린 (d_dublin) ─────────────────────────── */
  /* c_dublin */
  b_dublin:    {n:'더블린',   county:'c_dublin',  troops:380, gold:130, pop:65, cap:380, owner:null},
  b_wicklow:   {n:'위클로',   county:'c_dublin',  troops:200, gold: 55, pop:58, cap:200, owner:null},
  b_kildare:   {n:'킬데어',   county:'c_dublin',  troops:220, gold: 60, pop:58, cap:220, owner:null},

  /* ── 미드 (d_meath) ────────────────────────────── */
  /* c_meath */
  b_trim:      {n:'트림',     county:'c_meath',   troops:260, gold: 70, pop:60, cap:260, owner:null},
  b_drogheda:  {n:'드로이다', county:'c_meath',   troops:220, gold: 65, pop:60, cap:220, owner:null},
  b_kells:     {n:'켈스',     county:'c_meath',   troops:190, gold: 50, pop:57, cap:190, owner:null},
  /* c_athlone */
  b_athlone:   {n:'애슬론',   county:'c_athlone', troops:250, gold: 65, pop:58, cap:250, owner:null},
  b_birr:      {n:'버',       county:'c_athlone', troops:190, gold: 48, pop:55, cap:190, owner:null},
  b_uisneach:  {n:'위슈낙',   county:'c_athlone', troops:160, gold: 40, pop:52, cap:160, owner:null},

  /* ── 코노트 (d_connacht) ───────────────────────── */
  /* c_connacht */
  b_galway:    {n:'골웨이',   county:'c_connacht',troops:310, gold: 80, pop:62, cap:310, owner:null},
  b_athenry:   {n:'애슨리',   county:'c_connacht',troops:210, gold: 55, pop:58, cap:210, owner:null},
  b_tuam:      {n:'투암',     county:'c_connacht',troops:200, gold: 52, pop:57, cap:200, owner:null},
  b_da_chainoc:{n:'다체이녹', county:'c_connacht',troops:180, gold: 45, pop:55, cap:180, owner:null},
  /* c_mayo */
  b_cruachu:   {n:'크루하후', county:'c_mayo',    troops:200, gold: 50, pop:55, cap:200, owner:null},
  b_castlebar: {n:'캐슬바',   county:'c_mayo',    troops:210, gold: 52, pop:56, cap:210, owner:null},
  b_sligo:     {n:'슬라이고', county:'c_mayo',    troops:230, gold: 58, pop:57, cap:230, owner:null},
  b_killala:   {n:'킬랄라',   county:'c_mayo',    troops:175, gold: 42, pop:53, cap:175, owner:null},

  /* ── 브레프네 (d_breifne) ──────────────────────── */
  /* c_breifne */
  b_dromahair: {n:'드로마헤르',county:'c_breifne', troops:230, gold: 58, pop:57, cap:230, owner:null},
  b_belcoo:    {n:'벨쿠',     county:'c_breifne', troops:180, gold: 42, pop:53, cap:180, owner:null},
  b_longford:  {n:'롱퍼드',   county:'c_breifne', troops:190, gold: 48, pop:55, cap:190, owner:null},
  b_cavan:     {n:'캐번',     county:'c_breifne', troops:200, gold: 50, pop:56, cap:200, owner:null},
  b_adragh:    {n:'아드라그', county:'c_breifne', troops:160, gold: 38, pop:52, cap:160, owner:null},

  /* ── 얼스터 (d_ulster) ─────────────────────────── */
  /* c_ulster */
  b_downpatrick:{n:'다운패트릭',county:'c_ulster', troops:280, gold: 72, pop:60, cap:280, owner:null},
  b_slemish:   {n:'슬레미시', county:'c_ulster',  troops:200, gold: 50, pop:57, cap:200, owner:null},
  b_carrickfergus:{n:'캐릭퍼거스',county:'c_ulster',troops:240, gold:65, pop:60, cap:240, owner:null},
  b_bangor:    {n:'뱅거',     county:'c_ulster',  troops:185, gold: 45, pop:55, cap:185, owner:null},
  /* c_oriel */
  b_dundalk:   {n:'던돌크',   county:'c_oriel',   troops:240, gold: 62, pop:58, cap:240, owner:null},
  b_armagh:    {n:'아르마',   county:'c_oriel',   troops:260, gold: 70, pop:60, cap:260, owner:null},
  b_ardee:     {n:'아르디',   county:'c_oriel',   troops:190, gold: 48, pop:55, cap:190, owner:null},
  b_clogher:   {n:'클로허',   county:'c_oriel',   troops:180, gold: 44, pop:54, cap:180, owner:null},
  b_dungannon: {n:'덩거논',   county:'c_oriel',   troops:185, gold: 46, pop:54, cap:185, owner:null},
  /* c_ailech */
  b_donegal:   {n:'도네갈',   county:'c_ailech',  troops:220, gold: 55, pop:57, cap:220, owner:null},
  b_raphoe:    {n:'래포',     county:'c_ailech',  troops:190, gold: 48, pop:55, cap:190, owner:null},
  b_fahan:     {n:'파한',     county:'c_ailech',  troops:175, gold: 42, pop:53, cap:175, owner:null},
  b_derry:     {n:'더리',     county:'c_ailech',  troops:210, gold: 55, pop:58, cap:210, owner:null},
};

/* 백작령: 남작령들의 집합. capital = 수도 남작령 */
const COUNTIES = {
  c_thomond: {n:'톰몬드',   duchy:'d_munster',  capital:'b_limerick',  baronies:['b_limerick','b_nenagh','b_roscrea','b_kilmallock'], x:104, y:318, poly:'72,262 118,268 162,278 168,322 148,358 118,378 85,372 58,350 48,312 58,278'},
  c_ennis:   {n:'에니스',   duchy:'d_munster',  capital:'b_ennis',     baronies:['b_ennis','b_kincora'],                              x: 49, y:314, poly:'30,200 48,215 48,240 58,278 48,312 58,350 72,390 52,428 30,415'},
  c_ormond:  {n:'오몬드',   duchy:'d_munster',  capital:'b_waterford', baronies:['b_waterford','b_emly','b_clonmel'],                 x:210, y:302, poly:'198,288 238,282 262,252 228,272 212,308 222,338 198,358 172,342 162,278'},
  c_desmond: {n:'데스몬드', duchy:'d_munster',  capital:'b_cork',      baronies:['b_tralee','b_cork','b_kinsale','b_baltimore'],      x: 98, y:404, poly:'52,428 72,390 58,350 85,372 118,378 148,358 155,392 138,438 98,468 52,468'},
  c_leinster:{n:'레인스터', duchy:'d_leinster', capital:'b_wexford',   baronies:['b_wexford','b_enniscorthy','b_ferns','b_carlow'],   x:321, y:326, poly:'298,268 330,292 365,300 378,358 340,372 305,368 282,342 272,308'},
  c_ossory:  {n:'오서리',   duchy:'d_leinster', capital:'b_gowran',    baronies:['b_gowran','b_kilkenny','b_athy','b_carrick'],       x:254, y:306, poly:'262,252 298,268 272,308 282,342 252,358 222,338 212,308 228,272'},
  c_dublin:  {n:'더블린',   duchy:'d_dublin',   capital:'b_dublin',    baronies:['b_dublin','b_wicklow','b_kildare'],                 x:341, y:246, poly:'285,228 322,215 352,190 385,208 388,268 365,300 330,292 298,268'},
  c_meath:   {n:'미드',     duchy:'d_meath',    capital:'b_trim',      baronies:['b_trim','b_drogheda','b_kells'],                    x:292, y:180, poly:'240,158 278,152 312,128 348,145 352,190 322,215 285,228 252,215 238,192'},
  c_athlone: {n:'애슬론',   duchy:'d_meath',    capital:'b_athlone',   baronies:['b_athlone','b_birr','b_uisneach'],                  x:206, y:237, poly:'155,255 168,198 182,198 210,210 238,192 252,215 262,252 238,282 198,288 162,278'},
  c_connacht:{n:'코노트',   duchy:'d_connacht', capital:'b_galway',    baronies:['b_galway','b_athenry','b_tuam','b_da_chainoc'],     x:108, y:208, poly:'48,215 80,198 108,168 132,132 155,145 168,198 155,255 118,268 72,262 48,240'},
  c_mayo:    {n:'마요',     duchy:'d_connacht', capital:'b_sligo',     baronies:['b_cruachu','b_castlebar','b_sligo','b_killala'],    x: 76, y:152, poly:'30,95 72,110 112,100 132,132 108,168 80,198 48,215 30,200'},
  c_breifne: {n:'브레프네', duchy:'d_breifne',  capital:'b_dromahair', baronies:['b_dromahair','b_belcoo','b_longford','b_cavan','b_adragh'], x:178, y:153, poly:'112,100 148,88 168,120 205,140 240,158 238,192 210,210 182,198 168,198 155,145 132,132'},
  c_ulster:  {n:'얼스터',   duchy:'d_ulster',   capital:'b_downpatrick',baronies:['b_downpatrick','b_slemish','b_carrickfergus','b_bangor'], x:247, y: 66, poly:'150,42 225,30 300,38 330,58 305,88 270,100 225,110 168,62'},
  c_oriel:   {n:'오리얼',   duchy:'d_ulster',   capital:'b_armagh',    baronies:['b_dundalk','b_armagh','b_ardee','b_clogher','b_dungannon'], x:232, y:115, poly:'168,62 225,110 270,100 305,88 312,128 278,152 240,158 205,140 168,120 148,88'},
  c_ailech:  {n:'애일라흐', duchy:'d_ulster',   capital:'b_donegal',   baronies:['b_donegal','b_raphoe','b_fahan','b_derry'],         x:101, y: 71, poly:'30,40 95,30 150,42 168,62 148,88 112,100 72,110 30,95'},
};

/* 공작령: 백작령들의 집합 */
const DUCHIES = {
  d_munster: {n:'먼스터 공작령',  counties:['c_thomond','c_ennis','c_ormond','c_desmond'], color:'#3d6b4a'},
  d_leinster:{n:'레인스터 공작령',counties:['c_leinster','c_ossory'],                       color:'#9c6b3c'},
  d_dublin:  {n:'더블린 공작령',  counties:['c_dublin'],                                    color:'#5a6e85'},
  d_meath:   {n:'미드 공작령',    counties:['c_meath','c_athlone'],                         color:'#6e7a3c'},
  d_connacht:{n:'코노트 공작령',  counties:['c_connacht','c_mayo'],                         color:'#6d5380'},
  d_breifne: {n:'브레프네 공작령',counties:['c_breifne'],                                   color:'#4f5d68'},
  d_ulster:  {n:'얼스터 공작령',  counties:['c_ulster','c_oriel','c_ailech'],               color:'#8a4a3c'},
};

/* ══════════════════════════════════════════════════
   건물 시스템 (Phase 4)
   각 남작령: 슬롯 2개, 동일 건물 중복 불가
   ══════════════════════════════════════════════════ */
const BUILDINGS = {
  // 군사 건물
  barracks:   { n:'병영',     icon:'⚔', cost:80,  time:6,  cat:'mil',
    effect:{ troops_cap:+150, troops_regen:+2 },
    desc:'병력 상한 +150, 매달 회복 +2' },
  watchtower: { n:'망루',     icon:'🗼', cost:60,  time:4,  cat:'mil',
    effect:{ troops_cap:+80,  war_score_def:+5 },
    desc:'병력 상한 +80, 방어 전황 +5' },
  // 경제 건물
  market:     { n:'시장',     icon:'🪙', cost:70,  time:5,  cat:'eco',
    effect:{ gold_income:+4 },
    desc:'매달 금 +4' },
  mill:       { n:'방앗간',   icon:'⚙', cost:50,  time:4,  cat:'eco',
    effect:{ gold_income:+2, pop_growth:+1 },
    desc:'매달 금 +2, 민심 유지 +1' },
  // 종교 건물
  chapel:     { n:'예배당',   icon:'✝', cost:60,  time:5,  cat:'rel',
    effect:{ prestige:+1, pop_growth:+2 },
    desc:'매달 위신 +1, 민심 +2' },
  // 방어 건물
  fortify:    { n:'성벽 강화', icon:'🏰', cost:100, time:8, cat:'def',
    effect:{ troops_cap:+200, siege_defense:+15 },
    desc:'병력 상한 +200, 공성 방어 +15%' },
  // 농업
  farmstead:  { n:'농장',     icon:'🌾', cost:40,  time:3,  cat:'eco',
    effect:{ gold_income:+1, pop_growth:+3 },
    desc:'매달 금 +1, 민심 +3' },
};
const BUILDING_SLOTS = 2; // 남작령당 슬롯 수

/* 남작령 건물 초기화 */
(()=>{ for(const bid in BARONIES) if(!BARONIES[bid].buildings) BARONIES[bid].buildings=[]; })();

/* 건물 건설 시작: bid=남작령, btype=건물종류 */
function startBuilding(bid, btype){
  const b=BARONIES[bid]; const p=playerChar();
  if(!b||b.owner!==p.id) return false;
  if(b.buildings.length>=BUILDING_SLOTS){ log('건물 슬롯이 가득 찼습니다.'); return false; }
  if(b.buildings.some(x=>x.type===btype)){ log('이미 건설된 건물입니다.'); return false; }
  const bp=BUILDINGS[btype]; if(!bp) return false;
  const seat=BARONIES[p.region]; if(!seat) return false;
  if(seat.gold<bp.cost){ log(`금이 부족합니다. (필요: ${bp.cost})`,'dip'); return false; }
  seat.gold-=bp.cost;
  playSynthSFX('gold');
  b.buildings.push({type:btype, progress:0, done:false});
  log(`${b.n}에 ${bp.n} 건설을 시작했습니다. (${bp.time}개월 소요)`,'good');
  return true;
}

/* 매달 건설 진행 + 완공 효과 적용 */
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
        // 완공 효과 적용
        if(bp.effect.troops_cap) b.cap=(b.cap||b.troops)+bp.effect.troops_cap;
        if(bid===playerChar().region||b.owner===state.player){
          log(`${b.n}의 <b>${bp.n}</b>이(가) 완공됐습니다! ${bp.desc}`,'good');
        }
      }
    }
  }

  // 완공된 건물 효과 goldPulse에 반영 (troops_regen, gold_income, pop_growth)는
  // goldPulse에서 buildingBonus() 호출로 처리
}

/* 남작령 건물 보너스 집계 */
function buildingBonus(bid, key){
  const b=BARONIES[bid]; if(!b?.buildings) return 0;
  return b.buildings.filter(s=>s.done).reduce((sum,s)=>{
    const bp=BUILDINGS[s.type]; return bp?.effect?.[key]?sum+(bp.effect[key]||0):sum;
  },0);
}
/* 백작령 간 인접 관계 */
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

/* ════════════════════════════════════════════════════
   건물 시스템 (Phase 4)
   ════════════════════════════════════════════════════ */
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

/* 남작령에 건물 필드 추가 (기존 BARONIES에 없으므로 초기화) */
(()=>{
  for(const bid in BARONIES){
    const b=BARONIES[bid];
    if(!b.buildings) b.buildings=[];   // 완공된 건물
    if(!b.building_queue) b.building_queue=null; // {type, monthsLeft}
    if(!b.slots) b.slots=2;           // 최대 건물 슬롯 (기본 2)
  }
})();

/* 건물 효과 매달 적용 */
// buildingPulse: 새 버전은 phase4_buildings.py에서 정의

/* 건물 건설 시작 */
/* 호환성: REGIONS = BARONIES (c.region은 이제 seat barony id) */
const REGIONS = BARONIES;

/* ─── 자문회 보직 정의 (CK3 위키 v1.19 수치 기반) ─── */
/* 출처: https://ck3.paradoxwikis.com/Council */
const COUNCIL_ROLES = {
  chancellor:{
    n:'재상', skill:'dip', icon:'⚖',
    desc:'외교·봉신 관리',
    tasks:{
      foreign_affairs:  { n:'외교 담당',    desc:'위신 +0.05×스킬/월 · 독립군주 호감 +0.5×스킬/월' },
      domestic_affairs: { n:'내정 담당',    desc:'봉신 호감 +0.5×스킬/월(월 +0.2 상한) · 폭정 감소 +1%/스킬' },
      bestow_favor:     { n:'왕실 은총',    desc:'위신 +0.02×스킬/월 · 봉신 호감 +0.5×스킬/월' },
    },
  },
  marshal:{
    n:'원수', skill:'mar', icon:'⚔',
    desc:'군사 훈련·병력 강화',
    tasks:{
      organize_army:    { n:'군대 조직',    desc:'유지비 -1%/스킬 · 레비 보충 +2%/스킬 · 수비대 +2%/스킬' },
      train_commanders: { n:'지휘관 훈련',  desc:'기사 효율 +1%/스킬/월 · 병사 공격력·방어력 +1%/스킬/월 · 지휘관 발견 +0.5%/스킬/월' },
      increase_control: { n:'영지 통제',    desc:'부패 제거 +0.2%/스킬/월 · 영지 부패 증가 방지' },
    },
  },
  steward:{
    n:'재무관', skill:'stew', icon:'💰',
    desc:'세금 징수·영지 개발',
    tasks:{
      collect_taxes:       { n:'세금 징수',  desc:'직할 세금 +0.5%×스킬/월' },
      increase_development:{ n:'영지 개발',  desc:'건설시간 -1%/스킬 · 개발도 +0.175×스킬/월 → 100%: 개발도 +1', progressive:true },
      promote_culture:     { n:'문화 진흥',  desc:'진행 (0.25+스킬÷20)%/월 → 100%: 문화 전환', progressive:true },
    },
  },
  spymaster:{
    n:'첩보관', skill:'intr', icon:'🗡',
    desc:'모략 방어·비밀 탐색',
    tasks:{
      disrupt_schemes: { n:'모략 방해',   desc:'적 모략 단계 +5일(기본)+0.5일/스킬 · 발각률 +1%/스킬' },
      support_schemes: { n:'공작 지원',   desc:'아군 모략 단계 -1일/스킬 · 성공률 +5%(기본)+0.5%/스킬' },
      find_secrets:    { n:'비밀 탐문',   desc:'궁정 비밀 발견 확률 +5%×스킬' },
    },
  },
  chaplain:{
    n:'사제', skill:'learn', icon:'✝',
    desc:'경건·민심·신앙 개종·명분 위조',
    tasks:{
      religious_relations:{ n:'종교 관계',       desc:'경건 +0.05×스킬/월 · 동일신앙 군주 호감 +0.5×스킬/월(월 +0.35 상한)' },
      fabricate_claim:    { n:'교회법 명분 위조', desc:'진행 (3+스킬÷5)%/월 → 100%: 미행사 명분 획득', progressive:true },
      convert_faith:      { n:'신앙 개종',        desc:'진행 (0.5+스킬÷10)%/월 → 100%: 지역 신앙 전환', progressive:true },
    },
  },
};

/* ADJ: 남작령 id → 인접 백작령 수도 남작령 ids */
const ADJ = {};
(()=>{
  for(const bid in BARONIES){
    const cid = BARONIES[bid].county;
    const adjCids = COUNTY_ADJ[cid] || [];
    ADJ[bid] = adjCids.map(ac => COUNTIES[ac].capital).filter(Boolean);
  }
})();

/* 공작령 색상 (지도 노드용) */
const DUCHY_COLOR = {};
for(const did in DUCHIES){
  for(const cid of DUCHIES[did].counties){
    for(const bid of COUNTIES[cid].baronies) DUCHY_COLOR[bid] = DUCHIES[did].color;
  }
}

/* ---------- 캐릭터 ---------- */
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
    liege:null, // 봉신의 군주 (독립이면 null)
    op:{}, // 관계도
    council:{chancellor:null,marshal:null,steward:null,spymaster:null,chaplain:null},
    claims:[], // [{rid,type,obtained}]
    lastActivity:0, // 마지막 활동 연도
    betrothed:null, // 혼약 상대 charId (CK3: betrothal)
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
function opinion(a,b){ // a가 b를 보는 시각
  let v = a.op[b.id]||0;
  for(const t of a.traits){
    if(b.traits.includes(t)) v += 10;
    if(TRAITS[t] && b.traits.includes(TRAITS[t].opp)) v -= 10;
  }
  if(a.spouse===b.id) v += 30;
  if(a.father===b.id||a.mother===b.id||b.father===a.id||b.mother===a.id) v += 25;
  // 위신이 높은 군주는 타인에게 더 좋게 보임
  if(b.id===state.player) v += Math.round((state.prestige-120)/15);
  return Math.max(-100, Math.min(100, v));
}
function chOp(a,b,d){ a.op[b.id]=(a.op[b.id]||0)+d; }

/* ---------- 초기 세계 (1066년 9월) ----------
   무르하드 수치: CK3 위키 북마크 페이지 확인값 (외6 무8 내6 음8 학6 / 숙련된 전술가)
   성격은 패치 이후 기준(절제·사교적·조급) — 사용자 결정 사항
   주변 소왕 이름은 역사 기록 기반이나 일부 추정 포함            ---------- */
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

// 초기 관계도
chOp(kLein,murchad,-25); chOp(murchad,kLein,-25);   // 패권 라이벌
chOp(kConn,murchad,-15); chOp(murchad,kConn,-15);
chOp(kDub,murchad,-10);
chOp(kMeath,murchad,10); chOp(murchad,kMeath,10);
chOp(kBrei,kConn,-30); chOp(kConn,kBrei,-30);
chOp(kDub,kLein,40); chOp(kLein,kDub,40);

// 초기 남작령 소유권 일괄 설정
seizeDuchy(murchad.id, 'd_munster');
seizeDuchy(kLein.id,   'd_leinster');
seizeDuchy(kDub.id,    'd_dublin');
seizeDuchy(kMeath.id,  'd_meath');
seizeDuchy(kConn.id,   'd_connacht');
seizeDuchy(kBrei.id,   'd_breifne');
seizeDuchy(kUls.id,    'd_ulster');

// NPC 초기 궁정인 생성 (각 NPC 군주에게 자문회 인원 풀 제공)
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
      courtOf:king.region}); // king.region = seat barony
  });
  // 혼인 가능한 미혼 여성 궁정인 (각 궁정 2~3명, 혼처 풀 제공)
  const femNames=['오를라트','고름라트','베브','사브','데르브길','모르','이테','우나'];
  const femCount=2+Math.floor(Math.random()*2); // 2~3명
  for(let j=0;j<femCount;j++){
    mk({name:femNames[Math.floor(Math.random()*femNames.length)], dyn:king.dyn, sex:'f',
      byear:1040+Math.floor(Math.random()*12), bmonth:(j%12)+1, bday:5+j,
      traits:randTraits(2), base:randStats(), edu:1, eduFocus:'dip',
      courtOf:king.region});
  }
});
/* ─── 3계층 핵심 헬퍼 ─── */
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
function playerChar(){ return chars[state.player]; }

/* ---------- 게임 상태 ---------- */
const state = {
  year:1066, month:9, day:15,
  paused:true, speed:1, timer:null,
  player:murchad.id,
  schemes:[], wars:[], truces:{}, npcAlliances:[], alliances:[],
  prestige:120,
  successionLaw:'partition',
  council:{ chancellor:null, marshal:null, steward:null, spymaster:null, chaplain:null },
  /* 보직별 현재 선택 태스크 (CK3 위키 기반) */
  councilTasks:{
    chancellor:'foreign_affairs',
    marshal:'organize_army',
    steward:'collect_taxes',
    spymaster:'disrupt_schemes',
    chaplain:'religious_relations',
  },
  /* 진행형 태스크 진행도 0~100 */
  councilProgress:{ steward:0, chaplain:0 },
  fabricateTarget:null, // 사제 명분 위조 대상 county id (CK3: 태스크 시작 시 지정)
  claims:[],
  popupQ:[], modalOpen:false,
  over:false, victory:false,
  introDone:false,
};
const MDAYS=[31,28,31,30,31,30,31,31,30,31,30,31];
const SEASONS=['겨울','겨울','봄','봄','봄','여름','여름','여름','가을','가을','가을','겨울'];

/* ---------- 로그 ---------- */
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
  if(!state.paused) state.autoResume=true;   // 팝업이 직접 정지시킨 경우만 자동 재개
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

/* ---------- 사망 / 상속 ---------- */
function kill(c, cause){
  if(c.dead) return;
  c.dead=true;
  if(c.ruler||c.id===state.player) playSynthSFX('death');
  // 배우자 해제
  if(c.spouse&&chars[c.spouse]){ chars[c.spouse].spouse=null; addStress(chars[c.spouse],40,'배우자의 죽음'); }
  // 혼약 해제 (CK3: 사망 시 혼약 자동 파기, 페널티 없음)
  if(c.betrothed&&chars[c.betrothed]){ chars[c.betrothed].betrothed=null; }
  // 자녀 스트레스
  for(const id in chars){const k=chars[id];
    if(!k.dead&&(k.father===c.id||k.mother===c.id)) addStress(k,30,'부모의 죽음');}
  if(c.ruler) succession(c);
  if(c.id===state.player){
    const dist=distributeSuccession(c);
    if(dist){
      const mainHid=Object.keys(dist)[0];
      const mainH=chars[mainHid];
      // 분배 처리
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
/* ══════════════════════════════════════════════════
   상속법 시스템 (Phase 5)
   ══════════════════════════════════════════════════ */
function findHeir(c, malePref=true){
  const kids=Object.values(chars).filter(k=>!k.dead&&(k.father===c.id||k.mother===c.id)&&age(k)>=0);
  kids.sort((a,b)=>a.byear-b.byear||a.bmonth-b.bmonth);
  if(malePref) return kids.find(k=>k.sex==='m')||kids[0]||null;
  return kids[0]||null;
}
function validHeirs(c){ // 성인 후계자 목록 (연장자순)
  const kids=Object.values(chars).filter(k=>!k.dead&&(k.father===c.id||k.mother===c.id)&&age(k)>=16);
  kids.sort((a,b)=>a.byear-b.byear);
  return kids;
}
/* 상속 분배: 법 따라 counties 배분 */
function distributeSuccession(c){
  const ownedCids=directCountiesOf(c.id);
  const seatCid=countyOf(c.region)||ownedCids[0];
  const heirs=validHeirs(c);
  if(!heirs.length) return null; // 후계자 없음

  const law=c.id===state.player?state.successionLaw:'primogeniture'; // NPC는 장자상속
  const mainHeir=heirs[0];

  if(law==='primogeniture'||heirs.length===1||ownedCids.length<=1){
    // 장자상속: 장남이 전부
    const dist={[mainHeir.id]:ownedCids};
    return dist;
  }
  if(law==='partition'){
    // 분할상속: 좌석은 주 후계자, 나머지 균등 배분
    const dist={[mainHeir.id]:[seatCid].filter(Boolean)};
    const rest=ownedCids.filter(cid=>cid!==seatCid);
    rest.forEach((cid,i)=>{
      const h=heirs[(i+1)%heirs.length]; // 순서대로 배분
      if(!dist[h.id]) dist[h.id]=[];
      dist[h.id].push(cid);
    });
    return dist;
  }
  if(law==='elective'){
    // 선출제: 봉신 호감도 기준 투표 (간소화)
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
  if(c.id===state.player) return; // 플레이어는 kill에서 처리
  const owned=regionsOf(c.id);
  if(!owned.length) return cleanupAfterDeath(c);
  const seat=owned.includes(c.region)?c.region:owned[0];
  const seatName=COUNTIES[countyOf(seat)]?.n||BARONIES[seat]?.n||'?';

  const dist=distributeSuccession(c);
  if(dist){
    for(const [hid,cids] of Object.entries(dist)){
      let h=chars[hid];
      if(!h) continue;
      h.ruler=true; h.liege=c.liege; h.courtOf=null;
      cids.forEach(cid=>seizeCounty(hid,cid));
      if(!h.region||!regionsOf(hid).includes(h.region)) h.region=COUNTIES[cids[0]]?.capital||seat;
      if(hid===dist[Object.keys(dist)[0]]){ // 주 후계자
        log(`${seatName}의 왕좌가 <b>${h.name}</b>에게 넘어갔습니다.`,'dip');
      } else {
        log(`${h.name}이(가) ${cids.map(cid=>COUNTIES[cid]?.n||cid).join('·')}을(를) 계승했습니다.`,'dip');
      }
    }
  } else {
    // 후계자 없음 → 방계 생성
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
  // 진행 중이던 전쟁/음모 정리
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
function randStats(){ const r=()=>3+Math.floor(Math.random()*8);
  return {dip:r(),mar:r(),stew:r(),intr:r(),learn:r(),prow:r()}; }
function gameOver(msg){
  state.over=true; pause();
  popup({title:'가문의 종언', sub:'게임 오버', body:msg+'\n\n에이레의 연대기는 다른 가문의 이름으로 쓰일 것입니다.',
    opts:[{t:'다시 시작', f:()=>location.reload()}]});
}

/* ══════════════════════════════════════════════════
   외부 세력 이벤트 시스템 (Phase 5)
   연간 발화, 역사적 배경 기반
   ══════════════════════════════════════════════════ */
const WORLD_EVENTS = [
  // ── 1066~1072: 노르만 정복 여파
  { id:'norman_shadow', triggerYear:1066, maxYear:1075, chance:0.6, fired:false,
    run:(p)=>popup({title:'노르만의 그림자', sub:'세계 소식',
      body:`잉글랜드에서 충격적인 소식이 전해집니다.
노르만 공작 윌리엄이 해럴드 왕을 헤이스팅스에서 꺾고 왕좌를 차지했습니다.
에이레 서쪽에 새로운 강자가 등장했습니다.`,
      opts:[
        {t:'경계를 강화한다', d:'병력 +100, 스트레스 +8', f:()=>{BARONIES[p.region].troops+=100; addStress(p,8,'강대국의 위협');}},
        {t:'사절을 보낸다', d:'위신 +10, 외교 탐색', f:()=>{state.prestige+=10; log('노르만 왕국에 사절을 파견했습니다.','dip');}},
      ]})},

  // ── 1068~1080: 바이킹 잔존 세력 (더블린)
  { id:'viking_dublin', triggerYear:1068, maxYear:1090, chance:0.5, fired:false,
    run:(p)=>{
      const dublin=countyHolder('c_dublin');
      popup({title:'더블린의 바이킹', sub:'해안 위협',
        body:`더블린의 노르드 해상 세력이 다시 활동을 시작했습니다.
바다에서 온 배들이 동부 해안을 약탈하고 있습니다.`,
        opts:[
          {t:'해안 방어를 강화한다', d:'금 -50, 동부 민심 +8', f:()=>{
            BARONIES[p.region].gold-=50;
            ['c_dublin','c_leinster'].forEach(cid=>COUNTIES[cid]?.baronies.forEach(bid=>{if(BARONIES[bid]?.owner===state.player) BARONIES[bid].pop=Math.min(100,(BARONIES[bid].pop||60)+8);}));
            log('해안 경비를 강화했습니다.','war');}},
          {t:'바이킹과 교역한다', d:'금 +60, 위험', f:()=>{
            if(Math.random()<0.7){BARONIES[p.region].gold+=60; log('바이킹과 교역에 성공했습니다.','good');}
            else{BARONIES[p.region].troops=Math.max(100,BARONIES[p.region].troops-100); log('교역선이 습격당했습니다!','war');}}},
        ]});}},

  // ── 1070~1085: 교황 특사
  { id:'papal_legate', triggerYear:1070, maxYear:1090, chance:0.5, fired:false,
    run:(p)=>popup({title:'교황 특사의 방문', sub:'신앙',
      body:`로마에서 온 특사가 아일랜드 교회의 개혁을 촉구합니다.
그레고리우스 7세의 개혁 운동이 에이레에도 파급되고 있습니다.`,
      opts:[
        {t:'개혁을 수용한다', d:'위신 +30, 민심 +10', f:()=>{state.prestige+=30; for(const bid of regionsOf(state.player)) BARONIES[bid].pop=Math.min(100,(BARONIES[bid].pop||60)+Math.round(10/regionsOf(state.player).length)); log('교회 개혁을 수용했습니다. 교황청의 지지를 얻었습니다.','good');}},
        {t:'정중히 거절한다', d:'위신 -10', f:()=>{state.prestige=Math.max(0,state.prestige-10);}},
      ]})},

  // ── 1075~1095: 노르만의 아일랜드 야욕
  { id:'norman_interest', triggerYear:1075, maxYear:1100, chance:0.45, fired:false,
    run:(p)=>popup({title:'노르만의 야욕', sub:'외교 위기',
      body:`노르만 귀족들이 아일랜드의 풍요로운 땅에 눈독을 들이고 있다는 정보가 들어왔습니다.
강한 아일랜드 왕국만이 그들을 막을 수 있습니다.`,
      opts:[
        {t:'왕국 통일을 서두른다', d:'스트레스 +10, 동기 강화', f:()=>{addStress(p,10,'외세의 압박'); log('노르만의 위협이 통일의 동기가 됐습니다.','war');}},
        {t:'오히려 노르만과 동맹한다', d:'위신 +20, 이웃 관계 -15', f:()=>{state.prestige+=20; Object.values(chars).filter(c=>c.ruler&&!c.dead&&c.id!==p.id).forEach(c=>chOp(c,p,-15)); log('노르만 귀족과 비밀 협약을 맺었습니다.','dip');}},
      ]})},

  // ── 1066~1100: 스코틀랜드의 압박 (얼스터 인접)
  { id:'scotland_pressure', triggerYear:1072, maxYear:1100, chance:0.4, fired:false,
    run:(p)=>popup({title:'알바 왕국의 시선', sub:'북방 위협',
      body:`스코틀랜드 말콤 3세의 기사들이 얼스터 국경을 넘어 정찰하고 있습니다.
북쪽의 왕국이 아일랜드에 관심을 보이기 시작했습니다.`,
      opts:[
        {t:'국경 요새를 강화한다', d:'금 -60, 얼스터 방어 +', f:()=>{
          if(BARONIES[p.region].gold>=60){
            BARONIES[p.region].gold-=60;
            ['c_ailech','c_ulster'].forEach(cid=>COUNTIES[cid]?.baronies.forEach(bid=>{if(BARONIES[bid]) BARONIES[bid].cap=(BARONIES[bid].cap||100)+50;}));
            log('북부 국경 요새를 강화했습니다.','war');
          } else log('금이 부족합니다.','dip');}},
        {t:'무시한다', d:'위신 -5', f:()=>{state.prestige=Math.max(0,state.prestige-5);}},
      ]})},

  // ── 1080~: 반복 가능 — 북해 폭풍 이벤트
  { id:'storm_of_north', triggerYear:1080, maxYear:1100, chance:0.3, fired:false, repeatable:true,
    run:(p)=>popup({title:'북해의 폭풍', sub:'자연 재해',
      body:`북해에서 몰아친 폭풍이 아일랜드 해안을 강타했습니다.
어선들이 파손되고 해안 마을이 피해를 입었습니다.`,
      opts:[
        {t:'구호를 보낸다', d:'금 -30, 민심 +12', f:()=>{
          if(BARONIES[p.region].gold>=30){BARONIES[p.region].gold-=30; for(const bid of regionsOf(state.player).slice(0,3)) BARONIES[bid].pop=Math.min(100,(BARONIES[bid].pop||60)+4);}
          log('해안 마을에 구호를 보냈습니다.','good');}},
        {t:'신의 뜻이다', d:'민심 -8', f:()=>{for(const bid of regionsOf(state.player).slice(0,2)) BARONIES[bid].pop=Math.max(0,(BARONIES[bid].pop||60)-8);}},
      ]})},
];

/* 연간 외부 세계 이벤트 발화 */
function worldEventPulse(){
  if(state.month!==1) return; // 매년 1월에만 체크
  const p=playerChar(); if(!p||p.dead) return;
  for(const ev of WORLD_EVENTS){
    if(ev.fired&&!ev.repeatable) continue;
    if(state.year<ev.triggerYear||state.year>ev.maxYear) continue;
    if(Math.random()<ev.chance){
      ev.fired=true;
      ev.run(p);
      break; // 한 번에 하나만
    }
  }
}
/* ---------- 시간 진행 ---------- */
function togglePause(){ state.paused?resume():pause(); }
/* ─── 통합 사이드 패널 시스템 ─── */
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
  // 열린 패널 z-index 최상단
  Object.keys(PANELS).forEach(k=>{
    const w=document.getElementById(PANELS[k].wrap); if(!w) return;
    w.style.zIndex = k===activeId ? '37' : '35';
  });
}

function togglePanel(id){
  const info=PANELS[id]; if(!info) return;
  const el=document.getElementById(info.wrap);
  const opening=!el.classList.contains('open');
  // 다른 패널 모두 닫기
  Object.keys(PANELS).forEach(k=>{
    if(k!==id) document.getElementById(PANELS[k].wrap).classList.remove('open');
  });
  if(opening){
    playSynthSFX('event');
    if(info.render) window[info.render]();
    el.classList.add('open');
    if(id!=='log') pause();
    _hideOtherTabs(id);
  } else {
    el.classList.remove('open');
    if(id!=='log') resume();
    _showAllTabs();
    // z-index 복원
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
function toggleLog(){ togglePanel('log'); }
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

/* ---------- 생일 / 연령 이벤트 ---------- */
function dailyBirthdays(){
  for(const id in chars){
    const c=chars[id]; if(c.dead) continue;
    if(c.bmonth===state.month&&c.bday===state.day){
      const a=age(c);
      onBirthday(c,a);
    }
  }
}
function onBirthday(c,a){
  // 어린시절 특성 (3세)
  if(a===3&&!c.childTrait){
    c.childTrait=randKey(CHILD_TRAITS);
    if(isPlayerFamily(c)) log(`<b>${c.name}</b>(3세)에게서 <b>${CHILD_TRAITS[c.childTrait].n}</b>의 기질이 보입니다.`,'fam');
  }
  // 교육 방향 + 후견인 (6세)
  if(a===6&&!c.eduFocus){
    if(isPlayerFamily(c)) askEducation(c);
    else { c.eduFocus=CHILD_TRAITS[c.childTrait||'curious'].foci[0]; }
  }
  // 교육 점수 굴림 (6~15세, 위키 공식)
  if(a>=6&&a<16&&c.eduFocus){
    if(eduRoll(c)) c.eduScore+=2;
  }
  // 성격 이벤트 (9·11·13세)
  if((a===9||a===11||a===13)&&c.traits.length<3){
    if(isPlayerFamily(c)) askPersonality(c,a);
    else npcGainPersonality(c);
  }
  // 성인 (16세) — 교육 특성 확정
  if(a===16&&c.edu===null){
    comeOfAge(c);
  }
  // 혼약 → 혼인 자동 완성 (CK3: betrothal → marriage at 16)
  if(a===16 && c.betrothed){
    const partner = chars[c.betrothed];
    if(partner && !partner.dead && age(partner)>=16 && !c.spouse && !partner.spouse){
      c.spouse = partner.id;
      partner.spouse = c.id;
      c.betrothed = null;
      partner.betrothed = null;
      if(isPlayerFamily(c)||isPlayerFamily(partner))
        log('<b>'+c.name+'</b>과(와) <b>'+partner.name+'</b>의 혼약이 혼인으로 성사됐습니다.','fam');
    }
  }
  // 노화 사망 (60세 이후, 위키: 60세 이후 자연사 가능)
  if(a>=60){
    const chance=(a-58)*0.035;
    if(Math.random()<chance) kill(c,'노환');
  }
}
function isPlayerFamily(c){
  const p=playerChar();
  return c.father===p.id||c.mother===p.id||c.courtOf===p.region;
}
function eduRoll(c){
  // 성공확률 = (60+S)/(100+S+F)  [위키 확정 공식]
  let S=0,F=0;
  const g=guardianOf(c);
  if(c.childTrait && CHILD_TRAITS[c.childTrait].foci.includes(c.eduFocus)) S+=20; else S-=20;
  if(g){ S += 0.4*stat(g,c.eduFocus) + 0.2*stat(g,'learn'); }
  else F+=20;
  const chance=(60+S)/(100+S+F);
  return Math.random()<chance;
}
function guardianOf(c){
  if(c.guardian&&chars[c.guardian]&&!chars[c.guardian].dead) return chars[c.guardian];
  if(c.father&&chars[c.father]&&!chars[c.father].dead) return chars[c.father];
  return null;
}
function comeOfAge(c){
  const sc=c.eduScore;
  c.edu = sc>=18?3 : sc>=13?2 : sc>=8?1 : 0;
  if(isPlayerFamily(c)||c.ruler){
    log(`<b>${c.name}</b>이(가) 성인이 되었습니다 — <b>${EDU_NAMES[c.eduFocus||'dip'][c.edu]}</b> (교육 점수 ${sc})`,'fam');
  }
  if(!c.eduFocus) c.eduFocus='dip';
  // 성격 특성 보충: 성인은 3개를 갖춰야 함 (시작 시점에 이벤트 시기를 지난 캐릭터 보정)
  if(isPlayerFamily(c)){
    while(c.traits.length<2) npcGainPersonality(c);
    if(c.traits.length<3) askPersonality(c,16);
  } else {
    while(c.traits.length<3) npcGainPersonality(c);
  }
  // 인생관: 플레이어 캐릭터 본인일 때만 선택 팝업
  if(c.id===state.player) askLifestyle(c);
  else c.lifestyle=randKey(SKILLS);
}

/* ---------- 교육/성격 선택 팝업 ---------- */
function askEducation(c){
  const ct=CHILD_TRAITS[c.childTrait||'curious'];
  const courtAdults=Object.values(chars).filter(k=>!k.dead&&age(k)>=16&&(k.courtOf===playerChar().region||k.id===state.player));
  const opts=Object.entries(SKILLS).map(([k,n])=>({
    t:`${n} 교육`+(ct.foci.includes(k)?' ★ 기질 일치':''),
    d:ct.foci.includes(k)?'어린시절 특성과 일치 — 교육 성공률 상승':'기질과 불일치 — 성공률 하락',
    f:()=>{ c.eduFocus=k; pickGuardian(c,courtAdults); }
  }));
  popup({title:`${c.name}의 교육`, sub:'6세 — 교육 방향 결정',
    body:`${c.name}이(가) 배움을 시작할 나이가 되었습니다.\n기질: ${ct.n} (적성: ${ct.foci.map(f=>SKILLS[f]).join(', ')})`,
    opts});
}
function pickGuardian(c,adults){
  const opts=adults.slice(0,5).map(g=>({
    t:`${g.name}`, d:`${SKILLS[c.eduFocus]} ${stat(g,c.eduFocus)} · 학문 ${stat(g,'learn')} · 성격: ${g.traits.map(t=>TRAITS[t].n).join('·')||'—'}`,
    f:()=>{ c.guardian=g.id; chOp(c,g,15); chOp(g,c,5);
      log(`<b>${g.name}</b>이(가) ${c.name}의 후견인이 되었습니다.`,'fam'); }
  }));
  popup({title:`${c.name}의 후견인`, sub:'후견 — 교육의 질을 결정합니다',
    body:'후견인의 해당 스킬(×0.4)과 학문(×0.2)이 교육 점수에 영향을 줍니다.\n아이는 후견인의 성격을 닮아갑니다.', opts});
}
function askPersonality(c,a){
  const g=guardianOf(c);
  const cand=new Set();
  if(g) g.traits.forEach(t=>{ if(canHaveTrait(c,t)) cand.add(t); });
  while(cand.size<3){
    const t=PERSONALITY_KEYS[Math.floor(Math.random()*PERSONALITY_KEYS.length)];
    if(canHaveTrait(c,t)) cand.add(t);
  }
  const opts=[...cand].slice(0,3).map(t=>({
    t:TRAITS[t].n, d:(g&&g.traits.includes(t))?'후견인의 영향':'',
    f:()=>{ c.traits.push(t); log(`<b>${c.name}</b>(${a}세)이(가) <b>${TRAITS[t].n}</b> 성격을 갖게 되었습니다.`,'fam'); }
  }));
  popup({title:`${c.name}의 성장`, sub:`${a}세 — 성격 형성`,
    body:`${c.name}의 성격이 뚜렷해지고 있습니다. 어떤 면모가 두드러집니까?`, opts});
}
function npcGainPersonality(c){
  const g=guardianOf(c);
  let t=null;
  if(g&&Math.random()<0.5){ const gs=g.traits.filter(x=>canHaveTrait(c,x)); if(gs.length) t=gs[Math.floor(Math.random()*gs.length)]; }
  if(!t){ let tries=0; do{ t=PERSONALITY_KEYS[Math.floor(Math.random()*PERSONALITY_KEYS.length)]; tries++; }while(!canHaveTrait(c,t)&&tries<20); }
  if(t&&canHaveTrait(c,t)) c.traits.push(t);
}
function canHaveTrait(c,t){
  return !c.traits.includes(t)&&!c.traits.includes(TRAITS[t].opp)&&c.traits.length<3;
}
function askLifestyle(c){
  const opts=Object.entries(SKILLS).map(([k,n])=>({
    t:`${n}의 길`, d:c.eduFocus===k?`교육 일치 — 경험치 +${(EDU_BONUS[c.edu]||1)*10}%`:'',
    f:()=>{ c.lifestyle=k; log(`<b>${c.name}</b>이(가) <b>${n}</b>의 길을 걷기로 했습니다.`,'fam'); }
  }));
  popup({title:'인생관', sub:'삶의 방향',
    body:`${c.name}은(는) 앞으로 어떤 통치자가 되려 합니까?\n(퍼크 시스템은 추후 — 현재는 경험치만 축적됩니다)`, opts});
}

/* ---------- 월간 펄스 ---------- */
function monthlyPulse(){
  for(const id in chars){
    const c=chars[id]; if(c.dead) continue;
    // 스트레스 자연감소 없음 (CK3 원작 동일)
    // 대처법(coping) 결단 사용 시에만 직접 감소
    // 인생관 경험치
    if(c.lifestyle){ let xp=10; if(c.edu!==null&&c.eduFocus===c.lifestyle) xp*=1+(EDU_BONUS[c.edu]*0.1); c.lifeXP+=Math.round(xp); }
    // 임신 진행
    if(c.pregnant>0){
      c.pregnant++;
      if(c.pregnant>=10) giveBirth(c);
    }
  }
  buildingPulse();
  fertilityPulse();
  naturalDeathPulse();
  councilPulse();
  buildingPulse();
  schemePulse();
  warPulse();
  aiPulse();
  randomEventPulse();
  goldPulse();
  // 플레이어 관직자 사망 → 공석
  for(const role in COUNCIL_ROLES){
    const cid=state.council[role];
    if(cid&&(!chars[cid]||chars[cid].dead)){
      state.council[role]=null;
      log(`${COUNCIL_ROLES[role].n} 자문회 보직이 공석이 됐습니다.`,'dip');
    }
  }
  if(state.month===1){
    claimExpirePulse();
    worldEventPulse();
    opinionDecayPulse(); // 관계도 자연 감소
  }
  renderMap();
}
/* ════════════════════════════════════════════════════
   봉신·직할령 시스템 (Phase 2)
   ════════════════════════════════════════════════════ */

/* 직할 보유 백작령: 내가 capital 남작령을 직접 소유한 county */
function directCountiesOf(charId){
  return Object.keys(COUNTIES).filter(cid=>BARONIES[COUNTIES[cid].capital]?.owner===charId);
}
/* 봉신이 보유한 백작령 (liege = charId) */
function vassalCountiesOf(charId){
  const vcids=[];
  for(const id in chars){
    const v=chars[id]; if(v.dead||v.liege!==charId||!v.ruler) continue;
    directCountiesOf(id).forEach(cid=>vcids.push(cid));
  }
  return vcids;
}
/* 봉신 목록 */
function vassalsOf(liegeId){ return Object.values(chars).filter(c=>!c.dead&&c.liege===liegeId&&c.ruler); }
/* 직할령 한도: 칭호 등급 기반 */
function domainLimit(c){
  const d=duchiesOf(c.id).length;
  const ct=directCountiesOf(c.id).length;
  // 소왕=6, 공작=4, 백작=2 (기본값은 보유 칭호로 판단)
  const base = d>=1?6 : ct>=3?4 : 2;
  return base + Math.floor(stat(c,'stew')*0.12);
}
/* 직할 초과 여부 */
function overDomainLimit(c){ return directCountiesOf(c.id).length > domainLimit(c); }
/* 백작령 봉신 하사 */
function grantCountyToVassal(liegeId, vassalId, cid){
  const liege=chars[liegeId], vassal=chars[vassalId];
  if(!liege||!vassal||!COUNTIES[cid]) return;
  // 해당 county의 모든 barony를 vassal에게 이전
  COUNTIES[cid].baronies.forEach(bid=>{ if(BARONIES[bid]) BARONIES[bid].owner=vassalId; });
  vassal.liege=liegeId;
  vassal.ruler=true;
  vassal.courtOf=null;
  if(!vassal.region||countyOf(vassal.region)!==cid) vassal.region=COUNTIES[cid].capital;
  chOp(vassal,liege,25); // 임명 감사 보너스
  log(`<b>${vassal.name}</b>이(가) ${COUNTIES[cid].n}의 백작으로 임명됐습니다.`,'good');
}
/* 봉신이 독립 선언 */
function vassalRevolt(v, liege){
  v.liege=null;
  chOp(v,liege,-50); chOp(liege,v,-50);
  log(`<b>${v.name}</b>이(가) ${liege.name}에게 반기를 들었습니다!`,'war');
  // 독립 전쟁 (복수 명분)
  directCountiesOf(v.id).forEach(cid=>v.claims.push({rid:cid, type:'revenge', obtained:state.year}));
  if(v.id===state.player||liege.id===state.player){
    popup({title:'봉신 반란!', sub:'정치 위기',
      body:`<b>${v.name}</b>이(가) 반란을 선포했습니다!\n봉신의 불만이 한계에 달했습니다.`,
      opts:[{t:'진압 전쟁 선포', f:()=>{
        if(liege.id===state.player) addClaim(directCountiesOf(v.id)[0],'revenge');
      }},{t:'독립을 인정한다', f:()=>{
        addStress(liege.id===state.player?liege:playerChar(), 20,'굴욕적 양보');
      }}]});
  }
}

function goldPulse(){
  // ① 모든 남작령: 병력 자연 회복 (barracks 보너스 포함)
  for(const bid in BARONIES){
    const b=BARONIES[bid];
    const regen=4+buildingBonus(bid,'troops_regen');
    b.troops=Math.min(b.cap, b.troops+regen);
  }

  // ② 각 지배자: 직할 남작령 세금 수입 계산
  const TAX_RATE=0.25; // 봉신 → 영주 세금 비율
  const processed=new Set();
  for(const id in chars){
    const c=chars[id]; if(c.dead||!c.ruler||processed.has(id)) continue;
    processed.add(id);
    const owned=regionsOf(id); if(!owned.length) continue;
    const seat=owned.includes(c.region)?c.region:owned[0];
    const seatB=BARONIES[seat]; if(!seatB) continue;

    // 직할령 초과 패널티
    const dCnt=directCountiesOf(id).length;
    const dLimit=domainLimit(c);
    const overPenalty=dCnt>dLimit?Math.max(0.3,1-(dCnt-dLimit)*0.15):1;

    // 직할 남작령 수입
    const directIncome=owned.reduce((s,bid)=>{
      const b=BARONIES[bid]; return s+(b?Math.round((4+stat(c,'stew')*0.5)*overPenalty):0);
    },0);
    const goldCap=id===state.player?3500:2500;
    seatB.gold=Math.min(goldCap, seatB.gold+directIncome);

    // ③ 봉신에게서 세금 수취 (봉신 호감도 기반)
    if(id===state.player||c.ruler){
      for(const v of vassalsOf(id)){
        const opn=Math.max(0,opinion(v,c)+100)/200; // 0~1 (호감도 반영)
        const taxMul=TAX_RATE*opn;
        const vOwned=regionsOf(v.id);
        const vSeat=vOwned.includes(v.region)?v.region:vOwned[0];
        const vSeatB=vSeat?BARONIES[vSeat]:null;
        if(!vSeatB) continue;
        const taxAmt=Math.round(vSeatB.gold*taxMul*0.08); // 월 수입의 일부
        if(taxAmt>0 && vSeatB.gold>taxAmt){
          vSeatB.gold-=taxAmt;
          seatB.gold=Math.min(goldCap, seatB.gold+taxAmt);
        }
      }
    }
  }

  // ④ 봉신 불만 → 반란 체크 (매달 2% × 불만도)
  for(const id in chars){
    const v=chars[id]; if(v.dead||!v.ruler||!v.liege) continue;
    const liege=chars[v.liege]; if(!liege||liege.dead) continue;
    const op=opinion(v,liege);
    if(op<-40 && Math.random()<0.02*((-op-40)/60)){
      vassalRevolt(v,liege);
    }
  }
}
/* ---------- 수태력 (위키: 평균수태력 × 4.75%) ---------- */
function fertilityPulse(){
  for(const id in chars){
    const c=chars[id];
    if(c.dead||c.sex!=='f'||!c.spouse||c.pregnant>0) continue;
    const h=chars[c.spouse]; if(!h||h.dead) continue;
    if(age(c)<16||age(h)<16) continue;
    const avg=(fert(c)+fert(h))/2;
    const chance=avg*0.0475;
    if(Math.random()<chance){
      c.pregnant=1;
      if(isPlayerFamily(c)||c.id===state.player||h.id===state.player)
        log(`<b>${c.name}</b>이(가) 회임했습니다.`,'fam');
    }
  }
}
/* ---------- 자연사 시스템 ---------- */
function naturalDeathChance(a){
  // 월간 사망 확률 (CK3 Health 시스템 기반 근사)
  if(a<16)  return 0.001;   // 영아/소아: 0.1%
  if(a<40)  return 0.0015;  // 청장년: 0.15%
  if(a<50)  return 0.003;   // 중년 초: 0.3%
  if(a<55)  return 0.006;   // 중년: 0.6%
  if(a<60)  return 0.010;   // 50대: 1%
  if(a<65)  return 0.016;   // 60대 초: 1.6%
  if(a<70)  return 0.025;   // 60대 후: 2.5%
  if(a<75)  return 0.038;   // 70대 초: 3.8%
  if(a<80)  return 0.055;   // 70대 후: 5.5%
  return 0.08;               // 80+: 8%
}
function naturalDeathPulse(){
  const p=playerChar();
  for(const id in chars){
    const c=chars[id];
    if(c.dead) continue;
    const a=age(c);
    let chance=naturalDeathChance(a);
    // 스트레스가 높으면 사망 확률 증가
    if(c.stress>=100) chance*=1.5;
    if(c.stress>=130) chance*=2.0;
    if(Math.random()>chance) continue;
    // 사망 처리
    if(c.id===state.player){
      // 플레이어 자신은 스트레스 사망과 동일하게 팝업 → kill
      popup({title:'노환', sub:'건강',
        body:`${c.name}이(가) ${a}세의 나이에 조용히 눈을 감았습니다.\n긴 통치의 무게가 몸을 앞서 갔습니다.`,
        opts:[{t:'...', f:()=>kill(c,'노환')}]});
    } else {
      // 배우자 사망 → 플레이어에게 알림
      if(c.spouse===state.player||chars[c.spouse]?.spouse===state.player||c.id===p.spouse){
        log(`<b>${c.name}</b>이(가) ${a}세를 일기로 세상을 떠났습니다.`,'fam');
        addStress(p,40,'배우자의 죽음');
        popup({title:'배우자의 죽음', sub:'가문',
          body:`${c.name}이(가) 조용히 눈을 감았습니다.\n${a}세였습니다. 오랜 동반자를 잃었습니다.`,
          opts:[{t:'명복을 빈다', f:()=>{ if(p.spouse===c.id) p.spouse=null; }}]});
      }
      // 자녀·가족 사망 → 로그만
      else if(c.father===state.player||c.mother===state.player){
        log(`<b>${c.name}</b>이(가) ${a}세로 사망했습니다.`,'fam');
        addStress(p,25,'자식의 죽음');
      }
      kill(c,'노환');
    }
  }
}
function giveBirth(c){
  c.pregnant=0; c.births++;
  const h=chars[c.spouse];
  const sex=Math.random()<0.51?'m':'f';
  const baby=mk({name:sex==='m'?randName():['이테','고름라트','사브','베브','오를라트'][Math.floor(Math.random()*5)],
    dyn:h?h.dyn:c.dyn, sex, byear:state.year, bmonth:state.month, bday:Math.min(state.day,28),
    base:babyStats(c,h), father:h?h.id:null, mother:c.id, courtOf:c.courtOf||((h&&h.region)?h.region:null)});
  if(h&&h.region) baby.courtOf=h.region;
  const fam=isPlayerFamily(baby)||(h&&h.id===state.player);
  if(fam){
    log(`<b>${c.name}</b>이(가) ${sex==='m'?'아들':'딸'} <b>${baby.name}</b>을(를) 낳았습니다.`,'good');
    if(h&&h.id===state.player) popup({title:'새 생명', sub:'출산',
      body:`${c.name}이(가) 건강한 ${sex==='m'?'아들':'딸'}을 낳았습니다.\n아이의 이름은 ${baby.name}입니다.`,
      opts:[{t:'가문에 축복이 있기를', f:()=>addStress(playerChar(),-15,'아이의 탄생')}]});
  } else if(h&&h.ruler){
    log(`${COUNTIES[countyOf(h.region)]?.n||BARONIES[h.region]?.n||''}의 궁정에 아이가 태어났습니다.`,'dip');
  }
}
function babyStats(m,f){
  const r={}; for(const k of ['dip','mar','stew','intr','learn','prow']){
    const mv=m?m.base[k]:5, fv=f?f.base[k]:5;
    r[k]=Math.max(0,Math.min(10,Math.round((mv+fv)/2 + (Math.random()*4-2))));
  } return r;
}

/* ---------- 살해 모략 (초기 CK3 단순 모델) ---------- */
function startScheme(plotter,target){
  if(state.schemes.some(s=>s.plotter===plotter.id&&s.target===target.id)) return false;
  state.schemes.push({plotter:plotter.id,target:target.id,months:0});
  // 성격에 반하는 행동 → 스트레스 (위키 상호작용표 기준)
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
    const p=chars[s.plotter], t=chars[s.target];
    if(!p||!t||p.dead||t.dead) return false;
    s.months++;
    if(s.months<3) return true; // 준비 기간
    /* 위키: 첩보관 Disrupt Schemes → +1%/skill 발각률 가산 (discoverBonus)
             Disrupt Schemes → 방어측 단계 시간 연장 (defBonus, months 제한으로 근사)
             Support Schemes → +5%+0.5%/skill 성공률 가산 (successBonus) */
    // 성공률: 음모 스탯 차이 기반 + 지원 보너스
    const succBase = Math.max(0.04, Math.min(0.45, 0.08+(stat(p,'intr')-stat(t,'intr'))*0.03));
    const succ = Math.min(0.65, succBase + (s.successBonus||0));
    // 발각률: 기본 + 방어 첩보관 발각 보너스
    const discover = Math.min(0.55, 0.07 + stat(t,'intr')*0.008 + (s.discoverBonus||0));
    const roll=Math.random();
    if(roll<succ){
      log(`<b>${t.name}</b>이(가) 의문의 죽음을 맞았습니다. 독이 든 술잔이었습니다.`,'war');
      if(s.plotter===state.player) log('아무도 진실을 모릅니다. 아직은.','war');
      if(s.target===state.player){
        popup({title:'독배', sub:'암살',
          body:'연회의 술잔에 독이 들어 있었습니다.\n시야가 흐려지고, 다리에 힘이 풀립니다...',
          opts:[{t:'...', f:()=>kill(t,'독살')}]});
      } else kill(t,'독살');
      return false;
    }
    if(roll<succ+discover){
      log(`<b>${p.name}</b>의 살해 모략이 발각되었습니다! 대상: ${t.name}`,'war');
      chOp(t,p,-50);
      for(const rid in REGIONS){const r=rulerOf(rid); if(r&&r.id!==p.id) chOp(r,p,-15);}
      if(s.plotter===state.player) addStress(p,20,'모략 발각의 수치');
      if(s.target===state.player){
        popup({title:'발각된 음모', sub:'첩보',
          body:`첩자가 보고합니다. <b>${p.name}</b>이(가) 당신의 목숨을 노리고 있었습니다.\n모략은 저지되었으나, 칼끝은 여전히 어둠 속에 있습니다.`,
          opts:[{t:'경계를 강화한다'},
                {t:'복수를 다짐한다', d:'관계 -30', f:()=>chOp(playerChar(),p,-30)}]});
      }
      return false;
    }
    /* 위키: defBonus = 방어 단계 시간 연장 → months 상한 축소로 표현 (30→최대 36) */
    const monthLimit = 30 + Math.min(6, Math.round((s.defBonus||0)/10));
    return s.months < monthLimit;
  });
}

/* ---------- 전쟁 ---------- */
/* targetRid: 전쟁 목표 영지. null이면 적의 본거지 */
function declareWar(atk,def,targetRid){
  if(truceBetween(atk.id,def.id)) return false;
  if(state.wars.some(w=>(w.atk===atk.id&&w.def===def.id)||(w.atk===def.id&&w.def===atk.id))) return false;
  // ── 동맹 간 전쟁 불가
  if(isAllied(atk.id,def.id)){
    if(atk.id===state.player) log('동맹국에는 선전포고할 수 없습니다. 먼저 동맹을 파기하세요.','dip');
    return false;
  }
  // targetRid가 county id면 capital barony로 변환, 전쟁 log엔 county명 사용
  let tRid = targetRid || def.region || regionsOf(def.id)[0];
  let tCid = null; // county id (로그/UI용)
  if(COUNTIES[tRid]){ tCid=tRid; tRid=COUNTIES[tRid].capital; } // county → barony
  else if(BARONIES[tRid]){ tCid=BARONIES[tRid].county; }        // barony → county
  if(!tRid||!BARONIES[tRid]){ return false; }
  /* 지휘관 자동 지정: 공격자의 원수(marshal) → 없으면 공격자 본인 */
  const _atkCmd = (atk.council?.marshal && chars[atk.council.marshal] && !chars[atk.council.marshal].dead)
    ? atk.council.marshal : atk.id;
  const _defCmd = (def.council?.marshal && chars[def.council.marshal] && !chars[def.council.marshal].dead)
    ? def.council.marshal : def.id;
  state.wars.push({
    atk:atk.id, def:def.id, targetRid:tCid||tRid,
    score:0, months:0, allies:[],
    atkCmd:_atkCmd, defCmd:_defCmd, // 지휘관 charId
    occupied:[]
  });
  chOp(def,atk,-40);
  log(`<b>${atk.name}</b>이(가) <b>${tCid?COUNTIES[tCid]?.n:BARONIES[tRid]?.n||tRid}</b>을(를) 목표로 선전포고했습니다!`,'war');
  if(atk.id===state.player){
    playSynthSFX('war');
    if(atk.traits.includes('calm')) addStress(atk,15,'침착한 자의 개전');
    if(atk.traits.includes('content')) addStress(atk,15,'만족하는 자의 개전');
  }
  // NPC 피침략 → 복수 명분
  if(def.id!==state.player && def.ruler) npcGrantRevenge(def, tRid);
  // ── 방어 동맹 자동 참전 알림
  const defAllies = state.alliances.filter(k=>k.includes(def.id)).map(k=>k.replace(def.id,'').replace('|','')).filter(x=>x&&chars[x]&&!chars[x].dead);
  for(const aid of defAllies){
    if(aid===atk.id) continue;
    if(aid===state.player){
      popup({title:'동맹 방어 의무', sub:'전쟁',
        body:`<b>${def.name}</b>이(가) ${atk.name}에게 침공당했습니다.\n당신은 동맹으로서 방어에 참전할 의무가 있습니다.`,
        opts:[
          {t:'참전한다 (동맹 의무)', f:()=>{
            state.wars.find(w=>w.atk===atk.id&&w.def===def.id)?.allies.push(state.player);
            log('동맹국 방어에 참전했습니다.','war');
          }},
          {t:'거부한다 (위신 -50)', f:()=>{
            state.prestige=Math.max(0,state.prestige-50);
            breakAlliance(state.player,def.id);
            log('동맹 의무를 저버렸습니다. 위신이 크게 하락했습니다.','war');
          }},
        ]});
    } else {
      // NPC 동맹은 80% 확률로 자동 참전
      if(Math.random()<0.8){
        state.wars.find(w=>w.atk===atk.id&&w.def===def.id)?.allies.push(aid);
        log(`${chars[aid].name}이(가) 동맹 의무로 ${def.name}의 방어에 참전했습니다.`,'war');
      } else {
        breakAlliance(aid,def.id);
        log(`${chars[aid].name}이(가) 동맹 의무를 저버렸습니다.`,'war');
      }
    }
  }
  if(def.id===state.player){
    grantRevengeClaim(tCid||tRid);
    const _w2 = state.wars.find(x=>x.atk===atk.id&&x.def===def.id);
    const _myCmd2 = _w2 ? warCommander(_w2,'def') : null;
    const _cmdLine = _myCmd2 ? `\n\n⚔ 지휘관: ${_myCmd2.name} (무예 ${stat(_myCmd2,'mar')} · 용맹 ${stat(_myCmd2,'prow')})` : '';
    popup({title:'전쟁이다!', sub:'침공',
      body:`${atk.name}의 군대가 국경을 넘었습니다!\n목표: <b>${tCid?COUNTIES[tCid]?.n:BARONIES[tRid]?.n||tRid}</b>\n복수 명분이 생겼습니다.${_cmdLine}`,
      opts:[{t:'전군 소집!', f:()=>addStress(playerChar(),10,'전쟁의 무게')}]});
  }
  renderMap(); return true;
}
function truceBetween(a,b){ const k=[a,b].sort().join('|'); return state.truces[k]&&state.truces[k]>state.year; }
function setTruce(a,b,years){ const k=[a,b].sort().join('|'); state.truces[k]=state.year+years; }
function allianceKey(a,b){ return [a,b].sort().join('|'); }
function isAllied(a,b){ return state.alliances.includes(allianceKey(a,b))||state.npcAlliances.includes(allianceKey(a,b)); }
function breakAlliance(a,b){
  const k=allianceKey(a,b);
  state.alliances=state.alliances.filter(x=>x!==k);
  state.npcAlliances=state.npcAlliances.filter(x=>x!==k);
  setTruce(a,b,5); // 파기 후 5년 휴전
  chOp(chars[a],chars[b],-40); chOp(chars[b],chars[a],-40);
}
function formAlliance(a,b){
  const k=allianceKey(a,b);
  if(!state.alliances.includes(k)&&!state.npcAlliances.includes(k)) state.alliances.push(k);
}
function power(c){
  let t=0;
  for(const bid of regionsOf(c.id)){ const b=BARONIES[bid]; if(b) t+=b.troops; }
  // 봉신 병력 10% 징집 가능
  for(const v of vassalsOf(c.id)){
    for(const bid of regionsOf(v.id)){ const b=BARONIES[bid]; if(b) t+=b.troops*0.1; }
  }
  if(!t) t=150;
  // 기본 전력: 병력 × 무예 보정 × 용맹 보정
  const base = t * (1+stat(c,'mar')*0.04) * (1+stat(c,'prow')*0.01);
  return base;
}

/* 전쟁 지휘관 헬퍼 */
function warCommander(w, side){
  // side: 'atk' or 'def'
  const cmdId = side==='atk' ? w.atkCmd : w.defCmd;
  if(!cmdId) return null;
  const c = chars[cmdId];
  return (c && !c.dead) ? c : null;
}

/* 지휘관 보정 전력 (CK3: 무예 → Advantage → +5%/point 피해)
   근사: 무예 1점 = 전력 2% 보정 */
function powerWithCommander(c, w, side){
  const base = power(c);
  const cmd = warCommander(w, side);
  if(!cmd) return base;
  const marBonus = 1 + stat(cmd,'mar') * 0.02;  // 무예 보정
  const prowBonus = 1 + stat(cmd,'prow') * 0.01; // 용맹 보정
  // 지휘관 특성 보정
  let traitMul = 1;
  if(cmd.traits.includes('brave'))     traitMul += 0.05;
  if(cmd.traits.includes('wrathful'))  traitMul += 0.03;
  if(cmd.traits.includes('diligent'))  traitMul += 0.03;
  if(cmd.traits.includes('patient'))   traitMul += 0.02;
  if(cmd.traits.includes('craven'))    traitMul -= 0.05;
  if(cmd.traits.includes('lazy'))      traitMul -= 0.03;
  return base * marBonus * prowBonus * traitMul;
}
function resolveWarChar(wSide){
  const c=chars[wSide]; if(c&&!c.dead) return wSide;
  const heir=Object.values(chars).find(k=>!k.dead&&k.ruler&&k.dyn===c?.dyn&&k.id!==wSide);
  return heir?heir.id:null;
}

/* 백작령 점령 진행도: 목표 county의 baronies 중 공격자가 사실상 제압한 비율 */
function siegeProgress(w){
  const cid=w.targetRid;
  if(!cid||!COUNTIES[cid]) return 0;
  const bids=COUNTIES[cid].baronies;
  // 점령 비율: 공격자가 우세할수록 baronies가 "점령"됨 (w.occupied 배열로 추적)
  if(!w.occupied) w.occupied=[];
  return bids.length>0 ? w.occupied.length/bids.length : 0;
}

function warPulse(){
  state.wars=state.wars.filter(w=>{
    // ── 사망 시 승계 유지
    const newAtk=resolveWarChar(w.atk), newDef=resolveWarChar(w.def);
    if(!newAtk||!newDef) return false;
    if(newAtk!==w.atk){ log(`${chars[newAtk].name}이(가) 전쟁을 이어받았습니다.`,'war'); w.atk=newAtk; }
    if(newDef!==w.def){ log(`${chars[newDef].name}이(가) 방어를 이어받았습니다.`,'war'); w.def=newDef; }
    const a=chars[w.atk], d=chars[w.def];

    // ── 목표 백작령 3자 정복 감지 (county id 기반)
    const tCid=w.targetRid;
    if(tCid&&COUNTIES[tCid]){
      const capHolder=countyHolder(tCid);
      if(capHolder&&capHolder.id!==w.def&&capHolder.id!==w.atk){
        if(w.atk===state.player||w.def===state.player){
          popup({title:'전쟁 목표 상실', sub:'전황 변화',
            body:`${capHolder.name}이(가) <b>${COUNTIES[tCid].n}</b>을(를) 먼저 점령했습니다!\n전쟁 목표가 사라졌습니다.`,
            opts:[
              {t:'새 목표를 찾는다', f:()=>{
                const alt=directCountiesOf(w.def===state.player?a.id:d.id).find(c=>c!==tCid);
                if(alt){ w.targetRid=alt; w.occupied=[]; log(`새 목표: ${COUNTIES[alt].n}`,'war'); }
                else { setTruce(w.atk,w.def,2); log('목표가 없어 전쟁 종결.','war'); state.wars=state.wars.filter(x=>x!==w); }
              }},
              {t:'전쟁을 끝낸다', f:()=>{ setTruce(w.atk,w.def,2); state.wars=state.wars.filter(x=>x!==w); }},
            ]});
          return true;
        } else { setTruce(w.atk,w.def,2); return false; }
      }
    }

    w.months++;
    if(!w.occupied) w.occupied=[];

    // ── 지휘관 갱신 (사망·해임 시)
    if(!w.atkCmd||!chars[w.atkCmd]||chars[w.atkCmd].dead)
      w.atkCmd=(a.council?.marshal&&chars[a.council.marshal]&&!chars[a.council.marshal].dead)?a.council.marshal:a.id;
    if(!w.defCmd||!chars[w.defCmd]||chars[w.defCmd].dead)
      w.defCmd=(d.council?.marshal&&chars[d.council.marshal]&&!chars[d.council.marshal].dead)?d.council.marshal:d.id;

    // ── 전력 계산 (지휘관 보정 포함)
    const allyPow=(w.allies||[]).reduce((s,id)=>{ const v=chars[id]; return v?s+power(v)*0.6:s; },0);
    const vPow=vassalsOf(w.atk).reduce((s,v)=>s+power(v)*0.4,0);
    const pa=powerWithCommander(a,w,'atk')+allyPow+vPow;
    const pd=powerWithCommander(d,w,'def')+vassalsOf(w.def).reduce((s,v)=>s+power(v)*0.4,0);
    const ratio=(pa-pd)/Math.max(pa,pd);

    // ── 전쟁 소모 (병력·금)
    const warExhaust=0.97-Math.min(0.03,w.months*0.0005); // 장기전일수록 소모↑
    for(const bid of regionsOf(a.id)) BARONIES[bid].troops=Math.max(80,Math.round(BARONIES[bid].troops*warExhaust));
    for(const bid of regionsOf(d.id)) BARONIES[bid].troops=Math.max(80,Math.round(BARONIES[bid].troops*warExhaust));
    (w.allies||[]).forEach(aid=>{ for(const bid of regionsOf(aid)) BARONIES[bid].troops=Math.max(60,Math.round(BARONIES[bid].troops*0.98)); });
    // 금 소모
    const aSeat=BARONIES[a.region]; if(aSeat) aSeat.gold=Math.max(0,aSeat.gold-Math.round(3+w.months*0.1));
    const dSeat=BARONIES[d.region]; if(dSeat) dSeat.gold=Math.max(0,dSeat.gold-Math.round(3+w.months*0.1));

    // ── 공성 진행 (목표 county baronies 점령)
    if(tCid&&COUNTIES[tCid]){
      const bids=COUNTIES[tCid].baronies;
      // 성벽: 방어자 우세 보정
      const wallBonus=(COUNTIES[tCid]?.baronies||[]).filter(bid=>BARONIES[bid]?.buildings?.includes('walls')).length*0.1;
      if(ratio>0.1 && Math.random()<0.25+ratio*0.3-wallBonus){
        const unoccupied=bids.filter(bid=>!w.occupied.includes(bid));
        if(unoccupied.length) w.occupied.push(unoccupied[Math.floor(Math.random()*unoccupied.length)]);
      } else if(ratio<-0.1 && Math.random()<0.2){
        // 수비측 반격으로 일부 탈환
        if(w.occupied.length) w.occupied.splice(Math.floor(Math.random()*w.occupied.length),1);
      }
    }

    // ── 전황 점수: 전력비(60%) + 공성 진행도(40%)
    const siegePct=siegeProgress(w);
    const delta=ratio*9 + siegePct*6 + (Math.random()*8-4);
    w.score=Math.max(-100,Math.min(100,w.score+delta));

    // ── 전황 보고 (3개월마다)
    if(w.months%3===0&&(w.atk===state.player||w.def===state.player)){
      const my=w.atk===state.player?w.score:-w.score;
      const siege=tCid?` · 공성 ${Math.round(siegePct*100)}%`:'';
      const myCmd = warCommander(w, w.atk===state.player?'atk':'def');
      const cmdStr = myCmd ? ` · 지휘관: ${myCmd.name}(무${stat(myCmd,'mar')})` : '';
      log(`전황: ${my>=0?'+':''}${Math.round(my)}%${siege} — ${my>30?'아군 우세':my<-30?'적군 우세':'교착 상태'}${cmdStr}`,'war');
    }

    // ── 전투 이벤트 (플레이어 전쟁 시 월 20% 확률)
    if((w.atk===state.player||w.def===state.player) && Math.random()<0.20 && !state.modalOpen){
      _battleEvent(w, a, d, ratio, tCid);
    }

    // ── 승패 판정
    const allSieged=tCid&&COUNTIES[tCid]&&w.occupied.length>=COUNTIES[tCid].baronies.length;
    if(w.score>=100||allSieged){ conquerTarget(a,d,tCid||w.targetRid); return false; }
    if(w.score<=-100){
      log(`<b>${a.name}</b>의 침공이 격퇴됐습니다.`,'war');
      setTruce(a.id,d.id,5);
      if(w.atk===state.player){
        addStress(a,30,'패전의 굴욕'); addClaim(tCid||w.targetRid,'unpressed');
        // 패배 시 공격측 지휘관 부상/포로 체크 (CK3: 10% 포로)
        const losingCmd=warCommander(w,'atk');
        _cmdCasualty(losingCmd, a, false, w, 'atk');
      }
      if(w.def===state.player){
        addStress(d,-10,'승전의 기쁨'); if(dSeat) dSeat.gold+=80;
        // 승리 시에도 방어측 지휘관 소모 체크
        const winningCmd=warCommander(w,'def');
        if(winningCmd && Math.random()<0.05) log(`${winningCmd.name}이(가) 승전 중 경상을 입었습니다.`,'war');
      }
      return false;
    }
    if(w.months>60){
      log('오랜 전쟁이 지쳐 끝났습니다.','war'); setTruce(a.id,d.id,3); return false;
    }
    return true;
  });
}
/* ════════════════════════════════════════════════════
   전투 이벤트 시스템 (CK3 기반)
   출처: https://ck3.paradoxwikis.com/Army (지휘관·Advantage·부상 수치)
   ════════════════════════════════════════════════════ */

/* 지휘관 부상/포로 처리 (CK3: 패배 시 10% 포로, prowess로 부상률 결정) */
function _cmdCasualty(cmd, p, isVictory, w, side){
  if(!cmd || cmd.id===state.player) return; // 플레이어 본인은 별도 처리
  const prowess = stat(cmd,'prow');
  // 위키: prowess 높을수록 부상 확률 감소
  const injuryChance = Math.max(0.03, 0.20 - prowess*0.012);
  // 포로: 패배 시 10% (CK3 위키)
  if(!isVictory && Math.random()<0.10){
    log(`<b>${cmd.name}</b>이(가) 전장에서 포로로 잡혔습니다!`,'war');
    addStress(p,15,'지휘관 포로');
    chOp(cmd,p,-20);
    return;
  }
  if(Math.random()<injuryChance){
    if(!cmd.traits.includes('wounded') && !cmd.traits.includes('maimed')){
      cmd.traits.push('wounded');
      log(`<b>${cmd.name}</b>이(가) 전투 중 부상을 입었습니다.`,'war');
      if(cmd.id===state.player||isPlayerFamily(cmd))
        addStress(p,10,'지휘관 부상');
    } else if(cmd.traits.includes('wounded') && Math.random()<0.3){
      cmd.traits = cmd.traits.filter(t=>t!=='wounded');
      cmd.traits.push('maimed');
      log(`<b>${cmd.name}</b>이(가) 중상을 입었습니다!`,'war');
    }
  }
}

/* 전투 이벤트 8종 — warPulse에서 호출 */
function _battleEvent(w, a, d, ratio, tCid){
  const isAtk = w.atk===state.player;
  const p = playerChar();
  const myCmd = warCommander(w, isAtk?'atk':'def');
  const foeCmd = warCommander(w, isAtk?'def':'atk');
  const foe = isAtk ? d : a;
  const ally = isAtk ? a : d;

  // 지휘관 스탯 (없으면 플레이어 본인 값 사용)
  const myMar = myCmd ? stat(myCmd,'mar') : stat(p,'mar');
  const myProw = myCmd ? stat(myCmd,'prow') : stat(p,'prow');
  const myIntr = myCmd ? stat(myCmd,'intr') : stat(p,'intr');
  const cmdName = myCmd ? myCmd.name : p.name;

  /* 이벤트 후보 목록 — cond 조건 평가 후 첫 번째 해당 이벤트 발화 */
  const events = [

    /* ① 전선 돌파 — 아군 우세 + 공격 중 */
    { cond: isAtk && ratio>0.15,
      t:'전선 돌파!', sub:'전황 보고',
      body:`${cmdName}이(가) 보고합니다.
「${foe.name}의 방어선이 무너지고 있습니다. 지금이 기회입니다, 전하.」

현재 전황: +${Math.round(w.score)}%`,
      opts:[
        { t:'전속 추격한다', d:`전황 +${10+Math.round(myMar*0.5)} · 병력 소모 증가`,
          f:()=>{ const gain=10+Math.round(myMar*0.5); w.score=Math.min(100,w.score+gain);
            for(const b of regionsOf(ally.id)) BARONIES[b].troops=Math.max(80,Math.round(BARONIES[b].troops*0.93));
            log(`${cmdName}의 전속 추격으로 전황 +${gain}.`,'war');
            if(myCmd&&myCmd.traits.includes('brave')) addStress(p,-5,'용감한 지휘관의 결단'); }},
        { t:'진지를 굳힌다', d:'전황 유지 · 병력 보전',
          f:()=>{ log('진지를 강화하며 전선을 정비했습니다.','war'); }},
      ]},

    /* ② 적군 포위 — 열세 + 수비 중 */
    { cond: !isAtk && ratio<-0.15,
      t:'적군에 포위됐다!', sub:'위기',
      body:`${cmdName}이(가) 보고합니다.
「${foe.name}의 군대가 사방을 에워쌌습니다. 돌파구를 찾아야 합니다.」`,
      opts:[
        { t:'정면 돌파한다', d:`성공률 ${Math.min(70,30+myProw*2)}% · 실패 시 대손실`,
          f:()=>{ const succRate=Math.min(0.70,0.30+myProw*0.02);
            if(Math.random()<succRate){ w.score=Math.min(100,w.score+20); log('포위를 돌파했습니다! 전황이 역전됐습니다.','war'); }
            else{ for(const b of regionsOf(ally.id)) BARONIES[b].troops=Math.max(50,Math.round(BARONIES[b].troops*0.72));
              log('돌파 시도가 실패했습니다. 큰 손실을 입었습니다.','war'); }
            _cmdCasualty(myCmd,p,false,w,isAtk?'atk':'def'); }},
        { t:'방어선을 유지한다', d:'전황 -5 · 다음 기회를 노린다',
          f:()=>{ w.score=Math.max(-100,w.score-5); log('방어를 유지하며 원군을 기다립니다.','war'); }},
      ]},

    /* ③ 기습 성공 — 지휘관 brave 또는 intr 높을 때 */
    { cond: (myCmd&&(myCmd.traits.includes('brave')||myCmd.traits.includes('deceitful'))) && ratio>-0.1 && w.months>=3,
      t:'기습 성공!', sub:'전술 기동',
      body:`${cmdName}이(가) 야간 기습을 감행했습니다.
「허를 찔렀습니다! ${foe.name}의 진영이 혼란에 빠졌습니다.」`,
      opts:[
        { t:'혼란을 이용한다', d:`전황 +${15+Math.round(myIntr*0.5)}`,
          f:()=>{ const gain=15+Math.round(myIntr*0.5); w.score=Math.min(100,w.score+gain);
            for(const b of regionsOf(foe.id)) BARONIES[b].troops=Math.max(60,Math.round(BARONIES[b].troops*0.90));
            log(`${cmdName}의 기습으로 적진이 흔들렸습니다. 전황 +${gain}.`,'war'); }},
        { t:'추가 기습은 위험하다', d:'안전하게 현 전황 유지',
          f:()=>{ log('기습 성과를 굳히며 전선을 정비합니다.','war'); }},
      ]},

    /* ④ 보급 차단 — 장기전 (20월 이상) */
    { cond: w.months>=20 && ratio>0 && isAtk,
      t:'적군 보급 차단', sub:'전략',
      body:`${cmdName}이(가) 보고합니다.
「${foe.name}의 보급선이 취약합니다. 차단하면 전쟁이 빠르게 끝날 것입니다.」
전쟁 ${w.months}개월째.`,
      opts:[
        { t:'보급선을 차단한다', d:'적 병력 소모 가속 · 병력 소모 +',
          f:()=>{ for(const b of regionsOf(foe.id)) BARONIES[b].troops=Math.max(60,Math.round(BARONIES[b].troops*0.82));
            for(const b of regionsOf(ally.id)) BARONIES[b].troops=Math.max(70,Math.round(BARONIES[b].troops*0.95));
            log('적군 보급선을 차단했습니다. 적 병력이 급격히 감소합니다.','war'); }},
        { t:'정면 교전을 유지한다', d:'안전한 전술',
          f:()=>{}},
      ]},

    /* ⑤ 지휘관 결투 — 양측 지휘관 prow 모두 높을 때 */
    { cond: myCmd && foeCmd && stat(myCmd,'prow')>=7 && stat(foeCmd,'prow')>=7 && Math.random()<0.4,
      t:'지휘관 결투 요청', sub:'기사도',
      body:`${foeCmd.name}이(가) ${cmdName}에게 단독 결투를 신청했습니다.
「겁쟁이처럼 숨지 말고 칼로 승부하라!」

${cmdName} 용맹: ${myProw} vs ${foeCmd.name} 용맹: ${stat(foeCmd,'prow')}`,
      opts:[
        { t:'결투를 받아들인다', d:`승률 ${Math.min(80,30+Math.round((myProw-stat(foeCmd,'prow'))*5+50))}%`,
          f:()=>{
            const myAdv = myProw + Math.floor(Math.random()*6);
            const foeAdv = stat(foeCmd,'prow') + Math.floor(Math.random()*6);
            if(myAdv>foeAdv){
              w.score=Math.min(100,w.score+15);
              log(`${cmdName}이(가) ${foeCmd.name}을(를) 결투에서 이겼습니다! 전황 +15.`,'war');
              addStress(p,-10,'결투 승리의 영광');
              if(!foeCmd.traits.includes('wounded')) foeCmd.traits.push('wounded');
            } else {
              w.score=Math.max(-100,w.score-15);
              log(`${cmdName}이(가) ${foeCmd.name}에게 결투에서 졌습니다. 전황 -15.`,'war');
              addStress(p,15,'결투 패배의 수치');
              _cmdCasualty(myCmd,p,false,w,isAtk?'atk':'def');
            }
          }},
        { t:'거절한다', d:'위신 -5 · 안전',
          f:()=>{ state.prestige=Math.max(0,state.prestige-5);
            log(`${cmdName}이(가) 결투를 거절했습니다.`,'war');
            if(myCmd&&myCmd.traits.includes('brave')) addStress(p,10,'용감한 자의 굴욕'); }},
      ]},

    /* ⑥ 봉신 배신 의심 — 봉신 있을 때 */
    { cond: vassalsOf(p.id).length>0 && ratio<0.1 && Math.random()<0.35,
      t:'봉신의 배신 의혹', sub:'내부 첩보',
      body:`첩보관이 보고합니다.
「봉신 중 한 명이 ${foe.name}과(와) 내통하고 있다는 정보가 들어왔습니다.
사실이라면 전황에 큰 타격이 됩니다.」`,
      opts:[
        { t:'즉각 조사한다', d:'금 -30 · 봉신 관계 -15 · 첩보 확인',
          f:()=>{
            const seat=BARONIES[p.region];
            if(seat&&seat.gold>=30){ seat.gold-=30;
              const v=vassalsOf(p.id)[Math.floor(Math.random()*vassalsOf(p.id).length)];
              if(v){ chOp(v,p,-15);
                if(Math.random()<0.3){ w.score=Math.max(-100,w.score-10);
                  log(`${v.name}의 내통이 확인됐습니다. 전황에 타격을 입었습니다.`,'war');
                } else log(`${v.name}은 결백했습니다. 불필요한 의심이었습니다.`,'dip');
              }
            } else log('금이 부족합니다.','dip'); }},
        { t:'무시한다', d:'위험 무시 · 추후 문제 가능',
          f:()=>{ if(Math.random()<0.2){ w.score=Math.max(-100,w.score-8);
            log('의혹을 무시했더니 적에게 정보가 새어나간 것 같습니다.','war'); }}},
      ]},

    /* ⑦ 밤 기습 방어 — 수비 중 */
    { cond: !isAtk && ratio>-0.2 && w.months>=5,
      t:'적의 야습!', sub:'긴급',
      body:`${cmdName}이(가) 보고합니다.
「${foe.name}의 군대가 야음을 틈타 기습해 왔습니다!
즉각 대응이 필요합니다.」`,
      opts:[
        { t:'즉각 반격한다', d:`성공률 ${Math.min(75,40+myProw*2)}% · 기회 포착`,
          f:()=>{ const succ=Math.min(0.75,0.40+myProw*0.02);
            if(Math.random()<succ){ w.score=Math.min(100,w.score+12);
              log('야습을 성공적으로 격퇴하고 반격했습니다. 전황 +12.','war');
            } else { log('야습 대응에 실패했습니다.','war');
              for(const b of regionsOf(ally.id)) BARONIES[b].troops=Math.max(70,Math.round(BARONIES[b].troops*0.93)); }}},
        { t:'방어 진형을 갖춘다', d:'안정적 방어 · 손실 최소화',
          f:()=>{ log('방어 진형으로 야습을 막아냈습니다.','war');
            for(const b of regionsOf(ally.id)) BARONIES[b].troops=Math.max(80,Math.round(BARONIES[b].troops*0.97)); }},
      ]},

    /* ⑧ 소규모 충돌 — fallback (항상 발화 가능) */
    { cond: true,
      t:'국경 충돌', sub:'전황',
      body:`${cmdName}이(가) 보고합니다.
「국경 일대에서 소규모 전투가 계속되고 있습니다.
양측 모두 소모를 피할 수 없습니다.」

현재 전황: ${w.score>=0?'+':''}${Math.round(w.score)}%`,
      opts:[
        { t:'공세를 강화한다', d:`전황 +${3+Math.round(myMar*0.3)} · 병력 소모`,
          f:()=>{ const gain=3+Math.round(myMar*0.3); w.score=Math.min(100,w.score+gain);
            for(const b of regionsOf(ally.id)) BARONIES[b].troops=Math.max(80,Math.round(BARONIES[b].troops*0.97));
            log(`공세를 강화했습니다. 전황 +${gain}.`,'war'); }},
        { t:'병력을 아낀다', d:'병력 보전 · 현 전황 유지',
          f:()=>{ log('소모를 최소화하며 전선을 유지합니다.','war'); }},
      ]},

  ];

  /* 발화 이벤트 선택 — cond 통과하는 첫 번째 */
  const ev = events.find(e=>e.cond);
  if(ev) popup({title:ev.t, sub:ev.sub||'전황', body:ev.body, opts:ev.opts});
}

/* 백작령 단위 정복: 해당 county의 모든 barony를 승자에게 이전 */
function conquerTarget(a, d, targetCid){
  // targetCid가 county id인지 barony id인지 판별
  let cid = targetCid;
  if(BARONIES[targetCid]) cid = BARONIES[targetCid].county; // barony → county
  if(!cid||!COUNTIES[cid]){ setTruce(a.id,d.id,5); return; }
  const cname = COUNTIES[cid].n;
  log(`<b>${a.name}</b>이(가) <b>${cname}</b>을(를) 정복했습니다!`,'war');
  setTruce(a.id,d.id,5);
  // 해당 county의 모든 barony를 공격자에게 이전
  const bids = COUNTIES[cid].baronies;
  const aSeat = BARONIES[a.region];
  bids.forEach(bid=>{
    const b=BARONIES[bid]; if(!b) return;
    if(aSeat) aSeat.gold+=Math.round(b.gold*0.3);
    b.gold=Math.round(b.gold*0.7);
    b.owner=a.id;
  });
  // def의 seat이 이 county에 있었으면 남은 county의 capital로 이동
  const defCounty=countyOf(d.region);
  if(defCounty===cid){
    const remaining=regionsOf(d.id).filter(bid=>BARONIES[bid]?.county!==cid);
    if(remaining.length){ d.region=remaining[0]; }
    else { d.ruler=false; d.region=null; d.courtOf=a.region; }
  }
  if(a.id===state.player){
    addStress(a,-15,'정복의 영광');
    const remCnt=countiesOf(d.id).length;
    const canVassal=remCnt>0&&!d.dead; // 아직 영지가 있으면 봉신화 가능
    popup({title:'정복', sub:cname,
      body:`<b>${cname}</b>이(가) 당신의 깃발 아래 들어왔습니다!${remCnt>0?`\n${d.name}에게는 아직 ${remCnt}개 백작령이 남아있습니다.`:'\n'+d.name+'은(는) 당신의 궁정에 무릎 꿇었습니다.'}`,
      opts:[
        ...(canVassal?[{t:`${d.name}을 봉신으로 삼는다`, d:'나머지 영지 유지, 세금 수취',
          f:()=>{ d.liege=a.id; chOp(d,a,20); log(`${d.name}이(가) 당신의 봉신이 됐습니다.`,'dip'); checkVictoryHint(); }}]:[]),
        {t:'에이레가 지켜보고 있다', f:checkVictoryHint}
      ]});
  }
  if(d.id===state.player&&!d.region){
    gameOver(`${cname}이(가) 함락되었습니다. ${a.name}이(가) 당신의 왕좌를 빼앗았습니다.`);
  }
  renderMap();
}
function conquer(a,d){ conquerTarget(a,d,countyOf(d.region)||regionsOf(d.id)[0]); }
function ownerOf(rid){ return rulerOf(rid); }
function playerRegions(){ return regionsOf(state.player); }
function playerCounties(){ return countiesOf(state.player); }
function playerDuchies(){ return duchiesOf(state.player); }
function checkVictoryHint(){
  const n=playerRegions().length;
  if(n>=7) return; // 결단에서 처리
  if(n>=4) log(`현재 ${n}개 왕국을 지배 중입니다. [결단] 메뉴를 확인하세요.`,'good');
}

/* ---------- NPC AI ---------- */
/* ════════════════════════════════════════════════════
   NPC 자문회 시스템
   ════════════════════════════════════════════════════ */

/* NPC 자문회 자동 배치: 매년 1월에 재구성 */
/* 해당 궁정 소속 인원만, 중복 배정 없이, 부족하면 공석 */
function courtMembersOf(ruler){
  return Object.values(chars).filter(c=>
    !c.dead && age(c)>=16 && c.id!==ruler.id &&
    c.courtOf===ruler.region  // 해당 궁정 소속만
  );
}
function councilAssignedIds(ruler){
  return Object.values(ruler.council).filter(Boolean);
}
/* NPC 공석 자동 채우기 (연 1회, 중복 없이, 해당 궁정만) */
function buildNpcCouncil(ruler){
  const members = courtMembersOf(ruler);
  for(const role in COUNCIL_ROLES){
    // 기존 관직자가 살아있으면 유지
    const cur = ruler.council[role];
    if(cur && chars[cur] && !chars[cur].dead) continue;
    // 사망 시 공석 처리
    ruler.council[role] = null;
    // 이미 다른 보직에 배정된 인원 제외
    const assigned = councilAssignedIds(ruler);
    const sk = COUNCIL_ROLES[role].skill;
    const cand = members
      .filter(c=>!assigned.includes(c.id))
      .sort((a,b)=>stat(b,sk)-stat(a,sk));
    if(cand.length) ruler.council[role] = cand[0].id;
    // 부족하면 공석 그대로 (null)
  }
}
/* 플레이어 자문회 임명 — 중복 배정 방지 */
function appointCouncilor(role, charId){
  // 이미 다른 보직에 있는 인원인지 확인
  if(charId){
    for(const r in state.council){
      if(r!==role && state.council[r]===charId){
        log(`${chars[charId].name}은(는) 이미 ${COUNCIL_ROLES[r].n} 보직을 맡고 있습니다.`,'dip');
        renderCourt(); return;
      }
    }
  }
  const prev = state.council[role];
  if(prev && chars[prev]) chOp(chars[prev], playerChar(), -10);
  state.council[role] = charId || null;
  if(charId && chars[charId]){
    chOp(chars[charId], playerChar(), 20);
    log(`<b>${chars[charId].name}</b>이(가) ${COUNCIL_ROLES[role].n}(으)로 임명되었습니다.`, 'good');
  }
  renderCourt();
}

/* NPC 자문회 효과 (월간) */
function npcCouncilPulse(){
  for(const id in chars){
    const r = chars[id];
    if(r.dead || !r.ruler || id===state.player || !r.region || !REGIONS[r.region]) continue;

    // 자문회 멤버 사망 시 공석 처리
    for(const role in COUNCIL_ROLES){
      const cid=r.council[role];
      if(cid&&(!chars[cid]||chars[cid].dead)) r.council[role]=null;
    }

    // 사제: 명분 위조 (월 5% 확률 — CK3: Chaplain Fabricate Claim)
    if(r.council.chaplain && Math.random()<0.05){
      const cid = r.council.chaplain;
      const chap = chars[cid];
      if(!chap||chap.dead){ r.council.chaplain=null; }
      else {
        const sk = (cid===r.id) ? Math.round(stat(r,'learn')*0.6) : stat(chap,'learn');
        // 진행 속도 3+sk/5%/월 기준 확률화
        const adjCids = COUNTY_ADJ[countyOf(r.region)]||[];
        const targets = adjCids.filter(tcid=>{
          const holder=countyHolder(tcid);
          return holder && holder.id!==r.id && !r.claims.find(c=>c.rid===tcid);
        });
        if(targets.length && Math.random() < (3+sk/5)/100 * 3){
          const tcid = targets[Math.floor(Math.random()*targets.length)];
          r.claims.push({rid:tcid, type:'unpressed', obtained:state.year});
          if(countyHolder(tcid)?.id===state.player)
            log(`${r.name}의 사제가 <b>${COUNTIES[tcid].n}</b>에 대한 교회법 명분을 확보했습니다!`,'war');
        }
      }
    }

    // 원수: 병력 소폭 강화
    if(r.council.marshal){
      const mk2 = chars[r.council.marshal];
      const msk = (!mk2||mk2.dead||r.council.marshal===r.id) ? Math.round(stat(r,'mar')*0.6) : stat(mk2,'mar');
      REGIONS[r.region].troops=Math.min(REGIONS[r.region].cap, REGIONS[r.region].troops+Math.round(msk*0.8));
    }

    // 재무관: 금 소폭 증가
    if(r.council.steward){
      const st = chars[r.council.steward];
      const ssk = (!st||st.dead||r.council.steward===r.id) ? Math.round(stat(r,'stew')*0.6) : stat(st,'stew');
      REGIONS[r.region].gold=Math.min(2000, REGIONS[r.region].gold+Math.round(ssk*0.6));
    }

    // 명분 만료 체크 (unpressed → 10년)
    r.claims = r.claims.filter(cl=>{
      if(cl.type==='unpressed' && state.year-cl.obtained>10) return false;
      return true;
    });
  }
}

/* NPC 명분 체크 (전쟁 가능 여부) */
function npcHasClaim(r, targetRid){
  return r.claims.some(c=>c.rid===targetRid);
}
function npcGetClaimTarget(r){
  // 유효한 명분 (county 단위) 중 랜덤 선택
  const valid = r.claims.filter(c=>{
    if(!c.rid) return false;
    // county claim: 해당 county의 capital을 상대가 보유하는지 확인
    const capBid = COUNTIES[c.rid]?.capital || c.rid;
    return BARONIES[capBid]&&BARONIES[capBid].owner!==r.id;
  });
  if(!valid.length) return null;
  return valid[Math.floor(Math.random()*valid.length)].rid;
}
function npcUseClaim(r, rid){
  r.claims = r.claims.filter(c=>c.rid!==rid);
}
/* NPC 피침략 → 복수 명분 자동 부여 */
function npcGrantRevenge(defender, rid){
  if(!defender.claims.find(c=>c.rid===rid))
    defender.claims.push({rid, type:'revenge', obtained:state.year});
}

/* ════════════════════════════════════════════════════
   NPC 활동 시스템 — 12종
   cooldown: lastActivity 마지막 수행 연도 기록
   ════════════════════════════════════════════════════ */
const NPC_ACTIVITIES = [

  /* ① 연회 — 관계 개선, 금 소모 */
  {
    id:'feast', n:'연회', icon:'🍖', cooldown:1,
    cond:(r,reg)=>reg.gold>80 && !r.traits.includes('greedy'),
    run:(r,reg,adj)=>{
      reg.gold -= 60;
      const guests=adj.filter(t=>t&&t.id!==r.id&&!t.dead);
      const cnt=Math.min(guests.length,1+Math.floor(Math.random()*2));
      const invited=guests.sort(()=>Math.random()-.5).slice(0,cnt);
      invited.forEach(g=>{ chOp(g,r,10); chOp(r,g,7); });
      if(invited.some(g=>g.id===state.player)&&Math.random()<0.5){
        const p=playerChar();
        popup({title:`${r.name}의 연회 초대`,sub:`${COUNTIES[countyOf(r.region)]?.n||''} 왕국`,
          body:`${r.name}이(가) 성대한 연회를 열고 당신을 초대했습니다.`,
          opts:[
            {t:'참석한다',d:'관계 +15, 스트레스 -10',f:()=>{
              chOp(r,p,15);chOp(p,r,10);addStress(p,-10,'연회의 즐거움');
              if(p.traits.includes('shy'))addStress(p,8,'내성적인 자의 고역');
              log(`${r.name}의 연회에 참석했습니다.`,'dip');
            }},
            {t:'정중히 거절한다',d:'관계 -5',f:()=>{chOp(r,p,-5);log(`${r.name}의 연회를 거절했습니다.`,'dip');}},
          ]});
      } else if(invited.length>0){
        log(`${r.name}이(가) 연회를 열었습니다.`,'dip');
      }
    }
  },

  /* ② 사냥 — 소규모 유대, 금 소모 */
  {
    id:'hunt', n:'사냥', icon:'🦌', cooldown:1,
    cond:(r,reg,adj)=>reg.gold>20&&adj.some(t=>t&&t.id!==r.id&&!t.dead),
    run:(r,reg,adj)=>{
      reg.gold-=15;
      const partner=adj.find(t=>t&&t.id!==r.id&&!t.dead&&opinion(r,t)>-20);
      if(!partner) return;
      chOp(partner,r,8);chOp(r,partner,8);
      if(partner.id===state.player){
        popup({title:`${r.name}의 사냥 초대`,sub:'여흥',
          body:`${r.name}이(가) 가을 사냥에 동행할 것을 청합니다.`,
          opts:[
            {t:'함께 나선다',d:'관계 +10, 스트레스 -8',f:()=>{
              const p=playerChar();chOp(r,p,10);addStress(p,-8,'사냥의 즐거움');
              log(`${r.name}과(와) 함께 사냥을 즐겼습니다.`,'dip');
            }},
            {t:'거절한다',d:'관계 -5',f:()=>chOp(r,playerChar(),-5)},
          ]});
      }
    }
  },

  /* ③ 순례 — 민심·경건 상승, 종교 관계 개선 */
  {
    id:'pilgrimage', n:'순례', icon:'✝', cooldown:2,
    cond:(r)=>r.traits.includes('zealous')||r.traits.includes('pious')||Math.random()<0.2,
    run:(r,reg,adj)=>{
      reg.pop=Math.min(100,(reg.pop||60)+6);
      adj.filter(t=>t&&t.id!==r.id&&(t.traits.includes('zealous')||t.traits.includes('pious')))
        .forEach(t=>{chOp(t,r,6);chOp(r,t,6);});
      log(`${r.name}이(가) 클론맥노이즈 수도원으로 순례를 떠났습니다.`,'dip');
    }
  },

  /* ④ 외교 방문 — 우호 관계 강화 */
  {
    id:'diplomacy', n:'외교 방문', icon:'🤝', cooldown:1,
    cond:(r,reg,adj)=>adj.some(t=>t&&t.id!==r.id&&!t.dead&&opinion(r,t)>0),
    run:(r,reg,adj)=>{
      const target=adj.find(t=>t&&t.id!==r.id&&!t.dead&&opinion(r,t)>0);
      if(!target) return;
      chOp(target,r,10);chOp(r,target,10);
      if(target.id===state.player){
        popup({title:'외교 방문',sub:`${r.name}의 방문`,
          body:`${r.name}이(가) 직접 당신의 궁정을 찾아왔습니다.\n「먼스터의 명성이 에이레에 울려 퍼집니다, 전하.」`,
          opts:[
            {t:'환대한다',d:'관계 +15, 금 -20',f:()=>{
              const p=playerChar();
              if(REGIONS[p.region].gold>=20)REGIONS[p.region].gold-=20;
              chOp(r,p,15);log(`${r.name}을(를) 극진히 맞이했습니다.`,'good');
            }},
            {t:'형식적으로 맞이한다',d:'관계 +5',f:()=>chOp(r,playerChar(),5)},
          ]});
      } else {
        log(`${r.name}이(가) ${target.name}의 궁정을 방문했습니다.`,'dip');
      }
    }
  },

  /* ⑤ 건설 — 영지 발전 투자 */
  {
    id:'build', n:'영지 건설', icon:'🏗', cooldown:2,
    cond:(r,reg)=>reg.gold>120&&(reg.pop||60)<90,
    run:(r,reg)=>{
      const invest=40+Math.floor(Math.random()*40);
      reg.gold-=invest;
      reg.pop=Math.min(100,(reg.pop||60)+4);
      reg.cap=Math.min(2000,(reg.cap||300)+30);
      log(`${r.name}이(가) 영지 개발에 ${invest}금을 투자했습니다.`,'good');
    }
  },

  /* ⑥ 병력 징집 — 전쟁 준비 */
  {
    id:'muster', n:'병력 징집', icon:'⚔', cooldown:1,
    cond:(r,reg)=>reg.gold>100&&reg.troops<reg.cap*0.6
      &&(r.traits.includes('brave')||r.traits.includes('wrathful')||Math.random()<0.3),
    run:(r,reg,adj)=>{
      const cost=60+Math.floor(Math.random()*40);
      const gain=100+Math.floor(Math.random()*150);
      reg.gold-=cost;
      reg.troops=Math.min(reg.cap,reg.troops+gain);
      // 병력 증강 시 인접 플레이어에게 경고 팝업 (30%)
      const p=playerChar();
      if(adj.some(t=>t&&t.id===p.id)&&Math.random()<0.3){
        popup({title:'군사 동향',sub:'첩보 보고',
          body:`${r.name}이(가) 병력을 대규모로 징집하고 있습니다.\n「전하, 인근 왕국의 움직임이 심상치 않습니다.」`,
          opts:[
            {t:'경계를 강화한다',d:'스트레스 +5, 위신 +3',f:()=>{
              addStress(p,5,'전쟁의 불안');state.prestige+=3;
              log(`${r.name}의 동향에 주목하고 있습니다.`,'war');
            }},
            {t:'무시한다',f:()=>log(`${r.name}의 동향을 무시했습니다.`,'war')},
          ]});
      } else {
        log(`${r.name}이(가) 병력을 징집했습니다.`,'war');
      }
    }
  },

  /* ⑦ 혼인 협상 — 가문 간 외교 결혼 */
  {
    id:'marriage', n:'혼인 협상', icon:'💍', cooldown:3,
    cond:(r,reg,adj)=>{
      const kids=Object.values(chars).filter(c=>!c.dead&&(c.father===r.id||c.mother===r.id)&&age(c)>=14&&!c.spouse);
      return kids.length>0&&adj.some(t=>t&&t.id!==r.id&&!t.dead&&opinion(r,t)>-10);
    },
    run:(r,reg,adj)=>{
      const myKids=Object.values(chars).filter(c=>!c.dead&&(c.father===r.id||c.mother===r.id)&&age(c)>=14&&!c.spouse);
      const target=adj.find(t=>t&&t.id!==r.id&&!t.dead&&opinion(r,t)>-10);
      if(!myKids.length||!target) return;
      const kid=myKids[0];
      chOp(target,r,12);chOp(r,target,12);
      if(target.id===state.player){
        popup({title:'혼인 제안',sub:`${r.name}의 전갈`,
          body:`${r.name}이(가) 자녀 ${kid.name}(${age(kid)}세)의 혼인을 제안해 왔습니다.\n두 가문의 유대를 다질 기회입니다.`,
          opts:[
            {t:'혼인을 수락한다',d:'관계 +20, 위신 +5',f:()=>{
              const p=playerChar();
              // 플레이어 미혼 자녀 또는 본인과 kid 혼약/혼인 체결
              const myCand = (!p.spouse&&!p.betrothed) ? p :
                Object.values(chars).find(k=>!k.dead&&(k.father===p.id||k.mother===p.id)&&!k.spouse&&!k.betrothed&&age(k)>=6&&k.sex!==kid.sex);
              if(myCand){
                const isBetrothal = age(myCand)<16||age(kid)<16;
                _solemnizeMarriage(myCand, kid, r, isBetrothal);
              }
              chOp(r,p,20); state.prestige+=5;
            }},
            {t:'정중히 거절한다',d:'관계 -8',f:()=>{
              chOp(r,playerChar(),-8);
              log(`${r.name}의 혼인 제안을 거절했습니다.`,'dip');
            }},
          ]});
      } else {
        log(`${r.name}이(가) ${target.name}과(와) 혼인 협정을 맺었습니다.`,'fam');
      }
    }
  },

  /* ⑧ 후계자 교육 — 자녀 성장 이벤트 */
  {
    id:'education', n:'후계자 교육', icon:'📜', cooldown:2,
    cond:(r)=>{
      const kids=Object.values(chars).filter(c=>!c.dead&&(c.father===r.id||c.mother===r.id)&&age(c)>=6&&age(c)<=16);
      return kids.length>0;
    },
    run:(r,reg)=>{
      const kids=Object.values(chars).filter(c=>!c.dead&&(c.father===r.id||c.mother===r.id)&&age(c)>=6&&age(c)<=16);
      const kid=kids[Math.floor(Math.random()*kids.length)];
      // 스킬 소폭 상승
      const skills=['dip','mar','stew','intr','learn'];
      const sk=skills[Math.floor(Math.random()*skills.length)];
      kid.base[sk]=(kid.base[sk]||4)+1;
      if(r.id===state.player||Object.values(chars).some(c=>c.id===state.player&&(c.father===r.id||c.mother===r.id))){
        popup({title:'후계자 교육',sub:`${r.name}의 가문`,
          body:`${kid.name}이(가) 궁중 교육을 받으며 성장하고 있습니다.\n「${['외교술','무예','내정술','음모술','학문'][skills.indexOf(sk)]} 분야에서 두각을 나타내고 있습니다.」`,
          opts:[{t:'흐뭇하게 지켜본다',f:()=>{}}]});
      } else {
        log(`${r.name}의 자녀 ${kid.name}이(가) 교육을 받고 있습니다.`,'fam');
      }
    }
  },

  /* ⑨ 조공 / 화해 — 갈등 해소 */
  {
    id:'tribute', n:'조공 제안', icon:'💰', cooldown:2,
    cond:(r,reg,adj)=>reg.gold>150&&adj.some(t=>t&&t.id!==r.id&&!t.dead&&opinion(r,t)<-15&&power(t)>power(r)*1.1),
    run:(r,reg,adj)=>{
      const target=adj.find(t=>t&&t.id!==r.id&&!t.dead&&opinion(r,t)<-15&&power(t)>power(r)*1.1);
      if(!target) return;
      const amount=30+Math.floor(Math.random()*30);
      reg.gold-=amount;
      chOp(target,r,15);chOp(r,target,10);
      if(target.id===state.player){
        REGIONS[playerChar().region].gold+=amount;
        popup({title:'조공 도착',sub:`${r.name}의 전갈`,
          body:`${r.name}이(가) 금 ${amount}을(를) 보내왔습니다.\n「긴장을 풀고 평화롭게 지내기를 바랍니다, 전하.」`,
          opts:[{t:'받아들인다',f:()=>log(`${r.name}의 조공 ${amount}금을 받았습니다.`,'good')}]});
      } else {
        log(`${r.name}이(가) ${target.name}에게 조공을 보냈습니다.`,'dip');
      }
    }
  },

  /* ⑩ 내부 반란 진압 — 민심 낮을 때 */
  {
    id:'suppress', n:'반란 진압', icon:'🏰', cooldown:2,
    cond:(r,reg)=>reg.gold>60&&(reg.pop||60)<40&&reg.troops>100,
    run:(r,reg)=>{
      const cost=40;const troopLoss=30+Math.floor(Math.random()*50);
      reg.gold-=cost;
      reg.troops=Math.max(50,reg.troops-troopLoss);
      reg.pop=Math.min(100,(reg.pop||60)+10);
      if(adj_contains_player(r)){
        popup({title:'인근 반란',sub:'첩보 보고',
          body:`${r.name}의 영지에서 반란이 발생했으나 곧 진압됐습니다.\n백성들의 불만이 누적된 결과입니다.`,
          opts:[{t:'주시한다',f:()=>{}}]});
      } else {
        log(`${r.name}이(가) 내부 반란을 진압했습니다.`,'war');
      }
    }
  },

  /* ⑪ 첩보 유포 — 인접 군주 평판 훼손 */
  {
    id:'slander', n:'첩보 유포', icon:'🕵', cooldown:2,
    cond:(r,reg,adj)=>r.traits.includes('deceitful')&&adj.some(t=>t&&t.id!==r.id&&opinion(r,t)<-10),
    run:(r,reg,adj)=>{
      const target=adj.find(t=>t&&t.id!==r.id&&!t.dead&&opinion(r,t)<-10);
      if(!target) return;
      // 제3자들이 target을 -5~-12 나빠봄
      adj.filter(t=>t&&t.id!==r.id&&t.id!==target.id).forEach(t=>{
        chOp(target,t,-(5+Math.floor(Math.random()*8)));
      });
      if(target.id===state.player){
        popup({title:'음해 공작',sub:'첩보 보고',
          body:`${r.name}이(가) 당신에 대한 거짓 소문을 퍼뜨리고 있습니다.\n인접 왕국들의 시선이 곱지 않아지고 있습니다.`,
          opts:[
            {t:'반박한다',d:'위신 -5, 관계 일부 회복',f:()=>{
              const p=playerChar();state.prestige=Math.max(0,state.prestige-5);
              adj.filter(t=>t&&t.id!==r.id&&t.id!==p.id).forEach(t=>chOp(t,p,4));
              log(`${r.name}의 음해에 적극 대응했습니다.`,'dip');
            }},
            {t:'무시한다',f:()=>log(`${r.name}의 소문을 무시했습니다.`,'dip')},
          ]});
      } else {
        log(`${r.name}이(가) ${target.name}에 대한 음해를 꾸몄습니다.`,'dip');
      }
    }
  },

  /* ⑫ 자연재해 대응 — 흉작·홍수 시 금 지출로 민심 유지 */
  {
    id:'disaster', n:'재해 대응', icon:'🌾', cooldown:3,
    cond:(r,reg)=>(reg.pop||60)<55&&reg.gold>40,
    run:(r,reg,adj)=>{
      const spend=20+Math.floor(Math.random()*20);
      reg.gold-=spend;
      reg.pop=Math.min(100,(reg.pop||60)+8);
      const disasters=['흉작','홍수','역병','폭설'];
      const disaster=disasters[Math.floor(Math.random()*disasters.length)];
      if(adj_contains_player(r)){
        popup({title:`인근 ${disaster}`,sub:'계절 보고',
          body:`${r.name}의 영지에 ${disaster}이(가) 발생했습니다.\n${r.name}이(가) 금고를 열어 백성을 구휼하고 있습니다.`,
          opts:[{t:'경계를 높인다',f:()=>{}}]});
      } else {
        log(`${r.name}이(가) 영지 ${disaster}에 대응해 금고를 열었습니다.`,'good');
      }
    }
  },

];

/* 헬퍼 — 플레이어가 인접 NPC의 이웃인지 */
function adj_contains_player(r){
  return (ADJ[r.region]||[]).map(x=>ownerOf(x)).some(t=>t&&t.id===state.player);
}

function npcActivityPulse(){
  for(const id in chars){
    const r=chars[id];
    if(r.dead||!r.ruler||id===state.player||!r.region||!REGIONS[r.region]) continue;
    if(!r.actCooldowns) r.actCooldowns={};

    // 월 20% 확률로 활동 시도
    if(Math.random()>0.20) continue;

    const reg=REGIONS[r.region];
    const adj=(ADJ[r.region]||[]).map(x=>ownerOf(x)).filter(Boolean);

    // 쿨다운 미완료 활동 제외
    const available=NPC_ACTIVITIES.filter(a=>{
      const lastY=r.actCooldowns[a.id]||0;
      return (state.year-lastY)>=a.cooldown && a.cond(r,reg,adj);
    });
    if(!available.length) continue;

    // 우선순위 — 플레이어와 인접한 경우 상호작용 활동 가중치 2배
    const weights=available.map(a=>{
      const isInteractive=['feast','diplomacy','hunt','marriage','tribute','muster','slander'].includes(a.id);
      return isInteractive&&adj_contains_player(r)?2:1;
    });
    const total=weights.reduce((s,w)=>s+w,0);
    let pick=Math.random()*total;
    let chosen=available[available.length-1];
    for(let i=0;i<available.length;i++){
      pick-=weights[i];
      if(pick<=0){chosen=available[i];break;}
    }

    chosen.run(r,reg,adj);
    r.actCooldowns[chosen.id]=state.year;
  }
}

/* NPC 자동 혼인/재혼 — 인구 존속 유지 (매년 1월)
   배우자 없는 성인 NPC를 같은/다른 궁정의 미혼 이성과 짝지음 */
function npcMarriagePulse(){
  // 배우자도 혼약도 없는 16세 이상 NPC (플레이어 제외, 사망 제외)
  const singles = Object.values(chars).filter(c=>
    !c.dead && c.id!==state.player && age(c)>=16 && age(c)<55 &&
    !c.spouse && !c.betrothed && c.courtOf // 궁정 소속 또는 군주
  );
  // 군주는 region 기반이라 courtOf가 없을 수 있음 → 별도 포함
  const singleRulers = Object.values(chars).filter(c=>
    !c.dead && c.id!==state.player && c.ruler && age(c)>=16 && age(c)<60 &&
    !c.spouse && !c.betrothed
  );
  const pool = [...new Set([...singles, ...singleRulers])];

  for(const c of pool){
    if(c.spouse||c.betrothed) continue; // 루프 중 이미 짝지어졌으면 skip
    // 짝 후보: 반대 성별, 미혼, 16세 이상, 가까운 나이, 같은 가문 아님
    const wantedSex = c.sex==='m' ? 'f' : 'm';
    const mate = pool.find(m=>
      m.id!==c.id && !m.spouse && !m.betrothed &&
      m.sex===wantedSex &&
      m.dyn!==c.dyn && // 근친 방지 (같은 가문 회피)
      Math.abs(age(m)-age(c))<=18
    );
    if(mate){
      // 혼인 체결 — 남편 가문으로 편입 (부계)
      c.spouse = mate.id; mate.spouse = c.id;
      // 여성이 남편 궁정으로 이동 (자녀가 부계 궁정에서 자라도록)
      const husband = c.sex==='m' ? c : mate;
      const wife = c.sex==='m' ? mate : c;
      if(husband.region) wife.courtOf = husband.region;
      else if(husband.courtOf) wife.courtOf = husband.courtOf;
    }
  }
}

function aiPulse(){
  const p=playerChar();

  // NPC 자문회 + 활동 처리
  npcCouncilPulse();
  npcActivityPulse();

  // 매년 1월: 관직 재구성 + NPC 혼인/재혼 (인구 존속)
  if(state.month===1){
    Object.values(chars).filter(c=>!c.dead&&c.ruler&&c.id!==state.player).forEach(buildNpcCouncil);
    npcMarriagePulse();
  }

  for(const rid in REGIONS){
    const r=ownerOf(rid);
    if(!r||r.id===state.player||!r.ruler) continue;

    // 전략 행동은 빈도 낮춤 (월 25% 기본)
    const actChance=0.25 + aiW(r,'bold')*0.04 + aiW(r,'greed')*0.03;
    if(Math.random()>actChance) continue;

    const adjTargets=(ADJ[rid]||[]).map(x=>ownerOf(x)).filter(t=>t&&t.id!==r.id&&!t.dead);
    if(!adjTargets.length) continue;

    const bold=aiW(r,'bold'), greed=aiW(r,'greed'), venge=aiW(r,'venge'), honor=aiW(r,'honor'), soc=aiW(r,'soc');

    // ① 전쟁 — 명분 있어야만 선포 가능
    const claimRid = npcGetClaimTarget(r);
    if(claimRid){
      const defChar = ownerOf(claimRid);
      if(defChar && defChar.id!==r.id && !isAllied(r.id,defChar.id) && !truceBetween(r.id,defChar.id)
        && power(r)>power(defChar)*1.05 && opinion(r,defChar)<-5
        && !state.wars.some(w=>w.atk===r.id||w.def===r.id)
        && Math.random()<0.20+(bold*0.04)){
        npcUseClaim(r, claimRid);
        // NPC 피침략 → 복수 명분 부여
        if(defChar.id===state.player||defChar.id!==state.player) npcGrantRevenge(defChar, claimRid);
        declareWar(r, defChar, claimRid);
        if(defChar.id!==p.id)
          log(`<b>${r.name}</b>이(가) 명분을 내세워 <b>${COUNTIES[claimRid]?.n||claimRid}</b>에 선전포고했습니다.`,'war');
        continue;
      }
    }

    // ② 살해 모략
    const schemeTarget=adjTargets.find(t=>opinion(r,t)<-35&&(venge>1||honor<-2));
    if(schemeTarget && Math.random()<0.10+(venge*0.02)){
      if(!state.schemes.some(s=>s.plotter===r.id)){
        state.schemes.push({plotter:r.id, target:schemeTarget.id, months:0});
        if(schemeTarget.id===p.id)
          log(`${r.name}이(가) 어둠 속에서 당신을 노리고 있다는 첩보가 들어왔습니다.`,'war');
      }
      continue;
    }

    // ③ 동맹 체결 — 활동 시스템과 별개로 유지 (저빈도)
    if((soc>=0||honor>1) && Math.random()<0.08+(soc*0.02)){
      const allyTarget=adjTargets.find(t=>opinion(r,t)>15&&!isAllied(r.id,t.id)&&!truceBetween(r.id,t.id));
      if(allyTarget){
        formAlliance(r.id,allyTarget.id);
        if(allyTarget.id===p.id) npcDiplomacyToPlayer(r);
        else log(`<b>${r.name}</b>과(와) <b>${allyTarget.name}</b>이(가) 동맹을 맺었습니다.`,'dip');
        continue;
      }
    }
  }

  // 민중의견 펄스 (매달)
  popPulse();
}

/* ---------- 민중의견 시스템 ---------- */
/* 관계도 자연 감소 — 매년 활동 없으면 0으로 수렴 */
function opinionDecayPulse(){
  for(const id in chars){
    const c=chars[id]; if(c.dead) continue;
    for(const tid in c.op){
      const v=c.op[tid];
      if(v===0||v===undefined) continue;
      // 0을 향해 연 8% 감소, 최소 변동 ±1
      const decay = Math.sign(v) * Math.max(1, Math.abs(Math.round(v*0.08)));
      c.op[tid] = Math.abs(v-decay) < 1 ? 0 : v - decay;
    }
  }
}
function popPulse(){
  for(const rid in REGIONS){
    const o=ownerOf(rid); if(!o) return;
    let delta=0;
    // 외지인 통치 페널티
    if(o.dyn!=='우어 브리언' && REGIONS[rid].pop>30) delta-=1;
    // 전쟁 중 불안
    if(state.wars.some(w=>w.atk===o.id||w.def===o.id)) delta-=2;
    // 금고 부족 = 세금 압박
    if(REGIONS[rid].gold<50) delta-=1;
    // 평화 유지 보너스
    if(!state.wars.length) delta+=0.5;
    // 관대한 통치자는 민심 유지
    if(o.traits.includes('generous')) delta+=1;
    if(o.traits.includes('arbitrary')) delta-=1;
    REGIONS[rid].pop=Math.max(0,Math.min(100,Math.round((REGIONS[rid].pop||60)+delta)));

    // 반란 체크 (민중의견 25 이하, 플레이어 영지만 이벤트)
    if(REGIONS[rid].pop<=25 && rid===playerChar().region && Math.random()<0.08){
      rebellionEvent(rid);
    }
    // NPC 영지 반란 → 자동 처리 (병력 소모)
    if(REGIONS[rid].pop<=20 && rid!==playerChar().region && Math.random()<0.05){
      REGIONS[rid].troops=Math.max(100, Math.round(REGIONS[rid].troops*0.8));
      log(`${COUNTIES[countyOf(rid)]?.n||BARONIES[rid]?.n||'영지'}에서 민란이 일어났습니다. 병력이 일부 소모됐습니다.`,'war');
    }
  }
}
function rebellionEvent(rid){
  const p=playerChar();
  popup({title:'반란의 기운', sub:`${COUNTIES[countyOf(rid)]?.n||BARONIES[rid]?.n||'영지'} — 민중의견 위기`,
    body:`해당 지역의 농민들이 창과 낫을 들었습니다.
세금과 전쟁에 지친 그들의 눈에 분노가 타오르고 있습니다.

민중의견: ${REGIONS[rid].pop}/100`,
    opts:[
      {t:'무력으로 진압한다', d:'병력 -150, 민중의견 +15 (단기), 스트레스 +15',
        f:()=>{ REGIONS[rid].troops=Math.max(100,REGIONS[rid].troops-150); REGIONS[rid].pop+=15; addStress(p,15,'피로 진압한 반란'); if(p.traits.includes('kind'))addStress(p,15,'친절한 자의 잔인함'); log(`${REGIONS[rid].n}의 반란을 진압했습니다. 피가 흘렀습니다.`,'war'); }},
      {t:'세금을 줄이고 달랜다', d:'금 -80, 민중의견 +25, 스트레스 -10',
        f:()=>{ REGIONS[rid].gold-=80; REGIONS[rid].pop+=25; addStress(p,-10,'민심을 얻은 기쁨'); if(p.traits.includes('greedy'))addStress(p,20,'탐욕스러운 자의 양보'); log(`${REGIONS[rid].n}의 민심을 달랬습니다. 금고가 가벼워졌습니다.`,'good'); }},
      {t:'무시한다', d:'민중의견 -10, 반란 확대 위험',
        f:()=>{ REGIONS[rid].pop-=10; addStress(p,10,'외면한 백성의 목소리'); log(`${REGIONS[rid].n}의 불만이 커지고 있습니다.`,'war'); }},
    ]});
}
function npcDiplomacyToPlayer(r){
  const p=playerChar();
  const op=opinion(r,p);
  const kind=Math.random();
  if(kind<0.4&&op>-20){
    popup({title:`${REGIONS[r.region].n}의 사절`, sub:'외교 — 동맹 제안',
      body:`${r.name}이(가) 사절을 보냈습니다.\n"에이레의 평화를 위해 손을 잡읍시다. 동맹을 제안합니다."`,
      opts:[
        {t:'수락한다', d:'상호 관계 +25', f:()=>{chOp(p,r,25);chOp(r,p,25); log(`<b>${r.name}</b>과(와) 동맹을 맺었습니다.`,'dip');}},
        {t:'거절한다', d:'관계 -10', f:()=>{chOp(r,p,-10); log(`${r.name}의 동맹 제안을 거절했습니다.`,'dip');}},
      ]});
  } else if(kind<0.7){
    popup({title:`${REGIONS[r.region].n}의 선물`, sub:'외교',
      body:`${r.name}이(가) 우호의 표시로 은제 술잔과 사냥개를 보냈습니다.`,
      opts:[{t:'받아들인다', d:'관계 +15', f:()=>{chOp(p,r,15);chOp(r,p,10);}},
            {t:'돌려보낸다', d:'관계 -15', f:()=>{chOp(r,p,-15);}}]});
  } else {
    const myKids=Object.values(chars).filter(k=>!k.dead&&(k.father===p.id||k.mother===p.id)&&!k.spouse&&age(k)>=12);
    if(!myKids.length){ chOp(r,p,3); return; }
    const kid=myKids[0];
    popup({title:`혼담`, sub:`외교 — ${REGIONS[r.region].n}`,
      body:`${r.name}이(가) 가문 간 혼인을 제안합니다.\n대상: 당신의 ${kid.sex==='m'?'아들':'딸'} <b>${kid.name}</b>(${age(kid)}세)\n\n혼인은 두 가문을 묶는 가장 단단한 사슬입니다.`,
      opts:[
        {t:'혼약을 맺는다', d:'관계 +35, 동맹', f:()=>{
          const sp=mk({name:r.dyn+' 가문의 '+(kid.sex==='m'?'딸':'아들'), dyn:r.dyn, sex:kid.sex==='m'?'f':'m',
            byear:kid.byear, bmonth:1, bday:1, traits:randTraits(2), base:randStats(), edu:1, eduFocus:'dip', courtOf:p.region});
          if(age(kid)>=16){ kid.spouse=sp.id; sp.spouse=kid.id; }
          chOp(p,r,35); chOp(r,p,35);
          log(`<b>${kid.name}</b>과(와) ${r.dyn} 가문의 혼약이 성사되었습니다.`,'fam');
        }},
        {t:'정중히 거절한다', d:'관계 -10', f:()=>chOp(r,p,-10)},
      ]});
  }
}

/* ---------- 랜덤 이벤트 ---------- */
const EVENTS=[
  /* ── 영지 ── */
  {cond:c=>true, w:3, run:c=>popup({title:'흉작의 소문', sub:'영지',
    body:'올해 보리 수확이 시원치 않다는 보고가 올라왔습니다. 농민들이 동요하고 있습니다.',
    opts:[
      {t:'곡식 창고를 연다', d:'금 -40, 민심 +10, 스트레스 +10', f:()=>{REGIONS[c.region].gold-=40; REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+10); addStress(c,10,'무거운 책임감'); if(c.traits.includes('greedy'))addStress(c,20,'탐욕스러운 자의 베풂');}},
      {t:'버티라고 한다', d:'민심 -15, 스트레스 +5', f:()=>{REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-15); addStress(c,5,'민심 악화를 외면함'); if(c.traits.includes('just'))addStress(c,15,'공정한 자의 냉혹함');}},
    ]})},
  {cond:c=>true, w:2, run:c=>popup({title:'전염병 소식', sub:'영지',
    body:'인근 마을에서 발병이 시작됐습니다. 아직 성 안까지는 들어오지 않았지만, 농민들이 도망치고 있습니다.',
    opts:[
      {t:'의원을 보내고 격리한다', d:'금 -60, 민심 +8, 병력 -50', f:()=>{REGIONS[c.region].gold-=60; REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+8); REGIONS[c.region].troops=Math.max(100,REGIONS[c.region].troops-50); log('전염병을 조기에 막았습니다.','good');}},
      {t:'방치한다', d:'민심 -20, 병력 -100', f:()=>{REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-20); REGIONS[c.region].troops=Math.max(100,REGIONS[c.region].troops-100); addStress(c,15,'퍼진 전염병'); log('전염병이 번졌습니다.','war');}},
    ]})},
  {cond:c=>REGIONS[c.region].gold>200, w:2, run:c=>popup({title:'성벽 보수', sub:'영지',
    body:'성벽 일부가 무너졌습니다. 이번 겨울 전에 손을 봐야 할 것 같습니다.',
    opts:[
      {t:'즉시 보수한다', d:'금 -80, 병력 +80, 민심 +5', f:()=>{REGIONS[c.region].gold-=80; REGIONS[c.region].cap=(REGIONS[c.region].cap||1200)+80; REGIONS[c.region].troops=Math.min(REGIONS[c.region].cap, REGIONS[c.region].troops+80); REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+5); log('성벽을 보수했습니다. 방어력이 높아졌습니다.','good');}},
      {t:'다음 해로 미룬다', d:'스트레스 +8', f:()=>addStress(c,8,'미뤄진 숙제')},
    ]})},
  {cond:c=>(REGIONS[c.region].pop||60)<50, w:3, run:c=>popup({title:'민심의 균열', sub:'영지',
    body:'시장의 소문이 심상치 않습니다. 세금이 너무 무겁다, 왕이 백성을 돌보지 않는다는 말들이 오갑니다.\n\n민중의견: '+REGIONS[c.region].pop+'/100',
    opts:[
      {t:'공개 재판을 열어 신뢰를 쌓는다', d:'민심 +15, 위신 +10, 스트레스 +10', f:()=>{REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+15); state.prestige+=10; addStress(c,10,'무거운 판결의 책임');}},
      {t:'밀정을 풀어 선동자를 찾는다', d:'민심 -5, 음모자 제거', f:()=>{REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-5); log('밀정이 선동자를 적발했습니다.','dip');}},
    ]})},

  /* ── 여흥/휴식 ── */
  {cond:c=>true, w:3, run:c=>popup({title:'사냥 초대', sub:'여흥',
    body:'시종장이 가을 사냥을 제안합니다. 숲에는 사슴이 많고, 왕에게는 휴식이 필요합니다.',
    opts:[
      {t:'사냥을 나간다', d:'스트레스 -20', f:()=>{addStress(c,-20,'사냥의 즐거움'); if(c.traits.includes('brave'))addStress(c,-5,'용맹한 피의 해방');}},
      {t:'정무가 우선이다', d:'금 +20, 스트레스 +5', f:()=>{REGIONS[c.region].gold+=20; addStress(c,5,'쉬지 못하는 왕'); if(c.traits.includes('diligent'))addStress(c,-5,'근면한 자의 보람');}},
    ]})},
  {cond:c=>true, w:2, run:c=>popup({title:'음유시인', sub:'궁정',
    body:'떠돌이 시인이 궁정에 찾아와 당신의 가문을 칭송하는 노래를 지어 바치겠다 합니다.',
    opts:[
      {t:'후원한다', d:'금 -25, 위신 +15, 스트레스 -10', f:()=>{REGIONS[c.region].gold-=25; state.prestige+=15; addStress(c,-10,'노래의 위안');}},
      {t:'내쫓는다', d:'스트레스 +5', f:()=>{ addStress(c,5,'쫓겨난 시인'); if(c.traits.includes('generous'))addStress(c,10,'관대한 자의 인색함'); }},
    ]})},
  {cond:c=>stressLvl(c)>=1, w:5, run:c=>popup({title:'잠 못 드는 밤', sub:'내면',
    body:'또 새벽입니다. 촛불이 다 타들어 가도록 잠이 오지 않습니다.\n창밖 어둠 속에서 누군가 지켜보는 것만 같습니다.',
    opts:[
      {t:'주교에게 고해한다', d:'스트레스 -20', f:()=>addStress(c,-20,'고해의 위안')},
      {t:'술로 잊는다', d:'스트레스 -30, 절제 위반', f:()=>{addStress(c,-30,'취기'); if(c.traits.includes('temperate'))addStress(c,25,'절제하는 자의 폭음');}},
      {t:'그냥 버틴다', d:'스트레스 +10', f:()=>addStress(c,10,'혼자 삼킨 고통')},
    ]})},
  {cond:c=>stressLvl(c)===0, w:2, run:c=>popup({title:'맑은 아침', sub:'내면',
    body:'오랜만에 개운하게 눈을 떴습니다. 샤넌 강 위로 아침 안개가 걷히고 있습니다. 작은 평화입니다.',
    opts:[
      {t:'감사히 받아들인다', d:'스트레스 -5', f:()=>addStress(c,-5,'고요한 아침의 선물')},
    ]})},

  /* ── 궁정/인물 ── */
  {cond:c=>true, w:2, run:c=>{
    const others=Object.values(chars).filter(k=>!k.dead&&k.ruler&&k.id!==c.id);
    if(!others.length) return;
    const o=others[Math.floor(Math.random()*others.length)];
    popup({title:'국경의 분쟁', sub:REGIONS[o.region]?REGIONS[o.region].n:'인근 왕국',
      body:`${REGIONS[o.region]?REGIONS[o.region].n:'인근'}의 목동들이 국경을 넘어 우리 농민들과 충돌했습니다. 사상자가 나왔습니다.`,
      opts:[
        {t:'배상을 요구한다', d:'관계 -15, 위신 +5', f:()=>{chOp(o,c,-15); chOp(c,o,-10); state.prestige+=5; if(c.traits.includes('wrathful'))addStress(c,-5,'분노를 표출한 통쾌함');}},
        {t:'조용히 묻는다', d:'스트레스 +10', f:()=>{addStress(c,10,'삼킨 분노'); if(c.traits.includes('wrathful'))addStress(c,15,'분노를 누른 대가');}},
      ]});
  }},
  {cond:c=>Object.values(chars).filter(k=>!k.dead&&k.courtOf===c.region).length>0, w:2, run:c=>{
    const court=Object.values(chars).filter(k=>!k.dead&&k.courtOf===c.region&&k.id!==c.id);
    if(!court.length) return;
    const npc=court[Math.floor(Math.random()*court.length)];
    popup({title:'신하의 청원', sub:'궁정',
      body:`${npc.name}이(가) 개인적인 청원을 올렸습니다.
가문의 오래된 영지를 되찾게 도와달라는 것입니다.`,
      opts:[
        {t:'돕겠다고 약속한다', d:'관계 +20, 스트레스 +8', f:()=>{chOp(npc,c,20); addStress(c,8,'약속의 무게');}},
        {t:'정중히 거절한다', d:'관계 -10', f:()=>chOp(npc,c,-10)},
        {t:'나중에 보자고 한다', d:'관계 -5, 스트레스 +3', f:()=>{chOp(npc,c,-5); addStress(c,3,'미룬 청원');}},
      ]});
  }},
  {cond:c=>age(c)>=45, w:2, run:c=>popup({title:'건강의 신호', sub:'내면',
    body:'아침마다 무릎이 쑤십니다. 시의가 조심스럽게 식단을 바꾸라고 권합니다.\n나이는 속일 수 없는 것입니다.',
    opts:[
      {t:'시의의 말을 따른다', d:'스트레스 +10', f:()=>addStress(c,10,'늙어가는 몸을 받아들임')},
      {t:'무시한다', d:'스트레스 +5', f:()=>addStress(c,5,'외면한 경고')},
    ]})},

  /* ── 외교/전쟁 상황 연동 ── */
  {cond:c=>state.wars.some(w=>w.atk===c.id||w.def===c.id), w:4, run:c=>popup({title:'전장의 소식', sub:'전쟁',
    body:'전선에서 전령이 왔습니다. 병사들의 사기가 흔들리고 있다고 합니다.\n보급이 부족한 것이 원인입니다.',
    opts:[
      {t:'금을 보내 보급을 채운다', d:'금 -60, 스트레스 -10', f:()=>{REGIONS[c.region].gold-=60; addStress(c,-10,'통솔자의 결단'); log('전선에 보급을 보냈습니다.','war');}},
      {t:'버티라고 명령한다', d:'스트레스 +15', f:()=>{addStress(c,15,'병사들의 원망'); if(c.traits.includes('brave'))addStress(c,-5,'강한 자의 명령');}},
    ]})},
  {cond:c=>!state.wars.some(w=>w.atk===c.id||w.def===c.id)&&playerRegions().length>=2, w:2, run:c=>popup({title:'새 영토의 민심', sub:'통치',
    body:'새로 얻은 영지의 백성들이 아직 당신을 낯설어합니다.\n그들의 마음을 얻는 데는 시간이 필요합니다.',
    opts:[
      {t:'직접 순행을 나선다', d:'금 -30, 확장 영지 민심 +20, 스트레스 +8', f:()=>{
        REGIONS[c.region].gold-=30; addStress(c,8,'긴 순행의 피로');
        playerRegions().forEach(rid=>{ REGIONS[rid].pop=Math.min(100,(REGIONS[rid].pop||60)+20); });
        log('순행을 마쳤습니다. 백성들이 얼굴을 봤습니다.','good');
      }},
      {t:'세금을 한 계절 면제한다', d:'금 수입 중단, 민심 +15', f:()=>{
        playerRegions().forEach(rid=>{ REGIONS[rid].pop=Math.min(100,(REGIONS[rid].pop||60)+15); });
        log('세금 면제령이 내려졌습니다. 백성들이 환호했습니다.','good');
      }},
    ]})},
  {cond:c=>opinion(c, Object.values(chars).find(k=>k.ruler&&k.id!==c.id&&!k.dead)||c)<-30, w:3, run:c=>{
    const enemy=Object.values(chars).find(k=>k.ruler&&k.id!==c.id&&!k.dead&&opinion(c,k)<-30);
    if(!enemy) return;
    popup({title:'적의의 소문', sub:'첩보',
      body:`${enemy.name}이(가) 당신을 두고 모욕적인 말을 했다는 소문이 들립니다.
"먼스터의 왕좌는 오래 버티지 못할 것이다."`,
      opts:[
        {t:'공개 반박한다', d:'위신 +10, 적대 관계 -10', f:()=>{state.prestige+=10; chOp(enemy,c,-10); log(`${enemy.name}의 모욕에 당당히 답했습니다.`,'dip');}},
        {t:'무시한다', d:'스트레스 +10', f:()=>{addStress(c,10,'삼킨 치욕'); if(c.traits.includes('proud')||c.traits.includes('arrogant'))addStress(c,10,'오만한 자의 굴욕');}},
        {t:'밀사를 보내 경고한다', d:'스트레스 -5, 관계 -15', f:()=>{addStress(c,-5,'분노의 해소'); chOp(enemy,c,-15); log(`${enemy.name}에게 경고를 보냈습니다.`,'dip');}},
      ]});
  }},

  /* ── 가문 ── */
  {cond:c=>Object.values(chars).filter(k=>!k.dead&&(k.father===c.id||k.mother===c.id)).length>0, w:2, run:c=>{
    const child=Object.values(chars).filter(k=>!k.dead&&(k.father===c.id||k.mother===c.id)&&age(k)<16)[0];
    if(!child) return;
    popup({title:'아이의 장난', sub:'가문',
      body:`${child.name}(${age(child)}세)이(가) 말을 훔쳐 타다 넘어졌습니다. 다행히 크게 다치지는 않았습니다.
아이의 눈에는 아직 두려움보다 흥분이 더 많습니다.`,
      opts:[
        {t:'엄하게 꾸짖는다', d:'아이 관계 -5, 스트레스 -5', f:()=>{addStress(c,-5,'훈육의 책임');}},
        {t:'웃어 넘긴다', d:'아이 관계 +10, 스트레스 -10', f:()=>{addStress(c,-10,'아이의 웃음이 주는 위안');}},
      ]});
  }},
  {cond:c=>chars[c.spouse]&&!chars[c.spouse].dead, w:2, run:c=>{
    const sp=chars[c.spouse]; if(!sp||sp.dead) return;
    popup({title:'배우자의 말', sub:'가문',
      body:`${sp.name}이(가) 오늘 밤 조용히 말했습니다.
"당신이 너무 지쳐 보여요. 잠시라도 쉬어요."`,
      opts:[
        {t:'고맙다고 한다', d:'스트레스 -15, 관계 +5', f:()=>{addStress(c,-15,'배우자의 위로'); chOp(sp,c,5);}},
        {t:'괜찮다고 한다', d:'스트레스 +8', f:()=>addStress(c,8,'혼자 버티는 무게')},
      ]});
  }},

  /* ════════ 추가 이벤트 (CK3 위키 카테고리 기반 각색) ════════ */

  /* ── 계책/음모 ── */
  {cond:c=>stat(c,'intr')>=6, w:2, run:c=>popup({title:'밀정의 보고', sub:'계책',
    body:'당신의 밀정이 인근 궁정에서 흥미로운 소문을 가져왔습니다.\\n한 영주가 비밀스러운 약점을 숨기고 있다는 것입니다.',
    opts:[
      {t:'약점을 캔다', d:'음모 경험, 스트레스 +5', f:()=>{addStress(c,5,'은밀한 모의'); state.prestige+=8; log('약점을 손에 넣었습니다. 언젠가 쓸모가 있겠지요.','dip');}},
      {t:'관심 없다', d:'—', f:()=>{}},
    ]})},
  {cond:c=>true, w:2, run:c=>popup({title:'독초를 아는 노파', sub:'계책',
    body:'늪지에 사는 한 노파가 온갖 약초와 독초에 능하다는 소문이 돕니다.\\n그녀를 궁정에 들일 수도 있습니다.',
    opts:[
      {t:'은밀히 부른다', d:'금 -20, 음모 +위험', f:()=>{REGIONS[c.region].gold-=20; if(c.traits.includes('deceitful'))addStress(c,-5,'기만하는 자의 만족'); log('노파가 궁정의 그늘에 자리잡았습니다.','dip');}},
      {t:'마녀라며 쫓는다', d:'민심 +5', f:()=>{REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+5); if(c.traits.includes('zealous'))addStress(c,-5,'광신자의 정의');}},
    ]})},
  {cond:c=>Object.values(chars).some(k=>!k.dead&&k.ruler&&k.id!==c.id&&opinion(c,k)<-25), w:2, run:c=>{
    const foe=Object.values(chars).find(k=>!k.dead&&k.ruler&&k.id!==c.id&&opinion(c,k)<-25);
    if(!foe) return;
    popup({title:'위조된 편지', sub:'계책',
      body:`서기가 은밀히 제안합니다. ${foe.name}의 필체를 흉내내어 그를 곤경에 빠뜨릴 편지를 위조할 수 있다고 합니다.`,
      opts:[
        {t:'위조하게 한다', d:'관계 -15(적), 정직 위반', f:()=>{chOp(foe,c,-15); if(c.traits.includes('honest'))addStress(c,20,'정직한 자의 거짓'); else addStress(c,5,'위험한 도박'); log(`${foe.name}을(를) 음해하는 편지가 퍼졌습니다.`,'dip');}},
        {t:'정도를 지킨다', d:'스트레스 -5', f:()=>{addStress(c,-5,'양심의 평안'); if(c.traits.includes('just'))addStress(c,-5,'공정한 자의 긍지');}},
      ]});
  }},

  /* ── 종교/신앙 ── */
  {cond:c=>true, w:3, run:c=>popup({title:'수도원의 청원', sub:'신앙',
    body:'클론퍼트 수도원의 원장이 찾아왔습니다.\\n낡은 필사실을 새로 짓는 데 후원을 청합니다. 신의 가호가 따를 것이라 합니다.',
    opts:[
      {t:'후하게 기부한다', d:'금 -50, 위신 +20, 스트레스 -10', f:()=>{REGIONS[c.region].gold-=50; state.prestige+=20; addStress(c,-10,'신앙의 위안'); if(c.traits.includes('zealous'))addStress(c,-10,'독실한 자의 기쁨');}},
      {t:'조금만 돕는다', d:'금 -15, 위신 +5', f:()=>{REGIONS[c.region].gold-=15; state.prestige+=5;}},
      {t:'거절한다', d:'위신 -5', f:()=>{state.prestige=Math.max(0,state.prestige-5); if(c.traits.includes('zealous'))addStress(c,15,'독실한 자의 죄책감');}},
    ]})},
  {cond:c=>true, w:2, run:c=>popup({title:'순례자의 무리', sub:'신앙',
    body:'성 패트릭의 발자취를 따르는 순례자들이 영지를 지나갑니다.\\n그들에게 잠자리와 음식을 베풀 수 있습니다.',
    opts:[
      {t:'환대한다', d:'금 -20, 민심 +10, 위신 +10', f:()=>{REGIONS[c.region].gold-=20; REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+10); state.prestige+=10;}},
      {t:'그냥 보낸다', d:'—', f:()=>{ if(c.traits.includes('generous'))addStress(c,8,'관대한 자의 인색함'); }},
    ]})},
  {cond:c=>true, w:2, run:c=>popup({title:'불길한 징조', sub:'신앙',
    body:'한낮에 까마귀 떼가 성탑 위를 맴돌았습니다.\\n늙은 사제들이 불길한 징조라며 수군거립니다. 백성들도 동요합니다.',
    opts:[
      {t:'미사를 올려 안심시킨다', d:'금 -25, 민심 +8, 스트레스 -5', f:()=>{REGIONS[c.region].gold-=25; REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+8); addStress(c,-5,'신께 의탁함');}},
      {t:'미신이라 일축한다', d:'민심 -8', f:()=>{REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-8); if(c.traits.includes('cynical'))addStress(c,-5,'냉소가의 평정');}},
    ]})},

  /* ── 내정/경제 ── */
  {cond:c=>true, w:3, run:c=>popup({title:'상인 길드의 제안', sub:'내정',
    body:'워터퍼드의 상인들이 교역 특권을 요청합니다.\\n그 대가로 매달 일정한 상납을 약속합니다.',
    opts:[
      {t:'특권을 허락한다', d:'금 +60 즉시, 민심 -5', f:()=>{REGIONS[c.region].gold+=60; REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-5); log('상인들과 교역 협정을 맺었습니다.','good');}},
      {t:'거절한다', d:'민심 +5', f:()=>{REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+5);}},
    ]})},
  {cond:c=>REGIONS[c.region].gold>150, w:2, run:c=>popup({title:'다리 건설', sub:'내정',
    body:'섀넌 강을 가로지르는 다리를 놓자는 제안이 올라왔습니다.\\n비용은 크지만 교역과 이동이 크게 편해질 것입니다.',
    opts:[
      {t:'건설을 명한다', d:'금 -100, 민심 +15, 위신 +10', f:()=>{REGIONS[c.region].gold-=100; REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+15); state.prestige+=10; if(c.traits.includes('diligent'))addStress(c,-5,'근면한 자의 성취'); log('다리가 완성되었습니다. 백성들이 기뻐합니다.','good');}},
      {t:'시기상조다', d:'—', f:()=>{}},
    ]})},
  {cond:c=>true, w:2, run:c=>popup({title:'세금 징수 보고', sub:'내정',
    body:'징세관이 올해 세수를 보고합니다.\\n일부 지주가 세금을 체납하고 있는데, 강하게 나갈지 정하셔야 합니다.',
    opts:[
      {t:'엄격히 징수한다', d:'금 +50, 민심 -10', f:()=>{REGIONS[c.region].gold+=50; REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-10); if(c.traits.includes('greedy'))addStress(c,-5,'탐욕가의 흡족함');}},
      {t:'관대히 봐준다', d:'민심 +10, 위신 +5', f:()=>{REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+10); state.prestige+=5; if(c.traits.includes('generous'))addStress(c,-5,'관대한 자의 보람');}},
    ]})},
  {cond:c=>true, w:2, run:c=>popup({title:'대장간의 호황', sub:'내정',
    body:'영지의 대장장이들이 좋은 철광을 발견했습니다.\\n무기와 농기구 생산이 늘어날 조짐입니다.',
    opts:[
      {t:'무기 생산에 투자한다', d:'금 -40, 병력 +120', f:()=>{REGIONS[c.region].gold-=40; REGIONS[c.region].cap=(REGIONS[c.region].cap||1200)+60; REGIONS[c.region].troops=Math.min(REGIONS[c.region].cap,REGIONS[c.region].troops+120);}},
      {t:'농기구에 투자한다', d:'금 -40, 민심 +12', f:()=>{REGIONS[c.region].gold-=40; REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+12);}},
    ]})},

  /* ── 무예/군사 ── */
  {cond:c=>true, w:2, run:c=>popup({title:'용병단의 방문', sub:'군사',
    body:'바다 건너온 노르드 용병단이 일자리를 찾고 있습니다.\\n금을 주면 당신의 깃발 아래 싸우겠다 합니다.',
    opts:[
      {t:'고용한다', d:'금 -70, 병력 +250', f:()=>{if(REGIONS[c.region].gold<70){log('금이 부족합니다.');return;} REGIONS[c.region].gold-=70; REGIONS[c.region].troops+=250; log('노르드 용병들이 합류했습니다.','war');}},
      {t:'돌려보낸다', d:'—', f:()=>{}},
    ]})},
  {cond:c=>stat(c,'mar')>=7, w:2, run:c=>popup({title:'무술 시합', sub:'군사',
    body:'기사들이 무술 시합을 열자고 청합니다.\\n왕이 직접 참가하면 사기가 오를 것입니다. 다만 부상의 위험도 있습니다.',
    opts:[
      {t:'직접 출전한다', d:'위신 +15, 부상 위험', f:()=>{state.prestige+=15; if(Math.random()<0.2){addStress(c,15,'시합 중 부상'); log('시합에서 부상을 입었습니다.','war');}else{addStress(c,-15,'승리의 영광'); if(c.traits.includes('brave'))addStress(c,-5,'용맹한 자의 기쁨');}}},
      {t:'관전만 한다', d:'위신 +5', f:()=>{state.prestige+=5; if(c.traits.includes('craven'))addStress(c,-5,'비겁한 자의 안도');}},
    ]})},
  {cond:c=>true, w:2, run:c=>popup({title:'탈영병', sub:'군사',
    body:'몇몇 병사가 군영을 이탈했습니다.\\n붙잡혔는데, 어떻게 처리할지 본보기가 필요합니다.',
    opts:[
      {t:'처형한다', d:'병력 규율 +, 스트레스 +10', f:()=>{addStress(c,10,'본보기의 무게'); if(c.traits.includes('cruel'))addStress(c,-5,'잔인한 자의 만족'); if(c.traits.includes('kind'))addStress(c,15,'친절한 자의 잔혹'); log('탈영병을 처형해 군기를 세웠습니다.','war');}},
      {t:'용서한다', d:'민심 +5, 군기 -', f:()=>{REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+5); if(c.traits.includes('forgiving'))addStress(c,-5,'관용의 평안');}},
    ]})},

  /* ── 외교/이웃 ── */
  {cond:c=>Object.values(chars).some(k=>!k.dead&&k.ruler&&k.id!==c.id&&opinion(c,k)>10), w:1, run:c=>{
    const friend=Object.values(chars).find(k=>!k.dead&&k.ruler&&k.id!==c.id&&opinion(c,k)>10);
    if(!friend) return;
    popup({title:'우호의 초대', sub:`외교 — ${REGIONS[friend.region]?REGIONS[friend.region].n:''}`,
      body:`${friend.name}이(가) 자신의 궁정 연회에 당신을 초대했습니다.\\n참석하면 관계가 깊어지겠지만, 자리를 비우는 동안의 위험도 있습니다.`,
      opts:[
        {t:'참석한다', d:'관계 +20, 위신 +10', f:()=>{chOp(friend,c,20); chOp(c,friend,15); state.prestige+=10; log(`${friend.name}의 연회에 다녀왔습니다.`,'dip');}},
        {t:'사절을 대신 보낸다', d:'관계 +5', f:()=>{chOp(friend,c,5);}},
        {t:'거절한다', d:'관계 -10', f:()=>{chOp(friend,c,-10);}},
      ]});
  }},
  {cond:c=>true, w:2, run:c=>popup({title:'바이킹의 그림자', sub:'외교',
    body:'더블린 만에 노르드 장선들이 나타났다는 소식입니다.\\n약탈인지 교역인지 아직 분명치 않습니다.',
    opts:[
      {t:'해안 경비를 강화한다', d:'금 -40, 병력 +80', f:()=>{REGIONS[c.region].gold-=40; REGIONS[c.region].troops+=80; log('해안 경비를 강화했습니다.','war');}},
      {t:'교역을 시도한다', d:'금 +40, 위험', f:()=>{if(Math.random()<0.7){REGIONS[c.region].gold+=40; log('노르드인과 교역에 성공했습니다.','good');}else{REGIONS[c.region].troops=Math.max(100,REGIONS[c.region].troops-60); addStress(c,10,'기습 약탈'); log('노르드인이 약탈하고 사라졌습니다!','war');}}},
    ]})},

  /* ── 가문/개인 ── */
  {cond:c=>true, w:2, run:c=>popup({title:'떠돌이 학자', sub:'궁정',
    body:'먼 곳에서 온 학자가 궁정에 머물기를 청합니다.\\n그의 지식은 깊어 보이지만, 출신이 불분명합니다.',
    opts:[
      {t:'궁정에 들인다', d:'금 -20, 학문 자극', f:()=>{REGIONS[c.region].gold-=20; const sc=mk({name:randName(),dyn:'',byear:state.year-35,bmonth:3,bday:3,traits:randTraits(2),base:{dip:5,mar:2,stew:5,intr:4,learn:9,prow:1},edu:3,eduFocus:'learn',courtOf:c.region}); log('학자가 궁정에 합류했습니다.','fam'); if(c.traits.includes('cynical'))addStress(c,-3,'지식의 즐거움');}},
      {t:'거절한다', d:'—', f:()=>{}},
    ]})},
  {cond:c=>true, w:2, run:c=>popup({title:'사냥개 선물', sub:'궁정',
    body:'한 봉신이 혈통 좋은 아이리시 울프하운드 한 마리를 선물로 바쳤습니다.\\n늠름한 사냥개입니다.',
    opts:[
      {t:'기쁘게 받는다', d:'스트레스 -10', f:()=>{addStress(c,-10,'충직한 벗'); log('사냥개에게 이름을 지어주었습니다.','fam');}},
      {t:'사냥터지기에게 준다', d:'관계 +5', f:()=>{}},
    ]})},
  {cond:c=>chars[c.spouse]&&!chars[c.spouse].dead&&age(chars[c.spouse])<45&&c.sex==='m', w:2, run:c=>{
    const sp=chars[c.spouse]; if(!sp||sp.dead) return;
    popup({title:'후사의 기대', sub:'가문',
      body:`${sp.name}과(와)의 사이에 더 많은 자손을 보아야 한다는 신하들의 조언이 있습니다.\\n가문의 미래가 걸린 일입니다.`,
      opts:[
        {t:'함께 시간을 보낸다', d:'관계 +10, 스트레스 -10', f:()=>{chOp(sp,c,10); chOp(c,sp,10); addStress(c,-10,'부부의 정');}},
        {t:'국정이 우선이다', d:'스트레스 +5', f:()=>{addStress(c,5,'미뤄둔 가정');}},
      ]});
  }},
  {cond:c=>Object.values(chars).some(k=>!k.dead&&(k.father===c.id||k.mother===c.id)&&age(k)>=16&&!k.spouse), w:2, run:c=>{
    const adult=Object.values(chars).find(k=>!k.dead&&(k.father===c.id||k.mother===c.id)&&age(k)>=16&&!k.spouse);
    if(!adult) return;
    popup({title:'장성한 자식', sub:'가문',
      body:`당신의 ${adult.sex==='m'?'아들':'딸'} ${adult.name}(${age(adult)}세)이(가) 이제 제 앞가림을 할 나이가 되었습니다.\\n혼처를 알아봐야 할 때입니다.`,
      opts:[
        {t:'좋은 혼처를 찾아본다', d:'외교에서 혼인 교섭 가능', f:()=>{log(`${adult.name}의 혼처를 알아보기로 했습니다. 이웃 왕국과 교섭해보세요.`,'fam');}},
        {t:'아직 이르다', d:'관계 -5', f:()=>{chOp(adult,c,-5);}},
      ]});
  }},
  {cond:c=>age(c)>=50, w:2, run:c=>popup({title:'지난 세월', sub:'내면',
    body:'벽난로 앞에서 문득 지나온 날들을 떠올립니다.\\n젊은 날의 야망, 잃어버린 벗들, 그리고 아직 이루지 못한 꿈들.',
    opts:[
      {t:'회한에 잠긴다', d:'스트레스 +8', f:()=>addStress(c,8,'지난날의 회한')},
      {t:'남은 날을 다짐한다', d:'스트레스 -10, 위신 +5', f:()=>{addStress(c,-10,'새로운 각오'); state.prestige+=5;}},
    ]})},

  /* ── 자연/재해 ── */
  {cond:c=>true, w:2, run:c=>popup({title:'겨울 폭풍', sub:'재해',
    body:'유난히 혹독한 겨울입니다. 폭풍이 농가의 지붕을 날리고 가축이 얼어 죽었습니다.',
    opts:[
      {t:'구휼미를 푼다', d:'금 -50, 민심 +15', f:()=>{REGIONS[c.region].gold-=50; REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+15);}},
      {t:'각자 버티게 한다', d:'민심 -12', f:()=>{REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-12); addStress(c,5,'얼어붙은 민심');}},
    ]})},
  {cond:c=>true, w:1, run:c=>popup({title:'풍년', sub:'영지',
    body:'올해는 보기 드문 풍년입니다. 곳간이 가득 차고 백성들의 얼굴에 웃음이 돕니다.',
    opts:[
      {t:'추수 축제를 연다', d:'금 -20, 민심 +15, 스트레스 -10', f:()=>{REGIONS[c.region].gold-=20; REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+15); addStress(c,-10,'풍요의 기쁨');}},
      {t:'잉여를 비축한다', d:'금 +50', f:()=>{REGIONS[c.region].gold+=50;}},
    ]})},
  {cond:c=>true, w:1, run:c=>popup({title:'들불', sub:'재해',
    body:'마른 가을 들판에 불이 번졌습니다. 농민들이 필사적으로 진화에 나섰습니다.',
    opts:[
      {t:'병력을 동원해 돕는다', d:'민심 +12, 병력 일시 차출', f:()=>{REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+12); log('병사들이 들불을 잡았습니다. 백성들이 고마워합니다.','good');}},
      {t:'농민에게 맡긴다', d:'민심 -8', f:()=>{REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-8);}},
    ]})},

  /* ── 봉신/궁정 정치 ── */
  {cond:c=>Object.values(chars).some(k=>!k.dead&&k.courtOf===c.region&&k.id!==c.id), w:2, run:c=>{
    const v=Object.values(chars).filter(k=>!k.dead&&k.courtOf===c.region&&k.id!==c.id);
    if(!v.length) return;
    const va=v[Math.floor(Math.random()*v.length)];
    popup({title:'봉신의 불만', sub:'궁정',
      body:`${va.name}이(가) 다른 봉신들 앞에서 당신의 통치에 불만을 토로했습니다.\\n그냥 두면 권위가 흔들릴 수 있습니다.`,
      opts:[
        {t:'엄히 질책한다', d:'관계 -15, 위신 +10', f:()=>{chOp(va,c,-15); state.prestige+=10; if(c.traits.includes('wrathful'))addStress(c,-5,'분노의 표출');}},
        {t:'달래어 회유한다', d:'금 -30, 관계 +15', f:()=>{REGIONS[c.region].gold-=30; chOp(va,c,15);}},
        {t:'무시한다', d:'위신 -8', f:()=>{state.prestige=Math.max(0,state.prestige-8); addStress(c,5,'흔들리는 권위');}},
      ]});
  }},
  {cond:c=>Object.values(chars).some(k=>!k.dead&&k.courtOf===c.region&&k.id!==c.id&&stat(k,'mar')>=8), w:2, run:c=>{
    const knight=Object.values(chars).find(k=>!k.dead&&k.courtOf===c.region&&k.id!==c.id&&stat(k,'mar')>=8);
    if(!knight) return;
    popup({title:'충성스러운 기사', sub:'궁정',
      body:`용맹한 기사 ${knight.name}이(가) 당신에게 충성을 맹세하며 영지를 청합니다.\\n그의 무용은 의심할 여지가 없습니다.`,
      opts:[
        {t:'약속한다', d:'관계 +25, 스트레스 +5', f:()=>{chOp(knight,c,25); addStress(c,5,'지킬 약속의 무게');}},
        {t:'공을 더 세우라 한다', d:'관계 -5', f:()=>{chOp(knight,c,-5);}},
      ]});
  }},

  /* ── 인생관/성장 ── */
  {cond:c=>c.lifestyle==='dip', w:1, run:c=>popup({title:'외교의 묘', sub:'인생관 — 외교',
    body:'협상 자리에서 당신은 상대의 속내를 꿰뚫어 보았습니다.\\n말 한마디로 분위기를 뒤집는 법을 터득해갑니다.',
    opts:[{t:'경험을 새긴다', d:'인생관 경험 +30', f:()=>{c.lifeXP+=30; addStress(c,-3,'성장의 기쁨');}}]})},
  {cond:c=>c.lifestyle==='mar', w:1, run:c=>popup({title:'전술의 깨달음', sub:'인생관 — 무예',
    body:'옛 전투를 복기하던 중, 당신은 새로운 진형의 가능성을 발견했습니다.',
    opts:[{t:'연구를 거듭한다', d:'인생관 경험 +30', f:()=>{c.lifeXP+=30; addStress(c,-3,'성장의 기쁨');}}]})},
  {cond:c=>c.lifestyle==='stew', w:1, run:c=>popup({title:'장부의 지혜', sub:'인생관 — 내정',
    body:'복잡한 세무 장부를 들여다보다, 낭비되던 재정의 구멍을 찾아냈습니다.',
    opts:[{t:'개선책을 적용한다', d:'금 +30, 인생관 경험 +30', f:()=>{REGIONS[c.region].gold+=30; c.lifeXP+=30;}}]})},
  {cond:c=>c.lifestyle==='intr', w:1, run:c=>popup({title:'그림자의 기술', sub:'인생관 — 음모',
    body:'밀정들을 다루는 법, 비밀을 캐는 법, 흔적을 지우는 법.\\n당신은 어둠의 기술에 점점 능해집니다.',
    opts:[{t:'기술을 연마한다', d:'인생관 경험 +30', f:()=>{c.lifeXP+=30; addStress(c,-3,'은밀한 성취');}}]})},
  {cond:c=>c.lifestyle==='learn', w:1, run:c=>popup({title:'고서의 발견', sub:'인생관 — 학문',
    body:'수도원 서고 깊은 곳에서 오래된 라틴어 필사본을 발견했습니다.\\n잊혀진 지식이 그 안에 잠들어 있습니다.',
    opts:[{t:'밤새 탐독한다', d:'위신 +5, 인생관 경험 +30', f:()=>{state.prestige+=5; c.lifeXP+=30; addStress(c,-3,'지식의 기쁨');}}]})},

  /* ── 어린시절 (자녀 대상) ── */
  {cond:c=>Object.values(chars).some(k=>!k.dead&&(k.father===c.id||k.mother===c.id)&&age(k)>=6&&age(k)<16), w:2, run:c=>{
    const child=Object.values(chars).find(k=>!k.dead&&(k.father===c.id||k.mother===c.id)&&age(k)>=6&&age(k)<16);
    if(!child) return;
    popup({title:'아이의 재능', sub:'가문',
      body:`${child.name}(${age(child)}세)이(가) 또래보다 영민하다는 것이 보입니다.\\n어떻게 길러야 할지 고민이 됩니다.`,
      opts:[
        {t:'엄격히 교육시킨다', d:'교육 점수 +3, 관계 -5', f:()=>{child.eduScore+=3; chOp(child,c,-5);}},
        {t:'자유롭게 둔다', d:'관계 +10', f:()=>{chOp(child,c,10);}},
      ]});
  }},

  /* ══════════════════════════════════════════════════════════
     추가 이벤트 배치 2 — CK3 위키 기반 각색 (약 50개)
     카테고리: 건강/질병, 계책, 전쟁후속, 성격발현,
              궁정정치, 계절, 가문, 인생관심화, 왕조
     ══════════════════════════════════════════════════════════ */

  /* ── 건강 / 질병 ── */
  {cond:c=>age(c)>=40, w:2, run:c=>popup({title:'노쇠의 조짐', sub:'건강',
    body:'이른 아침 일어서려다 현기증을 느꼈습니다. 시의가 조심스럽게 말합니다. 몸이 과거와 같지 않습니다.',
    opts:[
      {t:'규칙적인 생활을 시작한다', d:'스트레스 -10', f:()=>{addStress(c,-10,'절제의 시작');}},
      {t:'무시한다', d:'스트레스 +8', f:()=>addStress(c,8,'외면한 몸의 경고')},
    ]})},
  {cond:c=>true, w:2, run:c=>popup({title:'부상당한 기사', sub:'군사',
    body:'훈련 중 믿음직한 기사 한 명이 크게 다쳤습니다. 치료비가 만만치 않지만, 그의 충성심은 값을 매기기 어렵습니다.',
    opts:[
      {t:'최선의 치료를 해준다', d:'금 -30, 관계 +20', f:()=>{
        if(REGIONS[c.region].gold<30){log('금이 부족합니다.');return;}
        REGIONS[c.region].gold-=30;
        const ct=Object.values(chars).find(k=>!k.dead&&k.courtOf===c.region&&k.id!==c.id&&stat(k,'mar')>=6);
        if(ct) chOp(ct,c,20);
        log('기사가 회복되었습니다. 그의 눈빛에 감사가 담겨 있습니다.','good');
      }},
      {t:'운명에 맡긴다', d:'스트레스 +5', f:()=>addStress(c,5,'외면한 충성')},
    ]})},
  {cond:c=>stressLvl(c)>=2, w:4, run:c=>popup({title:'몸이 말을 듣지 않는다', sub:'건강',
    body:'스트레스가 몸으로 나타나기 시작했습니다. 손이 떨리고 밥맛이 없습니다. 주변에서 걱정하는 눈빛이 역력합니다.',
    opts:[
      {t:'완전히 쉰다', d:'스트레스 -40, 금 -20 (업무 중단)', f:()=>{addStress(c,-40,'휴식의 치유'); REGIONS[c.region].gold-=20;}},
      {t:'계속 버틴다', d:'스트레스 +15', f:()=>addStress(c,15,'몸을 혹사한 대가')},
    ]})},
  {cond:c=>chars[c.spouse]&&!chars[c.spouse].dead, w:2, run:c=>{
    const sp=chars[c.spouse]; if(!sp||sp.dead) return;
    popup({title:'배우자의 병환', sub:'가문',
      body:`${sp.name}이(가) 며칠째 앓아눕고 있습니다. 시의는 원인을 잘 모르겠다고 합니다.`,
      opts:[
        {t:'곁에서 간호한다', d:'스트레스 -15, 관계 +10', f:()=>{addStress(c,-15,'곁에 있어줌'); chOp(sp,c,10); log(`${sp.name}이(가) 회복되었습니다.`,'fam');}},
        {t:'시의에게 맡긴다', d:'금 -30', f:()=>{if(REGIONS[c.region].gold>=30) REGIONS[c.region].gold-=30;}},
      ]});
  }},
  {cond:c=>true, w:1, run:c=>popup({title:'기적의 샘', sub:'신앙',
    body:'인근 마을에서 병을 고쳤다는 샘이 발견됐습니다. 순례자들이 몰려들고 있습니다. 진위는 알 수 없습니다.',
    opts:[
      {t:'성지로 공인한다', d:'민심 +12, 위신 +8', f:()=>{REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+12); state.prestige+=8; log('성지 선포로 순례자가 늘었습니다.','good');}},
      {t:'미신이라며 단속한다', d:'민심 -5', f:()=>{REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-5); if(c.traits.includes('cynical'))addStress(c,-5,'냉소가의 통쾌함');}},
    ]})},

  /* ── 성격 특성 발현 ── */
  {cond:c=>c.traits.includes('ambitious'), w:3, run:c=>popup({title:'야심의 속삭임', sub:'내면',
    body:'밤마다 같은 꿈을 꿉니다. 타라 언덕에서 하이킹의 관을 쓰는 꿈. 하지만 꿈과 현실 사이의 거리가 너무 멉니다.',
    opts:[
      {t:'집념을 불태운다', d:'스트레스 +8, 위신 +5', f:()=>{addStress(c,8,'야망의 무게'); state.prestige+=5;}},
      {t:'현실을 받아들인다', d:'스트레스 -5', f:()=>{addStress(c,-5,'잠깐의 평온'); if(!c.traits.includes('content'))addStress(c,5,'야망가의 체념');}},
    ]})},
  {cond:c=>c.traits.includes('wrathful'), w:3, run:c=>popup({title:'분노의 폭발', sub:'내면',
    body:'신하가 실수를 저질렀습니다. 사소한 일이지만 순간 이성을 잃고 소리를 질렀습니다. 궁정 안이 조용해졌습니다.',
    opts:[
      {t:'사과하고 수습한다', d:'스트레스 +10 (성격에 반함), 관계 회복', f:()=>{addStress(c,10,'자존심을 굽힘'); log('분노 후 수습했습니다.','dip');}},
      {t:'위엄으로 포장한다', d:'위신 -5, 스트레스 -5', f:()=>{addStress(c,-5,'분노의 해소'); state.prestige=Math.max(0,state.prestige-5);}},
    ]})},
  {cond:c=>c.traits.includes('greedy'), w:3, run:c=>popup({title:'탐욕의 유혹', sub:'내면',
    body:'세금을 올려 금고를 채울 기회가 있습니다. 백성들은 힘들어지겠지만, 금화는 달콤합니다.',
    opts:[
      {t:'올린다', d:'금 +80, 민심 -15', f:()=>{REGIONS[c.region].gold+=80; REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-15); if(c.traits.includes('greedy'))addStress(c,-8,'탐욕가의 만족');}},
      {t:'참는다', d:'스트레스 +12 (성격에 반함)', f:()=>addStress(c,12,'탐욕을 억누름')},
    ]})},
  {cond:c=>c.traits.includes('kind'), w:3, run:c=>popup({title:'친절의 대가', sub:'내면',
    body:'어려운 농민 가족이 문을 두드렸습니다. 다음 달 세금을 낼 돈이 없다고 합니다. 당신은 마음이 약해집니다.',
    opts:[
      {t:'면제해준다', d:'금 -20, 민심 +8, 스트레스 -8', f:()=>{REGIONS[c.region].gold-=20; REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+8); addStress(c,-8,'친절의 보람');}},
      {t:'원칙대로 징수한다', d:'스트레스 +15 (성격에 반함)', f:()=>addStress(c,15,'친절한 자의 냉혹')},
    ]})},
  {cond:c=>c.traits.includes('brave'), w:2, run:c=>popup({title:'용기의 시험', sub:'내면',
    body:'혼자서 적의 첩자를 발견했습니다. 호위병 없이 직접 대면할 수 있습니다. 위험하지만 그게 당신다운 선택입니다.',
    opts:[
      {t:'직접 맞선다', d:'위신 +15, 위험', f:()=>{state.prestige+=15; if(Math.random()<0.15){addStress(c,20,'부상'); log('혼자 맞섰지만 경상을 입었습니다.','war');}else{addStress(c,-10,'용기의 짜릿함'); log('첩자를 직접 제압했습니다!','war');}}},
      {t:'호위병을 부른다', d:'스트레스 +5', f:()=>addStress(c,5,'용감한 자의 망설임')},
    ]})},
  {cond:c=>c.traits.includes('just'), w:2, run:c=>popup({title:'공정의 딜레마', sub:'내면',
    body:'두 봉신이 소유권 분쟁을 가져왔습니다. 법적으로는 한 쪽이 옳지만, 다른 한 쪽은 당신의 오랜 충신입니다.',
    opts:[
      {t:'법대로 판결한다', d:'위신 +10, 충신 관계 -15', f:()=>{state.prestige+=10; const kt=Object.values(chars).find(k=>!k.dead&&k.courtOf===c.region&&opinion(c,k)>20); if(kt) chOp(kt,c,-15); log('공정한 판결이 내려졌습니다.','good');}},
      {t:'충신의 편을 든다', d:'스트레스 +15 (성격에 반함)', f:()=>addStress(c,15,'공정한 자의 편파')},
    ]})},
  {cond:c=>c.traits.includes('craven'), w:2, run:c=>popup({title:'두려움의 그림자', sub:'내면',
    body:'국경 너머에서 군대가 움직인다는 소식이 들려왔습니다. 아직 확인도 안 됐는데 손이 떨립니다.',
    opts:[
      {t:'즉시 병력을 소집한다', d:'금 -40, 병력 +100', f:()=>{REGIONS[c.region].gold-=40; REGIONS[c.region].troops+=100; addStress(c,-5,'준비된 자의 안도');}},
      {t:'일단 정탐꾼을 보낸다', d:'스트레스 -5', f:()=>addStress(c,-5,'신중한 자의 판단')},
    ]})},
  {cond:c=>c.traits.includes('paranoid')||c.traits.includes('deceitful'), w:2, run:c=>popup({title:'의심의 씨앗', sub:'내면',
    body:'가장 믿었던 신하가 적국과 서신을 교환했다는 제보가 들어왔습니다. 사실일 수도, 모략일 수도 있습니다.',
    opts:[
      {t:'즉시 가둔다', d:'관계 -30, 위신 -5', f:()=>{const kt=Object.values(chars).find(k=>!k.dead&&k.courtOf===c.region&&k.id!==c.id); if(kt){chOp(kt,c,-30);} state.prestige=Math.max(0,state.prestige-5); addStress(c,-5,'의심의 해소');}},
      {t:'증거를 먼저 확인한다', d:'스트레스 +5', f:()=>addStress(c,5,'신중함의 불안')},
    ]})},

  /* ── 전쟁 후속 / 군사 ── */
  {cond:c=>!state.wars.some(w=>w.atk===c.id||w.def===c.id)&&playerRegions().length>=2, w:2, run:c=>popup({title:'전후 처리', sub:'군사',
    body:'전쟁이 끝난 지 얼마 지나지 않았습니다. 부상병들이 고향으로 돌아가고 있고, 유족들의 눈물이 마르지 않았습니다.',
    opts:[
      {t:'위로금을 지급한다', d:'금 -50, 민심 +10, 병력 회복', f:()=>{REGIONS[c.region].gold-=50; REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+10); log('전사자 유족에게 위로금을 보냈습니다.','good');}},
      {t:'그냥 해산시킨다', d:'민심 -5', f:()=>{REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-5);}},
    ]})},
  {cond:c=>true, w:2, run:c=>popup({title:'포로 협상', sub:'군사',
    body:'인근 전투에서 잡힌 귀족 포로가 당신의 영지에 있습니다. 몸값을 받을 수도, 풀어줄 수도 있습니다.',
    opts:[
      {t:'몸값을 받는다', d:'금 +70', f:()=>{REGIONS[c.region].gold+=70; log('귀족 포로의 몸값을 받았습니다.','good');}},
      {t:'인심 쓰며 풀어준다', d:'위신 +10, 관계 +15', f:()=>{state.prestige+=10; log('포로를 풀어줬습니다. 에이레에 소문이 퍼질 것입니다.','dip');}},
    ]})},
  {cond:c=>true, w:2, run:c=>popup({title:'탈주한 노르드 전사', sub:'군사',
    body:'인근에서 전쟁에 지친 노르드 전사 몇 명이 약탈을 벌이다 잡혔습니다. 처리 방법을 결정해야 합니다.',
    opts:[
      {t:'처형한다', d:'민심 +5, 스트레스 +5', f:()=>{REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+5); addStress(c,5,'처형의 무게');}},
      {t:'병력으로 흡수한다', d:'병력 +60, 위험', f:()=>{REGIONS[c.region].troops+=60; if(Math.random()<0.2){addStress(c,10,'불안한 병사'); log('흡수한 전사들이 말썽을 일으켰습니다.','war');}else log('노르드 전사들이 합류했습니다.','war');}},
    ]})},
  {cond:c=>state.wars.some(w=>w.atk===c.id), w:3, run:c=>{
    const w=state.wars.find(ww=>ww.atk===c.id); if(!w) return;
    const d=chars[w.def]; if(!d) return;
    popup({title:'협상 제안', sub:'전쟁',
      body:`${d.name}이(가) 협상을 요청해왔습니다. 현재 전황: ${w.score>=0?'아군 우세':'적군 우세'} (${Math.round(w.score)}점)`,
      opts:[
        {t:'협상에 응한다', d:'전쟁 종결, 위신 소폭 손실', f:()=>{
          setTruce(w.atk,w.def,3);
          state.wars=state.wars.filter(x=>x!==w);
          state.prestige=Math.max(0,state.prestige-10);
          log('협상으로 전쟁이 끝났습니다.','dip');
        }},
        {t:'거부한다', d:'전쟁 계속', f:()=>log(`${d.name}의 협상을 거부했습니다.`,'war')},
      ]});
  }},

  /* ── 궁정 정치 심화 ── */
  {cond:c=>Object.values(chars).filter(k=>!k.dead&&k.ruler&&k.id!==c.id).length>=2, w:2, run:c=>{
    const rulers=Object.values(chars).filter(k=>!k.dead&&k.ruler&&k.id!==c.id);
    const a=rulers[0], b=rulers[1]; if(!a||!b) return;
    popup({title:'두 왕국의 갈등', sub:'외교',
      body:`${a.name}과(와) ${b.name} 사이에 분쟁이 생겼습니다. 둘 다 당신에게 중재를 요청합니다.`,
      opts:[
        {t:`${a.name}의 편을 든다`, d:`관계 +20/${b.name} -15`, f:()=>{chOp(a,c,20); chOp(b,c,-15); state.prestige+=5; log(`${a.name}을(를) 지지했습니다.`,'dip');}},
        {t:`${b.name}의 편을 든다`, d:`관계 +20/${a.name} -15`, f:()=>{chOp(b,c,20); chOp(a,c,-15); state.prestige+=5;}},
        {t:'중립을 지킨다', d:'위신 +8', f:()=>{state.prestige+=8; log('중립을 선언했습니다. 현명한 처신입니다.','dip');}},
      ]});
  }},
  {cond:c=>true, w:2, run:c=>popup({title:'사절단 도착', sub:'외교',
    body:'해외에서 온 낯선 사절단이 왕좌 앞에 섰습니다. 그들은 교역 협정을 원하며, 이국적인 선물을 가져왔습니다.',
    opts:[
      {t:'환대하며 협정을 맺는다', d:'금 +50, 위신 +10', f:()=>{REGIONS[c.region].gold+=50; state.prestige+=10; log('교역 협정이 체결되었습니다.','good');}},
      {t:'거절한다', d:'위신 -5', f:()=>{state.prestige=Math.max(0,state.prestige-5);}},
    ]})},
  {cond:c=>true, w:2, run:c=>popup({title:'귀족의 결투 요청', sub:'궁정',
    body:'영지의 한 귀족이 명예 훼손을 이유로 결투를 신청해왔습니다. 거절하면 비겁자로 낙인찍힐 수 있습니다.',
    opts:[
      {t:'직접 결투에 응한다', d:'위신 +15, 부상 위험', f:()=>{state.prestige+=15; if(Math.random()<0.25){addStress(c,20,'결투 부상'); log('결투에서 부상을 입었습니다.','war');}else{log('결투에서 이겼습니다. 명예가 높아졌습니다.','good'); addStress(c,-5,'승리의 영광');}}},
      {t:'대리인을 세운다', d:'위신 -5, 스트레스 -5', f:()=>{state.prestige=Math.max(0,state.prestige-5); addStress(c,-5,'실리적 선택');}},
    ]})},
  {cond:c=>true, w:2, run:c=>popup({title:'궁정 시인의 도전', sub:'궁정',
    body:'방랑 시인이 당신의 궁정을 찾아와 즉흥시 대결을 제안합니다. 웃음으로 넘길 수도 있지만, 받아들이면 화제가 될 것입니다.',
    opts:[
      {t:'대결에 응한다', d:'위신 ±15 (50%)', f:()=>{if(Math.random()<0.5){state.prestige+=15; addStress(c,-10,'승리의 즐거움'); log('시 대결에서 이겼습니다. 궁정이 웃음으로 가득합니다.','good');}else{state.prestige=Math.max(0,state.prestige-10); addStress(c,8,'창피스러운 패배');}}},
      {t:'웃으며 거절한다', d:'스트레스 -3', f:()=>addStress(c,-3,'가벼운 여유')},
    ]})},
  {cond:c=>REGIONS[c.region].gold>100, w:2, run:c=>popup({title:'귀족의 청원 — 토지', sub:'궁정',
    body:'오랜 봉신 가문이 선대에 빼앗긴 땅을 돌려달라는 청원을 올렸습니다. 법적 근거는 애매합니다.',
    opts:[
      {t:'돌려준다', d:'금 -30, 관계 +25', f:()=>{REGIONS[c.region].gold-=30; const kt=Object.values(chars).find(k=>!k.dead&&k.courtOf===c.region&&k.id!==c.id); if(kt) chOp(kt,c,25); log('토지 청원을 들어줬습니다.','good');}},
      {t:'거절한다', d:'관계 -10, 위신 +5', f:()=>{state.prestige+=5; const kt=Object.values(chars).find(k=>!k.dead&&k.courtOf===c.region&&k.id!==c.id); if(kt) chOp(kt,c,-10);}},
    ]})},
  {cond:c=>true, w:1, run:c=>popup({title:'고문관의 조언', sub:'궁정',
    body:'경험 많은 고문관이 찾아와 조언합니다. "공포보다 사랑으로 다스리는 것이 오래갑니다." 하지만 당신의 생각은 다를 수 있습니다.',
    opts:[
      {t:'귀담아듣는다', d:'스트레스 -8', f:()=>addStress(c,-8,'지혜의 위안')},
      {t:'일축한다', d:'스트레스 +5', f:()=>addStress(c,5,'조언을 무시한 불편함')},
    ]})},

  /* ── 계절 / 자연 ── */
  {cond:c=>state.month>=3&&state.month<=5, w:2, run:c=>popup({title:'봄비', sub:'계절',
    body:'오랜 봄비가 내립니다. 들판이 초록으로 물들고 농민들의 얼굴에 기대가 피어납니다.',
    opts:[{t:'풍요로운 봄을 기원한다', d:'민심 +5, 스트레스 -5', f:()=>{REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+5); addStress(c,-5,'계절의 위안');}}]})},
  {cond:c=>state.month>=6&&state.month<=8, w:2, run:c=>popup({title:'여름 가뭄', sub:'계절',
    body:'6월부터 비가 내리지 않았습니다. 강이 줄어들고 농작물이 타들어갑니다. 가을 수확이 걱정됩니다.',
    opts:[
      {t:'저수지를 만든다', d:'금 -60, 내년 수확 +', f:()=>{REGIONS[c.region].gold-=60; REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+8); log('저수지 공사를 시작했습니다.','good');}},
      {t:'기우제를 올린다', d:'민심 +5', f:()=>{REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+5);}},
    ]})},
  {cond:c=>state.month>=9&&state.month<=11, w:2, run:c=>popup({title:'수확 철', sub:'계절',
    body:'가을 수확이 끝났습니다. 올해 농사는 나쁘지 않았습니다. 곡식 창고가 어느 정도 찼습니다.',
    opts:[
      {t:'잔치를 벌인다', d:'금 -30, 민심 +10, 스트레스 -8', f:()=>{REGIONS[c.region].gold-=30; REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+10); addStress(c,-8,'수확의 기쁨');}},
      {t:'비축해둔다', d:'금 +20', f:()=>{REGIONS[c.region].gold+=20; log('수확물을 비축했습니다.','good');}},
    ]})},
  {cond:c=>state.month<=2||state.month>=12, w:2, run:c=>popup({title:'한겨울 밤', sub:'계절',
    body:'밤이 너무 깁니다. 난롯가에 앉아 에이레 통일에 대한 꿈을 생각합니다. 아직 갈 길이 멉니다.',
    opts:[
      {t:'전략을 다듬는다', d:'위신 +5, 스트레스 -5', f:()=>{state.prestige+=5; addStress(c,-5,'사색의 시간');}},
      {t:'그냥 잠에 든다', d:'스트레스 -10', f:()=>addStress(c,-10,'긴 잠의 위안')},
    ]})},
  {cond:c=>true, w:1, run:c=>popup({title:'개기 월식', sub:'자연',
    body:'밤하늘의 달이 붉게 물들었습니다. 백성들이 두려워하며 수군거립니다. 불길한 징조인지 신성한 징조인지 의견이 갈립니다.',
    opts:[
      {t:'신의 뜻이라 선포한다', d:'위신 +10, 민심 +5', f:()=>{state.prestige+=10; REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+5);}},
      {t:'과학적으로 설명한다', d:'스트레스 -3', f:()=>{addStress(c,-3,'지식의 여유'); if(c.traits.includes('rational'))addStress(c,-5,'합리적인 자의 명쾌함');}},
    ]})},

  /* ── 가문 / 왕조 심화 ── */
  {cond:c=>Object.values(chars).filter(k=>!k.dead&&(k.father===c.id||k.mother===c.id)&&age(k)>=16&&!k.ruler).length>0, w:2, run:c=>{
    const adult=Object.values(chars).find(k=>!k.dead&&(k.father===c.id||k.mother===c.id)&&age(k)>=16&&!k.ruler);
    if(!adult) return;
    popup({title:'자식의 앞날', sub:'가문',
      body:`${adult.name}(${age(adult)}세)이(가) 자신만의 영지를 원합니다. 아직 당신의 궁정에 있지만, 야망이 보입니다.`,
      opts:[
        {t:'독립적인 역할을 준다', d:'관계 +20, 위신 +5', f:()=>{chOp(adult,c,20); state.prestige+=5; log(`${adult.name}에게 역할을 줬습니다.`,'fam');}},
        {t:'곁에 두고 교육한다', d:'관계 -5, 스탯 +', f:()=>{chOp(adult,c,-5); adult.base={...adult.base, dip:Math.min(15,adult.base.dip+1)};}},
      ]});
  }},
  {cond:c=>Object.values(chars).filter(k=>!k.dead&&k.dyn===c.dyn&&k.id!==c.id).length>=3, w:1, run:c=>popup({title:'가문의 연회', sub:'왕조',
    body:'우어 브리언 가문의 친척들이 모였습니다. 오랜만에 보는 얼굴들, 연회는 밤새 이어졌습니다.',
    opts:[
      {t:'성대하게 열었다', d:'금 -40, 위신 +15, 가문 유대 +', f:()=>{REGIONS[c.region].gold-=40; state.prestige+=15; addStress(c,-10,'가문의 온기'); log('가문 연회가 성대하게 열렸습니다.','fam');}},
      {t:'소박하게 치렀다', d:'금 -15, 스트레스 -5', f:()=>{REGIONS[c.region].gold-=15; addStress(c,-5,'소박한 만남');}},
    ]})},
  {cond:c=>age(c)>=35&&!c.spouse, w:2, run:c=>popup({title:'후계자 걱정', sub:'가문',
    body:'신하들이 은밀히 속삭입니다. 후계자 없이 당신이 죽으면 우어 브리언 왕조가 끊깁니다. 혼인을 서둘러야 합니다.',
    opts:[
      {t:'혼처를 알아보겠다', d:'외교 화면에서 혼인 교섭 가능', f:()=>log('혼처를 찾기로 했습니다. 지도에서 이웃 왕국을 눌러 교섭하세요.','fam')},
      {t:'아직 시간이 있다', d:'스트레스 +5', f:()=>addStress(c,5,'미룬 걱정')},
    ]})},
  {cond:c=>Object.values(chars).some(k=>!k.dead&&(k.father===c.id||k.mother===c.id)&&age(k)>=3&&age(k)<10), w:2, run:c=>{
    const child=Object.values(chars).find(k=>!k.dead&&(k.father===c.id||k.mother===c.id)&&age(k)>=3&&age(k)<10);
    if(!child) return;
    popup({title:'아이의 첫 말', sub:'가문',
      body:`${child.name}(${age(child)}세)이(가) 처음으로 진지하게 물었습니다.\n"아버지, 언젠가 저도 왕이 될 수 있나요?"`,
      opts:[
        {t:'"그래, 열심히 하면."', d:'관계 +10, 스트레스 -8', f:()=>{chOp(child,c,10); addStress(c,-8,'아이의 믿음');}},
        {t:'"왕이 되려면 많이 배워야 한단다."', d:'교육점수 +2', f:()=>{child.eduScore+=2; chOp(child,c,5);}},
      ]});
  }},
  {cond:c=>Object.values(chars).some(k=>!k.dead&&k.spouse===c.id&&chars[k.spouse]), w:2, run:c=>{
    const sp=chars[c.spouse]; if(!sp||sp.dead) return;
    if(Math.random()<0.5) return; // 변화 없는 날도 있음
    popup({title:'배우자와의 논쟁', sub:'가문',
      body:`${sp.name}이(가) 당신의 최근 결정에 의문을 제기했습니다. 두 사람의 의견이 갈렸고, 분위기가 어색해졌습니다.`,
      opts:[
        {t:'솔직하게 대화한다', d:'스트레스 -8, 관계 +8', f:()=>{addStress(c,-8,'솔직함의 위로'); chOp(sp,c,8);}},
        {t:'고집을 꺾지 않는다', d:'스트레스 +5, 관계 -5', f:()=>{addStress(c,5,'고집의 대가'); chOp(sp,c,-5);}},
      ]});
  }},

  /* ── 인생관 심화 이벤트 ── */
  {cond:c=>c.lifestyle==='dip'&&stat(c,'dip')>=8, w:2, run:c=>popup({title:'협상의 달인', sub:'외교 인생관',
    body:'당신의 말 한마디에 상대방이 태도를 바꿨습니다. 협상 테이블에서 당신은 점점 강해지고 있습니다.',
    opts:[{t:'기술을 연마한다', d:'외교 스탯 임시 +, 경험 +20', f:()=>{c.lifeXP+=20; const o=Object.values(chars).find(k=>!k.dead&&k.ruler&&k.id!==c.id); if(o) chOp(o,c,8); addStress(c,-5,'성장의 기쁨');}}]})},
  {cond:c=>c.lifestyle==='mar'&&stat(c,'mar')>=8, w:2, run:c=>popup({title:'전략의 통찰', sub:'무예 인생관',
    body:'옛 전투들을 다시 분석하며 새로운 전략적 통찰을 얻었습니다. 에이레의 지형이 다르게 보입니다.',
    opts:[{t:'훈련에 적용한다', d:'병력 +50, 경험 +20', f:()=>{c.lifeXP+=20; REGIONS[c.region].troops+=50; addStress(c,-3,'전략가의 확신');}}]})},
  {cond:c=>c.lifestyle==='stew'&&REGIONS[c.region].gold>200, w:2, run:c=>popup({title:'재정 혁신', sub:'내정 인생관',
    body:'새로운 세금 체계를 도입할 수 있습니다. 단기적으로 불만이 생기겠지만 장기적으로는 이득입니다.',
    opts:[
      {t:'도입한다', d:'민심 -8, 금 수입 +50', f:()=>{REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-8); REGIONS[c.region].gold+=50; c.lifeXP+=20; log('새 세금 체계가 도입됐습니다.','good');}},
      {t:'현상 유지', d:'경험 +10', f:()=>{c.lifeXP+=10;}},
    ]})},
  {cond:c=>c.lifestyle==='intr'&&stat(c,'intr')>=7, w:2, run:c=>popup({title:'그림자 네트워크', sub:'음모 인생관',
    body:'당신의 밀정 네트워크가 예상치 못한 정보를 가져왔습니다. 이웃 왕국의 내부 갈등을 이용할 수 있습니다.',
    opts:[
      {t:'정보를 활용한다', d:'이웃 관계 -10, 위신 +10', f:()=>{const o=Object.values(chars).find(k=>!k.dead&&k.ruler&&k.id!==c.id); if(o){chOp(o,c,-10);} state.prestige+=10; c.lifeXP+=20; log('정보를 이용해 유리한 고지를 점했습니다.','dip');}},
      {t:'덮어둔다', d:'경험 +10', f:()=>{c.lifeXP+=10;}},
    ]})},
  {cond:c=>c.lifestyle==='learn'&&stat(c,'learn')>=7, w:2, run:c=>popup({title:'새로운 이론', sub:'학문 인생관',
    body:'오랜 연구 끝에 새로운 농업 기술을 발견했습니다. 영지 생산성을 높일 수 있는 방법입니다.',
    opts:[{t:'적용한다', d:'민심 +8, 금 +40, 경험 +20', f:()=>{REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+8); REGIONS[c.region].gold+=40; c.lifeXP+=20; log('새 농업 기술이 도입됐습니다.','good');}}]})},

  /* ── 교역 / 도시 ── */
  {cond:c=>true, w:2, run:c=>popup({title:'리머릭 시장', sub:'내정',
    body:'리머릭의 시장이 활성화되면서 상인들이 몰려오고 있습니다. 시장세를 올릴 절호의 기회입니다.',
    opts:[
      {t:'시장세를 올린다', d:'금 +60, 민심 -8', f:()=>{REGIONS[c.region].gold+=60; REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-8);}},
      {t:'그대로 둔다', d:'민심 +3', f:()=>{REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+3);}},
    ]})},
  {cond:c=>REGIONS[c.region].gold>80, w:1, run:c=>popup({title:'항구 확장', sub:'내정',
    body:'킨세일 항구를 확장하면 더 많은 교역선이 들어올 수 있습니다. 투자가 필요합니다.',
    opts:[
      {t:'투자한다', d:'금 -80, 매월 수입 +', f:()=>{REGIONS[c.region].gold-=80; REGIONS[c.region].cap=(REGIONS[c.region].cap||1200)+50; log('항구 확장이 완료됐습니다. 교역이 늘어납니다.','good');}},
      {t:'다음으로 미룬다', d:'—', f:()=>{}},
    ]})},
  {cond:c=>true, w:2, run:c=>popup({title:'도둑 무리', sub:'영지',
    body:'국경 지대에 도둑 무리가 출몰해 상인들이 피해를 보고 있습니다. 민심이 흔들립니다.',
    opts:[
      {t:'기사를 보내 소탕한다', d:'금 -25, 민심 +10', f:()=>{REGIONS[c.region].gold-=25; REGIONS[c.region].pop=Math.min(100,(REGIONS[c.region].pop||60)+10); log('도둑 무리가 소탕됐습니다.','good');}},
      {t:'지역민에게 맡긴다', d:'민심 -5', f:()=>{REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-5);}},
    ]})},

  /* ── 종교 심화 ── */
  {cond:c=>true, w:2, run:c=>popup({title:'이단 설교자', sub:'신앙',
    body:'인근 마을에서 기독교 교리에 반하는 설교를 하는 자가 나타났습니다. 사람들이 몰려들고 있습니다.',
    opts:[
      {t:'체포해 주교에게 넘긴다', d:'위신 +8, 민심 -5', f:()=>{state.prestige+=8; REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-5);}},
      {t:'무시한다', d:'민심 -8', f:()=>{REGIONS[c.region].pop=Math.max(0,(REGIONS[c.region].pop||60)-8);}},
      {t:'직접 설교자를 만난다', d:'스트레스 +5', f:()=>addStress(c,5,'의심의 씨앗')},
    ]})},
  {cond:c=>true, w:1, run:c=>popup({title:'로마에서 온 소식', sub:'신앙',
    body:'교황청에서 십자군 소집령이 떨어졌다는 소식이 들려왔습니다. 아직 아일랜드까지는 먼 이야기지만, 기독교 세계의 공기가 달라지고 있습니다.',
    opts:[
      {t:'참여를 고려한다', d:'위신 +5', f:()=>{state.prestige+=5; log('십자군 참여를 검토하고 있습니다.','dip');}},
      {t:'에이레가 우선이다', d:'스트레스 -3', f:()=>addStress(c,-3,'집중하는 마음')},
    ]})},

  /* ── 스트레스 심화 ── */
  {cond:c=>stressLvl(c)>=1, w:4, run:c=>popup({title:'악몽', sub:'내면',
    body:'같은 악몽이 반복됩니다. 전쟁터, 배신, 무너지는 성. 새벽에 식은땀을 흘리며 깨어납니다.',
    opts:[
      {t:'사제에게 고해성사를 한다', d:'스트레스 -25', f:()=>addStress(c,-25,'고해의 위안')},
      {t:'혼자 버텨낸다', d:'스트레스 +10', f:()=>addStress(c,10,'혼자 삼킨 고통')},
    ]})},
  {cond:c=>stressLvl(c)>=2, w:5, run:c=>popup({title:'정신 붕괴 직전', sub:'내면',
    body:'모든 것이 무너질 것 같습니다. 신하들이 당신의 눈빛을 피합니다. 이대로는 안 됩니다.',
    opts:[
      {t:'모든 업무를 중단하고 쉰다', d:'스트레스 -50, 금 -30', f:()=>{addStress(c,-50,'긴 휴식'); REGIONS[c.region].gold-=30; log('왕이 잠시 물러났습니다. 먼스터는 조용히 돌아갑니다.','fam');}},
      {t:'술에 기댄다', d:'스트레스 -30, 절제 위반', f:()=>{addStress(c,-30,'취기로 잊음'); if(c.traits.includes('temperate'))addStress(c,20,'절제하는 자의 타락');}},
      {t:'신에게 매달린다', d:'스트레스 -20, 위신 +5', f:()=>{addStress(c,-20,'신앙의 위안'); state.prestige+=5;}},
    ]})},

];
function randomEventPulse(){
  if(state.over) return;
  const c=playerChar();
  if(!c||c.dead||!c.region||!REGIONS[c.region]) return; // 영지 없는 상태 방어
  if(Math.random()<0.18){
    const pool=EVENTS.filter(e=>{ try{ return e.cond(c); }catch(err){ return false; } });
    let tw=pool.reduce((s,e)=>s+e.w,0), r=Math.random()*tw;
    for(const e of pool){ r-=e.w; if(r<=0){ try{ e.run(c); }catch(err){} break; } }
  }
}

/* ---------- 플레이어 외교 ---------- */
function openBuildMenu(bid){
  const b=BARONIES[bid]; if(!b) return;
  const existing=b.buildings||[];
  const seatGold=BARONIES[playerChar().region]?.gold||0;
  const opts=Object.entries(BUILDING_TYPES)
    .filter(([type])=>!existing.includes(type)&&(b.buildings||[]).length+(b.building_queue?1:0)<b.slots)
    .map(([type,bt])=>({
      t:`${bt.icon} ${bt.n}`,
      d:`금 ${bt.cost} · ${bt.buildMonths}개월 · ${bt.desc}${seatGold<bt.cost?' (금 부족)':''}`,
      f: seatGold>=bt.cost ? ()=>{ startBuilding(bid,type); renderCourt(); } : ()=>log('금이 부족합니다.')
    }));
  opts.push({t:'취소'});
  showModal({title:`${b.n} 건설`, sub:`슬롯 ${b.slots-(existing.length+(b.building_queue?1:0))}/${b.slots} · 금 ${Math.round(seatGold)}`,
    body:'건설할 건물을 선택하세요.', opts});
  pause();
}
function openCounty(cid){
  const holder=countyHolder(cid); if(!holder) return;
  // 공성 중이면 전황 표시
  const war=state.wars.find(w=>w.targetRid===cid);
  if(war&&(war.atk===state.player||war.def===state.player)){
    const cnt=COUNTIES[cid], bids=cnt.baronies, occ=war.occupied||[];
    const my=war.atk===state.player?war.score:-war.score;
    const siegeLines=bids.map(bid=>`${BARONIES[bid]?.n||bid}: ${occ.includes(bid)?'⚔ 점령됨':'🛡 방어중'}`).join('\n');
    popup({title:`${cnt.n} 공성전`, sub:'전황 상세',
      body:`전황 점수: ${my>0?'+':''}${Math.round(my)}%\n\n${siegeLines}`,
      opts:[{t:'닫기'}]});
    return;
  }
  openRegion(COUNTIES[cid]?.capital, cid);
}
/* ═══════════════════════════════════════════════
   내 백작령 상세 — 소속 남작령 목록 + 건물 건설
   지도에서 내 영지 클릭 시 호출
   ═══════════════════════════════════════════════ */
function openMyCounty(cid, dispName){
  const p=playerChar(); if(!p) return;
  const cnt=COUNTIES[cid];
  const bids=cnt?cnt.baronies:[p.region];
  const totalTroops=bids.reduce((s,b)=>s+(BARONIES[b]?.troops||0),0);
  const seatGold=Math.round(BARONIES[p.region]?.gold||0);
  const duchy=cnt?DUCHIES[cnt.duchy]?.n||'':'';
  const opts=[];
  for(const bid of bids){
    const b=BARONIES[bid]; if(!b) continue;
    const done=(b.buildings||[]).filter(x=>x.done);
    const inProg=(b.buildings||[]).find(x=>!x.done);
    const slotsUsed=done.length+(inProg?1:0);
    const canBuild=slotsUsed<BUILDING_SLOTS&&!inProg;
    const doneNames=done.length?done.map(x=>`${BUILDINGS[x.type]?.icon||''}${BUILDINGS[x.type]?.n||x.type}`).join(' '):'없음';
    const wipText=inProg?` | ⏳${BUILDINGS[inProg.type]?.n||''} 건설중`:'';
    if(canBuild){
      opts.push({t:`🔨 ${b.n} — 건설하기`,
        d:`슬롯 ${slotsUsed}/${BUILDING_SLOTS} · 완공: ${doneNames}${wipText}`,
        f:()=>openBuildMenu(bid)});
    } else {
      opts.push({t:`${b.n}`,
        d:`슬롯 ${slotsUsed}/${BUILDING_SLOTS} · 완공: ${doneNames}${wipText}${slotsUsed>=BUILDING_SLOTS?' · 슬롯 가득':''}`,
        f:()=>{}});
    }
  }
  opts.push({t:'닫기'});
  showModal({
    title:cnt?.n||dispName,
    sub:`${duchy}${duchy?' · ':''}남작령 ${bids.length}개`,
    body:'',
    html:`<div class="kv"><span>총 병력</span><span>${totalTroops}</span></div>
          <div class="kv"><span>금고</span><span>${seatGold}</span></div>
          <div style="margin:10px 0 4px;font-size:.72rem;letter-spacing:.2em;color:var(--gold-dim)">남작령 건물</div>`,
    opts
  });
}

/* ═══════════════════════════════════════════════
   프로필 모달 — portrait 클릭 시 CK3 스타일 창
   ═══════════════════════════════════════════════ */
function skillGrade(v){
  if(v<=4)  return ['최하','#d08a82'];
  if(v<=8)  return ['하',  '#b89060'];
  if(v<=12) return ['중',  '#a89878'];
  if(v<=16) return ['상',  '#8fbf8f'];
  return              ['최상','#6adf9a'];
}
function skillColor(k){
  return {dip:'#5a8aaa',mar:'#aa5a5a',stew:'#8aaa5a',intr:'#8a5aaa',learn:'#aa9a5a',prow:'#c87a3a'}[k]||'#8a8a8a';
}

/* ══════════════════════════════════════════════════════
   SVG 초상화 생성 — 외부 파일 불필요, 특성 기반 외모 변화
   w, h: 출력 크기 (기본 86×108)
   ══════════════════════════════════════════════════════ */
function makePortraitSVG(c, w, h){
  w = w||86; h = h||108;
  const male = c.sex !== 'f';
  const charAge = age(c);
  const aged = charAge > 45;

  /* 특성 기반 색상 */
  const hairColor = c.traits.includes('greedy')  ? '#c8a02a'
                  : c.traits.includes('brave')    ? '#4a2808'
                  : c.traits.includes('cruel')    ? '#1a1208'
                  : '#7a5228';
  const eyeColor  = c.traits.includes('ambitious')? '#2a6a9a'
                  : c.traits.includes('just')     ? '#3a7a4a'
                  : c.traits.includes('cruel')    ? '#8a2a2a'
                  : '#4a6a3a';
  const robeColor = c.traits.includes('brave')||c.traits.includes('wrathful') ? '#5a2818'
                  : c.traits.includes('calm')||c.traits.includes('kind')       ? '#1e3a4a'
                  : '#2e2818';
  const skin  = '#c8906a';
  const skinS = '#a56848';

  /* 미소 방향 */
  const smileD = c.traits.includes('kind')||c.traits.includes('calm')
    ? `M ${w*.33} ${h*.56} Q ${w*.5} ${h*.62} ${w*.67} ${h*.56}`
    : c.traits.includes('cruel')||c.traits.includes('wrathful')
    ? `M ${w*.33} ${h*.60} Q ${w*.5} ${h*.55} ${w*.67} ${h*.60}`
    : `M ${w*.34} ${h*.58} Q ${w*.5} ${h*.62} ${w*.66} ${h*.58}`;

  const cx = w/2, cy = h*0.46;
  const s = v => v * (w/86); /* 기준 86px 대비 스케일 */

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#181009"/>
  <!-- 의복 -->
  <ellipse cx="${cx}" cy="${h*.88}" rx="${s(30)}" ry="${s(18)}" fill="${robeColor}"/>
  <rect x="${cx-s(13)}" y="${h*.73}" width="${s(26)}" height="${s(18)}" fill="${robeColor}" rx="${s(3)}"/>
  <rect x="${cx-s(5)}" y="${h*.66}" width="${s(10)}" height="${s(12)}" fill="${skin}" rx="${s(3)}"/>
  <!-- 머리카락 -->
  ${male
    ? `<ellipse cx="${cx}" cy="${cy}" rx="${s(19)}" ry="${s(22)}" fill="${hairColor}"/>`
    : `<ellipse cx="${cx}" cy="${cy}" rx="${s(21)}" ry="${s(24)}" fill="${hairColor}"/>
       <ellipse cx="${cx-s(18)}" cy="${cy+s(10)}" rx="${s(8)}" ry="${s(14)}" fill="${hairColor}"/>
       <ellipse cx="${cx+s(18)}" cy="${cy+s(10)}" rx="${s(8)}" ry="${s(14)}" fill="${hairColor}"/>`}
  <!-- 얼굴 -->
  <ellipse cx="${cx}" cy="${cy}" rx="${s(16)}" ry="${s(19)}" fill="${skin}"/>
  <ellipse cx="${cx-s(17)}" cy="${cy}" rx="${s(3.5)}" ry="${s(4.5)}" fill="${skin}"/>
  <ellipse cx="${cx+s(17)}" cy="${cy}" rx="${s(3.5)}" ry="${s(4.5)}" fill="${skin}"/>
  <!-- 눈썹 -->
  <path d="M ${cx-s(11)} ${cy-s(8)} Q ${cx-s(7)} ${cy-s(10.5)} ${cx-s(3)} ${cy-s(8)}"
    stroke="${hairColor}" stroke-width="${s(1.6)}" fill="none" stroke-linecap="round"/>
  <path d="M ${cx+s(3)} ${cy-s(8)} Q ${cx+s(7)} ${cy-s(10.5)} ${cx+s(11)} ${cy-s(8)}"
    stroke="${hairColor}" stroke-width="${s(1.6)}" fill="none" stroke-linecap="round"/>
  <!-- 눈 -->
  <ellipse cx="${cx-s(7)}" cy="${cy-s(3.5)}" rx="${s(4.5)}" ry="${s(3.5)}" fill="#ece8e0" opacity=".9"/>
  <ellipse cx="${cx+s(7)}" cy="${cy-s(3.5)}" rx="${s(4.5)}" ry="${s(3.5)}" fill="#ece8e0" opacity=".9"/>
  <circle cx="${cx-s(7)}" cy="${cy-s(3.5)}" r="${s(2.5)}" fill="${eyeColor}"/>
  <circle cx="${cx+s(7)}" cy="${cy-s(3.5)}" r="${s(2.5)}" fill="${eyeColor}"/>
  <circle cx="${cx-s(6)}" cy="${cy-s(4.5)}" r="${s(.9)}" fill="white" opacity=".7"/>
  <circle cx="${cx+s(8)}" cy="${cy-s(4.5)}" r="${s(.9)}" fill="white" opacity=".7"/>
  <!-- 코 -->
  <path d="M ${cx} ${cy+s(1)} L ${cx-s(2.5)} ${cy+s(7)} Q ${cx} ${cy+s(9)} ${cx+s(2.5)} ${cy+s(7)} Z"
    fill="${skinS}" opacity=".35"/>
  <!-- 입 -->
  <path d="${smileD}" stroke="${skinS}" stroke-width="${s(1.5)}" fill="none" stroke-linecap="round"/>
  <!-- 수염 (남성 20세+) -->
  ${male && charAge >= 20
    ? `<path d="M ${cx-s(8)} ${cy+s(10)} Q ${cx} ${cy+s(18)} ${cx+s(8)} ${cy+s(10)} Q ${cx+s(7)} ${cy+s(14)} ${cx} ${cy+s(16)} Q ${cx-s(7)} ${cy+s(14)} Z"
        fill="${hairColor}" opacity="${aged ? .75 : .45}"/>`
    : ''}
  <!-- 주름 (45세+) -->
  ${aged
    ? `<path d="M ${cx-s(14)} ${cy-s(2)} Q ${cx-s(12)} ${cy+s(2)} ${cx-s(13)} ${cy+s(5)}"
        stroke="${skinS}" stroke-width="${s(.8)}" fill="none" opacity=".45"/>
       <path d="M ${cx+s(14)} ${cy-s(2)} Q ${cx+s(12)} ${cy+s(2)} ${cx+s(13)} ${cy+s(5)}"
        stroke="${skinS}" stroke-width="${s(.8)}" fill="none" opacity=".45"/>`
    : ''}
  <!-- 왕관 -->
  <rect x="${cx-s(20)}" y="${h*.18}" width="${s(40)}" height="${s(5)}" fill="#c8a24a" rx="${s(2)}"/>
  <polygon points="${cx},${h*.18} ${cx-s(3)},${h*.09} ${cx+s(3)},${h*.18}" fill="#c8a24a"/>
  <polygon points="${cx-s(10)},${h*.18} ${cx-s(13)},${h*.10} ${cx-s(7)},${h*.18}" fill="#c8a24a"/>
  <polygon points="${cx+s(10)},${h*.18} ${cx+s(13)},${h*.10} ${cx+s(7)},${h*.18}" fill="#c8a24a"/>
  <circle cx="${cx}" cy="${h*.11}" r="${s(1.8)}" fill="#c04040"/>
  <circle cx="${cx-s(11)}" cy="${h*.125}" r="${s(1.4)}" fill="#4060c0"/>
  <circle cx="${cx+s(11)}" cy="${h*.125}" r="${s(1.4)}" fill="#40a060"/>
  <!-- 테두리 -->
  <rect width="${w}" height="${h}" fill="none" stroke="#c8a24a" stroke-width="${s(1.2)}" opacity=".3"/>
</svg>`;
}

function buildProfileHTML(c){
  const p=playerChar();
  const isPlayer=c.id===p.id;
  const charAge=age(c);
  const ttl=(isPlayer&&state.kingdomFormed)?'아일랜드 왕'
    :`${COUNTIES[countyOf(c.region)]?.n||BARONIES[c.region]?.n||''} ${c.ruler?'소왕':'궁정인'}`;

  /* A. 기본정보 */
  const stressLv=stressLvl(c);
  const stressColor=['var(--parch-dim)','#c8a24a','#c87a4a','#d05a4a'][stressLv];
  const warNow=state.wars.filter(w=>w.atk===c.id||w.def===c.id);
  const allyList=state.alliances
    .filter(k=>k.includes(c.id))
    .map(k=>{ const oid=k.replace(c.id,'').replace('|',''); return chars[oid]?.name||''; })
    .filter(Boolean);
  const secA=`
    <div class="pm-sec-title">인물</div>
    <div class="pm-kv"><span>가문</span><span>${c.dyn||'—'}</span></div>
    <div class="pm-kv"><span>나이</span><span>${charAge}세 (${c.byear}년생)</span></div>
    <div class="pm-kv"><span>성별</span><span>${c.sex==='m'?'남':'여'}</span></div>
    <div class="pm-kv"><span>칭호</span><span>${ttl}</span></div>
    ${isPlayer?`<div class="pm-kv"><span>위신</span><span style="color:var(--gold)">${state.prestige}</span></div>`:''}
    ${isPlayer?`<div class="pm-kv"><span>상속법</span><span>{{SUCCESSION}}</span></div>`.replace('{{SUCCESSION}}',{partition:'분할상속',primogeniture:'장자상속',elective:'선출제'}[state.successionLaw]):''}
    <div class="pm-kv" style="margin-top:6px"><span>스트레스</span><span style="color:${stressColor}">${c.stress}/150 (${['평온','불안','위험','임계'][stressLv]})</span></div>
    <div style="height:6px;background:#0c0906;border:1px solid #2a2014;border-radius:2px;overflow:hidden;margin:4px 0 8px">
      <div style="width:${Math.min(100,c.stress/1.5)}%;height:100%;background:linear-gradient(90deg,#6e5a2c,${stressColor});border-radius:2px"></div>
    </div>
    ${warNow.length?`<div class="pm-kv"><span>전쟁</span><span style="color:#d05a4a">⚔ ${warNow.length}건 진행 중</span></div>`:''}
    ${warNow.map(w=>{
      const isAtk=w.atk===c.id;
      const myCmd=warCommander(w,isAtk?'atk':'def');
      const foeId=isAtk?w.def:w.atk;
      const foe=chars[foeId];
      const score=isAtk?w.score:-w.score;
      if(!myCmd) return '';
      return `<div class="pm-kv"><span>지휘관</span><span style="color:var(--gold-dim)">${myCmd.name} (무${stat(myCmd,'mar')} 용${stat(myCmd,'prow')})${myCmd.traits.includes('wounded')?' <span style="color:#d05a4a">부상</span>':''}</span></div>`;
    }).join('')}
    ${allyList.length?`<div class="pm-kv"><span>동맹</span><span>${allyList.join(', ')}</span></div>`:''}
    ${c.spouse&&chars[c.spouse]?`<div class="pm-kv"><span>배우자</span><span>${chars[c.spouse].name}</span></div>`:''}
    ${!c.spouse&&c.betrothed&&chars[c.betrothed]?`<div class="pm-kv"><span>혼약</span><span style="color:#c9a227">💍 ${chars[c.betrothed].name} (${age(chars[c.betrothed])}세)</span></div>`:''}`;

  /* B. 스킬 + 특성 */
  const SKILL_FULL={dip:'외교',mar:'무예',stew:'내정',intr:'음모',learn:'학문',prow:'용맹'};
  let skillsHtml='';
  for(const [k,n] of Object.entries(SKILL_FULL)){
    const v=stat(c,k), pct=Math.min(100,v/20*100);
    const [grade,gColor]=skillGrade(v);
    skillsHtml+=`<div class="skill-row">
      <span class="skill-name">${n.slice(0,2)}</span>
      <div class="skill-bar-wrap"><div class="skill-bar-fill" style="width:${pct}%;background:${skillColor(k)}"></div></div>
      <span class="skill-val">${v}</span>
      <span class="skill-grade" style="color:${gColor}">${grade}</span>
    </div>`;
  }
  const traitChips=c.traits.map(t=>{
    const tn=TRAITS[t]?.n||t;
    const neg=['craven','wrathful','lazy','greedy','deceitful','arbitrary','cruel','impatient','gluttonous','shy','vengeful','lustful'].includes(t);
    return `<span class="pm-chip${neg?' neg':''}">${tn}</span>`;
  }).join('');
  const eduChip=c.edu!==null?`<span class="pm-chip edu">${EDU_NAMES[c.eduFocus]?.[c.edu]||''}</span>`:'';
  const lifeChip=c.lifestyle?`<span class="pm-chip life">${SKILLS[c.lifestyle]}의 길 · ${c.lifeXP}xp</span>`:'';
  const secB=`
    <div class="pm-sec-title">능력</div>
    ${skillsHtml}
    <div style="margin-top:10px;font-size:.68rem;color:var(--gold-dim);letter-spacing:.15em;margin-bottom:5px">특성</div>
    <div>${traitChips||'<span style="color:var(--parch-dim);font-size:.75rem">없음</span>'}</div>
    <div style="margin-top:6px">${eduChip}${lifeChip}</div>`;

  /* C. 가족·영지·자문회 */
  const kids=Object.values(chars).filter(k=>!k.dead&&(k.father===c.id||k.mother===c.id));
  const kidsHtml=kids.length
    ?kids.map(k=>`<div class="pm-kv"><span>${k.sex==='m'?'아들':'딸'} ${k.name}</span><span>${age(k)}세</span></div>`).join('')
    :'<div style="font-size:.75rem;color:var(--parch-dim)">없음</div>';
  const myCounties=directCountiesOf(c.id);
  const countiesHtml=myCounties.length
    ?myCounties.map(cid2=>{
        const totalT=COUNTIES[cid2]?.baronies.reduce((s,b)=>s+(BARONIES[b]?.troops||0),0)||0;
        return `<div class="pm-kv"><span>${COUNTIES[cid2]?.n||cid2}</span><span>⚔${totalT}</span></div>`;
      }).join('')
    :'<div style="font-size:.75rem;color:var(--parch-dim)">없음</div>';
  const vassals=vassalsOf(c.id);
  const claimsHtml=isPlayer&&state.claims.length
    ?state.claims.map(cl=>{
        const cb=CB_TYPES[cl.type];
        return `<div class="pm-kv"><span>${cb.icon} ${claimName(cl.rid)}</span><span style="color:${cb.color}">${cb.n}</span></div>`;
      }).join(''):'';
  const councilSrc=isPlayer?state.council:c.council;
  const councilHtml=Object.entries(COUNCIL_ROLES).map(([role,info])=>{
    const cid2=councilSrc[role];
    const name=cid2&&chars[cid2]&&!chars[cid2].dead?chars[cid2].name.split(' ')[0]:'공석';
    const color=cid2&&chars[cid2]&&!chars[cid2].dead?'var(--parch)':'var(--parch-dim)';
    return `<div class="pm-kv"><span>${info.icon} ${info.n}</span><span style="color:${color}">${name}</span></div>`;
  }).join('');
  const secC=`
    <div class="pm-sec-title">자녀</div>${kidsHtml}
    <div class="pm-sec-title" style="margin-top:12px">직할 백작령</div>${countiesHtml}
    ${vassals.length?`<div class="pm-kv" style="margin-top:4px"><span>봉신</span><span>${vassals.length}명</span></div>`:''}
    ${claimsHtml?`<div class="pm-sec-title" style="margin-top:12px">보유 명분</div>${claimsHtml}`:''}
    <div class="pm-sec-title" style="margin-top:12px">자문회</div>${councilHtml}`;

  return `
    <div class="pm-header">
      <div class="pm-portrait">${makePortraitSVG(c, 86, 108)}</div>
      <div class="pm-title">
        <h2>${c.name}</h2>
        <div class="pm-sub">${ttl} · ${c.dyn} 가문 · ${charAge}세</div>
      </div>
      <button class="pm-close" onclick="closeProfile()">✕</button>
    </div>
    <div class="pm-body">
      <div class="pm-section">${secA}</div>
      <div class="pm-section">${secB}</div>
      <div class="pm-section">${secC}</div>
    </div>`;
}

function openProfile(c){
  if(!c) c=playerChar();
  const shade=document.getElementById('profileShade');
  const modal=document.getElementById('profileModal');
  if(!shade||!modal) return;
  modal.innerHTML=buildProfileHTML(c);
  shade.classList.add('show');
  if(!state.paused){ state._profileAutoResume=true; pause(); }
}
function closeProfile(){
  const shade=document.getElementById('profileShade');
  if(shade) shade.classList.remove('show');
  if(state._profileAutoResume){ state._profileAutoResume=false; resume(); }
}
document.addEventListener('DOMContentLoaded',()=>{
  const shade=document.getElementById('profileShade');
  if(shade) shade.addEventListener('click',e=>{ if(e.target===shade) closeProfile(); });
});

function openRegion(rid, cid_hint){
  const p=playerChar(); if(!p) return;
  const dispName=(cid_hint&&COUNTIES[cid_hint]?.n)||BARONIES[rid]?.n||'영지';
  const c=ownerOf(rid);
  if(!c) return;

  // ── 내 영토 클릭: 백작령 상세 + 남작령 건물 건설
  if(c.id===p.id){
    openMyCounty(cid_hint||countyOf(rid), dispName);
    return;
  }

  // ── 타국 영지 클릭: 외교 창
  const op=opinion(c,p), myOp=opinion(p,c);
  const atWar=state.wars.some(w=>(w.atk===p.id&&w.def===c.id)||(w.atk===c.id&&w.def===p.id));
  const truce=truceBetween(p.id,c.id);
  // 상대 백작령 총 병력
  const cid=cid_hint||countyOf(rid);
  const defTroops=cid&&COUNTIES[cid]?COUNTIES[cid].baronies.reduce((s,b)=>s+(BARONIES[b]?.troops||0),0):(BARONIES[rid]?.troops||0);

  // 혼약 현황 — 내 가족 중 이 가문과 혼약 중인 인원
  const myBetrotheds = Object.values(chars).filter(k=>
    !k.dead && (k.id===p.id||k.father===p.id||k.mother===p.id) &&
    k.betrothed && chars[k.betrothed]?.courtOf===c.region
  );
  const betrothLine = myBetrotheds.length
    ? `<div class="kv"><span>혼약</span><span style="color:#c9a227">💍 ${myBetrotheds.map(k=>k.name).join(', ')}</span></div>`
    : '';
  // 혼인 후보 수 미리보기
  const spCandM = findMarriageCandidates(c,'m').length;
  const spCandF = findMarriageCandidates(c,'f').length;
  const candLine = (spCandM+spCandF)>0
    ? `<div class="kv"><span>혼인 후보</span><span style="color:var(--parch-dim)">♂${spCandM} ♀${spCandF}</span></div>`
    : '';
  const html=`
    <div class="kv"><span>지배자</span><span>${c.name} (${age(c)}세)</span></div>
    <div class="kv"><span>가문</span><span>${c.dyn}</span></div>
    <div class="kv"><span>성격</span><span>${c.traits.map(t=>TRAITS[t]?.n||'').filter(Boolean).join(' · ')||'—'}</span></div>
    <div class="kv"><span>능력</span><span>외${stat(c,'dip')} 무${stat(c,'mar')} 내${stat(c,'stew')} 음${stat(c,'intr')} 학${stat(c,'learn')}</span></div>
    <div class="kv"><span>이 백작령 병력</span><span>${defTroops}</span></div>
    <div class="kv"><span>전체 전력</span><span>${Math.round(power(c))}</span></div>
    <div class="kv"><span>나를 보는 시각</span><span class="${op>15?'relGood':op<-15?'relBad':'relMid'}">${op>0?'+':''}${op}</span></div>
    <div class="kv"><span>내가 보는 시각</span><span class="${myOp>15?'relGood':myOp<-15?'relBad':'relMid'}">${myOp>0?'+':''}${myOp}</span></div>
    ${isAllied(p.id,c.id)?'<div class="kv"><span>관계</span><span style="color:#6aaa7a">⚔ 동맹</span></div>':''}
    ${c.liege===p.id?'<div class="kv"><span>관계</span><span style="color:#c9a227">👑 봉신</span></div>':''}
    ${betrothLine}${candLine}
  `;
  const opts=[];
  if(!atWar){
    opts.push({t:'선물 보내기', d:'금 50 — 관계 +15', f:()=>{
      const seatB=BARONIES[p.region]; if(!seatB||seatB.gold<50){log('금이 부족합니다.');return;}
      playSynthSFX('gold');
      seatB.gold-=50; chOp(c,p,15);
      log(`<b>${c.name}</b>에게 선물을 보냈습니다.`,'dip');
      if(p.traits.includes('greedy'))addStress(p,10,'탐욕스러운 자의 선물');
    }});
    if(!isAllied(p.id,c.id)){
      opts.push({t:'동맹 제안', d:`수락 가능성: ${allianceChance(c,p)}%`, f:()=>{
        if(Math.random()*100<allianceChance(c,p)){
          formAlliance(p.id,c.id); chOp(c,p,25); chOp(p,c,25);
          log(`<b>${c.name}</b>이(가) 동맹을 수락했습니다!`,'good');
        } else { chOp(c,p,-5); log(`<b>${c.name}</b>이(가) 동맹을 거절했습니다.`,'dip'); }
      }});
    } else {
      opts.push({t:'동맹 파기', d:'관계 -40, 5년 휴전', f:()=>{
        breakAlliance(p.id,c.id); log(`${c.name}과(와)의 동맹을 파기했습니다.`,'war');
      }});
    }
    // 봉신으로 삼기 (아직 봉신이 아닌 경우)
    if(c.liege!==p.id){
      opts.push({t:'봉신 요청', d:`수락 가능성: ${vassalChance(c,p)}%`, f:()=>{
        if(Math.random()*100<vassalChance(c,p)){
          c.liege=p.id; c.ruler=true;
          chOp(c,p,20);
          log(`<b>${c.name}</b>이(가) 봉신을 수락했습니다!`,'good');
          checkVictoryHint();
        } else { chOp(c,p,-20); log(`<b>${c.name}</b>이(가) 봉신 요청을 거절했습니다.`,'dip'); }
      }});
    }
    /* 혼인 교섭 — 후보 유무에 따라 설명 변경 */
    const _mCands = findMarriageCandidates(c,'m').length + findMarriageCandidates(c,'f').length;
    opts.push({t:'💍 혼인 교섭', d:_mCands>0?`후보 ${_mCands}명 · 관계 +30`:'가문 생성 혼인 · 관계 +30', f:()=>tryMarriage(c)});
    opts.push({t:'살해 모략', d:'은밀한 칼 — 발각 시 관계 악화', f:()=>{
      if(startScheme(p,c)) log('어둠 속에서 칼을 갈기 시작합니다...','war');
      else log('이미 진행 중인 모략입니다.');
    }});
    if(!truce){
      if(isAllied(p.id,c.id)){
        opts.push({t:'동맹 파기 후 선전포고 가능', d:'먼저 동맹을 파기하세요', f:()=>{}});
      } else {
        const myClaims=claimsForRegion(c);
        opts.push({t:myClaims.length>0?`선전포고 (명분 ${myClaims.length}개)`:'선전포고 (명분 없음)',
          d:`전력 ${Math.round(power(p))} vs ${Math.round(power(c))}`,
          f:()=>{ closePanel('court'); closePanel('dec'); openDeclareWar(c.id); }});
      }
    } else {
      opts.push({t:'휴전 중', d:'전쟁 불가', f:()=>{}});
    }
  } else {
    opts.push({t:'교전 중', d:'전쟁이 끝나야 외교 가능', f:()=>{}});
  }
  opts.push({t:'닫기'});
  showModal({title:`${dispName}`, sub:`${c.name}의 영지`, body:'', html, opts});
  pause();
}
function prestigeBonus(){ return Math.round((state.prestige-120)/12); } // 위신 120 기준, 12당 +1%
function allianceChance(c,p){
  let v=30+opinion(c,p);
  v+=aiW(c,'soc')*5;
  if(power(p)>power(c)) v+=10;
  v+=prestigeBonus();
  return Math.max(2,Math.min(95,Math.round(v)));
}
function vassalChance(c,p){
  let v=-20+opinion(c,p);
  const ratio=power(p)/power(c);
  v+=ratio>2?45:ratio>1.5?25:ratio>1.2?10:-20;
  v-=aiW(c,'bold')*6;
  if(c.traits.includes('content'))v+=15;
  if(c.traits.includes('craven'))v+=15;
  if(c.traits.includes('ambitious'))v-=20;
  v+=Math.round(prestigeBonus()*1.5); // 봉신 수락에 위신 비중 높음
  return Math.max(1,Math.min(85,Math.round(v)));
}
/* ─── 혼인 수락 공식 (CK3 위키: Marriage Acceptance) ───
   출처: https://ck3.paradoxwikis.com/Breeding#Marriage_acceptance
   기준 +1 이상이면 수락. 주요 항목만 근사 구현.          */
function marriageAcceptance(candidate, targetRuler, mySelf){
  /* candidate: 내 쪽 혼인 당사자, targetRuler: 상대 군주, mySelf: true면 본인 혼인 */
  const p = playerChar();
  let v = 0;
  /* 위키: +0.75 per opinion with marriage offerer (나에 대한 호감) */
  v += Math.floor(opinion(targetRuler, p) * 0.75);
  /* 위키: +0.25 per opinion with prospective spouse (당사자에 대한 호감) */
  v += Math.floor(opinion(targetRuler, candidate) * 0.25);
  /* 위키: -15 if arranging own marriage */
  if(mySelf) v -= 15;
  /* 위키: Marrying up/down — 영지 수 차이로 서열 근사 */
  const myCount  = directCountiesOf(p.id).length;
  const tgtCount = directCountiesOf(targetRuler.id).length;
  const rankDiff = tgtCount - myCount;
  if(rankDiff > 0) v += 30;        // 상대가 위 → 상향혼: 상대에게 유리
  else if(rankDiff < 0) v -= 30;   // 상대가 아래 → 하향혼: 상대가 꺼림
  /* 위신 보정 */
  v += prestigeBonus() * 2;
  /* AI 성향 보정 */
  v += aiW(targetRuler, 'soc') * 5;
  if(targetRuler.traits.includes('ambitious')) v -= 10; // 야심가는 혼인보다 정복 선호
  if(targetRuler.traits.includes('content'))  v += 10;
  return Math.max(1, Math.min(95, Math.round(v)));
}

/* 실존 후보 조회: 상대 군주 궁정의 미혼 성인/아동 */
function findMarriageCandidates(targetRuler, wantedSex){
  return Object.values(chars).filter(c =>
    !c.dead &&
    c.courtOf === targetRuler.region &&
    c.sex === wantedSex &&
    !c.spouse &&
    !c.betrothed &&
    c.id !== targetRuler.id &&
    age(c) >= 6
  ).sort((a,b) => age(b) - age(a)); // 나이 많은 순
}

/* 후보 카드 HTML 생성 */
function _candidateCardHTML(sp, acc){
  const a = age(sp);
  const traitStr = sp.traits.map(t=>TRAITS[t]?.n||'').filter(Boolean).join(' · ') || '—';
  const accColor = acc >= 60 ? '#7aaa6a' : acc >= 30 ? '#c9a227' : '#9e5a5a';
  return `
    <div style="background:#1a1408;border:1px solid var(--line);border-radius:4px;padding:8px 10px;margin:6px 0">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="font-size:1.4rem">${sp.sex==='m'?'👨':'👩'}</div>
        <div style="flex:1">
          <div style="font-size:.85rem;color:var(--gold);font-weight:600">${sp.name} <span style="color:var(--parch-dim);font-weight:400">(${a}세)</span></div>
          <div style="font-size:.72rem;color:var(--parch);margin-top:2px">
            외<b>${stat(sp,'dip')}</b> 무<b>${stat(sp,'mar')}</b> 내<b>${stat(sp,'stew')}</b> 음<b>${stat(sp,'intr')}</b> 학<b>${stat(sp,'learn')}</b>
          </div>
          <div style="font-size:.68rem;color:var(--parch-dim);margin-top:1px">특성: ${traitStr}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:.72rem;color:${accColor};font-weight:600">수락 ${acc}%</div>
          <div style="font-size:.62rem;color:var(--parch-dim)">${a<16?'혼약 대상':'혼인 가능'}</div>
        </div>
      </div>
    </div>`;
}

/* 혼인/혼약 실제 체결 처리 */
function _solemnizeMarriage(myChar, spChar, targetRuler, isBetrothal){
  const p = playerChar();
  /* 기존 혼약 상대가 있으면 조용히 해제 (상대측 betrothed도 null 처리) */
  if(myChar.betrothed && myChar.betrothed !== spChar.id){
    const prev = chars[myChar.betrothed]; if(prev) prev.betrothed = null;
    myChar.betrothed = null;
  }
  if(spChar.betrothed && spChar.betrothed !== myChar.id){
    const prev = chars[spChar.betrothed]; if(prev) prev.betrothed = null;
    spChar.betrothed = null;
  }
  if(isBetrothal){
    myChar.betrothed = spChar.id;
    spChar.betrothed = myChar.id;
    chOp(targetRuler, p, 20); chOp(p, targetRuler, 20);
    const rel = myChar.id===p.id ? '당신' : myChar.sex==='m' ? '아들' : '딸';
    log(`<b>${myChar.name}</b>(${rel})과(와) <b>${spChar.name}</b>의 혼약이 맺어졌습니다. 성인이 되면 혼인합니다.`, 'fam');
    playSynthSFX('event');
  } else {
    myChar.spouse = spChar.id;
    spChar.spouse = myChar.id;
    if(spChar.courtOf !== p.region) spChar.courtOf = p.region;
    chOp(targetRuler, p, 30); chOp(p, targetRuler, 30);
    const rel = myChar.id===p.id ? '당신' : myChar.sex==='m' ? '아들' : '딸';
    log(`<b>${myChar.name}</b>(${rel})과(와) <b>${spChar.name}</b>의 혼인이 성사됐습니다! 두 가문이 맺어졌습니다.`, 'good');
    playSynthSFX('gold');
    popup({title:'혼인 성사', sub:`${myChar.name} ♥ ${spChar.name}`,
      body:`${myChar.name}과(와) ${spChar.name}의 혼인이 이루어졌습니다.\n두 가문의 유대가 공고해졌습니다.`,
      opts:[{t:'축복이 있기를', f:()=>addStress(p,-5,'혼인의 기쁨')}]});
  }
}

/* 후보 선택 모달 — 상대 궁정 후보 카드 UI */
function _showCandidatePicker(myChar, targetRuler, candidates, idx){
  idx = idx || 0;
  const p = playerChar();
  const sp = candidates[idx];
  if(!sp){ showModal({title:'혼인 후보 없음', sub:'혼담 종료',
    body:'적합한 혼인 후보가 없습니다.', opts:[{t:'닫기'}]}); return; }

  const mySelf = myChar.id === p.id;
  const acc = marriageAcceptance(myChar, targetRuler, mySelf);
  const isBetrothal = age(myChar) < 16 || age(sp) < 16;
  const cardHTML = _candidateCardHTML(sp, acc);

  const opts = [];
  /* 혼인/혼약 제안 */
  opts.push({
    t: isBetrothal ? '혼약 체결' : '혼인 제안',
    d: `수락 가능성 ${acc}%`,
    f: () => {
      if(Math.random() * 100 < acc){
        _solemnizeMarriage(myChar, sp, targetRuler, isBetrothal);
      } else {
        chOp(targetRuler, p, -5);
        log(`${targetRuler.name}이(가) 혼담을 정중히 거절했습니다.`, 'dip');
      }
    }
  });
  /* 다음 후보 */
  if(candidates.length > 1){
    opts.push({
      t: `다음 후보 (${idx+1}/${candidates.length})`,
      f: () => _showCandidatePicker(myChar, targetRuler, candidates, (idx+1) % candidates.length)
    });
  }
  /* 파혼 버튼: myChar에 기존 혼약이 있을 때 */
  if(myChar.betrothed){
    const exPartner = chars[myChar.betrothed];
    opts.push({
      t: `파혼 — ${exPartner?.name||'혼약 상대'} (위신 -10)`,
      d: '관계 -20',
      f: () => breakBetrothal(myChar)
    });
  }
  opts.push({t:'그만둔다'});

  showModal({
    title: '혼인 교섭',
    sub: `${targetRuler.dyn} 가문과의 혼담`,
    body: `<b>${myChar.name}</b>(${age(myChar)}세)의 혼처`,
    html: cardHTML,
    opts
  });
}

/* 파혼 처리 (CK3: Break Betrothal — 위신 -10, 관계 -20) */
function breakBetrothal(c){
  const p = playerChar();
  const partner = chars[c.betrothed];
  if(!partner) { c.betrothed = null; return; }
  const partnerRuler = Object.values(chars).find(k=>!k.dead&&k.ruler&&k.region===partner.courtOf);
  c.betrothed = null;
  partner.betrothed = null;
  state.prestige = Math.max(0, state.prestige - 10);
  if(partnerRuler){ chOp(partnerRuler, p, -20); chOp(p, partnerRuler, -20); }
  log(`<b>${c.name}</b>과(와) <b>${partner.name}</b>의 혼약이 파기됐습니다. 위신 -10`, 'war');
}

/* 혼인 교섭 진입점 — openRegion에서 호출 */
function doMarriage(candidate, c){
  /* 하위 호환: NPC 활동 marriage에서 직접 호출하는 경우 fallback */
  tryMarriage(c);
}

function tryMarriage(targetRuler){
  const p = playerChar();
  /* ① 내 쪽 후보 목록: 본인(미혼/혼약 없음) + 미혼 자녀 (6세 이상) */
  const myCandidates = [];
  if(!p.spouse && !p.betrothed) myCandidates.push(p);
  Object.values(chars)
    .filter(k => !k.dead && (k.father===p.id||k.mother===p.id) && !k.spouse && !k.betrothed && age(k)>=6)
    .sort((a,b) => age(b)-age(a))
    .forEach(k => myCandidates.push(k));

  if(!myCandidates.length){
    log('혼인시킬 미혼 가족이 없습니다. (혼약 중인 가족은 먼저 파혼하세요)', 'dip');
    return;
  }

  /* ② 내 후보 선택 → 상대 후보 탐색 */
  const pickOpts = myCandidates.map(myChar => {
    const wantedSex = myChar.sex === 'm' ? 'f' : 'm';
    const spCands = findMarriageCandidates(targetRuler, wantedSex);
    const hasReal = spCands.length > 0;
    const myAge = age(myChar);
    const rel = myChar.id===p.id ? '본인' : myChar.sex==='m' ? '아들' : '딸';
    return {
      t: `${myChar.name} (${rel} · ${myAge}세)`,
      d: hasReal
        ? `${targetRuler.dyn} 후보 ${spCands.length}명`
        : `가문 생성 — ${myAge<16?'혼약':'혼인'}`,
      f: () => {
        if(hasReal){
          /* 실존 후보 카드 UI */
          _showCandidatePicker(myChar, targetRuler, spCands, 0);
        } else {
          /* Fallback: 즉석 NPC 생성 (기존 방식) */
          const acc = marriageAcceptance(myChar, targetRuler, myChar.id===p.id);
          if(Math.random()*100 < acc){
            const isBetrothal = myAge < 16;
            const sp = mk({
              name: targetRuler.dyn+' 가문의 '+(myChar.sex==='m'?'규수':'자제'),
              dyn: targetRuler.dyn,
              sex: myChar.sex==='m'?'f':'m',
              byear: state.year - (isBetrothal ? 10+Math.floor(Math.random()*5) : 18+Math.floor(Math.random()*8)),
              bmonth:3, bday:15,
              traits: randTraits(2), base: randStats(), edu:1, eduFocus:'dip',
              courtOf: p.region
            });
            _solemnizeMarriage(myChar, sp, targetRuler, isBetrothal);
          } else {
            chOp(targetRuler, p, -5);
            log(`${targetRuler.name}이(가) 혼담을 정중히 거절했습니다.`, 'dip');
          }
        }
      }
    };
  });
  pickOpts.push({t:'그만둔다'});

  showModal({
    title: '혼인 교섭',
    sub: `${targetRuler.dyn} 가문과의 혼담`,
    body: '누구의 혼처를 알아보시겠습니까?',
    opts: pickOpts
  });
}


/* ---------- 궁정 ---------- */
/* ════════════════════════════════════════════════════
   자문회(Council) 시스템
   ════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════
   명분 (Casus Belli) 시스템
   ════════════════════════════════════════════════════ */

const CB_TYPES = {
  pressed:   { n:'확정 주장',   icon:'⚔',  cost:50,  desc:'전쟁으로 확정된 영토 주장', color:'#c9a227' },
  unpressed: { n:'미확정 주장', icon:'📜', cost:100, desc:'위조되거나 약한 영토 주장',  color:'#8a9a6a' },
  revenge:   { n:'복수 선포',   icon:'🩸', cost:0,   desc:'침략당한 영지 탈환 명분',    color:'#9e3535' },
};

/* ─── 명분 시스템 핵심 헬퍼
   county id 기준으로 통일. barony id가 들어와도 자동 변환.
   수정: _chaplainFabricateClaim 버그 대응              ─── */
function _normClaimId(rid){
  // barony id → county id 자동 변환
  if(COUNTIES[rid]) return rid;       // 이미 county id
  if(BARONIES[rid]) return BARONIES[rid].county || rid; // barony → county
  return rid;
}
function hasClaim(rid){
  const cid = _normClaimId(rid);
  return state.claims.find(c=>c.rid===cid);
}
function claimsForRegion(def){
  // def가 보유한 county id 목록과 명분 county id 비교
  const defCids = countiesOf(def.id);
  return state.claims.filter(c=>defCids.includes(_normClaimId(c.rid)));
}
function claimName(rid){
  const cid = _normClaimId(rid);
  return COUNTIES[cid]?.n || BARONIES[rid]?.n || rid;
}
function addClaim(rid, type){
  const cid = _normClaimId(rid); // 항상 county id로 정규화
  if(!COUNTIES[cid]){ return; }   // 실존하지 않는 county는 무시
  if(hasClaim(cid)) return;
  state.claims.push({rid:cid, type, obtained:state.year});
  log(`<b>${COUNTIES[cid].n}</b>에 대한 ${CB_TYPES[type].n}을(를) 획득했습니다.`, 'dip');
}
function removeClaim(rid){
  const cid = _normClaimId(rid);
  state.claims = state.claims.filter(c=>c.rid!==cid);
}
/* 복수 선포: 피침략 시 자동 생성 */
function grantRevengeClaim(rid){
  if(!hasClaim(rid)) addClaim(rid, 'revenge');
}
/* 명분 만료 체크 (매년) */
function claimExpirePulse(){
  state.claims = state.claims.filter(c=>{
    // 미확정 주장은 10년 후 만료
    if(c.type==='unpressed' && state.year - c.obtained > 10){
      log(`${COUNTIES[c.rid]?.n||BARONIES[c.rid]?.n||'영지'}에 대한 미확정 주장이 만료됐습니다.`, 'dip');
      return false;
    }
    return true;
  });
}

/* 선전포고 UI (명분 선택 포함) */
function openDeclareWar(defId){
  const p = playerChar();
  const def = chars[defId];
  if(!def || def.dead || !p) return;
  pause();

  if(truceBetween(p.id, def.id)){
    showModal({title:'선전포고 불가', sub:'휴전 중',
      body:`${def.name}과(와) 현재 휴전 협정이 유지되고 있습니다 (${state.truces[[p.id,def.id].sort().join('|')]}년까지).`,
      opts:[{t:'닫기'}]}); return;
  }
  if(isAllied(p.id, def.id)){
    showModal({title:'선전포고 불가', sub:'동맹국',
      body:`${def.name}은(는) 현재 동맹국입니다. 먼저 동맹을 파기하세요.`,
      opts:[{t:'동맹 파기', f:()=>{ breakAlliance(p.id,def.id); openDeclareWar(defId); }}, {t:'닫기'}]}); return;
  }

  const defCids = countiesOf(def.id);
  const myClaims = claimsForRegion(def);

  if(myClaims.length === 0){
    showModal({title:'명분 없음', sub:'선전포고 불가',
      body:`${def.name}에 대한 명분이 없습니다.

명분을 얻는 방법:
• 사제에게 교회법 명분 위조를 맡긴다
• 침략을 받아 복수 명분을 얻는다
• 전쟁 후 백색 강화로 미확정 주장을 얻는다`,
      opts:[{t:'닫기'}]}); return;
  }

  // 명분 선택 화면
  const myPow = Math.round(power(p));
  const defPow = Math.round(power(def));
  let html = `<div class="kv"><span>상대 전력</span><span>${defPow} vs 내 전력 ${myPow}</span></div>
    <div class="kv"><span>위신</span><span>${state.prestige}</span></div>
    <div style="margin:12px 0 6px;font-size:.72rem;letter-spacing:.2em;color:var(--gold-dim)">보유 명분</div>`;

  const opts = [];
  myClaims.forEach(cl=>{
    const cbInfo = CB_TYPES[cl.type];
    const canAfford = state.prestige >= cbInfo.cost;
    const rid = cl.rid;
    opts.push({
      t:`${cbInfo.icon} ${cbInfo.n} — ${claimName(rid)}`,
      d:`위신 ${cbInfo.cost} 소모 · ${COUNTIES[rid]?`병력 ${COUNTIES[rid].baronies.reduce((s,b)=>s+(BARONIES[b]?.troops||0),0)} · 민심 ${Math.round(COUNTIES[rid].baronies.reduce((s,b)=>s+(BARONIES[b]?.pop||60),0)/COUNTIES[rid].baronies.length)}`:''} ${canAfford?'':'(위신 부족)'}`,
      f: canAfford ? ()=>{
        state.prestige -= cbInfo.cost;
        // pressed → unpressed 강등 후 전쟁 성공 시 pressed로 전환
        if(cl.type==='unpressed') cl.type='pressed'; // 전쟁 사용 시 강화
        declareWar(p, def, rid);
        removeClaim(rid); // 명분 소모 (전쟁 중 사용됨)
      } : ()=>{ log('위신이 부족합니다.','dip'); }
    });
  });

  // 복수 명분이 없으면 일반 공격 명분 제안 (고비용)
  if(false){ // 무단 침공 제거됨
    const anyRid = defCids[0];
    opts.push({
      t:`💥 무단 침공 — ${COUNTIES[anyRid]?.n||anyRid}`,
      d:`명분 없는 전쟁 · 위신 -50 · 모든 관계 악화`,
      f:()=>{
        state.prestige = Math.max(0, state.prestige - 50);
        Object.values(chars).filter(k=>!k.dead&&k.ruler&&k.id!==p.id).forEach(k=>chOp(k,p,-20));
        addStress(p, 15, '명분 없는 전쟁');
        declareWar(p, def, anyRid);
      }
    });
  }

  opts.push({t:'취소'});
  showModal({title:`${def.name}에 선전포고`, sub:`${COUNTIES[defCids[0]]?.n||''} 왕국`,
    body:'', html, opts});
}


/* ═══════════════════════════════════════════════════════════
   자문회 시스템 — CK3 위키(1.19) 태스크 정확 반영
   출처: https://ck3.paradoxwikis.com/Council

   Chancellor : Foreign Affairs / Domestic Affairs / Bestow Royal Favor
   Marshal    : Organize Army / Train Commanders / Increase Control
   Steward    : Collect Taxes / Increase Development / Promote Culture
   Spymaster  : Disrupt Schemes / Support Schemes / Find Secrets
   Chaplain   : Religious Relations / Fabricate Claim / Convert Faith
   ═══════════════════════════════════════════════════════════ */
/* 태스크 변경 — 진행형이면 진행도 리셋 */
function setCouncilTask(role, taskKey){
  const prev = state.councilTasks[role];
  if(prev !== taskKey){
    if(state.councilProgress[role] !== undefined) state.councilProgress[role] = 0;
    /* fabricate_claim으로 전환 시 기존 대상 초기화 */
    if(taskKey === 'fabricate_claim'){ state.fabricateTarget = null; }
    if(prev === 'fabricate_claim' && taskKey !== 'fabricate_claim'){ state.fabricateTarget = null; }
    log(`${COUNCIL_ROLES[role].n}의 임무가 [${COUNCIL_ROLES[role].tasks[taskKey].n}](으)로 변경됩니다.`, 'dip');
  }
  state.councilTasks[role] = taskKey;
  /* CK3: fabricate_claim 선택 즉시 대상 county 지정 요구 */
  if(taskKey === 'fabricate_claim' && !state.fabricateTarget){
    renderCourt();
    _promptFabricateTarget();
  } else {
    renderCourt();
  }
}

/* fabricate_claim 대상 선택 진입 — 자문회 드롭다운에서 태스크 선택 시 호출 */
function _promptFabricateTarget(){
  const p = playerChar(); if(!p) return;
  const cid2 = state.council.chaplain;
  const chaplain = cid2 && chars[cid2] && !chars[cid2].dead ? chars[cid2] : null;
  const sk = chaplain ? stat(chaplain, 'learn') : 5;
  const adjBids = ADJ[p.region]||[];
  const adjCids = [...new Set(adjBids.map(b=>countyOf(b)).filter(Boolean))];
  const targets = adjCids.filter(cid=>{ const h=countyHolder(cid); return h&&h.id!==p.id&&!hasClaim(cid); });
  if(!targets.length){
    log('인접한 영지 중 명분 위조 가능한 곳이 없습니다. 이미 모든 명분을 보유 중이거나 인접 적이 없습니다.','dip');
    /* 대상 없으면 태스크를 religious_relations로 되돌림 */
    state.councilTasks.chaplain = 'religious_relations';
    renderCourt();
    return;
  }
  window._fabricateTargets = targets;
  window._fabricateSk = sk;
  _showFabricateTargetPicker(sk, targets, 0);
}

/* ── councilPulse — 매달 호출 ── */
/* 수치 출처: CK3 위키 https://ck3.paradoxwikis.com/Council (v1.19 검증) */
function councilPulse(){
  const p = playerChar(); if(!p||!REGIONS[p.region]) return;
  const reg = REGIONS[p.region];

  for(const role in state.council){
    const cid = state.council[role];
    if(!cid) continue;
    const c = chars[cid];
    if(!c || c.dead){ state.council[role]=null; continue; }

    const sk = stat(c, COUNCIL_ROLES[role].skill);
    const task = state.councilTasks[role] || Object.keys(COUNCIL_ROLES[role].tasks)[0];
    /* 연간 1회 이벤트 → 월 8.33% 확률(1/12) 근사 */
    const fireEvent = Math.random() < 0.0833;
    /* 위키: 스킬 >8이면 긍정 이벤트 가능, 스킬 <15면 부정 이벤트 가능 */
    const positive  = Math.random() < (0.4 + sk * 0.025);
    const canPos    = sk > 8;
    const canNeg    = sk < 15;

    /* ── 재상 (Chancellor) ── */
    if(role === 'chancellor'){
      if(task === 'foreign_affairs'){
        /* 위키: +0.05 Prestige/skill/month · +0.5 Independent Ruler Opinion/skill/month */
        state.prestige += sk * 0.05;
        /* 독립 군주 호감 +0.5/스킬/월 (실질 적용: 월 0.5*sk*0.01 cap 0.2) */
        const dipGain = Math.min(0.2, sk * 0.5 * 0.01);
        Object.values(chars).filter(k=>!k.dead&&k.ruler&&k.id!==p.id&&!k.liege).forEach(k=>{
          k.op[p.id] = Math.min(100, (k.op[p.id]||0) + dipGain);
        });
        if(fireEvent){
          const rnd = Object.values(chars).find(k=>!k.dead&&k.ruler&&k.id!==p.id&&!k.liege);
          if(positive && canPos && rnd){
            /* 긍정 이벤트: Shorten Truce — 위신 소폭 추가, 군주 호감 +sk*0.5 */
            const opGain = Math.round(sk * 0.5);
            chOp(rnd, p, opGain);
            popup({title:'재상의 외교 성과', sub:`${c.name}의 보고`,
              body:`${c.name}이(가) ${rnd.name}과(와)의 신뢰를 쌓았습니다.\n「각국 군주들의 시선이 우호적으로 바뀌고 있습니다, 전하.」\n${rnd.name} 호감 +${opGain}`,
              opts:[{t:'수고했다', f:()=>chOp(c,p,5)}]});
          } else if(canNeg){
            /* 부정 이벤트: Neighbor Opinion Loss */
            state.prestige = Math.max(0, state.prestige - 10);
            const rndNeg = Object.values(chars).find(k=>!k.dead&&k.ruler&&k.id!==p.id);
            if(rndNeg) chOp(rndNeg, p, -Math.round(sk * 0.3));
            popup({title:'재상의 외교 실언', sub:`${c.name}의 보고`,
              body:`${c.name}이(가) 외교 교섭에서 실언을 저질렀습니다.\n위신 -10`,
              opts:[{t:'질책한다', f:()=>{chOp(c,p,-10); addStress(p,5,'재상의 실책');}}]});
          }
        }
      } else if(task === 'domestic_affairs'){
        /* 위키: +0.5 Direct Vassal Opinion/skill/month (+0.2/month until max)
                 +1% Tyranny Loss/skill (폭정은 미구현이므로 봉신 호감으로 근사) */
        const vasGain = Math.min(0.2, sk * 0.5 * 0.01);
        for(const v of vassalsOf(p.id)){
          v.op[p.id] = Math.min(100, (v.op[p.id]||0) + vasGain);
        }
        if(fireEvent && positive && canPos){
          /* 긍정 이벤트: Increase Vassal Opinion */
          const v = vassalsOf(p.id)[Math.floor(Math.random()*Math.max(1,vassalsOf(p.id).length))];
          if(v){ const gain=Math.round(sk*0.5); chOp(v, p, gain);
            popup({title:'봉신 화합', sub:`${c.name}의 보고`,
              body:`${c.name}이(가) ${v.name}과(와)의 갈등을 중재했습니다.\n${v.name} 호감 +${gain}`,
              opts:[{t:'잘 됐다', f:()=>chOp(c,p,5)}]}); }
        } else if(fireEvent && canNeg){
          /* 부정 이벤트: Lowered Vassal Opinion */
          const v = vassalsOf(p.id)[0];
          if(v){ const loss=Math.round(sk*0.2); chOp(v,p,-loss);
            popup({title:'봉신 불만', sub:`${c.name}의 보고`,
              body:`${c.name}이(가) 봉신 관리에 실패해 불만이 커지고 있습니다.\n${v.name} 호감 -${loss}`,
              opts:[{t:'직접 나선다', f:()=>{chOp(v,p,5); addStress(p,5,'봉신 관리의 부담');}}]}); }
        }
      } else if(task === 'bestow_favor'){
        /* 위키: +0.5 Vassal Prestige · +0.02 Prestige/skill/month · +0.5 Vassal Opinion/skill/month */
        state.prestige += sk * 0.02;
        const vasGain2 = Math.min(0.2, sk * 0.5 * 0.01);
        for(const v of vassalsOf(p.id)){
          v.op[p.id] = Math.min(100, (v.op[p.id]||0) + vasGain2);
        }
        if(fireEvent && positive && canPos){
          /* 긍정 이벤트: Increase Vassal Opinion */
          const vs = vassalsOf(p.id);
          const v = vs[Math.floor(Math.random()*Math.max(1,vs.length))];
          if(v){ const gain=Math.round(sk*0.5); chOp(v,p,gain);
            popup({title:'왕실 은총 효과', sub:`${c.name}의 보고`,
              body:`${c.name}이(가) ${v.name}에게 왕실의 총애를 전달했습니다.\n${v.name} 호감 +${gain}`,
              opts:[{t:'좋은 일이다', f:()=>chOp(c,p,5)}]}); }
        } else if(fireEvent && canNeg){
          const vs = vassalsOf(p.id);
          const v = vs[0];
          if(v){ chOp(v,p,-Math.round(sk*0.2));
            popup({title:'은총 반발', sub:`${c.name}의 보고`,
              body:`편향된 은총 분배로 일부 봉신의 불만이 높아졌습니다.`,
              opts:[{t:'고르게 배분하라', f:()=>addStress(p,3,'봉신 관리의 부담')}]}); }
        }
      }
    }

    /* ── 원수 (Marshal) ── */
    else if(role === 'marshal'){
      if(task === 'organize_army'){
        /* 위키: -1% Maintenance/skill · +2% Levy Reinforcement/skill · +2% Garrison/skill
           근사 구현: 병력 자연회복 보너스 +sk*0.6 (레비 보충 +2%/스킬 ≈ 매달 병력 상승) */
        reg.troops = Math.min(reg.cap, reg.troops + Math.round(sk * 0.6));
        /* 수비대 +2%/스킬: 병력 상한 소폭 영구 반영 (1회 최대 한도 내) */
        reg.cap = Math.min(2000, (reg.cap||300) + Math.round(sk * 0.02));
        if(fireEvent){
          if(positive && canPos){
            /* 긍정: Increased Military Presence — 병력 추가 */
            const extra = Math.round(sk * 3);
            popup({title:'군대 조직 성과', sub:`${c.name}의 보고`,
              body:`${c.name}이(가) 병력 재편성에 성공했습니다.\n「부대 기강이 잡혔습니다, 전하.」\n병력 +${extra}`,
              opts:[{t:'격려한다', f:()=>{reg.troops=Math.min(reg.cap,reg.troops+extra); chOp(c,p,5); log(`병력 +${extra}.`,'war');}}]});
          } else if(canNeg){
            /* 부정: Levy Desertion */
            const loss = Math.round((15-sk)*4);
            reg.troops = Math.max(100, reg.troops - loss);
            popup({title:'훈련 중 탈영', sub:`${c.name}의 보고`,
              body:`가혹한 훈련에 병사들이 이탈했습니다.\n병력 -${loss}`,
              opts:[{t:'어쩔 수 없다', f:()=>addStress(p,5,'병사 손실')}]});
          }
        }
      } else if(task === 'train_commanders'){
        /* 위키: +1% Knight Effectiveness/skill/month · +1% MaA Damage/skill/month
                 +0.5%/month chance to improve Commander per skill
           근사: 병력 효율 누적 (+0.4/sk) + 이벤트로 병력 상한 향상 */
        reg.troops = Math.min(reg.cap, reg.troops + Math.round(sk * 0.4));
        /* 위키: 0.5%×sk/월 확률로 지휘관 개선 이벤트 */
        if(Math.random() < sk * 0.005 || fireEvent){
          if(positive && canPos){
            popup({title:'지휘관 성장', sub:`${c.name}의 보고`,
              body:`${c.name}이(가) 유망한 지휘관을 발굴했습니다.\n「새 전사가 전하의 군기 아래 섰습니다.」\n병력 상한 +30`,
              opts:[{t:'훌륭하다', f:()=>{chOp(c,p,8); reg.cap=Math.min(2000,reg.cap+30); reg.troops=Math.min(reg.cap,reg.troops+30);}}]});
          } else if(canNeg && fireEvent){
            popup({title:'지휘관 부상', sub:`${c.name}의 보고`,
              body:`훈련 중 유망한 지휘관이 부상을 입었습니다.\n다음 훈련까지 전력이 감소합니다.`,
              opts:[{t:'위로한다', f:()=>{addStress(p,3,'인재 손실'); reg.troops=Math.max(50,reg.troops-20);}}]});
          }
        }
      } else if(task === 'increase_control'){
        /* 위키: +0.2% Monthly chance to remove County Corruption/skill
                 County cannot gain Corruption
           근사: 민심 부패 제거 → pop 소폭 회복 (0.2%×sk/월 확률로 pop+2) */
        if(Math.random() < sk * 0.002){
          reg.pop = Math.min(100, (reg.pop||60) + 2);
        }
        if(fireEvent && positive && canPos){
          /* 긍정: Baron Opinion Increase — 민심 +8 */
          popup({title:'영지 안정화', sub:`${c.name}의 보고`,
            body:`${c.name}이(가) 직할령의 질서를 회복했습니다.\n「반란의 씨앗이 뽑혔습니다, 전하.」\n민심 +8`,
            opts:[{t:'수고했다', f:()=>{reg.pop=Math.min(100,(reg.pop||60)+8); chOp(c,p,5);}}]});
        } else if(fireEvent && canNeg){
          /* 부정: Lose County Opinion */
          popup({title:'영지 마찰', sub:`${c.name}의 보고`,
            body:`강압적 통제로 백성들의 반감을 샀습니다.\n민심 -5`,
            opts:[{t:'방식을 바꾸게 한다', f:()=>{reg.pop=Math.max(0,(reg.pop||60)-5); chOp(c,p,-5);}}]});
        }
      }
    }

    /* ── 재무관 (Steward) ── */
    else if(role === 'steward'){
      if(task === 'collect_taxes'){
        /* 위키: +0.5% Domain Taxes/skill/month
           직할 남작령 수 × sk × 0.5% 근사 → 월 gold 증가 */
        const myBids = regionsOf(p.id);
        const taxBonus = Math.round(myBids.length * sk * 0.5 * 0.01 * 10); // ×10 스케일 조정
        reg.gold = Math.min(3500, (reg.gold||0) + taxBonus);
        if(fireEvent){
          if(positive && canPos){
            /* 긍정: Extra Taxes */
            const bonus = Math.round(20 + sk * 3);
            popup({title:'세금 성과', sub:`${c.name}의 보고`,
              body:`${c.name}이(가) 효율적인 징수로 금고를 채웠습니다.\n금 +${bonus}`,
              opts:[{t:'수고했다', f:()=>{reg.gold=Math.min(3500,reg.gold+bonus); chOp(c,p,5); log(`재무관 추가 징수 +${bonus}금.`,'good');}}]});
          } else if(canNeg){
            /* 부정: County Corruption — 금 손실, 민심 -3 */
            reg.gold=Math.max(0,reg.gold-40); reg.pop=Math.max(0,(reg.pop||60)-3);
            popup({title:'세금 마찰', sub:`${c.name}의 보고`,
              body:`강압적 징수에 백성들이 반발합니다.\n금 -40 · 민심 -3`,
              opts:[{t:'완화한다', f:()=>{reg.gold=Math.max(0,reg.gold-15); reg.pop=Math.min(100,(reg.pop||60)+5); chOp(c,p,-5);}}]});
          }
        }
      } else if(task === 'increase_development'){
        /* 위키: -1% Construction Time/skill · +0.175 Development Growth/skill/month
                 At 100% → Development +1 (민심 +3, cap +20으로 근사) */
        const rate = sk * 0.175;
        state.councilProgress.steward = Math.min(100, (state.councilProgress.steward||0) + rate);
        if(state.councilProgress.steward >= 100){
          state.councilProgress.steward = 0;
          reg.pop = Math.min(100,(reg.pop||60)+3); reg.cap=(reg.cap||300)+20;
          log(`재무관의 영지 개발 완료! 민심 +3 · 병력 상한 +20`, 'good');
          if(canPos) popup({title:'영지 개발 완료', sub:`${c.name}의 보고`,
            body:`영지 개발이 완료됐습니다!\n민심 +3 · 병력 상한 +20`,
            opts:[{t:'훌륭하다', f:()=>chOp(c,p,10)}]});
        } else if(fireEvent && canNeg){
          /* 부정: Slow Construction */
          popup({title:'개발 지연', sub:`${c.name}의 보고`,
            body:`개발 사업이 예상치 못한 문제로 지연되고 있습니다.\n(현재 진행: ${Math.round(state.councilProgress.steward)}%)`,
            opts:[{t:'추가 지원 (금 -20)', f:()=>{
              if(reg.gold>=20){ reg.gold=Math.max(0,reg.gold-20); state.councilProgress.steward=Math.min(100,state.councilProgress.steward+5); }
              else log('금이 부족합니다.','dip');
            }}]});
        }
      } else if(task === 'promote_culture'){
        /* 위키: (0.25 + skill÷20)%/month 진행 → 100%: 문화 전환 */
        const rate2 = 0.25 + sk/20;
        state.councilProgress.steward = Math.min(100, (state.councilProgress.steward||0) + rate2);
        if(state.councilProgress.steward >= 100){
          state.councilProgress.steward = 0;
          state.prestige += 15;
          log(`재무관의 문화 진흥 완료! 위신 +15`, 'good');
        }
        if(fireEvent && positive && canPos){
          /* 긍정: Increased Levies */
          reg.troops=Math.min(reg.cap,(reg.troops||0)+Math.round(sk*2));
          reg.pop=Math.min(100,(reg.pop||60)+3);
        } else if(fireEvent && canNeg){
          /* 부정: Resistance to Settlers */
          popup({title:'문화 저항', sub:`${c.name}의 보고`,
            body:'일부 백성들이 문화 진흥 정책에 완강히 반발합니다.',
            opts:[{t:'설득한다 (금 -15)', f:()=>{ if(reg.gold>=15) reg.gold=Math.max(0,reg.gold-15); }},
                  {t:'강행한다', f:()=>{ reg.pop=Math.max(0,(reg.pop||60)-5); addStress(p,3,'민심 억압'); }}]});
        }
      }
    }

    /* ── 첩보관 (Spymaster) ── */
    else if(role === 'spymaster'){
      if(task === 'disrupt_schemes'){
        /* 위키: +5days base Enemy Scheme Phase Length · +0.5days/skill · +1% Discovery/skill
           근사: 각 적 모략에 방어 보너스 부여, schemePulse에서 적용 */
        state.schemes.forEach(s=>{
          if(s.target===p.id){
            s.defBonus=(s.defBonus||0) + 5 + sk*0.5; // days 단위 방어 가산
            s.discoverBonus=(s.discoverBonus||0) + sk*0.01; // 발각률 가산
          }
        });
        if(fireEvent){
          if(positive && canPos){
            /* 긍정: Hostile Scheme Disrupted */
            const enemy=Object.values(chars).find(k=>!k.dead&&k.ruler&&k.id!==p.id&&state.schemes.some(s=>s.plotter===k.id&&s.target===p.id));
            if(enemy){
              state.schemes=state.schemes.filter(s=>!(s.plotter===enemy.id&&s.target===p.id));
              popup({title:'모략 분쇄', sub:`${c.name}의 보고`,
                body:`${c.name}이(가) ${enemy.name}의 음모를 완전히 봉쇄했습니다.\n「그림자 속의 칼날을 찾아냈습니다, 전하.」`,
                opts:[{t:'잘 했다', f:()=>{chOp(c,p,10); addStress(p,-5,'위기 모면');}}]});
            } else {
              state.prestige+=Math.round(sk*0.3);
              log(`${c.name}이(가) 유용한 정보를 수집했습니다.`,'dip');
            }
          } else if(canNeg){
            /* 부정: Your Secret Revealed */
            popup({title:'정보 유출', sub:`${c.name}의 보고`,
              body:`밀정 하나가 이중첩자임이 드러났습니다. 기밀이 유출됐을 수 있습니다.`,
              opts:[{t:'엄중히 처리', f:()=>{addStress(p,10,'배신의 충격'); chOp(c,p,-15);}}]});
          }
        }
      } else if(task === 'support_schemes'){
        /* 위키: -1days Scheme Phase/skill · +5% base Success · +0.5%/skill
           근사: 아군 모략 progress 가속 */
        state.schemes.forEach(s=>{
          if(s.plotter===p.id){
            s.progress=(s.progress||0)+Math.round(sk*0.5);
            s.successBonus=(s.successBonus||0) + 0.005 + sk*0.005; // +0.5%+0.5%/sk 추가 성공률
          }
        });
        if(fireEvent && positive && canPos){
          /* 긍정: Secret Discovered */
          const s=state.schemes.find(x=>x.plotter===p.id);
          if(s){ s.progress+=10; log(`${c.name}이(가) 공작 진행을 앞당겼습니다.`,'dip'); }
          else {
            const tgt=Object.values(chars).find(k=>!k.dead&&k.ruler&&k.id!==p.id);
            if(tgt) log(`${c.name}이(가) ${tgt.name}에 관한 정보를 수집했습니다.`,'dip');
          }
        } else if(fireEvent && canNeg){
          /* 부정: Scheme Failure / Loss of Prestige */
          state.prestige=Math.max(0,state.prestige-5);
          popup({title:'공작 차질', sub:`${c.name}의 보고`,
            body:`지원 공작이 발각 위험에 처했습니다.\n위신 -5`,
            opts:[{t:'일시 중단', f:()=>addStress(p,5,'공작 차질')}]});
        }
      } else if(task === 'find_secrets'){
        /* 위키: +5% Chance to discover Secret per skill
           근사: 월 5%×sk 확률로 비밀 발견 이벤트 */
        const secretChance = sk * 0.05 * 0.01; // 월 확률로 변환
        if(Math.random() < secretChance && positive && canPos){
          const tgt=Object.values(chars).find(k=>!k.dead&&k.ruler&&k.id!==p.id);
          if(tgt){
            chOp(tgt,p,-15);
            popup({title:'비밀 발견', sub:`${c.name}의 보고`,
              body:`${c.name}이(가) ${tgt.name}의 비밀을 알아냈습니다.\n「이것은 귀중한 패입니다, 전하.」\n위신 +5`,
              opts:[{t:'잘 보관한다', f:()=>{chOp(c,p,8); state.prestige+=5;}}]});
          }
        } else if(fireEvent && canNeg){
          /* 부정: Find Secrets Discovered */
          popup({title:'첩보 역탐지', sub:`${c.name}의 보고`,
            body:`${c.name}의 비밀 탐문이 역으로 탐지됐습니다.\n위신 -5`,
            opts:[{t:'활동을 중단한다', f:()=>{state.prestige=Math.max(0,state.prestige-5); chOp(c,p,-5);}}]});
        }
      }
    }

    /* ── 사제 (Court Chaplain) ── */
    else if(role === 'chaplain'){
      if(task === 'religious_relations'){
        /* 위키: +0.05 Monthly Piety/skill · +0.5 Same Faith Ruler Opinion/skill (+0.35/month until max)
           경건은 위신으로 근사, 동일신앙 군주 호감 → 독립 군주 전체 호감 소폭 상승 */
        state.prestige += sk * 0.05;
        const faithGain = Math.min(0.35, sk * 0.5 * 0.01);
        Object.values(chars).filter(k=>!k.dead&&k.ruler&&k.id!==p.id).forEach(k=>{
          k.op[p.id] = Math.min(100, (k.op[p.id]||0) + faithGain * 0.3); // 동일신앙 근사
        });
        reg.pop = Math.min(100, (reg.pop||60) + sk * 0.05); // 민심 보조
        if(fireEvent){
          if(positive && canPos){
            /* 긍정: Increase Vassal Opinion */
            popup({title:'사제의 설교', sub:`${c.name}의 보고`,
              body:`${c.name}이(가) 감동적인 설교로 민심을 하나로 모았습니다.\n「전하의 이름으로 기도하는 목소리가 들립니다.」\n민심 +8 · 위신 +5`,
              opts:[{t:'좋은 일이다', f:()=>{reg.pop=Math.min(100,(reg.pop||60)+8); state.prestige+=5; addStress(p,-8,'백성의 사랑');}}]});
          } else if(canNeg){
            /* 부정: Loss of Piety / Loss of Vassal Opinion */
            reg.pop=Math.max(0,(reg.pop||60)-5);
            popup({title:'종교 갈등', sub:`${c.name}의 보고`,
              body:`설교에서 불필요한 발언을 해 백성들이 반발합니다.\n민심 -5`,
              opts:[{t:'자중하라 경고', f:()=>{chOp(c,p,-10); reg.pop=Math.min(100,(reg.pop||60)+3);}}]});
          }
        }
      } else if(task === 'fabricate_claim'){
        /* CK3: 대상 county 지정 없으면 진행 안 함 */
        if(!state.fabricateTarget){
          /* 대상 미지정 상태 — 자문회 패널에서 선택 유도 */
        } else {
          /* 위키: (3 + skill÷5)%/month 진행 → 100%: 미행사 명분 획득 */
          const rate3 = 3 + sk/5;
          state.councilProgress.chaplain = Math.min(100, (state.councilProgress.chaplain||0) + rate3);
          if(state.councilProgress.chaplain >= 100){
            state.councilProgress.chaplain = 0;
            /* 완료: 지정된 county에 명분 획득 */
            const tgtCid = state.fabricateTarget;
            const tgtHolder = countyHolder(tgtCid);
            state.fabricateTarget = null; // 완료 후 초기화
            _doFabricateClaim(sk, tgtCid, tgtHolder);
          } else if(fireEvent && canNeg){
            /* 부정: Loss of Piety / Upset Target */
            state.prestige=Math.max(0,state.prestige-8);
            const tgtHolder2 = countyHolder(state.fabricateTarget);
            if(tgtHolder2) chOp(tgtHolder2, p, -10);
            popup({title:'명분 위조 발각', sub:`${c.name}의 보고`,
              body:`${c.name}의 문서 조작이 인근 주교에게 발각됐습니다.\n위신 -8 · ${COUNTIES[state.fabricateTarget]?.n||''} 지배자 관계 악화`,
              opts:[{t:'수습한다', f:()=>{reg.gold=Math.max(0,reg.gold-30); chOp(c,p,-10);}}]});
          }
        }
      } else if(task === 'convert_faith'){
        /* 위키: (0.5 + skill÷10)%/month 진행 → 100%: 지역 문화 전환 */
        const rate4 = 0.5 + sk/10;
        state.councilProgress.chaplain = Math.min(100, (state.councilProgress.chaplain||0) + rate4);
        if(state.councilProgress.chaplain >= 100){
          state.councilProgress.chaplain = 0;
          /* 위키: Increase County Development / Increase County Levies */
          reg.pop=Math.min(100,(reg.pop||60)+5);
          reg.troops=Math.min(reg.cap,(reg.troops||0)+Math.round(sk*2));
          state.prestige+=10;
          log(`${c.name}이(가) 영지 일대의 신앙을 통일했습니다! 위신 +10 · 민심 +5`, 'good');
        }
        if(fireEvent && positive && canPos){
          /* 긍정: Increase County Opinion */
          reg.pop=Math.min(100,(reg.pop||60)+4);
        } else if(fireEvent && canNeg){
          /* 부정: Loss of County Opinion / Resistance to Conversion */
          popup({title:'개종 저항', sub:`${c.name}의 보고`,
            body:'일부 주민들이 신앙 개종에 격렬히 저항합니다.',
            opts:[
              {t:'강제한다', f:()=>{reg.pop=Math.max(0,(reg.pop||60)-8); state.prestige+=3;}},
              {t:'설득으로 전환', f:()=>state.councilProgress.chaplain=Math.max(0,state.councilProgress.chaplain-10)},
            ]});
        }
      }
    }
  }
}

/* 사제 명분 위조 완료 처리 */
/* 사제 명분 위조 완료 — 대상 선택 UI 표시
   수정: ADJ는 barony id → county id로 변환하여 addClaim에 전달
   (addClaim/claimsForRegion 모두 county id 기준으로 통일)           */
function _chaplainFabricateClaim(sk){
  const p = playerChar(); if(!p) return;
  // ADJ[p.region]: 인접 barony ids → 각각의 county id로 변환, 중복 제거
  const adjBids = ADJ[p.region]||[];
  const adjCids = [...new Set(adjBids.map(bid=>countyOf(bid)).filter(Boolean))];
  // 대상 후보: 적 소유, 아직 명분 없는 county만
  const targets = adjCids.filter(cid=>{
    const holder = countyHolder(cid);
    return holder && holder.id!==p.id && !hasClaim(cid);
  });
  if(!targets.length){
    popup({title:'명분 위조 불가', sub:'사제의 보고',
      body:'인접한 영지 중 명분을 위조할 수 있는 곳이 없습니다.\n이미 모든 인접 영지에 명분이 있거나, 적이 없습니다.',
      opts:[{t:'알겠다'}]});
    return;
  }
  // 대상 선택 UI
  _showFabricateTargetPicker(sk, targets, 0);
}

/* 명분 위조 대상 선택 모달 (CK3: 태스크 시작 시 county 지정)
   선택 확정 시 state.fabricateTarget 세팅 → 이후 매달 자동 진행 */
function _showFabricateTargetPicker(sk, targets, idx){
  const p = playerChar();
  const cid = targets[idx];
  const holder = countyHolder(cid);
  const cname = COUNTIES[cid]?.n || cid;
  const holderName = holder?.name || '—';
  const cBids = COUNTIES[cid]?.baronies||[];
  const totalTroops = cBids.reduce((s,b)=>s+(BARONIES[b]?.troops||0),0);
  const pop = cBids.length ? Math.round(cBids.reduce((s,b)=>s+(BARONIES[b]?.pop||60),0)/cBids.length) : 60;
  /* 월 진행 속도 (3+sk/5)%/월 — 완료까지 예상 개월 */
  const monthlyRate = 3 + sk/5;
  const monthsEst = Math.ceil(100 / monthlyRate);
  const isCurrent = state.fabricateTarget === cid;

  const infoHTML = `
    <div style="background:#1a1408;border:1px solid var(--line);border-radius:4px;padding:8px 10px;margin:6px 0">
      <div style="display:flex;align-items:center;gap:6px">
        <div style="flex:1">
          <div style="font-size:.88rem;color:var(--gold);font-weight:600">${cname}${isCurrent?' <span style="color:#c9a227;font-size:.7rem">▶ 진행 중</span>':''}</div>
          <div style="font-size:.72rem;color:var(--parch);margin-top:4px">
            <span>지배자: ${holderName}</span>
            <span style="margin-left:8px">병력: ${totalTroops}</span>
            <span style="margin-left:8px">민심: ${pop}</span>
          </div>
          <div style="font-size:.7rem;color:#7aaa6a;margin-top:3px">
            진행 속도: ${monthlyRate.toFixed(1)}%/월 · 예상 ${monthsEst}개월
          </div>
        </div>
      </div>
    </div>`;

  const opts = [];
  if(!isCurrent){
    opts.push({
      t: `📜 ${cname}으로 위조 시작`,
      d: `월 ${monthlyRate.toFixed(1)}% 진행 · 완료 시 명분 획득`,
      f: ()=>{
        /* 대상 변경 시 진행도 초기화 (CK3 동일) */
        if(state.fabricateTarget && state.fabricateTarget !== cid){
          state.councilProgress.chaplain = 0;
          log(`명분 위조 대상을 ${COUNTIES[cid]?.n||cid}으로 변경했습니다. 진행도가 초기화됩니다.`, 'dip');
        }
        state.fabricateTarget = cid;
        log(`사제가 <b>${cname}</b>에 대한 교회법 명분 위조를 시작합니다.`, 'dip');
        renderCourt();
      }
    });
  } else {
    opts.push({
      t: `⏸ 위조 중단 (${cname})`,
      d: '진행도 유지 · 나중에 재개 가능',
      f: ()=>{
        state.fabricateTarget = null;
        log(`${cname} 명분 위조를 중단했습니다.`, 'dip');
        renderCourt();
      }
    });
  }
  if(targets.length > 1){
    opts.push({
      t: `다음 후보 (${idx+1}/${targets.length})`,
      f: ()=> _showFabricateTargetPicker(sk, targets, (idx+1) % targets.length)
    });
  }
  opts.push({t:'닫기'});

  showModal({
    title:'명분 위조 대상 선택', sub:'사제의 보고',
    body:'어느 영지에 교회법 명분을 위조하시겠습니까?',
    html: infoHTML, opts
  });
}

/* 명분 위조 실행 */
function _doFabricateClaim(sk, cid, holder){
  const p = playerChar();
  const cname = COUNTIES[cid]?.n || cid;
  if(Math.random() < 0.3 + sk*0.05){
    addClaim(cid, 'unpressed'); // county id로 저장
    popup({title:'교회법 명분 확보', sub:'사제의 보고',
      body:`사제가 교회 문서를 검토해 <b>${cname}</b>에 대한 교회법적 주장을 찾아냈습니다.\n「고문서에 선대의 헌납 기록이 있습니다, 전하.」`,
      opts:[{t:'잘 했다', f:()=>addStress(p,-3,'명분 획득의 안도')}]});
  } else {
    if(holder) chOp(holder, p, -20);
    state.prestige = Math.max(0, state.prestige-10);
    popup({title:'명분 위조 발각', sub:'사제의 보고',
      body:`${cname}에 대한 교회법 명분 위조가 발각됐습니다.\n위신 -10`,
      opts:[{t:'어쩔 수 없다', f:()=>addStress(p,10,'위조 발각')}]});
  }
}

/* 자문회 UI 렌더 (궁정 패널) */
function renderCourt(){
  const p=playerChar(); if(!p) return;
  const fam=Object.values(chars).filter(c=>!c.dead&&(c.id===p.id||c.spouse===p.id||c.father===p.id||c.mother===p.id||c.courtOf===p.region));
  const reg=REGIONS[p.region]; const rn=reg?reg.n:'—';

  let html=`<div style="font-size:.7rem;letter-spacing:.2em;color:var(--gold-dim);margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--line)">자문회</div>`;

  for(const role in COUNCIL_ROLES){
    const rinfo=COUNCIL_ROLES[role];
    const cid=state.council[role];
    const councilor=cid&&chars[cid]&&!chars[cid].dead?chars[cid]:null;
    if(!councilor&&cid) state.council[role]=null;

    const curTask = state.councilTasks[role]||Object.keys(rinfo.tasks)[0];
    const taskInfo = rinfo.tasks[curTask];
    const assignedIds=Object.values(state.council).filter(Boolean);
    const candidates=fam.filter(c=>c.id!==p.id&&c.courtOf===p.region&&age(c)>=16&&!assignedIds.includes(c.id));

    html+=`<div style="padding:7px 0;border-bottom:1px dotted #2c2316">
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:1.1rem;width:22px;text-align:center">${rinfo.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:.82rem;color:var(--parch);font-weight:600">${rinfo.n}</div>`;

    if(councilor){
      const sk=stat(councilor,rinfo.skill);
      const op=opinion(councilor,p);
      const opColor=op>=0?'#7a9a6a':'#9e5a5a';
      html+=`<div style="font-size:.75rem;color:var(--gold);margin-top:1px">${councilor.name}
        <span style="color:var(--parch-dim);font-size:.68rem"> ${rinfo.skill.toUpperCase()}${sk}</span>
        <span style="color:${opColor};font-size:.65rem"> 호감 ${op>0?'+':''}${op}</span></div>`;

      /* 태스크 드롭다운 */
      html+=`<div style="margin-top:4px;display:flex;align-items:center;gap:4px">
        <span style="font-size:.65rem;color:var(--parch-dim)">임무:</span>
        <select style="background:#191309;color:var(--parch);border:1px solid var(--line);font-size:.68rem;padding:1px 3px;flex:1;max-width:150px"
          onchange="setCouncilTask('${role}',this.value)">`;
      for(const tk in rinfo.tasks){
        html+=`<option value="${tk}"${tk===curTask?' selected':''}>${rinfo.tasks[tk].n}</option>`;
      }
      html+=`</select></div>`;

      /* 현재 임무 설명 */
      html+=`<div style="font-size:.65rem;color:#7aaa8a;margin-top:2px">▶ ${taskInfo.desc}</div>`;

      /* 진행형 태스크 프로그레스 바 */
      if(taskInfo.progressive){
        /* fabricate_claim: CK3 방식 — 대상 county 지정 후 진행 */
        if(curTask==='fabricate_claim'){
          const p2=playerChar();
          const adjBids2=(ADJ[p2.region]||[]);
          const adjCids2=[...new Set(adjBids2.map(b=>countyOf(b)).filter(Boolean))];
          const availCids=adjCids2.filter(cid2=>{ const h=countyHolder(cid2); return h&&h.id!==p2.id&&!hasClaim(cid2); });
          window._fabricateTargets=availCids;
          window._fabricateSk=councilor?stat(councilor,rinfo.skill):5;
          if(state.fabricateTarget && COUNTIES[state.fabricateTarget]){
            /* 대상 지정됨 — 진행도 + 대상 정보 표시 */
            const tCname = COUNTIES[state.fabricateTarget].n;
            const tHolder = countyHolder(state.fabricateTarget);
            const prog=Math.round(state.councilProgress[role]||0);
            html+=`<div style="margin-top:4px;background:#12100a;border:1px solid #2c2316;border-radius:3px;padding:5px 7px">
              <div style="font-size:.68rem;color:var(--gold)">📜 위조 대상: <b>${tCname}</b>
                <span style="color:var(--parch-dim);font-weight:400"> (${tHolder?.name||'—'})</span></div>
              <div style="margin-top:4px;background:#1a140a;border-radius:2px;height:5px;overflow:hidden">
                <div style="background:var(--gold);height:100%;width:${prog}%"></div></div>
              <div style="display:flex;justify-content:space-between;margin-top:2px">
                <span style="font-size:.6rem;color:var(--parch-dim)">진행: ${prog}%</span>
                <span style="font-size:.6rem;color:var(--parch-dim)">완료까지 약 ${Math.ceil((100-prog)/(3+stat(councilor,'learn')/5))}개월</span>
              </div>
            </div>`;
            html+=`<button class="p-action" style="margin-top:3px;padding:2px 8px;font-size:.63rem"
              onclick="pause();_showFabricateTargetPicker(window._fabricateSk,window._fabricateTargets,0)">
              대상 변경</button>`;
          } else {
            /* 대상 미지정 — 선택 유도 */
            html+=`<div style="margin-top:4px;background:#1a100a;border:1px solid #6a3a1a;border-radius:3px;padding:5px 7px;font-size:.68rem;color:#c97a3a">
              ⚠ 위조할 영지를 선택하세요</div>`;
            if(availCids.length){
              html+=`<button class="p-action" style="margin-top:3px;padding:2px 8px;font-size:.65rem;background:#3a1a0a;border-color:#c97a3a"
                onclick="pause();_showFabricateTargetPicker(window._fabricateSk,window._fabricateTargets,0)">
                📜 영지 선택 (${availCids.length}곳)</button>`;
            } else {
              html+=`<div style="font-size:.63rem;color:#5a4a3a;margin-top:2px">인접 명분 위조 가능 영지 없음</div>`;
            }
          }
        } else {
          /* 다른 progressive 태스크 (develop, culture, convert) — 기존 진행바 */
          const prog=Math.round(state.councilProgress[role]||0);
          html+=`<div style="margin-top:3px;background:#1a140a;border-radius:2px;height:5px;width:100%;overflow:hidden">
            <div style="background:var(--gold);height:100%;width:${prog}%"></div></div>
            <div style="font-size:.62rem;color:var(--parch-dim);text-align:right">${prog}%</div>`;
        }
      }

      html+=`<button class="p-action" style="margin-top:4px;padding:2px 8px;font-size:.68rem" onclick="appointCouncilor('${role}',null)">해임</button>`;
    } else {
      html+=`<div style="font-size:.72rem;color:var(--parch-dim);margin-top:2px">공석 — ${rinfo.desc}</div>`;
      if(candidates.length){
        html+=`<select style="background:#191309;color:var(--parch);border:1px solid var(--line);font-size:.7rem;padding:2px 4px;max-width:160px;margin-top:4px"
          onchange="if(this.value)appointCouncilor('${role}',this.value)">
          <option value="">임명...</option>`;
        candidates.sort((a,b)=>stat(b,rinfo.skill)-stat(a,rinfo.skill)).forEach(c=>{
          html+=`<option value="${c.id}">${c.name} (${rinfo.skill.slice(0,1).toUpperCase()}${stat(c,rinfo.skill)})</option>`;
        });
        html+=`</select>`;
      } else {
        html+=`<div style="font-size:.68rem;color:#5a4a3a;margin-top:3px">임명 가능한 인물 없음</div>`;
      }
    }
    html+=`</div></div></div>`;
  }

  /* 봉신 목록 */
  const myVassals=vassalsOf(p.id);
  if(myVassals.length>0){
    html+=`<div style="font-size:.7rem;letter-spacing:.2em;color:var(--gold-dim);margin:10px 0 8px;padding-bottom:5px;border-bottom:1px solid var(--line)">봉신 (${myVassals.length}명)</div>`;
    for(const v of myVassals){
      const vcids=directCountiesOf(v.id);
      const vOp=opinion(v,p);
      const opColor=vOp>=0?'#7a9a6a':'#9e5a5a';
      html+=`<div style="display:flex;justify-content:space-between;font-size:.8rem;padding:5px 0;border-bottom:1px dotted #2c2316">
        <span><b>${v.name}</b><span style="color:var(--parch-dim);font-size:.72rem"> — ${vcids.map(cid=>COUNTIES[cid].n).join('·')}</span></span>
        <span style="color:${opColor}">호감 ${vOp>0?'+':''}${vOp}</span>
      </div>`;
    }
    html+=`<div style="height:8px"></div>`;
  }

  /* 직할령 현황 */
  const dLim=domainLimit(p), dDir=directCountiesOf(p.id).length;
  html+=`<div style="font-size:.7rem;letter-spacing:.2em;color:var(--gold-dim);margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid var(--line)">직할 백작령 ${dDir}/${dLim}${dDir>dLim?' ⚠ 한도 초과':''}</div>`;
  html+=`<div style="font-size:.72rem;color:var(--parch-dim);padding:3px 0 8px;border-bottom:1px solid var(--line)">🗺 건물 건설은 지도에서 내 백작령을 클릭하세요.</div>`;

  /* 궁정 인물 목록 */
  html+=`<div style="font-size:.7rem;letter-spacing:.2em;color:var(--gold-dim);margin:12px 0 8px;padding-bottom:6px;border-bottom:1px solid var(--line)">${rn} 궁정의 사람들</div>
    <table style="width:100%;border-collapse:collapse;font-size:.82rem">`;
  for(const c of fam){
    const rel=c.id===p.id?'본인':c.spouse===p.id?'배우자':(c.father===p.id||c.mother===p.id)?(c.sex==='m'?'아들':'딸'):'궁정인';
    const eduTxt=c.edu!==null?EDU_NAMES[c.eduFocus][c.edu]:(c.eduFocus?`${SKILLS[c.eduFocus]} 교육 중 (${c.eduScore}점)`:'유아');
    const traitTxt=c.traits.map(t=>TRAITS[t]?TRAITS[t].n:'').filter(Boolean).join(' · ')||(c.childTrait?CHILD_TRAITS[c.childTrait].n:'—');
    const councilRole=Object.entries(state.council).find(([,v])=>v===c.id);
    html+=`<tr style="border-bottom:1px dotted #2c2316">
      <td style="padding:6px 4px">
        <b>${c.name}</b>${councilRole?` <span style="color:var(--gold);font-size:.7rem">${COUNCIL_ROLES[councilRole[0]].icon}</span>`:''}
        <span style="color:var(--parch-dim);font-size:.74rem"> ${age(c)}세</span><br>
        <small style="color:var(--parch-dim)">${rel}${c.pregnant>0?' · 임신중':''}</small>
      </td>
      <td style="padding:6px 4px;font-size:.76rem;color:var(--parch-dim)">
        ${traitTxt}<br><small style="color:#5a6a8a">${eduTxt}</small>
      </td>
      <td style="padding:6px 0 6px 4px;font-size:.74rem;text-align:right;white-space:nowrap">
        외${stat(c,'dip')} 무${stat(c,'mar')}<br>내${stat(c,'stew')} 음${stat(c,'intr')} 학${stat(c,'learn')}
      </td>
    </tr>`;
  }
  html+='</table>';
  document.getElementById('courtContent').innerHTML=html;
}
function openCourt(){ togglePanel('court'); }


/* ---------- 결단 ---------- */
let _decActs=[];
function renderDec(){
  const p=playerChar(); if(!p||!REGIONS[p.region]) return;
  const n=playerRegions().length;
  _decActs=[];
  const items=[];

  function addDec(t,d,enabled,fn){
    const i=_decActs.length;
    _decActs.push(fn);
    items.push({t,d,enabled,i});
  }

  // ── 통치 결단 ──────────────────────
  if(n>=4&&!state.kingdomFormed){
    const canAfford=REGIONS[p.region].gold>=250;
    addDec('⚜ 아일랜드 왕국 선포',`금 250 필요 (보유 ${Math.round(REGIONS[p.region].gold)}) · 위신 +200`, canAfford, ()=>{
      if(REGIONS[p.region].gold<250){return;}
      REGIONS[p.region].gold-=250; state.kingdomFormed=true; state.prestige+=200;
      log('<b>아일랜드 왕국</b>이 선포되었습니다!','good');
      closePanel('dec');
      popup({title:'아일랜드 왕국', sub:'대관식',
        body:'캐셸의 바위 위에서 주교가 왕관을 씌웁니다.\n에이레의 절반이 당신의 이름을 외칩니다.',
        opts:[{t:'하이킹의 길은 계속된다'}]});
    });
  }
  if(playerDuchies().length>=7){
    addDec('☀ 하이킹에 등극한다','에이레 전토 통일 — 승리', true, ()=>{ closePanel('dec'); victory(); });
  }

  // ── 연회/행사 ──────────────────────
  addDec('연회를 연다',`금 60 · 군주 관계 +8 · 스트레스 -20`, REGIONS[p.region].gold>=60, ()=>{
    playSynthSFX('gold');
    REGIONS[p.region].gold-=60; addStress(p,-20,'연회의 즐거움');
    for(const rid in REGIONS){const r=ownerOf(rid); if(r&&r.id!==p.id) chOp(r,p,8);}
    if(p.traits.includes('gregarious'))addStress(p,-8,'사교적인 자의 기쁨');
    if(p.traits.includes('shy'))addStress(p,12,'내성적인 자의 고역');
    log('성대한 연회가 열렸습니다.','good'); renderDec();
  });
  addDec('클론맥노이즈 순례',`금 30 · 스트레스 -25 · 위신 +10`, REGIONS[p.region].gold>=30, ()=>{
    playSynthSFX('gold');
    REGIONS[p.region].gold-=30; addStress(p,-25,'순례의 평안'); state.prestige+=10;
    log('섀넌 강가의 수도원에서 기도를 올렸습니다.','fam'); renderDec();
  });
  addDec('병력 소집',`금 80 · 병력 +200`, BARONIES[p.region]?.gold>=80, ()=>{
    playSynthSFX('gold');
    REGIONS[p.region].gold-=80; REGIONS[p.region].troops+=200;
    log('창병 200이 소집됐습니다.','war'); renderDec();
  });
  // 직할령 한도 표시 및 백작령 하사
  const dCnt=directCountiesOf(p.id).length;
  const dLimit=domainLimit(p);
  if(dCnt>0){
    const overTxt=dCnt>dLimit?` ⚠ 한도 초과 (${dCnt}/${dLimit}) — 세금 패널티 적용 중`:`${dCnt}/${dLimit}`;
    items.unshift({t:`🏛 직할 백작령 현황: ${overTxt}`, d:'', enabled:false, i:-1});
  }

  // 백작령 하사 (직할 초과 시 또는 전략적으로)
  const myCids=directCountiesOf(p.id);
  if(myCids.length>1){
    const courtierCands=Object.values(chars).filter(c=>!c.dead&&c.courtOf===p.region&&c.id!==p.id&&!c.ruler);
    if(courtierCands.length>0){
      addDec('백작령 하사',`궁정인을 백작으로 임명 — 봉신 체계 구축`, true, ()=>{
        // 백작령 선택 UI
        const cOpts=myCids.filter(cid=>cid!==countyOf(p.region)).map(cid=>({
          t:COUNTIES[cid].n, d:`남작령 ${COUNTIES[cid].baronies.length}개`,
          f:()=>{
            // 봉신 대상 선택
            const vOpts=courtierCands.slice(0,4).map(v=>({
              t:v.name, d:`외${stat(v,'dip')} 무${stat(v,'mar')} 내${stat(v,'stew')}`,
              f:()=>{ grantCountyToVassal(p.id, v.id, cid); renderDec(); }
            }));
            vOpts.push({t:'취소'});
            showModal({title:`${COUNTIES[cid].n} 백작 임명`, sub:'봉신 임명',
              body:'누구를 백작으로 임명하겠습니까?', opts:vOpts});
          }
        }));
        cOpts.push({t:'취소'});
        showModal({title:'백작령 하사', sub:'봉신 임명',
          body:'어느 백작령을 하사하겠습니까?', opts:cOpts});
      });
    }
  }

  // ── 상속법 결단 ──────────────────────
  const lawNames={'partition':'분할상속','primogeniture':'장자상속','elective':'선출제'};
  addDec(`현재 상속법: ${lawNames[state.successionLaw]}`, '상속 구조 확인', false, ()=>{});
  if(state.successionLaw==='partition'){
    addDec('장자상속으로 변경',`위신 500 소모 · 사망 시 장남이 전 영지 계승`,
      state.prestige>=500, ()=>{
      state.prestige-=500; state.successionLaw='primogeniture';
      log('상속법이 <b>장자상속</b>으로 변경됐습니다.','good'); renderDec();
    });
  }
  if(state.successionLaw==='primogeniture'){
    addDec('분할상속으로 복귀','위신 200 소모',
      state.prestige>=200, ()=>{
      state.prestige-=200; state.successionLaw='partition';
      log('상속법이 <b>분할상속</b>으로 변경됐습니다.','dip'); renderDec();
    });
    if(vassalsOf(state.player).length>=3){
      addDec('선출제로 변경','봉신 3명 이상 필요 · 봉신들이 후계자 선출',
        true, ()=>{
        state.successionLaw='elective';
        log('상속법이 <b>선출제</b>로 변경됐습니다.','dip'); renderDec();
      });
    }
  }

  // 인재 모집 — 궁정 인원 부족 시
  const courtSize=Object.values(chars).filter(c=>!c.dead&&c.courtOf===p.region&&c.id!==p.id).length;
  const vacancies=Object.values(state.council).filter(v=>!v).length;
  if(vacancies>0||courtSize<3){
    addDec('인재 모집',`금 80 · 궁정에 새 인재 1명 영입`, REGIONS[p.region].gold>=80, ()=>{
      playSynthSFX('gold');
      REGIONS[p.region].gold-=80;
      const roleNames=['dip','mar','stew','intr','learn'];
      // 부족한 역할 스킬 위주로 생성
      const needRole=Object.entries(state.council).find(([,v])=>!v)?.[0]||'dip';
      const sk=COUNCIL_ROLES[needRole]?.skill||'dip';
      const base={dip:4,mar:4,stew:4,intr:4,learn:4};
      base[sk]=8+Math.floor(Math.random()*4); // 해당 스킬 특화
      const recruit=mk({
        name:randName(), dyn:'', sex:Math.random()<0.85?'m':'f',
        byear:state.year-25-Math.floor(Math.random()*15),
        bmonth:1+Math.floor(Math.random()*12),
        bday:1+Math.floor(Math.random()*28),
        traits:randTraits(2), base, edu:2,
        eduFocus:sk, courtOf:p.region
      });
      log(`<b>${recruit.name}</b>이(가) 궁정에 합류했습니다 (${COUNCIL_ROLES[needRole]?.n||'전문가'} 적합).`,'good');
      renderDec(); renderCourt();
    });
  }

  // 전쟁 중 선택지
  const myWar=state.wars.find(w=>w.atk===p.id||w.def===p.id);
  if(myWar){
    const isAtk=myWar.atk===p.id;
    const foe=chars[isAtk?myWar.def:myWar.atk];
    // 백색 강화 제안
    addDec('백색 강화 제안',`${foe?.name}에게 현 상태 강화 — 양측 5년 휴전`, true, ()=>{
      setTruce(myWar.atk,myWar.def,5);
      state.wars=state.wars.filter(w=>w!==myWar);
      addStress(p,5,'미완의 전쟁');
      log(`${foe?.name}과(와) 백색 강화를 맺었습니다.`,'dip');
      renderDec();
    });
    // 공격전 동맹 참전 요청
    if(isAtk){
      const allies=state.alliances.filter(k=>k.includes(p.id)).map(k=>k.replace(p.id,'').replace('|','').trim()).filter(x=>x&&chars[x]&&!chars[x].dead&&!myWar.allies.includes(x));
      if(allies.length>0){
        addDec('동맹에 참전 요청',`위신 30 소모 · 동맹국의 병력 추가`, state.prestige>=30, ()=>{
          state.prestige-=30;
          let joined=0;
          allies.forEach(aid=>{
            if(Math.random()<0.65){ myWar.allies.push(aid); joined++; log(`${chars[aid].name}이(가) 참전했습니다!`,'war'); }
            else { log(`${chars[aid].name}이(가) 참전을 거부했습니다.`,'dip'); }
          });
          if(!joined) { state.prestige+=15; log('어떤 동맹도 응하지 않았습니다.','dip'); }
          renderDec();
        });
      }
    }
  }

  // ── 성격 대처법 (스트레스 1단계 이상) ──
  if(stressLvl(p)>=1){
    addDec('단식 기도 (대처법)',`스트레스 -30 · 위신 +5`, true, ()=>{
      addStress(p,-30,'고행의 위안'); state.prestige+=5;
      log('기도와 단식으로 마음을 달랬습니다.','fam'); renderDec();
    });
    if(p.traits.includes('brave')||p.traits.includes('wrathful')){
      addDec('맹훈련 (대처법)',`스트레스 -25 · 병력 사기 +`, true, ()=>{
        addStress(p,-25,'땀으로 씻어낸 번민');
        log('새벽부터 훈련장에서 몸을 혹사했습니다.','war'); renderDec();
      });
    }
    if(p.traits.includes('temperate')||p.traits.includes('cynical')){
      addDec('독서에 잠긴다 (대처법)',`스트레스 -20 · 학문 자극`, true, ()=>{
        addStress(p,-20,'책 속의 위안');
        log('서재에 틀어박혀 밤새 책을 읽었습니다.','fam'); renderDec();
      });
    }
  }

  // HTML 생성
  // 명분 현황 표시
  const claimHtml = state.claims.length > 0
    ? '<div style="font-size:.7rem;letter-spacing:.15em;color:var(--gold-dim);margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid var(--line)">보유 명분</div>' +
      state.claims.map(cl=>{
        const reg=COUNTIES[cl.rid]||BARONIES[cl.rid]; const cb=CB_TYPES[cl.type];
        return `<div style="display:flex;justify-content:space-between;font-size:.78rem;padding:3px 0;border-bottom:1px dotted #2c2316">
          <span>${cb.icon} ${reg?reg.n:'?'}</span>
          <span style="color:${cb.color}">${cb.n}</span>
          <span style="color:var(--parch-dim)">위신 ${cb.cost}</span>
        </div>`;
      }).join('') + '<div style="height:10px"></div>'
    : '<div style="font-size:.76rem;color:var(--parch-dim);margin-bottom:10px">명분 없음 — 사제에게 교회법 명분 위조를 맡기세요</div>';
  let html = claimHtml + `<p style="font-size:.74rem;color:var(--parch-dim);margin-bottom:12px;letter-spacing:.05em">지배 왕국 ${n}/7</p>`;
  if(!items.length){ html+='<p style="color:var(--parch-dim);font-size:.84rem">조건이 충족된 결단이 없습니다.</p>'; }
  items.forEach(it=>{
    html+=`<button class="p-action${it.enabled?'':' off'}" onclick="_decActs[${it.i}]()">
      ${it.t}<span class="pd">${it.d}</span>
    </button>`;
  });
  document.getElementById('decContent').innerHTML=html;
}
function openDecisions(){ togglePanel('dec'); }
function victory(){
  state.victory=true; state.over=true; pause();
  const p=playerChar();
  showModal({title:'에이레의 하이킹', sub:'승리',
    body:`타라 언덕에서, 일곱 왕국의 군주들이 지켜보는 가운데\n<b>${p.name}</b>이(가) 하이킹의 자리에 오릅니다.\n\n브리언 보루 이후 처음으로, 에이레 전토가 한 사람의 깃발 아래 통일되었습니다.\n\n${state.year}년 — 우어 브리언 가문의 시대가 시작됩니다.`,
    opts:[{t:'새 연대기를 시작한다', f:()=>location.reload()}]});
}

/* ---------- 렌더링 ---------- */
function renderHeader(){
  document.getElementById('dateTxt').textContent=`${state.year}년 ${state.month}월 ${state.day}일`;
  document.getElementById('seasonTxt').textContent=`${SEASONS[state.month-1]} · ${COUNTIES[countyOf(playerChar().region)]?.n||BARONIES[playerChar().region]?.n||'—'}`;
  const reg=REGIONS[playerChar().region];
  document.getElementById('goldTxt').textContent=reg?Math.round(reg.gold):0;
  document.getElementById('prestigeTxt').textContent=state.prestige||120;
  const totalTroops=playerRegions().reduce((s,rid)=>s+(REGIONS[rid].troops||0),0);
  document.getElementById('troopTxt').textContent=totalTroops.toLocaleString();
}
function renderChar(){
  const c=playerChar();
  const portrait=document.getElementById('portrait');
  portrait.innerHTML = makePortraitSVG(c, 86, 108);
  portrait.style.cursor='pointer';
  portrait.onclick=()=>{ initAudio(); openProfile(c); };
  document.getElementById('cNm').textContent=c.name;
  const ttl=state.kingdomFormed?'아일랜드 왕':`${COUNTIES[countyOf(c.region)]?.n||BARONIES[c.region]?.n||''} 소왕`;
  document.getElementById('cTtl').textContent=`${ttl} · ${age(c)}세 · ${c.dyn} 가문`;
  let chips='';
  for(const t of c.traits) chips+=`<span class="chip">${TRAITS[t].n}</span>`;
  if(c.edu!==null) chips+=`<span class="chip edu">${EDU_NAMES[c.eduFocus][c.edu]}</span>`;
  if(c.lifestyle) chips+=`<span class="chip life">${SKILLS[c.lifestyle]}의 길 · ${c.lifeXP}xp</span>`;
  document.getElementById('cChips').innerHTML=chips;
  document.getElementById('stats').innerHTML=
    Object.entries(SKILLS).map(([k,n])=>`<span>${n} <b>${stat(c,k)}</b></span>`).join('')+
    `<span>용맹 <b>${stat(c,'prow')}</b></span>`;
  // 스트레스
  const pct=Math.min(100,c.stress/1.5);
  document.getElementById('stressFill').style.width=pct+'%';
  document.getElementById('stressNum').textContent=`${c.stress} / 150`;
  const lv=stressLvl(c);
  const lvTxt=['0단계 — 평온함','1단계 — 불안','2단계 — 위험','3단계 — 죽음'][lv];
  const el=document.getElementById('stressLvl');
  el.textContent=lvTxt;
  el.style.color=lv===0?'var(--parch-dim)':lv===1?'#c8a24a':lv===2?'#c87a4a':'#d05a4a';
}
/* ════════════════════════════════════════════════
   지도 렌더링 — polygon 기반 실지형 지도
   ════════════════════════════════════════════════ */

/* 아일랜드 섬 외곽선 (시계방향, 근사) */
const IRELAND_OUTLINE = '30,40 95,30 150,42 225,30 300,38 330,58 305,88 330,58 348,145 385,208 388,268 378,358 365,300 340,372 305,368 282,342 252,358 222,338 198,358 172,342 155,392 148,358 138,438 98,468 52,468 52,428 30,415 30,200 30,95';

/* 공작령 기본 색상 (polygon fill 기반) */
const DUCHY_BASE = {
  d_munster:  '#2d4a32',
  d_leinster: '#3a4a28',
  d_dublin:   '#2a3d4f',
  d_meath:    '#3d3a28',
  d_connacht: '#3a2d4a',
  d_breifne:  '#4a3228',
  d_ulster:   '#284a3a',
};

function renderMap(){
  const svg = document.getElementById('map');
  const p = playerChar();
  let h = '';

  /* ── 레이어 0: 바다 배경 */
  h += `<rect width="420" height="500" fill="#1a2d3d"/>`;

  /* ── 레이어 1: 섬 전체 육지 기본색 (외곽선 아래) */
  h += `<polygon points="${IRELAND_OUTLINE}" fill="#2a2018" stroke="none"/>`;

  /* ── 레이어 2: county polygon */
  for(const cid in COUNTIES){
    const C = COUNTIES[cid];
    if(!C.poly) continue;
    const holder = countyHolder(cid);
    const mine = holder && holder.id === p.id;
    const isVassal = holder && holder.liege === p.id;
    const atWar = state.wars.some(w => {
      const h1=countyHolder(cid);
      return h1 && (w.atk===h1.id||w.def===h1.id);
    });
    const underSiege = state.wars.some(w => w.targetRid===cid && w.occupied?.length>0);
    const hasClaim = state.claims.some(cl => cl.rid===cid);

    /* fill 결정 */
    let fill;
    if(mine)          fill = '#3a6644';
    else if(isVassal) fill = '#2e5438';
    else              fill = DUCHY_BASE[C.duchy] || '#2d3028';

    /* stroke 결정 */
    let stroke = '#1a1508', strokeW = '1';
    if(mine)          { stroke='#c8a24a'; strokeW='2'; }
    else if(isVassal) { stroke='#6aaa7a'; strokeW='1.5'; }
    else if(atWar)    { stroke='#c83030'; strokeW='1.5'; }

    h += `<g class="county-region" onclick="openCounty('${cid}')">
      <polygon
        points="${C.poly}"
        fill="${fill}"
        stroke="${stroke}"
        stroke-width="${strokeW}"
        stroke-linejoin="round"
      />`;

    /* 공성 pulse 오버레이 */
    if(underSiege){
      h += `<polygon points="${C.poly}" fill="none"
        stroke="#c83030" stroke-width="2.5" stroke-dasharray="4 3"
        class="siege-pulse"/>`;
    }
    /* 명분 보유 표시 — 옅은 금색 점선 */
    if(hasClaim && !mine){
      h += `<polygon points="${C.poly}" fill="rgba(200,162,74,0.08)"
        stroke="#c8a24a" stroke-width="1" stroke-dasharray="3 4"/>`;
    }

    /* 지명 텍스트 */
    const cx = C.x, cy = C.y;
    const bids = C.baronies;
    const totalT = bids.reduce((s,b)=>s+(BARONIES[b]?.troops||0),0);
    const avgPop = Math.round(bids.reduce((s,b)=>s+(BARONIES[b]?.pop||60),0)/bids.length);
    const holderShort = holder ? holder.name.split(' ')[0] : '—';

    h += `
      <text x="${cx}" y="${cy-6}"
        style="font-size:8.5px;fill:#e6d9be;text-anchor:middle;pointer-events:none;
               font-family:Georgia,serif;font-weight:bold;
               text-shadow:0 0 4px #000;letter-spacing:.03em"
        paint-order="stroke" stroke="#0a0806" stroke-width="2.5">${C.n}</text>
      <text x="${cx}" y="${cy+5}"
        style="font-size:7px;fill:#b0a080;text-anchor:middle;pointer-events:none;
               font-family:Georgia,serif"
        paint-order="stroke" stroke="#0a0806" stroke-width="2">${holderShort}</text>
      <text x="${cx}" y="${cy+15}"
        style="font-size:6.5px;fill:#8a7858;text-anchor:middle;pointer-events:none"
        paint-order="stroke" stroke="#0a0806" stroke-width="1.5">⚔${totalT} ·${avgPop}</text>`;

    /* 내 영지 표시 — 왕관 아이콘 */
    if(mine){
      h += `<text x="${cx}" y="${cy-17}"
        style="font-size:9px;text-anchor:middle;pointer-events:none">👑</text>`;
    }

    h += `</g>`;
  }

  /* ── 레이어 3: 섬 외곽선 테두리 (위에 덮어 자연스럽게) */
  h += `<polygon points="${IRELAND_OUTLINE}"
    fill="none" stroke="#4a3c28" stroke-width="2" stroke-linejoin="round"/>`;

  /* ── 레이어 4: 전쟁 중 교전선 표시 */
  for(const w of state.wars){
    const aC = chars[w.atk], dC = chars[w.def];
    if(!aC||!dC) continue;
    const aCid = countyOf(aC.region), dCid = countyOf(dC.region);
    if(!aCid||!dCid||!COUNTIES[aCid]||!COUNTIES[dCid]) continue;
    const ax=COUNTIES[aCid].x, ay=COUNTIES[aCid].y;
    const dx=COUNTIES[dCid].x, dy=COUNTIES[dCid].y;
    h += `<line x1="${ax}" y1="${ay}" x2="${dx}" y2="${dy}"
      stroke="#c83030" stroke-width="1.5" stroke-dasharray="5 3" opacity="0.7"/>
    <text x="${(ax+dx)/2}" y="${(ay+dy)/2-4}"
      style="font-size:7px;fill:#c83030;text-anchor:middle" paint-order="stroke" stroke="#000" stroke-width="2">⚔</text>`;
  }

  svg.innerHTML = h;
}
function ownerRegionOf(c){ return c.region || regionsOf(c.id)[0] || null; }
function renderAll(){ renderHeader(); renderChar(); renderMap(); }

/* ---------- 시작 ---------- */
function intro(){
  // NPC 관직: 공석으로 시작, aiPulse 연간 체크에서 채움
  popup({title:'에이레, 1066년', sub:'먼스터의 소왕',
    body:`잉글랜드에서는 세 명의 왕이 하나의 왕관을 두고 칼을 뽑았습니다.\n그러나 바다 건너 이 섬은, 그들의 전쟁과 무관하게 자신의 운명을 기다리고 있습니다.\n\n당신은 <b>무르하드 막 돈하드</b> — 먼스터의 소왕.\n할아버지 브리언 보루는 한때 에이레 전토의 하이킹이었습니다.\n\n일곱 왕국을 하나로. 그것이 당신의 길입니다.`,
    opts:[{t:'연대기를 시작한다', f:()=>{
      askLifestyle(playerChar());
    }}]});
}
setSpeed(1);
renderAll();
log('1066년 가을 — 무르하드 막 돈하드의 연대기가 시작됩니다.','good');
log('지도의 왕국을 클릭하면 외교를 할 수 있습니다.','dip');
intro();
