import { createElement as h, Component } from '../dom';
import { createContext } from '../context';

export const Link = withRouter(class extends Component {
  navigate(event) {
    event.preventDefault();
    history.pushState({}, null, this.props.to);

    this.props.router.forceUpdate();
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

    this.handlePopState = this.handlePopState.bind(this);
  }

  handlePopState() {
    this.forceUpdate();
  }

  componentDidMount() {
    window.addEventListener('popstate', this.handlePopState);
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.handlePopState);
  }

  render() {
    return (
      h(Context.Provider, {
          value: {
            match: matchPath(location.pathname, {path: '/'}),
            router: this,
          },
        },
        this.props.children[0]
      )
    );
  }
}

export class Route extends Component {
  render() {
    return (
      h(Context.Consumer, null, context => {
        const match = matchPath(location.pathname, this.props);
        const component = this.props.component;
        if (component) {
          return h(component, {...context, ...this.props.passedProps}, ...this.props.passedProps.children);
        }
        if (context) {
          return h(Context.Provider, {value: { match, ...this.props, ...context }}, this.props.children[0]);
        }
        return '';
      })
    );
  }
}

export function withRouter(WrappedComponent) {
  return class extends Component {
    render() {
      return h(Route, {component: WrappedComponent, passedProps: this.props});
    }
  };
}

export class Switch extends Component {
  render() {
    return this.props.children
      .find(child => matchPath(location.pathname, child.props)) || '';
  }
}
