import React, { useState, useEffect } from "react";
import {
    Container, Card, CardBody, Row, Col, Button, Input, Label, CardTitle,
    Spinner, InputGroup, FormText, Alert
} from "reactstrap";
import Select from "react-select";
import { requestOtp, verifyOtp } from "../../services/auth";
import { getRentalCustomers, createRental, uploadContractFile, RENTAL_OPTIONS } from "../../services/rentalService";
import DatePickerWithIcon from "../../components/Shared/DatePickerWithIcon";
import { formatNumber, toPersianDate } from "../../helpers/utils";
import { toast } from "react-toastify";

export default function WarehouseRentCreate() {
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [isVerified, setIsVerified] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [loadingCustomers, setLoadingCustomers] = useState(true);

    // --- وضعیت فرم ---
    const [formData, setFormData] = useState({
        customer: null,
        startDate: new Date().toISOString().slice(0, 10),
        monthlyRent: "",
        locationName: "",
        rentalType: "shed", // پیش‌فرض سوله
        rentalDetails: { metrage: "", containerSize: "" },
        description: "",
        notifications: [],
        billingCycle: "monthly",
        verificationCode: "",
        contractFile: null,
        manualMobile: ""
    });

    // --- بارگذاری لیست مشتریان ---
    useEffect(() => {
        const fetchCustomers = async () => {
            setLoadingCustomers(true);
            try {
                const customersData = await getRentalCustomers();
                const customerList = customersData.map(c => ({
                    value: c.id,
                    label: c.title,
                    mobile: c.mobile,
                    originalId: c.original_customer_id
                }));
                setCustomers(customerList);
            } catch (err) {
                console.error("Error loading customers:", err);
                toast.error("خطا در بارگذاری لیست مشتریان");
            } finally {
                setLoadingCustomers(false);
            }
        };
        fetchCustomers();
    }, []);

    // --- هندلرها ---
    const handleRentalTypeChange = (type) => {
        setFormData({
            ...formData,
            rentalType: type,
            rentalDetails: { metrage: "", containerSize: "" }
        });
    };

    const handleNotifToggle = (period) => {
        const current = formData.notifications;
        const updated = current.includes(period)
            ? current.filter(p => p !== period)
            : [...current, period];
        setFormData({ ...formData, notifications: updated });
    };

    const getCustomerMobile = () => {
        return formData.customer?.mobile || formData.manualMobile || null;
    };

    // --- مدیریت پیامک ---
    const handleVerify = async () => {
        if (!formData.customer) return toast.warn("لطفاً ابتدا مشتری را انتخاب کنید.");
        const mobile = getCustomerMobile();
        if (!mobile || mobile.length < 10) return toast.error("شماره موبایل نامعتبر است.");

        setLoading(true);
        try {
            if (!otpSent) {
                const res = await requestOtp(mobile, {
                    owner: formData.customer.label,
                    type: "قرارداد اجاره",
                    amount: formatNumber(formData.monthlyRent)
                });
                if (res && (res.success || res.status === 200)) {
                    setOtpSent(true);
                    toast.info(`کد تایید به ${mobile} پیامک شد.`);
                } else toast.error("خطا در ارسال پیامک.");
            } else {
                if (!formData.verificationCode) return toast.warn("کد را وارد کنید.");
                const verifyRes = await verifyOtp(mobile, formData.verificationCode);
                if (verifyRes.success || verifyRes.token) {
                    setIsVerified(true);
                    toast.success("هویت مشتری تایید شد.");
                } else toast.error("کد تایید اشتباه است.");
            }
        } catch (err) {
            toast.error("خطا در سیستم پیامکی.");
        } finally {
            setLoading(false);
        }
    };

    // --- آپلود فایل ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const result = await uploadContractFile(file);
            if (result.success) {
                setFormData({ ...formData, contractFile: result.path });
                toast.success("فایل قرارداد آپلود شد.");
            } else throw new Error(result.error);
        } catch (error) {
            toast.error("خطا در آپلود فایل.");
        } finally {
            setUploading(false);
        }
    };

    // --- ثبت نهایی ---
    const handleSubmit = async (isDraft) => {
        if (!isDraft && !isVerified) return toast.warn("برای ثبت دائم تاییدیه الزامی است.");
        if (!formData.customer || !formData.monthlyRent) return toast.error("فیلدهای ضروری را پر کنید.");

        setLoading(true);
        try {
            const rentalPayload = {
                customer_id: formData.customer.value,
                start_date: formData.startDate,
                monthly_rent: formData.monthlyRent,
                location_name: formData.locationName,
                rental_type: formData.rentalType,
                rental_details: formData.rentalDetails,
                notification_config: formData.notifications,
                billing_cycle: formData.billingCycle,
                contract_file_url: formData.contractFile,
                description: formData.description,
                is_verified: !isDraft
            };

            const result = await createRental(rentalPayload);
            if (result.success) {
                toast.success(isDraft ? "پیش‌نویس ذخیره شد." : "قرارداد فعال شد.");
                setFormData({
                    customer: null,
                    startDate: new Date().toISOString().slice(0, 10),
                    monthlyRent: "",
                    locationName: "",
                    rentalType: "shed",
                    rentalDetails: { metrage: "", containerSize: "" },
                    description: "",
                    notifications: [],
                    billingCycle: "monthly",
                    verificationCode: "",
                    contractFile: null,
                    manualMobile: ""
                });
                setIsVerified(false);
                setOtpSent(false);
            } else throw new Error(result.error);
        } catch (err) {
            toast.error("خطا: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- هندلر تاریخ (رفع مشکل اختلاف ساعت) ---
    const handleDateChange = (d) => {
        if (d) {
            const date = d.toDate ? d.toDate() : new Date(d);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            // ساخت دستی رشته تاریخ برای جلوگیری از تغییر روز
            setFormData({ ...formData, startDate: `${year}-${month}-${day}` });
        }
    };

    // --- تابع چاپ حرفه‌ای ---
// --- تابع چاپ حرفه‌ای (اصلاح شده) ---
// --- تابع چاپ حرفه‌ای (با تاریخ شمسی) ---
    const handlePrint = () => {
        // دریافت لیبل‌های فارسی
        const rentalTypeLabel = RENTAL_OPTIONS.types.find(t => t.value === formData.rentalType)?.label || formData.rentalType;
        const billingLabel = RENTAL_OPTIONS.billingCycles.find(b => b.value === formData.billingCycle)?.label || formData.billingCycle;

        // تبدیل تاریخ‌ها به شمسی
        const todayPersian = toPersianDate(new Date()); // تاریخ امروز
        const startDatePersian = toPersianDate(formData.startDate); // تاریخ شروع قرارداد

        const printContent = `
            <!DOCTYPE html>
            <html dir="rtl" lang="fa">
            <head>
                <meta charset="UTF-8">
                <title>قرارداد اجاره</title>
                <style>
                    @media print {
                        @page { size: A4; margin: 20mm; }
                    }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        font-family: 'Tahoma', 'Segoe UI', Arial, sans-serif;
                        font-size: 13px;
                        line-height: 1.8;
                        direction: rtl;
                        color: #000;
                        background: #fff;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    .header h1 { font-size: 18px; margin-bottom: 5px; font-weight: bold; }
                    .header p { font-size: 11px; color: #444; }
                    
                    .section { margin-bottom: 20px; }
                    .section h3 {
                        font-size: 14px;
                        background: #eee;
                        padding: 5px 10px;
                        border-right: 3px solid #000;
                        margin-bottom: 10px;
                        font-weight: bold;
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact;
                    }
                    .section p { margin: 5px 0; text-align: justify; }
                    
                    .highlight { font-weight: bold; }
                    
                    .info-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 10px 0;
                        font-size: 12px;
                    }
                    .info-table td {
                        padding: 6px 10px;
                        border: 1px solid #aaa;
                    }
                    .info-table td:first-child {
                        background: #f9f9f9;
                        font-weight: bold;
                        width: 130px;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    .signatures {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 50px;
                        padding: 0 40px;
                    }
                    .signature-box {
                        text-align: center;
                        width: 200px;
                    }
                    .signature-box p { font-weight: bold; margin-bottom: 60px; }
                    .signature-line {
                        border-top: 1px solid #000;
                        padding-top: 5px;
                        font-size: 11px;
                    }
                    
                    .footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        text-align: center;
                        font-size: 10px;
                        color: #666;
                        border-top: 1px solid #ccc;
                        padding-top: 5px;
                        padding-bottom: 0;
                        background: white;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>قرارداد اجاره فضای انبارداری</h1>
                    <p>شماره ثبت: ${Math.floor(Math.random() * 10000)} | تاریخ: ${todayPersian}</p>
                </div>

                <div class="section">
                    <h3>ماده ۱: طرفین قرارداد</h3>
                    <p>
                        این قرارداد فی‌مابین <span class="highlight">مجتمع انبارداری ری</span> به نمایندگی مدیریت مجموعه (موجر) 
                        و جناب آقای/شرکت <span class="highlight">${formData.customer?.label || '..................'}</span> 
                        ${formData.customer?.mobile ? `به شماره تماس ${formData.customer.mobile}` : ''} (مستاجر) 
                        منعقد گردید.
                    </p>
                </div>

                <div class="section">
                    <h3>ماده ۲: مشخصات مورد اجاره</h3>
                    <table class="info-table">
                        <tr>
                            <td>نوع فضا</td>
                            <td>${rentalTypeLabel}</td>
                        </tr>
                        <tr>
                            <td>محل دقیق</td>
                            <td>${formData.locationName || '---'}</td>
                        </tr>
                        ${['shed', 'open', 'covered'].includes(formData.rentalType) && formData.rentalDetails.metrage ? `
                        <tr>
                            <td>متراژ واگذاری</td>
                            <td>${formData.rentalDetails.metrage} متر مربع</td>
                        </tr>` : ''}
                        ${formData.rentalType === 'container' && formData.rentalDetails.containerSize ? `
                        <tr>
                            <td>ابعاد کانتینر</td>
                            <td>${formData.rentalDetails.containerSize === '20ft' ? '۲۰ فوت' : '۴۰ فوت'}</td>
                        </tr>` : ''}
                    </table>
                </div>

                <div class="section">
                    <h3>ماده ۳: شرایط مالی و پرداخت</h3>
                    <table class="info-table">
                        <tr>
                            <td>اجاره ماهیانه</td>
                            <td><span class="highlight">${formatNumber(formData.monthlyRent)} ریال</span></td>
                        </tr>
                        <tr>
                            <td>تاریخ شروع قرارداد</td>
                            <td>${startDatePersian}</td>
                        </tr>
                        <tr>
                            <td>نحوه تسویه</td>
                            <td>${billingLabel}</td>
                        </tr>
                    </table>
                </div>

                <div class="section">
                    <h3>ماده ۴: تعهدات و توضیحات</h3>
                    <p>۱. مستاجر متعهد است اجاره‌بها را طبق بازه زمانی تعیین شده پرداخت نماید.</p>
                    <p>۲. نگهداری کالاهای غیرمجاز، اشتعال‌زا و خلاف قوانین کشور در انبار ممنوع است.</p>
                    <p>۳. موجر مسئولیت امنیت کلی مجموعه را بر عهده دارد.</p>
                    ${formData.description ? `<p class="highlight" style="margin-top:10px;">توضیحات تکمیلی: ${formData.description}</p>` : ''}
                </div>

                <div class="signatures">
                    <div class="signature-box">
                        <p>مهر و امضای موجر</p>
                        <div class="signature-line">مدیریت انبار</div>
                    </div>
                    <div class="signature-box">
                        <p>امضای مستاجر</p>
                        <div class="signature-line">${formData.customer?.label || 'مشتری'}</div>
                    </div>
                </div>

                <div class="footer">
                    این قرارداد در دو نسخه تنظیم گردیده و هر نسخه حکم واحد دارد. | سامانه مدیریت انبار
                </div>
            </body>
            </html>
        `;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(printContent);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);
    };

    const formatOptionLabel = ({ label, mobile }) => (
        <div className="d-flex justify-content-between align-items-center">
            <span>👤 {label}</span>
            {mobile && <span className="text-success font-size-12 ms-2">{mobile}</span>}
        </div>
    );

    return (
        <div className="page-content">
            <Container fluid>
                <div className="d-print-none">
                    <h4 className="fw-bold mb-4 font-size-18 text-primary">ایجاد قرارداد اجاره انبار</h4>

                    <Row>
                        <Col lg={8}>
                            <Card className="shadow-sm border-0">
                                <CardBody>
                                    <CardTitle className="h5 text-primary border-bottom pb-2 mb-4">اطلاعات پایه قرارداد</CardTitle>
                                    <Row className="gy-4">
                                        <Col md={6}>
                                            <Label className="fw-bold">مشتری (مستاجر) *</Label>
                                            <Select
                                                options={customers}
                                                value={formData.customer}
                                                onChange={(v) => {
                                                    setFormData({ ...formData, customer: v, verificationCode: "", manualMobile: "" });
                                                    setOtpSent(false);
                                                    setIsVerified(false);
                                                }}
                                                placeholder={loadingCustomers ? "در حال بارگذاری..." : "جستجوی مشتری..."}
                                                isLoading={loadingCustomers}
                                                formatOptionLabel={formatOptionLabel}
                                                noOptionsMessage={() => "مشتری یافت نشد"}
                                                isClearable
                                            />
                                            {formData.customer && (
                                                <div className="mt-2 p-2 bg-light rounded border border-light">
                                                    {formData.customer.mobile ? (
                                                        <div className="text-success d-flex align-items-center">
                                                            <i className="bx bx-check-circle me-2 font-size-16"></i>
                                                            <span>موبایل سیستم: <strong dir="ltr">{formData.customer.mobile}</strong></span>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <Label className="text-danger small mb-1">موبایل یافت نشد. دستی وارد کنید:</Label>
                                                            <Input type="tel" value={formData.manualMobile} onChange={(e) => setFormData({ ...formData, manualMobile: e.target.value })} className="form-control-sm" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Col>
                                        <Col md={6}>
                                            <Label className="fw-bold">تاریخ شروع اجاره</Label>
                                            <DatePickerWithIcon value={formData.startDate} onChange={handleDateChange} />
                                        </Col>
                                        <Col md={6}>
                                            <Label className="fw-bold">اجاره بهای ماهیانه (ریال) *</Label>
                                            <Input
                                                type="text"
                                                value={formData.monthlyRent ? formatNumber(formData.monthlyRent) : ""}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/,/g, '');
                                                    if (!isNaN(val)) setFormData({ ...formData, monthlyRent: val });
                                                }}
                                                placeholder="مبلغ به ریال..."
                                            />
                                            {formData.monthlyRent && <FormText className="text-info fw-bold">{formatNumber(formData.monthlyRent)} ریال</FormText>}
                                        </Col>
                                        <Col md={6}>
                                            <Label className="fw-bold">محل دقیق</Label>
                                            <Input value={formData.locationName} onChange={(e) => setFormData({ ...formData, locationName: e.target.value })} placeholder="مثلاً سوله ۳" />
                                        </Col>
                                    </Row>

                                    <CardTitle className="h5 text-primary border-bottom pb-2 mt-5 mb-4">جزئیات و نوع واگذاری</CardTitle>
                                    <Row className="gy-4">
                                        <Col md={6}>
                                            <Label className="fw-bold">نوع فضا</Label>
                                            <Input type="select" value={formData.rentalType} onChange={(e) => handleRentalTypeChange(e.target.value)}>
                                                {RENTAL_OPTIONS.types.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </Input>
                                        </Col>
                                        <Col md={6}>
                                            {['shed', 'open', 'covered'].includes(formData.rentalType) && (
                                                <><Label className="fw-bold text-danger">متراژ</Label><Input type="number" value={formData.rentalDetails.metrage} onChange={(e) => setFormData({ ...formData, rentalDetails: { ...formData.rentalDetails, metrage: e.target.value } })} /></>
                                            )}
                                            {formData.rentalType === 'container' && (
                                                <><Label className="fw-bold text-danger">ابعاد کانتینر</Label>
                                                    <Input type="select" value={formData.rentalDetails.containerSize} onChange={(e) => setFormData({ ...formData, rentalDetails: { ...formData.rentalDetails, containerSize: e.target.value } })}>
                                                        <option value="">انتخاب...</option><option value="20ft">۲۰ فوت</option><option value="40ft">۴۰ فوت</option>
                                                    </Input></>
                                            )}
                                        </Col>
                                    </Row>

                                    <CardTitle className="h5 text-primary border-bottom pb-2 mt-5 mb-4">تنظیمات</CardTitle>
                                    <Row className="gy-4">
                                        <Col md={6}>
                                            <Label className="fw-bold">دوره اطلاع‌رسانی</Label>
                                            <div className="d-flex flex-wrap gap-3 mt-1">
                                                {RENTAL_OPTIONS.notifications.map(opt => (
                                                    <div key={opt.value} className="form-check">
                                                        <Input type="checkbox" className="form-check-input" checked={formData.notifications.includes(opt.value)} onChange={() => handleNotifToggle(opt.value)} />
                                                        <Label className="form-check-label">{opt.label}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <Label className="fw-bold">سیکل پرداخت</Label>
                                            <Input type="select" value={formData.billingCycle} onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}>
                                                {RENTAL_OPTIONS.billingCycles.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </Input>
                                        </Col>
                                        <Col md={12}>
                                            <Label>توضیحات</Label>
                                            <Input type="textarea" rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col lg={4}>
                            <Card className="shadow-sm border-primary">
                                <CardBody>
                                    <CardTitle className="h5 fw-bold text-center mb-4">تاییدیه و ثبت</CardTitle>
                                    <div className="bg-light p-3 rounded mb-4 border">
                                        <Label className="fw-bold">کد تایید پیامکی</Label>
                                        <InputGroup>
                                            <Input placeholder={otpSent ? "کد ۶ رقمی..." : "منتظر..."} value={formData.verificationCode} onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })} disabled={!otpSent || isVerified} maxLength={6} className="text-center fw-bold letter-spacing-2" />
                                            <Button color={isVerified ? "success" : (otpSent ? "warning" : "info")} onClick={handleVerify} disabled={loading || isVerified || !getCustomerMobile()}>
                                                {loading ? <Spinner size="sm"/> : (isVerified ? <i className="bx bx-check"></i> : (otpSent ? "تایید" : "ارسال"))}
                                            </Button>
                                        </InputGroup>
                                        {isVerified && <Alert color="success" className="p-2 mt-2 text-center small mb-0">تایید شد</Alert>}
                                    </div>

                                    <div className="mb-4">
                                        <Label className="fw-bold">آپلود قرارداد</Label>
                                        <Input type="file" onChange={handleFileUpload} accept="image/*,.pdf" />
                                        {uploading && <Spinner size="sm" className="mt-2 text-primary" />}
                                        {formData.contractFile && <Alert color="info" className="p-2 mt-2 small mb-0">فایل آپلود شد</Alert>}
                                    </div>

                                    <hr />
                                    <div className="d-grid gap-2">
                                        <Button color="success" size="lg" onClick={() => handleSubmit(false)} disabled={loading || !isVerified} className="shadow-sm">
                                            {loading ? <Spinner size="sm" /> : "ثبت نهایی و فعال‌سازی"}
                                        </Button>
                                        <Button color="warning" outline onClick={() => handleSubmit(true)} disabled={loading}>
                                            ذخیره پیش‌نویس
                                        </Button>
                                        <Button color="secondary" outline onClick={handlePrint} className="mt-2">
                                            <i className="bx bx-printer me-1"></i> چاپ قرارداد
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </Container>
        </div>
    );
}