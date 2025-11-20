import React, { useState, useEffect } from "react";
import {
  Tabs,
  Form,
  Input,
  InputNumber,
  Button,
  DatePicker,
  message,
  Row,
  Col,
  Table,
  Modal,
  Select,
} from "antd";
import dayjs from "dayjs"; // moment 대신 dayjs 사용
import { DB_SCHEMA } from "../config";

const { Option } = Select;
const { confirm } = Modal;

const StockOutResult = () => {
  /****************************************************************
   * 1) Form, State 초기화
   ****************************************************************/
  const [form] = Form.useForm();

  //  제품 목록 상태
  const [productList, setProductList] = useState([]);

  // 조회된 출고 목록
  const [stockOuts, setStockOuts] = useState([]);

  // 날짜 검색용 상태 (dayjs 사용)
  const [fromDt, setFromDt] = useState(dayjs().startOf("month")); // 현재 달의 1일
  const [toDt, setToDt] = useState(dayjs()); // 오늘

  // 등록/수정 구분 상태
  const [editingRecord, setEditingRecord] = useState(null);
  const [activeTab, setActiveTab] = useState("1"); // 1=등록, 2=조회

  // 수량 상태
  const [quantity, setQuantity] = useState(1);

  const v_db = DB_SCHEMA;

  /****************************************************************
   * 2) 거래처, 제품 목록 불러오기
   ****************************************************************/
  useEffect(() => {
    // 제품(완제품) 목록
    fetch(`/api/select/jepum/jepum?v_db=${v_db}`)
      .then((res) => res.json())
      .then((data) => setProductList(data))
      .catch((err) => console.error("제품 목록 에러:", err));
  }, [v_db]);

  /****************************************************************
   * 3) 출고 목록 조회 (select.py > jepum-out)
   *    ?from_dt=YYYYMMDD & to_dt=YYYYMMDD
   ****************************************************************/
  const fetchStockOuts = async (startDate, endDate) => {
    try {
      // dayjs -> YYYYMMDD 변환
      const fromParam = startDate ? startDate.format("YYYYMMDD") : "19990101";
      const toParam = endDate ? endDate.format("YYYYMMDD") : "20991231";

      const res = await fetch(
        `/api/select/stock/jepum-out?v_db=${v_db}&from_dt=${fromParam}&to_dt=${toParam}`
      );
      if (!res.ok) throw new Error("출고내역 조회 오류");
      const data = await res.json();

      // 날짜 가공: "YYYYMMDD" -> "YYYY-MM-DD"
      data.forEach((item) => {
        if (item.inout_dt && item.inout_dt.length === 8) {
          // 1) "20250314" -> "2025-03-14"
          item.inout_dt = item.inout_dt.replace(
            /(\d{4})(\d{2})(\d{2})/,
            (_, y, m, d) => `${y}-${m}-${d}`
          );
        }
      });

      setStockOuts(data);
    } catch (err) {
      console.error("fetchStockOuts 에러:", err);
      message.error("출고내역 조회 중 오류가 발생했습니다.");
    }
  };

  // 화면 최초 로드 및 날짜 변경 시 재조회
  useEffect(() => {
    fetchStockOuts(fromDt, toDt);
  }, [fromDt, toDt]);

  /****************************************************************
   * 4) 등록/수정 처리
   *    insert.py > stock_insert_bp / update.py > stock_update_bp
   ****************************************************************/
  const onFinish = async (values) => {
    try {
      // inout_dt를 dayjs 객체로부터 "YYYY-MM-DD" 포맷 문자열로 추출
      const inout_dt = values.inout_dt
        ? values.inout_dt.format("YYYY-MM-DD")
        : null;

      // 등록/수정에 공통으로 필요한 body
      const bodyPayload = {
        inout_dt,
        jepum_cd: values.jepum_cd,

        confirm_amt: values.confirm_amt,
        bigo: values.bigo || "",
      };

      if (!editingRecord) {
        // 신규 등록
        const response = await fetch(`/api/insert/stock/out?v_db=${v_db}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
        });
        const resData = await response.json();
        if (resData.error) {
          message.error(`출고등록 실패: ${resData.error}`);
        } else {
          message.success("출고등록 성공!");
          // 등록 후 목록 재조회
          fetchStockOuts(fromDt, toDt);
          // 폼 리셋
          form.resetFields();
          setQuantity(1);
          // 조회 탭으로 이동
          setActiveTab("2");
        }
      } else {
        // 수정 모드 (PUT)
        const updatePayload = {
          ...bodyPayload,
          inout_no: editingRecord.inout_no,
        };
        const response = await fetch(`/api/update/stock/update?v_db=${v_db}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });
        const resData = await response.json();
        if (resData.error) {
          message.error(`출고 수정 실패: ${resData.error}`);
        } else {
          message.success("출고 수정 성공!");
          fetchStockOuts(fromDt, toDt);
          form.resetFields();
          setEditingRecord(null);
          setQuantity(1);
          setActiveTab("2");
        }
      }
    } catch (error) {
      console.error("onFinish 에러:", error);
      message.error("출고 등록/수정 중 오류가 발생했습니다.");
    }
  };

  // 폼 유효성 실패 시
  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
    message.error("모든 항목을 올바르게 입력해주세요!");
  };

  /****************************************************************
   * 5) 수정/삭제
   ****************************************************************/
  const handleEdit = (record) => {
    setEditingRecord(record);
    setQuantity(record.confirm_amt);

    // 기존 출고일자(inout_dt)는 "YYYY-MM-DD"
    // DatePicker에는 "YYYY-MM-DD" 형식으로 파싱
    const dateObj = record.inout_dt
      ? dayjs(record.inout_dt, "YYYY-MM-DD")
      : null;

    form.setFieldsValue({
      inout_dt: dateObj,
      jepum_cd: record.jepum_cd,

      confirm_amt: record.confirm_amt,
      bigo: record.bigo,
    });
    setActiveTab("1");
  };

  const handleDelete = (record) => {
    confirm({
      title: "이 출고 이력을 삭제하시겠습니까?",
      okText: "예",
      cancelText: "아니오",
      onOk: async () => {
        try {
          const url = `/api/delete/stock/delete?inout_no=${record.inout_no}&v_db=${v_db}`;
          const res = await fetch(url, { method: "DELETE" });
          const resData = await res.json();
          if (resData.error) {
            message.error(`출고 삭제 실패: ${resData.error}`);
          } else {
            message.success("출고 삭제 성공!");
            fetchStockOuts(fromDt, toDt);
          }
        } catch (err) {
          console.error("출고 삭제 에러:", err);
          message.error("출고 삭제 중 오류가 발생했습니다.");
        }
      },
    });
  };

  /****************************************************************
   * 6) 수량 증가/감소 함수
   ****************************************************************/
  const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
    form.setFieldsValue({ confirm_amt: quantity + 1 });
  };
  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
      form.setFieldsValue({ confirm_amt: quantity - 1 });
    }
  };

  /****************************************************************
   * 7) 테이블 컬럼 정의
   ****************************************************************/
  const columns = [
    {
      title: "출고일자",
      dataIndex: "inout_dt",
      key: "inout_dt",
      align: "center",
      width: 80,
      // 여기서 테이블에 보일 때만 'YY-MM-DD' 로 표시
      render: (text) => {
        // text는 'YYYY-MM-DD' 형식
        if (!text) return "";
        const parts = text.split("-"); // ['2025','03','14']
        if (parts.length === 3) {
          return parts[0].slice(2) + "-" + parts[1] + "-" + parts[2];
          // 예: '25-03-14'
        }
        return text;
      },
    },

    {
      title: "제품",
      dataIndex: "jepum_nm",
      key: "jepum_nm",
      align: "center",
    },
    {
      title: "수량",
      dataIndex: "confirm_amt",
      key: "confirm_amt",
      align: "center",
      width: 60,
    },
    {
      title: "작업",
      key: "action",
      align: "center",
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            수정
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record)}>
            삭제
          </Button>
        </>
      ),
    },
  ];

  /****************************************************************
   * 8) 화면 렌더링
   ****************************************************************/
  return (
    <div style={{ padding: 16 }}>
      <h2>출고결과등록</h2>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* 등록 탭 */}
        <Tabs.TabPane tab="등록" key="1">
          <Form
            form={form}
            name="stock_out_form"
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            initialValues={{ confirm_amt: 1 }}
            style={{ maxWidth: 600 }}
          >
            {/* 출고일자 (YYYY-MM-DD 포맷) */}
            <Form.Item
              label="출고일자"
              name="inout_dt"
              rules={[{ required: true, message: "출고일자를 선택하세요." }]}
            >
              <DatePicker
                placeholder="출고일자를 선택하세요."
                style={{ width: "100%" }}
                // 등록/수정 시에는 YYYY-MM-DD 형식 사용
                format="YYYY-MM-DD"
              />
            </Form.Item>

            {/* 제품 선택 */}
            <Form.Item
              label="제품"
              name="jepum_cd"
              rules={[{ required: true, message: "제품을 선택하세요." }]}
            >
              <Select
                showSearch
                placeholder="제품 검색"
                optionFilterProp="children"
                filterOption={(input, option) => {
                  const label = (option?.children ?? "")
                    .toString()
                    .toLowerCase();
                  return label.includes(input.toLowerCase());
                }}
              >
                {productList.map((p) => (
                  <Option key={p.jepum_cd} value={p.jepum_cd}>
                    {p.jepum_nm} ({p.jepum_cd})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* 수량 (+/-) */}
            <Form.Item
              label="수량"
              name="confirm_amt"
              rules={[
                { required: true, message: "수량을 입력하세요. (최소1)" },
              ]}
            >
              <Row gutter={8}>
                <Col flex="auto">
                  <InputNumber
                    min={1}
                    value={quantity}
                    onChange={(val) => {
                      setQuantity(val);
                      form.setFieldsValue({ confirm_amt: val });
                    }}
                    style={{ width: "100%" }}
                  />
                </Col>
                <Col>
                  <Button onClick={handleIncrease}>+</Button>
                  <Button onClick={handleDecrease} style={{ marginLeft: 4 }}>
                    -
                  </Button>
                </Col>
              </Row>
            </Form.Item>

            {/* 비고 */}
            <Form.Item label="비고" name="bigo">
              <Input.TextArea rows={3} placeholder="비고 입력 (선택)" />
            </Form.Item>

            {/* 등록/수정 버튼 */}
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                {editingRecord ? "출고 수정하기" : "출고 등록"}
              </Button>
            </Form.Item>
          </Form>
        </Tabs.TabPane>

        {/* 조회 탭 */}
        <Tabs.TabPane tab="조회" key="2">
          <div style={{ marginBottom: 16 }}>
            <h3>출고결과 조회</h3>
            {/* 기간검색 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <DatePicker
                value={fromDt}
                onChange={(val) => setFromDt(val)}
                format="YYYY-MM-DD"
              />
              <span>~</span>
              <DatePicker
                value={toDt}
                onChange={(val) => setToDt(val)}
                format="YYYY-MM-DD"
              />
            </div>
          </div>
          <Table
            dataSource={stockOuts.map((o, idx) => ({ ...o, key: idx }))}
            columns={columns}
            pagination={{ pageSize: 5 }}
            style={{ marginTop: 16 }}
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default StockOutResult;
