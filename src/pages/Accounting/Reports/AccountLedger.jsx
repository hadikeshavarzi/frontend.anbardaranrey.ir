import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, CardBody, Table, Button, Label, Spinner, Badge } from "reactstrap";
import Select from "react-select";
import { getTafsiliLedger } from "../../../services/reportService";
import { getPeopleTafsilis, getCashes, getBanks } from "../../../services/treasuryService";
import { supabase } from "../../../helpers/supabase";
import { toPersianDate, formatNumber } from "../../../helpers/utils";

export default function AccountLedger() {
    const [options, setOptions] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(false);

    // لود لیست حساب‌ها برای انتخاب در دراپ‌داون
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const people = await getPeopleTafsilis();
                const banks = await getBanks();
                const cashes = await getCashes();

                // دریافت دستگاه‌های POS
                const { data: posDevices } = await supabase
                    .from('treasury_pos')
                    .select('id, title, terminal_id, tafsili_id, treasury_banks(bank_name)')
                    .order('id', { ascending: false });

                const all = [
                    {
                        label: "👤 اشخاص و شرکت‌ها",
                        options: people.map(p => ({
                            value: p.id,
                            label: `${p.code} - ${p.title}`
                        }))
                    },
                    {
                        label: "🏦 بانک‌ها",
                        options: banks.map(b => ({
                            value: b.tafsili_id || b.accounting_tafsili?.id,
                            label: `${b.bank_name} - ${b.account_no}`
                        })).filter(b => b.value)
                    },
                    {
                        label: "💳 دستگاه‌های POS",
                        options: (posDevices || []).map(pos => ({
                            value: pos.tafsili_id,
                            label: `${pos.title || pos.treasury_banks?.bank_name} - پایانه ${pos.terminal_id}`
                        })).filter(p => p.value)
                    },
                    {
                        label: "💵 صندوق‌ها",
                        options: cashes.map(c => ({
                            value: c.tafsili_id || c.accounting_tafsili?.id,
                            label: c.title
                        })).filter(c => c.value)
                    },
                ];
                setOptions(all);
            } catch (e) { console.error(e); }
        };
        loadOptions();
    }, []);

    // دریافت گزارش
    const handleReport = async () => {
        if (!selectedAccount) return;
        setLoading(true);
        try {
            const data = await getTafsiliLedger(selectedAccount.value);
            setLedger(data);
        } finally { setLoading(false); }
    };

    let runningBalance = 0;

    return (
        <div className="page-content">
            <Container fluid>
                <h4 className="mb-4 fw-bold font-size-18">دفتر ریز گردش حساب (معین/تفصیلی)</h4>
                <Card>
                    <CardBody>
                        <Row className="align-items-end mb-4 bg-light p-3 rounded">
                            <Col md={5}>
                                <Label>انتخاب حساب (طرف حساب، بانک، POS یا صندوق)</Label>
                                <Select
                                    options={options}
                                    onChange={setSelectedAccount}
                                    placeholder="جستجو کنید..."
                                    noOptionsMessage={() => "موردی یافت نشد"}
                                />
                            </Col>
                            <Col md={2}>
                                <Button color="primary" className="w-100" onClick={handleReport} disabled={loading || !selectedAccount}>
                                    {loading ? <Spinner size="sm"/> : 'مشاهده گردش'}
                                </Button>
                            </Col>
                        </Row>

                        <Table bordered hover responsive className="text-center font-size-13 align-middle">
                            <thead className="table-light">
                            <tr>
                                <th>تاریخ</th>
                                <th>سند</th>
                                <th>شرح عملیات</th>
                                <th>بدهکار</th>
                                <th>بستانکار</th>
                                <th>مانده</th>
                                <th>تشخیص</th>
                            </tr>
                            </thead>
                            <tbody>
                            {ledger.length > 0 ? ledger.map((row) => {
                                const bed = Number(row.bed) || 0;
                                const bes = Number(row.bes) || 0;
                                runningBalance += (bed - bes);

                                return (
                                    <tr key={row.id}>
                                        <td>{toPersianDate(row.document?.doc_date)}</td>
                                        <td><Badge color="light" className="text-dark">{row.document?.id}</Badge></td>
                                        <td className="text-start" style={{maxWidth: '300px'}}>{row.description}</td>
                                        <td className="text-success">{bed > 0 ? formatNumber(bed) : '-'}</td>
                                        <td className="text-danger">{bes > 0 ? formatNumber(bes) : '-'}</td>
                                        <td className="fw-bold bg-light">{formatNumber(Math.abs(runningBalance))}</td>
                                        <td>
                                            {runningBalance > 0 ? <Badge color="success">بدهکار</Badge> :
                                                runningBalance < 0 ? <Badge color="danger">بستانکار</Badge> :
                                                    <Badge color="secondary">تسویه</Badge>}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="7" className="py-5 text-muted">
                                    {selectedAccount ? "گردشی برای این حساب یافت نشد." : "لطفاً ابتدا یک حساب را انتخاب کنید."}
                                </td></tr>
                            )}
                            </tbody>
                            {ledger.length > 0 && (
                                <tfoot>
                                <tr className="table-secondary fw-bold">
                                    <td colSpan="3" className="text-end">مجموع کل:</td>
                                    <td className="text-success">{formatNumber(ledger.reduce((s,x)=>s+(Number(x.bed)||0),0))}</td>
                                    <td className="text-danger">{formatNumber(ledger.reduce((s,x)=>s+(Number(x.bes)||0),0))}</td>
                                    <td className="text-primary font-size-15">{formatNumber(Math.abs(runningBalance))}</td>
                                    <td>{runningBalance > 0 ? 'بد' : runningBalance < 0 ? 'بس' : '-'}</td>
                                </tr>
                                </tfoot>
                            )}
                        </Table>
                    </CardBody>
                </Card>
            </Container>
        </div>
    );
}