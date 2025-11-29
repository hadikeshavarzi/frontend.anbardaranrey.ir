import React, { useEffect, useState } from "react";
import { Card, CardBody, Row, Col, Label, Input } from "reactstrap";
import Select from "react-select";

import DatePickerWithIcon from "./DatePickerWithIcon";
import AddCustomerModal from "./AddCustomerModal";
import { get } from "../../helpers/api_helper";

const ReceiptOwnerSection = ({ deliverer, setDeliverer, owner, setOwner }) => {
    // ================================
    // 1) لود مشتری‌ها از API
    // ================================
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const res = await get("/customers?limit=1000");
            setCustomers(res.docs || []);
        } catch (err) {
            console.error("Error loading customers", err);
        }
    };

    // ================================
    // گزینه‌های Select مشتری
    // ================================
    const customerOptions = [
        ...customers.map((c) => ({
            value: c.id,
            label: `${c.name} — ${c.mobile || "بدون موبایل"}`,
            full: c,
        })),
        { value: "add_new", label: "➕ افزودن مشتری جدید", isNew: true },
    ];

    // ================================
    // حالت مودال مشتری جدید
    // ================================
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        customerType: "real",
        name: "",
        nationalId: "",
        mobile: "",
        phone: "",
        birthOrRegisterDate: "",
        postalCode: "",
        economicCode: "",
        address: "",
        description: "",
    });

    // ================================
    // انتخاب مشتری برای مالک کالا
    // ================================
    const handleSelectOwner = (selected) => {
        if (!selected) return;

        if (selected.isNew) {
            setShowAddCustomer(true);
            return;
        }

        const data = selected.full;

        setOwner({
            id: data.id,
            name: data.name,
            nationalId: data.nationalId,
            birthDate: data.birthOrRegisterDate,
            mobile: data.mobile,
        });
    };

    // ================================
    // ذخیره مشتری جدید در لیست + انتخاب آن
    // ================================
    const handleAddCustomer = (savedCustomer) => {
        setCustomers((prev) => [...prev, savedCustomer]);

        setOwner({
            id: savedCustomer.id,
            name: savedCustomer.name,
            nationalId: savedCustomer.nationalId,
            birthDate: savedCustomer.birthOrRegisterDate,
            mobile: savedCustomer.mobile,
        });

        setShowAddCustomer(false);
    };

    // ================================
    // انتخاب مشتری برای تحویل‌دهنده
    // ================================
    const handleSelectDeliverer = (selected) => {
        if (!selected) return;

        if (selected.isNew) {
            setShowAddCustomer(true);
            return;
        }

        const data = selected.full;

        setDeliverer({
            id: data.id,
            name: data.name,
            nationalId: data.nationalId,
            birthDate: data.birthOrRegisterDate,
            mobile: data.mobile,
        });
    };

    return (
        <>
            {/* ======================================
                کارت مالک کالا
            ======================================= */}
            <Card className="mb-3 receipt-card">
                <div className="receipt-card-header">
                    <div className="title">
                        <i className="ri-user-star-line me-2"></i>
                        اطلاعات مالک کالا
                    </div>
                    <div className="subtitle">صاحب اصلی کالا در رسید انبار</div>
                </div>

                <CardBody>
                    <Row>
                        {/* Select مشتری با سرچ */}
                        <Col md="4">
                            <Label>انتخاب مشتری *</Label>
                            <Select
                                options={customerOptions}
                                value={
                                    owner.id
                                        ? customerOptions.find((o) => o.value === owner.id)
                                        : null
                                }
                                onChange={handleSelectOwner}
                                placeholder="جستجو یا انتخاب مشتری..."
                                isSearchable
                                classNamePrefix="customer-select"
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                styles={{
                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                }}
                            />
                        </Col>

                        <Col md="4">
                            <Label>کد ملی *</Label>
                            <Input
                                value={owner.nationalId || ""}
                                onChange={(e) =>
                                    setOwner({ ...owner, nationalId: e.target.value })
                                }
                            />
                        </Col>

                        <Col md="4">
                            <Label>تاریخ تولد</Label>
                            <DatePickerWithIcon
                                value={owner.birthDate}
                                onChange={(v) =>
                                    setOwner({ ...owner, birthDate: v })
                                }
                            />
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {/* ======================================
                کارت تحویل‌دهنده
            ======================================= */}
            <Card className="mb-3 receipt-card">
                <div className="receipt-card-header">
                    <div className="title">
                        <i className="ri-user-received-2-line me-2"></i>
                        اطلاعات تحویل‌دهنده
                    </div>
                    <div className="subtitle">شخص یا شرکت تحویل‌دهنده کالا</div>
                </div>

                <CardBody>
                    <Row>
                        <Col md="4">
                            <Label>انتخاب مشتری</Label>
                            <Select
                                options={customerOptions}
                                value={
                                    deliverer.id
                                        ? customerOptions.find((o) => o.value === deliverer.id)
                                        : null
                                }
                                onChange={handleSelectDeliverer}
                                placeholder="جستجو یا انتخاب..."
                                isSearchable
                                classNamePrefix="customer-select"
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                            />
                        </Col>

                        <Col md="4">
                            <Label>نام / شرکت</Label>
                            <Input
                                value={deliverer.name || ""}
                                onChange={(e) =>
                                    setDeliverer({ ...deliverer, name: e.target.value })
                                }
                            />
                        </Col>

                        <Col md="4">
                            <Label>کد ملی</Label>
                            <Input
                                value={deliverer.nationalId || ""}
                                onChange={(e) =>
                                    setDeliverer({ ...deliverer, nationalId: e.target.value })
                                }
                            />
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {/* ======================================
                مودال افزودن مشتری جدید
            ======================================= */}
            <AddCustomerModal
                isOpen={showAddCustomer}
                toggle={() => setShowAddCustomer(false)}
                newCustomer={newCustomer}
                setNewCustomer={setNewCustomer}
                onSave={handleAddCustomer}
            />
        </>
    );
};

export default ReceiptOwnerSection;
