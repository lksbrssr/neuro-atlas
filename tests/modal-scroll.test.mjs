import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';
test('overlapping modal lifecycles keep one scroll lock until the final close', async () => {
  assert.ok(existsSync('src/lib/field-velocity/modal-scroll.ts'), 'Missing shared modal scroll ownership');
  const { lockModalScroll } = await import('../src/lib/field-velocity/modal-scroll.ts');
  const { window } = new JSDOM('<body style="padding-right:3px;overflow:auto"></body>');
  const releaseA = lockModalScroll(window.document);
  const padding = window.document.body.style.paddingRight;
  const releaseB = lockModalScroll(window.document);
  releaseA();
  assert.equal(window.document.body.style.overflow, 'hidden');
  assert.equal(window.document.body.style.paddingRight, padding);
  releaseB();
  assert.equal(window.document.body.style.overflow, 'auto');
  assert.equal(window.document.body.style.paddingRight, '3px');
  window.close();
});
