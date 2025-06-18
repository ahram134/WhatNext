const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Ganti dengan URI MongoDB Anda jika perlu, default ke lokal
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/todoapp';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Terhubung ke MongoDB');
}).catch(err => {
  console.error('Gagal koneksi MongoDB:', err);
  process.exit(1);
});

// Schema dan Model Todo
const todoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  deadline: { type: String, default: '' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  desc: { type: String, default: '' }
}, { timestamps: true });

const Todo = mongoose.model('Todo', todoSchema);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: Get all todos
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data' });
  }
});

// API: Add new todo
app.post('/api/todos', async (req, res) => {
  try {
    const todo = new Todo(req.body);
    await todo.save();
    res.status(201).json(todo);
  } catch (err) {
    res.status(400).json({ message: 'Gagal menambah tugas' });
  }
});

// API: Update todo by id (fix: gunakan $set)
app.put('/api/todos/:id', async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: 'Data untuk update tidak boleh kosong' });
  }
  try {
    const updated = await Todo.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Tugas tidak ditemukan' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Gagal update tugas' });
  }
});

// API: Delete todo by id
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const deleted = await Todo.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Tugas tidak ditemukan' });
    res.json({ message: 'Tugas dihapus' });
  } catch (err) {
    res.status(400).json({ message: 'Gagal hapus tugas' });
  }
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
