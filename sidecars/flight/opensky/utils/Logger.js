const Logger = {
  info() {},
  debug() {},
  warn(...args) { console.warn(...args); },
  error(...args) { console.error(...args); }
};

export default Logger;
