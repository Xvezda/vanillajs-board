import { createElement as h, Component, withRouter, withInitFetch, compose } from '@/core';

class ReadPage extends Component {
  render() {
    const article = this.props.fetchedData;
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
  withInitFetch(props => `/api/articles/${props.match.params.id}`),
)(ReadPage);

export { ReadPageWithRouter as ReadPage };
