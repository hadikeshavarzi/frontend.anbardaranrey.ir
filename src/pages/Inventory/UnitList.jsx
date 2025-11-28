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

const UnitList = () => {
    const [units, setUnits] = useState([]);
    const [filteredUnits, setFilteredUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const loadUnits = async () => {
        setLoading(true);
        setError("");

        console.log("🔍 Loading units list...");
        console.log("🔗 API URL:", "/product-units");

        try {
            const res = await get("/product-units");
            console.log("✅ Units loaded successfully:", res);

            // Payload برمی‌گردونه { docs: [...] }
            const unitsList = res?.docs || [];
            setUnits(unitsList);
            setFilteredUnits(unitsList);
        } catch (err) {
            console.error("❌ Error loading units:", err);
            console.error("❌ Error response:", err.response?.data);
            console.error("❌ Error status:", err.response?.status);

            if (err.response?.status === 401) {
                setError("خطای احراز هویت. لطفاً دوباره وارد شوید.");
            } else {
                setError(err.response?.data?.message || "خطا در دریافت لیست واحدها");
            }
        }

        setLoading(false);
    };

    useEffect(() => {
        loadUnits();
    }, []);

    // جستجو
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredUnits(units);
        } else {
            const filtered = units.filter(
                (unit) =>
                    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    unit.symbol.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUnits(filtered);
        }
    }, [searchTerm, units]);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`آیا از حذف واحد "${name}" مطمئن هستید؟`)) return;

        console.log("🗑️ Deleting unit with ID:", id);
        console.log("🔗 Delete URL:", `/product-units/${id}`);

        try {
            const result = await del(`/product-units/${id}`);
            console.log("✅ Delete successful:", result);

            // حذف از استیت
            setUnits((prev) => prev.filter((u) => u.id !== id));
            setFilteredUnits((prev) => prev.filter((u) => u.id !== id));

            setSuccess(`واحد "${name}" با موفقیت حذف شد`);
            setError("");

            // پاک کردن پیام موفقیت بعد از 3 ثانیه
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("❌ Delete error:", err);
            console.error("❌ Error response:", err.response?.data);
            console.error("❌ Error status:", err.response?.status);

            if (err.response?.status === 404) {
                setError("واحد مورد نظر یافت نشد. ممکن است قبلاً حذف شده باشد.");
                setUnits((prev) => prev.filter((u) => u.id !== id));
                setFilteredUnits((prev) => prev.filter((u) => u.id !== id));
            } else if (err.response?.status === 400) {
                setError("این واحد در بخش‌های دیگر استفاده شده و قابل حذف نیست.");
            } else if (err.response?.status === 401) {
                setError("خطای احراز هویت. لطفاً دوباره وارد شوید.");
            } else {
                setError(
                    err.response?.data?.message ||
                    "خطا در حذف واحد. ممکن است این واحد در بخش‌های دیگر استفاده شده باشد."
                );
            }
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {/* Breadcrumb */}
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 font-size-18">واحدهای کالا</h4>

                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    <Link to="/dashboard">داشبورد</Link>
                                </li>
                                <li className="breadcrumb-item active">واحدهای کالا</li>
                            </ol>
                        </div>
                    </div>

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardBody>
                                    {/* Header */}
                                    <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
                                        <div className="d-flex align-items-center">
                                            <div className="avatar-sm me-3">
                                                <div className="avatar-title rounded-circle bg-soft-primary text-primary font-size-20">
                                                    <i className="bx bx-layer"></i>
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="card-title mb-1">لیست واحدهای کالا</h5>
                                                <p className="text-muted mb-0">
                                                    مدیریت واحدهای اندازه‌گیری کالا
                                                </p>
                                            </div>
                                        </div>

                                        <div className="d-flex flex-wrap gap-2">
                                            <Button
                                                color="light"
                                                className="btn-label"
                                                onClick={loadUnits}
                                                disabled={loading}
                                            >
                                                <i className="bx bx-refresh label-icon"></i>
                                                بروزرسانی
                                            </Button>

                                            <Link
                                                to="/inventory/add-unit"
                                                className="btn btn-success btn-label"
                                            >
                                                <i className="bx bx-plus-circle label-icon"></i>
                                                افزودن واحد جدید
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Alerts */}
                                    {error && (
                                        <Alert
                                            color="danger"
                                            className="alert-dismissible fade show"
                                            role="alert"
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
                                            role="alert"
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

                                    {/* Search & Filter */}
                                    {!loading && units.length > 0 && (
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <div className="search-box">
                                                    <div className="position-relative">
                                                        <Input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="جستجو بر اساس نام یا نماد..."
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                        />
                                                        <i className="bx bx-search-alt search-icon"></i>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={6} className="text-end">
                                                <div className="text-muted">
                                                    تعداد کل: <strong>{units.length}</strong> واحد
                                                    {searchTerm && (
                                                        <>
                                                            {" "}
                                                            | نتایج جستجو:{" "}
                                                            <strong>{filteredUnits.length}</strong>
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
                                    ) : units.length === 0 ? (
                                        <div className="text-center py-5">
                                            <div className="avatar-lg mx-auto mb-4">
                                                <div className="avatar-title bg-soft-warning text-warning rounded-circle font-size-24">
                                                    <i className="bx bx-info-circle"></i>
                                                </div>
                                            </div>
                                            <h5 className="text-muted">هیچ واحدی ثبت نشده است</h5>
                                            <p className="text-muted">
                                                برای شروع، واحد جدیدی اضافه کنید
                                            </p>
                                            <Link
                                                to="/inventory/add-unit"
                                                className="btn btn-success mt-2"
                                            >
                                                <i className="bx bx-plus-circle me-1"></i>
                                                افزودن اولین واحد
                                            </Link>
                                        </div>
                                    ) : filteredUnits.length === 0 ? (
                                        <div className="text-center py-5">
                                            <div className="avatar-lg mx-auto mb-4">
                                                <div className="avatar-title bg-soft-info text-info rounded-circle font-size-24">
                                                    <i className="bx bx-search"></i>
                                                </div>
                                            </div>
                                            <h5 className="text-muted">نتیجه‌ای یافت نشد</h5>
                                            <p className="text-muted">
                                                واحدی با این مشخصات پیدا نشد
                                            </p>
                                            <Button
                                                color="light"
                                                onClick={() => setSearchTerm("")}
                                            >
                                                پاک کردن جستجو
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table className="table table-hover table-nowrap align-middle mb-0">
                                                <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: "60px" }}>#</th>
                                                    <th>نام واحد</th>
                                                    <th>نماد</th>
                                                    <th>توضیحات</th>
                                                    <th style={{ width: "100px" }}>وضعیت</th>
                                                    <th style={{ width: "120px" }} className="text-center">
                                                        عملیات
                                                    </th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {filteredUnits.map((unit, index) => (
                                                    <tr key={unit.id}>
                                                        <td>
                                                            <div className="avatar-xs">
                                  <span className="avatar-title rounded-circle bg-soft-primary text-primary">
                                    {index + 1}
                                  </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <h5 className="font-size-14 mb-0">
                                                                {unit.name}
                                                            </h5>
                                                        </td>
                                                        <td>
                                                            <Badge
                                                                color="info"
                                                                className="badge-soft-info font-size-12"
                                                                pill
                                                            >
                                                                {unit.symbol}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            {unit.description ? (
                                                                <span className="text-muted">
                                    {unit.description.length > 50
                                        ? unit.description.substring(0, 50) + "..."
                                        : unit.description}
                                  </span>
                                                            ) : (
                                                                <span className="text-muted">-</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {unit.is_active ? (
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
                                                        <td className="text-center">
                                                            <div className="d-flex gap-2 justify-content-center">
                                                                <Link
                                                                    to={`/inventory/edit-unit/${unit.id}`}
                                                                    className="btn btn-sm btn-soft-primary"
                                                                >
                                                                    <i className="bx bx-edit-alt"></i>
                                                                </Link>
                                                                <Button
                                                                    size="sm"
                                                                    color="soft-danger"
                                                                    onClick={() => handleDelete(unit.id, unit.name)}
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

export default UnitList;