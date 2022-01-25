import { createElement as h, Component, Link, withInitFetch } from '@/core';
import { Articles } from './Articles';

class ListPage extends Component {
  render() {
    const articles = this.props.fetchedData || [];
    return (
      h('div', null,
        h(Articles, { articles, }),
        h('div', null,
          h('button', {onClick: this.props.fetch}, '새로고침'),
          h(Link, {to: '/write'}, '작성'),
        )
      )
    );
  }
}

const ListPageWithFetch = withInitFetch('/api/articles')(ListPage);
export { ListPageWithFetch as ListPage };
