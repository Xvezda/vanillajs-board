import { InstanceTree } from './InstanceTree';
import { instantiateTree } from './internal';

const isReservedAttribute = name => HostTree.reservedAttributes.includes(name);
export class HostTree extends InstanceTree {
  static get reservedAttributes() {
    return ['children', 'key', 'ref'];
  }

  getHost() {
    return this.instance;
  }

  mount() {
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

  unmount(nextInstance) {
    const host = this.getHost();
    if (nextInstance) {
      let parentNode = host.parentNode;
      while (parentNode) {
        if (parentNode._mounted) break;
        parentNode = parentNode.parentNode;
      }
      const mounted = parentNode._mounted;
      mounted.children = nextInstance;
      host.parentNode.replaceChild(nextInstance.mount(), host);
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
      this.unmount(instantiateTree(nextTree));
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
      mappedChildren[key].mount();
      const node = mappedChildren[key].getHost();
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
        const node = children.getHost();
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

