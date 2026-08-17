import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import axiosInstance from "../../api/axiosInstance";

const navGroups = [
  { items: [{ label: "Admin Dashboard", path: "/admin/dashboard" }] },
  {
    title: "MASTER DATA",
    items: [
      { label: "Items", path: "/admin/items" },
      { label: "Operations", path: "/admin/operations" },
      { label: "BOM", path: "/admin/bom" },
      { label: "Routing", path: "/admin/routing" },
      { label: "Users", path: "/admin/users" },
    ],
  },
];

const emptyForm = {
  name: "",
  userId: "",
  email: "",
  password: "",
  role: "operator",
  status: "active",
  assignedOperations: [],
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/users?limit=100");
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadOperations = async () => {
    try {
      const res = await axiosInstance.get("/operations/active/list");
      setOperations(res.data.operations || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUsers();
    loadOperations();
  }, []);

  const openAddForm = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name || "",
      userId: user.userId || "",
      email: user.email || "",
      password: "",
      role: user.role || "operator",
      status: user.status || "active",
      assignedOperations: (user.assignedOperations || []).map((op) => op._id || op),
    });
    setFormError("");
    setShowForm(true);
  };

  const toggleOperation = (opId) => {
    setForm((f) => {
      const has = f.assignedOperations.includes(opId);
      return {
        ...f,
        assignedOperations: has
          ? f.assignedOperations.filter((id) => id !== opId)
          : [...f.assignedOperations, opId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editingUser) {
        await axiosInstance.put(`/users/${editingUser._id}`, {
          name: form.name,
          userId: form.userId,
          email: form.email || undefined,
          role: form.role,
          status: form.status,
          assignedOperations: form.assignedOperations,
        });
      } else {
        await axiosInstance.post("/users", {
          name: form.name,
          userId: form.userId,
          email: form.email || undefined,
          password: form.password,
          role: form.role,
          assignedOperations: form.assignedOperations,
        });
      }
      setShowForm(false);
      loadUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete user "${user.name}"?`)) return;
    try {
      await axiosInstance.delete(`/users/${user._id}`);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const roleLabel = (role) => role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <button
          onClick={openAddForm}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          + Add User
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">User ID</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Assigned Operations</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-400">No users yet.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="border-t align-top">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.userId}</td>
                  <td className="px-4 py-3">{roleLabel(user.role)}</td>
                  <td className="px-4 py-3 max-w-xs">
                    {user.role !== "operator" ? (
                      <span className="text-slate-400">—</span>
                    ) : (user.assignedOperations || []).length === 0 ? (
                      <span className="text-slate-400">None</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {user.assignedOperations.map((op) => (
                          <span
                            key={op._id}
                            className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs"
                          >
                            {op.operationCode}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {roleLabel(user.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-3">
                    <button onClick={() => openEditForm(user)} className="text-blue-600 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(user)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-bold mb-4">{editingUser ? "Edit User" : "Add User"}</h2>

            {formError && (
              <div className="bg-red-50 text-red-600 text-sm p-2 rounded mb-3">{formError}</div>
            )}

            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">User ID</label>
            <input
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              required
              placeholder="e.g. operator1"
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">Email (optional)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">
              Password {editingUser && <span className="text-xs text-slate-400">(use Reset Password to change)</span>}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editingUser}
              disabled={!!editingUser}
              className="w-full border rounded px-3 py-2 mb-3 disabled:bg-slate-100"
            />

            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border rounded px-3 py-2 mb-3"
            >
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="operator">Operator</option>
            </select>

            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border rounded px-3 py-2 mb-3"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {form.role === "operator" && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Assigned Operations
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    (shown as tiles on this operator's dashboard)
                  </span>
                </label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto grid grid-cols-2 gap-1.5">
                  {operations.length === 0 ? (
                    <p className="text-xs text-slate-400 col-span-2">No active operations found.</p>
                  ) : (
                    operations.map((op) => (
                      <label key={op._id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.assignedOperations.includes(op._id)}
                          onChange={() => toggleOperation(op._id)}
                        />
                        <span>{op.operationCode} — {op.operationName}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {form.assignedOperations.length} of {operations.length} selected
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}