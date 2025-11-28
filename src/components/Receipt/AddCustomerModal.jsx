// src/components/Receipt/AddCustomerModal.jsx
import React from "react";
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Row,
    Col,
    Label,
    Input,
    Button
} from "reactstrap";

import DatePickerWithIcon from "./DatePickerWithIcon";

const AddCustomerModal = ({
                              isOpen,
                              toggle,
                              newCustomer,
                              setNewCustomer,
                              handleAddCustomer,
                          }) => {
    return (
        <Modal isOpen={isOpen} size="lg" toggle={toggle}>
            <ModalHeader toggle={toggle}>افزودن مشتری جدید</ModalHeader>

            <ModalBody>

                {/* نوع مشتری */}
                <Row className="mb-3">
                    <Col md="4">
                        <Label>نوع مشتری</Label>
                        <Input
                            type="select"
                            value={newCustomer.type}
                            onChange={(e) =>
                                setNewCustomer({ ...newCustomer, type: e.target.value })
                            }
                        >
                            <option value="person">حقیقی</option>
                            <option value="company">حقوقی</option>
                        </Input>
                    </Col>

                    <Col md="8">
                        <Label>نام / شرکت *</Label>
                        <Input
                            value={newCustomer.name}
                            onChange={(e) =>
                                setNewCustomer({ ...newCustomer, name: e.target.value })
                            }
                        />
                    </Col>
                </Row>

                {/* اطلاعات هویتی */}
                <Row className="mb-3">
                    <Col md="4">
                        <Label>کد ملی / شناسه ملی</Label>
                        <Input
                            value={newCustomer.nationalId}
                            onChange={(e) =>
                                setNewCustomer({ ...newCustomer, nationalId: e.target.value })
                            }
                        />
                    </Col>

                    <Col md="4">
                        <Label>موبایل</Label>
                        <Input
                            value={newCustomer.mobile}
                            onChange={(e) =>
                                setNewCustomer({ ...newCustomer, mobile: e.target.value })
                            }
                        />
                    </Col>

                    <Col md="4">
                        <Label>تلفن ثابت</Label>
                        <Input
                            value={newCustomer.phone}
                            onChange={(e) =>
                                setNewCustomer({ ...newCustomer, phone: e.target.value })
                            }
                        />
                    </Col>
                </Row>

                {/* تاریخ و کد پستی */}
                <Row className="mb-3">
                    <Col md="4">
                        <Label>تاریخ تولد / ثبت</Label>
                        <DatePickerWithIcon
                            value={newCustomer.birthDate}
                            onChange={(v) =>
                                setNewCustomer({ ...newCustomer, birthDate: v })
                            }
                        />
                    </Col>

                    <Col md="4">
                        <Label>کد پستی</Label>
                        <Input
                            value={newCustomer.postalCode}
                            onChange={(e) =>
                                setNewCustomer({ ...newCustomer, postalCode: e.target.value })
                            }
                        />
                    </Col>

                    <Col md="4">
                        <Label>شماره اقتصادی</Label>
                        <Input
                            value={newCustomer.economicCode}
                            onChange={(e) =>
                                setNewCustomer({ ...newCustomer, economicCode: e.target.value })
                            }
                        />
                    </Col>
                </Row>

                {/* آدرس */}
                <Row className="mb-3">
                    <Col>
                        <Label>آدرس کامل</Label>
                        <Input
                            type="textarea"
                            rows="3"
                            value={newCustomer.address}
                            onChange={(e) =>
                                setNewCustomer({ ...newCustomer, address: e.target.value })
                            }
                        />
                    </Col>
                </Row>

                {/* توضیحات */}
                <Row>
                    <Col>
                        <Label>توضیحات</Label>
                        <Input
                            type="textarea"
                            rows="2"
                            value={newCustomer.description}
                            onChange={(e) =>
                                setNewCustomer({ ...newCustomer, description: e.target.value })
                            }
                        />
                    </Col>
                </Row>
            </ModalBody>

            <ModalFooter>
                <Button color="success" onClick={handleAddCustomer}>
                    ذخیره مشتری
                </Button>
                <Button color="secondary" onClick={toggle}>
                    انصراف
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default AddCustomerModal;
