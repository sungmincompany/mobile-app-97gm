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
  ReloadOutlined,
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

  // ✅ [추가] 검색어 상태 관리 (초기화를 위해 필요)
  const [searchTerm, setSearchTerm] = useState("");

  const isTablet = !!screens.md;
  const v_db = DB_SCHEMA;

  useEffect(() => {
    fetch(`/api/common/jepum?v_db=${v_db}&tab_gbn_cd=01`)
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
    const keyword = e.target.value;
    setSearchTerm(keyword); // ✅ 검색어 상태 업데이트

    const keywordLower = keyword.toLowerCase();
    const filtered = productList.filter(
      (p) =>
        p.jepum_nm.toLowerCase().includes(keywordLower) ||
        p.jepum_cd.toLowerCase().includes(keywordLower)
    );
    setFilteredProducts(filtered);
  };

  const handleProductSelectCard = (p) => {
    setSelectedProduct(p.jepum_cd);
    setSelectedProductName(p.jepum_nm);
    form.setFieldsValue({ jepum_cd: p.jepum_cd });
  };

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

  // ✅ [수정] 초기화 함수 (검색어 및 필터 초기화 추가)
  const handleReset = () => {
    // 1. 폼 필드 리셋
    form.setFieldsValue({
      segsan_dt: dayjs(),
      amt: 1,
      jepum_cd: null,
    });

    // 2. 기본 상태 리셋
    setQuantity(1);
    setSelectedProduct(null);
    setSelectedProductName("");

    // 3. 검색 필터 리셋 (여기가 핵심!)
    setSearchTerm(""); // 검색어 지우기
    setFilteredProducts(productList); // 목록 전체로 복구

    message.info("입력창이 초기화되었습니다.");
  };

  const onFinish = async (values) => {
    if (!values.jepum_cd) {
      message.error("제품을 선택해주세요!");
      return;
    }

    try {
      const formattedDate = values.segsan_dt.format("YYYYMMDD");
      const payload = {
        segsan_dt: formattedDate,
        jepum_cd: values.jepum_cd,
        amt: values.amt,
      };

      const response = await fetch(`/api/segsan/insert?v_db=${v_db}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (response.ok) {
        message.success(`등록 성공! (번호: ${resData.segsan_cd})`);
        handleReset(); // 등록 후 초기화
      } else {
        message.error(`등록 실패: ${resData.error}`);
      }
    } catch (error) {
      console.error("등록 에러:", error);
      message.error("서버 통신 중 오류가 발생했습니다.");
    }
  };

  const gridContainerStyle = {
    display: "grid",
    gap: "20px",
    gridTemplateColumns: isTablet ? "320px 1fr" : "1fr",
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
            {/* 1. 생산일자 */}
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

            {/* 2. 제품선택 */}
            <div style={{ gridArea: "product" }}>
              <Form.Item
                label="📦 제품선택"
                name="jepum_cd"
                rules={[{ required: true, message: "제품 선택" }]}
                style={{ marginBottom: 0 }}
              >
                {isTablet ? (
                  /* 태블릿: 카드 그리드 */
                  <div>
                    <Input
                      placeholder="제품명 검색..."
                      prefix={<SearchOutlined />}
                      size="large"
                      value={searchTerm} // ✅ 검색어 상태 연결 (초기화 시 반영됨)
                      onChange={handleSearch}
                      style={{ marginBottom: "10px" }}
                    />
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(140px, 1fr))",
                        gap: "10px",
                        maxHeight: "500px",
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
                  /* 모바일: 드롭다운 */
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
                    // 모바일은 form.resetFields()로 자동 초기화되므로 별도 처리 불필요
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

            {/* 3. 선택 확인 박스 (태블릿용) */}
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

            {/* 4. 수량 입력 */}
            <div style={{ gridArea: "qty" }}>
              <Form.Item
                label="📊 생산수량"
                name="amt"
                rules={[{ required: true }]}
                style={{ marginBottom: 0 }}
              >
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

            {/* 5. 버튼 영역 */}
            <div style={{ gridArea: "btn", display: "flex", gap: "10px" }}>
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={handleReset}
                style={{ flex: 1, height: "50px", fontSize: "16px" }}
              >
                초기화
              </Button>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SaveOutlined />}
                style={{
                  flex: 2,
                  height: "50px",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
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
