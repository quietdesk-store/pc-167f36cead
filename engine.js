/* Payday Calm — 計算の心臓部（画面なし・外部部品なし）
 * 日付は "YYYY-MM-DD" の文字列。時差でずれないよう、すべてUTCの「日」で数える。
 * 数字の決まり（画面にも説明に書く）:
 *  - 今日使える額 = (使えるお金 − 次の給料日までに出ていく請求) ÷ 給料日までの日数
 *  - 使えるお金に足すのは「入金済み(received)」だけ。「請求済み(invoiced)」「予定(expected)」は別の行（もうすぐ来るお金）
 *  - 残高は「入れた日(asOf)」付き。その日より前の支出・入金は数えない（古い数字と新しい数字を混ぜない）
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PaydayEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const DAY = 86400000;
  const toDays = (s) => { const [y, m, d] = s.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / DAY); };
  const fromDays = (n) => { const t = new Date(n * DAY); return t.getUTCFullYear() + "-" + String(t.getUTCMonth() + 1).padStart(2, "0") + "-" + String(t.getUTCDate()).padStart(2, "0"); };
  const ymd = (s) => s.split("-").map(Number);
  const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m: 1-12
  const addMonths = (s, n, dayOverride) => {
    const [y, m, d] = ymd(s); const idx = (y * 12 + (m - 1)) + n;
    const ny = Math.floor(idx / 12), nm = (idx % 12) + 1;
    const day = Math.min(dayOverride || d, daysInMonth(ny, nm));
    return ny + "-" + String(nm).padStart(2, "0") + "-" + String(day).padStart(2, "0");
  };
  const round2 = (x) => Math.round(x * 100 + (x >= 0 ? 1e-7 : -1e-7)) / 100;

  // 給料日を、今日より後ろへ進める。cycle: weekly | biweekly | semimonthly | monthly
  // anchorDay: 毎月の給料日の「日」（31日の人が2月を通っても28日に固定されないように、最初の日を覚えておく）
  function nextPayday(payday, cycle, today, anchorDay) {
    let p = payday, passed = false, guard = 0; const dom = anchorDay || ymd(payday)[2];
    while (toDays(p) <= toDays(today) && guard++ < 1000) {
      passed = true;
      if (cycle === "weekly") p = fromDays(toDays(p) + 7);
      else if (cycle === "biweekly") p = fromDays(toDays(p) + 14);
      else if (cycle === "semimonthly") {
        const [y, m, d] = ymd(p);
        p = d < 15 ? y + "-" + String(m).padStart(2, "0") + "-15" : addMonths(p, 1, 1);
      } else p = addMonths(p, 1, dom);
    }
    return { date: p, passed };
  }

  // 請求の「次の支払い日」を、from（その日を含む）以降で1つ返す。paidThrough 以前は払い済みとして飛ばす。
  // bill: { every: month|2weeks|week|quarter|year|once, due: "YYYY-MM-DD"(基準日。monthlyは日付の「日」を使う), paidThrough?: "YYYY-MM-DD" }
  function nextDue(bill, from) {
    const d = nextDueRaw(bill, from);
    return d && bill.until && toDays(d) > toDays(bill.until) ? null : d; // until（最後の支払い日）を過ぎたら、もう来ない
  }
  function nextDueRaw(bill, from) {
    const skipBefore = bill.paidThrough ? toDays(bill.paidThrough) + 1 : -Infinity;
    const start = Math.max(toDays(from), skipBefore);
    const base = bill.due, baseD = toDays(base), dom = ymd(base)[2];
    if (bill.every === "once") return baseD >= start ? base : null;
    if (bill.every === "week" || bill.every === "2weeks") {
      const step = bill.every === "week" ? 7 : 14;
      let n = baseD >= start ? baseD : baseD + Math.ceil((start - baseD) / step) * step;
      return fromDays(n);
    }
    const stepM = monthsOf(bill.every);
    let k = 0, c = base, guard = 0;
    while (toDays(c) < start && guard++ < 5000) { k += stepM; c = addMonths(base, k, dom); }
    return c;
  }

  // from〜to（両端を含む）の間に来る支払いを、すべて数える
  function duesBetween(bill, from, to) {
    const out = []; let cur = from, guard = 0;
    while (guard++ < 400) {
      const d = nextDue(bill, cur);
      if (!d || toDays(d) > toDays(to)) break;
      out.push(d); cur = fromDays(toDays(d) + 1);
    }
    return out;
  }

  function monthsOf(every) { if (every === "quarter") return 3; if (every === "year") return 12; const m = /^m(\d+)$/.exec(every || ""); return m ? Math.max(1, Number(m[1])) : 1; }

  /**
   * 今日使える額を計算する。
   * state: { balance:{amount, asOf}, mode:"regular"|"variable", payday?, cycle?, windowDays?(variable既定14),
   *          income:[{date, amount, status}], spends:[{date, amount}], bills:[...] }
   */
  function compute(state, today) {
    const asOf = state.balance && state.balance.asOf ? state.balance.asOf : today;
    const base = state.balance ? Number(state.balance.amount) || 0 : 0;
    // 残高を入れた日の分から数える。ただし「入れ直した時刻(at)」より前に記録したものは、その残高にもう含まれているので数えない（二重に引かない）
    const at = state.balance && state.balance.at ? Number(state.balance.at) : 0;
    const counts = (x) => { const d = toDays(x.date), a = toDays(asOf); if (d > a) return true; if (d < a) return false; return !(at && x.ts && Number(x.ts) <= at); };

    const received = (state.income || []).filter((i) => i.status === "received" && counts(i) && toDays(i.date) <= toDays(today))
      .reduce((a, i) => a + Number(i.amount), 0);
    const spent = (state.spends || []).filter((s) => counts(s) && toDays(s.date) <= toDays(today))
      .reduce((a, s) => a + Number(s.amount), 0);
    // 「払った」を押した請求は、口座から出たお金として1回だけ引く（その請求の取り分けは、払った時点で外れる）
    const paidOut = (state.paid || []).filter((p) => counts(p) && toDays(p.date) <= toDays(today))
      .reduce((a, p) => a + Number(p.amount), 0);
    const spentToday = (state.spends || []).filter((s) => s.date === today).reduce((a, s) => a + Number(s.amount), 0);
    const available = base + received - spent - paidOut;

    // 次の給料日（または、収入がバラバラのモードでは「見通しの日数」）
    let horizonEnd, daysLeft, paydayPassed = false, payday = null;
    if (state.mode === "variable") {
      daysLeft = Math.max(1, Number(state.windowDays) || 14);
      horizonEnd = fromDays(toDays(today) + daysLeft - 1);
    } else {
      const np = state.payday ? nextPayday(state.payday, state.cycle || "biweekly", today) : { date: fromDays(toDays(today) + 14), passed: false };
      payday = np.date; paydayPassed = np.passed;
      daysLeft = Math.max(1, toDays(payday) - toDays(today));
      horizonEnd = fromDays(toDays(payday) - 1);
    }

    // 残高を入れた日の翌日から昨日までに来たのに「払った」を押していない請求は、まだ払っていない（または払ったか分からない）お金として取っておく
    const yesterday = fromDays(toDays(today) - 1), odFrom = fromDays(toDays(asOf) + 1);
    const cd = state.mode === "variable" ? (state.cushionDays == null ? 30 : Math.max(0, Number(state.cushionDays) || 0)) : 0;
    const outerEnd = fromDays(toDays(horizonEnd) + cd);
    // 見通しの間に出ていく請求。数か月に1回のものは、見る期間全体で1回も来なければ「月割り」を取り分ける（終わった支払いは除く）
    let reserved = 0, overdue = 0; const dueList = [], overdueList = [];
    for (const b of state.bills || []) {
      if (toDays(odFrom) <= toDays(yesterday)) duesBetween(b, odFrom, yesterday).forEach((d) => { overdue += Number(b.amount) || 0; overdueList.push({ id: b.id, name: b.name, date: d, amount: Number(b.amount) || 0 }); });
      const dues = duesBetween(b, today, horizonEnd);
      if (dues.length) { reserved += dues.length * Number(b.amount); dues.forEach((d) => dueList.push({ name: b.name, date: d, amount: Number(b.amount) })); }
      else if (monthsOf(b.every) > 1 && nextDue(b, today) && !duesBetween(b, today, outerEnd).length) {
        reserved += (Number(b.amount) / monthsOf(b.every)) * (daysLeft / 30); // 月割りの取り分
      }
    }
    reserved = round2(reserved + overdue); overdue = round2(overdue);

    // 収入がバラバラのモードでは、お金がいつ入るか分からない。だから見通しの先の30日に払うお金（来月の家賃など）も先に取っておく
    let reservedNext = 0;
    if (state.mode === "variable") {
      const nextFrom = fromDays(toDays(horizonEnd) + 1), nextTo = outerEnd;
      if (toDays(nextTo) >= toDays(nextFrom)) for (const b of state.bills || []) reservedNext += duesBetween(b, nextFrom, nextTo).length * Number(b.amount);
    }
    reservedNext = round2(reservedNext);

    // 今日の枠は「今日の朝の時点」で決める（今日すでに使った分を戻して計算）。残りの枠 = 今日の枠 − 今日使った額
    const free = round2(available - reserved - reservedNext - (Number(state.keepAmount) || 0));
    const freeStart = round2(free + spentToday);
    let perDay = freeStart > 0 ? Math.floor((freeStart / daysLeft) * 100 + 1e-6) / 100 : 0;
    const comingSoon = round2((state.income || []).filter((i) => (i.status === "invoiced" || i.status === "expected"))
      .reduce((a, i) => a + Number(i.amount), 0));
    // 収入がバラバラのモード：「先の日ごと」に、そこまでの請求を払っても足りるかを確かめ、いちばん厳しい日に合わせる。
    // （入金済みのお金だけを数える。希望の上限 dailyCap があれば、それを超えない）
    let limit = perDay, shortDate = null, shortAmount = 0, limitDay = null;
    if (state.mode === "variable") {
      const H = daysLeft + (state.cushionDays == null ? 30 : Math.max(0, Number(state.cushionDays) || 0));
      const lastDay = fromDays(toDays(today) + H - 1), keep = Number(state.keepAmount) || 0;
      const events = overdue > 0 ? [{ d: today, a: overdue }] : [];
      for (const b of state.bills || []) duesBetween(b, today, lastDay).forEach((d) => events.push({ d, a: Number(b.amount) }));
      const start = available + spentToday;
      // 「ふつうの月に入るお金の目安」があれば、それが、月に1回、入金の遅れ（既定30日）を見込んだ日に入るものとして、お金が足りるかを確かめる
      const mi0 = Number(state.monthlyIncome) || 0, delay = state.incomeDelayDays == null ? 30 : Math.max(1, Number(state.incomeDelayDays) || 30);
      if (mi0 > 0) for (let k = delay; k <= H; k += 30) events.push({ d: fromDays(toDays(today) + k - 1), a: -mi0 });
      limit = Infinity;
      for (let t = 1; t <= H; t++) {
        const day = fromDays(toDays(today) + t - 1);
        const need = events.filter((e) => toDays(e.d) <= toDays(day)).reduce((a, e) => a + e.a, 0);
        const left = start - need - keep;
        if (left < 0) { if (!shortDate) { shortDate = day; shortAmount = round2(-left); } limit = 0; break; }
        const v = Math.floor((left / t) * 100 + 1e-6) / 100;
        if (v < limit) { limit = v; limitDay = day; }
      }
      if (!isFinite(limit)) limit = 0;
      perDay = limit;
    }
    // 月の収入の目安があれば、「収入 − 毎月の請求 − 毎月取り分けるお金」を30日で割った額も上限にする（月単位の生活費の枠）
    const perMonth = { month: 1, "2weeks": 26 / 12, week: 52 / 12, quarter: 1 / 3, year: 1 / 12, once: 0 };
    const pm = (ev) => (perMonth[ev] != null ? perMonth[ev] : 1 / monthsOf(ev));
    const monthlyBills = round2((state.bills || []).filter((b) => nextDue(b, today)).reduce((a, b) => a + Number(b.amount) * pm(b.every), 0));
    const mi = Number(state.monthlyIncome) || 0;
    const budgetPerDay = state.mode === "variable" && mi > 0 ? Math.max(0, Math.floor(((mi - monthlyBills - (Number(state.monthlySetAside) || 0)) / 30) * 100 + 1e-6) / 100) : null;
    let capped = false;
    if (budgetPerDay != null && budgetPerDay < perDay) { perDay = budgetPerDay; capped = "budget"; }
    const cap = Number(state.dailyCap) || 0;
    if (cap > 0 && perDay > cap) { perDay = cap; capped = true; }
    const safeToday = Math.max(0, round2(perDay - spentToday));
    return {
      today, available: round2(available), reserved, reservedNext, free, daysLeft, payday, paydayPassed,
      allowance: perDay, safeToday, overToday: spentToday > perDay ? round2(spentToday - perDay) : 0,
      shortfall: shortDate ? shortAmount : (state.mode !== "variable" && free < 0) ? round2(-free) : 0, overdue, overdueList, spentToday: round2(spentToday), comingSoon, dueList,
      shortDate, shortAmount, limitDay, capped, budgetPerDay, monthlyBills,
      status: state.mode === "variable" ? (shortDate ? "over" : perDay <= 0 ? "none" : "ok") : (free < 0 ? "over" : freeStart <= 0 ? "none" : "ok"),
    };
  }

  return { compute, monthsOf, nextPayday, nextDue, duesBetween, toDays, fromDays, addMonths };
});
