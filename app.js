/* Payday Calm — 画面。データは端末の中（localStorage）だけ。外部に送らない。日本語・英語の切り替えつき。 */
(function () {
  "use strict";
  const E = window.PaydayEngine, CFG = window.PC_CONFIG || {};
  const KEY = "paydaycalm.v1";
  const CATS = ["Food", "Home", "Fun", "Transport", "Health", "Other"];
  const EVERY_KEYS = ["month", "2weeks", "week", "quarter", "year", "once"];
  const $ = (s, r) => (r || document).querySelector(s);
  const view = $("#view");
  let tab = "today", cat = "Food", flash = "";

  /* ---------- 日本語の文言（英語の文をキーにする） ---------- */
  const JA = {
    "Today": "今日", "Bills": "請求", "Income": "収入", "Settings": "設定",
    "Let’s set up (1 minute)": "はじめの設定（1分）",
    "Four things. You can change them any time. Nothing leaves this device.": "4つだけ入力します。あとで変えられます。データはこの端末の外に出ません。",
    "Money in your accounts today (type it from your banking app)": "今日の口座のお金（銀行アプリを見て入力）",
    "How do you get paid?": "収入の入り方は？", "I get a regular paycheck": "決まった給料がある", "My income comes in at different times": "収入が入る日がバラバラ",
    "Next payday": "次の給料日", "How often?": "どのくらいの間隔？", "Weekly": "毎週", "Every 2 weeks": "2週間ごと", "Twice a month (1st & 15th)": "月に2回（1日と15日）", "Monthly": "毎月",
    "Start": "はじめる", "Please type your balance, for example 850.": "残高を入力してください。", "Please pick your next payday.": "次の給料日を選んでください。",
    "Available to spend today": "今日使っていいお金", "Missed a few days?": "数日、記録を忘れた？",
    "Add income": "収入を追加", "Log a spend": "支出を記録", "How much?": "いくら？", "Amount": "金額", "Log it": "記録する",
    "Food": "食費", "Home": "家", "Fun": "楽しみ", "Transport": "交通", "Health": "健康", "Other": "その他",
    "Type an amount, for example 4.50.": "金額を入力してください。", "Today so far": "今日ここまで", "Undo": "取り消し",
    "No guilt. Type the balance you see in your banking app today and you’re back on track.": "責めません。今日の銀行アプリの残高を入力すれば、元に戻れます。",
    "Balance today": "今日の残高", "Reset today": "今日から入れ直す", "Type your balance first.": "先に残高を入力してください。", "Fresh start from today.": "今日からやり直しです。",
    "Payday passed. Did your paycheck arrive? Add it so your budget is up to date.": "給料日が過ぎました。給料は入りましたか？ 数字を正しくするために、追加してください。",
    "No bills yet. Add the ones you know about. You can add more later.": "まだ請求がありません。分かっているものを足してください。あとで増やせます。",
    "Done": "終了", "Paid": "払った", "Remove": "削除", "Add a bill": "請求を追加", "Name": "名前", "Next due date": "次の支払い日", "Add bill": "追加",
    "Please fill in the name, amount and date.": "名前・金額・日付を入れてください。",
    "Every month": "毎月", "Every week": "毎週", "Every 3 months": "3か月ごと", "Every year": "毎年", "Just once": "1回だけ",
    "How you get paid": "収入の入り方", "A regular paycheck": "決まった給料", "Income comes in at different times": "収入が入る日がバラバラ", "Which best describes you?": "どちらに近い？",
    "Only money marked Received counts toward today’s number. Invoiced and expected money is shown as “coming soon”.": "「入金済み」のお金だけが、今日の数字に入ります。請求済みや予定のお金は「もうすぐ入るお金」として別に出します。",
    "Money in": "入ってくるお金", "Nothing yet. Add a paycheck or a payment you’re waiting for.": "まだありません。給料や、待っている入金を足してください。",
    "Expected": "予定", "Invoiced (not paid yet)": "請求済み（まだ入金なし）", "Received": "入金済み", "Invoiced": "請求済みにする", "Got paid": "入金された",
    "Add money in": "入金を追加", "Date": "日付", "Status": "状態", "Received (it’s in my account)": "入金済み（口座に入った）", "Invoiced (waiting to be paid)": "請求済み（入金待ち）", "Expected (not invoiced yet)": "予定（まだ請求していない）",
    "Add": "追加", "Please type an amount and a date.": "金額と日付を入れてください。",
    "Final payment date (optional)": "最後の支払い日（あれば。分割払いなど）", "Note (optional)": "メモ（あれば）",
    "Currency symbol": "通貨の記号", "Language": "言語", "Days to look ahead (when income varies)": "何日先まで見るか（収入がバラバラのとき）",
    "Your data": "あなたのデータ", "Your data is stored locally in this browser on this device. Download a backup now and then. You can load it on another device.": "データはこの端末の中だけにあります。ときどきバックアップを保存してください。別の端末で読み込めます。",
    "Download a backup": "バックアップを保存", "Load a backup": "バックアップを読み込む", "Backup loaded.": "バックアップを読み込みました。",
    "That file doesn’t look like a Payday Calm backup.": "このファイルは、Payday Calmのバックアップではないようです。",
    "Erase everything": "すべて消す", "Tap again to erase everything": "もう一度押すと、すべて消えます",
    "How the number works": "数字の仕組み", "Get the full app": "製品版を入手",
    "Available to spend today = (your money − bills coming before payday) ÷ days until payday.": "今日使っていいお金 =（手元のお金 − 給料日までの請求）÷ 給料日までの日数。",
    "Only money marked Received counts. Invoiced or expected money is shown as “coming soon”.": "「入金済み」のお金だけを数えます。請求済みや予定のお金は「もうすぐ入るお金」として別に出します。",
    "When you enter a new balance, earlier expenses and income aren’t counted again.": "新しい残高を入れると、それより前の支出と入金は数えないので、二重にはなりません。",
    "For quarterly and annual bills, the app includes a monthly portion in your budget.": "3か月・1年ごとの請求は、毎月少しずつ取り分けます。",
    "Could not save on this device. Download a backup in Settings.": "この端末に保存できませんでした。設定でバックアップを保存してください。",
    "Demo limit reached. Everything you typed is still here. The full app has no spending-entry limit.": "お試し版の上限です。入力したものは消えません。製品版には上限がありません。"
  };
  const tr = (s) => (S.lang === "ja" && JA[s]) || s;
  const tt = (en, ja) => (S.lang === "ja" ? ja : en);
  const EVERY = () => ({ month: tr("Every month"), "2weeks": tr("Every 2 weeks"), week: tr("Every week"), quarter: tr("Every 3 months"), year: tr("Every year"), once: tr("Just once") });

  const todayStr = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const uid = () => Math.random().toString(36).slice(2, 10);
  const guessLang = () => (String(navigator.language || "").toLowerCase().startsWith("ja") ? "ja" : "en");

  function fresh() { const lang = guessLang(); return { v: 1, setup: false, lang, currency: lang === "ja" ? "¥" : "$", mode: "regular", payday: "", cycle: "biweekly", windowDays: 14, balance: { amount: 0, asOf: "" }, income: [], spends: [], bills: [] }; }
  function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && s.v === 1 ? Object.assign(fresh(), s) : fresh(); } catch (e) { return fresh(); } }
  let S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { flash = tr("Could not save on this device. Download a backup in Settings."); } }

  const dec = () => (S.currency === "¥" ? 0 : 2);
  const fmt = (n) => (n < 0 ? "-" : "") + S.currency + Math.abs(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: dec(), maximumFractionDigits: dec() });
  const num = (v) => { const x = parseFloat(String(v).replace(/[,，、\s]/g, "").replace(/[０-９．]/g, (c) => (c === "．" ? "." : String.fromCharCode(c.charCodeAt(0) - 0xFEE0)))); return isFinite(x) ? x : NaN; };

  function el(tag, cls, text, attrs) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = tr(text);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function raw(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; e.textContent = text; return e; } // 翻訳しない（数字など）
  function field(label, input) { const w = el("div"); const l = el("label", null, label); if (input.id) l.setAttribute("for", input.id); w.append(l, input); return w; }
  function input(id, type, value, extra) { const i = el("input", null, null, Object.assign({ id, type }, extra || {})); i.value = value == null ? "" : value; return i; }
  function select(id, opts, value) { const s = el("select", null, null, { id }); for (const k in opts) { const o = raw("option", null, opts[k]); o.value = k; if (k === value) o.selected = true; s.append(o); } return s; }
  function button(text, cls, fn) { const b = el("button", cls || "", text, { type: "button" }); b.addEventListener("click", fn); return b; }
  function say(msg) { flash = msg; render(); }
  function note(text, cls) { return raw("div", "note " + (cls || ""), text); }
  const ph = (en, ja) => tt(en, ja);
  const langSelect = () => { const s = select("lang", { ja: "日本語", en: "English" }, S.lang); s.addEventListener("change", () => { S.lang = s.value; if (S.setup === false) { S.currency = S.lang === "ja" ? "¥" : "$"; } save(); render(); }); return s; };

  function demoBar() {
    const bar = $("#demobar");
    if (!CFG.demo) { bar.hidden = true; return; }
    bar.hidden = false; bar.textContent = "";
    bar.append(raw("span", null, tt("Free demo · " + S.spends.length + " of " + CFG.demoLimit + " spending entries used", "無料お試し版 · 支出 " + S.spends.length + " / " + CFG.demoLimit)));
    if (CFG.upgradeUrl) { const a = el("a", null, "Get the full app", { href: CFG.upgradeUrl, target: "_blank", rel: "noopener" }); bar.append(a); }
  }

  /* ---------- 最初の設定（4つだけ） ---------- */
  function setupView() {
    const c = el("section", "card");
    const top = el("div", "row"); top.append(el("h2", null, "Let’s set up (1 minute)")); const ls = langSelect(); ls.style.width = "auto"; ls.style.minWidth = "0"; top.append(ls); c.append(top);
    c.append(el("p", "sub", "Four things. You can change them any time. Nothing leaves this device."));
    const f = el("div"); f.style.cssText = "display:flex;flex-direction:column;gap:12px;margin-top:12px";
    const bal = input("s-bal", "text", "", { inputmode: "decimal", placeholder: ph("e.g. 850", "例：85000") });
    const mode = select("s-mode", { regular: tr("I get a regular paycheck"), variable: tr("My income comes in at different times") }, "regular");
    const pd = input("s-pd", "date", E.fromDays(E.toDays(todayStr()) + 14));
    const cyc = select("s-cyc", { weekly: tr("Weekly"), biweekly: tr("Every 2 weeks"), semimonthly: tr("Twice a month (1st & 15th)"), monthly: tr("Monthly") }, "biweekly");
    const pdWrap = el("div"); pdWrap.style.cssText = "display:flex;flex-direction:column;gap:12px";
    pdWrap.append(field("Next payday", pd), field("How often?", cyc));
    mode.addEventListener("change", () => { pdWrap.hidden = mode.value === "variable"; });
    f.append(field("Money in your accounts today (type it from your banking app)", bal), field("How do you get paid?", mode), pdWrap);
    c.append(f);
    const go = button("Start", "primary", () => {
      const b = num(bal.value);
      if (isNaN(b)) return say(tr("Please type your balance, for example 850."));
      S.balance = { amount: b, asOf: todayStr() }; S.mode = mode.value;
      if (mode.value === "regular") { if (!pd.value) return say(tr("Please pick your next payday.")); S.payday = pd.value; S.cycle = cyc.value; }
      S.setup = true; save(); flash = ""; render();
    }); go.style.marginTop = "14px"; go.style.width = "100%";
    c.append(go);
    view.append(c);
    if (/^(192\.168\.|localhost$|127\.0\.0\.1$)/.test(location.hostname)) { // 開発用：家のWi-Fiの中のテストだけ。公開サイトには出ない
      const dev = button("自分用データを読み込む（家のWi-Fi・テスト用）", "", () => {
        fetch("http://" + location.hostname + ":8766/personal.json").then((r) => r.json()).then((o) => { if (!o || o.v !== 1) throw 0; S = Object.assign(fresh(), o); save(); flash = tr("Backup loaded."); render(); }).catch(() => say("読み込めませんでした。Macのサーバーが止まっているか、Wi-Fiが違います。"));
      }); dev.style.cssText = "width:100%;margin-top:12px"; view.append(dev);
    }
  }

  /* ---------- Today ---------- */
  function todayView() {
    const t = todayStr(), r = E.compute(S, t);
    const hero = el("section", "card");
    hero.append(el("h1", null, "Available to spend today"));
    hero.append(raw("div", "big" + (r.status === "over" ? " over" : ""), fmt(r.safeToday)));
    hero.append(raw("p", "sub", S.mode === "variable" ? tt("Looking " + r.daysLeft + " days ahead", r.daysLeft + "日先まで見ています") : tt(r.daysLeft + (r.daysLeft === 1 ? " day" : " days") + " until payday", "給料日まであと" + r.daysLeft + "日")));
    hero.append(raw("p", "sub", tt("Money on hand: " + fmt(r.available) + " · Set aside for bills: " + fmt(r.reserved), "手元のお金 " + fmt(r.available) + " ・請求のために取り分け " + fmt(r.reserved))));
    if (r.comingSoon > 0) hero.append(raw("p", "sub", tt("Coming soon (not counted yet): " + fmt(r.comingSoon), "もうすぐ入るお金（まだ数えていません）：" + fmt(r.comingSoon))));
    if (r.overToday > 0) hero.append(note(tt("You went over today’s amount by " + fmt(r.overToday) + ". That’s okay. Tomorrow’s amount will adjust automatically.", "今日の分を " + fmt(r.overToday) + " 使いすぎました。大丈夫です。明日の数字は自動で調整されます。")));
    if (r.status === "over") hero.append(note(tt("Bills before payday are " + fmt(r.shortfall) + " more than your money. Nothing is wrong with you. Pick one bill to move or pay later.", "給料日までの請求が、手元のお金より " + fmt(r.shortfall) + " 多いです。あなたが悪いのではありません。1つの請求を後ろにずらすか、あとで払うか決めましょう。")));
    view.append(hero);
    if (r.paydayPassed) {
      const n = note(tr("Payday passed. Did your paycheck arrive? Add it so your budget is up to date.")); n.append(" ", button("Add income", "link", () => { tab = "income"; render(); }));
      view.append(n);
    }
    const lg = el("section", "card");
    lg.append(el("h2", null, "Log a spend"));
    const amt = input("l-amt", "text", "", { inputmode: "decimal", placeholder: tr("Amount") });
    const chips = el("div", "chips"); chips.style.margin = "10px 0";
    CATS.forEach((c) => { const b = button(c, "chip" + (c === cat ? " on" : ""), () => { cat = c; chips.querySelectorAll(".chip").forEach((x) => x.classList.toggle("on", x.dataset.cat === c)); }); b.dataset.cat = c; chips.append(b); });
    const add = button("Log it", "primary", () => {
      const a = num(amt.value);
      if (isNaN(a) || a <= 0) return say(tr("Type an amount, for example 4.50."));
      if (CFG.demo && S.spends.length >= CFG.demoLimit) return say(tr("Demo limit reached. Everything you typed is still here. The full app has no spending-entry limit."));
      S.spends.push({ id: uid(), date: t, amount: a, cat }); save(); flash = ""; render();
    });
    add.style.width = "100%";
    lg.append(field("How much?", amt), chips, add);
    view.append(lg);
    const todays = S.spends.filter((s) => s.date === t);
    if (todays.length) {
      const l = el("section", "card"); l.append(el("h2", null, "Today so far"));
      const list = el("div", "list");
      todays.slice().reverse().forEach((s) => { const it = el("div", "item"); const left = el("div", "l", s.cat); const right = el("div", "r"); right.append(fmt(s.amount), " ", button("Undo", "link", () => { S.spends = S.spends.filter((x) => x.id !== s.id); save(); render(); })); it.append(left, right); list.append(it); });
      l.append(list); view.append(l);
    }
    const rs = el("section", "card");
    rs.append(el("h2", null, "Missed a few days?"), el("p", "sub", "No guilt. Type the balance you see in your banking app today and you’re back on track."));
    const nb = input("r-bal", "text", "", { inputmode: "decimal", placeholder: tr("Balance today") }); nb.style.margin = "10px 0";
    rs.append(nb, button("Reset today", "", () => { const b = num(nb.value); if (isNaN(b)) return say(tr("Type your balance first.")); S.balance = { amount: b, asOf: todayStr() }; save(); flash = tr("Fresh start from today."); render(); }));
    view.append(rs);
  }

  /* ---------- Bills ---------- */
  function billsView() {
    const t = todayStr(), EV = EVERY();
    const c = el("section", "card"); c.append(el("h2", null, "Bills"));
    const rows = S.bills.map((b) => ({ b, next: E.nextDue(b, t) })).sort((x, y) => (x.next || "9999").localeCompare(y.next || "9999"));
    if (!rows.length) c.append(el("p", "sub", "No bills yet. Add the ones you know about. You can add more later."));
    const list = el("div", "list");
    rows.forEach(({ b, next }) => {
      const it = el("div", "item"); const l = el("div", "l");
      l.append(raw("div", null, b.name), raw("div", "sub", (next ? tt("Next: ", "次：") + next : tr("Done")) + " · " + EV[b.every]));
      if (b.every === "quarter" || b.every === "year") l.append(raw("div", "sub", tt("Monthly amount to budget for this bill: " + fmt(b.amount / (b.every === "year" ? 12 : 3)), "毎月 " + fmt(b.amount / (b.every === "year" ? 12 : 3)) + " ずつ積み立て")));
      const r = el("div", "r"); r.append(fmt(b.amount), el("br"));
      if (next) r.append(button("Paid", "link", () => { b.paidThrough = next; save(); render(); }));
      r.append(button("Remove", "link danger", () => { S.bills = S.bills.filter((x) => x.id !== b.id); save(); render(); }));
      it.append(l, r); list.append(it);
    });
    c.append(list); view.append(c);
    const f = el("section", "card"); f.append(el("h2", null, "Add a bill"));
    const wrap = el("div"); wrap.style.cssText = "display:flex;flex-direction:column;gap:12px";
    const name = input("b-name", "text", "", { placeholder: ph("e.g. Rent", "例：家賃"), maxlength: 40 });
    const amt = input("b-amt", "text", "", { inputmode: "decimal", placeholder: tr("Amount") });
    const ev = select("b-ev", EV, "month");
    const due = input("b-due", "date", E.fromDays(E.toDays(t) + 7));
    const until = input("b-until", "date", "");
    wrap.append(field("Name", name), field("Amount", amt), field("How often?", ev), field("Next due date", due), field("Final payment date (optional)", until));
    const add = button("Add bill", "primary", () => {
      const a = num(amt.value);
      if (!name.value.trim() || isNaN(a) || a <= 0 || !due.value) return say(tr("Please fill in the name, amount and date."));
      const nb = { id: uid(), name: name.value.trim(), amount: a, every: ev.value, due: due.value }; if (until.value) nb.until = until.value;
      S.bills.push(nb); save(); flash = ""; render();
    });
    f.append(wrap, add); add.style.cssText = "width:100%;margin-top:14px"; view.append(f);
  }

  /* ---------- Income ---------- */
  const NEXT = { expected: "invoiced", invoiced: "received" };
  const LBL = { expected: "Expected", invoiced: "Invoiced (not paid yet)", received: "Received" };
  function incomeView() {
    const t = todayStr();
    const m = el("section", "card"); m.append(el("h2", null, "How you get paid"));
    const mode = select("i-mode", { regular: tr("A regular paycheck"), variable: tr("Income comes in at different times") }, S.mode);
    const wrap = el("div"); wrap.style.cssText = "display:flex;flex-direction:column;gap:12px;margin-top:10px";
    const pd = input("i-pd", "date", S.payday || t); const cyc = select("i-cyc", { weekly: tr("Weekly"), biweekly: tr("Every 2 weeks"), semimonthly: tr("Twice a month (1st & 15th)"), monthly: tr("Monthly") }, S.cycle);
    const pdw = el("div"); pdw.style.cssText = "display:flex;flex-direction:column;gap:12px"; pdw.append(field("Next payday", pd), field("How often?", cyc)); pdw.hidden = S.mode === "variable";
    mode.addEventListener("change", () => { S.mode = mode.value; if (S.mode === "regular" && !S.payday) S.payday = t; save(); render(); });
    pd.addEventListener("change", () => { if (pd.value) { S.payday = pd.value; save(); } }); cyc.addEventListener("change", () => { S.cycle = cyc.value; save(); });
    wrap.append(field("Which best describes you?", mode), pdw); m.append(wrap);
    if (S.mode === "variable") { const p = el("p", "sub", "Only money marked Received counts toward today’s number. Invoiced and expected money is shown as “coming soon”."); p.style.marginTop = "10px"; m.append(p); }
    view.append(m);
    const l = el("section", "card"); l.append(el("h2", null, "Money in"));
    const items = S.income.slice().sort((a, b) => b.date.localeCompare(a.date));
    if (!items.length) l.append(el("p", "sub", "Nothing yet. Add a paycheck or a payment you’re waiting for."));
    const list = el("div", "list");
    items.forEach((i) => {
      const it = el("div", "item"); const left = el("div", "l"); left.append(raw("div", null, fmt(i.amount) + (i.label ? "　" + i.label : "")), raw("div", "sub", i.date + " · " + tr(LBL[i.status])));
      const r = el("div", "r");
      if (NEXT[i.status]) r.append(button(i.status === "expected" ? "Invoiced" : "Got paid", "link", () => { i.status = NEXT[i.status]; if (i.status === "received") i.date = i.date > t ? t : i.date; save(); render(); }));
      r.append(button("Remove", "link danger", () => { S.income = S.income.filter((x) => x.id !== i.id); save(); render(); }));
      it.append(left, r); list.append(it);
    });
    l.append(list); view.append(l);
    const f = el("section", "card"); f.append(el("h2", null, "Add income"));
    const w2 = el("div"); w2.style.cssText = "display:flex;flex-direction:column;gap:12px";
    const amt = input("m-amt", "text", "", { inputmode: "decimal", placeholder: tr("Amount") }); const dt = input("m-dt", "date", t); const lb = input("m-lb", "text", "", { maxlength: 40, placeholder: tr("Note (optional)") });
    const st = select("m-st", { received: tr("Received (it’s in my account)"), invoiced: tr("Invoiced (waiting to be paid)"), expected: tr("Expected (not invoiced yet)") }, "received");
    w2.append(field("Amount", amt), field("Date", dt), field("Status", st), field("Note (optional)", lb));
    const add = button("Add", "primary", () => { const a = num(amt.value); if (isNaN(a) || a <= 0 || !dt.value) return say(tr("Please type an amount and a date.")); S.income.push({ id: uid(), date: dt.value, amount: a, status: st.value, label: lb.value.trim() }); save(); flash = ""; render(); });
    add.style.cssText = "width:100%;margin-top:14px"; f.append(w2, add); view.append(f);
  }

  /* ---------- Settings ---------- */
  function settingsView() {
    const c = el("section", "card"); c.append(el("h2", null, "Settings"));
    const w = el("div"); w.style.cssText = "display:flex;flex-direction:column;gap:12px";
    const ls = langSelect(); w.append(field("Language", ls));
    const cur = select("c-cur", { "$": "US dollar ($)", "€": "Euro (€)", "£": "British pound (£)", "¥": "Japanese yen (¥)", "C$": "Canadian dollar (C$)", "A$": "Australian dollar (A$)" }, S.currency);
    cur.addEventListener("change", () => { S.currency = cur.value; save(); render(); });
    w.append(field("Currency symbol", cur));
    if (S.mode === "variable") { const wd = input("c-wd", "number", S.windowDays, { min: 7, max: 60 }); wd.addEventListener("change", () => { S.windowDays = Math.min(60, Math.max(7, parseInt(wd.value, 10) || 14)); save(); render(); }); w.append(field("Days to look ahead (when income varies)", wd)); }
    c.append(w); view.append(c);
    const b = el("section", "card"); b.append(el("h2", null, "Your data"), el("p", "sub", "Your data is stored locally in this browser on this device. Download a backup now and then. You can load it on another device."));
    const row = el("div"); row.style.cssText = "display:flex;flex-direction:column;gap:10px;margin-top:12px";
    row.append(button("Download a backup", "", () => {
      const blob = new Blob([JSON.stringify(S)], { type: "application/json" }); const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "payday-calm-backup-" + todayStr() + ".json"; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }));
    const fi = el("input", null, null, { type: "file", accept: "application/json,.json", id: "restore" });
    fi.addEventListener("change", () => { const f = fi.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { const o = JSON.parse(rd.result); if (!o || o.v !== 1) throw 0; S = Object.assign(fresh(), o); save(); flash = tr("Backup loaded."); render(); } catch (e) { say(tr("That file doesn’t look like a Payday Calm backup.")); } }; rd.readAsText(f); });
    row.append(field("Load a backup", fi));
    let armed = false; const er = button("Erase everything", "danger", () => { if (!armed) { armed = true; er.textContent = tr("Tap again to erase everything"); return; } const lang = S.lang; S = fresh(); S.lang = lang; save(); flash = ""; render(); }); row.append(er);
    b.append(row); view.append(b);
    const h = el("section", "card"); h.append(el("h2", null, "How the number works"));
    ["Available to spend today = (your money − bills coming before payday) ÷ days until payday.", "Only money marked Received counts. Invoiced or expected money is shown as “coming soon”.", "When you enter a new balance, earlier expenses and income aren’t counted again.", "For quarterly and annual bills, the app includes a monthly portion in your budget."].forEach((t) => h.append(el("p", "sub", t)));
    h.lastChild.style.marginBottom = "0"; view.append(h);
  }

  function render() {
    demoBar(); view.textContent = "";
    document.documentElement.lang = S.lang === "ja" ? "ja" : "en";
    document.querySelectorAll(".tabs button").forEach((b) => { b.classList.toggle("on", b.dataset.tab === tab); b.textContent = tr({ today: "Today", bills: "Bills", income: "Income", settings: "Settings" }[b.dataset.tab]); });
    if (flash) { const n = note(flash); n.setAttribute("role", "status"); view.append(n); }
    if (!S.setup) { $(".tabs").hidden = true; setupView(); return; }
    $(".tabs").hidden = false;
    ({ today: todayView, bills: billsView, income: incomeView, settings: settingsView })[tab]();
    window.scrollTo(0, 0);
  }
  document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; flash = ""; render(); }));
  // 開発用：同じWi-Fiの中のテスト用リンクに限り、?import=（データのアドレス）で、読み込める。公開サイトでは、この条件に合わず、動かない。
  const imp = new URLSearchParams(location.search).get("import");
  if (imp && /^(192\.168\.|localhost$|127\.0\.0\.1$)/.test(location.hostname)) {
    fetch(imp).then((r) => r.json()).then((o) => { if (o && o.v === 1) { S = Object.assign(fresh(), o); save(); flash = tr("Backup loaded."); } history.replaceState(null, "", location.pathname); render(); }).catch(() => { render(); });
  } else render();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
