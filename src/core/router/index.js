import { createElement as h, Component } from '../dom';

export class Link extends Component {
  render() {
    return h('a', {
      href: this.props.to,
      onClick: this.navigate.bind(this),
      ...this.props,
    }, ...this.children);
  }

  navigate(event) {
    event.preventDefault();
    history.pushState({}, null, this.props.to);
  }
}

function pathnameToRegExp(pathname) {
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

export class Router extends Component {
  render() {
    return this.props.children[0];
  }
}

export class Switch extends Component {
  render() {
    return this.props.children
      .find(child => matchPath(location.pathname, child.props)) || '';
  }
}

export class Route extends Component {
  render() {
    if (matchPath(location.pathname, this.props)) {
      const child = this.props.children[0];
      return h(child.type, {match: matchPath(location.pathname, this.props), ...child.props});
    }
    return '';
  }
}
