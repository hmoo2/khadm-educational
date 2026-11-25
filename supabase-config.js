(() => {
  const SUPABASE_URL = "https://mebmxkguminwbjmnitcq.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_FSMmC7C-xkxdd5yDSyjr2A_zEMQL8cn";

  if (!window.supabase?.createClient) {
    window.dispatchEvent(new CustomEvent("supabase-config-error", {
      detail: "تعذر تحميل مكتبة الاتصال بخدمة الحسابات.",
    }));
    return;
  }

  window.schoolSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
})();
