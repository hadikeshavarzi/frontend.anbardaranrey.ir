// src/pages/Receipt/ReceiptList.jsx
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
import { get, del } from "../../helpers/api_helper";
import moment from "moment-jalaali";

const ReceiptList = () => {
    const [receipts, setReceipts] = useState([]);
    const [filteredReceipts, setFilteredReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const loadReceipts = async () => {
        setLoading(true);
        setError("");

        console.log("🔍 Loading receipts list...");

        try {
            const res = await get("/receipts?limit=1000");
            console.log("✅ Receipts loaded successfully:", res);

            const receiptList = res?.docs || [];
            setReceipts(receiptList);
            setFilteredReceipts(receiptList);
        } catch (err) {
            console.error("❌ Error loading receipts:", err);
            setError(err.response?.data?.message || "خطا در دریافت لیست رسیدها");
        }

        setLoading(false);
    };

    useEffect(() => {
        loadReceipts();
    }, []);

    // جستجو
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredReceipts(receipts);
        } else {
            const filtered = receipts.filter(
                (r) =>
                    r.receiptNo?.toString().includes(searchTerm) ||
                    r.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.owner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredReceipts(filtered);
        }
    }, [searchTerm, receipts]);

    const handleDelete = async (id, receiptNo) => {
        if (!window.confirm(`آیا از حذف رسید شماره "${receiptNo}" مطمئن هستید؟`))
            return;

        console.log("🗑️ Deleting receipt with ID:", id);

        try {
            await del(`/receipts/${id}`);
            console.log("✅ Delete successful");

            setReceipts((prev) => prev.filter((r) => r.id !== id));
            setFilteredReceipts((prev) => prev.filter((r) => r.id !== id));

            setSuccess(`رسید شماره "${receiptNo}" با موفقیت حذف شد`);
            setError("");

            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("❌ Delete error:", err);

            if (err.response?.status === 404) {
                setError("رسید مورد نظر یافت نشد.");
                setReceipts((prev) => prev.filter((r) => r.id !== id));
                setFilteredReceipts((prev) => prev.filter((r) => r.id !== id));
            } else if (err.response?.status === 400) {
                setError("این رسید دارای تراکنش‌های مرتبط است و قابل حذف نیست.");
            } else {
                setError(err.response?.data?.message || "خطا در حذف رسید");
            }
        }
    };

    // فرمت تاریخ شمسی
    const formatDate = (date) => {
        if (!date) return "-";
        return moment(date).format("jYYYY/jMM/jDD");
    };

    // بج وضعیت
    const getStatusBadge = (status) => {
        if (status === "final") {
            return (
                <Badge color="success" className="badge-soft-success">
                    ثبت قطعی
                </Badge>
            );
        } else if (status === "draft") {
            return (
                <Badge color="warning" className="badge-soft-warning">
                    پیش‌نویس
                </Badge>
            );
        } else {
            return (
                <Badge color="secondary" className="badge-soft-secondary">
                    نامشخص
                </Badge>
            );
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {/* Breadcrumb */}
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 font-size-18">رسیدها</h4>

                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    <Link to="/dashboard">داشبورد</Link>
                                </li>
                                <li className="breadcrumb-item active">رسیدها</li>
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
                                            <h4 className="card-title mb-1">لیست رسیدها</h4>
                                            <p className="card-title-desc mb-0">
                                                مدیریت رسیدهای ورود کالا به انبار
                                            </p>
                                        </div>

                                        <div className="d-flex flex-wrap gap-2">
                                            <Button
                                                color="light"
                                                onClick={loadReceipts}
                                                disabled={loading}
                                            >
                                                <i className="bx bx-refresh me-1"></i>
                                                بروزرسانی
                                            </Button>

                                            <Link
                                                to="/receipt/form"
                                                className="btn btn-success"
                                            >
                                                <i className="bx bx-plus-circle me-1"></i>
                                                ثبت رسید جدید
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
                                    {!loading && receipts.length > 0 && (
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <div className="search-box">
                                                    <div className="position-relative">
                                                        <Input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="جستجو بر اساس شماره رسید یا نام مالک..."
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                        />
                                                        <i className="bx bx-search-alt search-icon"></i>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={6} className="text-end">
                                                <div className="text-muted">
                                                    تعداد کل: <strong>{receipts.length}</strong> رسید
                                                    {searchTerm && (
                                                        <>
                                                            {" "}
                                                            | نتایج جستجو:{" "}
                                                            <strong>{filteredReceipts.length}</strong>
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
                                    ) : receipts.length === 0 ? (
                                        <div className="text-center py-5">
                                            <div className="avatar-lg mx-auto mb-4">
                                                <div className="avatar-title bg-soft-warning text-warning rounded-circle font-size-24">
                                                    <i className="bx bx-info-circle"></i>
                                                </div>
                                            </div>
                                            <h5 className="text-muted">هیچ رسیدی ثبت نشده است</h5>
                                            <p className="text-muted">
                                                برای شروع، رسید جدیدی اضافه کنید
                                            </p>
                                            <Link to="/receipt/form" className="btn btn-success mt-2">
                                                <i className="bx bx-plus-circle me-1"></i>
                                                ثبت اولین رسید
                                            </Link>
                                        </div>
                                    ) : filteredReceipts.length === 0 ? (
                                        <div className="text-center py-5">
                                            <div className="avatar-lg mx-auto mb-4">
                                                <div className="avatar-title bg-soft-info text-info rounded-circle font-size-24">
                                                    <i className="bx bx-search"></i>
                                                </div>
                                            </div>
                                            <h5 className="text-muted">نتیجه‌ای یافت نشد</h5>
                                            <p className="text-muted">رسیدی با این مشخصات پیدا نشد</p>
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
                                                    <th>شماره رسید</th>
                                                    <th>تاریخ سند</th>
                                                    <th>مالک</th>
                                                    <th>تحویل دهنده</th>
                                                    <th>تعداد اقلام</th>
                                                    <th style={{ width: "100px" }}>وضعیت</th>
                                                    <th style={{ width: "180px" }}>عملیات</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {filteredReceipts.map((receipt, index) => (
                                                    <tr key={receipt.id}>
                                                        <td>
                                                            <div className="avatar-xs">
                                                                <span className="avatar-title rounded-circle bg-soft-primary text-primary">
                                                                    {index + 1}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <h5 className="font-size-14 mb-0">
                                                                <Badge color="info" className="badge-soft-info" pill>
                                                                    #{receipt.receiptNo || receipt.id}
                                                                </Badge>
                                                            </h5>
                                                        </td>
                                                        <td>
                                                            <span className="text-muted">
                                                                <i className="bx bx-calendar me-1"></i>
                                                                {formatDate(receipt.docDate)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <h5 className="font-size-14 mb-0">
                                                                {receipt.owner?.name ||
                                                                    receipt.owner?.full_name ||
                                                                    "-"}
                                                            </h5>
                                                            {receipt.owner?.mobile && (
                                                                <small className="text-muted">
                                                                    <i className="bx bx-phone"></i>{" "}
                                                                    {receipt.owner.mobile}
                                                                </small>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className="text-muted">
                                                                {receipt.deliverer?.name ||
                                                                    receipt.deliverer?.full_name ||
                                                                    "-"}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <strong>
                                                                {Array.isArray(receipt.items)
                                                                    ? receipt.items.length
                                                                    : 0}
                                                            </strong>{" "}
                                                            <small className="text-muted">قلم</small>
                                                        </td>
                                                        <td>{getStatusBadge(receipt.status)}</td>
                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <Link
                                                                    to={`/receipts/view/${receipt.id}`}
                                                                    className="btn btn-sm btn-soft-info"
                                                                    title="مشاهده"
                                                                >
                                                                    <i className="bx bx-show"></i>
                                                                </Link>

                                                                <Link
                                                                    to={`/receipts/edit/${receipt.id}`}
                                                                    className="btn btn-sm btn-soft-primary"
                                                                    title="ویرایش"
                                                                >
                                                                    <i className="bx bx-edit-alt"></i>
                                                                </Link>

                                                                <Button
                                                                    size="sm"
                                                                    color="soft-danger"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            receipt.id,
                                                                            receipt.receiptNo || receipt.id
                                                                        )
                                                                    }
                                                                    title="حذف"
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

export default ReceiptList;