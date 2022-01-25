export function compose(...funcs) {
  return function (...args) {
    const init = funcs.pop()(...args);
    return funcs
      .reverse()
      .reduce((acc, f) => f(acc), init);
  };
}
