import React, { useEffect, useState } from "react";
import {
    Container, Row, Col, Card, CardBody, Form, Input, Label, Button, Spinner, Alert, FormFeedback
} from "reactstrap";
import { useFormik } from "formik";
import { useParams, useNavigate } from "react-router-dom";

// API helper
import { get, put } from "../../helpers/api_helper.jsx";

// Calendar helpers
import DatePickerWithIcon from "../../components/Shared/DatePickerWithIcon";
import moment from "moment-jalaali";
import { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

// Validation schema
import { customerValidationSchema } from "../../utils/validationSchemas";

const EditCustomer = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const formik = useFormik({
        initialValues: {
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
        },

        validationSchema: customerValidationSchema,

        onSubmit: async (values) => {
            setSaving(true);
            setError("");
            setSuccess("");

            try {
                // Mapping دقیق برای Supabase
                const dataToSend = {
                    customer_type: values.customerType,
                    name: values.name,
                    national_id: values.nationalId,
                    mobile: values.mobile,
                    phone: values.phone || null,
                    postal_code: values.postalCode || null,
                    economic_code: values.economicCode || null,
                    address: values.address || null,
                    description: values.description || null,
                    birth_or_register_date: values.birthOrRegisterDate
                        ? moment(values.birthOrRegisterDate.toDate()).format("YYYY-MM-DD")
                        : null,
                };

                const response = await put(`/customers/${id}`, dataToSend);

                if (response?.success) {
                    setSuccess("مشتری با موفقیت ویرایش شد");
                    setTimeout(() => navigate("/customers/list"), 1200);
                } else {
                    setError("خطا در ذخیره اطلاعات");
                }

            } catch (err) {
                console.error("Update Error:", err);
                setError(
                    err?.response?.data?.error?.message ||
                    "خطا در ویرایش اطلاعات مشتری"
                );
            }

            setSaving(false);
        },
    });

    // ---------------------------------------------------
    // Load customer data
    // ---------------------------------------------------
    const loadCustomer = async () => {
        try {
            const res = await get(`/customers/${id}`);

            const data = res?.data || res;

            if (!data) {
                setError("اطلاعات مشتری یافت نشد.");
                setLoading(false);
                return;
            }

            // تاریخ: تبدیل میلادی → جلالی DateObject
            let dateObject = null;
            if (data.birth_or_register_date) {
                const gDate = new Date(data.birth_or_register_date);
                dateObject = new DateObject({
                    date: gDate,
                    calendar: persian,
                    locale: persian_fa,
                });
            }

            formik.setValues({
                customerType: data.customer_type || "real",
                name: data.name || "",
                nationalId: data.national_id || "",
                mobile: data.mobile || "",
                phone: data.phone || "",
                birthOrRegisterDate: dateObject,
                postalCode: data.postal_code || "",
                economicCode: data.economic_code || "",
                address: data.address || "",
                description: data.description || "",
            });

        } catch (err) {
            console.error("Load Error:", err);
            setError("خطا در دریافت اطلاعات مشتری.");
        }

        setLoading(false);
    };

    useEffect(() => {
        if (id) loadCustomer();
    }, [id]);

    if (loading) {
        return (
            <div className="p-5 text-center">
                <Spinner />
            </div>
        );
    }

    // ---------------------------------------------------
    // UI Component
    // ---------------------------------------------------
    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col lg={10} className="mx-auto">

                            <Card>
                                <CardBody>

                                    <h4 className="card-title mb-4">ویرایش مشتری</h4>

                                    {error && <Alert color="danger">{error}</Alert>}
                                    {success && <Alert color="success">{success}</Alert>}

                                    <Form onSubmit={formik.handleSubmit}>

                                        {/* نوع مشتری */}
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>نوع مشتری</Label>
                                                    <Input
                                                        type="select"
                                                        name="customerType"
                                                        value={formik.values.customerType}
                                                        onChange={formik.handleChange}
                                                        invalid={formik.touched.customerType && !!formik.errors.customerType}
                                                    >
                                                        <option value="real">حقیقی</option>
                                                        <option value="company">حقوقی</option>
                                                    </Input>
                                                    <FormFeedback>{formik.errors.customerType}</FormFeedback>
                                                </div>
                                            </Col>

                                            <Col md={8}>
                                                <div className="mb-3">
                                                    <Label>نام / شرکت</Label>
                                                    <Input
                                                        name="name"
                                                        value={formik.values.name}
                                                        onChange={formik.handleChange}
                                                        invalid={formik.touched.name && !!formik.errors.name}
                                                    />
                                                    <FormFeedback>{formik.errors.name}</FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* تاریخ + شناسه ملی + موبایل */}
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>تاریخ تولد / ثبت</Label>
                                                    <DatePickerWithIcon
                                                        value={formik.values.birthOrRegisterDate}
                                                        onChange={(dateObj) =>
                                                            formik.setFieldValue("birthOrRegisterDate", dateObj)
                                                        }
                                                    />
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>
                                                        {formik.values.customerType === "real" ? "کد ملی" : "شناسه ملی"}
                                                    </Label>
                                                    <Input
                                                        name="nationalId"
                                                        value={formik.values.nationalId}
                                                        onChange={formik.handleChange}
                                                        invalid={formik.touched.nationalId && !!formik.errors.nationalId}
                                                    />
                                                    <FormFeedback>{formik.errors.nationalId}</FormFeedback>
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>موبایل</Label>
                                                    <Input
                                                        name="mobile"
                                                        value={formik.values.mobile}
                                                        onChange={formik.handleChange}
                                                        invalid={formik.touched.mobile && !!formik.errors.mobile}
                                                        maxLength={11}
                                                    />
                                                    <FormFeedback>{formik.errors.mobile}</FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* تلفن - کد پستی - اقتصادی */}
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>تلفن ثابت</Label>
                                                    <Input
                                                        name="phone"
                                                        value={formik.values.phone}
                                                        onChange={formik.handleChange}
                                                    />
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>کد پستی</Label>
                                                    <Input
                                                        name="postalCode"
                                                        value={formik.values.postalCode}
                                                        onChange={formik.handleChange}
                                                        invalid={formik.touched.postalCode && !!formik.errors.postalCode}
                                                        maxLength={10}
                                                    />
                                                    <FormFeedback>{formik.errors.postalCode}</FormFeedback>
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>شماره اقتصادی</Label>
                                                    <Input
                                                        name="economicCode"
                                                        value={formik.values.economicCode}
                                                        onChange={formik.handleChange}
                                                        invalid={formik.touched.economicCode && !!formik.errors.economicCode}
                                                    />
                                                    <FormFeedback>{formik.errors.economicCode}</FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* آدرس */}
                                        <div className="mb-3">
                                            <Label>آدرس</Label>
                                            <Input
                                                type="textarea"
                                                rows={3}
                                                name="address"
                                                value={formik.values.address}
                                                onChange={formik.handleChange}
                                            />
                                        </div>

                                        {/* توضیحات */}
                                        <div className="mb-4">
                                            <Label>توضیحات</Label>
                                            <Input
                                                type="textarea"
                                                rows={3}
                                                name="description"
                                                value={formik.values.description}
                                                onChange={formik.handleChange}
                                            />
                                        </div>

                                        {/* Buttons */}
                                        <div className="d-flex gap-2">
                                            <Button type="submit" color="primary" disabled={saving}>
                                                {saving ? <Spinner size="sm" /> : "ویرایش اطلاعات"}
                                            </Button>

                                            <Button
                                                type="button"
                                                color="secondary"
                                                onClick={() => navigate("/customers/list")}
                                            >
                                                بازگشت
                                            </Button>
                                        </div>

                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default EditCustomer;
