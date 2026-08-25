/** Run a callback on an interval only while the tab is visible. */
export function startVisibleInterval(callback: () => void, ms: number): () => void {
  const tick = () => {
    if (typeof document !== "undefined" && document.hidden) return;
    callback();
  };
  const id = window.setInterval(tick, ms);
  const onVis = () => {
    if (!document.hidden) callback();
  };
  document.addEventListener("visibilitychange", onVis);
  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", onVis);
  };
}
