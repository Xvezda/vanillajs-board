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
      const nextChildTree = component.render();
      this.children.diff(nextChildTree);
    };

    const EnhancedType = class extends type {
      setState(partialState) {
        super.setState(partialState);
        diffChildren(this);
      }

      forceUpdate() {
        diffChildren(this);
      }

      render() {
        const rendered = super.render();
        if (rendered === null) {
          return '';
        }
        return rendered;
      }
    };

    const instance = this.instance = new EnhancedType(props);
    instance.props = props;

    this.rendered = instance.render();
    this.children = instantiateTree(this.rendered);
    this.children.parent = this;

    const node = this.children.mount();
    if (!node._mounted) {
      node._mounted = this;
    }

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
    const parent = this.parent;
    if (parent) {
      parent.children = nextInstance;
    }
    const host = this.getHost();
    delete host._mounted;

    this.children.unmount(nextInstance);
  }

  diff(nextTree) {
    if (this.tree.type !== nextTree.type) {
      const nextInstance = instantiateTree(nextTree);
      nextInstance.parent = this.parent;
      this.unmount(nextInstance);
      return;
    }

    const host = this.getHost();
    if (!host._mounted) {
      if (typeof this.instance.componentDidMount === 'function') {
        queueMicrotask(() => {
          this.instance.componentDidMount()
        });
      }
    }

    const nextInstance = new nextTree.type(nextTree.props);
    nextInstance.props = nextTree.props;
    const nextRendered = nextInstance.render();

    // FIXME: state, props 비교
    if (typeof this.instance.componentDidUpdate === 'function') {
      queueMicrotask(() => {
        this.instance.componentDidUpdate(
          this.instance.state,
          nextTree.props
        );
      });
    }
    this.children.diff(nextRendered);
  }
}
