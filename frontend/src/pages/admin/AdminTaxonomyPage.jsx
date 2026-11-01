import { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Modal from "react-bootstrap/Modal";
import Badge from "react-bootstrap/Badge";
import AdminLayout from "../../components/admin/AdminLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorAlert from "../../components/common/ErrorAlert";
import EmptyState from "../../components/common/EmptyState";
import { adminTaxonomyApi } from "../../services/adminApi";

const emptyPrimaryForm = { name: "", slug: "" };
const emptySecondaryForm = {
  primary_category_id: "",
  name: "",
  slug: "",
  home_page_visibility: true,
};
const emptySubtypeForm = { category_id: "", name: "", slug: "" };

function EditCategoryModal({ category, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: category.name,
    slug: category.slug,
    home_page_visibility: category.home_page_visibility,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await adminTaxonomyApi.updateCategory(category.id, form);
      onSaved(updated);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show onHide={onClose} centered>
      <Form onSubmit={handleSave}>
        <Modal.Header closeButton>
          <Modal.Title className="h5">
            Edit category — {category.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ErrorAlert error={error} />
          <Form.Group className="mb-3" controlId="edit-cat-name">
            <Form.Label className="small text-muted">Name</Form.Label>
            <Form.Control
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="edit-cat-slug">
            <Form.Label className="small text-muted">Slug</Form.Label>
            <Form.Control
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({ ...f, slug: e.target.value.trim() }))
              }
              required
            />
          </Form.Group>
          <Form.Check
            type="checkbox"
            id="edit-cat-visibility"
            label="Show on home page"
            checked={form.home_page_visibility}
            onChange={(e) =>
              setForm((f) => ({ ...f, home_page_visibility: e.target.checked }))
            }
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="dark" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default function AdminTaxonomyPage() {
  const [primaryCategories, setPrimaryCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [primaryForm, setPrimaryForm] = useState(emptyPrimaryForm);
  const [creatingPrimary, setCreatingPrimary] = useState(false);
  const [primaryError, setPrimaryError] = useState(null);

  const [secondaryForm, setSecondaryForm] = useState(emptySecondaryForm);
  const [creatingSecondary, setCreatingSecondary] = useState(false);
  const [secondaryError, setSecondaryError] = useState(null);

  const [subtypeForm, setSubtypeForm] = useState(emptySubtypeForm);
  const [creatingSubtype, setCreatingSubtype] = useState(false);
  const [subtypeError, setSubtypeError] = useState(null);

  const [editingCategory, setEditingCategory] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [toggleError, setToggleError] = useState(null);

  const load = () => {
    setLoading(true);
    adminTaxonomyApi
      .listPrimary()
      .then(setPrimaryCategories)
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const secondaryOptions = primaryCategories.flatMap((p) =>
    p.secondary_categories.map((c) => ({
      id: c.id,
      label: `${p.name} > ${c.name}`,
    })),
  );

  const applyCategoryUpdate = (updated) => {
    setPrimaryCategories((prev) =>
      prev.map((p) => ({
        ...p,
        secondary_categories: p.secondary_categories.map((c) =>
          c.id === updated.id ? { ...c, ...updated } : c,
        ),
      })),
    );
  };

  const handleCreatePrimary = async (e) => {
    e.preventDefault();
    setCreatingPrimary(true);
    setPrimaryError(null);
    try {
      const primary = await adminTaxonomyApi.createPrimary(primaryForm);
      setPrimaryCategories((prev) => [
        ...prev,
        { ...primary, secondary_categories: [] },
      ]);
      setPrimaryForm(emptyPrimaryForm);
    } catch (err) {
      setPrimaryError(err);
    } finally {
      setCreatingPrimary(false);
    }
  };

  const handleCreateSecondary = async (e) => {
    e.preventDefault();
    if (!secondaryForm.primary_category_id) {
      setSecondaryError({ message: "Choose a primary category first." });
      return;
    }
    setCreatingSecondary(true);
    setSecondaryError(null);
    try {
      const category = await adminTaxonomyApi.createCategory({
        ...secondaryForm,
        primary_category_id: Number(secondaryForm.primary_category_id),
      });
      setPrimaryCategories((prev) =>
        prev.map((p) =>
          p.id === category.primary_category_id
            ? {
                ...p,
                secondary_categories: [
                  ...p.secondary_categories,
                  { ...category, subtypes: [] },
                ],
              }
            : p,
        ),
      );
      setSecondaryForm(emptySecondaryForm);
    } catch (err) {
      setSecondaryError(err);
    } finally {
      setCreatingSecondary(false);
    }
  };

  const handleCreateSubtype = async (e) => {
    e.preventDefault();
    if (!subtypeForm.category_id) {
      setSubtypeError({ message: "Choose a category first." });
      return;
    }
    setCreatingSubtype(true);
    setSubtypeError(null);
    try {
      const subtype = await adminTaxonomyApi.createSubtype({
        ...subtypeForm,
        category_id: Number(subtypeForm.category_id),
      });
      setPrimaryCategories((prev) =>
        prev.map((p) => ({
          ...p,
          secondary_categories: p.secondary_categories.map((c) =>
            c.id === Number(subtypeForm.category_id)
              ? { ...c, subtypes: [...c.subtypes, subtype] }
              : c,
          ),
        })),
      );
      setSubtypeForm(emptySubtypeForm);
    } catch (err) {
      setSubtypeError(err);
    } finally {
      setCreatingSubtype(false);
    }
  };

  const handleToggleVisibility = async (category) => {
    setTogglingId(category.id);
    setToggleError(null);
    try {
      const updated = await adminTaxonomyApi.updateCategory(category.id, {
        name: category.name,
        slug: category.slug,
        home_page_visibility: !category.home_page_visibility,
      });
      applyCategoryUpdate(updated);
    } catch (err) {
      setToggleError(err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleEditSaved = (updated) => {
    applyCategoryUpdate(updated);
    setEditingCategory(null);
  };

  if (loading)
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <h1 className="h4 mb-4">Taxonomy</h1>
      <p className="text-muted">
        Manage the primary, secondary and subtype categories used across
        listings. Toggle "Show on home page" to control which secondary
        categories get their own section on the homepage.
      </p>
      <ErrorAlert error={error} onClose={() => setError(null)} />
      <ErrorAlert error={toggleError} onClose={() => setToggleError(null)} />

      <div className="d-flex flex-wrap gap-3 mb-4">
        <Card style={{ flex: "1 1 280px" }}>
          <Card.Header className="fw-semibold">
            Add primary category
          </Card.Header>
          <Card.Body>
            <ErrorAlert
              error={primaryError}
              onClose={() => setPrimaryError(null)}
            />
            <Form
              onSubmit={handleCreatePrimary}
              className="d-flex flex-column h-100"
            >
              <Form.Group className="mb-2" controlId="primary-name">
                <Form.Label className="small text-muted">Name</Form.Label>
                <Form.Control
                  value={primaryForm.name}
                  onChange={(e) =>
                    setPrimaryForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="primary-slug">
                <Form.Label className="small text-muted">Slug</Form.Label>
                <Form.Control
                  value={primaryForm.slug}
                  onChange={(e) =>
                    setPrimaryForm((f) => ({
                      ...f,
                      slug: e.target.value.trim(),
                    }))
                  }
                  required
                />
              </Form.Group>
              <div className="mt-auto d-flex justify-content-end">
                <Button
                  type="submit"
                  variant="dark"
                  size="sm"
                  disabled={creatingPrimary}
                >
                  {creatingPrimary ? "Adding…" : "Add primary category"}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        <Card style={{ flex: "1 1 280px" }}>
          <Card.Header className="fw-semibold">
            Add secondary category
          </Card.Header>
          <Card.Body>
            <ErrorAlert
              error={secondaryError}
              onClose={() => setSecondaryError(null)}
            />
            <Form
              onSubmit={handleCreateSecondary}
              className="d-flex flex-column h-100"
            >
              <Form.Group className="mb-2" controlId="secondary-primary">
                <Form.Label className="small text-muted">
                  Primary category
                </Form.Label>
                <Form.Select
                  value={secondaryForm.primary_category_id}
                  onChange={(e) =>
                    setSecondaryForm((f) => ({
                      ...f,
                      primary_category_id: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select…</option>
                  {primaryCategories.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2" controlId="secondary-name">
                <Form.Label className="small text-muted">Name</Form.Label>
                <Form.Control
                  value={secondaryForm.name}
                  onChange={(e) =>
                    setSecondaryForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-2" controlId="secondary-slug">
                <Form.Label className="small text-muted">Slug</Form.Label>
                <Form.Control
                  value={secondaryForm.slug}
                  onChange={(e) =>
                    setSecondaryForm((f) => ({
                      ...f,
                      slug: e.target.value.trim(),
                    }))
                  }
                  required
                />
              </Form.Group>
              <Form.Check
                className="mb-3"
                type="checkbox"
                id="secondary-visibility"
                label="Show on home page"
                checked={secondaryForm.home_page_visibility}
                onChange={(e) =>
                  setSecondaryForm((f) => ({
                    ...f,
                    home_page_visibility: e.target.checked,
                  }))
                }
              />
              <div className="mt-auto d-flex justify-content-end">
                <Button
                  type="submit"
                  variant="dark"
                  size="sm"
                  disabled={creatingSecondary}
                >
                  {creatingSecondary ? "Adding…" : "Add secondary category"}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        <Card style={{ flex: "1 1 280px" }}>
          <Card.Header className="fw-semibold">Add subtype</Card.Header>
          <Card.Body>
            <ErrorAlert
              error={subtypeError}
              onClose={() => setSubtypeError(null)}
            />
            <Form
              onSubmit={handleCreateSubtype}
              className="d-flex flex-column h-100"
            >
              <Form.Group className="mb-2" controlId="subtype-category">
                <Form.Label className="small text-muted">Category</Form.Label>
                <Form.Select
                  value={subtypeForm.category_id}
                  onChange={(e) =>
                    setSubtypeForm((f) => ({
                      ...f,
                      category_id: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select…</option>
                  {secondaryOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2" controlId="subtype-name">
                <Form.Label className="small text-muted">Name</Form.Label>
                <Form.Control
                  value={subtypeForm.name}
                  onChange={(e) =>
                    setSubtypeForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="subtype-slug">
                <Form.Label className="small text-muted">Slug</Form.Label>
                <Form.Control
                  value={subtypeForm.slug}
                  onChange={(e) =>
                    setSubtypeForm((f) => ({
                      ...f,
                      slug: e.target.value.trim(),
                    }))
                  }
                  required
                />
              </Form.Group>
              <div className="mt-auto d-flex justify-content-end">
                <Button
                  type="submit"
                  variant="dark"
                  size="sm"
                  disabled={creatingSubtype}
                >
                  {creatingSubtype ? "Adding…" : "Add subtype"}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>

      {primaryCategories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          message="Add a primary category above to get started."
        />
      ) : (
        primaryCategories.map((p) => (
          <Card className="mb-4" key={p.id}>
            <Card.Header className="fw-semibold d-flex justify-content-between align-items-center">
              <span>
                {p.name} <span className="text-muted small">({p.slug})</span>
              </span>
              <Badge bg="secondary">
                {p.secondary_categories.length} categories
              </Badge>
            </Card.Header>
            {p.secondary_categories.length === 0 ? (
              <Card.Body className="text-muted small">
                No secondary categories yet.
              </Card.Body>
            ) : (
              <Table hover responsive className="bg-white align-middle mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Subtypes</th>
                    <th>Home page</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {p.secondary_categories.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td className="text-muted small">{c.slug}</td>
                      <td>
                        {c.subtypes.length === 0 ? (
                          <span className="text-muted small">—</span>
                        ) : (
                          <div className="d-flex flex-wrap gap-1">
                            {c.subtypes.map((s) => (
                              <Badge
                                bg="light"
                                text="dark"
                                className="border fw-normal"
                                key={s.id}
                              >
                                {s.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <Form.Check
                          type="switch"
                          id={`visibility-${c.id}`}
                          checked={c.home_page_visibility}
                          disabled={togglingId === c.id}
                          onChange={() => handleToggleVisibility(c)}
                        />
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => setEditingCategory(c)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        ))
      )}

      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={handleEditSaved}
        />
      )}
    </AdminLayout>
  );
}
