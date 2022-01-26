import { InstanceTree } from './InstanceTree';
import { instantiateTree } from './internal';

const isReservedAttribute =
  name => HostTree.reservedAttributes.includes(name) || /^on[A-Z]/.test(name);
export class HostTree extends InstanceTree {
  static get reservedAttributes() {
    return ['children', 'key', 'ref'];
  }

  getHost() {
    return this.instance;
  }

  mountProps(node, props) {
    const propsEntries = Object.entries(props);
    propsEntries
      .filter(([name]) => !isReservedAttribute(name))
      .forEach(([name, value]) => {
        node.setAttribute(name, value);
      });

    propsEntries
      .filter(([name]) => isReservedAttribute(name))
      .forEach(([name, value]) => {
        if (/^on[A-Z]/.test(name)) {
          node[name.toLowerCase()] = value;
        }
      });
  }

  mountChildren(node, children) {
    this.children = children
      .map(instantiateTree);

    this.children.parent = this;

    this.children
      .map(child => child.mount())
      .forEach(mounted => node.appendChild(mounted));
  }

  mount() {
    const { type, props } = this.tree;
    const node = document.createElement(type);

    this.mountProps(node, props);

    if (props.children) {
      this.mountChildren(node, props.children);
    }
    this.instance = node;

    return node;
  }

  unmountProps() {
    Object.entries(this.props)
      .forEach(([name, value]) => {
        if (/^on[A-Z]/.test(name)) {
          this.instance[name.toLowerCase()] = null;
        }
      });
  }

  unmount(nextInstance) {
    const host = this.getHost();
    if (this.children) {
      this.children.forEach(child => child.unmount());
    }
    this.unmountProps();

    if (nextInstance) {
      const node = nextInstance.mount();
      let parentNode = host.parentNode;
      node._mounted = host._mounted;
      while (parentNode) {
        if (parentNode._mounted) break;
        parentNode = parentNode.parentNode;
      }
      if (parentNode) {
        const mounted = parentNode._mounted;
        mounted.children = nextInstance;
        mounted.instance = nextInstance.instance;
        if (this.parent) {
          this.parent.children = nextInstance;
        }
        host.parentNode.replaceChild(node, host);
      }
      this.instance = node;
      this.children = nextInstance.children;
      this.tree = nextInstance.tree;
    }
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
          typeof prevProps[name] === 'undefined' &&
          typeof nextProps[name] !== 'undefined' ||
          prevProps[name] !== nextProps[name] ||
          name === 'value'
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
      const nextInstance = instantiateTree(nextTree);
      nextInstance.parent = this.parent;
      this.unmount(nextInstance);
      return;
    }

    this.diffProps(nextTree.props);

    const oldChildren = this.children;
    const newChildren = nextTree.props.children.map(instantiateTree);

    const extractKey = ({ key }, i) => key ?? i;
    const prevKeys = oldChildren.map(extractKey);
    const nextKeys = newChildren.map(extractKey);
    
    const combinedChildren = [...newChildren, ...oldChildren];
    const mappedChildren = combinedChildren
      .map((child, i) => [child.tree.props?.key ?? i, child])
      .reduce((acc, [key, child]) => (
        { ...acc, [key]: child }
      ), {});

    const removed = [];
    prevKeys.forEach(key => {
      if (nextKeys.includes(key)) return;
      const children = mappedChildren[key];
      children.unmount();
      removed.push({
        type: 'node/remove',
        payload: {
          node: children.getHost(),
        }
      });
    });
    this.transaction.push(...removed);

    const inserted = [];
    nextKeys.forEach((key, i) => {
      if (prevKeys.includes(key)) return;
      const node = mappedChildren[key].mount();
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
      const children = mappedChildren[key];
      if (movedIndex !== i) {
        const node = children.getHost();
        children.diff(newChildren[movedIndex].tree);
        moved.push({
          type: 'node/move',
          payload: {
            node,
            from: i,
            to: movedIndex,
          }
        });
      } else {
        children.instance = this.children[i].instance;
        children.children = this.children[i].children;
        children.diff(nextTree.props.children[i]);
      }
    });
    moved.sort((a, b) => a.payload.to - b.payload.to);
    this.transaction.push(...moved);

    const nextChildren = nextKeys
      .map(key => mappedChildren[key]);
    nextChildren.forEach(child => child.parent = this.parent);

    this.process();

    this.tree = nextTree;
    this.children = nextChildren;
    this.children.parent = this;
  }

  process() {
    const movedPairs = new Set();
    this.transaction.forEach(({ type, payload }) => {
      const node = this.instance;
      switch (type) {
        case 'node/move':
          // FIXME: 리액트에서는 노드간의 순서가 변경되는 경우에도 input 포커스를 잃지 않는다.
          if (!movedPairs.has(`${payload.to}:${payload.from}`)) {
            const toNode = node.childNodes[payload.to];
            const nextSibling = toNode.nextSibling;
            payload.node.replaceWith(toNode);
            if (payload.node !== nextSibling) {
              node.insertBefore(payload.node, nextSibling);
            } else {
              node.appendChild(payload.node);
            }
          }
          movedPairs.add(`${payload.from}:${payload.to}`);
          break;
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
        case 'node/remove':
          node.removeChild(payload.node);
          break;
        case 'attribute/set':
          if (payload.name === 'value') {
            node.value = payload.value;
          }
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

