function createElement(type, props, ...children) {
  return {
    type,
    props: Object.assign({}, props, children.length > 0 && { children }),
  };
}

const h = createElement;

  h('ul', null,
    h('li', null, 'foo'),
    h('li', null, 'bar'),
  )
);
