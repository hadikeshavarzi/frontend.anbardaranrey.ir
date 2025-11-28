import React, { useEffect, useState } from "react";
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
import { useNavigate, useParams, Link } from "react-router-dom";
import { get, patch } from "../../helpers/api_helper.jsx";

/**
 * تبدیل تاریخ ISO به فرمت input[type="date"] (YYYY-MM-DD)
 */
const toInputDate = (value) => {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
};

/**
 * نمایش تاریخ شمسی
 */
const toPersianDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("fa-IR");
  } catch {
    return "-";
  }
};

const EditMember = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [initialValues, setInitialValues] = useState({
    role: "union_member",
    member_code: "",
    full_name: "",
    father_name: "",
    national_id: "",
    mobile: "",
    phone: "",
    address: "",
    birth_date: "",
    business_name: "",
    category: "warehouse",
    member_status: "active",
    license_number: "",
    license_issue_date: "",
    license_expire_date: "",
    company_name: "",
    registration_number: "",
  });

  // 🟦 لود اطلاعات عضو
  useEffect(() => {
    async function loadMember() {
      setLoadingData(true);
      setError("");

      try {
        const res = await get(`/members/${id}`);

        setInitialValues({
          role: res.role || "union_member",
          member_code: res.member_code || "",
          full_name: res.full_name || "",
          father_name: res.father_name || "",
          national_id: res.national_id || "",
          mobile: res.mobile || "",
          phone: res.phone || "",
          address: res.address || "",
          birth_date: toInputDate(res.birth_date),
          business_name: res.business_name || "",
          category: res.category || "warehouse",
          member_status: res.member_status || "active",
          license_number: res.license_number || "",
          license_issue_date: toInputDate(res.license_issue_date),
          license_expire_date: toInputDate(res.license_expire_date),
          company_name: res.company_name || "",
          registration_number: res.registration_number || "",
        });
      } catch (err) {
        setError("خطا در دریافت اطلاعات عضو");
      }

      setLoadingData(false);
    }

    if (id) {
      loadMember();
    } else {
      setError("شناسه عضو نامعتبر است");
      setLoadingData(false);
    }
  }, [id]);

  // 🧾 ولیدیشن
  const validationSchema = Yup.object({
    full_name: Yup.string()
      .required("نام و نام خانوادگی الزامی است")
      .min(2, "حداقل ۲ کاراکتر"),
    member_code: Yup.string().required("کد عضویت الزامی است"),
    mobile: Yup.string()
      .required("موبایل الزامی است")
      .matches(/^09\d{9}$/, "شماره موبایل نادرست است"),
    national_id: Yup.string()
      .nullable()
      .matches(/^\d{10}$/, "کد ملی باید ۱۰ رقم باشد")
      .notRequired(),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      setError("");
      setSuccess("");
      setSaving(true);


      try {
        const payload = {
          role: values.role,
          member_code: values.member_code,
          full_name: values.full_name,
          father_name: values.father_name || "",
          national_id: values.national_id || "",
          mobile: values.mobile,
          phone: values.phone || "",
          address: values.address || "",
          birth_date: values.birth_date || null,
          business_name: values.business_name || "",
          category: values.category || "warehouse",
          member_status: values.member_status || "active",
          license_number: values.license_number || "",
          license_issue_date: values.license_issue_date || null,
          license_expire_date: values.license_expire_date || null,
          company_name: values.company_name || "",
          registration_number: values.registration_number || "",
        };

        const res = await patch(`/members/${id}`, payload);


        setSuccess("اطلاعات عضو با موفقیت ذخیره شد");

        setTimeout(() => {
          setSuccess("");
          // برگشت به لیست
          navigate("/members/list");
        }, 1500);
      } catch (err) {
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "خطا در ذخیره اطلاعات عضو";
        setError(msg);
      }

      setSaving(false);
    },
  });

  if (loadingData) {
    return (
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={10} className="mx-auto">
              <Card>
                <CardBody className="text-center py-5">
                  <Spinner color="primary" />
                  <div className="mt-3">
                    <h5 className="text-muted">در حال بارگذاری اطلاعات عضو...</h5>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* Breadcrumb */}
          <div className="page-title-box d-sm-flex align-items-center justify-content-between">
            <h4 className="mb-sm-0 font-size-18">ویرایش عضو</h4>

            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item">
                  <Link to="/dashboard">داشبورد</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="/members">اعضا</Link>
                </li>
                <li className="breadcrumb-item active">ویرایش عضو</li>
              </ol>
            </div>
          </div>

          <Row>
            <Col lg={10} className="mx-auto">
              <Card>
                <CardBody>
                  <div className="mb-4">
                    <h4 className="card-title">اطلاعات عضو</h4>
                    <p className="card-title-desc">
                      لطفاً اطلاعات عضو را بررسی و در صورت نیاز اصلاح کنید.
                    </p>
                  </div>

                  {/* Alerts */}
                  {error && (
                    <Alert color="danger" className="alert-dismissible fade show">
                      <i className="mdi mdi-block-helper me-2" />
                      {error}
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setError("")}
                      ></button>
                    </Alert>
                  )}

                  {success && (
                    <Alert color="success" className="alert-dismissible fade show">
                      <i className="mdi mdi-check-all me-2" />
                      {success}
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setSuccess("")}
                      ></button>
                    </Alert>
                  )}

                  <Form
                    onSubmit={(e) => {
                      e.preventDefault();
                      formik.handleSubmit();
                    }}
                  >
                    {/* نقش و وضعیت */}
                    <div className="mb-4">
                      <h5 className="font-size-14 mb-3">
                        <i className="bx bx-user-circle me-1" />
                        نقش و وضعیت
                      </h5>

                      <Row>
                        <Col md={4}>
                          <div className="mb-3">
                            <Label htmlFor="role" className="form-label">
                              نقش
                            </Label>
                            <Input
                              id="role"
                              name="role"
                              type="select"
                              value={formik.values.role}
                              onChange={formik.handleChange}
                              disabled={saving}
                            >
                              <option value="admin">👑 ادمین</option>
                              <option value="union_member">🏛️ عضو اتحادیه</option>
                              <option value="union_user">👤 کاربر اتحادیه</option>
                            </Input>
                          </div>
                        </Col>

                        <Col md={4}>
                          <div className="mb-3">
                            <Label htmlFor="member_status" className="form-label">
                              وضعیت
                            </Label>
                            <Input
                              id="member_status"
                              name="member_status"
                              type="select"
                              value={formik.values.member_status}
                              onChange={formik.handleChange}
                              disabled={saving}
                            >
                              <option value="active">فعال</option>
                              <option value="inactive">غیرفعال</option>
                              <option value="pending">در حال بررسی</option>
                              <option value="suspended">تعلیق شده</option>
                            </Input>
                          </div>
                        </Col>

                        <Col md={4}>
                          <div className="mb-3">
                            <Label htmlFor="category" className="form-label">
                              دسته‌بندی
                            </Label>
                            <Input
                              id="category"
                              name="category"
                              type="select"
                              value={formik.values.category}
                              onChange={formik.handleChange}
                              disabled={saving}
                            >
                              <option value="warehouse">انبار</option>
                              <option value="transport">باربری</option>
                              <option value="other">سایر</option>
                            </Input>
                          </div>
                        </Col>
                      </Row>
                    </div>

                    {/* اطلاعات هویتی */}
                    <div className="mb-4">
                      <h5 className="font-size-14 mb-3">
                        <i className="bx bx-id-card me-1" />
                        اطلاعات هویتی
                      </h5>

                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label htmlFor="full_name" className="form-label">
                              نام و نام خانوادگی <span className="text-danger">*</span>
                            </Label>
                            <Input
                              id="full_name"
                              name="full_name"
                              type="text"
                              value={formik.values.full_name}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              invalid={
                                formik.touched.full_name &&
                                !!formik.errors.full_name
                              }
                              disabled={saving}
                            />
                            <FormFeedback>{formik.errors.full_name}</FormFeedback>
                          </div>
                        </Col>

                        <Col md={3}>
                          <div className="mb-3">
                            <Label htmlFor="father_name" className="form-label">
                              نام پدر
                            </Label>
                            <Input
                              id="father_name"
                              name="father_name"
                              type="text"
                              value={formik.values.father_name}
                              onChange={formik.handleChange}
                              disabled={saving}
                            />
                          </div>
                        </Col>

                        <Col md={3}>
                          <div className="mb-3">
                            <Label htmlFor="national_id" className="form-label">
                              کد ملی
                            </Label>
                            <Input
                              id="national_id"
                              name="national_id"
                              type="text"
                              value={formik.values.national_id}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              invalid={
                                formik.touched.national_id &&
                                !!formik.errors.national_id
                              }
                              disabled={saving}
                            />
                            <FormFeedback>{formik.errors.national_id}</FormFeedback>
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={4}>
                          <div className="mb-3">
                            <Label htmlFor="member_code" className="form-label">
                              کد عضویت <span className="text-danger">*</span>
                            </Label>
                            <Input
                              id="member_code"
                              name="member_code"
                              type="text"
                              value={formik.values.member_code}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              invalid={
                                formik.touched.member_code &&
                                !!formik.errors.member_code
                              }
                              disabled={saving}
                            />
                            <FormFeedback>{formik.errors.member_code}</FormFeedback>
                          </div>
                        </Col>

                        <Col md={4}>
                          <div className="mb-3">
                            <Label htmlFor="mobile" className="form-label">
                              موبایل <span className="text-danger">*</span>
                            </Label>
                            <Input
                              id="mobile"
                              name="mobile"
                              type="text"
                              value={formik.values.mobile}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              invalid={
                                formik.touched.mobile && !!formik.errors.mobile
                              }
                              disabled={saving}
                            />
                            <FormFeedback>{formik.errors.mobile}</FormFeedback>
                          </div>
                        </Col>

                        <Col md={4}>
                          <div className="mb-3">
                            <Label htmlFor="phone" className="form-label">
                              تلفن ثابت
                            </Label>
                            <Input
                              id="phone"
                              name="phone"
                              type="text"
                              value={formik.values.phone}
                              onChange={formik.handleChange}
                              disabled={saving}
                            />
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={8}>
                          <div className="mb-3">
                            <Label htmlFor="address" className="form-label">
                              آدرس
                            </Label>
                            <Input
                              id="address"
                              name="address"
                              type="textarea"
                              rows="3"
                              value={formik.values.address}
                              onChange={formik.handleChange}
                              disabled={saving}
                            />
                          </div>
                        </Col>

                        <Col md={4}>
                          <div className="mb-3">
                            <Label htmlFor="birth_date" className="form-label">
                              تاریخ تولد
                            </Label>
                            <Input
                              id="birth_date"
                              name="birth_date"
                              type="date"
                              value={formik.values.birth_date}
                              onChange={formik.handleChange}
                              disabled={saving}
                            />
                            {formik.values.birth_date && (
                              <small className="text-muted d-block mt-1">
                                شمسی:{" "}
                                {toPersianDate(formik.values.birth_date)}
                              </small>
                            )}
                          </div>
                        </Col>
                      </Row>
                    </div>

                    {/* اطلاعات کسب و کار */}
                    <div className="mb-4">
                      <h5 className="font-size-14 mb-3">
                        <i className="bx bx-briefcase-alt-2 me-1" />
                        اطلاعات کسب و کار
                      </h5>

                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label htmlFor="business_name" className="form-label">
                              نام کسب و کار
                            </Label>
                            <Input
                              id="business_name"
                              name="business_name"
                              type="text"
                              value={formik.values.business_name}
                              onChange={formik.handleChange}
                              disabled={saving}
                            />
                          </div>
                        </Col>

                        <Col md={6}>
                          <div className="mb-3">
                            <Label htmlFor="company_name" className="form-label">
                              نام شرکت
                            </Label>
                            <Input
                              id="company_name"
                              name="company_name"
                              type="text"
                              value={formik.values.company_name}
                              onChange={formik.handleChange}
                              disabled={saving}
                            />
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label
                              htmlFor="registration_number"
                              className="form-label"
                            >
                              شماره ثبت
                            </Label>
                            <Input
                              id="registration_number"
                              name="registration_number"
                              type="text"
                              value={formik.values.registration_number}
                              onChange={formik.handleChange}
                              disabled={saving}
                            />
                          </div>
                        </Col>
                      </Row>
                    </div>

                    {/* اطلاعات پروانه */}
                    <div className="mb-4">
                      <h5 className="font-size-14 mb-3">
                        <i className="bx bx-file me-1" />
                        اطلاعات پروانه
                      </h5>

                      <Row>
                        <Col md={4}>
                          <div className="mb-3">
                            <Label
                              htmlFor="license_number"
                              className="form-label"
                            >
                              شماره پروانه
                            </Label>
                            <Input
                              id="license_number"
                              name="license_number"
                              type="text"
                              value={formik.values.license_number}
                              onChange={formik.handleChange}
                              disabled={saving}
                            />
                          </div>
                        </Col>

                        <Col md={4}>
                          <div className="mb-3">
                            <Label
                              htmlFor="license_issue_date"
                              className="form-label"
                            >
                              تاریخ صدور پروانه
                            </Label>
                            <Input
                              id="license_issue_date"
                              name="license_issue_date"
                              type="date"
                              value={formik.values.license_issue_date}
                              onChange={formik.handleChange}
                              disabled={saving}
                            />
                            {formik.values.license_issue_date && (
                              <small className="text-muted d-block mt-1">
                                شمسی:{" "}
                                {toPersianDate(
                                  formik.values.license_issue_date
                                )}
                              </small>
                            )}
                          </div>
                        </Col>

                        <Col md={4}>
                          <div className="mb-3">
                            <Label
                              htmlFor="license_expire_date"
                              className="form-label"
                            >
                              تاریخ انقضای پروانه
                            </Label>
                            <Input
                              id="license_expire_date"
                              name="license_expire_date"
                              type="date"
                              value={formik.values.license_expire_date}
                              onChange={formik.handleChange}
                              disabled={saving}
                            />
                            {formik.values.license_expire_date && (
                              <small className="text-muted d-block mt-1">
                                شمسی:{" "}
                                {toPersianDate(
                                  formik.values.license_expire_date
                                )}
                              </small>
                            )}
                          </div>
                        </Col>
                      </Row>
                    </div>

                    {/* دکمه‌ها */}
                    <div className="d-flex flex-wrap gap-2">
                      <Button type="submit" color="primary" disabled={saving}>
                        {saving ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            در حال ذخیره...
                          </>
                        ) : (
                          <>
                            <i className="bx bx-check-double me-1" />
                            ذخیره تغییرات
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        color="light"
                        disabled={saving}
                        onClick={() => navigate("/members")}
                      >
                        <i className="bx bx-arrow-back me-1" />
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

export default EditMember;