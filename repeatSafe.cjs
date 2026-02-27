/**
 * Preload patch: prevent crashes from String.repeat() receiving a negative count.
 * This runs before Next.js build/dev starts.
 */
(() => {
  const proto = String.prototype;
  if (!proto.__repeat_original__) {
    Object.defineProperty(proto, "__repeat_original__", {
      value: proto.repeat,
      enumerable: false,
      configurable: false,
      writable: false,
    });

    proto.repeat = function repeatSafe(count) {
      const n = Number(count);
      const safe = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
      return proto.__repeat_original__.call(this, safe);
    };
  }
})();
