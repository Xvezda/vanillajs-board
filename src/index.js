function createElement(type, props, ...children) {
  return {
    type,
    props: Object.assign({}, props, children.length > 0 && { children }),
  };
}

function mount(tree) {
  if (typeof tree === 'string') {
    return document.createTextNode(tree);
  }
  const { type, props } = tree;
  const node = document.createElement(type);
  if (props && props.children) {
    props.children
      .map(mount)
      .forEach(node.appendChild.bind(node));
  }
  return node;
}

function render(element, container) {
  container.appendChild(mount(element));
}

const h = createElement;

const prevTree = h('ul', null,
  h('li', null, 'foo'),
  h('li', null, 'bar'),
);

const nextTree = h('ul', null,
  h('li', null, 'foo'),
  h('li', null, 'bar'),
  h('li', null, 'baz'),
);

render(
  prevTree,
  document.body,
);
