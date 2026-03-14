const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 3000;

const rootDir = path.join(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const uploadsDir = path.join(rootDir, 'uploads');
const dbFile = path.join(dataDir, 'db.json');
const browserDistDir = path.join(rootDir, 'dist', 'arcs-and-spaces-backoffice', 'browser');

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${timestamp}-${safeName}`);
  }
});

const upload = multer({ storage });

function readDb() {
  const raw = fs.readFileSync(dbFile, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(nextDb) {
  fs.writeFileSync(dbFile, JSON.stringify(nextDb, null, 2));
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function withProjectName(projects, item) {
  const project = projects.find((entry) => entry.id === item.projectId);
  return {
    ...item,
    projectName: project ? project.name : 'Unassigned'
  };
}

app.get('/api/dashboard', (_req, res) => {
  const db = readDb();
  const totalProjects = db.projects.length;
  const ongoingProjects = db.projects.filter((item) => item.status === 'Ongoing').length;
  const completedProjects = db.projects.filter((item) => item.status === 'Completed').length;
  const planningProjects = db.projects.filter((item) => item.status === 'Planning').length;
  const activeWorkers = db.workers.filter((worker) => worker.attendanceStatus !== 'Absent').length;

  res.json({
    stats: {
      totalProjects,
      ongoingProjects,
      completedProjects,
      planningProjects,
      activeWorkers,
      totalAssets: db.assets.length
    },
    recentProjects: db.projects.slice().sort((a, b) => (a.startDate < b.startDate ? 1 : -1)).slice(0, 4),
    workerAllocation: db.projects.map((project) => ({
      projectId: project.id,
      projectName: project.name,
      count: db.workers.filter((worker) => worker.assignedProjectId === project.id).length
    }))
  });
});

app.get('/api/projects', (_req, res) => {
  const db = readDb();
  res.json(db.projects);
});

app.post('/api/projects', (req, res) => {
  const db = readDb();
  const project = { ...req.body, id: createId('proj') };
  db.projects.unshift(project);
  writeDb(db);
  res.status(201).json(project);
});

app.put('/api/projects/:id', (req, res) => {
  const db = readDb();
  const projectIndex = db.projects.findIndex((item) => item.id === req.params.id);

  if (projectIndex === -1) {
    return res.status(404).json({ message: 'Project not found' });
  }

  db.projects[projectIndex] = { ...db.projects[projectIndex], ...req.body, id: req.params.id };
  db.assets = db.assets.map((asset) =>
    asset.projectId === req.params.id
      ? { ...asset, projectName: db.projects[projectIndex].name }
      : asset
  );
  writeDb(db);
  return res.json(db.projects[projectIndex]);
});

app.delete('/api/projects/:id', (req, res) => {
  const db = readDb();
  const project = db.projects.find((item) => item.id === req.params.id);

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  db.projects = db.projects.filter((item) => item.id !== req.params.id);
  db.workers = db.workers.map((worker) =>
    worker.assignedProjectId === req.params.id
      ? { ...worker, assignedProjectId: '', attendanceStatus: 'Unassigned' }
      : worker
  );
  db.assets = db.assets.filter((asset) => asset.projectId !== req.params.id);
  writeDb(db);
  return res.status(204).send();
});

app.get('/api/workers', (_req, res) => {
  const db = readDb();
  res.json(db.workers.map((worker) => withProjectName(db.projects, worker)));
});

app.post('/api/workers', (req, res) => {
  const db = readDb();
  const worker = { ...req.body, id: createId('wrk') };
  db.workers.unshift(worker);
  writeDb(db);
  res.status(201).json(withProjectName(db.projects, worker));
});

app.put('/api/workers/:id', (req, res) => {
  const db = readDb();
  const workerIndex = db.workers.findIndex((item) => item.id === req.params.id);

  if (workerIndex === -1) {
    return res.status(404).json({ message: 'Worker not found' });
  }

  db.workers[workerIndex] = { ...db.workers[workerIndex], ...req.body, id: req.params.id };
  writeDb(db);
  return res.json(withProjectName(db.projects, db.workers[workerIndex]));
});

app.delete('/api/workers/:id', (req, res) => {
  const db = readDb();
  const exists = db.workers.some((item) => item.id === req.params.id);

  if (!exists) {
    return res.status(404).json({ message: 'Worker not found' });
  }

  db.workers = db.workers.filter((item) => item.id !== req.params.id);
  writeDb(db);
  return res.status(204).send();
});

app.get('/api/assets', (_req, res) => {
  const db = readDb();
  res.json(db.assets.map((asset) => withProjectName(db.projects, asset)));
});

app.post('/api/assets/upload', upload.single('file'), (req, res) => {
  const db = readDb();
  const project = db.projects.find((item) => item.id === req.body.projectId);
  const asset = {
    id: createId('ast'),
    projectId: req.body.projectId,
    projectName: project ? project.name : 'Unassigned',
    fileName: req.file ? req.file.filename : req.body.originalName,
    originalName: req.file ? req.file.originalname : req.body.originalName,
    fileType: req.file ? (req.file.mimetype.startsWith('image/') ? 'Image' : 'Document') : req.body.fileType,
    category: req.body.category,
    description: req.body.description,
    uploadedAt: new Date().toISOString(),
    url: req.file ? `/uploads/${req.file.filename}` : req.body.url || ''
  };

  db.assets.unshift(asset);
  writeDb(db);
  res.status(201).json(asset);
});

app.delete('/api/assets/:id', (req, res) => {
  const db = readDb();
  const asset = db.assets.find((item) => item.id === req.params.id);

  if (!asset) {
    return res.status(404).json({ message: 'Asset not found' });
  }

  if (asset.url.startsWith('/uploads/')) {
    const filePath = path.join(uploadsDir, asset.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  db.assets = db.assets.filter((item) => item.id !== req.params.id);
  writeDb(db);
  return res.status(204).send();
});

if (fs.existsSync(browserDistDir)) {
  app.use(express.static(browserDistDir));

  app.get('*all', (_req, res) => {
    res.sendFile(path.join(browserDistDir, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Arcs and Spaces Interiors app running on http://localhost:${port}`);
});
