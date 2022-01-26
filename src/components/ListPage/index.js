import {
  createElement as h,
  Component,
  Link,
  withInitFetch,
  withRouter,
  compose,
} from '@/core';
import { urlFor } from '@/helper';
import { Articles } from './Articles';

const initialState = {
  sort: 'desc',
  limit: 30,
  page: 0,
  articles: [],
};
class ListPage extends Component {
  static sortByTimestamp(articles, sort) {
    return articles.sort(sort === 'asc' ?
      (a, b) => a.timestamp - b.timestamp :
      (a, b) => b.timestamp - a.timestamp);
  }

  constructor(props) {
    super(props);

    this.state = {
      ...initialState,
    };
  }

  componentDidUpdate(prevState, prevProps) {
    if (this.props.fetchedData !== prevProps.fetchedData) {
      this.setState({
        articles: this.props.fetchedData,
      });
    }
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
      ...initialState,
      articles: this.props.fetchedData,
    });
  }

  updateLimit({ target }) {
    this.setState({ limit: parseInt(target.value) })
  }

  filterKeyword(keyword) {
    this.setState({
      articles: this.props.fetchedData
        .filter(({ title }) => title.includes(keyword)),
    });
  }

  render() {
    const articles = ListPage.sortByTimestamp(
      this.state.articles.slice(this.state.page, this.state.limit),
      this.state.sort,
    );

    return (
      h('div', null,
        h('div', null,
          h('select', {
            onChange: this.updateLimit.bind(this),
            value: this.state.limit,
          }, [5, 10, 30, 50, 100].map((n, i) => (
                h('option', {
                    key: n,
                    name: 'limit',
                    value: String(n),
                    selected: n === this.state.limit,
                  },
                  String(n), '개'
                )
            ))
          ),
          h('button', {onClick: this.reset.bind(this)}, '초기화'),
          h('button', {onClick: this.refresh.bind(this)}, '새로고침'),
          h('input', {
            placeholder: '검색어',
            onInput: ({ target }) => this.filterKeyword(target.value),
          }),
          h(Link, {to: urlFor({ type: 'write' })}, '작성'),
        ),
        h(Articles, {
          articles,
          resort: this.resort.bind(this)
        }),
      )
    );
  }
}

const ListPageWithFetch = compose(
  withRouter,
  withInitFetch(urlFor({ type: 'api/list' }))
)(ListPage);

export { ListPageWithFetch as ListPage };
