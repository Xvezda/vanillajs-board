import {
  createElement as h,
  Component,
  withRouter,
  withInitFetch,
  compose,
  formatTimestamp,
  request,
} from '@/core';

class ReadPage extends Component {
  editArticle(event) {
    event.preventDefault();

    const id = this.props.match.params.id;
    this.props.history.push(`/write`, { id, });
  }

  backToList(event) {
    event.preventDefault();

    this.props.history.push('/');
  }

  deleteArticle(event) {
    event.preventDefault();

    request(`/api/articles/${this.props.match.params.id}`, {method: 'DELETE'})
      .then(() => {
        this.props.history.bust('/api/articles');
        this.props.history.push('/')
      })
      .catch(console.error);
  }

  render() {
    const article = this.props.fetchedData;
    return (
      article ?
        h('div', null,
          h('div', null, '글번호: ', article.id),
          h('h1', null, article.title),
          h('div', null, '작성자: ', article.author),
          h('div', null, '작성일: ', formatTimestamp(article.timestamp)),
          h('div', null,
            h('article', null, article.content)
          ),
          h('div', null,
            h('button', {onClick: this.editArticle.bind(this)}, '수정'),
            h('button', {onClick: this.deleteArticle.bind(this)}, '삭제'),
            h('button', {onClick: this.backToList.bind(this)}, '목록'),
          )
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
