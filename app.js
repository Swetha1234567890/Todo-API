const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
let db = null;

const initializeDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDB();

const hasPriorityAndStatus = (requestQuery) => {
  return;
  requestQuery.priority !== undefined && requestQuery.status !== undefined;
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";

  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE search_q = '%%'
      AND priority = '${priority}' AND status = '${status}';`;
      break;
    case hasPriority(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
      AND priority = '${priority}';`;
      break;
    case hasStatus(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
      AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      break;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoIdQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const todoIdArray = await db.get(getTodoIdQuery);
  response.send(todoIdArray);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodoQuery = `INSERT INTO todo (id, todo, priority, status)
    VALUES (${id}, '${todo}', '${priority}', '${status}');`;
  const todoArray = await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateValues = "";
  const values = request.body;
  switch (true) {
    case values.status !== undefined:
      updateValues = "Status";
      break;
    case values.priority !== undefined:
      updateValues = "Priority";
      break;
    case values.todo !== undefined:
      updateValues = "Todo";
      break;
  }
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const updateTodoQuery = `UPDATE todo SET todo = '${todo}', priority = '${priority}',
  status = '${status}' WHERE id = ${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateValues} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  const deleteArray = await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
