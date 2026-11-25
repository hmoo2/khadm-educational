import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

test("publishes the configurable subject list without requiring an API key", async () => {
  const response = await worker.fetch(new Request("https://example.com/", {
    headers: { Origin: "https://school.example" },
  }), {
    ALLOWED_ORIGINS: "*",
  });
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(data.subjects.map((subject) => subject.id), [
    "biology",
    "chemistry",
    "physics",
    "mathematics",
    "arabic",
    "english",
    "general",
  ]);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://school.example");
  assert.match(response.headers.get("Access-Control-Allow-Methods"), /GET/);
});

test("rejects methods other than GET, POST, or OPTIONS", async () => {
  const response = await worker.fetch(new Request("https://example.com/api/chat", {
    method: "PUT",
  }), {
    GEMINI_API_KEY: "test",
    ALLOWED_ORIGINS: "*",
  });
  assert.equal(response.status, 405);
});

test("allows browser preflight for the configured site", async () => {
  const response = await worker.fetch(new Request("https://example.com/api/chat", {
    method: "OPTIONS",
    headers: {
      Origin: "https://school.example",
      "Access-Control-Request-Method": "POST",
    },
  }), {
    ALLOWED_ORIGINS: "*",
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://school.example");
  assert.match(response.headers.get("Access-Control-Allow-Methods"), /POST/);
});

test("rejects empty chat history", async () => {
  const response = await worker.fetch(new Request("https://example.com/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [] }),
  }), {
    GEMINI_API_KEY: "test",
    ALLOWED_ORIGINS: "*",
  });
  assert.equal(response.status, 400);
});

test("rejects unknown assistant modes", async () => {
  const response = await worker.fetch(new Request("https://example.com/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "unknown",
      messages: [{ role: "user", content: "اختبار" }],
    }),
  }), {
    GEMINI_API_KEY: "test",
    ALLOWED_ORIGINS: "*",
  });
  assert.equal(response.status, 400);
});

