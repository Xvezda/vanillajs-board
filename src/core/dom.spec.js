/**
 * @jest-environment jsdom
 */
import { fireEvent, getByText, queryByText } from '@testing-library/dom';
import { createElement as h, render, Component, createElement } from './dom';

let container;
beforeEach(() => {
  container = document.createElement('div');
});

afterEach(() => {
  container.innerHTML = '';
});

describe('render', () => {
  test('hello world 렌더링', () => {
    render(h('h1', null, 'hello world'), container);
    expect(container).toMatchSnapshot();
  });

  test('hello world 컴포넌트 렌더링', () => {
    class App extends Component {
      render() {
        return h('h1', null, 'hello world');
      }
    }
    render(h(App), container);
    expect(container).toMatchSnapshot();
  });

  test('변경사항 적용', () => {
    render(h('h1', null, 'hello world'), container);
    const header = getByText(container, 'hello world');
    render(h('h1', null, 'foobar'), container);
    expect(header).toBe(getByText(container, 'foobar'));
  });
});
