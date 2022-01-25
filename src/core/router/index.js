import { createElement as h, Component } from '../dom';
import { createContext } from '../context';

export class Link extends Component {
  render() {
    return h('a', {
        href: this.props.to,
        onClick: this.navigate.bind(this),
        ...this.props,
      },
      this.children,
    );
  }

  navigate(event) {
    event.preventDefault();
    history.pushState({}, null, this.props.to);
  }
}

function pathnameToRegExp(pathname = '/') {
  return pathname
    .replace(/(?<=\/)\:([a-zA-Z_]+)/, '(?<$1>[^/]+)')
    .replace(/\//g, '\\/');
}

function matchPath(pathname, props) {
  const pathRegex = '^' +
    pathnameToRegExp(props.path) +
    (props.exact ? '$' : '');
  const matched = new RegExp(pathRegex).exec(pathname);
  if (!matched) return null;
  return {
    params: {
      ...matched.groups
    }
  };
}

const Context = createContext({
  match: null,
});
export class Router extends Component {
  constructor(props) {
    super(props);

    this.state = {
      match: null,
    };
  }

  componentDidMount() {
    this.setState({
      match: matchPath(location.pathname, {path: '/'})
    });
  }

  render() {
    return (
      h(Context.Provider, {
          value: this.state,
        },
        this.props.children[0]
      )
    );
  }
}

export class Route extends Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  render() {
    return (
      h(Context.Consumer, null, context => {
        // FIXME
        const match = matchPath(location.pathname, this.props);
        const component = this.props.component;
        if (component) {
          return h(component, context);
        }
        const children = component ?
          h(component, {match: null, test: 'test', ...this.props}) :
          this.props.children[0];

        if (match) {
          return (
            h(Context.Provider, {value: { match, }}, children)
          );
        }
        return '';
      })
    );
  }
}

export function withRouter(WrappedComponent) {
  return class extends Component {
    render() {
      return h(Route, {component: WrappedComponent});
    }
  };
}

export class Switch extends Component {
  render() {
    return this.props.children
      .find(child => matchPath(location.pathname, child.props)) || '';
  }
}
