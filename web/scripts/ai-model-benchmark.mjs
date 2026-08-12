#!/usr/bin/env node
/**
 * CampusLog AI model benchmark (synthetic data only).
 *
 * Runs the production Responses API pattern (system + JSON user prompt,
 * strict JSON schema, store:false) against two models without changing any
 * route constant. It never prints environment variable values.
 *
 * Usage:
 *   node scripts/ai-model-benchmark.mjs --repeat=2 --output=/private/tmp/campuslog-ai-benchmark.json
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const MODELS = ["gpt-5.6-luna", "gpt-4.1-mini"];
const OPENAI_URL = "https://api.openai.com/v1/responses";
const OUTPUT_DEFAULT = "/private/tmp/campuslog-ai-model-benchmark.json";
const ISO = "2026-08-12T00:00:00.000Z";

function evaluateTypescript(source, exportedNames, injected = {}) {
  const withoutImports = source.replace(/^import[\s\S]*?;\n/gm, "");
  const footer = `\nmodule.exports={${exportedNames.join(",")}};`;
  const javascript = ts.transpileModule(`${withoutImports}${footer}`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const compatModule = { exports: {} };
  new Function("module", "exports", "require", ...Object.keys(injected), javascript)(
    compatModule, compatModule.exports, () => ({}), ...Object.values(injected),
  );
  return compatModule.exports;
}

function loadProductionPromptArtifacts() {
  const root = resolve(process.cwd(), "src/app/api");
  const purposeSource = readFileSync(resolve(process.cwd(), "src/lib/recommendationPurposeConfig.ts"), "utf8");
  const { getRecommendationPurposeConfig } = evaluateTypescript(purposeSource, ["getRecommendationPurposeConfig"]);
  const common = {
    AI_API_REQUEST_LIMITS: { analyze: { openAiTimeoutMs: 45_000 }, recommend: { openAiTimeoutMs: 60_000 } },
    EXPERIENCE_INPUT_LIMITS: { title: 1, period: 1, role: 1, description: 1, achievements: 1 },
  };
  const analysis = evaluateTypescript(readFileSync(resolve(root, "analyze/route.ts"), "utf8"), ["createPrompt", "analysisResponseSchema"], common);
  const recommendation = evaluateTypescript(readFileSync(resolve(root, "recommend/route.ts"), "utf8"), ["createRecommendationPrompt", "recommendationV2ResponseSchema"], {
    ...common,
    RECOMMENDATION_SCHEMA_VERSION: "v2",
    RECOMMENDATION_PROMPT_VERSION: "recommendation-v2.1",
    getRecommendationPurposeConfig,
  });
  return { analysis, recommendation };
}

const PRODUCTION_PROMPTS = loadProductionPromptArtifacts();

function argument(name, fallback) {
  const value = process.argv.find((item) => item.startsWith(`--${name}=`));
  return value ? value.slice(name.length + 3) : fallback;
}

function loadEnvValue(name) {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separator = line.indexOf("=");
      if (separator === -1) continue;
      if (line.slice(0, separator).trim() !== name) continue;
      const rawValue = line.slice(separator + 1).trim();
      return rawValue.replace(/^(["'])(.*)\1$/, "$2");
    }
  }
  return process.env[name] ?? "";
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function emptyJdAnalysis() {
  return {
    summary: "", responsibilities: [], requiredQualifications: [], preferredQualifications: [],
    techStack: [], requiredExperience: [], requirementMatches: [], emphasisPoints: [],
    gaps: [], overclaimRisks: [], finalVerdict: "", finalVerdictReason: "",
  };
}

// Production analysis schema, kept here so the test uses strict structured output.
const analysisSchema = {
  type: "object", additionalProperties: false,
  required: ["summary", "achievements", "keywords", "star", "evidenceGaps"],
  properties: {
    summary: { type: "string" },
    achievements: { type: "array", minItems: 0, maxItems: 4, items: { type: "string" } },
    keywords: { type: "array", minItems: 0, maxItems: 10, items: { type: "string" } },
    star: { type: "object", additionalProperties: false, required: ["situation", "task", "action", "result"], properties: {
      situation: { type: "string" }, task: { type: "string" }, action: { type: "string" }, result: { type: "string" },
    } },
    evidenceGaps: { type: "array", minItems: 0, maxItems: 5, items: { type: "object", additionalProperties: false,
      required: ["id", "category", "title", "reason", "question", "answer", "updatedAt"], properties: {
        id: { type: "string" }, category: { type: "string", enum: ["result_metric", "role_scope", "collaboration_scope", "technical_detail", "process_detail", "decision_reason", "learning", "other"] },
        title: { type: "string" }, reason: { type: "string" }, question: { type: "string" }, answer: { type: "string" }, updatedAt: { type: "string" },
      } } },
  },
};

const matchSchema = { type: "object", additionalProperties: false,
  required: ["experienceId", "experienceTitle", "rank", "score", "fitLevel", "matchReason", "matchedEvidence", "missingEvidence", "overclaimRisks", "suggestedAngle", "relatedCompetencies"],
  properties: {
    experienceId: { type: "string" }, experienceTitle: { type: "string" }, rank: { type: "number" }, score: { type: "number" }, fitLevel: { type: "string", enum: ["high", "medium", "low"] },
    matchReason: { type: "string" }, matchedEvidence: { type: "array", maxItems: 6, items: { type: "string" } }, missingEvidence: { type: "array", maxItems: 6, items: { type: "string" } }, overclaimRisks: { type: "array", maxItems: 6, items: { type: "string" } }, suggestedAngle: { type: "string" }, relatedCompetencies: { type: "array", maxItems: 8, items: { type: "string" } },
  },
};
const requirementMatchSchema = { type: "object", additionalProperties: false, required: ["category", "requirement", "status", "matchedExperienceIds", "evidence", "missingEvidence"], properties: {
  category: { type: "string", enum: ["responsibility", "required_qualification", "preferred_qualification", "tech_stack", "required_experience"] }, requirement: { type: "string" }, status: { type: "string", enum: ["met", "partially_met", "insufficient_evidence", "not_met"] }, matchedExperienceIds: { type: "array", maxItems: 6, items: { type: "string" } }, evidence: { type: "array", maxItems: 6, items: { type: "string" } }, missingEvidence: { type: "string" },
} };
const recommendationSchema = { type: "object", additionalProperties: false, required: ["extractedRequirements", "jdAnalysis", "matches", "noMatchReason", "draftSentence", "resolvedPrompt"], properties: {
  resolvedPrompt: { type: "string" },
  extractedRequirements: { type: "object", additionalProperties: false, required: ["requiredCompetencies", "preferredCompetencies", "keywords", "intent", "constraints"], properties: {
    requiredCompetencies: { type: "array", maxItems: 10, items: { type: "string" } }, preferredCompetencies: { type: "array", maxItems: 10, items: { type: "string" } }, keywords: { type: "array", maxItems: 16, items: { type: "string" } }, intent: { type: "string" }, constraints: { type: "array", maxItems: 10, items: { type: "string" } },
  } },
  jdAnalysis: { type: "object", additionalProperties: false, required: ["summary", "responsibilities", "requiredQualifications", "preferredQualifications", "techStack", "requiredExperience", "requirementMatches", "emphasisPoints", "gaps", "overclaimRisks", "finalVerdict", "finalVerdictReason"], properties: {
    summary: { type: "string" }, responsibilities: { type: "array", maxItems: 12, items: { type: "string" } }, requiredQualifications: { type: "array", maxItems: 12, items: { type: "string" } }, preferredQualifications: { type: "array", maxItems: 12, items: { type: "string" } }, techStack: { type: "array", maxItems: 16, items: { type: "string" } }, requiredExperience: { type: "array", maxItems: 12, items: { type: "string" } }, requirementMatches: { type: "array", maxItems: 24, items: requirementMatchSchema }, emphasisPoints: { type: "array", maxItems: 10, items: { type: "string" } }, gaps: { type: "array", maxItems: 10, items: { type: "string" } }, overclaimRisks: { type: "array", maxItems: 10, items: { type: "string" } }, finalVerdict: { type: "string", enum: ["recommended", "challenge_possible", "needs_improvement", ""] }, finalVerdictReason: { type: "string" },
  } },
  matches: { type: "array", minItems: 0, maxItems: 3, items: matchSchema }, noMatchReason: { type: "string" }, draftSentence: { type: "string" },
} };

function analysisPrompt(experience) {
  return PRODUCTION_PROMPTS.analysis.createPrompt(experience, []);
}

function experienceContext(experience) {
  return { id: experience.id, title: experience.title, period: experience.period, role: experience.role, description: experience.description, achievements: experience.achievements, relatedLinks: [], analysis: null, directEvidenceSources: { originalExperienceFields: { title: experience.title, period: experience.period, role: experience.role, description: experience.description, achievements: experience.achievements, relatedLinks: [] }, followupAnswers: [] } };
}

void analysisSchema;
void recommendationSchema;
void experienceContext;

function recommendationPrompt(test) {
  return PRODUCTION_PROMPTS.recommendation.createRecommendationPrompt({
    purpose: test.purpose, prompt: test.prompt, images: [], experiences: EXPERIENCES, analyses: [],
  });
}

function experience(id, title, role, description, achievements = "") {
  return { id, title, period: "2025.03 ~ 2025.06", role, description, achievements, relatedLinks: [], createdAt: ISO, updatedAt: ISO, analysisStatus: "unanalyzed" };
}

const EXPERIENCES = [
  experience("tech-campuslog", "CampusLog 웹 서비스 개발", "프론트엔드·백엔드 개발", "대학생 활동 기록 서비스의 화면과 API를 구현했다. 경험 입력, AI 분석, 경험 추천 흐름을 만들고 오류 상태와 입력 제한을 점검했다.", "Next.js 기반 화면과 API route를 구현하고 테스트를 통과시켰다."),
  experience("lead-festival", "교내 축제 부스 운영", "팀장", "5명의 팀원과 축제 부스를 준비했다. 회의에서 역할을 나누고 준비 일정이 늦어진 항목을 확인해 우선순위를 다시 정했다.", "행사 당일 부스를 운영했다. 방문자 수는 기록하지 않았다."),
  experience("external-marketing", "청년 정책 홍보단", "콘텐츠 기획", "지역 청년 정책을 소개하는 카드뉴스를 기획하고 게시 일정표를 만들었다. 팀원 초안을 모아 표현을 검토했다.", "카드뉴스 4건을 게시했다. 조회 수는 확인하지 못했다."),
  experience("volunteer-library", "지역 도서관 학습 봉사", "학습 보조", "중학생 학습 시간을 돕고 매주 참여 내용을 기록했다. 학생별 진도를 바탕으로 다음 주 설명 순서를 조정했다.", "6주 동안 참여했다."),
  experience("tech-api", "교내 동아리 예약 API 개선", "백엔드 개발", "예약 API의 중복 요청으로 동일 시간이 두 번 예약되는 문제를 재현했다. 요청 처리 순서를 검토하고 중복 예약을 막는 검증을 추가했다.", "중복 예약 재현 시나리오를 작성하고 검증 로직을 추가했다."),
];

const ANALYSIS_CASES = [
  { id: "analysis-project", kind: "analysis", experience: EXPERIENCES[0], mustMention: ["CampusLog"], forbidden: ["사용자 수", "매출"] },
  { id: "analysis-external", kind: "analysis", experience: EXPERIENCES[2], mustMention: ["카드뉴스"], forbidden: ["조회 수 1만", "팔로워"] },
  { id: "analysis-volunteer-sparse", kind: "analysis", experience: EXPERIENCES[3], mustMention: ["6주"], forbidden: ["성적 향상", "명"] },
  { id: "analysis-leadership", kind: "analysis", experience: EXPERIENCES[1], mustMention: ["5명"], forbidden: ["매출", "수익"] },
  { id: "analysis-technical", kind: "analysis", experience: EXPERIENCES[4], mustMention: ["중복 예약"], forbidden: ["Redis", "Kubernetes"] },
];
const RECOMMEND_CASES = [
  { id: "recommend-cover-letter", kind: "recommend", purpose: "cover_letter", prompt: "공동의 목표를 달성하기 위해 다른 사람들과 협력한 경험과 본인의 기여를 작성해 주세요.", expectedTop: "lead-festival", forbidden: ["매출", "방문자 1000"] },
  { id: "recommend-interview", kind: "recommend", purpose: "interview", prompt: "진행 중 예상하지 못한 문제를 발견하고 원인을 파악한 뒤 해결한 경험을 설명해 주세요.", expectedTop: "tech-api", forbidden: ["Kubernetes", "트래픽 10배"] },
  { id: "recommend-role", kind: "recommend", purpose: "other", prompt: "웹 서비스 개발 직무 지원에서 사용자의 문제를 해결하기 위해 구현과 검증을 수행한 경험을 추천해 주세요.", expectedTop: "tech-campuslog", forbidden: ["AWS", "사용자 1만"] },
  { id: "recommend-jd", kind: "recommend", purpose: "jd", prompt: "백엔드 개발 채용공고: API를 개발하고 데이터 정합성과 중복 요청을 관리할 수 있는 사람. Java 또는 Kotlin, Spring, RDBMS 경험 우대. 협업과 코드 리뷰 경험 우대.", expectedTop: "tech-api", forbidden: ["Java 경험", "Spring 경험", "RDBMS 경험"] },
];
const CASES = [...ANALYSIS_CASES, ...RECOMMEND_CASES];

function extractOutput(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) return payload.output_text;
  for (const item of payload?.output ?? []) for (const content of item?.content ?? []) if (typeof content?.text === "string" && content.text.trim()) return content.text;
  return "";
}
function validateAnalysis(value) {
  return Boolean(value && typeof value.summary === "string" && Array.isArray(value.achievements) && Array.isArray(value.keywords) && value.star && typeof value.star.situation === "string" && Array.isArray(value.evidenceGaps) && value.evidenceGaps.every((gap) => typeof gap.id === "string" && typeof gap.answer === "string"));
}
function validateRecommendation(value, purpose) {
  if (!value || !value.extractedRequirements || !Array.isArray(value.matches) || typeof value.resolvedPrompt !== "string" || !value.jdAnalysis) return false;
  if (!value.matches.every((match, index) => EXPERIENCES.some((item) => item.id === match.experienceId) && match.rank === index + 1 && typeof match.matchReason === "string" && Array.isArray(match.matchedEvidence))) return false;
  return purpose === "jd" ? value.jdAnalysis.finalVerdict !== "" : JSON.stringify(value.jdAnalysis) === JSON.stringify(emptyJdAnalysis());
}
function scoreOutput(test, parsed) {
  const serialized = JSON.stringify(parsed);
  const mustMentions = test.mustMention ?? [];
  const mentionRate = mustMentions.length ? mustMentions.filter((item) => serialized.includes(item)).length / mustMentions.length : 1;
  const hallucinationHits = (test.forbidden ?? []).filter((item) => serialized.includes(item));
  const topMatchCorrect = test.expectedTop ? parsed?.matches?.[0]?.experienceId === test.expectedTop : null;
  return { mentionRate, hallucinationHits, topMatchCorrect };
}
function pricing(model, usage) {
  const rate = model === "gpt-5.6-luna" ? { input: 0.2, output: 1.2 } : { input: 0.4, output: 1.6 };
  return ((usage.input_tokens ?? 0) * rate.input + (usage.output_tokens ?? 0) * rate.output) / 1_000_000;
}
async function callModel(apiKey, model, test) {
  const isAnalysis = test.kind === "analysis";
  const body = { model, input: [{ role: "system", content: isAnalysis ? "당신은 CampusLog의 AI 경험 분석 도우미입니다. 대학생 활동 경험을 과장 없이 간결하게 정리하고, 사용자가 바로 답할 수 있는 부족 정보 질문을 한국어로 제공합니다." : "당신은 CampusLog의 AI 추천 v2 도우미입니다. 입력 텍스트와 첨부 이미지의 문항/JD 요구사항을 구조화하고, 전달된 후보 경험 context와 보완 답변을 사실 근거로 삼아 적합한 경험만 최대 Top 3로 추천합니다. 이미지에서 읽을 수 없는 내용은 추측하지 않습니다. 기존 AI 분석은 참고 자료로만 사용하고, 원본에 없는 사실은 만들지 않으며 추천 이유와 직접 근거, 부족 근거, 과장 위험을 분리합니다." }, { role: "user", content: isAnalysis ? analysisPrompt(test.experience) : recommendationPrompt(test) }], text: { format: { type: "json_schema", name: isAnalysis ? "campuslog_experience_analysis_v2" : "campuslog_experience_recommendation_v2", strict: true, schema: isAnalysis ? PRODUCTION_PROMPTS.analysis.analysisResponseSchema : PRODUCTION_PROMPTS.recommendation.recommendationV2ResponseSchema } }, max_output_tokens: isAnalysis ? 1600 : 4200, store: false };
  // GPT-5.6 Luna's default reasoning is not comparable to GPT-4.1-mini's no-reasoning mode.
  if (model === "gpt-5.6-luna") body.reasoning = { effort: "none" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), isAnalysis ? 45_000 : 60_000);
  const startedAt = performance.now();
  try {
    const response = await fetch(OPENAI_URL, { method: "POST", signal: controller.signal, headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const latencyMs = Math.round(performance.now() - startedAt);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, latencyMs, status: response.status, errorType: payload?.error?.type ?? "api_error" };
    const raw = extractOutput(payload);
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return { ok: false, latencyMs, status: response.status, errorType: "json_parse" }; }
    const schemaValid = test.kind === "analysis" ? validateAnalysis(parsed) : validateRecommendation(parsed, test.purpose);
    return { ok: schemaValid, latencyMs, status: response.status, schemaValid, usage: payload.usage ?? {}, estimatedCostUsd: pricing(model, payload.usage ?? {}), quality: scoreOutput(test, parsed), output: parsed };
  } catch (error) {
    return { ok: false, latencyMs: Math.round(performance.now() - startedAt), status: 0, errorType: error?.name === "AbortError" ? "timeout" : "network" };
  } finally { clearTimeout(timeout); }
}
function aggregate(results, model) {
  const rows = results.filter((row) => row.model === model);
  const successes = rows.filter((row) => row.result.ok);
  const values = (key) => successes.map((row) => row.result[key]).filter(Number.isFinite);
  const avg = (items) => items.length ? items.reduce((sum, item) => sum + item, 0) / items.length : null;
  const latency = values("latencyMs");
  const input = successes.map((row) => row.result.usage?.input_tokens ?? 0);
  const output = successes.map((row) => row.result.usage?.output_tokens ?? 0);
  const quality = successes.map((row) => row.result.quality);
  return { calls: rows.length, successRate: rows.length ? successes.length / rows.length : 0, schemaValidRate: rows.length ? rows.filter((row) => row.result.schemaValid).length / rows.length : 0, latencyMs: { average: avg(latency), minimum: latency.length ? Math.min(...latency) : null, maximum: latency.length ? Math.max(...latency) : null }, tokens: { inputAverage: avg(input), outputAverage: avg(output) }, costUsd: { averagePerCall: avg(successes.map((row) => row.result.estimatedCostUsd)), total: successes.reduce((sum, row) => sum + row.result.estimatedCostUsd, 0) }, quality: { requiredFactMentionRate: avg(quality.map((item) => item.mentionRate)), topMatchAccuracy: avg(quality.filter((item) => item.topMatchCorrect !== null).map((item) => item.topMatchCorrect ? 1 : 0)), hallucinationHitCount: quality.reduce((sum, item) => sum + item.hallucinationHits.length, 0) } };
}

async function main() {
  const apiKey = loadEnvValue("OPENAI_API_KEY").trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured in .env.local or environment.");
  const repeat = Number.parseInt(argument("repeat", "2"), 10);
  if (!Number.isInteger(repeat) || repeat < 1 || repeat > 5) throw new Error("--repeat must be an integer from 1 to 5.");
  const modelFilter = argument("models", "").split(",").map((value) => value.trim()).filter(Boolean);
  const selectedModels = modelFilter.length ? MODELS.filter((model) => modelFilter.includes(model)) : MODELS;
  if (modelFilter.length && selectedModels.length !== modelFilter.length) throw new Error("--models contains an unknown model id.");
  const caseFilter = argument("cases", "").split(",").map((value) => value.trim()).filter(Boolean);
  const selectedCases = caseFilter.length ? CASES.filter((test) => caseFilter.includes(test.id)) : CASES;
  if (caseFilter.length && selectedCases.length !== caseFilter.length) throw new Error("--cases contains an unknown case id.");
  const outputPath = resolve(argument("output", OUTPUT_DEFAULT));
  const sourceFiles = ["src/app/api/analyze/route.ts", "src/app/api/recommend/route.ts"].map((file) => ({ file, sha256: hashFile(resolve(process.cwd(), file)) }));
  const availability = {};
  for (const model of selectedModels) {
    const response = await fetch(`https://api.openai.com/v1/models/${model}`, { headers: { Authorization: `Bearer ${apiKey}` } });
    availability[model] = response.ok;
  }
  const results = [];
  for (const test of selectedCases) for (let run = 1; run <= repeat; run += 1) for (const model of selectedModels) {
    const result = await callModel(apiKey, model, test);
    results.push({ caseId: test.id, kind: test.kind, model, run, result });
    process.stdout.write(`${model} ${test.id} #${run}: ${result.ok ? "ok" : result.errorType ?? "schema_invalid"} (${result.latencyMs}ms)\n`);
  }
  const cases = selectedCases.map((test) => ({ id: test.id, kind: test.kind, purpose: test.purpose, prompt: test.prompt, mustMention: test.mustMention, expectedTop: test.expectedTop, forbidden: test.forbidden }));
  const report = { generatedAt: new Date().toISOString(), dataClassification: "synthetic-only; no production records or user PII", configuration: { models: selectedModels, lunaReasoningEffort: "none", repeat, structuredOutput: true, store: false, sourceFiles }, availability, cases, summary: Object.fromEntries(selectedModels.map((model) => [model, aggregate(results, model)])), results };
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  process.stdout.write(`Saved aggregate and synthetic outputs to ${outputPath}\n`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
