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

const isReservedAttribute = name => HostTree.reservedAttributes.includes(name);
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

    Object.entries(props)
      .filter(([name]) => !isReservedAttribute(name))
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

  diffProps(nextProps) {
    const prevProps = this.tree.props;
    const combinedProps = Object.assign({}, prevProps, nextProps);
    Object.entries(combinedProps)
      .filter(([name]) => !isReservedAttribute(name))
      .forEach(([name, value]) => {
        if (typeof nextProps[name] === 'undefined') {
          this.transaction.push({
            type: 'attribute/remove',
            payload: {
              name,
            }
          });
        } else if (
          typeof prevProps[name] === 'undefined' && typeof nextProps[name] !== 'undefined' ||
          prevProps[name] !== nextProps[name]
        ) {
          this.transaction.push({
            type: 'attribute/set',
            payload: {
              name,
              value
            }
          });
        }
      });
  }

  diff(nextTree) {
    if (this.tree.type !== nextTree.type) {
      // TODO
      return;
    }
    this.diffProps(nextTree.props);

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
        type: 'node/remove',
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
        type: 'node/insert',
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
        const children = mappedChildren[key];
        const node = children.instance;
        children.diff(newChildren[movedIndex].tree);
        moved.push({
          type: 'node/move',
          payload: {
            node,
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
        case 'node/remove':
          node.removeChild(payload.node);
          break;
        case 'node/move':
          // FIXME: 리액트에서는 노드간의 순서가 변경되는 경우에도 input 포커스를 잃지 않는다.
        case 'node/insert':
          if (
            payload.index === node.childNodes.length - 1 &&
            payload.node !== node.childNodes[node.childNodes.length-1]
          ) {
            node.appendChild(payload.node);
          } else if (payload.node !== node.childNodes[payload.index]) {
            node.insertBefore(payload.node, node.childNodes[payload.index])
          }
          break;
        case 'attribute/set':
          node.setAttribute(payload.name, payload.value);
          break;
        case 'attribute/remove':
          node.removeAttribute(payload.name);
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
            .map(item => h('input', {name: item, placeholder: item, key: item, id: item}))
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
