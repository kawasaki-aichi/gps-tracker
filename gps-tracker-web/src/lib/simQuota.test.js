import assert from 'node:assert/strict';
import test from 'node:test';
import { simQuotaView } from './simQuota.js';

// 1NCE v2 SimsQuota example: volume is remaining MB, total_volume is the allowance.
const quotaPayload = {
  iccid: '898822806661475202',
  info: { status: 'Enabled', current_quota: 500, msisdn: '882285100000018' },
  quota: {
    id: 1,
    volume: 435.787951,
    total_volume: 500,
    service: 'data',
    expiry_date: '2029-01-01T00:00:00.000Z',
  },
  remaining_mb: 435.787951,
  quota_mb: 500,
  used_mb: 500 - 435.787951,
};

test('v2 quota/data: used = total_volume - remaining volume', () => {
  const view = simQuotaView(quotaPayload);
  assert.equal(view.source, 'quota');
  assert.equal(view.quotaMb, 500);
  assert.ok(Math.abs(view.remainingMb - 435.787951) < 1e-9);
  assert.ok(Math.abs(view.usedMb - (500 - 435.787951)) < 1e-6);
  assert.equal(view.todayMb, null);
  assert.equal(view.hasUsed, true);
});

test('v2 quota overage: negative remaining counts as used above the allowance', () => {
  const view = simQuotaView({
    quota: { volume: -0.6077737808227539, total_volume: 500, service: 'data' },
  });
  assert.ok(view.usedMb > 500);
  assert.ok(Math.abs(view.usedMb - (500 - view.remainingMb)) < 1e-9);
});

test('v1 usage cache still parses TOTAL and today until the worker refreshes', () => {
  const view = simQuotaView({
    info: { current_quota: 500 },
    usage: {
      stats: [
        { date: 'TOTAL', data: { volume: '120.5' } },
        { date: new Date().toISOString().slice(0, 10), data: { volume: '1.25' } },
      ],
    },
  });
  assert.equal(view.source, 'usage');
  assert.equal(view.usedMb, 120.5);
  assert.equal(view.quotaMb, 500);
  assert.equal(view.todayMb, 1.25);
  assert.equal(view.hasUsed, true);
});
