export class InstanceTree {
  constructor(tree) {
    this.tree = tree;
    this.instance = null;
    this.children = null;
    this.parent = null;
    this.transaction = [];

    if (typeof tree === 'object' && tree.props.key) {
      this.key = tree.props.key;
    }
  }
}
