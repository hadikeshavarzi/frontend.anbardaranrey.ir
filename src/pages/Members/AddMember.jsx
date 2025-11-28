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
import { useNavigate, Link } from "react-router-dom";
import { get, post } from "../../helpers/api_helper.jsx";

const AddMember = () => {
    const navigate = useNavigate();

    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [uploadingField, setUploadingField] = useState(null);

    // 🔹 کمک برای آپلود فایل به کالکشن media و ذخیره id در فیلد member
    const handleFileUpload = async (file, fieldName, formik) => {
        if (!file) return;
        try {
            setUploadingField(fieldName);
            const formData = new FormData();
            formData.append("file", file);

            // /media روی Payload → در واقع /api/media از طریق axiosApi
            const res = await post("/media", formData);

            const mediaId = res?.id || res?.doc?.id;
            if (mediaId) {
                formik.setFieldValue(fieldName, mediaId);
            } else {
                setError("آپلود فایل با مشکل مواجه شد");
            }
        } catch (err) {
            setError("خطا در آپلود فایل");
        } finally {
            setUploadingField(null);
        }
    };

    const formik = useFormik({
        initialValues: {
            // 👤 اطلاعات هویتی و سیستمی
            full_name: "",
            member_code: "",
            role: "union_user",
            member_status: "active",
            category: "warehouse",

            // 📞 تماس و شناسایی
            mobile: "",
            phone: "",
            email: "",
            father_name: "",
            national_id: "",

            // 📍 آدرس و کسب‌وکار
            address: "",
            business_name: "",
            company_name: "",
            registration_number: "",

            // 📅 تاریخ‌ها (ISO, نمایش بعداً فارسی)
            birth_date: "",
            license_number: "",
            license_issue_date: "",
            license_expire_date: "",

            // 🖼️ تصاویر (ID مدیا بعد از آپلود)
            member_image: "",
            national_card_image: "",
            id_card_image: "",
            license_image: "",
            company_license_image: "",
        },

        validationSchema: Yup.object({
            full_name: Yup.string()
                .required("نام و نام خانوادگی الزامی است")
                .min(2, "نام خیلی کوتاه است"),
            member_code: Yup.string().required("کد عضویت الزامی است"),
            mobile: Yup.string()
                .required("شماره موبایل الزامی است")
                .matches(/^09[0-9]{9}$/, "شماره موبایل معتبر نیست"),
            national_id: Yup.string()
                .nullable()
                .transform((value) => (value === "" ? null : value))
                .matches(/^[0-9]{10}$/, "کد ملی باید ۱۰ رقم باشد")
                .optional(),
            role: Yup.string().required("نقش را انتخاب کنید"),
            member_status: Yup.string().required("وضعیت عضو را انتخاب کنید"),
            category: Yup.string().required("دسته‌بندی را انتخاب کنید"),
        }),

        onSubmit: async (values) => {
            setError("");
            setSuccess("");
            setLoadingSubmit(true);


            try {
                // 1️⃣ چک تکراری بودن کد عضویت / موبایل / کد ملی
                const allMembers = await get("/members?limit=1000");
                const docs = allMembers?.docs || [];

                const memberCodeExists = docs.some(
                    (m) =>
                        (m.member_code || "").trim().toLowerCase() ===
                        values.member_code.trim().toLowerCase()
                );

                if (memberCodeExists) {
                    setError("عضوی با این کد عضویت از قبل وجود دارد.");
                    setLoadingSubmit(false);
                    return;
                }

                const mobileExists = docs.some(
                    (m) =>
                        (m.mobile || "").trim() === values.mobile.trim()
                );

                if (mobileExists) {
                    setError("عضوی با این شماره موبایل از قبل ثبت شده است.");
                    setLoadingSubmit(false);
                    return;
                }

                if (values.national_id) {
                    const nidExists = docs.some(
                        (m) => (m.national_id || "").trim() === values.national_id.trim()
                    );
                    if (nidExists) {
                        setError("عضوی با این کد ملی از قبل ثبت شده است.");
                        setLoadingSubmit(false);
                        return;
                    }
                }

                // 2️⃣ آماده‌سازی دیتا برای ارسال به Payload
                const payload = {
                    full_name: values.full_name,
                    member_code: values.member_code,
                    role: values.role,
                    member_status: values.member_status,
                    category: values.category,

                    mobile: values.mobile,
                    phone: values.phone || "",
                    email: values.email || null,
                    father_name: values.father_name || "",
                    national_id: values.national_id || "",

                    address: values.address || "",
                    business_name: values.business_name || "",
                    company_name: values.company_name || "",
                    registration_number: values.registration_number || "",

                    birth_date: values.birth_date || null,
                    license_number: values.license_number || "",
                    license_issue_date: values.license_issue_date || null,
                    license_expire_date: values.license_expire_date || null,

                    member_image: values.member_image || null,
                    national_card_image: values.national_card_image || null,
                    id_card_image: values.id_card_image || null,
                    license_image: values.license_image || null,
                    company_license_image: values.company_license_image || null,
                };

                const result = await post("/members", payload);

                if (result?.id || result?.doc?.id) {
                    setSuccess("عضو با موفقیت ثبت شد.");

                    // بعد از چند ثانیه می‌تونی برگردی به لیست یا فرم را خالی کنی
                    setTimeout(() => {
                        formik.resetForm();
                        setSuccess("");
                        // اگر خواستی مستقیم بره صفحه لیست:
                        // navigate("/members/list");
                    }, 2000);
                } else {
                    setError("خطا در ثبت عضو");
                }
            } catch (err) {
                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    "خطا در ثبت عضو"
                );
            }

            setLoadingSubmit(false);
        },
    });

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {/* Breadcrumb */}
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 font-size-18">افزودن عضو جدید</h4>

                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item">
                                    <Link to="/dashboard">داشبورد</Link>
                                </li>
                                <li className="breadcrumb-item">
                                    <Link to="/members/list">اعضا</Link>
                                </li>
                                <li className="breadcrumb-item active">افزودن عضو</li>
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
                                            لطفاً اطلاعات عضو جدید را وارد نمایید.
                                        </p>
                                    </div>

                                    {/* Alerts */}
                                    {error && (
                                        <Alert
                                            color="danger"
                                            className="alert-dismissible fade show"
                                        >
                                            <i className="mdi mdi-block-helper me-2"></i>
                                            {error}
                                            <button
                                                type="button"
                                                className="btn-close"
                                                onClick={() => setError("")}
                                            ></button>
                                        </Alert>
                                    )}

                                    {success && (
                                        <Alert
                                            color="success"
                                            className="alert-dismissible fade show"
                                        >
                                            <i className="mdi mdi-check-all me-2"></i>
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
                                        {/* 👤 اطلاعات هویتی و سیستمی */}
                                        <div className="mb-4">
                                            <h5 className="font-size-14 mb-3">
                                                <i className="bx bx-user me-1"></i>
                                                اطلاعات هویتی و سیستمی
                                            </h5>

                                            <Row>
                                                {/* full_name */}
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="full_name" className="form-label">
                                                            نام و نام خانوادگی{" "}
                                                            <span className="text-danger">*</span>
                                                        </Label>
                                                        <Input
                                                            id="full_name"
                                                            name="full_name"
                                                            type="text"
                                                            placeholder="مثال: سیدهادی کشاورزی"
                                                            value={formik.values.full_name}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={
                                                                formik.touched.full_name &&
                                                                !!formik.errors.full_name
                                                            }
                                                            disabled={loadingSubmit}
                                                        />
                                                        <FormFeedback>{formik.errors.full_name}</FormFeedback>
                                                    </div>
                                                </Col>

                                                {/* member_code */}
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="member_code" className="form-label">
                                                            کد عضویت{" "}
                                                            <span className="text-danger">*</span>
                                                        </Label>
                                                        <Input
                                                            id="member_code"
                                                            name="member_code"
                                                            type="text"
                                                            placeholder="مثال: 001 یا 1403-001"
                                                            value={formik.values.member_code}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={
                                                                formik.touched.member_code &&
                                                                !!formik.errors.member_code
                                                            }
                                                            disabled={loadingSubmit}
                                                        />
                                                        <FormFeedback>
                                                            {formik.errors.member_code}
                                                        </FormFeedback>
                                                        <small className="text-muted">
                                                            این مقدار به صورت دستی توسط شما تعیین می‌شود.
                                                        </small>
                                                    </div>
                                                </Col>
                                            </Row>

                                            <Row>
                                                {/* role */}
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="role" className="form-label">
                                                            نقش در سامانه{" "}
                                                            <span className="text-danger">*</span>
                                                        </Label>
                                                        <Input
                                                            id="role"
                                                            name="role"
                                                            type="select"
                                                            value={formik.values.role}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={
                                                                formik.touched.role && !!formik.errors.role
                                                            }
                                                            disabled={loadingSubmit}
                                                        >
                                                            <option value="admin">👑 ادمین</option>
                                                            <option value="union_member">
                                                                🏛️ عضو اتحادیه
                                                            </option>
                                                            <option value="union_user">
                                                                👤 کاربر اتحادیه
                                                            </option>
                                                        </Input>
                                                        <FormFeedback>{formik.errors.role}</FormFeedback>
                                                    </div>
                                                </Col>

                                                {/* member_status */}
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label
                                                            htmlFor="member_status"
                                                            className="form-label"
                                                        >
                                                            وضعیت عضو{" "}
                                                            <span className="text-danger">*</span>
                                                        </Label>
                                                        <Input
                                                            id="member_status"
                                                            name="member_status"
                                                            type="select"
                                                            value={formik.values.member_status}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={
                                                                formik.touched.member_status &&
                                                                !!formik.errors.member_status
                                                            }
                                                            disabled={loadingSubmit}
                                                        >
                                                            <option value="active">فعال</option>
                                                            <option value="inactive">غیرفعال</option>
                                                            <option value="pending">در حال بررسی</option>
                                                            <option value="suspended">تعلیق شده</option>
                                                        </Input>
                                                        <FormFeedback>
                                                            {formik.errors.member_status}
                                                        </FormFeedback>
                                                    </div>
                                                </Col>

                                                {/* category */}
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="category" className="form-label">
                                                            دسته‌بندی صنفی{" "}
                                                            <span className="text-danger">*</span>
                                                        </Label>
                                                        <Input
                                                            id="category"
                                                            name="category"
                                                            type="select"
                                                            value={formik.values.category}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={
                                                                formik.touched.category &&
                                                                !!formik.errors.category
                                                            }
                                                            disabled={loadingSubmit}
                                                        >
                                                            <option value="warehouse">انبار</option>
                                                            <option value="transport">باربری</option>
                                                            <option value="other">سایر</option>
                                                        </Input>
                                                        <FormFeedback>{formik.errors.category}</FormFeedback>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* 📞 اطلاعات تماس و شناسایی */}
                                        <div className="mb-4">
                                            <h5 className="font-size-14 mb-3">
                                                <i className="bx bx-id-card me-1"></i>
                                                اطلاعات تماس و شناسایی
                                            </h5>

                                            <Row>
                                                {/* mobile */}
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="mobile" className="form-label">
                                                            موبایل <span className="text-danger">*</span>
                                                        </Label>
                                                        <Input
                                                            id="mobile"
                                                            name="mobile"
                                                            type="text"
                                                            placeholder="0912xxxxxxx"
                                                            value={formik.values.mobile}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={
                                                                formik.touched.mobile &&
                                                                !!formik.errors.mobile
                                                            }
                                                            disabled={loadingSubmit}
                                                        />
                                                        <FormFeedback>{formik.errors.mobile}</FormFeedback>
                                                    </div>
                                                </Col>

                                                {/* phone */}
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="phone" className="form-label">
                                                            تلفن ثابت
                                                        </Label>
                                                        <Input
                                                            id="phone"
                                                            name="phone"
                                                            type="text"
                                                            placeholder="021xxxxxxx"
                                                            value={formik.values.phone}
                                                            onChange={formik.handleChange}
                                                            disabled={loadingSubmit}
                                                        />
                                                    </div>
                                                </Col>

                                                {/* email */}
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="email" className="form-label">
                                                            ایمیل (اختیاری)
                                                        </Label>
                                                        <Input
                                                            id="email"
                                                            name="email"
                                                            type="email"
                                                            placeholder="example@email.com"
                                                            value={formik.values.email}
                                                            onChange={formik.handleChange}
                                                            disabled={loadingSubmit}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>

                                            <Row>
                                                {/* father_name */}
                                                <Col md={4}>
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
                                                            disabled={loadingSubmit}
                                                        />
                                                    </div>
                                                </Col>

                                                {/* national_id */}
                                                <Col md={4}>
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
                                                            disabled={loadingSubmit}
                                                        />
                                                        <FormFeedback>
                                                            {formik.errors.national_id}
                                                        </FormFeedback>
                                                    </div>
                                                </Col>

                                                {/* birth_date */}
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
                                                            disabled={loadingSubmit}
                                                        />
                                                        <small className="text-muted">
                                                            در نمایش‌ها می‌توان تاریخ را به صورت شمسی نمایش داد.
                                                        </small>
                                                    </div>
                                                </Col>
                                            </Row>

                                            {/* address */}
                                            <Row>
                                                <Col md={12}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="address" className="form-label">
                                                            آدرس
                                                        </Label>
                                                        <Input
                                                            id="address"
                                                            name="address"
                                                            type="textarea"
                                                            rows="3"
                                                            placeholder="آدرس کامل محل کسب یا سکونت..."
                                                            value={formik.values.address}
                                                            onChange={formik.handleChange}
                                                            disabled={loadingSubmit}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* 🏢 اطلاعات کسب‌وکار و مجوز */}
                                        <div className="mb-4">
                                            <h5 className="font-size-14 mb-3">
                                                <i className="bx bx-buildings me-1"></i>
                                                اطلاعات کسب‌وکار و پروانه
                                            </h5>

                                            <Row>
                                                {/* business_name */}
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label
                                                            htmlFor="business_name"
                                                            className="form-label"
                                                        >
                                                            نام کسب و کار
                                                        </Label>
                                                        <Input
                                                            id="business_name"
                                                            name="business_name"
                                                            type="text"
                                                            value={formik.values.business_name}
                                                            onChange={formik.handleChange}
                                                            disabled={loadingSubmit}
                                                        />
                                                    </div>
                                                </Col>

                                                {/* company_name */}
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label
                                                            htmlFor="company_name"
                                                            className="form-label"
                                                        >
                                                            نام شرکت
                                                        </Label>
                                                        <Input
                                                            id="company_name"
                                                            name="company_name"
                                                            type="text"
                                                            value={formik.values.company_name}
                                                            onChange={formik.handleChange}
                                                            disabled={loadingSubmit}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>

                                            <Row>
                                                {/* registration_number */}
                                                <Col md={4}>
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
                                                            disabled={loadingSubmit}
                                                        />
                                                    </div>
                                                </Col>

                                                {/* license_number */}
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
                                                            disabled={loadingSubmit}
                                                        />
                                                    </div>
                                                </Col>

                                                {/* license_issue_date */}
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
                                                            disabled={loadingSubmit}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>

                                            <Row>
                                                {/* license_expire_date */}
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
                                                            disabled={loadingSubmit}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* 🖼️ تصاویر و مدارک */}
                                        <div className="mb-4">
                                            <h5 className="font-size-14 mb-3">
                                                <i className="bx bx-image me-1"></i>
                                                تصاویر و مدارک
                                            </h5>

                                            <Row>
                                                {/* member_image */}
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label
                                                            htmlFor="member_image_file"
                                                            className="form-label"
                                                        >
                                                            تصویر عضو
                                                        </Label>
                                                        <Input
                                                            id="member_image_file"
                                                            name="member_image_file"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) =>
                                                                handleFileUpload(
                                                                    e.currentTarget.files[0],
                                                                    "member_image",
                                                                    formik
                                                                )
                                                            }
                                                            disabled={loadingSubmit || uploadingField === "member_image"}
                                                        />
                                                        {uploadingField === "member_image" && (
                                                            <small className="text-muted">
                                                                در حال آپلود...
                                                            </small>
                                                        )}
                                                    </div>
                                                </Col>

                                                {/* national_card_image */}
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label
                                                            htmlFor="national_card_image_file"
                                                            className="form-label"
                                                        >
                                                            تصویر کارت ملی
                                                        </Label>
                                                        <Input
                                                            id="national_card_image_file"
                                                            name="national_card_image_file"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) =>
                                                                handleFileUpload(
                                                                    e.currentTarget.files[0],
                                                                    "national_card_image",
                                                                    formik
                                                                )
                                                            }
                                                            disabled={
                                                                loadingSubmit ||
                                                                uploadingField === "national_card_image"
                                                            }
                                                        />
                                                        {uploadingField === "national_card_image" && (
                                                            <small className="text-muted">
                                                                در حال آپلود...
                                                            </small>
                                                        )}
                                                    </div>
                                                </Col>

                                                {/* id_card_image */}
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label
                                                            htmlFor="id_card_image_file"
                                                            className="form-label"
                                                        >
                                                            تصویر شناسنامه
                                                        </Label>
                                                        <Input
                                                            id="id_card_image_file"
                                                            name="id_card_image_file"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) =>
                                                                handleFileUpload(
                                                                    e.currentTarget.files[0],
                                                                    "id_card_image",
                                                                    formik
                                                                )
                                                            }
                                                            disabled={
                                                                loadingSubmit ||
                                                                uploadingField === "id_card_image"
                                                            }
                                                        />
                                                        {uploadingField === "id_card_image" && (
                                                            <small className="text-muted">
                                                                در حال آپلود...
                                                            </small>
                                                        )}
                                                    </div>
                                                </Col>
                                            </Row>

                                            <Row>
                                                {/* license_image */}
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label
                                                            htmlFor="license_image_file"
                                                            className="form-label"
                                                        >
                                                            تصویر پروانه
                                                        </Label>
                                                        <Input
                                                            id="license_image_file"
                                                            name="license_image_file"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) =>
                                                                handleFileUpload(
                                                                    e.currentTarget.files[0],
                                                                    "license_image",
                                                                    formik
                                                                )
                                                            }
                                                            disabled={
                                                                loadingSubmit ||
                                                                uploadingField === "license_image"
                                                            }
                                                        />
                                                        {uploadingField === "license_image" && (
                                                            <small className="text-muted">
                                                                در حال آپلود...
                                                            </small>
                                                        )}
                                                    </div>
                                                </Col>

                                                {/* company_license_image */}
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label
                                                            htmlFor="company_license_image_file"
                                                            className="form-label"
                                                        >
                                                            تصویر پروانه شرکت
                                                        </Label>
                                                        <Input
                                                            id="company_license_image_file"
                                                            name="company_license_image_file"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) =>
                                                                handleFileUpload(
                                                                    e.currentTarget.files[0],
                                                                    "company_license_image",
                                                                    formik
                                                                )
                                                            }
                                                            disabled={
                                                                loadingSubmit ||
                                                                uploadingField === "company_license_image"
                                                            }
                                                        />
                                                        {uploadingField === "company_license_image" && (
                                                            <small className="text-muted">
                                                                در حال آپلود...
                                                            </small>
                                                        )}
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* 🎛 دکمه‌ها */}
                                        <div className="d-flex flex-wrap gap-2">
                                            <Button type="submit" color="primary" disabled={loadingSubmit}>
                                                {loadingSubmit ? (
                                                    <>
                                                        <Spinner size="sm" className="me-2" />
                                                        در حال ذخیره...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bx bx-check-double me-1"></i>
                                                        ثبت عضو
                                                    </>
                                                )}
                                            </Button>

                                            <Button
                                                type="button"
                                                color="light"
                                                disabled={loadingSubmit}
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
                                                onClick={() => navigate("/members/list")}
                                                disabled={loadingSubmit}
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

export default AddMember;
