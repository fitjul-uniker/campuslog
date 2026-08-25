import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentSource = await readFile(
  new URL("./AnimatedGradientActionButton.tsx", import.meta.url),
  "utf8",
).catch(() => "");
const cssSource = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);
const buttonRuleStart = cssSource.indexOf(".animated-gradient-action-button {");
const buttonRuleEnd = cssSource.indexOf("}", buttonRuleStart);
const buttonRule = cssSource.slice(buttonRuleStart, buttonRuleEnd);

test("AI 실행 버튼은 기존 아이콘, gradient text, Chevron을 제공한다", () => {
  assert.match(componentSource, /forwardRef<\s*HTMLButtonElement/);
  assert.match(componentSource, /animated-gradient-action-border/);
  assert.match(componentSource, /animated-gradient-action-text/);
  assert.match(componentSource, /<ChevronRight/);
  assert.match(
    componentSource,
    /<ChevronRight[\s\S]*?stroke=\{`url\(#\$\{iconGradientId\}\)`\}/,
  );
  assert.doesNotMatch(componentSource, /<hr/);
  assert.match(componentSource, /cloneElement\(icon/);
  assert.match(componentSource, /<linearGradient/);
  assert.match(componentSource, /stroke: `url\(#\$\{iconGradientId\}\)`/);
  assert.match(cssSource, /@keyframes ai-action-gradient-shift/);
  assert.match(cssSource, /@keyframes ai-action-icon-color-shift/);
  assert.match(
    cssSource,
    /\.animated-gradient-action-icon-stop-end\s*\{[\s\S]*?animation-delay: -3s;/,
  );
  assert.match(cssSource, /mask-composite: subtract;/);
  assert.match(
    cssSource,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.animated-gradient-action-text\s*\{\s*animation: none;/,
  );
});

test("AI 실행 버튼은 colorful 효과를 보존한 capsule 프레임을 사용한다", () => {
  assert.match(buttonRule, /min-height: 44px;/);
  assert.match(buttonRule, /border: 1px solid transparent;/);
  assert.match(buttonRule, /padding: 10px 14px;/);
  assert.match(buttonRule, /box-shadow: none;/);
  assert.doesNotMatch(buttonRule, /inset|linear-gradient/);
  assert.match(
    cssSource,
    /AI execution actions keep their colorful beam and text[\s\S]*?\.animated-gradient-action-button\s*\{[^}]*border-radius:\s*999px;[\s\S]*?\.animated-gradient-action-border\s*\{[^}]*border-radius:\s*inherit;/,
  );
  assert.match(
    cssSource,
    /\.animated-gradient-action-border\s*\{[\s\S]*?background:\s*linear-gradient\([\s\S]*?animation:\s*ai-action-gradient-shift 6s ease infinite;/,
  );
});
