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
  CardTitle
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "../../helpers/supabase"; // ✅ اتصال مستقیم

/**
 * 📋 لیست جامع دسترسی‌های سیستم
 */
const ALL_PERMISSIONS = [
  {
    category: "📦 انبار و کالا",
    items: [
      { key: "inventory.view", label: "مشاهده لیست کالاها/واحدها" },
      { key: "inventory.create", label: "تعریف و ویرایش کالا/دسته/واحد" },
    ]
  },
  {
    category: "📥 رسید کالا (ورود)",
    items: [
      { key: "receipt.view", label: "مشاهده لیست رسیدها" },
      { key: "receipt.create", label: "ثبت رسید جدید" },
      { key: "receipt.edit", label: "ویرایش رسیدها" },
    ]
  },
  {
    category: "🚚 بارگیری و خروج",
    items: [
      { key: "loading.view", label: "مشاهده لیست بارگیری" },
      { key: "loading.create", label: "ثبت دستور بارگیری" },
      { key: "exit.view", label: "مشاهده خروج و باسکول" },
      { key: "exit.create", label: "ثبت خروج نهایی" },
      { key: "clearance.view", label: "مشاهده مجوزهای ترخیص" },
      { key: "clearance.create", label: "صدور مجوز ترخیص" },
    ]
  },
  {
    category: "👥 مشتریان",
    items: [
      { key: "customer.view", label: "مشاهده لیست مشتریان" },
      { key: "customer.create", label: "تعریف مشتری جدید" },
      { key: "customer.edit", label: "ویرایش مشتریان" },
    ]
  },
  {
    category: "💰 امور مالی و حسابداری",
    items: [
      { key: "accounting.view", label: "مشاهده اسناد حسابداری" },
      { key: "accounting.create", label: "ثبت سند و کدینگ" },
      { key: "accounting.reports", label: "دسترسی به گزارشات مالی" },
      { key: "accounting.treasury", label: "خزانه‌داری (چک و نقد)" },
    ]
  },
  {
    category: "📝 قراردادها",
    items: [
      { key: "rent.list", label: "مشاهده لیست اجاره‌ها" },
      { key: "rent.create", label: "ثبت قرارداد اجاره" },
    ]
  },
  {
    category: "⚙️ مدیریت سیستم",
    items: [
      { key: "member.view", label: "مشاهده لیست اعضا" },
      { key: "member.create", label: "افزودن عضو جدید" },
      { key: "member.manage", label: "مدیریت دسترسی‌ها (خطرناک)" },
    ]
  },
];

/**
 * تبدیل تاریخ برای Input Date
 */
const toInputDate = (value) => {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().split('T')[0];
  } catch {
    return "";
  }
};

