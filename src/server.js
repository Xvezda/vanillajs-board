const express = require('express');

const app = express();
app.use(express.json());

class FakeDB extends Map {
  constructor(...args) {
    super(...args);
    this._autoIncrement = 0;
  }

  set(name, value) {
    if (typeof value !== 'object')
      throw new TypeError(`value is not object`);

    const has = this.has(name);
    if (!has) {
      value.id = this._autoIncrement++;
      value.timestamp = Date.now();
    }
    return super.set(name, value);
  }
}

class ArticleModel extends FakeDB {
  constructor(...args) {
    super(...args);
    this.set('articles', []);
  }

  list() {
    return this.get('articles');
  }

  read(id) {
    return this.get(`articles:${id}`);
  }

  write(article) {
    this.get('articles').push(article);
    const id = this._autoIncrement;
    this.set(`articles:${id}`, article);
    return id;
  }

  modify(id, modified) {
    this.set('articles',
      this.get('articles')
        .map(article => article.id === Number(id) ? modified : article)
    );
    this.set(`articles:${id}`, modified);
  }

  remove(id) {
    this.set('articles', this.get('articles').filter(article => article.id !== Number(id)));
    this.delete(`articles:${id}`);
  }
}

const model = new ArticleModel();
/** FIXME */
model.write({ title: 'test', content: 'hi!', author: ':)' })
model.write({ title: 'hello', content: 'world', author: 'noob' });
model.write({ title: 'foo', content: 'bar', author: 'baz' });
/** FIXME */

const router = express.Router();
router.get('/articles', (req, res) => {
  res.json(model.list());
});

router.get('/articles/:id', (req, res) => {
  const article = model.read(req.params.id);
  if (!article) {
    res.status(404).json({message: 'not found'});
  } else {
    res.json(article);
  }
});

router.post('/articles', (req, res) => {
  const article = req.body;
  const id = model.write(article);

  res.status(201).json({message: 'created', id });
});

router.put('/articles/:id', (req, res) => {
  const id = req.params.id;
  const key = `articles:${id}`;

  if (!model.has(key)) {
    res.status(404).json({message: 'not found'});
  } else {
    const modifiedArticle = { ...model.get(key), ...req.body };
    model.modify(id, modifiedArticle);

    res.json({message: 'ok', id });
  }
});

router.delete('/articles/:id', (req, res) => {
  const id = req.params.id;
  if (!model.has(`articles:${id}`)) {
    res.status(404).json({status: 'not found'});
  } else {
    model.remove(id);

    res.json({status: 'ok'});
  }
});

app.use('/api', router);

const port = process.env.NODE_ENV === 'production' ? 3000 : 3001;
app.listen(port, () => console.log(`server listen at ${port}`));
