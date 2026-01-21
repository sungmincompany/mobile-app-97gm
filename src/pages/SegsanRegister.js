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
  Tabs,
  Table,
  Modal,
} from "antd";
import dayjs from "dayjs";
import {
  PlusOutlined,
  MinusOutlined,
  SaveOutlined,
  SearchOutlined,
  CheckCircleFilled,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  LeftOutlined, // 👈 추가
  RightOutlined, // 👈 추가
} from "@ant-design/icons";
import { DB_SCHEMA } from "../config";

const { useBreakpoint } = Grid;
const { Option } = Select;
const { confirm } = Modal;
const { RangePicker } = DatePicker;

const SegsanRegister = () => {
  // ================= 공통 상태 =================
  const screens = useBreakpoint();
  const isTablet = !!screens.md;
  const v_db = DB_SCHEMA;
  const [activeTab, setActiveTab] = useState("1");

  // ================= 탭 1: 등록용 상태 =================
  const [form] = Form.useForm();
  const [productList, setProductList] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductName, setSelectedProductName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ [추가] 모바일 제품 선택 모달 상태
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // ================= 탭 2: 조회용 상태 =================
  const [historyList, setHistoryList] = useState([]);

  // 조회 기간 상태
  const [searchRange, setSearchRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editAmt, setEditAmt] = useState(0);

  // 1. 초기 데이터 로드
  useEffect(() => {
    fetch(`/api/97gm/jepum/line?v_db=${v_db}`)
      .then((res) => res.json())
      .then((data) => {
        setProductList(data);
        setFilteredProducts(data);
      })
      .catch((err) => console.error(err));
  }, [v_db]);

  // 2. 조회 탭 진입 시 or 날짜 변경 시 목록 조회
  useEffect(() => {
    if (activeTab === "2") {
      fetchHistory();
    }
  }, [activeTab, searchRange]);

  // 기간 조회 함수
  const fetchHistory = () => {
    if (!searchRange || searchRange.length !== 2) return;

    const fromDt = searchRange[0].format("YYYYMMDD");
    const toDt = searchRange[1].format("YYYYMMDD");

    fetch(`/api/segsan/list?v_db=${v_db}&from_dt=${fromDt}&to_dt=${toDt}`)
      .then((res) => res.json())
      .then((data) => setHistoryList(data))
      .catch((err) => message.error("조회 실패"));
  };

  // ... (탭 1 핸들러들) ...
  const handleSearch = (e) => {
    const keyword = e.target.value;
    setSearchTerm(keyword);
    const keywordLower = keyword.toLowerCase();
    const filtered = productList.filter(
      (p) =>
        p.jepum_nm.toLowerCase().includes(keywordLower) ||
        p.jepum_cd.toLowerCase().includes(keywordLower),
    );
    setFilteredProducts(filtered);
  };

  const handleProductSelectCard = (p) => {
    setSelectedProduct(p.jepum_cd);
    setSelectedProductName(p.jepum_nm);
    form.setFieldsValue({ jepum_cd: p.jepum_cd });
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

  const handleReset = () => {
    form.setFieldsValue({ segsan_dt: dayjs(), amt: 1, jepum_cd: null });
    setQuantity(1);
    setSelectedProduct(null);
    setSelectedProductName("");
    setSearchTerm("");
    setFilteredProducts(productList);
    message.info("초기화되었습니다.");
  };

  // 날짜 하루 전으로 이동
  const handlePrevDate = () => {
    const current = form.getFieldValue("segsan_dt");
    if (current) {
      form.setFieldsValue({ segsan_dt: current.subtract(1, "day") });
    }
  };

  // 날짜 하루 후로 이동
  const handleNextDate = () => {
    const current = form.getFieldValue("segsan_dt");
    if (current) {
      form.setFieldsValue({ segsan_dt: current.add(1, "day") });
    }
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
        handleReset();
      } else {
        message.error(`등록 실패: ${resData.error}`);
      }
    } catch (error) {
      message.error("서버 통신 오류");
    }
  };

  // ================= 탭 2 기능 (수정/삭제) =================

  const handleEditPlus = () => {
    setEditAmt((prev) => (prev || 0) + 1);
  };

  const handleEditMinus = () => {
    setEditAmt((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const handleDelete = (record) => {
    confirm({
      title: "삭제하시겠습니까?",
      content: `${record.jepum_nm} (${record.amt}개)`,
      okText: "삭제",
      okType: "danger",
      cancelText: "취소",
      onOk: async () => {
        try {
          const res = await fetch(
            `/api/segsan/delete?v_db=${v_db}&segsan_cd=${record.segsan_cd}`,
            { method: "DELETE" },
          );
          if (res.ok) {
            message.success("삭제되었습니다.");
            fetchHistory();
          } else {
            message.error("삭제 실패");
          }
        } catch (e) {
          message.error("통신 오류");
        }
      },
    });
  };

  const openEditModal = (record) => {
    setEditRecord(record);
    setEditAmt(record.amt);
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`/api/segsan/update?v_db=${v_db}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segsan_cd: editRecord.segsan_cd,
          amt: editAmt,
        }),
      });
      if (res.ok) {
        message.success("수정되었습니다.");
        setIsModalOpen(false);
        fetchHistory();
      } else {
        message.error("수정 실패");
      }
    } catch (e) {
      message.error("통신 오류");
    }
  };

  const columns = [
    {
      title: "날짜",
      dataIndex: "segsan_dt",
      key: "segsan_dt",
      render: (text) =>
        text && `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`,
      width: 100,
      align: "center",
      sorter: (a, b) => a.segsan_dt.localeCompare(b.segsan_dt),
      defaultSortOrder: "descend",
    },
    {
      title: "제품명",
      dataIndex: "jepum_nm",
      key: "jepum_nm",
    },
    {
      title: "수량",
      dataIndex: "amt",
      key: "amt",
      width: 70,
      align: "center",
    },
    {
      title: "관리",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <>
          <Button
            icon={<EditOutlined />}
            size="small"
            style={{ marginRight: 5 }}
            onClick={() => openEditModal(record)}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record)}
          />
        </>
      ),
    },
  ];

  // ================= 렌더링 =================
  const gridContainerStyle = {
    display: "grid",
    gap: "20px",
    gridTemplateColumns: isTablet ? "320px 1fr" : "1fr",
    gridTemplateAreas: isTablet
      ? `"date product" "preview product" "qty product" "btn product"`
      : `"date" "product" "qty" "btn"`,
    alignItems: "start",
  };

  return (
    <div style={{ padding: "10px", maxWidth: "1200px", margin: "0 auto" }}>
      <Card
        title="🏭 생산실적 관리"
        bordered={true}
        style={{ borderRadius: "10px" }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
          {/* 탭 1: 생산 등록 */}
          <Tabs.TabPane tab="등록" key="1">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{ segsan_dt: dayjs(), amt: 1 }}
            >
              <div style={gridContainerStyle}>
                {/* 1. 생산일자 */}
                <div style={{ gridArea: "date" }}>
                  {/* 라벨은 바깥 Form.Item에 둡니다 */}
                  <Form.Item label="📅 생산일자" required>
                    <div style={{ display: "flex", gap: "5px" }}>
                      {/* 이전 날짜 버튼 */}
                      <Button
                        icon={<LeftOutlined />}
                        onClick={handlePrevDate}
                        size="large"
                      />

                      {/* DatePicker를 감싸는 내부 Form.Item (noStyle로 스타일 영향 제거) */}
                      <Form.Item
                        name="segsan_dt"
                        noStyle
                        rules={[
                          { required: true, message: "날짜를 선택하세요" },
                        ]}
                      >
                        <DatePicker
                          style={{ flex: 1 }} // flex: 1로 남은 공간 꽉 채우기
                          format="YYYY-MM-DD"
                          size="large"
                          inputReadOnly={true} // 모바일에서 키보드 올라오는 것 방지
                          allowClear={false}
                        />
                      </Form.Item>

                      {/* 다음 날짜 버튼 */}
                      <Button
                        icon={<RightOutlined />}
                        onClick={handleNextDate}
                        size="large"
                      />
                    </div>
                  </Form.Item>
                </div>

                <div style={{ gridArea: "product" }}>
                  {isTablet ? (
                    // === 태블릿 View (기존 코드 유지) ===
                    <Form.Item
                      label="📦 제품선택"
                      name="jepum_cd"
                      rules={[{ required: true }]}
                    >
                      <div>
                        <Input
                          placeholder="제품명 검색..."
                          prefix={<SearchOutlined />}
                          size="large"
                          value={searchTerm}
                          onChange={handleSearch}
                          style={{ marginBottom: "10px" }}
                        />
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(140px, 1fr))",
                            gap: "10px",
                            height: "calc(100vh - 340px)",
                            minHeight: "300px",
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
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#888",
                                    }}
                                  >
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
                    </Form.Item>
                  ) : (
                    // === 모바일 View (모달 방식) ===
                    <>
                      <Form.Item
                        label="📦 제품선택"
                        required
                        tooltip="여기를 클릭하여 제품을 선택하세요"
                      >
                        <Input
                          readOnly
                          size="large"
                          value={selectedProductName}
                          placeholder="제품을 선택해 주세요"
                          onClick={() => setIsProductModalOpen(true)} // 클릭 시 모달 오픈
                          suffix={<SearchOutlined />}
                        />
                      </Form.Item>

                      {/* 실제 Form 전송을 위한 숨겨진 필드 */}
                      <Form.Item
                        name="jepum_cd"
                        style={{ display: "none" }}
                        rules={[
                          { required: true, message: "제품을 선택해주세요" },
                        ]}
                      >
                        <Input />
                      </Form.Item>

                      {/* 모바일용 제품 선택 모달 */}
                      <Modal
                        title="제품 선택"
                        open={isProductModalOpen}
                        onCancel={() => setIsProductModalOpen(false)}
                        footer={null}
                        bodyStyle={{ padding: "0" }}
                        centered
                        style={{ top: 20 }}
                      >
                        <div
                          style={{
                            padding: "15px",
                            borderBottom: "1px solid #f0f0f0",
                          }}
                        >
                          <Input
                            placeholder="제품명 또는 코드 검색"
                            prefix={<SearchOutlined />}
                            size="large"
                            value={searchTerm}
                            onChange={handleSearch}
                          />
                        </div>
                        <div style={{ height: "60vh", overflowY: "auto" }}>
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((p) => (
                              <div
                                key={p.jepum_cd}
                                onClick={() => {
                                  handleProductSelectCard(p); // 기존 선택 핸들러 재사용
                                  setIsProductModalOpen(false); // 모달 닫기
                                }}
                                style={{
                                  padding: "15px 20px",
                                  borderBottom: "1px solid #f0f0f0",
                                  cursor: "pointer",
                                  backgroundColor:
                                    selectedProduct === p.jepum_cd
                                      ? "#e6f7ff"
                                      : "#fff",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "15px",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {p.jepum_nm}
                                </span>
                                <span
                                  style={{ fontSize: "12px", color: "#888" }}
                                >
                                  {p.jepum_cd}
                                </span>
                              </div>
                            ))
                          ) : (
                            <Empty
                              description="검색 결과 없음"
                              style={{ padding: "40px 0" }}
                            />
                          )}
                        </div>
                      </Modal>
                    </>
                  )}
                </div>

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

                <div style={{ gridArea: "qty" }}>
                  <Form.Item
                    label="📊 생산수량"
                    name="amt"
                    rules={[{ required: true }]}
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

                <div
                  style={{
                    gridArea: "btn",
                    display: "flex",
                    gap: "10px",
                    position: "sticky",
                    bottom: 0,
                    //zIndex: 100, 메뉴를 열면 얘만 둥둥떠댕겨서 주석
                    backgroundColor: "#fff",
                    paddingTop: "10px",
                    paddingBottom: "10px",
                    borderTop: "1px solid #f0f0f0",
                  }}
                >
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
          </Tabs.TabPane>

          {/* 탭 2: 생산 조회 및 관리 */}
          <Tabs.TabPane tab="조회/수정" key="2">
            <style>
              {`
                .centered-range-picker .ant-picker-input > input {
                  text-align: center;
                }
              `}
            </style>

            <div
              style={{
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                flexWrap: "wrap",
                backgroundColor: "#f9f9f9",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              <span style={{ fontWeight: "bold" }}>조회기간:</span>
              <RangePicker
                className="centered-range-picker"
                value={searchRange}
                onChange={(dates) => setSearchRange(dates)}
                allowClear={false}
                format="YYYY-MM-DD"
                style={{
                  width: isTablet ? "auto" : "100%",
                  minWidth: "220px",
                }}
              />
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={fetchHistory}
              >
                조회
              </Button>
            </div>

            <Table
              dataSource={historyList}
              columns={columns}
              rowKey="segsan_cd"
              pagination={{
                position: ["bottomCenter"],
                showSizeChanger: true,
                pageSizeOptions: ["5", "10", "20", "50", "100"],
                defaultPageSize: 5,
              }}
              scroll={{
                x: 400,
                y: "calc(100vh - 420px)",
              }}
            />

            <Modal
              title="생산실적 수정"
              open={isModalOpen}
              onOk={handleUpdate}
              onCancel={() => setIsModalOpen(false)}
            >
              {editRecord && (
                <div>
                  <p>
                    <strong>제품명:</strong> {editRecord.jepum_nm}
                  </p>
                  <p>
                    <strong>날짜:</strong> {editRecord.segsan_dt}
                  </p>
                  <div style={{ marginTop: 15 }}>
                    <span style={{ display: "block", marginBottom: 5 }}>
                      수량 수정:
                    </span>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Button
                        onClick={handleEditMinus}
                        icon={<MinusOutlined />}
                        size="large"
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "8px 0 0 8px",
                        }}
                      />
                      <InputNumber
                        value={editAmt}
                        onChange={(val) => setEditAmt(val)}
                        min={1}
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
                      />
                      <Button
                        type="primary"
                        onClick={handleEditPlus}
                        icon={<PlusOutlined />}
                        size="large"
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "0 8px 8px 0",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Modal>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SegsanRegister;
