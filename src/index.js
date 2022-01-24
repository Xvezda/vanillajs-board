function provideDefaultKey(children) {
  children
    .filter(child => typeof child !== 'string')
    .forEach((child, i) => {
      if (typeof child.props.key === 'undefined') {
        child.props.key = i;
      }
    });
  return children;
}

function wrapChildren(children) {
  return provideDefaultKey(children.flat());
}

function createElement(type, props, ...children) {
  return {
    type,
    props: Object
      .assign(
        {},
        props,
        children.length > 0 &&
        Array.isArray(children) ?
        { children: wrapChildren(children) } :
        { children }),
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
    if (this.tree.type !== nextTree.type) {
      // TODO
      return;
    }

    const prevChildren = this.children;
    const nextChildren = nextTree.props.children.map(instantiateTree);

    const extractKey =
      ({ tree }, i) => typeof tree !== 'string' ? tree.props.key : i;
    const prevKeys = prevChildren.map(extractKey);
    const nextKeys = nextChildren.map(extractKey);

    const mappedChildren = [...nextChildren, ...prevChildren]
      .reduce((acc, child) => (
        { ...acc, [child.tree.props.key]: child }
      ), {});

    const removed = [];
    prevKeys.forEach(key => {
      if (!nextKeys.includes(key)) {
        removed.push({
          type: 'remove',
          payload: {
            node: mappedChildren[key].instance,
          }
        });
      }
    });
    this.transaction.push(...removed);

    const inserted = [];
    nextKeys.forEach((key, i) => {
      if (!prevKeys.includes(key)) {
        const node = mappedChildren[key].instance ||
          mappedChildren[key].mount();

        inserted.push({
          type: 'insert',
          payload: {
            node,
            index: i,
          }
        });
      }
    });
    this.transaction.push(...inserted);

    const moved = [];
    prevKeys.forEach((key, i) => {
      if (nextKeys.includes(key)) {
        const movedIndex = nextKeys.indexOf(key);
        if (movedIndex !== i) {
          moved.push({
            type: 'move',
            payload: {
              node: mappedChildren[key].instance,
              index: movedIndex,
            }
          });
        }
      }
    });
    this.transaction.push(...moved);

    this.process();

    this.tree = nextTree;
    this.children = nextKeys.map(key => mappedChildren[key]);
  }

  process() {
    this.transaction.forEach(({ type, payload }) => {
      const node = this.instance;
      switch (type) {
        case 'remove':
          node.removeChild(payload.node);
          break;
        case 'move':
        case 'insert':
          if (
            payload.index === node.childNodes.length - 1 &&
            payload.node !== node.childNodes[node.childNodes.length-1]
          ) {
            node.appendChild(payload.node);
          } else if (payload.node !== node.childNodes[payload.index]) {
            node.insertBefore(payload.node, node.childNodes[payload.index])
          }
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
    if (!this.props.shuffle) {
      return (
        h('div', null,
          ['bar', 'baz']
            .map(item => h('input', {name: item, placeholder: item, key: item}))
        )
      );
    } else {
      return (
        h('div', null,
          ['foo', 'bar', 'baz']
            .map(item => h('input', {name: item, placeholder: item, key: item}))
        )
      );
    }
  }
}

let flag = false;
render(h(App, {shuffle: flag}), document.body);
setInterval(() => {
  flag = !flag;
  render(h(App, {shuffle: flag}), document.body);
}, 3000);
