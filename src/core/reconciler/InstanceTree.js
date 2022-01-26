export class InstanceTree {
  constructor(tree) {
    this.tree = tree;
    this.instance = null;
    this.children = null;
    this.parent = null;
    this.transaction = [];

    this.props = tree.props || {};
    if (typeof tree === 'object') {
      this.key = tree.props.key;
    }
  }

  setRef() {
    if (this.props.ref) {
      this.props.ref.current = this.instance;
    }
  }

  unsetRef() {
    if (this.props.ref) {
      this.props.ref.current = null;
    }
  }
}
