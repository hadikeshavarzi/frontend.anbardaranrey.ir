export const sidebarData = [
    { label: "منوی اصلی", isHeader: true },
    {
        label: "داشبورد",
        icon: "bx bx-home-circle",
        url: "/dashboard",
    },

    /* --- مدیریت اعضا --- */
    { label: "اعضا و پرسنل", isHeader: true, permission: "member.view" },
    {
        label: "مدیریت اعضا",
        icon: "bx bx-user-plus",
        permission: "member.view",
        subItems: [
            { label: "لیست اعضا", url: "/members/list", permission: "member.view" },
            { label: "افزودن عضو", url: "/members/add", permission: "member.create" },
            { label: "مدیریت پرسنل من", url: "/system-users", permission: "member.manage" },
        ],
    },

    /* --- مشتریان --- */
    {
        label: "مشتریان",
        icon: "bx bx-group",
        permission: "customer.view",
        subItems: [
            { label: "لیست مشتریان", url: "/customers/list", permission: "customer.view" },
            { label: "افزودن مشتری", url: "/customers/add", permission: "customer.create" },
        ],
    },

    /* --- انبار و کالا --- */
    { label: "انبار و کالا", isHeader: true, permission: "inventory.view" },
    {
        label: "مدیریت کالا",
        icon: "bx bx-cube",
        permission: "inventory.view",
        subItems: [
            { label: "لیست کالاها", url: "/inventory/product-list", permission: "inventory.view" },
            { label: "افزودن کالا", url: "/inventory/add-product", permission: "inventory.create" },
            { label: "دسته‌بندی‌ها", url: "/inventory/category-list", permission: "inventory.view" },
            { label: "واحدها", url: "/inventory/unit-list", permission: "inventory.view" },
        ],
    },

    /* --- عملیات انبار --- */
    { label: "عملیات اجرایی", isHeader: true, permission: "receipt.view" },
    {
        label: "رسید کالا (ورود)",
        icon: "bx bx-log-in-circle",
        permission: "receipt.view",
        subItems: [
            { label: "لیست رسیدها", url: "/receipts", permission: "receipt.view" },
            { label: "ثبت رسید جدید", url: "/receipt/form", permission: "receipt.create" },
        ],
    },
    {
        label: "بارگیری و خروج",
        icon: "bx bx-truck",
        permission: "loading.view",
        subItems: [
            { label: "لیست بارگیری", url: "/loading/list", permission: "loading.view" },
            { label: "ثبت بارگیری", url: "/loading/create", permission: "loading.create" },
            { label: "لیست خروج نهایی", url: "/exit/list", permission: "exit.view" },
            { label: "ثبت خروج (باسکول)", url: "/exit/create", permission: "exit.create" },
        ],
    },
    {
        label: "ترخیص کالا",
        icon: "bx bx-check-shield",
        permission: "clearance.view",
        subItems: [
            { label: "ثبت ترخیص", url: "/clearances/form", permission: "clearance.create" },
            { label: "گزارش ترخیص", url: "/clearances/report", permission: "clearance.view" },
        ],
    },

    /* --- مالی و قرارداد --- */
    { label: "امور مالی و قرارداد", isHeader: true, permission: "accounting.view" },
    {
        label: "حسابداری",
        icon: "bx bx-money",
        permission: "accounting.view",
        subItems: [
            { label: "دفتر اسناد", url: "/accounting/documents", permission: "accounting.view" },
            { label: "ثبت سند جدید", url: "/accounting/new", permission: "accounting.create" },
            { label: "کدینگ حسابداری", url: "/accounting/coding", permission: "accounting.create" },
        ],
    },
    {
        label: "گزارشات مالی",
        icon: "bx bx-stats",
        permission: "accounting.reports",
        subItems: [
            { label: "دفتر روزنامه", url: "/accounting/reports/journal", permission: "accounting.reports" },
            { label: "مانده مشتریان", url: "/accounting/reports/customers", permission: "accounting.reports" },
            { label: "دفتر معین", url: "/accounting/reports/ledger", permission: "accounting.reports" },
            { label: "گزارش جامع", url: "/accounting/reports/comprehensive", permission: "accounting.reports" },
        ],
    },
    {
        label: "خزانه‌داری",
        icon: "bx bx-wallet",
        permission: "accounting.treasury",
        subItems: [
            { label: "لیست اسناد", url: "/accounting/list", permission: "accounting.treasury" },
            { label: "عملیات چک", url: "/accounting/check-operations", permission: "accounting.treasury" },
            { label: "تعاریف خزانه‌داری", url: "/accounting/definitions", permission: "accounting.treasury" },
        ],
    },
    {
        label: "اجاره انبار",
        icon: "bx bx-building-house",
        permission: "rent.list",
        subItems: [
            { label: "لیست قراردادها", url: "/rent/list", permission: "rent.list" },
            { label: "ثبت قرارداد جدید", url: "/rent/create", permission: "rent.create" },
        ],
    },

    /* --- پرتال اختصاصی مشتری --- */
    { label: "پرتال من", isHeader: true, permission: "client.portal" },
    {
        label: "قراردادهای من",
        icon: "bx bx-file-blank",
        url: "/my-contracts",
        permission: "client.portal",
    },
    {
        label: "موجودی کالای من",
        icon: "bx bx-box",
        url: "/my-inventory",
        permission: "client.portal",
    },
    {
        label: "صورتحساب‌های من",
        icon: "bx bx-receipt",
        url: "/my-invoices",
        permission: "client.portal",
    },
];