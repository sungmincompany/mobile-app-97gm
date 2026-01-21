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
  Tabs,
  Table,
  Modal,
  Tag,
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
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { DB_SCHEMA } from "../config";

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

const ChulhaRegister = () => {
  // ================= 공통 상태 =================
  const screens = useBreakpoint();
  const isTablet = !!screens.md; // md(768px) 이상이면 태블릿/PC
  const v_db = DB_SCHEMA;
  const [activeTab, setActiveTab] = useState("1");

  // ================= 탭 1: 등록용 상태 =================
  const [form] = Form.useForm();

  // 1. 제품 관련 상태 (카드 UI용 필터링 상태 포함)
  const [productList, setProductList] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductName, setSelectedProductName] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");

  // ✅ [추가] 모바일 제품 선택 모달 상태
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // 2. 거래처(Vender) 관련 상태
  const [venderList, setVenderList] = useState([]);
  const [filteredVenders, setFilteredVenders] = useState([]);
  const [selectedVender, setSelectedVender] = useState(null);
  const [selectedVenderName, setSelectedVenderName] = useState("");
  const [venderSearchTerm, setVenderSearchTerm] = useState("");

  // ✅ [추가] 모바일 거래처 선택 모달 상태
  const [isVenderModalOpen, setIsVenderModalOpen] = useState(false);

  // 3. 수량 및 기타 상태
  const [quantity, setQuantity] = useState(1);

  // ================= 탭 2: 조회용 상태 =================
  const [historyList, setHistoryList] = useState([]);
  const [searchRange, setSearchRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editAmt, setEditAmt] = useState(0);
  const [editBigo, setEditBigo] = useState("");

  // ================= 초기 데이터 로드 =================
  useEffect(() => {
    // 1. 제품 목록 조회
    fetch(`/api/97gm/jepum/line?v_db=${v_db}`)
      .then((res) => res.json())
      .then((data) => {
        setProductList(data);
        setFilteredProducts(data); // 카드 UI용 초기화
      })
      .catch((err) => console.error("제품 로드 실패:", err));

    // 2. 거래처(Vender) 목록 조회
    fetch(`/api/common/vender?v_db=${v_db}&tab_gbn_cd=01`)
      .then((res) => res.json())
      .then((data) => {
        setVenderList(data);
        setFilteredVenders(data); // 카드 UI용 초기화
      })
      .catch((err) => console.error("거래처 로드 실패:", err));
  }, [v_db]);

  // 조회 탭 진입 시 목록 조회
  useEffect(() => {
    if (activeTab === "2") {
      fetchHistory();
    }
  }, [activeTab, searchRange]);

  // ================= 기능 함수들 =================

  // 출하 내역 조회
  const fetchHistory = () => {
    if (!searchRange || searchRange.length !== 2) return;
    const fromDt = searchRange[0].format("YYYYMMDD");
    const toDt = searchRange[1].format("YYYYMMDD");

    fetch(`/api/chulha/list?v_db=${v_db}&from_dt=${fromDt}&to_dt=${toDt}`)
      .then((res) => res.json())
      .then((data) => setHistoryList(data))
      .catch((err) => message.error("조회 실패"));
  };

  // --- [공통] 제품 검색 및 선택 (모달/카드 공용) ---
  const handleProductSearch = (e) => {
    const keyword = e.target.value;
    setProductSearchTerm(keyword);
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

  // --- [공통] 거래처 검색 및 선택 (모달/카드 공용) ---
  const handleVenderSearch = (e) => {
    const keyword = e.target.value;
    setVenderSearchTerm(keyword);
    const keywordLower = keyword.toLowerCase();
    const filtered = venderList.filter(
      (v) =>
        v.vender_nm.toLowerCase().includes(keywordLower) ||
        v.vender_cd.toLowerCase().includes(keywordLower),
    );
    setFilteredVenders(filtered);
  };

  const handleVenderSelectCard = (v) => {
    setSelectedVender(v.vender_cd);
    setSelectedVenderName(v.vender_nm);
    form.setFieldsValue({ vender_cd: v.vender_cd });
  };

  // --- 수량 조절 ---
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

  // --- 초기화 ---
  const handleReset = () => {
    form.resetFields();
    form.setFieldsValue({ chulha_dt: dayjs(), amt: 1 });

    setQuantity(1);

    setSelectedProduct(null);
    setSelectedProductName("");
    setProductSearchTerm("");
    setFilteredProducts(productList);

    setSelectedVender(null);
    setSelectedVenderName("");
    setVenderSearchTerm("");
    setFilteredVenders(venderList);

    message.info("초기화되었습니다.");
  };

  // --- 등록 (Submit) ---
  const onFinish = async (values) => {
    if (!values.jepum_cd) return message.error("제품을 선택해주세요!");
    if (!values.vender_cd) return message.error("거래처를 선택해주세요!");

    try {
      const payload = {
        chulha_dt: values.chulha_dt.format("YYYYMMDD"),
        jepum_cd: values.jepum_cd,
        vender_cd: values.vender_cd,
        amt: values.amt,
        bigo: values.bigo || "",
      };

      const response = await fetch(`/api/chulha/insert?v_db=${v_db}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resData = await response.json();

      if (response.ok) {
        message.success(`출하 등록 성공! (번호: ${resData.chulha_cd})`);
        handleReset();
      } else {
        message.error(`등록 실패: ${resData.error}`);
      }
    } catch (error) {
      message.error("서버 통신 오류");
    }
  };

  // ================= 탭 2 기능 (삭제/수정) =================
  const handleDelete = (record) => {
    Modal.confirm({
      title: "삭제하시겠습니까?",
      content: `${record.jepum_nm} / ${record.vender_nm} (${record.amt}개)`,
      okText: "삭제",
      okType: "danger",
      cancelText: "취소",
      onOk: async () => {
        try {
          const res = await fetch(
            `/api/chulha/delete?v_db=${v_db}&chulha_cd=${record.chulha_cd}`,
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
    setEditBigo(record.bigo || "");
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`/api/chulha/update?v_db=${v_db}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chulha_cd: editRecord.chulha_cd,
          amt: editAmt,
          bigo: editBigo,
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

  // 조회 테이블 컬럼
  const columns = [
    {
      title: "날짜",
      dataIndex: "chulha_dt",
      key: "chulha_dt",
      render: (text) =>
        text && `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`,
      width: 100,
      align: "center",
      sorter: (a, b) => a.chulha_dt.localeCompare(b.chulha_dt),
    },
    {
      title: "거래처",
      dataIndex: "vender_nm",
      key: "vender_nm",
      width: 120,
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
      render: (val) => (
        <span style={{ fontWeight: "bold", color: "#1890ff" }}>{val}</span>
      ),
    },
    {
      title: "비고",
      dataIndex: "bigo",
      key: "bigo",
      ellipsis: true,
    },
    {
      title: "관리",
      key: "action",
      width: 90,
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

  // ================= 스타일 & 렌더링 =================
  const selectionContainerStyle = {
    display: "flex",
    flexDirection: isTablet ? "row" : "column",
    gap: "15px",
    height: isTablet ? "450px" : "auto",
  };

  const productSectionStyle = {
    flex: 2,
    display: "flex",
    flexDirection: "column",
    border: "1px solid #d9d9d9",
    borderRadius: "8px",
    padding: "10px",
    backgroundColor: "#fff",
  };

  const customerSectionStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    border: "1px solid #d9d9d9",
    borderRadius: "8px",
    padding: "10px",
    backgroundColor: "#fff",
  };

  const scrollableListStyle = {
    flex: 1,
    overflowY: "auto",
    paddingRight: "5px",
    marginTop: "10px",
  };

  const productGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: "10px",
  };

  const customerGridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "8px",
  };

  return (
    <div style={{ padding: "10px", maxWidth: "1200px", margin: "0 auto" }}>
      <Card
        title={
          <span>
            <ShopOutlined /> 출하(판매) 등록
          </span>
        }
        bordered={true}
        style={{
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
          {/* ================= 탭 1: 출하 등록 ================= */}
          <Tabs.TabPane tab="출하 등록" key="1">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{ chulha_dt: dayjs(), amt: 1 }}
            >
              <Form.Item
                label="📅 출하일자"
                name="chulha_dt"
                rules={[{ required: true, message: "날짜를 선택하세요" }]}
                style={{ marginBottom: "15px" }}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                  size="large"
                />
              </Form.Item>

              <div style={{ marginBottom: "15px" }}>
                <div
                  style={{
                    marginBottom: "5px",
                    fontWeight: "bold",
                    color: "#555",
                  }}
                >
                  📦 제품 및 거래처 선택
                </div>

                {/* [중요] 모바일 vs 태블릿 분기 처리 */}
                {!isTablet ? (
                  // === [모바일 View] 모달 방식 ===
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "15px",
                    }}
                  >
                    {/* 1. 제품 선택 Input (Modal Trigger) */}
                    <Form.Item
                      label="📦 제품 선택"
                      required
                      tooltip="클릭하여 제품을 선택하세요"
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        readOnly
                        size="large"
                        value={selectedProductName}
                        placeholder="제품을 선택해 주세요"
                        onClick={() => setIsProductModalOpen(true)}
                        suffix={<SearchOutlined />}
                      />
                    </Form.Item>
                    {/* 실제 Form 전송용 히든 필드 */}
                    <Form.Item
                      name="jepum_cd"
                      style={{ display: "none" }}
                      rules={[
                        { required: true, message: "제품을 선택해주세요" },
                      ]}
                    >
                      <Input />
                    </Form.Item>

                    {/* 2. 거래처 선택 Input (Modal Trigger) */}
                    <Form.Item
                      label="🏢 거래처 선택"
                      required
                      tooltip="클릭하여 거래처를 선택하세요"
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        readOnly
                        size="large"
                        value={selectedVenderName}
                        placeholder="거래처를 선택해 주세요"
                        onClick={() => setIsVenderModalOpen(true)}
                        suffix={<SearchOutlined />}
                      />
                    </Form.Item>
                    {/* 실제 Form 전송용 히든 필드 */}
                    <Form.Item
                      name="vender_cd"
                      style={{ display: "none" }}
                      rules={[
                        { required: true, message: "거래처를 선택해주세요" },
                      ]}
                    >
                      <Input />
                    </Form.Item>

                    {/* --- 제품 선택 모달 --- */}
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
                          value={productSearchTerm}
                          onChange={handleProductSearch}
                        />
                      </div>
                      <div style={{ height: "60vh", overflowY: "auto" }}>
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((p) => (
                            <div
                              key={p.jepum_cd}
                              onClick={() => {
                                handleProductSelectCard(p);
                                setIsProductModalOpen(false);
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
                                style={{ fontSize: "15px", fontWeight: "bold" }}
                              >
                                {p.jepum_nm}
                              </span>
                              <span style={{ fontSize: "12px", color: "#888" }}>
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

                    {/* --- 거래처 선택 모달 --- */}
                    <Modal
                      title="거래처 선택"
                      open={isVenderModalOpen}
                      onCancel={() => setIsVenderModalOpen(false)}
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
                          placeholder="거래처명 또는 코드 검색"
                          prefix={<SearchOutlined />}
                          size="large"
                          value={venderSearchTerm}
                          onChange={handleVenderSearch}
                        />
                      </div>
                      <div style={{ height: "60vh", overflowY: "auto" }}>
                        {filteredVenders.length > 0 ? (
                          filteredVenders.map((v) => (
                            <div
                              key={v.vender_cd}
                              onClick={() => {
                                handleVenderSelectCard(v);
                                setIsVenderModalOpen(false);
                              }}
                              style={{
                                padding: "15px 20px",
                                borderBottom: "1px solid #f0f0f0",
                                cursor: "pointer",
                                backgroundColor:
                                  selectedVender === v.vender_cd
                                    ? "#f6ffed"
                                    : "#fff",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{ fontSize: "15px", fontWeight: "bold" }}
                              >
                                {v.vender_nm}
                              </span>
                              <span style={{ fontSize: "12px", color: "#888" }}>
                                {v.vender_cd}
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
                  </div>
                ) : (
                  // === [태블릿/PC View] 카드 그리드 UI (기존 코드 유지) ===
                  <div style={selectionContainerStyle}>
                    {/* (좌측) 제품 선택 */}
                    <div style={productSectionStyle}>
                      <div
                        style={{
                          fontWeight: "bold",
                          marginBottom: "5px",
                          textAlign: "center",
                        }}
                      >
                        제품 목록
                      </div>
                      <Input
                        placeholder="제품 검색..."
                        prefix={<SearchOutlined />}
                        value={productSearchTerm}
                        onChange={handleProductSearch}
                      />
                      <Form.Item name="jepum_cd" style={{ display: "none" }}>
                        <Input />
                      </Form.Item>

                      <div style={scrollableListStyle}>
                        {filteredProducts.length > 0 ? (
                          <div style={productGridStyle}>
                            {filteredProducts.map((p) => {
                              const isSelected = selectedProduct === p.jepum_cd;
                              return (
                                <div
                                  key={p.jepum_cd}
                                  onClick={() => handleProductSelectCard(p)}
                                  style={{
                                    cursor: "pointer",
                                    border: isSelected
                                      ? "2px solid #1890ff"
                                      : "1px solid #f0f0f0",
                                    backgroundColor: isSelected
                                      ? "#e6f7ff"
                                      : "#fafafa",
                                    borderRadius: "8px",
                                    padding: "10px",
                                    textAlign: "center",
                                    position: "relative",
                                    transition: "all 0.2s",
                                    height: "80px",
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
                                        top: "5px",
                                        right: "5px",
                                        color: "#1890ff",
                                        fontSize: "16px",
                                      }}
                                    />
                                  )}
                                  <div
                                    style={{
                                      fontWeight: "bold",
                                      fontSize: "14px",
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
                                      marginTop: "4px",
                                    }}
                                  >
                                    {p.jepum_cd}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <Empty
                            description="제품 없음"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                          />
                        )}
                      </div>
                    </div>

                    {/* (우측) 거래처(Vender) 선택 */}
                    <div style={customerSectionStyle}>
                      <div
                        style={{
                          fontWeight: "bold",
                          marginBottom: "5px",
                          textAlign: "center",
                        }}
                      >
                        거래처 목록
                      </div>
                      <Input
                        placeholder="거래처 검색..."
                        prefix={<UserOutlined />}
                        value={venderSearchTerm}
                        onChange={handleVenderSearch}
                      />
                      <Form.Item name="vender_cd" style={{ display: "none" }}>
                        <Input />
                      </Form.Item>

                      <div style={scrollableListStyle}>
                        {filteredVenders.length > 0 ? (
                          <div style={customerGridStyle}>
                            {filteredVenders.map((v) => {
                              const isSelected = selectedVender === v.vender_cd;
                              return (
                                <div
                                  key={v.vender_cd}
                                  onClick={() => handleVenderSelectCard(v)}
                                  style={{
                                    cursor: "pointer",
                                    border: isSelected
                                      ? "2px solid #52c41a"
                                      : "1px solid #f0f0f0",
                                    backgroundColor: isSelected
                                      ? "#f6ffed"
                                      : "#fafafa",
                                    borderRadius: "6px",
                                    padding: "10px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    transition: "all 0.2s",
                                  }}
                                >
                                  <div>
                                    <div
                                      style={{
                                        fontWeight: "bold",
                                        fontSize: "14px",
                                      }}
                                    >
                                      {v.vender_nm}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "11px",
                                        color: "#888",
                                      }}
                                    >
                                      {v.vender_cd}
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <CheckCircleFilled
                                      style={{
                                        color: "#52c41a",
                                        fontSize: "16px",
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <Empty
                            description="거래처 없음"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 선택된 정보 요약 (태블릿에서만 표시) */}
              {isTablet && (selectedProductName || selectedVenderName) && (
                <div
                  style={{
                    marginBottom: "15px",
                    padding: "10px",
                    background: "#f9f9f9",
                    borderRadius: "8px",
                    border: "1px dashed #ccc",
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span>선택: </span>
                  {selectedProductName ? (
                    <Tag color="blue">{selectedProductName}</Tag>
                  ) : (
                    <span style={{ color: "#ccc" }}>제품미선택</span>
                  )}
                  <span>+</span>
                  {selectedVenderName ? (
                    <Tag color="green">{selectedVenderName}</Tag>
                  ) : (
                    <span style={{ color: "#ccc" }}>거래처미선택</span>
                  )}
                </div>
              )}

              {/* 수량 및 비고 */}
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  flexDirection: isTablet ? "row" : "column",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Form.Item
                    label="📊 출하수량"
                    name="amt"
                    rules={[{ required: true, message: "수량을 입력하세요" }]}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Button
                        onClick={handleMinus}
                        icon={<MinusOutlined />}
                        size="large"
                        style={{ width: "45px", height: "40px" }}
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
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          fontWeight: "bold",
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
                        style={{ width: "45px", height: "40px" }}
                      />
                    </div>
                  </Form.Item>
                </div>
                <div style={{ flex: 2 }}>
                  <Form.Item label="📝 비고 (기타)" name="bigo">
                    <Input placeholder="특이사항 입력 (선택)" size="large" />
                  </Form.Item>
                </div>
              </div>

              {/* 하단 버튼 */}
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  gap: "10px",
                  borderTop: "1px solid #f0f0f0",
                  paddingTop: "15px",
                }}
              >
                <Button
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                  style={{ flex: 1, height: "50px" }}
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
                  출하 등록
                </Button>
              </div>
            </Form>
          </Tabs.TabPane>

          {/* ================= 탭 2: 조회 및 수정 (변동 없음) ================= */}
          <Tabs.TabPane tab="조회/수정" key="2">
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                backgroundColor: "#f9f9f9",
                padding: "15px",
                borderRadius: "8px",
                flexWrap: "wrap",
              }}
            >
              <RangePicker
                value={searchRange}
                onChange={(dates) => setSearchRange(dates)}
                allowClear={false}
                format="YYYY-MM-DD"
                style={{ width: isTablet ? "auto" : "100%" }}
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
              rowKey="chulha_cd"
              pagination={{ pageSize: 5 }}
              scroll={{ x: 500, y: "calc(100vh - 420px)" }}
              size="middle"
            />

            <Modal
              title="출하정보 수정"
              open={isModalOpen}
              onOk={handleUpdate}
              onCancel={() => setIsModalOpen(false)}
            >
              {editRecord && (
                <div>
                  <div
                    style={{
                      marginBottom: 15,
                      background: "#f5f5f5",
                      padding: "10px",
                      borderRadius: "5px",
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      <strong>제품:</strong> {editRecord.jepum_nm}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>거래처:</strong> {editRecord.vender_nm}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>날짜:</strong> {editRecord.chulha_dt}
                    </p>
                  </div>

                  <div style={{ marginBottom: 15 }}>
                    <span style={{ display: "block", marginBottom: 5 }}>
                      수량 수정:
                    </span>
                    <InputNumber
                      value={editAmt}
                      onChange={(val) => setEditAmt(val)}
                      min={1}
                      style={{ width: "100%" }}
                      size="large"
                    />
                  </div>
                  <div>
                    <span style={{ display: "block", marginBottom: 5 }}>
                      비고 수정:
                    </span>
                    <TextArea
                      rows={2}
                      value={editBigo}
                      onChange={(e) => setEditBigo(e.target.value)}
                    />
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

export default ChulhaRegister;
