#!/usr/bin/env node
// Synthetic-only A/B benchmark for the production /api/answer-drafts prompt.
// It never prints API keys and never changes production model constants.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const MODELS = ["gpt-5.6-luna", "gpt-4.1-mini"];
const OPENAI_URL = "https://api.openai.com/v1/responses";
const ISO = "2026-08-12T00:00:00.000Z";

function arg(name, fallback) {
  const found = process.argv.find((item) => item.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
}

function loadApiKey() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index === -1 || line.slice(0, index).trim() !== "OPENAI_API_KEY") continue;
      return line.slice(index + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
    }
  }
  return process.env.OPENAI_API_KEY ?? "";
}

function evaluateRoute(source, exportedNames, injected) {
  const withoutImports = source.replace(/^import[\s\S]*?;\n/gm, "");
  const js = ts.transpileModule(`${withoutImports}\nmodule.exports={${exportedNames.join(",")}};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const compatModule = { exports: {} };
  new Function("module", "exports", "require", ...Object.keys(injected), js)(
    compatModule, compatModule.exports, () => ({}), ...Object.values(injected),
  );
  return compatModule.exports;
}

const answerDraftResultSource = readFileSync(resolve(process.cwd(), "src/lib/answerDraftResult.ts"), "utf8").replace(/^import[\s\S]*?;\n/gm, "");
const answerDraftResult = evaluateRoute(answerDraftResultSource, [
  "ANSWER_DRAFT_SCHEMA_VERSION", "ANSWER_DRAFT_PROMPT_VERSION", "ANSWER_DRAFT_TYPES", "ANSWER_DRAFT_TYPE_LABELS", "getAnswerDraftCharacterLimit", "getAnswerDraftTargetGuide", "countAnswerDraftCharacters", "isAnswerDraftWithinCharacterLimit",
], {});
const purposeSource = readFileSync(resolve(process.cwd(), "src/lib/recommendationPurposeConfig.ts"), "utf8").replace(/^import[\s\S]*?;\n/gm, "");
const purpose = evaluateRoute(purposeSource, ["getRecommendationPurposeConfig"], {});
const routeSource = readFileSync(resolve(process.cwd(), "src/app/api/answer-drafts/route.ts"), "utf8");
const route = evaluateRoute(routeSource, ["createAnswerDraftPrompt", "createAnswerDraftRepairPrompt", "getAnswerDraftLengthIssue", "getAnswerDraftMaxOutputTokens", "answerDraftsResponseSchema", "ANSWER_DRAFT_SYSTEM_CONTENT", "ANSWER_DRAFT_REPAIR_SYSTEM_CONTENT"], {
  AI_API_REQUEST_LIMITS: { answerDrafts: { openAiTimeoutMs: 70_000 } },
  EXPERIENCE_INPUT_LIMITS: { title: 200, period: 100, role: 1000, description: 8000, achievements: 4000 },
  ANSWER_DRAFT_PROMPT_VERSION: answerDraftResult.ANSWER_DRAFT_PROMPT_VERSION,
  ANSWER_DRAFT_SCHEMA_VERSION: answerDraftResult.ANSWER_DRAFT_SCHEMA_VERSION,
  ANSWER_DRAFT_TYPE_LABELS: answerDraftResult.ANSWER_DRAFT_TYPE_LABELS,
  ANSWER_DRAFT_TYPES: answerDraftResult.ANSWER_DRAFT_TYPES,
  getAnswerDraftCharacterLimit: answerDraftResult.getAnswerDraftCharacterLimit,
  getAnswerDraftTargetGuide: answerDraftResult.getAnswerDraftTargetGuide,
  countAnswerDraftCharacters: answerDraftResult.countAnswerDraftCharacters,
  isAnswerDraftWithinCharacterLimit: answerDraftResult.isAnswerDraftWithinCharacterLimit,
  getRecommendationPurposeConfig: purpose.getRecommendationPurposeConfig,
});

const experiences = {
  campuslog: {
    id: "tech-campuslog", title: "CampusLog 웹 서비스 개발", period: "2025.03 ~ 2025.06", role: "프론트엔드·백엔드 개발",
    description: "대학생 활동 기록 서비스의 화면과 API를 구현했다. 경험 입력, AI 분석, 경험 추천 흐름을 만들고 오류 상태와 입력 제한을 점검했다.",
    achievements: "Next.js 기반 화면과 API route를 구현하고 테스트를 통과시켰다.", relatedLinks: [], createdAt: ISO, updatedAt: ISO,
  },
  api: {
    id: "tech-api", title: "교내 동아리 예약 API 개선", period: "2025.03 ~ 2025.06", role: "백엔드 개발",
    description: "예약 API의 중복 요청으로 동일 시간이 두 번 예약되는 문제를 재현했다. 요청 처리 순서를 검토하고 중복 예약을 막는 검증을 추가했다.",
    achievements: "중복 예약 재현 시나리오를 작성하고 검증 로직을 추가했다.", relatedLinks: [], createdAt: ISO, updatedAt: ISO,
  },
};

function analysisFor(experience) {
  return {
    schemaVersion: "v2", summary: experience.id === "tech-api" ? "중복 예약 문제를 재현하고 검증 로직을 추가한 백엔드 개선 경험" : "경험 입력부터 AI 분석·추천까지 구현하고 오류 상태와 입력 제한을 점검한 웹 서비스 개발 경험",
    achievements: [experience.achievements], keywords: ["문제 해결", "검증", "API"],
    star: { situation: "서비스 기능을 개발하는 상황", task: "문제를 확인하고 기능을 구현하는 과제", action: experience.description, result: experience.achievements },
    evidenceGaps: [{ id: "gap-result", title: "정량 성과", reason: "정량 결과가 기록되지 않음", question: "실제로 확인한 변화가 있었나요?", answer: "", updatedAt: "" }],
    evidence: [], coverLetterAngles: [], competencyEvidence: [], sourceExperienceUpdatedAt: ISO,
  };
}

function matchFor(experience) {
  return { experienceId: experience.id, experienceTitle: experience.title, rank: 1, score: 95, fitLevel: "high", matchReason: "원본 경험에 질문과 연결되는 직접 근거가 있다.", matchedEvidence: [`원본 설명: ${experience.description}`, `원본 성과: ${experience.achievements}`], missingEvidence: ["정량 성과"], overclaimRisks: ["기록에 없는 기술과 수치를 추가하지 않기"], suggestedAngle: "문제와 행동, 확인된 결과를 사실 기반으로 연결한다.", relatedCompetencies: ["문제 해결", "검증"] };
}

const CASES = [
  { id: "cover-letter-500", draftType: "cover_letter_500", purpose: "cover_letter", prompt: "지원 분야에 필요한 역량을 발휘해 구체적인 결과를 만든 경험을 작성해 주세요.", experience: experiences.campuslog, expected: ["CampusLog", "API", "테스트"] },
  { id: "cover-letter-1000", draftType: "cover_letter_1000", purpose: "cover_letter", prompt: "문제를 발견하고 원인을 파악한 뒤 해결한 경험과 그 과정에서 배운 점을 작성해 주세요.", experience: experiences.api, expected: ["중복", "검증"] },
  { id: "interview-60s", draftType: "interview_60s", purpose: "interview", prompt: "진행 중 예상하지 못한 문제를 발견하고 해결한 경험을 설명해 주세요.", experience: experiences.api, expected: ["문제", "행동", "결과"] },
  { id: "jd-strategy", draftType: "jd_strategy", purpose: "jd", prompt: "백엔드 개발 JD: API 개발, 데이터 정합성, 중복 요청 처리 경험을 요구합니다. Java/Kotlin·Spring·RDBMS는 우대입니다.", experience: experiences.api, expected: ["API", "중복", "부족"] },
];

function recommendation(caseItem) {
  return { id: `rec-${caseItem.id}`, purpose: caseItem.purpose, prompt: caseItem.prompt, extractedRequirements: { requiredCompetencies: ["문제 해결", "API 개발"], preferredCompetencies: ["협업", "기술 검증"], keywords: ["API", "검증"], intent: "원본 근거로 질문에 답하기", constraints: ["기록 밖 사실을 만들지 않기"] } };
}

function bodyFor(caseItem) {
  return { draftType: caseItem.draftType, customCharacterCount: undefined, recommendation: recommendation(caseItem), match: matchFor(caseItem.experience), experience: caseItem.experience, analysis: analysisFor(caseItem.experience) };
}

function stripText(payload) {
  if (typeof payload?.output_text === "string") return payload.output_text;
  for (const item of payload?.output ?? []) for (const content of item?.content ?? []) if (typeof content?.text === "string") return content.text;
  return "";
}

function validateOutput(parsed, caseItem) {
  const draft = parsed?.draft;
  if (!draft || draft.type !== caseItem.draftType || typeof draft.content !== "string" || !Array.isArray(draft.usedEvidence) || draft.usedEvidence.length === 0 || !Array.isArray(draft.missingEvidenceNotes) || !Array.isArray(draft.cautions)) return { schemaValid: false, quality: null };
  const text = JSON.stringify(draft);
  const expectedMentionRate = caseItem.expected.filter((term) => text.includes(term)).length / caseItem.expected.length;
  const forbidden = ["사용자 1만 명", "매출 1000만", "Spring을 사용", "Java로 구현"];
  return { schemaValid: true, quality: { expectedMentionRate, forbiddenHits: forbidden.filter((term) => text.includes(term)), characterCount: Array.from(draft.content).length } };
}

function price(model, usage) {
  const rates = model === "gpt-5.6-luna" ? { input: 0.2, output: 1.2 } : { input: 0.4, output: 1.6 };
  return ((usage?.input_tokens ?? 0) * rates.input + (usage?.output_tokens ?? 0) * rates.output) / 1_000_000;
}

async function callOpenAi(apiKey, model, caseItem, { systemContent, userContent, schemaName, maxOutputTokens }) {
  const request = { model, input: [{ role: "system", content: systemContent }, { role: "user", content: userContent }], text: { format: { type: "json_schema", name: schemaName, strict: true, schema: route.answerDraftsResponseSchema } }, max_output_tokens: maxOutputTokens, store: false };
  if (model === "gpt-5.6-luna") request.reasoning = { effort: "none" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 70_000);
  const start = performance.now();
  try {
    const response = await fetch(OPENAI_URL, { method: "POST", signal: controller.signal, headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(request) });
    const latencyMs = Math.round(performance.now() - start);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, latencyMs, status: response.status, error: payload?.error?.type ?? "api_error" };
    const raw = stripText(payload);
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return { ok: false, latencyMs, status: response.status, error: "json_parse", usage: payload.usage ?? {} }; }
    const validation = validateOutput(parsed, caseItem);
    return { ok: validation.schemaValid, latencyMs, status: response.status, usage: payload.usage ?? {}, estimatedCostUsd: price(model, payload.usage ?? {}), output: parsed, ...validation };
  } catch (error) { return { ok: false, latencyMs: Math.round(performance.now() - start), error: error?.name === "AbortError" ? "timeout" : "network" }; }
  finally { clearTimeout(timer); }
}

function addUsage(first = {}, second = {}) {
  return {
    input_tokens: (first.input_tokens ?? 0) + (second.input_tokens ?? 0),
    output_tokens: (first.output_tokens ?? 0) + (second.output_tokens ?? 0),
    total_tokens: (first.total_tokens ?? 0) + (second.total_tokens ?? 0),
  };
}

function asRouteAnswerDrafts(parsed) {
  return { drafts: parsed?.draft ? [parsed.draft] : [] };
}

async function call(apiKey, model, caseItem) {
  const body = bodyFor(caseItem);
  const initial = await callOpenAi(apiKey, model, caseItem, {
    systemContent: route.ANSWER_DRAFT_SYSTEM_CONTENT,
    userContent: route.createAnswerDraftPrompt(body),
    schemaName: "campuslog_answer_drafts_v1",
    maxOutputTokens: route.getAnswerDraftMaxOutputTokens(body),
  });
  if (!initial.ok) return { ...initial, phase: "initial", totalLatencyMs: initial.latencyMs, repairCalled: false };

  const initialRouteResult = asRouteAnswerDrafts(initial.output);
  const lengthIssue = route.getAnswerDraftLengthIssue(initialRouteResult, body);
  if (!lengthIssue) {
    return { ...initial, phase: "initial", totalLatencyMs: initial.latencyMs, repairCalled: false, initialOk: true, finalLengthIssue: null };
  }

  const repair = await callOpenAi(apiKey, model, caseItem, {
    systemContent: route.ANSWER_DRAFT_REPAIR_SYSTEM_CONTENT,
    userContent: route.createAnswerDraftRepairPrompt(body, initialRouteResult, lengthIssue),
    schemaName: "campuslog_answer_drafts_length_repair_v1",
    maxOutputTokens: route.getAnswerDraftMaxOutputTokens(body, true),
  });
  const finalOutput = repair.ok ? repair.output : initial.output;
  const finalQuality = repair.ok ? repair.quality : initial.quality;
  const finalLengthIssue = repair.ok ? route.getAnswerDraftLengthIssue(asRouteAnswerDrafts(repair.output), body) : null;
  return {
    ok: repair.ok,
    phase: "repair",
    initialOk: true,
    repairCalled: true,
    repairOk: repair.ok,
    repairError: repair.ok ? null : repair.error ?? "repair_invalid",
    lengthIssue,
    finalLengthIssue,
    latencyMs: initial.latencyMs + repair.latencyMs,
    totalLatencyMs: initial.latencyMs + repair.latencyMs,
    status: repair.status ?? initial.status,
    usage: addUsage(initial.usage, repair.usage),
    estimatedCostUsd: (initial.estimatedCostUsd ?? 0) + (repair.estimatedCostUsd ?? 0),
    output: finalOutput,
    schemaValid: repair.schemaValid,
    quality: finalQuality,
    initial: { latencyMs: initial.latencyMs, usage: initial.usage, estimatedCostUsd: initial.estimatedCostUsd, quality: initial.quality },
    repair: { ok: repair.ok, latencyMs: repair.latencyMs, usage: repair.usage, estimatedCostUsd: repair.estimatedCostUsd, quality: repair.quality },
  };
}

async function main() {
  const apiKey = loadApiKey().trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
  const repeat = Number.parseInt(arg("repeat", "2"), 10);
  const requestedCases = arg("cases", "").split(",").map((value) => value.trim()).filter(Boolean);
  const requestedModels = arg("models", "").split(",").map((value) => value.trim()).filter(Boolean);
  const selectedCases = requestedCases.length ? CASES.filter((item) => requestedCases.includes(item.id)) : CASES;
  const selectedModels = requestedModels.length ? MODELS.filter((model) => requestedModels.includes(model)) : MODELS;
  if ((requestedCases.length && requestedCases.length !== selectedCases.length) || (requestedModels.length && requestedModels.length !== selectedModels.length)) throw new Error("Unknown --cases or --models value.");
  const outputPath = resolve(arg("output", "/private/tmp/campuslog-answer-draft-model-benchmark.json"));
  const results = [];
  for (const caseItem of selectedCases) for (let run = 1; run <= repeat; run += 1) for (const model of selectedModels) {
    const result = await call(apiKey, model, caseItem);
    results.push({ caseId: caseItem.id, draftType: caseItem.draftType, model, run, result });
    process.stdout.write(`${model} ${caseItem.id} #${run}: ${result.ok ? "ok" : result.error ?? result.repairError ?? "invalid"} (${result.totalLatencyMs ?? result.latencyMs}ms${result.repairCalled ? ", incl. repair" : ""})\n`);
  }
  const summary = Object.fromEntries(selectedModels.map((model) => {
    const rows = results.filter((row) => row.model === model);
    const successful = rows.filter((row) => row.result.ok);
    const avg = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    return [model, { calls: rows.length, successRate: rows.length ? successful.length / rows.length : 0, initialSuccessRate: rows.length ? rows.filter((row) => row.result.initialOk ?? (row.result.phase === "initial" && row.result.ok)).length / rows.length : 0, repairCallRate: rows.length ? rows.filter((row) => row.result.repairCalled).length / rows.length : 0, repairSuccessRate: rows.filter((row) => row.result.repairCalled).length ? rows.filter((row) => row.result.repairCalled && row.result.repairOk).length / rows.filter((row) => row.result.repairCalled).length : null, finalInRangeRate: rows.length ? rows.filter((row) => row.result.ok && !row.result.finalLengthIssue).length / rows.length : 0, averageLatencyMs: avg(rows.map((row) => row.result.totalLatencyMs ?? row.result.latencyMs)), averageInitialLatencyMs: avg(rows.map((row) => row.result.initial?.latencyMs ?? row.result.latencyMs)), averageRepairLatencyMs: avg(rows.filter((row) => row.result.repairCalled).map((row) => row.result.repair?.latencyMs ?? 0)), averageInputTokens: avg(successful.map((row) => row.result.usage?.input_tokens ?? 0)), averageOutputTokens: avg(successful.map((row) => row.result.usage?.output_tokens ?? 0)), averageCostUsd: avg(successful.map((row) => row.result.estimatedCostUsd ?? 0)), expectedMentionRate: avg(successful.map((row) => row.result.quality?.expectedMentionRate ?? 0)), forbiddenHitCount: successful.reduce((sum, row) => sum + (row.result.quality?.forbiddenHits?.length ?? 0), 0) }];
  }));
  const cases = selectedCases.map((item) => ({ id: item.id, draftType: item.draftType, purpose: item.purpose, prompt: item.prompt, expected: item.expected }));
  writeFileSync(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), dataClassification: "synthetic-only; no production records or user PII", models: selectedModels, repeat, cases, summary, results }, null, 2)}\n`, { mode: 0o600 });
  process.stdout.write(`Saved answer-draft benchmark to ${outputPath}\n`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
