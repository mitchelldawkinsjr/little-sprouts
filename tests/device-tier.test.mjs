import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveVisualQuality, pixelRatioCap, rendererOptions } from '../lib/device-tier.mjs';

test('explicit visual tiers win', () => {
  assert.equal(resolveVisualQuality({ choice: 'cinematic', embedded: true }), 'cinematic');
  assert.equal(resolveVisualQuality({ choice: 'balanced', deviceMemory: 2 }), 'balanced');
  assert.equal(resolveVisualQuality({ choice: 'performance' }), 'performance');
});

test('auto prefers performance on weak or embedded devices', () => {
  assert.equal(resolveVisualQuality({ choice: 'auto', embedded: true }), 'performance');
  assert.equal(resolveVisualQuality({ choice: 'auto', deviceMemory: 4 }), 'performance');
  assert.equal(resolveVisualQuality({ choice: 'auto', hardwareConcurrency: 4 }), 'performance');
  assert.equal(resolveVisualQuality({ choice: 'auto', saveData: true }), 'performance');
  assert.equal(resolveVisualQuality({ choice: 'auto', reducedMotion: true }), 'performance');
  assert.equal(resolveVisualQuality({
    choice: 'auto',
    coarsePointer: true,
    smallViewport: true
  }), 'performance');
});

test('auto defaults to balanced on capable machines and never cinematic', () => {
  const tier = resolveVisualQuality({
    choice: 'auto',
    embedded: false,
    deviceMemory: 8,
    hardwareConcurrency: 8,
    saveData: false,
    reducedMotion: false,
    coarsePointer: false,
    smallViewport: false
  });
  assert.equal(tier, 'balanced');
  assert.notEqual(resolveVisualQuality({ choice: 'auto' }), 'cinematic');
});

test('renderer knobs match the tier', () => {
  assert.equal(pixelRatioCap('performance'), 1);
  assert.equal(pixelRatioCap('balanced'), 1.15);
  assert.equal(rendererOptions('performance').antialias, false);
  assert.equal(rendererOptions('balanced').antialias, true);
  assert.equal(rendererOptions('performance').powerPreference, 'low-power');
});
