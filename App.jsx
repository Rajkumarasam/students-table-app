import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 7;

const INITIAL_STUDENTS = [
  { id: 1, name: "Arjun Sharma",  email: "arjun.sharma@university.in",  age: 21 },
  { id: 2, name: "Priya Reddy",   email: "priya.reddy@university.in",   age: 22 },
  { id: 3, name: "Vikram Nair",   email: "vikram.nair@university.in",   age: 20 },
  { id: 4, name: "Sneha Patel",   email: "sneha.patel@university.in",   age: 23 },
  { id: 5, name: "Rahul Mehta",   email: "rahul.mehta@university.in",   age: 21 },
];

const EMPTY_FORM = { name: "", email: "", age: "" };

// Fixed skeleton widths — no Math.random() inside render
const SKELETON_WIDTHS = [
  { name: "62%", email: "71%", age: 28 },
  { name: "78%", email: "58%", age: 28 },
  { name: "55%", email: "80%", age: 28 },
  { name: "70%", email: "65%", age: 28 },
  { name: "83%", email: "73%", age: 28 },
];

// ─── Validate (needs students list for duplicate email check) ─────────────────

function validate(form, students, editId = null) {
  const errors = {};

  // Name
  if (!form.name.trim())
    errors.name = "Name is required";
  else if (form.name.trim().length < 2)
    errors.name = "Minimum 2 characters";

  // Email
  if (!form.email.trim())
    errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = "Enter a valid email address";
  else {
    // BUG FIX: duplicate email check — skip current record when editing
    const duplicate = students.find(
      (s) => s.email.toLowerCase() === form.email.trim().toLowerCase() && s.id !== editId
    );
    if (duplicate) errors.email = "This email is already registered";
  }

  // Age — must be present, integer, 16–60
  if (!form.age && form.age !== 0)
    errors.age = "Age is required";
  else if (isNaN(form.age))
    errors.age = "Age must be a number";
  else if (!Number.isInteger(Number(form.age)))   // BUG FIX: block decimals like 21.5
    errors.age = "Age must be a whole number";
  else if (Number(form.age) < 16 || Number(form.age) > 60)
    errors.age = "Age must be between 16 and 60";

  return errors;
}

// ─── Sub-components defined OUTSIDE App (no remount on every render) ──────────

