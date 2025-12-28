import React, { useState, useEffect } from "react";
import {
    Container, Card, CardBody, Row, Col, Button, Table, Label, Spinner, Badge
} from "reactstrap";
import Select from "react-select";
import { getComprehensiveLedger } from "../../../services/reportService";
import { getPeopleTafsilis, getBanks, getCashes } from "../../../services/treasuryService";
import { supabase } from "../../../helpers/supabase";
import DatePickerWithIcon from "../../../components/Shared/DatePickerWithIcon";
import { toPersianDate, formatNumber } from "../../../helpers/utils";

export default function ComprehensiveLedger() {
    // --- State ---
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    // Filters
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selectedMoein, setSelectedMoein] = useState(null);
    const [selectedTafsili, setSelectedTafsili] = useState(null);

    // Options
    const [moeinOptions, setMoeinOptions] = useState([]);
    const [tafsiliOptions, setTafsiliOptions] = useState([]);

    // ✅ نگهداری اطلاعات بانک‌ها و POS برای ترکیب
    const [bankPosMap, setBankPosMap] = useState({});

    // --- Load Options ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. دریافت معین‌ها
                const { data: moeins } = await supabase.from('accounting_moein').select('id, code, title').order('code');
                setMoeinOptions(moeins.map(m => ({ value: m.id, label: `${m.code} - ${m.title}` })));

                // 2. دریافت تفصیلی‌ها
                const people = await getPeopleTafsilis();
                const banks = await getBanks();
                const cashes = await getCashes();

                // 3. دریافت دستگاه‌های POS
                const { data: posDevices } = await supabase
                    .from('treasury_pos')
                    .select('id, title, terminal_id, tafsili_id, bank_id, treasury_banks(bank_name)')
                    .order('id', { ascending: false });

                // ✅ ساخت map بانک -> POS ها
                const bankPosMapping = {};
                (banks || []).forEach(bank => {
                    const bankTafsiliId = bank.tafsili_id || bank.accounting_tafsili?.id;
                    if (bankTafsiliId) {
                        // پیدا کردن POS های متصل به این بانک
                        const connectedPos = (posDevices || []).filter(p => p.bank_id === bank.id);
                        const posTafsiliIds = connectedPos.map(p => p.tafsili_id).filter(Boolean);

                        bankPosMapping[bankTafsiliId] = {
                            bankName: bank.bank_name,
                            posDevices: connectedPos,
                            posTafsiliIds: posTafsiliIds,
                            // همه تفصیلی‌ها (بانک + POS ها)
                            allTafsiliIds: [bankTafsiliId, ...posTafsiliIds]
                        };
                    }
                });
                setBankPosMap(bankPosMapping);

                // ترکیب تفصیلی‌ها برای dropdown
                const allTafsilis = [
                    // اشخاص
                    ...people.map(p => ({
                        value: p.id,
                        label: `👤 شخص: ${p.title}`,
                        type: 'person'
                    })),
                    // ✅ بانک‌ها (با تعداد POS)
                    ...banks.map(b => {
                        const bankTafsiliId = b.tafsili_id || b.accounting_tafsili?.id;
                        const posCount = (posDevices || []).filter(p => p.bank_id === b.id).length;
                        return {
                            value: bankTafsiliId,
                            label: `🏦 بانک: ${b.bank_name} - ${b.account_no}${posCount > 0 ? ` (${posCount} POS)` : ''}`,
                            type: 'bank',
                            includesPos: posCount > 0
                        };
                    }).filter(b => b.value),
                    // دستگاه‌های POS (جداگانه)
                    ...(posDevices || []).map(pos => ({
                        value: pos.tafsili_id,
                        label: `💳 POS: ${pos.title || pos.treasury_banks?.bank_name} - پایانه ${pos.terminal_id}`,
                        type: 'pos'
                    })).filter(p => p.value),
                    // صندوق‌ها
                    ...cashes.map(c => ({
                        value: c.tafsili_id || c.accounting_tafsili?.id,
                        label: `💵 صندوق: ${c.title}`,
                        type: 'cash'
                    })).filter(c => c.value)
                ];
                setTafsiliOptions(allTafsilis);

            } catch (err) { console.error(err); }
        };
        fetchData();
    }, []);

    // ✅ تابع تبدیل تاریخ
    const handleDateChange = (setter) => (dateValue) => {
        if (dateValue?.toDate) {
            const jsDate = dateValue.toDate();
            setter(jsDate.toISOString());
        } else if (dateValue) {
            setter(dateValue);
        } else {
            setter(null);
        }
    };

    // --- Handle Search ---
    const handleSearch = async () => {
        setLoading(true);
        try {
            // ✅ تبدیل تاریخ به فرمت صحیح
            const formattedStart = startDate ? startDate.slice(0, 10) : null;
            const formattedEnd = endDate ? endDate.slice(0, 10) : null;

            const result = await getComprehensiveLedger({
                startDate: formattedStart,
                endDate: formattedEnd,
                moeinId: selectedMoein?.value,
                tafsiliId: selectedTafsili?.value
            });
            setData(result || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Clear Filters ---
    const handleClear = () => {
        setStartDate(null);
        setEndDate(null);
        setSelectedMoein(null);
        setSelectedTafsili(null);
        setData([]);
    };

    // --- Print Function ---
    const handlePrint = () => {
        window.print();
    };

    // ✅ محاسبه جمع‌ها (بیرون از render برای جلوگیری از مشکل)
    const totals = data.reduce((acc, row) => {
        const bed = Number(row.bed) || 0;
        const bes = Number(row.bes) || 0;
        return {
            totalBed: acc.totalBed + bed,
            totalBes: acc.totalBes + bes,
            balance: acc.balance + (bed - bes)
        };
    }, { totalBed: 0, totalBes: 0, balance: 0 });

    // ✅ محاسبه مانده تجمعی برای هر ردیف
    let runningBalance = 0;
    const dataWithBalance = data.map(row => {
        const bed = Number(row.bed) || 0;
        const bes = Number(row.bes) || 0;
        runningBalance += (bed - bes);
        return { ...row, runningBalance };
    });

    return (
        <div className="page-content">
            <Container fluid>
                {/* بخش فیلترها */}
                <div className="d-print-none">
                    <h4 className="fw-bold mb-4 font-size-18">گزارش جامع مرور حساب‌ها</h4>
                    <Card>
                        <CardBody>
                            <Row className="gy-3">
                                <Col md={3}>
                                    <Label>از تاریخ</Label>
                                    <div style={{direction:'rtl'}}>
                                        <DatePickerWithIcon
                                            value={startDate}
                                            onChange={handleDateChange(setStartDate)}
                                        />
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <Label>تا تاریخ</Label>
                                    <div style={{direction:'rtl'}}>
                                        <DatePickerWithIcon
                                            value={endDate}
                                            onChange={handleDateChange(setEndDate)}
                                        />
                                    </div>
                                </Col>
                                <Col md={3}>
                                    <Label>حساب معین</Label>
                                    <Select
                                        options={moeinOptions}
                                        value={selectedMoein}
                                        onChange={setSelectedMoein}
                                        placeholder="همه معین‌ها..."
                                        isClearable
                                    />
                                </Col>
                                <Col md={3}>
                                    <Label>حساب تفصیلی</Label>
                                    <Select
                                        options={tafsiliOptions}
                                        value={selectedTafsili}
                                        onChange={setSelectedTafsili}
                                        placeholder="همه تفصیلی‌ها..."
                                        isClearable
                                    />
                                    {/* ✅ نمایش اخطار اگر بانک با POS انتخاب شده */}
                                    {selectedTafsili?.includesPos && (
                                        <small className="text-info d-block mt-1">
                                            <i className="bx bx-info-circle me-1"></i>
                                            گردش POS های متصل هم نمایش داده می‌شود
                                        </small>
                                    )}
                                </Col>
                                <Col md={12} className="text-end border-top pt-3 mt-2">
                                    <Button color="secondary" outline className="me-2" onClick={handleClear}>
                                        <i className="bx bx-refresh me-1"></i> پاک کردن
                                    </Button>
                                    <Button color="primary" className="px-4" onClick={handleSearch} disabled={loading}>
                                        {loading ? <Spinner size="sm"/> : <><i className="bx bx-filter-alt me-1"></i> تهیه گزارش</>}
                                    </Button>
                                    <Button color="success" className="ms-2 px-4" onClick={handlePrint} disabled={data.length === 0}>
                                        <i className="bx bx-printer me-1"></i> چاپ
                                    </Button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </div>

                {/* ✅ خلاصه آمار */}
                {data.length > 0 && (
                    <div className="d-print-none">
                        <Row className="mt-3 mb-2">
                            <Col>
                                <div className="d-flex gap-3 justify-content-end">
                                    <Badge color="light" className="text-dark p-2 font-size-12">
                                        تعداد ردیف: <strong>{data.length}</strong>
                                    </Badge>
                                    <Badge color="success" className="p-2 font-size-12">
                                        جمع بدهکار: <strong>{formatNumber(totals.totalBed)}</strong>
                                    </Badge>
                                    <Badge color="danger" className="p-2 font-size-12">
                                        جمع بستانکار: <strong>{formatNumber(totals.totalBes)}</strong>
                                    </Badge>
                                    <Badge color={totals.balance >= 0 ? "primary" : "warning"} className="p-2 font-size-12">
                                        مانده: <strong>{formatNumber(Math.abs(totals.balance))}</strong>
                                        <span className="ms-1">({totals.balance >= 0 ? 'بد' : 'بس'})</span>
                                    </Badge>
                                </div>
                            </Col>
                        </Row>
                    </div>
                )}

                {/* بخش نمایش گزارش */}
                <Card className="mt-2 border-0 shadow-none" id="printable-area">
                    <CardBody>
                        {/* هدر مخصوص پرینت */}
                        <div className="d-none d-print-block text-center mb-4">
                            <h3 className="fw-bold">گزارش ریز عملکرد حساب‌ها</h3>
                            <p className="text-muted">
                                {startDate ? `از تاریخ: ${toPersianDate(startDate)}` : ''}
                                {endDate ? ` تا تاریخ: ${toPersianDate(endDate)}` : ''}
                                {!startDate && !endDate && 'گزارش کل دوره'}
                            </p>
                            {selectedTafsili && (
                                <p className="fw-bold">حساب: {selectedTafsili.label}</p>
                            )}
                            <hr />
                        </div>

                        <div className="table-responsive">
                            <Table bordered hover className="text-center font-size-13 align-middle table-striped mb-0">
                                <thead className="table-light">
                                <tr>
                                    <th style={{width: '100px'}}>تاریخ</th>
                                    <th style={{width: '70px'}}>سند</th>
                                    <th>حساب معین</th>
                                    <th>حساب تفصیلی</th>
                                    <th>شرح ردیف</th>
                                    <th style={{width: '120px'}}>بدهکار</th>
                                    <th style={{width: '120px'}}>بستانکار</th>
                                    <th style={{width: '120px'}}>مانده</th>
                                    <th style={{width: '60px'}}>تشخیص</th>
                                </tr>
                                </thead>
                                <tbody>
                                {dataWithBalance.length > 0 ? dataWithBalance.map((row) => {
                                    const bed = Number(row.bed) || 0;
                                    const bes = Number(row.bes) || 0;

                                    return (
                                        <tr key={row.id}>
                                            <td>{toPersianDate(row.document?.doc_date)}</td>
                                            <td>
                                                <Badge color="light" className="text-dark border">
                                                    {row.document?.id}
                                                </Badge>
                                            </td>
                                            <td className="text-start font-size-12">{row.moein?.title}</td>
                                            <td className="text-start font-size-12 text-primary">
                                                {row.tafsili?.title || '-'}
                                            </td>
                                            <td className="text-start text-muted" style={{maxWidth: '200px'}}>
                                                {row.description}
                                            </td>
                                            <td className="text-success fw-bold">
                                                {bed > 0 ? formatNumber(bed) : '-'}
                                            </td>
                                            <td className="text-danger fw-bold">
                                                {bes > 0 ? formatNumber(bes) : '-'}
                                            </td>
                                            <td className="fw-bold bg-light">
                                                {formatNumber(Math.abs(row.runningBalance))}
                                            </td>
                                            <td>
                                                {row.runningBalance > 0 ? (
                                                    <Badge color="success" className="font-size-11">بد</Badge>
                                                ) : row.runningBalance < 0 ? (
                                                    <Badge color="danger" className="font-size-11">بس</Badge>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="9" className="py-5 text-muted">
                                            {loading ? (
                                                <><Spinner size="sm" className="me-2" /> در حال دریافت اطلاعات...</>
                                            ) : (
                                                <>
                                                    <i className="bx bx-search-alt font-size-24 d-block mb-2"></i>
                                                    فیلترها را تنظیم کرده و دکمه گزارش را بزنید
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                                {dataWithBalance.length > 0 && (
                                    <tfoot>
                                    <tr className="table-dark fw-bold font-size-14">
                                        <td colSpan="5" className="text-end py-3">جمع کل دوره:</td>
                                        <td className="text-success py-3">{formatNumber(totals.totalBed)}</td>
                                        <td className="text-warning py-3">{formatNumber(totals.totalBes)}</td>
                                        <td className="text-white py-3">{formatNumber(Math.abs(totals.balance))}</td>
                                        <td className="py-3">
                                            {totals.balance > 0 ? 'بد' : totals.balance < 0 ? 'بس' : 'تسویه'}
                                        </td>
                                    </tr>
                                    </tfoot>
                                )}
                            </Table>
                        </div>

                        <div className="d-none d-print-block mt-5 text-center text-muted font-size-12">
                            <hr/>
                            <p>این گزارش به صورت سیستمی تهیه شده است | تاریخ چاپ: {new Date().toLocaleDateString('fa-IR')}</p>
                        </div>
                    </CardBody>
                </Card>
            </Container>

            {/* استایل مخصوص پرینت */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #printable-area, #printable-area * { visibility: visible; }
                    #printable-area {
                        position: absolute;
                        left: 0; top: 0;
                        width: 100%;
                        margin: 0; padding: 20px;
                        background: white;
                    }
                    .vertical-menu, .navbar-header, footer, .page-title-box { display: none !important; }
                    table { font-size: 11px !important; width: 100%; }
                    th, td { padding: 4px !important; }
                    .badge { border: 1px solid #000; color: #000 !important; }
                }
            `}</style>
        </div>
    );
}