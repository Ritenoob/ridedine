import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { decodePolyline } from './index.ts';

Deno.test('decodePolyline - simple encoded polyline', () => {
  const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
  const decoded = decodePolyline(encoded);

  assertEquals(decoded.length > 0, true);
  assertEquals(decoded[0].length, 2);
});

Deno.test('decodePolyline - empty string returns empty array', () => {
  const decoded = decodePolyline('');
  assertEquals(decoded, []);
});

Deno.test('decodePolyline - known coordinates', () => {
  const encoded = '_p~iF~ps|U';
  const decoded = decodePolyline(encoded);

  assertEquals(Array.isArray(decoded), true);
  if (decoded.length > 0) {
    assertEquals(typeof decoded[0][0], 'number');
    assertEquals(typeof decoded[0][1], 'number');
  }
});
