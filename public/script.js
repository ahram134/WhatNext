const addBtn = document.getElementById('addBtn');
const todoInput = document.getElementById('todoInput');
const deadlineInput = document.getElementById('todoDeadline');
const prioritySelect = document.getElementById('todoPriority');
const descInput = document.getElementById('todoDesc');
const todoList = document.getElementById('todoList');
const filterButtons = document.querySelectorAll('.filter-btn');
const progressBar = document.getElementById('progressBar');
const stats = document.getElementById('stats');
const modal = document.getElementById('modalConfirm');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');
const darkToggle = document.getElementById('darkModeToggle');
const toast = document.getElementById('toast');

let todos = [];
let currentFilter = 'all';
let removeIndex = null;
let undoData = null;
let undoTimer = null;

// API base URL
const API_BASE = '/api/todos';

// Fetch semua todos dari server
async function fetchTodos() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Gagal memuat data');
    todos = await res.json();
    renderTodos(currentFilter);
  } catch (err) {
    showToast('Error memuat data: ' + err.message);
  }
}

// Simpan todo baru ke server
async function addTodoAPI(todo) {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo)
    });
    if (!res.ok) throw new Error('Gagal menambah tugas');
    const newTodo = await res.json();
    todos.unshift(newTodo); // tambah di depan
    renderTodos(currentFilter);
    showToast('Tugas ditambahkan!');
  } catch (err) {
    showToast('Error tambah tugas: ' + err.message);
  }
}

// Update todo di server
async function updateTodoAPI(id, updatedFields) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    });
    if (!res.ok) throw new Error('Gagal update tugas');
    const updatedTodo = await res.json();
    const index = todos.findIndex(t => t._id === id);
    if (index !== -1) {
      todos[index] = updatedTodo;
      renderTodos(currentFilter);
    }
  } catch (err) {
    showToast('Error update tugas: ' + err.message);
  }
}

// Hapus todo di server
async function deleteTodoAPI(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Gagal hapus tugas');
    todos = todos.filter(t => t._id !== id);
    renderTodos(currentFilter);
    showToast('Tugas dihapus!');
  } catch (err) {
    showToast('Error hapus tugas: ' + err.message);
  }
}

// Toast notification
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 1800);
}

// Render progress bar & stats
function updateProgressBar() {
  const total = todos.length;
  const done = todos.filter(t => t.completed).length;
  const percent = total ? (done / total) * 100 : 0;
  progressBar.style.width = percent + '%';
}
function updateStats() {
  const total = todos.length;
  const done = todos.filter(t => t.completed).length;
  const active = total - done;
  stats.textContent = `Total: ${total} | Aktif: ${active} | Selesai: ${done}`;
}

// Render todos
function renderTodos(filter = 'all') {
  todoList.innerHTML = '';

  let filteredTodos = todos;
  if (filter === 'active') filteredTodos = todos.filter(todo => !todo.completed);
  else if (filter === 'completed') filteredTodos = todos.filter(todo => todo.completed);

  filteredTodos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.priority}`;
    if (todo.completed) li.classList.add('completed');

    // Main row: checkbox + text
    const todoText = document.createElement('div');
    todoText.className = 'todo-text';

    const mainRow = document.createElement('div');
    mainRow.className = 'todo-main';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => {
      updateTodoAPI(todo._id, { completed: checkbox.checked });
    });

    const span = document.createElement('span');
    span.textContent = todo.text;

    mainRow.appendChild(checkbox);
    mainRow.appendChild(span);

    todoText.appendChild(mainRow);

    // Catatan
    if (todo.desc && todo.desc.trim() !== '') {
      const desc = document.createElement('div');
      desc.className = 'todo-desc';
      desc.textContent = todo.desc;
      todoText.appendChild(desc);
    }

    // Deadline
    if (todo.deadline) {
      const deadlineSpan = document.createElement('div');
      deadlineSpan.className = 'todo-deadline';
      deadlineSpan.textContent = `Deadline: ${todo.deadline}`;
      todoText.appendChild(deadlineSpan);
    }

    // Tombol hapus (pakai modal konfirmasi)
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Hapus';
    removeBtn.addEventListener('click', () => {
      removeIndex = todo._id;
      modal.style.display = 'flex';
    });

    li.appendChild(todoText);
    li.appendChild(removeBtn);
    todoList.appendChild(li);
  });

  updateProgressBar();
  updateStats();
}

// Tambah todo
addBtn.addEventListener('click', () => {
  const task = todoInput.value.trim();
  const deadline = deadlineInput.value;
  const priority = prioritySelect.value;
  const desc = descInput.value.trim();
  if (task === '') {
    showToast('Tolong masukkan tugas!');
    todoInput.focus();
    return;
  }
  addTodoAPI({ text: task, completed: false, deadline, priority, desc });
  todoInput.value = '';
  deadlineInput.value = '';
  prioritySelect.value = 'medium';
  descInput.value = '';
  todoInput.focus();
});
todoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addBtn.click();
});
descInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addBtn.click();
});

// Filter
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentFilter = button.dataset.filter;
    renderTodos(currentFilter);
  });
});

// Modal konfirmasi hapus
confirmYes.onclick = () => {
  if (removeIndex !== null) {
    deleteTodoAPI(removeIndex);
    removeIndex = null;
  }
  modal.style.display = 'none';
};
confirmNo.onclick = () => {
  modal.style.display = 'none';
  removeIndex = null;
};
window.onclick = (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
    removeIndex = null;
  }
};

// Dark mode toggle
darkToggle.onclick = function() {
  document.body.classList.toggle('dark');
  darkToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  localStorage.setItem('darkMode', document.body.classList.contains('dark') ? 'true' : 'false');
  showToast(document.body.classList.contains('dark') ? 'Mode gelap aktif' : 'Mode terang aktif');
};
// Load dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
  darkToggle.textContent = '☀️';
}

// Notifikasi deadline (opsional)
function checkDeadlines() {
  const now = new Date();
  todos.forEach(todo => {
    if (!todo.completed && todo.deadline) {
      const deadlineDate = new Date(todo.deadline);
      const diff = deadlineDate - now;
      if (diff > 0 && diff < 60 * 60 * 1000) {
        if (Notification.permission === 'granted') {
          new Notification('Pengingat Tugas', {
            body: `Tugas "${todo.text}" akan berakhir pada ${todo.deadline}`
          });
        }
      }
    }
  });
}
if ('Notification' in window) {
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}
setInterval(checkDeadlines, 60000);

// Inisialisasi
fetchTodos();
