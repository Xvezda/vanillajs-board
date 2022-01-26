import {
  createElement as h,
  Component,
  Link,
  withInitFetch,
  withRouter,
  compose
} from '@/core';
import { Articles } from './Articles';

class ListPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      sort: 'asc',
    };
  }

  resort(event) {
    event.preventDefault();
    this.setState({
      sort: this.state.sort === 'asc' ? 'desc' : 'asc',
    });
  }

  refresh(event) {
    event.preventDefault();

    this.props.history.bust('/api/articles');
    this.props.fetch();
  }

  reset(event) {
    event.preventDefault();

    this.setState({
      sort: 'asc',
    });
  }

  render() {
    const articles = []
      .concat(this.props.fetchedData)
      .sort(this.state.sort === 'asc' ?
        (a, b) => a.timestamp - b.timestamp :
        (a, b) => b.timestamp - a.timestamp)
      .filter(x => x);

    return (
      h('div', null,
        h(Articles, {
          articles,
          resort: this.resort.bind(this)
        }),
        h('div', null,
          h('button', {onClick: this.reset.bind(this)}, '초기화'),
          h('button', {onClick: this.refresh.bind(this)}, '새로고침'),
          h('form', null,
            h('input', {placeholder: '검색어'}),
            h('button', {type: 'submit'}, '검색'),
          ),
          h(Link, {to: '/write'}, '작성'),
        )
      )
    );
  }
}

const ListPageWithFetch = compose(
  withRouter,
  withInitFetch('/api/articles')
)(ListPage);

export { ListPageWithFetch as ListPage };
