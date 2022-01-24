import { HostTree } from './HostTree';

export class TextTree extends HostTree {
  constructor(tree) {
    super(tree);
    // 텍스트는 자식노드가 없다
    this.children = null;
  }

  mount() {
    const node = document.createTextNode(this.tree);
    this.instance = node;
    return node;
  }

  diff(nextTree) {
    if (this.tree !== nextTree) {
      this.transaction.push({
        type: 'replace',
        payload: {
          node: nextTree,
        }
      });
    }
    this.process();
  }

  process() {
    this.transaction.forEach(({ payload }) => {
      const newNode = document.createTextNode(payload.node);
      this.instance.parentNode
        .replaceChild(newNode, this.instance);
    });
  }
}
