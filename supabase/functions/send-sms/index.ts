// supabase/functions/send-sms/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// اطلاعات ورود به پنل ملی پیامک
const USERNAME = "9121137675";
const PASSWORD = "f0d77e98-0f04-4433-b337-e0085d0ef8d9"; // رمز عبور پنل
const SENDER_NUMBER = "90003740"; // خط اختصاصی

serve(async (req) => {
  try {
    const body = await req.json();
    console.log("Incoming Payload:", JSON.stringify(body));

    // استخراج اطلاعات (سازگار با ساختار سوپابیس)
    const user = body.user;
    const smsObj = body.sms;

    // دریافت کد و شماره
    const otp = smsObj?.otp || body.otp;
    const rawPhone = smsObj?.phone || user?.phone;

    if (!rawPhone || !otp) {
      return new Response(JSON.stringify({ error: 'Missing phone or otp' }), { status: 400 });
    }

    // اصلاح شماره موبایل (0912...)
    let phone = rawPhone.toString();
    if (phone.startsWith('+98')) phone = '0' + phone.substring(3);
    else if (phone.startsWith('98')) phone = '0' + phone.substring(2);
    else if (!phone.startsWith('0')) phone = '0' + phone;

    const textMessage = `کد ورود به پرتال: ${otp}`;

    console.log(`Sending SMS to ${phone} via Standard REST API...`);

    // استفاده از وب‌سرویس اصلی ملی پیامک (REST)
    // مستندات: https://github.com/Melipayamak/Melipayamak-Rest
    const url = 'https://rest.payamak-panel.com/api/SendSMS/SendSMS';

    // این API اطلاعات را به صورت Form Data می‌گیرد
    const formData = new URLSearchParams();
    formData.append('username', USERNAME);
    formData.append('password', PASSWORD);
    formData.append('to', phone);
    formData.append('from', SENDER_NUMBER);
    formData.append('text', textMessage);
    formData.append('isFlash', 'false');

    const smsResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const smsResult = await smsResponse.json();
    console.log('MeliPayamak Result:', smsResult);

    // بررسی نتیجه (ملی پیامک در صورت موفقیت کد پیگیری طولانی و در صورت خطا کد عددی کوتاه می‌دهد)
    // معمولا اگر Value داشته باشد یعنی ارسال شده
    if (smsResult.Value && smsResult.Value.length > 15) {
      return new Response(JSON.stringify({ message: 'SMS sent successfully', id: smsResult.Value }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    }
    // بررسی خطاهای معروف (مثل نام کاربری اشتباه)
    else if (smsResult.RetStatus) {
      return new Response(JSON.stringify({ error: 'Provider Error', details: smsResult.StrRetStatus }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }
    else {
      // حالت پیش‌فرض برای اطمینان (چون گاهی فقط عدد برمی‌گرداند)
      // اگر ریسپانس OK بود، فرض را بر موفقیت می‌گذاریم مگر اینکه خطا مشخص باشد
      return new Response(JSON.stringify({ result: smsResult }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    }

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})