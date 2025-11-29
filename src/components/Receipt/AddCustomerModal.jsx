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

import DatePickerWithIcon from "./DatePickerWithIcon";
import moment from "moment-jalaali";
import { post } from "../../helpers/api_helper";

const AddCustomerModal = ({
    isOpen,
    toggle,
    onSave,
}) => {
    // -------------------------------
    // فرم مودال مشتری جدید
    // -------------------------------
    const [customer, setCustomer] = useState({
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
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // -------------------------------
    // ولیدیشن خیلی سبک
    // -------------------------------
    const validate = () => {
        let e = {};

        if (!customer.name.trim()) e.name = "نام الزامی است";
        if (customer.customerType === "real" && customer.nationalId && customer.nationalId.length !== 10)
            e.nationalId = "کد ملی باید 10 رقم باشد";
        if (customer.customerType === "company" && customer.nationalId && customer.nationalId.length !== 11)
            e.nationalId = "شناسه ملی باید 11 رقم باشد";

        if (customer.mobile && !/^09\d{9}$/.test(customer.mobile))
            e.mobile = "موبایل معتبر نیست";

        if (customer.postalCode && customer.postalCode.length !== 10)
            e.postalCode = "کد پستی باید 10 رقم باشد";

        setErrors(e);

        return Object.keys(e).length === 0;
    };

    // -------------------------------
    // ذخیره مشتری جدید
    // -------------------------------
    const handleSave = async () => {
        if (!validate()) return;

        setLoading(true);

        try {
            const payload = { ...customer };

            // تبدیل رشته‌های خالی به null
            Object.keys(payload).forEach((k) => {
                if (payload[k] === "") payload[k] = null;
            });

            // تبدیل تاریخ
            if (payload.birthOrRegisterDate && payload.birthOrRegisterDate.toDate) {
                const jsDate = payload.birthOrRegisterDate.toDate();
                payload.birthOrRegisterDate = moment(jsDate).format("YYYY-MM-DD");
            }

            // ارسال به API
            const result = await post("/customers", payload);

            // خروجی payload مشتری ذخیره‌شده
            const savedCustomer =
                result?.doc || result || {
                    id: Date.now(),
                    ...payload,
                };

            // ارسال به بخش رسید
            onSave(savedCustomer);

            // ریست فرم
            setCustomer({
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
            });

            setErrors({});
            toggle();
        } catch (err) {
            alert("خطا در ثبت مشتری");
        }

        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} size="lg" toggle={toggle}>
            <ModalHeader toggle={toggle}>افزودن مشتری جدید</ModalHeader>

            <ModalBody>
                {/* نوع مشتری */}
                <Row className="mb-3">
                    <Col md="4">
                        <Label>نوع مشتری</Label>
                        <Input
                            type="select"
                            value={customer.customerType}
                            onChange={(e) =>
                                setCustomer({ ...customer, customerType: e.target.value })
                            }
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
                            onChange={(e) =>
                                setCustomer({ ...customer, name: e.target.value })
                            }
                        />
                        <FormFeedback>{errors.name}</FormFeedback>
                    </Col>
                </Row>

                {/* اطلاعات هویتی */}
                <Row className="mb-3">
                    <Col md="4">
                        <Label>
                            {customer.customerType === "real"
                                ? "کد ملی"
                                : "شناسه ملی"}
                        </Label>
                        <Input
                            value={customer.nationalId}
                            invalid={!!errors.nationalId}
                            maxLength={customer.customerType === "real" ? 10 : 11}
                            onChange={(e) =>
                                setCustomer({
                                    ...customer,
                                    nationalId: e.target.value,
                                })
                            }
                        />
                        <FormFeedback>{errors.nationalId}</FormFeedback>
                    </Col>

                    <Col md="4">
                        <Label>موبایل</Label>
                        <Input
                            value={customer.mobile}
                            invalid={!!errors.mobile}
                            onChange={(e) =>
                                setCustomer({ ...customer, mobile: e.target.value })
                            }
                            placeholder="09123456789"
                            maxLength={11}
                        />
                        <FormFeedback>{errors.mobile}</FormFeedback>
                    </Col>

                    <Col md="4">
                        <Label>تلفن ثابت</Label>
                        <Input
                            value={customer.phone}
                            onChange={(e) =>
                                setCustomer({ ...customer, phone: e.target.value })
                            }
                        />
                    </Col>
                </Row>

                {/* تاریخ / پستی / اقتصادی */}
                <Row className="mb-3">
                    <Col md="4">
                        <Label>تاریخ تولد / ثبت</Label>
                        <DatePickerWithIcon
                            value={customer.birthOrRegisterDate}
                            onChange={(v) =>
                                setCustomer({
                                    ...customer,
                                    birthOrRegisterDate: v,
                                })
                            }
                        />
                    </Col>

                    <Col md="4">
                        <Label>کد پستی</Label>
                        <Input
                            value={customer.postalCode}
                            invalid={!!errors.postalCode}
                            maxLength={10}
                            onChange={(e) =>
                                setCustomer({
                                    ...customer,
                                    postalCode: e.target.value,
                                })
                            }
                        />
                        <FormFeedback>{errors.postalCode}</FormFeedback>
                    </Col>

                    <Col md="4">
                        <Label>شماره اقتصادی</Label>
                        <Input
                            value={customer.economicCode}
                            onChange={(e) =>
                                setCustomer({
                                    ...customer,
                                    economicCode: e.target.value,
                                })
                            }
                        />
                    </Col>
                </Row>

                {/* آدرس */}
                <Row className="mb-3">
                    <Col>
                        <Label>آدرس کامل</Label>
                        <Input
                            type="textarea"
                            rows="3"
                            value={customer.address}
                            onChange={(e) =>
                                setCustomer({ ...customer, address: e.target.value })
                            }
                        />
                    </Col>
                </Row>

                {/* توضیحات */}
                <Row>
                    <Col>
                        <Label>توضیحات</Label>
                        <Input
                            type="textarea"
                            rows="2"
                            value={customer.description}
                            onChange={(e) =>
                                setCustomer({
                                    ...customer,
                                    description: e.target.value,
                                })
                            }
                        />
                    </Col>
                </Row>
            </ModalBody>

            <ModalFooter>
                <Button color="success" onClick={handleSave} disabled={loading}>
                    {loading ? "در حال ذخیره..." : "ذخیره مشتری"}
                </Button>

                <Button color="secondary" onClick={toggle} disabled={loading}>
                    انصراف
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default AddCustomerModal;
