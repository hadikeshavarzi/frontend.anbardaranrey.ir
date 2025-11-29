import * as Yup from "yup";

// تعریف validationهای مشترک
export const validationRules = {
    // موبایل - 11 رقم و شروع با 09
    mobile: Yup.string()
        .matches(/^09\d{9}$/, "موبایل باید 11 رقم و با 09 شروع شود")
        .nullable(),

    // موبایل اجباری
    mobileRequired: Yup.string()
        .matches(/^09\d{9}$/, "موبایل باید 11 رقم و با 09 شروع شود")
        .required("موبایل الزامی است"),

    // کد ملی اشخاص حقیقی - 10 رقم
    nationalIdReal: Yup.string()
        .matches(/^\d{10}$/, "کد ملی باید 10 رقم باشد")
        .nullable(),

    // شناسه ملی اشخاص حقوقی - 11 رقم
    nationalIdCompany: Yup.string()
        .matches(/^\d{11}$/, "شناسه ملی باید 11 رقم باشد")
        .nullable(),

    // کد ملی پویا بر اساس نوع مشتری
    nationalIdDynamic: (customerTypeField = 'customerType') => 
        Yup.string().when(customerTypeField, {
            is: 'real',
            then: (schema) => schema
                .matches(/^\d{10}$/, "کد ملی باید 10 رقم باشد")
                .nullable(),
            otherwise: (schema) => schema
                .matches(/^\d{11}$/, "شناسه ملی باید 11 رقم باشد")
                .nullable()
        }),

    // کد پستی - 10 رقم
    postalCode: Yup.string()
        .matches(/^\d{10}$/, "کد پستی باید 10 رقم باشد")
        .nullable(),

    // کد اقتصادی - 12 یا 14 رقم
    economicCode: Yup.string()
        .matches(/^\d{12}$|^\d{14}$/, "کد اقتصادی باید 12 یا 14 رقم باشد")
        .nullable(),

    // نام - فقط حروف فارسی و فاصله
    namePersian: Yup.string()
        .matches(/^[\u0600-\u06FF\s]+$/, "نام باید فقط شامل حروف فارسی باشد")
        .required("نام الزامی است"),

    // نام - فارسی یا انگلیسی
    name: Yup.string()
        .required("نام الزامی است"),

    // ایمیل
    email: Yup.string()
        .email("فرمت ایمیل صحیح نیست")
        .nullable(),

    // ایمیل اجباری
    emailRequired: Yup.string()
        .email("فرمت ایمیل صحیح نیست")
        .required("ایمیل الزامی است"),

    // رشته اجباری
    requiredString: (message = "این فیلد الزامی است") => 
        Yup.string().required(message),

    // عدد اجباری
    requiredNumber: (message = "این فیلد الزامی است") => 
        Yup.number().required(message),

    // عدد مثبت
    positiveNumber: (message = "مقدار باید مثبت باشد") => 
        Yup.number().positive(message).nullable(),

    // قیمت
    price: Yup.number()
        .min(0, "قیمت نمی‌تواند منفی باشد")
        .nullable(),

    // تعداد
    quantity: Yup.number()
        .min(1, "تعداد باید حداقل 1 باشد")
        .integer("تعداد باید عدد صحیح باشد")
        .nullable(),
};

// Schemas آماده برای موارد متداول
export const customerValidationSchema = Yup.object().shape({
    customerType: validationRules.requiredString("نوع مشتری الزامی است"),
    name: validationRules.name,
    mobile: validationRules.mobile,
    nationalId: validationRules.nationalIdDynamic(),
    postalCode: validationRules.postalCode,
    economicCode: validationRules.economicCode,
    // phone بدون validation
});

export const productValidationSchema = Yup.object().shape({
    name: validationRules.name,
    price: validationRules.price,
    quantity: validationRules.quantity,
});

export const userValidationSchema = Yup.object().shape({
    name: validationRules.name,
    email: validationRules.emailRequired,
    mobile: validationRules.mobileRequired,
});

export default validationRules;