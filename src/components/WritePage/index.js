import { createElement as h, Component, withRouter } from '@/core';

class WritePage extends Component {
  constructor(props) {
    super(props);

    this.postArticle = this.postArticle.bind(this);
  }

  postArticle(event) {
    event.preventDefault();

    const { target: form } = event;
    fetch(this.props.action, {
      method: this.props.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: form.title.value,
        content: form.content.value,
        author: form.author.value,
      })})
      .then(res => res.json())
      .then(({ id }) => {
        this.props.history.bust('/api/articles');
        this.props.history.push(`/${id}`);
      })
      .catch(err => {
        // TODO
        console.error(err);
      });
  }

  render() {
    return (
      h('div', null,
        h('form', {
          action: this.props.action,
          method: this.props.method,
          onSubmit: this.postArticle,
        }, h('div', null,
            h('input', {name: 'title', placeholder: '제목', required: 'required'})
          ),
          h('div', null,
            h('textarea', {name: 'content', placeholder: '내용', required: 'required'})
          ),
          h('div', null,
            h('input', {name: 'author', placeholder: '작성자', required: 'required'})
          ),
          h('div', null,
            h('button', {type: 'submit'}, '전송')
          )
        )
      )
    );
  }
}

WritePage.defaultProps = {
  action: '/api/articles',
  method: 'POST',
};

const WritePageWithRouter = withRouter(WritePage);
export { WritePageWithRouter as WritePage };
