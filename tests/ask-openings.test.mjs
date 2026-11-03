import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuery, mergeSlots, findCandidates, buildSystemPrompt, EMPTY_LIVE } from '../lib/askAiServer.js';
import { selectRecentOpenings } from '../lib/recentOpenings.js';

const now = new Date('2026-11-03T12:00:00+05:30');
const turn = (...messages) => messages.reduce((prev, message) => mergeSlots(prev, parseQuery(message)), null);
const ask = slots => findCandidates(slots, {live:EMPTY_LIVE,now});

test('new openings are a distinct intent and follow-ups retain area and date constraints', () => {
  const slots = turn('new cafes in Jubilee Hills', 'what about this month?');
  assert.equal(slots.intent,'new');
  assert.equal(slots.area,'Jubilee Hills');
  assert.equal(slots.craving.id,'cafe');
  assert.equal(slots.openingPeriod,'month');
  assert.equal(turn('what opened this week').intent,'new');
  assert.equal(turn('new cafes','best biryani in Hyderabad').intent,'recommend');
});

test('new cafe suggestions use sourced cafe reports, not popular old venues or bars', () => {
  const result = ask(turn('new cafes in Jubilee Hills'));
  assert.deepEqual(result.openingReports.map(r=>r.name),['Du Jour']);
  assert(result.list.every(c=>c.opening && c.e.id===c.opening.spotId));
  assert(selectRecentOpenings({area:'Kukatpally',now}).length===0);
});

test('no November opening dates produces no fabricated fresh recommendations', () => {
  const slots=turn('new places opened this month in Hyderabad');
  const result=ask(slots);
  assert.equal(result.openingReports.length,0);
  assert.equal(result.list.length,0);
  assert.match(result.notes.join(' '),/No source-backed confirmed opening dates/);
});

test('reports retain actual earlier opening dates and disappear when stale', () => {
  const reports=selectRecentOpenings({now});
  assert.equal(reports[0].name,'Oktober');
  assert(!reports.slice(0,3).some(r=>r.name==='HOSA'));
  assert.equal(reports.find(r=>r.name==='HOSA').opened,'August 2026');
  assert.equal(reports.find(r=>r.name==='The All American Diner').openedOn,'2026-09-23');
  assert.equal(selectRecentOpenings({now:new Date('2027-04-01')}).length,0);
  assert.equal(selectRecentOpenings({now:new Date('2026-08-01')}).length,0);
});

test('prompt includes source provenance, report dates and honest missing map tags', () => {
  const slots=turn('new places in Hyderabad');
  const prompt=buildSystemPrompt(slots,ask(slots));
  assert.match(prompt,/SOURCE-BACKED OPENING REPORTS/);
  assert.match(prompt,/Telangana Today/);
  assert.match(prompt,/Actual opening: August 2026/);
  assert.match(prompt,/exact date not confirmed/);
  assert.doesNotMatch(prompt,/—/);
});
