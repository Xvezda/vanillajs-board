import { createElement as h, Component } from '@/core';
import { withRouter } from '@/core/router';

export const Link = withRouter(class extends Component {
  navigate(event) {
    event.preventDefault();
    this.props.history.push(this.props.to);
  }

  render() {
    return (
      h('a', {
          href: this.props.to,
          onClick: this.navigate.bind(this),
        },
        ...this.props.children,
      )
    );
  }
});

