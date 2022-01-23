import { createElement as h, Component, withRouter, withFetch, compose } from '@/core';

class ReadPage extends Component {
  render() {
    const article = this.props.fetched;
    return (
      article ?
        h('div', null,
          h('h1', null, article.title),
          h('div', null, '작성자: ', article.author),
          h('div', null, article.content),
        ) :
      null
    );
  }
}

const ReadPageWithRouter = compose(
  withRouter,
  withFetch(props => `/api/articles/${props.match.params.id}`),
)(ReadPage);

export { ReadPageWithRouter as ReadPage };