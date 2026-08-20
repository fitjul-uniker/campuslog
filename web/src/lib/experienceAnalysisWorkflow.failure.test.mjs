import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

const analysisMockSource = `
  export async function requestExperienceAnalysis() {
    return globalThis.__campuslogQaAnalysisMode === "cancel"
      ? {
          ok: false,
          error: {
            code: "REQUEST_CANCELLED",
            message: "AI 분석 요청을 취소했습니다.",
          },
        }
      : {
          ok: false,
          error: {
            code: "OPENAI_API_ERROR",
            message: "mock OpenAI failure",
          },
        };
  }
`;
const repositoryMockSource = `
  export class CampusLogRepositoryError extends Error {}
  export function getCampusLogRepository() {
    return globalThis.__campuslogQaRepository;
  }
  export function isRepositorySessionError() {
    return false;
  }
`;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/analysisApi") {
      return {
        shortCircuit: true,
        url: `data:text/javascript,${encodeURIComponent(analysisMockSource)}`,
      };
    }

    if (specifier === "@/lib/repositories/campuslogRepository") {
      return {
        shortCircuit: true,
        url: `data:text/javascript,${encodeURIComponent(repositoryMockSource)}`,
      };
    }

    if (specifier.startsWith("@/")) {
      return {
        shortCircuit: true,
        url: new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href,
      };
    }

    return nextResolve(specifier, context);
  },
});

const originalExperience = {
  id: "qa-experience",
  title: "QA 활동",
  period: "2026.08",
  role: "기획",
  description: "요구사항을 확인하고 결과를 기록했습니다.",
  achievements: "검증 가능한 결과를 남겼습니다.",
  relatedLinks: [],
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
  analysisStatus: "analyzed",
};
const existingAnalysis = {
  id: "qa-analysis",
  experienceId: originalExperience.id,
  summary: "기존에 저장된 정상 분석",
};
const sourceSnapshot = structuredClone(originalExperience);
const analysisSnapshot = structuredClone(existingAnalysis);
let analysisSaveCount = 0;
const persistedState = {
  analysis: structuredClone(existingAnalysis),
};

const repository = {
  experiences: {
    getById: async () => originalExperience,
  },
  experienceFollowups: {
    listByExperienceId: async () => [],
  },
  analyses: {
    save: async (analysis) => {
      analysisSaveCount += 1;
      persistedState.analysis = analysis;
      throw new Error("실패 응답에서는 저장이 호출되면 안 됩니다.");
    },
  },
};
globalThis.__campuslogQaRepository = repository;

const { analyzeCurrentExperience } = await import(
  "./experienceAnalysisWorkflow.ts?qa-failure-fixture"
);

test("mock AI 실패는 경험 원문과 마지막 정상 분석을 덮어쓰지 않는다", async () => {
  globalThis.__campuslogQaAnalysisMode = "failure";
  const result = await analyzeCurrentExperience(originalExperience.id);

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "OPENAI_API_ERROR");
  assert.equal(analysisSaveCount, 0);
  assert.deepEqual(originalExperience, sourceSnapshot);
  assert.deepEqual(persistedState.analysis, analysisSnapshot);
});

test("mock 취소는 REQUEST_CANCELLED를 유지하고 저장을 시도하지 않는다", async () => {
  globalThis.__campuslogQaAnalysisMode = "cancel";
  const result = await analyzeCurrentExperience(originalExperience.id, {
    signal: AbortSignal.abort(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "REQUEST_CANCELLED");
  assert.equal(analysisSaveCount, 0);
  assert.deepEqual(originalExperience, sourceSnapshot);
  assert.deepEqual(persistedState.analysis, analysisSnapshot);
});
