// 製品版とお試し版の切り替え。お試し版は demo:true にして、置き場へ出す。
window.PC_CONFIG = {
  demo: false,          // true = お試し版（支出の入力に上限）
  demoLimit: 20,        // お試し版で入れられる支出の数
  upgradeUrl: ""        // お試し版の「製品版を入手」ボタンの行き先（Etsyの商品ページ。出品後に入れる）
};
