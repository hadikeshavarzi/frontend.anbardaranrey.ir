import React, { useRef } from "react";
import Select from "react-select";

const letterOptions = [
    "الف", "ب", "پ", "ت", "ث", "ج", "چ", "ح", "خ", "د", "ذ", "ر", "ز", "ژ",
    "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ک", "گ", "ل", "م",
    "ن", "و", "ه", "ی", "D", "S", "معلولین", "تشریفات"
].map((ltr) => ({ value: ltr, label: ltr }));

const PlateInput = ({ value, onChange }) => {
    const plate = value || {
        middle3: "",
        letter: "",
        right2: "",
        left2: "",
    };

    const midRef = useRef();
    const letterRef = useRef();
    const rightRef = useRef();
    const iranRef = useRef();

    const update = (field, val) => {
        onChange({ ...plate, [field]: val });
    };

    const handleEnter = (e, nextRef) => {
        if (e.key === "Enter" && nextRef?.current) {
            e.preventDefault();
            nextRef.current.focus();
        }
    };

    const inputBaseStyle = {
        border: "none",
        background: "transparent",
        fontSize: "17px",
        fontWeight: "900",
        textAlign: "center",
        outline: "none",
        fontFamily: 'Tahoma, Arial, sans-serif',
        padding: 0,
        color: "#000",
        height: "100%"
    };

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                height: "44px",     // ← تراز با فیلدهای فرم
                margin: 0,
                padding: 0,
            }}
        >

            <div
                style={{
                    width: "210px",
                    height: "44px",
                    border: "2px solid #000",
                    borderRadius: "5px",
                    display: "flex",
                    background: "#fff",
                    direction: "ltr",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    position: "relative"
                }}
            >
                {/* بخش آبی سمت چپ */}
                <div
                    style={{
                        width: "25px",
                        background: "#003399",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "3px 0",
                        color: "#fff",
                        borderTopLeftRadius: "3px",
                        borderBottomLeftRadius: "3px"
                    }}
                >
                    <div style={{ width: "16px", height: "11px", display: "flex", flexDirection: "column", border: "1px solid #fff" }}>
                        <div style={{ flex: 1, background: "#239f40" }}></div>
                        <div style={{ flex: 1, background: "#fff" }}></div>
                        <div style={{ flex: 1, background: "#da0000" }}></div>
                    </div>

                    <div style={{ fontSize: "5px", fontWeight: "bold", lineHeight: "1.1", textAlign: 'left' }}>
                        <div style={{ marginLeft: '1px' }}>I.R.</div>
                        <div style={{ marginLeft: '1px' }}>IRAN</div>
                    </div>
                </div>

                {/* بخش میانی */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {/* two digits */}
                    <input
                        ref={rightRef}
                        maxLength={2}
                        value={plate.right2}
                        placeholder="12"
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            update("right2", val);
                            if (val.length === 2) letterRef.current?.focus();
                        }}
                        onKeyDown={(e) => handleEnter(e, letterRef)}
                        style={{ ...inputBaseStyle, width: "35px" }}
                    />

                    {/* حرف */}
                    <div style={{ width: "45px", margin: "0" }}>
                        <Select
                            ref={letterRef}
                            openMenuOnFocus={true}
                            options={letterOptions}
                            placeholder="ب"
                            value={letterOptions.find((l) => l.value === plate.letter) || null}
                            onChange={(s) => {
                                update("letter", s.value);
                                midRef.current?.focus();
                            }}
                            menuPortalTarget={document.body}
                            styles={{
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                control: (base) => ({
                                    ...base,
                                    border: "none",
                                    boxShadow: "none",
                                    background: "transparent",
                                    minHeight: "auto",
                                }),
                                valueContainer: (base) => ({
                                    ...base,
                                    justifyContent: "center",
                                    padding: 0
                                }),
                                indicatorsContainer: () => ({ display: "none" }),
                                singleValue: (base) => ({
                                    ...base,
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    color: "#000",
                                }),
                                placeholder: (base) => ({
                                    ...base,
                                    fontSize: "14px",
                                    textAlign: 'center',
                                    color: "#ccc"
                                }),
                                menu: (base) => ({
                                    ...base,
                                    width: "80px",
                                    textAlign: "center"
                                })
                            }}
                        />
                    </div>

                    {/* سه رقم */}
                    <input
                        ref={midRef}
                        maxLength={3}
                        value={plate.middle3}
                        placeholder="345"
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            update("middle3", val);
                            if (val.length === 3) iranRef.current?.focus();
                        }}
                        onKeyDown={(e) => handleEnter(e, iranRef)}
                        style={{ ...inputBaseStyle, width: "48px" }}
                    />
                </div>

                {/* بخش کد ایران */}
                <div
                    style={{
                        width: "36px",
                        borderLeft: "2px solid #000",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div style={{ fontSize: "8px", fontWeight: "bold", marginTop: '1px' }}>ایـران</div>
                    <input
                        ref={iranRef}
                        maxLength={2}
                        value={plate.left2}
                        placeholder="11"
                        onChange={(e) =>
                            update("left2", e.target.value.replace(/\D/g, ""))
                        }
                        style={{
                            ...inputBaseStyle,
                            width: "100%",
                            fontSize: "14px",
                            height: "auto"
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default PlateInput;
