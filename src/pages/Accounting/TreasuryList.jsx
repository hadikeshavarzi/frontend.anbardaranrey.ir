import React, { useState, useEffect } from "react";
import {
    Container, Card, CardBody, Table, Button, Badge,
    Modal, ModalHeader, ModalBody, ModalFooter,
    Input, Label, Row, Col, Spinner, UncontrolledDropdown,
    DropdownToggle, DropdownMenu, DropdownItem
} from "reactstrap";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DatePickerWithIcon from "../../components/Shared/DatePickerWithIcon";
import { getTreasuryDocuments, deleteTreasuryDocument, updateTreasuryDocument } from "../../services/treasuryService";

export default function TreasuryList() {
    const navigate = useNavigate();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all"); // all, receive, payment, check

    // Modal State
    const [modal, setModal] = useState(false);
    const [editData, setEditData] = useState({ id: null, date: '', description: '', manual_no: '' });
    const [btnLoading, setBtnLoading] = useState(false);

    // Modal جزئیات سند
    const [detailModal, setDetailModal] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);

    // تابع تبدیل تاریخ میلادی به شمسی
    const toPersianDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
            return new Date(dateStr).toLocaleDateString('fa-IR');
        } catch (e) {
            return "-";
        }
    };

    // تبدیل تاریخ به فرمت کامل
    const toPersianDateTime = (dateStr) => {
        if (!dateStr) return "-";
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('fa-IR') + ' ' + date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return "-";
        }
    };

    // دریافت داده‌ها
    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getTreasuryDocuments();
            console.log("Treasury Documents:", data);
            setDocs(data);
        } catch (err) {
            console.error(err);
            toast.error("خطا در دریافت لیست: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // حذف سند
    const handleDelete = async (id) => {
        if (!window.confirm("آیا از حذف این سند اطمینان دارید؟ این عملیات غیرقابل بازگشت است.")) return;

        setLoading(true);
        try {
            await deleteTreasuryDocument(id);
            toast.success("سند با موفقیت حذف شد");
            await fetchData();
        } catch (err) {
            console.error("Delete error:", err);
            toast.error("خطا در حذف: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // باز کردن مودال ویرایش
    const openEditModal = (doc) => {
        setEditData({
            id: doc.id,
            date: doc.doc_date,
            description: doc.description,
            manual_no: doc.manual_no || ''
        });
        setModal(true);
    };

    // ذخیره ویرایش
    const handleUpdate = async () => {
        if (!editData.description || !editData.date) {
            toast.warn("تاریخ و شرح سند الزامی است");
            return;
        }

        setBtnLoading(true);
        try {
            await updateTreasuryDocument(editData.id, editData);
            toast.success("ویرایش با موفقیت انجام شد");
            setModal(false);
            await fetchData();
        } catch (err) {
            console.error("Update error:", err);
            toast.error("خطا در ویرایش: " + err.message);
        } finally {
            setBtnLoading(false);
        }
    };

    // نمایش جزئیات سند
    const showDetails = (doc) => {
        setSelectedDoc(doc);
        setDetailModal(true);
    };

    // فیلتر بر اساس نوع
    const getFilteredDocs = () => {
        let filtered = docs;

        // فیلتر بر اساس نوع
        if (filterType === 'receive') {
            filtered = filtered.filter(d => d.description?.includes('دریافت'));
        } else if (filterType === 'payment') {
            filtered = filtered.filter(d => d.description?.includes('پرداخت'));
        } else if (filterType === 'check') {
            filtered = filtered.filter(d => d.description?.includes('چک'));
        }

        // فیلتر جستجو
        if (searchTerm) {
            filtered = filtered.filter(d =>
                (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (d.manual_no && d.manual_no.includes(searchTerm)) ||
                d.id.toString().includes(searchTerm)
            );
        }

        return filtered;
    };

    const filteredDocs = getFilteredDocs();

    // تعیین نوع سند برای نمایش Badge
    const getDocTypeBadge = (desc) => {
        if (!desc) return <Badge color="secondary" className="font-size-12">سند</Badge>;
        if (desc.includes('دریافت')) return <Badge color="success" className="font-size-12">دریافت وجه</Badge>;
        if (desc.includes('پرداخت')) return <Badge color="danger" className="font-size-12">پرداخت وجه</Badge>;
        if (desc.includes('چک')) return <Badge color="warning" className="text-dark font-size-12">عملیات چک</Badge>;
        return <Badge color="info" className="font-size-12">سند حسابداری</Badge>;
    };

    // استخراج شماره سند از توضیحات
    const extractDocNumber = (desc) => {
        if (!desc) return null;
        const match = desc.match(/شماره\s+([DP]\d+)/);
        return match ? match[1] : null;
    };

    // محاسبه آمار
    const stats = {
        total: docs.length,
        receive: docs.filter(d => d.description?.includes('دریافت')).length,
        payment: docs.filter(d => d.description?.includes('پرداخت')).length,
        check: docs.filter(d => d.description?.includes('چک')).length,
        totalReceiveAmount: docs.filter(d => d.description?.includes('دریافت')).reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0),
        totalPaymentAmount: docs.filter(d => d.description?.includes('پرداخت')).reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0)
    };

    return (
        <div className="page-content">
            <Container fluid>
                {/* هدر صفحه */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold font-size-18 mb-1">لیست اسناد خزانه‌داری</h4>
                        <p className="text-muted mb-0">
                            <i className="bx bx-file me-1"></i>
                            {stats.total} سند ثبت شده
                        </p>
                    </div>
                    <div className="d-flex gap-2">
                        <Button color="success" onClick={() => navigate('/accounting/treasury-form')}>
                            <i className="bx bx-plus me-1"></i> دریافت/پرداخت جدید
                        </Button>
                        <Button color="warning" outline onClick={() => navigate('/accounting/check-operations')}>
                            <i className="bx bx-check-shield me-1"></i> کارتابل چک
                        </Button>
                    </div>
                </div>

                {/* کارت‌های آمار */}
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="mini-stats-wid shadow-sm border-0">
                            <CardBody>
                                <div className="d-flex">
                                    <div className="flex-grow-1">
                                        <p className="text-muted fw-medium mb-2">دریافت‌ها</p>
                                        <h5 className="mb-0 text-success">{stats.receive} سند</h5>
                                        <p className="text-muted font-size-11 mb-0">
                                            {stats.totalReceiveAmount.toLocaleString()} ریال
                                        </p>
                                    </div>
                                    <div className="avatar-sm rounded-circle bg-success-subtle align-self-center">
                                        <span className="avatar-title bg-transparent">
                                            <i className="bx bx-down-arrow-alt font-size-24 text-success"></i>
                                        </span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="mini-stats-wid shadow-sm border-0">
                            <CardBody>
                                <div className="d-flex">
                                    <div className="flex-grow-1">
                                        <p className="text-muted fw-medium mb-2">پرداخت‌ها</p>
                                        <h5 className="mb-0 text-danger">{stats.payment} سند</h5>
                                        <p className="text-muted font-size-11 mb-0">
                                            {stats.totalPaymentAmount.toLocaleString()} ریال
                                        </p>
                                    </div>
                                    <div className="avatar-sm rounded-circle bg-danger-subtle align-self-center">
                                        <span className="avatar-title bg-transparent">
                                            <i className="bx bx-up-arrow-alt font-size-24 text-danger"></i>
                                        </span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="mini-stats-wid shadow-sm border-0">
                            <CardBody>
                                <div className="d-flex">
                                    <div className="flex-grow-1">
                                        <p className="text-muted fw-medium mb-2">عملیات چک</p>
                                        <h5 className="mb-0 text-warning">{stats.check} سند</h5>
                                    </div>
                                    <div className="avatar-sm rounded-circle bg-warning-subtle align-self-center">
                                        <span className="avatar-title bg-transparent">
                                            <i className="bx bx-check-shield font-size-24 text-warning"></i>
                                        </span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="mini-stats-wid shadow-sm border-0">
                            <CardBody>
                                <div className="d-flex">
                                    <div className="flex-grow-1">
                                        <p className="text-muted fw-medium mb-2">مانده</p>
                                        <h5 className={`mb-0 ${stats.totalReceiveAmount - stats.totalPaymentAmount >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {(stats.totalReceiveAmount - stats.totalPaymentAmount).toLocaleString()}
                                        </h5>
                                        <p className="text-muted font-size-11 mb-0">ریال</p>
                                    </div>
                                    <div className="avatar-sm rounded-circle bg-primary-subtle align-self-center">
                                        <span className="avatar-title bg-transparent">
                                            <i className="bx bx-wallet font-size-24 text-primary"></i>
                                        </span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Card className="shadow-sm border-0">
                    <CardBody>
                        {/* جستجو و فیلتر */}
                        <Row className="mb-4">
                            <Col md={4}>
                                <div className="search-box">
                                    <div className="position-relative">
                                        <Input
                                            className="form-control"
                                            placeholder="جستجو در شرح، شماره سند یا شماره دستی..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                        <i className="bx bx-search-alt search-icon" />
                                    </div>
                                </div>
                            </Col>
                            <Col md={8} className="text-end">
                                <div className="btn-group" role="group">
                                    <Button
                                        color={filterType === 'all' ? 'primary' : 'light'}
                                        onClick={() => setFilterType('all')}
                                        size="sm"
                                    >
                                        همه ({stats.total})
                                    </Button>
                                    <Button
                                        color={filterType === 'receive' ? 'success' : 'light'}
                                        onClick={() => setFilterType('receive')}
                                        size="sm"
                                    >
                                        دریافت ({stats.receive})
                                    </Button>
                                    <Button
                                        color={filterType === 'payment' ? 'danger' : 'light'}
                                        onClick={() => setFilterType('payment')}
                                        size="sm"
                                    >
                                        پرداخت ({stats.payment})
                                    </Button>
                                    <Button
                                        color={filterType === 'check' ? 'warning' : 'light'}
                                        onClick={() => setFilterType('check')}
                                        size="sm"
                                    >
                                        چک ({stats.check})
                                    </Button>
                                </div>
                            </Col>
                        </Row>

                        {loading ? (
                            <div className="text-center py-5">
                                <Spinner color="primary" />
                                <p className="text-muted mt-2">در حال بارگذاری...</p>
                            </div>
                        ) : (
                            <Table responsive hover className="align-middle text-center table-nowrap border">
                                <thead className="table-light">
                                <tr>
                                    <th style={{width: '70px'}}>ردیف</th>
                                    <th>شماره سند</th>
                                    <th>نوع</th>
                                    <th>تاریخ</th>
                                    <th>شرح</th>
                                    <th>مبلغ (ریال)</th>
                                    <th>شماره دستی</th>
                                    <th>ثبت شده</th>
                                    <th>عملیات</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredDocs.length > 0 ? filteredDocs.map((doc, idx) => {
                                    const docNumber = extractDocNumber(doc.description);

                                    return (
                                        <tr key={doc.id}>
                                            <td><span className="text-muted">#{idx + 1}</span></td>
                                            <td>
                                                {docNumber ? (
                                                    <Badge color="dark" className="font-size-13 px-3 py-2">
                                                        {docNumber}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted">{doc.id}</span>
                                                )}
                                            </td>
                                            <td>{getDocTypeBadge(doc.description)}</td>
                                            <td className="fw-medium">{toPersianDate(doc.doc_date)}</td>

                                            <td className="text-start" style={{maxWidth: '300px'}}>
                                                <div className="text-truncate" title={doc.description}>
                                                    {doc.description}
                                                </div>
                                            </td>

                                            <td>
                                                <span className="fw-bold text-dark fs-6">
                                                    {doc.total_amount ? Number(doc.total_amount).toLocaleString() : '0'}
                                                </span>
                                            </td>

                                            <td>
                                                {doc.manual_no ? (
                                                    <Badge color="info" className="font-size-11">{doc.manual_no}</Badge>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>

                                            <td className="font-size-11 text-muted">
                                                {toPersianDateTime(doc.created_at)}
                                            </td>

                                            <td>
                                                <UncontrolledDropdown>
                                                    <DropdownToggle tag="button" className="btn btn-light btn-sm">
                                                        <i className="bx bx-dots-vertical-rounded"></i>
                                                    </DropdownToggle>
                                                    <DropdownMenu end>
                                                        <DropdownItem onClick={() => showDetails(doc)}>
                                                            <i className="bx bx-detail me-2 text-primary"></i>
                                                            جزئیات
                                                        </DropdownItem>
                                                        <DropdownItem onClick={() => openEditModal(doc)}>
                                                            <i className="bx bx-edit me-2 text-info"></i>
                                                            ویرایش
                                                        </DropdownItem>
                                                        <DropdownItem divider />
                                                        <DropdownItem onClick={() => handleDelete(doc.id)} className="text-danger">
                                                            <i className="bx bx-trash me-2"></i>
                                                            حذف
                                                        </DropdownItem>
                                                    </DropdownMenu>
                                                </UncontrolledDropdown>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="9" className="text-center py-5">
                                            <i className="bx bx-folder-open font-size-48 d-block mb-3 text-secondary"></i>
                                            <h5 className="text-muted">هیچ سندی یافت نشد</h5>
                                            <p className="text-muted">
                                                {searchTerm || filterType !== 'all'
                                                    ? "فیلتر یا جستجوی خود را تغییر دهید"
                                                    : "برای شروع، یک دریافت یا پرداخت جدید ثبت کنید"}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </Table>
                        )}
                    </CardBody>
                </Card>

                {/* مودال ویرایش */}
                <Modal isOpen={modal} toggle={() => setModal(!modal)} centered>
                    <ModalHeader toggle={() => setModal(!modal)}>
                        <i className="bx bx-edit me-2"></i>
                        ویرایش سند شماره {editData.id}
                    </ModalHeader>
                    <ModalBody>
                        <Row className="gy-3">
                            <Col md={12}>
                                <Label className="fw-bold">تاریخ سند <span className="text-danger">*</span></Label>
                                <div style={{direction:'rtl'}}>
                                    <DatePickerWithIcon
                                        value={editData.date}
                                        onChange={(d) => {
                                            if (d?.toDate) {
                                                setEditData({...editData, date: d.toDate().toISOString().slice(0,10)});
                                            }
                                        }}
                                    />
                                </div>
                            </Col>
                            <Col md={12}>
                                <Label className="fw-bold">شرح سند <span className="text-danger">*</span></Label>
                                <Input
                                    type="textarea"
                                    rows="3"
                                    value={editData.description}
                                    onChange={e => setEditData({...editData, description: e.target.value})}
                                    placeholder="شرح کامل سند را وارد کنید..."
                                />
                            </Col>
                            <Col md={12}>
                                <Label className="fw-bold">شماره دستی / پیگیری</Label>
                                <Input
                                    value={editData.manual_no}
                                    onChange={e => setEditData({...editData, manual_no: e.target.value})}
                                    placeholder="اختیاری"
                                />
                            </Col>
                            <Col md={12}>
                                <div className="alert alert-warning p-3 mb-0">
                                    <i className="bx bx-error-circle me-2"></i>
                                    <strong>توجه:</strong> برای تغییر مبلغ یا نوع تراکنش، باید سند را حذف و مجدداً ثبت کنید.
                                </div>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={handleUpdate} disabled={btnLoading}>
                            {btnLoading ? (
                                <>
                                    <Spinner size="sm" className="me-2"/> در حال ذخیره...
                                </>
                            ) : (
                                <>
                                    <i className="bx bx-check me-2"></i>
                                    ذخیره تغییرات
                                </>
                            )}
                        </Button>
                        <Button color="secondary" outline onClick={() => setModal(false)}>
                            انصراف
                        </Button>
                    </ModalFooter>
                </Modal>

                {/* مودال جزئیات */}
                <Modal isOpen={detailModal} toggle={() => setDetailModal(!detailModal)} size="lg" centered>
                    <ModalHeader toggle={() => setDetailModal(!detailModal)}>
                        <i className="bx bx-detail me-2"></i>
                        جزئیات سند شماره {selectedDoc?.id}
                    </ModalHeader>
                    <ModalBody>
                        {selectedDoc && (
                            <div>
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <p className="text-muted mb-1">نوع سند:</p>
                                        <p className="fw-bold">{getDocTypeBadge(selectedDoc.description)}</p>
                                    </Col>
                                    <Col md={6}>
                                        <p className="text-muted mb-1">تاریخ ثبت:</p>
                                        <p className="fw-bold">{toPersianDate(selectedDoc.doc_date)}</p>
                                    </Col>
                                    <Col md={6}>
                                        <p className="text-muted mb-1">مبلغ کل:</p>
                                        <p className="fw-bold text-primary fs-5">
                                            {selectedDoc.total_amount ? Number(selectedDoc.total_amount).toLocaleString() : '0'} ریال
                                        </p>
                                    </Col>
                                    <Col md={6}>
                                        <p className="text-muted mb-1">شماره دستی:</p>
                                        <p className="fw-bold">{selectedDoc.manual_no || '-'}</p>
                                    </Col>
                                    <Col md={12}>
                                        <p className="text-muted mb-1">شرح:</p>
                                        <div className="alert alert-light mb-0">
                                            {selectedDoc.description}
                                        </div>
                                    </Col>
                                </Row>

                                {selectedDoc.financial_entries && selectedDoc.financial_entries.length > 0 && (
                                    <div className="mt-4">
                                        <h6 className="fw-bold mb-3">آیتم‌های سند:</h6>
                                        <Table size="sm" bordered className="mb-0">
                                            <thead className="table-light">
                                            <tr>
                                                <th>ردیف</th>
                                                <th>بدهکار</th>
                                                <th>بستانکار</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {selectedDoc.financial_entries.map((entry, idx) => (
                                                <tr key={idx}>
                                                    <td>{idx + 1}</td>
                                                    <td className="text-danger fw-bold">
                                                        {entry.bed ? Number(entry.bed).toLocaleString() : '-'}
                                                    </td>
                                                    <td className="text-success fw-bold">
                                                        {entry.bes ? Number(entry.bes).toLocaleString() : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={() => setDetailModal(false)}>
                            بستن
                        </Button>
                    </ModalFooter>
                </Modal>
            </Container>
        </div>
    );
}