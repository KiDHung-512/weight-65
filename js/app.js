/* =========================================================
   輕鬆瘦身計畫｜主程式（純 JavaScript，不需要任何套件）
   體重記錄存在 Supabase 雲端資料庫；計畫與打卡仍存在瀏覽器的 localStorage。
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 常數與內容 ---------- */
  const KEY = 'wl65:v1';
  const THEME_KEY = 'wl65:theme';    // 色彩模式另外存，不會包含在備份檔裡
  const KCAL_PER_KG = 7700;          // 約 7,700 kcal ≈ 1 公斤體脂肪（估算值）
  const GOOD_DAY = 4;                // 一天勾 4 項以上算「達標日」
  const MAX_STAGES = 7;              // 最多 7 個階段（含最終目標）
  const MAX_HOLD = 8;                // 每個階段後最多維持 8 週
  const ACTIVITY = [1.2, 1.375, 1.55];
  const WEEKDAY = ['日', '一', '二', '三', '四', '五', '六'];

  const THEME_INFO = {
    auto:  { icon: '🌓', label: '自動（跟隨系統）' },
    light: { icon: '☀️', label: '淺色' },
    dark:  { icon: '🌙', label: '深色' }
  };

  const HABITS = [
    { id: 'water', icon: '💧', text: '白開水或無糖茶喝夠（約 2,000 ml 以上）' },
    { id: 'move',  icon: '🚶', text: '走路或運動至少 20 分鐘' },
    { id: 'drink', icon: '🧋', text: '沒有喝含糖飲料（手搖飲選無糖也算）' },
    { id: 'night', icon: '🌙', text: '睡前沒有吃宵夜' },
    { id: 'meal',  icon: '🥦', text: '每餐都有蔬菜和一掌心的蛋白質' },
    { id: 'sleep', icon: '😴', text: '睡滿 7 小時' }
  ];
  const HABIT_IDS = new Set(HABITS.map(h => h.id));

  const QUOTES = [
    '不用一次做到完美，只要今天比昨天多做對一件小事。',
    '體重會上下浮動，但你的努力不會白費。',
    '慢慢來，比較快。',
    '今天走的每一步，都是在對未來的自己好。',
    '喝下一杯無糖茶，也是一次小小的勝利。',
    '不是要戒掉喜歡的東西，而是學會和它們好好相處。',
    '失誤一天沒關係，放棄才是真的輸。',
    '把「我不能吃」換成「我選擇吃這個」。',
    '你不需要很厲害才開始，開始了才會變厲害。',
    '身體記得你每一次的照顧。',
    '先喝一杯水，再決定要不要吃宵夜。',
    '進步不一定看得到數字，也可能是更好的睡眠與精神。',
    '和昨天的自己比，不和別人比。',
    '每一次選擇，都在投票給你想成為的樣子。',
    '累的時候就走十分鐘，也比完全不動好。',
    '溫柔對待自己，才走得遠。',
    '目標體重只是一個數字，更輕盈、更有精神的生活才是重點。',
    '好習慣就像存錢，每天一點點，時間會幫你滾出成果。',
    '今天的自己，辛苦了。',
    '停滯不是失敗，是身體正在調整。',
    '大目標拆成小關卡，每過一關都值得慶祝。',
    '維持不是退步，是讓身體記住新的位置。'
  ];

  const MENU = [
    { day: '週一', theme: '超商＋自助餐日', meals: [
      ['早餐', '茶葉蛋 2 顆＋無糖豆漿＋小地瓜 1 條'],
      ['午餐', '自助餐：3/4 碗飯、去皮雞腿或魚、2 樣青菜、豆腐'],
      ['晚餐', '超商：即食雞胸肉＋生菜沙拉（醬料只用一半）＋御飯糰 1 個'],
      ['點心', '無糖優格＋芭樂半顆']
    ]},
    { day: '週二', theme: '早餐店＋水餃日', meals: [
      ['早餐', '原味蛋餅 1 份＋無糖豆漿（醬料少一點）'],
      ['午餐', '烤魚或烤雞便當，飯吃 3/4，再加點一份燙青菜'],
      ['晚餐', '水餃 8 顆＋燙青菜＋清湯，沾醬少一點'],
      ['點心', '蘋果 1 顆']
    ]},
    { day: '週三', theme: '滷味挑選日', meals: [
      ['早餐', '水煮蛋＋無糖豆漿＋香蕉半根'],
      ['午餐', '雞肉飯小碗（去皮）＋燙青菜 2 份＋滷蛋 1 顆'],
      ['晚餐', '滷味：豆干、海帶、菇類、蒟蒻、青菜、雞胸。少選甜不辣、米血、貢丸和麵類'],
      ['點心', '無糖茶＋一小把堅果（約 10 顆）']
    ]},
    { day: '週四', theme: '日式定食日', meals: [
      ['早餐', '無糖燕麥片＋牛奶或無糖豆漿＋水煮蛋'],
      ['午餐', '烤魚定食，白飯半碗，味噌湯可以喝'],
      ['晚餐', '去皮滷雞腿＋蒸蛋＋燙青菜＋半碗飯'],
      ['點心', '無糖優格']
    ]},
    { day: '週五', theme: '湯麵／火鍋日', meals: [
      ['早餐', '御飯糰（鮪魚或雞肉，避開炸物）＋茶葉蛋＋無糖茶'],
      ['午餐', '清湯河粉或湯麵，加一份蛋白質、一份青菜，湯只喝一半'],
      ['晚餐', '豆腐蔬菜鍋（清湯底），不加主食，沾醬用蔥蒜加醬油'],
      ['點心', '水果一份']
    ]},
    { day: '週六', theme: '彈性日（吃得開心也沒關係）', meals: [
      ['早餐', '無糖優格＋水果＋一小把堅果'],
      ['午餐', '選一餐吃你真正想吃的，細嚼慢嚥吃到八分飽，配一份青菜'],
      ['晚餐', '回到平常的選法：蛋白質＋蔬菜為主，飯量正常'],
      ['點心', '想喝手搖飲，今天可以喝一杯微糖，其他天維持無糖']
    ]},
    { day: '週日', theme: '備餐日', meals: [
      ['早餐', '全麥吐司 2 片夾蛋＋無糖豆漿'],
      ['午餐', '外食照常：自助餐夾三樣菜、飯吃 3/4 碗'],
      ['晚餐', '備餐：一鍋滷雞胸和豆腐，分成 3–4 盒，搭配燙青菜冷藏，當作下週的晚餐'],
      ['點心', '水果一份']
    ]}
  ];

  const BADGES = [
    { id: 'start', icon: '🌱', name: '踏出第一步', desc: '建立你的計畫',            test: s => s.hasPlan },
    { id: 'log1',  icon: '⚖️', name: '開始記錄',   desc: '記下第一筆體重',          test: s => s.logCount >= 1 },
    { id: 'str3',  icon: '🔥', name: '連續 3 天',  desc: '連續 3 天達標',           test: s => s.bestStreak >= 3 },
    { id: 'str7',  icon: '🌟', name: '連續 7 天',  desc: '一整週都沒中斷',          test: s => s.bestStreak >= 7 },
    { id: 'str14', icon: '💪', name: '連續 14 天', desc: '習慣正在養成',            test: s => s.bestStreak >= 14 },
    { id: 'str30', icon: '👑', name: '連續 30 天', desc: '你已經是習慣的主人',      test: s => s.bestStreak >= 30 },
    { id: 'l1',    icon: '🍃', name: '輕了 1 公斤', desc: '累計減少 1 公斤',        test: s => s.bestLoss >= 1 },
    { id: 'l3',    icon: '🌿', name: '輕了 3 公斤', desc: '累計減少 3 公斤',        test: s => s.bestLoss >= 3 },
    { id: 'l5',    icon: '🌳', name: '輕了 5 公斤', desc: '累計減少 5 公斤',        test: s => s.bestLoss >= 5 },
    { id: 'l10',   icon: '🏔️', name: '輕了 10 公斤', desc: '累計減少 10 公斤',      test: s => s.bestLoss >= 10 },
    { id: 'stage', icon: '🚩', name: '完成一個階段', desc: '達成一個階段目標',      test: s => s.stagesDone >= 1 },
    { id: 'hold',  icon: '🧘', name: '穩住了',     desc: '完成一段維持期',          test: s => s.holdsDone >= 1 },
    { id: 'p50',   icon: '🌤️', name: '完成一半',   desc: '進度達到 50%',            test: s => s.progress >= 50 },
    { id: 'goal',  icon: '🏆', name: '抵達目標',   desc: '到達你的目標體重',        test: s => s.reached }
  ];

  /* ---------- 小工具 ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const pad = n => String(n).padStart(2, '0');
  const fmtDate = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parseDate = s => { const a = s.split('-').map(Number); return new Date(a[0], a[1] - 1, a[2]); };
  const isDateStr = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && fmtDate(parseDate(s)) === s;
  const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const diffDays = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);
  const showDate = s => { const d = parseDate(s); return d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate()); };
  const shortDate = d => (d.getMonth() + 1) + '/' + d.getDate();
  const r1 = n => Math.round(n * 10) / 10;
  const fmt = n => Number(n).toLocaleString('en-US');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inRange = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi;
  const num = (v, lo, hi) => { const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
  const sum = arr => arr.reduce((a, b) => a + b, 0);
  const fin = v => (Number.isFinite(v) ? v : 0);

  /* ---------- 資料儲存 ---------- */
  let storageOk = true;
  let state = load();
  let selDate = fmtDate(today());
  let menuDay = (new Date().getDay() + 6) % 7;   // 週一 = 0
  let toastTimer = null;
  let theme = 'auto';

  function emptyState() {
    return { profile: null, weights: {}, habits: {}, badges: [] };
  }

  // 階段目標：[{ target, weeks, hold }, ...]
  //   target：階段目標體重（一個比一個輕，最後一個等於最終目標）
  //   weeks：減到這個目標要花幾週
  //   hold：達標後「維持期」幾週（最後一個階段不需要，固定為 0）
  function cleanStages(raw, prof) {
    if (!Array.isArray(raw) || raw.length < 1 || raw.length > MAX_STAGES) return null;
    const out = [];
    let prev = prof.weight;
    for (let i = 0; i < raw.length; i++) {
      const t = num(raw[i] && raw[i].target, 35, 250);
      const w = num(raw[i] && raw[i].weeks, 1, 104);
      const h = num(raw[i] && raw[i].hold, 0, MAX_HOLD);
      if (t === null || w === null || r1(t) >= prev) return null;
      const isLast = i === raw.length - 1;
      out.push({ target: r1(t), weeks: Math.round(w), hold: isLast || h === null ? 0 : Math.round(h) });
      prev = r1(t);
    }
    if (out[out.length - 1].target !== prof.target) return null;
    const total = sum(out.map(s => s.weeks + s.hold));
    return total >= 4 && total <= 104 ? out : null;
  }

  // 不管資料從哪裡來（儲存空間或匯入的檔案），都先過濾成安全、合法的格式
  function clean(raw) {
    const s = emptyState();
    if (!raw || typeof raw !== 'object') return s;

    const p = raw.profile;
    if (p && typeof p === 'object') {
      const prof = {
        sex: p.sex === 'male' ? 'male' : 'female',
        age: num(p.age, 18, 90),
        height: num(p.height, 120, 220),
        weight: num(p.weight, 35, 250),
        target: num(p.target, 35, 250),
        weeks: num(p.weeks, 1, 104),
        activity: ACTIVITY.indexOf(Number(p.activity)) >= 0 ? Number(p.activity) : 1.2,
        startDate: isDateStr(p.startDate) ? p.startDate : null
      };
      const ok = [prof.age, prof.height, prof.weight, prof.target, prof.weeks].every(v => v !== null);
      if (ok && prof.startDate) {
        prof.weight = r1(prof.weight);
        prof.target = r1(prof.target);
        if (prof.target < prof.weight) {
          // 舊版資料沒有階段，就當作只有一個階段（最終目標）
          prof.stages = cleanStages(p.stages, prof) ||
            (prof.weeks >= 4 ? [{ target: prof.target, weeks: Math.round(prof.weeks), hold: 0 }] : null);
          if (prof.stages) {
            prof.weeks = sum(prof.stages.map(x => x.weeks + x.hold));
            s.profile = prof;
          }
        }
      }
    }

    if (raw.weights && typeof raw.weights === 'object') {
      Object.keys(raw.weights).forEach(d => {
        const kg = num(raw.weights[d], 30, 250);
        if (isDateStr(d) && kg !== null) s.weights[d] = r1(kg);
      });
    }

    if (raw.habits && typeof raw.habits === 'object') {
      Object.keys(raw.habits).forEach(d => {
        if (!isDateStr(d) || !Array.isArray(raw.habits[d])) return;
        const ids = Array.from(new Set(raw.habits[d].filter(id => HABIT_IDS.has(id))));
        if (ids.length) s.habits[d] = ids;
      });
    }

    if (Array.isArray(raw.badges)) {
      const known = new Set(BADGES.map(b => b.id));
      s.badges = Array.from(new Set(raw.badges.filter(id => known.has(id))));
    }
    return s;
  }

  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { storageOk = false; }
    if (!raw) return emptyState();
    try { return clean(JSON.parse(raw)); } catch (e) { return emptyState(); }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      storageOk = false;
      renderStorageWarning();
    }
  }

  function renderStorageWarning() {
    $('#storage-warning').hidden = storageOk;
  }

  /* ---------- 階段與參考線 ---------- */
  function getStages(p) {
    return p.stages && p.stages.length ? p.stages : [{ target: p.target, weeks: p.weeks, hold: 0 }];
  }

  // 參考線：每個階段內，體重從階段起點均勻下降到階段目標；之後的維持期內體重持平
  function plannedWeightAt(p, dayOffset) {
    let from = p.weight, d0 = 0;
    const stages = getStages(p);
    for (let i = 0; i < stages.length; i++) {
      const d1 = d0 + stages[i].weeks * 7;
      if (dayOffset <= d1) return from - (from - stages[i].target) * Math.max(0, dayOffset - d0) / (d1 - d0);
      const d2 = d1 + (stages[i].hold || 0) * 7;
      if (dayOffset <= d2) return stages[i].target;
      from = stages[i].target;
      d0 = d2;
    }
    return p.target;
  }

  /* ---------- 統計 ---------- */
  function series() {
    const p = state.profile;
    if (!p) return [];
    const map = Object.assign({}, state.weights);
    if (!(p.startDate in map)) map[p.startDate] = p.weight;
    return Object.keys(map)
      .filter(d => d >= p.startDate)
      .sort()
      .map(d => ({ date: d, kg: map[d] }));
  }

  function dayCount(dateStr) {
    return (state.habits[dateStr] || []).length;
  }
  function isGood(dateStr) {
    return dayCount(dateStr) >= GOOD_DAY;
  }

  function currentStreak() {
    let cur = today();
    if (!isGood(fmtDate(cur))) cur = addDays(cur, -1);   // 今天還沒達標，就從昨天往回算
    let n = 0;
    while (isGood(fmtDate(cur))) { n++; cur = addDays(cur, -1); }
    return n;
  }

  function bestStreak() {
    const days = Object.keys(state.habits).filter(isGood).sort();
    let best = 0, run = 0, prev = null;
    days.forEach(d => {
      run = prev && diffDays(prev, d) === 1 ? run + 1 : 1;
      if (run > best) best = run;
      prev = d;
    });
    return best;
  }

  function computeStats() {
    const p = state.profile;
    const st = {
      hasPlan: !!p, streak: currentStreak(), bestStreak: bestStreak(),
      logCount: 0, bestLoss: 0, progress: 0, reached: false,
      stagesDone: 0, stageIdx: 0, stageCount: 1, hold: null, holdsDone: 0
    };
    if (!p) return st;

    const pts = series();
    const latest = pts[pts.length - 1];
    const stages = getStages(p);
    const minKg = Math.min.apply(null, pts.map(x => x.kg));
    const todayStr = fmtDate(today());
    const elapsedRaw = diffDays(p.startDate, todayStr);

    st.latest = latest.kg;
    st.lost = r1(p.weight - latest.kg);
    st.remaining = r1(Math.max(0, latest.kg - p.target));
    st.progress = Math.max(0, Math.min(100, Math.round((p.weight - latest.kg) / (p.weight - p.target) * 100)));
    st.logCount = Object.keys(state.weights).filter(d => d >= p.startDate).length;
    st.bestLoss = Math.max(0, r1(p.weight - minKg));
    st.reached = latest.kg <= p.target;
    st.expected = r1(plannedWeightAt(p, elapsedRaw));
    st.endDate = fmtDate(addDays(parseDate(p.startDate), p.weeks * 7));
    st.notStarted = elapsedRaw < 0;
    st.weekNo = Math.floor(Math.max(0, elapsedRaw) / 7) + 1;

    // 階段：以「體重」判斷目前在哪一個階段（提早達標就提早進入下一階段）
    st.stageCount = stages.length;
    st.stagesDone = stages.filter(s => minKg <= s.target).length;
    let idx = -1;
    for (let i = 0; i < stages.length; i++) { if (latest.kg > stages[i].target) { idx = i; break; } }
    st.stageIdx = idx < 0 ? stages.length - 1 : idx;
    st.stageTarget = stages[st.stageIdx].target;

    // 維持期：從「第一次達到階段目標」那天算起，維持 hold 週
    for (let i = stages.length - 2; i >= 0; i--) {
      if (!(stages[i].hold > 0)) continue;
      const reach = pts.filter(x => x.kg <= stages[i].target)[0];
      if (!reach) continue;
      const endD = fmtDate(addDays(parseDate(reach.date), stages[i].hold * 7));
      const left = diffDays(todayStr, endD);
      if (left <= 0) { st.holdsDone++; continue; }
      if (!st.hold && !st.reached && latest.kg > stages[i + 1].target) {
        st.hold = { index: i, target: stages[i].target, weeks: stages[i].hold, endDate: endD, daysLeft: left };
      }
    }
    return st;
  }

  function paceMessage(st, p) {
    if (!p) return '';
    if (st.notStarted) return '計畫將從 ' + showDate(p.startDate) + ' 開始，先把環境和心情準備好 🌱';
    if (st.reached) return '🎉 你已經達到 ' + p.target + ' 公斤了，真的很了不起！接下來的重點是「維持」。';
    if (st.logCount === 0) return '先量一次體重並記錄下來，就能和參考線比較囉。';
    const diff = r1(st.latest - st.expected);
    if (diff <= -0.05) return '比參考線輕 ' + Math.abs(diff).toFixed(1) + ' kg，進度超前，繼續保持 👍';
    if (diff < 0.5) return '剛好落在參考線附近，節奏很穩 🌿';
    return '比參考線重 ' + diff.toFixed(1) + ' kg。沒關係，體重本來就會起伏，檢查一下手搖飲和宵夜，繼續就好 💪';
  }

  /* ---------- 計畫計算 ---------- */
  // 計算「一個階段」：從 startKg 減到 target，預計 weeks 週
  function calcStage(p, startKg, target, weeks) {
    const sexConst = p.sex === 'male' ? 5 : -161;
    const bmr = 10 * startKg + 6.25 * p.height - 5 * p.age + sexConst;   // Mifflin-St Jeor
    const tdee = bmr * p.activity;
    const loss = startKg - target;
    const rate = loss / weeks;                                    // kg / 週
    const wanted = rate * KCAL_PER_KG / 7;                        // 為了達標，每天需要的熱量赤字
    const floor = p.sex === 'male' ? 1500 : 1200;
    const cap = Math.max(0, Math.min(1000, tdee * 0.3, tdee - floor));
    const deficit = Math.min(wanted, cap);
    const capped = wanted > cap + 1;
    const calories = Math.max(floor, Math.round((tdee - deficit) / 10) * 10);
    const safeRate = deficit * 7 / KCAL_PER_KG;
    const maxRate = Math.min(1, startKg * 0.01);
    const capRate = cap * 7 / KCAL_PER_KG;                        // 受熱量下限限制時，實際能達到的速度
    const limit = capRate > 0 ? Math.min(maxRate, capRate) : maxRate;   // 真正生效的速度上限
    const byRate = Math.ceil(loss / maxRate - 1e-9);
    const byDeficit = safeRate > 0 ? Math.ceil(loss / safeRate - 1e-9) : null;
    const suggestWeeks = byDeficit === null ? null : Math.max(byRate, byDeficit);
    const tooFast = rate > maxRate || capped;
    const level = !tooFast ? 'ok' : rate > limit * 1.4 ? 'danger' : 'warn';
    // 維持期的熱量：用「階段目標體重」算出的維持熱量
    const holdCalories = Math.max(floor, Math.round((10 * target + 6.25 * p.height - 5 * p.age + sexConst) * p.activity / 10) * 10);
    return {
      startKg: startKg, target: target, weeks: weeks, loss: loss, rate: rate, bmr: Math.round(bmr), tdee: Math.round(tdee),
      floor: floor, capped: capped, calories: calories, maxRate: maxRate, limit: limit,
      byDeficit: byDeficit, suggestWeeks: suggestWeeks, level: level, holdCalories: holdCalories
    };
  }

  function planMath(p) {
    const start = parseDate(p.startDate);
    const hm = p.height / 100;
    let from = p.weight, cum = 0;
    const stages = getStages(p).map((s, i) => {
      const c = calcStage(p, from, s.target, s.weeks);
      c.index = i;
      c.hold = s.hold || 0;
      c.startDate = fmtDate(addDays(start, cum * 7));
      cum += s.weeks;
      c.endDate = fmtDate(addDays(start, cum * 7));          // 預計達到階段目標的日期
      cum += c.hold;
      c.holdEndDate = fmtDate(addDays(start, cum * 7));      // 維持期結束的日期
      from = s.target;
      return c;
    });
    // 如果有階段太緊，建議的總週數 = 各階段取「原本」和「建議」較大者，再加上維持期
    let suggestTotal = 0;
    stages.forEach(s => {
      if (suggestTotal === null || s.suggestWeeks === null) { suggestTotal = null; return; }
      suggestTotal += Math.max(s.weeks, s.suggestWeeks) + s.hold;
    });
    return {
      stages: stages, totalWeeks: cum, endDate: stages[stages.length - 1].endDate,
      holdWeeks: sum(stages.map(s => s.hold)),
      loss: r1(p.weight - p.target), suggestTotal: suggestTotal,
      bmiNow: p.weight / (hm * hm), bmiTarget: p.target / (hm * hm),
      proteinLow: Math.round(p.target * 1.2), proteinHigh: Math.round(p.target * 1.5),
      water: Math.round(p.weight * 30 / 100) * 100
    };
  }

  function bmiLabel(b) {
    return b < 18.5 ? '體重過輕' : b < 24 ? '健康體位' : b < 27 ? '過重' : b < 30 ? '輕度肥胖' : b < 35 ? '中度肥胖' : '重度肥胖';
  }

  /* ---------- 繪製：計畫結果 ---------- */
  function renderPlanResult(p, isPreview) {
    const box = $('#plan-result');
    if (!p) {
      box.innerHTML = '<div class="card result-placeholder"><span class="big" aria-hidden="true">🌿</span>' +
        '<p>填好左邊的基本資料，這裡會<strong>即時</strong>算出你每天的建議熱量、減重速度與每個階段的時程。</p></div>';
      return;
    }
    const m = planMath(p);
    const n = m.stages.length;
    const first = m.stages[0];

    // 整體評語：看最需要注意的那個階段
    const bad = m.stages.filter(s => s.level !== 'ok');
    const worst = bad.slice().sort((a, b) => (b.rate / b.limit) - (a.rate / a.limit))[0];
    const maxRate = Math.max.apply(null, m.stages.map(s => s.rate));
    let level = 'ok', title, text;
    if (!worst && maxRate <= 0.5) {
      title = '步調很穩，很容易持續 🌿';
      text = (n > 1 ? '最快的階段' : '') + '每週約 ' + maxRate.toFixed(2) + ' 公斤，不需要刻意挨餓，專心把習慣養好就行。';
    } else if (!worst) {
      title = '積極，但做得到 💪';
      text = (n > 1 ? '最快的階段' : '') + '每週約 ' + maxRate.toFixed(2) + ' 公斤，需要穩定執行飲食與運動，偶爾放鬆也沒關係。';
    } else {
      level = bad.some(s => s.level === 'danger') ? 'danger' : 'warn';
      title = level === 'danger' ? '這個期限太緊了 ⚠️' : '這個期限偏緊一點 ⚠️';
      text = (n > 1 ? '「階段 ' + (worst.index + 1) + '」' : '') + '每週要減 ' + worst.rate.toFixed(2) +
        ' 公斤，超過你目前條件下比較安全的速度（約 ' + worst.limit.toFixed(2) + ' 公斤）。太快容易掉肌肉、情緒緊繃，也更容易復胖。' +
        (m.suggestTotal
          ? '建議把總時間拉長到約 ' + m.suggestTotal + ' 週（目前 ' + m.totalWeeks + ' 週），或調整各階段的週數。'
          : '建議先諮詢營養師。');
    }

    const notes = [];
    m.stages.forEach(s => {
      if (s.byDeficit === null) {
        notes.push((n > 1 ? '「階段 ' + (s.index + 1) + '」' : '') + '你的維持熱量已經很接近安全下限，不建議再降低攝取熱量。建議先諮詢營養師，並以增加活動量為主。');
      }
    });
    const capped = m.stages.filter(s => s.capped && s.byDeficit !== null)[0];
    if (capped) {
      notes.push((n > 1 ? '「階段 ' + (capped.index + 1) + '」' : '') + '為了安全，每日熱量已套用下限或最大赤字上限。以 ' +
        fmt(capped.calories) + ' kcal 計算，預估約需 ' + capped.byDeficit + ' 週。');
    }
    if (n > 1) {
      notes.push('體重變輕後，身體每天消耗的熱量也會變少，所以每個階段的建議熱量都會重新計算。');
    } else if (m.loss >= 6) {
      notes.push('💡 目標比較大的話，可以試試左邊的「✨ 幫我自動分段」，拆成小階段更容易堅持。');
    }
    if (m.holdWeeks > 0) {
      notes.push('🧘 維持期不是放縱：熱量吃回維持熱量、運動照常，體重在上下 1 公斤內都算成功。它能讓身體和習慣追上來，降低復胖的機會。');
    } else if (n > 1) {
      notes.push('🧘 想在階段之間喘口氣？可以在每個中途階段設定「達標後維持」幾週（建議 1–2 週）。');
    }
    if (m.bmiTarget < 18.5) {
      notes.push('以你的身高，這個目標體重的 BMI 會落在「體重過輕」範圍，建議重新評估目標。');
    }
    notes.push('快走與徒手運動多消耗的熱量不算在上面，是額外的緩衝，實際進度可能比預估更快。');

    const stageCards = m.stages.map(s => {
      const isFinal = s.index === n - 1;
      const tone = isFinal ? 'tone-final' : 'tone-' + (s.index % 5);
      const flag = s.level === 'ok' ? '' : '<span class="sc-flag sc-' + s.level + '">' + (s.level === 'danger' ? '太緊' : '偏緊') + '</span>';
      let html = '<li class="stage-card ' + tone + '"><div class="sc-top"><b>' +
        (n > 1 ? '階段 ' + (s.index + 1) + (isFinal ? '（最終）' : '') : '最終目標') + '</b>' + flag +
        '<span class="sc-kg">' + s.startKg.toFixed(1) + ' → ' + s.target.toFixed(1) + ' kg</span></div>' +
        '<p>' + s.weeks + ' 週・每週約 ' + s.rate.toFixed(2) + ' kg・預計 ' + showDate(s.endDate) + ' 達成</p>' +
        '<p class="sc-kcal">建議每天約 <b>' + fmt(s.calories) + '</b> kcal</p></li>';
      if (s.hold > 0) {
        html += '<li class="stage-card hold-card"><div class="sc-top"><b>🧘 維持期</b>' +
          '<span class="sc-kg">穩在 ' + s.target.toFixed(1) + ' kg</span></div>' +
          '<p>' + s.hold + ' 週・到 ' + showDate(s.holdEndDate) + '，體重在上下 1 公斤內都算成功</p>' +
          '<p class="sc-kcal">每天約 <b>' + fmt(s.holdCalories) + '</b> kcal（吃回維持熱量）</p></li>';
      }
      return html;
    }).join('');

    box.innerHTML =
      (isPreview ? '<span class="preview-tag">預覽中，按下「儲存我的計畫」才會套用</span>' : '') +
      '<div class="card">' +
        '<div class="verdict verdict-' + level + '"><h3>' + title + '</h3><p>' + text + '</p></div>' +
        '<div class="metric-grid">' +
          '<div class="metric"><span class="metric-label">需要減少</span><span class="metric-value">' + m.loss.toFixed(1) + ' <small>kg</small></span>' +
            '<span class="metric-sub">' + (n > 1 ? '分 ' + n + ' 個階段，共 ' : '') + m.totalWeeks + ' 週' +
            (m.holdWeeks > 0 ? '（含維持期 ' + m.holdWeeks + ' 週）' : '') + '，預計 ' + showDate(m.endDate) + ' 達成</span></div>' +
          '<div class="metric"><span class="metric-label">' + (n > 1 ? '第一階段每日熱量' : '每日建議熱量') + '</span><span class="metric-value">' + fmt(first.calories) + ' <small>kcal</small></span>' +
            '<span class="metric-sub">你的維持熱量約 ' + fmt(first.tdee) + ' kcal</span></div>' +
          '<div class="metric"><span class="metric-label">BMI</span><span class="metric-value">' + m.bmiNow.toFixed(1) + ' → ' + m.bmiTarget.toFixed(1) + '</span>' +
            '<span class="metric-sub">' + bmiLabel(m.bmiNow) + ' → ' + bmiLabel(m.bmiTarget) + '</span></div>' +
          '<div class="metric"><span class="metric-label">每日蛋白質</span><span class="metric-value">' + m.proteinLow + '–' + m.proteinHigh + ' <small>g</small></span>' +
            '<span class="metric-sub">約等於每餐 1 個手掌心</span></div>' +
        '</div>' +
        '<ul class="tips tips-top">' + notes.map(x => '<li>' + x + '</li>').join('') + '</ul>' +
        '<details class="how"><summary>這些數字是怎麼算的？</summary><ul>' +
          '<li>基礎代謝率用 Mifflin-St Jeor 公式估算，乘上活動量得到維持熱量。每個階段都用該階段「起點的體重」重新計算。</li>' +
          '<li>約每 7,700 kcal 的熱量赤字 ≈ 減少 1 公斤體脂肪，這是平均估算值。</li>' +
          '<li>每日熱量不會低於 ' + fmt(first.floor) + ' kcal，赤字也不超過維持熱量的 30%（最多 1,000 kcal）。</li>' +
          '<li>建議減重速度上限為每週體重的 1%（最多 1 公斤）。</li>' +
          '<li>維持期的熱量 = 用「階段目標體重」算出的維持熱量。</li>' +
          '<li>參考線：每個階段內，體重從階段起點平均下降到階段目標；維持期內持平。</li>' +
          '<li>BMI 分級採用台灣國健署標準。BMI 無法分辨肌肉與脂肪，只是參考。</li>' +
        '</ul></details>' +
      '</div>' +
      '<div class="card"><h3>' + (n > 1 ? '階段計畫' : '目標時程') + '</h3><ul class="stage-cards">' + stageCards + '</ul></div>';
  }

  /* ---------- 繪製：總覽 ---------- */
  function renderDashboard() {
    const p = state.profile;
    const st = computeStats();
    const outer = $('#d-bar-outer');
    $('#d-streak').textContent = st.streak;
    if (!p) {
      ['#d-current', '#d-lost', '#d-remain'].forEach(id => { $(id).textContent = '—'; });
      $('#d-bar').style.width = '0%';
      $('#d-progress-num').textContent = '0%';
      $('#d-bar-wrap').setAttribute('aria-valuenow', '0');
      $('#d-progress-text').textContent = '建立計畫後，這裡會顯示你的進度。';
      $('#d-pace').textContent = '';
      $('#d-stage').textContent = '';
      $('#d-marks').innerHTML = '';
      outer.classList.remove('has-marks');
      return;
    }
    const stages = getStages(p);
    $('#d-current').textContent = st.latest.toFixed(1);
    $('#d-lost').textContent = Math.max(0, st.lost).toFixed(1);
    $('#d-remain').textContent = st.remaining.toFixed(1);
    $('#d-bar').style.width = st.progress + '%';
    $('#d-progress-num').textContent = st.progress + '%';
    $('#d-bar-wrap').setAttribute('aria-valuenow', String(st.progress));
    $('#d-progress-text').textContent = st.notStarted
      ? '計畫從 ' + showDate(p.startDate) + ' 開始・預計 ' + showDate(st.endDate) + ' 達成 ' + p.target + ' 公斤'
      : '第 ' + Math.min(st.weekNo, p.weeks) + ' 週 / 共 ' + p.weeks + ' 週・預計 ' + showDate(st.endDate) + ' 達成 ' + p.target + ' 公斤';
    $('#d-pace').textContent = paceMessage(st, p);

    // 進度條上標出各階段的位置
    if (stages.length > 1) {
      $('#d-marks').innerHTML = stages.slice(0, -1).map(s => {
        const pct = Math.max(0, Math.min(100, (p.weight - s.target) / (p.weight - p.target) * 100));
        return '<span class="bar-mark" style="left:' + pct.toFixed(1) + '%">' + s.target + ' kg</span>';
      }).join('');
      outer.classList.add('has-marks');
      if (st.hold) {
        $('#d-stage').textContent = '🧘 維持期：把體重穩在 ' + st.hold.target + ' kg 上下，還有 ' + st.hold.daysLeft +
          ' 天（到 ' + showDate(st.hold.endDate) + '）再出發';
      } else if (st.reached) {
        $('#d-stage').textContent = '🏁 所有階段都完成了！';
      } else {
        $('#d-stage').textContent = '🚩 階段 ' + (st.stageIdx + 1) + ' / ' + stages.length + '：先到 ' + st.stageTarget + ' kg（還差 ' +
          Math.max(0, r1(st.latest - st.stageTarget)).toFixed(1) + ' kg）';
      }
    } else {
      $('#d-marks').innerHTML = '';
      outer.classList.remove('has-marks');
      $('#d-stage').textContent = '';
    }
  }

  /* ---------- 繪製：體重曲線 ---------- */
  function renderChart() {
    const box = $('#chart');
    const p = state.profile;
    if (!p) {
      box.innerHTML = '<p class="empty">建立計畫後，這裡會畫出你的體重曲線。</p>';
      $('#t-pace').textContent = '';
      $('#lg-hold').hidden = true;
      return;
    }
    const pts = series();
    const stages = getStages(p);
    const start = parseDate(p.startDate);
    const planEnd = addDays(start, p.weeks * 7);
    const last = parseDate(pts[pts.length - 1].date);
    const xEnd = last > planEnd ? last : planEnd;
    const span = Math.max(1, Math.round((xEnd - start) / 86400000));

    const kgs = pts.map(x => x.kg).concat([p.weight, p.target]);
    const lo = Math.floor(Math.min.apply(null, kgs)) - 1;
    const hi = Math.ceil(Math.max.apply(null, kgs)) + 1;

    const W = Math.max(280, box.clientWidth || 600);
    const H = Math.round(Math.min(360, Math.max(240, W * 0.55)));
    const m = { l: 40, r: 14, t: 14, b: 28 };
    const X = d => m.l + (Math.round((d - start) / 86400000) / span) * (W - m.l - m.r);
    const Y = kg => m.t + ((hi - kg) / (hi - lo)) * (H - m.t - m.b);

    const range = hi - lo;
    const step = range <= 6 ? 1 : range <= 14 ? 2 : range <= 35 ? 5 : 10;

    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="體重變化曲線圖">';

    // 維持期色帶（畫在最底層）
    let cumDays = 0, anyHold = false;
    stages.forEach(s => {
      cumDays += s.weeks * 7;
      if (s.hold > 0) {
        anyHold = true;
        const x1 = X(addDays(start, cumDays)), x2 = X(addDays(start, cumDays + s.hold * 7));
        svg += '<rect class="chart-hold" x="' + x1.toFixed(1) + '" y="' + m.t + '" width="' + Math.max(1, x2 - x1).toFixed(1) +
               '" height="' + (H - m.t - m.b) + '"/>';
        if (x2 - x1 >= 30) {
          svg += '<text class="chart-hold-label" x="' + ((x1 + x2) / 2).toFixed(1) + '" y="' + (m.t + 12) + '" text-anchor="middle">維持</text>';
        }
        cumDays += s.hold * 7;
      }
    });
    $('#lg-hold').hidden = !anyHold;

    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
      const y = Y(v).toFixed(1);
      svg += '<line class="chart-grid" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y + '" y2="' + y + '"/>' +
             '<text class="chart-axis" x="' + (m.l - 8) + '" y="' + (Number(y) + 4) + '" text-anchor="end">' + v + '</text>';
    }
    const mid = addDays(start, Math.round(span / 2));
    svg += '<text class="chart-axis" x="' + m.l + '" y="' + (H - 6) + '" text-anchor="start">' + shortDate(start) + '</text>' +
           '<text class="chart-axis" x="' + X(mid).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + shortDate(mid) + '</text>' +
           '<text class="chart-axis" x="' + (W - m.r) + '" y="' + (H - 6) + '" text-anchor="end">' + shortDate(xEnd) + '</text>';

    // 中途階段目標線
    stages.slice(0, -1).forEach((s, i) => {
      const sy = Y(s.target).toFixed(1);
      svg += '<line class="chart-stage" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + sy + '" y2="' + sy + '"/>' +
             '<text class="chart-stage-label" x="' + (m.l + 6) + '" y="' + (Number(sy) - 5) + '" text-anchor="start">階段 ' + (i + 1) + '・' + s.target + ' kg</text>';
    });

    // 最終目標線
    const gy = Y(p.target).toFixed(1);
    svg += '<line class="chart-goal" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + gy + '" y2="' + gy + '"/>' +
           '<text class="chart-goal-label" x="' + (m.l + 6) + '" y="' + (Number(gy) - 6) + '" text-anchor="start">目標 ' + p.target + ' kg</text>';

    // 參考線（依階段轉折，維持期持平）
    const plan = [[X(start), Y(p.weight)]];
    const turns = [];
    let cum = 0;
    stages.forEach((s, i) => {
      cum += s.weeks * 7;
      const reached = [X(addDays(start, cum)), Y(s.target)];
      plan.push(reached);
      if (i < stages.length - 1) turns.push(reached);
      if (s.hold > 0) {
        cum += s.hold * 7;
        plan.push([X(addDays(start, cum)), Y(s.target)]);
      }
    });
    svg += '<polyline class="chart-plan" points="' + plan.map(c => c[0].toFixed(1) + ',' + c[1].toFixed(1)).join(' ') + '"/>';
    turns.forEach(c => {
      svg += '<circle class="chart-plan-dot" cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="4"/>';
    });

    // 實際體重
    const coords = pts.map(pt => [X(parseDate(pt.date)), Y(pt.kg), pt]);
    if (coords.length > 1) {
      svg += '<polyline class="chart-actual" points="' + coords.map(c => c[0].toFixed(1) + ',' + c[1].toFixed(1)).join(' ') + '"/>';
    }
    coords.forEach(c => {
      svg += '<circle class="chart-dot" cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="4.5"><title>' +
             showDate(c[2].date) + '・' + c[2].kg.toFixed(1) + ' kg</title></circle>';
    });
    svg += '</svg>';
    box.innerHTML = svg;
    box.dataset.w = String(box.clientWidth);

    $('#t-pace').textContent = paceMessage(computeStats(), p);
  }

  function renderWeightList() {
    const p = state.profile;
    const ul = $('#w-list');
    const dates = Object.keys(state.weights).filter(d => !p || d >= p.startDate).sort();
    if (!dates.length) { ul.innerHTML = '<li class="empty">還沒有記錄，先量一次吧！</li>'; return; }
    let prev = p ? p.weight : state.weights[dates[0]];
    const rows = dates.map(d => {
      const kg = state.weights[d];
      const delta = r1(kg - prev);
      prev = kg;
      return { d: d, kg: kg, delta: delta };
    }).reverse().slice(0, 30);
    ul.innerHTML = rows.map(r => {
      const cls = r.delta < 0 ? 'down' : r.delta > 0 ? 'up' : '';
      const txt = r.delta < 0 ? '▼ ' + Math.abs(r.delta).toFixed(1) : r.delta > 0 ? '▲ ' + r.delta.toFixed(1) : '持平';
      return '<li><span class="w-date">' + showDate(r.d) + '</span><span class="w-kg">' + r.kg.toFixed(1) + ' kg</span>' +
        '<span class="w-delta ' + cls + '">' + txt + '</span>' +
        (remoteNotes[r.d] ? '<span class="w-note">' + esc(remoteNotes[r.d]) + '</span>' : '') + '</li>';
    }).join('');
  }

  /* ---------- 繪製：打卡 ---------- */
  function renderChecklist() {
    const d = parseDate(selDate);
    const isToday = selDate === fmtDate(today());
    $('#ci-date').textContent = showDate(selDate) + '（週' + WEEKDAY[d.getDay()] + '）' + (isToday ? ' 今天' : '');
    $('#ci-next').disabled = isToday;
    const done = new Set(state.habits[selDate] || []);
    $('#ci-list').innerHTML = HABITS.map(h =>
      '<li><label class="check"><input type="checkbox" data-habit="' + h.id + '"' + (done.has(h.id) ? ' checked' : '') + '>' +
      '<span class="check-box" aria-hidden="true"></span>' +
      '<span class="check-text"><span class="check-icon" aria-hidden="true">' + h.icon + '</span>' + h.text + '</span></label></li>'
    ).join('');
  }

  function renderCheckinSummary() {
    const n = dayCount(selDate);
    const total = HABITS.length;
    $('#ci-bar').style.width = (n / total * 100) + '%';
    let msg;
    if (n === 0) msg = '從勾選第一項開始吧 🌱';
    else if (n === total) msg = '全部完成，太厲害了！🎉';
    else if (n >= GOOD_DAY) msg = '已完成 ' + n + '/' + total + '，今天達標！✨';
    else msg = '已完成 ' + n + '/' + total + '，再 ' + (GOOD_DAY - n) + ' 項就達標';
    $('#ci-msg').textContent = msg;
    renderCalendar();
  }

  function renderCalendar() {
    const t = today();
    const todayKey = fmtDate(t);
    const first = addDays(t, -27);
    const gridStart = addDays(first, -((first.getDay() + 6) % 7));
    const gridEnd = addDays(t, 6 - ((t.getDay() + 6) % 7));
    let html = '';
    for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
      const key = fmtDate(d);
      const n = dayCount(key);
      const lvl = n === 0 ? 0 : n === HABITS.length ? 3 : n >= GOOD_DAY ? 2 : 1;
      html += '<button type="button" class="cal-cell lvl-' + lvl + (key === selDate ? ' selected' : '') + (key === todayKey ? ' today' : '') +
        '" data-date="' + key + '"' + (d > t ? ' disabled' : '') +
        ' aria-label="' + (d.getMonth() + 1) + '月' + d.getDate() + '日，完成 ' + n + ' 項">' + d.getDate() + '</button>';
    }
    $('#ci-grid').innerHTML = html;
  }

  function renderBadges() {
    $('#badges').innerHTML = BADGES.map(b => {
      const on = state.badges.indexOf(b.id) >= 0;
      return '<div class="badge' + (on ? '' : ' locked') + '"><span class="badge-icon" aria-hidden="true">' + b.icon + '</span>' +
        '<b>' + b.name + '</b><small>' + (on ? b.desc : '尚未解鎖・' + b.desc) + '</small></div>';
    }).join('');
  }

  // 檢查有沒有新解鎖的徽章，回傳這次新解鎖的徽章名稱
  function syncBadges() {
    const st = computeStats();
    const fresh = BADGES.filter(b => state.badges.indexOf(b.id) < 0 && b.test(st));
    if (!fresh.length) return [];
    fresh.forEach(b => state.badges.push(b.id));
    save();
    return fresh.map(b => b.name);
  }

  function badgeNote(names) {
    return names.length ? '・🏅 解鎖徽章：' + names.join('、') : '';
  }

  /* ---------- 繪製：飲食／運動 ---------- */
  function renderDietCard() {
    const box = $('#diet-target');
    const p = state.profile;
    if (!p) {
      box.innerHTML = '<p class="diet-empty">👉 先到「<a href="#plan">我的計畫</a>」輸入基本資料，這裡就會算出你每天的建議熱量，以及每餐大概的分配。</p>';
      return;
    }
    const m = planMath(p);
    const st = computeStats();
    const inHold = !!st.hold;
    const s = inHold ? m.stages[st.hold.index] : m.stages[Math.min(st.stageIdx, m.stages.length - 1)];
    const cal = inHold ? s.holdCalories : s.calories;
    const split = [['早餐', 0.25], ['午餐', 0.35], ['晚餐', 0.30], ['點心', 0.10]];
    box.innerHTML =
      '<h3>你每天的目標</h3>' +
      (inHold
        ? '<p class="diet-hold">🧘 現在是維持期（到 ' + showDate(st.hold.endDate) + '，還有 ' + st.hold.daysLeft +
          ' 天）：把熱量吃回維持熱量，讓體重穩在 ' + st.hold.target + ' kg 上下，不用再刻意少吃。</p>'
        : (m.stages.length > 1
          ? '<p class="diet-stage">🚩 目前是階段 ' + (s.index + 1) + ' / ' + m.stages.length + '（' + s.startKg.toFixed(1) + ' → ' + s.target.toFixed(1) + ' kg）。進入下一階段時，熱量會重新計算。</p>'
          : '')) +
      '<div class="metric-grid">' +
        '<div class="metric"><span class="metric-label">' + (inHold ? '維持期熱量' : '建議熱量') + '</span><span class="metric-value">' + fmt(cal) + ' <small>kcal</small></span></div>' +
        '<div class="metric"><span class="metric-label">蛋白質</span><span class="metric-value">' + m.proteinLow + '–' + m.proteinHigh + ' <small>g</small></span></div>' +
        '<div class="metric"><span class="metric-label">白開水／無糖茶</span><span class="metric-value">約 ' + fmt(m.water) + ' <small>ml</small></span></div>' +
      '</div>' +
      '<div class="meal-split">' + split.map(x =>
        '<div><b>' + fmt(Math.round(cal * x[1] / 10) * 10) + '</b><span>' + x[0] + '（kcal）</span></div>').join('') + '</div>' +
      '<p class="hint hint-top">每餐的熱量是大致分配，不用算得太精準。用手掌法抓份量，再看體重趨勢微調就好。</p>';
  }

  function renderPhases() {
    const p = state.profile;
    const wk = p ? computeStats().weekNo : null;
    $$('.phase').forEach(el => {
      const cur = !!wk && wk >= Number(el.dataset.from) && wk <= Number(el.dataset.to);
      el.classList.toggle('is-current', cur);
      $('.phase-tag', el).hidden = !cur;
    });
  }

  function renderMenu(focusTab) {
    $('#menu-tabs').innerHTML = MENU.map((d, i) =>
      '<button type="button" class="menu-tab" role="tab" id="mt-' + i + '" aria-selected="' + (i === menuDay) +
      '" tabindex="' + (i === menuDay ? 0 : -1) + '" data-i="' + i + '">' + d.day + '</button>').join('');
    const d = MENU[menuDay];
    const panel = $('#menu-panel');
    panel.setAttribute('aria-labelledby', 'mt-' + menuDay);
    panel.innerHTML = '<p class="menu-theme">' + d.theme + '</p><ul class="menu-meals">' +
      d.meals.map(m => '<li><b>' + m[0] + '</b><span>' + m[1] + '</span></li>').join('') + '</ul>';
    if (focusTab) $('#mt-' + menuDay).focus();
  }

  /* ---------- 全部重畫 ---------- */
  function renderAll() {
    renderStorageWarning();
    renderDashboard();
    previewPlan();
    renderChart();
    renderWeightList();
    renderChecklist();
    renderCheckinSummary();
    renderBadges();
    renderDietCard();
    renderPhases();
  }

  /* ---------- 表單：階段目標列 ---------- */
  // stages 的最後一個是「最終目標」，只顯示週數；前面的是中途階段，可改目標、週數和維持期
  function renderStageRows(stages) {
    const n = stages.length;
    const v = x => (Number.isFinite(x) ? x : '');
    $('#stage-list').innerHTML = stages.map((s, i) => {
      const isFinal = i === n - 1;
      const name = isFinal ? (n > 1 ? '最終' : '目標') : '階段 ' + (i + 1);
      const weeksCell = '<span class="input-unit"><input type="number" class="st-weeks" min="1" max="104" step="1" inputmode="numeric" ' +
        'aria-label="' + name + ' 要花幾週" value="' + v(s.weeks) + '"><em>週</em></span>';
      if (isFinal) {
        return '<div class="stage-row"><span class="stage-name">' + name + '</span>' +
          '<span class="stage-final" id="st-final-target">— kg</span>' + weeksCell + '<span></span></div>';
      }
      return '<div class="stage-row"><span class="stage-name">' + name + '</span>' +
        '<span class="input-unit"><input type="number" class="st-target" min="35" max="250" step="0.1" inputmode="decimal" ' +
        'aria-label="' + name + ' 目標體重" value="' + v(s.target) + '"><em>kg</em></span>' + weeksCell +
        '<button type="button" class="icon-btn st-remove" aria-label="移除' + name + '">✕</button>' +
        '<label class="stage-hold"><span>🧘 達標後維持</span>' +
        '<input type="number" class="st-hold" min="0" max="' + MAX_HOLD + '" step="1" inputmode="numeric" ' +
        'aria-label="' + name + ' 達標後維持幾週" value="' + v(s.hold) + '"><span>週</span></label></div>';
    }).join('');
    syncFinalLabel();
  }

  // 讀取目前的階段列（寬鬆版：欄位還沒填好也不會報錯）
  function readRowsLoose() {
    return $$('#stage-list .stage-row').map(row => {
      const t = $('.st-target', row);
      const h = $('.st-hold', row);
      return {
        target: t ? parseFloat(t.value) : NaN,
        weeks: parseInt($('.st-weeks', row).value, 10),
        hold: h ? parseInt(h.value, 10) : 0
      };
    });
  }

  function syncFinalLabel() {
    const el = $('#st-final-target');
    if (!el) return;
    const t = parseFloat($('#f-target').value);
    el.textContent = (Number.isFinite(t) ? t : '—') + ' kg';
  }

  function addStage() {
    const rows = readRowsLoose();
    if (rows.length >= MAX_STAGES) { toast('最多 ' + MAX_STAGES + ' 個階段就夠了'); return; }
    const mid = rows.slice(0, -1);
    const last = rows[rows.length - 1];
    const weight = parseFloat($('#f-weight').value);
    const finalT = parseFloat($('#f-target').value);
    const prev = mid.length ? mid[mid.length - 1].target : weight;
    let t = NaN;
    if (inRange(prev, 35, 250) && inRange(finalT, 35, 250) && prev - finalT >= 2) t = Math.round((prev + finalT) / 2);
    const finW = Number.isFinite(last.weeks) ? last.weeks : 16;
    const newW = Math.max(1, Math.floor(finW / 2));
    mid.push({ target: t, weeks: newW, hold: 1 });
    renderStageRows(mid.concat([{ target: NaN, weeks: Math.max(1, finW - newW), hold: 0 }]));
    const inputs = $$('#stage-list .st-target');
    if (inputs.length) inputs[inputs.length - 1].focus();
    onFormChange();
  }

  function removeStage(index) {
    const rows = readRowsLoose();
    const removed = rows.splice(index, 1)[0];
    const next = rows[index];   // 原本的下一列（可能是最終目標）
    // 被刪掉的階段，它的週數和維持期都併到下一個階段，總時間不變
    if (next) next.weeks = fin(next.weeks) + fin(removed.weeks) + fin(removed.hold);
    renderStageRows(rows);
    onFormChange();
  }

  // 依照目前填的資料，自動拆成階段（每階段約 5–8 公斤，速度抓在穩健的每週 0.6 公斤以內，階段間維持 2 週）
  function autoSplit() {
    const sexEl = $('input[name="sex"]:checked');
    const prof = {
      sex: sexEl ? sexEl.value : '',
      age: parseFloat($('#f-age').value),
      height: parseFloat($('#f-height').value),
      activity: parseFloat($('#f-activity').value)
    };
    const weight = parseFloat($('#f-weight').value);
    const finalT = parseFloat($('#f-target').value);
    if (!prof.sex || !inRange(prof.age, 18, 90) || !inRange(prof.height, 120, 220) || !inRange(weight, 35, 250) || !inRange(finalT, 35, 250)) {
      toast('先填好性別、年齡、身高、目前體重和最終目標，才能幫你分段');
      return;
    }
    const loss = weight - finalT;
    if (loss < 2) { toast('目前體重和目標只差不到 2 公斤，不需要分段'); return; }

    const n = Math.max(1, Math.min(4, Math.round(loss / 6.5)));
    const targets = [];
    let prev = weight;
    for (let k = 1; k < n; k++) {
      const t = Math.round((weight - loss * k / n) / 5) * 5;   // 切在整數的 5 公斤（例如 70、75）
      if (prev - t >= 2 && t - finalT >= 2) { targets.push(t); prev = t; }
    }
    targets.push(finalT);

    let from = weight;
    const stages = targets.map((t, i) => {
      const c = calcStage(prof, from, t, 1);
      const rate = Math.max(0.2, Math.min(0.6, c.limit));
      const weeks = Math.max(2, Math.ceil((from - t) / rate));
      from = t;
      return { target: t, weeks: weeks, hold: i < targets.length - 1 ? 2 : 0 };
    });
    renderStageRows(stages);
    onFormChange();
    toast(stages.length > 1
      ? '✨ 已分成 ' + stages.length + ' 個階段，每個階段後維持 2 週，都可以再自己調整'
      : '這個幅度一個階段就夠了，已幫你估好週數');
  }

  /* ---------- 表單：我的計畫 ---------- */
  function fillForm(p) {
    const v = p || { sex: '', age: '', height: '', weight: '', target: '', activity: 1.2, startDate: fmtDate(today()), stages: [{ target: NaN, weeks: 16, hold: 0 }] };
    $$('input[name="sex"]').forEach(r => { r.checked = r.value === v.sex; });
    $('#f-age').value = v.age;
    $('#f-height').value = v.height;
    $('#f-weight').value = v.weight;
    $('#f-target').value = v.target;
    $('#f-start').value = v.startDate;
    $('#f-activity').value = String(v.activity);
    renderStageRows(getStages(v));
    updateWeeksNote();
  }

  function readForm() {
    const sexEl = $('input[name="sex"]:checked');
    const rows = readRowsLoose();
    const finalT = parseFloat($('#f-target').value);
    const stages = rows.map((r, i) => ({
      target: i === rows.length - 1 ? finalT : r.target,
      weeks: r.weeks,
      hold: i === rows.length - 1 ? 0 : fin(r.hold)      // 維持期留白視為 0
    }));
    const p = {
      sex: sexEl ? sexEl.value : '',
      age: parseFloat($('#f-age').value),
      height: parseFloat($('#f-height').value),
      weight: parseFloat($('#f-weight').value),
      target: finalT,
      weeks: sum(stages.map(s => fin(s.weeks) + s.hold)),
      activity: parseFloat($('#f-activity').value),
      startDate: $('#f-start').value,
      stages: stages
    };
    const errs = [];
    if (!p.sex) errs.push(['input[name="sex"]', '請選擇性別']);
    if (!inRange(p.age, 18, 90)) errs.push(['#f-age', '年齡請填 18–90 歲']);
    if (!inRange(p.height, 120, 220)) errs.push(['#f-height', '身高請填 120–220 cm']);
    if (!inRange(p.weight, 35, 250)) errs.push(['#f-weight', '目前體重請填 35–250 kg']);
    if (!inRange(p.target, 35, 250)) errs.push(['#f-target', '最終目標體重請填 35–250 kg']);
    const baseOk = inRange(p.weight, 35, 250) && inRange(p.target, 35, 250);
    if (baseOk && p.target >= p.weight) {
      errs.push(['#f-target', '目標體重要比目前體重輕喔']);
    } else if (baseOk) {
      const mids = stages.slice(0, -1);
      if (mids.some(s => !inRange(s.target, 35, 250))) {
        errs.push(['#stage-list .st-target', '階段目標體重請填 35–250 kg']);
      } else {
        // 目前體重 → 各階段 → 最終目標，必須一個比一個輕
        let prev = p.weight, ordered = true;
        stages.forEach(s => { if (!(s.target < prev)) ordered = false; prev = s.target; });
        if (!ordered) errs.push(['#stage-list .st-target', '階段目標要一個比一個輕（目前體重 → 階段目標 → 最終目標）']);
      }
    }
    if (stages.some(s => !inRange(s.weeks, 1, 104))) {
      errs.push(['#stage-list .st-weeks', '每個階段的週數請填 1–104 週']);
    } else if (stages.slice(0, -1).some(s => !inRange(s.hold, 0, MAX_HOLD))) {
      errs.push(['#stage-list .st-hold', '維持期請填 0–' + MAX_HOLD + ' 週']);
    } else if (p.weeks < 4 || p.weeks > 104) {
      errs.push(['#stage-list .st-weeks', '總週數（含維持期）請落在 4–104 週（目前 ' + p.weeks + ' 週）']);
    }
    if (!isDateStr(p.startDate)) errs.push(['#f-start', '請選擇開始日期']);
    if (ACTIVITY.indexOf(p.activity) < 0) errs.push(['#f-activity', '請選擇活動量']);
    if (!errs.length) {
      p.weight = r1(p.weight);
      p.target = r1(p.target);
      p.height = r1(p.height);
      p.age = Math.round(p.age);
      p.stages = stages.map(s => ({ target: r1(s.target), weeks: Math.round(s.weeks), hold: Math.round(s.hold) }));
      p.stages[p.stages.length - 1].target = p.target;
    }
    return { p: p, errs: errs };
  }

  function updateWeeksNote() {
    const note = $('#f-weeks-note');
    const rows = readRowsLoose();
    const weeks = sum(rows.map(r => (r.weeks > 0 ? r.weeks : 0)));
    const holds = sum(rows.slice(0, -1).map(r => (r.hold > 0 ? r.hold : 0)));
    const total = weeks + holds;
    const sd = $('#f-start').value;
    if (weeks > 0 && total <= 520 && isDateStr(sd)) {
      note.textContent = '共 ' + total + ' 週（約 ' + r1(total / 4.345) + ' 個月' + (holds > 0 ? '，含維持期 ' + holds + ' 週' : '') + '）・預計 ' +
        showDate(fmtDate(addDays(parseDate(sd), total * 7))) + ' 達成最終目標';
    } else {
      note.textContent = '';
    }
  }

  function sameProfile(a, b) {
    if (!a || !b) return false;
    return ['sex', 'age', 'height', 'weight', 'target', 'weeks', 'activity', 'startDate'].every(k => a[k] === b[k]) &&
      JSON.stringify(a.stages) === JSON.stringify(b.stages);
  }

  // 依表單目前的內容，即時顯示結果（還沒儲存時標示為「預覽」）
  function previewPlan() {
    const r = readForm();
    if (!r.errs.length) {
      renderPlanResult(r.p, !sameProfile(r.p, state.profile));
    } else if (state.profile) {
      renderPlanResult(state.profile, false);
    } else if (r.errs.some(e => e[0] === '#f-target' && e[1].indexOf('比目前') >= 0)) {
      $('#plan-result').innerHTML = '<div class="card result-placeholder"><span class="big" aria-hidden="true">🙂</span><p>目標體重要比目前體重輕，才有需要減重喔。</p></div>';
    } else {
      renderPlanResult(null);
    }
  }

  function onFormChange() {
    syncFinalLabel();
    updateWeeksNote();
    previewPlan();
  }

  function onPlanSubmit(e) {
    e.preventDefault();
    const r = readForm();
    const err = $('#form-error');
    if (r.errs.length) {
      err.textContent = r.errs.map(x => x[1]).join('、');
      const el = $(r.errs[0][0]);
      if (el) el.focus();
      return;
    }
    err.textContent = '';
    state.profile = r.p;
    save();
    const fresh = syncBadges();
    renderAll();
    toast('✅ 計畫已儲存' + badgeNote(fresh));
    $('#plan-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function onPlanFormClick(e) {
    const rm = e.target.closest('.st-remove');
    if (rm) {
      const rows = $$('#stage-list .stage-row');
      removeStage(rows.indexOf(rm.closest('.stage-row')));
      return;
    }
    if (e.target.closest('#btn-add-stage')) addStage();
    else if (e.target.closest('#btn-auto-stage')) autoSplit();
  }

  /* ---------- 表單：體重記錄 ---------- */
  async function onWeightSubmit(e) {
    e.preventDefault();
    const err = $('#w-error');
    const p = state.profile;
    const date = $('#w-date').value;
    const kg = parseFloat($('#w-kg').value);
    if (!isDateStr(date)) { err.textContent = '請選擇日期'; return; }
    if (date > fmtDate(today())) { err.textContent = '不能記錄未來的日期'; return; }
    if (p && date < p.startDate) { err.textContent = '日期不能早於計畫開始日（' + showDate(p.startDate) + '）'; return; }
    if (!inRange(kg, 30, 250)) { err.textContent = '體重請填 30–250 kg'; return; }
    err.textContent = '';

    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const db = await whenDb();
      const noteText = ($('#w-note').value || '').trim().slice(0, 100);
      await db.add(date, r1(kg), noteText);
      remoteNotes[date] = noteText;
      $('#w-note').value = '';
    } catch (ex) {
      err.textContent = '儲存到雲端失敗，請稍後再試（' + (ex && ex.message ? ex.message : ex) + '）';
      btn.disabled = false;
      return;
    }
    btn.disabled = false;

    const before = computeStats();
    state.weights[date] = r1(kg);
    save();
    $('#w-kg').value = '';
    const fresh = syncBadges();
    const after = computeStats();
    renderAll();

    let msg = '✅ 已記錄 ' + r1(kg).toFixed(1) + ' kg';
    if (p && after.stagesDone > before.stagesDone) {
      const stages = getStages(p);
      const k = after.stagesDone;
      if (k >= stages.length) {
        msg = '🎉 達成最終目標 ' + p.target + ' kg！';
      } else {
        const sg = stages[k - 1];
        msg = '🚩 完成階段 ' + k + '！達成 ' + sg.target + ' kg，' +
          (sg.hold > 0 ? '接下來有 ' + sg.hold + ' 週維持期，把體重穩住' : '繼續往下一關前進');
      }
    }
    toast(msg + badgeNote(fresh));
  }

  /* ---------- 雲端資料（Supabase） ---------- */
  let remoteNotes = {};   // 每天最新一筆的備註（只在畫面上顯示）
  function whenDb() {
    if (window.wlDb) return Promise.resolve(window.wlDb);
    return new Promise((resolve, reject) => {
      window.addEventListener('wldb-ready', () => resolve(window.wlDb), { once: true });
      setTimeout(() => reject(new Error('連不上雲端資料庫')), 15000);
    });
  }

  async function syncRemoteWeights() {
    const note = $('#w-sync');
    if (note) note.textContent = '☁️ 正在讀取雲端記錄…';
    try {
      const db = await whenDb();
      const rows = await db.list();
      const map = {}, notes = {};
      rows.forEach(r => {   // 依建立時間排序，同一天以最新一筆為準
        const kg = Number(r.kg);
        if (isDateStr(r.log_date) && inRange(kg, 30, 250)) { map[r.log_date] = r1(kg); notes[r.log_date] = r.note || ''; }
      });
      state.weights = map;
      remoteNotes = notes;
      save();
      syncBadges();
      renderAll();
      if (note) note.textContent = '☁️ 已同步雲端記錄（' + rows.length + ' 筆）';
    } catch (ex) {
      if (note) note.textContent = '⚠️ 讀取雲端記錄失敗：' + (ex && ex.message ? ex.message : ex);
    }
  }

  function onWeightListClick(e) {
    const btn = e.target.closest('[data-del]');
    if (!btn) return;
    const d = btn.dataset.del;
    if (!confirm('要刪除 ' + showDate(d) + ' 的記錄嗎？')) return;
    delete state.weights[d];
    save();
    renderAll();
    toast('已刪除');
  }

  /* ---------- 打卡事件 ---------- */
  function onHabitChange(e) {
    const cb = e.target.closest('input[data-habit]');
    if (!cb) return;
    const set = new Set(state.habits[selDate] || []);
    if (cb.checked) set.add(cb.dataset.habit); else set.delete(cb.dataset.habit);
    if (set.size) state.habits[selDate] = Array.from(set); else delete state.habits[selDate];
    save();
    const fresh = syncBadges();
    if (fresh.length) toast('🏅 解鎖徽章：' + fresh.join('、'));
    renderCheckinSummary();
    renderDashboard();
    renderBadges();
  }

  function moveDay(delta) {
    const next = fmtDate(addDays(parseDate(selDate), delta));
    if (next > fmtDate(today())) return;
    selDate = next;
    renderChecklist();
    renderCheckinSummary();
  }

  /* ---------- 備份／還原 ---------- */
  function exportData() {
    const payload = { app: 'weight-65', version: 3, exportedAt: new Date().toISOString(), data: state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'slim-backup-' +fmtDate(today()).replace(/-/g, '') + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('📦 已下載備份檔');
  }

  function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let next;
      try {
        const obj = JSON.parse(String(reader.result));
        next = clean(obj && obj.data ? obj.data : obj);
      } catch (e) {
        toast('這個檔案無法讀取，請確認是從本網站下載的備份檔');
        return;
      }
      if (!next.profile && !Object.keys(next.weights).length && !Object.keys(next.habits).length) {
        toast('檔案裡沒有可用的資料');
        return;
      }
      if (!confirm('匯入會覆蓋你目前的所有資料，確定要繼續嗎？')) return;
      state = next;
      save();
      fillForm(state.profile);
      syncBadges();
      renderAll();
      toast('✅ 已匯入備份');
    };
    reader.readAsText(file);
  }

  function resetData() {
    if (!confirm('這會清除這個瀏覽器裡的所有計畫、體重與打卡資料，而且無法復原。確定嗎？')) return;
    state = emptyState();
    try { localStorage.removeItem(KEY); } catch (e) { /* 忽略 */ }
    fillForm(null);
    $('#form-error').textContent = '';
    renderAll();
    toast('已清除全部資料');
  }

  /* ---------- 色彩模式（自動／淺色／深色） ---------- */
  function systemDark() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function getSavedTheme() {
    try {
      const t = localStorage.getItem(THEME_KEY);
      return t === 'light' || t === 'dark' ? t : 'auto';
    } catch (e) { return 'auto'; }
  }

  function applyTheme(t) {
    theme = t;
    const root = document.documentElement;
    if (t === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t);
    const info = THEME_INFO[t];
    $('#theme-ico').textContent = info.icon;
    const btn = $('#theme-toggle');
    btn.setAttribute('aria-label', '色彩模式：' + info.label + '。按一下切換');
    btn.title = '色彩模式：' + info.label;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', (t === 'dark' || (t === 'auto' && systemDark())) ? '#13142b' : '#fffaf2');
  }

  // 每按一下就換到「看得出差別」的下一個模式
  function cycleTheme() {
    const order = systemDark() ? ['auto', 'light', 'dark'] : ['auto', 'dark', 'light'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    try {
      if (next === 'auto') localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, next);
    } catch (e) { /* 無法儲存就只在這次有效 */ }
    applyTheme(next);
    toast(THEME_INFO[next].icon + ' 色彩模式：' + THEME_INFO[next].label);
  }

  /* ---------- 提示訊息 ---------- */
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3600);
  }

  /* ---------- 導覽列：目前所在區塊 ---------- */
  function setupNavHighlight() {
    const links = $$('.nav a');
    const map = {};
    links.forEach(a => { map[a.getAttribute('href').slice(1)] = a; });
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => a.classList.remove('active'));
        const a = map[en.target.id];
        if (a) {
          a.classList.add('active');
          // 手機上導覽列可橫向捲動，讓目前的項目露出來
          const nav = a.parentElement;
          if (nav.scrollWidth > nav.clientWidth) {
            const center = a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2;   // 讓目前的項目靠近中間
            nav.scrollTo({ left: Math.max(0, Math.min(center, nav.scrollWidth - nav.clientWidth)), behavior: 'smooth' });
          }
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- 初始化 ---------- */
  function init() {
    $('#year').textContent = new Date().getFullYear();
    $('#d-quote').textContent = QUOTES[Math.floor(today().getTime() / 86400000) % QUOTES.length];

    applyTheme(getSavedTheme());
    $('#theme-toggle').addEventListener('click', cycleTheme);
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onSystemChange = () => { if (theme === 'auto') applyTheme('auto'); };
      if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
      else if (mq.addListener) mq.addListener(onSystemChange);
    }

    // 日期欄位預設值
    const todayStr = fmtDate(today());
    $('#w-date').value = todayStr;
    $('#w-date').max = todayStr;
    fillForm(state.profile);

    // 事件
    const form = $('#plan-form');
    form.addEventListener('submit', onPlanSubmit);
    form.addEventListener('input', onFormChange);
    form.addEventListener('change', onFormChange);
    form.addEventListener('click', onPlanFormClick);

    $('#w-form').addEventListener('submit', onWeightSubmit);
    $('#w-list').addEventListener('click', onWeightListClick);

    $('#ci-list').addEventListener('change', onHabitChange);
    $('#ci-prev').addEventListener('click', () => moveDay(-1));
    $('#ci-next').addEventListener('click', () => moveDay(1));
    $('#ci-grid').addEventListener('click', e => {
      const cell = e.target.closest('[data-date]');
      if (!cell || cell.disabled) return;
      selDate = cell.dataset.date;
      renderChecklist();
      renderCheckinSummary();
    });

    $('#menu-tabs').addEventListener('click', e => {
      const b = e.target.closest('[data-i]');
      if (!b) return;
      menuDay = Number(b.dataset.i);
      renderMenu(true);
    });
    $('#menu-tabs').addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      menuDay = (menuDay + (e.key === 'ArrowRight' ? 1 : MENU.length - 1)) % MENU.length;
      renderMenu(true);
    });

    $('#btn-export').addEventListener('click', exportData);
    $('#file-import').addEventListener('change', e => { importData(e.target.files[0]); e.target.value = ''; });
    $('#btn-reset').addEventListener('click', resetData);

    // 視窗寬度改變時，圖表重新依寬度繪製
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (String($('#chart').clientWidth) !== $('#chart').dataset.w) renderChart();
      }, 150);
    });

    renderMenu(false);
    syncBadges();
    renderAll();
    setupNavHighlight();
    syncRemoteWeights();
  }

  init();
})();
