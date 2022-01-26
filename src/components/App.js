import {
  createElement as h, Component,
  Router,
  Switch,
  Route 
} from '@/core';
import { urlFor } from '@/helper';

import { ListPage } from './ListPage';
import { WritePage } from './WritePage';
import { ReadPage } from './ReadPage';

export class App extends Component {
  render() {
    return (
      h(Router, null,
        h(Switch, null,
          h(Route, {
              path: urlFor({ type: 'list' }),
              exact: true
            },
            h(ListPage)
          ),
          h(Route, {
              path: urlFor({ type: 'write' }),
              exact: true
            },
            h(WritePage)
          ),
          h(Route, {
              path: urlFor({ type: 'read', payload: { id: ':id' }}),
              exact: true
            },
            h(ReadPage)
          ),
          h(Route, null, ':)')
        )
      )
    );
  }
}
