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

    const loadCategories = async () => {
        setLoading(true);
        setError("");

        console.log("🔍 Loading categories list...");

        try {
            const res = await get("/product-categories");
            console.log("✅ Categories loaded successfully:", res);

            const catList = res?.docs || [];
            setCategories(catList);
            setFilteredCategories(catList);
        } catch (err) {
            console.error("❌ Error loading categories:", err);
            setError(err.response?.data?.message || "خطا در دریافت لیست دسته‌بندی‌ها");
        }

        setLoading(false);
    };

    useEffect(() => {
        loadCategories();
    }, []);

    // جستجو
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredCategories(categories);
        } else {
            const filtered = categories.filter(
                (cat) =>
                    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredCategories(filtered);
        }
    }, [searchTerm, categories]);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`آیا از حذف دسته‌بندی "${name}" مطمئن هستید؟`)) return;

        console.log("🗑️ Deleting category with ID:", id);

        try {
            await del(`/product-categories/${id}`);
            console.log("✅ Delete successful");

            setCategories((prev) => prev.filter((c) => c.id !== id));
            setFilteredCategories((prev) => prev.filter((c) => c.id !== id));

            setSuccess(`دسته‌بندی "${name}" با موفقیت حذف شد`);
            setError("");

            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("❌ Delete error:", err);

            if (err.response?.status === 404) {
                setError("دسته‌بندی مورد نظر یافت نشد.");
                setCategories((prev) => prev.filter((c) => c.id !== id));
                setFilteredCategories((prev) => prev.filter((c) => c.id !== id));
            } else if (err.response?.status === 400) {
                setError("این دسته‌بندی دارای زیرمجموعه یا کالاهای مرتبط است و قابل حذف نیست.");
            } else {
                setError(err.response?.data?.message || "خطا در حذف دسته‌بندی");
            }
        }
    };

    // پیدا کردن نام دسته والد
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
                                            <i className="mdi mdi-block-helper me-2"></i>
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
                                            <i className="mdi mdi-check-all me-2"></i>
                                            {success}
                                            <button
                                                type="button"
                                                className="btn-close"
                                                onClick={() => setSuccess("")}
                                            ></button>
                                        </Alert>
                                    )}

                                    {/* Search & Stats */}
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
                                                    تعداد کل: <strong>{categories.length}</strong> دسته‌بندی
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
                                            <Spinner color="primary" />
                                            <div className="mt-3">
                                                <h5 className="text-muted">در حال بارگذاری...</h5>
                                            </div>
                                        </div>
                                    ) : categories.length === 0 ? (
                                        <div className="text-center py-5">
                                            <div className="avatar-lg mx-auto mb-4">
                                                <div className="avatar-title bg-soft-warning text-warning rounded-circle font-size-24">
                                                    <i className="bx bx-info-circle"></i>
                                                </div>
                                            </div>
                                            <h5 className="text-muted">هیچ دسته‌بندی‌ای ثبت نشده است</h5>
                                            <p className="text-muted">
                                                برای شروع، دسته‌بندی جدیدی اضافه کنید
                                            </p>
                                            <Link
                                                to="/inventory/add-category"
                                                className="btn btn-success mt-2"
                                            >
                                                <i className="bx bx-plus-circle me-1"></i>
                                                افزودن اولین دسته‌بندی
                                            </Link>
                                        </div>
                                    ) : filteredCategories.length === 0 ? (
                                        <div className="text-center py-5">
                                            <div className="avatar-lg mx-auto mb-4">
                                                <div className="avatar-title bg-soft-info text-info rounded-circle font-size-24">
                                                    <i className="bx bx-search"></i>
                                                </div>
                                            </div>
                                            <h5 className="text-muted">نتیجه‌ای یافت نشد</h5>
                                            <p className="text-muted">
                                                دسته‌بندی با این مشخصات پیدا نشد
                                            </p>
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
                                                    <th style={{ width: "100px" }}>وضعیت</th>
                                                    <th style={{ width: "160px" }}>عملیات</th>
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
                                                        <td>
                                                            <h5 className="font-size-14 mb-0">
                                                                {cat.name}
                                                            </h5>
                                                        </td>
                                                        <td>
                                                            <Badge color="info" className="badge-soft-info" pill>
                                                                {cat.slug}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                <span className="text-muted">
                                  {getParentName(cat.parent)}
                                </span>
                                                        </td>
                                                        <td>
                                                            {cat.is_active ? (
                                                                <Badge color="success" className="badge-soft-success">
                                                                    <i className="bx bx-check-circle me-1"></i>
                                                                    فعال
                                                                </Badge>
                                                            ) : (
                                                                <Badge color="secondary" className="badge-soft-secondary">
                                                                    <i className="bx bx-x-circle me-1"></i>
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