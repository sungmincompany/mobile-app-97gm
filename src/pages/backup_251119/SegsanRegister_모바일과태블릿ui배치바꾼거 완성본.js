import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  DatePicker,
  InputNumber,
  Card,
  message,
  Input,
  Empty,
  Grid,
  Select,
} from "antd";
import dayjs from "dayjs";
import {
  PlusOutlined,
  MinusOutlined,
  SaveOutlined,
  SearchOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { DB_SCHEMA } from "../config";

const { useBreakpoint } = Grid;
const { Option } = Select;

const SegsanRegister = () => {
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  const [productList, setProductList] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductName, setSelectedProductName] = useState("");

  // md(768px) 이상이면 태블릿 모드
  const isTablet = !!screens.md;
  const v_db = DB_SCHEMA;

  useEffect(() => {
    fetch(`/api/select/jepum/jepum?v_db=${v_db}`)
      .then((res) => {
        if (!res.ok) throw new Error("Network Error");
        return res.json();
      })
      .then((data) => {
        setProductList(data);
        setFilteredProducts(data);
      })
      .catch((err) => {
        console.error(err);
        setProductList([]);
      });
  }, [v_db]);

  // 태블릿용 검색 함수
  const handleSearch = (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = productList.filter(
      (p) =>
        p.jepum_nm.toLowerCase().includes(keyword) ||
        p.jepum_cd.toLowerCase().includes(keyword)
    );
    setFilteredProducts(filtered);
  };

  // 태블릿용 카드 선택 함수
  const handleProductSelectCard = (p) => {
    setSelectedProduct(p.jepum_cd);
    setSelectedProductName(p.jepum_nm);
    form.setFieldsValue({ jepum_cd: p.jepum_cd });
  };

  // 모바일용 드롭다운 선택 함수
  const handleProductSelectDropdown = (val) => {
    const p = productList.find((item) => item.jepum_cd === val);
    setSelectedProduct(val);
    if (p) setSelectedProductName(p.jepum_nm);
    form.setFieldsValue({ jepum_cd: val });
  };

  const handlePlus = () => {
    const currentVal = form.getFieldValue("amt") || 0;
    const newVal = currentVal + 1;
    setQuantity(newVal);
    form.setFieldsValue({ amt: newVal });
  };

  const handleMinus = () => {
    const currentVal = form.getFieldValue("amt") || 0;
    if (currentVal > 1) {
      const newVal = currentVal - 1;
      setQuantity(newVal);
      form.setFieldsValue({ amt: newVal });
    }
  };

  const onFinish = (values) => {
    if (!values.jepum_cd) {
      message.error("제품을 선택해주세요!");
      return;
    }
    console.log("전송 데이터:", values);
    message.success("등록 완료!");
  };

  // ==========================================================
  // 🌟 CSS Grid 레이아웃 설정
  // ==========================================================
  const gridContainerStyle = {
    display: "grid",
    gap: "20px",
    // 태블릿: 320px(왼쪽) 나머지(오른쪽) / 모바일: 1줄
    gridTemplateColumns: isTablet ? "320px 1fr" : "1fr",

    // 🌟 여기가 핵심! 영역 배치 (Area)
    // 태블릿: 날짜 -> 프리뷰(선택확인) -> 수량 -> 버튼 순서 (왼쪽 패널)
    // 모바일: 날짜 -> 제품(드롭다운) -> 수량 -> 버튼 순서
    gridTemplateAreas: isTablet
      ? `
        "date    product"
        "preview product" 
        "qty     product"
        "btn     product"
      `
      : `
        "date"
        "product"
        "qty"
        "btn"
      `,
    alignItems: "start",
  };

  return (
    <div style={{ padding: "10px", maxWidth: "1200px", margin: "0 auto" }}>
      <Card
        title="🏭 생산실적 등록"
        bordered={true}
        style={{ borderRadius: "10px" }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            segsan_dt: dayjs(),
            amt: 1,
          }}
        >
          <div style={gridContainerStyle}>
            {/* 1. 생산일자 (Area: date) */}
            <div style={{ gridArea: "date" }}>
              <Form.Item
                label="📅 생산일자"
                name="segsan_dt"
                rules={[{ required: true, message: "날짜 선택" }]}
                style={{ marginBottom: 0 }}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                  size="large"
                />
              </Form.Item>
            </div>

            {/* 2. 제품선택 (Area: product) */}
            <div style={{ gridArea: "product" }}>
              <Form.Item
                label="📦 제품선택"
                name="jepum_cd"
                rules={[{ required: true, message: "제품 선택" }]}
                style={{ marginBottom: 0 }}
              >
                {isTablet ? (
                  /* ================= 태블릿: 카드 그리드 방식 ================= */
                  <div>
                    <Input
                      placeholder="제품명 검색..."
                      prefix={<SearchOutlined />}
                      size="large"
                      onChange={handleSearch}
                      style={{ marginBottom: "10px" }}
                    />
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(140px, 1fr))",
                        gap: "10px",
                        maxHeight: "500px", // 태블릿에선 길게
                        overflowY: "auto",
                        padding: "10px",
                        border: "1px solid #f0f0f0",
                        borderRadius: "8px",
                        backgroundColor: "#fafafa",
                      }}
                    >
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((p) => {
                          const isSelected = selectedProduct === p.jepum_cd;
                          return (
                            <div
                              key={p.jepum_cd}
                              onClick={() => handleProductSelectCard(p)}
                              style={{
                                cursor: "pointer",
                                border: isSelected
                                  ? "2px solid #1890ff"
                                  : "1px solid #d9d9d9",
                                backgroundColor: isSelected
                                  ? "#e6f7ff"
                                  : "#fff",
                                borderRadius: "8px",
                                padding: "12px",
                                textAlign: "center",
                                position: "relative",
                                transition: "all 0.2s",
                                height: "90px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              {isSelected && (
                                <CheckCircleFilled
                                  style={{
                                    position: "absolute",
                                    top: "6px",
                                    right: "6px",
                                    color: "#1890ff",
                                    fontSize: "16px",
                                  }}
                                />
                              )}
                              <div
                                style={{
                                  fontWeight: "bold",
                                  fontSize: "14px",
                                  marginBottom: "4px",
                                  lineHeight: "1.2",
                                  wordBreak: "keep-all",
                                }}
                              >
                                {p.jepum_nm}
                              </div>
                              <div style={{ fontSize: "11px", color: "#888" }}>
                                {p.jepum_cd}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <Empty
                          description="없음"
                          style={{ gridColumn: "1/-1", padding: "20px" }}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  /* ================= 모바일: 드롭다운(Select) 방식 ================= */
                  <Select
                    showSearch
                    placeholder="제품을 선택하세요"
                    size="large"
                    optionFilterProp="children"
                    onChange={handleProductSelectDropdown}
                    filterOption={(input, option) => {
                      const childrenText = String(option?.children ?? "");
                      return childrenText
                        .toLowerCase()
                        .includes(input.toLowerCase());
                    }}
                  >
                    {productList.map((p) => (
                      <Option key={p.jepum_cd} value={p.jepum_cd}>
                        {p.jepum_nm} ({p.jepum_cd})
                      </Option>
                    ))}
                  </Select>
                )}
              </Form.Item>
            </div>

            {/* 3. 선택 확인 박스 (Area: preview - 태블릿에서만 보임) */}
            {/* 🌟 요청하신 대로 수량 입력 위로 올림 */}
            {isTablet && (
              <div
                style={{
                  gridArea: "preview",
                  padding: "15px",
                  background: "#f0f5ff",
                  border: "1px dashed #1890ff",
                  borderRadius: "8px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    color: "#595959",
                    marginBottom: "5px",
                  }}
                >
                  선택된 제품
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#1890ff",
                    wordBreak: "keep-all",
                  }}
                >
                  {selectedProductName || (
                    <span style={{ color: "#ccc" }}>(선택안함)</span>
                  )}
                </div>
              </div>
            )}

            {/* 4. 수량 입력 (Area: qty) */}
            <div style={{ gridArea: "qty" }}>
              <Form.Item
                label="📊 생산수량"
                name="amt"
                rules={[{ required: true }]}
                style={{ marginBottom: 0 }}
              >
                {/* 🌟 높이 40px, 폰트 16px로 통일하여 다른 입력창과 이질감 없앰 */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Button
                    onClick={handleMinus}
                    icon={<MinusOutlined />}
                    size="large"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px 0 0 8px",
                    }}
                  />
                  <InputNumber
                    min={1}
                    value={quantity}
                    size="large"
                    controls={false}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      height: "40px",
                      fontSize: "16px",
                      borderRadius: 0,
                      borderLeft: "none",
                      borderRight: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onChange={(val) => {
                      setQuantity(val);
                      form.setFieldsValue({ amt: val });
                    }}
                  />
                  <Button
                    type="primary"
                    onClick={handlePlus}
                    icon={<PlusOutlined />}
                    size="large"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "0 8px 8px 0",
                    }}
                  />
                </div>
              </Form.Item>
            </div>

            {/* 5. 등록 버튼 (Area: btn) */}
            <div style={{ gridArea: "btn" }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                style={{ height: "50px", fontSize: "18px", fontWeight: "bold" }}
                icon={<SaveOutlined />}
              >
                등록하기
              </Button>
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default SegsanRegister;
