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

test("AI 실행 버튼 외곽은 기존 상세 액션 프레임을 따른다", () => {
  assert.match(buttonRule, /min-height: 44px;/);
  assert.match(buttonRule, /border: 1px solid transparent;/);
  assert.match(buttonRule, /border-radius: 12px;/);
  assert.match(buttonRule, /padding: 10px 14px;/);
  assert.match(buttonRule, /box-shadow: none;/);
  assert.doesNotMatch(buttonRule, /999px|inset|linear-gradient/);
});
