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
// ✅ حذف api_helper و استفاده از کلاینت مستقیم
import { supabase } from "../../helpers/supabase";

const AddMember = () => {
    const navigate = useNavigate();

    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [uploadingField, setUploadingField] = useState(null);

    // 🔹 تابع آپلود فایل در Supabase Storage
    const handleFileUpload = async (file, fieldName, formik) => {
        if (!file) return;

        // محدودیت حجم (2 مگابایت)
        if (file.size > 2 * 1024 * 1024) {
            setError("حجم فایل نباید بیشتر از ۲ مگابایت باشد.");
            return;
        }

        try {
            setUploadingField(fieldName);
            setError("");

            // ساخت نام فایل یکتا
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `${fieldName}/${fileName}`;

            // 1. آپلود در باکت member-files
            const { error: uploadError } = await supabase.storage
                .from('member-files') // ⚠️ مطمئن شوید این باکت را ساخته‌اید
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. دریافت لینک عمومی
            const { data: publicUrlData } = supabase.storage
                .from('member-files')
                .getPublicUrl(filePath);

            if (publicUrlData?.publicUrl) {
                // ذخیره لینک در فرم
                formik.setFieldValue(fieldName, publicUrlData.publicUrl);
            }

        } catch (err) {
            console.error("Upload Error:", err);
            setError("خطا در آپلود فایل. لطفاً بررسی کنید باکت 'member-files' در Supabase وجود داشته باشد.");
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

            // 📅 تاریخ‌ها
            birth_date: "",
            license_number: "",
            license_issue_date: "",
            license_expire_date: "",

            // 🖼️ تصاویر
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
                .matches(/^[0-9]{10}$/, "کد ملی باید ۱۰ رقم باشد"),
            role: Yup.string().required("نقش را انتخاب کنید"),
            member_status: Yup.string().required("وضعیت عضو را انتخاب کنید"),
            category: Yup.string().required("دسته‌بندی را انتخاب کنید"),
        }),

        onSubmit: async (values) => {
            setError("");
            setSuccess("");
            setLoadingSubmit(true);

            try {
                // 1️⃣ چک تکراری بودن کد عضویت (بهینه شده)
                const { data: codeCheck } = await supabase
                    .from("members")
                    .select("id")
                    .eq("member_code", values.member_code)
                    .single();

                if (codeCheck) throw new Error("عضوی با این کد عضویت از قبل وجود دارد.");

                // 2️⃣ چک تکراری بودن موبایل
                const { data: mobileCheck } = await supabase
                    .from("members")
                    .select("id")
                    .eq("mobile", values.mobile)
                    .single();

                if (mobileCheck) throw new Error("عضوی با این شماره موبایل از قبل ثبت شده است.");

                // 3️⃣ چک تکراری بودن کد ملی (فقط اگر وارد شده باشد)
                if (values.national_id) {
                    const { data: nidCheck } = await supabase
                        .from("members")
                        .select("id")
                        .eq("national_id", values.national_id)
                        .single();

                    if (nidCheck) throw new Error("عضوی با این کد ملی از قبل ثبت شده است.");
                }

                // 4️⃣ آماده‌سازی Payload (رفع باگ BigInt)
                // نکته مهم: رشته‌های خالی "" باید به null تبدیل شوند
                const payload = {
                    full_name: values.full_name,
                    member_code: values.member_code,
                    role: values.role,
                    member_status: values.member_status,
                    category: values.category,
                    mobile: values.mobile,

                    // فیلدهای اختیاری (تبدیل "" به null)
                    phone: values.phone || null,
                    email: values.email || null,
                    father_name: values.father_name || null,
                    national_id: values.national_id || null,
                    address: values.address || null,

                    business_name: values.business_name || null,
                    company_name: values.company_name || null,
                    registration_number: values.registration_number || null,

                    birth_date: values.birth_date || null,
                    license_number: values.license_number || null,
                    license_issue_date: values.license_issue_date || null,
                    license_expire_date: values.license_expire_date || null,

                    member_image: values.member_image || null,
                    national_card_image: values.national_card_image || null,
                    id_card_image: values.id_card_image || null,
                    license_image: values.license_image || null,
                    company_license_image: values.company_license_image || null,

                    created_at: new Date(),
                    permissions: [] // ستون جدید برای دسترسی‌ها
                };

                // 5️⃣ ارسال به دیتابیس
                const { error: insertError } = await supabase
                    .from("members")
                    .insert([payload]);

                if (insertError) throw insertError;

                setSuccess("عضو با موفقیت ثبت شد.");

                setTimeout(() => {
                    formik.resetForm();
                    setSuccess("");
                    // اگر خواستید برگردید به لیست:
                    navigate("/members/list");
                }, 2000);

            } catch (err) {
                console.error("Submit Error:", err);
                // مدیریت خطای BigInt اگر هنوز رخ دهد
                let msg = err.message;
                if (err.code === '22P02') msg = "فرمت یکی از فیلدهای عددی (مثل کد ملی یا تلفن) صحیح نیست.";
                setError(msg || "خطا در ثبت عضو");
            } finally {
                setLoadingSubmit(false);
            }
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
                                <li className="breadcrumb-item"><Link to="/dashboard">داشبورد</Link></li>
                                <li className="breadcrumb-item"><Link to="/members/list">اعضا</Link></li>
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
                                        <p className="card-title-desc">لطفاً اطلاعات عضو جدید را وارد نمایید.</p>
                                    </div>

                                    {error && <Alert color="danger">{error}</Alert>}
                                    {success && <Alert color="success">{success}</Alert>}

                                    <Form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>

                                        {/* 👤 اطلاعات هویتی و سیستمی */}
                                        <div className="mb-4">
                                            <h5 className="font-size-14 mb-3 text-primary">
                                                <i className="bx bx-user me-1"></i> اطلاعات هویتی و سیستمی
                                            </h5>
                                            <Row>
                                                <Col md={6} className="mb-3">
                                                    <Label>نام و نام خانوادگی <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="full_name"
                                                        value={formik.values.full_name}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.full_name && !!formik.errors.full_name}
                                                        disabled={loadingSubmit}
                                                    />
                                                    <FormFeedback>{formik.errors.full_name}</FormFeedback>
                                                </Col>

                                                <Col md={6} className="mb-3">
                                                    <Label>کد عضویت <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="member_code"
                                                        value={formik.values.member_code}
                                                        onChange={formik.handleChange}
                                                        invalid={formik.touched.member_code && !!formik.errors.member_code}
                                                        disabled={loadingSubmit}
                                                    />
                                                    <FormFeedback>{formik.errors.member_code}</FormFeedback>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={4} className="mb-3">
                                                    <Label>نقش در سامانه <span className="text-danger">*</span></Label>
                                                    <Input type="select" name="role" value={formik.values.role} onChange={formik.handleChange} disabled={loadingSubmit}>
                                                        <option value="admin">👑 ادمین</option>
                                                        <option value="union_member">🏛️ عضو اتحادیه</option>
                                                        <option value="union_user">👤 کاربر اتحادیه</option>
                                                        <option value="employee">کارمند</option>
                                                    </Input>
                                                </Col>

                                                <Col md={4} className="mb-3">
                                                    <Label>وضعیت عضو <span className="text-danger">*</span></Label>
                                                    <Input type="select" name="member_status" value={formik.values.member_status} onChange={formik.handleChange} disabled={loadingSubmit}>
                                                        <option value="active">فعال</option>
                                                        <option value="inactive">غیرفعال</option>
                                                        <option value="pending">در حال بررسی</option>
                                                    </Input>
                                                </Col>

                                                <Col md={4} className="mb-3">
                                                    <Label>دسته‌بندی صنفی <span className="text-danger">*</span></Label>
                                                    <Input type="select" name="category" value={formik.values.category} onChange={formik.handleChange} disabled={loadingSubmit}>
                                                        <option value="warehouse">انبار</option>
                                                        <option value="transport">باربری</option>
                                                        <option value="other">سایر</option>
                                                    </Input>
                                                </Col>
                                            </Row>
                                        </div>

                                        <hr />

                                        {/* 📞 اطلاعات تماس و شناسایی */}
                                        <div className="mb-4">
                                            <h5 className="font-size-14 mb-3 text-primary">
                                                <i className="bx bx-id-card me-1"></i> اطلاعات تماس و شناسایی
                                            </h5>
                                            <Row>
                                                <Col md={4} className="mb-3">
                                                    <Label>موبایل <span className="text-danger">*</span></Label>
                                                    <Input name="mobile" value={formik.values.mobile} onChange={formik.handleChange} invalid={formik.touched.mobile && !!formik.errors.mobile} disabled={loadingSubmit} placeholder="0912..." />
                                                    <FormFeedback>{formik.errors.mobile}</FormFeedback>
                                                </Col>
                                                <Col md={4} className="mb-3">
                                                    <Label>تلفن ثابت</Label>
                                                    <Input name="phone" value={formik.values.phone} onChange={formik.handleChange} disabled={loadingSubmit} />
                                                </Col>
                                                <Col md={4} className="mb-3">
                                                    <Label>ایمیل</Label>
                                                    <Input name="email" value={formik.values.email} onChange={formik.handleChange} disabled={loadingSubmit} />
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={4} className="mb-3">
                                                    <Label>نام پدر</Label>
                                                    <Input name="father_name" value={formik.values.father_name} onChange={formik.handleChange} disabled={loadingSubmit} />
                                                </Col>
                                                <Col md={4} className="mb-3">
                                                    <Label>کد ملی</Label>
                                                    <Input name="national_id" value={formik.values.national_id} onChange={formik.handleChange} disabled={loadingSubmit} />
                                                </Col>
                                                <Col md={4} className="mb-3">
                                                    <Label>تاریخ تولد</Label>
                                                    <Input type="date" name="birth_date" value={formik.values.birth_date} onChange={formik.handleChange} disabled={loadingSubmit} />
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={12} className="mb-3">
                                                    <Label>آدرس</Label>
                                                    <Input type="textarea" name="address" value={formik.values.address} onChange={formik.handleChange} disabled={loadingSubmit} />
                                                </Col>
                                            </Row>
                                        </div>

                                        <hr />

                                        {/* 🏢 اطلاعات کسب‌وکار و پروانه */}
                                        <div className="mb-4">
                                            <h5 className="font-size-14 mb-3 text-primary">
                                                <i className="bx bx-buildings me-1"></i> اطلاعات کسب‌وکار و پروانه
                                            </h5>
                                            <Row>
                                                <Col md={6} className="mb-3">
                                                    <Label>نام کسب و کار</Label>
                                                    <Input name="business_name" value={formik.values.business_name} onChange={formik.handleChange} disabled={loadingSubmit} />
                                                </Col>
                                                <Col md={6} className="mb-3">
                                                    <Label>نام شرکت</Label>
                                                    <Input name="company_name" value={formik.values.company_name} onChange={formik.handleChange} disabled={loadingSubmit} />
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={4} className="mb-3">
                                                    <Label>شماره ثبت</Label>
                                                    <Input name="registration_number" value={formik.values.registration_number} onChange={formik.handleChange} disabled={loadingSubmit} />
                                                </Col>
                                                <Col md={4} className="mb-3">
                                                    <Label>شماره پروانه</Label>
                                                    <Input name="license_number" value={formik.values.license_number} onChange={formik.handleChange} disabled={loadingSubmit} />
                                                </Col>
                                                <Col md={4} className="mb-3">
                                                    <Label>تاریخ صدور پروانه</Label>
                                                    <Input type="date" name="license_issue_date" value={formik.values.license_issue_date} onChange={formik.handleChange} disabled={loadingSubmit} />
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={4} className="mb-3">
                                                    <Label>تاریخ انقضای پروانه</Label>
                                                    <Input type="date" name="license_expire_date" value={formik.values.license_expire_date} onChange={formik.handleChange} disabled={loadingSubmit} />
                                                </Col>
                                            </Row>
                                        </div>

                                        <hr />

                                        {/* 🖼️ تصاویر و مدارک */}
                                        <div className="mb-4">
                                            <h5 className="font-size-14 mb-3 text-primary">
                                                <i className="bx bx-image me-1"></i> تصاویر و مدارک
                                            </h5>
                                            <Alert color="info" className="p-2 font-size-12">فایل‌های زیر ۲ مگابایت مجاز هستند.</Alert>

                                            <Row>
                                                <Col md={4} className="mb-3">
                                                    <Label>تصویر عضو</Label>
                                                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e.currentTarget.files[0], "member_image", formik)} disabled={loadingSubmit || uploadingField === "member_image"} />
                                                    {uploadingField === "member_image" && <small className="text-primary">در حال آپلود...</small>}
                                                    {formik.values.member_image && <small className="text-success d-block">فایل آپلود شد ✔️</small>}
                                                </Col>

                                                <Col md={4} className="mb-3">
                                                    <Label>تصویر کارت ملی</Label>
                                                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e.currentTarget.files[0], "national_card_image", formik)} disabled={loadingSubmit || uploadingField === "national_card_image"} />
                                                    {uploadingField === "national_card_image" && <small className="text-primary">در حال آپلود...</small>}
                                                </Col>

                                                <Col md={4} className="mb-3">
                                                    <Label>تصویر شناسنامه</Label>
                                                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e.currentTarget.files[0], "id_card_image", formik)} disabled={loadingSubmit || uploadingField === "id_card_image"} />
                                                    {uploadingField === "id_card_image" && <small className="text-primary">در حال آپلود...</small>}
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={6} className="mb-3">
                                                    <Label>تصویر پروانه</Label>
                                                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e.currentTarget.files[0], "license_image", formik)} disabled={loadingSubmit || uploadingField === "license_image"} />
                                                    {uploadingField === "license_image" && <small className="text-primary">در حال آپلود...</small>}
                                                </Col>

                                                <Col md={6} className="mb-3">
                                                    <Label>تصویر پروانه شرکت</Label>
                                                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e.currentTarget.files[0], "company_license_image", formik)} disabled={loadingSubmit || uploadingField === "company_license_image"} />
                                                    {uploadingField === "company_license_image" && <small className="text-primary">در حال آپلود...</small>}
                                                </Col>
                                            </Row>
                                        </div>

                                        <div className="d-flex gap-2 justify-content-end">
                                            <Button type="button" color="light" onClick={() => { formik.resetForm(); setError(""); setSuccess(""); }}>پاک کردن فرم</Button>
                                            <Button type="button" color="secondary" onClick={() => navigate("/members/list")}>انصراف</Button>
                                            <Button type="submit" color="primary" disabled={loadingSubmit}>
                                                {loadingSubmit ? <Spinner size="sm" /> : "ثبت عضو"}
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