import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Container, Card, CardBody, Row, Col, Button, Table, Input, Label, CardTitle, Alert, Badge, InputGroup
} from "reactstrap";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";
import { findExitOrLoadingOrder, createExitPermit } from "../../services/exitService";
import DatePickerWithIcon from "../../components/Shared/DatePickerWithIcon";
import PlateDisplay from "../../components/PlateDisplay";
import { QRCodeSVG } from "qrcode.react";

export default function ExitCreate() {
    const [searchParams] = useSearchParams();

    // --- States ---
    const [searchNo, setSearchNo] = useState("");
    const [loading, setLoading] = useState(false);
    const [orderInfo, setOrderInfo] = useState(null);
    const [items, setItems] = useState([]);
    const [savedExitId, setSavedExitId] = useState(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [exitStatusMsg, setExitStatusMsg] = useState(null);
    const [isMonthlyCalc, setIsMonthlyCalc] = useState(true);

    // --- Form Fields ---
    const [exitDate, setExitDate] = useState(new Date().toISOString().slice(0, 10));
    const [referenceNo, setReferenceNo] = useState("");
    const [driverNationalCode, setDriverNationalCode] = useState("");
    const [weighbridgeFee, setWeighbridgeFee] = useState(0);
    const [extraFee, setExtraFee] = useState(0);
    const [extraDesc, setExtraDesc] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("credit");

    // Print
    const handlePrint = () => {
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const handleTaxSystem = () => toast.info("در حال ارسال به سامانه مودیان...");

    // --- تابع اصلی دریافت اطلاعات ---
    const fetchOrderData = useCallback(async (searchNumber) => {
        setLoading(true);
        // پاکسازی استیت‌ها
        setExitStatusMsg(null);
        setSavedExitId(null);
        setIsReadOnly(false);
        setOrderInfo(null);
        setItems([]);

        try {
            const result = await findExitOrLoadingOrder(searchNumber);

            // اگر سرویس نال برگرداند
            if (!result) {
                throw new Error("سندی با این شماره یافت نشد.");
            }

            setOrderInfo({
                loading_id: result.loading_id, orderNo: result.order_no,
                driver: result.driver_name, plate: result.plate_number, customer: result.customer_name
            });

            if (result.is_processed) {
                setSavedExitId(result.exit_id);
                setDriverNationalCode(result.driver_national_code || "");
                setWeighbridgeFee(result.weighbridge_fee || 0);
                setExtraFee(result.extra_fee || 0);
                setExtraDesc(result.extra_description || "");
                setPaymentMethod(result.payment_method || "credit");
                setReferenceNo(result.reference_no || "");
                if(result.exit_date) setExitDate(result.exit_date);
                setItems(result.items);

                if (result.status === 'final') {
                    setIsReadOnly(true);
                    setExitStatusMsg(`سند خروج قطعی شماره ${result.exit_id}`);
                } else {
                    setIsReadOnly(false);
                    setExitStatusMsg(`پیش‌نویس ثبت شده شماره ${result.exit_id}`);
                }
            } else {
                setSavedExitId(null); setIsReadOnly(false); setExitStatusMsg(null);
                setItems(result.items);
                setDriverNationalCode(""); setWeighbridgeFee(0); setExtraFee(0); setReferenceNo("");
            }
        } catch (err) {
            console.error(err);
            toast.error(err.message || "خطا در یافتن اطلاعات.");
        } finally {
            setLoading(false);
        }
    }, []);

    // --- ✅ هندلر دکمه جستجو و اینتر (ولیدیشن اینجا انجام می‌شود) ---
    const handleManualSearch = () => {
        // 1. بررسی خالی بودن
        if (!searchNo || String(searchNo).trim() === "") {
            toast.warn("لطفاً شماره سفارش یا شناسه خروج را وارد کنید.");
            return;
        }
        // 2. ارسال به تابع اصلی
        fetchOrderData(searchNo);
    };

    // --- هندلر دکمه اینتر ---
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // جلوگیری از رفرش
            handleManualSearch();
        }
    };

    // --- دریافت پارامتر از URL ---
    useEffect(() => {
        const urlOrderNo = searchParams.get("orderNo");
        if (urlOrderNo) {
            setSearchNo(urlOrderNo);
            fetchOrderData(urlOrderNo);
        }
    }, [searchParams, fetchOrderData]);


    // --- Helper: Parse Plate ---
    const parsePlateString = (plateStr) => {
        if (!plateStr) return null;
        const parts = plateStr.split('-');
        if (parts.length === 4) {
            return { iranRight: parts[0], mid3: parts[1], letter: parts[2], left2: parts[3] };
        }
        return null;
    };

    // --- Calculations ---
    const calculateDuration = (entryDateStr, exitDateStr) => {
        if (!entryDateStr || !exitDateStr) return { months: 1, days: 0 };
        const start = new Date(entryDateStr);
        const end = new Date(exitDateStr);
        const diffTime = end - start;
        const diffDaysRaw = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffDays = diffDaysRaw >= 0 ? diffDaysRaw : 0;
        let months = 1;
        if (diffDays > 30) months = Math.ceil(diffDays / 30);
        return { months, days: diffDays };
    };

    const calculatedItems = useMemo(() => {
        return items.map(item => {
            const wFull = Number(item.weight_full) || 0;
            const wEmpty = Number(item.weight_empty) || 0;
            const net = (wFull >= wEmpty) ? (wFull - wEmpty) : 0;
            let base = (item.fee_type === 'quantity') ? (Number(item.qty) || 0) : net;

            let timeMultiplier = 1;
            let durationInfo = { months: 1, days: 0 };

            if (isMonthlyCalc && item.entry_date) {
                durationInfo = calculateDuration(item.entry_date, exitDate);
                timeMultiplier = durationInfo.months;
            }

            return {
                ...item,
                weight_net: net,
                row_storage_fee: base * (Number(item.base_storage_rate) || 0) * timeMultiplier,
                row_loading_fee: base * (Number(item.base_loading_rate) || 0),
                months_duration: durationInfo.months,
                days_duration: durationInfo.days,
                cleared_weight: Number(item.cleared_weight) || 0
            };
        });
    }, [items, exitDate, isMonthlyCalc]);

    const handleItemChange = (index, field, value) => {
        if (isReadOnly) return;
        const newItems = [...items];
        newItems[index][field] = Number(value) || 0;
        setItems(newItems);
    };

    const invoice = useMemo(() => {
        const totalStorage = calculatedItems.reduce((acc, i) => acc + (Number(i.row_storage_fee) || 0), 0);
        const totalLoading = calculatedItems.reduce((acc, i) => acc + (Number(i.row_loading_fee) || 0), 0);
        const subTotal = totalStorage + totalLoading + Number(weighbridgeFee) + Number(extraFee);
        const vatAmount = subTotal * 0.10;
        return { totalStorage, totalLoading, subTotal, vatAmount, grandTotal: subTotal + vatAmount };
    }, [calculatedItems, weighbridgeFee, extraFee]);

    const handleSubmit = async (status) => {
        if (!orderInfo || isReadOnly) return;
        if (!driverNationalCode) return toast.error("کد ملی راننده الزامی است.");
        setLoading(true);
        try {
            const payload = {
                loading_order_id: orderInfo.loading_id,
                exit_date: exitDate,
                reference_no: referenceNo,
                driver_national_code: driverNationalCode,
                weighbridge_fee: Number(weighbridgeFee),
                extra_fee: Number(extraFee),
                extra_description: extraDesc,
                vat_fee: invoice.vatAmount,
                total_fee: invoice.totalStorage,
                total_loading_fee: invoice.totalLoading,
                payment_method: paymentMethod,
                status: status,
                items: calculatedItems
            };
            const res = await createExitPermit(payload);
            toast.success(status === 'final' ? "خروج نهایی شد." : "پیش‌نویس ذخیره شد.");
            setSavedExitId(res.id);
            if (status === 'final') { setIsReadOnly(true); setExitStatusMsg(`سند خروج قطعی شماره ${result.exit_id}`); }
            else setExitStatusMsg(`پیش‌نویس ثبت شده شماره ${res.id}`);
        } catch (err) { toast.error("خطا در ثبت."); } finally { setLoading(false); }
    };

    const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/exit/view/${savedExitId || 0}` : '';

    return (
        <div className="page-content-wrapper">

            <style>{`
                @media screen {
                    .print-only-section { display: none !important; }
                }
                @media print {
                    @page { size: auto; margin: 5mm; }
                    body * { visibility: hidden; }
                    .page-content, .navbar, .sidebar, .footer { display: none !important; }
                    
                    .print-only-section, .print-only-section * { visibility: visible !important; }
                    
                    .print-only-section {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background-color: white;
                        z-index: 99999;
                        padding: 10px;
                        font-size: 10px;
                    }

                    .print-container-frame {
                        display: flex;
                        flex-direction: column;
                        border: 2px solid #000 !important;
                        border-radius: 8px;
                        padding: 10px;
                        background: white;
                    }
                    
                    .print-table td, .print-table th { 
                        padding: 3px !important; 
                        white-space: nowrap;
                    }
                }
            `}</style>

            {/* ============================================== */}
            {/* 🖨️ بخش پرینت (Invoice) */}
            {/* ============================================== */}
            <div className="print-only-section" style={{direction: 'rtl', fontFamily: 'Tahoma, Arial'}}>
                {orderInfo ? (
                    <div className="print-container-frame">

                        <div>
                            {/* Header */}
                            <header className="d-flex justify-content-between align-items-center border-bottom border-dark pb-2 mb-2">
                                <div style={{width: '80px'}}>
                                    <QRCodeSVG value={qrUrl} size={70} />
                                </div>
                                <div className="text-center flex-grow-1">
                                    <h3 className="fw-bold m-0" style={{fontSize: '16px'}}>صورتحساب خدمات انبارداری و توزین</h3>
                                    <h5 className="text-secondary mt-1" style={{fontSize: '11px'}}>مجتمع انبارداری و خدمات لجستیک ری</h5>
                                </div>
                                <div className="text-start" style={{minWidth: '140px', fontSize: '10px'}}>
                                    <div className="mb-1">شماره سند: <span className="fw-bold font-size-12">{savedExitId || "---"}</span></div>
                                    <div>تاریخ: <span className="fw-bold">{new Date(exitDate).toLocaleDateString('fa-IR')}</span></div>
                                </div>
                            </header>

                            {/* Info Box */}
                            <section className="border border-secondary rounded p-2 mb-2 bg-light" style={{fontSize: '11px'}}>
                                <div className="row g-1">
                                    <div className="col-4 d-flex"><span className="text-muted ms-2">صاحب کالا:</span><span className="fw-bold">{orderInfo.customer}</span></div>
                                    <div className="col-4 d-flex"><span className="text-muted ms-2">نام راننده:</span><span className="fw-bold">{orderInfo.driver}</span></div>
                                    <div className="col-4 d-flex"><span className="text-muted ms-2">کد ملی:</span><span className="fw-bold">{driverNationalCode}</span></div>
                                    <div className="col-4 d-flex"><span className="text-muted ms-2">پلاک:</span><span className="fw-bold" dir="ltr">{orderInfo.plate}</span></div>
                                    <div className="col-4 d-flex"><span className="text-muted ms-2">ش بارگیری:</span><span className="fw-bold">{orderInfo.orderNo}</span></div>
                                    <div className="col-4 d-flex"><span className="text-muted ms-2">ش عطف:</span><span className="fw-bold">{referenceNo}</span></div>
                                </div>
                            </section>

                            {/* Items Table */}
                            <section className="mb-2">
                                <table className="table table-bordered border-dark table-sm text-center align-middle w-100 print-table">
                                    <thead className="table-secondary border-dark">
                                    <tr>
                                        <th style={{width: '5%'}}>#</th>
                                        <th>شرح کالا</th>
                                        <th>بچ نامبر</th>
                                        <th>تعداد</th>
                                        {isMonthlyCalc && <th>ورود</th>}
                                        {isMonthlyCalc && <th>مدت</th>}
                                        <th>وزن خالص</th>
                                        <th>وزن حواله</th>
                                        <th>مغایرت</th>
                                        <th>نرخ پایه</th>
                                        <th>مبلغ کل</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {calculatedItems.map((item, idx) => {
                                        const variance = (item.weight_net || 0) - (item.cleared_weight || 0);
                                        return (
                                            <tr key={idx}>
                                                <td>{idx + 1}</td>
                                                <td className="text-start fw-bold text-truncate" style={{maxWidth:'150px'}}>{item.product_name}</td>
                                                <td className="font-monospace" dir="ltr">{item.batch_no || "-"}</td>
                                                <td>{item.qty}</td>

                                                {isMonthlyCalc && <td>{item.entry_date ? new Date(item.entry_date).toLocaleDateString('fa-IR') : '-'}</td>}
                                                {isMonthlyCalc && <td>{item.months_duration} ماه</td>}

                                                <td className="fw-bold">{Number(item.weight_net).toLocaleString()}</td>
                                                <td>{Number(item.cleared_weight).toLocaleString()}</td>
                                                <td dir="ltr" className={variance !== 0 ? "fw-bold" : ""}>{variance > 0 ? `+${variance}` : variance}</td>

                                                <td>{Number(item.base_storage_rate).toLocaleString()}</td>
                                                <td className="fw-bold">{Number(item.row_storage_fee).toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </section>
                        </div>

                        {/* Footer */}
                        <div>
                            <footer className="row g-0 mt-0">
                                <div className="col-7 pe-2 d-flex flex-column justify-content-between">
                                    <div style={{fontSize: '10px'}} className="mb-1">
                                        <span className="fw-bold">روش تسویه:</span>
                                        <span className="border border-dark px-1 rounded ms-1">{paymentMethod === 'credit' ? 'نسیه' : 'نقدی/کارتخوان'}</span>
                                        {extraDesc && <span className="ms-2 text-muted">({extraDesc})</span>}
                                    </div>
                                    <div className="d-flex justify-content-around align-items-end mt-2" style={{fontSize: '10px'}}>
                                        <div className="text-center w-25"><p className="mb-3 fw-bold">راننده</p><div className="border-bottom border-dark"></div></div>
                                        <div className="text-center w-25"><p className="mb-3 fw-bold">انباردار</p><div className="border-bottom border-dark"></div></div>
                                        <div className="text-center w-25"><p className="mb-3 fw-bold">انتظامات</p><div className="border-bottom border-dark"></div></div>
                                    </div>
                                </div>
                                <div className="col-5">
                                    <div className="border border-dark rounded overflow-hidden">
                                        <table className="table table-sm table-borderless mb-0" style={{fontSize: '10px'}}>
                                            <tbody>
                                            <tr><td className="text-muted py-0">جمع انبارداری:</td><td className="text-end fw-bold py-0">{Number(invoice.totalStorage).toLocaleString()}</td></tr>
                                            <tr><td className="text-muted py-0">جمع بارگیری:</td><td className="text-end fw-bold py-0">{Number(invoice.totalLoading).toLocaleString()}</td></tr>
                                            <tr><td className="text-muted py-0">جانبی:</td><td className="text-end fw-bold py-0">{Number(Number(weighbridgeFee) + Number(extraFee)).toLocaleString()}</td></tr>
                                            <tr className="border-top border-dark"><td className="text-danger py-0">مالیات (10%):</td><td className="text-end text-danger fw-bold py-0">{Number(invoice.vatAmount).toLocaleString()}</td></tr>
                                            <tr className="bg-dark text-white"><td className="py-1">قابل پرداخت:</td><td className="text-end py-1 fw-bold" style={{fontSize: '12px'}}>{Number(invoice.grandTotal).toLocaleString()}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </footer>
                            <div className="text-center mt-2 border-top pt-1 text-muted" style={{fontSize: '9px'}}>این برگه به صورت سیستمی صادر شده و فاقد اعتبار قانونی بدون مهر می‌باشد.</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center mt-5">اطلاعاتی برای چاپ وجود ندارد.</div>
                )}
            </div>

            {/* ============================================== */}
            {/* 🖥️ بخش فرم اصلی (Screen) */}
            {/* ============================================== */}
            <Container fluid className="screen-content">
                <div className="d-print-none">
                    <Row><Col xs={12}><h4 className="mb-4 font-size-18 fw-bold">مدیریت خروج و باسکول</h4></Col></Row>
                </div>

                <Card className="mb-3 shadow-sm border-0 d-print-none">
                    <CardBody>
                        <Row className="align-items-center gy-3">
                            {/* فیلد جستجو و دکمه چسبیده */}
                            <Col md={5} xs={12}>
                                <div className="d-flex align-items-center">
                                    <InputGroup className="shadow-sm">
                                        <Input
                                            className="text-center fw-bold font-size-16"
                                            value={searchNo}
                                            onChange={e=>setSearchNo(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="شماره سفارش یا خروج..."
                                        />
                                        <Button color="primary" onClick={handleManualSearch} disabled={loading} className="px-4">
                                            {loading ? <i className="bx bx-loader bx-spin"></i> : <i className="bx bx-search-alt"></i>}
                                        </Button>
                                    </InputGroup>
                                </div>
                            </Col>

                            {/* سوییچ هوشمند */}
                            <Col md={7} xs={12} className="d-flex justify-content-md-end justify-content-center">
                                <div className="d-flex align-items-center gap-2 p-2 px-3 rounded border shadow-sm bg-white">
                                    <span
                                        className={`fw-bold font-size-13 cursor-pointer ${!isMonthlyCalc ? 'text-danger' : 'text-muted'}`}
                                        onClick={() => setIsMonthlyCalc(false)}
                                        style={{cursor: 'pointer'}}
                                    >
                                        ساده
                                    </span>
                                    <div
                                        onClick={() => setIsMonthlyCalc(!isMonthlyCalc)}
                                        style={{
                                            width: '50px', height: '26px', borderRadius: '13px',
                                            backgroundColor: isMonthlyCalc ? '#0d6efd' : '#dc3545',
                                            cursor: 'pointer', position: 'relative',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        <div style={{
                                            width: '22px', height: '22px', borderRadius: '50%',
                                            backgroundColor: 'white', position: 'absolute',
                                            top: '2px', left: isMonthlyCalc ? '26px' : '2px',
                                            transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }}/>
                                    </div>
                                    <span
                                        className={`fw-bold font-size-13 cursor-pointer ${isMonthlyCalc ? 'text-primary' : 'text-muted'}`}
                                        onClick={() => setIsMonthlyCalc(true)}
                                        style={{cursor: 'pointer'}}
                                    >
                                        هوشمند (ماهانه)
                                    </span>
                                </div>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {exitStatusMsg && (
                    <Alert color={isReadOnly ? "success" : "info"} className="fw-bold shadow-sm d-print-none">
                        <i className={`bx ${isReadOnly ? 'bx-lock-alt' : 'bx-edit'} font-size-18 align-middle me-2`}></i>
                        {exitStatusMsg}
                    </Alert>
                )}

                {orderInfo && (
                    <div className="animate__animated animate__fadeIn">
                        {/* Header Info */}
                        <Card className="shadow-sm border-0 mb-3">
                            <CardBody>
                                <CardTitle className="h5 mb-4 text-primary border-bottom pb-2">۱. مشخصات خروج و راننده</CardTitle>
                                <Row className="gy-4">
                                    <Col md={3}><Label className="fw-bold text-muted font-size-13">تاریخ خروج</Label><div style={{direction: 'rtl'}}><DatePickerWithIcon value={exitDate} onChange={d => setExitDate(d.toDate().toISOString().slice(0, 10))} disabled={isReadOnly} /></div></Col>
                                    <Col md={3}><Label className="fw-bold text-muted font-size-13">شماره عطف / بارنامه</Label><Input value={referenceNo} onChange={e => setReferenceNo(e.target.value)} disabled={isReadOnly} /></Col>
                                    <Col md={3}><Label className="fw-bold text-muted font-size-13">نام راننده</Label><Input value={orderInfo.driver} disabled className="bg-light" /></Col>
                                    <Col md={3}><Label className="fw-bold text-danger font-size-13">کد ملی راننده *</Label><Input value={driverNationalCode} onChange={e => setDriverNationalCode(e.target.value)} disabled={isReadOnly} /></Col>
                                    <Col md={3}>
                                        <Label className="fw-bold text-muted font-size-13">پلاک خودرو</Label>
                                        <div className="d-flex align-items-center justify-content-center" style={{minHeight:'45px'}}>
                                            {parsePlateString(orderInfo.plate) ? <div style={{transform: 'scale(0.85)', transformOrigin: 'center'}}><PlateDisplay plateData={parsePlateString(orderInfo.plate)} /></div> : <div className="form-control bg-light text-center fw-bold">{orderInfo.plate || "---"}</div>}
                                        </div>
                                    </Col>
                                    <Col md={3}><Label className="fw-bold text-muted font-size-13">صاحب کالا</Label><Input value={orderInfo.customer} disabled className="bg-light" /></Col>
                                </Row>
                            </CardBody>
                        </Card>

                        {/* Items Table - Screen */}
                        <Card className="shadow-sm border-0 mb-3">
                            <CardBody>
                                <CardTitle className="h5 mb-4 text-primary border-bottom pb-2">۲. جزئیات کالا و توزین باسکول</CardTitle>
                                <div className="table-responsive">
                                    <Table bordered hover className="text-center align-middle table-nowrap mb-0 table-sm">
                                        <thead className="table-light">
                                        <tr>
                                            <th style={{width: '50px'}}>#</th>
                                            <th>شرح کالا</th>
                                            <th>مبنا</th>
                                            <th>نرخ پایه (ریال)</th>
                                            <th style={{width: '80px'}}>تعداد</th>
                                            {isMonthlyCalc && <th className="bg-soft-info text-dark" style={{width: '130px'}}>مدت توقف</th>}
                                            <th className="bg-soft-primary text-primary" style={{width: '110px'}}>وزن پر (kg)</th>
                                            <th className="bg-soft-primary text-primary" style={{width: '110px'}}>وزن خالی (kg)</th>
                                            <th className="bg-soft-warning text-dark" style={{width: '120px'}}>وزن خالص</th>
                                            {/* ✅ ستون وزن حواله در UI */}
                                            <th style={{width: '120px'}}>وزن حواله</th>
                                            <th>مغایرت</th>
                                            <th>جمع انبارداری</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {calculatedItems.map((item, idx) => {
                                            const variance = (item.weight_net || 0) - (item.cleared_weight || 0);
                                            return (
                                                <tr key={idx}>
                                                    <td>{idx + 1}</td>
                                                    <td className="text-start">
                                                        <div className="fw-bold font-size-14 text-dark">{item.product_name}</div>
                                                        <div className="text-muted font-size-11">Batch: {item.batch_no}</div>
                                                        {isMonthlyCalc && item.entry_date && <div className="font-size-11 text-info mt-1 d-print-none"><i className="bx bx-calendar me-1"></i>ورود: {new Date(item.entry_date).toLocaleDateString('fa-IR')}</div>}
                                                    </td>
                                                    <td><Badge className={"font-size-11 p-2 badge-soft-" + (item.fee_type === 'quantity' ? 'info' : 'secondary')}>{item.fee_type === 'quantity' ? 'تعدادی' : 'وزنی'}</Badge></td>
                                                    <td className="text-muted font-size-13">{Number(item.base_storage_rate).toLocaleString()}</td>

                                                    <td className="text-center"><Input type="number" bsSize="sm" className="text-center fw-bold" value={item.qty || ''} onChange={e => handleItemChange(idx, 'qty', e.target.value)} disabled={isReadOnly} style={{width: '60px', margin: '0 auto'}} /></td>

                                                    {isMonthlyCalc && (
                                                        <td className="bg-soft-info">
                                                            <div className="fw-bold text-dark">{item.months_duration} ماه</div>
                                                            <div className="font-size-11 text-muted d-print-none">({item.days_duration} روز)</div>
                                                        </td>
                                                    )}
                                                    <td><Input type="number" bsSize="sm" className="text-center fw-bold" value={item.weight_full || ''} onChange={e=>handleItemChange(idx,'weight_full',e.target.value)} disabled={isReadOnly} /></td>
                                                    <td><Input type="number" bsSize="sm" className="text-center fw-bold" value={item.weight_empty || ''} onChange={e=>handleItemChange(idx,'weight_empty',e.target.value)} disabled={isReadOnly} /></td>
                                                    <td className="fw-bold bg-soft-warning font-size-15">{Number(item.weight_net).toLocaleString()}</td>

                                                    {/* ✅ نمایش وزن حواله */}
                                                    <td className="fw-bold text-secondary font-size-14">{Number(item.cleared_weight).toLocaleString()}</td>

                                                    <td dir="ltr">{variance !== 0 ? <Badge color={variance > 0 ? "danger" : "success"} className="font-size-12">{variance > 0 ? `+${variance}` : variance}</Badge> : <span className="text-muted">-</span>}</td>
                                                    <td className="fw-bold text-success font-size-14 bg-light">{Number(item.row_storage_fee).toLocaleString()}</td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </Table>

                                    {isMonthlyCalc && (
                                        <div className="alert alert-info d-flex align-items-center mt-3 p-2 font-size-13 mb-0 rounded shadow-sm border-0 d-print-none">
                                            <i className="bx bx-info-circle font-size-20 me-2"></i>
                                            <div><strong>فرمول محاسبه:</strong> (وزن خالص یا تعداد × نرخ پایه × تعداد ماه). هر ۳۰ روز توقف معادل یک ماه کامل محاسبه می‌گردد.</div>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>

                        {/* Financials & Actions */}
                        <Row>
                            <Col lg={8}>
                                <Card className="shadow-sm border-0 h-100">
                                    <CardBody>
                                        <CardTitle className="h5 mb-4 text-primary border-bottom pb-2">۳. اطلاعات مالی و پرداخت</CardTitle>
                                        <Row className="gy-3 mb-4">
                                            <Col md={4}><Label className="text-muted">هزینه باسکول</Label><Input type="number" value={weighbridgeFee} onChange={e=>setWeighbridgeFee(e.target.value)} disabled={isReadOnly}/></Col>
                                            <Col md={4}><Label className="text-muted">هزینه متفرقه</Label><Input type="number" value={extraFee} onChange={e=>setExtraFee(e.target.value)} disabled={isReadOnly}/></Col>
                                            <Col md={4}><Label className="text-muted">توضیحات هزینه</Label><Input value={extraDesc} onChange={e=>setExtraDesc(e.target.value)} disabled={isReadOnly}/></Col>
                                        </Row>
                                        <div className="bg-light p-3 rounded border">
                                            <Label className="fw-bold mb-3 d-block text-dark">روش تسویه حساب:</Label>
                                            <div className="d-flex flex-wrap gap-4">
                                                {['credit', 'pos', 'cash'].map(m => (
                                                    <div key={m} className="form-check cursor-pointer" onClick={() => !isReadOnly && setPaymentMethod(m)}>
                                                        <Input type="radio" className="form-check-input" checked={paymentMethod === m} readOnly />
                                                        <Label className="form-check-label fw-bold ms-1 cursor-pointer text-dark">
                                                            {m === 'credit' ? 'نسیه (حساب مشتری)' : m === 'pos' ? 'کارتخوان' : 'نقدی'}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>

                            <Col lg={4}>
                                <Card className="border-0 shadow-lg h-100">
                                    <CardBody className="p-4 d-flex flex-column justify-content-between">
                                        <div>
                                            <CardTitle className="h5 mb-4 text-center fw-bold">خلاصه فاکتور</CardTitle>
                                            <div className="table-responsive">
                                                <table className="table table-borderless table-sm mb-0">
                                                    <tbody>
                                                    <tr><td className="text-muted">جمع انبارداری:</td><td className="text-end fw-bold font-size-14">{Number(invoice.totalStorage).toLocaleString()}</td></tr>
                                                    <tr><td className="text-muted">جمع بارگیری:</td><td className="text-end fw-bold font-size-14">{Number(invoice.totalLoading).toLocaleString()}</td></tr>
                                                    <tr><td className="text-muted">باسکول و متفرقه:</td><td className="text-end fw-bold font-size-14">{Number(Number(weighbridgeFee) + Number(extraFee)).toLocaleString()}</td></tr>
                                                    <tr className="border-top border-bottom">
                                                        <td className="py-2 text-danger">مالیات و عوارض (10%):</td>
                                                        <td className="text-end fw-bold py-2 text-danger">{Number(invoice.vatAmount).toLocaleString()}</td>
                                                    </tr>
                                                    <tr className="font-size-18 bg-soft-primary">
                                                        <td className="pt-3 text-primary fw-bold ps-2">مبلغ نهایی:</td>
                                                        <td className="text-end pt-3 text-primary fw-bold pe-2">{Number(invoice.grandTotal).toLocaleString()} <small className="font-size-12">ریال</small></td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div className="d-grid gap-2 mt-4 d-print-none">
                                            {!isReadOnly ? (
                                                <>
                                                    <Button color="success" size="lg" className="shadow-lg" onClick={() => handleSubmit('final')} disabled={loading}>
                                                        <i className="bx bx-check-double font-size-20 align-middle me-2"></i> ثبت نهایی و خروج
                                                    </Button>
                                                    <Button color="secondary" outline onClick={() => handleSubmit('draft')} disabled={loading}>
                                                        <i className="bx bx-save font-size-18 align-middle me-2"></i> ذخیره موقت
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button color="warning" size="lg" className="shadow-lg" onClick={handlePrint}>
                                                        <i className="bx bx-printer font-size-18 align-middle me-2"></i> چاپ برگه خروج
                                                    </Button>
                                                    <Button color="info" outline className="mt-2" onClick={handleTaxSystem}>
                                                        <i className="bx bx-cloud-upload font-size-18 align-middle me-2"></i> ارسال به سامانه مودیان
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                )}
            </Container>
        </div>
    );
}