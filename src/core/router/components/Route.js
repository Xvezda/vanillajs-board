import { createElement as h, Component } from '@/core';
import { Context } from '@/core/router/context';
import { matchPath } from '@/core/router/match';
import { cache } from '@/core/router/request';

export class Route extends Component {
  render() {
    return (
      h(Context.Consumer, null, context => {
        const match = matchPath(location.pathname, this.props);
        const component = this.props.component;
        if (context) {
          return (
            h(Context.Provider, {
                value: { ...context, match }
              },
              component ?
              h(component, {
                  match: match || context.match,
                  history: {
                    push: (location) => {
                      history.pushState({}, null, location);
                      context.router.forceUpdate();
                    },
                    replace: (location) => {
                      history.replaceState({}, null, location);
                      context.router.forceUpdate();
                    },
                    bust: (location) => {
                      cache.delete(location);
                    },
                  },
                  ...this.props.passedProps
                },
                ...this.props.passedProps.children
              ) :
              this.props.children[0]
            )
          );
        }
        return null;
      })
    );
  }
}

