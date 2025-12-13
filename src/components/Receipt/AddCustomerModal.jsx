// src/components/Receipt/AddCustomerModal.jsx
import React, { useState } from "react";
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Row,
    Col,
    Label,
    Input,
    Button,
    FormFeedback,
} from "reactstrap";

import DatePickerWithIcon from "../Shared/DatePickerWithIcon";
import moment from "moment-jalaali";
import { post } from "../../helpers/api_helper";

const emptyCustomer = {
    customerType: "real",
    name: "",
    nationalId: "",
    mobile: "",
    phone: "",
    birthOrRegisterDate: null,
    postalCode: "",
    economicCode: "",
    address: "",
    description: "",
};

export default function AddCustomerModal({ isOpen, onClose, onSelect }) {
    const [customer, setCustomer] = useState(emptyCustomer);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // --------------------------------------------
    // Validation
    // --------------------------------------------
    const validate = () => {
        let e = {};

        if (!customer.name.trim()) e.name = "نام الزامی است";

        if (customer.nationalId) {
            if (customer.customerType === "real" && customer.nationalId.length !== 10)
                e.nationalId = "کد ملی باید 10 رقم باشد";

            if (
                customer.customerType === "company" &&
                customer.nationalId.length !== 11
            )
                e.nationalId = "شناسه ملی باید 11 رقم باشد";
        }

        if (customer.mobile && !/^09\d{9}$/.test(customer.mobile))
            e.mobile = "شماره موبایل معتبر نیست";

        if (customer.postalCode && customer.postalCode.length !== 10)
            e.postalCode = "کد پستی باید 10 رقم باشد";

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // --------------------------------------------
    // Save
    // --------------------------------------------
    const handleSave = async () => {
        if (!validate()) return;

        setSaving(true);
        try {
            let payload = { ...customer };

            // Trim empty strings → null
            Object.keys(payload).forEach((k) => {
                if (payload[k] === "") payload[k] = null;
            });

            // Convert Persian date → YYYY-MM-DD
            if (payload.birthOrRegisterDate?.toDate) {
                const jsDate = payload.birthOrRegisterDate.toDate();
                payload.birthOrRegisterDate = moment(jsDate).format("YYYY-MM-DD");
            }

            // Save to API
            const response = await post("/customers", payload);

            const saved =
                response?.data ||
                response?.doc ||
                response || {
                    id: Date.now(),
                    ...payload,
                };

            // Send selected customer back to parent
            onSelect(saved);

            // Reset
            setCustomer(emptyCustomer);
            setErrors({});
            onClose();

        } catch (err) {
            console.error("Error saving customer:", err);
            alert("خطا در ثبت مشتری");
        } finally {
            setSaving(false);
        }
    };

    // Helper
    const update = (key, value) => {
        setCustomer((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <Modal isOpen={isOpen} toggle={onClose} size="lg">
            <ModalHeader toggle={onClose}>افزودن مشتری جدید</ModalHeader>

            <ModalBody>
                {/* نوع مشتری */}
                <Row className="mb-3">
                    <Col md="4">
                        <Label>نوع مشتری</Label>
                        <Input
                            type="select"
                            value={customer.customerType}
                            onChange={(e) => update("customerType", e.target.value)}
                        >
                            <option value="real">حقیقی</option>
                            <option value="company">حقوقی</option>
                        </Input>
                    </Col>

                    <Col md="8">
                        <Label>نام / شرکت *</Label>
                        <Input
                            value={customer.name}
                            invalid={!!errors.name}
                            onChange={(e) => update("name", e.target.value)}
                        />
                        <FormFeedback>{errors.name}</FormFeedback>
                    </Col>
                </Row>

                {/* اطلاعات هویتی */}
                <Row className="mb-3">
                    <Col md="4">
                        <Label>
                            {customer.customerType === "real" ? "کد ملی" : "شناسه ملی"}
                        </Label>
                        <Input
                            value={customer.nationalId}
                            invalid={!!errors.nationalId}
                            maxLength={customer.customerType === "real" ? 10 : 11}
                            onChange={(e) => update("nationalId", e.target.value)}
                        />
                        <FormFeedback>{errors.nationalId}</FormFeedback>
                    </Col>

                    <Col md="4">
                        <Label>موبایل</Label>
                        <Input
                            value={customer.mobile}
                            invalid={!!errors.mobile}
                            maxLength={11}
                            placeholder="09123456789"
                            onChange={(e) => update("mobile", e.target.value)}
                        />
                        <FormFeedback>{errors.mobile}</FormFeedback>
                    </Col>

                    <Col md="4">
                        <Label>تلفن ثابت</Label>
                        <Input
                            value={customer.phone}
                            onChange={(e) => update("phone", e.target.value)}
                        />
                    </Col>
                </Row>

                {/* تاریخ و سایر اطلاعات */}
                <Row className="mb-3">
                    <Col md="4">
                        <Label>تاریخ تولد / ثبت</Label>
                        <DatePickerWithIcon
                            value={customer.birthOrRegisterDate}
                            onChange={(v) => update("birthOrRegisterDate", v)}
                        />
                    </Col>

                    <Col md="4">
                        <Label>کد پستی</Label>
                        <Input
                            value={customer.postalCode}
                            invalid={!!errors.postalCode}
                            maxLength={10}
                            onChange={(e) => update("postalCode", e.target.value)}
                        />
                        <FormFeedback>{errors.postalCode}</FormFeedback>
                    </Col>

                    <Col md="4">
                        <Label>شماره اقتصادی</Label>
                        <Input
                            value={customer.economicCode}
                            onChange={(e) => update("economicCode", e.target.value)}
                        />
                    </Col>
                </Row>

                {/* آدرس */}
                <Row className="mb-3">
                    <Col>
                        <Label>آدرس کامل</Label>
                        <Input
                            type="textarea"
                            rows={3}
                            value={customer.address}
                            onChange={(e) => update("address", e.target.value)}
                        />
                    </Col>
                </Row>

                {/* توضیحات */}
                <Row>
                    <Col>
                        <Label>توضیحات</Label>
                        <Input
                            type="textarea"
                            rows={2}
                            value={customer.description}
                            onChange={(e) => update("description", e.target.value)}
                        />
                    </Col>
                </Row>
            </ModalBody>

            <ModalFooter>
                <Button color="success" onClick={handleSave} disabled={saving}>
                    {saving ? "در حال ذخیره..." : "ذخیره مشتری"}
                </Button>

                <Button color="secondary" onClick={onClose} disabled={saving}>
                    انصراف
                </Button>
            </ModalFooter>
        </Modal>
    );
}
