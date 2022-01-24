function createElement(type, props, ...children) {
  return {
    type,
    props: Object.assign({}, props, children.length > 0 && { children }),
  };
}

class InstanceTree {
  constructor(tree) {
    this.tree = tree;
    this.instance = null;
    this.children = null;
  }
}

class CompositeTree extends InstanceTree {
  constructor(tree) {
    super(tree);
    this.rendered = null;
  }

  mount() {
    const { type, props } = this.tree;
    const instance = new type;
    this.instance = instance;
    instance.props = props;

    this.rendered = instance.render();
    this.children = instantiateTree(this.rendered);

    return this.children.mount();
  }
}

class HostTree extends InstanceTree {
  mount() {
    if (typeof this.tree === 'string') {
      return document.createTextNode(this.tree);
    }
    const { type, props } = this.tree;
    const node = document.createElement(type);
    if (props && props.children) {
      this.children = props.children
        .map(instantiateTree)
        .map(instance => instance.mount())
        .forEach(mounted => node.appendChild(mounted));
    }
    return node;
  }
}

function instantiateTree(tree) {
  if (typeof tree === 'string' || typeof tree.type === 'string') {
    return new HostTree(tree);
  }
  return new CompositeTree(tree);
}

function render(element, container) {
  const instance = instantiateTree(element);
  const firstNode = container.childNodes[0];
  if (firstNode && !firstNode._mounted) {
    container.childNodes
      .forEach(container.removeChild.bind(container));
    return;
  }
  const rootNode = instance.mount();
  rootNode._mounted = instance;
  container.appendChild(rootNode);
}

const h = createElement;

class App {
  render() {
    return (
      h('ul', null,
        h('li', null, 'foo'),
        h('li', null, 'bar'),
      )
    );
  }
}

render(h(App), document.body);
render(h(App), document.body);
