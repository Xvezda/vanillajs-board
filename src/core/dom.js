import { instantiateTree } from './reconciler';

export class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
  }

  setState(partialState) {
    this.state = {
      ...this.state,
      ...partialState,
    };
  }

  render() {
    return null;
  }
}
Component.prototype.isComponent = {};

function warnIfKeyNotExists(children) {
  if (
    children.some(child => typeof child.props.key === 'undefined') ||
    new Set(children.map(child => child.props.key)).size !== children.length
  ) {
    console.warn('children of list should have unique keys');
  }
}

function childToString(child) {
  return ['object', 'function'].includes(typeof child) ?
    child :
    String(child);
}

function wrapChildren(children) {
  if (children.some(child => Array.isArray(child))) {
    children.forEach(warnIfKeyNotExists);
  }
  return children.flat().map(childToString);
}

export function createElement(type, props, ...children) {
  return {
    type,
    props: Object
      .assign(
        {},
        props,
        children.length > 0 &&
        { children: wrapChildren(children) } ||
        { children }),
  };
}

function clearContainer(container) {
  container.childNodes
    .forEach(container.removeChild.bind(container));
}

export function render(element, container) {
  const instance = instantiateTree(element);
  if (container._mounted) {
    const mounted = container._mounted;
    mounted.diff(element);
    return;
  }
  clearContainer(container);

  const rootNode = instance.mount();
  container._mounted = instance;
  container.appendChild(rootNode);
}