// BUG FIX: SortIcon was inside App — moved outside
function SortIcon({ col, sortCol, sortDir }) {
  if (col !== sortCol)
    return <span style={{ opacity: 0.25, fontSize: 9 }}>↕</span>;
  return <span style={{ fontSize: 9, color: "var(--accent)" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
}

// BUG FIX: SkeletonRows was inside App AND used Math.random() — fixed both
function SkeletonRows() {
  return SKELETON_WIDTHS.map((w, i) => (
    <div className="skeleton-row" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
      <div className="skeleton-cell"><div className="skel" style={{ width: 16 }} /></div>
      <div className="skeleton-cell"><div className="skel" style={{ width: w.name }} /></div>
      <div className="skeleton-cell"><div className="skel" style={{ width: w.email }} /></div>
      <div className="skeleton-cell"><div className="skel" style={{ width: w.age, margin: "0 auto" }} /></div>
      <div className="skeleton-cell"><div className="skel" style={{ width: 70, margin: "0 auto" }} /></div>
    </div>
  ));
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:          #07080d;
    --surface:     #0e1018;
    --surface2:    #161923;
    --border:      #1e2535;
    --border2:     #252e42;
    --accent:      #4fffb0;
    --accent2:     #00c9ff;
    --danger:      #ff4d6d;
    --danger-dim:  rgba(255,77,109,0.12);
    --warn:        #ffd166;
    --text:        #e8eaf2;
    --text2:       #8b93a8;
    --text3:       #4d566a;
    --mono:        'Space Mono', monospace;
    --sans:        'Barlow', sans-serif;
    --radius:      8px;
    --tr:          0.18s cubic-bezier(0.4,0,0.2,1);
  }

  html, body, #root { height: 100%; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  /* APP */
  .app {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 40% at 50% -10%, rgba(79,255,176,0.07) 0%, transparent 70%),
      radial-gradient(ellipse 50% 30% at 90% 60%,  rgba(0,201,255,0.05) 0%, transparent 60%),
      var(--bg);
    padding-bottom: 80px;
  }

  /* HEADER */
  .header {
    border-bottom: 1px solid var(--border);
    padding: 18px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(14,16,24,0.92);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .header-logo { display: flex; align-items: center; gap: 12px; }
  .logo-badge {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--mono); font-weight: 700; font-size: 14px; color: #07080d;
  }
  .header h1 {
    font-family: var(--mono); font-size: 15px; font-weight: 700;
    letter-spacing: 0.08em; color: var(--text);
  }
  .header-sub {
    font-size: 11px; color: var(--text3); font-family: var(--mono);
    letter-spacing: 0.05em; margin-top: 2px;
  }
  .header-actions { display: flex; gap: 10px; align-items: center; }

  /* MAIN */
  .main { max-width: 1200px; margin: 0 auto; padding: 36px 40px; }

  /* STATS */
  .stats-row {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 14px; margin-bottom: 32px;
  }
  .stat-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 18px 22px;
    position: relative; overflow: hidden;
  }
  .stat-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  }
  .stat-card.green::before  { background: var(--accent); }
  .stat-card.blue::before   { background: var(--accent2); }
  .stat-card.yellow::before { background: var(--warn); }
  .stat-card.red::before    { background: var(--danger); }
  .stat-label {
    font-size: 10px; font-family: var(--mono); color: var(--text3);
    letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px;
  }
  .stat-value {
    font-size: 28px; font-family: var(--mono); font-weight: 700;
    color: var(--text); line-height: 1;
  }
  .stat-sub { font-size: 11px; color: var(--text3); margin-top: 4px; }

  /* TOOLBAR */
  .toolbar {
    display: flex; gap: 12px; align-items: center;
    margin-bottom: 20px; flex-wrap: wrap;
  }
  .search-wrap { position: relative; flex: 1; min-width: 220px; }
  .search-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    color: var(--text3); font-size: 13px; pointer-events: none; font-family: var(--mono);
  }
  .search-input {
    width: 100%; background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 10px 14px 10px 38px;
    color: var(--text); font-family: var(--sans); font-size: 13px; outline: none;
    transition: border-color var(--tr), box-shadow var(--tr);
  }
  .search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(79,255,176,0.08); }
  .search-input::placeholder { color: var(--text3); }

  /* BUTTONS */
  .btn {
    border: none; cursor: pointer; font-family: var(--sans); font-weight: 600;
    font-size: 12px; letter-spacing: 0.05em; border-radius: var(--radius);
    padding: 10px 18px; display: inline-flex; align-items: center; gap: 7px;
    transition: all var(--tr); white-space: nowrap; text-transform: uppercase;
  }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

  .btn-primary { background: var(--accent); color: #07080d; }
  .btn-primary:hover:not(:disabled) {
    background: #3de89c; transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(79,255,176,0.25);
  }
  .btn-secondary {
    background: var(--surface2); color: var(--text2); border: 1px solid var(--border2);
  }
  .btn-secondary:hover:not(:disabled) { background: var(--border2); color: var(--text); }
  .btn-ghost {
    background: transparent; color: var(--text2); border: 1px solid var(--border); padding: 8px 14px;
  }
  .btn-ghost:hover { border-color: var(--border2); color: var(--text); }
  .btn-danger {
    background: var(--danger-dim); color: var(--danger); border: 1px solid rgba(255,77,109,0.25);
  }
  .btn-danger:hover:not(:disabled) {
    background: rgba(255,77,109,0.2); box-shadow: 0 0 0 2px rgba(255,77,109,0.15);
  }
  .btn-icon {
    width: 32px; height: 32px; padding: 0; border-radius: 6px;
    font-size: 14px; justify-content: center; text-transform: none;
  }
  .btn-icon.edit {
    background: rgba(0,201,255,0.1); color: var(--accent2); border: 1px solid rgba(0,201,255,0.2);
  }
  .btn-icon.edit:hover { background: rgba(0,201,255,0.2); }
  .btn-icon.del {
    background: rgba(255,77,109,0.1); color: var(--danger); border: 1px solid rgba(255,77,109,0.2);
  }
  .btn-icon.del:hover { background: rgba(255,77,109,0.2); }

  /* TABLE */
  .table-wrap {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); overflow: hidden;
  }
  .table-header-row {
    display: grid; grid-template-columns: 44px 1fr 1.5fr 90px 110px;
    background: var(--surface2); border-bottom: 1px solid var(--border);
  }
  .th {
    padding: 12px 18px; font-family: var(--mono); font-size: 10px;
    letter-spacing: 0.1em; text-transform: uppercase; color: var(--text3);
    cursor: pointer; user-select: none; display: flex; align-items: center; gap: 6px;
    transition: color var(--tr); border-right: 1px solid var(--border);
  }
  .th:last-child { border-right: none; cursor: default; justify-content: center; }
  .th:hover:not(:last-child) { color: var(--text2); }
  .th.sorted { color: var(--accent); }

  .tr {
    display: grid; grid-template-columns: 44px 1fr 1.5fr 90px 110px;
    border-bottom: 1px solid var(--border);
    transition: background var(--tr);
    animation: rowIn 0.22s ease both;
  }
  .tr:last-child { border-bottom: none; }
  .tr:hover { background: rgba(255,255,255,0.018); }

  @keyframes rowIn {
    from { opacity: 0; transform: translateY(-5px); }
    to   { opacity: 1; transform: none; }
  }

  .td {
    padding: 14px 18px; font-size: 13px; color: var(--text);
    display: flex; align-items: center;
    border-right: 1px solid var(--border); overflow: hidden;
  }
  .td:last-child { border-right: none; }
  .td-num  { font-family: var(--mono); font-size: 11px; color: var(--text3); }
  .td-name { font-weight: 600; }
  .td-email {
    font-family: var(--mono); font-size: 11px; color: var(--text2);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .td-age  {
    font-family: var(--mono); font-size: 13px; font-weight: 700;
    color: var(--accent2); justify-content: center;
  }
  .td-actions { gap: 7px; justify-content: center; }

  .empty-state { padding: 64px 20px; text-align: center; color: var(--text3); }
  .empty-state-icon { font-size: 30px; margin-bottom: 12px; opacity: 0.5; }
  .empty-state-text { font-family: var(--mono); font-size: 12px; letter-spacing: 0.05em; }

  /* SKELETON */
  .skeleton-row {
    display: grid; grid-template-columns: 44px 1fr 1.5fr 90px 110px;
    border-bottom: 1px solid var(--border);
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
  .skeleton-cell {
    padding: 14px 18px; display: flex; align-items: center;
    border-right: 1px solid var(--border);
  }
  .skeleton-cell:last-child { border-right: none; }
  .skel { background: var(--border2); border-radius: 4px; height: 11px; }

  /* PAGINATION */
  .pagination {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 18px; padding: 0 2px;
  }
  .page-info { font-size: 11px; font-family: var(--mono); color: var(--text3); }
  .page-btns { display: flex; gap: 6px; align-items: center; }
  .page-btn {
    background: var(--surface); border: 1px solid var(--border); color: var(--text2);
    border-radius: 6px; width: 30px; height: 30px; font-size: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all var(--tr); font-family: var(--mono);
  }
  .page-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .page-btn.active { background: var(--accent); color: #07080d; border-color: var(--accent); font-weight: 700; }
  .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .page-ellipsis { color: var(--text3); font-family: var(--mono); font-size: 12px; padding: 0 2px; }

  /* MODAL */
  .overlay {
    position: fixed; inset: 0; background: rgba(7,8,13,0.8);
    backdrop-filter: blur(6px); z-index: 200;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: fadeIn 0.15s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .modal {
    background: var(--surface); border: 1px solid var(--border2);
    border-radius: 12px; width: 100%; max-width: 480px; overflow: hidden;
    animation: slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(18px) scale(0.97); }
    to   { opacity: 1; transform: none; }
  }
  .modal-header {
    padding: 22px 28px 20px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-title {
    font-family: var(--mono); font-size: 13px; font-weight: 700;
    letter-spacing: 0.08em; color: var(--accent);
  }
  .modal-subtitle { font-size: 11px; color: var(--text3); margin-top: 3px; font-family: var(--mono); }
  .modal-close {
    background: transparent; border: 1px solid var(--border); color: var(--text3);
    cursor: pointer; width: 28px; height: 28px; border-radius: 6px; font-size: 14px;
    display: flex; align-items: center; justify-content: center; transition: all var(--tr);
  }
  .modal-close:hover { background: var(--border2); color: var(--text); }
  .modal-body { padding: 24px 28px; }
  .modal-footer { padding: 8px 28px 24px; display: flex; gap: 10px; justify-content: flex-end; }

  /* FORM */
  .form-group { margin-bottom: 18px; }
  .form-label {
    display: block; font-size: 10px; font-family: var(--mono); letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--text3); margin-bottom: 7px;
  }
  .form-input {
    width: 100%; background: var(--bg); border: 1px solid var(--border2);
    border-radius: var(--radius); padding: 11px 14px; color: var(--text);
    font-family: var(--sans); font-size: 13px; outline: none;
    transition: border-color var(--tr), box-shadow var(--tr);
  }
  .form-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(79,255,176,0.08); }
  .form-input.error { border-color: var(--danger); }
  .form-input.error:focus { border-color: var(--danger); box-shadow: 0 0 0 3px rgba(255,77,109,0.1); }
  /* hide browser spin arrows on number input */
  .form-input[type=number]::-webkit-inner-spin-button,
  .form-input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .form-input[type=number] { -moz-appearance: textfield; }
  .form-error {
    margin-top: 5px; font-size: 11px; color: var(--danger);
    font-family: var(--mono); display: flex; align-items: center; gap: 5px;
  }

  /* DELETE MODAL */
  .delete-modal { max-width: 400px; }
  .delete-icon-wrap {
    width: 52px; height: 52px; background: var(--danger-dim);
    border: 1px solid rgba(255,77,109,0.3); border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin-bottom: 16px;
  }
  .delete-title { font-family: var(--mono); font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
  .delete-desc  { font-size: 13px; color: var(--text2); line-height: 1.6; }
  .delete-name  { color: var(--danger); font-weight: 600; }

  /* TOAST */
  .toast-container {
    position: fixed; bottom: 28px; right: 28px; z-index: 999;
    display: flex; flex-direction: column; gap: 8px; pointer-events: none;
  }
  .toast {
    background: var(--surface2); border: 1px solid var(--border2);
    border-left: 3px solid var(--accent); border-radius: var(--radius);
    padding: 12px 18px; font-size: 13px; color: var(--text);
    display: flex; align-items: center; gap: 10px; min-width: 260px;
    animation: toastIn 0.22s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow: 0 8px 30px rgba(0,0,0,0.4);
  }
  .toast.warn   { border-left-color: var(--warn); }
  .toast.danger { border-left-color: var(--danger); }
  @keyframes toastIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    .main   { padding: 24px 16px; }
    .header { padding: 14px 16px; }
    .header h1 { font-size: 13px; }
    .stats-row { grid-template-columns: 1fr 1fr; }
    .table-header-row,
    .tr,
    .skeleton-row { grid-template-columns: 36px 1fr 70px 90px; }
    /* hide email column on mobile */
    .th:nth-child(3),
    .td:nth-child(3),
    .skeleton-row .skeleton-cell:nth-child(3) { display: none; }
    .header-actions .btn-secondary { display: none; }
  }
`;

// ─── ID counter (module-level is fine — stable across renders) ────────────────
let nextId = INITIAL_STUDENTS.length + 1;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function App() {
  const [students,     setStudents]     = useState(INITIAL_STUDENTS);
  const [search,       setSearch]       = useState("");
  const [sortCol,      setSortCol]      = useState("id");
  const [sortDir,      setSortDir]      = useState("asc");
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(null); // null | "add" | "edit" | "delete"
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [errors,       setErrors]       = useState({});
  const [submitting,   setSubmitting]   = useState(false);
  const [toasts,       setToasts]       = useState([]);

  // Simulate initial data fetch
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);

  // ── Filtered + sorted data ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let data = [...students];
    const q = search.trim().toLowerCase();
    if (q) {
      data = data.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          String(s.age).includes(q)
      );
    }
    data.sort((a, b) => {
      let va = a[sortCol];
      let vb = b[sortCol];
      if (sortCol === "age") { va = Number(va); vb = Number(vb); }
      else { va = String(va).toLowerCase(); vb = String(vb).toLowerCase(); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
    return data;
  }, [students, search, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // BUG FIX: keep page in-bounds when filtered list shrinks (e.g. after delete or search)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const safePage = Math.min(page, totalPages);
  const pageData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const avgAge = students.length
    ? (students.reduce((s, x) => s + x.age, 0) / students.length).toFixed(1)
    : "—";

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3200);
  };

  // ── Sort ───────────────────────────────────────────────────────────────────
  const handleSort = (col) => {
    if (col === sortCol) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setModal("add");
  };

  const openEdit = (s) => {
    setEditTarget(s);
    setForm({ name: s.name, email: s.email, age: String(s.age) });
    setErrors({});
    setModal("edit");
  };

  const openDelete = (s) => {
    setDeleteTarget(s);
    setModal("delete");
  };

  // BUG FIX: closeModal now also resets submitting to prevent stuck state
  const closeModal = () => {
    if (submitting) return; // don't close mid-submit
    setModal(null);
    setErrors({});
    setEditTarget(null);
    setDeleteTarget(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    // Clear error for that field as user types
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleSubmitAdd = async () => {
    // BUG FIX: pass students list for duplicate email check, no editId
    const errs = validate(form, students, null);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600)); // simulate network
    setStudents((p) => [
      ...p,
      { id: nextId++, name: form.name.trim(), email: form.email.trim().toLowerCase(), age: Number(form.age) },
    ]);
    setSubmitting(false);
    setModal(null);
    setErrors({});
    setPage(1);
    showToast("✓ Student added successfully");
  };

  const handleSubmitEdit = async () => {
    // BUG FIX: pass editTarget.id so it doesn't flag its own email as duplicate
    const errs = validate(form, students, editTarget.id);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setStudents((p) =>
      p.map((s) =>
        s.id === editTarget.id
          ? { ...s, name: form.name.trim(), email: form.email.trim().toLowerCase(), age: Number(form.age) }
          : s
      )
    );
    setSubmitting(false);
    setModal(null);
    setErrors({});
    setEditTarget(null);
    showToast("✓ Student record updated");
  };

  const handleDelete = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    setStudents((p) => p.filter((s) => s.id !== deleteTarget.id));
    setSubmitting(false);
    setModal(null);
    setDeleteTarget(null);
    showToast("Student removed", "warn");
  };

  // ── Excel export ───────────────────────────────────────────────────────────
  const handleDownload = () => {
    // Export filtered rows if search is active, otherwise full list
    const source = search.trim() ? filtered : students;
    const data = source.map(({ name, email, age }) => ({
      Name: name,
      Email: email,
      Age: age,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    // Set column widths
    ws["!cols"] = [{ wch: 24 }, { wch: 34 }, { wch: 8 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "students_export.xlsx");
    showToast(`⬇ Exported ${data.length} record${data.length !== 1 ? "s" : ""}`);
  };

  // ── Pagination helpers ─────────────────────────────────────────────────────
  // BUG FIX: use safePage (not stale page state) for prev/next
  const goToPage  = (p) => setPage(Math.max(1, Math.min(p, totalPages)));
  const goPrev    = ()  => goToPage(safePage - 1);
  const goNext    = ()  => goToPage(safePage + 1);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("ellipsis-" + p);
      acc.push(p);
      return acc;
    }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className="app">

        {/* ── HEADER ── */}
        <header className="header">
          <div className="header-logo">
            <div className="logo-badge">S</div>
            <div>
              <h1>STUDENT_DB</h1>
              <div className="header-sub">/ admin / records</div>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={handleDownload}>
              ⬇ Export Excel
            </button>
            <button className="btn btn-primary" onClick={openAdd}>
              + Add Student
            </button>
          </div>
        </header>

        <main className="main">

          {/* ── STATS ── */}
          <div className="stats-row">
            <div className="stat-card green">
              <div className="stat-label">Total Students</div>
              <div className="stat-value">{students.length}</div>
              <div className="stat-sub">enrolled</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-label">Avg. Age</div>
              <div className="stat-value">{avgAge}</div>
              <div className="stat-sub">years</div>
            </div>
            <div className="stat-card yellow">
              <div className="stat-label">Showing</div>
              <div className="stat-value">{filtered.length}</div>
              <div className="stat-sub">{search.trim() ? "filtered" : "all records"}</div>
            </div>
            <div className="stat-card red">
              <div className="stat-label">Pages</div>
              <div className="stat-value">{totalPages}</div>
              <div className="stat-sub">{PAGE_SIZE} per page</div>
            </div>
          </div>

          {/* ── TOOLBAR ── */}
          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input
                className="search-input"
                placeholder="Search by name, email or age…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            {search && (
              <button className="btn btn-ghost" onClick={() => { setSearch(""); setPage(1); }}>
                ✕ Clear
              </button>
            )}
          </div>

          {/* ── TABLE ── */}
          <div className="table-wrap">
            <div className="table-header-row">
              <div className="th">#</div>
              <div className={`th ${sortCol === "name" ? "sorted" : ""}`} onClick={() => handleSort("name")}>
                Name <SortIcon col="name" sortCol={sortCol} sortDir={sortDir} />
              </div>
              <div className={`th ${sortCol === "email" ? "sorted" : ""}`} onClick={() => handleSort("email")}>
                Email <SortIcon col="email" sortCol={sortCol} sortDir={sortDir} />
              </div>
              <div
                className={`th ${sortCol === "age" ? "sorted" : ""}`}
                onClick={() => handleSort("age")}
                style={{ justifyContent: "center" }}
              >
                Age <SortIcon col="age" sortCol={sortCol} sortDir={sortDir} />
              </div>
              <div className="th">Actions</div>
            </div>

            <div className="table-body">
              {loading ? (
                <SkeletonRows />
              ) : pageData.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">◌</div>
                  <div className="empty-state-text">
                    {search.trim() ? "no_results_found" : "no_students_yet — click_+_add"}
                  </div>
                </div>
              ) : (
                pageData.map((s, i) => (
                  <div className="tr" key={s.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="td td-num">{(safePage - 1) * PAGE_SIZE + i + 1}</div>
                    <div className="td td-name">{s.name}</div>
                    <div className="td td-email" title={s.email}>{s.email}</div>
                    <div className="td td-age">{s.age}</div>
                    <div className="td td-actions">
                      <button className="btn btn-icon edit" title="Edit student"   onClick={() => openEdit(s)}>✎</button>
                      <button className="btn btn-icon del"  title="Delete student" onClick={() => openDelete(s)}>✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── PAGINATION ── */}
          {!loading && filtered.length > 0 && (
            <div className="pagination">
              <div className="page-info">
                {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </div>
              <div className="page-btns">
                {/* BUG FIX: uses goPrev/goNext which are based on safePage */}
                <button className="page-btn" disabled={safePage === 1}          onClick={goPrev}>‹</button>
                {pageNumbers.map((p, i) =>
                  String(p).startsWith("ellipsis") ? (
                    <span key={p} className="page-ellipsis">…</span>
                  ) : (
                    <button
                      key={p}
                      className={`page-btn ${p === safePage ? "active" : ""}`}
                      onClick={() => goToPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}
                <button className="page-btn" disabled={safePage === totalPages} onClick={goNext}>›</button>
              </div>
            </div>
          )}
        </main>

        {/* ── ADD / EDIT MODAL ── */}
        {(modal === "add" || modal === "edit") && (
          <div
            className="overlay"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div className="modal-title">
                    {modal === "add" ? "// NEW_STUDENT" : "// EDIT_RECORD"}
                  </div>
                  <div className="modal-subtitle">
                    {modal === "add" ? "Fill in all fields to register" : `Editing: ${editTarget?.name}`}
                  </div>
                </div>
                <button className="modal-close" onClick={closeModal} disabled={submitting}>✕</button>
              </div>

              <div className="modal-body">
                {/* Name */}
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    name="name"
                    className={`form-input ${errors.name ? "error" : ""}`}
                    placeholder="e.g. Arjun Sharma"
                    value={form.name}
                    onChange={handleFormChange}
                    autoFocus
                    autoComplete="off"
                  />
                  {errors.name && <div className="form-error">⚠ {errors.name}</div>}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    name="email"
                    type="text"          /* type="text" avoids browser auto-validation fighting ours */
                    inputMode="email"
                    className={`form-input ${errors.email ? "error" : ""}`}
                    placeholder="e.g. arjun@university.in"
                    value={form.email}
                    onChange={handleFormChange}
                    autoComplete="off"
                  />
                  {errors.email && <div className="form-error">⚠ {errors.email}</div>}
                </div>

                {/* Age */}
                <div className="form-group">
                  <label className="form-label">Age * (16–60)</label>
                  <input
                    name="age"
                    type="number"
                    className={`form-input ${errors.age ? "error" : ""}`}
                    placeholder="e.g. 21"
                    value={form.age}
                    onChange={handleFormChange}
                    min="16"
                    max="60"
                    step="1"
                  />
                  {errors.age && <div className="form-error">⚠ {errors.age}</div>}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={modal === "add" ? handleSubmitAdd : handleSubmitEdit}
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : modal === "add" ? "Add Student" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── DELETE MODAL ── */}
        {modal === "delete" && (
          <div
            className="overlay"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <div className="modal delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-body" style={{ padding: "28px 28px 12px" }}>
                <div className="delete-icon-wrap">🗑</div>
                <div className="delete-title">Confirm Deletion</div>
                <p className="delete-desc">
                  You are about to permanently remove{" "}
                  <span className="delete-name">{deleteTarget?.name}</span> from the records.
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
                  {submitting ? "Deleting…" : "Delete Student"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TOASTS ── */}
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.type}`}>
              {t.msg}
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
