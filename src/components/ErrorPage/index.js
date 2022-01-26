import {
  createElement as h,
  Component,
  withRouter,
} from '@/core';
import { urlFor } from '@/helper';

export const ErrorPage = withRouter(
  class extends Component {
    componentDidMount() {
      this.props.history.bust(urlFor({ type: 'api/list' }));
    }

    render() {
      return (
        h('div', null, 'error!')
      );
    }
  }
);
