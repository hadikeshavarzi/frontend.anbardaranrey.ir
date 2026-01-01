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
import { useNavigate, Link } from "react-router-dom";

// API helper
import { post } from "../../helpers/api_helper.jsx";

// تاریخ جلالی
import moment from "moment-jalaali";

// کامپوننت تاریخ
import DatePickerWithIcon from "../../components/Shared/DatePickerWithIcon";

// Validation schema
import { customerValidationSchema } from "../../utils/validationSchemas";

const AddCustomer = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const formik = useFormik({
    initialValues: {
      customerType: "real", // در فرم: 'real' | در دیتابیس: 'person'
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

    onSubmit: async (values, { resetForm }) => {
      setError("");
      setSuccess("");
      setLoading(true);

      try {
        // --- 1. فرمت تاریخ ---
        let finalDate = null;
        if (values.birthOrRegisterDate) {
          const dateVal = values.birthOrRegisterDate;
          // تبدیل هر نوع فرمت تاریخ به YYYY-MM-DD
          if (dateVal.toDate && typeof dateVal.toDate === 'function') {
            finalDate = moment(dateVal.toDate()).format("YYYY-MM-DD");
          } else {
            finalDate = moment(dateVal).format("YYYY-MM-DD");
          }
        }

        // --- 2. آماده‌سازی داده‌ها ---
        const dataToSend = {
          // تبدیل real به person (چون دیتابیس شما person دارد)
          customer_type: values.customerType === "real" ? "person" : "company",

          name: values.name,
          national_id: values.nationalId,
          mobile: values.mobile,
          phone: values.phone || null,
          economic_code: values.economicCode || null,
          postal_code: values.postalCode || null,
          address: values.address || null,
          description: values.description || null,
          birth_or_register_date: finalDate,
        };

        // --- 3. ارسال به سرور ---
        // ما دیگر اینجا GET نمیزنیم تا چک کنیم، خود سرور اگر تکراری باشد ارور میدهد
        const result = await post("/customers", dataToSend);

        if (result?.success) {
          setSuccess("مشتری با موفقیت ثبت شد!");

          setTimeout(() => {
            resetForm();
            setSuccess("");
            // اگر خواستید ریدایرکت کنید:
            // navigate("/customers/list");
          }, 1500);
        }

      } catch (err) {
        console.error("Add Customer Error:", err);

        // استخراج پیام خطای سرور
        const serverError =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "خطا در ثبت اطلاعات";

        // اگر ارور تکراری بودن باشد، سرور پیام فارسی مناسب می‌فرستد
        setError(serverError);
      } finally {
        setLoading(false);
      }
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
                    <Link to="/dashboard">داشبورد</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/customers/list">مشتریان</Link>
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
                            <i className="bx bx-user-plus"></i>
                          </div>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h5 className="card-title mb-1">فرم اطلاعات مشتری</h5>
                        <p className="text-muted mb-0">
                          مشخصات مشتری را وارد کنید. (موارد ستاره‌دار الزامی هستند)
                        </p>
                      </div>
                    </div>

                    {error && <Alert color="danger" toggle={() => setError("")}>{error}</Alert>}
                    {success && <Alert color="success" toggle={() => setSuccess("")}>{success}</Alert>}

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
                                onBlur={formik.handleBlur}
                            >
                              <option value="real">حقیقی (شخص)</option>
                              <option value="company">حقوقی (شرکت)</option>
                            </Input>
                          </div>
                        </Col>

                        <Col md={8}>
                          <div className="mb-3">
                            <Label>
                              {formik.values.customerType === "real" ? "نام و نام خانوادگی" : "نام شرکت"}
                              <span className="text-danger ms-1">*</span>
                            </Label>
                            <Input
                                name="name"
                                placeholder={formik.values.customerType === "real" ? "مثال: علی رضایی" : "مثال: شرکت فولاد..."}
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.name && !!formik.errors.name}
                            />
                            <FormFeedback>{formik.errors.name}</FormFeedback>
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={4}>
                          <div className="mb-3">
                            <Label>
                              تاریخ {formik.values.customerType === "real" ? "تولد" : "ثبت"}
                            </Label>
                            <DatePickerWithIcon
                                value={formik.values.birthOrRegisterDate}
                                onChange={(date) =>
                                    formik.setFieldValue("birthOrRegisterDate", date)
                                }
                                placeholder="انتخاب تاریخ..."
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
                                type="number"
                                value={formik.values.nationalId}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.nationalId && !!formik.errors.nationalId}
                            />
                            <FormFeedback>{formik.errors.nationalId}</FormFeedback>
                          </div>
                        </Col>

                        <Col md={4}>
                          <div className="mb-3">
                            <Label>شماره موبایل <span className="text-danger ms-1">*</span></Label>
                            <Input
                                name="mobile"
                                type="tel"  // 👈 اصلاح شد: قبلاً number بود که صفر را حذف می‌کرد
                                value={formik.values.mobile}
                                onChange={(e) => {
                                  // فقط اجازه ورود عدد داده شود
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  formik.setFieldValue("mobile", val);
                                }}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.mobile && !!formik.errors.mobile}
                                maxLength={11}
                                placeholder="09123456789"
                                dir="ltr" // چپ‌چین شدن برای نمایش بهتر شماره
                            />
                            <FormFeedback>{formik.errors.mobile}</FormFeedback>
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={4}>
                          <div className="mb-3">
                            <Label>تلفن ثابت</Label>
                            <Input
                                name="phone"
                                type="number"
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
                                type="number"
                                value={formik.values.postalCode}
                                onChange={formik.handleChange}
                                maxLength={10}
                            />
                          </div>
                        </Col>

                        <Col md={4}>
                          <div className="mb-3">
                            <Label>شماره اقتصادی</Label>
                            <Input
                                name="economicCode"
                                type="number"
                                value={formik.values.economicCode}
                                onChange={formik.handleChange}
                            />
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={12}>
                          <div className="mb-3">
                            <Label>آدرس</Label>
                            <Input
                                type="textarea"
                                rows="2"
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

                      {/* دکمه‌ها */}
                      <div className="d-flex gap-2 justify-content-end">
                        <Button
                            type="button"
                            color="secondary"
                            outline
                            onClick={() => navigate("/customers/list")}
                        >
                          بازگشت
                        </Button>

                        <Button
                            type="button"
                            color="warning"
                            outline
                            onClick={() => {
                              formik.resetForm();
                              setError("");
                              setSuccess("");
                            }}
                        >
                          پاک کردن فرم
                        </Button>

                        <Button type="submit" color="primary" disabled={loading}>
                          {loading ? (
                              <>
                                <Spinner size="sm" className="me-2" />
                                در حال ذخیره...
                              </>
                          ) : (
                              <>
                                <i className="bx bx-check-double me-1"></i>
                                ثبت نهایی
                              </>
                          )}
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