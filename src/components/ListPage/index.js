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
  limit: 10,
  page: 0,
  searchField: 'title',
  keyword: '',
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

  search(state) {
    this.setState({
      ...state,
    });
    this.filterKeyword();
  }

  updateKeyword({ target }) {
    this.search({ keyword: target.value });
  }

  updateLimit({ target }) {
    this.search({ limit: parseInt(target.value) });
  }

  updateSearchField({ target }) {
    this.search({ searchField: target.value });
  }

  filterKeyword() {
    const keyword = this.state.keyword;
    this.setState({
      articles: this.props.fetchedData
        .filter(article => {
          if (keyword === '') return true;
          const field = this.state.searchField;
          switch (field) {
            case 'title':
              return article.title.includes(keyword)
            case 'author':
            default:
              return article[field] === keyword;
          }
        }),
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
          h('select', {
              onChange: this.updateSearchField.bind(this),
              value: this.state.searchField,
            },
            [
              {field: 'title', name: '제목'},
              {field: 'author', name: '작성자'}
            ].map(({ field, name }) => (
              h('option', {value: field, selected: this.state.searchField === field}, name)
            ))
          ),
          h('input', {
            name: 'keyword',
            placeholder: '검색어',
            onInput: this.updateKeyword.bind(this),
            value: this.state.keyword,
          }),
          h(Link, {to: urlFor({ type: 'write' })}, '작성'),
        ),
        h(Articles, {
          articles,
          resort: this.resort.bind(this),
          search: this.search.bind(this),
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
