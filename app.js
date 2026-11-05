/* Payday Calm — 画面。データは端末の中（localStorage）だけ。外部に送らない。日本語・英語の切り替えつき。 */
(function () {
  "use strict";
  const E = window.PaydayEngine, CFG = window.PC_CONFIG || {};
  const KEY = "paydaycalm.v1";
  const CATS = ["Food", "Home", "Fun", "Transport", "Health", "Other"];
  const ICONS = {
    Food: '<path d="M3 10h18l-2 10H5L3 10z"/><path d="M8 10l3-6M16 10l-3-6"/>',
    Home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
    Fun: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z"/>',
    Transport: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14"/><circle cx="9" cy="20" r="1"/><circle cx="15" cy="20" r="1"/>',
    Health: '<path d="M12 5v14M5 12h14"/>',
    Other: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'
  };
  const icon = (c) => { const s = document.createElement("span"); s.className = "ico"; s.setAttribute("aria-hidden", "true"); s.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[c] || ICONS.Other) + "</svg>"; return s; };
  let monthOffset = 0;
  let navStack = [], navLast = "", navGoingBack = false, navPushed = 0;
  function navBack() { const p = navStack.pop(); if (!p) return; const [t0, x0] = p.split("|"); tab = t0; if (t0 === "plan") planMode = x0; if (t0 === "month") monthOffset = Number(x0) || 0; navGoingBack = true; flash = ""; render(); window.scrollTo(0, 0); }
  window.addEventListener("popstate", () => { if (navPushed > 0) navPushed--; if (navStack.length) navBack(); });
  const navBackBtn = () => { if (navPushed > 0) history.back(); else navBack(); }; // 履歴が使える時は履歴で戻り、2重に戻らないようにする
  const EVERY_KEYS = ["month", "2weeks", "week", "quarter", "year", "once"];
  const $ = (s, r) => (r || document).querySelector(s);
  const view = $("#view");
  let tab = "today", cat = "Food", flash = "";

  /* ---------- 日本語の文言（英語の文をキーにする） ---------- */
  const JA = {
    "Today": "今日", "Coming up this week": "今週、払うもの", "Payments": "支払い予定", "Income": "収入", "Settings": "自分の数字", "My numbers": "自分の数字",
    "Let’s set up (1 minute)": "はじめの設定（1分）",
    "Four things. You can change them any time. Nothing leaves this device.": "4つだけ入力します。あとで変えられます。データはこの端末の外に出ません。",
    "Money you have today (cash plus bank). Add them up and enter the total.": "いま持っているお金はいくらですか？（現金と口座を足した合計）",
    "When do you usually get paid?": "お金はいつ入りますか？", "I get paid on a regular schedule.": "決まった日に入ります", "Money comes in on different days.": "入る日は毎回ちがいます（フリーランスなど）",
    "When will you get paid next?": "次にお金が入る日", "How often do you get paid?": "どのくらいおきに入りますか？", "Weekly": "毎週", "Every 2 weeks": "2週間ごと", "Twice a month (1st & 15th)": "月に2回（1日と15日）", "Monthly": "毎月",
    "Start": "はじめる", "Type the amount you have. Example: 850.": "いま持っている金額を入力してください。例：850。", "Choose the next date you’ll get paid.": "次にお金が入る日を選んでください。",
    "Money you can use today": "今日使えるお金", "Missed a few days?": "記録できない日があっても大丈夫",
    "This month": "今月の記録", "Where it went": "使った先", "You recorded": "記録した合計", "Back to Today": "今日の画面に戻る", "Usual spending": "いつもの支出", "Or add a new amount": "新しい金額を入れる", "Pick one": "分類を選ぶ",
    "Only spending you logged is shown. Missed entries and bills are not counted here.": "記録した支出だけを表示しています。記録していない支出や、支払い予定は、ここには入っていません。",
    "Add money": "お金を追加", "Record what you spent": "使ったお金を記録", "How much did you spend?": "いくら使った？", "Amount": "金額", "Add": "追加",
    "Food": "食費", "Home": "家・毎日使うもの", "Fun": "好きなこと・遊び", "Transport": "交通", "Health": "病院・健康", "Other": "その他",
    "Type an amount, for example 4.50.": "使った金額を入れてください。", "Today so far": "今日使ったお金", "Undo": "取り消し",
    "It’s okay. Count the money you have, cash and bank. Type it here. You can start again today.": "大丈夫です。財布と銀行を見て、いま持っているお金を数えましょう。その金額を入れると、今日からまた始められます。",
    "Money you have today": "持っている金額", "Start again with this amount": "この金額で今日から始める", "Type the amount you have first.": "まず、いま持っているお金の合計を入れてください。", "You’re ready to start again today.": "今日からまた始められます。",
    "Your payday has passed. Did you get paid? If so, tap “Add money” below.": "予定の日を過ぎました。お金は入りましたか？入っていたら、下の「お金を追加」を押してください。",
    "No payments added yet. Add the ones you know about. You can add more later.": "まだありません。家賃やスマホ代など、払う予定を追加してください。あとから増やせます。",
    "No next payment": "支払い終わり", "Paid": "払った", "Remove": "削除", "Add a payment": "支払いを追加", "Name": "名前", "Next due date": "次の支払い日", "Add payment": "追加", "Edit": "直す", "Undo paid": "払ったを戻す", "Cancel": "やめる",
    "Enter a name, amount, and date.": "名前・金額・日付を入力してください。",
    "Every month": "毎月", "Every week": "毎週", "Every 3 months": "3か月ごと", "Every 2 months": "2か月ごと", "Every 4 months": "4か月ごと", "Every 6 months": "6か月ごと", "Every year": "毎年", "Just once": "1回だけ",
    "When do you get paid?": "お金はいつ入りますか？", "I get paid on a regular schedule.": "決まった日に入ります", "Money comes in on different days.": "入る日がバラバラ", "Which one is right for you?": "どちらに近いですか？",
    "Only money you have received counts in today’s amount. Money you’re waiting for is shown separately.": "受け取ったお金だけを、今日使える金額に足します。まだ入っていないお金は、別に表示します。",
    "How often do you pay this?": "どのくらいおきに払いますか？", "Money arrived": "入った", "Payments": "支払い予定", "Add payment": "追加", "Money coming in": "入ってくるお金", "Try it with example numbers first": "まず、例の数字でためす", "Re-enter how much money you have now": "いま持っているお金を入れ直す", "Use my own numbers": "自分の金額で始める", "No money added yet. Add your pay or money you expect to get.": "まだありません。給料や、これから入るお金を入れてください。",
    "Expected": "入る予定", "I asked for payment (not paid yet)": "請求した（まだ入っていない）", "In my account": "入った", "Ask for payment": "請求した（相手へは連絡しません）",
    "Add money coming in": "入ってくるお金を追加", "Date": "日付", "Status": "状態", "In my account": "入った（手元にある）", "I asked for payment (not paid yet)": "払ってほしいと伝えた（まだ入っていない）", "Expected (I haven’t asked for payment yet)": "入る予定（まだ伝えていない）",
    "Add": "追加", "Please type an amount and a date.": "金額と日付を入れてください。",
    "Final payment date (optional)": "最後に払う日（分けて払う時など。なければ空欄）", "Note (optional)": "メモ（あれば）",
    "Currency symbol": "お金の単位", "Language": "言語", "How many days should the app plan for? (when you get paid on different days)": "お金が入る日が毎回ちがう人向け：何日分で計算しますか？（例：14 → 今日から14日分のお金を、14で割って1日の金額にします）", "How many days after that should the app also set aside for? (0 = none)": "その先に払うもの（来月の家賃など）も、何日先まで先に取っておきますか？（例：30 → 上の日数のあと30日以内に払うものを先に引きます。0＝引かない）", "Yes, close enough": "はい、近いです", "No, I’ll enter it again": "いいえ、入れ直します", "Money to set aside until payday (savings, or just in case)": "今回の給料日まで取っておくお金（貯金・もしものため）", "My own daily limit (optional, 0 = none)": "1日に使うお金を決めたい時は、その金額を入れます（なくてもOK。0＝決めない）", "Income you expect in a normal month (optional, 0 = none)": "ふつうの月に、だいたいいくら入りますか？（なくてもOK。入れると、1日に使える金額が月の収入に収まるようにします。0＝なし）", "Money you set aside every month (tax, medical, savings)": "毎月、使わずに取っておくお金（税金・医療・貯金など）",
    "Your saved information": "保存した記録", "Your information stays in this app on this device. It isn’t sent anywhere. Save a copy now and then. You can load it on another device.": "記録は、このスマホやパソコンの中に保存します。外には送りません。ときどき、コピーをファイルに保存してください。別のスマホやパソコンで戻せます。",
    "Save a copy": "記録をファイルに保存", "Load a saved copy": "保存した記録を開く", "Your saved information is back.": "記録が戻りました。",
    "I can’t use this file. Choose a file saved from Payday Calm.": "このファイルから記録を戻せませんでした。Payday Calmで保存したファイルを選んでください。",
    "Delete all saved information": "保存した記録を全部消す", "Tap again to delete it all.": "すべて消すには、もう一度押してください。",
    "How we work out today’s amount": "今日使えるお金の出し方", "Get the full app": "製品版を入手",
    "(Money you have − bills to pay before payday − money set aside) ÷ days until payday": "（持っているお金 − 次にお金が入る日までに払うお金 − 取っておくお金）÷ 次にお金が入る日までの日数",
    "Only money you have received is counted. Money you’re waiting for is shown separately.": "入ったお金だけを使います。まだ入っていないお金は、別に出ます。",
    "When you enter today’s amount again, the app won’t count earlier spending or money received twice.": "今日の金額を入れ直すと、前に使ったお金や入ったお金を二重に数えません。",
    "For bills you pay every 3 or 12 months, the app sets aside a little each month.": "3か月や1年ごとに払うお金は、毎月分に分けて考えます。銀行のお金は動きません。",
    "Your information wasn’t saved. In “My numbers”, save a copy of your information.": "記録を保存できませんでした。「自分の数字」の下の方から、記録をファイルに保存してください。",
    "The demo has reached its limit. Your entries are still here. In the full app, you can record spending as often as you need.": "お試し版で記録できる数に達しました。入れた記録は残っています。製品版では、使ったお金を何度でも記録できます。"
  };
  const varMode = () => S.mode === "variable";
  const PDOM = () => (S.payday ? Number(String(S.payday).split("-")[2]) : undefined);
  const winN = () => (S.windowDays || 14);
  const BEFORE_JA = () => (varMode() ? "この先" + winN() + "日で払うお金" : "次にお金が入る日までに払うお金");
  const BEFORE_EN = () => (varMode() ? "bills in the next " + winN() + " days" : "bills before payday");
  const tr = (s) => {
    if (S.lang === "ja" && s.indexOf("(Money you have − bills in the next ") === 0) return "（持っているお金 − この先に払うお金 − 取っておくお金）÷ " + winN() + "日（いちばん苦しい日に合わせた目安）";
    return (S.lang === "ja" && JA[s]) || s;
  };
  const tt = (en, ja) => (S.lang === "ja" ? ja : en);
  const MONS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmtDate = (d) => { const x = String(d).split("-"); return S.lang === "ja" ? Number(x[1]) + "/" + Number(x[2]) : MONS[Number(x[1]) - 1] + " " + Number(x[2]); };
  const EVERY = () => ({ month: tr("Every month"), "2weeks": tr("Every 2 weeks"), week: tr("Every week"), m2: tr("Every 2 months"), quarter: tr("Every 3 months"), m4: tr("Every 4 months"), m6: tr("Every 6 months"), year: tr("Every year"), custom: tt("Other (choose the number of months)", "ほか（何か月おきか選ぶ）"), once: tr("Just once") });

  const todayStr = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const uid = () => Math.random().toString(36).slice(2, 10);
  const guessLang = () => (String(navigator.language || "").toLowerCase().startsWith("ja") ? "ja" : "en");

  let saveFailed = false, loadBroken = false, userActed = false, focusFlash = false, brokenRaw = "", brokenKept = false, rawDownloaded = false, rawDlStarted = false;
  function fresh() { const lang = guessLang(); return { v: 1, setup: false, lang, currency: lang === "ja" ? "¥" : "$", mode: "regular", payday: "", cycle: "biweekly", windowDays: 14, balance: { amount: 0, asOf: "" }, income: [], spends: [], bills: [], favs: [] }; }
  function fromSaved(o) { const m = Object.assign(fresh(), o); if (!Array.isArray(o.keeps)) delete m.keeps; return migrate(m); }
  const looksOurs = (o) => !!o && typeof o === "object" && o.v === 1 && ("balance" in o || "bills" in o || "spends" in o || "setup" in o) && ["income", "spends", "bills", "paid", "keeps"].every((k) => o[k] == null || Array.isArray(o[k]));
  function restoreFrom(o) {
    if (!looksOurs(o)) throw 0;
    S = fromSaved(o); save();
    flash = saveFailed ? tt("The file was read, but your information couldn’t be saved on this device. Storage may be full or blocked. Check your device’s storage and settings, then try again.", "ファイルは読めましたが、この端末に保存できませんでした。保存場所がいっぱいか、使えない設定かもしれません。端末の空きと設定を確かめてから、もう一度戻してください。") : tr("Your saved information is back.");
    render();
  }
  function load() {
    let raw = null; try { raw = localStorage.getItem(KEY); } catch (e) { return fresh(); }
    try { const s = JSON.parse(raw); if (s && s.v === 1 && typeof s === "object") return fromSaved(s); } catch (e) { /* 下で別に残す */ }
    // 読めない記録（壊れた・新しい版など）は消さずに別の名前で残しておく（あとで直せるように）
    if (raw) { loadBroken = true; brokenRaw = raw; try { const kk = KEY + ".kept-" + Date.now(); localStorage.setItem(kk, raw); brokenKept = localStorage.getItem(kk) === raw; } catch (e) { brokenKept = false; } }
    return fresh();
  }
  // 古い『取っておく額』1つを、名前つきの1件に移す（合計は変わらない）
  function migrate(s) {
    // 壊れた形でも画面が止まらないように、形をそろえる
    const D8 = /^\d{4}-\d{2}-\d{2}$/, td = todayStr(), arr = (x) => (Array.isArray(x) ? x.filter((i) => i && typeof i === "object") : []);
    ["income", "spends", "bills", "paid", "favs", "accounts", "keepLog"].forEach((k) => { s[k] = arr(s[k]); });
    if (s.keeps != null && !Array.isArray(s.keeps)) s.keeps = [];
    if (Array.isArray(s.keeps)) s.keeps = arr(s.keeps);
    const amt = (o) => { o.amount = Number(o.amount) || 0; };
    s.spends = s.spends.filter((x) => D8.test(String(x.date))); s.spends.forEach(amt);
    s.income = s.income.filter((x) => D8.test(String(x.date))); s.income.forEach(amt);
    s.paid = s.paid.filter((x) => D8.test(String(x.date))); s.paid.forEach(amt);
    s.bills.forEach((b) => { amt(b); if (!D8.test(String(b.due))) b.due = td; if (b.until && !D8.test(String(b.until))) delete b.until; if (b.paidThrough && !D8.test(String(b.paidThrough))) delete b.paidThrough; if (!b.id) b.id = "b" + Math.random().toString(36).slice(2, 9); b.name = String(b.name == null ? "" : b.name); });
    (s.accounts || []).forEach(amt);
    if (!s.balance || typeof s.balance !== "object") s.balance = { amount: 0, asOf: td };
    s.balance.amount = Number(s.balance.amount) || 0; if (!D8.test(String(s.balance.asOf))) s.balance.asOf = td;
    if (s.payday && !D8.test(String(s.payday))) s.payday = td;
    if (!Array.isArray(s.keeps)) { s.keeps = (Number(s.keepAmount) > 0) ? [{ id: "k0", name: s.lang === "ja" ? "取っておく" : "Set aside", amount: Number(s.keepAmount) }] : []; } return s; }
  const keepSum = () => round2c((S.keeps || []).reduce((a, k) => a + (Number(k.amount) || 0), 0));
  const syncKeep = () => { S.keepAmount = keepSum(); };
  // 取っておくお金の増減を、日付つきで残す
  // 入ったお金から、決めた割合（税金など）を自動で「取っておくお金」に足す。入金ごとに足した額を taxed に覚えておき、直す・消す時に戻す
  const roundC = (x) => { const m = Math.pow(10, dec()); return Math.round(x * m) / m; };
  function taxKeep() { S.keeps = S.keeps || []; let k = S.keeps.find((x) => x.id === "tax"); if (!k) { k = { id: "tax", name: tt("Tax (auto)", "税金（自動）"), amount: 0 }; S.keeps.push(k); } return k; }
  function taxOn(i) {
    const pct = i.taxLater ? Number(i.taxLaterPct) || Number(S.taxPct) || 0 : Number(S.taxPct) || 0; if (i.status !== "received" || i.taxPct != null || pct <= 0) return 0;
    if (i.date > todayStr()) { i.taxLater = true; i.taxLaterPct = pct; return 0; } // まだ来ていない日の入金は、入れた時の割合で、その日になってから取り分ける
    delete i.taxLater; delete i.taxLaterPct; const a = roundC(Number(i.amount) * pct / 100); i.taxed = a; i.taxPct = pct; if (a <= 0) return 0;
    const k = taxKeep(); logKeep(k.name, k.amount, roundC(k.amount + a)); k.amount = roundC(k.amount + a); syncKeep(); return a;
  }
  // 減らす時は、ほかの入金の分（まだ取っておくべき額）は残す。本人が手で減らした分（払った分）を、ほかの入金の分まで消さないため
  function taxShrink(by, except) {
    const k = taxKeep(), others = roundC((S.income || []).filter((x) => x !== except && x.taxed > 0).reduce((t, x) => t + x.taxed, 0) + (except && except.taxed > 0 && by < except.taxed ? except.taxed - by : 0));
    const to = Math.max(0, roundC(k.amount - by), Math.min(k.amount, others)); logKeep(k.name, k.amount, to); k.amount = to; syncKeep();
  }
  const hasTaxKeep = () => (S.keeps || []).some((x) => x.id === "tax");
  function taxSet(i, newAmount) {
    if (i.taxPct == null) return; if (!hasTaxKeep() && Number(newAmount) <= Number(i.amount)) return;
    const na = roundC(Number(newAmount) * i.taxPct / 100), d = roundC(na - (i.taxed || 0));
    if (d > 0) { const k = taxKeep(); logKeep(k.name, k.amount, roundC(k.amount + d)); k.amount = roundC(k.amount + d); syncKeep(); i.taxed = na; }
    else if (d < 0) { taxShrink(-d, i); i.taxed = na; }
  }
  function taxOff(i) { if (i.taxPct == null || !(i.taxed > 0) || !hasTaxKeep()) return; taxShrink(i.taxed, i); delete i.taxed; delete i.taxPct; }
  function taxCatchUp() { let ch = false; if (!(S.income || []).some((i) => i.taxLater)) return; (S.income || []).forEach((i) => { if (i.taxLater && i.date <= todayStr()) { if (Number(S.taxPct) > 0) taxOn(i); else { delete i.taxLater; delete i.taxLaterPct; i.taxPct = 0; i.taxed = 0; } ch = true; } }); if (ch) save(); }
  const taxMsg = (a) => (a > 0 ? tt(fmt(a) + " was set aside for tax in the app (" + S.taxPct + "%).", "税金として " + fmt(a) + " を取っておきました（" + S.taxPct + "%）。") : "");
  function logKeep(name, from, to, removed) { from = Number(from) || 0; if (from === to && !removed) return; (S.keepLog = S.keepLog || []).push({ id: uid(), ts: Date.now(), date: todayStr(), name, from, to, removed: !!removed }); if (S.keepLog.length > 200) S.keepLog = S.keepLog.slice(-200); }
  let S = load();
    document.addEventListener("click", () => { userActed = true; }, true); document.addEventListener("keydown", () => { userActed = true; }, true);
  function save() { if (loadBroken && (!userActed || (!brokenKept && !rawDownloaded))) { if (userActed) saveFailed = true; return; } try { localStorage.setItem(KEY, JSON.stringify(S)); saveFailed = false; } catch (e) { saveFailed = true; } }

  const dec = () => (S.currency === "¥" ? 0 : 2);
  const fmt = (n) => { const m = Math.pow(10, dec()), a = Math.round(Math.abs(Number(n) || 0) * m + 1e-7) / m; return (n < 0 && a > 0 ? "−" : "") + S.currency + a.toLocaleString("en-US", { minimumFractionDigits: dec(), maximumFractionDigits: dec() }); };
  const num = (v) => { const t0 = String(v == null ? "" : v).replace(/[,，、\s]/g, "").replace(/[０-９．－]/g, (c) => (c === "．" ? "." : c === "－" ? "-" : String.fromCharCode(c.charCodeAt(0) - 0xFEE0))); if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t0)) return NaN; const x = Number(t0); if (!isFinite(x) || Math.abs(x) > 1e12) return NaN; const m = Math.pow(10, dec()); return Math.round(x * m) / m; };

  function el(tag, cls, text, attrs) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = tr(text);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function raw(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; e.textContent = text; return e; } // 翻訳しない（数字など）
  function field(label, input) { const w = el("div"); const l = el("label", null, label); if (input.id) l.setAttribute("for", input.id); w.append(l, input); return w; }
  function input(id, type, value, extra) { const i = el("input", null, null, Object.assign({ id, type }, extra || {})); if (!i.getAttribute("aria-label") && i.getAttribute("placeholder")) i.setAttribute("aria-label", /^(ka|aa)-/.test(id || "") || i.getAttribute("placeholder") === "0" ? tt("Amount", "金額") : i.getAttribute("placeholder")); i.value = value == null ? "" : value; return i; }
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
    bar.append(raw("span", null, tt("Free demo · " + S.spends.length + " of " + CFG.demoLimit + " spending entries used", "無料お試し版 · 使ったお金 " + S.spends.length + " / " + CFG.demoLimit)));
    if (CFG.upgradeUrl) { const a = el("a", null, "Get the full app", { href: CFG.upgradeUrl, target: "_blank", rel: "noopener" }); bar.append(a); }
  }

  function applySample() {
    const ja = S.lang === "ja", t0 = todayStr();
    S.balance = { amount: ja ? 85000 : 1500, asOf: t0 }; S.mode = "regular"; S.cycle = "biweekly"; S.payday = E.fromDays(E.toDays(t0) + 14);
    S.bills = [{ id: uid(), name: ja ? "家賃（例）" : "Rent (sample)", amount: ja ? 60000 : 800, every: "month", due: E.fromDays(E.toDays(t0) + 7) }];
    S.income = []; S.spends = []; S.setup = true; S.sample = true; save();
  }
  /* ---------- 最初の設定（4つだけ） ---------- */
  function setupView() {
    const c = el("section", "card");
    const top = el("div", "row"); top.append(el("h2", null, "Let’s set up (1 minute)")); const ls = langSelect(); ls.style.width = "auto"; ls.style.minWidth = "0"; top.append(ls); c.append(top);
    { const pr = el("div", "promise"); pr.append(raw("p", "promisebig", tt("Stop overspending. Know how much you need to earn each month.", "使いすぎを防ぐ。毎月いくら入れば暮らせるかが、すぐ分かる。")), raw("p", "sub", tt("Made for people who find money maths hard or tend to spend too much. Type in what you have and what you pay. The app tells you how much you can use today.", "計算が苦手な人、つい使いすぎてしまう人のためのアプリです。いま持っているお金と、払うお金を入れると、今日使っていいお金を教えてくれます。"))); c.append(pr); }
    c.append(el("p", "sub", "Four things. You can change them any time. Nothing leaves this device."));
    const f = el("div"); f.style.cssText = "display:flex;flex-direction:column;gap:12px;margin-top:12px";
    const bal = input("s-bal", "text", "", { inputmode: "decimal", placeholder: ph("e.g. 850", "例：85000") });
    const mode = select("s-mode", { regular: tr("I get paid on a regular schedule."), variable: tr("Money comes in on different days.") }, "regular");
    const pd = input("s-pd", "date", E.fromDays(E.toDays(todayStr()) + 14));
    const cyc = select("s-cyc", { weekly: tr("Weekly"), biweekly: tr("Every 2 weeks"), semimonthly: tr("Twice a month (1st & 15th)"), monthly: tr("Monthly") }, "biweekly");
    const pdWrap = el("div"); pdWrap.style.cssText = "display:flex;flex-direction:column;gap:12px";
    pdWrap.append(field("When will you get paid next?", pd), field("How often do you get paid?", cyc));
    mode.addEventListener("change", () => { pdWrap.style.display = mode.value === "variable" ? "none" : "flex"; });
    f.append(field("Money you have today (cash plus bank). Add them up and enter the total.", bal), field("When do you usually get paid?", mode), pdWrap);
    c.append(f);
    const go = button("Start", "primary", () => {
      const b = num(bal.value);
      if (isNaN(b)) return say(tr("Type the amount you have. Example: 850."));
      S.balance = { amount: b, asOf: todayStr() }; S.mode = mode.value;
      if (mode.value === "regular") { if (!pd.value) return say(tr("Choose the next date you’ll get paid.")); S.payday = pd.value; S.cycle = cyc.value; }
      S.setup = true; save(); flash = ""; render();
    }); go.style.marginTop = "14px"; go.style.width = "100%";
    c.append(go);
    const sm = button("Try it with example numbers first", "", () => { applySample(); flash = ""; render(); }); sm.style.cssText = "width:100%;margin-top:10px"; c.append(sm);
    { const rf = el("input", null, null, { type: "file", accept: "application/json,.json", id: "restore" }); rf.addEventListener("change", () => { const f = rf.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { const o = JSON.parse(rd.result); restoreFrom(o); } catch (e) { say(tr("I can’t use this file. Choose a file saved from Payday Calm.")); } }; rd.readAsText(f); });
      const rw = field(tt("Have a saved copy? Load it here", "保存した記録があれば、ここから戻せます"), rf); rw.style.marginTop = "14px"; c.append(rw); }
    view.append(c);
    if (/^(192\.168\.|localhost$|127\.0\.0\.1$)/.test(location.hostname)) { // 開発用：家のWi-Fiの中のテストだけ。公開サイトには出ない
      const dev = button("自分用データを読み込む（家のWi-Fi・テスト用）", "", () => {
        fetch("http://" + location.hostname + ":8766/personal.json").then((r) => r.json()).then((o) => { restoreFrom(o); }).catch(() => say("読み込めませんでした。Macのサーバーが止まっているか、Wi-Fiが違います。"));
      }); dev.style.cssText = "width:100%;margin-top:12px"; view.append(dev);
    }
  }

  /* ---------- Today ---------- */
  const round2c = (x) => Math.round(x * 100) / 100;
  // 金額をタップすると、その場で数字を入れ直せる
  function tapNum(text, cur, onSave, tag, rule, name) { rule = rule || "pos";
    const sp = el(tag || "span", "tapnum", text); sp.setAttribute("role", "button"); sp.tabIndex = 0; sp.setAttribute("aria-label", name ? tt("Change amount " + text + " for " + name, name + " の金額 " + text + " を直す") : tt("Change amount " + text, "金額 " + text + " を直す")); if (name) sp.dataset.named = "1";
    const open = (ev) => {
      if (ev) ev.stopPropagation();
      const box = el("span", "tapedit"), inp = input("", "text", cur, { inputmode: "decimal", "aria-label": tt("New amount", "新しい金額") });
      const done = () => { const v = num(inp.value); if (isNaN(v) || (rule === "pos" && v <= 0) || (rule === "zero" && v < 0)) return say(rule === "pos" ? tt("Please type an amount more than 0.", "0より大きい金額を入れてください。") : rule === "zero" ? tt("Please type an amount (0 or more).", "金額を入れてください（0以上）。") : tt("Please type an amount.", "金額を入れてください。")); onSave(v); };
      const ok = button(tt("Save", "保存"), "", done), no = button(tt("Cancel", "やめる"), "link", () => box.replaceWith(sp));
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") done(); });
      box.append(inp, ok, no); sp.replaceWith(box); inp.focus(); inp.select();
    };
    sp.addEventListener("click", open); sp.addEventListener("keydown", (e) => { if (e.key === "Enter") open(e); });
    return sp;
  }
  function todayView() {
    const t = todayStr(), r = E.compute(S, t); let rsRef = null;
    const hero = el("section", "card hero");
    hero.append(el("h1", null, "Money you can use today"));
    { const fl = Math.floor(r.safeToday * Math.pow(10, dec()) + 1e-6) / Math.pow(10, dec()), bg = raw("div", "big" + (r.status === "over" ? " over" : ""), fmt(fl)), ln = fmt(fl).length; if (ln > 9) bg.style.fontSize = Math.max(26, Math.floor(56 * 9 / ln)) + "px"; hero.append(bg); }
    { const sp0 = S.spends.filter((x) => x.date === t).reduce((q, x) => q + (Number(x.amount) || 0), 0), cap0 = Number(r.allowance) || 0; if (sp0 > 0 && cap0 > 0) { const mt = el("div", "meter"); const mf = el("div", "meterfill"); mf.style.width = Math.min(100, Math.round(sp0 / cap0 * 100)) + "%"; if (sp0 > cap0) mf.classList.add("over"); mt.append(mf); hero.append(mt, raw("p", "sub", tt("Used today: " + fmt(sp0) + " of " + fmt(cap0), "今日もう使った額：" + fmt(sp0) + "（今日の枠 " + fmt(cap0) + "）"))); } }
    hero.append(raw("p", "sub", S.mode === "variable" ? (r.limitDay && !r.capped && !(r.safeToday > 0) ? tt("Right now there is nothing left to use today after bills and money you keep aside.", "いまは、払うお金と取っておくお金を引くと、今日使えるお金が残りません。") : r.limitDay && !r.capped ? (() => { const n = E.toDays(r.limitDay) - E.toDays(t) + 1; return tt("Planned to last " + n + " days (until " + fmtDate(r.limitDay) + "), even if no money comes in", "お金が入らなくても、" + n + "日先（" + fmtDate(r.limitDay) + "）までもつ額です"); })() : r.capped === "budget" ? tt("Based on your monthly plan", "月の計画に合わせた額です") : r.capped ? tt("Your own daily limit", "自分で決めた1日分の金額です") : tt("Looking " + r.daysLeft + " days ahead", "これから" + r.daysLeft + "日分のお金で考えています")) : tt(r.daysLeft + (r.daysLeft === 1 ? " day" : " days") + " until payday", "次にお金が入る日まで、あと" + r.daysLeft + "日")));
    hero.append(raw("p", "sub", tt("This is an estimate of what you have left to spend today on things like food and household items. If it feels like too much, add money you want to leave untouched under “Money you keep aside”.", "食費や日用品など、今日使うお金ぜんぶの枠です。多く感じる時は、手をつけたくない分を「取っておくお金」に入れてください。")), button(tt("Set money aside", "取っておくお金を入れる"), "link", () => { tab = "settings"; render(); setTimeout(() => { const f1 = document.getElementById("keep-block"); if (f1) f1.scrollIntoView({ block: "center" }); }, 50); }), button(tt("Change the picture", "絵を変える"), "link", () => { tab = "settings"; render(); setTimeout(() => { const f2 = document.getElementById("c-art"); if (f2) f2.scrollIntoView({ block: "center" }); }, 50); }));
    hero.append(button("Re-enter how much money you have now", "link", () => { if (rsRef) { rsRef.open = true; rsRef.scrollIntoView({ behavior: "smooth", block: "center" }); const nbx = rsRef.querySelector("input"); if (nbx) nbx.focus(); } }));
    const why = el("details", "card why"); why.append(raw("summary", null, tt("See how this is worked out", "どうやって出したか見る")));
    const spentT = S.spends.filter((x) => x.date === t).reduce((a, x) => a + x.amount, 0), leftAfter = r.available + spentT - r.reserved - r.reservedNext - (S.keepAmount || 0), perDay = r.allowance;
    (varMode() ? [
      tt("1. Money you have this morning: " + fmt(r.available + spentT), "① 今日の朝、持っていたお金：" + fmt(r.available + spentT)),
      tt("2. Look at each day ahead (about " + (r.daysLeft + (S.cushionDays == null ? 30 : S.cushionDays)) + " days" + (S.mode === "variable" ? ": the " + r.daysLeft + " days of your planning period plus " + (S.cushionDays == null ? 30 : S.cushionDays) + " extra days beyond it" : ": the days until payday plus " + (S.cushionDays == null ? 30 : S.cushionDays) + " extra days") + "). This is only how far ahead the app looks, not how long your money lasts. For each day, take away the bills due by then" + ((S.keepAmount > 0) ? " and the money you keep untouched (" + fmt(S.keepAmount) + ")" : "") + ", and divide what is left by the number of days up to that day.", "② これから約" + (r.daysLeft + (S.cushionDays == null ? 30 : S.cushionDays)) + "日分（" + (S.mode === "variable" ? "見通しの" + r.daysLeft + "日＋その先の" : "次の給料日までの" + r.daysLeft + "日＋その先の") + (S.cushionDays == null ? 30 : S.cushionDays) + "日）を、1日ずつ見ます（これは見る範囲の長さで、お金が何日もつかとは別です）。その日までに払う請求" + ((S.keepAmount > 0) ? "と、手をつけずに残すお金（" + fmt(S.keepAmount) + "）" : "") + "を引いて、残りを、その日までの日数で割ります。"),
      tt("3. The tightest day sets today’s amount: " + fmt(Math.floor(r.allowance * Math.pow(10, dec()) + 1e-6) / Math.pow(10, dec())) + " a day" + (r.capped === "budget" ? " (your monthly plan)" : r.capped ? " (your own limit)" : ""), "③ いちばん厳しい日に合わせた額が、今日使えるお金です：1日 " + fmt(Math.floor(r.allowance * Math.pow(10, dec()) + 1e-6) / Math.pow(10, dec())) + (r.capped === "budget" ? "（月の計画：収入 − 毎月の請求 − 取り分け ÷ 30 ＝ " + fmt(r.budgetPerDay) + "）" : r.capped ? "（自分で決めた金額）" : "")),
      tt("4. Take away what you already spent today (" + fmt(spentT) + "). The rest is “Money you can use today”.", "④ 今日もう使ったお金（" + fmt(spentT) + "）を引く。残りが「今日使えるお金」です。")
    ] : [
      tt("1. Money you have this morning: " + fmt(r.available + spentT), "① 今日の朝、持っていたお金：" + fmt(r.available + spentT)),
      tt("2. Take away " + BEFORE_EN() + ": " + fmt(r.reserved), "② 次にお金が入る日までに払う分を引きます：" + fmt(r.reserved)),
 r.reservedNext > 0 ? tt("2. Also keep the bills coming in the 30 days after that: " + fmt(r.reservedNext) + " (because you don’t know when money arrives)", "② その先の30日に払うお金も取っておく：" + fmt(r.reservedNext) + "（お金がいつ入るか分からないので、先に確保します）") : null,
      (S.keepAmount > 0) ? tt("2. Money set aside (savings, emergencies, and automatic tax set-asides): " + fmt(S.keepAmount), "② 取っておくお金（貯金・もしものため・税金の自動取り分）：" + fmt(S.keepAmount)) : null,
      tt("3. Daily amount: what is left (" + fmt(leftAfter) + ") shared over " + r.daysLeft + " days, adjusted for any limit you set: " + fmt(Math.floor(perDay * Math.pow(10, dec()) + 1e-6) / Math.pow(10, dec())), "③ 1日分：残りの " + fmt(leftAfter) + " を " + r.daysLeft + "日で分けた額（自分で決めた上限があれば、それに合わせます）：" + fmt(Math.floor(perDay * Math.pow(10, dec()) + 1e-6) / Math.pow(10, dec()))),
      tt("4. Take away what you already spent today (" + fmt(spentT) + "). The rest is “Money you can use today”.", "④ 今日もう使ったお金（" + fmt(spentT) + "）を引く。残りが「今日使えるお金」です。")
    ]).filter(Boolean).forEach((x) => why.append(raw("p", "sub", x)));
    if (r.comingSoon > 0) why.append(raw("p", "sub", tt("Money you’re waiting for: " + fmt(r.comingSoon) + " (not counted until it arrives)", "これから入る予定のお金：" + fmt(r.comingSoon) + "（入るまでは数えません）")));
    if ((Number(S.keepAmount) || 0) > 0 && (Number(S.keepAmount) || 0) > r.available + spentT) hero.append(note(tt("The money you keep aside (" + fmt(S.keepAmount) + ") is more than the money you have (" + fmt(r.available + spentT) + "), so you can use 0 today. If this doesn’t look right, check “Money you keep aside” in My numbers.", "取っておくお金（" + fmt(S.keepAmount) + "）が、持っているお金（" + fmt(r.available + spentT) + "）より多いので、今日使えるお金は0です。思っていた額と違うときは、「自分の数字」の「取っておくお金」を見直してください。")));
    if (r.overToday > 0) hero.append(note(tt("You spent " + fmt(r.overToday) + " more than today’s amount. That’s okay. Tomorrow’s amount will change automatically.", "今日使えるお金より " + fmt(r.overToday) + " 多く使いました。大丈夫です。明日使える金額は自動で変わります。")));
    if (r.shortDate) hero.append(note(tt("By " + fmtDate(r.shortDate) + ", your planned bills and set-asides are estimated to leave you " + fmt(r.shortAmount) + " short." + (Number(S.monthlyIncome) > 0 ? " This estimate may include your expected monthly income." : "") + " Record money when it arrives to update the estimate.", fmtDate(r.shortDate) + "までの支払いと取っておくお金で、" + fmt(r.shortAmount) + " 足りなくなる予想です。" + (Number(S.monthlyIncome) > 0 ? "（「ふつうの月の収入」を入れて考えています）" : "") + "お金が入ったら記録すると、予想が新しくなります。")));
    else if (r.status === "over") hero.append(note(tt("Payments in this period (" + BEFORE_EN() + ") are " + fmt(r.shortfall) + " more than the money you have. That isn’t your fault. See if any payment can be moved.", BEFORE_JA() + "が、いま持っているお金より " + fmt(r.shortfall) + " 多いです。あなたが悪いわけではありません。払う日をずらせるものがないか、見てみましょう。")));
    if (r.overdue > 0) { const n0 = note(tt("Some payments are past their due date (" + fmt(r.overdue) + "). They are kept aside until you tap Paid.", "払う日を過ぎたものがあります（" + fmt(r.overdue) + "）。「払った」を押すまで、払うお金として取っておきます。")); n0.append(" ", button(tt("See payments", "支払い予定を見る"), "link", () => { tab = "bills"; render(); })); hero.append(n0); }
    if (r.capped === "budget" && r.budgetPerDay === 0) hero.append(note(tt("Your monthly plan leaves no daily amount after bills and set-asides.", "「ふつうの月の収入」から、毎月の支払いと取っておくお金を引くと、1日に使える額が残りません。")));
    const ageDays = S.balance && S.balance.asOf ? E.toDays(t) - E.toDays(S.balance.asOf) : 0;
    if (ageDays >= 3) {
      const st = el("section", "card"); st.append(raw("p", null, tt("You last entered your money total " + ageDays + " days ago (" + fmtDate(S.balance.asOf) + "). The app now thinks you have " + fmt(r.available) + ". Is that close to your bank?", "いま持っているお金を最後に入れたのは " + ageDays + " 日前（" + fmtDate(S.balance.asOf) + "）です。アプリでは、いま " + fmt(r.available) + " あると計算しています。銀行の額と、近いですか？")));
      const row = el("div"); row.style.cssText = "display:flex;gap:10px;margin-top:10px;flex-wrap:wrap";
      row.append(button("Yes, close enough", "", () => { S.balance = { amount: round2c(r.available), asOf: t, at: Date.now() }; save(); render(); }), button("No, I’ll enter it again", "", () => { if (rsRef) { rsRef.open = true; rsRef.scrollIntoView({ behavior: "smooth", block: "center" }); const nbx = rsRef.querySelector("input"); if (nbx) nbx.focus(); } }));
      st.append(row); view.append(st);
    }
    view.append(hero);
    { // 買う前に、その場で「これ買っていい？」に答える（使いすぎを防ぐ、このアプリの一番の売り）
      const fit = el("section", "card buycheck"); fit.append(raw("h2", null, tt("If you buy this, how much can you still spend today?", "これを買うと、今日あといくら使える？")));
      const fp = input("f-amt", "text", "", { inputmode: "decimal", placeholder: tt("Type the price", "値段を入れる"), "aria-label": tt("Price of the thing you want to buy", "買いたい物の値段") }); fp.style.margin = "6px 0";
      const fout = raw("div", "verdict", ""); fout.setAttribute("aria-live", "polite"); fout.textContent = tt("Enter a price to see how much you can still spend today. This check is not saved as spending.", "値段を入れると、今日あといくら使えるか分かります。使った記録には入りません。");
      fp.addEventListener("input", () => {
        const a2 = num(fp.value); fout.className = "verdict";
        if (isNaN(a2) || a2 <= 0) { fout.textContent = tt("Enter a price to see how much you can still spend today. This check is not saved as spending.", "値段を入れると、今日あといくら使えるか分かります。使った記録には入りません。"); return; }
        const S2 = Object.assign({}, S, { spends: S.spends.concat([{ id: "check", date: t, amount: a2, cat: "Other" }]) }); const r2 = E.compute(S2, t);
        if (!(r2.overToday > 0)) { fout.className = "verdict good"; fout.textContent = tt("✓ Within today’s amount. If you buy this, you’ll have about " + fmt(r2.safeToday) + " left to spend today. This check is not saved. If you buy it, record it as spending.", "✓ 今日使えるお金の中です。買っても、あと " + fmt(r2.safeToday) + " ほど。買ったら「使ったお金」にも記録してください。"); }
        else { fout.className = "verdict warn"; fout.textContent = tt("△ " + fmt(r2.overToday) + " over today’s amount. Tomorrow’s amount will get smaller.", "△ 今日使っていい額を、" + fmt(r2.overToday) + " 超えます。明日使える額が減ります。"); }
      });
      fit.append(fp, fout); view.append(fit);
    }
    { // このアプリの約束：毎月いくら入れば暮らせるか（支払い＋食費・生活費＋毎月よけるお金）
      const lc = Number(S.livingCost) || 0, sa = varMode() ? (Number(S.monthlySetAside) || 0) : 0, need = r.monthlyBills + lc + sa;
      if (need > 0) {
        const nc = el("section", "card need");
        nc.append(raw("p", "sub", lc > 0 ? tt("Estimated money going out each month (bills + food and living costs)", "毎月、出ていくお金の目安（支払い＋食費・生活費）") : tt(sa > 0 ? "Estimated money going out each month (bills + set-aside)" : "Estimated money going out each month (bills only)", sa > 0 ? "毎月、出ていくお金の目安（払うお金＋よけるお金）" : "毎月、出ていくお金の目安（払うお金だけ）")), raw("div", "needbig", fmt(need)));
        const parts = [tt("Bills " + fmt(r.monthlyBills), "支払い " + fmt(r.monthlyBills))]; if (lc > 0) parts.push(tt("Food and living costs " + fmt(lc) + " (food, household items, going out)", "食費・生活費 " + fmt(lc) + "（食べ物・家の物・出かけるお金など）")); if (sa > 0) parts.push(tt("Monthly set-aside " + fmt(sa), "毎月よけるお金 " + fmt(sa)));
        nc.append(raw("p", "sub", parts.join(" ＋ ")));
        if (lc > 0) { const pace = Math.floor((Number(r.allowance) || 0) * 30); nc.append(raw("p", "sub", pace >= lc ? tt("Your daily amount × 30 days = " + fmt(pace) + ". That is enough for your estimated monthly food and living costs (" + fmt(lc) + ").", "今日の1日分×30日 ＝ " + fmt(pace) + "。月の食費・生活費（" + fmt(lc) + "）に足ります。") : tt("Your daily amount × 30 days = " + fmt(pace) + ". That is " + fmt(lc - pace) + " less than your estimated monthly food and living costs (" + fmt(lc) + ").", "今日の1日分×30日 ＝ " + fmt(pace) + "。月の食費・生活費（" + fmt(lc) + "）より " + fmt(lc - pace) + " 少ないです。"))); }
        else nc.append(raw("p", "sub", tt("Add your monthly food and living costs (food, household items, going out) to see how much goes out each month.", "毎月の食費・生活費（食べ物・家の物・出かけるお金など）を入れると、毎月出ていくお金の目安が出ます。")), button(tt("Add food and living costs", "食費・生活費を入れる"), "link", () => { tab = "settings"; render(); setTimeout(() => { const f0 = document.getElementById("c-lc"); if (f0) { f0.scrollIntoView({ block: "center" }); f0.focus({ preventScroll: true }); } }, 50); }));
        nc.append(button(tt("See my payments", "支払い予定を見る"), "link", () => { tab = "bills"; render(); })); view.append(nc);
      }
    }
    { // 全部のお金：いまある額 → 払うお金 → 取っておくお金 → 給料日までに使える額
      const mc = el("section", "card money"); mc.append(raw("h2", null, tt("Your money", "お金の内訳")));
      const row = (label, val, cls, edit) => { const d = el("div", "mrow" + (cls ? " " + cls : "")); const b = raw("b", null, edit && edit.node ? "" : val); if (edit && edit.node) b.append(edit.node); d.append(raw("span", null, label), b); if (edit && edit.go) { d.classList.add("tap"); d.addEventListener("click", edit.go); } mc.append(d); };
      const keepEdit = (k, isNew) => tapNum((isNew ? "" : "") + fmt(k.amount), k.amount, (v) => { if (isNew) (S.keeps = S.keeps || []).push(k); logKeep(k.name, isNew ? 0 : k.amount, v); k.amount = v; syncKeep(); save(); render(); }, null, "zero");
      const bills = roundC(r.reserved + r.reservedNext), keep = roundC(keepSum());
      mc.append(raw("p", "sub", tt("Tap an underlined amount to change it.", "下線のある数字を押すと、直せます。")), raw("p", "sub", tt("“Money you have now” starts with the last total you entered and includes money you recorded as received, spent, or paid since then. If it differs from your actual total, update it.", "「いま持っているお金」は、最後に入れた金額に、そのあと記録した出入りを足し引きした額です。実際の合計と違う時は、直してください。")));
      row(tt("Money you have now", "いま持っているお金"), fmt(r.available), "", { node: tapNum(fmt(r.available), round2c(r.available), (v) => { S.balance = { amount: v, asOf: todayStr(), at: Date.now() }; save(); flash = tt("Saved.", "保存しました。"); render(); }, null, "any") });
      if ((S.accounts || []).length && S.balance && S.accountsAt && S.balance.at === S.accountsAt) { S.accounts.forEach((a) => row("　" + a.name, fmt(a.amount), "sub2", { node: tapNum(fmt(a.amount), a.amount, (v) => { const nb = round2c(r.available + v - (Number(a.amount) || 0)), at = Date.now(); a.amount = v; S.balance = { amount: nb, asOf: todayStr(), at }; S.accountsAt = at; save(); render(); }, null, "any") })); row("　" + tt("(as entered " + fmtDate(S.balance.asOf) + ")", "（" + fmtDate(S.balance.asOf) + " に入れた額）"), "", "sub2"); }
      row(varMode() ? (() => { const ed = fmtDate(E.fromDays(E.toDays(t) + r.daysLeft + (S.cushionDays == null ? 30 : S.cushionDays) - 1)); return tt("Bills due by " + ed + " + amounts for future bills", "この先、" + ed + "までに払うお金（先によける支払い分も含む）"); })() : tt("Bills due before payday (" + fmtDate(r.payday) + ") + amounts for future bills", "次にお金が入る日（" + fmtDate(r.payday) + "）の前日までに払うお金（先によける支払い分も含む）"), "−" + fmt(bills), "", { go: () => { tab = "bills"; render(); } });
      { const ks = S.keeps || [], one = ks.length <= 1 ? (ks[0] || { id: uid(), name: tt("Set aside", "取っておく"), amount: 0 }) : null;
        row(tt("Set aside", "取っておくお金"), "−" + fmt(keep), "", one ? { node: (() => { const w = el("span"); w.append("−", keepEdit(one, !ks.length)); return w; })() } : { go: () => { tab = "settings"; render(); } });
        ks.filter((k) => Number(k.amount) > 0).forEach((k) => row("　" + k.name, fmt(k.amount), "sub2", { node: keepEdit(k, false) })); }
      row(varMode() ? tt("Left after upcoming bills and set-asides", "払うお金と取っておくお金を引いた残り") : tt("Left to use until payday", "次にお金が入る日までに使えるお金"), fmt(roundC(roundC(r.available) - bills - keep)), "total");
      mc.append(button(tt("Change what I set aside", "取っておくお金を変える"), "link", () => { tab = "settings"; render(); }), button(tt("Bills by pay period", varMode() ? "期間ごとの支払い" : "給料日ごとの支払い"), "link", () => { tab = "plan"; planMode = "pay"; render(); }));
      view.append(mc);
    }
    const soon = S.bills.map((b) => ({ b, next: E.nextDue(b, t) })).filter((x) => x.next && E.toDays(x.next) - E.toDays(t) <= 7).sort((x, y) => x.next.localeCompare(y.next) || y.b.amount - x.b.amount);
    if (soon.length) {
      const sc = el("section", "card"); sc.append(el("h2", null, "Coming up this week"));
      const dl = (d) => { const n = E.toDays(d) - E.toDays(t); return n <= 0 ? tt("today", "今日") : n === 1 ? tt("tomorrow", "明日") : tt("in " + n + " days", "あと" + n + "日"); };
      soon.slice(0, 5).forEach((x) => { const pp = raw("p", "sub", x.b.name + tt("  ", "　")); pp.append(tapNum(fmt(x.b.amount), x.b.amount, (v) => { x.b.amount = v; save(); render(); }, null, null, x.b.name + " (" + fmtDate(x.next) + ")"), tt("  (" + fmtDate(x.next) + " · " + dl(x.next) + ")", "　（" + fmtDate(x.next) + "・" + dl(x.next) + "）")); sc.append(pp); });
      if (soon.length > 5) sc.append(raw("p", "sub", tt("and " + (soon.length - 5) + " more (see Payments)", "ほか " + (soon.length - 5) + " 件（「支払い予定」で見られます）")));
      sc.append(raw("p", "sub", tt("Total this week: " + fmt(soon.reduce((a, x) => a + Number(x.b.amount), 0)), "今週の合計：" + fmt(soon.reduce((a, x) => a + Number(x.b.amount), 0)))));
      sc.append(raw("p", "sub", tt("In the app, money is not deducted just because a payment is due. Once you have paid, tap “Paid” on the Payments screen to record it.", "日付が来ただけでは、お金は引かれません。実際に払ったら「支払い予定」で「払った」を押してください。")), button(tt("See payments", "支払い予定を見る"), "link", () => { tab = "bills"; render(); }));
      view.append(sc);
    }
    if (S.sample) {
      const sn = note(tt("These are practice numbers, not yours. When you tap “Use my own numbers”, the example records are cleared.", "これは練習用の数字です。あなたの数字ではありません。「自分の金額で始める」を押すと、例の記録は消えます。")); sn.append(" ", button("Use my own numbers", "link", () => { const lang = S.lang, cur = S.currency; S = fresh(); S.lang = lang; S.currency = cur; S.noSample = true; save(); render(); }));
      view.insertBefore(sn, view.firstChild);
    }
    if (!S.sample && S.setup && !S.guideDone && S.spends.length === 0) {
      const g = el("section", "card"); g.append(el("h2", null, tt("Start with these 3 steps", "まず、この3つだけ")));
      const ol = el("ol", "sub"); ol.style.cssText = "margin:6px 0 10px 20px;padding:0;line-height:1.7";
      ol.append(raw("li", null, tt("Check the number above. If it looks wrong, tap “Re-enter how much money you have now”.", "上の金額を見ます。違っていたら、「いま持っているお金を入れ直す」を押します。")), raw("li", null, tt("When you spend money, enter it in “Record what you spent” below.", "お金を使ったら、下の「使ったお金を記録」に入れます。")), raw("li", null, tt("When money comes in, add it under Income. When you pay a bill, tap “Paid” under Payments.", "お金が入ったら「収入」に、支払いをしたら「支払い予定」で「払った」を押します。")));
      g.append(ol, button(tt("Got it, hide this", "分かった（この案内を消す）"), "link", () => { S.guideDone = true; save(); render(); }));
      view.insertBefore(g, view.firstChild);
    }
    if (r.paydayPassed) {
      const n = note(tr("Your payday has passed. Did you get paid? If so, tap “Add money” below.")); n.append(" ", button("Add money", "link", () => { tab = "income"; render(); }));
      view.append(n);
    }
    const lg = el("section", "card");
    lg.append(el("h2", null, "Record what you spent"));
    const amt = input("l-amt", "text", "", { inputmode: "decimal", placeholder: tr("Amount"), "aria-label": tt("Amount you spent", "使った金額") });
    const chips = el("div", "catgrid");
    CATS.forEach((c) => { const b = button("", "catbtn" + (c === cat ? " on" : ""), () => { cat = c; chips.querySelectorAll(".catbtn").forEach((x) => { x.classList.toggle("on", x.dataset.cat === c); x.setAttribute("aria-pressed", String(x.dataset.cat === c)); }); }); b.dataset.cat = c; b.setAttribute("aria-pressed", String(c === cat)); b.append(icon(c), raw("span", "nm", tr(c))); chips.append(b); });
    const dtl = el("details", "more"); dtl.append(raw("summary", null, tt("More details (date, note)", "くわしく入れる（日にち・メモ）")));
    const dDate = input("l-date", "date", t, { max: t }), dMemo = input("l-memo", "text", "", { placeholder: tt("Note (optional)", "メモ（なくてもOK）"), maxlength: "80" });
    dtl.append(field(tt("Date", "使った日"), dDate), field(tt("Note", "メモ"), dMemo));
    amt.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); add.click(); } });
    const add = button("Add", "primary", () => {
      const a = num(amt.value);
      if (isNaN(a) || a <= 0) return say(tr("Type an amount, for example 4.50."));
      if (CFG.demo && S.spends.length >= CFG.demoLimit) return say(tr("The demo has reached its limit. Your entries are still here. In the full app, you can record spending as often as you need."));
      const nowD = todayStr(), dv = dDate.value && dDate.value !== t && dDate.value <= nowD ? dDate.value : nowD; S.spends.push({ id: uid(), date: dv, amount: a, cat, ts: Date.now(), memo: dMemo.value.trim() }); save(); focusFlash = true; flash = tt("Saved. You can fix it in “This month”.", "記録しました。まちがえたら「今月の記録」で直せます。"); render();
    });
    add.style.width = "100%";
    const cnt = {}; S.spends.forEach((x) => { const k = x.cat + "|" + x.amount; cnt[k] = (cnt[k] || 0) + 1; });
    const favKeys = (S.favs || []).map((f) => f.cat + "|" + f.amount);
    const often = Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x]).filter((k) => cnt[k] >= 2);
    const usual = favKeys.concat(often.filter((k) => favKeys.indexOf(k) < 0)).slice(0, 6);
    if (usual.length) {
      lg.append(raw("h3", "sec", tt("Usual spending", "いつもの支出")), raw("p", "sub", tt("Tap once to log a saved amount", "1回押すと、保存した金額が記録されます")));
      const orow = el("div", "usualgrid");
      usual.forEach((k) => {
        const [oc, oa] = k.split("|");
        const wrap = el("div", "usualwrap");
        const ub = button("", "usualbtn", () => {
          if (CFG.demo && S.spends.length >= CFG.demoLimit) return say(tr("Demo limit reached. Everything you typed is still here. The full app has no spending-entry limit."));
          S.spends.push({ id: uid(), date: todayStr(), amount: Number(oa), cat: oc, ts: Date.now() }); save(); flash = ""; render();
        });
        const tx = el("span", "tx"); tx.append(raw("span", "nm", tr(oc)), raw("span", "am", fmt(Number(oa)))); ub.append(icon(oc), tx); wrap.append(ub);
        if (favKeys.indexOf(k) >= 0) { const x = button("✕", "link xbtn", () => { S.favs = S.favs.filter((f) => f.cat + "|" + f.amount !== k); save(); render(); }); x.setAttribute("aria-label", tt("Remove", "削除")); wrap.append(x); }
        orow.append(wrap);
      });
      lg.append(orow);
    } else lg.append(raw("p", "sub", tt("To save an amount as usual spending, add it for today, then tap ☆ next to it under “Today so far.”", "よく使う金額は、今日の分として記録します。「今日使ったお金」の横の ☆ を押すと、「いつもの支出」に入ります。")));
    lg.append(raw("h3", "sec", tt("Or add a new amount", "新しい金額を入れる")), field("How much did you spend?", amt), raw("p", "sub pick", tt("Pick one", "分類を選ぶ")), chips, dtl, add);
    const monthBtn = button("This month", "link", () => { tab = "month"; monthOffset = 0; flash = ""; render(); });
    lg.append(monthBtn);
    view.append(lg);
    const mi = el("details", "card why"); mi.append(raw("summary", null, tt("Money in today? Add just the amount", "今日入ったお金を、金額だけでさっと足す")));
    mi.append(raw("p", "sub", tt("Add money you received today. Enter just the amount. For a different date or money you expect to receive, use Income. Money added here also appears in Income, so don’t add it twice.", "今日入ったお金を、金額だけで足せます。日付を変えたいときや、まだ入っていない予定のお金は「収入」で入れてください。ここで足したお金は「収入」の一覧にも出ます。同じ入金を2回入れないでください。")));
    const miAmt = input("mi-amt", "text", "", { inputmode: "decimal", placeholder: tr("Amount") }); miAmt.style.margin = "10px 0";
    mi.append(miAmt, button("Add", "primary", () => {
      const a3 = num(miAmt.value); if (isNaN(a3) || a3 <= 0) return say(tr("Please type an amount and a date."));
      const ni = { id: uid(), date: t, amount: a3, status: "received", label: "", ts: Date.now() }; S.income.push(ni); const tx = taxOn(ni); save(); flash = tt("Added.", "追加しました。") + (tx > 0 ? " " + taxMsg(tx) : ""); render();
    }));
    view.append(mi);
    const rs = el("details", "card why"); rsRef = rs; rs.append(raw("summary", null, tt("Re-enter how much money you have now (even if you missed a few days)", "いま持っているお金を入れ直す（記録できない日があっても大丈夫）")));
    rs.append(el("p", "sub", "It’s okay. Count the money you have, cash and bank. Type it here. You can start again today."));
    const nb = input("r-bal", "text", "", { inputmode: "decimal", placeholder: tr("Money you have today") }); nb.style.margin = "10px 0";
    rs.append(nb, button("Start again with this amount", "", () => { const b = num(nb.value); if (isNaN(b)) return say(tr("Type the amount you have first.")); S.balance = { amount: b, asOf: todayStr(), at: Date.now() }; save(); flash = tr("You’re ready to start again today."); render(); }));
    view.append(rs);
    const todays = S.spends.filter((s) => s.date === t);
    if (todays.length) {
      const l = el("div", "todaybox"); l.style.cssText = "margin-top:16px;padding-top:12px;border-top:1px solid var(--line)"; l.append(el("h3", null, "Today so far"));
      const list = el("div", "list");
      const favBtn = (sp) => { const k = sp.cat + "|" + sp.amount; const on = (S.favs || []).some((f) => f.cat + "|" + f.amount === k); const fb = button(on ? "★" : "☆", "link", () => { S.favs = S.favs || []; if (on) S.favs = S.favs.filter((f) => f.cat + "|" + f.amount !== k); else S.favs.push({ cat: sp.cat, amount: sp.amount }); save(); render(); }); fb.setAttribute("aria-label", on ? tt("Remove from usual spending", "いつもの支出からはずす") : tt("Add to usual spending", "いつもの支出にする")); fb.setAttribute("aria-pressed", String(on)); return fb; };
      todays.slice().reverse().forEach((s) => { const it = el("div", "item"); const left = el("div", "l", s.cat); const right = el("div", "r"); right.append(tapNum(fmt(s.amount), s.amount, (v) => { s.amount = v; save(); render(); }, null, null, tr(s.cat)), " ", favBtn(s), " ", button("Undo", "link", () => { S.spends = S.spends.filter((x) => x.id !== s.id); save(); render(); })); it.append(left, right); list.append(it); });
      l.append(list); lg.insertBefore(l, monthBtn);
    }
    view.append(why);
  }

  /* ---------- This month（記録した支出だけ） ---------- */
  let editSpendId = null;
  function monthView() {
    const t = todayStr(), d0 = new Date(t.slice(0, 4), Number(t.slice(5, 7)) - 1 + monthOffset, 1);
    const ym = d0.getFullYear() + "-" + String(d0.getMonth() + 1).padStart(2, "0");
    const label = S.lang === "ja" ? d0.getFullYear() + "年" + (d0.getMonth() + 1) + "月" : MONS[d0.getMonth()] + " " + d0.getFullYear();
    const rows = S.spends.filter((x) => String(x.date).slice(0, 7) === ym);
    const total = rows.reduce((a, x) => a + x.amount, 0);
    const byCat = {}; rows.forEach((x) => { byCat[x.cat] = (byCat[x.cat] || 0) + x.amount; });
    const top = el("section", "card");
    const nav = el("div", "row topnav");
    const prev = button("‹", "link", () => { monthOffset -= 1; render(); }), next = button("›", "link", () => { if (monthOffset < 0) { monthOffset += 1; render(); } });
    prev.setAttribute("aria-label", tt("Previous month", "前の月")); next.setAttribute("aria-label", tt("Next month", "次の月")); if (monthOffset >= 0) next.disabled = true;
    nav.append(prev, raw("strong", null, tt("Recorded spending · ", "記録した支出・") + label), next);
    top.append(el("h2", null, "This month"), nav);
    view.append(top);
    const sum = el("section", "card"); sum.append(raw("p", "sub", tt("You recorded", "記録した合計")), raw("div", "big", fmt(total)), raw("p", "sub", tt(rows.length + (rows.length === 1 ? " entry" : " entries"), rows.length + "件")));
    view.append(sum);
    const cats = Object.keys(byCat).sort((x, y) => byCat[y] - byCat[x]);
    if (cats.length) {
      const w = el("section", "card"); w.append(el("h2", null, "Where it went"));
      cats.forEach((c) => {
        const pct = Math.round(byCat[c] / total * 100);
        const line = el("div", "mrow"), head = el("div", "mhead"); head.append(icon(c), raw("span", "nm", tr(c)), raw("strong", null, fmt(byCat[c])), raw("span", "pc", pct + "%"));
        const bar = el("div", "mbar"), fill = el("span"); fill.style.width = Math.max(2, pct) + "%"; bar.append(fill); line.append(head, bar); w.append(line);
      });
      view.append(w);
    }
    { // 前の月との比べ
      const pd0 = new Date(d0.getFullYear(), d0.getMonth() - 1, 1), pym = pd0.getFullYear() + "-" + String(pd0.getMonth() + 1).padStart(2, "0");
      const prow = S.spends.filter((x) => String(x.date).slice(0, 7) === pym), ptotal = prow.reduce((a, x) => a + x.amount, 0);
      const cc = el("section", "card"); cc.append(raw("h2", null, tt("Compared with the previous month", "前の月と比べる")));
      if (!prow.length || !Object.keys(byCat).length) cc.append(raw("p", "sub", (prow.length ? tt("No spending is recorded for this month yet, so there is nothing to compare. No records does not mean no money was spent.", "この月はまだ記録がないので、比べられません。（記録がないことと、使っていないことは別です）") : tt("No spending was recorded for the previous month, so there is nothing to compare. No records does not mean no money was spent.", "前の月は記録がないので、比べられません。（記録がないことと、使っていないことは別です）"))));
      else {
        const diff = round2c(total - ptotal);
        cc.append(raw("p", null, tt("Previous month: " + fmt(ptotal) + " · Selected month: " + fmt(total), "前の月：" + fmt(ptotal) + "　今月：" + fmt(total))));
        cc.append(raw("p", "sub", diff === 0 ? tt("The same as the previous month.", "前の月と同じ金額です。") : diff > 0 ? tt(fmt(diff) + " more than the previous month.", "前の月より " + fmt(diff) + " 多いです。") : tt(fmt(-diff) + " less than the previous month.", "前の月より " + fmt(-diff) + " 少ないです。")));
        const pby = {}; prow.forEach((x) => { pby[x.cat] = (pby[x.cat] || 0) + x.amount; });
        Object.keys(Object.assign({}, byCat, pby)).map((c) => ({ c, d: round2c((byCat[c] || 0) - (pby[c] || 0)) })).filter((x) => x.d !== 0).sort((x, y) => Math.abs(y.d) - Math.abs(x.d)).slice(0, 3)
          .forEach((x) => cc.append(raw("p", "sub", tr(x.c) + tt("  ", "　") + (x.d > 0 ? tt("+", "＋") : "−") + fmt(Math.abs(x.d)))));
      }
      view.append(cc);
    }
    { // 記録の一覧：直す・削除
      const lc = el("section", "card"); lc.append(raw("h2", null, tt("Entries for this month", "今月の記録を見る")));
      const list = rows.slice().sort((x, y) => String(y.date).localeCompare(String(x.date)) || (y.ts || 0) - (x.ts || 0));
      if (!list.length) lc.append(raw("p", "sub", tt("No entries yet.", "まだ記録がありません。")));
      list.forEach((x) => {
        if (editSpendId === x.id) {
          const f = el("div", "editbox");
          const ea = input("e-amt", "text", x.amount, { inputmode: "decimal" }), ed = input("e-date", "date", x.date, { max: t }), em = input("e-memo", "text", x.memo || "", { maxlength: "80" });
          const es = select("e-cat", Object.fromEntries(CATS.map((c) => [c, tr(c)])), x.cat);
          f.append(field(tt("Amount", "金額"), ea), field(tt("Date", "日付"), ed), field(tt("Category", "分類"), es), field(tt("Note", "メモ"), em));
          const br = el("div", "row"); br.style.gap = "10px";
          br.append(button(tt("Save", "保存"), "primary", () => { const v = num(ea.value); if (isNaN(v) || v <= 0) return say(tr("Type an amount, for example 4.50.")); x.amount = v; x.date = ed.value && ed.value <= t ? ed.value : x.date; x.cat = es.value; x.memo = em.value.trim(); editSpendId = null; save(); render(); }),
            button(tt("Cancel", "やめる"), "link", () => { editSpendId = null; render(); }));
          f.append(br); lc.append(f); return;
        }
        const it = el("div", "item"), l = el("div", "l"), r2 = el("div", "r");
        l.append(raw("div", null, fmtDate(x.date) + tt("  ", "　") + tr(x.cat)), x.memo ? raw("div", "sub", x.memo) : raw("span", null, ""));
        r2.append(tapNum(fmt(x.amount), x.amount, (v) => { x.amount = v; save(); render(); }, null, null, tr(x.cat) + ", " + fmtDate(x.date)), el("br"), button(tt("Fix", "直す"), "link", () => { editSpendId = x.id; render(); }), button(tt("Delete", "削除"), "link danger", () => { S.spends = S.spends.filter((y) => y.id !== x.id); save(); render(); }));
        it.append(l, r2); lc.append(it);
      });
      view.append(lc);
    }
    { // CSVで保存（表計算で開ける）
      const q = (v) => { let t0 = String(v == null ? "" : v); if (typeof v === "string" && /^[=+\-@\t\r]/.test(t0)) t0 = "'" + t0; return '"' + t0.replace(/"/g, '""') + '"'; }; // = + - @ で始まる文字は、表計算で式として動かないように ' を付ける
      view.append(button(tt("Export all spending records as a CSV file", "全部の記録を表（CSV）で保存"), "", () => {
        const lines = [["date", "category", "amount", "note"].map(q).join(",")].concat(S.spends.slice().sort((x, y) => String(x.date).localeCompare(String(y.date))).map((x) => [x.date, x.cat, x.amount, x.memo || ""].map(q).join(",")));
        const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }); const a2 = document.createElement("a");
        a2.href = URL.createObjectURL(blob); a2.download = "payday-calm-spending.csv"; document.body.appendChild(a2); a2.click(); a2.remove(); setTimeout(() => URL.revokeObjectURL(a2.href), 1000);
      }));
      view.append(raw("p", "sub", tt("This saves your spending only. To move everything to another device, use “Save a copy” under “My numbers”.", "これは使ったお金だけの記録です。全部を別の端末に移す時は、「自分の数字」で「記録をファイルに保存」を使います。")));
    }
    view.append(note(tr("Only spending you logged is shown. Missed entries and bills are not counted here.")));
    const back = button("Back to Today", "primary", () => { tab = "today"; render(); }); back.style.width = "100%"; view.append(back);
  }

  /* ---------- Plan：給料ごとの割り当て／1年のカレンダー ---------- */
  let planMode = "pay";
  let planOpenYm = null;
  function planView() {
    const t = todayStr(), r = E.compute(S, t), D = E.toDays, F = E.fromDays;
    const top = el("section", "card"); top.append(raw("h2", null, tt("Bills plan", "払うお金の計画")));
    const tg = el("div", "row"); tg.style.gap = "10px";
    const b1 = button(tt("By pay period", varMode() ? "期間ごと" : "給料日ごと"), planMode === "pay" ? "primary" : "", () => { planMode = "pay"; render(); }), b2 = button(tt("The year", "1年のカレンダー"), planMode === "year" ? "primary" : "", () => { planMode = "year"; render(); });
    b1.style.flex = b2.style.flex = "1"; tg.append(b1, b2); top.append(tg); view.append(top);
    const billsIn = (from, to) => { const out = []; (S.bills || []).forEach((b) => E.duesBetween(b, from, to).forEach((d) => out.push({ name: b.name, date: d, amount: Number(b.amount), bill: b }))); return out.sort((x, y) => x.date.localeCompare(y.date) || y.amount - x.amount); };
    // 月・期間のカードから、その中の日付で払うお金を直接足す
    const addPaymentBox = (key, minD, maxD, label, onceLabel) => {
      const wrap0 = el("details", "addmonth"); wrap0.style.marginTop = "10px"; if (planOpenYm === key) wrap0.open = true;
      wrap0.append(raw("summary", null, label));
      const fw = el("div"); fw.style.cssText = "display:flex;flex-direction:column;gap:12px;margin-top:10px";
      const nm = input("pm-name-" + key, "text", "", { placeholder: ph("e.g. Car tax", "例：車の税金"), maxlength: 40 });
      const am = input("pm-amt-" + key, "text", "", { inputmode: "decimal", placeholder: tr("Amount") });
      const dd = input("pm-date-" + key, "date", minD, { min: minD, max: maxD });
      const ee = select("pm-every-" + key, { once: onceLabel, month: tt("Every month from this date", "この日から毎月") }, "once");
      const er = note(""); er.hidden = true; er.setAttribute("role", "status");
      const go = button(tt("Add", "追加"), "primary", () => {
        const a2 = num(am.value);
        if (!nm.value.trim() || isNaN(a2) || a2 <= 0 || !dd.value) { er.hidden = false; er.textContent = tt("Enter a name, amount, and date.", "名前・金額・日付を入れてください。"); return; }
        S.bills.push({ id: uid(), name: nm.value.trim(), amount: a2, every: ee.value, due: dd.value }); planOpenYm = key; save(); flash = tt("Added.", "追加しました。"); render();
      });
      go.style.cssText = "width:100%";
      fw.append(field(tt("Name", "名前"), nm), field(tr("Amount"), am), field(tt("Date", "日付"), dd), field(tt("How often?", "くり返し"), ee), er, go); wrap0.append(fw); return wrap0;
    };
    const itemRow = (x) => { const it = el("div", "item"), l = el("div", "l"), rr = el("div", "r"); l.append(raw("div", null, x.name), raw("div", "sub", fmtDate(x.date))); rr.append(x.bill ? tapNum(fmt(x.amount), x.amount, (v) => { x.bill.amount = v; save(); render(); }) : fmt(x.amount)); it.append(l, rr); return it; };
    if (planMode === "pay") {
      const per = [];
      if (varMode()) { for (let i = 0; i < 6; i++) { const s = F(D(t) + i * winN()), e = F(D(t) + (i + 1) * winN() - 1); per.push({ s, e, first: i === 0, title: i === 0 ? tt("The next " + winN() + " days", "この先" + winN() + "日") : fmtDate(s) + " – " + fmtDate(e) }); } }
      else {
        let p = E.nextPayday(S.payday, S.cycle || "biweekly", t).date;
        per.push({ s: t, e: F(D(p) - 1), first: true, title: tt("Now until payday (" + fmtDate(p) + ")", "今から次の給料日（" + fmtDate(p) + "）まで") });
        for (let i = 0; i < 5; i++) { const nx = E.nextPayday(p, S.cycle || "biweekly", p, PDOM()).date; per.push({ s: p, e: F(D(nx) - 1), title: tt("Paycheck on " + fmtDate(p), fmtDate(p) + " の給料") + tt("  (" + fmtDate(p) + " – " + fmtDate(F(D(nx) - 1)) + ")", "　（" + fmtDate(p) + " – " + fmtDate(F(D(nx) - 1)) + "）") }); p = nx; }
      }
      view.append(note(tt("Bills are grouped by the period in which they are due. Bills marked Paid are excluded.", "払う日ごとに分けて出します。「払った」を押したものは入っていません。")));
      per.forEach((pr) => {
        const items = billsIn(pr.s, pr.e), total = round2c(items.reduce((a, x) => a + x.amount, 0));
        const c = el("section", "card"); c.append(raw("h2", null, pr.title));
        if (!items.length) c.append(raw("p", "sub", tt("No bills in this period.", "この間の払うお金はありません。")));
        const list = el("div", "list"); items.forEach((x) => list.append(itemRow(x))); c.append(list);
        c.append(addPaymentBox("p" + pr.s, pr.s, pr.e, tt("+ Add a payment in this period", "＋ この期間に払うお金を足す"), tt("Just this once", "1回だけ")));
        c.append(raw("p", null, tt("Bills in this period: ", "この間の払うお金合計：") + fmt(total)));
        if (pr.first) { const left = round2c(r.available - total - keepSum()); c.append(raw("p", "sub", tt("Money you have now: " + fmt(r.available) + " · set aside: " + fmt(keepSum()) + " → estimated amount left after these bills: ", "いま持っているお金：" + fmt(r.available) + "・取っておく：" + fmt(keepSum()) + " → 払ったあと残る見込みの額：") + fmt(left))); }
        else if (Number(S.payAmount) > 0) { const left = round2c(Number(S.payAmount) - total); c.append(raw("p", "sub", tt("Your usual paycheck " + fmt(S.payAmount) + " → estimated amount left after these bills: ", "いつもの給料 " + fmt(S.payAmount) + " → 払ったあと残る見込みの額：") + fmt(left))); }
        else if (!varMode()) c.append(raw("p", "sub", tt("Enter your usual paycheck under “My numbers” to see what is left.", "「自分の数字」に「いつもの給料」を入れると、払ったあと残る額が出ます。")));
        c.querySelectorAll(".sub").forEach((e) => { if (/: [-−]|：[-−]/.test(e.textContent)) e.style.color = "var(--bad,#b3261e)"; });
        view.append(c);
      });
    } else {
      const m0 = new Date(Number(t.slice(0, 4)), Number(t.slice(5, 7)) - 1, 1), end = new Date(m0.getFullYear(), m0.getMonth() + 12, 0);
      const endS = end.getFullYear() + "-" + String(end.getMonth() + 1).padStart(2, "0") + "-" + String(end.getDate()).padStart(2, "0");
      const pays = []; if (!varMode() && S.payday) { let p = E.nextPayday(S.payday, S.cycle || "biweekly", F(D(t) - 1)).date; for (let g = 0; g < 80 && D(p) <= D(endS); g++) { pays.push(p); p = E.nextPayday(p, S.cycle || "biweekly", p, PDOM()).date; } }
      const all = billsIn(t, endS), yTotal = round2c(all.reduce((a, x) => a + x.amount, 0));
      const hd = el("section", "card"); hd.append(raw("p", "sub", tt("Upcoming bills over the next 12 calendar months", "これから1年の払うお金合計")), raw("div", "big", fmt(yTotal))); hd.append(raw("p", "sub", tt("Only bills you added are counted. Tap a month to see the days.", "追加した払うお金だけの合計です。月を押すと、日ごとの内訳が見られます。"))); view.append(hd);
      for (let i = 0; i < 12; i++) {
        const md = new Date(m0.getFullYear(), m0.getMonth() + i, 1), ym = md.getFullYear() + "-" + String(md.getMonth() + 1).padStart(2, "0");
        const first = ym + "-01", last = ym + "-" + String(new Date(md.getFullYear(), md.getMonth() + 1, 0).getDate()).padStart(2, "0");
        const items = billsIn(D(first) < D(t) ? t : first, last), pm = pays.filter((p) => p.slice(0, 7) === ym), total = round2c(items.reduce((a, x) => a + x.amount, 0));
        const dt = el("details", "card why"); if (/^\d{4}-\d\d$/.test(planOpenYm || "") ? planOpenYm === ym : i === 0) dt.open = true;
        const lab = S.lang === "ja" ? md.getFullYear() + "年" + (md.getMonth() + 1) + "月" : MONS[md.getMonth()] + " " + md.getFullYear();
        dt.append(raw("summary", null, lab + "　" + tt("Bills ", "支払い ") + fmt(total) + (pm.length ? tt(" · Paychecks " + pm.length, "・給料 " + pm.length + "回") : "")));
        if (pm.length >= 3 && S.cycle !== "weekly") dt.append(note(tt("3 paydays this month. Check whether you have anything to set aside.", "今月は給料が3回あります。取っておけるお金があるか、見てみましょう。")));
        const evs = items.map((x) => ({ d: x.date, t: x.name, a: fmt(x.amount), x })).concat(pm.map((p) => ({ d: p, t: tt("Payday", "給料日"), a: "" }))).sort((x, y) => x.d.localeCompare(y.d));
        if (!evs.length) dt.append(raw("p", "sub", tt("Nothing this month.", "この月に予定はありません。")));
        const list = el("div", "list"); evs.forEach((x) => { const it = el("div", "item"), l = el("div", "l"), rr = el("div", "r"); l.append(raw("div", null, (x.a ? "" : "◎ ") + x.t), raw("div", "sub", fmtDate(x.d))); rr.append(x.x && x.x.bill ? tapNum(x.a, x.x.amount, (v) => { x.x.bill.amount = v; save(); render(); }) : x.a); it.append(l, rr); list.append(it); });
        dt.append(list);
        dt.append(addPaymentBox(ym, D(first) < D(t) ? t : first, last, tt("+ Add a payment in this month", "＋ この月に払うお金を足す"), tt("Just this month", "この月だけ")));
        view.append(dt);
      }
    }
    const back = button(tt("Back to Payments", "支払い予定にもどる"), "primary", () => { tab = "bills"; render(); }); back.style.width = "100%"; view.append(back);
  }

  /* ---------- Bills ---------- */
  let editBillId = null;
  function billsView() {
    const t = todayStr(), EV = EVERY(), r = E.compute(S, t);
    const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const md = (d) => { const x = d.split("-"); return S.lang === "ja" ? Number(x[1]) + "/" + Number(x[2]) : MON[Number(x[1]) - 1] + " " + Number(x[2]); };
    const c = el("section", "card"); c.append(el("h2", null, "Payments"));
    { const pr = el("div", "row"); pr.style.cssText = "gap:10px;margin-bottom:8px"; const q1 = button(tt("By pay period", varMode() ? "期間ごとに見る" : "給料日ごとに見る"), "", () => { tab = "plan"; planMode = "pay"; render(); }), q2 = button(tt("The year", "1年のカレンダー"), "", () => { tab = "plan"; planMode = "year"; render(); }); q1.style.flex = q2.style.flex = "1"; pr.append(q1, q2); c.append(pr); }
    c.append(raw("p", "sub", tt("When you tap “Paid”, the app subtracts the amount from the money it shows you have. It does not make a payment or move money in your bank. Don’t record the same payment again as spending.", "「払った」を押すと、その金額は持っているお金から引かれます。「使ったお金」には、もう一度入れないでください。")));
    c.append(raw("p", "sub", tt("To pay — " + BEFORE_EN() + " (total): " + fmt(r.reserved), BEFORE_JA() + "（合計）：" + fmt(r.reserved))));
    { const dueSum = round2c((r.dueList || []).reduce((x, d) => x + d.amount, 0)), extra = round2c(r.reserved - dueSum); if (extra > 0.5) c.append(raw("p", "sub", tt("This includes " + fmt(extra) + " set aside as a monthly share of payments that come every few months (for example, yearly insurance). The list below shows only payments due in this period.", "この中の " + fmt(extra) + " は、数か月に1回の支払い（保険など）を月ごとに割って、先によけている分です。下の一覧には、この期間に払う分だけが出ます。"))); }
    if (r.monthlyBills > 0) { const need = r.monthlyBills + (S.mode === "variable" ? (Number(S.monthlySetAside) || 0) : 0); c.append(raw("p", "sub", (need > r.monthlyBills ? tt("Your listed bills add up to about " + fmt(r.monthlyBills) + " a month. With your monthly set-aside (" + fmt(need - r.monthlyBills) + "), the estimated total is " + fmt(need) + " a month. Other food and living costs are not included.", "登録した支払いは、1か月に約 " + fmt(r.monthlyBills) + " です。毎月取り分ける額（" + fmt(need - r.monthlyBills) + "）と合わせると、毎月、最低でも " + fmt(need) + " 入る必要があります（食費など、登録していない生活費は入っていません）。") : tt("Your listed bills add up to about " + fmt(r.monthlyBills) + " a month. Other food and living costs are not included.", "登録した支払いは、1か月に約 " + fmt(r.monthlyBills) + " です。これを払うには、毎月、最低でも " + fmt(need) + " 入る必要があります（食費など、登録していない生活費は入っていません）。"))));  if (Number(S.livingCost) > 0) c.append(raw("p", "sub", tt("With your food and living costs (" + fmt(S.livingCost) + "), your estimated monthly total is about " + fmt(need + Number(S.livingCost)) + ".", "食費・生活費（" + fmt(S.livingCost) + "）も入れると、暮らすには毎月 " + fmt(need + Number(S.livingCost)) + " くらい必要です。"))); }
    const odOf = (b) => (r.overdueList || []).filter((o) => o.id === b.id).map((o) => o.date).sort()[0];
    const rows = S.bills.map((b) => ({ b, next: odOf(b) || E.nextDue(b, t) })).sort((x, y) => (x.next || "9999").localeCompare(y.next || "9999"));
    if (!rows.length) c.append(el("p", "sub", "No payments added yet. Add the ones you know about. You can add more later."));
    const list = el("div", "list");
    rows.forEach(({ b, next }) => {
      const it = el("div", "item"); const l = el("div", "l");
      const dd = next ? E.toDays(next) - E.toDays(t) : null;
      const when = next ? md(next) + (dd === 0 ? tt(" (today)", "（今日）") : dd > 0 ? tt(" (in " + dd + " days)", "（あと" + dd + "日）") : tt(" (late)", "（過ぎています）")) : tr("No next payment");
      l.append(raw("div", null, b.name), raw("div", "sub", when + " · " + (EV[b.every] || (/^m(\d+)$/.test(b.every) ? tt("Every " + b.every.slice(1) + " months", b.every.slice(1) + "か月ごと") : b.every))));
      if (next && r.payday && dd >= 0 && next < r.payday) l.append(raw("div", "sub", tt((varMode() ? "Within the next " + winN() + " days" : "Before payday") + " — counted in today’s amount", (varMode() ? "この先" + winN() + "日の中" : "次にお金が入る日より前") + " 。今日使えるお金から引いています")));
      if (dd != null && dd < 0) l.append(raw("div", "sub", tt("The due date has passed. If you paid it, tap Paid. Until then, it is kept aside.", "支払い日を過ぎています。払ったら「払った」を押してください。押すまでは、払うお金として取っておきます。")));
      if (E.monthsOf(b.every) > 1) l.append(raw("div", "sub", tt("Set aside this much each month: " + fmt(b.amount / E.monthsOf(b.every)), "毎月分けておく金額：" + fmt(b.amount / E.monthsOf(b.every)))));
      const rr = el("div", "r"); rr.append(tapNum(fmt(b.amount), b.amount, (v) => { b.amount = v; save(); render(); }, null, null, b.name), el("br"));
      if (next) rr.append(button("Paid", "link", () => { b.paidThrough = next; S.paid = (S.paid || []).filter((p) => p.billId !== b.id || p.for !== next); S.paid.push({ id: uid(), billId: b.id, for: next, date: t, amount: Number(b.amount), ts: Date.now() }); save(); render(); }));
      if (b.paidThrough) rr.append(button("Undo paid", "link", () => { const mine = (S.paid || []).filter((p) => p.billId === b.id).sort((x, y) => (x.ts || 0) - (y.ts || 0)); const last = mine.pop(); if (last) S.paid = S.paid.filter((p) => p.id !== last.id); const prev = mine.length ? mine[mine.length - 1].for : null; if (prev) b.paidThrough = prev; else delete b.paidThrough; save(); render(); }));
      rr.append(button("Edit", "link", () => { editBillId = b.id; render(); }));
      rr.append(button("Remove", "link danger", () => { S.bills = S.bills.filter((x) => x.id !== b.id); save(); render(); }));
      it.append(l, rr); list.append(it);
    });
    c.append(list); view.append(c);
    const eb = editBillId ? S.bills.find((x) => x.id === editBillId) : null; if (editBillId && !eb) editBillId = null;
    const f = el("details", "card why"); if (!rows.length || eb) f.open = true;
    f.append(raw("summary", null, eb ? tt("Edit this payment", "この払うお金を直す") : tt("+ Add a payment", "＋ 払うお金を追加")));
    const wrap = el("div"); wrap.style.cssText = "display:flex;flex-direction:column;gap:12px;margin-top:10px";
    const name = input("b-name", "text", "", { placeholder: ph("e.g. Rent", "例：家賃"), maxlength: 40 });
    const tpl = el("div", "chips"); const errEl = note(""); errEl.hidden = true; errEl.setAttribute("role", "status");
    (S.lang === "ja" ? ["家賃", "電気", "ガス", "水道", "スマホ", "サブスク", "保険", "カード", "税金"] : ["Rent", "Electric", "Gas", "Water", "Phone", "Subscription", "Insurance", "Card", "Tax"])
      .forEach((n) => tpl.append(button(n, "chip", () => { name.value = n; })));
    (Array.isArray(S.chips) ? S.chips : []).forEach((n) => { const cw = el("span", "chipmine"); cw.append(button(n, "chip", () => { name.value = n; }), (() => { const x = button("×", "chipx", () => { S.chips = S.chips.filter((y) => y !== n); save(); render(); }); x.setAttribute("aria-label", tt("Remove the button ", "このボタンを消す：") + n); return x; })()); tpl.append(cw); });
    tpl.append(button(tt("+ Make my own button", "＋ 自分のボタンを作る"), "chip", () => {
      const v = (name.value || "").trim().slice(0, 40);
      if (!v) { name.focus(); errEl.hidden = false; errEl.textContent = tt("First, type a name above (for example, “Tax”). Then tap “+ Make my own button” again.", "① 上の「名前」に名前を入れる（例：固定資産税）　② もう一度これを押す"); return; }
      S.chips = Array.isArray(S.chips) ? S.chips : []; if (!S.chips.includes(v) && S.chips.length < 20) S.chips.push(v); save(); render();
    }));
    const amt = input("b-amt", "text", "", { inputmode: "decimal", placeholder: tr("Amount") });
    const ev = select("b-ev", EV, "month");
    const due = input("b-due", "date", E.fromDays(E.toDays(t) + 7));
    const cm = input("b-cm", "number", 5, { min: 1, max: 60, step: 1, inputmode: "numeric" }); const cmf = field(tt("Every how many months? (1–60)", "何か月おき？（1〜60）"), cm);
    const syncCm = () => { cmf.style.display = ev.value === "custom" ? "" : "none"; }; ev.addEventListener("change", syncCm);
    const everyVal = () => { if (ev.value !== "custom") return ev.value; const n = Math.min(60, Math.max(1, Math.round(Number(cm.value) || 1))); return n === 1 ? "month" : n === 3 ? "quarter" : n === 12 ? "year" : "m" + n; };
    const until = input("b-until", "date", "");
    if (eb) { name.value = eb.name; amt.value = String(eb.amount); if (EV[eb.every]) ev.value = eb.every; else { ev.value = "custom"; cm.value = String(E.monthsOf(eb.every)); } due.value = eb.due; until.value = eb.until || ""; }
    wrap.append(field("Name", name), tpl, errEl, field("Amount", amt), field("How often do you pay this?", ev), cmf, field("Next due date", due), field("Final payment date (optional)", until));
    const add = button("Add payment", "primary", () => {
      const a = num(amt.value);
      if (!name.value.trim() || isNaN(a) || a <= 0 || !due.value) { errEl.hidden = false; errEl.textContent = tr("Enter a name, amount, and date."); errEl.scrollIntoView({ block: "center" }); return; }
      if (eb) { eb.name = name.value.trim(); eb.amount = a; eb.every = everyVal(); eb.due = due.value; if (until.value) eb.until = until.value; else delete eb.until; editBillId = null; save(); flash = tt("Saved.", "保存しました。"); render(); return; }
      const nb = { id: uid(), name: name.value.trim(), amount: a, every: everyVal(), due: due.value }; if (until.value) nb.until = until.value;
      S.bills.push(nb); save(); flash = ""; render();
    });
    syncCm();
    if (eb) add.textContent = tt("Save changes", "保存する");
    wrap.append(add); add.style.cssText = "width:100%;margin-top:4px";
    if (eb) { const cn = button("Cancel", "", () => { editBillId = null; render(); }); cn.style.cssText = "width:100%"; wrap.append(cn); }
    f.append(wrap); view.append(f);
    if (eb) setTimeout(() => f.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  /* ---------- Income ---------- */
  const NEXT = { expected: "invoiced", invoiced: "received" };
  const LBL = { expected: "Expected", invoiced: "I asked for payment (not paid yet)", received: "In my account" };
  function incomeView() {
    const t = todayStr();
    const m = el("section", "card"); m.append(el("h2", null, "When do you get paid?"));
    const mode = select("i-mode", { regular: tr("I get paid on a regular schedule."), variable: tr("Money comes in on different days.") }, S.mode);
    const wrap = el("div"); wrap.style.cssText = "display:flex;flex-direction:column;gap:12px;margin-top:10px";
    const pd = input("i-pd", "date", S.payday || t); const cyc = select("i-cyc", { weekly: tr("Weekly"), biweekly: tr("Every 2 weeks"), semimonthly: tr("Twice a month (1st & 15th)"), monthly: tr("Monthly") }, S.cycle);
    const pdw = el("div"); pdw.style.cssText = "display:flex;flex-direction:column;gap:12px"; pdw.append(field("When will you get paid next?", pd), field("How often do you get paid?", cyc)); pdw.style.display = S.mode === "variable" ? "none" : "flex";
    mode.addEventListener("change", () => { S.mode = mode.value; if (S.mode === "regular" && !S.payday) S.payday = t; save(); render(); });
    pd.addEventListener("change", () => { if (pd.value) { S.payday = pd.value; save(); } }); cyc.addEventListener("change", () => { S.cycle = cyc.value; save(); });
    wrap.append(field("Which one is right for you?", mode), pdw); m.append(wrap);
    if (S.mode === "variable") { const p = el("p", "sub", "Only money you have received counts in today’s amount. Money you’re waiting for is shown separately."); p.style.marginTop = "10px"; m.append(p); }
    view.append(m);
    const l = el("section", "card"); l.append(el("h2", null, "Money coming in"));
    const items = S.income.slice().sort((a, b) => b.date.localeCompare(a.date));
    if (!items.length) l.append(el("p", "sub", "No money added yet. Add your pay or money you expect to get."));
    const list = el("div", "list");
    items.forEach((i) => {
      const it = el("div", "item"); const left = el("div", "l"); { const t1 = raw("div", null, ""); t1.append(tapNum(fmt(i.amount), i.amount, (v) => { taxSet(i, v); i.amount = v; save(); render(); }, null, null, (i.label ? i.label + ", " : "") + fmtDate(i.date) + ", " + tr(LBL[i.status])), i.label ? "　" + i.label : ""); left.append(t1); } left.append( raw("div", "sub", fmtDate(i.date) + " · " + tr(LBL[i.status])));
      const r = el("div", "r");
      if (NEXT[i.status]) r.append(button(i.status === "expected" ? "Ask for payment" : "Money arrived", "link", () => { i.status = NEXT[i.status]; if (i.status === "received") { if (i.date > t || (S.balance && S.balance.asOf && i.date < S.balance.asOf)) i.date = t; i.ts = Date.now(); flash = taxMsg(taxOn(i)); } save(); render(); }));
      r.append(button("Remove", "link danger", () => { taxOff(i); S.income = S.income.filter((x) => x.id !== i.id); save(); render(); }));
      it.append(left, r); list.append(it);
    });
    l.append(list); view.append(l);
    const f = el("section", "card"); f.append(el("h2", null, "Add money coming in"), raw("p", "sub", tt("Record your pay or any money you received or expect to receive. Money marked “In my account” is added to the amount you can spend today.", "給料や、入ったお金・入る予定のお金を、ここに記録します。「入った」にしたお金は、今日使えるお金にふえます。")));
    const w2 = el("div"); w2.style.cssText = "display:flex;flex-direction:column;gap:12px";
    const amt = input("m-amt", "text", "", { inputmode: "decimal", placeholder: tr("Amount") }); const dt = input("m-dt", "date", t); const lb = input("m-lb", "text", "", { maxlength: 40, placeholder: tr("Note (optional)") });
    const st = select("m-st", { received: tr("In my account"), invoiced: tr("I asked for payment (not paid yet)"), expected: tr("Expected (I haven’t asked for payment yet)") }, "received");
    w2.append(field("Amount", amt), field("Date", dt), field("Status", st), field("Note (optional)", lb));
    const add = button("Add", "primary", () => { const a = num(amt.value); if (isNaN(a) || a <= 0 || !dt.value) return say(tr("Please type an amount and a date.")); const ni = { id: uid(), ts: Date.now(), date: dt.value, amount: a, status: st.value, label: lb.value.trim() }; S.income.push(ni); flash = taxMsg(taxOn(ni)); save(); render(); });
    add.style.cssText = "width:100%;margin-top:14px"; f.append(w2, add); view.append(f);
  }

  /* ---------- Settings ---------- */
  function settingsView() {
    const mk = () => { const g = el("div"); g.style.cssText = "display:flex;flex-direction:column;gap:12px"; return g; };
    const gA = mk(), gB = mk(), gC = mk(), gX = mk(); const w = gX; // w（言語・単位）は一番下のカードへ
    { const w2 = el("div"); const l2 = el("label", null, tt("Lucky charm picture (top of the Today screen). Tap a picture to choose it.", "お守りの絵（今日の画面の上に出ます）。絵を押すと選べます。")); l2.id = "c-art-label"; const grid = el("div", "art-grid", null, { id: "c-art" }); grid.setAttribute("role", "group"); grid.setAttribute("aria-labelledby", "c-art-label");
      ART.forEach((a2) => { const b2 = el("button", "art-pick", null, { type: "button" }); b2.setAttribute("data-art", a2[0]); const on = a2[0] === artId(); b2.setAttribute("aria-pressed", on ? "true" : "false"); if (on) b2.classList.add("on"); b2.append(el("span", "art-pic"), raw("span", "art-name", (on ? "✓ " : "") + tt(a2[1], a2[2])), ...(S.lang === "ja" ? [] : [raw("span", "art-mean", a2[3])])); b2.addEventListener("click", () => { S.art = a2[0]; save(); render(); setTimeout(() => { const g2 = document.getElementById("c-art"); if (g2) g2.scrollIntoView({ block: "center" }); }, 50); }); grid.append(b2); });
      w2.append(l2, grid); w.append(w2); }
    const ls = langSelect(); w.append(field("Language", ls));
    const cur = select("c-cur", { "$": tt("US dollar ($)", "米ドル ($)"), "€": tt("Euro (€)", "ユーロ (€)"), "£": tt("British pound (£)", "英ポンド (£)"), "¥": tt("Japanese yen (¥)", "日本円 (¥)"), "C$": tt("Canadian dollar (C$)", "カナダドル (C$)"), "A$": tt("Australian dollar (A$)", "豪ドル (A$)") }, S.currency);
    cur.addEventListener("change", () => { S.currency = cur.value; save(); render(); });
    w.append(field("Currency symbol", cur));
    { const lcI = input("c-lc", "number", S.livingCost || 0, { min: 0, step: "any" }); lcI.addEventListener("change", () => { S.livingCost = Math.max(0, num(lcI.value) || 0); save(); render(); }); gC.append(field(tt("Monthly food and living costs (a rough amount is fine: food, household items, transportation). Used to estimate your monthly total. This amount does not change “Money you can use today”. If you also list the same costs under Payments, they may be counted twice in the estimated monthly total. 0 = not entered", "毎月の食費・生活費（だいたいでOK。食費・日用品・交通など）。暮らしに必要な額を出すのに使います。「今日使えるお金」は変わりません。同じ費用を「支払い予定」にも入れると、二重に数えることがあります。0＝入れない"), lcI)); }
    if (S.mode === "variable") { const wd = input("c-wd", "number", S.windowDays, { min: 7, max: 60 }); wd.addEventListener("change", () => { S.windowDays = Math.min(60, Math.max(7, parseInt(wd.value, 10) || 14)); save(); render(); }); gC.append(field("How many days should the app plan for? (when you get paid on different days)", wd)); }
    if (S.mode === "variable") { const cd = input("c-cd", "number", S.cushionDays == null ? 30 : S.cushionDays, { min: 0, max: 90 }); cd.addEventListener("change", () => { S.cushionDays = Math.min(90, Math.max(0, parseInt(cd.value, 10) || 0)); save(); render(); }); gC.append(field("How many days after that should the app also set aside for? (0 = none)", cd)); }
    if (S.mode === "variable") { const mi = input("c-mi", "number", S.monthlyIncome || 0, { min: 0, step: "any" }); mi.addEventListener("change", () => { S.monthlyIncome = Math.max(0, Number(mi.value) || 0); save(); render(); }); gC.append(field("Income you expect in a normal month (optional, 0 = none)", mi)); }
    if (S.mode === "variable") { const ms = input("c-ms", "number", S.monthlySetAside || 0, { min: 0, step: "any" }); ms.addEventListener("change", () => { S.monthlySetAside = Math.max(0, Number(ms.value) || 0); save(); render(); }); gC.append(field(tt("Amount you plan to set aside each month (for example, 20,000). This is used in the monthly plan when you enter your expected monthly income, and in the monthly amount shown on the Payments screen. It is not automatically added to your set-aside balance. To exclude a fixed amount you already have from money available to spend, use “Money you keep aside” below.", "毎月、取り分けるつもりの額（例：2万円）。「ふつうの月の収入」を入れた時の月の計画と、支払い予定の画面の月の金額に使います。自動で積み立てる機能ではありません。いま持っているお金のうち決まった額（例：20万円）を使うお金から外したい時は、ここではなく、下の「取っておくお金」に入れてください。"), ms)); }
    { const dc = input("c-dc", "number", S.dailyCap || 0, { min: 0, step: "any" }); dc.addEventListener("change", () => { S.dailyCap = Math.max(0, Number(dc.value) || 0); save(); render(); }); gC.append(field("My own daily limit (optional, 0 = none)", dc)); }
    { const tp = input("c-tax", "number", S.taxPct || 0, { min: 0, max: 60, step: "any" }); tp.addEventListener("change", () => { const raw0 = Number(tp.value) || 0; S.taxPct = Math.min(60, Math.max(0, raw0)); save(); if (raw0 > 60 || raw0 < 0) flash = tt("Enter a percentage from 0 to 60. We changed it to " + S.taxPct + "%. To set aside a fixed amount, use “Add something to set aside” above.", "この欄は0〜60の「％」なので、" + S.taxPct + " にしました。金額を取っておきたいときは、上の「取っておくお金を追加」に入れてください。"); render(); });
      const taxDet = el("details", "more"); if (S.taxPct > 0) taxDet.open = true; taxDet.append(raw("summary", null, tt("Tax set-aside (optional, for income without tax taken out)", "税金の自動取り分（税金が引かれずに入る人向け・使わなくてOK）"))); taxDet.append(field(tt("Tax set-aside (%): Enter a number from 0 to 60, not an amount of money. When you record money as received, the app sets aside this percentage for tax. 0 = off. This applies only to money you record as received from now on. It does not move money in your bank.", "税金の自動取り分（％）：0〜60の数字を入れます（金額ではありません）。税金のために、入ったお金の何%を取っておくか決めます（例：20 → 10万円入ると2万円を「税金（自動）」に取っておく。アプリの中で分けるだけで、銀行のお金は動きません。この設定より前に入れたお金には足しません。0＝しない）"), tp)); gB.append(taxDet); }
    { // 取っておくお金：名前と金額を、いくつでも
      const kb = el("div"); kb.id = "keep-block"; kb.append(raw("label", null, tt("Money you keep aside: an amount you want to leave untouched (for example, 200,000 for emergencies). The app subtracts it when working out money available to spend; it does not move money or guarantee that the amount stays in your account.", "取っておくお金：使わずに残したい額（例：もしもの時の20万円）。アプリは、使えるお金を出す時に、この額を引きます。銀行のお金は動かず、残ることを約束するものでもありません。")));
      (S.keeps || []).forEach((k) => {
        const r1 = el("div", "keeprow");
        const nm = input("kn-" + k.id, "text", k.name, { placeholder: tt("Name", "名前") }), am = input("ka-" + k.id, "number", k.amount, { min: 0, step: "any", placeholder: "0" });
        nm.addEventListener("change", () => { k.name = nm.value.trim() || tt("Set aside", "取っておく"); save(); render(); });
        am.addEventListener("change", () => { const nv = Math.max(0, Number(am.value) || 0); logKeep(k.name, k.amount, nv); k.amount = nv; syncKeep(); save(); render(); });
        r1.append(nm, am, button(tt("Remove", "削除"), "link danger", () => { logKeep(k.name, k.amount, 0, true); S.keeps = S.keeps.filter((x) => x.id !== k.id); syncKeep(); save(); render(); }));
        kb.append(r1);
      });
      kb.append(raw("p", "sub", tt("Total set aside: " + fmt(keepSum()), "取っておくお金の合計：" + fmt(keepSum()))));
      kb.append(button(tt("Add something to set aside", "取っておくお金を追加"), "", () => { (S.keeps = S.keeps || []).push({ id: uid(), name: tt("Savings", "貯金"), amount: 0 }); save(); render(); }));
      const lg2 = (S.keepLog || []).slice(-20).reverse();
      if (lg2.length) {
        const hd = el("details", "more"); hd.append(raw("summary", null, tt("Recent changes to set-aside amounts", "増えた・減った記録")));
        lg2.forEach((e0) => { const e = Object.assign({}, e0, { name: e0.name === "税金（自動）" || e0.name === "Tax (auto)" ? tt("Tax (auto)", "税金（自動）") : e0.name }); const d = Math.round((e.to - e.from) * 100) / 100; hd.append(raw("p", "sub", (S.lang === "ja" ? fmtDate(e.date) + "　" + e.name + "　" + fmt(e.from) + " → " + fmt(e.to) + "（" + (d >= 0 ? "＋" : "−") + fmt(Math.abs(d)) + (e.removed ? "・削除" : "") + "）" : fmtDate(e.date) + "  " + e.name + "  " + fmt(e.from) + " → " + fmt(e.to) + " (" + (d >= 0 ? "+" : "−") + fmt(Math.abs(d)) + (e.removed ? ", removed" : "") + ")"))); });
        kb.append(hd);
      }
      gB.insertBefore(kb, gB.firstChild);
    }
    { // 口座ごとの内訳（なくてもOK）
      const ab = el("details", "more"); if ((S.accounts || []).length) ab.open = true;
      ab.append(raw("summary", null, tt("List my money by location (optional)", "現金や銀行など、場所ごとに入れる（なくてもOK）")));
      ab.append(raw("p", "sub", tt("Enter the amount in each place, such as cash or a bank account. Tap the button below to use the total as your current balance.", "現金・銀行・貯金など。それぞれ入れて、下のボタンを押すと、その合計が「いま持っているお金」になります。")));
      (S.accounts = S.accounts || []).forEach((a) => {
        const r1 = el("div", "keeprow");
        const nm = input("an-" + a.id, "text", a.name, { placeholder: tt("Name", "名前") }), am = input("aa-" + a.id, "number", a.amount, { step: "any", placeholder: "0" });
        nm.addEventListener("change", () => { a.name = nm.value.trim() || tt("Account", "置き場"); save(); });
        am.addEventListener("change", () => { a.amount = Number(am.value) || 0; S.accountsAt = null; save(); render(); });
        r1.append(nm, am, button(tt("Remove", "削除"), "link danger", () => { S.accounts = S.accounts.filter((x) => x.id !== a.id); S.accountsAt = null; save(); render(); }));
        ab.append(r1);
      });
      const asum = round2c(S.accounts.reduce((x, a) => x + (Number(a.amount) || 0), 0));
      ab.append(button(tt("Add a place for your money", "お金の場所を足す（現金・銀行など）"), "", () => { S.accounts.push({ id: uid(), name: tt("Bank", "銀行"), amount: 0 }); save(); render(); }));
      if (S.accounts.length) {
        ab.append(raw("p", "sub", tt("Total entered: " + fmt(asum), "置き場の合計：" + fmt(asum))));
        const applied = S.balance && S.accountsAt && S.balance.at === S.accountsAt;
        if (!applied) ab.append(note(tt("This total has not been applied to your current balance. Tap the button below to apply it.", "この合計は、まだ「いま持っているお金」になっていません。下のボタンを押すと、入れかわります。")));
        const ub = button(tt("Use this total as my current balance", "この合計を「いま持っているお金」に入れる"), "primary", () => { const at = Date.now(); S.balance = { amount: asum, asOf: todayStr(), at }; S.accountsAt = at; save(); flash = tt("Saved. Your current balance is " + fmt(asum) + ".", "保存しました。いま持っているお金は " + fmt(asum) + " です。"); render(); });
        ub.style.cssText = "width:100%;margin-top:10px"; ab.append(ub);
      }
      gA.append(ab);
    }
    if (S.mode !== "variable") { const pa = input("c-pa", "number", S.payAmount || 0, { min: 0, step: "any" }); pa.addEventListener("change", () => { S.payAmount = Math.max(0, Number(pa.value) || 0); save(); render(); }); gC.append(field(tt("Your usual paycheck (optional, 0 = none)", "いつもの給料の額（なくてもOK。0＝なし）"), pa)); }
    const r0 = E.compute(S, todayStr()); const card = (title, hint, g) => { const c = el("section", "card"); c.append(raw("h2", null, title)); if (hint) c.append(raw("p", "sub", hint)); c.append(g); view.append(c); return c; };
    { // 入れた数字で、今日使えるお金がいくらになるか（そのまま見える）
      const hc = el("section", "card hero"); hc.append(raw("p", "sub", tt("With these numbers, the money you can use today is", "いまの数字だと、今日使っていいお金は")));
      const hb = raw("div", "big", fmt(Math.floor(r0.safeToday * Math.pow(10, dec()) + 1e-6) / Math.pow(10, dec()))); hc.append(hb);
      const tick = (ok, text, go, label) => { const li = raw("p", "sub", (ok ? "✓ " : "△ ") + text); if (go) { li.append(" ", button(label || tt("Go", "入れる"), "link", go)); } return li; };
      const toBox = (g) => () => { const t0 = g.closest("section"); if (t0) { t0.scrollIntoView({ behavior: "smooth", block: "start" }); const i0 = g.querySelector("input, .tapnum"); if (i0) setTimeout(() => i0.focus({ preventScroll: true }), 300); } };
      const ageD = S.balance && S.balance.asOf ? E.toDays(todayStr()) - E.toDays(S.balance.asOf) : null;
      hc.append(tick(ageD != null && ageD <= 7, ageD == null ? tt("Money you have now: not entered", "いま持っているお金：まだ入っていません") : tt("Money you have now: entered " + (ageD === 0 ? "today" : ageD === 1 ? "yesterday" : ageD + " days ago"), "いま持っているお金：" + (ageD === 0 ? "今日入れました" : ageD + "日前に入れました") + (ageD > 7 ? "（古いかもしれません。入れ直してください）" : "")), toBox(gA), tt("Edit below", "下で直す")));
      hc.append(tick(S.bills.length > 0, S.bills.length ? tt("Payments: " + S.bills.length + " added. Check that none are missing.", "支払い予定：" + S.bills.length + "件。入れ忘れがないか見てください") : tt("Payments: none added yet. If you really have none, that’s fine.", "支払い予定：まだありません。本当に支払いがなければ、このままでOKです"), () => { tab = "bills"; render(); }, tt("Add or review", "見る・足す")));
      if (!varMode()) { hc.append(tick(!!S.payday, S.payday ? tt("Next payday: " + fmtDate(r0.payday) + (S.payday < todayStr() ? " (your saved date had passed, so the app moved it forward)" : ""), "次の給料日：" + fmtDate(r0.payday) + (S.payday < todayStr() ? "（入れた日付が過ぎていたので、アプリが次の日に進めました）" : "")) : tt("Next payday: not entered", "次の給料日：まだ入っていません"), () => { tab = "income"; render(); }, tt("Check", "確かめる"))); }
      else hc.append(tick(Number(S.monthlyIncome) > 0, Number(S.monthlyIncome) > 0 ? tt("Usual monthly income: " + fmt(S.monthlyIncome), "ふつうの月の収入：" + fmt(S.monthlyIncome)) : tt("Usual monthly income: not entered (optional, fine to leave)", "ふつうの月の収入：まだ入っていません（なくてもOK。入れると、使いすぎを防ぐ目安になります）"), toBox(gC), tt("Fill in below", "下で入れる")));
      if ((S.accounts || []).length && !(S.balance && S.accountsAt && S.balance.at === S.accountsAt)) hc.append(tick(false, tt("Your list of places for your money has not been applied to “Money you have now” yet.", "置き場ごとの合計が、まだ「いま持っているお金」に入っていません"), () => { const d0 = gA.querySelector("details"); if (d0) { d0.open = true; d0.scrollIntoView({ behavior: "smooth", block: "center" }); } }, tt("Apply below", "下で反映する")));
      hc.append(tick(Number(S.livingCost) > 0, Number(S.livingCost) > 0 ? tt("Food and living costs: " + fmt(S.livingCost) + " a month", "食費・生活費：月 " + fmt(S.livingCost)) : tt("Food and living costs: not entered", "食費・生活費：まだ入っていません（入れると、暮らしに必要な額が出ます）"), toBox(gC), tt("Fill in below", "下で入れる")));
      hc.append(tick(keepSum() > 0, keepSum() > 0 ? tt("Money you keep aside: " + fmt(keepSum()), "取っておくお金：" + fmt(keepSum())) : tt("Money you keep aside: none (optional)", "取っておくお金：なし（なくてもOK）")));
      view.append(hc);
    }
    { const br = el("div", "mrow"); br.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:18px"; br.append(raw("span", null, tt("Money you have now (cash and bank)", "いま持っているお金（現金と銀行）")), (() => { const bw = raw("b", null, ""); bw.append(tapNum(fmt(r0.available), roundC(r0.available), (v) => { S.balance = { amount: v, asOf: todayStr(), at: Date.now() }; save(); render(); }, null, "any", tt("Money you have now", "いま持っているお金"))); return bw; })()); gA.prepend(br); }
    card(tt("1. How much do you have now?", "① いま、いくら持っていますか？"), tt("Tap the underlined amount to change it. If you keep money in several places, you can list them below.", "金額を押すと直せます。現金と銀行などを分けたい時は、下に入れます。"), gA);
    card(tt("2. Money to keep aside", "② 取っておくお金（使わずに残す額）"), tt("We leave this money out when working out how much you can use today.", "ここに入れた額は、使えるお金に数えません。"), gB);
    { const dcW = gC.querySelector("#c-dc") && gC.querySelector("#c-dc").parentNode; const adv = el("details", "more"); if ((S.livingCost || 0) > 0 || (S.monthlyIncome || 0) > 0 || (S.monthlySetAside || 0) > 0) adv.open = true; adv.append(raw("summary", null, tt("More settings (optional)", "くわしい設定（ふだんは触らなくてOK）")));
      Array.from(gC.children).forEach((ch) => { if (ch !== dcW) adv.append(ch); }); if (adv.children.length > 1) gC.append(adv); }
    card(tt("3. Your daily limit", "③ 1日に使う上限"), tt("To set a daily limit, enter it here. If you don’t want one, leave it at 0.", "1日に使う額に上限を付けたいときだけ、入れます。いらなければ0のままです。"), gC);
    { const lc = el("section", "card"); lc.append(raw("h2", null, tt("4. Language, currency and picture", "④ 言葉・お金の単位・お守りの絵")), gX); view.append(lc); }
    const b = el("section", "card"); b.append(el("h2", null, "Your saved information"), el("p", "sub", "Your information stays in this app on this device. It isn’t sent anywhere. Save a copy now and then. You can load it on another device."));
    const row = el("div"); row.style.cssText = "display:flex;flex-direction:column;gap:10px;margin-top:12px";
    row.append(button("Save a copy", "", () => {
      const blob = new Blob([JSON.stringify(S)], { type: "application/json" }); const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "payday-calm-backup-" + todayStr() + ".json"; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }));
    const fi = el("input", null, null, { type: "file", accept: "application/json,.json", id: "restore" });
    fi.addEventListener("change", () => { const f = fi.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { const o = JSON.parse(rd.result); if (!looksOurs(o)) throw 0; const prevRaw = JSON.stringify(S); let kept = true; try { localStorage.setItem(KEY + ".before-restore", prevRaw); kept = localStorage.getItem(KEY + ".before-restore") === prevRaw; } catch (e2) { kept = false; } if (!kept) { say(tt("I couldn’t keep a copy of your current information, so nothing was changed. Use “Save a copy” first, then try again.", "いまの記録を取っておけなかったので、何も変えていません。先に「記録を保存する」で控えを作ってから、もう一度やってください。")); return; } restoreFrom(o); } catch (e) { say(tr("I can’t use this file. Choose a file saved from Payday Calm.")); } }; rd.readAsText(f); });
    row.append(field("Load a saved copy", fi));
    row.append(raw("p", "sub", tt("Loading a saved copy replaces your current information in the app. If your previous information was saved on this device, you can use “Go back to my previous information” to restore it. Save a separate copy first if you want a backup.", "記録を戻すと、いまの記録は、選んだ記録に入れかわります。入れかわる前の記録は残るので、すぐなら元に戻せます。")));
    { let prevRaw = null; try { prevRaw = localStorage.getItem(KEY + ".before-restore"); } catch (e) {}
      if (prevRaw) row.append(button(tt("Go back to my previous information", "戻す前の記録に戻す"), "", () => { const cur = S; try { const o = JSON.parse(prevRaw); S = fromSaved(o); save(); if (saveFailed) { S = cur; say(tt("Couldn’t restore your previous information. Please try again.", "元に戻せませんでした。もう一度試してください。")); return; } localStorage.removeItem(KEY + ".before-restore"); flash = tt("Your previous information has been restored.", "戻す前の記録に戻しました。"); render(); } catch (e) { S = cur; say(tt("Couldn’t restore your previous information. Please try again.", "元に戻せませんでした。もう一度試してください。")); } })); }
    let armed = false; const er = button("Delete all saved information", "danger", () => { if (!armed) { armed = true; er.textContent = tr("Tap again to delete it all."); return; } const lang = S.lang; S = fresh(); S.lang = lang; S.noSample = true; save(); flash = ""; render(); }); row.append(er);
    b.append(row); view.append(b);
    const h = el("section", "card"); h.append(el("h2", null, "How we work out today’s amount"));
    h.append(raw("p", "sub", varMode()
      ? tt("We check each day in your planning period and any additional days you chose, taking into account bills, money set aside, and any estimated monthly income. The tightest day determines your daily amount. Your monthly plan or your own daily limit may lower it.", "先の日々を1日ずつ見て、いちばん苦しい日に合わせて、1日の金額を決めます。自分で決めた上限があれば、それより多くはなりません。")
      : tt("We estimate a daily amount using the money you have, upcoming bills and set-asides, and the days until payday. Your daily limit may also apply.", "持っているお金・これから払うお金・取っておくお金と、次にお金が入る日までの日数から、1日の目安を出します。自分で決めた1日の上限があれば、それも使います。")));
    if (varMode() && Number(S.monthlyIncome) > 0) h.append(raw("p", "sub", tt("Money you’re waiting for is not added to the money you have now. Your estimated monthly income is used to plan ahead and may affect your daily amount.", "まだ入っていないお金は、いま持っているお金に足しません。「ふつうの月の入るお金」は、先の計画に使います。1日に使える額が変わることがあります。")));
    [!(varMode() && Number(S.monthlyIncome) > 0) ? "Only money you have received is counted. Money you’re waiting for is shown separately." : null, "When you enter today’s amount again, the app won’t count earlier spending or money received twice.", "For bills you pay every 3 or 12 months, the app sets aside a little each month."].filter(Boolean).forEach((t) => h.append(el("p", "sub", t)));
    h.lastChild.style.marginBottom = "0"; view.append(h);
  }

  const ART = [["E2", "Treasure ship", "宝船", "A treasure ship is a New Year symbol of good fortune."], ["E4", "Koi carp", "錦鯉", "A symbol of perseverance and success."], ["F1", "Mallet and rice bales", "小槌と米俵", "A lucky mallet and rice bales are symbols of abundance."], ["H1", "Red and white cord", "水引", "Mizuhiki is a decorative paper cord used on gifts."], ["H3", "Lucky bell", "福の鈴", "A small bell whose ring is said to invite good luck."], ["H5", "Temari balls", "手まり", "Temari are decorative balls often given as gifts."], ["Q1", "Camellias", "椿", "Camellias bring color to the colder months."], ["Q9", "Paper lanterns", "提灯", "Paper lanterns add light to Japanese festivals."], ["R1", "Fireworks over the sea", "海辺の花火", "Summer festival fireworks: a bright celebration."], ["R5", "Autumn pagoda", "紅葉と五重塔", "A five-story pagoda surrounded by autumn leaves."], ["R8", "Snowy golden pavilion", "雪の楼閣と椿", "A golden pavilion in a peaceful winter scene."], ["S1b", "Waves and lightning", "藍の波と雷", "Rolling waves and lightning create a lively pattern."], ["S4", "Silver and blue rings", "銀と青の七宝", "Linked rings (shippo) stand for harmony and lasting ties."], ["S5", "Woven cords", "えんじの組紐", "Kumihimo is a traditional Japanese braided cord."]];
  const artId = () => (ART.some((a) => a[0] === S.art) ? S.art : "E2");
  function render() {
    document.documentElement.setAttribute("data-art", artId());
    if (!S.setup && !S.noSample) applySample(); taxCatchUp(); { const tk = (S.keeps || []).find((x) => x.id === "tax"); if (tk && (tk.name === "税金（自動）" || tk.name === "Tax (auto)")) tk.name = tt("Tax (auto)", "税金（自動）"); }
    demoBar(); view.textContent = "";
    // 戻る：画面が変わったら、前の画面を覚えておく（iPhoneの横スワイプ・ブラウザの戻るでも戻れる）
    { const cur = tab + "|" + (tab === "plan" ? planMode : tab === "month" ? monthOffset : ""); if (navGoingBack) navGoingBack = false; else if (navLast && navLast !== cur && S.setup) { navStack.push(navLast); if (navStack.length > 30) navStack.shift(); try { history.pushState({ pc: navStack.length }, ""); navPushed++; } catch (e) { /* 戻るボタンだけで動く */ } } navLast = cur; }
    if (navStack.length && S.setup && tab !== "today") { const bb = button(tt("← Back", "← 戻る"), "link backbtn", navBackBtn); bb.setAttribute("aria-label", tt("Back to the previous screen", "前の画面に戻る")); view.append(bb); }
    if (loadBroken && !brokenKept && !rawDownloaded) {
      const w = note(tt("The saved information on this device couldn’t be read, and a separate copy couldn’t be kept. Download it and check that the file is saved before continuing. Until you continue, no new information will be saved on this device.", "この端末の記録が読めず、別に残すこともできませんでした。ファイルを保存し、保存できたか確かめてから続けてください。それまでは新しい記録をこの端末に保存しません。")); w.setAttribute("role", "alert");
      w.append(" ", button(tt("Download the unreadable data", "読めなかった記録をファイルに保存"), "link", () => { const bl = new Blob([brokenRaw], { type: "application/json" }), a = document.createElement("a"); a.href = URL.createObjectURL(bl); a.download = "payday-calm-unreadable-" + todayStr() + ".json"; document.body.appendChild(a); a.click(); a.remove(); rawDlStarted = true; render(); }));
      // ダウンロードが本当に保存できたかはアプリから分からないので、本人が確かめてから「続ける」を押した時だけ、保存を始める
      if (rawDlStarted) w.append(" ", button(tt("I checked that the file was saved. Continue", "ファイルが保存できたのを確かめました。続ける"), "link", () => { rawDownloaded = true; saveFailed = false; save(); render(); }));
      view.append(w);
    } else if (loadBroken && !userActed) { const W2 = tt("The saved information on this device couldn’t be read. A separate copy was kept on this device, not deleted.", "このスマホやパソコンに保存された記録が読めませんでした。消さずに、このスマホやパソコンの別の場所に残してあります。"); if (flash.indexOf(W2) < 0) flash = W2 + (flash ? " " + flash : ""); }
    if (saveFailed && !(loadBroken && !brokenKept && !rawDownloaded)) { const W = tt("Your information couldn’t be saved on this device. Storage may be full or blocked. If “My numbers” is available, use “Save a copy” to back up your current information.", "このスマホやパソコンに記録を保存できませんでした。保存場所がいっぱいか、使えない設定になっているかもしれません。「自分の数字」が開ければ、下の方の「記録をファイルに保存」で、いまの記録を残してください。"); if (flash.indexOf(W) < 0) flash = W + (flash ? " " + flash : ""); }
    document.documentElement.lang = S.lang === "ja" ? "ja" : "en";
    document.querySelectorAll(".tabs button").forEach((b) => { { const on = b.dataset.tab === (tab === "month" ? "today" : tab === "plan" ? "bills" : tab); b.classList.toggle("on", on); if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); } b.textContent = tr({ today: "Today", bills: "Payments", income: "Income", settings: "My numbers" }[b.dataset.tab]); });
    if (flash) { const n = note(flash); n.setAttribute("role", "status"); n.tabIndex = -1; view.append(n); if (focusFlash) { focusFlash = false; n.focus(); } }
    if (!S.setup) { $(".tabs").hidden = true; setupView(); return; }
    $(".tabs").hidden = false;
    ({ today: todayView, month: monthView, plan: planView, bills: billsView, income: incomeView, settings: settingsView })[tab]();
    // 大きな数字が枠からはみ出す時は、収まるまで文字を小さくする
    // 同じ金額が並んでも区別できるように、読み上げの名前に、その行の名前（支払い名・分類など）を足す
    document.querySelectorAll(".item .tapnum:not([data-named]), .mrow .tapnum:not([data-named])").forEach((tn) => { const row = tn.closest(".item, .mrow"), lb = row && (row.querySelector(".l > div") || row.querySelector(".l") || row.querySelector("span")); const nm = lb ? (lb.firstChild && lb.firstChild.nodeType === 3 ? lb.firstChild.textContent : lb.textContent).trim().slice(0, 40) : ""; const nm2 = nm.replace(tn.textContent, "").replace(/^[\s　·]+|[\s　·]+$/g, ""); if (nm2) tn.setAttribute("aria-label", tt("Change amount " + tn.textContent + " for " + nm2, nm2 + " の金額 " + tn.textContent + " を直す")); });
    document.querySelectorAll(".big").forEach((b) => { let f = parseFloat(getComputedStyle(b).fontSize), g = 0; while (b.scrollWidth > b.clientWidth + 1 && f > 16 && g++ < 40) { f -= 2; b.style.fontSize = f + "px"; } });
    window.scrollTo(0, 0);
  }
  document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; flash = ""; render(); }));
  // 開いたまま日付が変わったら（夜中の0時・別のアプリから戻った時）、新しい日で描き直す。入力中の欄があれば邪魔しない
  let shownDay = todayStr();
  const dayCheck = () => { const d = todayStr(); if (d !== shownDay) { const ae = document.activeElement; const typing = ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && ae.value; if (!typing) { shownDay = d; render(); } } };
  setInterval(dayCheck, 1000); document.addEventListener("visibilitychange", () => { if (!document.hidden) dayCheck(); }); window.addEventListener("focus", dayCheck);
  // 開発用：同じWi-Fiの中のテスト用リンクに限り、?import=（データのアドレス）で、読み込める。公開サイトでは、この条件に合わず、動かない。
  const imp = new URLSearchParams(location.search).get("import");
  if (imp && /^(192\.168\.|localhost$|127\.0\.0\.1$)/.test(location.hostname)) {
    fetch(imp).then((r) => r.json()).then((o) => { if (o && o.v === 1) { S = fromSaved(o); save(); flash = tr("Your saved information is back."); } history.replaceState(null, "", location.pathname); render(); }).catch(() => { render(); });
  } else render();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
