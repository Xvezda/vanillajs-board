import { createElement as h, Component, Link } from '@/core';

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return [date.getFullYear(), date.getMonth()+1, date.getDate()].join('/');
}

export class Articles extends Component {
  render() {
    return (
      h('table', null,
        h('thead', null,
          h('tr', null,
            h('th', null, '글번호'),
            h('th', null, '제목'),
            h('th', null, '작성자'),
            h('th', null, '작성일'),
          )
        ),
        h('tbody', null,
          ...this.props.articles.map(article => (
            h('tr', null,
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
