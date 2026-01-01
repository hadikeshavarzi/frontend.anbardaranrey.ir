import React, { useEffect, useState } from "react";
import {
    Container, Row, Col, Card, CardBody, Table, Button, Spinner, Alert, Badge, Input,
} from "reactstrap";
import { Link } from "react-router-dom";

// ✅ اصلاح ۱: ایمپورت از فایل customers (چون نام فایل شما customers.js است)
import { getCustomers, deleteCustomer } from "../../services/customers";

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // --------------------------
    // Load Customers
    // --------------------------
    const loadCustomers = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await getCustomers();
            // هندل کردن دیتا (چه آرایه خالی باشد چه داخل آبجکت data)
            const list = Array.isArray(data) ? data : (data.data || []);

            setCustomers(list);
            setFilteredCustomers(list);
        } catch (err) {
            console.error("❌ Load error:", err);
            setError("خطا در دریافت لیست مشتریان");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    // --------------------------
    // Search Filter
    // --------------------------
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredCustomers(customers);
            return;
        }

        const s = searchTerm.toLowerCase();

        const filtered = customers.filter((c) =>
            (c.name || "").toLowerCase().includes(s) || // ✅ اصلاح ۲: استفاده از name طبق دیتابیس
            (c.mobile || "").toLowerCase().includes(s) ||
            (c.national_id || "").toLowerCase().includes(s)
        );

        setFilteredCustomers(filtered);
    }, [searchTerm, customers]);

    // --------------------------
    // DELETE Customer
    // --------------------------
    const handleDelete = async (id, name) => {
        if (!window.confirm(`آیا از حذف "${name}" مطمئن هستید؟`)) return;

        try {
            await deleteCustomer(id);

            setCustomers(prev => prev.filter(c => c.id !== id));
            setFilteredCustomers(prev => prev.filter(c => c.id !== id));

            setSuccess(`مشتری "${name}" با موفقیت حذف شد`);
            setTimeout(() => setSuccess(""), 3000);

        } catch (err) {
            const msg = err.response?.data?.error || "خطا در حذف مشتری";
            if(msg.includes("foreign key") || msg.includes("23503")) {
                setError("این مشتری دارای سابقه مالی یا کالا است و حذف نمی‌شود.");
            } else {
                setError(msg);
            }
            setTimeout(() => setError(""), 5000);
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {/* Breadcrumb */}
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 font-size-18">لیست مشتریان</h4>
                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    <Link to="/dashboard">داشبورد</Link>
                                </li>
                                <li className="breadcrumb-item active">مشتریان</li>
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
                                                    <i className="bx bx-user-circle"></i>
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="card-title mb-1">مدیریت مشتریان</h5>
                                                <p className="text-muted mb-0">
                                                    لیست خریداران و فروشندگان اختصاصی شما
                                                </p>
                                            </div>
                                        </div>

                                        <div className="d-flex flex-wrap gap-2">
                                            <Button color="light" onClick={loadCustomers} disabled={loading}>
                                                <i className={`bx bx-refresh me-1 ${loading ? "bx-spin" : ""}`}></i>
                                                بروزرسانی
                                            </Button>
                                            <Link to="/customers/add" className="btn btn-success">
                                                <i className="bx bx-plus-circle me-1"></i>
                                                افزودن مشتری
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Alerts */}
                                    {error && <Alert color="danger" toggle={() => setError("")}>{error}</Alert>}
                                    {success && <Alert color="success" toggle={() => setSuccess("")}>{success}</Alert>}

                                    {/* Search */}
                                    {!loading && customers.length > 0 && (
                                        <Row className="mb-3">
                                            <Col md={5}>
                                                <div className="search-box">
                                                    <div className="position-relative">
                                                        <Input
                                                            type="text"
                                                            className="form-control rounded-pill"
                                                            placeholder="جستجو (نام، موبایل، کد ملی...)"
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                        />
                                                        <i className="bx bx-search-alt search-icon"></i>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={7} className="text-end align-self-center">
                                                <div className="text-muted font-size-12">
                                                    تعداد کل: <strong>{customers.length}</strong>
                                                </div>
                                            </Col>
                                        </Row>
                                    )}

                                    {/* Table */}
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <Spinner color="primary" />
                                            <p className="mt-2 text-muted">در حال بارگذاری...</p>
                                        </div>
                                    ) : filteredCustomers.length === 0 ? (
                                        <div className="text-center py-5">
                                            <div className="avatar-md mx-auto mb-3">
                                                <span className="avatar-title rounded-circle bg-light text-secondary font-size-24">
                                                    <i className="bx bx-user-x"></i>
                                                </span>
                                            </div>
                                            <h5 className="text-muted">مشتری‌ای یافت نشد</h5>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table className="table table-hover table-nowrap align-middle mb-0">
                                                <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: 60 }}>#</th>
                                                    <th>نام و نام خانوادگی</th>
                                                    <th>نوع</th>
                                                    <th>موبایل</th>
                                                    <th>کد ملی / شناسه</th>
                                                    <th className="text-center">عملیات</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {filteredCustomers.map((c, index) => (
                                                    <tr key={c.id}>
                                                        <td>{index + 1}</td>
                                                        <td>
                                                            <h5 className="font-size-14 text-truncate mb-1">
                                                                <Link to={`/customers/edit/${c.id}`} className="text-dark">
                                                                    {c.name} {/* ✅ اصلاح شده */}
                                                                </Link>
                                                            </h5>
                                                            {c.address && (
                                                                <small className="text-muted text-truncate d-block" style={{maxWidth: '200px'}}>
                                                                    {c.address}
                                                                </small>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {c.customer_type === "company" ? (
                                                                <Badge color="warning" className="badge-soft-warning">حقوقی</Badge>
                                                            ) : (
                                                                <Badge color="info" className="badge-soft-info">حقیقی</Badge>
                                                            )}
                                                        </td>
                                                        <td>{c.mobile || "-"}</td>
                                                        <td>{c.national_id || "-"}</td>
                                                        <td className="text-center">
                                                            <div className="d-flex gap-2 justify-content-center">
                                                                <Link to={`/customers/edit/${c.id}`} className="btn btn-sm btn-soft-primary">
                                                                    <i className="bx bx-pencil font-size-16"></i>
                                                                </Link>
                                                                <Button size="sm" color="soft-danger" onClick={() => handleDelete(c.id, c.name)}>
                                                                    <i className="bx bx-trash font-size-16"></i>
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

export default CustomerList;