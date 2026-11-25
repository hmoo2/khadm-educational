(() => {
  const supabase = window.schoolSupabase;
  const WORKER_URL = "https://frosty-hall-b193.hmoobaha8.workers.dev";
  const alertBox = document.querySelector("#account-alert");
  const loadingBox = document.querySelector("#account-loading");
  const authView = document.querySelector("#auth-view");
  const profileView = document.querySelector("#profile-view");
  const forms = {
    login: document.querySelector("#login-form"),
    register: document.querySelector("#register-form"),
    forgot: document.querySelector("#forgot-form"),
    reset: document.querySelector("#reset-form"),
  };
  const params = new URLSearchParams(window.location.search);
  const accountUrl = (view) => `${window.location.pathname}?view=${encodeURIComponent(view)}`;

  function showMessage(message, type = "info") {
    loadingBox.hidden = true;
    alertBox.textContent = message;
    alertBox.dataset.type = type;
    alertBox.hidden = false;
  }

  function renderConversationHistory(conversations) {
    const container = document.querySelector("#conversation-history");
    container.replaceChildren();
    if (!conversations.length) {
      const empty = document.createElement("p");
      empty.className = "muted-copy";
      empty.textContent = "لا توجد محادثات محفوظة بعد.";
      container.append(empty);
      return;
    }
    conversations.forEach((conversation) => {
      const item = document.createElement("article");
      item.className = "history-item";
      const title = document.createElement("strong");
      title.textContent = safeText(conversation.title);
      const meta = document.createElement("small");
      meta.textContent = `${safeText(conversation.subject)} · ${formatDate(conversation.updated_at)} · ${(conversation.messages || []).length} رسالة`;
      const open = document.createElement("button");
      open.className = "secondary";
      open.type = "button";
      open.textContent = "فتح المحادثة";
      open.addEventListener("click", () => {
        window.location.href = `index.html?chat=${encodeURIComponent(conversation.id)}`;
      });
      item.append(title, meta, open);
      container.append(item);
    });
  }

  function clearMessage() {
    alertBox.textContent = "";
    alertBox.hidden = true;
  }

  function showAuth(view) {
    loadingBox.hidden = true;
    authView.hidden = false;
    profileView.hidden = true;
    for (const [name, form] of Object.entries(forms)) form.hidden = name !== view;
    document.querySelector("#verify-view").hidden = view !== "verify";
    document.querySelectorAll("[data-view-link]").forEach((link) => {
      link.classList.toggle("active", link.dataset.viewLink === view);
    });
    params.set("view", view);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }

  function setBusy(form, busy, label) {
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.disabled = true;
      button.textContent = label || "جارٍ التنفيذ...";
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
      delete button.dataset.originalText;
    }
  }

  function userError(error) {
    const message = String(error?.message || "");
    if (/Invalid login credentials/i.test(message)) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    if (/Email not confirmed/i.test(message)) return "يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول.";
    if (/User already registered/i.test(message)) return "هذا البريد مسجل بالفعل. سجل الدخول أو أعد إرسال رسالة التحقق.";
    if (/Password should be at least/i.test(message)) return "كلمة المرور يجب ألا تقل عن 8 أحرف.";
    if (/rate limit|too many requests/i.test(message)) return "تم تجاوز عدد المحاولات. انتظر قليلًا ثم أعد المحاولة.";
    return message || "تعذر إكمال العملية. حاول مرة أخرى.";
  }

  function getFormObject(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function todayAsInputDate() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }

  function updateDivisionField(form, fieldSelector, required) {
    const grade = form.elements.grade.value;
    const field = document.querySelector(fieldSelector);
    const division = form.elements.division;
    const visible = grade === "third_secondary";
    field.hidden = !visible;
    division.required = Boolean(required && visible);
    if (!visible) division.value = "";
  }

  function safeText(value, fallback = "—") {
    return typeof value === "string" && value.trim() ? value : fallback;
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("ar-EG");
  }

  async function getSessionOrThrow() {
    if (!supabase) throw new Error("تعذر تهيئة خدمة الحسابات. تحقق من تحميل إعدادات Supabase.");
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) throw new Error("انتهت الجلسة. سجل الدخول مرة أخرى.");
    return data.session;
  }

  async function workerRequest(path, options = {}) {
    const session = await getSessionOrThrow();
    const response = await fetch(`${WORKER_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        ...(options.headers || {}),
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `تعذر تنفيذ الطلب (${response.status}).`);
    return body;
  }

  async function loadDashboard() {
    authView.hidden = true;
    profileView.hidden = true;
    loadingBox.hidden = false;
    const session = await getSessionOrThrow();
    const { data: userData, error: userErrorResult } = await supabase.auth.getUser();
    if (userErrorResult) throw userErrorResult;
    const user = userData.user;
    if (!user?.email_confirmed_at) {
      await supabase.auth.signOut();
      showAuth("verify");
      document.querySelector("#verify-message").textContent = "أكد بريدك الإلكتروني من الرابط المرسل قبل استخدام الحساب.";
      return;
    }
    const [profileResult, conversationsResult, examsResult] = await Promise.all([
      supabase.from("student_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("student_conversations").select("id,title,subject,messages,created_at,updated_at").order("updated_at", { ascending: false }).limit(50),
      workerRequest("/api/account/exams"),
    ]);
    if (profileResult.error) throw profileResult.error;
    if (conversationsResult.error) throw conversationsResult.error;

    authView.hidden = true;
    profileView.hidden = false;
    loadingBox.hidden = true;
    document.querySelector("#welcome-heading").textContent = `مرحبًا، ${profileResult.data.full_name}`;
    document.querySelector("#profile-form [name='full_name']").value = profileResult.data.full_name;
    document.querySelector("#profile-form [name='email']").value = user.email || "";
    document.querySelector("#profile-form [name='date_of_birth']").value = profileResult.data.date_of_birth || "";
    document.querySelector("#profile-form [name='gender']").value = profileResult.data.gender;
    document.querySelector("#profile-form [name='education_type']").value = profileResult.data.education_type;
    document.querySelector("#profile-form [name='grade']").value = profileResult.data.grade;
    document.querySelector("#profile-form [name='division']").value = profileResult.data.division || "";
    updateDivisionField(document.querySelector("#profile-form"), "#profile-division-field", true);
    document.querySelector("#email-status").textContent = user.email_confirmed_at
      ? `البريد مؤكد — تاريخ إنشاء الحساب: ${formatDate(user.created_at)}`
      : "البريد غير مؤكد";

    const avatar = document.querySelector("#profile-avatar");
    avatar.hidden = true;
    if (profileResult.data.avatar_path) {
      const { data: signedUrl, error: avatarError } = await supabase.storage
        .from("student-media")
        .createSignedUrl(profileResult.data.avatar_path, 3600);
      if (avatarError) throw avatarError;
      avatar.src = signedUrl.signedUrl;
      avatar.hidden = false;
    }

    const conversations = conversationsResult.data || [];
    const attempts = Array.isArray(examsResult.attempts) ? examsResult.attempts : [];
    const completed = attempts.filter((attempt) => attempt.status === "completed" && attempt.result);
    const scores = completed.map((attempt) => {
      const result = attempt.result;
      return Number.isFinite(result.percentage)
        ? result.percentage
        : result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : null;
    }).filter((score) => Number.isFinite(score));
    document.querySelector("#exam-count").textContent = String(completed.length);
    document.querySelector("#average-score").textContent = scores.length
      ? `${Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)}٪`
      : "—";
    document.querySelector("#conversation-count").textContent = String(conversations.length);
    const averageScore = scores.length
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : null;
    document.querySelector("#progress-level").textContent = averageScore === null
      ? "ابدأ امتحانك الأول"
      : averageScore >= 85 ? "ممتاز"
        : averageScore >= 70 ? "جيد جدًا"
          : averageScore >= 50 ? "يتقدم"
            : "يحتاج إلى مراجعة";
    renderExamHistory(attempts);
    renderConversationHistory(conversations);
    await loadStudentSubjects();

    const adminSection = document.querySelector("#admin-section");
    adminSection.hidden = true;
    try {
      await workerRequest("/api/admin/me");
      adminSection.hidden = false;
      const overview = await workerRequest("/api/admin/overview");
      const stats = document.querySelector("#admin-stats");
      stats.replaceChildren();
      for (const [label, value] of [
        ["إجمالي الطلاب", overview.studentCount],
        ["الامتحانات المكتملة", overview.completedExams],
        ["متوسط الدرجات", overview.averageScore === null ? "—" : `${overview.averageScore}٪`],
      ]) {
        const card = document.createElement("article");
        card.className = "dashboard-stat";
        const title = document.createElement("span");
        title.textContent = label;
        const count = document.createElement("strong");
        count.textContent = String(value);
        card.append(title, count);
        stats.append(card);
      }
    } catch (error) {
      if (!/مدير|administrator|Forbidden|403/i.test(error.message)) throw error;
    }
    clearMessage();
    if (params.get("view") === "verify") {
      showMessage("تم تفعيل بريدك الإلكتروني بنجاح. يمكنك الآن استخدام حسابك.", "success");
    }
  }

  function renderHistory(selector, rows, toItem) {
    const container = document.querySelector(selector);
    container.replaceChildren();
    if (!rows.length) {
      const empty = document.createElement("p");
      empty.className = "muted-copy";
      empty.textContent = "لا توجد سجلات بعد.";
      container.append(empty);
      return;
    }
    rows.forEach((row) => {
      const values = toItem(row);
      const item = document.createElement("article");
      item.className = "history-item";
      const title = document.createElement("strong");
      title.textContent = values.title;
      const meta = document.createElement("small");
      meta.textContent = values.meta;
      item.append(title, meta);
      container.append(item);
    });
  }

  function renderExamHistory(attempts) {
    const container = document.querySelector("#exam-history");
    container.replaceChildren();
    if (!attempts.length) {
      const empty = document.createElement("p");
      empty.className = "muted-copy";
      empty.textContent = "لا توجد امتحانات محفوظة بعد.";
      container.append(empty);
      return;
    }
    attempts.forEach((attempt) => {
      const item = document.createElement("article");
      item.className = "history-item";
      const title = document.createElement("strong");
      const result = attempt.result;
      const score = result && Number.isFinite(result.score) && Number.isFinite(result.maxScore)
        ? ` — ${result.score} من ${result.maxScore} (${result.percentage ?? Math.round((result.score / result.maxScore) * 100)}٪)`
        : " — لم يكتمل";
      title.textContent = `${safeText(attempt.title)}${score}`;
      const meta = document.createElement("small");
      meta.textContent = `${safeText(attempt.subject)} · ${formatDate(attempt.started_at)}`;
      item.append(title, meta);
      if (result) {
        const feedback = document.createElement("p");
        const strengths = (result.strengths || []).slice(0, 3).join("، ");
        const weaknesses = (result.weaknesses || []).slice(0, 3).join("، ");
        feedback.textContent = `نقاط القوة: ${strengths || "—"} · تحتاج مراجعة: ${weaknesses || "—"}`;
        item.append(feedback);
      }
      container.append(item);
    });
  }

  async function loadStudentSubjects() {
    const container = document.querySelector("#student-subjects");
    container.replaceChildren();
    try {
      const response = await fetch(`${WORKER_URL}/api/subjects`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`تعذر تحميل المواد (${response.status}).`);
      const data = await response.json();
      if (!Array.isArray(data.subjects)) throw new Error("استجابة المواد غير صالحة.");
      data.subjects.forEach((subject) => {
        if (!subject || typeof subject.id !== "string" || typeof subject.label !== "string") return;
        const chip = document.createElement("div");
        chip.className = "subject-chip";
        chip.textContent = subject.label;
        container.append(chip);
      });
    } catch (error) {
      const message = document.createElement("p");
      message.className = "muted-copy";
      message.textContent = "تعذر تحميل قائمة المواد حاليًا. أعد المحاولة لاحقًا.";
      container.append(message);
      console.error("تعذر تحميل قائمة المواد:", error);
    }
  }

  async function submitForm(form, operation, successMessage, buttonLabel) {
    clearMessage();
    setBusy(form, true, buttonLabel);
    try {
      await operation();
      if (successMessage) showMessage(successMessage, "success");
    } catch (error) {
      showMessage(userError(error), "error");
    } finally {
      setBusy(form, false);
    }
  }

  if (!supabase) {
    showAuth(params.get("view") || "login");
    showMessage("تعذر الاتصال بخدمة الحسابات: تأكد من تحميل مكتبة Supabase وإعداداتها.", "error");
    return;
  }

  document.querySelector("#register-form [name='date_of_birth']").max = todayAsInputDate();
  const registerForm = document.querySelector("#register-form");
  const profileForm = document.querySelector("#profile-form");
  profileForm.elements.date_of_birth.max = todayAsInputDate();
  registerForm.elements.grade.addEventListener("change", () => updateDivisionField(registerForm, "#division-field", true));
  profileForm.elements.grade.addEventListener("change", () => updateDivisionField(profileForm, "#profile-division-field", false));

  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.parentElement.querySelector("input");
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "إخفاء" : "إظهار";
    });
  });

  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitForm(registerForm, async () => {
      const values = getFormObject(registerForm);
      if (values.password !== values.password_confirmation) throw new Error("كلمتا المرور غير متطابقتين.");
      if (values.date_of_birth >= todayAsInputDate()) {
        throw new Error("أدخل تاريخ ميلاد صحيحًا.");
      }
      const { error } = await supabase.auth.signUp({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}${accountUrl("verify")}`,
          data: {
            full_name: values.full_name.trim(),
            date_of_birth: values.date_of_birth,
            gender: values.gender,
            education_type: values.education_type,
            grade: values.grade,
            division: values.division || "",
          },
        },
      });
      if (error) throw error;
      document.querySelector("#resend-form [name='email']").value = values.email.trim().toLowerCase();
      showAuth("verify");
      showMessage("تم إنشاء الطلب. افتح رسالة التحقق المرسلة إلى بريدك لإكمال التسجيل.", "success");
    }, null, "جارٍ إنشاء الحساب...");
  });

  document.querySelector("#login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    submitForm(form, async () => {
      const values = getFormObject(form);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      if (error) throw error;
      if (!data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        document.querySelector("#resend-form [name='email']").value = values.email.trim().toLowerCase();
        showAuth("verify");
        throw new Error("يجب تأكيد البريد الإلكتروني أولًا. يمكنك إعادة إرسال رسالة التحقق.");
      }
      await loadDashboard();
    }, null, "جارٍ تسجيل الدخول...");
  });

  document.querySelector("#resend-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    submitForm(form, async () => {
      const values = getFormObject(form);
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: values.email.trim().toLowerCase(),
        options: { emailRedirectTo: `${window.location.origin}${accountUrl("verify")}` },
      });
      if (error) throw error;
    }, "أُعيد إرسال رسالة التحقق. تحقق من صندوق البريد ومجلد الرسائل غير المرغوب فيها.");
  });

  document.querySelector("#forgot-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    submitForm(form, async () => {
      const values = getFormObject(form);
      const { error } = await supabase.auth.resetPasswordForEmail(values.email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}${accountUrl("reset")}`,
      });
      if (error) throw error;
    }, "إذا كان البريد مسجلًا، ستصلك رسالة تحتوي على رابط صالح لإعادة تعيين كلمة المرور.");
  });

  document.querySelector("#reset-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    submitForm(form, async () => {
      const values = getFormObject(form);
      if (values.password !== values.password_confirmation) throw new Error("كلمتا المرور غير متطابقتين.");
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      await supabase.auth.signOut();
      showAuth("login");
    }, "تم تغيير كلمة المرور. سجل الدخول باستخدامها.");
  });

  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitForm(profileForm, async () => {
      const session = await getSessionOrThrow();
      const values = getFormObject(profileForm);
      const update = {
        full_name: values.full_name.trim(),
        date_of_birth: values.date_of_birth,
        gender: values.gender,
        education_type: values.education_type,
        grade: values.grade,
        division: values.division || null,
        updated_at: new Date().toISOString(),
      };
      const avatarFile = document.querySelector("#avatar-input").files[0];
      if (avatarFile) {
        const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!supportedTypes.includes(avatarFile.type) || avatarFile.size > 5 * 1024 * 1024) {
          throw new Error("الصورة يجب أن تكون JPG أو PNG أو WEBP وألا يتجاوز حجمها 5 ميجابايت.");
        }
        const extension = avatarFile.type === "image/jpeg" ? "jpg" : avatarFile.type.split("/")[1];
        const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("student-media").upload(path, avatarFile, {
          contentType: avatarFile.type,
          upsert: false,
        });
        if (uploadError) throw uploadError;
        update.avatar_path = path;
      }
      const { error } = await supabase.from("student_profiles").update(update).eq("user_id", session.user.id);
      if (error) throw error;
      document.querySelector("#avatar-input").value = "";
      await loadDashboard();
    }, "تم حفظ بيانات الملف الشخصي.", "جارٍ الحفظ...");
  });

  document.querySelector("#signout-button").addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showMessage(userError(error), "error");
      return;
    }
    showAuth("login");
    showMessage("تم تسجيل الخروج بنجاح.", "success");
  });

  document.querySelector("#delete-account-button").addEventListener("click", async () => {
    if (!window.confirm("هل أنت متأكد؟ سيُحذف حسابك وسجل محادثاتك وامتحاناتك نهائيًا.")) return;
    try {
      await workerRequest("/api/account", { method: "DELETE" });
      await supabase.auth.signOut({ scope: "local" });
      showAuth("register");
      showMessage("تم حذف الحساب وبياناته.", "success");
    } catch (error) {
      showMessage(userError(error), "error");
    }
  });

  document.querySelector("#admin-search-button").addEventListener("click", async () => {
    const button = document.querySelector("#admin-search-button");
    button.disabled = true;
    try {
      const query = document.querySelector("#admin-search").value.trim();
      const result = await workerRequest(`/api/admin/students?q=${encodeURIComponent(query)}`);
      renderAdminStudents(result.students || []);
    } catch (error) {
      showMessage(userError(error), "error");
    } finally {
      button.disabled = false;
    }
  });

  function renderAdminStudents(students) {
    const container = document.querySelector("#admin-students");
    container.replaceChildren();
    students.forEach((student) => {
      const item = document.createElement("article");
      item.className = "history-item";
      const title = document.createElement("strong");
      title.textContent = `${safeText(student.full_name)} — ${safeText(student.email)}`;
      const meta = document.createElement("small");
      const average = student.average_score === null ? "—" : `${student.average_score}٪`;
      meta.textContent = `${safeText(student.grade)} · ${student.active ? "نشط" : "معطل"} · ${student.completed_exams || 0} امتحان · متوسط ${average}`;
      const toggle = document.createElement("button");
      toggle.className = "secondary";
      toggle.type = "button";
      toggle.textContent = student.active ? "تعطيل الحساب" : "تفعيل الحساب";
      toggle.addEventListener("click", async () => {
        toggle.disabled = true;
        try {
          await workerRequest(`/api/admin/students/${encodeURIComponent(student.id)}`, {
            method: "PATCH",
            body: JSON.stringify({ active: !student.active }),
          });
          document.querySelector("#admin-search-button").click();
        } catch (error) {
          showMessage(userError(error), "error");
          toggle.disabled = false;
        }
      });
      item.append(title, meta, toggle);
      container.append(item);
    });
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      showAuth("reset");
      return;
    }
    if (event === "SIGNED_OUT") {
      authView.hidden = false;
      profileView.hidden = true;
    }
    if (event === "SIGNED_IN" && session?.user?.email_confirmed_at && params.get("view") !== "reset") {
      loadDashboard().catch((error) => showMessage(userError(error), "error"));
    }
  });

  (async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session?.user?.email_confirmed_at) {
        await loadDashboard();
        return;
      }
      const initialView = params.get("view") || "login";
      showAuth(["login", "register", "forgot", "reset", "verify"].includes(initialView) ? initialView : "login");
      if (initialView === "verify" && data.session) {
        showMessage("تم تفعيل بريدك بنجاح. يمكنك الآن استخدام حسابك.", "success");
      }
      if (initialView === "reset" && !data.session) {
        showMessage("رابط إعادة التعيين غير صالح أو منتهي. اطلب رابطًا جديدًا.", "error");
      }
    } catch (error) {
      showAuth("login");
      showMessage(userError(error), "error");
    }
  })();

})();
