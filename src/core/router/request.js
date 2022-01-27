class RequestCache {
  set(key, value) {
    const item = {type: typeof value, value};
    localStorage.setItem(key, JSON.stringify(item));
  }

  get(key) {
    if (this.has(key)) {
      const cache = localStorage.getItem(key);
      try {
        const item = JSON.parse(cache);
        if (item.type !== typeof item.value)
          throw new Error();

        return item.value;
      } catch (e) {
        return null;
      }
    }
    return null
  }

  has(key) {
    return localStorage.getItem(key) !== null;
  }

  clear() {
    return localStorage.clear();
  }

  delete(key) {
    return localStorage.removeItem(key);
  }
}
export const cache = new RequestCache();

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

  if (400 <= response.status) {
    throw response;
  }

  const result = await response.json();
  cache.set(url, result);

  return result;
}
