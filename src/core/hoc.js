import { createElement as h, Component } from './dom';

export function withFetch(url, options = {}) {
  return function (WrappedComponent) {
    return class extends Component {
      constructor(props) {
        super(props);

        this.abortController = new AbortController();
      }

      componentDidMount() {
        this.fetchData();
      }

      componentWillUnmount() {
        this.abortController.abort();
      }

      fetchData() {
        this.abortController = new AbortController();
        fetch(typeof url === 'function' ? url(this.props) : url, {
          ...options, signal: this.abortController.signal})
          .then(res => res.json())
          .then(data => this.setState({ data, }))
          .catch(err => {
            // TODO
            console.error(err);
          });
      }

      render() {
        return h(WrappedComponent, {fetched: this.state.data, ...this.props});
      }
    };
  };
}
