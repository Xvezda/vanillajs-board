import { createElement as h, render } from './core';

class App {
  render() {
    if (!this.props.shuffle) {
      return (
        h('div', null,
          ['bar', 'baz']
            .map(item => h('input', {name: item, placeholder: item, key: item}))
        )
      );
    } else {
      return (
        h('div', null,
          ['foo', 'bar', 'baz']
            .map(item => h('input', {name: item, placeholder: item, key: item, id: item}))
        )
      );
    }
  }
}

let flag = false;
render(h(App, {shuffle: flag}), document.body);
setInterval(() => {
  flag = !flag;
  render(h(App, {shuffle: flag}), document.body);
}, 3000);
