import scheduler from "./scheduler";

console.log("[worker] starting scheduler…");
scheduler.init();

setInterval(() => {
  // noop
}, 1000 * 60);