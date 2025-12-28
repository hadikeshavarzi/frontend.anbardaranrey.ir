import React, { useState, useEffect } from "react";
import {
    Container, Card, CardBody, Row, Col, Button, Input, Label, Nav, NavItem, NavLink, Badge, Table, ButtonGroup
} from "reactstrap";
import Select from "react-select";
import classnames from "classnames";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DatePickerWithIcon from "../../components/Shared/DatePickerWithIcon";
import {
    getPeopleTafsilis, getCashes, getBanks, getPos,
    saveTreasuryTransaction, getChecksInSafe, getActiveCheckbooks, getBaseBanks
} from "../../services/treasuryService";
import { supabase } from "../../helpers/supabase";

export default function TreasuryForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState('receive');

    // --- لیست‌های اطلاعاتی ---
    const [peopleOptions, setPeopleOptions] = useState([]);
    const [cashOptions, setCashOptions] = useState([]);
    const [bankOptions, setBankOptions] = useState([]);
    const [baseBankOptions, setBaseBankOptions] = useState([]);
    const [posOptions, setPosOptions] = useState([]);
    const [checksInSafe, setChecksInSafe] = useState([]);
    const [myCheckbooks, setMyCheckbooks] = useState([]);
    const [blankChecks, setBlankChecks] = useState([]);

    // --- هدر فرم ---
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [description, setDescription] = useState("");
    const [manualNo, setManualNo] = useState("");

    // --- آیتم‌های نهایی ---
    const [items, setItems] = useState([]);

    // --- متغیرهای موقت ورودی ---
    const [activeMethod, setActiveMethod] = useState("cash");
    const [tempAmount, setTempAmount] = useState("");
    const [tempRef, setTempRef] = useState(null);
    const [tempTrack, setTempTrack] = useState("");
    const [tempFee, setTempFee] = useState("");
    const [tempAttachment, setTempAttachment] = useState(null);

    const [chequeMode, setChequeMode] = useState("issue_ours");
    const [tempCheque, setTempCheque] = useState({
        sayadi: '', no: '', bankVal: null, branchName: '', branchCode: '',
        accountNo: '', holder: '', date: '', desc: '', endorsement: ''
    });

    const [selectedCheckToSpend, setSelectedCheckToSpend] = useState(null);
    const [selectedCheckbook, setSelectedCheckbook] = useState(null);

    // ✅ تابع مدیریت تاریخ
    const handleDateChange = (dateValue, setter) => {
        if (!dateValue) return;
        try {
            if (dateValue.toDate) setter(dateValue.toDate().toISOString().slice(0, 10));
            else setter(new Date(dateValue).toISOString().slice(0, 10));
        } catch (e) { console.error("Date Error:", e); }
    };

    // ✅ تابع کمکی برای گرفتن ابعاد تصویر
    const getImageDimensions = (file) => {
        return new Promise((resolve) => {
            if (!file.type.startsWith('image/')) {
                resolve({ width: null, height: null });
                return;
            }

            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve({ width: img.width, height: img.height });
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve({ width: null, height: null });
            };

            img.src = url;
        });
    };

    // ✅ آپلود فایل برای هر ردیف
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("حجم فایل نباید بیشتر از 5 مگابایت باشد");
            e.target.value = '';
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            toast.error("فقط فایل‌های JPG, PNG و PDF مجاز هستند");
            e.target.value = '';
            return;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `treasury_${Date.now()}.${fileExt}`;
        const filePath = `treasury-documents/${fileName}`;

        try {
            toast.info("در حال آپلود فایل...");

            const { data, error } = await supabase.storage
                .from('media')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: file.type
                });

            if (error) {
                console.error("Storage upload error:", error);
                throw error;
            }

            const { data: urlData } = supabase.storage
                .from('media')
                .getPublicUrl(filePath);

            let dimensions = { width: null, height: null };
            if (file.type.startsWith('image/')) {
                dimensions = await getImageDimensions(file);
            }

            setTempAttachment({
                filename: file.name,
                filepath: filePath,
                url: urlData?.publicUrl,
                mimetype: file.type,
                size: file.size,
                width: dimensions.width,
                height: dimensions.height
            });

            toast.success(`✓ ${file.name} با موفقیت آپلود شد`);
            e.target.value = '';

        } catch (error) {
            console.error("Upload error:", error);
            toast.error("خطا در آپلود فایل: " + (error.message || "خطای ناشناخته"));
            e.target.value = '';
        }
    };

    // --- بارگذاری داده‌ها ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const people = await getPeopleTafsilis();
                setPeopleOptions(people.map(p => ({ value: p.id, label: `${p.code} - ${p.title}` })));

                const c = await getCashes();
                setCashOptions(c.map(i => ({ value: i.id, label: i.title })));

                const b = await getBanks();
                setBankOptions(b.map(i => ({ value: i.id, label: `${i.bank_name} (${i.account_no})` })));

                const baseBanks = await getBaseBanks();
                setBaseBankOptions(baseBanks.map(bb => ({ value: bb.name, label: bb.name })));

                const p = await getPos();
                setPosOptions(p.map(i => ({ value: i.id, label: i.title })));

                const safeChecks = await getChecksInSafe();
                setChecksInSafe(safeChecks?.map(ch => ({
                    value: ch.id,
                    label: `${Number(ch.amount).toLocaleString()} - ${ch.bank_name} (سریال: ${ch.cheque_no})`,
                    original: ch
                })) || []);

                const books = await getActiveCheckbooks();
                setMyCheckbooks(books?.map(bk => ({
                    value: bk.id,
                    label: `${bk.treasury_banks?.bank_name || 'بانک نامشخص'}${bk.treasury_banks?.account_no ? ` - حساب: ${bk.treasury_banks.account_no}` : ''}`,
                    bankName: bk.treasury_banks?.bank_name || 'نامشخص',
                    accountNo: bk.treasury_banks?.account_no || '',
                    branchName: bk.treasury_banks?.branch_name || '',
                    serialStart: bk.serial_start,
                    serialEnd: bk.serial_end,
                    original: bk
                })) || []);

            } catch (err) {
                console.error("Load data error:", err);
                toast.error("خطا در بارگذاری اطلاعات");
            }
        };
        loadData();
    }, []);

    // ✅ دریافت برگه‌های سفید وقتی دسته‌چک انتخاب می‌شود
    const handleCheckbookChange = async (selected) => {
        setSelectedCheckbook(selected);

        if (!selected) {
            setBlankChecks([]);
            setTempCheque(prev => ({ ...prev, no: '' }));
            return;
        }

        try {
            const allSerials = [];
            for (let i = selected.serialStart; i <= selected.serialEnd; i++) {
                allSerials.push(i);
            }

            const { data: issuedChecks, error } = await supabase
                .from('treasury_checks')
                .select('cheque_no')
                .eq('checkbook_id', selected.value)
                .eq('type', 'issue');

            if (error) {
                console.error("Error loading issued checks:", error);
                toast.error("خطا در بارگذاری اطلاعات چک‌ها");
                setBlankChecks([]);
                return;
            }

            const usedSerials = issuedChecks?.map(ch => parseInt(ch.cheque_no)) || [];
            const availableSerials = allSerials.filter(serial => !usedSerials.includes(serial));

            setBlankChecks(availableSerials.map(serial => ({
                value: serial.toString(),
                label: `سریال: ${serial}`
            })));

            setTempCheque(prev => ({ ...prev, no: '' }));

            if (availableSerials.length === 0) {
                toast.warn("تمام برگه‌های این دسته‌چک استفاده شده است");
            }

        } catch (error) {
            console.error("Error in handleCheckbookChange:", error);
            toast.error("خطا در بارگذاری برگه‌های چک");
            setBlankChecks([]);
        }
    };

    // ✅ انتخاب شماره چک از لیست برگه‌های سفید
    const handleBlankCheckSelect = (selected) => {
        if (selected) {
            setTempCheque(prev => ({ ...prev, no: selected.value }));
        }
    };

    // ریست فرم با تغییر روش پرداخت
    useEffect(() => {
        setTempAmount("");
        setTempRef(null);
        setTempTrack("");
        setTempFee("");
        setTempAttachment(null);
        setTempCheque({
            sayadi: '', no: '', bankVal: null, branchName: '', branchCode: '',
            accountNo: '', holder: '', date: '', desc: '', endorsement: ''
        });
        setSelectedCheckToSpend(null);
        setSelectedCheckbook(null);
        setBlankChecks([]);
    }, [activeMethod, type]);

    // --- افزودن به لیست موقت ---
