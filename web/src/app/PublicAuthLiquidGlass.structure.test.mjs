import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const styles = readFileSync(
  new URL("./globals.css", import.meta.url),
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
    /:is\(\.auth-shell, \.cover-main\)\[data-liquid-glass="true"\] \.auth-panel\s*\{[^}]*backdrop-filter:\s*blur\(32px\)/s,
  );
  assert.match(
    styles,
    /@media \(prefers-reduced-transparency: reduce\), \(prefers-contrast: more\)/,
  );
}
);
