// @ts-nocheck
// Todo App - Dynamic UI
// You can ask Copilot to modify this UI!
// Note: This file is compiled at runtime with the component scope,
// so useState, useEffect, Card, Button, etc. are provided dynamically.

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Fetch todos on mount
  useEffect(() => {
    loadTodos();
  }, [filterCategory]);

  const loadTodos = async () => {
    setLoading(true);
    try {
      const url = filterCategory 
        ? `/api/samples/todos?category=${filterCategory}`
        : "/api/samples/todos";
      const data = await fetchAPI(url);
      setTodos(data.todos || []);
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Failed to load todos:", err);
    }
    setLoading(false);
  };

  const addTodo = async () => {
    if (!newTitle.trim() || !newCategory.trim()) return;
    
    await fetchAPI("/api/samples/todos", {
      method: "POST",
      body: { title: newTitle, category: newCategory }
    });
    
    setNewTitle("");
    setNewCategory("");
    loadTodos();
  };

  const toggleTodo = async (id, completed) => {
    await fetchAPI("/api/samples/todos", {
      method: "PATCH",
      body: { id, completed: !completed }
    });
    loadTodos();
  };

  const deleteTodo = async (id) => {
    await fetchAPI(`/api/samples/todos?id=${id}`, { method: "DELETE" });
    loadTodos();
  };

  if (loading) {
    return (
      <Card>
        <Flex justify="center" align="center" className="py-8">
          <Spinner size="lg" />
        </Flex>
      </Card>
    );
  }

  return (
    <Flex direction="col" gap={6}>
      <Header level={1}>Todo App</Header>
      
      {/* Add Todo Form */}
      <Card title="Add New Todo">
        <Flex direction="col" gap={4}>
          <Input
            value={newTitle}
            onChange={setNewTitle}
            placeholder="What needs to be done?"
          />
          <Flex gap={2}>
            <Input
              value={newCategory}
              onChange={setNewCategory}
              placeholder="Category (e.g., work, personal)"
            />
            <Button onClick={addTodo} variant="primary">
              Add
            </Button>
          </Flex>
        </Flex>
      </Card>

      {/* Filter */}
      <Card>
        <Flex align="center" gap={4}>
          <span className="text-gray-700 dark:text-gray-300">Filter by:</span>
          <Select
            value={filterCategory}
            onChange={setFilterCategory}
            placeholder="All categories"
            options={categories.map(c => ({ value: c, label: c }))}
          />
          {filterCategory && (
            <Button variant="secondary" size="sm" onClick={() => setFilterCategory("")}>
              Clear
            </Button>
          )}
        </Flex>
      </Card>

      {/* Todo List */}
      <Card title={`Todos (${todos.length})`}>
        {todos.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No todos found. Add one above!
          </p>
        ) : (
          <List>
            {todos.map(todo => (
              <ListItem key={todo.id}>
                <Flex justify="between" align="center">
                  <Flex align="center" gap={3}>
                    <Checkbox
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id, todo.completed)}
                    />
                    <span className={todo.completed ? "line-through text-gray-400" : ""}>
                      {todo.title}
                    </span>
                    <Badge color={todo.completed ? "green" : "blue"}>
                      {todo.category}
                    </Badge>
                  </Flex>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    Delete
                  </Button>
                </Flex>
              </ListItem>
            ))}
          </List>
        )}
      </Card>
    </Flex>
  );
}
