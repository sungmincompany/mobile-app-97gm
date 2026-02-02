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
  LeftOutlined,
  RightOutlined,
  AppstoreOutlined,
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
  const [form] = Form.useForm();

  // ================= 데이터 상태 =================
  const [productList, setProductList] = useState([]); // 전체 데이터 (부모+자식)
  const [filteredProducts, setFilteredProducts] = useState([]); // 화면 표시용 (부모만)

  const [quantity, setQuantity] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductName, setSelectedProductName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // 모바일/하위 제품 모달 상태
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSubProductModalOpen, setIsSubProductModalOpen] = useState(false);
  const [subProducts, setSubProducts] = useState([]);
  const [parentProductName, setParentProductName] = useState("");

  // 조회 탭 상태
  const [historyList, setHistoryList] = useState([]);
  const [searchRange, setSearchRange] = useState([dayjs(), dayjs()]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editAmt, setEditAmt] = useState(0);

  // 1. 초기 데이터 로드 (API 호출)
  useEffect(() => {
    fetch(`/api/97gm/jepum/line?v_db=${v_db}`)
      .then((res) => res.json())
      .then((data) => {
        setProductList(data); // 전체 데이터 저장

        // ✅ [수정] pum_gbn을 사용하여 '4'번(부모) 제품만 필터링
        const parents = data.filter((p) => p.pum_gbn === "4");
        setFilteredProducts(parents);
      })
      .catch((err) => console.error(err));
  }, [v_db]);

  // 2. 조회 탭 로직
  useEffect(() => {
    if (activeTab === "2") fetchHistory();
  }, [activeTab, searchRange]);

  const fetchHistory = () => {
    if (!searchRange || searchRange.length !== 2) return;
    const fromDt = searchRange[0].format("YYYYMMDD");
    const toDt = searchRange[1].format("YYYYMMDD");
    fetch(`/api/segsan/list?v_db=${v_db}&from_dt=${fromDt}&to_dt=${toDt}`)
      .then((res) => res.json())
      .then((data) => setHistoryList(data))
      .catch(() => message.error("조회 실패"));
  };

  // 3. 검색 핸들러 (pum_gbn 활용)
  const handleSearch = (e) => {
    const keyword = e.target.value;
    setSearchTerm(keyword);
    const keywordLower = keyword.toLowerCase();

    // 검색어가 없으면 다시 부모('4')만 보여줌
    if (!keyword) {
      setFilteredProducts(productList.filter((p) => p.pum_gbn === "4"));
      return;
    }

    // ✅ [수정] 부모('4') 중에서 검색
    const filtered = productList.filter(
      (p) =>
        p.pum_gbn === "4" &&
        (p.jepum_nm.toLowerCase().includes(keywordLower) ||
          p.jepum_cd.toLowerCase().includes(keywordLower)),
    );
    setFilteredProducts(filtered);
  };

  // 4. 제품 클릭 핸들러 (분기 처리)
  const handleProductClick = (item) => {
    // sub_cnt가 0보다 크면 자식이 있다는 뜻
    if (item.sub_cnt && item.sub_cnt > 0) {
      // 전체 목록에서 root_jepum_cd가 내 코드와 같은 것 찾기 (자식 찾기)
      const subs = productList.filter((p) => p.root_jepum_cd === item.jepum_cd);

      setSubProducts(subs);
      setParentProductName(item.jepum_nm);
      setIsSubProductModalOpen(true); // 자식 선택 모달 오픈
    } else {
      // 자식 없으면 바로 선택
      confirmProductSelection(item);
    }
  };

  const confirmProductSelection = (item) => {
    setSelectedProduct(item.jepum_cd);

    // DB 뷰에서 이름에 (갯수)를 붙여서 주므로, UI 표시용으로는 괄호 앞부분만 잘라서 쓸 수도 있음.
    // 하지만 현재 뷰가 '이름 (갯수)' 형태이므로 그대로 보여줘도 무방함.
    // 만약 순수 이름만 원한다면 item.jepum_nm.split(' (')[0] 처럼 가공 필요.
    // 여기서는 그대로 사용합니다.
    setSelectedProductName(item.jepum_nm);

    form.setFieldsValue({ jepum_cd: item.jepum_cd });

    setIsProductModalOpen(false);
    setIsSubProductModalOpen(false);
  };

  // ... (이하 핸들러 및 렌더링 코드는 기존과 동일) ...
  const handlePlus = () => {
    const currentVal = form.getFieldValue("amt") || 0;
    setQuantity(currentVal + 1);
    form.setFieldsValue({ amt: currentVal + 1 });
  };
  const handleMinus = () => {
    const currentVal = form.getFieldValue("amt") || 0;
    if (currentVal > 1) {
      setQuantity(currentVal - 1);
      form.setFieldsValue({ amt: currentVal - 1 });
    }
  };
  const handleReset = () => {
    form.resetFields();
    form.setFieldsValue({ segsan_dt: dayjs(), amt: 1 });
    setQuantity(1);
    setSelectedProduct(null);
    setSelectedProductName("");
    setSearchTerm("");
    // 리셋 시에도 pum_gbn 활용
    setFilteredProducts(productList.filter((p) => p.pum_gbn === "4"));
  };

  const handlePrevDate = () => {
    const current = form.getFieldValue("segsan_dt");
    if (current) form.setFieldsValue({ segsan_dt: current.subtract(1, "day") });
  };
  const handleNextDate = () => {
    const current = form.getFieldValue("segsan_dt");
    if (current) form.setFieldsValue({ segsan_dt: current.add(1, "day") });
  };

  // 날짜 조회 프리셋
  const setRangeToday = () => setSearchRange([dayjs(), dayjs()]);
  const setRangeWeek = () =>
    setSearchRange([dayjs().subtract(1, "week"), dayjs()]);
  const setRangeMonth = () =>
    setSearchRange([dayjs().subtract(1, "month"), dayjs()]);

  const onFinish = async (values) => {
    if (!values.jepum_cd) {
      message.error("제품 선택 필수");
      return;
    }
    try {
      const payload = {
        segsan_dt: values.segsan_dt.format("YYYYMMDD"),
        jepum_cd: values.jepum_cd,
        amt: values.amt,
      };
      const res = await fetch(`/api/segsan/insert?v_db=${v_db}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        message.success("등록 성공");
        handleReset();
      } else {
        message.error("실패: " + data.error);
      }
    } catch (e) {
      message.error("오류 발생");
    }
  };

  // 조회 탭 핸들러 생략 (기존 코드 유지)
  const handleEditPlus = () => setEditAmt((prev) => (prev || 0) + 1);
  const handleEditMinus = () =>
    setEditAmt((prev) => (prev > 1 ? prev - 1 : prev));
  const handleDelete = (record) => {
    confirm({
      title: "삭제하시겠습니까?",
      content: record.jepum_nm,
      okType: "danger",
      onOk: async () => {
        await fetch(
          `/api/segsan/delete?v_db=${v_db}&segsan_cd=${record.segsan_cd}`,
          { method: "DELETE" },
        );
        fetchHistory();
      },
    });
  };
  const openEditModal = (record) => {
    setEditRecord(record);
    setEditAmt(record.amt);
    setIsModalOpen(true);
  };
  const handleUpdate = async () => {
    await fetch(`/api/segsan/update?v_db=${v_db}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segsan_cd: editRecord.segsan_cd, amt: editAmt }),
    });
    setIsModalOpen(false);
    fetchHistory();
  };

  const columns = [
    {
      title: "날짜",
      dataIndex: "segsan_dt",
      render: (t) => t && `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`,
      width: 100,
      align: "center",
      sorter: (a, b) => a.segsan_dt.localeCompare(b.segsan_dt),
    },
    { title: "제품명", dataIndex: "jepum_nm" },
    { title: "수량", dataIndex: "amt", width: 70, align: "center" },
    {
      title: "관리",
      width: 100,
      align: "center",
      render: (_, r) => (
        <>
          {" "}
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditModal(r)}
            style={{ marginRight: 5 }}
          />{" "}
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(r)}
          />{" "}
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
          <Tabs.TabPane tab="등록" key="1">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{ segsan_dt: dayjs(), amt: 1 }}
            >
              <div style={gridContainerStyle}>
                <div style={{ gridArea: "date" }}>
                  <Form.Item label="📅 생산일자" required>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <Button
                        icon={<LeftOutlined />}
                        onClick={handlePrevDate}
                        size="large"
                      />
                      <Form.Item
                        name="segsan_dt"
                        noStyle
                        rules={[{ required: true }]}
                      >
                        <DatePicker
                          style={{ flex: 1 }}
                          format="YYYY-MM-DD"
                          size="large"
                          inputReadOnly
                          allowClear={false}
                        />
                      </Form.Item>
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
                                  onClick={() => handleProductClick(p)}
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
                                    height: "100px",
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
                                    style={{ fontSize: "11px", color: "#888" }}
                                  >
                                    {p.jepum_cd}
                                  </div>
                                  {p.sub_cnt > 0 && (
                                    <div
                                      style={{
                                        fontSize: "11px",
                                        color: "#1890ff",
                                        marginTop: "2px",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      <AppstoreOutlined /> 하위: {p.sub_cnt}개
                                    </div>
                                  )}
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
                    <>
                      <Form.Item label="📦 제품선택" required>
                        <Input
                          readOnly
                          size="large"
                          value={selectedProductName}
                          placeholder="제품을 선택해 주세요"
                          onClick={() => setIsProductModalOpen(true)}
                          suffix={<SearchOutlined />}
                        />
                      </Form.Item>
                      <Form.Item
                        name="jepum_cd"
                        style={{ display: "none" }}
                        rules={[{ required: true }]}
                      >
                        {" "}
                        <Input />{" "}
                      </Form.Item>

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
                            placeholder="제품명 검색"
                            prefix={<SearchOutlined />}
                            size="large"
                            value={searchTerm}
                            onChange={handleSearch}
                          />
                        </div>
                        <div style={{ height: "60vh", overflowY: "auto" }}>
                          {filteredProducts.map((p) => (
                            <div
                              key={p.jepum_cd}
                              onClick={() => handleProductClick(p)}
                              style={{
                                padding: "15px 20px",
                                borderBottom: "1px solid #f0f0f0",
                                cursor: "pointer",
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
                              <div style={{ textAlign: "right" }}>
                                <div
                                  style={{ fontSize: "12px", color: "#888" }}
                                >
                                  {p.jepum_cd}
                                </div>
                                {p.sub_cnt > 0 && (
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#1890ff",
                                    }}
                                  >
                                    <AppstoreOutlined /> 하위: {p.sub_cnt}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
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

          <Tabs.TabPane tab="조회/수정" key="2">
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "#f9f9f9",
                padding: "15px",
                borderRadius: "8px",
                flexWrap: "wrap",
              }}
            >
              <Button.Group>
                {" "}
                <Button onClick={setRangeToday}>오늘</Button>{" "}
                <Button onClick={setRangeWeek}>1주일</Button>{" "}
                <Button onClick={setRangeMonth}>1개월</Button>{" "}
              </Button.Group>
              <RangePicker
                value={searchRange}
                onChange={(d) => setSearchRange(d)}
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
              rowKey="segsan_cd"
              pagination={{ position: ["bottomCenter"], pageSize: 10 }}
              scroll={{ x: 400, y: "calc(100vh - 420px)" }}
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
                  <div
                    style={{
                      marginTop: 15,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Button
                      onClick={handleEditMinus}
                      icon={<MinusOutlined />}
                    />
                    <InputNumber
                      value={editAmt}
                      onChange={setEditAmt}
                      min={1}
                      style={{ margin: "0 10px", textAlign: "center" }}
                    />
                    <Button
                      type="primary"
                      onClick={handleEditPlus}
                      icon={<PlusOutlined />}
                    />
                  </div>
                </div>
              )}
            </Modal>
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* ✅ 하위 제품 선택 모달 */}
      <Modal
        title={
          <span>
            <AppstoreOutlined /> {parentProductName} - 상세 선택
          </span>
        }
        open={isSubProductModalOpen}
        onCancel={() => setIsSubProductModalOpen(false)}
        footer={null}
        centered
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {subProducts.map((sub) => (
            <div
              key={sub.jepum_cd}
              onClick={() => confirmProductSelection(sub)}
              style={{
                padding: "15px 20px",
                borderBottom: "1px solid #f0f0f0",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#fafafa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#fff")
              }
            >
              <span style={{ fontSize: "15px", fontWeight: "bold" }}>
                {sub.jepum_nm}
              </span>
              <span style={{ fontSize: "12px", color: "#888" }}>
                {sub.jepum_cd}
              </span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default SegsanRegister;
