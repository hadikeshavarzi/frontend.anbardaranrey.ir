import React, { useState } from "react";
import { Card, CardBody, Row, Col, Label, Input } from "reactstrap";

import DatePickerWithIcon from "./DatePickerWithIcon";
import Select from "react-select";
import AddCustomerModal from "./AddCustomerModal";

const ReceiptOwnerSection = ({ deliverer, setDeliverer, owner, setOwner }) => {
    // لیست مشتریان انبار – بعداً از API می‌آید
    const [customers, setCustomers] = useState([
        { id: 1, name: "فولاد مرکزی" },
        { id: 2, name: "شرکت آهن گستران" },
        { id: 3, name: "صنایع فلزی پارس" },
    ]);

    // گزینه‌های سلکت
    const customerOptions = [
        ...customers.map((c) => ({ value: c.id, label: c.name })),
        { value: "add_new", label: "➕ افزودن مشتری جدید", isNew: true },
    ];

    const [showAddCustomer, setShowAddCustomer] = useState(false);

    // State مشتری جدید برای مودال
    const [newCustomer, setNewCustomer] = useState({
        type: "person",
        name: "",
        nationalId: "",
        mobile: "",
        phone: "",
        birthDate: "",
        address: "",
        postalCode: "",
        economicCode: "",
        description: "",
    });

    // انتخاب مشتری از سلکت
    const handleCustomerSelect = (selected) => {
        if (!selected) return;

        // اگر روی افزودن مشتری جدید کلیک شد
        if (selected.value === "add_new") {
            setShowAddCustomer(true);
            return;
        }

        // پیدا کردن مشتری انتخاب شده
        const selectedCustomer = customers.find((c) => c.id === selected.value);

        if (selectedCustomer) {
            // نام مالک اتوماتیک پر شود
            setOwner({ ...owner, name: selectedCustomer.name });
        }
    };

    // ذخیره مشتری جدید
    const handleAddCustomer = () => {
        if (!newCustomer.name.trim()) {
            alert("نام مشتری الزامی است");
            return;
        }

        const newId = customers.length + 1;

        const customerObj = {
            id: newId,
            name: newCustomer.name,
        };

        // افزودن به لیست مشتریان
        setCustomers([...customers, customerObj]);

        // پر کردن اطلاعات مالک
        setOwner({ ...owner, name: newCustomer.name });

        // ریست کردن فرم
        setNewCustomer({
            type: "person",
            name: "",
            nationalId: "",
            mobile: "",
            phone: "",
            birthDate: "",
            address: "",
            postalCode: "",
            economicCode: "",
            description: "",
        });

        setShowAddCustomer(false);
    };

    return (
        <>


            {/* ------------------- کارت مالک کالا ------------------- */}
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
                        {/* ----------- سلکت مشتری با سرچ ----------- */}
                        <Col md="4">
                            <Label>انتخاب مشتری *</Label>
                            <Select
                                options={customerOptions}
                                placeholder="جستجو یا انتخاب مشتری..."
                                onChange={handleCustomerSelect}
                                classNamePrefix="customer-select"
                                isSearchable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                styles={{
                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),

                                    menu: (base) => ({
                                        ...base,
                                        zIndex: 9999,
                                        backgroundColor: "#fff",
                                        borderRadius: "6px",
                                        boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                                        padding: "4px",
                                    }),

                                    menuList: (base) => ({
                                        ...base,
                                        backgroundColor: "#fff",
                                    }),
                                }}
                            />

                        </Col>
                        <Col md="4">
                            <Label>کد ملی *</Label>
                            <Input
                                value={owner.nationalId}
                                onChange={(e) =>
                                    setOwner({ ...owner, nationalId: e.target.value })
                                }
                            />
                        </Col>



                        <Col md="4">
                            <Label>تاریخ تولد</Label>
                            <DatePickerWithIcon
                                value={owner.birthDate}
                                onChange={(v) => setOwner({ ...owner, birthDate: v })}
                            />
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {/* ------------------- مودال افزودن مشتری ------------------- */}
            <AddCustomerModal
                isOpen={showAddCustomer}
                toggle={() => setShowAddCustomer(false)}
                newCustomer={newCustomer}
                setNewCustomer={setNewCustomer}
                handleAddCustomer={handleAddCustomer}
            />


            {/* ------------------- کارت تحویل‌دهنده ------------------- */}
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
                            <Label>کد ملی</Label>
                            <Input
                                value={deliverer.nationalId}
                                onChange={(e) =>
                                    setDeliverer({ ...deliverer, nationalId: e.target.value })
                                }
                            />
                        </Col>

                        <Col md="4">
                            <Label>نام / شرکت</Label>
                            <Input
                                value={deliverer.name}
                                onChange={(e) =>
                                    setDeliverer({ ...deliverer, name: e.target.value })
                                }
                            />
                        </Col>

                        <Col md="4">
                            <Label>تاریخ تولد</Label>
                            <DatePickerWithIcon
                                value={deliverer.birthDate}
                                onChange={(v) =>
                                    setDeliverer({ ...deliverer, birthDate: v })
                                }
                            />
                        </Col>
                    </Row>
                </CardBody>
            </Card>


        </>
    );
};

export default ReceiptOwnerSection;
