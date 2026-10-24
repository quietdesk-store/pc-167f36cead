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
  const round2 = (x) => Math.round(x * 100) / 100;

  // 給料日を、今日より後ろへ進める。cycle: weekly | biweekly | semimonthly | monthly
  function nextPayday(payday, cycle, today) {
    let p = payday, passed = false, guard = 0;
    while (toDays(p) <= toDays(today) && guard++ < 1000) {
      passed = true;
      if (cycle === "weekly") p = fromDays(toDays(p) + 7);
      else if (cycle === "biweekly") p = fromDays(toDays(p) + 14);
      else if (cycle === "semimonthly") {
        const [y, m, d] = ymd(p);
        p = d < 15 ? y + "-" + String(m).padStart(2, "0") + "-15" : addMonths(p, 1, 1);
      } else p = addMonths(p, 1);
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
    const stepM = bill.every === "month" ? 1 : bill.every === "quarter" ? 3 : bill.every === "year" ? 12 : 1;
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

  function monthsOf(every) { return every === "quarter" ? 3 : every === "year" ? 12 : 1; }

  /**
   * 今日使える額を計算する。
   * state: { balance:{amount, asOf}, mode:"regular"|"variable", payday?, cycle?, windowDays?(variable既定14),
   *          income:[{date, amount, status}], spends:[{date, amount}], bills:[...] }
   */
  function compute(state, today) {
    const asOf = state.balance && state.balance.asOf ? state.balance.asOf : today;
    const base = state.balance ? Number(state.balance.amount) || 0 : 0;
    const inAfter = (d) => toDays(d) >= toDays(asOf); // 残高を入れた日の分から数える（その日の入金・支出は残高に含まれていないものとして数える）

    const received = (state.income || []).filter((i) => i.status === "received" && inAfter(i.date) && toDays(i.date) <= toDays(today))
      .reduce((a, i) => a + Number(i.amount), 0);
    const spent = (state.spends || []).filter((s) => inAfter(s.date) && toDays(s.date) <= toDays(today))
      .reduce((a, s) => a + Number(s.amount), 0);
    const spentToday = (state.spends || []).filter((s) => s.date === today).reduce((a, s) => a + Number(s.amount), 0);
    const available = base + received - spent;

    // 次の給料日（または、収入がバラバラのモードでは「見通しの日数」）
    let horizonEnd, daysLeft, paydayPassed = false, payday = null;
    if (state.mode === "variable") {
      daysLeft = Math.max(1, Number(state.windowDays) || 14);
      horizonEnd = fromDays(toDays(today) + daysLeft - 1);
    } else {
      const np = nextPayday(state.payday, state.cycle || "biweekly", today);
      payday = np.date; paydayPassed = np.passed;
      daysLeft = Math.max(1, toDays(payday) - toDays(today));
      horizonEnd = fromDays(toDays(payday) - 1);
    }

    // 見通しの間に出ていく請求。数か月に1回のものは、期間内に来なくても「月割り」を取り分ける
    let reserved = 0; const dueList = [];
    for (const b of state.bills || []) {
      const dues = duesBetween(b, today, horizonEnd);
      if (dues.length) { reserved += dues.length * Number(b.amount); dues.forEach((d) => dueList.push({ name: b.name, date: d, amount: Number(b.amount) })); }
      else if (b.every === "quarter" || b.every === "year") {
        reserved += (Number(b.amount) / monthsOf(b.every)) * (daysLeft / 30); // 月割りの取り分
      }
    }
    reserved = round2(reserved);

    // 今日の枠は「今日の朝の時点」で決める（今日すでに使った分を戻して計算）。残りの枠 = 今日の枠 − 今日使った額
    const free = round2(available - reserved);
    const freeStart = round2(free + spentToday);
    const perDay = freeStart > 0 ? Math.floor((freeStart / daysLeft) * 100) / 100 : 0;
    const comingSoon = round2((state.income || []).filter((i) => (i.status === "invoiced" || i.status === "expected"))
      .reduce((a, i) => a + Number(i.amount), 0));
    const safeToday = Math.max(0, round2(perDay - spentToday));
    return {
      today, available: round2(available), reserved, free, daysLeft, payday, paydayPassed,
      allowance: perDay, safeToday, overToday: spentToday > perDay ? round2(spentToday - perDay) : 0,
      shortfall: free < 0 ? round2(-free) : 0, spentToday: round2(spentToday), comingSoon, dueList,
      status: free < 0 ? "over" : freeStart <= 0 ? "none" : "ok",
    };
  }

  return { compute, nextPayday, nextDue, duesBetween, toDays, fromDays, addMonths };
});
