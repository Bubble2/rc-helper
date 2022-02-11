import React, { useRef, useEffect } from 'react'
import { Form, Input, Button, Space } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import style from './setting.module.css';



// eslint-disable-next-line import/no-anonymous-default-export
export default () => {

    const onFinish = values => {
        console.log('Received values of form:', values);
        window.vscodeInstance.postMessage({
            command: 'settingData',
            settingData: values.users
        })
    };

    return (
        <div className={style["setting-container"]}>
            <Form name="dynamic_form_nest_item" onFinish={onFinish} autoComplete="off">
                <h3>组件目录地址设置错误或者未设置，请设置正确的组建目录地址</h3>
                <Form.List name="users" initialValue={[{
                    key: 'base',
                    name: 'base'
                }]}>
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }, index) => (
                                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                    <Form.Item
                                        {...restField}
                                        label={fields.length > 1 ? '组件类目' + (index + 1) : '组件'}
                                        name={[name, 'foldPath']}
                                        rules={[{ required: true, message: '组件类目文件夹地址不能为空！' }]}
                                    >
                                        <Input placeholder={fields.length > 1 ? "组件类目文件夹地址" : "组件文件夹地址"} />
                                    </Form.Item>
                                    {
                                        fields.length > 1 ? (
                                            <>
                                                <Form.Item
                                                    {...restField}
                                                    label={<></>}
                                                    colon={false}
                                                    name={[name, 'foldName']}
                                                    rules={[{ required: true, message: '组件类目名称不能为空！' }]}
                                                >
                                                    <Input placeholder="组件类目名称" />
                                                </Form.Item>
                                            </>
                                        ) : null
                                    }
                                    {
                                        index > 0 && <MinusCircleOutlined onClick={() => remove(name)} />
                                    }
                                </Space>
                            ))}
                            <Form.Item>
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    添加组件类目
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        提交
                    </Button>
                </Form.Item>
            </Form>
        </div>

    );
}