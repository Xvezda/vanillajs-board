import { createElement as h, Component } from './dom';

export function withFetch(url, options = {}) {
  return function (WrappedComponent) {
    return class extends Component {
      constructor(props) {
        super(props);

        this.state = {
          data: null,
        };
        this.abortController = null;
      }

      componentWillUnmount() {
        try {
          this.abortController?.abort();
        } catch (e) {
          console.error(e);
        }
      }

      fetchData() {
        if (this.abortController) return;
        this.abortController = new AbortController();
        fetch(
          typeof url === 'function' ?
          url(this.props) :
          url, {
            ...options, signal: this.abortController.signal
          })
          .then(res => res.json())
          .then(data => this.setState({ data, }))
          .catch(err => {
            // TODO
            console.error(err);
          })
          .finally(() => this.abortController = null);
      }

      render() {
        return h(WrappedComponent, {
          fetchedData: this.state.data,
          fetch: this.fetchData.bind(this),
          abort: this.abortController?.abort.bind(this.abortController) ||
            (() => {}),
          ...this.props
        });
      }
    };
  };
}

export function withInitFetch(url, options = {}) {
  return function (WrappedComponent) {
    return withFetch(url, options)(
      class extends Component {
        componentDidMount() {
          this.props.fetch();
        }

        componentWillUnmount() {
          this.props.abort();
        }

        render() {
          return h(WrappedComponent, {...this.props});
        }
      }
    );
  }
}