// --- افزودن به لیست موقت ---
// --- افزودن به لیست موقت ---
    const handleAddItem = () => {
        console.log("=== handleAddItem Called ===");

        let amountVal = Number(tempAmount.replace(/,/g, ""));

        // اگر خرج چک مشتری است، مبلغ از چک انتخابی بگیر
        if (type === 'payment' && activeMethod === 'cheque' && chequeMode === 'spend_customer' && selectedCheckToSpend) {
            amountVal = Number(selectedCheckToSpend.original.amount);
        }

        // بررسی مبلغ
        if (!amountVal || amountVal <= 0) {
            toast.warn("مبلغ را وارد کنید");
            return;
        }

        let bankNameForIssue = '';
        if (type === 'payment' && activeMethod === 'cheque' && chequeMode === 'issue_ours' && selectedCheckbook) {
            bankNameForIssue = selectedCheckbook.bankName;
        }

        // ✅ اگر خرج چک مشتری است، اطلاعات چک از selectedCheckToSpend بیا
        let chequeInfo = {
            sayadi_code: tempCheque.sayadi,
            cheque_no: tempCheque.no,
            bank_name: type === 'receive' ? (tempCheque.bankVal ? tempCheque.bankVal.label : '') : bankNameForIssue,
            branch_name: tempCheque.branchName,
            account_holder: tempCheque.holder,
            due_date: tempCheque.date,
            description: tempCheque.desc,
            endorsement: tempCheque.endorsement
        };

        // ✅ برای خرج چک مشتری، اطلاعات از چک انتخابی بیار
        if (type === 'payment' && chequeMode === 'spend_customer' && selectedCheckToSpend) {
            const check = selectedCheckToSpend.original;
            chequeInfo = {
                sayadi_code: check.sayadi_code || '',
                cheque_no: check.cheque_no,
                bank_name: check.bank_name,
                branch_name: check.branch_name || '',
                account_holder: check.account_holder || '',
                due_date: check.due_date,
                description: check.description || '',
                endorsement: check.endorsement || ''
            };
        }

        const newItem = {
            id: Date.now(),
            method: activeMethod,
            amount: amountVal,
            ref_id: tempRef ? tempRef.value : null,
            ref_label: tempRef ? tempRef.label : null,
            tracking_no: tempTrack,
            fee: tempFee ? Number(tempFee.replace(/,/g, "")) : 0,
            attachment: tempAttachment || null,
            cheque_type: type === 'receive' ? 'new_receive' : chequeMode,
            sayadi_code: chequeInfo.sayadi_code,
            cheque_no: chequeInfo.cheque_no,
            bank_name: chequeInfo.bank_name,
            branch_name: chequeInfo.branch_name,
            account_holder: chequeInfo.account_holder,
            due_date: chequeInfo.due_date,
            description: chequeInfo.description,
            endorsement: chequeInfo.endorsement,
            check_id: selectedCheckToSpend ? selectedCheckToSpend.value : null,
            checkbook_id: selectedCheckbook ? selectedCheckbook.value : null
        };

        console.log("New Item:", newItem);

        // ✅ بررسی validation‌های چک
        if (activeMethod === 'cheque') {
            // برای خرج چک مشتری، validation کمتری نیاز داریم
            if (type === 'payment' && chequeMode === 'spend_customer') {
                if (!selectedCheckToSpend) {
                    toast.warn("چک از صندوق را انتخاب کنید");
                    return;
                }
                // چک انتخاب شده، همه اطلاعاتش کامله
            } else {
                // برای دریافت یا صدور چک جدید
                if (!newItem.cheque_no || !newItem.due_date) {
                    toast.warn("شماره چک و تاریخ سررسید الزامی است");
                    return;
                }

                if (type === 'receive' && !newItem.sayadi_code) {
                    toast.warn("کد صیادی برای چک دریافتی الزامی است");
                    return;
                }

                if (type === 'payment' && chequeMode === 'issue_ours' && !selectedCheckbook) {
                    toast.warn("انتخاب دسته‌چک الزامی است");
                    return;
                }
            }
        } else {
            // برای غیر چک (نقد، پوز، بانک)، باید ref انتخاب شده باشه
            if (!tempRef) {
                const message = activeMethod === 'cash' ? "صندوق را انتخاب کنید" :
                    activeMethod === 'pos' ? "دستگاه پوز را انتخاب کنید" :
                        activeMethod === 'bank_transfer' ? "حساب بانکی را انتخاب کنید" :
                            "مرجع را انتخاب کنید";
                toast.warn(message);
                return;
            }
        }

        console.log("✅ Validation passed, adding item to list");
        setItems([...items, newItem]);
        toast.success("آیتم با موفقیت اضافه شد");

        // ریست فیلدها
        setTempAmount("");
        setTempFee("");
        setTempTrack("");
        setTempAttachment(null);
        setTempRef(null);
        setTempCheque({
            sayadi: '', no: '', bankVal: null, branchName: '', branchCode: '',
            accountNo: '', holder: '', date: '', desc: '', endorsement: ''
        });
        setSelectedCheckbook(null);
        setBlankChecks([]);
        setSelectedCheckToSpend(null);

        console.log("=== Item Added Successfully ===");
    };
    const handleRemoveItem = (id) => setItems(items.filter(i => i.id !== id));

    const handleSubmit = async () => {
        if (!selectedPerson) return toast.warn("طرف حساب را انتخاب کنید");
        if (items.length === 0) return toast.warn("لیست مبالغ خالی است");

        setLoading(true);
        try {
            await saveTreasuryTransaction({
                type,
                date,
                person_id: selectedPerson.value,
                description,
                manual_no: manualNo,
                items
            });
            toast.success("تراکنش خزانه‌داری با موفقیت ثبت شد");
            navigate("/accounting/list");
        } catch (err) {
            console.error(err);
            toast.error("خطا در ثبت: " + err.message);
        } finally { setLoading(false); }
    };

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const totalFee = items.reduce((sum, item) => sum + (item.fee || 0), 0);

    return (
        <div className="page-content">
            <Container fluid>
                {/* انتخاب نوع عملیات */}
                <div className="d-flex justify-content-center mb-4">
                    <ButtonGroup className="shadow-sm">
                        <Button color={type === 'receive' ? "success" : "light"} className="px-5 py-2" onClick={() => setType('receive')}>
                            <i className="bx bx-down-arrow-alt me-1"></i> دریافت وجه
                        </Button>
                        <Button color={type === 'payment' ? "danger" : "light"} className="px-5 py-2" onClick={() => setType('payment')}>
                            <i className="bx bx-up-arrow-alt me-1"></i> پرداخت وجه
                        </Button>
                    </ButtonGroup>
                </div>

                <Row>
                    {/* مشخصات کلی سند */}
                    <Col lg={12}>
                        <Card className="shadow-sm border-0 mb-3" style={{ backgroundColor: type === 'receive' ? '#f0fff4' : '#fff5f5' }}>
                            <CardBody>
                                <Row className="gy-3">
                                    <Col md={4}>
                                        <Label>طرف حساب (شخص/شرکت)</Label>
                                        <Select options={peopleOptions} value={selectedPerson} onChange={setSelectedPerson} placeholder="انتخاب شخص..." />
                                    </Col>
                                    <Col md={2}>
                                        <Label>تاریخ ثبت</Label>
                                        <div style={{ direction: 'rtl' }}>
                                            <DatePickerWithIcon value={date} onChange={(d) => handleDateChange(d, setDate)} />
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <Label>توضیحات کلی</Label>
                                        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="بابت..." />
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>

                    {/* جزئیات پرداخت/دریافت */}
                    <Col lg={12}>
                        <Card className="shadow-sm border-0">
                            <CardBody>
                                <Nav tabs className="nav-tabs-custom mb-3">
                                    {['cash', 'pos', 'bank_transfer', 'cheque'].map(m => (
                                        <NavItem key={m}>
                                            <NavLink className={classnames({ active: activeMethod === m })} onClick={() => setActiveMethod(m)} style={{ cursor: 'pointer' }}>
                                                {m === 'cash' ? 'نقد' : m === 'pos' ? 'کارتخوان' : m === 'bank_transfer' ? 'واریز/حواله' : 'چک صیادی'}
                                            </NavLink>
                                        </NavItem>
                                    ))}
                                </Nav>

                                <div className="bg-light p-3 rounded border">
                                    <Row className="gy-3">
                                        <Col md={2}>
                                            <Label className="fw-bold">مبلغ (ریال)</Label>
                                            <Input
                                                value={tempAmount ? Number(tempAmount).toLocaleString() : ''}
                                                onChange={e => setTempAmount(e.target.value.replace(/[^0-9]/g, ''))}
                                                disabled={type === 'payment' && activeMethod === 'cheque' && chequeMode === 'spend_customer'}
                                                className="fw-bold text-center border-primary"
                                            />
                                        </Col>

                                        {/* نمایش داینامیک فیلدها */}
                                        {activeMethod === 'cash' && (
                                            <>
                                                <Col md={4}><Label>انتخاب صندوق</Label><Select options={cashOptions} value={tempRef} onChange={setTempRef} /></Col>
                                                <Col md={3}>
                                                    <Label>فایل ضمیمه</Label>
                                                    <Input type="file" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png" />
                                                    {tempAttachment && <small className="text-success d-block mt-1">✓ {tempAttachment.filename}</small>}
                                                </Col>
                                            </>
                                        )}

                                        {activeMethod === 'pos' && (
                                            <>
                                                <Col md={4}><Label>دستگاه پوز</Label><Select options={posOptions} value={tempRef} onChange={setTempRef} /></Col>
                                                <Col md={2}>
                                                    <Label>شماره پیگیری</Label>
                                                    <Input value={tempTrack} onChange={e => setTempTrack(e.target.value)} />
                                                </Col>
                                                <Col md={3}>
                                                    <Label>فایل ضمیمه</Label>
                                                    <Input type="file" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png" />
                                                    {tempAttachment && <small className="text-success d-block mt-1">✓ {tempAttachment.filename}</small>}
                                                </Col>
                                            </>
                                        )}

                                        {activeMethod === 'bank_transfer' && (
                                            <>
                                                <Col md={3}><Label>به حساب بانکی</Label><Select options={bankOptions} value={tempRef} onChange={setTempRef} /></Col>
                                                <Col md={2}>
                                                    <Label>کارمزد (ریال)</Label>
                                                    <Input
                                                        value={tempFee ? Number(tempFee).toLocaleString() : ''}
                                                        onChange={e => setTempFee(e.target.value.replace(/[^0-9]/g, ''))}
                                                        placeholder="0"
                                                    />
                                                </Col>
                                                <Col md={2}>
                                                    <Label>شماره پیگیری</Label>
                                                    <Input value={tempTrack} onChange={e => setTempTrack(e.target.value)} />
                                                </Col>
                                                <Col md={3}>
                                                    <Label>فایل ضمیمه (فیش)</Label>
                                                    <Input type="file" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png" />
                                                    {tempAttachment && <small className="text-success d-block mt-1">✓ {tempAttachment.filename}</small>}
                                                </Col>
                                            </>
                                        )}

                                        {/* بخش چک */}
                                        {activeMethod === 'cheque' && (
                                            <Col md={10}>
                                                {type === 'payment' && (
                                                    <div className="mb-3 pb-3 border-bottom">
                                                        <Row>
                                                            <Col md={12} className="d-flex gap-4">
                                                                <div
                                                                    className="d-flex align-items-center gap-2 p-3 border rounded cursor-pointer"
                                                                    style={{
                                                                        cursor: 'pointer',
                                                                        backgroundColor: chequeMode === 'issue_ours' ? '#e8f5e9' : '#fff',
                                                                        borderColor: chequeMode === 'issue_ours' ? '#4caf50' : '#dee2e6',
                                                                        borderWidth: chequeMode === 'issue_ours' ? '2px' : '1px'
                                                                    }}
                                                                    onClick={() => setChequeMode('issue_ours')}
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name="chequeMode"
                                                                        checked={chequeMode === 'issue_ours'}
                                                                        onChange={() => setChequeMode('issue_ours')}
                                                                        style={{ cursor: 'pointer' }}
                                                                    />
                                                                    <label
                                                                        className="fw-bold mb-0"
                                                                        style={{ cursor: 'pointer' }}
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            setChequeMode('issue_ours');
                                                                        }}
                                                                    >
                                                                        صدور چک شخصی
                                                                    </label>
                                                                </div>

                                                                <div
                                                                    className="d-flex align-items-center gap-2 p-3 border rounded cursor-pointer"
                                                                    style={{
                                                                        cursor: 'pointer',
                                                                        backgroundColor: chequeMode === 'spend_customer' ? '#e3f2fd' : '#fff',
                                                                        borderColor: chequeMode === 'spend_customer' ? '#2196f3' : '#dee2e6',
                                                                        borderWidth: chequeMode === 'spend_customer' ? '2px' : '1px'
                                                                    }}
                                                                    onClick={() => setChequeMode('spend_customer')}
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name="chequeMode"
                                                                        checked={chequeMode === 'spend_customer'}
                                                                        onChange={() => setChequeMode('spend_customer')}
                                                                        style={{ cursor: 'pointer' }}
                                                                    />
                                                                    <label
                                                                        className="fw-bold text-primary mb-0"
                                                                        style={{ cursor: 'pointer' }}
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            setChequeMode('spend_customer');
                                                                        }}
                                                                    >
                                                                        خرج چک مشتری (موجود در صندوق)
                                                                    </label>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </div>
                                                )}

                                                {(type === 'receive' || (type === 'payment' && chequeMode === 'issue_ours')) && (
                                                    <div className="p-3 border rounded bg-white">
                                                        <Row className="gy-3">
                                                            {type === 'payment' && (
                                                                <>
                                                                    <Col md={6}>
                                                                        <Label className="fw-bold text-danger">انتخاب دسته‌چک *</Label>
                                                                        <Select
                                                                            options={myCheckbooks}
                                                                            value={selectedCheckbook}
                                                                            onChange={handleCheckbookChange}
                                                                            placeholder="ابتدا دسته‌چک را انتخاب کنید..."
                                                                        />
                                                                    </Col>
                                                                    <Col md={6}>
                                                                        <Label>انتخاب برگه چک سفید</Label>
                                                                        <Select
                                                                            options={blankChecks}
                                                                            onChange={handleBlankCheckSelect}
                                                                            placeholder={selectedCheckbook ? "انتخاب شماره چک..." : "ابتدا دسته‌چک را انتخاب کنید"}
                                                                            isDisabled={!selectedCheckbook}
                                                                        />
                                                                    </Col>
                                                                    {selectedCheckbook && (
                                                                        <Col md={12}>
                                                                            <div className="alert alert-info mb-0">
                                                                                <i className="bx bx-info-circle me-2"></i>
                                                                                بانک: <strong>{selectedCheckbook.bankName}</strong> | شماره حساب: <strong>{selectedCheckbook.accountNo}</strong>
                                                                            </div>
                                                                        </Col>
                                                                    )}
                                                                </>
                                                            )}
                                                            <Col md={4}>
                                                                <Label>کد صیادی (16 رقمی) {type === 'receive' && <span className="text-danger">*</span>}</Label>
                                                                <Input
                                                                    value={tempCheque.sayadi}
                                                                    onChange={e => setTempCheque({ ...tempCheque, sayadi: e.target.value })}
                                                                    maxLength={16}
                                                                />
                                                            </Col>
                                                            <Col md={4}>
                                                                <Label className="fw-bold">شماره چک <span className="text-danger">*</span></Label>
                                                                <Input
                                                                    value={tempCheque.no}
                                                                    onChange={e => setTempCheque({ ...tempCheque, no: e.target.value })}
                                                                    disabled={type === 'payment' && selectedCheckbook}
                                                                />
                                                            </Col>
                                                            {type === 'receive' && (
                                                                <Col md={4}>
                                                                    <Label>بانک صادرکننده</Label>
                                                                    <Select
                                                                        options={baseBankOptions}
                                                                        value={tempCheque.bankVal}
                                                                        onChange={val => setTempCheque({ ...tempCheque, bankVal: val })}
                                                                    />
                                                                </Col>
                                                            )}
                                                            <Col md={4}>
                                                                <Label className="fw-bold">تاریخ سررسید <span className="text-danger">*</span></Label>
                                                                <div style={{ direction: 'rtl' }}>
                                                                    <DatePickerWithIcon
                                                                        value={tempCheque.date}
                                                                        onChange={(d) => handleDateChange(d, (val) => setTempCheque(prev => ({ ...prev, date: val })))}
                                                                    />
                                                                </div>
                                                            </Col>
                                                            <Col md={4}>
                                                                <Label>{type === 'receive' ? 'صاحب حساب (مشتری)' : 'در وجه'}</Label>
                                                                <Input
                                                                    value={tempCheque.holder}
                                                                    onChange={e => setTempCheque({ ...tempCheque, holder: e.target.value })}
                                                                />
                                                            </Col>
                                                            <Col md={4}>
                                                                <Label>شرح/بابت چک</Label>
                                                                <Input
                                                                    value={tempCheque.desc}
                                                                    onChange={e => setTempCheque({ ...tempCheque, desc: e.target.value })}
                                                                />
                                                            </Col>
                                                            <Col md={4}>
                                                                <Label>فایل ضمیمه (تصویر چک)</Label>
                                                                <Input type="file" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png" />
                                                                {tempAttachment && <small className="text-success d-block mt-1">✓ {tempAttachment.filename}</small>}
                                                            </Col>
                                                        </Row>
                                                    </div>
                                                )}

                                                {type === 'payment' && chequeMode === 'spend_customer' && (
                                                    <Col md={12}>
                                                        <Label className="text-primary fw-bold">انتخاب چک از موجودی صندوق</Label>
                                                        <Select
                                                            options={checksInSafe}
                                                            value={selectedCheckToSpend}
                                                            onChange={(v) => {
                                                                setSelectedCheckToSpend(v);
                                                                setTempAmount(v.original.amount.toString());
                                                            }}
                                                            placeholder="جستجو بر اساس مبلغ یا سریال..."
                                                        />
                                                    </Col>
                                                )}
                                            </Col>
                                        )}

                                        <Col md={12} className="text-end border-top pt-3">
                                            <Button color="primary" onClick={handleAddItem} className="px-4">
                                                <i className="bx bx-plus me-1"></i> افزودن به لیست تراکنش
                                            </Button>
                                        </Col>
                                    </Row>
                                </div>

                                {/* لیست آیتم‌ها */}
                                <Table hover responsive className="mt-4 align-middle text-center border">
                                    <thead className="table-light">
                                    <tr>
                                        <th>نوع روش</th>
                                        <th>شرح جزئیات</th>
                                        <th>مبلغ (ریال)</th>
                                        <th>کارمزد</th>
                                        <th>ضمیمه</th>
                                        <th>عملیات</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {items.map(item => {
                                        const fileName = item.attachment?.filename || item.attachment?.name || null;
                                        const displayName = fileName && fileName.length > 15 ? fileName.substring(0, 15) + '...' : fileName;

                                        return (
                                            <tr key={item.id}>
                                                <td>
                                                    <Badge color={item.method === 'cheque' ? 'warning' : 'info'} className="p-2">
                                                        {item.method === 'cash' ? 'نقد' : item.method === 'pos' ? 'کارتخوان' : item.method === 'bank_transfer' ? 'واریز' : 'چک صیادی'}
                                                    </Badge>
                                                </td>
                                                <td className="text-start">
                                                    {item.cheque_no ? (
                                                        <div>
                                                            <span className="fw-bold">چک {item.cheque_no}</span>
                                                            {item.bank_name && <> - {item.bank_name}</>}
                                                            <br />
                                                            <small className="text-muted">
                                                                {item.sayadi_code && <>صیادی: {item.sayadi_code} | </>}
                                                                سررسید: {item.due_date}
                                                            </small>
                                                        </div>
                                                    ) : (item.ref_label || 'نقدی')}
                                                </td>
                                                <td className="fw-bold text-dark">{Number(item.amount).toLocaleString()}</td>
                                                <td className="text-danger">{item.fee ? Number(item.fee).toLocaleString() : '-'}</td>
                                                <td>
                                                    {fileName ? (
                                                        <Badge color="success" className="p-2" title={fileName}>
                                                            <i className="bx bx-paperclip me-1"></i>
                                                            {displayName}
                                                        </Badge>
                                                    ) : <span className="text-muted">-</span>}
                                                </td>
                                                <td>
                                                    <Button size="sm" color="danger" outline onClick={() => handleRemoveItem(item.id)}>
                                                        <i className="bx bx-trash"></i>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="py-4 text-muted font-italic">
                                                هیچ تراکنشی اضافه نشده است
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                    {items.length > 0 && (
                                        <tfoot>
                                        <tr className="table-active">
                                            <td colSpan="2" className="text-end fw-bold">جمع کل:</td>
                                            <td className="fw-bold text-primary fs-5">{totalAmount.toLocaleString()}</td>
                                            <td className="fw-bold text-danger">{totalFee > 0 ? totalFee.toLocaleString() : '-'}</td>
                                            <td colSpan="2">ریال</td>
                                        </tr>
                                        </tfoot>
                                    )}
                                </Table>

                                <div className="text-center mt-5">
                                    <Button
                                        color={type === 'receive' ? "success" : "danger"}
                                        size="lg"
                                        className="px-5 shadow-lg"
                                        onClick={handleSubmit}
                                        disabled={loading || items.length === 0}
                                    >
                                        {loading ? <i className="bx bx-loader bx-spin me-2"></i> : <i className="bx bx-check-double me-2"></i>}
                                        {type === 'receive' ? "ثبت نهایی دریافت و صدور سند" : "ثبت نهایی پرداخت و صدور سند"}
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}