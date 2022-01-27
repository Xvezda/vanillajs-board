import { InstanceTree } from './InstanceTree';
import { instantiateTree } from './internal';

export class CompositeTree extends InstanceTree {
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
    if (this.tree.type !== nextTree.type) return;

    const nextInstance = new nextTree.type;
    nextInstance.props = nextTree.props;
    const nextRendered = nextInstance.render();

    this.children.diff(nextRendered);
  }
}
