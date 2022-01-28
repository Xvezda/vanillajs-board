/**
 * @jest-environment jsdom
 */
import { createElement as h, render, Component } from './dom';

describe('render', () => {
  test('hello world 렌더링', () => {
    const container = document.createElement('div');
    render(h('h1', null, 'hello world'), container);

    expect(container).toMatchSnapshot();
  });

  test('hello world 컴포넌트 렌더링', () => {
    class App extends Component {
      render() {
        return h('h1', null, 'hello world');
      }
    }
    const container = document.createElement('div');
    render(h(App), container);

    expect(container).toMatchSnapshot();
  });

  test('변경사항 적용', () => {
    const container = document.createElement('div');
    render(h('h1', null, 'hello world'), container);
    render(h('h1', null, 'foobar'), container);
    expect(container.innerHTML).toMatch(/foobar/);
  });
});