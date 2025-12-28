import React, { useState } from "react";
import { Container, Card, CardBody, Table, Button, Row, Col, Input, Badge, Spinner, Label } from "reactstrap";
import { getJournalReport } from "../../../services/reportService";
import DatePickerWithIcon from "../../../components/Shared/DatePickerWithIcon";
import { toPersianDate, formatNumber } from "../../../helpers/utils";

export default function JournalReport() {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // ✅ تهیه گزارش
    const handleSearch = async () => {
        setLoading(true);
        try {
            // ✅ تبدیل تاریخ به فرمت YYYY-MM-DD
            const formattedStart = startDate ? startDate.slice(0, 10) : null;
            const formattedEnd = endDate ? endDate.slice(0, 10) : null;

            console.log("📅 Fetching journal:", { formattedStart, formattedEnd });

            const result = await getJournalReport(formattedStart, formattedEnd);
            setData(result || []);
            setFilteredData(result || []);
        } catch (error) {
            console.error("Error fetching journal:", error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ تابع تبدیل تاریخ DatePicker
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

    // فیلتر هوشمند
    const handleFilter = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);

        if (!term) {
            setFilteredData(data);
            return;
        }

        const filtered = data.filter(doc => {
            const inHeader =
                doc.description?.toLowerCase().includes(term) ||
                doc.manual_no?.includes(term) ||
                doc.id.toString().includes(term);

            const inEntries = doc.financial_entries?.some(entry =>
                entry.description?.toLowerCase().includes(term) ||
                entry.moein?.title?.toLowerCase().includes(term) ||
                entry.tafsili?.title?.toLowerCase().includes(term)
            );

            return inHeader || inEntries;
        });
        setFilteredData(filtered);
    };

    // ✅ پاک کردن فیلترها
    const handleClear = () => {
        setStartDate(null);
        setEndDate(null);
        setSearchTerm("");
        setData([]);
        setFilteredData([]);
    };

    // ✅ محاسبه جمع کل
    const totalBed = filteredData.reduce((sum, doc) => {
        return sum + (doc.financial_entries?.reduce((s, e) => s + (Number(e.bed) || 0), 0) || 0);
    }, 0);

    const totalBes = filteredData.reduce((sum, doc) => {
        return sum + (doc.financial_entries?.reduce((s, e) => s + (Number(e.bes) || 0), 0) || 0);
    }, 0);

    return (
        <div className="page-content">
            <Container fluid>
                <h4 className="mb-4 font-size-18 fw-bold">دفتر روزنامه</h4>
                <Card>
                    <CardBody>
                        <Row className="mb-4 gy-3 bg-light p-3 rounded align-items-end">
                            <Col md={3}>
                                <Label>از تاریخ</Label>
                                <div style={{direction: 'rtl'}}>
                                    <DatePickerWithIcon
                                        value={startDate}
                                        onChange={handleDateChange(setStartDate)}
                                    />
                                </div>
                            </Col>
                            <Col md={3}>
                                <Label>تا تاریخ</Label>
                                <div style={{direction: 'rtl'}}>
                                    <DatePickerWithIcon
                                        value={endDate}
                                        onChange={handleDateChange(setEndDate)}
                                    />
                                </div>
                            </Col>
                            <Col md={2}>
                                <div className="d-flex gap-2">
                                    <Button color="primary" className="flex-grow-1" onClick={handleSearch} disabled={loading}>
                                        {loading ? <Spinner size="sm"/> : <><i className="bx bx-search-alt me-1"></i> گزارش</>}
                                    </Button>
                                    <Button color="secondary" outline onClick={handleClear} title="پاک کردن">
                                        <i className="bx bx-refresh"></i>
                                    </Button>
                                </div>
                            </Col>
                            <Col md={4}>
                                <Label>جستجو در نتایج</Label>
                                <Input
                                    placeholder="جستجو در شرح، سند یا حساب..."
                                    value={searchTerm}
                                    onChange={handleFilter}
                                />
                            </Col>
                        </Row>

                        {/* ✅ خلاصه آمار */}
                        {filteredData.length > 0 && (
                            <Row className="mb-3">
                                <Col>
                                    <div className="d-flex gap-4 justify-content-end">
                                        <Badge color="light" className="text-dark p-2 font-size-12">
                                            تعداد اسناد: <strong>{filteredData.length}</strong>
                                        </Badge>
                                        <Badge color="success" className="p-2 font-size-12">
                                            جمع بدهکار: <strong>{formatNumber(totalBed)}</strong>
                                        </Badge>
                                        <Badge color="danger" className="p-2 font-size-12">
                                            جمع بستانکار: <strong>{formatNumber(totalBes)}</strong>
                                        </Badge>
                                    </div>
                                </Col>
                            </Row>
                        )}

                        <div className="table-responsive">
                            <Table bordered hover className="text-center font-size-13 align-middle mb-0">
                                <thead className="table-light">
                                <tr>
                                    <th style={{width: '120px'}}>مشخصات سند</th>
                                    <th style={{width: '80px'}}>کد حساب</th>
                                    <th>شرح حساب / شرح ردیف</th>
                                    <th style={{width: '130px'}}>بدهکار</th>
                                    <th style={{width: '130px'}}>بستانکار</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredData.length > 0 ? filteredData.map((doc) => (
                                    <React.Fragment key={doc.id}>
                                        {doc.financial_entries?.map((entry, index) => (
                                            <tr key={entry.id}>
                                                {/* ادغام سلول شماره سند و تاریخ */}
                                                {index === 0 && (
                                                    <td
                                                        rowSpan={doc.financial_entries.length + 1}
                                                        className="bg-light fw-bold align-top pt-3 border-bottom-0"
                                                        style={{verticalAlign: 'top'}}
                                                    >
                                                        <div className="mb-1">
                                                            <Badge color="primary" className="font-size-12">سند #{doc.id}</Badge>
                                                        </div>
                                                        <div className="text-muted font-size-11 mb-2">
                                                            {toPersianDate(doc.doc_date)}
                                                        </div>
                                                        {doc.manual_no && (
                                                            <Badge color="info" className="font-size-10">
                                                                عطف: {doc.manual_no}
                                                            </Badge>
                                                        )}
                                                        {doc.description && (
                                                            <div className="text-muted font-size-10 mt-2" style={{maxWidth: '100px'}}>
                                                                {doc.description}
                                                            </div>
                                                        )}
                                                    </td>
                                                )}

                                                <td className="font-monospace">{entry.moein?.code}</td>
                                                <td className="text-start">
                                                    <span className="fw-bold text-primary">{entry.moein?.title}</span>
                                                    {entry.tafsili && (
                                                        <span className="text-dark ms-1">({entry.tafsili.title})</span>
                                                    )}
                                                    {entry.description && (
                                                        <div className="text-muted font-size-11 mt-1">
                                                            {entry.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="text-success fw-bold">
                                                    {Number(entry.bed) > 0 ? formatNumber(entry.bed) : ''}
                                                </td>
                                                <td className="text-danger fw-bold">
                                                    {Number(entry.bes) > 0 ? formatNumber(entry.bes) : ''}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* سطر جمع سند */}
                                        <tr className="table-secondary" style={{borderTop: '2px solid #6c757d'}}>
                                            <td colSpan="2" className="text-end fw-bold text-dark py-2">
                                                جمع سند:
                                            </td>
                                            <td className="fw-bold text-success py-2">
                                                {formatNumber(doc.financial_entries?.reduce((s, e) => s + (Number(e.bed) || 0), 0))}
                                            </td>
                                            <td className="fw-bold text-danger py-2">
                                                {formatNumber(doc.financial_entries?.reduce((s, e) => s + (Number(e.bes) || 0), 0))}
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="py-5 text-muted">
                                            {loading ? (
                                                <><Spinner size="sm" className="me-2" /> در حال دریافت اطلاعات...</>
                                            ) : (
                                                <>
                                                    <i className="bx bx-search-alt font-size-24 d-block mb-2"></i>
                                                    برای مشاهده گزارش، تاریخ را انتخاب و دکمه گزارش را بزنید
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                )}
                                </tbody>

                                {/* ✅ جمع کل پایین جدول */}
                                {filteredData.length > 0 && (
                                    <tfoot>
                                    <tr className="table-dark fw-bold font-size-14">
                                        <td colSpan="3" className="text-end py-3">
                                            جمع کل دوره:
                                        </td>
                                        <td className="text-success py-3">
                                            {formatNumber(totalBed)}
                                        </td>
                                        <td className="text-warning py-3">
                                            {formatNumber(totalBes)}
                                        </td>
                                    </tr>
                                    </tfoot>
                                )}
                            </Table>
                        </div>
                    </CardBody>
                </Card>
            </Container>
        </div>
    );
}