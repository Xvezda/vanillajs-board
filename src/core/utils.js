export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return [date.getFullYear(), date.getMonth()+1, date.getDate()].join('/');
}

export function compose(...funcs) {
  return function (...args) {
    const init = funcs.pop()(...args);
    return funcs
      .reverse()
      .reduce((acc, f) => f(acc), init);
  };
}
