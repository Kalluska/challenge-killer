/**
 * Prevent build/prerender crashes caused by String.repeat() receiving a negative count.
 * (Yes, this is a hack — but it makes the app resilient if a dependency computes a negative pad.)
 */
declare global {
  interface String {
    __repeat_original__?: (count: number) => string;
  }
}

const proto = String.prototype as any;

if (!proto.__repeat_original__) {
  proto.__repeat_original__ = proto.repeat;

  proto.repeat = function repeatSafe(count: number) {
    const n = Number(count);
    const safe = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    return proto.__repeat_original__.call(this, safe);
  };
}

export {};