test("uses a subject-specific teaching instruction for every supported mode", async () => {
  const originalFetch = globalThis.fetch;
  const expectedInstructions = new Map([
    ["biology", "مدرس أحياء"],
    ["chemistry", "مدرس كيمياء"],
    ["physics", "مدرس فيزياء"],
    ["mathematics", "مدرس رياضيات"],
    ["arabic", "مدرس لغة عربية"],
    ["english", "English teacher"],
    ["general", "مساعد ذكاء اصطناعي عام"],
  ]);
  const instructions = [];
  globalThis.fetch = async (_url, init) => {
    instructions.push(JSON.parse(init.body).system_instruction.parts[0].text);
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: "إجابة" }] } }],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    for (const [mode, expectedText] of expectedInstructions) {
      const response = await worker.fetch(new Request("https://example.com/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, message: "اشرح هذا الدرس." }),
      }), {
        GEMINI_API_KEY: "test",
        ALLOWED_ORIGINS: "*",
      });
      assert.equal(response.status, 200, `mode ${mode} should be accepted`);
      assert.match(instructions[instructions.length - 1], new RegExp(expectedText));
    }
    assert.equal(new Set(instructions).size, expectedInstructions.size);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("accepts message/mode and forwards history to Gemini", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody;
  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: "إجابة تجريبية" }] } }],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const response = await worker.fetch(new Request("https://example.com/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://example.com" },
      body: JSON.stringify({
        mode: "general",
        message: "ما وظيفة الدرقية؟",
        history: [
          { role: "user", content: "أشرح لي الغدد." },
          { role: "assistant", content: "الغدد أعضاء متخصصة في الإفراز." },
        ],
      }),
    }), {
      GEMINI_API_KEY: "test",
      GEMINI_MODEL: "gemini-3.1-flash-lite",
      ALLOWED_ORIGINS: "*",
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).text, "إجابة تجريبية");
    assert.match(requestBody.system_instruction.parts[0].text, /مساعد ذكاء اصطناعي عام/);
    assert.deepEqual(requestBody.contents.map((item) => item.role), ["user", "model", "user"]);
    assert.equal(requestBody.contents[2].parts[0].text, "ما وظيفة الدرقية؟");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("sends supported chat images to Gemini Vision and rejects unsupported formats", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody;
  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(init.body);
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: "تم تحليل الصورة." }] } }],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const response = await worker.fetch(new Request("https://example.com/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "biology",
        message: "حلل الرسم.",
        image: { mimeType: "image/webp", data: "aGVsbG8=" },
      }),
    }), {
      GEMINI_API_KEY: "test",
      ALLOWED_ORIGINS: "*",
    });
    assert.equal(response.status, 200);
    assert.deepEqual(requestBody.contents[0].parts[1], {
      inline_data: { mime_type: "image/webp", data: "aGVsbG8=" },
    });
    assert.equal(requestBody.contents[0].parts.length, 2);

    const invalidResponse = await worker.fetch(new Request("https://example.com/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "biology",
        message: "حلل الرسم.",
        image: { mimeType: "image/gif", data: "aGVsbG8=" },
      }),
    }), {
      GEMINI_API_KEY: "test",
      ALLOWED_ORIGINS: "*",
    });
    assert.equal(invalidResponse.status, 400);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("continues accepting the prior messages payload", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: "إجابة من Gemini" }] } }],
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  try {
    const response = await worker.fetch(new Request("https://example.com/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "اختبار" }] }),
    }), {
      GEMINI_API_KEY: "test",
      ALLOWED_ORIGINS: "*",
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).text, "إجابة من Gemini");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("generates a structured AI exam from the selected settings", async () => {
  const originalFetch = globalThis.fetch;
  const user = {
    id: "11111111-1111-4111-8111-111111111111",
    email: "student@example.com",
    email_confirmed_at: "2026-03-01T00:00:00Z",
  };
  const generatedExam = {
    title: "امتحان تدريبي",
    questions: [{
      id: "q1",
      type: "mcq",
      prompt: "أي العبارات صحيحة؟",
      options: ["الأولى", "الثانية"],
      points: 2,
      correctAnswer: "الأولى",
      explanation: "الإجابة الأولى هي الصحيحة وفق المعطيات.",
      rubric: ["اختيار الإجابة الصحيحة"],
    }],
  };
  let geminiRequest;
  let storedAttempt;
  globalThis.fetch = async (url, init = {}) => {
    const requestUrl = String(url);
    if (requestUrl.endsWith("/auth/v1/user")) {
      return new Response(JSON.stringify(user), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (requestUrl.includes("generativelanguage.googleapis.com")) {
      geminiRequest = JSON.parse(init.body);
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: JSON.stringify(generatedExam) }] } }],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (requestUrl.includes("/rest/v1/student_exam_attempts") && init.method === "POST") {
      storedAttempt = JSON.parse(init.body);
      return new Response(null, { status: 201 });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const response = await worker.fetch(new Request("https://example.com/api/exams/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-test-token",
      },
      body: JSON.stringify({
        mode: "chemistry",
        grade: "third_secondary",
        examSystem: "azhar",
        scope: "unit",
        scopeTopic: "الاتزان الكيميائي",
        questionCount: 1,
        difficulty: "medium",
        durationMinutes: 45,
        questionTypes: ["mcq"],
      }),
    }), {
      GEMINI_API_KEY: "test",
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_ANON_KEY: "test-publishable-key",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
      ALLOWED_ORIGINS: "*",
    });
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.exam.title, generatedExam.title);
    assert.equal(data.exam.questions[0].correctAnswer, undefined);
    assert.equal(data.exam.questions[0].explanation, undefined);
    assert.match(data.attemptId, /^[0-9a-f-]{36}$/i);
    assert.equal(storedAttempt.exam.questions[0].correctAnswer, "الأولى");
    assert.equal(geminiRequest.generationConfig.responseMimeType, "application/json");
    assert.match(geminiRequest.contents[0].parts[0].text, /الاتزان الكيميائي/);
    assert.match(geminiRequest.contents[0].parts[0].text, /الثانوية الأزهرية/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("grades written answers semantically and includes answer images for Gemini", async () => {
  const originalFetch = globalThis.fetch;
  const user = {
    id: "11111111-1111-4111-8111-111111111111",
    email: "student@example.com",
    email_confirmed_at: "2026-03-01T00:00:00Z",
  };
  const storedExam = {
    title: "اختبار",
    grade: "third_secondary",
    examSystem: "general_secondary",
    questions: [{
      id: "q1",
      type: "essay",
      prompt: "اشرح العملية.",
      options: [],
      points: 4,
      correctAnswer: "الإجابة النموذجية.",
      explanation: "هذا هو التفسير النموذجي.",
      rubric: ["تحديد السبب", "شرح الأثر"],
    }],
  };
  let geminiRequest;
  let savedAttempt;
  globalThis.fetch = async (url, init = {}) => {
    const requestUrl = String(url);
    if (requestUrl.endsWith("/auth/v1/user")) {
      return new Response(JSON.stringify(user), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (requestUrl.includes("/rest/v1/student_exam_attempts") && !init.method) {
      return new Response(JSON.stringify([{
        id: "22222222-2222-4222-8222-222222222222",
        user_id: user.id,
        subject: "biology",
        exam: storedExam,
        answers: {},
        status: "in_progress",
      }]), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (requestUrl.includes("generativelanguage.googleapis.com")) {
      geminiRequest = JSON.parse(init.body);
      return new Response(JSON.stringify({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                feedback: [{
                  id: "q1",
                  score: 2,
                  feedback: "ذكرت الفكرة الأساسية لكن ينقصك توضيح السبب.",
                  missingPoints: ["توضيح السبب"],
                }],
                strengths: ["فهم الفكرة الأساسية"],
                weaknesses: ["التفسير السببي"],
              }),
            }],
          },
        }],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (requestUrl.includes("/rest/v1/student_exam_attempts") && init.method === "PATCH") {
      savedAttempt = JSON.parse(init.body);
      return new Response(JSON.stringify([{ ...savedAttempt }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const response = await worker.fetch(new Request("https://example.com/api/exams/grade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-test-token",
      },
      body: JSON.stringify({
        mode: "biology",
        attemptId: "22222222-2222-4222-8222-222222222222",
        exam: {
          title: "اختبار",
          grade: "third_secondary",
          examSystem: "general_secondary",
          questions: [{
            id: "q1",
            type: "essay",
            prompt: "اشرح العملية.",
            options: [],
            points: 4,
          }],
        },
        answers: [{
          id: "q1",
          text: "إجابة الطالب",
          image: { mimeType: "image/png", data: "aGVsbG8=" },
        }],
      }),
    }), {
      GEMINI_API_KEY: "test",
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_ANON_KEY: "test-publishable-key",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
      ALLOWED_ORIGINS: "*",
    });
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.score, 2);
    assert.equal(data.maxScore, 4);
    assert.equal(data.percentage, 50);
    assert.equal(data.feedback[0].correctAnswer, "الإجابة النموذجية.");
    assert.equal(data.feedback[0].explanation, "هذا هو التفسير النموذجي.");
    assert.equal(savedAttempt.status, "completed");
    assert.equal(savedAttempt.answers.q1, "إجابة الطالب");
    assert.ok(geminiRequest.contents[0].parts.some((part) => part.inline_data?.mime_type === "image/png"));
    assert.match(geminiRequest.system_instruction.parts[0].text, /الدرجات الجزئية/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects malformed or incomplete AI-generated exams", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).endsWith("/auth/v1/user")) {
      return new Response(JSON.stringify({
        id: "11111111-1111-4111-8111-111111111111",
        email_confirmed_at: "2026-03-01T00:00:00Z",
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: "{\"title\":\"امتحان\",\"questions\":[]}" }] } }],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const response = await worker.fetch(new Request("https://example.com/api/exams/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-test-token",
      },
      body: JSON.stringify({
        mode: "physics",
        grade: "third_secondary",
        examSystem: "general_secondary",
        scope: "full",
        questionCount: 1,
        difficulty: "easy",
        durationMinutes: 20,
        questionTypes: ["application"],
      }),
    }), {
      GEMINI_API_KEY: "test",
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_ANON_KEY: "test-publishable-key",
      ALLOWED_ORIGINS: "*",
    });

    test("requires a verified account before generating an exam", async () => {
      const response = await worker.fetch(new Request("https://example.com/api/exams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "biology" }),
      }), {
        GEMINI_API_KEY: "test",
        ALLOWED_ORIGINS: "*",
      });
      assert.equal(response.status, 401);
    });

    test("returns only an owner's safe exam history from the account endpoint", async () => {
      const originalFetch = globalThis.fetch;
      const user = {
        id: "11111111-1111-4111-8111-111111111111",
        email_confirmed_at: "2026-03-01T00:00:00Z",
      };
      globalThis.fetch = async (url) => {
        if (String(url).endsWith("/auth/v1/user")) {
          return new Response(JSON.stringify(user), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        if (String(url).includes("/rest/v1/student_exam_attempts")) {
          return new Response(JSON.stringify([{
            id: "22222222-2222-4222-8222-222222222222",
            subject: "biology",
            title: "اختبار",
            status: "in_progress",
            started_at: "2026-03-01T00:00:00Z",
            completed_at: null,
            exam: { questions: [{ correctAnswer: "سر" }] },
            answers: {},
            result: null,
          }]), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        throw new Error(`Unexpected request: ${url}`);
      };

      try {
        const response = await worker.fetch(new Request("https://example.com/api/account/exams", {
          headers: { Authorization: "Bearer valid-test-token" },
        }), {
          SUPABASE_URL: "https://project.supabase.co",
          SUPABASE_ANON_KEY: "test-publishable-key",
          SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
          ALLOWED_ORIGINS: "*",
        });
        const data = await response.json();
        assert.equal(response.status, 200);
        assert.equal(data.attempts[0].result, null);
        assert.equal(data.attempts[0].exam, undefined);
        assert.equal(data.attempts[0].answers, undefined);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    assert.equal(response.status, 502);
    assert.match((await response.json()).error, /لا يطابق البنية/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("requires a verified account and an administrator role for admin endpoints", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).endsWith("/auth/v1/user")) {
      return new Response(JSON.stringify({
        id: "11111111-1111-4111-8111-111111111111",
        email: "student@example.com",
        email_confirmed_at: "2026-03-01T00:00:00Z",
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (String(url).includes("/rest/v1/user_roles")) {
      return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const response = await worker.fetch(new Request("https://example.com/api/admin/me", {
      headers: { Authorization: "Bearer valid-test-token" },
    }), {
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_ANON_KEY: "test-publishable-key",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
      ALLOWED_ORIGINS: "*",
    });
    assert.equal(response.status, 403);
    assert.match((await response.json()).error, /المدير/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects unverified sessions and requires authentication to save exam answers", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    id: "11111111-1111-4111-8111-111111111111",
    email: "student@example.com",
  }), { status: 200, headers: { "Content-Type": "application/json" } });

  try {
    const unverifiedResponse = await worker.fetch(new Request("https://example.com/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer unverified-token",
      },
      body: JSON.stringify({ mode: "biology", message: "اختبار" }),
    }), {
      GEMINI_API_KEY: "test",
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_ANON_KEY: "test-publishable-key",
      ALLOWED_ORIGINS: "*",
    });
    assert.equal(unverifiedResponse.status, 403);

    const saveResponse = await worker.fetch(new Request("https://example.com/api/exams/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId: "11111111-1111-4111-8111-111111111111", answers: {} }),
    }), {
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
      ALLOWED_ORIGINS: "*",
    });
    assert.equal(saveResponse.status, 401);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects an invalid bearer token before contacting Gemini", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ message: "invalid token" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });

  try {
    const response = await worker.fetch(new Request("https://example.com/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid-token",
      },
      body: JSON.stringify({ mode: "biology", message: "اختبار" }),
    }), {
      GEMINI_API_KEY: "test",
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_ANON_KEY: "test-publishable-key",
      ALLOWED_ORIGINS: "*",
    });
    assert.equal(response.status, 401);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
