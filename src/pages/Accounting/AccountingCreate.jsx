import React, { useState, useEffect, useRef } from "react";
import {
    Container, Card, CardBody, Row, Col, Button, Table, Input, Label, CardTitle, Badge
} from "reactstrap";
import Select from "react-select";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import DatePickerWithIcon from "../../components/Shared/DatePickerWithIcon";
import { getMoeins, getTafsilis } from "../../services/codingService";
import { createManualDocument, getFinancialDocumentById, updateManualDocument } from "../../services/financialService";

export default function AccountingCreate() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const [moeinOptions, setMoeinOptions] = useState([]);
    const [tafsiliOptions, setTafsilisOptions] = useState([]);

    // Header Data
    const [docDate, setDocDate] = useState(new Date().toISOString().slice(0, 10));
    const [manualNo, setManualNo] = useState("");
    const [description, setDescription] = useState("");
    const [docNo, setDocNo] = useState(null); // شماره سند سیستمی

    // Rows Data
    const [rows, setRows] = useState([
        { id: Date.now(), moein: null, tafsili: null, description: "", bed: 0, bes: 0, bedDisplay: "", besDisplay: "" }
    ]);

    const rowRefs = useRef({});

    // Styles
    const customStyles = {
        control: (base, state) => ({
            ...base, height: '38px', minHeight: '38px',
            borderColor: state.isFocused ? '#556ee6' : '#ced4da',
            boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(85, 110, 230, 0.25)' : null,
            fontSize: '13px', borderRadius: '0.25rem'
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        menu: (base) => ({ ...base, zIndex: 9999 }),
        option: (base, state) => ({
            ...base, fontSize: '13px',
            backgroundColor: state.isSelected ? '#556ee6' : state.isFocused ? '#f8f9fa' : 'white',
            color: state.isSelected ? 'white' : '#495057', cursor: 'pointer'
        })
    };

    // Helper: Format Number
    const formatNumber = (num) => (!num ? "" : num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));

    // --- Print Handler ---
    const handlePrint = () => {
        // کمی تاخیر برای اطمینان از رندر شدن
        setTimeout(() => {
            window.print();
        }, 100);
    };

    // --- Load Data ---
    useEffect(() => {
        const init = async () => {
            setPageLoading(true);
            try {
                // 1. Get Coding
                const moeins = await getMoeins();
                const tafsilis = await getTafsilis();

                const mOpts = moeins?.map(m => ({ value: m.id, label: `${m.code} - ${m.title}`, code: m.code, title: m.title })) || [];
                const tOpts = tafsilis?.map(t => ({ value: t.id, label: `${t.code} - ${t.title}`, code: t.code, title: t.title })) || [];

                setMoeinOptions(mOpts);
                setTafsilisOptions(tOpts);

                // 2. Get Document (If Edit)
                if (isEditMode) {
                    const doc = await getFinancialDocumentById(id);
                    if (!doc) {
                        toast.error("سند یافت نشد");
                        navigate("/accounting/list");
                        return;
                    }
                    setDocDate(doc.doc_date);
                    setManualNo(doc.manual_no || "");
                    setDescription(doc.description || "");
                    setDocNo(doc.doc_no);

                    if (doc.financial_entries && doc.financial_entries.length > 0) {
                        const formattedRows = doc.financial_entries.map((entry, idx) => ({
                            id: Date.now() + idx,
                            moein: mOpts.find(opt => opt.value === entry.moein_id) || null,
                            tafsili: tOpts.find(opt => opt.value === entry.tafsili_id) || null,
                            description: entry.description || "",
                            bed: entry.bed,
                            bes: entry.bes,
                            bedDisplay: entry.bed > 0 ? formatNumber(entry.bed) : "",
                            besDisplay: entry.bes > 0 ? formatNumber(entry.bes) : ""
                        }));
                        setRows(formattedRows);
                    }
                }
            } catch (err) {
                console.error(err);
                toast.error("خطا در بارگیری اطلاعات");
            } finally {
                setPageLoading(false);
            }
        };
        init();
    }, [id, isEditMode, navigate]);

    // --- Form Handlers ---
    const addRow = () => {
        const newId = Date.now();
        setRows([...rows, { id: newId, moein: null, tafsili: null, description: description, bed: 0, bes: 0, bedDisplay: "", besDisplay: "" }]);
        setTimeout(() => rowRefs.current[`moein-${newId}`]?.focus(), 100);
    };

    const removeRow = (index) => {
        if (rows.length === 1) return toast.warn("سند باید حداقل یک ردیف داشته باشد");
        setRows(rows.filter((_, i) => i !== index));
    };

    const handleRowChange = (index, field, value) => {
        const newRows = [...rows];
        const currentRowId = newRows[index].id;

        if (field === 'moein') {
            newRows[index].moein = value;
            setRows(newRows);
            setTimeout(() => rowRefs.current[`tafsili-${currentRowId}`]?.focus(), 50);
        } else if (field === 'tafsili') {
            newRows[index].tafsili = value;
            setRows(newRows);
            setTimeout(() => rowRefs.current[`desc-${currentRowId}`]?.focus(), 50);
        } else if (field === 'bedDisplay') {
            const rawVal = value.replace(/[^0-9]/g, '');
            newRows[index].bed = Number(rawVal);
            newRows[index].bedDisplay = formatNumber(rawVal);
            if (rawVal > 0) { newRows[index].bes = 0; newRows[index].besDisplay = ""; }
            setRows(newRows);
        } else if (field === 'besDisplay') {
            const rawVal = value.replace(/[^0-9]/g, '');
            newRows[index].bes = Number(rawVal);
            newRows[index].besDisplay = formatNumber(rawVal);
            if (rawVal > 0) { newRows[index].bed = 0; newRows[index].bedDisplay = ""; }
            setRows(newRows);
        } else {
            newRows[index][field] = value;
            setRows(newRows);
        }
    };

    const handleKeyDown = (e, idx, field) => {
        if (e.key === 'Enter') {
            const currentRowId = rows[idx].id;
            if (field === 'moein' || field === 'tafsili') {
                setTimeout(() => {
                    if (field === 'moein') rowRefs.current[`tafsili-${currentRowId}`]?.focus();
                    if (field === 'tafsili') rowRefs.current[`desc-${currentRowId}`]?.focus();
                }, 100);
            } else {
                e.preventDefault();
                if (field === 'desc') rowRefs.current[`bed-${currentRowId}`]?.focus();
                else if (field === 'bed') rowRefs.current[`bes-${currentRowId}`]?.focus();
                else if (field === 'bes') {
                    if (idx === rows.length - 1) addRow();
                    else rowRefs.current[`moein-${rows[idx + 1].id}`]?.focus();
                }
            }
        }
    };

    const handleSubmit = async () => {
        const currentTotalBed = rows.reduce((sum, row) => sum + row.bed, 0);
        const currentTotalBes = rows.reduce((sum, row) => sum + row.bes, 0);

        if (currentTotalBed !== currentTotalBes) return toast.error("سند تراز نیست!");
        if (currentTotalBed === 0) return toast.error("سند مبلغ ندارد.");
        if (rows.some(r => !r.moein)) return toast.warn("حساب معین الزامی است.");

        setLoading(true);
        try {
            const preparedRows = rows.map(r => ({
                moein_id: r.moein.value,
                tafsili_id: r.tafsili ? r.tafsili.value : null,
                description: r.description || description,
                bed: r.bed,
                bes: r.bes
            }));
            const headerData = { doc_date: docDate, manual_no: manualNo, description };

            if (isEditMode) {
                await updateManualDocument(id, headerData, preparedRows);
                toast.success("سند ویرایش شد.");
            } else {
                await createManualDocument(headerData, preparedRows);
                toast.success("سند ثبت شد.");
            }
            navigate("/accounting/list");
        } catch (err) {
            console.error(err);
            toast.error("خطا در ذخیره سازی.");
        } finally {
            setLoading(false);
        }
    };

    // Calculate Totals
    const renderTotalBed = rows.reduce((sum, row) => sum + row.bed, 0);
    const renderTotalBes = rows.reduce((sum, row) => sum + row.bes, 0);
    const renderDiff = renderTotalBed - renderTotalBes;

    if (pageLoading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="page-content-wrapper">

            {/* 🖨️ استایل‌های مخصوص پرینت */}
            <style>{`
                @media screen {
                    .print-only-section { display: none !important; }
                }
                @media print {
                    @page { size: A4; margin: 10mm; }
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
                        direction: rtl;
                        font-family: 'Tahoma', 'Arial', sans-serif;
                    }
                    .print-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                    .print-table th, .print-table td { border: 1px solid #000; padding: 5px; text-align: center; }
                    .print-header { border: 2px solid #000; padding: 10px; border-radius: 5px; margin-bottom: 10px; }
                    .signature-box { margin-top: 40px; display: flex; justify-content: space-around; text-align: center; font-size: 12px; }
                }
            `}</style>

            {/* 🖨️ بخش مخفی برای پرینت (Invoice Layout) */}
            <div className="print-only-section">
                {/* Header */}
                <div className="print-header d-flex justify-content-between align-items-center">
                    <div style={{width: '30%'}}>
                        <h4 className="fw-bold m-0" style={{fontSize: '18px'}}>سند حسابداری</h4>
                        <p className="m-0 mt-1" style={{fontSize: '11px'}}>مجتمع انبارداری ری</p>
                    </div>
                    <div style={{width: '30%', textAlign: 'center'}}>
                        <h2 style={{fontSize: '24px', fontWeight: 'bold'}}>سند حسابداری</h2>
                    </div>
                    <div style={{width: '30%', textAlign: 'left', fontSize: '11px'}}>
                        <div>شماره سند: <span className="fw-bold">{docNo || "---"}</span></div>
                        <div>تاریخ: <span className="fw-bold">{new Date(docDate).toLocaleDateString('fa-IR')}</span></div>
                        <div>عطف: <span>{manualNo || "---"}</span></div>
                    </div>
                </div>

                {/* Description */}
                <div className="border border-dark p-2 mb-2 rounded" style={{fontSize: '12px'}}>
                    <strong>شرح سند: </strong> {description}
                </div>

                {/* Table */}
                <table className="print-table">
                    <thead>
                    <tr style={{backgroundColor: '#f0f0f0'}}>
                        <th style={{width: '5%'}}>#</th>
                        <th style={{width: '10%'}}>کد حساب</th>
                        <th style={{width: '35%'}}>شرح حساب / شرح ردیف</th>
                        <th style={{width: '12%'}}>کد تفصیلی</th>
                        <th style={{width: '19%'}}>بدهکار</th>
                        <th style={{width: '19%'}}>بستانکار</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((row, idx) => (
                        <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{row.moein?.code}</td>
                            <td className="text-start">
                                <div className="fw-bold">{row.moein?.title}</div>
                                {row.tafsili && <div className="text-muted" style={{fontSize: '10px'}}>{row.tafsili.title}</div>}
                                <div style={{fontSize: '10px'}}>{row.description}</div>
                            </td>
                            <td>{row.tafsili?.code || '-'}</td>
                            <td>{formatNumber(row.bed)}</td>
                            <td>{formatNumber(row.bes)}</td>
                        </tr>
                    ))}
                    </tbody>
                    <tfoot>
                    <tr style={{backgroundColor: '#e8e8e8', fontWeight: 'bold'}}>
                        <td colSpan="4" className="text-end px-2">جمع کل:</td>
                        <td>{formatNumber(renderTotalBed)}</td>
                        <td>{formatNumber(renderTotalBes)}</td>
                    </tr>
                    </tfoot>
                </table>

                {/* Signatures */}
                <div className="signature-box">
                    <div>
                        <p className="fw-bold mb-4">تنظیم کننده</p>
                        <div style={{borderBottom: '1px dotted #000', width: '120px'}}></div>
                    </div>
                    <div>
                        <p className="fw-bold mb-4">مدیر مالی</p>
                        <div style={{borderBottom: '1px dotted #000', width: '120px'}}></div>
                    </div>
                    <div>
                        <p className="fw-bold mb-4">مدیریت</p>
                        <div style={{borderBottom: '1px dotted #000', width: '120px'}}></div>
                    </div>
                </div>
            </div>


            {/* 🖥️ بخش فرم اصلی (Screen) */}
            <div className="page-content">
                <Container fluid>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="d-flex align-items-center gap-3">
                            <h4 className="font-size-18 fw-bold text-dark m-0">{isEditMode ? `ویرایش سند شماره ${docNo || ''}` : 'ثبت سند حسابداری'}</h4>
                            <Button color="info" size="sm" onClick={handlePrint}>
                                <i className="bx bx-printer font-size-16 align-middle me-1"></i> چاپ سند
                            </Button>
                        </div>
                        <Button color="secondary" outline className="btn-sm px-3" onClick={() => navigate("/accounting/list")}>
                            <i className="bx bx-arrow-back me-1"></i> بازگشت
                        </Button>
                    </div>

                    <Row>
                        <Col lg={12}>
                            <Card className="shadow-sm border-0 mb-4">
                                <CardBody>
                                    <CardTitle className="h5 mb-3 text-primary">مشخصات کلی سند</CardTitle>
                                    <Row className="gy-3">
                                        <Col md={3}>
                                            <Label className="fw-bold font-size-13">تاریخ سند</Label>
                                            <div style={{direction:'rtl'}}><DatePickerWithIcon value={docDate} onChange={d => setDocDate(d.toDate().toISOString().slice(0, 10))} /></div>
                                        </Col>
                                        <Col md={3}>
                                            <Label className="fw-bold font-size-13">شماره عطف / دستی</Label>
                                            <Input value={manualNo} onChange={e => setManualNo(e.target.value)} placeholder="اختیاری" className="fw-bold"/>
                                        </Col>
                                        <Col md={6}>
                                            <Label className="fw-bold font-size-13">شرح هدر سند</Label>
                                            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="بابت..." />
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <Card className="shadow-sm border-0">
                        <CardBody className="p-0">
                            <div className="table-responsive" style={{minHeight: '350px', overflow: 'visible'}}>
                                <Table className="table mb-0 align-middle">
                                    <thead className="table-light">
                                    <tr>
                                        <th style={{width: '5%'}} className="text-center">#</th>
                                        <th style={{width: '22%'}}>حساب معین <span className="text-danger">*</span></th>
                                        <th style={{width: '22%'}}>تفصیلی شناور</th>
                                        <th style={{width: '25%'}}>شرح ردیف</th>
                                        <th style={{width: '10%'}}>بدهکار</th>
                                        <th style={{width: '10%'}}>بستانکار</th>
                                        <th style={{width: '6%'}} className="text-center">حذف</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {rows.map((row, idx) => (
                                        <tr key={row.id} className="align-top">
                                            <td className="text-center pt-3">{idx + 1}</td>
                                            <td className="p-2">
                                                <Select
                                                    ref={el => rowRefs.current[`moein-${row.id}`] = el}
                                                    value={row.moein} onChange={val => handleRowChange(idx, 'moein', val)} onKeyDown={e => handleKeyDown(e, idx, 'moein')}
                                                    options={moeinOptions} placeholder="جستجو..." styles={customStyles} menuPortalTarget={document.body} menuPosition={'fixed'}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <Select
                                                    ref={el => rowRefs.current[`tafsili-${row.id}`] = el}
                                                    value={row.tafsili} onChange={val => handleRowChange(idx, 'tafsili', val)} onKeyDown={e => handleKeyDown(e, idx, 'tafsili')}
                                                    options={tafsiliOptions} placeholder="انتخاب..." styles={customStyles} isClearable menuPortalTarget={document.body} menuPosition={'fixed'}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <Input innerRef={el => rowRefs.current[`desc-${row.id}`] = el} bsSize="sm" value={row.description} onChange={e => handleRowChange(idx, 'description', e.target.value)} onKeyDown={e => handleKeyDown(e, idx, 'desc')} placeholder={description || "شرح"} style={{height: '38px'}} />
                                            </td>
                                            <td className="p-2">
                                                <Input innerRef={el => rowRefs.current[`bed-${row.id}`] = el} bsSize="sm" value={row.bedDisplay} onChange={e => handleRowChange(idx, 'bedDisplay', e.target.value)} onKeyDown={e => handleKeyDown(e, idx, 'bed')} placeholder="0" className="fw-bold text-dark" style={{height: '38px', direction: 'ltr', textAlign: 'right'}} />
                                            </td>
                                            <td className="p-2">
                                                <Input innerRef={el => rowRefs.current[`bes-${row.id}`] = el} bsSize="sm" value={row.besDisplay} onChange={e => handleRowChange(idx, 'besDisplay', e.target.value)} onKeyDown={e => handleKeyDown(e, idx, 'bes')} placeholder="0" className="fw-bold text-dark" style={{height: '38px', direction: 'ltr', textAlign: 'right'}} />
                                            </td>
                                            <td className="text-center pt-2">
                                                <Button color="danger" outline size="sm" onClick={() => removeRow(idx)} className="mt-1"><i className="bx bx-trash font-size-16"></i></Button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            </div>

                            <div className="bg-light p-3 border-top">
                                <Row className="align-items-center">
                                    <Col md={4}><Button color="primary" outline onClick={addRow} className="w-100 border-dashed"><i className="bx bx-plus me-1"></i> افزودن سطر جدید (Enter)</Button></Col>
                                    <Col md={8}>
                                        <div className="d-flex justify-content-end gap-4 align-items-center">
                                            <div className="text-end"><small className="d-block text-muted mb-1">جمع بدهکار</small><h5 className="mb-0 fw-bold">{Number(renderTotalBed).toLocaleString()}</h5></div>
                                            <div className="text-end"><small className="d-block text-muted mb-1">جمع بستانکار</small><h5 className="mb-0 fw-bold">{Number(renderTotalBes).toLocaleString()}</h5></div>
                                            <div className="text-end border-start ps-4">
                                                <small className="d-block text-muted mb-1">وضعیت تراز</small>
                                                {renderDiff === 0 ? <Badge color="success" className="font-size-13 py-2 px-3"><i className="bx bx-check-double me-1 align-middle"></i> تراز است</Badge> : <Badge color="danger" className="font-size-13 py-2 px-3">ناتراز: {Number(Math.abs(renderDiff)).toLocaleString()}</Badge>}
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </CardBody>

                        <div className="card-footer bg-white border-top p-3 d-flex justify-content-end gap-2">
                            <Button color="info" size="lg" className="px-4 shadow" onClick={handlePrint}>
                                <i className="bx bx-printer me-2"></i> چاپ سند
                            </Button>
                            <Button color={isEditMode ? "warning" : "success"} size="lg" className="px-5 shadow" onClick={handleSubmit} disabled={loading || renderDiff !== 0 || renderTotalBed === 0}>
                                {loading ? <i className="bx bx-loader bx-spin"></i> : <i className={`bx ${isEditMode ? 'bx-edit' : 'bx-save'} me-2`}></i>}
                                {isEditMode ? "ویرایش نهایی سند" : "ثبت نهایی سند"}
                            </Button>
                        </div>
                    </Card>
                </Container>
            </div>
        </div>
    );
}