const EditMember = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ استیت دسترسی‌ها
  const [selectedPerms, setSelectedPerms] = useState([]);

  const [initialValues, setInitialValues] = useState({
    role: "employee",
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
        const { data: res, error: fetchError } = await supabase
            .from("members")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;

        setInitialValues({
          role: res.role || "employee",
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

        // لود کردن دسترسی‌ها
        setSelectedPerms(Array.isArray(res.permissions) ? res.permissions : []);

      } catch (err) {
        console.error(err);
        setError("خطا در دریافت اطلاعات عضو: " + err.message);
      } finally {
        setLoadingData(false);
      }
    }

    if (id) loadMember();
  }, [id]);

  // 🟧 1. اصلاح تابع تغییر وضعیت تکی (با استیت فانکشنال)
  const togglePermission = (permKey) => {
    setSelectedPerms((prev) => {
      if (prev.includes(permKey)) {
        return prev.filter(p => p !== permKey); // حذف
      } else {
        return [...prev, permKey]; // اضافه
      }
    });
  };

  // 🟧 2. تابع انتخاب همه
  const toggleCategory = (categoryItems) => {
    const allKeys = categoryItems.map(i => i.key);
    const allSelected = allKeys.every(k => selectedPerms.includes(k));

    if (allSelected) {
      // حذف همه
      setSelectedPerms(prev => prev.filter(p => !allKeys.includes(p)));
    } else {
      // اضافه کردن موارد نداشته
      setSelectedPerms(prev => {
        const newPerms = [...prev];
        allKeys.forEach(k => {
          if (!newPerms.includes(k)) newPerms.push(k);
        });
        return newPerms;
      });
    }
  };

  // 🧾 ولیدیشن فرم
  const validationSchema = Yup.object({
    full_name: Yup.string().required("نام و نام خانوادگی الزامی است"),
    mobile: Yup.string().required("موبایل الزامی است"),
    role: Yup.string().required("نقش الزامی است"),
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
          father_name: values.father_name || null,
          national_id: values.national_id || null,
          mobile: values.mobile,
          phone: values.phone || null,
          address: values.address || null,
          birth_date: values.birth_date || null,
          business_name: values.business_name || null,
          category: values.category || "warehouse",
          member_status: values.member_status || "active",
          license_number: values.license_number || null,
          license_issue_date: values.license_issue_date || null,
          license_expire_date: values.license_expire_date || null,
          company_name: values.company_name || null,
          registration_number: values.registration_number || null,
          permissions: selectedPerms, // ✅ ذخیره دسترسی‌ها
          updated_at: new Date()
        };

        const { error: updateError } = await supabase
            .from("members")
            .update(payload)
            .eq("id", id);

        if (updateError) throw updateError;

        setSuccess("اطلاعات عضو و دسترسی‌ها با موفقیت ذخیره شد");
        window.scrollTo(0, 0);
        setTimeout(() => navigate("/members/list"), 1500);

      } catch (err) {
        console.error(err);
        setError(err.message || "خطا در ذخیره اطلاعات");
        window.scrollTo(0, 0);
      } finally {
        setSaving(false);
      }
    },
  });

  if (loadingData) {
    return (
        <div className="page-content">
          <Container fluid>
            <Card>
              <CardBody className="text-center py-5">
                <Spinner color="primary" />
                <h5 className="mt-3 text-muted">در حال بارگذاری اطلاعات...</h5>
              </CardBody>
            </Card>
          </Container>
        </div>
    );
  }

  return (
      <React.Fragment>
        <div className="page-content">
          <Container fluid>
            {/* Header */}
            <div className="page-title-box d-flex align-items-center justify-content-between">
              <h4 className="mb-0 font-size-18">ویرایش عضو</h4>
              <div className="page-title-right">
                <ol className="breadcrumb m-0">
                  <li className="breadcrumb-item"><Link to="/dashboard">داشبورد</Link></li>
                  <li className="breadcrumb-item"><Link to="/members/list">اعضا</Link></li>
                  <li className="breadcrumb-item active">ویرایش</li>
                </ol>
              </div>
            </div>

            <Form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>

              {/* Alerts */}
              {error && <Alert color="danger">{error}</Alert>}
              {success && <Alert color="success">{success}</Alert>}

              {/* بخش ۱: اطلاعات پایه */}
              <Row>
                <Col lg={12}>
                  <Card>
                    <CardBody>
                      <h4 className="card-title mb-4">اطلاعات هویتی و سازمانی</h4>

                      <Row>
                        <Col md={4}>
                          <div className="mb-3">
                            <Label>نقش در سیستم <span className="text-danger">*</span></Label>
                            <Input
                                type="select"
                                name="role"
                                value={formik.values.role}
                                onChange={formik.handleChange}
                                className="form-select"
                            >
                              <option value="admin">مدیر کل (Admin)</option>
                              <option value="employee">کارمند (Employee)</option>
                              <option value="union_member">عضو اتحادیه</option>
                              <option value="union_user">کاربر عادی</option>
                              <option value="customer">مشتری (Customer)</option>
                            </Input>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="mb-3">
                            <Label>وضعیت</Label>
                            <Input
                                type="select"
                                name="member_status"
                                value={formik.values.member_status}
                                onChange={formik.handleChange}
                            >
                              <option value="active">فعال</option>
                              <option value="inactive">غیرفعال</option>
                              <option value="suspended">معلق</option>
                            </Input>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="mb-3">
                            <Label>نام و نام خانوادگی <span className="text-danger">*</span></Label>
                            <Input
                                name="full_name"
                                value={formik.values.full_name}
                                onChange={formik.handleChange}
                                invalid={formik.touched.full_name && !!formik.errors.full_name}
                            />
                            <FormFeedback>{formik.errors.full_name}</FormFeedback>
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={4}>
                          <div className="mb-3">
                            <Label>شماره موبایل <span className="text-danger">*</span></Label>
                            <Input
                                name="mobile"
                                value={formik.values.mobile}
                                onChange={formik.handleChange}
                                invalid={formik.touched.mobile && !!formik.errors.mobile}
                            />
                            <FormFeedback>{formik.errors.mobile}</FormFeedback>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="mb-3">
                            <Label>کد ملی</Label>
                            <Input
                                name="national_id"
                                value={formik.values.national_id}
                                onChange={formik.handleChange}
                            />
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="mb-3">
                            <Label>کد عضویت</Label>
                            <Input
                                name="member_code"
                                value={formik.values.member_code}
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

                      {/* اطلاعات تکمیلی (کسب و کار) */}
                      <div className="mt-4">
                        <h5 className="font-size-14 text-muted mb-3">اطلاعات تکمیلی</h5>
                        <Row>
                          <Col md={6}>
                            <div className="mb-3">
                              <Label>نام کسب و کار / شرکت</Label>
                              <Input
                                  name="company_name"
                                  value={formik.values.company_name}
                                  onChange={formik.handleChange}
                              />
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="mb-3">
                              <Label>شماره ثبت / پروانه</Label>
                              <Input
                                  name="license_number"
                                  value={formik.values.license_number}
                                  onChange={formik.handleChange}
                              />
                            </div>
                          </Col>
                        </Row>
                      </div>

                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {/* بخش ۲: مدیریت دسترسی‌ها (نسخه اصلاح شده با قابلیت کلیک روی کل ردیف) */}
              {formik.values.role === 'admin' ? (
                  <Alert color="info" className="d-flex align-items-center mt-3">
                    <i className="bx bx-shield-quarter font-size-24 me-3"></i>
                    <div>
                      <strong>مدیر کل (Admin)</strong>
                      <br/>
                      این کاربر دارای دسترسی کامل سیستمی است و نیازی به تنظیم دسترسی‌های ریز ندارد.
                    </div>
                  </Alert>
              ) : (
                  <div className="mt-4">
                    <h4 className="font-size-16 mb-3">تنظیمات دسترسی (Permissions)</h4>
                    <Row>
                      {ALL_PERMISSIONS.map((section, index) => (
                          <Col md={6} xl={4} key={index} className="mb-4">
                            <Card className="h-100 border shadow-none">
                              <CardBody className="p-0"> {/* پدینگ صفر برای استایل ردیفی */}

                                {/* هدر کارت */}
                                <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
                                  <CardTitle className="h6 mb-0 text-primary">{section.category}</CardTitle>
                                  <Button
                                      size="sm"
                                      color="primary"
                                      outline
                                      className="font-size-12 py-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCategory(section.items);
                                      }}
                                  >
                                    انتخاب همه
                                  </Button>
                                </div>

                                {/* لیست آیتم‌ها */}
                                <div className="d-flex flex-column">
                                  {section.items.map((perm) => {
                                    const isChecked = selectedPerms.includes(perm.key);
                                    return (
                                        <div
                                            key={perm.key}
                                            // ✅ کل ردیف قابل کلیک است
                                            className={`d-flex justify-content-between align-items-center p-3 border-bottom ${isChecked ? 'bg-soft-success' : ''}`}
                                            style={{ cursor: 'pointer', transition: '0.2s' }}
                                            onClick={() => togglePermission(perm.key)}
                                        >
                                            <span className={`font-size-13 ${isChecked ? 'text-success fw-bold' : 'text-secondary'}`}>
                                                {perm.label}
                                            </span>

                                          {/* سوییچ */}
                                          <div className="form-check form-switch m-0" style={{ pointerEvents: 'none' }}>
                                            <Input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={isChecked}
                                                readOnly // فقط نمایشی
                                                style={{ transform: 'scale(1.2)' }}
                                            />
                                          </div>
                                        </div>
                                    );
                                  })}
                                </div>
                              </CardBody>
                            </Card>
                          </Col>
                      ))}
                    </Row>
                  </div>
              )}

              {/* دکمه‌ها */}
              <div className="d-flex gap-2 mb-5 justify-content-end">
                <Button type="button" color="secondary" size="lg" onClick={() => navigate("/members/list")} disabled={saving}>
                  بازگشت
                </Button>
                <Button type="submit" color="primary" size="lg" disabled={saving}>
                  {saving ? <Spinner size="sm" /> : <><i className="bx bx-save me-1"></i> ذخیره تغییرات</>}
                </Button>
              </div>

            </Form>
          </Container>
        </div>
      </React.Fragment>
  );
};

export default EditMember;