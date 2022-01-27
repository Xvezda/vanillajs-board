import { TextTree } from './TextTree';
import { HostTree } from './HostTree';
import { CompositeTree } from './CompositeTree';

export function instantiateTree(tree) {
  if (typeof tree === 'string') {
    return new TextTree(tree);
  } else if (typeof tree.type === 'string') {
    return new HostTree(tree);
  }
  return new CompositeTree(tree);
}
