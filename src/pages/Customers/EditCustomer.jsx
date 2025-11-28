import React, { useEffect, useState } from "react";
import {
    Container, Row, Col, Card, CardBody, Form, Input, Label, Button, Spinner, Alert, FormFeedback
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useParams, useNavigate } from "react-router-dom";
import { get, patch } from "../../helpers/api_helper.jsx";
import DatePickerWithIcon from "../../components/Receipt/DatePickerWithIcon";
import moment from "moment-jalaali";

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
            birthOrRegisterDate: "", 
            postalCode: "",
            economicCode: "",
            address: "",
            description: "",
        },
        validationSchema: Yup.object({
            customerType: Yup.string().required(),
            name: Yup.string().required("نام مشتری الزامی است"),
            nationalId: Yup.string(),
            mobile: Yup.string(),
            birthOrRegisterDate: Yup.string().nullable(),
        }),
        onSubmit: async (values) => {
            setSaving(true);
            setError("");
            setSuccess("");

            try {
                const dataToSend = { ...values };

                // 1. تبدیل رشته‌های خالی به null
                Object.keys(dataToSend).forEach((key) => {
                    if (dataToSend[key] === "") {
                        dataToSend[key] = null;
                    }
                });

                // 2. تبدیل تاریخ شمسی به میلادی استاندارد برای ارسال به سرور
                if (dataToSend.birthOrRegisterDate) {
                    const dateVal = dataToSend.birthOrRegisterDate;
                    
                    console.log("Original dateVal:", dateVal, "Type:", typeof dateVal);
                    
                    let momentDate;
                    
                    // اگر moment object است
                    if (moment.isMoment(dateVal)) {
                        console.log("Is Moment object, isValid:", dateVal.isValid());
                        if (dateVal.isValid()) {
                            momentDate = dateVal;
                        } else {
                            momentDate = null;
                        }
                    }
                    // اگر string با فرمت شمسی است
                    else if (typeof dateVal === 'string' && dateVal.includes('/')) {
                        momentDate = moment(dateVal, 'jYYYY/jMM/jDD');
                        console.log("Parsed from string, isValid:", momentDate.isValid());
                    }
                    // اگر string با فرمت دیگری است
                    else if (typeof dateVal === 'string') {
                        momentDate = moment(dateVal);
                        console.log("Parsed as regular date, isValid:", momentDate.isValid());
                    }
                    // اگر هیچکدام نبود
                    else {
                        momentDate = null;
                    }
                    
                    if (momentDate && momentDate.isValid()) {
                        // ارسال فقط تاریخ بدون زمان (YYYY-MM-DD)
                        dataToSend.birthOrRegisterDate = momentDate.format('YYYY-MM-DD');
                        console.log("Converted to:", dataToSend.birthOrRegisterDate);
                    } else {
                        console.log("Date is invalid, setting to null");
                        dataToSend.birthOrRegisterDate = null;
                    }
                } else {
                    dataToSend.birthOrRegisterDate = null;
                }

                // 3. حذف فیلدهای سیستمی
                delete dataToSend.id;
                delete dataToSend.createdAt;
                delete dataToSend.updatedAt;

                console.log("Sending Clean & Converted Data:", dataToSend);
                console.log("birthOrRegisterDate final format:", dataToSend.birthOrRegisterDate);

                await patch(`/customers/${id}`, dataToSend);

                setSuccess("مشتری با موفقیت ویرایش شد");
                setTimeout(() => navigate("/customers/list"), 1500);

            } catch (err) {
                console.error("Update Error:", err);
                
                // نمایش کامل پاسخ سرور
                if (err.response?.data) {
                    console.log("Server Response Data:", err.response.data);
                    console.log("Server Validation Errors:", err.response.data.errors);
                }
                
                if (err.response?.status === 500) {
                    setError("خطای سرور (500): مشکل داخلی سرور.");
                } else if (err.response?.status === 400) {
                    // نمایش خطای دقیق سرور به کاربر
                    const errorMsg = err.response.data?.errors?.[0]?.message || 
                                    err.response.data?.message || 
                                    "خطای اعتبارسنجی (400)";
                    
                    console.log("Detailed 400 Error:", errorMsg);
                    setError(`خطای اعتبارسنجی: ${errorMsg}`);
                } else if (err.response?.status === 404) {
                    setError("مشتری پیدا نشد.");
                } else {
                    const msg = err.response?.data?.errors?.[0]?.message || "خطا در ویرایش اطلاعات.";
                    setError(msg);
                }
            }
            setSaving(false);
        },
    });

    const loadCustomer = async () => {
        try {
            const data = await get(`/customers/${id}`);
            if (data) {
                console.log("Raw data from server:", data);
                console.log("birthOrRegisterDate from server:", data.birthOrRegisterDate);
                
                let jalaliDate = "";
                if (data.birthOrRegisterDate) {
                    jalaliDate = moment(data.birthOrRegisterDate).format('jYYYY/jMM/jDD');
                    console.log("Converted jalali date:", jalaliDate);
                }

                formik.setValues({
                    customerType: data.customerType || "real",
                    name: data.name || "",
                    nationalId: data.nationalId || "",
                    mobile: data.mobile || "",
                    phone: data.phone || "",
                    birthOrRegisterDate: jalaliDate,
                    postalCode: data.postalCode || "",
                    economicCode: data.economicCode || "",
                    address: data.address || "",
                    description: data.description || "",
                });
                
                console.log("Final formik birthOrRegisterDate:", jalaliDate);
            }
        } catch (err) {
            console.error("Load Error:", err);
            setError("خطا در دریافت اطلاعات.");
        }
        setLoading(false);
    };

    useEffect(() => {
        if (id) loadCustomer();
        // eslint-disable-next-line
    }, [id]);

    if (loading) return <div className="p-5 text-center"><Spinner /></div>;

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
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>نوع مشتری</Label>
                                                    <Input
                                                        type="select"
                                                        name="customerType"
                                                        value={formik.values.customerType}
                                                        onChange={formik.handleChange}
                                                    >
                                                        <option value="real">حقیقی</option>
                                                        <option value="company">حقوقی</option>
                                                    </Input>
                                                </div>
                                            </Col>
                                            <Col md={8}>
                                                <div className="mb-3">
                                                    <Label>نام / شرکت <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="name"
                                                        value={formik.values.name}
                                                        onChange={formik.handleChange}
                                                        invalid={!!formik.errors.name}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                        
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>تاریخ تولد / ثبت</Label>
                                                    <DatePickerWithIcon
                                                        value={formik.values.birthOrRegisterDate}
                                                        onChange={(v) => {
                                                            console.log("DatePicker onChange - Raw value:", v);
                                                            console.log("DatePicker onChange - Type:", typeof v);
                                                            console.log("DatePicker onChange - Is Moment?:", moment.isMoment(v));
                                                            if (moment.isMoment(v)) {
                                                                console.log("DatePicker onChange - isValid?:", v.isValid());
                                                                console.log("DatePicker onChange - Formatted:", v.format('jYYYY/jMM/jDD'));
                                                            }
                                                            formik.setFieldValue("birthOrRegisterDate", v);
                                                        }}
                                                    />
                                                    <small className="text-muted">فرمت: 1402/01/01</small>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>کد ملی / شناسه</Label>
                                                    <Input
                                                        name="nationalId"
                                                        value={formik.values.nationalId}
                                                        onChange={formik.handleChange}
                                                    />
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
                                        </Row>
                                        
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
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>کد اقتصادی</Label>
                                                    <Input 
                                                        name="economicCode" 
                                                        value={formik.values.economicCode} 
                                                        onChange={formik.handleChange} 
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                        
                                        <div className="mb-3">
                                            <Label>آدرس</Label>
                                            <Input 
                                                type="textarea" 
                                                name="address" 
                                                value={formik.values.address} 
                                                onChange={formik.handleChange} 
                                            />
                                        </div>
                                        
                                        <div className="mb-3">
                                            <Label>توضیحات</Label>
                                            <Input 
                                                type="textarea" 
                                                name="description" 
                                                value={formik.values.description} 
                                                onChange={formik.handleChange} 
                                            />
                                        </div>

                                        <div className="d-flex gap-2">
                                            <Button type="submit" color="primary" disabled={saving}>
                                                {saving ? <Spinner size="sm"/> : "ویرایش اطلاعات"}
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