import { Component } from '../dom';

export class Router extends Component {
  render() {
    return this.props.children[0];
  }
}

export class Switch extends Component {
  render() {
    return this.props.children
      .find(child => child.props.path === location.pathname) || '';
  }
}

export class Route extends Component {
  render() {
    if (this.props.path === location.pathname) {
      return this.props.children[0];
    }
    return '';
  }
}
