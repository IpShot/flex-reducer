# flex-reducer

> Inspired by Redux and React Hooks

Flexible reducer for a React app data management. Use it in a component as a regular [useReducer](https://reactjs.org/docs/hooks-reference.html#usereducer) react hook. Its data will be available for all other components via [useSelector](https://react-redux.js.org/next/api/hooks#useselector) hook until the owner component unmounted.

### Advantages over Redux.
- No global store data available at any time for any component not related to.
- Allows to separate data for every logical page, no reducers combining.
- It doesn't use React context, no need to create and provide it.
- You can use dispatch out of a component.
- Small code base just about 120 lines you can figure out easily.

## Interface
```
// useFlexReducer
const [state, dispatch] = useFlexReducer('app', reducer, initialState);
const todos = state.todos;

// useSelector (equality function is optional)
const todos = useSelector(state => state.app.todos, equalityFn?)
```

## How to use
``` 
// index.js
import TodoApp from "./TodoApp";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <TodoApp />,
  rootElement
);

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
};

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
```