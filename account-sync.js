(() => {
  const supabase = window.schoolSupabase;
  const WORKER_URL = "https://frosty-hall-b193.hmoobaha8.workers.dev";
  const pendingExamSaves = new Map();
  let resolveAccountReady;
  window.accountUserId = null;
  window.accountChatSessions = [];
  window.accountActiveExam = null;
  window.accountSyncError = null;
  window.accountSessionReady = new Promise((resolve) => {
    resolveAccountReady = resolve;
  });
  document.documentElement.classList.add("account-session-check");

  async function getAuthHeaders() {
    if (!supabase) return {};
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session?.user?.email_confirmed_at
      ? { Authorization: `Bearer ${data.session.access_token}` }
      : {};
  }

  async function loadAccountData(session) {
    const user = session?.user;
    if (!user?.email_confirmed_at) return;
    window.accountUserId = user.id;
    const [conversationsResult, examsResponse] = await Promise.all([
      supabase.from("student_conversations")
        .select("id,title,subject,messages,updated_at")
        .order("updated_at", { ascending: false })
        .limit(50),
      fetch(`${WORKER_URL}/api/account/exams`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${session.access_token}` },
      }).then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `تعذر تحميل سجل الامتحانات (${response.status}).`);
        return body;
      }),
    ]);
    if (conversationsResult.error) throw conversationsResult.error;
    window.accountChatSessions = (conversationsResult.data || []).map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      mode: conversation.subject,
      messages: Array.isArray(conversation.messages) ? conversation.messages : [],
    }));
    const active = examsResponse.attempts?.find((attempt) => attempt.status === "in_progress");
    if (active?.exam && active.id) {
      window.accountActiveExam = {
        attemptId: active.id,
        mode: active.subject,
        exam: active.exam,
        answers: active.answers || {},
        expiresAt: new Date(active.expires_at).getTime(),
        status: "in_progress",
        result: null,
        images: {},
        missingImageIds: [],
      };
    }
  }

  async function initialize() {
    if (!supabase) return false;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session?.user?.email_confirmed_at) {
      if (data.session) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
      }
      return false;
    }
    try {
      await loadAccountData(data.session);
    } catch (loadError) {
      window.accountSyncError = loadError;
      console.error("تعذر تحميل بيانات الحساب:", loadError);
    }
    supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.email_confirmed_at ? session.user.id : null;
      if (nextUserId !== window.accountUserId) window.location.reload();
    });
    return true;
  }

  window.studentAccount = {
    async persistConversation(conversation) {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const session = data.session;
      if (!session?.user?.email_confirmed_at || !conversation?.id || !Array.isArray(conversation.messages)) return;
      const messages = conversation.messages.slice(-200).map((message) => ({
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
    getAuthHeaders,
    async persistExam(attempt) {
      if (!attempt?.attemptId || !attempt.answers || !["in_progress", "expired"].includes(attempt.status)) return;
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!data.session?.user?.email_confirmed_at) return;
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
          const response = await fetch(`${WORKER_URL}/api/exams/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
            body: JSON.stringify({ attemptId: current.attempt.attemptId, answers: current.attempt.answers }),
            keepalive: true,
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || `تعذر حفظ إجابات الامتحان (${response.status}).`);
          current.waiters.forEach((waiter) => waiter.resolve());
        } catch (error) {
          current.waiters.slice(0, -1).forEach((waiter) => waiter.resolve());
          const lastWaiter = current.waiters[current.waiters.length - 1];
          if (lastWaiter) lastWaiter.reject(error);
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
      if (!data.session?.user?.email_confirmed_at) return null;
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
    async signedImageUrl(path) {
      if (typeof path !== "string" || !path.startsWith(`${window.accountUserId}/`)) {
        throw new Error("مسار الصورة لا يخص الحساب الحالي.");
      }
      const { data, error } = await supabase.storage.from("student-media").createSignedUrl(path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  };

  initialize()
    .then((authenticated) => {
      resolveAccountReady(authenticated);
      if (!authenticated) {
        window.location.replace("account.html?view=login");
        return;
      }
      document.documentElement.classList.remove("account-session-check");
    })
    .catch((error) => {
      window.accountSyncError = error;
      console.error("تعذر تهيئة بيانات الحساب:", error);
      resolveAccountReady(false);
      window.location.replace("account.html?view=login");
    });
})();
