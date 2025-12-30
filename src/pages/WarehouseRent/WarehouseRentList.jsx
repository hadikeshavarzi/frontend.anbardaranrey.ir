import React, { useState, useEffect } from "react";
import {
    Container, Card, CardBody, Table, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter,
    Row, Col, Label, Input, Spinner, Alert
} from "reactstrap";
import { Link } from "react-router-dom";
import {
    getRentals,
    updateRental,
    deleteRental,
    terminateRental,
    getContractUrl,
    calculateTerminationAmount,
    RENTAL_OPTIONS
} from "../../services/rentalService";
import { toPersianDate, formatNumber } from "../../helpers/utils";
import DatePickerWithIcon from "../../components/Shared/DatePickerWithIcon"; // اطمینان از وجود این کامپوننت
import { toast } from "react-toastify";

export default function WarehouseRentList() {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- State های عمومی مودال‌ها ---
    const [editModal, setEditModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [termModal, setTermModal] = useState(false); // مودال خاتمه

    const [selectedRental, setSelectedRental] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // --- State های اختصاصی خاتمه قرارداد ---
    const [termDate, setTermDate] = useState(new Date().toISOString().slice(0, 10));
    const [calcAmount, setCalcAmount] = useState(0);
    const [generateInvoice, setGenerateInvoice] = useState(true);

    // --- لود لیست ---
    const fetchRentals = async () => {
        setLoading(true);
        const data = await getRentals();
        setRentals(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchRentals();
    }, []);

    // ==================== بخش خاتمه قرارداد (Termination) ====================

    const openTerminationModal = (rental) => {
        setSelectedRental(rental);
        const today = new Date().toISOString().slice(0, 10);
        setTermDate(today);
        setTermModal(true);

        // محاسبه اولیه مبلغ
        const amount = calculateTerminationAmount(rental, today);
        setCalcAmount(amount);
    };

    const handleTermDateChange = (dateIso) => {
        setTermDate(dateIso);
        if (selectedRental) {
            const amount = calculateTerminationAmount(selectedRental, dateIso);
            setCalcAmount(amount);
        }
    };

// ... داخل کامپوننت WarehouseRentList ...

    const handleTerminateSubmit = async () => {
        setActionLoading(true);
        try {
            // ۱. آماده‌سازی داده‌های متنی برای شرح سند
            // تاریخ شروع محاسبه: یا آخرین سند، یا شروع قرارداد
            const startDateRaw = selectedRental.last_invoiced_at || selectedRental.start_date;

            // تبدیل تاریخ‌ها به شمسی
            const fromDatePersian = toPersianDate(startDateRaw);
            const toDatePersian = toPersianDate(termDate);

            // نام انبار و مشتری
            const locationName = selectedRental.location_name || 'نامشخص';
            const customerName = selectedRental.customer?.title || '';

            // ۲. ساخت متن‌های شرح طبق درخواست شما
            const debitDesc = `بدهکار بابت اجاره انبار از تاریخ ${fromDatePersian} تا تاریخ ${toDatePersian} بابت ${locationName}`;

            const creditDesc = `بابت درآمد اجاره انبار ${customerName} ${locationName} از تاریخ ${fromDatePersian} تا تاریخ ${toDatePersian}`;

            // ۳. ارسال به سرویس
            const result = await terminateRental(selectedRental.id, {
                endDate: termDate,
                shouldGenerateInvoice: generateInvoice,
                amount: calcAmount,
                customerId: selectedRental.customer_id,
                description: `تسویه حساب قرارداد (خاتمه در ${toDatePersian})`, // شرح هدر سند
                debitDescription: debitDesc,   // شرح ردیف بدهکار
                creditDescription: creditDesc  // شرح ردیف بستانکار
            });

            if (result.success) {
                toast.success("قرارداد با موفقیت خاتمه یافت و تسویه شد.");
                setTermModal(false);
                fetchRentals(); // رفرش لیست
            } else {
                toast.error("خطا در عملیات: " + result.error);
            }
        } catch (err) {
            console.error(err);
            toast.error("خطای سیستمی");
        } finally {
            setActionLoading(false);
        }
    };
    // ==================== بخش حذف (Delete) ====================

    const confirmDelete = (rental) => {
        setSelectedRental(rental);
        setDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!selectedRental) return;
        setActionLoading(true);
        const result = await deleteRental(selectedRental.id);
        if (result.success) {
            toast.success("قرارداد با موفقیت حذف شد.");
            setRentals(rentals.filter(r => r.id !== selectedRental.id));
            setDeleteModal(false);
        } else {
            toast.error("خطا در حذف قرارداد.");
        }
        setActionLoading(false);
    };

    // ==================== بخش ویرایش (Edit) ====================

    const openEditModal = (rental) => {
        setSelectedRental({ ...rental });
        setEditModal(true);
    };

    const handleEditSubmit = async () => {
        setActionLoading(true);
        try {
            const updates = {
                monthly_rent: Number(selectedRental.monthly_rent),
                location_name: selectedRental.location_name,
                status: selectedRental.status,
                description: selectedRental.description,
                billing_cycle: selectedRental.billing_cycle
            };

            const result = await updateRental(selectedRental.id, updates);
            if (result.success) {
                toast.success("تغییرات ذخیره شد.");
                fetchRentals();
                setEditModal(false);
            } else {
                toast.error("خطا در ویرایش.");
            }
        } catch (err) {
            toast.error("خطای سیستمی.");
        } finally {
            setActionLoading(false);
        }
    };

    // ==================== توابع کمکی UI ====================

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active': return <Badge color="success" className="p-2 font-size-12">فعال (در جریان)</Badge>;
            case 'draft': return <Badge color="warning" className="p-2 font-size-12">پیش‌نویس (موقت)</Badge>;
            case 'terminated': return <Badge color="danger" className="p-2 font-size-12">خاتمه یافته</Badge>;
            case 'expired': return <Badge color="secondary" className="p-2 font-size-12">منقضی شده</Badge>;
            default: return <Badge color="light" className="p-2 font-size-12">{status}</Badge>;
        }
    };

    const getRentalTypeLabel = (typeKey) => {
        const type = RENTAL_OPTIONS.types.find(t => t.value === typeKey);
        return type ? type.label : typeKey;
    };

    return (
        <div className="page-content">
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="fw-bold font-size-18 m-0">لیست قراردادهای اجاره</h4>
                    <Link to="/rent/create" className="btn btn-primary shadow-sm">
                        <i className="bx bx-plus me-1"></i> ثبت قرارداد جدید
                    </Link>
                </div>

                <Card className="shadow-sm border-0">
                    <CardBody>
                        {loading ? (
                            <div className="text-center py-5"><Spinner color="primary" /></div>
                        ) : rentals.length === 0 ? (
                            <div className="text-center py-5 text-muted">هیچ قراردادی ثبت نشده است.</div>
                        ) : (
                            <div className="table-responsive">
                                <Table hover className="align-middle table-nowrap text-center">
                                    <thead className="table-light">
                                    <tr>
                                        <th>ردیف</th>
                                        <th>مشتری</th>
                                        <th>نوع / محل</th>
                                        <th>مبلغ اجاره</th>
                                        <th>تاریخ شروع</th>
                                        <th>آخرین سند</th>
                                        <th>وضعیت</th>
                                        <th>عملیات</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {rentals.map((rental, index) => (
                                        <tr key={rental.id}>
                                            <td>{index + 1}</td>
                                            <td className="fw-bold text-start">{rental.customer?.title || 'نامشخص'}</td>
                                            <td>
                                                <div className="fw-bold text-primary">{getRentalTypeLabel(rental.rental_type)}</div>
                                                <small className="text-muted">{rental.location_name}</small>
                                            </td>
                                            <td className="text-success fw-bold">{formatNumber(rental.monthly_rent)}</td>
                                            <td>{toPersianDate(rental.start_date)}</td>
                                            <td className="text-muted small">
                                                {rental.last_invoiced_at ? toPersianDate(rental.last_invoiced_at) : '---'}
                                            </td>
                                            <td>{getStatusBadge(rental.status)}</td>
                                            <td>
                                                <div className="d-flex gap-2 justify-content-center">
                                                    {/* دکمه خاتمه فقط برای قراردادهای فعال */}
                                                    {rental.status === 'active' && (
                                                        <Button
                                                            color="danger"
                                                            outline
                                                            size="sm"
                                                            onClick={() => openTerminationModal(rental)}
                                                            title="خاتمه قرارداد و تسویه"
                                                        >
                                                            <i className="bx bx-stop-circle"></i>
                                                        </Button>
                                                    )}

                                                    <Button color="warning" size="sm" onClick={() => openEditModal(rental)} title="ویرایش">
                                                        <i className="bx bx-edit"></i>
                                                    </Button>

                                                    {rental.contract_file_url && (
                                                        <a
                                                            href={getContractUrl(rental.contract_file_url)} // ✅ استفاده از تابع برای ساخت لینک صحیح                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="btn btn-info btn-sm"
                                                            title="دانلود قرارداد"
                                                        >
                                                            <i className="bx bx-download"></i>
                                                        </a>
                                                    )}

                                                    <Button color="light" size="sm" onClick={() => confirmDelete(rental)} title="حذف" className="text-danger">
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

                {/* ==================== مودال خاتمه قرارداد (Termination Modal) ==================== */}
                <Modal isOpen={termModal} toggle={() => setTermModal(false)} centered>
                    <ModalHeader className="bg-danger text-white">خاتمه قرارداد و تسویه حساب</ModalHeader>
                    <ModalBody className="p-4">
                        <Alert color="warning" className="d-flex align-items-center">
                            <i className="bx bx-info-circle font-size-24 me-3"></i>
                            <div>
                                <strong>هشدار:</strong> وضعیت قرارداد به "خاتمه یافته" تغییر خواهد کرد و تاریخ پایان ثبت می‌شود.
                            </div>
                        </Alert>

                        <div className="mb-3">
                            <Label className="fw-bold">تاریخ خاتمه (تحویل انبار):</Label>
                            <DatePickerWithIcon
                                value={termDate}
                                onChange={(d) => d?.toDate && handleTermDateChange(d.toDate().toISOString().slice(0, 10))}
                            />
                        </div>

                        <div className="bg-light p-3 rounded border mb-3">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">مبنای محاسبه (تاریخ آخرین سند):</span>
                                <span className="fw-bold" dir="ltr">
                                    {selectedRental?.last_invoiced_at ? toPersianDate(selectedRental.last_invoiced_at) : toPersianDate(selectedRental?.start_date)}
                                </span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                <span className="text-dark">مبلغ قابل پرداخت (روزشمار):</span>
                                <span className="text-success h5 mb-0 fw-bold">{formatNumber(calcAmount)} ریال</span>
                            </div>
                        </div>

                        <div className="form-check form-switch mb-3" dir="ltr">
                            <Input
                                type="checkbox"
                                className="form-check-input"
                                checked={generateInvoice}
                                onChange={(e) => setGenerateInvoice(e.target.checked)}
                                id="genInvoiceSwitch"
                            />
                            <Label className="form-check-label ms-2" for="genInvoiceSwitch">
                                صدور اتوماتیک سند حسابداری (بدهکار کردن مشتری)
                            </Label>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={() => setTermModal(false)}>انصراف</Button>
                        <Button color="danger" onClick={handleTerminateSubmit} disabled={actionLoading}>
                            {actionLoading ? <Spinner size="sm"/> : "تایید خاتمه و تسویه"}
                        </Button>
                    </ModalFooter>
                </Modal>

                {/* ==================== مودال ویرایش (Edit Modal) ==================== */}
                <Modal isOpen={editModal} toggle={() => setEditModal(false)} centered size="lg">
                    <ModalHeader toggle={() => setEditModal(false)}>ویرایش قرارداد</ModalHeader>
                    <ModalBody>
                        {selectedRental && (
                            <Row className="gy-3">
                                <Col md={6}>
                                    <Label>نام مشتری</Label>
                                    <Input value={selectedRental.customer?.title} disabled className="bg-light" />
                                </Col>
                                <Col md={6}>
                                    <Label>وضعیت قرارداد</Label>
                                    <Input type="select" value={selectedRental.status} onChange={(e) => setSelectedRental({...selectedRental, status: e.target.value})}>
                                        <option value="active">فعال</option>
                                        <option value="draft">پیش‌نویس</option>
                                        <option value="terminated">فسخ شده</option>
                                        <option value="expired">منقضی</option>
                                    </Input>
                                </Col>
                                <Col md={6}>
                                    <Label>مبلغ اجاره (ریال)</Label>
                                    <Input
                                        type="number"
                                        value={selectedRental.monthly_rent}
                                        onChange={(e) => setSelectedRental({...selectedRental, monthly_rent: e.target.value})}
                                    />
                                </Col>
                                <Col md={6}>
                                    <Label>محل اجاره</Label>
                                    <Input
                                        value={selectedRental.location_name}
                                        onChange={(e) => setSelectedRental({...selectedRental, location_name: e.target.value})}
                                    />
                                </Col>
                                <Col md={6}>
                                    <Label>دوره پرداخت</Label>
                                    <Input type="select" value={selectedRental.billing_cycle} onChange={(e) => setSelectedRental({...selectedRental, billing_cycle: e.target.value})}>
                                        {RENTAL_OPTIONS.billingCycles.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </Input>
                                </Col>
                                <Col md={12}>
                                    <Label>توضیحات</Label>
                                    <Input
                                        type="textarea"
                                        rows="3"
                                        value={selectedRental.description || ''}
                                        onChange={(e) => setSelectedRental({...selectedRental, description: e.target.value})}
                                    />
                                </Col>
                            </Row>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={() => setEditModal(false)}>انصراف</Button>
                        <Button color="primary" onClick={handleEditSubmit} disabled={actionLoading}>
                            {actionLoading ? <Spinner size="sm"/> : "ذخیره تغییرات"}
                        </Button>
                    </ModalFooter>
                </Modal>

                {/* ==================== مودال حذف (Delete Modal) ==================== */}
                <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} centered size="sm">
                    <ModalHeader className="bg-danger text-white">حذف قرارداد</ModalHeader>
                    <ModalBody className="text-center p-4">
                        <i className="bx bx-error-circle display-4 text-danger mb-3"></i>
                        <h5>آیا مطمئن هستید؟</h5>
                        <p className="text-muted">این عملیات قابل بازگشت نیست.</p>
                    </ModalBody>
                    <ModalFooter className="justify-content-center">
                        <Button color="light" onClick={() => setDeleteModal(false)}>خیر</Button>
                        <Button color="danger" onClick={handleDelete} disabled={actionLoading}>
                            {actionLoading ? "در حال حذف..." : "بله، حذف شود"}
                        </Button>
                    </ModalFooter>
                </Modal>

            </Container>
        </div>
    );
}