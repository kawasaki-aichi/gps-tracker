// SIM 잔량 표시.
//
// v2 `GET /sims/{iccid}/quota/data`:
//   volume        = 남은 MB (음수면 초과)
//   total_volume  = 현재 할당량
//   used          = total_volume − volume
// 서버가 remaining_mb / quota_mb / used_mb 로도 붙여 준다.
//
// v1 캐시(워커 갱신 전)는 usage.stats 의 date==="TOTAL" data.volume 이 사용량이고
// info.current_quota 가 할당량이다. quota/sms 는 UI 에 SMS 잔량이 없어서 쓰지 않는다.

export function simQuotaView(sim) {
  const info = sim?.info || {};
  const quota = sim?.quota;

  if (quota && quota.volume != null && quota.volume !== '') {
    const remainingMb = num(sim.remaining_mb != null ? sim.remaining_mb : quota.volume);
    const quotaMb = num(
      sim.quota_mb != null ? sim.quota_mb : (quota.total_volume ?? info.current_quota ?? 0),
    );
    const usedMb = sim.used_mb != null && sim.used_mb !== ''
      ? num(sim.used_mb)
      : (Number.isFinite(quotaMb) && Number.isFinite(remainingMb) ? quotaMb - remainingMb : NaN);
    return {
      source: 'quota',
      usedMb: Number.isFinite(usedMb) ? usedMb : 0,
      quotaMb: Number.isFinite(quotaMb) ? quotaMb : 0,
      remainingMb: Number.isFinite(remainingMb) ? remainingMb : null,
      todayMb: null,
      hasUsed: Number.isFinite(usedMb),
    };
  }

  const stats = sim?.usage?.stats || [];
  const total = stats.find((r) => r.date === 'TOTAL');
  const todayKey = new Date().toISOString().slice(0, 10);
  const today = stats.find((r) => r.date === todayKey);
  const quotaMb = num(info.current_quota || 0);
  const usedMb = total ? num(total.data?.volume || '0') : 0;
  return {
    source: 'usage',
    usedMb: Number.isFinite(usedMb) ? usedMb : 0,
    quotaMb: Number.isFinite(quotaMb) ? quotaMb : 0,
    remainingMb: null,
    todayMb: today ? num(today.data?.volume || '0') : 0,
    hasUsed: Boolean(total),
  };
}

function num(v) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : NaN;
}
