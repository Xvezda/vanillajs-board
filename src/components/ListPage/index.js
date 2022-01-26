import {
  createElement as h,
  Component,
  Link,
  withInitFetch,
  withRouter,
  compose
} from '@/core';
import { urlFor } from '@/helper';
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

    this.props.history.bust(urlFor({ type: 'api/list' }));
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
        h('div', null,
          h('select', null,
            [5, 10, 30, 50, 100].map((n, i) => (
                h('option', {
                    key: n,
                    value: String(n),
                    selected: i === 0,
                  },
                  String(n),
                  '개'
                )
            ))
          )
        ),
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
          h(Link, {to: urlFor({ type: 'write' })}, '작성'),
        )
      )
    );
  }
}

const ListPageWithFetch = compose(
  withRouter,
  withInitFetch(urlFor({ type: 'api/list' }))
)(ListPage);

export { ListPageWithFetch as ListPage };
