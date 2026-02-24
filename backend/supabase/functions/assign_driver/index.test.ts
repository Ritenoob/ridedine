import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { scoreDriver } from './index.ts';

Deno.test('scoreDriver - basic scoring calculation', () => {
  const score = scoreDriver(50, 5.0);
  assertEquals(score, 10);
});

Deno.test('scoreDriver - negative score when far away', () => {
  const score = scoreDriver(50, 10.0);
  assertEquals(score, -30);
});

Deno.test('scoreDriver - high reliability overcomes distance', () => {
  const score = scoreDriver(90, 8.0);
  assertEquals(score, 26);
});

Deno.test('scoreDriver - zero distance gives full reliability score', () => {
  const score = scoreDriver(75, 0);
  assertEquals(score, 75);
});
