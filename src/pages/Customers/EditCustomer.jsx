import React, { useEffect, useState } from "react";
import {
    Container, Row, Col, Card, CardBody, Form, Input, Label, Button, Spinner, Alert, FormFeedback
} from "reactstrap";
import { useFormik } from "formik";
import { useParams, useNavigate } from "react-router-dom";
import { get, patch } from "../../helpers/api_helper.jsx";
import DatePickerWithIcon from "../../components/Receipt/DatePickerWithIcon";
import moment from "moment-jalaali";
import { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

// ✅ فقط این یک خط را اضافه کن
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
        // ✅ این قسمت را حذف کن و جایگزین کن
        validationSchema: customerValidationSchema,
        
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

                // 2. تبدیل تاریخ به میلادی استاندارد برای ارسال به سرور
                if (dataToSend.birthOrRegisterDate) {
                    const dateVal = dataToSend.birthOrRegisterDate;
                    
                    let gregorianDate = null;
                    
                    // اگر DateObject از react-multi-date-picker است
                    if (dateVal && typeof dateVal === 'object' && dateVal.toDate) {
                        const jsDate = dateVal.toDate();
                        gregorianDate = moment(jsDate).format('YYYY-MM-DD');
                    }
                    
                    dataToSend.birthOrRegisterDate = gregorianDate;
                } else {
                    dataToSend.birthOrRegisterDate = null;
                }

                // 3. حذف فیلدهای سیستمی
                delete dataToSend.id;
                delete dataToSend.createdAt;
                delete dataToSend.updatedAt;

                await patch(`/customers/${id}`, dataToSend);

                setSuccess("مشتری با موفقیت ویرایش شد");
                setTimeout(() => navigate("/customers"), 1500);

            } catch (err) {
                console.error("Update Error:", err);
                
                if (err.response?.status === 500) {
                    setError("خطای سرور (500): مشکل داخلی سرور.");
                } else if (err.response?.status === 400) {
                    const errorMsg = err.response.data?.errors?.[0]?.message || 
                                    err.response.data?.message || 
                                    "خطای اعتبارسنجی (400)";
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
                // تبدیل تاریخ میلادی به DateObject فارسی
                let dateObject = null;
                if (data.birthOrRegisterDate) {
                    const gregorianDate = new Date(data.birthOrRegisterDate);
                    dateObject = new DateObject({
                        date: gregorianDate,
                        calendar: persian,
                        locale: persian_fa
                    });
                }

                formik.setValues({
                    customerType: data.customerType || "real",
                    name: data.name || "",
                    nationalId: data.nationalId || "",
                    mobile: data.mobile || "",
                    phone: data.phone || "",
                    birthOrRegisterDate: dateObject,
                    postalCode: data.postalCode || "",
                    economicCode: data.economicCode || "",
                    address: data.address || "",
                    description: data.description || "",
                });
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
                                                    <Label>نوع مشتری <span className="text-danger">*</span></Label>
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
                                                    {formik.touched.customerType && formik.errors.customerType && (
                                                        <FormFeedback>{formik.errors.customerType}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={8}>
                                                <div className="mb-3">
                                                    <Label>نام / شرکت <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="name"
                                                        value={formik.values.name}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.name && !!formik.errors.name}
                                                    />
                                                    {formik.touched.name && formik.errors.name && (
                                                        <FormFeedback>{formik.errors.name}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>
                                        
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>تاریخ تولد / ثبت</Label>
                                                    <DatePickerWithIcon
                                                        value={formik.values.birthOrRegisterDate}
                                                        onChange={(dateObject) => {
                                                            formik.setFieldValue("birthOrRegisterDate", dateObject);
                                                        }}
                                                    />
                                                    <small className="text-muted">فرمت: 1402/01/01</small>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>
                                                        {formik.values.customerType === 'real' ? 'کد ملی' : 'شناسه ملی'}
                                                    </Label>
                                                    <Input
                                                        name="nationalId"
                                                        value={formik.values.nationalId}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.nationalId && !!formik.errors.nationalId}
                                                        maxLength={formik.values.customerType === 'real' ? 10 : 11}
                                                    />
                                                    {formik.touched.nationalId && formik.errors.nationalId && (
                                                        <FormFeedback>{formik.errors.nationalId}</FormFeedback>
                                                    )}
                                                    <small className="text-muted">
                                                        {formik.values.customerType === 'real' ? '10 رقم' : '11 رقم'}
                                                    </small>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>موبایل</Label>
                                                    <Input
                                                        name="mobile"
                                                        value={formik.values.mobile}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.mobile && !!formik.errors.mobile}
                                                        placeholder="09123456789"
                                                        maxLength={11}
                                                    />
                                                    {formik.touched.mobile && formik.errors.mobile && (
                                                        <FormFeedback>{formik.errors.mobile}</FormFeedback>
                                                    )}
                                                    <small className="text-muted">11 رقم، شروع با 09</small>
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
                                                        placeholder="02112345678"
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
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.postalCode && !!formik.errors.postalCode}
                                                        maxLength={10}
                                                    />
                                                    {formik.touched.postalCode && formik.errors.postalCode && (
                                                        <FormFeedback>{formik.errors.postalCode}</FormFeedback>
                                                    )}
                                                    <small className="text-muted">10 رقم</small>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>کد اقتصادی</Label>
                                                    <Input 
                                                        name="economicCode" 
                                                        value={formik.values.economicCode} 
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.economicCode && !!formik.errors.economicCode}
                                                    />
                                                    {formik.touched.economicCode && formik.errors.economicCode && (
                                                        <FormFeedback>{formik.errors.economicCode}</FormFeedback>
                                                    )}
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
                                                rows={3}
                                            />
                                        </div>
                                        
                                        <div className="mb-3">
                                            <Label>توضیحات</Label>
                                            <Input 
                                                type="textarea" 
                                                name="description" 
                                                value={formik.values.description} 
                                                onChange={formik.handleChange}
                                                rows={3}
                                            />
                                        </div>

                                        <div className="d-flex gap-2">
                                            <Button type="submit" color="primary" disabled={saving}>
                                                {saving ? <Spinner size="sm"/> : "ویرایش اطلاعات"}
                                            </Button>
                                            <Button 
                                                type="button" 
                                                color="secondary" 
                                                onClick={() => navigate("/customers")}
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