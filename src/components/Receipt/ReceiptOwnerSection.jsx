import React, { useEffect, useState } from "react";
import { Card, CardBody, Row, Col, Label, Input } from "reactstrap";
import Select from "react-select";
import { selectStyles } from "../../components/Styles/selectStyles";
import DatePickerWithIcon from "../Shared/DatePickerWithIcon";
import AddCustomerModal from "./AddCustomerModal";
import { getCustomers } from "../../services/receiptService"; // ✅ سرویس جدید

export default function ReceiptOwnerSection({ value, onChange }) {
    const owner = value.owner || {};
    const deliverer = value.deliverer || {};
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);

    const update = (field, val) => onChange({ ...value, [field]: val });
    const updateOwner = (field, val) => update("owner", { ...owner, [field]: val });
    const updateDeliverer = (field, val) => update("deliverer", { ...deliverer, [field]: val });

    useEffect(() => {
        setLoading(true);
        getCustomers().then(data => setCustomers(data || [])).finally(() => setLoading(false));
    }, []);

    const customerOptions = [
        ...customers.map((c) => ({ value: c.id, label: `${c.name} — ${c.mobile || "بدون موبایل"}`, full: c })),
        { value: "add_new", label: "➕ افزودن مشتری جدید", isNew: true },
    ];

    const handleSelect = (type, selected) => {
        if (!selected) return update(type, {});
        if (selected.isNew) return setShowAdd(true);
        const c = selected.full;

        // ✅ ذخیره tafsiliId در استیت
        update(type, {
            id: c.id,
            tafsiliId: c.tafsili_id, // این خط جدید است
            name: c.name,
            nationalId: c.national_id,
            mobile: c.mobile,
            birthDate: c.birth_or_register_date
        });
    };

    const handleNewCustomer = (saved) => {
        setCustomers(prev => [...prev, saved]);
        update("owner", { id: saved.id, name: saved.name, nationalId: saved.national_id, mobile: saved.mobile, birthDate: saved.birth_or_register_date });
        setShowAdd(false);
    };

    return (
        <>
            <Card className="mb-3 receipt-card">
                <div className="receipt-card-header"><div className="title"><i className="ri-user-star-line me-2"></i>مالک کالا</div><div className="subtitle">صاحب اصلی کالا</div></div>
                <CardBody>
                    <Row className="gy-3">
                        <Col md="4"><Label className="fw-bold">انتخاب مشتری *</Label><Select styles={selectStyles} isLoading={loading} isClearable placeholder="انتخاب..." value={owner.id ? customerOptions.find(o => o.value === owner.id) : null} onChange={(s) => handleSelect("owner", s)} options={customerOptions} /></Col>
                        <Col md="4"><Label className="fw-bold">نام / شرکت *</Label><Input value={owner.name || ""} onChange={(e) => updateOwner("name", e.target.value)} /></Col>
                        <Col md="4"><Label className="fw-bold">کد ملی *</Label><Input value={owner.nationalId || ""} maxLength={11} onChange={(e) => updateOwner("nationalId", e.target.value)} /></Col>
                    </Row>
                    <Row className="gy-3 mt-1">
                        <Col md="4"><Label>تاریخ تولد / ثبت</Label><DatePickerWithIcon value={owner.birthDate} onChange={(v) => updateOwner("birthDate", v)} /></Col>
                        <Col md="4"><Label>موبایل</Label><Input value={owner.mobile || ""} maxLength={11} onChange={(e) => updateOwner("mobile", e.target.value)} /></Col>
                    </Row>
                </CardBody>
            </Card>

            <Card className="mb-3 receipt-card">
                <div className="receipt-card-header"><div className="title"><i className="ri-user-received-2-line me-2"></i>تحویل‌دهنده</div><div className="subtitle">در صورت تفاوت با مالک</div></div>
                <CardBody>
                    <Row className="gy-3">
                        <Col md="4"><Label>انتخاب مشتری</Label><Select styles={selectStyles} isLoading={loading} isClearable placeholder="انتخاب..." value={deliverer.id ? customerOptions.find(o => o.value === deliverer.id) : null} onChange={(s) => handleSelect("deliverer", s)} options={customerOptions} /></Col>
                        <Col md="4"><Label>نام / شرکت</Label><Input value={deliverer.name || ""} onChange={(e) => updateDeliverer("name", e.target.value)} /></Col>
                        <Col md="4"><Label>کد ملی</Label><Input value={deliverer.nationalId || ""} maxLength={11} onChange={(e) => updateDeliverer("nationalId", e.target.value)} /></Col>
                    </Row>
                </CardBody>
            </Card>
            <AddCustomerModal isOpen={showAdd} onClose={() => setShowAdd(false)} onSelect={handleNewCustomer} />
        </>
    );
}