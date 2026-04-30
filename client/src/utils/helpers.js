export const groupTasksByStatus = (tasks) => {
  const map = {
    Backlog: [],
    "To Do": [],
    "In Progress": [],
    Review: [],
    Done: [],
  };

  tasks.forEach((task) => {
    const key = task.status in map ? task.status : "Backlog";
    map[key].push(task);
  });

  return map;
};

export const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};
