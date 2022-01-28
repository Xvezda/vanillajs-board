/**
 * @jest-environment jsdom
 */
import { fireEvent, getByText, queryByText } from '@testing-library/dom';
import { createElement as h, render, Component, createElement } from './dom';

let container;
beforeEach(() => {
  container = document.createElement('div');
  jest.useFakeTimers();
});

afterEach(() => {
  container.innerHTML = '';
  jest.useRealTimers();
});

const act = callback => {
  callback();
  jest.runAllTimers();
};

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

describe('Component', () => {
  describe('생명주기 메서드', () => {
    test('componentDidMount', () => {
      class App extends Component {
        componentDidMount() {
          this.props.mock();
        }

        render() {
          return null;
        }
      }
      const mock = jest.fn();
      act(() => {
        render(h(App, {mock}), container);
      });
      expect(mock).toBeCalled();
    });

    test('componentWillUnmount', () => {
      class Children extends Component {
        componentWillUnmount() {
          this.props.mock();
        }

        render() {
          return null;
        }
      }

      class App extends Component {
        render() {
          return this.props.show && h(Children, {mock: this.props.mock});
        }
      }
      const mock = jest.fn();
      act(() => {
        render(h(App, {show: true, mock}), container);
      });
      act(() => {
        render(h(App, {show: false, mock}), container);
      });
      expect(mock).toBeCalled();
    });
  });

  describe('props', () => {
    test('props값을 이용한 렌더링', () => {
      class App extends Component {
        render() {
          return h('h1', null, this.props.message);
        }
      }
      render(h(App, {message: 'hi'}), container);
      expect(queryByText(container, 'hi')).not.toBeNull();
    });

    test('onClick 이벤트리스너', () => {
      class Counter extends Component {
        constructor(props) {
          super(props);

          this.state = {count: 0};
        }

        increment() {
          this.setState({
            count: this.state.count + 1,
          });
        }

        render() {
          return h('div', null,
            h('span', null, this.state.count),
            h('button', {onClick: this.increment.bind(this)}, 'click')
          );
        }
      }
      act(() => {
        render(h(Counter), container);
      });
      const button = getByText(container, 'click');

      act(() => {
        fireEvent.click(button);
      });
      expect(queryByText(container, '1')).not.toBeNull();
    });
  });
});
