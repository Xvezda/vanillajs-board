import { InstanceTree } from './InstanceTree';
import { instantiateTree } from './internal';

const isReservedAttribute =
  name => HostTree.reservedAttributes.includes(name) || /^on[A-Z]/.test(name);

const propsToAttributeEntries = props => {
  return Object.entries(props)
    .filter(([name]) => !isReservedAttribute(name))
    .filter(([_, value]) =>
      ['boolean', 'string', 'number'].includes(typeof value))
    .filter(([name, value]) => typeof value === 'boolean' ? value : value !== '')
    .map(([name, value]) => {
      if (typeof value === 'boolean') {
        return [name, name];
      }
      return [name, value];
    });
};

export class HostTree extends InstanceTree {
  static get reservedAttributes() {
    return ['children', 'key', 'ref', 'style'];
  }

  getHost() {
    return this.instance;
  }

  mountProps(node, props) {
    propsToAttributeEntries(props)
      .forEach(([name, value]) => {
        node.setAttribute(name, value);
      });

    Object.entries(props)
      .filter(([name]) => isReservedAttribute(name))
      .forEach(([name, value]) => {
        if (name === 'style') {
          Object.entries(value)
            .forEach(([name, value]) => {
              node.style[name] = value;
            });
        } else if (/^on[A-Z]/.test(name)) {
          node[name.toLowerCase()] = value;
        }
      });
  }

  mountChildren(node, props) {
    const children = props.children;
    if (children) {
      this.children = children
        .map(instantiateTree);

      this.children.parent = this;

      this.children
        .map(child => child.mount())
        .forEach(mounted => node.appendChild(mounted));
    }
  }

  mount() {
    const { type, props } = this.tree;
    const node = document.createElement(type);

    this.mountProps(node, props);
    this.mountChildren(node, props);

    this.instance = node;
    this.setRef();

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

  getClosestCompositeTree() {
    const host = this.getHost();
    let parentNode = host.parentNode;
    while (parentNode) {
      if (parentNode._mountedInstanceTree) break;
      parentNode = parentNode.parentNode;
    }
    return parentNode._mountedInstanceTree;
  }

  unmount(nextInstance) {
    this.unsetRef();

    const host = this.getHost();
    if (this.children) {
      this.children.forEach(child => child.unmount());
    }
    this.unmountProps();

    if (nextInstance) {
      const node = nextInstance.mount();
      node._mountedInstanceTree = host._mountedInstanceTree;
      const compositeTree = this.getClosestCompositeTree();
      if (compositeTree) {
        compositeTree.children = nextInstance;
        compositeTree.instance = nextInstance.instance;
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
    propsToAttributeEntries(combinedProps)
      .concat(
        typeof combinedProps['style'] !== 'undefined' ?
        [['style', combinedProps['style']]] :  // 배열을 연결해야 하기 때문에 이중으로 처리
        [])
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
          name === 'value'  // TODO: 제어 컴포넌트는 값을 컴포넌트 상태로 고정한다
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
    const moved = new Set();
    this.transaction.forEach(({ type, payload }) => {
      const node = this.instance;
      switch (type) {
        case 'node/move':
          // FIXME: 리액트에서는 노드간의 순서가 변경되는 경우에도 input 포커스를 잃지 않는다.
          if (!moved.has(payload.to)) {
            const toNode = node.childNodes[payload.to];
            const nextSibling = toNode.nextSibling;
            payload.node.replaceWith(toNode);
            if (payload.node !== nextSibling) {
              node.insertBefore(payload.node, nextSibling);
            } else {
              node.appendChild(payload.node);
            }
          }
          moved.add(payload.to);
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
          } else if (payload.name === 'style') {
            Object.entries(payload.value)
              .forEach(([name, value]) => {
                node.style[name] = value;
              });
            return;
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

