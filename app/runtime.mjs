// Shared mutable runtime. Live state and cross-module function refs hang off rt.
export const rt = {};
export const $ = s => document.querySelector(s);
export { esc } from '../logic.mjs?v=structure4';
