import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const styles = readFileSync(
  new URL("./globals.css", import.meta.url),
  "utf8",
);
const signupSource = readFileSync(
  new URL("../components/auth/SignupForm.tsx", import.meta.url),
  "utf8",
);

test("공개 화면 스크롤 안내는 장식 표면 없이 텍스트만 유지한다", () => {
  assert.match(
    styles,
    /\.cover-main\[data-liquid-glass="true"\] \.landing-scroll-link\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s,
  );
});

test("공개 인증 영역은 단일 Liquid Glass 카드와 접근성 대체 표현을 가진다", () => {
  assert.match(
    styles,
    /\.cover-main\[data-liquid-glass="true"\] \.landing-auth-section::before/s,
  );
  assert.match(
    styles,
    /:is\(\.auth-shell, \.cover-main\)\[data-liquid-glass="true"\] \.auth-panel\s*\{[^}]*border-radius:\s*32px;[^}]*backdrop-filter:\s*blur\(36px\)/s,
  );
  assert.match(
    styles,
    /\.auth-control\[data-slot="input"\]\s*\{[^}]*height:\s*54px;[^}]*border-radius:\s*16px;/s,
  );
  assert.match(
    styles,
    /\.auth-submit:is\(:hover, :focus-visible\)\s*\{[^}]*background:\s*#292c31;[^}]*transform:\s*none;/s,
  );
  assert.match(
    styles,
    /\.auth-google-button:is\(:hover, :focus-visible\)\s*\{[^}]*background:\s*rgb\(255 255 255 \/ 92%\);[^}]*transform:\s*none;/s,
  );
  assert.match(
    styles,
    /@media \(prefers-reduced-transparency: reduce\), \(prefers-contrast: more\)/,
  );
}
);

test("회원가입은 별도 방식 선택 없이 로그인과 같은 인증 양식으로 시작한다", () => {
  assert.match(signupSource, /useState<SignupStage>\("credentials"\)/);
  assert.match(signupSource, /<span>회원가입<\/span>/);
  assert.match(signupSource, /Google로 회원가입/);
  assert.match(signupSource, /가입 정보 수정/);
  assert.match(signupSource, /className="auth-divider"/);
  assert.doesNotMatch(signupSource, /가입 방법을 선택해 주세요/);
  assert.doesNotMatch(signupSource, /이메일로 회원가입/);
  assert.doesNotMatch(signupSource, /auth-method-button/);
  assert.doesNotMatch(signupSource, />\s*이메일 정보\s*</);
});

test("회원가입 완료 상태는 중복 알림 대신 이메일 확인 중심의 단일 상태 화면을 사용한다", () => {
  assert.match(signupSource, /className="auth-complete"/);
  assert.match(signupSource, /<MailCheck \/>/);
  assert.match(signupSource, /가입 정보 저장 완료/);
  assert.match(signupSource, /이메일을 확인해 주세요/);
  assert.match(signupSource, /인증 링크를 누르면 회원가입이 완료돼요/);
  assert.match(signupSource, /로그인으로 이동/);
  assert.doesNotMatch(signupSource, /스팸함/);
  assert.match(
    signupSource,
    /shouldShowFeedback && state\.status !== "success"/,
  );
  assert.match(
    styles,
    /\.auth-complete-icon\s*\{[^}]*border-radius:\s*50%;/s,
  );
  assert.match(
    styles,
    /\.auth-complete-icon\s*\{[^}]*backdrop-filter:\s*blur\(18px\)/s,
  );
  assert.doesNotMatch(
    signupSource,
    /state\.status === "success"[\s\S]*메일함에서 인증을 마치면 CampusLog로 이어집니다/,
  );
});
