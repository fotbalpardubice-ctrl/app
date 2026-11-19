-- Local SQLite schema for ML Work.
-- Business records use normalized tables; app_state keeps the revisioned screen snapshot.

CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee'
    CHECK (role IN ('admin','project_manager','foreman','technician','office','employee')),
  password_hash TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  hourly_rate REAL NOT NULL DEFAULT 0 CHECK (hourly_rate >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000),
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_lower_uq ON app_users (lower(email));

CREATE TABLE IF NOT EXISTS app_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);
CREATE INDEX IF NOT EXISTS app_sessions_user_expiry_idx ON app_sessions (user_id,expires_at);
CREATE INDEX IF NOT EXISTS app_sessions_expiry_idx ON app_sessions (expires_at);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  billing_address TEXT,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS clients_name_lower_uq ON clients(lower(name));

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  manager_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  manager_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Čeká na zahájení'
    CHECK (status IN ('Probíhá','Čeká na zahájení','Dokončeno','Pozastaveno')),
  starts_on TEXT,
  due_on TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000),
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);
CREATE INDEX IF NOT EXISTS projects_status_due_idx ON projects(status,due_on);
CREATE INDEX IF NOT EXISTS projects_client_idx ON projects(client_id);

CREATE TABLE IF NOT EXISTS project_assignments (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  hourly_rate REAL NOT NULL DEFAULT 0 CHECK (hourly_rate >= 0),
  assigned_by TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  assigned_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000),
  PRIMARY KEY(project_id,user_id)
);
CREATE INDEX IF NOT EXISTS project_assignments_user_idx ON project_assignments(user_id,project_id);

CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Ostatní',
  unit TEXT NOT NULL,
  stock REAL NOT NULL DEFAULT 0 CHECK (stock >= 0),
  minimum_stock REAL NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  unit_price REAL NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  purchase_unit_price REAL NOT NULL DEFAULT 0 CHECK (purchase_unit_price >= 0),
  location TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000),
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);
CREATE INDEX IF NOT EXISTS materials_category_name_idx ON materials(category,lower(name));
CREATE INDEX IF NOT EXISTS materials_low_stock_idx ON materials(stock,minimum_stock) WHERE is_active=1;

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  project_id TEXT REFERENCES projects(id) ON DELETE RESTRICT,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('receipt','delivery','adjustment')),
  direction TEXT NOT NULL DEFAULT 'in' CHECK (direction IN ('in','out')),
  quantity REAL NOT NULL CHECK (quantity > 0),
  note TEXT NOT NULL DEFAULT '',
  created_by TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);
CREATE INDEX IF NOT EXISTS stock_movements_material_date_idx ON stock_movements(material_id,created_at DESC);
CREATE INDEX IF NOT EXISTS stock_movements_project_date_idx ON stock_movements(project_id,created_at DESC);

CREATE TABLE IF NOT EXISTS delivery_notes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  delivery_date TEXT NOT NULL,
  issued_by TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  received_by TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Vydáno' CHECK (status IN ('Vydáno','Stornováno')),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);
CREATE INDEX IF NOT EXISTS delivery_notes_project_date_idx ON delivery_notes(project_id,delivery_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS delivery_notes_id_project_uq ON delivery_notes(id,project_id);

CREATE TABLE IF NOT EXISTS delivery_items (
  id TEXT PRIMARY KEY,
  delivery_note_id TEXT NOT NULL REFERENCES delivery_notes(id) ON DELETE CASCADE,
  material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit_price REAL NOT NULL CHECK (unit_price >= 0),
  UNIQUE(delivery_note_id,material_id)
);
CREATE INDEX IF NOT EXISTS delivery_items_material_idx ON delivery_items(material_id,delivery_note_id);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  delivery_note_id TEXT NOT NULL UNIQUE REFERENCES delivery_notes(id) ON DELETE RESTRICT,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  issued_on TEXT NOT NULL,
  due_on TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Neuhrazeno' CHECK (status IN ('Neuhrazeno','Uhrazeno','Stornováno')),
  currency TEXT NOT NULL DEFAULT 'CZK' CHECK (length(currency)=3),
  subtotal REAL NOT NULL CHECK (subtotal >= 0),
  tax_rate REAL NOT NULL DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  tax_amount REAL NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total REAL NOT NULL CHECK (total >= 0),
  created_by TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000),
  FOREIGN KEY(delivery_note_id,project_id) REFERENCES delivery_notes(id,project_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS invoices_status_due_idx ON invoices(status,due_on);
CREATE INDEX IF NOT EXISTS invoices_project_date_idx ON invoices(project_id,issued_on DESC);

CREATE TABLE IF NOT EXISTS supplier_receipts (
  id TEXT PRIMARY KEY,
  supplier TEXT NOT NULL DEFAULT '',
  supplier_document_number TEXT NOT NULL DEFAULT '',
  received_on TEXT NOT NULL,
  destination TEXT NOT NULL DEFAULT 'pending' CHECK (destination IN ('pending','warehouse','project')),
  project_id TEXT REFERENCES projects(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'Čeká na kontrolu' CHECK (status IN ('Čeká na kontrolu','Potvrzeno','Ignorováno')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','email')),
  source_email_id TEXT,
  source_email_from TEXT NOT NULL DEFAULT '',
  source_email_subject TEXT NOT NULL DEFAULT '',
  source_email_date TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_by TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);
CREATE INDEX IF NOT EXISTS supplier_receipts_status_date_idx ON supplier_receipts(status,received_on DESC);

CREATE TABLE IF NOT EXISTS supplier_receipt_items (
  id TEXT PRIMARY KEY,
  supplier_receipt_id TEXT NOT NULL REFERENCES supplier_receipts(id) ON DELETE CASCADE,
  material_id TEXT REFERENCES materials(id) ON DELETE RESTRICT,
  material_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Přijaté dodávky',
  unit TEXT NOT NULL DEFAULT 'ks',
  quantity REAL NOT NULL CHECK (quantity > 0),
  purchase_unit_price REAL NOT NULL DEFAULT 0 CHECK (purchase_unit_price >= 0)
);
CREATE INDEX IF NOT EXISTS supplier_receipt_items_material_idx ON supplier_receipt_items(material_id,supplier_receipt_id);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  work_date TEXT NOT NULL,
  clock_in TEXT NOT NULL,
  clock_out TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_by TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);
CREATE INDEX IF NOT EXISTS attendance_user_date_idx ON attendance(user_id,work_date DESC);
CREATE INDEX IF NOT EXISTS attendance_project_date_idx ON attendance(project_id,work_date DESC);

CREATE TABLE IF NOT EXISTS access_requests (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  requested_role TEXT NOT NULL DEFAULT 'employee',
  status TEXT NOT NULL DEFAULT 'Nová' CHECK (status IN ('Nová','Schváleno','Zamítnuto')),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000),
  reviewed_by TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  reviewed_at INTEGER
);
CREATE INDEX IF NOT EXISTS access_requests_status_date_idx ON access_requests(status,created_at DESC);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);
CREATE INDEX IF NOT EXISTS activity_log_date_idx ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_log_project_date_idx ON activity_log(project_id,created_at DESC);

CREATE TABLE IF NOT EXISTS app_state (
  state_key TEXT PRIMARY KEY DEFAULT 'main' CHECK (state_key='main'),
  payload TEXT NOT NULL DEFAULT '{}',
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_by TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER)*1000)
);
