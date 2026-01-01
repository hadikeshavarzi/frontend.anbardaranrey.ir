import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Container, Row, Col, Card, CardBody, Form, Input, Label, FormFeedback, Button, Spinner, Alert
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { supabase } from "../../helpers/supabase"; // مسیر ایمپورت را طبق پروژه خودتان چک کنید

// اگر ریداکس دارید این‌ها بماند
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../store/actions";

import profile from "../../assets/images/profile-img.png";
import logo from "../../assets/images/logo.svg";

// ==========================================
// 🛠️ فرمت شماره برای ارسال به پنل پیامک (+98)
// ==========================================
const formatForAuth = (phone) => {
  if (!phone) return "";
  let p = phone.toString().trim();
  if (p.startsWith("09")) return "+98" + p.substring(1);
  if (p.startsWith("00")) return "+" + p.substring(2);
  if (!p.startsWith("+")) return "+98" + p;
  return p;
};

// ==========================================
// 🛠️ فرمت شماره برای جستجو در دیتابیس (09...)
// ==========================================
const formatForDb = (phone) => {
  if (!phone) return "";
  let p = phone.toString().trim();
  if (p.startsWith("+98")) return "0" + p.substring(3);
  return p;
};

const Login = () => {
  document.title = "ورود امن | مدیریت انبار";

  const dispatch = useDispatch();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [rawMobile, setRawMobile] = useState(""); // شماره‌ای که کاربر تایپ کرد
  const [authMobile, setAuthMobile] = useState(""); // شماره فرمت شده (+98...)

  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval = null;
    if (timer > 0) interval = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // ==================================================
  // 🟢 مرحله ۱: ارسال پیامک
  // ==================================================
  const formMobile = useFormik({
    initialValues: { mobile: "" },
    validationSchema: Yup.object({
      mobile: Yup.string().required("شماره موبایل الزامی است"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setErrorMsg("");

      const input = values.mobile.trim();
      const formatted = formatForAuth(input);

      try {
        console.log(`📤 Sending OTP to: ${formatted}`);

        const { error } = await supabase.auth.signInWithOtp({ phone: formatted });

        if (error) {
          if (error.message.includes("Signups not allowed")) throw new Error("ثبت‌نام بسته است.");
          throw error;
        }

        setRawMobile(input);
        setAuthMobile(formatted);
        setStep(2);
        setTimer(120);
        setSuccessMsg("کد تایید ارسال شد.");

      } catch (err) {
        console.error("OTP Error:", err);
        setErrorMsg(err.message || "خطا در ارسال پیامک.");
      } finally {
        setLoading(false);
      }
    },
  });

  // ==================================================
  // 🟢 مرحله ۲: تایید کد و ورود (اصلاح شده)
  // ==================================================
  const formOtp = useFormik({
    initialValues: { otp: "" },
    validationSchema: Yup.object({
      otp: Yup.string().required("کد تایید را وارد کنید").min(6, "کد ۶ رقمی است"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      try {
        console.log("🔄 Verifying OTP...");

        // 1. تایید کد در Auth Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          phone: authMobile,
          token: values.otp,
          type: 'sms',
        });

        if (error) throw error;
        if (!data.session) throw new Error("نشست کاربری ایجاد نشد.");

        console.log("✅ Auth Verified. Searching in DB...");

        // 2. جستجوی کاربر در جدول members
        let member = null;

        // تلاش اول: با شماره خام (0912...)
        let { data: m1 } = await supabase.from('members').select('*').eq('mobile', rawMobile).maybeSingle();
        if (m1) member = m1;

        // تلاش دوم: اگر پیدا نشد، با فرمت دیتابیس
        if (!member) {
          const dbFormat = formatForDb(authMobile);
          let { data: m2 } = await supabase.from('members').select('*').eq('mobile', dbFormat).maybeSingle();
          if (m2) member = m2;
        }

        if (!member) {
          throw new Error("اطلاعات شما در سیستم ثبت نشده است.");
        }

        if (member.member_status !== 'active') {
          throw new Error("حساب کاربری شما فعال نیست.");
        }

        console.log("✅ Member Found:", member);

        // 3. آماده‌سازی آبجکت کاربر
        const userObj = {
          id: member.id,
          email: member.email || "user@local.com",
          phone: member.mobile,
          role: member.role,
          member_details: member,
          permissions: member.permissions || []
        };

        // 4. ذخیره در LocalStorage
        localStorage.setItem("user", JSON.stringify(userObj));
        localStorage.setItem("authUser", JSON.stringify(userObj));

        // ⭐⭐⭐ بخش مهم: ذخیره توکن واقعی ⭐⭐⭐
        const accessToken = data.session?.access_token;

        if (accessToken) {
          localStorage.setItem("token", accessToken); // ✅ توکن واقعی ذخیره شد
          console.log("🔐 Real Token Saved Successfully");
        } else {
          // حالت اضطراری (اگر به هر دلیلی سشن نبود)
          console.warn("⚠️ No access token found inside session object!");
          throw new Error("خطا در دریافت توکن امنیتی");
        }
        // ⭐⭐⭐ پایان بخش مهم ⭐⭐⭐

        // 5. آپدیت ریداکس (اختیاری)
        try {
          if (dispatch) dispatch(loginSuccess(userObj));
        } catch (reduxErr) {
          console.warn("Redux Dispatch Skipped");
        }

        // 6. انتقال به داشبورد
        setSuccessMsg("ورود موفق! انتقال به داشبورد...");
        setTimeout(() => {
          window.location.assign("/dashboard");
        }, 500);

      } catch (err) {
        console.error("Login Error:", err);
        setErrorMsg(err.message || "کد اشتباه است یا خطایی رخ داده.");
      } finally {
        setLoading(false);
      }
    },
  });

  const handleBack = () => {
    setStep(1);
    setErrorMsg("");
    setSuccessMsg("");
    formOtp.resetForm();
  };

  const handleResend = () => {
    formMobile.handleSubmit();
  };

  return (
      <React.Fragment>
        <div className="account-pages my-5 pt-sm-5">
          <Container>
            <Row className="justify-content-center">
              <Col md={8} lg={6} xl={5}>
                <Card className="overflow-hidden">
                  <div className="bg-primary-subtle">
                    <Row>
                      <Col xs={7}>
                        <div className="text-primary p-4">
                          <h5 className="text-primary">خوش آمدید!</h5>
                          <p>ورود با رمز یکبار مصرف (SMS)</p>
                        </div>
                      </Col>
                      <Col xs={5} className="align-self-end">
                        <img src={profile} alt="" className="img-fluid" />
                      </Col>
                    </Row>
                  </div>
                  <CardBody className="pt-0">
                    <div className="auth-logo">
                      <Link to="/" className="auth-logo-light">
                        <div className="avatar-md profile-user-wid mb-4">
                        <span className="avatar-title rounded-circle bg-light">
                          <img src={logo} alt="" className="rounded-circle" height="34" />
                        </span>
                        </div>
                      </Link>
                    </div>

                    <div className="p-2">
                      {errorMsg && <Alert color="danger">{errorMsg}</Alert>}
                      {successMsg && <Alert color="success">{successMsg}</Alert>}

                      {/* === STEP 1: MOBILE === */}
                      {step === 1 && (
                          <Form className="form-horizontal" onSubmit={(e) => { e.preventDefault(); formMobile.handleSubmit(); }}>
                            <div className="mb-3">
                              <Label className="form-label">شماره موبایل</Label>
                              <Input
                                  name="mobile"
                                  className="form-control"
                                  placeholder="مثال: 0912..."
                                  dir="ltr"
                                  onChange={formMobile.handleChange}
                                  onBlur={formMobile.handleBlur}
                                  value={formMobile.values.mobile}
                                  invalid={!!(formMobile.touched.mobile && formMobile.errors.mobile)}
                                  disabled={loading}
                              />
                              {formMobile.touched.mobile && formMobile.errors.mobile && (
                                  <FormFeedback>{formMobile.errors.mobile}</FormFeedback>
                              )}
                            </div>
                            <div className="mt-3 d-grid">
                              <Button color="primary" type="submit" disabled={loading}>
                                {loading ? <Spinner size="sm" /> : "ارسال کد تایید"}
                              </Button>
                            </div>
                          </Form>
                      )}

                      {/* === STEP 2: OTP === */}
                      {step === 2 && (
                          <Form className="form-horizontal" onSubmit={(e) => { e.preventDefault(); formOtp.handleSubmit(); }}>
                            <div className="text-center mb-4">
                              <p className="text-muted">کد ارسال شده به <b>{rawMobile}</b></p>
                              <Button color="link" size="sm" onClick={handleBack} className="p-0">(ویرایش شماره)</Button>
                            </div>

                            <div className="mb-3">
                              <Label className="form-label">کد تایید (OTP)</Label>
                              <Input
                                  name="otp"
                                  className="form-control text-center font-size-18 tracking-widest"
                                  placeholder="- - - - - -"
                                  maxLength={6}
                                  dir="ltr"
                                  autoComplete="one-time-code"
                                  onChange={formOtp.handleChange}
                                  onBlur={formOtp.handleBlur}
                                  value={formOtp.values.otp}
                                  invalid={!!(formOtp.touched.otp && formOtp.errors.otp)}
                                  disabled={loading}
                              />
                              {formOtp.touched.otp && formOtp.errors.otp && (
                                  <FormFeedback>{formOtp.errors.otp}</FormFeedback>
                              )}
                            </div>

                            <div className="mt-3 d-grid">
                              <Button color="success" type="submit" disabled={loading}>
                                {loading ? <Spinner size="sm" /> : "ورود به سیستم"}
                              </Button>
                            </div>

                            <div className="mt-4 text-center">
                              {timer > 0 ? (
                                  <p className="text-muted font-size-12">ارسال مجدد تا {timer} ثانیه دیگر</p>
                              ) : (
                                  <Button color="link" onClick={handleResend}>ارسال مجدد کد</Button>
                              )}
                            </div>
                          </Form>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </React.Fragment>
  );
};

export default Login;