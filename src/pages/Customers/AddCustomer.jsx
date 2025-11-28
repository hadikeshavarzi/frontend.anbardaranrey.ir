import React, { useState } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    Button,
    Form,
    Input,
    Label,
    FormFeedback,
    Spinner,
    Alert,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { get, post } from "../../helpers/api_helper.jsx";

import DatePickerWithIcon from "../../components/Receipt/DatePickerWithIcon";

const AddCustomer = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // -------------------------------------------------------
    //   Formik & Yup
    // -------------------------------------------------------
    const formik = useFormik({
        initialValues: {
            type: "person",
            name: "",
            nationalId: "",
            mobile: "",
            phone: "",
            birthDate: "",
            postalCode: "",
            economicCode: "",
            address: "",
            description: "",
        },

        validationSchema: Yup.object({
            type: Yup.string().required(),
            name: Yup.string()
                .required("نام مشتری الزامی است")
                .min(2, "حداقل ۲ کاراکتر")
                .max(100, "حداکثر ۱۰۰ کاراکتر"),
            nationalId: Yup.string().max(20, "حداکثر ۲۰ رقم"),
            mobile: Yup.string().max(20, "حداکثر ۲۰ رقم"),
            phone: Yup.string().max(20, "حداکثر ۲۰ رقم"),
            postalCode: Yup.string().max(20, "حداکثر ۲۰ رقم"),
            economicCode: Yup.string().max(50),
            address: Yup.string().max(500),
            description: Yup.string().max(500),
        }),

        onSubmit: async (values) => {
            setError("");
            setSuccess("");
            setLoading(true);

            try {
                // -------------------------------------------------------
                //  چک تکراری بودن مشتری
                // -------------------------------------------------------
                const all = await get("/customers");

                const exists = (all.docs || []).some((c) => {
                    return (
                        (c.name || "").trim() === values.name.trim() ||
                        (c.nationalId || "").trim() === values.nationalId.trim()
                    );
                });

                if (exists) {
                    setError("مشتری دیگری با همین نام یا کد ملی وجود دارد.");
                    setLoading(false);
                    return;
                }

                // -------------------------------------------------------
                //   ارسال به Payload
                // -------------------------------------------------------
                const payloadBody = {
                    type: values.type,
                    name: values.name,
                    nationalId: values.nationalId,
                    mobile: values.mobile,
                    phone: values.phone,
                    birthDate: values.birthDate,
                    postalCode: values.postalCode,
                    economicCode: values.economicCode,
                    address: values.address,
                    description: values.description,
                };

                const result = await post("/customers", payloadBody);

                if (result?.id || result?.doc?.id) {
                    setSuccess("مشتری با موفقیت ثبت شد!");

                    setTimeout(() => {
                        formik.resetForm();
                        setSuccess("");
                    }, 1500);
                } else {
                    setError("خطا در ثبت مشتری");
                }
            } catch (err) {
                setError(err.response?.data?.message || "خطا در ثبت مشتری");
            }

            setLoading(false);
        },
    });

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>

                    {/* Breadcrumb */}
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 font-size-18">افزودن مشتری جدید</h4>

                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    <a href="/dashboard">داشبورد</a>
                                </li>
                                <li className="breadcrumb-item">
                                    <a href="/customers/list">مشتریان</a>
                                </li>
                                <li className="breadcrumb-item active">افزودن مشتری</li>
                            </ol>
                        </div>
                    </div>

                    <Row>
                        <Col lg={10} className="mx-auto">
                            <Card>
                                <CardBody>
                                    <div className="d-flex align-items-center mb-4">
                                        <div className="flex-shrink-0 me-3">
                                            <div className="avatar-sm">
                                                <div className="avatar-title rounded-circle bg-soft-primary text-primary font-size-20">
                                                    <i className="ri-user-add-line"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h5 className="card-title mb-1">فرم اطلاعات مشتری</h5>
                                            <p className="text-muted mb-0">
                                                لطفاً مشخصات مشتری جدید را وارد کنید
                                            </p>
                                        </div>
                                    </div>

                                    {/* Alerts */}
                                    {error && (
                                        <Alert color="danger" toggle={() => setError("")}>
                                            {error}
                                        </Alert>
                                    )}

                                    {success && (
                                        <Alert color="success" toggle={() => setSuccess("")}>
                                            {success}
                                        </Alert>
                                    )}

                                    {/* Form Start */}
                                    <Form onSubmit={formik.handleSubmit}>

                                        <Row>
                                            {/* Type */}
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>نوع مشتری</Label>
                                                    <Input
                                                        type="select"
                                                        name="type"
                                                        value={formik.values.type}
                                                        onChange={formik.handleChange}
                                                    >
                                                        <option value="person">حقیقی</option>
                                                        <option value="company">حقوقی</option>
                                                    </Input>
                                                </div>
                                            </Col>

                                            {/* Name */}
                                            <Col md={8}>
                                                <div className="mb-3">
                                                    <Label>
                                                        نام / شرکت <span className="text-danger">*</span>
                                                    </Label>
                                                    <Input
                                                        name="name"
                                                        value={formik.values.name}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.name &&
                                                            !!formik.errors.name
                                                        }
                                                    />
                                                    <FormFeedback>{formik.errors.name}</FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Identity Row */}
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>کد ملی / شناسه ملی</Label>
                                                    <Input
                                                        name="nationalId"
                                                        value={formik.values.nationalId}
                                                        onChange={formik.handleChange}
                                                        invalid={
                                                            formik.touched.nationalId &&
                                                            !!formik.errors.nationalId
                                                        }
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
                                                    />
                                                </div>
                                            </Col>

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
                                        </Row>

                                        {/* Date + Postal + Economic */}
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>تاریخ تولد / ثبت</Label>
                                                    <DatePickerWithIcon
                                                        value={formik.values.birthDate}
                                                        onChange={(v) =>
                                                            formik.setFieldValue("birthDate", v)
                                                        }
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
                                                    />
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>شماره اقتصادی</Label>
                                                    <Input
                                                        name="economicCode"
                                                        value={formik.values.economicCode}
                                                        onChange={formik.handleChange}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Address */}
                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Label>آدرس</Label>
                                                    <Input
                                                        type="textarea"
                                                        rows="3"
                                                        name="address"
                                                        value={formik.values.address}
                                                        onChange={formik.handleChange}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Description */}
                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-4">
                                                    <Label>توضیحات</Label>
                                                    <Input
                                                        type="textarea"
                                                        rows="2"
                                                        name="description"
                                                        value={formik.values.description}
                                                        onChange={formik.handleChange}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Action Buttons */}
                                        <div className="d-flex gap-2">

                                            <Button type="submit" color="primary" disabled={loading}>
                                                {loading ? (
                                                    <>
                                                        <Spinner size="sm" className="me-2" />
                                                        در حال ذخیره...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bx bx-check-double me-1"></i>
                                                        ثبت مشتری
                                                    </>
                                                )}
                                            </Button>

                                            <Button
                                                type="button"
                                                color="success"
                                                onClick={() => {
                                                    formik.resetForm();
                                                    setError("");
                                                    setSuccess("");
                                                }}
                                            >
                                                <i className="bx bx-refresh me-1"></i>
                                                پاک کردن فرم
                                            </Button>

                                            <Button
                                                type="button"
                                                color="secondary"
                                                onClick={() => navigate("/customers/list")}
                                            >
                                                <i className="bx bx-arrow-back me-1"></i>
                                                بازگشت به لیست
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

export default AddCustomer;
