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

    const diffChildren = component => {
      const nextTree = component.render();
      // TODO: 더 나은 업데이트 방법?
      this.children.diff(nextTree);
    };

    const instance = this.instance = new class extends type {
      setState(partialState) {
        super.setState(partialState);
        diffChildren(this);
      }
    };
    instance.props = props;

    this.rendered = instance.render();
    this.children = instantiateTree(this.rendered);

    const node = this.children.mount();
    if (typeof instance.componentDidMount === 'function') {
      queueMicrotask(() => instance.componentDidMount());
    }
    return node;
  }

  unmount(nextInstance) {
    const instance = this.instance;
    if (typeof instance.componentWillUnmount === 'function') {
      instance.componentWillUnmount();
    }
    this.instance = nextInstance;
    this.children.unmount(nextInstance);
  }

  diff(nextTree) {
    if (this.tree.type !== nextTree.type) {
      this.unmount(instantiateTree(nextTree));
      return;
    }
    const nextInstance = new nextTree.type;
    nextInstance.props = nextTree.props;
    const nextRendered = nextInstance.render();

    this.children.diff(nextRendered);
  }
}
