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
    this.transaction = [];
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

  diff(nextTree) {
    if (this.tree.type !== nextTree.type) {
      // TODO
      return;
    }
    const nextInstance = new nextTree.type;
    nextInstance.props = nextTree.props;
    const nextRendered = nextInstance.render();

    this.children.diff(nextRendered);
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
        .map(instantiateTree);

      this.children.map(instance => instance.mount())
        .forEach(mounted => node.appendChild(mounted));
    }
    this.instance = node;
    return node;
  }

  diff(nextTree) {
    if (typeof this.tree !== typeof nextTree || this.tree.type !== nextTree.type) {
      // TODO
      return;
    }

    const prevChildren = this.tree.props.children;
    const nextChildren = nextTree.props.children;
    if (prevChildren && nextChildren) {
      let i;
      for (i = 0; i < prevChildren.length; ++i) {
        if (typeof nextChildren[i] === 'undefined') {
          this.transaction.push({
            type: 'remove',
            payload: {
              node: this.children[i].instance,
            }
          });
        } else if (prevChildren[i].type !== nextChildren[i].type) {
          const childInstance = instantiateTree(nextChildren[i]);
          this.transaction.push({
            type: 'replace',
            payload: {
              from: this.children[i].instance,
              to: childInstance.mount(),
            }
          });
        } else if (prevChildren[i].type === nextChildren[i].type) {
          this.children[i].diff(nextChildren[i]);
        }
      }
      for (; i < nextChildren.length; ++i) {
        const childInstance = instantiateTree(nextChildren[i]);
        this.transaction.push({
          type: 'create',
          payload: {
            node: childInstance.mount(),
          }
        });
      }
      this.process();
    }
  }

  process() {
    this.transaction.forEach(({ type, payload }) => {
      const node = this.instance;
      switch (type) {
        case 'remove':
          node.removeChild(payload.node);
          break;
        case 'replace':
          node.replaceChild(payload.to, payload.from);
          break;
        case 'create':
          node.appendChild(payload.node);
          break;
      }
    });
    this.transaction.length = 0;
  }
}

class TextTree extends InstanceTree {
  mount() {
    const node = document.createTextNode(this.tree);
    this.instance = node;
    return node;
  }

  diff(nextTree) {
    if (this.tree !== nextTree) {
      this.transaction.push({
        type: 'replace',
        payload: {
          node: nextTree,
        }
      });
    }
    this.process();
  }

  process() {
    this.transaction.forEach(({ payload }) => {
      const newNode = document.createTextNode(payload.node);
      this.instance.parentNode
        .replaceChild(newNode, this.instance);
    });
  }
}

function instantiateTree(tree) {
  if (typeof tree === 'string') {
    return new TextTree(tree);
  } else if (typeof tree.type === 'string') {
    return new HostTree(tree);
  }
  return new CompositeTree(tree);
}

function render(element, container) {
  const instance = instantiateTree(element);
  const firstNode = container.childNodes[0];
  if (firstNode) {
    if (!firstNode._mounted) {
      container.childNodes
        .forEach(container.removeChild.bind(container));
    } else {
      const mounted = firstNode._mounted;
      mounted.diff(element);
      return;
    }
  }
  const rootNode = instance.mount();
  rootNode._mounted = instance;
  container.appendChild(rootNode);
}

const h = createElement;

class App {
  render() {
    if (this.props.hasBaz) {
      return (
        h('ul', null,
          h('li', null, 'foo'),
          h('li', null, 'bar'),
          h('li', null, 'baz')
        )
      );
    } else {
      return (
        h('ul', null,
          h('li', null, 'foo'),
          h('li', null, 'bar'),
        )
      );
    }
  }
}

render(h(App, {hasBaz: false}), document.body);
setTimeout(() => {
  render(h(App, {hasBaz: true}), document.body);
}, 3000);
