import { InstanceTree } from './InstanceTree';
import { instantiateTree } from './internal';

export class CompositeTree extends InstanceTree {
  constructor(tree) {
    super(tree);
    this.rendered = null;
  }

  getHost() {
    return this.children.getHost();
  }

  mount() {
    const { type, props } = this.tree;
    const instance = this.instance = new type;
    instance.props = props;

    this.rendered = instance.render();
    this.children = instantiateTree(this.rendered);

    const node = this.children.mount();
    if (typeof instance.componentDidMount === 'function') {
      queueMicrotask(() => instance.componentDidMount());
    }
    return node;
  }

  unmount() {
    const instance = this.instance;
    if (typeof instance.componentWillUnmount === 'function') {
      instance.componentWillUnmount();
    }
    this.instance = null;
    this.children.unmount();
  }

  diff(nextTree) {
    if (this.tree.type !== nextTree.type) return;

    const nextInstance = new nextTree.type;
    nextInstance.props = nextTree.props;
    const nextRendered = nextInstance.render();

    this.children.diff(nextRendered);
  }
}
