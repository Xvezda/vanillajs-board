import { createElement } from './dom';

test('createElement', () => {
  expect(createElement('div')).toMatchObject({ type: 'div' });
});