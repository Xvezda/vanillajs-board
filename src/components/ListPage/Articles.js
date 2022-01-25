import { createElement as h, Component, Link } from '@/core';

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return [date.getFullYear(), date.getMonth()+1, date.getDate()].join('/');
}

export class Articles extends Component {
  constructor(props) {
    super(props);

    this.state = {
      articles: this.props.articles,
    };
  }

  componentDidUpdate(prevState, prevProps) {
  }

  render() {
    const articles = this.state.articles;

    return (
      h('table', null,
        h('thead', null,
          h('tr', null,
            h('th', null, '글번호'),
            h('th', null, '제목'),
            h('th', null, '작성자'),
            h('th', null,
              h('a', {href: '#', onClick: this.props.resort.bind(this)}, '작성일')
            ),
          )
        ),
        h('tbody', null,
          articles.map(article => (
            h('tr', {key: article.id},
              h('th', null, String(article.id)),
              h('td', null,
                h(Link, {to: `/${article.id}`}, article.title)
              ),
              h('td', null, article.author),
              h('td', null, formatTimestamp(article.timestamp)),
            )
          ))
        )
      )
    );
  }
}
