import React, { useEffect, useState } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    Table,
    Button,
    Spinner,
    Alert,
    Badge,
    Input,
} from "reactstrap";
import { Link } from "react-router-dom";
import { get, del } from "../../helpers/api_helper.jsx";

const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // -----------------------------
    // Load categories
    // -----------------------------
    const loadCategories = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await get("/product-categories");

            const list = res?.data || []; // Supabase returns data

            setCategories(list);
            setFilteredCategories(list);
        } catch (err) {
            setError("خطا در دریافت لیست دسته‌بندی‌ها");
        }

        setLoading(false);
    };

    useEffect(() => {
        loadCategories();
    }, []);

    // -----------------------------
    // Search Filter
    // -----------------------------
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredCategories(categories);
            return;
        }

        const s = searchTerm.toLowerCase();

        const filtered = categories.filter(
            (cat) =>
                (cat.name || "").toLowerCase().includes(s) ||
                (cat.slug || "").toLowerCase().includes(s)
        );

        setFilteredCategories(filtered);
    }, [searchTerm, categories]);

    // -----------------------------
    // Delete Category
    // -----------------------------
    const handleDelete = async (id, name) => {
        if (!window.confirm(`آیا از حذف دسته‌بندی "${name}" مطمئن هستید؟`)) return;

        try {
            await del(`/product-categories/${id}`);

            setCategories((prev) => prev.filter((c) => c.id !== id));
            setFilteredCategories((prev) => prev.filter((c) => c.id !== id));

            setSuccess(`دسته‌بندی "${name}" با موفقیت حذف شد`);
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            const status = err.response?.status;

            if (status === 409) {
                setError("این دسته‌بندی در حال استفاده است و امکان حذف ندارد.");
            } else if (status === 404) {
                setError("دسته‌بندی مورد نظر پیدا نشد.");
            } else {
                setError("خطا در حذف دسته‌بندی");
            }
        }
    };

    // -----------------------------
    // Parent Name Resolver
    // -----------------------------
    const getParentName = (parentId) => {
        if (!parentId) return "-";
        const parent = categories.find((c) => c.id === parentId);
        return parent ? parent.name : "-";
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {/* Breadcrumb */}
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 font-size-18">دسته‌بندی‌های کالا</h4>

                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    <Link to="/dashboard">داشبورد</Link>
                                </li>
                                <li className="breadcrumb-item active">دسته‌بندی‌ها</li>
                            </ol>
                        </div>
                    </div>

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardBody>
                                    {/* Header */}
                                    <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
                                        <div>
                                            <h4 className="card-title mb-1">لیست دسته‌بندی‌های کالا</h4>
                                            <p className="card-title-desc mb-0">
                                                مدیریت دسته‌بندی‌ها و زیرمجموعه‌ها
                                            </p>
                                        </div>

                                        <div className="d-flex flex-wrap gap-2">
                                            <Button
                                                color="light"
                                                onClick={loadCategories}
                                                disabled={loading}
                                            >
                                                <i className="bx bx-refresh me-1"></i>
                                                بروزرسانی
                                            </Button>

                                            <Link
                                                to="/inventory/add-category"
                                                className="btn btn-success"
                                            >
                                                <i className="bx bx-plus-circle me-1"></i>
                                                افزودن دسته‌بندی جدید
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Alerts */}
                                    {error && (
                                        <Alert
                                            color="danger"
                                            className="alert-dismissible fade show"
                                        >
                                            {error}
                                            <button
                                                type="button"
                                                className="btn-close"
                                                onClick={() => setError("")}
                                            ></button>
                                        </Alert>
                                    )}

                                    {success && (
                                        <Alert
                                            color="success"
                                            className="alert-dismissible fade show"
                                        >
                                            {success}
                                            <button
                                                type="button"
                                                className="btn-close"
                                                onClick={() => setSuccess("")}
                                            ></button>
                                        </Alert>
                                    )}

                                    {/* Search */}
                                    {!loading && categories.length > 0 && (
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <div className="search-box">
                                                    <div className="position-relative">
                                                        <Input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="جستجو بر اساس نام یا نامک..."
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                        />
                                                        <i className="bx bx-search-alt search-icon"></i>
                                                    </div>
                                                </div>
                                            </Col>

                                            <Col md={6} className="text-end">
                                                <div className="text-muted">
                                                    تعداد کل:{" "}
                                                    <strong>{categories.length}</strong> دسته
                                                    {searchTerm && (
                                                        <>
                                                            {" "}
                                                            | نتایج جستجو:{" "}
                                                            <strong>{filteredCategories.length}</strong>
                                                        </>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>
                                    )}

                                    {/* Table */}
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <Spinner />
                                            <div className="mt-3 text-muted">در حال بارگذاری...</div>
                                        </div>
                                    ) : categories.length === 0 ? (
                                        <div className="text-center py-5">
                                            <h5 className="text-muted">هیچ دسته‌ای ثبت نشده است</h5>
                                            <Link
                                                to="/inventory/add-category"
                                                className="btn btn-success mt-2"
                                            >
                                                افزودن اولین دسته
                                            </Link>
                                        </div>
                                    ) : filteredCategories.length === 0 ? (
                                        <div className="text-center py-5">
                                            <h5 className="text-muted">نتیجه‌ای یافت نشد</h5>
                                            <Button color="light" onClick={() => setSearchTerm("")}>
                                                پاک کردن جستجو
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table className="table table-hover table-nowrap align-middle mb-0">
                                                <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: "60px" }}>#</th>
                                                    <th>نام دسته‌بندی</th>
                                                    <th>نامک</th>
                                                    <th>دسته والد</th>
                                                    <th>وضعیت</th>
                                                    <th style={{ width: "150px" }}>عملیات</th>
                                                </tr>
                                                </thead>

                                                <tbody>
                                                {filteredCategories.map((cat, index) => (
                                                    <tr key={cat.id}>
                                                        <td>
                                                            <div className="avatar-xs">
                                                                    <span className="avatar-title rounded-circle bg-soft-primary text-primary">
                                                                        {index + 1}
                                                                    </span>
                                                            </div>
                                                        </td>

                                                        <td>{cat.name}</td>

                                                        <td>
                                                            <Badge color="info" className="badge-soft-info" pill>
                                                                {cat.slug}
                                                            </Badge>
                                                        </td>

                                                        <td className="text-muted">
                                                            {getParentName(cat.parent_id)}
                                                        </td>

                                                        <td>
                                                            {cat.is_active ? (
                                                                <Badge
                                                                    color="success"
                                                                    className="badge-soft-success"
                                                                >
                                                                    فعال
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    color="secondary"
                                                                    className="badge-soft-secondary"
                                                                >
                                                                    غیرفعال
                                                                </Badge>
                                                            )}
                                                        </td>

                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <Link
                                                                    to={`/inventory/edit-category/${cat.id}`}
                                                                    className="btn btn-sm btn-soft-primary"
                                                                >
                                                                    <i className="bx bx-edit-alt"></i>
                                                                </Link>

                                                                <Button
                                                                    size="sm"
                                                                    color="soft-danger"
                                                                    onClick={() => handleDelete(cat.id, cat.name)}
                                                                >
                                                                    <i className="bx bx-trash"></i>
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default CategoryList;
