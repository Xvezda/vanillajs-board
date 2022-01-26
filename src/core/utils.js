export function compose(...funcs) {
  return function (...args) {
    const init = funcs.pop()(...args);
    return funcs
      .reverse()
      .reduce((acc, f) => f(acc), init);
  };
}

const cache = new Map();
export async function request(url, options = {}) {
  const abortController = new AbortController();
  const method = options.method || 'GET';
  if (cache.has(url)) {
    if (method.toUpperCase() === 'GET') {
      return cache.get(url);
    }
    cache.delete(url);
  }
  const response = await fetch(url, {
    signal: abortController.signal,
    ...options
  });
  const result = await response.json();
  cache.set(url, result);

  return result;
}
