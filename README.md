# Flex Reducer

> Inspired by Redux and React Hooks

[![Build Status](https://travis-ci.com/IpShot/flex-reducer.svg?branch=master)](https://travis-ci.com/IpShot/flex-reducer)
[![npm version](https://img.shields.io/npm/v/flex-reducer.svg?style=flat-square)](https://www.npmjs.com/package/flex-reducer)
[![codecov](https://codecov.io/gh/IpShot/flex-reducer/branch/master/graph/badge.svg)](https://codecov.io/gh/IpShot/flex-reducer)

React Hooks based app state manager. Use it in a component as a regular [useReducer](https://reactjs.org/docs/hooks-reference.html#usereducer) react hook. Its data will be available for all other components via [useSelector](https://react-redux.js.org/next/api/hooks#useselector) hook until the reducer owner component (where `useReducer` was called) unmounted. You can use multiple `useFlexReducer` and `useSelector` hooks without extra renders.

### Advantages over Redux.
- No global store data always alavailable for any component not related to.
- Allows to separate data for every logical page, no reducers combining.
- It doesn't use React context, no need to create and provide it.
- You can use dispatch out of a component.
- Small code base just about 130 lines you can figure out easily.

## Installation

Flex Reducer requires **React 16.8.3 or later**.

```sh
# If you use npm:
npm install flex-reducer

# Or if you use Yarn:
yarn add flex-reducer
```

## Usage
```js
import { useFlexReducer, useSelector, dispatch } from 'flex-reducer';

// useFlexReducer
const [state, dispatch] = useFlexReducer('app', reducer, initialState);
const todos = state.todos;

// useSelector (equality function is optional)
const todos = useSelector(state => state.app.todos, equalityFn?);

// dispatch (you can use it right in action definition)
const updateAction = (payload) => dispatch({
  type: 'UPDATE',
  payload,
});
```

You can use multiple `useFlexReducer` to separate your app data and take it via `useSelector` by its reducer name. Let's say a user data should be global and available for every page. Just call `useFlexReducer('user', reducer, initialState)` in your root component and you can use its data in every page component like `const user = useSelector(state => state.user)`. On a user's action dispatch the `useFlexReducer` and `useSelector` will call rerender of its components. It is very possible that every page also has its own data, just use `useFlexReducer('pageName',...)` in every page component and its data will be available only if the page has been rendered. This approach allows to avoid using wrong/outdated data from the page/component which isn't at work or mistakenly change its data.

## Example
```js
// index.js
import TodoApp from "./TodoApp";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <TodoApp />,
  rootElement
);

// TodoApp.js
import { useFlexReducer } from 'flex-reducer';
import AddTodo from './AddTodo';
import TodoList from './TodoList';
import { setInput } from './actions';

export default function TodoApp() {
  const [state] = useFlexReducer('app', reducer, initialState);
  return (
    <div className="todo-app">
      <h1>{state.title}</h1>
      <input value={state.input} onChange={e => setInput(e.target.value)} />
      <AddTodo />
      <TodoList />
    </div>
  );
}

// AddTodo.js
import { useSelector } from 'flex-reducer';
import { addTodo, setInput } from "./actions";

const genId = () => Math.rand();

export default const AddTodo = () => {
  const content = useSelector(state => state.app.input);
  function handleAddTodo() {
    if (content) {
      addTodo({ id: genId(), content });
      setInput('');
    }
  }
  return (
      <button onClick={handleAddTodo}>
        Add Todo
      </button>
  );
}

// actions.js
import { dispatch } from 'flex-reducer';

export const SET_INPUT = 'SET_INPUT';
export const ADD_TODO = 'ADD_TODO';

export const setInput = (value) => dispatch({
  type: SET_INPUT,
  payload: value
});
export const addTodo = (id, content) => dispatch({
  type: ADD_TODO,
  payload: { id, content }
});
```

 For more detailed example check [todos app](https://github.com/IpShot/flex-reducer/tree/master/examples/todos).

## License

[MIT](LICENSE.md)
