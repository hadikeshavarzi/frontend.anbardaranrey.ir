import React, { useState } from "react";

import * as Yup from "yup";
import { useFormik } from "formik";

import {
  Row,
  Col,
  CardBody,
  Card,
  Alert,
  Container,
  Form,
  Input,
  FormFeedback,
  Label,
  Button,
} from "reactstrap";

import profile from "../../assets/images/profile-img.png";
import lightlogo from "../../assets/images/logo-light.svg";

import { useDispatch } from "react-redux";
import { loginSuccess } from "../../store/actions";

import { requestOtp, verifyOtp } from "../../helpers/api_helper";

const Login = () => {
  document.title = "ورود به سامانه | اتحادیه";

  const dispatch = useDispatch();

  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const formMobile = useFormik({
    initialValues: {
      mobile: "",
    },
    validationSchema: Yup.object({
      mobile: Yup.string()
          .required("شماره موبایل را وارد کنید")
          .matches(/^09[0-9]{9}$/, "شماره موبایل معتبر نیست"),
    }),
    onSubmit: async (values) => {
      setErrorMessage("");
      setLoading(true);

      try {
        const data = await requestOtp(values.mobile);

        if (data.success) {
          setMobile(values.mobile);
          setStep(2);
        } else {
          setErrorMessage(data?.error || data?.message || "خطا در ارسال کد");
        }
      } catch (error) {
        setErrorMessage(typeof error === "string" ? error : "ارتباط با سرور برقرار نشد");
      }

      setLoading(false);
    },
  });

  const formOtp = useFormik({
    initialValues: {
      otp: "",
    },
    validationSchema: Yup.object({
      otp: Yup.string()
          .required("کد را وارد کنید")
          .matches(/^[0-9]{6}$/, "کد باید ۶ رقم باشد"),
    }),
    onSubmit: async (values) => {
      setErrorMessage("");
      setLoading(true);

      try {
        const data = await verifyOtp(mobile, values.otp);

        if (!data.success || !data.token) {
          setErrorMessage(data?.error || data?.message || "کد صحیح نیست");
          setLoading(false);
          return;
        }

        const memberData = data.user;

        // ذخیره امن
        localStorage.setItem("token", data.token);
        localStorage.setItem("member", JSON.stringify(memberData));
        localStorage.removeItem("authUser");

        // درست کردن Redux
        dispatch(
            loginSuccess({
              token: data.token,
              user: memberData,
            })
        );

        // جلوگیری از برگشت به لاگین
        setTimeout(() => {
          window.location.assign("/dashboard");
        }, 50);

      } catch (error) {
        setErrorMessage(
            error?.message ||
            (typeof error === "string" ? error : "ارتباط با سرور برقرار نشد")
        );
      }

      setLoading(false);
    },
  });

  const handleResendOtp = async () => {
    setErrorMessage("");
    setLoading(true);

    try {
      const data = await requestOtp(mobile);

      if (data.success) {
        alert("کد جدید ارسال شد");
      } else {
        setErrorMessage(data?.error || data?.message || "خطا در ارسال مجدد");
      }
    } catch (error) {
      setErrorMessage(typeof error === "string" ? error : "ارتباط با سرور برقرار نشد");
    }

    setLoading(false);
  };

  return (
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
                        <p>برای ورود شماره موبایل را وارد کنید</p>
                      </div>
                    </Col>
                    <Col className="col-5 align-self-end">
                      <img src={profile} alt="" className="img-fluid" />
                    </Col>
                  </Row>
                </div>

                <CardBody className="pt-0">
                  <div className="auth-logo text-center mt-4">
                    <div className="avatar-md profile-user-wid mx-auto">
                    <span className="avatar-title rounded-circle bg-light">
                      <img src={lightlogo} alt="" height="34" />
                    </span>
                    </div>
                  </div>

                  <div className="p-3">
                    {errorMessage && <Alert color="danger">{errorMessage}</Alert>}

                    {step === 1 && (
                        <Form
                            onSubmit={(e) => {
                              e.preventDefault();
                              formMobile.handleSubmit();
                            }}
                        >
                          <div className="mb-3">
                            <Label>شماره موبایل</Label>
                            <Input
                                name="mobile"
                                type="text"
                                placeholder="09121234567"
                                value={formMobile.values.mobile}
                                onChange={formMobile.handleChange}
                                onBlur={formMobile.handleBlur}
                                invalid={
                                    formMobile.touched.mobile &&
                                    !!formMobile.errors.mobile
                                }
                                disabled={loading}
                            />
                            <FormFeedback>{formMobile.errors.mobile}</FormFeedback>
                          </div>

                          <Button
                              color="primary"
                              className="w-100"
                              type="submit"
                              disabled={loading}
                          >
                            {loading ? "در حال ارسال..." : "ارسال کد"}
                          </Button>
                        </Form>
                    )}

                    {step === 2 && (
                        <Form
                            onSubmit={(e) => {
                              e.preventDefault();
                              formOtp.handleSubmit();
                            }}
                        >
                          <p className="text-muted mb-2">
                            کد تایید به <strong>{mobile}</strong> ارسال شد
                          </p>

                          <div className="mb-3">
                            <Label>کد تایید</Label>
                            <Input
                                name="otp"
                                type="text"
                                placeholder="123456"
                                value={formOtp.values.otp}
                                onChange={formOtp.handleChange}
                                onBlur={formOtp.handleBlur}
                                invalid={
                                    formOtp.touched.otp && !!formOtp.errors.otp
                                }
                                maxLength={6}
                                disabled={loading}
                            />
                            <FormFeedback>{formOtp.errors.otp}</FormFeedback>
                          </div>

                          <Button
                              color="success"
                              className="w-100"
                              type="submit"
                              disabled={loading}
                          >
                            {loading ? "در حال ورود..." : "ورود"}
                          </Button>

                          <div className="mt-3 d-flex justify-content-between">
                            <Button
                                color="link"
                                disabled={loading}
                                onClick={() => {
                                  setStep(1);
                                  formOtp.resetForm();
                                }}
                            >
                              تغییر شماره
                            </Button>

                            <Button
                                color="link"
                                onClick={handleResendOtp}
                                disabled={loading}
                            >
                              ارسال مجدد کد
                            </Button>
                          </div>
                        </Form>
                    )}
                  </div>
                </CardBody>
              </Card>

              <div className="mt-5 text-center">
                <p>© {new Date().getFullYear()} پرتال اتحادیه</p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
  );
};

export default Login;