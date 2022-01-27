import { instantiateTree } from './reconciler';

export class Component {
  constructor() {
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

export function createElement(type, props, ...children) {
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