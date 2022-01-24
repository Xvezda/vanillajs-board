function createElement(type, props, ...children) {
  return {
    type,
    props: Object
      .assign(
        {},
        props,
        children.length > 0 &&
        Array.isArray(children) ?
        { children: children.flat() } :
        { children }),
  };
}

class InstanceTree {
  constructor(tree) {
    this.tree = tree;
    this.instance = null;
    this.children = null;
    this.transaction = [];

    if (tree.props.key) {
      this.key = tree.props.key;
    }
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
  static get reservedAttributes() {
    return ['children', 'key', 'ref'];
  }

  mount() {
    if (typeof this.tree === 'string') {
      return document.createTextNode(this.tree);
    }
    const { type, props } = this.tree;
    const node = document.createElement(type);

    const isReserved = name => HostTree.reservedAttributes.includes(name);
    Object.entries(props)
      .filter(([name]) => !isReserved(name))
      .forEach(([name, value]) => {
        node.setAttribute(name, value);
      });

    if (props.children) {
      this.children = props.children
        .map(instantiateTree);

      this.children
        .map(instance => instance.mount())
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

    const oldChildren = this.children;
    const newChildren = nextTree.props.children.map(instantiateTree);

    const extractKey = ({ key }, i) => key ?? i;
    const prevKeys = oldChildren.map(extractKey);
    const nextKeys = newChildren.map(extractKey);

    const mappedChildren = [...newChildren, ...oldChildren]
      .reduce((acc, child) => (
        { ...acc, [child.tree.props.key]: child }
      ), {});

    const removed = [];
    prevKeys.forEach(key => {
      if (nextKeys.includes(key)) return;
      removed.push({
        type: 'remove',
        payload: {
          node: mappedChildren[key].instance,
        }
      });
    });
    this.transaction.push(...removed);

    const inserted = [];
    nextKeys.forEach((key, i) => {
      if (prevKeys.includes(key)) return;
      const node = mappedChildren[key].instance ||
        mappedChildren[key].mount();

      inserted.push({
        type: 'insert',
        payload: {
          node,
          index: i,
        }
      });
    });
    this.transaction.push(...inserted);

    const moved = [];
    prevKeys.forEach((key, i) => {
      if (!nextKeys.includes(key)) return;
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
    });
    this.transaction.push(...moved);

    this.process();

    this.tree = nextTree;
    const nextChildren = nextKeys.map(key => mappedChildren[key]);
    this.children = nextChildren;
  }

  process() {
    this.transaction.forEach(({ type, payload }) => {
      const node = this.instance;
      switch (type) {
        case 'remove':
          node.removeChild(payload.node);
          break;
        case 'move':
          // FIXME: 리액트에서는 노드간의 순서가 변경되는 경우에도 input 포커스를 잃지 않는다.
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
  constructor(tree) {
    super(tree);
    // 텍스트는 자식노드가 없다
    this.children = null;
  }

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

function clearContainer(container) {
  container.childNodes
    .forEach(container.removeChild.bind(container));
}

function render(element, container) {
  const instance = instantiateTree(element);
  const firstNode = container.childNodes[0];
  if (firstNode) {
    if (!firstNode._mounted) {
      clearContainer(container);
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
