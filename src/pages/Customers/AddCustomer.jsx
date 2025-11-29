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
import { useNavigate } from "react-router-dom";
import { get, post } from "../../helpers/api_helper.jsx";
import DatePickerWithIcon from "../../components/Receipt/DatePickerWithIcon";
import moment from "moment-jalaali";
import { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

// ✅ Import validation schema
import { customerValidationSchema } from "../../utils/validationSchemas";

const AddCustomer = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
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

        // ✅ استفاده از schema مشترک
        validationSchema: customerValidationSchema,

        onSubmit: async (values) => {
            setError("");
            setSuccess("");
            setLoading(true);

            try {
                // چک تکراری بودن مشتری
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

                const dataToSend = { ...values };

                // تبدیل رشته‌های خالی به null
                Object.keys(dataToSend).forEach((key) => {
                    if (dataToSend[key] === "") {
                        dataToSend[key] = null;
                    }
                });

                // تبدیل تاریخ به میلادی
                if (dataToSend.birthOrRegisterDate) {
                    const dateVal = dataToSend.birthOrRegisterDate;
                    
                    let gregorianDate = null;
                    
                    if (dateVal && typeof dateVal === 'object' && dateVal.toDate) {
                        const jsDate = dateVal.toDate();
                        gregorianDate = moment(jsDate).format('YYYY-MM-DD');
                    }
                    
                    dataToSend.birthOrRegisterDate = gregorianDate;
                } else {
                    dataToSend.birthOrRegisterDate = null;
                }

                const result = await post("/customers", dataToSend);

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
                                                        onBlur={formik.handleBlur}
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

                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>تاریخ تولد / ثبت</Label>
                                                    <DatePickerWithIcon
                                                        value={formik.values.birthOrRegisterDate}
                                                        onChange={(dateObject) =>
                                                            formik.setFieldValue("birthOrRegisterDate", dateObject)
                                                        }
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
                                                        invalid={
                                                            formik.touched.nationalId &&
                                                            !!formik.errors.nationalId
                                                        }
                                                        maxLength={formik.values.customerType === 'real' ? 10 : 11}
                                                    />
                                                    <FormFeedback>{formik.errors.nationalId}</FormFeedback>
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
                                                    <FormFeedback>{formik.errors.mobile}</FormFeedback>
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
                                                    <FormFeedback>{formik.errors.postalCode}</FormFeedback>
                                                    <small className="text-muted">10 رقم</small>
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>شماره اقتصادی</Label>
                                                    <Input
                                                        name="economicCode"
                                                        value={formik.values.economicCode}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.economicCode && !!formik.errors.economicCode}
                                                    />
                                                    <FormFeedback>{formik.errors.economicCode}</FormFeedback>
                                                </div>
                                            </Col>
                                        </Row>

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