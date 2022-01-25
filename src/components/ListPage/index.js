import { createElement as h, Component, Link, withFetch } from '@/core';
import { Articles } from './Articles';

class ListPage extends Component {
  render() {
    return (
      h('div', null,
        h(Articles, {articles: this.props.fetched || []}),
        h('div', null,
          h('button', {onClick: () => {}}, '새로고침'),
          h(Link, {to: '/write'}, '작성'),
        )
      )
    );
  }
}

const ListPageWithFetch = withFetch('/api/articles')(ListPage);
export { ListPageWithFetch as ListPage };
