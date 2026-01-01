import React, { useEffect, useState } from "react";
import {
    Container, Row, Col, Card, CardBody, Table, Button, Spinner, Alert, Badge, Input,
} from "reactstrap";
import { Link } from "react-router-dom";

// سرویس اتصال به سرور Node.js
import { getProducts, deleteProduct } from "../../services/inventoryService";

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    /* -------------------------------------------------
       Load Products
    ------------------------------------------------- */
    const loadProducts = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await getProducts();
            // اطمینان از اینکه دیتا آرایه است
            const safeData = Array.isArray(data) ? data : (data.data || []);

            setProducts(safeData);
            setFilteredProducts(safeData);
        } catch (err) {
            console.error(err);
            setError(err.message || "خطا در دریافت لیست کالاها");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    /* -------------------------------------------------
       Search Filter
    ------------------------------------------------- */
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredProducts(products);
            return;
        }

        const lower = searchTerm.toLowerCase();

        const filtered = products.filter((p) => {
            // ✅ اصلاح ۱: استفاده از category و unit (نام‌های جدید سرور)
            const categoryName = p.category?.name || "";
            const unitName = p.unit?.name || "";

            return (
                p.name?.toLowerCase().includes(lower) ||
                p.sku?.toLowerCase().includes(lower) ||
                p.barcode?.toLowerCase().includes(lower) ||
                categoryName.toLowerCase().includes(lower) ||
                unitName.toLowerCase().includes(lower)
            );
        });

        setFilteredProducts(filtered);
    }, [searchTerm, products]);

    /* -------------------------------------------------
       Delete Product
    ------------------------------------------------- */
    const handleDelete = async (id, name) => {
        if (!window.confirm(`آیا از حذف "${name}" مطمئن هستید؟`)) return;

        try {
            await deleteProduct(id);

            setProducts((prev) => prev.filter((p) => p.id !== id));
            setFilteredProducts((prev) => prev.filter((p) => p.id !== id));

            setSuccess(`کالا "${name}" حذف شد.`);
            setTimeout(() => setSuccess(""), 2500);
        } catch (err) {
            console.error(err);
            if (err.message && err.message.includes("violates foreign key")) {
                setError("این کالا در سیستم استفاده شده و قابل حذف نیست.");
            } else {
                setError("خطا در حذف کالا: " + err.message);
            }
        }
    };

    /* -------------------------------------------------
       Helpers (توابع اصلاح شده)
    ------------------------------------------------- */

    // ✅ اصلاح ۲: دریافت نام دسته از فیلد category
    const getCategoryName = (product) => {
        return product.category?.name || "-";
    };

    // ✅ اصلاح ۳: دریافت نام واحد از فیلد unit
    const getUnitName = (product) => {
        return product.unit?.name || "-";
    };

    /* -------------------------------------------------
       UI
    ------------------------------------------------- */
    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {/* عنوان صفحه */}
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 font-size-18">مدیریت کالاها</h4>
                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    <Link to="/dashboard">داشبورد</Link>
                                </li>
                                <li className="breadcrumb-item active">لیست کالاها</li>
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
                                            <h4 className="card-title mb-1">انبار محصولات</h4>
                                            <p className="card-title-desc mb-0 text-muted">
                                                لیست کالاهای اختصاصی شما
                                            </p>
                                        </div>

                                        <div className="d-flex flex-wrap gap-2">
                                            <Button
                                                color="light"
                                                onClick={loadProducts}
                                                disabled={loading}
                                            >
                                                <i className={`bx bx-refresh me-1 ${loading ? "bx-spin" : ""}`}></i>
                                                بروزرسانی
                                            </Button>

                                            <Link
                                                to="/inventory/add-product"
                                                className="btn btn-primary"
                                            >
                                                <i className="bx bx-plus me-1"></i>
                                                افزودن کالای جدید
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Alerts */}
                                    {error && <Alert color="danger" toggle={() => setError("")}>{error}</Alert>}
                                    {success && <Alert color="success" toggle={() => setSuccess("")}>{success}</Alert>}

                                    {/* Search */}
                                    {!loading && products.length > 0 && (
                                        <Row className="mb-3">
                                            <Col md={5}>
                                                <div className="search-box">
                                                    <div className="position-relative">
                                                        <Input
                                                            type="text"
                                                            className="form-control rounded-pill"
                                                            placeholder="جستجو (نام، کد، دسته...)"
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                        />
                                                        <i className="bx bx-search-alt search-icon"></i>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={7} className="text-end align-self-center">
                                                <div className="text-muted font-size-12">
                                                    تعداد کل: <strong>{products.length}</strong>
                                                </div>
                                            </Col>
                                        </Row>
                                    )}

                                    {/* Table */}
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <Spinner color="primary" type="grow" />
                                            <h5 className="mt-3 text-muted">در حال دریافت اطلاعات...</h5>
                                        </div>
                                    ) : filteredProducts.length === 0 ? (
                                        <div className="text-center py-5">
                                            <div className="avatar-md mx-auto mb-3">
                                                <span className="avatar-title rounded-circle bg-light text-secondary font-size-24">
                                                    <i className="bx bx-box"></i>
                                                </span>
                                            </div>
                                            <h5 className="text-muted">کالایی یافت نشد</h5>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table className="table table-hover align-middle table-nowrap">
                                                <thead className="table-light">
                                                <tr>
                                                    <th style={{width: '60px'}}>#</th>
                                                    <th>مشخصات کالا</th>
                                                    <th>SKU / کد</th>
                                                    <th>دسته</th>
                                                    <th>واحد</th>
                                                    {/* ستون‌های قیمت و موجودی حذف شدند */}
                                                    <th>عملیات</th>
                                                </tr>
                                                </thead>

                                                <tbody>
                                                {filteredProducts.map((product, index) => (
                                                    <tr key={product.id}>
                                                        <td>{index + 1}</td>

                                                        <td>
                                                            <h5 className="font-size-14 text-truncate mb-1">
                                                                <Link to={`/inventory/edit-product/${product.id}`} className="text-dark fw-bold">
                                                                    {product.name}
                                                                </Link>
                                                            </h5>
                                                            {product.barcode && (
                                                                <small className="text-muted">
                                                                    <i className="bx bx-barcode me-1"></i>
                                                                    {product.barcode}
                                                                </small>
                                                            )}
                                                        </td>

                                                        <td>
                                                            <Badge className="bg-light text-dark font-size-12 border">
                                                                {product.sku}
                                                            </Badge>
                                                        </td>

                                                        {/* نمایش نام دسته و واحد با کلیدهای جدید */}
                                                        <td>{getCategoryName(product)}</td>
                                                        <td>{getUnitName(product)}</td>

                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <Link
                                                                    to={`/inventory/edit-product/${product.id}`}
                                                                    className="btn btn-sm btn-soft-primary"
                                                                    title="ویرایش"
                                                                >
                                                                    <i className="bx bx-edit-alt font-size-15"></i>
                                                                </Link>

                                                                <Button
                                                                    size="sm"
                                                                    color="soft-danger"
                                                                    onClick={() => handleDelete(product.id, product.name)}
                                                                    title="حذف"
                                                                >
                                                                    <i className="bx bx-trash font-size-15"></i>
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

export default ProductList;