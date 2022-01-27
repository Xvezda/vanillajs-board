export class InstanceTree {
  constructor(tree) {
    this.tree = tree;
    this.instance = null;
    this.children = null;
    this.transaction = [];

    if (tree.props.key) {
      this.key = tree.props.key;
    }
  }
}
