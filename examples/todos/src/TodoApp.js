import React from "react";
import { useFlexReducer } from './flex-reducer';
import AddTodo from "./components/AddTodo";
import TodoList from "./components/TodoList";
import VisibilityFilters from "./components/VisibilityFilters";
import { VISIBILITY_FILTERS } from "./constants";
import { ADD_TODO, TOGGLE_TODO, SET_FILTER } from "./actions";
import "./styles.css";

const initialState = {
  __reducer__: 'app',
  todos: {},
  filter: VISIBILITY_FILTERS.ALL
};

const reducer = function(state, action) {
  switch (action.type) {
    case ADD_TODO: {
      const { id, content } = action.payload;
      return {
        ...state,
        todos: {
          ...state.todos,
          [id]: {
            content,
            completed: false
          }
        }
      };
    }
    case TOGGLE_TODO: {
      const { id } = action.payload;
      return {
        ...state,
        todos: {
          ...state.todos,
          [id]: {
            ...state.todos[id],
            completed: !state.todos[id].completed
          }
        }
      };
    }
    case SET_FILTER: {
      return {
        ...state,
        filter: action.payload.filter
      };
    }
    default:
      return state;
  }
}

export default function TodoApp() {
  const [state, dispatch] = useFlexReducer(reducer, initialState);
  return (
    <div className="todo-app">
      <h1>Todo List ({Object.keys(state.app.todos).length})</h1>
      <AddTodo />
      <TodoList />
      <VisibilityFilters />
    </div>
  );
}
