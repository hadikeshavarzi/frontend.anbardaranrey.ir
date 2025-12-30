import React, { useState, useEffect, useMemo } from "react";
import {
    Container, Card, CardBody, Row, Col, Button, Table, Label, Spinner, Badge
} from "reactstrap";
import Select from "react-select";
// ✅ بدون نیاز به import - از CDN لود میشه
import { getComprehensiveLedger } from "../../../services/reportService";
import { getPeopleTafsilis, getBanks, getCashes } from "../../../services/treasuryService";
import { supabase } from "../../../helpers/supabase";
import DatePickerWithIcon from "../../../components/Shared/DatePickerWithIcon";
import { toPersianDate, formatNumber } from "../../../helpers/utils";

export default function ComprehensiveLedger() {
    // --- مدیریت وضعیت (State) ---
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [viewMode, setViewMode] = useState("detail");

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selectedMoein, setSelectedMoein] = useState(null);
    const [selectedTafsili, setSelectedTafsili] = useState(null);

    const [moeinOptions, setMoeinOptions] = useState([]);
    const [tafsiliOptions, setTafsiliOptions] = useState([]);

    // --- بارگذاری اولیه ---
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const { data: moeins } = await supabase
                    .from('accounting_moein')
                    .select('id, code, title')
                    .order('code');

                if (moeins) {
                    setMoeinOptions(moeins.map(m => ({
                        value: m.id,
                        label: `${m.code} - ${m.title}`
                    })));
                }

                const [peopleRes, banksRes, cashesRes] = await Promise.allSettled([
                    getPeopleTafsilis(),
                    getBanks(),
                    getCashes()
                ]);

                const allTaf = [
                    ...(peopleRes.status === 'fulfilled' && peopleRes.value ? peopleRes.value.map(p => ({ value: p.id, label: `👤 شخص: ${p.title}` })) : []),
                    ...(banksRes.status === 'fulfilled' && banksRes.value ? banksRes.value.map(b => ({ value: b.tafsili_id, label: `🏦 بانک: ${b.bank_name}` })) : []),
                    ...(cashesRes.status === 'fulfilled' && cashesRes.value ? cashesRes.value.map(c => ({ value: c.tafsili_id, label: `💵 صندوق: ${c.title}` })) : [])
                ];
                setTafsiliOptions(allTaf);

            } catch (err) {
                console.error("خطا در بارگذاری اطلاعات اولیه:", err);
            }
        };
        loadInitialData();
    }, []);

    // --- تابع فرمت تاریخ ---
    const formatToDbDate = (val) => {
        if (!val) return null;
        if (val.toDate) return val.toDate().toISOString().split('T')[0];
        if (typeof val === 'string' && val.includes('T')) return val.split('T')[0];
        return val;
    };

    // --- تابع جستجو ---
    const handleSearch = async (forcedTafsili = undefined) => {
        setLoading(true);
        setData([]);

        try {
            const targetTafsili = forcedTafsili !== undefined ? forcedTafsili : selectedTafsili;

            const result = await getComprehensiveLedger({
                startDate: formatToDbDate(startDate),
                endDate: formatToDbDate(endDate),
                moeinId: selectedMoein?.value,
                tafsiliId: targetTafsili?.value
            });

            if (result) {
                setData(result);
                setViewMode(selectedMoein && !targetTafsili ? "summary" : "detail");
            }
        } catch (err) {
            console.error("خطا در تهیه گزارش:", err);
        } finally {
            setLoading(false);
        }
    };

    // --- محاسبات خلاصه ---
    const summaryData = useMemo(() => {
        if (viewMode !== "summary" || !data) return [];
        const groups = {};
        data.forEach(item => {
            const tid = item?.tafsili_id || 'unassigned';
            if (!groups[tid]) {
                groups[tid] = {
                    id: tid,
                    name: item?.tafsili?.title || item?.tafsili_title || 'بدون تفصیلی',
                    bed: 0,
                    bes: 0
                };
            }
            groups[tid].bed += (Number(item?.bed) || 0);
            groups[tid].bes += (Number(item?.bes) || 0);
        });
        return Object.values(groups);
    }, [data, viewMode]);

    // --- محاسبات جمع ---
    const totals = useMemo(() => {
        if (!data) return { bed: 0, bes: 0 };
        return data.reduce((acc, row) => ({
            bed: acc.bed + (Number(row?.bed) || 0),
            bes: acc.bes + (Number(row?.bes) || 0)
        }), { bed: 0, bes: 0 });
    }, [data]);

    // ✅ تابع چاپ با پنجره مخفی
    const handlePrint = () => {
        const tableEl = document.querySelector('.accounting-table');
        if (!tableEl) return;

        // ✅ ساخت iframe مخفی
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.left = '-9999px';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="fa">
            <head>
                <meta charset="UTF-8">
                <title>گزارش حسابداری</title>
                <style>
                    * { box-sizing: border-box; }
                    body { 
                        font-family: Tahoma, Arial, sans-serif; 
                        direction: rtl; 
                        padding: 20px;
                        margin: 0;
                        font-size: 12px;
                        line-height: 1.6;
                    }
                    .print-header {
                        text-align: center;
                        border-bottom: 2px solid #333;
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                    }
                    .print-header h3 { margin: 0 0 10px 0; font-size: 18px; }
                    .print-header-info { 
                        display: flex; 
                        justify-content: space-between; 
                        font-size: 11px; 
                        color: #666; 
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-top: 10px;
                    }
                    th, td { 
                        border: 1px solid #333; 
                        padding: 8px 6px; 
                        text-align: center;
                    }
                    th { 
                        background: #e9ecef; 
                        font-weight: bold;
                    }
                    tfoot td {
                        background: #343a40;
                        color: white;
                        font-weight: bold;
                    }
                    .text-start { text-align: right; }
                    .text-success { color: #198754; }
                    .text-danger { color: #dc3545; }
                    .text-warning { color: #ffc107; }
                    .text-primary { color: #0d6efd; }
                    .text-muted { color: #6c757d; }
                    .fw-bold { font-weight: bold; }
                    .bg-light { background: #f8f9fa; }
                    .badge {
                        display: inline-block;
                        padding: 2px 6px;
                        border: 1px solid #333;
                        border-radius: 3px;
                        font-size: 10px;
                    }
                    .print-footer {
                        margin-top: 30px;
                        padding-top: 15px;
                        border-top: 1px solid #ccc;
                        text-align: center;
                        font-size: 10px;
                        color: #666;
                    }
                    @media print {
                        @page { size: A4 landscape; margin: 10mm; }
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <h3>گزارش ریز عملکرد حساب‌ها</h3>
                    <div class="print-header-info">
                        <span>تاریخ چاپ: ${new Date().toLocaleDateString('fa-IR')}</span>
                        <span>${selectedMoein?.label || 'همه حساب‌ها'}</span>
                        <span>دوره: ${startDate ? toPersianDate(formatToDbDate(startDate)) : '---'} تا ${endDate ? toPersianDate(formatToDbDate(endDate)) : '---'}</span>
                    </div>
                </div>
                
                ${tableEl.outerHTML}
                
                <div class="print-footer">
                    این گزارش به صورت سیستمی تهیه شده است
                </div>
            </body>
            </html>
        `);
        doc.close();

        // ✅ صبر برای لود و بعد چاپ مستقیم
        iframe.onload = () => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            // حذف iframe بعد از چاپ
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        };
    };

    // ✅ تابع خروجی اکسل (فرمت xlsx با CDN)
    const handleExportExcel = async () => {
        if (!data || data.length === 0) return;

        // ✅ لود کتابخانه از CDN اگه هنوز لود نشده
        if (!window.XLSX) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            document.head.appendChild(script);
            await new Promise(resolve => script.onload = resolve);
        }

        const XLSX = window.XLSX;
        let excelData = [];
        let headers = [];

        if (viewMode === "summary") {
            headers = ["نام حساب تفصیلی", "مجموع بدهکار", "مجموع بستانکار", "مانده نهایی", "تشخیص"];

            summaryData.forEach(row => {
                const balance = row.bed - row.bes;
                excelData.push({
                    "نام حساب تفصیلی": row.name,
                    "مجموع بدهکار": row.bed,
                    "مجموع بستانکار": row.bes,
                    "مانده نهایی": Math.abs(balance),
                    "تشخیص": balance >= 0 ? 'بدهکار' : 'بستانکار'
                });
            });

            excelData.push({
                "نام حساب تفصیلی": "جمع کل",
                "مجموع بدهکار": totals.bed,
                "مجموع بستانکار": totals.bes,
                "مانده نهایی": Math.abs(totals.bed - totals.bes),
                "تشخیص": totals.bed >= totals.bes ? 'بدهکار' : 'بستانکار'
            });
        } else {
            headers = ["ردیف", "تاریخ", "شماره سند", "حساب تفصیلی", "شرح تراکنش", "بدهکار", "بستانکار", "مانده تجمعی", "تشخیص"];

            let runningBal = 0;
            data.forEach((row, idx) => {
                const bed = Number(row?.bed) || 0;
                const bes = Number(row?.bes) || 0;
                runningBal += (bed - bes);

                excelData.push({
                    "ردیف": idx + 1,
                    "تاریخ": toPersianDate(row?.document?.doc_date || row?.doc_date),
                    "شماره سند": row?.document?.id || row?.doc_id || '',
                    "حساب تفصیلی": row?.tafsili?.title || row?.tafsili_title || '-',
                    "شرح تراکنش": row?.description || '',
                    "بدهکار": bed,
                    "بستانکار": bes,
                    "مانده تجمعی": Math.abs(runningBal),
                    "تشخیص": runningBal >= 0 ? 'بدهکار' : 'بستانکار'
                });
            });

            excelData.push({
                "ردیف": "",
                "تاریخ": "",
                "شماره سند": "",
                "حساب تفصیلی": "جمع کل",
                "شرح تراکنش": "",
                "بدهکار": totals.bed,
                "بستانکار": totals.bes,
                "مانده تجمعی": Math.abs(totals.bed - totals.bes),
                "تشخیص": totals.bed >= totals.bes ? 'بدهکار' : 'بستانکار'
            });
        }

        // ✅ ساخت فایل اکسل
        const worksheet = XLSX.utils.json_to_sheet(excelData, { header: headers });
        worksheet['!cols'] = headers.map(h => ({ wch: Math.max(h.length * 2, 15) }));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "گزارش");

        // ✅ دانلود فایل
        const fileName = `گزارش-حسابداری-${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    let runningBalanceAccumulator = 0;

    return (
        <div className="page-content">
            <Container fluid>
                {/* بخش فیلترها */}
                <div className="d-print-none">
                    <h4 className="fw-bold mb-4 font-size-18">مرور جامع حساب‌ها (دفتر معین و تفصیلی)</h4>
                    <Card className="shadow-sm border-0">
                        <CardBody className="bg-light rounded">
                            <Row className="gy-3 align-items-end">
                                <Col md={3}>
                                    <Label className="fw-bold">از تاریخ</Label>
                                    <DatePickerWithIcon value={startDate} onChange={setStartDate} />
                                </Col>
                                <Col md={3}>
                                    <Label className="fw-bold">تا تاریخ</Label>
                                    <DatePickerWithIcon value={endDate} onChange={setEndDate} />
                                </Col>
                                <Col md={3}>
                                    <Label className="fw-bold">حساب معین</Label>
                                    <Select
                                        options={moeinOptions}
                                        value={selectedMoein}
                                        isClearable
                                        onChange={(v) => { setSelectedMoein(v); setSelectedTafsili(null); }}
                                        placeholder="انتخاب معین..."
                                    />
                                </Col>
                                <Col md={3}>
                                    <Label className="fw-bold">حساب تفصیلی</Label>
                                    <Select
                                        options={tafsiliOptions}
                                        value={selectedTafsili}
                                        isClearable
                                        onChange={setSelectedTafsili}
                                        placeholder="انتخاب تفصیلی..."
                                    />
                                </Col>
                                <Col md={12} className="text-end border-top pt-3 mt-2">
                                    <Button color="secondary" outline className="me-2" onClick={() => {
                                        setStartDate(null); setEndDate(null); setSelectedMoein(null); setSelectedTafsili(null); setData([]);
                                    }}>
                                        پاک کردن فیلترها
                                    </Button>
                                    <Button color="primary" className="px-5 shadow" onClick={() => handleSearch()} disabled={loading}>
                                        {loading ? <Spinner size="sm" /> : "تهیه گزارش"}
                                    </Button>
                                    <Button color="success" className="ms-2 px-4 shadow" onClick={handlePrint} disabled={!data || data.length === 0}>
                                        <i className="bx bx-printer me-1"></i> چاپ
                                    </Button>
                                    <Button color="info" className="ms-2 px-4 shadow" onClick={handleExportExcel} disabled={!data || data.length === 0}>
                                        <i className="bx bx-spreadsheet me-1"></i> اکسل
                                    </Button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </div>

                {/* ✅ بخش قابل چاپ - همیشه در DOM هست */}
                <div id="printable-area">
                    {/* هدر چاپ */}
                    <div className="d-none d-print-block mb-4">
                        <div className="text-center border-bottom pb-3 mb-3">
                            <h3 className="fw-bold mb-2">گزارش ریز عملکرد حساب‌ها</h3>
                            <div className="d-flex justify-content-between font-size-12 text-muted">
                                <span>تاریخ چاپ: {new Date().toLocaleDateString('fa-IR')}</span>
                                <span>{selectedMoein?.label || 'همه حساب‌ها'}</span>
                                <span>
                                    دوره: {startDate ? toPersianDate(formatToDbDate(startDate)) : '---'}
                                    {' تا '}
                                    {endDate ? toPersianDate(formatToDbDate(endDate)) : '---'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* نمایش لودینگ */}
                    {loading && (
                        <div className="text-center p-5 d-print-none">
                            <Spinner color="primary" />
                        </div>
                    )}

                    {/* جدول گزارش */}
                    {!loading && data && data.length > 0 && (
                        <Card className="mt-3 border-0 shadow-sm print-card">
                            <CardBody>
                                <div className="table-responsive">
                                    <Table bordered hover className="text-center align-middle font-size-13 accounting-table mb-0">
                                        <thead className="table-light">
                                        {viewMode === "summary" ? (
                                            <tr>
                                                <th>نام حساب تفصیلی</th>
                                                <th style={{width:'150px'}}>مجموع بدهکار</th>
                                                <th style={{width:'150px'}}>مجموع بستانکار</th>
                                                <th style={{width:'150px'}}>مانده نهایی</th>
                                                <th style={{width:'80px'}}>تشخیص</th>
                                            </tr>
                                        ) : (
                                            <tr>
                                                <th style={{width:'100px'}}>تاریخ</th>
                                                <th style={{width:'80px'}}>سند</th>
                                                <th>حساب تفصیلی</th>
                                                <th>شرح تراکنش</th>
                                                <th style={{width:'130px'}}>بدهکار</th>
                                                <th style={{width:'130px'}}>بستانکار</th>
                                                <th style={{width:'140px'}}>مانده تجمعی</th>
                                            </tr>
                                        )}
                                        </thead>
                                        <tbody>
                                        {viewMode === "summary" ? (
                                            summaryData.map((row, i) => (
                                                <tr key={`sum-${i}`}
                                                    onDoubleClick={() => {
                                                        const t = tafsiliOptions.find(o => o.value === row.id);
                                                        if (t) { setSelectedTafsili(t); handleSearch(t); }
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                    title="برای مشاهده ریز گردش دبل کلیک کنید"
                                                    className="d-print-table-row"
                                                >
                                                    <td className="text-start fw-bold text-primary">{row.name}</td>
                                                    <td className="text-success">{formatNumber(row.bed)}</td>
                                                    <td className="text-danger">{formatNumber(row.bes)}</td>
                                                    <td className="fw-bold">{formatNumber(Math.abs(row.bed - row.bes))}</td>
                                                    <td>{row.bed >= row.bes ? <Badge color="success">بد</Badge> : <Badge color="danger">بس</Badge>}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            data.map((row, idx) => {
                                                const bedVal = Number(row?.bed) || 0;
                                                const besVal = Number(row?.bes) || 0;
                                                runningBalanceAccumulator += (bedVal - besVal);
                                                return (
                                                    <tr key={row?.id || idx}>
                                                        <td>{toPersianDate(row?.document?.doc_date || row?.doc_date)}</td>
                                                        <td>
                                                            <Badge color="light" className="text-dark">
                                                                {row?.document?.id || row?.doc_id}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-start text-primary font-size-12">
                                                            {row?.tafsili?.title || row?.tafsili_title || '-'}
                                                        </td>
                                                        <td className="text-start font-size-12 text-muted">{row?.description}</td>
                                                        <td className="text-success fw-bold">{bedVal > 0 ? formatNumber(bedVal) : '-'}</td>
                                                        <td className="text-danger fw-bold">{besVal > 0 ? formatNumber(besVal) : '-'}</td>
                                                        <td className="fw-bold bg-light">
                                                            {formatNumber(Math.abs(runningBalanceAccumulator))}
                                                            <small className="ms-1 text-muted">
                                                                {runningBalanceAccumulator >= 0 ? 'بد' : 'بس'}
                                                            </small>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                        </tbody>
                                        <tfoot>
                                        <tr className="table-dark fw-bold">
                                            <td colSpan={viewMode === "summary" ? 1 : 4} className="text-end py-3">
                                                جمع کل:
                                            </td>
                                            <td className="py-3 text-success">{formatNumber(totals.bed)}</td>
                                            <td className="py-3 text-warning">{formatNumber(totals.bes)}</td>
                                            <td className="py-3" colSpan={viewMode === "summary" ? 2 : 1}>
                                                {formatNumber(Math.abs(totals.bed - totals.bes))}
                                                <span className="ms-1">({totals.bed >= totals.bes ? 'بد' : 'بس'})</span>
                                            </td>
                                        </tr>
                                        </tfoot>
                                    </Table>
                                </div>

                                {viewMode === "summary" && (
                                    <div className="text-muted font-size-12 mt-2 d-print-none">
                                        <i className="bx bx-info-circle me-1"></i>
                                        برای مشاهده ریز تراکنش‌های هر حساب، روی ردیف مربوطه <b>دبل کلیک</b> کنید.
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    )}

                    {/* پیام خالی بودن */}
                    {!loading && (!data || data.length === 0) && (
                        <div className="text-center py-5 border rounded bg-white shadow-sm mt-3 d-print-none">
                            <i className="bx bx-search-alt display-4 text-muted mb-3"></i>
                            <p className="text-muted">فیلترها را تنظیم کرده و دکمه گزارش را بزنید</p>
                        </div>
                    )}

                    {/* فوتر چاپ */}
                    <div className="d-none d-print-block mt-4 pt-3 border-top text-center font-size-11 text-muted">
                        این گزارش به صورت سیستمی تهیه شده است
                    </div>
                </div>
            </Container>

            {/* ✅ استایل چاپ - روش ساده */}
            <style>{`
                @media print {
                    @page { 
                        size: A4 landscape; 
                        margin: 8mm; 
                    }
                    
                    /* مخفی کردن سایدبار و هدر سایت */
                    .vertical-menu,
                    .navbar-header,
                    .page-title-box,
                    footer,
                    #side-menu,
                    .sidebar,
                    .left-side-menu,
                    nav { 
                        display: none !important; 
                    }
                    
                    /* مخفی کردن فیلترها */
                    .d-print-none { 
                        display: none !important; 
                    }
                    
                    /* نمایش هدر و فوتر چاپ */
                    .d-none.d-print-block { 
                        display: block !important; 
                    }
                    
                    /* تنظیم محتوا */
                    .page-content {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    #printable-area {
                        width: 100% !important;
                        padding: 0 !important;
                    }
                    
                    /* استایل جدول */
                    .accounting-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        font-size: 9pt !important;
                    }
                    
                    .accounting-table th,
                    .accounting-table td {
                        border: 1px solid #000 !important;
                        padding: 4px 6px !important;
                        color: #000 !important;
                    }
                    
                    .accounting-table thead th {
                        background: #ddd !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    .accounting-table tfoot td {
                        background: #333 !important;
                        color: #fff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    .print-card {
                        box-shadow: none !important;
                        border: none !important;
                        margin: 0 !important;
                    }
                    
                    .card-body {
                        padding: 0 !important;
                    }
                    
                    .badge {
                        border: 1px solid #000 !important;
                        padding: 2px 4px !important;
                    }
                }
                
                .accounting-table tbody tr:hover {
                    background-color: rgba(85, 110, 230, 0.05);
                }
            `}</style>
        </div>
    );
}