(() => {
  const supabase = window.schoolSupabase;
  const SESSION_USER_KEY = "khadmActiveStudentId";
  const RELOAD_GUARD_KEY = "khadmAccountScopeReload";
  const CONVERSATION_IMPORT_KEY = "khadmConversationImportUser";
  const pendingExamSaves = new Map();
  document.documentElement.classList.add("account-session-check");

  function applyUserScope(userId) {
    const previousId = localStorage.getItem(SESSION_USER_KEY);
    if (previousId === userId) {
      sessionStorage.removeItem(RELOAD_GUARD_KEY);
      return false;
    }

    if (userId) localStorage.setItem(SESSION_USER_KEY, userId);
    else localStorage.removeItem(SESSION_USER_KEY);
    if (!sessionStorage.getItem(RELOAD_GUARD_KEY)) {
      sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
      window.location.reload();
      return true;
    }
    sessionStorage.removeItem(RELOAD_GUARD_KEY);
    document.documentElement.classList.remove("account-session-check");
    return false;
  }

  if (!supabase) {
    document.documentElement.classList.remove("account-session-check");
    return;
  }

  async function importSavedConversations(userId) {
    const { data, error } = await supabase.from("student_conversations")
      .select("id,title,subject,messages,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    const storageKey = `aiChatSessions:${userId}`;
    const current = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const byId = new Map(current.map((session) => [session.id, session]));
    let changed = false;
    for (const saved of data) {
      if (byId.has(saved.id)) continue;
      byId.set(saved.id, {
        id: saved.id,
        title: saved.title,
        mode: saved.subject,
        messages: Array.isArray(saved.messages) ? saved.messages : [],
      });
      changed = true;
    }
    if (changed) localStorage.setItem(storageKey, JSON.stringify([...byId.values()]));
    return changed;
  }

  supabase.auth.getSession().then(async ({ data, error }) => {
    if (error) console.error("تعذر التحقق من جلسة الحساب:", error.message);
    const userId = data?.session?.user?.email_confirmed_at ? data.session.user.id : null;
    if (applyUserScope(userId)) return;
    if (!userId) {
      document.documentElement.classList.remove("account-session-check");
      return;
    }
    try {
      const changed = await importSavedConversations(userId);
      if (changed && sessionStorage.getItem(CONVERSATION_IMPORT_KEY) !== userId) {
        sessionStorage.setItem(CONVERSATION_IMPORT_KEY, userId);
        window.location.reload();
        return;
      }
      if (!changed) sessionStorage.removeItem(CONVERSATION_IMPORT_KEY);
      document.documentElement.classList.remove("account-session-check");
    } catch (syncError) {
      console.error("تعذر تحميل سجل محادثات الحساب:", syncError);
      document.documentElement.classList.remove("account-session-check");
    }
  }).catch((error) => {
    console.error("تعذر التحقق من جلسة الحساب:", error);
    document.documentElement.classList.remove("account-session-check");
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    const userId = session?.user?.email_confirmed_at ? session.user.id : null;
    if (localStorage.getItem(SESSION_USER_KEY) !== userId) applyUserScope(userId);
  });

  window.studentAccount = {
    async persistConversation(conversation) {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const session = data.session;
      if (!session || !conversation?.id || !Array.isArray(conversation.messages)) return;
      const messages = conversation.messages.map((message) => ({
        role: message.role,
        content: typeof message.content === "string" ? message.content : "",
        imagePath: typeof message.imagePath === "string" ? message.imagePath : null,
        createdAt: message.createdAt || null,
      }));
      const { error } = await supabase.from("student_conversations").upsert({
        id: conversation.id,
        user_id: session.user.id,
        title: typeof conversation.title === "string" ? conversation.title.slice(0, 120) : "محادثة جديدة",
        subject: /^[a-z][a-z0-9_-]{0,39}$/.test(conversation.mode || "") ? conversation.mode : "general",
        messages,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (error) throw error;
    },
    async getAuthHeaders() {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
    },
    async persistExam(attempt) {
      if (!attempt?.attemptId || !attempt.answers || !["in_progress", "expired"].includes(attempt.status)) return;
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!data.session) return;
      let pending = pendingExamSaves.get(attempt.attemptId);
      if (!pending) {
        pending = { attempt, waiters: [], timer: null };
        pendingExamSaves.set(attempt.attemptId, pending);
      }
      pending.attempt = attempt;
      const promise = new Promise((resolve, reject) => pending.waiters.push({ resolve, reject }));
      clearTimeout(pending.timer);
      pending.timer = setTimeout(async () => {
        const current = pendingExamSaves.get(attempt.attemptId);
        if (!current) return;
        pendingExamSaves.delete(attempt.attemptId);
        try {
          const response = await fetch("https://frosty-hall-b193.hmoobaha8.workers.dev/api/exams/save", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
            body: JSON.stringify({ attemptId: current.attempt.attemptId, answers: current.attempt.answers }),
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || `تعذر حفظ إجابات الامتحان (${response.status}).`);
          current.waiters.forEach((waiter) => waiter.resolve());
        } catch (error) {
          current.waiters.slice(0, -1).forEach((waiter) => waiter.resolve());
          current.waiters.at(-1)?.reject(error);
        }
      }, 450);
      return promise;
    },
    async storeImage(base64Data, mimeType, fileName) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType) ||
          typeof base64Data !== "string" || base64Data.length > 7_000_000) {
        throw new Error("الصورة غير صالحة أو تتجاوز الحجم المسموح.");
      }
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!data.session) return null;
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("حجم الصورة يتجاوز 5 ميجابايت.");
      const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1];
      const path = `${data.session.user.id}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("student-media").upload(
        path,
        new Blob([bytes], { type: mimeType }),
        { contentType: mimeType, upsert: false },
      );
      if (error) throw error;
      return { path, fileName: typeof fileName === "string" ? fileName.slice(0, 160) : "" };
    },
  };
})();
