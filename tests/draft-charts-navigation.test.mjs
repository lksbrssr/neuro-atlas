import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React, { act, StrictMode } from 'react';
import { VelocityTabs } from '../src/components/sections/velocity-tabs.tsx';
import { PerformanceCurves } from '../src/components/performance-curves.tsx';
import { selectPerformance } from '../src/lib/field-velocity/performance.ts';
import { parseFeed } from '../src/lib/field-velocity/schema.ts';
import { mount, click, settle } from './modal-helpers.mjs';
const data = selectPerformance(parseFeed(JSON.parse(readFileSync('src/data/field-velocity/neurotech.snapshot.json', 'utf8'))));
const provenance = JSON.parse(readFileSync('src/data/field-velocity/neurotech.snapshot.json.provenance.json', 'utf8'));

for (const strict of [false, true]) {
  test(`Draft links recover exact visible focus after close and Forward under StrictMode=${strict}`, async () => {
    globalThis.React = React;
    const tabs = React.createElement(VelocityTabs, { performance: React.createElement(PerformanceCurves, { data, provenance }) });
    const cleanup = await mount(strict ? React.createElement(StrictMode, null, tabs) : tabs, '#draft-charts');
    try {
      for (const id of ['tissue-mapped', 'neural-recording-hours']) {
        const link = document.querySelector(`.draft-charts a[href="#${id}"]`);
        link.focus();
        await click(link);
        assert.ok(document.querySelector('dialog[open]'));
        await click(document.querySelector('dialog .pc-modal-header button'));
        await settle();
        assert.equal(window.location.hash, '#draft-charts');
        assert.equal(document.activeElement === link, true, 'Close restores exact draft link');
        assert.equal(link.closest('[hidden]'), null);
        await act(async () => window.history.forward());
        await settle();
        assert.ok(document.querySelector('dialog[open]'));
        await click(document.querySelector('dialog .pc-modal-header button'));
        await settle();
        assert.equal(window.location.hash, '#draft-charts');
        assert.equal(document.activeElement === link, true, 'Forward then Close restores exact draft link');
      }
    } finally { await cleanup(); }
  });
}
