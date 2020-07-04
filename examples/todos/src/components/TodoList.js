import React from "react";
import { useSelector } from "../flex-reducer";
import Todo from "./Todo";
import { VISIBILITY_FILTERS } from "../constants";

function getFilteredTodos(todos, filter) {
  const todosArr = Object.keys(todos).map(id => ({ ...todos[id], id }));
  if (filter === VISIBILITY_FILTERS.ALL) return todosArr;
  if (filter === VISIBILITY_FILTERS.COMPLETED) {
    return todosArr.filter(todo => todo.completed);
  } else {
    return todosArr.filter(todo => !todo.completed);
  }
}

const TodoList = React.memo(() => {
  const { todos, filter } = useSelector(state => state.app);
  const filteredTodos = getFilteredTodos(todos, filter);

  return (
    <ul className="todo-list">
      {filteredTodos && filteredTodos.length
        ? filteredTodos.map((todo, index) =>
            <Todo
              key={`todo-${todo.id}`}
              todo={todo}
            />
          )
        : "No todos, yay!"}
    </ul>
  );
});

export default TodoList;
